const TAX_BRACKETS = [
  { ceiling: 100000000, rate: 0.1, deduction: 0 },
  { ceiling: 500000000, rate: 0.2, deduction: 10000000 },
  { ceiling: 1000000000, rate: 0.3, deduction: 60000000 },
  { ceiling: 3000000000, rate: 0.4, deduction: 160000000 },
  { ceiling: Infinity, rate: 0.5, deduction: 460000000 },
]
const MINIMUM_TAXABLE_BASE = 500000

export const PRODUCT_TYPE_META = {
  DEPOSIT: { label: '예금', color: '#4f7fa8' },
  SAVINGS: { label: '적금', color: '#79a9c7' },
  ETF: { label: 'ETF', color: '#8276d8' },
}

export const PRODUCT_CALCULATION_METHOD = {
  DEPOSIT: 'DEPOSIT_SIMPLE_INTEREST',
  SAVINGS: 'SAVINGS_MONTHLY_INSTALLMENT',
  ETF: 'ETF_COMPOUND_RETURN',
}

export function calculateGiftTax(taxableAmount) {
  if (!Number.isFinite(taxableAmount) || taxableAmount <= 0) return 0
  const bracket = TAX_BRACKETS.find((item) => taxableAmount <= item.ceiling)
  return Math.max(0, Math.round(taxableAmount * bracket.rate - bracket.deduction))
}

export function calculateFilingTaxCredit(giftTax) {
  const amount = Number(giftTax)
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.round(amount * 0.03)
}

export function calculateEstimatedPayableTax(giftTax) {
  const amount = Number(giftTax)
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.max(0, Math.round(amount) - calculateFilingTaxCredit(amount))
}

export function annualizeTotalReturn(totalReturnRatePercent, investmentPeriodMonths) {
  const totalReturnRate = Number(totalReturnRatePercent)
  const periodMonths = Number(investmentPeriodMonths)

  if (!Number.isFinite(totalReturnRate) || !Number.isFinite(periodMonths) || periodMonths <= 0) {
    return 0
  }

  const totalGrowthFactor = 1 + totalReturnRate / 100
  if (totalGrowthFactor <= 0) return -100

  const annualizedRate = (totalGrowthFactor ** (12 / periodMonths) - 1) * 100
  const roundedRate = Number(annualizedRate.toFixed(2))

  return Object.is(roundedRate, -0) ? 0 : roundedRate
}

export function futureValue(principal, annualRate, years = 10) {
  if (!Number.isFinite(principal) || principal <= 0) return 0
  return Math.round(principal * (1 + annualRate / 100) ** Math.max(0, years))
}

export function calculateDepositFutureValue(principal, annualRate, months) {
  const amount = Number(principal) || 0
  if (amount <= 0) return 0

  const rate = Number(annualRate) || 0
  const periodMonths = Math.max(0, Number(months) || 0)
  return Math.round(amount * (1 + (rate / 100) * (periodMonths / 12)))
}

export function calculateSavingsFutureValue(
  totalContribution,
  annualRate,
  months,
  paymentTiming = 'END_OF_MONTH',
) {
  const principal = Number(totalContribution) || 0
  if (principal <= 0) return 0

  const paymentCount = Math.max(0, Math.round(Number(months) || 0))
  if (paymentCount === 0) return Math.round(principal)

  const monthlyContribution = principal / paymentCount
  const monthlyRate = (Number(annualRate) || 0) / 100 / 12

  if (monthlyRate === 0) return Math.round(principal)

  const ordinaryAnnuityValue =
    monthlyContribution * (((1 + monthlyRate) ** paymentCount - 1) / monthlyRate)
  const timingMultiplier = paymentTiming === 'BEGINNING_OF_MONTH' ? 1 + monthlyRate : 1

  return Math.round(ordinaryAnnuityValue * timingMultiplier)
}

