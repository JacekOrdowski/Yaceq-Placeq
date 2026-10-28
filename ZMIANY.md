# Historia wersji: Śmierdzipacha

Wcześniejsze nazwy gry: „Armia Liczb” (wersje 1–4), „Głupia Gra” (wersja 5).

Najnowsza wersja jest na górze. Numer wersji widać w grze, na dole menu.
Do każdej wersji można wrócić: przy każdej podany jest identyfikator zapisu w repozytorium (np. `64a4bae`).

---

## Wersja 18 (28 października 2026)

Zapis w repozytorium: `1429050`

### Zmienione
- **Poprawka: wygrana mogła przepaść.** Po pokonaniu potwora gra czekała około 2,5 sekundy (radość, konfetti), zanim
  zapisała gwiazdki i złoto. Kto w tej chwili nacisnął pauzę albo zablokował telefon i wybrał „Menu” lub „Od nowa”,
  tracił gwiazdki, złoto i skrzynię. Teraz wynik zapisuje się w chwili wygranej (i przegranej).
- **Poprawka: złoto z przerwanej gry zostaje.** Kto wyjdzie z gry przez pauzę („Menu” albo „Od nowa”), zachowuje złoto
  zdobyte w tej grze, tak jak po przegranej.
- **Poprawka: ulepszenia ze skrzyni nie znikają po „Od nowa”.** Wcześniej kasowały się na starcie gry, więc po
  „Od nowa” (albo zamknięciu aplikacji w trakcie) przepadały. Teraz zużywają się dopiero, gdy gra się skończy.
- **Gra działa bez internetu od pierwszego uruchomienia.** Wcześniej dopiero od drugiego: kto otworzył grę raz,
  dodał ją do ekranu telefonu i włączył bez internetu, widział pusty ekran. Muzyka bez internetu dalej gra z melodii w kodzie.
- **Ćwiczenie po błędzie nie pobiera muzyki od nowa.** Wcześniej po każdym ćwiczeniu muzyka gry ładowała się jeszcze raz
  (chwila ciszy i zużycie internetu w telefonie).
- **Powtórzona stara gra nie cofa przycisku „Graj”** w menu: zostaje na grze, do której gracz doszedł.
- **„Gra na próbę” nie powtarza zadań z poprzednich gier na próbę** (wcześniej pilnowała tylko jednej gry).
- **Ćwiczenie po błędzie czeka, gdy telefon jest odłożony**, i nie wraca samo do gry w tle.
- Starsze iPhony: dźwięk pomocniczy (cichy) zatrzymuje się, gdy gra jest schowana.
- **Złe odpowiedzi, które dało się odrzucić bez liczenia:**
  - level 8, prawdopodobieństwo: zła odpowiedź nie jest już większa od 1 (np. było 6 albo 1 i 1/4),
  - level 5, skracanie ułamków: zła odpowiedź też jest ułamkiem nieskracalnym (wcześniej np. 2/4 przy wyniku 1/4),
  - level 4, dodawanie i odejmowanie ułamków: tak samo (wcześniej np. 6/6 albo 2/8),
  - level 7, długość odcinka: zła odpowiedź nie jest już 0.
- Sprawdzone automatycznie: 768 000 zadań bez błędnego wyniku i bez złej odpowiedzi równej dobrej.
  Tabela siły wrogów sprawdzona `narzedzia/balans.js`: jest aktualna (różnice kilku procent), bez zmian.

### Do sprawdzenia
- Level 6: procenty (np. „12 to ?% liczby 60”, podwyżki i obniżki cen) oraz łączenie wyrazów podobnych (2x + 3 + 4x)
  mogą być materiałem 7. klasy. Do decyzji właściciela, niezmienione.
- Z selekcji na najemnika dalej nie da się wyjść w połowie (zawsze się kończy, ale trzeba odpowiadać do końca).

---

## Wersja 17 (21 października 2026)

Zapis w repozytorium: `e7655a9`

### Dodane
- **Przycisk „Selekcja na najemnika” na ekranie wyboru levelu.** Selekcję można teraz zrobić w każdej chwili,
  nie tylko przy pierwszym uruchomieniu (np. gdy ktoś przypadkiem kliknął „Od początku”). Nic się nie traci:
  otwarte levele, gwiazdki i złoto zostają, a gdy wynik jest niższy niż to, co już otwarte, wszystko zostaje po staremu.
  Przycisk znika, gdy otwarte są wszystkie levele. W liczniku jest to wpis `selekcja/level-N`.
- **Nowy temat w levelu 8: przekształcanie wzorów** (np. V = a · b · h, wyznacz h; v = s : t, wyznacz t). Jest w podstawie
  programowej klas 7–8, starej i nowej.

### Zmienione
- **Kod QR do gry:** sprawdzony, prowadzi na https://jacekordowski.github.io/Yaceq-Placeq/ i odczytuje się z ekranu
  także rozmazany i pod kątem. Jest teraz większy, a obok jest wskazówka: nie robić zdjęcia, tylko przytrzymać aparat,
  a na Androidzie, gdy nic się nie pojawia, użyć Google Lens albo włączyć „Skanuj kody QR” w ustawieniach aparatu (Samsung).
