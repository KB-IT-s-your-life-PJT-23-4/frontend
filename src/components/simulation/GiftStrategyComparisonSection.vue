<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import GiftAssetGrowthChart from './GiftAssetGrowthChart.vue'
import { formatCompactWon } from '../../utils/finance.js'
import '../../assets/css/simulation/gift-strategy-comparison-section.css'

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  recommendedScenario: {
    type: Object,
    required: true,
  },
  selectedProducts: {
    type: Object,
    default: () => ({}),
  },
  portfolioProfile: {
    type: String,
    default: 'BALANCED',
  },
})

const scenario = computed(() => props.recommendedScenario)
const portfolioProfileLabel = computed(
  () =>
    ({
      CONSERVATIVE: '안정형',
      BALANCED: '균형형',
      AGGRESSIVE: '성장형',
    })[props.portfolioProfile] ?? props.portfolioProfile,
)
const resultYearsLabel = computed(() => `${props.result.years}년`)
const donorPaysTax = computed(() => {
  const paymentMethod = props.result.raw?.input?.taxPaymentMethod
  if (paymentMethod) return paymentMethod === 'DONOR_PAYS'
  return Boolean(props.result.donorPaysTax)
})
const immediateScenario = computed(() =>
  props.result.results?.find((item) => item.scenarioType === 'IMMEDIATE'),
)
const splitScenario = computed(() =>
  props.result.results?.find((item) => item.scenarioType === 'TAX_OPTIMIZED'),
)
const comparisonScenarios = computed(() =>
  [immediateScenario.value, splitScenario.value].filter(Boolean),
)
const canCompareTaxes = computed(() => comparisonScenarios.value.length === 2)
const taxFreeScenario = computed(() => immediateScenario.value ?? scenario.value)

function isSmallTaxableBaseExempt(item) {
  const taxableAmount = Number(item?.taxableAmount ?? 0)
  const giftTax = Number(item?.giftTax ?? 0)
  return taxableAmount > 0 && taxableAmount < 500000 && giftTax === 0
}

const smallTaxableBaseExemption = computed(() => isSmallTaxableBaseExempt(taxFreeScenario.value))

function hasPayableTax(item) {
  return Number(item?.estimatedPayableTax ?? 0) > 0
}

const hasAnyPayableTax = computed(() => comparisonScenarios.value.some(hasPayableTax))

function scenarioComparisonLabel(item) {
  return item?.scenarioType === 'IMMEDIATE' ? '지금 전액 증여' : '공제 활용 분할 증여'
}

function isRecommended(item) {
  return (
    item?.resultId === scenario.value.resultId || item?.scenarioType === scenario.value.scenarioType
  )
}

const alternativeScenario = computed(() =>
  comparisonScenarios.value.find((item) => !isRecommended(item)),
)
const preparationLabel = computed(() =>
  donorPaysTax.value ? '주는 분 총 준비 금액' : '받는 분이 납부할 세금',
)
const taxAmountLabel = computed(() =>
  donorPaysTax.value ? '주는 분이 납부할 세금' : '받는 분이 납부할 세금',
)

function preparationAmount(item) {
  return Number(donorPaysTax.value ? item?.totalDonorOutflow : item?.estimatedPayableTax)
}

function estimatedTaxAmount(item) {
  return Number(item?.estimatedPayableTax ?? 0)
}

function donorRequiredAmount(item) {
  return Number(item?.totalDonorOutflow ?? 0)
}

