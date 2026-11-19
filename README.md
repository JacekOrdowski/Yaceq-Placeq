# Śmierdzipacha

Gra na telefon z matematyką ze szkoły podstawowej, od 1. do 8. klasy. Nazwę wybrały dzieci.
Wcześniej gra nazywała się „Armia Liczb” (wersje 1–4) i „Głupia Gra” (wersja 5).

W folderze `wersja-robocza` powstaje osobna, nowa gra (obrona bazy przed meteorami), opisana w `wersja-robocza/ZMIANY.md`.
W folderze `survival` jest trzecia gra, **Yaceq Survival** (zbieranie jagód kamczackich i budowa zimowego obozu, 3D),
opisana w `survival/ZMIANY.md`: https://jacekordowski.github.io/Yaceq-Placeq/survival/
W folderze `age` jest czwarta gra, **Age of Yaceq** (budowanie miasta gdzie chcesz i kolejne ery w ratuszu),
opisana w `age/ZMIANY.md`: https://jacekordowski.github.io/Yaceq-Placeq/age/
W menu każdej gry jest przycisk „Inne gry” (wspólny plik `gry.js`).

Armia biegnie przez różne światy. Przed każdą bramką pojawia się działanie, a na bramkach dwie odpowiedzi.
Wbiegasz w bramkę z dobrym wynikiem i dostajesz tylu żołnierzy, ile pokazuje zielona liczba (na przykład +14).
Zła odpowiedź zabiera tyle samo. Strona dobrej bramki jest losowana przy każdej bramce, a zadania nie powtarzają się
w jednej grze i w dwóch poprzednich grach tego samego poziomu, więc gry nie da się nauczyć na pamięć.

Po każdej bramce jest stały porządek:

1. Za dobrą bramką czeka nagroda do zestrzelenia (liczba mówi, ile trafień potrzeba):
   - **klatka z jeńcami:** po rozbiciu jeńcy dołączają do armii,
   - **skrzynia z bronią:** lepsza broń do końca gry (Blaster, Turboblaster, Plazma, Działko, Laser),
   - **zepsuty most:** każde trafienie kładzie deskę, a naprawiony daje moc: Olbrzymy albo Szybki ogień.
2. Po chwili wyskakują wrogowie i pojawiają się przeszkody. Wrogowie różnią się trudnością: zombie, mrówki (szybkie, w gromadach),
   osy (latają zygzakiem), węże (2 trafienia) i klauny (3 trafienia, zabierają po 2 żołnierzy). Od 9. gry gromadę może prowadzić
   duża wersja wroga. Nowe rodzaje dochodzą w kolejnych grach. Wróg, który minie armię, też zabiera żołnierzy.
   Przeszkody: płonący autobus albo TIR na połowie drogi, młot spadający z góry i płonące beczki (beczki da się zestrzelić).
3. Dopiero gdy wrogowie znikną, pojawia się następne zadanie, z pełnym czasem na liczenie.

W biegu armia nigdy nie traci ostatniego żołnierza, więc zawsze dochodzi do potwora.

Na końcu drogi walczysz z potworem. Walka idzie w rundach: na dole ekranu pojawia się zadanie,
a każda odpowiedź to jedna runda. Dobra odpowiedź przynosi posiłki, potem armia strzela, a na końcu potwór oddaje cios.
Zła albo spóźniona odpowiedź: nie ma posiłków, a potwór dorzuca kulę ognia, która zabiera co najmniej 15% armii
(więc duża armia też ją czuje). Szybkość odpowiedzi nie ma znaczenia, liczy się tylko to, czy jest dobra (i czy zmieści się w czasie).

## Skrzynia po potworze

