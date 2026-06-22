/* ============================================================
   Repto — first-visit language auto-detect + redirect (shared).
   Loaded as a BLOCKING <script src> in <head>, AFTER the hreflang
   <link> tags, so it runs before paint and can read them.
   Precedence: ?lang= -> URL path (/vi/*) -> localStorage -> navigator
   languages (vi) -> timezone (Asia/Ho_Chi_Minh) -> default en.
   Uses location.replace() so the Back button never loops.
   ============================================================ */
(function () {
  try {
    var cur = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();

    // ?lang= query param: highest priority, always saves
    var q = (location.search.match(/[?&]lang=(en|vi)/) || [])[1];
    if (q) { try { localStorage.setItem('repto-lang', q); } catch (e) {} }

    var want = q;

    if (!want) {
      // URL path /vi or /vi/* is an explicit VI signal — treat it as the intent
      // and save it so subsequent navigation stays in VI.
      if (/^\/vi(\/|$)/.test(location.pathname)) {
        want = 'vi';
        try { localStorage.setItem('repto-lang', 'vi'); } catch (e) {}
      } else {
        var saved = null;
        try { saved = localStorage.getItem('repto-lang'); } catch (e) {}
        want = saved;
        if (!want) {
          var langs = navigator.languages || [navigator.language || ''];
          var prefersVi = langs.some(function (l) { return /^vi\b/i.test(l); });
          var tz = '';
          try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
          want = (prefersVi || /Ho_Chi_Minh|Saigon/i.test(tz)) ? 'vi' : 'en';
        }
      }
    }

    if (want !== cur) {
      var node = document.querySelector('link[rel="alternate"][hreflang="' + want + '"]');
      var href = node && node.getAttribute('href');
      if (href) {
        // hreflang URLs are absolute (required for SEO); navigate on the
        // CURRENT origin so this works on localhost/preview too, not just prod.
        var dest = new URL(href, location.href);
        location.replace(dest.pathname + dest.search + dest.hash);
      }
    }
  } catch (e) {}
})();
