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

  // Телефон (подсказка — белая карточка над списком, L74): высота карточки — по её тексту и меняется вместе с раскрытием строки:
  // те же 0,6 с и та же кривая, что у аккордеона; старый текст гаснет за 0,2 с, новый проявляется. Конечная высота
  // замеряется заранее в невидимой копии карточки. На планшете и десктопе подсказка лежит поверх фото — без изменений.
  function tipHeight(view, n) {
    var probe = view.tip.cloneNode(true);
    probe.style.cssText = 'position:absolute;visibility:hidden;left:0;top:0;height:auto;width:' + view.tip.getBoundingClientRect().width + 'px';
    probe.setAttribute('aria-hidden', 'true');
    var data = layerData(view, n);
    probe.querySelector('.cutaway__tip-title').textContent = data.title;
    probe.querySelector('.cutaway__tip-text').textContent = data.text;
    var chips = probe.querySelector('.chips');
    chips.replaceChildren.apply(chips, data.chips.map(function (chip) { var li = document.createElement('li'); li.className = 't-mono-s'; li.textContent = chip; return li; }));
    chips.hidden = !data.chips.length;
    view.tip.parentNode.appendChild(probe);
    var h = probe.getBoundingClientRect().height;
    probe.remove();
    return h;
  }
  function resizeTip(view, n) {
    var tip = view.tip;
    if (reduce || !tip.animate || getComputedStyle(tip).position !== 'static') return;
    var from = tip.getBoundingClientRect().height;   // если высота ещё едет — с текущей
    if (tip._anim) { tip._anim.cancel(); tip._anim = null; }
    var to = tipHeight(view, n);
    if (Math.abs(from - to) < 0.5) return;
    tip.style.overflow = 'hidden';
    var anim = tip.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 600, easing: EASE });
    tip._anim = anim;
    var end = function () { if (tip._anim === anim) { tip._anim = null; tip.style.overflow = ''; } };
    anim.onfinish = end;
    anim.oncancel = end;
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
      var n = current;
      resizeTip(view, n);
      view.tip.classList.add('is-fading');
      setTimeout(function () {
        if (n !== current) return;   // пока гасло, выбрали другой слой — его таймер покажет свой текст
        fillTip(view, n);
        view.tip.classList.remove('is-fading');
        place(view);
      }, 200);
    } else {
      fillTip(view, current);
    }
    place(view);
  }

  // Телефон (L74): то, что нажали, стоит под пальцем неподвижно, пока над ним сворачивается прежний слой и меняется высота
  // подсказки, — иначе строка уезжала вверх и возвращалась вниз («качок»). Каждый кадр страница докручивается на сдвиг строки;
  // собственная подстройка прокрутки браузера на это время выключена. Касание, колесо или клавиша прокрутки — отпускаем.
  // Докрутка — в ResizeObserver: он срабатывает после пересчёта высот и до отрисовки кадра, поэтому строка не отстаёт ни на кадр.
  var hold = null;
  function compensate() {
    if (!hold) return;
    var d = hold.el.getBoundingClientRect().top - hold.top;
    if (Math.abs(d) >= 0.5) window.scrollTo(0, window.scrollY + d);
  }
  var watcher = window.ResizeObserver ? new ResizeObserver(compensate) : null;
  if (watcher) views.forEach(function (view) {   // каждая строка и подсказка: общая высота вкладки может не меняться (одна строка закрывается, другая открывается)
    watcher.observe(view.tip);
    view.rows.forEach(function (row) { watcher.observe(row); });
  });
  function keep() {
    if (!hold) return;
    if (!watcher) compensate();
    if (running || performance.now() < hold.until) requestAnimationFrame(keep);
    else { compensate(); release(); }
  }
  function release() {
    hold = null;
    document.documentElement.style.overflowAnchor = '';
  }
  function holdAt(view, el) {
    if (getComputedStyle(view.tip).position !== 'static') return;   // только раскладка телефона: подсказка над списком
    var idle = !hold;
    hold = { el: el, top: el.getBoundingClientRect().top, until: performance.now() + 750 };   // 0,6 с — строки и высота подсказки + запас
    document.documentElement.style.overflowAnchor = 'none';
    if (idle) requestAnimationFrame(keep);
  }
  ['touchstart', 'wheel', 'keydown'].forEach(function (type) {
    window.addEventListener(type, function () { if (hold) release(); }, { passive: true });
  });

  function select(n, source) {
    if (n === current) return;
    current = n;
    views.forEach(function (view) { render(view, true, true); });   // скрытые вкладки — так же плавно: они держат общую высоту блока (L74)
  }

  views.forEach(function (view) {
    view.points.forEach(function (point) {
      point.addEventListener('click', function () {
        if (Number(point.dataset.layer) !== current) holdAt(view, point);
        select(Number(point.dataset.layer), view);
      });
    });
    view.rows.forEach(function (row, i) {
      var btn = row.querySelector('.layer__btn');
      btn.addEventListener('click', function () {
        if (i + 1 !== current) holdAt(view, btn);
        select(i + 1, view);
      });
    });
    render(view, false);
  });

  // Телефон (L74): описание материала (тёмная плашка над списком) — одной высоты во всех вкладках, по самому длинному тексту:
  // смена вкладки не сдвигает список на разницу описаний. Белая подсказка — по своему тексту (правка владельца 2026-10-07).
  function evenHeights() {
    var phone = getComputedStyle(views[0].tip).position === 'static';
    var abouts = views.map(function (view) { return view.panel.querySelector('.cutaway__about'); }).filter(Boolean);
    abouts.forEach(function (about) { about.style.minHeight = ''; });
    if (!phone) return;
    var max = Math.max.apply(null, abouts.map(function (about) { return about.offsetHeight; }));
    abouts.forEach(function (about) { about.style.minHeight = Math.ceil(max) + 'px'; });
  }
  evenHeights();

  var queued = false;
  function relayout() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; evenHeights(); views.forEach(place); });
  }
  window.addEventListener('resize', relayout);
  document.addEventListener('tabs:change', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
})();