- **Druga linijka zadania (dane) jest większa i ciemniejsza** w bramkach, w walce, w ćwiczeniu, w selekcji i w skrzyni,
  żeby nikt jej nie przeoczył.
- **Przegląd wszystkich zadań z podstawą programową** (z 2017 r. ze zmianami z 2024 r. i nową z 2026 r.):
  - level 6, równania, stopień 4: niewiadoma tylko po jednej stronie (np. 3(x + 2) = 21, (x − 2) : 3 = 4),
    bo tak mówi podstawa dla klas 4–6 (wcześniej było np. 6x + 5 = x + 35, czyli materiał 7. klasy),
  - level 2: zamiana jednostek w zakresie 100 (np. 1 zł = ? gr, pół metra = ? cm), bo w 2. klasie liczy się do 100
    (wcześniej np. 4 m = 400 cm),
  - levele 1 i 2: zła odpowiedź nie wychodzi poza liczby, na których pracuje klasa (np. przy liczeniu do 20 nie ma już 22),
    bo wtedy łatwo było zgadnąć dobrą,
  - „1x” zapisane jak w szkole: „x” (np. 4x − 6 = x + 14, zła odpowiedź „x²”),
  - level 8: „W worku są kule: 3 czerwone i 1 niebieska” zamiast „3 czerwonych i 1 niebieskich kul”,
  - level 6: zamiast dziwnej złej odpowiedzi (np. 0,75 = 75/101) odwrócony ułamek (4/3), czyli częsty błąd,
  - level 8: podpowiedź do losowania litery liczyła ze złej liczby liter (np. KAKADU: 2/10 zamiast 2/6),
  - level 8, równania z nawiasem: w podpowiedzi nie pojawia się już liczba wyglądająca jak wynik.
- Sprawdzone automatycznie: 384 000 zadań bez błędnego wyniku i bez złej odpowiedzi równej dobrej, 48 000 podpowiedzi bez wyniku.
- **Poprawka: w selekcji na najemnika, w skrzyni po potworze i w przykładzie na karcie przed grą brakowało drugiej linijki
  zadania**, czyli danych. Na przykład było samo „Obwód = ? cm” bez „Prostokąt 7 cm na 4 cm”. Dotyczyło to około jednej
  trzeciej zadań (obwody, prędkość, Pitagoras, średnia, prawdopodobieństwo, procenty i inne). W zwykłej grze, w walce
  i w ćwiczeniu po błędzie dane były zawsze. Sprawdzone: cała selekcja (40 zadań), każde zadanie z drugą linijką ją pokazuje.

### Usunięte
- Temat „Nierówności” z levelu 8: nie ma go w podstawie programowej szkoły podstawowej (ani starej, ani nowej), jest dopiero w szkole średniej.

---

## Wersja 16 (21 października 2026)

Zapis w repozytorium: `d0bb862`

### Dodane
- **Licznik widzi więcej** (dalej bez imion i bez danych osobowych):
  - `instalacja`: gra pierwszy raz otwarta z ikonki na ekranie telefonu, czyli dodana do telefonu (raz na urządzenie),
  - `start/od-poczatku` i `start/selekcja-level-N`: jak nowy gracz zaczął i do którego levelu trafił z selekcji,
  - `egzamin/level-N`: rozpoczęty egzamin, `egzamin/level-N/zdany`: zdany egzamin,
  - `proba/level-N`: gra na próbę w otwartym levelu.

### Zmienione
- `gra/level-N` liczy teraz tylko prawdziwe gry (bez gier na próbę i egzaminów).

---

## Wersja 15 (20 października 2026)

Zapis w repozytorium: `61d24b4`

### Dodane
- **Pytanie na start: „Jak chcesz grać?”** (tylko u nowego gracza): „Od początku”, czyli wszystkie levele po kolei,
  albo „Selekcja na najemnika”.
- **Selekcja na najemnika:** sierżant sprawdza wiedzę. Etapy od levelu 1 w górę, po 5 zadań z mieszanki tematów
  danego levelu; 4 dobre odpowiedzi zaliczają etap. Za każdy etap jest stopień, od szeregowego do kapitana.
  Przydział to ostatni zaliczony level, a wszystkie niższe są też otwarte.
- **Egzamin:** w zamkniętym levelu gra na próbę wygrana bez ani jednego błędu otwiera ten level razem z niższymi.
- **Złoto na start po selekcji i egzaminie:** gra dopłaca do tego, co ma dobry gracz na początku tego levelu
  (liczy złoto i to, co już kupione, więc nie da się go nabić powtarzaniem).
- **„Kup polecane ulepszenia”** w Zbrojowni: kupuje po kolei najtańsze, dopóki starcza złota.

### Zmienione
- Lista leveli: przy zamkniętym levelu przycisk „Egzamin” zamiast „Zagraj na próbę” i opis, jak go otworzyć.

---

## Wersja 14 (20 października 2026)

Zapis w repozytorium: `c28fc04`

### Dodane
- **Zbrojownia jak w Archero: 13 ulepszeń na stałe**, kupowanych za złoto poziom po poziomie:
  żołnierze na start, szybkie strzelanie, broń na start, dodatkowa lufa (2 albo 3 pociski obok siebie),
  pociski przeszywające, podwójny strzał, ogniste, mrożące i zatrute pociski, boczne lufy pod kątem do przodu,
  odbijanie od ścian, działo elektryczne (piorun skacze po wrogach) i wybuchający wrogowie.
  Nowe ulepszenia otwierają się na kolejnych levelach (od 1 do 6), więc na każdym levelu jest na co zbierać.
  Każde ma swój wygląd w grze: kolorowe pociski, płomienie nad wrogiem, bryła lodu, zielone bąbelki trucizny, pioruny, wybuchy.
