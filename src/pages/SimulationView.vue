<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import GiftPlanTimeline from '../components/simulation/GiftPlanTimeline.vue'
import InvestmentGrowthChart from '../components/simulation/InvestmentGrowthChart.vue'
import PortfolioDonutCard from '../components/simulation/PortfolioDonutCard.vue'
import ProductSelectionPanel from '../components/simulation/ProductSelectionPanel.vue'
import SavePlanModal from '../components/simulation/SavePlanModal.vue'
import SimulationInputContent from '../components/simulation/SimulationInputContent.vue'
import SimulationLoadingState from '../components/simulation/SimulationLoadingState.vue'
import { products as mockProducts } from '../data/mockData'
import { api } from '../api/apiAdapter'
import { useAppStore } from '../stores/appStore'
import {
  calculatePortfolioValue,
  formatCompactWon,
  formatWon,
  getPortfolioAllocations,
  normalizeAmount,
} from '../utils/finance'
import { mergeProductDetail, normalizeSimulationResponse } from '../utils/simulationModel'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const selectedFamilyId = ref(store.state.selectedFamilyId)
const amountText = ref('')
const investmentYears = ref(10)
const donorPaysTax = ref(false)
const result = ref(null)
const loading = ref(false)
const loadingHistory = ref(false)
const loadingInitialData = ref(!api.isMock)
const errorMessage = ref('')
const selectedPortfolioType = ref('BALANCED')
const showSaveModal = ref(false)
const saving = ref(false)
const selectedProducts = reactive({})
const preferentialSelections = reactive({})
const detailLoading = reactive({})
const detailErrors = reactive({})

const family = computed(
  () =>
    store.state.families.find((item) => item.id === Number(selectedFamilyId.value)) ??
    store.selectedFamily.value,
)
const amount = computed(() => normalizeAmount(amountText.value))
const remaining = computed(() => {
  const serverRemaining = family.value?.remainingDeduction
  if (Number.isFinite(serverRemaining)) return Math.max(0, serverRemaining)
  return Math.max(0, (family.value?.deductionLimit ?? 0) - (family.value?.giftedAmount ?? 0))
})
const activeRecommendation = computed(
  () => result.value?.recommendedByProfile?.[selectedPortfolioType.value] ?? null,
)
const recommendedScenario = computed(() => {
  if (activeRecommendation.value?.scenario) return activeRecommendation.value.scenario
  const scenarios = result.value?.results ?? []
  if (!scenarios.length) return null
  return scenarios.reduce((best, candidate) =>
    (candidate.estimatedFutureValue ?? 0) > (best.estimatedFutureValue ?? 0) ? candidate : best,
  )
})
const activePortfolio = computed(() => activeRecommendation.value?.portfolio ?? null)
const allocationProfiles = computed(() => {
  if (result.value?.recommendedByProfile) {
    return Object.fromEntries(
      Object.entries(result.value.recommendedByProfile)
        .filter(([, recommendation]) => recommendation?.portfolio)
        .map(([profile, recommendation]) => [profile, recommendation.portfolio.allocation]),
    )
  }
  const years = result.value?.years ?? investmentYears.value
  const savingsProduct = mockProducts
    .filter((product) => product.type === 'SAVINGS')
    .sort((a, b) => b.rate - a.rate)[0]
  const mockProfiles = getPortfolioAllocations(years, {
    principal: recommendedScenario.value?.investmentPrincipal,
    savingsCapacity:
      savingsProduct?.monthlyMaxAmount == null
        ? Number.MAX_SAFE_INTEGER
        : savingsProduct.monthlyMaxAmount * years * 12,
  })
  return {
    CONSERVATIVE: mockProfiles.STABLE,
    BALANCED: mockProfiles.BALANCED,
    AGGRESSIVE: mockProfiles.GROWTH,
  }
})
const portfolioAllocation = computed(
  () =>
    activePortfolio.value?.allocation ??
    allocationProfiles.value[selectedPortfolioType.value] ??
    allocationProfiles.value.BALANCED ??
    {},
)
const availableProducts = computed(
  () => activePortfolio.value?.products ?? (api.isMock ? mockProducts : []),
)
const calculationProducts = computed(() =>
  Object.fromEntries(
    Object.entries(selectedProducts).map(([type, product]) => {
      if (type === 'ETF') return [type, product]

      const selectedCodes = preferentialSelections[product.simulationProductId] ?? []
      const conditions = [
        ...(product.preferentialConditions ?? []),
        ...(product.selectedPreferentialConditions ?? []),
      ]
      const additionalRate = conditions
        .filter((condition) => selectedCodes.includes(condition.conditionCode))
        .reduce((sum, condition) => sum + Number(condition.additionalRatePercent ?? 0), 0)

      return [
        type,
        {
          ...product,
          rate: Number(product.minRate ?? product.rate ?? 0) + additionalRate,
        },
      ]
    }),
  ),
)
const preferentialSelectionChanged = computed(() =>
  Object.values(selectedProducts).some((product) => {
    const current = preferentialSelections[product.simulationProductId] ?? []
    const snapshot = (product.selectedPreferentialConditions ?? []).map(
      (condition) => condition.conditionCode,
    )
    return current.length !== snapshot.length || current.some((code) => !snapshot.includes(code))
  }),
)
const recommendedFutureValue = computed(() => {
  if (!recommendedScenario.value) return 0

  if (activePortfolio.value && !preferentialSelectionChanged.value) {
    return Object.values(selectedProducts).reduce(
      (total, product) => total + Number(product?.expectedFutureValue ?? 0),
      0,
    )
  }

  return calculatePortfolioValue({
    schedule: recommendedScenario.value.giftSchedule,
    allocation: portfolioAllocation.value,
    selectedProducts: calculationProducts.value,
    years: result.value.years,
    startDate: result.value.raw?.input?.asOfDate,
    endDate: result.value.raw?.input?.investmentEndDate,
  })
})
const weightedPortfolioRate = computed(() =>
  Object.entries(portfolioAllocation.value).reduce(
    (total, [type, ratio]) => total + (calculationProducts.value[type]?.rate ?? 0) * (ratio / 100),
    0,
  ),
)
const selectedProductSummary = computed(() =>
  Object.keys(portfolioAllocation.value)
    .filter((type) => (portfolioAllocation.value[type] ?? 0) > 0)
    .map((type) => selectedProducts[type]?.name)
    .filter(Boolean)
    .join(' · '),
)