function scenarioFutureValue(item) {
  const matchingPortfolio = item?.portfolios?.find(
    (portfolio) => portfolio.portfolioType === props.portfolioProfile,
  )
  const value = matchingPortfolio?.expectedFutureValue ?? item?.estimatedFutureValue
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function comparisonAmount(value) {
  return value == null ? '계산 정보 없음' : formatCompactWon(value)
}

function remainingUninvestedPrincipal(item) {
  return Math.max(0, Number(item?.postTaxAmount ?? 0) - Number(item?.investmentPrincipal ?? 0))
}

function scenarioEndTotalValue(item) {
  const investedFutureValue = scenarioFutureValue(item)
  if (investedFutureValue == null) return null
  return investedFutureValue + remainingUninvestedPrincipal(item)
}

const recommendedPreparationDifference = computed(
  () => preparationAmount(alternativeScenario.value) - preparationAmount(scenario.value),
)
const recommendedFutureValueDifference = computed(() => {
  const recommendedValue = scenarioEndTotalValue(scenario.value)
  const alternativeValue = scenarioEndTotalValue(alternativeScenario.value)
  if (recommendedValue == null || alternativeValue == null) return null
  return recommendedValue - alternativeValue
})
const visibleSchedule = computed(() =>
  scenario.value.giftSchedule.filter((item) => item.withinPeriod),
)
const reinvestmentSchedule = computed(() => {
  const grouped = new Map()
  Object.values(props.selectedProducts)
    .filter(Boolean)
    .forEach((product) => {
      ;(product.reinvestmentSchedule ?? []).forEach((item) => {
        const key = item.renewalDate
        if (!key) return
        const entry = grouped.get(key) ?? {
          date: key,
          products: [],
        }
        entry.products.push({
          id: product.id,
          name: product.name,
          type: product.type,
          trancheSequenceNo: item.trancheSequenceNo,
          renewalSequenceNo: item.renewalSequenceNo,
        })
        grouped.set(key, entry)
      })
    })
  return [...grouped.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
})
</script>

<template>
  <section class="gift-plan-timeline-card" aria-labelledby="gift-strategy-title">
    <header class="timeline-card-heading">
      <div>
        <div class="timeline-heading-meta">
          <h2 id="gift-strategy-title">
            {{
              result.exceedsDeduction
                ? `${scenario.scenarioName}가 더 유리해요`
                : '공제 한도 안에서 바로 증여할 수 있어요'
            }}
          </h2>
          <span class="timeline-count">
            기간 내 {{ visibleSchedule.length }}회 증여
            <template v-if="reinvestmentSchedule.length">
              · {{ reinvestmentSchedule.length }}회 재가입
            </template>
          </span>
        </div>

        <p>
          {{
            result.exceedsDeduction
              ? scenario.description
              : '공제 한도 안에서 전액을 바로 증여하고 운용할 수 있어요.'
          }}
        </p>
      </div>
    </header>

    <section
      v-if="canCompareTaxes && hasAnyPayableTax"
      class="tax-strategy-comparison"
      aria-labelledby="tax-comparison-title"
    >
      <div class="tax-comparison-options">
        <template v-for="(item, index) in comparisonScenarios" :key="item.resultId">
          <article class="tax-comparison-option" :class="{ 'is-recommended': isRecommended(item) }">
            <header>
              <span>{{ scenarioComparisonLabel(item) }}</span>
              <em v-if="isRecommended(item)">추천</em>
            </header>
            <div class="tax-comparison-metrics">
              <div class="is-primary">
                <small>{{ resultYearsLabel }} 후 예상 총 금액</small>
                <strong>{{ comparisonAmount(scenarioEndTotalValue(item)) }}</strong>
              </div>
              <div>
                <small>{{ taxAmountLabel }}</small>
                <strong>{{ formatCompactWon(estimatedTaxAmount(item)) }}</strong>
                <span>신고세액공제 3% 반영</span>
              </div>
              <div v-if="donorPaysTax">
                <small>주는 분 총 준비 금액</small>
                <strong>{{ formatCompactWon(donorRequiredAmount(item)) }}</strong>
              </div>
            </div>
            <p v-if="isSmallTaxableBaseExempt(item)" class="small-taxable-base-note">
              과세표준 {{ formatCompactWon(item.taxableAmount) }}은 50만 원 미만으로 증여세가
              부과되지 않아요.
            </p>
          </article>
        </template>
      </div>
    </section>

    <section
      v-else-if="!hasAnyPayableTax && taxFreeScenario"
      class="tax-free-investment-summary"
      aria-label="증여세액공제 후 운용 예상 결과"
    >
      <span class="tax-free-investment-icon"><AppIcon name="chart" :size="21" /></span>
      <div>
        <small>
          {{
            smallTaxableBaseExemption
              ? '과세표준 50만 원 미만으로 예상 세금 0원'
              : '세금 없이 바로 증여해 운용하면'
          }}
        </small>
        <strong>
          {{ resultYearsLabel }} 후
          <em>{{ comparisonAmount(scenarioEndTotalValue(taxFreeScenario)) }}</em>
        </strong>
        <p v-if="smallTaxableBaseExemption">
          공제 후 과세표준이 {{ formatCompactWon(taxFreeScenario.taxableAmount) }}으로 50만 원
          미만이어서 증여세가 부과되지 않아요.
        </p>
        <p v-else>
          공제 한도 안에서 전액을 바로 증여해 {{ portfolioProfileLabel }} 상품으로 운용한 예상
          결과예요.
        </p>
      </div>
    </section>

    <GiftAssetGrowthChart
      v-if="comparisonScenarios.length === 2"
      :result="result"
      :recommended-scenario="scenario"
      :selected-products="selectedProducts"
      :portfolio-profile="portfolioProfile"
    />
  </section>
</template>
