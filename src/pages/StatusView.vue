<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AddFamilyModal from '../components/common/AddFamilyModal.vue'
import DateField from '../components/common/DateField.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import SavedSimulationTimeline from '../components/status/SavedSimulationTimeline.vue'
import { useAppStore } from '../stores/appStore'
import { deductionProgress, toIsoDate } from '../utils/deduction'
import { formatCompactWon, formatWon, normalizeAmount } from '../utils/finance'
import '../assets/css/simulation/gift-strategy-comparison-section.css'
import { normalizeSimulationResponse } from '../utils/simulationModel'
import '../assets/css/status-view.css'

const store = useAppStore()
const showAddGift = ref(false)
const showAddFamily = ref(false)
const planToDelete = ref(null)
const giftToDelete = ref(null)
const deletingGift = ref(false)
const expandedPlanIds = ref([])
const openSimulationTimelineId = ref(null)
const simulationTimelineDetails = reactive({})
const simulationTimelineLoading = reactive({})
const simulationTimelineErrors = reactive({})

// toISOString()은 UTC라 KST 오전 9시 이전에는 하루 전 날짜가 나온다. 로컬 날짜로 직접 만든다.
function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}

// 확정 이력은 아직 하지 않은 증여를 기록할 수 없다(서버가 421로 막는다). 달력 상한도 오늘로 맞춘다.
const today = todayIso()
const giftForm = reactive({
  amount: '',
  date: today,
  memo: '현금 증여',
})

const family = store.selectedFamily
const hasFamily = computed(() => store.state.families.length > 0)
const remaining = computed(
  () =>
    family.value.remainingDeduction ??
    Math.max(0, family.value.deductionLimit - family.value.giftedAmount),
)
const progress = computed(() =>
  deductionProgress({
    usedAmount: family.value.giftedAmount,
    deductionLimit: family.value.deductionLimit,
  }),
)
// 10년 윈도우 안에 확정 증여가 없으면 갱신할 한도도 없다.
const hasRenewalSchedule = computed(() =>
  Boolean(
    family.value.nextRenewalDate ?? (family.value.resetDate !== '미정' && family.value.resetDate),
  ),
)
const familyPlans = computed(() =>
  store.state.plans.filter((plan) => plan.familyId === family.value.id),
)
// 저장된 시뮬레이션은 수증자당 최신 1건이라 첫 건만 쓴다. 아직 증여가 아니라서 familyPlans 와 분리돼 있다.
const familySimulation = computed(
  () =>
    (store.state.simulationPlans ?? []).find((plan) => plan.familyId === family.value.id) ?? null,
)

async function loadSavedSimulationTimeline(plan, { force = false } = {}) {
  const simulationId = Number(plan?.simulationId)
  if (!simulationId || store.isMock) return
  if (simulationTimelineDetails[simulationId] && !force) return

  simulationTimelineLoading[simulationId] = true
  simulationTimelineErrors[simulationId] = ''

  try {
    const response = await store.loadSimulationDetail(simulationId, { force })
    simulationTimelineDetails[simulationId] = normalizeSimulationResponse(response)
  } catch (error) {
    simulationTimelineErrors[simulationId] = error?.message || '저장한 일정을 불러오지 못했어요.'
  } finally {
    simulationTimelineLoading[simulationId] = false
  }
}

async function toggleSavedSimulationTimeline(plan) {
  const simulationId = Number(plan?.simulationId)
  if (!simulationId) return

  if (openSimulationTimelineId.value === simulationId) {
    openSimulationTimelineId.value = null
    return
  }

  openSimulationTimelineId.value = simulationId
  await loadSavedSimulationTimeline(plan)
}
const history = computed(() =>
  store.state.giftHistory.filter((gift) => gift.familyId === family.value.id),
)

/**
 * 진행 중인 증여를 화면 단위로 묶는다.
 *
 * 분할 증여는 같은 simulResultId 를 공유하는 gift 여러 행이라, 그대로 펼치면 목록이 회차 수만큼
 * 늘어나 언제 시작한 건인지 알 수 없다. 묶어서 총액과 시작일을 먼저 보여주고 회차는 안에 넣는다.
 *
 * 확정된 회차(giftHistory)도 함께 넣는다. 시간축 진행률은 "몇 회차까지 왔나"를 보여주는 것이라
 * 이미 끝난 회차가 빠지면 바가 항상 처음으로 되돌아가고 총액도 확정할 때마다 줄어든다.
 * 대신 묶음이 목록에 뜨는 조건은 아직 확정 안 된 회차가 하나라도 남아 있을 때다.
 */
