# Age of Haskap II: historia wersji

Gra działa pod adresem https://jacekordowski.github.io/Yaceq-Placeq/age2/

Nowa gra strategiczna. Pomysł gatunku jest wspólny dla wielu gier o erach (osadnicy, surowce, budowanie, wojsko),
ale nazwy, budynki, wygląd i liczby są nasze. Haskap to po japońsku jagoda kamczacka.

## Wersja 26 (23.11.2026)

**Dodane**
- Przy nowej grze można wybrać rodzaj mapy (nazwy i wygląd są nasze):
  - 🌳 Dolina: jak dotąd, łąki, lasy i krzaki.
  - 🏞️ Wielkie Jezioro: na środku jezioro, do wroga idzie się dookoła brzegu; na brzegu ruda żelaza i kamień.
  - 🌊 Rzeka z brodami: rzeka dzieli osady, przejść można tylko przez 3 płytkie brody. Przy 2–3 komputerach
    dwie rzeki na krzyż i każdy ma swoją ćwiartkę.
  - ⛰️ Skalne Przełęcze: każdy Dworek stoi w skalnej kotlinie z dwoma wąskimi wyjściami, na reszcie mapy skałki.
  - 🌲 Gęsta Puszcza: las prawie wszędzie, tylko kręte przesieki i polany.
  - ❄️ Mroźna Tundra: śnieg, świerki z czapami śniegu, zamarznięte jeziora (można po nich chodzić, ale nie budować).
  - 🏜️ Oaza: piasek, kaktusy i mało drzew; palmy rosną przy oazach, największa oaza jest na środku.
  - 🐸 Bagna: dużo małych stawów z trzcinami i więcej krzaków z jagodami.
  - 🎲 Losowa: gra sama wybiera jedną z powyższych.
- Woda błyszczy i faluje, na małej mapce widać wodę, skały i lód.
- Nowe drzewa (palma, świerk w śniegu) i ozdoby (trzciny, zaspy, kaktusy, sucha trawa).

**Zmienione**
- Każda mapa dalej jest taka sama dla wszystkich stron. Dolina wygląda dokładnie tak jak wcześniej.
- Małe polanki całkiem otoczone lasem są zamknięte (nikt tam nie buduje i nie chodzi), dopóki ktoś nie wytnie
  do nich drzewa. Wcześniej komputer potrafił tam postawić budynek, do którego nie dało się dojść.

**Do sprawdzenia**
- Na Gęstej Puszczy jest około 3 razy więcej drzew niż w Dolinie: czy telefon nie zwalnia (zwłaszcza na Dużej mapie).
- Bitwy komputer na komputer trwały od 28 do 82 minut (najdłużej na Puszczy i Bagnach).

Zapis w repozytorium: `9d2850a`

## Wersja 25 (23.11.2026)

**Zmienione**
- Brama jest szeroka na 4 kratki (wcześniej 3). Kosztuje 60 drewna zamiast 45 i buduje się trochę dłużej.
- Brama postawiona przy murze (do 2 kratek od miejsca, które wskażesz palcem) sama wskakuje w linię muru,
  także skośnego, a kawałki muru w tym miejscu znikają (wraca połowa ich ceny). Wcześniej brama postawiona
  o kratkę obok muru stawała obok niego i mur zostawał.
- Bramę dalej można postawić w dowolnym wolnym miejscu, także bez muru.

**Do sprawdzenia**
- Bramy postawione wcześniej zostają takie, jakie były (3 kratki).

Zapis w repozytorium: `dcc3402`

## Wersja 24 (23.11.2026)

**Dodane**
- Nowa gra ma okienko z wyborem:
  - Rodzaj mapy: na razie tylko Dolina (inne rodzaje przyjdą później).
  - Wielkość mapy: Mała (144 × 144 kratki), Średnia (192 × 192, jak dotąd) albo Duża (240 × 240).
  - Ilu przeciwników: od 1 do 3 komputerów, każdy ze swoim poziomem trudności (łatwy, średni, trudny).
  - Kto z kim walczy (przy 2 i 3 komputerach): każdy na każdego albo komputery razem przeciwko tobie.
