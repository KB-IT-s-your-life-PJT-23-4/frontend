<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import PageHeading from '../components/layout/PageHeading.vue'
import { useAuthStore } from '../stores/authStore'
import { validateEmail, validatePassword } from '../utils/authValidation'
import '../assets/css/auth-view.css'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const serverError = ref('')
const isSubmitting = ref(false)

function clearError(field) {
  errors[field] = ''
  serverError.value = ''
}

function validateForm() {
  errors.email = validateEmail(form.email)
  errors.password = validatePassword(form.password, { login: true })
  return !errors.email && !errors.password
}

function loginErrorMessage(error) {
  if (error.code === 'AUTH_API_NOT_CONFIGURED') {
    return '로그인 서버 연결 설정이 필요합니다. 잠시 후 다시 시도해주세요.'
  }
  if ([400, 401, 404].includes(error.status)) {
    return '이메일 또는 비밀번호를 확인해주세요.'
  }
  return error.message || '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}

function getPostLoginPath() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && /^\/(?:my(?:\/|[?#]|$)|chat(?:[?#]|$))/.test(redirect)
    ? redirect
    : '/'
}

async function submitLogin() {
  serverError.value = ''
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    await authStore.login({
      email: form.email.trim(),
      password: form.password,
    })
    await router.replace(getPostLoginPath())
  } catch (error) {
    serverError.value = loginErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page auth-page">
    <AppHeader />

    <div class="page-content auth-content">
      <PageHeading title="로그인" />

      <section class="auth-card" aria-labelledby="login-heading">
        <div class="auth-intro">
          <div>
            <h2 id="login-heading">다시 만나 반가워요</h2>
            <p>미리줌으로 스마트한 증여 계획을 이어가세요.</p>
          </div>
        </div>

        <form class="auth-form" novalidate @submit.prevent="submitLogin">
          <div class="auth-field">
            <label for="login-email">이메일</label>
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="이메일을 입력해주세요"
              :aria-invalid="Boolean(errors.email)"
              :aria-describedby="errors.email ? 'login-email-error' : undefined"
              @input="clearError('email')"
              @blur="errors.email = validateEmail(form.email)"
            />
            <p v-if="errors.email" id="login-email-error" class="auth-message error">
              {{ errors.email }}
            </p>
          </div>

          <div class="auth-field">
            <label for="login-password">비밀번호</label>
            <input
              id="login-password"
              v-model="form.password"
              type="password"
              name="password"
              autocomplete="current-password"
              placeholder="비밀번호를 입력해주세요"
              :aria-invalid="Boolean(errors.password)"
              :aria-describedby="errors.password ? 'login-password-error' : undefined"
              @input="clearError('password')"
              @blur="errors.password = validatePassword(form.password, { login: true })"
            />
            <p v-if="errors.password" id="login-password-error" class="auth-message error">
              {{ errors.password }}
            </p>
          </div>

          <p v-if="serverError" class="auth-server-error" role="alert">{{ serverError }}</p>

          <button
            class="primary-button tall full auth-submit"
            type="submit"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="button-spinner" aria-hidden="true" />
            {{ isSubmitting ? '로그인 중' : '로그인' }}
          </button>
        </form>

        <p class="auth-switch">
          아직 회원이 아니신가요?
          <RouterLink to="/signup">회원가입</RouterLink>
        </p>
      </section>
    </div>
  </div>
</template>
