// Age of Haskap II: gra strategiczna. Dowodzisz osadnikami, zbierasz surowce, budujesz osadę, przechodzisz przez ery
// i bronisz się przed osadą komputera (albo ją pokonujesz). Gatunek jak w znanych grach strategicznych,
// ale nazwy, budynki, wygląd i liczby są nasze.
import * as THREE from '../../../survival/three.module.min.js';
import * as MOD from './modele.js';
import { SUROWCE, EMOJI_SUR, NAZWY_SUR, ERY, EMOJI_ERY, START, MAKS_LUDNOSC, JEDNOSTKI, BUDYNKI, KOLEJNOSC_BUDYNKOW, NOWA_ERA, LICZA_DO_ERY,
  ULEPSZENIA, ZBIERANIE, UDZWIG, ZAPAS, TRUDNOSC } from './dane.js';

const WERSJA = 3;
// wersje do wyboru przy uruchamianiu (najnowsza = ta gra, starsze = kopie w folderze wersje/)
const WERSJE = [
  { nr: 3, opis: 'Zbieracze pracują rękami: zrywają jagody do koszyka, budują młotkiem, rąbią siekierą, kopią kilofem (bez kiwania). Do tego wszystko z wersji 2.' },
  { nr: 2, opis: 'Nasza mapa ulepszeń: 4 ery (Sadzonka, Kwitnienie, Owocowanie, Wielkie Zbiory), żelazo, renifery i łosie, awanse wojska, kuźnia.', adres: 'wersje/2/' },
  { nr: 1, opis: 'Pierwsza wersja: osadnicy, 4 surowce, 3 ery, wojsko i osada komputera.', adres: 'wersje/1/' },
];
const KLUCZ = 'age-of-haskap-2-w3';
const $ = id => document.getElementById(id);
const losowo = (a, b) => a + Math.random() * (b - a);

// ================= ustawienia i zapis =================
function wczytaj() {
  const z = { muzyka: true, dzwieki: true, trudnosc: 'latwy', wygrane: {}, gra: null };
  try { const s = JSON.parse(localStorage.getItem(KLUCZ)); if (s && typeof s === 'object') Object.assign(z, s); } catch (e) { /* brak zapisu */ }
  return z;
}
const zapis = wczytaj();
function zapiszDysk() { try { localStorage.setItem(KLUCZ, JSON.stringify(zapis)); } catch (e) { /* pełna pamięć albo tryb prywatny */ } }

// ================= mapa: kratki =================
const N = 96, POL = N / 2;
const blok = new Uint8Array(N * N);   // 0 wolne, 1 zasób (drzewo, krzak, skała), 2 budynek, 4 pole (można chodzić, nie można budować)
const naKom = new Int32Array(N * N);  // id zasobu albo budynku w tej kratce
const kom = (x, z) => { const i = Math.floor(x + POL), j = Math.floor(z + POL); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
const kom2 = (i, j) => (i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i);
const srodekKom = c => [(c % N) - POL + 0.5, Math.floor(c / N) - POL + 0.5];
const wolnaKom = c => c >= 0 && (blok[c] === 0 || blok[c] === 4);
const wolneXZ = (x, z) => wolnaKom(kom(x, z));

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ================= stan gry =================
let S = null;                 // stan zapisywany
const E = new Map();          // wszystko, co ma id: zasoby, budynki, jednostki
const ZAS = new Map();        // zasoby na mapie
const ZAS_TYP = { jagody: [], drewno: [], kamien: [], zelazo: [] };
let JED = [], BUD = [], POC = [], UMIERA = [];
let wybrane = [];
let pauza = true;
let tryb = null;              // stawianie budynku: { typ, i0, j0, ok, duch, plama }
let trybObszar = false;       // zaznaczanie ramką

const STRONA_GRACZA = 0, KOMPUTER = 1;
const wrog = s => 1 - s;
const dyst = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function dystDoProst(x, z, b) {
  const h = b.w / 2, dx = Math.max(b.x - h - x, 0, x - b.x - h), dz = Math.max(b.z - h - z, 0, z - b.z - h);
  return Math.hypot(dx, dz);
}
const jestBudynkiem = e => !!(e && e.d && e.d.w);
const zyje = e => e && E.get(e.id) === e && e.hp > 0;

// ================= grafika =================
const scena = new THREE.Scene();
scena.background = new THREE.Color('#9fd3f0');
scena.fog = new THREE.Fog('#9fd3f0', 70, 140);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('scena').appendChild(renderer.domElement);
const plotno = renderer.domElement;
const kamera = new THREE.PerspectiveCamera(40, 1, 0.5, 300);
const kam = { x: 30, z: 30, d: 30 };
scena.add(new THREE.HemisphereLight('#ffffff', '#6b8f4e', 1.1));
const slonce = new THREE.DirectionalLight('#fff4dc', 1.7);
slonce.castShadow = true; slonce.shadow.mapSize.set(2048, 2048); slonce.shadow.bias = -0.0005;
scena.add(slonce, slonce.target);
const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const MAT_RING = [new THREE.MeshBasicMaterial({ color: '#4cff7a', transparent: true, opacity: 0.9, depthWrite: false }), new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: 0.9, depthWrite: false })];
const MAT_PLAC = new THREE.MeshLambertMaterial({ color: '#b0814f' });
const MAT_ZNACZNIK = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false });
const NIESIE3D = {};

