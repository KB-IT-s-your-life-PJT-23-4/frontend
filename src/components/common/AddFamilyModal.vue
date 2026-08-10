<script setup>
import { reactive, ref } from 'vue'
import DateField from './DateField.vue'
import ModalSheet from '../layout/ModalSheet.vue'
import { useAppStore } from '../../stores/appStore'
import { RELATION_OPTIONS } from '../../utils/deduction'

// 수증자 등록 모달. 마이페이지와 증여 현황 두 곳에서 띄우므로 폼 상태와 등록 로직을 여기에 둔다.
// 화면마다 따로 두면 검증 규칙이나 안내 문구가 갈라진다.
defineProps({
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'added'])

const store = useAppStore()
const saving = ref(false)

// 4자리를 채워도 월 칸으로 넘어가지 않는다. 범위를 좁히면 연도 4자리에서 자동으로 넘어간다.
// 미래 생년월일을 막는 역할도 겸한다.
const BIRTH_DATE_MIN = '1900-01-01'
const birthDateMax = new Date().toISOString().slice(0, 10)
// 백엔드 family.relation 은 ENUM(LINEAL_DESCENDANT/OTHER) 이라 코드로 보낸다.
const form = reactive({
  name: '',
  birthDate: '',
})

function close() {
  emit('close')
}

async function submit() {
  if (!form.name || !form.birthDate || saving.value) return
  saving.value = true
  try {
    // addFamily 가 목록 동기화·새 수증자 선택·토스트까지 처리한다. 여기서는 폼만 비운다.
    await store.addFamily({
      ...form,
      relation: RELATION_OPTIONS[0].code,
    })
    form.name = ''
    form.birthDate = ''
    emit('added')
    close()
  } catch (error) {
    store.showToast(error.message || '수증자를 등록하지 못했습니다.', 'info')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalSheet
    :show="show"
    title="수증자 정보를 등록할까요?"
    description="이름과 관계, 생년월일을 입력하면 가족별 증여 한도를 따로 관리할 수 있어요."
    @close="close"
  >
    <form id="family-form" class="modal-form" @submit.prevent="submit">
      <label>
        <span>이름</span>
        <input v-model.trim="form.name" type="text" placeholder="이름을 입력하세요" required />
      </label>
      <label>
        <span>관계</span>
        <input :value="RELATION_OPTIONS[0].label" type="text" readonly aria-readonly="true" />
      </label>
      <div class="date-field-row">
        <span>생년월일</span>
        <DateField
          v-model="form.birthDate"
          :min="BIRTH_DATE_MIN"
          :max="birthDateMax"
          placeholder="생년월일을 선택하세요"
          aria-label="생년월일 선택"
        />
      </div>
    </form>
    <template #actions>
      <button class="secondary-button" type="button" @click="close">취소</button>
      <!-- 생년월일은 DateField(button) 이라 네이티브 required 검증이 안 걸린다. 버튼으로 막는다. -->
      <button
        class="primary-button"
        type="submit"
        form="family-form"
        :disabled="saving || !form.birthDate"
      >
        {{ saving ? '등록 중...' : '등록' }}
      </button>
    </template>
  </ModalSheet>
</template>