- **Skrzynia po potworze:** 5 zadań na czas z paskiem, który leci cały czas. Dobra odpowiedź to punkt, skończenie przed
  znakiem ⚡ to jeszcze jeden. Skrzynia drewniana, srebrna, złota albo diamentowa: w środku złoto i ulepszenia
  na następną grę (częściej te jeszcze niekupione, żeby je wypróbować).
- **Gra na próbę w każdym levelu**, także zamkniętym: po trochu ze wszystkich tematów levelu, ulepszenia ustawione jak
  w połowie levelu. Nie daje złota, gwiazdek ani skrzyni.
- **Płonący autobus i TIR** na połowie drogi zamiast dziury w nawierzchni.
- **Licznik odwiedzin GoatCounter** (bez ciasteczek): liczy wejścia na stronę i rozpoczęte gry według levelu.
- W ćwiczeniu po błędzie: 20 spokojnych sekund na zadanie, potem napis „Ale bez przesady” i pasek czasu
  (gdy się skończy, liczy się to jak zła odpowiedź).
- Program `narzedzia/balans.js`, który dobiera siłę wrogów do ulepszeń.

### Zmienione
- **Złoto głównie za gwiazdki:** na levelu 1 za 1 gwiazdkę 40, za 2 gwiazdki 75, za 3 gwiazdki 100, wyższe levele płacą więcej.
  Liczy się najlepszy wynik gry: powtórka daje złoto tylko za nowe gwiazdki i lepszą skrzynię (i trochę za dobre odpowiedzi).
  Za dobre odpowiedzi w grze jest teraz mniej złota (1–4 zamiast 5).
- **Siła wrogów i potworów nie zależy już od tego, co dziecko kupiło.** Jest ustawiona pod gracza, który zebrał
  około 80% złota. Kto ma mniej, ma trudniej; kto ma więcej, łatwiej. Same dobre odpowiedzi zawsze wygrywają.
- **Następny level otwiera się dopiero po przejściu wszystkich 40 gier poprzedniego.** Levele zaczęte wcześniej zostają otwarte.
- Złoto za gwiazdki zdobyte przed tą wersją doliczyło się raz, według nowych stawek. Kupione ulepszenia zostały
  („Siła ognia” to teraz „Szybkie strzelanie”).
- Wrogów jest około 4 razy więcej niż w wersji 13, w kilku falach na każdym odcinku. Strzały przechodzą przez kilku wrogów,
  armia strzela szybciej, a nagrody w późniejszych grach są większe.
- Pocisk trafia wszystkich wrogów na swojej drodze w jednej chwili, więc gra działa tak samo na szybkim i wolnym telefonie.
- Kula ognia po złej odpowiedzi w walce zabiera co najmniej 15% armii, żeby walka wymagała dobrych odpowiedzi także dużą armią.
- Siła potwora jest liczona w tle, gdy widać kartę przed grą i w czasie biegu, więc gra nie przycina przy starcie.

### Usunięte
- Dziura w drodze (zastąpiona płonącym autobusem i TIR-em).
- Dopasowywanie siły potwora do kupionych ulepszeń.

### Do sprawdzenia
- Płynność na starszych telefonach przy wielu ulepszeniach naraz (w testach na komputerze bez karty graficznej:
  53 klatki na sekundę zamiast 59).

---

## Wersja 13 (20 października 2026)

Zapis w repozytorium: `9098b43`

### Dodane
- **Nowy porządek po każdej bramce:** za dobrą bramką nagroda, po chwili wrogowie i przeszkody, a dopiero gdy wrogowie znikną,
  następne zadanie z pełnym czasem na liczenie (zawsze co najmniej 6,8 sekundy). Do tego czasu na bramce są znaki zapytania.
- **Nowi wrogowie:** mrówki (szybkie, w gromadach), osy (latają zygzakiem), węże (2 trafienia) i klauny (3 trafienia,
  zabierają po 2 żołnierzy), każdy także w dużej wersji. Nowe rodzaje dochodzą w kolejnych grach.
- **Przeszkody na drodze:** dziura w nawierzchni, młot spadający z góry i płonące beczki. Beczki da się zestrzelić,
  a ich wybuch pali wrogów obok.
- **Wróg, który minie armię, też zabiera żołnierzy.**
- **Ćwiczenie po błędzie z paskiem:** spokojna muzyka, bez odliczania czasu. Dobra odpowiedź przesuwa pasek o pole w prawo,
  zła o pole w lewo. 3 dobre: grasz dalej. 3 złe: koniec gry z napisem „Chyba śmierdzi Ci spod pachy!”.

### Zmienione
- **Podpowiedzi nie podają gotowego wyniku:** pokazują sposób liczenia, a ostatni wynik zostawiają jako „?”.
  Sprawdzone automatycznie na 48 000 zadań. Po pomyłce (przy włączonej nauce) gra nie pokazuje od razu dobrej odpowiedzi.
