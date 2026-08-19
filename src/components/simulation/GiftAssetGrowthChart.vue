<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { calculatePortfolioValue, formatCompactWon } from '../../utils/finance'
import '../../assets/css/simulation/gift-asset-growth-chart.css'

const CHART = {
  width: 760,
  height: 300,
  left: 76,
  right: 24,
  top: 24,
  bottom: 48,
}
const plotWidth = CHART.width - CHART.left - CHART.right
const plotHeight = CHART.height - CHART.top - CHART.bottom

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  recommendedScenario: {
    type: Object,
    required: true,
  },
  selectedProducts: {
    type: Object,
    default: () => ({}),
  },
  portfolioProfile: {
    type: String,
    default: 'BALANCED',
  },
})

function parseDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return new Date(value)
  const normalized = String(value ?? '').replaceAll('.', '-')
  const parsed = new Date(`${normalized}T00:00:00`)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addYears(date, years) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function dayBefore(date) {
  const previous = new Date(date)
  previous.setDate(previous.getDate() - 1)
  return previous
}

function defaultProducts(portfolio) {
  const grouped = new Map()
  ;(portfolio?.products ?? []).forEach((product) => {
    const current = grouped.get(product.type)
    if (!current || Number(product.expectedFutureValue) > Number(current.expectedFutureValue)) {
      grouped.set(product.type, product)
    }
  })
  return Object.fromEntries(grouped)
}

function allocationDistance(first = {}, second = {}) {
  return ['DEPOSIT', 'SAVINGS', 'ETF'].reduce(
    (total, type) => total + Math.abs(Number(first[type] ?? 0) - Number(second[type] ?? 0)),
    0,
  )
}

const alternativeScenario = computed(() =>
  props.result.results?.find((item) => item.resultId !== props.recommendedScenario.resultId),
)

const recommendedPortfolio = computed(() => {
  const portfolios = props.recommendedScenario.portfolios ?? []
  return (
    portfolios.find((item) => item.portfolioType === props.portfolioProfile) ??
    portfolios.find((item) => item.recommended) ??
    portfolios[0]
  )
})

const alternativePortfolio = computed(() => {
  const portfolios = alternativeScenario.value?.portfolios ?? []
  const exact = portfolios.find((item) => item.portfolioType === props.portfolioProfile)
  if (exact) return exact
  const targetAllocation = recommendedPortfolio.value?.allocation ?? {}
  return [...portfolios].sort(
    (first, second) =>
      allocationDistance(first.allocation, targetAllocation) -
      allocationDistance(second.allocation, targetAllocation),
  )[0]
})

const recommendedAllocation = computed(() => recommendedPortfolio.value?.allocation ?? {})
const alternativeAllocation = computed(() => {
  if (props.portfolioProfile === 'CUSTOM') return recommendedAllocation.value
  return alternativePortfolio.value?.allocation ?? {}
})
const recommendedProducts = computed(() => {
  const selected = Object.fromEntries(
    Object.entries(props.selectedProducts ?? {}).filter(([, product]) => Boolean(product)),
  )
  return Object.keys(selected).length ? selected : defaultProducts(recommendedPortfolio.value)
})
const alternativeProducts = computed(() => defaultProducts(alternativePortfolio.value))

const startDate = computed(() => {
  const dates = (props.result.results ?? [])
    .flatMap((scenario) => scenario.giftSchedule ?? [])
    .map((item) => parseDate(item.date))
    .filter(Boolean)
  return dates.length ? new Date(Math.min(...dates.map((date) => date.getTime()))) : new Date()
})
const finishDate = computed(
  () =>
    parseDate(props.result.evaluationDate ?? props.result.endDate) ??
    addYears(startDate.value, props.result.years),
)

const chartDates = computed(() => {
  const points = new Map()
  const add = (value) => {
    const date = parseDate(value)
    if (!date || date < startDate.value || date > finishDate.value) return
    points.set(dateKey(date), date)
  }
  add(startDate.value)
  add(finishDate.value)
  for (let year = 1; year <= Number(props.result.years ?? 0); year += 1) {
    add(addYears(startDate.value, year))
  }
  ;(props.result.results ?? []).forEach((scenario) =>
    (scenario.giftSchedule ?? []).forEach((item) => add(item.date)),
  )
  Object.values(recommendedProducts.value).forEach((product) =>
    (product.reinvestmentSchedule ?? []).forEach((item) => add(item.renewalDate)),
  )
  return [...points.values()].sort((first, second) => first - second)
})

