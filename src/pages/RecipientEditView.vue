<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api/apiAdapter'
import DateField from '../components/common/DateField.vue'
import ProfileImageField from '../components/common/ProfileImageField.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import PageHeading from '../components/layout/PageHeading.vue'
import { useAppStore } from '../stores/appStore'
import { isMinorAt, relationLabel } from '../utils/deduction'
import { validateName } from '../utils/authValidation'
import { DEMO_PROFILE_IMAGE_MAX_BYTES, PROFILE_IMAGE_MAX_BYTES } from '../utils/profileImage'
import '../assets/css/profile-view.css'
import '../assets/css/recipient-edit.css'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const loading = ref(true)
const notFound = ref(false)
const loadError = ref('')
const submitError = ref('')
const isSubmitting = ref(false)
const currentImage = ref('')
const selectedImage = ref(null)
const removeImage = ref(false)
const imageValid = ref(true)
const relation = ref('LINEAL_DESCENDANT')
const form = reactive({ name: '', birthDate: '' })
const errors = reactive({ name: '', birthDate: '' })
const birthDateMax = new Date().toISOString().slice(0, 10)
const imageMaxBytes = api.isMock ? DEMO_PROFILE_IMAGE_MAX_BYTES : PROFILE_IMAGE_MAX_BYTES
const ageLabel = computed(() => (isMinorAt(form.birthDate) ? '미성년' : '성년'))

function normalizeIsoDate(value) {
  return String(value ?? '')
    .slice(0, 10)
    .replaceAll('.', '-')
}

function validateForm() {
  errors.name = validateName(form.name)
  errors.birthDate = form.birthDate ? '' : '생년월일을 선택해주세요.'
  return !errors.name && !errors.birthDate
}

function clearError(field) {
  errors[field] = ''
  submitError.value = ''
}

function isMissing(error) {
  return error?.status === 404 || error?.status === 411 || error?.code === 411
}