- Gra zapamiętuje ostatnio wybrane opcje.
- Każda osada ma swój kolor: ty niebieski, komputery czerwony, żółty i fioletowy. Każda zaczyna w swoim rogu mapy.
  Przy 2 i 3 komputerach każdy róg mapy wygląda tak samo, więc nikt nie ma lepszego startu.
- Gdy upadnie Dworek jednego z komputerów, gra o tym mówi, a reszta walczy dalej. Wygrywasz, gdy upadną
  wszystkie wrogie Dworki.
- Komputery w trybie każdy na każdego atakują różne osady: częściej te bliżej, nie zawsze ciebie.

**Do sprawdzenia**
- Przy 3 komputerach na dużej mapie po kilkudziesięciu minutach chodzi po mapie nawet 250 postaci.
  Sprawdź, czy telefon daje radę.
- Gry zapisane wcześniej (1 komputer, średnia mapa) wczytują się tak jak dotąd, na tej samej mapie.

Zapis w repozytorium: `53077ad`

## Wersja 23 (23.11.2026)

**Zmienione**
- W okienku budynku widać tylko ulepszenia, które można zrobić teraz. Następne w kolejce (np. Plecak skórzany po Plecaku
  z łyka, Taczka po Wiklinowym koszu) pojawiają się dopiero po zrobieniu poprzedniego, a ulepszenia z późniejszych er
  dopiero w swojej erze. Na przykład Dworek w 1. erze pokazuje 3 ulepszenia zamiast 7.

Zapis w repozytorium: `1980ec0`

## Wersja 22 (23.11.2026)

**Zmienione**
- Odświeżone budynki (nasz własny wygląd). Są większe i lepiej wypełniają swój plac, a każdy ma znak,
  po którym łatwo go poznać z daleka:
  - Dworek Jagodowy: dach z czerwonej dachówki i wysoka wieża z dzwonem na tylnym rogu (zamiast małej dzwonniczki
    na dachu), kamienne schody przed gankiem.
  - Spichlerz: wielki pleciony kosz ze strzechą i szyld z jagodami.
  - Tartak: większy stos bali i szyld z piłą tarczową.
  - Kamieniołom: nowy wygląd, czyli ściana wyrobiska z tarasami ciętego kamienia, szopa z narzędziami, żuraw z blokiem,
    stos bloków i taczka.
  - Kopalnia rudy żelaza: wieża wyciągowa z kołem nad wejściem.
  - Strażnica Krzaka: dach z szarego łupku i wieża strażnicza na rogu palisady.
  - Strzelnica: wysoka tyczka z drewnianym ptakiem.
  - Zagroda reniferów: renifer z porożem i uprzężą w kolorze gracza.
  - Kuźnia: dach z łupku i szyld z kowadłem.
  - Domy, Jarmark i Warsztat: trochę większe.

**Do sprawdzenia**
- Czy na telefonie gra dalej chodzi płynnie (budynki mają więcej szczegółów).

Zapis w repozytorium: `c6e8b72`

## Wersja 21 (22.11.2026)

**Dodane**
- Brama jest szeroka na 3 kratki (wcześniej 1). Przy stawianiu sama obraca się wzdłuż najbliższego muru
  (także skośnego), a przyciskiem 🔄 można ją obrócić ręcznie. Można ją postawić na swoim murze: te kawałki muru
  znikają (wraca połowa ich ceny). Kosztuje 45 drewna zamiast 30.
- Bramę można zamknąć i otworzyć (przycisk w okienku bramy). Otwarta przepuszcza twoich, zamknięta nikogo.
  Wrogów nie przepuszcza nigdy. Widać, czy skrzydła wrót są otwarte, czy zamknięte.
- Rzemieślnik (🔨, w Kuźni, od ery 2; 60 jagód i 20 żelaza). Sam szuka uszkodzonych budynków i je naprawia
  za twoje surowce: pełna naprawa kosztuje połowę ceny budynku i trwa dwa razy dłużej niż jego budowa.
  Płaci na bieżąco; gdy surowców brakuje, przerywa i mówi o tym. Dotknięcie budynku wysyła go do naprawy właśnie tego.

**Zmienione**
- Ramka zaznaczenia bramy obejmuje całą bramę.

