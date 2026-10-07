// Шапка закреплена сверху (base.css). Пока страница в самом верху — без фона и линии (класс is-clear).
// Если у первого экрана есть атрибут data-header-clear — шапка прозрачная, пока он закрывает экран целиком
// (например, закреплённая сцена). Без JS шапка всегда с фоном. Работает только по прокрутке, без постоянного цикла.
(function () {
  var mount = document.querySelector('[data-include="header"]');
  if (!mount) return;
  var hero = document.querySelector('[data-header-clear]');
  var queued = false;
  function update() {
    queued = false;
    var clear = hero ? hero.getBoundingClientRect().bottom >= window.innerHeight - 1 : window.scrollY < 4;
    mount.classList.toggle('is-clear', clear);
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
})();
