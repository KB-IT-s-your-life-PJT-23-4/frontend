<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, GIFT_STATUS } from '../api/apiAdapter'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import { useAppStore } from '../stores/appStore'
import { isMinorAt, relationLabel } from '../utils/deduction'
import { formatWon } from '../utils/finance'
import '../assets/css/recipient-detail.css'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const recipient = ref(null)
const deduction = ref(null)
const recentGiftDate = ref(null)
const loading = ref(true)
const loadError = ref('')
const notFound = ref(false)
const imageFailed = ref(false)
const openingStatus = ref(false)
const showDeleteModal = ref(false)
const deletingRecipient = ref(false)
let loadSequence = 0

const recipientName = computed(() => recipient.value?.familyName || '수증자')
const recipientRelation = computed(() => relationLabel(recipient.value?.relation) || '정보 없음')

function displayDate(value) {
  if (!value) return '정보 없음'
  return String(value).slice(0, 10).replaceAll('-', '.')
}

function displayMoney(value) {
  return value === null || value === undefined ? '정보 없음' : formatWon(value)
}

function isRecipientNotFound(error) {
  return error?.status === 404 || error?.status === 411 || error?.code === 411
}

function loadDemoRecipient(familyId) {
  const family = store.state.families.find((item) => Number(item.id) === familyId)
  if (!family) return false

  const latestGift = store.state.giftHistory.find(
    (gift) => Number(gift.familyId) === familyId && gift.status === GIFT_STATUS.COMPLETED,
  )
  const deductionLimit = family.deductionLimit ?? null

  recipient.value = {
    familyId: Number(family.id),
    familyName: family.name,
    relation: family.relationCode ?? family.relation,
    birthDate: family.birthDate,
    isMinor: family.isMinor ?? isMinorAt(family.birthDate),
    familyImg: family.familyImg ?? null,
    createdAt: family.createdAt ?? null,
  }
  deduction.value = {
    familyId: Number(family.id),
    usedAmount: family.giftedAmount ?? 0,
    remainingAmount:
      family.remainingDeduction ??
      (deductionLimit === null
        ? null
        : Math.max(0, deductionLimit - Number(family.giftedAmount ?? 0))),
    deductionLimit,
    nextRenewalDate:
      family.nextRenewalDate ?? (family.resetDate === '미정' ? null : family.resetDate),
  }
  recentGiftDate.value = latestGift?.date ?? null
  return true
}

