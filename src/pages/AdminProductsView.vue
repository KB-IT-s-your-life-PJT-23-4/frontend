<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import {
  listProductVersions,
  getProductsByVersion,
  updateProduct,
  createProductVersion,
} from '../api/adminProductApi'
import '../assets/css/admin-dashboard.css'
import '../assets/css/admin-products.css'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const filterTabs = [
  { key: 'all', label: '전체' },
  { key: 'deposit', label: '예금', type: 'DEPOSIT' },
  { key: 'saving', label: '적금', type: 'SAVINGS' },
  { key: 'etf', label: 'ETF', type: 'ETF' },
]

const statusLabels = {
  LOADING: '적재 중',
  COMPLETED: '완료',
  FAILED: '실패',
}

const versions = ref([])
const selectedVersionId = ref(null)
const products = ref([])
const activeFilter = ref('all')
const viewState = ref('loading')
const errorMessage = ref('')

const editingProduct = ref(null)
const editDraft = ref({ productName: '', description: '', productUrl: '', salesStatus: 'ON_SALE' })
const isSavingEdit = ref(false)

const showAddVersionModal = ref(false)
const newVersionDraft = ref({ versionCode: '', dataDate: '' })
const isCreatingVersion = ref(false)

const selectedVersion = computed(
  () =>
    versions.value.find((version) => version.productDataVersionId === selectedVersionId.value) ??
    null,
)

const formattedAsOfDate = computed(() =>
  selectedVersion.value
    ? dateFormatter.format(new Date(`${selectedVersion.value.dataDate}T00:00:00`))
    : '-',
)

const totalCount = computed(() => {
  const v = selectedVersion.value
  if (!v) return 0
  return (v.depositCount ?? 0) + (v.savingsCount ?? 0) + (v.etfCount ?? 0)
})

async function loadVersions() {
  viewState.value = 'loading'
  errorMessage.value = ''
  try {
    versions.value = await listProductVersions()
    if (versions.value.length > 0) selectedVersionId.value = versions.value[0].productDataVersionId
    viewState.value = 'success'
  } catch (error) {
    viewState.value = 'error'
    errorMessage.value = error.message || '상품 버전 목록을 불러오지 못했습니다.'
  }
}

async function loadProducts() {
  if (!selectedVersionId.value) return
  try {
    const tab = filterTabs.find((item) => item.key === activeFilter.value)
    products.value = await getProductsByVersion(selectedVersionId.value, {
      type: tab?.type ?? 'all',
    })
  } catch (error) {
    errorMessage.value = error.message || '상품 목록을 불러오지 못했습니다.'
  }
}

watch([selectedVersionId, activeFilter], loadProducts)
onMounted(async () => {
  await loadVersions()
  await loadProducts()
})

function typeLabel(type) {
  return filterTabs.find((tab) => tab.type === type)?.label ?? type
}

function formatRate(product) {
  if (product.productType === 'ETF') {
    return product.annualReturn5yPercent != null ? `연 ${product.annualReturn5yPercent}%` : '-'
  }
  if (product.minBaseRatePercent == null && product.maxRatePercent == null) return '-'
  return `${product.minBaseRatePercent ?? '-'}% ~ ${product.maxRatePercent ?? '-'}%`
}

function formatTerm(product) {
  if (product.productType === 'ETF') return product.riskLevel ?? '-'
  if (product.minMonth == null || product.maxMonth == null) return '-'
  return `${product.minMonth}~${product.maxMonth}개월`
}

function openEdit(product) {
  editingProduct.value = product
  editDraft.value = {
    productName: product.productName,
    description: product.description ?? '',
    productUrl: product.productUrl ?? '',
    salesStatus: product.salesStatus ?? 'ON_SALE',
  }
}

function closeEdit() {
  editingProduct.value = null
}

async function submitEdit() {
  if (!editingProduct.value) return
  isSavingEdit.value = true
  try {
    const updated = await updateProduct(
      selectedVersionId.value,
      editingProduct.value.productVersionId,
      editDraft.value,
    )
    const index = products.value.findIndex(
      (item) => item.productVersionId === updated.productVersionId,
    )
    if (index !== -1) products.value[index] = updated
    closeEdit()
  } catch (error) {
    errorMessage.value = error.message || '상품 정보를 수정하지 못했습니다.'
  } finally {
    isSavingEdit.value = false
  }
}

function openAddVersion() {
  newVersionDraft.value = { versionCode: '', dataDate: '' }
  showAddVersionModal.value = true
}

async function submitAddVersion() {
  if (!newVersionDraft.value.versionCode || !newVersionDraft.value.dataDate) return
  isCreatingVersion.value = true
  try {
    const created = await createProductVersion(newVersionDraft.value)
    await loadVersions()
    selectedVersionId.value = created.productDataVersionId
    showAddVersionModal.value = false
  } catch (error) {
    errorMessage.value = error.message || '새 버전을 추가하지 못했습니다.'
  } finally {
    isCreatingVersion.value = false
  }
}
</script>

