const BLOCK_MANAGER_ROLES = new Set(['ROOT', 'MIDDLE'])

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatLocalDateTime(date, includeSeconds = false) {
  const value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
  return includeSeconds ? `${value}:${pad(date.getSeconds())}` : value
}

export function canManageUserBlock(role) {
  return BLOCK_MANAGER_ROLES.has(String(role ?? '').toUpperCase())
}

export function defaultBlockedUntilValue(now = Date.now(), days = 7) {
  return formatLocalDateTime(new Date(now + days * 24 * 60 * 60 * 1000))
}

export function normalizeBlockedUntil(value, now = Date.now()) {
  const normalized = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(normalized)) return null

  const date = new Date(normalized)
  if (!Number.isFinite(date.getTime()) || date.getTime() <= now) return null
  return normalized.length === 16 ? `${normalized}:00` : normalized
}
