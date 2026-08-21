<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import DateField from '../components/common/DateField.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import brandMark from '../assets/brand-mark.png'
import { useAppStore } from '../stores/appStore'
import { deductionProgress, RELATION_OPTIONS } from '../utils/deduction'
import { formatCompactWon } from '../utils/finance'
import { resolveProfileImageUrl } from '../utils/profileImage'
import '../assets/css/home-view.css'

const store = useAppStore()
const latestNotifications = computed(() => store.notifications.value.slice(0, 2))

onMounted(() => {
  store.ensureStatusLoaded().catch(() => {})
})

const selectedFamily = store.selectedFamily
const selectedFamilyPlans = computed(() =>
  store.state.plans.filter((plan) => plan.familyId === selectedFamily.value.id),
)
const selectedFamilyHistory = computed(() =>
  store.state.giftHistory.filter((gift) => gift.familyId === selectedFamily.value.id),
)

const hasGiftRecord = computed(
  () => selectedFamilyPlans.value.length > 0 || selectedFamilyHistory.value.length > 0,
)
const hasRenewalSchedule = computed(() =>
  Boolean(
    selectedFamily.value?.nextRenewalDate ??
    (selectedFamily.value?.resetDate !== '미정' && selectedFamily.value?.resetDate),
  ),
)
const giftProgress = computed(() =>
  deductionProgress({
    usedAmount: selectedFamily.value?.giftedAmount ?? 0,
    deductionLimit: selectedFamily.value?.deductionLimit ?? 0,
  }),
)

const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const ringDashOffset = computed(() => RING_CIRCUMFERENCE * (1 - giftProgress.value / 100))

const familyPickerExpanded = ref(false)

function pickFamily(familyId) {
  store.selectFamily(familyId)
  familyPickerExpanded.value = false
}

const showAddFamily = ref(false)
const savingFamily = ref(false)
const BIRTH_DATE_MIN = '1900-01-01'
const birthDateMax = new Date().toISOString().slice(0, 10)
const familyForm = reactive({
  name: '',
  birthDate: '',
})

function openAddFamily() {
  familyPickerExpanded.value = false
  showAddFamily.value = true
}

async function submitFamily() {
  if (!familyForm.name || !familyForm.birthDate || savingFamily.value) return
  savingFamily.value = true
  try {
    await store.addFamily({
      ...familyForm,
      relation: RELATION_OPTIONS[0].code,
    })
    familyForm.name = ''
    familyForm.birthDate = ''
    showAddFamily.value = false
  } catch (error) {
    store.showToast(error.message || '수증자를 등록하지 못했습니다.', 'info')
  } finally {
    savingFamily.value = false
  }
}

const guideCards = [
  {
    title: '미리줌 이용 방법 알아보기',
    to: '/guides/mirizoom',
  },
  {
    title: '증여세 기준 확인하기',
    to: '/guides/tax-brackets',
  },
  {
    title: '증여 신고 준비하기',
    to: '/guides/gift-reporting',
  },
  {
    title: '현금 외 자산도 증여할 수 있나요?',
    to: '/guides/non-cash-gifts',
    description: '주식·부동산 등 현금 외 증여 시 유의점을 확인해요.',
  },
]

const learningSteps = guideCards.slice(0, 3)
const optionalGuide = guideCards[3]
</script>

