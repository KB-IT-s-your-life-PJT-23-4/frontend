import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './pages/HomeView.vue'
import SimulationView from './pages/SimulationView.vue'
import StatusView from './pages/StatusView.vue'
import ChatView from './pages/ChatView.vue'
import MyPageView from './pages/MyPageView.vue'
import NotificationsView from './pages/NotificationsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
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
    { path: '/my', name: 'my', component: MyPageView, meta: { label: '마이' } },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsView,
      meta: { label: '알림' },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
