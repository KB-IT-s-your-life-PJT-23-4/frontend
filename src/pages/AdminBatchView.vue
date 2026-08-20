<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  getAdminBatchExecutionPage,
  getAdminBatchJobs,
  restartAdminBatchExecution,
  runAdminBatchJob,
} from '../api/adminBatchApi'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import '../assets/css/admin-dashboard.css'
import '../assets/css/admin-batch.css'

const PAGE_SIZE = 20
const RUNNING_POLL_MS = 3000

const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'COMPLETED', label: '성공' },
  { value: 'FAILED', label: '실패' },
  { value: 'STARTED', label: '실행 중' },
  { value: 'STOPPED', label: '중단' },
  { value: 'ABANDONED', label: '폐기' },
]

const statusLabels = {
  COMPLETED: '성공',
  STARTING: '시작 중',
  STARTED: '실행 중',
  STOPPING: '중단 중',
  STOPPED: '중단',
  FAILED: '실패',
  ABANDONED: '폐기',
  UNKNOWN: '알 수 없음',
}

/** 실패/중단만 이어서 돌릴 수 있다. 성공한 실행은 재시작 대상이 아니라 서버가 409 를 준다. */
const RESTARTABLE_STATUSES = ['FAILED', 'STOPPED']

const jobs = ref([])
const executions = ref([])
const pagination = ref(null)
const listState = ref('loading')
const listError = ref('')
const feedbackMessage = ref('')
const pendingAction = ref('')

const filterForm = ref({ jobName: '', status: '' })
const appliedFilters = ref({ jobName: '', status: '' })

let pollTimer = null

const currentPage = computed(() => pagination.value?.page ?? 0)
const anyJobRunning = computed(() => jobs.value.some((job) => job.running))
const pageButtons = computed(() => {
  const total = pagination.value?.totalPages ?? 0
  if (total <= 1) return []
  const start = Math.max(0, Math.min(currentPage.value - 2, total - 5))
  return Array.from({ length: Math.min(5, total) }, (_, index) => start + index)
})

function statusLabel(status) {
  return statusLabels[status] ?? status ?? '-'
}

function modifier(value) {
  return `is-${String(value ?? '').toLowerCase()}`
}

function isRestartable(execution) {
  return RESTARTABLE_STATUSES.includes(execution.status)
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('ko-KR')
}

/** 시작만 하고 끝나지 않은 실행은 소요 시간을 알 수 없다. 진행 중과 비정상 종료를 굳이 나누지 않는다. */
function formatDuration(execution) {
  if (!execution.startTime || !execution.endTime) return '-'

  const elapsed = new Date(execution.endTime) - new Date(execution.startTime)
  if (Number.isNaN(elapsed) || elapsed < 0) return '-'
  if (elapsed < 1000) return `${elapsed}ms`
  if (elapsed < 60000) return `${(elapsed / 1000).toFixed(1)}초`

  return `${Math.floor(elapsed / 60000)}분 ${Math.round((elapsed % 60000) / 1000)}초`
}

function batchErrorMessage(error, fallback) {
  if (error?.status === 403)
    return '배치를 실행할 권한이 없습니다. ROOT 또는 MIDDLE 관리자만 가능합니다.'
  if (error?.status === 404) return '등록되지 않은 배치 작업입니다.'
  if (error?.status === 409) return '이미 실행 중이거나 재시작할 수 없는 상태입니다.'
  return error?.message || fallback
}

async function loadJobs() {
  try {
    const data = await getAdminBatchJobs()
    jobs.value = Array.isArray(data) ? data : []
    syncPolling()
  } catch (error) {
    jobs.value = []
  }
}

async function loadExecutions(page = 0) {
  listState.value = 'loading'
  listError.value = ''
  try {
    const data = await getAdminBatchExecutionPage({
      page,
      size: PAGE_SIZE,
      jobName: appliedFilters.value.jobName,
      status: appliedFilters.value.status,
    })
    executions.value = Array.isArray(data?.executions) ? data.executions : []
    pagination.value = data?.pagination ?? null
    listState.value = executions.value.length ? 'success' : 'empty'
  } catch (error) {
    executions.value = []
    pagination.value = null
    listState.value = 'error'
    listError.value = batchErrorMessage(error, '실행 이력을 불러오지 못했습니다.')
  }
}

async function refresh(page = currentPage.value) {
  await Promise.all([loadJobs(), loadExecutions(page)])
}

