<script setup>
import { computed, onMounted, ref } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import { useAuthStore } from '../stores/authStore'
import '../assets/css/profile-view.css'

const authStore = useAuthStore()
const profile = ref(null)
const loading = ref(true)
const loadError = ref('')
const imageFailed = ref(false)

const profileName = computed(() => profile.value?.name?.trim() || '사용자')
const joinedAt = computed(() => profile.value?.createdAt ?? profile.value?.joinedAt)

function displayDate(value) {
  if (!value) return '정보 없음'
  return String(value).slice(0, 10).replaceAll('-', '.')
}

function displayValue(value) {
  return value === null || value === undefined || value === '' ? '정보 없음' : value
}

async function loadProfile() {
  loading.value = true
  loadError.value = ''
  imageFailed.value = false

  try {
    profile.value = await authStore.fetchUserProfile()
    if (!profile.value) throw new Error('회원 정보를 찾을 수 없습니다.')
  } catch (error) {
    loadError.value = error.message || '회원 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="page profile-view-page">
    <AppHeader title="내 상세 정보" back />

    <main class="page-content profile-view-content">
      <section v-if="loading" class="profile-state-card" role="status" aria-live="polite">
        <span class="profile-loading-spinner" aria-hidden="true" />
        <h2>내 정보를 불러오고 있어요</h2>
        <p>잠시만 기다려 주세요.</p>
      </section>

      <section v-else-if="loadError" class="profile-state-card" role="alert">
        <span class="profile-state-icon"><AppIcon name="info" :size="24" /></span>
        <h2>정보를 불러오지 못했어요</h2>
        <p>{{ loadError }}</p>
        <button class="primary-button" type="button" @click="loadProfile">다시 시도</button>
      </section>

      <template v-else-if="profile">
        <div class="profile-view-stage" aria-hidden="true">
          <span class="profile-view-avatar">
            <img
              v-if="profile.img && !imageFailed"
              :src="profile.img"
              alt=""
              @error="imageFailed = true"
            />
            <template v-else>{{ profileName.slice(0, 1) }}</template>
          </span>
        </div>

        <article class="profile-information-card" aria-labelledby="profile-name-heading">
          <header class="profile-information-header">
            <h2 id="profile-name-heading">{{ profileName }}님</h2>
            <p>가입된 회원 정보를 확인할 수 있어요.</p>
          </header>

          <section class="profile-information-section" aria-labelledby="profile-basic-heading">
            <h3 id="profile-basic-heading">기본 정보</h3>
            <dl class="profile-information-list">
              <div>
                <dt>이름</dt>
                <dd>{{ profileName }}</dd>
              </div>
              <div>
                <dt>연락처</dt>
                <dd>{{ displayValue(profile.phone) }}</dd>
              </div>
              <div>
                <dt>생년월일</dt>
                <dd>{{ displayDate(profile.birthDate) }}</dd>
              </div>
              <div v-if="profile.address">
                <dt>주소</dt>
                <dd>{{ profile.address }}</dd>
              </div>
              <div>
                <dt>가입일</dt>
                <dd>{{ displayDate(joinedAt) }}</dd>
              </div>
            </dl>
          </section>

          <section class="profile-information-section" aria-labelledby="profile-account-heading">
            <h3 id="profile-account-heading">계정 정보</h3>
            <dl class="profile-information-list">
              <div>
                <dt>이메일</dt>
                <dd>{{ displayValue(profile.email) }}</dd>
              </div>
            </dl>
            <p class="profile-readonly-note">이메일은 회원 식별 정보로 조회만 가능합니다.</p>
          </section>
        </article>
      </template>
    </main>
  </div>
</template>
