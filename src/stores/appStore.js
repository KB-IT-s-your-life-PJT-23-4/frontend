import { computed, nextTick, reactive, readonly, watch } from 'vue'
import { api, GIFT_STATUS } from '../api/apiAdapter'
import { initialState } from '../data/mockData'
import {
  deductionLimitFor,
  peerAverageGiftAmount,
  relationCode,
  relationLabel,
  renewalDisplay,
  toDotDate,
  toIsoDate,
} from '../utils/deduction'

// 데모 상태와 서버 연동 상태를 섞으면 목데이터 familyId가 DB 값과 충돌하므로 저장 키를 분리한다.
const STORAGE_KEY = api.isMock ? 'mirizoom-demo-state-v1' : 'mirizoom-status-state-v1'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

// 서류 정의(라벨/설명/툴팁/예시 이미지)는 코드가 원본이므로 저장된 상태로 덮어쓰지 않는다.
// 저장된 옛 상태에 남은 documents가 새 항목(tooltip, sampleImage)을 지워버리는 문제 방지.
const REFERENCE_KEYS = ['documents']

// 서버 연동 모드에서 DB가 원본인 값들. 목데이터 시드 대신 빈 값으로 시작해 syncStatus()로 채운다.
const SERVER_SOURCED_STATE = {
  families: [],
  plans: [],
  giftHistory: [],
  // 시뮬레이션 이력 API는 아직 없어 저장 시점부터 이 브라우저에 쌓인다. 목 시드는 쓰지 않는다.
  simulations: [],
  selectedFamilyId: null,
}

// 가족이 아직 없을 때(신규 가입/미로그인) 화면이 깨지지 않도록 쓰는 빈 수증자.
const EMPTY_FAMILY = {
  id: null,
  name: '수증자',
  relation: '',
  birthDate: '',
  peerAverageGiftAmount: 0,
  deductionLimit: 0,
  giftedAmount: 0,
  remainingDeduction: 0,
  resetDate: '미정',
  resetLabel: '증여 이력 없음',
  tone: 'blue',
  empty: true,
}

function defaultState() {
  const base = clone(initialState)
  return api.isMock ? base : { ...base, ...clone(SERVER_SOURCED_STATE) }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaultState()
    const merged = { ...defaultState(), ...JSON.parse(saved) }
    REFERENCE_KEYS.forEach((key) => {
      merged[key] = clone(initialState[key])
    })
    return merged
  } catch {
    return defaultState()
  }
}

const state = reactive(loadState())
const toast = reactive({ visible: false, message: '', type: 'success' })
let toastTimer

watch(
  state,
  (nextState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  },
  { deep: true },
)

const selectedFamily = computed(
  () =>
    state.families.find((family) => family.id === state.selectedFamilyId) ??
    state.families[0] ??
    EMPTY_FAMILY,
)

const unreadCount = computed(() => state.notifications.filter((item) => item.unread).length)

function showToast(message, type = 'success') {
  clearTimeout(toastTimer)
  toast.message = message
  toast.type = type
  toast.visible = true
  toastTimer = setTimeout(() => {
    toast.visible = false
  }, 2600)
}

function selectFamily(familyId) {
  state.selectedFamilyId = Number(familyId)
}

function deleteDemoFamily(familyId) {
  if (!api.isMock) return

  const numericFamilyId = Number(familyId)
  const hasGiftHistory = state.giftHistory.some((gift) => Number(gift.familyId) === numericFamilyId)
  const hasGiftPlan = state.plans.some((plan) => Number(plan.familyId) === numericFamilyId)

  if (hasGiftHistory || hasGiftPlan) {
    const error = new Error('증여 이력이 있는 수증자는 삭제할 수 없습니다.')
    error.status = 409
    error.code = 409
    throw error
  }

  state.families = state.families.filter((family) => Number(family.id) !== numericFamilyId)
  state.simulations = state.simulations.filter(
    (simulation) => Number(simulation.familyId) !== numericFamilyId,
  )

  if (Number(state.selectedFamilyId) === numericFamilyId) {
    state.selectedFamilyId = state.families[0]?.id ?? null
  }
}

