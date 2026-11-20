// Age of Haskap II: liczby do strojenia (jednostki, budynki, ery, ulepszenia, poziomy trudności).
// Nasza własna mapa ulepszeń, inspirowana jagodą kamczacką (haskap): ery rosną jak krzak, wojsko jeździ na reniferach i łosiach.
// Nazwy wewnętrzne (np. 'ratusz', 'koszary', 'szopa') zostają takie same jak w wersji 1, żeby zapisane gry dało się wczytać.

export const SUROWCE = ['jagody', 'drewno', 'kamien', 'zelazo'];
export const NAZWY_SUR = { jagody: 'jagody', drewno: 'drewno', kamien: 'kamień', zelazo: 'żelazo' };
export const EMOJI_SUR = { jagody: '🫐', drewno: '🪵', kamien: '🪨', zelazo: '⛓️' };
export const ERY = ['', 'Sadzonka', 'Kwitnienie', 'Owocowanie', 'Wielkie Zbiory'];
export const EMOJI_ERY = ['', '🌱', '🌸', '🫐', '🧺'];
export const START = { jagody: 200, drewno: 200, kamien: 150, zelazo: 50 };
export const MAKS_LUDNOSC = 100;

// atak: obrażenia jednego uderzenia; odstep: sekundy między uderzeniami; zasieg 0 = walczy wręcz
// linia + st: linia wojska i jej stopień (wyższy stopień daje awans w budynku, wtedy wszyscy z tej linii awansują)
// przeciw: mnożnik obrażeń przeciw całej linii (np. włócznicy przeciw reniferom); tylkoBudynki: atakuje tylko budynki
// oblezenie: pełne obrażenia budynkom także z daleka (katapulta)
const RENIFERY = { renifer: 3 };
export const JEDNOSTKI = {
  osadnik: { nazwa: 'Zbieracz', emoji: '🧑‍🌾', hp: 25, atak: 3, pancerz: 0, zasieg: 0, odstep: 1.5, szybkosc: 2.0, r: 0.32, wzrok: 4,
    koszt: { jagody: 50 }, czas: 10, era: 1, z: 'ratusz', opis: 'Zbiera surowce i buduje' },
  // Strażnica Krzaka: piechota
  wojownik: { nazwa: 'Kijarz', emoji: '🪵', linia: 'piechota', st: 1, hp: 45, atak: 5, pancerz: 1, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.34, wzrok: 6, wojsko: true,
    koszt: { jagody: 50, drewno: 20 }, czas: 12, era: 1, z: 'koszary', opis: 'Tani i mocny na początek' },
  tarczownik: { nazwa: 'Tarczownik', emoji: '🛡️', linia: 'piechota', st: 2, hp: 60, atak: 6, pancerz: 2, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.36, wzrok: 6, wojsko: true,
    koszt: { jagody: 55, zelazo: 20 }, czas: 12, era: 2, z: 'koszary', awans: 'aw_tarczownik', opis: 'Z tarczą, trudno go zranić' },
  obronca: { nazwa: 'Obrońca Sadu', emoji: '⚔️', linia: 'piechota', st: 3, hp: 75, atak: 8, pancerz: 3, zasieg: 0, odstep: 1.3, szybkosc: 2.1, r: 0.37, wzrok: 6, wojsko: true,
    koszt: { jagody: 60, zelazo: 30 }, czas: 12, era: 3, z: 'koszary', awans: 'aw_obronca', opis: 'Najsilniejszy piechur' },
  wlocznik: { nazwa: 'Włócznik z leszczyny', emoji: '🔱', linia: 'wlocznia', st: 1, hp: 45, atak: 3, pancerz: 0, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.34, wzrok: 6, wojsko: true, przeciw: RENIFERY,
    koszt: { jagody: 35, drewno: 25 }, czas: 11, era: 1, z: 'koszary', opis: 'Bardzo mocny przeciw jeźdźcom' },
  pikinier: { nazwa: 'Pikinier', emoji: '🔱', linia: 'wlocznia', st: 2, hp: 55, atak: 4, pancerz: 1, zasieg: 0, odstep: 1.4, szybkosc: 2.1, r: 0.35, wzrok: 6, wojsko: true, przeciw: { renifer: 3.5 },
    koszt: { jagody: 35, drewno: 25, zelazo: 10 }, czas: 11, era: 3, z: 'koszary', awans: 'aw_pikinier', opis: 'Żelazny grot: jeszcze mocniejszy przeciw jeźdźcom' },
  // strzelnica: proca i kusza
  procarz: { nazwa: 'Procarz', emoji: '🎯', linia: 'proca', st: 1, hp: 30, atak: 4, pancerz: 0, zasieg: 5.5, odstep: 1.8, szybkosc: 2.2, r: 0.32, wzrok: 7, wojsko: true,
    koszt: { jagody: 30, drewno: 40 }, czas: 13, era: 2, z: 'strzelnica', opis: 'Rzuca kamykami z daleka' },
  procarz2: { nazwa: 'Procarz z żelaznymi kulkami', emoji: '🎯', linia: 'proca', st: 2, hp: 32, atak: 5, pancerz: 0, zasieg: 6, odstep: 1.8, szybkosc: 2.2, r: 0.32, wzrok: 7.5, wojsko: true,
    koszt: { jagody: 30, drewno: 35, zelazo: 10 }, czas: 13, era: 2, z: 'strzelnica', awans: 'aw_procarz2', opis: 'Cięższe kulki, dalej rzuca' },
  kusznik: { nazwa: 'Kusznik', emoji: '🏹', linia: 'proca', st: 3, hp: 35, atak: 6, pancerz: 0, zasieg: 7, odstep: 2.0, szybkosc: 2.2, r: 0.33, wzrok: 8, wojsko: true,
    koszt: { jagody: 25, drewno: 45, zelazo: 20 }, czas: 14, era: 3, z: 'strzelnica', awans: 'aw_kusznik', opis: 'Strzela najdalej i najmocniej' },
  // Zagroda reniferów: jazda
  zwiadowca: { nazwa: 'Zwiadowca na reniferze', emoji: '🦌', linia: 'renifer', st: 1, hp: 60, atak: 4, pancerz: 0, zasieg: 0, odstep: 1.5, szybkosc: 3.8, r: 0.48, wzrok: 8, wojsko: true,
    koszt: { jagody: 80 }, czas: 14, era: 2, z: 'stajnia', opis: 'Bardzo szybki, dobry na zbieraczy' },
  jezdziec: { nazwa: 'Jeździec na reniferze', emoji: '🦌', linia: 'renifer', st: 2, hp: 100, atak: 8, pancerz: 2, zasieg: 0, odstep: 1.6, szybkosc: 3.5, r: 0.48, wzrok: 6, wojsko: true,
    koszt: { jagody: 70, zelazo: 50 }, czas: 18, era: 3, z: 'stajnia', awans: 'aw_jezdziec', opis: 'Szybki i silny' },
  rycerz: { nazwa: 'Rycerz na łosiu', emoji: '🫎', linia: 'renifer', st: 3, hp: 140, atak: 11, pancerz: 3, zasieg: 0, odstep: 1.6, szybkosc: 3.3, r: 0.55, wzrok: 6, wojsko: true,
    koszt: { jagody: 80, zelazo: 70 }, czas: 20, era: 4, z: 'stajnia', awans: 'aw_rycerz', opis: 'Najsilniejszy w całej dolinie' },
  // warsztat
  taran: { nazwa: 'Taran', emoji: '🪵', linia: 'taran', st: 1, hp: 180, atak: 30, pancerz: 3, pancerzDystans: 12, zasieg: 0, odstep: 3, szybkosc: 1.2, r: 0.7, wzrok: 6, wojsko: true, tylkoBudynki: true,
    koszt: { drewno: 160, zelazo: 75 }, czas: 25, era: 3, z: 'warsztat', opis: 'Burzy budynki, nie walczy z ludźmi' },
  katapulta: { nazwa: 'Katapulta', emoji: '❄️', linia: 'katapulta', st: 1, hp: 90, atak: 16, pancerz: 0, pancerzDystans: 6, zasieg: 8.5, odstep: 4.5, szybkosc: 1.0, r: 0.7, wzrok: 9, wojsko: true, oblezenie: true,
    koszt: { drewno: 200, zelazo: 120 }, czas: 30, era: 4, z: 'warsztat', opis: 'Rzuca zamrożonymi kulami z jagód, burzy budynki z daleka' },
};

