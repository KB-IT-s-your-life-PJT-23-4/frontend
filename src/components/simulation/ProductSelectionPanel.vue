<script setup>
import { computed, reactive, ref, watchEffect } from 'vue'
import AppIcon from '../layout/AppIcon.vue'
import { PRODUCT_TYPE_META } from '../../utils/finance'

const props = defineProps({
  products: {
    type: Array,
    required: true,
  },
  allocation: {
    type: Object,
    required: true,
  },
  selectedProducts: {
    type: Object,
    required: true,
  },
  portfolioProfile: {
    type: String,
    default: 'BALANCED',
  },
})

const emit = defineEmits(['select'])
const expanded = reactive(new Set())
const activeProductType = ref('DEPOSIT')
const productTypeOrder = ['DEPOSIT', 'SAVINGS', 'ETF', 'INSURANCE']
const holdingSegmentColors = [
  '#675db0',
  '#8175cd',
  '#978bdd',
  '#aea4e9',
  '#527da2',
  '#6a97ba',
  '#83afca',
  '#5f9c87',
  '#d0a24b',
  '#c67d75',
]
const holdingAssetPalettes = {
  EQUITY: ['#675db0', '#8175cd', '#9a8ddd', '#b1a6e8'],
  BOND: ['#47779f', '#5d8aae', '#739dbc', '#89afca', '#9dc0d5', '#b2cfdf'],
  CASH: ['#5e9183', '#79a79b', '#96bbb2', '#b4cec7'],
}
const holdingAssetLabels = {
  EQUITY: '주식',
  BOND: '채권',
  CASH: '예금·현금',
}
const portfolioProfileLabels = {
  STABLE: '안정형',
  BALANCED: '균형형',
  GROWTH: '성장형',
}

const productGroups = computed(() =>
  productTypeOrder
    .filter((type) => (props.allocation[type] ?? 0) > 0)
    .map((type) => ({
      type,
      ratio: props.allocation[type],
      ...PRODUCT_TYPE_META[type],
      products: props.products
        .filter(
          (product) =>
            product.type === type &&
            (type !== 'ETF' ||
              (Boolean(product.trackingIndex) &&
                (!product.recommendationProfiles?.length ||
                  product.recommendationProfiles.includes(props.portfolioProfile)))),
        )
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 3),
    })),
)
const portfolioProfileLabel = computed(
  () => portfolioProfileLabels[props.portfolioProfile] ?? '균형형',
)

watchEffect(() => {
  if (!productGroups.value.some((group) => group.type === activeProductType.value)) {
    activeProductType.value = productGroups.value[0]?.type ?? ''
  }
})

watchEffect(() => {
  const etfGroup = productGroups.value.find((group) => group.type === 'ETF')
  if (!etfGroup?.products.length) return

  const selectedEtfId = props.selectedProducts.ETF?.id
  if (!etfGroup.products.some((product) => product.id === selectedEtfId)) {
    emit('select', 'ETF', etfGroup.products[0])
  }
})

const activeProductGroup = computed(() =>
  productGroups.value.find((group) => group.type === activeProductType.value),
)

function toggleDetails(productId) {
  if (expanded.has(productId)) {
    expanded.delete(productId)
  } else {
    expanded.add(productId)
  }
}

function getRateLabel(product) {
  if (product.type === 'ETF') return `평균 수익률 연 ${product.rate}%`
  return `연 ${product.minRate}% ~ ${product.maxRate}%`
}

function getHoldingSegments(topHoldings = []) {
  const assetColorIndexes = {}
  const holdings = topHoldings.slice(0, 10).map((holding, index) => {
    const palette = holdingAssetPalettes[holding.assetType]
    const assetColorIndex = assetColorIndexes[holding.assetType] ?? 0
    const color = palette?.[assetColorIndex % palette.length] ?? holdingSegmentColors[index]

    if (holding.assetType) {
      assetColorIndexes[holding.assetType] = assetColorIndex + 1
    }

    return {
      ...holding,
      rank: index + 1,
      ratio: Math.max(0, Number(holding.ratio) || 0),
      color,
      assetLabel: holdingAssetLabels[holding.assetType] ?? '',
      isOther: false,
    }
  })
  const topTenTotal = holdings.reduce((total, holding) => total + holding.ratio, 0)
  const otherRatio = Math.max(0, Math.round((100 - topTenTotal) * 10) / 10)

  if (otherRatio === 0) return holdings
  return [
    ...holdings,
    {
      name: '기타',
      ratio: otherRatio,
      rank: null,
      color: '#d8dee7',
      assetLabel: '',
      isOther: true,
    },
  ]
}
</script>

