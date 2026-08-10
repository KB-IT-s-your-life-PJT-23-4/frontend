<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  createAdminFaq,
  createAdminFaqCategory,
  deleteAdminFaq,
  deleteAdminFaqCategory,
  getAdminFaqCategories,
  getAdminFaqPage,
  getFaqEditorCatalog,
  updateAdminFaq,
  updateAdminFaqCategory,
} from '../api/adminFaqApi'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import '../assets/css/admin-dashboard.css'
import '../assets/css/admin-faq.css'

const PAGE_SIZE = 10

const faqs = ref([])
const categories = ref([])
const editorCatalog = ref([])
const pagination = ref(null)
const listState = ref('loading')
const listError = ref('')
const feedbackMessage = ref('')

const filterForm = ref({ categoryId: '', keyword: '' })
const appliedFilters = ref({ categoryId: '', keyword: '' })

const faqModalMode = ref('create')
const showFaqModal = ref(false)
const editingFaqId = ref(null)
const faqDraft = ref(emptyFaqDraft())
const faqFormError = ref('')
const isSavingFaq = ref(false)
const detailLoadingFaqId = ref(null)
const deleteFaqTarget = ref(null)
const isDeletingFaq = ref(false)
const deleteFaqError = ref('')

const newCategoryName = ref('')
const editingCategoryId = ref(null)
const editingCategoryName = ref('')
const categoryError = ref('')
const categoryBusyId = ref(null)
const deleteCategoryTarget = ref(null)

const currentPage = computed(() => pagination.value?.page ?? 0)
const totalElements = computed(() => pagination.value?.totalElements ?? 0)
const pageButtons = computed(() => {
  const total = pagination.value?.totalPages ?? 0
  if (total <= 1) return []
  const start = Math.max(0, Math.min(currentPage.value - 2, total - 5))
  return Array.from({ length: Math.min(5, total) }, (_, index) => start + index)
})

function emptyFaqDraft() {
  return {
    categoryId: '',
    question: '',
    prompt: '',
    answer: '',
    showBranchButton: false,
    showTaxOfficeButton: false,
  }
}

function categoryIdOf(category) {
  return category.id ?? category.categoryId
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
  if (error?.status === 403) return 'FAQ 관리 권한이 없습니다.'
  if (error?.status === 404) return '대상을 찾을 수 없습니다. 목록을 새로고침해주세요.'
  if (error?.status === 409) return '사용 중인 항목은 삭제할 수 없습니다.'
  return error?.message || fallback
}

async function loadFaqPage(page = 0) {
  listState.value = 'loading'
  listError.value = ''
  try {
    const data = await getAdminFaqPage({
      page,
      size: PAGE_SIZE,
      categoryId: appliedFilters.value.categoryId || undefined,
      keyword: appliedFilters.value.keyword,
    })
    faqs.value = Array.isArray(data?.faqs) ? data.faqs : []
    pagination.value = data?.pagination ?? null
    listState.value = faqs.value.length ? 'success' : 'empty'
  } catch (error) {
    faqs.value = []
    pagination.value = null
    listState.value = 'error'
    listError.value = errorMessage(error, 'FAQ 목록을 불러오지 못했습니다.')
  }
}

async function refreshCategories() {
  categories.value = await getAdminFaqCategories()
}

async function refreshEditorCatalog() {
  editorCatalog.value = await getFaqEditorCatalog()
}

async function initialize() {
  listState.value = 'loading'
  const results = await Promise.allSettled([
    refreshCategories(),
    refreshEditorCatalog(),
    loadFaqPage(0),
  ])
  if (results[0].status === 'rejected') {
    categoryError.value = errorMessage(results[0].reason, '카테고리를 불러오지 못했습니다.')
  }
}

function submitFilters() {
  appliedFilters.value = {
    categoryId: filterForm.value.categoryId,
    keyword: filterForm.value.keyword.trim(),
  }
  loadFaqPage(0)
}

