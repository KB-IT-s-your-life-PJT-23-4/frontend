import { request } from './apiAdapter'
import { blockAdminUser } from './adminUserApi'

const ADMIN_REPORT_PATH = '/admin/report'

// 신고 처리 API는 아직 없지만, 회원 차단은 기존 관리자 회원 API를 재사용한다.
export const adminReportCapabilities = Object.freeze({
  processReport: false,
  blockUser: true,
})

export function getAdminReportPage({ page = 0, size = 10, status, reportType } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status?.trim()) params.set('status', status.trim())
  if (reportType?.trim()) params.set('reportType', reportType.trim())
  return request(`${ADMIN_REPORT_PATH}?${params.toString()}`)
}

function unavailableApiError(feature) {
  const error = new Error(`${feature} API가 아직 준비되지 않았습니다.`)
  error.code = 'ADMIN_REPORT_API_NOT_AVAILABLE'
  return error
}

export function processAdminReport(_reportId, _changes) {
  return Promise.reject(unavailableApiError('신고 처리'))
}

export function blockReportedUser(userId, { blockedUntil } = {}) {
  return blockAdminUser(userId, blockedUntil)
}