function malujZiemie(seed) {
  const R = 1024, sk = R / N, cv = document.createElement('canvas'); cv.width = cv.height = R;
  const c = cv.getContext('2d'), r = rng(seed * 13 + 7);
  c.fillStyle = '#7cc35e'; c.fillRect(0, 0, R, R);
  for (let i = 0; i < 160; i++) {
    const x = r() * R, y = r() * R, rad = 20 + r() * 70, g = c.createRadialGradient(x, y, 0, x, y, rad);
    const jasna = r() < 0.5; g.addColorStop(0, jasna ? 'rgba(170,220,120,0.35)' : 'rgba(70,140,60,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 5000; i++) { c.fillStyle = r() < 0.5 ? 'rgba(40,110,40,0.25)' : 'rgba(210,240,160,0.3)'; c.fillRect(r() * R, r() * R, 2, 3 + r() * 3); }
  for (let i = 0; i < 260; i++) { c.fillStyle = ['#ffffff', '#ffe066', '#ff9ec7', '#b6a6ff'][Math.floor(r() * 4)]; c.beginPath(); c.arc(r() * R, r() * R, 2.2, 0, 7); c.fill(); }
  // plac przy ratuszach
  for (const [x, z] of [[30, 30], [-30, -30]]) {
    const g = c.createRadialGradient((x + POL) * sk, (z + POL) * sk, 0, (x + POL) * sk, (z + POL) * sk, 7 * sk);
    g.addColorStop(0, 'rgba(196,160,110,0.75)'); g.addColorStop(0.7, 'rgba(196,160,110,0.45)'); g.addColorStop(1, 'rgba(196,160,110,0)');
    c.fillStyle = g; c.fillRect(0, 0, R, R);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
let ziemia = null, dalej = null;
const INST = {}; // instancje drzew, krzaków i skał

// ================= dźwięk =================
let AC = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
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
const UTWORY = { spokoj: '../../../muzyka/wesola-bieg.mp3', walka: '../../../muzyka/wesola-walka.mp3' };
let muzyka = null, utwor = '', walkaT = -99;
function grajMuzyke() {
  if (!zapis.muzyka || !S || pauza || S.wynik) { if (muzyka) muzyka.pause(); return; }
  const nazwa = S.czas - walkaT < 15 ? UTWORY.walka : UTWORY.spokoj;
  if (utwor !== nazwa) { if (muzyka) muzyka.pause(); muzyka = new Audio(nazwa); muzyka.loop = true; muzyka.volume = 0.25; utwor = nazwa; }
  if (muzyka.paused) muzyka.play().catch(() => {});
}

// ================= tworzenie mapy =================
function wyczyscSwiat() {
  for (const e of [...JED, ...BUD]) scena.remove(e.mesh);
  for (const p of POC) scena.remove(p.mesh);
  for (const u of UMIERA) scena.remove(u.mesh);
  for (const k in INST) { scena.remove(INST[k]); delete INST[k]; }
  if (ziemia) { scena.remove(ziemia); ziemia.material.map.dispose(); ziemia = null; }
  if (dalej) { scena.remove(dalej); dalej = null; }
  JED = []; BUD = []; POC = []; UMIERA = []; wybrane = []; E.clear(); ZAS.clear();
  for (const k in ZAS_TYP) ZAS_TYP[k] = [];
  blok.fill(0); naKom.fill(0);
  if (tryb) zakonczStawianie();
}
const RODZAJ_SUR = { drzewo: 'drewno', krzak: 'jagody', kamien: 'kamien', ruda: 'zelazo' };
const WYS_ZAS = { drzewo: 2.4, krzak: 0.9, kamien: 0.8, ruda: 0.8 };
// mapa jest taka sama dla obu stron: wszystko z połowy gracza odbijamy na połowę komputera
function generujMape(seed) {
  const r = rng(seed), plan = new Uint8Array(N * N); // 0 nic, 1 drzewo, 2 krzak, 3 kamień, 4 złoto
  const TC = [30, 30];
  const daj = (x, z, typ) => {
    const i = Math.floor(x + POL), j = Math.floor(z + POL);
    if (i < 1 || j < 1 || i >= N - 1 || j >= N - 1 || i + j < N - 1) return;
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
  const wewn = ([x, z]) => [Math.max(-40, Math.min(40, x)), Math.max(-40, Math.min(40, z))];
  // kierunki dobrane tak, żeby surowce nie wchodziły za brzeg mapy (baza stoi blisko rogu x+, z+)
  const kier = a => { const [x, z] = przy(a, 10); return x > 42 || z > 42 ? a + Math.PI : a; };
  const aK = kier(a0), aZ = kier(a0 + 2.1), aKa = kier(a0 + 4.2), aL = kier(a0 + 1.05);
  kepa(...wewn(przy(aK, 7)), 7, 2, 1.2);
  kepa(...wewn(przy(aZ, 10)), 5, 4, 1.0);
  kepa(...wewn(przy(aKa, 10.5)), 4, 3, 1.0);
  las(...wewn(przy(aL, 14)), 5);
  kepa(...wewn(przy(aK + 0.6, 16)), 5, 2, 1.3);
  // lasy na mapie
  for (let k = 0; k < 14; k++) {
    const x = -44 + r() * 88, z = -44 + r() * 88; if (x + z < 4) continue;
    if (Math.hypot(x - TC[0], z - TC[1]) < 12) continue;
    las(x, z, 2.5 + r() * 3.5);
  }
  // złoto i kamień na środku mapy (po jednej kępce na stronę)
  kepa(8 + r() * 6, -6 + r() * 6, 5, 4, 1.0);
  kepa(-4 + r() * 6, 12 + r() * 5, 4, 3, 1.0);
  kepa(14 + r() * 6, 14 + r() * 6, 5, 2, 1.2);
  // droga od ratusza do środka mapy zawsze wolna
  for (let t = 0; t <= 1; t += 0.01) {
    const x = TC[0] * (1 - t), z = TC[1] * (1 - t);
    for (let dz = -1.6; dz <= 1.6; dz += 0.5) for (let dx = -1.6; dx <= 1.6; dx += 0.5) { const c = kom(x + dx, z + dz); if (c >= 0) plan[c] = 0; }
  }
  // odbicie na drugą połowę
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const c = j * N + i, m = (N - 1 - j) * N + (N - 1 - i);
    if (i + j > N - 1 && plan[c]) plan[m] = plan[c];
  }
  // tworzenie zasobów (kolejność kratek = te same numery przy każdym wczytaniu)
  const RODZ = [null, 'drzewo', 'krzak', 'kamien', 'ruda'];
  const lista = { drzewo: [], krzak: [], kamien: [], ruda: [] };
  let id = 1;
  for (let c = 0; c < N * N; c++) {
    if (!plan[c]) continue;
    const rodzaj = RODZ[plan[c]], [x, z] = srodekKom(c);
    const z0 = { id: id++, rodzaj, sur: RODZAJ_SUR[rodzaj], c, x, z, ile: ZAPAS[rodzaj], start: ZAPAS[rodzaj], inst: lista[rodzaj].length };
    lista[rodzaj].push(z0); ZAS.set(z0.id, z0); E.set(z0.id, z0); ZAS_TYP[z0.sur].push(z0);
    blok[c] = 1; naKom[c] = z0.id;
  }
  // instancje (jedna bryła na rodzaj)
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (const rodzaj in lista) {
    const L = lista[rodzaj]; if (!L.length) continue;
    const geo = rodzaj === 'drzewo' ? MOD.drzewo() : rodzaj === 'krzak' ? MOD.krzak() : MOD.skala(rodzaj);
    const im = new THREE.InstancedMesh(geo, MAT, L.length);
    im.castShadow = rodzaj === 'drzewo'; im.receiveShadow = false;
    for (const z0 of L) {
      const rr = rng(z0.id * 31 + 5), s = rodzaj === 'drzewo' ? 0.85 + rr() * 0.45 : 0.85 + rr() * 0.3;
      q.setFromAxisAngle(up, rr() * 6.283); sc.set(s, s * (rodzaj === 'drzewo' ? 0.9 + rr() * 0.3 : 1), s);
      p.set(z0.x + (rr() - 0.5) * 0.25, 0, z0.z + (rr() - 0.5) * 0.25);
      im.setMatrixAt(z0.inst, m4.compose(p, q, sc));
    }
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
    INST[rodzaj] = im; scena.add(im);
  }
  return id;
}
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function usunZasob(z0) {
  if (!ZAS.has(z0.id)) return;
  ZAS.delete(z0.id); E.delete(z0.id); z0.ile = 0;
  if (blok[z0.c] === 1) { blok[z0.c] = 0; naKom[z0.c] = 0; }
  const im = INST[z0.rodzaj]; if (im) { im.setMatrixAt(z0.inst, ZERO); im.instanceMatrix.needsUpdate = true; }
  S.usuniete.push(z0.id); miniBrud = true;
  wybrane = wybrane.filter(e => e !== z0);
}

// ================= droga (szukanie ścieżki po kratkach) =================
const H_G = new Float32Array(N * N), H_OD = new Int32Array(N * N), H_ST = new Uint32Array(N * N), H_ZAM = new Uint32Array(N * N), H_CEL = new Uint32Array(N * N);
let hGen = 0;
const KOP_K = new Int32Array(N * N * 8), KOP_F = new Float32Array(N * N * 8); let kopN = 0;
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
function celePunkt(x, z) { const c = najblizszaWolna(kom(Math.max(-47.5, Math.min(47.5, x)), Math.max(-47.5, Math.min(47.5, z))), 10); return c >= 0 ? [c] : []; }
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
  u.droga = { cele, tx, tz, punkt }; u.utkn = 0; u.ostPoz = [u.x, u.z];
  // prosto, jeśli nic nie zasłania
  if (cele.length === 1 && cele[0] >= 0) {
    const [cx, cz] = punkt && kom(tx, tz) === cele[0] ? [tx, tz] : srodekKom(cele[0]);
    if (widac(u.x, u.z, cx, cz)) { u.sciezka = [[cx, cz]]; return true; }
  }
  const d = szukajDrogi(u.x, u.z, cele, tx, tz);
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
  u.mesh = new THREE.Mesh(MOD.JEDNOSTKI3D[typ](strona), MAT);
  u.mesh.position.set(x, 0, z); scena.add(u.mesh);
  JED.push(u); E.set(u.id, u);
  return u;
}
function predkosc(u) { const ul = S.ul[u.strona]; return u.d.szybkosc * (u.typ === 'osadnik' ? (ul.taczka ? 1.1 : 1) * (ul.wozek ? 1.1 : 1) : 1); }
function udzwig(u) { const ul = S.ul[u.strona]; return UDZWIG + (ul.kosz ? 3 : 0) + (ul.taczka ? 4 : 0) + (ul.wozek ? 5 : 0); }
function maxHpJ(strona, typ) { return JEDNOSTKI[typ].hp + (typ === 'osadnik' && S.ul[strona].rekawice ? 15 : 0); }
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
  if (rodzaj === 'zelazo') t *= ul.kilof_z ? 1.2 : 1;
  if (u.strona === KOMPUTER || (S.aiGracz && u.strona === STRONA_GRACZA)) t *= TRUDNOSC[u.strona === KOMPUTER ? S.trudnosc : S.trudnoscGracza].zbieranie;
  return t;
}
function atakJ(u) {
  const ul = S.ul[u.strona]; let a = u.d.atak;
  if (u.d.wojsko && !u.d.zasieg && !u.d.tylkoBudynki) a += (ul.bron1 ? 1 : 0) + (ul.bron2 ? 1 : 0) + (ul.bron3 ? 2 : 0);
  if (strzelec(u.d)) a += poziomPociskow(u.strona);
  return a;
}
function zasiegJ(u) { return u.d.zasieg ? u.d.zasieg + (strzelec(u.d) ? zasiegPociskow(u.strona) : 0) : 0; }
function pancerzJ(u) { const ul = S.ul[u.strona]; return u.d.pancerz + (u.d.wojsko ? (ul.zbroja1 ? 1 : 0) + (ul.zbroja2 ? 1 : 0) + (ul.zbroja3 ? 2 : 0) : 0); }
function maxHpBud(strona, typ) { return BUDYNKI[typ].hp; }
// linie wojska: w budynku szkoli się najwyższy stopień, na który jest awans
function typyBudynku(strona, budTyp) {
  const linie = {};
  for (const [t, d] of Object.entries(JEDNOSTKI)) {
    if (d.z !== budTyp || d.awans && !S.ul[strona][d.awans]) continue;
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
  }
}

function przesun(u, nx, nz) {
  nx = Math.max(-47.6, Math.min(47.6, nx)); nz = Math.max(-47.6, Math.min(47.6, nz));
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
  if (u.typ !== 'osadnik') return rozkazIdz(u, b.x, b.z);
  // zapamiętuje, co robił, żeby po budowie wrócić do tej pracy
  const pop = u.zad && (u.zad.typ === 'zbieraj' || u.zad.typ === 'farma') ? { ...u.zad, faza: u.zad.faza === 'niesie' ? 'niesie' : 'idz' } : u.zad && u.zad.typ === 'buduj' ? u.zad.potem : null;
  u.zad = { typ: 'buduj', bid: b.id, potem: pop || null }; u.sciezka = null;
}
function rozkazFarma(u, b) { if (u.typ !== 'osadnik') return; for (const o of JED) if (o !== u && o.zad && o.zad.typ === 'farma' && o.zad.bid === b.id) stop(o); u.zad = { typ: 'farma', bid: b.id, faza: 'idz' }; u.sciezka = null; }
function rozkazAtak(u, c, potem = null) {
  if (u.d.tylkoBudynki && !jestBudynkiem(c)) return;
  u.zad = { typ: 'atakuj', cid: c.id, potem }; u.sciezka = null; u.przelicz = 0;
}
function rozkazNaprzod(u, x, z) { u.zad = { typ: 'naprzod', x, z }; u.sciezka = null; }

// cel do walki w pobliżu (najpierw ludzie, potem budynki)
function celWalki(u, r, budynkiTez) {
  let naj = null, nd = r * r;
  if (!u.d.tylkoBudynki) for (const e of JED) {
    if (e.strona === u.strona || e.hp <= 0) continue;
    let d = (e.x - u.x) ** 2 + (e.z - u.z) ** 2; if (!e.d.wojsko) d *= 1.6; // najpierw wojsko
    if (d < nd) { nd = d; naj = e; }
  }
  if (naj || !(budynkiTez || u.d.tylkoBudynki)) return naj;
  let nb = u.d.tylkoBudynki ? r + 4 : r;
  for (const b of BUD) { if (b.strona === u.strona) continue; const d = dystDoProst(u.x, u.z, b) - (b.d.strzela ? 1 : 0); if (d < nb) { nb = d; naj = b; } }
  return naj;
}

// ---------- obrażenia ----------
function obrazenia(atakujacy, cel, atak) {
  if (jestBudynkiem(cel)) {
    if (atakujacy.d && atakujacy.d.tylkoBudynki) return atak;
    if (atakujacy.d && atakujacy.d.oblezenie) return atak * 2;
    return Math.max(1, atak * (atakujacy.d && atakujacy.d.zasieg ? 0.15 : atakujacy.d && atakujacy.d.w ? 0.2 : 0.45));
  }
  const bonus = (atakujacy.d && atakujacy.d.przeciw && cel.d.linia && atakujacy.d.przeciw[cel.d.linia]) || 1;
  const dystans = !atakujacy.d || atakujacy.d.zasieg || atakujacy.d.w;
  const p = pancerzJ(cel) + (dystans && cel.d.pancerzDystans ? cel.d.pancerzDystans : 0);
  return Math.max(1, atak * bonus - p);
}
let alarmT = -99;
function zadaj(cel, ile, od) {
  if (!zyje(cel)) return;
  cel.hp -= ile; cel.trafiony = S.czas;
  if (od && od.strona !== cel.strona) {
    if (cel.strona === STRONA_GRACZA || od.strona === STRONA_GRACZA) walkaT = S.czas;
    if (cel.strona === STRONA_GRACZA && S.czas - alarmT > 25 && !S.aiGracz) { alarmT = S.czas; toast('⚠️ Atak na twoją osadę!'); dzwiek('alarm'); ping = { x: cel.x, z: cel.z, t: 3 }; }
  }
  // wojsko oddaje
  if (!jestBudynkiem(cel) && cel.d.wojsko && od && !jestBudynkiem(od) && zyje(od) && (!cel.zad || cel.zad.typ === 'idz' && cel.strona === KOMPUTER)) rozkazAtak(cel, od);
  if (cel.hp <= 0) jestBudynkiem(cel) ? zniszczBudynek(cel) : zabij(cel);
}
function uderz(u, c) {
  if (u.d.zasieg) { rzut(u, c, atakJ(u)); dzwiek('rzut'); }
  else { zadaj(c, obrazenia(u, c, atakJ(u)), u); if (naEkranie(u)) dzwiek('uderz'); }
}
const KAMYK = MOD.kamyk();
function rzut(od, cel, atak) {
  const h = jestBudynkiem(od) ? (od.typ === 'wieza' ? 3.2 : 2.6) : 1.1;
  const mesh = new THREE.Mesh(KAMYK, MAT); scena.add(mesh);
  const d = Math.hypot(cel.x - od.x, cel.z - od.z);
  POC.push({ mesh, x0: od.x, z0: od.z, y0: h, cel, od, atak, ox: cel.x, oz: cel.z, t: 0, T: Math.max(0.25, d / 13) });
}
function zabij(u) {
  E.delete(u.id); JED.splice(JED.indexOf(u), 1);
  wybrane = wybrane.filter(e => e !== u);
  UMIERA.push({ mesh: u.mesh, t: 0, j: true, ry: u.ry });
  S.stat[wrog(u.strona)].pokonani++;
}
function zniszczBudynek(b) {
  E.delete(b.id); BUD.splice(BUD.indexOf(b), 1);
  wybrane = wybrane.filter(e => e !== b);
  for (let j = b.j0; j < b.j0 + b.w; j++) for (let i = b.i0; i < b.i0 + b.w; i++) { const c = kom2(i, j); if (naKom[c] === b.id) { blok[c] = 0; naKom[c] = 0; } }
  if (b.plac) b.mesh.remove(b.plac);
  UMIERA.push({ mesh: b.mesh, t: 0, j: false });
  if (naEkranie(b)) dzwiek('zniszcz');
  S.stat[wrog(b.strona)].zburzone++;
  miniBrud = true;
  if (b.strona === STRONA_GRACZA && b.typ === 'ratusz' && !S.aiGracz) toast('💥 Twój Dworek upadł!');
}

// ---------- zadania jednostek ----------
function aktualizujJednostke(u, dt) {
  u.cd = Math.max(0, u.cd - dt); u.idzie = false; u.pracuje = false;
  const z = u.zad;
  if (!z) {
    if (u.sciezka) ruch(u, dt);
    if (u.d.wojsko && (u.skan -= dt) <= 0) {
      u.skan = 0.5;
      const w = celWalki(u, u.d.wzrok, u.d.tylkoBudynki);
      if (w) { rozkazAtak(u, w, { typ: 'idz', x: u.x, z: u.z, wraca: true }); u.zad.sx = u.x; u.zad.sz = u.z; }
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
    case 'atakuj': atakuj(u, dt); break;
    default: u.zad = null;
  }
}
function odnies(u, dt, poOddaniu) {
  const z = u.zad;
  let b = z.skup ? E.get(z.skup) : null;
  if (!b || !b.gotowy || b.hp <= 0) {
    b = najblizszySkup(u.strona, u.niesie.sur, u.x, u.z);
    if (!b) { if (u.strona === STRONA_GRACZA && !S.aiGracz && S.czas - (u.ostBrakSkupu || -99) > 30) { u.ostBrakSkupu = S.czas; toast('Nie ma gdzie odnieść: zbuduj ' + { drewno: 'tartak', jagody: 'spichlerz', kamien: 'kamieniołom', zelazo: 'kopalnię rudy żelaza' }[u.niesie.sur]); } u.zad = null; return; }
    z.skup = b.id; u.sciezka = null;
  }
  if (dystDoProst(u.x, u.z, b) < 0.8) {
    const s = u.niesie.sur, ile = u.niesie.ile;
    S.zas[u.strona][s] += ile; S.stat[u.strona].zebrane += ile; u.niesie = { sur: null, ile: 0 };
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
    const przyrost = dt / b.d.czas;
    b.postep = Math.min(1, b.postep + przyrost); b.hp = Math.min(b.max, b.hp + b.max * przyrost);
    if (b.postep >= 1) ukonczBudynek(b);
    return;
  }
  if (!u.sciezka) { if (!ustawDroge(u, celeBudynku(b), b.x, b.z) && !u.sciezka) { u.zad = null; return; } }
  ruch(u, dt);
}
function atakuj(u, dt) {
  const z = u.zad, c = E.get(z.cid);
  if (!c || c.hp <= 0 || c.strona === u.strona) {
    const w = u.d.wojsko ? celWalki(u, u.d.wzrok, z.potem && z.potem.typ === 'naprzod') : null;
    if (w) { z.cid = w.id; u.sciezka = null; return; }
    u.zad = z.potem && !z.potem.wraca ? z.potem : z.potem && z.potem.wraca ? { typ: 'idz', x: z.potem.x, z: z.potem.z } : null; u.sciezka = null;
    if (u.zad && u.zad.typ === 'idz') ustawDroge(u, celePunkt(u.zad.x, u.zad.z), u.zad.x, u.zad.z, true);
    if (u.zad && u.zad.typ === 'naprzod') u.zad.ruszyl = false;
    return;
  }
  // za daleko od miejsca, którego pilnował: wraca
  if (z.sx != null && Math.hypot(u.x - z.sx, u.z - z.sz) > 12) { u.zad = { typ: 'idz', x: z.sx, z: z.sz }; ustawDroge(u, celePunkt(z.sx, z.sz), z.sx, z.sz, true); return; }
  const bud = jestBudynkiem(c);
  const odl = bud ? dystDoProst(u.x, u.z, c) : Math.hypot(c.x - u.x, c.z - u.z) - c.d.r;
  const zas = (u.d.zasieg ? zasiegJ(u) : 0.3) + u.d.r;
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
function wysokoscBud(b) { return { ratusz: 4.6, wieza: 4.2, dom: 1.8, pole: 0.6 }[b.typ] || 2.0; }
function miejsceWolne(typ, i0, j0, margines = 0) {
  const w = BUDYNKI[typ].w;
  for (let j = j0 - margines; j < j0 + w + margines; j++) for (let i = i0 - margines; i < i0 + w + margines; i++) {
    if (i < 2 || j < 2 || i >= N - 2 || j >= N - 2) return false;
    if (blok[j * N + i] !== 0) return false;
  }
  return true;
}
const GEO_PLAC = {};
function nowyBudynek(strona, typ, i0, j0, gotowy = false, id) {
  const d = BUDYNKI[typ], w = d.w, max = maxHpBud(strona, typ);
  const b = { id: id || S.nextId++, strona, typ, d, i0, j0, w, x: i0 - POL + w / 2, z: j0 - POL + w / 2, max, hp: gotowy ? max : Math.max(1, max * 0.05), postep: gotowy ? 1 : 0, gotowy, kolejka: [], cd: 0, zbiorka: null, rolnik: 0 };
  for (let j = j0; j < j0 + w; j++) for (let i = i0; i < i0 + w; i++) { const c = kom2(i, j); blok[c] = d.pole ? 4 : 2; naKom[c] = b.id; }
  b.mesh = new THREE.Mesh(MOD.budynek(typ, strona), MAT);
  b.mesh.castShadow = true; b.mesh.receiveShadow = true;
  b.mesh.position.set(b.x, 0, b.z);
  if (strona === KOMPUTER) b.mesh.rotation.y = Math.PI; // drzwi w stronę środka mapy
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
  if (b.strona === STRONA_GRACZA && !S.aiGracz) { dzwiek('buduj'); toast(b.d.emoji + ' Gotowe: ' + b.d.nazwa); }
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
function brakJednostki(strona, typ) { const d = JEDNOSTKI[typ]; return d.era > S.era[strona] ? '🔒 Era ' + d.era : d.awans && !S.ul[strona][d.awans] ? '🔒 Najpierw: ' + ULEPSZENIA[d.awans].nazwa : null; }
function brakUlepszenia(strona, id) {
  const d = ULEPSZENIA[id];
  if (S.ul[strona][id]) return 'gotowe';
  if (BUD.some(b => b.strona === strona && b.kolejka.some(q => q.rodzaj === 'u' && q.typ === id))) return 'w trakcie';
  if (d.era > S.era[strona]) return '🔒 Era ' + d.era;
  if (d.wymaga && !S.ul[strona][d.wymaga]) return '🔒 Najpierw: ' + ULEPSZENIA[d.wymaga].nazwa;
  if (d.awans) { const jl = JEDNOSTKI[d.awans]; const pop = Object.keys(JEDNOSTKI).find(t => JEDNOSTKI[t].linia === jl.linia && (JEDNOSTKI[t].st || 1) === jl.st - 1); if (pop && JEDNOSTKI[pop].era > S.era[strona]) return '🔒 Era ' + JEDNOSTKI[pop].era; }
  return null;
}
function brakEry(strona) {
  const nast = S.era[strona] + 1, d = NOWA_ERA[nast];
  if (!d) return 'max';
  if (BUD.some(b => b.strona === strona && b.kolejka.some(q => q.rodzaj === 'era'))) return 'w trakcie';
  const ma = budynkiDoEry(strona);
  if (ma < d.budynki) return `🔒 Potrzeba ${d.budynki} różnych budynków (masz ${ma}): spichlerz, tartak, kamieniołom, Strażnica Krzaka…`;
  return null;
}
function dodajDoKolejki(b, rodzaj, typ) {
  if (b.kolejka.length >= 5) return 'Kolejka jest pełna';
  let koszt, czas;
  if (rodzaj === 'j') { typ = najwyzszy(b.strona, typ); if (brakJednostki(b.strona, typ)) return brakJednostki(b.strona, typ); koszt = JEDNOSTKI[typ].koszt; czas = JEDNOSTKI[typ].czas; }
  else if (rodzaj === 'u') { const br = brakUlepszenia(b.strona, typ); if (br) return br; koszt = ULEPSZENIA[typ].koszt; czas = ULEPSZENIA[typ].czas; }
  else { const br = brakEry(b.strona); if (br) return br; koszt = NOWA_ERA[S.era[b.strona] + 1].koszt; czas = NOWA_ERA[S.era[b.strona] + 1].czas; }
  if (!zaplac(b.strona, koszt)) return 'Za mało surowców';
  b.kolejka.push({ rodzaj, typ, t: 0, czas, koszt });
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
  else if (zb && zb.bid && E.get(zb.bid) && typ === 'osadnik') { const c = E.get(zb.bid); c.gotowy ? (c.d.pole ? rozkazFarma(u, c) : rozkazIdz(u, zb.x, zb.z)) : rozkazBuduj(u, c); }
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
      let naj = null, nd = b.d.strzela.zasieg + b.w / 2 + (b.typ === 'wieza' ? zasiegPociskow(b.strona) : 0);
      for (const e of JED) { if (e.strona === b.strona) continue; const d = Math.hypot(e.x - b.x, e.z - b.z); if (d < nd) { nd = d; naj = e; } }
      if (naj) { rzut(b, naj, b.d.strzela.atak + (b.typ === 'wieza' ? poziomPociskow(b.strona) : S.ul[b.strona].pociski1 ? 1 : 0)); b.cd = b.d.strzela.odstep; } else b.cd = 0.4;
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
  q.t += dt;
  if (q.t >= q.czas && q.rodzaj !== 'j') {
    b.kolejka.shift();
    if (q.rodzaj === 'u') {
      S.ul[b.strona][q.typ] = true;
      if (ULEPSZENIA[q.typ].awans) awansuj(b.strona, ULEPSZENIA[q.typ].awans);
      if (q.typ === 'rekawice') for (const u of JED) if (u.strona === b.strona && u.typ === 'osadnik') { u.max = maxHpJ(u.strona, 'osadnik'); u.hp += 15; }
      if (b.strona === STRONA_GRACZA && !S.aiGracz) { toast(ULEPSZENIA[q.typ].emoji + ' Ulepszone: ' + ULEPSZENIA[q.typ].nazwa); dzwiek('buduj'); }
    } else if (q.rodzaj === 'era') {
      S.era[b.strona]++;
      if (!S.aiGracz || b.strona === KOMPUTER) {
        if (b.strona === STRONA_GRACZA) { baner(`Era ${S.era[b.strona]}: ${ERY[S.era[b.strona]]}`, 'Nowe budynki, wojsko i ulepszenia!'); dzwiek('era'); }
        else if (!S.aiGracz) toast(`🔴 Komputer wszedł w erę ${S.era[b.strona]}: ${ERY[S.era[b.strona]]}`);
      }
    }
  }
}

// ================= przeciwnik komputerowy =================
const UDZIALY = [null, { jagody: 0.52, drewno: 0.36, zelazo: 0.06, kamien: 0.06 }, { jagody: 0.42, drewno: 0.3, zelazo: 0.19, kamien: 0.09 }, { jagody: 0.42, drewno: 0.32, zelazo: 0.19, kamien: 0.07 }, { jagody: 0.42, drewno: 0.32, zelazo: 0.19, kamien: 0.07 }];
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
  if (!miejsce || !zaplac(strona, BUDYNKI[typ].koszt)) return null;
  const b = nowyBudynek(strona, typ, miejsce[0], miejsce[1]);
  const wolni = osadnicy.filter(o => !o.zad || o.zad.typ === 'zbieraj' && o.zad.sur !== 'zelazo').sort((a, c) => dyst(a, b) - dyst(c, b));
  for (const o of wolni.slice(0, b.w >= 3 ? 2 : 1)) rozkazBuduj(o, b);
  return b;
}
function ai(strona, dt) {
  const A = S.ai[strona]; A.t -= dt; if (A.t > 0) return; A.t = 1;
  const T = TRUDNOSC[strona === KOMPUTER ? S.trudnosc : S.trudnoscGracza];
  const moje = BUD.filter(b => b.strona === strona);
  const ratusz = moje.find(b => b.typ === 'ratusz' && b.gotowy);
  if (!ratusz) return;
  const ludzie = JED.filter(u => u.strona === strona), osadnicy = ludzie.filter(u => u.typ === 'osadnik'), wojsko = ludzie.filter(u => u.d.wojsko);
  const zas = S.zas[strona], era = S.era[strona], ma = t => moje.some(b => b.typ === t), maG = t => moje.some(b => b.typ === t && b.gotowy);
  const budowane = moje.filter(b => !b.gotowy), lud = ludzie.length, limit = limitLudnosci(strona);
  const wrogi = BUD.find(b => b.strona === wrog(strona) && b.typ === 'ratusz') || BUD.find(b => b.strona === wrog(strona));
  const kier = wrogi ? [(wrogi.x - ratusz.x) / dyst(wrogi, ratusz), (wrogi.z - ratusz.z) / dyst(wrogi, ratusz)] : [0, 0];
  if (A.nastAtak == null) A.nastAtak = T.pierwszyAtak;
  // rezerwa na nową erę
  const nastEra = NOWA_ERA[era + 1], celOs = T.osadnicy[era];
  const oszczedza = nastEra && osadnicy.length >= celOs - 3 && budynkiDoEry(strona) >= nastEra.budynki;
  const rez = oszczedza ? nastEra.koszt : {};
  const stacR = k => Object.entries(k).every(([s, v]) => zas[s] >= v + (rez[s] || 0));

  // 1. obrona: wrogowie blisko bazy
  let groz = null, gd = 20;
  for (const e of JED) if (e.strona !== strona && (e.d.wojsko || e.typ === 'osadnik' && dyst(e, ratusz) < 10)) { const d = dyst(e, ratusz); if (d < gd) { gd = d; groz = e; } }
  if (groz) {
    for (const w of wojsko) if (!w.zad || w.zad.typ !== 'atakuj') { const c = celWalki(w, 30, false) || groz; if (!w.d.tylkoBudynki) rozkazAtak(w, c); }
    if (!wojsko.length && gd < 8) for (const o of osadnicy) if (dyst(o, groz) < 6 && (!o.zad || o.zad.typ !== 'atakuj')) rozkazAtak(o, groz);
  }

  // 2. budowniczowie
  for (const b of budowane) {
    const ilu = osadnicy.filter(o => o.zad && o.zad.typ === 'buduj' && o.zad.bid === b.id).length;
    if (ilu < (b.w >= 3 ? 2 : 1)) {
      const o = osadnicy.filter(o => !o.zad || o.zad.typ === 'zbieraj' && o.zad.sur !== 'zelazo').sort((a, c) => dyst(a, b) - dyst(c, b))[0];
      if (o) rozkazBuduj(o, b);
    }
  }
  // 3. bezczynni osadnicy do pracy (tam, gdzie brakuje rąk)
  const licz = { jagody: 0, drewno: 0, kamien: 0, zelazo: 0 };
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
      const r = najblizszyZasob(s, skup.x, skup.z, 50);
      if (r) { rozkazZbieraj(o, r); licz[s]++; break; }
    }
  }
  // przesunięcie jednego osadnika, gdy czegoś bardzo brakuje
  const najwiecej = [...SUROWCE].sort((a, b) => brak(a) - brak(b))[0], najmniej = [...SUROWCE].sort((a, b) => brak(b) - brak(a))[0];
  if (brak(najmniej) > 1.5 && brak(najwiecej) < -1.5) {
    const o = osadnicy.find(o => o.zad && o.zad.typ === 'zbieraj' && o.zad.sur === najwiecej && o.niesie.ile < 2);
    const skup = najblizszySkup(strona, najmniej, ratusz.x, ratusz.z) || ratusz;
    const r = najmniej !== 'jagody' || najblizszyZasob('jagody', skup.x, skup.z, 26) ? najblizszyZasob(najmniej, skup.x, skup.z, 50) : null;
    if (o && r) rozkazZbieraj(o, r);
    else if (o && najmniej === 'jagody') stop(o); // bez krzaków: osadnik staje i za chwilę idzie na pole (albo je zbuduje)
  }

  // 4. szkolenie osadników
  const kolejkaOs = ratusz.kolejka.filter(q => q.rodzaj === 'j').length;
  if (osadnicy.length + kolejkaOs < celOs && ratusz.kolejka.length < 2 && !ratusz.kolejka.some(q => q.rodzaj === 'era') && lud < limit && stacR(JEDNOSTKI.osadnik.koszt)) dodajDoKolejki(ratusz, 'j', 'osadnik');
  // 5. domy
  if (limit < MAKS_LUDNOSC && limit - lud <= 2 + era && budowane.filter(b => b.typ === 'dom').length < (lud > 30 ? 2 : 1) && stac(strona, BUDYNKI.dom.koszt)) {
    aiPostaw(strona, 'dom', aiMiejsce('dom', ratusz.x, ratusz.z, 5, 16, 1), osadnicy);
  }
  // 6. miejsca do odnoszenia surowców blisko pracy
  const potrzebaSkupu = (typ, sur, minLudzi) => {
    if (brakBudynku(strona, typ) || budowane.some(b => b.typ === typ) || licz[sur] < minLudzi || !stacR(BUDYNKI[typ].koszt)) return;
    const r = najblizszyZasob(sur, ratusz.x, ratusz.z, 40); if (!r) return;
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
  if (era >= 2) {
    postawRaz('kuznia'); postawRaz('strzelnica'); postawRaz('stajnia', maG('kuznia'));
    if (!ma('kopalnia')) { const r = najblizszyZasob('zelazo', ratusz.x, ratusz.z, 40); if (r && stacR(BUDYNKI.kopalnia.koszt)) aiPostaw(strona, 'kopalnia', aiMiejsce('kopalnia', r.x, r.z, 2, 6, 1), osadnicy); }
  }
  if (era >= 3) postawRaz('warsztat');
  const wieze = moje.filter(b => b.typ === 'wieza').length;
  if (era >= 2 && wieze < T.wieze && osadnicy.length >= celOs - 4 && stacR(BUDYNKI.wieza.koszt) && !budowane.some(b => b.typ === 'wieza'))
    aiPostaw(strona, 'wieza', aiMiejsce('wieza', ratusz.x + kier[0] * (8 + wieze * 2) - kier[1] * (wieze - 1) * 5, ratusz.z + kier[1] * (8 + wieze * 2) + kier[0] * (wieze - 1) * 5, 0, 5, 1), osadnicy);
  // 8. nowa era
  if (oszczedza && !ratusz.kolejka.length && !brakEry(strona) && stac(strona, nastEra.koszt)) dodajDoKolejki(ratusz, 'era');
  // 9. ulepszenia
  for (const id of ['kosz', 'rekawice', 'deski', 'sciolka', 'kilof', 'taczka', 'siekiera_z', 'kilof_z', 'bron1', 'zbroja1', 'pociski1', 'aw_tarczownik', 'aw_procarz2', 'nawadnianie',
    'wozek', 'pila', 'bron2', 'zbroja2', 'pociski2', 'aw_obronca', 'aw_pikinier', 'aw_kusznik', 'aw_jezdziec', 'mrozoodporne', 'bron3', 'zbroja3', 'pociski3', 'aw_rycerz']) {
    const d = ULEPSZENIA[id], b = moje.find(o => o.typ === d.z && o.gotowy && !o.kolejka.length);
    if (b && !brakUlepszenia(strona, id) && stacR(d.koszt) && (osadnicy.length >= celOs - 6 || era > 1)) { dodajDoKolejki(b, 'u', id); break; }
  }
  // 10. wojsko
  const zbior = { x: ratusz.x + kier[0] * 8, z: ratusz.z + kier[1] * 8 };
  for (const b of moje) {
    if (!b.gotowy || b.kolejka.length >= 2 || !['koszary', 'strzelnica', 'stajnia', 'warsztat'].includes(b.typ)) continue;
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
    for (const w of wyslij) rozkazNaprzod(w, wrogi.x, wrogi.z);
    A.fala++; A.nastAtak = S.czas + T.odstep;
    if (strona === KOMPUTER && !S.aiGracz) { toast('🔴 Wojsko komputera rusza na twoją osadę!'); dzwiek('alarm'); }
  }
}

// ================= krok gry =================
let symulacja = false;
function krokGry(dt) {
  S.czas += dt;
  for (let i = BUD.length - 1; i >= 0; i--) { const b = BUD[i]; if (b) aktualizujBudynek(b, dt); }
  for (let i = JED.length - 1; i >= 0; i--) { const u = JED[i]; if (u) aktualizujJednostke(u, dt); }
  rozpychaj();
  // pociski
  for (let i = POC.length - 1; i >= 0; i--) {
    const p = POC[i]; p.t += dt;
    if (zyje(p.cel)) { p.ox = p.cel.x; p.oz = p.cel.z; }
    if (p.t >= p.T) {
      if (zyje(p.cel)) zadaj(p.cel, obrazenia(p.od, p.cel, p.atak), zyje(p.od) ? p.od : null);
      scena.remove(p.mesh); POC.splice(i, 1);
    }
  }
  ai(KOMPUTER, dt);
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
    }
  }
}
function sprawdzKoniec() {
  if (S.wynik) return;
  for (const s of [STRONA_GRACZA, KOMPUTER]) {
    const maRatusz = BUD.some(b => b.strona === s && b.typ === 'ratusz');
    if (!maRatusz) { S.wynik = s === STRONA_GRACZA ? 'przegrana' : 'wygrana'; koniecGry(); return; }
  }
}

// ================= nowa gra, zapis, wczytanie =================
function nowaGra(trudnosc) {
  wyczyscSwiat();
  const seed = Math.floor(Math.random() * 1e9);
  S = { v: 1, seed, trudnosc, trudnoscGracza: 'sredni', czas: 0, nextId: 1, zas: [{ ...START }, { ...START }], era: [1, 1], ul: [{}, {}], wynik: null,
    stat: [0, 1].map(() => ({ zebrane: 0, wyszkoleni: 0, pokonani: 0, zburzone: 0, budynki: 0 })), ai: [nowyAI(), nowyAI()], usuniete: [], pomoc: {}, aiGracz: false };
  S.nextId = generujMape(seed);
  zbudujZiemie();
  for (const s of [STRONA_GRACZA, KOMPUTER]) {
    const cx = s === STRONA_GRACZA ? 30 : -30, cz = cx;
    const r = nowyBudynek(s, 'ratusz', cx + POL - 2, cz + POL - 2, true);
    for (let k = 0; k < 3; k++) { const a = (s ? 0.8 : -2.35) + (k - 1) * 0.6; nowaJednostka(s, 'osadnik', r.x + Math.sin(a) * 3.2, r.z + Math.cos(a) * 3.2); }
  }
  kam.x = 30; kam.z = 30; kam.d = 30;
  zapiszGre();
}
function zbudujZiemie() {
  ziemia = new THREE.Mesh(new THREE.PlaneGeometry(N, N).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: malujZiemie(S.seed) }));
  ziemia.receiveShadow = true; scena.add(ziemia);
  dalej = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#5f9e4a' }));
  dalej.position.y = -0.05; scena.add(dalej);
}
function zadDoZapisu(z) {
  if (!z) return null;
  const o = {};
  for (const k of ['typ', 'zid', 'sur', 'bid', 'cid', 'x', 'z', 'faza', 'ox', 'oz', 'sx', 'sz', 'wraca', 'skup']) if (z[k] !== undefined) o[k] = typeof z[k] === 'number' ? Math.round(z[k] * 100) / 100 : z[k];
  if (o.faza === 'dochodzi' || o.faza === 'zbiera') o.faza = 'idz';
  if (z.potem) o.potem = zadDoZapisu(z.potem);
  return o;
}
function stanDoZapisu() {
  const o = { ...S };
  o.zasoby = []; for (const z0 of ZAS.values()) if (z0.ile !== z0.start) o.zasoby.push([z0.id, Math.round(z0.ile * 10) / 10]);
  o.bud = BUD.map(b => [b.id, b.strona, b.typ, b.i0, b.j0, Math.round(b.hp), Math.round(b.postep * 1000) / 1000, b.kolejka.map(q => [q.rodzaj, q.typ, Math.round(q.t * 10) / 10, q.czas, q.koszt]), b.zbiorka, b.rolnik || 0]);
  o.jed = JED.map(u => [u.id, u.strona, u.typ, Math.round(u.x * 100) / 100, Math.round(u.z * 100) / 100, Math.round(u.hp * 10) / 10, u.niesie.sur, Math.round(u.niesie.ile * 10) / 10, zadDoZapisu(u.zad)]);
  o.kamera = [kam.x, kam.z, kam.d];
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
}
function wczytajGre(o) {
  przerobStaryZapis(o);
  wyczyscSwiat();
  S = { ...o }; delete S.zasoby; delete S.bud; delete S.jed; delete S.kamera;
  generujMape(S.seed);
  zbudujZiemie();
  for (const id of S.usuniete) { const z0 = ZAS.get(id); if (z0) { S.usuniete = S.usuniete.filter(x => x !== id); usunZasob(z0); } }
  S.usuniete = [...o.usuniete];
  for (const [id, ile] of o.zasoby) { const z0 = ZAS.get(id); if (z0) z0.ile = ile; }
  sprzatnijListy();
  for (const [id, strona, typ, i0, j0, hp, postep, kolejka, zbiorka, rolnik] of o.bud) {
    const b = nowyBudynek(strona, typ, i0, j0, postep >= 1, id);
    b.hp = hp; b.postep = postep; b.zbiorka = zbiorka; b.rolnik = rolnik;
    b.kolejka = kolejka.map(([rodzaj, t, czasT, czas, koszt]) => ({ rodzaj, typ: t, t: czasT, czas, koszt }));
    if (!b.gotowy) b.mesh.scale.y = 0.12 + 0.88 * postep;
  }
  for (const [id, strona, typ, x, z, hp, sur, ile, zad] of o.jed) {
    const u = nowaJednostka(strona, typ, x, z, id);
    u.hp = hp; u.niesie = { sur, ile }; u.zad = zad;
  }
  if (o.kamera) [kam.x, kam.z, kam.d] = o.kamera;
}

