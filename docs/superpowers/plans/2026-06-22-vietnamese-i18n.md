# Vietnamese i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully Vietnamese version of all four pages (landing + 3 legal), with a header language dropdown and first-visit auto-detection, while staying SEO-correct via per-language URLs + `hreflang`.

**Architecture:** Each language is a separate static HTML file (`*.html` EN, `*-vi.html` VI). A small inline `<head>` script auto-redirects first-time visitors to their language; a shared `assets/lang.js` renders the header dropdown and persists explicit choices to `localStorage`. `hreflang`/canonical tags make both languages independently indexable. No backend, no build step, no new dependencies.

**Tech Stack:** Plain HTML, CSS (existing design tokens in `assets/colors_and_type.css`), vanilla ES5-style JS (matches `assets/app.js`). Domain: `https://reptofit.com` (Cloudflare Pages, served at root).

## Global Constraints

- **No build step, no dependencies, no backend.** Hand-authored static files only.
- **Domain:** `https://reptofit.com`, served at root (no subpath). Asset paths stay relative (`assets/...`).
- **localStorage key:** `repto-lang`; allowed values `"en"` or `"vi"` only.
- **Navigation between languages uses `location.replace()`** (no history entry → Back never loops).
- **JS style:** ES5-compatible IIFE, `'use strict'`, `var`, defensive `try/catch` around `localStorage`/`Intl` — match `assets/app.js`.
- **Translation scope (what becomes Vietnamese):** marketing prose, nav links, section headings, CTAs, pricing copy, footer, and the full body of legal pages.
- **KEEP in English (do NOT translate):** brand/product names (`Repto`, `Repto Coach`, `Apple Watch`, `Apple Health`, `App Store`, `Google Play`, `Dynamic Island`, `Live Activities`), technical abbreviations (`PR`, `1RM`, `RPE`, `Push/Pull/Legs`, `PPL`, `HIIT`, `CSV`), numbers/prices, and **all in-app mock UI text inside `.phone`, `.watch`, and `.liveact`** (these depict the actual English app screens). The App Store / Google Play badge text uses the official localized wording from the table in Task 2.
- **hreflang URLs are exact and absolute** — copy verbatim from each task's head block.

## Translation glossary (use consistently everywhere)

| English | Vietnamese |
|---|---|
| Features | Tính năng |
| Pricing | Bảng giá |
| Download | Tải về |
| Support | Hỗ trợ |
| Privacy Policy | Chính sách quyền riêng tư |
| Terms of Use | Điều khoản sử dụng |
| workout / session | buổi tập |
| set | set |
| rep | rep |
| rest timer | bộ đếm nghỉ |
| program | chương trình |
| template | mẫu |
| plan | kế hoạch |
| volume | volume |
| recovery | phục hồi |
| weekly review | đánh giá hằng tuần |
| Free / Pro | Miễn phí / Pro |
| forever | trọn đời |
| lifetime | trọn đời |
| Most popular | Phổ biến nhất |
| Last updated | Cập nhật lần cuối |

## File structure

**New — shared modules**
- `assets/redirect.js` — first-visit auto-detect + redirect. Loaded as a **blocking** `<script src>` in `<head>` AFTER the `hreflang` tags so it runs before paint and can read them. Single source of truth (no per-page inline duplication).
- `assets/lang.js` — renders the header dropdown into `[data-lang-switch]`, reads target URLs from the page's `hreflang` link tags, persists explicit choice to `localStorage['repto-lang']`. Loaded `defer` (runs after paint; switcher only).
- `assets/lang.css` — dropdown styling using existing tokens.

**New — Vietnamese pages**
- `index-vi.html`, `privacy-vi.html`, `terms-vi.html`, `support-vi.html`.

**New — SEO**
- `sitemap.xml`.

**Modified — English pages**
- `index.html`, `privacy.html`, `terms.html`, `support.html` — add SEO head block, include `lang.css` + blocking `redirect.js` (head) + deferred `lang.js`, add `[data-lang-switch]` to the header.

**Local preview for all manual tests:** `python3 -m http.server 8080` from the repo root, then visit `http://localhost:8080/`.

---

### Task 1: Shared modules (`assets/redirect.js` + `assets/lang.js` + `assets/lang.css`)

**Files:**
- Create: `assets/redirect.js`
- Create: `assets/lang.js`
- Create: `assets/lang.css`

**Interfaces:**
- Consumes (from each page that includes them): a `<div data-lang-switch>` mount point; `<html lang="en|vi">`; `<link rel="alternate" hreflang="en|vi" href="…">` tags.
- Produces: `redirect.js` runs the first-visit auto-detect/redirect (reads `hreflang` tags, calls `location.replace`); `lang.js` renders a `.lang-switch` dropdown and writes `localStorage['repto-lang']` (`"en"`/`"vi"`) on option click. Both are self-invoking (no exports). They share the `localStorage['repto-lang']` key.

- [ ] **Step 1: Create `assets/redirect.js`**

```js
/* ============================================================
   Repto — first-visit language auto-detect + redirect (shared).
   Loaded as a BLOCKING <script src> in <head>, AFTER the hreflang
   <link> tags, so it runs before paint and can read them.
   Precedence: localStorage['repto-lang'] -> ?lang= -> navigator
   languages (vi) -> timezone (Asia/Ho_Chi_Minh) -> default en.
   Uses location.replace() so the Back button never loops.
   ============================================================ */
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
```

- [ ] **Step 2: Create `assets/lang.js`**

