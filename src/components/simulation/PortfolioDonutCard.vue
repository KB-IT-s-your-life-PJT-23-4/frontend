<script setup>
import { computed } from 'vue'
import { PRODUCT_TYPE_META, formatCompactWon } from '../../utils/finance'

const props = defineProps({
  allocation: {
    type: Object,
    required: true,
  },
  expectedFutureValue: {
    type: Number,
    required: true,
  },
  years: {
    type: Number,
    required: true,
  },
})

const allocationItems = computed(() =>
  Object.entries(props.allocation)
    .map(([type, ratio]) => ({
      type,
      ratio,
      ...PRODUCT_TYPE_META[type],
    }))
    .filter((item) => item.ratio > 0),
)

const donutStyle = computed(() => {
  let cursor = 0
  const segments = allocationItems.value.map((item) => {
    const start = cursor
    cursor += item.ratio
    return `${item.color} ${start}% ${cursor}%`
  })
  return { background: `conic-gradient(${segments.join(', ')})` }
})
</script>

<template>
  <section class="portfolio-donut-card">
    <div class="portfolio-card-heading">
      <div>
        <h2>{{ years }}년을 위한 운용 비중</h2>
        <p>운용 기간을 기준으로 균형 있게 나눈 대표 포트폴리오예요.</p>
      </div>
      <span v-if="years >= 10" class="long-term-badge">장기 운용</span>
    </div>

    <div class="portfolio-donut-layout">
      <div
        class="portfolio-donut"
        :style="donutStyle"
        role="img"
        :aria-label="allocationItems.map((item) => `${item.label} ${item.ratio}%`).join(', ')"
      >
        <div class="portfolio-donut-center">
          <span>예상 금액</span>
          <strong>{{ formatCompactWon(expectedFutureValue) }}</strong>
        </div>
      </div>

      <div class="portfolio-legend">
        <div v-for="item in allocationItems" :key="item.type">
          <span class="portfolio-color" :style="{ background: item.color }" />
          <span>{{ item.label }}</span>
          <strong>{{ item.ratio }}%</strong>
        </div>
      </div>
    </div>

    <p v-if="years < 10" class="portfolio-rule-note">
      선택 상품의 현재 수익률 가정으로 계산한 참고 금액이에요. <br />
      저축보험은 10년 이상 장기 운용 조건에서 비교 항목에 포함돼요.
    </p>
    <p v-else class="portfolio-rule-note">
      선택 상품의 현재 수익률 가정으로 계산한 참고 금액이에요. <br />저축보험의 보험차익 비과세
      여부는 실제 납입 방식과 계약 유지 조건에 따라 달라져요.
    </p>
  </section>
</template>
