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
  selectedScenarioType: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:selectedScenarioType'])

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
        <h2>전략별 결과를 비교해 보세요</h2>
      </div>
    </div>

    <div class="result-summary-grid" role="radiogroup" aria-label="증여 전략 선택">
      <button
        v-for="summary in scenarioSummaries"
        :key="summary.scenario.scenarioType"
        type="button"
        role="radio"
        class="result-summary-card"
        :class="{
          recommended: summary.scenario.scenarioType === 'TAX_OPTIMIZED',
          selected: selectedScenarioType === summary.scenario.scenarioType,
        }"
        :aria-checked="selectedScenarioType === summary.scenario.scenarioType"
        @click="emit('update:selectedScenarioType', summary.scenario.scenarioType)"
      >
        <span class="scenario-selection-state">
          <i aria-hidden="true" />
          {{ selectedScenarioType === summary.scenario.scenarioType ? '선택된 전략' : '전략 선택' }}
        </span>

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
      </button>
    </div>
  </section>
</template>