Po pokonaniu potwora jest skrzynia: 5 zadań i jeden pasek czasu, który leci cały czas (także podczas odpowiedzi).
Każda dobra odpowiedź to punkt, a skończenie przed znakiem ⚡ (zostało co najmniej 35% paska) to jeszcze jeden punkt.
6 punktów: skrzynia diamentowa, 5: złota, 3–4: srebrna, mniej: drewniana. Skrzynia poprawia się na oczach dziecka.
W środku jest złoto (liczy się najlepsza skrzynia w danej grze, jak przy gwiazdkach) i ulepszenia ze Zbrojowni
tylko na następną grę: drewniana 1, srebrna 2, złota 2 (jedno o dwa poziomy), diamentowa 2 (oba o dwa poziomy).
Częściej trafiają się ulepszenia jeszcze niekupione, żeby można je było wypróbować przed zakupem.

## Nauka po błędzie

Po złej odpowiedzi gra się zatrzymuje, włącza spokojną muzykę i pokazuje podpowiedź: sposób liczenia,
w którym ostatni wynik jest zostawiony jako „?”. Gotowej odpowiedzi podpowiedź nie podaje.
Potem jest ćwiczenie: przez pierwsze 20 sekund każdego zadania bez pośpiechu, potem pojawia się napis „Ale bez przesady”
i pasek czasu jak w zwykłej grze (gdy się skończy, liczy się to jak zła odpowiedź). Na środku jest pasek odpowiedzi: dobra odpowiedź przesuwa go o jedno pole w prawo (zielone),
zła o jedno pole w lewo (czerwone). Trzy pola w prawo: gra toczy się dalej. Trzy pola w lewo: koniec gry
z napisem „Chyba śmierdzi Ci spod pachy!”. Po złej odpowiedzi jest podpowiedź do tego zadania i nowe zadanie.
Za każde dobrze rozwiązane zadanie jest trochę złota, tyle co za dobrą bramkę.

## Złoto i Zbrojownia

Złoto jest głównie za gwiazdki. Na levelu 1: 1 gwiazdka 40, 2 gwiazdki 75, 3 gwiazdki 100 złota; każdy wyższy level
płaci o jedną czwartą więcej (level 8: 110, 205, 275). Do tego skrzynia po potworze (na levelu 1: drewniana 15, srebrna 35,
złota 50, diamentowa 70) i trochę za każdą dobrą odpowiedź (1 na levelach 1–2, 2 na 3–4, 3 na 5–6, 4 na 7–8)
i za każdego dużego wroga. Liczy się najlepszy wynik każdej gry: powtórka daje złoto tylko za nowe gwiazdki
i lepszą skrzynię (i za dobre odpowiedzi). Gra na próbę nie daje nic.

W Zbrojowni kupuje się ulepszenia na stałe, jak w grze Archero. Nowe otwierają się na kolejnych levelach:

| Ulepszenie | Od levelu | Co robi |
|---|---|---|
| Żołnierze na start | 1 | +3 żołnierzy na start za każdy poziom (8 poziomów) |
| Szybkie strzelanie | 1 | +6% szybsze strzelanie za każdy poziom (8 poziomów) |
| Broń na start | 1 | gra zaczyna się z Turboblasterem albo Plazmą |
| Dodatkowa lufa | 1 | 2, potem 3 pociski obok siebie (serie są trochę rzadsze) |
| Pociski przeszywające | 1 | każdy pocisk trafia o 1, 2 albo 3 wrogów więcej |
| Podwójny strzał | 2 | druga seria tuż za pierwszą w 20%, 35% albo 50% strzałów |
| Ogniste pociski | 2 | trafiony wróg płonie przez 2,5 s; potwór dostaje 10–25% więcej |
| Mrożące pociski | 3 | trafiony wróg zwalnia, 10–30% zamarza; zamrożony rozbija się o armię bez strat; potwór uderza 12–30% słabiej |
| Boczne lufy | 3 | dwa pociski pod kątem do przodu w 25% albo 50% strzałów |
| Odbijanie od ścian | 4 | pociski z bocznych luf odbijają się od brzegu drogi 1 albo 2 razy (najpierw trzeba kupić boczne lufy) |
| Zatrute pociski | 4 | trucizna przez 6 s, kolejne trafienia ją wzmacniają (do 2, 3 albo 4 razy); potwór dostaje 10–25% więcej |
| Działo elektryczne | 5 | co 2, 1,6 albo 1,3 s piorun skacze po 3, 4 albo 5 wrogach; potwór dostaje 8–20% więcej |
| Wybuchający wrogowie | 6 | pokonany wróg wybucha w 12%, 20% albo 30% przypadków i rani sąsiadów; duzi wybuchają zawsze |