export function calculateEtfFutureValue(principal, annualReturnRate, months) {
  const amount = Number(principal) || 0
  if (amount <= 0) return 0

  const annualGrowthFactor = Math.max(0, 1 + (Number(annualReturnRate) || 0) / 100)
  const periodMonths = Math.max(0, Number(months) || 0)
  return Math.round(amount * annualGrowthFactor ** (periodMonths / 12))
}

function buildReinvestmentPeriods(product, months, trancheSequenceNo) {
  const totalMonths = Math.max(0, Math.round(Number(months) || 0))
  const fitPeriodsToMonths = (periods) => {
    let remainingMonths = totalMonths
    return periods.flatMap((period) => {
      if (remainingMonths <= 0) return []
      const appliedMonths = Math.min(period, remainingMonths)
      remainingMonths -= appliedMonths
      return appliedMonths > 0 ? [appliedMonths] : []
    })
  }
  const contractRatePeriods = (product?.contractRateSchedule ?? [])
    .filter(
      (item) =>
        trancheSequenceNo == null || Number(item.trancheSequenceNo) === Number(trancheSequenceNo),
    )
    .sort((a, b) => Number(a.contractSequenceNo) - Number(b.contractSequenceNo))
    .map((item) => Math.max(0, Number(item.contractMonths) || 0))
    .filter((period) => period > 0)

  if (contractRatePeriods.length) return fitPeriodsToMonths(contractRatePeriods)

  const scheduledPeriods = (product?.reinvestmentSchedule ?? [])
    .filter(
      (item) =>
        trancheSequenceNo == null || Number(item.trancheSequenceNo) === Number(trancheSequenceNo),
    )
    .sort((a, b) => Number(a.renewalSequenceNo) - Number(b.renewalSequenceNo))
    .map((item) => Math.max(0, Number(item.completedContractMonths) || 0))
    .filter((period) => period > 0)

  if (scheduledPeriods.length) {
    const completedMonths = scheduledPeriods.reduce((sum, period) => sum + period, 0)
    if (completedMonths >= totalMonths) return fitPeriodsToMonths(scheduledPeriods)
    const finalPeriod = totalMonths - completedMonths
    const minimumMonths = Number(product?.minimumContractMonths)
    const maximumMonths = Number(product?.maximumContractMonths)
    const finalPeriodIsInvestable =
      finalPeriod > 0 &&
      Number.isInteger(minimumMonths) &&
      Number.isInteger(maximumMonths) &&
      finalPeriod >= minimumMonths &&
      finalPeriod <= maximumMonths
    return finalPeriodIsInvestable ? [...scheduledPeriods, finalPeriod] : scheduledPeriods
  }

  const minimumMonths = Number(product?.minimumContractMonths)
  const maximumMonths = Number(product?.maximumContractMonths)
  if (
    totalMonths <= 0 ||
    !Number.isInteger(minimumMonths) ||
    !Number.isInteger(maximumMonths) ||
    minimumMonths <= 0 ||
    maximumMonths < minimumMonths
  ) {
    return [totalMonths]
  }

  for (let coveredMonths = totalMonths; coveredMonths >= minimumMonths; coveredMonths -= 1) {
    const contractCount = Math.ceil(coveredMonths / maximumMonths)
    if (contractCount > Math.floor(coveredMonths / minimumMonths)) continue

    let remainingMonths = coveredMonths
    return Array.from({ length: contractCount }, (_, index) => {
      const remainingContracts = contractCount - index - 1
      const contractMonths = Math.min(
        maximumMonths,
        remainingMonths - remainingContracts * minimumMonths,
      )
      remainingMonths -= contractMonths
      return contractMonths
    })
  }
  return []
}

function contractRates(product, trancheSequenceNo) {
  return (product?.contractRateSchedule ?? [])
    .filter(
      (item) =>
        trancheSequenceNo == null || Number(item.trancheSequenceNo) === Number(trancheSequenceNo),
    )
    .sort((a, b) => Number(a.contractSequenceNo) - Number(b.contractSequenceNo))
}

