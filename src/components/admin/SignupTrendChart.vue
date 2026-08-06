<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
})

const maxCount = computed(() => Math.max(...props.items.map((item) => item.count), 1))
const summary = computed(() => {
  if (!props.items.length) return '최근 가입자 추이 데이터가 없습니다.'
  const total = props.items.reduce((sum, item) => sum + item.count, 0)
  const peak = props.items.reduce((highest, item) => (item.count > highest.count ? item : highest))
  return `최근 7일 신규 가입자는 총 ${total.toLocaleString('ko-KR')}명이며, 가장 많은 날은 ${formatDate(peak.date)} ${peak.count.toLocaleString('ko-KR')}명입니다.`
})

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<template>
  <section class="admin-panel signup-trend" aria-labelledby="signup-trend-title">
    <div class="admin-panel__heading">
      <div>
        <span>USER GROWTH</span>
        <h2 id="signup-trend-title">최근 7일 가입 추이</h2>
      </div>
      <span class="admin-panel__caption">일별 신규 가입자</span>
    </div>

    <p class="sr-only">{{ summary }}</p>
    <div v-if="items.length" class="signup-chart" aria-hidden="true">
      <div v-for="item in items" :key="item.date" class="signup-chart__item">
        <strong>{{ item.count }}</strong>
        <div class="signup-chart__track">
          <span :style="{ height: `${Math.max((item.count / maxCount) * 100, 8)}%` }" />
        </div>
        <small>{{ formatDate(item.date) }}</small>
      </div>
    </div>
    <p v-else class="admin-inline-empty">표시할 가입자 추이가 없습니다.</p>
  </section>
</template>
