/* =====================================================================
   MIASTO – narzędzia interfejsu: ikony, daty, komunikaty, arkusze
   ===================================================================== */
(function (g) {
  'use strict';

  const M = g.M;
  const U = {};
  g.U = U;

  U.$ = (s, el) => (el || document).querySelector(s);
  U.$$ = (s, el) => Array.prototype.slice.call((el || document).querySelectorAll(s));
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- ikony (24 × 24, rysowane linią) ---------- */
  const IK = {
    // nawigacja
    dzis: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8 12.4l3 3 5-6"/>',
    miasto: '<path d="M3 20h18"/><path d="M5 20v-9l5-3v12"/><path d="M10 20V4h8v16"/><path d="M13 8h2M13 12h2M13 16h2"/>',
    budowa: '<path d="M7 20V4M4 20h7"/><path d="M7 4l12 3.5H7M7 9h10"/><path d="M16.5 7.5V12"/><rect x="14.5" y="12" width="4" height="3.4" rx=".6"/>',
    statystyki: '<path d="M3.5 20h17"/><path d="M7 20v-6M12 20V6M17 20v-9"/>',
    ustawienia: '<path d="M4 7h9M18 7h2M4 17h2M11 17h9"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="8.5" cy="17" r="2.3"/>',
    // kategorie
    kropla: '<path d="M12 3.5c3.2 3.8 5.6 6.8 5.6 10.2a5.6 5.6 0 0 1-11.2 0c0-3.4 2.4-6.4 5.600-10.2z"/>',
    ksiazka: '<path d="M4 5.6c2.600-1 5.500-1 8 .5 2.500-1.500 5.400-1.500 8-.5v12.900c-2.600-1-5.500-1-8 .5-2.500-1.500-5.400-1.500-8-.5z"/><path d="M12 6.100V19"/>',
    teczka: '<rect x="3.500" y="7.500" width="17" height="12" rx="2.200"/><path d="M9 7.500V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.500M3.500 13h17"/>',
    hantel: '<path d="M7 12h10M6.500 7.500v9M17.500 7.500v9M3.500 9.800v4.400M20.500 9.800v4.400"/>',
    dom: '<path d="M4 11.500L12 4.500l8 7"/><path d="M6 10v9.500h12V10"/><path d="M10 19.500v-5h4v5"/>',
    lista: '<path d="M9.500 7h10.500M9.500 12h10.500M9.500 17h10.500"/><path d="M4.500 7h.010M4.500 12h.010M4.500 17h.010" stroke-width="3"/>',
    serce: '<path d="M12 20s-7.500-4.600-7.500-10.200A4.300 4.300 0 0 1 12 7.600a4.300 4.300 0 0 1 7.500 2.200C19.500 15.400 12 20 12 20z"/>',
    telefon: '<rect x="7" y="3" width="10" height="18" rx="2.600"/><path d="M11 17.500h2"/>',
    // znaki
    ptaszek: '<path d="M5 12.600l4.400 4.400L19 7.400"/>',
    minus: '<path d="M6 12h12"/>',
    plus: '<path d="M12 6v12M6 12h12"/>',
    x: '<path d="M6.500 6.500l11 11M17.500 6.500l-11 11"/>',
    dalej: '<path d="M9.500 6l6 6-6 6"/>',
    zwin: '<path d="M6 9.500l6 6 6-6"/>',
    klodka: '<rect x="5" y="11" width="14" height="9.500" rx="2.200"/><path d="M8 11V8.200a4 4 0 0 1 8 0V11"/>',
    gwiazda: '<path d="M12 3.600l2.600 5.300 5.800.800-4.200 4.100 1 5.800-5.200-2.800-5.200 2.800 1-5.800-4.200-4.100 5.800-.800z"/>',
    tarcza: '<path d="M12 3.200l7 2.800v5.200c0 4.500-2.900 7.900-7 9.800-4.100-1.900-7-5.300-7-9.800V6z"/>',
    ludzie: '<circle cx="9" cy="8.200" r="3"/><path d="M3.500 19.200c.500-3.500 2.700-5.200 5.500-5.200s5 1.700 5.500 5.200"/><path d="M15.600 5.600a3 3 0 0 1 0 5.400M17.200 14.600c1.900.700 3 2.100 3.300 4.600"/>',
    lisc: '<path d="M5 19c0-8.200 5-13.200 14-14 0 9-5 14-13 14z"/><path d="M5 19l8-8"/>',
    zegar: '<circle cx="12" cy="12" r="8.200"/><path d="M12 7.500V12l3 2"/>',
    ksiezyc: '<path d="M19.200 14.400A7.600 7.600 0 0 1 9.600 4.800a7.600 7.600 0 1 0 9.600 9.600z"/>',
    procent: '<path d="M6 18L18 6"/><circle cx="7.500" cy="7.500" r="2.600"/><circle cx="16.500" cy="16.500" r="2.600"/>',
    pobierz: '<path d="M12 4v11M7.500 10.800l4.500 4.500 4.500-4.500M5 20h14"/>',
    wgraj: '<path d="M12 16V5M7.500 9.200L12 4.700l4.500 4.500M5 20h14"/>',
    udostepnij: '<path d="M12 15V4M8 7.600l4-4 4 4"/><path d="M6 11.500v7a1.500 1.500 0 0 0 1.500 1.500h9a1.500 1.500 0 0 0 1.500-1.500v-7"/>',
    kosz: '<path d="M5 7h14M10 7V4.500h4V7M7 7l1 13h8l1-13"/>',
    olowek: '<path d="M5 19l1-4.200L16.400 4.400l3.200 3.200L9.200 18z"/>',
    dzwonek: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.500 2h-15z"/><path d="M10.500 21.200h3"/>',
    przenies: '<path d="M12 3.500v17M3.500 12h17"/><path d="M9.500 6L12 3.500 14.500 6M9.500 18l2.500 2.500 2.500-2.500M6 9.500L3.500 12 6 14.500M18 9.500l2.500 2.500-2.500 2.500"/>',
    plomien: '<path d="M12 3.500c.800 3.300 5 5.200 5 9.800a5 5 0 0 1-10 0c0-1.900.800-3.300 1.800-4.400.400 1.500 1.100 2.300 2.100 2.900 0-2.900.100-5.900 1.100-8.300z"/>',
    cel: '<circle cx="12" cy="12" r="8.200"/><circle cx="12" cy="12" r="4.200"/><path d="M12 12h.010" stroke-width="3"/>',
    odswiez: '<path d="M19 12a7 7 0 1 1-2.200-5.100"/><path d="M19.200 4.200V8h-3.800"/>',
    info: '<circle cx="12" cy="12" r="8.500"/><path d="M12 11v5.500"/><path d="M12 7.700h.010" stroke-width="3"/>',
    dzwig: '<path d="M7 20V4M4 20h7"/><path d="M7 4l12 3.500H7M7 9h10"/><path d="M16.500 7.500V12"/><rect x="14.500" y="12" width="4" height="3.400" rx=".600"/>',
    kalendarz: '<rect x="4" y="5.500" width="16" height="14.500" rx="2.200"/><path d="M4 10h16M8.500 3.500v4M15.500 3.500v4"/>'
  };
  U.ik = (nazwa, klasa) => '<svg class="ik' + (klasa ? ' ' + klasa : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (IK[nazwa] || IK.info) + '</svg>';

  /* ---------- kolory ---------- */
  function jasnosc(hex) {
    const n = parseInt(hex.slice(1), 16);
    const k = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  }
  // kolor tekstu na kolorowym tle: biały albo granatowy, co da lepszy kontrast
  U.tekstNa = function (hex) {
    const L = jasnosc(hex), bialy = 1.05 / (L + 0.05), ciemny = (L + 0.05) / (jasnosc('#101936') + 0.05);
    return bialy >= ciemny ? '#ffffff' : '#101936';
  };
  U.noc = () => document.documentElement.getAttribute('data-motyw') === 'noc';

  /* ---------- daty ---------- */
  const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
  const MIES = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  const MIES_KR = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
  U.SKROTY_DNI = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
  const dwie = n => (n < 10 ? '0' + n : '' + n);
  const kluczKal = d => d.getFullYear() + '-' + dwie(d.getMonth() + 1) + '-' + dwie(d.getDate());

  U.dataDluga = dk => { const d = M.dataZKlucza(dk); return DNI[d.getDay()] + ', ' + d.getDate() + ' ' + MIES[d.getMonth()]; };
  U.dataKrotka = dk => { const d = M.dataZKlucza(dk); return d.getDate() + ' ' + MIES_KR[d.getMonth()]; };
  U.dzienMies = dk => M.dataZKlucza(dk).getDate();
  U.dzienTyg = dk => U.SKROTY_DNI[(M.dataZKlucza(dk).getDay() + 6) % 7];
  U.godzina = ts => { const d = new Date(ts); return d.getHours() + ':' + dwie(d.getMinutes()); };
  // „dziś o 6:00”, „jutro o 6:00”, „17 lis o 6:00”
  U.kiedy = function (ts) {
    const d = new Date(ts), t = new Date(M.zegar()), jutro = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
    const k = kluczKal(d);
    if (k === kluczKal(t)) return 'dziś o ' + U.godzina(ts);
    if (k === kluczKal(jutro)) return 'jutro o ' + U.godzina(ts);
    return d.getDate() + ' ' + MIES_KR[d.getMonth()] + ' o ' + U.godzina(ts);
  };
  U.ileDniTemu = function (ts) {
    const dni = Math.floor((M.zegar() - ts) / 86400000);
    if (dni <= 0) return 'dziś';
    if (dni === 1) return 'wczoraj';
    return dni + ' dni temu';
  };

  /* ---------- drobiazgi ---------- */
  U.wibruj = function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) { /* brak wibracji */ } };

  /* ---------- krótkie komunikaty ---------- */
  U.toast = function (html, opcje) {
    opcje = opcje || {};
    const box = U.$('#toasty'), el = document.createElement('div');
    el.className = 'toast' + (opcje.typ ? ' ' + opcje.typ : '');
    el.innerHTML = html;
    // nowy komunikat zastępuje poprzednie zwykłe; stałe (np. o aktualizacji) zostają
    U.$$('.toast', box).forEach(function (t) { if (!t.classList.contains('trwaly')) box.removeChild(t); });
    box.appendChild(el);
    if (opcje.czas !== Infinity) {
      setTimeout(function () {
        el.classList.add('znika');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
      }, opcje.czas || 2600);
    }
    return el;
  };

  /* ---------- arkusz wysuwany od dołu ----------
     Przycisk „wstecz” w telefonie zamyka arkusz zamiast wychodzić z aplikacji. */
  let otwarty = false, poZamknieciu = null, cofanie = false, kolejka = null;

  U.arkusz = function (html, opcje) {
    if (cofanie) { kolejka = [html, opcje]; return; }
    opcje = opcje || {};
    const el = U.$('#arkusz');
    el.innerHTML = '<div class="arkusz-tlo" data-a="zamknijArkusz"></div>' +
      '<div class="arkusz-panel" role="dialog" aria-modal="true" tabindex="-1">' +
      '<button class="arkusz-x" data-a="zamknijArkusz" aria-label="Zamknij">' + U.ik('x') + '</button>' +
      '<div class="arkusz-tresc">' + html + '</div></div>';
    el.hidden = false;
    // krótkie komunikaty nie zasłaniają arkusza
    U.$$('#toasty .toast').forEach(function (t) { if (!t.classList.contains('trwaly')) t.parentNode.removeChild(t); });
    poZamknieciu = opcje.poZamknieciu || null;
    if (!otwarty) {
      otwarty = true;
      try { history.pushState({ arkusz: 1 }, ''); } catch (e) { /* np. file:// */ }
    }
    const panel = U.$('.arkusz-panel', el);
    panel.scrollTop = 0;
    requestAnimationFrame(function () { el.classList.add('widoczny'); });
    const fokus = U.$('[data-fokus]', el);
    if (fokus) fokus.focus(); else panel.focus();
  };

  function schowaj() {
    const el = U.$('#arkusz');
    el.classList.remove('widoczny');
    el.hidden = true;
    el.innerHTML = '';
    const f = poZamknieciu;
    poZamknieciu = null;
    if (f) f();
  }

  U.zamknijArkusz = function () {
    if (!otwarty) return;
    otwarty = false;
    let wHistorii = false;
    try { wHistorii = !!(history.state && history.state.arkusz); } catch (e) { /* nic */ }
    if (wHistorii) {
      cofanie = true;
      setTimeout(koniecCofania, 600);       // gdyby przeglądarka nie zgłosiła powrotu
      try { history.back(); } catch (e) { koniecCofania(); }
    }
    schowaj();
  };
  function koniecCofania() {
    if (!cofanie) return;
    cofanie = false;
    if (kolejka) { const k = kolejka; kolejka = null; U.arkusz(k[0], k[1]); }
  }
  g.addEventListener('popstate', function () {
    if (cofanie) { koniecCofania(); return; }
    if (otwarty) { otwarty = false; schowaj(); }
  });
  U.arkuszOtwarty = () => otwarty || cofanie;
})(window);
