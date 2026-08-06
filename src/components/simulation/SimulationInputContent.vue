<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { formatCompactWon } from '../../utils/finance'
import '../../assets/css/simulation/simulation-input-content.css'

const props = defineProps({
  families: {
    type: Array,
    required: true,
  },
  selectedFamilyId: {
    type: [Number, String],
    required: true,
  },
  family: {
    type: Object,
    required: true,
  },
  amountText: {
    type: String,
    default: '',
  },
  remaining: {
    type: Number,
    required: true,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  investmentYears: {
    type: Number,
    default: 10,
  },
  giftDate: {
    type: String,
    required: true,
  },
  minGiftDate: {
    type: String,
    required: true,
  },
  giftDateError: {
    type: String,
    default: '',
  },
  donorPaysTax: {
    type: Boolean,
    default: false,
  },
})

const peerAverageGiftAmount = computed(() => {
  if (Number.isFinite(props.family.peerAverageGiftAmount)) {
    return props.family.peerAverageGiftAmount
  }

  const birthYear = Number(String(props.family.birthDate ?? '').slice(0, 4))
  const age = Number.isFinite(birthYear) ? new Date().getFullYear() - birthYear : 0
  return age < 19 ? 18000000 : age < 30 ? 30000000 : 42000000
})

defineEmits([
  'update:selectedFamilyId',
  'update:investmentYears',
  'update:giftDate',
  'update:donorPaysTax',
  'amount-input',
  'add-amount',
  'submit',
])
</script>

<template>
  <div class="page-content simulation-input-content">
    <section class="simulation-intro">
      <h2>누구에게, 얼마를<br />증여할 예정인가요?</h2>
    </section>

    <form class="simulation-form" @submit.prevent="$emit('submit')">
      <section class="simulation-input-step">
        <div class="input-step-heading">
          <span>1</span>
          <div>
            <h3>누구에게 증여할까요?</h3>
          </div>
        </div>

        <label class="recipient-picker" for="family-select">
          <span class="recipient-avatar">{{ family.name.slice(-2) }}</span>
          <span class="recipient-copy">
            <strong>{{ family.name }}</strong>
            <small>{{ family.relation }}</small>
          </span>
          <span class="recipient-change">
            변경
            <AppIcon name="chevron" :size="15" />
          </span>
          <select
            id="family-select"
            :value="selectedFamilyId"
            aria-label="수증자 변경"
            @change="$emit('update:selectedFamilyId', Number($event.target.value))"
          >
            <option v-for="item in families" :key="item.id" :value="item.id">
              {{ item.name }} ({{ item.relation }})
            </option>
          </select>
        </label>

        <div class="recipient-deduction-summary">
          <div class="recipient-history-row">
            <div>
              <span>최근 10년 증여 이력</span>
              <strong v-if="family.giftedAmount > 0">
                {{ formatCompactWon(family.giftedAmount) }}
              </strong>
              <strong v-else>이력 없음</strong>
            </div>
            <div>
              <span>남은 공제 한도</span>
              <strong>{{ formatCompactWon(remaining) }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="simulation-input-step amount-step">
        <div class="input-step-heading">
          <span>2</span>
          <div class="amount-heading-copy">
            <h3>얼마를 증여할까요?</h3>
          </div>
        </div>

        <div class="amount-input-wrap" :class="{ invalid: errorMessage }">
          <input
            id="gift-amount"
            :value="amountText"
            inputmode="numeric"
            aria-label="이번 증여 예정 금액"
            placeholder="0"
            @input="$emit('amount-input', $event.target.value)"
          />
          <span>원</span>
        </div>
        <p v-if="errorMessage" class="field-error">{{ errorMessage }}</p>
        <div class="amount-quick-buttons">
          <button type="button" @click="$emit('add-amount', 10000000)">+1천만원</button>
          <button type="button" @click="$emit('add-amount', 30000000)">+3천만원</button>
          <button type="button" @click="$emit('add-amount', 50000000)">+5천만원</button>
        </div>
        <p class="peer-average-insight">
          <span class="peer-average-icon"><AppIcon name="chart" :size="14" /></span>
          <span class="peer-average-copy">
            <span class="peer-average-lead">미리줌 이용자들은 같은 나이대 자녀에게</span>
            <span class="peer-average-result"
              >평균 <strong>{{ formatCompactWon(peerAverageGiftAmount) }}</strong
              >을 증여했어요.</span
            >
          </span>
        </p>
      </section>

      <section class="simulation-input-step gift-date-step">
        <div class="input-step-heading">
          <span>3</span>
          <div>
            <h3>언제 증여할까요?</h3>
            <p>선택한 날짜부터 증여 일정과 운용 기간을 계산해요.</p>
          </div>
        </div>

        <label class="gift-date-control" :class="{ invalid: giftDateError }" for="gift-date">
          <span class="gift-date-icon">
            <AppIcon name="calendar" :size="20" />
          </span>
          <span class="gift-date-copy">
            <small>증여 예정일</small>
            <input
              id="gift-date"
              :value="giftDate"
              type="date"
              :min="minGiftDate"
              required
              aria-label="증여 예정일"
              @input="$emit('update:giftDate', $event.target.value)"
            />
          </span>
        </label>
        <p v-if="giftDateError" class="field-error">{{ giftDateError }}</p>
      </section>

      <section class="simulation-input-step period-step">
        <div class="input-step-heading">
          <span>4</span>
          <div>
            <h3>얼마 동안 운용할까요?</h3>
            <p>기간에 맞춰 상품 비중과 예상 금액을 계산해요.</p>
          </div>
        </div>

        <div class="period-control">
          <div class="period-value">
            <span>희망 운용 기간</span>
            <label>
              <input
                :value="investmentYears"
                type="number"
                min="1"
                max="20"
                aria-label="희망 운용 기간"
                @input="
                  $emit(
                    'update:investmentYears',
                    Math.min(20, Math.max(1, Number($event.target.value) || 1)),
                  )
                "
              />
              <b>년</b>
            </label>
          </div>
          <input
            class="period-slider"
            :value="investmentYears"
            type="range"
            min="1"
            max="20"
            step="1"
            aria-label="운용 기간 조절"
            :style="{ '--period-ratio': `${((investmentYears - 1) / 19) * 100}%` }"
            @input="$emit('update:investmentYears', Number($event.target.value))"
          />
          <div class="period-scale" aria-hidden="true">
            <span>1년</span>
            <span>10년</span>
            <span>20년</span>
          </div>
        </div>
      </section>

      <section class="simulation-input-step tax-payer-step">
        <div class="input-step-heading">
          <span>5</span>
          <div>
            <h3>증여세는 누가 준비할까요?</h3>
            <p>세금 대납 여부까지 반영해 실제 필요한 금액을 계산해요.</p>
          </div>
        </div>

        <div class="tax-payer-options" role="radiogroup" aria-label="증여세 납부 주체">
          <button
            type="button"
            role="radio"
            :aria-checked="!donorPaysTax"
            :class="{ selected: !donorPaysTax }"
            @click="$emit('update:donorPaysTax', false)"
          >
            <span class="tax-option-check"><i /></span>
            <strong>받는 분이 납부</strong>
            <small>증여 금액에서 예상 세금을 준비해요.</small>
          </button>
          <button
            type="button"
            role="radio"
            :aria-checked="donorPaysTax"
            :class="{ selected: donorPaysTax }"
            @click="$emit('update:donorPaysTax', true)"
          >
            <span class="tax-option-check"><i /></span>
            <strong>주는 분이 함께<br class="tax-option-mobile-break" />준비</strong>
            <small>대납 세금도 추가 증여로 보아 계산해요.</small>
          </button>
        </div>
      </section>

      <aside class="info-callout">
        <AppIcon name="info" :size="20" />
        <p v-if="family.giftedAmount > 0">
          {{ family.name }} 님은 현재 <strong>{{ formatCompactWon(remaining) }}</strong
          >까지 비과세 한도를 활용할 수 있어요. 한도 갱신 예정일은 {{ family.resetDate }}입니다.
        </p>
        <p v-else>
          최근 10년간 증여 이력이 없어
          <strong>{{ formatCompactWon(remaining) }}</strong
          >의 공제 한도를 모두 활용할 수 있어요.
        </p>
      </aside>

      <button class="primary-button full tall" type="submit" :disabled="loading">
        <span v-if="loading" class="button-spinner" />
        <template v-else>
          시뮬레이션 실행하기
          <AppIcon name="arrow" :size="19" />
        </template>
      </button>
    </form>
  </div>
</template>