const familyPlanGroups = computed(() => {
  const groups = []
  const bySimulResult = new Map()

  const trancheHistory = history.value.filter((gift) => gift.simulResultId != null)

  for (const plan of [...familyPlans.value, ...trancheHistory]) {
    if (plan.simulResultId == null) {
      groups.push({
        id: `gift-${plan.id}`,
        split: false,
        hasPending: true,
        totalAmount: Number(plan.currentAmount || plan.amount),
        startDate: plan.giftDate,
        endDate: plan.giftDate,
        tranches: [plan],
      })
      continue
    }

    let group = bySimulResult.get(plan.simulResultId)
    if (!group) {
      group = { id: `simul-${plan.simulResultId}`, tranches: [] }
      bySimulResult.set(plan.simulResultId, group)
      groups.push(group)
    }
    group.tranches.push(plan)
  }

  for (const group of bySimulResult.values()) {
    group.tranches.sort((first, second) => (first.sequenceNo ?? 0) - (second.sequenceNo ?? 0))
    group.split = group.tranches.length > 1
    group.hasPending = group.tranches.some((tranche) => tranche.status !== 'COMPLETED')
    group.totalAmount = group.tranches.reduce(
      (sum, tranche) => sum + Number(tranche.currentAmount || tranche.amount),
      0,
    )
    group.startDate = group.tranches[0]?.giftDate ?? ''
    group.endDate = group.tranches[group.tranches.length - 1]?.giftDate ?? ''
  }

  return groups.filter((group) => group.hasPending)
})

function dateValue(value) {
  const iso = toIsoDate(value)
  return iso ? new Date(`${iso}T00:00:00`).getTime() : NaN
}

// 시간축 위치(%). 첫 회차가 0%, 마지막 회차가 100%다.
function timelinePercent(group, value) {
  const start = dateValue(group.startDate)
  const end = dateValue(group.endDate)
  const point = dateValue(value)

  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(point)) return 0
  if (end <= start) return point >= end ? 100 : 0

  return Math.min(100, Math.max(0, ((point - start) / (end - start)) * 100))
}

function groupProgress(group) {
  return timelinePercent(group, today)
}

// 카드 양 끝에 붙는 회차는 날짜 말풍선이 트랙 밖으로 잘려 나가므로 정렬 방향을 바꾼다.
function trancheTimelinePositionClass(group, value) {
  const position = timelinePercent(group, value)
  if (position <= 10) return 'is-near-start'
  if (position >= 90) return 'is-near-end'
  return ''
}

function completedTrancheCount(group) {
  return group.tranches.filter((tranche) => tranche.status === 'COMPLETED').length
}

function isTrancheDone(tranche) {
  return tranche.status === 'COMPLETED'
}
const todayDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

// 서류 목록은 기본으로 접어 둔다. 회차마다 3종씩 펼쳐지면 묶음 하나가 화면을 가득 채운다.
// 펼침 상태는 회차 카드(gift id)와 키가 겹치지 않게 접두어를 붙여 expandedPlanIds 에 함께 담는다.
function documentPanelKey(planId) {
  return `docs-${planId}`
}

function isDocumentPanelOpen(planId) {
  return isPlanExpanded(documentPanelKey(planId))
}

function planProgressCopy(plan) {
  const plannedGiftDate = String(plan.plannedGiftDate ?? '').replaceAll('.', '-')
  return plannedGiftDate && plannedGiftDate < todayDate ? '불리고 있어요' : '불릴 예정이에요'
}

function planScheduleCopy(plan) {
  const plannedGiftDate = String(plan.plannedGiftDate ?? '').replaceAll('.', '-')
  const giftStarted = plannedGiftDate && plannedGiftDate < todayDate

  if (!giftStarted && plan.plannedGiftDate) return `${plan.plannedGiftDate} 증여 예정`
  if (plan.giftDate) return `${plan.giftDate} 운용 종료 예정`
  return '일정 미정'
}

function simulationPeriodCopy(plan) {
  const giftDate = plan.plannedGiftDate
  const operationEndDate = plan.operationEndDate ?? plan.giftDate

  if (giftDate && operationEndDate) return `${giftDate}~${operationEndDate} 예정`
  if (giftDate) return `${giftDate} 증여 예정`
  if (operationEndDate) return `${operationEndDate} 운용 마무리 예정`
  return '일정 미정'
}

/**
 * 증여세 신고서 OCR 대조. 회차마다 따로 올리므로 상태도 회차(giftId)별로 담는다.
 * 결과는 화면에서만 쓰고 저장하지 않는다.
 */
const filingInput = ref(null)
const filingPlanId = ref(null)
const filingState = reactive({})

function openFilingPicker(planId) {
  filingPlanId.value = planId
  filingInput.value?.click()
}

async function verifyFiling(event) {
  const file = event.target.files?.[0]
  const planId = filingPlanId.value
  // 같은 파일을 다시 고를 수 있어야 한다. 값이 남아 있으면 change 가 안 뜬다.
  event.target.value = ''
  if (!file || planId == null) return

  filingState[planId] = { loading: true, result: null, error: '' }

  try {
    filingState[planId] = {
      loading: false,
      result: await store.verifyGiftFiling(planId, file),
      error: '',
    }
  } catch (error) {
    filingState[planId] = {
      loading: false,
      result: null,
      error: error.message || '신고서를 확인하지 못했어요.',
    }
  }
}

