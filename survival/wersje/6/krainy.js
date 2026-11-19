// Yaceq Survival: przedmioty, zwierzęta i krainy (wszystkie liczby do strojenia są tutaj).

// cena = ile płaci klient za sztukę (mnożona przez "ceny" krainy)
export const PRZEDMIOTY = {
  jagody:   { nazwa: 'Jagody kamczackie', cena: 2 },
  dzem:     { nazwa: 'Dżem jagodowy', cena: 5 },
  ryba:     { nazwa: 'Ryba', cena: 3 },
  wedzona:  { nazwa: 'Wędzona ryba', cena: 9 },
  ruda:     { nazwa: 'Ruda złota', cena: 3 },
  zloto:    { nazwa: 'Sztabka złota', cena: 14 },
  wegiel:   { nazwa: 'Węgiel', cena: 3 },
  krysztal: { nazwa: 'Lodowy kryształ', cena: 10 },
  drewno:   { nazwa: 'Drewno', cena: 2 },
  kamien:   { nazwa: 'Kamień', cena: 0 },
};

// miejsca, z których się zbiera (ile = ile sztuk naraz, odrost w sekundach, trud = ile razy dłużej niż jagody)
export const WEZLY = {
  krzak:    { daje: 'jagody', ile: 8, odrost: 14, trud: 1, kolizja: 0 },
  drzewo:   { daje: 'drewno', ile: 6, odrost: 25, trud: 1.0, kolizja: 0.4, calosc: true, wymaga: 'siekiera' },
  glaz:     { daje: 'kamien', ile: 6, odrost: 30, trud: 1.3, kolizja: 0.85, wymaga: 'kamieniolom' },
  przerebel:{ daje: 'ryba', ile: 3, odrost: 18, trud: 1.5, kolizja: 0 },
  skala:    { daje: 'ruda', ile: 6, odrost: 26, trud: 1.6, kolizja: 0.9 },
  wegla:    { daje: 'wegiel', ile: 6, odrost: 26, trud: 1.4, kolizja: 0.9 },
  lod:      { daje: 'krysztal', ile: 3, odrost: 32, trud: 1.8, kolizja: 0.8 },
};

// zwierzęta: zycie = ile machnięć koszyczkiem (siła 1), sila = ile palisady psują na sekundę,
// je = ile zapasów zjedzą, zanim uciekną, nagroda = złotówki, które zostawiają, gdy się je przegoni
export const ZWIERZETA = {
  lis:        { nazwa: 'lisy', zycie: 3, v: 3.4, sila: 1, je: 3, nagroda: 3, skala: 1 },
  pingwin:    { nazwa: 'pingwiny', zycie: 2, v: 3.7, sila: 0.7, je: 4, nagroda: 2, skala: 1 },
  wilk:       { nazwa: 'wilki', zycie: 7, v: 3.1, sila: 2.2, je: 4, nagroda: 6, skala: 1 },
  niedzwiedz: { nazwa: 'niedźwiedzie', zycie: 18, v: 2.3, sila: 4.5, je: 8, nagroda: 14, skala: 1 },
  yeti:       { nazwa: 'Yeti', zycie: 70, v: 1.9, sila: 12, je: 15, nagroda: 60, skala: 1 },
};

// skąd przychodzą zwierzęta
export const WEJSCIA = {
  N: [0, -46], NE: [34, -40], NW: [-34, -40], E: [46, -10], W: [-46, -10],
};

