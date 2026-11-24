# Age of Polan: historia wersji

Gra działa pod adresem https://jacekordowski.github.io/Yaceq-Placeq/polanie/

Słowiańska gra strategiczna o erach i bogach. Gatunek i zasady działania jak w grach o bogach i erach
(bogowie wybierani przy erach, łaska, moce bogów, stwory, bohaterowie), ale nazwy, wygląd, postacie i liczby są nasze,
a treść pochodzi z dawnych wierzeń i podań z ziem polskich. Co czemu odpowiada: `MITOLOGIA.md`.
Silnik (mapa, budowanie, wojsko, komputer) wyrósł z Age of Haskap (folder `age2/`); muzykę i dźwięki gra bierze stamtąd.

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
