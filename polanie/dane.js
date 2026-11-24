// Age of Polan: liczby do strojenia (jednostki, budynki, ery, ulepszenia, bogowie, moce, poziomy trudności).
// Gra słowiańska (Polanie, około 1000 lat temu): bogowie, łaska, moce bogów, stwory z dawnych wierzeń i bohaterowie z podań.
// Nazwy wewnętrzne (np. 'ratusz' = Gród, 'koszary' = Dwór drużyny, 'szopa' = Kamieniołom, 'jagody' = żywność, 'zloto' = srebro)
// zostały z Age of Haskap, z którego gra wyrosła.

export const SUROWCE = ['jagody', 'drewno', 'kamien', 'zelazo', 'zloto'];
export const NAZWY_SUR = { jagody: 'żywność', drewno: 'drewno', kamien: 'kamień', zelazo: 'żelazo', zloto: 'srebro', laska: 'łaska' };
export const EMOJI_SUR = { jagody: '🌾', drewno: '🪵', kamien: '🪨', zelazo: '⛓️', zloto: '🪙', laska: '✨' };
export const ERY = ['', 'Czasy Plemion', 'Czasy Grodów', 'Czasy Bohaterów', 'Czasy Bogów'];
export const EMOJI_ERY = ['', '🪵', '🏯', '⚔️', '⚡'];
export const START = { jagody: 200, drewno: 200, kamien: 150, zelazo: 50, zloto: 50, laska: 0 };
export const MAKS_LUDNOSC = 100;