async function addGift({ familyId, date, amount, memo = '현금' }) {
  const numericAmount = Number(amount)

  if (!api.isMock) {
    // 과거 이력은 이미 끝난 증여이므로 COMPLETED로 등록한다.
    await api.createGift({
      familyId: Number(familyId),
      amount: numericAmount,
      giftDate: toIsoDate(date),
      memo,
      status: GIFT_STATUS.COMPLETED,
    })
    await syncStatus()
    showToast('증여 이력이 추가됐어요.')
    return
  }

  state.giftHistory.unshift({
    id: Date.now(),
    familyId: Number(familyId),
    date,
    type: memo || '현금',
    amount: numericAmount,
    status: 'COMPLETED',
  })
  const family = state.families.find((item) => item.id === Number(familyId))
  if (family) family.giftedAmount += numericAmount
  showToast('증여 이력이 추가됐어요.')
}

async function savePlan(plan) {
  if (!api.isMock) {
    // 저장한 계획은 진행 중인 증여(PLANNED)로 DB에 남는다. 이후 화면은 syncStatus()가 채운다.
    // 호출부가 결과를 기다리지 않으므로 실패는 여기서 알린다.
    try {
      await api.createGift({
        familyId: Number(plan.familyId),
        amount: Number(plan.currentAmount || plan.amount),
        giftDate: toIsoDate(plan.giftDate),
        memo: plan.productName || plan.title || '진행 중인 증여',
        status: GIFT_STATUS.PLANNED,
      })
      await syncStatus()
    } catch (error) {
      showToast(error.message || '증여 계획을 저장하지 못했습니다.', 'info')
      return
    }
  } else {
    state.plans.unshift({ id: Date.now(), ...plan })
  }

  state.simulations.unshift({
    id: Date.now() + 1,
    familyId: plan.familyId,
    date: new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date())
      .replace(/\. /g, '.')
      .replace('.', ''),
    amount: plan.amount,
    tax: plan.tax ?? 0,
  })
  state.notifications.unshift({
    id: Date.now() + 2,
    group: '오늘',
    type: 'success',
    badge: '계획 저장',
    title: `${state.families.find((item) => item.id === plan.familyId)?.name ?? '가족'} 님의 증여 계획이 저장됐어요`,
    body: '증여 현황에서 일정과 준비 서류를 이어서 관리할 수 있어요.',
    time: '방금 전',
    unread: true,
  })
  showToast('증여 계획을 안전하게 저장했어요.')
}

async function deletePlan(planId) {
  const plan = state.plans.find((item) => item.id === planId)
  if (!api.isMock && plan?.source === 'server') {
    // 서버는 PLANNED 상태만 삭제를 허용한다(그 외 409 CONFLICT).
    await api.deleteGift(planId)
    await syncStatus()
  } else {
    state.plans = state.plans.filter((item) => item.id !== planId)
  }
  delete state.documentChecks[planId]
  showToast('증여 계획을 삭제했어요.', 'info')
}

// 서버 gift(PLANNED) → 화면에서 쓰는 진행 중인 증여 형태로 변환
function plannedGiftToPlan(gift) {
  return {
    id: gift.giftId,
    familyId: Number(gift.familyId),
    amount: Number(gift.amount),
    currentAmount: Number(gift.amount),
    giftDate: toDotDate(gift.giftDate),
    productName: gift.memo || '진행 중인 증여',
    memo: gift.memo ?? '',
    status: GIFT_STATUS.PLANNED,
    source: 'server',
  }
}

// 서버 gift(COMPLETED) → 증여 이력 형태로 변환
function completedGiftToHistory(gift) {
  return {
    id: gift.giftId,
    familyId: Number(gift.familyId),
    date: toDotDate(gift.giftDate),
    type: gift.memo || '현금',
    amount: Number(gift.amount),
    status: GIFT_STATUS.COMPLETED,
    source: 'server',
  }
}

