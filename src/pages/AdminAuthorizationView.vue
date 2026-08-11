<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  changeAdminRole,
  createAdminAccount,
  deleteAdminAccount,
  getAdminAuthPage,
  getCurrentAdmin,
} from '../api/adminAuthApi'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import '../assets/css/admin-dashboard.css'
import '../assets/css/admin-authorization.css'

const PAGE_SIZE = 10
const roleOptions = [
  {
    value: 'ROOT',
    label: '최고 관리자',
  },
  {
    value: 'MIDDLE',
    label: '중간 관리자',
  },
  {
    value: 'DEFAULT',
    label: '일반 관리자',
  },
]

const currentAdmin = ref(null)
const admins = ref([])
const pagination = ref(null)
const listState = ref('loading')
const listError = ref('')
const identityError = ref('')
const feedbackMessage = ref('')
const selectedAdmin = ref(null)

const showCreateModal = ref(false)
const createDraft = ref(emptyCreateDraft())
const createFormError = ref('')
const isCreatingAdmin = ref(false)
const isCreateRoleOpen = ref(false)

const showRoleModal = ref(false)
const roleDraft = ref('DEFAULT')
const roleFormError = ref('')
const isChangingRole = ref(false)

const deleteTarget = ref(null)
const deleteError = ref('')
const isDeleting = ref(false)

const currentPage = computed(() => pagination.value?.page ?? 0)
const totalElements = computed(() => pagination.value?.totalElements ?? 0)
const isRoot = computed(() => String(currentAdmin.value?.role ?? '').toUpperCase() === 'ROOT')
const roleCounts = computed(() =>
  roleOptions.reduce((counts, role) => {
    counts[role.value] = admins.value.filter((admin) => admin.role === role.value).length
    return counts
  }, {}),
)
const pageButtons = computed(() => {
  const total = pagination.value?.totalPages ?? 0
  if (total <= 1) return []
  const start = Math.max(0, Math.min(currentPage.value - 2, total - 5))
  return Array.from({ length: Math.min(5, total) }, (_, index) => start + index)
})

function roleInfo(role) {
  return roleOptions.find((option) => option.value === String(role ?? '').toUpperCase())
}

function roleLabel(role) {
  return roleInfo(role)?.label ?? role ?? '-'
}

function isSelf(admin) {
  return Boolean(admin && currentAdmin.value?.userId === admin.adminId)
}

function emptyCreateDraft() {
  return {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'DEFAULT',
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function errorMessage(error, fallback) {
  if (error?.status === 403) return '최고 관리자만 권한을 변경할 수 있습니다.'
  if (error?.status === 404) return '대상 관리자를 찾을 수 없습니다.'
  if (error?.status === 409) return '이미 사용 중인 이메일 또는 전화번호입니다.'
  if (error?.status === 400) return '요청한 관리자 권한이 올바르지 않습니다.'
  return error?.message || fallback
}

async function loadCurrentAdmin() {
  try {
    currentAdmin.value = await getCurrentAdmin()
    identityError.value = ''
  } catch (error) {
    currentAdmin.value = null
    identityError.value = errorMessage(error, '현재 관리자 권한을 확인하지 못했습니다.')
  }
}

async function loadAdmins(page = 0) {
  listState.value = 'loading'
  listError.value = ''
  try {
    const data = await getAdminAuthPage({ page, size: PAGE_SIZE })
    admins.value = Array.isArray(data?.admins) ? data.admins : []
    pagination.value = data?.pagination ?? null
    listState.value = admins.value.length ? 'success' : 'empty'

    if (selectedAdmin.value) {
      selectedAdmin.value =
        admins.value.find((admin) => admin.adminId === selectedAdmin.value.adminId) ?? null
    }
  } catch (error) {
    admins.value = []
    pagination.value = null
    selectedAdmin.value = null
    listState.value = 'error'
    listError.value = errorMessage(error, '관리자 목록을 불러오지 못했습니다.')
  }
}

async function initialize() {
  await Promise.all([loadCurrentAdmin(), loadAdmins(0)])
}

function selectAdmin(admin) {
  selectedAdmin.value = admin
}

function openCreateAdmin() {
  if (!isRoot.value) return
  createDraft.value = emptyCreateDraft()
  createFormError.value = ''
  isCreateRoleOpen.value = false
  showCreateModal.value = true
}

function closeCreateAdmin() {
  if (isCreatingAdmin.value) return
  isCreateRoleOpen.value = false
  showCreateModal.value = false
}

function selectCreateRole(role) {
  createDraft.value.role = role
  isCreateRoleOpen.value = false
}

function closeCreateRoleOnFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isCreateRoleOpen.value = false
  }
}

