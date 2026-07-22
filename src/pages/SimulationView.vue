<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import { products } from '../data/mockData'
import { api } from '../api/apiAdapter'
import { useAppStore } from '../stores/appStore'
import { formatCompactWon, formatWon, normalizeAmount } from '../utils/finance'

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
const selectedScenario = computed(() =>
  result.value?.results.find((item) => item.scenarioType === selectedScenarioType.value),
)
const immediateScenario = computed(() =>
  result.value?.results.find((item) => item.scenarioType === 'IMMEDIATE'),
)
const optimizedScenario = computed(() =>
  result.value?.results.find((item) => item.scenarioType === 'TAX_OPTIMIZED'),
)
const activeProduct = computed(() =>
  selectedScenario.value?.products.find((product) => product.type === activeProductType.value),
)
const taxSaving = computed(() =>
  Math.max(0, (immediateScenario.value?.giftTax ?? 0) - (optimizedScenario.value?.giftTax ?? 0)),
)
const maxFutureValue = computed(() =>
  Math.max(
    immediateScenario.value?.products.find((item) => item.type === activeProductType.value)
      ?.expectedFutureValue ?? 0,
    optimizedScenario.value?.products.find((item) => item.type === activeProductType.value)
      ?.expectedFutureValue ?? 0,
    1,
  ),
)

