// Age of Polan: gra strategiczna o dawnych Słowianach (Polanie, około 1000 lat temu). Dowodzisz osadnikami, budujesz gród,
// wybierasz bogów (Perun, Weles, Swaróg i pomniejszych), modlisz się o łaskę, używasz mocy bogów, przyzywasz stwory
// z dawnych wierzeń i szkolisz bohaterów z podań. Gatunek jak w znanych grach o bogach i erach, ale nazwy, wygląd i liczby są nasze.
// Silnik wyrósł z Age of Haskap (folder age2/).
import * as THREE from '../survival/three.module.min.js';
import * as MOD from './modele.js';
import * as LUDZ from './postacie.js';
import { SUROWCE, EMOJI_SUR, NAZWY_SUR, ERY, EMOJI_ERY, START, MAKS_LUDNOSC, JEDNOSTKI, BUDYNKI, KOLEJNOSC_BUDYNKOW, NOWA_ERA, LICZA_DO_ERY,
  ULEPSZENIA, ZBIERANIE, UDZWIG, ZAPAS, TRUDNOSC, WIEZA_POZIOMY, MUR_POZIOMY, HANDEL, NAPRAWA, MAPY, EFEKTY, BOGOWIE, BOGOWIE_GLOWNI, MOCE, LASKA, BOHATER_ERA } from './dane.js';

const WERSJA = 8;
// wersje do wyboru przy uruchamianiu (najnowsza = ta gra, starsze = kopie w folderze wersje/)
const WERSJE = [
  { nr: 8, opis: 'Zagon prosa wygląda jak prawdziwe proso: gęste źdźbła z liśćmi i zwisającymi złotymi wiechami, które kołyszą się na wietrze. Do tego wszystko z wersji 7.' },
  { nr: 7, opis: 'Ludzie idący naprzeciw siebie mijają się od razu (schodzą w prawo), płoty przy zagonach i budynkach bez dziwnych linii. Do tego wszystko z wersji 6.', adres: 'wersje/7/' },
  { nr: 6, opis: 'Realistyczne postacie z prawdziwym ruchem (osadnicy, piechota, łucznicy): rąbią, żną, budują na klęczkach, noszą, walczą, trenują boks przy Gontynie i padają; szarfa w kolorze strony, hełmy, tarcze. Do tego wszystko z wersji 5.', adres: 'wersje/6/' },
  { nr: 5, opis: 'Mniej napisów u góry: o nowej erze mówi tylko Gród (czego brakuje albo wybór boga), krótsze podpowiedzi. Do tego wszystko z wersji 4.', adres: 'wersje/5/' },
  { nr: 4, opis: 'Nowe, dokładniejsze postacie: prawdziwe proporcje, twarze z brwiami, nosem i ustami, brody, lniane koszule z haftem, onuce, hełmy z nosalem; przy Gontynie osadnicy trenują jak bokserzy (garda i ciosy). Do tego wszystko z wersji 3.', adres: 'wersje/4/' },
  { nr: 3, opis: 'Modlitwa w Gontynie wygląda jak trening boksera (bieg w miejscu i ciosy); wstążki przy Gontynie i skrzydła stworów nie odlatują już od nich. Do tego wszystko z wersji 2.', adres: 'wersje/3/' },
  { nr: 2, opis: 'Nowa era na przycisku u góry ekranu (pisze, czego brakuje), w budynkach tylko to, co już można zrobić, czasy szkolenia jak w grach o bogach i erach, 27 nowych ulepszeń (od bogów, tarcze, mistrzowie linii), bohaterowie rosną z erami. Do tego wszystko z wersji 1.', adres: 'wersje/2/' },
  { nr: 1, opis: 'Pierwsza wersja: Polanie, 3 bogów głównych i 9 pomniejszych, łaska z modlitwy w Gontynie, 12 mocy bogów, 9 stworów, 3 bohaterów, 9 krain z ziem polskich.', adres: 'wersje/1/' },
];
const KLUCZ = 'age-of-polan-1';
const $ = id => document.getElementById(id);
const losowo = (a, b) => a + Math.random() * (b - a);

// mapa N × N kratek (do wyboru przy nowej grze: 144, 192, 240 albo 384 (Mega); do wersji 13: 96); Dworki stoją w rogach (±BAZA, ±BAZA)
const N_MAKS = 384, ROZMIARY = [144, 192, 240, 384];
let N = 192, POL = N / 2, BAZA = 60;
function ustawMape(n) {
  N = ROZMIARY.includes(n) ? n : 192; POL = N / 2; BAZA = Math.round(N * 60 / 192);
  MK = (MINI / 2) / (POL * Math.SQRT2);
  // chmury i ptaki są zrobione pod wielkość mapy: przy innej wielkości robimy je od nowa
  if (CHMURY && CHMURY.userData.n !== N) { scena.remove(CHMURY); for (const b of PTAKI) scena.remove(b.p); CHMURY = null; PTAKI = []; }
}

// ================= ustawienia i zapis =================
function wczytaj() {
  const z = { muzyka: true, dzwieki: true, trudnosc: 'latwy', wygrane: {}, gra: null };
  try { const s = JSON.parse(localStorage.getItem(KLUCZ)); if (s && typeof s === 'object') Object.assign(z, s); } catch (e) { /* brak zapisu */ }
  return z;
}
const zapis = wczytaj();
function zapiszDysk() { try { localStorage.setItem(KLUCZ, JSON.stringify(zapis)); } catch (e) { /* pełna pamięć albo tryb prywatny */ } }

// ================= mapa: kratki =================
const blok = new Uint8Array(N_MAKS * N_MAKS);   // 0 wolne, 1 zasób (drzewo, krzak, skała), 2 budynek, 4 pole (można chodzić, nie można budować), 5 brama,
                                                // 6 woda albo skały (nie da się wejść), 7 bród albo lód (można chodzić, nie można budować)
const naKom = new Int32Array(N_MAKS * N_MAKS);  // id zasobu albo budynku w tej kratce
const kom = (x, z) => { const i = Math.floor(x + POL), j = Math.floor(z + POL); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
const kom2 = (i, j) => (i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i);
const srodekKom = c => [(c % N) - POL + 0.5, Math.floor(c / N) - POL + 0.5];
const bramaStr = new Int8Array(N_MAKS * N_MAKS).fill(-1); // właściciel bramy w kratce
let RUCH = -1; // czyi ludzie teraz chodzą (przez swoje bramy przechodzą, przez cudze nie)
const wolnaKom = c => c >= 0 && (blok[c] === 0 || blok[c] === 4 || blok[c] === 7 || blok[c] === 5 && bramaStr[c] === RUCH);
// teren (rodzaje map): 0 ląd, 1 woda, 2 skały, 3 bród (płytka woda), 4 lód, 5 polanka zamknięta lasem (nie da się dojść, otwiera się po wycięciu drzewa)
const TEREN = new Uint8Array(N_MAKS * N_MAKS);
const wolneXZ = (x, z) => wolnaKom(kom(x, z));

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// gładki szum 0..1 (do rozkładu gatunków drzew, ozdób i kolorów ziemi)
function szumMapy(x, z, ziarno = 0) {
  const h = (i, j) => { let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(ziarno, 982451653)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  return (h(i, j) * (1 - ux) + h(i + 1, j) * ux) * (1 - uz) + (h(i, j + 1) * (1 - ux) + h(i + 1, j + 1) * ux) * uz;
}
const szum2 = (x, z, ziarno) => szumMapy(x, z, ziarno) * 0.65 + szumMapy(x * 2.7, z * 2.7, ziarno + 7) * 0.35;

// ================= stan gry =================
let S = null;                 // stan zapisywany
// rodzaj mapy (stare zapisy: Dolina) i jej motyw (kolory ziemi, drzewa, ozdoby)
const typMapy = () => (S && MAPY[S.mapaTyp] ? S.mapaTyp : 'dolina');
const motyw = () => MAPY[typMapy()].motyw;
const E = new Map();          // wszystko, co ma id: zasoby, budynki, jednostki
const ZAS = new Map();        // zasoby na mapie
const ZAS_TYP = { jagody: [], drewno: [], kamien: [], zelazo: [], zloto: [] };
let JED = [], BUD = [], POC = [], UMIERA = [];
let wybrane = [];
let pauza = true;
let tryb = null;              // stawianie budynku: { typ, i0, j0, ok, duch, plama }
let trybObszar = false;       // zaznaczanie ramką

// strona 0 to gracz, strony 1–3 to komputery (KOMPUTER = pierwszy z nich)
const STRONA_GRACZA = 0, KOMPUTER = 1;
const ileStron = () => (S && S.strony) || 2;
// wrogowie: każdy na każdego albo komputery w jednej drużynie (S.druzyna)
const wrogowie = (a, b) => a !== b && !(S && S.druzyna && S.druzyna[a] === S.druzyna[b]);
const trudnoscStrony = s => s === STRONA_GRACZA ? S.trudnoscGracza : (S.trudnosci && S.trudnosci[s]) || S.trudnosc;
// Dworki w rogach mapy: gracz (+, +), pierwszy komputer naprzeciwko, następni w pozostałych rogach
const ROGI = [[1, 1], [-1, -1], [1, -1], [-1, 1]];
const bazaStrony = s => [ROGI[s][0] * BAZA, ROGI[s][1] * BAZA];
const NAZWY_STRON = ['niebieska', 'czerwona', 'żółta', 'fioletowa'], ZNAK_STRON = ['🔵', '🔴', '🟡', '🟣'], KOLORY_MINI = ['#7fb2ff', '#ff6a5a', '#ffd84a', '#c48aff'];
const dyst = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function dystDoProst(x, z, b) {
  const h = b.w / 2, dx = Math.max(b.x - h - x, 0, x - b.x - h), dz = Math.max(b.z - h - z, 0, z - b.z - h);
  return Math.hypot(dx, dz);
}
const jestBudynkiem = e => !!(e && e.d && e.d.w);
const zyje = e => e && E.get(e.id) === e && e.hp > 0;

// ================= grafika =================
const scena = new THREE.Scene();
scena.fog = new THREE.Fog('#d4ebf5', 90, 330);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('scena').appendChild(renderer.domElement);
const plotno = renderer.domElement;
const kamera = new THREE.PerspectiveCamera(40, 1, 0.5, 600);
const kam = { x: 30, z: 30, d: 30, kat: Math.PI / 4 };
scena.add(new THREE.HemisphereLight('#f4f8ff', '#6b8f4e', 1.05));
// niebo: od jasnego przy ziemi do błękitu u góry
scena.background = (() => {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#6fb6ea'); g.addColorStop(0.6, '#a9d6f2'); g.addColorStop(1, '#e3f1f7');
  c.fillStyle = g; c.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
scena.fog.color.set('#d4ebf5');
const slonce = new THREE.DirectionalLight('#fff4dc', 1.7);
slonce.castShadow = true; slonce.shadow.mapSize.set(2048, 2048); slonce.shadow.bias = -0.0005;
scena.add(slonce, slonce.target);
const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
// faktury i ruch liczone przez kartę graficzną: słoje drewna, strzecha, gont, cegły, kamień, liście;
// nogi i ręce ludzi i zwierząt, koła wozów, drzewa i trawa na wietrze
const SZUM_GLSL = `
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float szum(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }`;
MAT.onBeforeCompile = sh => {
  sh.uniforms.uCzas = { value: 0 }; sh.uniforms.uFaza = { value: 0 }; sh.uniforms.uAmp = { value: 0 }; sh.uniforms.uKolo = { value: 0 };
  MAT.userData.sh = sh;
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', `#include <common>
attribute float wzor; attribute vec4 staw;
uniform float uCzas; uniform float uFaza; uniform float uAmp; uniform float uKolo;
varying float vWzor; varying vec3 vWPos; varying vec3 vWNorm;`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
if (staw.x > 0.5 && staw.x < 1.5) {
  float a = sin(uFaza) * 0.6 * uAmp * staw.z; float yy = transformed.y - staw.y, zz = transformed.z - staw.w;
  transformed.y = staw.y + yy * cos(a) - zz * sin(a); transformed.z = staw.w + yy * sin(a) + zz * cos(a);
} else if (staw.x > 1.5 && staw.x < 2.5) {
  float ph = 0.0;
  #ifdef USE_INSTANCING
  ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.45;
  #endif
  float wys = max(0.0, transformed.y - 0.25);
  transformed.x += sin(uCzas * 1.7 + ph) * staw.z * wys; transformed.z += cos(uCzas * 1.3 + ph * 1.3) * staw.z * 0.6 * wys;
} else if (staw.x > 2.5) {
  float a = uKolo; float yy = transformed.y - staw.y, zz = transformed.z - staw.w;
  transformed.y = staw.y + yy * cos(a) - zz * sin(a); transformed.z = staw.w + yy * sin(a) + zz * cos(a);
}`)
    .replace('#include <project_vertex>', `#include <project_vertex>
vec4 wp4 = vec4(transformed, 1.0); vec3 wn = objectNormal;
#ifdef USE_INSTANCING
wp4 = instanceMatrix * wp4; wn = mat3(instanceMatrix) * wn;
#endif
wp4 = modelMatrix * wp4; vWPos = wp4.xyz; vWNorm = normalize(mat3(modelMatrix) * wn); vWzor = wzor;`);
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', `#include <common>
varying float vWzor; varying vec3 vWPos; varying vec3 vWNorm;` + SZUM_GLSL)
    .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 an = abs(vWNorm); vec3 p = vWPos; float m = 1.0;
  vec2 uv = an.y > max(an.x, an.z) ? p.xz : (an.x > an.z ? p.zy : p.xy);
  float w = vWzor;
  if (w > 0.5 && w < 1.5) { float n = szum(vec2(uv.x * 2.0, uv.y * 16.0)); m = 0.84 + 0.2 * n + 0.07 * sin(uv.y * 70.0 + n * 7.0) + 0.05 * sin(uv.x * 90.0 + n * 3.0); }
  else if (w > 1.5 && w < 2.5) { float n = szum(vec2(p.x * 26.0 + p.z * 26.0, p.y * 5.0)); float n2 = szum(vec2(p.x * 7.0, p.z * 7.0)); m = 0.74 + 0.32 * n + 0.1 * n2; }
  else if (w > 2.5 && w < 3.5) { float r = floor(p.z * 6.0 + p.y * 6.0); vec2 f = fract(vec2((p.x + p.z * 0.0) * 4.0 + mod(r, 2.0) * 0.5, p.z * 6.0 + p.y * 6.0)); m = 0.82 + 0.18 * smoothstep(0.0, 0.18, f.y) * smoothstep(0.0, 0.06, f.x) + 0.1 * h21(vec2(floor(f.x + p.x * 4.0), r)); }
  else if (w > 3.5 && w < 4.5) { float r = floor(p.y * 9.0); vec2 f = fract(vec2(uv.x * 4.5 + mod(r, 2.0) * 0.5, p.y * 9.0)); float zap = (f.y < 0.12 || f.x < 0.05) ? 1.35 : 0.92 + 0.14 * h21(vec2(floor(uv.x * 4.5 + mod(r, 2.0) * 0.5), r)); m = zap; }
  else if (w > 4.5 && w < 5.5) { m = 0.78 + 0.28 * szum(uv * 3.0) * (0.7 + 0.3 * szum(uv * 11.0)); }
  else if (w > 5.5) { m = 0.8 + 0.34 * szum(vec2(p.x + p.z, p.y) * 7.0) * (0.75 + 0.25 * szum(p.xz * 3.0)); }
  // przy samej ziemi trochę ciemniej: budynki, ludzie i drzewa lepiej „stoją”
  m *= mix(0.74, 1.0, smoothstep(0.0, 0.45, p.y));
  diffuseColor.rgb *= m;
}`);
};
MAT.customProgramCacheKey = () => 'haskap-faktury-1';
const MAT_RING = [new THREE.MeshBasicMaterial({ color: '#4cff7a', transparent: true, opacity: 0.9, depthWrite: false }), new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: 0.9, depthWrite: false })];
const MAT_PLAC = new THREE.MeshLambertMaterial({ color: '#b0814f' });
const MAT_ZNACZNIK = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false });

// motywy map: kolory ziemi (od nizin do łąk), suche plamy, runo pod lasem, źdźbła, kwiaty, ścieżki, woda, mała mapka, mgła, okolica za mapą
const MOTYWY = {
  lato: { kol: [[86, 150, 64], [112, 182, 84], [146, 200, 100], [176, 192, 104]], suche: [168, 170, 96], runo: 'rgba(48,78,34,0.42)', przyKrzaku: 'rgba(60,110,50,0.35)',
    zdzbla: ['rgba(40,100,35,0.35)', 'rgba(150,210,110,0.35)', 'rgba(90,150,60,0.4)', 'rgba(200,220,140,0.3)'], kwiaty: 900,
    sciezka: ['rgba(160,128,84,0.35)', 'rgba(178,146,100,0.5)', 'rgba(196,166,120,0.45)'], plac: ['rgba(190,156,108,0.65)', 'rgba(196,164,116,0.5)'],
    brzeg: '#cbb88a', woda: '#3d8fcf', glebia: '#2b70ad', brod: '#7fb8d6', skala: '#8d877c', lod: '#dcecf6', lodBrzeg: '#c6dbe8', mini: '#7cc35e', mgla: '#d4ebf5',
    okolica: ['#5f9e4a', '#5d9a44', '#3f7a35', '#c9b98a'] },
  puszcza: { kol: [[58, 104, 44], [72, 124, 54], [90, 142, 62], [112, 146, 70]], suche: [120, 128, 70], runo: 'rgba(36,62,26,0.45)', przyKrzaku: 'rgba(50,95,42,0.35)',
    zdzbla: ['rgba(30,80,28,0.4)', 'rgba(110,170,80,0.3)', 'rgba(70,120,50,0.4)', 'rgba(150,170,100,0.25)'], kwiaty: 250,
    sciezka: ['rgba(130,100,64,0.4)', 'rgba(150,118,78,0.5)', 'rgba(170,138,96,0.45)'], plac: ['rgba(170,136,92,0.65)', 'rgba(180,146,100,0.5)'],
    brzeg: '#a99868', woda: '#3a7fb8', glebia: '#2a6399', brod: '#76a8c4', skala: '#7d786e', lod: '#dcecf6', lodBrzeg: '#c6dbe8', mini: '#4f8a3e', mgla: '#cfe3df',
    okolica: ['#4a8a3e', '#47853a', '#335f2c', '#9b9466'] },
  zima: { kol: [[208, 220, 230], [224, 233, 241], [238, 244, 249], [216, 226, 236]], suche: [166, 172, 160], runo: 'rgba(150,170,185,0.35)', przyKrzaku: 'rgba(170,190,205,0.3)',
    zdzbla: ['rgba(255,255,255,0.45)', 'rgba(190,206,222,0.35)', 'rgba(150,170,150,0.25)', 'rgba(230,240,250,0.4)'], kwiaty: 0,
    sciezka: ['rgba(170,182,195,0.18)', 'rgba(182,194,206,0.26)', 'rgba(196,206,216,0.24)'], plac: ['rgba(170,165,155,0.6)', 'rgba(185,180,170,0.45)'],
    brzeg: '#b9c8d4', woda: '#4b8fc4', glebia: '#336fa3', brod: '#8fbad6', skala: '#8a8a88', lod: '#cfe6f5', lodBrzeg: '#b8d3e6', mini: '#e4edf4', mgla: '#e4eef6',
    okolica: ['#e2ebf2', '#dfe8f0', '#c3d0db', '#e8eef3'] },
  piasek: { kol: [[206, 176, 118], [220, 192, 134], [232, 208, 154], [214, 184, 122]], suche: [186, 160, 104], runo: 'rgba(150,120,70,0.3)', przyKrzaku: 'rgba(120,130,70,0.3)',
    zdzbla: ['rgba(170,140,90,0.3)', 'rgba(250,235,200,0.3)', 'rgba(190,160,100,0.3)', 'rgba(230,210,160,0.3)'], kwiaty: 0,
    sciezka: ['rgba(170,136,90,0.35)', 'rgba(184,150,104,0.45)', 'rgba(196,164,118,0.4)'], plac: ['rgba(180,146,100,0.55)', 'rgba(190,156,108,0.45)'],
    brzeg: '#7f9a52', woda: '#3a9ac4', glebia: '#2a78a8', brod: '#86c2d6', skala: '#b08a60', lod: '#dcecf6', lodBrzeg: '#c6dbe8', mini: '#dcc286', mgla: '#efe4cc',
    okolica: ['#d6bd84', '#d2b67c', '#b89a62', '#d8c08a'] },
  bagno: { kol: [[68, 112, 58], [86, 128, 64], [104, 140, 70], [96, 116, 66]], suche: [116, 110, 72], runo: 'rgba(40,66,32,0.42)', przyKrzaku: 'rgba(60,100,48,0.35)',
    zdzbla: ['rgba(40,90,35,0.38)', 'rgba(130,180,96,0.32)', 'rgba(80,130,56,0.4)', 'rgba(160,170,110,0.28)'], kwiaty: 400,
    sciezka: ['rgba(120,100,70,0.4)', 'rgba(136,114,82,0.5)', 'rgba(152,130,96,0.45)'], plac: ['rgba(160,132,94,0.65)', 'rgba(170,142,102,0.5)'],
    brzeg: '#6f6a48', woda: '#3f7f8f', glebia: '#2f6472', brod: '#7aa6a8', skala: '#7d786e', lod: '#dcecf6', lodBrzeg: '#c6dbe8', mini: '#5f8f4c', mgla: '#d6e6dc',
    okolica: ['#4f8a44', '#4c853f', '#38642f', '#8f8a62'] },
};
const motywMapy = () => MOTYWY[motyw()];
function malujZiemie(seed) {
  const R = 2048, sk = R / N, cv = document.createElement('canvas'); cv.width = cv.height = R;
  const c = cv.getContext('2d'), r = rng(seed * 13 + 7), zi = seed % 997, M0 = motywMapy();
  // 1. podstawa: łąki jaśniejsze, niziny ciemniejsze, gdzieniegdzie wyschnięta trawa (mała mapa rozciągnięta z wygładzeniem)
  const M = 256, mc = document.createElement('canvas'); mc.width = mc.height = M;
  const mx = mc.getContext('2d'), im = mx.createImageData(M, M);
  const KOL = M0.kol;
  for (let py = 0; py < M; py++) for (let px = 0; px < M; px++) {
    const x = px / M * N - POL, z = py / M * N - POL;
    const n = szum2(x * 0.06, z * 0.06, zi), d = szumMapy(x * 0.18, z * 0.18, zi + 3);
    let t = Math.min(2.999, Math.max(0, n * 3.2 - 0.4)), a = Math.floor(t), f = t - a;
    let col = KOL[a].map((v, k) => v + (KOL[Math.min(3, a + 1)][k] - v) * f);
    if (d > 0.72) col = col.map((v, k) => v + (M0.suche[k] - v) * (d - 0.72) * 2.2);
    const o = (py * M + px) * 4; im.data[o] = col[0]; im.data[o + 1] = col[1]; im.data[o + 2] = col[2]; im.data[o + 3] = 255;
  }
  mx.putImageData(im, 0, 0);
  c.imageSmoothingEnabled = true; c.drawImage(mc, 0, 0, R, R);
  const plama = (x, z, rad, kol) => { const g = c.createRadialGradient(x, z, 0, x, z, rad); g.addColorStop(0, kol); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, z - rad, rad * 2, rad * 2); };
  const P = v => (v + POL) * sk;
  // 2. runo pod lasem (ciemniej, igły i liście), żwir przy skałach, ciemniejsza trawa przy krzakach
  for (const z0 of ZAS.values()) {
    const x = P(z0.x), z = P(z0.z);
    if (z0.rodzaj === 'drzewo') plama(x, z, 1.5 * sk, M0.runo);
    else if (z0.rodzaj === 'krzak') plama(x, z, 1.1 * sk, M0.przyKrzaku);
    else plama(x, z, 1.25 * sk, 'rgba(150,138,118,0.55)');
  }
  for (const z0 of ZAS.values()) {
    const x = P(z0.x), z = P(z0.z);
    if (z0.rodzaj === 'drzewo') for (let i = 0; i < 6; i++) { c.fillStyle = r() < 0.5 ? 'rgba(120,80,40,0.5)' : 'rgba(70,100,40,0.5)'; c.fillRect(x + (r() - 0.5) * 2.4 * sk, z + (r() - 0.5) * 2.4 * sk, 3, 1.5); }
    else if (z0.rodzaj !== 'krzak') for (let i = 0; i < 10; i++) { c.fillStyle = r() < 0.5 ? '#8f8b84' : '#b3ada3'; c.beginPath(); c.arc(x + (r() - 0.5) * 2 * sk, z + (r() - 0.5) * 2 * sk, 1.5 + r() * 2, 0, 7); c.fill(); }
  }
  // 3. wydeptane ścieżki od Dworków do środka mapy (lekko kręte)
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let s = 0; s < ileStron(); s++) {
    const [sx, sz] = ROGI[s], zn = s === 1 ? -1 : s === 0 ? 1 : s, pkt = [];
    for (let t = 0; t <= 1.0001; t += 0.025) { const b = BAZA * (1 - t), w = Math.sin(t * 9 + zn) * 3 * Math.sin(t * Math.PI); pkt.push([sx * (b + w), sz * (b - w)]); }
    for (const [szer, kol] of [[1.9, M0.sciezka[0]], [1.2, M0.sciezka[1]], [0.5, M0.sciezka[2]]]) {
      c.strokeStyle = kol; c.lineWidth = szer * sk; c.beginPath(); pkt.forEach(([x, z], i) => i ? c.lineTo(P(x), P(z)) : c.moveTo(P(x), P(z))); c.stroke();
    }
  }
  // 4. place przy Dworkach
  for (let s = 0; s < ileStron(); s++) { const [x, z] = bazaStrony(s); plama(P(x), P(z), 7.5 * sk, M0.plac[0]); plama(P(x), P(z), 4.5 * sk, M0.plac[1]); }
  // 5. drobne szczegóły: źdźbła trawy, kwiatki, kamyczki
  for (let i = 0; i < 52000; i++) {
    const x = r() * R, z = r() * R, q = r();
    c.fillStyle = q < 0.35 ? M0.zdzbla[0] : q < 0.7 ? M0.zdzbla[1] : q < 0.85 ? M0.zdzbla[2] : M0.zdzbla[3];
    c.fillRect(x, z, 1.5, 3 + r() * 4);
  }
  for (let i = 0; i < M0.kwiaty; i++) { c.fillStyle = ['#ffffff', '#ffe066', '#ff9ec7', '#b6a6ff', '#ffb347'][Math.floor(r() * 5)]; c.beginPath(); c.arc(r() * R, r() * R, 2 + r() * 1.5, 0, 7); c.fill(); }
  for (let i = 0; i < 900; i++) { c.fillStyle = r() < 0.5 ? 'rgba(120,115,105,0.6)' : 'rgba(170,165,150,0.6)'; c.beginPath(); c.arc(r() * R, r() * R, 1 + r() * 2, 0, 7); c.fill(); }
  // 6. teren: brzegi, woda, brody, lód i skały
  malujTeren(c, P, sk, M0, r);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// klepisko pod budynkiem (miękkie brzegi)
const MAT_KLEP = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 20, 64, 64, 64); g.addColorStop(0, 'rgba(184,150,104,0.95)'); g.addColorStop(0.7, 'rgba(184,150,104,0.75)'); g.addColorStop(1, 'rgba(184,150,104,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 160; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(120,95,60,0.35)' : 'rgba(220,200,160,0.35)'; c.fillRect(20 + Math.random() * 88, 20 + Math.random() * 88, 2, 2); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshLambertMaterial({ map: t, transparent: true, depthWrite: false });
})();
const GEO_KLEP = {};
// cienie pod ludzikami: jedna warstwa kółek dla wszystkich
const CIENIE = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }), 400);
CIENIE.count = 0; CIENIE.frustumCulled = false; CIENIE.renderOrder = 1;
let ziemia = null, dalej = null;
const INST = {}; // instancje drzew, krzaków i skał

// ================= dźwięk =================
let AC = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
  if (AC) zaladujOdglosy();
  return AC;
}
function ton(f1, f2, czas, typ = 'sine', gl = 0.12, opozn = 0) {
  const ac = AC; if (!ac) return;
  const t = ac.currentTime + opozn, o = ac.createOscillator(), g = ac.createGain();
  o.type = typ; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + czas);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gl, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + czas);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + czas + 0.02);
}
let szumBufor = null;
function szum(czas, gl = 0.1, f = 1200, opozn = 0) {
  const ac = AC; if (!ac) return;
  if (!szumBufor) { szumBufor = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = szumBufor.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = ac.currentTime + opozn, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = szumBufor; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = 0.8;
  g.gain.setValueAtTime(gl, t); g.gain.exponentialRampToValueAtTime(0.0001, t + czas);
  s.connect(fl).connect(g).connect(ac.destination); s.start(t); s.stop(t + czas + 0.02);
}
const ostDzwiek = {};
// ================= nagrane dźwięki (CC0, źródła w dzwieki/ZRODLA.md), głośność i strona zależne od kamery =================
const ODGLOSY = {
  miecz: 4, zamach: 3, tarcza: 3, siekiera: 3, kilof: 3, kowadlo: 2, mlotek: 3, monety: 2, walenie: 3, drzewo: 2, brama: 2, krok: 4, krzak: 2,
  odloz: 1, ulepszenie: 1, skrzyp: 1, kamyk: 1,
};
const BUF = {};
let odglosyLaduja = false, grajace = 0;
const ostOdglos = {};
function zaladujOdglosy() {
  if (odglosyLaduja || !AC) return; odglosyLaduja = true;
  for (const [n, ile] of Object.entries(ODGLOSY)) for (let i = 1; i <= ile; i++) {
    const nazwa = ile === 1 ? n : n + i;
    fetch('../age2/dzwieki/' + nazwa + '.wav').then(r => r.arrayBuffer()).then(d => AC.decodeAudioData(d)).then(b => { (BUF[n] || (BUF[n] = [])).push(b); }).catch(() => {});
  }
}
// odgłos w miejscu (x, z): bliżej środka ekranu i przy przybliżeniu głośniej, z lewej strony ekranu słychać z lewej
function odglos(n, x, z, glosnosc = 1, ostep = 70) {
  if (!zapis.dzwieki || !AC || symulacja || !BUF[n] || !BUF[n].length) return false;
  const t = performance.now(); if (ostOdglos[n] && t - ostOdglos[n] < ostep) return true; if (grajace > 14) return true;
  let g = glosnosc, pan = 0;
  if (x != null) {
    const [sx, sy, sz] = naEkran(x, 0.5, z), W = innerWidth, Hh = innerHeight;
    if (sz > 1 || sx < -120 || sx > W + 120 || sy < -120 || sy > Hh + 120) return true;
    const odSr = Math.min(1, Math.hypot(sx - W / 2, sy - Hh * 0.45) / (Math.max(W, Hh) * 0.6));
    g *= Math.max(0.15, Math.min(1.4, 24 / kam.d)) * (1 - 0.55 * odSr);
    pan = Math.max(-1, Math.min(1, (sx - W / 2) / (W / 2))) * 0.75;
  }
  if (g < 0.03) return true;
  ostOdglos[n] = t;
  const lista = BUF[n], b = lista[Math.floor(Math.random() * lista.length)];
  const src = AC.createBufferSource(), gain = AC.createGain();
  src.buffer = b; src.playbackRate.value = 0.92 + Math.random() * 0.16; gain.gain.value = g * 0.6;
  let wyj = gain;
  if (AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = pan; gain.connect(p); wyj = p; }
  src.connect(gain); wyj.connect(AC.destination);
  grajace++; src.onended = () => { grajace--; };
  src.start();
  return true;
}
const TARCZOWNI = ['tarczownik', 'obronca', 'wlocznik', 'pikinier', 'wojownik'];
function odglosUderzenia(u, c) {
  const x = (u.x + c.x) / 2, z = (u.z + c.z) / 2;
  if (jestBudynkiem(c)) return odglos(c.typ === 'mur' && poziomMuru(c.strona) > 1 || c.typ === 'wieza' && (c.poziom || 1) > 1 ? 'kilof' : 'mlotek', x, z, 0.8);
  if (u.typ === 'osadnik' || u.d.tylkoBudynki) return odglos('mlotek', x, z, 0.7);
  if (TARCZOWNI.includes(c.typ) && Math.random() < 0.45) return odglos('tarcza', x, z);
  return odglos('miecz', x, z);
}

function dzwiek(n) {
  if (!zapis.dzwieki || !AC || symulacja) return;
  const t = performance.now(); if (ostDzwiek[n] && t - ostDzwiek[n] < 70) return; ostDzwiek[n] = t;
  switch (n) {
    case 'klik': ton(800, 600, 0.05, 'triangle', 0.08); break;
    case 'tak': ton(520, 700, 0.07, 'triangle', 0.08); ton(700, 900, 0.07, 'triangle', 0.06, 0.06); break;
    case 'rozkaz': ton(660, 440, 0.08, 'square', 0.04); break;
    case 'blad': ton(220, 160, 0.18, 'square', 0.05); break;
    case 'buduj': [523, 659, 784].forEach((f, i) => ton(f, f, 0.16, 'triangle', 0.1, i * 0.08)); break;
    case 'gotowe': ton(880, 1180, 0.1, 'triangle', 0.07); break;
    case 'uderz': szum(0.07, 0.07, 700); ton(180, 110, 0.07, 'square', 0.03); break;
    case 'rzut': szum(0.1, 0.05, 2600); break;
    case 'zniszcz': szum(0.5, 0.2, 260); ton(140, 50, 0.45, 'square', 0.06); break;
    case 'alarm': [440, 330, 440, 330].forEach((f, i) => ton(f, f, 0.15, 'sawtooth', 0.05, i * 0.17)); break;
    case 'era': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => ton(f, f, 0.22, 'triangle', 0.12, i * 0.11)); break;
    case 'wygrana': [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => ton(f, f, 0.3, 'triangle', 0.13, i * 0.13)); break;
    case 'przegrana': [392, 330, 262, 196].forEach((f, i) => ton(f, f, 0.35, 'triangle', 0.12, i * 0.2)); break;
  }
}
// ================= muzyka (CC0, autorzy w muzyka/ZRODLA.md) =================
// g: wyrównanie głośności (utwory są nagrane różnie głośno), od: od której ery gra, cisza: sekundy ciszy na końcu do pominięcia
const UTWORY = {
  spokoj: [
    { plik: 'ognisko', g: 2.2, od: 1 }, { plik: 'celtycka', g: 1, od: 1, cisza: 1.8 }, { plik: 'laki', g: 0.8, od: 1 },
    { plik: 'wedrowka', g: 2.2, od: 1, cisza: 4.4 }, { plik: 'targ', g: 0.5, od: 2 }, { plik: 'zniwa', g: 0.65, od: 3, cisza: 2 },
    { plik: 'uczta', g: 0.9, od: 4 },
  ],
  walka: [{ plik: 'bitwa', g: 0.9, cisza: 7 }],
};
const MUZ_GLOSNOSC = 0.24, MUZ_PRZEJSCIE = 2.5;
// krótka cisza: odtworzona po dotknięciu „odblokowuje” odtwarzacz w telefonie (iPhone pozwala potem zmieniać mu utwory)
const CISZA = (() => { const n = 441, b = new Uint8Array(44 + n * 2), v = new DataView(b.buffer), t = (o, s) => { for (let i = 0; i < 4; i++) b[o + i] = s.charCodeAt(i); };
  t(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); t(8, 'WAVE'); t(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 22050, true); v.setUint32(28, 44100, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); t(36, 'data'); v.setUint32(40, n * 2, true);
  let s = ''; for (const x of b) s += String.fromCharCode(x); return 'data:audio/wav;base64,' + btoa(s); })();
const ODTWARZACZE = [];
const muz = { spokoj: null, walka: null, wygasa: [], ostatnie: [] };
let walkaT = -99;
function odtwarzacze() {
  if (!ODTWARZACZE.length) for (let i = 0; i < 3; i++) { const a = new Audio(); a.preload = 'auto'; ODTWARZACZE.push({ a, g: null, ok: false }); }
  // głośność przez WebAudio (na iPhonie zwykła głośność odtwarzacza nie działa)
  if (AC) for (const e of ODTWARZACZE) if (!e.g && !e.bezAC) { try { const g = AC.createGain(); AC.createMediaElementSource(e.a).connect(g); g.connect(AC.destination); e.g = g; } catch (er) { e.bezAC = true; } }
  return ODTWARZACZE;
}
function odblokujMuzyke() {
  for (const e of odtwarzacze()) if (!e.ok && !e.a.src) { e.ok = true; e.a.src = CISZA; e.a.play().then(() => { if (e.a.src === CISZA) e.a.pause(); }).catch(() => { e.ok = false; }); }
}
function nowyUtwor(tryb) {
  const lista = UTWORY[tryb], era = S ? S.era[STRONA_GRACZA] : 1;
  let mozna = lista.filter(u => (u.od || 1) <= era);
  const swieze = mozna.filter(u => !muz.ostatnie.includes(u.plik)); if (swieze.length) mozna = swieze;
  const u = mozna[Math.floor(Math.random() * mozna.length)];
  if (tryb === 'spokoj') { muz.ostatnie.push(u.plik); if (muz.ostatnie.length > 3) muz.ostatnie.shift(); }
  const zajete = [muz.spokoj, muz.walka, ...muz.wygasa].filter(Boolean).map(p => p.e);
  let e = odtwarzacze().find(x => !zajete.includes(x));
  if (!e) { const p = muz.wygasa.shift(); p.e.a.pause(); e = p.e; }
  e.a.src = '../age2/muzyka/' + u.plik + '.mp3';
  const p = { e, a: e.a, u, f: 0 }; glosnoscMuzyki(p); return p;
}
function glosnoscMuzyki(p) { const v = Math.min(1, MUZ_GLOSNOSC * p.u.g * p.f); if (p.e.g) { p.e.g.gain.value = v; p.a.volume = 1; } else p.a.volume = v; }
// co klatkę: spokojne utwory na zmianę (bez powtórek), w czasie walki bitwa; przejścia płynne
let muzOst = 0;
function muzykaKrok() {
  // przejścia liczone w prawdziwym czasie (nie w czasie gry), żeby były płynne także przy wolnym telefonie
  const teraz = performance.now(), dt = Math.min(0.5, (teraz - muzOst) / 1000); muzOst = teraz;
  if (!zapis.muzyka || !S || pauza || S.wynik) return ciszaMuzyki();
  const tryb = S.czas - walkaT < 15 ? 'walka' : 'spokoj', k = dt / MUZ_PRZEJSCIE;
  for (const t of ['spokoj', 'walka']) {
    const chce = t === tryb;
    let p = muz[t];
    if (!p) { if (!chce) continue; p = muz[t] = nowyUtwor(t); }
    if (!p.a.paused && p.a.duration && p.a.currentTime > p.a.duration - (p.u.cisza || 0) - MUZ_PRZEJSCIE) { muz.wygasa.push(p); p = muz[t] = nowyUtwor(t); }
    p.f = Math.max(0, Math.min(1, p.f + (chce ? k : -k)));
    glosnoscMuzyki(p);
    if (chce && p.a.paused) p.a.play().catch(() => {});
    else if (!chce && p.f === 0 && !p.a.paused) p.a.pause();
  }
  for (const p of muz.wygasa) { p.f = Math.max(0, p.f - k); glosnoscMuzyki(p); }
  muz.wygasa = muz.wygasa.filter(p => { if (p.f > 0 && !p.a.paused) return true; p.a.pause(); return false; });
}
function ciszaMuzyki() { for (const p of [muz.spokoj, muz.walka, ...muz.wygasa]) if (p && !p.a.paused) p.a.pause(); }
function grajMuzyke() { odblokujMuzyke(); muzOst = performance.now(); muzykaKrok(); }

// ================= tworzenie mapy =================
function wyczyscSwiat() {
  for (const e of [...JED, ...BUD]) scena.remove(e.mesh);
  for (const u of JED) if (u.ludz) scena.remove(u.ludz.obj);
  for (const p of POC) scena.remove(p.mesh);
  for (const u of UMIERA) scena.remove(u.mesh);
  for (const k in INST) { scena.remove(INST[k]); delete INST[k]; }
  for (const sc of SCIETE.values()) scena.remove(sc.g);
  for (const g of GRUZY) scena.remove(g.mesh); GRUZY.length = 0;
  SCIETE.clear();
  if (ziemia) { scena.remove(ziemia); ziemia.material.map.dispose(); ziemia = null; }
  if (dalej) { scena.remove(dalej); dalej = null; }
  JED = []; BUD = []; POC = []; UMIERA = []; wybrane = []; E.clear(); ZAS.clear();
  for (const k in ZAS_TYP) ZAS_TYP[k] = [];
  blok.fill(0); naKom.fill(0); bramaStr.fill(-1);
  if (tryb) zakonczStawianie();
}
const RODZAJ_SUR = { drzewo: 'drewno', krzak: 'jagody', kamien: 'kamien', ruda: 'zelazo', zloto: 'zloto' };
const WYS_ZAS = { drzewo: 2.4, krzak: 0.9, kamien: 0.8, ruda: 0.8, zloto: 0.8 };
// mapa jest taka sama dla wszystkich stron: przy 2 stronach wszystko z połowy gracza odbijamy na drugą połowę,
// przy 3–4 stronach ćwiartkę gracza obracamy 3 razy o 90° (każdy róg mapy wygląda tak samo)
const sym4 = () => ileStron() > 2;
// teren rodzaju mapy (woda, skały, brody, lód): robimy go w części gracza i kopiujemy tak jak zasoby;
// zwraca miejsca bez lasu (brody, wyjścia z kotlin) i miejsca na dodatkowe zasoby
function generujTeren(seed) {
  TEREN.fill(0);
  const typ = typMapy(), wolne = [], dodatki = [];
  if (typ === 'dolina' || typ === 'puszcza') return { wolne, dodatki };
  const r = rng(seed * 101 + 29), sk = N / 192, TC = [BAZA, BAZA], zi = seed % 983;
  const ust = (i, j, t) => {
    const m = t === 2 || t === 1 && typ === 'jotunheim' ? 0 : 3; if (i < m || j < m || i >= N - m || j >= N - m || !naszaCzesc(i, j)) return;
    if (Math.hypot(i - POL + 0.5 - TC[0], j - POL + 0.5 - TC[1]) < 13) return;
    TEREN[j * N + i] = t;
  };
  const kazda = f => { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (naszaCzesc(i, j)) { const t = f(i - POL + 0.5, j - POL + 0.5); if (t) ust(i, j, t); } };
  // staw (albo skała) o nierównym brzegu
  const staw = (cx, cz, rad, t) => {
    for (let z = Math.floor(cz - rad * 1.2 - 1); z <= cz + rad * 1.2 + 1; z++) for (let x = Math.floor(cx - rad * 1.2 - 1); x <= cx + rad * 1.2 + 1; x++) {
      const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz), w = rad * (0.82 + 0.36 * szumMapy((x + 0.5) * 0.3, (z + 0.5) * 0.3, zi));
      if (d < w) ust(x + POL, z + POL, t);
    }
  };
  // czy kółko mieści się w części gracza (żeby po skopiowaniu nie było prostych brzegów)
  const wCzesci = (x, z, m) => (sym4() ? x > m && z > m : (x + z) / Math.SQRT2 > m) && Math.abs(x) < POL - m - 4 && Math.abs(z) < POL - m - 4;
  const losuj = (m, odBazy, f) => {
    for (let k = 0; k < 300; k++) {
      const x = r() * N - POL, z = r() * N - POL;
      if (!wCzesci(x, z, m) || Math.hypot(x - TC[0], z - TC[1]) < odBazy) continue;
      if (f(x, z) !== false) return true;
    }
    return false;
  };
  if (typ === 'jezioro') {
    const R0 = N * 0.2, f0 = r() * 6.283, f1 = r() * 6.283;
    kazda((x, z) => { const a = Math.atan2(z, x), R = R0 * (1 + 0.1 * Math.sin(4 * a + f0) + 0.06 * Math.sin(8 * a + f1)) + (szumMapy(x * 0.2, z * 0.2, zi) - 0.5) * 2.4; return Math.hypot(x, z) < R ? 1 : 0; });
    // ruda i kamień na brzegu, od strony gracza
    const a = Math.PI / 4, d = R0 * 1.18 + 5;
    dodatki.push([Math.cos(a) * d, Math.sin(a) * d, 4, 6], [Math.cos(a - 0.6) * d, Math.sin(a - 0.6) * d, 3, 5], [Math.cos(a + 0.6) * d, Math.sin(a + 0.6) * d, 3, 5]);
  } else if (typ === 'rzeka') {
    const hw = 2.6 * Math.max(1, sk), F = POL * 0.55;
    if (!sym4()) {
      // rzeka w poprzek mapy, między osadami; wije się (przesunięcie nieparzyste, więc po odbiciu pasuje)
      const A = 7 * sk, f = 0.05 / sk, ph = r() * 0.6;
      const srodek = t => A * Math.sin(t * f) * (1 + ph);
      kazda((x, z) => {
        const d = (x + z) / Math.SQRT2, t = (x - z) / Math.SQRT2, w = hw + (szumMapy(x * 0.25, z * 0.25, zi) - 0.5) * 1.4;
        if (Math.abs(d - srodek(t)) >= w) return 0;
        return Math.abs(t) < 3 || Math.abs(t - F) < 3 || Math.abs(t + F) < 3 ? 3 : 1;
      });
      for (const t of [0, F, -F]) { const d = srodek(t); wolne.push([(d + t) / Math.SQRT2, (d - t) / Math.SQRT2, 6]); }
    } else {
      // przy 3–4 stronach: dwie rzeki na krzyż, każda osada na swojej ćwiartce; brody w połowie i na środku
      const fz = r() * 6.283, sz = s => hw * (1 + 0.22 * Math.sin(s * 0.09 / sk + fz));
      kazda((x, z) => {
        const r1 = Math.abs(x) < sz(z), r2 = Math.abs(z) < sz(x); if (!r1 && !r2) return 0;
        return Math.hypot(x, z) < 5.5 || r1 && Math.abs(z - F) < 3 || r2 && Math.abs(x - F) < 3 ? 3 : 1;
      });
      wolne.push([0, F, 6], [F, 0, 6], [0, 0, 8]);
    }
  } else if (typ === 'przelecze') {
    // skalna kotlina wokół Dworku z dwoma wyjściami w stronę środka mapy
    const Rr = 25, ac = Math.atan2(-TC[1], -TC[0]), wyjscia = [ac - 0.75, ac + 0.75];
    kazda((x, z) => {
      const dx = x - TC[0], dz = z - TC[1], d = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
      if (Math.abs(d - Rr) > 1.5 + szumMapy(x * 0.3, z * 0.3, zi) * 1.5) return 0;
      for (const b of wyjscia) { const da = Math.abs(((a - b) % 6.283 + 9.425) % 6.283 - 3.1416); if (da * Rr < 3.6) return 0; }
      return 2;
    });
    for (const b of wyjscia) wolne.push([TC[0] + Math.cos(b) * Rr, TC[1] + Math.sin(b) * Rr, 6]);
    // skałki na reszcie mapy
    for (let n = 0, ile = Math.round(10 * skalaMapy()); n < ile; n++) losuj(5, Rr + 9, (x, z) => { if (Math.hypot(x, z) < 9) return false; staw(x, z, 1.8 + r() * 2.2, 2); });
  } else if (typ === 'jotunheim') {
    // fiordy: wąskie zatoki lodowatej wody od brzegów mapy w stronę środka (środek zostaje lądem, tam się przechodzi)
    // szerokie przy brzegu mapy, wąskie w głębi lądu, z poszarpanym brzegiem
    const hw = 3 * Math.max(1, sk), f = r() * 6.283, T0 = POL * (sym4() ? 0.45 : 0.62), KON = sym4() ? POL : POL * Math.SQRT2;
    const szer = (s, x, z) => hw * Math.min(1, (s - T0) / 10) * (0.8 + 1.6 * Math.max(0, (s - T0) / (KON - T0)) ** 1.5) * (1 + 0.2 * Math.sin(s * 0.17 + f)) + (szumMapy(x * 0.22, z * 0.22, zi) - 0.5) * 3;
    if (!sym4()) kazda((x, z) => { const d = Math.abs(x + z) / Math.SQRT2, t = Math.abs(x - z) / Math.SQRT2; return t > T0 && d < szer(t, x, z) ? 1 : 0; });
    else kazda((x, z) => x > T0 && Math.abs(z) < szer(x, x, z) || z > T0 && Math.abs(x) < szer(z, x, z) ? 1 : 0);
    // ośnieżone góry olbrzymów (wojsko chodzi dolinami między nimi), dwa zamarznięte stawy
    // pasma: 1–3 zachodzące na siebie masywy w jednej linii
    for (let n = 0, ile = Math.round(4 * skalaMapy()) + 1; n < ile; n++) {
      const rad = (6.5 + r() * 5) * Math.sqrt(Math.max(1, sk)), a = r() * 6.283, dl = 1 + Math.floor(r() * 3);
      const kola = k => [Math.cos(a) * k * rad * 0.95, Math.sin(a) * k * rad * 0.95, rad * (1 - k * 0.22)];
      losuj(rad + 3, 26 + rad, (x, z) => {
        for (let k = 0; k < dl; k++) { const [dx, dz, rk] = kola(k); if (!wCzesci(x + dx, z + dz, rk + 3) || Math.hypot(x + dx - TC[0], z + dz - TC[1]) < 26 + rk || Math.hypot(x + dx, z + dz) < rk + 9) return false; }
        for (let k = 0; k < dl; k++) { const [dx, dz, rk] = kola(k); staw(x + dx, z + dz, rk, 2); }
      });
    }
    for (let n = 0; n < 2; n++) { const rad = 3 + r() * 3; losuj(rad + 2, 24, (x, z) => staw(x, z, rad, 4)); }
    for (let n = 0; n < 3; n++) losuj(6, 22, (x, z) => { dodatki.push([x, z, n === 1 ? 3 : 4, 5]); });
  } else if (typ === 'tundra') {
    // zamarznięte jeziora (lód: chodzi się, nie buduje), co trzecie z wodą
    for (let n = 0, ile = Math.round(8 * skalaMapy()) + 2; n < ile; n++) { const rad = 4 + r() * 5; losuj(rad + 2, 24, (x, z) => staw(x, z, rad, n % 3 === 2 ? 1 : 4)); }
    for (let n = 0; n < 3; n++) losuj(6, 22, (x, z) => { dodatki.push([x, z, n === 1 ? 3 : 4, 5]); });
  } else if (typ === 'oaza') {
    // wielka oaza na środku i mała oaza dla każdej strony; palmy dookoła dokłada generujMape
    const rs = 8.5 * Math.max(1, sk); staw(0, 0, rs, 1); dodatki.push([0, 0, 'palmy', rs]);
    losuj(10, 30, (x, z) => { if (Math.hypot(x - TC[0], z - TC[1]) > 50 || Math.hypot(x, z) < 26) return false; staw(x, z, 2.8, 1); dodatki.push([x, z, 'palmy', 2.8]); });
    for (let n = 0; n < 2; n++) losuj(6, 20, (x, z) => { if (Math.hypot(x - TC[0], z - TC[1]) > 40) return false; dodatki.push([x, z, 'palmy', 0]); });
  } else if (typ === 'bagna') {
    for (let n = 0, ile = Math.round(36 * skalaMapy()); n < ile; n++) { const rad = 1.6 + r() * 2.8; losuj(rad + 2, 19, (x, z) => staw(x, z, rad, 1)); }
    for (let n = 0, ile = Math.round(8 * skalaMapy()); n < ile; n++) losuj(4, 18, (x, z) => { dodatki.push([x, z, 2, 6]); });
  }
  // kopiujemy na pozostałe części mapy (jak zasoby)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const c = j * N + i;
    if (!TEREN[c] || !(sym4() ? naszaCzesc(i, j) : i + j > N - 1)) continue;
    for (const [a, b] of kopieKom(i, j).slice(1)) TEREN[b * N + a] = TEREN[c];
  }
  return { wolne, dodatki };
}
const naszaCzesc = (i, j) => sym4() ? i >= POL && j >= POL : i + j >= N - 1;
const kopieKom = (i, j) => sym4() ? [[i, j], [N - 1 - j, i], [N - 1 - i, N - 1 - j], [j, N - 1 - i]] : [[i, j], [N - 1 - i, N - 1 - j]];
const skalaMapy = () => (N / 192) ** 2 * (sym4() ? 0.5 : 1);
function generujMape(seed) {
  const r = rng(seed), plan = new Uint8Array(N * N); // 0 nic, 1 drzewo, 2 krzak, 3 kamień, 4 złoto
  const TC = [BAZA, BAZA], typMap = typMapy(), ter = generujTeren(seed);
  const daj = (x, z, typ) => {
    const i = Math.floor(x + POL), j = Math.floor(z + POL);
    if (i < 1 || j < 1 || i >= N - 1 || j >= N - 1 || !naszaCzesc(i, j) || TEREN[j * N + i]) return;
    if (Math.hypot(x - TC[0], z - TC[1]) < 5.5) return;
    if (!plan[j * N + i]) plan[j * N + i] = typ;
  };
  const kepa = (cx, cz, ile, typ, roz = 1.3) => {
    let n = 0;
    for (let k = 0; k < 60 && n < ile; k++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * roz * Math.sqrt(ile) * 0.55, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      const c = kom(x, z); if (c < 0 || plan[c]) continue; daj(x, z, typ); if (plan[c]) n++;
    }
  };
  const las = (cx, cz, rad) => {
    for (let z = Math.floor(cz - rad - 1); z <= cz + rad + 1; z++) for (let x = Math.floor(cx - rad - 1); x <= cx + rad + 1; x++) {
      const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz) / rad;
      if (d < 1 && r() < 1.15 - d * d * 0.8) daj(x + 0.5, z + 0.5, 1);
    }
  };
  // las na brzegach mapy
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const brzeg = Math.min(i, j, N - 1 - i, N - 1 - j);
    if (brzeg < 2 + Math.floor(r() * 2.2)) daj(i - POL + 0.5, j - POL + 0.5, 1);
  }
  // surowce przy bazie
  const a0 = r() * 6.283, przy = (a, d) => [TC[0] + Math.cos(a) * d, TC[1] + Math.sin(a) * d];
  const wewn = ([x, z]) => [Math.max(8 - POL, Math.min(POL - 8, x)), Math.max(8 - POL, Math.min(POL - 8, z))];
  // kierunki dobrane tak, żeby surowce nie wchodziły za brzeg mapy (baza stoi blisko rogu x+, z+)
  const kier = a => { const [x, z] = przy(a, 10); return x > POL - 6 || z > POL - 6 ? a + Math.PI : a; };
  const aK = kier(a0), aZ = kier(a0 + 2.1), aKa = kier(a0 + 4.2), aL = kier(a0 + 1.05);
  kepa(...wewn(przy(aK, 7)), 7, 2, 1.2);
  kepa(...wewn(przy(aZ, 10)), 5, 4, 1.0);
  kepa(...wewn(przy(aKa, 10.5)), 4, 3, 1.0);
  las(...wewn(przy(aL, 14)), 5);
  kepa(...wewn(przy(aK + 0.6, 16)), 5, 2, 1.3);
  // lasy na mapie
  for (let k = 0, ile = Math.round(56 * skalaMapy() * MAPY[typMap].lasy); k < ile; k++) {
    const x = 4 - POL + r() * (N - 8), z = 4 - POL + r() * (N - 8); if (sym4() ? x < 2 || z < 2 : x + z < 4) continue;
    if (Math.hypot(x - TC[0], z - TC[1]) < 12) continue;
    las(x, z, 2.5 + r() * 3.5);
  }
  // złoto i kamień na środku mapy (po jednej kępce na stronę)
  if (sym4()) { kepa(6 + r() * 6, 6 + r() * 4, 5, 4, 1.0); kepa(4 + r() * 5, 14 + r() * 5, 4, 3, 1.0); kepa(14 + r() * 6, 5 + r() * 6, 5, 2, 1.2); }
  else { kepa(8 + r() * 6, -6 + r() * 6, 5, 4, 1.0); kepa(-4 + r() * 6, 12 + r() * 5, 4, 3, 1.0); kepa(14 + r() * 6, 14 + r() * 6, 5, 2, 1.2); }
  // duża mapa: więcej kęp krzaków, kamienia, rudy i złota w dalszych częściach doliny
  for (let k = 0, n = 0, ile = Math.round(16 * skalaMapy()); k < 200 && n < ile; k++) {
    const x = 10 - POL + r() * (N - 20), z = 10 - POL + r() * (N - 20);
    if ((sym4() ? x < 4 || z < 4 : x + z < 8) || Math.hypot(x - TC[0], z - TC[1]) < 20) continue;
    const typ = [2, 3, 4, 2, 3, 1][n % 6];
    if (typ === 1) las(x, z, 3 + r() * 3); else kepa(x, z, typ === 2 ? 6 : 5, typ, typ === 2 ? 1.2 : 1.0);
    n++;
  }
  // dodatki rodzajów map
  if (typMap === 'puszcza') {
    // gęsty las wszędzie poza polaną przy Dworku; szum zostawia kręte przesieki i polany
    const zp = seed % 991;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if (!naszaCzesc(i, j)) continue;
      const x = i - POL + 0.5, z = j - POL + 0.5, d = Math.hypot(x - TC[0], z - TC[1]); if (d < 19) continue;
      const n = szum2(x * 0.075, z * 0.075, zp + 21) + (d < 26 ? (26 - d) * 0.02 : 0);
      if (n < (N > 240 ? 0.36 : 0.43) && r() < (N > 240 ? 0.5 : 0.85)) daj(x, z, 1); // na Mega mapie rzadziej (telefon)
    }
  }
  for (const [x, z, co, ile] of ter.dodatki) {
    if (co === 'palmy') {
      // palmy wokół oazy (albo kępka palm)
      if (ile) { for (let k = 0; k < 40 * ile; k++) { const a = r() * 6.283, d = ile * 1.25 + 0.8 + r() * 4.5; daj(x + Math.cos(a) * d, z + Math.sin(a) * d, 1); } }
      else las(x, z, 3 + r() * 1.5);
    } else kepa(x, z, ile, co, co === 2 ? 1.2 : 1.0);
  }
  // droga od ratusza do środka mapy zawsze wolna
  for (let t = 0; t <= 1; t += 0.01) {
    const x = TC[0] * (1 - t), z = TC[1] * (1 - t);
    for (let dz = -1.6; dz <= 1.6; dz += 0.5) for (let dx = -1.6; dx <= 1.6; dx += 0.5) { const c = kom(x + dx, z + dz); if (c >= 0) plan[c] = 0; }
  }
  // brody, wyjścia z kotlin i przesieki bez lasu
  for (const [x, z, rad] of ter.wolne) for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) { if (dx * dx + dz * dz > rad * rad) continue; const c = kom(x + dx, z + dz); if (c >= 0) plan[c] = 0; }
  // odbicie na drugą połowę (albo obrót ćwiartki na pozostałe trzy)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const c = j * N + i;
    if (!plan[c] || !(sym4() ? naszaCzesc(i, j) : i + j > N - 1)) continue;
    for (const [a, b] of kopieKom(i, j).slice(1)) plan[b * N + a] = plan[c];
  }
  // tworzenie zasobów (kolejność kratek = te same numery przy każdym wczytaniu)
  const RODZ = [null, 'drzewo', 'krzak', 'kamien', 'ruda'];
  const lista = { drzewo: [], krzak: [], kamien: [], ruda: [] };
  let id = 1;
  for (let c = 0; c < N * N; c++) {
    if (!plan[c]) continue;
    const rodzaj = RODZ[plan[c]], [x, z] = srodekKom(c);
    const z0 = { id: id++, rodzaj, sur: RODZAJ_SUR[rodzaj], c, x, z, ile: ZAPAS[rodzaj], start: ZAPAS[rodzaj], inst: lista[rodzaj].length, klucz: rodzaj };
    lista[rodzaj].push(z0); ZAS.set(z0.id, z0); E.set(z0.id, z0); ZAS_TYP[z0.sur].push(z0);
    blok[c] = 1; naKom[c] = z0.id;
  }
  // gatunki drzew: każdy las ma swój główny gatunek, przy brzegach mapy głównie świerki
  const zi = seed % 997, grupy = { krzak: lista.krzak, kamien: lista.kamien, ruda: lista.ruda };
  lista.drzewo.forEach((z0, k) => {
    const rr = rng(z0.id * 17 + 3), brzeg = Math.min(z0.x + POL, z0.z + POL, POL - z0.x, POL - z0.z);
    const n = szumMapy(z0.x * 0.07, z0.z * 0.07, zi + 11);
    let g = brzeg < 4 ? (rr() < 0.7 ? 'swierk' : 'modrzew') : n < 0.32 ? 'swierk' : n < 0.47 ? 'sosna' : n < 0.62 ? 'brzoza' : n < 0.8 ? 'dab' : 'modrzew';
    if (rr() < 0.28) g = MOD.GATUNKI[Math.floor(rr() * MOD.GATUNKI.length)];
    // inne motywy: w śniegu świerki z czapami, na piasku palmy, w puszczy drzewa iglaste, na bagnach brzozy
    const mt = motyw();
    if (mt === 'zima') g = rr() < 0.85 ? 'swierkS' : 'swierk';
    else if (mt === 'piasek') g = rr() < 0.75 ? 'sosna' : 'brzoza';
    else if (mt === 'puszcza') g = g === 'modrzew' || g === 'swierk' ? g : rr() < 0.1 ? 'brzoza' : rr() < 0.7 ? 'swierk' : 'modrzew'; // proste drzewa: puszcza ma ich bardzo dużo
    else if (mt === 'bagno') g = g === 'dab' ? 'brzoza' : g === 'sosna' && rr() < 0.5 ? 'modrzew' : g;
    z0.gat = g; z0.pn = k;
    const kl = 'drzewo_' + g; (grupy[kl] || (grupy[kl] = [])).push(z0); z0.inst = grupy[kl].length - 1; z0.klucz = kl;
  });
  // instancje (jedna bryła na rodzaj albo gatunek)
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (const klucz in grupy) {
    const L = grupy[klucz]; if (!L.length) continue;
    const drz = klucz.startsWith('drzewo_');
    const geo = drz ? MOD.drzewo(klucz.slice(7)) : klucz === 'krzak' ? MOD.krzak() : MOD.skala(klucz);
    const im = new THREE.InstancedMesh(geo, MAT, L.length);
    im.castShadow = drz; im.receiveShadow = false;
    for (const z0 of L) {
      const rr = rng(z0.id * 31 + 5), s = drz ? 0.82 + rr() * 0.5 : 0.85 + rr() * 0.3;
      q.setFromAxisAngle(up, rr() * 6.283); sc.set(s, s * (drz ? 0.9 + rr() * 0.3 : 1), s);
      p.set(z0.x + (rr() - 0.5) * 0.25, 0, z0.z + (rr() - 0.5) * 0.25);
      im.setMatrixAt(z0.inst, m4.compose(p, q, sc));
    }
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
    INST[klucz] = im; scena.add(im);
  }
  // teren: woda i skały zamykają kratki, brody i lód są do chodzenia (bez budowania)
  const skaly = [];
  for (let c = 0; c < N * N; c++) { const t = TEREN[c]; if (!t) continue; blok[c] = t === 1 || t === 2 ? 6 : 7; naKom[c] = 0; if (t === 2) skaly.push(c); }
  // Jotunheim: prawdziwe góry z siatki wysokości, a głazy tylko u ich stóp
  if (typMap === 'jotunheim' && skaly.length) {
    const gory = zbudujGory(seed); INST.teren_gory = gory; scena.add(gory);
    const brzegowa = c => { const ci = c % N, cj = (c / N) | 0; for (let k = 0; k < 8; k++) { const n = kom2(ci + DI[k], cj + DJ[k]); if (n >= 0 && TEREN[n] !== 2) return true; } return false; };
    skaly.splice(0, skaly.length, ...skaly.filter(brzegowa));
  }
  if (skaly.length) {
    const im = new THREE.InstancedMesh(MOD.glaz(motyw()), MAT, skaly.length); im.castShadow = true;
    skaly.forEach((c, k) => {
      // im głębiej w skałach, tym wyżej (grzbiety i góry rosną do środka)
      let gl = 0; const ci = c % N, cj = (c / N) | 0; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) { const n = kom2(ci + a, cj + b); if (n >= 0 && TEREN[n] === 2) gl++; }
      gl = Math.max(0, gl - 1) / 24;
      const rr = rng(c * 13 + 7), [x, z] = srodekKom(c), s = (0.95 + rr() * 0.55) * (1 + gl * 0.35);
      q.setFromAxisAngle(up, rr() * 6.283); sc.set(s, s * (0.75 + rr() * 0.9) * (1 + gl * gl * 2.2), s); p.set(x + (rr() - 0.5) * 0.3, -0.05, z + (rr() - 0.5) * 0.3);
      im.setMatrixAt(k, m4.compose(p, q, sc));
    });
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); INST.teren_skaly = im; scena.add(im);
  }
  // pieńki po ściętych drzewach (na początku niewidoczne)
  if (lista.drzewo.length) {
    const pn = new THREE.InstancedMesh(MOD.pieniek(), MAT, lista.drzewo.length);
    for (let i = 0; i < lista.drzewo.length; i++) pn.setMatrixAt(i, ZERO);
    pn.instanceMatrix.needsUpdate = true; pn.frustumCulled = false; INST.pieniek = pn; scena.add(pn);
  }
  return id;
}
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
// góry z siatki wysokości nad kratkami skał: im dalej od brzegu skał, tym wyżej; strome ściany skalne, śnieg na szczytach
function zbudujGory(seed) {
  const D = new Float32Array(N * N), zi = seed % 977;
  for (let c = 0; c < N * N; c++) D[c] = TEREN[c] === 2 ? 1e9 : 0;
  // odległość od brzegu skał (dwa przejścia przez mapę)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const c = j * N + i; if (!D[c]) continue; let d = D[c];
    if (i > 0) d = Math.min(d, D[c - 1] + 1); if (j > 0) d = Math.min(d, D[c - N] + 1);
    if (i > 0 && j > 0) d = Math.min(d, D[c - N - 1] + 1.414); if (i < N - 1 && j > 0) d = Math.min(d, D[c - N + 1] + 1.414); D[c] = d;
  }
  for (let j = N - 1; j >= 0; j--) for (let i = N - 1; i >= 0; i--) {
    const c = j * N + i; if (!D[c]) continue; let d = D[c];
    if (i < N - 1) d = Math.min(d, D[c + 1] + 1); if (j < N - 1) d = Math.min(d, D[c + N] + 1);
    if (i < N - 1 && j < N - 1) d = Math.min(d, D[c + N + 1] + 1.414); if (i > 0 && j < N - 1) d = Math.min(d, D[c + N - 1] + 1.414); D[c] = d;
  }
  // wysokość w rogach kratek (róg przy zwykłej ziemi leży na ziemi)
  const W = N + 1, H = new Float32Array(W * W);
  for (let vj = 0; vj <= N; vj++) for (let vi = 0; vi <= N; vi++) {
    let m = 1e9;
    for (const [a, b] of [[vi - 1, vj - 1], [vi, vj - 1], [vi - 1, vj], [vi, vj]]) { if (a < 0 || b < 0 || a >= N || b >= N) continue; m = Math.min(m, D[b * N + a]); }
    if (m >= 1e8 || m <= 0) { H[vj * W + vi] = m >= 1e8 ? 6 : 0; continue; }
    const x = vi - POL, z = vj - POL, d = Math.min(m, 30) - 0.5;
    // wysokie masywy łagodnie się spłaszczają (słońce jest na wysokości 34), a szczyty zostają poszarpane
    const sur = d * 2.3 * (0.7 + 0.6 * szumMapy(x * 0.07, z * 0.07, zi));
    H[vj * W + vi] = 19 * Math.tanh(sur / 19) + szumMapy(x * 0.55, z * 0.55, zi + 3) * 1.6 * Math.min(d, 3) + szumMapy(x * 0.22, z * 0.22, zi + 9) * 5 * Math.min(1, d / 6);
  }
  const pos = [], nor = [], kol = [], c3 = new THREE.Color(), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), n3 = new THREE.Vector3();
  const SKALY = ['#9a948a', '#8a847a', '#a8a298', '#7f796f'];
  const tr = (p1, p2, p3) => {
    A.set(...p1); B.set(...p2); C.set(...p3);
    n3.subVectors(C, B).cross(B.clone().sub(A).negate()).normalize(); if (n3.y < 0) n3.negate();
    const h = (A.y + B.y + C.y) / 3, mx = (A.x + B.x + C.x) / 3, mz = (A.z + B.z + C.z) / 3;
    const linia = 3.5 + szumMapy(mx * 0.12, mz * 0.12, zi + 5) * 5;
    if (h > linia && n3.y > 0.28) c3.set(n3.y > 0.6 ? '#f5f8fb' : '#e3eaf0');
    else if (h > linia - 2.5 && n3.y > 0.45) c3.set('#d3dbe2');
    else c3.set(SKALY[Math.floor(szumMapy(mx * 0.9, mz * 0.9, zi + 7) * 3.99)]).multiplyScalar(h < 1.2 ? 0.85 : 1);
    for (const v of [A, B, C]) { pos.push(v.x, v.y, v.z); nor.push(n3.x, n3.y, n3.z); kol.push(c3.r, c3.g, c3.b); }
  };
  const V = (vi, vj) => [vi - POL, H[vj * W + vi], vj - POL];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (TEREN[j * N + i] !== 2) continue;
    const a = V(i, j), b = V(i + 1, j), c = V(i, j + 1), d = V(i + 1, j + 1);
    if ((i + j) % 2) { tr(a, c, b); tr(b, c, d); } else { tr(a, c, d); tr(a, d, b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(kol, 3));
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// dodatkowe złoża: więcej kamienia i złoto; numery od 900000, mapa dalej taka sama dla obu stron
const ID_ZLOZ = 900000;
function dodatkoweZloza(seed) {
  const r = rng(seed * 31 + 17), lista = { kamien: [], zloto: [] }, plan = new Map();
  const TC = [BAZA, BAZA];
  const wolne = (i, j) => i > 2 && j > 2 && i < N - 3 && j < N - 3 && kopieKom(i, j).every(([a, b]) => { const c = kom2(a, b); return c >= 0 && blok[c] === 0 && !plan.has(c); });
  const naDrodze = (x, z) => { const t = Math.max(0, Math.min(1, (x + z) / (2 * BAZA))); return Math.hypot(x - BAZA * t, z - BAZA * t) < 2.6; };
  const kepa = (cx, cz, ile, rodzaj) => {
    let n = 0;
    for (let k = 0; k < 80 && n < ile; k++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * 0.75 * Math.sqrt(ile), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      const i = Math.floor(x + POL), j = Math.floor(z + POL);
      if (!naszaCzesc(i, j) || !wolne(i, j) || Math.hypot(x - TC[0], z - TC[1]) < 6.5 || naDrodze(x, z)) continue;
      for (const [a, b] of kopieKom(i, j)) plan.set(b * N + a, rodzaj); n++;
    }
  };
  // szukamy miejsc na kępy: przy bazie (kamień, złoto) i bliżej środka
  const szukaj = (dMin, dMax, rodzaj, ile) => {
    for (let p = 0; p < 40; p++) {
      const a = r() * 6.283, d = dMin + r() * (dMax - dMin), x = TC[0] + Math.cos(a) * d, z = TC[1] + Math.sin(a) * d;
      if ((sym4() ? x < 1.5 || z < 1.5 : x + z < 3) || Math.abs(x) > POL - 7 || Math.abs(z) > POL - 7) continue;
      const i = Math.floor(x + POL), j = Math.floor(z + POL); if (!wolne(i, j)) continue;
      kepa(x, z, ile, rodzaj); return;
    }
  };
  const sk = N / 192, sz = (a, b, rodzaj, ile) => szukaj(a * sk, b * sk, rodzaj, ile);
  sz(11, 16, 'kamien', 6); sz(16, 24, 'kamien', 6); sz(24, 34, 'kamien', 5);
  sz(10, 14, 'zloto', 5); sz(26, 36, 'zloto', 5);
  sz(36, 50, 'kamien', 6); sz(50, 70, 'kamien', 5); sz(40, 55, 'zloto', 5); sz(55, 75, 'zloto', 5);
  let id = ID_ZLOZ;
  for (const [c, rodzaj] of [...plan.entries()].sort((a, b) => a[0] - b[0])) {
    const [x, z] = srodekKom(c), kl = rodzaj + '_d';
    const z0 = { id: id++, rodzaj, sur: RODZAJ_SUR[rodzaj], c, x, z, ile: ZAPAS[rodzaj], start: ZAPAS[rodzaj], inst: lista[rodzaj].length, klucz: kl, dodatkowe: true };
    lista[rodzaj].push(z0); ZAS.set(z0.id, z0); E.set(z0.id, z0); ZAS_TYP[z0.sur].push(z0);
    blok[c] = 1; naKom[c] = z0.id;
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (const rodzaj in lista) {
    const L = lista[rodzaj]; if (!L.length) continue;
    const im = new THREE.InstancedMesh(MOD.skala(rodzaj), MAT, L.length);
    for (const z0 of L) { const rr = rng(z0.id * 31 + 5), s = 0.85 + rr() * 0.3; q.setFromAxisAngle(up, rr() * 6.283); sc.set(s, s, s); p.set(z0.x + (rr() - 0.5) * 0.25, 0, z0.z + (rr() - 0.5) * 0.25); im.setMatrixAt(z0.inst, m4.compose(p, q, sc)); }
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
    INST[rodzaj + '_d'] = im; scena.add(im);
  }
}
// polanki, do których nie da się dojść z żadnego Dworku (np. w środku puszczy), zamykamy: nikt tam nie buduje
// i nie szuka drogi na próżno; po wycięciu drzewa obok polanka się otwiera
function zamknijPolanki() {
  const ok = c => blok[c] === 0 || blok[c] === 4 || blok[c] === 7, byl = new Uint8Array(N * N), stos = [];
  for (let s = 0; s < ileStron(); s++) {
    const [x, z] = bazaStrony(s); let c = najblizszaWolna(kom(x - ROGI[s][0] * 4, z - ROGI[s][1] * 4), 10);
    if (c >= 0 && !byl[c]) { byl[c] = 1; stos.push(c); }
  }
  while (stos.length) {
    const c = stos.pop(), i = c % N, j = (c / N) | 0;
    for (let k = 0; k < 8; k++) {
      const ni = i + DI[k], nj = j + DJ[k]; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const n = nj * N + ni; if (byl[n] || !ok(n)) continue;
      if (DI[k] && DJ[k] && (!ok(j * N + ni) || !ok(nj * N + i))) continue;
      byl[n] = 1; stos.push(n);
    }
  }
  for (let c = 0; c < N * N; c++) if (blok[c] === 0 && !byl[c]) { blok[c] = 6; TEREN[c] = 5; }
}
function otworzPolanke(c0) {
  const i0 = c0 % N, j0 = (c0 / N) | 0, stos = [];
  for (let k = 0; k < 8; k++) { const n = kom2(i0 + DI[k], j0 + DJ[k]); if (n >= 0 && TEREN[n] === 5) { TEREN[n] = 0; blok[n] = 0; stos.push(n); } }
  while (stos.length) {
    const c = stos.pop(), i = c % N, j = (c / N) | 0;
    for (let k = 0; k < 8; k++) { const n = kom2(i + DI[k], j + DJ[k]); if (n >= 0 && TEREN[n] === 5) { TEREN[n] = 0; blok[n] = 0; stos.push(n); } }
  }
}
// ozdoby: trawa, kwiaty, paprocie, grzyby, kamyki, kłody, krzaczki; tylko do patrzenia, znikają spod budynków
const OZD = new Map();
function rozmiescOzdoby(seed) {
  OZD.clear();
  const r = rng(seed * 7 + 11), lista = {};
  for (const k of MOD.OZDOBY) lista[k] = [];
  const bazy = Array.from({ length: ileStron() }, (_, s) => bazaStrony(s)), odBazy = (x, z) => Math.min(...bazy.map(([bx, bz]) => Math.hypot(x - bx, z - bz)));
  const przyLesie = c => { const i = c % N, j = (c / N) | 0; for (let k = 0; k < 8; k++) { const n = kom2(i + DI[k], j + DJ[k]); if (n >= 0 && blok[n] === 1) { const z0 = ZAS.get(naKom[n]); if (z0 && z0.rodzaj === 'drzewo') return true; } } return false; };
  const przyWodzie = c => { const i = c % N, j = (c / N) | 0; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) { const n = kom2(i + a, j + b); if (n >= 0 && TEREN[n] === 1) return true; } return false; };
  const mt = motyw();
  for (let k = 0, ile = Math.round(18000 * (Math.min(N, 240) / 192) ** 2); k < ile; k++) { // Mega mapa: ozdób tyle co na Dużej (telefon)
    const x = 1.5 - POL + r() * (N - 3), z = 1.5 - POL + r() * (N - 3), c = kom(x, z);
    if (c < 0 || blok[c] !== 0 || odBazy(x, z) < 6.5) continue;
    const q = r(), las = przyLesie(c), kw = szumMapy(x * 0.12, z * 0.12, 77);
    let typ;
    if (q < 0.6 && przyWodzie(c)) typ = mt === 'zima' ? 'zaspa' : 'trzcina';
    else if (!las && q < 0.006 && typMapy() === 'jotunheim') typ = 'kamyki';
    else if (mt === 'zima') { if (q > 0.55) continue; typ = las ? (q < 0.15 ? 'zaspa' : q < 0.25 ? 'kloda' : q < 0.35 ? 'krzaczek' : 'sucha') : q < 0.07 ? 'zaspa' : q < 0.13 ? 'kamyki' : 'sucha'; }
    else if (mt === 'piasek') { if (!las && q > 0.62) continue; typ = las ? (q < 0.4 ? 'sucha' : q < 0.6 ? 'trawa2' : 'krzaczek') : q < 0.28 ? 'sucha' : q < 0.42 ? 'kamyki' : q < 0.5 ? 'krzaczek' : 'trawa2'; }
    else if (las) typ = q < 0.28 ? 'paproc' : q < 0.38 ? 'muchomor' : q < 0.48 ? 'borowik' : q < 0.6 ? 'jagodnik' : q < 0.66 ? 'kloda' : q < 0.76 ? 'krzaczek' : 'trawa';
    else if (kw > 0.6 && q < 0.5) typ = ['kwiatyB', 'kwiatyZ', 'kwiatyF'][Math.floor(r() * 3)];
    else typ = q < 0.5 ? 'trawa' : q < 0.78 ? 'trawa2' : q < 0.85 ? 'kamyki' : q < 0.9 ? 'krzaczek' : q < 0.95 ? 'kwiatyZ' : 'trawa';
    lista[typ].push([x, z, r() * 6.283, 0.75 + r() * 0.55, c]);
  }
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (const typ in lista) {
    const L = lista[typ]; if (!L.length) continue;
    const im = new THREE.InstancedMesh(MOD.ozdoba(typ), MAT, L.length);
    L.forEach(([x, z, a, s, c], i) => {
      qq.setFromAxisAngle(up, a); sc.set(s, s, s); p.set(x, 0, z); im.setMatrixAt(i, m4.compose(p, qq, sc));
      (OZD.get(c) || OZD.set(c, []).get(c)).push([im, i]);
    });
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
    INST['oz_' + typ] = im; scena.add(im);
  }
}
function ukryjOzdoby(i0, j0, w) {
  for (let j = j0 - 1; j < j0 + w + 1; j++) for (let i = i0 - 1; i < i0 + w + 1; i++) {
    const c = kom2(i, j), l = OZD.get(c); if (!l) continue;
    for (const [im, idx] of l) { im.setMatrixAt(idx, ZERO); im.instanceMatrix.needsUpdate = true; }
    OZD.delete(c);
  }
}
// ścięte drzewa: przy pierwszym uderzeniu siekierą drzewo się przewraca, potem pień maleje, a na końcu zostaje pieniek
const SCIETE = new Map();
function zetnij(z0, odX, odZ, odrazu = false) {
  if (z0.rodzaj !== 'drzewo' || SCIETE.has(z0.id) || !ZAS.has(z0.id)) return;
  const im = INST[z0.klucz]; if (im) { im.setMatrixAt(z0.inst, ZERO); im.instanceMatrix.needsUpdate = true; }
  const g = new THREE.Group(); g.position.set(z0.x, 0, z0.z);
  g.rotation.y = odX === z0.x && odZ === z0.z ? (z0.id * 2.39) % 6.283 : Math.atan2(z0.x - odX, z0.z - odZ);
  g.add(new THREE.Mesh(MOD.pieniek(), MAT));
  const drz = new THREE.Mesh(MOD.drzewo(z0.gat), MAT); drz.castShadow = true; drz.position.y = 0.18; g.add(drz);
  scena.add(g);
  SCIETE.set(z0.id, { g, drz, z0, t: odrazu ? 1 : 0 });
}
function pieniekZostaje(z0) {
  const im = INST.pieniek; if (!im) return;
  im.setMatrixAt(z0.pn, new THREE.Matrix4().makeTranslation(z0.x, 0, z0.z)); im.instanceMatrix.needsUpdate = true;
}
function usunZasob(z0) {
  if (!ZAS.has(z0.id)) return;
  ZAS.delete(z0.id); E.delete(z0.id); z0.ile = 0;
  if (blok[z0.c] === 1) { blok[z0.c] = 0; naKom[z0.c] = 0; otworzPolanke(z0.c); }
  const im = INST[z0.klucz]; if (im) { im.setMatrixAt(z0.inst, ZERO); im.instanceMatrix.needsUpdate = true; }
  if (z0.rodzaj === 'drzewo') { const sc = SCIETE.get(z0.id); if (sc) { scena.remove(sc.g); SCIETE.delete(z0.id); } pieniekZostaje(z0); }
  S.usuniete.push(z0.id); miniBrud = true;
  wybrane = wybrane.filter(e => e !== z0);
}

// ================= droga (szukanie ścieżki po kratkach) =================
const NN = N_MAKS * N_MAKS, H_G = new Float32Array(NN), H_OD = new Int32Array(NN), H_ST = new Uint32Array(NN), H_ZAM = new Uint32Array(NN), H_CEL = new Uint32Array(NN);
let hGen = 0;
const KOP_K = new Int32Array(NN * 8), KOP_F = new Float32Array(NN * 8); let kopN = 0;
function kopDodaj(k, f) {
  let i = kopN++; KOP_K[i] = k; KOP_F[i] = f;
  while (i > 0) { const p = (i - 1) >> 1; if (KOP_F[p] <= KOP_F[i]) break; [KOP_K[p], KOP_K[i]] = [KOP_K[i], KOP_K[p]]; [KOP_F[p], KOP_F[i]] = [KOP_F[i], KOP_F[p]]; i = p; }
}
function kopWez() {
  const w = KOP_K[0]; kopN--;
  if (kopN > 0) {
    KOP_K[0] = KOP_K[kopN]; KOP_F[0] = KOP_F[kopN]; let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1; let m = i;
      if (l < kopN && KOP_F[l] < KOP_F[m]) m = l; if (r < kopN && KOP_F[r] < KOP_F[m]) m = r;
      if (m === i) break; [KOP_K[m], KOP_K[i]] = [KOP_K[i], KOP_K[m]]; [KOP_F[m], KOP_F[i]] = [KOP_F[i], KOP_F[m]]; i = m;
    }
  }
  return w;
}
const DI = [1, -1, 0, 0, 1, 1, -1, -1], DJ = [0, 0, 1, -1, 1, -1, 1, -1];
function najblizszaWolna(c, maksR = 8) {
  if (c < 0) return -1; if (wolnaKom(c)) return c;
  const ci = c % N, cj = (c / N) | 0;
  for (let r = 1; r <= maksR; r++) {
    let naj = -1, nd = 1e9;
    for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
      if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r) continue;
      const n = kom2(i, j); if (n >= 0 && wolnaKom(n)) { const d = (i - ci) ** 2 + (j - cj) ** 2; if (d < nd) { nd = d; naj = n; } }
    }
    if (naj >= 0) return naj;
  }
  return -1;
}
function szukajDrogi(sx, sz, cele, tx, tz, maks = 7000) {
  hGen++;
  let s = najblizszaWolna(kom(sx, sz), 4); if (s < 0) return null;
  let ile = 0; for (const c of cele) if (c >= 0 && wolnaKom(c)) { H_CEL[c] = hGen; ile++; }
  if (!ile) return null;
  if (H_CEL[s] === hGen) return [s];
  const ti = Math.floor(tx + POL), tj = Math.floor(tz + POL);
  const h = c => { const dx = Math.abs((c % N) - ti), dz = Math.abs(((c / N) | 0) - tj); return dx + dz - 0.586 * Math.min(dx, dz); };
  kopN = 0; H_G[s] = 0; H_ST[s] = hGen; H_OD[s] = -1; kopDodaj(s, h(s));
  let naj = s, najH = h(s), it = 0, kon = -1;
  while (kopN && it++ < maks) {
    const c = kopWez();
    if (H_ZAM[c] === hGen) continue; H_ZAM[c] = hGen;
    if (H_CEL[c] === hGen) { kon = c; break; }
    const hc = h(c); if (hc < najH) { najH = hc; naj = c; }
    const ci = c % N, cj = (c / N) | 0;
    for (let k = 0; k < 8; k++) {
      const di = DI[k], dj = DJ[k], ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const n = nj * N + ni; if (!wolnaKom(n) || H_ZAM[n] === hGen) continue;
      if (di && dj && (!wolnaKom(cj * N + ni) || !wolnaKom(nj * N + ci))) continue;
      const g = H_G[c] + (di && dj ? 1.4142 : 1);
      if (H_ST[n] === hGen && g >= H_G[n]) continue;
      H_ST[n] = hGen; H_G[n] = g; H_OD[n] = c; kopDodaj(n, g + h(n));
    }
  }
  if (kon < 0) kon = naj;
  const droga = []; for (let c = kon; c !== -1 && droga.length < 4000; c = H_OD[c]) droga.push(c);
  return droga.reverse();
}
function widac(ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.25);
  for (let i = 1; i <= n; i++) {
    const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    if (!wolneXZ(x, z) || !wolneXZ(x + 0.3, z) || !wolneXZ(x - 0.3, z) || !wolneXZ(x, z + 0.3) || !wolneXZ(x, z - 0.3)) return false;
  }
  return true;
}
function wygladz(px, pz, pts) {
  const out = []; let ax = px, az = pz, i = 0;
  while (i < pts.length) {
    let j = Math.min(pts.length - 1, i + 24);
    while (j > i && !widac(ax, az, pts[j][0], pts[j][1])) j--;
    out.push(pts[j]); [ax, az] = pts[j]; i = j + 1;
  }
  return out;
}
function celePunkt(x, z) { const c = najblizszaWolna(kom(Math.max(0.5 - POL, Math.min(POL - 0.5, x)), Math.max(0.5 - POL, Math.min(POL - 0.5, z))), 10); return c >= 0 ? [c] : []; }
function celeWokol(i0, j0, w) {
  const out = [];
  for (let i = i0 - 1; i <= i0 + w; i++) out.push(kom2(i, j0 - 1), kom2(i, j0 + w));
  for (let j = j0; j < j0 + w; j++) out.push(kom2(i0 - 1, j), kom2(i0 + w, j));
  return out;
}
const celeBudynku = b => celeWokol(b.i0, b.j0, b.w);
const celeZasobu = z0 => celeWokol(z0.c % N, (z0.c / N) | 0, 1);
// ustawia drogę jednostki; zwraca false, gdy nie da się dojść
function ustawDroge(u, cele, tx, tz, punkt = false) {
  RUCH = u.strona;
  u.droga = { cele, tx, tz, punkt }; u.utkn = 0; u.ostPoz = [u.x, u.z];
  // prosto, jeśli nic nie zasłania
  if (cele.length === 1 && cele[0] >= 0) {
    const [cx, cz] = punkt && kom(tx, tz) === cele[0] ? [tx, tz] : srodekKom(cele[0]);
    if (widac(u.x, u.z, cx, cz)) { u.sciezka = [[cx, cz]]; return true; }
  }
  const d = szukajDrogi(u.x, u.z, cele, tx, tz, (typMapy() === 'dolina' ? 7000 : 30000) * Math.max(1, (N / 240) ** 2));
  if (!d) { u.sciezka = null; return false; }
  const pts = d.map(srodekKom);
  if (punkt && kom(tx, tz) === d[d.length - 1]) pts[pts.length - 1] = [tx, tz];
  if (pts.length > 1) pts.shift();
  u.sciezka = wygladz(u.x, u.z, pts);
  return H_CEL[d[d.length - 1]] === hGen || d.length === 1;
}

// ================= jednostki =================
function nowaJednostka(strona, typ, x, z, id) {
  const d = JEDNOSTKI[typ];
  const max = maxHpJ(strona, typ);
  const u = { id: id || S.nextId++, strona, typ, d, x, z, ry: strona ? 0.8 : -2.4, hp: max, max, zad: null, sciezka: null, niesie: { sur: null, ile: 0 }, cd: 0, skan: Math.random() * 0.5, t: Math.random() * 10 };
  u.mesh = new THREE.Mesh(typ === 'osadnik' ? MOD.osadnik(strona, u.id % 6) : MOD.JEDNOSTKI3D[typ](strona), MAT);
  u.faza = Math.random() * 6; u.amp = 0; u.kolo = 0;
  u.mesh.onBeforeRender = () => { const sh = MAT.userData.sh; if (!sh) return; sh.uniforms.uFaza.value = u.faza; sh.uniforms.uAmp.value = u.amp; sh.uniforms.uKolo.value = u.kolo; MAT.uniformsNeedUpdate = true; };
  u.mesh.position.set(x, 0, z); scena.add(u.mesh);
  JED.push(u); E.set(u.id, u);
  return u;
}
// ulepszenia, które wzmacniają jednostki (pole wzmocni w ULEPSZENIA): hp, atak, szybkosc mnożą; zasieg, pancerz, leczy, wampir dodają
const WZM = Object.entries(ULEPSZENIA).filter(([, d]) => d.wzmocni);
function pasuje(w, typ, d) {
  return !!(w.typy && w.typy.includes(typ) || w.linie && w.linie.includes(d.linia) || w.mit && d.mit || w.jazda && d.linia === 'renifer' || w.wojsko && d.wojsko
    || w.wojskoWrecz && d.wojsko && !d.zasieg && !d.tylkoBudynki && !d.mit || w.strzelcy && d.zasieg > 0 && !d.oblezenie && !d.mit);
}
function wzm(strona, typ, k, v) {
  const ul = S.ul[strona], d = JEDNOSTKI[typ];
  for (const [id, u] of WZM) if (ul[id] && u.wzmocni[k] != null && pasuje(u.wzmocni, typ, d)) v = k === 'hp' || k === 'atak' || k === 'szybkosc' ? v * u.wzmocni[k] : v + u.wzmocni[k];
  if (d.bohater && (k === 'hp' || k === 'atak')) v *= 1 + BOHATER_ERA * Math.max(0, S.era[strona] - d.era);
  return v;
}
// po ulepszeniu albo nowej erze: nowe życie jednostek (rany zostają w tej samej proporcji)
function przeliczZycie(strona) { for (const u of JED) if (u.strona === strona) { const nm = maxHpJ(strona, u.typ); if (nm !== u.max) { u.hp = u.hp * nm / u.max; u.max = nm; } } }
// bogowie wybrani przez stronę (główny i pomniejsi)
const bogMa = (strona, id) => !!(S && S.bogowie && S.bogowie[strona] && S.bogowie[strona].includes(id));
const buff = (strona, k) => !!(S.buff && S.buff[strona] && S.buff[strona][k] > S.czas);
function predkosc(u) { const ul = S.ul[u.strona]; return u.d.szybkosc * (u.typ === 'osadnik' ? (ul.taczka ? 1.1 : 1) * (ul.wozek ? 1.1 : 1) : 1) * (ul.zaprzeg && (u.d.oblezenie || u.d.kupiec) ? EFEKTY.zaprzeg : 1) * (u.d.wojsko && bogMa(u.strona, 'jarylo') ? 1.1 : 1) * wzm(u.strona, u.typ, 'szybkosc', 1); }
function udzwig(u) { const ul = S.ul[u.strona]; return UDZWIG + (ul.kosz ? 3 : 0) + (ul.taczka ? 4 : 0) + (ul.wozek ? 5 : 0) + (ul.plecak1 ? 2 : 0) + (ul.plecak2 ? 3 : 0) + (ul.plecak3 ? 4 : 0) + (bogMa(u.strona, 'dazbog') ? 2 : 0) + (ul.len_mokoszy ? 3 : 0); }
function maxHpJ(strona, typ) {
  const d = JEDNOSTKI[typ];
  return Math.round((d.hp + (typ === 'osadnik' && S.ul[strona].rekawice ? 15 : 0)) * (d.linia === 'renifer' && bogMa(strona, 'swietowit') ? 1.2 : 1) * (d.mit && bogMa(strona, 'marzanna') ? 1.15 : 1) * wzm(strona, typ, 'hp', 1));
}
// strzelcy (bez katapulty) korzystają z ulepszeń pocisków
const strzelec = d => d.zasieg > 0 && !d.oblezenie;
function poziomPociskow(strona) { const ul = S.ul[strona]; return (ul.pociski1 ? 1 : 0) + (ul.pociski2 ? 1 : 0) + (ul.pociski3 ? 1 : 0); }
function zasiegPociskow(strona) { const ul = S.ul[strona]; return (ul.pociski2 ? 1 : 0) + (ul.pociski3 ? 1 : 0); }
function tempoZbierania(u, rodzaj) {
  const ul = S.ul[u.strona];
  let t = ZBIERANIE[rodzaj];
  if (rodzaj === 'pole') t *= (ul.sciolka ? 1.15 : 1) * (ul.nawadnianie ? 1.15 : 1) * (ul.mrozoodporne ? 1.2 : 1);
  if (rodzaj === 'drewno') t *= (ul.deski ? 1.15 : 1) * (ul.siekiera_z ? 1.2 : 1) * (ul.pila ? 1.2 : 1);
  if (rodzaj === 'kamien') t *= (ul.kilof ? 1.2 : 1) * (ul.kilof_z ? 1.2 : 1);
  if (rodzaj === 'zelazo' || rodzaj === 'zloto') t *= ul.kilof_z ? 1.2 : 1;
  if (ul.szyb && (rodzaj === 'kamien' || rodzaj === 'zelazo' || rodzaj === 'zloto')) t *= EFEKTY.szyb;
  if (bogMa(u.strona, 'mokosz') && (rodzaj === 'jagody' || rodzaj === 'pole')) t *= 1.15;
  if (rodzaj === 'pole' && ul.stada_welesa) t *= 1.15;
  if (rodzaj === 'jagody' && ul.bartnictwo) t *= 1.15;
  if (rodzaj === 'zloto' && ul.dar_slonca) t *= 1.2;
  if (buff(u.strona, 'slonce')) t *= MOCE.slonce.razy;
  if (u.strona !== STRONA_GRACZA || S.aiGracz) t *= TRUDNOSC[trudnoscStrony(u.strona)].zbieranie;
  return t;
}
function atakJ(u) {
  const ul = S.ul[u.strona]; let a = u.d.atak;
  if (u.d.wojsko && !u.d.zasieg && !u.d.tylkoBudynki) a += (ul.bron1 ? 1 : 0) + (ul.bron2 ? 1 : 0) + (ul.bron3 ? 2 : 0);
  if (strzelec(u.d)) a += poziomPociskow(u.strona);
  if (u.d.oblezenie && ul.inzynierowie) a *= EFEKTY.inzynierowie;
  if (u.d.wojsko && !u.d.zasieg && !u.d.tylkoBudynki && bogMa(u.strona, 'perun')) a += 1;
  if (u.d.mit && bogMa(u.strona, 'trzyglow')) a += 2;
  if (u.d.wojsko && buff(u.strona, 'ogien')) a *= MOCE.swietyOgien.razy;
  a *= wzm(u.strona, u.typ, 'atak', 1);
  return Math.round(a * 10) / 10;
}
function zasiegJ(u) { return u.d.zasieg ? u.d.zasieg + (strzelec(u.d) && !u.d.mit ? zasiegPociskow(u.strona) + (bogMa(u.strona, 'strzybog') ? 1 : 0) : 0) + wzm(u.strona, u.typ, 'zasieg', 0) : 0; }
function pancerzJ(u) { const ul = S.ul[u.strona]; return u.d.pancerz + (u.d.wojsko ? (ul.zbroja1 ? 1 : 0) + (ul.zbroja2 ? 1 : 0) + (ul.zbroja3 ? 2 : 0) + (bogMa(u.strona, 'swarog') ? 1 : 0) : 0) + wzm(u.strona, u.typ, 'pancerz', 0); }
const poziomMuru = strona => 1 + (S.ul[strona].mur_cegla ? 1 : 0) + (S.ul[strona].mur_stal ? 1 : 0);
function maxHpBud(strona, typ, poziom = 1) {
  if (typ === 'mur' || typ === 'brama') { const p = MUR_POZIOMY[poziomMuru(strona)]; return typ === 'mur' ? p.hpMur : p.hpBrama; }
  // Murarze, Mistrzowie budowy i Umocniony Dworek dają budynkom więcej życia
  const ul = S && S.ul && S.ul[strona] || {};
  const m = (1 + (ul.murarze ? EFEKTY.murarze : 0) + (ul.budowniczowie ? EFEKTY.budowniczowie : 0)) * (typ === 'ratusz' && ul.umocnienie ? EFEKTY.umocnienieZycie : 1) * (bogMa(strona, 'swarog') ? 1.1 : 1) * (typ === 'wieza' && ul.swiety_zar ? 1.25 : 1);
  return Math.round((typ === 'wieza' ? WIEZA_POZIOMY[poziom].hp : BUDYNKI[typ].hp) * m);
}
const nazwaBud = b => b.typ === 'wieza' ? WIEZA_POZIOMY[b.poziom || 1].nazwa : b.d.mur || b.d.brama ? MUR_POZIOMY[poziomMuru(b.strona)][b.typ] : b.d.nazwa;
const emojiBud = b => b.typ === 'wieza' ? WIEZA_POZIOMY[b.poziom || 1].emoji : (b.d.mur || b.d.brama) && poziomMuru(b.strona) > 1 ? '🧱' : b.d.emoji;
function modelBud(typ, poziom, strona, zamk = false) {
  if ((typ === 'mur' || typ === 'brama') && strona != null && S) { const p = poziomMuru(strona); return (p > 1 ? typ + p : typ) + (typ === 'brama' && zamk ? 'Z' : ''); }
  return typ === 'wieza' && poziom > 1 ? 'wieza' + poziom : typ;
}
// strzelanie budynku: ambona zależy od poziomu i ulepszeń pocisków
function strzalBud(b) {
  const ul = S.ul[b.strona], mn = (ul.blanki ? EFEKTY.blanki : 1) * (bogMa(b.strona, 'swarozyc') ? 1.25 : 1), dal = ul.lunety ? EFEKTY.lunety : 0;
  if (b.typ === 'wieza') { const p = WIEZA_POZIOMY[b.poziom || 1]; return { atak: (p.atak + poziomPociskow(b.strona)) * mn, zasieg: p.zasieg + zasiegPociskow(b.strona) + dal, odstep: p.odstep }; }
  const um = b.typ === 'ratusz' && ul.umocnienie;
  return { atak: (b.d.strzela.atak + (ul.pociski1 ? 1 : 0)) * mn * (um ? EFEKTY.umocnienieAtak : 1), zasieg: b.d.strzela.zasieg + dal + (um ? EFEKTY.umocnienieZasieg : 0), odstep: b.d.strzela.odstep };
}
function brakRozbudowy(b) {
  const nast = WIEZA_POZIOMY[(b.poziom || 1) + 1];
  if (!nast) return 'max';
  if (b.kolejka.some(q => q.rodzaj === 'rozb')) return 'w trakcie';
  if (nast.era > S.era[b.strona]) return '🔒 Era ' + nast.era;
  return null;
}
// linie wojska: w budynku szkoli się najwyższy stopień, na który jest awans
function typyBudynku(strona, budTyp) {
  const linie = {};
  for (const [t, d] of Object.entries(JEDNOSTKI)) {
    if (d.z !== budTyp || d.awans && !S.ul[strona][d.awans] || d.bog && !bogMa(strona, d.bog)) continue;
    const l = d.linia || t; if (!linie[l] || (d.st || 1) > (JEDNOSTKI[linie[l]].st || 1)) linie[l] = t;
  }
  return Object.values(linie);
}
const najwyzszy = (strona, typ) => { const d = JEDNOSTKI[typ]; return d.linia ? typyBudynku(strona, d.z).find(t => JEDNOSTKI[t].linia === d.linia) || typ : typ; };
function awansuj(strona, nowy) {
  const d = JEDNOSTKI[nowy];
  for (const u of JED) if (u.strona === strona && u.d.linia === d.linia && (u.d.st || 1) < d.st) {
    const p = u.hp / u.max; u.typ = nowy; u.d = d; u.max = maxHpJ(strona, nowy); u.hp = u.max * p;
    u.mesh.geometry = MOD.JEDNOSTKI3D[nowy](strona);
    if (u.ludz) { scena.remove(u.ludz.obj); u.ludz = null; } // nowy wygląd zrobi się przy rysowaniu
  }
}

function przesun(u, nx, nz) {
  RUCH = u.strona;
  nx = Math.max(0.4 - POL, Math.min(POL - 0.4, nx)); nz = Math.max(0.4 - POL, Math.min(POL - 0.4, nz));
  if (wolneXZ(nx, nz)) { u.x = nx; u.z = nz; } else if (wolneXZ(nx, u.z)) u.x = nx; else if (wolneXZ(u.x, nz)) u.z = nz;
}
// idzie po drodze; zwraca true, gdy doszedł do końca
function ruch(u, dt) {
  if (!u.sciezka || !u.sciezka.length) return true;
  const [tx, tz] = u.sciezka[0], dx = tx - u.x, dz = tz - u.z, d = Math.hypot(dx, dz), v = predkosc(u) * dt;
  u.idzie = true;
  if (d > 0.01) u.ry = Math.atan2(dx, dz);
  if (d <= v) { przesun(u, tx, tz); u.sciezka.shift(); if (!u.sciezka.length) { u.sciezka = null; return true; } return false; }
  przesun(u, u.x + dx / d * v, u.z + dz / d * v);
  // utknął? policz drogę jeszcze raz
  u.utkn = (u.utkn || 0) + dt;
  if (u.utkn > 1.2) {
    const [ox, oz] = u.ostPoz || [u.x - 1, u.z];
    if (Math.hypot(u.x - ox, u.z - oz) < 0.3 && u.droga) { const dr = u.droga; u.zlych = (u.zlych || 0) + 1; ustawDroge(u, dr.cele, dr.tx, dr.tz, dr.punkt); if (u.zlych > 3) { u.sciezka = null; u.zlych = 0; return true; } }
    else u.zlych = 0;
    u.utkn = 0; u.ostPoz = [u.x, u.z];
  }
  return false;
}
function stop(u) { u.zad = null; u.sciezka = null; }

function najblizszySkup(strona, sur, x, z) {
  let naj = null, nd = Infinity;
  for (const b of BUD) if (b.strona === strona && b.gotowy && b.d.skup && b.d.skup.includes(sur)) { const d = dystDoProst(x, z, b); if (d < nd) { nd = d; naj = b; } }
  return naj;
}
function dostepny(z0) { const i = z0.c % N, j = (z0.c / N) | 0; for (let k = 0; k < 8; k++) if (wolnaKom(kom2(i + DI[k], j + DJ[k]))) return true; return false; }
function najblizszyZasob(sur, x, z, maksR = 60, pomin = 0) {
  let naj = null, nd = maksR * maksR;
  for (const z0 of ZAS_TYP[sur]) {
    if (z0.ile <= 0 || z0.id === pomin) continue;
    const d = (z0.x - x) ** 2 + (z0.z - z) ** 2; if (d >= nd) continue;
    if (!dostepny(z0)) continue;
    nd = d; naj = z0;
  }
  return naj;
}
function sprzatnijListy() { for (const k in ZAS_TYP) ZAS_TYP[k] = ZAS_TYP[k].filter(z0 => z0.ile > 0); }

// ---------- rozkazy ----------
function rozkazIdz(u, x, z) { u.zad = { typ: 'idz', x, z }; ustawDroge(u, celePunkt(x, z), x, z, true); }
function rozkazZbieraj(u, z0) {
  if (u.typ !== 'osadnik') return rozkazIdz(u, z0.x, z0.z);
  if (u.niesie.sur && u.niesie.sur !== z0.sur) u.niesie = { sur: null, ile: 0 };
  u.zad = { typ: 'zbieraj', zid: z0.id, sur: z0.sur, faza: 'idz', ox: z0.x, oz: z0.z }; u.sciezka = null;
}
function rozkazBuduj(u, b) {
  if (u.typ !== 'osadnik' && !u.d.naprawia) return rozkazIdz(u, b.x, b.z);
  // zapamiętuje, co robił, żeby po budowie wrócić do tej pracy
  const pop = u.zad && (u.zad.typ === 'zbieraj' || u.zad.typ === 'farma') ? { ...u.zad, faza: u.zad.faza === 'niesie' ? 'niesie' : 'idz' } : u.zad && u.zad.typ === 'buduj' ? u.zad.potem : null;
  u.zad = { typ: 'buduj', bid: b.id, potem: pop || null }; u.sciezka = null;
}
function rozkazFarma(u, b) { if (u.typ !== 'osadnik') return; for (const o of JED) if (o !== u && o.zad && o.zad.typ === 'farma' && o.zad.bid === b.id) stop(o); u.zad = { typ: 'farma', bid: b.id, faza: 'idz' }; u.sciezka = null; }
function rozkazAtak(u, c, potem = null) {
  if (u.d.tylkoBudynki && !jestBudynkiem(c)) return;
  u.zad = { typ: 'atakuj', cid: c.id, potem }; u.sciezka = null; u.przelicz = 0;
}
// wóz kupiecki: z Jarmarku do najdalszego twojego spichlerza (albo Dworku) i z powrotem; złoto za każdy kurs zależy od odległości
function rozkazHandel(u, jarmark) { u.zad = { typ: 'handel', jid: jarmark.id, faza: 'doDomu', dom: 0 }; u.sciezka = null; }
function domHandlu(strona, j) {
  let naj = null, nd = -1;
  for (const b of BUD) if (b.strona === strona && b.gotowy && (b.typ === 'spichlerz' || b.typ === 'ratusz')) { const d = dyst(b, j); if (d > nd) { nd = d; naj = b; } }
  return naj;
}
// liczy się droga wozu (od brzegu do brzegu budynków), nie odległość środków
const zyskKursu = (j, dom) => Math.max(1, Math.round(HANDEL.zyskWozu(Math.max(0, dyst(j, dom) - (j.w + dom.w) / 2 - 0.5)) * (S.ul[j.strona].monety ? EFEKTY.monety : 1) * (bogMa(j.strona, 'weles') ? 1.2 : 1)));
function handel(u, dt) {
  const z = u.zad, j = E.get(z.jid);
  if (!j || j.hp <= 0 || !j.gotowy) { u.zad = null; return; }
  let dom = z.dom ? E.get(z.dom) : null;
  if (!dom || dom.hp <= 0) { dom = domHandlu(u.strona, j); if (!dom) { u.zad = null; return; } z.dom = dom.id; u.sciezka = null; }
  const cel = z.faza === 'doDomu' ? dom : j;
  if (dystDoProst(u.x, u.z, cel) < 0.9) {
    if (z.faza === 'naTarg') {
      const zysk = zyskKursu(j, dom);
      S.zas[u.strona].zloto += zysk; S.stat[u.strona].zebrane += zysk;
      if (u.strona === STRONA_GRACZA && !S.aiGracz) { napis(j.x, 2.6, j.z, '+' + zysk + ' 🪙', '#ffd84a'); EF.zloto(j.x, 1.5, j.z); odglos('monety', j.x, j.z, 0.8); }
      z.faza = 'doDomu'; z.dom = 0;
    } else z.faza = 'naTarg';
    u.sciezka = null; return;
  }
  if (!u.sciezka && !ustawDroge(u, celeBudynku(cel), cel.x, cel.z) && !u.sciezka) { u.zad = null; return; }
  ruch(u, dt);
}
function rozkazModl(u, b) { if (u.typ !== 'osadnik') return; u.zad = { typ: 'modl', bid: b.id }; u.sciezka = null; }
function dodajLaske(strona, ile) { const z = S.zas[strona]; z.laska = Math.min(LASKA.maks, (z.laska || 0) + ile); }
const tempoLaski = strona => LASKA.modlitwa * (bogMa(strona, 'weles') ? 1.25 : 1) * (bogMa(strona, 'lada') ? 1.2 : 1) * (S.ul[strona].kupala ? 1.2 : 1);
function modl(u, dt) {
  const b = E.get(u.zad.bid);
  if (!b || b.hp <= 0 || !b.gotowy) { u.zad = null; return; }
  // osadnicy stają w kręgu wokół Gontyny, twarzą do posągu
  const a = (u.id * 2.39996) % (Math.PI * 2), r = b.w / 2 + 0.75, px = b.x + Math.sin(a) * r, pz = b.z + Math.cos(a) * r;
  if (Math.hypot(px - u.x, pz - u.z) < 0.9 || u.zad.stoi) {
    u.zad.stoi = true; u.sciezka = null; u.pracuje = true; u.ry = Math.atan2(b.x - u.x, b.z - u.z);
    b.modlacy = (b.modlacy || 0) + 1;
    if (b.modlacy <= LASKA.modlacychNaGontyne) dodajLaske(u.strona, tempoLaski(u.strona) * dt);
    return;
  }
  if (!u.sciezka) { ustawDroge(u, celePunkt(px, pz), px, pz, true); if (!u.sciezka) { u.zad.stoi = true; return; } }
  if (ruch(u, dt)) u.zad.stoi = true;
}
function rozkazNaprzod(u, x, z) { u.zad = { typ: 'naprzod', x, z }; u.sciezka = null; }

// tryby żołnierzy: obrona (nie atakują pierwsi), agresja (żołnierze i strzelające budynki), szał (wszystko w okolicy)
const POSTAWY = {
  obrona: { emoji: '🛡️', nazwa: 'Obrona', opis: 'Nie atakują pierwsi, oddają, gdy ktoś ich uderzy' },
  agresja: { emoji: '⚔️', nazwa: 'Agresja', opis: 'Atakują żołnierzy i budynki, które strzelają' },
  szal: { emoji: '🔥', nazwa: 'Szał', opis: 'Rozwalają wszystko w okolicy' },
};
function celPostawy(u) {
  const p = u.postawa || 'agresja';
  if (p === 'obrona') return null;
  const szal = p === 'szal', r = u.d.wzrok + (szal ? 2 : 0);
  let naj = null, nd = r * r;
  if (!u.d.tylkoBudynki) for (const e of JED) {
    if (!wrogowie(u.strona, e.strona) || e.hp <= 0 || !szal && !e.d.wojsko) continue;
    let d = (e.x - u.x) ** 2 + (e.z - u.z) ** 2; if (!e.d.wojsko) d *= 1.6;
    if (d < nd) { nd = d; naj = e; }
  }
  if (naj) return naj;
  let nb = r;
  for (const b of BUD) { if (!wrogowie(u.strona, b.strona) || !szal && !b.d.strzela) continue; const d = dystDoProst(u.x, u.z, b); if (d < nb) { nb = d; naj = b; } }
  return naj;
}
// cel do walki w pobliżu (najpierw ludzie, potem budynki)
function celWalki(u, r, budynkiTez) {
  let naj = null, nd = r * r;
  if (!u.d.tylkoBudynki) for (const e of JED) {
    if (!wrogowie(u.strona, e.strona) || e.hp <= 0) continue;
    let d = (e.x - u.x) ** 2 + (e.z - u.z) ** 2; if (!e.d.wojsko) d *= 1.6; // najpierw wojsko
    if (d < nd) { nd = d; naj = e; }
  }
  if (naj || !(budynkiTez || u.d.tylkoBudynki)) return naj;
  let nb = u.d.tylkoBudynki ? r + 4 : r;
  for (const b of BUD) { if (!wrogowie(u.strona, b.strona)) continue; const d = dystDoProst(u.x, u.z, b) - (b.d.strzela ? 1 : 0); if (d < nb) { nb = d; naj = b; } }
  return naj;
}

// ---------- obrażenia ----------
function obrazenia(atakujacy, cel, atak) {
  if (jestBudynkiem(cel)) {
    if (atakujacy.d && atakujacy.d.tylkoBudynki) return atak;
    if (atakujacy.d && atakujacy.d.oblezenie) return atak * 2;
    // ambona strzela do budynków mocniej niż zwykli strzelcy
    // Płonące pociski: strzelcy i ambony niszczą budynki szybciej
    const ogien = atakujacy.d && (atakujacy.d.zasieg || atakujacy.typ === 'wieza') && S.ul[atakujacy.strona] && S.ul[atakujacy.strona].ogniste ? EFEKTY.ogniste : 1;
    return Math.max(1, ogien * atak * (atakujacy.d && atakujacy.d.burzy || 1) * (atakujacy.d && atakujacy.d.zasieg ? 0.15 : atakujacy.d && atakujacy.typ === 'wieza' ? 0.6 : atakujacy.d && atakujacy.d.w ? 0.2 : 0.45));
  }
  const bonus = ((atakujacy.d && atakujacy.d.przeciw && cel.d.linia && atakujacy.d.przeciw[cel.d.linia]) || 1) * (atakujacy.d && atakujacy.d.bohater && cel.d.mit ? 3 : 1);
  const dystans = !atakujacy.d || atakujacy.d.zasieg || atakujacy.d.w;
  const ulC = S.ul[cel.strona] || {}, tarcze = dystans && cel.d.wojsko ? (ulC.tarcze1 ? 1 : 0) + (ulC.tarcze2 ? 1 : 0) + (ulC.tarcze3 ? 2 : 0) : 0;
  const p = pancerzJ(cel) + tarcze + (dystans && cel.d.pancerzDystans ? cel.d.pancerzDystans : 0);
  return Math.max(1, atak * bonus - p);
}
let alarmT = -99;
function zadaj(cel, ile, od) {
  if (!zyje(cel)) return;
  cel.hp -= ile; cel.trafiony = S.czas;
  if (od && wrogowie(od.strona, cel.strona)) {
    if (cel.strona === STRONA_GRACZA || od.strona === STRONA_GRACZA) walkaT = S.czas;
    if (cel.strona === STRONA_GRACZA && S.czas - alarmT > 25 && !S.aiGracz) { alarmT = S.czas; toast('⚠️ Atak na twoją osadę!'); dzwiek('alarm'); ping = { x: cel.x, z: cel.z, t: 3 }; }
  }
  // wojsko oddaje
  // (w obronie też oddają, ale potem wracają na swoje miejsce; w agresji i szale oddają też strzelającym budynkom)
  if (!jestBudynkiem(cel) && cel.d.wojsko && od && zyje(od) && (!jestBudynkiem(od) || (cel.postawa || 'agresja') !== 'obrona' && !cel.d.zasieg)
    && (!cel.zad || cel.zad.typ === 'idz' && cel.strona !== STRONA_GRACZA)) {
    rozkazAtak(cel, od, { typ: 'idz', x: cel.x, z: cel.z, wraca: true }); if (cel.zad) { cel.zad.sx = cel.x; cel.zad.sz = cel.z; cel.zad.pogon = cel.postawa === 'obrona' ? 7 : 12; }
  }
  if (cel.hp <= 0) jestBudynkiem(cel) ? zniszczBudynek(cel, false, od) : zabij(cel, od);
}
function uderz(u, c) {
  if (u.d.zasieg) { rzut(u, c, atakJ(u)); if (!odglos('zamach', u.x, u.z, 0.45)) dzwiek('rzut'); }
  else { const ob = obrazenia(u, c, atakJ(u)); zadaj(c, ob, u); if (u.d.wampir) u.hp = Math.min(u.max, u.hp + ob * wzm(u.strona, u.typ, 'wampir', u.d.wampir)); if (naEkranie(u)) { if (!odglosUderzenia(u, c)) dzwiek('uderz'); EF.iskry((u.x + c.x) / 2, 0.7, (u.z + c.z) / 2, jestBudynkiem(c) ? 3 : 5, jestBudynkiem(c) ? '#e0c08a' : '#ffd84a'); } }
}
const KAMYK = MOD.kamyk();
function rzut(od, cel, atak) {
  const h = jestBudynkiem(od) ? (od.typ === 'wieza' ? [0, 3.2, 3.3, 4.0][od.poziom || 1] : 2.6) : 1.1 + (od.d.lata || 0);
  const mesh = new THREE.Mesh(od.d && od.d.mit ? MOD.pociskStwora(od.typ) : KAMYK, MAT); scena.add(mesh);
  const d = Math.hypot(cel.x - od.x, cel.z - od.z);
  POC.push({ mesh, x0: od.x, z0: od.z, y0: h, cel, od, atak, ox: cel.x, oz: cel.z, t: 0, T: Math.max(0.25, d / 13) });
}
function zabij(u, od) {
  E.delete(u.id); JED.splice(JED.indexOf(u), 1);
  wybrane = wybrane.filter(e => e !== u);
  // realistyczna postać pada z prawdziwym ruchem, prosta bryła przewraca się jak dotąd
  if (u.ludz && u.ludz.obj.visible) { scena.remove(u.mesh); u.ludz.graj('Death01', 1, true); UMIERA.push({ mesh: u.ludz.obj, ludz: u.ludz, t: 0, j: 2 }); }
  else { if (u.ludz) scena.remove(u.ludz.obj); UMIERA.push({ mesh: u.mesh, t: 0, j: true, ry: u.ry }); }
  if (od && S.stat[od.strona]) S.stat[od.strona].pokonani++;
  if (od && u.d.wojsko && bogMa(od.strona, 'perun')) dodajLaske(od.strona, LASKA.zaWroga);
}
const GRUZY = [];
function usunGruzy(i0, j0, w) {
  for (let k = GRUZY.length - 1; k >= 0; k--) { const g = GRUZY[k]; if (g.i0 < i0 + w && g.i0 + g.w > i0 && g.j0 < j0 + w && g.j0 + g.w > j0) { scena.remove(g.mesh); GRUZY.splice(k, 1); } }
}
function zniszczBudynek(b, wlasnaReka = false, od = null) {
  E.delete(b.id); BUD.splice(BUD.indexOf(b), 1);
  wybrane = wybrane.filter(e => e !== b);
  for (let j = b.j0; j < b.j0 + b.w; j++) for (let i = b.i0; i < b.i0 + b.w; i++) { const c = kom2(i, j); if (naKom[c] === b.id) { blok[c] = 0; naKom[c] = 0; bramaStr[c] = -1; } }
  if (b.kom) for (const c of b.kom) if (naKom[c] === b.id) { blok[c] = 0; naKom[c] = 0; bramaStr[c] = -1; }
  if (b.plac) b.mesh.remove(b.plac);
  UMIERA.push({ mesh: b.mesh, t: 0, j: false });
  if (naEkranie(b)) EF.zawalenie(b);
  if (naEkranie(b) && !odglos('walenie', b.x, b.z, 1.2, 0)) dzwiek('zniszcz');
  if (!wlasnaReka) {
    if (od && S.stat[od.strona]) S.stat[od.strona].zburzone++;
    // zostają ruiny (bez placu budowy); komputer odczeka, zanim postawi taki budynek znowu
    { const g = new THREE.Mesh(MOD.gruz(b.w), MAT); g.position.set(b.x, 0, b.z); g.receiveShadow = true; scena.add(g); GRUZY.push({ mesh: g, i0: b.i0, j0: b.j0, w: b.w, t: 0 }); }
    const A = S.ai[b.strona]; if (A) (A.stracone || (A.stracone = {}))[b.typ] = S.czas;
  }
  miniBrud = true;
  if (!wlasnaReka && b.strona === STRONA_GRACZA && b.typ === 'ratusz' && !S.aiGracz) toast('💥 Twój Gród upadł!');
}

// ---------- zadania jednostek ----------
function aktualizujJednostke(u, dt) {
  RUCH = u.strona;
  u.cd = Math.max(0, u.cd - dt); u.idzie = false; u.pracuje = false;
  if (u.zamarz > S.czas || u.spokoj > S.czas) return;
  // Rusałka leczy swoich wokół (każdego najwyżej raz na sekundę, nawet gdy rusałek jest kilka)
  if (u.d.leczy && (u.lecz = (u.lecz || 0) - dt) <= 0) { u.lecz = 1; for (const o of JED) if (o.strona === u.strona && o !== u && o.hp < o.max && S.czas - (o.leczony || -9) > 0.95 && Math.abs(o.x - u.x) < 4 && Math.abs(o.z - u.z) < 4) { o.leczony = S.czas; o.hp = Math.min(o.max, o.hp + wzm(u.strona, u.typ, 'leczy', u.d.leczy)); } }
  const z = u.zad;
  if (!z) {
    // wóz kupiecki sam wraca do handlu
    if (u.d.kupiec && (u.skan -= dt) <= 0) { u.skan = 1; const j = BUD.filter(b => b.strona === u.strona && b.typ === 'jarmark' && b.gotowy).sort((a, b) => dyst(a, u) - dyst(b, u))[0]; if (j) rozkazHandel(u, j); }
    if (u.sciezka) ruch(u, dt);
    if (u.d.naprawia && (u.skan -= dt) <= 0) { u.skan = 1; const b = doNaprawy(u); if (b) rozkazNapraw(u, b); }
    if (u.d.wojsko && (u.skan -= dt) <= 0) {
      u.skan = 0.5;
      const w = u.strona === STRONA_GRACZA && !S.aiGracz ? celPostawy(u) : celWalki(u, u.d.wzrok, u.d.tylkoBudynki);
      if (w) { rozkazAtak(u, w, { typ: 'idz', x: u.x, z: u.z, wraca: true }); u.zad.sx = u.x; u.zad.sz = u.z; u.zad.pogon = u.postawa === 'szal' ? 20 : 12; }
    }
    return;
  }
  switch (z.typ) {
    case 'idz': if (ruch(u, dt) || !u.sciezka) u.zad = null; break;
    case 'naprzod': {
      if ((u.skan -= dt) <= 0) {
        u.skan = 0.5;
        const w = celWalki(u, u.d.wzrok + 1, true);
        if (w) { rozkazAtak(u, w, z); break; }
      }
      if (!u.sciezka) { if (!z.ruszyl) { z.ruszyl = true; ustawDroge(u, celePunkt(z.x, z.z), z.x, z.z, true); } else { const w = celWalki(u, 14, true); u.zad = w ? { typ: 'atakuj', cid: w.id, potem: null } : null; } }
      else ruch(u, dt);
      break;
    }
    case 'zbieraj': zbieraj(u, dt); break;
    case 'farma': farma(u, dt); break;
    case 'buduj': buduj(u, dt); break;
    case 'naprawiaj': naprawiaj(u, dt); break;
    case 'atakuj': atakuj(u, dt); break;
    case 'handel': handel(u, dt); break;
    case 'modl': modl(u, dt); break;
    default: u.zad = null;
  }
}
function odnies(u, dt, poOddaniu) {
  const z = u.zad;
  let b = z.skup ? E.get(z.skup) : null;
  if (!b || !b.gotowy || b.hp <= 0) {
    b = najblizszySkup(u.strona, u.niesie.sur, u.x, u.z);
    if (!b) { if (u.strona === STRONA_GRACZA && !S.aiGracz && S.czas - (u.ostBrakSkupu || -99) > 30) { u.ostBrakSkupu = S.czas; toast('Nie ma gdzie odnieść: zbuduj ' + { drewno: 'drwalnię', jagody: 'spichlerz', kamien: 'kamieniołom', zelazo: 'kopalnię rudy żelaza' }[u.niesie.sur]); } u.zad = null; return; }
    z.skup = b.id; u.sciezka = null;
  }
  if (dystDoProst(u.x, u.z, b) < 0.8) {
    const s = u.niesie.sur, ile = u.niesie.ile;
    S.zas[u.strona][s] += ile; S.stat[u.strona].zebrane += ile; u.niesie = { sur: null, ile: 0 };
    if (u.strona === STRONA_GRACZA) odglos(s === 'zloto' ? 'monety' : 'odloz', u.x, u.z, 0.35, 150);
    u.sciezka = null; z.skup = 0; poOddaniu(); return;
  }
  if (!u.sciezka && !ustawDroge(u, celeBudynku(b), b.x, b.z)) { if (!u.sciezka) { u.zad = null; return; } }
  ruch(u, dt);
}
function zbieraj(u, dt) {
  const z = u.zad;
  if (z.faza === 'niesie') return odnies(u, dt, () => { z.faza = 'idz'; });
  let r = ZAS.get(z.zid);
  if (!r || r.ile <= 0) {
    r = najblizszyZasob(z.sur, z.ox, z.oz, 10, z.pomin);
    if (!r) { if (u.niesie.ile > 0) { z.faza = 'niesie'; z.skup = 0; u.sciezka = null; } else u.zad = null; return; }
    z.zid = r.id; z.faza = 'idz'; u.sciezka = null;
  }
  if (Math.abs(r.x - u.x) < 1.2 && Math.abs(r.z - u.z) < 1.2) {
    u.sciezka = null; u.pracuje = true; u.ry = Math.atan2(r.x - u.x, r.z - u.z); z.faza = 'zbiera';
    if (r.rodzaj === 'drzewo' && !SCIETE.has(r.id)) zetnij(r, u.x, u.z);
    if (u.niesie.sur !== z.sur) u.niesie = { sur: z.sur, ile: 0 };
    const ile = Math.min(r.ile, tempoZbierania(u, z.sur) * dt);
    r.ile -= ile; u.niesie.ile += ile; z.ox = r.x; z.oz = r.z;
    if (r.ile <= 0.001) usunZasob(r);
    if (u.niesie.ile >= udzwig(u) - 0.001) { u.niesie.ile = udzwig(u); z.faza = 'niesie'; z.skup = 0; u.sciezka = null; }
    return;
  }
  if (!u.sciezka) {
    if (z.faza === 'dochodzi') { z.pomin = r.id; z.zid = 0; z.faza = 'idz'; return; } // nie dało się dojść: inny krzak / drzewo
    ustawDroge(u, celeZasobu(r), r.x, r.z); z.faza = 'dochodzi';
    if (!u.sciezka) { z.pomin = r.id; z.zid = 0; z.faza = 'idz'; }
    return;
  }
  ruch(u, dt);
}
function farma(u, dt) {
  const z = u.zad, b = E.get(z.bid);
  if (!b || b.hp <= 0 || !b.gotowy) { u.zad = null; return; }
  if (z.faza === 'niesie') return odnies(u, dt, () => { z.faza = 'idz'; });
  b.rolnik = u.id;
  if (Math.abs(b.x - u.x) < 1.3 && Math.abs(b.z - u.z) < 1.3) {
    u.sciezka = null; u.pracuje = true;
    if (u.niesie.sur !== 'jagody') u.niesie = { sur: 'jagody', ile: 0 };
    u.niesie.ile += tempoZbierania(u, 'pole') * dt;
    if (u.niesie.ile >= udzwig(u)) { u.niesie.ile = udzwig(u); z.faza = 'niesie'; z.skup = 0; u.sciezka = null; }
    return;
  }
  if (!u.sciezka) { const px = b.x + (u.id % 3 - 1) * 0.6, pz = b.z + 0.3; ustawDroge(u, celePunkt(px, pz), px, pz, true); if (!u.sciezka) { u.zad = null; return; } }
  ruch(u, dt);
}
// po zbudowaniu: osadnik sam bierze się do pracy przy tym budynku albo buduje następny
function wolnePole(b) { const r = b.rolnik && E.get(b.rolnik); return !r || !r.zad || r.zad.typ !== 'farma' || r.zad.bid !== b.id; }
function poBudowie(u, b) {
  if (u.d.naprawia) { u.zad = null; u.skan = 0; return; }
  if (b.d.pole && wolnePole(b)) { rozkazFarma(u, b); return; }
  const inny = BUD.filter(o => o.strona === u.strona && !o.gotowy && dyst(o, u) < 14).sort((a, c) => dyst(a, u) - dyst(c, u))[0];
  if (inny) { const pop = u.zad && u.zad.potem; rozkazBuduj(u, inny); u.zad.potem = pop || null; return; }
  if (u.zad && u.zad.potem) { u.zad = u.zad.potem; u.sciezka = null; return; }
  if (b.d.skup && b.typ !== 'ratusz') {
    for (const s of b.d.skup) { const r = najblizszyZasob(s, b.x, b.z, 9); if (r) { rozkazZbieraj(u, r); return; } }
  }
  u.zad = null;
}
function buduj(u, dt) {
  const b = E.get(u.zad.bid);
  if (!b || b.hp <= 0) { u.zad = null; return; }
  if (b.gotowy) { poBudowie(u, b); return; }
  if (dystDoProst(u.x, u.z, b) < 0.8) {
    u.sciezka = null; u.pracuje = true; u.ry = Math.atan2(b.x - u.x, b.z - u.z);
    const przyrost = dt / b.d.czas * (S.ul[b.strona].budowniczowie ? EFEKTY.budowa : 1);
    b.postep = Math.min(1, b.postep + przyrost); b.hp = Math.min(b.max, b.hp + b.max * przyrost);
    if (b.postep >= 1) ukonczBudynek(b);
    return;
  }
  if (!u.sciezka) { if (!ustawDroge(u, celeBudynku(b), b.x, b.z) && !u.sciezka) { u.zad = null; return; } }
  ruch(u, dt);
}
// rzemieślnik: naprawia uszkodzony budynek; płaci na bieżąco (pełna naprawa = NAPRAWA.koszt ceny budynku, trwa NAPRAWA.wolniej razy dłużej niż budowa)
function rozkazNapraw(u, b) { u.zad = { typ: 'naprawiaj', bid: b.id }; u.sciezka = null; }
function doNaprawy(u) {
  if (S.czas - (u.brakSur || -99) < 10) return null;
  let naj = null, nd = Infinity;
  for (const b of BUD) {
    if (b.strona !== u.strona || !b.gotowy || b.hp >= b.max - 0.5) continue;
    let ilu = 0; for (const o of JED) if (o !== u && o.zad && o.zad.typ === 'naprawiaj' && o.zad.bid === b.id) ilu++;
    if (ilu >= 3) continue;
    const d = dyst(b, u); if (d < nd) { nd = d; naj = b; }
  }
  return naj;
}
let brakNaprT = -99;
function naprawiaj(u, dt) {
  const b = E.get(u.zad.bid);
  if (!b || b.hp <= 0 || b.strona !== u.strona) { u.zad = null; return; }
  if (!b.gotowy) { rozkazBuduj(u, b); return; }
  if (b.hp >= b.max) { u.zad = null; u.skan = 0; return; }
  if (dystDoProst(u.x, u.z, b) < 0.8) {
    u.sciezka = null; u.pracuje = true; u.ry = Math.atan2(b.x - u.x, b.z - u.z);
    const dh = Math.min(b.max - b.hp, b.max * dt / (b.d.czas * NAPRAWA.wolniej)), cz = dh / b.max * NAPRAWA.koszt, koszt = {};
    for (const s in b.d.koszt) koszt[s] = b.d.koszt[s] * cz;
    if (!zaplac(u.strona, koszt)) {
      u.zad = null; u.brakSur = S.czas;
      if (u.strona === STRONA_GRACZA && !S.aiGracz && S.czas - brakNaprT > 20) { brakNaprT = S.czas; toast('🔨 Za mało surowców na naprawę'); }
      return;
    }
    b.hp = Math.min(b.max, b.hp + dh);
    return;
  }
  if (!u.sciezka) { if (!ustawDroge(u, celeBudynku(b), b.x, b.z) && !u.sciezka) { u.zad = null; u.brakSur = S.czas; return; } }
  ruch(u, dt);
}
function atakuj(u, dt) {
  const z = u.zad, c = E.get(z.cid);
  if (!c || c.hp <= 0 || !wrogowie(u.strona, c.strona)) {
    const w = u.d.wojsko ? celWalki(u, u.d.wzrok, z.potem && z.potem.typ === 'naprzod') : null;
    if (w) { z.cid = w.id; u.sciezka = null; return; }
    u.zad = z.potem && !z.potem.wraca ? z.potem : z.potem && z.potem.wraca ? { typ: 'idz', x: z.potem.x, z: z.potem.z } : null; u.sciezka = null;
    if (u.zad && u.zad.typ === 'idz') ustawDroge(u, celePunkt(u.zad.x, u.zad.z), u.zad.x, u.zad.z, true);
    if (u.zad && u.zad.typ === 'naprzod') u.zad.ruszyl = false;
    return;
  }
  // za daleko od miejsca, którego pilnował: wraca
  if (z.sx != null && Math.hypot(u.x - z.sx, u.z - z.sz) > (z.pogon || 12)) { u.zad = { typ: 'idz', x: z.sx, z: z.sz }; ustawDroge(u, celePunkt(z.sx, z.sz), z.sx, z.sz, true); return; }
  const bud = jestBudynkiem(c);
  const odl = bud ? dystDoProst(u.x, u.z, c) : Math.hypot(c.x - u.x, c.z - u.z) - c.d.r;
  // przy budynku trochę więcej, bo z rogu (po skosie) jest dalej do ściany
  const zas = (u.d.zasieg ? zasiegJ(u) : 0.3) + u.d.r + (bud ? 0.3 : 0);
  if (odl <= zas) {
    u.sciezka = null; u.ry = Math.atan2(c.x - u.x, c.z - u.z); u.pracuje = true;
    if (u.cd <= 0) { uderz(u, c); u.cd = u.d.odstep; }
    return;
  }
  u.przelicz = (u.przelicz || 0) - dt;
  if (!u.sciezka || (!bud && u.przelicz <= 0)) {
    u.przelicz = 0.7;
    if (bud) ustawDroge(u, celeBudynku(c), c.x, c.z);
    else ustawDroge(u, celePunkt(c.x, c.z), c.x, c.z, true);
    if (!u.sciezka) { u.zad = z.potem || null; return; }
  }
  ruch(u, dt);
}

// ================= budynki =================
function wysokoscBud(b) { return b.typ === 'wieza' ? [0, 4.2, 4.6, 5.4][b.poziom || 1] : { ratusz: 5.6, dom: 2.1, pole: 0.6, mur: 1.3, brama: 2.2 }[b.typ] || 2.0; }
function miejsceWolne(typ, i0, j0, margines = 0) {
  const w = BUDYNKI[typ].w;
  for (let j = j0 - margines; j < j0 + w + margines; j++) for (let i = i0 - margines; i < i0 + w + margines; i++) {
    if (i < 2 || j < 2 || i >= N - 2 || j >= N - 2) return false;
    if (blok[j * N + i] !== 0) return false;
  }
  return true;
}
const GEO_PLAC = {};
// wygląd muru i bramy: [x, z, kąt, długość] — odcinek leży na linii przeciągniętej palcem (także po skosie),
// choć zajmuje swoją kratkę; stare zapisy i bramy zgadują kierunek od sąsiadów
function ulozMur(b, wyg) {
  if (!wyg) return;
  b.wyg = wyg; b.mesh.position.set(wyg[0], 0, wyg[1]); b.mesh.rotation.y = wyg[2]; b.mesh.scale.x = b.d.brama ? wyg[3] / SZER_MODELU_BRAMY : wyg[3];
}
// brama na SZER_BRAMY kratek (od wersji 25: 4, wcześniej 3): kierunek 0 = wzdłuż x, 1 = po skosie (1, 1), 2 = wzdłuż z, 3 = po skosie (1, -1);
// po skosie kratki idą schodkami jak mur, więc nikt nie przeciśnie się bokiem. Bardzo stare bramy (kier = null) mają 1 kratkę.
const SZER_BRAMY = 4, SZER_MODELU_BRAMY = 4, KAT_BRAMY = [0, -Math.PI / 4, -Math.PI / 2, Math.PI / 4];
function kratkiBramy(i, j, kier, szer = SZER_BRAMY) {
  if (kier == null) return [[i, j]];
  const out = [];
  if (kier % 2 === 0) for (let k = -1; k < szer - 1; k++) out.push(kier === 0 ? [i + k, j] : [i, j + k]);
  else { let a = i - 1, c = j; const dz = kier === 1 ? 1 : -1; out.push([a, c]); for (let k = 1; k < szer; k++) { if (k % 2) a++; else c += dz; out.push([a, c]); } }
  return out;
}
// wygląd bramy: środek jej kratek, kąt kierunku, długość (po skosie kratka to √½ długości)
function wygladBramy(kr, kier) {
  let x = 0, z = 0; for (const [a, c] of kr) { x += a; z += c; }
  return [x / kr.length - POL + 0.5, z / kr.length - POL + 0.5, kier == null ? 0 : KAT_BRAMY[kier], kier == null ? 1 : kr.length * (kier % 2 ? Math.SQRT1_2 : 1)];
}
// kierunek nowej bramy: jak najbliższy mur gracza, a gdy go nie ma, poziomo na ekranie
const kierZKata = a => ((Math.round(a / (Math.PI / 4)) % 4) + 4) % 4;
function murObok(i, j) {
  let naj = null, nd = 9;
  for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
    const o = E.get(naKom[kom2(i + di, j + dj)]);
    if (o && o.strona === STRONA_GRACZA && o.d && o.d.mur && di * di + dj * dj < nd) { nd = di * di + dj * dj; naj = o; }
  }
  return naj;
}
function kierunekBramy(i, j) { const m = murObok(i, j); return kierZKata(m ? -(m.wyg ? m.wyg[2] : 0) : -kam.kat); }
// otwiera albo zamyka bramę: zamkniętej nie przechodzi nikt, otwartą tylko jej właściciel
function ustawBrame(b, zamk) {
  b.zamk = !!zamk; RUCH = b.strona;
  for (const c of b.kom || [kom2(b.i0, b.j0)]) if (naKom[c] === b.id) bramaStr[c] = b.zamk ? -1 : b.strona;
  b.mesh.geometry = MOD.budynek(modelBud(b.typ, b.poziom || 1, b.strona, b.zamk), b.strona);
  if (!b.zamk) return;
  for (const u of JED) if (u.strona === b.strona) {
    const c = kom(u.x, u.z);
    if (naKom[c] === b.id) { const n = najblizszaWolna(c, 4); if (n >= 0) [u.x, u.z] = srodekKom(n); }
    if (u.sciezka && u.droga && Math.hypot(u.x - b.x, u.z - b.z) < 30) { const d = u.droga; ustawDroge(u, d.cele, d.tx, d.tz, d.punkt); }
  }
}
function zgadnijWyglad(b) {
  const sas = (di, dj) => { const o = E.get(naKom[kom2(b.i0 + di, b.j0 + dj)]); return o && o !== b && o.strona === b.strona && o.d && o.d.mur ? o : null; };
  if (b.d.brama) for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const o = sas(di, dj); if (!o || !o.wyg) continue;
    const ux = Math.cos(o.wyg[2]), uz = -Math.sin(o.wyg[2]), t = (b.x - o.wyg[0]) * ux + (b.z - o.wyg[1]) * uz;
    return [o.wyg[0] + ux * t, o.wyg[1] + uz * t, o.wyg[2], 1];
  }
  if ((sas(0, 1) || sas(0, -1)) && !sas(1, 0) && !sas(-1, 0)) return [b.x, b.z, Math.PI / 2, 1];
  return null;
}
function nowyBudynek(strona, typ, i0, j0, gotowy = false, id, poziom = 1, wyg = null, kier = null, szer = SZER_BRAMY) {
  const d = BUDYNKI[typ], w = d.w, max = maxHpBud(strona, typ, poziom);
  const b = { id: id || S.nextId++, strona, typ, d, i0, j0, w, poziom, x: i0 - POL + w / 2, z: j0 - POL + w / 2, max, hp: gotowy ? max : Math.max(1, max * 0.05), postep: gotowy ? 1 : 0, gotowy, kolejka: [], cd: 0, zbiorka: null, rolnik: 0 };
  for (let j = j0; j < j0 + w; j++) for (let i = i0; i < i0 + w; i++) { const c = kom2(i, j); blok[c] = d.pole ? 4 : d.brama ? 5 : 2; naKom[c] = b.id; if (d.brama) bramaStr[c] = strona; }
  // brama na 3 kratki: zajmuje też kratki obok środka
  const krB = d.brama ? kratkiBramy(i0, j0, kier, szer) : null; b.kier = d.brama ? kier : null; b.szer = szer; b.zamk = false;
  if (krB && krB.length > 1) { b.kom = krB.map(([i, j]) => kom2(i, j)); for (const c of b.kom) { blok[c] = 5; naKom[c] = b.id; bramaStr[c] = strona; } for (const [i, j] of krB) { ukryjOzdoby(i, j, 1); usunGruzy(i, j, 1); } }
  b.mesh = new THREE.Mesh(MOD.budynek(modelBud(typ, poziom, strona), strona), MAT);
  b.mesh.castShadow = true; b.mesh.receiveShadow = true;
  b.mesh.position.set(b.x, 0, b.z);
  ukryjOzdoby(i0, j0, w); usunGruzy(i0, j0, w);
  if (!d.pole && !d.mur && !d.brama) { const k = new THREE.Mesh(GEO_KLEP[w] || (GEO_KLEP[w] = new THREE.PlaneGeometry(w + 1.1, w + 1.1).rotateX(-Math.PI / 2)), MAT_KLEP); k.position.y = 0.012; k.renderOrder = 1; k.receiveShadow = true; b.mesh.add(k); }
  if (ROGI[strona] && ROGI[strona][1] < 0) b.mesh.rotation.y = Math.PI; // budynki w rogach z −z są obrócone
  if (d.mur || d.brama) ulozMur(b, wyg || (d.brama ? (b.kom ? wygladBramy(krB, kier) : zgadnijWyglad(b) || [b.x, b.z, 0, 1]) : null));
  if (!gotowy) {
    b.mesh.scale.y = 0.12;
    const g = GEO_PLAC[w] || (GEO_PLAC[w] = new THREE.PlaneGeometry(w - 0.1, w - 0.1).rotateX(-Math.PI / 2));
    b.plac = new THREE.Mesh(g, MAT_PLAC); b.plac.position.y = 0.03; b.plac.scale.y = 1 / 0.12; b.mesh.add(b.plac);
  }
  scena.add(b.mesh);
  BUD.push(b); E.set(b.id, b);
  // ludzie stojący na placu budowy odsuwają się
  if (!d.pole) for (const u of JED) if (!wolneXZ(u.x, u.z)) { const c = najblizszaWolna(kom(u.x, u.z), 6); if (c >= 0) [u.x, u.z] = srodekKom(c); u.sciezka = null; }
  miniBrud = true;
  return b;
}
function ukonczBudynek(b) {
  b.gotowy = true; b.postep = 1; b.mesh.scale.y = 1;
  if (b.plac) { b.mesh.remove(b.plac); b.plac = null; }
  if (b.strona === STRONA_GRACZA && !S.aiGracz) { dzwiek('buduj'); odglos(b.d.brama ? 'brama' : 'skrzyp', b.x, b.z, 0.7); toast(b.d.emoji + ' Gotowe: ' + b.d.nazwa); }
  S.stat[b.strona].budynki++;
}
function ludnosc(strona) { let n = 0; for (const u of JED) if (u.strona === strona) n++; return n; }
function limitLudnosci(strona) { let n = 0; for (const b of BUD) if (b.strona === strona && b.gotowy && b.d.ludnosc) n += b.d.ludnosc; return Math.min(MAKS_LUDNOSC, n); }
function stac(strona, koszt, razy = 1) { const z = S.zas[strona]; return Object.entries(koszt).every(([s, v]) => z[s] >= v * razy); }
function zaplac(strona, koszt) { if (!stac(strona, koszt)) return false; for (const s in koszt) S.zas[strona][s] -= koszt[s]; return true; }
function oddaj(strona, koszt) { for (const s in koszt) S.zas[strona][s] += koszt[s]; }
function budynkiDoEry(strona) { return BUD.filter(b => b.strona === strona && b.gotowy && LICZA_DO_ERY.includes(b.typ)).map(b => b.typ).filter((t, i, a) => a.indexOf(t) === i).length; }
// co jeszcze brakuje, żeby to zrobić (null = można)
function brakBudynku(strona, typ) {
  const d = BUDYNKI[typ];
  if (d.era > S.era[strona]) return '🔒 Era ' + d.era;
  if (d.wymaga && !BUD.some(b => b.strona === strona && b.typ === d.wymaga && b.gotowy)) return '🔒 Najpierw: ' + BUDYNKI[d.wymaga].nazwa;
  return null;
}
function brakJednostki(strona, typ) {
  const d = JEDNOSTKI[typ];
  if (d.era > S.era[strona]) return '🔒 Era ' + d.era;
  if (d.awans && !S.ul[strona][d.awans]) return '🔒 Najpierw: ' + ULEPSZENIA[d.awans].nazwa;
  if (d.bog && !bogMa(strona, d.bog)) return '🔒 Bóg: ' + BOGOWIE[d.bog].nazwa;
  if (d.bohater && (JED.some(u => u.strona === strona && u.typ === typ) || BUD.some(b => b.strona === strona && b.kolejka.some(q => q.rodzaj === 'j' && q.typ === typ)))) return 'Masz już tego bohatera';
  return null;
}
function brakUlepszenia(strona, id) {
  const d = ULEPSZENIA[id];
  if (S.ul[strona][id]) return 'gotowe';
  if (BUD.some(b => b.strona === strona && b.kolejka.some(q => q.rodzaj === 'u' && q.typ === id))) return 'w trakcie';
  if (d.era > S.era[strona]) return '🔒 Era ' + d.era;
  if (d.bog && !bogMa(strona, d.bog)) return '🔒 Bóg: ' + BOGOWIE[d.bog].nazwa;
  if (d.wymaga && !S.ul[strona][d.wymaga]) return '🔒 Najpierw: ' + ULEPSZENIA[d.wymaga].nazwa;
  if (d.awans) { const jl = JEDNOSTKI[d.awans]; const pop = Object.keys(JEDNOSTKI).find(t => JEDNOSTKI[t].linia === jl.linia && (JEDNOSTKI[t].st || 1) === jl.st - 1); if (pop && JEDNOSTKI[pop].era > S.era[strona]) return '🔒 Era ' + JEDNOSTKI[pop].era; }
  return null;
}
function brakEry(strona) {
  const nast = S.era[strona] + 1, d = NOWA_ERA[nast];
  if (!d) return 'max';
  if (BUD.some(b => b.strona === strona && b.kolejka.some(q => q.rodzaj === 'era'))) return 'w trakcie';
  const ma = budynkiDoEry(strona);
  if (ma < d.budynki) return `🔒 Potrzeba ${d.budynki} różnych budynków (masz ${ma}): spichlerz, drwalnia, Gontyna, Dwór drużyny…`;
  return null;
}
// dwaj bogowie do wyboru przy następnej erze (zależy od boga głównego)
function bogowieEry(strona) { const g = BOGOWIE[S.bogowie[strona][0]]; return (g && g.ery[S.era[strona] + 1]) || []; }
// czego brakuje do następnej ery (pusta lista = można)
function brakiEry(strona) {
  const ne = NOWA_ERA[S.era[strona] + 1]; if (!ne) return null;
  const l = [], ma = budynkiDoEry(strona);
  if (ma < ne.budynki) l.push(`${ne.budynki - ma} ${ne.budynki - ma === 1 ? 'innego budynku' : 'innych budynków'} (np. ${['spichlerz', 'tartak', 'gontyna', 'koszary', 'szopa', 'kopalnia', 'kuznia', 'strzelnica'].filter(t => !BUD.some(b => b.strona === strona && b.typ === t && b.gotowy) && !brakBudynku(strona, t)).slice(0, 2).map(t => BUDYNKI[t].nazwa).join(', ')})`);
  for (const [k, v] of Object.entries(ne.koszt)) if (S.zas[strona][k] < v) l.push(`${Math.ceil(v - S.zas[strona][k])} ${EMOJI_SUR[k]}`);
  if (!BUD.some(b => b.strona === strona && b.typ === 'ratusz' && b.gotowy)) l.push('gotowego Grodu');
  return l;
}
function dodajDoKolejki(b, rodzaj, typ) {
  if (b.kolejka.length >= 5) return 'Kolejka jest pełna';
  let koszt, czas;
  if (rodzaj === 'j') { typ = najwyzszy(b.strona, typ); if (brakJednostki(b.strona, typ)) return brakJednostki(b.strona, typ); koszt = JEDNOSTKI[typ].koszt; czas = JEDNOSTKI[typ].czas; }
  else if (rodzaj === 'u') { const br = brakUlepszenia(b.strona, typ); if (br) return br; koszt = ULEPSZENIA[typ].koszt; czas = ULEPSZENIA[typ].czas; }
  else if (rodzaj === 'rozb') { const br = brakRozbudowy(b); if (br) return br; const nast = WIEZA_POZIOMY[(b.poziom || 1) + 1]; koszt = nast.koszt; czas = nast.czas; typ = 'wieza'; }
  else {
    const br = brakEry(b.strona); if (br) return br;
    const opcje = bogowieEry(b.strona); if (!opcje.includes(typ)) typ = opcje[Math.floor(Math.random() * opcje.length)];
    koszt = NOWA_ERA[S.era[b.strona] + 1].koszt; czas = NOWA_ERA[S.era[b.strona] + 1].czas;
  }
  if (!zaplac(b.strona, koszt)) return 'Za mało surowców';
  b.kolejka.push({ rodzaj, typ, t: 0, czas, koszt });
  return null;
}
// gracz sam burzy swój budynek: wraca połowa kosztu (cały koszt, gdy budowa się jeszcze nie zaczęła) i to, co czekało w kolejce
function zburzWlasny(b) {
  if (b.typ === 'ratusz' && BUD.filter(o => o.strona === b.strona && o.typ === 'ratusz').length < 2) return 'To twój jedyny Gród: nie można go zburzyć';
  const czesc = !b.gotowy && b.postep < 0.02 ? 1 : 0.5;
  for (const s in b.d.koszt) S.zas[b.strona][s] += Math.floor(b.d.koszt[s] * czesc);
  for (const q of b.kolejka) oddaj(b.strona, q.koszt);
  zniszczBudynek(b, true);
  return null;
}
function anulujZKolejki(b, i) { const q = b.kolejka[i]; if (!q) return; oddaj(b.strona, q.koszt); b.kolejka.splice(i, 1); }
function wyjdzZBudynku(b, typ) {
  // wolna kratka przy budynku, najbliżej punktu zbiórki (albo środka mapy)
  const cel = b.zbiorka || { x: b.x * 0.8, z: b.z * 0.8 };
  let naj = -1, nd = Infinity;
  for (const c of celeBudynku(b)) if (c >= 0 && wolnaKom(c)) { const [x, z] = srodekKom(c), d = Math.hypot(x - cel.x, z - cel.z); if (d < nd) { nd = d; naj = c; } }
  if (naj < 0) naj = najblizszaWolna(kom(b.x, b.z), 8);
  if (naj < 0) return null;
  const [x, z] = srodekKom(naj);
  typ = najwyzszy(b.strona, typ);
  const u = nowaJednostka(b.strona, typ, x + losowo(-0.2, 0.2), z + losowo(-0.2, 0.2));
  S.stat[b.strona].wyszkoleni++;
  const zb = b.zbiorka;
  if (zb && zb.zid && ZAS.get(zb.zid) && typ === 'osadnik') rozkazZbieraj(u, ZAS.get(zb.zid));
  else if (zb && zb.bid && E.get(zb.bid) && typ === 'osadnik') { const c = E.get(zb.bid); c.gotowy ? (c.d.pole ? rozkazFarma(u, c) : c.d.gontyna ? rozkazModl(u, c) : rozkazIdz(u, zb.x, zb.z)) : rozkazBuduj(u, c); }
  else if (zb) rozkazIdz(u, zb.x + losowo(-1, 1), zb.z + losowo(-1, 1));
  else if (typ === 'osadnik' && b.strona === STRONA_GRACZA && !S.aiGracz) {
    // nowy osadnik sam idzie po to, czego jest najmniej (jagody albo drewno)
    const s = S.zas[b.strona].jagody <= S.zas[b.strona].drewno ? 'jagody' : 'drewno';
    const r = najblizszyZasob(s, b.x, b.z, 22) || najblizszyZasob(s === 'jagody' ? 'drewno' : 'jagody', b.x, b.z, 22);
    if (r) rozkazZbieraj(u, r);
  }
  return u;
}
function aktualizujBudynek(b, dt) {
  if (!b.gotowy) return;
  if (b.d.strzela) {
    b.cd -= dt;
    if (b.cd <= 0) {
      const st = strzalBud(b);
      let naj = null, nd = st.zasieg + b.w / 2;
      for (const e of JED) { if (!wrogowie(b.strona, e.strona)) continue; const d = Math.hypot(e.x - b.x, e.z - b.z); if (d < nd) { nd = d; naj = e; } }
      // ambona: gdy w zasięgu nie ma ludzi, strzela w budynki wroga (także w place budowy)
      if (!naj && b.typ === 'wieza') { let nb = st.zasieg; for (const o of BUD) { if (!wrogowie(b.strona, o.strona)) continue; const d = dystDoProst(b.x, b.z, o); if (d < nb) { nb = d; naj = o; } } }
      // Wrzący syrop: wróg tuż przy ambonie dostaje więcej
      const wrz = naj && !jestBudynkiem(naj) && b.typ === 'wieza' && S.ul[b.strona].wrzatek && nd < EFEKTY.wrzatekDyst + b.w / 2 ? EFEKTY.wrzatek : 1;
      if (naj) { rzut(b, naj, st.atak * wrz); b.cd = st.odstep; odglos('zamach', b.x, b.z, 0.4); } else b.cd = 0.4;
    }
  }
  const q = b.kolejka[0]; if (!q) return;
  if (q.rodzaj === 'j' && q.t >= q.czas) {
    if (ludnosc(b.strona) >= limitLudnosci(b.strona)) {
      q.czeka = true;
      if (b.strona === STRONA_GRACZA && !S.aiGracz && S.czas - (S.ostBrakDomu || -99) > 20) { S.ostBrakDomu = S.czas; toast('🏠 Brak miejsca: zbuduj dom'); dzwiek('blad'); }
      return;
    }
    q.czeka = false;
    wyjdzZBudynku(b, q.typ); b.kolejka.shift();
    if (b.strona === STRONA_GRACZA && !S.aiGracz) dzwiek('gotowe');
    return;
  }
  const ulB = S.ul[b.strona];
  q.t += dt * (q.rodzaj === 'j' && JEDNOSTKI[q.typ].wojsko && ulB.pobor ? EFEKTY.pobor : 1) * (q.rodzaj === 'j' && q.typ === 'osadnik' && ulB.jare_zboze ? 1.25 : 1) * (q.rodzaj === 'u' && b.typ === 'kuznia' && ulB.kuznia_swaroga ? 1.5 : 1);
  if (q.t >= q.czas && q.rodzaj !== 'j') {
    b.kolejka.shift();
    if (q.rodzaj === 'u') {
      S.ul[b.strona][q.typ] = true;
      if (ULEPSZENIA[q.typ].awans) awansuj(b.strona, ULEPSZENIA[q.typ].awans);
      // nowe mury: wszystkie palisady i bramy zmieniają się naraz (rany zostają)
      if (q.typ === 'mur_cegla' || q.typ === 'mur_stal') for (const o of BUD) if (o.strona === b.strona && (o.d.mur || o.d.brama)) {
        const ubyl = o.max - o.hp; o.max = maxHpBud(o.strona, o.typ); o.hp = Math.max(1, o.max - ubyl);
        o.mesh.geometry = MOD.budynek(modelBud(o.typ, 1, o.strona, o.zamk), o.strona);
      }
      // więcej życia budynków: rany zostają (plac budowy rośnie w tej samej proporcji)
      if (q.typ === 'murarze' || q.typ === 'budowniczowie' || q.typ === 'umocnienie') for (const o of BUD) if (o.strona === b.strona && !o.d.mur && !o.d.brama) {
        const nm = maxHpBud(o.strona, o.typ, o.poziom || 1); o.hp = o.gotowy ? Math.max(1, nm - (o.max - o.hp)) : o.hp * nm / o.max; o.max = nm;
      }
      if (q.typ === 'rekawice') for (const u of JED) if (u.strona === b.strona && u.typ === 'osadnik') { u.max = maxHpJ(u.strona, 'osadnik'); u.hp += 15; }
      przeliczZycie(b.strona);
      if (q.typ === 'swiety_zar') for (const o of BUD) if (o.strona === b.strona && o.typ === 'wieza') { const nm = maxHpBud(o.strona, o.typ, o.poziom || 1); o.hp = o.hp * nm / o.max; o.max = nm; }
      if (b.strona === STRONA_GRACZA && !S.aiGracz) { toast(ULEPSZENIA[q.typ].emoji + ' Ulepszone: ' + ULEPSZENIA[q.typ].nazwa); dzwiek('buduj'); odglos('ulepszenie'); }
    } else if (q.rodzaj === 'rozb') {
      // rozbudowa ambony: nowy wygląd, więcej życia (rany zostają), mocniejsze strzały
      const ubyl = b.max - b.hp; b.poziom = (b.poziom || 1) + 1; b.max = maxHpBud(b.strona, b.typ, b.poziom); b.hp = Math.max(1, b.max - ubyl);
      b.mesh.geometry = MOD.budynek(modelBud(b.typ, b.poziom), b.strona);
      if (b.pierscien) { scena.remove(b.pierscien); b.pierscien = null; }
      if (b.strona === STRONA_GRACZA && !S.aiGracz) { toast(emojiBud(b) + ' Rozbudowane: ' + nazwaBud(b)); dzwiek('buduj'); }
    } else if (q.rodzaj === 'era') {
      S.era[b.strona]++;
      const bg = BOGOWIE[q.typ];
      if (bg) { S.bogowie[b.strona].push(q.typ); S.moce[b.strona].push({ id: bg.moc, uzyta: false }); }
      przeliczZycie(b.strona); // bohaterowie rosną w siłę z każdą erą
      if (!S.aiGracz || b.strona !== STRONA_GRACZA) {
        if (b.strona === STRONA_GRACZA) { baner(`Era ${S.era[b.strona]}: ${ERY[S.era[b.strona]]}`, bg ? `${bg.emoji} ${bg.nazwa} daje ci moc ${MOCE[bg.moc].emoji} ${MOCE[bg.moc].nazwa} i stwora ${JEDNOSTKI[bg.stwor].emoji} ${JEDNOSTKI[bg.stwor].nazwa}` : 'Nowe budynki, wojsko i ulepszenia!'); dzwiek('era'); EF.fajerwerki(b.x, b.z); }
        else if (!S.aiGracz) toast(`${ZNAK_STRON[b.strona]} Komputer wszedł w erę ${S.era[b.strona]}: ${ERY[S.era[b.strona]]}${bg ? ' (' + bg.emoji + ' ' + bg.nazwa + ')' : ''}`);
      }
    }
  }
}

// ================= handel na Jarmarku =================
function ceny(strona) { if (!S.ceny) S.ceny = []; return S.ceny[strona] || (S.ceny[strona] = { ...HANDEL.ceny }); }
const cenaKupna = (strona, s) => Math.round(ceny(strona)[s] * (S.ul[strona].wagi ? EFEKTY.wagiKupno : 1));
const cenaSprzedazy = (strona, s) => Math.max(5, Math.round(ceny(strona)[s] * (S.ul[strona].wagi ? EFEKTY.wagiSprzedaz : HANDEL.sprzedaz)));
function handluj(strona, s, kupno) {
  if (!BUD.some(b => b.strona === strona && b.typ === 'jarmark' && b.gotowy)) return 'Najpierw zbuduj Targowisko';
  const z = S.zas[strona], c = ceny(strona);
  if (kupno) { const k = cenaKupna(strona, s); if (z.zloto < k) return 'Za mało srebra'; z.zloto -= k; z[s] += HANDEL.ilosc; c[s] *= 1 + HANDEL.zmiana; }
  else { if (z[s] < HANDEL.ilosc) return 'Za mało: ' + NAZWY_SUR[s]; z[s] -= HANDEL.ilosc; z.zloto += cenaSprzedazy(strona, s); c[s] = Math.max(HANDEL.ceny[s] * 0.4, c[s] * (1 - HANDEL.zmiana)); }
  return null;
}
// ceny powoli wracają do zwykłych
// Poborcy podatków: każdy Dworek sam przynosi złoto
function podatki(dt) {
  for (let s = 0; s < ileStron(); s++) if (S.ul[s] && S.ul[s].poborcy) {
    const ile = BUD.filter(b => b.strona === s && b.typ === 'ratusz' && b.gotowy).length * EFEKTY.podatek * dt;
    S.zas[s].zloto += ile; S.stat[s].zebrane += ile;
  }
}
function cenyWracaja(dt) { for (let s = 0; s < ileStron(); s++) { const c = ceny(s); for (const k in c) c[k] += (HANDEL.ceny[k] - c[k]) * Math.min(1, dt * 0.004); } }

// ================= moce bogów =================
// każda moc działa raz w grze; moce z celem trzeba wskazać na mapie (gracz: dotknięciem, komputer: sam wybiera)
let pokazMoce = false, trybMocy = null;
const WIDOK_CZAROW = []; // błyskawice, ogniste kule, aury (tylko wygląd, nie trafia do zapisu)
const GEO_PIORUN = new THREE.CylinderGeometry(0.09, 0.16, 26, 6).translate(0, 13, 0);
const MAT_PIORUN = new THREE.MeshBasicMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
const GEO_KULA_OGNIA = new THREE.SphereGeometry(1.1, 14, 10);
const MAT_KULA_OGNIA = new THREE.MeshBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
const GEO_AURA = new THREE.SphereGeometry(0.62, 12, 8).translate(0, 0.55, 0);
const MAT_LOD = new THREE.MeshBasicMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.55, depthWrite: false });
const MAT_ZGODA = new THREE.MeshBasicMaterial({ color: '#ffb3d9', transparent: true, opacity: 0.35, depthWrite: false });
const wrogiewOkolicy = (strona, x, z, r) => JED.filter(u => wrogowie(strona, u.strona) && Math.hypot(u.x - x, u.z - z) < r);
const wrogieBudynki = (strona, x, z, r) => BUD.filter(b => wrogowie(strona, b.strona) && dystDoProst(x, z, b) < r);
function piorun(strona, x, z) {
  const m = MOCE.grom;
  for (const u of wrogiewOkolicy(strona, x, z, 1.4)) zadaj(u, m.rana, null);
  for (const b of wrogieBudynki(strona, x, z, 1.2)) zadaj(b, m.ranaBud, null);
  if (!symulacja) {
    const mesh = new THREE.Mesh(GEO_PIORUN, MAT_PIORUN); mesh.position.set(x, 0, z); mesh.rotation.z = lo(-0.08, 0.08); scena.add(mesh);
    WIDOK_CZAROW.push({ mesh, t: 0, T: 0.22 });
    EF.iskry(x, 0.3, z, 14, '#dff2ff'); EF.kurz(x, z, 6, 1.6);
    if (!odglos('walenie', x, z, 0.8, 0)) dzwiek('zniszcz');
  }
}
function uzyjMocy(strona, id, x, z) {
  const lista = S.moce[strona], m = lista && lista.find(o => o.id === id && !o.uzyta), d = MOCE[id];
  if (!m || !d) return 'Tej mocy już nie masz';
  m.uzyta = true;
  const gr = BUD.find(b => b.strona === strona && b.typ === 'ratusz');
  if (x == null && gr) { x = gr.x; z = gr.z; }
  const graczWidzi = !S.aiGracz || strona !== STRONA_GRACZA;
  if (id === 'grom') S.czary.push({ typ: 'grom', strona, x, z, ile: d.piorunow, nast: 0 });
  else if (id === 'czady') S.czary.push({ typ: 'czady', strona, x, z, koniec: S.czas + d.czas });
  else if (id === 'ogien') S.czary.push({ typ: 'ogien', strona, x, z, t: 0 });
  else if (id === 'slonce') S.buff[strona].slonce = S.czas + d.czas;
  else if (id === 'swietyOgien') S.buff[strona].ogien = S.czas + d.czas;
  else if (id === 'urodzaj') oddaj(strona, d.dar);
  else if (id === 'wiosna') {
    for (const u of JED) if (u.strona === strona) u.hp = u.max;
    for (const b of BUD) if (b.strona === strona && b.gotowy) b.hp = Math.min(b.max, b.hp + b.max * 0.5);
  } else if (id === 'wichura') {
    for (const u of wrogiewOkolicy(strona, x, z, d.r)) {
      const dx = u.x - x, dz = u.z - z, l = Math.hypot(dx, dz) || 1, c = najblizszaWolna(kom(u.x + dx / l * d.odrzut, u.z + dz / l * d.odrzut), 4);
      if (c >= 0) { [u.x, u.z] = srodekKom(c); u.sciezka = null; }
      zadaj(u, d.rana, null);
    }
  } else if (id === 'zgoda') { for (const u of wrogiewOkolicy(strona, x, z, d.r)) { u.spokoj = S.czas + d.czas; stop(u); } }
  else if (id === 'mroz') { for (const u of wrogiewOkolicy(strona, x, z, d.r)) { u.zamarz = S.czas + d.czas; stop(u); zadaj(u, d.rana, null); } }
  else if (id === 'drzenie') { for (const b of wrogieBudynki(strona, x, z, d.r)) zadaj(b, b.max * d.czesc, null); }
  else if (id === 'rog') {
    for (let k = 0; k < d.ilu; k++) { const c = najblizszaWolna(kom(x + lo(-1.5, 1.5), z + lo(-1.5, 1.5)), 6); if (c >= 0) { const [ux, uz] = srodekKom(c); nowaJednostka(strona, d.jednostka, ux, uz); } }
  }
  if (!symulacja && graczWidzi) {
    // wygląd mocy
    if (id === 'wichura') for (let i = 0; i < 60; i++) { const a = lo(0, 6.283), r = lo(0.5, d.r); czastka(CZ_NORM, x + Math.cos(a) * r, lo(0.2, 2), z + Math.sin(a) * r, -Math.sin(a) * 4, lo(0.5, 2), Math.cos(a) * 4, lo(0.8, 1.6), 0.3, 1.2, 0.5, '#d8d2c4'); }
    if (id === 'mroz') for (let i = 0; i < 80; i++) czastka(CZ_SWIAT, x + lo(-d.r, d.r), lo(1, 6), z + lo(-d.r, d.r), lo(-0.3, 0.3), lo(-1.5, -0.6), lo(-0.3, 0.3), lo(1.5, 3), 0.18, 0.08, 1, '#e8f6ff');
    if (id === 'zgoda') for (let i = 0; i < 50; i++) czastka(CZ_SWIAT, x + lo(-d.r, d.r), lo(0.2, 1.5), z + lo(-d.r, d.r), 0, lo(0.4, 1.2), 0, lo(1.5, 3), 0.25, 0.1, 1, Math.random() < 0.5 ? '#ff9ccc' : '#fff0a8');
    if (id === 'drzenie') { for (let i = 0; i < 90; i++) czastka(CZ_NORM, x + lo(-d.r, d.r), 0.1, z + lo(-d.r, d.r), lo(-0.6, 0.6), lo(0.2, 1.2), lo(-0.6, 0.6), lo(1, 2.2), 0.4, 1.6, 0.5, '#9a8a70'); odglos('walenie', x, z, 1.4, 0); }
    if (id === 'wiosna' || id === 'urodzaj' || id === 'slonce' || id === 'swietyOgien') { EF.zloto(x, 2, z); EF.fajerwerki(x, z); }
    if (id === 'rog') EF.zloto(x, 1, z);
    if (strona === STRONA_GRACZA) { baner(`${d.emoji} ${d.nazwa}`, d.opis); dzwiek('era'); }
    else if (!S.aiGracz) { toast(`${ZNAK_STRON[strona]} Komputer użył mocy: ${d.emoji} ${d.nazwa}`); dzwiek('alarm'); ping = { x, z, t: 3 }; }
  }
  if (strona === STRONA_GRACZA) S.pomoc.moc = true;
  return null;
}
// moce działające przez chwilę (pioruny, dym, ogień z nieba)
function krokCzarow(dt) {
  for (let i = S.czary.length - 1; i >= 0; i--) {
    const c = S.czary[i], d = MOCE[c.typ];
    if (c.typ === 'grom') {
      c.nast -= dt;
      if (c.nast <= 0) { c.nast = 0.3; c.ile--; const a = lo(0, 6.283), r = Math.sqrt(Math.random()) * d.r; piorun(c.strona, c.x + Math.cos(a) * r, c.z + Math.sin(a) * r); }
      if (c.ile <= 0) S.czary.splice(i, 1);
    } else if (c.typ === 'czady') {
      for (const u of wrogiewOkolicy(c.strona, c.x, c.z, d.r)) zadaj(u, d.naSek * dt, null);
      if (!symulacja && Math.random() < 0.6) for (let k = 0; k < 3; k++) czastka(CZ_NORM, c.x + lo(-d.r, d.r) * 0.8, lo(0.1, 0.6), c.z + lo(-d.r, d.r) * 0.8, lo(-0.2, 0.2), lo(0.1, 0.4), lo(-0.2, 0.2), lo(2, 3.5), 0.8, 2.4, 0.45, Math.random() < 0.5 ? '#6f7a5a' : '#4f5640');
      if (S.czas > c.koniec) S.czary.splice(i, 1);
    } else if (c.typ === 'ogien') {
      if (!c.t && !symulacja) { const mesh = new THREE.Mesh(GEO_KULA_OGNIA, MAT_KULA_OGNIA); scena.add(mesh); WIDOK_CZAROW.push({ mesh, t: 0, T: 1.4, spada: [c.x, c.z] }); }
      c.t += dt;
      if (!symulacja && Math.random() < 0.8) EF.ogien(c.x + (1.4 - c.t) * 6, (1.4 - c.t) * 18, c.z);
      if (c.t >= 1.4) {
        for (const b of wrogieBudynki(c.strona, c.x, c.z, d.r)) zadaj(b, d.ranaBud, null);
        for (const u of wrogiewOkolicy(c.strona, c.x, c.z, d.r)) zadaj(u, d.rana, null);
        if (!symulacja) { for (let k = 0; k < 40; k++) EF.ogien(c.x + lo(-d.r, d.r) * 0.7, lo(0, 1.5), c.z + lo(-d.r, d.r) * 0.7); EF.iskry(c.x, 1, c.z, 30, '#ffb347'); EF.kurz(c.x, c.z, 16, 3); odglos('walenie', c.x, c.z, 1.5, 0); }
        S.czary.splice(i, 1);
      }
    }
  }
}
// wygląd: błyskawice gasną, ognista kula spada, zamrożeni są w lodzie, uspokojeni w różowej mgiełce
function rysujCzary(dt) {
  for (let i = WIDOK_CZAROW.length - 1; i >= 0; i--) {
    const w = WIDOK_CZAROW[i]; w.t += dt;
    if (w.spada) { const f = Math.min(1, w.t / w.T); w.mesh.position.set(w.spada[0] + (1 - f) * 6, (1 - f) * 18 + 0.5, w.spada[1]); }
    else w.mesh.material.opacity = 0.95;
    if (w.t >= w.T) { scena.remove(w.mesh); WIDOK_CZAROW.splice(i, 1); }
  }
  for (const u of JED) {
    const st = u.zamarz > S.czas ? 'lod' : u.spokoj > S.czas ? 'zgoda' : null;
    if (st !== (u.aura ? u.aura.userData.st : null)) {
      if (u.aura) { u.mesh.remove(u.aura); u.aura = null; }
      if (st) { u.aura = new THREE.Mesh(GEO_AURA, st === 'lod' ? MAT_LOD : MAT_ZGODA); u.aura.userData.st = st; u.aura.scale.setScalar(Math.max(1, u.d.r / 0.36)); u.mesh.add(u.aura); }
    }
  }
}

// ================= przeciwnik komputerowy =================
const UDZIALY = [null, { jagody: 0.52, drewno: 0.36, zelazo: 0.06, kamien: 0.06, zloto: 0 }, { jagody: 0.4, drewno: 0.3, zelazo: 0.17, kamien: 0.07, zloto: 0.06 },
  { jagody: 0.4, drewno: 0.3, zelazo: 0.16, kamien: 0.06, zloto: 0.08 }, { jagody: 0.4, drewno: 0.3, zelazo: 0.15, kamien: 0.05, zloto: 0.1 }];
function nowyAI() { return { t: 0, fala: 0, nastAtak: null, ostBudowa: -99 }; }
function aiMiejsce(typ, cx, cz, rMin, rMax, margines = 1, unikaj = null) {
  const w = BUDYNKI[typ].w, ci = Math.round(cx + POL - w / 2), cj = Math.round(cz + POL - w / 2);
  for (let r = rMin; r <= rMax; r++) {
    const kand = [];
    for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) === r) kand.push([i, j]);
    kand.sort((a, b) => ((a[0] * 7 + a[1] * 13 + Math.floor(S.czas)) % 17) - ((b[0] * 7 + b[1] * 13 + Math.floor(S.czas)) % 17));
    for (const [i, j] of kand) {
      if (!miejsceWolne(typ, i, j, margines)) continue;
      if (unikaj) { const x = i - POL + w / 2, z = j - POL + w / 2; if (Math.hypot(x - unikaj.x, z - unikaj.z) < unikaj.r) continue; }
      return [i, j];
    }
  }
  return null;
}
function aiPostaw(strona, typ, miejsce, osadnicy) {
  if (!miejsce) return null;
  // po stracie budynku komputer czeka (dom 30 s, reszta 75 s) i nie stawia nic tam, gdzie stoi wrogie wojsko
  const A = S.ai[strona], kiedy = A.stracone && A.stracone[typ];
  if (kiedy != null && S.czas - kiedy < (typ === 'dom' ? 30 : 75)) return null;
  const mx = miejsce[0] - POL + BUDYNKI[typ].w / 2, mz = miejsce[1] - POL + BUDYNKI[typ].w / 2;
  if (JED.some(e => wrogowie(strona, e.strona) && e.d.wojsko && Math.hypot(e.x - mx, e.z - mz) < 12)) return null;
  if (!zaplac(strona, BUDYNKI[typ].koszt)) return null;
  const b = nowyBudynek(strona, typ, miejsce[0], miejsce[1]);
  const wolni = osadnicy.filter(o => !o.zad || o.zad.typ === 'zbieraj' && o.zad.sur !== 'zelazo').sort((a, c) => dyst(a, b) - dyst(c, b));
  for (const o of wolni.slice(0, b.w >= 3 ? 2 : 1)) rozkazBuduj(o, b);
  return b;
}
// najbliższy wrogi Dworek (a gdy go nie ma, najbliższy wrogi budynek)
function najblizszyWrog(strona, od) {
  let naj = null, nd = Infinity, najB = null, ndB = Infinity;
  for (const b of BUD) {
    if (!wrogowie(strona, b.strona)) continue;
    const d = dyst(b, od);
    if (b.typ === 'ratusz' && d < nd) { nd = d; naj = b; }
    if (d < ndB) { ndB = d; najB = b; }
  }
  return naj || najB;
}
// cel fali ataku: losowo jeden z wrogich Dworków, bliższe częściej (przy kilku komputerach nie idą wszyscy na gracza)
function celAtaku(strona, od) {
  const L = BUD.filter(b => b.typ === 'ratusz' && wrogowie(strona, b.strona));
  if (L.length < 2) return L[0] || null;
  const w = L.map(b => 1 / Math.max(1, dyst(b, od)) ** 2), suma = w.reduce((a, b) => a + b, 0);
  let x = Math.random() * suma; for (let i = 0; i < L.length; i++) { x -= w[i]; if (x <= 0) return L[i]; }
  return L[L.length - 1];
}
function ai(strona, dt) {
  const A = S.ai[strona]; A.t -= dt; if (A.t > 0) return; A.t = 1;
  const T = TRUDNOSC[trudnoscStrony(strona)];
  const moje = BUD.filter(b => b.strona === strona);
  const ratusz = moje.find(b => b.typ === 'ratusz' && b.gotowy);
  if (!ratusz) return;
  const ludzie = JED.filter(u => u.strona === strona), osadnicy = ludzie.filter(u => u.typ === 'osadnik'), wojsko = ludzie.filter(u => u.d.wojsko);
  const zas = S.zas[strona], era = S.era[strona], ma = t => moje.some(b => b.typ === t), maG = t => moje.some(b => b.typ === t && b.gotowy);
  const budowane = moje.filter(b => !b.gotowy), lud = ludzie.length, limit = limitLudnosci(strona);
  const wrogi = najblizszyWrog(strona, ratusz);
  const kier = wrogi ? [(wrogi.x - ratusz.x) / dyst(wrogi, ratusz), (wrogi.z - ratusz.z) / dyst(wrogi, ratusz)] : [0, 0];
  if (A.nastAtak == null) A.nastAtak = T.pierwszyAtak;
  // rezerwa na nową erę
  const nastEra = NOWA_ERA[era + 1], celOs = T.osadnicy[era];
  const oszczedza = nastEra && osadnicy.length >= celOs - 3 && budynkiDoEry(strona) >= nastEra.budynki;
  const rez = oszczedza ? nastEra.koszt : {};
  const stacR = k => Object.entries(k).every(([s, v]) => zas[s] >= v + (rez[s] || 0));

  // 1. obrona: wrogowie blisko bazy
  let groz = null, gd = 20;
  for (const e of JED) if (wrogowie(strona, e.strona) && (e.d.wojsko || e.typ === 'osadnik' && dyst(e, ratusz) < 10)) { const d = dyst(e, ratusz); if (d < gd) { gd = d; groz = e; } }
  if (groz) {
    for (const w of wojsko) if (!w.zad || w.zad.typ !== 'atakuj') { const c = celWalki(w, 30, false) || groz; if (!w.d.tylkoBudynki) rozkazAtak(w, c); }
    if (!wojsko.length && gd < 8) for (const o of osadnicy) if (dyst(o, groz) < 6 && (!o.zad || o.zad.typ !== 'atakuj')) rozkazAtak(o, groz);
  }

  aiMoce(strona, A, groz, wojsko, osadnicy);
  // 2. budowniczowie
  for (const b of budowane) {
    const ilu = osadnicy.filter(o => o.zad && o.zad.typ === 'buduj' && o.zad.bid === b.id).length;
    if (ilu < (b.w >= 3 ? 2 : 1)) {
      const o = osadnicy.filter(o => !o.zad || o.zad.typ === 'zbieraj' && o.zad.sur !== 'zelazo').sort((a, c) => dyst(a, b) - dyst(c, b))[0];
      if (o) rozkazBuduj(o, b);
    }
  }
  // 3. bezczynni osadnicy do pracy (tam, gdzie brakuje rąk)
  const licz = { jagody: 0, drewno: 0, kamien: 0, zelazo: 0, zloto: 0 };
  for (const o of osadnicy) if (o.zad && o.zad.typ === 'zbieraj') licz[o.zad.sur]++; else if (o.zad && o.zad.typ === 'farma') licz.jagody++;
  const udzial = UDZIALY[era];
  // czego jest dużo w zapasie, tam mniej ludzi
  const brak = s => udzial[s] * osadnicy.length - licz[s] - (zas[s] > 1000 ? 5 : zas[s] > 600 ? 2.5 : zas[s] > 400 ? 1 : 0);
  for (const o of osadnicy) {
    if (o.zad) continue;
    const kolej = [...SUROWCE].sort((a, b) => brak(b) - brak(a));
    for (const s of kolej) {
      const skup = najblizszySkup(strona, s, ratusz.x, ratusz.z) || ratusz;
      if (s === 'jagody') {
        const r = najblizszyZasob('jagody', skup.x, skup.z, 26);
        if (r) { rozkazZbieraj(o, r); licz.jagody++; break; }
        const pole = moje.find(b => b.d.pole && b.gotowy && wolnePole(b));
        if (pole) { rozkazFarma(o, pole); licz.jagody++; break; }
        // krzaki się skończyły: najpierw spichlerz (pola stoją tylko przy nim)
        if (!maG('spichlerz')) {
          const sp = budowane.find(b => b.typ === 'spichlerz') || (stac(strona, BUDYNKI.spichlerz.koszt) ? aiPostaw(strona, 'spichlerz', aiMiejsce('spichlerz', ratusz.x, ratusz.z, 4, 12, 1, { x: ratusz.x, z: ratusz.z, r: 4.5 }), []) : null);
          if (sp) { if (!budowane.includes(sp)) budowane.push(sp); rozkazBuduj(o, sp); licz.jagody++; break; }
          continue;
        }
        const budowanePole = budowane.find(b => b.d.pole);
        if (budowanePole) { rozkazBuduj(o, budowanePole); licz.jagody++; break; }
        if (stac(strona, BUDYNKI.pole.koszt)) {
          const sp = moje.find(b => b.typ === 'spichlerz' && b.gotowy);
          const b = aiPostaw(strona, 'pole', aiMiejsce('pole', sp.x, sp.z, 2, 9, 0), []);
          if (b) { rozkazBuduj(o, b); licz.jagody++; break; }
        }
        continue;
      }
      const r = najblizszyZasob(s, skup.x, skup.z, 90);
      if (r) { rozkazZbieraj(o, r); licz[s]++; break; }
    }
  }
  // przesunięcie jednego osadnika, gdy czegoś bardzo brakuje
  const najwiecej = [...SUROWCE].sort((a, b) => brak(a) - brak(b))[0], najmniej = [...SUROWCE].sort((a, b) => brak(b) - brak(a))[0];
  if (brak(najmniej) > 1.5 && brak(najwiecej) < -1.5) {
    const o = osadnicy.find(o => o.zad && o.zad.typ === 'zbieraj' && o.zad.sur === najwiecej && o.niesie.ile < 2);
    const skup = najblizszySkup(strona, najmniej, ratusz.x, ratusz.z) || ratusz;
    const r = najmniej !== 'jagody' || najblizszyZasob('jagody', skup.x, skup.z, 26) ? najblizszyZasob(najmniej, skup.x, skup.z, 90) : null;
    if (o && r) rozkazZbieraj(o, r);
    else if (o && najmniej === 'jagody') stop(o); // bez krzaków: osadnik staje i za chwilę idzie na pole (albo je zbuduje)
  }

  // 3a. modlitwa w Gontynie (łaska na stwory)
  const gont = moje.find(b => b.typ === 'gontyna' && b.gotowy);
  if (gont) {
    const modla = osadnicy.filter(o => o.zad && o.zad.typ === 'modl');
    const celM = Math.min(LASKA.modlacychNaGontyne, [0, 2, 3, 5, 6][era]);
    if (modla.length < celM && osadnicy.length >= 8 && zas.laska < LASKA.maks - 20) {
      const o = osadnicy.find(o => !o.zad) || osadnicy.find(o => o.zad && o.zad.typ === 'zbieraj' && o.zad.sur === 'drewno' && o.niesie.ile < 2);
      if (o) rozkazModl(o, gont);
    } else if (modla.length > celM || zas.laska >= LASKA.maks - 5 && modla.length) stop(modla[0]);
  }
  // 4. szkolenie osadników
  const kolejkaOs = ratusz.kolejka.filter(q => q.rodzaj === 'j').length;
  if (osadnicy.length + kolejkaOs < celOs && ratusz.kolejka.length < 2 && !ratusz.kolejka.some(q => q.rodzaj === 'era') && lud < limit && stacR(JEDNOSTKI.osadnik.koszt)) dodajDoKolejki(ratusz, 'j', 'osadnik');
  // 4a. bohaterowie (po jednym)
  if (era >= 2 && !ratusz.kolejka.length && lud < limit) for (const t of ['krak', 'waligora', 'lech']) if (!brakJednostki(strona, t) && stacR(JEDNOSTKI[t].koszt)) { dodajDoKolejki(ratusz, 'j', t); break; }
  // 5. domy
  if (limit < MAKS_LUDNOSC && limit - lud <= 2 + era && budowane.filter(b => b.typ === 'dom').length < (lud > 30 ? 2 : 1) && stac(strona, BUDYNKI.dom.koszt)) {
    aiPostaw(strona, 'dom', aiMiejsce('dom', ratusz.x, ratusz.z, 5, 16, 1), osadnicy);
  }
  // 6. miejsca do odnoszenia surowców blisko pracy
  const potrzebaSkupu = (typ, sur, minLudzi) => {
    if (brakBudynku(strona, typ) || budowane.some(b => b.typ === typ) || licz[sur] < minLudzi || !stacR(BUDYNKI[typ].koszt)) return;
    const r = najblizszyZasob(sur, ratusz.x, ratusz.z, 80); if (!r) return;
    const skup = najblizszySkup(strona, sur, r.x, r.z);
    if (skup && dystDoProst(r.x, r.z, skup) < 7) return;
    aiPostaw(strona, typ, aiMiejsce(typ, r.x, r.z, 2, 6, 1), osadnicy);
  };
  potrzebaSkupu('tartak', 'drewno', 3);
  potrzebaSkupu('spichlerz', 'jagody', 3);
  potrzebaSkupu('kopalnia', 'zelazo', 2);
  potrzebaSkupu('szopa', 'kamien', 2);
  // 7. koszary i budynki kolejnych er
  const unik = { x: ratusz.x, z: ratusz.z, r: 4.5 };
  const postawRaz = (typ, warunek = true) => { if (warunek && !ma(typ) && !brakBudynku(strona, typ) && stacR(BUDYNKI[typ].koszt)) aiPostaw(strona, typ, aiMiejsce(typ, ratusz.x + kier[0] * 6, ratusz.z + kier[1] * 6, 2, 14, 1, unik), osadnicy); };
  postawRaz('koszary', osadnicy.length >= 10);
  postawRaz('gontyna', osadnicy.length >= 9 && maG('koszary'));
  if (era >= 2) {
    postawRaz('kuznia'); postawRaz('strzelnica'); postawRaz('stajnia', maG('kuznia'));
    if (!ma('kopalnia')) { const r = najblizszyZasob('zelazo', ratusz.x, ratusz.z, 80); if (r && stacR(BUDYNKI.kopalnia.koszt)) aiPostaw(strona, 'kopalnia', aiMiejsce('kopalnia', r.x, r.z, 2, 6, 1), osadnicy); }
  }
  if (era >= 3) postawRaz('warsztat');
  const wieze = moje.filter(b => b.typ === 'wieza').length;
  if (era >= 2 && wieze < T.wieze && osadnicy.length >= celOs - 4 && stacR(BUDYNKI.wieza.koszt) && !budowane.some(b => b.typ === 'wieza'))
    aiPostaw(strona, 'wieza', aiMiejsce('wieza', ratusz.x + kier[0] * (8 + wieze * 2) - kier[1] * (wieze - 1) * 5, ratusz.z + kier[1] * (8 + wieze * 2) + kier[0] * (wieze - 1) * 5, 0, 5, 1), osadnicy);
  // 7a. Jarmark (daleko od Dworku, w stronę od wroga) i wozy kupieckie; sprzedaż nadmiaru za złoto
  if (era >= 2 && !ma('jarmark') && osadnicy.length >= celOs - 6 && stacR(BUDYNKI.jarmark.koszt))
    aiPostaw(strona, 'jarmark', aiMiejsce('jarmark', ratusz.x - kier[0] * 13, ratusz.z - kier[1] * 13, 0, 9, 1), osadnicy);
  const jar = moje.find(b => b.typ === 'jarmark' && b.gotowy);
  if (jar) {
    const wozy = ludzie.filter(u => u.d.kupiec).length + jar.kolejka.length;
    if (wozy < 3 && lud < limit && !jar.kolejka.length && stacR(JEDNOSTKI.woz.koszt)) dodajDoKolejki(jar, 'j', 'woz');
    // nadmiar sprzedaje za złoto, a gdy brakuje jagód (jedzenia dla wojska), dokupuje je za złoto
    for (const s of ['zelazo', 'drewno', 'kamien', 'jagody']) if (zas[s] > (s === 'jagody' ? 1400 : 900) && zas.zloto < 800) { handluj(strona, s, false); break; }
    if (zas.jagody < 300 && zas.zloto >= cenaKupna(strona, 'jagody')) handluj(strona, 'jagody', true);
    // żelaza bywa mało (złoża się kończą): dokupuje je za złoto, żeby robić lepsze wojsko i ulepszenia
    else if (zas.zelazo < 400 && zas.zloto >= cenaKupna(strona, 'zelazo') + 150) handluj(strona, 'zelazo', true);
  }
  // 7b. rozbudowa ambon
  for (const w of moje) if (w.typ === 'wieza' && w.gotowy && !w.kolejka.length && !brakRozbudowy(w) && stacR(WIEZA_POZIOMY[(w.poziom || 1) + 1].koszt)) { dodajDoKolejki(w, 'rozb'); break; }
  // 8. nowa era
  if (oszczedza && !ratusz.kolejka.length && !brakEry(strona) && stac(strona, nastEra.koszt)) { const op = bogowieEry(strona); dodajDoKolejki(ratusz, 'era', op[Math.floor(Math.random() * op.length)]); }
  // 9. ulepszenia
  for (const id of ['kosz', 'plecak1', 'rekawice', 'deski', 'sciolka', 'kilof', 'taczka', 'siekiera_z', 'kilof_z', 'bron1', 'zbroja1', 'pociski1', 'aw_tarczownik', 'aw_procarz2', 'nawadnianie',
    'pobor', 'blanki', 'murarze', 'monety', 'umocnienie', 'bartnictwo', 'stada_welesa', 'topor_peruna', 'kuznia_swaroga', 'tarcze1',
    'zlote_piora', 'dar_slonca', 'prastary_leszy', 'len_mokoszy', 'wilcza_wataha', 'jare_zboze',
    'wozek', 'pila', 'bron2', 'zbroja2', 'pociski2', 'aw_obronca', 'plecak2', 'aw_pikinier', 'aw_kusznik', 'szyb', 'ogniste', 'budowniczowie', 'inzynierowie', 'lunety', 'wrzatek', 'tarcze2', 'balistyka',
    'gradowe_chmury', 'wiatr_w_plecy', 'ognisty_oddech', 'swiety_zar', 'piesn_rusalek', 'kupala',
    'plecak3', 'aw_jezdziec', 'mrozoodporne', 'zaprzeg', 'poborcy', 'wagi', 'bron3', 'zbroja3', 'pociski3', 'aw_rycerz', 'tarcze3', 'mistrz_piechoty', 'mistrz_strzelcow', 'mistrz_jazdy',
    'wrozba_konia', 'arkonska_druzyna', 'upiorna_noc', 'zimowe_futra', 'bies_z_nawii', 'trzy_swiaty']) {
    const d = ULEPSZENIA[id], b = moje.find(o => o.typ === d.z && o.gotowy && !o.kolejka.length);
    if (b && !brakUlepszenia(strona, id) && stacR(d.koszt) && (osadnicy.length >= celOs - 6 || era > 1)) { dodajDoKolejki(b, 'u', id); break; }
  }
  // 10. wojsko
  const zbior = { x: ratusz.x + kier[0] * 8, z: ratusz.z + kier[1] * 8 };
  for (const b of moje) {
    if (!b.gotowy || b.kolejka.length >= 2 || !['koszary', 'strzelnica', 'stajnia', 'warsztat', 'gontyna'].includes(b.typ)) continue;
    b.zbiorka = zbior;
    const mozna = typyBudynku(strona, b.typ).filter(t => !brakJednostki(strona, t));
    const typ = mozna[Math.floor(Math.random() * mozna.length)];
    if (typ && lud < limit && (osadnicy.length >= celOs - 4 || zas.jagody > 400) && stacR(JEDNOSTKI[typ].koszt)) dodajDoKolejki(b, 'j', typ);
  }
  // 11. atak na wroga
  const gotowi = wojsko.filter(w => !w.zad || w.zad.typ === 'idz');
  if (wrogi && S.czas >= A.nastAtak && !groz && gotowi.length >= Math.min(30, T.fala(A.fala))) {
    // na łatwym poziomie komputer nie wysyła całego wojska naraz
    const wyslij = T.maksFala ? gotowi.slice(0, T.maksFala(A.fala)) : gotowi;
    const cel = celAtaku(strona, ratusz) || wrogi;
    for (const w of wyslij) rozkazNaprzod(w, cel.x, cel.z);
    A.fala++; A.nastAtak = S.czas + T.odstep; A.celAtaku = { x: cel.x, z: cel.z, t: S.czas };
    if (cel.strona === STRONA_GRACZA && strona !== STRONA_GRACZA && !S.aiGracz) { toast(`${ZNAK_STRON[strona]} Wojsko komputera rusza na twoją osadę!`); dzwiek('alarm'); }
  }
}

// komputer używa mocy bogów: gospodarcze od razu, bojowe przy obronie albo gdy jego wojsko dociera do celu ataku
function aiMoce(strona, A, groz, wojsko, osadnicy) {
  if (S.czas - (A.mocT || -999) < 45) return;
  const wolne = (S.moce[strona] || []).filter(m => !m.uzyta); if (!wolne.length) return;
  const atak = A.celAtaku && S.czas - A.celAtaku.t < 150 ? A.celAtaku : null;
  const blisko = atak && wojsko.filter(w => Math.hypot(w.x - atak.x, w.z - atak.z) < 14).length >= 4;
  let cel = null;
  for (const m of wolne) {
    const d = MOCE[m.id];
    if (m.id === 'slonce') { if (osadnicy.length >= 16) cel = [m.id]; }
    else if (m.id === 'urodzaj') { if (S.era[strona] >= 2) cel = [m.id]; }
    else if (m.id === 'wiosna') { const rany = wojsko.reduce((a, u) => a + (u.max - u.hp), 0); if (rany > 600) cel = [m.id]; }
    else if (m.id === 'swietyOgien') { if (blisko || groz && wojsko.length >= 8) cel = [m.id]; }
    else if (m.id === 'ogien' || m.id === 'drzenie') { if (blisko) { const b = wrogieBudynki(strona, atak.x, atak.z, 10).sort((a, c) => c.max - a.max)[0]; if (b) cel = [m.id, b.x, b.z]; } }
    else if (m.id === 'rog') { if (groz) cel = [m.id, groz.x, groz.z]; else if (blisko) cel = [m.id, atak.x, atak.z]; }
    else if (d.cel) {
      // pioruny, dym, wichura, zgoda, mróz: tam, gdzie stoi najwięcej wrogiego wojska
      const srodek = groz || (blisko ? atak : null);
      if (srodek) { const ludzie = wrogiewOkolicy(strona, srodek.x, srodek.z, 12).filter(u => u.d.wojsko); if (ludzie.length >= 5) { const sx = ludzie.reduce((a, u) => a + u.x, 0) / ludzie.length, sz = ludzie.reduce((a, u) => a + u.z, 0) / ludzie.length; cel = [m.id, sx, sz]; } }
    }
    if (cel) break;
  }
  if (cel) { uzyjMocy(strona, cel[0], cel[1], cel[2]); A.mocT = S.czas; }
}

// ================= efekty: dym, ogień, kurz, iskry, wióry =================
const MAKS_CZ = 2400;
function systemCzastek(addytywny) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(MAKS_CZ * 3), 3));
  g.setAttribute('aKolor', new THREE.Float32BufferAttribute(new Float32Array(MAKS_CZ * 3), 3));
  g.setAttribute('aRozm', new THREE.Float32BufferAttribute(new Float32Array(MAKS_CZ), 1));
  g.setAttribute('aAlfa', new THREE.Float32BufferAttribute(new Float32Array(MAKS_CZ), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSkala: { value: 600 } }, transparent: true, depthWrite: false, blending: addytywny ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `attribute vec3 aKolor; attribute float aRozm; attribute float aAlfa; uniform float uSkala; varying vec3 vK; varying float vA;
      void main() { vK = aKolor; vA = aAlfa; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aRozm * uSkala / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vK; varying float vA; void main() { vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; gl_FragColor = vec4(vK, vA * smoothstep(0.5, 0.12, d)); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 5;
  return { pts, g, n: 0, x: new Float32Array(MAKS_CZ * 3), v: new Float32Array(MAKS_CZ * 3), t: new Float32Array(MAKS_CZ), T: new Float32Array(MAKS_CZ),
    r0: new Float32Array(MAKS_CZ), r1: new Float32Array(MAKS_CZ), a0: new Float32Array(MAKS_CZ), k: new Float32Array(MAKS_CZ * 3), gr: new Float32Array(MAKS_CZ) };
}
const CZ_NORM = systemCzastek(false), CZ_SWIAT = systemCzastek(true);
const KOL = new THREE.Color();
// jedna cząstka: miejsce, prędkość, czas życia, rozmiar od-do, przezroczystość, kolor, grawitacja
function czastka(sys, x, y, z, vx, vy, vz, T, r0, r1, a0, kolor, gr = 0) {
  if (symulacja || sys.n >= MAKS_CZ) return;
  const i = sys.n++; KOL.set(kolor);
  sys.x[i * 3] = x; sys.x[i * 3 + 1] = y; sys.x[i * 3 + 2] = z; sys.v[i * 3] = vx; sys.v[i * 3 + 1] = vy; sys.v[i * 3 + 2] = vz;
  sys.t[i] = 0; sys.T[i] = T; sys.r0[i] = r0; sys.r1[i] = r1; sys.a0[i] = a0; sys.k[i * 3] = KOL.r; sys.k[i * 3 + 1] = KOL.g; sys.k[i * 3 + 2] = KOL.b; sys.gr[i] = gr;
}
function aktualizujCzastki(sys, dt) {
  const P = sys.g.attributes.position.array, K = sys.g.attributes.aKolor.array, R = sys.g.attributes.aRozm.array, A = sys.g.attributes.aAlfa.array;
  for (let i = 0; i < sys.n; i++) {
    sys.t[i] += dt;
    if (sys.t[i] >= sys.T[i]) { // zamiana z ostatnią
      const j = --sys.n; if (i !== j) { for (const tab of [sys.x, sys.v, sys.k]) for (let q = 0; q < 3; q++) tab[i * 3 + q] = tab[j * 3 + q]; for (const tab of [sys.t, sys.T, sys.r0, sys.r1, sys.a0, sys.gr]) tab[i] = tab[j]; }
      i--; continue;
    }
    sys.v[i * 3 + 1] -= sys.gr[i] * dt;
    for (let q = 0; q < 3; q++) sys.x[i * 3 + q] += sys.v[i * 3 + q] * dt;
    if (sys.gr[i] > 0 && sys.x[i * 3 + 1] < 0.03) { sys.x[i * 3 + 1] = 0.03; sys.v[i * 3] *= 0.5; sys.v[i * 3 + 2] *= 0.5; sys.v[i * 3 + 1] = 0; }
  }
  for (let i = 0; i < sys.n; i++) {
    const f = sys.t[i] / sys.T[i];
    P[i * 3] = sys.x[i * 3]; P[i * 3 + 1] = sys.x[i * 3 + 1]; P[i * 3 + 2] = sys.x[i * 3 + 2];
    K[i * 3] = sys.k[i * 3]; K[i * 3 + 1] = sys.k[i * 3 + 1]; K[i * 3 + 2] = sys.k[i * 3 + 2];
    R[i] = sys.r0[i] + (sys.r1[i] - sys.r0[i]) * f; A[i] = sys.a0[i] * Math.min(1, f * 6) * (1 - f);
  }
  sys.g.setDrawRange(0, sys.n);
  for (const n of ['position', 'aKolor', 'aRozm', 'aAlfa']) sys.g.attributes[n].needsUpdate = true;
}
const lo = (a, b) => a + Math.random() * (b - a);
const EF = {
  dym(x, y, z, ciemny = false, s = 1) { czastka(CZ_NORM, x + lo(-0.1, 0.1), y, z + lo(-0.1, 0.1), lo(-0.15, 0.15) + 0.25, lo(0.5, 0.9), lo(-0.15, 0.15), lo(2.5, 4), 0.35 * s, 1.6 * s, ciemny ? 0.55 : 0.35, ciemny ? '#3d3a38' : '#d8d8d8'); },
  ogien(x, y, z) { for (let i = 0; i < 2; i++) czastka(CZ_SWIAT, x + lo(-0.25, 0.25), y, z + lo(-0.25, 0.25), lo(-0.1, 0.1), lo(0.9, 1.7), lo(-0.1, 0.1), lo(0.3, 0.6), 0.32, 0.06, 0.95, ['#ff6a10', '#ff9a2a', '#ffd04a'][Math.floor(Math.random() * 3)]); },
  iskry(x, y, z, n = 6, kol = '#ffd84a') { for (let i = 0; i < n; i++) czastka(CZ_SWIAT, x, y, z, lo(-1.6, 1.6), lo(0.8, 2.4), lo(-1.6, 1.6), lo(0.25, 0.5), 0.14, 0.05, 1, kol, 6); },
  kurz(x, z, n = 2, s = 1) { for (let i = 0; i < n; i++) czastka(CZ_NORM, x + lo(-0.15, 0.15), 0.08, z + lo(-0.15, 0.15), lo(-0.3, 0.3), lo(0.1, 0.35), lo(-0.3, 0.3), lo(0.5, 0.9), 0.2 * s, 0.55 * s, 0.35, '#b39a74'); },
  wiory(x, y, z, kol, n = 4) { for (let i = 0; i < n; i++) czastka(CZ_NORM, x, y, z, lo(-1.2, 1.2), lo(1, 2.2), lo(-1.2, 1.2), lo(0.5, 0.8), 0.12, 0.08, 1, kol, 7); },
  zawalenie(b) {
    const w = b.w;
    for (let i = 0; i < 26 + w * 10; i++) czastka(CZ_NORM, b.x + lo(-w / 2, w / 2), lo(0.1, 1.2), b.z + lo(-w / 2, w / 2), lo(-1, 1), lo(0.3, 1.4), lo(-1, 1), lo(1.4, 2.6), 0.6, 2.2, 0.55, Math.random() < 0.5 ? '#8f7f6a' : '#6b6259');
    for (let i = 0; i < 10 + w * 4; i++) czastka(CZ_NORM, b.x + lo(-w / 2, w / 2), lo(0.4, 1.4), b.z + lo(-w / 2, w / 2), lo(-2.5, 2.5), lo(1.5, 4), lo(-2.5, 2.5), lo(0.9, 1.4), 0.2, 0.18, 1, Math.random() < 0.5 ? '#5a3518' : '#7d838c', 9);
  },
  zloto(x, y, z) { for (let i = 0; i < 14; i++) czastka(CZ_SWIAT, x + lo(-0.6, 0.6), y + lo(0, 0.6), z + lo(-0.6, 0.6), lo(-0.4, 0.4), lo(0.6, 1.6), lo(-0.4, 0.4), lo(0.7, 1.2), 0.22, 0.05, 1, Math.random() < 0.5 ? '#ffd84a' : '#fff3a8'); },
  fajerwerki(x, z) { for (let k = 0; k < 4; k++) { const y = lo(5, 8), cx = x + lo(-2, 2), czz = z + lo(-2, 2), kol = ['#ff5a4a', '#ffd84a', '#7fb2ff', '#7dff9a'][k]; for (let i = 0; i < 28; i++) { const a = lo(0, 6.283), b = lo(-1, 1), v = lo(2.5, 3.5); czastka(CZ_SWIAT, cx, y, czz, Math.cos(a) * Math.sqrt(1 - b * b) * v, b * v, Math.sin(a) * Math.sqrt(1 - b * b) * v, lo(0.9, 1.4), 0.25, 0.05, 1, kol, 2.5); } } },
  liscie(x, z) { for (let i = 0; i < 14; i++) czastka(CZ_NORM, x + lo(-0.8, 0.8), lo(0.8, 2), z + lo(-0.8, 0.8), lo(-0.8, 0.8), lo(0.2, 0.8), lo(-0.8, 0.8), lo(1.2, 2), 0.14, 0.1, 1, Math.random() < 0.5 ? '#4a8f3a' : '#7fae4c', 1.5); EF.kurz(x, z, 6, 2); },
};
// skąd leci dym z komina (budynki gracza i komputera są obrócone o pół obrotu)
const KOMINY = { dom: [[-0.43, 1.92, -0.34]], kuznia: [[0.83, 2.42, -1.05]], ratusz: [] };
let efT = 0;
function emitujEfekty(dt) {
  efT += dt; const czesto = efT > 0.12; if (czesto) efT = 0;
  if (!czesto) return;
  for (const b of BUD) {
    if (!naEkranie(b)) continue;
    const obr = ROGI[b.strona] && ROGI[b.strona][1] < 0 ? -1 : 1;
    if (b.gotowy) for (const [ox, oy, oz] of KOMINY[b.typ] || []) if (Math.random() < 0.35) EF.dym(b.x + ox * obr, oy, b.z + oz * obr, false, 0.8);
    if (b.typ === 'kuznia' && b.gotowy && Math.random() < 0.25) { EF.iskry(b.x + 0.55 * obr, 0.55, b.z - 0.6 * obr, 2, '#ffb347'); if (Math.random() < 0.3) odglos('kowadlo', b.x, b.z, 0.45, 900); }
    const z = b.hp / b.max;
    if (b.gotowy && z < 0.6 && Math.random() < 0.5) EF.dym(b.x + lo(-b.w / 3, b.w / 3), wysokoscBud(b) * 0.7, b.z + lo(-b.w / 3, b.w / 3), true, 1 + b.w * 0.15);
    if (b.gotowy && z < 0.35) for (let i = 0; i < 2; i++) EF.ogien(b.x + lo(-b.w / 3, b.w / 3), wysokoscBud(b) * lo(0.4, 0.8), b.z + lo(-b.w / 3, b.w / 3));
  }
  // kurz spod nóg (tylko u kilku widocznych, żeby telefon nie zwolnił)
  let ile = 0;
  for (const u of JED) { if (!u.idzie || ile > 25 || Math.random() > 0.35 || !naEkranie(u)) continue; ile++; EF.kurz(u.x, u.z, 1, u.d.linia === 'renifer' || u.d.kupiec ? 1.6 : 1); if (kam.d < 22) odglos('krok', u.x, u.z, 0.22, 140); }
  // dym z wulkanów
  for (const [vx, vz, vh] of WULKANY) if (Math.random() < 0.5) czastka(CZ_NORM, vx + lo(-2, 2), vh - 2, vz + lo(-2, 2), lo(0.5, 1.5), lo(1.5, 2.5), lo(-0.5, 0.5), lo(10, 16), 6, 22, 0.35, '#9a9a9a');
}

// ================= cienie chmur i ptaki =================
let CHMURY = null, PTAKI = [];
function zbudujNiebo() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d');
  for (let i = 0; i < 26; i++) { const x = Math.random() * 512, y = Math.random() * 512, r = 30 + Math.random() * 70, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) c.fillRect(x - r + dx, y - r + dy, r * 2, r * 2); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.6, 2.6);
  CHMURY = new THREE.Mesh(new THREE.PlaneGeometry(N + 44, N + 44).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.22, depthWrite: false, color: '#000000' }));
  CHMURY.position.y = 0.025; CHMURY.renderOrder = 1; CHMURY.userData.n = N; scena.add(CHMURY);
  const gk = new THREE.BoxGeometry(0.45, 0.03, 0.14), mk = new THREE.MeshBasicMaterial({ color: '#2b2b33' });
  for (let s = 0; s < 8; s++) {
    const cx = lo(-POL * 0.7, POL * 0.7), cz = lo(-POL * 0.7, POL * 0.7), r = lo(14, 26), wys = lo(11, 16), szyb = lo(0.12, 0.2) * (Math.random() < 0.5 ? 1 : -1);
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Group(), l = new THREE.Mesh(gk, mk), pr = new THREE.Mesh(gk, mk);
      l.position.x = -0.2; pr.position.x = 0.2; p.add(l, pr); p.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.28), mk));
      scena.add(p); PTAKI.push({ p, l, pr, cx, cz, r: r + (i % 2) * 1.2, wys: wys + i * 0.3, szyb, kat: lo(0, 6.283) - i * 0.06, f: lo(0, 6) });
    }
  }
}
function ruszNiebo(dt, t) {
  if (!CHMURY) zbudujNiebo();
  CHMURY.material.map.offset.x += dt * 0.004; CHMURY.material.map.offset.y += dt * 0.0025;
  for (const b of PTAKI) {
    b.kat += b.szyb * dt; const x = b.cx + Math.cos(b.kat) * b.r, z = b.cz + Math.sin(b.kat) * b.r;
    b.p.position.set(x, b.wys + Math.sin(t * 0.7 + b.f) * 0.4, z); b.p.rotation.y = -b.kat + (b.szyb > 0 ? 0 : Math.PI);
    const mach = Math.sin(t * 9 + b.f) * 0.6; b.l.rotation.z = mach; b.pr.rotation.z = -mach;
  }
  if (dalej && dalej.userData.woda) dalej.userData.woda.material.color.setHSL(0.57, 0.6, 0.55 + Math.sin(t * 0.6) * 0.02);
  if (INST.teren_woda && FALE) { FALE.offset.x = t * 0.012; FALE.offset.y = t * 0.007; }
}

// ================= krok gry =================
let symulacja = false;
function krokGry(dt) {
  S.czas += dt;
  for (let i = BUD.length - 1; i >= 0; i--) { const b = BUD[i]; if (b) { b.modlacy = 0; aktualizujBudynek(b, dt); } }
  for (let i = JED.length - 1; i >= 0; i--) { const u = JED[i]; if (u) aktualizujJednostke(u, dt); }
  rozpychaj();
  // pociski
  for (let i = POC.length - 1; i >= 0; i--) {
    const p = POC[i]; p.t += dt;
    if (zyje(p.cel)) { p.ox = p.cel.x; p.oz = p.cel.z; }
    if (p.t >= p.T) {
      if (zyje(p.cel)) { zadaj(p.cel, obrazenia(p.od, p.cel, p.atak), zyje(p.od) ? p.od : null); if (naEkranie(p.cel)) { EF.kurz(p.ox, p.oz, 3, 0.8); odglos('kamyk', p.ox, p.oz, 0.5); } }
      scena.remove(p.mesh); POC.splice(i, 1);
    }
  }
  cenyWracaja(dt); podatki(dt); krokCzarow(dt);
  for (let s = 1; s < ileStron(); s++) if (!(S.odpadli && S.odpadli[s])) ai(s, dt);
  if (S.aiGracz) ai(STRONA_GRACZA, dt);
  if ((S.sprzatanie = (S.sprzatanie || 0) + dt) > 20) { S.sprzatanie = 0; sprzatnijListy(); }
  sprawdzKoniec();
}
function rozpychaj() {
  const n = JED.length;
  for (let i = 0; i < n; i++) {
    const a = JED[i];
    for (let j = i + 1; j < n; j++) {
      const b = JED[j], dx = b.x - a.x; if (dx > 1.2 || dx < -1.2) continue;
      const dz = b.z - a.z; if (dz > 1.2 || dz < -1.2) continue;
      const min = (a.d.r + b.d.r) * 0.85, d2 = dx * dx + dz * dz;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2) || 0.01, p = (min - d) * 0.5, ux = d2 ? dx / d : Math.random() - 0.5, uz = d2 ? dz / d : Math.random() - 0.5;
      // kto pracuje albo stoi, ustępuje mniej
      const wa = a.pracuje ? 0.3 : 1, wb = b.pracuje ? 0.3 : 1, s = wa + wb;
      przesun(a, a.x - ux * p * wa / s * 2, a.z - uz * p * wa / s * 2);
      przesun(b, b.x + ux * p * wb / s * 2, b.z + uz * p * wb / s * 2);
      // idący, któremu ktoś stoi na drodze, schodzi w prawo (jak na chodniku): dwaj idący naprzeciw siebie mijają się od razu
      for (const [u, kx, kz] of [[a, ux, uz], [b, -ux, -uz]]) {
        if (!u.idzie) continue;
        const hx = Math.sin(u.ry), hz = Math.cos(u.ry);
        if (hx * kx + hz * kz < 0.35) continue; // ten drugi nie jest przed nim
        const bok = p * 0.9 + 0.025;
        przesun(u, u.x + hz * bok, u.z - hx * bok);
      }
    }
  }
}
function sprawdzKoniec() {
  if (S.wynik) return;
  // strona bez Dworku odpada; gracz wygrywa, gdy odpadną wszyscy jego wrogowie
  if (!S.odpadli) S.odpadli = [];
  for (let s = 0; s < ileStron(); s++) if (!S.odpadli[s] && !BUD.some(b => b.strona === s && b.typ === 'ratusz')) {
    S.odpadli[s] = true;
    if (s !== STRONA_GRACZA && ileStron() > 2 && !S.aiGracz) { toast(`💥 ${ZNAK_STRON[s]} Osada ${NAZWY_STRON[s]} upadła!`); dzwiek('zniszcz'); }
  }
  if (S.odpadli[STRONA_GRACZA]) { S.wynik = 'przegrana'; koniecGry(); return; }
  let zostali = false; for (let s = 1; s < ileStron(); s++) if (wrogowie(STRONA_GRACZA, s) && !S.odpadli[s]) zostali = true;
  if (!zostali) { S.wynik = 'wygrana'; koniecGry(); }
}

// ================= nowa gra, zapis, wczytanie =================
// opcje: { mapa: 'dolina' | ... | 'losowa' (MAPY w dane.js), rozmiar: 144 | 192 | 240 | 384, przeciwnicy: ['latwy', ...] (1–3 komputery), sojusz: 'kazdy' | 'razem' }; sam napis = jeden komputer
function nowaGra(opcje = {}) {
  if (typeof opcje === 'string') opcje = { przeciwnicy: [opcje] };
  const przec = (opcje.przeciwnicy && opcje.przeciwnicy.length ? opcje.przeciwnicy : ['latwy']).slice(0, 3).map(t => TRUDNOSC[t] ? t : 'latwy');
  const strony = przec.length + 1, dla = f => Array.from({ length: strony }, (_, s) => f(s));
  const rodzaje = Object.keys(MAPY), mapaTyp = opcje.mapa === 'losowa' ? rodzaje[Math.floor(Math.random() * rodzaje.length)] : MAPY[opcje.mapa] ? opcje.mapa : 'dolina';
  ustawMape(opcje.rozmiar || 192);
  wyczyscSwiat();
  const seed = Math.floor(Math.random() * 1e9);
  S = { v: 1, mapa: N, mapaTyp, seed, strony, trudnosc: przec[0], trudnosci: [null, ...przec], druzyna: dla(s => opcje.sojusz === 'razem' && s > 0 ? 1 : s), odpadli: [],
    trudnoscGracza: 'sredni', czas: 0, nextId: 1, zas: dla(() => ({ ...START })), era: dla(() => 1), ul: dla(() => ({})), wynik: null,
    stat: dla(() => ({ zebrane: 0, wyszkoleni: 0, pokonani: 0, zburzone: 0, budynki: 0 })), ai: dla(() => nowyAI()), usuniete: [], pomoc: {}, aiGracz: false };
  // bogowie główni: gracz wybiera, komputery losują; każdy bóg główny daje od razu swoją moc
  S.bogowie = dla(s => [s === 0 && BOGOWIE[opcje.bog] ? opcje.bog : BOGOWIE_GLOWNI[Math.floor(Math.random() * BOGOWIE_GLOWNI.length)]]);
  S.moce = dla(s => [{ id: BOGOWIE[S.bogowie[s][0]].moc, uzyta: false }]);
  S.buff = dla(() => ({})); S.czary = [];
  S.nextId = generujMape(seed);
  dodatkoweZloza(seed);
  zamknijPolanki();
  rozmiescOzdoby(seed);
  zbudujZiemie();
  for (let s = 0; s < strony; s++) {
    const [cx, cz] = bazaStrony(s), a0 = Math.atan2(-cx, -cz); // osadnicy stoją od strony środka mapy
    const r = nowyBudynek(s, 'ratusz', cx + POL - 2, cz + POL - 2, true);
    for (let k = 0; k < 3; k++) { const a = a0 + (k - 1) * 0.6; nowaJednostka(s, 'osadnik', r.x + Math.sin(a) * 3.2, r.z + Math.cos(a) * 3.2); }
  }
  kam.x = BAZA; kam.z = BAZA; kam.d = 30; kam.kat = Math.PI / 4;
  zapiszGre();
}
function zbudujZiemie() {
  const mz = new THREE.MeshLambertMaterial({ map: malujZiemie(S.seed) });
  // ostra trawa z bliska: drobna faktura powtarzana wiele razy na mapie
  mz.onBeforeCompile = sh => {
    sh.uniforms.tDetal = { value: teksturaDetalu() };
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tDetal;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n{ vec3 dd = texture2D(tDetal, vMapUv * ' + (46 * N / 96).toFixed(1) + ').rgb; diffuseColor.rgb *= 0.72 + 0.56 * dd; }');
  };
  ziemia = new THREE.Mesh(new THREE.PlaneGeometry(N, N).rotateX(-Math.PI / 2), mz);
  ziemia.receiveShadow = true; scena.add(ziemia);
  const woda = zbudujWode(); if (woda) { INST.teren_woda = woda; scena.add(woda); }
  scena.fog.color.set(motywMapy().mgla);
  dalej = zbudujOkolice(S.seed); scena.add(dalej);
}
let DETAL = null;
// teren na ziemi: kółko na każdej kratce, kółka zlewają się w gładkie brzegi
function malujTeren(c, P, sk, M0, r) {
  const L = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const t = TEREN[j * N + i]; if (t) L.push([i, j, t, i - POL + 0.5, j - POL + 0.5]); }
  if (!L.length) return;
  const kolo = (x, z, rad, kol) => { c.fillStyle = kol; c.beginPath(); c.arc(P(x), P(z), rad * sk, 0, 7); c.fill(); };
  const T = (i, j) => (i < 0 || j < 0 || i >= N || j >= N ? 0 : TEREN[j * N + i]);
  const gleboko = (i, j) => { for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) if (T(i + a, j + b) !== 1) return false; return true; };
  for (const [, , t, x, z] of L) if (t === 1 || t === 3) kolo(x, z, 1.9, M0.brzeg);
  for (const [, , t, x, z] of L) if (t === 2) kolo(x, z, 1.5, M0.skala);
  for (const [, , t, x, z] of L) if (t === 4) kolo(x, z, 1.3, M0.lodBrzeg);
  for (const [, , t, x, z] of L) if (t === 3) kolo(x, z, 1.05, M0.brod);
  for (const [, , t, x, z] of L) if (t === 1) kolo(x, z, 1.1, M0.woda);
  for (const [i, j, t, x, z] of L) if (t === 1 && gleboko(i, j)) kolo(x, z, 1.3, M0.glebia);
  for (const [, , t, x, z] of L) if (t === 4) kolo(x, z, 1.0, M0.lod);
  // kamyczki w brodach, pęknięcia na lodzie, kamienie między skałami
  c.lineWidth = 1.3;
  for (const [, , t, x, z] of L) {
    if (t === 3) for (let k = 0; k < 3; k++) kolo(x + r() - 0.5, z + r() - 0.5, 0.06 + r() * 0.08, r() < 0.5 ? '#9a9486' : '#c2bcae');
    else if (t === 4 && r() < 0.22) { c.strokeStyle = 'rgba(140,175,205,0.75)'; c.beginPath(); c.moveTo(P(x), P(z)); c.lineTo(P(x + (r() - 0.5) * 3), P(z + (r() - 0.5) * 3)); c.lineTo(P(x + (r() - 0.5) * 4), P(z + (r() - 0.5) * 4)); c.stroke(); }
    else if (t === 2) kolo(x + r() - 0.5, z + r() - 0.5, 0.15 + r() * 0.15, r() < 0.5 ? '#6f6a60' : '#a39d90');
  }
}
// błyszcząca tafla wody nad namalowaną wodą (przezroczystość z maski, fale ruszają się w ruszNiebo)
let FALE = null;
function zbudujWode() {
  let jest = false; for (let c = 0; c < N * N && !jest; c++) if (TEREN[c] === 1 || TEREN[c] === 3) jest = true;
  if (!jest) return null;
  const R = 1024, sk = R / N, cv = document.createElement('canvas'); cv.width = cv.height = R; const c = cv.getContext('2d');
  c.fillStyle = '#000'; c.fillRect(0, 0, R, R);
  for (const [t, kol, rad] of [[3, '#4a4a4a', 0.9], [1, '#ffffff', 1.05]]) {
    c.fillStyle = kol;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (TEREN[j * N + i] === t) { c.beginPath(); c.arc((i + 0.5) * sk, (j + 0.5) * sk, rad * sk, 0, 7); c.fill(); }
  }
  const maska = new THREE.CanvasTexture(cv);
  if (!FALE) {
    const fc = document.createElement('canvas'); fc.width = fc.height = 256; const f = fc.getContext('2d');
    f.fillStyle = 'rgb(128,128,128)'; f.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 700; i++) { const x = Math.random() * 256, y = Math.random() * 256, w = 8 + Math.random() * 22, v = Math.random() < 0.5 ? 112 : 150; f.strokeStyle = `rgba(${v},${v},${v},0.6)`; f.lineWidth = 2 + Math.random() * 3; f.beginPath(); f.ellipse(x, y, w, w * 0.22, 0, 0.3, Math.PI - 0.3); f.stroke(); }
    FALE = new THREE.CanvasTexture(fc); FALE.wrapS = FALE.wrapT = THREE.RepeatWrapping;
  }
  FALE.repeat.set(N / 10, N / 10);
  const M0 = motywMapy();
  const m = new THREE.MeshPhongMaterial({ color: M0.woda, specular: '#dff2ff', shininess: 60, transparent: true, opacity: 0.55, alphaMap: maska, bumpMap: FALE, bumpScale: 0.7, depthWrite: false });
  const w = new THREE.Mesh(new THREE.PlaneGeometry(N, N).rotateX(-Math.PI / 2), m);
  w.position.y = 0.035; w.renderOrder = 1;
  return w;
}
function teksturaDetalu() {
  if (DETAL) return DETAL;
  const R = 256, cv = document.createElement('canvas'); cv.width = cv.height = R; const c = cv.getContext('2d');
  c.fillStyle = 'rgb(128,128,128)'; c.fillRect(0, 0, R, R);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * R, y = Math.random() * R, h = 4 + Math.random() * 9, a = (Math.random() - 0.5) * 0.7, v = Math.random() < 0.5 ? 70 + Math.random() * 40 : 160 + Math.random() * 60;
    c.strokeStyle = `rgb(${v},${v},${v})`; c.lineWidth = 1 + Math.random(); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * h, y - Math.cos(a) * h); c.stroke();
  }
  DETAL = new THREE.CanvasTexture(cv); DETAL.wrapS = DETAL.wrapT = THREE.RepeatWrapping; DETAL.anisotropy = 8;
  return DETAL;
}
// okolica za mapą: zalesione wzgórza, góry ze śniegiem, wulkany z dymem i jezioro
let WULKANY = [];
function zbudujOkolice(seed) {
  const grupa = new THREE.Group(), r = rng(seed * 3 + 1), zi = seed % 991, OK = motywMapy().okolica, mt = motyw();
  const OD = POL - 48, S2 = 440 + 2 * OD, SEG = Math.round(150 * S2 / 440), geo = new THREE.PlaneGeometry(S2, S2, SEG, SEG).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, kol = [], c = new THREE.Color();
  // jezioro po jednej stronie (za brzegiem mapy), wulkany daleko
  const jez = { x: BAZA + r() * 30, z: -95 - OD - r() * 25, r: 34 };
  WULKANY = [[-150 - OD + r() * 40, -170 - OD + r() * 30, 52], [160 + OD + r() * 30, -120 - OD + r() * 50, 44], [-60 + r() * 40, 175 + OD + r() * 20, 38]];
  const wys = (x, z) => {
    const d = Math.max(Math.abs(x), Math.abs(z)) - POL - 2;
    if (d < 0) return -0.06;
    let h = (szumMapy(x * 0.03, z * 0.03, zi) * 0.7 + szumMapy(x * 0.09, z * 0.09, zi + 5) * 0.3) * Math.min(1, d / 22) * (8 + d * 0.32);
    for (const [vx, vz, vh] of WULKANY) { const dv = Math.hypot(x - vx, z - vz); if (dv < vh * 1.6) h = Math.max(h, vh * Math.max(0, 1 - dv / (vh * 1.6)) ** 1.25 - (dv < 4 ? 3 : 0)); }
    const dj = Math.hypot(x - jez.x, z - jez.z); if (dj < jez.r) h = Math.min(h, -1.2 * (1 - dj / jez.r) - 0.1);
    return h;
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = wys(x, z); pos.setY(i, h);
    if (h < 0.05) c.set(Math.max(Math.abs(x), Math.abs(z)) < POL + 4 ? OK[0] : OK[3]);
    else if (h < 5) c.set(OK[1]).lerp(new THREE.Color(OK[2]), h / 5);
    else if (h < 16) c.set(OK[2]).lerp(new THREE.Color(mt === 'zima' ? '#a9b4bd' : '#7d7a6e'), (h - 5) / 11);
    else if (h < 26) c.set('#7d7a6e').lerp(new THREE.Color('#9d978a'), (h - 16) / 10);
    else c.set('#f4f7fb');
    kol.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(kol, 3)); geo.computeVertexNormals();
  const ziemiaDalej = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  ziemiaDalej.position.y = -0.02; ziemiaDalej.receiveShadow = false; grupa.add(ziemiaDalej);
  // woda
  const woda = new THREE.Mesh(new THREE.CircleGeometry(jez.r + 2, 48).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: '#4a9fd8', specular: '#ffffff', shininess: 90, transparent: true, opacity: 0.88 }));
  woda.position.set(jez.x, -0.25, jez.z); grupa.add(woda); grupa.userData.woda = woda;
  // las na wzgórzach (świerki i sosny, bez cieni)
  const L = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let k = 0; k < 6000 && L.length < 1900; k++) {
    const x = (r() - 0.5) * (300 + 2 * OD), z = (r() - 0.5) * (300 + 2 * OD); if (Math.max(Math.abs(x), Math.abs(z)) < POL + 3) continue;
    const h = wys(x, z); if (h < 0.3 || h > 14 || szumMapy(x * 0.05, z * 0.05, zi + 9) < 0.35) continue;
    const s = 1.1 + r() * 1.4, a = r() * 6.283, gat = r() < 0.7 ? 'swierk' : 'sosna';
    L.push([x, h, z, s, a, mt === 'zima' ? (gat === 'swierk' ? 'swierkS' : 'swierk') : mt === 'piasek' ? 'sosna' : gat]);
  }
  for (const gat of ['swierk', 'sosna', 'swierkS', 'palma']) {
    const lista = L.filter(t => t[5] === gat); if (!lista.length) continue;
    const im = new THREE.InstancedMesh(MOD.drzewo(gat), MAT, lista.length);
    lista.forEach(([x, h, z, s, a], i) => { q.setFromAxisAngle(up, a); sc.set(s, s, s); p.set(x, h - 0.1, z); im.setMatrixAt(i, m4.compose(p, q, sc)); });
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); grupa.add(im);
  }
  return grupa;
}
function zadDoZapisu(z) {
  if (!z) return null;
  const o = {};
  for (const k of ['typ', 'zid', 'sur', 'bid', 'cid', 'x', 'z', 'faza', 'ox', 'oz', 'sx', 'sz', 'wraca', 'skup', 'pogon', 'jid', 'dom', 'stoi']) if (z[k] !== undefined) o[k] = typeof z[k] === 'number' ? Math.round(z[k] * 100) / 100 : z[k];
  if (o.faza === 'dochodzi' || o.faza === 'zbiera') o.faza = 'idz';
  if (z.potem) o.potem = zadDoZapisu(z.potem);
  return o;
}
function stanDoZapisu() {
  const o = { ...S };
  o.zasoby = []; for (const z0 of ZAS.values()) if (z0.ile !== z0.start) o.zasoby.push([z0.id, Math.round(z0.ile * 10) / 10]);
  o.bud = BUD.map(b => [b.id, b.strona, b.typ, b.i0, b.j0, Math.round(b.hp), Math.round(b.postep * 1000) / 1000, b.kolejka.map(q => [q.rodzaj, q.typ, Math.round(q.t * 10) / 10, q.czas, q.koszt]), b.zbiorka, b.rolnik || 0, b.poziom || 1, b.wyg ? b.wyg.map(v => Math.round(v * 1000) / 1000) : 0, b.d.brama ? [b.kier == null ? -1 : b.kier, b.zamk ? 1 : 0, b.szer || 3] : 0]);
  o.jed = JED.map(u => [u.id, u.strona, u.typ, Math.round(u.x * 100) / 100, Math.round(u.z * 100) / 100, Math.round(u.hp * 10) / 10, u.niesie.sur, Math.round(u.niesie.ile * 10) / 10, zadDoZapisu(u.zad), u.postawa || 'agresja']);
  o.kamera = [kam.x, kam.z, kam.d, kam.kat];
  return o;
}
function zapiszGre() {
  if (!S || symulacja) return;
  zapis.gra = S.wynik ? null : stanDoZapisu();
  zapiszDysk();
}
// zapis z wersji 1: złoto zamieniamy na żelazo
function przerobStaryZapis(o) {
  const zm = z => { if (z && 'zloto' in z) { z.zelazo = (z.zelazo || 0) + z.zloto; delete z.zloto; } };
  for (const z of o.zas || []) zm(z);
  const zad = z => { if (!z) return; if (z.sur === 'zloto') z.sur = 'zelazo'; zad(z.potem); };
  for (const j of o.jed || []) { if (j[6] === 'zloto') j[6] = 'zelazo'; zad(j[8]); }
  o.v = 2;
  // zapis sprzed złota: dokładamy złoto i ceny na Jarmarku
  for (const z of o.zas || []) if (!('zloto' in z)) z.zloto = 0;
}
function wczytajGre(o) {
  przerobStaryZapis(o);
  ustawMape(o.mapa || 192);
  wyczyscSwiat();
  S = { ...o }; delete S.zasoby; delete S.bud; delete S.jed; delete S.kamera;
  generujMape(S.seed);
  dodatkoweZloza(S.seed);
  zamknijPolanki();
  rozmiescOzdoby(S.seed);
  zbudujZiemie();
  for (const id of o.usuniete) { const z0 = ZAS.get(id); if (z0) usunZasob(z0); }
  S.usuniete = [...o.usuniete];
  for (const [id, ile] of o.zasoby) { const z0 = ZAS.get(id); if (z0) { z0.ile = ile; if (ile < z0.start) zetnij(z0, z0.x, z0.z, true); } }
  sprzatnijListy();
  for (const [id, strona, typ, i0, j0, hp, postep, kolejka, zbiorka, rolnik, poziom, wyg, brm] of o.bud) {
    const b = nowyBudynek(strona, typ, i0, j0, postep >= 1, id, poziom || 1, wyg || null, brm && brm[0] >= 0 ? brm[0] : null, brm && brm[2] || 3);
    if (brm && brm[1]) ustawBrame(b, true);
    b.hp = hp; b.postep = postep; b.zbiorka = zbiorka; b.rolnik = rolnik;
    b.kolejka = kolejka.map(([rodzaj, t, czasT, czas, koszt]) => ({ rodzaj, typ: t, t: czasT, czas, koszt }));
    if (!b.gotowy) b.mesh.scale.y = 0.12 + 0.88 * postep;
  }
  // zapis sprzed skośnych murów: mury w pionie obracamy według sąsiadów
  for (const b of BUD) if (b.d.mur && !b.wyg) ulozMur(b, zgadnijWyglad(b));
  // stary zapis: nowe złoża, które wypadły pod budynkami, znikają
  for (const z0 of [...ZAS.values()]) if (z0.dodatkowe && naKom[z0.c] !== z0.id) { ZAS.delete(z0.id); E.delete(z0.id); z0.ile = 0; const im = INST[z0.klucz]; if (im) { im.setMatrixAt(z0.inst, ZERO); im.instanceMatrix.needsUpdate = true; } }
  sprzatnijListy();
  for (const [id, strona, typ, x, z, hp, sur, ile, zad, postawa] of o.jed) {
    const u = nowaJednostka(strona, typ, x, z, id);
    u.hp = hp; u.niesie = { sur, ile }; u.zad = zad; u.postawa = postawa || 'agresja';
    if (!wolneXZ(u.x, u.z)) { const c = najblizszaWolna(kom(u.x, u.z), 6); if (c >= 0) [u.x, u.z] = srodekKom(c); }
  }
  if (o.kamera) { [kam.x, kam.z, kam.d] = o.kamera; kam.kat = o.kamera[3] ?? Math.PI / 4; }
}

// ================= kamera i rysowanie =================
const EL = 0.98; // nachylenie kamery
// oddalanie: do D_DALEKO kamera się pochyla (widać horyzont z górami i wulkanami), dalej znów patrzy coraz bardziej z góry,
// aż na samym końcu (dMaks) widać całą mapę
const D_BLISKO = 13, D_DALEKO = 72, EL_GORA = 1.32;
const do01 = v => Math.max(0, Math.min(1, v));
// za D_DALEKO kamera unosi się powoli tak, żeby z każdym oddaleniem widać było coraz dalej (a z każdym przybliżeniem bliżej);
// wcześniej unosiła się za szybko i przybliżanie od daleka prawie nic nie zmieniało na ekranie
function nachylenie(d) {
  if (d <= D_DALEKO) return EL - 0.42 * do01((d - 30) / 32);
  // a: kąt między środkiem widoku a górą ekranu; zasieg(el) * d: jak daleko za środkiem widać ziemię u góry ekranu
  const a = Math.atan(Math.tan(kamera.fov / 2 * Math.PI / 180) * (innerHeight / 2 - 80) / (innerHeight / 2));
  const zasieg = el => Math.sin(el) / Math.tan(el - a) - Math.cos(el);
  const cel = zasieg(EL - 0.42) * Math.pow(d / D_DALEKO, -0.4);
  let lo = EL - 0.42, hi = EL_GORA;
  if (zasieg(hi) >= cel) return hi;
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (zasieg(m) > cel) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
function polozKamere(x, z, d) {
  const el = nachylenie(d), h = Math.sin(el) * d, p = Math.cos(el) * d;
  kamera.position.set(x + Math.sin(kam.kat) * p, h, z + Math.cos(kam.kat) * p); kamera.lookAt(x, 0, z); kamera.updateMatrixWorld();
}
// dolna krawędź widocznej części ekranu (nad panelem na dole)
const dolWidoku = () => { const p = $('panel'); const t = p ? p.getBoundingClientRect().top : 0; return t > innerHeight * 0.4 ? t : innerHeight - 200; };
// najdalsze oddalenie: cała mapa (patrząc na jej środek) mieści się na ekranie; liczone od nowa przy obrocie i zmianie ekranu
let dMaksKlucz = '', dMaksW = 400;
function dMaks() {
  const dol = innerHeight - 200, klucz = N + '|' + kam.kat.toFixed(2) + '|' + innerWidth + '|' + innerHeight + '|' + Math.round(dol);
  if (klucz === dMaksKlucz) return dMaksW;
  const yMin = 1 - 2 * (dol - 6) / innerHeight, yMax = 1 - 2 * 70 / innerHeight;
  const miesci = d => {
    polozKamere(0, 0, d);
    for (const [x, z] of [[-POL, -POL], [POL, -POL], [POL, POL], [-POL, POL]]) {
      V3.set(x, 0, z).project(kamera); if (Math.abs(V3.x) > 0.97 || V3.y < yMin || V3.y > yMax) return false;
    }
    return true;
  };
  let a = D_DALEKO, b = 4000;
  for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (miesci(m)) b = m; else a = m; }
  dMaksKlucz = klucz; dMaksW = b; return b;
}
function ustawKamere() {
  const dm = dMaks();
  kam.d = Math.max(D_BLISKO, Math.min(dm, kam.d));
  // im dalej za D_DALEKO, tym bliżej środka mapy musi patrzeć kamera (na samym końcu cała mapa na środku ekranu)
  const lim = (POL - 2) * (1 - do01((kam.d - D_DALEKO) / (dm - D_DALEKO)));
  kam.x = Math.max(-lim, Math.min(lim, kam.x)); kam.z = Math.max(-lim, Math.min(lim, kam.z));
  polozKamere(kam.x, kam.z, kam.d);
  // z daleka: dalszy horyzont, mgła dalej, cienie na większym kawałku mapy
  const near = kam.d > D_DALEKO ? kam.d * 0.05 : 0.5, far = Math.max(600, kam.d * 5);
  if (kamera.near !== near || kamera.far !== far) { kamera.near = near; kamera.far = far; kamera.updateProjectionMatrix(); }
  scena.fog.near = Math.max(90, kam.d * 1.3); scena.fog.far = Math.max(330, kam.d * 4.5);
  slonce.position.set(kam.x - 14, 34, kam.z - 4); slonce.target.position.set(kam.x, 0, kam.z);
  const dal = Math.max(0, kam.d - D_DALEKO), sc = slonce.shadow.camera, r = Math.min(38, kam.d * 0.85) + Math.min(POL * 1.1, dal * 0.6);
  if (sc.right !== r) { sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1 - dal * 1.2; sc.far = 90 + dal * 1.2; sc.updateProjectionMatrix(); }
}
function rozmiar() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h); kamera.aspect = w / h;
  // środek widoku nad panelem na dole (panel zasłania dół ekranu)
  kamera.setViewOffset(w, h, 0, 80, w, h); kamera.updateProjectionMatrix();
  const dpr = Math.min(window.devicePixelRatio || 1, 2), nk = $('nakladka');
  nk.width = w * dpr; nk.height = h * dpr; nk.style.width = w + 'px'; nk.style.height = h + 'px';
}
addEventListener('resize', rozmiar);
const V3 = new THREE.Vector3();
function naEkran(x, y, z) { V3.set(x, y, z).project(kamera); return [(V3.x + 1) / 2 * innerWidth, (1 - V3.y) / 2 * innerHeight, V3.z]; }
function naEkranie(e) { if (!e || symulacja) return false; V3.set(e.x, 0.5, e.z).project(kamera); return Math.abs(V3.x) < 1.1 && Math.abs(V3.y) < 1.1 && V3.z < 1; }
let czasRys = 0, ping = null;
const PIERSCIEN = {};
function pierscien(e) {
  if (e.pierscien) return e.pierscien;
  const r = jestBudynkiem(e) ? e.w / 2 * Math.SQRT2 + 0.1 : e.d ? e.d.r + 0.12 : 0.6;
  const k = (jestBudynkiem(e) ? 'b' : 'j') + r.toFixed(2);
  const g = PIERSCIEN[k] || (PIERSCIEN[k] = jestBudynkiem(e) ? new THREE.RingGeometry(r - 0.08, r, 4, 1, Math.PI / 4).rotateX(-Math.PI / 2) : MOD.kolo(r - 0.07, r));
  e.pierscien = new THREE.Mesh(g, MAT_RING[e.strona !== STRONA_GRACZA ? 1 : 0]);
  if (e.strona == null) e.pierscien.material = MAT_ZNACZNIK;
  if (e.kom && e.wyg) { e.pierscien.scale.x = e.wyg[3]; e.pierscien.rotation.y = e.wyg[2]; } // brama na 3 kratki
  e.pierscien.renderOrder = 3;
  scena.add(e.pierscien);
  return e.pierscien;
}
let znacznik = null;
function pokazZnacznik(x, z, wrogi = false) {
  if (!znacznik) { znacznik = new THREE.Mesh(MOD.kolo(0.3, 0.45), MAT_ZNACZNIK.clone()); znacznik.renderOrder = 4; scena.add(znacznik); }
  znacznik.material.color.set(wrogi ? '#ff5a4a' : '#ffffff');
  znacznik.position.set(x, 0.06, z); znacznik.userData.t = 0.7; znacznik.visible = true;
}
// ręka zbieracza: narzędzie zależy od pracy, każda praca ma swój ruch
const NARZ_PRACY = { modl: 'reka', zbieraj: { jagody: 'zrywa', drewno: 'siekiera', kamien: 'kilof', zelazo: 'kilof' }, farma: 'zrywa', buduj: 'mlotek', naprawiaj: 'mlotek', atakuj: 'siekiera' };
const lerp = (a, b, t) => a + (b - a) * t;
function ruszReka(u, dt) {
  const z = u.zad, nz = z ? (z.typ === 'zbieraj' ? NARZ_PRACY.zbieraj[z.sur] : NARZ_PRACY[z.typ]) : null;
  const narz = u.d.naprawia ? 'mlotek' : nz && !(z.faza === 'niesie' && nz === 'zrywa') ? nz : 'reka';
  if (!u.ramie) { u.ramie = new THREE.Group(); u.ramie.position.set(0.19, 0.77, 0); u.mesh.add(u.ramie); }
  if (u.narz !== narz) {
    if (u.ramieM) u.ramie.remove(u.ramieM);
    u.ramieM = new THREE.Mesh(MOD.ramie3D(narz, u.strona), MAT); u.ramie.add(u.ramieM); u.narz = narz;
  }
  const kosz = narz === 'zrywa';
  if (kosz && !u.koszBok) { u.koszBok = new THREE.Mesh(MOD.koszBok(), MAT); u.koszBok.position.set(-0.31, 0.34, 0.06); u.mesh.add(u.koszBok); }
  if (u.koszBok) u.koszBok.visible = kosz;
  let rx = 0, rz = 0;
  // trening boksera przy Gontynie: obie ręce w gardzie, na zmianę szybki prosty cios przed siebie
  const trening = !!(u.typ === 'osadnik' && u.pracuje && z && z.typ === 'modl');
  if (trening !== !!u.piesci) {
    if (trening) {
      u.mesh.geometry = MOD.osadnik(u.strona, u.id % 6, 1); u.piesci = [];
      for (const sx of [-1, 1]) { const g = new THREE.Mesh(MOD.piesc3D(u.strona), MAT); g.position.set(sx * 0.17, 0.77, 0); u.mesh.add(g); u.piesci.push(g); }
    } else { u.mesh.geometry = MOD.osadnik(u.strona, u.id % 6); for (const g of u.piesci) u.mesh.remove(g); u.piesci = null; }
  }
  u.ramie.visible = !trening;
  if (trening) {
    const p = (u.t * 1.6 + (u.id % 5) * 0.37) % 1, f = (ph) => { const q = (p - ph + 1) % 1; return q < 0.12 ? q / 0.12 : q < 0.3 ? 1 - (q - 0.12) / 0.18 : 0; };
    u.piesci.forEach((g, i) => { const c = f(i * 0.5); g.position.z = c * 0.17; g.position.y = 0.77 + c * 0.02; g.rotation.x = c * 0.35; g.rotation.y = (i ? -1 : 1) * c * 0.25; });
    return;
  }
  if (u.pracuje) {
    if (narz === 'siekiera') { const p = (u.t * 1.5) % 1; rx = p < 0.22 ? lerp(-2.4, -0.25, p / 0.22) : lerp(-0.25, -2.4, (p - 0.22) / 0.78); rz = -0.45; if (u.pp < 0.22 && p >= 0.22 && naEkranie(u)) { EF.wiory(u.x + Math.sin(u.ry) * 0.5, 0.6, u.z + Math.cos(u.ry) * 0.5, '#e0c08a'); odglos('siekiera', u.x, u.z, 0.55, 40); } u.pp = p; }
    else if (narz === 'kilof') { const p = (u.t * 1.2) % 1; rx = p < 0.2 ? lerp(-2.8, 0.05, p / 0.2) : lerp(0.05, -2.8, (p - 0.2) / 0.8); if (u.pp < 0.2 && p >= 0.2 && naEkranie(u)) { const k = u.zad && u.zad.sur === 'zloto' ? '#ffd84a' : u.zad && u.zad.sur === 'zelazo' ? '#c4622d' : '#b3ada3'; EF.wiory(u.x + Math.sin(u.ry) * 0.55, 0.3, u.z + Math.cos(u.ry) * 0.55, k, 5); EF.iskry(u.x + Math.sin(u.ry) * 0.55, 0.3, u.z + Math.cos(u.ry) * 0.55, 2); odglos('kilof', u.x, u.z, 0.55, 40); } u.pp = p; }
    else if (narz === 'mlotek') { const p = (u.t * 2.4) % 1; rx = p < 0.3 ? lerp(-1.9, -0.55, p / 0.3) : lerp(-0.55, -1.9, (p - 0.3) / 0.7); if (u.pp < 0.3 && p >= 0.3 && naEkranie(u)) odglos('mlotek', u.x, u.z, 0.4, 60); u.pp = p; }
    else if (narz === 'zrywa') {
      // ręka sięga do krzaka i wraca do koszyka przy boku
      const p = (u.t * 0.9) % 1, s = Math.sin(p * Math.PI * 2);
      if (u.pp < 0.25 && p >= 0.25 && naEkranie(u)) odglos('krzak', u.x, u.z, 0.25, 120); u.pp = p;
      rx = lerp(-1.25, -0.15, (s + 1) / 2); rz = s > 0 ? lerp(0, 0.75, s) : 0;
    }
  } else if (u.idzie) rx = Math.sin(u.t * 11) * 0.45;
  else rx = narz === 'reka' ? 0 : -0.35;
  const k = Math.min(1, dt * 25);
  u.ramie.rotation.x += (rx - u.ramie.rotation.x) * k; u.ramie.rotation.z += (rz - u.ramie.rotation.z) * k;
}
const M_CIEN = new THREE.Matrix4();
// ================= realistyczne postacie (postacie.js) =================
const LUDZ_D = 42, LUDZ_MAKS = 70; // do jakiej odległości kamery i ilu naraz
let ileLudzi = 0;
const MAT_UKRYTY = new THREE.MeshBasicMaterial({ visible: false });
const NARZ_LUDZ = ['siekiera', 'kilof', 'mlotek', 'sierp'];
// który ruch gra postać: praca, walka, chodzenie (szybkość nóg dopasowana do szybkości jednostki), stanie
function ruchLudzia(u, dt) {
  const L = u.ludz, z = u.zad, os = u.typ === 'osadnik';
  L.obj.position.set(u.mesh.position.x, 0, u.mesh.position.z); L.obj.rotation.y = u.mesh.rotation.y;
  let nazwa = 'Idle_Loop', szyb = 1, narz = null;
  if (u.pracuje && z) {
    if (z.typ === 'zbieraj') { if (z.sur === 'drewno') { nazwa = 'TreeChopping_Loop'; narz = 'siekiera'; } else if (z.sur === 'jagody') nazwa = 'Farm_Harvest'; else { nazwa = 'TreeChopping_Loop'; narz = 'kilof'; } }
    else if (z.typ === 'farma') { nazwa = 'Farm_Harvest'; narz = 'sierp'; }
    else if (z.typ === 'buduj' || z.typ === 'naprawiaj') { nazwa = 'Fixing_Kneeling'; narz = 'mlotek'; }
    else if (z.typ === 'modl') nazwa = Math.floor(u.t / LUDZ.dlugosc('Punch_Jab')) % 2 ? 'Punch_Cross' : 'Punch_Jab';
    else if (z.typ === 'atakuj') { nazwa = u.d.zasieg ? 'OverhandThrow' : L.opis.tarcza ? 'Sword_Regular_A' : 'Sword_Attack'; szyb = Math.min(2, Math.max(0.7, LUDZ.dlugosc(nazwa) / Math.max(0.6, u.d.odstep))); }
  } else if (u.idzie) {
    const v = predkosc(u);
    if (os && u.niesie.ile > 0.5) { nazwa = 'Walk_Carry_Loop'; szyb = Math.min(1.9, v / 1.15); }
    else if (v > 1.6) { nazwa = 'Jog_Fwd_Loop'; szyb = v / 2.3; }
    else { nazwa = 'Walk_Loop'; szyb = v / 1.1; }
  } else if (u.d.wojsko && !u.d.zasieg) nazwa = L.opis.tarcza ? 'Idle_Shield_Loop' : 'Sword_Idle';
  if (u.zamarz > S.czas || u.spokoj > S.czas) szyb = u.zamarz > S.czas ? 0 : 0.4;
  L.graj(nazwa, szyb);
  if (os) for (const n of NARZ_LUDZ) if (L.przedmioty[n]) L.przedmioty[n].visible = n === narz;
  L.mixer.update(dt);
}
// co chwilę wybieramy ludzi najbliżej środka widoku: tylko oni są realistycznymi postaciami
const LUDZ_WYBRANI = new Set(); let ludzT = 0;
function wybierzLudzi(dt) {
  if ((ludzT -= dt) > 0) return; ludzT = 0.4;
  LUDZ_WYBRANI.clear();
  if (!LUDZ.sa() || kam.d >= LUDZ_D) return;
  const kand = [];
  for (const u of JED) if (LUDZ.ma(u.typ) && naEkranie(u)) kand.push([(u.x - kam.x) ** 2 + (u.z - kam.z) ** 2, u]);
  kand.sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < Math.min(LUDZ_MAKS, kand.length); i++) LUDZ_WYBRANI.add(kand[i][1]);
}
function rysuj(dt) {
  czasRys += dt;
  ileLudzi = 0; wybierzLudzi(dt);
  rysujCzary(dt);
  ustawKamere();
  if (!CIENIE.parent) scena.add(CIENIE);
  let nc = 0;
  for (const u of JED) { if (nc >= 400) break; const r = u.d.r * 1.35; M_CIEN.makeScale(r, 1, r); M_CIEN.setPosition(u.x, 0.02, u.z); CIENIE.setMatrixAt(nc++, M_CIEN); }
  CIENIE.count = nc; CIENIE.instanceMatrix.needsUpdate = true;
  for (const u of JED) {
    u.t += dt;
    const m = u.mesh;
    let dr = u.ry - m.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); m.rotation.y += dr * Math.min(1, dt * 12);
    // wojsko walczące wręcz: krótki wypad do przodu przy uderzeniu (bez kiwania całym ciałem)
    let wypad = 0;
    if (u.pracuje && u.d.wojsko && !u.d.zasieg) { const f = (u.d.odstep - u.cd) / 0.3; if (f >= 0 && f <= 1) wypad = Math.sin(f * Math.PI) * (u.d.tylkoBudynki ? 0.3 : 0.16); }
    // modlitwa w Gontynie wygląda jak trening boksera: bieg w miejscu i ciosy w powietrze
    const trening = u.pracuje && u.zad && u.zad.typ === 'modl';
    m.position.set(u.x + Math.sin(m.rotation.y) * wypad, u.d.lata ? u.d.lata + Math.sin(u.t * 3) * 0.12 : trening ? Math.abs(Math.sin(u.t * 9)) * 0.09 : u.idzie && !u.d.kupiec ? Math.abs(Math.sin(u.t * 11)) * 0.05 : 0, u.z + Math.cos(m.rotation.y) * wypad);
    if (u.typ === 'osadnik' || u.d.naprawia) ruszReka(u, dt);
    // blisko kamery: realistyczna postać z ruchem (najwyżej LUDZ_MAKS naraz), dalej prosta bryła
    const blisko = LUDZ_WYBRANI.has(u) && naEkranie(u);
    if (blisko && !u.ludz) { u.ludz = LUDZ.stworz(u.typ, u.strona, u.id % 12); if (u.ludz) scena.add(u.ludz.obj); }
    const realna = blisko && !!u.ludz;
    if (u.ludz) u.ludz.obj.visible = realna;
    m.material = realna ? MAT_UKRYTY : MAT;
    if (u.ramie) u.ramie.visible = u.ramie.visible && !realna; if (u.koszBok) u.koszBok.visible = u.koszBok.visible && !realna;
    if (u.piesci) for (const g of u.piesci) g.visible = !realna;
    if (realna) { ileLudzi++; ruchLudzia(u, dt); }
    // krok: nogi i ręce chodzą w rytm szybkości, koła wozów się kręcą
    const v = u.d.szybkosc;
    if (u.idzie) { u.faza += dt * v * (u.d.linia === 'renifer' || u.d.kupiec ? 4.2 : 6.5); u.kolo -= dt * v / 0.21; }
    else if (trening) u.faza += dt * 9;
    u.amp += ((u.idzie || trening ? 1 : 0) - u.amp) * Math.min(1, dt * 8);
    // co niesie osadnik
    if (u.typ === 'osadnik') {
      // stosik na plecach: jedna sztuka na każde 3 niesione (najwyżej 8), więc po ulepszeniu plecaka stos jest wyższy
      const n = u.niesie.ile > 0.5 ? Math.min(8, Math.ceil(u.niesie.ile / 3)) : 0, s = n ? u.niesie.sur + n : null;
      if (s !== u.pokazane) {
        if (u.koszyk) { m.remove(u.koszyk); u.koszyk = null; }
        if (s) { u.koszyk = new THREE.Mesh(MOD.stos(u.niesie.sur, n), MAT); m.add(u.koszyk); }
        u.pokazane = s;
      }
      // realistyczny osadnik niesie stosik przed sobą (w rękach), prosta bryła na plecach
      if (u.koszyk) { if (u.ludz && u.ludz.obj.visible) u.koszyk.position.set(0, 0.62, 0.24); else u.koszyk.position.set(0, 0.55, -0.2); }
    }
    if (u.pierscien) { u.pierscien.position.set(u.x, 0.04, u.z); u.pierscien.visible = wybrane.includes(u); }
  }
  for (const b of BUD) {
    if (!b.gotowy) b.mesh.scale.y = 0.12 + 0.88 * b.postep;
    if (b.plac) b.plac.scale.y = 1 / b.mesh.scale.y;
    if (b.pierscien) { if (b.kom && b.wyg) b.pierscien.position.set(b.wyg[0], 0.05, b.wyg[1]); else b.pierscien.position.set(b.x, 0.05, b.z); b.pierscien.visible = wybrane.includes(b); }
  }
  for (const e of wybrane) { const p = pierscien(e); if (!jestBudynkiem(e) && e.strona == null) p.position.set(e.x, 0.05, e.z); p.visible = true; }
  for (let k = GRUZY.length - 1; k >= 0; k--) { const g = GRUZY[k]; g.t += dt; if (g.t > 240) { g.mesh.position.y -= dt * 0.05; if (g.t > 246) { scena.remove(g.mesh); GRUZY.splice(k, 1); } } }
  for (const sc of SCIETE.values()) {
    if (sc.t < 1) { sc.t = Math.min(1, sc.t + dt / 0.9); if (sc.t >= 1 && !sc.upadlo) { sc.upadlo = true; odglos('drzewo', sc.z0.x, sc.z0.z, 0.9, 0); const ry = sc.g.rotation.y; EF.liscie(sc.z0.x + Math.sin(ry) * 1.3, sc.z0.z + Math.cos(ry) * 1.3); } }
    sc.drz.rotation.x = 1.5 * sc.t * sc.t;
    sc.drz.scale.setScalar(0.35 + 0.65 * Math.max(0, sc.z0.ile / sc.z0.start));
  }
  for (const p of POC) {
    const t = Math.min(1, p.t / p.T), y = p.y0 * (1 - t) + 0.6 * t + Math.sin(t * Math.PI) * 1.2;
    p.mesh.position.set(p.x0 + (p.ox - p.x0) * t, y, p.z0 + (p.oz - p.z0) * t);
  }
  for (let i = UMIERA.length - 1; i >= 0; i--) {
    const u = UMIERA[i]; u.t += dt;
    if (u.j === 2) { u.ludz.mixer.update(dt); if (u.t > 2.2) u.mesh.position.y = -(u.t - 2.2) * 0.5; if (u.t > 3.6) { scena.remove(u.mesh); UMIERA.splice(i, 1); } continue; }
    if (u.j) { u.mesh.rotation.z = Math.min(1, u.t / 0.4) * 1.45; u.mesh.position.y = u.t > 1.2 ? -(u.t - 1.2) * 0.6 : 0; }
    else u.mesh.position.y = -u.t * 1.6;
    if (u.t > (u.j ? 2.4 : 2.5)) { scena.remove(u.mesh); UMIERA.splice(i, 1); }
  }
  if (znacznik && znacznik.visible) { znacznik.userData.t -= dt; const t = znacznik.userData.t; znacznik.scale.setScalar(1 + (0.7 - t) * 1.2); znacznik.material.opacity = Math.max(0, t / 0.7); if (t <= 0) znacznik.visible = false; }
  if (ping) { ping.t -= dt; if (ping.t <= 0) ping = null; }
  const sh = MAT.userData.sh; if (sh) { sh.uniforms.uCzas.value = czasRys; sh.uniforms.uAmp.value = 0; MAT.uniformsNeedUpdate = true; }
  if (!symulacja && S) { emitujEfekty(dt); ruszNiebo(dt, czasRys); }
  if (!CZ_NORM.pts.parent) scena.add(CZ_NORM.pts, CZ_SWIAT.pts);
  const sk = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)));
  CZ_NORM.pts.material.uniforms.uSkala.value = sk; CZ_SWIAT.pts.material.uniforms.uSkala.value = sk;
  aktualizujCzastki(CZ_NORM, dt); aktualizujCzastki(CZ_SWIAT, dt);
  renderer.render(scena, kamera);
  rysujNakladke();
}
// paski życia i ramka zaznaczania (na płaskiej warstwie nad grą)
const NAPISY = [];
function napis(x, y, z, tekst, kolor = '#ffffff') { if (!symulacja) NAPISY.push({ x, y, z, tekst, kolor, t: 0 }); }
function rysujNakladke() {
  const nk = $('nakladka'), c = nk.getContext('2d'), dpr = nk.width / innerWidth;
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = NAPISY.length - 1; i >= 0; i--) {
    const n = NAPISY[i]; n.t += 1 / 60; if (n.t > 1.8) { NAPISY.splice(i, 1); continue; }
    const [x, y, z] = naEkran(n.x, n.y + n.t * 1.2, n.z); if (z > 1) continue;
    c.globalAlpha = Math.min(1, 2 - n.t); c.font = '900 18px Nunito, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(40,30,10,0.8)'; c.fillStyle = n.kolor;
    c.strokeText(n.tekst, x, y); c.fillText(n.tekst, x, y); c.globalAlpha = 1;
  }
  const pasek = (e, h, szer) => {
    const [x, y, z] = naEkran(e.x, h, e.z); if (z > 1 || x < -50 || y < -50 || x > innerWidth + 50 || y > innerHeight + 50) return;
    const w = szer, p = Math.max(0, e.hp / e.max);
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x - w / 2 - 1, y - 1, w + 2, 6);
    c.fillStyle = e.strona !== STRONA_GRACZA ? '#ff5a4a' : '#4cff7a'; c.fillRect(x - w / 2, y, w * p, 4);
  };
  // przy dużej zaznaczonej grupie paski tylko u rannych, żeby nie zlewały się w plamę
  const malaGrupa = wybrane.length <= 6;
  for (const u of JED) if (wybrane.includes(u) && (malaGrupa || u.hp < u.max) || u.hp < u.max && S.czas - (u.trafiony || -99) < 4) pasek(u, (u.d.linia === 'renifer' || u.d.linia === 'kon' ? 2.2 : u.d.mit ? 2.6 : u.d.bohater ? 1.9 : 1.6) + (u.d.lata || 0), 26);
  for (const b of BUD) if (wybrane.includes(b) || b.hp < b.max && (b.gotowy || S.czas - (b.trafiony || -99) < 4)) pasek(b, wysokoscBud(b) + 0.4, 18 + b.w * 9);
  // postęp budowy
  for (const b of BUD) if (!b.gotowy) {
    const [x, y, z] = naEkran(b.x, 0.3, b.z); if (z > 1) continue;
    c.font = '800 13px Nunito, sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.fillStyle = '#fff';
    const t = '🔨 ' + Math.floor(b.postep * 100) + '%'; c.strokeText(t, x, y); c.fillText(t, x, y);
  }
  // punkt zbiórki wybranego budynku
  const b = wybrane[0];
  if (b && jestBudynkiem(b) && b.zbiorka && b.strona === STRONA_GRACZA) {
    const [x, y, z] = naEkran(b.zbiorka.x, 0, b.zbiorka.z);
    if (z < 1) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 26); c.stroke(); c.fillStyle = '#2f6fd6'; c.fillRect(x, y - 26, 14, 9); }
  }
  if (gest && gest.ramka) {
    const { x0, y0, x1, y1 } = gest.ramka;
    c.strokeStyle = '#4cff7a'; c.lineWidth = 2; c.fillStyle = 'rgba(76,255,122,0.12)';
    c.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); c.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
  }
}

// ================= mała mapa =================
let miniBrud = true, miniTlo = null;
const MINI = 120; let MK = (MINI / 2) / (POL * Math.SQRT2);
const naMini = (x, z) => [MINI / 2 + (x - z) / Math.SQRT2 * MK, MINI / 2 + (x + z) / Math.SQRT2 * MK];
function rysujMini() {
  const cv = $('mini'), dpr = 2;
  if (cv.width !== MINI * dpr) { cv.width = cv.height = MINI * dpr; }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (miniBrud || !miniTlo) {
    miniBrud = false;
    miniTlo = document.createElement('canvas'); miniTlo.width = miniTlo.height = MINI * dpr;
    const t = miniTlo.getContext('2d'); t.setTransform(dpr, 0, 0, dpr, 0, 0);
    t.save(); t.translate(MINI / 2, MINI / 2); t.rotate(Math.PI / 4); const s = MK * Math.SQRT2 * 0.999;
    t.fillStyle = motywMapy().mini; t.fillRect(-POL * s / Math.SQRT2 * Math.SQRT2 / Math.SQRT2 * Math.SQRT2 / Math.SQRT2, -POL * s / Math.SQRT2, N * s / Math.SQRT2, N * s / Math.SQRT2);
    t.restore();
    const KT = [null, '#3f8fd0', '#857f74', '#8cc6e2', '#cfe6f5'];
    for (let c = 0; c < N * N; c++) { const tt = TEREN[c]; if (!tt || tt > 4) continue; const [x, y] = naMini(...srodekKom(c)); t.fillStyle = KT[tt]; t.fillRect(x - 0.7, y - 0.7, 1.4, 1.4); }
    const kol = { drzewo: '#2c6e33', krzak: '#3a4bb0', kamien: '#9aa0a8', ruda: '#c4622d', zloto: '#f2c94c' };
    for (const z0 of ZAS.values()) { const [x, y] = naMini(z0.x, z0.z); t.fillStyle = kol[z0.rodzaj]; t.fillRect(x - 0.8, y - 0.8, z0.rodzaj === 'drzewo' ? 1.6 : 2.2, z0.rodzaj === 'drzewo' ? 1.6 : 2.2); }
  }
  c.clearRect(0, 0, MINI, MINI); c.drawImage(miniTlo, 0, 0, MINI, MINI);
  for (const b of BUD) { const [x, y] = naMini(b.x, b.z), r = b.w * MK * 0.75; c.fillStyle = MOD.KOLORY_STRON[b.strona]; c.fillRect(x - r, y - r, r * 2, r * 2); }
  for (const u of JED) { const [x, y] = naMini(u.x, u.z); c.fillStyle = KOLORY_MINI[u.strona] || '#ff6a5a'; c.fillRect(x - 1, y - 1, 2.2, 2.2); }
  // co widać na ekranie: od góry ekranu do panelu na dole (to, co zasłania panel, się nie liczy);
  // ponad horyzontem (gdy kamera jest pochylona) bierzemy ziemię daleko w tę stronę, a obrys przycinamy do mapy
  const dol = dolWidoku(), w = innerWidth, obrys = [];
  for (const [px, py] of [[0, 0], [w / 2, 0], [w, 0], [w, dol / 2], [w, dol], [w / 2, dol], [0, dol], [0, dol / 2]]) {
    const p = naZiemiDaleko(px, py); if (p) obrys.push(naMini(p.x, p.z));
  }
  if (obrys.length > 2) {
    c.save(); c.beginPath(); [[-POL, -POL], [POL, -POL], [POL, POL], [-POL, POL]].forEach(([x, z], i) => { const [a, b] = naMini(x, z); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.closePath(); c.clip();
    c.beginPath(); obrys.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.stroke(); c.restore();
  }
  if (ping) { const [x, y] = naMini(ping.x, ping.z); c.strokeStyle = '#ff3b30'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 4 + (3 - ping.t) * 4 % 8, 0, 7); c.stroke(); }
}

// ================= dotyk: zaznaczanie, rozkazy, przesuwanie mapy =================
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ziemiaPl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function promien(px, py) { ndc.set(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1); ray.setFromCamera(ndc, kamera); return ray.ray; }
function naZiemi(px, py) { ustawKamere(); const p = new THREE.Vector3(); return promien(px, py).intersectPlane(ziemiaPl, p) ? p : null; }
// jak naZiemi, ale gdy promień nie trafia w ziemię albo trafia bardzo daleko (nad horyzontem), daje punkt w tę stronę daleko za mapą
function naZiemiDaleko(px, py) {
  const r = promien(px, py), p = new THREE.Vector3(), maks = N * 1.5;
  if (r.intersectPlane(ziemiaPl, p) && Math.hypot(p.x - kam.x, p.z - kam.z) < maks) return p;
  const kx = r.direction.x, kz = r.direction.z, l = Math.hypot(kx, kz); if (l < 1e-6) return null;
  return p.set(kam.x + kx / l * maks, 0, kam.z + kz / l * maks);
}
const BX = new THREE.Box3(), TRAF = new THREE.Vector3(), PKT = new THREE.Vector3();
function wskaz(px, py) {
  const g = naZiemi(px, py); if (!g) return null;
  const r = promien(px, py), tol = Math.max(0.5, kam.d * 0.02);
  let naj = null, nd = Infinity;
  for (const u of JED) {
    if (Math.abs(u.x - g.x) > 5 || Math.abs(u.z - g.z) > 5) continue;
    PKT.set(u.x, (u.d.linia === 'renifer' || u.d.mit ? 0.95 : 0.55) + (u.d.lata || 0), u.z);
    const rr = u.d.r + tol; if (r.distanceSqToPoint(PKT) < rr * rr) { const d = r.origin.distanceTo(PKT) + (u.strona === STRONA_GRACZA ? 0 : 0.5); if (d < nd) { nd = d; naj = u; } }
  }
  if (naj) return naj;
  for (const b of BUD) {
    if (Math.abs(b.x - g.x) > 10 || Math.abs(b.z - g.z) > 10) continue;
    const gora = b.gotowy ? wysokoscBud(b) : 0.6;
    for (const c of b.kom || [-1]) {
      const [cx, cz0] = c < 0 ? [b.x, b.z] : srodekKom(c), h = c < 0 ? b.w / 2 - 0.1 : 0.45;
      BX.min.set(cx - h, 0, cz0 - h); BX.max.set(cx + h, gora, cz0 + h);
      if (r.intersectBox(BX, TRAF)) { const d = r.origin.distanceTo(TRAF); if (d < nd) { nd = d; naj = b; } }
    }
  }
  if (naj) return naj;
  for (let dj = -4; dj <= 1; dj++) for (let di = -4; di <= 1; di++) {
    const c = kom(g.x + di, g.z + dj); if (c < 0 || blok[c] !== 1) continue;
    const z0 = ZAS.get(naKom[c]); if (!z0) continue;
    BX.min.set(z0.x - 0.5, 0, z0.z - 0.5); BX.max.set(z0.x + 0.5, WYS_ZAS[z0.rodzaj], z0.z + 0.5);
    if (r.intersectBox(BX, TRAF)) { const d = r.origin.distanceTo(TRAF); if (d < nd) { nd = d; naj = z0; } }
  }
  return naj;
}
function zaznacz(lista) {
  if (lista.length) pokazMoce = false;
  for (const e of wybrane) if (e.pierscien) e.pierscien.visible = false;
  wybrane = lista.filter(e => e && (E.get(e.id) === e));
  if (wybrane.length) S.pomoc.zaznaczyl = true;
  odswiezPanel(true);
}
let ostKlik = null;
function klik(px, py) {
  audio();
  if (trybMocy) {
    const g = naZiemi(px, py); if (!g) return;
    const id = trybMocy; trybMocy = null; pokazMoce = false;
    const bl = uzyjMocy(STRONA_GRACZA, id, g.x, g.z); if (bl) { toast(bl); dzwiek('blad'); }
    odswiezPanel(true); odswiezHud(); return;
  }
  if (tryb) { const g = naZiemi(px, py); if (g) przesunDucha(g.x, g.z); return; }
  const cel = wskaz(px, py), g = naZiemi(px, py); if (!g) return;
  const moje = wybrane.filter(e => e.strona === STRONA_GRACZA && !jestBudynkiem(e));
  if (cel && cel.strona === STRONA_GRACZA && !jestBudynkiem(cel)) {
    const t = performance.now();
    if (ostKlik && ostKlik.id === cel.id && t - ostKlik.t < 420) zaznacz(JED.filter(u => u.strona === STRONA_GRACZA && u.typ === cel.typ && naEkranie(u)));
    else zaznacz([cel]);
    ostKlik = { id: cel.id, t }; dzwiek('tak'); return;
  }
  if (moje.length) { rozkaz(moje, cel, g); return; }
  const b = wybrane.length === 1 && jestBudynkiem(wybrane[0]) && wybrane[0].strona === STRONA_GRACZA ? wybrane[0] : null;
  if (b && b.gotowy && produkuje(b) && (!cel || cel.rodzaj || (cel.d.pole || cel.d.gontyna) && cel.strona === STRONA_GRACZA && b.typ === 'ratusz')) {
    b.zbiorka = cel && cel.rodzaj ? { x: cel.x, z: cel.z, zid: cel.id } : cel ? { x: cel.x, z: cel.z, bid: cel.id } : { x: g.x, z: g.z };
    pokazZnacznik(b.zbiorka.x, b.zbiorka.z); dzwiek('rozkaz'); toast('🚩 Tu przyjdą nowi ' + (b.typ === 'ratusz' ? 'osadnicy' : 'żołnierze'));
    return;
  }
  zaznacz(cel ? [cel] : []);
  if (cel) dzwiek('klik');
}
const produkuje = b => b.typ === 'ratusz' || Object.values(JEDNOSTKI).some(d => d.z === b.typ);
function rozkaz(moje, cel, g) {
  dzwiek('rozkaz');
  if (cel && cel.strona != null && wrogowie(STRONA_GRACZA, cel.strona)) {
    for (const u of moje) if (u.d.kupiec) continue; else if (!u.d.tylkoBudynki || jestBudynkiem(cel)) rozkazAtak(u, cel); else rozkazIdz(u, cel.x, cel.z);
    pokazZnacznik(cel.x, cel.z, true); return;
  }
  if (cel && cel.rodzaj) {
    // osadnicy rozchodzą się po kilku krzakach / drzewach obok
    const blisko = ZAS_TYP[cel.sur].filter(z0 => z0.ile > 0 && dyst(z0, cel) < 5 && dostepny(z0)).sort((a, b) => dyst(a, cel) - dyst(b, cel));
    let k = 0;
    for (const u of moje) {
      if (u.typ === 'osadnik') { const z0 = blisko.length ? blisko[Math.floor(k / 2) % Math.min(blisko.length, 4)] : cel; k++; rozkazZbieraj(u, z0 && ZAS.get(z0.id) ? z0 : cel); }
      else rozkazIdz(u, cel.x, cel.z);
    }
    pokazZnacznik(cel.x, cel.z); return;
  }
  if (cel && jestBudynkiem(cel) && cel.strona === STRONA_GRACZA) {
    let rolnik = false;
    for (const u of moje) {
      if (u.d.naprawia && (!cel.gotowy || cel.hp < cel.max)) { cel.gotowy ? rozkazNapraw(u, cel) : rozkazBuduj(u, cel); continue; }
      if (u.typ !== 'osadnik') { rozkazIdz(u, cel.x + losowo(-2, 2), cel.z + cel.w / 2 + 1.5); continue; }
      if (!cel.gotowy || cel.hp < cel.max && !cel.d.pole && false) rozkazBuduj(u, cel);
      else if (cel.d.pole && !rolnik) { rozkazFarma(u, cel); rolnik = true; }
      else if (cel.d.gontyna) rozkazModl(u, cel);
      else if (cel.d.skup && u.niesie.ile > 0 && cel.d.skup.includes(u.niesie.sur)) { u.zad = { typ: 'zbieraj', sur: u.niesie.sur, faza: 'niesie', skup: cel.id, zid: 0, ox: u.x, oz: u.z }; u.sciezka = null; }
      else rozkazIdz(u, cel.x + losowo(-2, 2), cel.z + cel.w / 2 + 1.5);
    }
    pokazZnacznik(cel.x, cel.z); return;
  }
  // zwykły marsz: ustawiają się obok siebie
  const sr = moje.reduce((a, u) => [a[0] + u.x / moje.length, a[1] + u.z / moje.length], [0, 0]);
  const kol = Math.ceil(Math.sqrt(moje.length)), odst = 1.0;
  const posort = [...moje].sort((a, b) => Math.hypot(a.x - sr[0], a.z - sr[1]) - Math.hypot(b.x - sr[0], b.z - sr[1]));
  posort.forEach((u, i) => { const r = Math.floor(i / kol), k = i % kol; rozkazIdz(u, g.x + (k - (kol - 1) / 2) * odst, g.z + (r - (kol - 1) / 2) * odst); });
  pokazZnacznik(g.x, g.z);
}

let gest = null; const palce = new Map();
plotno.addEventListener('pointerdown', e => {
  e.preventDefault(); audio();
  try { plotno.setPointerCapture(e.pointerId); } catch (er) { /* bez przechwycenia */ }
  palce.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (palce.size === 1) {
    gest = { x0: e.clientX, y0: e.clientY, ruch: false, ziemia: naZiemi(e.clientX, e.clientY) };
    // przytrzymanie palca przez 1 sekundę bez ruchu: ramka zaznaczania od tego miejsca
    const g0 = gest;
    clearTimeout(trzymanieT);
    trzymanieT = setTimeout(() => {
      if (gest !== g0 || g0.ruch || palce.size !== 1 || tryb) return;
      g0.ruch = true; g0.ramka = { x0: g0.x0, y0: g0.y0, x1: g0.x0 + 1, y1: g0.y0 + 1 };
      try { navigator.vibrate && navigator.vibrate(25); } catch (er) { /* bez wibracji */ }
      dzwiek('klik');
    }, 1000);
  } else if (palce.size === 2) {
    clearTimeout(trzymanieT);
    const [a, b] = [...palce.values()];
    gest = { szczyp: true, d0: Math.hypot(a.x - b.x, a.y - b.y), kd: kam.d, k0: Math.atan2(b.y - a.y, b.x - a.x), kat0: kam.kat, ziemia: naZiemi((a.x + b.x) / 2, (a.y + b.y) / 2), ruch: true };
  }
});
plotno.addEventListener('pointermove', e => {
  if (!palce.has(e.pointerId) || !gest) return;
  palce.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (gest.szczyp && palce.size >= 2) {
    const [a, b] = [...palce.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    kam.d = gest.kd * gest.d0 / Math.max(20, d);
    // obracanie mapy: obrót palców obraca widok
    let dk = Math.atan2(b.y - a.y, b.x - a.x) - gest.k0; dk = Math.atan2(Math.sin(dk), Math.cos(dk));
    kam.kat = gest.kat0 + dk; ustawKamere();
    const g = naZiemi((a.x + b.x) / 2, (a.y + b.y) / 2);
    if (g && gest.ziemia) { kam.x += gest.ziemia.x - g.x; kam.z += gest.ziemia.z - g.z; ustawKamere(); }
    return;
  }
  if (palce.size !== 1 || gest.szczyp) return;
  if (!gest.ruch && Math.hypot(e.clientX - gest.x0, e.clientY - gest.y0) > 10) {
    gest.ruch = true; clearTimeout(trzymanieT);
    if (tryb) { gest.duch = true; if (tryb.mur && gest.ziemia) gest.startMuru = { x: gest.ziemia.x, z: gest.ziemia.z }; }
    else if (trybObszar) gest.ramka = { x0: gest.x0, y0: gest.y0, x1: e.clientX, y1: e.clientY };
  }
  if (!gest.ruch) return;
  if (gest.duch) {
    const g = naZiemi(e.clientX, e.clientY - (tryb && tryb.mur ? 0 : 40));
    if (g) { przesunDucha(g.x, g.z, gest.startMuru); gest.startMuru = null; }
    return;
  }
  if (gest.ramka) { gest.ramka.x1 = e.clientX; gest.ramka.y1 = e.clientY; return; }
  const g = naZiemi(e.clientX, e.clientY);
  if (g && gest.ziemia) { kam.x += gest.ziemia.x - g.x; kam.z += gest.ziemia.z - g.z; ustawKamere(); }
});
let trzymanieT = 0;
function puscPalec(e) {
  clearTimeout(trzymanieT);
  if (!palce.has(e.pointerId)) return;
  palce.delete(e.pointerId);
  if (!gest) return;
  if (palce.size > 0) { if (gest.szczyp && palce.size === 1) { const [a] = [...palce.values()]; gest = { x0: a.x, y0: a.y, ruch: true, poSzczyp: true, ziemia: naZiemi(a.x, a.y) }; } return; }
  if (gest.ramka) {
    const { x0, y0, x1, y1 } = gest.ramka, xa = Math.min(x0, x1), xb = Math.max(x0, x1), ya = Math.min(y0, y1), yb = Math.max(y0, y1);
    const lista = JED.filter(u => { if (u.strona !== STRONA_GRACZA) return false; const [x, y, z] = naEkran(u.x, 0.5, u.z); return z < 1 && x >= xa && x <= xb && y >= ya && y <= yb; });
    const woj = lista.filter(u => u.d.wojsko);
    zaznacz(woj.length ? woj : lista); if (lista.length) dzwiek('tak');
    trybObszar = false; $('b-obszar').classList.remove('wl');
  } else if (!gest.ruch && !gest.szczyp && !gest.poSzczyp) klik(e.clientX, e.clientY);
  gest = null;
}
plotno.addEventListener('pointerup', puscPalec);
plotno.addEventListener('pointercancel', e => { palce.delete(e.pointerId); if (!palce.size) gest = null; });
plotno.addEventListener('wheel', e => { e.preventDefault(); kam.d *= Math.exp(e.deltaY * 0.0012); ustawKamere(); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
// mała mapa: dotknięcie przenosi widok
function miniDotyk(e) {
  const r = $('mini').getBoundingClientRect(), px = (e.clientX - r.left) / r.width * MINI, py = (e.clientY - r.top) / r.height * MINI;
  const u = (px - MINI / 2) / MK, v = (py - MINI / 2) / MK;
  kam.x = (u + v) / Math.SQRT2; kam.z = (v - u) / Math.SQRT2; ustawKamere();
}
$('mini').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); miniDotyk(e); $('mini').setPointerCapture(e.pointerId); });
$('mini').addEventListener('pointermove', e => { if (e.buttons || e.pressure) miniDotyk(e); });

// ---------- stawianie budynku ----------
// mur: przeciągasz palcem linię od początku do końca, każda kratka to jeden odcinek
const MAKS_MUR = 40;
function linia(i0, j0, i1, j1) {
  const out = [], dx = Math.abs(i1 - i0), dy = Math.abs(j1 - j0), sx = i0 < i1 ? 1 : -1, sy = j0 < j1 ? 1 : -1;
  let e = dx - dy, i = i0, j = j0;
  for (;;) { out.push([i, j]); if (out.length >= MAKS_MUR || i === i1 && j === j1) break; const e2 = 2 * e; if (e2 > -dy) { e -= dy; i += sx; } if (e2 < dx) { e += dx; j += sy; } if (e2 > -dy && e2 < dx) out.push([i - sx, j]); }
  return out.filter((p, k, a) => a.findIndex(q => q[0] === p[0] && q[1] === p[1]) === k).slice(0, MAKS_MUR);
}
function zacznijMur() {
  const duch = new THREE.InstancedMesh(MOD.budynek('mur', STRONA_GRACZA), new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false }), MAKS_MUR);
  duch.count = 0; duch.frustumCulled = false; duch.renderOrder = 3; scena.add(duch);
  tryb = { typ: 'mur', mur: true, duch, plama: new THREE.Group(), A: null, B: null, odcinki: [], ok: false };
  const g = naZiemi(innerWidth / 2, innerHeight * 0.45) || { x: kam.x, z: kam.z };
  ustawMur(g.x, g.z, g.x, g.z, true);
  $('panel').hidden = true; $('stawianie').hidden = false;
}
function ustawMur(ax, az, bx, bz, podglad = false) {
  const A = [Math.floor(ax + POL), Math.floor(az + POL)], B = [Math.floor(bx + POL), Math.floor(bz + POL)];
  tryb.A = A; tryb.B = B; tryb.podglad = podglad;
  tryb.odcinki = linia(A[0], A[1], B[0], B[1]).map(([i, j]) => ({ i, j, ok: miejsceWolne('mur', i, j) }));
  // odcinki rozkładamy równo na prostej od pierwszej do ostatniej kratki, obrócone wzdłuż niej (mur może iść po skosie)
  const n0 = tryb.odcinki.length, p = tryb.odcinki[0], q = tryb.odcinki[n0 - 1], dx = q.i - p.i, dz = q.j - p.j;
  const kat = n0 > 1 ? Math.atan2(-dz, dx) : 0, dl = n0 > 1 ? Math.hypot(dx, dz) / (n0 - 1) : 1;
  tryb.odcinki.forEach((o, k) => { const t = n0 > 1 ? k / (n0 - 1) : 0; o.wyg = [p.i - POL + 0.5 + dx * t, p.j - POL + 0.5 + dz * t, kat, dl]; });
  const m = new THREE.Matrix4(), kz = new THREE.Color('#9dffb0'), kc = new THREE.Color('#ff7a6a');
  const OB = new THREE.Quaternion(), OS = new THREE.Vector3(), OP = new THREE.Vector3(), OY = new THREE.Vector3(0, 1, 0);
  tryb.odcinki.forEach((o, k) => { OP.set(o.wyg[0], 0, o.wyg[1]); OB.setFromAxisAngle(OY, kat); OS.set(dl, 1, 1); m.compose(OP, OB, OS); tryb.duch.setMatrixAt(k, m); tryb.duch.setColorAt(k, o.ok ? kz : kc); });
  tryb.duch.count = tryb.odcinki.length; tryb.duch.instanceMatrix.needsUpdate = true; if (tryb.duch.instanceColor) tryb.duch.instanceColor.needsUpdate = true;
  const n = tryb.odcinki.filter(o => o.ok).length, koszt = n * BUDYNKI.mur.koszt.drewno;
  tryb.ok = n > 0 && !podglad && S.zas[0].drewno >= BUDYNKI.mur.koszt.drewno;
  $('st-tekst').textContent = podglad ? '🪵 Palisada: przeciągnij palcem od początku do końca muru'
    : `🪵 Palisada: ${n} ${n === 1 ? 'odcinek' : n < 5 ? 'odcinki' : 'odcinków'}, ${koszt} drewna${n < tryb.odcinki.length ? ' (czerwone się nie zmieszczą)' : ''}`;
  $('st-tak').disabled = !tryb.ok;
}
function zacznijStawianie(typ) {
  const br = brakBudynku(STRONA_GRACZA, typ); if (br) { toast(br); dzwiek('blad'); return; }
  if (!stac(STRONA_GRACZA, BUDYNKI[typ].koszt)) { toast('Za mało surowców'); dzwiek('blad'); return; }
  $('st-obroc').hidden = typ !== 'brama';
  if (BUDYNKI[typ].mur) { zacznijMur(); return; }
  const duch = new THREE.Mesh(MOD.budynek(typ, STRONA_GRACZA), new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false }));
  const w = BUDYNKI[typ].w, plama = new THREE.Mesh(new THREE.PlaneGeometry(w, w).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#4cff7a', transparent: true, opacity: 0.35, depthWrite: false }));
  plama.renderOrder = 2; duch.renderOrder = 3;
  scena.add(duch, plama);
  tryb = { typ, duch, plama, i0: 0, j0: 0, ok: false, kier: 0, kierAuto: true };
  // pierwsze miejsce: wolne miejsce najbliżej środka ekranu
  const g = naZiemi(innerWidth / 2, innerHeight * 0.45) || { x: kam.x, z: kam.z };
  const m = aiMiejsce(typ, g.x, g.z, 0, 8, 0);
  przesunDucha(m ? m[0] - POL + w / 2 : g.x, m ? m[1] - POL + w / 2 : g.z);
  $('panel').hidden = true; $('stawianie').hidden = false;
}
function przesunDucha(x, z, start) {
  if (tryb.mur) {
    // pierwszy dotyk wybiera początek muru, kolejne ruchy palca: koniec
    if (start || tryb.podglad) { const s = start || { x, z }; ustawMur(s.x, s.z, x, z); }
    else ustawMur(tryb.A[0] - POL + 0.5, tryb.A[1] - POL + 0.5, x, z);
    return;
  }
  if (tryb.typ === 'brama') { ustawDuchaBramy(x, z); return; }
  const w = BUDYNKI[tryb.typ].w;
  tryb.i0 = Math.round(x + POL - w / 2); tryb.j0 = Math.round(z + POL - w / 2);
  const cx = tryb.i0 - POL + w / 2, cz = tryb.j0 - POL + w / 2;
  tryb.duch.position.set(cx, 0, cz); tryb.plama.position.set(cx, 0.05, cz);
  tryb.ok = miejsceWolne(tryb.typ, tryb.i0, tryb.j0);
  tryb.plama.material.color.set(tryb.ok ? '#4cff7a' : '#ff4a3a');
  tryb.duch.material.color.set(tryb.ok ? '#ffffff' : '#ff8a80');
  $('st-tekst').textContent = tryb.ok ? `${BUDYNKI[tryb.typ].emoji} ${BUDYNKI[tryb.typ].nazwa}: przesuń palcem i postaw` : '❌ Tu nie można: coś tu stoi albo rośnie';
  $('st-tak').disabled = !tryb.ok;
}
// brama blisko muru wskakuje w jego linię: szukamy miejsca (do 2 kratek od palca), gdzie najwięcej kratek bramy to twój mur,
// a reszta jest wolna; zwraca środkową kratkę albo null, gdy muru nie ma obok
function bramaWMurze(i0, j0, kier) {
  let naj = null, najW = 0, najD = 1e9;
  for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
    const i = i0 + di, j = j0 + dj; let w = 0, ok = true;
    for (const [a, c] of kratkiBramy(i, j, kier)) {
      const o = E.get(naKom[kom2(a, c)]);
      if (o && o.strona === STRONA_GRACZA && o.d && o.d.mur) w++; else if (!miejsceWolne('mur', a, c)) { ok = false; break; }
    }
    const d = di * di + dj * dj;
    if (ok && w >= 2 && (w > najW || w === najW && d < najD)) { naj = [i, j]; najW = w; najD = d; }
  }
  return naj;
}
// brama: 4 kratki w poprzek przejścia; postawiona w murze zastępuje jego kawałki (wraca połowa ich ceny)
function ustawDuchaBramy(x, z) {
  let i = Math.floor(x + POL), j = Math.floor(z + POL);
  if (tryb.kierAuto) tryb.kier = kierunekBramy(i, j);
  const wMurze = bramaWMurze(i, j, tryb.kier); if (wMurze) [i, j] = wMurze;
  const kr = kratkiBramy(i, j, tryb.kier), wyg = wygladBramy(kr, tryb.kier);
  // w murze brama stoi dokładnie na linii muru (skośny mur idzie schodkami)
  const m = wMurze && murObok(i, j);
  if (m && m.wyg && kierZKata(-m.wyg[2]) === tryb.kier) {
    const ux = Math.cos(m.wyg[2]), uz = -Math.sin(m.wyg[2]), t = (wyg[0] - m.wyg[0]) * ux + (wyg[1] - m.wyg[1]) * uz;
    wyg[0] = m.wyg[0] + ux * t; wyg[1] = m.wyg[1] + uz * t;
  }
  let mury = 0;
  tryb.i0 = i; tryb.j0 = j; tryb.kr = kr; tryb.wyg = wyg;
  tryb.ok = kr.every(([a, c]) => {
    if (miejsceWolne('mur', a, c)) return true;
    const o = E.get(naKom[kom2(a, c)]); if (o && o.strona === STRONA_GRACZA && o.d.mur) { mury++; return true; }
    return false;
  });
  tryb.duch.position.set(wyg[0], 0, wyg[1]); tryb.duch.rotation.y = wyg[2]; tryb.duch.scale.x = wyg[3] / SZER_MODELU_BRAMY;
  tryb.plama.position.set(wyg[0], 0.05, wyg[1]); tryb.plama.rotation.y = wyg[2]; tryb.plama.scale.set(wyg[3], 1, 1);
  tryb.plama.material.color.set(tryb.ok ? '#4cff7a' : '#ff4a3a');
  tryb.duch.material.color.set(tryb.ok ? '#ffffff' : '#ff8a80');
  $('st-tekst').textContent = tryb.ok ? `🚪 Brama na 4 kratki${mury ? ' (wpasuje się w mur)' : ''}: przesuń palcem, 🔄 obraca` : '❌ Tu nie można: coś tu stoi albo rośnie';
  $('st-tak').disabled = !tryb.ok;
}
$('st-obroc').onclick = () => {
  if (!tryb || tryb.typ !== 'brama') return;
  dzwiek('klik'); tryb.kierAuto = false; tryb.kier = (tryb.kier + 1) % 4;
  ustawDuchaBramy(tryb.i0 - POL + 0.5, tryb.j0 - POL + 0.5);
};
function zakonczStawianie() {
  if (!tryb) return;
  scena.remove(tryb.duch, tryb.plama); tryb.duch.material.dispose(); if (tryb.plama.geometry) { tryb.plama.geometry.dispose(); tryb.plama.material.dispose(); }
  tryb = null; $('stawianie').hidden = true; $('st-obroc').hidden = true; $('panel').hidden = false; odswiezPanel(true);
}
$('st-anuluj').onclick = () => { dzwiek('klik'); zakonczStawianie(); };
$('st-tak').onclick = () => {
  if (!tryb || !tryb.ok) return;
  const typ = tryb.typ;
  if (tryb.mur) {
    const nowe = [];
    for (const o of tryb.odcinki) if (o.ok && miejsceWolne('mur', o.i, o.j) && zaplac(STRONA_GRACZA, BUDYNKI.mur.koszt)) nowe.push(nowyBudynek(STRONA_GRACZA, 'mur', o.i, o.j, false, undefined, 1, o.wyg));
    if (!nowe.length) { toast('Za mało drewna'); dzwiek('blad'); return; }
    if (nowe.length < tryb.odcinki.filter(o => o.ok).length) toast('Starczyło drewna na ' + nowe.length + ' odcinków');
    const bud = wybrane.filter(u => u.typ === 'osadnik');
    bud.forEach((u, k) => rozkazBuduj(u, [...nowe].sort((a, c) => dyst(a, u) - dyst(c, u))[Math.min(k, nowe.length - 1)]));
    dzwiek('rozkaz'); zakonczStawianie(); return;
  }
  if (!stac(STRONA_GRACZA, BUDYNKI[typ].koszt)) { toast('Za mało surowców'); dzwiek('blad'); return; }
  if (typ === 'brama') {
    // kawałki twojego muru w miejscu bramy znikają (wraca połowa ich ceny)
    for (const [a, c] of tryb.kr) { const o = E.get(naKom[kom2(a, c)]); if (o && o.strona === STRONA_GRACZA && o.d.mur) zburzWlasny(o); }
    if (!tryb.kr.every(([a, c]) => miejsceWolne('mur', a, c))) { toast('Tu nie można'); dzwiek('blad'); return; }
  }
  zaplac(STRONA_GRACZA, BUDYNKI[typ].koszt);
  const b = typ === 'brama' ? nowyBudynek(STRONA_GRACZA, typ, tryb.i0, tryb.j0, false, undefined, 1, tryb.wyg, tryb.kier, SZER_BRAMY) : nowyBudynek(STRONA_GRACZA, typ, tryb.i0, tryb.j0);
  for (const u of wybrane) if (u.typ === 'osadnik') rozkazBuduj(u, b);
  dzwiek('rozkaz'); zakonczStawianie();
};

// ================= panel na dole =================
function kosztHTML(k, strona = STRONA_GRACZA) {
  return Object.entries(k).map(([s, v]) => `<span class="${S.zas[strona][s] >= v ? '' : 'brak'}">${EMOJI_SUR[s]}${v}</span>`).join('');
}
let panelKlucz = '';
function odswiezPanel(wymus = false) {
  if (!S) return;
  wybrane = wybrane.filter(e => E.get(e.id) === e);
  const p = $('p-akcje'), info = $('p-info');
  const sel = wybrane, pierwszy = sel[0];
  const kEra = wybrane.length === 1 && wybrane[0].typ === 'ratusz' && wybrane[0].strona === 0 ? (brakiEry(0) || []).join(',') : '';
  const klucz = kEra + (pokazMoce ? 'M' + S.moce[0].map(m => m.uzyta ? 1 : 0).join('') : '') + sel.map(e => e.id).join(',') + '|' + S.era[0] + '|' + (pierwszy && jestBudynkiem(pierwszy) ? pierwszy.gotowy + ':' + (pierwszy.poziom || 1) + ':' + (pierwszy.zamk ? 1 : 0) + ':' + pierwszy.kolejka.map(q => q.typ).join('.') + ':' + Object.keys(S.ul[0]).join('.') : '');
  if (!wymus && klucz === panelKlucz) { aktualizujPanel(); return; }
  panelKlucz = klucz;
  let h = '', a = '', zburzHTML = '';
  if (!sel.length && pokazMoce) {
    h = `<div class="p-glowa"><span class="p-ik">⚡</span><div><b>Moce bogów</b><small>Każdej mocy możesz użyć tylko raz w grze</small></div><button class="p-x" data-a="moce-zamknij">✖</button></div>`;
    for (const m of S.moce[0]) {
      const d = MOCE[m.id], bg = Object.values(BOGOWIE).find(b => b.moc === m.id);
      a += `<button class="akcja${m.uzyta ? ' zablok' : ''}" data-a="moc:${m.id}"><span class="ak-ik">${d.emoji}</span><b>${d.nazwa}</b><small>${m.uzyta ? '✓ już użyta' : d.opis + (d.cel ? ' · potem dotknij miejsca na mapie' : '')}${bg ? ' · ' + bg.emoji + ' ' + bg.nazwa : ''}</small></button>`;
    }
  } else if (!sel.length) {
    // nic nie wybrane: panel zwinięty do jednego paska (podpowiedź o sterowaniu tylko przez pierwsze 3 minuty gry)
    h = `<div class="p-nic">👆 Dotknij osadnika albo budynku${S.czas < 180 ? '<br><small>Przesuwaj palcem mapę, dwoma palcami przybliżaj i obracaj, przytrzymaj palec, żeby zaznaczyć ramką.</small>' : ''}</div>`;
  } else if (pierwszy.rodzaj) {
    h = `<div class="p-glowa"><span class="p-ik">${EMOJI_SUR[pierwszy.sur]}</span><div><b>${{ drzewo: 'Drzewo', krzak: 'Krzak z jagodami', kamien: 'Kamień', ruda: 'Ruda darniowa', zloto: 'Srebro' }[pierwszy.rodzaj]}</b><small data-ile>Zostało: ${Math.ceil(pierwszy.ile)}</small></div></div>`;
  } else if (jestBudynkiem(pierwszy)) {
    const b = pierwszy, moj = b.strona === STRONA_GRACZA;
    h = `<div class="p-glowa"><span class="p-ik">${emojiBud(b)}</span><div><b>${nazwaBud(b)}${moj ? '' : ' (komputer)'}</b><small data-hp>❤️ ${Math.ceil(b.hp)} / ${b.max}</small><div class="p-hp"><i data-hpb style="width:${b.hp / b.max * 100}%"></i></div></div><button class="p-x" data-a="odznacz">✖</button></div>`;
    zburzHTML = moj && !(b.typ === 'ratusz' && BUD.filter(o => o.strona === 0 && o.typ === 'ratusz').length < 2)
      ? `<button class="akcja maly zburz" data-a="zburz"><span class="ak-ik">💥</span><b>Zburz</b><small>${!b.gotowy && b.postep < 0.02 ? 'wraca całość' : 'wraca połowa'}</small></button>` : '';
    if (moj && !b.gotowy) h += `<div class="p-opis">Plac budowy: zaznacz osadników i dotknij go, żeby budowali.</div>`;
    else if (moj) {
      h += `<div class="p-opis">${b.d.opis}${b.d.pole ? (wolnePole(b) ? ' · nikt tu nie pracuje' : ' · pracuje tu osadnik') : ''}${produkuje(b) ? ' · dotknij ziemi, żeby wskazać, dokąd mają iść nowi' : ''}</div>`;
      // pokazujemy tylko to, co da się zrobić już teraz (brak surowców widać po kolorze ceny); w Grodzie najpierw nowa era
      const aEra = a; a = '';
      const typy = typyBudynku(0, b.typ).filter(t => !brakJednostki(0, t));
      for (const t of typy) {
        const d = JEDNOSTKI[t], br = null;
        a += `<button class="akcja${br ? ' zablok' : ''}" data-a="szkol:${t}" data-koszt='${JSON.stringify(d.koszt)}'><span class="ak-ik">${d.emoji}</span><b>${d.nazwa}</b><small>${br || d.opis}</small><span class="ak-koszt">${kosztHTML(d.koszt)}</span></button>`;
      }
      { const aJ = a; a = aEra;
      if (b.typ === 'ratusz' && NOWA_ERA[S.era[0] + 1]) {
        const nast = S.era[0] + 1, ne = NOWA_ERA[nast], trwa = b.kolejka.find(q => q.rodzaj === 'era'), braki = brakiEry(0);
        if (trwa) h += `<div class="p-opis">⏳ ${BOGOWIE[trwa.typ] ? BOGOWIE[trwa.typ].emoji + ' ' + BOGOWIE[trwa.typ].nazwa + ': ' : ''}przechodzisz do ery ${nast}: ${ERY[nast]}</div>`;
        else if (braki.length) {
          h += `<div class="p-opis">🔒 Do ery ${nast} (${ERY[nast]}) brakuje: ${braki.join(', ')}</div>`;
          a += `<button class="akcja era zablok" data-a="era-brak"><span class="ak-ik">${EMOJI_ERY[nast]}</span><b>Era ${nast}: ${ERY[nast]}</b><small>Brakuje: ${braki.join(', ')}</small><span class="ak-koszt">${kosztHTML(ne.koszt)}</span></button>`;
        } else {
          h += `<div class="p-opis">⬆️ Możesz przejść do ery ${nast}: ${ERY[nast]}. Wybierz boga:</div>`;
          for (const id of bogowieEry(0)) {
            const bg = BOGOWIE[id], st = JEDNOSTKI[bg.stwor], mc = MOCE[bg.moc];
            a += `<button class="akcja era bog" data-a="era:${id}" data-koszt='${JSON.stringify(ne.koszt)}'><span class="ak-ik">${bg.emoji}</span><b>Era ${nast} z bogiem ${bg.nazwa}</b><small>${bg.kim}. Moc: ${mc.emoji} ${mc.nazwa}. Stwór: ${st.emoji} ${st.nazwa}. ${bg.bonus}</small><span class="ak-koszt">${kosztHTML(ne.koszt)}</span></button>`;
          }
        }
      }
      a += aJ; }
      if (b.d.gontyna) {
        const ilu = JED.filter(u => u.strona === 0 && u.zad && u.zad.typ === 'modl' && u.zad.bid === b.id).length;
        h += `<div class="p-opis">🙏 Modli się: ${ilu} (liczy się do ${LASKA.modlacychNaGontyne}) · ✨ ${(Math.min(ilu, LASKA.modlacychNaGontyne) * tempoLaski(0) * 60).toFixed(0)} łaski na minutę · zaznacz osadników i dotknij Gontyny, żeby się modlili</div>`;
      }
      if (b.d.brama) a += `<button class="akcja era" data-a="brama"><span class="ak-ik">${b.zamk ? '🔓' : '🔒'}</span><b>${b.zamk ? 'Otwórz bramę' : 'Zamknij bramę'}</b><small>${b.zamk ? 'Zamknięta: nikt nie przejdzie, także twoi' : 'Otwarta: twoi przechodzą, wrogowie nigdy'}</small></button>`;
      if (b.typ === 'jarmark') {
        const dom = domHandlu(0, b);
        h += `<div class="p-opis">${dom ? `Kurs wozu do ${dom.d.nazwa.toLowerCase()} daje ${zyskKursu(b, dom)} 🪙 (im dalej, tym więcej)` : 'Wozy potrzebują spichlerza albo Grodu'}</div>`;
        for (const s of ['jagody', 'drewno', 'kamien', 'zelazo']) {
          const kup = cenaKupna(0, s), sp = cenaSprzedazy(0, s);
          a += `<button class="akcja" data-a="kup:${s}" data-koszt='${JSON.stringify({ zloto: kup })}'><span class="ak-ik">${EMOJI_SUR[s]}</span><b>Kup 100</b><small>${NAZWY_SUR[s]}</small><span class="ak-koszt">${kosztHTML({ zloto: kup })}</span></button>`;
          a += `<button class="akcja" data-a="sprz:${s}" data-koszt='${JSON.stringify({ [s]: HANDEL.ilosc })}'><span class="ak-ik">🪙</span><b>Sprzedaj 100 ${EMOJI_SUR[s]}</b><small>dostaniesz ${sp} 🪙</small><span class="ak-koszt">${kosztHTML({ [s]: HANDEL.ilosc })}</span></button>`;
        }
      }
      if (b.typ === 'wieza' && WIEZA_POZIOMY[(b.poziom || 1) + 1]) {
        const nast = WIEZA_POZIOMY[(b.poziom || 1) + 1], br = brakRozbudowy(b);
        if (br !== 'w trakcie') a += `<button class="akcja era${br ? ' zablok' : ''}" data-a="rozb" data-koszt='${JSON.stringify(nast.koszt)}'><span class="ak-ik">${nast.emoji}</span><b>Rozbuduj: ${nast.nazwa}</b><small>${br || nast.opis}</small><span class="ak-koszt">${kosztHTML(nast.koszt)}</span></button>`;
      }
      for (const [id, d] of Object.entries(ULEPSZENIA)) if (d.z === b.typ) {
        // pokazujemy tylko ulepszenia, które można zrobić teraz: następne w kolejce (np. drugi plecak) pojawia się dopiero po poprzednim, późniejsze ery dopiero w swojej erze
        const br = brakUlepszenia(0, id); if (br === 'gotowe' || br === 'w trakcie' || br && br.startsWith('🔒')) continue;
        a += `<button class="akcja${br ? ' zablok' : ''}" data-a="ul:${id}" data-koszt='${JSON.stringify(d.koszt)}'><span class="ak-ik">${d.emoji}</span><b>${d.nazwa}</b><small>${br || d.opis}</small><span class="ak-koszt">${kosztHTML(d.koszt)}</span></button>`;
      }
      if (b.kolejka.length) {
        h += `<div class="p-kolejka">` + b.kolejka.map((q, i) => `<button class="kol" data-a="anuluj:${i}" title="Anuluj"><span>${q.rodzaj === 'j' ? JEDNOSTKI[q.typ].emoji : q.rodzaj === 'u' ? ULEPSZENIA[q.typ].emoji : q.rodzaj === 'rozb' ? WIEZA_POZIOMY[(b.poziom || 1) + 1].emoji : BOGOWIE[q.typ] ? BOGOWIE[q.typ].emoji : EMOJI_ERY[S.era[0] + 1]}</span><i data-kol="${i}" style="width:${q.t / q.czas * 100}%"></i></button>`).join('') + `<small data-czeka></small></div>`;
      }
    }
  } else {
    const moje = sel.filter(e => e.strona === STRONA_GRACZA), wrogi = !moje.length;
    const typy = {}; for (const u of sel) typy[u.typ] = (typy[u.typ] || 0) + 1;
    if (sel.length === 1) {
      const u = pierwszy;
      h = `<div class="p-glowa"><span class="p-ik">${u.d.emoji}</span><div><b>${u.d.nazwa}${wrogi ? ' (komputer)' : ''}</b><small data-hp>❤️ ${Math.ceil(u.hp)} / ${u.max} · ⚔️ ${atakJ(u)} · 🛡️ ${pancerzJ(u)}</small><div class="p-hp"><i data-hpb style="width:${u.hp / u.max * 100}%"></i></div></div><button class="p-x" data-a="odznacz">✖</button></div>`;
    } else {
      h = `<div class="p-glowa"><div class="p-grupa">${Object.entries(typy).map(([t, n]) => `<span>${JEDNOSTKI[t].emoji}×${n}</span>`).join('')}</div><button class="p-x" data-a="odznacz">✖</button></div>`;
    }
    if (!wrogi) {
      if (moje.some(u => u.typ === 'osadnik')) {
        h += `<div class="p-opis">Dotknij krzaka, drzewa albo skały. Albo postaw:</div>`;
        for (const t of KOLEJNOSC_BUDYNKOW) {
          const d = BUDYNKI[t], br = brakBudynku(0, t);
          a += `<button class="akcja${br ? ' zablok' : ''}" data-a="bud:${t}" data-koszt='${JSON.stringify(d.koszt)}'><span class="ak-ik">${d.emoji}</span><b>${d.nazwa}</b><small>${br || d.opis}</small><span class="ak-koszt">${kosztHTML(d.koszt)}</span></button>`;
        }
      } else if (moje.every(u => u.d.naprawia)) h += `<div class="p-opis">🔨 Sam szuka uszkodzonych budynków i je naprawia: połowa ceny budynku, dwa razy dłużej niż budowa. Dotknij budynku, żeby naprawił właśnie ten.</div>`;
      else h += `<div class="p-opis">Dotknij wroga, żeby atakować, albo ziemi, żeby iść. Tryb walki:</div>`;
      const woj = moje.filter(u => u.d.wojsko);
      if (woj.length) for (const [k, p] of Object.entries(POSTAWY)) {
        const wszyscy = woj.every(u => (u.postawa || 'agresja') === k);
        a += `<button class="akcja postawa${wszyscy ? ' wybrana' : ''}" data-a="postawa:${k}"><span class="ak-ik">${p.emoji}</span><b>${p.nazwa}${wszyscy ? ' ✓' : ''}</b><small>${p.opis}</small></button>`;
      }
      a = `<button class="akcja maly" data-a="stop"><span class="ak-ik">✋</span><b>Stój</b></button>` + a;
    }
  }
  a += zburzHTML;
  info.innerHTML = h; p.innerHTML = a; p.scrollLeft = 0; $('panel').classList.toggle('zwiniety', !sel.length && !pokazMoce);
  aktualizujPanel();
}
function aktualizujPanel() {
  const e = wybrane[0]; if (!e) return;
  const info = $('p-info');
  const hp = info.querySelector('[data-hp]'), hpb = info.querySelector('[data-hpb]');
  if (hp && e.hp != null) hp.textContent = jestBudynkiem(e) ? `❤️ ${Math.ceil(e.hp)} / ${e.max}${e.gotowy ? '' : ' · budowa ' + Math.floor(e.postep * 100) + '%'}` : `❤️ ${Math.ceil(e.hp)} / ${e.max} · ⚔️ ${atakJ(e)} · 🛡️ ${pancerzJ(e)}`;
  if (hpb) hpb.style.width = Math.max(0, e.hp / e.max * 100) + '%';
  const ile = info.querySelector('[data-ile]'); if (ile && e.rodzaj) ile.textContent = 'Zostało: ' + Math.ceil(e.ile);
  if (jestBudynkiem(e)) {
    e.kolejka.forEach((q, i) => { const k = info.querySelector(`[data-kol="${i}"]`); if (k) k.style.width = Math.min(100, q.t / q.czas * 100) + '%'; });
    const cz = info.querySelector('[data-czeka]'); if (cz) cz.textContent = e.kolejka[0] && e.kolejka[0].czeka ? '🏠 Brak miejsca: zbuduj dom' : '';
  }
  for (const b of $('p-akcje').querySelectorAll('[data-koszt]')) {
    const k = JSON.parse(b.dataset.koszt);
    b.classList.toggle('drogo', !stac(STRONA_GRACZA, k));
    b.querySelectorAll('.ak-koszt span').forEach((s, i) => { const [sur, v] = Object.entries(k)[i]; s.classList.toggle('brak', S.zas[0][sur] < v); });
  }
}
let zburzPyt = 0, zburzPytT = 0;
// mapka i przyciski z boku stoją zawsze nad okienkiem na dole (okienko rośnie, gdy jest kolejka albo wysokie przyciski)
if (window.ResizeObserver) { const ro = new ResizeObserver(() => { const p = $('panel').hidden ? $('stawianie') : $('panel'); document.documentElement.style.setProperty('--panel-h', p.offsetHeight + 'px'); }); ro.observe($('panel')); ro.observe($('stawianie')); }
$('panel').addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b || !S) return;
  audio();
  const [akcja, arg] = b.dataset.a.split(':'), cel = wybrane[0];
  if (akcja === 'odznacz') { zaznacz([]); dzwiek('klik'); return; }
  if (akcja === 'era-brak') { toast('🔒 Do nowej ery brakuje: ' + (brakiEry(0) || []).join(', ')); dzwiek('blad'); return; }
  if (akcja === 'moce-zamknij') { pokazMoce = false; trybMocy = null; dzwiek('klik'); odswiezPanel(true); odswiezHud(); return; }
  if (akcja === 'moc') {
    const m = S.moce[0].find(o => o.id === arg); if (!m || m.uzyta) { dzwiek('blad'); return; }
    if (MOCE[arg].cel) { trybMocy = arg; toast(`${MOCE[arg].emoji} Dotknij miejsca na mapie`); dzwiek('tak'); odswiezHud(); return; }
    pokazMoce = false; const bl = uzyjMocy(STRONA_GRACZA, arg); if (bl) { toast(bl); dzwiek('blad'); }
    odswiezPanel(true); odswiezHud(); return;
  }
  if (akcja === 'postawa') {
    for (const u of wybrane) if (u.strona === STRONA_GRACZA && !jestBudynkiem(u) && u.d.wojsko) { u.postawa = arg; if (arg === 'obrona' && u.zad && u.zad.typ === 'atakuj' && u.zad.potem && u.zad.potem.wraca) stop(u); }
    toast(POSTAWY[arg].emoji + ' Tryb: ' + POSTAWY[arg].nazwa); dzwiek('tak'); odswiezPanel(true); return;
  }
  if (akcja === 'stop') { for (const u of wybrane) if (u.strona === STRONA_GRACZA && !jestBudynkiem(u)) stop(u); dzwiek('klik'); return; }
  if (akcja === 'bud') { dzwiek('klik'); zacznijStawianie(arg); return; }
  if (!cel || !jestBudynkiem(cel)) return;
  if (akcja === 'brama') {
    ustawBrame(cel, !cel.zamk); odglos('brama', cel.x, cel.z, 0.9); dzwiek('klik');
    toast(cel.zamk ? '🔒 Brama zamknięta: nikt nie przejdzie' : '🔓 Brama otwarta dla twoich'); odswiezPanel(true); return;
  }
  if (akcja === 'zburz') {
    // dwa dotknięcia, żeby nie zburzyć niczego przez przypadek
    const t = performance.now();
    if (zburzPyt === cel.id && t - zburzPytT < 4000) {
      zburzPyt = 0; const bl = zburzWlasny(cel);
      if (bl) { toast(bl); dzwiek('blad'); } else { toast('💥 Zburzone: ' + cel.d.nazwa); dzwiek('zniszcz'); zaznacz([]); }
      return;
    }
    zburzPyt = cel.id; zburzPytT = t; b.querySelector('b').textContent = 'Na pewno?'; b.querySelector('small').textContent = 'dotknij jeszcze raz'; dzwiek('klik');
    return;
  }
  let blad = null;
  if (akcja === 'szkol') blad = dodajDoKolejki(cel, 'j', arg);
  else if (akcja === 'ul') blad = dodajDoKolejki(cel, 'u', arg);
  else if (akcja === 'era') blad = dodajDoKolejki(cel, 'era', arg);
  else if (akcja === 'rozb') blad = dodajDoKolejki(cel, 'rozb');
  else if (akcja === 'kup' || akcja === 'sprz') { blad = handluj(0, arg, akcja === 'kup'); if (!blad) { if (!odglos('monety')) dzwiek('gotowe'); odswiezPanel(true); return; } }
  else if (akcja === 'anuluj') { anulujZKolejki(cel, +arg); dzwiek('klik'); odswiezPanel(true); return; }
  if (blad) { toast(blad); dzwiek('blad'); } else dzwiek('tak');
  odswiezPanel(true);
});

// ================= pasek u góry, przyciski, podpowiedzi =================
function odswiezHud() {
  const z = S.zas[0];
  for (const s of SUROWCE) $('z-' + s).textContent = Math.floor(z[s]);
  $('z-laska').textContent = Math.floor(z.laska || 0);
  const lud = ludnosc(0), lim = limitLudnosci(0);
  $('z-lud').textContent = `${lud}/${lim}`; $('c-lud').classList.toggle('pelno', lud >= lim && lim < MAKS_LUDNOSC);
  $('h-era').textContent = `${EMOJI_ERY[S.era[0]]} Era ${S.era[0]}: ${ERY[S.era[0]]} · ${S.bogowie[0].map(b => BOGOWIE[b].emoji).join('')}`;
  const wolneMoce = S.moce[0].filter(m => !m.uzyta).length;
  $('b-moce').querySelector('b').textContent = wolneMoce; $('b-moce').classList.toggle('jest', wolneMoce > 0); $('b-moce').classList.toggle('wl', pokazMoce || !!trybMocy);
  const bezcz = JED.filter(u => u.strona === 0 && u.typ === 'osadnik' && !u.zad).length;
  $('b-bezczynni').querySelector('b').textContent = bezcz; $('b-bezczynni').classList.toggle('jest', bezcz > 0);
  $('b-wojsko').querySelector('b').textContent = JED.filter(u => u.strona === 0 && u.d.wojsko).length;
  $('zadanie').textContent = podpowiedz();
}
function podpowiedz() {
  const lud = JED.filter(u => u.strona === 0), os = lud.filter(u => u.typ === 'osadnik'), woj = lud.filter(u => u.d.wojsko);
  const bud = BUD.filter(b => b.strona === 0), ma = t => bud.some(b => b.typ === t);
  const ratusz = bud.find(b => b.typ === 'ratusz');
  if (ratusz && JED.some(e => e.strona === 1 && e.d.wojsko && dyst(e, ratusz) < 20)) return '⚠️ Wrogowie w osadzie! Naciśnij ⚔️ i dotknij wroga';
  if (!S.pomoc.zaznaczyl) return '👆 Dotknij osadnika, a potem krzaka z jagodami 🫐';
  if (limitLudnosci(0) - lud.length <= 1 && limitLudnosci(0) < MAKS_LUDNOSC && !bud.some(b => b.typ === 'dom' && !b.gotowy)) return '🏠 Brak miejsca: zaznacz osadnika i zbuduj chatę';
  if (os.some(u => !u.zad) && S.czas < 300) return '🧑‍🌾 Masz wolnych osadników: wyślij ich do pracy';
  if (os.length < 7) return '🏯 Dotknij Grodu i szkol osadników';
  if (!ma('tartak')) return '🪚 Zbuduj drwalnię przy lesie: drewno będzie szybciej';
  if (!ma('gontyna')) return '🛕 Zbuduj Gontynę: tam osadnicy modlą się o łaskę ✨';
  if (!JED.some(u => u.strona === 0 && u.zad && u.zad.typ === 'modl')) return '🙏 Zaznacz 2–3 osadników i dotknij Gontyny: będą się modlić o łaskę';
  if (!ma('koszary')) return '🛡️ Zbuduj Dwór drużyny';
  if (S.moce[0] && S.moce[0].some(m => !m.uzyta) && S.czas > 600 && !S.pomoc.moc) return '⚡ Masz moc boga! Naciśnij ⚡ z boku ekranu';
  if (S.era[0] === 1) return brakEry(0) ? '🏗️ Do ery 2 potrzeba 2 różnych budynków (np. drwalnia i Gontyna)' : '🏯 Dotknij Grodu: zobaczysz, czego brakuje do nowej ery';
  if (!ma('kopalnia')) return '⛏️ Zbuduj dymarkę przy rdzawych skałach z rudą';
  if (!BUD.some(b => b.strona === 0 && b.typ === 'gontyna' && b.kolejka.length) && !JED.some(u => u.strona === 0 && u.d.mit) && S.era[0] >= 2) return '🐺 W Gontynie przyzwij stwora swojego boga (za łaskę ✨)';
  if (!ma('jarmark')) return '🎪 Zbuduj Targowisko daleko od spichlerza: wozy przywiozą srebro';
  if (woj.length < 8) return '🛡️ Szkol wojsko w Dworze drużyny';
  if (S.era[0] === 2) return '🏯 Dotknij Grodu: następna era to Czasy Bohaterów';
  if (S.era[0] === 3 && woj.length >= 12) return '🏯 Dotknij Grodu: następna era to Czasy Bogów';
  return '🚩 Zaznacz wojsko ⚔️ i dotknij Grodu komputera';
}
let toastT = null;
function toast(t) { if (symulacja) return; const el = $('toast'); el.textContent = t; el.hidden = false; el.classList.remove('pokaz'); void el.offsetWidth; el.classList.add('pokaz'); clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3200); }
function baner(t1, t2) { if (symulacja) return; const el = $('baner'); el.querySelector('b').textContent = t1; el.querySelector('small').textContent = t2; el.hidden = false; el.classList.remove('pokaz'); void el.offsetWidth; el.classList.add('pokaz'); setTimeout(() => { el.hidden = true; }, 3000); }
let bezczynnyNr = 0;
$('b-bezczynni').onclick = () => {
  audio(); const l = JED.filter(u => u.strona === 0 && u.typ === 'osadnik' && !u.zad);
  if (!l.length) { toast('Wszyscy osadnicy pracują 👍'); return; }
  const u = l[bezczynnyNr++ % l.length]; zaznacz([u]); kam.x = u.x; kam.z = u.z; dzwiek('tak');
};
$('b-wojsko').onclick = () => {
  audio(); const l = JED.filter(u => u.strona === 0 && u.d.wojsko);
  if (!l.length) { toast('Nie masz jeszcze wojska: zbuduj Dwór drużyny'); return; }
  zaznacz(l); dzwiek('tak');
};
$('b-dom').onclick = () => { audio(); const r = BUD.find(b => b.strona === 0 && b.typ === 'ratusz'); if (r) { kam.x = r.x; kam.z = r.z; } kam.kat = Math.PI / 4; dzwiek('klik'); };
$('b-moce').onclick = () => {
  audio(); if (!S) return;
  if (pokazMoce || trybMocy) { pokazMoce = false; trybMocy = null; } else { zaznacz([]); pokazMoce = true; }
  dzwiek('klik'); odswiezPanel(true); odswiezHud();
};
$('b-obszar').onclick = () => { audio(); trybObszar = !trybObszar; $('b-obszar').classList.toggle('wl', trybObszar); if (trybObszar) toast('Przeciągnij palcem ramkę wokół swoich ludzi'); };

// ================= okna =================
const OKNA = ['o-menu', 'o-nowa', 'o-pauza', 'o-koniec', 'o-wersje'];
function pokazOkno(id) { for (const o of OKNA) $(o).hidden = o !== id; $('gra-ui').hidden = !!id; }
function ukryjOkna() { pokazOkno(null); }
function ustawPrzelaczniki() { for (const [id, k] of [['m-muz', 'muzyka'], ['m-dzw', 'dzwieki'], ['p-muz', 'muzyka'], ['p-dzw', 'dzwieki']]) { $(id).textContent = zapis[k] ? 'wł.' : 'wył.'; $(id).classList.toggle('wl', zapis[k]); } }
function pokazMenu() {
  pauza = true; ciszaMuzyki();
  const jest = zapis.gra && !zapis.gra.wynik;
  $('m-dalej').hidden = !jest; $('m-stara').hidden = !zapis.malaMapa;
  if (jest) $('m-dalej').textContent = `Graj dalej (${TRUDNOSC[zapis.gra.trudnosc].nazwa.toLowerCase()}, ${Math.floor(zapis.gra.czas / 60)} min)`;
  const w = zapis.wygrane, ile = Object.values(w).reduce((a, b) => a + b, 0);
  $('m-wygrane').textContent = ile ? `🏆 Wygrane: ${Object.entries(w).filter(([, n]) => n).map(([k, n]) => `${TRUDNOSC[k].nazwa.toLowerCase()} ${n}`).join(', ')}` : '';
  $('m-wersja').textContent = `Age of Polan, wersja ${WERSJA}`;
  $('m-wersje').hidden = WERSJE.length < 2;
  ustawPrzelaczniki(); pokazOkno('o-menu');
}
function pokazWersje() {
  const l = $('w-lista'); l.innerHTML = '';
  for (const w of WERSJE) {
    const d = document.createElement('div'); d.className = 'pozycja';
    d.innerHTML = `<div class="nr">${w.nr}</div><div class="tekst"><b>Wersja ${w.nr}${w.nr === WERSJA ? ' (najnowsza)' : ''}</b><small>${w.opis}</small></div>`;
    const b = document.createElement('button'); b.className = 'maly'; b.textContent = 'Graj';
    b.onclick = () => { audio(); dzwiek('klik'); if (w.adres) location.href = w.adres; else pokazMenu(); };
    d.appendChild(b); l.appendChild(d);
  }
  pokazOkno('o-wersje');
}
function startuj() { if (zapis.malaMapa) { zapis.malaMapa = false; zapiszDysk(); } ukryjOkna(); pauza = false; odswiezPanel(true); odswiezHud(); grajMuzyke(); }
$('m-dalej').onclick = () => { audio(); dzwiek('klik'); if (!S || S.seed !== zapis.gra.seed || S.wynik) wczytajGre(zapis.gra); startuj(); };
// ---------- nowa gra: wielkość mapy, ilu komputerów, jak trudnych i kto z kim walczy ----------
const NAZWY_TRUD = { latwy: '🙂 Łatwy', sredni: '😐 Średni', trudny: '😠 Trudny' };
function opcjeNowej() {
  const o = { mapa: 'dolina', rozmiar: 192, bog: 'perun', przeciwnicy: [zapis.trudnosc || 'latwy'], sojusz: 'kazdy', ...(zapis.opcje || {}) };
  if (!BOGOWIE[o.bog] || !BOGOWIE[o.bog].glowny) o.bog = 'perun';
  if (!MAPY[o.mapa] && o.mapa !== 'losowa') o.mapa = 'dolina';
  o.przeciwnicy = [...o.przeciwnicy]; return o;
}
let nowaOpc = null;
function rysujNowa() {
  const o = nowaOpc;
  $('n-mapa').innerHTML = [...Object.keys(MAPY), 'losowa'].map(k => `<button class="wyb${k === o.mapa ? ' wybrany' : ''}" data-v="${k}">${k === 'losowa' ? '🎲 Losowa' : MAPY[k].emoji + ' ' + MAPY[k].nazwa}</button>`).join('');
  $('n-mapa-opis').textContent = o.mapa === 'losowa' ? 'Niespodzianka: gra sama wybierze jedną z map.' : MAPY[o.mapa].opis;
  $('n-bog').innerHTML = BOGOWIE_GLOWNI.map(k => `<button class="wyb${k === o.bog ? ' wybrany' : ''}" data-v="${k}">${BOGOWIE[k].emoji} ${BOGOWIE[k].nazwa}</button>`).join('');
  { const g = BOGOWIE[o.bog], m = MOCE[g.moc]; $('n-bog-opis').textContent = `${g.nazwa}: ${g.kim}. ${g.bonus} Moc: ${m.emoji} ${m.nazwa} (${m.opis.toLowerCase()}).`; }
  for (const b of $('n-rozmiar').children) b.classList.toggle('wybrany', +b.dataset.v === o.rozmiar);
  for (const b of $('n-ile').children) b.classList.toggle('wybrany', +b.dataset.v === o.przeciwnicy.length);
  $('n-komputery').innerHTML = o.przeciwnicy.map((t, i) => `<div class="n-komp"><span>${ZNAK_STRON[i + 1]} Komputer${o.przeciwnicy.length > 1 ? ' ' + (i + 1) : ''}</span><div class="wybory">`
    + Object.keys(NAZWY_TRUD).map(k => `<button class="wyb${k === t ? ' wybrany' : ''}" data-komp="${i}" data-t="${k}">${NAZWY_TRUD[k]}</button>`).join('') + '</div></div>').join('');
  $('n-sojusz-w').hidden = o.przeciwnicy.length < 2;
  for (const b of $('n-sojusz').children) b.classList.toggle('wybrany', b.dataset.v === o.sojusz);
  $('n-trud-opis').textContent = Object.keys(NAZWY_TRUD).map(k => `${TRUDNOSC[k].nazwa}: pierwszy atak po ${Math.round(TRUDNOSC[k].pierwszyAtak / 60)} min`).join(' · ');
}
$('o-nowa').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !nowaOpc) return;
  const o = nowaOpc, gdzie = b.parentElement && b.parentElement.id;
  if (gdzie === 'n-mapa') o.mapa = b.dataset.v;
  else if (gdzie === 'n-bog') o.bog = b.dataset.v;
  else if (gdzie === 'n-rozmiar') o.rozmiar = +b.dataset.v;
  else if (gdzie === 'n-ile') { const n = +b.dataset.v; while (o.przeciwnicy.length < n) o.przeciwnicy.push(o.przeciwnicy[o.przeciwnicy.length - 1]); o.przeciwnicy.length = n; }
  else if (b.dataset.komp != null) o.przeciwnicy[+b.dataset.komp] = b.dataset.t;
  else if (gdzie === 'n-sojusz') o.sojusz = b.dataset.v;
  else return;
  dzwiek('klik'); rysujNowa();
});
$('m-nowa').onclick = () => { audio(); dzwiek('klik'); nowaOpc = opcjeNowej(); rysujNowa(); pokazOkno('o-nowa'); };
$('n-start').onclick = () => {
  audio(); dzwiek('klik');
  zapis.opcje = nowaOpc; zapis.trudnosc = nowaOpc.przeciwnicy[0]; zapiszDysk();
  nowaGra(nowaOpc); startuj();
  baner(`${MAPY[S.mapaTyp].emoji} ${MAPY[S.mapaTyp].nazwa} · ${BOGOWIE[S.bogowie[0][0]].emoji} ${BOGOWIE[S.bogowie[0][0]].nazwa}`, nowaOpc.przeciwnicy.length > 1 ? 'Zbuduj gród, zdobądź łaskę bogów i pokonaj wszystkie wrogie plemiona!' : 'Zbuduj gród, zdobądź łaskę bogów i pokonaj czerwone plemię!');
};
$('n-wroc').onclick = () => { dzwiek('klik'); pokazMenu(); };
$('m-wersje').onclick = () => { dzwiek('klik'); pokazWersje(); };
for (const id of ['m-muz', 'p-muz']) $(id).onclick = () => { audio(); zapis.muzyka = !zapis.muzyka; zapiszDysk(); ustawPrzelaczniki(); if (zapis.muzyka) odblokujMuzyke(); else ciszaMuzyki(); };
for (const id of ['m-dzw', 'p-dzw']) $(id).onclick = () => { audio(); zapis.dzwieki = !zapis.dzwieki; zapiszDysk(); ustawPrzelaczniki(); dzwiek('klik'); };
$('b-pauza').onclick = () => {
  if (!S) return; audio(); dzwiek('klik'); pauza = true; zapiszGre(); ciszaMuzyki();
  $('pa-info').textContent = `${MAPY[typMapy()].emoji} ${MAPY[typMapy()].nazwa} · ${S.bogowie[0].map(b => BOGOWIE[b].emoji + ' ' + BOGOWIE[b].nazwa).join(', ')} · ${TRUDNOSC[S.trudnosc].nazwa} · ${Math.floor(S.czas / 60)} min · era ${S.era[0]} · ludzie: ${ludnosc(0)}`;
  ustawPrzelaczniki(); pokazOkno('o-pauza');
};
$('pa-dalej').onclick = () => { dzwiek('klik'); startuj(); };
$('pa-menu').onclick = () => { dzwiek('klik'); zapiszGre(); pokazMenu(); };
$('pa-nowa').onclick = () => { dzwiek('klik'); $('m-nowa').onclick(); };
function koniecGry() {
  if (symulacja) return;
  const wygral = S.wynik === 'wygrana';
  if (wygral && !S.aiGracz) { zapis.wygrane[S.trudnosc] = (zapis.wygrane[S.trudnosc] || 0) + 1; }
  zapis.gra = null; zapiszDysk();
  setTimeout(() => {
    pauza = true; ciszaMuzyki();
    dzwiek(wygral ? 'wygrana' : 'przegrana');
    $('k-tytul').textContent = wygral ? '🏆 Wygrana!' : 'Tym razem przegrana';
    $('k-tekst').textContent = wygral ? (ileStron() > 2 ? 'Wszystkie wrogie grody upadły. Twoje plemię rządzi krainą!' : 'Gród komputera upadł. Twoje plemię rządzi krainą!') : 'Komputer zburzył twój Gród. Spróbuj jeszcze raz!';
    const s = S.stat[0];
    $('k-stat').innerHTML = `<span>⏱️ ${Math.floor(S.czas / 60)} min</span><span>🧺 zebrane: ${Math.floor(s.zebrane)}</span><span>🧑‍🌾 wyszkoleni: ${s.wyszkoleni}</span><span>⚔️ pokonani: ${s.pokonani}</span><span>💥 zburzone: ${s.zburzone}</span>`;
    pokazOkno('o-koniec');
  }, 1800);
}
$('k-nowa').onclick = () => { dzwiek('klik'); $('m-nowa').onclick(); };
$('k-menu').onclick = () => { dzwiek('klik'); pokazMenu(); };
document.addEventListener('visibilitychange', () => { if (document.hidden && S && !pauza) { zapiszGre(); $('b-pauza').onclick(); } });
addEventListener('pagehide', () => zapiszGre());

// logo w menu: krzak haskapu i korona
function rysujLogo() {
  const cv = $('logo'), c = cv.getContext('2d'), W = cv.width;
  c.clearRect(0, 0, W, W);
  const g = c.createRadialGradient(W / 2, W * 0.35, W * 0.05, W / 2, W / 2, W * 0.5); g.addColorStop(0, '#fff6d8'); g.addColorStop(0.6, '#9cc4e8'); g.addColorStop(1, '#3d6ea8');
  c.fillStyle = g; c.beginPath(); c.arc(W / 2, W / 2, W * 0.48, 0, 7); c.fill();
  c.save(); c.beginPath(); c.arc(W / 2, W / 2, W * 0.48, 0, 7); c.clip();
  // wzgórze z grodem: wał, częstokół, wieża bramna
  c.fillStyle = '#3e8e3e'; c.beginPath(); c.ellipse(W * 0.5, W * 0.95, W * 0.62, W * 0.3, 0, 0, 7); c.fill();
  c.fillStyle = '#8a5c32'; for (let i = 0; i < 15; i++) { const x = W * (0.2 + i * 0.043); c.beginPath(); c.moveTo(x, W * 0.74); c.lineTo(x + W * 0.018, W * 0.62); c.lineTo(x + W * 0.036, W * 0.74); c.fill(); }
  c.fillStyle = '#a87443'; c.fillRect(W * 0.43, W * 0.5, W * 0.14, W * 0.24); c.fillStyle = '#6a4c31'; c.beginPath(); c.moveTo(W * 0.4, W * 0.5); c.lineTo(W * 0.5, W * 0.4); c.lineTo(W * 0.6, W * 0.5); c.fill();
  c.fillStyle = '#3b2416'; c.fillRect(W * 0.475, W * 0.64, W * 0.05, W * 0.1);
  c.restore();
  // piorun
  c.fillStyle = '#ffd84a'; c.strokeStyle = '#b07a0a'; c.lineWidth = W * 0.012;
  c.beginPath(); c.moveTo(W * 0.62, W * 0.06); c.lineTo(W * 0.44, W * 0.3); c.lineTo(W * 0.54, W * 0.3); c.lineTo(W * 0.4, W * 0.5); c.lineTo(W * 0.66, W * 0.24); c.lineTo(W * 0.55, W * 0.24); c.lineTo(W * 0.68, W * 0.06); c.closePath(); c.fill(); c.stroke();
}

// ================= pętla =================
let ost = performance.now(), hudT = 0, miniT = 0, zapisT = 0;
function klatka(t) {
  requestAnimationFrame(klatka);
  const dt = Math.min(0.1, (t - ost) / 1000); ost = t;
  if (!S) { renderer.render(scena, kamera); return; }
  if (!pauza && !S.wynik) {
    krokGry(dt);
    if ((hudT -= dt) <= 0) { hudT = 0.25; odswiezHud(); odswiezPanel(); }
    if ((zapisT -= dt) <= 0) { zapisT = 10; zapiszGre(); }
    muzykaKrok();
  }
  if ((miniT -= dt) <= 0) { miniT = 0.3; rysujMini(); }
  rysuj(dt);
}

// ================= start =================
rozmiar(); rysujLogo();
LUDZ.wczytaj(); // realistyczne postacie wczytują się w tle; do tego czasu ludzie są prostymi bryłami
(function start() {
  if (zapis.gra) { try { wczytajGre(zapis.gra); } catch (e) { console.error(e); zapis.gra = null; nowaGra(zapis.opcje || zapis.trudnosc); } }
  else nowaGra(zapis.opcje || zapis.trudnosc);
  ustawKamere();
  if (WERSJE.length > 1) pokazWersje(); else pokazMenu();
  requestAnimationFrame(klatka);
})();

// test bez klikania (w konsoli przeglądarki): window.__haskap
window.__haskap = window.__polan = {
  get S() { return S; }, get JED() { return JED; }, get BUD() { return BUD; }, get ZAS() { return ZAS; }, kam, muz, muzykaKrok, walka(ile = 0) { walkaT = S.czas - ile; },
  nowaGra, krokGry, zapiszGre, wczytajGre, stanDoZapisu, ai, dodajDoKolejki, nowyBudynek, nowaJednostka, miejsceWolne, zaznacz, klik, wskaz, rozkaz, zacznijStawianie, przesunDucha, ustawBrame,
  // komputer gra też za gracza: sprawdzenie, czy gra się kończy i nic się nie psuje
  wolne(strona, x, z) { RUCH = strona; return wolneXZ(x, z); }, TEREN, blok, get N() { return N; }, szukajDrogi, MAPY,
  uzyjMocy, MOCE, BOGOWIE,
  komputerKontraKomputer(trudnoscGracza = 'sredni') { S.aiGracz = true; S.trudnoscGracza = trudnoscGracza; },
  krok(sek, dt = 0.1, rysujTez = false) { symulacja = !rysujTez; try { for (let t = 0; t < sek && !S.wynik; t += dt) krokGry(dt); } finally { symulacja = false; } if (rysujTez) rysuj(0.016); return S.wynik; },
};
