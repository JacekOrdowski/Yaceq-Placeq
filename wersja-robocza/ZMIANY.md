# Historia wersji: Wersja robocza

Nowa gra, na razie bez zadań z matematyki: najpierw ma być po prostu grywalna. Wzór: Galaxy Defense: Fortress TD
(bez energii, reklam, zakupów i losowych skrzynek). Nazwa „Wersja robocza” jest tymczasowa.

Najnowsza wersja jest na górze. Numer wersji widać w grze, na dole menu.
Do każdej wersji można wrócić: przy każdej podany jest identyfikator zapisu w repozytorium (np. `7360c22`).
Gra jest pod adresem https://jacekordowski.github.io/Yaceq-Placeq/wersja-robocza/

---

## Wersja 4 (24 października 2026)

Zapis w repozytorium: `7360c22`

### Dodane
- **Żywe płomienie za meteorami:** ogon płonie i migocze (10 klatek, języki ognia falują i się kołyszą), a z meteorów
  sypią się iskry. Im szybciej meteor leci, tym dłuższy ma płomień. Spowolniony w polu ma krótki płomień.
  Iskry sypią się też z dołu Asteroidy.
- **Nowy wygląd pola zwalniającego:** świetlista ściana energii z plastrem miodu, który powoli przesuwa się w bok.
  Pojedyncze komórki rozbłyskują, wzdłuż ściany przesuwa się smuga światła, a krawędzie falują i biegną po nich iskry.
  Po obu stronach ekranu są nadajniki, które trzymają ścianę.

### Zmienione
- Mniej drobnych liczb obrażeń (bez „−1”, „−2”) i rzadziej napis „Wolniej”, żeby niebo było czytelniejsze.

### Do sprawdzenia
- Płynność na telefonie przy wielu meteorach. Sprawdzone w przeglądarce bez karty graficznej:
  nowe płomienie, iskry i pole prawie nie zmieniają płynności, najwięcej kosztuje sama liczba meteorów.

---

## Wersja 3 (24 października 2026)

Zapis w repozytorium: `ce162b8`

### Dodane
- **Sterowanie palcem:** Strażnik chodzi w lewo i w prawo tam, gdzie jest palec. Dotykać można w dowolnym miejscu ekranu,
  liczy się tylko lewo i prawo. Na komputerze działają strzałki albo klawisze A i D.
- **Meteory lecą falami:** z lewej, z prawej, na środek albo wszędzie naraz (fal „wszędzie naraz” jest więcej im dalej w bitwie).
  Rój meteorów też leci z jednej strony, a napis mówi z której.
- Strażnik sam robi się trochę silniejszy z każdym poziomem (o 4%), niezależnie od wybranych kart.
- Napis na początku bitwy: „Przesuwaj palcem w lewo i w prawo!”.

### Zmienione
- **Strażnik strzela prosto w górę** i już nie celuje sam. Pełna moc jest tylko na wprost. Dodatkowe lufy dają pociski obok,
  lekko rozchylone. Deszcz pocisków: co 4 sekundy wachlarz 10 pocisków (było co 3 sekundy 14).
- Strażnik strzela szybciej i mocniej (seria co 0,3 s zamiast 0,36 s, 18 obrażeń zamiast 15).
- **Wieżyczki obok są słabsze:** laser, działo, piorun, rakiety i połączenia zadają 40% tego co wcześniej. Pole zwalniające bez zmian.
- Meteory spadają prawie pionowo (wcześniej ukośnie).
- Pierwsza karta to dwie wieżyczki i jedno ulepszenie Strażnika (wcześniej trzy wieżyczki).
- Asteroida ma więcej życia (24 000 zamiast 16 000), bo Strażnik bije mocniej. Meteory na starcie są trochę słabsze.

### Do sprawdzenia
- Wyniki programu (3 sprawdzenia po 60 bitew na każdym etapie):
  - Strażnik stoi na środku: przegrywa praktycznie zawsze, nawet gdy wszystkie karty idą w wieżyczki
    (1 wygrana na 180 bitew etapu 1, poza tym ani jednej),
  - dobry gracz (rusza się co 0,2 s) i rozsądne karty: etap 1 97–100%, etap 5 85–95%,
  - dobry gracz i karty na chybił trafił: etap 1 77–85%, etap 5 25–35%,
  - słaby gracz (rusza się co 0,5 s i nie zawsze trafia w miejsce) i karty na chybił trafił: etap 1 68–77%, etap 5 32–37%.
- Czy palcem steruje się wygodnie i czy Strażnik nie chodzi za wolno albo za szybko.

---

## Wersja 2 (24 października 2026)

Zapis w repozytorium: `b1df586`

### Dodane
- **Generator pola widać przy pracy:** pierścień wokół jego głowicy i pasek na maszcie pokazują ładowanie, a tuż przed strzałem
  wpada do niego energia. Potem generator wystrzeliwuje świecący pocisk w górę, pole rozwija się od tego miejsca w obie strony,
  a na koniec gaśnie.
