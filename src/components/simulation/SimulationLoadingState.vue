<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import '../../assets/css/simulation-loading-state.css'

const props = defineProps({
  mode: {
    type: String,
    default: 'initial',
    validator: (value) => ['initial', 'history'].includes(value),
  },
})

const content = computed(() =>
  props.mode === 'history'
    ? {
        title: '저장한 시뮬레이션을\n불러오고 있어요',
        description: '계산 당시의 증여 일정과 상품 정보를 그대로 확인하고 있어요.',
        steps: ['추천 증여 일정', '투자 성향별 포트폴리오', '상품 데이터 스냅샷'],
      }
    : {
        title: '증여 설계를 위한 정보를\n준비하고 있어요',
        description: '등록한 수증자의 증여 이력과 남은 공제 한도를 확인하고 있어요.',
        steps: ['수증자 기본 정보', '최근 10년 증여 이력', '남은 증여재산공제'],
      },
)
</script>

<template>
  <main
    class="page-content simulation-loading-content"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <section class="simulation-loading-hero">
      <span class="section-kicker">{{ content.kicker }}</span>
      <h2>
        <template v-for="(line, index) in content.title.split('\n')" :key="line">
          <br v-if="index" />
          {{ line }}
        </template>
      </h2>
      <p>{{ content.description }}</p>
    </section>

    <section class="simulation-loading-card" aria-label="시뮬레이션 정보 불러오는 중">
      <div class="simulation-loading-visual" aria-hidden="true">
        <span class="loading-orbit loading-orbit-outer" />
        <span class="loading-orbit loading-orbit-inner" />
        <span class="loading-satellite loading-satellite-wallet">
          <AppIcon name="wallet" :size="18" />
        </span>
        <span class="loading-satellite loading-satellite-chart">
          <AppIcon name="chart" :size="18" />
        </span>
        <span class="loading-core">
          <AppIcon name="calculator" :size="29" />
        </span>
      </div>

      <div class="simulation-loading-copy">
        <span>맞춤 결과를 준비하는 중</span>
        <strong>잠시만 기다려 주세요</strong>
      </div>

      <div class="simulation-loading-progress" aria-hidden="true">
        <span />
      </div>

      <ul class="simulation-loading-steps" aria-hidden="true">
        <li v-for="(step, index) in content.steps" :key="step">
          <span>{{ index + 1 }}</span>
          <p>{{ step }}</p>
          <i />
        </li>
      </ul>
    </section>

    <p class="simulation-loading-note">
      <AppIcon name="shield" :size="15" />
      실행 당시 기준으로 안전하게 불러오고 있어요.
    </p>
  </main>
</template>
