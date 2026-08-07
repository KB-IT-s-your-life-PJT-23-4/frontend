<script setup>
import AppIcon from '../layout/AppIcon.vue'

defineProps({
  errors: { type: Object, required: true },
})

function formatCount(value) {
  return value === null || value === undefined ? '-' : value.toLocaleString('ko-KR')
}

const items = [
  { key: 'http422', code: 'HTTP 422', label: '요청 검증 오류', tone: 'warning' },
  { key: 'http500', code: 'HTTP 500', label: '서버 처리 오류', tone: 'danger' },
  { key: 'timeout', code: 'Timeout', label: '응답 시간 초과', tone: 'navy' },
]
</script>

<template>
  <section class="admin-panel error-summary" aria-labelledby="error-summary-title">
    <div class="admin-panel__heading">
      <div>
        <span>SERVICE ERRORS</span>
        <h2 id="error-summary-title">오류 발생 현황</h2>
      </div>
      <AppIcon name="info" :size="21" />
    </div>
    <div class="error-summary__list">
      <div v-for="item in items" :key="item.key" class="error-summary__item">
        <span class="error-summary__marker" :class="`is-${item.tone}`" aria-hidden="true" />
        <div>
          <strong>{{ item.code }}</strong>
          <small>{{ item.label }}</small>
        </div>
        <b>
          {{ formatCount(errors[item.key]) }}
          <small v-if="errors[item.key] !== null && errors[item.key] !== undefined">건</small>
        </b>
      </div>
    </div>
    <p v-if="!errors.available" class="admin-panel__unavailable">
      오류 집계 데이터가 수집되지 않았습니다.
    </p>
  </section>
</template>