// w: rozmiar w kratkach (budynek zajmuje w × w); ludnosc: o ile więcej mieszkańców; skup: jakie surowce przyjmuje
// strzela: budynek sam strzela do wrogów; pole: można po nim chodzić, zbieracz zbiera na nim jagody bez końca
export const BUDYNKI = {
  ratusz: { nazwa: 'Dworek Jagodowy', emoji: '🏡', w: 4, hp: 1400, koszt: { drewno: 275, kamien: 100 }, czas: 80, era: 2, ludnosc: 5,
    skup: ['jagody', 'drewno', 'kamien', 'zelazo'], strzela: { atak: 3, zasieg: 6.5, odstep: 2 }, opis: 'Szkoli zbieraczy, tu przechodzisz do nowej ery' },
  dom: { nazwa: 'Dom', emoji: '🏠', w: 2, hp: 250, koszt: { drewno: 30 }, czas: 12, era: 1, ludnosc: 5, opis: 'Miejsce dla 5 mieszkańców' },
  spichlerz: { nazwa: 'Spichlerz', emoji: '🧺', w: 3, hp: 400, koszt: { drewno: 100 }, czas: 20, era: 1, skup: ['jagody'], opis: 'Tu zbieracze odnoszą jagody, tu ulepszasz plantacje' },
  tartak: { nazwa: 'Tartak', emoji: '🪚', w: 3, hp: 400, koszt: { drewno: 100 }, czas: 20, era: 1, skup: ['drewno'], opis: 'Tu zbieracze odnoszą drewno' },
  szopa: { nazwa: 'Kamieniołom', emoji: '🪨', w: 3, hp: 400, koszt: { drewno: 100 }, czas: 20, era: 1, skup: ['kamien'], opis: 'Tu zbieracze odnoszą kamień' },
  kopalnia: { nazwa: 'Kopalnia rudy żelaza', emoji: '⛏️', w: 3, hp: 450, koszt: { drewno: 125, kamien: 25 }, czas: 25, era: 2, skup: ['zelazo'], opis: 'Tu zbieracze odnoszą rudę żelaza' },
  pole: { nazwa: 'Plantacja haskapu', emoji: '🌱', w: 3, hp: 150, koszt: { drewno: 60 }, czas: 10, era: 1, pole: true, wymaga: 'spichlerz', opis: 'Jagody bez końca, pracuje 1 zbieracz' },
  koszary: { nazwa: 'Strażnica Krzaka', emoji: '🛡️', w: 3, hp: 700, koszt: { drewno: 150 }, czas: 30, era: 1, opis: 'Szkoli kijarzy i włóczników' },
  strzelnica: { nazwa: 'Strzelnica', emoji: '🎯', w: 3, hp: 600, koszt: { drewno: 175 }, czas: 30, era: 2, wymaga: 'koszary', opis: 'Proca i kusza: szkoli strzelców' },
  stajnia: { nazwa: 'Zagroda reniferów', emoji: '🦌', w: 3, hp: 600, koszt: { drewno: 175 }, czas: 30, era: 2, wymaga: 'koszary', opis: 'Szkoli jeźdźców na reniferach i łosiach' },
  kuznia: { nazwa: 'Kuźnia', emoji: '⚒️', w: 3, hp: 600, koszt: { drewno: 150 }, czas: 30, era: 2, opis: 'Ulepsza broń, zbroje i pociski' },
  wieza: { nazwa: 'Ambona', emoji: '🗼', w: 2, hp: 800, koszt: { drewno: 50, kamien: 125 }, czas: 40, era: 2, strzela: { atak: 5, zasieg: 7.5, odstep: 1.6 }, opis: 'Sama strzela do wrogów' },
  warsztat: { nazwa: 'Warsztat', emoji: '🛠️', w: 3, hp: 600, koszt: { drewno: 200 }, czas: 35, era: 3, wymaga: 'kuznia', opis: 'Buduje tarany i katapulty' },
};
export const KOLEJNOSC_BUDYNKOW = ['dom', 'spichlerz', 'tartak', 'szopa', 'kopalnia', 'pole', 'koszary', 'strzelnica', 'stajnia', 'kuznia', 'wieza', 'warsztat', 'ratusz'];

