/* =====================================================================
   MIASTO – grafika: izometryczne budynki rysowane w SVG
   Każdy obiekt mieści się na jednej działce (romb 120 × 60 jednostek).
   ===================================================================== */
(function (g) {
  'use strict';

  var G = {};
  g.G = G;

  var HW = 60, HH = 30;          // połowa szerokości i wysokości rombu
  var minY = 0;                  // najwyższy punkt rysowanego obiektu
  var NOC = false;
  var SEED = 1;
  var nrOkna = 0;

  /* ---------- geometria ---------- */
  // u, v: położenie na działce (0..1), z: wysokość
  function P(u, v, z) {
    var y = (u + v) * HH - HH - (z || 0);
    if (y < minY) minY = y;
    return [(u - v) * HW, y];
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function pts(a) {
    var s = '';
    for (var i = 0; i < a.length; i++) s += (i ? ' ' : '') + r1(a[i][0]) + ',' + r1(a[i][1]);
    return s;
  }
  function wiel(a, fill, extra) { return '<polygon points="' + pts(a) + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function linia(a, kolor, szer, extra) {
    return '<polyline points="' + pts(a) + '" fill="none" stroke="' + kolor + '" stroke-width="' + (szer || 1) + '"' + (extra || '') + '/>';
  }
  function kolo(c, r, fill, extra) { return '<circle cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" r="' + r + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function elipsa(c, rx, ry, fill, extra) {
    return '<ellipse cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function prost(x, y, w, h, fill, extra) {
    return '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function napis(c, txt, rozmiar, fill) {
    return '<text x="' + r1(c[0]) + '" y="' + r1(c[1]) + '" font-size="' + rozmiar + '" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="' + fill +
      '" font-family="\'Sofia Sans Condensed\',\'Arial Narrow\',sans-serif">' + txt + '</text>';
  }

  /* ---------- kolory ---------- */
  function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function hex(r, gg, b) { return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(gg) << 8) + Math.round(b)).toString(16).slice(1); }
  function mix(a, b, t) {
    var A = rgb(a), B = rgb(b);
    return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }
  function jasn(h, t) { return mix(h, '#ffffff', t); }
  function ciemn(h, t) { return mix(h, '#0b1020', t); }
  function C(h) { return NOC ? mix(h, '#0f1638', 0.56) : h; }       // nocą wszystko gaśnie w granat
  function los(n) { var x = Math.sin(SEED * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); }

  var SWIATLO = '#ffd76a', SWIATLO2 = '#ffe9a8';
  function szyba(ciemniejsza) {
    nrOkna++;
    if (NOC) return los(nrOkna) < 0.52 ? (los(nrOkna + 71) < 0.5 ? SWIATLO : SWIATLO2) : '#182046';
    return ciemniejsza ? '#35506f' : '#4a6a8f';
  }
  function szklo(jasne) { return NOC ? SWIATLO2 : (jasne ? '#c4e6f6' : '#a8d3ea'); }

  /* ---------- bryły ---------- */
  function blok(u0, v0, u1, v1, z0, z1, kol, o) {
    o = o || {};
    return wiel([P(u0, v1, z0), P(u1, v1, z0), P(u1, v1, z1), P(u0, v1, z1)], C(o.l || kol)) +
      wiel([P(u1, v1, z0), P(u1, v0, z0), P(u1, v0, z1), P(u1, v1, z1)], C(o.p || ciemn(kol, 0.2))) +
      wiel([P(u0, v0, z1), P(u1, v0, z1), P(u1, v1, z1), P(u0, v1, z1)], C(o.g || jasn(kol, 0.24)));
  }
  // prostokąt na lewej ścianie (v stałe) i na prawej ścianie (u stałe)
  function scL(ua, ub, v, za, zb, fill, extra) { return wiel([P(ua, v, za), P(ub, v, za), P(ub, v, zb), P(ua, v, zb)], fill, extra); }
  function scP(va, vb, u, za, zb, fill, extra) { return wiel([P(u, va, za), P(u, vb, za), P(u, vb, zb), P(u, va, zb)], fill, extra); }

  function oknaL(u0, u1, v, z0, z1, kol, rz, o) {
    o = o || {};
    var iu = o.iu == null ? 0.22 : o.iu, ib = o.ib == null ? 0.24 : o.ib, it = o.it == null ? 0.2 : o.it;
    var du = (u1 - u0) / kol, dz = (z1 - z0) / rz, s = '';
    for (var r = 0; r < rz; r++) for (var c = 0; c < kol; c++) {
      if (o.pomin && o.pomin(c, r)) continue;
      s += scL(u0 + du * (c + iu), u0 + du * (c + 1 - iu), v, z0 + dz * (r + ib), z0 + dz * (r + 1 - it), o.jasne ? szklo(false) : szyba(false));
    }
    return s;
  }
  function oknaP(v0, v1, u, z0, z1, kol, rz, o) {
    o = o || {};
    var iu = o.iu == null ? 0.22 : o.iu, ib = o.ib == null ? 0.24 : o.ib, it = o.it == null ? 0.2 : o.it;
    var dv = (v1 - v0) / kol, dz = (z1 - z0) / rz, s = '';
    for (var r = 0; r < rz; r++) for (var c = 0; c < kol; c++) {
      if (o.pomin && o.pomin(c, r)) continue;
      s += scP(v0 + dv * (c + iu), v0 + dv * (c + 1 - iu), u, z0 + dz * (r + ib), z0 + dz * (r + 1 - it), o.jasne ? szklo(false) : szyba(true));
    }
    return s;
  }

  /* ---------- dachy ---------- */
  function dachNamiot(u0, v0, u1, v1, z, h, kol) {
    var A = P((u0 + u1) / 2, (v0 + v1) / 2, z + h);
    return wiel([P(u0, v0, z), P(u1, v0, z), A], C(jasn(kol, 0.1))) +
      wiel([P(u0, v0, z), P(u0, v1, z), A], C(jasn(kol, 0.2))) +
      wiel([P(u0, v1, z), P(u1, v1, z), A], C(kol)) +
      wiel([P(u1, v1, z), P(u1, v0, z), A], C(ciemn(kol, 0.2)));
  }
  function dachSciety(u0, v0, u1, v1, z, h, w, kol) {
    var a0 = u0 + w, b0 = v0 + w, a1 = u1 - w, b1 = v1 - w, zt = z + h;
    return wiel([P(u0, v0, z), P(u1, v0, z), P(a1, b0, zt), P(a0, b0, zt)], C(jasn(kol, 0.1))) +
      wiel([P(u0, v0, z), P(u0, v1, z), P(a0, b1, zt), P(a0, b0, zt)], C(jasn(kol, 0.2))) +
      wiel([P(u0, v1, z), P(u1, v1, z), P(a1, b1, zt), P(a0, b1, zt)], C(kol)) +
      wiel([P(u1, v1, z), P(u1, v0, z), P(a1, b0, zt), P(a1, b1, zt)], C(ciemn(kol, 0.2))) +
      wiel([P(a0, b0, zt), P(a1, b0, zt), P(a1, b1, zt), P(a0, b1, zt)], C(jasn(kol, 0.3)));
  }
  // os = 'u': kalenica wzdłuż u (szczyt na prawej ścianie); os = 'v': kalenica wzdłuż v (szczyt na lewej ścianie)
  function dachDwuspad(u0, v0, u1, v1, z, h, kol, os, mur) {
    if (os === 'u') {
      var vm = (v0 + v1) / 2;
      return wiel([P(u0, v0, z), P(u1, v0, z), P(u1, vm, z + h), P(u0, vm, z + h)], C(jasn(kol, 0.18))) +
        wiel([P(u0, v1, z), P(u1, v1, z), P(u1, vm, z + h), P(u0, vm, z + h)], C(kol)) +
        wiel([P(u1, v1, z), P(u1, v0, z), P(u1, vm, z + h)], C(ciemn(mur, 0.2)));
    }
    var um = (u0 + u1) / 2;
    return wiel([P(u0, v0, z), P(u0, v1, z), P(um, v1, z + h), P(um, v0, z + h)], C(jasn(kol, 0.18))) +
      wiel([P(u1, v0, z), P(u1, v1, z), P(um, v1, z + h), P(um, v0, z + h)], C(ciemn(kol, 0.18))) +
      wiel([P(u0, v1, z), P(u1, v1, z), P(um, v1, z + h)], C(mur));
  }

  /* ---------- drobne elementy ---------- */
  function slup(u, v, z0, z1, szer, kol) {
    var a = P(u, v, z0), b = P(u, v, z1);
    return prost(a[0] - szer / 2, b[1], szer, a[1] - b[1], C(kol));
  }
  function flaga(u, v, z, wys) {
    var a = P(u, v, z), b = P(u, v, z + wys);
    return linia([a, b], C('#5b606b'), 1) + prost(b[0], b[1], 9, 3, C('#ffffff')) + prost(b[0], b[1] + 3, 9, 3, C('#d21f2b'));
  }
  function drzewo(u, v, s, rodzaj) {
    var c = P(u, v, 0), x = c[0], y = c[1], o = '';
    s = s || 1;
    P(u, v, 30 * s);
    o += elipsa([x, y], 7.5 * s, 3.4 * s, 'rgba(10,20,40,.2)');
    o += prost(x - 1.3 * s, y - 9 * s, 2.6 * s, 9 * s, C('#7a5230'));
    if (rodzaj === 'iglak') {
      o += wiel([[x - 7.5 * s, y - 6 * s], [x + 7.5 * s, y - 6 * s], [x, y - 19 * s]], C('#2f7d4f'));
      o += wiel([[x - 6 * s, y - 13 * s], [x + 6 * s, y - 13 * s], [x, y - 25 * s]], C('#3b8f5c'));
      o += wiel([[x - 4.2 * s, y - 19.5 * s], [x + 4.2 * s, y - 19.5 * s], [x, y - 29 * s]], C('#49a06a'));
    } else {
      var k = rodzaj === 'jesien' ? '#d9a13b' : '#4c9f57', k2 = rodzaj === 'jesien' ? '#eabf5a' : '#6dbb6b';
      o += kolo([x, y - 15 * s], 8.6 * s, C(k)) + kolo([x - 2.6 * s, y - 17.6 * s], 5 * s, C(k2));
    }
    return o;
  }
  function latarnia(u, v, wys) {
    wys = wys || 17;
    var a = P(u, v, 0), b = P(u, v, wys), o = linia([a, b], C('#4b525d'), 1.1);
    if (NOC) o += kolo(b, 7, 'rgba(255,220,120,.28)');
    return o + kolo(b, 2, NOC ? SWIATLO2 : '#f4f1e6');
  }
  function lawka(u, v) { return blok(u, v, u + 0.16, v + 0.05, 2, 3.6, '#a9743f'); }
  function plyta(kol, wciecie) {
    var w = wciecie == null ? 0.045 : wciecie;
    return wiel([P(w, w), P(1 - w, w), P(1 - w, 1 - w), P(w, 1 - w)], C(kol || '#d9d5cb'));
  }
  function romb(kol) { return wiel([P(0, 0), P(1, 0), P(1, 1), P(0, 1)], C(kol)); }
  function pojazd(u0, v0, u1, v1, dol, gora, okna) {
    var s = blok(u0, v0, u1, v1, 2, 9, dol) + blok(u0, v0, u1, v1, 9, 17, gora);
    s += scL(u0 + 0.03, u1 - 0.03, v1, 10.5, 15.5, NOC ? SWIATLO2 : '#33475f');
    s += scP(v0 + 0.03, v1 - 0.03, u1, 10.5, 15.5, NOC ? SWIATLO : '#263850');
    for (var i = 0; i < okna; i++) {
      var u = u0 + (u1 - u0) * (i + 0.5) / okna;
      s += kolo(P(u, v1, 2.4), 2.5, C('#22262c'));
    }
    return s;
  }
  function zuraw(u, v, z0, z1) {
    var z = '#f2b90f', s = slup(u, v, z0, z1, 2.6, z);
    s += linia([P(u, v, z1 - 3), P(u - 0.52, v, z1 - 3)], C(z), 2.2);
    s += linia([P(u, v, z1 - 3), P(u + 0.16, v, z1 - 3)], C(z), 2.2);
    s += linia([P(u, v, z1 + 3), P(u - 0.3, v, z1 - 3)], C(z), 0.9);
    s += linia([P(u - 0.42, v, z1 - 3), P(u - 0.42, v, z1 - 15)], C('#3a3f48'), 0.8);
    s += prost(P(u + 0.16, v, z1 - 3)[0] - 3, P(u + 0.16, v, z1 - 3)[1], 6, 5, C('#6f7985'));
    return s;
  }

  /* =====================================================================
     Rysunki obiektów. L = poziom (1..), o = opcje (sasiedzi, woda, wariant)
     ===================================================================== */
  var RYS = {};

  RYS.ratusz = function (L) {
    var h = 26 + 3 * L, mur = '#ecdcb8', dach = '#b4483a', miedz = '#5aa08a', s = plyta();
    var rz = L >= 3 ? 2 : 1, i;
    if (L >= 4) {
      s += blok(0.1, 0.18, 0.22, 0.3, 0, h + 9, jasn(mur, 0.08)) + dachNamiot(0.09, 0.17, 0.23, 0.31, h + 9, 9, miedz);
      s += blok(0.78, 0.18, 0.9, 0.3, 0, h + 9, jasn(mur, 0.08)) + dachNamiot(0.77, 0.17, 0.91, 0.31, h + 9, 9, miedz);
    }
    s += blok(0.12, 0.2, 0.88, 0.8, 0, h, mur);
    s += oknaL(0.12, 0.88, 0.8, 7, h - 2, 6, rz, { pomin: function (c, r) { return r === 0 && (c === 2 || c === 3); } });
    s += scL(0.4, 0.6, 0.8, 0, 13, C('#6d4b2c')) + scL(0.44, 0.56, 0.8, 0, 10, NOC ? SWIATLO : '#3f2d1c');
    s += oknaP(0.2, 0.8, 0.88, 7, h - 2, 4, rz);
    s += dachSciety(0.09, 0.17, 0.91, 0.83, h, 8, 0.1, dach);
    var w0 = h + 2, w1 = h + 22 + 7 * L;
    s += blok(0.4, 0.4, 0.6, 0.6, w0, w1, jasn(mur, 0.12));
    var zc = P(0.5, 0.6, w1 - 9);
    s += kolo(zc, 5.4, NOC ? SWIATLO2 : '#fdfaf0', ' stroke="' + C('#5b4630') + '" stroke-width="1"');
    s += linia([zc, [zc[0], zc[1] - 3.6]], '#3b2f22', 1) + linia([zc, [zc[0] + 2.6, zc[1] + 1.1]], '#3b2f22', 1);
    if (L >= 2) s += scL(0.45, 0.55, 0.6, w0 + 6, w1 - 18, szyba(false));
    s += dachNamiot(0.37, 0.37, 0.63, 0.63, w1, 15, miedz);
    s += flaga(0.5, 0.5, w1 + 15, 14);
    if (L >= 4) {
      s += blok(0.1, 0.7, 0.22, 0.82, 0, h + 9, jasn(mur, 0.08)) + dachNamiot(0.09, 0.69, 0.23, 0.83, h + 9, 9, miedz);
      s += blok(0.78, 0.7, 0.9, 0.82, 0, h + 9, jasn(mur, 0.08)) + dachNamiot(0.77, 0.69, 0.91, 0.83, h + 9, 9, miedz);
    }
    if (L >= 5) for (i = 0; i < 2; i++) s += kolo(P(0.5, 0.5, w1 + 15), 2, C('#f2b705'));
    return s;
  };

  RYS.biblioteka = function (L) {
    var h = 24 + 4 * L, mur = '#7fb49c', s = plyta(), i;
    s += blok(0.12, 0.16, 0.88, 0.8, 0, h, mur);
    s += oknaL(0.12, 0.88, 0.8, 5, h - 3, 9, 1, { iu: 0.3, ib: 0, it: 0, pomin: function (c) { return c >= 3 && c <= 5; } });
    s += oknaP(0.16, 0.8, 0.88, 5, h - 3, 6, 1, { iu: 0.3, ib: 0, it: 0 });
    s += blok(0.3, 0.8, 0.7, 0.92, 0, 3, '#d9d3c5');
    s += scL(0.45, 0.55, 0.8, 3, 14, NOC ? SWIATLO : '#4b3a2a');
    for (i = 0; i < 4; i++) s += slup(0.345 + i * 0.103, 0.9, 3, h - 7, 3.4, '#f6f2e8');
    s += blok(0.3, 0.8, 0.7, 0.92, h - 7, h - 3, '#ece6d8');
    s += wiel([P(0.3, 0.92, h - 3), P(0.7, 0.92, h - 3), P(0.5, 0.92, h + 6)], C('#f1ecdf'));
    if (L >= 2) s += blok(0.3, 0.26, 0.7, 0.6, h, h + 5, '#a8d3ea', { l: szklo(true), p: szklo(false), g: NOC ? '#ffe9a8' : '#d6eefa' });
    if (L >= 3) {
      s += kolo(P(0.2, 0.24, h + 3), 4.2, C('#4c9f57')) + kolo(P(0.8, 0.3, h + 3), 4.2, C('#4c9f57')) + kolo(P(0.2, 0.68, h + 3), 4.2, C('#6dbb6b'));
    }
    if (L >= 4) s += kolo(P(0.82, 0.7, h + 3), 4.2, C('#6dbb6b'));
    if (L >= 5) s += elipsa(P(0.5, 0.43, h + 9), 15, 11, NOC ? '#ffe9a8' : '#bfe3f5', ' stroke="' + C('#8fb9cf') + '" stroke-width="1"');
    return s;
  };

  RYS.silownia = function (L) {
    var h = 22 + 3 * L, mur = '#3d6db3', pas = '#f28c28', s = plyta();
    s += blok(0.12, 0.2, 0.88, 0.8, 0, h, mur);
    s += oknaL(0.12, 0.88, 0.8, 2, h - 9, 5, 1, { iu: 0.07, ib: 0, it: 0, jasne: true });
    s += scL(0.12, 0.88, 0.8, h - 7.5, h - 3.5, C(pas)) + scP(0.2, 0.8, 0.88, h - 7.5, h - 3.5, C(ciemn(pas, 0.18)));
    var a = P(0.88, 0.36, h * 0.4), b = P(0.88, 0.64, h * 0.4);
    s += linia([a, b], '#ffffff', 2.2) + kolo(a, 3.6, '#ffffff') + kolo(b, 3.6, '#ffffff') + kolo(a, 1.6, C(mur)) + kolo(b, 1.6, C(mur));
    s += dachDwuspad(0.1, 0.18, 0.9, 0.82, h, 7, '#dfe6ee', 'u', mur);
    if (L >= 3) s += blok(0.3, 0.34, 0.7, 0.66, h + 3, h + 12, '#31598f') + oknaL(0.3, 0.7, 0.66, h + 4, h + 11, 3, 1, { iu: 0.1, ib: 0, it: 0, jasne: true });
    if (L >= 5) s += flaga(0.5, 0.5, h + 12, 12);
    return s;
  };

  RYS.kamienica = function (L) {
    var pietra = 2 + (L >= 2 ? 1 : 0) + (L >= 4 ? 1 : 0), h = pietra * 14 + 6, mur = '#8fb3cf', s = plyta();
    s += blok(0.16, 0.16, 0.84, 0.84, 0, h, mur);
    s += oknaL(0.16, 0.84, 0.84, 15, h - 1, 4, pietra - 1, { pomin: function (c) { return c === 1 || c === 2; } });
    s += scL(0.2, 0.36, 0.84, 3, 11, szyba(false)) + scL(0.64, 0.8, 0.84, 3, 11, szyba(false));
    s += scL(0.43, 0.57, 0.84, 0, 12, C('#6d3b2a'));
    s += oknaP(0.16, 0.84, 0.84, 3, h - 1, 3, pietra);
    s += blok(0.38, 0.84, 0.62, 0.91, 14, h - 2, jasn(mur, 0.3));
    s += oknaL(0.38, 0.62, 0.91, 15, h - 3, 2, pietra - 1, { iu: 0.16 });
    var sc = P(0.5, 0.91, 10.5);
    s += kolo([sc[0] - 2, sc[1] - 1.4], 2.4, C('#d6262e')) + kolo([sc[0] + 2, sc[1] - 1.4], 2.4, C('#d6262e')) +
      wiel([[sc[0] - 4.2, sc[1] - 0.4], [sc[0] + 4.2, sc[1] - 0.4], [sc[0], sc[1] + 4.6]], C('#d6262e'));
    s += blok(0.13, 0.13, 0.87, 0.87, h, h + 2.5, '#f3efe6');
    s += dachSciety(0.13, 0.13, 0.87, 0.87, h + 2.5, 11, 0.16, '#b4483a');
    s += blok(0.26, 0.3, 0.34, 0.38, h + 8, h + 20, '#8a4a3a');
    if (L >= 3) s += blok(0.6, 0.72, 0.72, 0.8, h + 4, h + 11, jasn(mur, 0.3)) + scL(0.62, 0.7, 0.8, h + 5.5, h + 10, szyba(false));
    if (L >= 5) s += flaga(0.5, 0.5, h + 13, 12);
    return s;
  };

  RYS.warsztat = function (L) {
    var h = 22 + 2 * L, mur = '#8e9aa8', s = plyta(), i;
    s += blok(0.14, 0.22, 0.86, 0.8, 0, h, mur);
    s += scL(0.2, 0.56, 0.8, 0, 15, NOC ? '#57503a' : C('#4b525d'));
    for (i = 1; i < 4; i++) s += linia([P(0.2, 0.8, i * 3.75), P(0.56, 0.8, i * 3.75)], C('#6a727e'), 0.8);
    s += scL(0.64, 0.76, 0.8, 0, 12, C('#5a4634'));
    s += oknaP(0.3, 0.72, 0.86, 7, h - 6, 2, 1);
    for (i = 0; i < 9; i++) s += scL(0.14 + i * 0.08, 0.14 + (i + 1) * 0.08, 0.8, h - 4.5, h, C(i % 2 ? '#2b2f36' : '#f9c21a'));
    for (i = 0; i < 7; i++) s += scP(0.22 + i * 0.0829, 0.22 + (i + 1) * 0.0829, 0.86, h - 4.5, h, C(i % 2 ? '#22262c' : '#d9a514'));
    s += blok(0.24, 0.3, 0.36, 0.42, h, h + 5, '#6f7985');
    if (L >= 2) s += blok(0.62, 0.84, 0.84, 0.93, 0, 4, '#c79a5b') + blok(0.66, 0.85, 0.8, 0.92, 4, 7, '#b8884a');
    if (L >= 3) s += zuraw(0.72, 0.34, h, h + 30 + 5 * L);
    if (L >= 5) s += blok(0.42, 0.5, 0.56, 0.64, h, h + 8, '#f9c21a');
    return s;
  };

  RYS.szkola = function (L) {
    var pietra = L >= 4 ? 3 : 2, h = pietra * 13 + 3 + L, mur = '#f0cf6a', dach = '#a84c3c', s = plyta();
    if (L >= 3) s += blok(0.12, 0.08, 0.46, 0.28, 0, 17, jasn(mur, 0.2)) + dachDwuspad(0.1, 0.06, 0.48, 0.3, 17, 6, dach, 'u', mur);
    s += blok(0.1, 0.28, 0.9, 0.78, 0, h, mur);
    s += oknaL(0.1, 0.9, 0.78, 3, h - 1, 7, pietra, { pomin: function (c, r) { return r === 0 && c === 3; } });
    s += scL(0.44, 0.56, 0.78, 0, 11, C('#8a4b2d'));
    s += blok(0.42, 0.78, 0.58, 0.85, 11, 13, '#c9753d');
    s += oknaP(0.28, 0.78, 0.9, 3, h - 1, 3, pietra);
    s += dachSciety(0.08, 0.26, 0.92, 0.8, h, 7, 0.1, dach);
    s += flaga(0.5, 0.8, h + 1, 14);
    if (L >= 5) { var zc = P(0.5, 0.78, h - 5); s += kolo(zc, 4, C('#fdfaf0'), ' stroke="' + C('#5b4630') + '" stroke-width=".8"'); }
    return s;
  };

  RYS.szkola_jezykowa = function (L) {
    var pietra = 2 + (L >= 2 ? 1 : 0) + (L >= 4 ? 1 : 0), h = pietra * 14 + 4, mur = '#f4efe3', s = plyta();
    s += blok(0.24, 0.2, 0.76, 0.8, 0, h, mur);
    s += oknaL(0.24, 0.6, 0.8, 13, h - 1, 2, pietra - 1);
    s += scL(0.3, 0.42, 0.8, 0, 11, C('#27406b')) + scL(0.46, 0.58, 0.8, 3, 11, szyba(false));
    var z1 = h - 3, z0 = Math.max(13, h - 30), t = (z1 - z0) / 4;
    s += scL(0.635, 0.725, 0.8, z1 - t, z1, C('#c8102e')) + scL(0.635, 0.725, 0.8, z0 + t, z1 - t, C('#ffc400')) + scL(0.635, 0.725, 0.8, z0, z0 + t, C('#c8102e'));
    s += oknaP(0.2, 0.8, 0.76, 3, h - 1, 3, pietra);
    s += dachSciety(0.21, 0.17, 0.79, 0.83, h, 10, 0.14, '#39466f');
    if (L >= 3) { var c = P(0.5, 0.5, h + 15); s += linia([P(0.5, 0.5, h + 10), c], C('#5b606b'), 1) + kolo(c, 4.6, C('#3d8fd1')) + linia([[c[0] - 4.6, c[1]], [c[0] + 4.6, c[1]]], C('#bfe3f5'), 0.8); }
    if (L >= 5) s += flaga(0.3, 0.3, h + 8, 12);
    return s;
  };

  RYS.drukarnia = function (L) {
    var h = 20 + 3 * L, mur = '#b5553f', s = plyta(), n = 3, du = (0.88 - 0.12) / n, i;
    s += blok(0.12, 0.2, 0.88, 0.8, 0, h, mur);
    s += oknaL(0.12, 0.88, 0.8, 5, h - 3, 5, 1, { iu: 0.14, ib: 0, it: 0, jasne: true, pomin: function (c) { return c === 2; } });
    s += scL(0.43, 0.57, 0.8, 0, 12, C('#3f3a36'));
    s += oknaP(0.2, 0.8, 0.88, 5, h - 3, 3, 1, { iu: 0.14, ib: 0, it: 0, jasne: true });
    for (i = 0; i < n; i++) {
      var a = 0.12 + i * du, b = a + du;
      s += wiel([P(a, 0.2, h), P(b, 0.2, h + 9), P(b, 0.8, h + 9), P(a, 0.8, h)], C('#8f979f'));
      s += wiel([P(a, 0.8, h), P(b, 0.8, h), P(b, 0.8, h + 9)], C(jasn(mur, 0.1)));
      s += wiel([P(b, 0.8, h), P(b, 0.2, h), P(b, 0.2, h + 9), P(b, 0.8, h + 9)], NOC ? SWIATLO : '#bfe0ee');
    }
    var k1 = h + 28 + 2 * L;
    s += blok(0.17, 0.24, 0.27, 0.34, h, k1, '#9a4a38') + blok(0.16, 0.23, 0.28, 0.35, k1, k1 + 2.5, '#7c3a2c');
    var d = P(0.22, 0.29, k1 + 8);
    s += kolo(d, 4, 'rgba(236,238,242,.85)') + kolo([d[0] + 5, d[1] - 7], 5.5, 'rgba(236,238,242,.7)') + kolo([d[0] + 12, d[1] - 16], 7, 'rgba(236,238,242,.5)');
    P(0.22, 0.29, k1 + 34);
    if (L >= 4) s += blok(0.6, 0.84, 0.82, 0.93, 0, 6, '#f3efe6') + blok(0.62, 0.85, 0.8, 0.92, 6, 9, '#e3ddd0');
    return s;
  };

  RYS.szpital = function (L) {
    var h = 26 + 7 * L, mur = '#f3f5f7', s = plyta(), rz = Math.max(2, Math.round((h - 10) / 11));
    s += blok(0.12, 0.18, 0.88, 0.82, 0, h, mur);
    s += oknaL(0.14, 0.86, 0.82, 10, h - 2, 7, rz, { iu: 0.09, ib: 0.2, it: 0.3 });
    s += scL(0.42, 0.58, 0.82, 0, 9, NOC ? SWIATLO2 : '#9fd0ea');
    s += blok(0.38, 0.82, 0.62, 0.93, 9, 11, '#d84a4a');
    s += oknaP(0.2, 0.8, 0.88, 10, h - 2, 5, rz, { iu: 0.09, ib: 0.2, it: 0.3 });
    s += scL(0.16, 0.3, 0.82, h - 15, h - 3, '#1f5fbf');
    s += napis(P(0.23, 0.82, h - 9), 'H', 10, '#ffffff');
    if (L >= 3) {
      var c = P(0.5, 0.5, h);
      s += elipsa(c, 19, 9.5, C('#f2c21a')) + elipsa(c, 15.5, 7.7, C('#e4e8ec')) + napis(c, 'H', 8.5, C('#c0392b'));
    } else {
      s += blok(0.42, 0.4, 0.58, 0.56, h, h + 5, '#c9d0d8');
    }
    if (L >= 5) s += slup(0.2, 0.26, h, h + 16, 1.2, '#8892a0') + kolo(P(0.2, 0.26, h + 16), 1.8, '#ff5a4f');
    return s;
  };

  RYS.bank = function (L) {
    var h = 26 + 4 * L, mur = '#e3dccb', s = plyta(), i;
    s += blok(0.1, 0.14, 0.9, 0.92, 0, 4, '#cfc8b8');
    s += blok(0.16, 0.18, 0.84, 0.8, 4, h, mur);
    s += oknaP(0.24, 0.76, 0.84, 8, h - 6, 3, 1, { iu: 0.3, ib: 0, it: 0 });
    s += scL(0.45, 0.55, 0.8, 4, 16, NOC ? SWIATLO : '#5b4630');
    for (i = 0; i < 6; i++) s += slup(0.2 + i * 0.12, 0.87, 4, h - 5, 3.2, '#f7f3ea');
    s += blok(0.14, 0.16, 0.86, 0.89, h - 5, h, '#d8d0bd');
    s += dachDwuspad(0.14, 0.16, 0.86, 0.89, h, 11, '#9aa3ad', 'v', jasn(mur, 0.15));
    var cc = P(0.5, 0.89, h + 4.2);
    s += kolo(cc, 3.8, C('#f2b705')) + kolo(cc, 2.2, C('#ffd95a'));
    if (L >= 3) s += flaga(0.5, 0.5, h + 11, 12);
    if (L >= 4) { var k = P(0.5, 0.42, h + 13); s += elipsa(k, 12, 9, C('#e0b53a')) + elipsa([k[0] - 3, k[1] - 2.5], 5, 3.5, C('#f0cf6a')); }
    return s;
  };

  RYS.kamienica_m = function (L) {
    var fasady = ['#e8c98a', '#e3a78c', '#cdd9b2', '#ead9bd', '#c9bbd9', '#f0d3a2', '#b9d4d6'], dachy = ['#b4483a', '#8f4a3a', '#73777f'];
    var mur = fasady[Math.floor(los(1) * fasady.length)], dach = dachy[Math.floor(los(2) * dachy.length)];
    var pietra = L + 1, h = pietra * 14 + 4, s = plyta();
    s += blok(0.16, 0.16, 0.84, 0.84, 0, h, mur);
    s += oknaL(0.16, 0.84, 0.84, 15, h - 1, 3, pietra - 1);
    s += scL(0.2, 0.4, 0.84, 3, 11, szyba(false)) + scL(0.44, 0.56, 0.84, 0, 11, C('#6d3b2a')) + scL(0.6, 0.8, 0.84, 3, 11, szyba(false));
    if (los(3) < 0.5) s += scL(0.18, 0.42, 0.84, 11, 13.5, C(los(4) < 0.5 ? '#d6262e' : '#2f8a57'));
    s += oknaP(0.16, 0.84, 0.84, 3, h - 1, 3, pietra);
    s += blok(0.13, 0.13, 0.87, 0.87, h, h + 2, jasn(mur, 0.4));
    s += dachSciety(0.13, 0.13, 0.87, 0.87, h + 2, 10, 0.16, dach);
    s += blok(0.3, 0.3, 0.37, 0.37, h + 7, h + 17, '#8a4a3a');
    return s;
  };

  RYS.blok = function (L) {
    var pietra = [5, 8, 11][L - 1] || 11, h = pietra * 9 + 4, mur = '#e7e3d9', s = plyta();
    var akcent = ['#e9a23b', '#6fa8dc', '#8bc48a', '#d98a8a'][Math.floor(los(1) * 4)];
    s += blok(0.16, 0.22, 0.84, 0.78, 0, h, mur);
    s += scL(0.46, 0.54, 0.78, 0, h, C(akcent));
    s += oknaL(0.16, 0.46, 0.78, 3, h - 1, 2, pietra) + oknaL(0.54, 0.84, 0.78, 3, h - 1, 2, pietra);
    s += scL(0.47, 0.53, 0.78, 0, 8, C('#4b525d'));
    s += scP(0.22, 0.3, 0.84, 0, h, C(ciemn(akcent, 0.2)));
    s += oknaP(0.32, 0.78, 0.84, 3, h - 1, 2, pietra);
    s += blok(0.4, 0.4, 0.6, 0.6, h, h + 5, '#b9bec6');
    return s;
  };

  RYS.apartamentowiec = function (L) {
    var h = [92, 128, 166][L - 1] || 166, mur = '#eef2f6', s = plyta(), rz = Math.round(h / 9);
    var akcent = los(1) < 0.5 ? '#f28c28' : '#0f9d94';
    s += blok(0.2, 0.2, 0.8, 0.8, 0, h, mur);
    s += oknaL(0.2, 0.74, 0.8, 7, h - 2, 4, rz - 1, { iu: 0.1, ib: 0.2, it: 0.22 });
    s += scL(0.75, 0.8, 0.8, 7, h, C(akcent));
    s += oknaP(0.2, 0.8, 0.8, 7, h - 2, 4, rz - 1, { iu: 0.1, ib: 0.2, it: 0.22 });
    s += scL(0.2, 0.8, 0.8, 0, 6.5, NOC ? SWIATLO2 : '#39424f') + scP(0.2, 0.8, 0.8, 0, 6.5, NOC ? SWIATLO : '#2f3742');
    s += blok(0.27, 0.27, 0.73, 0.73, h, h + 7, '#cfd8e1');
    s += blok(0.4, 0.4, 0.6, 0.6, h + 7, h + 12, '#b9c3ce');
    s += linia([P(0.5, 0.5, h + 12), P(0.5, 0.5, h + 28)], C('#8892a0'), 1.2);
    return s;
  };

  RYS.ulica = function (L, o) {
    var s = romb('#636975'), c = P(0.5, 0.5), k = ' stroke-dasharray="5 4"', n = o.sasiedzi || {}, jest = false, kreska = NOC ? '#8f8a70' : '#f3ebc8';
    if (n.px) { s += linia([c, P(1, 0.5)], kreska, 1.6, k); jest = true; }
    if (n.nx) { s += linia([c, P(0, 0.5)], kreska, 1.6, k); jest = true; }
    if (n.py) { s += linia([c, P(0.5, 1)], kreska, 1.6, k); jest = true; }
    if (n.ny) { s += linia([c, P(0.5, 0)], kreska, 1.6, k); jest = true; }
    if (!jest) s += linia([P(0, 0.5), P(1, 0.5)], kreska, 1.6, k);
    var prosta = (!n.py && !n.ny);
    if (prosta && los(5) < 0.34) {
      var kol = ['#d6262e', '#f3f5f7', '#2f5fd0', '#f9c21a'][Math.floor(los(6) * 4)];
      s += blok(0.3, 0.6, 0.56, 0.74, 1.5, 6, kol) + blok(0.36, 0.61, 0.5, 0.73, 6, 9.5, NOC ? '#ffe9a8' : '#33475f');
    }
    return s;
  };

  RYS.skwer = function () {
    var s = romb('#8fca7a');
    s += wiel([P(0.43, 0), P(0.57, 0), P(0.57, 1), P(0.43, 1)], C('#e3d9bf'));
    s += drzewo(0.22, 0.3, 1) + lawka(0.62, 0.34) + latarnia(0.36, 0.72) + drzewo(0.8, 0.7, 1.1, los(1) < 0.4 ? 'jesien' : '');
    return s;
  };

  RYS.park = function () {
    var s = romb('#7fc06d');
    s += linia([P(0, 0.72), P(0.36, 0.64), P(0.62, 0.84), P(1, 0.76)], C('#e3d9bf'), 4.5, ' stroke-linecap="round" stroke-linejoin="round"');
    var st = P(0.62, 0.42);
    s += elipsa(st, 16, 8, C('#5aa9d6')) + elipsa([st[0] - 3, st[1] - 1.5], 8, 3.4, C('#8cc8e8'));
    s += drzewo(0.2, 0.2, 1.15) + drzewo(0.84, 0.18, 1, 'iglak') + drzewo(0.36, 0.42, 0.9, 'iglak') + drzewo(0.2, 0.9, 1) + drzewo(0.88, 0.92, 1.1, 'jesien');
    return s;
  };

  RYS.przystanek_bus = function () {
    var s = plyta('#d5d1c8', 0);
    s += scL(0.2, 0.62, 0.28, 0, 13, NOC ? 'rgba(255,223,138,.6)' : 'rgba(191,227,245,.8)');
    s += lawka(0.3, 0.3);
    s += slup(0.2, 0.4, 0, 13, 1.2, '#4b525d') + slup(0.64, 0.4, 0, 13, 1.2, '#4b525d');
    s += blok(0.18, 0.24, 0.66, 0.42, 13, 15, '#4b525d');
    var zn = P(0.78, 0.36, 21);
    s += slup(0.78, 0.36, 0, 21, 1.4, '#5b606b') + prost(zn[0] - 5, zn[1] - 4, 10, 8, '#f9c21a') + prost(zn[0] - 3, zn[1] - 1.5, 6, 3.2, '#22262c');
    s += pojazd(0.16, 0.58, 0.84, 0.82, '#d6262e', '#f9c21a', 2);
    return s;
  };

  RYS.przystanek_tram = function () {
    var s = plyta('#d5d1c8', 0);
    s += blok(0.1, 0.18, 0.9, 0.4, 0, 2.5, '#c2beb4');
    s += scL(0.3, 0.7, 0.22, 2.5, 14, NOC ? 'rgba(255,223,138,.6)' : 'rgba(191,227,245,.8)');
    s += blok(0.28, 0.18, 0.72, 0.36, 14, 16, '#4b525d');
    s += linia([P(0, 0.6), P(1, 0.6)], C('#565b66'), 1.3) + linia([P(0, 0.8), P(1, 0.8)], C('#565b66'), 1.3);
    s += slup(0.5, 0.46, 2.5, 31, 1.6, '#5b606b') + linia([P(0.5, 0.46, 30), P(0.5, 0.7, 30)], C('#5b606b'), 1.2);
    s += pojazd(0.07, 0.59, 0.48, 0.81, '#d6262e', '#f9c21a', 2);
    s += blok(0.48, 0.61, 0.52, 0.79, 3, 16, '#3a3f48');
    s += pojazd(0.52, 0.59, 0.93, 0.81, '#d6262e', '#f9c21a', 2);
    s += linia([P(0.24, 0.7, 17), P(0.3, 0.7, 27), P(0.36, 0.7, 17)], C('#2b2f36'), 0.9);
    s += linia([P(0, 0.7, 27.5), P(1, 0.7, 27.5)], C('#444b57'), 0.7);
    return s;
  };

  function metro(kolor) {
    var s = plyta('#d9d5cc', 0);
    s += wiel([P(0.3, 0.32), P(0.64, 0.32), P(0.64, 0.64), P(0.3, 0.64)], C('#3a3f48'));
    s += blok(0.3, 0.3, 0.66, 0.64, 0, 12, '#a8d3ea', { l: szklo(true), p: szklo(false), g: '#d6eefa' });
    s += scL(0.36, 0.6, 0.64, 0, 10, NOC ? '#57503a' : C('#2b3038'));
    s += blok(0.26, 0.26, 0.7, 0.68, 12, 14.5, '#eef2f6');
    s += slup(0.82, 0.8, 0, 34, 2.4, '#6b7480');
    var c = P(0.82, 0.8, 41);
    s += kolo(c, 10, '#ffffff') + kolo(c, 8.6, kolor) + napis([c[0], c[1] + 0.5], 'M', 13, '#ffffff');
    P(0.82, 0.8, 52);
    return s;
  }
  RYS.metro_m1 = function () { return metro('#1f5fbf'); };
  RYS.metro_m2 = function () { return metro('#d21f2b'); };

  RYS.bulwar = function (L, o) {
    var s = romb('#e6dfd0'), w = o.woda || 'px', pas;
    if (w === 'px') pas = [P(0.72, 0), P(1, 0), P(1, 1), P(0.72, 1)];
    else if (w === 'nx') pas = [P(0, 0), P(0.28, 0), P(0.28, 1), P(0, 1)];
    else if (w === 'py') pas = [P(0, 0.72), P(1, 0.72), P(1, 1), P(0, 1)];
    else pas = [P(0, 0), P(1, 0), P(1, 0.28), P(0, 0.28)];
    s += wiel(pas, C('#c9a26b'));
    var lad = (w === 'px' || w === 'py');
    s += drzewo(lad ? 0.2 : 0.8, lad ? 0.22 : 0.3, 1);
    s += latarnia(0.5, 0.1) + lawka(0.3, 0.52);
    var pp = P(0.52, 0.56, 14);
    s += slup(0.52, 0.56, 0, 14, 1, '#6b7480') + elipsa(pp, 12, 6, C('#f9c21a')) + elipsa(pp, 6, 3, C('#d6262e'));
    s += blok(0.62, 0.62, 0.7, 0.7, 0, 3, '#3d6db3') + blok(0.4, 0.74, 0.48, 0.82, 0, 3, '#f3f5f7');
    s += latarnia(0.5, 0.92);
    return s;
  };

  RYS.kolumna = function () {
    var s = plyta('#d9d5cc', 0);
    s += elipsa(P(0.5, 0.5), 36, 18, C('#c6c0b2'));
    s += blok(0.38, 0.38, 0.62, 0.62, 0, 7, '#cfc8b8') + blok(0.43, 0.43, 0.57, 0.57, 7, 12, '#dcd5c6');
    var a = P(0.5, 0.5, 12), b = P(0.5, 0.5, 60);
    s += prost(a[0] - 3, b[1], 6, a[1] - b[1], C('#e6dfcf')) + prost(a[0] + 0.6, b[1], 2.4, a[1] - b[1], C('#cbc3b1'));
    s += blok(0.44, 0.44, 0.56, 0.56, 60, 63, '#d2cab8');
    var f = P(0.5, 0.5, 63);
    s += prost(f[0] - 2, f[1] - 10, 4, 10, C('#4d5a52')) + kolo([f[0], f[1] - 12], 2.3, C('#4d5a52'));
    s += linia([[f[0] + 3.4, f[1] - 2], [f[0] + 3.4, f[1] - 19]], C('#4d5a52'), 1) + linia([[f[0] + 1.6, f[1] - 15], [f[0] + 5.2, f[1] - 15]], C('#4d5a52'), 1);
    P(0.5, 0.5, 84);
    return s;
  };

  RYS.palac = function () {
    var k = '#d9c9a5', s = plyta('#d9d5cc', 0);
    function wiezyczka(u, v) { return blok(u, v, u + 0.14, v + 0.14, 26, 40, jasn(k, 0.1)) + dachNamiot(u - 0.01, v - 0.01, u + 0.15, v + 0.15, 40, 11, '#b3a27c'); }
    s += blok(0.1, 0.1, 0.9, 0.9, 0, 26, k);
    s += oknaL(0.1, 0.9, 0.9, 4, 24, 10, 2, { iu: 0.3 }) + oknaP(0.1, 0.9, 0.9, 4, 24, 10, 2, { iu: 0.3 });
    s += scL(0.44, 0.56, 0.9, 0, 12, NOC ? SWIATLO : '#5b4630');
    s += wiezyczka(0.1, 0.1) + wiezyczka(0.76, 0.1) + wiezyczka(0.1, 0.76);
    s += blok(0.24, 0.24, 0.76, 0.76, 26, 72, k);
    s += oknaL(0.24, 0.76, 0.76, 30, 70, 7, 3, { iu: 0.32, ib: 0.12, it: 0.12 }) + oknaP(0.24, 0.76, 0.76, 30, 70, 7, 3, { iu: 0.32, ib: 0.12, it: 0.12 });
    s += blok(0.22, 0.22, 0.78, 0.78, 72, 75, jasn(k, 0.2));
    s += blok(0.33, 0.33, 0.67, 0.67, 75, 116, jasn(k, 0.05));
    s += oknaL(0.33, 0.67, 0.67, 78, 114, 5, 3, { iu: 0.32, ib: 0.12, it: 0.12 }) + oknaP(0.33, 0.67, 0.67, 78, 114, 5, 3, { iu: 0.32, ib: 0.12, it: 0.12 });
    s += blok(0.31, 0.31, 0.69, 0.69, 116, 119, jasn(k, 0.2));
    s += blok(0.4, 0.4, 0.6, 0.6, 119, 140, k);
    var zc = P(0.5, 0.6, 130);
    s += kolo(zc, 4.4, NOC ? SWIATLO2 : '#fdfaf0', ' stroke="' + C('#5b4630') + '" stroke-width=".8"') + linia([zc, [zc[0], zc[1] - 3]], '#3b2f22', 0.8) + linia([zc, [zc[0] + 2.2, zc[1] + 0.8]], '#3b2f22', 0.8);
    s += dachNamiot(0.4, 0.4, 0.6, 0.6, 140, 24, '#bfae87');
    s += linia([P(0.5, 0.5, 164), P(0.5, 0.5, 196)], C('#8d7f5f'), 1.8) + kolo(P(0.5, 0.5, 196), 2, NOC ? '#ff5a4f' : '#f2b705');
    s += wiezyczka(0.76, 0.76);
    return s;
  };

  RYS.wieza = function (L) {
    var et = Math.max(1, L), hh = 24 + et * 24, s = plyta('#d9d5cc', 0), z, i;
    var kol = { l: '#78b3da', p: '#4f88b5', g: '#b3d8ef' };
    s += blok(0.22, 0.22, 0.78, 0.78, 0, hh, '#6fa9d0', kol);
    if (NOC) {
      s += oknaL(0.22, 0.78, 0.78, 1, hh - 1, 4, Math.round(hh / 8), { iu: 0.08, ib: 0.15, it: 0.15 });
      s += oknaP(0.22, 0.78, 0.78, 1, hh - 1, 4, Math.round(hh / 8), { iu: 0.08, ib: 0.15, it: 0.15 });
    } else {
      for (z = 8; z < hh; z += 8) s += linia([P(0.22, 0.78, z), P(0.78, 0.78, z), P(0.78, 0.22, z)], '#b9dcf1', 0.7, ' opacity=".75"');
      for (i = 1; i < 4; i++) {
        s += linia([P(0.22 + i * 0.14, 0.78, 0), P(0.22 + i * 0.14, 0.78, hh)], '#5c96c1', 0.7);
        s += linia([P(0.78, 0.78 - i * 0.14, 0), P(0.78, 0.78 - i * 0.14, hh)], '#3f77a3', 0.7);
      }
    }
    s += scL(0.22, 0.78, 0.78, 0, 7, NOC ? SWIATLO2 : '#2f4a66') + scP(0.22, 0.78, 0.78, 0, 7, NOC ? SWIATLO : '#263c54');
    if (et < 10) {
      s += blok(0.34, 0.34, 0.66, 0.66, hh, hh + 10, '#b9bec6');
      s += zuraw(0.72, 0.3, hh, hh + 36);
    } else {
      s += blok(0.28, 0.28, 0.72, 0.72, hh, hh + 12, '#6fa9d0', kol);
      s += blok(0.36, 0.36, 0.64, 0.64, hh + 12, hh + 22, '#dfe8ef');
      s += linia([P(0.5, 0.5, hh + 22), P(0.5, 0.5, hh + 80)], C('#c9d3dd'), 2.4) + kolo(P(0.5, 0.5, hh + 80), 2, '#ff5a4f');
    }
    return s;
  };

  function plac() {
    var s = romb('#cdb083'), z, k = '#e08a1e';
    s += blok(0.24, 0.24, 0.76, 0.76, 0, 5, '#b9bec6');
    for (z = 12; z <= 32; z += 10) s += linia([P(0.24, 0.76, z), P(0.76, 0.76, z), P(0.76, 0.24, z)], k, 1.1);
    s += linia([P(0.24, 0.76, 5), P(0.24, 0.76, 32)], k, 1.1) + linia([P(0.76, 0.76, 5), P(0.76, 0.76, 32)], k, 1.1) + linia([P(0.76, 0.24, 5), P(0.76, 0.24, 32)], k, 1.1);
    s += linia([P(0.5, 0.76, 5), P(0.5, 0.76, 32)], k, 0.8) + linia([P(0.76, 0.5, 5), P(0.76, 0.5, 32)], k, 0.8);
    s += zuraw(0.34, 0.3, 5, 50);
    s += blok(0.08, 0.8, 0.26, 0.9, 0, 4, '#c79a5b');
    return s;
  }
  function rusztowanie(h) {
    var s = '', z, k = '#e08a1e';
    h = Math.max(20, h);
    for (z = 10; z < h; z += 11) s += linia([P(0.1, 0.9, z), P(0.9, 0.9, z), P(0.9, 0.1, z)], k, 1, ' opacity=".9"');
    s += linia([P(0.1, 0.9, 0), P(0.1, 0.9, h)], k, 1.1) + linia([P(0.9, 0.9, 0), P(0.9, 0.9, h)], k, 1.1) + linia([P(0.9, 0.1, 0), P(0.9, 0.1, h)], k, 1.1);
    s += linia([P(0.5, 0.9, 0), P(0.5, 0.9, h)], k, 0.8) + linia([P(0.9, 0.5, 0), P(0.9, 0.5, h)], k, 0.8);
    return s;
  }

  /* =====================================================================
     API
     ===================================================================== */
  // Rysunek obiektu. Zwraca { svg, gora } (gora = najwyższy punkt, liczba ujemna)
  G.rysuj = function (typ, poz, o) {
    o = o || {};
    NOC = !!o.noc;
    SEED = o.seed || 1;
    nrOkna = 0;
    minY = 0;
    var svg;
    if (poz < 1) svg = plac();
    else {
      var f = RYS[typ] || RYS.kamienica_m;
      svg = f(poz, o);
      if (o.budowa) svg += rusztowanie(-minY - 20);
    }
    return { svg: svg, gora: minY };
  };

  // Grunt pod działką: '.' trawa, 'w' rzeka, 'd' las
  G.grunt = function (teren, o) {
    o = o || {};
    NOC = !!o.noc;
    SEED = o.seed || 1;
    minY = 0;
    var s;
    if (teren === 'w') {
      s = romb('#4f9fd0');
      var k = NOC ? '#5f86b8' : '#a9d8f2';
      s += linia([P(0.2, 0.4), P(0.34, 0.36), P(0.46, 0.42)], k, 1.1, ' stroke-linecap="round"');
      s += linia([P(0.55, 0.7), P(0.68, 0.66), P(0.8, 0.72)], k, 1.1, ' stroke-linecap="round"');
    } else if (teren === 'd') {
      s = romb('#79b866');
      s += drzewo(0.3, 0.26, 1.1, 'iglak') + drzewo(0.72, 0.3, 1, '') + drzewo(0.24, 0.72, 0.95, '') + drzewo(0.7, 0.76, 1.15, 'iglak');
    } else {
      var baza = o.kolor || '#a8d28a';
      s = romb(o.parzyste ? baza : jasn(baza, 0.1));
    }
    return { svg: s, gora: minY };
  };

  G.romb = function () { return pts([[0, -HH], [HW, 0], [0, HH], [-HW, 0]]); };

  // Miniatura do sklepu i arkuszy
  G.miniatura = function (typ, poz, o) {
    o = o || {};
    var tlo = (typ === 'ulica' || typ === 'skwer' || typ === 'park' || typ === 'bulwar') ? '' : G.grunt('.', { parzyste: true, noc: o.noc }).svg;
    var r = G.rysuj(typ, poz, { noc: o.noc, seed: o.seed || 3, sasiedzi: { px: 1, nx: 1 } });
    var gora = Math.min(r.gora, -34) - 4;
    return '<svg class="mini" viewBox="-64 ' + r1(gora) + ' 128 ' + r1(36 - gora) + '" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + tlo + r.svg + '</svg>';
  };

  // Pora dnia w mieście (przybliżony wschód i zachód słońca dla Warszawy)
  G.faza = function (ts) {
    var d = new Date(ts), rok = d.getFullYear();
    var doy = Math.floor((d - new Date(rok, 0, 0)) / 86400000);
    var dlugosc = 12.2 + 4.6 * Math.cos(2 * Math.PI * (doy - 172) / 365);
    var letni = d.getTimezoneOffset() < new Date(rok, 0, 1).getTimezoneOffset();
    var poludnie = 11.6 + (letni ? 1 : 0);
    var t = d.getHours() + d.getMinutes() / 60;
    var wschod = poludnie - dlugosc / 2, zachod = poludnie + dlugosc / 2;
    if (t < wschod - 0.5 || t > zachod + 0.6) return 'noc';
    if (t < wschod + 0.5 || t > zachod - 0.6) return 'zmierzch';
    return 'dzien';
  };

  /* Mapa dzielnicy.
     dane: { n, noc, kolor, pola: [{x, y, teren, ob: {typ, poz, budowa, seed, sasiedzi, woda, plakietka}, klasy}] }
     Zwraca kompletny znacznik <svg>. */
  G.mapa = function (dane) {
    var n = dane.n, noc = !!dane.noc, s = '', gora = -120, x, y, sum, pole, ob, r, cx, cy, idx = {};
    for (var i = 0; i < dane.pola.length; i++) idx[dane.pola[i].x + ',' + dane.pola[i].y] = dane.pola[i];
    for (sum = 0; sum <= 2 * (n - 1); sum++) {
      for (x = Math.max(0, sum - n + 1); x <= Math.min(n - 1, sum); x++) {
        y = sum - x;
        pole = idx[x + ',' + y];
        if (!pole) continue;
        cx = (x - y) * HW;
        cy = (x + y) * HH;
        ob = pole.ob;
        var g1 = G.grunt(pole.teren, { noc: noc, parzyste: (x + y) % 2 === 0, kolor: dane.kolor, seed: x * 7 + y * 13 + 1 });
        var tresc = '<polygon class="grunt" points="' + G.romb() + '" fill="transparent"/>' + g1.svg;
        gora = Math.min(gora, cy + g1.gora);
        tresc += '<polygon class="obrys" points="' + G.romb() + '" fill="none"/>';
        if (ob) {
          r = G.rysuj(ob.typ, ob.poz, { noc: noc, seed: ob.seed, sasiedzi: ob.sasiedzi, woda: ob.woda, budowa: ob.budowa });
          tresc += '<g class="ob">' + r.svg + '</g>';
          gora = Math.min(gora, cy + r.gora);
          if (ob.plakietka != null) {
            tresc += '<g class="plakietka' + (ob.budowa || ob.poz < 1 ? ' budowa' : '') + '"><circle cx="0" cy="20" r="12"/>' +
              '<text x="0" y="20.5" text-anchor="middle" dominant-baseline="central">' + ob.plakietka + '</text></g>';
          }
        }
        s += '<g class="pole' + (pole.klasy ? ' ' + pole.klasy : '') + '" data-x="' + x + '" data-y="' + y + '" transform="translate(' + cx + ',' + cy + ')">' + tresc + '</g>';
      }
    }
    // podstawa wyspy
    var L = [-n * HW, (n - 1) * HH], B = [0, (2 * n - 1) * HH], R = [n * HW, (n - 1) * HH], T = [0, -HH], gr = 14;
    NOC = noc;
    var wyspa = '<ellipse cx="0" cy="' + (B[1] + 20) + '" rx="' + (n * HW * 0.8) + '" ry="20" fill="rgba(10,20,50,' + (noc ? '.35' : '.14') + ')"/>' +
      wiel([L, B, [B[0], B[1] + gr], [L[0], L[1] + gr]], C('#b08b62')) +
      wiel([B, R, [R[0], R[1] + gr], [B[0], B[1] + gr]], C('#94714d')) +
      wiel([T, R, B, L], C(dane.kolor || '#a8d28a'));
    var margines = 10, minX = -n * HW - margines, szer = 2 * n * HW + 2 * margines;
    var top = Math.floor(gora - 8), wys = B[1] + gr + 44 - top;
    return '<svg class="mapa" viewBox="' + minX + ' ' + top + ' ' + szer + ' ' + wys + '" role="img" aria-label="Mapa dzielnicy">' + wyspa + s + '</svg>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
