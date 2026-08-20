<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import {
  listGiftTaxVersions,
  createGiftTaxVersion,
  updateGiftTaxVersion,
  deleteGiftTaxVersion,
  listLawArticles,
  getLawSummaries,
  getLawArticle,
} from '../api/adminLawTaxApi'
import { formatWon } from '../utils/finance'
import '../assets/css/admin-dashboard.css'
import '../assets/css/admin-lawtax.css'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const RELATION_LABELS = {
  LINEAL_DESCENDANT: '직계비속',
  OTHER: '기타 친족',
}

function deductionTemplate() {
  return [
    { relation: 'LINEAL_DESCENDANT', minor: false, deductionLimit: '' },
    { relation: 'LINEAL_DESCENDANT', minor: true, deductionLimit: '' },
    { relation: 'OTHER', minor: false, deductionLimit: '' },
  ]
}

function bracketRow() {
  return { lowerBound: '', upperBound: '', taxRatePercent: '', progressiveDeduction: '' }
}

const versions = ref([])
const listState = ref('loading')
const listError = ref('')

const showForm = ref(false)
const formMode = ref('create')
const formTargetEffectiveFrom = ref('')
const submitting = ref(false)
const feedbackMessage = ref('')

const form = reactive({
  effectiveFrom: '',
  brackets: [bracketRow()],
  deductionLimits: deductionTemplate(),
})

const versionToDelete = ref(null)
const deleting = ref(false)

async function loadVersions() {
  listState.value = 'loading'
  listError.value = ''
  try {
    versions.value = await listGiftTaxVersions()
    listState.value = versions.value.length ? 'success' : 'empty'
  } catch (error) {
    versions.value = []
    listState.value = 'error'
    listError.value = error?.message || '세율 버전을 불러오지 못했습니다.'
  }
}

onMounted(loadVersions)

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

function formatRatePercent(taxRate) {
  return `${(Number(taxRate) * 100).toFixed(2).replace(/\.?0+$/, '')}%`
}

function bracketRangeLabel(bracket) {
  const lower = formatWon(bracket.lowerBound)
  if (bracket.upperBound == null) return `${lower} 초과`
  return `${lower} ~ ${formatWon(bracket.upperBound)}`
}

function openCreateForm() {
  formMode.value = 'create'
  formTargetEffectiveFrom.value = ''
  form.effectiveFrom = ''
  form.brackets = [bracketRow()]
  form.deductionLimits = deductionTemplate()
  showForm.value = true
}

function openEditForm(version) {
  formMode.value = 'edit'
  formTargetEffectiveFrom.value = version.effectiveFrom
  form.effectiveFrom = version.effectiveFrom
  form.brackets = version.brackets.map((bracket) => ({
    lowerBound: String(bracket.lowerBound),
    upperBound: bracket.upperBound == null ? '' : String(bracket.upperBound),
    taxRatePercent: String(Number(bracket.taxRate) * 100),
    progressiveDeduction: String(bracket.progressiveDeduction),
  }))
  form.deductionLimits = deductionTemplate().map((template) => {
    const existing = version.deductionLimits.find(
      (item) => item.relation === template.relation && item.minor === template.minor,
    )
    return { ...template, deductionLimit: existing ? String(existing.deductionLimit) : '' }
  })
  showForm.value = true
}

function closeForm() {
  if (submitting.value) return
  showForm.value = false
}

function addBracketRow() {
  form.brackets.push(bracketRow())
}

function removeBracketRow(index) {
  if (form.brackets.length <= 1) return
  form.brackets.splice(index, 1)
}

function toNumber(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed === '' ? null : Number(trimmed)
}

function buildPayload() {
  return {
    effectiveFrom: form.effectiveFrom,
    brackets: form.brackets.map((bracket) => ({
      lowerBound: toNumber(bracket.lowerBound),
      upperBound: toNumber(bracket.upperBound),
      taxRate:
        toNumber(bracket.taxRatePercent) == null ? null : toNumber(bracket.taxRatePercent) / 100,
      progressiveDeduction: toNumber(bracket.progressiveDeduction) ?? 0,
    })),
    deductionLimits: form.deductionLimits.map((limit) => ({
      relation: limit.relation,
      minor: limit.minor,
      deductionLimit: toNumber(limit.deductionLimit),
    })),
  }
}

