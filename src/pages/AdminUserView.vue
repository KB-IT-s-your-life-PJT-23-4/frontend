<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { deleteAdminUser, getAdminUser, getAdminUsers } from '../api/adminUserApi'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import '../assets/css/admin-dashboard.css'
import '../assets/css/admin-user.css'

const PAGE_SIZE = 20
const numberFormatter = new Intl.NumberFormat('ko-KR')
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const searchForm = reactive({ userId: '', email: '', name: '' })
const appliedSearch = reactive({ userId: '', email: '', name: '' })
const users = ref([])
const pagination = ref(null)
const listState = ref('loading')
const listError = ref('')
const searchError = ref('')
const selectedUserId = ref(null)
const selectedUser = ref(null)
const detailState = ref('idle')
const detailError = ref('')
const deleteTarget = ref(null)
const deletingUser = ref(false)
const deleteError = ref('')
const feedbackMessage = ref('')

const totalElements = computed(() => pagination.value?.totalElements ?? 0)
const currentPage = computed(() => pagination.value?.page ?? 0)
const pageButtons = computed(() => {
  const totalPages = pagination.value?.totalPages ?? 0
  if (!totalPages) return []

  const start = Math.max(0, Math.min(currentPage.value - 2, totalPages - 5))
  const end = Math.min(totalPages, start + 5)
  return Array.from({ length: end - start }, (_, index) => start + index)
})
const hasSearchCondition = computed(() =>
  Object.values(appliedSearch).some((value) => String(value).trim()),
)

function formatNumber(value) {
  return numberFormatter.format(value ?? 0)
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : dateTimeFormatter.format(date)
}

function roleLabel(role) {
  const labels = {
    ROOT: '최고 관리자',
    MIDDLE: '중간 관리자',
    DEFAULT: '일반 관리자',
    USER: '일반 회원',
  }
  return labels[String(role ?? '').toUpperCase()] || role || '-'
}

function validateSearch() {
  const userId = String(searchForm.userId).trim()
  if (userId && (!/^\d+$/.test(userId) || Number(userId) < 1)) {
    searchError.value = '회원 ID는 1 이상의 숫자로 입력해주세요.'
    return false
  }
  searchError.value = ''
  return true
}

async function loadUsers(page = 0) {
  listState.value = 'loading'
  listError.value = ''
  selectedUserId.value = null
  selectedUser.value = null
  detailState.value = 'idle'

  try {
    const data = await getAdminUsers({ ...appliedSearch, page, size: PAGE_SIZE })
    users.value = Array.isArray(data?.users) ? data.users : []
    pagination.value = data?.pagination ?? null
    listState.value = users.value.length ? 'success' : 'empty'
  } catch (error) {
    users.value = []
    pagination.value = null
    listState.value = 'error'
    listError.value = error.message || '회원 목록을 불러오지 못했습니다.'
  }
}

async function submitSearch() {
  if (!validateSearch()) return
  Object.assign(appliedSearch, {
    userId: String(searchForm.userId).trim(),
    email: searchForm.email.trim(),
    name: searchForm.name.trim(),
  })
  await loadUsers(0)
}

async function resetSearch() {
  Object.assign(searchForm, { userId: '', email: '', name: '' })
  Object.assign(appliedSearch, { userId: '', email: '', name: '' })
  searchError.value = ''
  await loadUsers(0)
}

async function selectUser(userId) {
  selectedUserId.value = userId
  selectedUser.value = null
  detailState.value = 'loading'
  detailError.value = ''

  try {
    selectedUser.value = await getAdminUser(userId)
    detailState.value = selectedUser.value ? 'success' : 'empty'
  } catch (error) {
    detailState.value = 'error'
    detailError.value = error.message || '회원 상세 정보를 불러오지 못했습니다.'
  }
}

function changePage(page) {
  if (page === currentPage.value || page < 0 || page >= (pagination.value?.totalPages ?? 0)) return
  loadUsers(page)
}

