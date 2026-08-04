<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api/apiAdapter'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import { useAppStore } from '../stores/appStore'
import { relationLabel } from '../utils/deduction'
import { formatWon } from '../utils/finance'
import '../assets/css/recipient-detail.css'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const recipient = ref(null)
const deduction = ref(null)
const loading = ref(true)
const loadError = ref('')
const notFound = ref(false)
const imageFailed = ref(false)
const openingStatus = ref(false)
let loadSequence = 0

const recipientName = computed(() => recipient.value?.familyName || '수증자')
const recipientRelation = computed(() => relationLabel(recipient.value?.relation) || '정보 없음')

function displayDate(value) {
  if (!value) return '정보 없음'
  return String(value).slice(0, 10).replaceAll('-', '.')
}

function displayDateTime(value) {
  if (!value) return '정보 없음'
  const [date, time] = String(value).split('T')
  return `${date.replaceAll('-', '.')} ${time?.slice(0, 5) ?? ''}`.trim()
}

function displayMoney(value) {
  return value === null || value === undefined ? '정보 없음' : formatWon(value)
}

function displayCount(value) {
  return value === null || value === undefined ? '정보 없음' : `${value}건`
}

function isRecipientNotFound(error) {
  return error?.status === 404 || error?.status === 411 || error?.code === 411
}

async function loadRecipient(rawFamilyId) {
  const sequence = ++loadSequence
  const familyId = Number(rawFamilyId)

  recipient.value = null
  deduction.value = null
  loadError.value = ''
  notFound.value = false
  imageFailed.value = false
  loading.value = true

  if (!Number.isSafeInteger(familyId) || familyId <= 0) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    const [recipientData, deductions] = await Promise.all([
      api.getFamily(familyId),
      api.listDeductions({ familyId }),
    ])

    if (sequence !== loadSequence) return
    if (!recipientData) {
      notFound.value = true
      return
    }

    recipient.value = recipientData
    deduction.value = deductions.find((item) => Number(item.familyId) === familyId) ?? null
  } catch (error) {
    if (sequence !== loadSequence) return
    if (isRecipientNotFound(error)) notFound.value = true
    else loadError.value = error.message || '수증자 정보를 불러오지 못했습니다.'
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}

async function openGiftStatus() {
  if (!recipient.value || openingStatus.value) return

  openingStatus.value = true
  try {
    const familyId = Number(recipient.value.familyId)
    const isLoaded = store.state.families.some((family) => family.id === familyId)
    if (!isLoaded) await store.ensureStatusLoaded({ force: true })

    store.selectFamily(familyId)
    await router.push({ name: 'status' })
  } catch (error) {
    store.showToast(error.message || '증여 현황을 불러오지 못했습니다.', 'info')
  } finally {
    openingStatus.value = false
  }
}

watch(
  () => route.params.familyId,
  (familyId) => loadRecipient(familyId),
  { immediate: true },
)
</script>