<template>
  <section class="product-selection-panel">
    <div class="product-selection-heading">
      <div>
        <h2>비중별 상품을 골라보세요</h2>
        <p>상품을 바꾸면 운용 종료 시점의 예상 금액도 함께 달라져요.</p>
      </div>
    </div>

    <div
      class="product-category-tabs"
      role="tablist"
      aria-label="상품 유형"
      :style="{ '--product-tab-count': productGroups.length }"
    >
      <button
        v-for="group in productGroups"
        :id="`product-tab-${group.type}`"
        :key="group.type"
        type="button"
        role="tab"
        :aria-selected="activeProductType === group.type"
        :aria-controls="`product-panel-${group.type}`"
        :class="{ active: activeProductType === group.type }"
        :style="{ '--product-tab-color': group.color }"
        @click="activeProductType = group.type"
      >
        <span>{{ group.label }}</span>
        <small>{{ group.ratio }}%</small>
      </button>
    </div>

    <div v-if="activeProductGroup" class="product-category-list">
      <section
        :id="`product-panel-${activeProductGroup.type}`"
        class="product-category-section"
        role="tabpanel"
        :aria-labelledby="`product-tab-${activeProductGroup.type}`"
      >
        <div class="product-category-heading">
          <div>
            <span class="product-category-dot" :style="{ background: activeProductGroup.color }" />
            <strong>{{ activeProductGroup.label }}</strong>
            <span>{{ activeProductGroup.ratio }}% 운용</span>
          </div>
          <small>{{
            activeProductGroup.type === 'ETF'
              ? `${portfolioProfileLabel} 맞춤 3개`
              : '수익률 순 3개'
          }}</small>
        </div>

        <div class="selectable-product-list">
          <article
            v-for="(product, index) in activeProductGroup.products"
            :key="product.id"
            class="selectable-product-card"
            :class="{ selected: selectedProducts[activeProductGroup.type]?.id === product.id }"
          >
            <label class="selectable-product-main">
              <input
                type="radio"
                :name="`product-${activeProductGroup.type}`"
                :checked="selectedProducts[activeProductGroup.type]?.id === product.id"
                @change="emit('select', activeProductGroup.type, product)"
              />
              <span class="product-radio"><i /></span>
              <span class="product-rank">{{ index + 1 }}</span>
              <span class="selectable-product-copy">
                <small>{{ product.provider }}</small>
                <strong>{{ product.name }}</strong>
                <span>{{ getRateLabel(product) }}</span>
              </span>
              <span class="product-risk-level" :class="`risk-${product.riskLevel}`">
                위험도 {{ product.riskLevel }}단계
              </span>
            </label>

            <button
              class="product-detail-toggle"
              type="button"
              :aria-expanded="expanded.has(product.id)"
              @click="toggleDetails(product.id)"
            >
              상세 보기
              <AppIcon name="chevron" :size="15" :class="{ expanded: expanded.has(product.id) }" />
            </button>

            <div v-if="expanded.has(product.id)" class="selectable-product-details">
              <template v-if="product.type === 'ETF'">
                <div class="product-tracking-index">
                  <span>추종 지수</span>
                  <strong>{{ product.trackingIndex }}</strong>
                </div>
                <div v-if="product.topHoldings?.length" class="product-holdings">
                  <div class="product-holdings-heading">
                    <span>구성 종목 비중 TOP 10</span>
                  </div>
                  <div
                    class="product-holdings-chart"
                    role="group"
                    :aria-label="`${product.name} 구성 종목 비중`"
                  >
                    <button
                      v-for="segment in getHoldingSegments(product.topHoldings)"
                      :key="segment.isOther ? 'other' : segment.name"
                      type="button"
                      class="product-holding-segment"
                      :class="{ other: segment.isOther }"
                      :style="{
                        width: `${segment.ratio}%`,
                        '--holding-segment-color': segment.color,
                      }"
                      :aria-label="
                        segment.isOther
                          ? `기타 ${segment.ratio}%`
                          : `${segment.rank}위 ${segment.name} ${segment.ratio}%`
                      "
                    >
                      <span class="product-holding-tooltip" role="tooltip">
                        <small>
                          {{
                            segment.isOther
                              ? '나머지 비중'
                              : [segment.assetLabel, `${segment.rank}위`].filter(Boolean).join(' · ')
                          }}
                        </small>
                        <strong>{{ segment.name }}</strong>
                        <b>{{ segment.ratio }}%</b>
                      </span>
                    </button>
                  </div>
                  <ol class="product-holdings-list">
                    <li v-for="(holding, holdingIndex) in product.topHoldings" :key="holding.name">
                      <span>{{ holdingIndex + 1 }}</span>
                      <strong>{{ holding.name }}</strong>
                      <b>{{ holding.ratio }}%</b>
                    </li>
                  </ol>
                </div>
              </template>
              <template v-else>
                <div>
                  <span>가입·납입 한도</span>
                  <strong>{{ product.limit }}</strong>
                </div>
                <div>
                  <span>운용 기간</span>
                  <strong>{{ product.period }}</strong>
                </div>
                <div v-if="product.conditions?.length" class="product-condition-list">
                  <span>우대 조건</span>
                  <p v-for="condition in product.conditions" :key="condition">
                    <AppIcon name="check" :size="14" /> {{ condition }}
                  </p>
                </div>
              </template>
              <a
                v-if="product.siteUrl"
                class="product-site-link"
                :href="product.siteUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                상품 사이트 바로가기
                <AppIcon name="external" :size="14" />
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>

    <p class="product-data-notice">
      상품명과 수익률은 화면 시연을 위한 데모 정보이며, 실제 가입 전 최신 상품 설명서를 확인해야
      해요.
    </p>
  </section>
</template>
