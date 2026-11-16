/* =====================================================================
   MIASTO – service worker
   1. Działanie bez internetu: wszystkie pliki aplikacji są w pamięci telefonu.
   2. Aktualizacje: aplikacja startuje z pamięci, a chwilę później porównuje pliki z serwerem.
      Gdy coś się zmieniło, pokazuje komunikat „Jest nowa wersja”.
   3. Przypomnienia w tle (tam, gdzie przeglądarka na to pozwala).
   Po dodaniu nowego pliku do aplikacji dopisz go do listy PLIKI.
   ===================================================================== */
const PAMIEC = 'miasto-pliki-v1';
const META = 'miasto-meta';
const PLIKI = [
  './', 'index.html', 'style.css', 'config.js', 'engine.js', 'sprites.js', 'ui.js', 'ekrany.js', 'app.js',
  'manifest.webmanifest', 'sofia-sans.woff2', 'sofia-sans-condensed.woff2',
  'ikona-192.png', 'ikona-512.png', 'ikona-maskowalna-512.png', 'ikona-180.png', 'ikona-znak.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(PAMIEC).then(function (c) {
      return Promise.all(PLIKI.map(function (u) {
        return fetch(new Request(u, { cache: 'reload' })).then(function (r) {
          if (!r.ok) throw new Error('Nie udało się pobrać: ' + u);
          return c.put(u, r);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (klucze) {
      return Promise.all(klucze.filter(function (k) { return k.indexOf('miasto-pliki-') === 0 && k !== PAMIEC; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function oglos(typ) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (okna) {
    okna.forEach(function (o) { o.postMessage({ typ: typ }); });
  });
}

// Czy dwie odpowiedzi różnią się treścią
function rozne(a, b) {
  const ea = (a.headers.get('etag') || '').replace(/^W\//, ''), eb = (b.headers.get('etag') || '').replace(/^W\//, '');
  if (ea && eb) return Promise.resolve(ea !== eb);
  return Promise.all([a.arrayBuffer(), b.arrayBuffer()]).then(function (t) {
    if (t[0].byteLength !== t[1].byteLength) return true;
    const p = new Uint8Array(t[0]), q = new Uint8Array(t[1]);
    for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) return true;
    return false;
  });
}

// Pliki zawsze z pamięci telefonu (szybko i bez sieci); czego w niej nie ma, pobieramy i dopisujemy.
function obsluz(e, url) {
  const klucz = url.origin + url.pathname;
  return caches.open(PAMIEC).then(function (c) {
    return c.match(klucz).then(function (zPamieci) {
      if (zPamieci) return zPamieci;
      return fetch(e.request).then(function (res) {
        if (res && res.ok && !res.redirected && res.type === 'basic') c.put(klucz, res.clone());
        return res;
      }).catch(function () {
        if (e.request.mode === 'navigate') return c.match('index.html').then(function (idx) { return idx || brakSieci(); });
        return brakSieci();
      });
    });
  });
}
function brakSieci() {
  return new Response('Brak połączenia z internetem.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

/* ---------- aktualizacja ----------
   Porównuje wszystkie pliki z serwerem. Podmienia je w pamięci dopiero wtedy, gdy udało się
   pobrać komplet, żeby aplikacja nigdy nie działała na mieszance starych i nowych plików. */
let sprawdzanie = null;
function sprawdzWszystko() {
  if (sprawdzanie) return sprawdzanie;
  sprawdzanie = caches.open(PAMIEC).then(function (c) {
    return Promise.all(PLIKI.map(function (u) {
      return fetch(new Request(u, { cache: 'no-cache' })).then(function (res) {
        if (!res.ok || res.redirected) throw new Error('Nie udało się pobrać: ' + u);
        return c.match(u).then(function (stary) {
          return (stary ? rozne(stary, res.clone()) : Promise.resolve(true)).then(function (zmiana) { return { u: u, res: res, zmiana: zmiana }; });
        });
      });
    })).then(function (lista) {
      const zmienione = lista.filter(function (x) { return x.zmiana; });
      if (!zmienione.length) return false;
      return Promise.all(zmienione.map(function (x) { return c.put(x.u, x.res); })).then(function () { return true; });
    });
  }).catch(function () { return false; }).then(function (wynik) { sprawdzanie = null; return wynik; });
  return sprawdzanie;
}
function poChwili(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf(new URL('./', self.location).pathname) !== 0) return;
  e.respondWith(obsluz(e, url));
  // przy każdym uruchomieniu aplikacji: chwilę po starcie sprawdź, czy na serwerze jest nowsza wersja
  if (req.mode === 'navigate') {
    e.waitUntil(poChwili(2500).then(sprawdzWszystko).then(function (zmiana) { if (zmiana) return oglos('nowa-wersja'); }));
  }
});

self.addEventListener('message', function (e) {
  if (!e.data || e.data.typ !== 'sprawdz') return;
  e.waitUntil(sprawdzWszystko().then(function (zmiana) {
    if (e.source && e.source.postMessage) e.source.postMessage({ typ: zmiana ? 'nowa-wersja' : 'aktualna' });
  }));
});

/* ---------- przypomnienia w tle ---------- */
function dwie(n) { return n < 10 ? '0' + n : '' + n; }
function kluczDnia(d) { return d.getFullYear() + '-' + dwie(d.getMonth() + 1) + '-' + dwie(d.getDate()); }

function przypomnienia() {
  return caches.open(META).then(function (c) {
    return c.match('meta.json').then(function (r) { return r ? r.json() : null; }).then(function (meta) {
      if (!meta || !meta.powiad || !meta.powiad.wlaczone) return;
      if (self.Notification && self.Notification.permission !== 'granted') return;
      return self.clients.matchAll({ type: 'window' }).then(function (okna) {
        if (okna.some(function (o) { return o.visibilityState === 'visible'; })) return;   // otwarta aplikacja radzi sobie sama
        const teraz = Date.now(), p = meta.powiad, wys = meta.wyslane || (meta.wyslane = {}), kolejka = [];
        const pokaz = function (tytul, tresc, tag) {
          kolejka.push(self.registration.showNotification(tytul, { body: tresc, tag: tag, icon: 'ikona-192.png', badge: 'ikona-znak.png', lang: 'pl' }));
        };
        if (p.budowa) {
          (meta.budowy || []).forEach(function (b) {
            const k = 'b' + b.id + ':' + b.gotowe;
            if (b.gotowe <= teraz && !wys[k]) { wys[k] = 1; pokaz('Budowa zakończona', b.nazwa + (b.poz > 1 ? ', poziom ' + b.poz : '') + ' czeka w mieście.', 'miasto-budowa-' + b.id); }
          });
        }
        if (p.wieczor && /^\d\d:\d\d$/.test(p.godzinaWieczor || '')) {
          const dzienGry = kluczDnia(new Date(teraz - (meta.poczatekGodzina || 0) * 3600000));
          const prog = new Date(teraz);
          prog.setHours(+p.godzinaWieczor.slice(0, 2), +p.godzinaWieczor.slice(3), 0, 0);
          const k = 'w' + dzienGry, dz = meta.dzien || {}, tenSam = dz.klucz === dzienGry;
          if (teraz >= prog.getTime() && !wys[k] && (!tenSam || !dz.zal)) {
            wys[k] = 1;
            pokaz('Dzień jeszcze niezaliczony', tenSam
              ? 'Brakuje ' + dz.brakuje + ' pkt' + (dz.seria > 0 ? ', żeby utrzymać serię.' : '.')
              : 'Dziś nic jeszcze nie odhaczono. Miasto czeka.', 'miasto-wieczor');
          }
        }
        if (!kolejka.length) return;
        return Promise.all(kolejka).then(function () {
          return c.put('meta.json', new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } }));
        });
      });
    });
  }).catch(function () { /* brak danych – nic do zrobienia */ });
}

self.addEventListener('periodicsync', function (e) {
  if (e.tag === 'miasto-przypomnienia') e.waitUntil(przypomnienia());
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (okna) {
    for (let i = 0; i < okna.length; i++) if ('focus' in okna[i]) return okna[i].focus();
    return self.clients.openWindow('./');
  }));
});