Ceny rosną z każdym poziomem (od 50 do 9500 złota). Ktoś, kto zbiera około 80% złota, kupuje coś nowego na każdym levelu
i ma prawie wszystko pod koniec levelu 8; kto zbiera wszystko, kupuje wszystko. Przycisk „Kup polecane ulepszenia”
kupuje po kolei najtańsze, dopóki starcza złota. Kolor armii też kupuje się za złoto.
Ceny są znane z góry. Nic się nie kupuje za prawdziwe pieniądze i nie ma reklam.
Naukę można wyłączyć w menu albo w pauzie: „Nauka po błędzie: wył.”.

## Jak trudni są wrogowie i potwór

Siła wrogów i potworów nie zależy od tego, co dziecko kupiło. Jest ustawiona pod gracza, który zebrał około 80% złota
i wydał je w Zbrojowni: taki gracz traci na wrogów tyle żołnierzy, ile armia bez ulepszeń w pierwszych grach.
Siłę wrogów mierzy program `narzedzia/balans.js` (tabela w `gra.js`), a siłę potwora gra liczy sama dla każdej gry
z próbnych przejść trasy. Według symulacji (po kilkaset gier na każdy przypadek):

| Kto gra | Wygrane |
|---|---|
| wszystkie odpowiedzi dobre, dowolne złoto | zawsze (armia w biegu nie traci ostatniego żołnierza, a w walce dobra odpowiedź daje więcej, niż zabiera cios) |
| 80% złota, bramki dobrze, w walce na chybił trafił | około 52% |
| 85% dobrych bramek, 75% dobrych odpowiedzi w walce, 100% złota | około 83% |
| to samo, 80% złota | około 81% (podobnie na każdym levelu) |
| to samo, 50% złota | około 51% |
| to samo, 30% złota | około 39% (na levelach 4–8 dużo mniej) |

Kto ma mało złota, idzie dalej z trudem i opłaca mu się poprawić gwiazdki we wcześniejszych grach.

## Levele i gry

8 leveli, a każdy level to jedna klasa: level 1 to 1. klasa, level 8 to 8. klasa.
W każdym levelu jest 40 gier (razem 320) i 8 tematów. Każdy temat to 4 gry o rosnącej trudności i jedna powtórka.
Gra 40 to sprawdzian z całego levelu. W levelu gry otwierają się po kolei, po wygranej. Następny level otwiera się,
gdy przejdzie się wszystkie 40 gier poprzedniego (levele zaczęte przed wersją 14 zostają otwarte).
Do każdego levelu można zajrzeć w **grze na próbę**: 6 bramek z zadaniami po trochu ze wszystkich
tematów levelu (stopnie 1–3) i ulepszenia ustawione jak u gracza w połowie tego levelu. Gra na próbę nie daje złota,
gwiazdek ani skrzyni.

W zamkniętym levelu gra na próbę jest **egzaminem**: kto wygra ją bez ani jednego błędu (3 gwiazdki), otwiera ten level
razem ze wszystkimi niższymi i dostaje złoto na start.

Przy pierwszym uruchomieniu gra pyta: **„Jak chcesz grać?”**
- **Od początku:** wszystkie levele po kolei, od levelu 1.
- **Selekcja na najemnika:** etapy od levelu 1 w górę, po 5 zadań z mieszanki tematów danego levelu, każde z czasem
  na myślenie jak w grze. 4 dobre odpowiedzi zaliczają etap i przychodzi następny. Za każdy zaliczony etap jest stopień
  (szeregowy, starszy szeregowy, kapral, plutonowy, sierżant, chorąży, porucznik, kapitan). Przydział to ostatni
  zaliczony level (a jeśli żaden, level 1); wszystkie niższe levele też są otwarte. 4 z 5, bo przy dwóch odpowiedziach
  zgadywanie trafia w połowie przypadków: przypadkowe zaliczenie etapu zdarza się mniej więcej raz na 5,
  dwóch pod rząd raz na 30.

