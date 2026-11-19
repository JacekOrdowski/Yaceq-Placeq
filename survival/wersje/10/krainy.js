// Yaceq Survival: przedmioty, zwierzęta, narzędzia, bronie i krainy (wszystkie liczby do strojenia są tutaj).

// cena = ile płaci klient za sztukę (mnożona przez "ceny" krainy i przez rynek)
export const PRZEDMIOTY = {
  jagody:     { nazwa: 'Jagody kamczackie', cena: 2 },
  dzem:       { nazwa: 'Dżem jagodowy', cena: 5 },
  drozdzowka: { nazwa: 'Drożdżówka z jagodami', cena: 9 },
  drewno:     { nazwa: 'Drewno', cena: 2 },
  kamien:     { nazwa: 'Kamień', cena: 3 },
  deski:      { nazwa: 'Deski', cena: 0 },
};

// Miejsca do zbierania. Im dalej od bazy (strefa 1, 2, 3), tym większe, twardsze i więcej dają.
// narz + poziom = jakie narzędzie jest potrzebne (siekiera / kilof z kuźni)
export const WEZLY = {
  krzak1:  { daje: 'jagody', ile: 6, odrost: 14, trud: 1, kolizja: 0, strefa: 1, skala: 0.9 },
  krzak2:  { daje: 'jagody', ile: 10, odrost: 16, trud: 1, kolizja: 0, strefa: 2, skala: 1.15 },
  krzak3:  { daje: 'jagody', ile: 15, odrost: 18, trud: 1, kolizja: 0, strefa: 3, skala: 1.4 },
  drzewo1: { daje: 'drewno', ile: 3, odrost: 45, trud: 1.0, kolizja: 0.45, drzewo: true, narz: 'siekiera', poziom: 1, strefa: 1, skala: 0.8 },
  drzewo2: { daje: 'drewno', ile: 6, odrost: 60, trud: 1.5, kolizja: 0.55, drzewo: true, narz: 'siekiera', poziom: 2, strefa: 2, skala: 1.1 },
  drzewo3: { daje: 'drewno', ile: 11, odrost: 80, trud: 2.1, kolizja: 0.7, drzewo: true, narz: 'siekiera', poziom: 3, strefa: 3, skala: 1.5 },
  glaz1:   { daje: 'kamien', ile: 4, odrost: 40, trud: 1.3, kolizja: 0.7, narz: 'kilof', poziom: 1, strefa: 1, skala: 0.75 },
  glaz2:   { daje: 'kamien', ile: 8, odrost: 55, trud: 1.8, kolizja: 0.95, narz: 'kilof', poziom: 2, strefa: 2, skala: 1.05 },
  glaz3:   { daje: 'kamien', ile: 14, odrost: 75, trud: 2.4, kolizja: 1.3, narz: 'kilof', poziom: 3, strefa: 3, skala: 1.45 },
};
// strefa zależy od odległości od środka bazy
export const SRODEK = [0, -6];
export const GRANICE_STREF = [28, 37]; // < 28: strefa 1, < 37: strefa 2, dalej: strefa 3

// zwierzęta: zycie = ile uderzeń (siła 1), sila = ile palisady psują na sekundę,
// je = ile zapasów zjedzą, zanim uciekną, nagroda = złotówki, które zostawiają, gdy się je przegoni
export const ZWIERZETA = {
  lis:        { nazwa: 'lisy', zycie: 3, v: 3.4, sila: 1, je: 3, nagroda: 3 },
  wilk:       { nazwa: 'wilki', zycie: 8, v: 3.2, sila: 2.4, je: 4, nagroda: 7 },
  niedzwiedz: { nazwa: 'niedźwiedzie', zycie: 22, v: 2.4, sila: 5, je: 8, nagroda: 16 },
  yeti:       { nazwa: 'Yeti', zycie: 80, v: 2.0, sila: 12, je: 15, nagroda: 70 },
};

// skąd przychodzą fale zwierząt (zza lasu)
export const WEJSCIA = { N: [0, -48], NE: [36, -42], NW: [-36, -42], E: [48, -12], W: [-48, -12] };

