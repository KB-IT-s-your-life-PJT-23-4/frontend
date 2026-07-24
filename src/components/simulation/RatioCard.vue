<script setup>
import { computed } from 'vue'

const growthRatio = defineModel({
  type: Number,
  default: 60,
})

const riskLevel = computed(() => {
  if (growthRatio.value <= 30) return '위험도 낮음'
  if (growthRatio.value <= 70) return '위험도 보통'
  return '위험도 높음'
})
</script>

<template>
  <section class="ratio-card">
    <div class="ratio-card__head">
      <h2>투자 비율 설정</h2>
      <span class="risk-badge">{{ riskLevel }}</span>
    </div>

    <div class="ratio-labels" aria-hidden="true">
      <span>안정 (예적금)</span>
      <span>성장 (ETF)</span>
    </div>
    <input
      v-model.number="growthRatio"
      class="ratio-slider"
      type="range"
      min="0"
      max="100"
      step="10"
      aria-label="ETF 투자 비율"
      :style="{ '--ratio': `${growthRatio}%` }"
    />
    <div class="ratio-values">
      <div>
        <strong>{{ 100 - growthRatio }}%</strong>
        <span>예적금</span>
      </div>
      <div class="ratio-values__growth">
        <strong>{{ growthRatio }}%</strong>
        <span>ETF/주식</span>
      </div>
    </div>

  </section>
</template>

<style scoped>
.ratio-card {
  margin-bottom: 14px;
  padding: 24px;
  border-radius: 24px;
  background: #fff;
}

.ratio-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.ratio-card__head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 28px;
}

.risk-badge {
  padding: 4px 10px;
  border-radius: 999px;
  color: #6b7684;
  background: #f2f4f6;
  font-size: 9px;
  line-height: 16px;
}

.ratio-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  color: #8b95a1;
  font-size: 10px;
}

.ratio-slider {
  width: 100%;
  height: 6px;
  margin: 22px 0 18px;
  border-radius: 999px;
  cursor: pointer;
  appearance: none;
  background: linear-gradient(to right, #e5e8eb 0 var(--ratio), #f2f4f6 var(--ratio) 100%);
}

.ratio-slider::-webkit-slider-thumb {
  width: 26px;
  height: 26px;
  border: 1px solid #e5e8eb;
  border-radius: 50%;
  appearance: none;
  background: #fff;
  box-shadow: 0 2px 5px rgb(17 24 39 / 16%);
}

.ratio-slider::-moz-range-thumb {
  width: 26px;
  height: 26px;
  border: 1px solid #e5e8eb;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 5px rgb(17 24 39 / 16%);
}

.ratio-values {
  display: flex;
  justify-content: space-between;
}

.ratio-values > div {
  display: grid;
  gap: 4px;
}

.ratio-values strong {
  font-family: Arial, sans-serif;
  font-size: 24px;
  font-weight: 400;
}

.ratio-values span {
  color: #6b7684;
  font-size: 10px;
}

.ratio-values__growth {
  color: #517594;
  text-align: right;
}

</style>
