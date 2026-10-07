// Вкладки «Проектов» и «Материалов»: role="tablist" / "tab" / "tabpanel", стрелки ←/→, Home, End.
// Панели стоят в одной ячейке сетки (page.css) — высота блока не прыгает; смена затуханием 0,4 с.
// Без JS все панели показаны подряд.
(function () {
  document.querySelectorAll('[data-tabs]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        var panel = panels[i];
        if (!panel) return;
        panel.classList.toggle('is-hidden', !on);
        if (on) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
      });
      if (focus) tabs[index].focus();
      list.dispatchEvent(new CustomEvent('tabs:change', { bubbles: true, detail: { index: index, panel: panels[index] } }));
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        select(next, true);
      });
    });
    var initial = 0;
    tabs.forEach(function (tab, i) { if (tab.getAttribute('aria-selected') === 'true') initial = i; });
    select(initial, false);
  });
})();
