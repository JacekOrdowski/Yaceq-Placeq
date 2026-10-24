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
