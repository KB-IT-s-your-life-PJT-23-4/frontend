import { computed, reactive, readonly, watch } from 'vue'
import { initialState } from '../data/mockData'

const STORAGE_KEY = 'mirizoom-demo-state-v1'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return clone(initialState)
    return { ...clone(initialState), ...JSON.parse(saved) }
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

function addGift({ familyId, date, amount, memo = '현금' }) {
  const numericAmount = Number(amount)
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

function deletePlan(planId) {
  state.plans = state.plans.filter((plan) => plan.id !== planId)
  showToast('증여 계획을 삭제했어요.', 'info')
}

function toggleDocument(documentId) {
  const document = state.documents.find((item) => item.id === documentId)
  if (document) document.done = !document.done
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
  state.families.push({
    id,
    name,
    relation,
    birthDate: birthDate.replaceAll('-', '.'),
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
    selectedFamily,
    unreadCount,
    toast: readonly(toast),
    showToast,
    selectFamily,
    addGift,
    savePlan,
    deletePlan,
    toggleDocument,
    toggleSetting,
    markNotificationsRead,
    deleteSimulation,
    addFamily,
    updateProfile,
    resetDemo,
  }
}
