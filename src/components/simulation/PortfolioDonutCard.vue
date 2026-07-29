<script setup>
import { computed } from 'vue'
import { PRODUCT_TYPE_META, formatCompactWon } from '../../utils/finance'

const props = defineProps({
  allocationProfiles: {
    type: Object,
    required: true,
  },
  activeProfile: {
    type: String,
    default: 'BALANCED',
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

const emit = defineEmits(['update:activeProfile'])

const portfolioProfiles = [
  { type: 'STABLE', label: '안정형', color: '#5b8def' },
  { type: 'BALANCED', label: '균형형', color: '#e4a800' },
  { type: 'GROWTH', label: '성장형', color: '#ef7b77' },
]

const allocation = computed(
  () => props.allocationProfiles[props.activeProfile] ?? props.allocationProfiles.BALANCED ?? {},
)

const allocationItems = computed(() => {
  return Object.entries(allocation.value)
    .filter(([, ratio]) => ratio > 0)
    .map(([type, ratio]) => ({
      type,
      ratio,
      ...PRODUCT_TYPE_META[type],
    }))
})

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
        <p>투자 성향을 선택해 상품별 운용 비중을 비교해 보세요.</p>
      </div>
    </div>

    <div class="product-category-tabs portfolio-profile-tabs" role="tablist" aria-label="투자 성향">
      <button
        v-for="profile in portfolioProfiles"
        :id="`portfolio-tab-${profile.type}`"
        :key="profile.type"
        type="button"
        role="tab"
        :aria-selected="activeProfile === profile.type"
        :aria-controls="`portfolio-panel-${profile.type}`"
        :class="{ active: activeProfile === profile.type }"
        :style="{ '--product-tab-color': profile.color }"
        @click="emit('update:activeProfile', profile.type)"
      >
        <span>{{ profile.label }}</span>
      </button>
    </div>

    <div
      :id="`portfolio-panel-${activeProfile}`"
      class="portfolio-donut-layout"
      role="tabpanel"
      :aria-labelledby="`portfolio-tab-${activeProfile}`"
    >
      <div class="portfolio-donut-visual">
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
      </div>

      <div class="portfolio-allocation-summary" aria-label="상품별 운용 비중">
        <strong class="portfolio-allocation-title">상품별 비중</strong>
        <div
          v-for="item in allocationItems"
          :key="item.type"
          class="portfolio-allocation-row"
          :style="{ '--segment-color': item.color }"
        >
          <span class="portfolio-color" />
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
