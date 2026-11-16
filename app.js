/* =====================================================================
   MIASTO – aplikacja: obsługa dotknięć, upływ czasu, powiadomienia, PWA
   ===================================================================== */
(function (g) {
  'use strict';

  const K = g.KONFIG, M = g.M, G = g.G, U = g.U, E = g.E;
  const $ = U.$, esc = U.esc, ik = U.ik, fmt = M.fmt;
  const pl = (n, a, b, c) => fmt(n) + ' ' + M.odmiana(n, a, b, c);

  const ui = {
    ekran: 'dzis', wczoraj: false, dz: K.dzielnice[0].id, tryb: null, blysk: null, nowyOb: null, odczyt: null,
    motyw: null, faza: null, ostPkt: null,
    instalacja: null, zainstalowana: false, moznaUdostepnic: false, rejestracja: null, jestAktualizacja: false,
    powiadomienia: { dostepne: false, zgoda: 'default' }, importTekst: null
  };
  g.APP = { ui: ui };

  const ZAKLADKI = [['dzis', 'Dziś'], ['miasto', 'Miasto'], ['budowa', 'Budowa'], ['statystyki', 'Statystyki'], ['ustawienia', 'Ustawienia']];
  const ID_EKRANU = (K.zadania.filter(z => z.typ === 'ekran')[0] || {}).id;

  function ogranicz(v, min, max, domyslna) {
    const n = Math.round(+v);
    if (v === '' || !isFinite(n)) return domyslna;
    return Math.min(max, Math.max(min, n));
  }
  const cichy = tekst => U.toast('<span>' + esc(tekst) + '</span>', { typ: 'cichy' });

  /* ------------------------------------------------------------------
     Motyw i rysowanie
     ------------------------------------------------------------------ */
  function wyliczMotyw() {
    const S = M.stan(), m = (S && S.ust.motyw) || 'auto';
    if (m === 'jasny') return 'dzien';
    if (m === 'ciemny') return 'noc';
    return G.faza(M.zegar()) === 'noc' ? 'noc' : 'dzien';
  }
  function ustawMotyw() {
    const m = wyliczMotyw();
    if (m !== ui.motyw) {
      ui.motyw = m;
      document.documentElement.setAttribute('data-motyw', m);
    }
    ui.faza = G.faza(M.zegar());
  }

  function jestCoBudowac() {
    return Object.keys(K.obiekty).some(function (typ) {
      if (K.obiekty[typ].grupa !== 'moc') return false;
      const o = M.oferta(typ);
      return (o.stan === 'nowy' || o.stan === 'ulepsz') && o.ok;
    });
  }

  function rysujTablice() {
    const S = M.stan(), zmiana = ui.ostPkt !== null && ui.ostPkt !== S.pkt;
    ui.ostPkt = S.pkt;
    $('#tablica').innerHTML = '<div class="tablica-pas"><span>' + esc(S.miasto) + '</span><span>' + U.dataDluga(M.dzis()) + '</span></div>' +
      '<div class="tablica-pole"><h1>' + esc(E.tytul(ui)) + '</h1>' +
      '<div class="portfel' + (zmiana ? ' zmiana' : '') + '" role="status" aria-label="Punkty do wydania: ' + fmt(S.pkt) + '"><b>' + fmt(S.pkt) + '</b><small>pkt</small></div></div>';
  }
  function rysujZakladki() {
    const kropka = jestCoBudowac();
    $('#zakladki').innerHTML = ZAKLADKI.map(function (z) {
      const akt = ui.ekran === z[0];
      return '<button class="' + (akt ? 'aktywna' : '') + (z[0] === 'budowa' && kropka && !akt ? ' kropka' : '') + '" data-a="ekran" data-ekran="' + z[0] + '"' + (akt ? ' aria-current="page"' : '') + '>' + ik(z[0]) + '<span>' + z[1] + '</span></button>';
    }).join('');
  }
  function rysuj(odGory) {
    if (!M.stan()) return;
    ustawMotyw();
    const main = $('#ekran'), y = main.scrollTop;
    rysujTablice();
    rysujZakladki();
    main.className = 'ekran ekran-' + ui.ekran;
    main.innerHTML = E[ui.ekran](ui);
    main.scrollTop = odGory ? 0 : y;
    ui.blysk = null;
    ui.nowyOb = null;
    Pow.poZmianie();
  }

  /* ------------------------------------------------------------------
     Komunikaty po odhaczeniu
     ------------------------------------------------------------------ */
  function oglos(r, dk) {
    const dod = [];
    (r.nowe || []).forEach(function (n) {
      if (n === 'komplet') dod.push('Komplet podstaw');
      else if (n === 'zaliczony') dod.push('Dzień zaliczony, seria: ' + pl((M.dzien(dk) || {}).seria || 1, 'dzień', 'dni', 'dni'));
      else if (n === 'wyzwanie') dod.push('Wyzwanie tygodnia zaliczone');
      else if (n === 'promocja') dod.push('Tydzień serii: dostajesz dzień promocji');
      else if (n === 'zadanieDnia') dod.push('Zadanie dnia wykonane');
    });
    if (!r.delta && !dod.length) { cichy('Zapisane bez punktów: dzienny limit jest już wykorzystany.'); return; }
    U.toast('<b class="t-pkt">' + (r.delta > 0 ? '+' : '') + fmt(r.delta) + ' pkt</b>' + (dod.length ? '<span>' + dod.join('<br>') + '</span>' : ''),
      { typ: dod.length ? 'swieto' : '', czas: dod.length ? 3800 : 1700 });
    if (dod.length) U.wibruj([14, 50, 24]);
  }

  function cofnij(zid, dk) {
    const r = M.cofnij(zid, dk);
    if (!r.ok) { cichy(r.powod); return; }
    rysuj();
    if (r.delta) U.toast('<b class="t-pkt">' + fmt(r.delta) + ' pkt</b><span>Cofnięto</span>', { typ: 'cichy', czas: 1500 });
  }

  /* ------------------------------------------------------------------
     Budowanie
     ------------------------------------------------------------------ */
  function postaw(typ, dz, x, y, wTrybie) {
    const r = M.zbuduj(typ, dz, x, y);
    if (!r.ok) { cichy(r.powod); return false; }
    const def = K.obiekty[typ];
    ui.nowyOb = r.obiekt.id;
    U.wibruj(18);
    if (wTrybie) {
      const o = M.oferta(typ);
      if (def.unikat || o.stan !== 'nowy' || !o.ok) ui.tryb = null;
    }
    U.zamknijArkusz();
    rysuj();
    const bud = M.budowaObiektu(r.obiekt.id);
    let t = r.nocna && bud ? esc(def.nazwa) + ': ekipa zaczęła budowę, gotowe ' + U.kiedy(bud.gotowe) : 'Postawiono: ' + esc(def.nazwa);
    if (r.otwarta) t += '<br>Otwarto dzielnicę ' + esc(M.dzielnicaDef(r.otwarta).nazwa);
    U.toast('<b class="t-pkt">−' + fmt(r.cena) + ' pkt</b><span>' + t + '</span>', { czas: r.nocna || r.otwarta ? 3600 : 2000 });
    return true;
  }

  function jestMiejsce(typ, dz) {
    for (let y = 0; y < M.N; y++) for (let x = 0; x < M.N; x++) {
      if (!M.obiektNa(dz, x, y) && M.moznaTu(typ, dz, x, y).ok) return true;
    }
    return false;
  }

  /* ------------------------------------------------------------------
     Akcje (atrybut data-a)
     ------------------------------------------------------------------ */
  const A = {
    zamknijArkusz: function () { U.zamknijArkusz(); },
    odswiezStrone: function () { location.reload(); },

    ekran: function (el) {
      const e = el.dataset.ekran;
      if (e === ui.ekran) { $('#ekran').scrollTop = 0; return; }
      ui.ekran = e;
      if (e !== 'miasto') ui.tryb = null;
      rysuj(true);
    },
    dzien: function (el) { ui.wczoraj = el.dataset.ktory === 'wczoraj'; rysuj(true); },
    zwin: function (el) {
      const z = Object.assign({}, M.stan().ust.zwiniete || {}), k = el.dataset.kat;
      if (z[k]) delete z[k]; else z[k] = 1;
      M.ustaw('zwiniete', z);
      rysuj();
    },
    ukryjWskazowke: function (el) { M.stan().wskazowki[el.dataset.id] = 1; M.zapisz(); rysuj(); },

    /* --- zadania --- */
    odhacz: function (el) {
      const zid = el.dataset.z, dk = E.dzienWidoku(ui), z = M.zadanie(zid);
      if (!z) return;
      if (z.typ === 'ekran') { U.arkusz(E.arkuszEkran(dk)); return; }
      const st = M.stanZadania(zid, dk);
      if (z.typ === 'raz' && st.ile > 0) { cofnij(zid, dk); return; }
      const r = M.odhacz(zid, dk);
      if (!r.ok) { cichy(r.powod); return; }
      U.wibruj(12);
      ui.blysk = zid;
      rysuj();
      oglos(r, dk);
    },
    cofnij: function (el) { cofnij(el.dataset.z, E.dzienWidoku(ui)); },
    zapiszEkran: function () {
      const hEl = $('#ek-h'), mEl = $('#ek-m');
      if (hEl.value === '' && mEl.value === '') { cichy('Wpisz czas z ustawień telefonu.'); return; }
      const min = ogranicz(hEl.value, 0, 24, 0) * 60 + ogranicz(mEl.value, 0, 59, 0), dk = E.dzienWidoku(ui);
      const r = M.odhacz(ID_EKRANU, dk, min);
      if (!r.ok) { cichy(r.powod); return; }
      U.zamknijArkusz();
      ui.blysk = ID_EKRANU;
      rysuj();
      if (r.delta > 0 || (r.nowe && r.nowe.length)) oglos(r, dk);
      else cichy(min <= M.stan().ust.limitEkranuMin ? 'Zapisane.' : 'Zapisane. Tym razem ponad limit, bez punktów.');
    },
    usunEkran: function () { M.cofnij(ID_EKRANU, E.dzienWidoku(ui)); U.zamknijArkusz(); rysuj(); },

    wybierzZD: function () { U.arkusz(E.arkuszZD()); },
    ustawZD: function (el) {
      const n = $('#zd-notatka'), zid = el.dataset.z || null;
      const r = M.ustawZadanieDnia(zid, n ? n.value : '');
      if (!r.ok) { cichy(r.powod); return; }
      U.zamknijArkusz();
      rysuj();
      cichy(zid ? 'Zadanie dnia wybrane.' : 'Zadanie dnia usunięte.');
    },
    wybierzWyzwanie: function () { U.arkusz(E.arkuszWyzwania()); },
    ustawWyzwanie: function (el) {
      const def = K.wyzwania.filter(w => w.id === el.dataset.id)[0];
      if (!def) return;
      const r = M.wybierzWyzwanie(def);
      if (!r.ok) { cichy(r.powod); return; }
      U.zamknijArkusz();
      rysuj();
      cichy('Wyzwanie tygodnia wybrane.');
    },

    noweZadanie: function () { U.arkusz(E.arkuszWlasne()); },
    edytujWlasne: function (el) { U.arkusz(E.arkuszWlasne(el.dataset.id)); },
    usunWlasne: function (el) {
      const r = M.usunWlasne(el.dataset.id);
      if (!r.ok) { cichy(r.powod); return; }
      U.zamknijArkusz();
      rysuj();
      cichy('Zadanie usunięte. Zdobyte punkty zostają.');
    },

    /* --- miasto --- */
    dzielnica: function (el) { ui.dz = el.dataset.dz; rysuj(); },
    idzDoDzielnicy: function (el) { ui.dz = el.dataset.dz; ui.ekran = 'miasto'; rysuj(true); },
    anulujTryb: function () { ui.tryb = null; rysuj(); },

    pole: function (el) {
      const x = +el.getAttribute('data-x'), y = +el.getAttribute('data-y'), dz = ui.dz;
      const ob = M.obiektNa(dz, x, y), t = ui.tryb;
      if (t) {
        if (t.rodzaj === 'przenies') {
          if (ob && ob.id === t.id) { ui.tryb = null; rysuj(); return; }
          const r = M.przenies(t.id, dz, x, y);
          if (!r.ok) { cichy(r.powod); return; }
          ui.tryb = null;
          ui.nowyOb = t.id;
          U.wibruj(12);
          rysuj();
          return;
        }
        if (ob) { cichy('Ta działka jest zajęta.'); return; }
        postaw(t.typ, dz, x, y, true);
        return;
      }
      if (ob) { U.arkusz(E.arkuszObiektu(ob.id)); return; }
      const teren = M.teren(dz, x, y);
      if (teren !== '.') { cichy(teren === 'w' ? 'Tu płynie rzeka. Bulwar postawisz na działce obok.' : 'Tu rośnie las, zostaje na swoim miejscu.'); return; }
      U.arkusz(E.arkuszDzialki(dz, x, y));
    },
    postawTu: function (el) { postaw(el.dataset.typ, ui.dz, +el.dataset.x, +el.dataset.y, false); },
    postaw: function (el) {
      const typ = el.dataset.typ, def = K.obiekty[typ];
      let dz = null;
      if (M.dzielnicaOdblokowana(ui.dz) && jestMiejsce(typ, ui.dz)) dz = ui.dz;
      else M.stan().dzielnice.forEach(function (id) { if (!dz && jestMiejsce(typ, id)) dz = id; });
      if (!dz) {
        cichy(def.teren === 'przyUlicy' ? 'Przystanek musi stać przy ulicy. Zbuduj najpierw ulicę z wolną działką obok.'
          : def.teren === 'przyWodzie' ? 'Bulwar potrzebuje wolnej działki przy rzece.'
            : 'Brakuje wolnej działki. Otwórz nową dzielnicę albo coś wyburz.');
        return;
      }
      ui.dz = dz;
      ui.tryb = { rodzaj: 'buduj', typ: typ };
      ui.ekran = 'miasto';
      rysuj(true);
    },
    ulepsz: function (el) {
      const id = +el.dataset.id, ob = M.obiekt(id);
      if (!ob) return;
      const def = K.obiekty[ob.typ], r = M.ulepsz(id);
      if (!r.ok) { cichy(r.powod); return; }
      U.wibruj(18);
      ui.nowyOb = id;
      U.zamknijArkusz();
      rysuj();
      const bud = M.budowaObiektu(id);
      let t = esc(def.nazwa) + ': ' + (r.nocna && bud ? 'ekipa zaczęła budowę, gotowe ' + U.kiedy(bud.gotowe) : (def.etapy ? 'etap ' : 'poziom ') + r.poz);
      if (r.otwarta) t += '<br>Otwarto dzielnicę ' + esc(M.dzielnicaDef(r.otwarta).nazwa);
      U.toast('<b class="t-pkt">−' + fmt(r.cena) + ' pkt</b><span>' + t + '</span>', { czas: r.nocna || r.otwarta ? 3600 : 2200 });
    },
    przenies: function (el) {
      ui.tryb = { rodzaj: 'przenies', id: +el.dataset.id };
      ui.ekran = 'miasto';
      U.zamknijArkusz();
      rysuj();
    },
    wyburz: function (el) {
      const id = +el.dataset.id, ob = M.obiekt(id);
      if (!ob) return;
      U.arkusz(E.arkuszPotwierdzenia('Wyburzyć: ' + esc(K.obiekty[ob.typ].nazwa) + '?', 'Odzyskasz ' + fmt(M.zwrotZaWyburzenie(id)) + ' pkt, czyli połowę wydanych na ten obiekt. Działka będzie wolna.', 'Wyburz', 'wyburzTak', ' data-id="' + id + '"'));
    },
    wyburzTak: function (el) {
      const r = M.wyburz(+el.dataset.id);
      if (!r.ok) { cichy(r.powod); return; }
      U.zamknijArkusz();
      rysuj();
      U.toast('<b class="t-pkt">+' + fmt(r.zwrot) + ' pkt</b><span>Wyburzono</span>', { typ: 'cichy' });
    },
    kupDzielnice: function (el) {
      const dz = el.dataset.dz, r = M.kupDzielnice(dz);
      if (!r.ok) { cichy(r.powod); return; }
      U.wibruj([14, 50, 24]);
      ui.dz = dz;
      ui.ekran = 'miasto';
      rysuj(true);
      U.toast('<b class="t-pkt">−' + fmt(r.cena) + ' pkt</b><span>Otwarto dzielnicę ' + esc(M.dzielnicaDef(dz).nazwa) + '</span>', { typ: 'swieto', czas: 3600 });
    },
    promocja: function () {
      U.arkusz(E.arkuszPotwierdzenia('Włączyć dzień promocji?', 'Do końca dzisiejszego dnia gry wszystkie budowy i ulepszenia będą tańsze o ' + K.premie.promocja.rabatProcent + '%. Wykorzystasz jeden dzień z zapasu.', 'Włącz promocję', 'promocjaTak').replace('grozny-pelny', 'kup'));
    },
    promocjaTak: function () {
      const r = M.aktywujPromocje();
      U.zamknijArkusz();
      if (!r.ok) { cichy(r.powod); return; }
      rysuj();
      cichy('Promocja działa do końca dnia.');
    },

    /* --- statystyki i ustawienia --- */
    odczyt: function (el) { ui.odczyt = el.dataset.dk; rysuj(); },
    motyw: function (el) { M.ustaw('motyw', el.dataset.motyw); rysuj(); },
    zasady: function () { U.arkusz(E.arkuszZasad()); },
    eksport: function () {
      const tekst = M.eksport(), nazwa = 'miasto-kopia-' + M.dzis() + '.json';
      try {
        const url = URL.createObjectURL(new Blob([tekst], { type: 'application/json' })), a = document.createElement('a');
        a.href = url;
        a.download = nazwa;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 15000);
        cichy('Kopia zapisana jako ' + nazwa);
      } catch (e) {
        cichy('Nie udało się zapisać pliku.');
      }
      rysuj();
    },
    udostepnij: function () {
      const tekst = M.eksport();
      let obietnica;
      try {
        const plik = new File([tekst], 'miasto-kopia-' + M.dzis() + '.txt', { type: 'text/plain' });
        obietnica = navigator.share({ files: [plik], title: 'Miasto – kopia zapasowa' });
      } catch (e) { obietnica = Promise.reject(e); }
      obietnica.catch(function (e) { if (!e || e.name !== 'AbortError') cichy('Udostępnianie nie powiodło się. Użyj zapisu do pliku.'); }).then(function () { rysuj(); });
    },
    importTak: function () { const t = ui.importTekst; ui.importTekst = null; wykonajImport(t); },
    instaluj: function () {
      const e = ui.instalacja;
      if (!e) return;
      e.prompt();
      Promise.resolve(e.userChoice).catch(function () { /* nic */ }).then(function () { ui.instalacja = null; rysuj(); });
    },
    aktualizuj: function () {
      const reg = ui.rejestracja, sw = reg && (reg.active || navigator.serviceWorker.controller);
      if (!sw) { cichy('Aktualizacje działają po wgraniu aplikacji na serwer (GitHub Pages).'); return; }
      if (navigator.onLine === false) { cichy('Brak połączenia z internetem.'); return; }
      cichy('Sprawdzam…');
      sw.postMessage({ typ: 'sprawdz' });
      try { reg.update(); } catch (e) { /* nic */ }
    },
    resetPytanie: function () {
      U.arkusz(E.arkuszPotwierdzenia('Usunąć całą grę?', 'Miasto, punkty i historia znikną z tego urządzenia. Tego nie da się cofnąć. Jeśli chcesz kiedyś wrócić do tej gry, zrób najpierw kopię zapasową.', 'Usuń wszystko', 'resetTak'));
    },
    resetTak: function () { M.reset(); location.reload(); }
  };

  /* ------------------------------------------------------------------
     Formularze i ustawienia
     ------------------------------------------------------------------ */
  function zmianaUstawienia(t) {
    const S = M.stan(), k = t.dataset.ust, u = S.ust;
    const godz = /^\d\d:\d\d$/;
    if (k === 'miasto') {
      const r = M.ustawMiasto(t.value);
      if (!r.ok) { t.value = S.miasto; cichy(r.powod); }
    } else if (k === 'godzinaSnu') {
      if (godz.test(t.value)) M.ustaw(k, t.value); else t.value = u.godzinaSnu;
    } else if (k === 'celKrokow') {
      M.ustaw(k, ogranicz(t.value, 1000, 50000, u.celKrokow));
      t.value = u.celKrokow;
    } else if (k === 'limitH' || k === 'limitM') {
      const hEl = $('[data-ust="limitH"]'), mEl = $('[data-ust="limitM"]');
      const min = Math.max(5, ogranicz(hEl.value, 0, 23, 0) * 60 + ogranicz(mEl.value, 0, 59, 0));
      M.ustaw('limitEkranuMin', min);
      hEl.value = Math.floor(min / 60);
      mEl.value = min % 60;
    } else if (k === 'progDnia') {
      M.ustaw(k, ogranicz(t.value, 5, 300, M.prog()));
      t.value = M.prog();
    } else if (k === 'piesWKomplecie') {
      M.ustaw(k, t.checked);
    } else if (k.indexOf('powiad.') === 0) {
      zmianaPowiadomien(k.slice(7), t);
      return;
    }
    // pola tekstowe zostają na ekranie (bez przerysowania), żeby klawiatura się nie chowała
    rysujTablice();
    Pow.poZmianie();
  }

  function zmianaPowiadomien(pole, t) {
    const p = Object.assign({}, M.stan().ust.powiad);
    const zapisz = function () {
      M.ustaw('powiad', p);
      if (Pow.aktywne()) Pow.rejestrujTlo();
      rysuj();
    };
    if (pole === 'wlaczone') {
      if (!t.checked) { p.wlaczone = false; zapisz(); return; }
      Pow.poprosOZgode().then(function (ok) {
        p.wlaczone = ok;
        zapisz();
        if (ok) Pow.pokaz('Powiadomienia włączone', 'Dam znać, gdy budowa się skończy albo dzień będzie czekał na zaliczenie.', 'miasto-test');
        else cichy('Przeglądarka nie zezwoliła na powiadomienia.');
      });
      return;
    }
    if (pole === 'godzinaWieczor') { if (/^\d\d:\d\d$/.test(t.value)) p.godzinaWieczor = t.value; }
    else p[pole] = t.checked;
    zapisz();
  }

  function zapiszWlasne(f) {
    const el = f.elements, id = f.dataset.id;
    const pola = { nazwa: el.nazwa.value, kategoria: el.kategoria.value, punkty: el.punkty.value, typ: el.typ.value, max: el.max.value, minuty: el.minuty.value };
    const r = id ? M.edytujWlasne(id, pola) : M.dodajWlasne(pola);
    if (!r.ok) {
      const b = $('.blad-form', f);
      b.textContent = r.powod;
      b.hidden = false;
      return;
    }
    U.zamknijArkusz();
    rysuj();
    cichy(id ? 'Zapisano zmiany.' : 'Dodano zadanie.');
  }

  function startGry(f) {
    const el = f.elements, d = K.ustawieniaDomyslne;
    const lim = ogranicz(el.limitH.value, 0, 23, Math.floor(d.limitEkranuMin / 60)) * 60 + ogranicz(el.limitM.value, 0, 59, d.limitEkranuMin % 60);
    M.rozpocznij({
      miasto: String(el.miasto.value || '').trim().slice(0, 24) || K.start.nazwaMiasta,
      ust: {
        godzinaSnu: /^\d\d:\d\d$/.test(el.godzinaSnu.value) ? el.godzinaSnu.value : d.godzinaSnu,
        celKrokow: ogranicz(el.celKrokow.value, 1000, 50000, d.celKrokow),
        limitEkranuMin: Math.max(5, lim),
        piesWKomplecie: el.pies.checked
      }
    });
    wejdz();
  }

  function importZPliku(input) {
    const plik = input.files && input.files[0];
    if (!plik) return;
    const cz = new FileReader();
    cz.onload = function () {
      const tekst = String(cz.result || '');
      if (M.stan()) {
        ui.importTekst = tekst;
        U.arkusz(E.arkuszPotwierdzenia('Wczytać kopię zapasową?', 'Obecna gra na tym urządzeniu zostanie zastąpiona zawartością pliku.', 'Wczytaj kopię', 'importTak'));
      } else {
        wykonajImport(tekst);
      }
    };
    cz.onerror = function () { cichy('Nie udało się odczytać pliku.'); };
    cz.readAsText(plik);
    input.value = '';
  }
  function wykonajImport(tekst) {
    const r = M.importuj(tekst || '');
    U.zamknijArkusz();
    if (!r.ok) { U.toast('<span>' + esc(r.powod) + '</span>', { typ: 'blad', czas: 4200 }); return; }
    ui.ekran = 'dzis';
    ui.wczoraj = false;
    ui.tryb = null;
    ui.dz = K.dzielnice[0].id;
    wejdz();
    cichy('Kopia wczytana.');
  }

  /* ------------------------------------------------------------------
     Powiadomienia lokalne
     ------------------------------------------------------------------ */
  const Pow = {
    timery: [], flagi: {}, zwloka: null,

    stan: function () {
      const jest = 'Notification' in g;
      ui.powiadomienia = { dostepne: jest && 'serviceWorker' in navigator, zgoda: jest ? Notification.permission : 'default' };
    },
    poprosOZgode: function () {
      if (!('Notification' in g)) return Promise.resolve(false);
      let wynik;
      try { wynik = Notification.requestPermission(); } catch (e) { return Promise.resolve(false); }
      return Promise.resolve(wynik).then(function (z) { Pow.stan(); return (z || Notification.permission) === 'granted'; }, function () { return false; });
    },
    aktywne: function () {
      const S = M.stan();
      return !!S && !!S.ust.powiad.wlaczone && ui.powiadomienia.dostepne && ui.powiadomienia.zgoda === 'granted';
    },
    pokaz: function (tytul, tresc, tag) {
      if (!Pow.aktywne()) return;
      const opcje = { body: tresc, tag: tag, icon: 'ikona-192.png', badge: 'ikona-znak.png', lang: 'pl' };
      try {
        if (ui.rejestracja && ui.rejestracja.showNotification) ui.rejestracja.showNotification(tytul, opcje).catch(function () { /* nic */ });
        else new Notification(tytul, opcje);
      } catch (e) { /* powiadomienia niedostępne */ }
    },
    // budzik na koniec budowy i na wieczorne przypomnienie (działa, dopóki aplikacja żyje w pamięci telefonu)
    planuj: function () {
      Pow.timery.forEach(clearTimeout);
      Pow.timery = [];
      const S = M.stan();
      if (!S) return;
      const teraz = M.zegar();
      S.budowy.forEach(function (b) {
        const za = b.gotowe - teraz;
        if (za > 0 && za < 2e9) Pow.timery.push(setTimeout(tik, za + 800));
      });
      if (!Pow.aktywne() || !S.ust.powiad.wieczor) return;
      const m = /^(\d\d):(\d\d)$/.exec(S.ust.powiad.godzinaWieczor || '');
      if (!m) return;
      const d = new Date(teraz);
      d.setHours(+m[1], +m[2], 0, 0);
      const za = d.getTime() - teraz;
      if (za > 0) Pow.timery.push(setTimeout(Pow.wieczor, za + 500));
    },
    wieczor: function () {
      const S = M.stan();
      if (!S) return;
      M.tyk();
      const dk = M.dzis(), d = M.dzien(dk) || {};
      if (d.zal || Pow.flagi['w' + dk]) return;
      Pow.flagi['w' + dk] = 1;
      const brak = Math.max(0, M.prog() - (d.rdzen || 0)), seria = d.seria || 0;
      Pow.pokaz('Dzień jeszcze niezaliczony', 'Brakuje ' + fmt(brak) + ' pkt' + (seria > 0 ? ', żeby utrzymać serię (' + pl(seria, 'dzień', 'dni', 'dni') + ').' : '.'), 'miasto-wieczor');
      Pow.zapiszMeta();
    },
    // dane dla service workera, który może przypomnieć w tle (Android, zainstalowana aplikacja)
    zapiszMeta: function () {
      const S = M.stan();
      if (!S || !('caches' in g)) return;
      const meta = M.metaPowiadomien(), dk = M.dzis();
      let pamiec;
      try { pamiec = g.caches.open('miasto-meta'); } catch (e) { return; }
      pamiec.then(function (c) {
        return c.match('meta.json').then(function (r) { return r ? r.json() : null; }).catch(function () { return null; }).then(function (stare) {
          const wys = {}, dawne = (stare && stare.wyslane) || {};
          if (dawne['w' + dk] || Pow.flagi['w' + dk]) wys['w' + dk] = 1;
          meta.budowy.forEach(function (b) { const k = 'b' + b.id + ':' + b.gotowe; if (dawne[k] || Pow.flagi[k]) wys[k] = 1; });
          meta.wyslane = wys;
          return c.put('meta.json', new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } }));
        });
      }).catch(function () { /* pamięć podręczna niedostępna */ });
    },
    rejestrujTlo: function () {
      const reg = ui.rejestracja;
      if (!reg || !('periodicSync' in reg) || !navigator.permissions) return;
      navigator.permissions.query({ name: 'periodic-background-sync' }).then(function (st) {
        if (st.state === 'granted') return reg.periodicSync.register('miasto-przypomnienia', { minInterval: 3 * 3600 * 1000 });
      }).catch(function () { /* przeglądarka bez synchronizacji w tle */ });
    },
    poZmianie: function () {
      clearTimeout(Pow.zwloka);
      Pow.zwloka = setTimeout(function () { Pow.planuj(); Pow.zapiszMeta(); }, 600);
    }
  };

  /* ------------------------------------------------------------------
     Upływ czasu
     ------------------------------------------------------------------ */
  function pokazZdarzenia() {
    if (!M.stan() || document.hidden || U.arkuszOtwarty()) return;
    const lista = M.zdarzenia();
    if (!lista.length) return;
    U.arkusz(E.arkuszZdarzen(lista), { poZamknieciu: function () { M.wyczyscZdarzenia(); } });
  }

  function tik() {
    if (!M.stan()) return;
    const przed = M.dzis(), ileZdarzen = M.zdarzenia().length;
    const zmiana = M.tyk();
    if (M.dzis() !== przed) ui.wczoraj = false;
    if (zmiana || wyliczMotyw() !== ui.motyw || G.faza(M.zegar()) !== ui.faza) rysuj();
    if (!zmiana) return;
    if (document.hidden) {
      M.zdarzenia().slice(ileZdarzen).forEach(function (z) {
        if (z.typ !== 'budowa' || !M.stan().ust.powiad.budowa) return;
        const def = K.obiekty[z.obiekt] || { nazwa: 'Budowa', koszt: [] };
        Pow.pokaz('Budowa zakończona', def.nazwa + (def.koszt.length > 1 ? ', ' + (def.etapy ? 'etap ' : 'poziom ') + z.poz : '') + ' czeka w mieście.', 'miasto-budowa-' + z.id);
      });
    } else {
      pokazZdarzenia();
    }
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  function pokazPowitanie() {
    document.body.classList.add('bez-gry');
    ustawMotyw();
    $('#tablica').innerHTML = '<div class="tablica-pas"><span>Gra motywacyjna</span><span></span></div><div class="tablica-pole"><h1>Miasto</h1></div>';
    $('#zakladki').innerHTML = '';
    const main = $('#ekran');
    main.className = 'ekran ekran-powitanie';
    main.innerHTML = E.powitanie();
  }

  function wejdz() {
    document.body.classList.remove('bez-gry');
    ui.ostPkt = null;
    rysuj(true);
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () { /* nic */ }); } catch (e) { /* nic */ }
    setTimeout(pokazZdarzenia, 500);
  }

  function rejestrujSW() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      ui.rejestracja = reg;
      Pow.poZmianie();
      if (Pow.aktywne()) Pow.rejestrujTlo();
    }).catch(function () { /* np. brak HTTPS */ });
    const nowaWersja = function () {
      if (ui.jestAktualizacja) return;
      ui.jestAktualizacja = true;
      U.toast('<span>Jest nowa wersja aplikacji.</span><button class="maly" data-a="odswiezStrone">Odśwież</button>', { typ: 'trwaly', czas: Infinity });
    };
    navigator.serviceWorker.addEventListener('message', function (e) {
      const typ = e.data && e.data.typ;
      if (typ === 'nowa-wersja') nowaWersja();
      else if (typ === 'aktualna') cichy('Masz najnowszą wersję.');
    });
    // podmiana samego service workera (np. po dopisaniu nowego pliku do listy) też oznacza nową wersję
    const bylKontroler = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (bylKontroler) nowaWersja(); });
  }

  document.addEventListener('click', function (e) {
    const cel = e.target;
    if (!cel || !cel.closest) return;
    const pole = cel.closest('.mapa .pole');
    if (pole) { A.pole(pole); return; }
    const el = cel.closest('[data-a]');
    if (!el || el.disabled) return;
    const f = A[el.getAttribute('data-a')];
    if (f) f(el, e);
  });
  document.addEventListener('keydown', function (e) {
    const t = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && t && t.matches && t.matches('[role="button"][data-a]')) { e.preventDefault(); t.click(); }
    else if (e.key === 'Escape' && U.arkuszOtwarty()) U.zamknijArkusz();
  });
  document.addEventListener('change', function (e) {
    const t = e.target;
    if (!t || !t.dataset) return;
    if (t.dataset.ust) zmianaUstawienia(t);
    else if (t.dataset.zmiana === 'import') importZPliku(t);
    else if (t.dataset.zmiana === 'typWlasnego') U.$$('[data-dla]', t.form).forEach(function (el) { el.hidden = el.getAttribute('data-dla') !== t.value; });
  });
  document.addEventListener('submit', function (e) {
    const f = e.target;
    e.preventDefault();
    if (f.dataset.formularz === 'start') startGry(f);
    else if (f.dataset.formularz === 'wlasne') zapiszWlasne(f);
  });

  g.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    ui.instalacja = e;
    if (M.stan() && ui.ekran === 'ustawienia') rysuj();
  });
  g.addEventListener('appinstalled', function () { ui.instalacja = null; ui.zainstalowana = true; if (M.stan()) rysuj(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { Pow.stan(); tik(); pokazZdarzenia(); } });
  g.addEventListener('pageshow', function () { tik(); });

  function start() {
    Pow.stan();
    try { ui.zainstalowana = (g.matchMedia && g.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) { /* nic */ }
    try {
      const probny = new File(['{}'], 'kopia.txt', { type: 'text/plain' });
      ui.moznaUdostepnic = !!(navigator.canShare && navigator.share && navigator.canShare({ files: [probny] }));
    } catch (e) { ui.moznaUdostepnic = false; }
    try { rejestrujSW(); } catch (e) { /* np. ramka bez dostępu do service workera */ }
    if (M.wczytaj()) {
      M.tyk();
      wejdz();
      if (M.odzyskano) U.toast('<span>Zapis gry był uszkodzony. Przywrócono ostatnią automatyczną kopię.</span>', { czas: 5000 });
    } else {
      pokazPowitanie();
    }
    setInterval(tik, 20000);
  }

  start();
})(window);
