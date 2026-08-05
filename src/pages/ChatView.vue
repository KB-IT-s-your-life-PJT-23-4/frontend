<script setup>
import { nextTick, ref } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import { faqItems, faqCategories } from '../data/mockData'
import { startAiConsult, answerAiConsultClarification } from '@/api/aiConsultApi.js'
import '../assets/css/chatView.css'

// =============================== 데이터 포맷 설정
function getTodayDateFormat() {
  const now = new Date()
  return `오늘, ${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`
}

function getCurrentTimeFormat() {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function normalizeAssistantAnswer(answer, fallback) {
  const source = typeof answer === 'string' ? answer : fallback

  return String(source ?? '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .trim()
}

// =============================== 초기 답장 포맷
const input = ref('')
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    text: '반갑습니다! 증여세와 절세 혜택에 대해 무엇이든 물어보세요. \n아래의 자주 묻는 질문들을 통해 상담을 시작하실 수도 있습니다.',
    createdAt: getCurrentTimeFormat(),
  },
])
const loading = ref(false)
const showEndModal = ref(false)
const showFaqSheet = ref(false)
const conversation = ref(null)
const pendingConsult = ref(null)

// =============================== faq 포맷
function pickFaq(prompt, answer, showBranch, showTaxOffice) {
  showFaqSheet.value = false
  sendMessage(prompt, answer, showBranch, showTaxOffice)
}

async function scrollToBottom() {
  await nextTick()
  conversation.value?.scrollTo({
    top: conversation.value.scrollHeight,
    behavior: 'smooth',
  })
}

function clarificationType(question) {
  return question?.data_type ?? question?.dataType ?? 'string'
}

function clarificationInputType(type) {
  if (type === 'integer') return 'number'
  if (type === 'date') return 'date'
  return 'text'
}

function clarificationUnit(clarification) {
  if (clarification.type !== 'integer') return ''
  if (clarification.key === 'recipient_age') return '세'
  if (clarification.key.includes('amount')) return '원'
  return ''
}

function clarificationPlaceholder(clarification) {
  if (clarification.key === 'recipient_age') return '예: 30'
  if (clarification.key.includes('amount')) return '예: 50000000'
  if (clarification.type === 'date') return '날짜를 선택해 주세요'
  return '답변을 입력해 주세요'
}

function clarificationMinimum(clarification) {
  if (clarification.type !== 'integer') return undefined
  if (clarification.key.includes('amount')) return 0
  return 1
}

function pushClarificationMessage(question) {
  messages.value.push({
    id: Date.now() + Math.random(),
    role: 'assistant',
    text: question.question,
    clarification: {
      key: question.key,
      type: clarificationType(question),
      reason: question.reason,
      draftValue: '',
      answered: false,
      selectedValue: null,
      error: '',
    },
    createdAt: getCurrentTimeFormat(),
  })
}

function displayClarificationAnswer(clarification, value) {
  if (clarification.autoAnswered) return '해당 없음'
  if (clarification.type === 'boolean') return value ? '예' : '아니오'
  if (clarification.type === 'integer') {
    return `${Number(value).toLocaleString('ko-KR')}${clarificationUnit(clarification)}`
  }
  return String(value)
}

function normalizeClarificationAnswer(clarification, rawValue) {
  if (clarification.type === 'boolean') return rawValue

  if (clarification.type === 'integer') {
    const value = Number(String(rawValue).replaceAll(',', ''))
    const minimum = clarificationMinimum(clarification)
    if (!Number.isInteger(value) || value < minimum) {
      const minimumLabel = clarificationUnit(clarification)
      throw new Error(`${minimum.toLocaleString('ko-KR')}${minimumLabel} 이상 입력해 주세요.`)
    }
    return value
  }

  const value = String(rawValue).trim()
  if (!value) throw new Error('답변을 입력해 주세요.')
  return value
}

function hasAnswer(answers, key) {
  return Object.prototype.hasOwnProperty.call(answers, key)
}

function hasDraftClarificationAnswer(clarification) {
  return (
    clarification.draftValue !== '' &&
    clarification.draftValue !== null &&
    clarification.draftValue !== undefined
  )
}

