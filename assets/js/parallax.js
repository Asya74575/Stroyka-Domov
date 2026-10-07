// Параллакс (рецепт parallax): фото отстаёт от прокрутки и мягко её догоняет (инерция 0,14 с); кадры считаются,
// только пока фото догоняет, постоянного цикла нет. Переход по якорю — сразу, без «доезда».
// [data-parallax="photo"] — фото заявки: картинка выше рамки на 30 % и сдвигается на ±15 % высоты рамки.
// [data-parallax="hero"] — снимок первого экрана (только десктоп): при загрузке кадр как в макете, при прокрутке
// снимок вместе с точками и выносками уходит вниз в пределах запаса над кадром (на планшете и телефоне запаса нет).
// Без JS и при reduced motion — обычные фото. Стили — page.css.
(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (!frames.length) return;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desk = window.matchMedia('(min-width: 1024px)');
  var DEPTH = 0.15, LAG = 140;
  var state = frames.map(function (el) {
    return { el: el, hero: el.getAttribute('data-parallax') === 'hero', canvas: el.querySelector('.hero__canvas'), cur: null, target: 0, h: 1 };
  });
  var raf = 0, last = 0;

  function measure() {
    var vh = window.innerHeight;
    state.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      s.h = r.height;
      if (s.hero) {
        if (!desk.matches || !s.canvas) { s.target = 0; return; }
        // запас снимка над кадром (холст сдвинут вверх, page.css); снимок уходит вниз, пока кадр поднимается к шапке,
        // и плавно останавливается (кривая с нулевой скоростью в конце — без рывка)
        var spare = Math.max(0, -s.canvas.offsetTop);
        var start = r.top + window.scrollY;
        var t = Math.min(1, Math.max(0, window.scrollY / Math.max(1, start + r.height * 0.5)));
        s.target = spare * (1 - (1 - t) * (1 - t));
      } else {
        var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));   // 0 — рамка под экраном, 1 — над ним
        s.target = (p - 0.5) * 2 * DEPTH * r.height;
      }
    });
  }
  function frame(ts) {
    raf = 0;
    var dt = last ? Math.min(64, ts - last) : 16, busy = false;
    last = ts;
    state.forEach(function (s) {
      var d = s.target - (s.cur === null ? s.target : s.cur);
      if (s.cur === null || Math.abs(d) > s.h * 0.12) s.cur = s.target;   // скачок (переход по якорю) — сразу
      else if (Math.abs(d) > 0.3) { s.cur += d * (1 - Math.exp(-dt / LAG)); busy = true; }
      else s.cur = s.target;
      s.el.style.setProperty('--shift', s.cur.toFixed(1) + 'px');
    });
    if (busy) raf = requestAnimationFrame(frame); else last = 0;
  }
  function request() {
    var on = !reduce.matches;
    root.classList.toggle('js-parallax', on);
    if (!on) { state.forEach(function (s) { s.cur = null; s.el.style.removeProperty('--shift'); }); return; }
    measure();
    if (!raf) raf = requestAnimationFrame(frame);
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  if (reduce.addEventListener) reduce.addEventListener('change', request);
  request();
})();
