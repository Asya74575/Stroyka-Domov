// Первый экран: размерная линия на фото прорисовывается от центра к краям (0,8 с), затем выноски 01–03
// появляются по очереди (шаг 0,15 с, затухание 0,4 с), после — точки по очереди «пульсируют». Тайминги — в page.css.
// Без JS и при prefers-reduced-motion — сразу конечное состояние.
(function () {
  var figure = document.querySelector('[data-hero]');
  if (!figure) return;
  var started = false;
  function draw() {
    if (started) return;
    started = true;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { figure.classList.add('is-drawn'); });
    });
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { figure.classList.add('is-drawn'); return; }
  // Пульс точек (page.css): идёт, только пока фото в окне, — вне экрана анимация на паузе
  figure.classList.add('is-live');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      figure.classList.toggle('is-paused', !entries[0].isIntersecting);
    }).observe(figure);
  }
  var img = figure.querySelector('img');
  if (img && !img.complete) {
    img.addEventListener('load', draw, { once: true });
    img.addEventListener('error', draw, { once: true });
    setTimeout(draw, 1200);
  } else {
    draw();
  }
})();
