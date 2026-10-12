/* ============================================================
   Repto — campaign link attribution.
   reptofit.com/go/<slug> logs the click, stores it in the
   repto_click cookie (<click id>.<slug>[.<provider token>]) and
   lands here. This tags the store buttons with it — ct/pt for the
   App Store, click_id in the Play referrer (exact Android match) —
   and reports screen + timezone, which iOS install matching needs.
   ============================================================ */
(function () {
  try {
    var m = document.cookie.match(/(?:^|; )repto_click=([0-9a-f-]{36})\.([a-z0-9-]{1,64})(?:\.(\d+))?(?:;|$)/);
    if (!m) return;
    var click = m[1], slug = m[2], pt = m[3];
    document.querySelectorAll('a[href*="apps.apple.com/"]').forEach(function (a) {
      var u = new URL(a.href);
      u.searchParams.set('ct', slug);
      u.searchParams.set('mt', '8');
      if (pt) u.searchParams.set('pt', pt);
      a.href = u.toString();
    });
    document.querySelectorAll('a[href*="play.google.com/store/apps/details"]').forEach(function (a) {
      var u = new URL(a.href);
      u.searchParams.set('referrer', 'click_id=' + click + '&utm_campaign=' + slug);
      a.href = u.toString();
    });
    var sent = 'repto_b_' + click;
    if (sessionStorage.getItem(sent)) return;
    sessionStorage.setItem(sent, '1');
    navigator.sendBeacon('/go/_b?c=' + click, JSON.stringify({
      screen: screen.width + 'x' + screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    }));
  } catch (e) {}
})();
