<script setup>
import AppIcon from '../layout/AppIcon.vue'

defineProps({
  products: { type: Object, required: true },
  formattedDate: { type: String, required: true },
})

const items = [
  { key: 'deposits', label: '예금', tone: 'yellow' },
  { key: 'savings', label: '적금', tone: 'blue' },
  { key: 'etfs', label: 'ETF', tone: 'navy' },
]
</script>

<template>
  <section class="admin-panel product-summary" aria-labelledby="product-summary-title">
    <div class="admin-panel__heading">
      <div>
        <span>PRODUCT DATA</span>
        <h2 id="product-summary-title">최신 상품 데이터</h2>
      </div>
      <AppIcon name="wallet" :size="22" />
    </div>
    <dl class="product-summary__meta">
      <div>
        <dt>데이터 기준일</dt>
        <dd>{{ formattedDate }}</dd>
      </div>
      <div>
        <dt>버전</dt>
        <dd>{{ products.version }}</dd>
      </div>
    </dl>
    <div class="product-summary__counts">
      <div v-for="item in items" :key="item.key">
        <span :class="`is-${item.tone}`" aria-hidden="true" />
        <small>{{ item.label }}</small>
        <strong>{{ products[item.key].toLocaleString('ko-KR') }}<b>개</b></strong>
      </div>
    </div>
  </section>
</template>