- **Bez nauki na pamięć:** zadania nie powtarzają się w jednej grze, a gra omija też zadania z dwóch poprzednich gier
  tego samego poziomu. Powtórki z poprzedniej gry spadły z około 15% do około 5%.
- Większe pule zadań: Pitagoras, liczby rzymskie, objętość sześcianu, prawdopodobieństwo, kwadraty i sześciany, potęgi,
  ułamki okresowe i zaokrąglanie, osie symetrii, procenty w praktyce, pieniądze, obwody, koło, dzielenie, jednostki.
- Skrzynie z bronią, klatki i mosty stoją teraz za dobrą bramką, a nie przypadkiem za złą.
- Wrogów jest o około 30% więcej. Duże wersje pojawiają się od 9. gry (wcześniej od 11.).
- Instrukcja w menu opisuje nowy przebieg gry.

### Usunięte
- Stare ćwiczenie po błędzie (2 zadania, pokazywanie dobrej odpowiedzi po pomyłce).

### Do sprawdzenia
- Liczby rzymskie do XII i sześciany liczb nadal czasem się powtarzają, bo w programie szkolnym jest ich mało.

---

## Wersja 12 (20 października 2026)

Zapis w repozytorium: `6ace705`

### Dodane
- **Nowy potwór na końcu Levelu 3: Hedwigonna**, przeniesiona z figurki zrobionej długopisem 3D: biała sowa z czarnym obrysem,
  skrzydła w kropki, pomarańczowe, przymknięte oczy, list z czerwoną pieczęcią w pazurach i niebieska deska pod łapami.
  Kołysze skrzydłami i mruga, a gdy atakuje, podnosi skrzydła i szeroko otwiera oczy. Teksty mówią o niej „pokonana”, „była silniejsza”.
- **Przycisk „Udostępnij grę” w menu** z kodem QR do gry. Drugi telefon albo tablet skanuje go aparatem, bez SMS-a i komunikatorów.
  Są też przyciski „Wyślij link” (zwykłe udostępnianie telefonu) i „Kopiuj link”. Działa również w grze dodanej do ekranu telefonu.
- **Zakładka „Kod QR”** w okienku „Dodaj grę do ekranu telefonu”, obok zakładek iPhone / iPad i Android.
- **Trzy nowe szybkie style muzyki w duchu Geometry Dash**: Turbo (taneczny, akordy „pompują” do rytmu), Neon (jak z dawnych konsol)
  i Skok (ciężki rytm z falującym basem). Każdy ma wersję do biegu i szybszą do walki, z werblem, który narasta przed refrenem.

### Zmienione
- **Muzyka jest losowana** w każdej grze spośród: Elektro, Retro, Wesoła, Chill, Turbo, Neon i Skok, nigdy ta sama dwa razy pod rząd.
  Walka z potworem ma styl swojej gry. Przycisk „Muzyka” tylko włącza i wyłącza muzykę (nie ma już wyboru stylu).
- Okienko „Dodaj grę do ekranu telefonu” na iPhonie pokazuje kroki jak w Safari w iOS 26: „Udostępnij” na górze menu,
  „Do ekranu głównego” (czasem po „Pokaż więcej”) i przełącznik „Otwórz jako aplikację www”.
- To samo okienko na Androidzie zaczyna od ikony „Zainstaluj” na pasku adresu Chrome (ekran ze strzałką w dół, obok gwiazdki),
  a potem okienka „Zainstaluj aplikację”, jak na prawdziwym telefonie.
- Okienko pokazuje się też na dużych tabletach z Androidem, na których Chrome udaje komputer.

### Usunięte
- Potwór Ropuchor z Levelu 3 (zastąpiła go Hedwigonna).
- Styl muzyki Przygoda (nie ma go w losowaniu; da się go przywrócić z wcześniejszego zapisu).
- Przycisk z kodem QR na komputerze, który był tylko w wersji testowej: zastąpiło go „Udostępnij grę”.

### Do sprawdzenia
- Przycisk „Wyślij link” widać tylko w przeglądarkach, które umieją udostępniać (telefony); w przeglądarce testowej na komputerze go nie ma.

---

## Wersja 11 (20 października 2026)

Zapis w repozytorium: `81a16e9`

### Dodane
- **Nowy potwór na końcu Levelu 2: Artur Pająkojad**, przeniesiony z rysunku kredą, który tata narysował kiedyś synowi na tablicy.
  Ma głowę w kształcie cytryny, rogi, czułki z kuleczkami, oczy w spiralki, duży nos, ogromny uśmiech z zębami zygzakiem
  i rządek krótkich różowych nóżek. Jest czarny jak tablica i obrysowany jasną linią jak kredą.
  - Nóżki cały czas przebierają, czułki się kołyszą, a spiralki w oczach się kręcą. Gdy Artur atakuje, otwiera paszczę szerzej
    i spiralki kręcą się szybciej.

### Zmienione
- Nic poza potworem.

### Usunięte
- Potwór Kudłacz z Levelu 2 (zastąpił go Artur Pająkojad).

---

## Wersja 10 (20 października 2026)

Zapis w repozytorium: `cb2cceb`