// ================= kamera i rysowanie =================
const EL = 0.98; // nachylenie kamery
function ustawKamere() {
  kam.x = Math.max(-46, Math.min(46, kam.x)); kam.z = Math.max(-46, Math.min(46, kam.z)); kam.d = Math.max(13, Math.min(62, kam.d));
  const h = Math.sin(EL) * kam.d, p = Math.cos(EL) * kam.d / Math.SQRT2;
  kamera.position.set(kam.x + p, h, kam.z + p); kamera.lookAt(kam.x, 0, kam.z); kamera.updateMatrixWorld();
  slonce.position.set(kam.x - 14, 34, kam.z - 4); slonce.target.position.set(kam.x, 0, kam.z);
  const sc = slonce.shadow.camera, r = Math.min(38, kam.d * 0.85);
  if (sc.right !== r) { sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1; sc.far = 90; sc.updateProjectionMatrix(); }
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
  e.pierscien = new THREE.Mesh(g, MAT_RING[e.strona === KOMPUTER || e.strona == null ? 1 : 0]);
  if (e.strona == null) e.pierscien.material = MAT_ZNACZNIK;
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
const NARZ_PRACY = { zbieraj: { jagody: 'zrywa', drewno: 'siekiera', kamien: 'kilof', zelazo: 'kilof' }, farma: 'zrywa', buduj: 'mlotek', atakuj: 'siekiera' };
const lerp = (a, b, t) => a + (b - a) * t;
function ruszReka(u, dt) {
  const z = u.zad, nz = z ? (z.typ === 'zbieraj' ? NARZ_PRACY.zbieraj[z.sur] : NARZ_PRACY[z.typ]) : null;
  const narz = nz && !(z.faza === 'niesie' && nz === 'zrywa') ? nz : 'reka';
  if (!u.ramie) { u.ramie = new THREE.Group(); u.ramie.position.set(0.27, 0.73, 0); u.mesh.add(u.ramie); }
  if (u.narz !== narz) {
    if (u.ramieM) u.ramie.remove(u.ramieM);
    u.ramieM = new THREE.Mesh(MOD.ramie3D(narz, u.strona), MAT); u.ramie.add(u.ramieM); u.narz = narz;
  }
  const kosz = narz === 'zrywa';
  if (kosz && !u.koszBok) { u.koszBok = new THREE.Mesh(MOD.koszBok(), MAT); u.koszBok.position.set(-0.3, 0.42, 0.08); u.mesh.add(u.koszBok); }
  if (u.koszBok) u.koszBok.visible = kosz;
  let rx = 0, rz = 0;
  if (u.pracuje) {
    if (narz === 'siekiera') { const p = (u.t * 1.5) % 1; rx = p < 0.22 ? lerp(-2.4, -0.25, p / 0.22) : lerp(-0.25, -2.4, (p - 0.22) / 0.78); rz = -0.45; }
    else if (narz === 'kilof') { const p = (u.t * 1.2) % 1; rx = p < 0.2 ? lerp(-2.8, 0.05, p / 0.2) : lerp(0.05, -2.8, (p - 0.2) / 0.8); }
    else if (narz === 'mlotek') { const p = (u.t * 2.4) % 1; rx = p < 0.3 ? lerp(-1.9, -0.55, p / 0.3) : lerp(-0.55, -1.9, (p - 0.3) / 0.7); }
    else if (narz === 'zrywa') {
      // ręka sięga do krzaka i wraca do koszyka przy boku
      const p = (u.t * 0.9) % 1, s = Math.sin(p * Math.PI * 2);
      rx = lerp(-1.25, -0.15, (s + 1) / 2); rz = s > 0 ? lerp(0, 0.75, s) : 0;
    }
  } else if (u.idzie) rx = Math.sin(u.t * 11) * 0.45;
  else rx = narz === 'reka' ? 0 : -0.35;
  const k = Math.min(1, dt * 25);
  u.ramie.rotation.x += (rx - u.ramie.rotation.x) * k; u.ramie.rotation.z += (rz - u.ramie.rotation.z) * k;
}
function rysuj(dt) {
  czasRys += dt;
  ustawKamere();
  for (const u of JED) {
    u.t += dt;
    const m = u.mesh;
    let dr = u.ry - m.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); m.rotation.y += dr * Math.min(1, dt * 12);
    // wojsko walczące wręcz: krótki wypad do przodu przy uderzeniu (bez kiwania całym ciałem)
    let wypad = 0;
    if (u.pracuje && u.d.wojsko && !u.d.zasieg) { const f = (u.d.odstep - u.cd) / 0.3; if (f >= 0 && f <= 1) wypad = Math.sin(f * Math.PI) * (u.d.tylkoBudynki ? 0.3 : 0.16); }
    m.position.set(u.x + Math.sin(m.rotation.y) * wypad, u.idzie ? Math.abs(Math.sin(u.t * 11)) * 0.05 : 0, u.z + Math.cos(m.rotation.y) * wypad);
    if (u.typ === 'osadnik') ruszReka(u, dt);
    // co niesie osadnik
    if (u.typ === 'osadnik') {
      const s = u.niesie.ile > 0.5 ? u.niesie.sur : null;
      if (s !== u.pokazane) {
        if (u.koszyk) { m.remove(u.koszyk); u.koszyk = null; }
        if (s) {
          const g = NIESIE3D[s] || (NIESIE3D[s] = s === 'jagody' ? MOD.kosz() : s === 'drewno' ? MOD.polacz([{ g: new THREE.CylinderGeometry(0.09, 0.09, 0.6, 6).rotateZ(Math.PI / 2), k: '#9a6a3a', m: new THREE.Matrix4() }]) : MOD.skala(s === 'zelazo' ? 'ruda' : s));
          u.koszyk = new THREE.Mesh(g, MAT); u.koszyk.position.set(0, 0.95, -0.2); if (s === 'kamien' || s === 'zelazo') u.koszyk.scale.setScalar(0.45); m.add(u.koszyk);
        }
        u.pokazane = s;
      }
    }
    if (u.pierscien) { u.pierscien.position.set(u.x, 0.04, u.z); u.pierscien.visible = wybrane.includes(u); }
  }
  for (const b of BUD) {
    if (!b.gotowy) b.mesh.scale.y = 0.12 + 0.88 * b.postep;
    if (b.plac) b.plac.scale.y = 1 / b.mesh.scale.y;
    if (b.pierscien) { b.pierscien.position.set(b.x, 0.05, b.z); b.pierscien.visible = wybrane.includes(b); }
  }
  for (const e of wybrane) { const p = pierscien(e); if (!jestBudynkiem(e) && e.strona == null) p.position.set(e.x, 0.05, e.z); p.visible = true; }
  for (const p of POC) {
    const t = Math.min(1, p.t / p.T), y = p.y0 * (1 - t) + 0.6 * t + Math.sin(t * Math.PI) * 1.2;
    p.mesh.position.set(p.x0 + (p.ox - p.x0) * t, y, p.z0 + (p.oz - p.z0) * t);
  }
  for (let i = UMIERA.length - 1; i >= 0; i--) {
    const u = UMIERA[i]; u.t += dt;
    if (u.j) { u.mesh.rotation.z = Math.min(1, u.t / 0.4) * 1.45; u.mesh.position.y = u.t > 1.2 ? -(u.t - 1.2) * 0.6 : 0; }
    else u.mesh.position.y = -u.t * 1.6;
    if (u.t > (u.j ? 2.4 : 2.5)) { scena.remove(u.mesh); UMIERA.splice(i, 1); }
  }
  if (znacznik && znacznik.visible) { znacznik.userData.t -= dt; const t = znacznik.userData.t; znacznik.scale.setScalar(1 + (0.7 - t) * 1.2); znacznik.material.opacity = Math.max(0, t / 0.7); if (t <= 0) znacznik.visible = false; }
  if (ping) { ping.t -= dt; if (ping.t <= 0) ping = null; }
  renderer.render(scena, kamera);
  rysujNakladke();
}
// paski życia i ramka zaznaczania (na płaskiej warstwie nad grą)
function rysujNakladke() {
  const nk = $('nakladka'), c = nk.getContext('2d'), dpr = nk.width / innerWidth;
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
  const pasek = (e, h, szer) => {
    const [x, y, z] = naEkran(e.x, h, e.z); if (z > 1 || x < -50 || y < -50 || x > innerWidth + 50 || y > innerHeight + 50) return;
    const w = szer, p = Math.max(0, e.hp / e.max);
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x - w / 2 - 1, y - 1, w + 2, 6);
    c.fillStyle = e.strona === KOMPUTER ? '#ff5a4a' : '#4cff7a'; c.fillRect(x - w / 2, y, w * p, 4);
  };
  for (const u of JED) if (wybrane.includes(u) || u.hp < u.max && S.czas - (u.trafiony || -99) < 4) pasek(u, u.d.linia === 'renifer' ? 2.2 : 1.6, 26);
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
const MINI = 120, MK = (MINI / 2) / (POL * Math.SQRT2);
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
    t.fillStyle = '#7cc35e'; t.fillRect(-POL * s / Math.SQRT2 * Math.SQRT2 / Math.SQRT2 * Math.SQRT2 / Math.SQRT2, -POL * s / Math.SQRT2, N * s / Math.SQRT2, N * s / Math.SQRT2);
    t.restore();
    const kol = { drzewo: '#2c6e33', krzak: '#3a4bb0', kamien: '#9aa0a8', ruda: '#c4622d' };
    for (const z0 of ZAS.values()) { const [x, y] = naMini(z0.x, z0.z); t.fillStyle = kol[z0.rodzaj]; t.fillRect(x - 0.8, y - 0.8, z0.rodzaj === 'drzewo' ? 1.6 : 2.2, z0.rodzaj === 'drzewo' ? 1.6 : 2.2); }
  }
  c.clearRect(0, 0, MINI, MINI); c.drawImage(miniTlo, 0, 0, MINI, MINI);
  for (const b of BUD) { const [x, y] = naMini(b.x, b.z), r = b.w * MK * 0.75; c.fillStyle = MOD.KOLORY_STRON[b.strona]; c.fillRect(x - r, y - r, r * 2, r * 2); }
  for (const u of JED) { const [x, y] = naMini(u.x, u.z); c.fillStyle = u.strona ? '#ff6a5a' : '#7fb2ff'; c.fillRect(x - 1, y - 1, 2.2, 2.2); }
  // co widać na ekranie
  const rogi = [[0, 0], [innerWidth, 0], [innerWidth, innerHeight], [0, innerHeight]].map(([px, py]) => naZiemi(px, py)).filter(Boolean);
  if (rogi.length === 4) { c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.beginPath(); rogi.forEach((p, i) => { const [x, y] = naMini(p.x, p.z); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.stroke(); }
  if (ping) { const [x, y] = naMini(ping.x, ping.z); c.strokeStyle = '#ff3b30'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 4 + (3 - ping.t) * 4 % 8, 0, 7); c.stroke(); }
}

