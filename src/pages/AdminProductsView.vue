<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AppIcon from '../components/layout/AppIcon.vue'
import ModalSheet from '../components/layout/ModalSheet.vue'
import {
  listProductVersions,
  addProductVersion,
  completeProductVersion,
  deleteProductVersion,
  getProductsByVersion,
  createProduct,
  updateProduct,
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

const statusLabels = { LOADING: '적재 중', COMPLETED: '완료', FAILED: '실패' }

const assetTypeLabels = {
  STOCK: '주식',
  BOND: '채권',
  ETF: 'ETF',
  FUTURES: '선물',
  CASH: '현금',
}

const versions = ref([])
const selectedVersionId = ref(null)
const products = ref([])
const activeFilter = ref('all')
const viewState = ref('loading')
const errorMessage = ref('')

const isSalesStatusOpen = ref(false)
const isVersionSelectOpen = ref(false)
const isCreatingVersion = ref(false)
const isCompletingVersion = ref(false)

const editingProduct = ref(null)
const isSavingEdit = ref(false)
const editDraft = ref(defaultEditDraft())

const showAddProductModal = ref(false)
const isCreatingProduct = ref(false)
const newProductDraft = ref(defaultNewProductDraft())

const showDeleteVersionModal = ref(false)
const isDeletingVersion = ref(false)

function defaultEditDraft() {
  return {
    productName: '',
    description: '',
    productUrl: '',
    salesStatus: 'ON_SALE',
    minAmount: '',
    maxAmount: '',
    minMonth: '',
    maxMonth: '',
    savingsCategory: 'FIXED_INSTALLMENT',
    monthlyMinAmount: '',
    monthlyMaxAmount: '',
    stockCode: '',
    etfCategory: 'DOMESTIC_INDEX',
    trackingIndex: '',
    bondRatioPercent: '',
    riskLevel: 'MEDIUM',
    annualReturn10yPercent: '',
    rateBaseDate: '',
    rateTiers: [],
    preferentialConditions: [],
    etfHoldings: [],
  }
}

function defaultNewProductDraft() {
  return { productType: 'DEPOSIT', productCode: '', ...defaultEditDraft() }
}

function toNumberOrNull(value) {
  return value === '' || value === null || value === undefined ? null : Number(value)
}

function toDateOrNull(value) {
  return value === '' || value === null || value === undefined ? null : value
}

function toRateTiersPayload(tiers, sharedBaseDate) {
  const baseDate = toDateOrNull(sharedBaseDate)
  return tiers.map((tier) => ({
    baseInterestRateId: tier.baseInterestRateId ?? null,
    minMonth: toNumberOrNull(tier.minMonth),
    maxMonth: toNumberOrNull(tier.maxMonth),
    baseRatePercent: toNumberOrNull(tier.baseRatePercent),
    maxRatePercent: toNumberOrNull(tier.maxRatePercent),
    baseDate,
  }))
}

function toPreferentialConditionsPayload(conditions) {
  return conditions.map((condition) => ({
    preferentialInterestRateId: condition.preferentialInterestRateId ?? null,
    additionalRatePercent: toNumberOrNull(condition.additionalRatePercent),
    conditionCode: condition.conditionCode,
    preferentialCondition: condition.preferentialCondition,
    baseDate: toDateOrNull(condition.baseDate),
  }))
}

function toEtfHoldingsPayload(holdings) {
  return holdings.map((holding) => ({
    holdingId: holding.holdingId ?? null,
    holdingRank: toNumberOrNull(holding.holdingRank),
    holdingName: holding.holdingName,
    holdingCode: holding.holdingCode || null,
    assetType: holding.assetType,
    countryCode: holding.countryCode || null,
    weightPercent: toNumberOrNull(holding.weightPercent),
    baseDate: toDateOrNull(holding.baseDate),
  }))
}

function addRateTier(tiers) {
  tiers.push({
    baseInterestRateId: null,
    minMonth: '',
    maxMonth: '',
    baseRatePercent: '',
    maxRatePercent: '',
  })
}

function removeRateTier(tiers, index) {
  tiers.splice(index, 1)
}

function addPreferentialCondition(conditions) {
  conditions.push({
    preferentialInterestRateId: null,
    additionalRatePercent: '',
    conditionCode: '',
    preferentialCondition: '',
    baseDate: '',
  })
}

function removePreferentialCondition(conditions, index) {
  conditions.splice(index, 1)
}

function addEtfHolding(holdings) {
  holdings.push({
    holdingId: null,
    holdingRank: holdings.length + 1,
    holdingName: '',
    holdingCode: '',
    assetType: 'STOCK',
    countryCode: 'KR',
    weightPercent: '',
    baseDate: '',
  })
}

function removeEtfHolding(holdings, index) {
  holdings.splice(index, 1)
}

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

const latestVersion = computed(() => versions.value[0] ?? null)
const isLatestVersionLoading = computed(() => latestVersion.value?.status === 'LOADING')

async function loadVersions() {
  viewState.value = 'loading'
  errorMessage.value = ''
  try {
    versions.value = await listProductVersions()
    if (versions.value.length > 0) {
      selectedVersionId.value = versions.value[0].productDataVersionId
    }
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
    return product.annualReturn10yPercent != null ? `연 ${product.annualReturn10yPercent}%` : '-'
  }
  if (product.minBaseRatePercent == null && product.maxRatePercent == null) return '-'
  return `${product.minBaseRatePercent ?? '-'}% ~ ${product.maxRatePercent ?? '-'}%`
}

function formatTerm(product) {
  if (product.productType === 'ETF') return product.riskLevel ?? '-'
  if (product.minMonth == null || product.maxMonth == null) return '-'
  return `${product.minMonth}~${product.maxMonth}개월`
}

async function addVersion() {
  errorMessage.value = ''
  if (isLatestVersionLoading.value) {
    errorMessage.value = '가장 최근 버전의 적재를 완료해주세요.'
    return
  }
  isCreatingVersion.value = true
  try {
    const created = await addProductVersion()
    await loadVersions()
    selectedVersionId.value = created.productDataVersionId
  } catch (error) {
    errorMessage.value = error.message || '새 버전을 추가하지 못했습니다.'
  } finally {
    isCreatingVersion.value = false
  }
}

function openDeleteVersionModal() {
  showDeleteVersionModal.value = true
}

function closeDeleteVersionModal() {
  showDeleteVersionModal.value = false
}

async function confirmDeleteVersion() {
  if (!selectedVersion.value) return
  isDeletingVersion.value = true
  try {
    await deleteProductVersion(selectedVersion.value.productDataVersionId)
    showDeleteVersionModal.value = false
    selectedVersionId.value = null
    await loadVersions()
    await loadProducts()
  } catch (error) {
    errorMessage.value = error.message || '버전을 삭제하지 못했습니다.'
  } finally {
    isDeletingVersion.value = false
  }
}

async function completeVersion() {
  if (!selectedVersion.value) return
  isCompletingVersion.value = true
  try {
    await completeProductVersion(selectedVersion.value.productDataVersionId)
    await loadVersions()
  } catch (error) {
    errorMessage.value = error.message || '버전을 완료 처리하지 못했습니다.'
  } finally {
    isCompletingVersion.value = false
  }
}

function openEdit(product) {
  editingProduct.value = product
  editDraft.value = {
    productName: product.productName,
    description: product.description ?? '',
    productUrl: product.productUrl ?? '',
    salesStatus: product.salesStatus ?? 'ON_SALE',
    minAmount: product.minAmount ?? '',
    maxAmount: product.maxAmount ?? '',
    minMonth: product.minMonth ?? '',
    maxMonth: product.maxMonth ?? '',
    savingsCategory: product.savingsCategory ?? 'FIXED_INSTALLMENT',
    monthlyMinAmount: product.monthlyMinAmount ?? '',
    monthlyMaxAmount: product.monthlyMaxAmount ?? '',
    stockCode: product.stockCode ?? '',
    etfCategory: product.etfCategory ?? 'DOMESTIC_INDEX',
    trackingIndex: product.trackingIndex ?? '',
    bondRatioPercent: product.bondRatioPercent ?? '',
    riskLevel: product.riskLevel ?? 'MEDIUM',
    annualReturn10yPercent: product.annualReturn10yPercent ?? '',
    rateBaseDate: product.rateTiers?.[0]?.baseDate ?? '',
    rateTiers: (product.rateTiers ?? []).map((tier) => ({ ...tier })),
    preferentialConditions: (product.preferentialConditions ?? []).map((condition) => ({
      ...condition,
    })),
    etfHoldings: (product.etfHoldings ?? []).map((holding) => ({ ...holding })),
  }
}

function closeEdit() {
  editingProduct.value = null
}

async function submitEdit() {
  if (!editingProduct.value) return
  isSavingEdit.value = true
  try {
    const type = editingProduct.value.productType
    const draft = editDraft.value
    const payload = {
      productName: draft.productName,
      description: draft.description,
      productUrl: draft.productUrl,
      salesStatus: draft.salesStatus,
    }

    if (type === 'DEPOSIT') {
      payload.minAmount = toNumberOrNull(draft.minAmount)
      payload.maxAmount = toNumberOrNull(draft.maxAmount)
      payload.minMonth = toNumberOrNull(draft.minMonth)
      payload.maxMonth = toNumberOrNull(draft.maxMonth)
      payload.rateTiers = toRateTiersPayload(draft.rateTiers, draft.rateBaseDate)
      payload.preferentialConditions = toPreferentialConditionsPayload(draft.preferentialConditions)
    } else if (type === 'SAVINGS') {
      payload.savingsCategory = draft.savingsCategory
      payload.monthlyMinAmount = toNumberOrNull(draft.monthlyMinAmount)
      payload.monthlyMaxAmount = toNumberOrNull(draft.monthlyMaxAmount)
      payload.minMonth = toNumberOrNull(draft.minMonth)
      payload.maxMonth = toNumberOrNull(draft.maxMonth)
      payload.rateTiers = toRateTiersPayload(draft.rateTiers, draft.rateBaseDate)
      payload.preferentialConditions = toPreferentialConditionsPayload(draft.preferentialConditions)
    } else if (type === 'ETF') {
      payload.stockCode = draft.stockCode
      payload.etfCategory = draft.etfCategory
      payload.trackingIndex = draft.trackingIndex
      payload.bondRatioPercent = toNumberOrNull(draft.bondRatioPercent)
      payload.riskLevel = draft.riskLevel
      if (draft.annualReturn10yPercent !== '') {
        payload.annualReturn10yPercent = Number(draft.annualReturn10yPercent)
      }
      payload.etfHoldings = toEtfHoldingsPayload(draft.etfHoldings)
    }

    const updated = await updateProduct(
      selectedVersionId.value,
      editingProduct.value.productVersionId,
      payload,
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

function openAddProduct() {
  newProductDraft.value = defaultNewProductDraft()
  showAddProductModal.value = true
}

async function submitAddProduct() {
  isCreatingProduct.value = true
  try {
    const draft = newProductDraft.value
    const payload = {
      productCode: draft.productCode,
      productType: draft.productType,
      productName: draft.productName,
      description: draft.description,
      productUrl: draft.productUrl,
      salesStatus: draft.salesStatus,
    }

    if (draft.productType === 'DEPOSIT') {
      payload.minAmount = toNumberOrNull(draft.minAmount)
      payload.maxAmount = toNumberOrNull(draft.maxAmount)
      payload.minMonth = toNumberOrNull(draft.minMonth)
      payload.maxMonth = toNumberOrNull(draft.maxMonth)
      payload.rateTiers = toRateTiersPayload(draft.rateTiers, draft.rateBaseDate)
      payload.preferentialConditions = toPreferentialConditionsPayload(draft.preferentialConditions)
    } else if (draft.productType === 'SAVINGS') {
      payload.savingsCategory = draft.savingsCategory
      payload.monthlyMinAmount = toNumberOrNull(draft.monthlyMinAmount)
      payload.monthlyMaxAmount = toNumberOrNull(draft.monthlyMaxAmount)
      payload.minMonth = toNumberOrNull(draft.minMonth)
      payload.maxMonth = toNumberOrNull(draft.maxMonth)
      payload.rateTiers = toRateTiersPayload(draft.rateTiers, draft.rateBaseDate)
      payload.preferentialConditions = toPreferentialConditionsPayload(draft.preferentialConditions)
    } else if (draft.productType === 'ETF') {
      payload.stockCode = draft.stockCode
      payload.etfCategory = draft.etfCategory
      payload.trackingIndex = draft.trackingIndex
      payload.annualReturn10yPercent = toNumberOrNull(draft.annualReturn10yPercent)
      payload.bondRatioPercent = toNumberOrNull(draft.bondRatioPercent)
      payload.riskLevel = draft.riskLevel
      payload.etfHoldings = toEtfHoldingsPayload(draft.etfHoldings)
    }

    await createProduct(selectedVersionId.value, payload)
    await loadProducts()
    showAddProductModal.value = false
  } catch (error) {
    errorMessage.value = error.message || '상품을 추가하지 못했습니다.'
  } finally {
    isCreatingProduct.value = false
  }
}

function selectSalesStatus(value) {
  editDraft.value.salesStatus = value
  isSalesStatusOpen.value = false
}

function selectVersion(id) {
  selectedVersionId.value = id
  isVersionSelectOpen.value = false
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
        <button
          v-if="selectedVersion?.status === 'LOADING'"
          class="admin-refresh-button"
          type="button"
          :disabled="isCompletingVersion"
          @click="completeVersion"
        >
          <AppIcon name="check" :size="16" />
          {{ isCompletingVersion ? '처리 중...' : '버전 완료' }}
        </button>
        <button
          class="admin-refresh-button"
          type="button"
          :disabled="isCreatingVersion"
          @click="addVersion"
        >
          <AppIcon name="plus" :size="16" />
          {{ isCreatingVersion ? '생성 중...' : '새 버전 추가' }}
        </button>
        <button
          v-if="selectedVersion"
          class="admin-refresh-button is-danger"
          type="button"
          @click="openDeleteVersionModal"
        >
          <AppIcon name="trash" :size="16" />
          버전 삭제
        </button>
      </div>
    </section>

    <p v-if="errorMessage" class="admin-products-error">{{ errorMessage }}</p>

    <div v-if="viewState === 'loading'" class="admin-products-loading">불러오는 중...</div>

    <template v-else>
      <section class="admin-panel admin-products-summary" aria-label="버전 요약">
        <div class="admin-products-version-select">
          <span id="product-version-label">상품 데이터 버전</span>
          <div class="admin-products-custom-select" :class="{ 'is-open': isVersionSelectOpen }">
            <button
              type="button"
              class="admin-products-custom-select__trigger"
              aria-haspopup="listbox"
              :aria-expanded="isVersionSelectOpen"
              aria-labelledby="product-version-label"
              @click="isVersionSelectOpen = !isVersionSelectOpen"
            >
              {{
                selectedVersion
                  ? `${selectedVersion.versionCode} (${statusLabels[selectedVersion.status] ?? selectedVersion.status})`
                  : '버전을 선택하세요'
              }}
              <span class="admin-products-custom-select__arrow" aria-hidden="true" />
            </button>
            <ul
              v-if="isVersionSelectOpen"
              class="admin-products-custom-select__list"
              role="listbox"
            >
              <li
                v-for="version in versions"
                :key="version.productDataVersionId"
                role="option"
                :class="{ 'is-selected': version.productDataVersionId === selectedVersionId }"
                @click="selectVersion(version.productDataVersionId)"
              >
                {{ version.versionCode }} ({{ statusLabels[version.status] ?? version.status }})
              </li>
            </ul>
          </div>
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

      <div class="admin-products-filter-row">
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
        <button
          v-if="selectedVersion?.status === 'LOADING'"
          class="secondary-button compact"
          type="button"
          @click="openAddProduct"
        >
          + 상품 추가
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
              <td data-label="유형">
                <span
                  class="admin-products-type-badge"
                  :class="`is-${product.productType?.toLowerCase()}`"
                >
                  {{ typeLabel(product.productType) }}
                </span>
              </td>
              <td data-label="상품명">{{ product.productName }}</td>
              <td data-label="상품코드">{{ product.productCode }}</td>
              <td data-label="금리/수익률">{{ formatRate(product) }}</td>
              <td data-label="기간/위험도">{{ formatTerm(product) }}</td>
              <td data-label="판매상태">
                {{ product.salesStatus === 'ON_SALE' ? '판매중' : '판매중지' }}
              </td>
              <td data-label="등록일">{{ product.createdAt?.slice(0, 10) }}</td>
              <td data-label="">
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
          <div class="admin-products-custom-select" :class="{ 'is-open': isSalesStatusOpen }">
            <button
              type="button"
              class="admin-products-custom-select__trigger"
              @click="isSalesStatusOpen = !isSalesStatusOpen"
            >
              {{ editDraft.salesStatus === 'ON_SALE' ? '판매중' : '판매중지' }}
              <span class="admin-products-custom-select__arrow" aria-hidden="true" />
            </button>
            <ul v-if="isSalesStatusOpen" class="admin-products-custom-select__list" role="listbox">
              <li
                role="option"
                :class="{ 'is-selected': editDraft.salesStatus === 'ON_SALE' }"
                @click="selectSalesStatus('ON_SALE')"
              >
                판매중
              </li>
              <li
                role="option"
                :class="{ 'is-selected': editDraft.salesStatus === 'DISCONTINUED' }"
                @click="selectSalesStatus('DISCONTINUED')"
              >
                판매중지
              </li>
            </ul>
          </div>
        </label>

        <template v-if="editingProduct?.productType === 'DEPOSIT'">
          <label>최소 가입금액<input v-model="editDraft.minAmount" type="number" /></label>
          <label
            >최대 가입금액 (없으면 비워두세요)<input v-model="editDraft.maxAmount" type="number"
          /></label>
          <label>최소 가입기간(개월)<input v-model="editDraft.minMonth" type="number" /></label>
          <label>최대 가입기간(개월)<input v-model="editDraft.maxMonth" type="number" /></label>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>금리 구간</span>
              <button
                type="button"
                class="secondary-button compact"
                @click="addRateTier(editDraft.rateTiers)"
              >
                + 구간 추가
              </button>
            </div>
            <label class="admin-products-rate-base-date">
              기준일자 (모든 구간에 동일 적용)
              <input v-model="editDraft.rateBaseDate" type="date" />
            </label>
            <p v-if="editDraft.rateTiers.length === 0" class="admin-products-rate-note">
              등록된 금리 구간이 없습니다. "구간 추가"로 새로 등록하세요.
            </p>
            <div
              v-for="(tier, index) in editDraft.rateTiers"
              :key="tier.baseInterestRateId ?? `new-${index}`"
              class="admin-products-rate-tier-row"
            >
              <label>최소(개월)<input v-model="tier.minMonth" type="number" /></label>
              <label>최대(개월)<input v-model="tier.maxMonth" type="number" /></label>
              <label
                >기본금리(%)<input v-model="tier.baseRatePercent" type="number" step="0.01"
              /></label>
              <label
                >최고금리(%)<input v-model="tier.maxRatePercent" type="number" step="0.01"
              /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="구간 삭제"
                @click="removeRateTier(editDraft.rateTiers, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>우대조건</span>
              <button
                type="button"
                class="secondary-button compact"
                @click="addPreferentialCondition(editDraft.preferentialConditions)"
              >
                + 조건 추가
              </button>
            </div>
            <p
              v-if="editDraft.preferentialConditions.length === 0"
              class="admin-products-rate-note"
            >
              등록된 우대조건이 없습니다.
            </p>
            <div
              v-for="(condition, index) in editDraft.preferentialConditions"
              :key="condition.preferentialInterestRateId ?? `new-${index}`"
              class="admin-products-rate-tier-row"
            >
              <label>조건코드<input v-model="condition.conditionCode" type="text" /></label>
              <label
                >가산금리(%)<input
                  v-model="condition.additionalRatePercent"
                  type="number"
                  step="0.01"
              /></label>
              <label>기준일자<input v-model="condition.baseDate" type="date" /></label>
              <label class="is-wide"
                >조건 설명<input v-model="condition.preferentialCondition" type="text"
              /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="조건 삭제"
                @click="removePreferentialCondition(editDraft.preferentialConditions, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="editingProduct?.productType === 'SAVINGS'">
          <label>
            적금 유형
            <select v-model="editDraft.savingsCategory">
              <option value="FIXED_INSTALLMENT">정액적립식</option>
              <option value="FREE_INSTALLMENT">자유적립식</option>
            </select>
          </label>
          <label>월 최소 납입액<input v-model="editDraft.monthlyMinAmount" type="number" /></label>
          <label>월 최대 납입액<input v-model="editDraft.monthlyMaxAmount" type="number" /></label>
          <label>최소 가입기간(개월)<input v-model="editDraft.minMonth" type="number" /></label>
          <label>최대 가입기간(개월)<input v-model="editDraft.maxMonth" type="number" /></label>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>금리 구간</span>
              <button
                type="button"
                class="secondary-button compact"
                @click="addRateTier(editDraft.rateTiers)"
              >
                + 구간 추가
              </button>
            </div>
            <label class="admin-products-rate-base-date">
              기준일자 (모든 구간에 동일 적용)
              <input v-model="editDraft.rateBaseDate" type="date" />
            </label>
            <p v-if="editDraft.rateTiers.length === 0" class="admin-products-rate-note">
              등록된 금리 구간이 없습니다. "구간 추가"로 새로 등록하세요.
            </p>
            <div
              v-for="(tier, index) in editDraft.rateTiers"
              :key="tier.baseInterestRateId ?? `new-${index}`"
              class="admin-products-rate-tier-row"
            >
              <label>최소(개월)<input v-model="tier.minMonth" type="number" /></label>
              <label>최대(개월)<input v-model="tier.maxMonth" type="number" /></label>
              <label
                >기본금리(%)<input v-model="tier.baseRatePercent" type="number" step="0.01"
              /></label>
              <label
                >최고금리(%)<input v-model="tier.maxRatePercent" type="number" step="0.01"
              /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="구간 삭제"
                @click="removeRateTier(editDraft.rateTiers, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>우대조건</span>
              <button
                type="button"
                class="secondary-button compact"
                @click="addPreferentialCondition(editDraft.preferentialConditions)"
              >
                + 조건 추가
              </button>
            </div>
            <p
              v-if="editDraft.preferentialConditions.length === 0"
              class="admin-products-rate-note"
            >
              등록된 우대조건이 없습니다.
            </p>
            <div
              v-for="(condition, index) in editDraft.preferentialConditions"
              :key="condition.preferentialInterestRateId ?? `new-${index}`"
              class="admin-products-rate-tier-row"
            >
              <label>조건코드<input v-model="condition.conditionCode" type="text" /></label>
              <label
                >가산금리(%)<input
                  v-model="condition.additionalRatePercent"
                  type="number"
                  step="0.01"
              /></label>
              <label>기준일자<input v-model="condition.baseDate" type="date" /></label>
              <label class="is-wide"
                >조건 설명<input v-model="condition.preferentialCondition" type="text"
              /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="조건 삭제"
                @click="removePreferentialCondition(editDraft.preferentialConditions, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="editingProduct?.productType === 'ETF'">
          <label>종목코드<input v-model="editDraft.stockCode" type="text" /></label>
          <label>
            ETF 분류
            <select v-model="editDraft.etfCategory">
              <option value="DOMESTIC_INDEX">국내지수</option>
              <option value="FOREIGN_INDEX">해외지수</option>
              <option value="BOND_MIXED">채권혼합</option>
            </select>
          </label>
          <label>추종지수<input v-model="editDraft.trackingIndex" type="text" /></label>
          <label
            >채권비중(%)<input v-model="editDraft.bondRatioPercent" type="number" step="0.01"
          /></label>
          <label>
            위험등급
            <select v-model="editDraft.riskLevel">
              <option value="EX_LOW">매우낮음</option>
              <option value="LOW">낮음</option>
              <option value="MEDIUM">보통</option>
              <option value="HIGH">높음</option>
              <option value="EX_HIGH">매우높음</option>
            </select>
          </label>
          <label>
            10년 연환산 수익률(%)
            <input v-model="editDraft.annualReturn10yPercent" type="number" step="0.01" />
          </label>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>구성종목 (최대 10개)</span>
              <button
                type="button"
                class="secondary-button compact"
                :disabled="editDraft.etfHoldings.length >= 10"
                @click="addEtfHolding(editDraft.etfHoldings)"
              >
                + 종목 추가
              </button>
            </div>
            <p v-if="editDraft.etfHoldings.length === 0" class="admin-products-rate-note">
              등록된 구성종목이 없습니다.
            </p>
            <div
              v-for="(holding, index) in editDraft.etfHoldings"
              :key="holding.holdingId ?? `new-${index}`"
              class="admin-products-rate-tier-row"
            >
              <label
                >순위(1~10)<input v-model="holding.holdingRank" type="number" min="1" max="10"
              /></label>
              <label class="is-wide"
                >종목명<input v-model="holding.holdingName" type="text"
              /></label>
              <label>종목코드<input v-model="holding.holdingCode" type="text" /></label>
              <label>
                자산유형
                <select v-model="holding.assetType">
                  <option v-for="(label, value) in assetTypeLabels" :key="value" :value="value">
                    {{ label }}
                  </option>
                </select>
              </label>
              <label
                >국가코드<input v-model="holding.countryCode" type="text" maxlength="2"
              /></label>
              <label
                >비중(%)<input v-model="holding.weightPercent" type="number" step="0.01"
              /></label>
              <label>기준일자<input v-model="holding.baseDate" type="date" /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="종목 삭제"
                @click="removeEtfHolding(editDraft.etfHoldings, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>
        </template>
      </div>
      <template #actions>
        <button class="secondary-button" type="button" @click="closeEdit">취소</button>
        <button class="primary-button" type="button" :disabled="isSavingEdit" @click="submitEdit">
          {{ isSavingEdit ? '저장 중...' : '저장' }}
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="showAddProductModal"
      title="새 상품 등록"
      description="현재 버전에 새 상품을 등록합니다."
      @close="showAddProductModal = false"
    >
      <div class="admin-products-form">
        <label>
          상품유형
          <select v-model="newProductDraft.productType">
            <option value="DEPOSIT">예금</option>
            <option value="SAVINGS">적금</option>
            <option value="ETF">ETF</option>
          </select>
        </label>
        <label>상품코드<input v-model="newProductDraft.productCode" type="text" /></label>
        <label>상품명<input v-model="newProductDraft.productName" type="text" /></label>
        <label>설명<input v-model="newProductDraft.description" type="text" /></label>
        <label>상품 URL<input v-model="newProductDraft.productUrl" type="text" /></label>
        <label>
          판매상태
          <select v-model="newProductDraft.salesStatus">
            <option value="ON_SALE">판매중</option>
            <option value="DISCONTINUED">판매중지</option>
          </select>
        </label>

        <template v-if="newProductDraft.productType === 'DEPOSIT'">
          <label>최소 가입금액<input v-model="newProductDraft.minAmount" type="number" /></label>
          <label
            >최대 가입금액 (없으면 비워두세요)<input
              v-model="newProductDraft.maxAmount"
              type="number"
          /></label>
          <label
            >최소 가입기간(개월)<input v-model="newProductDraft.minMonth" type="number"
          /></label>
          <label
            >최대 가입기간(개월)<input v-model="newProductDraft.maxMonth" type="number"
          /></label>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>금리 구간</span>
              <button
                type="button"
                class="secondary-button compact"
                @click="addRateTier(newProductDraft.rateTiers)"
              >
                + 구간 추가
              </button>
            </div>
            <label class="admin-products-rate-base-date">
              기준일자 (모든 구간에 동일 적용)
              <input v-model="newProductDraft.rateBaseDate" type="date" />
            </label>
            <p v-if="newProductDraft.rateTiers.length === 0" class="admin-products-rate-note">
              등록된 금리 구간이 없습니다. "구간 추가"로 새로 등록하세요.
            </p>
            <div
              v-for="(tier, index) in newProductDraft.rateTiers"
              :key="index"
              class="admin-products-rate-tier-row"
            >
              <label>최소(개월)<input v-model="tier.minMonth" type="number" /></label>
              <label>최대(개월)<input v-model="tier.maxMonth" type="number" /></label>
              <label
                >기본금리(%)<input v-model="tier.baseRatePercent" type="number" step="0.01"
              /></label>
              <label
                >최고금리(%)<input v-model="tier.maxRatePercent" type="number" step="0.01"
              /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="구간 삭제"
                @click="removeRateTier(newProductDraft.rateTiers, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>우대조건</span>
              <button
                type="button"
                class="secondary-button compact"
                @click="addPreferentialCondition(newProductDraft.preferentialConditions)"
              >
                + 조건 추가
              </button>
            </div>
            <p
              v-if="newProductDraft.preferentialConditions.length === 0"
              class="admin-products-rate-note"
            >
              등록된 우대조건이 없습니다.
            </p>
            <div
              v-for="(condition, index) in newProductDraft.preferentialConditions"
              :key="index"
              class="admin-products-rate-tier-row"
            >
              <label>조건코드<input v-model="condition.conditionCode" type="text" /></label>
              <label
                >가산금리(%)<input
                  v-model="condition.additionalRatePercent"
                  type="number"
                  step="0.01"
              /></label>
              <label>기준일자<input v-model="condition.baseDate" type="date" /></label>
              <label class="is-wide"
                >조건 설명<input v-model="condition.preferentialCondition" type="text"
              /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="조건 삭제"
                @click="removePreferentialCondition(newProductDraft.preferentialConditions, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="newProductDraft.productType === 'SAVINGS'">
          <label>
            적금 유형
            <select v-model="newProductDraft.savingsCategory">
              <option value="FIXED_INSTALLMENT">정액적립식</option>
              <option value="FREE_INSTALLMENT">자유적립식</option>
            </select>
          </label>
          <label
            >월 최소 납입액<input v-model="newProductDraft.monthlyMinAmount" type="number"
          /></label>
          <label
            >월 최대 납입액<input v-model="newProductDraft.monthlyMaxAmount" type="number"
          /></label>
          <label
            >최소 가입기간(개월)<input v-model="newProductDraft.minMonth" type="number"
          /></label>
          <label
            >최대 가입기간(개월)<input v-model="newProductDraft.maxMonth" type="number"
          /></label>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>금리 구간</span>
              <button
                type="button"
                class="secondary-button compact"
                @click="addRateTier(newProductDraft.rateTiers)"
              >
                + 구간 추가
              </button>
            </div>
            <label class="admin-products-rate-base-date">
              기준일자
              <input v-model="newProductDraft.rateBaseDate" type="date" />
            </label>
            <p v-if="newProductDraft.rateTiers.length === 0" class="admin-products-rate-note">
              등록된 금리 구간이 없습니다. "구간 추가"로 새로 등록하세요.
            </p>
            <div
              v-for="(tier, index) in newProductDraft.rateTiers"
              :key="index"
              class="admin-products-rate-tier-row"
            >
              <label>최소(개월)<input v-model="tier.minMonth" type="number" /></label>
              <label>최대(개월)<input v-model="tier.maxMonth" type="number" /></label>
              <label
                >기본금리(%)<input v-model="tier.baseRatePercent" type="number" step="0.01"
              /></label>
              <label
                >최고금리(%)<input v-model="tier.maxRatePercent" type="number" step="0.01"
              /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="구간 삭제"
                @click="removeRateTier(newProductDraft.rateTiers, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>우대조건</span>
              <button
                type="button"
                class="secondary-button compact"
                @click="addPreferentialCondition(newProductDraft.preferentialConditions)"
              >
                + 조건 추가
              </button>
            </div>
            <p
              v-if="newProductDraft.preferentialConditions.length === 0"
              class="admin-products-rate-note"
            >
              등록된 우대조건이 없습니다.
            </p>
            <div
              v-for="(condition, index) in newProductDraft.preferentialConditions"
              :key="index"
              class="admin-products-rate-tier-row"
            >
              <label>조건코드<input v-model="condition.conditionCode" type="text" /></label>
              <label
                >가산금리(%)<input
                  v-model="condition.additionalRatePercent"
                  type="number"
                  step="0.01"
              /></label>
              <label>기준일자<input v-model="condition.baseDate" type="date" /></label>
              <label class="is-wide"
                >조건 설명<input v-model="condition.preferentialCondition" type="text"
              /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="조건 삭제"
                @click="removePreferentialCondition(newProductDraft.preferentialConditions, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="newProductDraft.productType === 'ETF'">
          <label>종목코드<input v-model="newProductDraft.stockCode" type="text" /></label>
          <label>
            ETF 분류
            <select v-model="newProductDraft.etfCategory">
              <option value="DOMESTIC_INDEX">국내지수</option>
              <option value="FOREIGN_INDEX">해외지수</option>
              <option value="BOND_MIXED">채권혼합</option>
            </select>
          </label>
          <label>추종지수<input v-model="newProductDraft.trackingIndex" type="text" /></label>
          <label
            >10년 연환산 수익률(%)<input
              v-model="newProductDraft.annualReturn10yPercent"
              type="number"
              step="0.01"
          /></label>
          <label
            >채권비중(%)<input v-model="newProductDraft.bondRatioPercent" type="number" step="0.01"
          /></label>
          <label>
            위험등급
            <select v-model="newProductDraft.riskLevel">
              <option value="EX_LOW">매우낮음</option>
              <option value="LOW">낮음</option>
              <option value="MEDIUM">보통</option>
              <option value="HIGH">높음</option>
              <option value="EX_HIGH">매우높음</option>
            </select>
          </label>

          <div class="admin-products-rate-tiers">
            <div class="admin-products-rate-tiers__header">
              <span>구성종목</span>
              <button
                type="button"
                class="secondary-button compact"
                :disabled="newProductDraft.etfHoldings.length >= 10"
                @click="addEtfHolding(newProductDraft.etfHoldings)"
              >
                + 종목 추가
              </button>
            </div>
            <p v-if="newProductDraft.etfHoldings.length === 0" class="admin-products-rate-note">
              등록된 구성종목이 없습니다.
            </p>
            <div
              v-for="(holding, index) in newProductDraft.etfHoldings"
              :key="index"
              class="admin-products-rate-tier-row"
            >
              <label
                >순위(1~10)<input v-model="holding.holdingRank" type="number" min="1" max="10"
              /></label>
              <label class="is-wide"
                >종목명<input v-model="holding.holdingName" type="text"
              /></label>
              <label>종목코드<input v-model="holding.holdingCode" type="text" /></label>
              <label>
                자산유형
                <select v-model="holding.assetType">
                  <option v-for="(label, value) in assetTypeLabels" :key="value" :value="value">
                    {{ label }}
                  </option>
                </select>
              </label>
              <label
                >국가코드<input v-model="holding.countryCode" type="text" maxlength="2"
              /></label>
              <label
                >비중(%)<input v-model="holding.weightPercent" type="number" step="0.01"
              /></label>
              <label>기준일자<input v-model="holding.baseDate" type="date" /></label>
              <button
                type="button"
                class="admin-products-rate-tier-remove"
                aria-label="종목 삭제"
                @click="removeEtfHolding(newProductDraft.etfHoldings, index)"
              >
                <AppIcon name="trash" :size="16" />
              </button>
            </div>
          </div>
        </template>
      </div>
      <template #actions>
        <button class="secondary-button" type="button" @click="showAddProductModal = false">
          취소
        </button>
        <button
          class="primary-button"
          type="button"
          :disabled="isCreatingProduct"
          @click="submitAddProduct"
        >
          {{ isCreatingProduct ? '등록 중...' : '등록' }}
        </button>
      </template>
    </ModalSheet>

    <ModalSheet
      :show="showDeleteVersionModal"
      title="버전을 삭제하시겠습니까?"
      :description="`${selectedVersion?.versionCode ?? ''} 버전과 소속 상품 데이터가 모두 삭제됩니다. 삭제 후에는 복구할 수 없습니다.`"
      danger
      @close="closeDeleteVersionModal"
    >
      <template #icon><AppIcon name="trash" :size="25" /></template>
      <template #actions>
        <button
          class="secondary-button"
          type="button"
          :disabled="isDeletingVersion"
          @click="closeDeleteVersionModal"
        >
          취소
        </button>
        <button
          class="danger-button"
          type="button"
          :disabled="isDeletingVersion"
          @click="confirmDeleteVersion"
        >
          {{ isDeletingVersion ? '삭제 중...' : '삭제하기' }}
        </button>
      </template>
    </ModalSheet>
  </AdminLayout>
</template>
