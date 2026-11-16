/* =====================================================================
   MIASTO – konfiguracja gry
   ---------------------------------------------------------------------
   To jedyny plik, który trzeba edytować, żeby zmienić punkty, premie,
   budynki i koszty. Po zmianie zapisz plik w repozytorium i otwórz
   aplikację ponownie (online) – pojawi się komunikat o nowej wersji.

   Zasady:
   - "id" zadań i budynków nie zmieniaj, jeśli gra jest już w toku
     (historia odwołuje się do id). Nazwy i punkty można zmieniać śmiało.
   - Zmiana punktów działa od bieżącego dnia; zamknięte dni zostają
     z punktami, które miały.
   ===================================================================== */
window.KONFIG = {
  wersja: '1.0.0',

  /* ---------- Dzień gry ---------- */
  dzien: {
    // Dzień gry trwa od tej godziny do tej samej godziny następnego dnia.
    // Dzięki temu zadania odhaczone po północy liczą się jeszcze do "dziś".
    poczatekGodzina: 4
  },

  /* ---------- Start nowej gry ---------- */
  start: {
    punkty: 60,                 // punkty na dobry początek
    nazwaMiasta: 'Warsowia'
  },

  /* ---------- Domyślne ustawienia (zmieniane potem w aplikacji) ---------- */
  ustawieniaDomyslne: {
    godzinaSnu: '23:30',        // "Sen przed ustaloną godziną"
    limitEkranuMin: 180,        // limit czasu ekranowego w minutach
    celKrokow: 8000,
    progDnia: 40,               // ile punktów trzeba zdobyć, żeby dzień liczył się do serii
    piesWKomplecie: true        // czy spacer z psem jest wymagany do kompletu podstaw
  },

  /* ---------- Kategorie zadań ---------- */
  kategorie: [
    // kolor = tryb jasny, kolorNoc = tryb ciemny (zestaw sprawdzony pod kątem daltonizmu)
    { id: 'podstawy', nazwa: 'Podstawy',               kolor: '#1baf7a', kolorNoc: '#199e70', ikona: 'kropla' },
    { id: 'nauka',    nazwa: 'Nauka',                  kolor: '#2a78d6', kolorNoc: '#3987e5', ikona: 'ksiazka' },
    { id: 'praca',    nazwa: 'Praca i rozwój',         kolor: '#eb6834', kolorNoc: '#d95926', ikona: 'teczka' },
    { id: 'cialo',    nazwa: 'Ciało',                  kolor: '#6250d6', kolorNoc: '#9085e9', ikona: 'hantel' },
    { id: 'dom',      nazwa: 'Dom i pomoc rodzicom',   kolor: '#eda100', kolorNoc: '#c98500', ikona: 'dom' },
    { id: 'sprawy',   nazwa: 'Porządki i sprawy',      kolor: '#e87ba4', kolorNoc: '#d55181', ikona: 'lista' },
    { id: 'zdrowie',  nazwa: 'Zdrowie i profilaktyka', kolor: '#008300', kolorNoc: '#0ca30c', ikona: 'serce' },
    { id: 'cyfrowa',  nazwa: 'Higiena cyfrowa',        kolor: '#e34948', kolorNoc: '#e66767', ikona: 'telefon' }
  ],

  /* ---------- Zadania i punkty ----------
     typ:
       'raz'     – raz dziennie, stała liczba punktów
       'licznik' – można odhaczyć kilka razy dziennie (max = limit dzienny)
       'czas'    – każde dotknięcie to jedna porcja czasu (minuty), punkty za porcję;
                   limitMin = ile minut dziennie jest punktowane (reszta zapisuje się bez punktów)
       'ekran'   – wpisywany ręcznie czas ekranowy; punkty, gdy jest poniżej limitu
     zastepuje: id zadania, które przestaje się liczyć, gdy to jest odhaczone
     W nazwie można użyć: {godzinaSnu}, {celKrokow}, {limitEkranu}
  */
  zadania: [
    // --- Podstawy (codziennie)
    { id: 'zeby_rano',    nazwa: 'Mycie zębów rano',        kategoria: 'podstawy', typ: 'raz', punkty: 2 },
    { id: 'zeby_wieczor', nazwa: 'Mycie zębów wieczorem',   kategoria: 'podstawy', typ: 'raz', punkty: 2 },
    { id: 'prysznic',     nazwa: 'Prysznic',                kategoria: 'podstawy', typ: 'raz', punkty: 4, opis: 'zalicza też mycie twarzy', zastepuje: 'twarz' },
    { id: 'twarz',        nazwa: 'Umycie twarzy',           kategoria: 'podstawy', typ: 'raz', punkty: 3, opis: 'gdy bez prysznica' },
    { id: 'lozko',        nazwa: 'Posłanie łóżka',          kategoria: 'podstawy', typ: 'raz', punkty: 2 },
    { id: 'sen',          nazwa: 'Sen przed {godzinaSnu}',  kategoria: 'podstawy', typ: 'raz', punkty: 5, opis: 'odhacz, kładąc się spać' },
    { id: 'pies',         nazwa: 'Wyprowadzenie psa',       kategoria: 'podstawy', typ: 'licznik', punkty: 4, max: 4, opis: 'za każdy spacer' },

    // --- Nauka
    { id: 'nauka', nazwa: 'Nauka', kategoria: 'nauka', typ: 'czas', minuty: 30, punkty: 15, limitMin: 360, opis: 'także bloki pytań testowych' },
    { id: 'anki',  nazwa: 'Anki – powtórki do zera', kategoria: 'nauka', typ: 'raz', punkty: 20 },

    // --- Praca i rozwój
    { id: 'korki',      nazwa: 'Przeprowadzone korepetycje',          kategoria: 'praca', typ: 'licznik', punkty: 20, max: 6, opis: 'za każdą lekcję' },
    { id: 'materialy',  nazwa: 'Przygotowanie materiałów dla ucznia', kategoria: 'praca', typ: 'licznik', punkty: 5,  max: 6, opis: 'za każde przygotowanie' },
    { id: 'zbior',      nazwa: 'Praca nad zbiorem zadań',             kategoria: 'praca', typ: 'czas', minuty: 15, punkty: 6 },
    { id: 'kolo',       nazwa: 'Koło naukowe',                        kategoria: 'praca', typ: 'raz', punkty: 20, opis: 'spotkanie lub praca' },
    { id: 'ksiazka',    nazwa: 'Czytanie książki',                    kategoria: 'praca', typ: 'czas', minuty: 30, punkty: 15 },
    { id: 'hiszpanski', nazwa: 'Nauka hiszpańskiego',                 kategoria: 'praca', typ: 'czas', minuty: 30, punkty: 15 },

    // --- Ciało
    { id: 'silownia',    nazwa: 'Siłownia',             kategoria: 'cialo', typ: 'raz', punkty: 40, opis: 'za wyjście' },
    { id: 'sport',       nazwa: 'Inny sport',           kategoria: 'cialo', typ: 'licznik', punkty: 25, max: 2, opis: 'bieganie, rower, gra' },
    { id: 'kroki',       nazwa: 'Cel kroków: {celKrokow}', kategoria: 'cialo', typ: 'raz', punkty: 8 },
    { id: 'rozciaganie', nazwa: 'Rozciąganie',          kategoria: 'cialo', typ: 'raz', punkty: 8 },

    // --- Dom i pomoc rodzicom
    { id: 'pokoj',      nazwa: 'Sprzątanie swojego pokoju',         kategoria: 'dom', typ: 'raz', punkty: 8 },
    { id: 'zmywanie',   nazwa: 'Zmywarka lub zmywanie',             kategoria: 'dom', typ: 'licznik', punkty: 4, max: 3 },
    { id: 'smieci',     nazwa: 'Wyniesienie śmieci',                kategoria: 'dom', typ: 'licznik', punkty: 5, max: 2 },
    { id: 'pranie',     nazwa: 'Pranie i rozwieszenie',             kategoria: 'dom', typ: 'licznik', punkty: 8, max: 2 },
    { id: 'odkurzanie', nazwa: 'Odkurzanie wspólnych pomieszczeń',  kategoria: 'dom', typ: 'raz', punkty: 10 },
    { id: 'zakupy',     nazwa: 'Zakupy dla domu',                   kategoria: 'dom', typ: 'licznik', punkty: 10, max: 2 },
    { id: 'obiad',      nazwa: 'Obiad dla wszystkich',              kategoria: 'dom', typ: 'raz', punkty: 15 },
    { id: 'rodzice',    nazwa: 'Sprawa załatwiona za rodziców',     kategoria: 'dom', typ: 'licznik', punkty: 12, max: 3 },

    // --- Porządki i sprawy do załatwienia
    { id: 'mala_sprawa', nazwa: 'Mała sprawa',      kategoria: 'sprawy', typ: 'licznik', punkty: 10, max: 5, opis: 'mail, telefon, zwrot paczki' },
    { id: 'odkladana',   nazwa: 'Odkładana sprawa', kategoria: 'sprawy', typ: 'licznik', punkty: 20, max: 3, opis: 'czeka od ponad tygodnia' },
    { id: 'porzadki',    nazwa: 'Duże porządki',    kategoria: 'sprawy', typ: 'licznik', punkty: 30, max: 2, opis: 'szafa, schowek, decyzja co z rzeczami' },

    // --- Zdrowie i profilaktyka
    { id: 'wizyta',  nazwa: 'Umówienie wizyty lub badania',            kategoria: 'zdrowie', typ: 'licznik', punkty: 15, max: 3 },
    { id: 'badanie', nazwa: 'Badanie profilaktyczne lub szczepienie',  kategoria: 'zdrowie', typ: 'licznik', punkty: 25, max: 2, opis: 'wykonane' },
    { id: 'tabela',  nazwa: 'Uzupełnienie tabeli zdrowia',             kategoria: 'zdrowie', typ: 'raz', punkty: 15 },

    // --- Higiena cyfrowa
    { id: 'ekran', nazwa: 'Czas ekranowy poniżej {limitEkranu}', kategoria: 'cyfrowa', typ: 'ekran', punkty: 15, opis: 'wpisz czas z ustawień telefonu' }
  ],

  /* ---------- Premie i mechaniki ---------- */
  premie: {
    // Komplet podstaw w ciągu dnia
    komplet: {
      punkty: 5,
      // każdy wiersz to jeden wymóg; wystarczy dowolne zadanie z wiersza
      wymagane: [['zeby_rano'], ['zeby_wieczor'], ['prysznic', 'twarz'], ['lozko'], ['sen']],
      // dodatkowy wymóg, włączany w Ustawieniach ("Spacer z psem w komplecie")
      pies: ['pies']
    },
    // Pierwsza sesja nauki danego dnia
    pierwszaSesja: { punkty: 10, zadania: ['nauka'] },
    // Zadanie dnia: punkty x mnoznik, ale premia nie większa niż maxPremia
    // (żeby zadanie czasowe, np. nauka, nie dawało premii bez końca)
    zadanieDnia: { mnoznik: 1.5, maxPremia: 20 },
    // Seria dni: +zaDzien za każdy dzień serii, najwyżej max dziennie
    seria: { zaDzien: 2, max: 20 },
    // Wyzwanie tygodniowe
    wyzwanie: { punkty: 50 },
    // Ochrona serii: co tydzień +naTydzien dzień wolny; bez Szpitala przechowasz zapasBazowy,
    // każdy poziom Szpitala zwiększa zapas o 1 i od razu daje 1 dzień
    ochrona: { naTydzien: 1, zapasBazowy: 1 },
    // Promocja: co tyle dni nieprzerwanej serii dostajesz dzień z tańszymi budowami
    promocja: { coIleDniSerii: 7, rabatProcent: 20, maxZapas: 3 },
    // Zieleń: każde tyle punktów zieleni daje +1 pkt do dziennej premii za serię (najwyżej max)
    zielen: { punktyZieleniNaPunkt: 2, max: 10 }
  },

  /* ---------- Gotowe wyzwania tygodniowe ----------
     miara: 'razy' (liczba odhaczeń), 'dni' (w ilu dniach), 'minuty' (łączny czas), 'komplet' (dni z kompletem podstaw)
  */
  wyzwania: [
    { id: 'silownia3', nazwa: '3 razy siłownia',                      zadania: ['silownia'],           miara: 'razy',   cel: 3 },
    { id: 'ruch4',     nazwa: '4 treningi: siłownia lub inny sport',  zadania: ['silownia', 'sport'],  miara: 'razy',   cel: 4 },
    { id: 'nauka10h',  nazwa: '10 godzin nauki',                      zadania: ['nauka'],              miara: 'minuty', cel: 600 },
    { id: 'nauka15h',  nazwa: '15 godzin nauki',                      zadania: ['nauka'],              miara: 'minuty', cel: 900 },
    { id: 'anki6',     nazwa: 'Anki do zera w 6 dni',                 zadania: ['anki'],               miara: 'dni',    cel: 6 },
    { id: 'komplet5',  nazwa: 'Komplet podstaw w 5 dni',                                               miara: 'komplet', cel: 5 },
    { id: 'sen5',      nazwa: 'Sen o czasie w 5 dni',                 zadania: ['sen'],                miara: 'dni',    cel: 5 },
    { id: 'ekran5',    nazwa: 'Czas ekranowy w limicie w 5 dni',      zadania: ['ekran'],              miara: 'dni',    cel: 5 },
    { id: 'hiszp4',    nazwa: 'Hiszpański w 4 dni',                   zadania: ['hiszpanski'],         miara: 'dni',    cel: 4 },
    { id: 'ksiazka3h', nazwa: '3 godziny czytania',                   zadania: ['ksiazka'],            miara: 'minuty', cel: 180 },
    { id: 'zbior2h',   nazwa: '2 godziny pracy nad zbiorem zadań',    zadania: ['zbior'],              miara: 'minuty', cel: 120 },
    { id: 'sprawy3',   nazwa: '3 odkładane sprawy',                   zadania: ['odkladana'],          miara: 'razy',   cel: 3 },
    { id: 'dom8',      nazwa: '8 zadań domowych',                     kategorie: ['dom'],              miara: 'razy',   cel: 8 }
  ],

  /* ---------- Budowa ---------- */
  budowa: {
    nocnaOdKosztu: 300,           // budowy od tej ceny (bazowej) trwają "przez noc"; tańsze są od ręki
    godzinaGotowosci: 6,          // o której rano nocna budowa jest gotowa
    drugaEkipaOdWarsztatu: 3,     // od tego poziomu Warsztatu można prowadzić dwie nocne budowy naraz
    zwrotZaWyburzenie: 0.5        // jaką część kosztu oddaje wyburzenie zabudowy
  },
  warsztat: { rabatNaPoziom: 3, maxRabat: 15 },   // % zniżki na budowy i ulepszenia innych budynków
  bank: { procentNaPoziom: 1, maxNaPoziom: 20 },  // tygodniowe odsetki: % niewydanych punktów, limit pkt na poziom

  /* ---------- Wymagania do ulepszenia Ratusza NA dany poziom ---------- */
  ratusz: {
    2: { mieszkancy: 120,  liczbaMocy: 3 },
    3: { mieszkancy: 500,  liczbaMocy: 5 },
    4: { mieszkancy: 1500, wszystkieMoceMin: 2 },
    5: { mieszkancy: 4000, wszystkieMoceMin: 3 }
  },

  /* ---------- Budynki i zabudowa ----------
     grupa:    'moc' (budynek z mocą, tylko jeden), 'mieszkania', 'infra', 'zielen', 'znak' (punkt orientacyjny)
     koszt:    cena kolejnych poziomów (pierwsza liczba = budowa)
     warsztat: wymagany poziom Warsztatu dla kolejnych poziomów
     odRatusza: od którego poziomu Ratusza budynek jest dostępny
     Poziom budynku nie może przekroczyć poziomu Ratusza (wyjątek: bezLimituRatusza).
     bonus:    { zadania / kategorie, procent } – premia procentowa na poziom
  */
  obiekty: {
    // --- Budynki z mocami (każdy tylko raz)
    ratusz: {
      nazwa: 'Ratusz', grupa: 'moc', unikat: true,
      opis: 'Serce miasta. Jego poziom ogranicza poziom pozostałych budynków i odblokowuje nowe.',
      koszt: [0, 250, 700, 1600, 3500], warsztat: [0, 0, 2, 3, 4]
    },
    biblioteka: {
      nazwa: 'Biblioteka', grupa: 'moc', unikat: true, odRatusza: 1,
      opis: 'Więcej punktów za naukę i Anki.',
      koszt: [60, 150, 360, 800, 1600], warsztat: [0, 0, 2, 3, 4],
      bonus: { zadania: ['nauka', 'anki'], procent: 5 }
    },
    silownia: {
      nazwa: 'Siłownia', grupa: 'moc', unikat: true, odRatusza: 1,
      opis: 'Więcej punktów za siłownię i inny sport.',
      koszt: [60, 150, 360, 800, 1600], warsztat: [0, 0, 2, 3, 4],
      bonus: { zadania: ['silownia', 'sport'], procent: 5 }
    },
    kamienica: {
      nazwa: 'Kamienica Rodzinna', grupa: 'moc', unikat: true, odRatusza: 1,
      opis: 'Więcej punktów za zadania domowe i pomoc rodzicom.',
      koszt: [50, 120, 300, 650, 1300], warsztat: [0, 0, 2, 3, 4],
      bonus: { kategorie: ['dom'], procent: 10 }
    },
    warsztat: {
      nazwa: 'Warsztat', grupa: 'moc', unikat: true, odRatusza: 1, efekt: 'warsztat',
      opis: 'Obniża koszt budów i ulepszeń innych budynków. Wymagany do większych inwestycji.',
      koszt: [80, 200, 500, 1100, 2200]
    },
    szkola: {
      nazwa: 'Szkoła', grupa: 'moc', unikat: true, odRatusza: 2,
      opis: 'Więcej punktów za korepetycje i przygotowanie materiałów.',
      koszt: [60, 150, 360, 800, 1600], warsztat: [0, 0, 2, 3, 4],
      bonus: { zadania: ['korki', 'materialy'], procent: 10 }
    },
    drukarnia: {
      nazwa: 'Drukarnia', grupa: 'moc', unikat: true, odRatusza: 2,
      opis: 'Więcej punktów za pracę nad zbiorem zadań.',
      koszt: [50, 120, 300, 650, 1300], warsztat: [0, 0, 2, 3, 4],
      bonus: { zadania: ['zbior'], procent: 10 }
    },
    szpital: {
      nazwa: 'Szpital', grupa: 'moc', unikat: true, odRatusza: 2, efekt: 'ochrona',
      opis: 'Dodatkowe dni ochrony serii.',
      koszt: [100, 250, 600, 1300, 2600], warsztat: [1, 1, 2, 3, 4]
    },
    szkola_jezykowa: {
      nazwa: 'Szkoła językowa', grupa: 'moc', unikat: true, odRatusza: 3,
      opis: 'Więcej punktów za naukę hiszpańskiego.',
      koszt: [50, 120, 300, 650, 1300], warsztat: [0, 0, 2, 3, 4],
      bonus: { zadania: ['hiszpanski'], procent: 10 }
    },
    bank: {
      nazwa: 'Bank', grupa: 'moc', unikat: true, odRatusza: 3, efekt: 'bank',
      opis: 'Co tydzień wypłaca małe odsetki od niewydanych punktów.',
      koszt: [100, 250, 600, 1300, 2600], warsztat: [1, 1, 2, 3, 4]
    },

    // --- Mieszkania (można stawiać wiele; zwiększają liczbę mieszkańców)
    kamienica_m: {
      nazwa: 'Kamienica mieszkalna', grupa: 'mieszkania', odRatusza: 1,
      opis: 'Kolejne poziomy to nadbudowane piętra.',
      koszt: [30, 60, 110], mieszkancy: [40, 80, 130]
    },
    blok: {
      nazwa: 'Blok', grupa: 'mieszkania', odRatusza: 3,
      opis: 'Wielka płyta: dużo mieszkań na jednej działce.',
      koszt: [130, 220, 350], mieszkancy: [160, 280, 420], warsztat: [2, 2, 2]
    },
    apartamentowiec: {
      nazwa: 'Apartamentowiec', grupa: 'mieszkania', odRatusza: 5,
      opis: 'Nowoczesna wieża mieszkalna.',
      koszt: [400, 650, 1000], mieszkancy: [480, 800, 1200], warsztat: [4, 4, 4]
    },

    // --- Ulice i komunikacja
    ulica: {
      nazwa: 'Ulica', grupa: 'infra', odRatusza: 1,
      opis: 'Łączy się z sąsiednimi ulicami. Przystanki muszą stać przy ulicy.',
      koszt: [8], mieszkancy: [5]
    },
    przystanek_bus: {
      nazwa: 'Przystanek autobusowy', grupa: 'infra', odRatusza: 2, teren: 'przyUlicy', maxNaDzielnice: 2,
      opis: 'Stawiany przy ulicy, najwyżej dwa w dzielnicy.',
      koszt: [70], mieszkancy: [50]
    },
    przystanek_tram: {
      nazwa: 'Przystanek tramwajowy', grupa: 'infra', odRatusza: 3, teren: 'przyUlicy', maxNaDzielnice: 2,
      opis: 'Stawiany przy ulicy, najwyżej dwa w dzielnicy.',
      koszt: [200], mieszkancy: [120], warsztat: [2]
    },
    metro_m1: {
      nazwa: 'Stacja metra M1', grupa: 'infra', unikat: true, odRatusza: 4, odblokowuje: 'zieliborz',
      opis: 'Pierwsza linia metra. Otwiera dzielnicę Zieliborz.',
      koszt: [1800], mieszkancy: [300], warsztat: [3], wymagaMieszkancow: [2500]
    },
    metro_m2: {
      nazwa: 'Stacja metra M2', grupa: 'infra', unikat: true, odRatusza: 5, odblokowuje: 'zarzecze',
      opis: 'Druga linia metra, pod rzeką. Otwiera dzielnicę Zarzecze.',
      koszt: [3600], mieszkancy: [500], warsztat: [4], wymagaMieszkancow: [6000]
    },

    // --- Zieleń (mały bonus do serii)
    skwer: {
      nazwa: 'Skwer', grupa: 'zielen', odRatusza: 1, zielen: 1,
      opis: 'Trochę zieleni między budynkami.',
      koszt: [25], mieszkancy: [10]
    },
    park: {
      nazwa: 'Park', grupa: 'zielen', odRatusza: 2, zielen: 2,
      opis: 'Drzewa, staw i alejki.',
      koszt: [90], mieszkancy: [30]
    },
    bulwar: {
      nazwa: 'Bulwar nad rzeką', grupa: 'zielen', odRatusza: 3, zielen: 3, teren: 'przyWodzie',
      opis: 'Tylko na działkach przy rzece.',
      koszt: [160], mieszkancy: [40]
    },

    // --- Punkty orientacyjne
    kolumna: {
      nazwa: 'Kolumna Królewska', grupa: 'znak', unikat: true, odRatusza: 2,
      opis: 'Pierwszy pomnik miasta.',
      koszt: [250], mieszkancy: [60]
    },
    palac: {
      nazwa: 'Pałac Nauki', grupa: 'znak', unikat: true, odRatusza: 4,
      opis: 'Strzelisty gmach widoczny z każdej dzielnicy.',
      koszt: [2500], mieszkancy: [400], warsztat: [3]
    },
    wieza: {
      nazwa: 'Wieża Stołeczna', grupa: 'znak', unikat: true, odRatusza: 5, bezLimituRatusza: true, etapy: true,
      opis: 'Najwyższy wieżowiec w mieście. Budowany w dziesięciu etapach – cel na wiele miesięcy.',
      koszt: [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700],
      mieszkancy: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1200],
      warsztat: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
    }
  },

  /* ---------- Dzielnice ----------
     mapa: 6 wierszy po 6 znaków; '.' działka budowlana, 'w' rzeka, 'd' las (bez zabudowy)
  */
  dzielnice: [
    {
      id: 'srodmiescie', nazwa: 'Śródmieście',
      opis: 'Centrum miasta. Tu stoi Ratusz.',
      mapa: ['......', '......', '......', '......', '......', '......']
    },
    {
      id: 'porzecze', nazwa: 'Porzecze',
      opis: 'Dzielnica nad rzeką. Miejsce na bulwary.',
      koszt: 400, odRatusza: 3, mieszkancy: 1000,
      mapa: ['.....w', '.....w', '.....w', '.....w', '.....w', '.....w']
    },
    {
      id: 'zieliborz', nazwa: 'Zieliborz',
      opis: 'Zielona dzielnica willowa. Otwiera ją stacja metra M1.',
      przezObiekt: 'metro_m1',
      mapa: ['d....d', '......', '......', '......', '......', 'd....d']
    },
    {
      id: 'zarzecze', nazwa: 'Zarzecze',
      opis: 'Drugi brzeg rzeki. Otwiera ją stacja metra M2.',
      przezObiekt: 'metro_m2',
      mapa: ['w.....', 'w.....', 'w.....', 'w.....', 'w.....', 'w.....']
    }
  ]
};
