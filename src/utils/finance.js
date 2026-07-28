const TAX_BRACKETS = [
  { ceiling: 100000000, rate: 0.1, deduction: 0 },
  { ceiling: 500000000, rate: 0.2, deduction: 10000000 },
  { ceiling: 1000000000, rate: 0.3, deduction: 60000000 },
  { ceiling: 3000000000, rate: 0.4, deduction: 160000000 },
  { ceiling: Infinity, rate: 0.5, deduction: 460000000 },
]

export const PRODUCT_TYPE_META = {
  DEPOSIT: { label: '예금', color: '#4f7fa8' },
  SAVINGS: { label: '적금', color: '#79a9c7' },
  ETF: { label: 'ETF', color: '#8276d8' },
  INSURANCE: { label: '저축보험', color: '#4ca38f' },
}

export function calculateGiftTax(taxableAmount) {
  if (!Number.isFinite(taxableAmount) || taxableAmount <= 0) return 0
  const bracket = TAX_BRACKETS.find((item) => taxableAmount <= item.ceiling)
  return Math.max(0, Math.round(taxableAmount * bracket.rate - bracket.deduction))
}

export function futureValue(principal, annualRate, years = 10) {
  if (!Number.isFinite(principal) || principal <= 0) return 0
  return Math.round(principal * (1 + annualRate / 100) ** Math.max(0, years))
}

export function formatWon(value) {
  return `${Math.round(Number(value) || 0).toLocaleString('ko-KR')}원`
}

export function formatCompactWon(value) {
  const amount = Math.round(Number(value) || 0)
  if (amount >= 100000000) {
    const eok = amount / 100000000
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억원`
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

function yearsBetween(start, end) {
  return Math.max(0, (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function calculateTaxStage(giftAmount, deductionAmount, donorPaysTax) {
  const baseGiftAmount = Math.max(0, giftAmount)
  const deduction = Math.max(0, Math.min(baseGiftAmount, deductionAmount))

  if (!donorPaysTax) {
    const taxableAmount = Math.max(0, baseGiftAmount - deduction)
    const giftTax = calculateGiftTax(taxableAmount)
    const filingTaxCredit = Math.round(giftTax * 0.03)
    return {
      taxableAmount,
      giftTax,
      filingTaxCredit,
      estimatedPayableTax: Math.max(0, giftTax - filingTaxCredit),
    }
  }

  let estimatedPayableTax = 0
  let giftTax = 0
  let filingTaxCredit = 0

  for (let index = 0; index < 30; index += 1) {
    const taxableAmount = Math.max(0, baseGiftAmount + estimatedPayableTax - deduction)
    giftTax = calculateGiftTax(taxableAmount)
    filingTaxCredit = Math.round(giftTax * 0.03)
    const nextPayableTax = Math.max(0, giftTax - filingTaxCredit)
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

export function getPortfolioAllocation(years) {
  if (years <= 3) {
    return { DEPOSIT: 45, SAVINGS: 45, ETF: 10, INSURANCE: 0 }
  }
  if (years <= 6) {
    return { DEPOSIT: 35, SAVINGS: 30, ETF: 35, INSURANCE: 0 }
  }
  if (years < 10) {
    return { DEPOSIT: 25, SAVINGS: 25, ETF: 50, INSURANCE: 0 }
  }
  return { DEPOSIT: 20, SAVINGS: 20, ETF: 35, INSURANCE: 25 }
}

export function calculatePortfolioValue({
  schedule,
  allocation,
  selectedProducts,
  years,
  startDate,
}) {
  const start = toDate(startDate) ?? new Date()
  const end = addYears(start, years)

  return Math.round(
    schedule.reduce((scenarioTotal, installment) => {
      const giftDate = toDate(installment.date) ?? start
      if (giftDate > end) return scenarioTotal

      const remainingYears = yearsBetween(giftDate, end)
      const installmentValue = Object.entries(allocation).reduce((total, [type, ratio]) => {
        if (!ratio) return total
        const rate = selectedProducts[type]?.rate ?? 0
        return total + futureValue(installment.investmentAmount * (ratio / 100), rate, remainingYears)
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
  donorPaysTax = false,
}) {
  const requestedAmount = Math.max(0, Number(amount) || 0)
  const investmentYears = Math.min(20, Math.max(1, Number(years) || 10))
  const today = new Date()
  const endDate = addYears(today, investmentYears)
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

  const resetDate =
    toDate(family.resetDate) ?? addYears(today, Math.min(10, Math.max(1, investmentYears)))
  const allocation = getPortfolioAllocation(investmentYears)
  const representativeProducts = Object.fromEntries(
    Object.keys(PRODUCT_TYPE_META).map((type) => [
      type,
      products
        .filter((product) => product.type === type)
        .sort((a, b) => b.rate - a.rate)[0] ?? { rate: 0 },
    ]),
  )
  const decorateProducts = (principal) =>
    products.map((product) => ({
      ...product,
      principal,
      expectedFutureValue: futureValue(principal, product.rate, investmentYears),
      expectedProfit: futureValue(principal, product.rate, investmentYears) - principal,
    }))

  const immediateSchedule = [
    {
      order: 1,
      label: '지금 전액 증여',
      date: formatDate(today),
      amount: requestedAmount,
      investmentAmount: immediateInvestmentAmount,
      withinPeriod: true,
    },
  ]
  const optimizedSchedule = [
    {
      order: 1,
      label: '공제 한도 먼저',
      date: formatDate(today),
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
  }) => ({
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
      startDate: today,
    }),
    products: decorateProducts(postTaxAmount),
  })

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
    scenarioName: '공제 한도부터 차근차근',
    description: '현재 공제 한도를 먼저 활용하고 갱신 후 나머지를 증여해요.',
    deductionAmount:
      currentGiftAmount + Math.min(deferredGiftAmount, family.deductionLimit),
    tax: deferredTax,
    postTaxAmount: optimizedInvestmentAmount,
    currentAmount: currentGiftAmount,
    deferredAmount: deferredGiftAmount,
    schedule: optimizedSchedule,
  })

  return {
    id: Date.now(),
    requestedAmount,
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
