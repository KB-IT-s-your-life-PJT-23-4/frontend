<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = [
  { key: 'calculator', label: 'Simulation', routeName: 'simulation', to: '/simulation' },
  { key: 'chart', label: '통계' },
  { key: 'home', label: 'Home', routeName: 'home', to: '/' },
  { key: 'message', label: '상담' },
  { key: 'user', label: 'My' },
]

const activeRouteName = computed(() => route.name)

function navigate(item) {
  if (item.to) router.push(item.to)
}
</script>

<template>
  <footer class="bottom-nav" data-node-id="40:4840">
    <nav class="bottom-nav__inner" aria-label="주요 메뉴">
      <button
        v-for="item in navItems"
        :key="item.key"
        class="bottom-nav__item"
        :class="{ 'bottom-nav__item--active': item.routeName === activeRouteName }"
        type="button"
        :aria-label="item.label"
        :aria-current="item.routeName === activeRouteName ? 'page' : undefined"
        @click="navigate(item)"
      >
        <svg v-if="item.key === 'calculator'" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M7 7h10M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 18h1M12 18h5" />
        </svg>
        <svg v-else-if="item.key === 'chart'" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 16v-3M12 16V8M17 16v-6" />
        </svg>
        <svg v-else-if="item.key === 'home'" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3Z" />
        </svg>
        <svg v-else-if="item.key === 'message'" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h16v13H8l-4 4Z" />
          <path d="M8 9h8M8 13h6" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6Z" />
        </svg>
        <span v-if="item.routeName === activeRouteName" class="bottom-nav__label">
          {{ item.label }}
        </span>
      </button>
    </nav>
  </footer>
</template>