```js
/* ============================================================
   Repto — language switcher dropdown (shared, all pages)
   Renders into <div data-lang-switch>, deriving the EN/VI target
   URLs from the page's <link rel="alternate" hreflang> tags and the
   current language from <html lang>. On click it writes the user's
   explicit choice to localStorage['repto-lang'] BEFORE navigation so
   the destination page's redirect script honours it.
   (Auto-detect + first-visit redirect lives in the shared assets/redirect.js.)
   ============================================================ */
(function () {
  'use strict';

  var mount = document.querySelector('[data-lang-switch]');
  if (!mount) return;

  var LANGS = ['en', 'vi'];
  var LABEL = { en: 'English', vi: 'Tiếng Việt' };
  var CODE = { en: 'EN', vi: 'VI' };

  var cur = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
  if (LANGS.indexOf(cur) === -1) cur = 'en';

  function altHref(l) {
    var n = document.querySelector('link[rel="alternate"][hreflang="' + l + '"]');
    return n ? n.getAttribute('href') : null;
  }

  var GLOBE = '<svg class="lang-switch__globe" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  var CHEV = '<svg class="lang-switch__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var TICK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  var items = '';
  LANGS.forEach(function (l) {
    var href = altHref(l) || '#';
    var isCur = l === cur;
    items +=
      '<li role="none">' +
      '<a role="menuitem" class="lang-switch__opt' + (isCur ? ' is-current' : '') + '"' +
      ' href="' + href + '" data-lang="' + l + '" hreflang="' + l + '" lang="' + l + '"' +
      (isCur ? ' aria-current="true"' : '') + '>' +
      '<span>' + LABEL[l] + '</span>' + (isCur ? TICK : '') +
      '</a></li>';
  });

  mount.innerHTML =
    '<div class="lang-switch">' +
      '<button type="button" class="lang-switch__btn" aria-haspopup="true" aria-expanded="false" aria-label="Change language / Đổi ngôn ngữ">' +
        GLOBE + '<span class="lang-switch__code">' + CODE[cur] + '</span>' + CHEV +
      '</button>' +
      '<ul class="lang-switch__menu" role="menu">' + items + '</ul>' +
    '</div>';

  var root = mount.querySelector('.lang-switch');
  var btn = root.querySelector('.lang-switch__btn');
  var menu = root.querySelector('.lang-switch__menu');
  var opts = Array.prototype.slice.call(menu.querySelectorAll('.lang-switch__opt'));

  function onDocClick(e) { if (!root.contains(e.target)) close(); }
  function onKey(e) {
    if (e.key === 'Escape') { close(); btn.focus(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      var i = opts.indexOf(document.activeElement);
      var n = e.key === 'ArrowDown' ? (i + 1) % opts.length : (i - 1 + opts.length) % opts.length;
      opts[n].focus();
    }
  }
  function open() {
    root.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKey, true);
  }
  function close() {
    root.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKey, true);
  }
  function toggle() { root.classList.contains('is-open') ? close() : open(); }

  btn.addEventListener('click', function (e) { e.preventDefault(); toggle(); });

  opts.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var l = a.getAttribute('data-lang');
      try { localStorage.setItem('repto-lang', l); } catch (err) {}
      if (l === cur) { e.preventDefault(); close(); } // already here — just lock the choice
    });
  });
})();
```

- [ ] **Step 3: Create `assets/lang.css`**

```css
/* Repto — language switcher dropdown (shared: landing + legal) */
.lang-switch { position: relative; display: inline-flex; flex: none; }

.lang-switch__btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 38px; padding: 0 10px 0 12px;
  font: var(--caption); font-weight: 600; color: var(--text-primary);
  background: var(--surface-highest); border: 1px solid var(--stroke);
  border-radius: var(--radius-full); cursor: pointer;
  -webkit-appearance: none; appearance: none;
  transition: background .18s ease, border-color .18s ease;
}
.lang-switch__btn:hover { background: var(--surface-bright); }
.lang-switch__globe { color: var(--lime); flex: none; }
.lang-switch__code { letter-spacing: .5px; }
.lang-switch__chev { color: var(--text-secondary); transition: transform .2s ease; }
.lang-switch.is-open .lang-switch__chev { transform: rotate(180deg); }

.lang-switch__menu {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 200;
  min-width: 172px; margin: 0; padding: 6px; list-style: none;
  background: var(--surface-high); border: 1px solid var(--outline-variant);
  border-radius: var(--radius-md); box-shadow: 0 12px 32px rgba(0, 0, 0, .36);
  opacity: 0; transform: translateY(-6px); pointer-events: none;
  transition: opacity .16s ease, transform .16s ease;
}
.lang-switch.is-open .lang-switch__menu { opacity: 1; transform: translateY(0); pointer-events: auto; }

.lang-switch__opt {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 9px 12px; border-radius: var(--radius-sm);
  font: var(--body); font-weight: 500; color: var(--text-primary); text-decoration: none;
}
.lang-switch__opt:hover { background: var(--surface-highest); }
.lang-switch__opt.is-current { color: var(--lime); }
.lang-switch__opt svg { color: var(--lime); flex: none; }

@media (max-width: 560px) {
  .lang-switch__btn { height: 34px; padding: 0 8px 0 10px; }
}
```

- [ ] **Step 4: Lint-check both JS files for syntax errors**

Run: `node --check assets/redirect.js && node --check assets/lang.js`
Expected: no output, exit code 0 (both files parse).

- [ ] **Step 5: Commit**

```bash
git add assets/redirect.js assets/lang.js assets/lang.css
git commit -m "feat(i18n): shared redirect + language switcher modules"
```

---

### Task 2: Landing page — `index.html` (EN wiring) + `index-vi.html` (Vietnamese)

**Files:**
- Modify: `index.html` (head ~line 3-10; nav ~line 54; script include ~line 599)
- Create: `index-vi.html`

