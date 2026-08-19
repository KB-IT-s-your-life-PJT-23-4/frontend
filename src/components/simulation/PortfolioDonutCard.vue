<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
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
const allocationTypes = ['DEPOSIT', 'SAVINGS', 'ETF']
const editing = ref(false)
const baseProfile = ref('BALANCED')
const draftAllocation = reactive({ DEPOSIT: 0, SAVINGS: 0, ETF: 0 })
const allocationBar = ref(null)
let activeBoundary = null

const allocation = computed(() => {
  const profiles = props.allocationProfiles ?? {}
  return profiles[props.activeProfile] ?? profiles.BALANCED ?? Object.values(profiles)[0] ?? {}
})

const visibleAllocation = computed(() => (editing.value ? draftAllocation : allocation.value))
const selectedProfileType = computed(() =>
  editing.value
    ? baseProfile.value
    : props.activeProfile === 'CUSTOM'
      ? baseProfile.value
      : props.activeProfile,
)
const allocationItems = computed(() =>
  Object.entries(visibleAllocation.value)
    .filter(([, ratio]) => ratio > 0)
    .map(([type, ratio]) => ({
      type,
      ratio,
      ...PRODUCT_TYPE_META[type],
    })),
)

const donutStyle = computed(() => {
  const depositRatio = visibleAllocation.value.DEPOSIT ?? 0
  const savingsRatio = visibleAllocation.value.SAVINGS ?? 0
  return {
    '--deposit-stop': `${depositRatio}%`,
    '--savings-stop': `${depositRatio + savingsRatio}%`,
  }
})
const safeAssetBoundary = computed(() => draftAllocation.DEPOSIT + draftAllocation.SAVINGS)
const draftAllocationLabel = computed(() =>
  allocationTypes
    .map((type) => `${PRODUCT_TYPE_META[type]?.label} ${draftAllocation[type]}%`)
    .join(', '),
)

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function snapRatio(value) {
  return clamp(Math.round(Number(value || 0) / 5) * 5, 0, 100)
}

function setDraftAllocation(depositRatio, savingsRatio) {
  const deposit = clamp(snapRatio(depositRatio), 0, 100)
  const savings = clamp(snapRatio(savingsRatio), 0, 100 - deposit)
  draftAllocation.DEPOSIT = deposit
  draftAllocation.SAVINGS = savings
  draftAllocation.ETF = 100 - deposit - savings
}

function copyAllocation(source = allocation.value) {
  setDraftAllocation(source?.DEPOSIT, source?.SAVINGS)
}

function selectProfile(profile) {
  baseProfile.value = profile
  if (editing.value) return
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
  if (props.customizing) return
  emit('apply-custom', {
    basePortfolioType: baseProfile.value,
    allocation: { ...draftAllocation },
  })
}

function donorOrder(type) {
  if (type === 'DEPOSIT') return ['SAVINGS', 'ETF']
  if (type === 'SAVINGS') return ['ETF', 'DEPOSIT']
  return ['SAVINGS', 'DEPOSIT']
}

function receiverOrder(type) {
  if (type === 'DEPOSIT') return ['SAVINGS', 'ETF']
  if (type === 'SAVINGS') return ['ETF', 'DEPOSIT']
  return ['SAVINGS', 'DEPOSIT']
}

function canAdjustRatio(type, delta) {
  if (delta > 0) {
    return (
      draftAllocation[type] <= 95 && donorOrder(type).some((other) => draftAllocation[other] >= 5)
    )
  }
  return draftAllocation[type] >= 5
}

function adjustRatio(type, delta) {
  if (!canAdjustRatio(type, delta)) return
  const otherTypes = delta > 0 ? donorOrder(type) : receiverOrder(type)
  const other = otherTypes.find((candidate) =>
    delta > 0 ? draftAllocation[candidate] >= 5 : candidate !== type,
  )
  if (!other) return
  draftAllocation[type] += delta
  draftAllocation[other] -= delta
}

function updateBoundary(boundary, clientX) {
  const rect = allocationBar.value?.getBoundingClientRect()
  if (!rect?.width) return
  const ratio = snapRatio(((clientX - rect.left) / rect.width) * 100)
  if (boundary === 'deposit') {
    const nextDeposit = clamp(ratio, 0, safeAssetBoundary.value)
    setDraftAllocation(nextDeposit, safeAssetBoundary.value - nextDeposit)
    return
  }
  const nextSafeBoundary = clamp(ratio, draftAllocation.DEPOSIT, 100)
  setDraftAllocation(draftAllocation.DEPOSIT, nextSafeBoundary - draftAllocation.DEPOSIT)
}

function moveBoundary(event) {
  if (!activeBoundary) return
  updateBoundary(activeBoundary, event.clientX)
}

function stopBoundaryDrag() {
  activeBoundary = null
  window.removeEventListener('pointermove', moveBoundary)
  window.removeEventListener('pointerup', stopBoundaryDrag)
  window.removeEventListener('pointercancel', stopBoundaryDrag)
}

