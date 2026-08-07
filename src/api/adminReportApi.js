import { request } from './apiAdapter'

const ADMIN_REPORT_PATH = '/admin/report'

// 백엔드 처리/차단 API가 추가되면 각 값을 true로 전환하고 아래 함수를 실제 요청으로 교체한다.
export const adminReportCapabilities = Object.freeze({
  processReport: false,
  blockUser: false,
})

export function getAdminReportPage({ page = 0, size = 20, status, reportType } = {}) {
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

export function blockReportedUser(_userId, _options = {}) {
  return Promise.reject(unavailableApiError('사용자 차단'))
}
