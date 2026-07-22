const TAX_BRACKETS = [
  { ceiling: 100000000, rate: 0.1, deduction: 0 },
  { ceiling: 500000000, rate: 0.2, deduction: 10000000 },
  { ceiling: 1000000000, rate: 0.3, deduction: 60000000 },
  { ceiling: 3000000000, rate: 0.4, deduction: 160000000 },
  { ceiling: Infinity, rate: 0.5, deduction: 460000000 },
]

export function calculateGiftTax(taxableAmount) {
  if (!Number.isFinite(taxableAmount) || taxableAmount <= 0) return 0
  const bracket = TAX_BRACKETS.find((item) => taxableAmount <= item.ceiling)
  return Math.max(0, Math.round(taxableAmount * bracket.rate - bracket.deduction))
}

export function futureValue(principal, annualRate, years = 10) {
  if (!Number.isFinite(principal) || principal <= 0) return 0
  return Math.round(principal * (1 + annualRate / 100) ** years)
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

export function calculateSimulation({ amount, family, products, years = 10 }) {
  const requestedAmount = Math.max(0, Number(amount) || 0)
  const remainingDeductionAmount = Math.max(0, family.deductionLimit - family.giftedAmount)
  const immediateDeduction = Math.min(requestedAmount, remainingDeductionAmount)
  const immediateTaxable = Math.max(0, requestedAmount - immediateDeduction)
  const immediateTax = calculateGiftTax(immediateTaxable)
  const immediatePostTax = requestedAmount - immediateTax

  const currentGiftAmount = Math.min(requestedAmount, remainingDeductionAmount)
  const deferredGiftAmount = Math.max(0, requestedAmount - currentGiftAmount)
  const futureTaxable = Math.max(0, deferredGiftAmount - family.deductionLimit)
  const optimizedTax = calculateGiftTax(futureTaxable)
  const optimizedPostTax = requestedAmount - optimizedTax

  const decorateProducts = (principal) =>
    products.map((product) => ({
      ...product,
      principal,
      expectedFutureValue: futureValue(principal, product.rate, years),
      expectedProfit: futureValue(principal, product.rate, years) - principal,
    }))

  return {
    id: Date.now(),
    requestedAmount,
    years,
    previousGiftAmount: family.giftedAmount,
    remainingDeductionAmount,
    deductionResetDate: family.resetDate,
    exceedsDeduction: requestedAmount > remainingDeductionAmount,
    results: [
      {
        resultId: Date.now() + 1,
        scenarioType: 'IMMEDIATE',
        scenarioName: '지금 전액 증여',
        description: '증여세를 먼저 납부하고 남은 금액을 바로 운용해요.',
        deductionAmount: immediateDeduction,
        taxableAmount: immediateTaxable,
        giftTax: immediateTax,
        postTaxAmount: immediatePostTax,
        currentGiftAmount: requestedAmount,
        deferredGiftAmount: 0,
        products: decorateProducts(immediatePostTax),
      },
      {
        resultId: Date.now() + 2,
        scenarioType: 'TAX_OPTIMIZED',
        scenarioName: '공제 한도 우선 증여',
        description: '현재 공제 한도만 먼저 증여하고 갱신 후 나머지를 증여해요.',
        deductionAmount: currentGiftAmount + Math.min(deferredGiftAmount, family.deductionLimit),
        taxableAmount: futureTaxable,
        giftTax: optimizedTax,
        postTaxAmount: optimizedPostTax,
        currentGiftAmount,
        deferredGiftAmount,
        deferredGiftDate: family.resetDate,
        products: decorateProducts(optimizedPostTax),
      },
    ],
  }
}

