import { request } from './apiAdapter'

/**
 * 근처 국민은행 지점 검색
 * - operatingBranches: 실거리 기준 가장 가까운 번호표 운영 지점 (최대 3곳)
 * - nearbyBranches: 카카오 검색 반경 내 전체 결과 (운영 지점 중복 제외)
 *
 * GET /api/branches/nearby
 *
 * @param {{ x: number, y: number, query?: string, radius?: number }} params
 * @returns {Promise<{
 *   operatingBranches: Array<{
 *     branchId: number,
 *     branchName: string,
 *     roadAddress: string,
 *     jibunAddress: string | null,
 *     placeUrl: string | null,
 *     latitude: number,
 *     longitude: number,
 *     distanceMeters: number,
 *   }>,
 *   nearbyBranches: Array<{
 *     placeName: string,
 *     addressName: string,
 *     roadAddressName: string,
 *     phone: string,
 *     x: number,
 *     y: number,
 *     placeUrl: string,
 *     branchId: number | null,
 *     ticketAvailable: boolean,
 *   }>,
 * }>}
 */
export async function fetchNearbyBranches({ x, y, query = '국민은행', radius = 2000 }) {
  if (x === undefined || y === undefined) {
    throw new Error('현재 위치 정보가 필요합니다.')
  }

  const searchParams = new URLSearchParams({
    query,
    x: String(x),
    y: String(y),
    radius: String(radius),
  })

  const response = await request(`/branches/nearby?${searchParams.toString()}`)
  return response ?? { operatingBranches: [], nearbyBranches: [] }
}

/**
 * 번호표 발급
 *
 * POST /api/tickets
 *
 * @param {{ branchId: number, serviceType: 'DEPOSIT_SAVINGS_FUND_TRUST' | 'PERSONAL_LOAN' }} params
 * @returns {Promise<{
 *   ticketId: number,
 *   ticketNumber: string,
 *   waitingCount: number,
 *   businessDate: string,
 * }>}
 */
export async function issueTicket({ branchId, serviceType }) {
  if (!branchId) {
    throw new Error('지점을 선택해 주세요.')
  }
  if (!serviceType) {
    throw new Error('신청 업무를 선택해 주세요.')
  }

  const response = await request('/tickets', {
    method: 'POST',
    body: JSON.stringify({ branchId, serviceType }),
  })

  return response
}

/**
 * 지점 대기 현황 조회
 *
 * GET /api/tickets/status
 *
 * @param {number} branchId
 * @returns {Promise<{
 *   branchId: number,
 *   waitingCount: number,
 *   currentCalledNumber: string | null,
 * }>}
 */
export async function fetchTicketStatus(branchId) {
  if (!branchId) {
    throw new Error('지점 정보가 없습니다.')
  }

  const response = await request(`/tickets/status?branchId=${branchId}`)
  return response
}
