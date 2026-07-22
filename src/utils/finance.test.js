import { describe, expect, it } from 'vitest'
import { calculateGiftTax, calculateSimulation, futureValue } from './finance'

const family = {
  deductionLimit: 50000000,
  giftedAmount: 20000000,
  resetDate: '2034.01.15',
}

const products = [{ id: 1, rate: 3.2 }]

describe('증여 계산', () => {
  it('공제 한도 이하는 증여세가 없다', () => {
    const result = calculateSimulation({ amount: 30000000, family, products })
    expect(result.results[0].giftTax).toBe(0)
    expect(result.remainingDeductionAmount).toBe(30000000)
  })

  it('1억원 이하 과세표준에 10% 세율을 적용한다', () => {
    expect(calculateGiftTax(70000000)).toBe(7000000)
  })

  it('공제 한도 우선 시나리오는 현재 증여액과 이연액을 나눈다', () => {
    const result = calculateSimulation({ amount: 80000000, family, products })
    const optimized = result.results[1]
    expect(optimized.currentGiftAmount).toBe(30000000)
    expect(optimized.deferredGiftAmount).toBe(50000000)
    expect(optimized.giftTax).toBe(0)
  })

  it('복리 예상 자산을 계산한다', () => {
    expect(futureValue(10000000, 3, 10)).toBe(13439164)
  })
})

