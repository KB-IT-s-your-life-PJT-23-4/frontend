<script setup>
import { computed, onMounted } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()
// 서버 리마인더가 앞에 오므로 홈에는 급한 기한 알림이 먼저 노출된다.
const latestNotifications = computed(() => store.notifications.value.slice(0, 2))

// 홈에서도 알림을 보여주니 여기서 한 번 읽어 둔다. 이미 불러왔으면 재요청하지 않는다.
onMounted(() => {
  store.ensureStatusLoaded().catch(() => {})
})

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
        <div class="hero-copy">
          <span class="hero-kicker">미리 준비하는 가족의 다음 10년</span>
          <h2>증여, 미리 알면<br />가족의 계획이 쉬워져요.</h2>
          <!-- <p>세금과 운용 전략을 한눈에 비교해 보세요.</p> -->
        </div>
        <div class="hero-visual" aria-hidden="true">
          <span class="hero-coin coin-one">₩</span>
          <span class="hero-coin coin-two">10</span>
          <span class="hero-path" />
          <span class="hero-family-dot dot-one" />
          <span class="hero-family-dot dot-two" />
          <span class="hero-family-dot dot-three" />
        </div>
      </section>

      <section class="quick-card simulation-cta-card">
        <div class="quick-icon yellow"><AppIcon name="calculator" :size="23" /></div>
        <div class="quick-copy">
          <h3>우리 가족 증여, 지금 바로 계산하기</h3>
          <p>공제 한도부터 10년 후 예상 자산까지 비교해 보세요.</p>
        </div>
        <RouterLink class="primary-button full" to="/simulation">
          증여 시뮬레이션 시작하기 <AppIcon name="arrow" :size="19" />
        </RouterLink>
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
  </div>
</template>

<style scoped></style>
