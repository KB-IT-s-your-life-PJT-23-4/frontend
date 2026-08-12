import assert from 'node:assert/strict'
import test from 'node:test'
import { resolvePostLoginPath } from './authRedirect.js'

test('증여 시뮬레이션과 AI 상담 로그인 redirect를 유지한다', () => {
  assert.equal(resolvePostLoginPath('/simulation'), '/simulation')
  assert.equal(resolvePostLoginPath('/simulation?simulationId=15'), '/simulation?simulationId=15')
  assert.equal(resolvePostLoginPath('/my/simulationHistory/15'), '/my/simulationHistory/15')
  assert.equal(resolvePostLoginPath('/chat'), '/chat')
})

test('현재 관리자 라우트의 로그인 redirect를 유지한다', () => {
  assert.equal(resolvePostLoginPath('/admin/dashboard'), '/admin/dashboard')
  assert.equal(resolvePostLoginPath('/admin/users'), '/admin/users')
  assert.equal(resolvePostLoginPath('/admin/products'), '/admin/products')
  assert.equal(resolvePostLoginPath('/admin/faq'), '/admin/faq')
  assert.equal(resolvePostLoginPath('/admin/report'), '/admin/report')
  assert.equal(resolvePostLoginPath('/admin/reports'), '/admin/reports')
  assert.equal(resolvePostLoginPath('/admin/auth'), '/admin/auth')
  assert.equal(resolvePostLoginPath('/admin/authorization'), '/admin/authorization')
  assert.equal(resolvePostLoginPath('/admin/audit'), '/admin/audit')
})

test('허용하지 않은 외부 또는 임의 경로는 홈으로 보낸다', () => {
  assert.equal(resolvePostLoginPath('https://example.com'), '/')
  assert.equal(resolvePostLoginPath('//example.com'), '/')
  assert.equal(resolvePostLoginPath('/unknown'), '/')
})
