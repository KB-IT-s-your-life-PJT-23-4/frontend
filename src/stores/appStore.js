import { computed, nextTick, reactive, readonly, watch } from 'vue'
import { api, GIFT_STATUS } from '../api/apiAdapter'
import { initialState } from '../data/mockData'
import { REMINDER_GROUPS, toNotification } from '../utils/reminder'
import {
  deductionLimitFor,
  isMinorAt,
  peerAverageGiftAmount,
  relationCode,
  relationLabel,
  renewalDisplay,
  toDotDate,
  toIsoDate,
} from '../utils/deduction'
import { annualizeTotalReturn, PRODUCT_TYPE_META } from '../utils/finance'

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
  // 저장했지만 아직 증여로 등록하지 않은 시뮬레이션. plans(진행 중인 증여)와 섞지 않는다.
  // 둘은 단계가 다르다 — 여기서 "증여 진행하기"를 눌러야 gift 가 생기고 plans 로 넘어간다.
  simulationPlans: [],
  giftHistory: [],
  // 서버의 시뮬레이션 이력 API로 채운다. 목 시드는 쓰지 않는다.
  simulations: [],
  // 서버가 조회 시점에 gift 에서 계산해 내려주는 리마인더 원본. 알림함 카드는 여기서 만든다.
  reminders: [],
  // 계획 저장 · 증여 확정 시 클라이언트가 직접 쌓는 이벤트 알림. 목데이터 시드는 쓰지 않는다.
  notifications: [],
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

/**
 * 알림함에 뿌릴 목록. 서버 리마인더(신고기한·공제갱신)와 앱에서 생긴 이벤트 알림(계획 저장,
 * 증여 확정)을 합친다. 리마인더는 기한이 걸린 할 일이라 이벤트 알림보다 앞에 둔다.
 */
const notifications = computed(() => {
  const reminderCards = (state.reminders ?? []).map(toNotification)
  const ordered = [...reminderCards].sort(
    (a, b) => REMINDER_GROUPS.indexOf(a.group) - REMINDER_GROUPS.indexOf(b.group),
  )

  return [...ordered, ...state.notifications]
})

const unreadCount = computed(() => notifications.value.filter((item) => item.unread).length)

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
    await api.deleteGift(planId)
    await syncStatus()
  } else {
    state.plans = state.plans.filter((item) => item.id !== planId)
  }
  delete state.documentChecks[planId]
  showToast('증여 계획을 삭제했어요.', 'info')
}

/**
 * 확정된 증여 이력 삭제. 잘못 등록한 이력을 지우는 용도다.
 *
 * 서버 연동 모드에서는 지운 뒤 syncStatus()만 부르면 된다. 누적 증여액·남은 공제·갱신일은
 * 저장된 값이 아니라 서버가 매 조회마다 10년 창을 다시 합산해 내려주는 값이라 함께 따라온다.
 * 데모 모드에는 그 계산이 없어 giftedAmount를 직접 되돌린다.
 */
async function deleteGiftHistory(giftId) {
  if (!api.isMock) {
    await api.deleteGift(giftId)
    await syncStatus()
  } else {
    const gift = state.giftHistory.find((item) => item.id === giftId)
    const family = state.families.find((item) => item.id === gift?.familyId)
    if (family && gift) family.giftedAmount = Math.max(0, family.giftedAmount - Number(gift.amount))
    state.giftHistory = state.giftHistory.filter((item) => item.id !== giftId)
  }
  showToast('증여 이력을 삭제했어요. 공제 한도가 다시 계산됐어요.', 'info')
}

// 서버 gift(PLANNED) → 화면에서 쓰는 진행 중인 증여 형태로 변환
function plannedGiftToPlan(gift) {
  return {
    id: gift.giftId,
    familyId: Number(gift.familyId),
    simulResultId: gift.simulResultId ?? null,
    sequenceNo: gift.sequenceNo ?? null,
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
    // 확정된 회차도 이행 현황 시간축에 "완료" 마커로 찍혀야 해서 출처를 함께 들고 간다.
    simulResultId: gift.simulResultId ?? null,
    sequenceNo: gift.sequenceNo ?? null,
    date: toDotDate(gift.giftDate),
    giftDate: toDotDate(gift.giftDate),
    type: gift.memo || '현금',
    amount: Number(gift.amount),
    status: GIFT_STATUS.COMPLETED,
    source: 'server',
  }
}

