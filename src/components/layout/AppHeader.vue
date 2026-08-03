<script setup>
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { useAppStore } from '../../stores/appStore.js'
import { useAuthStore } from '../../stores/authStore.js'

defineProps({
  title: { type: String, default: '' },
  back: { type: Boolean, default: false },
  showLogin: { type: Boolean, default: false },
  showNotifications: { type: Boolean, default: true },
})

const router = useRouter()
const store = useAppStore()
const authStore = useAuthStore()
</script>

<template>
  <header class="app-header">
    <button
      v-if="back"
      class="icon-button header-back"
      type="button"
      aria-label="뒤로 가기"
      @click="router.back()"
    >
      <AppIcon name="back" :size="21" />
    </button>
    <RouterLink v-else class="brand-lockup" to="/" aria-label="미리줌 홈">
      <img src="/src/assets/brand-symbol.png" alt="" class="brand-avatar" />
      <span>미리줌</span>
    </RouterLink>

    <h1 v-if="title" class="header-title">{{ title }}</h1>
    <span v-else class="header-spacer" />

    <div v-if="showNotifications || showLogin" class="header-actions">
      <RouterLink
        v-if="showNotifications"
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
    <span v-else class="header-spacer" />
  </header>
</template>
