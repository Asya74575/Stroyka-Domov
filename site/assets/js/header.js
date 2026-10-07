// Общая шапка и меню 768 / 360 из config.js. Работает с диска, с сервера и со страниц во вложенных папках.
// Внутри [data-include="header"] лежит статичная копия той же разметки — без JS страница не ломается.
// Меню: бургер → экран под шапкой (затухание 0,4 с), страница не прокручивается, фокус заперт внутри шапки и меню,
// закрытие — крестик, Esc, клик по пункту; после закрытия фокус возвращается на бургер.
(function () {
  var mount = document.querySelector('[data-include="header"]');
  if (!mount || !window.SITE) return;
  var ROOT = new URL('../../', document.currentScript.src);
  var site = window.SITE;
  var NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    burger: '<path d="M0 5h24v2H0zM0 11h24v2H0zM0 17h24v2H0z" fill="currentColor"/>',
    close: '<path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2"/>',
    phone: '<path d="M40 34.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 22.11 20h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 40 34.92z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>'
  };
  // Неразрывные пробелы по L8: после коротких слов, внутри чисел, перед «·» и «—»
  function typo(text) {
    return String(text || '')
      .replace(/(?<=^|[\s«(])([а-яёa-z]{1,2}|ул\.)\s+/giu, '$1\u00A0')
      .replace(/(\d)\s+(?=[\dа-яёa-z%])/giu, '$1\u00A0')
      .replace(/\s+([·—])/g, '\u00A0$1')
      .replace(/(\d)–(?=\d)/g, '$1–' + String.fromCharCode(0x2060));
  }
  function url(value) {
    var raw = String(value || '').trim();
    if (!raw || /\s/.test(raw)) return '';
    if (/^(https?:|viber:|tg:)/i.test(raw)) return raw;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return '';
    if (raw.charAt(0) === '#') return raw;
    return new URL(raw, ROOT).href;
  }
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = typo(text);
    return node;
  }
  function link(text, href, className) {
    var a = el('a', className, text);
    var u = url(href);
    if (u) a.href = u;
    return a;
  }
  function icon(name) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', name === 'phone' ? '18 18 24 24' : '0 0 24 24');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.innerHTML = ICONS[name];
    return svg;
  }
  function messengers() {
    var wrap = el('div');
    wrap.setAttribute('data-contacts', '');
    var list = el('ul', 'contacts');
    var fb = site.messengersFallback || { list: [] };
    fb.list.forEach(function (name) {
      var li = el('li');
      li.append(link(name, fb.href, 'contacts__link'));
      list.append(li);
    });
    wrap.append(list);
    return wrap;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Шапка
  var header = el('header', 'site-header container');
  var logo = link(null, 'index.html#top', 'site-header__logo');
  var img = el('img');
  img.src = new URL('img/logo-kedr.svg', ROOT).href;
  img.width = 110; img.height = 48;
  img.alt = (site.name || '') + ' — на главную';
  logo.append(img);
  var nav = el('nav', 'site-header__nav');
  nav.setAttribute('aria-label', 'Основное меню');
  (site.menu || []).forEach(function (item) { nav.append(link(item.title, item.href, 't-body-strong')); });
  var end = el('div', 'site-header__end');
  var contact = el('p', 'site-header__contact');
  contact.append(el('span', 't-body-strong nowrap', site.phoneText), el('span', 'site-header__hours t-mono-s nowrap', site.hours));
  end.append(contact);
  if (site.cta) end.append(link(site.cta.label, site.cta.href, 'button site-header__cta'));
  var call = link(null, site.callHref || '#', 'icon-button site-header__call');
  call.setAttribute('aria-label', 'Заказать звонок: перейти к форме заявки');
  call.append(icon('phone'));
  var burger = el('button', 'icon-button site-header__burger');
  burger.type = 'button';
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'site-menu');
  burger.setAttribute('aria-label', 'Открыть меню');
  burger.append(icon('burger'));
  end.append(call, burger);
  header.append(logo, nav, end);

  // Меню 768 / 360
  var menu = el('div', 'site-menu');
  menu.id = 'site-menu';
  var inner = el('div', 'site-menu__inner container');
  var menuNav = el('nav');
  menuNav.setAttribute('aria-label', 'Меню разделов');
  var list = el('ul', 'site-menu__list');
  (site.menu || []).forEach(function (item, i) {
    var li = el('li');
    var a = link(null, item.href, 'site-menu__link');
    a.append(el('span', 'site-menu__num t-mono', pad(i + 1)), el('span', 'site-menu__title t-h3s', item.title));
    li.append(a);
    list.append(li);
  });
  menuNav.append(list);
  var bottom = el('div', 'site-menu__bottom');
  if (site.cta) bottom.append(link(site.cta.label, site.cta.href, 'button site-menu__cta'));
  var phone = el('p', 'site-menu__phone');
  phone.append(el('span', 't-h4 nowrap', site.phoneText), el('span', 't-mono-s', site.hours));
  bottom.append(phone, el('p', 'site-menu__address t-body-s', [site.address, site.hours].filter(Boolean).join(' · ')), messengers());
  inner.append(menuNav, bottom);
  menu.append(inner);
  mount.replaceChildren(header, menu);

  // Поведение меню
  var root = document.documentElement;
  var open = false;
  function focusables() {
    return Array.prototype.filter.call(mount.querySelectorAll('a[href], button:not([disabled])'), function (node) {
      return node.offsetParent !== null || node === burger;
    });
  }
  function setOpen(value, restoreFocus) {
    open = value;
    menu.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    burger.replaceChildren(icon(open ? 'close' : 'burger'));
    if (open) { var first = menu.querySelector('a'); if (first) first.focus({ preventScroll: true }); }
    else if (restoreFocus) burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { setOpen(!open, true); });
  menu.addEventListener('click', function (event) { if (event.target.closest('a')) setOpen(false, false); });
  document.addEventListener('keydown', function (event) {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); return; }
    if (event.key !== 'Tab') return;
    var items = focusables();
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  // Экран стал широким (≥ 1200) — меню закрывается само
  var wide = window.matchMedia('(min-width: 1200px)');
  function onWide() { if (wide.matches && open) setOpen(false, false); }
  if (wide.addEventListener) wide.addEventListener('change', onWide); else wide.addListener(onWide);
})();
