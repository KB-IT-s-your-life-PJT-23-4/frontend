import { request } from './apiAdapter'

export function getAdminUsers({ userId, email, name, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })

  if (userId !== null && userId !== undefined && String(userId).trim()) {
    params.set('userId', String(userId).trim())
  }
  if (email?.trim()) params.set('email', email.trim())
  if (name?.trim()) params.set('name', name.trim())

  return request(`/admin/users?${params.toString()}`)
}

export function getAdminUser(userId) {
  return request(`/admin/users/${encodeURIComponent(userId)}`)
}
