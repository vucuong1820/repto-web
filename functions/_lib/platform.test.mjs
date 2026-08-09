import test from 'node:test'
import assert from 'node:assert/strict'
import { pickPlatform, androidIntentUrl, PLAY_STORE_URL } from './platform.mjs'

const req = (ua) =>
  new Request('https://reptofit.com/p/ZVQD26', { headers: ua ? { 'user-agent': ua } : {} })

test('pickPlatform recognises Android', () => {
  assert.equal(
    pickPlatform(req('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36')),
    'android'
  )
})

test('pickPlatform recognises iPhone and iPad', () => {
  assert.equal(pickPlatform(req('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)')), 'ios')
  assert.equal(pickPlatform(req('Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X)')), 'ios')
})

test('pickPlatform falls back to desktop for anything else', () => {
  assert.equal(pickPlatform(req('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')), 'desktop')
  assert.equal(pickPlatform(req('facebookexternalhit/1.1')), 'desktop')
  assert.equal(pickPlatform(req(null)), 'desktop')
})

test('androidIntentUrl targets the app and falls back to Play', () => {
  const url = androidIntentUrl('ZVQD26')
  assert.ok(url.startsWith('intent://import?code=ZVQD26#Intent;'))
  assert.ok(url.includes('scheme=repto;'))
  assert.ok(url.includes('package=app.repto.android;'))
  // The fallback must be percent-encoded: an unescaped ':' or '/' would terminate the
  // intent parameter early and drop the rest of the URL.
  assert.ok(url.includes(`S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};`))
  assert.ok(url.endsWith(';end'))
})
