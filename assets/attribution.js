/* ============================================================
   Repto — attribute installs that start on this site.
   On phones the store buttons go through reptofit.com/go/organic-web
   (the "Website" campaign in the analytics dashboard): the click is
   logged, then the phone is sent to its own store — so these installs
   show up as "Website" instead of anonymous organic.
   Only iPhone/Android UAs are rewritten: /go sends anything else back
   here, which would loop (iPadOS reports itself as a Mac).
   ============================================================ */
(function () {
  try {
    if (!/iPhone|iPod|Android/i.test(navigator.userAgent)) return;
    document.querySelectorAll('a[href*="apps.apple.com/"], a[href*="play.google.com/store/apps/details"]').forEach(function (a) {
      a.href = '/go/organic-web';
    });
  } catch (e) {}
})();
