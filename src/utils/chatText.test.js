import assert from 'node:assert/strict'
import test from 'node:test'

import { shortenChatSeparators } from './chatText.js'

test('긴 단독 구분선을 모바일 말풍선에 맞게 줄인다', () => {
  assert.equal(
    shortenChatSeparators('답변\n\n------------------------\n\n다음'),
    '답변\n\n──────\n\n다음',
  )
  assert.equal(shortenChatSeparators('________________________'), '──────')
  assert.equal(shortenChatSeparators('━━━━━━━━━━━━━━━━━━━━'), '──────')
})

test('문장 안의 하이픈과 짧은 구분선은 유지한다', () => {
  assert.equal(shortenChatSeparators('2026-08-21'), '2026-08-21')
  assert.equal(shortenChatSeparators('---'), '---')
})
