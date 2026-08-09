import { isValidShareCode } from './code.mjs'
import { summarize } from './summarize.mjs'
import { renderSharePage, renderMessage } from './render.mjs'
import { COPY, pickLocale } from './copy.mjs'

const TABLES = { program: 'shared_programs', plan: 'shared_workouts' }

function html(body, status) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': status === 200 ? 'public, max-age=300' : 'no-store',
    },
  })
}

export async function handleShare({ kind, params, env, request }) {
  const locale = pickLocale(request)
  const t = COPY[locale]
  const code = params?.code

  // Reject before touching the database so the route cannot be used to
  // enumerate codes.
  if (!isValidShareCode(code)) {
    return html(renderMessage({ locale, title: t.notFoundTitle, body: t.notFoundBody, kind }), 404)
  }

  // summarize()/renderSharePage() run inside this guard too: a throw from
  // either (e.g. a malformed payload) must fall back to the localized 502
  // page, not an uncaught rejection that a crawler sees as Cloudflare's
  // generic error page with no meta tags at all.
  try {
    const url = `${env.SUPABASE_URL}/rest/v1/${TABLES[kind]}?code=eq.${code}&select=payload&limit=1`
    const response = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        accept: 'application/json',
      },
    })
    if (!response.ok) throw new Error(`supabase ${response.status}`)
    const rows = await response.json()
    const payload = rows?.[0]?.payload

    if (!payload) {
      return html(renderMessage({ locale, title: t.notFoundTitle, body: t.notFoundBody, kind }), 404)
    }

    const summary = summarize(payload, kind)
    return html(renderSharePage({ summary, code, kind, locale }), 200)
  } catch {
    return html(renderMessage({ locale, title: t.errorTitle, body: t.errorBody, kind }), 502)
  }
}
