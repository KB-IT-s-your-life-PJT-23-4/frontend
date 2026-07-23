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
  <section class="risk-card" :class="activeProduct.type.toLowerCase()">
    <div class="risk-card-top">
      <span><AppIcon name="shield" :size="19" /> 위험도 분석</span>
      <strong>{{ activeProduct.risk }}</strong>
    </div>
    <div class="risk-scale">
      <span :style="{ width: activeProduct.type === 'ETF' ? '62%' : '22%' }" />
    </div>
    <p>
      {{
        activeProduct.type === 'ETF'
          ? '과거 변동성에 기반한 추정치로, 원금 손실 가능성이 있습니다. 장기 분산 관점으로 검토하세요.'
          : '예측 가능한 수익을 기대할 수 있지만 중도 해지 시 약정 이율보다 낮아질 수 있어요.'
      }}
    </p>
  </section>
</template>
