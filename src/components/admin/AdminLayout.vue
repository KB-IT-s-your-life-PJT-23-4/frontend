<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppHeader from '../layout/AppHeader.vue'
import AdminSidebar from './AdminSidebar.vue'

const isSidebarOpen = ref(false)

function closeSidebar() {
  isSidebarOpen.value = false
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeSidebar()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="admin-page-layout">
    <AppHeader show-login show-admin-menu @open-admin-menu="isSidebarOpen = true" />
    <div class="admin-shell">
      <AdminSidebar :is-open="isSidebarOpen" @close="closeSidebar" />
      <button
        v-if="isSidebarOpen"
        class="admin-sidebar-backdrop"
        type="button"
        aria-label="관리자 메뉴 닫기"
        @click="closeSidebar"
      />
      <div class="admin-workspace">
        <div class="admin-content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
