import { faqItems, products } from '../data/mockData'
import { calculateSimulation } from '../utils/finance'
import {
  clearAuthSession,
  getAccessToken,
  loadAuthSession,
  saveAuthSession,
} from '../utils/authStorage'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

// 증여는 /api/gm, 수증자는 /api/fm 으로 네임스페이스가 나뉜다.
// 리마인더는 둘을 가로질러 한 목록으로 합치는 화면이라 어느 한쪽 밑에 두지 않았다.
const GIFT_PATH = '/gm/gift'
const DEDUCTION_PATH = '/gm/deduction'
const FAMILY_PATH = '/fm/family'
const REMINDER_PATH = '/rm'

// gift.status ENUM (백엔드 com.example.project.gift.domain.Status)
export const GIFT_STATUS = {
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

let refreshPromise = null
let authenticationFailurePromise = null
let onSessionRefreshed = null
let onAuthenticationFailed = null

const REFRESH_EXCLUDED_PATHS = new Set([
  '/auth/login',
  '/auth/logout',
  '/auth/refresh',
  '/auth/signup',
  '/auth/check-email',
])

export function configureAuthLifecycleHandlers(handlers = {}) {
  onSessionRefreshed = handlers.onSessionRefreshed ?? null
  onAuthenticationFailed = handlers.onAuthenticationFailed ?? null
}

function normalizedPath(path) {
  return path.split('?')[0]
}

function isFormData(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

function requestHeaders(body, customHeaders, accessToken) {
  const headers = new Headers()

  if (!isFormData(body)) headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  new Headers(customHeaders).forEach((value, key) => headers.set(key, value))
  return headers
}

function responseError(response, payload) {
  const error = new Error(payload?.error || '요청을 처리하지 못했습니다.')
  error.message = payload?.message || error.message
  error.status = response.status
  error.code = payload?.error ?? payload?.statusCode ?? response.status
  error.payload = payload
  return error
}

function idempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

async function fetchResponse(path, options, accessToken = null) {
  const { headers: customHeaders, _retry, ...fetchOptions } = options

  try {
    return await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers: requestHeaders(fetchOptions.body, customHeaders, accessToken),
    })
  } catch (cause) {
    const error = new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    error.code = 'NETWORK_ERROR'
    error.cause = cause
    throw error
  }
}

async function handleAuthenticationFailure() {
  if (!authenticationFailurePromise) {
    authenticationFailurePromise = (async () => {
      if (onAuthenticationFailed) await onAuthenticationFailed()
      else clearAuthSession()
    })().catch(() => {
      clearAuthSession()
    })
  }

  return authenticationFailurePromise
}

