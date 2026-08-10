<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import DateField from '../components/common/DateField.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { RELATION_OPTIONS } from '../utils/deduction'
import { formatCompactWon } from '../utils/finance'
import { resolveProfileImageUrl } from '../utils/profileImage'
import '../assets/css/my-page.css'

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const showAddFamily = ref(false)
const showSettings = ref(false)
const showWithdrawal = ref(false)
const simulationToDelete = ref(null)
const savingFamily = ref(false)
const isLoggingOut = ref(false)
const isWithdrawing = ref(false)
const withdrawalError = ref('')
const userImageFailed = ref(false)
const failedFamilyImages = ref(new Set())
const displayUser = computed(() => authStore.user ?? store.state.user)
const displayName = computed(() => displayUser.value?.name?.trim() || '사용자')
const selectedHistoryFamilyId = ref(null)
const familySimulations = computed(() => {
  if (selectedHistoryFamilyId.value == null) return store.state.simulations

  return store.state.simulations.filter(
    (simulation) => Number(simulation.familyId) === selectedHistoryFamilyId.value,
  )
})

function simulationFamilyName(familyId) {
  return (
    store.state.families.find((family) => Number(family.id) === Number(familyId))?.name ?? '수증자'
  )
}
// 생년월일 입력 범위. min/max 를 주지 않으면 브라우저가 연도 칸을 6자리(최대 275760년)로 잡아
// 4자리를 채워도 월 칸으로 넘어가지 않는다. 범위를 좁히면 연도 4자리에서 자동으로 넘어간다.
// 미래 생년월일을 막는 역할도 겸한다.
const BIRTH_DATE_MIN = '1900-01-01'
const birthDateMax = new Date().toISOString().slice(0, 10)
// 백엔드 family.relation 은 ENUM(LINEAL_DESCENDANT/OTHER) 이라 코드로 보낸다.
const familyForm = reactive({
  name: '',
  birthDate: '',
})

function openFamilyDetail(familyId) {
  router.push({ name: 'recipient-detail', params: { familyId } })
}

function openProfileDetails() {
  router.push({ name: 'profile-detail' })
}

function openProfileEdit() {
  router.push({ name: 'profile-edit' })
}

function markFamilyImageFailed(familyId) {
  failedFamilyImages.value = new Set(failedFamilyImages.value).add(Number(familyId))
}

async function submitFamily() {
  if (!familyForm.name || !familyForm.birthDate || savingFamily.value) return
  savingFamily.value = true
  try {
    await store.addFamily({
      ...familyForm,
      relation: RELATION_OPTIONS[0].code,
    })
    familyForm.name = ''
    familyForm.birthDate = ''
    showAddFamily.value = false
  } catch (error) {
    store.showToast(error.message || '수증자를 등록하지 못했습니다.', 'info')
  } finally {
    savingFamily.value = false
  }
}

// 수증자 목록·증여 이력은 DB에서 온다(데모 모드에서는 목데이터 유지).
onMounted(() => {
  // 마이페이지를 열 때마다 GET /api/gs로 최신 DRAFT/SAVED 이력을 확인한다.
  store.ensureStatusLoaded({ force: true }).catch((error) => {
    store.showToast(
      error.status === 401
        ? '로그인이 만료됐어요. 다시 로그인해 주세요.'
        : error.message || '가족 정보를 불러오지 못했습니다.',
      'info',
    )
  })
})

function confirmSimulationDelete() {
  if (!simulationToDelete.value) return
  store.deleteSimulation(simulationToDelete.value.id)
  simulationToDelete.value = null
}

async function submitLogout() {
  if (isLoggingOut.value) return

  isLoggingOut.value = true
  try {
    await authStore.logout()
    store.showToast('로그아웃되었습니다.', 'info')
  } catch (error) {
    store.showToast(
      error.message || '서버 로그아웃 처리에 실패했지만 로그인 정보는 삭제했습니다.',
      'info',
    )
  } finally {
    isLoggingOut.value = false
    await router.replace('/login')
  }
}

function openWithdrawal() {
  if (store.isMock) {
    store.showToast('데모 모드에서는 회원탈퇴를 사용할 수 없습니다.', 'info')
    return
  }

  withdrawalError.value = ''
  showWithdrawal.value = true
}

function closeWithdrawal() {
  if (isWithdrawing.value) return

  withdrawalError.value = ''
  showWithdrawal.value = false
}

