<script setup>
import { computed, onMounted, ref } from 'vue'
import { getAdminDashboard } from '../api/adminDashboardApi'
import AdminDashboardState from '../components/admin/AdminDashboardState.vue'
import AdminErrorSummary from '../components/admin/AdminErrorSummary.vue'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AdminMetricCard from '../components/admin/AdminMetricCard.vue'
import AdminProductSummary from '../components/admin/AdminProductSummary.vue'
import AdminStatusBadge from '../components/admin/AdminStatusBadge.vue'
import SignupTrendChart from '../components/admin/SignupTrendChart.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import '../assets/css/admin-dashboard.css'

const dashboard = ref(null)
const viewState = ref('loading')
const errorMessage = ref('')
const isRefreshing = ref(false)

const numberFormatter = new Intl.NumberFormat('ko-KR')
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const consultationAvailable = computed(() => dashboard.value?.consultations?.available === true)
const fastApiAvailable = computed(() => dashboard.value?.fastApi?.available === true)

const fastApiStatus = computed(() => {
  if (!fastApiAvailable.value) {
    return {
      status: 'warning',
      label: '미수집',
      description: '모니터링 데이터가 수집되지 않았습니다.',
      icon: 'info',
    }
  }

  const status = dashboard.value?.fastApi?.status
  if (status === 'healthy') {
    return {
      status: 'healthy',
      label: '정상',
      description: '안정적으로 응답 중',
      icon: 'check',
    }
  }
  if (status === 'warning') {
    return {
      status: 'warning',
      label: '주의',
      description: '응답 지연 확인 필요',
      icon: 'info',
    }
  }
  return { status: 'danger', label: '위험', description: '즉시 점검 필요', icon: 'info' }
})

const formattedUpdatedAt = computed(() =>
  dashboard.value?.updatedAt ? dateTimeFormatter.format(new Date(dashboard.value.updatedAt)) : '-',
)
const formattedProductDate = computed(() =>
  dashboard.value?.products?.available && dashboard.value.products.asOfDate
    ? dateFormatter.format(new Date(`${dashboard.value.products.asOfDate}T00:00:00`))
    : '-',
)
const simulationSaveRate = computed(() => {
  const rate = Number(dashboard.value?.simulations?.saveRate)
  return Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 100) : 0
})

function hasValue(value) {
  return value !== null && value !== undefined
}

function formatNumber(value) {
  return hasValue(value) ? numberFormatter.format(value) : '-'
}

function formatRate(value) {
  const rate = Number(value)
  return Number.isFinite(rate) ? rate.toFixed(1) : '-'
}

