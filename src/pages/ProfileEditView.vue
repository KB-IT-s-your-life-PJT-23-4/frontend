<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import DateField from '../components/common/DateField.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import PageHeading from '../components/layout/PageHeading.vue'
import ProfileImageField from '../components/common/ProfileImageField.vue'
import { api } from '../api/apiAdapter'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { formatPhone, validateName, validatePhone } from '../utils/authValidation'
import { DEMO_PROFILE_IMAGE_MAX_BYTES, PROFILE_IMAGE_MAX_BYTES } from '../utils/profileImage'
import '../assets/css/profile-view.css'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const loading = ref(true)
const loadError = ref('')
const submitError = ref('')
const isSubmitting = ref(false)
const currentImage = ref('')
const selectedImage = ref(null)
const removeImage = ref(false)
const imageValid = ref(true)
const imageMaxBytes = api.isMock ? DEMO_PROFILE_IMAGE_MAX_BYTES : PROFILE_IMAGE_MAX_BYTES
const birthDateMax = new Date().toISOString().slice(0, 10)
const form = reactive({ name: '', birthDate: '', phone: '' })
const errors = reactive({ name: '', birthDate: '', phone: '' })

function normalizeIsoDate(value) {
  return String(value ?? '')
    .slice(0, 10)
    .replaceAll('.', '-')
}

function validateForm() {
  errors.name = validateName(form.name)
  errors.birthDate = form.birthDate ? '' : '생년월일을 선택해주세요.'
  errors.phone = validatePhone(form.phone)
  return !errors.name && !errors.birthDate && !errors.phone
}

function clearError(field) {
  errors[field] = ''
  submitError.value = ''
}

function updatePhone(event) {
  form.phone = formatPhone(event.target.value)
  clearError('phone')
}

async function loadProfile() {
  loading.value = true
  loadError.value = ''

  try {
    const profile = await authStore.fetchUserProfile()
    if (!profile) throw new Error('회원 정보를 찾을 수 없습니다.')

    form.name = profile.name ?? ''
    form.birthDate = normalizeIsoDate(profile.birthDate)
    form.phone = profile.phone ?? ''
    currentImage.value = profile.img ?? ''
    selectedImage.value = null
    removeImage.value = false
    imageValid.value = true
  } catch (error) {
    loadError.value = error.message || '회원 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function submitProfile() {
  submitError.value = ''
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await authStore.updateUserProfile(
      {
        name: form.name.trim(),
        birthDate: form.birthDate,
        phone: form.phone,
      },
      { image: selectedImage.value, removeImage: removeImage.value },
    )
    if (!appStore.isMock) appStore.showToast('회원 정보가 저장되었어요.')
    await router.replace({ name: 'profile-detail' })
  } catch (error) {
    submitError.value = error.message || '회원 정보를 저장하지 못했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="page profile-view-page">
    <AppHeader />

    <main class="page-content profile-view-content profile-edit-content">
      <PageHeading
        title="회원 정보 수정"
        description="기본 정보를 최신 상태로 관리해 주세요."
        back
        @back="router.push({ name: 'profile-detail' })"
      />

      <section v-if="loading" class="profile-state-card" role="status" aria-live="polite">
        <span class="profile-loading-spinner" aria-hidden="true" />
        <h2>회원 정보를 불러오고 있어요</h2>
        <p>잠시만 기다려 주세요.</p>
      </section>

      <section v-else-if="loadError" class="profile-state-card" role="alert">
        <span class="profile-state-icon"><AppIcon name="info" :size="24" /></span>
        <h2>정보를 불러오지 못했어요</h2>
        <p>{{ loadError }}</p>
        <button class="primary-button" type="button" @click="loadProfile">다시 시도</button>
      </section>

      <section v-else class="profile-edit-card" aria-labelledby="profile-edit-heading">
        <form class="profile-edit-form" novalidate @submit.prevent="submitProfile">
          <ProfileImageField
            :image-url="currentImage"
            :display-name="form.name"
            :max-bytes="imageMaxBytes"
            :show-label="false"
            :disabled="isSubmitting"
            @update:file="selectedImage = $event"
            @update:remove="removeImage = $event"
            @update:valid="imageValid = $event"
          />

          <div class="profile-edit-field">
            <label for="profile-edit-name">이름</label>
            <input
              id="profile-edit-name"
              v-model="form.name"
              type="text"
              name="name"
              autocomplete="name"
              :aria-invalid="Boolean(errors.name)"
              :aria-describedby="errors.name ? 'profile-edit-name-error' : undefined"
              @input="clearError('name')"
              @blur="errors.name = validateName(form.name)"
            />
            <p v-if="errors.name" id="profile-edit-name-error" class="profile-field-error">
              {{ errors.name }}
            </p>
          </div>

          <div class="profile-edit-field">
            <span class="profile-edit-label">생년월일</span>
            <DateField
              v-model="form.birthDate"
              min="1900-01-01"
              :max="birthDateMax"
              placeholder="생년월일을 선택하세요"
              aria-label="생년월일 선택"
              @update:model-value="clearError('birthDate')"
            />
            <p v-if="errors.birthDate" class="profile-field-error">{{ errors.birthDate }}</p>
          </div>

          <div class="profile-edit-field">
            <label for="profile-edit-phone">연락처</label>
            <input
              id="profile-edit-phone"
              v-model="form.phone"
              type="tel"
              name="tel"
              autocomplete="tel"
              placeholder="010-0000-0000"
              :aria-invalid="Boolean(errors.phone)"
              :aria-describedby="errors.phone ? 'profile-edit-phone-error' : undefined"
              @input="updatePhone"
              @blur="errors.phone = validatePhone(form.phone)"
            />
            <p v-if="errors.phone" id="profile-edit-phone-error" class="profile-field-error">
              {{ errors.phone }}
            </p>
          </div>

          <p class="profile-edit-notice">
            이메일과 비밀번호는 이 화면에서 조회하거나 변경하지 않습니다.
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
