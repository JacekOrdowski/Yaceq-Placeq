# Śmierdzipacha: zasady pracy w tym repozytorium

Gra na telefon z matematyką dla klas 1–8 szkoły podstawowej. Nazwę wybrały dzieci właściciela.
Wcześniejsze nazwy: „Armia Liczb” (wersje 1–4), „Głupia Gra” (wersja 5).
W grze klasy nazywają się levelami: level 1 to 1. klasa, level 8 to 8. klasa. Właściciel nie jest programistą:
rozmawiaj po polsku, prosto, bez technicznego żargonu.

## Każda nowa wersja gry

Gdy zmiany w grze są gotowe i zapisywane w repozytorium:

1. Podnieś numer `WERSJA` na początku `gra.js` o 1.
2. Dopisz na górze `ZMIANY.md` nową sekcję „Wersja N (data)” z podziałem na **Dodane**, **Zmienione**, **Usunięte**
   (i ewentualnie **Do sprawdzenia**), prostym językiem, tak jak w poprzednich wpisach.
3. Zrób commit. Jego skrót (pierwsze 7 znaków) wpisz w `ZMIANY.md` przy tej wersji jako „Zapis w repozytorium”,
   w następnym commicie. Tagów nie używaj: w sesjach w chmurze GitHub ich nie przyjmuje.

## Muzyka

- Utwory są w `muzyka/*.mp3`, tworzy je `narzedzia/muzyka.py` (mido, fluidsynth, fluid-soundfont-gm, ffmpeg).
- Po zmianie utworów skopiuj wypisane na końcu czasy pętli do `MUSIC_LOOPS` w `gra.js`.

## Zadania matematyczne

- Zadania są w `zadania.js`: 8 klas × 8 tematów × 4 stopnie trudności.
- Po każdej zmianie w zadaniach sprawdź je automatycznie, przeliczając wyniki niezależnie od gry,
  i upewnij się, że błędna odpowiedź na bramce nigdy nie jest równa dobrej.
- Przydział tematów do klas: podstawa programowa 2017 ze zmianami z 2024 oraz rozkłady materiału GWO („Matematyka z plusem”)
  i Nowej Ery („Matematyka z kluczem”).

## Balans

- Siła wrogów to tabela `ENEMY_P` w `gra.js`. Po zmianie ulepszeń, ich cen albo złota uruchom `node narzedzia/balans.js`
  (kilka minut) i wklej wypisaną tabelę do `gra.js`.

## Wersja robocza (nowa gra w folderze `wersja-robocza/`)

- Osobna gra, na razie bez zadań: obrona bazy przed meteorami, wzorowana na Galaxy Defense: Fortress TD.
  Adres: https://jacekordowski.github.io/Yaceq-Placeq/wersja-robocza/. Śmierdzipachy przy niej nie ruszamy.
- Nowa wersja: podnieś `WERSJA` w `wersja-robocza/gra.js` i dopisz sekcję w `wersja-robocza/ZMIANY.md`
  (te same zasady co wyżej, w tym skrót commita w następnym commicie).
- Gracz przesuwa palcem Strażnika, który strzela prosto w górę; meteory lecą falami (lewa, środek, prawa, wszędzie).
  Wieżyczki tylko pomagają: kto stoi w miejscu, ma przegrać nawet z najlepszymi kartami (życzenie właściciela).
- Liczby trudności są w `BAL` w `wersja-robocza/gra.js` (`side` to siła wieżyczek). Po zmianie broni, kart albo trudności
  uruchom kilka razy `node narzedzia/balans-robocza.js` (kilkadziesiąt sekund) i sprawdź, ile bitew wygrywa się
  na kolejnych etapach, w tym że Strażnik, który stoi, przegrywa.
- Muzyka bierze pliki z `muzyka/` (ścieżka `../muzyka/`).

## Yaceq Survival (osobna gra w folderze `survival/`)

- Gra 3D (three.js 0.170 w `survival/three.module.min.js`, bez internetu). Zasady wzięte z filmiku z reklamą gry
  z zimowym obozem, ale wygląd, postacie i nazwy są własne: nie kopiujemy cudzej gry.
