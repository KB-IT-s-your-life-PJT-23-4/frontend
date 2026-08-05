<script setup>
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { checkEmailDuplicate, signup } from '../api/authApi'
import AppHeader from '../components/layout/AppHeader.vue'
import PageHeading from '../components/layout/PageHeading.vue'
import { useAppStore } from '../stores/appStore'
import {
  formatBirthDate,
  formatPhone,
  validateBirthDate,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../utils/authValidation'
import '../assets/css/auth-view.css'

const router = useRouter()
const store = useAppStore()
const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  birthDate: '',
  phone: '',
  agreed: false,
})
const errors = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  birthDate: '',
  phone: '',
  agreed: '',
})
const serverError = ref('')
const emailStatus = ref('idle')
const checkedEmail = ref('')
const isSubmitting = ref(false)

watch(
  () => form.email,
  () => {
    if (form.email.trim() !== checkedEmail.value) {
      emailStatus.value = 'idle'
      checkedEmail.value = ''
    }
    errors.email = ''
    serverError.value = ''
  },
)

function clearError(field) {
  errors[field] = ''
  serverError.value = ''
}

function onBirthDateInput(event) {
  form.birthDate = formatBirthDate(event.target.value)
  clearError('birthDate')
}

function onPhoneInput(event) {
  form.phone = formatPhone(event.target.value)
  clearError('phone')
}

async function checkEmail() {
  if (emailStatus.value === 'checking') return

  const emailError = validateEmail(form.email)
  if (emailError) {
    errors.email = emailError
    return
  }

  emailStatus.value = 'checking'
  serverError.value = ''
  const requestedEmail = form.email.trim()
  try {
    const result = await checkEmailDuplicate(requestedEmail)
    if (form.email.trim() !== requestedEmail) return

    checkedEmail.value = requestedEmail
    if (result.available) {
      emailStatus.value = 'available'
      errors.email = ''
    } else {
      emailStatus.value = 'unavailable'
      errors.email = '이미 사용 중인 이메일입니다.'
    }
  } catch (error) {
    if (form.email.trim() !== requestedEmail) return

    emailStatus.value = 'idle'
    errors.email =
      error.code === 'AUTH_API_NOT_CONFIGURED'
        ? '이메일 중복 확인 서버 연결이 필요합니다.'
        : error.message || '이메일 중복 확인 중 오류가 발생했습니다. 다시 시도해주세요.'
  }
}

function validatePasswordConfirm() {
  if (!form.passwordConfirm) return '비밀번호를 한 번 더 입력해주세요.'
  return form.passwordConfirm === form.password ? '' : '비밀번호가 일치하지 않습니다.'
}

function validateForm() {
  errors.name = validateName(form.name)
  errors.email = validateEmail(form.email)
  if (!errors.email && emailStatus.value !== 'available') {
    errors.email = '이메일 중복 확인이 필요합니다.'
  }
  errors.password = validatePassword(form.password)
  errors.passwordConfirm = validatePasswordConfirm()
  errors.birthDate = validateBirthDate(form.birthDate)
  errors.phone = validatePhone(form.phone)
  errors.agreed = form.agreed ? '' : '이용약관 및 개인정보 처리방침에 동의해주세요.'

  return Object.values(errors).every((message) => !message)
}

