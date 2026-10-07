// Один источник для всех страниц: название, контакты, мессенджеры, аналитика, меню, подвал.
// Правится здесь — меняется на каждой странице (шапка — header.js, подвал — footer.js). Относительные ссылки — от папки site/.
window.SITE = {
  name: "Кедр",
  phone: "",            // пусто: телефон — заглушка, звонка по клику нет (BRIEF.md). Показывается текстом из phoneText
  email: "",            // пусто: почта — заглушка, письма по клику нет. Показывается текстом из emailText
  phoneText: "+375 (29) 000-00-00",
  emailText: "hello@example.com",
  address: "Минск, ул. Примерная, 1",
  hours: "ежедневно 9:00–21:00",
  messengers: {         // полные ссылки; пустые не показываются — вместо них кнопки ведут к форме (messengersFallback)
    telegram: "",       // https://t.me/username
    whatsapp: "",       // https://wa.me/375290000000 (только цифры номера)
    viber: "",          // viber://chat?number=%2B375290000000
    instagram: "",      // https://instagram.com/username
    max: ""             // ссылка «Поделиться профилем» из приложения MAX
  },
  // Кнопки мессенджеров «для вида» (BRIEF.md): пока ссылок нет, ведут к форме заявки
  messengersFallback: {
    href: "index.html#zayavka",
    list: ["Telegram", "Viber", "Instagram"]
  },
  metrikaId: "",        // Метрики нет (BRIEF.md: аналитика не нужна)
  cookieBanner: false,  // баннера нет и аналитика не загружается
  cookiePolicy: "",
  menu: [
    { title: "Проекты", href: "index.html#proekty" },
    { title: "Материалы", href: "index.html#materialy" },
    { title: "Цены", href: "index.html#kalkulyator" },
    { title: "Этапы", href: "index.html#etapy" },
    { title: "Гарантии", href: "index.html#garantii" },
    { title: "Отзывы", href: "index.html#otzyvy" },
    { title: "Вопросы", href: "index.html#voprosy" }
  ],
  cta: { label: "Рассчитать стоимость", href: "index.html#raschet" },
  callHref: "index.html#zayavka",   // кнопка «телефон» в шапке телефона: звонка нет, ведёт к форме
  footer: {
    about: "Строим тёплые дома под ключ в Минске и Минской области с 2012 года",
    unp: "УНП 1234567891234",
    nav: [
      { title: "Проекты домов", href: "index.html#proekty" },
      { title: "Материалы", href: "index.html#materialy" },
      { title: "Калькулятор", href: "index.html#kalkulyator" },
      { title: "Этапы строительства", href: "index.html#etapy" }
    ],
    company: [
      { title: "Гарантии", href: "index.html#garantii" },
      { title: "Отзывы", href: "index.html#otzyvy" },
      { title: "Вопросы", href: "index.html#voprosy" }
    ],
    cities: "Где строим: Минск, Боровляны, Ждановичи, Колодищи, Заславль, Фаниполь, Дзержинск, Смолевичи, Логойск, Молодечно, Борисов, Жодино",
    copyright: "ООО «Кедр». Все права защищены"
  },
  legal: [
    { title: "Политика обработки персональных данных", href: "legal/privacy.html" },
    { title: "Согласие на обработку персональных данных", href: "legal/consent.html" }
  ]
};