Selekcję można zrobić też później: przycisk **„Selekcja na najemnika”** jest na górze ekranu wyboru levelu
(znika, gdy otwarte są już wszystkie levele). Nic się wtedy nie traci: otwarte levele, gwiazdki i złoto zostają.
Gdy wynik selekcji jest niższy niż to, co gracz ma już otwarte, wszystko zostaje po staremu.

Po selekcji albo zdanym egzaminie gra dopłaca złoto do tego, co ma dobry gracz (80% złota) na początku tego levelu,
żeby wrogowie nie byli za silni. Liczy się wszystko, co gracz ma: złoto, kupione ulepszenia i kolory armii,
więc kto już tyle ma, nie dostaje nic, a powtarzanie egzaminu albo selekcji niczego nie daje.

| Level (klasa) | Tematy |
|---|---|
| 1 | dodawanie i odejmowanie do 10 i do 20, z przekroczeniem progu, porównywanie liczb, okienka, pieniądze do 20 zł |
| 2 | dziesiątki, dodawanie i odejmowanie do 100, mnożenie i dzielenie do 30, okienka, pieniądze i miary, liczby rzymskie do XII |
| 3 | tabliczka mnożenia, dzielenie, liczby do 1000, mnożenie przez 10 i 2, obwody figur, jednostki, połowa i ćwierć |
| 4 | rachunki w pamięci, dzielenie z resztą, kwadraty i sześciany, kolejność działań, liczby rzymskie, działania pisemne, ułamki zwykłe i dziesiętne |
| 5 | potęgi, podzielność, liczby pierwsze, NWD i NWW, działania na ułamkach, ułamki dziesiętne, kąty i pola figur, liczby całkowite |
| 6 | ułamki zwykłe i dziesiętne razem, ułamki okresowe i zaokrąglanie, liczby całkowite, procenty, wyrażenia algebraiczne, równania, prędkość, objętość |
| 7 | procenty, potęgi, notacja wykładnicza, pierwiastki, wyrażenia algebraiczne, równania, twierdzenie Pitagorasa, układ współrzędnych |
| 8 | średnia i mediana, prawdopodobieństwo, przekształcanie wzorów, równania i proporcje, procenty w praktyce, trójkąty i symetria, graniastosłupy i ostrosłupy, koło |

Przydział tematów do klas oparto na podstawie programowej z 2017 r. (po zmianach z 2024 r.) oraz na rozkładach materiału
podręczników „Matematyka z plusem” (GWO) i „Matematyka z kluczem” (Nowa Era). Tam, gdzie oba podręczniki się różnią
(np. liczby ujemne, procenty, Pitagoras), gra idzie za jednym z nich.

Od 1 września 2026 r. w klasach 1 i 4 obowiązuje nowa podstawa programowa (rozporządzenie z 11 marca 2026 r.), w kolejnych
latach w następnych klasach. W październiku 2026 r. wszystkie tematy porównano z obiema podstawami: gra ma tylko tematy,
które są w starej albo w nowej podstawie szkoły podstawowej (nierówności, których nie ma w żadnej, zastąpiło przekształcanie
wzorów, a równania w 6. klasie mają niewiadomą tylko po jednej stronie). Podział tematów na klasy 1 i 4 trzyma się
dotychczasowych podręczników; nowych podręczników do podstawy z 2026 r. jeszcze nie porównano.

Każde zadanie losuje się na nowo. Wszystkie rodzaje zadań zostały sprawdzone automatycznie: osobny program przeliczył
ponad 600 000 wylosowanych zadań i nie znalazł błędnego wyniku ani błędnej bramki, która byłaby jednocześnie dobra.
Sprawdzone są też objaśnienia: każde obliczenie w każdym kroku (ponad 200 000 obliczeń, zero błędów).

## Światy

Każdy temat w levelu to inny świat: Most nad morzem, Las, Kanion, Śnieżne góry, Wulkan, Miasto nocą i Kosmos.
Młodsze levele mają więcej jasnych światów, starsze więcej miasta nocą, wulkanu i kosmosu.

