<script setup>
import { computed } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()
const latestNotifications = computed(() => store.state.notifications.slice(0, 2))

const guideCards = [
  {
    title: '미리줌 사용 가이드라인',
    //description: '가족 정보 등록부터 증여 시뮬레이션까지, 미리줌을 시작하는 방법을 안내합니다.',
    icon: 'sparkles',
    color: 'purple',
    to: '/guides/mirizoom',
  },
  {
    title: '과세 구간 확인하기',
    //description: '증여세 과세표준 구간과 세율을 한눈에 확인해 보세요.',
    icon: 'calculator',
    color: 'yellow',
    to: '/guides/tax-brackets',
  },
  {
    title: '증여 신고 방법 A-Z',
    //description: '신고 기한, 준비 서류, 홈택스 신고 절차를 순서대로 알려드립니다.',
    icon: 'check',
    color: 'green',
    to: '/guides/gift-reporting',
  },
  {
    title: '현금 외 증여에 대하여',
    //description: '부동산·주식 등 현금이 아닌 자산을 증여할 때의 핵심 사항입니다.',
    icon: 'arrow',
    color: 'blue',
    to: '/guides/non-cash-gifts',
  },
]
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
          <!-- <p>세금과 절차를 한눈에 비교해 보세요.</p> -->
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
          <span class="section-kicker">3분이면 충분해요</span>
          <h3>우리 가족 증여, 지금 바로 계산하기</h3>
          <!-- <p>공제 한도부터 10년 후 예상 자산까지 비교해 보세요.</p> -->
        </div>
        <RouterLink class="primary-button full" to="/simulation">
          증여 시뮬레이션 시작하기 <AppIcon name="arrow" :size="19" />
        </RouterLink>
      </section>
      <section class="section-block guide-overview">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">알아두면 쉬워요</span>
            <h2>증여 가이드</h2>
          </div>
        </div>

        <div class="guide-card-grid">
          <RouterLink v-for="guide in guideCards" :key="guide.to" :to="guide.to" class="guide-card">
            <span class="guide-card-icon" :class="guide.color">
              <AppIcon :name="guide.icon" :size="23" />
            </span>
            <span class="guide-card-copy">
              <strong>{{ guide.title }}</strong>
              <!-- <span>{{ guide.description }}</span> -->
            </span>
            <AppIcon class="guide-card-chevron" name="chevron" :size="18" />
          </RouterLink>
        </div>
      </section>

      <section class="section-block">
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
      </section>
    </div>
  </div>
</template>

<style scoped></style>