**Interfaces:**
- Consumes: `assets/redirect.js`, `assets/lang.js`, `assets/lang.css` (Task 1).
- Produces: the EN↔VI `hreflang` pair for the home page; the `[data-lang-switch]` mount in the landing nav.

- [ ] **Step 1: Add the SEO head block + redirect script to `index.html`**

In `index.html`, immediately AFTER the existing `<link rel="stylesheet" href="assets/styles.css" />` line (currently line 10), insert:

```html
<link rel="stylesheet" href="assets/lang.css" />
<link rel="canonical" href="https://reptofit.com/" />
<link rel="alternate" hreflang="en" href="https://reptofit.com/" />
<link rel="alternate" hreflang="vi" href="https://reptofit.com/index-vi.html" />
<link rel="alternate" hreflang="x-default" href="https://reptofit.com/" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://reptofit.com/" />
<meta property="og:title" content="Repto — Train with rhythm. Track every rep." />
<meta property="og:description" content="The workout tracker with a built-in AI coach, real-time timers, and Apple Watch + Health built in." />
<meta property="og:image" content="https://reptofit.com/assets/repto-logo.jpeg" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="vi_VN" />
<script src="assets/redirect.js"></script>
```

- [ ] **Step 2: Add the language switcher to the landing nav**

In `index.html`, replace the CTA line (currently `    <a href="#download" class="btn-cta nav__cta">Download</a>`) with:

```html
    <div class="nav__lang" data-lang-switch><noscript><a href="index-vi.html">Tiếng Việt</a></noscript></div>
    <a href="#download" class="btn-cta nav__cta">Download</a>
```

- [ ] **Step 3: Include `lang.js` on `index.html`**

In `index.html`, immediately AFTER the existing `<script src="assets/app.js" defer></script>` line, add:

```html
<script src="assets/lang.js" defer></script>
```

- [ ] **Step 4: Verify the EN wiring with grep**

Run:
```bash
grep -c 'hreflang="vi"' index.html && grep -c 'data-lang-switch' index.html && grep -c 'assets/lang.js' index.html && grep -c 'assets/redirect.js' index.html
```
Expected: `1` printed four times (each marker present exactly once).

- [ ] **Step 5: Create `index-vi.html`**

Copy `index.html` to `index-vi.html`, then apply ALL of the following. Use the translation table below. **Translate ONLY the listed strings; leave everything inside `.phone`, `.watch`, `.liveact` exactly as-is (English).**

```bash
cp index.html index-vi.html
```

Then edit `index-vi.html`:

1. `<html lang="en">` → `<html lang="vi">`
2. `<title>` → `<title>Repto — Tập theo nhịp. Ghi lại từng rep.</title>`
3. `<meta name="description" …>` content → `Ứng dụng theo dõi tập luyện với AI coach tích hợp, hẹn giờ thời gian thực, cùng Apple Watch + Apple Health. Làm chủ thời gian. Nâng tầm phong độ.`
4. In the head block from Step 1, swap the SEO values for VI:
   - `<link rel="canonical" href="https://reptofit.com/index-vi.html" />`
   - keep both `hreflang="en"` (`https://reptofit.com/`) and `hreflang="vi"` (`https://reptofit.com/index-vi.html`) and `x-default` (`https://reptofit.com/`) — identical to EN (reciprocal).
   - `<meta property="og:url" content="https://reptofit.com/index-vi.html" />`
   - `<meta property="og:title" content="Repto — Tập theo nhịp. Ghi lại từng rep." />`
   - `<meta property="og:description" content="Ứng dụng theo dõi tập luyện với AI coach tích hợp, hẹn giờ thời gian thực, cùng Apple Watch + Apple Health." />`
   - `<meta property="og:locale" content="vi_VN" />`
   - `<meta property="og:locale:alternate" content="en_US" />`
5. Nav `<noscript>` fallback: `<noscript><a href="index.html">English</a></noscript>`
6. Footer Legal links → point to the VI legal pages: `privacy-vi.html`, `terms-vi.html`, `support-vi.html`.
7. Apply the translation table:

