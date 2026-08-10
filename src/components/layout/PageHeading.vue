<script setup>
import AppIcon from './AppIcon.vue'
import '../../assets/css/page-heading.css'

defineProps({
  title: { type: String, required: true },
  headingId: { type: String, default: undefined },
  kicker: { type: String, default: '' },
  description: { type: String, default: '' },
  back: { type: Boolean, default: false },
  backLabel: { type: String, default: '이전' },
})

defineEmits(['back'])
</script>

<template>
  <header class="page-heading" :class="{ 'page-heading--detailed': back || kicker || description }">
    <button v-if="back" class="page-heading-back" type="button" @click="$emit('back')">
      <AppIcon name="back" :size="17" />
      <span>{{ backLabel }}</span>
    </button>
    <span v-if="kicker" class="page-heading-kicker">{{ kicker }}</span>
    <h1 :id="headingId">{{ title }}</h1>
    <p v-if="description" class="page-heading-description">{{ description }}</p>
  </header>
</template>