// 최종 저장 시뮬레이션 → 현황 화면에서 사용하는 진행 중인 증여 형태로 변환
function savedSimulationToPlan(item) {
  const selectedProducts = item.selection?.selectedProducts ?? []
  const selectedProductTypes = item.selection?.selectedProductTypes ?? []
  const productNames = selectedProducts
    .map((product) => product.productName?.trim())
    .filter(Boolean)
  const fallbackProductNames = selectedProductTypes
    .map((productType) => PRODUCT_TYPE_META[productType]?.label)
    .filter(Boolean)
  const requestedAmount = Number(item.inputSummary?.requestedAmount ?? 0)

  return {
    id: `simulation-${item.simulationId}`,
    simulationId: Number(item.simulationId),
    // 증여로 등록되면 gift.simulResultId 가 이 값을 물고 간다. 중복 제거의 연결 키다.
    simulResultId: item.selection?.resultId == null ? null : Number(item.selection.resultId),
    familyId: Number(item.family?.familyId),
    amount: requestedAmount,
    currentAmount: requestedAmount,
    expectedFutureValue: Number(item.selection?.expectedFutureValue ?? requestedAmount),
    plannedGiftDate: toDotDate(item.inputSummary?.giftDate),
    giftDate: toDotDate(item.inputSummary?.investmentEndDate),
    productName: productNames.join(' · ') || fallbackProductNames.join(' · ') || '저장된 증여 계획',
    productType: selectedProducts[0]?.productType ?? selectedProductTypes[0] ?? null,
    rate: annualizeTotalReturn(
      item.selection?.expectedReturnRatePercent,
      item.inputSummary?.investmentPeriodMonths,
    ),
    status: item.status,
    source: 'simulation',
    readOnly: true,
  }
}

// 서버 family(RecipientResponse) + 그 가족의 공제 현황(DeductionResponse) → 화면 수증자 형태.
// 공제 한도·누적 증여액·갱신일은 GET /api/gm/deduction 이 산출한 값을 그대로 쓴다.
// 여기서 다시 계산하지 말 것. 남은 기간 문구만 renewalDisplay 로 만든다.
function serverFamilyToState(recipient, deduction) {
  const renewal = renewalDisplay(
    deduction?.nextRenewalDate ?? null,
    deduction?.renewalAmount ?? null,
  )

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
    renewalAmount: renewal.renewalAmount,
    tone: Number(recipient.familyId) % 2 ? 'blue' : 'mint',
    source: 'server',
  }
}

