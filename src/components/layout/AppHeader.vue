<script setup>
import AppIcon from './AppIcon.vue'
import { useAppStore } from '../../stores/appStore.js'
import { useAuthStore } from '../../stores/authStore.js'

defineProps({
  showLogin: { type: Boolean, default: false },
})

const store = useAppStore()
const authStore = useAuthStore()
</script>

<template>
  <header class="app-header">
    <div class="brand-lockup" aria-label="미리줌 바로가기">
      <RouterLink to="/" aria-label="미리줌 홈">
        <img src="/src/assets/brand-symbol.png" alt="" class="brand-avatar" />
      </RouterLink>
      <RouterLink to="/admin/dashboard" aria-label="관리자 대시보드로 이동" title="관리자 대시보드">
        미리줌
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
      <RouterLink v-if="showLogin && !authStore.isLogin" class="header-login-link" to="/login">
        로그인
      </RouterLink>
      <RouterLink v-else-if="showLogin" class="header-login-link" to="/my">
        {{ authStore.user?.name ? `${authStore.user.name}님` : '마이페이지' }}
      </RouterLink>
    </div>
  </header>
</template>
