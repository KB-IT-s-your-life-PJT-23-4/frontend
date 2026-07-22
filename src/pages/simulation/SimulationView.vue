<script setup>
import { computed, ref } from 'vue'
import AssetCard from '@/components/simulation/AssetCard.vue'
import ProductCard from '@/components/simulation/ProductCard.vue'
import RatioCard from '@/components/simulation/RatioCard.vue'

const tabs = ['예금', '적금', '보험', 'ETF', '혼합형']
const selectedTab = ref('예금')
const isaEnabled = ref(false)
const growthRatio = ref(60)
const toastMessage = ref('')
let toastTimer

const planCatalog = {
  예금: {
    future: 5700,
    product: 'KB Star 정기예금',
    subtitle: '4,700만원 분산 재예치 전략',
    rateLabel: '금리 (연, 세전)',
    rate: '최대 2.95%',
    periodLabel: '운용 기간',
    period: '10년 (비과세 한도 5,000만원 활용)',
    siteUrl: 'https://ombr.kbstar.com/quics?TmpltID=TP02001&page=C106592',
  },
  적금: {
    future: 5700,
    product: 'KB국민행복적금',
    subtitle: '세전 최고 금리',
    rateLabel: '금리 (연, 세전)',
    rate: '최대 3.05%',
    periodLabel: '운용기간 (10년)',
    period: '36개월+36개월+36개월+12개월 (자동 재예치)',
    note: '복리 효과는 만기 시 자동 재예치 가정을 포함합니다.',
    siteUrl: 'https://obank.kbstar.com/quics?page=C016614',
  },
  보험: {
    future: 6720,
    product: 'KB국민행복적금',
    subtitle: '10년 유지 시 전액 비과세',
    rateLabel: '예상 수익률 (연, 세전)',
    rate: '2.8 ~ 3.2%',
    periodLabel: '운용기간 (10년)',
    period: '36개월+36개월+36개월+12개월 (자동 재예치)',
    note: '증여세 공제 한도를 넘는 금액도 수익자 지정을 통해 장기적인 자산 증식 효과를 얻을 수 있습니다.',
    siteUrl: 'https://www.kblife.co.kr/',
  },
  ETF: {
    future: 8000,
    product: '지수 추종 ETF',
    subtitle: 'S&P, 나스닥 등',
    rateLabel: '예상 수익률 (연, 세전)',
    rate: '평균 13.7%',
    periodLabel: '운용기간',
    period: '10년',
    risk: true,
    siteUrl: 'https://www.kbsec.com/',
  },
}

const selectedPlan = computed(() => {
  if (selectedTab.value === '혼합형') {
    const projected = Math.round(5700 + (2540 * growthRatio.value) / 60)
    return { future: projected }
  }

  if (selectedTab.value === 'ETF' && isaEnabled.value) {
    return { ...planCatalog.ETF, future: 9000 }
  }

  return planCatalog[selectedTab.value]
})

const futureAmount = computed(() => selectedPlan.value.future)

function chooseTab(tab) {
  selectedTab.value = tab
  if (tab !== 'ETF') isaEnabled.value = false
}

function showToast(message) {
  toastMessage.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
  }, 2400)
}
</script>

<template>
  <main class="simulation-page">
    <section class="input-summary" aria-label="증여 조건">
      <div class="summary-row">
        <span>수증자</span>
        <strong>둘째 (김케이)</strong>
      </div>
      <div class="summary-row">
        <span>증여 희망 금액</span>
        <strong class="amount-copy">50,000,000원</strong>
      </div>
    </section>

    <div class="plan-tabs" role="tablist" aria-label="금융 상품 유형">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="plan-tab"
        :class="{ 'plan-tab--active': selectedTab === tab }"
        type="button"
        role="tab"
        :aria-selected="selectedTab === tab"
        @click="chooseTab(tab)"
      >
        {{ tab }}
      </button>
    </div>

    <h1 class="simulation-title">10년 뒤 얼마나 모일까요?</h1>

    <RatioCard v-if="selectedTab === '혼합형'" v-model="growthRatio" />

    <AssetCard
      v-model:isa-enabled="isaEnabled"
      :selected-tab="selectedTab"
      :future-amount="futureAmount"
    />

    <ProductCard v-if="selectedTab !== '혼합형'" :plan="selectedPlan" />

    <button class="start-button" type="button" @click="showToast('상품 가입 절차를 준비하고 있어요.')">
      이 상품으로 시작하기
    </button>

    <p v-if="selectedTab === 'ETF' || selectedTab === '혼합형'" class="investment-notice">
      금융상품 투자는 원금 손실이 발생할 수 있으며,<br />과거의 수익률이 미래를 보장하지 않습니다.
    </p>

    <Transition name="toast">
      <div v-if="toastMessage" class="toast" role="status">{{ toastMessage }}</div>
    </Transition>
  </main>
</template>

<style scoped>
.simulation-page {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px 20px 28px;
  color: #191c1e;
  background: #f6f8fd;
}

.input-summary {
  display: grid;
  gap: 12px;
}

.summary-row {
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 24px;
  color: #4d4632;
  background: #f2f4f6;
  font-size: 14px;
  line-height: 24px;
}

.summary-row strong {
  color: #191c1e;
  font-weight: 500;
}

.summary-row .amount-copy {
  font-family: 'Be Vietnam Pro', Arial, sans-serif;
}

.plan-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.plan-tabs::-webkit-scrollbar {
  display: none;
}

.plan-tab {
  flex: 0 0 auto;
  padding: 8px 14px;
  border-radius: 999px;
  color: #4e5968;
  cursor: pointer;
  background: #f2f4f6;
  font-size: 13px;
  font-weight: 500;
  line-height: 21px;
  transition: background 160ms ease, color 160ms ease, transform 160ms ease;
}

.plan-tab:active {
  transform: scale(0.96);
}

.plan-tab--active {
  color: #000;
  background: #fc0;
  box-shadow: 0 1px 1px rgb(0 0 0 / 5%);
}

.simulation-title {
  margin: -1px 0 3px;
  color: #191f28;
  font-size: 18px;
  font-weight: 500;
  line-height: 28px;
}

.start-button {
  width: 100%;
  min-height: 56px;
  padding: 15px 24px;
  border-radius: 999px;
  color: #000;
  cursor: pointer;
  background: #fc0;
  box-shadow: 0 6px 8px rgb(0 0 0 / 12%);
  font-size: 16px;
  font-weight: 500;
  line-height: 27px;
  transition: transform 150ms ease, filter 150ms ease;
}

.start-button:hover {
  filter: brightness(0.98);
}

.start-button:active {
  transform: translateY(1px) scale(0.99);
}

.investment-notice {
  margin: 0;
  color: #8b95a1;
  font-size: 10px;
  line-height: 17px;
  text-align: center;
}

.toast {
  position: fixed;
  z-index: 50;
  bottom: 88px;
  left: 50%;
  width: min(330px, calc(100% - 40px));
  padding: 13px 18px;
  border-radius: 14px;
  color: #fff;
  background: rgb(25 31 40 / 94%);
  font-size: 13px;
  text-align: center;
  transform: translateX(-50%);
  box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

@media (max-width: 359px) {
  .simulation-page {
    padding-inline: 16px;
  }

  .plan-tab {
    padding-inline: 12px;
  }
}
</style>