- Spowolnione meteory świecą na zielono i zostają wolniejsze jeszcze przez 3 sekundy po wyjściu z pola.
- Nowe ulepszenie pola: **Szybsze ładowanie** (generator ładuje się o 25% szybciej).
- W tabeli po bitwie pole pokazuje, ile meteorów spowolniło.
- Dźwięki generatora: ładowanie, strzał i rozwinięcie pola.

### Zmienione
- **Grunt jest niżej:** pod bazą został tylko wąski pasek, a nad nią jest więcej nieba, więc meteory widać wcześniej.
- **Pole spowalniające to teraz Pole zwalniające:** już nie parzy (nie zadaje obrażeń), za to mocniej zwalnia
  (o 70% zamiast 45%, z ulepszeniami do 85%), jest szersze, działa dłużej (5 s zamiast 3,5 s) i ładuje się krócej (3,5 s).
- **Dźwięk pioruna** to teraz trzask wyładowania elektrycznego: ostre trzaśnięcie, iskrzenie i brzęczenie łuku, w 3 odmianach.
- Meteory są trochę słabsze, żeby wyrównać brak obrażeń od pola.

### Usunięte
- Ulepszenie „Parzące pole”.

### Do sprawdzenia
- Jak brzmi nowy dźwięk pioruna na telefonie (sprawdzony tylko na wykresie dźwięku: trzask na początku, potem gasnące iskrzenie).
- Trudność według programu (60 bitew na etap): etap 1 95–97%, etap 3 67–92%, etap 5 42–47%, etap 6 15–45%.
  Pole się opłaca: na etapie 1 z polem wygrywa się tak samo często jak bez niego.

---

## Wersja 1 (24 października 2026)

Zapis w repozytorium: `bb29de7`

### Dodane
- **Bitwa:** z nieba spadają płonące meteory, a baza pod kopułą ma 3000 życia. Meteor, który doleci do kopuły, zabiera życie.
  Rodzaje: zwykłe meteory, szybkie czarne kryształy, twarde czerwone kryształy i duże meteory (dochodzą z czasem).
- **Strażnik:** robot w środku bazy, który sam strzela seriami pocisków w meteor najbliżej kopuły.
- **Poziomy i karty:** za zestrzelone meteory rośnie poziom. Na każdym poziomie gra staje i pokazuje 3 karty do wyboru:
  nową wieżyczkę albo ulepszenie. Pierwsza karta to zawsze wybór jednej z trzech wieżyczek. Raz na bitwę można wylosować inne karty.
- **5 wieżyczek** (na bazie są 4 miejsca, więc wszystkich naraz mieć się nie da):
  - **Laser:** zielony promień, który rani wszystko na swojej drodze,
  - **Pole spowalniające:** pas w poprzek nieba, w którym meteory zwalniają i tracą życie,
  - **Działo ogniowe:** pociski wybuchają i podpalają meteory dookoła,
  - **Wieża piorunów:** piorun skacze z meteoru na meteor,
  - **Wyrzutnia rakiet:** rakiety same lecą do najtwardszych meteorów.
- **Ulepszenia:** każda broń ma 4–5 ulepszeń. Każde to jedna gwiazdka. Po 4 gwiazdkach może wypaść karta **Super**
  (np. Deszcz pocisków, Laser bez przerwy, Pole na stałe, Bombardowanie, Burza, Wielka salwa).
- **Połączenia:** gdy są dwie pasujące wieżyczki, może wypaść karta połączenia (np. laser zadaje 2× większe obrażenia meteorom w polu).
- **Naprawa bazy:** gdy baza ma mniej niż 60% życia, może wypaść karta, która oddaje 30% życia.
- **Rój meteorów** co 35 sekund i **Asteroida** po 3,5 minuty: wielka płonąca planeta z 10 paskami życia, która powoli opada
  i wypluwa meteory. Trzeba ją zniszczyć, zanim spadnie na bazę.
- **Etapy:** wygrana otwiera następny etap. Każdy etap ma twardsze meteory i trochę więcej ich naraz.
- **Ekran wyniku:** czas, zestrzelone meteory, życie bazy i tabela, która broń zadała ile obrażeń.
- Liczby obrażeń nad meteorami, napis „Wolniej” w polu, wybuchy, pioruny, dym rakiet, trzęsienie ekranu.
- Przyciski pauzy i przyspieszenia gry (×1 / ×2), muzyka (utwory ze Śmierdzipachy) i dźwięki robione w kodzie.
- Ikonka do dodania gry do ekranu telefonu.
- Program `narzedzia/balans-robocza.js`, który rozgrywa setki bitew bez ekranu i sprawdza, ile z nich da się wygrać.

### Do sprawdzenia
- Czy dzieciom się podoba i czego im brakuje. W oryginale w czasie bitwy też nic się nie robi palcem, tylko wybiera karty.
- Trudność według programu (60 bitew na etap): etap 1 wygrywa prawie każdy (95–100%), etap 3 około 70–90%,
  etap 5 około 40%, etap 6 około 15–35%. Między bitwami nie ma jeszcze ulepszeń na stałe, więc wyższe etapy są naprawdę trudne.
- Płynność na starszych telefonach przy dużej liczbie meteorów (na komputerze 60 klatek na sekundę).
