# Age of Polan: historia wersji

Gra działa pod adresem https://jacekordowski.github.io/Yaceq-Placeq/polanie/

Słowiańska gra strategiczna o erach i bogach. Gatunek i zasady działania jak w grach o bogach i erach
(bogowie wybierani przy erach, łaska, moce bogów, stwory, bohaterowie), ale nazwy, wygląd, postacie i liczby są nasze,
a treść pochodzi z dawnych wierzeń i podań z ziem polskich. Co czemu odpowiada: `MITOLOGIA.md`.
Silnik (mapa, budowanie, wojsko, komputer) wyrósł z Age of Haskap (folder `age2/`); muzykę i dźwięki gra bierze stamtąd.

## Wersja 19 (24.11.2026)

**Dodane**
- Zapisywanie gry: w pauzie (⏸) przycisk „💾 Zapisz grę”. Mieści się do 8 zapisów, najnowszy na górze; gdy zabraknie miejsca
  w pamięci telefonu, najstarsze same znikają.
- Wczytywanie gry: „📂 Wczytaj grę” w pauzie i „📂 Wczytaj zapisaną grę” w menu. Lista pokazuje datę i godzinę, krainę, erę,
  boga i czas gry; zapis można usunąć (🗑️, dwa dotknięcia). Bieżąca gra dalej zapisuje się sama, jak dotąd („Graj dalej”).
- Ulepszenia bram: Brama w wale (era 3) i Brama okuta żelazem (era 4), robione po dotknięciu bramy.

**Zmienione**
- Ulepszenia muru (Wał grodowy, Wał z kamieniem) robi się po dotknięciu muru, a nie w Kamieniołomie. Zmieniają już tylko mury;
  bramy mają swoje ulepszenia. Stare zapisy: bramy dostają ulepszenia, które miały razem z murem.

Zapis w repozytorium: `790ab65`

## Wersja 18 (24.11.2026)

**Zmienione**
- Napisy z postępem budowy (🔨 0%) nie zaśmiecają już ekranu:
  - przy częstokole i bramach widać je tylko przy największym przybliżeniu (każdy kawałek muru ma swój napis),
  - przy budynkach bledną przy oddalaniu kamery i znikają przy średnim oddaleniu,
  - przy dużym oddaleniu nie ma ich wcale. Postęp widać też w okienku na dole po dotknięciu budowy.
  Odległości ustawia `PROC_BUD` i `PROC_MUR` w `gra.js`.

Zapis w repozytorium: `a3eff66`

## Wersja 17 (24.11.2026)

**Naprawione**
- Niesione surowce przepadały, gdy osadnik dostawał inną pracę (np. z rąbania do modlitwy albo z kamienia do drewna).
  Teraz najpierw odnosi to, co niesie, do najbliższego spichlerza, drwalni, kamieniołomu albo Grodu, a potem sam idzie do nowej pracy
  (`najpierwOdnies`). Dlatego nie biegają już dookoła Gontyny z polanami na klacie. Tak samo robi komputer.
- Bieg bokserski: krok zgrany z ciosem. Lewa pięść wychodzi w chwili, gdy lewa stopa staje na ziemi, prawa z prawą
  (zmierzone: różnica najwyżej 0,02 s), 3 kroki i 3 ciosy na sekundę.

Zapis w repozytorium: `4627583`

## Wersja 16 (24.11.2026)

**Zmienione**
- Ciosy w biegu bokserskim idą równo na zmianę: lewa, prawa, lewa, prawa, każdy krok jeden cios. Wcześniej były sklejone z dwóch
  różnie długich ruchów i prawa ręka długo trzymała pięść z przodu, więc na zmianę nie było widać. Teraz ruch jest złożony z czterech
  póz (garda, lewa wyciągnięta, garda, prawa wyciągnięta) równo rozłożonych w czasie.

Zapis w repozytorium: `10c97db`

## Wersja 15 (24.11.2026)

**Zmienione**
- Bieg bokserski przy Gontynie w równym rytmie: jeden krok to jedno uderzenie pięścią. Na początek 3 kroki na sekundę
  i 3 uderzenia na sekundę (lewa, prawa, lewa…), zmierzone w podglądzie. Rytm ustawia `KROKI_NA_SEKUNDE` w `postacie.js`.

Zapis w repozytorium: `cf208cb`

## Wersja 14 (24.11.2026)

**Zmienione**
- Osadnicy przy Gontynie biegają w kółko dookoła budynku, jeden za drugim, i w biegu na zmianę biją pięściami powietrze
  (nogi biegną, ręce boksują). Skały i drzewa przy Gontynie obiegają szerszym łukiem (`petlaGontyny`); gdy droga jest
  całkiem zastawiona (np. staw na Bagnach), zawracają. Na zwykłych mapach okrążenie trwa około 12 sekund.