// ================= dotyk: zaznaczanie, rozkazy, przesuwanie mapy =================
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ziemiaPl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function promien(px, py) { ndc.set(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1); ray.setFromCamera(ndc, kamera); return ray.ray; }
function naZiemi(px, py) { ustawKamere(); const p = new THREE.Vector3(); return promien(px, py).intersectPlane(ziemiaPl, p) ? p : null; }
const BX = new THREE.Box3(), TRAF = new THREE.Vector3(), PKT = new THREE.Vector3();
function wskaz(px, py) {
  const g = naZiemi(px, py); if (!g) return null;
  const r = promien(px, py), tol = Math.max(0.5, kam.d * 0.02);
  let naj = null, nd = Infinity;
  for (const u of JED) {
    if (Math.abs(u.x - g.x) > 5 || Math.abs(u.z - g.z) > 5) continue;
    PKT.set(u.x, u.d.linia === 'renifer' ? 0.95 : 0.55, u.z);
    const rr = u.d.r + tol; if (r.distanceSqToPoint(PKT) < rr * rr) { const d = r.origin.distanceTo(PKT) + (u.strona === STRONA_GRACZA ? 0 : 0.5); if (d < nd) { nd = d; naj = u; } }
  }
  if (naj) return naj;
  for (const b of BUD) {
    if (Math.abs(b.x - g.x) > 10 || Math.abs(b.z - g.z) > 10) continue;
    const h = b.w / 2 - 0.1; BX.min.set(b.x - h, 0, b.z - h); BX.max.set(b.x + h, b.gotowy ? wysokoscBud(b) : 0.6, b.z + h);
    if (r.intersectBox(BX, TRAF)) { const d = r.origin.distanceTo(TRAF); if (d < nd) { nd = d; naj = b; } }
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
  for (const e of wybrane) if (e.pierscien) e.pierscien.visible = false;
  wybrane = lista.filter(e => e && (E.get(e.id) === e));
  if (wybrane.length) S.pomoc.zaznaczyl = true;
  odswiezPanel(true);
}
let ostKlik = null;
function klik(px, py) {
  audio();
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
  if (b && b.gotowy && produkuje(b) && (!cel || cel.rodzaj || cel.d.pole && cel.strona === STRONA_GRACZA && b.typ === 'ratusz')) {
    b.zbiorka = cel && cel.rodzaj ? { x: cel.x, z: cel.z, zid: cel.id } : cel ? { x: cel.x, z: cel.z, bid: cel.id } : { x: g.x, z: g.z };
    pokazZnacznik(b.zbiorka.x, b.zbiorka.z); dzwiek('rozkaz'); toast('🚩 Tu przyjdą nowi ' + (b.typ === 'ratusz' ? 'zbieracze' : 'żołnierze'));
    return;
  }
  zaznacz(cel ? [cel] : []);
  if (cel) dzwiek('klik');
}
const produkuje = b => b.typ === 'ratusz' || Object.values(JEDNOSTKI).some(d => d.z === b.typ);
function rozkaz(moje, cel, g) {
  dzwiek('rozkaz');
  if (cel && cel.strona === KOMPUTER) {
    for (const u of moje) if (!u.d.tylkoBudynki || jestBudynkiem(cel)) rozkazAtak(u, cel); else rozkazIdz(u, cel.x, cel.z);
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
      if (u.typ !== 'osadnik') { rozkazIdz(u, cel.x + losowo(-2, 2), cel.z + cel.w / 2 + 1.5); continue; }
      if (!cel.gotowy || cel.hp < cel.max && !cel.d.pole && false) rozkazBuduj(u, cel);
      else if (cel.d.pole && !rolnik) { rozkazFarma(u, cel); rolnik = true; }
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
  if (palce.size === 1) gest = { x0: e.clientX, y0: e.clientY, ruch: false, ziemia: naZiemi(e.clientX, e.clientY) };
  else if (palce.size === 2) {
    const [a, b] = [...palce.values()];
    gest = { szczyp: true, d0: Math.hypot(a.x - b.x, a.y - b.y), kd: kam.d, ziemia: naZiemi((a.x + b.x) / 2, (a.y + b.y) / 2), ruch: true };
  }
});
plotno.addEventListener('pointermove', e => {
  if (!palce.has(e.pointerId) || !gest) return;
  palce.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (gest.szczyp && palce.size >= 2) {
    const [a, b] = [...palce.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    kam.d = gest.kd * gest.d0 / Math.max(20, d); ustawKamere();
    const g = naZiemi((a.x + b.x) / 2, (a.y + b.y) / 2);
    if (g && gest.ziemia) { kam.x += gest.ziemia.x - g.x; kam.z += gest.ziemia.z - g.z; ustawKamere(); }
    return;
  }
  if (palce.size !== 1 || gest.szczyp) return;
  if (!gest.ruch && Math.hypot(e.clientX - gest.x0, e.clientY - gest.y0) > 10) {
    gest.ruch = true;
    if (tryb) gest.duch = true;
    else if (trybObszar) gest.ramka = { x0: gest.x0, y0: gest.y0, x1: e.clientX, y1: e.clientY };
  }
  if (!gest.ruch) return;
  if (gest.duch) { const g = naZiemi(e.clientX, e.clientY - 40); if (g) przesunDucha(g.x, g.z); return; }
  if (gest.ramka) { gest.ramka.x1 = e.clientX; gest.ramka.y1 = e.clientY; return; }
  const g = naZiemi(e.clientX, e.clientY);
  if (g && gest.ziemia) { kam.x += gest.ziemia.x - g.x; kam.z += gest.ziemia.z - g.z; ustawKamere(); }
});
function puscPalec(e) {
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
function zacznijStawianie(typ) {
  const br = brakBudynku(STRONA_GRACZA, typ); if (br) { toast(br); dzwiek('blad'); return; }
  if (!stac(STRONA_GRACZA, BUDYNKI[typ].koszt)) { toast('Za mało surowców'); dzwiek('blad'); return; }
  const duch = new THREE.Mesh(MOD.budynek(typ, STRONA_GRACZA), new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false }));
  const w = BUDYNKI[typ].w, plama = new THREE.Mesh(new THREE.PlaneGeometry(w, w).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#4cff7a', transparent: true, opacity: 0.35, depthWrite: false }));
  plama.renderOrder = 2; duch.renderOrder = 3;
  scena.add(duch, plama);
  tryb = { typ, duch, plama, i0: 0, j0: 0, ok: false };
  // pierwsze miejsce: wolne miejsce najbliżej środka ekranu
  const g = naZiemi(innerWidth / 2, innerHeight * 0.45) || { x: kam.x, z: kam.z };
  const m = aiMiejsce(typ, g.x, g.z, 0, 8, 0);
  przesunDucha(m ? m[0] - POL + w / 2 : g.x, m ? m[1] - POL + w / 2 : g.z);
  $('panel').hidden = true; $('stawianie').hidden = false;
}
function przesunDucha(x, z) {
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
function zakonczStawianie() {
  if (!tryb) return;
  scena.remove(tryb.duch, tryb.plama); tryb.duch.material.dispose(); tryb.plama.geometry.dispose(); tryb.plama.material.dispose();
  tryb = null; $('stawianie').hidden = true; $('panel').hidden = false; odswiezPanel(true);
}
$('st-anuluj').onclick = () => { dzwiek('klik'); zakonczStawianie(); };
$('st-tak').onclick = () => {
  if (!tryb || !tryb.ok) return;
  const typ = tryb.typ;
  if (!zaplac(STRONA_GRACZA, BUDYNKI[typ].koszt)) { toast('Za mało surowców'); dzwiek('blad'); return; }
  const b = nowyBudynek(STRONA_GRACZA, typ, tryb.i0, tryb.j0);
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
  const klucz = sel.map(e => e.id).join(',') + '|' + S.era[0] + '|' + (pierwszy && jestBudynkiem(pierwszy) ? pierwszy.gotowy + ':' + pierwszy.kolejka.map(q => q.typ).join('.') + ':' + Object.keys(S.ul[0]).join('.') : '');
  if (!wymus && klucz === panelKlucz) { aktualizujPanel(); return; }
  panelKlucz = klucz;
  let h = '', a = '';
  if (!sel.length) {
    h = `<div class="p-nic">👆 Dotknij zbieracza albo budynku.<br><small>Przesuwaj palcem mapę, dwoma palcami przybliżaj.</small></div>`;
  } else if (pierwszy.rodzaj) {
    h = `<div class="p-glowa"><span class="p-ik">${EMOJI_SUR[pierwszy.sur]}</span><div><b>${{ drzewo: 'Drzewo', krzak: 'Krzak z jagodami', kamien: 'Kamień', ruda: 'Ruda żelaza' }[pierwszy.rodzaj]}</b><small data-ile>Zostało: ${Math.ceil(pierwszy.ile)}</small></div></div>`;
  } else if (jestBudynkiem(pierwszy)) {
    const b = pierwszy, moj = b.strona === STRONA_GRACZA;
    h = `<div class="p-glowa"><span class="p-ik">${b.d.emoji}</span><div><b>${b.d.nazwa}${moj ? '' : ' (komputer)'}</b><small data-hp>❤️ ${Math.ceil(b.hp)} / ${b.max}</small><div class="p-hp"><i data-hpb style="width:${b.hp / b.max * 100}%"></i></div></div><button class="p-x" data-a="odznacz">✖</button></div>`;
    if (moj && !b.gotowy) h += `<div class="p-opis">Plac budowy: zaznacz zbieraczy i dotknij go, żeby budowali.</div>`;
    else if (moj) {
      h += `<div class="p-opis">${b.d.opis}${b.d.pole ? (wolnePole(b) ? ' · nikt tu nie pracuje' : ' · pracuje tu zbieracz') : ''}${produkuje(b) ? ' · dotknij ziemi, żeby wskazać, dokąd mają iść nowi' : ''}</div>`;
      const typy = typyBudynku(0, b.typ);
      for (const t of Object.keys(JEDNOSTKI)) if (JEDNOSTKI[t].z === b.typ && !typy.includes(t) && !JEDNOSTKI[t].awans && JEDNOSTKI[t].era > S.era[0]) typy.push(t);
      for (const t of typy) {
        const d = JEDNOSTKI[t], br = brakJednostki(0, t);
        a += `<button class="akcja${br ? ' zablok' : ''}" data-a="szkol:${t}" data-koszt='${JSON.stringify(d.koszt)}'><span class="ak-ik">${d.emoji}</span><b>${d.nazwa}</b><small>${br || d.opis}</small><span class="ak-koszt">${kosztHTML(d.koszt)}</span></button>`;
      }
      if (b.typ === 'ratusz' && NOWA_ERA[S.era[0] + 1]) {
        const ne = NOWA_ERA[S.era[0] + 1], br = brakEry(0);
        a += `<button class="akcja era${br ? ' zablok' : ''}" data-a="era" data-koszt='${JSON.stringify(ne.koszt)}'><span class="ak-ik">${EMOJI_ERY[S.era[0] + 1]}</span><b>Era ${S.era[0] + 1}: ${ERY[S.era[0] + 1]}</b><small>${br || 'Nowe budynki, wojsko i ulepszenia'}</small><span class="ak-koszt">${kosztHTML(ne.koszt)}</span></button>`;
      }
      for (const [id, d] of Object.entries(ULEPSZENIA)) if (d.z === b.typ) {
        const br = brakUlepszenia(0, id); if (br === 'gotowe' || br === 'w trakcie') continue;
        a += `<button class="akcja${br ? ' zablok' : ''}" data-a="ul:${id}" data-koszt='${JSON.stringify(d.koszt)}'><span class="ak-ik">${d.emoji}</span><b>${d.nazwa}</b><small>${br || d.opis}</small><span class="ak-koszt">${kosztHTML(d.koszt)}</span></button>`;
      }
      if (b.kolejka.length) {
        h += `<div class="p-kolejka">` + b.kolejka.map((q, i) => `<button class="kol" data-a="anuluj:${i}" title="Anuluj"><span>${q.rodzaj === 'j' ? JEDNOSTKI[q.typ].emoji : q.rodzaj === 'u' ? ULEPSZENIA[q.typ].emoji : EMOJI_ERY[S.era[0] + 1]}</span><i data-kol="${i}" style="width:${q.t / q.czas * 100}%"></i></button>`).join('') + `<small data-czeka></small></div>`;
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
      } else h += `<div class="p-opis">Dotknij wroga, żeby atakować, albo ziemi, żeby iść.</div>`;
      a = `<button class="akcja maly" data-a="stop"><span class="ak-ik">✋</span><b>Stój</b></button>` + a;
    }
  }
  info.innerHTML = h; p.innerHTML = a; p.scrollLeft = 0;
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
$('panel').addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b || !S) return;
  audio();
  const [akcja, arg] = b.dataset.a.split(':'), cel = wybrane[0];
  if (akcja === 'odznacz') { zaznacz([]); dzwiek('klik'); return; }
  if (akcja === 'stop') { for (const u of wybrane) if (u.strona === STRONA_GRACZA && !jestBudynkiem(u)) stop(u); dzwiek('klik'); return; }
  if (akcja === 'bud') { dzwiek('klik'); zacznijStawianie(arg); return; }
  if (!cel || !jestBudynkiem(cel)) return;
  let blad = null;
  if (akcja === 'szkol') blad = dodajDoKolejki(cel, 'j', arg);
  else if (akcja === 'ul') blad = dodajDoKolejki(cel, 'u', arg);
  else if (akcja === 'era') blad = dodajDoKolejki(cel, 'era');
  else if (akcja === 'anuluj') { anulujZKolejki(cel, +arg); dzwiek('klik'); odswiezPanel(true); return; }
  if (blad) { toast(blad); dzwiek('blad'); } else dzwiek('tak');
  odswiezPanel(true);
});

// ================= pasek u góry, przyciski, podpowiedzi =================
function odswiezHud() {
  const z = S.zas[0];
  for (const s of SUROWCE) $('z-' + s).textContent = Math.floor(z[s]);
  const lud = ludnosc(0), lim = limitLudnosci(0);
  $('z-lud').textContent = `${lud}/${lim}`; $('c-lud').classList.toggle('pelno', lud >= lim && lim < MAKS_LUDNOSC);
  $('h-era').textContent = `${EMOJI_ERY[S.era[0]]} Era ${S.era[0]}: ${ERY[S.era[0]]}`;
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
  if (!S.pomoc.zaznaczyl) return '👆 Dotknij zbieracza, a potem krzaka z jagodami 🫐';
  if (limitLudnosci(0) - lud.length <= 1 && limitLudnosci(0) < MAKS_LUDNOSC && !bud.some(b => b.typ === 'dom' && !b.gotowy)) return '🏠 Brak miejsca: zaznacz zbieracza i zbuduj dom';
  if (os.some(u => !u.zad) && S.czas < 300) return '🧑‍🌾 Masz wolnych zbieraczy: wyślij ich do pracy';
  if (os.length < 7) return '🏡 Dotknij Dworku i szkol zbieraczy';
  if (!ma('tartak')) return '🪚 Zbuduj tartak przy lesie: drewno będzie szybciej';
  if (!ma('koszary')) return '🛡️ Zbuduj Strażnicę Krzaka';
  if (S.era[0] === 1) return brakEry(0) ? '🏗️ Do ery 2 potrzeba 2 różnych budynków (np. tartak i Strażnica Krzaka)' : '🌸 Zbierz 500 jagód i w Dworku przejdź do ery 2: Kwitnienie';
  if (!ma('kopalnia')) return '⛏️ Zbuduj kopalnię rudy żelaza przy rdzawych skałach';
  if (woj.length < 8) return '🛡️ Szkol wojsko w Strażnicy Krzaka';
  if (S.era[0] === 2) return '🫐 W Dworku przejdź do ery 3: Owocowanie (potrzeba 200 żelaza)';
  if (S.era[0] === 3 && woj.length >= 12) return '🧺 W Dworku przejdź do ery 4: Wielkie Zbiory (rycerze na łosiach, katapulty)';
  return '🚩 Zaznacz wojsko ⚔️ i dotknij czerwonego Dworku';
}
let toastT = null;
function toast(t) { if (symulacja) return; const el = $('toast'); el.textContent = t; el.hidden = false; el.classList.remove('pokaz'); void el.offsetWidth; el.classList.add('pokaz'); clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3200); }
function baner(t1, t2) { if (symulacja) return; const el = $('baner'); el.querySelector('b').textContent = t1; el.querySelector('small').textContent = t2; el.hidden = false; el.classList.remove('pokaz'); void el.offsetWidth; el.classList.add('pokaz'); setTimeout(() => { el.hidden = true; }, 3000); }
let bezczynnyNr = 0;
$('b-bezczynni').onclick = () => {
  audio(); const l = JED.filter(u => u.strona === 0 && u.typ === 'osadnik' && !u.zad);
  if (!l.length) { toast('Wszyscy zbieracze pracują 👍'); return; }
  const u = l[bezczynnyNr++ % l.length]; zaznacz([u]); kam.x = u.x; kam.z = u.z; dzwiek('tak');
};
$('b-wojsko').onclick = () => {
  audio(); const l = JED.filter(u => u.strona === 0 && u.d.wojsko);
  if (!l.length) { toast('Nie masz jeszcze wojska: zbuduj Strażnicę Krzaka'); return; }
  zaznacz(l); dzwiek('tak');
};
$('b-dom').onclick = () => { audio(); const r = BUD.find(b => b.strona === 0 && b.typ === 'ratusz'); if (r) { kam.x = r.x; kam.z = r.z; } dzwiek('klik'); };
$('b-obszar').onclick = () => { audio(); trybObszar = !trybObszar; $('b-obszar').classList.toggle('wl', trybObszar); if (trybObszar) toast('Przeciągnij palcem ramkę wokół swoich ludzi'); };

