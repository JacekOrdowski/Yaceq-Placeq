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
  Zwierzęta się przegania (uciekają), nikt nie ginie.
- Zasoby: jagody (koszyczek) → sprzedaż na ladach daje pieniądze; drewno (siekiera, ścinalne drzewa) i kamień
  (kilof, głazy po zbudowaniu kamieniołomu) idą na budowy. Koszt budowli w `krainy.js` to `{ kasa, drewno, kamien }`.
- Palisady nie da się przejść (tylko bramy, dziury i obejście od południa); trasy liczy `punktTrasy` w `gra.js`.
- Na razie gra ma tylko pierwszą krainę („Jagodowa Polana”). Pozostałe są opisane w `survival/krainy.js`
  (lista `WSZYSTKIE`), ale wyłączone przez `KRAINY = WSZYSTKIE.slice(0, 1)`, dopóki właściciel nie zdecyduje o rozbudowie.
- Liczby do strojenia (ceny, koszty budowli, fale, gwiazdki) są w `survival/krainy.js`.
- Nowa wersja: podnieś `WERSJA` w `survival/gra.js` i dopisz sekcję w `survival/ZMIANY.md`
  (te same zasady co wyżej, w tym skrót commita w następnym commicie).
- Test bez klikania: w konsoli przeglądarki `window.__yaceq` (stan gry, `krok(sekundy)` przesuwa czas gry,
  `cel` to miejsce, które pokazuje zielona strzałka). Robot idący za `celTrasy` (punkt, do którego prowadzi strzałka) przechodzi krainę w około 26 minut;
  `odNowa()` zaczyna krainę od zera.
  Kamera patrzy na ukos: kierunek w świecie (dx, dz) to na ekranie x = (dx − dz)/√2, z = (dx + dz)/√2.
