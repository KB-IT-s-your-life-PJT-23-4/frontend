import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login as requestLogin, logout as requestLogout } from '../api/authApi'
import { useAppStore } from './appStore'
import {
  clearAuthSession as clearStoredAuthSession,
  getTokenExpiration,
  isTokenExpired,
  loadAuthSession,
  saveAuthSession,
} from '../utils/authStorage'

export const useAuthStore = defineStore('auth', () => {
  const storedSession = loadAuthSession()
  const accessToken = ref(storedSession.accessToken)
  const refreshToken = ref(storedSession.refreshToken)
  const user = ref(storedSession.user)
  const accessTokenExpired = ref(isTokenExpired(storedSession.accessToken))
  let expirationTimer = null

  const isLogin = computed(() =>
    Boolean(accessToken.value && user.value && !accessTokenExpired.value),
  )

  function syncExpirationState() {
    clearTimeout(expirationTimer)
    expirationTimer = null

    const expiration = getTokenExpiration(accessToken.value)
    const remaining = expiration == null ? 0 : expiration - Date.now()
    accessTokenExpired.value = remaining <= 0

    if (remaining > 0) {
      expirationTimer = setTimeout(syncExpirationState, Math.min(remaining, 2_147_483_647))
    }
  }

  syncExpirationState()

  function setAuthSession(session) {
    accessToken.value = session.accessToken ?? null
    refreshToken.value = session.refreshToken ?? null
    user.value = session.user ?? null
    syncExpirationState()
    saveAuthSession({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      user: user.value,
    })
  }

  function saveToken(nextAccessToken, nextRefreshToken = refreshToken.value) {
    accessToken.value = nextAccessToken ?? null
    refreshToken.value = nextRefreshToken ?? null
    syncExpirationState()
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
    syncExpirationState()
    clearStoredAuthSession()
  }

  function deleteToken() {
    accessToken.value = null
    refreshToken.value = null
    syncExpirationState()
    saveAuthSession({ accessToken: null, refreshToken: null, user: user.value })
  }

  async function clearSession() {
    clearAuth()
    await useAppStore().clearUserState()
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
      await clearSession()
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
    clearSession,
  }
})