### Dodane
- **Żart przy przegranej**, wymyślony przez dzieci: gdy wojsko przegra, słychać „buuuuu”, ekran zalewa zielona mgła,
  a na środku wyskakuje chwiejący się napis **„Śmierdzi Ci spod pachy!!!”** i lecą chmurki 💨 🤢.
  Ten sam napis jest w tytule karty z wynikiem.
- Na telefonach z wyłączonymi animacjami napis po prostu się pojawia, bez ruchu i bez chmurek.

### Zmienione
- „Buuuu” słychać teraz **tylko przy przegranej**. Wcześniej potwór jęczał „buuu” także wtedy, gdy przegrał z nami.
- Po przegranej karta z wynikiem pojawia się po 3 sekundach zamiast po 2, żeby zdążyć przeczytać żart.

### Usunięte
- Dawna smutna melodyjka przy przegranej (zastąpiło ją „buuuu”).

---

## Wersja 9 (20 października 2026)

Zapis w repozytorium: `d856fa1`

### Dodane
- **Okienko „Dodaj grę do ekranu telefonu”** z obrazkową instrukcją krok po kroku, osobno dla iPhone'a/iPada i dla Androida.
  - Pojawia się przy każdym uruchomieniu gry w przeglądarce telefonu. Nie pojawia się, gdy gra jest już uruchomiona z ikony
    na ekranie telefonu, ani na komputerze. Można je zamknąć krzyżykiem albo przyciskiem „Teraz graj w przeglądarce”.
  - iPhone: instrukcja pasuje też do nowego Safari w iOS 26, gdzie przycisk „Udostępnij” jest schowany pod trzema kropkami.
  - Android: jeśli telefon na to pozwala, jest przycisk **„Zainstaluj grę”**, który od razu otwiera okno instalacji.
  - Gdy link otworzy się w komunikatorze (Messenger, Facebook, Instagram, TikTok itp.), okienko podpowiada,
    jak otworzyć grę w Safari albo Chrome, i ma przycisk „Kopiuj link do gry”. Z komunikatora nie da się dodać gry do ekranu.
- W menu przycisk „Jak dodać grę do ekranu telefonu”, który otwiera to okienko jeszcze raz.
- **Gra działa bez internetu**, jeśli była już wcześniej otwarta na tym telefonie. Z internetem zawsze pobiera najnowszą wersję.
- Ikona 192 × 192, której Android potrzebuje do instalacji.

### Zmienione
- Nic.

### Usunięte
- Nic.

### Do sprawdzenia
- Na prawdziwych telefonach: czy na Androidzie pojawia się przycisk „Zainstaluj grę” i czy napisy w menu przeglądarki zgadzają się z instrukcją
  (różne telefony i wersje Chrome mają trochę inne nazwy, np. „Dodaj do ekranu głównego” albo „Zainstaluj aplikację”).

---

## Wersja 8 (20 października 2026)

Zapis w repozytorium: `ae8ed79`

### Dodane
- **7 światów** zamiast samego mostu: Most nad morzem, Las, Kanion, Śnieżne góry, Wulkan, Miasto nocą i Kosmos.
  Każdy temat w levelu to inny świat. Młodsze levele mają więcej jasnych światów, starsze więcej miasta nocą, wulkanu i kosmosu.
  - Każdy świat ma swoje niebo, krajobraz na horyzoncie, ziemię, drogę i barierki.
  - Przy drodze stoją drzewa, choinki ze śniegiem, kaktusy, skały i bloki z oknami, a w kosmosie unoszą się asteroidy.
  - W górach pada śnieg, przy wulkanie lecą iskry i płynie lawa, w mieście świecą latarnie, w kosmosie świecą neony.
  - Dziura w zepsutym moście wygląda w każdym świecie inaczej, np. przy wulkanie to lawa.
  - Nazwa świata jest na karcie przed grą, a w menu w tle widać świat następnej gry.
- **Muzyka z prawdziwymi instrumentami** w 4 stylach, każdy w wersji do biegu i do walki:
  - **Wesoła:** marimba, flet, gitara;
  - **Przygoda:** smyczki, waltornia, harfa, kotły, trąbka i bębny taiko;
  - **Chill:** elektryczne pianino, wibrafon, spokojna perkusja;
  - **Elektro:** syntezatory w stylu lat 80.
  - Do tego **Retro**, czyli dawne melodie tworzone przez samą grę.
- **Wybór muzyki:** przycisk „Muzyka” w menu i w pauzie zmienia styl: Auto → Wesoła → Przygoda → Chill → Elektro → Retro → wył.
  Przy „Auto” levele 1–3 mają Wesołą, 4–6 Przygodę, 7–8 Elektro.
- Program `narzedzia/muzyka.py`, który tworzy utwory: nuty są zapisane w kodzie, a program gra je instrumentami
  z zestawu FluidR3_GM (licencja MIT) i zapisuje pętle MP3 do folderu `muzyka/`.

### Zmienione
- Napisy „na końcu mostu” zmieniły się na „na końcu drogi”, bo nie każdy świat ma most.
- Muzyka jest cichsza od efektów dźwiękowych, żeby nie przeszkadzała w liczeniu.

### Usunięte
- Nic. Dawne melodie zostały jako styl „Retro”. Gra używa ich też wtedy, gdy nie da się wczytać plików muzyki (np. bez internetu).

