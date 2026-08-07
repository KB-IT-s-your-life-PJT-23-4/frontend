<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import DateField from '../components/common/DateField.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import { useAppStore } from '../stores/appStore'
import { deductionProgress, toIsoDate } from '../utils/deduction'
import { formatCompactWon, formatWon, normalizeAmount } from '../utils/finance'
import '../assets/css/status-view.css'

const store = useAppStore()
const router = useRouter()
const showAddGift = ref(false)
const planToDelete = ref(null)
const giftToDelete = ref(null)
const deletingGift = ref(false)
const expandedPlanIds = ref([])

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
const history = computed(() =>
  store.state.giftHistory.filter((gift) => gift.familyId === family.value.id),
)
const todayDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

function planProgressCopy(plan) {
  const plannedGiftDate = String(plan.plannedGiftDate ?? '').replaceAll('.', '-')
  return plannedGiftDate && plannedGiftDate < todayDate ? '불리고 있어요' : '불릴 예정이에요'
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
      <section class="family-switcher" aria-label="수증자 선택">
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
          @click="router.push('/my')"
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
        <p>마이페이지에서 수증자를 등록하면 가족별 증여 현황과 공제 한도를 관리할 수 있어요.</p>
        <RouterLink class="primary-button" to="/my">수증자 등록하기</RouterLink>
      </section>

      <template v-else>
        <section v-if="familyPlans.length" class="active-plan-card">
          <div class="active-plan-visual">
            <div class="plan-orbit" />
            <span class="plan-coin">₩</span>
            <span class="plan-document"><AppIcon name="document" :size="31" /></span>
          </div>
          <div class="plan-card-copy">
            <div v-if="!familyPlans[0].readOnly" class="plan-card-eyebrow">
              <button type="button" aria-label="계획 삭제" @click="planToDelete = familyPlans[0]">
                <AppIcon name="trash" :size="17" />
              </button>
            </div>
            <h2>
              <template v-if="familyPlans[0].expectedFutureValue">
                {{ formatCompactWon(familyPlans[0].amount) }}을
                {{ formatCompactWon(familyPlans[0].expectedFutureValue) }}으로<br />
                {{ planProgressCopy(familyPlans[0]) }}
              </template>
              <template v-else>
                {{ formatCompactWon(familyPlans[0].amount) }}을 준비하고 있어요
              </template>
            </h2>
            <strong>{{ familyPlans[0].productName }}</strong>
            <div class="plan-card-meta">
              <span v-if="familyPlans[0].rate">예상 수익률 연 {{ familyPlans[0].rate }}%</span>
              <span>{{ familyPlans[0].giftDate }} 예정</span>
            </div>
          </div>
        </section>

        <section v-else class="empty-plan-card">
          <span><AppIcon name="calculator" :size="25" /></span>
          <h2>현재 저장한 증여 계획이 없어요</h2>
          <p>시뮬레이션을 돌려 우리 가족에게 맞는 계획을 만들어 보세요.</p>
          <RouterLink class="primary-button" to="/simulation">시뮬레이션 시작하기</RouterLink>
        </section>

        <section class="deduction-card">
          <div class="deduction-card-heading">
            <div>
              <span>
                10년 주기 증여공제 한도
                <template v-if="family.relation">
                  · {{ family.relation }}{{ family.isMinor ? '(미성년)' : '' }}
                </template>
              </span>
              <h2>{{ formatCompactWon(family.giftedAmount) }} 증여했어요</h2>
            </div>
            <strong>{{ progress }}%</strong>
          </div>
          <div class="progress-track large">
            <span :style="{ width: `${progress}%` }" />
          </div>
          <div class="overview-labels">
            <span>현재까지 {{ formatWon(family.giftedAmount) }}</span>
            <span>한도 {{ formatWon(family.deductionLimit) }}</span>
          </div>
          <p>
            <AppIcon name="info" :size="16" /> 추가 {{ formatCompactWon(remaining) }}까지 공제 한도
            안에서 증여할 수 있어요.
          </p>
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

        <section class="status-section">
          <div class="section-heading-row">
            <h2>증여 현황</h2>
            <span>{{ history.length + familyPlans.length }}건</span>
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
              <span>{{ familyPlans.length }}건</span>
            </div>
            <div v-if="familyPlans.length" class="ongoing-plan-list">
              <div
                v-for="plan in familyPlans"
                :key="plan.id"
                class="ongoing-plan-item"
                :class="{ open: isPlanExpanded(plan.id) }"
              >
                <div class="ongoing-plan-head">
                  <button
                    class="ongoing-plan-summary"
                    type="button"
                    :aria-expanded="isPlanExpanded(plan.id)"
                    :aria-controls="`plan-documents-${plan.id}`"
                    @click="togglePlan(plan.id)"
                  >
                    <div>
                      <strong>{{ formatCompactWon(plan.currentAmount || plan.amount) }}</strong>
                      <span>증여 신고 전</span>
                    </div>
                    <span class="ongoing-plan-aside">
                      <span class="status-pill">진행 중</span>
                      <span class="ongoing-plan-caret"><AppIcon name="chevron" :size="16" /></span>
                    </span>
                    <p>
                      <AppIcon name="info" :size="16" /> {{ plan.giftDate }} 일정과 신고 서류를 미리
                      확인하세요.
                    </p>
                  </button>
                  <button
                    class="row-delete-button ongoing-plan-delete"
                    type="button"
                    :aria-label="`${plan.giftDate} 진행 중인 증여 삭제`"
                    @click="planToDelete = plan"
                  >
                    <AppIcon name="trash" :size="16" />
                  </button>
                </div>

                <div
                  v-show="isPlanExpanded(plan.id)"
                  :id="`plan-documents-${plan.id}`"
                  class="plan-document-panel"
                >
                  <div class="plan-document-heading">
                    <div>
                      <span class="section-kicker">CHECKLIST</span>
                      <strong>필수 증빙 서류</strong>
                    </div>
                    <span class="yellow-text"
                      >{{ completedDocuments(plan.id) }}/{{
                        store.state.documents.length
                      }}
                      준비</span
                    >
                  </div>
                  <div class="document-list">
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
                      </div>
                    </div>
                  </div>
                  <button
                    v-if="!plan.readOnly && isPlanReadyToConfirm(plan.id)"
                    class="primary-button full confirm-gift-button"
                    type="button"
                    @click="planToConfirm = plan"
                  >
                    <AppIcon name="check" :size="16" /> 증여 확정하기
                  </button>
                </div>
              </div>
            </div>
            <p v-else-if="loading" class="empty-inline">진행 중인 증여를 불러오는 중이에요.</p>
            <p v-else-if="loadError" class="empty-inline">{{ loadError }}</p>
            <p v-else class="empty-inline">현재 진행 중인 증여가 없습니다.</p>
          </article>
        </section>
      </template>

      <section class="expert-card">
        <span class="expert-avatar"><AppIcon name="chat" :size="28" /></span>
        <div>
          <h2>증여 신고가 어려우신가요?</h2>
          <p>AI 상담으로 상황을 정리하고 전문가 상담을 준비해 보세요.</p>
        </div>
        <RouterLink class="primary-button" to="/chat">전문가 상담 준비</RouterLink>
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
  </div>
</template>
