/* ============================================================
   Repto Landing v2 — vanilla behaviors (no framework)
   1. mobile nav menu
   2. live mock timers (session, rest countdown, watch)
   3. pricing period toggle
   4. stat count-up
   5. scroll reveal
   6. star ratings
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function setText(sel, t) { $$(sel).forEach(function (el) { if (el.textContent !== t) el.textContent = t; }); }

  /* ---------- 1 · mobile nav ---------- */
  var nav = document.getElementById('nav');
  var burger = document.querySelector('[data-burger]');
  if (nav && burger) {
    var setOpen = function (open) { nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    burger.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    $$('[data-menu] a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  }

  /* ---------- 2 · live mock timers ---------- */
  var REST_TOTAL = 90, rest = 72, el = 1458, session = 5;
  function renderTimers() {
    setText('[data-session]', Math.floor(session / 60) + ':' + pad2(session % 60));
    setText('[data-rest]', pad2(Math.floor(rest / 60)) + ':' + pad2(rest % 60));
    $$('[data-rest-bar]').forEach(function (b) { b.style.width = ((1 - rest / REST_TOTAL) * 100).toFixed(1) + '%'; });
    setText('[data-w-stop]', pad2(Math.floor(el / 60)) + ':' + pad2(el % 60));
    var warn = rest <= 3, col = warn ? 'rgb(245,158,11)' : 'rgb(166,255,0)';
    $$('[data-w-rest]').forEach(function (n) { n.textContent = Math.floor(rest / 60) + ':' + pad2(rest % 60); n.style.color = col; });
    $$('[data-w-ring]').forEach(function (r) { r.setAttribute('stroke-dashoffset', ((1 - rest / REST_TOTAL) * 311).toFixed(1)); r.setAttribute('stroke', col); });
    setText('[data-w-bpm]', String(140 + (rest % 5)));
  }
  renderTimers();
  if (!reduceMotion) {
    setInterval(function () {
      rest = rest <= 1 ? REST_TOTAL : rest - 1;
      el += 1; session += 1;
      renderTimers();
    }, 1000);
  }

  /* ---------- 3 · pricing toggle ---------- */
  var periods = $$('[data-period]');
  periods.forEach(function (btn) {
    btn.addEventListener('click', function () {
      periods.forEach(function (b) { b.classList.toggle('on', b === btn); });
      setText('[data-pro-price]', btn.getAttribute('data-price'));
      setText('[data-pro-unit]', btn.getAttribute('data-unit'));
      setText('[data-pro-badge]', btn.getAttribute('data-badge'));
    });
  });

  /* ---------- 3a · chart reveal: bars grow bottom→top, progress bars left→right,
     lines/rings draw start→end. Runs when the chart scrolls into view; charts
     inside a tab panel replay each time that tab becomes active. ---------- */
  var animCharts = !reduceMotion && 'IntersectionObserver' in window;
  var CHARTS = '.bars, .bar, .lc, .ring-svg';
  var inHiddenPanel = function (c) { var p = c.closest('[data-tab-panel]'); return p && !p.classList.contains('is-on'); };
  var replayCharts = function () {};
  if (animCharts) {
    document.documentElement.classList.add('js-charts');
    var charts = $$(CHARTS);
    charts.forEach(function (c) {
      if (c.classList.contains('bars')) Array.prototype.forEach.call(c.children, function (b, i) { b.style.setProperty('--i', i); });
    });
    var chartIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target._seen = en.isIntersecting;
        if (en.isIntersecting && !inHiddenPanel(en.target)) en.target.classList.add('chart-in');
      });
    }, { threshold: 0.35 });
    charts.forEach(function (c) { chartIO.observe(c); });
    replayCharts = function (panel) {
      Array.prototype.forEach.call(panel.querySelectorAll(CHARTS), function (c) {
        c.classList.remove('chart-in');
        void c.offsetWidth; // restart the transition/animation
        if (c._seen) c.classList.add('chart-in');
      });
    };
  }

  /* ---------- 3b · analytics tabs: auto-cycle every 2s while on screen, pause on hover, click to pick ---------- */
  var tabBar = document.querySelector('[data-tabs]');
  if (tabBar) {
    var tabs = Array.prototype.slice.call(tabBar.querySelectorAll('[data-tab]'));
    var panels = $$('[data-tab-panel]');
    var tabWrap = tabBar.parentElement, cur = 0, paused = false, onScreen = true;
    var showTab = function (i) {
      cur = i;
      tabs.forEach(function (t, k) { t.classList.toggle('on', k === i); });
      panels.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
      replayCharts(panels[i]);
    };
    tabs.forEach(function (t, i) { t.style.cursor = 'pointer'; t.addEventListener('click', function () { showTab(i); }); });
    tabWrap.addEventListener('mouseenter', function () { paused = true; });
    tabWrap.addEventListener('mouseleave', function () { paused = false; });
    if ('IntersectionObserver' in window) {
      onScreen = false;
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; }, { threshold: 0.3 }).observe(tabWrap);
    }
    if (!reduceMotion) setInterval(function () { if (!paused && onScreen) showTab((cur + 1) % tabs.length); }, 2000);
  }

  var canObserve = 'IntersectionObserver' in window && !reduceMotion;

  /* ---------- 4 · count-up ---------- */
  var counters = $$('[data-count-to]');
  if (canObserve && counters.length) {
    var finalText = function (c) { return c.getAttribute('data-count-to') + (c.getAttribute('data-count-suffix') || ''); };
    var runCount = function (c) {
      var to = +c.getAttribute('data-count-to'), t0 = performance.now(), dur = 1600;
      var step = function (now) {
        var p = Math.min(1, (now - t0) / dur);
        c.textContent = p === 1 ? finalText(c) : String(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    counters.forEach(function (c) { c.textContent = '0'; });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
    window.addEventListener('beforeprint', function () { counters.forEach(function (c) { c.textContent = finalText(c); }); });
  }

  /* ---------- 5 · scroll reveal (only elements starting below the fold) ---------- */
  if (canObserve) {
    var targets = $$('main section > div > *, main section > .copy > *, main section > span').filter(function (t) {
      var cs = getComputedStyle(t);
      return cs.position !== 'absolute' && t.getBoundingClientRect().top >= window.innerHeight;
    });
    targets.forEach(function (t) {
      var i = Math.min(Array.prototype.indexOf.call(t.parentElement.children, t), 5);
      t.classList.add('rv');
      t.style.transitionDelay = (i * 80) + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        t.classList.add('in'); io.unobserve(t);
        // drop the stagger delay once revealed so hover effects respond instantly
        setTimeout(function () { t.style.transitionDelay = ''; }, 1300);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (t) { io.observe(t); });
    window.addEventListener('beforeprint', function () { targets.forEach(function (t) { t.classList.add('in'); }); });
  }

  /* ---------- 6 · star ratings ---------- */
  var STAR_PATH = 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z';
  $$('.stars[data-stars]').forEach(function (s, idx) {
    var val = parseFloat(s.getAttribute('data-stars')) || 0;
    var full = Math.floor(val), html = '';
    for (var i = 0; i < full; i++) html += '<svg viewBox="0 0 24 24"><path d="' + STAR_PATH + '" fill="var(--lime)"/></svg>';
    if (val - full > 0) {
      var gid = 'rs-half-' + idx;
      html += '<svg viewBox="0 0 24 24"><defs><linearGradient id="' + gid + '"><stop offset="50%" stop-color="var(--lime)"/><stop offset="50%" stop-color="var(--surface-bright)"/></linearGradient></defs><path d="' + STAR_PATH + '" fill="url(#' + gid + ')"/></svg>';
    }
    s.innerHTML = html;
  });
})();
