<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { formatCompactWon } from '../../utils/finance'

const MIN_BAR_HEIGHT = 42
const MAX_BAR_HEIGHT = 145
const MAX_WITHIN_LIMIT_BAR_HEIGHT = 130
const COMPARISON_EMPHASIS = 0.3

const props = defineProps({
  result: {
    type: Object,
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
  remaining: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update:selectedScenarioType'])

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
const overallValueRange = computed(() =>
  getValueRange(
    props.result.results.flatMap((scenario) =>
      scenario.products.map((product) => product.expectedFutureValue),
    ),
  ),
)
const activeValueRange = computed(() =>
  getValueRange(comparedScenarios.value.map((scenario) => getFutureValue(scenario))),
)
const scenarioSummaries = computed(() => {
  const visibleScenarios = props.result.exceedsDeduction
    ? props.result.results
    : [immediateScenario.value ?? props.result.results[0]].filter(Boolean)

  return visibleScenarios.map((scenario) => ({
    scenario,
    activeProduct: scenario.products.find((product) => product.type === props.activeProductType),
  }))
})
const withinLimitChartItems = computed(() => {
  if (props.result.exceedsDeduction) return []

  const summary = scenarioSummaries.value[0]
  if (!summary) return []

  return [
    {
      key: 'principal',
      label: '운용 원금',
      value: summary.scenario.postTaxAmount,
    },
    {
      key: 'future',
      label: '10년 뒤 예상',
      value: summary.activeProduct?.expectedFutureValue ?? 0,
    },
  ]
})
const withinLimitMaxValue = computed(() =>
  Math.max(...withinLimitChartItems.value.map((item) => item.value), 1),
)

function getFutureValue(scenario) {
  return (
    scenario.products.find((product) => product.type === props.activeProductType)
      ?.expectedFutureValue ?? 0
  )
}

function getValueRange(values) {
  const validValues = values.filter((value) => Number.isFinite(value) && value > 0)

  if (!validValues.length) return { min: 0, max: 0 }

  return {
    min: Math.min(...validValues),
    max: Math.max(...validValues),
  }
}

function getNormalizedValue(value, range) {
  if (value <= 0) return 0
  if (range.max === range.min) return 0.5

  return (value - range.min) / (range.max - range.min)
}

function getBarHeight(scenario) {
  const value = getFutureValue(scenario)
  if (value <= 0) return '0px'

  const overallRatio = getNormalizedValue(value, overallValueRange.value)
  const comparisonRatio = getNormalizedValue(value, activeValueRange.value)
  const emphasizedRatio =
    overallRatio * (1 - COMPARISON_EMPHASIS) + comparisonRatio * COMPARISON_EMPHASIS
  const height = MIN_BAR_HEIGHT + emphasizedRatio * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT)

  return `${height}px`
}

function getWithinLimitBarHeight(value) {
  if (value <= 0) return '0px'

  return `${(value / withinLimitMaxValue.value) * MAX_WITHIN_LIMIT_BAR_HEIGHT}px`
}
</script>

<template>
  <section
    class="simulation-scenario-section"
    :class="{ 'scenario-comparison-section': result.exceedsDeduction }"
  >
    <template v-if="result.exceedsDeduction">
      <div class="section-heading-row">
        <div>
          <h2>두 전략을 비교했어요</h2>
        </div>
        <span class="recommend-badge">절세 추천</span>
      </div>

      <div class="scenario-chart" aria-label="시나리오별 10년 뒤 예상 자산 비교">
        <div
          v-for="scenario in comparedScenarios"
          :key="scenario.scenarioType"
          class="chart-column"
        >
          <div class="chart-value">
            {{ formatCompactWon(getFutureValue(scenario)) }}
          </div>
          <div
            class="chart-bar"
            :class="{
              recommended: scenario.scenarioType === 'TAX_OPTIMIZED',
            }"
            :style="{
              height: getBarHeight(scenario),
            }"
          />
          <strong>{{ scenario.scenarioType === 'IMMEDIATE' ? '지금 전액' : '공제 우선' }}</strong>
        </div>
      </div>
    </template>

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

    <section class="result-summary-section">
      <div
        class="result-summary-grid"
        :class="{ single: !result.exceedsDeduction }"
        :role="result.exceedsDeduction ? 'radiogroup' : undefined"
        :aria-label="result.exceedsDeduction ? '증여 전략 선택' : undefined"
      >
        <button
          v-for="summary in scenarioSummaries"
          :key="summary.scenario.scenarioType"
          type="button"
          :role="result.exceedsDeduction ? 'radio' : undefined"
          class="result-summary-card"
          :class="{
            recommended: summary.scenario.scenarioType === 'TAX_OPTIMIZED',
            selected:
              result.exceedsDeduction && selectedScenarioType === summary.scenario.scenarioType,
          }"
          :aria-checked="
            result.exceedsDeduction
              ? selectedScenarioType === summary.scenario.scenarioType
              : undefined
          "
          :disabled="!result.exceedsDeduction"
          @click="emit('update:selectedScenarioType', summary.scenario.scenarioType)"
        >
          <span v-if="result.exceedsDeduction" class="scenario-selection-state">
            <i aria-hidden="true" />
            {{
              selectedScenarioType === summary.scenario.scenarioType ? '선택된 전략' : '전략 선택'
            }}
          </span>

          <div class="summary-card-heading">
            <div>
              <h2>
                {{ result.exceedsDeduction ? summary.scenario.scenarioName : '한도 내 증여 결과' }}
              </h2>
              <span class="scenario-description">
                {{
                  result.exceedsDeduction
                    ? summary.scenario.description
                    : '공제 한도 안에서 전액을 바로 증여하고 운용할 수 있어요.'
                }}
              </span>
            </div>
            <span class="tax-chip">
              예상 세금 {{ formatCompactWon(summary.scenario.giftTax) }}
            </span>
          </div>

          <div
            v-if="!result.exceedsDeduction"
            class="within-result-chart"
            aria-label="운용 원금과 10년 뒤 예상 금액 비교"
          >
            <div
              v-for="item in withinLimitChartItems"
              :key="item.key"
              class="within-result-chart-column"
            >
              <div class="within-result-chart-value">
                {{ formatCompactWon(item.value) }}
              </div>
              <div
                class="within-result-chart-bar"
                :class="{ future: item.key === 'future' }"
                :style="{ height: getWithinLimitBarHeight(item.value) }"
              />
              <strong>{{ item.label }}</strong>
            </div>
          </div>

          <div v-else class="metric-grid">
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

    <aside v-if="result.exceedsDeduction" class="saving-callout">
      <AppIcon name="sparkles" :size="20" />
      <p>
        공제 한도를 우선 활용하면 예상 증여세를
        <strong>{{ formatCompactWon(taxSaving) }}</strong> 줄일 수 있어요.
      </p>
    </aside>
  </section>
</template>
