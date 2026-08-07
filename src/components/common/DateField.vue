<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import '../../assets/css/date-field.css'

// 네이티브 <input type="date"> 대신 쓰는 달력. 브라우저 기본 팝업이 main.css 와 따로 놀아서
// 같은 토큰으로 직접 그린다. 값은 네이티브와 동일하게 'YYYY-MM-DD' 문자열로 주고받는다.
const props = defineProps({
  modelValue: { type: String, default: '' },
  min: { type: String, default: '' },
  max: { type: String, default: '' },
  placeholder: { type: String, default: '날짜를 선택하세요' },
  ariaLabel: { type: String, default: '날짜 선택' },
})

const emit = defineEmits(['update:modelValue'])

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const YEAR_FALLBACK_SPAN = 100

const root = ref(null)
const open = ref(false)
const viewYear = ref(0)
const viewMonth = ref(1)

// 'YYYY-MM-DD' 는 문자열로만 다룬다. new Date('2000-01-01') 은 UTC 로 해석돼
// KST 에서 하루 밀리기 때문에 파싱에 쓰지 않는다.
function parseIso(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null

  const [year, month, day] = value.split('-').map(Number)

  return { year, month, day }
}

function toIso(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayIso() {
  const now = new Date()

  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

const selected = computed(() => parseIso(props.modelValue))

const minIso = computed(() => (parseIso(props.min) ? props.min : ''))
const maxIso = computed(() => (parseIso(props.max) ? props.max : ''))

const displayLabel = computed(() => props.modelValue.replaceAll('-', '.'))

// 연 셀렉트 범위. min/max 가 없으면 오늘 기준 앞뒤 100년으로 연다.
const yearOptions = computed(() => {
  const currentYear = Number(todayIso().slice(0, 4))
  const from = minIso.value ? Number(minIso.value.slice(0, 4)) : currentYear - YEAR_FALLBACK_SPAN
  const to = maxIso.value ? Number(maxIso.value.slice(0, 4)) : currentYear + YEAR_FALLBACK_SPAN

  return Array.from({ length: Math.max(1, to - from + 1) }, (_, index) => from + index)
})

function isDisabledIso(iso) {
  // ISO 날짜는 자릿수가 고정이라 문자열 비교가 곧 날짜 비교다.
  return Boolean((minIso.value && iso < minIso.value) || (maxIso.value && iso > maxIso.value))
}

// Date(y, m, d) 는 로컬 기준이라 요일·말일 계산에는 안전하다.
const cells = computed(() => {
  const leading = new Date(viewYear.value, viewMonth.value - 1, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value, 0).getDate()
  const today = todayIso()

  const blanks = Array.from({ length: leading }, (_, index) => ({ key: `blank-${index}` }))
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const iso = toIso(viewYear.value, viewMonth.value, day)

    return {
      key: iso,
      day,
      iso,
      today: iso === today,
      selected: iso === props.modelValue,
      disabled: isDisabledIso(iso),
    }
  })

  return [...blanks, ...days]
})

// 이동 버튼은 범위를 벗어나면 잠근다. 그 달이 통째로 범위 밖일 때만 막는다.
const canGoPrev = computed(() => {
  if (!minIso.value) return true

  const lastDayOfPrev = new Date(viewYear.value, viewMonth.value - 1, 0)

  return (
    toIso(lastDayOfPrev.getFullYear(), lastDayOfPrev.getMonth() + 1, lastDayOfPrev.getDate()) >=
    minIso.value
  )
})

const canGoNext = computed(() => {
  if (!maxIso.value) return true

  return (
    toIso(
      viewMonth.value === 12 ? viewYear.value + 1 : viewYear.value,
      (viewMonth.value % 12) + 1,
      1,
    ) <= maxIso.value
  )
})

// 열 때 보여줄 달: 선택값 > max > 오늘 순. 생년월일처럼 max 가 오늘인 경우
// 먼 미래에서 시작하지 않게 하려는 것이다.
function syncView() {
  const anchor = selected.value ?? parseIso(maxIso.value) ?? parseIso(todayIso())

  viewYear.value = anchor.year
  viewMonth.value = anchor.month
}

function shiftMonth(step) {
  const shifted = new Date(viewYear.value, viewMonth.value - 1 + step, 1)

  viewYear.value = shifted.getFullYear()
  viewMonth.value = shifted.getMonth() + 1
}

function toggle() {
  open.value = !open.value

  if (open.value) {
    syncView()
  }
}

function choose(cell) {
  if (cell.disabled) return

  emit('update:modelValue', cell.iso)
  open.value = false
}

function onDocumentPointerDown(event) {
  if (open.value && root.value && !root.value.contains(event.target)) {
    open.value = false
  }
}

function onKeydown(event) {
  if (event.key === 'Escape' && open.value) {
    open.value = false
  }
}

// 값이 밖에서 초기화되면(등록 후 폼 리셋) 다음에 열 때 기준 달도 따라가야 한다.
watch(() => props.modelValue, syncView)

onMounted(() => {
  syncView()
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="date-field" :class="{ 'is-open': open }">
    <button
      type="button"
      class="date-field-trigger"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      @click="toggle"
    >
      <slot
        name="trigger"
        :display-label="displayLabel"
        :has-value="Boolean(modelValue)"
        :is-open="open"
        :placeholder="placeholder"
      >
        <span v-if="modelValue">{{ displayLabel }}</span>
        <span v-else class="date-field-placeholder">{{ placeholder }}</span>
        <AppIcon name="calendar" :size="18" />
      </slot>
    </button>

    <div v-if="open" class="date-field-panel">
      <div class="date-field-head">
        <button
          type="button"
          class="date-field-nav prev"
          aria-label="이전 달"
          :disabled="!canGoPrev"
          @click="shiftMonth(-1)"
        >
          <AppIcon name="chevron" :size="16" />
        </button>

        <div class="date-field-selects">
          <select v-model.number="viewYear" aria-label="연도">
            <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}년</option>
          </select>
          <select v-model.number="viewMonth" aria-label="월">
            <option v-for="month in 12" :key="month" :value="month">{{ month }}월</option>
          </select>
        </div>

        <button
          type="button"
          class="date-field-nav"
          aria-label="다음 달"
          :disabled="!canGoNext"
          @click="shiftMonth(1)"
        >
          <AppIcon name="chevron" :size="16" />
        </button>
      </div>

      <div class="date-field-grid">
        <span
          v-for="(weekday, index) in WEEKDAYS"
          :key="weekday"
          class="date-field-weekday"
          :class="{ sun: index === 0, sat: index === 6 }"
          >{{ weekday }}</span
        >

        <template v-for="cell in cells" :key="cell.key">
          <button
            v-if="cell.iso"
            type="button"
            class="date-field-day"
            :class="{ 'is-today': cell.today, 'is-selected': cell.selected }"
            :disabled="cell.disabled"
            :aria-current="cell.selected ? 'date' : undefined"
            @click="choose(cell)"
          >
            {{ cell.day }}
          </button>
          <span v-else class="date-field-day is-empty" />
        </template>
      </div>
    </div>
  </div>
</template>