async function loadRecipient(rawFamilyId) {
  const familyId = Number(rawFamilyId)
  loading.value = true
  notFound.value = false
  loadError.value = ''

  if (!Number.isSafeInteger(familyId) || familyId <= 0) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    let recipient
    if (api.isMock) {
      const family = store.state.families.find((item) => Number(item.id) === familyId)
      recipient = family
        ? {
            familyName: family.name,
            birthDate: family.birthDate,
            relation: family.relationCode ?? family.relation,
            familyImg: family.familyImg ?? null,
          }
        : null
    } else {
      recipient = await api.getFamily(familyId)
    }

    if (!recipient) {
      notFound.value = true
      return
    }
    form.name = recipient.familyName ?? ''
    form.birthDate = normalizeIsoDate(recipient.birthDate)
    relation.value = recipient.relation ?? 'LINEAL_DESCENDANT'
    currentImage.value = recipient.familyImg ?? ''
    selectedImage.value = null
    removeImage.value = false
    imageValid.value = true
  } catch (error) {
    if (isMissing(error)) notFound.value = true
    else loadError.value = error.message || '수증자 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function submitRecipient() {
  submitError.value = ''
  if (!validateForm() || !imageValid.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await store.updateFamilyProfile(
      Number(route.params.familyId),
      { name: form.name.trim(), birthDate: form.birthDate },
      { image: selectedImage.value, removeImage: removeImage.value },
    )
    await router.replace({
      name: 'recipient-detail',
      params: { familyId: route.params.familyId },
    })
  } catch (error) {
    submitError.value = error.message || '수증자 정보를 저장하지 못했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => route.params.familyId,
  (familyId) => loadRecipient(familyId),
  { immediate: true },
)
</script>

<template>
  <div class="page profile-view-page recipient-edit-page">
    <AppHeader />

    <main class="page-content profile-view-content profile-edit-content">
      <PageHeading
        title="수증자 정보 수정"
        description="수증자의 사진과 기본 정보를 정확하게 관리해 주세요."
        back
        @back="
          router.push({ name: 'recipient-detail', params: { familyId: route.params.familyId } })
        "
      />

      <section v-if="loading" class="profile-state-card" role="status" aria-live="polite">
        <span class="profile-loading-spinner" aria-hidden="true" />
        <h2>수증자 정보를 불러오고 있어요</h2>
        <p>잠시만 기다려 주세요.</p>
      </section>

      <section v-else-if="notFound" class="profile-state-card" role="alert">
        <span class="profile-state-icon"><AppIcon name="user" :size="24" /></span>
        <h2>수증자를 찾을 수 없어요</h2>
        <p>삭제되었거나 접근할 수 없는 수증자입니다.</p>
        <button class="primary-button" type="button" @click="router.replace({ name: 'my' })">
          마이페이지로 이동
        </button>
      </section>

      <section v-else-if="loadError" class="profile-state-card" role="alert">
        <span class="profile-state-icon"><AppIcon name="info" :size="24" /></span>
        <h2>정보를 불러오지 못했어요</h2>
        <p>{{ loadError }}</p>
        <button class="primary-button" type="button" @click="loadRecipient(route.params.familyId)">
          다시 시도
        </button>
      </section>

      <section v-else class="profile-edit-card" aria-labelledby="recipient-edit-heading">
        <header class="profile-edit-header">
          <h2 id="recipient-edit-heading">수증자 기본 정보를 수정해주세요</h2>
          <p>이름, 생년월일과 프로필 사진만 변경할 수 있어요.</p>
        </header>

        <form class="profile-edit-form" novalidate @submit.prevent="submitRecipient">
          <ProfileImageField
            :image-url="currentImage"
            :display-name="form.name"
            :initial-length="2"
            :max-bytes="imageMaxBytes"
            :disabled="isSubmitting"
            @update:file="selectedImage = $event"
            @update:remove="removeImage = $event"
            @update:valid="imageValid = $event"
          />

          <div class="profile-edit-field">
            <label for="recipient-edit-name">수증자 이름</label>
            <input
              id="recipient-edit-name"
              v-model="form.name"
              type="text"
              :aria-invalid="Boolean(errors.name)"
              @input="clearError('name')"
              @blur="errors.name = validateName(form.name)"
            />
            <p v-if="errors.name" class="profile-field-error">{{ errors.name }}</p>
          </div>

          <div class="profile-edit-field">
            <label for="recipient-edit-relation">관계</label>
            <input
              id="recipient-edit-relation"
              :value="relationLabel(relation) || '자녀'"
              type="text"
              readonly
            />
            <p class="recipient-readonly-help">관계는 등록된 자녀 값으로 고정됩니다.</p>
          </div>

          <div class="profile-edit-field">
            <span class="profile-edit-label">생년월일</span>
            <DateField
              v-model="form.birthDate"
              min="1900-01-01"
              :max="birthDateMax"
              placeholder="생년월일을 선택하세요"
              aria-label="수증자 생년월일 선택"
              @update:model-value="clearError('birthDate')"
            />
            <p v-if="errors.birthDate" class="profile-field-error">{{ errors.birthDate }}</p>
            <p v-else class="recipient-age-preview">현재 생년월일 기준: {{ ageLabel }}</p>
          </div>

          <p class="profile-edit-notice">
            증여 금액, 공제 한도와 증여 이력은 이 화면에서 수정하지 않습니다.
          </p>
          <p v-if="submitError" class="profile-submit-error" role="alert">
            {{ submitError }}
          </p>

          <div class="profile-edit-actions">
            <button
              class="secondary-button tall"
              type="button"
              :disabled="isSubmitting"
              @click="router.back()"
            >
              취소
            </button>
            <button
              class="primary-button tall"
              type="submit"
              :disabled="isSubmitting || !imageValid"
            >
              {{ isSubmitting ? '저장 중...' : '저장하기' }}
            </button>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>
