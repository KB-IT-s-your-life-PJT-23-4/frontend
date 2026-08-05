import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, restoreAuthSession } from '../api/apiAdapter'
import { login as requestLogin, logout as requestLogout } from '../api/authApi'
import { deleteMyAccount, getMyProfile, updateMyProfile } from '../api/userApi'
import { useAppStore } from './appStore'
import {
  clearAuthSession as clearStoredAuthSession,
  getTokenExpiration,
  isTokenExpired,
  loadAuthSession,
  saveAuthSession,
} from '../utils/authStorage'
import { fileToDataUrl } from '../utils/profileImage'

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

  function persistSession() {
    saveAuthSession({
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      user: user.value,
    })
  }

  function syncExpirationState() {
    clearTimeout(expirationTimer)
    expirationTimer = null

    const expiration = getTokenExpiration(accessToken.value)
    const remaining = expiration == null ? 0 : expiration - Date.now()
    accessTokenExpired.value = remaining <= 0

    if (remaining > 0) {
      expirationTimer = setTimeout(
        () => {
          syncExpirationState()
          if (accessTokenExpired.value && refreshToken.value) {
            restoreAuthSession().catch(() => {})
          }
        },
        Math.min(remaining, 2_147_483_647),
      )
    }
  }

  syncExpirationState()

  function setAuthSession(session) {
    accessToken.value = session.accessToken ?? null
    refreshToken.value = session.refreshToken ?? null
    user.value = session.user ?? null
    syncExpirationState()
    persistSession()
  }

  function setUserProfile(profile) {
    user.value = profile ?? null
    persistSession()
  }

  function clearAuth() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    syncExpirationState()
    clearStoredAuthSession()
  }

  async function clearSession() {
    try {
      clearAuth()
    } finally {
      await useAppStore().clearUserState()
    }
  }

  async function login(credentials) {
    const session = await requestLogin(credentials)
    if (!session?.accessToken || !session?.refreshToken || !session?.user) {
      throw new Error('로그인 응답이 올바르지 않습니다.')
    }

    await useAppStore().clearUserState()
    setAuthSession(session)
    return session
  }

  async function fetchUserProfile() {
    const profile = api.isMock ? { ...useAppStore().state.user } : await getMyProfile()
    setUserProfile(profile)
    return profile
  }

  async function updateUserProfile(changes, { image = null, removeImage = false } = {}) {
    const appStore = useAppStore()
    const currentProfile = user.value ?? appStore.state.user
    if (!currentProfile) throw new Error('회원 정보를 찾을 수 없습니다.')

    if (api.isMock) {
      const nextImage = image
        ? await fileToDataUrl(image)
        : removeImage
          ? null
          : (currentProfile.img ?? null)
      appStore.updateProfile({ ...changes, img: nextImage })
      const profile = { ...currentProfile, ...changes, img: nextImage }
      setUserProfile(profile)
      return profile
    }

    const profile = await updateMyProfile(
      {
        name: changes.name ?? currentProfile.name,
        birthDate: changes.birthDate ?? currentProfile.birthDate ?? null,
        phone: changes.phone ?? currentProfile.phone,
      },
      { image, removeImage },
    )
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

  async function withdrawAccount() {
    if (api.isMock) {
      const error = new Error('데모 모드에서는 회원탈퇴를 사용할 수 없습니다.')
      error.code = 'WITHDRAWAL_NOT_AVAILABLE_IN_DEMO'
      throw error
    }

    const currentRefreshToken = refreshToken.value
    await deleteMyAccount()

    if (currentRefreshToken) {
      try {
        await requestLogout(currentRefreshToken)
      } catch {
        // 계정 삭제는 이미 완료됐고, 이후 Refresh 요청도 삭제된 회원이라 거부된다.
      }
    }

    let cleanupFailed = false
    try {
      await clearSession()
    } catch {
      cleanupFailed = true

      // 계정 삭제는 이미 완료됐으므로 메모리와 브라우저 상태를 각각 한 번 더 정리한다.
      try {
        clearAuth()
      } catch {}

      try {
        await useAppStore().clearUserState()
      } catch {}
    }

    return { cleanupFailed }
  }

  return {
    accessToken,
    refreshToken,
    user,
    isLogin,
    login,
    logout,
    withdrawAccount,
    fetchUserProfile,
    updateUserProfile,
    setAuthSession,
    clearSession,
  }
})
