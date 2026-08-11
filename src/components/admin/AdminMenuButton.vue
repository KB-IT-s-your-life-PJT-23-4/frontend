<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { useAuthStore } from '../../stores/authStore.js'
import { isAdminRole } from '../../utils/adminAccess.js'
import '../../assets/css/admin-menu-button.css'

defineEmits(['open'])

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isLogin && isAdminRole(authStore.user?.role))
</script>

<template>
  <button
    v-if="isAdmin"
    class="admin-fixed-menu-button"
    type="button"
    aria-label="관리자 메뉴 열기"
    @click="$emit('open')"
  >
    <AppIcon name="menu" :size="18" />
    관리자 메뉴
  </button>
</template>