// atak: obrażenia jednego uderzenia; odstep: sekundy między uderzeniami; zasieg 0 = walczy wręcz
// linia + st: linia wojska i jej stopień (wyższy stopień daje awans w budynku, wtedy wszyscy z tej linii awansują)
// przeciw: mnożnik obrażeń przeciw całej linii (np. włócznicy przeciw reniferom); tylkoBudynki: atakuje tylko budynki
// oblezenie: pełne obrażenia budynkom także z daleka (katapulta)
const RENIFERY = { renifer: 3 };
export const JEDNOSTKI = {
  osadnik: { nazwa: 'Osadnik', emoji: '🧑‍🌾', hp: 25, atak: 3, pancerz: 0, zasieg: 0, odstep: 1.5, szybkosc: 2.0, r: 0.32, wzrok: 4,
    koszt: { jagody: 50 }, czas: 15, era: 1, z: 'ratusz', opis: 'Zbiera, buduje i modli się w Gontynie' },
  // Dwór drużyny: piechota
  wojownik: { nazwa: 'Wojak z maczugą', emoji: '🏏', linia: 'piechota', st: 1, hp: 45, atak: 5, pancerz: 1, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.34, wzrok: 6, wojsko: true,
    koszt: { jagody: 50, drewno: 20 }, czas: 14, era: 1, z: 'koszary', opis: 'Tani i mocny na początek' },
  tarczownik: { nazwa: 'Tarczownik', emoji: '🛡️', linia: 'piechota', st: 2, hp: 60, atak: 6, pancerz: 2, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.36, wzrok: 6, wojsko: true,
    koszt: { jagody: 55, zelazo: 20 }, czas: 14, era: 2, z: 'koszary', awans: 'aw_tarczownik', opis: 'Z tarczą, trudno go zranić' },
  obronca: { nazwa: 'Drużynnik', emoji: '⚔️', linia: 'piechota', st: 3, hp: 75, atak: 8, pancerz: 3, zasieg: 0, odstep: 1.3, szybkosc: 2.1, r: 0.37, wzrok: 6, wojsko: true,
    koszt: { jagody: 60, zelazo: 30 }, czas: 14, era: 3, z: 'koszary', awans: 'aw_obronca', opis: 'Najsilniejszy piechur z drużyny księcia' },
  wlocznik: { nazwa: 'Włócznik', emoji: '🔱', linia: 'wlocznia', st: 1, hp: 45, atak: 3, pancerz: 0, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.34, wzrok: 6, wojsko: true, przeciw: RENIFERY,
    koszt: { jagody: 35, drewno: 25 }, czas: 13, era: 1, z: 'koszary', opis: 'Bardzo mocny przeciw jeźdźcom' },
  pikinier: { nazwa: 'Rohatyniarz', emoji: '🔱', linia: 'wlocznia', st: 2, hp: 55, atak: 4, pancerz: 1, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.35, wzrok: 6, wojsko: true, przeciw: { renifer: 3.5 },
    koszt: { jagody: 35, drewno: 25, zelazo: 10 }, czas: 13, era: 3, z: 'koszary', awans: 'aw_pikinier', opis: 'Ciężka włócznia (rohatyna): jeszcze mocniejszy przeciw jeźdźcom' },
  // strzelnica: proca i kusza
  procarz: { nazwa: 'Procarz', emoji: '🎯', linia: 'proca', st: 1, hp: 30, atak: 4, pancerz: 0, zasieg: 5.5, odstep: 1.8, szybkosc: 2.2, r: 0.32, wzrok: 7, wojsko: true,
    koszt: { jagody: 30, drewno: 40 }, czas: 13, era: 2, z: 'strzelnica', opis: 'Rzuca kamykami z daleka' },
  procarz2: { nazwa: 'Łucznik', emoji: '🏹', linia: 'proca', st: 2, hp: 32, atak: 5, pancerz: 0, zasieg: 6, odstep: 1.8, szybkosc: 2.2, r: 0.32, wzrok: 7.5, wojsko: true,
    koszt: { jagody: 30, drewno: 35, zelazo: 10 }, czas: 13, era: 2, z: 'strzelnica', awans: 'aw_procarz2', opis: 'Łuk strzela dalej i mocniej niż proca' },
  kusznik: { nazwa: 'Łucznik drużyny', emoji: '🏹', linia: 'proca', st: 3, hp: 35, atak: 6, pancerz: 0, zasieg: 7, odstep: 2.0, szybkosc: 2.2, r: 0.33, wzrok: 8, wojsko: true,
    koszt: { jagody: 25, drewno: 45, zelazo: 20 }, czas: 14, era: 3, z: 'strzelnica', awans: 'aw_kusznik', opis: 'Łuk refleksyjny: strzela najdalej i najmocniej' },
  // Stajnia: jazda na koniach (nazwa linii 'renifer' została z Age of Haskap)
  zwiadowca: { nazwa: 'Zwiadowca na koniu', emoji: '🐎', linia: 'renifer', st: 1, hp: 60, atak: 4, pancerz: 0, zasieg: 0, odstep: 1.5, szybkosc: 3.8, r: 0.48, wzrok: 8, wojsko: true,
    koszt: { jagody: 80 }, czas: 12, era: 2, z: 'stajnia', opis: 'Bardzo szybki, dobry na osadników' },
  jezdziec: { nazwa: 'Jeździec', emoji: '🐎', linia: 'renifer', st: 2, hp: 100, atak: 8, pancerz: 2, zasieg: 0, odstep: 1.6, szybkosc: 3.5, r: 0.48, wzrok: 6, wojsko: true,
    koszt: { jagody: 70, zelazo: 50 }, czas: 16, era: 3, z: 'stajnia', awans: 'aw_jezdziec', opis: 'Szybki i silny' },
  rycerz: { nazwa: 'Pancerny', emoji: '🏇', linia: 'renifer', st: 3, hp: 140, atak: 11, pancerz: 3, zasieg: 0, odstep: 1.6, szybkosc: 3.3, r: 0.55, wzrok: 6, wojsko: true,
    koszt: { jagody: 80, zelazo: 50, zloto: 30 }, czas: 18, era: 4, z: 'stajnia', awans: 'aw_rycerz', opis: 'Ciężka jazda w kolczugach, jak drużyna Mieszka' },
  // warsztat
  taran: { nazwa: 'Taran', emoji: '🪵', linia: 'taran', st: 1, hp: 180, atak: 30, pancerz: 3, pancerzDystans: 12, zasieg: 0, odstep: 3, szybkosc: 1.2, r: 0.7, wzrok: 6, wojsko: true, tylkoBudynki: true,
    koszt: { drewno: 160, zelazo: 75 }, czas: 20, era: 3, z: 'warsztat', opis: 'Burzy budynki, nie walczy z ludźmi' },
  katapulta: { nazwa: 'Katapulta', emoji: '🪨', linia: 'katapulta', st: 1, hp: 90, atak: 16, pancerz: 0, pancerzDystans: 6, zasieg: 8.5, odstep: 4.5, szybkosc: 1.0, r: 0.7, wzrok: 9, wojsko: true, oblezenie: true,
    koszt: { drewno: 200, zelazo: 100, zloto: 60 }, czas: 25, era: 4, z: 'warsztat', opis: 'Rzuca kamieniami, burzy budynki z daleka' },
  // Targowisko: wóz kupiecki z koniem jeździ sam między Targowiskiem a twoim spichlerzem (albo Grodem) i przywozi srebro
  woz: { nazwa: 'Wóz kupiecki', emoji: '🛒', hp: 70, atak: 0, pancerz: 0, zasieg: 0, odstep: 99, szybkosc: 2.6, r: 0.55, wzrok: 4, kupiec: true,
    koszt: { drewno: 100, jagody: 50 }, czas: 15, era: 2, z: 'jarmark', opis: 'Wozi towar do spichlerza i z powrotem: im dalej, tym więcej srebra' },
  // Kuźnia: rzemieślnik sam szuka uszkodzonych budynków i naprawia je za twoje surowce (NAPRAWA niżej)
  rzemieslnik: { nazwa: 'Rzemieślnik', emoji: '🔨', hp: 35, atak: 2, pancerz: 1, zasieg: 0, odstep: 1.5, szybkosc: 2.1, r: 0.32, wzrok: 5, naprawia: true,
    koszt: { jagody: 60, zelazo: 20 }, czas: 15, era: 2, z: 'kuznia', opis: 'Sam naprawia uszkodzone budynki za twoje surowce' },

  // ---------- stwory (z Gontyny, za łaskę; każdy od swojego boga: bog) ----------
  // mit: stwór (bohaterowie biją go 3 razy mocniej); burzy: ile razy mocniej niszczy budynki; wampir: część zadanych ran leczy jemu;
  // lata: unosi się nad ziemią (wygląd)
  rarog: { nazwa: 'Raróg', emoji: '🔥', mit: true, bog: 'dazbog', lata: 1.4, hp: 95, atak: 9, pancerz: 1, zasieg: 6, odstep: 1.8, szybkosc: 3.0, r: 0.45, wzrok: 9, wojsko: true,
    koszt: { jagody: 100, laska: 20 }, czas: 20, era: 2, z: 'gontyna', opis: 'Ognisty ptak: lata i strzela ogniem z góry' },
  leszy: { nazwa: 'Leszy', emoji: '🌳', mit: true, bog: 'mokosz', burzy: 3, hp: 280, atak: 14, pancerz: 2, zasieg: 0, odstep: 2.2, szybkosc: 1.7, r: 0.62, wzrok: 7, wojsko: true,
    koszt: { jagody: 150, drewno: 60, laska: 25 }, czas: 30, era: 2, z: 'gontyna', opis: 'Duch puszczy, olbrzym z drzewa: burzy budynki' },
  wilkolak: { nazwa: 'Wilkołak', emoji: '🐺', mit: true, bog: 'jarylo', hp: 160, atak: 12, pancerz: 1, zasieg: 0, odstep: 1.1, szybkosc: 3.7, r: 0.45, wzrok: 9, wojsko: true,
    koszt: { jagody: 120, laska: 20 }, czas: 20, era: 2, z: 'gontyna', opis: 'Szybki i groźny, poluje na osadników i strzelców' },
  planetnik: { nazwa: 'Płanetnik', emoji: '⛈️', mit: true, bog: 'strzybog', lata: 0.6, burzy: 3, hp: 130, atak: 11, pancerz: 1, zasieg: 7.5, odstep: 2.4, szybkosc: 2.2, r: 0.42, wzrok: 10, wojsko: true,
    koszt: { jagody: 130, zloto: 20, laska: 30 }, czas: 25, era: 3, z: 'gontyna', opis: 'Duch chmur: rzuca gradem z daleka, mocno w budynki' },
  zmij: { nazwa: 'Żmij', emoji: '🐉', mit: true, bog: 'swarozyc', lata: 1.2, hp: 230, atak: 16, pancerz: 2, zasieg: 5, odstep: 2.1, szybkosc: 2.9, r: 0.55, wzrok: 9, wojsko: true,
    koszt: { jagody: 180, zloto: 40, laska: 35 }, czas: 30, era: 3, z: 'gontyna', opis: 'Ognisty skrzydlaty wąż: zieje ogniem' },
  rusalka: { nazwa: 'Rusałka', emoji: '💧', mit: true, bog: 'lada', hp: 110, atak: 11, pancerz: 1, zasieg: 6.5, odstep: 1.7, szybkosc: 2.6, r: 0.38, wzrok: 9, wojsko: true, leczy: 4,
    koszt: { jagody: 110, laska: 25 }, czas: 20, era: 3, z: 'gontyna', opis: 'Wodna panna: czaruje wodą i leczy swoich wokół' },
  kon: { nazwa: 'Biały Koń Świętowita', emoji: '🐴', mit: true, bog: 'swietowit', linia: 'kon', hp: 320, atak: 18, pancerz: 3, zasieg: 0, odstep: 1.5, szybkosc: 4.2, r: 0.6, wzrok: 9, wojsko: true,
    koszt: { jagody: 200, laska: 40 }, czas: 30, era: 4, z: 'gontyna', opis: 'Święty koń z Arkony: najszybszy i bardzo silny' },
  strzyga: { nazwa: 'Strzyga', emoji: '🧛', mit: true, bog: 'marzanna', wampir: 0.5, hp: 240, atak: 17, pancerz: 2, zasieg: 0, odstep: 1.4, szybkosc: 3.0, r: 0.45, wzrok: 8, wojsko: true,
    koszt: { jagody: 180, laska: 35 }, czas: 30, era: 4, z: 'gontyna', opis: 'Nocny upiór: każde uderzenie leczy jej rany' },
  bies: { nazwa: 'Bies', emoji: '👹', mit: true, bog: 'trzyglow', burzy: 2, hp: 400, atak: 22, pancerz: 3, zasieg: 0, odstep: 1.8, szybkosc: 2.6, r: 0.62, wzrok: 8, wojsko: true,
    koszt: { jagody: 220, zloto: 50, laska: 45 }, czas: 35, era: 4, z: 'gontyna', opis: 'Rogaty demon z Bieszczad: najsilniejszy ze stworów' },
  // ---------- bohaterowie z podań (w Grodzie, każdego tylko jeden; stwory biją 3 razy mocniej) ----------
  krak: { nazwa: 'Krak', emoji: '👑', bohater: true, hp: 230, atak: 12, pancerz: 3, zasieg: 0, odstep: 1.3, szybkosc: 2.4, r: 0.38, wzrok: 8, wojsko: true,
    koszt: { jagody: 150, zloto: 60 }, czas: 20, era: 2, z: 'ratusz', opis: 'Książę, pogromca smoka: 3 razy mocniej bije stwory' },
  waligora: { nazwa: 'Waligóra', emoji: '💪', bohater: true, hp: 340, atak: 16, pancerz: 4, zasieg: 0, odstep: 1.4, szybkosc: 2.3, r: 0.45, wzrok: 8, wojsko: true,
    koszt: { jagody: 200, zloto: 100 }, czas: 20, era: 3, z: 'ratusz', opis: 'Siłacz, co góry przewraca: 3 razy mocniej bije stwory' },
  lech: { nazwa: 'Lech', emoji: '🦅', bohater: true, hp: 420, atak: 20, pancerz: 5, zasieg: 0, odstep: 1.3, szybkosc: 2.5, r: 0.4, wzrok: 9, wojsko: true,
    koszt: { jagody: 250, zloto: 150 }, czas: 20, era: 4, z: 'ratusz', opis: 'Założyciel Gniezna z białym orłem: 3 razy mocniej bije stwory' },
};
// naprawa przez rzemieślnika: pełna naprawa kosztuje połowę ceny budynku i trwa dwa razy dłużej niż jego budowa
export const NAPRAWA = { koszt: 0.5, wolniej: 2 };
// liczby nowszych ulepszeń (rodzaje jak w znanych grach o erach, nazwy i liczby nasze)
export const EFEKTY = { murarze: 0.15, budowniczowie: 0.15, budowa: 1.25, umocnienieZycie: 1.25, umocnienieAtak: 2, umocnienieZasieg: 2, blanki: 1.25,
  wrzatek: 2, wrzatekDyst: 3, lunety: 1.5, ogniste: 2, pobor: 1.25, inzynierowie: 1.25, zaprzeg: 1.2, monety: 1.2, wagiKupno: 0.9, wagiSprzedaz: 0.75, podatek: 0.5, szyb: 1.2 };