Zapis w repozytorium: `f6bae91`

## Wersja 13 (24.11.2026)

**Zmienione**
- Bieg bokserski przy Gontynie zrobiony tak, jak powinien: osadnicy stoją w kręgu wokół Gontyny, twarzą do posągu,
  truchtają w miejscu (nogi z ruchu biegu) i jednocześnie na zmianę biją pięściami powietrze (prosty lewą, prosty prawą).
  Dwa ruchy grają naraz: nogi z biegu, góra ciała z ciosów (`czescRuchu`, `ciosyNaZmiane` w `postacie.js`).

Zapis w repozytorium: `736b566`

## Wersja 12 (24.11.2026)

**Dodane**
- Portrety wszystkich 12 bogów (nasze własne rysunki): Perun z piorunami i hełmem, Weles z rogami i wężem, Swaróg z młotem w kuźni,
  Dażbóg na tle słońca, Mokosz w chuście z kłosami, Jaryło w wianku, Strzybóg w wichurze, Swarożyc w płomieniach, Łada z warkoczami
  i kwiatami, Świętowit z kilkoma twarzami i rogiem, Marzanna w śniegu, Trzygłów z trzema głowami (`portrety.js`).
- Wybór boga przy nowej erze w dużym oknie na środku ekranu (jak w grach o bogach i erach): dwa portrety obok siebie,
  a pod każdym moc, stwór, dar i cena. Gra stoi, dopóki nie wybierzesz; można też wrócić do gry i wybrać później.

**Zmienione**
- W Grodzie zamiast dwóch małych przycisków z bogami jest jeden: „Era 2: Czasy Grodów: dotknij i wybierz boga”.
- Przy nowej grze bogowie główni (Perun, Weles, Swaróg) mają portrety.

Zapis w repozytorium: `14fc88e`

## Wersja 11 (24.11.2026)

**Zmienione**
- Modlitwa w Gontynie wygląda jak bieg bokserski, a nie jak bicie worka treningowego: osadnicy rozstawieni dookoła Gontyny
  biegają tam i z powrotem wzdłuż jej boków (zwalniają i zawracają na końcach). Gdy coś stoi na drodze (skała, drzewo, ktoś inny),
  zawracają wcześniej. Łaska zbiera się tak samo jak dotąd.

Zapis w repozytorium: `87462df`

## Wersja 10 (24.11.2026)

**Zmienione**
- Zamiast szarfy w kolorze strony (wyglądała jak deska przyklejona do pleców) kolor strony jest na samym stroju, jak w grach o bogach
  i erach: lniane koszule osadników i wojaków oraz zielone kaptury i kurtki łuczników są przefarbowane na niebiesko, czerwono, żółto
  albo fioletowo. Fałdy i cienie stroju zostają, zmienia się tylko barwa. Tarcze nadal są w kolorze strony.

Zapis w repozytorium: `27243a1`

## Wersja 9 (24.11.2026)

**Zmienione**
- Po oddaleniu kamery osadnicy i wojsko nie wracają już do starego wyglądu z brył: realistyczne postacie są przy każdym przybliżeniu,
  do 120 naraz (najbliżej środka widoku). Z daleka ich ruch liczy się co drugą klatkę, żeby telefon nie zwalniał.
  Proste bryły widać tylko przez kilka sekund po otwarciu gry (zanim postacie się wczytają) i przy ponad 120 ludziach w widoku.

**Do sprawdzenia**
- Płynność na iPhonie 13 przy oddalonej kamerze i dużych bitwach; gdyby zwalniało: mniejsze `LUDZ_MAKS` w `gra.js`.

Zapis w repozytorium: `03f4778`

## Wersja 8 (24.11.2026)

**Zmienione**
- Zagon prosa nie wygląda już jak krzaki z jagodami (zostały z Age of Haskap): trzy zaorane zagony, na każdym gęste źdźbła prosa
  z liśćmi i zwisającymi złotymi wiechami, lekko kołyszące się na wietrze. Płotek i strach na wróble zostały.

Zapis w repozytorium: `b977923`

## Wersja 7 (24.11.2026)

**Naprawione**
- Ludzie idący naprzeciw siebie długo się przepychali. Teraz ten, komu ktoś stoi na drodze, schodzi w prawo (jak na chodniku),
  więc mijają się od razu: dwóch osadników na 8 kratek idzie 4,2 s (bez nikogo na drodze 4 s), sześciu naraz 5,3 s.
- Przy zagonach (i przy płotach Stajni i Spichlerza) żerdzie płotu sterczały w poprzek jako długie linie. Teraz leżą wzdłuż płotu.

