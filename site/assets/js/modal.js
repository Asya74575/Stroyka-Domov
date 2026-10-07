// Окно «Планировка»: <dialog> со схемой проекта. Закрытие — крестик, Esc, клик по фону; появляется и исчезает
// затуханием. Фокус возвращается на кнопку. Без JS (или без поддержки <dialog>) ссылка открывает файл схемы.
(function () {
  var dialog = document.getElementById('plan-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var title = dialog.querySelector('#plan-dialog-title');
  var img = dialog.querySelector('.modal__img');
  var opener = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hide() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (reduce) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    setTimeout(function () { dialog.classList.remove('is-closing'); dialog.close(); }, 400);
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-plan]');
    if (!link) return;
    event.preventDefault();
    opener = link;
    title.textContent = link.getAttribute('data-plan-title') || 'Планировка';
    img.src = link.getAttribute('data-plan');
    img.alt = 'Условная схема планировки: ' + title.textContent;
    dialog.showModal();
  });
  dialog.querySelector('.modal__close').addEventListener('click', hide);
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); hide(); });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    var inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    if (!inside) hide();
  });
  dialog.addEventListener('close', function () { if (opener) opener.focus(); });
})();

// Фото в отзывах — на весь экран: <dialog> с картинкой, вписанной в окно, и подписью. Закрытие — крестик, Esc,
// клик мимо фото или по нему; появляется и исчезает затуханием. Без JS ссылка открывает файл фото.
(function () {
  var dialog = document.getElementById('photo-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var img = dialog.querySelector('.modal__photo');
  var caption = dialog.querySelector('.modal__caption');
  var opener = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hide() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (reduce) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    setTimeout(function () { dialog.classList.remove('is-closing'); dialog.close(); }, 400);
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-photo]');
    if (!link) return;
    event.preventDefault();
    opener = link;
    var w = Number(link.getAttribute('data-photo-w')) || 3, h = Number(link.getAttribute('data-photo-h')) || 2;
    var thumb = link.querySelector('img');
    img.removeAttribute('loading');
    img.width = w;
    img.height = h;
    img.style.setProperty('--r', (w / h).toFixed(4));
    img.src = link.getAttribute('href');
    img.alt = thumb ? thumb.alt : '';
    caption.textContent = link.getAttribute('data-photo-caption') || '';
    dialog.showModal();
  });
  dialog.querySelector('.modal__close').addEventListener('click', hide);
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); hide(); });
  dialog.addEventListener('click', function (event) {
    if (!event.target.closest('.modal__close')) hide();
  });
  dialog.addEventListener('close', function () { if (opener) opener.focus(); });
})();
