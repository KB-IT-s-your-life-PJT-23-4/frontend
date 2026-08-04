import { api, request } from './apiAdapter'

function ensureAiConsultApiConfigured() {
  if (!api.isMock) return

  const error = new Error('AI 상담 서버 연결 설정이 필요합니다.')
  error.code = 'AI_CONSULT_API_NOT_CONFIGURED'
  throw error
}

/**
 * AI 상담 시작
 *
 * @param {string} question 사용자 질문
 * @returns {Promise<{
 *   conversationId: string,
 *   status: 'COMPLETED' | 'CLARIFICATION_REQUIRED' | 'REJECTED',
 *   intent: string,
 *   requiresCalculation: boolean,
 *   answer: string,
 *   clarificationQuestions: Array<{
 *     key: string,
 *     data_type: string,
 *     question: string,
 *     reason: string
 *   }>,
 *   facts: Record<string, unknown>
 * }>}
 */

export function startAiConsult(question) {
  ensureAiConsultApiConfigured()

  const trimmedQeustion = question?.trim()

  if (!trimmedQeustion) {
    throw new Error('상담 질문을 입력해 주세요.')
  }

  return request('/ai/consult', {
    method: 'POST',
    body: JSON.stringify({
      question: trimmedQeustion,
    }),
  })
}

/**
 * AI가 요구한 추가 질문 답변
 *
 * @param {{
 *   conversationId: string,
 *   question: string,
 *   intent: string,
 *   requiresCalculation?: boolean,
 *   facts?: Record<string, unknown>,
 *   answers?: Record<string, unknown>
 * }} params
 */

export function answerAiConsultClarification({
  conversationId,
  question,
  intent,
  requiresCalculation = false,
  facts = {},
  answers = {},
}) {
  ensureAiConsultApiConfigured()

  if (!conversationId) {
    throw new Error('상담 대화 ID가 없습니다.')
  }

  return request('/ai/consult/clarification', {
    method: 'POST',
    body: JSON.stringify({
      conversationId,
      question,
      intent,
      requiresCalculation,
      facts,
      answers,
    }),
  })
}
