<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './components/layout/AppIcon.vue'
import BottomNav from './components/layout/BottomNav.vue'
import { useAppStore } from './stores/appStore.js'

const store = useAppStore()
const route = useRoute()
const isAdminLayout = computed(() => route.meta.layout === 'admin')
const showBottomNav = computed(() => !route.meta.hideBottomNav)

watchEffect(() => {
  document.body.classList.toggle('admin-route', isAdminLayout.value)
})
</script>

<template>
  <a class="skip-link" href="#main-content">본문으로 바로가기</a>
  <main v-if="isAdminLayout" id="main-content" class="admin-app-frame">
    <RouterView />
  </main>
  <div v-else class="desktop-shell">
    <aside class="desktop-brand-panel" aria-label="미리줌 소개">
      <div class="desktop-brand">
        <img src="/src/assets/brand-symbol.png" alt="" />
        <div>
          <strong>미리줌</strong>
          <span>우리 가족 증여 플래너</span>
        </div>
      </div>
      <div class="desktop-message">
        <h2>복잡한 증여를<br />가족의 계획으로.</h2>
        <p>세금부터 장기 운용까지,<br />한 번에 비교하고 미리 준비하세요.</p>
      </div>
      <nav class="desktop-nav" aria-label="데스크톱 주요 메뉴">
        <RouterLink to="/"><AppIcon name="home" :size="20" /> 홈</RouterLink>
        <RouterLink to="/simulation"><AppIcon name="calculator" :size="20" /> 증여 설계</RouterLink>
        <RouterLink to="/status"><AppIcon name="chart" :size="20" /> 증여 현황</RouterLink>
        <RouterLink to="/chat"><AppIcon name="chat" :size="20" /> AI 상담</RouterLink>
        <RouterLink to="/my"><AppIcon name="user" :size="20" /> 마이페이지</RouterLink>
      </nav>
      <div class="desktop-security">
        <AppIcon name="shield" :size="19" />
        <span>데모 데이터는 브라우저에만 저장됩니다.</span>
      </div>
    </aside>

    <main id="main-content" class="app-frame">
      <RouterView />
      <BottomNav v-if="showBottomNav" />
    </main>
  </div>

  <Transition name="toast">
    <div
      v-if="store.toast.visible"
      class="toast"
      :class="`toast-${store.toast.type}`"
      role="status"
    >
      <AppIcon :name="store.toast.type === 'success' ? 'check' : 'info'" :size="18" />
      <span>{{ store.toast.message }}</span>
    </div>
  </Transition>
</template>
