/* =====================================================================
   MIASTO – silnik gry (logika, bez interfejsu)
   Stan gry trzymany jest w localStorage. Punkty i ceny pochodzą z config.js.
   ===================================================================== */
(function (g) {
  'use strict';

  var K = g.KONFIG;
  var M = {};
  g.M = M;

  var GODZ = 3600000;
  var KLUCZ = 'miasto.stan.v1';
  var KLUCZ_KOPII = 'miasto.kopia.v1';
  var N = 6;                       // rozmiar mapy dzielnicy
  var S = null;                    // stan gry

  M.N = N;
  M.zegar = function () { return Date.now(); };

  /* ------------------------------------------------------------------
     Pamięć (localStorage z bezpiecznym zapasem w RAM)
     ------------------------------------------------------------------ */
  var pamiec = (function () {
    var ls = null, ram = {};
    try {
      ls = g.localStorage;
      ls.setItem('miasto.test', '1');
      ls.removeItem('miasto.test');
    } catch (e) { ls = null; }
    return {
      trwala: !!ls,
      get: function (k) { try { return ls ? ls.getItem(k) : (k in ram ? ram[k] : null); } catch (e) { return null; } },
      set: function (k, v) { try { if (ls) ls.setItem(k, v); else ram[k] = v; return true; } catch (e) { return false; } },
      del: function (k) { try { if (ls) ls.removeItem(k); else delete ram[k]; } catch (e) { /* nic */ } }
    };
  })();
  M.pamiecTrwala = pamiec.trwala;

  /* ------------------------------------------------------------------
     Daty. Klucz dnia: 'RRRR-MM-DD' (dzień gry zaczyna się o poczatekGodzina)
     ------------------------------------------------------------------ */
  function dwie(n) { return n < 10 ? '0' + n : '' + n; }
  function klucz(d) { return d.getFullYear() + '-' + dwie(d.getMonth() + 1) + '-' + dwie(d.getDate()); }
  function dzienZTs(ts) { return klucz(new Date(ts - K.dzien.poczatekGodzina * GODZ)); }
  function dataZKlucza(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0); }
  function przesun(k, n) { var d = dataZKlucza(k); d.setDate(d.getDate() + n); return klucz(d); }
  function poniedzialek(k) { var d = dataZKlucza(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return klucz(d); }
  function roznicaDni(a, b) { return Math.round((dataZKlucza(b) - dataZKlucza(a)) / 86400000); }

  M.dzienZTs = dzienZTs;
  M.dataZKlucza = dataZKlucza;
  M.przesun = przesun;
  M.poniedzialek = poniedzialek;
  M.roznicaDni = roznicaDni;
  M.dzis = function () {
    var r = dzienZTs(M.zegar());
    return (S && S.ostDzien > r) ? S.ostDzien : r;
  };
  M.wczoraj = function () { return przesun(M.dzis(), -1); };

  /* ------------------------------------------------------------------
     Stan gry
     ------------------------------------------------------------------ */
  function nowyStan(opcje) {
    opcje = opcje || {};
    var dzis = dzienZTs(M.zegar());
    var st = {
      v: 1,
      utworzono: M.zegar(),
      start: dzis,
      ostDzien: dzis,
      miasto: opcje.miasto || K.start.nazwaMiasta,
      pkt: K.start.punkty,
      lacznie: 0,
      wydane: 0,
      odsetki: 0,
      ust: {},
      dni: {},
      tygodnie: {},
      ochrona: K.premie.ochrona.zapasBazowy,
      promo: 0,
      promoDzien: null,
      rekordSerii: 0,
      obiekty: [],
      nid: 1,
      budowy: [],
      dzielnice: [K.dzielnice[0].id],
      wlasne: [],
      nidZadania: 1,
      zdarzenia: [],
      wskazowki: {},
      kopia: null
    };
    st.dni[dzis] = { w: [] };
    // Ratusz i kawałek ulicy na dobry początek
    var dz = K.dzielnice[0].id;
    st.obiekty.push({ id: st.nid++, typ: 'ratusz', poz: 1, dz: dz, x: 2, y: 2 });
    for (var x = 1; x <= 4; x++) st.obiekty.push({ id: st.nid++, typ: 'ulica', poz: 1, dz: dz, x: x, y: 3 });
    return migruj(st, opcje.ust);
  }

  function migruj(st, ust) {
    var domyslne = {};
    var k;
    for (k in K.ustawieniaDomyslne) domyslne[k] = K.ustawieniaDomyslne[k];
    domyslne.powiad = { wlaczone: false, budowa: true, wieczor: true, godzinaWieczor: '21:00' };
    var u = st.ust || {};
    for (k in domyslne) if (u[k] === undefined) u[k] = domyslne[k];
    if (ust) for (k in ust) u[k] = ust[k];
    if (!u.powiad || typeof u.powiad !== 'object') u.powiad = domyslne.powiad;
    for (k in domyslne.powiad) if (u.powiad[k] === undefined) u.powiad[k] = domyslne.powiad[k];
    st.ust = u;
    st.dni = st.dni || {};
    st.tygodnie = st.tygodnie || {};
    st.obiekty = st.obiekty || [];
    st.budowy = st.budowy || [];
    st.dzielnice = st.dzielnice && st.dzielnice.length ? st.dzielnice : [K.dzielnice[0].id];
    st.wlasne = st.wlasne || [];
    st.zdarzenia = st.zdarzenia || [];
    st.wskazowki = st.wskazowki || {};
    st.pkt = +st.pkt || 0;
    st.lacznie = +st.lacznie || 0;
    st.wydane = +st.wydane || 0;
    st.odsetki = +st.odsetki || 0;
    st.ochrona = +st.ochrona || 0;
    st.promo = +st.promo || 0;
    st.rekordSerii = +st.rekordSerii || 0;
    st.nid = st.nid || (st.obiekty.reduce(function (m, o) { return Math.max(m, o.id); }, 0) + 1);
    st.nidZadania = st.nidZadania || (st.wlasne.length + 1);
    if (!st.start) st.start = dzienZTs(st.utworzono || M.zegar());
    if (!st.ostDzien) st.ostDzien = st.start;
    return st;
  }

  M.stan = function () { return S; };

  M.wczytaj = function () {
    var st = null, raw = pamiec.get(KLUCZ);
    M.odzyskano = false;
    if (raw) { try { st = JSON.parse(raw); } catch (e) { st = null; } }
    if (!st || !st.v) {
      var kop = pamiec.get(KLUCZ_KOPII);
      if (kop) { try { st = JSON.parse(kop); M.odzyskano = !!(st && st.v); } catch (e2) { st = null; } }
    }
    S = (st && st.v) ? migruj(st) : null;
    return !!S;
  };

  M.rozpocznij = function (opcje) {
    S = nowyStan(opcje);
    M.przelicz();
    M.zapisz();
    return S;
  };

  M.zapisz = function () {
    if (!S) return false;
    return pamiec.set(KLUCZ, JSON.stringify(S));
  };

  M.eksport = function () {
    S.kopia = M.zegar();
    M.zapisz();
    return JSON.stringify({ app: 'miasto', format: 1, zapisano: new Date(M.zegar()).toISOString(), stan: S });
  };

  M.importuj = function (tekst) {
    var o;
    try { o = JSON.parse(tekst); } catch (e) { return blad('To nie jest poprawny plik kopii zapasowej.'); }
    if (!o || o.app !== 'miasto' || !o.stan || !o.stan.v || !o.stan.dni) return blad('Ten plik nie zawiera kopii zapasowej Miasta.');
    S = migruj(o.stan);
    M.tyk();
    M.przelicz();
    M.zapisz();
    return { ok: true };
  };

  M.reset = function () {
    pamiec.del(KLUCZ);
    pamiec.del(KLUCZ_KOPII);
    S = null;
  };

  function blad(tekst) { return { ok: false, powod: tekst }; }
  function zdarzenie(z) { z.ts = M.zegar(); S.zdarzenia.push(z); if (S.zdarzenia.length > 40) S.zdarzenia.shift(); }
  M.zdarzenia = function () { return S.zdarzenia.slice(); };
  M.wyczyscZdarzenia = function () { S.zdarzenia = []; M.zapisz(); };

  M.ustaw = function (klucz, wartosc) {
    S.ust[klucz] = wartosc;
    M.przelicz();
    M.zapisz();
  };
  M.ustawMiasto = function (nazwa) {
    nazwa = String(nazwa || '').trim().slice(0, 24);
    if (!nazwa) return blad('Wpisz nazwę miasta.');
    S.miasto = nazwa;
    M.zapisz();
    return { ok: true };
  };
  M.prog = function () { return Math.max(1, +S.ust.progDnia || K.ustawieniaDomyslne.progDnia); };

  /* ------------------------------------------------------------------
     Zadania
     ------------------------------------------------------------------ */
  var indeksZadan = {};
  K.zadania.forEach(function (z) { indeksZadan[z.id] = z; });

  M.zadania = function () {
    return K.zadania.concat(S.wlasne.filter(function (z) { return !z.usuniete; }));
  };
  M.zadanie = function (id) {
    if (indeksZadan[id]) return indeksZadan[id];
    for (var i = 0; i < S.wlasne.length; i++) if (S.wlasne[i].id === id) return S.wlasne[i];
    return null;
  };

  M.dodajWlasne = function (pola) {
    var z = oczyscWlasne(pola);
    if (!z.ok) return z;
    z.zadanie.id = 'w' + (S.nidZadania++);
    z.zadanie.wlasne = true;
    S.wlasne.push(z.zadanie);
    M.zapisz();
    return { ok: true, zadanie: z.zadanie };
  };
  M.edytujWlasne = function (id, pola) {
    var stare = M.zadanie(id);
    if (!stare || !stare.wlasne) return blad('Nie ma takiego zadania.');
    var z = oczyscWlasne(pola);
    if (!z.ok) return z;
    for (var k in z.zadanie) stare[k] = z.zadanie[k];
    if (z.zadanie.typ !== 'licznik') delete stare.max;
    if (z.zadanie.typ !== 'czas') delete stare.minuty;
    M.przelicz();
    M.zapisz();
    return { ok: true, zadanie: stare };
  };
  M.usunWlasne = function (id) {
    var z = M.zadanie(id);
    if (!z || !z.wlasne) return blad('Nie ma takiego zadania.');
    z.usuniete = true;        // zostaje w pamięci, żeby historia miała nazwę
    M.zapisz();
    return { ok: true };
  };
  function oczyscWlasne(p) {
    var nazwa = String(p.nazwa || '').trim().slice(0, 60);
    if (!nazwa) return blad('Wpisz nazwę zadania.');
    var pkt = Math.round(+p.punkty);
    if (!(pkt >= 1 && pkt <= 100)) return blad('Punkty: od 1 do 100.');
    var kat = K.kategorie.some(function (k) { return k.id === p.kategoria; }) ? p.kategoria : K.kategorie[0].id;
    var typ = (p.typ === 'licznik' || p.typ === 'czas') ? p.typ : 'raz';
    var z = { nazwa: nazwa, kategoria: kat, typ: typ, punkty: pkt };
    if (typ === 'licznik') z.max = Math.min(10, Math.max(2, Math.round(+p.max) || 3));
    if (typ === 'czas') z.minuty = (+p.minuty === 15 || +p.minuty === 60) ? +p.minuty : 30;
    return { ok: true, zadanie: z };
  }

  function dzienRek(dk, utworz) {
    var d = S.dni[dk];
    if (!d && utworz) d = S.dni[dk] = { w: [] };
    return d;
  }
  M.dzien = function (dk) { return S.dni[dk || M.dzis()] || null; };
  function ile(d, zid) {
    var n = 0;
    if (d) for (var i = 0; i < d.w.length; i++) if (d.w[i].t === zid) n += d.w[i].n || 1;
    return n;
  }
  function maxDziennie(z) {
    if (z.typ === 'raz' || z.typ === 'ekran') return 1;
    if (z.typ === 'licznik') return z.max || 9;
    return Math.floor(960 / (z.minuty || 30));     // najwyżej 16 h dziennie
  }

  /* Premia procentowa z budynków dla zadania (ułamek, np. 0.15) */
  M.procent = function (zid) {
    var z = M.zadanie(zid), p = 0;
    if (!z) return 0;
    for (var i = 0; i < S.obiekty.length; i++) {
      var o = S.obiekty[i];
      if (!o.poz) continue;
      var bo = K.obiekty[o.typ] && K.obiekty[o.typ].bonus;
      if (!bo) continue;
      if ((bo.zadania && bo.zadania.indexOf(zid) >= 0) || (bo.kategorie && bo.kategorie.indexOf(z.kategoria) >= 0)) p += bo.procent * o.poz;
    }
    return p / 100;
  };

  /* Stan zadania w danym dniu – dla listy zadań */
  M.stanZadania = function (zid, dk) {
    var z = M.zadanie(zid), d = S.dni[dk || M.dzis()];
    var st = { ile: 0, max: z ? maxDziennie(z) : 1, pkt: 0, minuty: 0, blokada: null, procent: M.procent(zid), wartosc: null };
    if (!z) return st;
    if (d) {
      for (var i = 0; i < d.w.length; i++) {
        var w = d.w[i];
        if (w.t === zid) { st.ile += w.n || 1; st.pkt += w.b || 0; if (w.val != null) st.wartosc = w.val; }
      }
      // zadanie zastąpione przez inne (np. twarz, gdy jest prysznic)
      for (var j = 0; j < K.zadania.length; j++) {
        if (K.zadania[j].zastepuje === zid && ile(d, K.zadania[j].id) > 0) st.blokada = K.zadania[j].id;
      }
    }
    if (z.typ === 'czas') st.minuty = st.ile * z.minuty;
    st.pelne = st.ile >= st.max;
    return st;
  };

  function migawka(dk) {
    var d = S.dni[dk] || {}, pr = d.pr || {};
    return { zal: !!d.zal, komplet: !!pr.komplet, tydz: !!pr.tydz, promo: S.promo, seria: d.seria || 0, zd: pr.zd || 0, pkt: S.pkt };
  }
  function nowosci(przed, po) {
    var n = [];
    if (!przed.komplet && po.komplet) n.push('komplet');
    if (!przed.zal && po.zal) n.push('zaliczony');
    if (!przed.tydz && po.tydz) n.push('wyzwanie');
    if (po.promo > przed.promo) n.push('promocja');
    if (!przed.zd && po.zd) n.push('zadanieDnia');
    return n;
  }

  M.odhacz = function (zid, dk, wartosc) {
    dk = dk || M.dzis();
    var z = M.zadanie(zid);
    if (!z || z.usuniete) return blad('Nie ma takiego zadania.');
    if (dk !== M.dzis() && dk !== M.wczoraj()) return blad('Można edytować tylko dziś i wczoraj.');
    if (dk < S.start) return blad('Ten dzień jest sprzed początku gry.');
    var d = dzienRek(dk, true);
    var przed = migawka(dk);
    if (z.typ === 'ekran') {
      wartosc = Math.round(+wartosc);
      if (!(wartosc >= 0 && wartosc <= 1440)) return blad('Podaj czas od 0 do 24 godzin.');
      d.w = d.w.filter(function (w) { return w.t !== zid; });
      d.w.push({ t: zid, ts: M.zegar(), val: wartosc, p: M.procent(zid) });
    } else {
      var st = M.stanZadania(zid, dk);
      if (st.blokada) return blad('Zaliczone już przez: ' + M.nazwaZadania(M.zadanie(st.blokada)));
      if (st.ile >= st.max) return blad('Dzienny limit tego zadania jest już wykorzystany.');
      d.w.push({ t: zid, ts: M.zegar(), p: M.procent(zid) });
      if (z.zastepuje) d.w = d.w.filter(function (w) { return w.t !== z.zastepuje; });
    }
    M.przelicz();
    M.zapisz();
    var po = migawka(dk);
    return { ok: true, delta: po.pkt - przed.pkt, nowe: nowosci(przed, po) };
  };

  M.cofnij = function (zid, dk) {
    dk = dk || M.dzis();
    var d = S.dni[dk];
    if (!d) return blad('Brak wpisów.');
    if (dk !== M.dzis() && dk !== M.wczoraj()) return blad('Można edytować tylko dziś i wczoraj.');
    var przed = migawka(dk);
    for (var i = d.w.length - 1; i >= 0; i--) {
      if (d.w[i].t === zid) {
        if ((d.w[i].n || 1) > 1) d.w[i].n--; else d.w.splice(i, 1);
        M.przelicz();
        M.zapisz();
        return { ok: true, delta: S.pkt - przed.pkt };
      }
    }
    return blad('Brak wpisów.');
  };

  M.nazwaZadania = function (z) {
    if (!z) return '';
    return String(z.nazwa)
      .replace('{godzinaSnu}', S.ust.godzinaSnu)
      .replace('{celKrokow}', M.fmt(S.ust.celKrokow))
      .replace('{limitEkranu}', M.czas(S.ust.limitEkranuMin));
  };

  /* ------------------------------------------------------------------
     Formatowanie
     ------------------------------------------------------------------ */
  M.fmt = function (n) {
    n = Math.round(n);
    var s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (n < 0 ? '−' : '') + s;
  };
  M.czas = function (min) {
    min = Math.round(min);
    var h = Math.floor(min / 60), m = min % 60;
    if (h && m) return h + ' h ' + m + ' min';
    if (h) return h + ' h';
    return m + ' min';
  };
  M.odmiana = function (n, jeden, kilka, wiele) {
    n = Math.abs(n);
    if (n === 1) return jeden;
    var d = n % 10, s = n % 100;
    if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return kilka;
    return wiele;
  };

  /* ------------------------------------------------------------------
     Komplet podstaw
     ------------------------------------------------------------------ */
  function grupyKompletu() {
    var kp = K.premie.komplet, gr = kp.wymagane.slice();
    if (S.ust.piesWKomplecie && kp.pies) gr.push(kp.pies);
    return gr;
  }
  function grupaZrobiona(d, grupa) {
    for (var i = 0; i < d.w.length; i++) if (grupa.indexOf(d.w[i].t) >= 0 && d.w[i].b > 0) return true;
    return false;
  }
  M.komplet = function (dk) {
    var d = S.dni[dk || M.dzis()], gr = grupyKompletu(), zrobione = 0;
    if (d) for (var i = 0; i < gr.length; i++) if (grupaZrobiona(d, gr[i])) zrobione++;
    return { zrobione: zrobione, wszystkie: gr.length };
  };

  /* ------------------------------------------------------------------
     Przeliczanie dnia: punkty bazowe, premie, seria
     Otwarte (edytowalne) są tylko: dziś i wczoraj. Starsze dni są zamknięte.
     ------------------------------------------------------------------ */
  M.pojemnoscOchrony = function () { return K.premie.ochrona.zapasBazowy + M.poziom('szpital'); };

  function przeliczDzien(dk) {
    var d = S.dni[dk];
    if (!d) return;
    var dzis = dk === M.dzis();
    var stare = d.pkt || 0;
    var uzyte = {}, kat = {};
    var baza = 0, bonusBud = 0, zdPkt = 0, sesja = false;
    var zdT = d.zd ? d.zd.t : null;
    var i, w, z, b, k;

    for (i = 0; i < d.w.length; i++) {
      w = d.w[i];
      z = M.zadanie(w.t);
      b = 0;
      if (z) {
        if (z.typ === 'ekran') {
          b = (w.val != null && w.val <= S.ust.limitEkranuMin) ? z.punkty : 0;
        } else {
          var n = uzyte[w.t] || 0, szt = w.n || 1, lim = Infinity;
          uzyte[w.t] = n + szt;
          if (z.typ === 'raz') lim = 1;
          else if (z.typ === 'licznik') lim = z.max || Infinity;
          else if (z.typ === 'czas' && z.limitMin) lim = Math.floor(z.limitMin / z.minuty);
          b = Math.max(0, Math.min(szt, lim - n)) * z.punkty;
        }
        kat[z.kategoria] = (kat[z.kategoria] || 0) + b;
        if (b > 0 && K.premie.pierwszaSesja.zadania.indexOf(w.t) >= 0) sesja = true;
      }
      w.b = b;
      baza += b;
      bonusBud += b * (w.p || 0);
      if (w.t === zdT) zdPkt += b * (1 + (w.p || 0));
    }

    var pr = {};
    var bb = Math.round(bonusBud);
    if (bb > 0) pr.budynki = bb;
    var gr = grupyKompletu(), pelny = gr.length > 0;
    for (i = 0; i < gr.length; i++) if (!grupaZrobiona(d, gr[i])) { pelny = false; break; }
    if (pelny) pr.komplet = K.premie.komplet.punkty;
    if (sesja) pr.sesja = K.premie.pierwszaSesja.punkty;
    if (zdT && zdPkt > 0) {
      pr.zd = Math.max(1, Math.min(Math.round(zdPkt * (K.premie.zadanieDnia.mnoznik - 1)), K.premie.zadanieDnia.maxPremia));
    }
    var rdzen = baza;
    for (k in pr) rdzen += pr[k];
    d.rdzen = rdzen;
    d.zal = rdzen >= M.prog();
    d.pr = pr;

    // --- seria
    var pop = S.dni[przesun(dk, -1)];
    var popSeria = pop ? (pop.seria || 0) : 0;
    if (d.zal) {
      if (d.ochr) { delete d.ochr; S.ochrona = Math.min(S.ochrona + 1, M.pojemnoscOchrony()); }
      delete d.utr;
      d.seria = popSeria + 1;
    } else if (dzis) {
      d.seria = popSeria;                         // dzień jeszcze trwa
    } else {
      if (!d.ochr && popSeria > 0 && S.ochrona > 0) {
        d.ochr = 1; S.ochrona--;
        zdarzenie({ typ: 'ochrona', dk: dk, seria: popSeria });
      }
      if (!d.ochr && popSeria > 0 && !d.utr) {
        d.utr = 1;
        zdarzenie({ typ: 'utrata', dk: dk, seria: popSeria });
      }
      d.seria = d.ochr ? popSeria : 0;
    }
    if (d.zal) {
      pr.seria = Math.min(K.premie.seria.zaDzien * d.seria, K.premie.seria.max);
      var zi = M.bonusZieleni();
      if (zi > 0) pr.zielen = zi;
      if (d.seria > S.rekordSerii) S.rekordSerii = d.seria;
    }

    // --- dzień promocji za każdy pełny tydzień serii
    var pc = K.premie.promocja;
    var nalezy = d.zal && d.seria > 0 && d.seria % pc.coIleDniSerii === 0;
    if (nalezy && !d.promo) {
      if (S.promo < pc.maxZapas) { S.promo++; d.promo = 1; } else d.promo = 2;
    } else if (!nalezy && d.promo) {
      if (d.promo === 1) S.promo = Math.max(0, S.promo - 1);
      delete d.promo;
    }

    // --- wyzwanie tygodniowe
    var wk = poniedzialek(dk), T = S.tygodnie[wk];
    if (T && T.w) {
      var post = M.postepWyzwania(wk, dk);
      if (post >= T.w.cel) { if (!T.zrob || T.zrob > dk) T.zrob = dk; }
      else if (T.zrob === dk) T.zrob = null;
      if (T.zrob === dk) pr.tydz = K.premie.wyzwanie.punkty;
    }

    var razem = baza;
    for (k in pr) razem += pr[k];
    d.baza = baza;
    d.kat = kat;
    d.pkt = razem;
    var delta = razem - stare;
    if (delta) { S.pkt += delta; S.lacznie += delta; }
  }

  M.przelicz = function () {
    var dzis = M.dzis(), wcz = przesun(dzis, -1);
    if (S.dni[wcz]) przeliczDzien(wcz);
    if (!S.dni[dzis]) S.dni[dzis] = { w: [] };
    przeliczDzien(dzis);
  };

  /* ------------------------------------------------------------------
     Zadanie dnia
     ------------------------------------------------------------------ */
  M.ustawZadanieDnia = function (zid, notatka) {
    var dk = M.dzis(), d = dzienRek(dk, true);
    if (d.zd && ile(d, d.zd.t) > 0) return blad('Zadanie dnia jest już wykonane.');
    if (zid) {
      var z = M.zadanie(zid);
      if (!z || z.usuniete) return blad('Nie ma takiego zadania.');
      if (ile(d, zid) > 0) return blad('To zadanie jest już dziś odhaczone. Wybierz inne.');
      d.zd = { t: zid, n: String(notatka || '').trim().slice(0, 80) };
    } else {
      delete d.zd;
    }
    M.przelicz();
    M.zapisz();
    return { ok: true };
  };

  /* ------------------------------------------------------------------
     Wyzwanie tygodniowe
     ------------------------------------------------------------------ */
  function pasujeDoWyzwania(def, zid) {
    if (def.zadania && def.zadania.indexOf(zid) >= 0) return true;
    if (def.kategorie) { var z = M.zadanie(zid); return !!z && def.kategorie.indexOf(z.kategoria) >= 0; }
    return false;
  }
  M.postepWyzwania = function (wk, doDnia) {
    var T = S.tygodnie[wk];
    if (!T || !T.w) return 0;
    var def = T.w, suma = 0;
    for (var i = 0; i < 7; i++) {
      var dk = przesun(wk, i);
      if (dk < T.od) continue;
      if (doDnia && dk > doDnia) break;
      var d = S.dni[dk];
      if (!d) continue;
      if (def.miara === 'komplet') { if (d.pr && d.pr.komplet) suma++; continue; }
      var razy = 0, minuty = 0;
      for (var j = 0; j < d.w.length; j++) {
        var w = d.w[j];
        if (!pasujeDoWyzwania(def, w.t)) continue;
        var z = M.zadanie(w.t), szt = w.n || 1;
        minuty += szt * ((z && z.minuty) || 0);
        if (w.b > 0) razy += (z && z.typ === 'ekran') ? 1 : szt;
      }
      if (def.miara === 'razy') suma += razy;
      else if (def.miara === 'dni') suma += razy > 0 ? 1 : 0;
      else if (def.miara === 'minuty') suma += minuty;
    }
    return suma;
  };
  M.wyzwanie = function () {
    var wk = poniedzialek(M.dzis()), T = S.tygodnie[wk];
    var zostalo = 6 - roznicaDni(wk, M.dzis());
    if (!T || !T.w) return { wybrane: false, tydzien: wk, zostaloDni: zostalo };
    var post = M.postepWyzwania(wk);
    return { wybrane: true, tydzien: wk, def: T.w, postep: Math.min(post, T.w.cel), cel: T.w.cel, zrobione: !!T.zrob, zostaloDni: zostalo };
  };
  M.wybierzWyzwanie = function (def) {
    var dzis = M.dzis(), wk = poniedzialek(dzis), T = S.tygodnie[wk];
    if (T && T.zrob) return blad('Wyzwanie w tym tygodniu jest już zaliczone.');
    if (T && T.w && M.postepWyzwania(wk) > 0) return blad('Wyzwanie jest już w toku. Zmienisz je w następnym tygodniu.');
    var cel = Math.round(+def.cel);
    if (!(cel >= 1)) return blad('Podaj cel wyzwania.');
    var kopia = { id: def.id || 'wlasne', nazwa: String(def.nazwa || 'Własne wyzwanie').slice(0, 60), miara: def.miara || 'razy', cel: cel };
    if (def.zadania) kopia.zadania = def.zadania.slice();
    if (def.kategorie) kopia.kategorie = def.kategorie.slice();
    S.tygodnie[wk] = { w: kopia, od: dzis, zrob: null };
    M.przelicz();
    M.zapisz();
    return { ok: true };
  };

  /* ------------------------------------------------------------------
     Seria, ochrona, promocje
     ------------------------------------------------------------------ */
  M.seria = function () {
    var d = S.dni[M.dzis()], dni = d ? (d.seria || 0) : 0, co = K.premie.promocja.coIleDniSerii;
    return {
      dni: dni,
      zaliczonyDzis: !!(d && d.zal),
      rekord: Math.max(S.rekordSerii, dni),
      ochrona: S.ochrona,
      pojemnosc: M.pojemnoscOchrony(),
      promo: S.promo,
      promoAktywna: M.promocjaAktywna(),
      doPromocji: co - (dni % co)
    };
  };
  M.promocjaAktywna = function () { return !!S.promoDzien && S.promoDzien === M.dzis(); };
  M.aktywujPromocje = function () {
    if (M.promocjaAktywna()) return blad('Promocja już dziś działa.');
    if (S.promo < 1) return blad('Nie masz dnia promocji.');
    S.promo--;
    S.promoDzien = M.dzis();
    M.zapisz();
    return { ok: true };
  };

  /* ------------------------------------------------------------------
     Miasto: obiekty, mieszkańcy, ceny, wymagania
     ------------------------------------------------------------------ */
  function dzielnicaDef(id) {
    for (var i = 0; i < K.dzielnice.length; i++) if (K.dzielnice[i].id === id) return K.dzielnice[i];
    return null;
  }
  M.dzielnicaDef = dzielnicaDef;
  M.dzielnicaOdblokowana = function (id) { return S.dzielnice.indexOf(id) >= 0; };
  M.teren = function (dz, x, y) {
    var def = dzielnicaDef(dz);
    if (!def || x < 0 || y < 0 || x >= N || y >= N) return null;
    return def.mapa[y].charAt(x);
  };

  M.obiekt = function (id) {
    for (var i = 0; i < S.obiekty.length; i++) if (S.obiekty[i].id === id) return S.obiekty[i];
    return null;
  };
  M.obiektNa = function (dz, x, y) {
    for (var i = 0; i < S.obiekty.length; i++) {
      var o = S.obiekty[i];
      if (o.dz === dz && o.x === x && o.y === y) return o;
    }
    return null;
  };
  M.obiektyTypu = function (typ) { return S.obiekty.filter(function (o) { return o.typ === typ; }); };
  M.poziom = function (typ) {
    if (!S) return 0;
    for (var i = 0; i < S.obiekty.length; i++) if (S.obiekty[i].typ === typ) return S.obiekty[i].poz;
    return 0;
  };
  M.budowaObiektu = function (id) {
    for (var i = 0; i < S.budowy.length; i++) if (S.budowy[i].id === id) return S.budowy[i];
    return null;
  };

  function wartoscPoziomu(tab, poz) {
    if (tab == null) return 0;
    if (typeof tab === 'number') return tab;
    if (poz < 1) return 0;
    return tab[Math.min(poz, tab.length) - 1] || 0;
  }
  M.mieszkancyObiektu = function (typ, poz) { return wartoscPoziomu(K.obiekty[typ].mieszkancy, poz); };
  M.mieszkancy = function () {
    var s = 0;
    for (var i = 0; i < S.obiekty.length; i++) {
      var o = S.obiekty[i], def = K.obiekty[o.typ];
      if (def && o.poz > 0) s += wartoscPoziomu(def.mieszkancy, o.poz);
    }
    return s;
  };
  M.zielen = function () {
    var s = 0;
    for (var i = 0; i < S.obiekty.length; i++) {
      var o = S.obiekty[i], def = K.obiekty[o.typ];
      if (def && def.zielen && o.poz > 0) s += def.zielen;
    }
    return s;
  };
  M.bonusZieleni = function () {
    var z = K.premie.zielen;
    return Math.min(Math.floor(M.zielen() / z.punktyZieleniNaPunkt), z.max);
  };

  function moce() {
    var out = [];
    for (var typ in K.obiekty) if (K.obiekty[typ].grupa === 'moc' && typ !== 'ratusz') out.push(typ);
    return out;
  }
  M.moce = moce;

  M.rabat = function (typ) {
    var w = typ === 'warsztat' ? 0 : Math.min(M.poziom('warsztat') * K.warsztat.rabatNaPoziom, K.warsztat.maxRabat);
    var p = M.promocjaAktywna() ? K.premie.promocja.rabatProcent : 0;
    return { warsztat: w, promocja: p };
  };
  function cena(baza, typ) {
    if (!baza) return 0;
    var r = M.rabat(typ);
    return Math.max(1, Math.round(baza * (1 - r.warsztat / 100) * (1 - r.promocja / 100)));
  }
  M.koszt = function (typ, poz) {
    var baza = K.obiekty[typ].koszt[poz - 1] || 0;
    return { baza: baza, cena: cena(baza, typ) };
  };
  M.maxPoziom = function (typ) { return K.obiekty[typ].koszt.length; };
  M.nocna = function (typ, poz) { return (K.obiekty[typ].koszt[poz - 1] || 0) >= K.budowa.nocnaOdKosztu; };
  M.ekipy = function () {
    return { razem: M.poziom('warsztat') >= K.budowa.drugaEkipaOdWarsztatu ? 2 : 1, zajete: S.budowy.length };
  };
  M.czasGotowosci = function () {
    var d = dataZKlucza(przesun(dzienZTs(M.zegar()), 1));
    d.setHours(K.budowa.godzinaGotowosci, 0, 0, 0);
    return d.getTime();
  };

  M.wymagania = function (typ, poz) {
    var def = K.obiekty[typ], w = [];
    var R = M.poziom('ratusz');
    function dodaj(tekst, ok) { w.push({ tekst: tekst, ok: !!ok }); }
    if (typ !== 'ratusz') {
      var potrzebny = Math.max(def.odRatusza || 1, def.bezLimituRatusza ? 0 : poz);
      if (potrzebny > 1) dodaj('Ratusz poz. ' + potrzebny, R >= potrzebny);
    } else {
      var r = K.ratusz[poz];
      if (r) {
        if (r.mieszkancy) dodaj(M.fmt(r.mieszkancy) + ' mieszkańców', M.mieszkancy() >= r.mieszkancy);
        if (r.liczbaMocy) {
          var ileMocy = moce().filter(function (t) { return M.poziom(t) >= 1; }).length;
          dodaj(r.liczbaMocy + ' ' + M.odmiana(r.liczbaMocy, 'budynek z mocą', 'budynki z mocami', 'budynków z mocami'), ileMocy >= r.liczbaMocy);
        }
        if (r.wszystkieMoceMin) {
          var wszystkie = moce().every(function (t) { return M.poziom(t) >= r.wszystkieMoceMin; });
          dodaj('Wszystkie budynki z mocami na poz. ' + r.wszystkieMoceMin, wszystkie);
        }
      }
    }
    var ww = wartoscPoziomu(def.warsztat, poz);
    if (ww && typ !== 'warsztat') dodaj('Warsztat poz. ' + ww, M.poziom('warsztat') >= ww);
    var wm = wartoscPoziomu(def.wymagaMieszkancow, poz);
    if (wm) dodaj(M.fmt(wm) + ' mieszkańców', M.mieszkancy() >= wm);
    if (def.teren === 'przyWodzie') {
      var jest = S.dzielnice.some(function (id) { return dzielnicaDef(id).mapa.join('').indexOf('w') >= 0; });
      dodaj('Dzielnica nad rzeką', jest);
    }
    return w;
  };

  M.sprawdz = function (typ, poz) {
    var koszt = M.koszt(typ, poz), nocna = M.nocna(typ, poz), wym = M.wymagania(typ, poz), braki = [];
    for (var i = 0; i < wym.length; i++) if (!wym[i].ok) braki.push('Wymaga: ' + wym[i].tekst);
    var e = M.ekipy();
    var brakEkipy = nocna && e.zajete >= e.razem;
    if (brakEkipy) braki.push(e.razem > 1 ? 'Obie ekipy budowlane są zajęte do rana' : 'Ekipa budowlana jest zajęta do rana');
    var brak = Math.max(0, koszt.cena - S.pkt);
    if (brak) braki.push('Brakuje ' + M.fmt(brak) + ' pkt');
    return { koszt: koszt, nocna: nocna, wym: wym, braki: braki, ok: braki.length === 0, brakPunktow: brak, brakEkipy: brakEkipy };
  };

  /* Oferta sklepu dla typu obiektu */
  M.oferta = function (typ) {
    var def = K.obiekty[typ], o = { typ: typ, def: def, ist: null };
    var k;
    if (def.unikat) o.ist = M.obiektyTypu(typ)[0] || null;
    else o.ile = M.obiektyTypu(typ).length;
    if (o.ist) {
      o.bud = M.budowaObiektu(o.ist.id);
      if (o.bud) { o.stan = 'budowa'; return o; }
      if (o.ist.poz >= M.maxPoziom(typ)) { o.stan = 'max'; return o; }
      o.stan = 'ulepsz';
      o.poz = o.ist.poz + 1;
    } else {
      o.stan = 'nowy';
      o.poz = 1;
    }
    var s = M.sprawdz(typ, o.poz);
    for (k in s) o[k] = s[k];
    return o;
  };

  /* Oferta ulepszenia konkretnego obiektu */
  M.ofertaUlepszenia = function (id) {
    var ob = M.obiekt(id);
    if (!ob) return null;
    var def = K.obiekty[ob.typ], o = { typ: ob.typ, def: def, ist: ob };
    o.bud = M.budowaObiektu(id);
    if (o.bud) { o.stan = 'budowa'; return o; }
    if (ob.poz >= M.maxPoziom(ob.typ)) { o.stan = 'max'; return o; }
    o.stan = 'ulepsz';
    o.poz = ob.poz + 1;
    var s = M.sprawdz(ob.typ, o.poz);
    for (var k in s) o[k] = s[k];
    return o;
  };

  M.opisEfektu = function (typ, poz) {
    var def = K.obiekty[typ];
    if (poz < 1) return '';
    if (def.bonus) return '+' + (def.bonus.procent * poz) + '% punktów';
    if (def.efekt === 'warsztat') {
      var r = Math.min(poz * K.warsztat.rabatNaPoziom, K.warsztat.maxRabat);
      return 'budowy tańsze o ' + r + '%' + (poz >= K.budowa.drugaEkipaOdWarsztatu ? ', dwie ekipy' : '');
    }
    if (def.efekt === 'ochrona') return 'zapas ' + (K.premie.ochrona.zapasBazowy + poz) + ' dni ochrony serii';
    if (def.efekt === 'bank') return poz * K.bank.procentNaPoziom + '% odsetek co tydzień, do ' + (poz * K.bank.maxNaPoziom) + ' pkt';
    if (typ === 'ratusz') return 'budynki do poziomu ' + poz;
    var cz = [];
    var m = wartoscPoziomu(def.mieszkancy, poz);
    if (m) cz.push(M.fmt(m) + ' mieszkańców');
    if (def.zielen) cz.push('zieleń +' + def.zielen);
    return cz.join(', ');
  };

  /* Czy na tej działce można postawić obiekt danego typu */
  M.moznaTu = function (typ, dz, x, y, pominId) {
    var def = K.obiekty[typ];
    if (!M.dzielnicaOdblokowana(dz)) return blad('Ta dzielnica nie jest jeszcze otwarta.');
    var t = M.teren(dz, x, y);
    if (t !== '.') return blad(t === 'w' ? 'Tu płynie rzeka.' : 'Na tym polu nie można budować.');
    var zajete = M.obiektNa(dz, x, y);
    if (zajete && zajete.id !== pominId) return blad('Ta działka jest zajęta.');
    var s4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], i;
    if (def.teren === 'przyWodzie') {
      var woda = false;
      for (i = 0; i < 4; i++) if (M.teren(dz, x + s4[i][0], y + s4[i][1]) === 'w') woda = true;
      if (!woda) return blad('Bulwar musi stać na działce przy rzece.');
    }
    if (def.teren === 'przyUlicy') {
      var ulica = false;
      for (i = 0; i < 4; i++) {
        var s = M.obiektNa(dz, x + s4[i][0], y + s4[i][1]);
        if (s && s.typ === 'ulica' && s.id !== pominId) ulica = true;
      }
      if (!ulica) return blad('Przystanek musi stać przy ulicy.');
    }
    if (def.maxNaDzielnice) {
      var n = S.obiekty.filter(function (o) { return o.typ === typ && o.dz === dz && o.id !== pominId; }).length;
      if (n >= def.maxNaDzielnice) return blad('W tej dzielnicy jest już komplet: ' + def.maxNaDzielnice + '.');
    }
    return { ok: true };
  };
  M.wolneDzialki = function (dz) {
    var n = 0;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (M.teren(dz, x, y) === '.' && !M.obiektNa(dz, x, y)) n++;
    return n;
  };

  function poUkonczeniu(ob, poz, wTle) {
    var def = K.obiekty[ob.typ];
    if (def.efekt === 'ochrona') S.ochrona = Math.min(S.ochrona + 1, M.pojemnoscOchrony());
    var otwarta = null;
    if (def.odblokowuje && S.dzielnice.indexOf(def.odblokowuje) < 0) {
      S.dzielnice.push(def.odblokowuje);
      otwarta = def.odblokowuje;
    }
    if (wTle) {
      zdarzenie({ typ: 'budowa', id: ob.id, obiekt: ob.typ, poz: poz });
      if (otwarta) zdarzenie({ typ: 'dzielnica', dz: otwarta });
    }
    return otwarta;
  }

  M.zbuduj = function (typ, dz, x, y) {
    var def = K.obiekty[typ];
    if (!def) return blad('Nieznany obiekt.');
    if (def.unikat && M.obiektyTypu(typ).length) return blad('Ten budynek już stoi w mieście.');
    var s = M.sprawdz(typ, 1);
    if (!s.ok) return blad(s.braki[0]);
    var m = M.moznaTu(typ, dz, x, y);
    if (!m.ok) return m;
    S.pkt -= s.koszt.cena;
    S.wydane += s.koszt.cena;
    var ob = { id: S.nid++, typ: typ, poz: s.nocna ? 0 : 1, dz: dz, x: x, y: y };
    S.obiekty.push(ob);
    var otwarta = null;
    if (s.nocna) S.budowy.push({ id: ob.id, doPoz: 1, gotowe: M.czasGotowosci(), od: M.zegar() });
    else otwarta = poUkonczeniu(ob, 1, false);
    M.przelicz();
    M.zapisz();
    return { ok: true, obiekt: ob, nocna: s.nocna, cena: s.koszt.cena, otwarta: otwarta };
  };

  M.ulepsz = function (id) {
    var ob = M.obiekt(id);
    if (!ob) return blad('Nie ma takiego budynku.');
    if (M.budowaObiektu(id)) return blad('Ten budynek jest w budowie.');
    var poz = ob.poz + 1;
    if (poz > M.maxPoziom(ob.typ)) return blad('To już najwyższy poziom.');
    var s = M.sprawdz(ob.typ, poz);
    if (!s.ok) return blad(s.braki[0]);
    S.pkt -= s.koszt.cena;
    S.wydane += s.koszt.cena;
    var otwarta = null;
    if (s.nocna) S.budowy.push({ id: id, doPoz: poz, gotowe: M.czasGotowosci(), od: M.zegar() });
    else { ob.poz = poz; otwarta = poUkonczeniu(ob, poz, false); }
    M.przelicz();
    M.zapisz();
    return { ok: true, obiekt: ob, nocna: s.nocna, cena: s.koszt.cena, poz: poz, otwarta: otwarta };
  };

  M.przenies = function (id, dz, x, y) {
    var ob = M.obiekt(id);
    if (!ob) return blad('Nie ma takiego budynku.');
    var m = M.moznaTu(ob.typ, dz, x, y, id);
    if (!m.ok) return m;
    ob.dz = dz; ob.x = x; ob.y = y;
    M.zapisz();
    return { ok: true };
  };

  M.zwrotZaWyburzenie = function (id) {
    var ob = M.obiekt(id);
    if (!ob) return 0;
    var def = K.obiekty[ob.typ], suma = 0;
    for (var i = 0; i < ob.poz; i++) suma += def.koszt[i] || 0;
    return Math.round(suma * K.budowa.zwrotZaWyburzenie);
  };
  M.wyburz = function (id) {
    var ob = M.obiekt(id);
    if (!ob) return blad('Nie ma takiego budynku.');
    if (K.obiekty[ob.typ].unikat) return blad('Tego budynku nie można wyburzyć. Możesz go przenieść.');
    if (M.budowaObiektu(id)) return blad('Ten budynek jest w budowie.');
    var zwrot = M.zwrotZaWyburzenie(id);
    S.obiekty = S.obiekty.filter(function (o) { return o.id !== id; });
    S.pkt += zwrot;
    S.wydane -= zwrot;
    M.przelicz();
    M.zapisz();
    return { ok: true, zwrot: zwrot };
  };

  M.sprawdzDzielnice = function (id) {
    var def = dzielnicaDef(id), wym = [], braki = [];
    if (def.przezObiekt) wym.push({ tekst: K.obiekty[def.przezObiekt].nazwa, ok: M.poziom(def.przezObiekt) >= 1 });
    if (def.odRatusza) wym.push({ tekst: 'Ratusz poz. ' + def.odRatusza, ok: M.poziom('ratusz') >= def.odRatusza });
    if (def.mieszkancy) wym.push({ tekst: M.fmt(def.mieszkancy) + ' mieszkańców', ok: M.mieszkancy() >= def.mieszkancy });
    for (var i = 0; i < wym.length; i++) if (!wym[i].ok) braki.push('Wymaga: ' + wym[i].tekst);
    var koszt = { baza: def.koszt || 0, cena: cena(def.koszt || 0, 'dzielnica') };
    var brak = Math.max(0, koszt.cena - S.pkt);
    if (brak) braki.push('Brakuje ' + M.fmt(brak) + ' pkt');
    return { def: def, otwarta: M.dzielnicaOdblokowana(id), wym: wym, braki: braki, ok: braki.length === 0, koszt: koszt, kupowana: !def.przezObiekt };
  };
  M.kupDzielnice = function (id) {
    if (M.dzielnicaOdblokowana(id)) return blad('Ta dzielnica jest już otwarta.');
    var s = M.sprawdzDzielnice(id);
    if (!s.kupowana) return blad('Tę dzielnicę otwiera ' + K.obiekty[s.def.przezObiekt].nazwa + '.');
    if (!s.ok) return blad(s.braki[0]);
    S.pkt -= s.koszt.cena;
    S.wydane += s.koszt.cena;
    S.dzielnice.push(id);
    M.zapisz();
    return { ok: true, cena: s.koszt.cena };
  };

  /* ------------------------------------------------------------------
     Upływ czasu: nowe dni, nowy tydzień, ukończone budowy
     ------------------------------------------------------------------ */
  function nowyTydzien() {
    var poj = M.pojemnoscOchrony();
    if (S.ochrona < poj) S.ochrona = Math.min(poj, S.ochrona + K.premie.ochrona.naTydzien);
    var lb = M.poziom('bank');
    if (lb > 0 && S.pkt > 0) {
      var o = Math.min(Math.floor(S.pkt * lb * K.bank.procentNaPoziom / 100), lb * K.bank.maxNaPoziom);
      if (o > 0) {
        S.pkt += o; S.lacznie += o; S.odsetki += o;
        zdarzenie({ typ: 'odsetki', kwota: o });
      }
    }
  }

  function kompaktuj() {
    var granica = przesun(M.dzis(), -120);
    for (var dk in S.dni) {
      if (dk >= granica) continue;
      var d = S.dni[dk];
      if (d.komp) continue;
      var m = {}, lista = [];
      for (var i = 0; i < d.w.length; i++) {
        var w = d.w[i], e = m[w.t];
        if (!e) { e = m[w.t] = { t: w.t, n: 0, b: 0 }; lista.push(e); }
        e.n += w.n || 1;
        e.b += w.b || 0;
        if (w.val != null) e.val = w.val;
      }
      d.w = lista;
      d.komp = 1;
    }
  }

  M.tyk = function () {
    if (!S) return false;
    var zmiana = false, dzis = dzienZTs(M.zegar());
    while (S.ostDzien < dzis) {
      var stary = S.ostDzien, nowy = przesun(stary, 1);
      if (!S.dni[stary]) S.dni[stary] = { w: [] };
      S.ostDzien = nowy;
      przeliczDzien(stary);                                  // zamknięcie dnia: ochrona albo utrata serii
      if (poniedzialek(nowy) !== poniedzialek(stary)) nowyTydzien();
      if (!S.dni[nowy]) S.dni[nowy] = { w: [] };
      zmiana = true;
    }
    var t = M.zegar(), lista = S.budowy.slice();
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].gotowe <= t) {
        var ob = M.obiekt(lista[i].id);
        S.budowy = S.budowy.filter(function (b) { return b !== lista[i]; });
        if (ob) { ob.poz = lista[i].doPoz; poUkonczeniu(ob, ob.poz, true); }
        zmiana = true;
      }
    }
    if (zmiana) {
      M.przelicz();
      kompaktuj();
      M.zapisz();
      pamiec.set(KLUCZ_KOPII, JSON.stringify(S));
    }
    return zmiana;
  };

  /* ------------------------------------------------------------------
     Statystyki
     ------------------------------------------------------------------ */
  M.historia = function (n) {
    var out = [], dzis = M.dzis();
    for (var i = n - 1; i >= 0; i--) {
      var dk = przesun(dzis, -i), d = S.dni[dk];
      out.push({
        dk: dk, jest: !!d && dk >= S.start, dzis: i === 0,
        pkt: d ? (d.pkt || 0) : 0, zal: !!(d && d.zal), ochr: !!(d && d.ochr), kat: d ? (d.kat || {}) : {}
      });
    }
    return out;
  };
  /* Suma odhaczeń, minut i punktów bazowych na zadanie w zakresie dni (włącznie) */
  M.agregat = function (od, doDnia) {
    var a = {};
    for (var dk = od; dk <= doDnia; dk = przesun(dk, 1)) {
      var d = S.dni[dk];
      if (!d) continue;
      var bylo = {};
      for (var i = 0; i < d.w.length; i++) {
        var w = d.w[i], z = M.zadanie(w.t), e = a[w.t] || (a[w.t] = { razy: 0, minuty: 0, pkt: 0, dni: 0, wartosci: [] });
        var szt = w.n || 1;
        e.razy += szt;
        e.minuty += szt * ((z && z.minuty) || 0);
        e.pkt += w.b || 0;
        if (w.val != null) e.wartosci.push(w.val);
        if (!bylo[w.t]) { bylo[w.t] = 1; e.dni++; }
      }
    }
    return a;
  };
  M.sumaPunktow = function (od, doDnia) {
    var s = 0;
    for (var dk = od; dk <= doDnia; dk = przesun(dk, 1)) { var d = S.dni[dk]; if (d) s += d.pkt || 0; }
    return s;
  };

  /* Dane dla service workera (powiadomienia w tle) */
  M.metaPowiadomien = function () {
    var d = S.dni[M.dzis()] || {};
    return {
      ts: M.zegar(),
      poczatekGodzina: K.dzien.poczatekGodzina,
      powiad: S.ust.powiad,
      budowy: S.budowy.map(function (b) {
        var ob = M.obiekt(b.id);
        return { id: b.id, gotowe: b.gotowe, nazwa: ob ? K.obiekty[ob.typ].nazwa : 'Budowa', poz: b.doPoz };
      }),
      dzien: { klucz: M.dzis(), brakuje: Math.max(0, M.prog() - (d.rdzen || 0)), zal: !!d.zal, seria: d.seria || 0 }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