// broń myśliwych na wieżach (kupowana w zbrojowni). Zwierzęta nie giną, tylko uciekają.
export const BRONIE = [
  { nazwa: 'Proca', sila: 1, co: 1.3, zasieg: 10, pocisk: 'sniezka', obszar: 0 },
  { nazwa: 'Łuk', sila: 2, co: 1.1, zasieg: 12, pocisk: 'strzala', obszar: 0, koszt: { kasa: 300, drewno: 60 } },
  { nazwa: 'Kusza', sila: 3.5, co: 0.9, zasieg: 13, pocisk: 'strzala', obszar: 0, koszt: { kasa: 800, deski: 40, kamien: 40 } },
  { nazwa: 'Armatka śnieżna', sila: 5, co: 1.0, zasieg: 14, pocisk: 'kula', obszar: 1.8, koszt: { kasa: 2000, deski: 80, kamien: 100 } },
  { nazwa: 'Lodowe działo', sila: 9, co: 0.9, zasieg: 16, pocisk: 'kula', obszar: 2.3, koszt: { kasa: 4000, deski: 120, kamien: 150 } },
];
// narzędzia w kuźni: koszt przejścia na poziom 2 i 3 (poziom 1: siekiera za 25 zł, kilof z kamieniołomem)
export const NARZEDZIA = {
  siekiera: { nazwa: 'Siekiera', poziomy: ['', 'zwykła', 'żelazna', 'stalowa'], koszty: [null, null, { kasa: 400, drewno: 60, kamien: 30 }, { kasa: 1500, deski: 60, kamien: 100 }] },
  kilof:    { nazwa: 'Kilof', poziomy: ['', 'zwykły', 'żelazny', 'stalowy'], koszty: [null, null, { kasa: 500, drewno: 60, kamien: 40 }, { kasa: 1800, deski: 80, kamien: 120 }] },
};

// Ulepszenia w Warsztacie (w danej krainie) i stałe (za kryształki, w menu)
export const WARSZTAT = [
  { id: 'kosz', nazwa: 'Większy kosz', opis: '+5 miejsc na plecach', ceny: [40, 90, 160, 260, 400, 600, 850, 1200, 1600] },
  { id: 'buty', nazwa: 'Szybkie buty', opis: '+10% szybkości', ceny: [50, 110, 190, 300, 460, 700] },
  { id: 'rece', nazwa: 'Zręczne ręce', opis: '+15% szybsze zbieranie', ceny: [50, 110, 190, 300, 460, 700] },
];
export const STALE = [
  { id: 'kosz', nazwa: 'Wielki koszyk', opis: '+2 miejsca na plecach na start', max: 8 },
  { id: 'buty', nazwa: 'Śnieżne buty', opis: '+5% szybkości', max: 8 },
  { id: 'rece', nazwa: 'Szybkie palce', opis: '+8% szybsze zbieranie', max: 8 },
  { id: 'mach', nazwa: 'Mocny zamach', opis: '+20% siły Yaceqa na zwierzęta', max: 8 },
  { id: 'kasa', nazwa: 'Skarbonka', opis: '+20 zł na start każdej krainy', max: 8 },
  { id: 'pomoc', nazwa: 'Raźni pomocnicy', opis: '+10% szybsi pomocnicy', max: 8 },
];
export const CENY_STALE = [5, 10, 18, 30, 45, 65, 90, 120];

// ---------- pomocnicze ----------
const LADA_Z = 7;
function rep(x, n) { return Array.from({ length: Math.max(0, n) }, () => x); }
function lada(id, item, x, kasaX = 2.4) { return { id, rodzaj: 'lada', item, x, z: LADA_Z, kasaX, nazwa: 'Lada: ' + PRZEDMIOTY[item].nazwa.toLowerCase() }; }
function przetwornia(id, model, wej, wyj, x, z, czas, dla, nazwa) { return { id, rodzaj: 'przetwornia', model, wej, wyj, czas, dla, x, z, nazwa }; }
function domek(id, x, z, dla) { return { id, rodzaj: 'domek', x, z, dla, nazwa: 'Domek (więcej klientów)' }; }
function wieza(id, x, z) { return { id, rodzaj: 'wieza', x, z, nazwa: 'Wieża myśliwych' }; }
function mysliwy(id, wiezaId, x, z) { return { id, rodzaj: 'mysliwy', wieza: wiezaId, x, z, nazwa: 'Zatrudnij myśliwego' }; }
function chatka(id, x, z, zbiera, doId, zapas) {
  const nazwy = { jagody: 'Chatka zbieracza jagód', drewno: 'Chatka drwala', kamien: 'Chatka górnika' };
  return { id, rodzaj: 'chatka', x, z, zbiera, do: doId, zapas, nazwa: nazwy[zbiera] };
}
function tasma(id, skad, doId, punkty, x, z, nazwa) { return { id, rodzaj: 'tasmociag', skad, do: doId, tasma: punkty, x, z, nazwa }; }
function sprzedawca(id, ladaId, x, z) { return { id, rodzaj: 'sprzedawca', lada: ladaId, x, z, nazwa: 'Sprzedawca (sam sprzedaje)' }; }
function sklad(id, item, x, z) { return { id, rodzaj: 'sklad', item, x, z, nazwa: item === 'drewno' ? 'Skład drewna' : 'Skład kamienia' }; }
function rozbudowa(id, etap, x, z, nazwa) { return { id, rodzaj: 'rozbudowa', etapDo: etap, x, z, nazwa }; }
function efekt(id, efektTyp, x, z, nazwa, model) { return { id, rodzaj: 'efekt', efekt: efektTyp, x, z, nazwa, model }; }

