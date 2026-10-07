// Движение при прокрутке: появление блоков [data-reveal] (класс is-visible) и линии чертежа в блоках [data-draw]
// (класс is-drawn; у каждой линии .draw-t / .draw-b своя задержка --draw-d — сверху вниз, шаг 0,08 с).
// Срабатывает один раз на блок, после этого блок не отслеживается. Классы js-reveal и js-draw ставит скрипт в <head>
// (без IntersectionObserver и при reduced motion их нет — всё видно сразу). Стили и тайминги — page.css.
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('js-reveal') || !('IntersectionObserver' in window)) return;
  var STEP = 0.08;

  document.querySelectorAll('[data-draw]').forEach(function (group) {
    var lines = Array.prototype.slice.call(group.querySelectorAll('.draw-t, .draw-b'));
    if (group.matches('.draw-t, .draw-b')) lines.push(group);
    lines.map(function (el) {
      var r = el.getBoundingClientRect();
      return { el: el, y: el.classList.contains('draw-t') ? r.top : r.bottom };
    }).sort(function (a, b) { return a.y - b.y; }).forEach(function (line, i) {
      line.el.style.setProperty('--draw-d', (i * STEP).toFixed(2) + 's');
    });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      if (el.hasAttribute('data-reveal')) el.classList.add('is-visible');
      if (el.hasAttribute('data-draw')) el.classList.add('is-drawn');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  document.querySelectorAll('[data-reveal], [data-draw]').forEach(function (el) { io.observe(el); });
})();
