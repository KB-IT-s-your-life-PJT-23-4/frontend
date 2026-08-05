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
    <RouterLink class="brand-lockup" to="/" aria-label="미리줌 홈">
      <img src="/src/assets/brand-symbol.png" alt="" class="brand-avatar" />
      <span>미리줌</span>
    </RouterLink>

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
