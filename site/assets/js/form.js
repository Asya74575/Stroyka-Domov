// Показательные формы заявки (вместо form-demo.js): маска телефона +375 (__) ___-__-__, проверка полей
// и согласия, экран после отправки. Данные и файлы никуда не уходят и не сохраняются — форма честно об этом говорит.
// Форм две: внизу страницы (#zayavka) и в окне заявки (sheet.js) — у каждой свои поля, ошибки и экран после отправки.
// В HTML кнопка выключена (disabled): без JS форму не отправить. Плашка расчёта (только у формы внизу) обновляется
// из калькулятора; её галочка решает, уйдёт ли расчёт с заявкой, «изменить» ведёт к калькулятору, а кнопка сметы
// там — обратно к форме. Поле файла (форма в окне) показывает имя и размер, проверяет тип и 10 МБ, файл можно убрать.
document.querySelectorAll('form[data-form="demo"]').forEach(function (form) {
  var body = form.querySelector('.form__body');
  var done = form.querySelector('.form__done');
  var status = form.querySelector('[data-form-status]');
  var submit = form.querySelector('[type="submit"]');
  var name = form.elements.name, phone = form.elements.phone, consent = form.elements.consent, calc = form.elements.calc;
  var summaryEl = form.querySelector('[data-calc-summary]');
  var attach = form.elements.attach;
  var note = form.querySelector('[data-calc-note]');
  var cta = note ? document.querySelector('[data-calc-cta]') : null;
  var editing = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PREFIX = '+375 (';
  var MSG = {
    name: 'Как к вам обращаться?',
    phone: 'Проверьте номер: нужно 9 цифр после +375',
    consent: 'Поставьте галочку согласия — без неё заявку не отправить',
    file: 'Подойдёт PDF, JPG или PNG до 10 МБ — выберите другой файл'
  };
  var touched = { name: false, phone: false, consent: false };
  submit.disabled = false;

  // Телефон: «+375 (» ставится сам, вводятся 9 цифр; вставка в любом формате приводится к маске
  function digits(value) {
    var d = String(value || '').replace(/\D/g, '');
    if (d.indexOf('375') === 0) d = d.slice(3);
    else if (d.indexOf('80') === 0 && d.length > 9) d = d.slice(2);
    return d.slice(0, 9);
  }
  function format(d) {
    if (!d) return PREFIX;
    var out = PREFIX + d.slice(0, 2);
    if (d.length > 2) out += ') ' + d.slice(2, 5);
    if (d.length > 5) out += '-' + d.slice(5, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    return out;
  }
  var lastDigits = '';
  phone.addEventListener('focus', function () { if (!phone.value) phone.value = PREFIX; });
  phone.addEventListener('input', function (event) {
    var d = digits(phone.value);
    // удалили скобку, пробел или дефис — убираем и цифру перед ними, иначе Backspace «застревает»
    if (event.inputType && event.inputType.indexOf('delete') === 0 && d === lastDigits && d.length) d = d.slice(0, -1);
    lastDigits = d;
    phone.value = format(d);
    var end = phone.value.length;
    try { phone.setSelectionRange(end, end); } catch (e) { /* type=tel поддерживает выделение */ }
    if (touched.phone) check('phone');
  });
  phone.addEventListener('blur', function () {
    if (!digits(phone.value)) { phone.value = ''; lastDigits = ''; }
  });

  var fields = {
    name: { input: name, error: form.querySelector('#' + name.id + '-error'), ok: function () { return name.value.trim() !== ''; } },
    phone: { input: phone, error: form.querySelector('#' + phone.id + '-error'), ok: function () { return digits(phone.value).length === 9; } },
    consent: { input: consent, error: form.querySelector('#' + consent.id + '-error'), ok: function () { return consent.checked; } }
  };
  function check(key) {
    var f = fields[key];
    var valid = f.ok();
    f.input.setAttribute('aria-invalid', valid ? 'false' : 'true');
    f.error.textContent = valid ? '' : MSG[key];
    f.error.hidden = valid;
    return valid;
  }
  // Проверка при уходе с заполненного поля и сразу после исправления
  name.addEventListener('blur', function () { if (name.value.trim()) { touched.name = true; check('name'); } });
  name.addEventListener('input', function () { if (touched.name) check('name'); });
  phone.addEventListener('blur', function () { if (digits(phone.value)) { touched.phone = true; check('phone'); } });
  consent.addEventListener('change', function () { if (touched.consent) check('consent'); });

  function swap(hide, show, after) {
    if (reduce) { hide.hidden = true; show.hidden = false; after(); return; }
    hide.classList.add('is-leaving');
    setTimeout(function () {
      hide.hidden = true;
      hide.classList.remove('is-leaving');
      show.classList.add('is-entering');
      show.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { show.classList.remove('is-entering'); after(); }); });
    }, 400);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    touched = { name: true, phone: true, consent: true };
    var firstBad = null;
    ['name', 'phone', 'consent'].forEach(function (key) { if (!check(key) && !firstBad) firstBad = fields[key].input; });
    if (file && !fileOk() && !firstBad) firstBad = file.input;
    if (firstBad) {
      status.textContent = 'Заявка не отправлена: проверьте отмеченные поля.';
      firstBad.focus();
      return;
    }
    status.textContent = 'Форма работает в демонстрационном режиме: заявка не отправлена и нигде не сохранена.';
    swap(body, done, function () {
      form.reset();
      lastDigits = '';
      touched = { name: false, phone: false, consent: false };
      Object.keys(fields).forEach(function (key) { fields[key].input.removeAttribute('aria-invalid'); fields[key].error.hidden = true; });
      if (file) file.clear();
      if (note && window.kedrCalc) setSummary(window.kedrCalc.summary);
      if (note) syncAttach();
      done.querySelector('h3').focus();
    });
  });

  // «Вернуться к расчёту» (переход к калькулятору) или закрытие окна заявки — бланк снова готов к заполнению
  function restore() { done.hidden = true; body.hidden = false; }
  var back = done.querySelector('a');
  if (back) back.addEventListener('click', function () { setTimeout(restore, 50); });
  form.addEventListener('form:restore', restore);

  // Файл (необязательный): имя и размер выбранного, проверка типа и размера, «удалить»
  var file = null, fileError = null;
  var FILE_MAX = 10 * 1024 * 1024, FILE_TYPES = /\.(pdf|jpe?g|png|webp)$/i;
  var fileBox = form.querySelector('[data-file]');
  if (fileBox) {
    var fileInput = fileBox.querySelector('input[type="file"]');
    var chosen = fileBox.querySelector('[data-file-chosen]');
    fileError = form.querySelector('#' + fileInput.id + '-error');
    var action = fileBox.querySelector('[data-file-action]');
    var size = function (bytes) {
      if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' КБ';
      return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' МБ';
    };
    file = {
      input: fileInput,
      clear: function () {
        fileInput.value = '';
        chosen.hidden = true;
        action.textContent = 'Прикрепить файл';
        fileInput.removeAttribute('aria-invalid');
        fileError.hidden = true;
      }
    };
    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) { file.clear(); return; }
      chosen.querySelector('[data-file-name]').textContent = f.name;
      chosen.querySelector('[data-file-size]').textContent = size(f.size);
      chosen.hidden = false;
      action.textContent = 'Заменить файл';
      fileOk();
    });
    chosen.querySelector('[data-file-remove]').addEventListener('click', function () { file.clear(); fileInput.focus(); });
  }
  function fileOk() {
    var f = file.input.files && file.input.files[0];
    var valid = !f || (f.size <= FILE_MAX && FILE_TYPES.test(f.name));
    file.input.setAttribute('aria-invalid', valid ? 'false' : 'true');
    fileError.textContent = valid ? '' : MSG.file;
    fileError.hidden = valid;
    return valid;
  }
  if (!note) return;

  function setSummary(text) {
    if (!text) return;
    summaryEl.textContent = text;
    calc.value = text.replace(/\u00A0/g, ' ');
  }
  document.addEventListener('calc:change', function (event) { setSummary(event.detail && event.detail.summary); });
  if (window.kedrCalc) setSummary(window.kedrCalc.summary);

  // Галочка расчёта: снята — расчёт не уходит с заявкой (скрытое поле выключено)
  function syncAttach() { calc.disabled = !attach.checked; }
  attach.addEventListener('change', syncAttach);
  syncAttach();

  // «изменить»: переход к калькулятору (обычная ссылка), расчёт снова прикладывается, фокус — на ползунке площади;
  // кнопка сметы становится «Вернуться к заявке»
  form.querySelector('[data-calc-edit]').addEventListener('click', function () {
    attach.checked = true;
    syncAttach();
    editing = true;
    if (cta) cta.classList.add('is-editing');
    var area = document.getElementById('calc-area');
    if (area) setTimeout(function () { area.focus({ preventScroll: true }); }, 0);
  });
  // «Вернуться к заявке»: к форме, плашка с обновлённым расчётом коротко подсвечивается, фокус — на её галочке
  if (cta) cta.querySelector('a').addEventListener('click', function () {
    if (!editing) return;
    editing = false;
    cta.classList.remove('is-editing');
    if (!body.hidden) setTimeout(function () {
      attach.focus({ preventScroll: true });
      note.classList.add('is-updated');
      setTimeout(function () { note.classList.remove('is-updated'); }, 1200);
    }, 0);
  });
});