function isFilingVerifying(planId) {
  return Boolean(filingState[planId]?.loading)
}

function filingResult(planId) {
  return filingState[planId]?.result ?? null
}

function filingError(planId) {
  return filingState[planId]?.error ?? ''
}

function completedDocuments(planId) {
  return store.checkedDocumentCount(planId)
}

function isDocumentDone(planId, documentId) {
  return store.isDocumentChecked(planId, documentId)
}

function isPlanReadyToConfirm(planId) {
  return (
    store.state.documents.length > 0 && completedDocuments(planId) === store.state.documents.length
  )
}

function isPlanExpanded(planId) {
  return expandedPlanIds.value.includes(planId)
}

function togglePlan(planId) {
  expandedPlanIds.value = isPlanExpanded(planId)
    ? expandedPlanIds.value.filter((id) => id !== planId)
    : [...expandedPlanIds.value, planId]
}

function setGiftAmount(value) {
  giftForm.amount = normalizeAmount(value).toLocaleString('ko-KR')
}

async function submitGift() {
  const numericAmount = normalizeAmount(giftForm.amount)
  if (!numericAmount || !giftForm.date) return
  try {
    await store.addGift({
      familyId: family.value.id,
      amount: numericAmount,
      date: giftForm.date.replaceAll('-', '.'),
      memo: giftForm.memo,
    })
    giftForm.amount = ''
    giftForm.memo = '현금 증여'
    showAddGift.value = false
  } catch (error) {
    store.showToast(error.message || '증여 이력을 등록하지 못했습니다.', 'info')
  }
}

const planToConfirm = ref(null)
const confirming = ref(false)

// 증여일이 아직 안 온 계획은 서버가 확정을 막는다(421). 버튼을 눌러 실패시키는 대신 미리 알린다.
const confirmBlockedByDate = computed(() => {
  const giftDate = planToConfirm.value?.giftDate
  return Boolean(giftDate) && toIsoDate(giftDate) > today
})

// 저장된 시뮬레이션은 아직 gift 가 없어 확정할 수 없다. 여기서 진행 중인 증여로 만든 뒤 확정 흐름을 탄다.
const registeringPlanId = ref(null)

async function registerPlan(plan) {
  if (registeringPlanId.value) return
  registeringPlanId.value = plan.id
  try {
    await store.registerSimulationAsGift(plan.id)
  } catch (error) {
    store.showToast(error.message || '증여로 등록하지 못했습니다.', 'info')
  } finally {
    registeringPlanId.value = null
  }
}

async function confirmGift() {
  if (!planToConfirm.value || confirming.value) return
  confirming.value = true
  try {
    await store.confirmPlanGift(planToConfirm.value.id)
    planToConfirm.value = null
  } catch (error) {
    store.showToast(error.message || '증여 확정을 처리하지 못했습니다.', 'info')
  } finally {
    confirming.value = false
  }
}

// 서류 설명 드롭다운 (증여 건 + 서류 조합으로 열림 상태 관리)
const openedDocumentKeys = ref([])

function documentKey(planId, documentId) {
  return `${planId}-${documentId}`
}

function isDocumentOpen(planId, documentId) {
  return openedDocumentKeys.value.includes(documentKey(planId, documentId))
}

function toggleDocumentDetail(planId, documentId) {
  const key = documentKey(planId, documentId)
  openedDocumentKeys.value = openedDocumentKeys.value.includes(key)
    ? openedDocumentKeys.value.filter((item) => item !== key)
    : [...openedDocumentKeys.value, key]
}

const sampleDocument = ref(null)
const sampleImageFailed = ref(false)

function openSample(document) {
  sampleImageFailed.value = false
  sampleDocument.value = document
}

function closeSample() {
  sampleDocument.value = null
}

async function confirmDelete() {
  if (!planToDelete.value) return
  try {
    await store.deletePlan(planToDelete.value.id)
    planToDelete.value = null
  } catch (error) {
    store.showToast(error.message || '삭제하지 못했습니다.', 'info')
  }
}

// 이력 삭제는 누적 증여액이 줄어드는 일이라 계획 삭제보다 되돌리기 어렵다. 확인 모달을 따로 둔다.
async function confirmGiftHistoryDelete() {
  if (!giftToDelete.value || deletingGift.value) return
  deletingGift.value = true
  try {
    await store.deleteGiftHistory(giftToDelete.value.id)
    giftToDelete.value = null
  } catch (error) {
    store.showToast(error.message || '증여 이력을 삭제하지 못했습니다.', 'info')
  } finally {
    deletingGift.value = false
  }
}