function clearProductSelections() {
  Object.keys(selectedProducts).forEach((key) => delete selectedProducts[key])
  Object.keys(preferentialSelections).forEach((key) => delete preferentialSelections[key])
}

function initializeSelectedProducts() {
  clearProductSelections()
  for (const type of ['DEPOSIT', 'SAVINGS', 'ETF']) {
    if ((portfolioAllocation.value[type] ?? 0) <= 0) continue
    const candidates = availableProducts.value
      .filter((product) => product.type === type)
      .sort((a, b) => b.rate - a.rate)
    const selected = candidates.find((product) => product.selected) ?? candidates[0]
    if (!selected) continue
    selectedProducts[type] = selected
    preferentialSelections[selected.simulationProductId] = (
      selected.selectedPreferentialConditions ?? []
    ).map((condition) => condition.conditionCode)
  }
}

watch(
  () => [
    result.value?.simulationId,
    selectedPortfolioType.value,
    activePortfolio.value?.portfolioId,
  ],
  initializeSelectedProducts,
)

function setAmount(value) {
  amountText.value = Number(normalizeAmount(value)).toLocaleString('ko-KR')
}

function addAmount(value) {
  setAmount(amount.value + value)
}

function applySimulationResponse(response) {
  result.value = normalizeSimulationResponse(response)
  const selectedProfile = response.selection?.portfolioType
  selectedPortfolioType.value =
    selectedProfile && result.value.recommendedByProfile?.[selectedProfile]
      ? selectedProfile
      : result.value.recommendedByProfile?.BALANCED
        ? 'BALANCED'
        : (Object.keys(result.value.recommendedByProfile ?? {})[0] ?? 'BALANCED')

  if (response.family?.familyId) {
    selectedFamilyId.value = Number(response.family.familyId)
    store.selectFamily(response.family.familyId)
  }
}