// przejście do nowej ery: w Dworku; potrzeba surowców i kilku budynków z poprzedniej ery
export const NOWA_ERA = {
  2: { koszt: { jagody: 500 }, czas: 60, budynki: 2 },
  3: { koszt: { jagody: 800, zelazo: 200 }, czas: 90, budynki: 2 },
  4: { koszt: { jagody: 1000, zelazo: 600 }, czas: 120, budynki: 2 },
};
// budynki, które liczą się do przejścia do nowej ery (domy i plantacje się nie liczą)
export const LICZA_DO_ERY = ['spichlerz', 'tartak', 'szopa', 'kopalnia', 'koszary', 'strzelnica', 'stajnia', 'kuznia', 'wieza', 'warsztat'];

// ulepszenia; wymaga: najpierw inne ulepszenie; awans: po ulepszeniu cała linia wojska awansuje na tę jednostkę
export const ULEPSZENIA = {
  // Dworek Jagodowy
  rekawice: { nazwa: 'Rękawice zbieracza', emoji: '🧤', z: 'ratusz', era: 1, koszt: { jagody: 50, drewno: 25 }, czas: 20, opis: 'Zbieracze mają więcej życia' },
  kosz: { nazwa: 'Wiklinowy kosz', emoji: '🧺', z: 'ratusz', era: 1, koszt: { jagody: 75, drewno: 50 }, czas: 20, opis: 'Zbieracze niosą więcej naraz' },
  taczka: { nazwa: 'Taczka', emoji: '🛒', z: 'ratusz', era: 2, wymaga: 'kosz', koszt: { jagody: 150, drewno: 75 }, czas: 30, opis: 'Niosą jeszcze więcej i chodzą szybciej' },
  plecak1: { nazwa: 'Plecak z łyka', emoji: '🎒', z: 'ratusz', era: 1, koszt: { jagody: 60, drewno: 40 }, czas: 20, opis: 'Zbieracze niosą o 2 więcej' },
  plecak2: { nazwa: 'Plecak skórzany', emoji: '🎒', z: 'ratusz', era: 2, wymaga: 'plecak1', koszt: { jagody: 125, drewno: 75 }, czas: 30, opis: 'Niosą jeszcze o 3 więcej' },
  plecak3: { nazwa: 'Plecak na stelażu', emoji: '🎒', z: 'ratusz', era: 3, wymaga: 'plecak2', koszt: { jagody: 200, drewno: 100, zelazo: 40 }, czas: 40, opis: 'Niosą jeszcze o 4 więcej' },
  wozek: { nazwa: 'Wózek jagodowy', emoji: '🛻', z: 'ratusz', era: 3, wymaga: 'taczka', koszt: { jagody: 250, drewno: 150, zelazo: 50 }, czas: 40, opis: 'Najwięcej naraz i najszybciej' },
  // Spichlerz: plantacje
  sciolka: { nazwa: 'Ściółka', emoji: '🍂', z: 'spichlerz', era: 1, koszt: { jagody: 75, drewno: 75 }, czas: 20, opis: 'Plantacje dają o 15% więcej jagód' },
  nawadnianie: { nazwa: 'Nawadnianie', emoji: '💧', z: 'spichlerz', era: 2, wymaga: 'sciolka', koszt: { jagody: 150, drewno: 125 }, czas: 30, opis: 'Plantacje: jeszcze o 15% więcej' },
  mrozoodporne: { nazwa: 'Odmiany mrozoodporne', emoji: '❄️', z: 'spichlerz', era: 3, wymaga: 'nawadnianie', koszt: { jagody: 250, drewno: 150 }, czas: 40, opis: 'Plantacje: jeszcze o 20% więcej' },
  // Tartak
  deski: { nazwa: 'Deski', emoji: '🪵', z: 'tartak', era: 1, koszt: { jagody: 100, drewno: 50 }, czas: 20, opis: 'Drewno zbiera się o 15% szybciej' },
  siekiera_z: { nazwa: 'Żelazna siekiera', emoji: '🪓', z: 'tartak', era: 2, wymaga: 'deski', koszt: { jagody: 150, zelazo: 50 }, czas: 30, opis: 'Drewno: jeszcze o 20% szybciej' },
  pila: { nazwa: 'Piła ramowa', emoji: '🪚', z: 'tartak', era: 3, wymaga: 'siekiera_z', koszt: { jagody: 250, zelazo: 100 }, czas: 40, opis: 'Drewno: jeszcze o 20% szybciej' },
  // Kamieniołom
  kilof: { nazwa: 'Kilof', emoji: '⛏️', z: 'szopa', era: 1, koszt: { jagody: 100, drewno: 75 }, czas: 20, opis: 'Kamień zbiera się o 20% szybciej' },
  kilof_z: { nazwa: 'Żelazny kilof', emoji: '⛏️', z: 'szopa', era: 2, wymaga: 'kilof', koszt: { jagody: 150, zelazo: 50 }, czas: 30, opis: 'Kamień i ruda żelaza o 20% szybciej' },
  // Kuźnia: broń, zbroje, pociski (po 3 stopnie)
  bron1: { nazwa: 'Drewniana broń', emoji: '🪵', z: 'kuznia', era: 2, koszt: { jagody: 150 }, czas: 30, opis: 'Wojsko walczące wręcz: +1 do ataku' },
  bron2: { nazwa: 'Żelazna broń', emoji: '🗡️', z: 'kuznia', era: 3, wymaga: 'bron1', koszt: { jagody: 200, zelazo: 100 }, czas: 40, opis: 'Wręcz: jeszcze +1 do ataku' },
  bron3: { nazwa: 'Stalowa broń', emoji: '⚔️', z: 'kuznia', era: 4, wymaga: 'bron2', koszt: { jagody: 300, zelazo: 200 }, czas: 50, opis: 'Wręcz: jeszcze +2 do ataku' },
  zbroja1: { nazwa: 'Wiklinowa zbroja', emoji: '🧺', z: 'kuznia', era: 2, koszt: { jagody: 100, drewno: 50 }, czas: 30, opis: 'Całe wojsko: +1 do pancerza' },
  zbroja2: { nazwa: 'Skórzana zbroja', emoji: '🦺', z: 'kuznia', era: 3, wymaga: 'zbroja1', koszt: { jagody: 200, zelazo: 75 }, czas: 40, opis: 'Całe wojsko: jeszcze +1 do pancerza' },
  zbroja3: { nazwa: 'Kolczuga', emoji: '🛡️', z: 'kuznia', era: 4, wymaga: 'zbroja2', koszt: { jagody: 300, zelazo: 175 }, czas: 50, opis: 'Całe wojsko: jeszcze +2 do pancerza' },
  pociski1: { nazwa: 'Gładkie kamyki', emoji: '🪨', z: 'kuznia', era: 2, koszt: { jagody: 100, drewno: 50 }, czas: 30, opis: 'Strzelcy, Ambony i Dworek: +1 do ataku' },
  pociski2: { nazwa: 'Żelazne kulki', emoji: '⚫', z: 'kuznia', era: 3, wymaga: 'pociski1', koszt: { jagody: 150, zelazo: 75 }, czas: 40, opis: 'Strzelcy i Ambony: +1 do ataku i dalej' },
  pociski3: { nazwa: 'Stalowe groty', emoji: '🏹', z: 'kuznia', era: 4, wymaga: 'pociski2', koszt: { jagody: 250, zelazo: 150 }, czas: 50, opis: 'Strzelcy i Ambony: +1 do ataku i jeszcze dalej' },
  // awanse wojska
  aw_tarczownik: { nazwa: 'Awans: Tarczownik', emoji: '🛡️', z: 'koszary', era: 2, koszt: { jagody: 150, zelazo: 50 }, czas: 30, awans: 'tarczownik', opis: 'Wszyscy kijarze dostają tarcze' },
  aw_obronca: { nazwa: 'Awans: Obrońca Sadu', emoji: '⚔️', z: 'koszary', era: 3, wymaga: 'aw_tarczownik', koszt: { jagody: 250, zelazo: 150 }, czas: 40, awans: 'obronca', opis: 'Tarczownicy stają się Obrońcami Sadu' },
  aw_pikinier: { nazwa: 'Awans: Pikinier', emoji: '🔱', z: 'koszary', era: 3, koszt: { jagody: 200, zelazo: 100 }, czas: 35, awans: 'pikinier', opis: 'Włócznicy dostają żelazne groty' },
  aw_procarz2: { nazwa: 'Awans: żelazne kulki do proc', emoji: '🎯', z: 'strzelnica', era: 2, koszt: { jagody: 125, zelazo: 50 }, czas: 30, awans: 'procarz2', opis: 'Procarze rzucają żelaznymi kulkami' },
  aw_kusznik: { nazwa: 'Awans: Kusznik', emoji: '🏹', z: 'strzelnica', era: 3, wymaga: 'aw_procarz2', koszt: { jagody: 250, zelazo: 125 }, czas: 40, awans: 'kusznik', opis: 'Procarze dostają kusze' },
  aw_jezdziec: { nazwa: 'Awans: Jeździec na reniferze', emoji: '🦌', z: 'stajnia', era: 3, koszt: { jagody: 250, zelazo: 150 }, czas: 40, awans: 'jezdziec', opis: 'Zwiadowcy stają się jeźdźcami w zbrojach' },
  aw_rycerz: { nazwa: 'Awans: Rycerz na łosiu', emoji: '🫎', z: 'stajnia', era: 4, wymaga: 'aw_jezdziec', koszt: { jagody: 400, zelazo: 250 }, czas: 50, awans: 'rycerz', opis: 'Jeźdźcy przesiadają się na łosie' },
};

