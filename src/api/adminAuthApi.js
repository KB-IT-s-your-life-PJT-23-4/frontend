import { request } from './apiAdapter'

const ADMIN_AUTH_PATH = '/admin/auth'

export function getCurrentAdmin() {
  return request('/admin/me')
}

export function getAdminAuthPage({ page = 0, size = 10 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return request(`${ADMIN_AUTH_PATH}?${params.toString()}`)
}

export function changeAdminRole(userId, role) {
  return request(`${ADMIN_AUTH_PATH}/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export function deleteAdminAccount(userId) {
  return request(`${ADMIN_AUTH_PATH}/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}