- Zamiast rąbania drzew: zbieranie jagód kamczackich, zamiast siekiery: koszyczek (życzenie właściciela).
  Pokonane zwierzę przewraca się na bok i znika w obłoczku, bez krwi, a na ziemi zostaje mięso (`mieso` w `ZWIERZETA`;
  życzenie właściciela). Mięso sprzedaje lada `ladaM`; daje je też hodowla (`zagroda`, karmiona jagodami, z pasterzem).
- Zwierzęta, które jedzą zapasy, psują lady i przetwórnie (`uszkodz` w `gra.js`); zepsuty budynek nie pracuje.
  Rzemieślnicy (`rodzaj: 'rzemieslnicy'`) biorą z magazynu kamień albo drewno i sami naprawiają budynki i płot.
- Zasoby: jagody (koszyczek) → sprzedaż na ladach daje pieniądze; drewno (siekiera, ścinalne drzewa) i kamień
  (kilof, głazy po zbudowaniu kamieniołomu) idą na budowy. Koszt budowli w `krainy.js` to `{ kasa, drewno, kamien }`.
- Lady sprzedają tylko, gdy stoi przy nich Yaceq albo gdy zatrudniono sprzedawcę (`rodzaj: 'sprzedawca'`).
  Siekiera (`rodzaj: 'narzedzie'`) daje poziom 1 siekiery, kamieniołom poziom 1 kilofa; wyższe poziomy w kuźni (`NARZEDZIA`).
- Pomocnicy (`chatka`: `do` = lada, `zapas: 'magazyn'`) i wózek: jagody najpierw na ladę, drewno i kamień najpierw
  do magazynu (`mag_jagody`, `mag_drewno`, `mag_kamien`), nadmiar na ladę (`wybierzCel` w `gra.js`).
- Palisady nie da się przejść (tylko bramy, dziury i obejście od południa); trasy liczy `punktTrasy` w `gra.js`.
- Krainy są w `survival/krainy.js` (funkcja `zrob` buduje krainę według wspólnego wzoru: etapy bazy, regiony,
  około 60 budynków z kosztem `{ kasa, drewno, kamien, deski }`, warunkiem `po` i etapem bazy `etap`).
  Druga kraina to ten sam wzór, drożej i z groźniejszymi zwierzętami; kupuje się ją za pieniądze po Wielkim Piecu.
- Las: drzewa są w instancjach (`zbudujLas`), strefy twardości wg odległości od `SRODEK` (`GRANICE_STREF`).
  Drzewa w kawałkach przyszłych rozbudów nie odrastają (lista `sciete` w zapisie).
- Liczby do strojenia (ceny, koszty budowli, fale, gwiazdki) są w `survival/krainy.js`.
- Nowa wersja: podnieś `WERSJA` w `survival/gra.js` i dopisz sekcję w `survival/ZMIANY.md`
  (te same zasady co wyżej, w tym skrót commita w następnym commicie).
- Wybór wersji przy starcie: lista `WERSJE` na początku `survival/gra.js`. Przy każdej nowej wersji poprzednią zapisz jako kopię:
  `python narzedzia/survival-wersja.py NUMER SKROT_COMMITA` (skrót z `survival/ZMIANY.md`), a w `WERSJE` dopisz nową
  na górze i poprzedniej daj `adres: 'wersje/NUMER/'`. Kopie mają osobny zapis postępu (`yaceq-survival-wNUMER`).
- Test bez klikania: w konsoli przeglądarki `window.__yaceq` (stan gry, `krok(sekundy)` przesuwa czas gry,
  `cel` to miejsce, które pokazuje zielona strzałka). Robot idący za `celTrasy` (punkt, do którego prowadzi strzałka) przechodzi krainę w około 57 minut (pola działają po 1 s stania: `CZEKAJ` w `gra.js`);
  przy dłuższych symulacjach używaj `krok(0.1, 1/30)` (szybciej);
  `odNowa()` zaczyna krainę od zera.
  Kamera patrzy na ukos: kierunek w świecie (dx, dz) to na ekranie x = (dx − dz)/√2, z = (dx + dz)/√2.

