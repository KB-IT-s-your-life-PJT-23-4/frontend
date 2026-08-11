import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_PREFIX = 'mirizoom-ai-consultation-v1'

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${encodeURIComponent(String(userId))}`
}

function readCachedConversation(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key))
    if (!cached || !Array.isArray(cached.messages)) return null
    return {
      messages: cached.messages,
      pendingConsult: cached.pendingConsult ?? null,
    }
  } catch {
    return null
  }
}

export const useConsultationStore = defineStore('consultation', () => {
  const messages = ref([])
  const pendingConsult = ref(null)
  const initializedUserId = ref(null)
  const initialized = ref(false)
  let activeStorageKey = null
  let hydrating = false

  function persist() {
    if (!activeStorageKey || hydrating) return

    try {
      localStorage.setItem(
        activeStorageKey,
        JSON.stringify({
          messages: messages.value,
          pendingConsult: pendingConsult.value,
        }),
      )
    } catch {
      // 브라우저 저장소가 차단되거나 용량을 초과해도 현재 상담은 메모리에서 계속 진행합니다.
    }
  }

  watch([messages, pendingConsult], persist, { deep: true, flush: 'sync' })

  function restore(userId) {
    const normalizedUserId = String(userId ?? '').trim()
    if (!normalizedUserId) return false

    if (initialized.value && initializedUserId.value === normalizedUserId) {
      return true
    }

    const nextStorageKey = storageKey(normalizedUserId)
    const cached = readCachedConversation(nextStorageKey)

    hydrating = true
    activeStorageKey = nextStorageKey
    initializedUserId.value = normalizedUserId
    messages.value = cached?.messages ?? []
    pendingConsult.value = cached?.pendingConsult ?? null
    initialized.value = Boolean(cached)
    hydrating = false

    return Boolean(cached)
  }

  function replaceConversation(nextMessages, nextPendingConsult = null) {
    hydrating = true
    messages.value = nextMessages
    pendingConsult.value = nextPendingConsult
    initialized.value = true
    hydrating = false
    persist()
  }

  function clearConversation(initialMessages = []) {
    messages.value = initialMessages
    pendingConsult.value = null
    initialized.value = true
  }

  function clearUserState() {
    try {
      if (activeStorageKey) localStorage.removeItem(activeStorageKey)
    } catch {
      // 저장소 접근이 차단된 환경에서도 메모리 상태는 아래에서 초기화합니다.
    }

    hydrating = true
    messages.value = []
    pendingConsult.value = null
    initializedUserId.value = null
    initialized.value = false
    activeStorageKey = null
    hydrating = false
  }

  return {
    messages,
    pendingConsult,
    initialized,
    restore,
    replaceConversation,
    clearConversation,
    clearUserState,
  }
})