// rodzaje map do wyboru przy nowej grze (nazwy i wygląd nasze); motyw = kolory ziemi, gatunki drzew i ozdoby;
// lasy = ile lasów w porównaniu z Doliną
export const MAPY = {
  dolina: { nazwa: 'Dolina Warty', emoji: '🌳', motyw: 'lato', lasy: 1, opis: 'Łąki, lasy i krzaki nad Wartą, gdzie mieszkali Polanie. Spokojna mapa na początek.' },
  jezioro: { nazwa: 'Jezioro Gopło', emoji: '🏞️', motyw: 'lato', lasy: 0.8, opis: 'Na środku wielkie jezioro, jak Gopło z podania o Popielu, którego zjadły myszy. Do wroga idzie się dookoła brzegu; na brzegu ruda żelaza i kamień.' },
  rzeka: { nazwa: 'Wisła z brodami', emoji: '🌊', motyw: 'lato', lasy: 0.85, opis: 'Wielka rzeka dzieli osady. Przejść można tylko przez płytkie brody, a te łatwo obsadzić.' },
  przelecze: { nazwa: 'Bieszczady', emoji: '⛰️', motyw: 'lato', lasy: 0.9, opis: 'Góry, w których według podań mieszkały biesy i czady. Każda osada stoi w kotlinie z dwoma wąskimi wyjściami. Dobra mapa do obrony.' },
  puszcza: { nazwa: 'Prastara Puszcza', emoji: '🌲', motyw: 'puszcza', lasy: 1, opis: 'Dom leszego: wszędzie las, tylko kręte przesieki i polany. Drewna nie zabraknie, ale wróg może przyjść z każdej strony.' },
  tundra: { nazwa: 'Kraina Marzanny', emoji: '❄️', motyw: 'zima', lasy: 0.5, opis: 'Zima bogini Marzanny: śnieg, świerki i zamarznięte jeziora, po których da się chodzić (ale nie budować). Mało lasu, więcej rudy i kamienia.' },
  jotunheim: { nazwa: 'Tatry', emoji: '🏔️', motyw: 'zima', lasy: 1.6, opis: 'Wysokie ośnieżone góry, ciemne lasy świerkowe i lodowate jeziora. Wojsko przechodzi dolinami między szczytami.' },
  oaza: { nazwa: 'Pustynia Błędowska', emoji: '🏜️', motyw: 'piasek', lasy: 0.15, opis: 'Nasza polska pustynia: piaski i mało drzew. Sosny rosną przy stawach, najwięcej przy wielkim stawie na środku.' },
  bagna: { nazwa: 'Bagna Biebrzy', emoji: '🐸', motyw: 'bagno', lasy: 0.75, opis: 'Mnóstwo małych stawów i trzcin, dużo krzaków z jagodami. Tu mieszkają topielce i błędne ogniki. Drogi kręcą się między wodą.' },
};

