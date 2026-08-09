import test from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml } from './escape.mjs'
import { isValidShareCode } from './code.mjs'

test('escapeHtml neutralises every HTML-significant character', () => {
  assert.equal(
    escapeHtml(`<script>alert("x" & 'y')</script>`),
    '&lt;script&gt;alert(&quot;x&quot; &amp; &#39;y&#39;)&lt;/script&gt;'
  )
})

test('escapeHtml coerces nullish to empty string', () => {
  assert.equal(escapeHtml(null), '')
  assert.equal(escapeHtml(undefined), '')
})

test('isValidShareCode accepts the app alphabet', () => {
  assert.equal(isValidShareCode('ZVQD26'), true)
  assert.equal(isValidShareCode('ABCDEF'), true)
})

test('isValidShareCode rejects ambiguous characters, wrong length and case', () => {
  for (const bad of ['ZVQD2O', 'ZVQD20', 'ZVQD2I', 'ZVQD21', 'ZVQD2L']) {
    assert.equal(isValidShareCode(bad), false, bad)
  }
  assert.equal(isValidShareCode('ZVQD2'), false)
  assert.equal(isValidShareCode('ZVQD267'), false)
  assert.equal(isValidShareCode('zvqd26'), false)
  assert.equal(isValidShareCode(null), false)
  assert.equal(isValidShareCode(123456), false)
})