// 서버 family(RecipientResponse) + 그 가족의 공제 현황(DeductionResponse) → 화면 수증자 형태.
// 공제 한도·누적 증여액·갱신일은 GET /api/gm/deduction 이 산출한 값을 그대로 쓴다.
// 여기서 다시 계산하지 말 것. 남은 기간 문구만 renewalDisplay 로 만든다.
function serverFamilyToState(recipient, deduction) {
  const renewal = renewalDisplay(deduction?.nextRenewalDate ?? null)

  return {
    id: Number(recipient.familyId),
    name: recipient.familyName,
    relation: relationLabel(recipient.relation),
    relationCode: relationCode(recipient.relation),
    birthDate: toDotDate(recipient.birthDate),
    isMinor: recipient.isMinor ?? deduction?.minor ?? false,
    familyImg: recipient.familyImg ?? null,
    peerAverageGiftAmount: peerAverageGiftAmount(recipient.birthDate),
    deductionLimit: deduction?.deductionLimit ?? null,
    giftedAmount: deduction?.usedAmount ?? 0,
    remainingDeduction: deduction?.remainingAmount ?? null,
    plannedAmount: deduction?.plannedAmount ?? 0,
    remainingDeductionIfPlanned: deduction?.remainingAmountIfPlanned ?? null,
    aggregatedCount: deduction?.aggregatedCount ?? 0,
    resetDate: renewal.resetDate,
    resetLabel: renewal.resetLabel,
    nextRenewalDate: renewal.nextRenewalDate,
    daysUntilRenewal: renewal.daysUntilRenewal,
    tone: Number(recipient.familyId) % 2 ? 'blue' : 'mint',
    source: 'server',
  }
}

let statusLoaded = false
let pendingSync = null
let statusGeneration = 0

/**
 * DB에서 수증자 목록·증여 전체·공제 현황을 읽어 증여 현황 상태를 다시 만든다.
 * 증여를 등록/확정/삭제한 뒤에는 이 함수만 호출하면 된다(공제도 같이 갱신된다).
 * VITE_API_BASE_URL이 없으면(api.isMock) 데모 데이터를 그대로 사용한다.
 */
async function syncStatus() {
  if (api.isMock) return

  const generation = statusGeneration

  const [recipients, gifts, deductions] = await Promise.all([
    api.listFamilies(),
    api.listGifts(),
    api.listDeductions(),
  ])

  if (generation !== statusGeneration) return

  const deductionByFamily = new Map(
    deductions.map((deduction) => [Number(deduction.familyId), deduction]),
  )

  state.families = recipients.map((recipient) =>
    serverFamilyToState(recipient, deductionByFamily.get(Number(recipient.familyId))),
  )
  state.plans = gifts.filter((gift) => gift.status === GIFT_STATUS.PLANNED).map(plannedGiftToPlan)
  state.giftHistory = gifts
    .filter((gift) => gift.status === GIFT_STATUS.COMPLETED)
    .map(completedGiftToHistory)

  // 선택된 수증자가 DB에서 사라졌거나 아직 없으면 첫 번째 가족으로 맞춘다.
  const familyIds = state.families.map((family) => family.id)
  if (!familyIds.includes(Number(state.selectedFamilyId))) {
    state.selectedFamilyId = familyIds[0] ?? null
  }

  statusLoaded = true
}

/** 화면 진입 시 호출. 이미 불러왔으면 재요청하지 않고, 동시 호출은 한 번으로 합친다. */
async function ensureStatusLoaded({ force = false } = {}) {
  if (api.isMock) return
  if (statusLoaded && !force) return
  if (!pendingSync) {
    const trackedSync = syncStatus().finally(() => {
      if (pendingSync === trackedSync) pendingSync = null
    })
    pendingSync = trackedSync
  }
  return pendingSync
}

async function clearUserState() {
  statusGeneration += 1
  statusLoaded = false
  pendingSync = null

  const nextState = defaultState()
  Object.keys(state).forEach((key) => {
    if (!(key in nextState)) delete state[key]
  })
  Object.assign(state, nextState)

  clearTimeout(toastTimer)
  Object.assign(toast, { visible: false, message: '', type: 'success' })

  await nextTick()
  localStorage.removeItem(STORAGE_KEY)
}