### Do sprawdzenia
- Jak brzmi muzyka. Nie mogłem jej posłuchać. Sprawdziłem pomiarami, że pętle łączą się płynnie i że utwory mają równą głośność.
- Czy na prawdziwym iPhonie gra działa płynnie w mieście i w kosmosie (w przeglądarce testowej około 60 klatek na sekundę we wszystkich światach).

---

## Wersja 7 (20 października 2026)

Zapis w repozytorium: `1ad8f06`

### Dodane
- **Zombie.** Zamiast czerwonej armii na armię idą hordy zombie. Od 11. gry w każdym levelu w hordach chodzą też duże zombie.
  Mają więcej życia (liczba nad głową), a gdy dojdą do armii, zabierają kilku żołnierzy.
- **Rzeczy do zestrzelenia** między bramkami. Każda ma liczbę: tyle trafień potrzeba. Armię trzeba podprowadzić na tę stronę drogi.
  - **Klatka z jeńcami:** po rozbiciu jeńcy dołączają do armii.
  - **Skrzynia z bronią:** daje lepszą broń do końca gry: Blaster → Turboblaster → Plazma → Działko → Laser.
    Każda broń strzela inaczej i ma inny kolor strzałów.
  - **Zepsuty most** (od 4. gry): każde trafienie kładzie deskę. Naprawiony daje moc do końca gry: **Olbrzymy** (więksi żołnierze, mocniejsze strzały)
    albo **Szybki ogień**. Kto wbiegnie w dziurę, traci kilku żołnierzy.
  - Wbiegnięcie w klatkę albo skrzynię, zanim się ją zestrzeli, kosztuje kilku żołnierzy.
- **Złoto.** Za dobrą odpowiedź na bramce albo w walce +5, za dobrze rozwiązane zadanie po błędzie +3, za duże zombie +2,
  za każdą gwiazdkę na koniec gry +10. Złoto zdobyte w grze zostaje także po przegranej. Licznik złota jest w prawym górnym rogu.
- **Zbrojownia** (w menu i po grze). Ulepszenia na stałe: broń na start, więcej żołnierzy na start, szybsze strzelanie.
  Do tego 6 kolorów armii do wyboru. Ceny są z góry znane. Nic się nie losuje i nic nie kupuje się za prawdziwe pieniądze.
- Nad armią widać, jaką ma broń i moce.
- Nowe dźwięki: jęk hordy zombie, rozbita klatka, nowa broń lub moc, plusk w dziurze w moście.

### Zmienione
- **W biegu armia nigdy nie traci ostatniego żołnierza.** Zawsze dochodzi do potwora, a o wygranej decyduje walka.
- **Siła potwora** jest liczona tak jak wcześniej, ale z uwzględnieniem skrzyń, klatek i mostu.
  Według symulacji (tysiące gier we wszystkich levelach), gdy gracz celuje w skrzynie:
  - wszystkie odpowiedzi w walce dobre: wygrana zawsze;
  - wszystkie bramki dobrze, a w walce zgadywanie: wygrana w około 38% gier;
  - po kupieniu połowy ulepszeń w Zbrojowni około 58%, po kupieniu wszystkich około 68%. Ulepszenia pomagają, ale nie zastąpią liczenia.
- **Więcej czasu na odpowiedź w levelach 1–3** (np. w levelu 1 około 9,9 s na początku zamiast 7,7 s). Najmłodsi czytają najwolniej.
  Armia biegnie tam trochę wolniej.
- **Po złej odpowiedzi w ćwiczeniu** gra pisze spokojnie „Prawie!”, pokazuje dobrą odpowiedź i sposób liczenia.
  Za dobrą odpowiedź w ćwiczeniu jest +3 złota.
- „Uuuuu” słychać teraz, gdy pokonany potwór pada, a nie po błędzie dziecka.
- Hordy zombie są o 80% liczniejsze niż wcześniejsze oddziały wroga, a zombie są trochę większe, żeby było je lepiej widać.
- Strzały lecą dalej, a armia strzela trochę szybciej.

### Usunięte
- Czerwona armia wroga i beczki z nagrodą (zastąpiły je zombie, klatki i skrzynie).
- Kciuki w dół lecące po złej odpowiedzi w ćwiczeniu.
- Licznik dobrych odpowiedzi w prawym górnym rogu (jest tam teraz złoto; dobre odpowiedzi widać na końcu gry).

### Do sprawdzenia
- Czy na prawdziwym iPhonie gra działa płynnie przy dużej armii i wielu zombie.
- Czy dzieci rozumieją, że w skrzynie i klatki trzeba celować (bez tego walka z potworem jest dużo trudniejsza).

---

## Wersja 6 (20 października 2026)

Zapis w repozytorium: `5ffe7d3`

### Zmienione
- **Nowa nazwa gry: Śmierdzipacha.** Wybrały ją dzieci. Widać ją w menu, w tytule strony i pod ikoną na ekranie telefonu.
- **Polskie litery w dużych napisach wyglądają tak samo jak reszta.** Czcionka gry nie ma liter ą, ć, ę, ń, ś, ź, ż,
  dlatego wcześniej np. „ę” w „grę” miało inny kształt. Teraz te litery pochodzą z bardzo podobnej czcionki (Paytone One).
  Bez tego pierwsza litera nazwy, „Ś”, wyglądałaby krzywo.