function applyNoPreviousGiftDefaults(pending) {
  const answerDefaults = {
    has_previous_gifts: false,
    previous_gift_amount: 0,
    previous_gift_date: 'none',
    previous_gift_same_donor: false,
  }
  const factDefaults = {
    ...answerDefaults,
    previously_used_deduction: 0,
    deduction_renewal_date: 'none',
  }
  const autoAnsweredMessages = []

  pending.facts = {
    ...(pending.facts ?? {}),
    ...factDefaults,
  }

  Object.entries(answerDefaults).forEach(([key, value]) => {
    pending.answers[key] = value

    const message = messages.value.find(
      (item) => item.clarification?.key === key && !item.clarification.answered,
    )
    if (!message) return

    message.clarification.answered = true
    message.clarification.selectedValue = value
    message.clarification.autoAnswered = true
    autoAnsweredMessages.push(message)
  })

  return autoAnsweredMessages
}

function allClarificationsAnswered(pending) {
  return pending.questionKeys.every((key) => hasAnswer(pending.answers, key))
}

function pushNextClarificationMessage(pending) {
  while (pending.currentQuestionIndex < pending.questions.length) {
    const question = pending.questions[pending.currentQuestionIndex]
    pending.currentQuestionIndex += 1

    if (hasAnswer(pending.answers, question.key)) continue

    pushClarificationMessage(question)
    return true
  }

  return false
}

