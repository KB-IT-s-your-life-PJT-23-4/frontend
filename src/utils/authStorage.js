export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'mirizoom-token',
  REFRESH_TOKEN: 'mirizoom-refresh-token',
  USER: 'mirizoom-user',
}

function getStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

function parseStoredUser(value) {
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null

  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function getTokenExpiration(token) {
  const expiration = decodeJwtPayload(token)?.exp
  return Number.isFinite(expiration) ? expiration * 1000 : null
}

export function isTokenExpired(token, now = Date.now()) {
  const expiration = getTokenExpiration(token)
  return expiration == null || expiration <= now
}

export function loadAuthSession() {
  const storage = getStorage()
  if (!storage) return { accessToken: null, refreshToken: null, user: null }

  return {
    accessToken: storage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN),
    refreshToken: storage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN),
    user: parseStoredUser(storage.getItem(AUTH_STORAGE_KEYS.USER)),
  }
}

export function getAccessToken() {
  return getStorage()?.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN) ?? null
}

export function saveAuthSession({ accessToken, refreshToken, user }) {
  const storage = getStorage()
  if (!storage) return

  if (accessToken) storage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  else storage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)

  if (refreshToken) storage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  else storage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)

  if (user) storage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user))
  else storage.removeItem(AUTH_STORAGE_KEYS.USER)
}

export function clearAuthSession() {
  const storage = getStorage()
  if (!storage) return

  Object.values(AUTH_STORAGE_KEYS).forEach((key) => storage.removeItem(key))
}
