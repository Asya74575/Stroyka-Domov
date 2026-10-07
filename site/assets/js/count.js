// Отсчёт цифр от 0 до значения за 1,2 с, когда цифра появляется в окне (один раз).
// data-count — значение; data-plural="год|года|лет" — единица со склонением; data-suffix — хвост («+»).
// Без JS и при prefers-reduced-motion в разметке сразу конечное значение.
(function () {
  var items = document.querySelectorAll('[data-count]');
  if (!items.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var DURATION = 1200;
  function plural(n, forms) {
    var f = forms.split('|');
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return f[2];
    if (b > 1 && b < 5) return f[1];
    if (b === 1) return f[0];
    return f[2];
  }
  function text(el, value) {
    var out = String(value);
    if (el.dataset.plural) out += '\u00A0' + plural(value, el.dataset.plural);
    if (el.dataset.suffix) out += el.dataset.suffix;
    return out;
  }
  function run(el) {
    var target = Number(el.dataset.count) || 0;
    var start = null;
    el.textContent = text(el, 0);
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / DURATION);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = text(el, Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      run(entry.target);
    });
  });
  items.forEach(function (el) { observer.observe(el); });
})();