// DB에서 수증자 목록과 증여(진행 중 PLANNED / 확정 COMPLETED)를 불러온다.
// 공제 한도·누적 증여액·갱신일은 스토어가 증여 목록으로 계산한다.
const loading = ref(false)
const loadError = ref('')
const needsLogin = ref(false)

async function loadStatus({ force = false } = {}) {
  if (store.isMock) return
  loading.value = true
  loadError.value = ''
  needsLogin.value = false
  try {
    await store.ensureStatusLoaded({ force })
  } catch (error) {
    needsLogin.value = error.status === 401
    loadError.value = needsLogin.value
      ? '로그인이 필요해요. 로그인한 뒤 증여 현황을 확인할 수 있어요.'
      : error.message || '증여 현황을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadStatus())
</script>

<template>
  <div class="page status-page">
    <AppHeader />
    <div class="page-content status-content">
      <!-- 수증자가 없으면 고를 대상도 추가 버튼도 필요 없다. 아래 빈 상태 카드가 등록을 안내한다. -->
      <section v-if="hasFamily" class="family-switcher" aria-label="수증자 선택">
        <button
          v-for="item in store.state.families"
          :key="item.id"
          type="button"
          :class="{ active: item.id === family.id }"
          @click="store.selectFamily(item.id)"
        >
          {{ item.name }}
        </button>
        <button
          class="add-family-tab"
          type="button"
          aria-label="수증자 추가"
          @click="showAddFamily = true"
        >
          <AppIcon name="plus" :size="18" />
        </button>
      </section>

      <aside v-if="loadError" class="info-callout compact status-load-error">
        <AppIcon name="info" :size="18" />
        <p>{{ loadError }}</p>
        <RouterLink v-if="needsLogin" class="soft-button compact" to="/login">로그인</RouterLink>
        <button
          v-else
          class="soft-button compact"
          type="button"
          @click="loadStatus({ force: true })"
        >
          다시 시도
        </button>
      </aside>

      <section v-if="!hasFamily && !loading" class="empty-plan-card">
        <span><AppIcon name="user" :size="25" /></span>
        <h2>등록된 수증자가 없어요</h2>
        <p>수증자를 등록하면 가족별 증여 현황과 공제 한도를 관리할 수 있어요.</p>
        <button class="primary-button" type="button" @click="showAddFamily = true">
          수증자 등록하기
        </button>
      </section>

      <template v-else>
        <section class="deduction-card">
          <div class="deduction-visual">
            <div class="plan-orbit" />
            <span class="plan-coin">₩</span>
            <span class="plan-document"><AppIcon name="document" :size="26" /></span>
            <div class="deduction-visual-copy">
              <span>
                10년 주기 증여공제 한도
                <template v-if="family.relation">
                  · {{ family.relation }}{{ family.isMinor ? '(미성년)' : '' }}
                </template>
              </span>
              <div class="deduction-visual-amount">
                <h2>{{ formatCompactWon(family.giftedAmount) }} 증여했어요</h2>
                <strong>{{ progress }}%</strong>
              </div>
            </div>
          </div>
          <div class="deduction-card-body">
            <div class="progress-track large">
              <span :style="{ width: `${progress}%` }" />
            </div>
            <div class="overview-labels">
              <span>현재까지 {{ formatWon(family.giftedAmount) }}</span>
              <span>한도 {{ formatWon(family.deductionLimit) }}</span>
            </div>
            <p>
              <AppIcon name="info" :size="16" /> 추가 {{ formatCompactWon(remaining) }}까지 공제
              한도 안에서 증여할 수 있어요.
            </p>
          </div>
        </section>

        <section class="renewal-card">
          <div class="renewal-icon"><AppIcon name="clock" :size="24" /></div>
          <div>
            <span>한도 갱신까지</span>
            <h2 v-if="hasRenewalSchedule">{{ family.resetLabel }} 남았어요</h2>
            <h2 v-else>아직 갱신 일정이 없어요</h2>
            <!--
              날짜만으로는 "그래서 얼마가 생기나"가 안 보인다.
              늘어나는 여력이 0이면(초과분을 메우는 데 다 쓰이는 경우) 문구를 띄우지 않는다.
            -->
            <p v-if="family.renewalAmount" class="renewal-note">
              {{ hasRenewalSchedule ? family.resetDate : '증여 이력 없음' }}부터
              {{ formatCompactWon(family.renewalAmount) }}까지 세금없이 증여할 수 있어요
            </p>
          </div>
        </section>
        <section v-if="familySimulation" class="active-plan-card">
          <div class="plan-card-copy">
            <h2>
              <template v-if="familySimulation.expectedFutureValue">
                {{ formatCompactWon(familySimulation.amount) }}을
                {{ planProgressCopy(familySimulation) }}
              </template>
              <template v-else>
                {{ formatCompactWon(familySimulation.amount) }}을 준비하고 있어요
              </template>
            </h2>
            <strong>{{ familySimulation.productName }}</strong>
            <div class="plan-card-meta">
              <span v-if="familySimulation.rate">
                예상 수익률 연 {{ familySimulation.rate }}%
              </span>
              <span>{{ simulationPeriodCopy(familySimulation) }}</span>
            </div>
            <SavedSimulationTimeline
              :plan="familySimulation"
              :detail="simulationTimelineDetails[familySimulation.simulationId] ?? null"
              :loading="Boolean(simulationTimelineLoading[familySimulation.simulationId])"
              :error="simulationTimelineErrors[familySimulation.simulationId] ?? ''"
              :open="openSimulationTimelineId === familySimulation.simulationId"
              @toggle="toggleSavedSimulationTimeline(familySimulation)"
              @retry="loadSavedSimulationTimeline(familySimulation, { force: true })"
            />
            <template v-if="!familySimulation.registeredAsGift">
              <button
                class="primary-button full register-simulation-button"
                type="button"
                :disabled="registeringPlanId === familySimulation.id"
                @click="registerPlan(familySimulation)"
              >
                <AppIcon name="check" :size="16" />
                {{
                  registeringPlanId === familySimulation.id
                    ? '등록 중...'
                    : '이 시뮬레이션으로 증여 진행하기'
                }}
              </button>
              <p class="register-gift-note">
                증여를 진행하면 '진행 중인 증여'에서 서류 준비와 완료 처리를 이어갈 수 있어요.
              </p>
            </template>
          </div>
        </section>

        <section v-else-if="!familyPlans.length" class="empty-plan-card">
          <span><AppIcon name="calculator" :size="25" /></span>
          <h2>현재 저장한 증여 계획이 없어요</h2>
          <p>
            시뮬레이션을 실행해<br />
            우리 가족에게 맞는 계획을 만들어 보세요.
          </p>
          <RouterLink class="primary-button" to="/simulation">시뮬레이션 시작하기</RouterLink>
        </section>

        <section class="status-section">
          <div class="section-heading-row">
            <h2>증여 현황</h2>
          </div>

          <article class="status-list-card">
            <div class="status-card-title">
              <div>
                <span class="status-section-icon history"><AppIcon name="clock" :size="19" /></span>
                <strong>증여 이력</strong>
              </div>
              <span>{{ history.length }}건</span>
            </div>
            <div v-if="history.length" class="gift-history-list">
              <div v-for="gift in history" :key="gift.id">
                <span
                  >{{ gift.date }} <small>{{ gift.type }}</small></span
                >
                <span class="gift-history-aside">
                  <strong>{{ formatCompactWon(gift.amount) }}</strong>
                  <button
                    class="row-delete-button"
                    type="button"
                    :aria-label="`${gift.date} 증여 이력 삭제`"
                    @click="giftToDelete = gift"
                  >
                    <AppIcon name="trash" :size="15" />
                  </button>
                </span>
              </div>
            </div>
            <p v-else-if="loading" class="empty-inline">증여 이력을 불러오는 중이에요.</p>
            <p v-else class="empty-inline">등록된 증여 이력이 없습니다.</p>
            <button class="soft-button full" type="button" @click="showAddGift = true">
              <AppIcon name="plus" :size="17" /> 증여 이력 추가
            </button>
          </article>

          <article class="status-list-card">
            <div class="status-card-title">
              <div>
                <span class="status-section-icon planned"
                  ><AppIcon name="calendar" :size="19"
                /></span>
                <strong>진행 중인 증여</strong>
              </div>
              <span>{{ familyPlanGroups.length }}건</span>
            </div>
            <div v-if="familyPlanGroups.length" class="ongoing-plan-list">
              <div
                v-for="group in familyPlanGroups"
                :key="group.id"
                class="ongoing-plan-item"
                :class="{ open: isPlanExpanded(group.id) }"
              >
                <div class="ongoing-plan-head">
                  <button
                    class="ongoing-plan-summary"
                    type="button"
                    :aria-expanded="isPlanExpanded(group.id)"
                    :aria-controls="`plan-documents-${group.id}`"
                    @click="togglePlan(group.id)"
                  >
                    <div>
                      <strong>{{ formatCompactWon(group.totalAmount) }}</strong>
                      <span v-if="group.split" class="tranche-pill">
                        {{ group.tranches.length }}회 분할
                      </span>
                      <span>증여 신고 전</span>
                    </div>
                    <p>
                      <AppIcon name="info" :size="16" />
                      <template v-if="group.split">
                        {{ group.startDate }} 시작 · {{ completedTrancheCount(group) }}/{{
                          group.tranches.length
                        }}회차 완료
                      </template>
                      <template v-else>
                        {{ group.startDate }} 일정과 신고 서류를 미리 확인하세요.
                      </template>
                    </p>
                  </button>
                  <div class="ongoing-plan-actions">
                    <span class="status-pill">진행 중</span>
                    <span class="ongoing-plan-caret" aria-hidden="true">
                      <AppIcon name="chevron" :size="16" />
                    </span>
                    <button
                      v-if="!group.split"
                      class="row-delete-button ongoing-plan-delete"
                      type="button"
                      :aria-label="`${group.startDate} 진행 중인 증여 삭제`"
                      @click="planToDelete = group.tranches[0]"
                    >
                      <AppIcon name="trash" :size="16" />
                    </button>
                  </div>
                </div>

                <div v-show="isPlanExpanded(group.id)" :id="`plan-documents-${group.id}`">
                  <div v-if="group.split" class="plan-document-panel tranche-timeline">
                    <div class="plan-document-heading">
                      <div>
                        <span class="section-kicker">SCHEDULE</span>
                        <strong>증여 이행 현황</strong>
                      </div>
                      <span class="yellow-text">
                        {{ completedTrancheCount(group) }}/{{ group.tranches.length }}회차
                      </span>
                    </div>
                    <div class="gift-timeline">
                      <div class="gift-timeline-track">
                        <span
                          class="gift-timeline-fill tranche-progress-fill"
                          :style="{ '--tranche-timeline-progress': `${groupProgress(group)}%` }"
                        />
                        <div
                          v-for="tranche in group.tranches"
                          :key="`marker-${tranche.id}`"
                          class="gift-timeline-point"
                          :class="trancheTimelinePositionClass(group, tranche.giftDate)"
                          :style="{ left: `${timelinePercent(group, tranche.giftDate)}%` }"
                        >
                          <span
                            class="timeline-dot"
                            :class="isTrancheDone(tranche) ? 'is-done' : 'is-upcoming'"
                          >
                            <AppIcon
                              :name="isTrancheDone(tranche) ? 'check' : 'wallet'"
                              :size="14"
                            />
                          </span>
                          <div class="timeline-point-copy">
                            <strong>{{ tranche.sequenceNo }}회차</strong>
                            <span>{{ tranche.giftDate }}</span>
                            <b>{{ formatCompactWon(tranche.currentAmount || tranche.amount) }}</b>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!--
                    서류와 확정은 회차마다 따로다. 회차별 신고기한이 달라 한 묶음으로 처리할 수 없다.
                    이미 확정된 회차는 준비할 것이 없어 건너뛴다.
                  -->
                  <div
                    v-for="plan in group.tranches.filter((tranche) => !isTrancheDone(tranche))"
                    :key="`docs-${plan.id}`"
                    class="plan-document-panel"
                    :class="{ open: isDocumentPanelOpen(plan.id) }"
                  >
                    <button
                      class="plan-document-heading plan-document-toggle"
                      type="button"
                      :aria-expanded="isDocumentPanelOpen(plan.id)"
                      :aria-controls="`document-list-${plan.id}`"
                      @click="togglePlan(documentPanelKey(plan.id))"
                    >
                      <div>
                        <strong>
                          <template v-if="group.split">{{ plan.sequenceNo }}회차 </template>
                          필수 증빙 서류
                        </strong>
                      </div>
                      <span class="yellow-text"
                        >{{ completedDocuments(plan.id) }}/{{
                          store.state.documents.length
                        }}
                        준비</span
                      >
                      <span class="plan-document-caret" aria-hidden="true">
                        <AppIcon name="chevron" :size="16" />
                      </span>
                    </button>
                    <div
                      v-show="isDocumentPanelOpen(plan.id)"
                      :id="`document-list-${plan.id}`"
                      class="document-list"
                    >
                      <div
                        v-for="document in store.state.documents"
                        :key="document.id"
                        class="document-row"
                        :class="{ open: isDocumentOpen(plan.id, document.id) }"
                      >
                        <div
                          class="document-row-head"
                          :class="{ done: isDocumentDone(plan.id, document.id) }"
                        >
                          <span class="document-icon"><AppIcon name="document" :size="19" /></span>
                          <div class="document-row-text">
                            <button
                              class="document-name"
                              type="button"
                              :aria-expanded="isDocumentOpen(plan.id, document.id)"
                              :aria-controls="`document-detail-${plan.id}-${document.id}`"
                              @click="toggleDocumentDetail(plan.id, document.id)"
                            >
                              <strong>{{ document.label }}</strong>
                              <span class="document-name-caret"
                                ><AppIcon name="chevron" :size="14"
                              /></span>
                            </button>
                            <small>{{ document.description }}</small>
                          </div>
                          <button
                            class="document-check-button"
                            type="button"
                            :aria-pressed="isDocumentDone(plan.id, document.id)"
                            :aria-label="`${document.label} 준비 완료`"
                            @click="store.toggleDocument(plan.id, document.id)"
                          >
                            <span class="document-check"><AppIcon name="check" :size="15" /></span>
                          </button>
                        </div>
                        <div
                          v-show="isDocumentOpen(plan.id, document.id)"
                          :id="`document-detail-${plan.id}-${document.id}`"
                          class="document-detail"
                        >
                          <p v-if="document.intro">{{ document.intro }}</p>
                          <div
                            v-if="document.guide"
                            class="document-guide"
                            :class="{ plain: document.guide.plain }"
                          >
                            <strong>
                              <AppIcon v-if="!document.guide.plain" name="document" :size="15" />
                              {{ document.guide.title }}
                            </strong>
                            <ol>
                              <li v-for="step in document.guide.steps" :key="step">{{ step }}</li>
                            </ol>
                          </div>
                          <button
                            v-if="document.sampleImage"
                            class="document-sample-button"
                            type="button"
                            @click="openSample(document)"
                          >
                            예시 보기
                          </button>
                          <div v-if="document.links" class="document-link-row">
                            <a
                              v-for="link in document.links"
                              :key="link.href"
                              class="document-link"
                              :class="{ primary: link.primary }"
                              :href="link.href"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <AppIcon :name="link.icon" :size="15" /> {{ link.label }}
                            </a>
                          </div>
                          <!--
                            작성한 신고서를 올리면 서버가 등록된 증여 내용과 대조해 일치할 때만
                            체크를 켠다. 주민등록번호가 있는 서식이라 파일은 저장하지 않는다.
                          -->
                          <div v-if="document.id === 'tax'" class="filing-verify">
                            <button
                              class="document-sample-button"
                              type="button"
                              :disabled="isFilingVerifying(plan.id)"
                              @click="openFilingPicker(plan.id)"
                            >
                              {{
                                isFilingVerifying(plan.id)
                                  ? '신고서 확인 중…'
                                  : '작성한 신고서로 자동 확인'
                              }}
                            </button>
                            <small>
                              사진이나 PDF를 올리면 등록된 금액·증여일과 대조해요. 파일은 저장하지
                              않아요.
                            </small>
                            <div
                              v-if="filingResult(plan.id)"
                              class="filing-verify-result"
                              :class="{ matched: filingResult(plan.id).matched }"
                            >
                              <strong v-if="filingResult(plan.id).matched">
                                등록된 증여 내용과 일치해요.
                              </strong>
                              <template v-else>
                                <strong>내용이 달라요. 신고서를 확인해 주세요.</strong>
                                <ul>
                                  <li
                                    v-for="mismatch in filingResult(plan.id).mismatches"
                                    :key="mismatch"
                                  >
                                    {{ mismatch }}
                                  </li>
                                </ul>
                              </template>
                              <ul
                                v-if="filingResult(plan.id).read?.warnings?.length"
                                class="filing-verify-warnings"
                              >
                                <li
                                  v-for="warning in filingResult(plan.id).read.warnings"
                                  :key="warning"
                                >
                                  {{ warning }}
                                </li>
                              </ul>
                            </div>
                            <p v-else-if="filingError(plan.id)" class="filing-verify-error">
                              {{ filingError(plan.id) }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      v-if="isPlanReadyToConfirm(plan.id)"
                      class="primary-button full confirm-gift-button"
                      type="button"
                      @click="planToConfirm = plan"
                    >
                      <AppIcon name="check" :size="16" /> 증여 확정하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p v-else-if="loading" class="empty-inline">진행 중인 증여를 불러오는 중이에요.</p>
            <p v-else-if="loadError" class="empty-inline">{{ loadError }}</p>
            <p v-else class="empty-inline">현재 진행 중인 증여가 없습니다.</p>
            <input
              ref="filingInput"
              class="filing-verify-input"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              @change="verifyFiling"
            />
          </article>
        </section>
      </template>

      <section class="expert-card">
        <span class="expert-avatar"><AppIcon name="chat" :size="28" /></span>
        <div>
          <h2>증여가 어려우신가요?</h2>
          <p>
            AI 상담을 통해 관련 법령과 기본 절차를 확인하고, 나의 상황에 맞는 증여 계획을
            세워보세요.
          </p>
        </div>
        <RouterLink class="primary-button" to="/chat">AI 상담하기</RouterLink>
      </section>
    </div>

    <ModalSheet
      :show="showAddGift"
      title="증여 정보를 입력해 주세요"
      description="신고된 과거 이력을 기록하면 공제 한도를 더 정확히 계산할 수 있어요."
      @close="showAddGift = false"
    >
      <form id="gift-history-form" class="modal-form" @submit.prevent="submitGift">
        <label>
          <span>증여 금액</span>
          <div class="modal-input-affix">
            <input
              :value="giftForm.amount"
              inputmode="numeric"
              placeholder="0"
              required
              @input="setGiftAmount($event.target.value)"
            />
            <span>원</span>
          </div>
        </label>
        <!--
          이 모달은 확정 이력(COMPLETED)만 등록한다. 미래 날짜는 서버가 421로 막으므로
          달력에서도 오늘까지만 고를 수 있게 해 아예 보내지 않는다.
          미래에 할 증여는 시뮬레이션에서 저장하는 계획(PLANNED)이 따로 담당한다.
        -->
        <div class="date-field-row">
          <span>증여 날짜</span>
          <DateField
            v-model="giftForm.date"
            :max="today"
            placeholder="증여 날짜를 선택하세요"
            aria-label="증여 날짜 선택"
          />
        </div>
        <label>
          <span>메모</span>
          <textarea
            v-model="giftForm.memo"
            rows="3"
            placeholder="증여 목적이나 특이사항을 적어주세요."
          />
        </label>
        <aside class="info-callout compact">
          <AppIcon name="info" :size="18" />
          <p>
            등록한 금액은 최근 10년 누적 증여액과 남은 공제 한도에 바로 반영됩니다. 아직 하지 않은
            증여는 기록할 수 없어요 — 증여 날짜는 오늘까지만 선택할 수 있습니다.
          </p>
        </aside>
      </form>
      <template #actions>
        <button class="secondary-button" type="button" @click="showAddGift = false">취소</button>
        <button class="primary-button" type="submit" form="gift-history-form">등록</button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="Boolean(planToConfirm)"
      title="증여를 확정할까요?"
      description="확정하면 증여 이력에 반영되고 10년 누적 증여액과 남은 공제 한도가 갱신돼요."
      @close="planToConfirm = null"
    >
      <template #icon><AppIcon name="check" :size="25" /></template>
      <aside v-if="confirmBlockedByDate" class="info-callout compact warning">
        <AppIcon name="info" :size="18" />
        <p>
          증여 예정일({{ planToConfirm.giftDate }})이 아직 지나지 않았어요. 확정은 이체를 마쳤다는
          뜻이라 예정일이 지난 뒤에 눌러 주세요. 그때까지는 진행 중인 증여로 남습니다.
        </p>
      </aside>
      <aside v-else-if="planToConfirm" class="info-callout compact">
        <AppIcon name="info" :size="18" />
        <p>
          {{ family.name }} 님에게
          {{ formatCompactWon(planToConfirm.currentAmount || planToConfirm.amount) }}을 증여한
          것으로 기록합니다. 확정 후에도 신고 기한(증여일이 속한 달 말일부터 3개월) 안에 세무서
          제출을 마무리해 주세요.
        </p>
      </aside>
      <template #actions>
        <button class="secondary-button" type="button" @click="planToConfirm = null">취소</button>
        <button
          class="primary-button"
          type="button"
          :disabled="confirming || confirmBlockedByDate"
          @click="confirmGift"
        >
          {{ confirming ? '처리 중...' : '확정하기' }}
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="Boolean(sampleDocument)"
      :title="`${sampleDocument?.label ?? ''} 예시`"
      :description="sampleDocument?.sampleCaption"
      @close="closeSample"
    >
      <div class="document-sample-view">
        <img
          v-if="!sampleImageFailed"
          :src="sampleDocument?.sampleImage"
          :alt="`${sampleDocument?.label} 예시 이미지`"
          @error="sampleImageFailed = true"
        />
        <p v-else class="empty-inline">예시 이미지를 준비 중이에요.</p>
      </div>
      <template #actions>
        <button class="primary-button" type="button" @click="closeSample">닫기</button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="Boolean(planToDelete)"
      title="해당 플랜을 삭제하시겠습니까?"
      description="삭제된 플랜은 복구할 수 없어요. 과거 증여 이력은 유지됩니다."
      danger
      @close="planToDelete = null"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <template #actions>
        <button class="secondary-button" type="button" @click="planToDelete = null">취소</button>
        <button class="danger-button" type="button" @click="confirmDelete">삭제하기</button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="Boolean(giftToDelete)"
      title="이 증여 이력을 삭제할까요?"
      description="삭제한 이력은 복구할 수 없고 10년 누적 증여액에서도 빠집니다."
      danger
      @close="giftToDelete = null"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <aside v-if="giftToDelete" class="info-callout compact">
        <AppIcon name="info" :size="18" />
        <p>
          {{ giftToDelete.date }}에 기록한 {{ formatCompactWon(giftToDelete.amount) }}이 사라지고,
          남은 공제 한도와 갱신 일정이 다시 계산돼요. 실제로 증여했던 건이라면 삭제 대신 그대로 두는
          편이 신고에 안전해요.
        </p>
      </aside>
      <template #actions>
        <button class="secondary-button" type="button" @click="giftToDelete = null">취소</button>
        <button
          class="danger-button"
          type="button"
          :disabled="deletingGift"
          @click="confirmGiftHistoryDelete"
        >
          {{ deletingGift ? '삭제 중...' : '삭제하기' }}
        </button>
      </template>
    </ModalSheet>

    <AddFamilyModal :show="showAddFamily" @close="showAddFamily = false" />
  </div>
</template>
