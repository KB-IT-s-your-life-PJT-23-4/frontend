<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { formatCompactWon } from '../../utils/finance'

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  selectedScenarioType: {
    type: String,
    required: true,
  },
  futureValues: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:selectedScenarioType'])

const visibleScenarios = computed(() =>
  props.result.exceedsDeduction ? props.result.results : [props.result.results[0]],
)
const immediateScenario = computed(() =>
  props.result.results.find((item) => item.scenarioType === 'IMMEDIATE'),
)
const optimizedScenario = computed(() =>
  props.result.results.find((item) => item.scenarioType === 'TAX_OPTIMIZED'),
)
const taxSaving = computed(() =>
  Math.max(
    0,
    (immediateScenario.value?.estimatedPayableTax ?? 0) -
      (optimizedScenario.value?.estimatedPayableTax ?? 0),
  ),
)

function getFutureValue(scenario) {
  return props.futureValues[scenario.scenarioType] ?? scenario.estimatedFutureValue
}
</script>

<template>
  <section class="simulation-strategy-section">
    <div class="section-heading-row">
      <div>
        <span class="section-kicker">GIFT STRATEGY</span>
        <h2>{{ result.exceedsDeduction ? '두 가지 증여 흐름을 비교했어요' : '공제 한도 안에서 준비할 수 있어요' }}</h2>
      </div>
      <span v-if="result.exceedsDeduction" class="recommend-badge">비교 선택</span>
    </div>

    <div
      class="strategy-card-grid"
      :class="{ single: !result.exceedsDeduction }"
      :role="result.exceedsDeduction ? 'radiogroup' : undefined"
      aria-label="증여 전략 선택"
    >
      <button
        v-for="scenario in visibleScenarios"
        :key="scenario.scenarioType"
        type="button"
        class="strategy-choice-card"
        :class="{ selected: selectedScenarioType === scenario.scenarioType }"
        :role="result.exceedsDeduction ? 'radio' : undefined"
        :aria-checked="selectedScenarioType === scenario.scenarioType"
        :disabled="!result.exceedsDeduction"
        @click="emit('update:selectedScenarioType', scenario.scenarioType)"
      >
        <div class="strategy-choice-heading">
          <span class="strategy-radio"><i /></span>
          <div>
            <h3>{{ scenario.scenarioName }}</h3>
            <p>{{ scenario.description }}</p>
          </div>
        </div>

        <div class="strategy-metrics">
          <div>
            <span>지금 증여</span>
            <strong>{{ formatCompactWon(scenario.currentGiftAmount) }}</strong>
          </div>
          <div>
            <span>나중에 증여</span>
            <strong>{{ formatCompactWon(scenario.deferredGiftAmount) }}</strong>
          </div>
          <div>
            <span>신고공제 반영 세금</span>
            <strong>{{ formatCompactWon(scenario.estimatedPayableTax) }}</strong>
          </div>
          <div>
            <span>{{ result.years }}년 뒤 예상</span>
            <strong class="blue">{{ formatCompactWon(getFutureValue(scenario)) }}</strong>
          </div>
        </div>

        <p v-if="result.donorPaysTax" class="donor-tax-summary">
          주는 분이 준비할 총 금액
          <strong>{{ formatCompactWon(scenario.totalDonorOutflow) }}</strong>
        </p>
      </button>
    </div>

    <aside v-if="result.exceedsDeduction && taxSaving > 0" class="saving-callout">
      <AppIcon name="sparkles" :size="20" />
      <p>
        공제 한도부터 나누어 증여하면 신고세액공제 반영 기준 예상 세금을
        <strong>{{ formatCompactWon(taxSaving) }}</strong> 줄일 수 있어요.
      </p>
    </aside>
  </section>
</template>
