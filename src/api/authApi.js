import { api, request } from './apiAdapter'

const ACCESS_TOKEN_KEY = 'mirizoom-token'
const REFRESH_TOKEN_KEY = 'mirizoom-refresh-token'
const USER_KEY = 'mirizoom-user'

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

export function signup({ name, email, password }) {
  ensureAuthApiConfigured()

  // TODO: 백엔드 UserSignupRequest에 birthDate와 phone 필드가 추가되면 요청 본문에 함께 전달한다.
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export function checkEmailDuplicate(email) {
  ensureAuthApiConfigured()
  const params = new URLSearchParams({ email })
  return request(`/auth/check-email?${params.toString()}`)
}

export function saveAuthSession({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
}
