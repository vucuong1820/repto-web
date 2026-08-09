export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.repto.android'
export const APP_STORE_URL = 'https://apps.apple.com/app/repto-workout-tracker/id6761402067'

/** Server-side so the correct button is in the first byte of HTML — no JS, no flash of
 *  the wrong store, and it works inside the in-app browsers that matter. */
export function pickPlatform(request) {
  const ua = request.headers.get('user-agent') ?? ''
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'desktop'
}

/**
 * Android opens the app through an `intent://` URL rather than `repto://`: the in-app
 * WebViews in Messenger and Zalo routinely refuse custom schemes, leaving a button that
 * does nothing. `S.browser_fallback_url` also sends a visitor without the app straight to
 * Play instead of stranding them.
 */
export function androidIntentUrl(code) {
  return (
    `intent://import?code=${code}#Intent;scheme=repto;package=app.repto.android;` +
    `S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`
  )
}