## Dźwięk

Muzyka jest zagrana prawdziwymi brzmieniami instrumentów (zestaw FluidR3_GM, licencja MIT) i ma kilka stylów:
Wesoła, Chill, Elektro, trzy szybkie taneczne w duchu Geometry Dash (Turbo, Neon, Skok), a do tego Retro
(dawne melodie tworzone przez samą grę). Każdy styl ma wersję do biegu i do walki. Każda gra losuje styl, inny niż poprzednia.
Przycisk „Muzyka” w menu i w pauzie włącza albo wyłącza muzykę. Efekty dźwiękowe tworzy sama gra; można je wyłączyć osobno.

Utwory są w folderze `muzyka/`. Tworzy je program `narzedzia/muzyka.py`: nuty są zapisane w kodzie,
program gra je instrumentami i zapisuje pętle MP3. Bez internetu gra używa dawnych melodii.

## Jak zagrać

Gra jest w internecie pod adresem **https://jacekordowski.github.io/Yaceq-Placeq/**
(GitHub Pages; każda nowa wersja pojawia się tam sama po minucie lub dwóch).
Działa w każdej przeglądarce, na telefonie i na komputerze, bez konta i bez instalowania.

Przy każdym otwarciu w przeglądarce telefonu gra pokazuje okienko z obrazkową instrukcją, jak dodać ją do ekranu
(osobno dla iPhone'a i Androida). Po dodaniu gra otwiera się jak aplikacja i działa też bez internetu.

### Na iPhonie

Gra działa w przeglądarce Safari, bez instalowania ze sklepu.
Po otwarciu strony gry: przycisk „Udostępnij” → „Dodaj do ekranu początkowego”.
Na ekranie pojawi się ikona i gra otwiera się jak zwykła aplikacja.

Postęp (gwiazdki, otwarte gry) zapisuje się w telefonie, na którym grasz.

## Licznik odwiedzin

Strona gry ma licznik GoatCounter (bez ciasteczek i bez danych osobowych): https://smierdzipacha.goatcounter.com
(po zalogowaniu). Oprócz wejść na stronę liczy:

| Wpis | Co znaczy |
|---|---|
| `gra/level-N` | rozpoczęta gra w levelu N |
| `proba/level-N` | gra na próbę w otwartym levelu N |
| `egzamin/level-N`, `egzamin/level-N/zdany` | rozpoczęty i zdany egzamin do levelu N |
| `start/od-poczatku`, `start/selekcja-level-N` | jak nowy gracz zaczął i do którego levelu trafił z selekcji |
| `selekcja/level-N` | selekcja zrobiona później, z ekranu wyboru levelu, i jej wynik |
| `instalacja` | gra pierwszy raz otwarta z ikonki na ekranie telefonu (raz na urządzenie) |

## Pliki

- `ZMIANY.md` – historia wersji: co dodano, zmieniono i usunięto
- `index.html` – wygląd ekranów
- `zadania.js` – wszystkie zadania dla klas 1–8 i objaśnienia, jak je policzyć
- `gra.js` – sama gra: bieg, walka z potworem, grafika, muzyka
- `muzyka/` – utwory w kilku stylach (MP3), `narzedzia/muzyka.py` – program, który je tworzy
- `narzedzia/balans.js` – program, który dobiera siłę wrogów do ulepszeń (uruchom po zmianie ulepszeń, cen albo złota)
- `manifest.webmanifest`, `ikona-180.png`, `ikona-512.png` – ikona i nazwa na ekranie telefonu
- `survival/` – gra Yaceq Survival: `gra.js` (silnik), `krainy.js` (krainy, ceny, fale), `modele.js` (modele 3D),
  `ikony.js` (ikony), `three.module.min.js` (biblioteka 3D three.js 0.170, licencja MIT w `three-LICENSE.txt`),
  `wersje/` (starsze wersje do wyboru przy starcie; tworzy je `narzedzia/survival-wersja.py`)
