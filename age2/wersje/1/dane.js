// Age of Haskap II: liczby do strojenia (jednostki, budynki, ery, ulepszenia, poziomy trudności).
// Gra jest nasza: pomysł gatunku (osadnicy, surowce, ery, wojsko) jest wspólny dla wielu gier strategicznych,
// ale nazwy, budynki, wygląd i liczby są własne.

export const SUROWCE = ['jagody', 'drewno', 'kamien', 'zloto'];
export const NAZWY_SUR = { jagody: 'jagody', drewno: 'drewno', kamien: 'kamień', zloto: 'złoto' };
export const EMOJI_SUR = { jagody: '🫐', drewno: '🪵', kamien: '🪨', zloto: '🪙' };
export const ERY = ['', 'Osada', 'Wioska', 'Gród'];
export const START = { jagody: 200, drewno: 200, kamien: 150, zloto: 100 };
export const MAKS_LUDNOSC = 100;

// atak: obrażenia jednego uderzenia; odstep: sekundy między uderzeniami; zasieg 0 = walczy wręcz
// przeciw: mnożnik obrażeń przeciw danemu rodzajowi; tylkoBudynki: atakuje tylko budynki (taran)
export const JEDNOSTKI = {
  osadnik: { nazwa: 'Osadnik', emoji: '🧑‍🌾', hp: 25, atak: 3, pancerz: 0, zasieg: 0, odstep: 1.5, szybkosc: 2.0, r: 0.32, wzrok: 4,
    koszt: { jagody: 50 }, czas: 10, era: 1, z: 'ratusz', opis: 'Zbiera surowce i buduje' },
  wojownik: { nazwa: 'Wojownik z pałką', emoji: '🛡️', hp: 45, atak: 5, pancerz: 1, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.34, wzrok: 6, wojsko: true,
    koszt: { jagody: 50, drewno: 20 }, czas: 12, era: 1, z: 'koszary', opis: 'Tani i mocny na początek' },
  wlocznik: { nazwa: 'Włócznik', emoji: '🔱', hp: 50, atak: 4, pancerz: 1, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.34, wzrok: 6, wojsko: true, przeciw: { jezdziec: 3 },
    koszt: { jagody: 35, drewno: 25 }, czas: 12, era: 2, z: 'koszary', opis: 'Bardzo mocny przeciw jeźdźcom' },
  procarz: { nazwa: 'Procarz', emoji: '🎯', hp: 30, atak: 4, pancerz: 0, zasieg: 5.5, odstep: 1.8, szybkosc: 2.2, r: 0.32, wzrok: 7, wojsko: true,
    koszt: { jagody: 30, drewno: 40 }, czas: 13, era: 2, z: 'strzelnica', opis: 'Rzuca kamieniami z daleka' },
  jezdziec: { nazwa: 'Jeździec', emoji: '🐎', hp: 100, atak: 8, pancerz: 2, zasieg: 0, odstep: 1.6, szybkosc: 3.4, r: 0.48, wzrok: 6, wojsko: true,
    koszt: { jagody: 80, zloto: 60 }, czas: 18, era: 2, z: 'stajnia', opis: 'Szybki i silny' },
  taran: { nazwa: 'Taran', emoji: '🪵', hp: 180, atak: 30, pancerz: 3, pancerzDystans: 12, zasieg: 0, odstep: 3, szybkosc: 1.2, r: 0.7, wzrok: 6, wojsko: true, tylkoBudynki: true,
    koszt: { drewno: 160, zloto: 75 }, czas: 25, era: 3, z: 'warsztat', opis: 'Burzy budynki, nie walczy z ludźmi' },
};