## Age of Yaceq (osobna gra w folderze `age/`)

- Silnik skopiowany z Yaceq Survival 13 (biblioteka 3D brana z `survival/three.module.min.js`), zapis `age-of-yaceq-1`.
  Survivalu przy pracy nad Age of Yaceq nie ruszamy (i odwrotnie).
- Budynki z `stawiane: true` gracz stawia sam: menu „Buduj” → półprzezroczysty podgląd → „Postaw tutaj”.
  Miejsca są w zapisie (`S.miejsca`), położenie liczy `ustawMiejsca` w `age/gra.js` (sprzedawca przy ladzie,
  myśliwy na wieży, taśmociąg prosto od przetwórni do lady). Zasady miejsc: `miejsceOk`, rozmiary budynków: `STOPA`.
- Ery: pola `rodzaj: 'era'` w `age/krainy.js` (przed ratuszem); wszystko po polu „era N” należy do ery N (`ERY`).
- Burzenie oddaje połowę kosztu i przebudowuje świat z zapisu (`zburz`). Taśmociągi nie mogą być w `po` innych budynków.
- Plan następnych er (od właściciela): Wioska: soki, cegły i mur, owce (siano, owies, ogrodzenie z drewna), muły;
  Miasteczko: kopalnia rudy żelaza, metalowe siekiery i kilofy, gwoździe, stalowe groty strzał;
  Miasto: stalowe tory z kolejką (wcześniej noszą pracownicy i muły), mur ze stalowymi sztabami, chłodnia, mroźnia,
  sortownia (1. klasa: +15% wydajności liofilizatorni i tłoczni soków, odsort ok. 3% idzie dla owiec), liofilizaty.
- Nowa wersja: podnieś `WERSJA` w `age/gra.js`, dopisz sekcję w `age/ZMIANY.md` (te same zasady co wyżej).
  Wybór wersji jak w Survivalu: lista `WERSJE` w `age/gra.js`; poprzednią wersję zapisz jako kopię
  `python narzedzia/age-wersja.py NUMER SKROT_COMMITA` (kopie w `age/wersje/`, zapis `age-of-yaceq-wNUMER`).
- Test: `window.__yaceq` jak w Survivalu, a do tego `polecane` (co gra radzi postawić) i `postawPolecane()`
  (robot stawia to w wolnym miejscu). Robot przechodzi grę w około 80 minut.
- Przybliżanie: uszczypnięcie dwoma palcami albo kółko myszy (`zoom` w `age/gra.js`, od 0,6 do 2, zapamiętane w `zapis.zoom`).

## Age of Haskap (osobna gra w folderze `age2/`; do wersji 29 „Age of Haskap II”)

- Gra strategiczna (gatunek jak znane gry o erach, ale nazwy, budynki, wygląd i liczby są nasze; nie kopiujemy cudzej gry).
  Gracz dowodzi osadnikami (dotknij osadnika, potem krzaka, drzewa, skały, budynku albo wroga); obok rośnie osada komputera.
  Przegrywa ten, kto straci wszystkie ratusze. Biblioteka 3D z `survival/three.module.min.js`, zapis `age-of-haskap-2`.
- Liczby do strojenia są w `age2/dane.js`: jednostki, budynki, ery, ulepszenia, tempo zbierania i poziomy trudności (`TRUDNOSC`).
  Nasza mapa ulepszeń (zatwierdzona przez właściciela, wprowadzana kawałkami): 4 ery (Sadzonka, Kwitnienie, Owocowanie,
  Wielkie Zbiory), żelazo zamiast złota, linie wojska z awansami (`linia`, `st`, `awans` w `JEDNOSTKI`). Nazwy wewnętrzne
  zostały z wersji 1 (`ratusz` = Dworek Jagodowy, `koszary` = Strażnica Krzaka, `stajnia` = Zagroda reniferów, `szopa` = Kamieniołom).
  Następne kawałki: przetwórnie (sortownia, chłodnia i mroźnia, tłocznia, smażalnia, liofilizatornia, jarmark), owce,
  huta i transport (muły, tory), Zielarnia i Akademia Ogrodnika, mury i Ambony z cegły, Gawra z niedźwiedziem.
  Modele 3D (sklejone bryły z kolorami) w `age2/modele.js`, reszta w `age2/gra.js` (przeciwnik komputerowy: funkcja `ai`).
