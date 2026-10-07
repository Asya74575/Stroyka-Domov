// «Этапы»: шкала из 6 шагов — role="tablist", стрелки ←/→, Home, End. По умолчанию выбран шаг 01 (правка 2026-10-06, L47).
// Оранжевая линия дотягивается до выбранного шага за 0,8 с, описание и фото меняются затуханием (page.css).
// Точки шкалы по очереди пульсируют, пока блок в окне (правка 2026-10-06).
// На телефоне шкала листается пальцем, выбранный шаг — по центру. Без JS — 6 шагов подряд.
(function () {
  var root = document.querySelector('[data-stages]');
  if (!root) return;
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
  var progress = root.querySelector('.stages__progress');
  var scroller = root.querySelector('.stages__scroller');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wrap = root.querySelector('.stages__panels');
  wrap.classList.add('tab-panels');
  panels.forEach(function (panel) { panel.classList.add('tab-panel'); });

  function center(tab, smooth) {
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 1) return;
    var left = tab.offsetLeft + tab.offsetWidth / 2 - scroller.clientWidth / 2;
    scroller.scrollTo({ left: left, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }

  // 767 и уже панель по высоте выбранного шага (page.css, правка 2026-10-07, L60): при смене шага высота меняется плавно
  var autoHeight = window.matchMedia('(max-width: 767.98px)');
  function resize(change, animate) {
    if (!animate || reduce || !autoHeight.matches) { change(); return; }
    var from = wrap.offsetHeight;
    wrap.style.height = '';
    change();
    var to = wrap.offsetHeight;
    if (Math.abs(from - to) < 1) return;
    wrap.style.height = from + 'px';
    void wrap.offsetHeight;
    wrap.style.transition = 'height 0.6s var(--ease)';
    wrap.style.height = to + 'px';
    clearTimeout(resize.timer);
    resize.timer = setTimeout(function () { wrap.style.height = ''; wrap.style.transition = ''; }, 650);
  }

  function select(index, focus, smooth) {
    resize(function () { apply(index); }, smooth);
    progress.style.setProperty('--progress', String(index / (tabs.length - 1)));
    if (focus) tabs[index].focus({ preventScroll: true });
    center(tabs[index], smooth);
  }

  function apply(index) {
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      tab.classList.toggle('is-done', i < index);
      tab.classList.toggle('is-current', on);
      tab.classList.toggle('is-next', i > index);
      panels[i].classList.toggle('is-hidden', !on);
      if (on) panels[i].removeAttribute('inert'); else panels[i].setAttribute('inert', '');
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { root.classList.add('is-scrolled'); select(i, false, true); });
    tab.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight') next = Math.min(tabs.length - 1, i + 1);
      else if (event.key === 'ArrowLeft') next = Math.max(0, i - 1);
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      select(next, true, true);
    });
  });
  // Пульс точек шкалы (page.css): идёт, только пока шкала в окне, — вне экрана на паузе
  if (!reduce) {
    root.classList.add('is-live');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        root.classList.toggle('is-paused', !entries[0].isIntersecting);
      }).observe(root);
    }
  }
  // Шкала листается (уже 768): подсказка «листайте», затухание краёв, где есть продолжение, и один «кивок» шкалы,
  // когда она впервые появляется в окне (правка 2026-10-07, L61)
  if (scroller) {
    var edges = function () {
      var can = scroller.scrollWidth > scroller.clientWidth + 1;
      root.classList.toggle('is-scrollable', can);
      root.classList.toggle('is-at-start', scroller.scrollLeft <= 1);
      root.classList.toggle('is-at-end', scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1);
    };
    var touched = function () { root.classList.add('is-scrolled'); };
    scroller.addEventListener('scroll', edges, { passive: true });
    scroller.addEventListener('pointerdown', touched, { passive: true });
    scroller.addEventListener('touchstart', touched, { passive: true });
    scroller.addEventListener('wheel', touched, { passive: true });
    window.addEventListener('resize', edges);
    edges();
    if (!reduce && 'IntersectionObserver' in window) {
      var peek = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting || !root.classList.contains('is-scrollable')) return;
        peek.disconnect();
        if (scroller.scrollLeft > 1) return;
        setTimeout(function () {
          scroller.style.scrollSnapType = 'none';   // иначе прилипание к шагу не даст сдвинуть шкалу на «кивок»
          scroller.scrollTo({ left: 56, behavior: 'smooth' });
          setTimeout(function () {
            if (!root.classList.contains('is-scrolled')) scroller.scrollTo({ left: 0, behavior: 'smooth' });
            setTimeout(function () { scroller.style.scrollSnapType = ''; }, 700);
          }, 700);
        }, 600);
      }, { threshold: 0.6 });
      peek.observe(scroller);
    }
  }
  var initial = 0;
  tabs.forEach(function (tab, i) { if (tab.getAttribute('aria-selected') === 'true') initial = i; });
  select(initial, false, false);
  window.addEventListener('resize', function () {
    var i = tabs.findIndex(function (tab) { return tab.getAttribute('aria-selected') === 'true'; });
    if (i >= 0) center(tabs[i], false);
  });
})();
