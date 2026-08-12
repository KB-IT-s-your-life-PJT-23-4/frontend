import { describe, expect, it } from 'vitest'
import {
  calculateDepositFutureValue,
  calculateEtfFutureValue,
  calculateGiftTax,
  calculateProductFutureValue,
  calculateSavingsFutureValue,
  calculateSimulation,
  futureValue,
  getPortfolioAllocation,
  getPortfolioAllocations,
} from './finance'

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

  it('과세표준이 50만원 미만이면 증여세를 부과하지 않는다', () => {
    expect(calculateGiftTax(499999)).toBe(0)
  })

  it('과세표준이 정확히 50만원이면 누진세율을 적용한다', () => {
    expect(calculateGiftTax(500000)).toBe(50000)
  })

  it('공제 한도 우선 시나리오는 현재 증여액과 이연액을 나눈다', () => {
    const result = calculateSimulation({ amount: 80000000, family, products })
    const optimized = result.results[1]
    expect(optimized.currentGiftAmount).toBe(30000000)
    expect(optimized.deferredGiftAmount).toBe(50000000)
    expect(optimized.giftTax).toBe(0)
  })

  it('입력한 증여 예정일부터 증여 일정과 운용 종료일을 계산한다', () => {
    const result = calculateSimulation({
      amount: 80000000,
      family,
      products,
      years: 10,
      giftDate: '2026-09-15',
    })

    expect(result.giftDate).toBe('2026.09.15')
    expect(result.results[0].giftSchedule[0].date).toBe('2026.09.15')
    expect(result.endDate).toBe('2036.09.15')
  })

  it('복리 예상 자산을 계산한다', () => {
    expect(futureValue(10000000, 3, 10)).toBe(13439164)
  })

  it('예금은 운용 개월 수에 따라 단리로 계산한다', () => {
    expect(calculateDepositFutureValue(38568000, 3.4, 36)).toBe(42501936)
  })

  it('적금은 월말 적립식으로 계산한다', () => {
    expect(calculateSavingsFutureValue(36000000, 3.7, 36)).toBe(38012141)
  })

  it('ETF는 연 평균 수익률을 연복리로 계산한다', () => {
    expect(calculateEtfFutureValue(18642000, 5.1, 36)).toBe(21642162)
  })

  it('예금은 만기 원리금을 동일 상품에 재가입해 계산한다', () => {
    expect(
      calculateProductFutureValue(
        {
          type: 'DEPOSIT',
          rate: 3.4,
          minimumContractMonths: 12,
          maximumContractMonths: 12,
          reinvestmentSchedule: [
            {
              trancheSequenceNo: 1,
              renewalSequenceNo: 1,
              completedContractMonths: 12,
            },
            {
              trancheSequenceNo: 1,
              renewalSequenceNo: 2,
              completedContractMonths: 12,
            },
          ],
        },
        100000000,
        36,
        1,
      ),
    ).toBe(110550730)
  })

  it('투자 성향별 포트폴리오 비중의 합은 100%이다', () => {
    Object.values(getPortfolioAllocations(10)).forEach((allocation) => {
      expect(Object.values(allocation).reduce((sum, ratio) => sum + ratio, 0)).toBe(100)
    })
  })

  it('예금 실수익률이 높으면 안전자산을 예금에 우선 배분한다', () => {
    const allocation = getPortfolioAllocations(3, {
      principal: 100000000,
      savingsCapacity: 18000000,
      depositProduct: {
        type: 'DEPOSIT',
        rate: 3.2,
      },
      savingsProduct: {
        type: 'SAVINGS',
        rate: 4,
      },
      investmentPeriodMonths: 36,
    }).BALANCED

    expect(allocation).toEqual({ DEPOSIT: 80, SAVINGS: 0, ETF: 20 })
  })

  it('적금 실수익률이 높으면 한도까지 적금에 배분한다', () => {
    const allocation = getPortfolioAllocations(3, {
      principal: 100000000,
      savingsCapacity: 18000000,
      depositProduct: {
        type: 'DEPOSIT',
        rate: 1,
      },
      savingsProduct: {
        type: 'SAVINGS',
        rate: 8,
      },
      investmentPeriodMonths: 36,
    }).BALANCED

    expect(allocation).toEqual({ DEPOSIT: 62, SAVINGS: 18, ETF: 20 })
  })

  it('기존 대표 포트폴리오는 균형형 비중을 사용한다', () => {
    expect(getPortfolioAllocation(10)).toEqual(getPortfolioAllocations(10).BALANCED)
  })
})
