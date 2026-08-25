import { request } from './apiAdapter'
import { blockAdminUser } from './adminUserApi'

const ADMIN_REPORT_PATH = '/admin/report'

// 회원 차단은 기존 관리자 회원 API를 재사용한다.
export const adminReportCapabilities = Object.freeze({
  blockUser: true,
})

export function getAdminReportPage({ page = 0, size = 10, status, reportType } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status?.trim()) params.set('status', status.trim())
  if (reportType?.trim()) params.set('reportType', reportType.trim())
  return request(`${ADMIN_REPORT_PATH}?${params.toString()}`)
}

export function processAdminReport(reportId, changes) {
  return request(`${ADMIN_REPORT_PATH}/${encodeURIComponent(reportId)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export function blockReportedUser(userId, { blockedUntil } = {}) {
  return blockAdminUser(userId, blockedUntil)
}
