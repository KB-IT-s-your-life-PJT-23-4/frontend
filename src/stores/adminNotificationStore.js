import { reactive, readonly } from 'vue'
import { getAdminNotificationUnreadCount } from '../api/adminNotificationApi'

// 사이드바 배지와 알림 화면이 같은 숫자를 봐야 한다.
// 화면에서 읽음 처리하면 배지도 즉시 줄어들도록 안 읽음 개수만 여기에 모아둔다.
const state = reactive({
  unreadCount: 0,
})
const readonlyState = readonly(state)

export function setAdminUnreadCount(count) {
  state.unreadCount = Math.max(0, Number(count ?? 0))
}

export function decreaseAdminUnreadCount() {
  state.unreadCount = Math.max(0, state.unreadCount - 1)
}

// 배지는 부가 정보라 실패해도 화면을 막지 않는다. 권한이 없거나 목 모드면 조용히 0으로 둔다.
export async function refreshAdminUnreadCount() {
  try {
    setAdminUnreadCount(await getAdminNotificationUnreadCount())
  } catch {
    setAdminUnreadCount(0)
  }
}

export function useAdminNotificationStore() {
  return {
    state: readonlyState,
    setAdminUnreadCount,
    decreaseAdminUnreadCount,
    refreshAdminUnreadCount,
  }
}
