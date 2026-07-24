<script setup>
import { nextTick, ref } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import { faqItems } from '../data/mockData'
import { api } from '../api/apiAdapter'

const input = ref('')
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    text: '반갑습니다! 증여세와 절세 혜택에 대해 무엇이든 물어보세요. \n아래의 자주 묻는 질문들을 통해 상담을 시작하실 수도 있습니다.',
  },
])
const loading = ref(false)
const showEndModal = ref(false)
const conversation = ref(null)

async function scrollToBottom() {
  await nextTick()
  conversation.value?.scrollTo({
    top: conversation.value.scrollHeight,
    behavior: 'smooth',
  })
}

async function sendMessage(question = input.value) {
  const trimmed = question.trim()
  if (!trimmed || loading.value) return
  messages.value.push({ id: Date.now(), role: 'user', text: trimmed })
  input.value = ''
  loading.value = true
  await scrollToBottom()
  try {
    const response = await api.askConsultation(trimmed)
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: response.answer,
      references: response.references,
      actions: true,
    })
  } catch (error) {
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: error.message,
      error: true,
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

function clearConversation() {
  messages.value = [
    {
      id: Date.now(),
      role: 'assistant',
      text: '새 상담을 시작할게요. 어떤 점이 궁금하신가요?',
    },
  ]
  showEndModal.value = false
}
</script>

<template>
  <div class="page chat-page">
    <AppHeader />
    <div ref="conversation" class="chat-conversation">
      <div class="chat-date">오늘</div>
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
                class="primary-button compact"
                href="https://map.naver.com/p/search/근처 국민은행"
                target="_blank"
                rel="noreferrer"
              >
                가까운 영업점 알아보기
              </a>
              <a
                class="secondary-button compact"
                href="https://www.nts.go.kr/nts/taxSrch/taxSrchPage.do?mi=6761"
                target="_blank"
                rel="noreferrer"
              >
                근처 세무서 알아보기
              </a>
            </div>
          </article>
          <time>{{ message.role === 'user' ? '지금' : '' }}</time>
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
            @click="sendMessage(faq.prompt)"
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
      <button class="explain-button" type="button" @click="input = '증여재산공제를 쉽게 설명해줘'">
        <AppIcon name="sparkles" :size="15" /> 쉽게 설명해줘
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
      <button
        v-if="messages.length > 2"
        class="end-chat-button"
        type="button"
        @click="showEndModal = true"
      >
        상담 종료
      </button>
    </div>

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
