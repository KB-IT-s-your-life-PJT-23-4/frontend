<script setup>
import AppIcon from '../layout/AppIcon.vue'

defineProps({
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const menuItems = [
  { label: '대시보드', icon: 'chart', to: '/admin/dashboard', available: true },
  { label: '회원 관리', icon: 'user' },
  { label: '상품 관리', icon: 'wallet' },
  { label: '신고 관리', icon: 'document' },
  { label: '세법 관리', icon: 'shield' },
  { label: 'FAQ 및 상담 콘텐츠 관리', icon: 'chat' },
  { label: '배치 작업 관리', icon: 'refresh' },
  { label: '권한 관리', icon: 'settings' },
  { label: '감사 로그', icon: 'clock' },
]
</script>

<template>
  <aside class="admin-sidebar" :class="{ 'is-open': isOpen }" aria-label="관리자 메뉴">
    <div class="admin-sidebar__top">
      <RouterLink class="admin-brand" to="/admin/dashboard" @click="emit('close')">
        <img src="/src/assets/brand-symbol.png" alt="" />
        <span>
          <strong>미리줌</strong>
          <small>ADMIN CONSOLE</small>
        </span>
      </RouterLink>
      <button
        class="admin-sidebar__close"
        type="button"
        aria-label="관리자 메뉴 닫기"
        @click="emit('close')"
      >
        <AppIcon name="close" :size="22" />
      </button>
    </div>

    <nav class="admin-sidebar__nav" aria-label="관리자 주요 메뉴">
      <p>MANAGEMENT</p>
      <template v-for="item in menuItems" :key="item.label">
        <RouterLink
          v-if="item.available"
          :to="item.to"
          class="admin-menu-item"
          @click="emit('close')"
        >
          <AppIcon :name="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </RouterLink>
        <div v-else class="admin-menu-item is-disabled" aria-disabled="true">
          <AppIcon :name="item.icon" :size="20" />
          <span>{{ item.label }}</span>
          <small>준비 중</small>
        </div>
      </template>
    </nav>

    <div class="admin-sidebar__notice">
      <AppIcon name="shield" :size="18" />
      <span>관리자 전용 화면</span>
    </div>
  </aside>
</template>
