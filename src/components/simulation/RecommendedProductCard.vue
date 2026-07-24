<script setup>
import AppIcon from '../layout/AppIcon.vue'

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
      <span class="product-symbol">
        <AppIcon :name="activeProduct.type === 'ETF' ? 'chart' : 'wallet'" :size="21" />
      </span>
      <div>
        <h2>{{ activeProduct.name }}</h2>
        <span>{{ activeProduct.provider }}</span>
      </div>
      <span class="risk-pill">{{ activeProduct.risk }}</span>
    </div>

    <div class="product-metrics">
      <div>
        <span>금리 (연, 세전)</span>
        <strong>연 {{ activeProduct.rate }}%</strong>
      </div>
      <div>
        <span>운용기간</span>
        <strong>{{ activeProduct.period }}</strong>
      </div>
    </div>

    <div class="product-description-note">
      <AppIcon name="info" :size="18" />
      <p>{{ activeProduct.description }}</p>
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
