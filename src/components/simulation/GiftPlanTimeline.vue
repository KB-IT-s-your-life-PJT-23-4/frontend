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
  <section class="gift-plan-timeline-card" aria-labelledby="gift-strategy-title">
    <header class="timeline-card-heading">
      <h2 id="gift-strategy-title">
        {{
          result.exceedsDeduction
            ? '두 가지 증여 흐름을 비교했어요'
            : '공제 한도 안에서 준비할 수 있어요'
        }}
      </h2>
    </header>

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
        :aria-checked="
          result.exceedsDeduction ? selectedScenarioType === item.scenarioType : undefined
        "
        :disabled="!result.exceedsDeduction"
        @click="emit('update:selectedScenarioType', item.scenarioType)"
      >
        <div class="strategy-choice-heading">
          <span class="strategy-radio"><i /></span>
          <div>
            <h3>{{ item.scenarioName }}</h3>
          </div>
          <span v-if="item.scenarioType === 'TAX_OPTIMIZED'" class="recommend-badge"> 절세 </span>
        </div>

        <div class="strategy-metrics">
          <div>
            <span>예상 세금</span>
            <strong>{{ formatCompactWon(item.estimatedPayableTax) }}</strong>
          </div>
          <div>
            <span>{{ result.years }}년 후</span>
            <strong class="blue">{{ formatCompactWon(getFutureValue(item)) }}</strong>
          </div>
        </div>

        <p v-if="result.donorPaysTax" class="donor-tax-summary">
          주는 분이 준비할 총 금액
          <strong>{{ formatCompactWon(item.totalDonorOutflow) }}</strong>
        </p>
      </button>
    </div>

    <section class="selected-timeline-section" aria-labelledby="selected-timeline-title">
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
          {{ formatCompactWon(outsideSchedule[0].amount) }} 증여는 설정한 운용 기간 이후라 예상
          금액에 포함하지 않았어요.
        </p>
      </aside>
    </section>
  </section>
</template>
