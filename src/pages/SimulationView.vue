<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import RecommendedProductCard from '../components/simulation/RecommendedProductCard.vue'
import ResultSummaryCard from '../components/simulation/ResultSummaryCard.vue'
import RiskCard from '../components/simulation/RiskCard.vue'
import SavePlanModal from '../components/simulation/SavePlanModal.vue'
import SimulationInputContent from '../components/simulation/SimulationInputContent.vue'
import SimulationScenarioSection from '../components/simulation/SimulationScenarioSection.vue'
import { products } from '../data/mockData'
import { api } from '../api/apiAdapter'
import { useAppStore } from '../stores/appStore'
import { formatCompactWon, normalizeAmount } from '../utils/finance'

const store = useAppStore()
const router = useRouter()
const selectedFamilyId = ref(store.state.selectedFamilyId)
const amountText = ref('')
const result = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const activeProductType = ref('DEPOSIT')
const selectedScenarioType = ref('TAX_OPTIMIZED')
const showSaveModal = ref(false)
const saving = ref(false)

const family = computed(
  () =>
    store.state.families.find((item) => item.id === Number(selectedFamilyId.value)) ??
    store.selectedFamily.value,
)
const amount = computed(() => normalizeAmount(amountText.value))
const remaining = computed(() =>
  Math.max(0, family.value.deductionLimit - family.value.giftedAmount),
)
const selectedScenario = computed(
  () =>
    result.value?.results.find((item) => item.scenarioType === selectedScenarioType.value) ??
    result.value?.results[0],
)
const activeProduct = computed(() =>
  selectedScenario.value?.products.find((product) => product.type === activeProductType.value),
)

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
    store.selectFamily(selectedFamilyId.value)
    result.value = await api.runSimulation({
      family: family.value,
      amount: amount.value,
      years: 10,
    })
    selectedScenarioType.value = result.value.exceedsDeduction ? 'TAX_OPTIMIZED' : 'IMMEDIATE'
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

async function savePlan() {
  if (!selectedScenario.value || !activeProduct.value) return
  saving.value = true
  try {
    await api.saveGiftPlan(selectedScenario.value.resultId)
    const today = new Date().toISOString().slice(0, 10).replaceAll('-', '.')
    store.savePlan({
      familyId: family.value.id,
      resultId: selectedScenario.value.resultId,
      title: selectedScenario.value.scenarioName,
      amount: result.value.requestedAmount,
      currentAmount: selectedScenario.value.currentGiftAmount,
      deferredAmount: selectedScenario.value.deferredGiftAmount,
      giftDate: selectedScenario.value.deferredGiftAmount
        ? selectedScenario.value.deferredGiftDate
        : today,
      productName: activeProduct.value.name,
      productType: activeProduct.value.type,
      rate: activeProduct.value.rate,
      tax: selectedScenario.value.giftTax,
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
      @amount-input="setAmount"
      @add-amount="addAmount"
      @submit="runSimulation"
    />

    <div v-else class="page-content simulation-result-content">
      <section class="result-hero">
        <button class="back-text-button" type="button" @click="resetSimulation">
          <AppIcon name="back" :size="17" /> 조건 다시 입력
        </button>
        <span class="section-kicker">10년 뒤 예상 결과</span>
        <h2>{{ family.name }} 님께 {{ formatCompactWon(result.requestedAmount) }}을 증여한다면</h2>
        <p>세금과 운용 시점을 함께 고려한 결과예요.</p>
      </section>

      <div class="product-tabs" role="tablist" aria-label="추천 상품 유형">
        <button
          v-for="product in products"
          :key="product.type"
          type="button"
          role="tab"
          :aria-selected="activeProductType === product.type"
          :class="{ active: activeProductType === product.type }"
          @click="activeProductType = product.type"
        >
          {{ product.label }}
        </button>
      </div>

      <SimulationScenarioSection
        :result="result"
        :active-product-type="activeProductType"
        :remaining="remaining"
      />

      <ResultSummaryCard
        v-model:selected-scenario-type="selectedScenarioType"
        :scenarios="result.results"
        :active-product-type="activeProductType"
      />

      <RecommendedProductCard :active-product="activeProduct" />

      <RiskCard :active-product="activeProduct" />

      <button
        class="primary-button full tall sticky-result-button"
        type="button"
        @click="showSaveModal = true"
      >
        이 전략으로 계획 저장하기
        <AppIcon name="arrow" :size="19" />
      </button>
    </div>

    <SavePlanModal
      :show="showSaveModal"
      :selected-scenario="selectedScenario"
      :family="family"
      :result="result"
      :active-product="activeProduct"
      :saving="saving"
      @close="showSaveModal = false"
      @save="savePlan"
    />
  </div>
</template>