function validateCreateDraft() {
  const email = createDraft.value.email.trim()
  const password = createDraft.value.password
  const name = createDraft.value.name.trim()
  const phone = createDraft.value.phone.trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return '올바른 이메일을 입력해주세요.'
  }
  if (password.length < 8 || password.length > 64) {
    return '비밀번호는 8자 이상 64자 이하로 입력해주세요.'
  }
  if (!/^[\x21-\x7e]+$/.test(password)) {
    return '비밀번호는 공백 없는 영문, 숫자, 특수문자로 입력해주세요.'
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return '비밀번호는 영문과 숫자를 포함해야 합니다.'
  }
  if (![...password].some((character) => !/[A-Za-z0-9]/.test(character))) {
    return '비밀번호는 특수문자를 포함해야 합니다.'
  }
  if (password !== createDraft.value.confirmPassword) {
    return '비밀번호 확인이 일치하지 않습니다.'
  }
  if (name.length < 2 || name.length > 100) {
    return '이름은 2자 이상 100자 이하로 입력해주세요.'
  }
  if (!/^01[016789]-\d{3,4}-\d{4}$/.test(phone)) {
    return '전화번호를 010-1234-5678 형식으로 입력해주세요.'
  }
  if (!roleOptions.some((role) => role.value === createDraft.value.role)) {
    return '관리자 역할을 선택해주세요.'
  }
  return ''
}

async function submitCreateAdmin() {
  if (!isRoot.value) return
  const validationError = validateCreateDraft()
  if (validationError) {
    createFormError.value = validationError
    return
  }

  isCreatingAdmin.value = true
  createFormError.value = ''
  try {
    const createdAdmin = await createAdminAccount({
      email: createDraft.value.email.trim().toLowerCase(),
      password: createDraft.value.password,
      name: createDraft.value.name.trim(),
      phone: createDraft.value.phone.trim(),
      role: createDraft.value.role,
    })
    showCreateModal.value = false
    isCreateRoleOpen.value = false
    feedbackMessage.value = `${createdAdmin?.name || createDraft.value.name} 관리자 계정을 생성했습니다.`
    await loadAdmins(0)
    selectedAdmin.value =
      admins.value.find((admin) => admin.adminId === createdAdmin?.adminId) ?? null
  } catch (error) {
    createFormError.value = errorMessage(error, '관리자 계정을 생성하지 못했습니다.')
  } finally {
    isCreatingAdmin.value = false
  }
}

function openRoleChange(admin = selectedAdmin.value) {
  if (!admin || !isRoot.value || isSelf(admin)) return
  selectedAdmin.value = admin
  roleDraft.value = admin.role
  roleFormError.value = ''
  showRoleModal.value = true
}

async function submitRoleChange() {
  if (!selectedAdmin.value || !isRoot.value || isSelf(selectedAdmin.value)) return
  if (!roleOptions.some((role) => role.value === roleDraft.value)) {
    roleFormError.value = '변경할 관리자 역할을 선택해주세요.'
    return
  }

  isChangingRole.value = true
  roleFormError.value = ''
  try {
    await changeAdminRole(selectedAdmin.value.adminId, roleDraft.value)
    showRoleModal.value = false
    feedbackMessage.value = `${selectedAdmin.value.name || selectedAdmin.value.email} 관리자의 권한을 ${roleLabel(roleDraft.value)}로 변경했습니다.`
    await loadAdmins(currentPage.value)
  } catch (error) {
    roleFormError.value = errorMessage(error, '관리자 권한을 변경하지 못했습니다.')
  } finally {
    isChangingRole.value = false
  }
}

