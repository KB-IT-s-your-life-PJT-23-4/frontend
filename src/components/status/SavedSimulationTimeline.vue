<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { formatCompactWon } from '../../utils/finance'

const props = defineProps({
  plan: { type: Object, required: true },
  detail: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'retry'])

function dateText(value) {
  if (!value) return ''
  return String(value).slice(0, 10).replaceAll('-', '.')
}

function dateKey(value) {
  return dateText(value).replaceAll('.', '-')
}

const selectedResult = computed(() => {
  const resultId = Number(props.detail?.selection?.resultId)
  return (
    props.detail?.results?.find((result) => Number(result.resultId) === resultId) ??
    props.detail?.results?.find(
      (result) => result.scenarioType === props.detail?.selectedScenarioType,
    ) ??
    null
  )
})

const selectedPortfolio = computed(() => {
  const portfolioId = Number(props.detail?.selection?.selectedPortfolioId)
  return (
    selectedResult.value?.portfolios?.find(
      (portfolio) => Number(portfolio.portfolioId) === portfolioId,
    ) ??
    selectedResult.value?.portfolios?.find((portfolio) => portfolio.selected) ??
    null
  )
})

const selectedProducts = computed(() => {
  const selectionIds = new Set(
    (props.detail?.selection?.selectedProducts ?? []).map((product) =>
      Number(product.simulationProductId),
    ),
  )
  const products = selectedPortfolio.value?.products ?? []
  const selected = products.filter(
    (product) => product.selected || selectionIds.has(Number(product.id)),
  )

  return selected.length ? selected : products
})

const selectedProductNames = computed(() =>
  [...new Set(selectedProducts.value.map((product) => product.name).filter(Boolean))].join(' · '),
)

const timelineEvents = computed(() => {
  if (!props.detail) {
    return [
      {
        id: 'gift-fallback',
        type: 'gift',
        icon: 'wallet',
        date: dateText(props.plan.plannedGiftDate),
        title: '증여 예정',
        value: formatCompactWon(props.plan.amount),
        description: props.plan.productName ? `${props.plan.productName} 운용 시작` : '',
      },
      {
        id: 'end-fallback',
        type: 'end',
        icon: 'calendar',
        date: dateText(props.plan.giftDate),
        title: '운용 마무리',
        value: props.plan.expectedFutureValue
          ? formatCompactWon(props.plan.expectedFutureValue)
          : '',
        description: '예상 총 금액',
      },
    ].filter((event) => event.date)
  }

  const events = []
  const schedule = selectedResult.value?.giftSchedule ?? []

  schedule.forEach((tranche, index) => {
    events.push({
      id: `gift-${tranche.order}-${tranche.date}`,
      type: 'gift',
      icon: 'wallet',
      date: dateText(tranche.date),
      title: schedule.length > 1 ? `${index + 1}차 증여 예정` : '증여 예정',
      value: formatCompactWon(tranche.amount),
      description: selectedProductNames.value
        ? `선택 상품 운용 시작 · ${selectedProductNames.value}`
        : '선택 상품 운용 시작',
    })
  })

  const reinvestmentByDate = new Map()
  selectedProducts.value.forEach((product) => {
    ;(product.reinvestmentSchedule ?? []).forEach((scheduleItem) => {
      const date = dateText(scheduleItem.renewalDate)
      if (!date) return
      if (!reinvestmentByDate.has(date)) reinvestmentByDate.set(date, new Set())
      reinvestmentByDate.get(date).add(product.name)
    })
  })
  reinvestmentByDate.forEach((productNames, date) => {
    events.push({
      id: `reinvestment-${date}`,
      type: 'reinvestment',
      icon: 'refresh',
      date,
      title: '상품 재가입 예정',
      value: '',
      description: [...productNames].filter(Boolean).join(' · '),
    })
  })

  const holdingByDate = new Map()
  selectedProducts.value.forEach((product) => {
    ;(product.cashHoldingSchedule ?? []).forEach((holding) => {
      const date = dateText(holding.holdingStartDate)
      if (!date) return
      const current = holdingByDate.get(date) ?? { amount: 0, productNames: new Set() }
      current.amount += Number(holding.holdingAmount ?? 0)
      current.productNames.add(product.name)
      holdingByDate.set(date, current)
    })
  })
  holdingByDate.forEach((holding, date) => {
    events.push({
      id: `holding-${date}`,
      type: 'waiting',
      icon: 'clock',
      date,
      title: '운용 대기 시작',
      value: holding.amount ? formatCompactWon(holding.amount) : '',
      description: '가입기간이 부족한 잔여기간은 원금 상태로 반영',
    })
  })

  const endDate = dateText(
    props.detail.evaluationDate ?? props.detail.endDate ?? props.plan.giftDate,
  )
  if (endDate) {
    const expectedFutureValue = Number(
      props.detail.selection?.expectedFutureValue ??
        selectedPortfolio.value?.expectedFutureValue ??
        props.plan.expectedFutureValue ??
        0,
    )
    events.push({
      id: `end-${endDate}`,
      type: 'end',
      icon: 'calendar',
      date: endDate,
      title: '운용 마무리',
      value: expectedFutureValue ? formatCompactWon(expectedFutureValue) : '',
      description: `${props.detail.years ?? ''}년 후 예상 총 금액`.trim(),
    })
  }

  return events.sort((first, second) => {
    const dateOrder = dateKey(first.date).localeCompare(dateKey(second.date))
    if (dateOrder !== 0) return dateOrder
    const typeOrder = { gift: 0, reinvestment: 1, waiting: 2, end: 3 }
    return (typeOrder[first.type] ?? 9) - (typeOrder[second.type] ?? 9)
  })
})

