import { api, request } from './apiAdapter'

function ensureAuthApiConfigured() {
  if (!api.isMock) return

  const error = new Error('인증 서버 연결 설정이 필요합니다.')
  error.code = 'AUTH_API_NOT_CONFIGURED'
  throw error
}

export function login(loginData) {
  ensureAuthApiConfigured()
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(loginData),
  })
}

export function signup({ name, email, password, birthDate, phone, img = null }) {
  ensureAuthApiConfigured()

  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, birthDate, phone, img }),
  })
}

export function checkEmailDuplicate(email) {
  ensureAuthApiConfigured()
  const params = new URLSearchParams({ email })
  return request(`/auth/check-email?${params.toString()}`)
}

export function logout(refreshToken) {
  ensureAuthApiConfigured()
  return request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}
