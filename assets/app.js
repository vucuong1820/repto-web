/* ============================================================
   Repto Landing — vanilla behaviors (no framework)
   1. sticky nav background on scroll
   2. scroll-reveal (IntersectionObserver)
   3. live status-bar clock (device local time, 12h)
   4. Active Workout phone: count-up elapsed + rest ring countdown
   5. Watch mock: count-up + live BPM/calories
   6. Programs phone: parallax list translate driven by page scroll
   7. star ratings
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(s) { return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); }

  /* ---------- 1 · sticky nav ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onNavScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 24); };
    onNavScroll();
    window.addEventListener('scroll', onNavScroll, { passive: true });
  }

  /* ---------- 2 · scroll reveal ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showReveal(el) {
    var d = parseInt(el.getAttribute('data-delay') || '0', 10);
    el.style.transitionDelay = d + 'ms';
    el.classList.add('in');
  }
  if (reduceMotion) {
    reveals.forEach(showReveal);
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { showReveal(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    reveals.forEach(function (el) { io.observe(el); });
    // Failsafe: guarantee everything is visible shortly after load (mirrors the
    // original Reveal component's 1.6s safety timeout).
    setTimeout(function () {
      reveals.forEach(function (el) { if (!el.classList.contains('in')) showReveal(el); });
    }, 1800);
  } else {
    reveals.forEach(showReveal);
  }

  /* ---------- 3 · live clock ---------- */
  var clocks = document.querySelectorAll('[data-clock]');
  function clockStr() {
    var d = new Date(), h = d.getHours() % 12;
    if (h === 0) h = 12;
    return h + ':' + pad2(d.getMinutes());
  }
  function tickClock() {
    var t = clockStr();
    for (var i = 0; i < clocks.length; i++) { if (clocks[i].textContent !== t) clocks[i].textContent = t; }
  }
  if (clocks.length) { tickClock(); setInterval(tickClock, 1000); }

  /* ---------- 4 · Active Workout phone ---------- */
  var aw = document.querySelector('.aw');
  if (aw) {
    var elapsedEl = aw.querySelector('[data-elapsed]');
    var restNum = aw.querySelector('[data-rest-num]');
    var restRing = aw.querySelector('[data-rest-ring]');
    var restLabel = aw.querySelector('[data-rest-label]');
    var elapsed = 1458, rest = 42;
    var REST_TOTAL = 90, CIRC = 2 * Math.PI * 46;
    var renderAw = function () {
      if (elapsedEl) elapsedEl.textContent = fmt(elapsed);
      var warn = rest <= 3;
      if (restNum) restNum.textContent = '0:' + pad2(rest);
      if (restLabel) restLabel.textContent = warn ? 'GO' : 'REST';
      aw.classList.toggle('is-warn', warn);
      if (restRing) restRing.style.strokeDashoffset = ((1 - rest / REST_TOTAL) * CIRC).toFixed(2);
    };
    renderAw();
    if (!reduceMotion) {
      setInterval(function () {
        elapsed += 1;
        rest = rest <= 1 ? REST_TOTAL : rest - 1;
        renderAw();
      }, 1000);
    }
  }

  /* ---------- 5 · Watch mock ---------- */
  var watchTime = document.querySelector('[data-watch-time]');
  if (watchTime) {
    var watchBpm = document.querySelector('[data-watch-bpm]');
    var watchCal = document.querySelector('[data-watch-cal]');
    var wt = 1458, bpm = 148, cal = 318;
    var renderWatch = function () {
      watchTime.textContent = fmt(wt);
      if (watchBpm) watchBpm.textContent = bpm;
      if (watchCal) watchCal.textContent = cal;
    };
    renderWatch();
    if (!reduceMotion) {
      setInterval(function () {
        wt += 1;
        bpm = 144 + Math.round(Math.random() * 10);
        cal += (Math.random() < 0.5 ? 1 : 0);
        renderWatch();
      }, 1000);
    }
  }

  /* ---------- 6 · Programs parallax ---------- */
  var prog = document.querySelector('[data-programs]');
  if (prog) {
    var wrap = prog.querySelector('[data-prog-wrap]');
    var list = prog.querySelector('[data-prog-list]');
    var track = prog.querySelector('[data-prog-track]');
    var thumb = prog.querySelector('[data-prog-thumb]');
    var updateProg = function () {
      var rect = prog.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var raw = (vh - rect.top) / (vh + rect.height);
      var p = Math.max(0, Math.min(1, raw));
      var overflow = Math.max(0, list.scrollHeight - wrap.clientHeight);
      list.style.transform = 'translateY(' + (-overflow * p) + 'px)';
      var th = overflow > 0 ? Math.max(0.28, wrap.clientHeight / list.scrollHeight) : 1;
      if (track) track.style.opacity = overflow > 0 ? '1' : '0';
      if (thumb) { thumb.style.height = (th * 100) + '%'; thumb.style.top = (p * (1 - th) * 100) + '%'; }
    };
    updateProg();
    window.addEventListener('scroll', updateProg, { passive: true });
    window.addEventListener('resize', updateProg);
  }

  /* ---------- 7 · star ratings ---------- */
  var STAR_PATH = 'M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z';
  Array.prototype.slice.call(document.querySelectorAll('.stars[data-stars]')).forEach(function (el, idx) {
    var val = parseFloat(el.getAttribute('data-stars')) || 0;
    var full = Math.floor(val), half = (val - full) >= 0.5, html = '';
    for (var i = 0; i < full; i++) {
      html += '<svg viewBox="0 0 24 24"><path d="' + STAR_PATH + '" fill="var(--lime)"/></svg>';
    }
    if (half) {
      var gid = 'rs-half-' + idx;
      html += '<svg viewBox="0 0 24 24"><defs><linearGradient id="' + gid + '">' +
        '<stop offset="50%" stop-color="var(--lime)"/><stop offset="50%" stop-color="rgba(175,169,174,.3)"/>' +
        '</linearGradient></defs><path d="' + STAR_PATH + '" fill="url(#' + gid + ')"/></svg>';
    }
    el.innerHTML = html;
  });
})();
