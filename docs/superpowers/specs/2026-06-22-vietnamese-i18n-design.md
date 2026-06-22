# Vietnamese i18n for Repto landing + legal pages — Design

- **Date:** 2026-06-22
- **Status:** Approved (design); pending implementation plan
- **Branch:** `feat/landing-vanilla-rewrite`
- **Domain:** `https://reptofit.com` (Cloudflare Pages, served at root — no subpath)

## 1. Context

The site is a fully static, no-build set of pages: `index.html` (landing, ~601 lines, vanilla
HTML/CSS/JS) plus `privacy.html`, `terms.html`, `support.html` (legal). Shared assets live in
`assets/` (`styles.css`, `colors_and_type.css`, `app.js`, fonts, images).

Older Vietnamese versions of the legal pages existed (`privacy-vi.html`, `support-vi.html`,
`terms-vi.html`) using a manual `English · Tiếng Việt` link switcher, but they were deleted in the
working tree and the EN legal pages were since restyled (privacy rewritten platform-neutral for
iOS + Android). The landing page has no Vietnamese version. The old VI legal files are still in git
history at `HEAD` (e.g. `git show HEAD:terms-vi.html`) and can seed the new translations.

## 2. Goals / Non-goals

**Goals**
- Provide a complete Vietnamese version of all four pages.
- Let users switch language via a dropdown in the header.
- Auto-detect language on first visit: Vietnamese for users in Vietnam or with a Vietnamese
  browser locale; English otherwise.
- Be SEO-correct: each language indexable at its own URL, with `hreflang` annotations.

**Non-goals**
- No backend / server-side logic (static host only).
- No build step or templating (hand-authored HTML).
- No third-party geo-IP service (detection is client-side only).

## 3. Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Detection signal | `navigator.languages` **+** timezone (`Intl…timeZone`) | Client-side, instant, no external dependency. Catches both VN-located users and VI-locale users abroad. |
| Architecture | **Separate HTML file per language + `hreflang`** | SEO-correct: VI gets its own indexable URL. Simpler JS than a dictionary approach (each file is static, monolingual). |
| URL convention | Flat `*-vi.html` in root | Matches the previous convention; relative `assets/...` paths stay valid; no subfolder asset-path churn. |
| Scope | All 4 pages (index + privacy + terms + support) | Whole-site consistency. |

**Accepted trade-off:** two HTML copies per page to maintain. Shared CSS/JS stays external, so only
the body text differs between languages.

## 4. URL structure

| EN | VI |
|---|---|
| `https://reptofit.com/` (`index.html`) | `https://reptofit.com/index-vi.html` |
| `/privacy.html` | `/privacy-vi.html` |
| `/terms.html` | `/terms-vi.html` |
| `/support.html` | `/support-vi.html` |

Each file is a static single-language document with the correct `<html lang>` in source so both
languages are independently crawlable/indexable. Canonical for the EN home is `https://reptofit.com/`
(not `/index.html`).

## 5. `hreflang` + canonical

Every page carries reciprocal alternates plus a self-canonical, placed in `<head>` **before** the
redirect script (the script reads these tags). Example for `index.html`:

```html
<link rel="canonical" href="https://reptofit.com/" />
<link rel="alternate" hreflang="en" href="https://reptofit.com/" />
<link rel="alternate" hreflang="vi" href="https://reptofit.com/index-vi.html" />
<link rel="alternate" hreflang="x-default" href="https://reptofit.com/" />
```

`index-vi.html` mirrors it with `canonical` → `https://reptofit.com/index-vi.html`. Legal pages
follow the same pattern with their own URLs (canonical uses the explicit `.html` form, e.g.
`https://reptofit.com/privacy.html` ↔ `.../privacy-vi.html`).

## 6. Auto-detect + redirect

A small inline `<script>` in `<head>`, placed **after** the `hreflang` link tags. It is **identical
on all 8 pages** because it derives everything from the page's own `<html lang>` and `hreflang`
links. It runs before paint and uses `location.replace()` (no history entry → Back button never
loops).

```html
<script>
(function () {
  try {
    var cur = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
    var saved = null;
    try { saved = localStorage.getItem('repto-lang'); } catch (e) {}
    var q = (location.search.match(/[?&]lang=(en|vi)/) || [])[1];
    if (q) { try { localStorage.setItem('repto-lang', q); } catch (e) {} }
    var want = q || saved;
    if (!want) {
      var langs = navigator.languages || [navigator.language || ''];
      var prefersVi = langs.some(function (l) { return /^vi\b/i.test(l); });
      var tz = '';
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
      want = (prefersVi || /Ho_Chi_Minh|Saigon/i.test(tz)) ? 'vi' : 'en';
    }
    if (want !== cur) {
      var node = document.querySelector('link[rel="alternate"][hreflang="' + want + '"]');
      if (node && node.href) location.replace(node.href);
    }
  } catch (e) {}
})();
</script>
```