export function calculateProductFutureValue(product, principal, months, trancheSequenceNo = null) {
  const productType = product?.type ?? product?.productType
  const method = product?.calculationMethod ?? PRODUCT_CALCULATION_METHOD[productType]
  const annualRate =
    product?.rate ?? product?.annualReturnRatePercent ?? product?.appliedAnnualRatePercent ?? 0

  if (method === PRODUCT_CALCULATION_METHOD.DEPOSIT) {
    const periods = buildReinvestmentPeriods(product, months, trancheSequenceNo)
    const scheduledRates = contractRates(product, trancheSequenceNo)
    if (!periods.length) return principal
    return periods.reduce(
      (maturityValue, period, index) =>
        calculateDepositFutureValue(
          maturityValue,
          Number(scheduledRates[index]?.appliedRatePercent ?? annualRate),
          period,
        ),
      principal,
    )
  }

  if (method === PRODUCT_CALCULATION_METHOD.SAVINGS) {
    const periods = buildReinvestmentPeriods(product, months, trancheSequenceNo)
    const scheduledRates = contractRates(product, trancheSequenceNo)
    if (!periods.length) return principal
    return periods.reduce(
      (maturityValue, period, index) =>
        calculateSavingsFutureValue(
          maturityValue,
          Number(scheduledRates[index]?.appliedRatePercent ?? annualRate),
          period,
          product?.paymentTiming ?? 'END_OF_MONTH',
        ),
      principal,
    )
  }

  return calculateEtfFutureValue(principal, annualRate, months)
}

export function formatWon(value) {
  return `${Math.round(Number(value) || 0).toLocaleString('ko-KR')}원`
}

export function formatCompactWon(value) {
  const amount = Math.round(Number(value) || 0)
  if (amount >= 100000000) {
    const amountInManWon = Math.round(amount / 10000)
    const eok = Math.floor(amountInManWon / 10000)
    const manWon = amountInManWon % 10000

    if (manWon === 0) return `${eok.toLocaleString('ko-KR')}억원`
    return `${eok.toLocaleString('ko-KR')}억 ${manWon.toLocaleString('ko-KR')}만원`
  }
  if (amount >= 10000) return `${Math.round(amount / 10000).toLocaleString('ko-KR')}만원`
  return `${amount.toLocaleString('ko-KR')}원`
}

