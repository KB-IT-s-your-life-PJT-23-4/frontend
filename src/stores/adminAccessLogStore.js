import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { streamAdminAccessLogs } from '../api/adminAuditApi.js'

export const MAX_ADMIN_ACCESS_LOGS = 200

export const useAdminAccessLogStore = defineStore('adminAccessLog', () => {
  const activeTab = ref('audit')
  const accessLogs = ref([])
  const streamState = ref('idle')
  const streamMessage = ref('')
  const isStreamPaused = ref(false)
  const lastEventId = ref('')
  let streamController = null
  let reconnectTimer = null

  const successfulAccessCount = computed(
    () => accessLogs.value.filter((log) => log.result === 'SUCCESS').length,
  )

  function stopReconnectTimer() {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  function disconnect({ updateState = true } = {}) {
    stopReconnectTimer()
    streamController?.abort()
    streamController = null

    if (updateState && !isStreamPaused.value) {
      streamState.value = accessLogs.value.length ? 'disconnected' : 'idle'
      streamMessage.value = accessLogs.value.length
        ? '페이지를 다시 열면 실시간 수신을 재개합니다.'
        : ''
    }
  }

  function scheduleReconnect() {
    if (activeTab.value !== 'access' || isStreamPaused.value) return
    stopReconnectTimer()
    reconnectTimer = setTimeout(connect, 2000)
  }

  function handleStreamEvent(event) {
    if (event.type === 'connected') {
      streamState.value = 'connected'
      streamMessage.value = '실시간 요청 로그를 수신하고 있습니다.'
      return
    }
    if (event.type === 'replay-unavailable') {
      streamMessage.value = event.data?.message || '일부 이전 요청 로그를 복원하지 못했습니다.'
      return
    }
    if (event.type !== 'access-log' || !event.data) return

    const eventId = event.id || event.data.eventId
    if (event.id) lastEventId.value = event.id
    if (eventId && accessLogs.value.some((log) => String(log.eventId) === String(eventId))) return

    accessLogs.value.unshift({ ...event.data, eventId })
    if (accessLogs.value.length > MAX_ADMIN_ACCESS_LOGS) {
      accessLogs.value.splice(MAX_ADMIN_ACCESS_LOGS)
    }
  }

  async function connect() {
    if (streamController || activeTab.value !== 'access' || isStreamPaused.value) return

    streamController = new AbortController()
    const controller = streamController
    streamState.value = 'connecting'
    streamMessage.value = '사용자 요청 로그에 연결하는 중입니다.'

    try {
      await streamAdminAccessLogs({
        signal: controller.signal,
        lastEventId: lastEventId.value,
        onEvent: handleStreamEvent,
      })
      if (!controller.signal.aborted) {
        streamState.value = 'disconnected'
        streamMessage.value = '연결이 종료되어 다시 연결합니다.'
        scheduleReconnect()
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        streamState.value = 'error'
        streamMessage.value =
          error?.status === 403
            ? 'ROOT 관리자만 사용자 요청 로그를 볼 수 있습니다.'
            : error?.status === 401
              ? '관리자 로그인이 만료되었습니다. 다시 로그인해주세요.'
              : error.message || '사용자 요청 로그 연결에 실패했습니다.'
        if (![401, 403].includes(error?.status)) scheduleReconnect()
      }
    } finally {
      if (streamController === controller) streamController = null
    }
  }

  function selectTab(tab) {
    if (activeTab.value === tab) return
    activeTab.value = tab
    if (tab === 'access') connect()
    else disconnect()
  }

  function toggleStream() {
    isStreamPaused.value = !isStreamPaused.value
    if (isStreamPaused.value) {
      disconnect({ updateState: false })
      streamState.value = 'paused'
      streamMessage.value = '실시간 요청 로그 수신을 일시 정지했습니다.'
    } else {
      connect()
    }
  }

  function clearAccessLogs() {
    accessLogs.value = []
  }

  function clearUserState() {
    disconnect({ updateState: false })
    activeTab.value = 'audit'
    accessLogs.value = []
    streamState.value = 'idle'
    streamMessage.value = ''
    isStreamPaused.value = false
    lastEventId.value = ''
  }

  return {
    activeTab,
    accessLogs,
    streamState,
    streamMessage,
    isStreamPaused,
    successfulAccessCount,
    connect,
    disconnect,
    selectTab,
    toggleStream,
    clearAccessLogs,
    clearUserState,
  }
})