async function loadRecipient(rawFamilyId) {
  const sequence = ++loadSequence
  const familyId = Number(rawFamilyId)

  recipient.value = null
  deduction.value = null
  recentGiftDate.value = null
  loadError.value = ''
  notFound.value = false
  imageFailed.value = false
  loading.value = true

  if (!Number.isSafeInteger(familyId) || familyId <= 0) {
    notFound.value = true
    loading.value = false
    return
  }

  if (api.isMock) {
    notFound.value = !loadDemoRecipient(familyId)
    loading.value = false
    return
  }

  try {
    const [recipientData, deductions, completedGifts] = await Promise.all([
      api.getFamily(familyId),
      api.listDeductions({ familyId }),
      api.listGifts({ familyId, status: GIFT_STATUS.COMPLETED }).catch(() => []),
    ])

    if (sequence !== loadSequence) return
    if (!recipientData) {
      notFound.value = true
      return
    }

    recipient.value = recipientData
    deduction.value = deductions.find((item) => Number(item.familyId) === familyId) ?? null
    recentGiftDate.value = completedGifts[0]?.giftDate ?? null
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

function closeDeleteModal() {
  if (!deletingRecipient.value) showDeleteModal.value = false
}

async function confirmDeleteRecipient() {
  if (!recipient.value || deletingRecipient.value) return

  deletingRecipient.value = true
  try {
    const familyId = Number(recipient.value.familyId)
    if (api.isMock) store.deleteDemoFamily(familyId)
    else await api.deleteFamily(familyId)

    showDeleteModal.value = false

    if (api.isMock) {
      store.showToast('수증자 정보가 삭제됐어요.')
    } else {
      try {
        await store.ensureStatusLoaded({ force: true })
        store.showToast('수증자 정보가 삭제됐어요.')
      } catch {
        store.showToast('수증자는 삭제됐지만 목록을 새로 불러오지 못했습니다.', 'info')
      }
    }

    recipient.value = null
    deduction.value = null
    recentGiftDate.value = null
    await router.replace({ name: 'my' })
  } catch (error) {
    const hasGiftHistory = error?.status === 409 || error?.code === 409
    store.showToast(
      hasGiftHistory
        ? '증여 이력이 있는 수증자는 삭제할 수 없습니다.'
        : error.message || '수증자 정보를 삭제하지 못했습니다.',
      'info',
    )
  } finally {
    deletingRecipient.value = false
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
        <div class="recipient-profile-stage" aria-hidden="true">
          <span class="recipient-detail-avatar">
            <img
              v-if="recipient.familyImg && !imageFailed"
              :src="recipient.familyImg"
              alt=""
              @error="imageFailed = true"
            />
            <template v-else>{{ recipientName.slice(-2) }}</template>
          </span>
        </div>

        <article class="recipient-detail-card" aria-labelledby="recipient-name-heading">
          <header class="recipient-card-header">
            <div>
              <h2 id="recipient-name-heading">{{ recipientName }}</h2>
              <p>{{ recipientRelation }}</p>
            </div>
            <span class="recipient-age-badge" :class="{ minor: recipient.isMinor }">
              {{ recipient.isMinor ? '미성년' : '성년' }}
            </span>
          </header>

          <section class="recipient-card-section" aria-labelledby="recipient-basic-heading">
            <h3 id="recipient-basic-heading">기본 정보</h3>
            <dl class="recipient-card-list">
              <div>
                <dt>생년월일</dt>
                <dd>{{ displayDate(recipient.birthDate) }}</dd>
              </div>
              <div>
                <dt>등록일</dt>
                <dd>{{ displayDate(recipient.createdAt) }}</dd>
              </div>
              <div>
                <dt>최근 증여일</dt>
                <dd>{{ displayDate(recentGiftDate) }}</dd>
              </div>
            </dl>
          </section>

          <section
            class="recipient-card-section recipient-gift-section"
            aria-labelledby="recipient-gift-heading"
          >
            <div class="recipient-section-heading">
              <h3 id="recipient-gift-heading">증여 정보</h3>
            </div>

            <dl class="recipient-card-list recipient-gift-list">
              <div>
                <dt>10년 누적 증여액</dt>
                <dd class="recipient-emphasis-amount">
                  {{ displayMoney(deduction?.usedAmount) }}
                </dd>
              </div>
              <div class="recipient-highlight-row">
                <dt>현재 남은 공제액</dt>
                <dd class="recipient-primary-amount">
                  {{ displayMoney(deduction?.remainingAmount) }}
                </dd>
              </div>
              <div>
                <dt>증여재산 공제 한도</dt>
                <dd>{{ displayMoney(deduction?.deductionLimit) }}</dd>
              </div>
              <div>
                <dt>다음 공제 가능일</dt>
                <dd class="recipient-emphasis-value">
                  {{ displayDate(deduction?.nextRenewalDate) }}
                </dd>
              </div>
            </dl>
          </section>

          <button class="recipient-delete-button" type="button" @click="showDeleteModal = true">
            삭제하기
          </button>
        </article>

        <button
          class="primary-button full recipient-status-button"
          type="button"
          :disabled="openingStatus"
          @click="openGiftStatus"
        >
          <AppIcon name="chart" :size="18" />
          {{ openingStatus ? '불러오는 중...' : '증여 현황 보기' }}
        </button>
      </template>
    </main>

    <ModalSheet
      :show="showDeleteModal"
      title="수증자를 삭제하시겠습니까?"
      description="삭제 후에는 수증자 정보를 복구할 수 없습니다. 증여 이력이 있으면 삭제할 수 없어요."
      danger
      @close="closeDeleteModal"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <template #actions>
        <button
          class="secondary-button"
          type="button"
          :disabled="deletingRecipient"
          @click="closeDeleteModal"
        >
          취소
        </button>
        <button
          class="danger-button"
          type="button"
          :disabled="deletingRecipient"
          @click="confirmDeleteRecipient"
        >
          {{ deletingRecipient ? '삭제 중...' : '삭제하기' }}
        </button>
      </template>
    </ModalSheet>
  </div>
</template>