Zapis w repozytorium: `bab37d9`

## Wersja 6 (24.11.2026)

**Dodane**
- Realistyczne postacie z prawdziwym ruchem (darmowe modele Quaternius, CC0; skąd są: `postacie/ZRODLA.md`):
  osadnicy (chłopi z brodami i bez, chłopki z długimi włosami), wojacy, tarczownicy, drużynnicy, włócznicy, łucznicy i rzemieślnicy.
  Normalne proporcje, twarze, włosy i brody, lniane koszule, kamizelki, buty z cholewami, kaptury.
- Ruchy: rąbanie drzewa (z siekierą), kopanie kamienia i rudy (z kilofem), zbieranie jagód i żęcie zagonów, budowanie i naprawa
  na klęczkach (z młotkiem), noszenie surowców przed sobą, marsz i bieg, walka mieczem, maczugą, toporem i włócznią,
  rzut z procy, trening boksera przy Gontynie (proste ciosy na zmianę), padanie po śmierci.
- Po czym poznać stronę: szarfa w kolorze strony przez pierś, tarcze w kolorze strony; wojsko w stożkowych hełmach.

**Zmienione**
- Realistyczne postacie są rysowane, gdy kamera jest blisko, i tylko 70 najbliżej środka widoku naraz; dalej i przy oddaleniu
  zostają proste bryły (żeby telefon nie zwalniał). Jeźdźcy, stwory, bohaterowie, machiny i wozy są na razie jak dotąd.
- Postacie wczytują się w tle po otwarciu gry (około 11 MB); do tego czasu widać proste bryły.

**Naprawione**
- Rzadki błąd przy treningu w Gontynie, który mógł na chwilę zatrzymać rysowanie.

**Do sprawdzenia**
- Płynność na iPhonie 13 przy dużych bitwach (w podglądzie na komputerze różnica była mała). Gdyby zwalniało: mniejsze `LUDZ_MAKS`
  albo `LUDZ_D` w `gra.js`.

Zapis w repozytorium: `560630d`

## Wersja 5 (24.11.2026)

**Zmienione**
- U góry ekranu nie ma już paska nowej ery. Wszystko o erze jest w Grodzie: dotknij Grodu, a na początku listy zobaczysz,
  czego brakuje (jakie budynki i ile surowców), albo dwa przyciski z bogami, gdy można już przejść dalej.
- Krótsze podpowiedzi u góry („Dotknij Grodu: zobaczysz, czego brakuje do nowej ery”).

**Usunięte**
- Przycisk ery u góry ekranu (z wersji 2).

Zapis w repozytorium: `80ba926`

## Wersja 4 (24.11.2026)

**Zmienione**
- Nowe, dokładniejsze postacie (osadnicy, wojsko, jeźdźcy, bohaterowie, Rusałka, Płanetnik):
  prawdziwe proporcje (głowa około 1/7 wzrostu, szyja, ramiona z łokciami i dłońmi), twarz z białkami oczu, brwiami,
  nosem i ustami, fryzura „pod garnek”, u części osadników brody (6 wariantów wyglądu), lniana koszula z haftowanym brzegiem
  i kołnierzem, pas ze sprzączką, portki, onuce z rzemykami, skórzane buty. Słomkowy kapelusz zsunięty do tyłu, żeby było widać twarz.
- Hełmy wojska: stożkowe, z nosalem i kolczym czepcem, jak u dawnych Słowian. Drużynnik ma kaftan w kolorze strony na kolczudze.
- Trening przy Gontynie: osadnicy trzymają obie ręce w gardzie i na zmianę wyprowadzają proste ciosy przed siebie, biegając w miejscu
  (zamiast machania jedną ręką w górę i w dół).

**Do sprawdzenia**
- Postacie mają około 1,5 razy więcej trójkątów niż wcześniej: sprawdzić, czy na telefonie gra nie zwalnia przy dużych bitwach.

Zapis w repozytorium: `0eaeb70`

## Wersja 3 (24.11.2026)

**Zmienione**
- Osadnicy modlący się przy Gontynie wyglądają jak na treningu boksera: biegną w miejscu, podskakują i wyprowadzają ciosy.

**Naprawione**
- Wstążki na słupach przy Gontynie latały daleko od słupów (wyglądały jak deski w powietrzu). Teraz tylko lekko powiewają.
  To samo poprawione w skrzydłach Raroga i Żmija, ogonach koni, Wilkołaka i Biesa oraz chmurkach Płanetnika.

Zapis w repozytorium: `bb4bd25`

## Wersja 2 (24.11.2026)