export function normalizeAmount(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function toDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return new Date(value)
  const normalized = String(value ?? '').replaceAll('.', '-')
  const parsed = new Date(`${normalized}T00:00:00`)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function addYears(date, years) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function formatDate(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replaceAll('. ', '.')
    .replace(/\.$/, '')
}

function monthsBetween(start, end) {
  let wholeMonths =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (end.getDate() < start.getDate()) wholeMonths -= 1
  return Math.max(0, wholeMonths)
}

function calculateTaxStage(giftAmount, deductionAmount, donorPaysTax) {
  const baseGiftAmount = Math.max(0, giftAmount)
  const deduction = Math.max(0, Math.min(baseGiftAmount, deductionAmount))

  if (!donorPaysTax) {
    const taxableAmount = Math.max(0, baseGiftAmount - deduction)
    const calculatedGiftTax = calculateGiftTax(taxableAmount)
    const filingTaxCredit = calculateFilingTaxCredit(calculatedGiftTax)
    const giftTax = calculateEstimatedPayableTax(calculatedGiftTax)
    return {
      taxableAmount,
      giftTax,
      filingTaxCredit,
      estimatedPayableTax: giftTax,
    }
  }

  let estimatedPayableTax = 0
  let giftTax = 0
  let filingTaxCredit = 0

  for (let index = 0; index < 30; index += 1) {
    const taxableAmount = Math.max(0, baseGiftAmount + estimatedPayableTax - deduction)
    const calculatedGiftTax = calculateGiftTax(taxableAmount)
    filingTaxCredit = calculateFilingTaxCredit(calculatedGiftTax)
    giftTax = calculateEstimatedPayableTax(calculatedGiftTax)
    const nextPayableTax = giftTax
    if (Math.abs(nextPayableTax - estimatedPayableTax) <= 1) {
      estimatedPayableTax = nextPayableTax
      break
    }
    estimatedPayableTax = nextPayableTax
  }

  return {
    taxableAmount: Math.max(0, baseGiftAmount + estimatedPayableTax - deduction),
    giftTax,
    filingTaxCredit,
    estimatedPayableTax,
  }
}

function applySafeAssetReturnPriority({
  allocation,
  principal,
  savingsCapacity,
  depositProduct,
  savingsProduct,
  investmentPeriodMonths,
  schedule,
  years,
  startDate,
  endDate,
}) {
  const investmentPrincipal = Math.max(0, Number(principal) || 0)
  if (investmentPrincipal <= 0) return allocation

  const etfAmount = Math.round(investmentPrincipal * ((allocation.ETF ?? 0) / 100))
  const safeAssetAmount = Math.max(0, investmentPrincipal - etfAmount)
  const projectSafeProduct = (type, product) =>
    schedule?.length
      ? calculatePortfolioValue({
          schedule,
          allocation: { [type]: 100 },
          selectedProducts: { [type]: product },
          years,
          startDate,
          endDate,
        })
      : calculateProductFutureValue(product, investmentPrincipal, investmentPeriodMonths)
  const depositProjectedValue = projectSafeProduct('DEPOSIT', depositProduct)
  const savingsProjectedValue = projectSafeProduct('SAVINGS', savingsProduct)
  const savingsPreferred = savingsProjectedValue > depositProjectedValue
  const savingsAmount = savingsPreferred
    ? Math.min(safeAssetAmount, Math.max(0, Number(savingsCapacity) || 0))
    : 0
  const depositAmount = safeAssetAmount - savingsAmount
  const depositRatio = Math.round((depositAmount / investmentPrincipal) * 10000) / 100
  const savingsRatio = Math.round((savingsAmount / investmentPrincipal) * 10000) / 100

  return {
    DEPOSIT: depositRatio,
    SAVINGS: savingsRatio,
    ETF: Math.max(0, Math.round((100 - depositRatio - savingsRatio) * 100) / 100),
  }
}

export function getPortfolioAllocations(years, options = {}) {
  let profiles
  if (years <= 3) {
    profiles = {
      STABLE: { DEPOSIT: 0, SAVINGS: 90, ETF: 10 },
      BALANCED: { DEPOSIT: 0, SAVINGS: 80, ETF: 20 },
      GROWTH: { DEPOSIT: 0, SAVINGS: 60, ETF: 40 },
    }
  } else if (years < 10) {
    profiles = {
      STABLE: { DEPOSIT: 0, SAVINGS: 80, ETF: 20 },
      BALANCED: { DEPOSIT: 0, SAVINGS: 70, ETF: 30 },
      GROWTH: { DEPOSIT: 0, SAVINGS: 50, ETF: 50 },
    }
  } else {
    profiles = {
      STABLE: { DEPOSIT: 0, SAVINGS: 80, ETF: 20 },
      BALANCED: { DEPOSIT: 0, SAVINGS: 60, ETF: 40 },
      GROWTH: { DEPOSIT: 0, SAVINGS: 40, ETF: 60 },
    }
  }

  if (
    options.principal == null ||
    options.savingsCapacity == null ||
    options.depositProduct == null ||
    options.savingsProduct == null
  ) {
    return profiles
  }

  return Object.fromEntries(
    Object.entries(profiles).map(([profile, allocation]) => [
      profile,
      applySafeAssetReturnPriority({
        allocation,
        principal: options.principal,
        savingsCapacity: options.savingsCapacity,
        depositProduct: options.depositProduct,
        savingsProduct: options.savingsProduct,
        investmentPeriodMonths: options.investmentPeriodMonths ?? years * 12,
        schedule: options.schedule,
        years,
        startDate: options.startDate,
        endDate: options.endDate,
      }),
    ]),
  )
}

export function getPortfolioAllocation(years, options) {
  return getPortfolioAllocations(years, options).BALANCED
}

export function calculatePortfolioValue({
  schedule,
  allocation,
  selectedProducts,
  years,
  startDate,
  endDate,
}) {
  const start = toDate(startDate) ?? new Date()
  const end = toDate(endDate) ?? addYears(start, years)

  return Math.round(
    schedule.reduce((scenarioTotal, installment) => {
      const giftDate = toDate(installment.date) ?? start
      if (giftDate > end) return scenarioTotal

      const remainingMonths = monthsBetween(giftDate, end)
      const installmentValue = Object.entries(allocation).reduce((total, [type, ratio]) => {
        if (!ratio) return total
        const product = selectedProducts[type] ?? { type, rate: 0 }
        const allocatedAmount = installment.investmentAmount * (ratio / 100)
        return (
          total +
          calculateProductFutureValue(product, allocatedAmount, remainingMonths, installment.order)
        )
      }, 0)

      return scenarioTotal + installmentValue
    }, 0),
  )
}

export function calculateSimulation({
  amount,
  family,
  products,
  years = 10,
  giftDate,
  donorPaysTax = false,
}) {
  const requestedAmount = Math.max(0, Number(amount) || 0)
  const investmentYears = Math.min(20, Math.max(1, Number(years) || 10))
  const plannedGiftDate = toDate(giftDate) ?? new Date()
  const endDate = addYears(plannedGiftDate, investmentYears)
  const remainingDeductionAmount = Math.max(0, family.deductionLimit - family.giftedAmount)
  const immediateDeduction = Math.min(requestedAmount, remainingDeductionAmount)
  const immediateTax = calculateTaxStage(requestedAmount, immediateDeduction, donorPaysTax)
  const immediateInvestmentAmount = donorPaysTax
    ? requestedAmount
    : Math.max(0, requestedAmount - immediateTax.estimatedPayableTax)

  const currentGiftAmount = Math.min(requestedAmount, remainingDeductionAmount)
  const deferredGiftAmount = Math.max(0, requestedAmount - currentGiftAmount)
  const deferredTax = calculateTaxStage(
    deferredGiftAmount,
    Math.min(deferredGiftAmount, family.deductionLimit),
    donorPaysTax,
  )
  const optimizedInvestmentAmount = donorPaysTax
    ? requestedAmount
    : Math.max(0, requestedAmount - deferredTax.estimatedPayableTax)

  let resetDate =
    toDate(family.resetDate) ??
    addYears(plannedGiftDate, Math.min(10, Math.max(1, investmentYears)))
  while (resetDate <= plannedGiftDate) {
    resetDate = addYears(resetDate, 10)
  }
  const savingsProduct = products
    .filter((product) => product.type === 'SAVINGS')
    .sort((a, b) => b.rate - a.rate)[0]
  const depositProduct = products
    .filter((product) => product.type === 'DEPOSIT')
    .sort((a, b) => b.rate - a.rate)[0]
  const savingsCapacity =
    savingsProduct?.monthlyMaxAmount == null
      ? Number.MAX_SAFE_INTEGER
      : savingsProduct.monthlyMaxAmount * investmentYears * 12
  const representativeProducts = Object.fromEntries(
    Object.keys(PRODUCT_TYPE_META).map((type) => [
      type,
      products.filter((product) => product.type === type).sort((a, b) => b.rate - a.rate)[0] ?? {
        rate: 0,
      },
    ]),
  )
  const decorateProducts = (principal) =>
    products.map((product) => {
      const expectedFutureValue = calculateProductFutureValue(
        product,
        principal,
        investmentYears * 12,
      )
      return {
        ...product,
        principal,
        calculationMethod: product.calculationMethod ?? PRODUCT_CALCULATION_METHOD[product.type],
        expectedFutureValue,
        expectedProfit: expectedFutureValue - principal,
      }
    })

  const immediateSchedule = [
    {
      order: 1,
      label: '예정일 전액 증여',
      date: formatDate(plannedGiftDate),
      amount: requestedAmount,
      investmentAmount: immediateInvestmentAmount,
      withinPeriod: true,
    },
  ]
  const optimizedSchedule = [
    {
      order: 1,
      label: '공제 한도 먼저',
      date: formatDate(plannedGiftDate),
      amount: currentGiftAmount,
      investmentAmount: currentGiftAmount,
      withinPeriod: true,
    },
    ...(deferredGiftAmount
      ? [
          {
            order: 2,
            label: '한도 갱신 후 잔액',
            date: formatDate(resetDate),
            amount: deferredGiftAmount,
            investmentAmount: donorPaysTax
              ? deferredGiftAmount
              : Math.max(0, deferredGiftAmount - deferredTax.estimatedPayableTax),
            withinPeriod: resetDate <= endDate,
          },
        ]
      : []),
  ]

  const buildScenario = ({
    resultId,
    scenarioType,
    scenarioName,
    description,
    deductionAmount,
    tax,
    postTaxAmount,
    currentAmount,
    deferredAmount,
    schedule,
  }) => {
    const allocation = getPortfolioAllocation(investmentYears, {
      principal: postTaxAmount,
      savingsCapacity,
      depositProduct,
      savingsProduct,
      investmentPeriodMonths: investmentYears * 12,
      schedule,
      years: investmentYears,
      startDate: plannedGiftDate,
      endDate,
    })

    return {
      resultId,
      scenarioType,
      scenarioName,
      description,
      deductionAmount,
      taxableAmount: tax.taxableAmount,
      giftTax: tax.giftTax,
      filingTaxCredit: tax.filingTaxCredit,
      estimatedPayableTax: tax.estimatedPayableTax,
      postTaxAmount,
      investmentPrincipal: postTaxAmount,
      totalDonorOutflow: requestedAmount + (donorPaysTax ? tax.estimatedPayableTax : 0),
      currentGiftAmount: currentAmount,
      deferredGiftAmount: deferredAmount,
      deferredGiftDate: deferredAmount ? formatDate(resetDate) : null,
      giftSchedule: schedule,
      portfolioAllocation: allocation,
      estimatedFutureValue: calculatePortfolioValue({
        schedule,
        allocation,
        selectedProducts: representativeProducts,
        years: investmentYears,
        startDate: plannedGiftDate,
      }),
      products: decorateProducts(postTaxAmount),
    }
  }

  const immediateScenario = buildScenario({
    resultId: Date.now() + 1,
    scenarioType: 'IMMEDIATE',
    scenarioName: '한 번에 바로 증여',
    description: donorPaysTax
      ? '증여자가 예상 세금까지 준비해 전액을 바로 운용해요.'
      : '예상 세금을 납부하고 남은 금액을 바로 운용해요.',
    deductionAmount: immediateDeduction,
    tax: immediateTax,
    postTaxAmount: immediateInvestmentAmount,
    currentAmount: requestedAmount,
    deferredAmount: 0,
    schedule: immediateSchedule,
  })
  const optimizedScenario = buildScenario({
    resultId: Date.now() + 2,
    scenarioType: 'TAX_OPTIMIZED',
    scenarioName: '공제 한도 우선 증여',
    description: '현재 공제 한도를 먼저 활용하고 갱신 후 나머지를 증여해요.',
    deductionAmount: currentGiftAmount + Math.min(deferredGiftAmount, family.deductionLimit),
    tax: deferredTax,
    postTaxAmount: optimizedInvestmentAmount,
    currentAmount: currentGiftAmount,
    deferredAmount: deferredGiftAmount,
    schedule: optimizedSchedule,
  })

  return {
    id: Date.now(),
    requestedAmount,
    giftDate: formatDate(plannedGiftDate),
    years: investmentYears,
    donorPaysTax,
    previousGiftAmount: family.giftedAmount,
    remainingDeductionAmount,
    deductionResetDate: family.resetDate,
    endDate: formatDate(endDate),
    exceedsDeduction: requestedAmount > remainingDeductionAmount,
    results: [immediateScenario, optimizedScenario],
  }
}
