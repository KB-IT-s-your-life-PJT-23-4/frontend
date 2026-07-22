<script setup>
defineProps({
  plan: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="product-card">
    <div class="product-heading">
      <div class="product-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="m3 9 9-5 9 5M5 10h14M6 10v7m4-7v7m4-7v7m4-7v7M4 20h16" />
        </svg>
      </div>
      <div>
        <h2>{{ plan.product }}</h2>
        <p>{{ plan.subtitle }}</p>
      </div>
    </div>

    <div class="product-facts">
      <div>
        <span>{{ plan.rateLabel }}</span>
        <strong>{{ plan.rate }}</strong>
      </div>
      <div>
        <span>{{ plan.periodLabel }}</span>
        <strong>{{ plan.period }}</strong>
      </div>
    </div>

    <div v-if="plan.note" class="product-note">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 11v5M12 8v.1" />
      </svg>
      <p>{{ plan.note }}</p>
    </div>

    <div v-if="plan.risk" class="risk-warning">
      <div>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 2.5 20h19Z" />
          <path d="M12 9v5M12 17v.1" />
        </svg>
        <strong>위험도 높음</strong>
      </div>
      <p>
        주식형 ETF 비중이 높아 시장 상황에 따라 원금 손실 가능성이 있습니다. 장기 투자 시
        변동성을 완화할 수 있습니다.
      </p>
    </div>
  </section>
</template>

<style scoped>
.product-card {
  padding: 24px;
  border-radius: 24px;
  background: #fff;
}

.product-heading {
  display: flex;
  gap: 12px;
  align-items: center;
}

.product-heading h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  line-height: 24px;
}

.product-heading p {
  margin: 0;
  color: #6b7684;
  font-size: 11px;
  line-height: 19px;
}

.product-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #517594;
  background: #e8f1ff;
}

.product-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.product-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.product-facts > div {
  display: flex;
  min-height: 76px;
  flex-direction: column;
  gap: 5px;
  padding: 16px;
  border-radius: 20px;
  background: #f9fafb;
}

.product-facts span {
  color: #6b7684;
  font-size: 9px;
  line-height: 15px;
}

.product-facts strong {
  color: #191f28;
  font-size: 11px;
  font-weight: 500;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.product-facts > div:first-child strong {
  color: #517594;
  font-size: 14px;
}

.product-note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 16px;
  padding: 14px;
  border-radius: 20px;
  color: #517594;
  background: #eef5ff;
}

.product-note svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.product-note p,
.risk-warning p {
  margin: 0;
  font-size: 11px;
  line-height: 18px;
}

.risk-warning {
  margin-top: 16px;
  padding: 16px;
  border-radius: 20px;
  color: #f04452;
  background: #fffafa;
}

.risk-warning > div {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-bottom: 8px;
}

.risk-warning svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.risk-warning strong {
  font-size: 14px;
  font-weight: 500;
}

.risk-warning p {
  color: #8b95a1;
}
</style>
