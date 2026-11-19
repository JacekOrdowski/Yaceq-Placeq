# Age of Yaceq: historia wersji

Gra działa pod adresem https://jacekordowski.github.io/Yaceq-Placeq/age/

Nowa gra zbudowana na silniku Yaceq Survival. Budujesz miasto tam, gdzie chcesz, a w ratuszu przechodzisz do kolejnych er.
Pomysł na ery wzięty z gier strategicznych, ale wygląd, budynki i nazwy są nasze.

## Wersja 4 (19.11.2026)

**Zmienione**
- Budynki można stawiać na całym placu, aż do dolnego brzegu brązowej ziemi (w wersji 3 trzeba było
  zostawić pas przy ladach). Poza placem gra napisze „Tylko na placu: niżej chodzą klienci”.

## Wersja 3 (19.11.2026)

**Zmienione**
- Budynki można stawiać też na dole placu, przy targu (wcześniej gra pisała „Tylko w środku palisady”,
  choć miejsce było wolne). Trzeba tylko zostawić drogę klientom: tuż przy ladach gra powie „Za blisko targu”.
  Uwaga: budynek na dole placu zajmuje miejsce, na którym mogłaby stanąć lada.
- Strzałka prowadzi dookoła końca palisady do lady postawionej tuż przy nim (wcześniej kazała iść wzdłuż płotu).

Zapis w repozytorium: `c73900c`

## Wersja 2 (19.11.2026)

**Dodane**
- Przybliżanie i oddalanie: uszczypnięcie dwoma palcami (rozsuwanie = bliżej, zsuwanie = dalej),
  a na komputerze kółko myszy. Gra pamięta ostatnie ustawienie.
- Uszczypnięcie nie rusza Yaceqa ani przesuwanego budynku: chodzenie wraca, gdy podniesiesz oba palce.

Zapis w repozytorium: `2fe813a`

## Wersja 1 (19.11.2026)

**Dodane**
- Ratusz na środku bazy. Pole przed ratuszem podnosi erę: Era 1 Osada, Era 2 Wioska
  (Era 3 Miasteczko i Era 4 Miasto będą w następnych wersjach).
- Przycisk „🔨 Buduj” u góry po lewej. W menu są budynki, które można teraz postawić (polecany ma gwiazdkę),
  a niżej te, które przyjdą później, z informacją, czego brakuje.
- Stawianie gdzie chcesz: po wyborze budynku pojawia się jego półprzezroczysty kształt. Przesuwasz go palcem,
  zielony = można, czerwony = nie można (gra mówi dlaczego), a „Postaw tutaj” zamienia go w plac budowy.
  - Zwykłe budynki stoją w środku palisady.
  - Lady stoją na targu (rząd przy drodze klientów).
  - Domki stoją na osiedlach po bokach targu, nie na drodze klientów do lady.
  - Nie można zastawić bramy ani taśmociągu.
- Taśmociąg sam łączy przetwórnię z ladą prostą linią. Jeśli coś stoi na drodze, menu mówi co,
  i trzeba to zburzyć albo nosić samemu.
- Burzenie: w menu „Buduj” przycisk „Zburz”, potem dotknięcie budynku. Wraca połowa kosztu
  (drewno, kamień i deski do magazynu), a z placu budowy połowa tego, co już wniesiono.
- Przycisk „Inne gry” w menu.

**Zmienione (w porównaniu z Yaceq Survival 13)**
- Baza na start jest trochę większa, a kamieniołom stoi dalej na wschód.
- Taśmociągi nie są potrzebne do dalszych budynków (bo mogą być zablokowane).
- Wózek z kamieniem na razie zniknął: wróci jako kolejka na stalowych torach w Erze 4.
- Jedna kraina (Dolina Yaceqa), zapis postępu osobny od Yaceq Survival.
- Robot przechodzi całą grę w około 108 minut.

**Do sprawdzenia**
- Czy przesuwanie budynku palcem jest wygodne na telefonie.
- Czy na targu wystarcza miejsca, gdy dziecko rozstawia lady z dużymi odstępami (można zburzyć i postawić ciaśniej).

Zapis w repozytorium: `f40d885`
