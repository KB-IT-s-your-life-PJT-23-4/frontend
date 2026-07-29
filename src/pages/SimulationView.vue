<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import GiftPlanTimeline from '../components/simulation/GiftPlanTimeline.vue'
import InvestmentGrowthChart from '../components/simulation/InvestmentGrowthChart.vue'
import PortfolioDonutCard from '../components/simulation/PortfolioDonutCard.vue'
import ProductSelectionPanel from '../components/simulation/ProductSelectionPanel.vue'
import SavePlanModal from '../components/simulation/SavePlanModal.vue'
import SimulationInputContent from '../components/simulation/SimulationInputContent.vue'
import { products } from '../data/mockData'
import { api } from '../api/apiAdapter'
import { useAppStore } from '../stores/appStore'
import {
  calculatePortfolioValue,
  formatCompactWon,
  formatWon,
  getPortfolioAllocations,
  normalizeAmount,
} from '../utils/finance'

const store = useAppStore()
const router = useRouter()
const selectedFamilyId = ref(store.state.selectedFamilyId)
const amountText = ref('')
const investmentYears = ref(10)
const donorPaysTax = ref(false)
const result = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const selectedPortfolioType = ref('BALANCED')
const showSaveModal = ref(false)
const saving = ref(false)
const selectedProducts = reactive({})

const family = computed(
  () =>
    store.state.families.find((item) => item.id === Number(selectedFamilyId.value)) ??
    store.selectedFamily.value,
)
const amount = computed(() => normalizeAmount(amountText.value))
const remaining = computed(() =>
  Math.max(0, family.value.deductionLimit - family.value.giftedAmount),
)
const allocationProfiles = computed(() =>
  getPortfolioAllocations(result.value?.years ?? investmentYears.value),
)
const portfolioAllocation = computed(() => {
  const profiles = allocationProfiles.value
  return profiles[selectedPortfolioType.value] ?? profiles.BALANCED ?? {}
})
const futureValues = computed(() => {
  if (!result.value) return {}
  return Object.fromEntries(
    result.value.results.map((scenario) => [
      scenario.scenarioType,
      calculatePortfolioValue({
        schedule: scenario.giftSchedule,
        allocation: portfolioAllocation.value,
        selectedProducts,
        years: result.value.years,
      }),
    ]),
  )
})
const recommendedScenario = computed(() => {
  const scenarios = result.value?.results ?? []
  if (!scenarios.length) return null

  return scenarios.reduce((best, candidate) => {
    const bestFutureValue = futureValues.value[best.scenarioType] ?? best.estimatedFutureValue ?? 0
    const candidateFutureValue =
      futureValues.value[candidate.scenarioType] ?? candidate.estimatedFutureValue ?? 0

    if (candidateFutureValue > bestFutureValue) return candidate
    if (
      candidateFutureValue === bestFutureValue &&
      candidate.estimatedPayableTax < best.estimatedPayableTax
    ) {
      return candidate
    }

    return best
  }, scenarios[0])
})
const recommendedFutureValue = computed(
  () => futureValues.value[recommendedScenario.value?.scenarioType] ?? 0,
)
const weightedPortfolioRate = computed(() =>
  Object.entries(portfolioAllocation.value).reduce(
    (total, [type, ratio]) => total + (selectedProducts[type]?.rate ?? 0) * (ratio / 100),
    0,
  ),
)
const selectedProductSummary = computed(() =>
  Object.entries(portfolioAllocation.value)
    .filter(([, ratio]) => ratio > 0)
    .map(([type]) => selectedProducts[type]?.name)
    .filter(Boolean)
    .join(' · '),
)

function initializeSelectedProducts() {
  const types = ['DEPOSIT', 'SAVINGS', 'ETF', 'INSURANCE']
  types.forEach((type) => {
    selectedProducts[type] = products
      .filter((product) => product.type === type)
      .sort((a, b) => b.rate - a.rate)[0]
  })
}

initializeSelectedProducts()

function setAmount(value) {
  amountText.value = Number(normalizeAmount(value)).toLocaleString('ko-KR')
}

function addAmount(value) {
  setAmount(amount.value + value)
}

