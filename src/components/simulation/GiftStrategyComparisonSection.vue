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
const taxPayerLabel = computed(() =>
  donorPaysTax.value ? '주는 분이 세금 준비' : '받는 분이 세금 납부',
)
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

function preparationAmount(item) {
  return Number(donorPaysTax.value ? item?.totalDonorOutflow : item?.estimatedPayableTax)
}

function preparationDetail(item) {
  if (donorPaysTax.value) {
    return `증여액과 예상 세금 ${formatCompactWon(item?.estimatedPayableTax ?? 0)} 포함`
  }
  return `증여받은 분이 예상 세금 ${formatCompactWon(item?.estimatedPayableTax ?? 0)} 납부`
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

function endTotalValueDetail(item) {
  const investedFutureValue = scenarioFutureValue(item)
  const remainingPrincipal = remainingUninvestedPrincipal(item)
  if (investedFutureValue == null) return '운용 결과를 계산할 수 없어요'
  if (remainingPrincipal > 0) {
    return `운용 결과 ${formatCompactWon(
      investedFutureValue,
    )} + 아직 증여하지 않은 원금 ${formatCompactWon(remainingPrincipal)}`
  }
  return `${portfolioProfileLabel.value} 투자 성향의 운용 결과`
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
const comparisonReason = computed(() => {
  const recommendedLabel = scenarioComparisonLabel(scenario.value)
  const alternativeLabel = scenarioComparisonLabel(alternativeScenario.value)
  const preparationDifference = recommendedPreparationDifference.value
  const futureValueDifference = recommendedFutureValueDifference.value

  if (futureValueDifference == null) {
    if (preparationDifference > 0) {
      return `${recommendedLabel}는 ${preparationLabel.value}이 ${alternativeLabel}보다 ${formatCompactWon(
        preparationDifference,
      )} 적어 유리해요.`
    }
    return `세금 납부 조건과 증여 일정을 함께 반영해 ${recommendedLabel}를 추천해요.`
  }

  if (futureValueDifference > 0 && preparationDifference > 0) {
    return `${recommendedLabel}는 준비 금액을 ${formatCompactWon(
      preparationDifference,
    )} 줄이고, ${resultYearsLabel.value} 후 예상 총 금액은 ${formatCompactWon(
      futureValueDifference,
    )} 더 많아 유리해요.`
  }
  if (futureValueDifference > 0 && preparationDifference < 0) {
    return `${recommendedLabel}는 준비 금액이 ${formatCompactWon(
      Math.abs(preparationDifference),
    )} 더 들지만, ${resultYearsLabel.value} 후 예상 총 금액이 ${formatCompactWon(
      futureValueDifference,
    )} 더 많아 최종 결과가 유리해요.`
  }
  if (futureValueDifference > 0) {
    return `준비 금액은 같지만, ${recommendedLabel}의 ${resultYearsLabel.value} 후 예상 총 금액이 ${formatCompactWon(
      futureValueDifference,
    )} 더 많아 유리해요.`
  }
  if (futureValueDifference === 0 && preparationDifference > 0) {
    return `${resultYearsLabel.value} 후 예상 총 금액은 같지만, ${recommendedLabel}의 준비 금액이 ${formatCompactWon(
      preparationDifference,
    )} 적어 유리해요.`
  }
  return `세금 납부 조건과 증여 시점, ${resultYearsLabel.value} 후 예상 총 금액을 함께 반영해 ${recommendedLabel}를 추천해요.`
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
              <div>
                <small>{{ preparationLabel }}</small>
                <strong>{{ formatCompactWon(preparationAmount(item)) }}</strong>
                <span>{{ preparationDetail(item) }}</span>
              </div>
              <div>
                <small>{{ resultYearsLabel }} 후 예상 총 금액</small>
                <strong>{{ comparisonAmount(scenarioEndTotalValue(item)) }}</strong>
                <span>{{ endTotalValueDetail(item) }}</span>
              </div>
            </div>
            <p v-if="isSmallTaxableBaseExempt(item)" class="small-taxable-base-note">
              과세표준 {{ formatCompactWon(item.taxableAmount) }}은 50만 원 미만으로 증여세가
              부과되지 않아요.
            </p>
          </article>
          <span v-if="index === 0" class="tax-comparison-versus" aria-hidden="true">VS</span>
        </template>
      </div>

      <div class="tax-comparison-conclusion">
        <span><AppIcon name="check" :size="13" /></span>
        <p>{{ comparisonReason }}</p>
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
