<script setup>
import { computed } from "vue";
import AppHeader from "../components/layout/AppHeader.vue";
import AppIcon from "../components/layout/AppIcon.vue";
import { useAppStore } from "../stores/appStore";
import { formatCompactWon, formatWon } from "../utils/finance";

const store = useAppStore();
const family = store.selectedFamily;
const progress = computed(() =>
  Math.min(
    100,
    Math.round((family.value.giftedAmount / family.value.deductionLimit) * 100),
  ),
);
const remaining = computed(() =>
  Math.max(0, family.value.deductionLimit - family.value.giftedAmount),
);
const latestNotifications = computed(() =>
  store.state.notifications.slice(0, 2),
);
</script>

<template>
  <div class="page home-page">
    <AppHeader />
    <div class="page-content home-content">
      <section class="hero-card">
        <div class="hero-orbit hero-orbit-one" />
        <div class="hero-orbit hero-orbit-two" />
        <div class="hero-copy">
          <span class="hero-kicker">우리 가족의 다음 10년</span>
          <h2>증여, 미리 알면<br />가족의 계획이 돼요.</h2>
          <p>세금과 운용 전략을 한눈에 비교해 보세요.</p>
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
        <div class="quick-icon yellow">
          <AppIcon name="calculator" :size="23" />
        </div>
        <div class="quick-copy">
          <span class="section-kicker">3분이면 충분해요</span>
          <h3>내 증여세, 지금 바로 계산하기</h3>
          <p>공제 한도와 10년 뒤 예상 자산까지 비교해요.</p>
        </div>
        <RouterLink class="primary-button full" to="/simulation">
          증여 시뮬레이션 시작하기
          <AppIcon name="arrow" :size="19" />
        </RouterLink>
      </section>

      <section class="section-block family-overview">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">현재 선택</span>
            <h2>{{ family.name }} 님의 증여 현황</h2>
          </div>
          <RouterLink class="text-link" to="/status"
            >자세히 <AppIcon name="chevron" :size="15"
          /></RouterLink>
        </div>

        <div class="family-tabs" role="tablist" aria-label="수증자 선택">
          <button
            v-for="item in store.state.families"
            :key="item.id"
            class="family-tab"
            :class="{ active: item.id === family.id }"
            type="button"
            role="tab"
            :aria-selected="item.id === family.id"
            @click="store.selectFamily(item.id)"
          >
            {{ item.name }}
          </button>
        </div>

        <article class="overview-card">
          <div class="overview-topline">
            <div>
              <span>최근 10년 누적 증여</span>
              <strong>{{ formatCompactWon(family.giftedAmount) }}</strong>
            </div>
            <div class="progress-badge">{{ progress }}%</div>
          </div>
          <div
            class="progress-track large"
            :aria-label="`공제 한도 ${progress}% 사용`"
          >
            <span :style="{ width: `${progress}%` }" />
          </div>
          <div class="overview-labels">
            <span>{{ formatWon(family.giftedAmount) }}</span>
            <span>공제 한도 {{ formatWon(family.deductionLimit) }}</span>
          </div>

          <div class="overview-grid">
            <div>
              <span>남은 공제 한도</span>
              <strong>{{ formatCompactWon(remaining) }}</strong>
            </div>
            <div>
              <span>다음 한도 갱신</span>
              <strong>{{ family.resetDate }}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="section-block">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">지금 필요한 것</span>
            <h2>놓치기 쉬운 일정을 챙겨드려요</h2>
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
            <span class="notice-icon" :class="item.type">
              <AppIcon
                :name="item.type === 'warning' ? 'clock' : 'check'"
                :size="18"
              />
            </span>
            <span class="notice-copy">
              <span class="notice-meta"
                >{{ item.badge }} · {{ item.time }}</span
              >
              <strong>{{ item.title }}</strong>
            </span>
            <AppIcon name="chevron" :size="16" />
          </RouterLink>
        </div>
      </section>

      <section class="consult-card">
        <div class="consult-icon"><AppIcon name="sparkles" :size="25" /></div>
        <div>
          <span class="section-kicker">어려운 세법도 쉽게</span>
          <h2>궁금한 건 미리줌 AI에게 물어보세요</h2>
          <p>FAQ와 관련 법령을 바탕으로 이해하기 쉽게 안내해요.</p>
        </div>
        <RouterLink class="secondary-button" to="/chat"
          >AI 상담 시작하기</RouterLink
        >
      </section>
    </div>
  </div>
</template>