**Dodane**
- Przycisk nowej ery u góry ekranu. Gdy można, świeci na zielono: dotknij i wybierz jednego z dwóch bogów.
  Gdy nie można, pisze, czego brakuje (ile żywności, żelaza, srebra, ilu budynków). W trakcie pokazuje, ile procent już jest.
- Ulepszenia od bogów w Gontynie (tylko gdy masz danego boga): Topór Peruna, Stada Welesa, Kuźnia Swaroga
  i po dwa od każdego boga pomniejszego: jedno wzmacnia jego stwora (np. Złote pióra dla Raroga, Prastary Leszy,
  Wilcza wataha, Gradowe chmury, Ognisty oddech, Pieśń rusałek, Wróżba z konia, Upiorna noc, Bies z Nawii),
  drugie pasuje do boga (np. Dar słońca, Len i przędza, Jare zboże, Wiatr w plecy, Święty żar, Noc Kupały).
- Brakujące ścieżki ulepszeń z gier o bogach i erach: Bartnictwo (Spichlerz), Tarcze w 3 stopniach i Wyważone strzały (Kuźnia),
  Mistrzowie piechoty, łuku i jazdy (4. stopień każdej linii wojska w erze 4).
- Bohaterowie rosną w siłę z każdą erą (+15% życia i ataku na erę).
- Komputer też robi nowe ulepszenia.

**Zmienione**
- W budynkach (np. w Grodzie) widać tylko to, co da się zrobić już teraz; rzeczy z późniejszych er pojawiają się dopiero w swojej erze.
- Czasy jak w grach o bogach i erach: osadnik 15 s, piechota 13–14 s, jazda 12–18 s, katapulta 25 s, wóz 15 s, stwory 20–35 s,
  bohaterowie 20 s, awanse linii 20/30/40 s (era 2/3/4), ery 60/75/120 s, chata 15 s.

**Do sprawdzenia**
- Bitwy komputer na komputer trwały 32–47 minut; gracz, który nic nie robi, na łatwym przegrywa po 30 minutach.
- Czasy wzięte częściowo z notek do poprawek gry i opisów w internecie, a częściowo z pamięci (strony z dokładnymi tabelami były niedostępne).

Zapis w repozytorium: `4772eb6`

## Wersja 1 (24.11.2026)

**Dodane**
- Polanie: Gród, Chata, Drwalnia, Dymarka (ruda darniowa), Targowisko, Zagon prosa, Dwór drużyny, Stajnia, Strażnica,
  częstokół i wały grodowe; srebro zamiast złota; jazda na koniach, pancerni jak drużyna Mieszka.
- 4 ery: Czasy Plemion, Czasy Grodów, Czasy Bohaterów, Czasy Bogów.
- Bóg główny do wyboru przy nowej grze: ⚡ Perun, 🐍 Weles albo 🔨 Swaróg (każdy daje coś innego i swoją moc).
- Przy każdej nowej erze wybierasz jednego z dwóch bogów pomniejszych: Dażbóg, Mokosz, Jaryło (era 2),
  Strzybóg, Swarożyc, Łada (era 3), Świętowit, Marzanna, Trzygłów (era 4).
- Łaska ✨: osadnicy modlą się w Gontynie (świątyni z czterolicym posągiem). Perun daje też łaskę za pokonanych wrogów.
- 12 mocy bogów (każda raz w grze, przycisk ⚡ z boku): Grom Peruna, Czady z Bieszczad, Ogień Swaroga, Złote Słońce,
  Urodzaj Mokoszy, Wiosna Jaryły, Wichura Strzyboga, Święty Ogień, Zgoda Łady, Róg Świętowita, Mróz Marzanny, Drżenie ziemi.
- 9 stworów z Gontyny (za łaskę): Raróg, Leszy, Wilkołak, Płanetnik, Żmij, Rusałka, Biały Koń Świętowita, Strzyga, Bies z Bieszczad.
- 3 bohaterów z podań (w Grodzie, po jednym): Krak, Waligóra, Lech. Biją stwory 3 razy mocniej.
- 9 krain: Dolina Warty, Jezioro Gopło, Wisła z brodami, Bieszczady, Prastara Puszcza, Kraina Marzanny, Tatry,
  Pustynia Błędowska, Bagna Biebrzy.
- Komputer też wybiera bogów, modli się, przyzywa stwory, szkoli bohaterów i używa mocy.

**Do sprawdzenia**
- Bitwy komputer na komputer trwały 63–80 minut (dłużej niż w Age of Haskap, bo stwory i moce dużo dają);
  gracz, który nic nie robi, na łatwym przegrywa po około 28 minutach.
- Nie sprawdzone na prawdziwym telefonie.

Zapis w repozytorium: `584ca20`
