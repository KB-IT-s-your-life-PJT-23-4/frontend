import assert from 'node:assert/strict'
import test from 'node:test'
import { resolvePostLoginPath } from './authRedirect.js'

test('증여 시뮬레이션과 AI 상담 로그인 redirect를 유지한다', () => {
  assert.equal(resolvePostLoginPath('/simulation'), '/simulation')
  assert.equal(resolvePostLoginPath('/simulation?simulationId=15'), '/simulation?simulationId=15')
  assert.equal(resolvePostLoginPath('/chat'), '/chat')
})

test('허용하지 않은 외부 또는 임의 경로는 홈으로 보낸다', () => {
  assert.equal(resolvePostLoginPath('https://example.com'), '/')
  assert.equal(resolvePostLoginPath('//example.com'), '/')
  assert.equal(resolvePostLoginPath('/unknown'), '/')
})
