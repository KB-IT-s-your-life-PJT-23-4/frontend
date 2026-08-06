<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const route = useRoute()
const router = useRouter()
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

const scenario = computed(() => {
  const state = route.query.state
  return ['error', 'empty'].includes(state) ? state : 'success'
})

const fastApiStatus = computed(() => {
  const status = dashboard.value?.fastApi.status
  if (status === 'healthy')
    return { status: 'healthy', label: '정상', description: '안정적으로 응답 중' }
  if (status === 'warning')
    return { status: 'warning', label: '주의', description: '응답 지연 확인 필요' }
  return { status: 'danger', label: '위험', description: '즉시 점검 필요' }
})

const formattedUpdatedAt = computed(() =>
  dashboard.value?.updatedAt ? dateTimeFormatter.format(new Date(dashboard.value.updatedAt)) : '-',
)
const formattedProductDate = computed(() =>
  dashboard.value?.products.asOfDate
    ? dateFormatter.format(new Date(`${dashboard.value.products.asOfDate}T00:00:00`))
    : '-',
)

function formatNumber(value) {
  return numberFormatter.format(value ?? 0)
}

async function loadDashboard({ refresh = false } = {}) {
  if (refresh) isRefreshing.value = true
  else viewState.value = 'loading'
  errorMessage.value = ''

  try {
    dashboard.value = await getAdminDashboard({ scenario: scenario.value })
    viewState.value = dashboard.value ? 'success' : 'empty'
  } catch (error) {
    dashboard.value = null
    viewState.value = 'error'
    errorMessage.value = error.message || '알 수 없는 오류가 발생했습니다.'
  } finally {
    isRefreshing.value = false
  }
}

async function retryDefaultState() {
  if (scenario.value !== 'success') {
    const query = { ...route.query }
    delete query.state
    await router.replace({ query })
    return
  }
  await loadDashboard()
}

watch(scenario, () => loadDashboard())
onMounted(() => loadDashboard())
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-dashboard-title">
      <div>
        <span class="admin-dashboard-heading__eyebrow">OVERVIEW</span>
        <h1 id="admin-dashboard-title">서비스 운영 대시보드</h1>
        <p>미리줌 서비스의 핵심 지표와 시스템 상태를 한눈에 확인하세요.</p>
      </div>
      <div class="admin-dashboard-actions">
        <span class="admin-source-badge"><span aria-hidden="true" /> 데모 데이터</span>
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
      @retry="retryDefaultState"
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
          title="AI 상담 요청"
          :value="formatNumber(dashboard.consultations.requests)"
          unit="건"
          :description="`성공 ${formatNumber(dashboard.consultations.successes)}건 · 실패 ${formatNumber(dashboard.consultations.failures)}건`"
          icon="chat"
          tone="navy"
        />
        <AdminMetricCard
          title="AI 상담 성공률"
          :value="dashboard.consultations.successRate.toFixed(1)"
          unit="%"
          description="전체 상담 요청 대비 성공 비율"
          icon="check"
          tone="green"
        />
      </section>

      <div class="admin-dashboard-grid admin-dashboard-grid--top">
        <SignupTrendChart :items="dashboard.signups.trend" />

        <section class="admin-panel fastapi-status" aria-labelledby="fastapi-status-title">
          <div class="admin-panel__heading">
            <div>
              <span>SYSTEM HEALTH</span>
              <h2 id="fastapi-status-title">FastAPI 상태</h2>
            </div>
            <AdminStatusBadge :status="fastApiStatus.status" :label="fastApiStatus.label" />
          </div>
          <div class="fastapi-status__metric">
            <span>평균 응답 시간</span>
            <p>
              <strong>{{ formatNumber(dashboard.fastApi.averageResponseMs) }}</strong> ms
            </p>
          </div>
          <div class="fastapi-status__notice" :class="`is-${fastApiStatus.status}`">
            <AppIcon name="check" :size="18" />
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
              <span>SIMULATION</span>
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
              <strong>{{ dashboard.simulations.saveRate.toFixed(1) }}%</strong>
            </div>
            <div
              class="simulation-summary__track"
              role="img"
              :aria-label="`시뮬레이션 저장 전환율 ${dashboard.simulations.saveRate.toFixed(1)}%`"
            >
              <span :style="{ width: `${dashboard.simulations.saveRate}%` }" />
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