async function submitForm() {
  if (submitting.value) return
  submitting.value = true
  try {
    const payload = buildPayload()
    if (formMode.value === 'create') {
      await createGiftTaxVersion(payload)
      feedbackMessage.value = '새 세율 버전을 만들었습니다.'
    } else {
      await updateGiftTaxVersion(formTargetEffectiveFrom.value, payload)
      feedbackMessage.value = '세율 버전을 수정했습니다.'
    }
    showForm.value = false
    await loadVersions()
  } catch (error) {
    feedbackMessage.value = error?.message || '저장하지 못했습니다.'
  } finally {
    submitting.value = false
  }
}

async function confirmDelete() {
  if (!versionToDelete.value || deleting.value) return
  deleting.value = true
  try {
    await deleteGiftTaxVersion(versionToDelete.value.effectiveFrom)
    feedbackMessage.value = '세율 버전을 삭제했습니다.'
    versionToDelete.value = null
    await loadVersions()
  } catch (error) {
    feedbackMessage.value = error?.message || '삭제하지 못했습니다.'
  } finally {
    deleting.value = false
  }
}

const formTitle = computed(() =>
  formMode.value === 'create' ? '새 세율 버전 만들기' : '세율 버전 수정',
)

// --- 현재 법령 조문 목록 ---

const ARTICLE_PAGE_SIZE = 10

const lawSummaries = ref([])
const articles = ref([])
const articlePagination = ref(null)
const articleListState = ref('loading')
const articleListError = ref('')

const articleFilterForm = ref({ lawCode: '', keyword: '' })
const appliedArticleFilters = ref({ lawCode: '', keyword: '' })

const articleCurrentPage = computed(() => articlePagination.value?.page ?? 0)
const articlePageButtons = computed(() => {
  const total = articlePagination.value?.totalPages ?? 0
  if (total <= 1) return []
  const start = Math.max(0, Math.min(articleCurrentPage.value - 2, total - 5))
  return Array.from({ length: Math.min(5, total) }, (_, index) => start + index)
})

const selectedArticle = ref(null)
const articleDetailLoadingId = ref(null)
const articleDetailError = ref('')

async function loadLawSummaries() {
  try {
    lawSummaries.value = await getLawSummaries()
  } catch {
    lawSummaries.value = []
  }
}

async function loadArticlePage(page = 0) {
  articleListState.value = 'loading'
  articleListError.value = ''
  try {
    const data = await listLawArticles({
      page,
      size: ARTICLE_PAGE_SIZE,
      lawCode: appliedArticleFilters.value.lawCode || undefined,
      keyword: appliedArticleFilters.value.keyword,
    })
    articles.value = Array.isArray(data?.articles) ? data.articles : []
    articlePagination.value = data?.pagination ?? null
    articleListState.value = articles.value.length ? 'success' : 'empty'
  } catch (error) {
    articles.value = []
    articlePagination.value = null
    articleListState.value = 'error'
    articleListError.value = error?.message || '법령 조문 목록을 불러오지 못했습니다.'
  }
}

function submitArticleFilters() {
  appliedArticleFilters.value = {
    lawCode: articleFilterForm.value.lawCode,
    keyword: articleFilterForm.value.keyword.trim(),
  }
  loadArticlePage(0)
}

function resetArticleFilters() {
  articleFilterForm.value = { lawCode: '', keyword: '' }
  appliedArticleFilters.value = { lawCode: '', keyword: '' }
  loadArticlePage(0)
}

async function openArticleDetail(article) {
  articleDetailLoadingId.value = article.lawId
  articleDetailError.value = ''
  try {
    selectedArticle.value = await getLawArticle(article.lawId)
  } catch (error) {
    articleDetailError.value = error?.message || '조문 상세를 불러오지 못했습니다.'
  } finally {
    articleDetailLoadingId.value = null
  }
}

function closeArticleDetail() {
  selectedArticle.value = null
  articleDetailError.value = ''
}