// tempo zbierania (na sekundę) i ile zbieracz niesie naraz
export const ZBIERANIE = { jagody: 0.8, drewno: 0.65, kamien: 0.5, zelazo: 0.5, pole: 0.5 };
export const UDZWIG = 10;
// ile jest w jednym drzewie, krzaku, skale
export const ZAPAS = { drzewo: 100, krzak: 125, kamien: 250, ruda: 450 };

// poziomy trudności (komputer): tempo zbierania, kiedy pierwszy atak (sekundy), ile wojska w kolejnych atakach,
// ilu zbieraczy w kolejnych erach, ile ambon
export const TRUDNOSC = {
  latwy: { nazwa: 'Łatwy', zbieranie: 0.7, pierwszyAtak: 720, fala: n => 4 + 2 * n, maksFala: n => 5 + 3 * n, odstep: 240, osadnicy: [0, 14, 20, 24, 26], wieze: 1 },
  sredni: { nazwa: 'Średni', zbieranie: 1.0, pierwszyAtak: 480, fala: n => 6 + 3 * n, odstep: 180, osadnicy: [0, 18, 26, 32, 36], wieze: 2 },
  trudny: { nazwa: 'Trudny', zbieranie: 1.3, pierwszyAtak: 360, fala: n => 8 + 4 * n, odstep: 150, osadnicy: [0, 22, 32, 40, 44], wieze: 3 },
};
