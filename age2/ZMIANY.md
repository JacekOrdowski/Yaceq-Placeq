# Age of Haskap II: historia wersji

Gra działa pod adresem https://jacekordowski.github.io/Yaceq-Placeq/age2/

Nowa gra strategiczna. Pomysł gatunku jest wspólny dla wielu gier o erach (osadnicy, surowce, budowanie, wojsko),
ale nazwy, budynki, wygląd i liczby są nasze. Haskap to po japońsku jagoda kamczacka.

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