function startBoundaryDrag(boundary, event) {
  activeBoundary = boundary
  event.preventDefault()
  updateBoundary(boundary, event.clientX)
  window.addEventListener('pointermove', moveBoundary)
  window.addEventListener('pointerup', stopBoundaryDrag)
  window.addEventListener('pointercancel', stopBoundaryDrag)
}

function handleBoundaryKey(boundary, event) {
  const direction = ['ArrowRight', 'ArrowUp'].includes(event.key)
    ? 5
    : ['ArrowLeft', 'ArrowDown'].includes(event.key)
      ? -5
      : 0
  if (!direction) return
  event.preventDefault()
  if (boundary === 'deposit') {
    const nextDeposit = clamp(draftAllocation.DEPOSIT + direction, 0, safeAssetBoundary.value)
    setDraftAllocation(nextDeposit, safeAssetBoundary.value - nextDeposit)
    return
  }
  const nextSafeBoundary = clamp(safeAssetBoundary.value + direction, draftAllocation.DEPOSIT, 100)
  setDraftAllocation(draftAllocation.DEPOSIT, nextSafeBoundary - draftAllocation.DEPOSIT)
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

onBeforeUnmount(stopBoundaryDrag)
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
        :key="profile.type"
        type="button"
        :aria-pressed="selectedProfileType === profile.type"
        :class="{ active: selectedProfileType === profile.type }"
        :style="{ '--product-tab-color': profile.color }"
        @click="selectProfile(profile.type)"
      >
        <span>{{ profile.label }}</span>
      </button>
      <span v-if="activeProfile === 'CUSTOM' && !editing" class="portfolio-custom-badge">
        직접 조정
      </span>
    </div>

    <div class="portfolio-donut-layout" role="region" aria-label="상품 운용 비율과 예상 금액">
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
          <strong>상품 운용 비율</strong>
          <p>조절점을 움직이거나 버튼을 눌러 5% 단위로 조정할 수 있어요.</p>
        </div>
      </div>

      <div ref="allocationBar" class="portfolio-allocation-bar" :aria-label="draftAllocationLabel">
        <div
          v-for="type in allocationTypes"
          :key="type"
          class="portfolio-allocation-segment"
          :class="`is-${type.toLowerCase()}`"
          :style="{
            width: `${draftAllocation[type]}%`,
            background: PRODUCT_TYPE_META[type]?.color,
          }"
        >
          <span v-if="draftAllocation[type] >= 15">
            {{ PRODUCT_TYPE_META[type]?.label }} {{ draftAllocation[type] }}%
          </span>
        </div>
        <button
          type="button"
          class="portfolio-boundary-handle"
          :style="{ left: `${draftAllocation.DEPOSIT}%` }"
          role="slider"
          aria-label="예금과 적금 비율 경계"
          aria-valuemin="0"
          :aria-valuemax="safeAssetBoundary"
          :aria-valuenow="draftAllocation.DEPOSIT"
          @pointerdown="startBoundaryDrag('deposit', $event)"
          @keydown="handleBoundaryKey('deposit', $event)"
        />
        <button
          type="button"
          class="portfolio-boundary-handle"
          :style="{ left: `${safeAssetBoundary}%` }"
          role="slider"
          aria-label="적금과 ETF 비율 경계"
          :aria-valuemin="draftAllocation.DEPOSIT"
          aria-valuemax="100"
          :aria-valuenow="safeAssetBoundary"
          @pointerdown="startBoundaryDrag('safe', $event)"
          @keydown="handleBoundaryKey('safe', $event)"
        />
      </div>

      <div class="portfolio-ratio-controls">
        <div v-for="type in allocationTypes" :key="type" class="portfolio-ratio-row">
          <span class="portfolio-ratio-name">
            <i :style="{ background: PRODUCT_TYPE_META[type]?.color }" />
            {{ PRODUCT_TYPE_META[type]?.label }}
          </span>
          <div class="portfolio-ratio-stepper">
            <button
              type="button"
              :aria-label="`${PRODUCT_TYPE_META[type]?.label} 비율 5% 줄이기`"
              :disabled="!canAdjustRatio(type, -5)"
              @click="adjustRatio(type, -5)"
            >
              −
            </button>
            <output :aria-label="`${PRODUCT_TYPE_META[type]?.label} 비율`">
              {{ draftAllocation[type] }}%
            </output>
            <button
              type="button"
              :aria-label="`${PRODUCT_TYPE_META[type]?.label} 비율 5% 늘리기`"
              :disabled="!canAdjustRatio(type, 5)"
              @click="adjustRatio(type, 5)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <p class="portfolio-custom-guidance">
        비율을 바꾸어도 상품 선택 기준은 유지되며, 적용 후 예상 금액을 다시 계산해요.
      </p>

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
          :disabled="customizing"
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
