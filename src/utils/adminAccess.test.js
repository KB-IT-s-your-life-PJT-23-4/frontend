import test from 'node:test'
import assert from 'node:assert/strict'
import { isAdminRole } from './adminAccess.js'

test('관리자 역할만 관리자 화면 진입 권한으로 판별한다', () => {
  assert.equal(isAdminRole('ROOT'), true)
  assert.equal(isAdminRole('middle'), true)
  assert.equal(isAdminRole('DEFAULT'), true)
  assert.equal(isAdminRole('USER'), false)
  assert.equal(isAdminRole(null), false)
})
