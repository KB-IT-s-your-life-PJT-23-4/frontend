<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useAuthStore } from '../../stores/authStore.js'

const authStore = useAuthStore()

const items = computed(() => [
  {
    to: authStore.isLogin ? { name: 'home-dashboard' } : { name: 'home' },
    key: 'home',
    label: '홈',
    shortLabel: '홈',
    icon: 'home',
  },
  { to: '/status', key: 'status', label: '현황', shortLabel: '현황', icon: 'chart' },
  {
    to: '/simulation',
    key: 'simulation',
    label: '시뮬레이션',
    shortLabel: '시뮬레이션',
    icon: 'calculator',
    featured: true,
  },
  { to: '/chat', key: 'chat', label: 'AI 상담', shortLabel: '상담', icon: 'chat' },
  { to: '/my', key: 'my', label: '내 정보', shortLabel: '마이', icon: 'user' },
])
</script>

<template>
  <nav class="bottom-nav" aria-label="주요 메뉴">
    <RouterLink
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      class="nav-item"
      :class="{ 'nav-item--featured': item.featured }"
    >
      <span class="nav-icon">
        <AppIcon :name="item.icon" :size="item.featured ? 24 : 22" />
      </span>
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
