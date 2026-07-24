<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { formatCompactWon } from '../../utils/finance'

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  activeProductType: {
    type: String,
    required: true,
  },
  remaining: {
    type: Number,
    required: true,
  },
})

const immediateScenario = computed(() =>
  props.result.results.find((item) => item.scenarioType === 'IMMEDIATE'),
)
const optimizedScenario = computed(() =>
  props.result.results.find((item) => item.scenarioType === 'TAX_OPTIMIZED'),
)
const comparedScenarios = computed(() =>
  [immediateScenario.value, optimizedScenario.value].filter(Boolean),
)
const taxSaving = computed(() =>
  Math.max(0, (immediateScenario.value?.giftTax ?? 0) - (optimizedScenario.value?.giftTax ?? 0)),
)
const maxFutureValue = computed(() =>
  Math.max(...comparedScenarios.value.map((scenario) => getFutureValue(scenario)), 1),
)

function getFutureValue(scenario) {
  return (
    scenario.products.find((product) => product.type === props.activeProductType)
      ?.expectedFutureValue ?? 0
  )
}
</script>

<template>
  <section v-if="result.exceedsDeduction" class="scenario-comparison-section">
    <div class="section-heading-row">
      <div>
        <span class="section-kicker">SCENARIO</span>
        <h2>두 전략을 비교했어요</h2>
      </div>
      <span class="recommend-badge">절세 추천</span>
    </div>

    <div class="scenario-chart" aria-label="시나리오별 10년 뒤 예상 자산 비교">
      <div v-for="scenario in comparedScenarios" :key="scenario.scenarioType" class="chart-column">
        <div class="chart-value">
          {{ formatCompactWon(getFutureValue(scenario)) }}
        </div>
        <div
          class="chart-bar"
          :class="{
            recommended: scenario.scenarioType === 'TAX_OPTIMIZED',
          }"
          :style="{
            height: `${Math.max(42, (getFutureValue(scenario) / maxFutureValue) * 130)}px`,
          }"
        />
        <strong>{{ scenario.scenarioType === 'IMMEDIATE' ? '지금 전액' : '공제 우선' }}</strong>
      </div>
    </div>

    <aside class="saving-callout">
      <AppIcon name="sparkles" :size="20" />
      <p>
        공제 한도를 우선 활용하면 예상 증여세를
        <strong>{{ formatCompactWon(taxSaving) }}</strong> 줄일 수 있어요.
      </p>
    </aside>
  </section>

  <section v-else class="within-limit-card">
    <span class="success-mark"><AppIcon name="check" :size="24" /></span>
    <div>
      <span class="section-kicker">공제 한도 안이에요</span>
      <h2>예상 증여세는 0원입니다</h2>
      <p>
        증여 후에도 공제 한도가
        {{ formatCompactWon(remaining - result.requestedAmount) }} 남아요.
      </p>
    </div>
  </section>
</template>
