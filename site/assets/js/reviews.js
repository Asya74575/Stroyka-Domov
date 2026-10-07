// «Отзывы» на 599 и уже — слайдер (правка 2026-10-07, L63): карточки листаются пальцем с прилипанием, счётчик «1 / 3»,
// стрелки «назад / вперёд» (на краях неактивны). Карточки вне экрана сбоку проявляются вместе с первой — иначе
// IntersectionObserver не увидит их внутри ленты. Шире 600 и без JS — обычный список.
(function () {
  var list = document.querySelector('[data-reviews]');
  var nav = document.querySelector('[data-reviews-nav]');
  if (!list || !nav) return;
  var items = Array.prototype.slice.call(list.children);
  var current = nav.querySelector('[data-reviews-current]');
  var prev = nav.querySelector('[data-reviews-step="-1"]');
  var next = nav.querySelector('[data-reviews-step="1"]');
  var phone = window.matchMedia('(max-width: 599.98px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function index() {
    var left = list.scrollLeft, best = 0, dist = Infinity;
    items.forEach(function (item, i) {
      var d = Math.abs(item.offsetLeft - items[0].offsetLeft - left);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }
  function update() {
    if (!phone.matches) return;
    var i = index();
    current.textContent = String(i + 1);
    prev.disabled = i === 0;
    next.disabled = i === items.length - 1;
  }
  function go(step) {
    var i = Math.max(0, Math.min(items.length - 1, index() + step));
    list.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  }
  prev.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });
  list.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  if (phone.addEventListener) phone.addEventListener('change', update);
  update();

  // Проявление карточек: на телефоне — все вместе, когда лента появилась в окне (motion.js отслеживает каждую отдельно)
  if (document.documentElement.classList.contains('js-reveal') && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || !phone.matches) return;
      items.forEach(function (item) { item.classList.add('is-visible'); });
      io.disconnect();
    }, { threshold: 0.2 });
    io.observe(list);
  }
})();
