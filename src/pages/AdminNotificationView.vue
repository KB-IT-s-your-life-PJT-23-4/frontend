<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  getAdminNotificationPage,
  markAdminNotificationRead,
  resolveAdminNotification,
} from '../api/adminNotificationApi'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import {
  decreaseAdminUnreadCount,
  setAdminUnreadCount,
  useAdminNotificationStore,
} from '../stores/adminNotificationStore'
import '../assets/css/admin-dashboard.css'
import '../assets/css/admin-notification.css'

const PAGE_SIZE = 20

const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'OPEN', label: '미조치' },
  { value: 'RESOLVED', label: '조치 완료' },
]

const typeOptions = [
  { value: '', label: '전체 유형' },
  { value: 'BATCH_FAILURE', label: '배치 실패' },
  { value: 'SERVER_ERROR', label: '서버 오류' },
  { value: 'CLIENT_ERROR', label: '클라이언트 오류' },
]

const severityLabels = {
  CRITICAL: '심각',
  WARNING: '경고',
  INFO: '정보',
}

const notificationStore = useAdminNotificationStore()

const notifications = ref([])
const pagination = ref(null)
const listState = ref('loading')
const listError = ref('')
const feedbackMessage = ref('')
const expandedIds = ref([])
const pendingId = ref(null)

const filterForm = ref({ status: '', notificationType: '', unreadOnly: false })
const appliedFilters = ref({ status: '', notificationType: '', unreadOnly: false })

const unreadCount = computed(() => notificationStore.state.unreadCount)
const currentPage = computed(() => pagination.value?.page ?? 0)
const totalElements = computed(() => pagination.value?.totalElements ?? 0)
const pageButtons = computed(() => {
  const total = pagination.value?.totalPages ?? 0
  if (total <= 1) return []
  const start = Math.max(0, Math.min(currentPage.value - 2, total - 5))
  return Array.from({ length: Math.min(5, total) }, (_, index) => start + index)
})

function statusLabel(status) {
  return statusOptions.find((option) => option.value === status)?.label ?? status ?? '-'
}

function typeLabel(type) {
  return typeOptions.find((option) => option.value === type)?.label ?? type ?? '-'
}

function severityLabel(severity) {
  return severityLabels[severity] ?? severity ?? '-'
}

