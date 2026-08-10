import { reactive, readonly } from 'vue'
import { BLOCKED_ACCESS_MESSAGE } from '../utils/accountAccess.js'

const state = reactive({
  visible: false,
  message: BLOCKED_ACCESS_MESSAGE,
})
const readonlyState = readonly(state)

export function showBlockedAccess() {
  if (state.visible) return false
  state.visible = true
  return true
}

export function useAccountAccessStore() {
  function closeBlockedAccess() {
    state.visible = false
  }

  return {
    state: readonlyState,
    showBlockedAccess,
    closeBlockedAccess,
  }
}
