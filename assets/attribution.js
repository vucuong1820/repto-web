/* ============================================================
   Repto — count home page visits and attribute the installs they lead to.
   Every visit (one per tab) is reported to /go/_v and logged as a click on
   the "Website" campaign (organic-web) in the analytics dashboard — so old
   posts that link plain reptofit.com are counted too. The answer is the
   store link carrying that click (App Store ct/pt, Play install referrer);
   on phones the store buttons switch to it. Until it arrives (or if it never
   does) phone buttons go through /go/organic-web, which logs and redirects.
   Desktop buttons are left alone: /go would send a desktop back here.
   Browsers cache /assets for 4 h: bump ?v= on this script's <script> tag
   in index.html and vi/index.html whenever this file changes.
   ============================================================ */
(function () {
  try {
    var ua = navigator.userAgent;
    var ios = /iPhone|iPod/i.test(ua), android = /Android/i.test(ua);
    var KEY = 'repto_visit';
    var buttons = function () {
      return document.querySelectorAll('a[href*="apps.apple.com/"], a[href*="play.google.com/store/apps/details"], a[href="/go/organic-web"]');
    };
    var tag = function (targets) {
      var target = targets && (ios ? targets.ios : android ? targets.android : null);
      if (target) buttons().forEach(function (a) { a.href = target; });
    };
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
    if (saved) return tag(saved);
    if (ios || android) buttons().forEach(function (a) { a.href = '/go/organic-web'; });
    fetch('/go/_v', {
      method: 'POST', keepalive: true, credentials: 'omit',
      body: JSON.stringify({
        screen: screen.width + 'x' + screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (targets) {
      if (!targets) return;
      try { sessionStorage.setItem(KEY, JSON.stringify(targets)); } catch (e) {}
      tag(targets);
    }).catch(function () {});
  } catch (e) {}
})();
