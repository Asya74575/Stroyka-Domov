// «Материалы»: точки на фото ↔ строки экспликации. Клик по точке или строке выбирает один слой во всех вкладках:
// точка становится оранжевой, строка раскрывается (открыта одна), подсказка меняет текст затуханием, выносная линия
// перестраивается за 0,4 с (от точки по горизонтали, затем вверх к подсказке). Если точка под подсказкой — подсказка
// переезжает в левый верхний угол. На телефоне подсказка — карточка под фото, линии нет.
// По умолчанию выбран слой 01 «Фундамент» (правка владельца 2026-10-07, L67); без JS — в каждой вкладке открыт слой 01 (разметка).
(function () {
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-cutaway]'));
  if (!panels.length) return;
  var current = 1;
  var NBSP = '\u00A0';

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var views = panels.map(function (panel) {
    var view = {
      panel: panel,
      frame: panel.querySelector('.cutaway__frame'),
      points: Array.prototype.slice.call(panel.querySelectorAll('.cutaway__point')),
      rows: Array.prototype.slice.call(panel.querySelectorAll('.layer')),
      tip: panel.querySelector('.cutaway__tip'),
      lineH: panel.querySelector('.cutaway__line--h'),
      lineV: panel.querySelector('.cutaway__line--v')
    };
    view.tipTitle = view.tip.querySelector('.cutaway__tip-title');
    view.tipText = view.tip.querySelector('.cutaway__tip-text');
    view.chips = view.tip.querySelector('.chips');
    return view;
  });

  function layerData(view, n) {
    var row = view.rows[n - 1];
    var body = row.querySelector('.layer__body');
    var tip = body.querySelector('.layer__tip');
    return {
      title: pad(n) + NBSP + '· ' + row.querySelector('.layer__name').textContent,
      text: (tip ? tip.querySelector('p') : body.querySelector('p')).textContent,
      chips: tip ? Array.prototype.map.call(tip.querySelectorAll('li'), function (li) { return li.textContent; }) : []
    };
  }

  function fillTip(view, n) {
    var data = layerData(view, n);
    view.tipTitle.textContent = data.title;
    view.tipText.textContent = data.text;
    view.chips.replaceChildren.apply(view.chips, data.chips.map(function (chip) {
      var li = document.createElement('li');
      li.className = 't-mono-s';
      li.textContent = chip;
      return li;
    }));
    view.chips.hidden = !data.chips.length;
  }

  function setLine(el, x, y, w, h) {
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
    el.style.width = Math.max(0, Math.round(w)) + 'px';
    el.style.height = Math.max(0, Math.round(h)) + 'px';
  }

  // Подсказка и выносная линия: координаты считаются от рамки фото
  function place(view) {
    var frame = view.frame.getBoundingClientRect();
    if (!frame.width) return;
    var tipStyle = getComputedStyle(view.tip);
    if (tipStyle.position === 'static') return;
    var point = view.points[current - 1];
    var pr = point.getBoundingClientRect();
    var px = pr.left + pr.width / 2 - frame.left;
    var py = pr.top + pr.height / 2 - frame.top;
    var inset = parseFloat(tipStyle.top) || 20;
    var w = view.tip.offsetWidth, h = view.tip.offsetHeight;
    var right = { x1: frame.width - inset - w, x2: frame.width - inset, y1: inset, y2: inset + h };
    var under = px > right.x1 - 24 && py < right.y2 + 24;
    view.tip.classList.toggle('is-left', under);
    var rect = under ? { x1: inset, x2: inset + w, y1: inset, y2: inset + h } : right;
    var cx = (rect.x1 + rect.x2) / 2;
    if (py > rect.y2) {
      setLine(view.lineH, Math.min(px, cx), py, Math.abs(cx - px) + 1, 1);
      setLine(view.lineV, cx, rect.y2, 1, py - rect.y2);
    } else {
      var edge = px < rect.x1 ? rect.x1 : rect.x2;
      setLine(view.lineH, Math.min(px, edge), py, Math.abs(edge - px), 1);
      setLine(view.lineV, edge, py, 1, 0);
    }
  }

  // Раскрытие строки — как у «Вопросов» (faq.js, L70): высота и проявление за 0,6 с по общей кривой --ease;
  // закрывающаяся строка сворачивается так же. Пока строки меняют высоту, подсказка и выносная линия
  // пересчитываются каждый кадр (на 1024–1199 фото тянется по высоте экспликации). При reduced motion — сразу.
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = getComputedStyle(document.documentElement).getPropertyValue('--ease').trim() || 'ease';
  var running = 0;
  function follow() {
    if (!running) return;
    views.forEach(place);
    requestAnimationFrame(follow);
  }
  function slide(body, open) {
    var from = body.hidden ? 0 : body.getBoundingClientRect().height;   // если строка ещё едет — с текущей высоты
    if (body._anim) { body._anim.cancel(); body._anim = null; }
    if (reduce || !body.animate) { body.hidden = !open; return; }
    body.hidden = false;
    var pb = getComputedStyle(body).paddingBottom;
    var to = open ? body.offsetHeight : 0;
    if (Math.abs(from - to) < 1) { body.hidden = !open; return; }
    var shut = { height: '0px', paddingBottom: '0px', opacity: 0 };
    var full = { height: (open ? to : from) + 'px', paddingBottom: pb, opacity: 1 };
    var startH = { height: from + 'px', paddingBottom: from ? pb : '0px', opacity: from ? 1 : 0 };
    var anim = body.animate([startH, open ? full : shut], { duration: 600, easing: EASE, fill: 'forwards' });
    body._anim = anim;
    if (!running++) requestAnimationFrame(follow);
    var end = function () { running--; };
    anim.oncancel = end;
    anim.onfinish = function () {
      end();
      body._anim = null;
      if (!open) body.hidden = true;
      anim.oncancel = null;
      anim.cancel();
      views.forEach(place);
    };
  }

  function render(view, animate, smooth) {
    view.points.forEach(function (point) {
      var on = Number(point.dataset.layer) === current;
      point.classList.toggle('is-active', on);
      point.setAttribute('aria-pressed', String(on));
    });
    view.rows.forEach(function (row, i) {
      var on = i + 1 === current;
      var btn = row.querySelector('.layer__btn');
      row.classList.toggle('is-open', on);
      btn.setAttribute('aria-expanded', String(on));
      var body = row.querySelector('.layer__body');
      if (smooth) slide(body, on); else body.hidden = !on;
    });
    if (animate) {
      view.tip.classList.add('is-fading');
      setTimeout(function () {
        fillTip(view, current);
        view.tip.classList.remove('is-fading');
        place(view);
      }, 200);
    } else {
      fillTip(view, current);
    }
    place(view);
  }

  function select(n, source) {
    if (n === current) return;
    current = n;
    views.forEach(function (view) { render(view, view === source, true); });
  }

  views.forEach(function (view) {
    view.points.forEach(function (point) {
      point.addEventListener('click', function () { select(Number(point.dataset.layer), view); });
    });
    view.rows.forEach(function (row, i) {
      row.querySelector('.layer__btn').addEventListener('click', function () { select(i + 1, view); });
    });
    render(view, false);
  });

  var queued = false;
  function relayout() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; views.forEach(place); });
  }
  window.addEventListener('resize', relayout);
  document.addEventListener('tabs:change', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
})();