| Location | English | Vietnamese |
|---|---|---|
| nav | Features / Coach / Showcase / Pricing | Tính năng / Coach / Trải nghiệm / Bảng giá |
| nav CTA | Download | Tải về |
| hero overline | Master your time · Elevate your performance | Làm chủ thời gian · Nâng tầm phong độ |
| hero h1 | Train with rhythm.<br />Track <span class="accent">every rep.</span> | Tập theo nhịp.<br />Ghi lại <span class="accent">từng rep.</span> |
| hero lead | The workout tracker with a built-in AI coach, real-time timers, and Apple Watch + Health built in. | Ứng dụng theo dõi tập luyện tích hợp AI coach, hẹn giờ thời gian thực, cùng Apple Watch + Health. |
| App Store badge `__pre`/`__name` (all 4 instances) | Download on the / App Store | Tải xuống trên / App Store |
| Google Play badge `__pre`/`__name` (all 4 instances) | GET IT ON / Google Play | TẢI ỨNG DỤNG TRÊN / Google Play |
| App Store `aria-label` (all) | Download Repto on the App Store | Tải Repto trên App Store |
| Google Play `aria-label` (all) | Get Repto on Google Play | Tải Repto trên Google Play |
| hero ghost btn | See features | Xem tính năng |
| hero rating | 4.8 · loved by lifters who actually train | 4.8 · được tin dùng bởi những người tập thật sự |
| proof stat labels | App Store rating / Workouts logged / Exercises in library | Đánh giá App Store / Buổi tập đã ghi / Bài tập trong thư viện |
| proof | Works with | Hoạt động cùng |
| features overline | Everything you train with | Tất cả những gì bạn cần để tập |
| features title | Built for people who lift. | Tạo ra cho người tập tạ. |
| features lead | No fluff. Every feature earns its place in your session. | Không màu mè. Mỗi tính năng đều có lý do tồn tại trong buổi tập của bạn. |
| feature 1 | Real-time logging / Count-up stopwatch, set checkboxes and rest countdown timers — log every set as you lift. | Ghi log thời gian thực / Đồng hồ bấm giờ đếm lên, ô đánh dấu set và bộ đếm ngược nghỉ — ghi lại từng set ngay khi tập. |
| feature 2 | Live Activities &amp; Dynamic Island / Your rest timer on the Lock Screen and Dynamic Island. Never miss a set. | Live Activities &amp; Dynamic Island / Bộ đếm nghỉ ngay trên Màn hình khóa và Dynamic Island. Không bỏ lỡ set nào. |
| feature 3 | Repto Coach (AI) / Chat, weekly reviews and adaptive programs that respond to your data. | Repto Coach (AI) / Trò chuyện, đánh giá hằng tuần và chương trình thích ứng theo dữ liệu của bạn. |
| feature 4 | Apple Watch app / Standalone and ready — start and log your whole workout from your wrist. | Ứng dụng Apple Watch / Độc lập và sẵn sàng — bắt đầu và ghi lại cả buổi tập ngay trên cổ tay. |
| feature 5 | Apple Health / Auto-syncs workouts, body weight and recovery into one place. | Apple Health / Tự động đồng bộ buổi tập, cân nặng và phục hồi về một nơi. |
| feature 6 | Analytics &amp; PRs / 1RM estimates, rep PRs and progress charts that make gains visible. | Phân tích &amp; PR / Ước lượng 1RM, PR số rep và biểu đồ tiến bộ giúp thấy rõ thành quả. |
| feature 7 | Programs &amp; templates / Browse, filter and apply ready-made plans — or build your own. | Chương trình &amp; mẫu / Duyệt, lọc và áp dụng kế hoạch dựng sẵn — hoặc tự tạo của riêng bạn. |
| feature 8 | Cardio modes / Time and distance tracking with live pace for runs and intervals. | Chế độ cardio / Theo dõi thời gian và quãng đường cùng pace trực tiếp cho chạy bộ và interval. |
| coach overline | Repto Coach | Repto Coach |
| coach title | Your AI coach.<br /><span class="accent">In your pocket.</span> | AI coach của bạn.<br /><span class="accent">Ngay trong túi.</span> |
| coach lead | Not a chatbot bolted on — a coach that actually reads your training data and acts on it. | Không phải chatbot gắn thêm cho có — một coach thật sự đọc dữ liệu tập luyện của bạn và hành động dựa trên đó. |
| coach bullet 1 | Builds your program / Two quick questions and AI drafts a plan tailored to your goals and schedule. | Xây chương trình cho bạn / Hai câu hỏi nhanh và AI phác thảo kế hoạch phù hợp mục tiêu và lịch của bạn. |
| coach bullet 2 | Reviews your week / A weekly review reads your sessions, sleep and recovery — then tells you what to change. | Đánh giá tuần của bạn / Bản đánh giá hằng tuần đọc các buổi tập, giấc ngủ và phục hồi — rồi cho bạn biết cần thay đổi gì. |
| coach bullet 3 | Adapts to your progress / Volume too high? PR stalling? Your next week shifts automatically. | Thích ứng theo tiến bộ / Volume quá cao? PR chững lại? Tuần kế tiếp tự điều chỉnh. |
| showcase row1 overline | Progress that's visible | Tiến bộ nhìn thấy được |
| showcase row1 title | See every gain, not just the grind. | Thấy rõ từng bước tiến, không chỉ là mồ hôi. |
| showcase row1 body | 1RM trends, weekly volume and rep PRs rendered in clean, mono-numeric charts. Tap any lift to see how far you've come. | Xu hướng 1RM, volume hằng tuần và PR số rep hiển thị trong biểu đồ rõ ràng. Chạm vào bài tập bất kỳ để xem bạn đã tiến xa thế nào. |
| showcase row1 chips | 1RM estimates / Rep PRs / Volume by muscle | Ước lượng 1RM / PR số rep / Volume theo nhóm cơ |
| showcase row2 overline | Programs &amp; templates | Chương trình &amp; mẫu |
| showcase row2 title | Start from a plan that works. | Bắt đầu từ một kế hoạch đã được kiểm chứng. |
| showcase row2 body | Browse and filter proven programs, then apply one in a tap. Push/Pull/Legs, upper/lower, athlete power — or build your own from scratch. | Duyệt và lọc các chương trình đã được kiểm chứng, rồi áp dụng chỉ với một chạm. Push/Pull/Legs, upper/lower, athlete power — hoặc tự dựng từ đầu. |
| showcase row2 chips | Filter &amp; browse / One-tap apply / Fully editable | Lọc &amp; duyệt / Áp dụng một chạm / Tùy chỉnh hoàn toàn |
| showcase row3 overline | On every screen you own | Trên mọi màn hình của bạn |
| showcase row3 title | From your wrist to your Lock Screen. | Từ cổ tay đến Màn hình khóa. |
| showcase row3 body | A standalone Apple Watch app logs sets from your wrist. Live Activities keep your rest timer running on the Lock Screen and Dynamic Island — glance, breathe, lift. | Ứng dụng Apple Watch độc lập ghi set ngay trên cổ tay. Live Activities giữ bộ đếm nghỉ chạy trên Màn hình khóa và Dynamic Island — liếc nhìn, hít thở, nâng tạ. |
| showcase row3 chips | Standalone Watch app / Live rest timer / Dynamic Island | Ứng dụng Watch độc lập / Đếm nghỉ trực tiếp / Dynamic Island |
| pricing overline | Pricing | Bảng giá |
| pricing title | Train free. Go Pro when you're ready. | Tập miễn phí. Lên Pro khi bạn sẵn sàng. |
| pricing lead | Sharing, export, Health and Watch are free for everyone. | Chia sẻ, xuất dữ liệu, Health và Watch miễn phí cho tất cả. |
| FREE tier | FREE / forever / Everything you need to track real training. | MIỄN PHÍ / trọn đời / Tất cả những gì bạn cần để theo dõi tập luyện thực thụ. |
| FREE list | Up to 4 plans per program / Templates &amp; program library / Sharing &amp; CSV export / Apple Health sync / Apple Watch app | Tối đa 4 kế hoạch mỗi chương trình / Thư viện mẫu &amp; chương trình / Chia sẻ &amp; xuất CSV / Đồng bộ Apple Health / Ứng dụng Apple Watch |
| FREE CTA | Get Repto free | Tải Repto miễn phí |
| PRO badge | Most popular | Phổ biến nhất |
| PRO per/alts | / month / $11.99 / yr / $29.99 lifetime | / tháng / $11.99 / năm / $29.99 trọn đời |
| PRO list | Everything in Free / Unlimited plans per program / Full Repto Coach (AI) / Weekly reviews &amp; adaptive weeks / Priority AI coaching | Mọi thứ trong gói Miễn phí / Không giới hạn kế hoạch mỗi chương trình / Repto Coach (AI) đầy đủ / Đánh giá hằng tuần &amp; tuần thích ứng / Ưu tiên huấn luyện AI |
| PRO CTA | Start Pro | Bắt đầu Pro |
| final CTA title | Ready to train <span class="accent">smarter?</span> | Sẵn sàng tập <span class="accent">thông minh hơn?</span> |
| final CTA lead | Download Repto and log your first set in under a minute. Free to start. | Tải Repto và ghi set đầu tiên trong chưa đầy một phút. Miễn phí để bắt đầu. |
| final CTA rating | 4.8 on the App Store | 4.8 trên App Store |
| footer blurb | The workout tracker with rhythm. Master your time. Elevate your performance. | Ứng dụng theo dõi tập luyện có nhịp điệu. Làm chủ thời gian. Nâng tầm phong độ. |
| footer col Product | Product / Features / Repto Coach / Pricing / Apple Watch | Sản phẩm / Tính năng / Repto Coach / Bảng giá / Apple Watch |
| footer col Company | Company / About / Blog / Careers | Công ty / Giới thiệu / Blog / Tuyển dụng |
| footer col Legal | Legal / Privacy / Terms / Support | Pháp lý / Quyền riêng tư / Điều khoản / Hỗ trợ |
| footer bottom | © 2026 Repto. All rights reserved. / Made for people who actually train. | © 2026 Repto. Bảo lưu mọi quyền. / Tạo ra cho những người tập thật sự. |