// w: rozmiar w kratkach (budynek zajmuje w × w); ludnosc: o ile więcej mieszkańców; skup: jakie surowce przyjmuje
// strzela: budynek sam strzela do wrogów; pole: można po nim chodzić, osadnik zbiera na nim jagody bez końca
export const BUDYNKI = {
  ratusz: { nazwa: 'Ratusz', emoji: '🏛️', w: 4, hp: 1400, koszt: { drewno: 275, kamien: 100 }, czas: 80, era: 2, ludnosc: 5,
    skup: ['jagody', 'drewno', 'kamien', 'zloto'], strzela: { atak: 3, zasieg: 6.5, odstep: 2 }, opis: 'Szkoli osadników, tu przechodzisz do nowej ery' },
  dom: { nazwa: 'Dom', emoji: '🏠', w: 2, hp: 250, koszt: { drewno: 30 }, czas: 12, era: 1, ludnosc: 5, opis: 'Miejsce dla 5 mieszkańców' },
  spichlerz: { nazwa: 'Spichlerz', emoji: '🧺', w: 3, hp: 400, koszt: { drewno: 100 }, czas: 20, era: 1, skup: ['jagody'], opis: 'Tu osadnicy odnoszą jagody' },
  tartak: { nazwa: 'Tartak', emoji: '🪚', w: 3, hp: 400, koszt: { drewno: 100 }, czas: 20, era: 1, skup: ['drewno'], opis: 'Tu osadnicy odnoszą drewno' },
  szopa: { nazwa: 'Szopa górników', emoji: '⛏️', w: 3, hp: 400, koszt: { drewno: 100 }, czas: 20, era: 1, skup: ['kamien', 'zloto'], opis: 'Tu osadnicy odnoszą kamień i złoto' },
  pole: { nazwa: 'Pole jagód', emoji: '🌱', w: 3, hp: 150, koszt: { drewno: 60 }, czas: 10, era: 1, pole: true, wymaga: 'spichlerz', opis: 'Jagody bez końca, pracuje 1 osadnik' },
  koszary: { nazwa: 'Koszary', emoji: '⚔️', w: 3, hp: 700, koszt: { drewno: 150 }, czas: 30, era: 1, opis: 'Szkolą wojowników i włóczników' },
  strzelnica: { nazwa: 'Strzelnica', emoji: '🎯', w: 3, hp: 600, koszt: { drewno: 175 }, czas: 30, era: 2, wymaga: 'koszary', opis: 'Szkoli procarzy' },
  stajnia: { nazwa: 'Stajnia', emoji: '🐎', w: 3, hp: 600, koszt: { drewno: 175 }, czas: 30, era: 2, wymaga: 'koszary', opis: 'Szkoli jeźdźców' },
  kuznia: { nazwa: 'Kuźnia', emoji: '⚒️', w: 3, hp: 600, koszt: { drewno: 150 }, czas: 30, era: 2, opis: 'Ulepsza broń i zbroje' },
  wieza: { nazwa: 'Wieża', emoji: '🗼', w: 2, hp: 800, koszt: { drewno: 50, kamien: 125 }, czas: 40, era: 2, strzela: { atak: 5, zasieg: 7.5, odstep: 1.6 }, opis: 'Sama strzela do wrogów' },
  warsztat: { nazwa: 'Warsztat', emoji: '🛠️', w: 3, hp: 600, koszt: { drewno: 200 }, czas: 35, era: 3, wymaga: 'kuznia', opis: 'Buduje tarany' },
};
export const KOLEJNOSC_BUDYNKOW = ['dom', 'spichlerz', 'tartak', 'szopa', 'pole', 'koszary', 'strzelnica', 'stajnia', 'kuznia', 'wieza', 'warsztat', 'ratusz'];

// przejście do nowej ery: w ratuszu; potrzeba surowców i kilku budynków z poprzedniej ery
export const NOWA_ERA = {
  2: { koszt: { jagody: 500 }, czas: 60, budynki: 2 },
  3: { koszt: { jagody: 800, zloto: 200 }, czas: 90, budynki: 2 },
};
// budynki, które liczą się do przejścia do nowej ery (domy i pola się nie liczą)
export const LICZA_DO_ERY = ['spichlerz', 'tartak', 'szopa', 'koszary', 'strzelnica', 'stajnia', 'kuznia', 'wieza', 'warsztat'];