function signupErrorMessage(error) {
  if (error.code === 'AUTH_API_NOT_CONFIGURED') {
    return '회원가입 서버 연결 설정이 필요합니다. 잠시 후 다시 시도해주세요.'
  }
  if ([406, 409].includes(error.payload?.statusCode) || error.status === 409) {
    return '이미 가입된 이메일 또는 전화번호입니다.'
  }
  if (error.status === 400) return error.message || '입력한 정보를 확인해주세요.'
  return error.message || '회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}

async function submitSignup() {
  if (isSubmitting.value) return

  serverError.value = ''
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    await signup({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      birthDate: form.birthDate.replaceAll('.', '-'),
      phone: form.phone,
    })
    store.showToast('회원가입이 완료되었습니다.')
    await router.replace('/login')
  } catch (error) {
    serverError.value = signupErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page auth-page signup-page">
    <AppHeader />

    <div class="page-content auth-content">
      <PageHeading title="회원가입" heading-id="signup-heading" />

      <section class="auth-card" aria-labelledby="signup-heading">
        <div class="auth-intro compact">
          <div>
            <p>가족의 증여 계획을 안전하게 시작해보세요.</p>
          </div>
        </div>

        <form class="auth-form" novalidate @submit.prevent="submitSignup">
          <div class="auth-field">
            <label for="signup-name">이름</label>
            <input
              id="signup-name"
              v-model="form.name"
              type="text"
              name="name"
              autocomplete="name"
              maxlength="50"
              placeholder="이름을 입력해주세요"
              :aria-invalid="Boolean(errors.name)"
              @input="clearError('name')"
              @blur="errors.name = validateName(form.name)"
            />
            <p v-if="errors.name" class="auth-message error">{{ errors.name }}</p>
          </div>

          <div class="auth-field">
            <label for="signup-email">이메일</label>
            <div class="auth-inline-control">
              <input
                id="signup-email"
                v-model="form.email"
                type="email"
                name="email"
                autocomplete="email"
                placeholder="이메일을 입력해주세요"
                :aria-invalid="Boolean(errors.email)"
                @blur="errors.email = validateEmail(form.email)"
              />
              <button
                class="soft-button auth-check-button"
                type="button"
                :disabled="emailStatus === 'checking'"
                @click="checkEmail"
              >
                {{ emailStatus === 'checking' ? '확인 중' : '중복 확인' }}
              </button>
            </div>
            <p v-if="emailStatus === 'available'" class="auth-message success">
              사용 가능한 이메일입니다.
            </p>
            <p v-else-if="errors.email" class="auth-message error">{{ errors.email }}</p>
          </div>

          <div class="auth-field">
            <label for="signup-password">비밀번호</label>
            <input
              id="signup-password"
              v-model="form.password"
              type="password"
              name="password"
              autocomplete="new-password"
              placeholder="영문, 숫자, 특수문자 포함 8자 이상"
              :aria-invalid="Boolean(errors.password)"
              @input="clearError('password')"
              @blur="errors.password = validatePassword(form.password)"
            />
            <p v-if="errors.password" class="auth-message error">{{ errors.password }}</p>
          </div>

          <div class="auth-field">
            <label for="signup-password-confirm">비밀번호 확인</label>
            <input
              id="signup-password-confirm"
              v-model="form.passwordConfirm"
              type="password"
              name="passwordConfirm"
              autocomplete="new-password"
              placeholder="비밀번호를 한 번 더 입력해주세요"
              :aria-invalid="Boolean(errors.passwordConfirm)"
              @input="clearError('passwordConfirm')"
              @blur="errors.passwordConfirm = validatePasswordConfirm()"
            />
            <p v-if="errors.passwordConfirm" class="auth-message error">
              {{ errors.passwordConfirm }}
            </p>
          </div>

          <div class="auth-field">
            <label for="signup-birth-date">생년월일</label>
            <input
              id="signup-birth-date"
              :value="form.birthDate"
              type="text"
              name="birthDate"
              inputmode="numeric"
              autocomplete="bday"
              maxlength="10"
              placeholder="YYYY.MM.DD"
              :aria-invalid="Boolean(errors.birthDate)"
              @input="onBirthDateInput"
              @blur="errors.birthDate = validateBirthDate(form.birthDate)"
            />
            <p v-if="errors.birthDate" class="auth-message error">{{ errors.birthDate }}</p>
          </div>

          <div class="auth-field">
            <label for="signup-phone">전화번호</label>
            <input
              id="signup-phone"
              :value="form.phone"
              type="tel"
              name="phone"
              inputmode="numeric"
              autocomplete="tel"
              maxlength="13"
              placeholder="010-0000-0000"
              :aria-invalid="Boolean(errors.phone)"
              @input="onPhoneInput"
              @blur="errors.phone = validatePhone(form.phone)"
            />
            <p v-if="errors.phone" class="auth-message error">{{ errors.phone }}</p>
          </div>

          <div class="auth-agreement">
            <label>
              <input v-model="form.agreed" type="checkbox" @change="clearError('agreed')" />
              <span><u>미리줌 이용약관</u> 및 <u>개인정보 처리방침</u>에 모두 동의합니다.</span>
            </label>
            <p v-if="errors.agreed" class="auth-message error">{{ errors.agreed }}</p>
          </div>

          <p v-if="serverError" class="auth-server-error" role="alert">{{ serverError }}</p>

          <button
            class="primary-button tall full auth-submit"
            type="submit"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="button-spinner" aria-hidden="true" />
            {{ isSubmitting ? '가입 처리 중' : '회원가입 완료' }}
          </button>
        </form>

        <p class="auth-switch">
          이미 회원이신가요?
          <RouterLink to="/login">로그인</RouterLink>
        </p>
      </section>
    </div>
  </div>
</template>
