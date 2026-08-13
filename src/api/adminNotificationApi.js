import { request } from './apiAdapter'

const ADMIN_NOTIFICATION_PATH = '/admin/notification'

// GET /api/admin/notification — { notifications, unreadCount, pagination }
// unreadCount 는 목록 필터와 무관한 전체 안 읽음 개수라 배지에 그대로 쓸 수 있다.
export function getAdminNotificationPage({
  page = 0,
  size = 20,
  status,
  notificationType,
  unreadOnly = false,
} = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status?.trim()) params.set('status', status.trim())
  if (notificationType?.trim()) params.set('notificationType', notificationType.trim())
  if (unreadOnly) params.set('unreadOnly', 'true')

  return request(`${ADMIN_NOTIFICATION_PATH}?${params.toString()}`)
}

// GET /api/admin/notification/unread-count — 숫자만 필요할 때(헤더 배지)
export function getAdminNotificationUnreadCount() {
  return request(`${ADMIN_NOTIFICATION_PATH}/unread-count`)
}

// PATCH /api/admin/notification/{id}/read — 관리자 본인 기준. 이미 읽었어도 성공한다.
export function markAdminNotificationRead(adminNotificationId) {
  return request(`${ADMIN_NOTIFICATION_PATH}/${adminNotificationId}/read`, { method: 'PATCH' })
}

// PATCH /api/admin/notification/{id}/resolve — 알림 자체를 처리 완료로 바꾼다(전체 관리자 공유).
// 이미 다른 관리자가 처리했으면 409 로 떨어진다.
export function resolveAdminNotification(adminNotificationId) {
  return request(`${ADMIN_NOTIFICATION_PATH}/${adminNotificationId}/resolve`, { method: 'PATCH' })
}
