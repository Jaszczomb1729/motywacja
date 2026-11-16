/* =====================================================================
   MIASTO – ekrany i arkusze (budują kod HTML na podstawie stanu gry)
   ===================================================================== */
(function (g) {
  'use strict';

  const K = g.KONFIG, M = g.M, G = g.G, U = g.U;
  const E = {};
  g.E = E;

  const esc = U.esc, ik = U.ik, fmt = M.fmt;
  const ID_EKRANU = (K.zadania.filter(function (z) { return z.typ === 'ekran'; })[0] || {}).id;
  const KAT = {};
  K.kategorie.forEach(function (k) { KAT[k.id] = k; });

  const PREMIE = {
    budynki: 'Budynki', komplet: 'Komplet podstaw', sesja: 'Pierwsza sesja nauki', zd: 'Zadanie dnia',
    seria: 'Seria', zielen: 'Zieleń', tydz: 'Wyzwanie tygodnia'
  };
  const GRUPY = [
    ['moc', 'Budynki z mocami'], ['mieszkania', 'Mieszkania'], ['infra', 'Ulice i komunikacja'],
    ['zielen', 'Zieleń'], ['znak', 'Punkty orientacyjne']
  ];
  const GRUNT = { srodmiescie: '#b4d59a', porzecze: '#a8d28a', zieliborz: '#97cc7b', zarzecze: '#bcd3a0' };

  const pl = (n, a, b, c) => fmt(n) + ' ' + M.odmiana(n, a, b, c);
  const mnoznik = () => String(K.premie.zadanieDnia.mnoznik).replace('.', ',');
  const duza = s => s.charAt(0).toUpperCase() + s.slice(1);

  E.kolorKat = function (id) { const k = KAT[id] || K.kategorie[0]; return U.noc() ? k.kolorNoc : k.kolor; };
  E.faza = () => G.faza(M.zegar());
  E.nocMiasta = () => E.faza() !== 'dzien';
  E.tytul = function (ui) {
    if (ui.ekran === 'dzis') return ui.wczoraj && M.wczoraj() >= M.stan().start ? 'Wczoraj' : 'Dziś';
    if (ui.ekran === 'miasto') return M.dzielnicaDef(ui.dz).nazwa;
    return { budowa: 'Budowa', statystyki: 'Statystyki', ustawienia: 'Ustawienia' }[ui.ekran];
  };

  function wskazowka(id, tekst) {
    if (M.stan().wskazowki[id]) return '';
    return '<div class="wskazowka"><p>' + tekst + '</p><button data-a="ukryjWskazowke" data-id="' + id + '" aria-label="Zamknij wskazówkę">' + ik('x') + '</button></div>';
  }
  function cenaHtml(koszt) {
    if (koszt.cena < koszt.baza) return '<s>' + fmt(koszt.baza) + '</s> ' + fmt(koszt.cena) + ' pkt';
    return fmt(koszt.cena) + ' pkt';
  }
  function brakTekst(o) {
    const inne = o.braki.filter(b => b.indexOf('Wymaga:') !== 0);
    return inne[0] || 'Najpierw spełnij wymagania.';
  }
  function listaWymagan(wym) {
    if (!wym || !wym.length) return '';
    return '<ul class="wymagania">' + wym.map(w => '<li class="' + (w.ok ? 'ok' : 'brak') + '">' + ik(w.ok ? 'ptaszek' : 'x') + '<span>' + esc(w.tekst) + '</span></li>').join('') + '</ul>';
  }

  /* =====================================================================
     DZIŚ
     ===================================================================== */
  E.dzienWidoku = function (ui) {
    const wcz = M.wczoraj();
    return (ui.wczoraj && wcz >= M.stan().start) ? wcz : M.dzis();
  };

  E.dzis = function (ui) {
    const S = M.stan(), dzis = M.dzis(), wcz = M.wczoraj(), dk = E.dzienWidoku(ui), toDzis = dk === dzis;
    const d = M.dzien(dk) || { w: [], pr: {} };
    let h = '';
    if (wcz >= S.start) {
      h += '<div class="przelacznik" role="tablist" aria-label="Dzień">' +
        '<button role="tab" aria-selected="' + !toDzis + '" class="' + (toDzis ? '' : 'aktywny') + '" data-a="dzien" data-ktory="wczoraj">Wczoraj</button>' +
        '<button role="tab" aria-selected="' + toDzis + '" class="' + (toDzis ? 'aktywny' : '') + '" data-a="dzien" data-ktory="dzis">Dziś</button></div>';
    }
    h += kartaDnia(dk, d, toDzis);
    if (toDzis) {
      h += wskazowka('start', 'Dotknij zadania, żeby je odhaczyć. Za punkty rozbudujesz miasto w zakładce Budowa.');
      h += kartaZD(d) + kartaWyzwania();
    } else {
      h += '<p class="uwaga">' + ik('info') + '<span>Uzupełniasz wczorajszy dzień. Punkty i seria przeliczą się od razu.</span></p>';
    }
    h += K.kategorie.map(k => sekcja(k, dk, d, ui)).join('');
    h += '<button class="przycisk drugi szeroki" data-a="noweZadanie">' + ik('plus') + 'Dodaj własne zadanie</button>';
    return h;
  };

  function kartaDnia(dk, d, toDzis) {
    const prog = M.prog(), rdzen = d.rdzen || 0, zal = !!d.zal, ser = M.seria();
    const seria = toDzis ? ser.dni : (d.seria || 0);
    const proc = Math.max(0, Math.min(100, Math.round(rdzen / prog * 100)));
    let stan;
    if (zal) stan = ik('ptaszek') + '<span>Dzień zaliczony</span>';
    else stan = '<span>Do zaliczenia dnia brakuje ' + fmt(Math.max(0, prog - rdzen)) + ' pkt</span>';
    let seriaOpis = M.odmiana(seria, 'dzień serii', 'dni serii', 'dni serii');
    if (toDzis && !zal && seria > 0) seriaOpis += ', czeka na dziś';
    const pr = d.pr || {};
    const premie = Object.keys(pr).filter(k => pr[k]).map(k => '<li><span>' + (PREMIE[k] || k) + '</span><b>+' + fmt(pr[k]) + '</b></li>').join('');
    return '<section class="karta dzien' + (zal ? ' zaliczony' : '') + '">' +
      '<div class="dzien-gora">' +
      '<div class="dzien-pkt"><strong>' + fmt(d.pkt || 0) + '</strong><span>pkt ' + (toDzis ? 'dziś' : 'wczoraj') + '</span></div>' +
      '<div class="dzien-seria">' + ik('plomien') + '<b>' + fmt(seria) + '</b><span>' + seriaOpis + '</span></div>' +
      '</div>' +
      '<div class="prog"><div class="tor" role="progressbar" aria-valuemin="0" aria-valuemax="' + prog + '" aria-valuenow="' + Math.min(rdzen, prog) + '"><div class="pasek" style="width:' + proc + '%"></div></div>' +
      '<p class="prog-opis">' + stan + '</p></div>' +
      liniaTygodnia(dk) +
      (premie ? '<ul class="premie">' + premie + '</ul>' : '') +
      '</section>';
  }

  // Tydzień jako linia z siedmioma przystankami
  function liniaTygodnia(dk) {
    const S = M.stan(), pon = M.poniedzialek(dk), dzis = M.dzis();
    let h = '';
    for (let i = 0; i < 7; i++) {
      const k = M.przesun(pon, i), d = S.dni[k];
      let kl = 'przyst', znak = '', opis = 'jeszcze przed nami';
      if (k > dzis) kl += ' przyszly';
      else if (k < S.start) { kl += ' przyszly'; opis = 'przed początkiem gry'; }
      else if (d && d.zal) { kl += ' zal'; znak = ik('ptaszek'); opis = 'zaliczony'; }
      else if (d && d.ochr) { kl += ' ochr'; znak = ik('tarcza'); opis = 'ochrona serii'; }
      else if (k < dzis) { kl += ' pusty'; opis = 'niezaliczony'; }
      else opis = 'w toku';
      if (k === dzis) kl += ' dzis';
      h += '<li class="' + kl + '" aria-label="' + U.SKROTY_DNI[i] + ': ' + opis + '"><span class="kolko">' + znak + '</span><span class="skrot">' + U.SKROTY_DNI[i] + '</span></li>';
    }
    return '<ol class="linia-tyg">' + h + '</ol>';
  }

  function kartaZD(d) {
    const zd = d.zd;
    if (!zd) {
      return '<button class="karta wybor zd" data-a="wybierzZD"><span class="znak">' + ik('gwiazda') + '</span>' +
        '<span class="wybor-opis"><b>Wybierz zadanie dnia</b><small>Najważniejsze albo najdłużej odkładane. Punkty ×' + mnoznik() + '.</small></span>' + ik('dalej') + '</button>';
    }
    const z = M.zadanie(zd.t), st = M.stanZadania(zd.t), zrobione = st.ile > 0, premia = (d.pr && d.pr.zd) || 0;
    return '<div class="karta wybor zd wybrane' + (zrobione ? ' zrobione' : '') + '"><span class="znak">' + ik('gwiazda') + '</span>' +
      '<span class="wybor-opis"><small>Zadanie dnia' + (zrobione ? ', wykonane' : ', punkty ×' + mnoznik()) + '</small><b>' + esc(z ? M.nazwaZadania(z) : 'Usunięte zadanie') + '</b>' +
      (zd.n ? '<span class="notatka">' + esc(zd.n) + '</span>' : '') + '</span>' +
      (zrobione ? '<span class="nagroda">+' + fmt(premia) + '</span>' : '<button class="maly" data-a="wybierzZD">Zmień</button>') + '</div>';
  }

  function zostaloDni(n) {
    if (n <= 0) return 'ostatni dzień';
    return (n === 1 ? 'został ' : 'zostało ') + pl(n, 'dzień', 'dni', 'dni');
  }
  function kartaWyzwania() {
    const w = M.wyzwanie(), pkt = K.premie.wyzwanie.punkty;
    if (!w.wybrane) {
      return '<button class="karta wybor wyzw" data-a="wybierzWyzwanie"><span class="znak">' + ik('cel') + '</span>' +
        '<span class="wybor-opis"><b>Wybierz wyzwanie tygodnia</b><small>Premia +' + pkt + ' pkt. ' + (w.zostaloDni <= 0 ? 'Dziś ostatni dzień tygodnia.' : 'Do niedzieli ' + zostaloDni(w.zostaloDni) + '.') + '</small></span>' + ik('dalej') + '</button>';
    }
    const proc = Math.round(w.postep / w.cel * 100);
    const ile = w.def.miara === 'minuty' ? M.czas(w.postep) + ' z ' + M.czas(w.cel) : fmt(w.postep) + ' z ' + fmt(w.cel);
    return '<div class="karta wyzw-karta' + (w.zrobione ? ' zrobione' : '') + '">' +
      '<div class="wyzw-gora"><span class="znak">' + ik('cel') + '</span><span class="wybor-opis"><small>Wyzwanie tygodnia</small><b>' + esc(w.def.nazwa) + '</b></span>' +
      '<span class="nagroda">' + (w.zrobione ? ik('ptaszek') : '') + '+' + pkt + '</span></div>' +
      '<div class="tor"><div class="pasek" style="width:' + proc + '%"></div></div>' +
      '<p class="prog-opis"><span>' + ile + (w.zrobione ? ', zaliczone' : ', ' + zostaloDni(w.zostaloDni)) + '</span>' +
      (!w.zrobione && w.postep === 0 ? '<button class="maly" data-a="wybierzWyzwanie">Zmień</button>' : '') + '</p></div>';
  }

  function sekcja(k, dk, d, ui) {
    const zad = M.zadania().filter(z => z.kategoria === k.id);
    if (!zad.length) return '';
    const kolor = E.kolorKat(k.id), zw = !!(M.stan().ust.zwiniete || {})[k.id];
    const pkt = (d.kat && d.kat[k.id]) || 0;
    let dod = '';
    if (k.id === K.kategorie[0].id) { const kp = M.komplet(dk); dod = '<span class="kat-dod">komplet ' + kp.zrobione + ' z ' + kp.wszystkie + '</span>'; }
    return '<section class="kat' + (zw ? ' zwinieta' : '') + '" style="--kat:' + kolor + ';--kat-tusz:' + U.tekstNa(kolor) + '">' +
      '<button class="kat-nagl" data-a="zwin" data-kat="' + k.id + '" aria-expanded="' + !zw + '">' +
      '<span class="kat-ikona">' + ik(k.ikona) + '</span><span class="kat-nazwa">' + esc(k.nazwa) + '</span>' + dod +
      (pkt ? '<span class="kat-pkt">' + fmt(pkt) + ' pkt</span>' : '') + ik('zwin', 'strzalka') + '</button>' +
      (zw ? '' : '<div class="kat-lista">' + zad.map(z => wiersz(z, dk, d, ui)).join('') + '</div>') +
      '</section>';
  }

  function wiersz(z, dk, d, ui) {
    const st = M.stanZadania(z.id, dk), zrobione = st.ile > 0;
    const jestZD = !!(d.zd && d.zd.t === z.id && dk === M.dzis());
    let kl = 'zad', stan = '', opis = z.opis || '', pelne = false;
    if (z.typ === 'ekran') {
      if (st.wartosc != null) {
        stan = M.czas(st.wartosc);
        if (st.pkt > 0) { pelne = true; opis = 'w limicie'; } else { kl += ' ponad'; opis = 'ponad limit, bez punktów'; }
      }
    } else if (z.typ === 'raz') {
      pelne = zrobione;
    } else if (z.typ === 'licznik') {
      if (zrobione) stan = st.ile + ' z ' + st.max;
      pelne = st.pelne;
    } else {
      opis = (opis ? opis + ', ' : '') + 'za każde ' + z.minuty + ' min';
      if (zrobione) {
        stan = M.czas(st.minuty);
        if (z.limitMin && st.minuty >= z.limitMin) opis = 'dzienny limit punktów: ' + M.czas(z.limitMin);
      }
    }
    if (st.blokada) { kl += ' zablok'; opis = 'zaliczone przez: ' + M.nazwaZadania(M.zadanie(st.blokada)).toLowerCase(); }
    if (pelne) kl += ' pelne'; else if (zrobione) kl += ' czesc';
    if (jestZD) kl += ' jest-zd';
    if (ui.blysk === z.id) kl += ' blysk';
    const bonus = st.procent > 0 ? '<span class="zad-bonus">+' + Math.round(st.procent * 100) + '%</span>' : '';
    const cofanie = zrobione && z.typ !== 'raz' && z.typ !== 'ekran';
    return '<div class="' + kl + '" data-a="odhacz" data-z="' + z.id + '" role="button" tabindex="0" aria-pressed="' + zrobione + '">' +
      '<span class="numer">' + (pelne ? ik('ptaszek') : z.punkty) + '</span>' +
      '<span class="zad-tekst"><span class="zad-nazwa">' + esc(M.nazwaZadania(z)) + (jestZD ? ik('gwiazda', 'gw') : '') + bonus + '</span>' +
      (opis ? '<span class="zad-opis">' + esc(opis) + '</span>' : '') + '</span>' +
      (stan ? '<span class="zad-stan">' + stan + '</span>' : '') +
      (cofanie ? '<button class="cofnij" data-a="cofnij" data-z="' + z.id + '" aria-label="Cofnij jedno odhaczenie">' + ik('minus') + '</button>' : '') +
      '</div>';
  }

  /* ---------- arkusze ekranu „Dziś” ---------- */
  E.arkuszZD = function () {
    const d = M.dzien() || { w: [] }, obecne = d.zd, cfg = K.premie.zadanieDnia;
    let h = '<h2>Zadanie dnia</h2><p class="arkusz-opis">Jedno zadanie, na którym dziś zależy ci najbardziej albo które odkładasz najdłużej. ' +
      'Dostaniesz za nie ' + mnoznik() + ' razy więcej punktów (premia najwyżej ' + cfg.maxPremia + ' pkt).</p>' +
      '<label class="pole">Co dokładnie? (nieobowiązkowe)<input type="text" id="zd-notatka" maxlength="80" autocomplete="off" placeholder="np. rozdział o nerkach" value="' + esc(obecne ? obecne.n : '') + '"></label>';
    K.kategorie.forEach(function (k) {
      const zad = M.zadania().filter(function (z) {
        if (z.kategoria !== k.id) return false;
        const st = M.stanZadania(z.id);
        return st.ile === 0 && !st.blokada;
      });
      if (!zad.length) return;
      h += '<h3 class="lista-nagl" style="--kat:' + E.kolorKat(k.id) + '"><i></i>' + esc(k.nazwa) + '</h3><div class="lista-wyboru">' +
        zad.map(function (z) {
          const premia = Math.max(1, Math.min(Math.round(z.punkty * (cfg.mnoznik - 1)), cfg.maxPremia));
          return '<button data-a="ustawZD" data-z="' + z.id + '" class="' + (obecne && obecne.t === z.id ? 'wybrane' : '') + '"><span>' + esc(M.nazwaZadania(z)) + '</span><b>' + z.punkty + ' + ' + premia + '</b></button>';
        }).join('') + '</div>';
    });
    if (obecne) h += '<button class="przycisk drugi szeroki" data-a="ustawZD" data-z="">Zrezygnuj z zadania dnia</button>';
    return h;
  };

  E.arkuszWyzwania = function () {
    const pkt = K.premie.wyzwanie.punkty, w = M.wyzwanie();
    return '<h2>Wyzwanie tygodnia</h2><p class="arkusz-opis">Wybierz jeden cel do niedzieli. Liczy się postęp od dziś. Za wykonanie dostaniesz +' + pkt + ' pkt.</p>' +
      '<div class="lista-wyboru">' + K.wyzwania.map(function (def) {
        return '<button data-a="ustawWyzwanie" data-id="' + def.id + '" class="' + (w.wybrane && w.def.id === def.id ? 'wybrane' : '') + '"><span>' + esc(def.nazwa) + '</span><b>+' + pkt + '</b></button>';
      }).join('') + '</div>';
  };

  E.arkuszEkran = function (dk) {
    const S = M.stan(), st = M.stanZadania(ID_EKRANU, dk), jest = st.wartosc != null;
    const hh = jest ? Math.floor(st.wartosc / 60) : '', mm = jest ? st.wartosc % 60 : '';
    return '<h2>Czas ekranowy</h2><p class="arkusz-opis">Przepisz czas z ustawień telefonu (' + (dk === M.dzis() ? 'dzisiejszy' : 'wczorajszy') + ' dzień). ' +
      'Punkty dostaniesz, gdy zmieścisz się w limicie: ' + M.czas(S.ust.limitEkranuMin) + '.</p>' +
      '<div class="pola-2"><label class="pole">Godziny<input type="number" id="ek-h" min="0" max="24" inputmode="numeric" value="' + hh + '" data-fokus></label>' +
      '<label class="pole">Minuty<input type="number" id="ek-m" min="0" max="59" inputmode="numeric" value="' + mm + '"></label></div>' +
      '<button class="przycisk szeroki" data-a="zapiszEkran">Zapisz</button>' +
      (jest ? '<button class="przycisk drugi szeroki" data-a="usunEkran">Usuń wpis</button>' : '');
  };

  E.arkuszWlasne = function (id) {
    const z = id ? M.zadanie(id) : null, typ = z ? z.typ : 'raz';
    const opcja = (v, t, wybr) => '<option value="' + v + '"' + (wybr ? ' selected' : '') + '>' + t + '</option>';
    return '<h2>' + (z ? 'Edycja zadania' : 'Własne zadanie') + '</h2>' +
      '<form data-formularz="wlasne" data-id="' + (id || '') + '" novalidate>' +
      '<label class="pole">Nazwa<input type="text" name="nazwa" maxlength="60" required autocomplete="off" value="' + esc(z ? z.nazwa : '') + '"' + (z ? '' : ' data-fokus') + '></label>' +
      '<label class="pole">Kategoria<select name="kategoria">' + K.kategorie.map(k => opcja(k.id, esc(k.nazwa), z && z.kategoria === k.id)).join('') + '</select></label>' +
      '<div class="pola-2"><label class="pole">Punkty<input type="number" name="punkty" min="1" max="100" inputmode="numeric" value="' + (z ? z.punkty : 5) + '"></label>' +
      '<label class="pole">Rodzaj<select name="typ" data-zmiana="typWlasnego">' + opcja('raz', 'raz dziennie', typ === 'raz') + opcja('licznik', 'kilka razy dziennie', typ === 'licznik') + opcja('czas', 'na czas', typ === 'czas') + '</select></label></div>' +
      '<label class="pole" data-dla="licznik"' + (typ === 'licznik' ? '' : ' hidden') + '>Najwyżej ile razy dziennie<input type="number" name="max" min="2" max="10" inputmode="numeric" value="' + (z && z.max ? z.max : 3) + '"></label>' +
      '<label class="pole" data-dla="czas"' + (typ === 'czas' ? '' : ' hidden') + '>Punkty liczone za każde<select name="minuty">' + opcja(15, '15 minut', z && z.minuty === 15) + opcja(30, '30 minut', !z || !z.minuty || z.minuty === 30) + opcja(60, '60 minut', z && z.minuty === 60) + '</select></label>' +
      '<p class="blad-form" hidden></p>' +
      '<button class="przycisk szeroki" type="submit">' + (z ? 'Zapisz zmiany' : 'Dodaj zadanie') + '</button>' +
      (z ? '<button class="przycisk drugi grozny szeroki" type="button" data-a="usunWlasne" data-id="' + id + '">' + ik('kosz') + 'Usuń zadanie</button>' : '') +
      '</form>';
  };

  /* =====================================================================
     MIASTO
     ===================================================================== */
  function daneMapy(dz, ui) {
    const N = M.N, pola = [], t = ui.tryb;
    const typTrybu = t ? (t.rodzaj === 'przenies' ? (M.obiekt(t.id) || {}).typ : t.typ) : null;
    const ulica = (x, y) => { const s = M.obiektNa(dz, x, y); return !!s && s.typ === 'ulica'; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const teren = M.teren(dz, x, y), ob = M.obiektNa(dz, x, y);
      let o = null, klasy = '';
      if (ob) {
        const bud = M.budowaObiektu(ob.id), max = M.maxPoziom(ob.typ);
        o = { typ: ob.typ, poz: ob.poz, seed: ob.id * 7 + 3, budowa: !!bud && ob.poz > 0 };
        const def = K.obiekty[ob.typ];
        if (max > 1 && (def.grupa === 'moc' || def.etapy || bud)) o.plakietka = bud ? bud.doPoz : ob.poz;
        if (ob.typ === 'ulica') o.sasiedzi = { px: ulica(x + 1, y), nx: ulica(x - 1, y), py: ulica(x, y + 1), ny: ulica(x, y - 1) };
        if (ob.typ === 'bulwar') {
          o.woda = M.teren(dz, x + 1, y) === 'w' ? 'px' : M.teren(dz, x - 1, y) === 'w' ? 'nx' : M.teren(dz, x, y + 1) === 'w' ? 'py' : 'ny';
        }
        if (ui.nowyOb === ob.id) klasy += ' nowe';
        if (t && t.rodzaj === 'przenies' && t.id === ob.id) klasy += ' wybrane';
      } else if (typTrybu && teren === '.' && M.moznaTu(typTrybu, dz, x, y, t.rodzaj === 'przenies' ? t.id : undefined).ok) {
        klasy += ' cel';
      }
      pola.push({ x: x, y: y, teren: teren, ob: o, klasy: klasy.trim() });
    }
    return { n: N, noc: E.nocMiasta(), kolor: GRUNT[dz], pola: pola };
  }

  E.miasto = function (ui) {
    const dz = ui.dz, e = M.ekipy();
    let h = '<div class="dzielnice" role="tablist" aria-label="Dzielnice">' + K.dzielnice.map(function (d) {
      const o = M.dzielnicaOdblokowana(d.id);
      return '<button role="tab" aria-selected="' + (d.id === dz) + '" class="' + (d.id === dz ? 'aktywna' : '') + (o ? '' : ' zamknieta') + '" data-a="dzielnica" data-dz="' + d.id + '">' + (o ? '' : ik('klodka')) + esc(d.nazwa) + '</button>';
    }).join('') + '</div>';
    if (!M.dzielnicaOdblokowana(dz)) return h + panelZamknietej(dz);

    if (ui.tryb) {
      if (ui.tryb.rodzaj === 'przenies') {
        const ob = M.obiekt(ui.tryb.id);
        h += '<div class="tryb"><span>Wskaż nową działkę: <b>' + esc(ob ? K.obiekty[ob.typ].nazwa : '') + '</b></span><button data-a="anulujTryb">Anuluj</button></div>';
      } else {
        const o = M.oferta(ui.tryb.typ);
        h += '<div class="tryb"><span>Wskaż działkę: <b>' + esc(o.def.nazwa) + '</b>' + (o.koszt ? ', ' + cenaHtml(o.koszt) : '') + '</span><button data-a="anulujTryb">Gotowe</button></div>';
      }
    }
    h += '<div class="niebo niebo-' + E.faza() + '">' + G.mapa(daneMapy(dz, ui)) + '</div>';
    const ziel = M.bonusZieleni();
    h += '<ul class="liczniki">' +
      '<li>' + ik('ludzie') + '<b>' + fmt(M.mieszkancy()) + '</b><span>' + M.odmiana(M.mieszkancy(), 'mieszkaniec', 'mieszkańców', 'mieszkańców') + '</span></li>' +
      '<li>' + ik('lisc') + '<b>+' + ziel + '</b><span>pkt do serii za zieleń</span></li>' +
      '<li>' + ik('dzwig') + '<b>' + e.zajete + ' z ' + e.razem + '</b><span>' + (e.razem > 1 ? 'ekipy zajęte' : 'ekipa zajęta') + '</span></li>' +
      '<li>' + ik('plus') + '<b>' + M.wolneDzialki(dz) + '</b><span>' + M.odmiana(M.wolneDzialki(dz), 'wolna działka', 'wolne działki', 'wolnych działek') + ' tutaj</span></li></ul>';
    h += wskazowka('miasto', 'Dotknij wolnej działki, żeby coś postawić. Dotknij budynku, żeby go ulepszyć, przenieść albo wyburzyć.');
    h += budowyWToku();
    return h;
  };

  function panelZamknietej(dz) {
    const s = M.sprawdzDzielnice(dz), d = s.def;
    let akcja;
    if (s.kupowana) {
      akcja = '<button class="przycisk kup szeroki" data-a="kupDzielnice" data-dz="' + dz + '"' + (s.ok ? '' : ' disabled') + '>Otwórz dzielnicę za ' + cenaHtml(s.koszt) + '</button>' +
        (s.ok ? '' : '<p class="brak-info">' + esc(brakTekst(s)) + '</p>');
    } else {
      akcja = '<p class="brak-info">Tę dzielnicę otworzy ' + esc(K.obiekty[d.przezObiekt].nazwa) + '. Znajdziesz ją w zakładce Budowa.</p>';
    }
    return '<section class="karta zamknieta-dz"><div class="klodka-duza">' + ik('klodka') + '</div><h2>' + esc(d.nazwa) + '</h2><p>' + esc(d.opis) + '</p>' + listaWymagan(s.wym) + akcja + '</section>';
  }

  function budowyWToku() {
    const S = M.stan();
    if (!S.budowy.length) return '';
    return '<section class="karta budowy"><h2>W budowie</h2><ul>' + S.budowy.map(function (b) {
      const ob = M.obiekt(b.id);
      if (!ob) return '';
      const def = K.obiekty[ob.typ];
      return '<li>' + ik('dzwig') + '<span><b>' + esc(def.nazwa) + '</b>' + (M.maxPoziom(ob.typ) > 1 ? ', ' + (def.etapy ? 'etap ' : 'poziom ') + b.doPoz : '') + '</span><span class="kiedy">gotowe ' + U.kiedy(b.gotowe) + '</span></li>';
    }).join('') + '</ul></section>';
  }

  function blokUlepszenia(o, id) {
    const etap = o.def.etapy ? 'Etap' : 'Poziom';
    return '<div class="ulepszenie">' +
      '<p class="ob-efekt"><span>' + etap + ' ' + o.poz + '</span><b>' + esc(M.opisEfektu(o.typ, o.poz)) + '</b></p>' +
      listaWymagan(o.wym) +
      '<button class="przycisk kup szeroki" data-a="ulepsz" data-id="' + id + '"' + (o.ok ? '' : ' disabled') + '>Ulepsz za ' + cenaHtml(o.koszt) + '</button>' +
      (o.ok ? (o.nocna ? '<p class="brak-info">' + ik('ksiezyc') + 'Budowa potrwa przez noc, gotowe ' + U.kiedy(M.czasGotowosci()) + '.</p>' : '')
        : '<p class="brak-info">' + esc(brakTekst(o)) + '</p>') +
      '</div>';
  }

  E.arkuszObiektu = function (id) {
    const ob = M.obiekt(id);
    if (!ob) return '';
    const def = K.obiekty[ob.typ], max = M.maxPoziom(ob.typ), o = M.ofertaUlepszenia(id);
    const etap = def.etapy ? 'etap' : 'poziom';
    let h = '<div class="ob-gora"><div class="ob-rys niebo-' + E.faza() + '">' + G.miniatura(ob.typ, ob.poz, { noc: E.nocMiasta(), seed: ob.id * 7 + 3 }) + '</div><div class="ob-opis">' +
      '<h2>' + esc(def.nazwa) + '</h2>' +
      '<p class="ob-poziom">' + (ob.poz < 1 ? 'plac budowy' : (max > 1 ? etap + ' ' + ob.poz + ' z ' + max : '')) + '</p>' +
      '<p>' + esc(def.opis) + '</p></div></div>';
    const efekt = M.opisEfektu(ob.typ, ob.poz);
    if (efekt) h += '<p class="ob-efekt teraz"><span>Teraz</span><b>' + esc(efekt) + '</b></p>';
    if (o.stan === 'budowa') {
      const co = (ob.poz < 1 || max < 2) ? 'Budowa będzie gotowa ' : duza(etap) + ' ' + o.bud.doPoz + ' będzie gotowy ';
      h += '<p class="ob-info">' + ik('zegar') + '<span>Ekipa pracuje. ' + co + U.kiedy(o.bud.gotowe) + '.</span></p>';
    } else if (o.stan === 'max') {
      if (max > 1) h += '<p class="ob-info">' + ik('ptaszek') + '<span>To najwyższy ' + etap + '.</span></p>';
    } else {
      h += blokUlepszenia(o, id);
    }
    h += '<div class="ob-akcje"><button class="przycisk drugi" data-a="przenies" data-id="' + id + '">' + ik('przenies') + 'Przenieś</button>';
    if (!def.unikat && o.stan !== 'budowa') {
      h += '<button class="przycisk drugi grozny" data-a="wyburz" data-id="' + id + '">' + ik('kosz') + 'Wyburz, zwrot ' + fmt(M.zwrotZaWyburzenie(id)) + ' pkt</button>';
    }
    return h + '</div>';
  };

  E.arkuszDzialki = function (dz, x, y) {
    const noc = E.nocMiasta();
    let h = '<h2>Co tu postawić?</h2>', sa = false, ukryte = 0;
    GRUPY.forEach(function (gr) {
      let wiersze = '';
      Object.keys(K.obiekty).forEach(function (typ) {
        const def = K.obiekty[typ];
        if (def.grupa !== gr[0]) return;
        const o = M.oferta(typ);
        if (o.stan !== 'nowy') return;
        if (o.wym.some(w => !w.ok)) { ukryte++; return; }
        const tu = M.moznaTu(typ, dz, x, y), moze = o.ok && tu.ok;
        const powod = !tu.ok ? tu.powod : (o.ok ? '' : brakTekst(o));
        const opis = powod || (def.grupa === 'moc' ? def.opis : M.opisEfektu(typ, 1)) || def.opis;
        wiersze += '<button class="ob-wybor" data-a="postawTu" data-typ="' + typ + '" data-x="' + x + '" data-y="' + y + '"' + (moze ? '' : ' disabled') + '>' +
          '<span class="ob-wybor-rys">' + G.miniatura(typ, 1, { noc: noc }) + '</span>' +
          '<span class="ob-wybor-tekst"><b>' + esc(def.nazwa) + '</b><small>' + esc(opis) + (o.nocna && moze ? ', przez noc' : '') + '</small></span>' +
          '<span class="ob-wybor-cena">' + cenaHtml(o.koszt) + '</span></button>';
      });
      if (wiersze) { sa = true; h += '<h3 class="lista-nagl">' + gr[1] + '</h3><div class="lista-ob">' + wiersze + '</div>'; }
    });
    if (!sa) h += '<p class="arkusz-opis">Wszystko, co teraz dostępne, już stoi w mieście.</p>';
    if (ukryte) h += '<p class="arkusz-stopka">Kolejne obiekty (' + ukryte + ') odblokujesz, rozwijając miasto. Wymagania są w zakładce Budowa.</p>';
    return h;
  };

  /* =====================================================================
     BUDOWA (sklep)
     ===================================================================== */
  function kartaOferty(typ, noc) {
    const o = M.oferta(typ), def = o.def, max = M.maxPoziom(typ);
    const zablok = !!o.wym && o.wym.some(w => !w.ok);
    const pokaz = o.stan === 'max' ? max : (o.stan === 'budowa' ? Math.max(1, o.bud.doPoz) : o.poz);
    let meta = '', opis, akcja = '', dol = '';
    if (o.ist && o.ist.poz > 0 && max > 1) meta = '<span class="of-poz">' + (def.etapy ? 'etap ' : 'poz. ') + o.ist.poz + '</span>';
    if (!def.unikat && o.ile) meta = '<span class="of-poz">masz ' + o.ile + '</span>';
    if (o.stan === 'ulepsz') opis = esc(M.opisEfektu(typ, o.ist.poz)) + ' <span class="strz">→</span> <b>' + esc(M.opisEfektu(typ, o.poz)) + '</b>';
    else if (o.stan === 'max') opis = esc(duza(M.opisEfektu(typ, max))) + '. <span class="of-max">' + (max > 1 ? 'Najwyższy ' + (def.etapy ? 'etap' : 'poziom') : 'Stoi w mieście') + '.</span>';
    else if (o.stan === 'budowa') opis = 'W budowie, gotowe ' + U.kiedy(o.bud.gotowe) + '.';
    else {
      const ef = M.opisEfektu(typ, 1);
      opis = esc(def.opis) + (ef ? ' <b>' + esc(duza(ef)) + (def.bonus ? ' na poziom' : '') + '.</b>' : '');
    }
    if (o.stan === 'nowy' || o.stan === 'ulepsz') {
      if (zablok) {
        dol = '<p class="of-brak">' + ik('klodka') + '<span>Wymaga: ' + esc(o.wym.filter(w => !w.ok).map(w => w.tekst).join(', ')) + '</span></p>';
      } else {
        const nowy = o.stan === 'nowy';
        akcja = '<button class="kup-maly" data-a="' + (nowy ? 'postaw' : 'ulepsz') + '" ' + (nowy ? 'data-typ="' + typ + '"' : 'data-id="' + o.ist.id + '"') + (o.ok ? '' : ' disabled') + '>' +
          '<span>' + (nowy ? 'Postaw' : 'Ulepsz') + '</span><b>' + cenaHtml(o.koszt) + '</b></button>';
        if (!o.ok) dol = '<p class="of-brak"><span>' + esc(brakTekst(o)) + '</span></p>';
        else if (o.nocna) dol = '<p class="of-noc">' + ik('ksiezyc') + '<span>buduje się przez noc</span></p>';
      }
    }
    return '<article class="oferta' + (zablok && o.stan === 'nowy' ? ' zablok' : '') + '"><div class="of-rys">' + G.miniatura(typ, pokaz, { noc: noc }) + '</div>' +
      '<div class="of-tresc"><h3>' + esc(def.nazwa) + meta + '</h3><p class="of-opis">' + opis + '</p>' + dol + '</div>' + akcja + '</article>';
  }

  E.budowa = function () {
    const ser = M.seria(), noc = E.nocMiasta(), e = M.ekipy(), rab = K.premie.promocja.rabatProcent, rw = M.rabat('ratusz').warsztat;
    let h = '';
    if (ser.promoAktywna) {
      h += '<div class="karta promo aktywna"><span class="znak">' + ik('procent') + '</span><span class="wybor-opis"><b>Dziś promocja: budowy tańsze o ' + rab + '%</b><small>Działa do końca dnia gry.</small></span></div>';
    } else if (ser.promo > 0) {
      h += '<div class="karta promo"><span class="znak">' + ik('procent') + '</span><span class="wybor-opis"><b>' + duza(pl(ser.promo, 'dzień promocji', 'dni promocji', 'dni promocji')) + ' w zapasie</b>' +
        '<small>Przez jeden dzień wszystkie budowy tańsze o ' + rab + '%.</small></span><button class="maly" data-a="promocja">Włącz dziś</button></div>';
    }
    h += '<p class="pasek-info">' + ik('dzwig') + '<span>Nocne budowy: zajęte <b>' + e.zajete + ' z ' + e.razem + '</b> ' + (e.razem > 1 ? 'ekip' : 'ekipy') + '.' +
      (rw ? ' Rabat z Warsztatu: <b>' + rw + '%</b>.' : '') + '</span></p>';
    GRUPY.forEach(function (gr) {
      const typy = Object.keys(K.obiekty).filter(t => K.obiekty[t].grupa === gr[0]);
      h += '<h2 class="dzial">' + gr[1] + '</h2><div class="oferty">' + typy.map(t => kartaOferty(t, noc)).join('') + '</div>';
    });
    h += '<h2 class="dzial">Dzielnice</h2><div class="oferty">' + K.dzielnice.map(function (d) {
      if (M.dzielnicaOdblokowana(d.id)) {
        return '<article class="oferta dz"><div class="of-tresc"><h3>' + esc(d.nazwa) + '<span class="of-poz">otwarta</span></h3><p class="of-opis">' + esc(d.opis) + ' Wolne działki: ' + M.wolneDzialki(d.id) + '.</p></div>' +
          '<button class="kup-maly cichy" data-a="idzDoDzielnicy" data-dz="' + d.id + '"><span>Pokaż</span></button></article>';
      }
      const s = M.sprawdzDzielnice(d.id), brakWym = s.wym.filter(w => !w.ok);
      let dol = '', akcja = '';
      if (brakWym.length) dol = '<p class="of-brak">' + ik('klodka') + '<span>Wymaga: ' + esc(brakWym.map(w => w.tekst).join(', ')) + '</span></p>';
      else if (!s.ok) dol = '<p class="of-brak"><span>' + esc(brakTekst(s)) + '</span></p>';
      if (s.kupowana && !brakWym.length) akcja = '<button class="kup-maly" data-a="kupDzielnice" data-dz="' + d.id + '"' + (s.ok ? '' : ' disabled') + '><span>Otwórz</span><b>' + cenaHtml(s.koszt) + '</b></button>';
      return '<article class="oferta dz' + (brakWym.length ? ' zablok' : '') + '"><div class="of-tresc"><h3>' + esc(d.nazwa) + '</h3><p class="of-opis">' + esc(d.opis) + '</p>' + dol + '</div>' + akcja + '</article>';
    }).join('') + '</div>';
    return h;
  };

  /* =====================================================================
     STATYSTYKI
     ===================================================================== */
  function okraglaGora(n) {
    const kroki = [50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000];
    for (let i = 0; i < kroki.length; i++) if (n <= kroki[i]) return kroki[i];
    return Math.ceil(n / 1000) * 1000;
  }

  function wykresDni(ui) {
    const hist = M.historia(14), prog = M.prog();
    const max = okraglaGora(Math.max(prog * 1.25, hist.reduce((m, x) => Math.max(m, x.pkt), 0)));
    const wybr = ui.odczyt && hist.some(x => x.dk === ui.odczyt) ? ui.odczyt : hist[hist.length - 1].dk;
    let odczyt = '';
    const kolumny = hist.map(function (x) {
      const wys = x.jest ? Math.max(x.pkt > 0 ? 2 : 0, Math.round(x.pkt / max * 100)) : 0;
      const stan = !x.jest ? 'przed początkiem gry' : x.zal ? 'dzień zaliczony' : x.ochr ? 'ochrona serii' : x.dzis ? 'dzień w toku' : 'poniżej progu';
      if (x.dk === wybr) odczyt = '<b>' + fmt(x.pkt) + ' pkt</b><span>' + U.dataDluga(x.dk) + ', ' + stan + '</span>';
      return '<button class="kol' + (x.dk === wybr ? ' wybrana' : '') + (x.dzis ? ' dzis' : '') + '" data-a="odczyt" data-dk="' + x.dk + '" aria-label="' + U.dataDluga(x.dk) + ': ' + fmt(x.pkt) + ' pkt, ' + stan + '">' +
        '<span class="slupek" style="height:' + wys + '%"></span><span class="os-x">' + U.dzienMies(x.dk) + '</span></button>';
    }).join('');
    const tabela = hist.slice().reverse().map(x => '<tr><td>' + U.dataKrotka(x.dk) + '</td><td>' + (x.jest ? fmt(x.pkt) : '') + '</td><td>' + (!x.jest ? '' : x.zal ? 'zaliczony' : x.ochr ? 'ochrona' : x.dzis ? 'w toku' : 'poniżej progu') + '</td></tr>').join('');
    return '<section class="karta"><h2>Punkty z ostatnich 14 dni</h2>' +
      '<p class="odczyt" aria-live="polite">' + odczyt + '</p>' +
      '<div class="wykres" style="--prog:' + (prog / max * 100) + '%">' +
      '<div class="siatka"><span style="bottom:100%"><i>' + fmt(max) + '</i></span><span style="bottom:50%"><i>' + fmt(max / 2) + '</i></span><span style="bottom:0"><i>0</i></span></div>' +
      '<div class="linia-progu"></div>' +
      '<div class="kolumny">' + kolumny + '</div></div>' +
      '<ul class="legenda wykres-leg"><li><i class="l-linia"></i>próg zaliczenia dnia: ' + fmt(prog) + ' pkt</li></ul>' +
      '<details class="tabela"><summary>Pokaż jako tabelę</summary><table><thead><tr><th>Dzień</th><th>Punkty</th><th>Stan</th></tr></thead><tbody>' + tabela + '</tbody></table></details>' +
      '</section>';
  }

  function kalendarz() {
    const S = M.stan(), dzis = M.dzis(), start = M.przesun(M.poniedzialek(dzis), -28);
    let h = '<div class="kal-nagl">' + U.SKROTY_DNI.map(s => '<span>' + s + '</span>').join('') + '</div><div class="kal">';
    for (let i = 0; i < 35; i++) {
      const k = M.przesun(start, i), d = S.dni[k];
      let kl = 'kal-dzien', znak = '', opis = 'niezaliczony';
      if (k > dzis || k < S.start) { kl += ' poza'; opis = k > dzis ? 'przed nami' : 'przed początkiem gry'; }
      else if (d && d.zal) { kl += ' zal'; opis = 'zaliczony, ' + fmt(d.pkt || 0) + ' pkt'; }
      else if (d && d.ochr) { kl += ' ochr'; znak = ik('tarcza'); opis = 'ochrona serii'; }
      else if (k === dzis) opis = 'w toku';
      if (k === dzis) kl += ' dzis';
      h += '<span class="' + kl + '" aria-label="' + U.dataKrotka(k) + ': ' + opis + '">' + (znak || U.dzienMies(k)) + '</span>';
    }
    return h + '</div><ul class="legenda"><li><i class="l-zal"></i>zaliczony</li><li><i class="l-ochr">' + ik('tarcza') + '</i>ochrona serii</li><li><i class="l-pusty"></i>bez zaliczenia</li></ul>';
  }

  function kategorieTygodnia() {
    const S = M.stan(), dzis = M.dzis(), pon = M.poniedzialek(dzis), suma = {};
    let premie = 0;
    for (let k = pon; k <= dzis; k = M.przesun(k, 1)) {
      const d = S.dni[k];
      if (!d) continue;
      for (const id in (d.kat || {})) suma[id] = (suma[id] || 0) + d.kat[id];
      for (const p in (d.pr || {})) premie += d.pr[p] || 0;
    }
    const max = Math.max(1, K.kategorie.reduce((m, k) => Math.max(m, suma[k.id] || 0), 0), premie);
    const wiersz = (nazwa, kolor, v) => '<li><span class="kb-nazwa"><i style="background:' + kolor + '"></i>' + esc(nazwa) + '</span>' +
      '<span class="kb-tor"><span class="kb-pasek" style="width:' + (v / max * 100) + '%;background:' + kolor + '"></span></span><b>' + fmt(v) + '</b></li>';
    return '<section class="karta"><h2>Ten tydzień według kategorii</h2><ul class="kat-bary">' +
      K.kategorie.map(k => wiersz(k.nazwa, E.kolorKat(k.id), suma[k.id] || 0)).join('') +
      wiersz('Premie', 'var(--tusz3)', premie) + '</ul></section>';
  }

  function licznikiTygodnia() {
    const dzis = M.dzis(), a = M.agregat(M.poniedzialek(dzis), dzis);
    const w = id => a[id] || { razy: 0, minuty: 0, dni: 0 };
    const kafel = (v, opis) => '<li><b>' + v + '</b><span>' + opis + '</span></li>';
    return '<section class="karta"><h2>Ten tydzień w liczbach</h2><ul class="kafle">' +
      kafel(M.czas(w('nauka').minuty), 'nauki') +
      kafel(w('anki').dni, 'dni z Anki do zera') +
      kafel(w('silownia').razy + w('sport').razy, 'treningów') +
      kafel(w('korki').razy, 'lekcji korepetycji') +
      kafel(M.czas(w('ksiazka').minuty), 'czytania') +
      kafel(M.czas(w('hiszpanski').minuty), 'hiszpańskiego') +
      '</ul></section>';
  }

  E.statystyki = function (ui) {
    const S = M.stan(), ser = M.seria(), co = K.premie.promocja.coIleDniSerii;
    const tarcze = [];
    for (let i = 0; i < ser.pojemnosc; i++) tarcze.push('<i class="' + (i < ser.ochrona ? 'jest' : '') + '">' + ik('tarcza') + '</i>');
    let h = '<section class="karta seria-karta"><div class="seria-gora"><div class="seria-liczba"><strong>' + fmt(ser.dni) + '</strong><span>' + M.odmiana(ser.dni, 'dzień serii', 'dni serii', 'dni serii') + '</span></div>' +
      '<ul class="seria-fakty"><li><b>' + fmt(ser.rekord) + '</b><span>rekord</span></li>' +
      '<li><b class="tarcze" aria-label="Dni ochrony: ' + ser.ochrona + ' z ' + ser.pojemnosc + '">' + tarcze.join('') + '</b><span>ochrona serii</span></li>' +
      '<li><b>' + ser.promo + '</b><span>' + M.odmiana(ser.promo, 'dzień promocji', 'dni promocji', 'dni promocji') + '</span></li></ul></div>' +
      '<p class="seria-opis">' + (ser.zaliczonyDzis ? 'Dzisiejszy dzień jest zaliczony. ' : 'Dziś jeszcze bez zaliczenia: potrzeba ' + fmt(M.prog()) + ' pkt. ') +
      'Do kolejnego dnia promocji: ' + pl(ser.doPromocji, 'dzień', 'dni', 'dni') + ' serii (co ' + co + ').</p>' +
      kalendarz() + '</section>';
    h += wykresDni(ui) + kategorieTygodnia() + licznikiTygodnia();
    const dniGry = M.roznicaDni(S.start, M.dzis()) + 1;
    h += '<section class="karta"><h2>Od początku gry</h2><ul class="kafle">' +
      '<li><b>' + fmt(S.lacznie) + '</b><span>zdobytych punktów</span></li>' +
      '<li><b>' + fmt(S.wydane) + '</b><span>wydanych na miasto</span></li>' +
      '<li><b>' + fmt(M.mieszkancy()) + '</b><span>' + M.odmiana(M.mieszkancy(), 'mieszkaniec', 'mieszkańców', 'mieszkańców') + '</span></li>' +
      '<li><b>' + fmt(dniGry) + '</b><span>' + M.odmiana(dniGry, 'dzień gry', 'dni gry', 'dni gry') + '</span></li>' +
      '<li><b>' + fmt(S.obiekty.length) + '</b><span>obiektów w mieście</span></li>' +
      '<li><b>' + fmt(S.odsetki) + '</b><span>pkt odsetek z banku</span></li>' +
      '</ul></section>';
    return h;
  };

  /* =====================================================================
     USTAWIENIA
     ===================================================================== */
  function wiersz2(etykieta, kontrolka, opis) {
    return '<label class="ust-wiersz"><span class="ust-etykieta">' + etykieta + (opis ? '<small>' + opis + '</small>' : '') + '</span>' + kontrolka + '</label>';
  }
  function przelacz(klucz, wl, wylaczony) {
    return '<input type="checkbox" class="przel" data-ust="' + klucz + '"' + (wl ? ' checked' : '') + (wylaczony ? ' disabled' : '') + '>';
  }

  E.ustawienia = function (ui) {
    const S = M.stan(), u = S.ust, p = u.powiad, motyw = u.motyw || 'auto';
    const pow = ui.powiadomienia || {};
    let h = '';

    h += '<section class="karta ust"><h2>Miasto</h2>' +
      wiersz2('Nazwa miasta', '<input type="text" class="pole-tekst" maxlength="24" data-ust="miasto" value="' + esc(S.miasto) + '">') + '</section>';

    h += '<section class="karta ust"><h2>Cele dnia</h2>' +
      wiersz2('Sen przed', '<input type="time" data-ust="godzinaSnu" value="' + esc(u.godzinaSnu) + '">') +
      wiersz2('Dzienny cel kroków', '<input type="number" min="1000" max="50000" step="500" inputmode="numeric" data-ust="celKrokow" value="' + u.celKrokow + '">') +
      '<div class="ust-wiersz"><span class="ust-etykieta">Limit czasu ekranowego</span><span class="czas-pola"><input type="number" min="0" max="23" inputmode="numeric" data-ust="limitH" aria-label="godziny" value="' + Math.floor(u.limitEkranuMin / 60) + '"> h ' +
      '<input type="number" min="0" max="59" step="5" inputmode="numeric" data-ust="limitM" aria-label="minuty" value="' + (u.limitEkranuMin % 60) + '"> min</span></div>' +
      wiersz2('Próg zaliczenia dnia', '<span class="z-jedn"><input type="number" min="5" max="300" step="5" inputmode="numeric" data-ust="progDnia" value="' + M.prog() + '"> pkt</span>', 'Tyle punktów (bez premii za serię) trzeba zdobyć, żeby dzień liczył się do serii.') +
      wiersz2('Spacer z psem w komplecie podstaw', przelacz('piesWKomplecie', u.piesWKomplecie)) + '</section>';

    h += '<section class="karta ust"><h2>Wygląd</h2><div class="ust-wiersz"><span class="ust-etykieta">Motyw<small>Automatyczny zmienia się razem z porą dnia w mieście.</small></span>' +
      '<span class="przelacznik maly-przel">' + [['auto', 'Auto'], ['jasny', 'Jasny'], ['ciemny', 'Ciemny']].map(m =>
        '<button class="' + (motyw === m[0] ? 'aktywny' : '') + '" data-a="motyw" data-motyw="' + m[0] + '" aria-pressed="' + (motyw === m[0]) + '">' + m[1] + '</button>').join('') + '</span></div></section>';

    let stanPow = '';
    if (!pow.dostepne) stanPow = 'Ta przeglądarka nie obsługuje powiadomień. Na iPhonie dodaj najpierw aplikację do ekranu początkowego.';
    else if (pow.zgoda === 'denied') stanPow = 'Powiadomienia są zablokowane w ustawieniach przeglądarki dla tej strony.';
    else stanPow = 'Powiadomienia są lokalne: przychodzą, gdy aplikacja jest otwarta albo działa w tle. Po całkowitym zamknięciu telefon może je opóźnić lub pominąć.';
    const wl = p.wlaczone && pow.zgoda === 'granted';
    h += '<section class="karta ust"><h2>Powiadomienia</h2>' +
      wiersz2('Powiadomienia', przelacz('powiad.wlaczone', wl, !pow.dostepne || pow.zgoda === 'denied')) +
      wiersz2('Budowa zakończona', przelacz('powiad.budowa', p.budowa, !wl)) +
      wiersz2('Wieczorne przypomnienie', przelacz('powiad.wieczor', p.wieczor, !wl), 'Gdy dzień jest jeszcze niezaliczony.') +
      wiersz2('Godzina przypomnienia', '<input type="time" data-ust="powiad.godzinaWieczor" value="' + esc(p.godzinaWieczor) + '"' + (wl && p.wieczor ? '' : ' disabled') + '>') +
      '<p class="ust-opis">' + stanPow + '</p></section>';

    const wlasne = S.wlasne.filter(z => !z.usuniete);
    h += '<section class="karta ust"><h2>Własne zadania</h2>' +
      (wlasne.length ? '<ul class="lista-wlasnych">' + wlasne.map(z => '<li><span class="kropka" style="background:' + E.kolorKat(z.kategoria) + '"></span><span class="lw-nazwa">' + esc(z.nazwa) + '<small>' + esc((KAT[z.kategoria] || {}).nazwa || '') + ', ' + z.punkty + ' pkt' + (z.typ === 'czas' ? ' za ' + z.minuty + ' min' : z.typ === 'licznik' ? ', do ' + z.max + ' razy dziennie' : '') + '</small></span>' +
        '<button class="ikonowy" data-a="edytujWlasne" data-id="' + z.id + '" aria-label="Edytuj: ' + esc(z.nazwa) + '">' + ik('olowek') + '</button></li>').join('') + '</ul>'
        : '<p class="ust-opis">Nie masz jeszcze własnych zadań.</p>') +
      '<button class="przycisk drugi szeroki" data-a="noweZadanie">' + ik('plus') + 'Dodaj własne zadanie</button></section>';

    h += '<section class="karta ust"><h2>Kopia zapasowa</h2>' +
      '<p class="ust-opis">Gra jest zapisana tylko w tym telefonie. Kopia to jeden plik, z którego odtworzysz wszystko, także na innym urządzeniu. ' +
      (S.kopia ? 'Ostatnia kopia: ' + U.ileDniTemu(S.kopia) + '.' : 'Nie zrobiono jeszcze żadnej kopii.') + '</p>' +
      '<div class="przyciski">' +
      '<button class="przycisk" data-a="eksport">' + ik('pobierz') + 'Zapisz kopię do pliku</button>' +
      (ui.moznaUdostepnic ? '<button class="przycisk drugi" data-a="udostepnij">' + ik('udostepnij') + 'Udostępnij kopię</button>' : '') +
      '<label class="przycisk drugi">' + ik('wgraj') + 'Wczytaj kopię z pliku<input type="file" accept=".json,.txt,application/json,text/plain" data-zmiana="import" hidden></label>' +
      '</div>' + (M.pamiecTrwala ? '' : '<p class="ust-opis blad">Uwaga: ta przeglądarka nie pozwala zapisywać danych (tryb prywatny?). Postęp zniknie po zamknięciu karty.</p>') + '</section>';

    h += '<section class="karta ust"><h2>Aplikacja</h2>';
    if (ui.zainstalowana) h += '<p class="ust-opis">' + ik('ptaszek') + ' Aplikacja jest zainstalowana na tym urządzeniu.</p>';
    else if (ui.instalacja) h += '<button class="przycisk szeroki" data-a="instaluj">' + ik('pobierz') + 'Zainstaluj na ekranie głównym</button>';
    else h += '<p class="ust-opis">Żeby dodać aplikację do ekranu głównego: w Chrome na Androidzie otwórz menu i wybierz „Dodaj do ekranu głównego”, w Safari na iPhonie dotknij „Udostępnij”, a potem „Do ekranu początkowego”.</p>';
    h += '<div class="przyciski">' +
      '<button class="przycisk drugi" data-a="zasady">' + ik('info') + 'Zasady gry</button>' +
      '<button class="przycisk drugi" data-a="aktualizuj">' + ik('odswiez') + 'Sprawdź aktualizację</button>' +
      '<button class="przycisk drugi grozny" data-a="resetPytanie">' + ik('kosz') + 'Usuń grę i zacznij od nowa</button></div>' +
      '<p class="ust-opis wersja">Miasto, wersja ' + esc(K.wersja) + '</p></section>';
    return h;
  };

  E.arkuszZasad = function () {
    const p = K.premie, b = K.budowa, o = p.ochrona;
    const pkt = [
      ['Punkty', 'Każde zadanie ma stałą liczbę punktów. Zadania na czas liczą się porcjami, a nauka jest punktowana do ' + M.czas((K.zadania.filter(z => z.id === 'nauka')[0] || {}).limitMin || 360) + ' dziennie.'],
      ['Premie', 'Komplet podstaw: +' + p.komplet.punkty + '. Pierwsza sesja nauki: +' + p.pierwszaSesja.punkty + '. Zadanie dnia: punkty ×' + mnoznik() + ' (premia do ' + p.zadanieDnia.maxPremia + '). Wyzwanie tygodnia: +' + p.wyzwanie.punkty + '.'],
      ['Seria', 'Dzień liczy się do serii, gdy zdobędziesz co najmniej ' + fmt(M.prog()) + ' pkt. Za każdy dzień serii dostajesz +' + p.seria.zaDzien + ' pkt dziennie, najwyżej +' + p.seria.max + '. Zieleń w mieście dodaje do tego do ' + p.zielen.max + ' pkt.'],
      ['Ochrona serii', 'Opuszczony dzień nie przerywa serii, jeśli masz dzień ochrony. Co tydzień dostajesz ' + o.naTydzien + '. W zapasie zmieści się ' + o.zapasBazowy + ', a każdy poziom Szpitala dodaje kolejny.'],
      ['Promocja', 'Co ' + p.promocja.coIleDniSerii + ' dni nieprzerwanej serii dostajesz dzień promocji: budowy tańsze o ' + p.promocja.rabatProcent + '%. Włączasz go w zakładce Budowa.'],
      ['Budowa', 'Tańsze budowy są gotowe od ręki. Te od ' + fmt(b.nocnaOdKosztu) + ' pkt trwają przez noc i są gotowe o ' + b.godzinaGotowosci + ':00. Naraz pracuje jedna ekipa, a od Warsztatu na poziomie ' + b.drugaEkipaOdWarsztatu + ' dwie.'],
      ['Ratusz', 'Poziom budynku nie może być wyższy niż poziom Ratusza. Ratusz odblokowuje też nowe budynki i dzielnice.'],
      ['Dzień gry', 'Trwa do ' + K.dzien.poczatekGodzina + ':00 w nocy, więc wieczorne zadania odhaczone po północy liczą się jeszcze do poprzedniego dnia. Poprawiać można dziś i wczoraj.']
    ];
    return '<h2>Zasady gry</h2><dl class="zasady">' + pkt.map(x => '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>').join('') + '</dl>' +
      '<p class="arkusz-stopka">Punkty, premie i ceny zmienisz w pliku config.js.</p>';
  };

  /* ---------- co się wydarzyło od ostatniej wizyty ---------- */
  E.arkuszZdarzen = function (lista) {
    const wiersze = lista.map(function (z) {
      if (z.typ === 'budowa') {
        const def = K.obiekty[z.obiekt] || { nazwa: 'Budowa' }, wiele = (def.koszt || []).length > 1;
        return '<li class="zd-ok">' + ik('dzwig') + '<span><b>' + esc(def.nazwa) + '</b>' + (wiele ? ': ' + (def.etapy ? 'etap ' : 'poziom ') + z.poz + ' gotowy' : ': budowa zakończona') + '</span></li>';
      }
      if (z.typ === 'dzielnica') return '<li class="zd-ok">' + ik('miasto') + '<span>Otwarto dzielnicę <b>' + esc((M.dzielnicaDef(z.dz) || {}).nazwa || '') + '</b></span></li>';
      if (z.typ === 'odsetki') return '<li class="zd-ok">' + ik('procent') + '<span>Bank wypłacił odsetki: <b>+' + fmt(z.kwota) + ' pkt</b></span></li>';
      if (z.typ === 'ochrona') return '<li>' + ik('tarcza') + '<span>' + duza(U.dataDluga(z.dk)) + ' bez zaliczenia. Ochrona zadziałała, seria ' + pl(z.seria, 'dzień', 'dni', 'dni') + ' trwa dalej.</span></li>';
      if (z.typ === 'utrata') return '<li class="zd-zle">' + ik('plomien') + '<span>' + duza(U.dataDluga(z.dk)) + ' bez zaliczenia. Seria ' + pl(z.seria, 'dzień', 'dni', 'dni') + ' została przerwana. Jeśli to był wczorajszy dzień, możesz go jeszcze uzupełnić.</span></li>';
      return '';
    }).join('');
    return '<h2>Od ostatniej wizyty</h2><ul class="zdarzenia">' + wiersze + '</ul><button class="przycisk szeroki" data-a="zamknijArkusz">Dobrze</button>';
  };

  E.arkuszPotwierdzenia = function (tytul, tresc, etykieta, akcja, dane) {
    return '<h2>' + tytul + '</h2><p class="arkusz-opis">' + tresc + '</p><div class="przyciski">' +
      '<button class="przycisk grozny-pelny" data-a="' + akcja + '"' + (dane || '') + '>' + etykieta + '</button>' +
      '<button class="przycisk drugi" data-a="zamknijArkusz">Anuluj</button></div>';
  };

  /* =====================================================================
     POWITANIE (pierwsze uruchomienie)
     ===================================================================== */
  E.powitanie = function () {
    const u = K.ustawieniaDomyslne;
    return '<div class="powitanie">' +
      '<div class="pow-rys niebo-' + E.faza() + '">' + G.miniatura('ratusz', 3, { noc: E.nocMiasta() }) + '</div>' +
      '<h2>Zbuduj miasto z codziennych obowiązków</h2>' +
      '<p>Odhaczasz to, co zrobione w prawdziwym życiu. Za punkty stawiasz i ulepszasz budynki, a one dają premie do kolejnych zadań.</p>' +
      '<form data-formularz="start" novalidate>' +
      '<label class="pole">Nazwa miasta<input type="text" name="miasto" maxlength="24" autocomplete="off" value="' + esc(K.start.nazwaMiasta) + '"></label>' +
      '<div class="pola-2"><label class="pole">Sen przed<input type="time" name="godzinaSnu" value="' + u.godzinaSnu + '"></label>' +
      '<label class="pole">Cel kroków<input type="number" name="celKrokow" min="1000" max="50000" step="500" inputmode="numeric" value="' + u.celKrokow + '"></label></div>' +
      '<div class="pola-2"><label class="pole">Limit ekranu, godziny<input type="number" name="limitH" min="0" max="23" inputmode="numeric" value="' + Math.floor(u.limitEkranuMin / 60) + '"></label>' +
      '<label class="pole">i minuty<input type="number" name="limitM" min="0" max="59" step="5" inputmode="numeric" value="' + (u.limitEkranuMin % 60) + '"></label></div>' +
      '<label class="pole-wybor"><input type="checkbox" name="pies"' + (u.piesWKomplecie ? ' checked' : '') + '><span>Spacer z psem należy do kompletu podstaw</span></label>' +
      '<button class="przycisk szeroki" type="submit">Zaczynamy</button>' +
      '<label class="przycisk drugi szeroki">' + ik('wgraj') + 'Mam kopię zapasową<input type="file" accept=".json,.txt,application/json,text/plain" data-zmiana="import" hidden></label>' +
      '</form></div>';
  };
})(window);
