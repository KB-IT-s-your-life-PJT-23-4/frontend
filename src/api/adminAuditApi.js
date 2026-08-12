import { request } from './apiAdapter.js'
import { getAccessToken } from '../utils/authStorage.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const ADMIN_AUDIT_PATH = '/admin/audit-logs'
const ADMIN_ACCESS_STREAM_PATH = '/admin/access-logs/stream'

export function getAdminAuditLogPage({
  page = 0,
  size = 10,
  actorUserId,
  actionType,
  targetType,
  targetId,
  from,
  to,
} = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (actorUserId != null && String(actorUserId).trim()) {
    params.set('actorUserId', String(actorUserId).trim())
  }
  if (actionType?.trim()) params.set('actionType', actionType.trim())
  if (targetType?.trim()) params.set('targetType', targetType.trim())
  if (targetId?.trim()) params.set('targetId', targetId.trim())
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  return request(`${ADMIN_AUDIT_PATH}?${params.toString()}`)
}

function parseSseBlock(block) {
  const event = { type: 'message', id: '', data: '' }

  block.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith(':')) return
    const separator = line.indexOf(':')
    const field = separator < 0 ? line : line.slice(0, separator)
    const value = separator < 0 ? '' : line.slice(separator + 1).replace(/^ /, '')

    if (field === 'event') event.type = value
    else if (field === 'id') event.id = value
    else if (field === 'data') event.data += `${event.data ? '\n' : ''}${value}`
  })

  if (!event.data) return null
  try {
    event.data = JSON.parse(event.data)
  } catch {
    // JSON이 아닌 SSE 데이터도 원문 그대로 전달합니다.
  }
  return event
}

export async function streamAdminAccessLogs({ signal, lastEventId, onEvent } = {}) {
  if (!API_BASE) throw new Error('관리자 요청 로그 서버 연결 설정이 필요합니다.')

  const token = getAccessToken()
  if (!token) throw new Error('관리자 로그인 정보가 없습니다.')

  const headers = new Headers({
    Accept: 'text/event-stream',
    Authorization: `Bearer ${token}`,
  })
  if (lastEventId) headers.set('Last-Event-ID', lastEventId)

  const response = await fetch(`${API_BASE}${ADMIN_ACCESS_STREAM_PATH}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const error = new Error(payload?.message || '사용자 요청 로그 연결에 실패했습니다.')
    error.status = response.status
    throw error
  }
  if (!response.body) throw new Error('사용자 요청 로그 스트림을 읽을 수 없습니다.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replaceAll('\r\n', '\n')

    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const event = parseSseBlock(block)
      if (event) onEvent?.(event)
      boundary = buffer.indexOf('\n\n')
    }

    if (done) break
  }
}