<template>
  <div class="page recipient-detail-page">
    <AppHeader title="수증자 상세 정보" back />

    <main class="page-content recipient-detail-content">
      <section v-if="loading" class="recipient-state-card" role="status" aria-live="polite">
        <span class="recipient-loading-spinner" aria-hidden="true" />
        <h2>수증자 정보를 불러오고 있어요</h2>
        <p>잠시만 기다려 주세요.</p>
      </section>

      <section v-else-if="notFound" class="recipient-state-card" role="alert">
        <span class="recipient-state-icon"><AppIcon name="user" :size="24" /></span>
        <h2>수증자를 찾을 수 없어요</h2>
        <p>삭제되었거나 접근할 수 없는 수증자입니다. 마이페이지에서 목록을 다시 확인해 주세요.</p>
        <div class="recipient-state-actions">
          <button class="primary-button" type="button" @click="router.push({ name: 'my' })">
            마이페이지로 이동
          </button>
        </div>
      </section>

      <section v-else-if="loadError" class="recipient-state-card" role="alert">
        <span class="recipient-state-icon"><AppIcon name="info" :size="24" /></span>
        <h2>정보를 불러오지 못했어요</h2>
        <p>{{ loadError }}</p>
        <div class="recipient-state-actions">
          <button class="soft-button" type="button" @click="router.back()">이전 화면</button>
          <button
            class="primary-button"
            type="button"
            @click="loadRecipient(route.params.familyId)"
          >
            다시 시도
          </button>
        </div>
      </section>

      <template v-else-if="recipient">
        <section class="recipient-hero-card">
          <span class="recipient-detail-avatar">
            <img
              v-if="recipient.familyImg && !imageFailed"
              :src="recipient.familyImg"
              :alt="`${recipientName} 프로필`"
              @error="imageFailed = true"
            />
            <template v-else>{{ recipientName.slice(-2) }}</template>
          </span>
          <div class="recipient-hero-copy">
            <span class="section-kicker">RECIPIENT</span>
            <h2>{{ recipientName }}</h2>
            <p>{{ recipientRelation }}</p>
          </div>
          <span class="recipient-age-badge" :class="{ minor: recipient.isMinor }">
            {{ recipient.isMinor ? '미성년' : '성년' }}
          </span>
        </section>

        <section class="recipient-detail-section" aria-labelledby="recipient-basic-heading">
          <div class="section-heading-row">
            <div>
              <span class="section-kicker">PROFILE</span>
              <h2 id="recipient-basic-heading">기본 정보</h2>
            </div>
          </div>
          <dl class="recipient-info-list">
            <div>
              <dt>이름</dt>
              <dd>{{ recipientName }}</dd>
            </div>
            <div>
              <dt>관계</dt>
              <dd>{{ recipientRelation }}</dd>
            </div>
            <div>
              <dt>생년월일</dt>
              <dd>{{ displayDate(recipient.birthDate) }}</dd>
            </div>
            <div>
              <dt>성년 여부</dt>
              <dd>{{ recipient.isMinor ? '미성년' : '성년' }}</dd>
            </div>
            <div>
              <dt>등록일</dt>
              <dd>{{ displayDateTime(recipient.createdAt) }}</dd>
            </div>
            <div>
              <dt>최근 수정일</dt>
              <dd>{{ displayDateTime(recipient.updatedAt) }}</dd>
            </div>
          </dl>
        </section>

        <section class="recipient-detail-section" aria-labelledby="recipient-gift-heading">
          <div class="section-heading-row">
            <div>
              <span class="section-kicker">GIFT STATUS</span>
              <h2 id="recipient-gift-heading">증여 정보</h2>
            </div>
          </div>

          <div class="recipient-gift-summary">
            <article class="recipient-gift-primary">
              <span>최근 10년 증여금액</span>
              <strong>{{ displayMoney(deduction?.usedAmount) }}</strong>
              <small>
                {{ displayDate(deduction?.windowStartDate) }} ~
                {{ displayDate(deduction?.baseDate) }} 기준
              </small>
            </article>
            <div class="recipient-gift-grid">
              <article>
                <span>증여재산 공제 한도</span>
                <strong>{{ displayMoney(deduction?.deductionLimit) }}</strong>
              </article>
              <article>
                <span>남은 공제 금액</span>
                <strong>{{ displayMoney(deduction?.remainingAmount) }}</strong>
              </article>
              <article>
                <span>예정 증여금액</span>
                <strong>{{ displayMoney(deduction?.plannedAmount) }}</strong>
              </article>
              <article>
                <span>확정 증여 건수</span>
                <strong>{{ displayCount(deduction?.aggregatedCount) }}</strong>
              </article>
            </div>
          </div>

          <aside class="recipient-inline-notice">
            <AppIcon name="info" :size="18" />
            <p>
              <template v-if="deduction?.nextRenewalDate">
                다음 공제 한도 갱신일은
                <strong>{{ displayDate(deduction.nextRenewalDate) }}</strong
                >입니다.
              </template>
              <template v-else>다음 공제 한도 갱신일 정보가 없습니다.</template>
            </p>
          </aside>
        </section>

        <div class="recipient-detail-actions">
          <button
            class="primary-button full"
            type="button"
            :disabled="openingStatus"
            @click="openGiftStatus"
          >
            <AppIcon name="chart" :size="18" />
            {{ openingStatus ? '불러오는 중...' : '증여 현황 보기' }}
          </button>
          <button class="soft-button full" type="button" @click="router.back()">
            <AppIcon name="back" :size="17" /> 이전 화면으로 돌아가기
          </button>
        </div>
      </template>
    </main>
  </div>
</template>
