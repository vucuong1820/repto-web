// Apple and Android both fetch their app-association file from /.well-known/, and
// Cloudflare Pages does not upload dot-prefixed directories — so neither can be a static
// file. The middleware serves both from here.
//
// This lives in _lib as .mjs rather than inside _middleware.js because that file is .js
// with no package.json "type": "module" alongside it: Cloudflare's runtime reads it as
// ESM, but `node --test` reads it as CommonJS and cannot import it.

export const AASA = {
  applinks: {
    details: [
      {
        appIDs: ['28T5K7WQTG.com.vucuong1820.Repto'],
        components: [{ '/': '/p/*' }, { '/': '/w/*' }, { '/': '/go/*' }],
      },
    ],
  },
}

// Android App Links. Three fingerprints in one statement, which the format allows: the
// Play App Signing key is what a store build presents and is the only one that matters in
// production; the upload key covers a locally assembled release, and the debug key lets
// the flow be verified on a dev device before anything ships.
export const ASSETLINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'app.repto.android',
      sha256_cert_fingerprints: [
        '54:16:31:E7:30:FA:AB:5E:CE:51:58:BB:DD:E4:81:15:28:F2:B7:18:7D:4F:16:CA:70:4F:7E:11:51:1B:79:E8',
        '42:AF:95:54:EA:BF:FF:B9:88:1F:DC:75:B8:01:9C:8E:75:93:53:A0:06:2F:C0:BC:D5:84:A4:02:25:C2:52:50',
        '71:B8:D5:3D:94:C7:92:8B:24:79:F8:A7:04:31:A8:6E:75:37:08:3E:72:32:28:AA:D8:50:08:EA:52:9F:B4:62',
      ],
    },
  },
]

const json = (body) =>
  new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=3600',
    },
  })

/** The association document for `pathname`, or null when the request is not for one. */
export function wellKnownResponse(pathname) {
  if (pathname === '/.well-known/apple-app-site-association') return json(AASA)
  if (pathname === '/.well-known/assetlinks.json') return json(ASSETLINKS)
  return null
}