- Mapa ma 144, 192, 240 albo 384 (Mega) kratki (wybór przy nowej grze; `ustawMape`, `N`, `BAZA` na początku `age2/gra.js`; do wersji 13: 96 × 96)
  i jest taka sama dla wszystkich stron: przy 2 stronach połowa gracza odbita na drugą stronę, przy 3–4 ćwiartka obrócona 3 razy
  (`generujMape`, `kopieKom`). Mapa 192 z 1 komputerem musi zostać dokładnie taka jak dotąd (zapisy odtwarzają ją z `seed`).
  Stare zapisy z mapą 96 przechodzą do kopii wersji 13.
- Rodzaje map: `MAPY` w `age2/dane.js` (nazwa, motyw, ile lasów), wybór w `S.mapaTyp` (stare zapisy: Dolina). Teren w tablicy
  `TEREN` (1 woda, 2 skały, 3 bród, 4 lód, 5 polanka zamknięta lasem) robi `generujTeren` (część gracza, potem kopia jak zasoby);
  woda i skały to `blok` 6, bród i lód 7 (chodzi się, nie buduje). Kolory i ozdoby motywów: `MOTYWY` w `age2/gra.js`.
  Dolina ma zostać dokładnie taka jak dotąd (nowe rodzaje map nie mogą zmieniać losowania Doliny).
  Góry w Jotunheim to siatka wysokości nad kratkami skał (`zbudujGory`), na innych mapach skały to głazy (`MOD.glaz`).
- Strony: 0 = gracz, 1–3 = komputery (`S.strony`, rogi `ROGI`, kolory `KOLORY_STRON` w `age2/modele.js`), poziom każdego komputera
  w `S.trudnosci`, drużyny w `S.druzyna` (kto jest wrogiem: `wrogowie(a, b)`), przegrani w `S.odpadli`. Opcje nowej gry: `nowaGra(opcje)`.
- Test bez klikania: `window.__haskap` (`krok(sekundy)`, `komputerKontraKomputer(trudnosc)` = komputer gra też za gracza).
  Po zmianach w liczbach albo w `ai` puść kilka gier komputer kontra komputer: gra ma się kończyć (zwykle 25–45 minut) bez błędów,
  a gracz, który nic nie robi, na łatwym poziomie przegrywa dopiero po około 25 minutach.
- Dźwięki: krótkie pliki WAV w `age2/dzwieki/` (CC0, źródła w `age2/dzwieki/ZRODLA.md`), lista grup w `ODGLOSY` w `age2/gra.js`,
  funkcja `odglos(nazwa, x, z)` gra dźwięk z głośnością i stroną zależną od kamery. Na tym komputerze nie ma ffmpeg:
  OGG zamienia się na WAV w przeglądarce (dekodowanie, mono 22050 Hz, przycięcie ciszy).
- Muzyka: utwory MP3 (CC0, autorzy w `age2/muzyka/ZRODLA.md`), lista `UTWORY` w `age2/gra.js` (`g` wyrównuje głośność,
  `od` to era, od której utwór gra); spokojne grają na zmianę, w walce `bitwa`, przejścia płynne (`muzykaKrok`).
- Grafika: faktury i ruch (nogi, koła, wiatr) liczy karta graficzna (`MAT.onBeforeCompile` w `age2/gra.js`, atrybuty `wzor` i `staw`
  z `polacz` w `age2/modele.js`); efekty (dym, ogień, iskry) to `EF` i `emitujEfekty`, okolica za mapą to `zbudujOkolice`.