function productsForScenario(scenario) {
  return scenario?.resultId === props.recommendedScenario.resultId
    ? recommendedProducts.value
    : alternativeProducts.value
}

function allocationForScenario(scenario) {
  return scenario?.resultId === props.recommendedScenario.resultId
    ? recommendedAllocation.value
    : alternativeAllocation.value
}

function scenarioValueAt(scenario, date) {
  if (!scenario) return 0
  return calculatePortfolioValue({
    schedule: scenario.giftSchedule ?? [],
    allocation: allocationForScenario(scenario),
    selectedProducts: productsForScenario(scenario),
    years: props.result.years,
    startDate: startDate.value,
    endDate: date,
  })
}

function principalAt(date) {
  return (props.recommendedScenario.giftSchedule ?? []).reduce((total, item) => {
    const giftDate = parseDate(item.date)
    return giftDate && giftDate <= date ? total + Number(item.investmentAmount ?? 0) : total
  }, 0)
}

function hasGiftOn(scenario, date) {
  const target = dateKey(date)
  return (scenario?.giftSchedule ?? []).some((item) => {
    const giftDate = parseDate(item.date)
    return giftDate && dateKey(giftDate) === target
  })
}

function isChartStartDate(date) {
  return dateKey(date) === dateKey(startDate.value)
}

function scenarioSeries(scenario) {
  return chartDates.value.flatMap((date) => {
    const point = { date, value: scenarioValueAt(scenario, date) }
    if (!hasGiftOn(scenario, date) || isChartStartDate(date)) return [point]
    return [{ date, value: scenarioValueAt(scenario, dayBefore(date)) }, point]
  })
}

function principalSeries() {
  return chartDates.value.flatMap((date) => {
    const point = { date, value: principalAt(date) }
    if (!hasGiftOn(props.recommendedScenario, date) || isChartStartDate(date)) return [point]
    return [{ date, value: principalAt(dayBefore(date)) }, point]
  })
}

const rawSeries = computed(() => ({
  recommended: scenarioSeries(props.recommendedScenario),
  principal: principalSeries(),
  alternative: scenarioSeries(alternativeScenario.value),
}))
const maxValue = computed(() =>
  Math.max(
    1,
    ...Object.values(rawSeries.value).flatMap((series) => series.map((point) => point.value)),
  ),
)
const chartDuration = computed(() =>
  Math.max(1, finishDate.value.getTime() - startDate.value.getTime()),
)

function xPosition(date) {
  return (
    CHART.left + ((date.getTime() - startDate.value.getTime()) / chartDuration.value) * plotWidth
  )
}

function yPosition(value) {
  return CHART.top + plotHeight - (Number(value ?? 0) / maxValue.value) * plotHeight
}

function pathFor(series) {
  return series
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${xPosition(point.date)} ${yPosition(point.value)}`,
    )
    .join(' ')
}

const series = computed(() =>
  Object.fromEntries(
    Object.entries(rawSeries.value).map(([key, points]) => [
      key,
      { points, path: pathFor(points) },
    ]),
  ),
)
const comparisonAreaPath = computed(() => {
  const recommendedPoints = chartDates.value.map((date) => ({
    date,
    value: scenarioValueAt(props.recommendedScenario, date),
  }))
  const alternativePoints = chartDates.value.map((date) => ({
    date,
    value: scenarioValueAt(alternativeScenario.value, date),
  }))
  if (!recommendedPoints.length || !alternativePoints.length) return ''

  const forward = recommendedPoints
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${xPosition(point.date)} ${yPosition(point.value)}`,
    )
    .join(' ')
  const backward = [...alternativePoints]
    .reverse()
    .map((point) => `L ${xPosition(point.date)} ${yPosition(point.value)}`)
    .join(' ')
  return `${forward} ${backward} Z`
})
const yTicks = computed(() =>
  Array.from({ length: 3 }, (_, index) => {
    const ratio = index / 2
    const value = maxValue.value * (1 - ratio)
    return { value, y: CHART.top + plotHeight * ratio }
  }),
)
const xTicks = computed(() => {
  const dates = chartDates.value
  if (dates.length <= 4) return dates
  return [0, 1 / 3, 2 / 3, 1].map((ratio) => {
    const timestamp = startDate.value.getTime() + chartDuration.value * ratio
    return new Date(timestamp)
  })
})