function resetFilters() {
  filterForm.value = { categoryId: '', keyword: '' }
  appliedFilters.value = { categoryId: '', keyword: '' }
  loadFaqPage(0)
}

function openCreateFaq() {
  faqModalMode.value = 'create'
  editingFaqId.value = null
  faqDraft.value = {
    ...emptyFaqDraft(),
    categoryId: categories.value.length ? String(categoryIdOf(categories.value[0])) : '',
  }
  faqFormError.value = ''
  showFaqModal.value = true
}

async function openEditFaq(faq) {
  detailLoadingFaqId.value = faq.faqId
  faqFormError.value = ''
  try {
    let detail = editorCatalog.value.find((item) => item.faqId === faq.faqId)
    if (!detail) {
      await refreshEditorCatalog()
      detail = editorCatalog.value.find((item) => item.faqId === faq.faqId)
    }
    if (!detail) throw new Error('FAQ 편집 정보를 찾지 못했습니다.')

    faqModalMode.value = 'edit'
    editingFaqId.value = faq.faqId
    faqDraft.value = {
      categoryId: String(faq.categoryId),
      question: detail.question ?? faq.question ?? '',
      prompt: detail.prompt ?? '',
      answer: detail.answer ?? '',
      showBranchButton: Boolean(detail.showBranchButton),
      showTaxOfficeButton: Boolean(detail.showTaxOfficeButton),
    }
    showFaqModal.value = true
  } catch (error) {
    feedbackMessage.value = errorMessage(error, 'FAQ 편집 정보를 불러오지 못했습니다.')
  } finally {
    detailLoadingFaqId.value = null
  }
}

function closeFaqModal() {
  if (isSavingFaq.value) return
  showFaqModal.value = false
  editingFaqId.value = null
  faqFormError.value = ''
}

function validateFaqDraft() {
  if (!faqDraft.value.categoryId) return '카테고리를 선택해주세요.'
  if (!faqDraft.value.question.trim()) return '화면에 표시할 질문을 입력해주세요.'
  if (faqDraft.value.question.trim().length > 255) return '질문은 255자 이하로 입력해주세요.'
  if (!faqDraft.value.prompt.trim()) return 'AI 검색에 사용할 프롬프트를 입력해주세요.'
  if (faqDraft.value.prompt.trim().length > 500) return '프롬프트는 500자 이하로 입력해주세요.'
  if (!faqDraft.value.answer.trim()) return 'FAQ 답변을 입력해주세요.'
  return ''
}

async function submitFaq() {
  const validationError = validateFaqDraft()
  if (validationError) {
    faqFormError.value = validationError
    return
  }

  isSavingFaq.value = true
  faqFormError.value = ''
  const payload = {
    categoryId: Number(faqDraft.value.categoryId),
    question: faqDraft.value.question.trim(),
    prompt: faqDraft.value.prompt.trim(),
    answer: faqDraft.value.answer.trim(),
    showBranchButton: faqDraft.value.showBranchButton,
    showTaxOfficeButton: faqDraft.value.showTaxOfficeButton,
  }

  try {
    if (faqModalMode.value === 'edit') {
      await updateAdminFaq(editingFaqId.value, payload)
      feedbackMessage.value = 'FAQ를 수정했습니다.'
    } else {
      await createAdminFaq(payload)
      feedbackMessage.value = '새 FAQ를 등록했습니다.'
    }
    showFaqModal.value = false
    editingFaqId.value = null
    await Promise.all([
      refreshEditorCatalog(),
      loadFaqPage(faqModalMode.value === 'create' ? 0 : currentPage.value),
    ])
  } catch (error) {
    faqFormError.value = errorMessage(error, 'FAQ를 저장하지 못했습니다.')
  } finally {
    isSavingFaq.value = false
  }
}

