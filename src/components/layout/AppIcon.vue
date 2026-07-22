<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 22 },
  strokeWidth: { type: [Number, String], default: 1.8 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="name === 'home'">
        <path d="M3.5 10.5 12 3.7l8.5 6.8" />
        <path d="M5.7 9.4v10h12.6v-10M9.6 19.4v-5.2h4.8v5.2" />
      </template>
      <template v-else-if="name === 'calculator'">
        <rect x="4.5" y="2.8" width="15" height="18.4" rx="2.5" />
        <path d="M7.8 6.3h8.4v3.1H7.8zM8 13h.1M12 13h.1M16 13h.1M8 17h.1M12 17h.1M16 17h.1" />
      </template>
      <template v-else-if="name === 'chart'">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </template>
      <template v-else-if="name === 'chat'">
        <path d="M4.2 4.5h15.6v11.2H9l-4.8 3.8v-15Z" />
        <path d="M8 9h8M8 12.5h5" />
      </template>
      <template v-else-if="name === 'user'">
        <circle cx="12" cy="8" r="3.3" />
        <path d="M5.3 20c.5-4 2.8-6 6.7-6s6.2 2 6.7 6" />
      </template>
      <template v-else-if="name === 'bell'">
        <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 5 2 5.8 2 5.8h-15s2-.8 2-5.8Z" />
        <path d="M10 19h4" />
      </template>
      <template v-else-if="name === 'arrow'">
        <path d="M5 12h14M14 7l5 5-5 5" />
      </template>
      <template v-else-if="name === 'chevron'">
        <path d="m9 5 7 7-7 7" />
      </template>
      <template v-else-if="name === 'back'">
        <path d="m15 5-7 7 7 7" />
      </template>
      <template v-else-if="name === 'plus'">
        <path d="M12 5v14M5 12h14" />
      </template>
      <template v-else-if="name === 'clock'">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.4 2" />
      </template>
      <template v-else-if="name === 'calendar'">
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
        <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
      </template>
      <template v-else-if="name === 'wallet'">
        <path d="M4 6.5h14.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2h12" />
        <path d="M15 11h5.5v4H15a2 2 0 0 1 0-4Z" />
      </template>
      <template v-else-if="name === 'document'">
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h4M9 12h6M9 16h6" />
      </template>
      <template v-else-if="name === 'shield'">
        <path d="M12 3 19 6v5.2c0 4.5-2.8 7.7-7 9.8-4.2-2.1-7-5.3-7-9.8V6z" />
        <path d="m9 12 2 2 4-4" />
      </template>
      <template v-else-if="name === 'info'">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10.5V17M12 7h.01" />
      </template>
      <template v-else-if="name === 'check'">
        <path d="m5 12 4.2 4L19 6.5" />
      </template>
      <template v-else-if="name === 'trash'">
        <path d="M4 7h16M9 3h6l1 4H8zM6 7l1 14h10l1-14M10 11v6M14 11v6" />
      </template>
      <template v-else-if="name === 'send'">
        <path d="m3 4 18 8-18 8 3-8zM6 12h15" />
      </template>
      <template v-else-if="name === 'sparkles'">
        <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4zM18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
      </template>
      <template v-else-if="name === 'settings'">
        <circle cx="12" cy="12" r="3" />
        <path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.7-1.7l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.7-.7L10.8 2h-3l-.7 2.3a7 7 0 0 0-1.7.7l-1.9-.9-2.1 2.1.9 1.9a7 7 0 0 0-.7 1.7L0 10.5v3l2 .7c.2.6.4 1.2.7 1.7l-.9 1.9 2.1 2.1 1.9-.9c.5.3 1.1.5 1.7.7l.7 2.3h3l.7-2.3c.6-.2 1.2-.4 1.7-.7l1.9.9 2.1-2.1-.9-1.9c.3-.5.5-1.1.7-1.7z" transform="translate(2) scale(.83)" />
      </template>
      <template v-else>
        <circle cx="12" cy="12" r="8.5" />
      </template>
    </g>
  </svg>
</template>

