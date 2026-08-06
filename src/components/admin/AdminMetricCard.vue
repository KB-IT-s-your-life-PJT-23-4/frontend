<script setup>
import AppIcon from '../layout/AppIcon.vue'

defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  unit: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: 'chart' },
  tone: { type: String, default: 'blue' },
})
</script>

<template>
  <article class="admin-metric-card">
    <div class="admin-metric-card__top">
      <span class="admin-metric-card__icon" :class="`is-${tone}`" aria-hidden="true">
        <AppIcon :name="icon" :size="20" />
      </span>
      <span class="admin-metric-card__title">{{ title }}</span>
    </div>
    <p class="admin-metric-card__value">
      <strong>{{ value }}</strong>
      <span v-if="unit">{{ unit }}</span>
    </p>
    <p v-if="description" class="admin-metric-card__description">{{ description }}</p>
  </article>
</template>
