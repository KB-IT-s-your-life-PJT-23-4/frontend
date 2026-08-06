import { adminDashboardMock } from '../data/adminDashboardMock'

const DEMO_DELAY_MS = 650

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

/**
 * TODO(KAN-186): 관리자 집계 API 계약이 확정되면 이 어댑터만 실제 request 호출로 교체한다.
 * 현재 백엔드에는 관리자 대시보드 엔드포인트가 없으므로 운영 데이터로 오인하지 않도록
 * 항상 source: 'demo'를 반환한다.
 */
export async function getAdminDashboard({ scenario = 'success' } = {}) {
  await wait(DEMO_DELAY_MS)

  if (scenario === 'error') {
    const error = new Error('대시보드 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    error.code = 'ADMIN_DASHBOARD_DEMO_ERROR'
    throw error
  }

  if (scenario === 'empty') return null

  return {
    ...clone(adminDashboardMock),
    updatedAt: new Date().toISOString(),
  }
}
