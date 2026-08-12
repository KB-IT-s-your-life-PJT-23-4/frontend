<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { getAdminAuditLogPage } from '../api/adminAuditApi.js'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import {
  MAX_ADMIN_ACCESS_LOGS,
  useAdminAccessLogStore,
} from '../stores/adminAccessLogStore.js'
import '../assets/css/admin-dashboard.css'
import '../assets/css/admin-audit.css'

const PAGE_SIZE = 10
const MAX_ACCESS_LOGS = MAX_ADMIN_ACCESS_LOGS

const accessLogStore = useAdminAccessLogStore()
const {
  activeTab,
  accessLogs,
  streamState,
  streamMessage,
  isStreamPaused,
  successfulAccessCount,
} = storeToRefs(accessLogStore)
const { connect: connectAccessStream, disconnect: stopAccessStream } = accessLogStore

const auditLogs = ref([])
const pagination = ref(null)
const auditState = ref('loading')
const auditError = ref('')
const selectedAuditLog = ref(null)
const filterForm = ref(emptyFilters())
const appliedFilters = ref(emptyFilters())

const currentPage = computed(() => pagination.value?.page ?? 0)
const totalElements = computed(() => pagination.value?.totalElements ?? 0)
const pageButtons = computed(() => {
  const total = pagination.value?.totalPages ?? 0
  if (total <= 1) return []
  const start = Math.max(0, Math.min(currentPage.value - 2, total - 5))
  return Array.from({ length: Math.min(5, total) }, (_, index) => start + index)
})
function emptyFilters() {
  return {
    actorUserId: '',
    actionType: '',
    targetType: '',
    targetId: '',
    from: '',
    to: '',
  }
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
    second: '2-digit',
  }).format(date)
}

function filterDateTime(value) {
  return value ? `${value}:00` : undefined
}

function resultLabel(result) {
  return result === 'SUCCESS' ? '성공' : result === 'FAILURE' ? '실패' : result || '-'
}

