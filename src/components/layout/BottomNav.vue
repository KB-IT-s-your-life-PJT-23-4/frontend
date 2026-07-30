<script setup>
import AppIcon from './AppIcon.vue'

const items = [
  { to: '/', label: '홈', shortLabel: '홈', icon: 'home' },

  { to: '/status', label: '현황', shortLabel: '현황', icon: 'chart' },
  {
    to: '/simulation',
    label: '시뮬레이션',
    shortLabel: '시뮬레이션',
    icon: 'calculator',
    featured: true,
  },
  { to: '/chat', label: 'AI 상담', shortLabel: '상담', icon: 'chat' },
  { to: '/my', label: '내 정보', shortLabel: '마이', icon: 'user' },
]
</script>

<template>
  <nav class="bottom-nav" aria-label="주요 메뉴">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="item.featured ? 'nav-item--featured' : 'nav-item'"
    >
      <template v-if="item.featured" :key="`featured-${item.to}`">
        <div class="nav-item-circle">
          <span class="nav-icon">
            <AppIcon :name="item.icon" :size="28" />
          </span>
        </div>
      </template>
      <template v-else :key="`normal-${item.to}`">
        <span class="nav-icon">
          <AppIcon :name="item.icon" :size="24" />
        </span>
        <span class="nav-label">{{ item.label }}</span>
      </template>
    </RouterLink>
  </nav>
</template>
