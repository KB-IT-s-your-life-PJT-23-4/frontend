<script setup>
import AppIcon from '../layout/AppIcon.vue'

defineProps({
  state: { type: String, required: true },
  message: { type: String, default: '' },
})

const emit = defineEmits(['retry'])
</script>

<template>
  <section class="admin-dashboard-state" :class="`is-${state}`" role="status">
    <template v-if="state === 'loading'">
      <span class="admin-loading-spinner" aria-hidden="true" />
      <div>
        <h2>운영 현황을 불러오고 있습니다</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    </template>
    <template v-else-if="state === 'error'">
      <span class="admin-state-icon" aria-hidden="true"><AppIcon name="info" :size="25" /></span>
      <div>
        <h2>데이터를 불러오지 못했습니다</h2>
        <p>{{ message }}</p>
        <button type="button" @click="emit('retry')">다시 시도</button>
      </div>
    </template>
    <template v-else>
      <span class="admin-state-icon" aria-hidden="true"
        ><AppIcon name="document" :size="25"
      /></span>
      <div>
        <h2>표시할 대시보드 데이터가 없습니다</h2>
        <p>집계가 완료된 뒤 새로고침해주세요.</p>
        <button type="button" @click="emit('retry')">새로고침</button>
      </div>
    </template>
  </section>
</template>
