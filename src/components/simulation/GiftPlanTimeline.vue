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
const scenario = computed(
  () =>
    props.result.results.find((item) => item.scenarioType === props.selectedScenarioType) ??
    props.result.results[0],
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
const expectedFutureValue = computed(
  () => props.futureValues[scenario.value.scenarioType] ?? scenario.value.estimatedFutureValue,
)

function parseDate(value) {
  const parsed = new Date(`${String(value).replaceAll('.', '-')}T00:00:00`)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

const startDate = computed(() => parseDate(scenario.value.giftSchedule[0]?.date) ?? new Date())
const finishDate = computed(() => parseDate(props.result.endDate) ?? new Date())
const visibleSchedule = computed(() =>
  scenario.value.giftSchedule.filter((item) => item.withinPeriod),
)
const outsideSchedule = computed(() =>
  scenario.value.giftSchedule.filter((item) => !item.withinPeriod),
)

function getFutureValue(item) {
  return props.futureValues[item.scenarioType] ?? item.estimatedFutureValue
}

function getPosition(item) {
  const itemDate = parseDate(item.date)
  if (!itemDate) return 12
  const total = Math.max(1, finishDate.value.getTime() - startDate.value.getTime())
  const elapsed = itemDate.getTime() - startDate.value.getTime()
  return Math.min(78, Math.max(12, 12 + (elapsed / total) * 66))
}
</script>

<template>
  <section class="gift-plan-timeline-card">
    <div class="timeline-card-heading">
      <div>
        <h2>
          {{
            result.exceedsDeduction
              ? '두 가지 증여 흐름을 비교했어요'
              : '공제 한도 안에서 준비할 수 있어요'
          }}
        </h2>
      </div>
    </div>

    <div
      class="strategy-card-grid"
      :class="{ single: !result.exceedsDeduction }"
      :role="result.exceedsDeduction ? 'radiogroup' : undefined"
      aria-label="증여 전략 선택"
    >
      <button
        v-for="item in visibleScenarios"
        :key="item.scenarioType"
        type="button"
        class="strategy-choice-card"
        :class="{ selected: selectedScenarioType === item.scenarioType }"
        :role="result.exceedsDeduction ? 'radio' : undefined"
        :aria-checked="selectedScenarioType === item.scenarioType"
        :disabled="!result.exceedsDeduction"
        @click="emit('update:selectedScenarioType', item.scenarioType)"
      >
        <div class="strategy-choice-heading">
          <span class="strategy-radio"><i /></span>
          <div>
            <h3>{{ item.scenarioName }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </div>

        <div class="strategy-metrics">
          <div>
            <span>신고공제 반영 세금</span>
            <strong>{{ formatCompactWon(item.estimatedPayableTax) }}</strong>
          </div>
          <div>
            <span>{{ result.years }}년 뒤 예상</span>
            <strong class="blue">{{ formatCompactWon(getFutureValue(item)) }}</strong>
          </div>
        </div>

        <p v-if="result.donorPaysTax" class="donor-tax-summary">
          주는 분이 준비할 총 금액
          <strong>{{ formatCompactWon(item.totalDonorOutflow) }}</strong>
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

    <div class="timeline-roadmap-heading">
      <h3>선택한 전략의 증여 일정</h3>
      <span class="timeline-count">기간 내 {{ visibleSchedule.length }}회 증여</span>
    </div>

    <div class="gift-timeline" :aria-label="`${result.years}년 운용 기간 중 증여 일정`">
      <div class="gift-timeline-track">
        <span class="gift-timeline-fill" />
        <div
          v-for="item in visibleSchedule"
          :key="`${item.order}-${item.date}`"
          class="gift-timeline-point"
          :style="{ left: `${getPosition(item)}%` }"
        >
          <span class="timeline-dot"><AppIcon name="wallet" :size="14" /></span>
          <div class="timeline-point-copy">
            <strong>{{ item.label }}</strong>
            <span>{{ item.date }}</span>
            <b>{{ formatCompactWon(item.amount) }}</b>
          </div>
        </div>
        <div class="gift-timeline-end">
          <span class="timeline-end-dot"><AppIcon name="calendar" :size="14" /></span>
          <div>
            <strong>운용 마무리</strong>
            <span>{{ result.endDate }}</span>
          </div>
        </div>
      </div>
    </div>

    <aside v-if="outsideSchedule.length" class="timeline-outside-note">
      <AppIcon name="info" :size="17" />
      <p>
        {{ outsideSchedule[0].date }} 예정인
        {{ formatCompactWon(outsideSchedule[0].amount) }} 증여는 설정한 운용 기간 이후라 예상 금액에
        포함하지 않았어요.
      </p>
    </aside>
  </section>
</template>
