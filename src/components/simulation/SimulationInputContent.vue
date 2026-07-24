<script setup>
import AppIcon from '../layout/AppIcon.vue'
import { formatCompactWon } from '../../utils/finance'

defineProps({
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
})

defineEmits(['update:selectedFamilyId', 'amount-input', 'add-amount', 'submit'])
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
          <span>최근 10년 증여 이력</span>
          <strong v-if="family.giftedAmount > 0">
            {{ formatCompactWon(family.giftedAmount) }}을 증여했어요
          </strong>
          <strong v-else>아직 증여한 이력이 없어요</strong>
          <p>
            {{ family.giftedAmount > 0 ? '남은 공제 한도' : '사용 가능한 공제 한도' }}
            <b>{{ formatCompactWon(remaining) }}</b>
          </p>
        </div>
      </section>

      <section class="simulation-input-step amount-step">
        <div class="input-step-heading">
          <span>2</span>
          <div>
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
