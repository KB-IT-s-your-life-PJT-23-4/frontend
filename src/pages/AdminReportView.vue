<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  adminReportCapabilities,
  blockReportedUser,
  getAdminReportPage,
  processAdminReport,
} from '../api/adminReportApi'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import '../assets/css/admin-dashboard.css'
import '../assets/css/admin-report.css'

const PAGE_SIZE = 20

const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'OPEN', label: '접수' },
  { value: 'IN_REVIEW', label: '검토 중' },
  { value: 'RESOLVED', label: '처리 완료' },
  { value: 'DISMISSED', label: '기각' },
]

const reportTypeOptions = [
  { value: '', label: '전체 유형' },
  { value: 'JAILBREAK', label: '탈옥 시도' },
  { value: 'OTHER_THRESHOLD', label: '기타 위험 반복' },
]

const reports = ref([])
const pagination = ref(null)
const listState = ref('loading')
const listError = ref('')
const feedbackMessage = ref('')
const selectedReport = ref(null)
const filterForm = ref({ status: '', reportType: '' })
const appliedFilters = ref({ status: '', reportType: '' })

const showProcessingModal = ref(false)
const processingDraft = ref({ status: 'IN_REVIEW', resolutionNote: '', blockUser: false })
const processingError = ref('')
const isProcessing = ref(false)

const currentPage = computed(() => pagination.value?.page ?? 0)
const totalElements = computed(() => pagination.value?.totalElements ?? 0)
const openCountOnPage = computed(
  () => reports.value.filter((report) => report.status === 'OPEN').length,
)
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
  return reportTypeOptions.find((option) => option.value === type)?.label ?? type ?? '-'
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

function reportErrorMessage(error, fallback) {
  if (error?.status === 403) return '신고 관리 권한이 없습니다.'
  if (error?.status === 400) return '신고 조회 조건이 올바르지 않습니다.'
  return error?.message || fallback
}

async function loadReports(page = 0) {
  listState.value = 'loading'
  listError.value = ''
  try {
    const data = await getAdminReportPage({
      page,
      size: PAGE_SIZE,
      status: appliedFilters.value.status,
      reportType: appliedFilters.value.reportType,
    })
    reports.value = Array.isArray(data?.reports) ? data.reports : []
    pagination.value = data?.pagination ?? null
    listState.value = reports.value.length ? 'success' : 'empty'

    if (selectedReport.value) {
      selectedReport.value =
        reports.value.find(
          (report) => report.aiSafetyReportId === selectedReport.value.aiSafetyReportId,
        ) ?? null
    }
  } catch (error) {
    reports.value = []
    pagination.value = null
    selectedReport.value = null
    listState.value = 'error'
    listError.value = reportErrorMessage(error, '신고 목록을 불러오지 못했습니다.')
  }
}

function submitFilters() {
  appliedFilters.value = { ...filterForm.value }
  selectedReport.value = null
  loadReports(0)
}

function resetFilters() {
  filterForm.value = { status: '', reportType: '' }
  appliedFilters.value = { status: '', reportType: '' }
  selectedReport.value = null
  loadReports(0)
}

function selectReport(report) {
  selectedReport.value = report
}

function openProcessing(report = selectedReport.value) {
  if (!report) return
  selectedReport.value = report
  processingDraft.value = {
    status: report.status === 'OPEN' ? 'IN_REVIEW' : report.status,
    resolutionNote: report.resolutionNote ?? '',
    blockUser: false,
  }
  processingError.value = ''
  showProcessingModal.value = true
}