function withdrawalFailureMessage(error) {
  if (error?.status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  if (error?.status === 404) return '이미 탈퇴했거나 회원 정보를 찾을 수 없습니다.'
  return error?.message || '회원탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

async function submitWithdrawal() {
  if (isWithdrawing.value) return

  isWithdrawing.value = true
  withdrawalError.value = ''

  let result
  try {
    result = await authStore.withdrawAccount()
  } catch (error) {
    withdrawalError.value = withdrawalFailureMessage(error)
    return
  } finally {
    isWithdrawing.value = false
  }

  showWithdrawal.value = false
  await router.replace({ name: 'login' })
  store.showToast(
    result.cleanupFailed
      ? '회원탈퇴는 완료됐지만 브라우저 정보 일부를 정리하지 못했습니다.'
      : '회원탈퇴가 완료되었습니다.',
    result.cleanupFailed ? 'info' : 'success',
  )
}
</script>

<template>
  <div class="page my-page">
    <AppHeader />
    <div class="page-content my-content">
      <button
        class="profile-summary-card profile-summary-link"
        type="button"
        :aria-label="`${displayName}님 내 상세 정보 보기`"
        @click="openProfileDetails"
      >
        <div class="profile-avatar">
          <img
            v-if="displayUser.img && !userImageFailed"
            :src="resolveProfileImageUrl(displayUser.img)"
            alt=""
            @error="userImageFailed = true"
          />
          <template v-else>{{ displayName.slice(0, 1) }}</template>
        </div>
        <div class="profile-summary-copy">
          <h2>{{ displayName }}님</h2>
        </div>
        <AppIcon name="chevron" :size="19" />
      </button>

      <section class="mypage-section">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">FAMILY</span>
            <h2>가족 관계망</h2>
          </div>
          <button class="text-link" type="button" @click="showAddFamily = true">
            수증자 추가 <AppIcon name="plus" :size="16" />
          </button>
        </div>
        <div class="family-card-list">
          <button
            v-for="family in store.state.families"
            :key="family.id"
            class="family-profile-card"
            type="button"
            @click="openFamilyDetail(family.id)"
          >
            <span class="family-avatar" :class="family.tone">
              <img
                v-if="family.familyImg && !failedFamilyImages.has(Number(family.id))"
                :src="resolveProfileImageUrl(family.familyImg)"
                alt=""
                @error="markFamilyImageFailed(family.id)"
              />
              <template v-else>{{ family.name.slice(-2) }}</template>
            </span>
            <span class="family-profile-copy">
              <strong
                >{{ family.name }} <small>{{ family.relation }}</small></strong
              >
              <span
                >{{ family.birthDate }} · 최근 10년
                {{ formatCompactWon(family.giftedAmount) }}</span
              >
            </span>
            <AppIcon name="chevron" :size="17" />
          </button>
        </div>
      </section>

      <section class="mypage-menu-list">
        <button type="button" @click="showSettings = true">
          <span class="menu-icon"><AppIcon name="settings" :size="20" /></span>
          <span><strong>알림 및 앱 설정</strong></span>
          <AppIcon name="chevron" :size="17" />
        </button>
        <button type="button" @click="openProfileEdit">
          <span class="menu-icon"><AppIcon name="user" :size="20" /></span>
          <span
            ><strong>회원 정보 수정</strong></span>
          <AppIcon name="chevron" :size="17" />
        </button>
        <button
          type="button"
          @click="store.showToast('약관 화면은 실제 서비스 연동 시 제공돼요.', 'info')"
        >
          <span class="menu-icon"><AppIcon name="document" :size="20" /></span>
          <span
            ><strong>이용약관 · 개인정보 처리방침</strong
            ></span
          >
          <AppIcon name="chevron" :size="17" />
        </button>
      </section>

      <section class="mypage-section history-section">
        <div class="section-heading-row">
          <div>
            <span class="section-kicker">RECENT</span>
            <h2>시뮬레이션 이력</h2>
          </div>
          <span>{{ familySimulations.length }}건</span>
        </div>
        <section
          v-if="store.state.families.length"
          class="family-switcher history-family-switcher"
          aria-label="시뮬레이션 이력 수증자 선택"
        >
          <button
            class="all-family-tab"
            type="button"
            :class="{ active: selectedHistoryFamilyId == null }"
            @click="selectedHistoryFamilyId = null"
          >
            전체
          </button>
          <button
            v-for="family in store.state.families"
            :key="family.id"
            type="button"
            :class="{ active: Number(family.id) === selectedHistoryFamilyId }"
            @click="selectedHistoryFamilyId = Number(family.id)"
          >
            {{ family.name }}
          </button>
        </section>
        <div v-if="familySimulations.length" class="simulation-history-list">
          <article v-for="item in familySimulations" :key="item.id">
            <div class="history-topline">
              <span v-if="selectedHistoryFamilyId == null">
                {{ simulationFamilyName(item.familyId) }} 님
              </span>
              <button
                v-if="item.source !== 'server'"
                type="button"
                aria-label="시뮬레이션 이력 삭제"
                @click="simulationToDelete = item"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
            <h3>{{ item.date }}</h3>
            <p>
              증여 {{ formatCompactWon(item.amount) }} · 예상 세금
              {{ item.tax == null ? '미확정' : formatCompactWon(item.tax) }}
            </p>
            <p v-if="item.source === 'server'">
              예상 수익률 {{ item.minimumReturnRate }}% ~ {{ item.maximumReturnRate }}%
            </p>
            <RouterLink
              class="soft-button full"
              :to="{
                name: 'simulation',
                query: item.source === 'server' ? { simulationId: item.id } : {},
              }"
            >
              {{ item.source === 'server' ? '결과 다시 보기' : '새 조건으로 비교하기' }}
            </RouterLink>
          </article>
        </div>
        <div v-else class="simulation-history-empty">
          <span><AppIcon name="document" :size="21" /></span>
          <strong>아직 시뮬레이션 이력이 없어요</strong>
          <p>선택한 수증자의 증여 시뮬레이션을 실행하면 이곳에서 다시 확인할 수 있어요.</p>
        </div>
      </section>

      <div class="mypage-footer-actions">
        <button type="button" :disabled="isLoggingOut" @click="submitLogout">
          {{ isLoggingOut ? '로그아웃 중...' : '로그아웃' }}
        </button>
        <button type="button" @click="store.resetDemo">데모 초기화</button>
        <button class="withdrawal-text-button" type="button" @click="openWithdrawal">
          회원탈퇴
        </button>
      </div>
      <p class="version-label">미리줌 데모 1.0</p>
    </div>

    <ModalSheet
      :show="showAddFamily"
      title="수증자 정보를 등록할까요?"
      description="이름과 관계, 생년월일을 입력하면 가족별 증여 한도를 따로 관리할 수 있어요."
      @close="showAddFamily = false"
    >
      <form id="family-form" class="modal-form" @submit.prevent="submitFamily">
        <label>
          <span>이름</span>
          <input
            v-model.trim="familyForm.name"
            type="text"
            placeholder="이름을 입력하세요"
            required
          />
        </label>
        <label>
          <span>관계</span>
          <input :value="RELATION_OPTIONS[0].label" type="text" readonly aria-readonly="true" />
        </label>
        <div class="date-field-row">
          <span>생년월일</span>
          <DateField
            v-model="familyForm.birthDate"
            :min="BIRTH_DATE_MIN"
            :max="birthDateMax"
            placeholder="생년월일을 선택하세요"
            aria-label="생년월일 선택"
          />
        </div>
      </form>
      <template #actions>
        <button class="secondary-button" type="button" @click="showAddFamily = false">취소</button>
        <!-- 생년월일은 DateField(button) 이라 네이티브 required 검증이 안 걸린다. 버튼으로 막는다. -->
        <button
          class="primary-button"
          type="submit"
          form="family-form"
          :disabled="savingFamily || !familyForm.birthDate"
        >
          {{ savingFamily ? '등록 중...' : '등록' }}
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="showSettings"
      title="알림 및 앱 설정"
      description="필요한 소식만 선택해서 받아보세요."
      @close="showSettings = false"
    >
      <div class="settings-list">
        <button type="button" @click="store.toggleSetting('giftSchedule')">
          <span><strong>증여 일정 알림</strong><small>신고 기한과 증여 예정일</small></span>
          <span class="toggle" :class="{ on: store.state.settings.giftSchedule }"><i /></span>
        </button>
        <button type="button" @click="store.toggleSetting('productNews')">
          <span><strong>금융상품 알림</strong><small>금리와 상품 정보 업데이트</small></span>
          <span class="toggle" :class="{ on: store.state.settings.productNews }"><i /></span>
        </button>
        <button type="button" @click="store.toggleSetting('serviceNotice')">
          <span><strong>서비스 공지</strong><small>새 기능과 점검 안내</small></span>
          <span class="toggle" :class="{ on: store.state.settings.serviceNotice }"><i /></span>
        </button>
      </div>
      <template #actions>
        <button class="primary-button full" type="button" @click="showSettings = false">
          완료
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="Boolean(simulationToDelete)"
      title="이 이력을 삭제할까요?"
      description="삭제된 시뮬레이션 결과는 다시 확인할 수 없어요."
      danger
      @close="simulationToDelete = null"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <template #actions>
        <button class="secondary-button" type="button" @click="simulationToDelete = null">
          취소
        </button>
        <button class="danger-button" type="button" @click="confirmSimulationDelete">
          삭제하기
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="showWithdrawal"
      title="회원탈퇴"
      description="정말 회원탈퇴를 진행하시겠습니까? 탈퇴 후에는 회원 정보와 저장된 데이터 복구가 어려울 수 있습니다."
      danger
      @close="closeWithdrawal"
    >
      <p v-if="withdrawalError" class="withdrawal-error" role="alert">
        {{ withdrawalError }}
      </p>
      <template #actions>
        <button
          class="secondary-button"
          type="button"
          :disabled="isWithdrawing"
          @click="closeWithdrawal"
        >
          취소
        </button>
        <button
          class="danger-button"
          type="button"
          :disabled="isWithdrawing"
          :aria-busy="isWithdrawing"
          @click="submitWithdrawal"
        >
          {{ isWithdrawing ? '탈퇴 처리 중...' : '탈퇴하기' }}
        </button>
      </template>
    </ModalSheet>
  </div>
</template>