const chartEvents = computed(() => {
  const events = []
  ;(props.recommendedScenario.giftSchedule ?? []).forEach((item) => {
    const date = parseDate(item.date)
    if (!date || date > finishDate.value) return
    events.push({
      key: `gift-${item.order}-${item.date}`,
      kind: 'gift',
      date,
      title: item.label,
      detail: formatCompactWon(item.amount),
      value: scenarioValueAt(props.recommendedScenario, date),
    })
  })

  const reinvestmentsByDate = new Map()
  Object.values(recommendedProducts.value).forEach((product) =>
    (product.reinvestmentSchedule ?? []).forEach((item) => {
      const date = parseDate(item.renewalDate)
      if (!date || date > finishDate.value) return
      const key = dateKey(date)
      const current = reinvestmentsByDate.get(key) ?? { date, productNames: new Set() }
      current.productNames.add(product.name)
      reinvestmentsByDate.set(key, current)
    }),
  )
  reinvestmentsByDate.forEach(({ date, productNames }, key) => {
    const names = [...productNames]
    events.push({
      key: `renewal-${key}`,
      kind: 'reinvestment',
      date,
      title: '상품 재가입',
      detail:
        names.length <= 1 ? (names[0] ?? '선택 상품') : `${names[0]} 외 ${names.length - 1}개`,
      value: scenarioValueAt(props.recommendedScenario, date),
    })
  })
  return events
})
const recommendedFinalValue = computed(() => series.value.recommended.points.at(-1)?.value ?? 0)
const alternativeFinalValue = computed(() => series.value.alternative.points.at(-1)?.value ?? 0)
const finalValueDifference = computed(() =>
  Math.max(0, recommendedFinalValue.value - alternativeFinalValue.value),
)
const finalValueDifferenceRate = computed(() =>
  alternativeFinalValue.value > 0
    ? (finalValueDifference.value / alternativeFinalValue.value) * 100
    : 0,
)
const recommendedEndPoint = computed(() => ({
  x: xPosition(finishDate.value),
  y: yPosition(recommendedFinalValue.value),
}))
const alternativeEndPoint = computed(() => ({
  x: xPosition(finishDate.value),
  y: yPosition(alternativeFinalValue.value),
}))
const outsideSchedule = computed(() =>
  (props.recommendedScenario.giftSchedule ?? []).filter((item) => !item.withinPeriod),
)

function scenarioLabel(scenario) {
  return scenario?.scenarioType === 'IMMEDIATE' ? '지금 전액 증여' : '공제 활용 분할 증여'
}

function tickYear(date) {
  return `${date.getFullYear()}년`
}

function eventDateLabel(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replaceAll('. ', '.')
    .replace(/\.$/, '')
}

function eventPositionClass(event) {
  const horizontalRatio = (xPosition(event.date) - CHART.left) / Math.max(1, plotWidth)
  return {
    'is-near-start': horizontalRatio <= 0.12,
    'is-near-end': horizontalRatio >= 0.88,
    'is-near-bottom': yPosition(event.value) >= CHART.top + plotHeight * 0.72,
  }
}

function eventPositionStyle(event) {
  return {
    left: `${(xPosition(event.date) / CHART.width) * 100}%`,
    top: `${(yPosition(event.value) / CHART.height) * 100}%`,
  }
}
</script>