const giftCount = computed(
  () => timelineEvents.value.filter((event) => event.type === 'gift').length,
)
const reinvestmentCount = computed(
  () => timelineEvents.value.filter((event) => event.type === 'reinvestment').length,
)
const summaryText = computed(() => {
  if (!props.detail) return '저장한 계획의 증여·운용 일정을 확인해 보세요'
  const summary = [`증여 ${giftCount.value}회`]
  if (reinvestmentCount.value) summary.push(`상품 재가입 ${reinvestmentCount.value}회`)
  return summary.join(' · ')
})
</script>

<template>
  <section class="saved-plan-timeline">
    <button
      class="saved-plan-timeline-toggle"
      type="button"
      :aria-expanded="open"
      @click="emit('toggle')"
    >
      <span class="saved-plan-timeline-toggle-icon">
        <AppIcon name="calendar" :size="18" />
      </span>
      <span class="saved-plan-timeline-toggle-copy">
        <strong>증여·상품 운용 예정 일정</strong>
        <small>{{ summaryText }}</small>
      </span>
      <span class="saved-plan-timeline-chevron" :class="{ open }">
        <AppIcon name="chevron" :size="15" />
      </span>
    </button>

    <div v-if="open" class="saved-plan-timeline-panel">
      <div v-if="loading" class="saved-plan-timeline-state" aria-live="polite">
        <span class="saved-plan-timeline-spinner" />
        저장한 일정을 불러오고 있어요.
      </div>

      <div v-else-if="error" class="saved-plan-timeline-state error" role="alert">
        <span>{{ error }}</span>
        <button type="button" @click="emit('retry')">다시 불러오기</button>
      </div>

      <ol v-else class="saved-plan-timeline-list">
        <li
          v-for="event in timelineEvents"
          :key="event.id"
          class="saved-plan-timeline-item"
          :class="event.type"
        >
          <span class="saved-plan-timeline-dot">
            <AppIcon :name="event.icon" :size="14" />
          </span>
          <div class="saved-plan-timeline-event">
            <time>{{ event.date }}</time>
            <div class="saved-plan-timeline-event-heading">
              <strong>{{ event.title }}</strong>
              <b v-if="event.value">{{ event.value }}</b>
            </div>
            <p v-if="event.description">{{ event.description }}</p>
          </div>
        </li>
      </ol>

      <p v-if="!loading && !error" class="saved-plan-timeline-notice">
        <AppIcon name="info" :size="14" />
        저장 당시의 증여 계획과 상품 조건을 기준으로 한 예정 일정이에요.
      </p>
    </div>
  </section>
</template>
