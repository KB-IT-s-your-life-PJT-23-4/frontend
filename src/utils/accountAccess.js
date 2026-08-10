export const BLOCKED_ACCESS_MESSAGE = '해당 기능에 접근할 권한이 없습니다.'

function blockedUntilTimestamp(value) {
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value.map(Number)
    const timestamp = new Date(year, month - 1, day, hour, minute, second).getTime()
    return Number.isFinite(timestamp) ? timestamp : null
  }

  if (typeof value !== 'string' || !value.trim()) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function isAccountBlocked(user, now = Date.now()) {
  if (String(user?.accountStatus ?? '').toUpperCase() !== 'BLOCKED') return false

  const blockedUntil = blockedUntilTimestamp(user?.blockedUntil)
  return blockedUntil != null && blockedUntil > now
}

export function isRestrictedFeatureApiPath(path) {
  const normalizedPath = String(path ?? '')
    .split('?')[0]
    .replace(/^\/api(?=\/)/, '')

  return (
    normalizedPath === '/gs' ||
    normalizedPath.startsWith('/gs/') ||
    normalizedPath === '/ai/consult' ||
    normalizedPath.startsWith('/ai/consult/')
  )
}

const BLOCKED_ACCESS_API_ERROR = '해당 기능에 접근할 권한이 없습니다'

export function shouldShowBlockedAccessForResponse({
  status,
  path,
  errorCode,
  suppressed = false,
}) {
  if (suppressed || status !== 403 || !isRestrictedFeatureApiPath(path)) return false
  return errorCode === BLOCKED_ACCESS_API_ERROR
}

export function isBlockedAccessApiError(error, path) {
  return shouldShowBlockedAccessForResponse({
    status: error?.status,
    path,
    errorCode: error?.code,
  })
}