<template>
  <div class="page home-page">
    <AppHeader show-login />
    <div class="page-content home-content">
      <section class="hero-card">
        <div class="hero-orbit hero-orbit-one" />
        <div class="hero-orbit hero-orbit-two" />
        <div class="hero-orbit-orbiter" aria-hidden="true">
          <span class="hero-orbit-dot" />
        </div>
        <img :src="brandMark" class="hero-brand-mark" alt="" aria-hidden="true" />
        <div class="hero-copy">
          <span class="hero-kicker">미리 준비하는 다음 10년</span>
          <h2>현금 증여,<br />미리 알면 쉬워요.</h2>
          <!-- <p>세금과 운용 전략을 한눈에 비교해 보세요.</p> -->
        </div>

        <RouterLink to="/simulation" class="hero-cta-button">
          증여 시뮬레이션 시작하기 <AppIcon name="arrow" :size="18" />
        </RouterLink>

        <!-- <div class="hero-visual" aria-hidden="true">
          <span class="hero-coin coin-one">₩</span>
          <span class="hero-coin coin-two">10</span>
          <span class="hero-path" />
          <span class="hero-family-dot dot-one" />
          <span class="hero-family-dot dot-two" />
          <span class="hero-family-dot dot-three" />
        </div> -->
      </section>
      <section v-if="store.state.families.length > 0" class="quick-card home-gift-summary-card">
        <div class="home-gift-summary-head">
          <Transition name="family-picker-swap" mode="out-in">
            <button
              v-if="!familyPickerExpanded"
              key="trigger"
              type="button"
              class="home-gift-summary-family-trigger"
              aria-expanded="false"
              aria-label="자녀 선택"
              @click="familyPickerExpanded = true"
            >
              <span class="home-family-picker-avatar is-mini" :class="selectedFamily.tone">
                <img
                  v-if="selectedFamily.familyImg"
                  :src="resolveProfileImageUrl(selectedFamily.familyImg)"
                  alt=""
                />
                <template v-else>{{ selectedFamily.name.slice(-2) }}</template>
              </span>
              <strong>{{ selectedFamily.name }}의 증여 현황</strong>
              <AppIcon name="chevron" :size="14" class="home-gift-summary-family-chevron" />
            </button>

            <div v-else key="row" class="home-family-picker-row">
              <button
                v-for="item in store.state.families"
                :key="item.id"
                type="button"
                class="home-family-picker-avatar is-mini"
                :class="[item.tone, { active: item.id === selectedFamily.id }]"
                @click="pickFamily(item.id)"
              >
                <img v-if="item.familyImg" :src="resolveProfileImageUrl(item.familyImg)" alt="" />
                <template v-else>{{ item.name.slice(-2) }}</template>
              </button>
              <button
                type="button"
                class="home-family-picker-avatar is-mini is-add"
                aria-label="자녀 추가"
                @click="openAddFamily"
              >
                <AppIcon name="plus" :size="14" />
              </button>
            </div>
          </Transition>
        </div>

        <RouterLink
          to="/status"
          class="home-gift-summary-body"
          :aria-label="`${selectedFamily.name} 증여 현황 자세히 보기`"
        >
          <template v-if="hasGiftRecord">
            <div class="home-gift-summary-ring">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle class="home-gift-summary-ring-track" cx="60" cy="60" r="52" />
                <circle
                  class="home-gift-summary-ring-progress"
                  cx="60"
                  cy="60"
                  r="52"
                  :style="{
                    strokeDasharray: `${RING_CIRCUMFERENCE}px`,
                    strokeDashoffset: `${ringDashOffset}px`,
                  }"
                />
              </svg>
              <div class="home-gift-summary-ring-center">
                <strong>{{ giftProgress }}%</strong>
                <span>한도 사용</span>
              </div>
            </div>

            <div class="home-gift-summary-stats">
              <div>
                <AppIcon name="wallet" :size="18" />
                <strong>{{ formatCompactWon(selectedFamily.giftedAmount) }}</strong>
                <span>총 증여액</span>
              </div>
              <div>
                <AppIcon name="calendar" :size="18" />
                <strong>{{ hasRenewalSchedule ? selectedFamily.resetLabel : '미정' }}</strong>
                <span>갱신 남음</span>
              </div>
              <div>
                <AppIcon name="document" :size="18" />
                <strong>{{ selectedFamilyHistory.length }}건</strong>
                <span>증여 이력</span>
              </div>
            </div>
          </template>

          <div v-else class="home-gift-summary-empty">
            <AppIcon name="document" :size="20" />
            <span>증여 이력이 없습니다.</span>
          </div>
        </RouterLink>

        <RouterLink to="/status" class="home-gift-summary-link">
          전체 현황 보기 <AppIcon name="arrow" :size="14" />
        </RouterLink>
      </section>
      <section v-else class="quick-card home-family-empty-card">
        <div class="home-family-empty-icon">
          <AppIcon name="user" :size="22" />
        </div>
        <div class="home-family-empty-copy">
          <strong>등록된 수증자가 없어요</strong>
          <span>수증자를 등록하면 자녀별 증여 한도와 현황을 관리할 수 있어요.</span>
        </div>
        <button
          type="button"
          class="primary-button home-family-empty-button"
          @click="openAddFamily"
        >
          수증자 등록하기
        </button>
      </section>

      <section class="section-block guide-overview">
        <div class="section-heading-row guide-overview-heading">
          <div>
            <h2>복잡한 증여, 차근차근 알아보기</h2>
          </div>
        </div>
        <div class="home-guide-learning-path">
          <div class="home-guide-step-list">
            <RouterLink
              v-for="(guide, index) in learningSteps"
              :key="guide.to"
              :to="guide.to"
              class="quick-card home-guide-step-card"
              :class="`step-${index + 1}`"
            >
              <span class="step-number home-guide-step-number">
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <span class="home-guide-step-copy">
                <strong>{{ guide.title }}</strong>
                <span v-if="guide.description">{{ guide.description }}</span>
              </span>
              <span class="home-guide-step-arrow">
                <AppIcon name="arrow" :size="16" />
              </span>
            </RouterLink>
          </div>

          <RouterLink :to="optionalGuide.to" class="quick-card home-guide-optional-card">
            <span class="home-guide-optional-label">한 걸음 더</span>
            <span class="home-guide-optional-copy">
              <strong>{{ optionalGuide.title }}</strong>
              <span>{{ optionalGuide.description }}</span>
            </span>
            <span class="home-guide-step-arrow">
              <AppIcon name="arrow" :size="16" />
            </span>
          </RouterLink>
        </div>
      </section>

      <!-- <section class="section-block">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">지금 확인해 보세요</span>
            <h2>놓치기 쉬운 일정과 챙겨야 할 내용</h2>
          </div>
          <RouterLink class="text-link" to="/notifications"
            >전체 <AppIcon name="chevron" :size="15"
          /></RouterLink>
        </div>
        <div class="notification-preview-list">
          <RouterLink
            v-for="item in latestNotifications"
            :key="item.id"
            class="notification-preview"
            to="/notifications"
          >
            <span class="notice-icon" :class="item.type"
              ><AppIcon :name="item.type === 'warning' ? 'clock' : 'check'" :size="18"
            /></span>
            <span class="notice-copy"
              ><span class="notice-meta">{{ item.badge }} · {{ item.time }}</span
              ><strong>{{ item.title }}</strong></span
            >
            <AppIcon name="chevron" :size="16" />
          </RouterLink>
        </div>
      </section>

      <section class="consult-card">
        <div class="consult-icon"><AppIcon name="sparkles" :size="25" /></div>
        <div>
          <span class="section-kicker">어려운 부분은 쉽게</span>
          <h2>궁금한 건 미리줌 AI에게 물어보세요.</h2>
          <p>FAQ와 관련 법령을 바탕으로 이해하기 쉽게 안내해요.</p>
        </div>
        <RouterLink class="secondary-button" to="/chat">AI 상담 시작하기</RouterLink>
      </section> -->
    </div>

    <ModalSheet
      :show="showAddFamily"
      title="수증자 정보를 등록할까요?"
      description="이름과 관계, 생년월일을 입력하면 가족별 증여 한도를 따로 관리할 수 있어요."
      @close="showAddFamily = false"
    >
      <form id="home-family-form" class="modal-form" @submit.prevent="submitFamily">
        <label>
          <span>이름</span>
          <input
            v-model.trim="familyForm.name"
            type="text"
            placeholder="이름을 입력하세요"
            required
          />
        </label>
        <label>
          <span>관계</span>
          <input :value="RELATION_OPTIONS[0].label" type="text" readonly aria-readonly="true" />
        </label>
        <div class="date-field-row">
          <span>생년월일</span>
          <DateField
            v-model="familyForm.birthDate"
            :min="BIRTH_DATE_MIN"
            :max="birthDateMax"
            placeholder="생년월일을 선택하세요"
            aria-label="생년월일 선택"
          />
        </div>
      </form>
      <template #actions>
        <button class="secondary-button" type="button" @click="showAddFamily = false">취소</button>
        <button
          class="primary-button"
          type="submit"
          form="home-family-form"
          :disabled="savingFamily || !familyForm.birthDate"
        >
          {{ savingFamily ? '등록 중...' : '등록' }}
        </button>
      </template>
    </ModalSheet>
  </div>
</template>

<style scoped></style>
