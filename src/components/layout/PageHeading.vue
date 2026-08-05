<script setup>
import '../../assets/css/page-heading.css'

defineProps({
  title: { type: String, required: true },
  headingId: { type: String, default: undefined },
})
</script>

<template>
  <header class="page-heading">
    <h1 :id="headingId">{{ title }}</h1>
  </header>
</template>
