import './assets/css/layout.css'
import './assets/css/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { configureAuthLifecycleHandlers } from './api/apiAdapter'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore(pinia)
configureAuthLifecycleHandlers({
  onSessionRefreshed: (session) => authStore.setAuthSession(session),
  onAuthenticationFailed: async () => {
    await authStore.clearSession()
    if (router.currentRoute.value.name !== 'login') await router.replace({ name: 'login' })
  },
})

app.use(router)

app.mount('#app')