onMounted(() => {
  loadLawSummaries()
  loadArticlePage(0)
})
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-lawtax-title">
      <div>
        <h1 id="admin-lawtax-title">세법 관리</h1>
        <p>증여세 과세표준 구간과 공제 한도를 시행일 기준으로 관리하세요.</p>
      </div>
      <button type="button" class="admin-lawtax-button is-primary" @click="openCreateForm">
        <AppIcon name="plus" :size="14" />
        새 버전 만들기
      </button>
    </section>

    <p v-if="feedbackMessage" class="admin-lawtax-feedback" role="status">
      {{ feedbackMessage }}
      <button type="button" aria-label="메시지 닫기" @click="feedbackMessage = ''">×</button>
    </p>

    <p v-if="listState === 'loading'" class="admin-lawtax-empty">불러오는 중이에요.</p>
    <p v-else-if="listState === 'error'" class="admin-lawtax-empty">{{ listError }}</p>
    <p v-else-if="listState === 'empty'" class="admin-lawtax-empty">등록된 세율 버전이 없어요.</p>

    <section v-else class="admin-lawtax-versions">
      <article
        v-for="version in versions"
        :key="version.effectiveFrom"
        class="admin-panel admin-lawtax-version"
      >
        <header class="admin-lawtax-version__head">
          <div>
            <strong>{{ formatDate(version.effectiveFrom) }} 시행</strong>
            <span>{{
              version.effectiveTo ? `${formatDate(version.effectiveTo)} 까지` : '현재 적용 중'
            }}</span>
          </div>
          <div class="admin-lawtax-version__badges">
            <span v-if="version.active" class="admin-lawtax-badge is-active">적용 중</span>
            <span v-else class="admin-lawtax-badge">지난 버전</span>
            <span v-if="version.editable" class="admin-lawtax-badge is-editable">수정 가능</span>
          </div>
          <div v-if="version.editable" class="admin-lawtax-version__actions">
            <button type="button" class="admin-lawtax-button" @click="openEditForm(version)">
              수정
            </button>
            <button
              type="button"
              class="admin-lawtax-button is-danger"
              @click="versionToDelete = version"
            >
              삭제
            </button>
          </div>
        </header>

        <div class="admin-lawtax-table-wrap">
          <table class="admin-lawtax-table">
            <caption>
              과세표준 구간
            </caption>
            <thead>
              <tr>
                <th>구간</th>
                <th>세율</th>
                <th>누진공제액</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bracket in version.brackets" :key="bracket.bracketId">
                <td>{{ bracketRangeLabel(bracket) }}</td>
                <td>{{ formatRatePercent(bracket.taxRate) }}</td>
                <td>{{ formatWon(bracket.progressiveDeduction) }}</td>
              </tr>
            </tbody>
          </table>

          <table class="admin-lawtax-table">
            <caption>
              증여재산공제 한도
            </caption>
            <thead>
              <tr>
                <th>관계</th>
                <th>미성년</th>
                <th>공제 한도</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="limit in version.deductionLimits" :key="limit.deductionLimitId">
                <td>{{ RELATION_LABELS[limit.relation] ?? limit.relation }}</td>
                <td>{{ limit.minor ? '미성년' : '성년' }}</td>
                <td>{{ formatWon(limit.deductionLimit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="admin-dashboard-heading" aria-labelledby="admin-lawtax-article-title">
      <br />
      <div>
        <h2 id="admin-lawtax-article-title">현재 법령</h2>
        <p>배치로 수집된 상속세및증여세법 관련 조문을 조회하세요.</p>
      </div>
    </section>

    <section
      class="admin-panel admin-lawtax-article-filter"
      aria-labelledby="admin-lawtax-article-filter-title"
    >
      <div class="admin-panel__heading">
        <div>
          <h2 id="admin-lawtax-article-filter-title">법령 검색</h2>
        </div>
        <AppIcon name="document" :size="20" />
      </div>
      <form class="admin-lawtax-article-filter__form" @submit.prevent="submitArticleFilters">
        <label>
          <span>법령</span>
          <select v-model="articleFilterForm.lawCode">
            <option value="">전체 법령</option>
            <option v-for="law in lawSummaries" :key="law.lawCode" :value="law.lawCode">
              {{ law.lawName }} ({{ law.lawType }})
            </option>
          </select>
        </label>
        <label>
          <span>검색어</span>
          <input
            v-model="articleFilterForm.keyword"
            type="search"
            placeholder="법령명, 조번호, 제목 또는 조문내용 검색"
          />
        </label>
        <div class="admin-lawtax-article-filter__actions">
          <button type="button" class="admin-lawtax-button" @click="resetArticleFilters">
            초기화
          </button>
          <button type="submit" class="admin-lawtax-button is-primary">검색</button>
        </div>
      </form>
    </section>

    <section
      class="admin-panel admin-lawtax-article-list"
      aria-labelledby="admin-lawtax-article-list-title"
    >
      <div class="admin-panel__heading">
        <div>
          <h2 id="admin-lawtax-article-list-title">법령 조문 목록</h2>
        </div>
        <p v-if="articlePagination">
          {{ articleCurrentPage + 1 }} / {{ Math.max(articlePagination.totalPages, 1) }} 페이지
        </p>
      </div>

      <p v-if="articleListState === 'loading'" class="admin-lawtax-empty">불러오는 중이에요.</p>
      <p v-else-if="articleListState === 'error'" class="admin-lawtax-empty">
        {{ articleListError }}
      </p>
      <p v-else-if="articleListState === 'empty'" class="admin-lawtax-empty">
        조건에 맞는 법령 조문이 없어요.
      </p>

      <template v-else>
        <div class="admin-lawtax-article-table-wrap">
          <table class="admin-lawtax-table admin-lawtax-article-table">
            <thead>
              <tr>
                <th>법령명</th>
                <th>조번호</th>
                <th>제목</th>
                <th>시행일</th>
                <th>최근 개정일</th>
                <th><span class="sr-only">상세</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="article in articles" :key="article.lawId">
                <td data-label="법령명">{{ article.lawName }}</td>
                <td data-label="조번호">{{ article.articleNo }}</td>
                <td data-label="제목">{{ article.title || '-' }}</td>
                <td data-label="시행일">{{ formatDate(article.effectiveDate) }}</td>
                <td data-label="최근 개정일">{{ formatDate(article.latestRevisionDate) }}</td>
                <td data-label="상세">
                  <button
                    type="button"
                    class="admin-lawtax-button"
                    :disabled="articleDetailLoadingId === article.lawId"
                    @click="openArticleDetail(article)"
                  >
                    {{ articleDetailLoadingId === article.lawId ? '조회 중' : '상세보기' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav
          v-if="articlePagination?.totalPages > 1"
          class="admin-lawtax-pagination"
          aria-label="법령 조문 목록 페이지"
        >
          <button
            type="button"
            :disabled="!articlePagination.hasPrevious"
            aria-label="이전 페이지"
            @click="loadArticlePage(articleCurrentPage - 1)"
          >
            <AppIcon name="back" :size="15" />
          </button>
          <button
            v-for="page in articlePageButtons"
            :key="page"
            type="button"
            :class="{ 'is-active': page === articleCurrentPage }"
            :aria-current="page === articleCurrentPage ? 'page' : undefined"
            @click="loadArticlePage(page)"
          >
            {{ page + 1 }}
          </button>
          <button
            type="button"
            :disabled="!articlePagination.hasNext"
            aria-label="다음 페이지"
            @click="loadArticlePage(articleCurrentPage + 1)"
          >
            <AppIcon name="chevron" :size="15" />
          </button>
        </nav>
      </template>
    </section>

    <ModalSheet
      :show="Boolean(selectedArticle)"
      :title="selectedArticle ? `${selectedArticle.lawName} ${selectedArticle.articleNo}` : ''"
      :description="selectedArticle?.title"
      @close="closeArticleDetail"
    >
      <div v-if="selectedArticle" class="admin-lawtax-article-detail">
        <dl>
          <div>
            <dt>법종구분</dt>
            <dd>{{ selectedArticle.lawType }}</dd>
          </div>
          <div>
            <dt>소관부처</dt>
            <dd>{{ selectedArticle.ministry || '-' }}</dd>
          </div>
          <div>
            <dt>법령 시행일</dt>
            <dd>{{ formatDate(selectedArticle.effectiveDate) }}</dd>
          </div>
          <div>
            <dt>조문 시행일</dt>
            <dd>{{ formatDate(selectedArticle.articleEffectiveDate) }}</dd>
          </div>
          <div>
            <dt>최근 개정일</dt>
            <dd>{{ formatDate(selectedArticle.latestRevisionDate) }}</dd>
          </div>
        </dl>
        <p class="admin-lawtax-article-detail__content">{{ selectedArticle.content }}</p>
        <p v-if="selectedArticle.revisionHistory" class="admin-lawtax-article-detail__revision">
          개정 이력: {{ selectedArticle.revisionHistory }}
        </p>
      </div>
      <p v-if="articleDetailError" class="admin-lawtax-empty">{{ articleDetailError }}</p>
      <template #actions>
        <button type="button" class="secondary-button" @click="closeArticleDetail">닫기</button>
      </template>
    </ModalSheet>

    <ModalSheet :show="showForm" :title="formTitle" @close="closeForm">
      <form id="lawtax-version-form" class="admin-lawtax-form" @submit.prevent="submitForm">
        <label v-if="formMode === 'create'" class="admin-lawtax-field">
          <span>시행일</span>
          <input v-model="form.effectiveFrom" type="date" required />
        </label>

        <div class="admin-lawtax-form-section">
          <div class="admin-lawtax-form-section__head">
            <strong>과세표준 구간</strong>
            <button type="button" class="admin-lawtax-button" @click="addBracketRow">
              <AppIcon name="plus" :size="12" /> 구간 추가
            </button>
          </div>
          <div
            v-for="(bracket, index) in form.brackets"
            :key="index"
            class="admin-lawtax-bracket-row"
          >
            <input
              v-model="bracket.lowerBound"
              type="number"
              min="0"
              placeholder="하한(원)"
              required
            />
            <input
              v-model="bracket.upperBound"
              type="number"
              min="0"
              placeholder="상한(원, 비우면 최고구간)"
            />
            <input
              v-model="bracket.taxRatePercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="세율(%)"
              required
            />
            <input
              v-model="bracket.progressiveDeduction"
              type="number"
              min="0"
              placeholder="누진공제액(원)"
              required
            />
            <button
              type="button"
              class="admin-lawtax-row-remove"
              :disabled="form.brackets.length <= 1"
              aria-label="구간 삭제"
              @click="removeBracketRow(index)"
            >
              <AppIcon name="trash" :size="14" />
            </button>
          </div>
        </div>

        <div class="admin-lawtax-form-section">
          <div class="admin-lawtax-form-section__head">
            <strong>증여재산공제 한도</strong>
          </div>
          <div
            v-for="limit in form.deductionLimits"
            :key="`${limit.relation}-${limit.minor}`"
            class="admin-lawtax-limit-row"
          >
            <span>
              {{ RELATION_LABELS[limit.relation] ?? limit.relation }}
              · {{ limit.minor ? '미성년' : '성년' }}
            </span>
            <input
              v-model="limit.deductionLimit"
              type="number"
              min="0"
              placeholder="공제 한도(원)"
              required
            />
          </div>
        </div>
      </form>
      <template #actions>
        <button type="button" class="secondary-button" @click="closeForm">취소</button>
        <button
          class="primary-button"
          type="submit"
          form="lawtax-version-form"
          :disabled="submitting"
        >
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="Boolean(versionToDelete)"
      title="이 버전을 삭제할까요?"
      description="아직 시행 전인 버전만 삭제할 수 있어요. 삭제하면 그 이전 버전이 다시 적용돼요."
      danger
      @close="versionToDelete = null"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <template #actions>
        <button type="button" class="secondary-button" @click="versionToDelete = null">취소</button>
        <button type="button" class="danger-button" :disabled="deleting" @click="confirmDelete">
          {{ deleting ? '삭제 중...' : '삭제하기' }}
        </button>
      </template>
    </ModalSheet>
  </AdminLayout>
</template>