function openDeleteFaq(faq) {
  deleteFaqTarget.value = faq
  deleteFaqError.value = ''
}

async function confirmDeleteFaq() {
  if (!deleteFaqTarget.value) return
  isDeletingFaq.value = true
  deleteFaqError.value = ''
  try {
    await deleteAdminFaq(deleteFaqTarget.value.faqId)
    deleteFaqTarget.value = null
    feedbackMessage.value = 'FAQ를 삭제했습니다.'
    const targetPage =
      faqs.value.length === 1 ? Math.max(0, currentPage.value - 1) : currentPage.value
    await Promise.all([refreshEditorCatalog(), loadFaqPage(targetPage)])
  } catch (error) {
    deleteFaqError.value = errorMessage(error, 'FAQ를 삭제하지 못했습니다.')
  } finally {
    isDeletingFaq.value = false
  }
}

async function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name) {
    categoryError.value = '추가할 카테고리 이름을 입력해주세요.'
    return
  }
  categoryBusyId.value = 'new'
  categoryError.value = ''
  try {
    await createAdminFaqCategory(name)
    newCategoryName.value = ''
    feedbackMessage.value = '카테고리를 추가했습니다.'
    await refreshCategories()
  } catch (error) {
    categoryError.value = errorMessage(error, '카테고리를 추가하지 못했습니다.')
  } finally {
    categoryBusyId.value = null
  }
}

function startCategoryEdit(category) {
  editingCategoryId.value = categoryIdOf(category)
  editingCategoryName.value = category.categoryName
  categoryError.value = ''
}

async function saveCategory() {
  const name = editingCategoryName.value.trim()
  if (!name) {
    categoryError.value = '카테고리 이름을 입력해주세요.'
    return
  }
  categoryBusyId.value = editingCategoryId.value
  try {
    await updateAdminFaqCategory(editingCategoryId.value, name)
    editingCategoryId.value = null
    feedbackMessage.value = '카테고리 이름을 수정했습니다.'
    await Promise.all([refreshCategories(), loadFaqPage(currentPage.value)])
  } catch (error) {
    categoryError.value = errorMessage(error, '카테고리를 수정하지 못했습니다.')
  } finally {
    categoryBusyId.value = null
  }
}

async function confirmDeleteCategory() {
  if (!deleteCategoryTarget.value) return
  const categoryId = categoryIdOf(deleteCategoryTarget.value)
  categoryBusyId.value = categoryId
  categoryError.value = ''
  try {
    await deleteAdminFaqCategory(categoryId)
    deleteCategoryTarget.value = null
    if (String(filterForm.value.categoryId) === String(categoryId)) resetFilters()
    feedbackMessage.value = '카테고리를 삭제했습니다.'
    await refreshCategories()
  } catch (error) {
    categoryError.value = errorMessage(
      error,
      '카테고리를 삭제하지 못했습니다. 포함된 FAQ를 먼저 이동하거나 삭제해주세요.',
    )
  } finally {
    categoryBusyId.value = null
  }
}