**Do sprawdzenia**
- Komputer nie stawia bram i nie szkoli rzemieślników (jego gra się nie zmieniła).
- Stare bramy z wcześniejszych zapisów zostają wąskie (1 kratka).

Zapis w repozytorium: `a2a75f7`

## Wersja 20 (22.11.2026)

**Zmienione**
- Palisadę (i późniejszy mur z cegieł albo ze stalą) można stawiać po skosie, pod dowolnym kątem do brzegów mapy,
  nie tylko równolegle albo prostopadle. Przeciągasz palcem linię jak dotąd, a odcinki układają się w równą,
  ciągłą ścianę wzdłuż tej linii (wcześniej skośny mur wyglądał jak schodki z oddzielnych kawałków).
- Mur postawiony w pionie (wzdłuż drugiego brzegu mapy) jest teraz obrócony jak trzeba, także w starych zapisach.
- Brama postawiona obok skośnego muru obraca się tak jak ten mur.

**Do sprawdzenia**
- Skośny mur dalej zatrzymuje wrogów jak zwykły (zajmuje kratki schodkami, tylko wygląda gładko).
  Warto zobaczyć w prawdziwej grze, czy nikt się przez niego nie przeciska.

Zapis w repozytorium: `a2c24b3`

## Wersja 19 (20.11.2026)

**Zmienione**
- Naprawione przybliżanie po dużym oddaleniu. Wcześniej, gdy przybliżało się od widoku całej mapy, kamera w połowie drogi
  pochylała się w stronę horyzontu i na ekranie było widać tyle samo ziemi (czasem nawet więcej), więc wyglądało,
  jakby przybliżanie nie działało. Teraz kamera unosi się i pochyla powoli, a każde przybliżenie wyraźnie pokazuje mniej mapy.
  Z widoku całej mapy do Dworku wystarczają około 3 ruchy dwoma palcami.
- Przy największym oddaleniu kamera patrzy trochę bardziej z ukosa niż w wersji 16–18 (cała mapa dalej się mieści).

Zapis w repozytorium: `6e4c877`

## Wersja 18 (20.11.2026)

**Zmienione**
- Gdy nic nie jest wybrane (ani budynek, ani zbieracz, ani wojsko), okienko na dole zwija się do cienkiego paska
  z napisem „Dotknij zbieracza albo budynku”, więc widać więcej mapy. Po dotknięciu czegoś okienko znów się rozwija.
- Podpowiedź o sterowaniu (przesuwanie, przybliżanie, ramka) jest w pasku tylko przez pierwsze 3 minuty gry.
- Mała mapka i przyciski z prawej zjeżdżają w dół razem ze zwiniętym okienkiem.

Zapis w repozytorium: `bc6245d`

## Wersja 17 (20.11.2026)

**Zmienione**
- Naprawione: gdy w Dworku albo innym budynku coś czekało w kolejce (zbieracz, ulepszenie, nowa era), pojawiał się rządek
  z kolejką i spychał przyciski poza okienko na dole, więc przyciski znikały. Teraz okienko rośnie i przyciski
  zawsze widać w całości (razem z ceną i opisem).
- Mała mapka i przyciski z prawej strony same przesuwają się w górę, żeby wyższe okienko ich nie zasłaniało.

Zapis w repozytorium: `763423d`

## Wersja 16 (20.11.2026)

**Zmienione**
- Kamerę można oddalić dużo dalej, aż widać całą mapę naraz (dwoma palcami albo kółkiem myszy).
  Przy dużym oddaleniu kamera patrzy coraz bardziej z góry i przesuwa się na środek mapy.
- Obrys na małej mapce dokładniej pokazuje to, co widać na ekranie: nie liczy części zasłoniętej przez okienko na dole,
  przy pochylonej kamerze nie ucieka poza mapkę, a środek obrysu jest lekko podświetlony.
- Krzyżyk do zamykania okienka na dole jest 3 razy większy niż w wersji 14 i stoi w prawym górnym rogu okienka,
  obok nazwy i opisu, więc nie ściska rzędu przycisków.

**Do sprawdzenia**
- Czy na telefonie przy największym oddaleniu gra działa płynnie (na komputerze tak).

Zapis w repozytorium: `1f18654`

