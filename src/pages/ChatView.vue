<script setup>
import { nextTick, ref } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import { faqItems, faqCategories } from '../data/mockData'
import { api } from '../api/apiAdapter'
import { startAiConsult } from '@/api/aiConsultApi.js'

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
    // const response = await api.askConsultation(trimmed)
    const response = await startAiConsult(trimmed)
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: response.answer,
      references: response.references,
      actions: true,
      showBranchButton: true,
      showTaxOfficeButton: true,
      createdAt: getCurrentTimeFormat(),
    })
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

// =============================== 상담 초기화 포맷
function clearConversation() {
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
      <button
        class="explain-button"
        type="button"
        @click="sendMessage('증여재산공제를 쉽게 설명해줘')"
      >
        <AppIcon name="sparkles" :size="15" /> 쉽게 설명해줘
      </button>
      <div class="chat-composer-row">
        <button
          class="chat-plus-button"
          type="button"
          aria-label="자주 묻는 질문 보기"
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
            placeholder="궁금한 내용을 입력하세요..."
            autocomplete="off"
          />
          <button type="submit" :disabled="!input.trim() || loading" aria-label="질문 보내기">
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
