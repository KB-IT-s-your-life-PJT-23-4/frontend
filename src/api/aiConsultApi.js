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
 *   answer: string, // Markdown 문법이 없는 표시용 일반 텍스트
 *   clarificationQuestions: Array<{
 *     key: string,
 *     data_type: string,
 *     question: string,
 *     reason: string
 *   }>,
 *   facts: Record<string, unknown>,
 *   references: Array<{
 *     citation: string,
 *     url: string
 *   }>
 * }>}
 */

export async function startAiConsult(question) {
  ensureAiConsultApiConfigured()

  const trimmedQuestion = question?.trim()

  if (!trimmedQuestion) {
    throw new Error('상담 질문을 입력해 주세요.')
  }

  if (trimmedQuestion.replaceAll(/\s/g, '').length < 2) {
    throw new Error('상담 질문은 공백을 제외하고 2자 이상 입력해 주세요.')
  }

  if (trimmedQuestion.length > 500) {
    throw new Error('상담 질문은 500자 이하로 입력해 주세요.')
  }

  const payload = {
    question: trimmedQuestion,
  }

  console.log('[AI Consult API] POST /api/ai/consult', payload)

  const response = await request('/ai/consult', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  console.log('[AI Consult API] POST /api/ai/consult response', response)
  return response
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

export async function answerAiConsultClarification({
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

  if (!answers || Object.keys(answers).length === 0) {
    throw new Error('추가 질문에 대한 답변을 입력해 주세요.')
  }

  const payload = {
    conversationId,
    question,
    intent,
    requiresCalculation,
    facts,
    answers,
  }

  console.log('[AI Consult API] POST /api/ai/consult/clarification', payload)

  const response = await request('/ai/consult/clarification', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  console.log('[AI Consult API] POST /api/ai/consult/clarification response', response)
  return response
}
