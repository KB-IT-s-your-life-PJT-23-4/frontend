<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  danger: { type: Boolean, default: false },
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-backdrop" role="presentation" @click.self="$emit('close')">
        <section class="modal-sheet" role="dialog" aria-modal="true" :aria-label="title">
          <span class="modal-handle" />
          <div v-if="$slots.icon" class="modal-icon" :class="{ danger }"><slot name="icon" /></div>
          <h2>{{ title }}</h2>
          <p v-if="description" class="modal-description">{{ description }}</p>
          <div class="modal-body"><slot /></div>
          <div class="modal-actions"><slot name="actions" /></div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

