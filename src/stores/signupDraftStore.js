import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSignupDraftStore = defineStore('signupDraft', () => {
  const draft = ref(null)

  function saveDraft(nextDraft) {
    draft.value = nextDraft
  }

  function consumeDraft() {
    const savedDraft = draft.value
    draft.value = null
    return savedDraft
  }

  function clearDraft() {
    draft.value = null
  }

  return { saveDraft, consumeDraft, clearDraft }
})
