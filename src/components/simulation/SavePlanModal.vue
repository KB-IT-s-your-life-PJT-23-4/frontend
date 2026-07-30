<script setup>
import { computed } from 'vue'
import ModalSheet from '../layout/ModalSheet.vue'
import { formatWon } from '../../utils/finance'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  selectedScenario: {
    type: Object,
    default: null,
  },
  family: {
    type: Object,
    required: true,
  },
  result: {
    type: Object,
    default: null,
  },
  activeProduct: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close', 'save'])

const productNames = computed(() =>
  (props.activeProduct?.name ?? '')
    .split(' · ')
    .map((name) => name.trim())
    .filter(Boolean),
)

const productRows = computed(() => {
  if (productNames.value.length === 3) {
    return [productNames.value.slice(0, 2), productNames.value.slice(2)]
  }
  if (productNames.value.length === 4) {
    return [productNames.value.slice(0, 2), productNames.value.slice(2)]
  }
  if (productNames.value.length === 5) {
    return [productNames.value.slice(0, 3), productNames.value.slice(3)]
  }
  return [productNames.value]
})
</script>

<template>
  <ModalSheet
    :show="show"
    title="이 전략을 저장할까요?"
    description="저장한 계획은 증여 현황에서 일정과 준비 서류를 이어서 관리할 수 있어요."
    @close="$emit('close')"
  >
    <div v-if="selectedScenario && result && activeProduct" class="save-plan-preview">
      <div>
        <span>대상</span><strong>{{ family.name }}</strong>
      </div>
      <div>
        <span>전략</span><strong>{{ selectedScenario.scenarioName }}</strong>
      </div>
      <div>
        <span>증여 금액</span><strong>{{ formatWon(result.requestedAmount) }}</strong>
      </div>
      <div>
        <span>추천 상품</span>
        <strong class="save-plan-products">
          <span
            v-for="(productRow, rowIndex) in productRows"
            :key="rowIndex"
            class="save-plan-product-row"
          >
            <span v-for="productName in productRow" :key="productName">{{ productName }}</span>
          </span>
        </strong>
      </div>
    </div>
    <template #actions>
      <button class="secondary-button" type="button" @click="$emit('close')">취소</button>
      <button class="primary-button" type="button" :disabled="saving" @click="$emit('save')">
        {{ saving ? '저장 중...' : '계획 저장' }}
      </button>
    </template>
  </ModalSheet>
</template>
