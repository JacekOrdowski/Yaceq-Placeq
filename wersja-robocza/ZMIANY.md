# Historia wersji: Wersja robocza

Nowa gra, na razie bez zadań z matematyki: najpierw ma być po prostu grywalna. Wzór: Galaxy Defense: Fortress TD
(bez energii, reklam, zakupów i losowych skrzynek). Nazwa „Wersja robocza” jest tymczasowa.

Najnowsza wersja jest na górze. Numer wersji widać w grze, na dole menu.
Gra jest pod adresem https://jacekordowski.github.io/Yaceq-Placeq/wersja-robocza/

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
