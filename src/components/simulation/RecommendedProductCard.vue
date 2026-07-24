<script setup>
import AppIcon from '../layout/AppIcon.vue'
import { formatCompactWon } from '../../utils/finance'

defineProps({
  activeProduct: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="recommended-product-card">
    <div class="product-brand-row">
      <span class="product-symbol" :style="{ background: activeProduct.color }">
        <AppIcon :name="activeProduct.type === 'ETF' ? 'chart' : 'wallet'" :size="21" />
      </span>
      <div>
        <span>{{ activeProduct.provider }}</span>
        <h2>{{ activeProduct.name }}</h2>
      </div>
      <span class="risk-pill">{{ activeProduct.risk }}</span>
    </div>
    <p>{{ activeProduct.description }}</p>
    <div class="product-metrics">
      <div>
        <span>가정 수익률</span>
        <strong>연 {{ activeProduct.rate }}%</strong>
      </div>
      <div>
        <span>예상 수익</span>
        <strong>+{{ formatCompactWon(activeProduct.expectedProfit) }}</strong>
      </div>
      <div>
        <span>10년 예상 자산</span>
        <strong>{{ formatCompactWon(activeProduct.expectedFutureValue) }}</strong>
      </div>
    </div>
    <div v-if="activeProduct.type === 'ETF'" class="isa-note">
      <AppIcon name="info" :size="17" /> ISA 계좌를 함께 활용하면 추가 절세 가능성을 살펴볼 수
      있어요.
    </div>
    <a class="secondary-button full" href="https://www.kbstar.com" target="_blank" rel="noreferrer">
      상품 정보 확인하기 <AppIcon name="arrow" :size="17" />
    </a>
  </section>
</template>