- Nowa wersja: podnieś `WERSJA` w `age2/gra.js`, dopisz sekcję w `age2/ZMIANY.md` (te same zasady co wyżej).
  Mury: każdy odcinek ma wygląd `wyg` = [x, z, kąt, długość] (mur po skosie zajmuje kratki schodkami, a rysuje się gładko).
  Brama ma 4 kratki (`kratkiBramy`, `SZER_BRAMY`, `b.kom`; przy murze wpasowuje się w niego: `bramaWMurze`), można ją zamknąć (`ustawBrame`). Rzemieślnik (`naprawia: true`) sam naprawia budynki (`NAPRAWA` w `dane.js`).
  Poprzednią wersję zapisz jako kopię: `python narzedzia/age2-wersja.py NUMER SKROT_COMMITA` i dopisz ją w `WERSJE`
  z `adres: 'wersje/NUMER/'` (kopie mają zapis `age-of-haskap-2-wNUMER`).

## Age of Polan (osobna gra w folderze `polanie/`)

- Słowiańska gra o erach i bogach (gatunek jak Age of Mythology, ale treść, nazwy, wygląd i liczby są nasze; nie kopiujemy cudzej gry).
  Silnik skopiowany z Age of Haskap 29; Age of Haskap przy pracy nad Polanami nie ruszamy (i odwrotnie). Zapis `age-of-polan-1`.
- Co czemu odpowiada (bogowie, moce, stwory, bohaterowie, krainy, plany na później): `polanie/MITOLOGIA.md`.
  Plan gry z kolegami: `polanie/GRA-Z-KOLEGAMI.md`. Czasy około 1000 lat temu (przed 966 r.), wierzenia i podania z ziem polskich.
- Nazwy wewnętrzne zostały z Age of Haskap: `ratusz` = Gród, `koszary` = Dwór drużyny, `tartak` = Drwalnia, `kopalnia` = Dymarka,
  `jarmark` = Targowisko, `pole` = Zagon prosa, `jagody` = żywność, `zloto` = srebro, linia `renifer` = konie. Łaska to `S.zas[s].laska`
  (poza `SUROWCE`, nie da się nią handlować).
- Bogowie (`BOGOWIE`, `BOGOWIE_GLOWNI`), moce (`MOCE`), łaska (`LASKA`), stwory (`mit`, `bog` w `JEDNOSTKI`) i bohaterowie (`bohater`)
  są w `polanie/dane.js`. Wybrani bogowie: `S.bogowie[strona]` (pierwszy = główny), moce: `S.moce`, działające moce: `S.czary`,
  czasowe wzmocnienia: `S.buff`. Bonusy bogów liczą funkcje z `bogMa(strona, id)`; moce: `uzyjMocy`, `krokCzarow`; komputer: `aiMoce`.
  Era przechodzi z wybranym bogiem: `dodajDoKolejki(gród, 'era', idBoga)`, opcje: `bogowieEry`. Modlitwa: zadanie `modl`.
- Muzyka i dźwięki są brane z `age2/` (`../age2/muzyka/`, `../age2/dzwieki/`).
- Ulepszenia wzmacniające jednostki mają pole `wzmocni` (liczy `wzm` w `polanie/gra.js`); ulepszenia od bogów mają `bog`.
  Nowa era: przycisk `#b-era` u góry (`brakiEry`, `odswiezPrzyciskEry`, wybór boga w panelu `pokazEre`). W budynkach widać tylko to, co już dostępne.
- Test: `window.__polan` (to samo co `__haskap`, do tego `uzyjMocy`). Gry komputer kontra komputer trwają około 30–50 minut.
- Nowa wersja: podnieś `WERSJA` w `polanie/gra.js`, dopisz sekcję w `polanie/ZMIANY.md` (te same zasady co wyżej).
  Poprzednią wersję zapisz jako kopię: `python narzedzia/polanie-wersja.py NUMER SKROT_COMMITA` i dopisz ją w `WERSJE`
  z `adres: 'wersje/NUMER/'` (kopie mają zapis `age-of-polan-1-wNUMER`).

## Lista naszych gier

- Każda gra ma w menu przycisk „Inne gry” (`data-inne-gry`) i wczytuje wspólny `gry.js` z głównego folderu.
  Nowa gra: dopisz ją do listy `GRY` w `gry.js` i dodaj przycisk w jej menu.
