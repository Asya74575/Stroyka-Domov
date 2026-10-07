// «Вопросы»: <details> — открыт один вопрос; открытие и закрытие плавно по высоте за 0,6 с.
// Без JS работают обычные <details>, открыт первый вопрос.
(function () {
  var list = document.querySelector('[data-faq]');
  if (!list) return;
  var items = Array.prototype.slice.call(list.querySelectorAll('details'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = getComputedStyle(document.documentElement).getPropertyValue('--ease').trim() || 'ease';   // общая кривая tokens.css (L64)
  var GAP = getComputedStyle(document.documentElement).getPropertyValue('--faq-gap') || '-10px';

  function run(body, frames, done) {
    if (reduce || !body.animate) { if (done) done(); return; }
    if (body._anim) body._anim.cancel();
    var anim = body.animate(frames, { duration: 600, easing: EASE, fill: 'forwards' });
    body._anim = anim;
    anim.onfinish = function () { body._anim = null; if (done) done(); anim.cancel(); };
  }
  function open(item) {
    var body = item.querySelector('.faq-item__a');
    item.classList.remove('is-closing');
    item.open = true;
    var h = body.scrollHeight;
    run(body, [{ height: '0px', marginTop: '0px', opacity: 0 }, { height: h + 'px', marginTop: GAP.trim(), opacity: 1 }]);
  }
  function close(item) {
    var body = item.querySelector('.faq-item__a');
    item.classList.add('is-closing');
    var h = body.offsetHeight;
    run(body, [{ height: h + 'px', marginTop: GAP.trim(), opacity: 1 }, { height: '0px', marginTop: '0px', opacity: 0 }], function () {
      item.open = false;
      item.classList.remove('is-closing');
    });
  }
  items.forEach(function (item) {
    item.querySelector('summary').addEventListener('click', function (event) {
      event.preventDefault();
      if (item.open && !item.classList.contains('is-closing')) { close(item); return; }
      items.forEach(function (other) { if (other !== item && other.open && !other.classList.contains('is-closing')) close(other); });
      open(item);
    });
  });
})();
