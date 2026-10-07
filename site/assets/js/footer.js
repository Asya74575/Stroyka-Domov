// Общий подвал из config.js (L9): знак и описание, «КЕДР», контакты-заглушки текстом, мессенджеры, навигация,
// «Где строим», копирайт с текущим годом и юр. ссылки. Внутри [data-include="footer"] — статичная копия той же разметки.
(function () {
  var mount = document.querySelector('[data-include="footer"]');
  if (!mount || !window.SITE) return;
  var ROOT = new URL('../../', document.currentScript.src);
  var site = window.SITE;
  var info = site.footer || {};
  // Неразрывные пробелы по L8: после коротких слов, внутри чисел, перед «·» и «—»
  function typo(text) {
    return String(text || '')
      .replace(/(?<=^|[\s«(])([а-яёa-z]{1,2}|ул\.|под)\s+/giu, '$1\u00A0')
      .replace(/(\d)\s+(?=[\dа-яёa-z%])/giu, '$1\u00A0')
      .replace(/\s+([·—])/g, '\u00A0$1')
      .replace(/(\d)–(?=\d)/g, '$1–' + String.fromCharCode(0x2060));
  }
  function url(value) {
    var raw = String(value || '').trim();
    if (!raw || /\s/.test(raw)) return '';
    if (/^(https?:|viber:|tg:)/i.test(raw)) return raw;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return '';
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
  function column(title, items, label) {
    var nav = el('nav', 'site-footer__col');
    nav.setAttribute('aria-label', label);
    nav.append(el('p', 'site-footer__head t-label', title));
    (items || []).forEach(function (item) { nav.append(link(item.title, item.href, 'site-footer__link t-body-s')); });
    return nav;
  }

  var footer = el('footer', 'site-footer');
  var grid = el('div', 'site-footer__grid container');

  var brand = el('div', 'site-footer__brand');
  var sign = el('img', 'site-footer__sign');
  sign.src = new URL('img/sign-kedr.svg', ROOT).href;
  sign.width = 64; sign.height = 64;
  sign.alt = site.name || '';
  brand.append(sign, el('p', 'site-footer__about t-body-s', info.about), el('p', 't-body-s', info.unp));

  var cols = el('div', 'site-footer__cols');
  var contacts = el('div', 'site-footer__col site-footer__col--contacts');
  contacts.append(
    el('p', 'site-footer__head t-label', 'Контакты'),
    el('p', 'site-footer__phone t-h3s', site.phoneText),
    el('p', 'site-footer__email t-h3s', site.emailText),
    el('p', 'site-footer__address t-body-s', [site.address, site.hours].filter(Boolean).join(' · '))
  );
  var wrap = el('div', 'on-dark');
  wrap.setAttribute('data-contacts', '');
  var list = el('ul', 'contacts');
  var fb = site.messengersFallback || { list: [] };
  fb.list.forEach(function (name) { var li = el('li'); li.append(link(name, fb.href, 'contacts__link')); list.append(li); });
  wrap.append(list);
  contacts.append(wrap);
  cols.append(contacts, column('Навигация', info.nav, 'Навигация в подвале'), column('Компания', info.company, 'Компания'));

  var bottom = el('div', 'site-footer__bottom t-mono-s');
  bottom.append(el('p', null, '© ' + new Date().getFullYear() + ' ' + (info.copyright || '')));
  var legal = el('div', 'site-footer__bottom-links');
  (site.legal || []).forEach(function (item) { legal.append(link(item.title, item.href)); });
  bottom.append(legal);

  var word = el('p', 'site-footer__word t-wordmark', (site.name || '').toUpperCase());
  word.setAttribute('aria-hidden', 'true');

  grid.append(brand, cols, el('p', 'site-footer__cities t-body-s', info.cities), bottom, word);
  footer.append(grid);
  mount.replaceChildren(footer);
})();