function serverSimulationToState(item) {
  // 이력 카드의 시간은 저장/상태 전환 시각이 아니라 시뮬레이션 실행 시각이다.
  const timestamp = item.createdAt ?? item.savedAt ?? item.updatedAt
  const parsed = timestamp ? new Date(timestamp) : null
  const date =
    parsed && Number.isFinite(parsed.getTime())
      ? new Intl.DateTimeFormat('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(parsed)
      : ''

  const estimatedGiftTax = item.selection?.estimatedGiftTax ?? item.estimatedGiftTax

  return {
    id: Number(item.simulationId),
    familyId: Number(item.family?.familyId),
    date,
    amount: Number(item.inputSummary?.requestedAmount ?? 0),
    // API의 estimatedGiftTax는 신고세액공제 3%를 반영한 최종 납부 예상 세액이다.
    tax: estimatedGiftTax == null ? null : Number(estimatedGiftTax),
    status: item.status,
    minimumReturnRate: Number(item.expectedReturnRange?.minimum?.expectedReturnRatePercent ?? 0),
    maximumReturnRate: Number(item.expectedReturnRange?.maximum?.expectedReturnRatePercent ?? 0),
    minimumFutureValue: Number(item.expectedReturnRange?.minimum?.expectedFutureValue ?? 0),
    maximumFutureValue: Number(item.expectedReturnRange?.maximum?.expectedFutureValue ?? 0),
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
async function syncStatus({ suppressSimulationAccessNotice = true } = {}) {
  if (api.isMock) return

  const generation = statusGeneration

  // GET /api/gs는 일반 화면에서 기존 이력을 표시하기 위한 읽기 API다.
  // 조회 실패를 빈 이력으로 바꾸지 않아 실제 데이터가 없는 상태와 오류를 구분한다.
  const listSimulationHistory = (params) =>
    api.listSimulations({
      ...params,
      suppressBlockedAccess: suppressSimulationAccessNotice,
    })

  const [recipients, gifts, deductions, simulationHistory, reminders] = await Promise.all([
    api.listFamilies(),
    api.listGifts(),
    api.listDeductions(),
    listSimulationHistory({ page: 0, size: 50 }),
    api.listReminders(),
  ])

  if (generation !== statusGeneration) return

  const savedSimulationHistories = await Promise.all(
    recipients.map((recipient) =>
      listSimulationHistory({
        familyId: Number(recipient.familyId),
        status: 'SAVED',
      }),
    ),
  )

  if (generation !== statusGeneration) return

  state.reminders = reminders

  const deductionByFamily = new Map(
    deductions.map((deduction) => [Number(deduction.familyId), deduction]),
  )

  state.families = recipients.map((recipient) =>
    serverFamilyToState(recipient, deductionByFamily.get(Number(recipient.familyId))),
  )
  // 증여로 등록이 끝난 시뮬레이션은 gift 쪽에서 이미 보이므로 계획 목록에서 뺀다.
  // 빼지 않으면 같은 증여가 시뮬레이션으로 한 번, gift 로 한 번 총 두 줄로 뜬다.
  //
  // 판정 대상은 PLANNED 가 아니라 gift 전체다. COMPLETED 만 남은 시점에 PLANNED 로만 걸러 보면
  // 등록된 적 없는 시뮬레이션으로 되살아나, 확정한 증여가 이력과 진행 중에 동시에 보인다.
  const registeredResultIds = new Set(
    gifts
      .map((gift) => gift.simulResultId)
      .filter((resultId) => resultId != null)
      .map(Number),
  )
  const savedSimulationPlans = savedSimulationHistories
    .flatMap((history) => (history?.items ?? []).map(savedSimulationToPlan))
    .filter((plan) => plan.simulResultId == null || !registeredResultIds.has(plan.simulResultId))
  state.simulationPlans = savedSimulationPlans
  state.plans = gifts.filter((gift) => gift.status === GIFT_STATUS.PLANNED).map(plannedGiftToPlan)
  state.giftHistory = gifts
    .filter((gift) => gift.status === GIFT_STATUS.COMPLETED)
    .map(completedGiftToHistory)
  state.simulations = (simulationHistory?.items ?? []).map(serverSimulationToState)

  // 선택된 수증자가 DB에서 사라졌거나 아직 없으면 첫 번째 가족으로 맞춘다.
  const familyIds = state.families.map((family) => family.id)
  if (!familyIds.includes(Number(state.selectedFamilyId))) {
    state.selectedFamilyId = familyIds[0] ?? null
  }

  statusLoaded = true
}

async function loadSimulationHistoryPage({ familyId, page = 0, size = 10 } = {}) {
  const normalizedPage = Math.max(0, Number(page) || 0)
  const normalizedSize = Math.max(1, Number(size) || 10)

  if (api.isMock) {
    const filteredItems =
      familyId == null
        ? state.simulations
        : state.simulations.filter((item) => Number(item.familyId) === Number(familyId))
    const totalElements = filteredItems.length
    const totalPages = Math.ceil(totalElements / normalizedSize)
    const start = normalizedPage * normalizedSize
    const items = filteredItems.slice(start, start + normalizedSize)

    return {
      items,
      pagination: {
        page: normalizedPage,
        size: normalizedSize,
        totalElements,
        totalPages,
        numberOfElements: items.length,
        first: normalizedPage === 0,
        last: normalizedPage + 1 >= totalPages,
        hasNext: normalizedPage + 1 < totalPages,
        hasPrevious: normalizedPage > 0,
      },
    }
  }

  const response = await api.listSimulations({
    familyId,
    page: normalizedPage,
    size: normalizedSize,
  })

  return {
    items: (response?.items ?? []).map(serverSimulationToState),
    pagination: response?.pagination ?? null,
  }
}

/** 화면 진입 시 호출. 이미 불러왔으면 재요청하지 않고, 동시 호출은 한 번으로 합친다. */
async function ensureStatusLoaded({ force = false, suppressSimulationAccessNotice = true } = {}) {
  if (api.isMock) return
  if (statusLoaded && !force) return
  if (!pendingSync) {
    const trackedSync = syncStatus({ suppressSimulationAccessNotice }).finally(() => {
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

/**
 * 저장된 시뮬레이션을 진행 중인 증여(PLANNED gift)로 등록한다.
 *
 * 시뮬레이션을 저장하는 시점에는 gift 행을 만들지 않는다. 진행 중인 증여는 사용자가 지울 수 있어야 하는데,
 * 저장과 동시에 만들면 둘이 한 몸이 되어 시뮬레이션을 지우지 않고는 증여만 취소할 수 없기 때문이다.
 * gift 는 이 버튼을 누른 시점에 생기고, 그때부터 서류 체크 → 확정 흐름을 탈 수 있다.
 *
 * 금액과 증여일은 서버가 회차 원본(simulation_tranche)에서 읽는다. 분할 증여면 회차 수만큼 gift 가 생긴다.
 */
async function registerSimulationAsGift(planId) {
  const plan = state.simulationPlans.find((item) => item.id === planId)
  if (!plan || api.isMock) return

  const created = await api.registerGiftFromSimulation({
    simulationId: Number(plan.simulationId),
  })

  // 서류 체크는 giftId 로 묶이므로 회차가 나뉘면 체크도 회차별로 따로 쌓인다.
  // 등록 전에 planId 로 해 둔 체크는 회차가 없던 시절의 것이라 성격을 나눠 옮긴다.
  // 관계 증명처럼 회차와 무관한 서류(scope: 'plan')만 전 회차에 물려주고,
  // 이체확인증·신고서처럼 회차마다 다시 준비해야 하는 것은 물려주지 않는다.
  // 물려주면 아직 송금도 하지 않은 회차가 준비 완료로 보여 확정 버튼이 열린다.
  const planScopedDocumentIds = new Set(
    state.documents.filter((document) => document.scope === 'plan').map((document) => document.id),
  )
  const carriedOver = (state.documentChecks[planId] ?? []).filter((documentId) =>
    planScopedDocumentIds.has(documentId),
  )
  if (carriedOver.length) {
    for (const gift of created) {
      if (gift.giftId != null) state.documentChecks[gift.giftId] = [...carriedOver]
    }
  }
  delete state.documentChecks[planId]

  await syncStatus()
  showToast(
    created.length > 1
      ? `${created.length}회차 증여로 등록했어요. 회차마다 서류를 준비한 뒤 확정할 수 있어요.`
      : '증여로 등록했어요. 서류를 준비한 뒤 확정할 수 있어요.',
  )
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

/**
 * 증여세 신고서 이미지를 서버로 보내 이 증여 건과 대조한다.
 *
 * 대조 결과는 저장하지 않는다. 화면에 잠깐 보여줄 값이라 state 에 넣으면 localStorage 에까지
 * 남는다. 자동 체크는 켜기만 하고 끄지 않는다 — 이미 손으로 체크해 둔 것을 다른 회차 신고서를
 * 잘못 올렸다는 이유로 되돌리면, 사용자가 한 판단을 기계가 뒤집는 셈이 된다.
 */
async function verifyGiftFiling(planId, file) {
  if (api.isMock) {
    showToast('데모 모드에서는 신고서 확인을 쓸 수 없어요.', 'info')
    return null
  }

  const result = await api.verifyGiftFiling(planId, file)

  if (result?.matched) {
    if (!isDocumentChecked(planId, 'tax')) toggleDocument(planId, 'tax')
    showToast('신고서가 등록된 증여 내용과 일치해요. 증여세 신고서를 체크했어요.')
  } else {
    showToast('신고서와 등록된 증여 내용이 달라요. 확인해 주세요.', 'info')
  }

  return result
}

function toggleSetting(setting) {
  state.settings[setting] = !state.settings[setting]
}

/**
 * 알림함을 열면 호출한다. 앱 이벤트 알림은 로컬에서 바로 끄고,
 * 서버 리마인더는 안 읽은 것만 골라 읽음 처리한다(이미 읽은 건 다시 보내지 않는다).
 */
async function markNotificationsRead() {
  state.notifications.forEach((item) => {
    item.unread = false
  })

  const unreadReminders = (state.reminders ?? []).filter((reminder) => !reminder.readAt)
  if (!unreadReminders.length) return

  const readAt = new Date().toISOString()

  // 하나가 실패해도 나머지는 읽음 처리한다. 실패분은 다음 진입 때 다시 시도된다.
  const results = await Promise.allSettled(
    unreadReminders.map((reminder) =>
      api.markReminderRead({ giftId: reminder.giftId, type: reminder.type }),
    ),
  )

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return
    const target = state.reminders.find(
      (reminder) =>
        reminder.giftId === unreadReminders[index].giftId &&
        reminder.type === unreadReminders[index].type,
    )
    if (target) target.readAt = readAt
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

async function updateFamilyProfile(
  familyId,
  { name, birthDate },
  { image = null, removeImage = false } = {},
) {
  const numericFamilyId = Number(familyId)

  if (!api.isMock) {
    const updated = await api.updateFamilyProfile(
      numericFamilyId,
      { familyName: name, birthDate: toIsoDate(birthDate) },
      { image, removeImage },
    )
    await syncStatus()
    showToast('수증자 정보가 저장됐어요.')
    return updated
  }

  const family = state.families.find((item) => Number(item.id) === numericFamilyId)
  if (!family) {
    const error = new Error('수증자 정보를 찾을 수 없습니다.')
    error.status = 404
    throw error
  }

  const nextImage = image
    ? await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('이미지를 저장하지 못했습니다.'))
        reader.readAsDataURL(image)
      })
    : removeImage
      ? null
      : (family.familyImg ?? null)
  const relation = family.relationCode ?? relationCode(family.relation)
  const previousLimit = Number(family.deductionLimit ?? 0)
  const nextLimit = deductionLimitFor(relation, birthDate)

  Object.assign(family, {
    name: name.trim(),
    birthDate: toDotDate(birthDate),
    familyImg: nextImage,
    isMinor: isMinorAt(birthDate),
    peerAverageGiftAmount: peerAverageGiftAmount(birthDate),
    deductionLimit: nextLimit,
    remainingDeduction: Math.max(
      0,
      Number(family.remainingDeduction ?? previousLimit) + nextLimit - previousLimit,
    ),
  })
  showToast('수증자 정보가 저장됐어요.')
  return family
}

function updateProfile(profile) {
  Object.assign(state.user, profile)
  showToast('회원 정보가 저장됐어요.')
}

export function useAppStore() {
  return {
    state: readonly(state),
    mutableState: state,
    isMock: api.isMock,
    selectedFamily,
    notifications,
    unreadCount,
    toast: readonly(toast),
    showToast,
    selectFamily,
    deleteDemoFamily,
    addGift,
    savePlan,
    deletePlan,
    deleteGiftHistory,
    syncStatus,
    ensureStatusLoaded,
    loadSimulationHistoryPage,
    registerSimulationAsGift,
    confirmPlanGift,
    toggleDocument,
    isDocumentChecked,
    checkedDocumentCount,
    verifyGiftFiling,
    toggleSetting,
    markNotificationsRead,
    deleteSimulation,
    addFamily,
    updateFamilyProfile,
    updateProfile,
    clearUserState,
  }
}