- [ ] **Step 6: Verify `index-vi.html` structure**

Run:
```bash
grep -c 'lang="vi"' index-vi.html && grep -c 'canonical" href="https://reptofit.com/index-vi.html"' index-vi.html && grep -c 'privacy-vi.html' index-vi.html
```
Expected: first ≥ `1`, second `1`, third `1`.

Run (no leftover English marketing headline):
```bash
grep -c 'Train with rhythm' index-vi.html
```
Expected: `0`.

Run (mock UI text correctly left in English):
```bash
grep -c 'Finish Workout' index-vi.html
```
Expected: `1` (phone mock untouched).

- [ ] **Step 7: Manual browser test (serve locally)**

```bash
python3 -m http.server 8080
```
Verify in a browser:
1. `http://localhost:8080/?lang=vi` → lands on/stays Vietnamese; `localStorage['repto-lang'] === 'vi'`.
2. `http://localhost:8080/?lang=en` → English; storage `'en'`.
3. With storage cleared (`localStorage.removeItem('repto-lang')`) and browser language Vietnamese → visiting `http://localhost:8080/` redirects to `/index-vi.html`.
4. Dropdown shows current language, lists English + Tiếng Việt, switches pages, and Back button does not bounce.
5. Dropdown opens/closes on click, Escape, and outside-click.

- [ ] **Step 8: Commit**

```bash
git add index.html index-vi.html
git commit -m "feat(i18n): bilingual landing page (EN wiring + Vietnamese index-vi.html)"
```

---

### Task 3: Privacy page — `privacy.html` (EN wiring) + `privacy-vi.html`

**Files:**
- Modify: `privacy.html` (head after line 8; nav ~line 266)
- Create: `privacy-vi.html`

**Interfaces:**
- Consumes: `assets/redirect.js`, `assets/lang.js`, `assets/lang.css`.
- Produces: EN↔VI `hreflang` pair for privacy; `[data-lang-switch]` mount in the legal nav.

- [ ] **Step 1: Add SEO head block + redirect script to `privacy.html`**

In `privacy.html`, immediately AFTER `<link rel="stylesheet" href="assets/colors_and_type.css" />` (line 8), insert:

```html
<link rel="stylesheet" href="assets/lang.css" />
<link rel="canonical" href="https://reptofit.com/privacy.html" />
<link rel="alternate" hreflang="en" href="https://reptofit.com/privacy.html" />
<link rel="alternate" hreflang="vi" href="https://reptofit.com/privacy-vi.html" />
<link rel="alternate" hreflang="x-default" href="https://reptofit.com/privacy.html" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://reptofit.com/privacy.html" />
<meta property="og:title" content="Repto — Privacy Policy" />
<meta property="og:image" content="https://reptofit.com/assets/repto-logo.jpeg" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="vi_VN" />
<script src="assets/redirect.js"></script>
```