- Zapisane gwiazdki i otwarte gry zostają.

### Dodane
- Nic.

### Usunięte
- Nic.

---

## Wersja 5 (20 października 2026)

Zapis w repozytorium: `6984ae0`

### Zmienione
- **Nowa nazwa gry: Głupia Gra** (wcześniej Armia Liczb). Widać ją w menu, w tytule strony i pod ikoną na ekranie telefonu.
- **Klasy nazywają się teraz levelami.** Level 1 to 1. klasa, level 8 to 8. klasa. Zadania są takie same jak wcześniej.
  Przy wyborze levelu widać, której klasie odpowiada, np. „1. klasa · Liczby do 20, porównywanie, pieniądze”.
- Sprawdzian na końcu nazywa się „Sprawdzian: level 1” (i tak dalej).
- Zapisane gwiazdki i otwarte gry zostają, bo zapis w telefonie się nie zmienił.

### Dodane
- Nic.

### Usunięte
- Nic.

---

## Wersja 4 (20 października 2026)

Zapis w repozytorium: `d0fe679`

### Dodane
- **Nauka po błędzie.** Po złej odpowiedzi gra się zatrzymuje i pokazuje krok po kroku, jak to łatwo policzyć w pamięci.
  Dotyczy to bramek i walki, także sytuacji, gdy zabraknie czasu.
  Przykład: 40% z 280. Najpierw 10% z 280 to 280 : 10 = 28. 40% to 4 razy po 10%, czyli 4 · 28 = 112.
- Po objaśnieniu są **2 zadania tego samego rodzaju**. Dobra odpowiedź: „Dobrze!”. Po dwóch dobrych gra toczy się dalej.
- Zła odpowiedź w ćwiczeniu: **lecą kciuki w dół 👎 i słychać „uuuuu”**. Gra pokazuje, jak policzyć to zadanie, i daje następne.
  Najwyżej 5 zadań. Jeśli dalej nie wychodzi, gra wraca do biegu z radą, żeby ten temat jeszcze poćwiczyć.
- Objaśnienia do wszystkich rodzajów zadań w klasach 1–8.
- Przełącznik **„Nauka po błędzie: wł./wył.”** w menu i w pauzie.
- W menu czwarta wskazówka: po pomyłce gra pokaże, jak to policzyć.

### Zmienione
- Podczas nauki gra stoi: czas nie ucieka, a potwór nie atakuje. Ćwiczenia nie zmieniają liczby żołnierzy.
  Szanse w walce są takie same jak w wersji 3 (symulacja: około 33% przy wszystkich bramkach dobrze i zgadywaniu w walce).
- Klasa 7, wyrażenia algebraiczne: zamiast „1x” jest teraz „x”, tak jak w zeszycie (np. 6x + 5x − x).
- Klasa 7, twierdzenie Pitagorasa, najłatwiejsza gra: 3 różne trójkąty zamiast 2, żeby było z czego ćwiczyć.
- Klasa 6, równania: liczba ujemna po prawej stronie miała krótki myślnik zamiast minusa (np. „-2”). Teraz jest „−2”.
- Klasa 8, nierówności: rozwiązanie po błędzie zapisuje się „x + 8 > 3, więc x > −5”. Wcześniej było niezgrabne „x = x > −5”.
- Sprawdzanie zadań rozszerzone. Osobny program przelicza teraz także każdy krok objaśnień.
  Wynik: ponad 200 000 obliczeń w objaśnieniach i 256 000 zadań, zero błędów.

### Usunięte
- Nic.

### Do sprawdzenia
- Jak brzmi „uuuuu” i jak wyglądają kciuki na prawdziwym iPhonie.
- Czy objaśnienia są zrozumiałe dla młodszych dzieci. Najlepiej przejrzeć kilka razem z dzieckiem.

---

## Wersja 3 (20 października 2026)

Zapis w repozytorium: `dde3488`

### Zmienione
- **Walka z potworem idzie w rundach.** Każda odpowiedź to jedna runda: najpierw posiłki (po dobrej odpowiedzi), potem strzał armii, a na końcu cios potwora. Po złej albo spóźnionej odpowiedzi potwór dorzuca kulę ognia.
- **Szybkość odpowiedzi nie ma już znaczenia**, liczy się tylko to, czy jest dobra (i czy zmieści się w czasie).
  Powód: w wersji 2 potwór atakował co ok. 2 sekundy bez względu na odpowiedzi. Kto liczył spokojnie, mógł przegrać mimo samych dobrych odpowiedzi. Zgłoszony przypadek: klasa 6, gra 1, 11 dobrych odpowiedzi na 11, a mimo to przegrana. W symulacji takie przegrane zdarzały się w 14–25% gier przy odpowiedziach po 8–10 s.
- **Same dobre odpowiedzi w walce zawsze dają wygraną.** Cios potwora nigdy nie zabiera więcej żołnierzy, niż daje dobra odpowiedź.
- Siła potwora dobrana na nowo. Przy wszystkich bramkach dobrze i zgadywaniu w walce wygrywa się średnio w 32% gier (symulacja 4000 gier we wszystkich klasach).

### Dodane
- Liczba obrażeń nad paskiem życia potwora po każdym strzale armii (np. −101) i dźwięk trafienia.
- Na początku walki wyjaśnienie: „Każda odpowiedź to runda: armia strzela, potem atakuje potwór”.

