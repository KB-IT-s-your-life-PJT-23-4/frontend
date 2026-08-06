<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { formatCompactWon } from '../../utils/finance'
import '../../assets/css/gift-plan-timeline.css'

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
})

const scenario = computed(() => props.recommendedScenario)

function parseDate(value) {
  const parsed = new Date(`${String(value).replaceAll('.', '-')}T00:00:00`)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

const startDate = computed(() => parseDate(scenario.value.giftSchedule[0]?.date) ?? new Date())
const finishDate = computed(() => parseDate(props.result.endDate) ?? new Date())
const visibleSchedule = computed(() =>
  scenario.value.giftSchedule.filter((item) => item.withinPeriod),
)
const outsideSchedule = computed(() =>
  scenario.value.giftSchedule.filter((item) => !item.withinPeriod),
)
const reinvestmentSchedule = computed(() => {
  const grouped = new Map()
  Object.values(props.selectedProducts)
    .filter(Boolean)
    .forEach((product) => {
      ;(product.reinvestmentSchedule ?? []).forEach((item) => {
        const key = item.renewalDate
        if (!key) return
        const entry = grouped.get(key) ?? {
          date: key,
          products: [],
        }
        entry.products.push({
          id: product.id,
          name: product.name,
          type: product.type,
          trancheSequenceNo: item.trancheSequenceNo,
          renewalSequenceNo: item.renewalSequenceNo,
        })
        grouped.set(key, entry)
      })
    })
  return [...grouped.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
})

function getPosition(item) {
  const itemDate = parseDate(item.date)
  if (!itemDate) return 12
  const total = Math.max(1, finishDate.value.getTime() - startDate.value.getTime())
  const elapsed = itemDate.getTime() - startDate.value.getTime()
  return Math.min(78, Math.max(12, 12 + (elapsed / total) * 66))
}
</script>

<template>
  <section class="gift-plan-timeline-card" aria-labelledby="gift-strategy-title">
    <header class="timeline-card-heading">
      <div>
        <div class="timeline-heading-meta">
          <span class="section-kicker">추천 증여 플랜</span>
          <span class="timeline-count">기간 내 {{ visibleSchedule.length }}회 증여</span>
        </div>
        <h2 id="gift-strategy-title">
          {{
            result.exceedsDeduction
              ? `${scenario.scenarioName}가 더 유리해요`
              : '공제 한도 안에서 바로 증여할 수 있어요'
          }}
        </h2>
        <p>
          {{
            result.exceedsDeduction
              ? scenario.description
              : '공제 한도 안에서 전액을 바로 증여하고 운용할 수 있어요.'
          }}
          <br />
          {{ formatCompactWon(result.requestedAmount) }}을 {{ result.years }}년 운용하는 조건으로
          계산했어요.
        </p>
      </div>
    </header>

    <div class="timeline-key-metrics">
      <div>
        <span>예상 세금</span>
        <strong>{{ formatCompactWon(scenario.estimatedPayableTax) }}</strong>
      </div>
      <div v-if="result.donorPaysTax">
        <span>주는 분의 총 준비 금액</span>
        <strong>{{ formatCompactWon(scenario.totalDonorOutflow) }}</strong>
      </div>
    </div>

    <section class="selected-timeline-section" aria-label="추천 전략의 증여 일정">
      <div class="gift-timeline" :aria-label="`${result.years}년 운용 기간 중 증여 일정`">
        <div class="gift-timeline-track">
          <span class="gift-timeline-fill" />
          <div
            v-for="item in visibleSchedule"
            :key="`${item.order}-${item.date}`"
            class="gift-timeline-point"
            :style="{ left: `${getPosition(item)}%` }"
          >
            <span class="timeline-dot"><AppIcon name="wallet" :size="14" /></span>
            <div class="timeline-point-copy">
              <strong>{{ item.label }}</strong>
              <span>{{ item.date }}</span>
              <b>{{ formatCompactWon(item.amount) }}</b>
            </div>
          </div>
          <div class="gift-timeline-end">
            <span class="timeline-end-dot"><AppIcon name="calendar" :size="14" /></span>
            <div>
              <strong>운용 마무리</strong>
              <span>{{ result.endDate }}</span>
            </div>
          </div>
        </div>
      </div>

      <aside v-if="outsideSchedule.length" class="timeline-outside-note">
        <AppIcon name="info" :size="17" />
        <p>
          {{ outsideSchedule[0].date }} 예정인
          {{ formatCompactWon(outsideSchedule[0].amount) }} 증여는 설정한 운용 기간 이후라 예상
          금액에 포함하지 않았어요.
        </p>
      </aside>

      <section
        v-if="reinvestmentSchedule.length"
        class="product-reinvestment-schedule"
        aria-labelledby="product-reinvestment-title"
      >
        <div class="product-reinvestment-heading">
          <span class="product-reinvestment-icon">
            <AppIcon name="refresh" :size="16" />
          </span>
          <div>
            <h3 id="product-reinvestment-title">상품 재가입 일정</h3>
            <p>만기 원리금을 같은 상품에 다시 운용하는 날짜예요.</p>
          </div>
        </div>
        <ol>
          <li v-for="renewal in reinvestmentSchedule" :key="renewal.date">
            <time>{{ renewal.date }}</time>
            <div>
              <span
                v-for="product in renewal.products"
                :key="`${product.id}-${product.trancheSequenceNo}-${product.renewalSequenceNo}`"
                :class="`reinvestment-${String(product.type).toLowerCase()}`"
              >
                {{ product.name }} 재가입
              </span>
            </div>
          </li>
        </ol>
      </section>
    </section>
  </section>
</template>
