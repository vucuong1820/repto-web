import test from 'node:test'
import assert from 'node:assert/strict'
import { wellKnownResponse } from './wellknown.mjs'

test('serves the Android Digital Asset Links statement', async () => {
  const res = wellKnownResponse('/.well-known/assetlinks.json')
  assert.equal(res.headers.get('content-type'), 'application/json')
  const [entry] = await res.json()
  assert.deepEqual(entry.relation, ['delegate_permission/common.handle_all_urls'])
  assert.equal(entry.target.namespace, 'android_app')
  assert.equal(entry.target.package_name, 'app.repto.android')
  // Play App Signing + upload + debug.
  assert.equal(entry.target.sha256_cert_fingerprints.length, 3)
  for (const fp of entry.target.sha256_cert_fingerprints) {
    assert.equal(typeof fp, 'string')
  }
})

test('still serves the Apple app-site-association', async () => {
  const res = wellKnownResponse('/.well-known/apple-app-site-association')
  const body = await res.json()
  assert.deepEqual(body.applinks.details[0].components, [{ '/': '/p/*' }, { '/': '/w/*' }])
})

test('every other path is not a well-known document', () => {
  assert.equal(wellKnownResponse('/privacy'), null)
  assert.equal(wellKnownResponse('/p/ZVQD26'), null)
  assert.equal(wellKnownResponse('/'), null)
})
