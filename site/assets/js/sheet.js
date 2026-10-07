// Окно заявки по референсу only.digital/#brief: «Рассчитать стоимость» (шапка, меню, первый экран) и «Рассчитать
// этот дом» открывают оливковый лист на весь экран — он выезжает снизу за 0,8 с, страница под ним размывается
// и темнеет, заголовок и бланк поднимаются по очереди. В адресе — #raschet: ссылка с другой страницы
// (index.html#raschet) открывает окно сразу, «Назад» в браузере закрывает. Закрытие — крестик, Esc, «Назад»;
// фокус возвращается на кнопку. «Рассчитать этот дом» показывает в окне выбранный проект и кладёт его в заявку
// (параметры дома calc.js переносит и в калькулятор). Без JS и без <dialog> ссылки ведут к форме внизу (#raschet).
(function () {
  var sheet = document.getElementById('raschet-okno');
  if (!sheet || typeof sheet.showModal !== 'function') return;
  var HASH = '#raschet';
  var root = document.documentElement;
  var form = sheet.querySelector('form');
  var project = sheet.querySelector('[data-sheet-project]');
  var projectField = sheet.querySelector('[data-sheet-project-field]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DURATION = 800;
  var opener = null, pushed = false, timer = 0;

  function visible(el) { return el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden'; }
  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  // Проект из карточки «Рассчитать этот дом»: название и цена — из самой карточки
  function setProject(button) {
    var card = button && button.closest('.project');
    if (!card) { project.hidden = true; projectField.disabled = true; projectField.value = ''; return; }
    var name = card.querySelector('.project__title h3');
    var price = card.querySelector('.project__price .t-price');
    project.querySelector('[data-sheet-project-name]').innerHTML = name.innerHTML;
    project.querySelector('[data-sheet-project-price]').innerHTML = price.innerHTML + ' под&nbsp;ключ';
    project.hidden = false;
    projectField.disabled = false;
    projectField.value = text(name) + ' · ' + text(price);
  }

  function open(button) {
    clearTimeout(timer);
    opener = button || null;
    setProject(button);
    if (!sheet.open) {
      sheet.classList.remove('is-shown', 'is-closing');
      sheet.scrollTop = 0;
      sheet.showModal();
      root.classList.add('sheet-open');
      sheet.querySelector('.sheet__close').focus({ preventScroll: true });
      // первый кадр — лист внизу, следующий — запуск выезда
      requestAnimationFrame(function () { requestAnimationFrame(function () { sheet.classList.add('is-shown'); }); });
    }
  }

  function finish() {
    sheet.classList.remove('is-shown', 'is-closing');
    if (sheet.open) sheet.close();
    root.classList.remove('sheet-open');
    if (form) form.dispatchEvent(new Event('form:restore'));
    // кнопка из закрытого меню 768 / 360 не видна — фокус на бургер
    if (opener && !visible(opener)) opener = document.querySelector('.site-header__burger');
    if (opener && visible(opener)) opener.focus({ preventScroll: true });
    opener = null;
  }

  function hide() {
    if (!sheet.open || sheet.classList.contains('is-closing')) return;
    sheet.classList.add('is-closing');
    sheet.classList.remove('is-shown');
    timer = setTimeout(finish, reduce ? 0 : DURATION);
  }

  // Закрытие по крестику и кнопке: если окно открыли кликом — «Назад» по истории (адрес возвращается),
  // если пришли по ссылке с #raschet — адрес очищается без перехода
  function close() {
    if (pushed) { pushed = false; history.back(); return; }
    if (location.hash === HASH) history.replaceState(null, '', location.pathname + location.search);
    hide();
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href$="' + HASH + '"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    var url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname) return;
    event.preventDefault();
    // меню 768 / 360 закрывается по клику на ссылку само (header.js)
    if (location.hash !== HASH) { history.pushState({ sheet: true }, '', HASH); pushed = true; }
    open(link);
  });

  sheet.querySelectorAll('.sheet__close, [data-sheet-close]').forEach(function (button) { button.addEventListener('click', close); });
  sheet.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
  window.addEventListener('popstate', function () {
    if (location.hash === HASH) { open(null); return; }
    pushed = false;
    hide();
  });

  if (location.hash === HASH) open(null);
})();