## Wersja 15 (20.11.2026)

**Zmienione**
- Krzyżyk do zamykania okienka na dole (przy budynku, osadniku albo wojsku) jest ponad 2 razy większy
  i ciemniejszy, więc łatwiej trafić w niego palcem.

Zapis w repozytorium: `455306b`

## Wersja 14 (20.11.2026)

**Zmienione**
- Mapa jest 2 razy większa w każdą stronę: 192 × 192 kratki zamiast 96 × 96 (4 razy więcej miejsca).
  Dworki stoją dalej od siebie, więc wojsko idzie do wroga dłużej.
- Na dużej mapie jest więcej wszystkiego: około 4 razy więcej lasów, nowe kępy krzaków z jagodami, kamienia, rudy żelaza
  i złota w dalszych częściach doliny, więcej trawy, kwiatów i grzybów, więcej ptaków.
- Góry, wulkany i jezioro za mapą odsunięte dalej, chmury nad całą mapą, ścieżki od Dworków do środka dłuższe.
- Kamerę można oddalić trochę bardziej niż wcześniej.
- Komputer szuka żelaza, kamienia i złota dalej od swojego Dworku i stawia tam kopalnie.
- Komputer dokupuje żelazo za złoto na Jarmarku, gdy go brakuje. Wcześniej w późnej grze miał tysiące złota,
  ale bez żelaza nie mógł robić lepszego wojska, więc gry komputer kontra komputer nie miały końca.

**Do sprawdzenia**
- Gra zaczęta wcześniej (na małej mapie) nie zginęła: przeszła do wersji 13 (Inne wersje gry → Wersja 13 → Graj dalej).
  Menu o tym przypomina.
- Gry komputer kontra komputer kończą się po 26–62 minutach. Wyjątek: gdy obie strony grają na łatwym, gra trwa ponad 2 godziny.
- Gracz, który nic nie robi, na łatwym przegrywa po 20–32 minutach.
- Czy na telefonie duża mapa działa płynnie (na komputerze tak).

Zapis w repozytorium: `1449d44`

## Wersja 13 (20.11.2026)

**Dodane**
- Nowa muzyka grana na prawdziwych instrumentach (w stylu muzyki średniowiecznej i celtyckiej), zamiast piszczącej muzyki
  z innych naszych gier. 8 utworów na licencji CC0 (spis autorów w `muzyka/ZRODLA.md`), razem około 38 MB;
  telefon wczytuje tylko utwór, który właśnie gra.
- Spokojne utwory grają na zmianę i nie powtarzają się po sobie. W kolejnych erach dochodzą nowe:
  targ (od 2. ery), żniwa (od 3.), uczta (od 4.).
- W czasie walki gra muzyka bitwy, a 15 sekund po walce wraca spokojny utwór (od miejsca, w którym przerwał).
- Przejścia między utworami są płynne (jeden cichnie, drugi narasta, 2,5 sekundy).

**Zmienione**
- Utwory nagrane różnie głośno gra wyrównuje, żeby żaden nie był za głośny ani za cichy.
- Głośność muzyki działa teraz także na iPhonie (wcześniej telefon mógł grać ją na cały regulator).

**Usunięte**
- Stara muzyka (wesoła, piszcząca) w tej grze. W innych naszych grach zostaje.

**Do sprawdzenia**
- Posłuchać na telefonie, czy muzyka nie męczy i czy nie zagłusza dźwięków walki.

Zapis w repozytorium: `45ccd86`

## Wersja 12 (20.11.2026)

**Dodane**
- Nagrane dźwięki (40 krótkich plików, razem około 0,5 MB), wszystkie na licencji CC0 (spis źródeł w `dzwieki/ZRODLA.md`):
  - walka: miecz o miecz, uderzenie w tarczę (tarczownicy, włócznicy, kijarze), świst procy i strzału z ambony, uderzenie kamyka,
  - praca: siekiera o drewno, kilof o kamień, stukanie młotka przy budowie, szelest krzaka przy zbieraniu jagód,
    odkładanie towaru, brzęk monet przy złocie,
  - budynki: kowadło w kuźni, walący się budynek, przewracające się drzewo, skrzypienie gotowego budynku, brama,
  - kroki ludzi, gdy kamera jest blisko.
