<script setup>
import { formatCompactWon } from '../../utils/finance'

defineProps({
  selectedScenario: {
    type: Object,
    required: true,
  },
  activeProduct: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="result-summary-card">
    <div class="summary-card-heading">
      <div>
        <span class="section-kicker">선택한 전략</span>
        <h2>{{ selectedScenario.scenarioName }}</h2>
      </div>
      <span class="tax-chip">예상 세금 {{ formatCompactWon(selectedScenario.giftTax) }}</span>
    </div>
    <div class="metric-grid">
      <div>
        <span>지금 증여</span>
        <strong>{{ formatCompactWon(selectedScenario.currentGiftAmount) }}</strong>
      </div>
      <div>
        <span>나중에 증여</span>
        <strong>{{ formatCompactWon(selectedScenario.deferredGiftAmount) }}</strong>
      </div>
      <div>
        <span>운용 원금</span>
        <strong>{{ formatCompactWon(selectedScenario.postTaxAmount) }}</strong>
      </div>
      <div>
        <span>10년 뒤 예상</span>
        <strong class="blue">{{ formatCompactWon(activeProduct.expectedFutureValue) }}</strong>
      </div>
    </div>
  </section>
</template>
