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
