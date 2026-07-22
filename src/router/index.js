import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/home/HomeView.vue'
import SimulationView from '../pages/simulation/SimulationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/simulation',
      name: 'simulation',
      component: SimulationView,
    },
  ],
})

export default router
