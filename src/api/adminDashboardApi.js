import { request } from './apiAdapter'

export function getAdminDashboard() {
  return request('/admin/dashboard')
}
