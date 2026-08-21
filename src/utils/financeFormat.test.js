import assert from 'node:assert/strict'
import test from 'node:test'

import { formatChartAxisWon } from './finance.js'

test('그래프 축의 억 단위 금액을 짧게 표시한다', () => {
  assert.equal(formatChartAxisWon(107880000), '1.08억원')
  assert.equal(formatChartAxisWon(1251700000), '12.5억원')
})

test('1억원 미만 그래프 축은 기존 만원 표기를 유지한다', () => {
  assert.equal(formatChartAxisWon(75170000), '7,517만원')
  assert.equal(formatChartAxisWon(0), '0원')
})