<template>
  <AdminLayout>
    <section class="admin-dashboard-heading" aria-labelledby="admin-products-title">
      <div>
        <span class="admin-dashboard-heading__eyebrow">PRODUCT MANAGEMENT</span>
        <h1 id="admin-products-title">상품 관리</h1>
        <p>버전별 상품 데이터를 확인하고 수정하세요.</p>
      </div>
      <div class="admin-dashboard-actions">
        <button class="admin-refresh-button" type="button" @click="openAddVersion">
          <AppIcon name="plus" :size="16" />
          새 버전 추가
        </button>
      </div>
    </section>

    <p v-if="errorMessage" class="admin-products-error">{{ errorMessage }}</p>

    <div v-if="viewState === 'loading'" class="admin-products-loading">불러오는 중...</div>

    <template v-else>
      <section class="admin-panel admin-products-summary" aria-label="버전 요약">
        <div class="admin-products-version-select">
          <label for="product-version">상품 데이터 버전</label>
          <select id="product-version" v-model="selectedVersionId">
            <option
              v-for="version in versions"
              :key="version.productDataVersionId"
              :value="version.productDataVersionId"
            >
              {{ version.versionCode }} ({{ statusLabels[version.status] ?? version.status }})
            </option>
          </select>
        </div>

        <dl class="admin-products-meta">
          <div>
            <dt>데이터 기준일</dt>
            <dd>{{ formattedAsOfDate }}</dd>
          </div>
          <div>
            <dt>전체 상품 수</dt>
            <dd>{{ totalCount.toLocaleString('ko-KR') }}개</dd>
          </div>
          <div v-if="selectedVersion">
            <dt>예금 / 적금 / ETF</dt>
            <dd>
              {{ selectedVersion.depositCount }} / {{ selectedVersion.savingsCount }} /
              {{ selectedVersion.etfCount }}
            </dd>
          </div>
        </dl>
      </section>

      <div class="admin-products-filter" role="tablist" aria-label="상품 유형 필터">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeFilter === tab.key"
          :class="{ 'is-active': activeFilter === tab.key }"
          @click="activeFilter = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <section class="admin-panel admin-products-table-wrap">
        <table class="admin-products-table">
          <thead>
            <tr>
              <th>유형</th>
              <th>상품명</th>
              <th>상품코드</th>
              <th>금리/수익률</th>
              <th>기간/위험도</th>
              <th>판매상태</th>
              <th>등록일</th>
              <th aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.productVersionId">
              <td>
                <span
                  class="admin-products-type-badge"
                  :class="`is-${product.productType?.toLowerCase()}`"
                >
                  {{ typeLabel(product.productType) }}
                </span>
              </td>
              <td>{{ product.productName }}</td>
              <td>{{ product.productCode }}</td>
              <td>{{ formatRate(product) }}</td>
              <td>{{ formatTerm(product) }}</td>
              <td>{{ product.salesStatus === 'ON_SALE' ? '판매중' : '판매중지' }}</td>
              <td>{{ product.createdAt?.slice(0, 10) }}</td>
              <td>
                <button class="secondary-button compact" type="button" @click="openEdit(product)">
                  수정
                </button>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="8" class="admin-products-empty">해당 조건의 상품이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <ModalSheet
      :show="Boolean(editingProduct)"
      title="상품 정보 수정"
      :description="editingProduct?.productName"
      @close="closeEdit"
    >
      <div class="admin-products-form">
        <label>
          상품명
          <input v-model="editDraft.productName" type="text" />
        </label>
        <label>
          설명
          <input v-model="editDraft.description" type="text" />
        </label>
        <label>
          상품 URL
          <input v-model="editDraft.productUrl" type="text" />
        </label>
        <label>
          판매상태
          <select v-model="editDraft.salesStatus">
            <option value="ON_SALE">판매중</option>
            <option value="DISCONTINUED">판매중지</option>
          </select>
        </label>
      </div>
      <template #actions>
        <button class="secondary-button" type="button" @click="closeEdit">취소</button>
        <button class="primary-button" type="button" :disabled="isSavingEdit" @click="submitEdit">
          {{ isSavingEdit ? '저장 중...' : '저장' }}
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="showAddVersionModal"
      title="새 상품 데이터 버전 추가"
      description="버전 레코드만 생성되며, 실제 상품 목록은 배치 작업이 적재합니다."
      @close="showAddVersionModal = false"
    >
      <div class="admin-products-form">
        <label>
          버전 코드
          <input v-model="newVersionDraft.versionCode" type="text" placeholder="예: 2026.09-R1" />
        </label>
        <label>
          데이터 기준일
          <input v-model="newVersionDraft.dataDate" type="date" />
        </label>
      </div>
      <template #actions>
        <button class="secondary-button" type="button" @click="showAddVersionModal = false">
          취소
        </button>
        <button
          class="primary-button"
          type="button"
          :disabled="isCreatingVersion"
          @click="submitAddVersion"
        >
          {{ isCreatingVersion ? '추가 중...' : '추가' }}
        </button>
      </template>
    </ModalSheet>
  </AdminLayout>
</template>