function modifier(value) {
  return `is-${String(value ?? '')
    .toLowerCase()
    .replaceAll('_', '-')}`
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

/** 배치 실패는 어느 실행에서 났는지가 원인 추적의 시작점이라 참조를 그대로 노출한다. */
function referenceLabel(notification) {
  if (!notification.referenceType || notification.referenceId == null) return ''
  if (notification.referenceType === 'BATCH_JOB_EXECUTION') {
    return `배치 실행 #${notification.referenceId}`
  }
  return `${notification.referenceType} #${notification.referenceId}`
}

function isExpanded(id) {
  return expandedIds.value.includes(id)
}

function toggleExpanded(id) {
  expandedIds.value = isExpanded(id)
    ? expandedIds.value.filter((item) => item !== id)
    : [...expandedIds.value, id]
}

function notificationErrorMessage(error, fallback) {
  if (error?.status === 403) return '알림 관리 권한이 없습니다.'
  if (error?.status === 400) return '알림 조회 조건이 올바르지 않습니다.'
  return error?.message || fallback
}

async function loadNotifications(page = 0) {
  listState.value = 'loading'
  listError.value = ''
  try {
    const data = await getAdminNotificationPage({
      page,
      size: PAGE_SIZE,
      status: appliedFilters.value.status,
      notificationType: appliedFilters.value.notificationType,
      unreadOnly: appliedFilters.value.unreadOnly,
    })
    notifications.value = Array.isArray(data?.notifications) ? data.notifications : []
    pagination.value = data?.pagination ?? null
    setAdminUnreadCount(data?.unreadCount)
    listState.value = notifications.value.length ? 'success' : 'empty'
  } catch (error) {
    notifications.value = []
    pagination.value = null
    listState.value = 'error'
    listError.value = notificationErrorMessage(error, '알림 목록을 불러오지 못했습니다.')
  }
}

function submitFilters() {
  appliedFilters.value = { ...filterForm.value }
  loadNotifications(0)
}

function resetFilters() {
  filterForm.value = { status: '', notificationType: '', unreadOnly: false }
  appliedFilters.value = { status: '', notificationType: '', unreadOnly: false }
  loadNotifications(0)
}

/**
 * 읽음은 관리자 본인 기준이라 서버가 멱등으로 처리한다. 응답을 기다린 뒤 목록을 다시 읽지 않고
 * 화면 값만 먼저 바꾼다. 목록을 새로 받으면 "안 읽음만" 필터에서 방금 읽은 행이 사라져,
 * 사용자가 무엇을 눌렀는지 놓친다.
 */
async function markRead(notification) {
  if (notification.read || pendingId.value) return

  pendingId.value = notification.adminNotificationId
  try {
    await markAdminNotificationRead(notification.adminNotificationId)
    notification.read = true
    decreaseAdminUnreadCount()
  } catch (error) {
    feedbackMessage.value = notificationErrorMessage(error, '읽음 처리에 실패했습니다.')
  } finally {
    pendingId.value = null
  }
}

/**
 * 조치 완료는 알림 자체의 상태라 모든 관리자에게 반영된다. 다른 관리자가 먼저 처리했으면 409 가
 * 오는데, 그때는 목록을 다시 읽어 현재 상태를 보여주는 편이 맞다.
 */
async function resolve(notification) {
  if (notification.status === 'RESOLVED' || pendingId.value) return

  pendingId.value = notification.adminNotificationId
  try {
    await resolveAdminNotification(notification.adminNotificationId)
    feedbackMessage.value = `#${notification.adminNotificationId} 알림을 조치 완료로 표시했습니다.`
    await loadNotifications(currentPage.value)
  } catch (error) {
    if (error?.status === 409) {
      feedbackMessage.value = '이미 처리됐거나 존재하지 않는 알림입니다. 목록을 새로 불러옵니다.'
      await loadNotifications(currentPage.value)
    } else {
      feedbackMessage.value = notificationErrorMessage(error, '조치 처리에 실패했습니다.')
    }
  } finally {
    pendingId.value = null
  }
}

onMounted(() => loadNotifications(0))
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-notification-title">
      <div>
        <h1 id="admin-notification-title">알림</h1>
        <p>배치 실패와 서버 오류를 확인하고 조치 상태를 관리하세요.</p>
      </div>
      <div class="admin-notification-summary">
        <div>
          <span>전체 알림</span><strong>{{ formatNumber(totalElements) }}<small>건</small></strong>
        </div>
        <div>
          <span>안 읽음</span><strong>{{ formatNumber(unreadCount) }}<small>건</small></strong>
        </div>
      </div>
    </section>

    <p v-if="feedbackMessage" class="admin-notification-feedback" role="status">
      {{ feedbackMessage }}
      <button type="button" aria-label="메시지 닫기" @click="feedbackMessage = ''">×</button>
    </p>

    <section
      class="admin-panel admin-notification-filter"
      aria-labelledby="admin-notification-filter-title"
    >
      <div class="admin-panel__heading">
        <div>
          <h2 id="admin-notification-filter-title">알림 필터</h2>
        </div>
        <AppIcon name="info" :size="21" />
      </div>
      <form class="admin-notification-filter__form" @submit.prevent="submitFilters">
        <label>
          <span>조치 상태</span>
          <select v-model="filterForm.status">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label>
          <span>알림 유형</span>
          <select v-model="filterForm.notificationType">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="admin-notification-filter__check">
          <input v-model="filterForm.unreadOnly" type="checkbox" />
          <span>안 읽은 것만</span>
        </label>
        <div class="admin-notification-filter__actions">
          <button type="button" class="admin-notification-button" @click="resetFilters">
            초기화
          </button>
          <button type="submit" class="admin-notification-button is-primary">조회</button>
        </div>
      </form>
    </section>

    <section
      class="admin-panel admin-notification-list"
      aria-labelledby="admin-notification-list-title"
    >
      <div class="admin-panel__heading">
        <div>
          <h2 id="admin-notification-list-title">알림 목록</h2>
        </div>
        <p v-if="pagination">
          {{ currentPage + 1 }} / {{ Math.max(pagination.totalPages, 1) }} 페이지
        </p>
      </div>

      <div v-if="listState === 'loading'" class="admin-notification-state" aria-live="polite">
        <span class="admin-loading-spinner" aria-hidden="true" />
        <strong>알림을 불러오는 중입니다.</strong>
      </div>
      <div v-else-if="listState === 'error'" class="admin-notification-state is-error" role="alert">
        <AppIcon name="info" :size="27" />
        <strong>알림을 불러오지 못했습니다.</strong>
        <p>{{ listError }}</p>
        <button type="button" @click="loadNotifications(currentPage)">다시 시도</button>
      </div>
      <div v-else-if="listState === 'empty'" class="admin-notification-state">
        <AppIcon name="check" :size="29" />
        <strong>조건에 맞는 알림이 없습니다.</strong>
        <p>배치가 실패하면 이곳에 자동으로 쌓입니다.</p>
      </div>

      <template v-else>
        <ul class="admin-notification-items">
          <li
            v-for="notification in notifications"
            :key="notification.adminNotificationId"
            class="admin-notification-item"
            :class="{ 'is-unread': !notification.read }"
          >
            <div class="admin-notification-item__main">
              <div class="admin-notification-item__badges">
                <span class="admin-notification-severity" :class="modifier(notification.severity)">
                  {{ severityLabel(notification.severity) }}
                </span>
                <span class="admin-notification-type">
                  {{ typeLabel(notification.notificationType) }}
                </span>
                <span class="admin-notification-status" :class="modifier(notification.status)">
                  {{ statusLabel(notification.status) }}
                </span>
                <span v-if="!notification.read" class="admin-notification-unread-dot">안 읽음</span>
              </div>

              <button
                class="admin-notification-item__title"
                type="button"
                :aria-expanded="isExpanded(notification.adminNotificationId)"
                @click="toggleExpanded(notification.adminNotificationId)"
              >
                <strong>{{ notification.title }}</strong>
                <AppIcon name="chevron" :size="14" />
              </button>

              <p class="admin-notification-item__meta">
                <span>{{
                  formatDateTime(notification.lastOccurredAt ?? notification.createdAt)
                }}</span>
                <span v-if="notification.occurrenceCount > 1">
                  {{ formatNumber(notification.occurrenceCount) }}회 반복
                </span>
                <span v-if="referenceLabel(notification)">{{ referenceLabel(notification) }}</span>
              </p>

              <pre
                v-show="isExpanded(notification.adminNotificationId)"
                class="admin-notification-item__message"
                >{{ notification.message || '상세 메시지가 없습니다.' }}</pre
              >
            </div>

            <div class="admin-notification-item__actions">
              <button
                type="button"
                class="admin-notification-button"
                :disabled="notification.read || pendingId === notification.adminNotificationId"
                @click="markRead(notification)"
              >
                {{ notification.read ? '읽음' : '읽음 표시' }}
              </button>
              <button
                type="button"
                class="admin-notification-button is-primary"
                :disabled="
                  notification.status === 'RESOLVED' ||
                  pendingId === notification.adminNotificationId
                "
                @click="resolve(notification)"
              >
                {{ notification.status === 'RESOLVED' ? '조치 완료' : '조치 완료로 표시' }}
              </button>
            </div>
          </li>
        </ul>

        <nav
          v-if="pagination?.totalPages > 1"
          class="admin-notification-pagination"
          aria-label="알림 목록 페이지"
        >
          <button
            type="button"
            :disabled="!pagination.hasPrevious"
            aria-label="이전 페이지"
            @click="loadNotifications(currentPage - 1)"
          >
            <AppIcon name="back" :size="15" />
          </button>
          <button
            v-for="page in pageButtons"
            :key="page"
            type="button"
            :class="{ 'is-active': page === currentPage }"
            :aria-current="page === currentPage ? 'page' : undefined"
            @click="loadNotifications(page)"
          >
            {{ page + 1 }}
          </button>
          <button
            type="button"
            :disabled="!pagination.hasNext"
            aria-label="다음 페이지"
            @click="loadNotifications(currentPage + 1)"
          >
            <AppIcon name="chevron" :size="15" />
          </button>
        </nav>
      </template>
    </section>
  </AdminLayout>
</template>