- [ ] **Step 2: Add the switcher to the legal nav + include `lang.js`**

In `privacy.html`, replace the nav CTA line (`      <a class="nav-cta" href="index.html#download">Download</a>`) with:

```html
      <div class="nav-lang" data-lang-switch><noscript><a href="privacy-vi.html">Tiếng Việt</a></noscript></div>
      <a class="nav-cta" href="index.html#download">Download</a>
```

Then immediately BEFORE `</body>`, add:

```html
<script src="assets/lang.js" defer></script>
```

- [ ] **Step 3: Verify EN wiring**

Run:
```bash
grep -c 'hreflang="vi"' privacy.html && grep -c 'data-lang-switch' privacy.html && grep -c 'assets/lang.js' privacy.html
```
Expected: `1` three times.

- [ ] **Step 4: Create `privacy-vi.html`**

```bash
cp privacy.html privacy-vi.html
```

Then edit `privacy-vi.html`:
1. `<html lang="en">` → `<html lang="vi">`
2. `<title>Repto — Privacy Policy</title>` → `<title>Repto — Chính sách quyền riêng tư</title>`
3. `<meta name="description">` content → `Cách Repto thu thập, sử dụng và bảo vệ dữ liệu của bạn. Dữ liệu sức khỏe được xử lý trên thiết bị của bạn và không bao giờ bị bán.`
4. Head SEO block VI values: `canonical` → `https://reptofit.com/privacy-vi.html`; `og:url` → same; `og:title` → `Repto — Chính sách quyền riêng tư`; `og:locale` → `vi_VN`; `og:locale:alternate` → `en_US`. Keep both `hreflang` lines + `x-default` identical to EN.
5. `<noscript>` fallback → `<a href="privacy.html">English</a>`.
6. Any in-page links to `terms.html` / `support.html` / `index.html` in body/footer → point to `terms-vi.html` / `support-vi.html` / `index-vi.html`. (External links like supabase.com/anthropic.com/google stay unchanged.)
7. **Translate the full visible body** of the page into Vietnamese, following the glossary. Read the current `privacy.html` content top-to-bottom and translate every heading, paragraph, list item, table cell, button, and the table-of-contents. Seed wording from the prior Vietnamese version (`git show HEAD:privacy-vi.html`) where the content still matches, but the source of truth is the **current** `privacy.html` (it was rewritten platform-neutral for iOS + Android). Keep brand/standard terms per the Global Constraints. Translate the "Last updated …" line label to "Cập nhật lần cuối …" (keep the date).

- [ ] **Step 5: Verify VI page**

Run:
```bash
grep -c 'lang="vi"' privacy-vi.html && grep -c 'canonical" href="https://reptofit.com/privacy-vi.html"' privacy-vi.html
```
Expected: first ≥ `1`, second `1`.

Run (heading translated — no English title left in the visible H1):
```bash
grep -c 'Privacy Policy' privacy-vi.html
```
Expected: `0` for visible prose (note: `og`/title already changed; if any `0` mismatch, locate and translate the remaining instance — App Store/legal proper nouns excepted).

- [ ] **Step 6: Manual check + commit**

Serve locally, open `http://localhost:8080/privacy-vi.html`: confirm Vietnamese renders, dropdown works, internal links go to `-vi` pages.

```bash
git add privacy.html privacy-vi.html
git commit -m "feat(i18n): bilingual privacy page"
```

---

### Task 4: Terms page — `terms.html` (EN wiring) + `terms-vi.html`

**Files:**
- Modify: `terms.html` (head after line 8; nav ~line 218)
- Create: `terms-vi.html`

**Interfaces:**
- Consumes: `assets/redirect.js`, `assets/lang.js`, `assets/lang.css`.
- Produces: EN↔VI `hreflang` pair for terms.

- [ ] **Step 1: Add SEO head block + redirect script to `terms.html`**

In `terms.html`, immediately AFTER `<link rel="stylesheet" href="assets/colors_and_type.css" />` (line 8), insert:

```html
<link rel="stylesheet" href="assets/lang.css" />
<link rel="canonical" href="https://reptofit.com/terms.html" />
<link rel="alternate" hreflang="en" href="https://reptofit.com/terms.html" />
<link rel="alternate" hreflang="vi" href="https://reptofit.com/terms-vi.html" />
<link rel="alternate" hreflang="x-default" href="https://reptofit.com/terms.html" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://reptofit.com/terms.html" />
<meta property="og:title" content="Repto — Terms of Use" />
<meta property="og:image" content="https://reptofit.com/assets/repto-logo.jpeg" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="vi_VN" />
<script src="assets/redirect.js"></script>
```

- [ ] **Step 2: Add switcher to nav + include `lang.js`**

In `terms.html`, replace the nav CTA line (`      <a class="nav-cta" href="index.html#download">Download</a>`) with:

```html
      <div class="nav-lang" data-lang-switch><noscript><a href="terms-vi.html">Tiếng Việt</a></noscript></div>
      <a class="nav-cta" href="index.html#download">Download</a>
```

Then immediately BEFORE `</body>`, add:

```html
<script src="assets/lang.js" defer></script>
```

- [ ] **Step 3: Verify EN wiring**

Run:
```bash
grep -c 'hreflang="vi"' terms.html && grep -c 'data-lang-switch' terms.html && grep -c 'assets/lang.js' terms.html
```
Expected: `1` three times.

- [ ] **Step 4: Create `terms-vi.html`**

