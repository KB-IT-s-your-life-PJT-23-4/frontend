import {
  calculateEstimatedPayableTax,
  calculateFilingTaxCredit,
  PRODUCT_TYPE_META,
} from './finance'

const SCENARIO_COPY = {
  IMMEDIATE: {
    name: '지금 바로 전액 증여',
    description: '예상 증여세를 반영한 금액을 지금부터 운용해요.',
  },
  TAX_OPTIMIZED: {
    name: '공제 한도부터 차근차근',
    description: '현재 공제 한도를 먼저 활용하고 갱신 후 남은 금액을 증여해요.',
  },
}

function number(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatDate(value) {
  return value ? String(value).replaceAll('-', '.') : null
}

function normalizeEtfVolatility(volatility) {
  if (!volatility) return null

  return {
    available: Boolean(volatility.available),
    annualizedVolatilityPercent:
      volatility.annualizedVolatilityPercent == null
        ? null
        : number(volatility.annualizedVolatilityPercent),
    volatilityLevel: volatility.volatilityLevel ?? 'UNAVAILABLE',
    priceObservationCount: number(volatility.priceObservationCount),
    startDate: formatDate(volatility.startDate),
    endDate: formatDate(volatility.endDate),
    calculationBasis: volatility.calculationBasis ?? null,
    notice: volatility.notice ?? '',
  }
}

function allocationRatios(allocation, principal) {
  const total = Math.max(0, number(principal))
  const amounts = {
    DEPOSIT: number(allocation?.depositAmount),
    SAVINGS: number(allocation?.savingsAmount),
    ETF: number(allocation?.etfAmount),
  }
  if (!total) return Object.fromEntries(Object.keys(amounts).map((type) => [type, 0]))

  const entries = Object.entries(amounts)
  let assigned = 0
  return Object.fromEntries(
    entries.map(([type, amount], index) => {
      const ratio =
        index === entries.length - 1
          ? Math.max(0, 100 - assigned)
          : Math.round((amount / total) * 10000) / 100
      assigned += ratio
      return [type, ratio]
    }),
  )
}

function mapProduct(product, selectedProductById = new Map()) {
  const type = product.productType
  const savedSelection = selectedProductById.get(number(product.simulationProductId))
  const baseRate = number(
    product.returnMetric?.baseRatePercent,
    number(product.appliedAnnualRatePercent),
  )
  const maximumRate = number(product.returnMetric?.maxRatePercent, baseRate)
  const annualReturn = number(
    product.returnMetric?.annualReturnPercent,
    number(product.appliedAnnualRatePercent),
  )

  return {
    id: number(product.simulationProductId),
    simulationProductId: number(product.simulationProductId),
    kbProductVersionId: number(product.kbProductVersionId),
    productId: number(product.productId),
    type,
    label: PRODUCT_TYPE_META[type]?.label ?? type,
    name: product.productName,
    provider: type === 'ETF' ? 'KB자산운용' : 'KB국민은행',
    rate: type === 'ETF' ? annualReturn : number(product.appliedAnnualRatePercent, baseRate),
    minRate: baseRate,
    maxRate: maximumRate,
    allocatedAmount: number(product.allocatedAmount),
    monthlyContributionAmount:
      product.monthlyContributionAmount == null ? null : number(product.monthlyContributionAmount),
    allocationRatio: number(product.allocationRatio),
    calculationMethod: product.calculationMethod,
    expectedFutureValue: number(product.expectedFutureValue),
    expectedProfit: number(product.expectedProfit),
    selected: Boolean(product.isSelected),
    minimumContractMonths:
      product.minimumContractMonths == null ? null : number(product.minimumContractMonths),
    maximumContractMonths:
      product.maximumContractMonths == null ? null : number(product.maximumContractMonths),
    reinvestmentSchedule: (product.reinvestmentSchedule ?? []).map((item) => ({
      trancheSequenceNo: number(item.trancheSequenceNo),
      renewalSequenceNo: number(item.renewalSequenceNo),
      renewalDate: formatDate(item.renewalDate),
      completedContractMonths: number(item.completedContractMonths),
    })),
    selectedPreferentialConditions: product.selectedPreferentialConditions?.length
      ? product.selectedPreferentialConditions
      : (savedSelection?.selectedPreferentialConditions ?? []),
    riskLevel: type === 'ETF' ? (ETF_RISK_LEVEL[product.riskLevel] ?? 3) : 1,
    volatility: type === 'ETF' ? normalizeEtfVolatility(product.volatility) : null,
    detailLoaded: false,
  }
}

function mapPortfolio(portfolio, result, selectedProductById) {
  return {
    portfolioId: number(portfolio.portfolioId),
    portfolioType: portfolio.portfolioType,
    expectedFutureValue: number(portfolio.expectedFutureValue),
    expectedProfit: number(portfolio.expectedProfit),
    recommended: Boolean(portfolio.recommended),
    selected: Boolean(portfolio.selected),
    allocation: allocationRatios(portfolio.allocation, result.investmentPrincipal),
    products: (portfolio.productCandidates ?? []).map((product) =>
      mapProduct(product, selectedProductById),
    ),
  }
}

function mapResult(result, investmentEndDate, selectedProductById) {
  const copy = SCENARIO_COPY[result.scenarioType] ?? {
    name: result.scenarioType,
    description: '',
  }
  const tranches = result.tranches ?? []
  const currentGiftAmount = number(tranches[0]?.giftAmount)
  const deferredGiftAmount = tranches
    .slice(1)
    .reduce((sum, tranche) => sum + number(tranche.giftAmount), 0)
  const giftTax = number(result.giftTax)

  const mapped = {
    resultId: number(result.resultId),
    scenarioType: result.scenarioType,
    scenarioName: copy.name,
    description: copy.description,
    deductionAmount: number(result.deductionAmount),
    taxableAmount: number(result.taxableAmount),
    giftTax,
    filingTaxCredit: calculateFilingTaxCredit(giftTax),
    estimatedPayableTax: calculateEstimatedPayableTax(giftTax),
    postTaxAmount: number(result.postTaxAmount),
    investmentPrincipal: number(result.investmentPrincipal),
    totalDonorOutflow: number(result.donorRequiredAmount),
    currentGiftAmount,
    deferredGiftAmount,
    deferredGiftDate: deferredGiftAmount ? formatDate(tranches[1]?.giftDate) : null,
    giftSchedule: tranches.map((tranche) => ({
      order: number(tranche.sequenceNo),
      label: number(tranche.sequenceNo) === 1 ? '첫 번째 증여' : `${tranche.sequenceNo}차 증여`,
      date: formatDate(tranche.giftDate),
      amount: number(tranche.giftAmount),
      investmentAmount: number(tranche.investmentAmount),
      withinPeriod:
        !investmentEndDate ||
        !tranche.giftDate ||
        String(tranche.giftDate) <= String(investmentEndDate),
    })),
  }
  mapped.portfolios = (result.portfolios ?? []).map((portfolio) =>
    mapPortfolio(portfolio, mapped, selectedProductById),
  )
  return mapped
}

export function normalizeSimulationResponse(response) {
  if (!response?.input) return response

  const selectedProductById = new Map(
    (response.selection?.selectedProducts ?? []).map((product) => [
      number(product.simulationProductId),
      product,
    ]),
  )
  const results = (response.results ?? []).map((result) =>
    mapResult(result, response.input.investmentEndDate, selectedProductById),
  )
  const recommendedByProfile = Object.fromEntries(
    (response.recommendations ?? []).map((recommendation) => {
      const scenario = results.find((item) => item.resultId === number(recommendation.resultId))
      const portfolio = scenario?.portfolios.find(
        (item) => item.portfolioId === number(recommendation.portfolioId),
      )
      return [recommendation.portfolioType, { scenario, portfolio }]
    }),
  )

  return {
    ...response,
    id: number(response.simulationId),
    requestedAmount: number(response.input.requestedAmount),
    giftDate: formatDate(response.input.giftDate ?? response.input.asOfDate),
    years: number(response.input.investmentPeriodMonths) / 12,
    donorPaysTax: response.input.taxPaymentMethod === 'DONOR_PAYS',
    previousGiftAmount: number(response.giftHistorySummary?.previousGiftAmount),
    remainingDeductionAmount: number(response.giftHistorySummary?.remainingDeductionAmount),
    deductionResetDate: formatDate(response.giftHistorySummary?.deductionRenewalDate),
    endDate: formatDate(response.input.investmentEndDate),
    exceedsDeduction:
      number(response.input.requestedAmount) >
      number(response.giftHistorySummary?.remainingDeductionAmount),
    results,
    recommendedByProfile,
    raw: response,
  }
}

function amountRangeLabel(range, unit = '원') {
  if (!range) return '상품 상세에서 확인'
  if (range.minimumAmount == null && range.maximumAmount == null) {
    return '상품 상세에서 확인'
  }
  if (range.maximumAmount == null) {
    return `${number(range.minimumAmount).toLocaleString('ko-KR')}${unit} 이상`
  }
  return `${number(range.minimumAmount).toLocaleString('ko-KR')}~${number(range.maximumAmount).toLocaleString('ko-KR')}${unit}`
}

function termLabel(term) {
  if (!term) return '상품 상세에서 확인'
  if (term.maximumMonths == null) return `${number(term.minimumMonths)}개월 이상`
  return `${number(term.minimumMonths)}~${number(term.maximumMonths)}개월`
}

const ETF_RISK_LEVEL = {
  EX_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  EX_HIGH: 5,
}

export function mergeProductDetail(product, response) {
  const detail = response?.product
  if (!detail) return product

  const details = detail.details ?? {}
  const preferentialConditions = details.preferentialConditions ?? []
  const isSavings = detail.productType === 'SAVINGS'
  const range = isSavings ? details.monthlyPayment : details.subscriptionAmount

  return {
    ...product,
    name: detail.productName ?? product.name,
    type: detail.productType ?? product.type,
    description: detail.description ?? '',
    siteUrl: detail.productUrl ?? null,
    salesStatus: detail.salesStatus ?? null,
    limit: amountRangeLabel(range, isSavings ? '원/월' : '원'),
    period: termLabel(details.term),
    minRate: number(details.rateSummary?.minimumBaseRatePercent, product.minRate),
    maxRate: number(details.rateSummary?.maximumRatePercent, product.maxRate),
    conditions: preferentialConditions.map((condition) => condition.description),
    preferentialConditions,
    trackingIndex: details.trackingIndex ?? null,
    topHoldings: (details.holdings ?? []).map((holding) => ({
      rank: number(holding.rank),
      name: holding.holdingName,
      code: holding.holdingCode,
      assetType: holding.assetType,
      countryCode: holding.countryCode,
      ratio: number(holding.weightPercent),
    })),
    riskLevel: ETF_RISK_LEVEL[details.riskLevel] ?? product.riskLevel,
    volatility: normalizeEtfVolatility(details.volatility) ?? product.volatility ?? null,
    reinvestmentPolicy: details.reinvestmentPolicy ?? product.reinvestmentPolicy ?? null,
    calculationPolicy: details.calculationPolicy ?? null,
    detailLoaded: true,
  }
}
