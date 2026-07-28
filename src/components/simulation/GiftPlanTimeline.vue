<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { formatCompactWon } from '../../utils/finance'

const props = defineProps({
  scenario: {
    type: Object,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  years: {
    type: Number,
    required: true,
  },
  expectedFutureValue: {
    type: Number,
    required: true,
  },
})

function parseDate(value) {
  const parsed = new Date(`${String(value).replaceAll('.', '-')}T00:00:00`)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

const startDate = computed(() => parseDate(props.scenario.giftSchedule[0]?.date) ?? new Date())
const finishDate = computed(() => parseDate(props.endDate) ?? new Date())
const visibleSchedule = computed(() =>
  props.scenario.giftSchedule.filter((item) => item.withinPeriod),
)
const outsideSchedule = computed(() =>
  props.scenario.giftSchedule.filter((item) => !item.withinPeriod),
)

function getPosition(item) {
  const itemDate = parseDate(item.date)
  if (!itemDate) return 12
  const total = Math.max(1, finishDate.value.getTime() - startDate.value.getTime())
  const elapsed = itemDate.getTime() - startDate.value.getTime()
  return Math.min(78, Math.max(12, 12 + (elapsed / total) * 66))
}
</script>

<template>
  <section class="gift-plan-timeline-card">
    <div class="timeline-card-heading">
      <div>
        <span class="section-kicker">GIFT ROADMAP</span>
        <h2>증여 일정 한눈에 보기</h2>
        <p>{{ scenario.scenarioName }} 전략의 자금 이동을 시간순으로 정리했어요.</p>
      </div>
      <span class="timeline-count">기간 내 {{ visibleSchedule.length }}회</span>
    </div>

    <div class="gift-timeline" :aria-label="`${years}년 운용 기간 중 증여 일정`">
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
            <span>{{ endDate }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="timeline-future-value">
      <div>
        <span>{{ years }}년 뒤 예상 금액</span>
        <strong>{{ formatCompactWon(expectedFutureValue) }}</strong>
      </div>
      <p>선택 상품의 현재 수익률 가정으로 계산한 참고 금액이에요.</p>
    </div>

    <aside v-if="outsideSchedule.length" class="timeline-outside-note">
      <AppIcon name="info" :size="17" />
      <p>
        {{ outsideSchedule[0].date }} 예정인
        {{ formatCompactWon(outsideSchedule[0].amount) }} 증여는 설정한 운용 기간 이후라
        예상 금액에 포함하지 않았어요.
      </p>
    </aside>
  </section>
</template>