- Dźwięk zależy od kamery: im bliżej środka ekranu i im bardziej przybliżone, tym głośniej;
  co dzieje się z lewej strony ekranu, słychać z lewej (z prawej: z prawej).

**Zmienione**
- Komputer w późnej grze sprzedaje nadmiar żelaza i drewna na Jarmarku i dokupuje jagody, gdy ich brakuje.

**Do sprawdzenia**
- Gry komputer kontra komputer trwają teraz zwykle 45–55 minut, a czasem dłużej: pod koniec obie strony mają
  Twierdze Jagodowe, których najsłabsze wojsko nie umie zburzyć.

Zapis w repozytorium: `1233575`

## Wersja 11 (20.11.2026)

**Dodane**
- Faktury rysowane przez kartę graficzną (bez dużych plików): słoje na balach i deskach, źdźbła na strzesze,
  rzędy gontów, cegły z jasnymi fugami, chropowaty kamień, liście w koronach drzew. Przy samej ziemi
  budynki, ludzie i drzewa są trochę ciemniejsi, więc lepiej „stoją”.
- Ruch: ludzie przebierają nogami i machają rękami, renifery i łosie idą kłusem, koła wozów, taranów
  i katapult się kręcą, drzewa, krzaki, trawa i kwiaty kołyszą się na wietrze.
- Efekty:
  - dym z kominów chatek i kuźni, iskry nad ogniem w kuźni,
  - uszkodzony budynek dymi, a mocno uszkodzony się pali,
  - zawalenie budynku: chmura pyłu i lecące odłamki,
  - kurz spod nóg, iskry przy uderzeniach, wióry spod siekiery, odłamki i iskry spod kilofa,
  - przewrócone drzewo sypie liśćmi, złoty błysk przy kursie wozu, fajerwerki przy nowej erze.
- Krajobraz za mapą: zalesione wzgórza, góry ze śniegiem, trzy kamczackie wulkany z dymem i jezioro.
  Przy oddalaniu kamera się pochyla i widać horyzont.
- Cienie chmur sunące po ziemi i klucze ptaków krążące nad doliną.

**Zmienione**
- Trawa z bliska jest ostra (drobna faktura źdźbeł), a nie rozmyta.

**Naprawione**
- Gdy zbieracz niósł złoto, gra próbowała narysować stosik złota na plecach i przestawała się rysować.

Zapis w repozytorium: `1705920`

## Wersja 10 (20.11.2026)

**Dodane**
- Tryby walki dla zaznaczonego wojska (przyciski w panelu, wybrany ma ✓):
  - 🛡️ Obrona: nie atakują pierwsi; gdy ktoś ich uderzy, oddają i wracają na swoje miejsce,
  - ⚔️ Agresja (na start): atakują wrogich żołnierzy i budynki, które strzelają (ambony, Dworek),
  - 🔥 Szał: rozwalają wszystko w okolicy (ludzi, wozy, każdy budynek) i gonią dalej.
- Ruiny: zburzony budynek zostawia popiół, osmalone belki i kamienie (bez placu budowy i bez odbudowy).
  W tym miejscu można postawić nowy budynek od zera; ruiny same znikają po 4 minutach.

**Zmienione**
- Komputer po stracie budynku czeka (dom 30 sekund, reszta 75 sekund), zanim postawi go od nowa,
  i nie stawia nic tam, gdzie stoi twoje wojsko (wcześniej od razu pojawiał się plac budowy z 0%).
- Przy dużej zaznaczonej grupie paski życia pokazują się tylko u rannych (nie zlewają się w zieloną plamę).

**Naprawione**
- Żołnierz, który stanął dokładnie na rogu budynku, nie mógł go uderzyć i stał w miejscu. Teraz uderza.

Zapis w repozytorium: `e584860`

## Wersja 9 (20.11.2026)

**Dodane**
- Złoto 🪙: piąty surowiec. Złote skały (po 400 złota) przy bazie i na środku mapy, ograniczona ilość.
  Złoto odnosi się do Kamieniołomu, Kopalni rudy albo Dworku. Potrzebne do ery 4, Rycerza na łosiu,
  Katapulty, Twierdzy Jagodowej i najlepszych ulepszeń w Kuźni.