### Usunięte
- Ciągłe strzelanie do potwora i jego ataki co kilka sekund, niezależne od odpowiedzi.

---

## Wersja 2 (20 października 2026)

Zapis w repozytorium: `ca6c2ff`

### Dodane
- **8 klas po 40 gier (razem 320 gier).** Każda klasa ma 8 tematów zgodnych z programem nauczania tej klasy. Każdy temat to 4 gry coraz trudniejsze i jedna powtórka. Gra 40 to sprawdzian z całej klasy.
- **Tematy, których nie było:** liczby rzymskie, pieniądze, obwody figur, jednostki (m, cm, kg, dag, h, min), połowa i ćwierć, dzielenie z resztą, NWD i NWW, skracanie ułamków, kąty w trójkącie, pola figur, ułamki okresowe i zaokrąglanie, prędkość, droga i czas, objętość, notacja wykładnicza, układ współrzędnych, nierówności, średnia i mediana, prawdopodobieństwo, symetria, graniastosłupy i ostrosłupy, koło i okrąg.
- **Potwór na końcu mostu** z paskiem życia. W każdej klasie jest inny: Glutek, Kudłacz, Ropuchor, Głazor, Płomyk, Lodowiec, Trójoki, Liczożerca.
- **Zadania w trakcie walki** z dwoma dużymi przyciskami. Dobra odpowiedź to posiłki, zła albo spóźniona to atak potwora.
- **Różne nagrody za bramki**, np. +14. Liczba jest widoczna nad bramką i na karcie z zadaniem.
- **Muzyka:** osobny utwór do menu, do biegu i do walki. Do tego nowe efekty: ryk i tupnięcie potwora, kula ognia, posiłki.
- Osobne włączniki **muzyki** i **dźwięków** (w menu i w pauzie).
- Sposób na dźwięk przy wyciszonym iPhonie. **Nie sprawdzono jeszcze na prawdziwym telefonie.**
- **Ułamki zapisane piętrowo**, jak w zeszycie, także liczby mieszane (np. 1 i 3/16).
- **Wybór klasy** zakładkami 1–8, a pod nimi gry pogrupowane według tematów. Powtórki są oznaczone na niebiesko.
- Numer wersji na dole menu.

### Zmienione
- **Więcej wrogów** między bramkami: oddział między każdymi bramkami, od 21. gry po dwa. Ich liczba rośnie z każdą grą.
- **Siła potwora** jest liczona osobno dla każdej gry. Przy wszystkich bramkach dobrze i zgadywaniu w walce wygrywa się średnio w 31% gier. Przy wszystkich odpowiedziach dobrych wygrywa się zawsze. Sprawdzono to symulacją tysięcy gier.
- Przydział tematów do klas oparto na podstawie programowej (2017, ze zmianami z 2024) i podręcznikach „Matematyka z plusem” oraz „Matematyka z kluczem”.
- Lista „Do powtórki” pokazuje ułamki piętrowo i informację „Za późno”, gdy zabrakło czasu w walce.
- Gra podzielona na trzy pliki: wygląd (`index.html`), zadania (`zadania.js`) i silnik gry (`gra.js`).
- Wszystkie rodzaje zadań sprawdzono automatycznie. 640 000 wylosowanych zadań, zero błędów.

### Usunięte
- **4 światy po 10 poziomów** (5–7 lat, 8–10 lat, 11–14 lat, dorośli). Zastąpiły je klasy 1–8.
- **Zadania dla dorosłych spoza szkoły podstawowej**, np. mnożenie dwucyfrowe w pamięci, dodawanie liczb czterocyfrowych w pamięci, długie działania z potęgami.
- **Stała nagroda +20 / −20.**
- **Czerwona armia z kapitanem na końcu mostu.** Zastąpił ją potwór.
- Prawdopodobieństwo przy rzucie dwiema kostkami lub dwiema monetami (usunięte z podstawy programowej w 2024).
- Jeden wspólny przycisk „Dźwięk” (teraz są dwa osobne).
- Zapis postępu z wersji 1 (gwiazdki liczą się od nowa, bo gry są inne).

### Do sprawdzenia
- Czy na iPhonie słychać muzykę, także przy wyciszonym telefonie.
- Od 1 września 2026 w klasach 1 i 4 obowiązuje nowa podstawa programowa. Tematy tych klas nie są jeszcze do niej dopasowane.

---

## Wersja 1 (20 października 2026)

Zapis w repozytorium: `64a4bae`

Pierwsza grywalna wersja.

### Dodane
- Bieg po moście. Armię przesuwa się palcem w lewo i w prawo.
- Przed bramkami pojawia się działanie, a na dwóch bramkach dwie odpowiedzi. Dobra daje +20 żołnierzy, zła zabiera 20.
- 40 poziomów w 4 światach: 5–7 lat, 8–10 lat, 11–14 lat i dorośli.
- Oddziały wroga po drodze, beczki z nagrodą, armia wroga na końcu mostu.
- Gwiazdki za wynik i lista „Do powtórki” z błędami.
- Proste dźwięki (bez muzyki).
- Ikona i możliwość dodania gry do ekranu początkowego iPhone'a.
