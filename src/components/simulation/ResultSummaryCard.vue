<script setup>
import { computed } from 'vue'
import { formatCompactWon } from '../../utils/finance'

const props = defineProps({
  scenarios: {
    type: Array,
    required: true,
  },
  activeProductType: {
    type: String,
    required: true,
  },
})

const scenarioSummaries = computed(() =>
  props.scenarios.map((scenario) => ({
    scenario,
    activeProduct: scenario.products.find((product) => product.type === props.activeProductType),
  })),
)
</script>

<template>
  <section class="result-summary-section">
    <div class="section-heading-row">
      <div>
        <span class="section-kicker">RESULT</span>
        <h2>전략별 결과를 비교해 보세요</h2>
      </div>
    </div>

    <div class="result-summary-grid">
      <article
        v-for="summary in scenarioSummaries"
        :key="summary.scenario.scenarioType"
        class="result-summary-card"
        :class="{ recommended: summary.scenario.scenarioType === 'TAX_OPTIMIZED' }"
      >
        <div class="summary-card-heading">
          <div>
            <h2>{{ summary.scenario.scenarioName }}</h2>
            <span class="scenario-description">
              {{ summary.scenario.description }}
            </span>
          </div>
          <span class="tax-chip"> 예상 세금 {{ formatCompactWon(summary.scenario.giftTax) }} </span>
        </div>

        <div class="metric-grid">
          <div>
            <span>지금 증여</span>
            <strong>{{ formatCompactWon(summary.scenario.currentGiftAmount) }}</strong>
          </div>
          <div>
            <span>나중에 증여</span>
            <strong>{{ formatCompactWon(summary.scenario.deferredGiftAmount) }}</strong>
          </div>
          <div>
            <span>운용 원금</span>
            <strong>{{ formatCompactWon(summary.scenario.postTaxAmount) }}</strong>
          </div>
          <div>
            <span>10년 뒤 예상</span>
            <strong class="blue">
              {{ formatCompactWon(summary.activeProduct?.expectedFutureValue ?? 0) }}
            </strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
