import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/HomeView.vue'
import SimulationView from '../pages/SimulationView.vue'
import StatusView from '../pages/StatusView.vue'
import ChatView from '../pages/ChatView.vue'
import TicketView from '../pages/TicketView.vue'
import MyPageView from '../pages/MyPageView.vue'
import ProfileDetailView from '../pages/ProfileDetailView.vue'
import ProfileEditView from '../pages/ProfileEditView.vue'
import RecipientDetailView from '../pages/RecipientDetailView.vue'
import RecipientEditView from '../pages/RecipientEditView.vue'
import NotificationsView from '../pages/NotificationsView.vue'
import GuideDetailView from '../pages/GuideDetailView.vue'
import LoginView from '../pages/LoginView.vue'
import SignupView from '../pages/SignupView.vue'
import AdminDashboardView from '../pages/AdminDashboardView.vue'
import AdminUserView from '../pages/AdminUserView.vue'
import AdminProductsView from '../pages/AdminProductsView.vue'
import AdminFaqView from '../pages/AdminFaqView.vue'
import AdminReportView from '../pages/AdminReportView.vue'
import AdminAuthorizationView from '../pages/AdminAuthorizationView.vue'
import AdminNotificationView from '../pages/AdminNotificationView.vue'
import AdminBatchView from '../pages/AdminBatchView.vue'
import { restoreAuthSession } from '../api/apiAdapter'
import { showBlockedAccess } from '../stores/accountAccessStore'
import { useAuthStore } from '../stores/authStore'
import { isAccountBlocked } from '../utils/accountAccess'
import { isAdminRole } from '../utils/adminAccess.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { label: '홈' } },
    {
      path: '/simulation',
      name: 'simulation',
      component: SimulationView,
      meta: { label: '시뮬레이션', requiresAuth: true, requiresActiveAccount: true },
    },
    { path: '/status', name: 'status', component: StatusView, meta: { label: '증여 현황' } },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
      meta: { label: 'AI 상담', requiresAuth: true, requiresActiveAccount: true },
    },
    {
      path: '/ticket',
      name: 'ticket',
      component: TicketView,
      meta: { label: '번호표 뽑기', requiresAuth: true, requiresActiveAccount: true },
    },
    {
      path: '/my',
      name: 'my',
      component: MyPageView,
      meta: { label: '마이', requiresAuth: true },
    },
    {
      path: '/my/simulationHistory/:simulationId',
      name: 'simulation-history-detail',
      component: SimulationView,
      meta: {
        label: '시뮬레이션 이력 결과',
        requiresAuth: true,
        requiresActiveAccount: true,
      },
    },
    {
      path: '/my/profile',
      name: 'profile-detail',
      component: ProfileDetailView,
      meta: { label: '내 상세 정보', requiresAuth: true },
    },
    {
      path: '/my/profile/edit',
      name: 'profile-edit',
      component: ProfileEditView,
      meta: { label: '회원 정보 수정', requiresAuth: true },
    },
    {
      path: '/my/family/:familyId',
      name: 'recipient-detail',
      component: RecipientDetailView,
      meta: { label: '수증자 상세 정보', requiresAuth: true },
    },
    {
      path: '/my/family/:familyId/edit',
      name: 'recipient-edit',
      component: RecipientEditView,
      meta: { label: '수증자 정보 수정', requiresAuth: true },
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
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: {
        label: '관리자 대시보드',
        requiresAuth: true,
        requiresAdmin: true,
        layout: 'admin',
        hideBottomNav: true,
      },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUserView,
      meta: {
        label: '회원 관리',
        requiresAuth: true,
        requiresAdmin: true,
        layout: 'admin',
        hideBottomNav: true,
      },
    },
    {
      path: '/admin/products',
      name: 'admin-products',
      component: AdminProductsView,
      meta: {
        label: '상품 관리',
        requiresAuth: true,
        requiresAdmin: true,
        requiresRole: ['ROOT', 'MIDDLE'],
        layout: 'admin',
        hideBottomNav: true,
      },
    },
    {
      path: '/admin/faq',
      name: 'admin-faq',
      component: AdminFaqView,
      meta: {
        label: 'FAQ 관리',
        requiresAuth: true,
        requiresAdmin: true,
        layout: 'admin',
        hideBottomNav: true,
      },
    },
    {
      path: '/admin/reports',
      alias: '/admin/report',
      name: 'admin-reports',
      component: AdminReportView,
      meta: {
        label: '신고 관리',
        requiresAuth: true,
        requiresAdmin: true,
        layout: 'admin',
        hideBottomNav: true,
      },
    },
    {
      path: '/admin/notifications',
      alias: '/admin/notification',
      name: 'admin-notifications',
      component: AdminNotificationView,
      meta: {
        label: '알림',
        requiresAuth: true,
        requiresAdmin: true,
        layout: 'admin',
        hideBottomNav: true,
      },
    },
    {
      path: '/admin/batch',
      name: 'admin-batch',
      component: AdminBatchView,
      meta: {
        label: '배치 작업 관리',
        requiresAuth: true,
        requiresAdmin: true,
        layout: 'admin',
        hideBottomNav: true,
      },
    },
    {
      path: '/admin/authorization',
      alias: '/admin/auth',
      name: 'admin-authorization',
      component: AdminAuthorizationView,
      meta: {
        label: '권한 관리',
        requiresAuth: true,
        requiresAdmin: true,
        layout: 'admin',
        hideBottomNav: true,
      },
    },
    {
      path: '/admin/audit',
      name: 'admin-audit',
      component: AdminAuditView,
      meta: {
        label: '감사 로그',
        requiresAuth: true,
        requiresAdmin: true,
        requiresRole: ['ROOT'],
        layout: 'admin',
        hideBottomNav: true,
      },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 24, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const authStore = useAuthStore()
  if (!authStore.isLogin) {
    const hadSession = Boolean(authStore.accessToken || authStore.refreshToken || authStore.user)

    if (authStore.refreshToken) {
      try {
        const session = await restoreAuthSession()
        authStore.setAuthSession(session)
      } catch {}
    }

    if (!authStore.isLogin) {
      if (hadSession) await authStore.clearSession()
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }
  }

  if (to.meta.requiresAdmin) {
    const role = String(authStore.user?.role ?? '').toUpperCase()
    if (!isAdminRole(role)) return { name: 'home' }

    const allowedRoles = (to.meta.requiresRole ?? []).map((allowedRole) =>
      String(allowedRole).toUpperCase(),
    )
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) return { name: 'home' }
  }

  if (to.meta.requiresActiveAccount) {
    try {
      const profile = await authStore.fetchUserProfile()
      if (isAccountBlocked(profile)) {
        showBlockedAccess()
        return false
      }
    } catch {
      if (!authStore.isLogin) {
        return {
          name: 'login',
          query: { redirect: to.fullPath },
        }
      }
      return { name: 'home' }
    }
  }

  return true
})

export default router