// w: rozmiar w kratkach (budynek zajmuje w × w); ludnosc: o ile więcej mieszkańców; skup: jakie surowce przyjmuje
// strzela: budynek sam strzela do wrogów; pole: można po nim chodzić, zbieracz zbiera na nim jagody bez końca
export const BUDYNKI = {
  ratusz: { nazwa: 'Gród', emoji: '🏯', w: 4, hp: 1400, koszt: { drewno: 275, kamien: 100 }, czas: 80, era: 2, ludnosc: 5,
    skup: ['jagody', 'drewno', 'kamien', 'zelazo'], strzela: { atak: 3, zasieg: 6.5, odstep: 2 }, opis: 'Szkoli osadników i bohaterów, tu przechodzisz do nowej ery i wybierasz boga' },
  dom: { nazwa: 'Chata', emoji: '🏠', w: 2, hp: 250, koszt: { drewno: 30 }, czas: 15, era: 1, ludnosc: 5, opis: 'Miejsce dla 5 mieszkańców' },
  spichlerz: { nazwa: 'Spichlerz', emoji: '🧺', w: 3, hp: 400, koszt: { drewno: 100 }, czas: 20, era: 1, skup: ['jagody'], opis: 'Tu osadnicy odnoszą żywność, tu ulepszasz zagony' },
  tartak: { nazwa: 'Drwalnia', emoji: '🪚', w: 3, hp: 400, koszt: { drewno: 100 }, czas: 20, era: 1, skup: ['drewno'], opis: 'Tu osadnicy odnoszą drewno' },
  szopa: { nazwa: 'Kamieniołom', emoji: '🪨', w: 3, hp: 400, koszt: { drewno: 100 }, czas: 20, era: 1, skup: ['kamien', 'zloto'], opis: 'Tu osadnicy odnoszą kamień i srebro' },
  kopalnia: { nazwa: 'Dymarka', emoji: '⛏️', w: 3, hp: 450, koszt: { drewno: 125, kamien: 25 }, czas: 25, era: 2, skup: ['zelazo', 'zloto'], opis: 'Tu osadnicy odnoszą rudę darniową i srebro; w piecu wytapia się żelazo' },
  jarmark: { nazwa: 'Targowisko', emoji: '🎪', w: 3, hp: 700, koszt: { drewno: 175 }, czas: 35, era: 2, opis: 'Kupuj i sprzedawaj za srebro, szkol wozy kupieckie' },
  pole: { nazwa: 'Zagon prosa', emoji: '🌾', w: 3, hp: 150, koszt: { drewno: 60 }, czas: 10, era: 1, pole: true, wymaga: 'spichlerz', opis: 'Żywność bez końca, pracuje 1 osadnik' },
  koszary: { nazwa: 'Dwór drużyny', emoji: '🛡️', w: 3, hp: 700, koszt: { drewno: 150 }, czas: 30, era: 1, opis: 'Szkoli wojaków i włóczników' },
  strzelnica: { nazwa: 'Strzelnica', emoji: '🎯', w: 3, hp: 600, koszt: { drewno: 175 }, czas: 30, era: 2, wymaga: 'koszary', opis: 'Proca i kusza: szkoli strzelców' },
  stajnia: { nazwa: 'Stajnia', emoji: '🐎', w: 3, hp: 600, koszt: { drewno: 175 }, czas: 30, era: 2, wymaga: 'koszary', opis: 'Szkoli zwiadowców, jeźdźców i pancernych' },
  kuznia: { nazwa: 'Kuźnia', emoji: '⚒️', w: 3, hp: 600, koszt: { drewno: 150 }, czas: 30, era: 2, opis: 'Ulepsza broń, zbroje i pociski, szkoli rzemieślników' },
  wieza: { nazwa: 'Strażnica', emoji: '🗼', w: 2, hp: 800, koszt: { drewno: 50, kamien: 125 }, czas: 40, era: 2, strzela: { atak: 5, zasieg: 7.5, odstep: 1.6 }, opis: 'Sama strzela do wrogów' },
  mur: { nazwa: 'Częstokół', emoji: '🪵', w: 1, hp: 250, koszt: { drewno: 5 }, czas: 4, era: 1, mur: true, opis: 'Ściana z zaostrzonych pali: przeciągnij palcem linię' },
  brama: { nazwa: 'Brama', emoji: '🚪', w: 1, hp: 400, koszt: { drewno: 60 }, czas: 14, era: 1, brama: true, opis: 'Szeroka na 4 kratki; w murze sama się wpasowuje. Otwarta przepuszcza twoich, wrogów nigdy' },
  gontyna: { nazwa: 'Gontyna', emoji: '🛕', w: 3, hp: 650, koszt: { drewno: 120, kamien: 30 }, czas: 30, era: 1, gontyna: true,
    opis: 'Świątynia z posągiem boga: osadnicy modlą się tu o łaskę ✨, tu przychodzą stwory' },
  warsztat: { nazwa: 'Warsztat', emoji: '🛠️', w: 3, hp: 600, koszt: { drewno: 200 }, czas: 35, era: 3, wymaga: 'kuznia', opis: 'Buduje tarany i katapulty' },
};
// rozbudowa strażnicy (w samej strażnicy): każdy stopień ma więcej życia, strzela dalej, mocniej i częściej
export const WIEZA_POZIOMY = [null,
  { nazwa: 'Strażnica', emoji: '🗼', hp: 800, atak: 5, zasieg: 7.5, odstep: 1.6 },
  { nazwa: 'Wieża z kamienia', emoji: '🧱', hp: 1300, atak: 7, zasieg: 8.5, odstep: 1.4, era: 3, koszt: { kamien: 150, drewno: 50 }, czas: 40, opis: 'Grube kamienne ściany, strzela dalej i mocniej' },
  { nazwa: 'Gródek warowny', emoji: '🏰', hp: 2000, atak: 10, zasieg: 9.5, odstep: 1.2, era: 4, koszt: { kamien: 300, zelazo: 100, zloto: 100 }, czas: 60, opis: 'Najmocniejsza wieża w całej krainie' },
];
export const KOLEJNOSC_BUDYNKOW = ['dom', 'spichlerz', 'tartak', 'szopa', 'kopalnia', 'pole', 'koszary', 'gontyna', 'mur', 'brama', 'strzelnica', 'stajnia', 'kuznia', 'jarmark', 'wieza', 'warsztat', 'ratusz'];
// handel na Targowisku: kupno i sprzedaż po 100 sztuk; ceny w srebrze zmieniają się po każdej transakcji i powoli wracają
export const HANDEL = { ilosc: 100, ceny: { jagody: 100, drewno: 100, kamien: 120, zelazo: 150 }, sprzedaz: 0.6, zmiana: 0.06,
  // zysk z kursu wozu rośnie szybciej niż odległość, więc dalekie Targowisko daje więcej srebra na minutę
  zyskWozu: d => 0.2 * d + 0.02 * d * d };
// mury i bramy: częstokół → wał grodowy → wał z kamieniem (ulepszenia w Kamieniołomie zmieniają wszystkie naraz)
export const MUR_POZIOMY = [null,
  { mur: 'Częstokół', brama: 'Brama drewniana', hpMur: 250, hpBrama: 400 },
  { mur: 'Wał grodowy', brama: 'Brama w wale', hpMur: 600, hpBrama: 800 },
  { mur: 'Wał z kamieniem', brama: 'Brama okuta żelazem', hpMur: 1000, hpBrama: 1200 },
];

// przejście do nowej ery: w Grodzie (z wyborem jednego z dwóch bogów); potrzeba surowców i kilku budynków z poprzedniej ery
export const NOWA_ERA = {
  2: { koszt: { jagody: 500 }, czas: 60, budynki: 2 },
  3: { koszt: { jagody: 800, zelazo: 200 }, czas: 75, budynki: 2 },
  4: { koszt: { jagody: 1000, zelazo: 400, zloto: 200 }, czas: 120, budynki: 2 },
};
// budynki, które liczą się do przejścia do nowej ery (domy i plantacje się nie liczą)
export const LICZA_DO_ERY = ['spichlerz', 'tartak', 'szopa', 'kopalnia', 'koszary', 'gontyna', 'strzelnica', 'stajnia', 'kuznia', 'jarmark', 'wieza', 'warsztat'];