async function submitClarification(message, rawValue) {
  const clarification = message.clarification
  if (!clarification || clarification.answered || loading.value || !pendingConsult.value) return

  let answer
  try {
    answer = normalizeClarificationAnswer(clarification, rawValue)
    clarification.error = ''
  } catch (error) {
    clarification.error = error.message
    return
  }

  clarification.answered = true
  clarification.selectedValue = answer
  const pending = pendingConsult.value
  const previousAnswers = { ...pending.answers }
  const previousFacts = { ...(pending.facts ?? {}) }
  pending.answers[clarification.key] = answer
  const meansNoPreviousGift =
    (clarification.key === 'has_previous_gifts' && answer === false) ||
    (clarification.key === 'previous_gift_amount' && answer === 0)
  const autoAnsweredMessages = meansNoPreviousGift ? applyNoPreviousGiftDefaults(pending) : []
  const answerMessageId = Date.now() + Math.random()
  messages.value.push({
    id: answerMessageId,
    role: 'user',
    text: displayClarificationAnswer(clarification, answer),
    createdAt: getCurrentTimeFormat(),
  })

  const hasNextQuestion = pushNextClarificationMessage(pending)
  if (hasNextQuestion) {
    await scrollToBottom()
    return
  }

  if (!allClarificationsAnswered(pending)) {
    clarification.error = '추가 질문 답변을 모두 입력해 주세요.'
    return
  }

  loading.value = true
  await scrollToBottom()

  try {
    const response = await answerAiConsultClarification({
      conversationId: pending.conversationId,
      question: pending.originalQuestion,
      intent: pending.intent,
      requiresCalculation: pending.requiresCalculation,
      facts: pending.facts,
      answers: { ...pending.answers },
    })
    appendConsultResponse(response, pending.originalQuestion)
  } catch (error) {
    clarification.answered = false
    clarification.selectedValue = null
    pending.answers = previousAnswers
    pending.facts = previousFacts
    autoAnsweredMessages.forEach((autoAnsweredMessage) => {
      autoAnsweredMessage.clarification.answered = false
      autoAnsweredMessage.clarification.selectedValue = null
      autoAnsweredMessage.clarification.autoAnswered = false
    })
    messages.value = messages.value.filter((item) => item.id !== answerMessageId)
    messages.value.push({
      id: Date.now() + Math.random(),
      role: 'assistant',
      text: error.message,
      error: true,
      createdAt: getCurrentTimeFormat(),
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

// =============================== 미리줌 AI 답장 포맷
async function sendMessage(
  question = input.value,
  staticAnswer = null,
  showBranch = false,
  showTaxOffice = false,
) {
  const trimmed = question.trim()
  if (!trimmed || loading.value) return

  messages.value.push({
    id: Date.now(),
    role: 'user',
    text: trimmed,
    createdAt: getCurrentTimeFormat(),
  })

  input.value = ''

  if (staticAnswer) {
    loading.value = true
    await scrollToBottom()

    setTimeout(async () => {
      messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        text: staticAnswer,
        actions: showBranch || showTaxOffice, // 둘 중 하나라도 true면 actions 블록을 활성화합니다.
        showBranchButton: showBranch,
        showTaxOfficeButton: showTaxOffice,
        createdAt: getCurrentTimeFormat(), // 누락되었던 시간 값 추가
      })
      loading.value = false
      await scrollToBottom()
    }, 300)

    return
  }

  // =============================== 일반 입력창에서 들어온 질문 처리
  loading.value = true
  await scrollToBottom()

  try {
    const response = await startAiConsult(trimmed)
    appendConsultResponse(response, trimmed)
  } catch (error) {
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: error.message,
      error: true,
      createdAt: getCurrentTimeFormat(),
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
// =============================== 상담 유형별 응답
function appendConsultResponse(response, originalQuestion) {
  if (response.status === 'CLARIFICATION_REQUIRED') {
    const clarifications = response.clarificationQuestions ?? []
    if (clarifications.length === 0) {
      throw new Error('추가 질문 정보를 확인할 수 없습니다.')
    }

    pendingConsult.value = {
      ...response,
      originalQuestion,
      answers: {},
      questions: clarifications,
      questionKeys: clarifications.map((clarification) => clarification.key),
      currentQuestionIndex: 0,
    }

    pushNextClarificationMessage(pendingConsult.value)

    return
  }

  pendingConsult.value = null

  if (response.status === 'REJECTED') {
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: normalizeAssistantAnswer(response.answer, '해당 질문에는 답변해 드릴 수 없습니다.'),
      error: true,
      createdAt: getCurrentTimeFormat(),
    })

    return
  }

  if (response.status !== 'COMPLETED') {
    throw new Error('알 수 없는 상담 응답을 받았습니다.')
  }

  messages.value.push({
    id: Date.now() + 1,
    role: 'assistant',
    text: normalizeAssistantAnswer(response.answer, '답변을 생성하지 못했습니다.'),
    actions: true,
    showBranchButton: true,
    showTaxOfficeButton: true,
    createdAt: getCurrentTimeFormat(),
  })
}

// =============================== 상담 초기화 포맷
function clearConversation() {
  pendingConsult.value = null
  input.value = ''
  messages.value = [
    {
      id: Date.now(),
      role: 'assistant',
      text: '새 상담을 시작할게요. 어떤 점이 궁금하신가요?',
      createdAt: getCurrentTimeFormat(),
    },
  ]
  showEndModal.value = false
}
</script>

<template>
  <div class="page chat-page">
    <AppHeader />
    <div ref="conversation" class="chat-conversation">
      <div class="chat-date">{{ getTodayDateFormat() }}</div>
      <div class="chat-agent-label">미리줌 AI</div>

      <template v-for="message in messages" :key="message.id">
        <div class="chat-row" :class="message.role">
          <article class="chat-bubble" :class="{ error: message.error }">
            <p>{{ message.text }}</p>
            <div v-if="message.clarification" class="clarification-control">
              <small v-if="message.clarification.reason" class="clarification-reason">
                {{ message.clarification.reason }}
              </small>

              <div
                v-if="message.clarification.type === 'boolean'"
                class="clarification-boolean-actions"
                role="group"
                :aria-label="message.text"
              >
                <button
                  type="button"
                  :class="{ selected: message.clarification.selectedValue === true }"
                  :disabled="message.clarification.answered || loading"
                  @click="submitClarification(message, true)"
                >
                  예
                </button>
                <button
                  type="button"
                  :class="{ selected: message.clarification.selectedValue === false }"
                  :disabled="message.clarification.answered || loading"
                  @click="submitClarification(message, false)"
                >
                  아니오
                </button>
              </div>

              <form
                v-else-if="!message.clarification.answered"
                class="clarification-input-form"
                @submit.prevent="submitClarification(message, message.clarification.draftValue)"
              >
                <div class="clarification-input-wrap">
                  <input
                    v-model="message.clarification.draftValue"
                    :type="clarificationInputType(message.clarification.type)"
                    :inputmode="message.clarification.type === 'integer' ? 'numeric' : 'text'"
                    :min="clarificationMinimum(message.clarification)"
                    :placeholder="clarificationPlaceholder(message.clarification)"
                    :aria-label="message.text"
                  />
                  <span v-if="clarificationUnit(message.clarification)">
                    {{ clarificationUnit(message.clarification) }}
                  </span>
                </div>
                <button
                  type="submit"
                  :disabled="!hasDraftClarificationAnswer(message.clarification) || loading"
                >
                  확인
                </button>
              </form>

              <div v-else class="clarification-answer-summary">
                {{
                  displayClarificationAnswer(
                    message.clarification,
                    message.clarification.selectedValue,
                  )
                }}
              </div>

              <small v-if="message.clarification.error" class="clarification-error" role="alert">
                {{ message.clarification.error }}
              </small>
            </div>
            <div v-if="message.references?.length" class="reference-block">
              <AppIcon name="document" :size="17" />
              <span>
                {{ message.references[0].lawName }}
                {{ message.references[0].articleNo }}<br />
                {{ message.references[0].title }}
              </span>
            </div>
            <div v-if="message.actions" class="chat-actions">
              <a
                v-if="message.showBranchButton"
                class="primary-button compact"
                href="https://map.naver.com/p/search/근처 국민은행"
                target="_blank"
                rel="noreferrer"
              >
                가까운 영업점 알아보기
              </a>
              <a
                v-if="message.showTaxOfficeButton"
                class="secondary-button compact"
                href="https://www.nts.go.kr/nts/taxSrch/taxSrchPage.do?mi=6761"
                target="_blank"
                rel="noreferrer"
              >
                근처 세무서 알아보기
              </a>
            </div>
          </article>
          <time>{{ message.createdAt }}</time>
        </div>
      </template>

      <div v-if="loading" class="chat-row assistant">
        <div class="chat-bubble typing" aria-label="답변 작성 중"><span /><span /><span /></div>
      </div>

      <section class="faq-suggestions">
        <span>궁금해하실 내용을 준비했어요</span>
        <div class="faq-chip-list">
          <button
            v-for="faq in faqItems"
            :key="faq.id"
            type="button"
            @click="sendMessage(faq.prompt, null, false, true)"
          >
            {{ faq.question }}
          </button>
        </div>
      </section>

      <aside class="chat-disclaimer">
        <AppIcon name="info" :size="18" />
        <p>
          AI 상담 답변은 일반적인 세무 정보를 바탕으로 제공되는 참고용 정보이며, 법적 효력이나 세무
          신고의 근거로 사용할 수 없습니다. 정확한 판단이 필요한 경우 세무 전문가와 상담해 주세요.
        </p>
      </aside>
    </div>

    <div class="chat-composer-wrap">
      <div class="chat-composer-row">
        <button
          class="chat-plus-button"
          type="button"
          aria-label="자주 묻는 질문 보기"
          :disabled="Boolean(pendingConsult) || loading"
          @click="showFaqSheet = true"
        >
          <AppIcon name="plus" :size="20" />
        </button>
        <form class="chat-composer" @submit.prevent="sendMessage()">
          <label class="sr-only" for="chat-input">증여 상담 질문</label>
          <input
            id="chat-input"
            v-model="input"
            type="text"
            maxlength="500"
            :disabled="Boolean(pendingConsult)"
            :placeholder="
              pendingConsult ? '위 추가 질문에 답해주세요' : '궁금한 내용을 입력하세요...'
            "
            autocomplete="off"
          />
          <button
            type="submit"
            :disabled="!input.trim() || loading || Boolean(pendingConsult)"
            aria-label="질문 보내기"
          >
            <AppIcon name="send" :size="19" />
          </button>
        </form>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showFaqSheet"
          class="modal-backdrop"
          role="presentation"
          @click.self="showFaqSheet = false"
        >
          <section
            class="modal-sheet faq-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="자주 묻는 질문"
          >
            <div class="faq-sheet-header">
              <h2>자주 묻는 질문</h2>
              <button
                type="button"
                class="faq-sheet-close"
                aria-label="닫기"
                @click="showFaqSheet = false"
              >
                <AppIcon name="close" :size="18" />
              </button>
            </div>
            <p class="faq-sheet-greeting">
              <span class="faq-sheet-avatar"><AppIcon name="sparkles" :size="15" /></span>
              <span
                >안녕하세요, 고객님!<br />아래 버튼을 누르거나 궁금하신 내용을 직접 입력해
                주세요.</span
              >
            </p>
            <div v-for="category in faqCategories" :key="category.title" class="faq-sheet-category">
              <h3>{{ category.title }}</h3>
              <div class="faq-sheet-grid">
                <button
                  v-for="item in category.items"
                  :key="item.question"
                  type="button"
                  @click="
                    pickFaq(
                      item.prompt,
                      item.answer,
                      item.showBranchButton,
                      item.showTaxOfficeButton,
                    )
                  "
                >
                  {{ item.question }}
                </button>
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>

    <ModalSheet
      :show="showEndModal"
      title="상담을 종료하시겠어요?"
      description="대화 내용은 별도로 저장되지 않으며 새 상담을 시작하면 초기화됩니다."
      @close="showEndModal = false"
    >
      <template #actions>
        <button class="secondary-button" type="button" @click="showEndModal = false">
          계속 상담하기
        </button>
        <button class="danger-button" type="button" @click="clearConversation">종료하기</button>
      </template>
    </ModalSheet>
  </div>
</template>