function openDelete(admin = selectedAdmin.value) {
  if (!admin || !isRoot.value || isSelf(admin)) return
  deleteTarget.value = admin
  deleteError.value = ''
}

async function confirmDelete() {
  if (!deleteTarget.value || !isRoot.value || isSelf(deleteTarget.value)) return
  isDeleting.value = true
  deleteError.value = ''
  const target = deleteTarget.value
  try {
    await deleteAdminAccount(target.adminId)
    deleteTarget.value = null
    selectedAdmin.value = null
    feedbackMessage.value = `${target.name || target.email} 관리자 계정을 삭제했습니다.`
    const targetPage =
      admins.value.length === 1 ? Math.max(0, currentPage.value - 1) : currentPage.value
    await loadAdmins(targetPage)
  } catch (error) {
    deleteError.value = errorMessage(error, '관리자 계정을 삭제하지 못했습니다.')
  } finally {
    isDeleting.value = false
  }
}

onMounted(initialize)
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-authorization-title">
      <div>
        <h1 id="admin-authorization-title" style="margin-top: 40px">권한 관리</h1>
        <p>관리자 계정의 역할을 확인하고 운영 권한을 조정하세요.</p>
      </div>
      <div class="admin-authorization-heading-actions">
        <div class="admin-authorization-heading-summary">
          <span>전체 관리자</span>
          <strong>{{ totalElements.toLocaleString('ko-KR') }}<small>명</small></strong>
          <em v-if="currentAdmin">내 권한 · {{ roleLabel(currentAdmin.role) }}</em>
        </div>
        <button
          type="button"
          class="admin-authorization-create-button"
          :disabled="!isRoot"
          :title="!isRoot ? '최고 관리자만 계정을 생성할 수 있습니다.' : undefined"
          @click="openCreateAdmin"
        >
          <AppIcon name="plus" :size="16" /> 관리자 생성
        </button>
      </div>
    </section>

    <p v-if="feedbackMessage" class="admin-authorization-feedback" role="status">
      {{ feedbackMessage }}
      <button type="button" aria-label="알림 닫기" @click="feedbackMessage = ''">×</button>
    </p>

    <div v-if="identityError" class="admin-authorization-notice is-error" role="alert">
      <AppIcon name="info" :size="19" />
      <p>
        <strong>현재 권한을 확인하지 못했습니다.</strong><span>{{ identityError }}</span>
      </p>
      <button type="button" @click="loadCurrentAdmin">다시 확인</button>
    </div>
    <div v-else-if="!isRoot" class="admin-authorization-notice" role="status">
      <AppIcon name="shield" :size="19" />
      <p>
        <strong>읽기 전용 권한입니다.</strong
        ><span>관리자 역할 변경과 계정 삭제는 최고 관리자만 실행할 수 있습니다.</span>
      </p>
    </div>

    <section class="admin-authorization-role-summary" aria-label="현재 페이지 역할별 관리자 수">
      <article v-for="role in roleOptions" :key="role.value" class="admin-panel">
        <span class="admin-authorization-role-badge" :class="`is-${role.value.toLowerCase()}`">{{
          role.label
        }}</span>
        <strong>{{ roleCounts[role.value] ?? 0 }}<small>명</small></strong>
        <p>{{ role.description }}</p>
      </article>
    </section>

    <div class="admin-authorization-content-grid">
      <section
        class="admin-panel admin-authorization-list"
        aria-labelledby="admin-authorization-list-title"
      >
        <div class="admin-panel__heading admin-authorization-list__heading">
          <div>
            <h2 id="admin-authorization-list-title">관리자 목록</h2>
          </div>
          <p v-if="pagination">
            {{ currentPage + 1 }} / {{ Math.max(pagination.totalPages, 1) }} 페이지
          </p>
        </div>

        <div v-if="listState === 'loading'" class="admin-authorization-state" aria-live="polite">
          <span class="admin-loading-spinner" aria-hidden="true" /><strong
            >관리자 목록을 불러오는 중입니다.</strong
          >
        </div>
        <div
          v-else-if="listState === 'error'"
          class="admin-authorization-state is-error"
          role="alert"
        >
          <AppIcon name="info" :size="27" /><strong>관리자 목록을 불러오지 못했습니다.</strong>
          <p>{{ listError }}</p>
          <button type="button" @click="loadAdmins(currentPage)">다시 시도</button>
        </div>
        <div v-else-if="listState === 'empty'" class="admin-authorization-state">
          <AppIcon name="user" :size="29" /><strong>등록된 관리자가 없습니다.</strong>
        </div>

        <template v-else>
          <div class="admin-authorization-table-wrap">
            <table class="admin-authorization-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>관리자</th>
                  <th>역할</th>
                  <th>등록일</th>
                  <th>최근 수정</th>
                  <th><span class="sr-only">상세</span></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="admin in admins"
                  :key="admin.adminId"
                  :class="{ 'is-selected': selectedAdmin?.adminId === admin.adminId }"
                >
                  <td data-label="ID">
                    <strong>#{{ admin.adminId }}</strong
                    ><small v-if="isSelf(admin)">내 계정</small>
                  </td>
                  <td data-label="관리자">
                    <span class="admin-authorization-identity"
                      ><strong>{{ admin.name || '이름 미등록' }}</strong
                      ><small>{{ admin.email || '이메일 미등록' }}</small></span
                    >
                  </td>
                  <td data-label="역할">
                    <span
                      class="admin-authorization-role-badge"
                      :class="`is-${String(admin.role).toLowerCase()}`"
                      >{{ roleLabel(admin.role) }}</span
                    >
                  </td>
                  <td data-label="등록일">{{ formatDateTime(admin.createdAt) }}</td>
                  <td data-label="최근 수정">{{ formatDateTime(admin.updatedAt) }}</td>
                  <td data-label="상세">
                    <button
                      type="button"
                      class="admin-authorization-detail-button"
                      @click="selectAdmin(admin)"
                    >
                      상세 <AppIcon name="chevron" :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav
            v-if="pagination?.totalPages > 1"
            class="admin-authorization-pagination"
            aria-label="관리자 목록 페이지"
          >
            <button
              type="button"
              :disabled="!pagination.hasPrevious"
              aria-label="이전 페이지"
              @click="loadAdmins(currentPage - 1)"
            >
              <AppIcon name="back" :size="15" />
            </button>
            <button
              v-for="page in pageButtons"
              :key="page"
              type="button"
              :class="{ 'is-active': page === currentPage }"
              :aria-current="page === currentPage ? 'page' : undefined"
              @click="loadAdmins(page)"
            >
              {{ page + 1 }}
            </button>
            <button
              type="button"
              :disabled="!pagination.hasNext"
              aria-label="다음 페이지"
              @click="loadAdmins(currentPage + 1)"
            >
              <AppIcon name="chevron" :size="15" />
            </button>
          </nav>
        </template>
      </section>

      <aside
        class="admin-panel admin-authorization-detail"
        aria-labelledby="admin-authorization-detail-title"
      >
        <div class="admin-panel__heading">
          <div>
            <h2 id="admin-authorization-detail-title">권한 상세</h2>
          </div>
          <AppIcon name="settings" :size="21" />
        </div>
        <div v-if="!selectedAdmin" class="admin-authorization-detail__empty">
          <span><AppIcon name="user" :size="28" /></span><strong>관리자를 선택해주세요.</strong>
          <p>목록의 상세 버튼을 누르면 역할과 권한 조정 메뉴를 확인할 수 있습니다.</p>
        </div>
        <div v-else class="admin-authorization-detail__body">
          <div class="admin-authorization-profile">
            <span>{{ selectedAdmin.name?.slice(0, 1) || '?' }}</span>
            <div>
              <strong>{{ selectedAdmin.name || '이름 미등록' }}</strong
              ><small>{{ selectedAdmin.email || '이메일 미등록' }}</small>
            </div>
          </div>
          <section class="admin-authorization-current-role">
            <span>현재 역할</span><strong>{{ roleLabel(selectedAdmin.role) }}</strong>
            <p>{{ roleInfo(selectedAdmin.role)?.description }}</p>
          </section>
          <dl>
            <div>
              <dt>관리자 ID</dt>
              <dd>#{{ selectedAdmin.adminId }}</dd>
            </div>
            <div>
              <dt>등록일</dt>
              <dd>{{ formatDateTime(selectedAdmin.createdAt) }}</dd>
            </div>
            <div>
              <dt>최근 수정</dt>
              <dd>{{ formatDateTime(selectedAdmin.updatedAt) }}</dd>
            </div>
          </dl>

          <div v-if="isSelf(selectedAdmin)" class="admin-authorization-self-warning">
            <AppIcon name="shield" :size="17" /><span
              >현재 로그인한 계정의 권한은 이 화면에서 변경할 수 없습니다.</span
            >
          </div>
          <button
            type="button"
            class="admin-authorization-change-button"
            :disabled="!isRoot || isSelf(selectedAdmin)"
            @click="openRoleChange(selectedAdmin)"
          >
            <AppIcon name="settings" :size="16" /> 역할 변경
          </button>
          <button
            type="button"
            class="admin-authorization-delete-button"
            :disabled="!isRoot || isSelf(selectedAdmin)"
            @click="openDelete(selectedAdmin)"
          >
            <AppIcon name="trash" :size="16" /> 관리자 계정 삭제
          </button>
        </div>
      </aside>
    </div>

    <ModalSheet
      :show="showCreateModal"
      title="관리자 계정 생성"
      description="관리자가 사용할 로그인 정보와 초기 운영 역할을 입력하세요."
      @close="closeCreateAdmin"
    >
      <form
        id="admin-create-form"
        class="admin-authorization-create-form"
        @submit.prevent="submitCreateAdmin"
      >
        <label>
          <span>이메일</span>
          <input
            v-model="createDraft.email"
            type="email"
            maxlength="255"
            autocomplete="off"
            placeholder="admin@example.com"
          />
        </label>
        <label>
          <span>이름</span>
          <input
            v-model="createDraft.name"
            type="text"
            maxlength="100"
            autocomplete="off"
            placeholder="관리자 이름"
          />
        </label>
        <label>
          <span>전화번호</span>
          <input
            v-model="createDraft.phone"
            type="tel"
            maxlength="20"
            autocomplete="off"
            placeholder="010-1234-5678"
          />
        </label>
        <div class="admin-authorization-create-field">
          <span>초기 역할</span>
          <div
            class="admin-authorization-role-select"
            :class="{ 'is-open': isCreateRoleOpen }"
            @focusout="closeCreateRoleOnFocusOut"
            @keydown.esc="isCreateRoleOpen = false"
          >
            <button
              type="button"
              class="admin-authorization-role-select__trigger"
              aria-haspopup="listbox"
              :aria-expanded="isCreateRoleOpen"
              aria-controls="admin-create-role-options"
              @click="isCreateRoleOpen = !isCreateRoleOpen"
              @keydown.down.prevent="isCreateRoleOpen = true"
            >
              <span>
                <strong>{{ roleLabel(createDraft.role) }}</strong>
                <small>{{ roleInfo(createDraft.role)?.description }}</small>
              </span>
              <span class="admin-authorization-role-select__arrow" aria-hidden="true" />
            </button>
            <ul
              v-if="isCreateRoleOpen"
              id="admin-create-role-options"
              class="admin-authorization-role-select__menu"
              role="listbox"
              aria-label="초기 관리자 역할"
            >
              <li v-for="role in roleOptions" :key="role.value" role="presentation">
                <button
                  type="button"
                  role="option"
                  :aria-selected="createDraft.role === role.value"
                  :class="{ 'is-selected': createDraft.role === role.value }"
                  @click="selectCreateRole(role.value)"
                >
                  <span>
                    <strong>{{ role.label }}</strong>
                    <small>{{ role.description }}</small>
                  </span>
                  <AppIcon
                    v-if="createDraft.role === role.value"
                    name="check"
                    :size="15"
                    aria-hidden="true"
                  />
                </button>
              </li>
            </ul>
          </div>
        </div>
        <label>
          <span>초기 비밀번호</span>
          <input
            v-model="createDraft.password"
            type="password"
            maxlength="64"
            autocomplete="new-password"
            placeholder="영문·숫자·특수문자 포함 8자 이상"
          />
        </label>
        <label>
          <span>비밀번호 확인</span>
          <input
            v-model="createDraft.confirmPassword"
            type="password"
            maxlength="64"
            autocomplete="new-password"
            placeholder="비밀번호를 다시 입력하세요"
          />
        </label>
        <p class="admin-authorization-create-help">
          생성된 관리자는 입력한 이메일과 초기 비밀번호로 바로 로그인할 수 있습니다.
        </p>
        <p v-if="createFormError" class="admin-authorization-form-error" role="alert">
          {{ createFormError }}
        </p>
      </form>
      <template #actions
        ><button
          type="button"
          class="secondary-button"
          :disabled="isCreatingAdmin"
          @click="closeCreateAdmin"
        >
          취소</button
        ><button
          type="submit"
          form="admin-create-form"
          class="primary-button"
          :disabled="isCreatingAdmin"
        >
          {{ isCreatingAdmin ? '생성 중...' : '관리자 생성' }}
        </button></template
      >
    </ModalSheet>

    <ModalSheet
      :show="showRoleModal"
      title="관리자 역할 변경"
      description="선택한 관리자에게 부여할 역할을 선택하세요. 변경 즉시 서버 접근 권한에 반영됩니다."
      @close="showRoleModal = false"
    >
      <form
        id="admin-role-change-form"
        class="admin-authorization-role-form"
        @submit.prevent="submitRoleChange"
      >
        <p v-if="selectedAdmin" class="admin-authorization-target">
          #{{ selectedAdmin.adminId }} {{ selectedAdmin.name }} · {{ selectedAdmin.email }}
        </p>
        <label
          v-for="role in roleOptions"
          :key="role.value"
          :class="{ 'is-selected': roleDraft === role.value }"
          ><input v-model="roleDraft" type="radio" name="admin-role" :value="role.value" /><span
            ><strong>{{ role.label }}</strong
            ><small>{{ role.description }}</small></span
          ></label
        >
        <p v-if="roleFormError" class="admin-authorization-form-error" role="alert">
          {{ roleFormError }}
        </p>
      </form>
      <template #actions
        ><button
          type="button"
          class="secondary-button"
          :disabled="isChangingRole"
          @click="showRoleModal = false"
        >
          취소</button
        ><button
          type="submit"
          form="admin-role-change-form"
          class="primary-button"
          :disabled="isChangingRole || roleDraft === selectedAdmin?.role"
        >
          {{ isChangingRole ? '변경 중...' : '권한 변경' }}
        </button></template
      >
    </ModalSheet>

    <ModalSheet
      :show="Boolean(deleteTarget)"
      title="관리자 계정을 삭제하시겠습니까?"
      description="관리자 계정과 연결된 사용자 데이터가 함께 삭제되며 복구할 수 없습니다."
      danger
      @close="deleteTarget = null"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <p v-if="deleteTarget" class="admin-authorization-target">
        #{{ deleteTarget.adminId }} {{ deleteTarget.name }} · {{ deleteTarget.email }}
      </p>
      <p v-if="deleteError" class="admin-authorization-form-error" role="alert">
        {{ deleteError }}
      </p>
      <template #actions
        ><button
          type="button"
          class="secondary-button"
          :disabled="isDeleting"
          @click="deleteTarget = null"
        >
          취소</button
        ><button type="button" class="danger-button" :disabled="isDeleting" @click="confirmDelete">
          {{ isDeleting ? '삭제 중...' : '계정 삭제' }}
        </button></template
      >
    </ModalSheet>
  </AdminLayout>
</template>
