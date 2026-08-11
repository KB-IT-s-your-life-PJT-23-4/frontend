<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useAppStore } from '../../stores/appStore.js'
import { useAuthStore } from '../../stores/authStore.js'
import { isAdminRole } from '../../utils/adminAccess.js'
import '../../assets/css/app-header.css'

defineProps({
  showLogin: { type: Boolean, default: false },
  showAdminMenu: { type: Boolean, default: false },
})

defineEmits(['open-admin-menu'])

const store = useAppStore()
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isLogin && isAdminRole(authStore.user?.role))
</script>

<template>
  <header class="app-header">
    <div class="brand-lockup" aria-label="미리줌 바로가기">
      <RouterLink class="brand-home-link" to="/" aria-label="미리줌 홈">
        <img src="/src/assets/brand-symbol.png" alt="" class="brand-avatar" />
        <span>미리줌</span>
      </RouterLink>
      <RouterLink
        v-if="isAdmin"
        class="mobile-admin-dashboard-link"
        to="/admin/dashboard"
        aria-label="관리자 대시보드로 이동"
        title="관리자 대시보드"
      >
        <AppIcon name="shield" :size="16" />
        <span>관리자</span>
      </RouterLink>
    </div>

    <span class="header-spacer" />

    <div class="header-actions">
      <RouterLink
        class="icon-button notification-button"
        to="/notifications"
        aria-label="알림 보기"
      >
        <AppIcon name="bell" :size="20" />
        <span v-if="store.unreadCount.value" class="notification-dot">
          {{ store.unreadCount.value }}
        </span>
      </RouterLink>
      <button
        v-if="showAdminMenu && isAdmin"
        class="admin-mobile-menu-button"
        type="button"
        aria-label="관리자 메뉴 열기"
        @click="$emit('open-admin-menu')"
      >
        <AppIcon name="menu" :size="18" />
        관리자 메뉴
      </button>
      <RouterLink v-if="showLogin && !authStore.isLogin" class="header-login-link" to="/login">
        로그인
      </RouterLink>
      <RouterLink v-else-if="showLogin" class="header-login-link" to="/my">
        {{ authStore.user?.name ? `${authStore.user.name}님` : '마이페이지' }}
      </RouterLink>
    </div>
  </header>
</template>
