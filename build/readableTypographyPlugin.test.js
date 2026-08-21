import assert from 'node:assert/strict'
import test from 'node:test'

import { increaseSmallFontSize, readableTypographyPlugin } from './readableTypographyPlugin.js'

test('작은 고정 글자 크기를 읽기 가능한 단계로 높인다', () => {
  assert.equal(increaseSmallFontSize('7px'), '10px')
  assert.equal(increaseSmallFontSize('10px'), '13px')
  assert.equal(increaseSmallFontSize('12px'), '15px')
  assert.equal(increaseSmallFontSize('14px'), '16px')
})

test('큰 글자와 반응형 글자 크기는 변경하지 않는다', () => {
  assert.equal(increaseSmallFontSize('15px'), '15px')
  assert.equal(increaseSmallFontSize('24px'), '24px')
  assert.equal(increaseSmallFontSize('clamp(24px, 6vw, 72px)'), 'clamp(24px, 6vw, 72px)')
})

test('PostCSS가 같은 선언을 다시 방문해도 한 번만 확대한다', () => {
  const plugin = readableTypographyPlugin()
  const declaration = {
    prop: 'font-size',
    value: '7px',
    source: { input: { file: 'D:/project/src/assets/css/page.css' } },
  }

  plugin.Declaration(declaration)
  plugin.Declaration(declaration)

  assert.equal(declaration.value, '10px')
})