```bash
cp terms.html terms-vi.html
```

Then edit `terms-vi.html`:
1. `<html lang="en">` → `<html lang="vi">`
2. `<title>Repto — Terms of Use</title>` → `<title>Repto — Điều khoản sử dụng</title>`
3. `<meta name="description">` content → `Các điều khoản điều chỉnh việc bạn sử dụng Repto, bao gồm gói đăng ký, sử dụng hợp lệ và tuyên bố miễn trừ về sức khỏe & thể hình.`
4. Head SEO block VI values: `canonical`/`og:url` → `https://reptofit.com/terms-vi.html`; `og:title` → `Repto — Điều khoản sử dụng`; `og:locale` → `vi_VN`; `og:locale:alternate` → `en_US`. Keep both `hreflang` + `x-default` identical to EN.
5. `<noscript>` fallback → `<a href="terms.html">English</a>`.
6. In-page links to `privacy.html` / `support.html` / `index.html` → `privacy-vi.html` / `support-vi.html` / `index-vi.html`.
7. **Translate the full visible body** into Vietnamese, following the glossary, using the current `terms.html` as the source of truth. Seed from `git show HEAD:terms-vi.html` where content still matches. Keep brand/standard terms; translate the "Last updated …" label to "Cập nhật lần cuối …".

- [ ] **Step 5: Verify VI page**

Run:
```bash
grep -c 'lang="vi"' terms-vi.html && grep -c 'canonical" href="https://reptofit.com/terms-vi.html"' terms-vi.html
```
Expected: first ≥ `1`, second `1`.

- [ ] **Step 6: Manual check + commit**

Serve locally, open `http://localhost:8080/terms-vi.html`: confirm Vietnamese, dropdown, `-vi` internal links.

```bash
git add terms.html terms-vi.html
git commit -m "feat(i18n): bilingual terms page"
```

---

### Task 5: Support page — `support.html` (EN wiring) + `support-vi.html`

**Files:**
- Modify: `support.html` (head after line 8; nav ~line 180)
- Create: `support-vi.html`

**Interfaces:**
- Consumes: `assets/redirect.js`, `assets/lang.js`, `assets/lang.css`.
- Produces: EN↔VI `hreflang` pair for support.

- [ ] **Step 1: Add SEO head block + redirect script to `support.html`**

In `support.html`, immediately AFTER `<link rel="stylesheet" href="assets/colors_and_type.css" />` (line 8), insert:

```html
<link rel="stylesheet" href="assets/lang.css" />
<link rel="canonical" href="https://reptofit.com/support.html" />
<link rel="alternate" hreflang="en" href="https://reptofit.com/support.html" />
<link rel="alternate" hreflang="vi" href="https://reptofit.com/support-vi.html" />
<link rel="alternate" hreflang="x-default" href="https://reptofit.com/support.html" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://reptofit.com/support.html" />
<meta property="og:title" content="Repto — Support" />
<meta property="og:image" content="https://reptofit.com/assets/repto-logo.jpeg" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="vi_VN" />
<script src="assets/redirect.js"></script>
```

- [ ] **Step 2: Add switcher to nav + include `lang.js`**

In `support.html`, replace the nav CTA line (`      <a class="nav-cta" href="index.html#download">Download</a>`) with:

```html
      <div class="nav-lang" data-lang-switch><noscript><a href="support-vi.html">Tiếng Việt</a></noscript></div>
      <a class="nav-cta" href="index.html#download">Download</a>
```

Then immediately BEFORE `</body>`, add:

```html
<script src="assets/lang.js" defer></script>
```

- [ ] **Step 3: Verify EN wiring**

Run:
```bash
grep -c 'hreflang="vi"' support.html && grep -c 'data-lang-switch' support.html && grep -c 'assets/lang.js' support.html
```
Expected: `1` three times.

- [ ] **Step 4: Create `support-vi.html`**

```bash
cp support.html support-vi.html
```

Then edit `support-vi.html`:
1. `<html lang="en">` → `<html lang="vi">`
2. `<title>Repto — Support</title>` → `<title>Repto — Hỗ trợ</title>`
3. `<meta name="description">` content → `Nhận trợ giúp với Repto. Liên hệ với chúng tôi, xem các câu hỏi thường gặp về gói đăng ký, hoàn tiền, Apple Watch, xuất dữ liệu và hơn thế.`
4. Head SEO block VI values: `canonical`/`og:url` → `https://reptofit.com/support-vi.html`; `og:title` → `Repto — Hỗ trợ`; `og:locale` → `vi_VN`; `og:locale:alternate` → `en_US`. Keep both `hreflang` + `x-default` identical to EN.
5. `<noscript>` fallback → `<a href="support.html">English</a>`.
6. In-page links to `privacy.html` / `terms.html` / `index.html` → `privacy-vi.html` / `terms-vi.html` / `index-vi.html`. (Keep `mailto:` and external links unchanged.)
7. **Translate the full visible body** into Vietnamese, following the glossary, using current `support.html` as source of truth. Seed from `git show HEAD:support-vi.html` where content matches. Translate FAQ questions/answers, contact section, and any "Last updated" label. Keep brand/standard terms; keep the support email address unchanged.

- [ ] **Step 5: Verify VI page**

Run:
```bash
grep -c 'lang="vi"' support-vi.html && grep -c 'canonical" href="https://reptofit.com/support-vi.html"' support-vi.html
```
Expected: first ≥ `1`, second `1`.

- [ ] **Step 6: Manual check + commit**

Serve locally, open `http://localhost:8080/support-vi.html`: confirm Vietnamese, dropdown, `-vi` internal links, working email link.