/**
 * 실행은 접수만 되고 결과는 나중에 나온다. 돌고 있는 잡이 있을 때만 주기적으로 다시 읽어
 * 상태가 저절로 갱신되게 하고, 끝나면 타이머를 멈춘다.
 */
function syncPolling() {
  if (anyJobRunning.value && !pollTimer) {
    pollTimer = setInterval(() => refresh(), RUNNING_POLL_MS)
    return
  }

  if (!anyJobRunning.value && pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function submitFilters() {
  appliedFilters.value = { ...filterForm.value }
  loadExecutions(0)
}

function resetFilters() {
  filterForm.value = { jobName: '', status: '' }
  appliedFilters.value = { jobName: '', status: '' }
  loadExecutions(0)
}

async function run(job) {
  if (job.running || pendingAction.value) return

  pendingAction.value = `run:${job.jobName}`
  try {
    await runAdminBatchJob(job.jobName)
    feedbackMessage.value = `${job.displayName} 실행을 요청했습니다. 완료되면 아래 이력에 나타납니다.`
    await refresh(0)
  } catch (error) {
    feedbackMessage.value = batchErrorMessage(error, '배치 실행 요청에 실패했습니다.')
  } finally {
    pendingAction.value = ''
  }
}

async function restart(execution) {
  if (pendingAction.value) return

  pendingAction.value = `restart:${execution.jobExecutionId}`
  try {
    await restartAdminBatchExecution(execution.jobExecutionId)
    feedbackMessage.value = `#${execution.jobExecutionId} 실행을 실패 지점부터 재시작했습니다.`
    await refresh(0)
  } catch (error) {
    feedbackMessage.value = batchErrorMessage(error, '재시작 요청에 실패했습니다.')
  } finally {
    pendingAction.value = ''
  }
}

onMounted(() => refresh(0))
onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-batch-title">
      <div>
        <h1 id="admin-batch-title">배치 작업 관리</h1>
        <p>정기 배치를 수동으로 실행하고 실행 이력을 확인하세요.</p>
      </div>
      <button
        type="button"
        class="admin-batch-button"
        :disabled="listState === 'loading'"
        @click="refresh()"
      >
        <AppIcon name="refresh" :size="14" />
        새로고침
      </button>
    </section>

    <p v-if="feedbackMessage" class="admin-batch-feedback" role="status">
      {{ feedbackMessage }}
      <button type="button" aria-label="메시지 닫기" @click="feedbackMessage = ''">×</button>
    </p>

    <section class="admin-batch-jobs" aria-label="실행 가능한 배치 작업">
      <article v-for="job in jobs" :key="job.jobName" class="admin-panel admin-batch-job">
        <div class="admin-batch-job__head">
          <div>
            <span>{{ job.jobName }}</span>
            <h2>{{ job.displayName }}</h2>
          </div>
          <span v-if="job.running" class="admin-batch-running">
            <span aria-hidden="true" />실행 중
          </span>
        </div>

        <dl class="admin-batch-job__last">
          <div>
            <dt>마지막 실행</dt>
            <dd>{{ job.lastExecution ? formatDateTime(job.lastExecution.startTime) : '없음' }}</dd>
          </div>
          <div>
            <dt>결과</dt>
            <dd>
              <span
                v-if="job.lastExecution"
                class="admin-batch-status"
                :class="modifier(job.lastExecution.status)"
              >
                {{ statusLabel(job.lastExecution.status) }}
              </span>
              <template v-else>-</template>
            </dd>
          </div>
          <div>
            <dt>처리 건수</dt>
            <dd>{{ job.lastExecution ? formatNumber(job.lastExecution.writeCount) : '-' }}</dd>
          </div>
        </dl>

        <button
          type="button"
          class="admin-batch-button is-primary"
          :disabled="job.running || pendingAction === `run:${job.jobName}`"
          @click="run(job)"
        >
          {{ job.running ? '실행 중…' : '지금 실행' }}
        </button>
      </article>
    </section>

    <section class="admin-panel admin-batch-filter" aria-labelledby="admin-batch-filter-title">
      <div class="admin-panel__heading">
        <div>
          <h2 id="admin-batch-filter-title">실행 이력 필터</h2>
        </div>
        <AppIcon name="info" :size="21" />
      </div>
      <form class="admin-batch-filter__form" @submit.prevent="submitFilters">
        <label>
          <span>작업</span>
          <select v-model="filterForm.jobName">
            <option value="">전체 작업</option>
            <option v-for="job in jobs" :key="job.jobName" :value="job.jobName">
              {{ job.displayName }}
            </option>
          </select>
        </label>
        <label>
          <span>실행 상태</span>
          <select v-model="filterForm.status">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <div class="admin-batch-filter__actions">
          <button type="button" class="admin-batch-button" @click="resetFilters">초기화</button>
          <button type="submit" class="admin-batch-button is-primary">조회</button>
        </div>
      </form>
    </section>

    <section class="admin-panel admin-batch-list" aria-labelledby="admin-batch-list-title">
      <div class="admin-panel__heading">
        <div>
          <h2 id="admin-batch-list-title">실행 이력</h2>
        </div>
        <p v-if="pagination">
          {{ currentPage + 1 }} / {{ Math.max(pagination.totalPages, 1) }} 페이지
        </p>
      </div>

      <div v-if="listState === 'loading'" class="admin-batch-state" aria-live="polite">
        <span class="admin-loading-spinner" aria-hidden="true" />
        <strong>실행 이력을 불러오는 중입니다.</strong>
      </div>
      <div v-else-if="listState === 'error'" class="admin-batch-state is-error" role="alert">
        <AppIcon name="info" :size="27" />
        <strong>실행 이력을 불러오지 못했습니다.</strong>
        <p>{{ listError }}</p>
        <button type="button" @click="loadExecutions(currentPage)">다시 시도</button>
      </div>
      <div v-else-if="listState === 'empty'" class="admin-batch-state">
        <AppIcon name="check" :size="29" />
        <strong>조건에 맞는 실행 이력이 없습니다.</strong>
        <p>배치를 한 번 실행하면 이곳에 쌓입니다.</p>
      </div>

      <template v-else>
        <div class="admin-batch-table-wrap">
          <table class="admin-batch-table">
            <thead>
              <tr>
                <th scope="col">실행</th>
                <th scope="col">작업</th>
                <th scope="col">상태</th>
                <th scope="col">시작</th>
                <th scope="col">소요</th>
                <th scope="col">읽음</th>
                <th scope="col">성공</th>
                <th scope="col">실패</th>
                <th scope="col"><span class="admin-batch-sr-only">관리</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="execution in executions" :key="execution.jobExecutionId">
                <td data-label="실행">
                  <strong>#{{ execution.jobExecutionId }}</strong>
                </td>
                <td data-label="작업">{{ execution.jobName }}</td>
                <td data-label="상태">
                  <span class="admin-batch-status" :class="modifier(execution.status)">
                    {{ statusLabel(execution.status) }}
                  </span>
                </td>
                <td data-label="시작">{{ formatDateTime(execution.startTime ?? execution.createTime) }}</td>
                <td data-label="소요">{{ formatDuration(execution) }}</td>
                <td data-label="읽음">{{ formatNumber(execution.readCount) }}</td>
                <td data-label="성공">{{ formatNumber(execution.writeCount) }}</td>
                <td data-label="실패" :class="{ 'is-danger': execution.skipCount > 0 }">
                  {{ formatNumber(execution.skipCount) }}
                </td>
                <td data-label="관리">
                  <button
                    v-if="isRestartable(execution)"
                    type="button"
                    class="admin-batch-button"
                    :disabled="pendingAction === `restart:${execution.jobExecutionId}`"
                    @click="restart(execution)"
                  >
                    실패 지점부터 재시작
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav
          v-if="pagination?.totalPages > 1"
          class="admin-batch-pagination"
          aria-label="실행 이력 페이지"
        >
          <button
            type="button"
            :disabled="!pagination.hasPrevious"
            aria-label="이전 페이지"
            @click="loadExecutions(currentPage - 1)"
          >
            <AppIcon name="back" :size="15" />
          </button>
          <button
            v-for="page in pageButtons"
            :key="page"
            type="button"
            :class="{ 'is-active': page === currentPage }"
            :aria-current="page === currentPage ? 'page' : undefined"
            @click="loadExecutions(page)"
          >
            {{ page + 1 }}
          </button>
          <button
            type="button"
            :disabled="!pagination.hasNext"
            aria-label="다음 페이지"
            @click="loadExecutions(currentPage + 1)"
          >
            <AppIcon name="chevron" :size="15" />
          </button>
        </nav>
      </template>
    </section>
  </AdminLayout>
</template>
