<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { PRODUCT_TYPE_META, formatCompactWon } from '../../utils/finance'
import '../../assets/css/portfolio-donut-card.css'

const props = defineProps({
  allocationProfiles: {
    type: Object,
    default: () => ({}),
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
  customizing: {
    type: Boolean,
    default: false,
  },
  customizationError: {
    type: String,
    default: '',
  },
  savingsMaximumRatio: {
    type: Number,
    default: 100,
  },
  customizable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:activeProfile', 'apply-custom'])

const portfolioProfiles = [
  { type: 'CONSERVATIVE', label: '안정형', color: '#5b8def' },
  { type: 'BALANCED', label: '균형형', color: '#e4a800' },
  { type: 'AGGRESSIVE', label: '성장형', color: '#ef7b77' },
]
const editing = ref(false)
const baseProfile = ref('BALANCED')
const draftAllocation = reactive({ DEPOSIT: 0, SAVINGS: 0, ETF: 0 })

const allocation = computed(() => {
  const profiles = props.allocationProfiles ?? {}
  return profiles[props.activeProfile] ?? profiles.BALANCED ?? Object.values(profiles)[0] ?? {}
})

const allocationItems = computed(() =>
  Object.entries(allocation.value)
    .filter(([, ratio]) => ratio > 0)
    .map(([type, ratio]) => ({
      type,
      ratio,
      ...PRODUCT_TYPE_META[type],
    })),
)

const donutStyle = computed(() => {
  const depositRatio = allocation.value.DEPOSIT ?? 0
  const savingsRatio = allocation.value.SAVINGS ?? 0
  return {
    '--deposit-stop': `${depositRatio}%`,
    '--savings-stop': `${depositRatio + savingsRatio}%`,
  }
})
const draftTotal = computed(
  () => draftAllocation.DEPOSIT + draftAllocation.SAVINGS + draftAllocation.ETF,
)
const draftTotalState = computed(() => {
  if (draftTotal.value === 100) return '총 비율 100%'
  if (draftTotal.value < 100) return `남은 비율 ${100 - draftTotal.value}%`
  return `${draftTotal.value - 100}% 초과`
})

function copyAllocation(source = allocation.value) {
  draftAllocation.DEPOSIT = Number(source?.DEPOSIT ?? 0)
  draftAllocation.SAVINGS = Number(source?.SAVINGS ?? 0)
  draftAllocation.ETF = Number(source?.ETF ?? 0)
}

function selectProfile(profile) {
  editing.value = false
  baseProfile.value = profile
  emit('update:activeProfile', profile)
}

function beginCustomizing() {
  baseProfile.value = props.activeProfile === 'CUSTOM' ? baseProfile.value : props.activeProfile
  copyAllocation()
  editing.value = true
}

function cancelCustomizing() {
  editing.value = false
  copyAllocation()
}

function applyCustom() {
  if (draftTotal.value !== 100 || props.customizing) return
  emit('apply-custom', {
    basePortfolioType: baseProfile.value,
    allocation: { ...draftAllocation },
  })
}

watch(
  () => props.activeProfile,
  (profile) => {
    if (profile !== 'CUSTOM') baseProfile.value = profile
    if (!editing.value) copyAllocation()
  },
)
watch(allocation, (next) => {
  if (!editing.value) copyAllocation(next)
})
watch(
  () => props.customizing,
  (current, previous) => {
    if (previous && !current && !props.customizationError) {
      editing.value = false
    }
  },
)
</script>

<template>
  <section class="portfolio-donut-card">
    <div class="portfolio-card-heading portfolio-card-heading-customizable">
      <div>
        <h2>{{ years }}년을 위한 운용 비중 제안</h2>
        <p>투자 성향별 추천 비율을 확인하거나 원하는 비율로 직접 조정해 보세요.</p>
      </div>
      <button
        v-if="customizable && !editing"
        type="button"
        class="portfolio-customize-button"
        @click="beginCustomizing"
      >
        비율 직접 조정
      </button>
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
        @click="selectProfile(profile.type)"
      >
        <span>{{ profile.label }}</span>
      </button>
      <span v-if="activeProfile === 'CUSTOM'" class="portfolio-custom-badge">직접 조정</span>
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

    <div v-if="editing" class="portfolio-custom-editor">
      <div class="portfolio-custom-editor-heading">
        <div>
          <strong>상품 비율 직접 조정</strong>
          <p>각 비율은 5% 단위로 조정하고 합계를 100%로 맞춰주세요.</p>
        </div>
        <span :class="{ invalid: draftTotal !== 100 }">{{ draftTotalState }}</span>
      </div>

      <div class="portfolio-ratio-controls">
        <label v-for="type in ['DEPOSIT', 'SAVINGS', 'ETF']" :key="type">
          <span>
            <i :style="{ background: PRODUCT_TYPE_META[type]?.color }" />
            {{ PRODUCT_TYPE_META[type]?.label }}
          </span>
          <input v-model.number="draftAllocation[type]" type="range" min="0" max="100" step="5" />
          <output>{{ draftAllocation[type] }}%</output>
        </label>
      </div>

      <p v-if="savingsMaximumRatio < 100" class="portfolio-savings-limit">
        적금은 현재 운용 기간과 월 납입 한도 기준으로 최대 약
        {{ savingsMaximumRatio }}%까지 적용할 수 있어요.
      </p>
      <p v-if="customizationError" class="portfolio-custom-error" role="alert">
        {{ customizationError }}
      </p>

      <div class="portfolio-custom-actions">
        <button type="button" class="portfolio-custom-cancel" @click="cancelCustomizing">
          취소
        </button>
        <button
          type="button"
          class="portfolio-custom-apply"
          :disabled="draftTotal !== 100 || customizing"
          @click="applyCustom"
        >
          {{ customizing ? '계산 중...' : '이 비율 적용하기' }}
        </button>
      </div>
    </div>

    <p class="portfolio-rule-note">
      예상 금액은 시뮬레이션 실행 시점의 상품 데이터로 계산한 참고 금액이며, 실제 수익률은 시장
      상황과 상품 조건에 따라 달라질 수 있어요.
    </p>
  </section>
</template>
