<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedTab: {
    type: String,
    required: true,
  },
  futureAmount: {
    type: Number,
    required: true,
  },
  isaEnabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:isaEnabled'])

const principalHeight = computed(() =>
  Math.max(54, Math.round((5000 / props.futureAmount) * 112)),
)

function formatAmount(amount) {
  return `${amount.toLocaleString('ko-KR')}만 원`
}

function toggleIsa() {
  emit('update:isaEnabled', !props.isaEnabled)
}
</script>

<template>
  <section class="asset-card" aria-label="10년 후 예상 자산">
    <div class="asset-card__heading">
      <div>
        <h2>10년 후 예상 자산</h2>
        <p v-if="selectedTab === '혼합형'">(연 복리 4.5% 가정)</p>
      </div>
      <button
        v-if="selectedTab === 'ETF'"
        class="isa-toggle"
        :class="{ 'isa-toggle--active': isaEnabled }"
        type="button"
        :aria-pressed="isaEnabled"
        @click="toggleIsa"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        <span>ISA 계좌<br />{{ isaEnabled ? '적용 중' : '적용하기' }}</span>
      </button>
    </div>

    <div class="asset-chart" aria-label="현재 원금과 10년 후 자산 비교">
      <div class="chart-column">
        <div class="chart-bar chart-bar--principal" :style="{ height: `${principalHeight}px` }"></div>
        <span>현재 원금</span>
      </div>
      <div class="chart-column">
        <div class="chart-value">{{ futureAmount.toLocaleString('ko-KR') }}만원</div>
        <div class="chart-bar chart-bar--future"></div>
        <span>10년 후 (세후)</span>
      </div>
    </div>

    <div v-if="selectedTab === 'ETF' && isaEnabled" class="tax-benefit">
      <div class="tax-benefit__title">
        <span>ISA 절세 혜택</span>
        <strong>+ 약 215만원 추가 수익</strong>
      </div>
      <div class="tax-benefit__compare">
        <div>
          <span>일반 계좌 세금</span>
          <strong>약 342만원</strong>
        </div>
        <div>
          <span>ISA 계좌 세금</span>
          <strong>약 127만원</strong>
        </div>
      </div>
      <ul>
        <li>운용수익 200만원까지 비과세 혜택</li>
        <li>초과분 9.9% 분리과세 (일반 15.4%)</li>
      </ul>
    </div>

    <div class="tax-callout">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18h6M10 21h4" />
        <path d="M8.4 15.2A7 7 0 1 1 15.6 15.2C14.6 16 14 17 14 18h-4c0-1-.6-2-1.6-2.8Z" />
      </svg>
      <p>10년간 증여액이 5,000만원 이하로 <strong>증여세가 부과되지 않아요.</strong></p>
    </div>

    <div class="asset-total">
      <span>예상 최종 금액</span>
      <strong>{{ formatAmount(futureAmount) }}</strong>
    </div>
  </section>
</template>

<style scoped>
.asset-card {
  padding: 24px 20px 20px;
  border-radius: 24px;
  background: #fff;
}

.asset-card__heading {
  display: flex;
  min-height: 43px;
  align-items: flex-start;
  justify-content: space-between;
}

.asset-card__heading h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  line-height: 24px;
}

.asset-card__heading p {
  margin: 0;
  color: #6b7684;
  font-size: 11px;
  line-height: 19px;
}

.isa-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 5px 10px;
  border: 1px solid #82b8e9;
  border-radius: 999px;
  color: #517594;
  cursor: pointer;
  background: #fff;
  box-shadow: 0 2px 5px rgb(17 24 39 / 18%);
  font-size: 9px;
  font-weight: 500;
  line-height: 12px;
}

.isa-toggle svg {
  width: 22px;
  height: 22px;
  padding: 4px;
  border-radius: 50%;
  color: #fff;
  background: #517594;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.isa-toggle--active {
  background: #e8f1ff;
}

.asset-chart {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
  min-height: 160px;
  margin-top: 12px;
}

.chart-column {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: flex-end;
}

.chart-bar {
  width: 100%;
  min-height: 54px;
  border-radius: 17px 17px 0 0;
  transition: height 300ms ease;
}

.chart-bar--principal {
  background: #e5e8eb;
}

.chart-bar--future {
  height: 112px;
  background: #82b8e9;
}

.chart-column > span {
  margin-top: 12px;
  color: #4e5968;
  font-size: 10px;
  line-height: 18px;
}

.chart-column:last-child > span {
  text-align: right;
}

.chart-value {
  position: absolute;
  z-index: 1;
  top: -25px;
  right: 2px;
  padding: 4px 8px;
  border-radius: 999px;
  color: #fff;
  background: #191f28;
  font-family: Arial, sans-serif;
  font-size: 9px;
  line-height: 17px;
  white-space: nowrap;
}

.tax-benefit {
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  color: #4e5968;
  background: #f9fafb;
}

.tax-benefit__title,
.tax-benefit__compare {
  display: flex;
  justify-content: space-between;
}

.tax-benefit__title {
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e8eb;
  font-size: 11px;
}

.tax-benefit__title strong {
  color: #517594;
  font-weight: 500;
}

.tax-benefit__compare {
  padding: 10px 0 4px;
}

.tax-benefit__compare > div {
  display: grid;
  gap: 4px;
  width: 47%;
  font-size: 10px;
}

.tax-benefit__compare strong {
  color: #191f28;
  font-size: 12px;
  font-weight: 500;
}

.tax-benefit ul {
  display: grid;
  gap: 5px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  font-size: 10px;
  line-height: 15px;
}

.tax-benefit li::before {
  content: '✓';
  margin-right: 6px;
  color: #517594;
}

.tax-callout {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 22px;
  padding: 16px 14px;
  border-radius: 20px;
  color: #517594;
  background: #eef5ff;
}

.tax-callout svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.tax-callout p {
  margin: 0;
  font-size: 11px;
  line-height: 18px;
}

.tax-callout strong {
  font-weight: 500;
}

.asset-total {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 18px;
  padding-top: 20px;
  border-top: 1px solid #e5e8eb;
}

.asset-total span {
  color: #4e5968;
  font-size: 12px;
  line-height: 20px;
}

.asset-total strong {
  color: #517594;
  font-family: Arial, sans-serif;
  font-size: 22px;
  font-weight: 400;
  line-height: 32px;
}

@media (max-width: 359px) {
  .asset-total strong {
    font-size: 20px;
  }
}
</style>