// ulepszenia; wymaga: najpierw inne ulepszenie; awans: po ulepszeniu cała linia wojska awansuje na tę jednostkę
export const ULEPSZENIA = {
  // Gród
  rekawice: { nazwa: 'Skórzane rękawice', emoji: '🧤', z: 'ratusz', era: 1, koszt: { jagody: 50, drewno: 25 }, czas: 20, opis: 'Osadnicy mają więcej życia' },
  kosz: { nazwa: 'Wiklinowy kosz', emoji: '🧺', z: 'ratusz', era: 1, koszt: { jagody: 75, drewno: 50 }, czas: 20, opis: 'Osadnicy niosą więcej naraz' },
  taczka: { nazwa: 'Taczka', emoji: '🛒', z: 'ratusz', era: 2, wymaga: 'kosz', koszt: { jagody: 150, drewno: 75 }, czas: 30, opis: 'Niosą jeszcze więcej i chodzą szybciej' },
  plecak1: { nazwa: 'Plecak z łyka', emoji: '🎒', z: 'ratusz', era: 1, koszt: { jagody: 60, drewno: 40 }, czas: 20, opis: 'Osadnicy niosą o 2 więcej' },
  plecak2: { nazwa: 'Plecak skórzany', emoji: '🎒', z: 'ratusz', era: 2, wymaga: 'plecak1', koszt: { jagody: 125, drewno: 75 }, czas: 30, opis: 'Niosą jeszcze o 3 więcej' },
  plecak3: { nazwa: 'Plecak na stelażu', emoji: '🎒', z: 'ratusz', era: 3, wymaga: 'plecak2', koszt: { jagody: 200, drewno: 100, zelazo: 40 }, czas: 40, opis: 'Niosą jeszcze o 4 więcej' },
  wozek: { nazwa: 'Wózek z koniem', emoji: '🛻', z: 'ratusz', era: 3, wymaga: 'taczka', koszt: { jagody: 250, drewno: 150, zelazo: 50 }, czas: 40, opis: 'Najwięcej naraz i najszybciej' },
  // Spichlerz: zagony
  sciolka: { nazwa: 'Ściółka', emoji: '🍂', z: 'spichlerz', era: 1, koszt: { jagody: 75, drewno: 75 }, czas: 20, opis: 'Zagony dają o 15% więcej żywności' },
  nawadnianie: { nazwa: 'Nawadnianie', emoji: '💧', z: 'spichlerz', era: 2, wymaga: 'sciolka', koszt: { jagody: 150, drewno: 125 }, czas: 30, opis: 'Zagony: jeszcze o 15% więcej' },
  mrozoodporne: { nazwa: 'Radło z żelaznym lemieszem', emoji: '⚒️', z: 'spichlerz', era: 3, wymaga: 'nawadnianie', koszt: { jagody: 250, drewno: 150 }, czas: 40, opis: 'Zagony: jeszcze o 20% więcej' },
  // Tartak
  deski: { nazwa: 'Deski', emoji: '🪵', z: 'tartak', era: 1, koszt: { jagody: 100, drewno: 50 }, czas: 20, opis: 'Drewno zbiera się o 15% szybciej' },
  siekiera_z: { nazwa: 'Żelazna siekiera', emoji: '🪓', z: 'tartak', era: 2, wymaga: 'deski', koszt: { jagody: 150, zelazo: 50 }, czas: 30, opis: 'Drewno: jeszcze o 20% szybciej' },
  pila: { nazwa: 'Piła ramowa', emoji: '🪚', z: 'tartak', era: 3, wymaga: 'siekiera_z', koszt: { jagody: 250, zelazo: 100 }, czas: 40, opis: 'Drewno: jeszcze o 20% szybciej' },
  // Kamieniołom
  kilof: { nazwa: 'Kilof', emoji: '⛏️', z: 'szopa', era: 1, koszt: { jagody: 100, drewno: 75 }, czas: 20, opis: 'Kamień zbiera się o 20% szybciej' },
  mur_cegla: { nazwa: 'Wał grodowy', emoji: '⛰️', z: 'szopa', era: 3, koszt: { kamien: 200, drewno: 100 }, czas: 45, opis: 'Wszystkie częstokoły i bramy stają się wałem z ziemi i drewna' },
  mur_stal: { nazwa: 'Wał z kamieniem', emoji: '🪨', z: 'szopa', era: 4, wymaga: 'mur_cegla', koszt: { kamien: 300, zelazo: 150 }, czas: 60, opis: 'Wały obłożone kamieniem, bramy okute żelazem: najmocniejsze' },
  szyb: { nazwa: 'Szyb z drabinami', emoji: '🕳️', z: 'szopa', era: 3, wymaga: 'kilof_z', koszt: { jagody: 250, drewno: 150, zelazo: 75 }, czas: 40, opis: 'Kamień, ruda i srebro: jeszcze o 20% szybciej' },
  kilof_z: { nazwa: 'Żelazny kilof', emoji: '⛏️', z: 'szopa', era: 2, wymaga: 'kilof', koszt: { jagody: 150, zelazo: 50 }, czas: 30, opis: 'Kamień, ruda i srebro o 20% szybciej' },
  // Kuźnia: broń, zbroje, pociski (po 3 stopnie)
  bron1: { nazwa: 'Drewniana broń', emoji: '🪵', z: 'kuznia', era: 2, koszt: { jagody: 150 }, czas: 30, opis: 'Wojsko walczące wręcz: +1 do ataku' },
  bron2: { nazwa: 'Żelazna broń', emoji: '🗡️', z: 'kuznia', era: 3, wymaga: 'bron1', koszt: { jagody: 200, zelazo: 100 }, czas: 40, opis: 'Wręcz: jeszcze +1 do ataku' },
  bron3: { nazwa: 'Stalowa broń', emoji: '⚔️', z: 'kuznia', era: 4, wymaga: 'bron2', koszt: { jagody: 300, zelazo: 150, zloto: 100 }, czas: 50, opis: 'Wręcz: jeszcze +2 do ataku' },
  zbroja1: { nazwa: 'Wiklinowa zbroja', emoji: '🧺', z: 'kuznia', era: 2, koszt: { jagody: 100, drewno: 50 }, czas: 30, opis: 'Całe wojsko: +1 do pancerza' },
  zbroja2: { nazwa: 'Skórzana zbroja', emoji: '🦺', z: 'kuznia', era: 3, wymaga: 'zbroja1', koszt: { jagody: 200, zelazo: 75 }, czas: 40, opis: 'Całe wojsko: jeszcze +1 do pancerza' },
  zbroja3: { nazwa: 'Kolczuga', emoji: '🛡️', z: 'kuznia', era: 4, wymaga: 'zbroja2', koszt: { jagody: 300, zelazo: 125, zloto: 100 }, czas: 50, opis: 'Całe wojsko: jeszcze +2 do pancerza' },
  pociski1: { nazwa: 'Gładkie kamyki', emoji: '🪨', z: 'kuznia', era: 2, koszt: { jagody: 100, drewno: 50 }, czas: 30, opis: 'Strzelcy, Strażnice i Gród: +1 do ataku' },
  pociski2: { nazwa: 'Żelazne kulki', emoji: '⚫', z: 'kuznia', era: 3, wymaga: 'pociski1', koszt: { jagody: 150, zelazo: 75 }, czas: 40, opis: 'Strzelcy i Strażnice: +1 do ataku i dalej' },
  pociski3: { nazwa: 'Stalowe groty', emoji: '🏹', z: 'kuznia', era: 4, wymaga: 'pociski2', koszt: { jagody: 250, zelazo: 100, zloto: 100 }, czas: 50, opis: 'Strzelcy i Strażnice: +1 do ataku i jeszcze dalej' },
  // Gród: umocnienia i budowanie
  umocnienie: { nazwa: 'Umocniony Gród', emoji: '🏰', z: 'ratusz', era: 2, koszt: { drewno: 200, kamien: 200 }, czas: 40, opis: 'Grody: +25% życia, strzelają 2 razy mocniej i o 2 kratki dalej' },
  murarze: { nazwa: 'Murarze', emoji: '🧱', z: 'ratusz', era: 2, koszt: { jagody: 150, kamien: 100 }, czas: 30, opis: 'Wszystkie budynki (bez murów): +15% życia' },
  budowniczowie: { nazwa: 'Mistrzowie budowy', emoji: '📐', z: 'ratusz', era: 3, wymaga: 'murarze', koszt: { jagody: 250, kamien: 150, zelazo: 50 }, czas: 40, opis: 'Budynki: jeszcze +15% życia i stawiają się o 25% szybciej' },
  // Strażnica (ulepsza wszystkie strażnice naraz)
  blanki: { nazwa: 'Blanki', emoji: '🏯', z: 'wieza', era: 2, koszt: { drewno: 100, kamien: 100 }, czas: 30, opis: 'Strażnice i Grody strzelają o 25% mocniej' },
  wrzatek: { nazwa: 'Wrzątek z kotła', emoji: '🫕', z: 'wieza', era: 3, wymaga: 'blanki', koszt: { jagody: 200, drewno: 150 }, czas: 35, opis: 'Wrogowie tuż przy Strażnicy (do 3 kratek) dostają 2 razy więcej' },
  lunety: { nazwa: 'Lunety', emoji: '🔭', z: 'wieza', era: 3, koszt: { drewno: 150, kamien: 100, zelazo: 25 }, czas: 35, opis: 'Strażnice i Grody strzelają o 1,5 kratki dalej' },
  // Kuźnia: pociski na budynki
  ogniste: { nazwa: 'Płonące pociski', emoji: '🔥', z: 'kuznia', era: 3, koszt: { jagody: 200, drewno: 150 }, czas: 40, opis: 'Strzelcy i Strażnice niszczą budynki 2 razy szybciej' },
  // szkolenie wojska i machiny
  pobor: { nazwa: 'Pobór', emoji: '📯', z: 'koszary', era: 2, koszt: { jagody: 150, zelazo: 50 }, czas: 30, opis: 'Wojsko we wszystkich budynkach szkoli się o 25% szybciej' },
  inzynierowie: { nazwa: 'Inżynierowie', emoji: '🔧', z: 'warsztat', era: 3, koszt: { jagody: 200, drewno: 200, zelazo: 50 }, czas: 40, opis: 'Katapulty: +25% ataku' },
  zaprzeg: { nazwa: 'Zaprzęg koni', emoji: '🐎', z: 'stajnia', era: 3, koszt: { jagody: 200, drewno: 100 }, czas: 35, opis: 'Katapulty i wozy kupieckie jeżdżą o 20% szybciej' },
  // Targowisko: handel
  monety: { nazwa: 'Siekane srebro', emoji: '🪙', z: 'jarmark', era: 2, koszt: { jagody: 150, drewno: 100 }, czas: 30, opis: 'Wozy kupieckie przywożą o 20% więcej srebra' },
  wagi: { nazwa: 'Uczciwe wagi', emoji: '⚖️', z: 'jarmark', era: 3, koszt: { jagody: 200, drewno: 100, zloto: 50 }, czas: 35, opis: 'Na Targowisku kupujesz o 10% taniej i dostajesz więcej za sprzedaż' },
  poborcy: { nazwa: 'Danina', emoji: '💰', z: 'jarmark', era: 3, koszt: { jagody: 250, drewno: 150 }, czas: 40, opis: 'Każdy Gród sam przynosi srebro (1 sztuka co 2 sekundy)' },
  // Spichlerz: zbieranie z krzaków (jak psy myśliwskie: jedzenie spoza pól)
  bartnictwo: { nazwa: 'Bartnictwo', emoji: '🍯', z: 'spichlerz', era: 1, koszt: { jagody: 100, drewno: 50 }, czas: 20, opis: 'Krzaki dają żywność o 15% szybciej' },
  // Kuźnia: tarcze (pancerz przeciw strzałom) i wyważone pociski
  tarcze1: { nazwa: 'Tarcze z łozy', emoji: '🛡️', z: 'kuznia', era: 2, koszt: { jagody: 100, drewno: 75 }, czas: 30, opis: 'Całe wojsko: +1 pancerza przeciw strzałom i kamieniom' },
  tarcze2: { nazwa: 'Tarcze obite skórą', emoji: '🛡️', z: 'kuznia', era: 3, wymaga: 'tarcze1', koszt: { jagody: 200, zelazo: 75 }, czas: 40, opis: 'Przeciw strzałom: jeszcze +1 pancerza' },
  tarcze3: { nazwa: 'Tarcze okute żelazem', emoji: '🛡️', z: 'kuznia', era: 4, wymaga: 'tarcze2', koszt: { jagody: 300, zelazo: 125, zloto: 75 }, czas: 50, opis: 'Przeciw strzałom: jeszcze +2 pancerza' },
  balistyka: { nazwa: 'Wyważone strzały', emoji: '🎯', z: 'kuznia', era: 3, koszt: { drewno: 200, zloto: 100 }, czas: 40, wzmocni: { strzelcy: true, atak: 1.15 }, opis: 'Strzelcy trafiają mocniej: +15% ataku' },
  // mistrzowie linii (era 4): ostatni stopień każdej linii wojska
  mistrz_piechoty: { nazwa: 'Mistrzowie piechoty', emoji: '🎖️', z: 'koszary', era: 4, wymaga: 'aw_obronca', koszt: { jagody: 400, zelazo: 250, zloto: 100 }, czas: 40, wzmocni: { linie: ['piechota', 'wlocznia'], hp: 1.15, atak: 1.15 }, opis: 'Piechota i włócznicy: +15% życia i ataku' },
  mistrz_strzelcow: { nazwa: 'Mistrzowie łuku', emoji: '🎖️', z: 'strzelnica', era: 4, wymaga: 'aw_kusznik', koszt: { jagody: 300, drewno: 250, zloto: 100 }, czas: 40, wzmocni: { linie: ['proca'], hp: 1.15, atak: 1.15 }, opis: 'Łucznicy: +15% życia i ataku' },
  mistrz_jazdy: { nazwa: 'Mistrzowie jazdy', emoji: '🎖️', z: 'stajnia', era: 4, wymaga: 'aw_rycerz', koszt: { jagody: 400, zelazo: 200, zloto: 150 }, czas: 40, wzmocni: { linie: ['renifer'], hp: 1.15, atak: 1.15 }, opis: 'Jazda: +15% życia i ataku' },
  // ---------- ulepszenia od bogów (w Gontynie, tylko gdy masz tego boga) ----------
  // bogowie główni
  topor_peruna: { nazwa: 'Topór Peruna', emoji: '🪓', z: 'gontyna', bog: 'perun', era: 2, koszt: { zloto: 100, laska: 15 }, czas: 30, wzmocni: { wojskoWrecz: true, atak: 1.1 }, opis: 'Wojsko walczące wręcz: +10% ataku' },
  stada_welesa: { nazwa: 'Stada Welesa', emoji: '🐄', z: 'gontyna', bog: 'weles', era: 1, koszt: { jagody: 150, laska: 10 }, czas: 30, opis: 'Zagony dają o 15% więcej żywności' },
  kuznia_swaroga: { nazwa: 'Kuźnia Swaroga', emoji: '⚒️', z: 'gontyna', bog: 'swarog', era: 2, koszt: { zloto: 150, laska: 20 }, czas: 20, opis: 'Ulepszenia w Kuźni robią się o połowę szybciej' },
  // bogowie pomniejsi: jedno ulepszenie stwora i jedno ze świata boga
  zlote_piora: { nazwa: 'Złote pióra', emoji: '🔥', z: 'gontyna', bog: 'dazbog', era: 2, koszt: { drewno: 150, laska: 15 }, czas: 30, wzmocni: { typy: ['rarog'], hp: 1.25, atak: 1.2 }, opis: 'Raróg: +25% życia, +20% ataku' },
  dar_slonca: { nazwa: 'Dar słońca', emoji: '☀️', z: 'gontyna', bog: 'dazbog', era: 2, koszt: { jagody: 150, laska: 10 }, czas: 30, opis: 'Srebro zbiera się o 20% szybciej' },
  prastary_leszy: { nazwa: 'Prastary Leszy', emoji: '🌳', z: 'gontyna', bog: 'mokosz', era: 2, koszt: { drewno: 200, laska: 20 }, czas: 30, wzmocni: { typy: ['leszy'], hp: 1.3, atak: 1.2 }, opis: 'Leszy: +30% życia, +20% ataku' },
  len_mokoszy: { nazwa: 'Len i przędza', emoji: '🧶', z: 'gontyna', bog: 'mokosz', era: 2, koszt: { jagody: 100, drewno: 100, laska: 10 }, czas: 30, opis: 'Osadnicy niosą o 3 więcej' },
  wilcza_wataha: { nazwa: 'Wilcza wataha', emoji: '🐺', z: 'gontyna', bog: 'jarylo', era: 2, koszt: { jagody: 150, laska: 15 }, czas: 30, wzmocni: { typy: ['wilkolak'], szybkosc: 1.2, atak: 1.2 }, opis: 'Wilkołak: +20% szybkości i ataku' },
  jare_zboze: { nazwa: 'Jare zboże', emoji: '🌱', z: 'gontyna', bog: 'jarylo', era: 2, koszt: { jagody: 200, laska: 10 }, czas: 30, opis: 'Osadnicy szkolą się w Grodzie o 25% szybciej' },
  gradowe_chmury: { nazwa: 'Gradowe chmury', emoji: '⛈️', z: 'gontyna', bog: 'strzybog', era: 3, koszt: { zloto: 150, laska: 20 }, czas: 30, wzmocni: { typy: ['planetnik'], zasieg: 2, atak: 1.2 }, opis: 'Płanetnik: o 2 kratki dalej, +20% ataku' },
  wiatr_w_plecy: { nazwa: 'Wiatr w plecy', emoji: '🌬️', z: 'gontyna', bog: 'strzybog', era: 3, koszt: { jagody: 150, drewno: 100, laska: 10 }, czas: 30, wzmocni: { typy: ['woz', 'osadnik'], szybkosc: 1.15 }, opis: 'Osadnicy i wozy kupieckie chodzą o 15% szybciej' },
  ognisty_oddech: { nazwa: 'Ognisty oddech', emoji: '🐉', z: 'gontyna', bog: 'swarozyc', era: 3, koszt: { zloto: 200, laska: 25 }, czas: 35, wzmocni: { typy: ['zmij'], hp: 1.2, atak: 1.25 }, opis: 'Żmij: +20% życia, +25% ataku' },
  swiety_zar: { nazwa: 'Święty żar', emoji: '🔥', z: 'gontyna', bog: 'swarozyc', era: 3, koszt: { drewno: 150, kamien: 100, laska: 15 }, czas: 30, opis: 'Strażnice: +25% życia' },
  piesn_rusalek: { nazwa: 'Pieśń rusałek', emoji: '💧', z: 'gontyna', bog: 'lada', era: 3, koszt: { jagody: 200, laska: 20 }, czas: 30, wzmocni: { typy: ['rusalka'], hp: 1.2, leczy: 3 }, opis: 'Rusałka: +20% życia, leczy prawie 2 razy mocniej' },
  kupala: { nazwa: 'Noc Kupały', emoji: '🔥', z: 'gontyna', bog: 'lada', era: 3, koszt: { jagody: 150, drewno: 100 }, czas: 30, opis: 'Modlitwa daje o 20% więcej łaski' },
  wrozba_konia: { nazwa: 'Wróżba z konia', emoji: '🐴', z: 'gontyna', bog: 'swietowit', era: 4, koszt: { jagody: 250, laska: 25 }, czas: 35, wzmocni: { typy: ['kon'], hp: 1.2, atak: 1.2 }, opis: 'Biały Koń: +20% życia i ataku' },
  arkonska_druzyna: { nazwa: 'Arkońska drużyna', emoji: '🏇', z: 'gontyna', bog: 'swietowit', era: 4, koszt: { jagody: 250, zloto: 150, laska: 15 }, czas: 35, wzmocni: { jazda: true, atak: 1.1 }, opis: 'Jazda: +10% ataku' },
  upiorna_noc: { nazwa: 'Upiorna noc', emoji: '🧛', z: 'gontyna', bog: 'marzanna', era: 4, koszt: { zloto: 200, laska: 25 }, czas: 35, wzmocni: { typy: ['strzyga'], hp: 1.15, wampir: 0.3 }, opis: 'Strzyga: +15% życia i jeszcze mocniej leczy się uderzeniami' },
  zimowe_futra: { nazwa: 'Zimowe futra', emoji: '🧥', z: 'gontyna', bog: 'marzanna', era: 4, koszt: { jagody: 300, zloto: 100, laska: 15 }, czas: 40, wzmocni: { wojsko: true, hp: 1.1 }, opis: 'Całe wojsko: +10% życia' },
  bies_z_nawii: { nazwa: 'Bies z Nawii', emoji: '👹', z: 'gontyna', bog: 'trzyglow', era: 4, koszt: { zloto: 250, laska: 25 }, czas: 35, wzmocni: { typy: ['bies'], hp: 1.25, atak: 1.2 }, opis: 'Bies: +25% życia, +20% ataku' },
  trzy_swiaty: { nazwa: 'Strażnik trzech światów', emoji: '🗻', z: 'gontyna', bog: 'trzyglow', era: 4, koszt: { zloto: 200, laska: 20 }, czas: 35, wzmocni: { mit: true, pancerz: 1 }, opis: 'Wszystkie stwory: +1 pancerza' },
  // awanse wojska
  aw_tarczownik: { nazwa: 'Awans: Tarczownik', emoji: '🛡️', z: 'koszary', era: 2, koszt: { jagody: 150, zelazo: 50 }, czas: 20, awans: 'tarczownik', opis: 'Wszyscy wojacy dostają tarcze' },
  aw_obronca: { nazwa: 'Awans: Drużynnik', emoji: '⚔️', z: 'koszary', era: 3, wymaga: 'aw_tarczownik', koszt: { jagody: 250, zelazo: 150 }, czas: 30, awans: 'obronca', opis: 'Tarczownicy stają się drużynnikami' },
  aw_pikinier: { nazwa: 'Awans: Rohatyniarz', emoji: '🔱', z: 'koszary', era: 3, koszt: { jagody: 200, zelazo: 100 }, czas: 30, awans: 'pikinier', opis: 'Włócznicy dostają ciężkie rohatyny' },
  aw_procarz2: { nazwa: 'Awans: Łucznik', emoji: '🏹', z: 'strzelnica', era: 2, koszt: { jagody: 125, zelazo: 50 }, czas: 20, awans: 'procarz2', opis: 'Procarze dostają łuki' },
  aw_kusznik: { nazwa: 'Awans: Łucznik drużyny', emoji: '🏹', z: 'strzelnica', era: 3, wymaga: 'aw_procarz2', koszt: { jagody: 250, zelazo: 125 }, czas: 30, awans: 'kusznik', opis: 'Łucznicy dostają łuki refleksyjne' },
  aw_jezdziec: { nazwa: 'Awans: Jeździec', emoji: '🐎', z: 'stajnia', era: 3, koszt: { jagody: 250, zelazo: 150 }, czas: 30, awans: 'jezdziec', opis: 'Zwiadowcy dostają zbroje' },
  aw_rycerz: { nazwa: 'Awans: Pancerny', emoji: '🏇', z: 'stajnia', era: 4, wymaga: 'aw_jezdziec', koszt: { jagody: 400, zelazo: 200, zloto: 150 }, czas: 40, awans: 'rycerz', opis: 'Jeźdźcy dostają kolczugi i silniejsze konie' },
};