export const ULEPSZENIA = {
  koszyki: { nazwa: 'Wielkie koszyki', emoji: '🧺', z: 'spichlerz', era: 1, koszt: { jagody: 50, drewno: 75 }, czas: 20, opis: 'Jagody zbiera się o 20% szybciej' },
  siekiery: { nazwa: 'Ostre siekiery', emoji: '🪓', z: 'tartak', era: 1, koszt: { jagody: 100, drewno: 50 }, czas: 20, opis: 'Drewno zbiera się o 20% szybciej' },
  kilofy: { nazwa: 'Mocne kilofy', emoji: '⛏️', z: 'szopa', era: 1, koszt: { jagody: 100, drewno: 75 }, czas: 20, opis: 'Kamień i złoto o 20% szybciej' },
  taczki: { nazwa: 'Taczki', emoji: '🛒', z: 'ratusz', era: 2, koszt: { jagody: 175, drewno: 50 }, czas: 30, opis: 'Osadnicy niosą więcej i chodzą szybciej' },
  plugi: { nazwa: 'Pługi', emoji: '🌾', z: 'spichlerz', era: 2, koszt: { jagody: 125, drewno: 125 }, czas: 25, opis: 'Pola dają o 30% więcej jagód' },
  bron1: { nazwa: 'Żelazne pałki', emoji: '🗡️', z: 'kuznia', era: 2, koszt: { jagody: 150 }, czas: 30, opis: 'Wojsko wręcz: +1 do ataku' },
  zbroja1: { nazwa: 'Skórzane zbroje', emoji: '🦺', z: 'kuznia', era: 2, koszt: { jagody: 100 }, czas: 30, opis: 'Całe wojsko: +1 do pancerza' },
  proce1: { nazwa: 'Lepsze proce', emoji: '🎯', z: 'kuznia', era: 2, koszt: { jagody: 100, zloto: 50 }, czas: 30, opis: 'Procarze: +1 do ataku i dalej rzucają' },
  bron2: { nazwa: 'Stalowe miecze', emoji: '⚔️', z: 'kuznia', era: 3, koszt: { jagody: 220, zloto: 120 }, czas: 40, wymaga: 'bron1', opis: 'Wojsko wręcz: jeszcze +2 do ataku' },
  zbroja2: { nazwa: 'Kolczugi', emoji: '🛡️', z: 'kuznia', era: 3, koszt: { jagody: 200, zloto: 100 }, czas: 40, wymaga: 'zbroja1', opis: 'Całe wojsko: jeszcze +2 do pancerza' },
  mury: { nazwa: 'Grube mury', emoji: '🧱', z: 'ratusz', era: 3, koszt: { kamien: 200, drewno: 100 }, czas: 40, opis: 'Budynki mają o 30% więcej życia' },
};

// tempo zbierania (na sekundę) i ile osadnik niesie naraz
export const ZBIERANIE = { jagody: 0.8, drewno: 0.65, kamien: 0.5, zloto: 0.5, pole: 0.5 };
export const UDZWIG = 10;
// ile jest w jednym drzewie, krzaku, skale
export const ZAPAS = { drzewo: 100, krzak: 125, kamien: 250, zloto: 250 };

// poziomy trudności (komputer): tempo zbierania, kiedy pierwszy atak (sekundy), ile wojska w kolejnych atakach
export const TRUDNOSC = {
  latwy: { nazwa: 'Łatwy', zbieranie: 0.7, pierwszyAtak: 720, fala: n => 4 + 2 * n, odstep: 240, osadnicy: [0, 14, 20, 24], wieze: 1 },
  sredni: { nazwa: 'Średni', zbieranie: 1.0, pierwszyAtak: 480, fala: n => 6 + 3 * n, odstep: 180, osadnicy: [0, 18, 26, 32], wieze: 2 },
  trudny: { nazwa: 'Trudny', zbieranie: 1.3, pierwszyAtak: 360, fala: n => 8 + 4 * n, odstep: 150, osadnicy: [0, 22, 32, 40], wieze: 3 },
};
