// «Проекты» на десктопе — наложение карточек в категориях по референсу (svar-stol.ru, блок «Точная технология
// изготовления на каждом этапе»): строка вкладок «Сканди · Барнхаус · Классика» закреплена под шапкой, карточки
// прилипают под ней, следующая выезжает снизу и накрывает предыдущую целиком, последняя уезжает вверх вместе
// со строкой вкладок. Само движение — position: sticky (page.css); скрипт включает режим (класс stack-on) и считает:
//   --card-top у карточки — где она прилипает: под вкладками, а если карточка не помещается в окно, — выше,
//   так, чтобы низ с ценой и кнопками был виден до того, как её накроет следующая;
//   --stack-trim у блока — на сколько раньше закончить блок для вкладок, чтобы они отпускались ровно тогда,
//   когда последняя карточка дошла до них (высоту страницы это не меняет).
// Пересчёт — при загрузке, смене размера окна, шрифтов и вкладки. Уже 980 px, на телефоне, без JS
// и при reduced motion — обычный список карточек.
(function () {
  var stack = document.querySelector('.projects__stack');
  if (!stack) return;
  var head = stack.querySelector(':scope > .tabs-row');
  var wrap = stack.querySelector('[data-panels="proekty"]');
  var header = document.querySelector('[data-include="header"]');
  var root = document.documentElement;
  var desk = window.matchMedia('(min-width: 980px)');   // как в page.css: десктоп и широкий планшет (L54)
  var wide = window.matchMedia('(min-width: 1024px)');   // десктоп — наложение всегда (карточка, если не помещается, прилипает выше)
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var panels = Array.prototype.slice.call(wrap.querySelectorAll(':scope > .tab-panel'));
  var cards = Array.prototype.slice.call(wrap.querySelectorAll(':scope > .tab-panel > .project'));
  var frame = 0;

  function activePanel() {
    return panels.filter(function (p) { return !p.classList.contains('is-hidden'); })[0] || panels[0];
  }
  function clear() {
    stack.style.removeProperty('--stack-trim');
    cards.forEach(function (card) { card.style.removeProperty('--card-top'); });
  }
  function update() {
    frame = 0;
    var line = (header ? header.offsetHeight : 0) + head.offsetHeight;   // низ закреплённой строки вкладок
    var vh = window.innerHeight;
    var on = desk.matches && !reduce.matches;
    // широкий планшет 980–1023: наложение, только если карточки вкладки помещаются под строкой вкладок — иначе карточка
    // уезжает под неё и останавливается обрезанной, при прокрутке это выглядит как дёрганье (L55); тогда — обычный список
    if (on && !wide.matches) {
      on = Array.prototype.every.call(activePanel().querySelectorAll(':scope > .project'), function (card) { return card.offsetHeight <= vh - line; });
    }
    root.classList.toggle('stack-on', on);
    if (!on) { clear(); return; }
    cards.forEach(function (card) {
      card.style.setProperty('--card-top', Math.min(line, vh - card.offsetHeight) + 'px');
    });
    var panel = activePanel();
    var list = panel.querySelectorAll(':scope > .project');
    var last = list[list.length - 1];
    // конец блока для строки вкладок = верх последней карточки; панели вкладок разной высоты стоят в одной ячейке сетки
    var trim = wrap.offsetHeight - panel.offsetHeight + (last ? last.offsetHeight : 0);
    stack.style.setProperty('--stack-trim', Math.max(0, trim) + 'px');
  }
  function request() { if (!frame) frame = requestAnimationFrame(update); }

  window.addEventListener('resize', request);
  document.addEventListener('tabs:change', request);
  if (desk.addEventListener) { desk.addEventListener('change', request); wide.addEventListener('change', request); reduce.addEventListener('change', request); }
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(request); ro.observe(head); ro.observe(wrap); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(request);
  update();
})();
