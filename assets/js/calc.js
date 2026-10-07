// Калькулятор: цена, срок и платёж по кредиту (формулы — SPEC.md, раздел 06; данные условные, согласованы владельцем).
// Цифры сметы плавно пересчитываются за 0,6 с; итог объявляется экранным читалкам после пересчёта.
// «Рассчитать этот дом» (data-calc у кнопки проекта) переносит параметры в калькулятор, сбрасывает «Дополнительно»
// и переходит к #kalkulyator (обычный якорь). Состояние — только в памяти страницы; форма получает строку расчёта
// событием calc:change. Без JS — смета по умолчанию из разметки.
(function () {
  var root = document.querySelector('[data-calc-root]');
  if (!root) return;
  var NBSP = '\u00A0';
  var PRICE = { gazobeton: 1400, brus: 1700, karkas: 1150 };          // BYN/м² под ключ
  var BASE_MONTHS = { gazobeton: 3.6, brus: 3.6, karkas: 2.6 };
  var FLOORS = { '1': 0, mansard: -50, '2': -50 };                      // поправка, BYN/м²
  var KIT = { box: 0.45, warm: 0.65, turnkey: 1 };
  var EXTRAS = { terrace: 12000, garage: 28000, fireplace: 9000, septic: 9500 };
  var MATERIAL_NAME = { gazobeton: 'газобетон', brus: 'клеёный брус', karkas: 'каркас' };
  var KIT_NAME = { box: 'коробка', warm: 'тёплый контур', turnkey: 'под' + NBSP + 'ключ' };
  var EXTRA_NAME = { terrace: 'терраса 20' + NBSP + 'м²', garage: 'гараж', fireplace: 'камин', septic: 'скважина и' + NBSP + 'септик' };
  var EXTRA_ORDER = ['terrace', 'garage', 'fireplace', 'septic'];
  var RATE = 0.1325 / 12, MONTHS = 240, LOAN_SHARE = 0.8, DURATION = 600;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var area = root.querySelector('#calc-area');
  var areaValue = root.querySelector('#calc-area-value');
  var fill = root.querySelector('.ruler__fill');
  var out = {};
  root.querySelectorAll('[data-out]').forEach(function (el) { out[el.dataset.out] = el; });

  function group(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); }
  function months(n) {
    var a = n % 100, b = n % 10;
    var word = (a > 10 && a < 20) ? 'месяцев' : b === 1 ? 'месяц' : (b > 1 && b < 5) ? 'месяца' : 'месяцев';
    return n + NBSP + word;
  }
  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function checked(name) { var el = root.querySelector('[name="' + name + '"]:checked'); return el ? el.value : null; }

  function read() {
    return {
      area: Number(area.value),
      floors: checked('floors') || '1',
      material: checked('material') || 'gazobeton',
      kit: checked('kit') || 'turnkey',
      extras: Array.prototype.map.call(root.querySelectorAll('[name="extras"]:checked'), function (el) { return el.value; })
    };
  }

  function compute(s) {
    var perM = PRICE[s.material] + FLOORS[s.floors];
    var extras = s.extras.reduce(function (sum, key) { return sum + (EXTRAS[key] || 0); }, 0);
    var total = Math.round((s.area * perM * KIT[s.kit] + extras) / 100) * 100;
    var term = Math.max(2, Math.round((BASE_MONTHS[s.material] + s.area / 100) * KIT[s.kit]));
    var loan = total * LOAN_SHARE;
    var payment = Math.round(loan * RATE / (1 - Math.pow(1 + RATE, -MONTHS)) / 10) * 10;
    return { total: total, perSquare: Math.round(total / s.area / 10) * 10, term: term, payment: payment };
  }

  function includes(s) {
    var warm = s.kit !== 'box', turnkey = s.kit === 'turnkey';
    var rows = [
      ['Проект и геология участка', true],
      ['Фундамент' + NBSP + '— монолитная плита', true],
      ['Стены, перекрытия, кровля', true],
      ['Окна, двери, фасад', warm],
      ['Отопление, вода, электрика', turnkey],
      ['Чистовая отделка', turnkey]
    ];
    var chosen = EXTRA_ORDER.filter(function (key) { return s.extras.indexOf(key) !== -1; }).map(function (key) { return EXTRA_NAME[key]; });
    if (chosen.length) rows.push([capital(chosen.join(', ')), true]);
    return rows;
  }

  function renderIncludes(s) {
    out.includes.replaceChildren.apply(out.includes, includes(s).map(function (row) {
      var li = document.createElement('li');
      li.className = 'dots-row';
      var name = document.createElement('span');
      name.className = 't-body c-text';
      name.textContent = row[0];
      var dots = document.createElement('span');
      dots.className = 'dots-row__dots';
      dots.setAttribute('aria-hidden', 'true');
      var state = document.createElement('span');
      state.className = 't-mono-caps ' + (row[1] ? 'c-olive' : 'c-muted');
      state.textContent = row[1] ? 'включено' : 'не входит';
      li.append(name, dots, state);
      return li;
    }));
  }

  var shown = null, frame = 0, liveTimer = 0, state = read();

  function paint(v, s) {
    out.total.textContent = group(v.total) + NBSP + 'BYN';
    out.summary.textContent = '≈' + NBSP + group(v.perSquare) + NBSP + 'BYN/м²' + NBSP + '· ' + MATERIAL_NAME[s.material] + NBSP + '· ' + s.area + NBSP + 'м²' + NBSP + '· ' + KIT_NAME[s.kit];
    out.term.textContent = months(Math.round(v.term));
    out.payment.textContent = '≈' + NBSP + group(v.payment) + NBSP + 'BYN/мес';
  }

  function summary(s, v) {
    return capital(MATERIAL_NAME[s.material]) + NBSP + '· ' + s.area + NBSP + 'м²' + NBSP + '· ' + KIT_NAME[s.kit] + NBSP + '· ' + group(v.total) + NBSP + 'BYN';
  }

  function update(animate) {
    state = read();
    var target = compute(state);
    areaValue.textContent = state.area + NBSP + 'м²';
    area.setAttribute('aria-valuetext', state.area + ' м²');
    fill.style.setProperty('--p', ((state.area - 60) / 240).toFixed(4));
    renderIncludes(state);
    cancelAnimationFrame(frame);
    if (!animate || reduce || !shown) {
      shown = target;
      paint(target, state);
    } else {
      var from = shown, start = null;
      var step = function (now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / DURATION);
        var e = 1 - Math.pow(1 - p, 3);
        shown = {
          total: from.total + (target.total - from.total) * e,
          perSquare: from.perSquare + (target.perSquare - from.perSquare) * e,
          term: from.term + (target.term - from.term) * e,
          payment: from.payment + (target.payment - from.payment) * e
        };
        paint(p < 1 ? {
          total: Math.round(shown.total / 100) * 100,
          perSquare: Math.round(shown.perSquare / 10) * 10,
          term: shown.term,
          payment: Math.round(shown.payment / 10) * 10
        } : target, state);
        if (p < 1) frame = requestAnimationFrame(step); else shown = target;
      };
      frame = requestAnimationFrame(step);
    }
    var line = summary(state, target);
    window.kedrCalc = { state: state, result: target, summary: line };
    document.dispatchEvent(new CustomEvent('calc:change', { detail: { summary: line } }));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () {
      out.live.textContent = 'Ориентировочная стоимость ' + group(target.total) + ' BYN, срок ' + months(target.term) + ', платёж в кредит около ' + group(target.payment) + ' BYN в месяц';
    }, DURATION + 100);
  }

  // Ползунок: перетаскивание и стрелки — шаг 10 м², PageUp / PageDown — 50; из проекта — точная площадь
  function setArea(value) { area.value = String(Math.min(300, Math.max(60, value))); update(true); }
  area.addEventListener('input', function () {
    var rounded = Math.round(Number(area.value) / 10) * 10;
    if (rounded !== Number(area.value)) area.value = String(rounded);
    update(true);
  });
  area.addEventListener('keydown', function (event) {
    var v = Number(area.value), next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.floor(v / 10) * 10 + 10;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.ceil(v / 10) * 10 - 10;
    else if (event.key === 'PageUp') next = v + 50;
    else if (event.key === 'PageDown') next = v - 50;
    else if (event.key === 'Home') next = 60;
    else if (event.key === 'End') next = 300;
    if (next === null) return;
    event.preventDefault();
    setArea(next);
  });
  root.addEventListener('change', function (event) { if (event.target !== area) update(true); });

  // «Рассчитать этот дом»
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-calc]');
    if (!button) return;
    var preset;
    try { preset = JSON.parse(button.getAttribute('data-calc')); } catch (e) { return; }
    area.value = String(preset.area);
    ['floors', 'material', 'kit'].forEach(function (name) {
      var input = root.querySelector('[name="' + name + '"][value="' + preset[name] + '"]');
      if (input) input.checked = true;
    });
    root.querySelectorAll('[name="extras"]').forEach(function (input) { input.checked = (preset.extras || []).indexOf(input.value) !== -1; });
    update(false);
  });

  update(false);
})();