async function submitProcessing() {
  if (!selectedReport.value || !adminReportCapabilities.processReport) return
  if (!processingDraft.value.resolutionNote.trim()) {
    processingError.value = '처리 메모를 입력해주세요.'
    return
  }

  isProcessing.value = true
  processingError.value = ''
  try {
    await processAdminReport(selectedReport.value.aiSafetyReportId, {
      status: processingDraft.value.status,
      resolutionNote: processingDraft.value.resolutionNote.trim(),
    })

    if (processingDraft.value.blockUser) {
      await blockReportedUser(selectedReport.value.userId, {
        reportId: selectedReport.value.aiSafetyReportId,
        reason: processingDraft.value.resolutionNote.trim(),
      })
    }

    showProcessingModal.value = false
    feedbackMessage.value = processingDraft.value.blockUser
      ? '신고 처리와 사용자 차단을 완료했습니다.'
      : '신고 처리를 완료했습니다.'
    await loadReports(currentPage.value)
  } catch (error) {
    processingError.value = reportErrorMessage(error, '신고를 처리하지 못했습니다.')
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => loadReports(0))
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-report-title">
      <div>
        <span class="admin-dashboard-heading__eyebrow">SAFETY REPORT MANAGEMENT</span>
        <h1 id="admin-report-title">신고 관리</h1>
        <p>AI 상담 안전 신고를 검토하고 처리 상태를 관리하세요.</p>
      </div>
      <div class="admin-report-heading-summary">
        <div>
          <span>전체 신고</span><strong>{{ formatNumber(totalElements) }}<small>건</small></strong>
        </div>
        <div>
          <span>현재 페이지 접수</span
          ><strong>{{ formatNumber(openCountOnPage) }}<small>건</small></strong>
        </div>
      </div>
    </section>

    <p v-if="feedbackMessage" class="admin-report-feedback" role="status">
      {{ feedbackMessage }}
      <button type="button" aria-label="알림 닫기" @click="feedbackMessage = ''">×</button>
    </p>

    <section class="admin-panel admin-report-filter" aria-labelledby="admin-report-filter-title">
      <div class="admin-panel__heading">
        <div>
          <span>REPORT FILTER</span>
          <h2 id="admin-report-filter-title">신고 필터</h2>
        </div>
        <AppIcon name="shield" :size="21" />
      </div>
      <form class="admin-report-filter__form" @submit.prevent="submitFilters">
        <label
          ><span>처리 상태</span
          ><select v-model="filterForm.status">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select></label
        >
        <label
          ><span>신고 유형</span
          ><select v-model="filterForm.reportType">
            <option v-for="option in reportTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select></label
        >
        <div class="admin-report-filter__actions">
          <button type="button" class="admin-report-button is-secondary" @click="resetFilters">
            초기화
          </button>
          <button type="submit" class="admin-report-button is-primary">조회</button>
        </div>
      </form>
    </section>

    <div class="admin-report-content-grid">
      <section class="admin-panel admin-report-list" aria-labelledby="admin-report-list-title">
        <div class="admin-panel__heading admin-report-list__heading">
          <div>
            <span>SAFETY REPORTS</span>
            <h2 id="admin-report-list-title">신고 목록</h2>
          </div>
          <p v-if="pagination">
            {{ currentPage + 1 }} / {{ Math.max(pagination.totalPages, 1) }} 페이지
          </p>
        </div>

        <div v-if="listState === 'loading'" class="admin-report-state" aria-live="polite">
          <span class="admin-loading-spinner" aria-hidden="true" /><strong
            >신고 목록을 불러오는 중입니다.</strong
          >
        </div>
        <div v-else-if="listState === 'error'" class="admin-report-state is-error" role="alert">
          <AppIcon name="info" :size="27" /><strong>신고 목록을 불러오지 못했습니다.</strong>
          <p>{{ listError }}</p>
          <button type="button" @click="loadReports(currentPage)">다시 시도</button>
        </div>
        <div v-else-if="listState === 'empty'" class="admin-report-state">
          <AppIcon name="shield" :size="29" /><strong>조건에 맞는 신고가 없습니다.</strong>
          <p>필터 조건을 변경해 다시 조회해보세요.</p>
        </div>

        <template v-else>
          <div class="admin-report-table-wrap">
            <table class="admin-report-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>유형</th>
                  <th>상태</th>
                  <th>사용자</th>
                  <th>발생 횟수</th>
                  <th>접수 시각</th>
                  <th><span class="sr-only">상세</span></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="report in reports"
                  :key="report.aiSafetyReportId"
                  :class="{
                    'is-selected': selectedReport?.aiSafetyReportId === report.aiSafetyReportId,
                  }"
                >
                  <td data-label="ID">
                    <strong>#{{ report.aiSafetyReportId }}</strong>
                  </td>
                  <td data-label="유형">
                    <span
                      class="admin-report-type"
                      :class="`is-${String(report.reportType).toLowerCase().replace('_', '-')}`"
                      >{{ typeLabel(report.reportType) }}</span
                    >
                  </td>
                  <td data-label="상태">
                    <span
                      class="admin-report-status"
                      :class="`is-${String(report.status).toLowerCase().replace('_', '-')}`"
                      >{{ statusLabel(report.status) }}</span
                    >
                  </td>
                  <td data-label="사용자">#{{ report.userId ?? '-' }}</td>
                  <td data-label="발생 횟수">
                    <strong class="admin-report-count"
                      >{{ formatNumber(report.occurrenceCount) }}회</strong
                    >
                  </td>
                  <td data-label="접수 시각">{{ formatDateTime(report.createdAt) }}</td>
                  <td data-label="상세">
                    <button
                      type="button"
                      class="admin-report-detail-button"
                      @click="selectReport(report)"
                    >
                      상세 <AppIcon name="chevron" :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav
            v-if="pagination?.totalPages > 1"
            class="admin-report-pagination"
            aria-label="신고 목록 페이지"
          >
            <button
              type="button"
              :disabled="!pagination.hasPrevious"
              aria-label="이전 페이지"
              @click="loadReports(currentPage - 1)"
            >
              <AppIcon name="back" :size="15" />
            </button>
            <button
              v-for="page in pageButtons"
              :key="page"
              type="button"
              :class="{ 'is-active': page === currentPage }"
              :aria-current="page === currentPage ? 'page' : undefined"
              @click="loadReports(page)"
            >
              {{ page + 1 }}
            </button>
            <button
              type="button"
              :disabled="!pagination.hasNext"
              aria-label="다음 페이지"
              @click="loadReports(currentPage + 1)"
            >
              <AppIcon name="chevron" :size="15" />
            </button>
          </nav>
        </template>
      </section>

      <aside class="admin-panel admin-report-detail" aria-labelledby="admin-report-detail-title">
        <div class="admin-panel__heading">
          <div>
            <span>REPORT DETAIL</span>
            <h2 id="admin-report-detail-title">신고 상세</h2>
          </div>
          <AppIcon name="document" :size="21" />
        </div>
        <div v-if="!selectedReport" class="admin-report-detail__empty">
          <span><AppIcon name="document" :size="28" /></span><strong>신고를 선택해주세요.</strong>
          <p>목록의 상세 버튼을 누르면 신고 정보와 처리 메뉴를 확인할 수 있습니다.</p>
        </div>
        <div v-else class="admin-report-detail__body">
          <div class="admin-report-detail__headline">
            <span
              class="admin-report-type"
              :class="`is-${String(selectedReport.reportType).toLowerCase().replace('_', '-')}`"
              >{{ typeLabel(selectedReport.reportType) }}</span
            >
            <span
              class="admin-report-status"
              :class="`is-${String(selectedReport.status).toLowerCase().replace('_', '-')}`"
              >{{ statusLabel(selectedReport.status) }}</span
            >
          </div>
          <dl>
            <div>
              <dt>신고 ID</dt>
              <dd>#{{ selectedReport.aiSafetyReportId }}</dd>
            </div>
            <div>
              <dt>대상 사용자</dt>
              <dd>#{{ selectedReport.userId ?? '-' }}</dd>
            </div>
            <div>
              <dt>상담 이벤트</dt>
              <dd>#{{ selectedReport.triggerEventId ?? '-' }}</dd>
            </div>
            <div>
              <dt>발생 횟수</dt>
              <dd>{{ formatNumber(selectedReport.occurrenceCount) }}회</dd>
            </div>
            <div>
              <dt>담당 관리자</dt>
              <dd>
                {{
                  selectedReport.assignedAdminId ? `#${selectedReport.assignedAdminId}` : '미배정'
                }}
              </dd>
            </div>
            <div>
              <dt>검토 완료</dt>
              <dd>{{ formatDateTime(selectedReport.reviewedAt) }}</dd>
            </div>
          </dl>
          <section class="admin-report-window" aria-label="위험 감지 집계 기간">
            <span>집계 기간</span
            ><strong>{{ formatDateTime(selectedReport.countWindowStartedAt) }}</strong
            ><small>~ {{ formatDateTime(selectedReport.countWindowEndedAt) }}</small>
          </section>
          <section class="admin-report-note">
            <span>처리 메모</span>
            <p>{{ selectedReport.resolutionNote || '등록된 처리 메모가 없습니다.' }}</p>
          </section>
          <details class="admin-report-key">
            <summary>신고 식별 키</summary>
            <code>{{ selectedReport.reportKey || '-' }}</code>
          </details>
          <button
            type="button"
            class="admin-report-process-button"
            @click="openProcessing(selectedReport)"
          >
            <AppIcon name="check" :size="16" /> 신고 처리
          </button>
          <button
            type="button"
            class="admin-report-block-button"
            :disabled="!adminReportCapabilities.blockUser"
            title="사용자 차단 API 연동 후 활성화됩니다."
          >
            <AppIcon name="shield" :size="16" /> 사용자 차단 <small>API 연동 대기</small>
          </button>
        </div>
      </aside>
    </div>

    <ModalSheet
      :show="showProcessingModal"
      title="신고 처리"
      description="처리 상태와 관리자 메모를 기록하고, 필요한 경우 대상 사용자를 함께 차단합니다."
      @close="showProcessingModal = false"
    >
      <form
        id="admin-report-processing-form"
        class="admin-report-processing-form"
        @submit.prevent="submitProcessing"
      >
        <div v-if="selectedReport" class="admin-report-processing-target">
          <span>처리 대상</span
          ><strong
            >신고 #{{ selectedReport.aiSafetyReportId }} · 사용자 #{{
              selectedReport.userId ?? '-'
            }}</strong
          >
        </div>
        <label
          ><span>처리 상태</span
          ><select v-model="processingDraft.status">
            <option value="IN_REVIEW">검토 중</option>
            <option value="RESOLVED">처리 완료</option>
            <option value="DISMISSED">기각</option>
          </select></label
        >
        <label
          ><span>처리 메모</span
          ><textarea
            v-model="processingDraft.resolutionNote"
            rows="5"
            placeholder="판단 근거와 처리 내용을 입력하세요."
          />
        </label>
        <label
          class="admin-report-block-option"
          :class="{ 'is-disabled': !adminReportCapabilities.blockUser }"
          ><input
            v-model="processingDraft.blockUser"
            type="checkbox"
            :disabled="!adminReportCapabilities.blockUser"
          /><span
            ><strong>신고 처리와 함께 사용자 차단</strong
            ><small>{{
              adminReportCapabilities.blockUser
                ? '대상 계정을 차단합니다.'
                : '사용자 차단 API 연동 후 선택할 수 있습니다.'
            }}</small></span
          ></label
        >
        <div
          v-if="!adminReportCapabilities.processReport"
          class="admin-report-api-notice"
          role="status"
        >
          <AppIcon name="info" :size="18" />
          <p>
            <strong>신고 처리 API 연동 대기</strong
            ><span
              >현재 백엔드는 목록 조회만 제공합니다. 처리 API 추가 후 이 화면에서 바로 연동할 수
              있습니다.</span
            >
          </p>
        </div>
        <p v-if="processingError" class="admin-report-form-error" role="alert">
          {{ processingError }}
        </p>
      </form>
      <template #actions
        ><button
          type="button"
          class="secondary-button"
          :disabled="isProcessing"
          @click="showProcessingModal = false"
        >
          취소</button
        ><button
          type="submit"
          form="admin-report-processing-form"
          class="primary-button"
          :disabled="isProcessing || !adminReportCapabilities.processReport"
          :title="
            !adminReportCapabilities.processReport
              ? '신고 처리 API 연동 후 활성화됩니다.'
              : undefined
          "
        >
          {{
            isProcessing
              ? '처리 중...'
              : adminReportCapabilities.processReport
                ? '처리 저장'
                : '처리 API 연동 대기'
          }}
        </button></template
      >
    </ModalSheet>
  </AdminLayout>
</template>