onMounted(initialize)
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-faq-title">
      <div>
        <span class="admin-dashboard-heading__eyebrow">FAQ MANAGEMENT</span>
        <h1 id="admin-faq-title">FAQ 관리</h1>
        <p>FAQ 질문과 AI 상담용 프롬프트, 답변 콘텐츠를 관리하세요.</p>
      </div>
      <div class="admin-faq-heading-actions">
        <span
          ><strong>{{ totalElements.toLocaleString('ko-KR') }}</strong
          >개 FAQ</span
        >
        <button type="button" class="admin-faq-button is-primary" @click="openCreateFaq">
          <AppIcon name="plus" :size="16" /> 새 FAQ 등록
        </button>
      </div>
    </section>

    <p v-if="feedbackMessage" class="admin-faq-feedback" role="status">
      {{ feedbackMessage }}
      <button type="button" aria-label="알림 닫기" @click="feedbackMessage = ''">×</button>
    </p>

    <section class="admin-panel admin-faq-filter" aria-labelledby="admin-faq-filter-title">
      <div class="admin-panel__heading">
        <div>
          <span>CONTENT FILTER</span>
          <h2 id="admin-faq-filter-title">FAQ 검색</h2>
        </div>
        <AppIcon name="chat" :size="21" />
      </div>
      <form class="admin-faq-filter__form" @submit.prevent="submitFilters">
        <label>
          <span>카테고리</span>
          <select v-model="filterForm.categoryId">
            <option value="">전체 카테고리</option>
            <option
              v-for="category in categories"
              :key="categoryIdOf(category)"
              :value="String(categoryIdOf(category))"
            >
              {{ category.categoryName }}
            </option>
          </select>
        </label>
        <label>
          <span>검색어</span>
          <input v-model="filterForm.keyword" type="search" placeholder="질문 또는 프롬프트 검색" />
        </label>
        <div class="admin-faq-filter__actions">
          <button type="button" class="admin-faq-button is-secondary" @click="resetFilters">
            초기화
          </button>
          <button type="submit" class="admin-faq-button is-primary">검색</button>
        </div>
      </form>
    </section>

    <div class="admin-faq-content-grid">
      <section class="admin-panel admin-faq-list" aria-labelledby="admin-faq-list-title">
        <div class="admin-panel__heading admin-faq-list__heading">
          <div>
            <span>FAQ CONTENT</span>
            <h2 id="admin-faq-list-title">FAQ 목록</h2>
          </div>
          <p v-if="pagination">
            {{ currentPage + 1 }} / {{ Math.max(pagination.totalPages, 1) }} 페이지
          </p>
        </div>

        <div v-if="listState === 'loading'" class="admin-faq-state" aria-live="polite">
          <span class="admin-loading-spinner" aria-hidden="true" />
          <strong>FAQ 목록을 불러오는 중입니다.</strong>
        </div>
        <div v-else-if="listState === 'error'" class="admin-faq-state is-error" role="alert">
          <AppIcon name="info" :size="26" />
          <strong>FAQ 목록을 불러오지 못했습니다.</strong>
          <p>{{ listError }}</p>
          <button type="button" @click="loadFaqPage(currentPage)">다시 시도</button>
        </div>
        <div v-else-if="listState === 'empty'" class="admin-faq-state">
          <AppIcon name="chat" :size="28" />
          <strong>조건에 맞는 FAQ가 없습니다.</strong>
          <p>검색 조건을 변경하거나 새 FAQ를 등록해보세요.</p>
        </div>

        <template v-else>
          <div class="admin-faq-table-wrap">
            <table class="admin-faq-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>카테고리</th>
                  <th>질문</th>
                  <th>연결 버튼</th>
                  <th>최근 수정</th>
                  <th><span class="sr-only">관리</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="faq in faqs" :key="faq.faqId">
                  <td data-label="ID">
                    <strong>#{{ faq.faqId }}</strong>
                  </td>
                  <td data-label="카테고리">
                    <span class="admin-faq-category-badge">{{ faq.categoryName }}</span>
                  </td>
                  <td data-label="질문" class="admin-faq-question">{{ faq.question }}</td>
                  <td data-label="연결 버튼">
                    <span v-if="faq.showBranchButton" class="admin-faq-option-badge">영업점</span>
                    <span v-if="faq.showTaxOfficeButton" class="admin-faq-option-badge"
                      >세무서</span
                    >
                    <span
                      v-if="!faq.showBranchButton && !faq.showTaxOfficeButton"
                      class="admin-faq-muted"
                      >없음</span
                    >
                  </td>
                  <td data-label="최근 수정">
                    {{ formatDateTime(faq.updatedAt || faq.createdAt) }}
                  </td>
                  <td data-label="관리">
                    <div class="admin-faq-row-actions">
                      <button
                        type="button"
                        :disabled="detailLoadingFaqId === faq.faqId"
                        @click="openEditFaq(faq)"
                      >
                        {{ detailLoadingFaqId === faq.faqId ? '조회 중' : '수정' }}
                      </button>
                      <button type="button" class="is-danger" @click="openDeleteFaq(faq)">
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav
            v-if="pagination?.totalPages > 1"
            class="admin-faq-pagination"
            aria-label="FAQ 목록 페이지"
          >
            <button
              type="button"
              :disabled="!pagination.hasPrevious"
              aria-label="이전 페이지"
              @click="loadFaqPage(currentPage - 1)"
            >
              <AppIcon name="back" :size="15" />
            </button>
            <button
              v-for="page in pageButtons"
              :key="page"
              type="button"
              :class="{ 'is-active': page === currentPage }"
              :aria-current="page === currentPage ? 'page' : undefined"
              @click="loadFaqPage(page)"
            >
              {{ page + 1 }}
            </button>
            <button
              type="button"
              :disabled="!pagination.hasNext"
              aria-label="다음 페이지"
              @click="loadFaqPage(currentPage + 1)"
            >
              <AppIcon name="chevron" :size="15" />
            </button>
          </nav>
        </template>
      </section>

      <aside class="admin-panel admin-faq-categories" aria-labelledby="admin-faq-category-title">
        <div class="admin-panel__heading">
          <div>
            <span>FAQ CATEGORY</span>
            <h2 id="admin-faq-category-title">카테고리 관리</h2>
          </div>
          <AppIcon name="settings" :size="21" />
        </div>
        <form class="admin-faq-category-add" @submit.prevent="addCategory">
          <input
            v-model="newCategoryName"
            maxlength="200"
            placeholder="새 카테고리 이름"
            aria-label="새 카테고리 이름"
          />
          <button type="submit" :disabled="categoryBusyId === 'new'" aria-label="카테고리 추가">
            <AppIcon name="plus" :size="16" />
          </button>
        </form>
        <p v-if="categoryError" class="admin-faq-category-error" role="alert">
          {{ categoryError }}
        </p>
        <ul class="admin-faq-category-list">
          <li v-for="category in categories" :key="categoryIdOf(category)">
            <template v-if="editingCategoryId === categoryIdOf(category)">
              <input
                v-model="editingCategoryName"
                maxlength="200"
                aria-label="카테고리 이름 수정"
                @keyup.enter="saveCategory"
                @keyup.esc="editingCategoryId = null"
              />
              <button
                type="button"
                title="저장"
                :disabled="categoryBusyId === editingCategoryId"
                @click="saveCategory"
              >
                <AppIcon name="check" :size="15" />
              </button>
              <button type="button" title="취소" @click="editingCategoryId = null">
                <AppIcon name="close" :size="15" />
              </button>
            </template>
            <template v-else>
              <span>{{ category.categoryName }}</span>
              <button type="button" title="이름 수정" @click="startCategoryEdit(category)">
                수정
              </button>
              <button
                type="button"
                class="is-danger"
                title="카테고리 삭제"
                @click="deleteCategoryTarget = category"
              >
                <AppIcon name="trash" :size="15" />
              </button>
            </template>
          </li>
        </ul>
        <p v-if="!categories.length && !categoryError" class="admin-faq-category-empty">
          등록된 카테고리가 없습니다.
        </p>
      </aside>
    </div>

    <ModalSheet
      :show="showFaqModal"
      :title="faqModalMode === 'edit' ? 'FAQ 수정' : '새 FAQ 등록'"
      description="사용자 화면의 질문과 AI 상담 검색에 사용할 콘텐츠를 입력하세요."
      @close="closeFaqModal"
    >
      <form class="admin-faq-form" id="admin-faq-form" @submit.prevent="submitFaq">
        <label
          ><span>카테고리</span
          ><select v-model="faqDraft.categoryId">
            <option value="" disabled>카테고리 선택</option>
            <option
              v-for="category in categories"
              :key="categoryIdOf(category)"
              :value="String(categoryIdOf(category))"
            >
              {{ category.categoryName }}
            </option>
          </select></label
        >
        <label
          ><span
            >화면 표시 질문 <small>{{ faqDraft.question.length }}/255</small></span
          ><input
            v-model="faqDraft.question"
            maxlength="255"
            placeholder="사용자에게 보여줄 FAQ 질문"
        /></label>
        <label
          ><span
            >AI 검색 프롬프트 <small>{{ faqDraft.prompt.length }}/500</small></span
          ><textarea
            v-model="faqDraft.prompt"
            maxlength="500"
            rows="3"
            placeholder="AI가 FAQ를 찾는 데 사용할 핵심 문장과 키워드"
          />
        </label>
        <label
          ><span>답변</span
          ><textarea v-model="faqDraft.answer" rows="7" placeholder="사용자에게 제공할 FAQ 답변" />
        </label>
        <fieldset>
          <legend>연결 버튼 표시</legend>
          <label><input v-model="faqDraft.showBranchButton" type="checkbox" /> 영업점 찾기</label
          ><label
            ><input v-model="faqDraft.showTaxOfficeButton" type="checkbox" /> 세무서 찾기</label
          >
        </fieldset>
        <p v-if="faqFormError" class="admin-faq-form-error" role="alert">{{ faqFormError }}</p>
      </form>
      <template #actions>
        <button
          type="button"
          class="secondary-button"
          :disabled="isSavingFaq"
          @click="closeFaqModal"
        >
          취소
        </button>
        <button type="submit" form="admin-faq-form" class="primary-button" :disabled="isSavingFaq">
          {{ isSavingFaq ? '저장 중...' : '저장하기' }}
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="Boolean(deleteFaqTarget)"
      title="FAQ를 삭제하시겠습니까?"
      description="삭제한 FAQ 콘텐츠는 복구할 수 없습니다."
      danger
      @close="deleteFaqTarget = null"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <p v-if="deleteFaqTarget" class="admin-faq-delete-target">
        #{{ deleteFaqTarget.faqId }} {{ deleteFaqTarget.question }}
      </p>
      <p v-if="deleteFaqError" class="admin-faq-form-error" role="alert">{{ deleteFaqError }}</p>
      <template #actions
        ><button
          type="button"
          class="secondary-button"
          :disabled="isDeletingFaq"
          @click="deleteFaqTarget = null"
        >
          취소</button
        ><button
          type="button"
          class="danger-button"
          :disabled="isDeletingFaq"
          @click="confirmDeleteFaq"
        >
          {{ isDeletingFaq ? '삭제 중...' : '삭제하기' }}
        </button></template
      >
    </ModalSheet>

    <ModalSheet
      :show="Boolean(deleteCategoryTarget)"
      title="카테고리를 삭제하시겠습니까?"
      description="FAQ가 포함된 카테고리는 삭제되지 않을 수 있습니다. 먼저 FAQ를 다른 카테고리로 이동해주세요."
      danger
      @close="deleteCategoryTarget = null"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <p v-if="deleteCategoryTarget" class="admin-faq-delete-target">
        {{ deleteCategoryTarget.categoryName }}
      </p>
      <p v-if="categoryError" class="admin-faq-form-error" role="alert">
        {{ categoryError }}
      </p>
      <template #actions
        ><button type="button" class="secondary-button" @click="deleteCategoryTarget = null">
          취소</button
        ><button
          type="button"
          class="danger-button"
          :disabled="categoryBusyId === categoryIdOf(deleteCategoryTarget)"
          @click="confirmDeleteCategory"
        >
          삭제하기
        </button></template
      >
    </ModalSheet>
  </AdminLayout>
</template>
