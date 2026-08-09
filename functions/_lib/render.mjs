import { escapeHtml } from './escape.mjs'
import { COPY } from './copy.mjs'

const APP_STORE_URL = 'https://apps.apple.com/app/repto-workout-tracker/id6761402067'
const OG_IMAGE = 'https://reptofit.com/assets/og-share.png'

function shell({ locale, title, description, canonical, body }) {
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta name="robots" content="noindex" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<link rel="stylesheet" href="/assets/colors_and_type.css" />
<style>
  body { background: var(--bg); color: var(--text-primary); font-family: var(--font-ui);
         margin: 0; padding: 32px 20px 64px; }
  .wrap { max-width: 560px; margin: 0 auto; }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .brand img { width: 32px; height: 32px; border-radius: 8px; }
  .brand span { font-weight: 700; letter-spacing: .08em; font-size: 14px; }
  .kicker { color: var(--lime); font-size: 11px; font-weight: 700;
            letter-spacing: .12em; margin-bottom: 8px; }
  h1 { font-size: 30px; line-height: 1.15; margin: 0 0 10px; }
  .stats { color: var(--text-secondary); font-size: 14px; margin-bottom: 28px; }
  .card { background: var(--surface); border-radius: 24px; padding: 18px 20px; margin-bottom: 12px; }
  .card h2 { font-size: 17px; margin: 0 0 4px; }
  .card .day { color: var(--text-secondary); font-size: 11px; font-weight: 700;
               letter-spacing: .12em; margin-bottom: 6px; }
  .card .meta { color: var(--text-secondary); font-size: 13px; margin-bottom: 12px; }
  .ex { display: flex; justify-content: space-between; gap: 16px;
        font-size: 14px; padding: 5px 0; }
  .ex span:last-child { color: var(--text-secondary); font-family: var(--font-mono); }
  .more { color: var(--text-secondary); font-size: 13px; padding-top: 6px; }
  .cta { display: block; text-align: center; margin: 32px 0 12px; padding: 17px 20px;
         border-radius: 999px; background: linear-gradient(135deg, var(--lime), var(--lime-container));
         color: var(--text-on-primary); font-weight: 700; font-size: 16px; text-decoration: none; }
  .alt { display: block; text-align: center; color: var(--text-secondary);
         font-size: 14px; text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="brand"><img src="/assets/repto-logo.png" alt="" /><span>REPTO</span></div>
  ${body}
</div>
</body>
</html>`
}

export function renderSharePage({ summary, code, kind, locale }) {
  const t = COPY[locale]
  const name = escapeHtml(summary.name)
  // Copy strings are human-readable text (e.g. '< 1 min'), not HTML — escape
  // once here so every use below (og:description, the visible stats line)
  // is covered without baking entities into copy.mjs.
  const stats = escapeHtml(
    kind === 'program'
      ? `${t.plans(summary.planCount)} · ${t.exercises(summary.exerciseCount)} · ${t.minutes(summary.minutes)}`
      : `${t.exercises(summary.exerciseCount)} · ${t.minutes(summary.minutes)}`
  )
  const canonical = `https://reptofit.com/${kind === 'program' ? 'p' : 'w'}/${escapeHtml(code)}`

  const cards = summary.plans
    .map((plan) => {
      const rows = plan.exercises
        .map(
          (ex) =>
            `<div class="ex"><span>${escapeHtml(ex.name)}</span><span>${escapeHtml(ex.detail)}</span></div>`
        )
        .join('')
      const more = plan.moreCount > 0 ? `<div class="more">${t.more(plan.moreCount)}</div>` : ''
      const day = kind === 'program' ? `<div class="day">${t.day(plan.dayIndex)}</div>` : ''
      const meta = escapeHtml(`${t.exercises(plan.exerciseCount)} · ${t.minutes(plan.minutes)}`)
      return `<div class="card">
  ${day}
  <h2>${escapeHtml(plan.name)}</h2>
  <div class="meta">${meta}</div>
  ${rows}${more}
</div>`
    })
    .join('\n')

  return shell({
    locale,
    title: name,
    description: `${stats} · ${t.ogSuffix[kind]}`,
    canonical,
    body: `<div class="kicker">${t.kicker[kind]}</div>
<h1>${name}</h1>
<div class="stats">${stats}</div>
${cards}
<a class="cta" href="repto://import?code=${escapeHtml(code)}">${t.open}</a>
<a class="alt" href="${APP_STORE_URL}">${t.noApp}</a>`,
  })
}

export function renderMessage({ locale, title, body, kind = 'program' }) {
  const t = COPY[locale]
  return shell({
    locale,
    title: 'Repto',
    description: t.ogSuffix[kind] ?? t.ogSuffix.program,
    canonical: 'https://reptofit.com/',
    body: `<h1>${escapeHtml(title)}</h1>
<div class="stats">${escapeHtml(body)}</div>
<a class="cta" href="${APP_STORE_URL}">${t.noApp}</a>`,
  })
}