async function runSimulation() {
  errorMessage.value = ''
  if (amount.value < 1000000) {
    errorMessage.value = '100만원 이상의 증여 예정 금액을 입력해 주세요.'
    return
  }
  loading.value = true
  try {
    selectedPortfolioType.value = 'BALANCED'
    store.selectFamily(selectedFamilyId.value)
    result.value = await api.runSimulation({
      family: family.value,
      amount: amount.value,
      years: investmentYears.value,
      donorPaysTax: donorPaysTax.value,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

function resetSimulation() {
  result.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectProduct(type, product) {
  selectedProducts[type] = product
}

async function savePlan() {
  if (!recommendedScenario.value) return
  saving.value = true
  try {
    await api.saveGiftPlan(recommendedScenario.value.resultId)
    const today = new Date().toISOString().slice(0, 10).replaceAll('-', '.')
    store.savePlan({
      familyId: family.value.id,
      resultId: recommendedScenario.value.resultId,
      title: recommendedScenario.value.scenarioName,
      amount: result.value.requestedAmount,
      currentAmount: recommendedScenario.value.currentGiftAmount,
      deferredAmount: recommendedScenario.value.deferredGiftAmount,
      giftDate: recommendedScenario.value.deferredGiftAmount
        ? recommendedScenario.value.deferredGiftDate
        : today,
      productName: selectedProductSummary.value,
      productType: 'PORTFOLIO',
      rate: Number(weightedPortfolioRate.value.toFixed(2)),
      tax: recommendedScenario.value.estimatedPayableTax,
      status: 'PLANNED',
    })
    showSaveModal.value = false
    router.push('/status')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page simulation-page">
    <AppHeader />

    <SimulationInputContent
      v-if="!result"
      v-model:selectedFamilyId="selectedFamilyId"
      :families="store.state.families"
      :family="family"
      :amount-text="amountText"
      :remaining="remaining"
      :error-message="errorMessage"
      :loading="loading"
      :investment-years="investmentYears"
      :donor-pays-tax="donorPaysTax"
      @amount-input="setAmount"
      @add-amount="addAmount"
      @update:investment-years="investmentYears = $event"
      @update:donor-pays-tax="donorPaysTax = $event"
      @submit="runSimulation"
    />

    <div v-else class="page-content simulation-result-content">
      <section class="result-hero">
        <button class="back-text-button" type="button" @click="resetSimulation">
          <AppIcon name="back" :size="17" /> 조건 다시 입력
        </button>
        <h2>
          {{ family.name }} 님께<br />{{ formatCompactWon(result.requestedAmount) }}을 증여한다면
        </h2>
        <p>증여 시점과 {{ result.years }}년의 운용 흐름을 함께 계산했어요.</p>
        <div class="result-condition-chips">
          <span><AppIcon name="clock" :size="15" /> {{ result.years }}년 운용</span>
          <span>
            <AppIcon name="wallet" :size="15" />
            {{ result.donorPaysTax ? '주는 분이 세금 준비' : '받는 분이 세금 납부' }}
          </span>
        </div>
      </section>

      <GiftPlanTimeline :result="result" :recommended-scenario="recommendedScenario" />

      <PortfolioDonutCard
        v-if="recommendedScenario"
        v-model:active-profile="selectedPortfolioType"
        :allocation-profiles="allocationProfiles"
        :expected-future-value="recommendedFutureValue"
        :years="result.years"
      />

      <ProductSelectionPanel
        :products="products"
        :allocation="portfolioAllocation"
        :selected-products="selectedProducts"
        @select="selectProduct"
      />

      <InvestmentGrowthChart
        v-if="recommendedScenario"
        :principal="recommendedScenario.postTaxAmount"
        :future-value="recommendedFutureValue"
        :years="result.years"
      />

      <aside v-if="recommendedScenario" class="filing-credit-callout">
        <span class="filing-credit-icon"><AppIcon name="document" :size="21" /></span>
        <div>
          <span class="section-kicker">신고세액공제 3%</span>
          <h2>
            기한 안에 신고하면 약 {{ formatWon(recommendedScenario.filingTaxCredit) }}을 아낄 수
            있어요
          </h2>
          <p>증여받은 날이 속하는 달의 말일부터 3개월 이내 신고할 때를 기준으로 계산했어요.</p>
        </div>
      </aside>

      <button
        class="primary-button full tall sticky-result-button"
        type="button"
        @click="showSaveModal = true"
      >
        추천 전략으로 계획 저장하기
        <AppIcon name="arrow" :size="19" />
      </button>
    </div>

    <SavePlanModal
      :show="showSaveModal"
      :selected-scenario="recommendedScenario"
      :family="family"
      :result="result"
      :active-product="{
        name: selectedProductSummary,
        type: 'PORTFOLIO',
        rate: weightedPortfolioRate,
      }"
      :saving="saving"
      @close="showSaveModal = false"
      @save="savePlan"
    />
  </div>
</template>
