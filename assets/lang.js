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
