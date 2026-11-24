# Jak zrobić grę z kolegami (tryb wieloosobowy)

Gra działa w przeglądarce na GitHub Pages, czyli bez własnego serwera. Kilka telefonów musi się jednak jakoś połączyć.

## Najprostszy sposób: telefon z telefonem przez internet (WebRTC)

1. Jeden gracz zakłada grę i dostaje krótki kod (np. `PERUN-4821`). Koledzy wpisują ten kod u siebie.
2. Do „przedstawienia” telefonów sobie nawzajem potrzebny jest mały pośrednik w internecie. Może to być
   darmowa usługa (np. PeerJS albo Firebase) albo nasz malutki serwer. Potem telefony rozmawiają już bezpośrednio.
3. Każdy telefon liczy całą grę sam. Wysyła tylko rozkazy, np. „osadnik 12 idzie do krzaka 340”
   albo „buduję Gontynę tu”. Wszystkie telefony wykonują te same rozkazy w tej samej chwili gry.
4. Żeby gra wszędzie wyglądała tak samo, losowanie w trakcie gry musi iść z jednego wspólnego ziarna
   (mapa już tak działa), a gra liczy się równymi krokami.

Co trzeba zmienić w grze:
- „strony” zamiast „gracz + komputery”: każda strona to człowiek albo komputer,
- wszystkie rozkazy z ekranu przechodzą przez jedną funkcję, która wysyła je też do kolegów,
- wspólne losowanie zamiast `Math.random()` w liczeniu gry,
- ekran „Załóż grę / Dołącz kodem” i czekanie na kolegów,
- gdy ktoś się rozłączy, jego stronę przejmuje komputer.

## Łatwiejszy początek: na jednym telefonie albo w jednej sieci Wi-Fi

- Dwie osoby na jednym tablecie (każdy ma swój róg mapy i gra się na zmianę) to mało roboty, ale mało wygody.
- Gra w tej samej sieci Wi-Fi (w domu) też potrzebuje pośrednika, ale może nim być komputer w domu.

Pomysł na kolejność: najpierw 2 osoby przez internet (kod gry), potem 3–4 osoby i drużyny.