function prettyChangeData(value) {
  if (!value) return '변경 데이터가 없습니다.'
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function auditErrorMessage(error) {
  if (error?.status === 403) return 'ROOT 관리자만 감사 로그를 조회할 수 있습니다.'
  if (error?.status === 400) return '감사 로그 조회 조건이 올바르지 않습니다.'
  return error?.message || '관리자 동작 이력을 불러오지 못했습니다.'
}

async function loadAuditLogs(page = 0) {
  auditState.value = 'loading'
  auditError.value = ''
  try {
    const data = await getAdminAuditLogPage({
      page,
      size: PAGE_SIZE,
      ...appliedFilters.value,
      from: filterDateTime(appliedFilters.value.from),
      to: filterDateTime(appliedFilters.value.to),
    })
    auditLogs.value = Array.isArray(data?.auditLogs) ? data.auditLogs : []
    pagination.value = data?.pagination ?? null
    auditState.value = auditLogs.value.length ? 'success' : 'empty'

    if (selectedAuditLog.value) {
      selectedAuditLog.value =
        auditLogs.value.find((log) => log.auditLogId === selectedAuditLog.value.auditLogId) ?? null
    }
  } catch (error) {
    auditLogs.value = []
    pagination.value = null
    selectedAuditLog.value = null
    auditState.value = 'error'
    auditError.value = auditErrorMessage(error)
  }
}

function submitFilters() {
  appliedFilters.value = { ...filterForm.value }
  selectedAuditLog.value = null
  loadAuditLogs(0)
}

function resetFilters() {
  filterForm.value = emptyFilters()
  appliedFilters.value = emptyFilters()
  selectedAuditLog.value = null
  loadAuditLogs(0)
}

function selectTab(tab) {
  accessLogStore.selectTab(tab)
}

function toggleStream() {
  accessLogStore.toggleStream()
}

function clearAccessLogs() {
  accessLogStore.clearAccessLogs()
}

onMounted(() => {
  loadAuditLogs(0)
  if (activeTab.value === 'access') connectAccessStream()
})
onBeforeUnmount(stopAccessStream)
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-audit-title">
      <div>
        <h1 id="admin-audit-title">감사 로그</h1>
        <p>관리자 작업 이력과 서비스 요청 흐름을 확인하세요.</p>
      </div>
      <div class="admin-audit-heading-summary">
        <span>ROOT 전용</span>
        <strong>운영 감사</strong>
        <small>변경 이력 · 실시간 요청</small>
      </div>
    </section>

    <nav class="admin-audit-tabs" aria-label="감사 로그 유형">
      <button
        type="button"
        :class="{ 'is-active': activeTab === 'audit' }"
        :aria-selected="activeTab === 'audit'"
        role="tab"
        @click="selectTab('audit')"
      >
        <AppIcon name="shield" :size="18" /> 관리자 계정 동작 히스토리
      </button>
      <button
        type="button"
        :class="{ 'is-active': activeTab === 'access' }"
        :aria-selected="activeTab === 'access'"
        role="tab"
        @click="selectTab('access')"
      >
        <AppIcon name="refresh" :size="18" /> 사용자 요청 로그
        <i :class="`is-${streamState}`" aria-hidden="true" />
      </button>
    </nav>

    <template v-if="activeTab === 'audit'">
      <section class="admin-panel admin-audit-filter" aria-labelledby="audit-filter-title">
        <div class="admin-panel__heading">
          <div><h2 id="audit-filter-title">동작 이력 필터</h2></div>
          <AppIcon name="settings" :size="21" />
        </div>
        <form class="admin-audit-filter__form" @submit.prevent="submitFilters">
          <label>
            <span>관리자 사용자 ID</span>
            <input v-model="filterForm.actorUserId" type="number" min="1" placeholder="예: 12" />
          </label>
          <label>
            <span>동작 유형</span>
            <input v-model="filterForm.actionType" type="text" placeholder="예: UPDATE_ROLE" />
          </label>
          <label>
            <span>대상 유형</span>
            <input v-model="filterForm.targetType" type="text" placeholder="예: USER" />
          </label>
          <label>
            <span>대상 ID</span>
            <input v-model="filterForm.targetId" type="text" placeholder="대상 식별값" />
          </label>
          <label>
            <span>시작 시각</span>
            <input v-model="filterForm.from" type="datetime-local" />
          </label>
          <label>
            <span>종료 시각</span>
            <input v-model="filterForm.to" type="datetime-local" />
          </label>
          <div class="admin-audit-filter__actions">
            <button type="button" class="is-secondary" @click="resetFilters">초기화</button>
            <button type="submit" class="is-primary">조회</button>
          </div>
        </form>
      </section>

      <div class="admin-audit-content-grid">
        <section class="admin-panel admin-audit-list" aria-labelledby="audit-list-title">
          <div class="admin-panel__heading admin-audit-list__heading">
            <div><h2 id="audit-list-title">관리자 동작 이력</h2></div>
            <p>전체 {{ totalElements.toLocaleString('ko-KR') }}건</p>
          </div>

          <div v-if="auditState === 'loading'" class="admin-audit-state" role="status">
            <span class="admin-loading-spinner" /><strong>감사 로그를 불러오는 중입니다.</strong>
          </div>
          <div v-else-if="auditState === 'error'" class="admin-audit-state is-error" role="alert">
            <AppIcon name="info" :size="27" /><strong>조회에 실패했습니다.</strong>
            <p>{{ auditError }}</p>
            <button type="button" @click="loadAuditLogs(currentPage)">다시 시도</button>
          </div>
          <div v-else-if="auditState === 'empty'" class="admin-audit-state">
            <AppIcon name="document" :size="28" /><strong>조건에 맞는 이력이 없습니다.</strong>
          </div>
          <template v-else>
            <div class="admin-audit-table-wrap">
              <table class="admin-audit-table">
                <thead>
                  <tr>
                    <th>시각</th>
                    <th>관리자</th>
                    <th>동작</th>
                    <th>대상</th>
                    <th>결과</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="log in auditLogs"
                    :key="log.auditLogId"
                    :class="{ 'is-selected': selectedAuditLog?.auditLogId === log.auditLogId }"
                  >
                    <td data-label="시각">{{ formatDateTime(log.occurredAt) }}</td>
                    <td data-label="관리자">
                      <strong>#{{ log.actorUserId }}</strong
                      ><small>{{ log.actorRole }}</small>
                    </td>
                    <td data-label="동작">
                      <code>{{ log.actionType }}</code
                      ><small>{{ log.actionSummary }}</small>
                    </td>
                    <td data-label="대상">{{ log.targetType }} #{{ log.targetId ?? '-' }}</td>
                    <td data-label="결과">
                      <span
                        class="admin-audit-result"
                        :class="`is-${String(log.result).toLowerCase()}`"
                        >{{ resultLabel(log.result) }}</span
                      >
                    </td>
                    <td>
                      <button type="button" @click="selectedAuditLog = log">
                        상세 <AppIcon name="chevron" :size="13" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <nav
              v-if="pagination?.totalPages > 1"
              class="admin-audit-pagination"
              aria-label="감사 로그 페이지"
            >
              <button
                type="button"
                :disabled="!pagination.hasPrevious"
                @click="loadAuditLogs(currentPage - 1)"
              >
                <AppIcon name="back" :size="14" />
              </button>
              <button
                v-for="page in pageButtons"
                :key="page"
                type="button"
                :class="{ 'is-active': page === currentPage }"
                @click="loadAuditLogs(page)"
              >
                {{ page + 1 }}
              </button>
              <button
                type="button"
                :disabled="!pagination.hasNext"
                @click="loadAuditLogs(currentPage + 1)"
              >
                <AppIcon name="chevron" :size="14" />
              </button>
            </nav>
          </template>
        </section>

        <aside class="admin-panel admin-audit-detail" aria-labelledby="audit-detail-title">
          <div class="admin-panel__heading">
            <div><h2 id="audit-detail-title">동작 상세</h2></div>
            <AppIcon name="document" :size="21" />
          </div>
          <div v-if="!selectedAuditLog" class="admin-audit-detail__empty">
            <AppIcon name="document" :size="28" /><strong>이력을 선택해주세요.</strong>
            <p>관리자 작업의 대상과 변경 내용을 확인할 수 있습니다.</p>
          </div>
          <div v-else class="admin-audit-detail__body">
            <span
              class="admin-audit-result"
              :class="`is-${String(selectedAuditLog.result).toLowerCase()}`"
              >{{ resultLabel(selectedAuditLog.result) }}</span
            >
            <h3>{{ selectedAuditLog.actionSummary || selectedAuditLog.actionType }}</h3>
            <dl>
              <div>
                <dt>로그 ID</dt>
                <dd>#{{ selectedAuditLog.auditLogId }}</dd>
              </div>
              <div>
                <dt>관리자</dt>
                <dd>#{{ selectedAuditLog.actorUserId }} · {{ selectedAuditLog.actorRole }}</dd>
              </div>
              <div>
                <dt>대상</dt>
                <dd>{{ selectedAuditLog.targetType }} #{{ selectedAuditLog.targetId ?? '-' }}</dd>
              </div>
              <div>
                <dt>IP 주소</dt>
                <dd>{{ selectedAuditLog.ipAddress || '-' }}</dd>
              </div>
              <div>
                <dt>발생 시각</dt>
                <dd>{{ formatDateTime(selectedAuditLog.occurredAt) }}</dd>
              </div>
            </dl>
            <section>
              <span>변경 데이터</span>
              <pre>{{ prettyChangeData(selectedAuditLog.changeData) }}</pre>
            </section>
          </div>
        </aside>
      </div>
    </template>

    <section v-else class="admin-panel admin-access-log" aria-labelledby="access-log-title">
      <div class="admin-access-log__heading">
        <div>
          <h2 id="access-log-title">사용자 요청 로그</h2>
          <p :class="`is-${streamState}`">
            <i />{{ streamMessage || '탭을 열면 실시간 연결을 시작합니다.' }}
          </p>
        </div>
        <div>
          <span>수신 {{ accessLogs.length }}건 · 성공 {{ successfulAccessCount }}건</span>
          <button type="button" class="is-secondary" @click="clearAccessLogs">화면 지우기</button>
          <button type="button" class="is-primary" @click="toggleStream">
            {{ isStreamPaused ? '수신 시작' : '일시 정지' }}
          </button>
        </div>
      </div>

      <div v-if="!accessLogs.length" class="admin-audit-state">
        <AppIcon name="refresh" :size="29" /><strong>수신된 사용자 요청이 없습니다.</strong>
        <p>서비스 요청이 발생하면 최신 로그가 위쪽에 표시됩니다.</p>
      </div>
      <div v-else class="admin-access-table-wrap">
        <table class="admin-access-table">
          <thead>
            <tr>
              <th>발생 시각</th>
              <th>사용자</th>
              <th>요청</th>
              <th>처리 위치</th>
              <th>결과</th>
              <th>소요</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in accessLogs" :key="log.eventId">
              <td data-label="발생 시각">{{ formatDateTime(log.occurredAt) }}</td>
              <td data-label="사용자">
                <strong>#{{ log.userId ?? '-' }}</strong
                ><small>{{ log.role || '-' }}</small>
              </td>
              <td data-label="요청">
                <code>{{ log.httpMethod }}</code
                ><span>{{ log.requestUri }}</span>
              </td>
              <td data-label="처리 위치">
                <strong>{{ log.controllerName }}</strong
                ><small>{{ log.controllerMethod }}</small>
              </td>
              <td data-label="결과">
                <span
                  class="admin-audit-result"
                  :class="`is-${String(log.result).toLowerCase()}`"
                  >{{ resultLabel(log.result) }}</span
                ><small v-if="log.exceptionName">{{ log.exceptionName }}</small>
              </td>
              <td data-label="소요">{{ Number(log.elapsedMs ?? 0).toLocaleString('ko-KR') }}ms</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="admin-access-log__notice">
        <AppIcon name="info" :size="15" /> 실시간 요청 로그는 서버 메모리의 최근 500개 범위에서
        재연결되며, 화면에는 최신 {{ MAX_ACCESS_LOGS }}건만 유지합니다.
      </p>
    </section>
  </AdminLayout>
</template>
