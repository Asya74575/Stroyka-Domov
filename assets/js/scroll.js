// Плавный переход по якорям внутри страницы (правка владельца 2026-10-07, L64): «Получить точную смету», «Написать
// в Telegram», мессенджеры, «изменить» / «Вернуться к заявке», меню, логотип. Вместо мгновенного скачка страница
// доезжает до блока с разгоном и торможением; длительность растёт с расстоянием (0,9–1,6 с), цель пересчитывается
// каждый кадр — если над блоком что-то поменяло высоту, страница всё равно встанет ровно под шапкой (scroll-padding-top).
// Колесо, касание или клавиши прокрутки останавливают переход — страница не «борется» с посетителем.
// По прибытии на блоке событие anchor:arrive (form.js подсвечивает плашку расчёта уже на месте).
// Ссылку #raschet обслуживает sheet.js (окно заявки). При reduced motion и без JS — обычный переход по якорю.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var raf = 0, onDone = null;

  // мягкий разгон и торможение, без резкого старта (quint in-out сглажен до cubic на краях)
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function offset() { return parseFloat(getComputedStyle(root).scrollPaddingTop) || 0; }
  function targetY(el) {
    var max = root.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(max, el.getBoundingClientRect().top + window.scrollY - offset()));
  }
  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    onDone = null;
  }
  function arrive(el) { el.dispatchEvent(new CustomEvent('anchor:arrive', { bubbles: true })); }

  function scrollToEl(el) {
    stop();
    var from = window.scrollY;
    var dist = Math.abs(targetY(el) - from);
    if (reduce.matches || dist < 2) { window.scrollTo(0, targetY(el)); arrive(el); return; }
    var duration = Math.min(1600, 900 + Math.sqrt(dist) * 7);
    var start = null;
    onDone = function () { arrive(el); };
    function step(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var to = targetY(el);
      window.scrollTo(0, from + (to - from) * ease(t));
      if (t < 1) { raf = requestAnimationFrame(step); return; }
      raf = 0;
      var done = onDone; onDone = null;
      if (done) done();
    }
    raf = requestAnimationFrame(step);
  }
  window.kedrScrollTo = scrollToEl;

  ['wheel', 'touchstart'].forEach(function (type) { window.addEventListener(type, stop, { passive: true }); });
  window.addEventListener('keydown', function (event) {
    if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(event.key)) stop();
  });

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest('a[href*="#"]');
    if (!link || link.target) return;
    var url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    var id = decodeURIComponent(url.hash.slice(1));
    if (!id || id === 'raschet') return;
    var el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    scrollToEl(el);
  });
})();