**Precedence:** saved `localStorage['repto-lang']` → `?lang=en|vi` → browser locale → timezone →
default `en`.

**Persistence rule:** auto-detection does **not** write `localStorage` (stays dynamic across
visits). Only an explicit choice persists — `?lang=` (stored by the script above) or a dropdown
click (stored by `lang.js`).

**Crawler behaviour:** Googlebot (US IP, `Accept-Language: en`) resolves `want = en` and stays on the
EN page; it discovers the VI page via the `hreflang` link. No cloaking; both versions reachable.

## 7. Language dropdown

Rendered by `assets/lang.js` into a per-page placeholder `<div data-lang-switch></div>` positioned
in each header next to the Download CTA (visible on mobile). One source of markup/behavior for all 8
pages. The script:
- Reads the EN/VI counterpart URLs from the page's `hreflang` link tags (DRY — no per-page URL
  hardcoding) and the current language from `<html lang>`.
- Builds a button (`🌐` globe + current code `EN`/`VI` + chevron, both inline SVG so no icon-sprite
  dependency) and a menu with two real `<a href>` items (English / Tiếng Việt), current marked
  active.
- On click, writes `localStorage['repto-lang']` to the target language **before** navigation, so the
  destination page's redirect script does not bounce the user back.
- A11y: button `aria-haspopup="true"` / `aria-expanded`; menu closes on Esc and outside-click;
  arrow-key navigation between items.

**No-JS fallback:** each header placeholder contains a `<noscript>` with a plain `<a>` to the other
language so switching still works without JS. (Auto-redirect is JS-only and simply does not happen
without JS — links degrade gracefully.)

## 8. Styling

`assets/lang.css` — dropdown styles using existing design tokens from `colors_and_type.css`. Loaded
on all 8 pages (landing + legal) so the switcher looks identical everywhere; keeps dropdown CSS out
of both `styles.css` and the legal pages' inline `<style>` blocks (single source).

## 9. Translation content

- **Landing (`index-vi.html`):** fresh Vietnamese translation of all marketing copy (hero, features,
  coach, showcase, pricing, CTA, footer, nav, `<title>` + meta description).
- **Legal (`*-vi.html`):** seed from the old VI files in git history
  (`git show HEAD:terms-vi.html`, etc.), but track the **current EN content** — privacy is now
  platform-neutral (iOS + Android) and all three are restyled — translating the diffs and matching
  the new markup/structure.

Each VI file mirrors its EN sibling's structure and shared asset includes; only text, `<html lang="vi">`,
`<title>`, meta description, canonical, and the redirect script's derived values differ.

## 10. SEO extras (included unless cut on review)

- `og:locale` (`en_US` / `vi_VN`) + `og:locale:alternate` on each page for correct social previews.
- `sitemap.xml` at root listing all 8 URLs with `xhtml:link` `hreflang` alternates.

## 11. File inventory

**New — shared module**
- `assets/lang.js` — dropdown render + wiring + store-pref-on-click.
- `assets/lang.css` — dropdown styles.

**New — Vietnamese pages**
- `index-vi.html`, `privacy-vi.html`, `terms-vi.html`, `support-vi.html`.

**New — SEO**
- `sitemap.xml`.

**Modified — English pages** (`index.html`, `privacy.html`, `terms.html`, `support.html`)
- Add canonical + `hreflang` link tags.
- Add inline redirect `<script>` in `<head>`.
- Add `og:locale` / `og:locale:alternate`.
- Include `assets/lang.css` and `assets/lang.js`.
- Add `<div data-lang-switch></div>` (+ `<noscript>` fallback) to the header.

## 12. Testing (manual)

- `?lang=vi` / `?lang=en` override forces and persists the language.
- Browser locale set to Vietnamese → first visit to `/` redirects to `/index-vi.html`.
- Timezone `Asia/Ho_Chi_Minh` (EN locale) → redirects to VI.
- Default (EN locale, non-VN timezone) → stays EN.
- Dropdown switches language and persists; Back button does not loop.
- Stored choice overrides auto-detection on subsequent visits.
- JS disabled → no redirect, `<noscript>` link still navigates between languages.
- `hreflang` reciprocity validated across all pairs.

## 13. Known limitations / future

- Translations are static; copy changes must be applied in both language files.
- If clean URLs (extensionless) are later enabled on Cloudflare Pages, canonical/`hreflang`/dropdown
  URLs must be revisited for consistency.