// koszt (liczba = złotówki albo { kasa, drewno, kamien, deski }) mnożony przez "drozej" krainy, warunek (po) i etap bazy
function zrob(p) {
  const K = (o, k, po, etap = 0) => {
    const kosz = typeof k === 'number' ? { kasa: k } : { ...k };
    const naEtap = [1, 0.8, 0.6, 0.45, 0.35][etap]; // późniejsze etapy: mniej zasobów (pieniędzy jest wtedy dużo)
    if (o.rodzaj !== 'kraina') for (const t in kosz) kosz[t] = Math.round(kosz[t] * (t === 'kasa' ? p.drozej : p.drozejZasoby * naEtap) / 5) * 5 || (kosz[t] > 0 ? 5 : 0);
    o.koszt = kosz; o.po = po ? [].concat(po) : []; o.etap = etap; return o;
  };
  return {
    id: p.id, nazwa: p.nazwa, opis: p.opis, paleta: p.paleta, ceny: p.ceny, chca: p.chca, start: [-7, 0],
    silaZwierzat: p.silaZwierzat, cenaKrainy: p.cenaKrainy, drozej: p.drozej,
    // baza rośnie: każdy etap to nowy prostokąt (południe zawsze otwarte na klientów, z = 7)
    etapy: [
      { x0: -12, x1: 12, z0: -10 },
      { x0: -12, x1: 12, z0: -17, nazwa: 'na północ' },
      { x0: -12, x1: 19, z0: -17, nazwa: 'na wschód' },
      { x0: -19, x1: 19, z0: -17, nazwa: 'na zachód' },
      { x0: -19, x1: 19, z0: -24, nazwa: 'dalej na północ' },
    ],
    regiony: [
      { wezel: 'krzak', x: 0, z: -30, rx: 12, rz: 3.2, ile: 34 },
      { wezel: 'krzak', x: -25.5, z: -2, rx: 3.2, rz: 8, ile: 20 },
      { wezel: 'krzak', x: -33, z: -27, rx: 5, rz: 5, ile: 12 },
      { wezel: 'krzak', x: 30, z: -31, rx: 6, rz: 4, ile: 12 },
      { wezel: 'glaz', x: 25.5, z: -14.5, rx: 2.8, rz: 3, ile: 7 },
      { wezel: 'glaz', x: 33, z: -4, rx: 3.5, rz: 5, ile: 8 },
      { wezel: 'glaz', x: -35, z: -14, rx: 4, rz: 6, ile: 8 },
      { wezel: 'glaz', x: 36, z: -32, rx: 4, rz: 4, ile: 6 },
    ],
    wejscia: ['N', 'NE', 'NW', 'E', 'W'],
    budowle: [
      // ----- początek: jagody, siekiera, pierwsze lady -----
      K(lada('ladaJ', 'jagody', -9.5), 0),
      K(sprzedawca('sprzJ', 'ladaJ', -11.6, 5.0), 150, 'kuchnia'), // pierwszy sprzedawca: ok. 5 minut gry
      K(domek('domek1', -25, 12, ['ladaJ']), 20, 'ladaJ'),
      // najpierw lada z drewnem (za same pieniądze), dopiero potem można kupić siekierę
      K(lada('ladaDr', 'drewno', -3), 40, 'domek1'),
      K({ id: 'siekiera', rodzaj: 'narzedzie', narzedzie: 'siekiera', x: -6, z: -1.2, nazwa: 'Siekiera (ścinanie drzew)' }, 25, 'ladaDr'),
      K(lada('ladaD', 'dzem', 3.5), { kasa: 30, drewno: 5 }, ['domek1', 'siekiera']),
      K(przetwornia('kuchnia', 'kuchnia', 'jagody', 'dzem', 3.5, 0.2, 1.3, 'ladaD', 'Kuchnia dżemów'), { kasa: 40, drewno: 10 }, 'ladaD'),
      K(sprzedawca('sprzD', 'ladaD', 1.4, 5.0), 60, 'kuchnia'),
      K(wieza('wieza1', -4.2, -7.4), { kasa: 30, drewno: 15 }, 'kuchnia'),
      K(mysliwy('mys1', 'wieza1', -4.2, -5.2), 40, 'wieza1'),
      K({ id: 'warsztat', rodzaj: 'warsztat', x: 8.5, z: -5.0, nazwa: 'Warsztat (plecak, buty, ręce)' }, { kasa: 60, drewno: 20 }, 'kuchnia'),
      K(sprzedawca('sprzDr', 'ladaDr', -5.1, 5.0), 60, 'warsztat'),
      K(tasma('tasma1', 'kuchnia', 'ladaD', [[5.0, 0.9], [5.0, 6.2]], 2.6, 3.0, 'Taśmociąg: dżem sam jedzie na ladę'), { kasa: 80, drewno: 20 }, 'warsztat'),
      // pomocnicy niosą zbiory na lady do sprzedawców; nadmiar trafia do magazynu (jeśli jest)
      K(chatka('chatka1', -9, -3.5, 'jagody', 'ladaJ', 'magazyn'), { kasa: 80, drewno: 20 }, 'warsztat'),
      K({ id: 'magazyn', rodzaj: 'magazyn', x: -4, z: 2.0, nazwa: 'Magazyn: jagody, drewno, kamień dla ciebie' }, { kasa: 60, drewno: 20 }, 'warsztat'),
      K(chatka('chatka2', -5.5, -3.5, 'drewno', 'ladaDr', 'magazyn'), { kasa: 100, drewno: 25 }, 'warsztat'),
      K(domek('domek2', 25, 12, ['ladaD', 'ladaDr', 'ladaK']), { kasa: 90, drewno: 25 }, 'chatka1'),
      K(wieza('wieza2', 5, -7.4), { kasa: 60, drewno: 30 }, 'mys1'),
      K(mysliwy('mys2', 'wieza2', 5, -5.2), 60, 'wieza2'),
      // ----- kamień -----
      K({ id: 'kamieniolom', rodzaj: 'kopalnia', wyj: 'kamien', co: 6, narzedzie: 'kilof', x: 24.5, z: -8, nazwa: 'Kamieniołom (i kilof)' }, { kasa: 150, drewno: 40 }, 'chatka2'),
      K(lada('ladaK', 'kamien', 10.5, -2.4), { kasa: 60, drewno: 20 }, 'kamieniolom'),
      K(sprzedawca('sprzK', 'ladaK', 10.5, 2.9), 80, 'ladaK'),
      K({ id: 'wozek', rodzaj: 'wagonik', skad: 'kamieniolom', do: 'ladaK', zapas: 'magazyn', x: 13.6, z: 5.8, nazwa: 'Wózek: kamień sam jedzie na ladę',
          tory: [[26.4, -6.4], [22, -4], [22, 5.9], [14.2, 5.9]] }, { kasa: 150, drewno: 35, kamien: 10 }, 'ladaK'),
      K(chatka('chatka3', -2, -3.5, 'kamien', 'ladaK', 'magazyn'), { kasa: 150, drewno: 30, kamien: 10 }, 'ladaK'),
      K(chatka('chatka4', -9, 0.3, 'jagody', 'kuchnia'), { kasa: 140, drewno: 30 }, 'tasma1'),
      K(domek('domek3', -25, 19, ['ladaJ', 'ladaD', 'ladaDr', 'ladaK']), { kasa: 180, drewno: 35, kamien: 10 }, ['domek2', 'ladaK']),
      K({ id: 'palisada', rodzaj: 'palisada', x: 2.5, z: -3.0, nazwa: 'Mocna palisada' }, { drewno: 40, kamien: 25 }, ['mys2', 'kamieniolom']),
      K(rozbudowa('rozb1', 1, -0.5, -7.6, 'Powiększ bazę na północ'), { kasa: 250, drewno: 50, kamien: 20 }, ['chatka3', 'mys2', 'domek2']),
      // ----- etap 1: północ (kuźnia, zbrojownia, wieże) -----
      K({ id: 'kuznia', rodzaj: 'kuznia', x: -5.5, z: -13.8, nazwa: 'Kuźnia (lepsze siekiery i kilofy)' }, { kasa: 200, drewno: 50, kamien: 30 }, 'rozb1', 1),
      K({ id: 'zbrojownia', rodzaj: 'zbrojownia', x: 5, z: -13.8, nazwa: 'Zbrojownia (broń myśliwych)' }, { kasa: 250, drewno: 50, kamien: 40 }, 'rozb1', 1),
      K(wieza('wieza3', -9.2, -14.4), { drewno: 40, kamien: 30 }, 'rozb1', 1),
      K(mysliwy('mys3', 'wieza3', -9.2, -12.2), 120, 'wieza3', 1),
      K(wieza('wieza4', 9.2, -14.4), { drewno: 40, kamien: 30 }, 'rozb1', 1),
      K(mysliwy('mys4', 'wieza4', 9.2, -12.2), 120, 'wieza4', 1),
      K(domek('domek4', 25, 19, ['ladaD', 'ladaDr']), { kasa: 250, drewno: 50, kamien: 20 }, 'kuznia', 1),
      K(rozbudowa('rozb2', 2, 10.3, 0.3, 'Powiększ bazę na wschód'), { kasa: 600, drewno: 100, kamien: 50 }, ['kuznia', 'zbrojownia', 'mys3', 'mys4'], 1),
      // ----- etap 2: wschód (tartak, rynek) -----
      K(przetwornia('tartak', 'tartak', 'drewno', 'deski', 15.5, 1.5, 1.4, null, 'Tartak (drewno → deski)'), { kasa: 400, drewno: 80, kamien: 40 }, 'rozb2', 2),
      K(chatka('chatka5', 15.5, -4, 'drewno', 'tartak'), { kasa: 300, drewno: 60, kamien: 30 }, 'tartak', 2),
      K(efekt('rynek', 'ceny', 15.5, -8.8, 'Rynek (klienci płacą o 30% więcej)', 'rynek'), { kasa: 800, deski: 40, kamien: 60 }, 'tartak', 2),
      K(wieza('wieza5', 16.2, -14.4), { drewno: 60, kamien: 40 }, 'rozb2', 2),
      K(mysliwy('mys5', 'wieza5', 16.2, -12.2), 200, 'wieza5', 2),
      K(rozbudowa('rozb3', 3, -10.2, -7.6, 'Powiększ bazę na zachód'), { kasa: 1200, drewno: 150, kamien: 80, deski: 30 }, ['chatka5', 'mys5', 'rynek'], 2),
      // ----- etap 3: zachód (piekarnia, szkoła) -----
      K(przetwornia('piekarnia', 'piekarnia', 'jagody', 'drozdzowka', -15.5, -1, 1.6, 'ladaDz', 'Piekarnia (drożdżówki)'), { kasa: 700, deski: 40, kamien: 50 }, 'rozb3', 3),
      K(lada('ladaDz', 'drozdzowka', -16), { kasa: 500, deski: 30, kamien: 30 }, 'piekarnia', 3),
      K(tasma('tasma3', 'piekarnia', 'ladaDz', [[-14.2, -0.2], [-14.2, 6.2]], -12.6, 2.4, 'Taśmociąg: drożdżówki same jadą na ladę'), { kasa: 500, deski: 30, kamien: 20 }, 'ladaDz', 3),
      K(sprzedawca('sprzDz', 'ladaDz', -18.1, 5.0), 300, 'ladaDz', 3),
      K(chatka('chatka6', -16, -6.5, 'jagody', 'piekarnia'), { kasa: 600, deski: 30 }, 'piekarnia', 3),
      K(efekt('szkola', 'pomoc', -14.5, -11.0, 'Szkoła pomocników (o 30% szybsi)', 'szkola'), { kasa: 1000, deski: 60, kamien: 60 }, 'chatka6', 3),
      K(wieza('wieza6', -16.2, -14.4), { drewno: 60, kamien: 40 }, 'rozb3', 3),
      K(mysliwy('mys6', 'wieza6', -16.2, -12.2), 250, 'wieza6', 3),
      K(domek('domek5', -31, 15.5, ['ladaDz', 'ladaJ']), { kasa: 600, deski: 40 }, 'ladaDz', 3),
      K(domek('domek6', 31, 15.5, ['ladaDz', 'ladaD', 'ladaDr']), { kasa: 800, deski: 60 }, 'domek5', 3),
      K(rozbudowa('rozb4', 4, -1.2, -15.3, 'Powiększ bazę dalej na północ'), { kasa: 2500, drewno: 200, kamien: 150, deski: 80 }, ['tasma3', 'szkola', 'mys6', 'domek5'], 3),
      // ----- etap 4: koniec (skarbnik, Wielki Piec, nowa kraina) -----
      K({ id: 'skarbnik', rodzaj: 'skarbnik', x: 9, z: -20.5, nazwa: 'Skarbnik (sam zbiera pieniądze)' }, { kasa: 2000, deski: 80, kamien: 100 }, 'rozb4', 4),
      K(wieza('wieza7', -15, -21.4), { drewno: 80, kamien: 60 }, 'rozb4', 4),
      K(mysliwy('mys7', 'wieza7', -15, -19.2), 400, 'wieza7', 4),
      K(wieza('wieza8', 15, -21.4), { drewno: 80, kamien: 60 }, 'rozb4', 4),
      K(mysliwy('mys8', 'wieza8', 15, -19.2), 400, 'wieza8', 4),
      K({ id: 'cel', rodzaj: 'cel', x: 0, z: -20.5, nazwa: 'Wielki Piec (baza sama zarabia)' }, { kasa: 6000, drewno: 150, kamien: 200, deski: 150 },
        ['skarbnik', 'mys7', 'mys8', 'domek6', 'sprzDz'], 4),
      K({ id: 'kraina', rodzaj: 'kraina', x: -8, z: -20.5, nazwa: 'Kup nową krainę' }, { kasa: p.cenaKrainy }, 'cel', 4),
    ],
    fale: {
      po: 'mys1', pierwsza: 60, co: 120,
      sklad: (n, e) => [
        ...rep('lis', Math.min(6, 1 + Math.floor(n * 0.6))),
        ...rep('wilk', e >= 1 || n >= 6 ? Math.min(6, Math.floor((n - 3) / 2) + e) : 0),
        ...rep('niedzwiedz', e >= 2 || n >= 10 ? Math.min(4, Math.floor((n - 6) / 3) + e - 1) : 0),
        ...rep('yeti', e >= 3 && n % 4 === 0 ? 1 + Math.floor(e / 4) : 0),
      ],
    },
    // dzikie zwierzęta w głębi lasu (atakują Yaceqa): ile naraz na danym etapie bazy
    dzikie: e => 3 + e,
    gwiazdki: [80 * 60, 110 * 60],
  };
}

export const KRAINY = [
  zrob({
    id: 1, nazwa: 'Jagodowa Polana', opis: 'Zbieraj jagody, ścinaj las, powiększaj bazę i broń jej przed zwierzętami. Na końcu baza sama zarabia.',
    paleta: { snieg: '#eef4fb', plac: '#d4895a', mgla: '#dbe8f6', igly: ['#86bfe9', '#5f9fd4', '#3f7fb8'] },
    ceny: 1, chca: [3, 7], drozej: 0.45, drozejZasoby: 0.45, silaZwierzat: 1, cenaKrainy: 25000,
  }),
  zrob({
    id: 2, nazwa: 'Mroźna Dolina', opis: 'Druga kraina: wszystko od nowa, ale drożej, a zwierzęta są groźniejsze.',
    paleta: { snieg: '#eaf0fa', plac: '#b98a6a', mgla: '#cfdaee', igly: ['#7fb3d9', '#4f87bf', '#33669e'] },
    ceny: 1.6, chca: [4, 8], drozej: 1.2, drozejZasoby: 0.95, silaZwierzat: 1.6, cenaKrainy: 60000,
  }),
];

export const ZAKRES = 44; // gracz chodzi w kwadracie -44..44