// tempo zbierania (na sekundę) i ile zbieracz niesie naraz
export const ZBIERANIE = { jagody: 0.8, drewno: 0.65, kamien: 0.55, zelazo: 0.5, zloto: 0.45, pole: 0.5 };
export const UDZWIG = 10;
// ile jest w jednym drzewie, krzaku, skale
export const ZAPAS = { drzewo: 100, krzak: 125, kamien: 700, ruda: 450, zloto: 400 };

// poziomy trudności (komputer): tempo zbierania, kiedy pierwszy atak (sekundy), ile wojska w kolejnych atakach,
// ilu zbieraczy w kolejnych erach, ile ambon
export const TRUDNOSC = {
  latwy: { nazwa: 'Łatwy', zbieranie: 0.7, pierwszyAtak: 720, fala: n => 4 + 2 * n, maksFala: n => 5 + 3 * n, odstep: 240, osadnicy: [0, 14, 20, 24, 26], wieze: 1 },
  sredni: { nazwa: 'Średni', zbieranie: 1.0, pierwszyAtak: 480, fala: n => 6 + 3 * n, odstep: 180, osadnicy: [0, 18, 26, 32, 36], wieze: 2 },
  trudny: { nazwa: 'Trudny', zbieranie: 1.3, pierwszyAtak: 360, fala: n => 8 + 4 * n, odstep: 150, osadnicy: [0, 22, 32, 40, 44], wieze: 3 },
};

