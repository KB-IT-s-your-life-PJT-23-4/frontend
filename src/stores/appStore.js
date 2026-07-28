import { computed, reactive, readonly, watch } from 'vue'
import { api } from '../api/apiAdapter'
import { initialState } from '../data/mockData'

const STORAGE_KEY = 'mirizoom-demo-state-v1'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

// 서류 정의(라벨/설명/툴팁/예시 이미지)는 코드가 원본이므로 저장된 상태로 덮어쓰지 않는다.
// 저장된 옛 상태에 남은 documents가 새 항목(tooltip, sampleImage)을 지워버리는 문제 방지.
const REFERENCE_KEYS = ['documents']

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return clone(initialState)
    const merged = { ...clone(initialState), ...JSON.parse(saved) }
    REFERENCE_KEYS.forEach((key) => {
      merged[key] = clone(initialState[key])
    })
    return merged
  } catch {
    return clone(initialState)
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
  () => state.families.find((family) => family.id === state.selectedFamilyId) ?? state.families[0],
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

async function addGift({ familyId, date, amount, memo = '현금' }) {
  const numericAmount = Number(amount)

  if (!api.isMock) {
    // 과거 이력은 확정된 증여로 등록한다.
    await api.createGift({
      familyId: Number(familyId),
      amount: numericAmount,
      giftDate: String(date).replaceAll('.', '-'),
      memo,
      status: 'CONFIRMED',
    })
    await syncGifts(familyId)
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

function savePlan(plan) {
  state.plans.unshift({ id: Date.now(), ...plan })
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
    await syncGifts(plan.familyId)
  } else {
    state.plans = state.plans.filter((item) => item.id !== planId)
  }
  delete state.documentChecks[planId]
  showToast('증여 계획을 삭제했어요.', 'info')
}

function toDotDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10).replaceAll('-', '.')
}

// 서버 gift(DRAFT) → 화면에서 쓰는 진행 중인 증여 형태로 변환
function draftGiftToPlan(gift) {
  return {
    id: gift.giftId,
    familyId: gift.familyId,
    amount: Number(gift.amount),
    currentAmount: Number(gift.amount),
    giftDate: toDotDate(gift.giftDate),
    productName: gift.memo || '진행 중인 증여',
    memo: gift.memo ?? '',
    status: 'PLANNED',
    source: 'server',
  }
}

function confirmedGiftToHistory(gift) {
  return {
    id: gift.giftId,
    familyId: gift.familyId,
    date: toDotDate(gift.giftDate),
    type: gift.memo || '현금',
    amount: Number(gift.amount),
    status: 'COMPLETED',
    source: 'server',
  }
}

// DB에서 해당 가족의 진행 중인 증여(DRAFT) / 확정 이력(CONFIRMED)을 가져와 상태에 반영한다.
// VITE_API_BASE_URL이 없으면(api.isMock) 데모 데이터를 그대로 사용한다.
async function syncGifts(familyId = state.selectedFamilyId) {
  if (api.isMock) return
  const id = Number(familyId)
  const [drafts, confirmed] = await Promise.all([
    api.listGifts({ familyId: id, status: 'DRAFT' }),
    api.listGifts({ familyId: id, status: 'CONFIRMED' }),
  ])

  state.plans = [
    ...state.plans.filter((plan) => Number(plan.familyId) !== id),
    ...drafts.map(draftGiftToPlan),
  ]
  state.giftHistory = [
    ...state.giftHistory.filter((gift) => Number(gift.familyId) !== id),
    ...confirmed.map(confirmedGiftToHistory),
  ]
}

async function confirmPlanGift(planId) {
  const plan = state.plans.find((item) => item.id === planId)
  if (!plan) return
  const amount = Number(plan.currentAmount || plan.amount)
  const family = state.families.find((item) => item.id === plan.familyId)

  if (!api.isMock) {
    // DRAFT → CONFIRMED 전이 후 서버 데이터를 다시 읽어온다.
    await api.updateGiftStatus(planId, 'CONFIRMED')
    await syncGifts(plan.familyId)
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

function addFamily({ name, relation, birthDate }) {
  const id = Math.max(0, ...state.families.map((item) => item.id)) + 1
  const birthYear = Number(birthDate.slice(0, 4))
  const age = new Date().getFullYear() - birthYear
  state.families.push({
    id,
    name,
    relation,
    birthDate: birthDate.replaceAll('-', '.'),
    peerAverageGiftAmount: age < 19 ? 18000000 : age < 30 ? 30000000 : 42000000,
    deductionLimit: 50000000,
    giftedAmount: 0,
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

function resetDemo() {
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
    addGift,
    savePlan,
    deletePlan,
    syncGifts,
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
  }
}
