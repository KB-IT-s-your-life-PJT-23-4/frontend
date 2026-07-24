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
      <span class="section-kicker">GIFT SIMULATION</span>
      <h2>누구에게, 얼마를<br />증여할 예정인가요?</h2>
      <p>최근 10년 이력과 공제 한도를 반영해 두 가지 전략을 비교해 드려요.</p>
    </section>

    <form class="simulation-form" @submit.prevent="$emit('submit')">
      <div class="field-group">
        <label for="family-select">수증자</label>
        <div class="select-wrap">
          <select
            id="family-select"
            :value="selectedFamilyId"
            @change="$emit('update:selectedFamilyId', Number($event.target.value))"
          >
            <option v-for="item in families" :key="item.id" :value="item.id">
              {{ item.name }} ({{ item.relation }})
            </option>
          </select>
          <AppIcon name="chevron" :size="17" />
        </div>
      </div>

      <article
        class="family-context-card"
        :class="{ 'family-context-card--empty': family.giftedAmount === 0 }"
      >
        <span class="context-avatar">{{ family.name.slice(-2) }}</span>
        <div>
          <strong>{{ family.name }}</strong>
          <span v-if="family.giftedAmount > 0">
            최근 10년 증여 {{ formatCompactWon(family.giftedAmount) }}
          </span>
          <span v-else>최근 10년간 증여 이력이 없어요</span>
        </div>
        <div class="context-remaining">
          <span>{{ family.giftedAmount > 0 ? '남은 공제' : '사용 가능 공제' }}</span>
          <strong>{{ formatCompactWon(remaining) }}</strong>
        </div>
      </article>

      <div class="field-group amount-field-group">
        <label for="gift-amount">이번 증여 예정 금액</label>
        <div class="amount-input-wrap" :class="{ invalid: errorMessage }">
          <input
            id="gift-amount"
            :value="amountText"
            inputmode="numeric"
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
      </div>

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