// Ulepszenia w Warsztacie (w danej krainie) i stałe (za kryształki, w menu)
export const WARSZTAT = [
  { id: 'kosz', nazwa: 'Większy kosz', opis: '+5 miejsc na plecach', ceny: [40, 90, 160, 260, 400, 600, 850] },
  { id: 'buty', nazwa: 'Szybkie buty', opis: '+10% szybkości', ceny: [50, 110, 190, 300, 460] },
  { id: 'rece', nazwa: 'Zręczne ręce', opis: '+15% szybsze zbieranie', ceny: [50, 110, 190, 300, 460] },
];
export const STALE = [
  { id: 'kosz', nazwa: 'Wielki koszyk', opis: '+2 miejsca na plecach na start', max: 8 },
  { id: 'buty', nazwa: 'Śnieżne buty', opis: '+5% szybkości', max: 8 },
  { id: 'rece', nazwa: 'Szybkie palce', opis: '+8% szybsze zbieranie', max: 8 },
  { id: 'mach', nazwa: 'Mocny zamach', opis: '+20% siły koszyczka na zwierzęta', max: 8 },
  { id: 'kasa', nazwa: 'Skarbonka', opis: '+20 zł na start każdej krainy', max: 8 },
  { id: 'pomoc', nazwa: 'Raźni pomocnicy', opis: '+10% szybsi pomocnicy', max: 8 },
];
export const CENY_STALE = [5, 10, 18, 30, 45, 65, 90, 120];

// ---------- stałe miejsca w obozie (ten sam układ w każdej krainie) ----------
const LADA_X = [-9, -4.5, 0, 4.5, 9];
const LADA_Z = 7;
const PRZETW_Z = 2.6;

function lada(id, item, slot, extra = {}) {
  return { id, rodzaj: 'lada', item, x: LADA_X[slot], z: LADA_Z, nazwa: 'Lada: ' + PRZEDMIOTY[item].nazwa.toLowerCase(), ...extra };
}
function przetwornia(id, model, wej, wyj, slot, czas, dla, extra = {}) {
  const nazwy = { kuchnia: 'Kuchnia dżemów', wedzarnia: 'Wędzarnia ryb', huta: 'Huta złota' };
  return { id, rodzaj: 'przetwornia', model, wej, wyj, czas, dla, x: LADA_X[slot], z: PRZETW_Z, nazwa: nazwy[model], ...extra };
}
const DOMKI = [[-17, 12], [17, 12], [-17, 18.5], [17, 18.5], [-23, 15], [23, 15], [-23, 21], [23, 21]];
function domek(id, n, dla, extra = {}) {
  return { id, rodzaj: 'domek', x: DOMKI[n][0], z: DOMKI[n][1], dla, nazwa: 'Domek (więcej klientów)', ...extra };
}
const ARMATKI = [[-6, -8.6], [6, -8.6], [-11, -7.6], [11, -7.6], [0, -8.6], [-11, -1.5], [11, -1.5]];
function armatka(id, n, extra = {}) {
  return { id, rodzaj: 'armatka', x: ARMATKI[n][0], z: ARMATKI[n][1], nazwa: 'Armatka śnieżna', ...extra };
}
const CHATKI = [[-8.5, -4.8], [-4.2, -5.6], [-8.5, -0.8], [4.2, -6.4]];
function chatka(id, n, zbiera, doId, extra = {}) {
  const nazwy = { jagody: 'Chatka zbieracza jagód', drewno: 'Chatka drwala', kamien: 'Chatka górnika', ryba: 'Chatka rybaka', ruda: 'Chatka górnika rudy', wegiel: 'Chatka węglarza', krysztal: 'Chatka lodziarza' };
  return { id, rodzaj: 'chatka', x: CHATKI[n][0], z: CHATKI[n][1], zbiera, do: doId, nazwa: nazwy[zbiera], ...extra };
}
function warsztat(extra = {}) { return { id: 'warsztat', rodzaj: 'warsztat', x: 8.5, z: -5.4, nazwa: 'Warsztat (ulepszenia)', ...extra }; }
function palisada(extra = {}) { return { id: 'palisada', rodzaj: 'palisada', x: -1, z: 0.6, nazwa: 'Mocna palisada', ...extra }; }
function cel(nazwa, extra = {}) { return { id: 'cel', rodzaj: 'cel', x: 0.6, z: -3.6, nazwa, ...extra }; }

