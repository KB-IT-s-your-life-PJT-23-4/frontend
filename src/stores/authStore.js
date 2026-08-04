import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api/apiAdapter'
import { login as requestLogin, logout as requestLogout } from '../api/authApi'
import { getMyProfile, updateMyProfile } from '../api/userApi'
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

  function setUserProfile(profile) {
    user.value = profile ?? null
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

  async function fetchUserProfile() {
    const profile = api.isMock ? { ...useAppStore().state.user } : await getMyProfile()
    setUserProfile(profile)
    return profile
  }

  async function updateUserProfile(changes) {
    const appStore = useAppStore()
    const currentProfile = user.value ?? appStore.state.user

    if (api.isMock) {
      appStore.updateProfile(changes)
      const profile = { ...currentProfile, ...changes }
      setUserProfile(profile)
      return profile
    }

    const profile = await updateMyProfile({
      email: currentProfile.email,
      name: changes.name ?? currentProfile.name,
      birthDate: changes.birthDate ?? currentProfile.birthDate ?? null,
      phone: changes.phone ?? currentProfile.phone,
      img: currentProfile.img ?? null,
    })
    setUserProfile(profile)
    return profile
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
    fetchUserProfile,
    updateUserProfile,
    setAuthSession,
    saveToken,
    deleteToken,
    clearAuth,
    clearSession,
  }
})
