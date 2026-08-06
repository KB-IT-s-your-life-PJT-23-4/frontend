<script setup>
defineProps({
  status: { type: String, required: true },
  label: { type: String, required: true },
})
</script>

<template>
  <span class="admin-status-badge" :class="`is-${status}`">
    <span aria-hidden="true" />
    {{ label }}
  </span>
</template>
