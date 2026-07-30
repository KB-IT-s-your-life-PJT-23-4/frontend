<script setup>
import { computed } from 'vue'
import { formatCompactWon } from '../../utils/finance'

const MIN_BAR_HEIGHT = 42
const MAX_BAR_HEIGHT = 145

const props = defineProps({
  principal: {
    type: Number,
    required: true,
  },
  futureValue: {
    type: Number,
    required: true,
  },
  years: {
    type: Number,
    required: true,
  },
})

const chartItems = computed(() => [
  {
    key: 'principal',
    label: '운용 원금',
    value: props.principal,
  },
  {
    key: 'future',
    label: `${props.years}년 후 예상`,
    value: props.futureValue,
  },
])

const maxValue = computed(() => Math.max(...chartItems.value.map((item) => item.value), 1))

function getBarHeight(value) {
  if (value <= 0) return '0px'
  const proportionalHeight = (value / maxValue.value) * MAX_BAR_HEIGHT
  return `${Math.max(MIN_BAR_HEIGHT, proportionalHeight)}px`
}
</script>

<template>
  <section class="investment-growth-card" aria-labelledby="investment-growth-title">
    <header class="investment-growth-heading">
      <h2 id="investment-growth-title">
        운용 원금이 {{ years }}년 후<br class="investment-mobile-break" />
        얼마나 달라질까요?
      </h2>
      <p>지금 선택한 상품의 수익률을 반영한 예상 결과예요.</p>
    </header>

    <div class="scenario-chart" :aria-label="`운용 원금과 ${years}년 후 예상 금액 비교`">
      <div v-for="chartItem in chartItems" :key="chartItem.key" class="chart-column">
        <div class="chart-value">
          {{ formatCompactWon(chartItem.value) }}
        </div>
        <div
          class="chart-bar"
          :class="{ future: chartItem.key === 'future' }"
          :style="{ height: getBarHeight(chartItem.value) }"
        />
        <strong>{{ chartItem.label }}</strong>
      </div>
    </div>
  </section>
</template>
