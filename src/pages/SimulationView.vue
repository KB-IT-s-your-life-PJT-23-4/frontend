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
const todayDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())
const selectedFamilyId = ref(store.state.selectedFamilyId)
const amountText = ref('')
const investmentYears = ref(10)
const giftDate = ref(todayDate)
const donorPaysTax = ref(false)
const result = ref(null)
const loading = ref(false)
const loadingHistory = ref(false)
const loadingInitialData = ref(!api.isMock)
const errorMessage = ref('')
const giftDateError = ref('')
const selectedPortfolioType = ref('BALANCED')
const customizingPortfolio = ref(false)
const customizationError = ref('')
const savingsMaximumRatio = ref(100)
const showSaveModal = ref(false)
const saving = ref(false)
const selectedProducts = reactive({})
const preferentialSelections = reactive({})
const detailLoading = reactive({})
const detailErrors = reactive({})
const SIMULATION_VARIANT_CACHE_TTL_MS = 10 * 60 * 1000
const SIMULATION_VARIANT_CACHE_MAX_SIZE = 8
const simulationVariantCache = new Map()
const isHistoryResult = computed(
  () => route.name === 'simulation-history-detail' || route.query.from === 'history',
)
const simulationExecutedAt = computed(() => {
  if (!isHistoryResult.value) return ''

  const timestamp = result.value?.createdAt ?? result.value?.raw?.createdAt
  if (!timestamp) return ''

  const parsed = new Date(timestamp)
  if (!Number.isFinite(parsed.getTime())) return ''

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed)
})

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
  const depositProduct = mockProducts
    .filter((product) => product.type === 'DEPOSIT')
    .sort((a, b) => b.rate - a.rate)[0]
  const mockProfiles = getPortfolioAllocations(years, {
    principal: recommendedScenario.value?.investmentPrincipal,
    savingsCapacity:
      savingsProduct?.monthlyMaxAmount == null
        ? Number.MAX_SAFE_INTEGER
        : savingsProduct.monthlyMaxAmount * years * 12,
    depositProduct,
    savingsProduct,
    investmentPeriodMonths: years * 12,
    schedule: recommendedScenario.value?.giftSchedule,
    years,
    startDate: result.value?.raw?.input?.giftDate ?? result.value?.raw?.input?.asOfDate,
    endDate:
      result.value?.raw?.input?.evaluationDate ?? result.value?.raw?.input?.investmentEndDate,
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
        ...new Map(
          [
            ...(product.preferentialConditions ?? []),
            ...(product.selectedPreferentialConditions ?? []),
          ].map((condition) => [condition.conditionCode, condition]),
        ).values(),
      ]
      const additionalRate = conditions
        .filter((condition) => selectedCodes.includes(condition.conditionCode))
        .reduce((sum, condition) => sum + Number(condition.additionalRatePercent ?? 0), 0)
      const contractRateSchedule = (product.contractRateSchedule ?? []).map((contract) => ({
        ...contract,
        appliedRatePercent: Math.min(
          Number(contract.maximumRatePercent ?? Number.POSITIVE_INFINITY),
          Number(contract.baseRatePercent ?? 0) + additionalRate,
        ),
      }))

      return [
        type,
        {
          ...product,
          rate: Number(product.minRate ?? product.rate ?? 0) + additionalRate,
          contractRateSchedule,
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
    startDate: result.value.raw?.input?.giftDate ?? result.value.raw?.input?.asOfDate,
    endDate: result.value.raw?.input?.evaluationDate ?? result.value.raw?.input?.investmentEndDate,
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

function resetForNewSimulationRoute() {
  result.value = null
  loading.value = false
  loadingHistory.value = false
  errorMessage.value = ''
  giftDateError.value = ''
  selectedFamilyId.value = store.state.selectedFamilyId
  amountText.value = ''
  investmentYears.value = 10
  giftDate.value = todayDate
  donorPaysTax.value = false
  selectedPortfolioType.value = 'BALANCED'
  customizingPortfolio.value = false
  customizationError.value = ''
  savingsMaximumRatio.value = 100
  showSaveModal.value = false
  clearProductSelections()
  Object.keys(detailLoading).forEach((key) => delete detailLoading[key])
  Object.keys(detailErrors).forEach((key) => delete detailErrors[key])
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

function updateGiftDate(value) {
  giftDate.value = value
  giftDateError.value = ''
}

function simulationVariantKey({
  familyId,
  requestedAmount,
  investmentPeriodMonths,
  giftDate: scheduledGiftDate,
  taxPaymentMethod,
}) {
  return [
    Number(familyId),
    Number(requestedAmount),
    Number(investmentPeriodMonths),
    scheduledGiftDate,
    taxPaymentMethod,
  ].join(':')
}

function currentSimulationVariantKey() {
  return simulationVariantKey({
    familyId: selectedFamilyId.value,
    requestedAmount: amount.value,
    investmentPeriodMonths: investmentYears.value * 12,
    giftDate: giftDate.value,
    taxPaymentMethod: donorPaysTax.value ? 'DONOR_PAYS' : 'RECIPIENT_PAYS',
  })
}

function responseSimulationVariantKey(response) {
  if (!response?.family?.familyId || !response?.input) return null
  return simulationVariantKey({
    familyId: response.family.familyId,
    requestedAmount: response.input.requestedAmount,
    investmentPeriodMonths: response.input.investmentPeriodMonths,
    giftDate: response.input.giftDate ?? response.input.asOfDate,
    taxPaymentMethod: response.input.taxPaymentMethod,
  })
}

function rememberSimulationVariant(response, keyOverride = null) {
  const key = keyOverride ?? responseSimulationVariantKey(response)
  if (!key) return

  simulationVariantCache.delete(key)
  simulationVariantCache.set(key, {
    response,
    expiresAt: Date.now() + SIMULATION_VARIANT_CACHE_TTL_MS,
  })
  while (simulationVariantCache.size > SIMULATION_VARIANT_CACHE_MAX_SIZE) {
    simulationVariantCache.delete(simulationVariantCache.keys().next().value)
  }
}

function cachedSimulationVariant(key) {
  const cached = simulationVariantCache.get(key)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    simulationVariantCache.delete(key)
    return null
  }

  simulationVariantCache.delete(key)
  simulationVariantCache.set(key, cached)
  return cached.response
}

function applySimulationResponse(response, { cacheKey = null } = {}) {
  rememberSimulationVariant(response, cacheKey)
  result.value = normalizeSimulationResponse(response)
  if (response.input) {
    setAmount(response.input.requestedAmount)
    investmentYears.value = Number(response.input.investmentPeriodMonths) / 12
    giftDate.value = response.input.giftDate ?? response.input.asOfDate ?? todayDate
    donorPaysTax.value = response.input.taxPaymentMethod === 'DONOR_PAYS'
  }
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

async function executeSimulation({ scrollToTop = true } = {}) {
  const cacheKey = currentSimulationVariantKey()
  const cachedResponse = cachedSimulationVariant(cacheKey)
  if (cachedResponse) {
    applySimulationResponse(cachedResponse, { cacheKey })
    await router.replace({
      name: 'simulation',
      query: result.value?.simulationId ? { simulationId: result.value.simulationId } : {},
    })
    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' })
    return true
  }

  loading.value = true
  try {
    store.selectFamily(selectedFamilyId.value)
    const response = await api.runSimulation({
      family: family.value,
      amount: amount.value,
      years: investmentYears.value,
      giftDate: giftDate.value,
      donorPaysTax: donorPaysTax.value,
    })
    applySimulationResponse(response, { cacheKey })
    // POST /api/gs로 생성된 DRAFT를 마이페이지 이력에 즉시 반영한다.
    // 응답을 로컬에서 임의 조립하지 않고 GET /api/gs의 최신 목록을 다시 사용한다.
    await store.syncStatus({ suppressSimulationAccessNotice: false })
    await router.replace({
      name: 'simulation',
      query: result.value?.simulationId ? { simulationId: result.value.simulationId } : {},
    })
    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' })
    return true
  } catch (error) {
    errorMessage.value = error.message
    return false
  } finally {
    loading.value = false
  }
}

async function runSimulation() {
  errorMessage.value = ''
  giftDateError.value = ''
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
  if (!giftDate.value) {
    giftDateError.value = '증여 예정일을 선택해 주세요.'
    return
  }
  if (giftDate.value < todayDate) {
    giftDateError.value = '증여 예정일은 오늘 또는 이후 날짜로 선택해 주세요.'
    return
  }

  await executeSimulation()
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

watch(
  () => [route.name, route.params.simulationId, route.query.simulationId, route.query.from],
  async ([nextRouteName, nextHistoryId, nextQueryId, nextSource]) => {
    if (nextRouteName === 'simulation-history-detail' || nextSource === 'history') {
      const simulationId = Number(nextHistoryId ?? nextQueryId)
      if (
        Number.isFinite(simulationId) &&
        simulationId > 0 &&
        Number(result.value?.simulationId) !== simulationId
      ) {
        await loadSimulation(simulationId)
      }
      return
    }

    if (nextRouteName === 'simulation' && nextQueryId == null) {
      resetForNewSimulationRoute()
    }
  },
)

async function resetSimulation() {
  if (isHistoryResult.value) {
    await router.replace({ name: 'my', hash: '#simulation-history' })
    return
  }

  result.value = null
  clearProductSelections()
  await router.replace({ name: 'simulation' })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function changeTaxPaymentMethod() {
  if (isHistoryResult.value || loading.value) return

  const previousMethod = donorPaysTax.value
  const previousProfile = selectedPortfolioType.value
  donorPaysTax.value = !previousMethod
  const changed = await executeSimulation({ scrollToTop: false })
  if (!changed) {
    donorPaysTax.value = previousMethod
    store.showToast(errorMessage.value || '납부 방식을 변경하지 못했습니다.', 'info')
  } else if (result.value?.recommendedByProfile?.[previousProfile]) {
    selectedPortfolioType.value = previousProfile
  }
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

function applyMockCustomPortfolio(basePortfolioType, allocation) {
  const source = result.value?.recommendedByProfile?.[basePortfolioType]
  if (!source?.scenario || !source?.portfolio) return false

  const principal = Number(source.scenario.investmentPrincipal ?? 0)
  const products = source.portfolio.products
    .filter((product) => Number(allocation[product.type] ?? 0) > 0)
    .map((product) => {
      const allocatedAmount = Math.round((principal * Number(allocation[product.type])) / 100)
      const multiplier = product.allocatedAmount
        ? Number(product.expectedFutureValue ?? product.allocatedAmount) / product.allocatedAmount
        : 1
      return {
        ...product,
        allocatedAmount,
        allocationRatio: Number(allocation[product.type]),
        expectedFutureValue: Math.round(allocatedAmount * multiplier),
      }
    })
  const bestByType = Object.values(
    products.reduce((best, product) => {
      if (
        !best[product.type] ||
        best[product.type].expectedFutureValue < product.expectedFutureValue
      ) {
        best[product.type] = product
      }
      return best
    }, {}),
  )
  const portfolio = {
    ...source.portfolio,
    portfolioId: `custom-${result.value.simulationId}`,
    portfolioType: 'CUSTOM',
    allocation: { ...allocation },
    expectedFutureValue: bestByType.reduce(
      (sum, product) => sum + Number(product.expectedFutureValue ?? 0),
      0,
    ),
    products,
  }
  result.value = {
    ...result.value,
    version: Number(result.value.version ?? 0) + 1,
    recommendedByProfile: {
      ...result.value.recommendedByProfile,
      CUSTOM: { scenario: source.scenario, portfolio },
    },
  }
  return true
}

async function applyCustomPortfolio({ basePortfolioType, allocation }) {
  const source = result.value?.recommendedByProfile?.[basePortfolioType]
  if (!result.value?.simulationId || !source?.scenario) return

  customizingPortfolio.value = true
  customizationError.value = ''
  try {
    const response = await api.customizeSimulationPortfolio(result.value.simulationId, {
      version: result.value.version,
      resultId: source.scenario.resultId,
      basePortfolioType,
      allocation: {
        depositRatio: allocation.DEPOSIT,
        savingsRatio: allocation.SAVINGS,
        etfRatio: allocation.ETF,
      },
    })
    if (response?.simulation) {
      applySimulationResponse(response.simulation)
      savingsMaximumRatio.value = Number(response.savingsMaximumRatio ?? 100)
    } else if (!applyMockCustomPortfolio(basePortfolioType, allocation)) {
      throw new Error('커스텀 포트폴리오를 적용하지 못했습니다.')
    }
    selectedPortfolioType.value = 'CUSTOM'
    store.showToast('직접 조정한 상품 비율을 적용했습니다.', 'success')
  } catch (error) {
    customizationError.value = error.message
    store.showToast(error.message, 'info')
  } finally {
    customizingPortfolio.value = false
  }
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
    await store.syncStatus({ suppressSimulationAccessNotice: false })
    store.showToast('증여 시뮬레이션을 최종 저장했어요.')
    await router.push('/status')
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
      await store.ensureStatusLoaded({ suppressSimulationAccessNotice: false })
    }

    selectedFamilyId.value = store.state.selectedFamilyId
    const simulationId = Number(route.params.simulationId ?? route.query.simulationId)
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
      :gift-date="giftDate"
      :min-gift-date="todayDate"
      :gift-date-error="giftDateError"
      :donor-pays-tax="donorPaysTax"
      @amount-input="setAmount"
      @add-amount="addAmount"
      @update:investment-years="investmentYears = $event"
      @update:gift-date="updateGiftDate"
      @update:donor-pays-tax="donorPaysTax = $event"
      @submit="runSimulation"
    />

    <div v-else class="page-content simulation-result-content">
      <section class="result-hero">
        <button class="back-text-button" type="button" @click="resetSimulation">
          <AppIcon name="back" :size="17" />
          {{ isHistoryResult ? '시뮬레이션 목록 보기' : '조건 다시 입력' }}
        </button>
        <h2>
          {{ family.name }} 님께<br />{{ formatCompactWon(result.requestedAmount) }}을 증여한다면
        </h2>
        <div class="result-condition-chips">
          <span v-if="isHistoryResult && simulationExecutedAt">
            <AppIcon name="clock" :size="15" />
            {{ simulationExecutedAt }} 실행
          </span>
          <span>
            <AppIcon name="calendar" :size="15" />
            {{ result.giftDate }} 증여 예정
          </span>
          <span><AppIcon name="clock" :size="15" /> {{ result.years }}년 운용</span>
          <span v-if="result.evaluationDate && result.evaluationDate !== result.endDate">
            <AppIcon name="calendar" :size="15" />
            {{ result.evaluationDate }} 평가 기준
          </span>
          <span v-if="isHistoryResult">
            <AppIcon name="wallet" :size="15" />
            {{ result.donorPaysTax ? '주는 분이 세금 준비' : '받는 분이 세금 납부' }}
          </span>
          <button
            v-else
            class="result-condition-edit"
            type="button"
            :disabled="loading"
            :aria-label="
              result.donorPaysTax
                ? '받는 분이 세금을 납부하는 방식으로 변경'
                : '주는 분이 세금까지 준비하는 방식으로 변경'
            "
            @click="changeTaxPaymentMethod"
          >
            <AppIcon name="wallet" :size="15" />
            <span v-if="loading" class="button-spinner" />
            <template v-else>
              {{ result.donorPaysTax ? '주는 분이 세금 준비' : '받는 분이 세금 납부' }}
            </template>
          </button>
        </div>
      </section>

      <GiftPlanTimeline
        :result="result"
        :recommended-scenario="recommendedScenario"
        :selected-products="calculationProducts"
        :portfolio-profile="selectedPortfolioType"
      />

      <PortfolioDonutCard
        v-if="recommendedScenario"
        v-model:active-profile="selectedPortfolioType"
        :allocation-profiles="allocationProfiles"
        :expected-future-value="recommendedFutureValue"
        :years="result.years"
        :customizing="customizingPortfolio"
        :customization-error="customizationError"
        :savings-maximum-ratio="savingsMaximumRatio"
        :customizable="result.status === 'DRAFT'"
        @apply-custom="applyCustomPortfolio"
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
          <!-- <span class="section-kicker">신고세액공제 3%</span> -->
          <h2>기한 내 신고 시 세액공제 3%를 반영한 결과예요.</h2>
          <p>
            증여받은 날이 속하는 달의 말일부터 3개월 이내 홈택스·정부24 또는 주소지 관할 세무서에
            신고·납부해 주세요. 기한을 넘기면 공제를 받을 수 없고 무신고가산세(20~40%)나
            납부지연가산세가 부과될 수 있어요.
          </p>
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
