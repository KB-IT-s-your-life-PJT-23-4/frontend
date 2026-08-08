import assert from 'node:assert/strict'
import test from 'node:test'
import { showBlockedAccess, useAccountAccessStore } from '../stores/accountAccessStore.js'
import {
  isAccountBlocked,
  isRestrictedFeatureApiPath,
  shouldShowBlockedAccessForResponse,
} from './accountAccess.js'

const now = new Date('2026-08-08T12:00:00').getTime()

test('ACTIVE 회원은 제한 대상이 아니다', () => {
  assert.equal(isAccountBlocked({ accountStatus: 'ACTIVE', blockedUntil: null }, now), false)
})

test('차단 만료 시각이 남은 BLOCKED 회원만 제한한다', () => {
  assert.equal(
    isAccountBlocked({ accountStatus: 'BLOCKED', blockedUntil: '2026-08-09T12:00:00' }, now),
    true,
  )
  assert.equal(
    isAccountBlocked({ accountStatus: 'BLOCKED', blockedUntil: '2026-08-08T12:00:00' }, now),
    false,
  )
})

test('증여 시뮬레이션과 AI 상담 API 경로만 제한 대상으로 판별한다', () => {
  assert.equal(isRestrictedFeatureApiPath('/gs'), true)
  assert.equal(isRestrictedFeatureApiPath('/api/gs/15/save'), true)
  assert.equal(isRestrictedFeatureApiPath('/ai/consult'), true)
  assert.equal(isRestrictedFeatureApiPath('/ai/consult/clarification'), true)
  assert.equal(isRestrictedFeatureApiPath('/users/me'), false)
  assert.equal(isRestrictedFeatureApiPath('/ai/faqs'), false)
  assert.equal(isRestrictedFeatureApiPath('/gm/gift'), false)
})

test('제한 API의 차단 403만 안내하고 다른 접근 오류와 백그라운드 조회는 제외한다', () => {
  assert.equal(
    shouldShowBlockedAccessForResponse({
      status: 403,
      path: '/gs',
      errorCode: '해당 기능에 접근할 권한이 없습니다',
    }),
    true,
  )
  assert.equal(
    shouldShowBlockedAccessForResponse({
      status: 403,
      path: '/gs/15',
      errorCode: 'SIMULATION_ACCESS_DENIED',
    }),
    false,
  )
  assert.equal(
    shouldShowBlockedAccessForResponse({
      status: 403,
      path: '/gs',
      suppressed: true,
    }),
    false,
  )
  assert.equal(shouldShowBlockedAccessForResponse({ status: 403, path: '/users/me' }), false)
})

test('차단 안내가 이미 열려 있으면 중복으로 표시하지 않는다', () => {
  const store = useAccountAccessStore()
  store.closeBlockedAccess()

  assert.equal(showBlockedAccess(), true)
  assert.equal(showBlockedAccess(), false)
  assert.equal(store.state.visible, true)

  store.closeBlockedAccess()
})
