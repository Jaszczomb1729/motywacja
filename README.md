# Miasto – gra motywacyjna

Aplikacja na telefon (PWA): odhaczasz obowiązki z prawdziwego życia, dostajesz punkty i wydajesz je na budowę miasta. Działa bez internetu, a wszystkie dane trzyma w telefonie.

## Uruchomienie na GitHub Pages

1. Utwórz na GitHubie nowe, publiczne repozytorium, np. `miasto`.
2. Wgraj do niego wszystkie pliki z tej paczki, bezpośrednio do głównego katalogu (Add file → Upload files). Nie ma podfolderów, więc wystarczy zaznaczyć wszystkie pliki naraz.
3. W repozytorium otwórz Settings → Pages. W polu „Source” wybierz „Deploy from a branch”, gałąź `main`, katalog `/ (root)` i zapisz.
4. Po 1–2 minutach aplikacja będzie pod adresem `https://TWOJ-LOGIN.github.io/miasto/`.
5. Otwórz ten adres w telefonie i dodaj aplikację do ekranu głównego:
   - Android (Chrome): menu ⋮ → „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”,
   - iPhone (Safari): „Udostępnij” → „Do ekranu początkowego”.

Aplikacja wymaga HTTPS (GitHub Pages je zapewnia). Otwarta wprost z dysku jako plik zadziała, ale bez trybu offline i powiadomień.

## Pliki

| Plik | Do czego służy |
| --- | --- |
| `config.js` | **Cała konfiguracja**: zadania i punkty, premie, wyzwania, budynki, koszty, dzielnice. Ten plik edytujesz. |
| `engine.js` | Logika gry: dni, punktacja, seria, ochrona, promocje, budowa, zapis danych. |
| `sprites.js` | Rysunki budynków i mapa dzielnicy (SVG, dzień i noc). |
| `ekrany.js`, `ui.js`, `app.js` | Interfejs: pięć ekranów, arkusze, obsługa dotknięć, powiadomienia. |
| `style.css`, `index.html` | Wygląd i strona startowa. |
| `sw.js`, `manifest.webmanifest`, `ikona-*.png` | Instalacja na telefonie, działanie offline, aktualizacje. |
| `sofia-sans*.woff2`, `LICENCJA-czcionek.txt` | Czcionka Sofia Sans (licencja OFL) dołączona do aplikacji, żeby działała bez sieci. |

## Zmiana punktów i zasad

Wszystko jest w `config.js`, z komentarzami po polsku. Najczęstsze zmiany:

- **Punkty za zadanie**: w tablicy `zadania` zmień `punkty`.
- **Nowe zadanie na stałe**: dopisz obiekt do `zadania`. Rodzaje: `raz` (raz dziennie), `licznik` (kilka razy, pole `max`), `czas` (porcje czasu, pole `minuty`). Zadania możesz też dodawać w samej aplikacji (Ustawienia → Własne zadania), bez dotykania plików.
- **Premie**: sekcja `premie` (komplet podstaw, pierwsza sesja, zadanie dnia, seria, wyzwanie, ochrona, promocja, zieleń).
- **Koszty i poziomy budynków**: sekcja `obiekty`, tablica `koszt` (jedna liczba na poziom).

Nie zmieniaj `id` zadań i budynków, które już występują w zapisanej grze: historia odwołuje się do nich po `id`.

## Aktualizacje

Aplikacja uruchamia się z plików zapisanych w telefonie. Chwilę po starcie porównuje je z serwerem i jeśli coś się zmieniło, pokazuje komunikat „Jest nowa wersja aplikacji” z przyciskiem „Odśwież”. Sprawdzenie można też wymusić: Ustawienia → Sprawdź aktualizację.

Po zmianie pliku wystarczy więc zapisać go w repozytorium. Jeśli dodasz do aplikacji **nowy plik**, dopisz jego nazwę do listy `PLIKI` na początku `sw.js`.

## Dane i kopia zapasowa

Gra zapisuje się w pamięci przeglądarki (localStorage) na tym jednym urządzeniu. Usunięcie danych strony albo odinstalowanie aplikacji kasuje grę, dlatego warto co jakiś czas zrobić kopię: Ustawienia → Kopia zapasowa → „Zapisz kopię do pliku”. Z tego samego miejsca wczytasz kopię, także na innym telefonie.

## Powiadomienia – co działa, a co nie

W tej wersji powiadomienia są lokalne, bez serwera:

- działają, gdy aplikacja jest otwarta albo trzymana w tle,
- na Androidzie z zainstalowaną aplikacją przeglądarka może dodatkowo obudzić ją w tle (okresowa synchronizacja), ale o porze wybranej przez system,
- na iPhonie powiadomienia są dostępne dopiero po dodaniu aplikacji do ekranu początkowego i tylko wtedy, gdy aplikacja działa.

Pewne przypomnienie o stałej godzinie przy zamkniętej aplikacji wymaga powiadomień push z zewnętrznego serwisu (np. Firebase Cloud Messaging albo OneSignal). To rozszerzenie na później: wystarczy dopisać obsługę zdarzenia `push` w `sw.js`. O skończonych budowach i wydarzeniach z nocy aplikacja zawsze informuje przy najbliższym otwarciu.

## Decyzje, które specyfikacja zostawiała „do ustalenia”

- **Dzień gry trwa do 4:00**, więc wieczorne zadania odhaczone po północy liczą się do poprzedniego dnia. Poprawiać można dziś i wczoraj.
- **Dzień liczy się do serii od 40 pkt** (zmienisz w Ustawieniach). Same podstawy to za mało, podstawy i jedna sesja nauki już wystarczą.
- **Ochrona serii**: co tydzień dochodzi 1 dzień ochrony; w zapasie mieści się 1 plus tyle, ile wynosi poziom Szpitala. Ochrona włącza się sama, gdy dzień zostanie bez zaliczenia.
- **Zadanie dnia**: premia to połowa punktów zdobytych tego dnia za wybrane zadanie, najwyżej 20. Nie da się wybrać zadania już zrobionego.
- **Wyzwanie tygodnia**: liczy się postęp od dnia wyboru.
- **Budowa**: ceny poniżej 300 pkt są gotowe od ręki, droższe budują się przez noc i są gotowe o 6:00. Jedna ekipa, od Warsztatu na poziomie 3 dwie.
- **Ratusz** ma 5 poziomów i ogranicza poziom pozostałych budynków. Budynki z mocami mają po 5 poziomów.
- **Promocja**: co 7 dni nieprzerwanej serii dostajesz dzień promocji (budowy tańsze o 20%), który włączasz, kiedy chcesz.
- **Bank**: w poniedziałek wypłaca 1% niewydanych punktów na poziom, najwyżej 20 pkt na poziom.
- **Miasto**: 4 dzielnice na planie 6 × 6, czyli po 30–36 działek (Śródmieście, Porzecze, Zieliborz, Zarzecze). Porzecze kupuje się za punkty, dwie kolejne otwierają stacje metra M1 i M2. Wielki cel to Wieża Stołeczna budowana w 10 etapach, łącznie 12 500 pkt.
- **Wygląd miasta** zmienia się z porą dnia: po zmroku w oknach zapalają się światła.

## Pomysły na dalszy rozwój

- Powiadomienia push (patrz wyżej).
- Ocena nietypowych zadań przez AI: mały serwer pośredniczący (np. Cloudflare Worker) trzyma klucz API, a aplikacja wysyła do niego opis zadania i dostaje propozycję punktów. Klucz nigdy nie trafia do kodu aplikacji.