- 🎪 Jarmark Jagodowy (era 2):
  - kupno i sprzedaż po 100 sztuk jagód, drewna, kamienia i żelaza za złoto; ceny zmieniają się po każdej
    transakcji (im więcej sprzedajesz, tym taniej skupują) i powoli wracają,
  - wozy kupieckie z reniferami: jeżdżą same między Jarmarkiem a twoim najdalszym spichlerzem albo Dworkiem
    i za każdy kurs przywożą złoto (nad Jarmarkiem widać „+12 🪙”). Im dalej Jarmark, tym więcej złota
    na minutę (w teście: 10 kroków od Dworku 43 złota na minutę, 45 kroków 82).
- Komputer też zbiera złoto, buduje Jarmark z wozami i sprzedaje nadmiar surowców.

**Zmienione**
- Dużo więcej kamienia: każda skała ma 700 kamienia zamiast 250, a na mapie są nowe kamieniołomy
  (kilka przy każdej bazie i bliżej środka). Razem prawie 7 razy więcej kamienia niż wcześniej.
- Zapisane gry wczytują się dalej (nowe złoża, które wypadłyby pod budynkiem, znikają).

Zapis w repozytorium: `6659187`

## Wersja 8 (20.11.2026)

**Dodane**
- Mury: w menu budowania „Palisada”. Przeciągnij palcem od początku do końca muru: widać odcinki
  (czerwone się nie zmieszczą) i koszt (5 drewna za odcinek). Zbieracze budują odcinki po kolei.
- Brama: twoi ludzie przez nią przechodzą, wrogowie muszą ją zburzyć albo obejść mur.
- Ulepszenia murów w Kamieniołomie (zmieniają wszystkie mury i bramy naraz):
  🧱 Mur z cegieł (era 3) i ⛓️ Mur ze stalowymi sztabami (era 4).
- Przytrzymanie palca na mapie przez 1 sekundę: od tego miejsca pojawia się ramka, która idzie za palcem;
  po puszczeniu zaznacza wszystkich twoich ludzi w ramce.
- Dwoma palcami można też obracać mapę (razem z przybliżaniem i przesuwaniem).
  Przycisk 🏡 wraca do Dworku i ustawia zwykły obrót.

Zapis w repozytorium: `c60e889`

## Wersja 7 (20.11.2026)

**Dodane**
- Rozbudowa ambon: dotknij ambony i wybierz „Rozbuduj”. Każda ambona rozbudowuje się osobno:
  - 🧱 Wieża z cegły (era 3, 150 kamienia i 50 drewna): 1300 życia, strzela mocniej, dalej i częściej,
  - 🏰 Twierdza Jagodowa (era 4, 300 kamienia i 100 żelaza): 2000 życia, najmocniejsza w dolinie.
  Każdy stopień ma swój wygląd: drewniana ambona, ceglana wieża z blankami, okrągła kamienna twierdza.
- Komputer też rozbudowuje swoje ambony.

**Zmienione**
- Ambony strzelają nie tylko do wrogich ludzi: gdy w zasięgu nie ma nikogo, strzelają w budynki wroga
  (także w place budowy postawione za blisko).

Zapis w repozytorium: `81bf8ab`

## Wersja 6 (20.11.2026)

**Dodane**
- 5 gatunków drzew: świerk, sosna, brzoza, dąb i modrzew. Każdy las ma swój główny gatunek
  (przy brzegach mapy głównie świerki), więc lasy są różne. Ścięte drzewo przewraca się w swoim kształcie.
- Ozdoby krajobrazu: kępy trawy, kwiaty (białe, żółte, fioletowe), paprocie, muchomory i borowiki,
  kamyki, zwalone kłody z mchem, krzaczki i borówki. Nie zasłaniają drogi i znikają spod stawianych budynków.
- Cienie pod ludzikami i zwierzętami.
- Klepisko z wydeptanej ziemi pod każdym budynkiem.

**Zmienione**
- Ziemia z większą ilością szczegółów: jaśniejsze polany, ciemniejsze niziny, wyschnięta trawa,
  ciemne runo pod lasami, żwir przy skałach, wydeptana kręta ścieżka od każdego Dworku do środka mapy.
