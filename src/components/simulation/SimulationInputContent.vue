<script setup>
import { computed } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import DateField from '../common/DateField.vue'
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

const enteredAmount = computed(
  () => Number(String(props.amountText ?? '').replace(/[^\d]/g, '')) || 0,
)
const exceedsRemainingDeduction = computed(
  () => enteredAmount.value > 0 && enteredAmount.value > props.remaining,
)
const deductionExcessAmount = computed(() => Math.max(0, enteredAmount.value - props.remaining))

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
          <span class="step-number">1</span>
          <div>
            <h3>누구에게 증여할까요?</h3>
          </div>
        </div>

        <label class="recipient-picker" for="family-select">
          <span class="recipient-avatar">{{ family.name.slice(-2) }}</span>
          <span class="recipient-copy">
            <strong>{{ family.name }}</strong>
            <small class="recipient-meta">
              <span>{{ family.relation }}</span>
              <span v-if="family.giftedAmount > 0 && family.resetDate" class="renewal-date-inline">
                <i aria-hidden="true">·</i>
                공제 갱신 {{ family.resetDate }}
              </span>
            </small>
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
          <span class="step-number">2</span>
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
          <button type="button" @click="$emit('add-amount', 10000000)">+1백만원</button>
          <button type="button" @click="$emit('add-amount', 30000000)">+5백만원</button>
          <button type="button" @click="$emit('add-amount', 50000000)">+1천만원</button>
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
          <span class="step-number">3</span>
          <div>
            <h3>언제 증여할까요?</h3>
          </div>
        </div>

        <DateField
          :model-value="giftDate"
          :min="minGiftDate"
          class="gift-date-control"
          :class="{ invalid: giftDateError }"
          aria-label="증여 예정일 선택"
          placeholder="증여 예정일을 선택해 주세요"
          @update:model-value="$emit('update:giftDate', $event)"
        >
          <template #trigger="{ displayLabel, hasValue, isOpen, placeholder }">
            <span class="gift-date-icon">
              <AppIcon name="calendar" :size="20" />
            </span>
            <span class="gift-date-copy">
              <small>증여 예정일</small>
              <strong :class="{ placeholder: !hasValue }">
                {{ hasValue ? displayLabel : placeholder }}
              </strong>
            </span>
            <AppIcon name="chevron" :size="17" class="gift-date-caret" :class="{ open: isOpen }" />
          </template>
        </DateField>
        <p v-if="giftDateError" class="field-error">{{ giftDateError }}</p>
      </section>

      <section class="simulation-input-step period-step">
        <div class="input-step-heading">
          <span class="step-number">4</span>
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

      <section id="tax-payment-method" class="simulation-input-step tax-payer-step">
        <div class="input-step-heading">
          <span class="step-number">5</span>
          <div>
            <h3>증여세는 누가 준비할까요?</h3>
            <p>선택한 방식에 따라 운용 원금과 주는 분의 총 준비 금액이 달라져요.</p>
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
            <span class="tax-option-title">
              <strong>받는 분이 납부</strong>
              <span class="tax-option-badge">일반적인 방식</span>
            </span>
            <small>증여받은 금액에서 예상 세금을 납부하고,<br />남은 금액을 운용해요.</small>
          </button>
          <button
            type="button"
            role="radio"
            :aria-checked="donorPaysTax"
            :class="{ selected: donorPaysTax }"
            @click="$emit('update:donorPaysTax', true)"
          >
            <span class="tax-option-check"><i /></span>
            <span class="tax-option-title">
              <strong>주는 분이 함께 준비</strong>
            </span>
            <small>
              증여 금액은 그대로 운용할 수 있지만,<br />
              대신 납부한 세금까지 반영돼 총 준비 금액이 늘어날 수 있어요.
            </small>
          </button>
        </div>

        <div
          class="tax-deduction-notice"
          :class="exceedsRemainingDeduction ? 'caution' : 'safe'"
          role="status"
        >
          <AppIcon :name="exceedsRemainingDeduction ? 'info' : 'check'" :size="17" />
          <p v-if="!enteredAmount">증여 금액을 입력하면 남은 공제 한도와 비교해드려요.</p>
          <p v-else-if="exceedsRemainingDeduction">
            남은 공제 한도를 <strong>{{ formatCompactWon(deductionExcessAmount) }}</strong>
            초과해 예상 세금이 발생할 수 있어요.
          </p>
          <p v-else>현재 입력 금액은 남은 공제 한도 이내예요.</p>
        </div>

        <p class="tax-calculation-guide">
          정확한 예상 세금과 주는 분의 총 준비 금액은 일시·분할 증여 일정을 비교한 뒤 결과에서
          안내해드려요.
        </p>
      </section>

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
