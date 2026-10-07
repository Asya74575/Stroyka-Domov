// «Материалы»: точки на фото ↔ строки экспликации. Клик по точке или строке выбирает один слой во всех вкладках:
// точка становится оранжевой, строка раскрывается (открыта одна), подсказка меняет текст затуханием, выносная линия
// перестраивается за 0,4 с (от точки по горизонтали, затем вверх к подсказке). Если точка под подсказкой — подсказка
// переезжает в левый верхний угол. На телефоне подсказка — карточка под фото, линии нет.
// Без JS — в каждой вкладке открыт слой 02 (разметка).
(function () {
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-cutaway]'));
  if (!panels.length) return;
  var current = 2;
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

  function render(view, animate) {
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
      var use = btn.querySelector('use');
      if (use) use.setAttribute('href', on ? '#i-minus' : '#i-plus');
      row.querySelector('.layer__body').hidden = !on;
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
    views.forEach(function (view) { render(view, view === source); });
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
