<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import RiskCard from './RiskCard.vue'

const props = defineProps({
  activeProduct: {
    type: Object,
    required: true,
  },
})

const selectedMixedType = ref('DEPOSIT')

const selectedMixedProduct = computed(() =>
  props.activeProduct.recommendedProducts?.find(
    (product) => product.type === selectedMixedType.value,
  ),
)

const rateLabel = computed(() => {
  if (props.activeProduct.type === 'MIXED') return '포트폴리오 예상 수익률 (연)'
  if (props.activeProduct.type === 'ETF' || props.activeProduct.type === 'INSURANCE') {
    return '예상 수익률 (연)'
  }
  return '금리 (연, 세전)'
})

const productInfoUrl = computed(
  () => selectedMixedProduct.value?.siteUrl ?? props.activeProduct.siteUrl ?? 'https://www.kbstar.com',
)

function getMixedRatio(type) {
  return type === 'ETF' ? props.activeProduct.growthRatio : props.activeProduct.stableRatio
}
</script>

<template>
  <section class="recommended-product-card">
    <div class="product-brand-row">
      <span class="product-symbol">
        <AppIcon :name="activeProduct.type === 'ETF' ? 'chart' : 'wallet'" :size="21" />
      </span>
      <div>
        <h2>{{ activeProduct.name }}</h2>
        <span v-if="activeProduct.provider">{{ activeProduct.provider }}</span>
      </div>
    </div>

    <div v-if="activeProduct.type === 'MIXED'" class="mixed-product-selector">
      <button
        v-for="product in activeProduct.recommendedProducts"
        :key="product.type"
        class="mixed-product-option"
        :class="{ selected: selectedMixedType === product.type }"
        type="button"
        :aria-pressed="selectedMixedType === product.type"
        @click="selectedMixedType = product.type"
      >
        <span class="mixed-product-icon">
          <AppIcon :name="product.type === 'ETF' ? 'chart' : 'wallet'" :size="18" />
        </span>
        <strong>{{ product.label }}</strong>
        <span>{{ getMixedRatio(product.type) }}% 배분</span>
        <AppIcon
          v-if="selectedMixedType === product.type"
          class="mixed-product-check"
          name="check"
          :size="14"
        />
      </button>
    </div>

    <div v-if="activeProduct.type === 'MIXED' && selectedMixedProduct" class="mixed-product-detail">
      <div class="mixed-product-detail__heading">
        <div>
          <span>{{ selectedMixedProduct.provider }}</span>
          <h3>{{ selectedMixedProduct.name }}</h3>
        </div>
        <span class="mixed-product-detail__ratio">
          {{ getMixedRatio(selectedMixedProduct.type) }}%
        </span>
      </div>
      <div class="mixed-product-detail__facts">
        <div>
          <span>{{ selectedMixedProduct.type === 'ETF' ? '예상 수익률' : '금리 (연, 세전)' }}</span>
          <strong>연 {{ selectedMixedProduct.rate }}%</strong>
        </div>
        <div>
          <span>운용 비중</span>
          <strong>{{ getMixedRatio(selectedMixedProduct.type) }}%</strong>
        </div>
      </div>
    </div>

    <div class="product-metrics">
      <div>
        <span>{{ rateLabel }}</span>
        <strong>연 {{ activeProduct.rate }}%</strong>
      </div>
      <div>
        <span>운용기간</span>
        <strong>{{ activeProduct.period }}</strong>
      </div>
    </div>

    <RiskCard v-if="activeProduct.type === 'ETF'" :active-product="activeProduct" />

    <div class="product-description-note">
      <AppIcon name="info" :size="18" />
      <p>{{ activeProduct.description }}</p>
    </div>

    <div v-if="activeProduct.type === 'ETF'" class="isa-note">
      <AppIcon name="info" :size="17" /> ISA 계좌를 함께 활용하면 추가 절세 가능성을 살펴볼 수
      있어요.
    </div>
    <a class="secondary-button full" :href="productInfoUrl" target="_blank" rel="noreferrer">
      상품 정보 확인하기 <AppIcon name="arrow" :size="17" />
    </a>
  </section>
</template>