function tasma(id, skad, doId, punkty, x, z) { return { id, rodzaj: 'tasmociag', skad, do: doId, tasma: punkty, x, z, nazwa: 'Taśmociąg: dżem sam jedzie na ladę' }; }
function sprzedawca(id, ladaId, x, z) { return { id, rodzaj: 'sprzedawca', lada: ladaId, x, z, nazwa: 'Sprzedawca (sam sprzedaje)' }; }
function sklad(id, item, x, z) { return { id, rodzaj: 'sklad', item, x, z, nazwa: item === 'drewno' ? 'Skład drewna' : 'Skład kamienia' }; }

// koszt (k: liczba = złotówki albo { kasa, drewno, kamien }) i warunek (po) dopisywane przy krainie
function K(o, k, po) { o.koszt = typeof k === 'number' ? { kasa: k } : k; o.po = po ? [].concat(po) : []; return o; }

// Wszystkie krainy są tu opisane, ale w grze na razie jest tylko pierwsza (reszta: gdy pierwsza się spodoba).
const WSZYSTKIE = [
  {
    id: 1, nazwa: 'Jagodowa Polana', opis: 'Zbieraj jagody, ścinaj drzewa, kop kamień i buduj obóz. Przeganiaj zwierzęta!',
    paleta: { snieg: '#eef4fb', plac: '#d4895a', mgla: '#dbe8f6', igly: '#86bfe9' },
    ceny: 1, chca: [3, 7], start: [-7, 0],
    regiony: [
      { wezel: 'krzak', x: -1, z: -18.5, rx: 12, rz: 5.5, ile: 40 },
      { wezel: 'krzak', x: -20.5, z: -2, rx: 4.5, rz: 7, ile: 14 },
      { wezel: 'drzewo', x: 21, z: -0.5, rx: 5, rz: 7, ile: 22 },
      { wezel: 'glaz', x: 20, z: -18, rx: 5, rz: 3.5, ile: 10 },
    ],
    wejscia: ['N', 'NE', 'NW'],
    // najpierw jagody (sprzedaż = pieniądze na życie), potem drewno do budowy, potem kamieniołom, wózki, taśmociąg i pomocnicy
    budowle: [
      K(lada('ladaJ', 'jagody', 0, { gotowe: true, x: -9.5 }), 0),
      K(sprzedawca('sprzJ', 'ladaJ', -11.6, 5.0), 30, 'ladaJ'),
      K(domek('domek1', 0, ['ladaJ']), 20, 'ladaJ'),
      K({ id: 'siekiera', rodzaj: 'narzedzie', narzedzie: 'drewno', x: -6, z: -1.2, nazwa: 'Siekiera (ścinanie drzew)' }, 25, 'ladaJ'),
      K(lada('ladaD', 'dzem', 1, { x: 3.5 }), { kasa: 30, drewno: 5 }, ['domek1', 'siekiera']),
      K(przetwornia('kuchnia', 'kuchnia', 'jagody', 'dzem', 1, 1.3, 'ladaD', { x: 3.5, z: 0.2 }), { kasa: 40, drewno: 10 }, 'ladaD'),
      K(sprzedawca('sprzD', 'ladaD', 1.4, 5.0), 60, 'kuchnia'),
      K(armatka('armatka1', 0), { kasa: 30, drewno: 15 }, 'kuchnia'),
      K(warsztat(), { kasa: 60, drewno: 20 }, 'kuchnia'),
      K(lada('ladaDr', 'drewno', 1, { x: -3 }), { kasa: 40, drewno: 10 }, 'warsztat'),
      K(sprzedawca('sprzDr', 'ladaDr', -5.1, 5.0), 60, 'ladaDr'),
      K(tasma('tasma1', 'kuchnia', 'ladaD', [[5.0, 0.9], [5.0, 6.2]], 2.6, 3.0), { kasa: 80, drewno: 20 }, 'warsztat'),
      K(chatka('chatka1', 0, 'jagody', 'ladaJ'), { kasa: 80, drewno: 20 }, 'warsztat'),
      K(sklad('skladD', 'drewno', 8.5, 2.5), { kasa: 40, drewno: 10 }, 'warsztat'),
      K(chatka('chatka2', 2, 'drewno', 'skladD'), { kasa: 100, drewno: 25 }, 'skladD'),
      K(domek('domek2', 1, ['ladaD', 'ladaDr']), { kasa: 90, drewno: 25 }, 'chatka1'),
      K({ id: 'kamieniolom', rodzaj: 'kopalnia', wyj: 'kamien', co: 6, x: 16, z: -11.5, nazwa: 'Kamieniołom' }, { kasa: 120, drewno: 35 }, 'chatka2'),
      K(sklad('skladK', 'kamien', 8.8, 5.6), { kasa: 60, drewno: 20, kamien: 5 }, 'kamieniolom'),
      K({ id: 'wozek', rodzaj: 'wagonik', skad: 'kamieniolom', do: 'skladK', x: 14.4, z: -2, nazwa: 'Wózek: kamień sam jedzie do składu',
          tory: [[17.8, -9.4], [14.4, -7.8], [14.4, 5.8], [10.6, 5.8]] }, { kasa: 150, drewno: 35, kamien: 10 }, 'skladK'),
      K(chatka('chatka3', 3, 'kamien', 'skladK'), { kasa: 150, drewno: 30, kamien: 10 }, 'skladK'),
      K(armatka('armatka2', 1), { drewno: 25, kamien: 10 }, ['armatka1', 'kamieniolom']),
      K(chatka('chatka4', 1, 'jagody', 'kuchnia'), { kasa: 140, drewno: 30 }, 'tasma1'),
      K(domek('domek3', 2, ['ladaJ', 'ladaD', 'ladaDr']), { kasa: 180, drewno: 35, kamien: 10 }, ['domek2', 'skladK']),
      K(palisada({ x: -2.5, z: 0.8 }), { drewno: 40, kamien: 25 }, 'armatka2'),
      K(armatka('armatka3', 2), { drewno: 25, kamien: 15 }, 'palisada'),
      K(armatka('armatka4', 3), { drewno: 25, kamien: 15 }, 'palisada'),
      K(cel('Wielki Piec'), { kasa: 600, drewno: 60, kamien: 45 }, ['domek3', 'wozek', 'chatka3', 'chatka4', 'armatka3', 'sprzD', 'sprzDr']),
    ],
    fale: { po: 'armatka1', pierwsza: 45, co: 85, sklad: n => [...rep('lis', Math.min(6, 1 + Math.floor(n * 0.6))), ...rep('wilk', n >= 6 ? Math.floor((n - 4) / 2) : 0), ...rep('niedzwiedz', n >= 7 ? Math.min(3, Math.floor((n - 4) / 3)) : 0)] },
    gwiazdki: [30 * 60, 45 * 60],
  },
  {
    id: 2, nazwa: 'Zamarznięte Jezioro', opis: 'Łów ryby w przeręblach i wędź je. Uwaga na pingwiny-łasuchy!',
    paleta: { snieg: '#eef5fc', plac: '#b98a66', mgla: '#d6e6f5', igly: '#2a6670' },
    ceny: 1.2, chca: [2, 5], start: [-7, 0],
    jezioro: { x: 27, z: -6, r: 11 },
    regiony: [
      { wezel: 'krzak', x: -2, z: -23, rx: 15, rz: 8, ile: 24 },
      { wezel: 'przerebel', x: 27, z: -6, rx: 8, rz: 8, ile: 10 },
    ],
    wejscia: ['N', 'NW', 'NE', 'E'],
    budowle: [
      K(lada('ladaJ', 'jagody', 0, { gotowe: true }), 0),
      K(domek('domek1', 0, ['ladaJ']), 20, 'ladaJ'),
      K(lada('ladaD', 'dzem', 1), 40, 'domek1'),
      K(przetwornia('kuchnia', 'kuchnia', 'jagody', 'dzem', 1, 1.3, 'ladaD'), 50, 'ladaD'),
      K(armatka('armatka1', 0), 70, 'kuchnia'),
      K(lada('ladaW', 'wedzona', 3), 80, 'kuchnia'),
      K(przetwornia('wedzarnia', 'wedzarnia', 'ryba', 'wedzona', 3, 1.6, 'ladaW'), 100, 'ladaW'),
      K(warsztat(), 90, 'wedzarnia'),
      K(armatka('armatka2', 1), 140, ['armatka1', 'wedzarnia']),
      K(domek('domek2', 1, ['ladaW']), 140, 'warsztat'),
      K(chatka('chatka1', 0, 'jagody', 'kuchnia'), 180, 'warsztat'),
      K(chatka('chatka2', 1, 'ryba', 'wedzarnia'), 260, 'chatka1'),
      K(armatka('armatka3', 3), 260, 'armatka2'),
      K(domek('domek3', 2, ['ladaJ', 'ladaD']), 240, 'domek2'),
      K(palisada(), 300, 'armatka3'),
      K(domek('domek4', 3, ['ladaW']), 380, ['domek3', 'chatka2']),
      K(armatka('armatka4', 2), 360, 'palisada'),
      K(cel('Lodowa Latarnia'), 1500, ['domek4', 'armatka4']),
    ],
    fale: { po: 'armatka1', pierwsza: 35, co: 65, sklad: n => [...rep('lis', Math.min(5, 1 + Math.floor(n * 0.5))), ...rep('pingwin', Math.min(6, Math.floor(n * 0.6))), ...rep('wilk', n >= 5 ? Math.floor((n - 3) / 2) : 0)] },
    gwiazdki: [16 * 60, 24 * 60],
  },
  {
    id: 3, nazwa: 'Złota Kopalnia', opis: 'Kop rudę, wytapiaj złoto i puść wagonik. Przychodzą niedźwiedzie!',
    paleta: { snieg: '#f1f4f8', plac: '#b07a52', mgla: '#dfe5ee', igly: '#33604a' },
    ceny: 1.4, chca: [2, 5], start: [-7, 0],
    regiony: [
      { wezel: 'krzak', x: 4, z: -23, rx: 15, rz: 8, ile: 22 },
      { wezel: 'skala', x: -28, z: -6, rx: 7, rz: 9, ile: 11 },
    ],
    wejscia: ['N', 'NE', 'E', 'NW'],
    budowle: [
      K(lada('ladaJ', 'jagody', 0, { gotowe: true }), 0),
      K(domek('domek1', 0, ['ladaJ']), 25, 'ladaJ'),
      K(lada('ladaD', 'dzem', 3), 50, 'domek1'),
      K(przetwornia('kuchnia', 'kuchnia', 'jagody', 'dzem', 3, 1.3, 'ladaD'), 60, 'ladaD'),
      K(armatka('armatka1', 1), 80, 'kuchnia'),
      K(lada('ladaZ', 'zloto', 1), 100, 'kuchnia'),
      K(przetwornia('huta', 'huta', 'ruda', 'zloto', 1, 2.0, 'ladaZ'), 130, 'ladaZ'),
      K(warsztat(), 120, 'huta'),
      K({ id: 'kopalnia', rodzaj: 'kopalnia', wyj: 'ruda', co: 3.5, x: -18, z: -3, nazwa: 'Kopalnia (ruda sama się wydobywa)' }, 220, 'huta'),
      K({ id: 'wagonik', rodzaj: 'wagonik', skad: 'kopalnia', do: 'huta', x: -14, z: -1, nazwa: 'Wagonik (wozi rudę do huty)',
          tory: [[-16.2, -3], [-7, -3], [-4.5, -2.2], [-4.5, 0.4]] }, 300, 'kopalnia'),
      K(armatka('armatka2', 0), 200, ['armatka1', 'warsztat']),
      K(domek('domek2', 1, ['ladaZ']), 220, 'warsztat'),
      K(chatka('chatka1', 2, 'jagody', 'kuchnia'), 260, 'warsztat'),
      K(armatka('armatka3', 3), 340, 'armatka2'),
      K(palisada(), 400, 'armatka3'),
      K(domek('domek3', 2, ['ladaJ', 'ladaD']), 380, 'domek2'),
      K(domek('domek4', 3, ['ladaZ']), 520, ['domek3', 'wagonik']),
      K(armatka('armatka4', 4), 480, 'palisada'),
      K(cel('Złota Brama'), 2600, ['domek4', 'armatka4']),
    ],
    fale: { po: 'armatka1', pierwsza: 40, co: 70, sklad: n => [...rep('wilk', Math.min(6, 1 + Math.floor(n * 0.5))), ...rep('lis', Math.min(4, Math.floor(n * 0.4))), ...rep('niedzwiedz', n >= 4 ? Math.floor((n - 2) / 3) : 0)] },
    gwiazdki: [20 * 60, 30 * 60],
  },
  {
    id: 4, nazwa: 'Lodowe Jaskinie', opis: 'Węgiel grzeje obóz, a lodowe kryształy są warte fortunę.',
    paleta: { snieg: '#e9f1fa', plac: '#8f7b72', mgla: '#cfdcec', igly: '#2b5a6b' },
    ceny: 1.6, chca: [3, 5], start: [-7, 0],
    regiony: [
      { wezel: 'krzak', x: -6, z: -23, rx: 12, rz: 7, ile: 18 },
      { wezel: 'wegla', x: 26, z: -18, rx: 8, rz: 7, ile: 10 },
      { wezel: 'lod', x: -27, z: -8, rx: 7, rz: 9, ile: 10 },
    ],
    wejscia: ['N', 'NE', 'NW', 'E', 'W'],
    cieplo: true,
    budowle: [
      K(lada('ladaJ', 'jagody', 0, { gotowe: true }), 0),
      K({ id: 'piec', rodzaj: 'piec', wej: 'wegiel', x: 5, z: -1.4, nazwa: 'Piec obozowy (spala węgiel)' }, 30, 'ladaJ'),
      K(domek('domek1', 0, ['ladaJ']), 30, 'piec'),
      K(lada('ladaD', 'dzem', 1), 60, 'domek1'),
      K(przetwornia('kuchnia', 'kuchnia', 'jagody', 'dzem', 1, 1.3, 'ladaD'), 70, 'ladaD'),
      K(armatka('armatka1', 0), 100, 'kuchnia'),
      K(lada('ladaK', 'krysztal', 3), 140, 'kuchnia'),
      K(warsztat(), 150, 'ladaK'),
      K(chatka('chatka1', 0, 'wegiel', 'piec'), 220, 'warsztat'),
      K(armatka('armatka2', 1), 240, ['armatka1', 'warsztat']),
      K(domek('domek2', 1, ['ladaK']), 260, 'warsztat'),
      K(chatka('chatka2', 1, 'jagody', 'kuchnia'), 320, 'chatka1'),
      K(armatka('armatka3', 2), 380, 'armatka2'),
      K(domek('domek3', 2, ['ladaJ', 'ladaD']), 420, 'domek2'),
      K(chatka('chatka3', 2, 'krysztal', 'ladaK'), 520, ['chatka2', 'domek2']),
      K(palisada(), 480, 'armatka3'),
      K(armatka('armatka4', 3), 520, 'palisada'),
      K(domek('domek4', 3, ['ladaK']), 650, ['domek3', 'chatka3']),
      K(cel('Kryształowy Pałac'), 3800, ['domek4', 'armatka4']),
    ],
    fale: { po: 'armatka1', pierwsza: 40, co: 65, sklad: n => [...rep('wilk', Math.min(7, 2 + Math.floor(n * 0.5))), ...rep('niedzwiedz', n >= 3 ? Math.min(4, Math.floor((n - 1) / 2)) : 0)] },
    gwiazdki: [22 * 60, 32 * 60],
  },
  {
    id: 5, nazwa: 'Przełęcz Yeti', opis: 'Wszystko naraz, a co kilka fal przychodzi sam Yeti!',
    paleta: { snieg: '#f4f6fa', plac: '#a98364', mgla: '#e2e7ef', igly: '#2f5f57' },
    ceny: 1.8, chca: [3, 6], start: [-7, 0],
    jezioro: { x: 28, z: -4, r: 10 },
    regiony: [
      { wezel: 'krzak', x: 0, z: -24, rx: 14, rz: 8, ile: 22 },
      { wezel: 'przerebel', x: 28, z: -4, rx: 7, rz: 7, ile: 9 },
      { wezel: 'skala', x: -28, z: -8, rx: 7, rz: 9, ile: 10 },
    ],
    wejscia: ['N', 'NE', 'NW', 'E', 'W'],
    budowle: [
      K(lada('ladaJ', 'jagody', 0, { gotowe: true }), 0),
      K(domek('domek1', 0, ['ladaJ']), 30, 'ladaJ'),
      K(lada('ladaD', 'dzem', 1), 70, 'domek1'),
      K(przetwornia('kuchnia', 'kuchnia', 'jagody', 'dzem', 1, 1.3, 'ladaD'), 80, 'ladaD'),
      K(armatka('armatka1', 0), 110, 'kuchnia'),
      K(lada('ladaW', 'wedzona', 3), 150, 'kuchnia'),
      K(przetwornia('wedzarnia', 'wedzarnia', 'ryba', 'wedzona', 3, 1.6, 'ladaW'), 180, 'ladaW'),
      K(warsztat(), 180, 'wedzarnia'),
      K(lada('ladaZ', 'zloto', 2), 260, 'warsztat'),
      K(przetwornia('huta', 'huta', 'ruda', 'zloto', 2, 2.0, 'ladaZ'), 300, 'ladaZ'),
      K(armatka('armatka2', 1), 280, ['armatka1', 'warsztat']),
      K(chatka('chatka1', 0, 'ruda', 'huta'), 380, 'huta'),
      K(chatka('chatka2', 1, 'ryba', 'wedzarnia'), 420, 'chatka1'),
      K(domek('domek2', 1, ['ladaW', 'ladaZ']), 400, 'huta'),
      K(armatka('armatka3', 2), 450, 'armatka2'),
      K(armatka('armatka4', 3), 480, 'armatka3'),
      K(chatka('chatka3', 2, 'jagody', 'kuchnia'), 520, 'chatka2'),
      K(palisada(), 600, 'armatka4'),
      K(domek('domek3', 2, ['ladaJ', 'ladaD']), 600, 'domek2'),
      K(domek('domek4', 3, ['ladaZ', 'ladaW']), 800, ['domek3', 'chatka3']),
      K(armatka('armatka5', 4), 700, 'palisada'),
      K(cel('Pomnik Yaceqa'), 5500, ['domek4', 'armatka5']),
    ],
    fale: { po: 'armatka1', pierwsza: 40, co: 65, sklad: n => [...rep('wilk', Math.min(7, 2 + Math.floor(n * 0.5))), ...rep('pingwin', Math.min(4, Math.floor(n * 0.4))), ...rep('niedzwiedz', n >= 3 ? Math.min(4, Math.floor(n / 3)) : 0), ...rep('yeti', n >= 4 && n % 4 === 0 ? 1 + Math.floor(n / 12) : 0)] },
    gwiazdki: [25 * 60, 36 * 60],
  },
  {
    id: 6, nazwa: 'Kraina Zorzy', opis: 'Ostatnia kraina: wszystkie skarby północy i wszystkie zwierzęta.',
    paleta: { snieg: '#eaf0fb', plac: '#9a7a66', mgla: '#c9d6ee', igly: '#28525f', zorza: true },
    ceny: 2, chca: [3, 6], start: [-7, 0],
    jezioro: { x: 29, z: 2, r: 9 },
    cieplo: true,
    regiony: [
      { wezel: 'krzak', x: -4, z: -24, rx: 13, rz: 7, ile: 20 },
      { wezel: 'przerebel', x: 29, z: 2, rx: 6, rz: 6, ile: 8 },
      { wezel: 'skala', x: -29, z: -4, rx: 6, rz: 8, ile: 9 },
      { wezel: 'wegla', x: 26, z: -22, rx: 7, rz: 5, ile: 8 },
      { wezel: 'lod', x: -24, z: -24, rx: 7, rz: 6, ile: 8 },
    ],
    wejscia: ['N', 'NE', 'NW', 'E', 'W'],
    budowle: [
      K(lada('ladaJ', 'jagody', 0, { gotowe: true }), 0),
      K({ id: 'piec', rodzaj: 'piec', wej: 'wegiel', x: 9.5, z: 0.8, nazwa: 'Piec obozowy (spala węgiel)' }, 40, 'ladaJ'),
      K(domek('domek1', 0, ['ladaJ']), 40, 'piec'),
      K(lada('ladaD', 'dzem', 1), 80, 'domek1'),
      K(przetwornia('kuchnia', 'kuchnia', 'jagody', 'dzem', 1, 1.3, 'ladaD'), 100, 'ladaD'),
      K(armatka('armatka1', 0), 130, 'kuchnia'),
      K(lada('ladaW', 'wedzona', 2), 180, 'kuchnia'),
      K(przetwornia('wedzarnia', 'wedzarnia', 'ryba', 'wedzona', 2, 1.6, 'ladaW'), 220, 'ladaW'),
      K(warsztat(), 220, 'wedzarnia'),
      K(lada('ladaZ', 'zloto', 3), 320, 'warsztat'),
      K(przetwornia('huta', 'huta', 'ruda', 'zloto', 3, 2.0, 'ladaZ'), 360, 'ladaZ'),
      K(armatka('armatka2', 1), 340, ['armatka1', 'warsztat']),
      K(lada('ladaK', 'krysztal', 4), 450, 'huta'),
      K(chatka('chatka1', 0, 'wegiel', 'piec'), 480, 'ladaK'),
      K(chatka('chatka2', 1, 'ruda', 'huta'), 560, 'chatka1'),
      K(chatka('chatka3', 2, 'jagody', 'kuchnia'), 620, 'chatka2'),
      K(armatka('armatka3', 2), 560, 'armatka2'),
      K(armatka('armatka4', 3), 600, 'armatka3'),
      K(domek('domek2', 1, ['ladaW', 'ladaZ']), 600, 'ladaK'),
      K(domek('domek3', 2, ['ladaJ', 'ladaD', 'ladaK']), 800, 'domek2'),
      K(palisada(), 800, 'armatka4'),
      K(armatka('armatka5', 4), 900, 'palisada'),
      K(armatka('armatka6', 5), 950, 'armatka5'),
      K(domek('domek4', 3, ['ladaK', 'ladaZ']), 1100, ['domek3', 'chatka3']),
      K(cel('Wieża Zorzy'), 8000, ['domek4', 'armatka6']),
    ],
    fale: { po: 'armatka1', pierwsza: 40, co: 60, sklad: n => [...rep('wilk', Math.min(8, 2 + Math.floor(n * 0.6))), ...rep('pingwin', Math.min(4, Math.floor(n * 0.3))), ...rep('niedzwiedz', n >= 3 ? Math.min(5, Math.floor(n / 2.5)) : 0), ...rep('yeti', n >= 4 && n % 3 === 0 ? 1 + Math.floor(n / 9) : 0)] },
    gwiazdki: [28 * 60, 40 * 60],
  },
];

export const KRAINY = WSZYSTKIE.slice(0, 1);

function rep(x, n) { return Array.from({ length: Math.max(0, n) }, () => x); }

// obóz: palisada wokół (bez południa, gdzie są lady i klienci)
export const OBOZ = { x0: -12, x1: 12, z0: -10, z1: 7 };
export const ZAKRES = 30; // gracz chodzi w kwadracie -40..40