function openDeleteModal(user) {
  deleteTarget.value = user
  deleteError.value = ''
}

function closeDeleteModal() {
  if (deletingUser.value) return
  deleteTarget.value = null
  deleteError.value = ''
}

async function confirmDeleteUser() {
  if (!deleteTarget.value || deletingUser.value) return

  deletingUser.value = true
  deleteError.value = ''
  feedbackMessage.value = ''
  const deletedUserId = deleteTarget.value.userId
  const targetPage =
    users.value.length === 1 && currentPage.value > 0 ? currentPage.value - 1 : currentPage.value

  try {
    await deleteAdminUser(deletedUserId)
    deleteTarget.value = null
    feedbackMessage.value = `회원 #${deletedUserId}을(를) 삭제했습니다.`
    await loadUsers(targetPage)
  } catch (error) {
    deleteError.value = error.message || '회원을 삭제하지 못했습니다.'
  } finally {
    deletingUser.value = false
  }
}

onMounted(() => loadUsers())
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-user-title">
      <div>
        <span class="admin-dashboard-heading__eyebrow">MEMBER MANAGEMENT</span>
        <h1 id="admin-user-title">회원 관리</h1>
        <p>회원 기본 정보와 서비스 이용 현황을 검색하고 확인하세요.</p>
      </div>
      <div class="admin-user-heading-summary">
        <span>검색 결과</span>
        <strong>{{ formatNumber(totalElements) }}<small>명</small></strong>
      </div>
    </section>

    <section class="admin-user-search admin-panel" aria-labelledby="admin-user-search-title">
      <div class="admin-panel__heading">
        <div>
          <span>SEARCH FILTER</span>
          <h2 id="admin-user-search-title">회원 검색</h2>
        </div>
        <AppIcon name="user" :size="21" />
      </div>

      <form class="admin-user-search__form" novalidate @submit.prevent="submitSearch">
        <label>
          <span>회원 ID</span>
          <input
            v-model="searchForm.userId"
            type="text"
            inputmode="numeric"
            placeholder="예: 1001"
            aria-describedby="admin-user-search-error"
            @input="searchError = ''"
          />
        </label>
        <label>
          <span>이메일</span>
          <input v-model="searchForm.email" type="search" placeholder="이메일 일부 또는 전체" />
        </label>
        <label>
          <span>이름</span>
          <input v-model="searchForm.name" type="search" placeholder="이름 일부 또는 전체" />
        </label>
        <div class="admin-user-search__actions">
          <button class="admin-user-button is-secondary" type="button" @click="resetSearch">
            초기화
          </button>
          <button class="admin-user-button is-primary" type="submit">
            <AppIcon name="user" :size="16" />
            검색
          </button>
        </div>
      </form>
      <p v-if="searchError" id="admin-user-search-error" class="admin-user-form-error" role="alert">
        {{ searchError }}
      </p>
    </section>

    <p v-if="feedbackMessage" class="admin-user-feedback" role="status">
      {{ feedbackMessage }}
    </p>

    <div class="admin-user-content-grid">
      <section class="admin-user-list admin-panel" aria-labelledby="admin-user-list-title">
        <div class="admin-panel__heading admin-user-list__heading">
          <div>
            <span>MEMBER LIST</span>
            <h2 id="admin-user-list-title">회원 목록</h2>
          </div>
          <p v-if="pagination">
            총 {{ formatNumber(pagination.totalElements) }}명 · {{ currentPage + 1 }} /
            {{ Math.max(pagination.totalPages, 1) }} 페이지
          </p>
        </div>

        <div v-if="listState === 'loading'" class="admin-user-state" aria-live="polite">
          <span class="admin-loading-spinner" aria-hidden="true" />
          <div>
            <strong>회원 목록을 불러오는 중입니다.</strong><small>잠시만 기다려주세요.</small>
          </div>
        </div>
        <div v-else-if="listState === 'error'" class="admin-user-state is-error" role="alert">
          <AppIcon name="info" :size="27" />
          <div>
            <strong>회원 목록을 불러오지 못했습니다.</strong><small>{{ listError }}</small>
          </div>
          <button type="button" @click="loadUsers(currentPage)">다시 시도</button>
        </div>
        <div v-else-if="listState === 'empty'" class="admin-user-state">
          <AppIcon name="user" :size="28" />
          <div>
            <strong>조건에 맞는 회원이 없습니다.</strong>
            <small>{{
              hasSearchCondition ? '검색 조건을 바꿔 다시 시도해보세요.' : '등록된 회원이 없습니다.'
            }}</small>
          </div>
        </div>

        <template v-else>
          <div class="admin-user-table-wrap">
            <table class="admin-user-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">회원</th>
                  <th scope="col">가입일</th>
                  <th scope="col">수정일</th>
                  <th scope="col">권한</th>
                  <th scope="col">상태</th>
                  <th scope="col">수증자</th>
                  <th scope="col">증여</th>
                  <th scope="col">시뮬레이션</th>
                  <th scope="col"><span class="sr-only">상세 조회</span></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in users"
                  :key="user.userId"
                  :class="{ 'is-selected': selectedUserId === user.userId }"
                >
                  <td>
                    <strong>#{{ user.userId }}</strong>
                  </td>
                  <td>
                    <span class="admin-user-identity">
                      <strong>{{ user.name || '이름 미등록' }}</strong>
                      <small>{{ user.email || '이메일 미등록' }}</small>
                    </span>
                  </td>
                  <td>{{ formatDateTime(user.createdAt) }}</td>
                  <td>{{ formatDateTime(user.updatedAt) }}</td>
                  <td>
                    <span class="admin-user-role">{{ roleLabel(user.role) }}</span>
                  </td>
                  <td>
                    <span v-if="user.accountStatusAvailable">{{ user.accountStatus || '-' }}</span>
                    <span v-else class="admin-user-unavailable">미지원</span>
                  </td>
                  <td>{{ formatNumber(user.recipientCount) }}</td>
                  <td>{{ formatNumber(user.giftCount) }}</td>
                  <td>{{ formatNumber(user.simulationCount) }}</td>
                  <td>
                    <button
                      type="button"
                      class="admin-user-detail-button"
                      @click="selectUser(user.userId)"
                    >
                      상세
                      <AppIcon name="chevron" :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav
            v-if="pagination?.totalPages > 1"
            class="admin-user-pagination"
            aria-label="회원 목록 페이지"
          >
            <button
              type="button"
              :disabled="!pagination.hasPrevious"
              aria-label="이전 페이지"
              @click="changePage(currentPage - 1)"
            >
              <AppIcon name="back" :size="15" />
            </button>
            <button
              v-for="page in pageButtons"
              :key="page"
              type="button"
              :class="{ 'is-active': page === currentPage }"
              :aria-current="page === currentPage ? 'page' : undefined"
              @click="changePage(page)"
            >
              {{ page + 1 }}
            </button>
            <button
              type="button"
              :disabled="!pagination.hasNext"
              aria-label="다음 페이지"
              @click="changePage(currentPage + 1)"
            >
              <AppIcon name="chevron" :size="15" />
            </button>
          </nav>
        </template>
      </section>

      <aside class="admin-user-detail admin-panel" aria-labelledby="admin-user-detail-title">
        <div class="admin-panel__heading">
          <div>
            <span>MEMBER DETAIL</span>
            <h2 id="admin-user-detail-title">회원 상세</h2>
          </div>
          <AppIcon name="document" :size="21" />
        </div>

        <div v-if="detailState === 'idle'" class="admin-user-detail__empty">
          <span><AppIcon name="user" :size="28" /></span>
          <strong>회원을 선택해주세요.</strong>
          <p>목록에서 상세 버튼을 누르면 회원 정보와 이용 현황을 확인할 수 있습니다.</p>
        </div>
        <div
          v-else-if="detailState === 'loading'"
          class="admin-user-detail__empty"
          aria-live="polite"
        >
          <span class="admin-loading-spinner" aria-hidden="true" />
          <strong>상세 정보를 불러오는 중입니다.</strong>
        </div>
        <div
          v-else-if="detailState === 'error'"
          class="admin-user-detail__empty is-error"
          role="alert"
        >
          <span><AppIcon name="info" :size="28" /></span>
          <strong>상세 정보를 불러오지 못했습니다.</strong>
          <p>{{ detailError }}</p>
          <button type="button" @click="selectUser(selectedUserId)">다시 시도</button>
        </div>
        <div v-else-if="detailState === 'success'" class="admin-user-detail__body">
          <div class="admin-user-detail__profile">
            <span>{{ selectedUser.name?.slice(0, 1) || '?' }}</span>
            <div>
              <strong>{{ selectedUser.name || '이름 미등록' }}</strong>
              <small>{{ selectedUser.email || '이메일 미등록' }}</small>
            </div>
          </div>

          <dl class="admin-user-detail__info">
            <div>
              <dt>회원 ID</dt>
              <dd>#{{ selectedUser.userId }}</dd>
            </div>
            <div>
              <dt>권한</dt>
              <dd>{{ roleLabel(selectedUser.role) }}</dd>
            </div>
            <div>
              <dt>가입일</dt>
              <dd>{{ formatDateTime(selectedUser.createdAt) }}</dd>
            </div>
            <div>
              <dt>수정일</dt>
              <dd>{{ formatDateTime(selectedUser.updatedAt) }}</dd>
            </div>
          </dl>

          <div class="admin-user-detail__usage" aria-label="서비스 이용 현황">
            <div>
              <span>수증자</span
              ><strong>{{ formatNumber(selectedUser.recipientCount) }}<small>명</small></strong>
            </div>
            <div>
              <span>증여</span
              ><strong>{{ formatNumber(selectedUser.giftCount) }}<small>건</small></strong>
            </div>
            <div>
              <span>시뮬레이션</span
              ><strong>{{ formatNumber(selectedUser.simulationCount) }}<small>건</small></strong>
            </div>
          </div>

          <div class="admin-user-detail__status">
            <span>계정 상태</span>
            <strong v-if="selectedUser.accountStatusAvailable">{{
              selectedUser.accountStatus || '-'
            }}</strong>
            <strong v-else class="is-unavailable">상태 관리 미지원</strong>
            <p v-if="!selectedUser.accountStatusAvailable">
              현재 API에서 정지·탈퇴 상태를 제공하지 않습니다.
            </p>
          </div>

          <button
            class="admin-user-delete-button"
            type="button"
            @click="openDeleteModal(selectedUser)"
          >
            <AppIcon name="trash" :size="16" />
            회원 삭제
          </button>
        </div>
      </aside>
    </div>

    <ModalSheet
      :show="Boolean(deleteTarget)"
      title="정말 해당 회원을 삭제하시겠습니까?"
      description="회원 정보와 ON DELETE CASCADE로 연결된 수증자·증여·시뮬레이션 데이터가 함께 삭제되며 복구할 수 없습니다."
      danger
      @close="closeDeleteModal"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <p v-if="deleteTarget" class="admin-user-delete-target">
        삭제 대상: #{{ deleteTarget.userId }} {{ deleteTarget.name }} ({{ deleteTarget.email }})
      </p>
      <p v-if="deleteError" class="admin-user-delete-error" role="alert">{{ deleteError }}</p>
      <template #actions>
        <button
          class="secondary-button"
          type="button"
          :disabled="deletingUser"
          @click="closeDeleteModal"
        >
          취소
        </button>
        <button
          class="danger-button"
          type="button"
          :disabled="deletingUser"
          @click="confirmDeleteUser"
        >
          {{ deletingUser ? '삭제 중...' : '삭제하기' }}
        </button>
      </template>
    </ModalSheet>
  </AdminLayout>
</template>