<template>
  <section class="gift-growth-chart-card" aria-labelledby="gift-growth-chart-title">
    <header class="gift-growth-chart-heading">
      <div>
        <h3 id="gift-growth-chart-title">증여 후 자산은 이렇게 변화할 것으로 예상돼요</h3>
      </div>
    </header>

    <div class="gift-growth-chart-legend" aria-label="그래프 범례">
      <span class="is-recommended">추천 플랜 예상 운용 자산</span>
      <span class="is-principal">누적 운용 원금</span>
      <span class="is-alternative">비추천 플랜 예상 운용 자산</span>
    </div>

    <div class="gift-growth-event-legend" aria-label="일정 표시 범례">
      <span class="is-gift">분할 증여일</span>
      <span class="is-reinvestment">상품 재가입일</span>
    </div>

    <div class="gift-growth-chart-scroll">
      <div class="gift-growth-chart-stage">
        <svg
          class="gift-growth-chart"
          :viewBox="`0 0 ${CHART.width} ${CHART.height}`"
          role="img"
          :aria-label="`${scenarioLabel(recommendedScenario)}와 ${scenarioLabel(alternativeScenario)}의 시간별 예상 운용 자산 비교`"
        >
          <g class="gift-growth-grid">
            <g v-for="tick in yTicks" :key="tick.y">
              <line :x1="CHART.left" :x2="CHART.width - CHART.right" :y1="tick.y" :y2="tick.y" />
              <text :x="CHART.left - 12" :y="tick.y + 4" text-anchor="end">
                {{ formatCompactWon(tick.value) }}
              </text>
            </g>
          </g>
          <g class="gift-growth-x-axis">
            <g v-for="date in xTicks" :key="date.getTime()">
              <line
                :x1="xPosition(date)"
                :x2="xPosition(date)"
                :y1="CHART.top + plotHeight"
                :y2="CHART.top + plotHeight + 6"
              />
              <text :x="xPosition(date)" :y="CHART.height - 18" text-anchor="middle">
                {{ tickYear(date) }}
              </text>
            </g>
          </g>
          <path class="gift-growth-comparison-area" :d="comparisonAreaPath" />
          <path class="gift-growth-line is-alternative" :d="series.alternative.path" />
          <path class="gift-growth-line is-principal" :d="series.principal.path" />
          <path class="gift-growth-line is-recommended" :d="series.recommended.path" />
          <line
            v-if="finalValueDifference > 0"
            class="gift-growth-final-gap"
            :x1="recommendedEndPoint.x"
            :x2="alternativeEndPoint.x"
            :y1="recommendedEndPoint.y"
            :y2="alternativeEndPoint.y"
          />
          <circle
            class="gift-growth-endpoint is-alternative"
            :cx="alternativeEndPoint.x"
            :cy="alternativeEndPoint.y"
            r="4"
          />
          <circle
            class="gift-growth-endpoint-halo"
            :cx="recommendedEndPoint.x"
            :cy="recommendedEndPoint.y"
            r="9"
          />
          <circle
            class="gift-growth-endpoint is-recommended"
            :cx="recommendedEndPoint.x"
            :cy="recommendedEndPoint.y"
            r="5"
          />
        </svg>

        <button
          v-for="event in chartEvents"
          :key="event.key"
          type="button"
          class="gift-growth-event-marker"
          :class="[`is-${event.kind}`, eventPositionClass(event)]"
          :style="eventPositionStyle(event)"
          :aria-label="`${eventDateLabel(event.date)} ${event.title} ${event.detail}`"
        >
          <AppIcon :name="event.kind === 'gift' ? 'wallet' : 'refresh'" :size="12" />
          <span class="gift-growth-event-tooltip" aria-hidden="true">
            <strong>{{ event.title }}</strong>
            <span>{{ eventDateLabel(event.date) }}</span>
            <b>{{ event.detail }}</b>
          </span>
        </button>
      </div>
    </div>

    <div class="gift-growth-chart-summary">
      <div class="is-recommended">
        <span>{{ scenarioLabel(recommendedScenario) }}</span>
        <div>
          <strong>{{ formatCompactWon(recommendedFinalValue) }}</strong>
          <small v-if="finalValueDifference > 0">
            +{{ formatCompactWon(finalValueDifference) }}
          </small>
        </div>
      </div>
      <div>
        <span>{{ scenarioLabel(alternativeScenario) }}</span>
        <strong>{{ formatCompactWon(alternativeFinalValue) }}</strong>
      </div>
    </div>

    <p v-if="outsideSchedule.length" class="gift-growth-outside-note">
      {{ outsideSchedule[0].date }} 예정인 {{ formatCompactWon(outsideSchedule[0].amount) }} 증여는
      운용 기간 이후라 그래프의 예상 금액에 포함하지 않았어요.
    </p>
  </section>
</template>
