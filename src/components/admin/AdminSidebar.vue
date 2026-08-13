<script setup>
import { computed, onMounted } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import {
  refreshAdminUnreadCount,
  useAdminNotificationStore,
} from '../../stores/adminNotificationStore'

defineProps({
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const notificationStore = useAdminNotificationStore()
const unreadBadge = computed(() => {
  const count = notificationStore.state.unreadCount
  if (!count) return ''
  return count > 99 ? '99+' : String(count)
})

onMounted(refreshAdminUnreadCount)

const menuItems = [
  { label: '대시보드', icon: 'chart', to: '/admin/dashboard', available: true },
  { label: '알림', icon: 'bell', to: '/admin/notifications', available: true, badge: true },
  { label: '회원 관리', icon: 'user', to: '/admin/users', available: true },
  { label: '상품 관리', icon: 'wallet', to: '/admin/products', available: true },
  { label: '신고 관리', icon: 'document', to: '/admin/reports', available: true },
  { label: '세법 관리', icon: 'shield' },
  { label: 'FAQ 관리', icon: 'chat', to: '/admin/faq', available: true },
  { label: '배치 작업 관리', icon: 'refresh', to: '/admin/batch', available: true },
  { label: '권한 관리', icon: 'settings', to: '/admin/authorization', available: true },
  { label: '감사 로그', icon: 'clock' },
]
</script>

<template>
  <aside class="admin-sidebar" :class="{ 'is-open': isOpen }" aria-label="관리자 메뉴">
    <div class="admin-sidebar__top">
      <RouterLink class="admin-brand" to="/" @click="emit('close')">
        <img src="/src/assets/brand-symbol.png" alt="" />
        <span>
          <strong>미리줌</strong>
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
      <template v-for="item in menuItems" :key="item.label">
        <RouterLink
          v-if="item.available"
          :to="item.to"
          class="admin-menu-item"
          @click="emit('close')"
        >
          <AppIcon :name="item.icon" :size="20" />
          <span>{{ item.label }}</span>
          <small v-if="item.badge && unreadBadge" class="admin-menu-item__badge">
            {{ unreadBadge }}
          </small>
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
