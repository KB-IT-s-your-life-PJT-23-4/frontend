import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/HomeView.vue'
import SimulationView from '../pages/SimulationView.vue'
import StatusView from '../pages/StatusView.vue'
import ChatView from '../pages/ChatView.vue'
import MyPageView from '../pages/MyPageView.vue'
import NotificationsView from '../pages/NotificationsView.vue'
import GuideDetailView from '../pages/GuideDetailView.vue'
import LoginView from '../pages/LoginView.vue'
import SignupView from '../pages/SignupView.vue'
import { restoreAuthSession } from '../api/apiAdapter'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { label: '홈' } },
    {
      path: '/simulation',
      name: 'simulation',
      component: SimulationView,
      meta: { label: '시뮬레이션' },
    },
    { path: '/status', name: 'status', component: StatusView, meta: { label: '증여 현황' } },
    { path: '/chat', name: 'chat', component: ChatView, meta: { label: 'AI 상담' } },
    {
      path: '/my',
      name: 'my',
      component: MyPageView,
      meta: { label: '마이', requiresAuth: true },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsView,
      meta: { label: '알림' },
    },
    {
      path: '/guides/:slug(mirizoom|tax-brackets|gift-reporting|non-cash-gifts)',
      name: 'guide-detail',
      component: GuideDetailView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { label: '로그인', hideBottomNav: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
      meta: { label: '회원가입', hideBottomNav: true },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const authStore = useAuthStore()
  if (authStore.isLogin) return true

  if (authStore.refreshToken) {
    try {
      const session = await restoreAuthSession()
      authStore.setAuthSession(session)
      if (authStore.isLogin) return true
    } catch {}
  }

  authStore.clearAuth()
  return {
    name: 'login',
    query: { redirect: to.fullPath },
  }
})

export default router