function setAmount(value) {
  amountText.value = Number(value).toLocaleString('ko-KR')
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

    <div v-if="!result" class="page-content simulation-input-content">
      <section class="simulation-intro">
        <span class="section-kicker">GIFT SIMULATION</span>
        <h2>누구에게, 얼마를<br />증여할 예정인가요?</h2>
        <p>최근 10년 이력과 공제 한도를 반영해 두 가지 전략을 비교해 드려요.</p>
      </section>

      <form class="simulation-form" @submit.prevent="runSimulation">
        <div class="field-group">
          <label for="family-select">수증자</label>
          <div class="select-wrap">
            <select id="family-select" v-model="selectedFamilyId">
              <option v-for="item in store.state.families" :key="item.id" :value="item.id">
                {{ item.name }} ({{ item.relation }})
              </option>
            </select>
            <AppIcon name="chevron" :size="17" />
          </div>
        </div>

        <article class="family-context-card">
          <span class="context-avatar">{{ family.name.slice(-2) }}</span>
          <div>
            <strong>{{ family.name }}</strong>
            <span>최근 10년 증여 {{ formatCompactWon(family.giftedAmount) }}</span>
          </div>
          <div class="context-remaining">
            <span>남은 공제</span>
            <strong>{{ formatCompactWon(remaining) }}</strong>
          </div>
        </article>

        <div class="field-group amount-field-group">
          <label for="gift-amount">이번 증여 예정 금액</label>
          <div class="amount-input-wrap" :class="{ invalid: errorMessage }">
            <input
              id="gift-amount"
              :value="amountText"
              inputmode="numeric"
              placeholder="0"
              @input="setAmount(normalizeAmount($event.target.value))"
            />
            <span>원</span>
          </div>
          <p v-if="errorMessage" class="field-error">{{ errorMessage }}</p>
          <div class="amount-quick-buttons">
            <button type="button" @click="addAmount(10000000)">+1천만원</button>
            <button type="button" @click="addAmount(30000000)">+3천만원</button>
            <button type="button" @click="addAmount(50000000)">+5천만원</button>
          </div>
        </div>

        <aside class="info-callout">
          <AppIcon name="info" :size="20" />
          <p>
            {{ family.name }} 님은 현재 <strong>{{ formatCompactWon(remaining) }}</strong
            >까지 비과세 한도를 활용할 수 있어요. 한도 갱신 예정일은 {{ family.resetDate }}입니다.
          </p>
        </aside>

        <button class="primary-button full tall" type="submit" :disabled="loading">
          <span v-if="loading" class="button-spinner" />
          <template v-else>
            시뮬레이션 실행하기
            <AppIcon name="arrow" :size="19" />
          </template>
        </button>
      </form>
    </div>

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

      <section v-if="result.exceedsDeduction" class="scenario-comparison-section">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">SCENARIO</span>
            <h2>두 전략을 비교했어요</h2>
          </div>
          <span class="recommend-badge">절세 추천</span>
        </div>

        <div class="scenario-chart" aria-label="시나리오별 10년 뒤 예상 자산 비교">
          <div
            v-for="scenario in [immediateScenario, optimizedScenario]"
            :key="scenario.scenarioType"
            class="chart-column"
          >
            <div class="chart-value">
              {{
                formatCompactWon(
                  scenario.products.find((item) => item.type === activeProductType)
                    .expectedFutureValue,
                )
              }}
            </div>
            <div
              class="chart-bar"
              :class="{
                recommended: scenario.scenarioType === 'TAX_OPTIMIZED',
              }"
              :style="{
                height: `${Math.max(
                  42,
                  (scenario.products.find((item) => item.type === activeProductType)
                    .expectedFutureValue /
                    maxFutureValue) *
                    130,
                )}px`,
              }"
            />
            <strong>{{ scenario.scenarioType === 'IMMEDIATE' ? '지금 전액' : '공제 우선' }}</strong>
          </div>
        </div>

        <div class="scenario-selector">
          <button
            v-for="scenario in result.results"
            :key="scenario.scenarioType"
            type="button"
            :class="{
              selected: selectedScenarioType === scenario.scenarioType,
            }"
            @click="selectedScenarioType = scenario.scenarioType"
          >
            <span class="scenario-radio"><i /></span>
            <span>
              <strong>{{ scenario.scenarioName }}</strong>
              <small>{{ scenario.description }}</small>
            </span>
            <em v-if="scenario.scenarioType === 'TAX_OPTIMIZED'">추천</em>
          </button>
        </div>

        <aside class="saving-callout">
          <AppIcon name="sparkles" :size="20" />
          <p>
            공제 한도를 우선 활용하면 예상 증여세를
            <strong>{{ formatCompactWon(taxSaving) }}</strong> 줄일 수 있어요.
          </p>
        </aside>
      </section>

      <section v-else class="within-limit-card">
        <span class="success-mark"><AppIcon name="check" :size="24" /></span>
        <div>
          <span class="section-kicker">공제 한도 안이에요</span>
          <h2>예상 증여세는 0원입니다</h2>
          <p>
            증여 후에도 공제 한도가
            {{ formatCompactWon(remaining - result.requestedAmount) }} 남아요.
          </p>
        </div>
      </section>

      <section class="result-summary-card">
        <div class="summary-card-heading">
          <div>
            <span class="section-kicker">선택한 전략</span>
            <h2>{{ selectedScenario.scenarioName }}</h2>
          </div>
          <span class="tax-chip">예상 세금 {{ formatCompactWon(selectedScenario.giftTax) }}</span>
        </div>
        <div class="metric-grid">
          <div>
            <span>지금 증여</span>
            <strong>{{ formatCompactWon(selectedScenario.currentGiftAmount) }}</strong>
          </div>
          <div>
            <span>나중에 증여</span>
            <strong>{{ formatCompactWon(selectedScenario.deferredGiftAmount) }}</strong>
          </div>
          <div>
            <span>운용 원금</span>
            <strong>{{ formatCompactWon(selectedScenario.postTaxAmount) }}</strong>
          </div>
          <div>
            <span>10년 뒤 예상</span>
            <strong class="blue">{{ formatCompactWon(activeProduct.expectedFutureValue) }}</strong>
          </div>
        </div>
      </section>

      <section class="recommended-product-card">
        <div class="product-brand-row">
          <span class="product-symbol" :style="{ background: activeProduct.color }">
            <AppIcon :name="activeProduct.type === 'ETF' ? 'chart' : 'wallet'" :size="21" />
          </span>
          <div>
            <span>{{ activeProduct.provider }}</span>
            <h2>{{ activeProduct.name }}</h2>
          </div>
          <span class="risk-pill">{{ activeProduct.risk }}</span>
        </div>
        <p>{{ activeProduct.description }}</p>
        <div class="product-metrics">
          <div>
            <span>가정 수익률</span>
            <strong>연 {{ activeProduct.rate }}%</strong>
          </div>
          <div>
            <span>예상 수익</span>
            <strong>+{{ formatCompactWon(activeProduct.expectedProfit) }}</strong>
          </div>
          <div>
            <span>10년 예상 자산</span>
            <strong>{{ formatCompactWon(activeProduct.expectedFutureValue) }}</strong>
          </div>
        </div>
        <div v-if="activeProduct.type === 'ETF'" class="isa-note">
          <AppIcon name="info" :size="17" /> ISA 계좌를 함께 활용하면 추가 절세 가능성을 살펴볼 수
          있어요.
        </div>
        <a
          class="secondary-button full"
          href="https://www.kbstar.com"
          target="_blank"
          rel="noreferrer"
        >
          상품 정보 확인하기 <AppIcon name="arrow" :size="17" />
        </a>
      </section>

      <section class="risk-card" :class="activeProduct.type.toLowerCase()">
        <div class="risk-card-top">
          <span><AppIcon name="shield" :size="19" /> 위험도 분석</span>
          <strong>{{ activeProduct.risk }}</strong>
        </div>
        <div class="risk-scale">
          <span :style="{ width: activeProduct.type === 'ETF' ? '62%' : '22%' }" />
        </div>
        <p>
          {{
            activeProduct.type === 'ETF'
              ? '과거 변동성에 기반한 추정치로, 원금 손실 가능성이 있습니다. 장기 분산 관점으로 검토하세요.'
              : '예측 가능한 수익을 기대할 수 있지만 중도 해지 시 약정 이율보다 낮아질 수 있어요.'
          }}
        </p>
      </section>

      <button
        class="primary-button full tall sticky-result-button"
        type="button"
        @click="showSaveModal = true"
      >
        이 전략으로 계획 저장하기
        <AppIcon name="arrow" :size="19" />
      </button>
    </div>

    <ModalSheet
      :show="showSaveModal"
      title="이 전략을 저장할까요?"
      description="저장한 계획은 증여 현황에서 일정과 준비 서류를 이어서 관리할 수 있어요."
      @close="showSaveModal = false"
    >
      <div v-if="selectedScenario" class="save-plan-preview">
        <div>
          <span>대상</span><strong>{{ family.name }}</strong>
        </div>
        <div>
          <span>전략</span><strong>{{ selectedScenario.scenarioName }}</strong>
        </div>
        <div>
          <span>증여 금액</span><strong>{{ formatWon(result.requestedAmount) }}</strong>
        </div>
        <div>
          <span>추천 상품</span><strong>{{ activeProduct.name }}</strong>
        </div>
      </div>
      <template #actions>
        <button class="secondary-button" type="button" @click="showSaveModal = false">취소</button>
        <button class="primary-button" type="button" :disabled="saving" @click="savePlan">
          {{ saving ? '저장 중...' : '계획 저장' }}
        </button>
      </template>
    </ModalSheet>
  </div>
</template>