// ================= bogowie, łaska i moce (słowiańskie wierzenia; opis w MITOLOGIA.md) =================
// łaska ✨: osadnik modlący się przy Gontynie daje `modlitwa` łaski na sekundę; najwięcej można mieć `maks`
export const LASKA = { modlitwa: 0.1, maks: 200, zaWroga: 1, modlacychNaGontyne: 6 };
// bogowie główni (wybór przy nowej grze) i pomniejsi (wybór przy wejściu w erę 2, 3 i 4: jeden z dwóch, zależnie od głównego)
// moc: moc boga (raz na grę), stwor: stwór z Gontyny, bonus: co bóg daje od razu (opis)
export const BOGOWIE = {
  perun: { nazwa: 'Perun', emoji: '⚡', glowny: true, kim: 'bóg piorunów, burzy i wojny', moc: 'grom', ery: { 2: ['dazbog', 'jarylo'], 3: ['swarozyc', 'strzybog'], 4: ['swietowit', 'trzyglow'] },
    bonus: 'Wojsko walczące wręcz: +1 do ataku. Za każdego pokonanego wroga: +1 łaski.' },
  weles: { nazwa: 'Weles', emoji: '🐍', glowny: true, kim: 'bóg bydła, bogactwa, czarów i zaświatów', moc: 'czady', ery: { 2: ['mokosz', 'jarylo'], 3: ['lada', 'strzybog'], 4: ['marzanna', 'trzyglow'] },
    bonus: 'Modlitwa daje o 25% więcej łaski. Wozy kupieckie przywożą o 20% więcej srebra.' },
  swarog: { nazwa: 'Swaróg', emoji: '🔨', glowny: true, kim: 'bóg nieba, ognia i kowali', moc: 'ogien', ery: { 2: ['dazbog', 'mokosz'], 3: ['swarozyc', 'lada'], 4: ['swietowit', 'marzanna'] },
    bonus: 'Całe wojsko: +1 do pancerza. Budynki: +10% życia.' },
  dazbog: { nazwa: 'Dażbóg', emoji: '☀️', era: 2, kim: 'słońce, dawca bogactwa', moc: 'slonce', stwor: 'rarog', bonus: 'Osadnicy niosą o 2 więcej.' },
  mokosz: { nazwa: 'Mokosz', emoji: '🌾', era: 2, kim: 'Matka Ziemia, urodzaj i przędza', moc: 'urodzaj', stwor: 'leszy', bonus: 'Krzaki i zagony dają o 15% więcej żywności.' },
  jarylo: { nazwa: 'Jaryło', emoji: '🌱', era: 2, kim: 'wiosna i młoda siła', moc: 'wiosna', stwor: 'wilkolak', bonus: 'Wojsko chodzi o 10% szybciej.' },
  strzybog: { nazwa: 'Strzybóg', emoji: '🌪️', era: 3, kim: 'bóg wiatrów', moc: 'wichura', stwor: 'planetnik', bonus: 'Strzelcy strzelają o 1 kratkę dalej.' },
  swarozyc: { nazwa: 'Swarożyc', emoji: '🔥', era: 3, kim: 'ogień, syn Swaroga', moc: 'swietyOgien', stwor: 'zmij', bonus: 'Gród i Strażnice strzelają o 25% mocniej.' },
  lada: { nazwa: 'Łada', emoji: '💐', era: 3, kim: 'zgoda, miłość i wiosenne święta', moc: 'zgoda', stwor: 'rusalka', bonus: 'Modlitwa daje o 20% więcej łaski.' },
  swietowit: { nazwa: 'Świętowit', emoji: '🐎', era: 4, kim: 'czterolicy bóg wojny i wróżb z Arkony', moc: 'rog', stwor: 'kon', bonus: 'Jazda: +20% życia.' },
  marzanna: { nazwa: 'Marzanna', emoji: '❄️', era: 4, kim: 'bogini zimy i śmierci', moc: 'mroz', stwor: 'strzyga', bonus: 'Stwory: +15% życia.' },
  trzyglow: { nazwa: 'Trzygłów', emoji: '🗻', era: 4, kim: 'trzy głowy: niebo, ziemia i podziemie', moc: 'drzenie', stwor: 'bies', bonus: 'Stwory: +2 do ataku.' },
};
export const BOGOWIE_GLOWNI = ['perun', 'weles', 'swarog'];
// bohaterowie rosną w siłę z każdą erą po swojej (o tyle więcej życia i ataku na erę)
export const BOHATER_ERA = 0.15;
// moce bogów: każdą można użyć raz w grze; cel: trzeba dotknąć miejsca na mapie; r: promień (kratki); czas: jak długo działa (s)
export const MOCE = {
  grom: { nazwa: 'Grom Peruna', emoji: '⚡', cel: true, r: 4, piorunow: 7, rana: 70, ranaBud: 220, opis: 'Pioruny walą w wybrane miejsce' },
  czady: { nazwa: 'Czady z Bieszczad', emoji: '🌫️', cel: true, r: 5, czas: 16, naSek: 7, opis: 'Trujący dym rani wrogów w okolicy' },
  ogien: { nazwa: 'Ogień Swaroga', emoji: '☄️', cel: true, r: 3.5, ranaBud: 700, rana: 60, opis: 'Ogień z nieba spada na budynki wroga' },
  slonce: { nazwa: 'Złote Słońce', emoji: '☀️', czas: 60, razy: 2, opis: 'Przez minutę osadnicy zbierają 2 razy szybciej' },
  urodzaj: { nazwa: 'Urodzaj Mokoszy', emoji: '🌾', dar: { jagody: 700, drewno: 300 }, opis: 'Od razu 700 żywności i 300 drewna' },
  wiosna: { nazwa: 'Wiosna Jaryły', emoji: '🌱', opis: 'Leczy całe twoje wojsko i naprawia budynki o połowę' },
  wichura: { nazwa: 'Wichura Strzyboga', emoji: '🌪️', cel: true, r: 6, rana: 30, odrzut: 5, opis: 'Wiatr rani wrogów i rozrzuca ich na boki' },
  swietyOgien: { nazwa: 'Święty Ogień', emoji: '🔥', czas: 40, razy: 1.5, opis: 'Twoje wojsko przez 40 sekund bije o połowę mocniej' },
  zgoda: { nazwa: 'Zgoda Łady', emoji: '💐', cel: true, r: 7, czas: 20, opis: 'Wrogowie w okolicy przez 20 sekund nie walczą' },
  rog: { nazwa: 'Róg Świętowita', emoji: '📯', cel: true, ilu: 5, jednostka: 'rycerz', opis: 'W wybranym miejscu zjawia się 5 pancernych' },
  mroz: { nazwa: 'Mróz Marzanny', emoji: '❄️', cel: true, r: 6, czas: 12, rana: 30, opis: 'Wrogowie zamarzają na 12 sekund' },
  drzenie: { nazwa: 'Drżenie ziemi', emoji: '🗻', cel: true, r: 7, czesc: 0.45, opis: 'Ziemia drży: budynki wroga tracą prawie połowę życia' },
};