```bash
git add support.html support-vi.html
git commit -m "feat(i18n): bilingual support page"
```

---

### Task 6: `sitemap.xml` + full-site verification

**Files:**
- Create: `sitemap.xml`

**Interfaces:**
- Consumes: all 8 pages' `hreflang` tags (Tasks 2-5).
- Produces: a sitemap listing every URL with reciprocal `xhtml:link` alternates.

- [ ] **Step 1: Create `sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://reptofit.com/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://reptofit.com/"/>
    <xhtml:link rel="alternate" hreflang="vi" href="https://reptofit.com/index-vi.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://reptofit.com/"/>
  </url>
  <url>
    <loc>https://reptofit.com/index-vi.html</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://reptofit.com/"/>
    <xhtml:link rel="alternate" hreflang="vi" href="https://reptofit.com/index-vi.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://reptofit.com/"/>
  </url>
  <url>
    <loc>https://reptofit.com/privacy.html</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://reptofit.com/privacy.html"/>
    <xhtml:link rel="alternate" hreflang="vi" href="https://reptofit.com/privacy-vi.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://reptofit.com/privacy.html"/>
  </url>
  <url>
    <loc>https://reptofit.com/privacy-vi.html</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://reptofit.com/privacy.html"/>
    <xhtml:link rel="alternate" hreflang="vi" href="https://reptofit.com/privacy-vi.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://reptofit.com/privacy.html"/>
  </url>
  <url>
    <loc>https://reptofit.com/terms.html</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://reptofit.com/terms.html"/>
    <xhtml:link rel="alternate" hreflang="vi" href="https://reptofit.com/terms-vi.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://reptofit.com/terms.html"/>
  </url>
  <url>
    <loc>https://reptofit.com/terms-vi.html</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://reptofit.com/terms.html"/>
    <xhtml:link rel="alternate" hreflang="vi" href="https://reptofit.com/terms-vi.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://reptofit.com/terms.html"/>
  </url>
  <url>
    <loc>https://reptofit.com/support.html</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://reptofit.com/support.html"/>
    <xhtml:link rel="alternate" hreflang="vi" href="https://reptofit.com/support-vi.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://reptofit.com/support.html"/>
  </url>
  <url>
    <loc>https://reptofit.com/support-vi.html</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://reptofit.com/support.html"/>
    <xhtml:link rel="alternate" hreflang="vi" href="https://reptofit.com/support-vi.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://reptofit.com/support.html"/>
  </url>
</urlset>
```

- [ ] **Step 2: Validate sitemap is well-formed XML**

Run: `python3 -c "import xml.dom.minidom, sys; xml.dom.minidom.parse('sitemap.xml'); print('valid')"`
Expected: `valid`.

- [ ] **Step 3: Verify hreflang reciprocity across all 8 pages**

Run this check (every page must declare both `hreflang="en"` and `hreflang="vi"`):
```bash
for f in index index-vi privacy privacy-vi terms terms-vi support support-vi; do
  en=$(grep -c 'hreflang="en"' "$f.html"); vi=$(grep -c 'hreflang="vi"' "$f.html"); xd=$(grep -c 'hreflang="x-default"' "$f.html")
  echo "$f.html en=$en vi=$vi x-default=$xd"
done
```
Expected: every line reads `en=1 vi=1 x-default=1`.

- [ ] **Step 4: Verify every EN page redirects and every VI page is `lang="vi"`**

Run:
```bash
for f in index privacy terms support; do echo "$f: redirect=$(grep -c 'assets/redirect.js' $f.html) lang.js=$(grep -c 'assets/lang.js' $f.html)"; done
for f in index-vi privacy-vi terms-vi support-vi; do echo "$f: vi=$(grep -c 'html lang=\"vi\"' $f.html) redirect=$(grep -c 'assets/redirect.js' $f.html)"; done
```
Expected: EN lines `redirect=1 lang.js=1`; VI lines `vi=1 redirect=1`.

- [ ] **Step 5: Manual cross-browser detection matrix**

Serve locally (`python3 -m http.server 8080`). In a browser, clearing `localStorage['repto-lang']` between cases:
1. Browser language English, non-VN timezone → `/` stays English.
2. Browser language Vietnamese → `/` redirects to `/index-vi.html`.
3. DevTools → Sensors → set timezone to `Asia/Ho_Chi_Minh`, browser language English → `/` redirects to VI.
4. Choose English from the dropdown on a VI page → goes to EN and `localStorage` is `'en'`; reload `/` → stays EN (stored choice beats detection).
5. `?lang=vi` and `?lang=en` force + persist correctly.
6. Disable JavaScript → no redirect; the `<noscript>` link in the header still switches language.
7. Repeat dropdown open/close (click, Esc, outside-click) on one legal page.

- [ ] **Step 6: Commit**

```bash
git add sitemap.xml
git commit -m "feat(i18n): add multilingual sitemap.xml with hreflang alternates"
```

---

## Self-review notes (author)

- **Spec coverage:** detection (redirect script, Tasks 2-5) ✓; separate-file architecture + URL convention (all tasks) ✓; hreflang + canonical (Tasks 2-6) ✓; dropdown (Task 1 + wired in 2-5) ✓; no-JS fallback (`<noscript>` per page) ✓; translation sourcing incl. git seed for legal (Tasks 3-5) ✓; SEO extras og:locale + sitemap (Tasks 2-6) ✓; testing matrix (Task 6) ✓.
- **Mock-UI rule:** Global Constraints fix the "keep `.phone`/`.watch`/`.liveact` English" decision so the landing translation is unambiguous.
- **Reciprocity:** Task 6 Step 3 mechanically verifies the hreflang pairing that is easy to get wrong by hand.
