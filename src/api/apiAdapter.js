import { faqItems, products } from '../data/mockData'
import { calculateSimulation } from '../utils/finance'
import { getAccessToken } from '../utils/authStorage'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

// 증여는 /api/gm, 수증자는 /api/fm 으로 네임스페이스가 나뉜다.
const GIFT_PATH = '/gm/gift'
const DEDUCTION_PATH = '/gm/deduction'
const FAMILY_PATH = '/fm/family'

// gift.status ENUM (백엔드 com.example.project.gift.domain.Status)
export const GIFT_STATUS = {
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

function authHeaders() {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...options.headers,
      },
      ...options,
    })
  } catch (cause) {
    const error = new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    error.code = 'NETWORK_ERROR'
    error.cause = cause
    throw error
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.error) {
    const error = new Error(payload?.error || '요청을 처리하지 못했습니다.')
    error.status = response.status
    error.code = payload?.statusCode ?? response.status
    error.payload = payload
    throw error
  }
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
}

function wait(ms = 420) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function consultationFallback(question) {
  const normalized = question.replace(/\s/g, '')
  const matched = faqItems.find((item) =>
    item.prompt
      .replace(/\s/g, '')
      .split(/[,.?]/)
      .filter((token) => token.length > 2)
      .some((token) => normalized.includes(token)),
  )
  if (matched) return matched.answer
  if (normalized.includes('미성년')) {
    return '미성년 자녀가 직계존속에게 증여받는 경우 10년간 합산한 증여재산공제는 일반적으로 2천만원 범위에서 검토해요. 과거 10년 이력과 증여자 관계에 따라 달라질 수 있어요.'
  }
  if (normalized.includes('아파트') || normalized.includes('부동산')) {
    return '부동산 증여는 시가 평가, 취득세, 등기 비용과 증여세를 함께 살펴봐야 해요. 공동주택가격만으로 단정하기보다 증여일 전후 거래가액과 감정가액 적용 여부를 전문가와 확인하는 것이 안전해요.'
  }
  if (normalized.includes('기한') || normalized.includes('신고')) {
    return '증여세는 원칙적으로 증여일이 속하는 달의 말일부터 3개월 이내에 신고·납부해요. 예를 들어 7월 15일 증여라면 10월 31일까지 준비하는 방식입니다.'
  }
  return '질문하신 상황은 증여자와 수증자의 관계, 최근 10년 이력, 재산 유형에 따라 결과가 달라질 수 있어요. 미리줌 시뮬레이션에서 금액을 먼저 비교한 뒤 세무 전문가에게 최종 확인을 권해드려요.'
}

export const api = {
  isMock: !API_BASE,

  async runSimulation({ family, amount, years = 10, donorPaysTax = false }) {
    if (API_BASE) {
      return request('/simulations', {
        method: 'POST',
        body: JSON.stringify({
          familyId: family.id,
          amount,
          investmentPeriodYears: years,
          donorPaysTax,
        }),
      })
    }
    await wait(650)
    return calculateSimulation({ amount, family, products, years, donorPaysTax })
  },

  async saveGiftPlan(resultId, memo = '미리줌에서 저장한 증여 계획') {
    if (API_BASE) {
      return request(`/simulation-results/${resultId}/gift-plans`, {
        method: 'POST',
        body: JSON.stringify({ memo }),
      })
    }
    await wait(350)
    return { giftPlans: [], message: '증여 계획이 저장되었습니다.' }
  },

  // --- 수증자(가족) : RecipientController @RequestMapping("/api/fm/family") ---

  // GET /api/fm/family — 로그인 사용자 소유 수증자 전체
  async listFamilies() {
    if (!API_BASE) return []
    const data = await request(FAMILY_PATH)
    return Array.isArray(data) ? data : []
  },

  // POST /api/fm/family — relation 은 ENUM(LINEAL_DESCENDANT/OTHER) 코드만 허용
  async createFamily({ familyName, relation, birthDate, familyImg = null }) {
    if (!API_BASE) return null
    return request(FAMILY_PATH, {
      method: 'POST',
      body: JSON.stringify({ familyName, relation, birthDate, familyImg }),
    })
  },

  // PATCH /api/fm/family/{familyId} — 전달한 필드만 수정
  async updateFamily(familyId, changes) {
    if (!API_BASE) return null
    return request(`${FAMILY_PATH}/${familyId}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    })
  },

  // DELETE /api/fm/family/{familyId} — 증여 이력이 있으면 409, force=true 로 강제 삭제
  async deleteFamily(familyId, { force = false } = {}) {
    if (!API_BASE) return null
    return request(`${FAMILY_PATH}/${familyId}?force=${force}`, {
      method: 'DELETE',
    })
  },

  // --- 증여 : GiftController @RequestMapping("/api/gm") ---

  // GET /api/gm/gift?familyId=&status= — 페이징 없이 배열로 내려온다(최신 증여일순)
  async listGifts({ familyId, status } = {}) {
    if (!API_BASE) return []
    const params = new URLSearchParams()
    if (familyId != null) params.set('familyId', familyId)
    if (status) params.set('status', status)
    const query = params.toString()
    const data = await request(query ? `${GIFT_PATH}?${query}` : GIFT_PATH)
    if (Array.isArray(data)) return data
    return data?.content ?? []
  },

  // GET /api/gm/deduction?familyId= — 수증자별 10년 합산 공제 현황.
  // 증여 이력이 없는 수증자도 한도 전액이 남은 행으로 내려온다.
  async listDeductions({ familyId } = {}) {
    if (!API_BASE) return []
    const query = familyId != null ? `?familyId=${familyId}` : ''
    const data = await request(`${DEDUCTION_PATH}${query}`)
    return Array.isArray(data) ? data : []
  },

  // POST /api/gm/gift — 미지정 시 PLANNED, 과거 이력은 COMPLETED 로 등록한다
  async createGift({ familyId, amount, giftDate, memo, status = GIFT_STATUS.PLANNED }) {
    if (!API_BASE) return null
    return request(GIFT_PATH, {
      method: 'POST',
      body: JSON.stringify({ familyId, amount, giftDate, status, memo }),
    })
  },

  // DELETE /api/gm/gift/{giftId} — PLANNED 상태만 삭제 가능(그 외 409)
  async deleteGift(giftId) {
    if (!API_BASE) return null
    return request(`${GIFT_PATH}/${giftId}`, { method: 'DELETE' })
  },

  // PATCH /api/gm/gift/{giftId}/status — PLANNED → COMPLETED/CANCELLED, COMPLETED → CANCELLED
  async updateGiftStatus(giftId, status) {
    if (!API_BASE) return null
    return request(`${GIFT_PATH}/${giftId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  async askConsultation(question) {
    if (API_BASE) {
      return request('/ai-consultations', {
        method: 'POST',
        body: JSON.stringify({ question }),
      })
    }
    await wait(850)
    return {
      answer: consultationFallback(question),
      references: [
        {
          lawName: '상속세 및 증여세법',
          articleNo: '제53조',
          title: '증여재산 공제',
        },
      ],
      disclaimer: '일반적인 정보 제공을 위한 답변이며 실제 신고 전 전문가 확인이 필요합니다.',
    }
  },
}