- Niebo i mgła w oddali w jaśniejszych, cieplejszych kolorach.

Zapis w repozytorium: `ce59a25`

## Wersja 5 (20.11.2026)

**Dodane**
- Ulepszenia plecaka w Dworku: Plecak z łyka → Plecak skórzany → Plecak na stelażu (zbieracze niosą więcej).
- Stosiki na plecach (jak w Age of Yaceq, tylko mniejsze): koszyczki z jagodami, polana, kamienie albo ruda.
  Im więcej zbieracz niesie, tym wyższy stosik, najwyżej 8 sztuk.

**Zmienione**
- Wszystkie budynki w nowym, słowiańskim stylu (nasze projekty, dużo szczegółów):
  - Dom: chatka z bali pod strzechą, okiennice, komin, ławka i drewutnia.
  - Dworek Jagodowy: dwór z bali na kamiennej podmurówce, ganek na słupach, gontowy dach, dzwonniczka.
  - Spichlerz na palach z kamiennymi grzybkami, drabiną, koszami i workami.
  - Tartak to skład drewna: wiata, stosy bali, deski, kozioł z piłą, pniak z siekierą.
  - Kamieniołom z żurawiem i taczką; Kopalnia rudy z wejściem w skale, torami i wózkiem.
  - Plantacja z grządkami, płotkiem i strachem na wróble; Strażnica Krzaka z palisadą i kukłą do ćwiczeń;
    Strzelnica z tarczami na snopkach; Zagroda reniferów z wybiegiem i stogiem siana;
    Kuźnia z ogniem i kowadłem; Ambona na nogach z bali; Warsztat z wielkim kołem.
  - Kolor gracza widać na kalenicach z deskami na krzyż, okiennicach i chorągiewkach.
- W każdej skale z rudą jest teraz 450 żelaza zamiast 250 (żelaza brakowało w długich grach).

Zapis w repozytorium: `46b73d6`

## Wersja 4 (20.11.2026)

**Dodane**
- Burzenie własnych budynków: w panelu budynku przycisk 💥 „Zburz”. Trzeba dotknąć go 2 razy
  (najpierw pokazuje „Na pewno?”). Wraca połowa kosztu, a gdy budowa się jeszcze nie zaczęła, cały koszt.
  Jedynego Dworku nie da się zburzyć.
- Ścinanie drzew widać: przy pierwszym uderzeniu siekierą drzewo przewraca się na ziemię,
  pień robi się coraz mniejszy, a gdy drewno się skończy, zostaje pieniek.

**Zmienione**
- Nowe postacie: zaokrąglone zamiast kanciastych, z buzią (oczy, nosek, rumieńce), włosami,
  rękami, butami i paskiem; kapelusze, hełmy i kaptury też okrągłe.
- Renifery i łosie zaokrąglone, z oczami i uszami; jeźdźcy siedzą w siodle.
- Pień noszony na plecach jest mniejszy.

Zapis w repozytorium: `97bb208`

## Wersja 3 (20.11.2026)

**Zmienione**
- Ludziki nie kiwają się już całym ciałem. Zbieracz pracuje ręką z narzędziem:
  - jagody: sięga do krzaka i wkłada jagody do koszyka przy boku (tak samo na plantacji),
  - budowa: stuka młotkiem,
  - drewno: zamach siekierą,
  - kamień i ruda żelaza: kilof idzie w ruch nad głową.
- Wojsko przy uderzeniu robi krótki wypad do przodu zamiast kiwania.

Zapis w repozytorium: `9fb36e2`

## Wersja 2 (20.11.2026)

Pierwszy kawałek naszej własnej mapy ulepszeń, inspirowanej jagodą kamczacką.

