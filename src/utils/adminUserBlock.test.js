import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canManageUserBlock,
  defaultBlockedUntilValue,
  normalizeBlockedUntil,
} from './adminUserBlock.js'

test('ROOT과 MIDDLE 관리자만 회원 차단을 조작할 수 있다', () => {
  assert.equal(canManageUserBlock('ROOT'), true)
  assert.equal(canManageUserBlock('middle'), true)
  assert.equal(canManageUserBlock('DEFAULT'), false)
  assert.equal(canManageUserBlock('USER'), false)
})

test('미래 차단 기한을 백엔드 LocalDateTime 형식으로 정규화한다', () => {
  const now = new Date('2026-08-10T12:00:00').getTime()

  assert.equal(normalizeBlockedUntil('2026-08-11T12:30', now), '2026-08-11T12:30:00')
  assert.equal(normalizeBlockedUntil('2026-08-10T12:00', now), null)
  assert.equal(normalizeBlockedUntil('잘못된 값', now), null)
})

test('기본 차단 기한은 현재 시각으로부터 7일 뒤이다', () => {
  const now = new Date(2026, 7, 10, 12, 30).getTime()
  assert.equal(defaultBlockedUntilValue(now), '2026-08-17T12:30')
})
