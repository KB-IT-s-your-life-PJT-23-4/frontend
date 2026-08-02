import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login as requestLogin, logout as requestLogout } from '../api/authApi'
import {
  clearAuthSession as clearStoredAuthSession,
  loadAuthSession,
  saveAuthSession,
} from '../utils/authStorage'

export const useAuthStore = defineStore('auth', () => {
  const storedSession = loadAuthSession()
  const accessToken = ref(storedSession.accessToken)
  const refreshToken = ref(storedSession.refreshToken)
  const user = ref(storedSession.user)

  const isLogin = computed(() => Boolean(accessToken.value && user.value))

  function setAuthSession(session) {
    accessToken.value = session.accessToken ?? null
    refreshToken.value = session.refreshToken ?? null
    user.value = session.user ?? null
    saveAuthSession({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      user: user.value,
    })
  }

  function saveToken(nextAccessToken, nextRefreshToken = refreshToken.value) {
    accessToken.value = nextAccessToken ?? null
    refreshToken.value = nextRefreshToken ?? null
    saveAuthSession({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      user: user.value,
    })
  }

  function clearAuth() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    clearStoredAuthSession()
  }

  function deleteToken() {
    accessToken.value = null
    refreshToken.value = null
    saveAuthSession({ accessToken: null, refreshToken: null, user: user.value })
  }

  async function login(credentials) {
    const session = await requestLogin(credentials)
    setAuthSession(session)
    return session
  }

  async function logout() {
    const currentRefreshToken = refreshToken.value

    try {
      if (currentRefreshToken) await requestLogout(currentRefreshToken)
    } finally {
      clearAuth()
    }
  }

  return {
    accessToken,
    refreshToken,
    user,
    isLogin,
    login,
    logout,
    setAuthSession,
    saveToken,
    deleteToken,
    clearAuth,
  }
})