async function performTokenRefresh() {
  const { refreshToken } = loadAuthSession()
  if (!refreshToken) throw new Error('로그인 정보가 만료되었습니다.')

  const response = await fetchResponse('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.error) throw responseError(response, payload)

  const session =
    payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  if (!session?.accessToken || !session?.refreshToken || !session?.user) {
    throw new Error('인증 갱신 응답이 올바르지 않습니다.')
  }

  const currentSession = loadAuthSession()
  if (currentSession.refreshToken !== refreshToken) {
    if (currentSession.accessToken && currentSession.refreshToken && currentSession.user) {
      return currentSession
    }
    throw new Error('인증 상태가 변경되었습니다.')
  }

  if (onSessionRefreshed) await onSessionRefreshed(session)
  else saveAuthSession(session)
  authenticationFailurePromise = null
  return session
}

function getRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export function restoreAuthSession() {
  return getRefreshPromise().catch(async (error) => {
    await handleAuthenticationFailure()
    throw error
  })
}

export async function request(path, options = {}) {
  const accessToken = getAccessToken()
  const response = await fetchResponse(path, options, accessToken)

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.error) {
    const canRefresh = response.status === 401 && !REFRESH_EXCLUDED_PATHS.has(normalizedPath(path))

    if (canRefresh) {
      if (options._retry) {
        await handleAuthenticationFailure()
      } else if (authenticationFailurePromise) {
        await handleAuthenticationFailure()
      } else {
        const latestAccessToken = getAccessToken()
        if (accessToken && latestAccessToken && accessToken !== latestAccessToken) {
          return request(path, { ...options, _retry: true })
        }

        await restoreAuthSession()
        return request(path, { ...options, _retry: true })
      }
    }

    throw responseError(response, payload)
  }

  if (normalizedPath(path) === '/auth/login') authenticationFailurePromise = null
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

  async runSimulation({ family, amount, years = 10, giftDate, donorPaysTax = false }) {
    if (API_BASE) {
      return request('/gs', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey() },
        body: JSON.stringify({
          familyId: family.id,
          requestedAmount: amount,
          taxPaymentMethod: donorPaysTax ? 'DONOR_PAYS' : 'RECIPIENT_PAYS',
          investmentPeriodMonths: years * 12,
          giftDate,
        }),
      })
    }
    await wait(650)
    return calculateSimulation({ amount, family, products, years, giftDate, donorPaysTax })
  },

  async getSimulation(simulationId) {
    if (!API_BASE) return null
    return request(`/gs/${simulationId}`)
  },

  async getSimulationProductDetail(simulationId, kbProductVersionId) {
    if (!API_BASE) return null
    return request(`/gs/${simulationId}/products/${kbProductVersionId}`)
  },

  async saveSimulation(simulationId, payload) {
    if (!API_BASE) {
      await wait(350)
      return {
        simulationId,
        status: 'SAVED',
        version: Number(payload.version) + 1,
      }
    }
    return request(`/gs/${simulationId}/save`, {
      method: 'PATCH',
      headers: { 'Idempotency-Key': idempotencyKey() },
      body: JSON.stringify(payload),
    })
  },

  async listSimulations({ status, familyId, page = 0, size = 20 } = {}) {
    if (!API_BASE) return { items: [], pagination: null }
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (status) params.set('status', status)
    if (familyId != null) params.set('familyId', String(familyId))
    return request(`/gs?${params}`)
  },

  // --- 수증자(가족) : RecipientController @RequestMapping("/api/fm/family") ---

  // GET /api/fm/family — 로그인 사용자 소유 수증자 전체
  async listFamilies() {
    if (!API_BASE) return []
    const data = await request(FAMILY_PATH)
    return Array.isArray(data) ? data : []
  },

  // GET /api/fm/family/{familyId} — 로그인 사용자 소유 수증자 단건
  async getFamily(familyId) {
    if (!API_BASE) return null
    return request(`${FAMILY_PATH}/${familyId}`)
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

  async updateFamilyProfile(familyId, profile, { image = null, removeImage = false } = {}) {
    if (!API_BASE) return null
    const body = new FormData()
    body.append('profile', new Blob([JSON.stringify(profile)], { type: 'application/json' }))
    if (image) body.append('image', image)
    body.append('removeImage', String(removeImage))

    return request(`${FAMILY_PATH}/${familyId}`, {
      method: 'PATCH',
      body,
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

  // --- 리마인더 : ReminderController @RequestMapping("/api/rm") ---

  // GET /api/rm — 신고기한·공제갱신일을 targetDate 오름차순으로.
  // 서버가 저장하지 않고 조회 시점에 gift 에서 계산하므로 항상 최신이다.
  // 언제 뜨고 언제 사라지는지(마일스톤)는 서버가 정하므로 클라이언트가 넘길 조건이 없다.
  async listReminders() {
    if (!API_BASE) return []
    const data = await request(REMINDER_PATH)
    return Array.isArray(data) ? data : []
  },

  // POST /api/rm/read — 리마인더에는 고유 id 가 없어 (giftId, type) 으로 지목한다.
  // 여러 번 눌러도 행은 하나고 읽은 시각만 갱신된다.
  async markReminderRead({ giftId, type }) {
    if (!API_BASE) return null
    return request(`${REMINDER_PATH}/read`, {
      method: 'POST',
      body: JSON.stringify({ giftId, type }),
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