async function confirmPlanGift(planId) {
  const plan = state.plans.find((item) => item.id === planId)
  if (!plan) return
  const amount = Number(plan.currentAmount || plan.amount)
  const family = state.families.find((item) => item.id === plan.familyId)

  if (!api.isMock) {
    // PLANNED → COMPLETED 전이 후 서버 데이터를 다시 읽어온다.
    await api.updateGiftStatus(planId, GIFT_STATUS.COMPLETED)
    await syncStatus()
  } else {
    const today = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .replace(/\s/g, '')
      .replace(/\.$/, '')

    state.giftHistory.unshift({
      id: Date.now(),
      familyId: plan.familyId,
      date: today,
      type: plan.productName ?? '증여 확정',
      amount,
      status: 'COMPLETED',
    })
    if (family) family.giftedAmount += amount
    state.plans = state.plans.filter((item) => item.id !== planId)
  }

  delete state.documentChecks[planId]
  state.notifications.unshift({
    id: Date.now() + 1,
    group: '오늘',
    type: 'success',
    badge: '증여 확정',
    title: `${family?.name ?? '가족'} 님에게 증여를 확정했어요`,
    body: '증여 이력에 반영됐어요. 신고 기한 안에 세무서 제출을 마무리해 주세요.',
    time: '방금 전',
    unread: true,
  })
  showToast('증여를 확정하고 이력에 반영했어요.')
}

// 서류 체크는 증여 건(giftId)별로 따로 관리한다.
function toggleDocument(planId, documentId) {
  const checked = state.documentChecks[planId] ?? []
  state.documentChecks[planId] = checked.includes(documentId)
    ? checked.filter((id) => id !== documentId)
    : [...checked, documentId]
}

function isDocumentChecked(planId, documentId) {
  return (state.documentChecks[planId] ?? []).includes(documentId)
}

function checkedDocumentCount(planId) {
  return (state.documentChecks[planId] ?? []).length
}

function toggleSetting(setting) {
  state.settings[setting] = !state.settings[setting]
}

function markNotificationsRead() {
  state.notifications.forEach((item) => {
    item.unread = false
  })
}

function deleteSimulation(simulationId) {
  state.simulations = state.simulations.filter((item) => item.id !== simulationId)
  showToast('시뮬레이션 이력을 삭제했어요.', 'info')
}

async function addFamily({ name, relation, birthDate }) {
  const code = relationCode(relation)

  if (!api.isMock) {
    const created = await api.createFamily({
      familyName: name,
      relation: code,
      birthDate: toIsoDate(birthDate),
    })
    await syncStatus()
    if (created?.familyId) state.selectedFamilyId = Number(created.familyId)
    showToast('수증자 정보가 등록됐어요.')
    return
  }

  const id = Math.max(0, ...state.families.map((item) => item.id)) + 1
  state.families.push({
    id,
    name,
    relation: relationLabel(code),
    relationCode: code,
    birthDate: toDotDate(birthDate),
    peerAverageGiftAmount: peerAverageGiftAmount(birthDate),
    deductionLimit: deductionLimitFor(code, birthDate),
    giftedAmount: 0,
    remainingDeduction: deductionLimitFor(code, birthDate),
    resetDate: '미정',
    resetLabel: '증여 이력 없음',
    tone: id % 2 ? 'blue' : 'mint',
  })
  state.selectedFamilyId = id
  showToast('수증자 정보가 등록됐어요.')
}

function updateProfile(profile) {
  Object.assign(state.user, profile)
  showToast('회원 정보가 저장됐어요.')
}

async function resetDemo() {
  // 서버 연동 모드에서는 되돌릴 데모 데이터가 없으므로 DB 상태를 다시 읽어온다.
  if (!api.isMock) {
    await ensureStatusLoaded({ force: true })
    showToast('서버 데이터를 다시 불러왔어요.', 'info')
    return
  }
  Object.assign(state, clone(initialState))
  showToast('데모 데이터를 처음 상태로 되돌렸어요.', 'info')
}

export function useAppStore() {
  return {
    state: readonly(state),
    mutableState: state,
    isMock: api.isMock,
    selectedFamily,
    unreadCount,
    toast: readonly(toast),
    showToast,
    selectFamily,
    deleteDemoFamily,
    addGift,
    savePlan,
    deletePlan,
    syncStatus,
    ensureStatusLoaded,
    confirmPlanGift,
    toggleDocument,
    isDocumentChecked,
    checkedDocumentCount,
    toggleSetting,
    markNotificationsRead,
    deleteSimulation,
    addFamily,
    updateProfile,
    resetDemo,
    clearUserState,
  }
}