**Dodane**
- Wybór wersji przy starcie; wersja 1 zostaje jako osobna kopia z własnym zapisem.
- 4 ery, które rosną jak krzak haskapu: 🌱 Sadzonka, 🌸 Kwitnienie, 🫐 Owocowanie, 🧺 Wielkie Zbiory.
- Żelazo ⛓️ zamiast złota: rdzawe skały z rudą i Kopalnia rudy żelaza (od ery 2).
- Awanse wojska: gdy zrobisz awans, cała linia awansuje (także ci, co już walczą).
  - Strażnica Krzaka: Kijarz → Tarczownik → Obrońca Sadu oraz Włócznik z leszczyny → Pikinier.
  - Strzelnica: Procarz → Procarz z żelaznymi kulkami → Kusznik.
  - Zagroda reniferów: Zwiadowca na reniferze → Jeździec na reniferze → Rycerz na łosiu.
  - Warsztat: Taran i (w erze 4) Katapulta, która rzuca zamrożonymi kulami z jagód.
- Ulepszenia:
  - Dworek: Rękawice zbieracza, Wiklinowy kosz → Taczka → Wózek jagodowy.
  - Spichlerz (plantacje): Ściółka → Nawadnianie → Odmiany mrozoodporne.
  - Tartak: Deski → Żelazna siekiera → Piła ramowa. Kamieniołom: Kilof → Żelazny kilof.
  - Kuźnia, po 3 stopnie: broń (drewniana, żelazna, stalowa), zbroja (wiklinowa, skórzana, kolczuga),
    pociski (gładkie kamyki, żelazne kulki, stalowe groty; działają też na Ambony).

**Zmienione**
- Nowe nazwy: Ratusz → Dworek Jagodowy, osadnik → zbieracz, koszary → Strażnica Krzaka,
  stajnia → Zagroda reniferów, wieża → Ambona, szopa górników → Kamieniołom, pole → Plantacja haskapu.
- Komputer lepiej dzieli pracę (mniej ludzi tam, gdzie zapasu jest dużo) i na łatwym poziomie
  nie wysyła całego wojska naraz.
- Zapisana gra z wersji 1 wczytuje się dalej (złoto zamienia się w żelazo).

**Usunięte**
- Stare ulepszenia z wersji 1 (koszyki, siekiery, kilofy, taczki, pługi, grube mury): zastąpiła je nowa mapa ulepszeń.
  Grube mury wrócą w Akademii Ogrodnika.

**Do sprawdzenia**
- Gra na telefonie: czy łatwo trafić w postacie i przyciski.

Zapis w repozytorium: `2a3e548`

## Wersja 1 (20.11.2026)

**Dodane**
- Dowodzisz osadnikami: dotknij osadnika, a potem krzaka z jagodami, drzewa, skały, placu budowy albo wroga.
  Dwa szybkie dotknięcia osadnika zaznaczają wszystkich takich samych na ekranie, przycisk ⬚ zaznacza ramką.
- Cztery surowce: jagody 🫐, drewno 🪵, kamień 🪨 i złoto 🪙. Osadnicy odnoszą je do ratusza albo do spichlerza,
  tartaku i szopy górników. Gdy krzaki się skończą, jagody dają pola.
- Budynki: dom, spichlerz, tartak, szopa górników, pole, koszary, strzelnica, stajnia, kuźnia, wieża, warsztat
  i drugi ratusz. Wybierasz budynek, przesuwasz go palcem i stawiasz; osadnicy go budują.
- Trzy ery w ratuszu: Osada, Wioska, Gród. Każda daje nowe budynki, wojsko i ulepszenia.
- Wojsko: wojownik z pałką, włócznik (mocny przeciw jeźdźcom), procarz (rzuca z daleka), jeździec i taran
  (burzy budynki). Ratusz i wieże same strzelają do wrogów.
- Ulepszenia: koszyki, siekiery, kilofy, taczki, pługi, lepsza broń i zbroje, grube mury.
- Osada komputera po drugiej stronie doliny: zbiera, buduje, przechodzi ery i atakuje. Trzy poziomy:
  łatwy (pierwszy atak po 12 minutach), średni i trudny. Wygrywa ten, kto zburzy ratusz przeciwnika.
- Mała mapa (dotknięcie przenosi widok), przesuwanie mapy palcem, przybliżanie dwoma palcami.
- Podpowiedzi u góry ekranu, co zrobić dalej; przycisk 🧑‍🌾 pokazuje wolnych osadników.
- Gra zapisuje się sama; w menu „Graj dalej”, „Nowa gra” i „Inne gry”.

Zapis w repozytorium: `494c596`