// ================= okna =================
const OKNA = ['o-menu', 'o-nowa', 'o-pauza', 'o-koniec', 'o-wersje'];
function pokazOkno(id) { for (const o of OKNA) $(o).hidden = o !== id; $('gra-ui').hidden = !!id; }
function ukryjOkna() { pokazOkno(null); }
function ustawPrzelaczniki() { for (const [id, k] of [['m-muz', 'muzyka'], ['m-dzw', 'dzwieki'], ['p-muz', 'muzyka'], ['p-dzw', 'dzwieki']]) { $(id).textContent = zapis[k] ? 'wł.' : 'wył.'; $(id).classList.toggle('wl', zapis[k]); } }
function pokazMenu() {
  pauza = true; if (muzyka) muzyka.pause();
  const jest = zapis.gra && !zapis.gra.wynik;
  $('m-dalej').hidden = !jest;
  if (jest) $('m-dalej').textContent = `Graj dalej (${TRUDNOSC[zapis.gra.trudnosc].nazwa.toLowerCase()}, ${Math.floor(zapis.gra.czas / 60)} min)`;
  const w = zapis.wygrane, ile = Object.values(w).reduce((a, b) => a + b, 0);
  $('m-wygrane').textContent = ile ? `🏆 Wygrane: ${Object.entries(w).filter(([, n]) => n).map(([k, n]) => `${TRUDNOSC[k].nazwa.toLowerCase()} ${n}`).join(', ')}` : '';
  $('m-wersja').textContent = `Age of Haskap II, wersja ${WERSJA}`;
  $('m-wersje').hidden = false;
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
function startuj() { ukryjOkna(); pauza = false; odswiezPanel(true); odswiezHud(); grajMuzyke(); }
$('m-dalej').onclick = () => { audio(); dzwiek('klik'); if (!S || S.seed !== zapis.gra.seed || S.wynik) wczytajGre(zapis.gra); startuj(); };
$('m-nowa').onclick = () => { audio(); dzwiek('klik'); for (const b of document.querySelectorAll('[data-trudnosc]')) b.classList.toggle('wybrany', b.dataset.trudnosc === zapis.trudnosc); pokazOkno('o-nowa'); };
for (const b of document.querySelectorAll('[data-trudnosc]')) b.onclick = () => {
  audio(); dzwiek('klik'); zapis.trudnosc = b.dataset.trudnosc; zapiszDysk();
  nowaGra(zapis.trudnosc); startuj(); baner('Age of Haskap II', 'Zbieraj, buduj i pokonaj czerwoną osadę!');
};
$('n-wroc').onclick = () => { dzwiek('klik'); pokazMenu(); };
$('m-wersje').onclick = () => { location.href = '../../'; };
for (const id of ['m-muz', 'p-muz']) $(id).onclick = () => { audio(); zapis.muzyka = !zapis.muzyka; zapiszDysk(); ustawPrzelaczniki(); if (!zapis.muzyka && muzyka) muzyka.pause(); };
for (const id of ['m-dzw', 'p-dzw']) $(id).onclick = () => { audio(); zapis.dzwieki = !zapis.dzwieki; zapiszDysk(); ustawPrzelaczniki(); dzwiek('klik'); };
$('b-pauza').onclick = () => {
  if (!S) return; audio(); dzwiek('klik'); pauza = true; zapiszGre(); if (muzyka) muzyka.pause();
  $('pa-info').textContent = `${TRUDNOSC[S.trudnosc].nazwa} · ${Math.floor(S.czas / 60)} min · era ${S.era[0]} · ludzie: ${ludnosc(0)}`;
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
    pauza = true; if (muzyka) muzyka.pause();
    dzwiek(wygral ? 'wygrana' : 'przegrana');
    $('k-tytul').textContent = wygral ? '🏆 Wygrana!' : 'Tym razem przegrana';
    $('k-tekst').textContent = wygral ? 'Dworek komputera upadł. Twoja osada rządzi doliną!' : 'Komputer zburzył twój Dworek. Spróbuj jeszcze raz!';
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
  const g = c.createRadialGradient(W / 2, W / 2, W * 0.1, W / 2, W / 2, W * 0.5); g.addColorStop(0, '#fff8e0'); g.addColorStop(1, '#ffd36b');
  c.fillStyle = g; c.beginPath(); c.arc(W / 2, W / 2, W * 0.48, 0, 7); c.fill();
  c.fillStyle = '#3e8e3e'; c.beginPath(); c.ellipse(W * 0.5, W * 0.66, W * 0.3, W * 0.16, 0, 0, 7); c.fill();
  for (const [x, y, r] of [[0.36, 0.6, 0.085], [0.5, 0.55, 0.1], [0.64, 0.6, 0.085], [0.43, 0.7, 0.08], [0.57, 0.7, 0.08]]) {
    c.fillStyle = '#3a4bb0'; c.beginPath(); c.ellipse(W * x, W * y, W * r * 0.75, W * r, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(W * (x - r * 0.3), W * (y - r * 0.4), W * r * 0.18, W * r * 0.3, 0, 0, 7); c.fill();
  }
  c.fillStyle = '#f2b51c'; c.strokeStyle = '#b07a0a'; c.lineWidth = W * 0.012;
  c.beginPath(); c.moveTo(W * 0.32, W * 0.4); c.lineTo(W * 0.32, W * 0.22); c.lineTo(W * 0.41, W * 0.31); c.lineTo(W * 0.5, W * 0.17); c.lineTo(W * 0.59, W * 0.31); c.lineTo(W * 0.68, W * 0.22); c.lineTo(W * 0.68, W * 0.4); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#d8382f'; c.beginPath(); c.arc(W * 0.5, W * 0.33, W * 0.03, 0, 7); c.fill();
}

// ================= pętla =================
let ost = performance.now(), hudT = 0, miniT = 0, zapisT = 0, muzT = 0;
function klatka(t) {
  requestAnimationFrame(klatka);
  const dt = Math.min(0.1, (t - ost) / 1000); ost = t;
  if (!S) { renderer.render(scena, kamera); return; }
  if (!pauza && !S.wynik) {
    krokGry(dt);
    if ((hudT -= dt) <= 0) { hudT = 0.25; odswiezHud(); odswiezPanel(); }
    if ((zapisT -= dt) <= 0) { zapisT = 10; zapiszGre(); }
    if ((muzT -= dt) <= 0) { muzT = 1; grajMuzyke(); }
  }
  if ((miniT -= dt) <= 0) { miniT = 0.3; rysujMini(); }
  rysuj(dt);
}

// ================= start =================
rozmiar(); rysujLogo();
(function start() {
  if (zapis.gra) { try { wczytajGre(zapis.gra); } catch (e) { console.error(e); zapis.gra = null; nowaGra(zapis.trudnosc); } }
  else nowaGra(zapis.trudnosc);
  ustawKamere();
  pokazMenu();
  requestAnimationFrame(klatka);
})();

// test bez klikania (w konsoli przeglądarki): window.__haskap
window.__haskap = {
  get S() { return S; }, get JED() { return JED; }, get BUD() { return BUD; }, get ZAS() { return ZAS; }, kam,
  nowaGra, krokGry, zapiszGre, wczytajGre, stanDoZapisu, ai, dodajDoKolejki, nowyBudynek, nowaJednostka, miejsceWolne, zaznacz, klik, wskaz, rozkaz,
  // komputer gra też za gracza: sprawdzenie, czy gra się kończy i nic się nie psuje
  komputerKontraKomputer(trudnoscGracza = 'sredni') { S.aiGracz = true; S.trudnoscGracza = trudnoscGracza; },
  krok(sek, dt = 0.1, rysujTez = false) { symulacja = !rysujTez; try { for (let t = 0; t < sek && !S.wynik; t += dt) krokGry(dt); } finally { symulacja = false; } if (rysujTez) rysuj(0.016); return S.wynik; },
};