async function runSimulation() {
  errorMessage.value = ''
  if (amount.value < 1000000) {
    errorMessage.value = '100만원 이상의 증여 예정 금액을 입력해 주세요.'
    return
  }
  if (!family.value?.id) {
    errorMessage.value = '수증자를 먼저 등록해 주세요.'
    return
  }
  if (amount.value < 1) {
    errorMessage.value = '증여 예정 금액을 입력해 주세요.'
    return
  }

  loading.value = true
  try {
    store.selectFamily(selectedFamilyId.value)
    const response = await api.runSimulation({
      family: family.value,
      amount: amount.value,
      years: investmentYears.value,
      donorPaysTax: donorPaysTax.value,
    })
    applySimulationResponse(response)
    await router.replace({
      name: 'simulation',
      query: result.value?.simulationId ? { simulationId: result.value.simulationId } : {},
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

async function loadSimulation(simulationId) {
  loadingHistory.value = true
  errorMessage.value = ''
  try {
    const response = await api.getSimulation(simulationId)
    applySimulationResponse(response)
  } catch (error) {
    errorMessage.value = error.message
    store.showToast(error.message, 'info')
  } finally {
    loadingHistory.value = false
  }
}

async function resetSimulation() {
  result.value = null
  clearProductSelections()
  await router.replace({ name: 'simulation' })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectProduct(type, product) {
  selectedProducts[type] = product
  preferentialSelections[product.simulationProductId] = (
    product.selectedPreferentialConditions ?? []
  ).map((condition) => condition.conditionCode)
}

function updatePreferentialConditions(simulationProductId, conditionCodes) {
  preferentialSelections[simulationProductId] = conditionCodes
}

async function loadProductDetail(product) {
  if (!result.value?.simulationId || product.detailLoaded || detailLoading[product.id]) return

  detailLoading[product.id] = true
  detailErrors[product.id] = ''
  try {
    const response = await api.getSimulationProductDetail(
      result.value.simulationId,
      product.kbProductVersionId,
    )
    Object.assign(product, mergeProductDetail(product, response))
  } catch (error) {
    detailErrors[product.id] = error.message
  } finally {
    detailLoading[product.id] = false
  }
}

function savePayload(replacement = {}) {
  return {
    version: result.value.version,
    selectedPortfolioId: activePortfolio.value.portfolioId,
    replaceExistingSaved: replacement.replaceExistingSaved ?? false,
    ...(replacement.expectedExistingSavedSimulationId
      ? {
          expectedExistingSavedSimulationId: replacement.expectedExistingSavedSimulationId,
        }
      : {}),
    productSelections: Object.values(selectedProducts).map((product) => ({
      simulationProductId: product.simulationProductId,
      preferentialConditionCodes: preferentialSelections[product.simulationProductId] ?? [],
    })),
    clientCalculation: {
      formulaVersion: result.value.formulaVersion,
      expectedFutureValue: recommendedFutureValue.value,
      expectedProfit:
        recommendedFutureValue.value - (recommendedScenario.value?.investmentPrincipal ?? 0),
    },
  }
}

async function requestSave(replacement = {}) {
  return api.saveSimulation(result.value.simulationId, savePayload(replacement))
}

async function savePlan() {
  if (!recommendedScenario.value || !activePortfolio.value) return
  saving.value = true
  try {
    let response
    try {
      response = await requestSave()
    } catch (error) {
      if (error.code !== 'ACTIVE_SAVED_SIMULATION_EXISTS') throw error

      const existing = error.payload?.data?.existingSavedSimulation
      const agreed = window.confirm(
        '이미 저장된 증여 시뮬레이션이 있어요.\n새 결과를 저장하면 기존 결과는 임시 이력으로 전환됩니다.',
      )
      if (!agreed) return
      response = await requestSave({
        replaceExistingSaved: true,
        expectedExistingSavedSimulationId: existing?.simulationId,
      })
    }

    result.value.status = response.status
    result.value.version = response.version
    result.value.savedAt = response.savedAt
    result.value.expiresAt = response.expiresAt
    showSaveModal.value = false
    await store.syncStatus()
    store.showToast('증여 시뮬레이션을 최종 저장했어요.')
    await router.push('/my')
  } catch (error) {
    if (error.code === 'SIMULATION_VERSION_CONFLICT') {
      await loadSimulation(result.value.simulationId)
      store.showToast('최신 결과를 다시 불러왔어요. 내용을 확인한 뒤 저장해 주세요.', 'info')
    } else {
      store.showToast(error.message || '시뮬레이션을 저장하지 못했습니다.', 'info')
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    if (!api.isMock) {
      await store.ensureStatusLoaded()
    }

    selectedFamilyId.value = store.state.selectedFamilyId
    const simulationId = Number(route.query.simulationId)
    if (Number.isFinite(simulationId) && simulationId > 0) await loadSimulation(simulationId)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loadingInitialData.value = false
  }
})
</script>

<template>
  <div class="page simulation-page">
    <AppHeader />

    <SimulationLoadingState
      v-if="loadingInitialData || loadingHistory"
      :mode="loadingHistory ? 'history' : 'initial'"
    />

    <SimulationInputContent
      v-else-if="!result"
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
        :products="availableProducts"
        :allocation="portfolioAllocation"
        :selected-products="selectedProducts"
        :portfolio-profile="selectedPortfolioType"
        :detail-loading="detailLoading"
        :detail-errors="detailErrors"
        :preferential-selections="preferentialSelections"
        @select="selectProduct"
        @request-detail="loadProductDetail"
        @update-conditions="updatePreferentialConditions"
      />

      <InvestmentGrowthChart
        v-if="recommendedScenario"
        :principal="recommendedScenario.investmentPrincipal"
        :future-value="recommendedFutureValue"
        :years="result.years"
      />

      <aside v-if="recommendedScenario && result.exceedsDeduction" class="filing-credit-callout">
        <span class="filing-credit-icon"><AppIcon name="document" :size="21" /></span>
        <div>
          <span class="section-kicker">신고세액공제 3%</span>
          <h2>
            기한 안에 신고하면 약 {{ formatWon(recommendedScenario.filingTaxCredit) }}을 공제받을 수
            있어요.
          </h2>
          <p>증여받은 날이 속하는 달의 말일부터 3개월 이내 신고하는 경우를 기준으로 안내해요.</p>
        </div>
      </aside>

      <button
        class="primary-button full tall sticky-result-button"
        type="button"
        :disabled="!activePortfolio"
        @click="showSaveModal = true"
      >
        선택한 포트폴리오 저장하기
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