async function loadDashboard({ refresh = false } = {}) {
  if (refresh) isRefreshing.value = true
  else viewState.value = 'loading'
  errorMessage.value = ''

  try {
    dashboard.value = await getAdminDashboard()
    viewState.value = dashboard.value ? 'success' : 'empty'
  } catch (error) {
    dashboard.value = null
    viewState.value = 'error'
    errorMessage.value = error.message || '대시보드 데이터를 불러오지 못했습니다.'
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => loadDashboard())
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-dashboard-title">
      <div>
        <h1 id="admin-dashboard-title">서비스 운영 대시보드</h1>
        <p>미리줌 서비스의 핵심 지표와 시스템 상태를 한눈에 확인하세요.</p>
      </div>
      <div class="admin-dashboard-actions">
        <span class="admin-updated-at">
          <AppIcon name="clock" :size="16" />
          마지막 갱신 {{ formattedUpdatedAt }}
        </span>
        <button
          class="admin-refresh-button"
          type="button"
          :disabled="isRefreshing || viewState === 'loading'"
          aria-label="대시보드 데이터 새로고침"
          @click="loadDashboard({ refresh: true })"
        >
          <AppIcon name="refresh" :size="18" :class="{ 'is-spinning': isRefreshing }" />
          {{ isRefreshing ? '갱신 중' : '새로고침' }}
        </button>
      </div>
    </section>

    <AdminDashboardState
      v-if="viewState !== 'success'"
      :state="viewState"
      :message="errorMessage"
      @retry="loadDashboard()"
    />

    <template v-else>
      <section class="admin-metrics" aria-label="핵심 운영 지표">
        <AdminMetricCard
          title="오늘 신규 가입자"
          :value="formatNumber(dashboard.signups.today)"
          unit="명"
          description="오늘 00시부터 현재까지"
          icon="user"
          tone="yellow"
        />
        <AdminMetricCard
          title="최근 7일 신규 가입자"
          :value="formatNumber(dashboard.signups.last7Days)"
          unit="명"
          description="최근 7일 누적 가입자"
          icon="chart"
        />
        <AdminMetricCard
          title="AI 상담 요청 건수"
          :value="consultationAvailable ? formatNumber(dashboard.consultations.requests) : '-'"
          :unit="consultationAvailable ? '건' : ''"
          :description="
            consultationAvailable
              ? `성공 ${formatNumber(dashboard.consultations.successes)}건 · 실패 ${formatNumber(dashboard.consultations.failures)}건`
              : '상담 요청 데이터가 수집되지 않았습니다.'
          "
          icon="chat"
          tone="navy"
        />
        <AdminMetricCard
          title="AI 상담 성공률"
          :value="consultationAvailable ? formatRate(dashboard.consultations.successRate) : '-'"
          :unit="consultationAvailable ? '%' : ''"
          :description="
            consultationAvailable
              ? '전체 상담 요청 대비 성공 비율'
              : '상담 성공률 데이터가 수집되지 않았습니다.'
          "
          icon="check"
          tone="green"
        />
      </section>

      <div class="admin-dashboard-grid admin-dashboard-grid--top">
        <SignupTrendChart :items="dashboard.signups.trend" />

        <section class="admin-panel fastapi-status" aria-labelledby="fastapi-status-title">
          <div class="admin-panel__heading">
            <div>
              <h2 id="fastapi-status-title">FastAPI 상태</h2>
            </div>
            <AdminStatusBadge :status="fastApiStatus.status" :label="fastApiStatus.label" />
          </div>
          <div class="fastapi-status__metric">
            <span>평균 응답 시간</span>
            <p>
              <strong>{{ formatNumber(dashboard.fastApi.averageResponseMs) }}</strong>
              <template v-if="fastApiAvailable && hasValue(dashboard.fastApi.averageResponseMs)">
                ms
              </template>
            </p>
          </div>
          <div class="fastapi-status__notice" :class="`is-${fastApiStatus.status}`">
            <AppIcon :name="fastApiStatus.icon" :size="18" />
            <span>
              <strong>{{ fastApiStatus.label }}</strong>
              {{ fastApiStatus.description }}
            </span>
          </div>
        </section>
      </div>

      <div class="admin-dashboard-grid admin-dashboard-grid--bottom">
        <AdminErrorSummary :errors="dashboard.errors" />

        <section class="admin-panel simulation-summary" aria-labelledby="simulation-summary-title">
          <div class="admin-panel__heading">
            <div>
              <h2 id="simulation-summary-title">시뮬레이션 현황</h2>
            </div>
            <AppIcon name="calculator" :size="22" />
          </div>
          <div class="simulation-summary__metrics">
            <div>
              <span>실행 건수</span>
              <strong>{{ formatNumber(dashboard.simulations.runs) }}<small>건</small></strong>
            </div>
            <div>
              <span>저장 건수</span>
              <strong>{{ formatNumber(dashboard.simulations.saves) }}<small>건</small></strong>
            </div>
          </div>
          <div class="simulation-summary__rate">
            <div>
              <span>저장 전환율</span>
              <strong>{{ formatRate(dashboard.simulations.saveRate) }}%</strong>
            </div>
            <div
              class="simulation-summary__track"
              role="img"
              :aria-label="`시뮬레이션 저장 전환율 ${formatRate(dashboard.simulations.saveRate)}%`"
            >
              <span :style="{ width: `${simulationSaveRate}%` }" />
            </div>
          </div>
        </section>

        <AdminProductSummary
          :products="dashboard.products"
          :formatted-date="formattedProductDate"
        />
      </div>
    </template>
  </AdminLayout>
</template>
