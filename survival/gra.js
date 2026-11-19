// Yaceq Survival: gra o zbieraniu jagód kamczackich i budowaniu zimowego obozu.
import * as THREE from './three.module.min.js';
import * as MOD from './modele.js';
import { PRZEDMIOTY, WEZLY, ZWIERZETA, WEJSCIA, WARSZTAT, STALE, CENY_STALE, KRAINY, OBOZ, ZAKRES } from './krainy.js';
import { rysujIkone, ikonaURL } from './ikony.js';

const WERSJA = 2;
const KLUCZ = 'yaceq-survival';
const $ = id => document.getElementById(id);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const losowo = (a, b) => a + Math.random() * (b - a);
const dyst = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// ================= zapis =================
function nowyZapis() { return { krysztalki: 0, stale: {}, krainy: {}, odblokowane: 1, gry: {}, ostatnia: 1, muzyka: true, dzwieki: true }; }
let zapis = (() => {
  try { const z = JSON.parse(localStorage.getItem(KLUCZ)); if (z && typeof z === 'object' && z.gry) return Object.assign(nowyZapis(), z); } catch (e) { /* brak zapisu */ }
  return nowyZapis();
})();
function zapiszDysk() { try { localStorage.setItem(KLUCZ, JSON.stringify(zapis)); } catch (e) { /* pełna pamięć albo tryb prywatny */ } }
const stale = id => zapis.stale[id] || 0;

function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ================= scena 3D =================
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('scena').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 1, 230);
const hemi = new THREE.HemisphereLight('#e6f0ff', '#93a6c2', 1.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d6', 2.1);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 30, bottom: -30, near: 1, far: 90 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

let swiat = new THREE.Group(); scene.add(swiat);

// łączenie nieruchomych części modelu w jedną bryłę (szybciej na telefonach)
const MAT_V = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
const RUCHOME = /^(cz|noga|reka|ogon|glowa|ogien|lufa|swiatlo|pier|pow|splawik)/;
function polacz(geoms) {
  let n = 0; for (const g of geoms) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const g of geoms) {
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count; g.dispose();
  }
  const b = new THREE.BufferGeometry();
  b.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  b.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  b.setAttribute('color', new THREE.BufferAttribute(col, 3));
  b.computeBoundingSphere();
  return b;
}
function scal(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const geoms = [], usun = [], ruchome = [];
  let cienie = false;
  (function idz(o) {
    for (const c of o.children) {
      if (RUCHOME.test(c.name)) { ruchome.push(c); continue; }
      if (c.isMesh && c.material.isMeshLambertMaterial && !c.material.transparent && !c.material.vertexColors && c.children.length === 0) {
        const g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld));
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
        const n = g.attributes.position.count, col = new Float32Array(n * 3), m = c.material.color;
        for (let i = 0; i < n; i++) { col[i * 3] = m.r; col[i * 3 + 1] = m.g; col[i * 3 + 2] = m.b; }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geoms.push(g); usun.push(c); cienie = cienie || c.castShadow;
      } else idz(c);
    }
  })(root);
  for (const r of ruchome) if (!r.isMesh) scal(r);
  if (geoms.length >= 2) {
    for (const c of usun) c.parent.remove(c);
    const m = new THREE.Mesh(polacz(geoms), MAT_V); m.castShadow = cienie; root.add(m);
  } else for (const g of geoms) g.dispose();
  return root;
}
const PROTO = {};
function kopia(klucz, f) { if (!PROTO[klucz]) PROTO[klucz] = scal(f()); return PROTO[klucz].clone(); }
function czesci(obj, przedrostek) {
  const w = []; obj.traverse(o => { if (o.name.startsWith(przedrostek)) w.push(o); });
  return w.sort((a, b) => a.name.localeCompare(b.name));
}
function przedmiot(typ) { return kopia('p' + typ, () => MOD.przedmiot(typ)); }
const wys = typ => MOD.wysokosc(typ);

// ================= tekstury, napisy, dymki =================
function tekstura(cv) { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function nowySprite(cv, szer) {
  const m = new THREE.SpriteMaterial({ map: tekstura(cv), depthWrite: false, transparent: true });
  const s = new THREE.Sprite(m); s.scale.set(szer, szer * cv.height / cv.width, 1); s.renderOrder = 5;
  return s;
}
function plotno(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function zaokr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
const FONT = '"Lilita One", "Paytone One", "Arial Rounded MT Bold", sans-serif';
function napis(tekst, szer = 3.2, kolor = '#ffffff') {
  const cv = plotno(512, 88), c = cv.getContext('2d');
  c.font = `44px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 9; c.strokeStyle = 'rgba(25,38,60,0.85)'; c.lineJoin = 'round';
  c.strokeText(tekst, 256, 46); c.fillStyle = kolor; c.fillText(tekst, 256, 46);
  return nowySprite(cv, szer);
}
function pasekZycia() {
  const cv = plotno(96, 16), s = nowySprite(cv, 1.3); s.userData.cv = cv; s.userData.ost = -1;
  return s;
}
function rysujPasek(s, r) {
  r = Math.max(0, Math.min(1, r)); if (Math.abs(r - s.userData.ost) < 0.015) return; s.userData.ost = r;
  const c = s.userData.cv.getContext('2d'); c.clearRect(0, 0, 96, 16);
  zaokr(c, 1, 1, 94, 14, 6); c.fillStyle = 'rgba(25,38,60,0.8)'; c.fill();
  if (r > 0) { zaokr(c, 3, 3, Math.max(8, 90 * r), 10, 4); c.fillStyle = r > 0.5 ? '#4cd964' : r > 0.25 ? '#ffcc00' : '#ff4d3d'; c.fill(); }
  s.material.map.needsUpdate = true;
}
function dymek() { const cv = plotno(160, 120), s = nowySprite(cv, 1.25); s.userData.cv = cv; s.userData.ost = ''; return s; }
function rysujDymek(s, typ, liczba) {
  const k = typ + liczba; if (k === s.userData.ost) return; s.userData.ost = k;
  const c = s.userData.cv.getContext('2d'); c.clearRect(0, 0, 160, 120);
  zaokr(c, 6, 6, 148, 84, 26); c.fillStyle = '#fff'; c.fill();
  c.beginPath(); c.moveTo(66, 88); c.lineTo(80, 112); c.lineTo(94, 88); c.fill();
  if (typ === 'serce') {
    c.font = `60px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ff4d7a'; c.fillText('♥', 80, 50);
  } else {
    rysujIkone(c, typ, 52, 48, 62);
    c.font = `56px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#213047'; c.fillText(String(liczba), 112, 50);
  }
  s.material.map.needsUpdate = true;
}
const EMOJI = { domek: '🏠', armatka: '❄️', chatka: '👷', warsztat: '🔨', palisada: '🛡️', cel: '⭐', kopalnia: '⛏️', wagonik: '🚃', piec: '🔥', napraw: '🔨', kosz: '🎒', buty: '👟', rece: '🧤' };
function rysujPole(cv, ikona, gora, dol, jasne) {
  const c = cv.getContext('2d'); c.clearRect(0, 0, 256, 256);
  zaokr(c, 12, 12, 232, 232, 34); c.fillStyle = jasne ? 'rgba(63,191,95,0.55)' : 'rgba(26,40,64,0.5)'; c.fill();
  c.setLineDash([22, 14]); c.lineWidth = 9; c.strokeStyle = 'rgba(255,255,255,0.95)'; c.stroke(); c.setLineDash([]);
  if (ikona.startsWith('i:')) rysujIkone(c, ikona.slice(2), 128, 92, 96);
  else { c.font = '78px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ikona, 128, 96); }
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
  if (gora !== null && gora !== undefined && gora !== '') {
    c.font = `58px ${FONT}`;
    if (typeof gora === 'number') {
      const t = String(gora); const w = c.measureText(t).width; const x0 = 128 - (w + 52) / 2;
      rysujIkone(c, 'kasa', x0 + 22, 190, 50); c.textAlign = 'left'; c.fillText(t, x0 + 52, 192);
    } else c.fillText(gora, 128, 192);
  }
  if (dol) { c.font = `30px ${FONT}`; c.fillText(dol, 128, 228); }
}
function pole(szer = 2.4) {
  const cv = plotno(256, 256);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(szer, szer), new THREE.MeshBasicMaterial({ map: tekstura(cv), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.04; m.renderOrder = 2; m.userData.cv = cv;
  return m;
}
function znacznik(typ) { // okrągłe miejsce do odkładania przedmiotów
  const cv = plotno(128, 128), c = cv.getContext('2d');
  c.beginPath(); c.arc(64, 64, 56, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
  c.setLineDash([14, 10]); c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,0.95)'; c.stroke();
  c.globalAlpha = 0.85; rysujIkone(c, typ, 64, 64, 64);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: tekstura(cv), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.035; m.renderOrder = 1;
  return m;
}

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
  s.connect(fl).connect(g).connect(AC.destination); s.start(t); s.stop(t + czas + 0.02);
}
const ostDzwiek = {};
function dzwiek(n) {
  if (!zapis.dzwieki || !AC) return;
  const t = performance.now(); if (ostDzwiek[n] && t - ostDzwiek[n] < 55) return; ostDzwiek[n] = t;
  switch (n) {
    case 'zbierz': ton(620 + Math.random() * 260, 1100, 0.08, 'sine', 0.09); break;
    case 'odloz': ton(330, 250, 0.07, 'triangle', 0.1); break;
    case 'kasa': ton(1500, 1500, 0.05, 'square', 0.035); ton(2000, 2000, 0.06, 'square', 0.03, 0.05); break;
    case 'placi': ton(900 + Math.random() * 100, 1000, 0.04, 'square', 0.025); break;
    case 'buduj': [523, 659, 784, 1047].forEach((f, i) => ton(f, f, 0.18, 'triangle', 0.13, i * 0.08)); break;
    case 'mach': szum(0.12, 0.08, 900); ton(260, 120, 0.15, 'sine', 0.14); break;
    case 'sniezka': szum(0.1, 0.07, 2500); break;
    case 'ucieka': ton(500, 900, 0.12, 'triangle', 0.08); ton(700, 1200, 0.12, 'triangle', 0.06, 0.08); break;
    case 'fala': ton(220, 220, 0.5, 'sawtooth', 0.06); ton(330, 330, 0.5, 'sawtooth', 0.05, 0.05); ton(277, 277, 0.6, 'sawtooth', 0.05, 0.5); break;
    case 'pek': szum(0.35, 0.18, 300); ton(140, 60, 0.3, 'square', 0.06); break;
    case 'zjada': ton(200, 160, 0.06, 'square', 0.04); break;
    case 'koniec': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => ton(f, f, 0.25, 'triangle', 0.14, i * 0.12)); break;
    case 'klik': ton(800, 600, 0.05, 'triangle', 0.08); break;
  }
}
const UTWORY = ['chill', 'wesola', 'elektro', 'neon', 'turbo', 'skok'];
let muzyka = null, utwor = '';
function grajMuzyke(walka) {
  if (!zapis.muzyka || !S) { if (muzyka) muzyka.pause(); return; }
  const nazwa = `../muzyka/${UTWORY[(S.k.id - 1) % UTWORY.length]}-${walka ? 'walka' : 'bieg'}.mp3`;
  if (utwor !== nazwa) {
    if (muzyka) muzyka.pause();
    muzyka = new Audio(nazwa); muzyka.loop = true; muzyka.volume = 0.28; utwor = nazwa;
  }
  muzyka.play().catch(() => {});
}

// ================= stan gry =================
let S = null;            // bieżąca kraina
let G = null;            // obiekty 3D bieżącej krainy
let pauza = true;
let czasGry = 0;

function nowyStan(k) {
  return {
    k, czas: 0, kasa: 20 * stale('kasa'), warsztat: { kosz: 0, buty: 0, rece: 0 },
    zbudowane: [], wplacone: {}, fala: 0, doFali: null, nieskonczona: false, ukonczona: false,
    zapasy: {}, kasy: {}, kopalnia: 0, ogrzewanie: 0, palisada: [], plecak: [], gracz: [...k.start],
  };
}
const pojemnosc = () => 8 + 2 * stale('kosz') + 4 * S.warsztat.kosz;
const szybkosc = () => 5.0 * (1 + 0.05 * stale('buty') + 0.1 * S.warsztat.buty);
const tempoZbierania = () => 0.4 / (1 + 0.08 * stale('rece') + 0.15 * S.warsztat.rece);
const silaMachu = () => 1 + 0.2 * stale('mach');
const tempoPomocy = () => 1 + 0.1 * stale('pomoc');
const zbudowane = id => S.zbudowane.includes(id);

// ================= budowa świata =================
function malujZiemie(k) {
  const N = 1024, W = 100, sk = N / W, P = x => (x + W / 2) * sk;
  const cv = plotno(N, N), c = cv.getContext('2d');
  c.fillStyle = k.paleta.snieg; c.fillRect(0, 0, N, N);
  const r = rng(k.id * 77 + 5);
  for (let i = 0; i < 70; i++) {
    const x = r() * N, y = r() * N, rad = 30 + r() * 80;
    const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(170,198,232,0.22)'); g.addColorStop(1, 'rgba(170,198,232,0)');
    c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 4000; i++) { c.fillStyle = r() < 0.5 ? 'rgba(160,188,222,0.22)' : 'rgba(255,255,255,0.8)'; const s = 1 + r() * 2.5; c.fillRect(r() * N, r() * N, s, s); }
  if (k.jezioro) {
    const { x, z, r: R } = k.jezioro;
    const g = c.createRadialGradient(P(x), P(z), 0, P(x), P(z), R * sk);
    g.addColorStop(0, '#bfe3f7'); g.addColorStop(0.85, '#a6d3ee'); g.addColorStop(1, '#e9f6fd');
    c.fillStyle = g; c.beginPath(); c.ellipse(P(x), P(z), R * sk, R * sk * 0.9, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      c.beginPath(); let px = P(x) + (r() - 0.5) * R * sk, py = P(z) + (r() - 0.5) * R * sk; c.moveTo(px, py);
      for (let j = 0; j < 4; j++) { px += (r() - 0.5) * 40; py += (r() - 0.5) * 40; c.lineTo(px, py); } c.stroke();
    }
  }
  // wydeptane ścieżki dla klientów
  c.fillStyle = 'rgba(200,214,232,0.35)';
  for (const b of k.budowle) if (b.rodzaj === 'lada') { zaokr(c, P(b.x - 1.2), P(7.2), 2.4 * sk, 22 * sk, 12); c.fill(); }
  // plac obozu
  const { x0, x1, z0, z1 } = OBOZ;
  zaokr(c, P(x0 - 0.8), P(z0 - 0.8), (x1 - x0 + 1.6) * sk, (z1 - z0 + 1.4) * sk, 40);
  c.fillStyle = k.paleta.plac; c.fill();
  c.lineWidth = 10; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
  for (let i = 0; i < 900; i++) {
    const x = P(x0) + r() * (x1 - x0) * sk, y = P(z0) + r() * (z1 - z0) * sk;
    c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)'; c.fillRect(x, y, 2 + r() * 4, 2 + r() * 3);
  }
  const t = tekstura(cv); t.anisotropy = 8;
  return t;
}

function sosnyInstancje(k, punkty) {
  const proto = kopia('sosna' + k.paleta.igly, () => MOD.sosna(k.paleta.igly));
  let mesh = null; proto.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
  const im = new THREE.InstancedMesh(mesh.geometry, MAT_V, punkty.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  punkty.forEach((p, i) => {
    e.set(0, p.rot, 0); q.setFromEuler(e);
    m.compose(V(p.x, 0, p.z), q, V(p.s, p.s, p.s)); im.setMatrixAt(i, m);
  });
  im.castShadow = true; im.receiveShadow = false;
  return im;
}

function zbudujSwiat() {
  scene.remove(swiat); swiat = new THREE.Group(); scene.add(swiat);
  const k = S.k;
  scene.background = new THREE.Color(k.paleta.mgla);
  scene.fog = new THREE.Fog(k.paleta.mgla, 40, 95);
  G = {
    kolizje: [], wezly: [], budowle: {}, pola: {}, pady: [], klienci: [], zwierzeta: [], pomocnicy: [],
    loty: [], pociski: [], czastki: [], segmenty: [], doWypuszczenia: [], gracz: null, liczKlient: 0,
  };
  // ziemia
  const ziemia = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshLambertMaterial({ map: malujZiemie(k) }));
  ziemia.rotation.x = -Math.PI / 2; ziemia.receiveShadow = true; swiat.add(ziemia);
  const dalej = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: k.paleta.snieg }));
  dalej.rotation.x = -Math.PI / 2; dalej.position.y = -0.03; dalej.receiveShadow = true; swiat.add(dalej);

  const r = rng(k.id * 1000 + 17);
  const wObozie = (x, z, m) => x > OBOZ.x0 - m && x < OBOZ.x1 + m && z > OBOZ.z0 - m && z < OBOZ.z1 + m;
  const strefaKlientow = (x, z, m = 0) => Math.abs(x) < 26 + m && z > 4 && z < 34;
  const wRegionie = (x, z, m) => k.regiony.some(g => ((x - g.x) / (g.rx + m)) ** 2 + ((z - g.z) / (g.rz + m)) ** 2 < 1);
  const wJeziorze = (x, z, m) => k.jezioro && Math.hypot(x - k.jezioro.x, z - k.jezioro.z) < k.jezioro.r + m;
  const zajete = [];
  const wolne = (x, z, d) => zajete.every(p => Math.hypot(p[0] - x, p[1] - z) > d);

  // miejsca do zbierania
  for (const reg of k.regiony) {
    let zrobione = 0, proby = 0;
    while (zrobione < reg.ile && proby++ < 3000) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = reg.x + Math.cos(a) * d * reg.rx, z = reg.z + Math.sin(a) * d * reg.rz;
      if (Math.abs(x) > ZAKRES - 2 || Math.abs(z) > ZAKRES - 2 || wObozie(x, z, 3) || strefaKlientow(x, z) || !wolne(x, z, 2.3)) continue;
      if (reg.wezel === 'przerebel' && !wJeziorze(x, z, -1.2)) continue;
      if (reg.wezel !== 'przerebel' && wJeziorze(x, z, 1.5)) continue;
      zajete.push([x, z]); zrobione++;
      dodajWezel(reg.wezel, x, z, r() * Math.PI * 2);
    }
  }
  // las dookoła i drzewa w środku
  const sosny = [];
  for (let i = 0; i < 520 && sosny.length < 300; i++) {
    const x = (r() * 2 - 1) * 62, z = (r() * 2 - 1) * 62;
    if (Math.max(Math.abs(x), Math.abs(z)) < ZAKRES + 1) continue;
    if (z > 30 && Math.abs(x) < 40 && z < ZAKRES + 6) continue;
    sosny.push({ x, z, s: 0.9 + r() * 0.7, rot: r() * 6 });
  }
  for (let i = 0; i < 400 && sosny.length < 345; i++) {
    const x = (r() * 2 - 1) * (ZAKRES - 3), z = (r() * 2 - 1) * (ZAKRES - 3);
    if (wObozie(x, z, 6) || strefaKlientow(x, z, 4) || wRegionie(x, z, 3) || wJeziorze(x, z, 3) || !wolne(x, z, 3.5)) continue;
    if (Math.abs(x) < 4 && z < -10) continue;
    zajete.push([x, z]); sosny.push({ x, z, s: 0.8 + r() * 0.6, rot: r() * 6 });
    G.kolizje.push({ x, z, r: 0.8 });
  }
  swiat.add(sosnyInstancje(k, sosny));
  for (let i = 0; i < 40; i++) {
    const x = (r() * 2 - 1) * (ZAKRES - 2), z = (r() * 2 - 1) * (ZAKRES - 2);
    if (wObozie(x, z, 2) || strefaKlientow(x, z) || wJeziorze(x, z, 1)) continue;
    const m = i % 3 ? MOD.zaspa(0.6 + r() * 1.2) : MOD.kamyk(0.7 + r());
    m.position.set(x, 0, z); m.rotation.y = r() * 6; swiat.add(m);
  }
  zbudujPalisade();
  zbudujGracza();
  // budowle już postawione (z zapisu albo gotowe na start)
  for (const b of k.budowle) if (b.gotowe && !zbudowane(b.id)) S.zbudowane.push(b.id);
  for (const id of S.zbudowane) postaw(k.budowle.find(b => b.id === id), false);
  odswiezPola();
  // śnieg w powietrzu
  const n = 600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = losowo(-25, 25); pos[i * 3 + 1] = losowo(0, 22); pos[i * 3 + 2] = losowo(-25, 25); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  G.snieg = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.16, transparent: true, opacity: 0.85, depthWrite: false }));
  swiat.add(G.snieg);
  // strzałka-przewodnik
  G.strzalka = new THREE.Group();
  const sm = new THREE.MeshBasicMaterial({ color: '#3fdc6a' });
  const grot = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 4), sm); grot.rotation.x = Math.PI; grot.position.y = 0.45;
  const trzon = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.8, 0.34), sm); trzon.position.y = 1.25;
  G.strzalka.add(grot, trzon); G.strzalka.visible = false; swiat.add(G.strzalka);
  const ksz = new THREE.Shape(); ksz.moveTo(0, 0.55); ksz.lineTo(0.42, -0.25); ksz.lineTo(0, -0.05); ksz.lineTo(-0.42, -0.25); ksz.closePath();
  G.kierunek = new THREE.Mesh(new THREE.ShapeGeometry(ksz), new THREE.MeshBasicMaterial({ color: '#3fdc6a', transparent: true, opacity: 0.85, depthWrite: false }));
  G.kierunek.rotation.x = -Math.PI / 2; G.kierunek.position.y = 0.06; G.kierunek.visible = false; swiat.add(G.kierunek);
}

function dodajWezel(typ, x, z, rot) {
  const def = WEZLY[typ];
  const obj = kopia('w' + typ, () => typ === 'krzak' ? MOD.krzak() : typ === 'przerebel' ? MOD.przerebel() : typ === 'lod' ? MOD.lod() : MOD.skala(typ));
  obj.position.set(x, 0, z); obj.rotation.y = rot; swiat.add(obj);
  const w = { typ, def, x, z, obj, zostalo: def.ile, odrost: 0, cz: czesci(obj, 'cz'), splawik: obj.getObjectByName('splawik'), drga: 0 };
  G.wezly.push(w);
  if (def.kolizja) G.kolizje.push({ x, z, r: def.kolizja });
  pokazWezel(w);
}
function pokazWezel(w) {
  const n = w.cz.length, widac = Math.round(n * w.zostalo / w.def.ile);
  w.cz.forEach((c, i) => { c.visible = i < widac; });
  if (w.splawik) w.splawik.visible = w.zostalo > 0;
}

// ---------- palisada ----------
function zbudujPalisade() {
  const { x0, x1, z0 } = OBOZ, zk = 4.5;
  const podziel = (ax, az, bx, bz, n, nx, nz) => {
    for (let i = 0; i < n; i++) {
      const sx = ax + (bx - ax) * i / n, sz = az + (bz - az) * i / n, ex = ax + (bx - ax) * (i + 1) / n, ez = az + (bz - az) * (i + 1) / n;
      const seg = { ax: sx, az: sz, bx: ex, bz: ez, x: (sx + ex) / 2, z: (sz + ez) / 2, nx, nz, dl: Math.hypot(ex - sx, ez - sz) };
      G.segmenty.push(seg);
    }
  };
  podziel(x0, z0, x1, z0, 12, 0, -1);
  podziel(x1, z0, x1, zk, 7, 1, 0);
  podziel(x0, z0, x0, zk, 7, -1, 0);
  const max = maxPalisady();
  G.segmenty.forEach((s, i) => {
    s.max = max; s.hp = S.palisada[i] !== undefined ? S.palisada[i] : max; s.atak = 0;
    s.zew = new THREE.Group(); s.zew.position.set(s.x, 0, s.z); s.zew.rotation.y = Math.atan2(-s.nx, -s.nz); swiat.add(s.zew);
    s.pasek = pasekZycia(); s.pasek.position.set(s.x, 2.6, s.z); s.pasek.visible = false; swiat.add(s.pasek);
    wyglądSegmentu(s);
  });
}
function maxPalisady() { return (25 + 12 * (S.k.id - 1)) * (zbudowane('palisada') ? 2.5 : 1); }
function wyglądSegmentu(s) {
  if (s.wew) s.zew.remove(s.wew);
  const mocna = zbudowane('palisada');
  s.wew = kopia('pal' + s.dl.toFixed(2) + mocna, () => MOD.slupki(s.dl, mocna));
  s.zew.add(s.wew);
  s.zlamany = s.hp <= 0;
  s.wew.rotation.x = s.zlamany ? -1.4 : 0;
  s.wew.position.y = s.zlamany ? 0.2 : 0;
  if (s.zlamany && !s.pad) {
    const koszt = 6 + 4 * S.k.id;
    s.pad = { typ: 'napraw', x: s.x - s.nx * 1.8, z: s.z - s.nz * 1.8, r: 1.1, koszt, wplacone: 0, seg: s };
    s.pad.mesh = pole(2.0); s.pad.mesh.position.set(s.pad.x, 0.05, s.pad.z); swiat.add(s.pad.mesh);
    rysujPole(s.pad.mesh.userData.cv, EMOJI.napraw, koszt, 'napraw'); s.pad.mesh.material.map.needsUpdate = true;
    G.pady.push(s.pad);
  } else if (!s.zlamany && s.pad) {
    swiat.remove(s.pad.mesh); G.pady.splice(G.pady.indexOf(s.pad), 1); s.pad = null;
  }
}

// ---------- gracz ----------
function zbudujGracza() {
  const obj = kopia('gracz', () => MOD.gracz());
  obj.position.set(S.gracz[0], 0, S.gracz[1]); swiat.add(obj);
  const stos = new THREE.Group(); stos.position.set(0, 0.95, -0.42); obj.add(stos);
  const pelny = napis('PEŁNY', 2.2, '#ffde59'); pelny.position.set(0, 0, 0); pelny.visible = false; swiat.add(pelny);
  G.gracz = { obj, x: S.gracz[0], z: S.gracz[1], kat: 0, ruch: 0, faza: 0, nogi: czesci(obj, 'noga'), rece: czesci(obj, 'reka'),
    stos, pelny, plecak: [], zbierzT: 0, machT: 0, mach: 0, padT: 0 };
  for (const typ of S.plecak) {
    const e = { typ, h: wys(typ), mesh: przedmiot(typ), dotarl: true, cy: 0 };
    stos.add(e.mesh); G.gracz.plecak.push(e);
  }
}
function wPlecaku(typ) { return G.gracz.plecak.filter(e => !typ || e.typ === typ).length; }
function doPlecaka(typ, skad) {
  const gr = G.gracz;
  if (gr.plecak.length >= pojemnosc()) return false;
  const e = { typ, h: wys(typ), mesh: przedmiot(typ), dotarl: false, cy: 0 };
  gr.plecak.push(e); przelicz();
  swiat.add(e.mesh);
  lot(e.mesh, skad, () => gr.stos.localToWorld(V(0, e.cy, 0)), 0.3, 1.4, () => {
    gr.stos.add(e.mesh); e.mesh.position.set(0, e.cy, 0); e.mesh.rotation.set(0, 0, 0); e.dotarl = true;
  });
  zmienionyPlecak();
  return true;
}
function zPlecaka(typ) {
  const pl = G.gracz.plecak;
  for (let i = pl.length - 1; i >= 0; i--) {
    if (pl[i].typ === typ && pl[i].dotarl) {
      const e = pl.splice(i, 1)[0]; swiat.attach(e.mesh); przelicz(); zmienionyPlecak();
      return e.mesh;
    }
  }
  return null;
}
function przelicz() { let y = 0; for (const e of G.gracz.plecak) { e.cy = y; y += e.h; } }

// ---------- latające przedmioty ----------
function lot(mesh, skad, dokad, czas, luk, poKoniec, opozn = 0) {
  const a = skad.clone(); mesh.position.copy(a); mesh.visible = opozn <= 0;
  G.loty.push({ mesh, a, dokad, t: -opozn, czas, luk, poKoniec });
}
function aktualizujLoty(dt) {
  for (let i = G.loty.length - 1; i >= 0; i--) {
    const l = G.loty[i]; l.t += dt;
    if (l.t < 0) continue;
    l.mesh.visible = true;
    const u = Math.min(1, l.t / l.czas), b = typeof l.dokad === 'function' ? l.dokad() : l.dokad;
    l.mesh.position.lerpVectors(l.a, b, u); l.mesh.position.y += Math.sin(u * Math.PI) * l.luk;
    l.mesh.rotation.y += dt * 8;
    if (u >= 1) { G.loty.splice(i, 1); if (l.poKoniec) l.poKoniec(); else swiat.remove(l.mesh); }
  }
}

// ---------- cząsteczki ----------
const TEKS = {};
function teksCzastki(n) {
  if (TEKS[n]) return TEKS[n];
  const cv = plotno(64, 64), c = cv.getContext('2d');
  if (n === 'puch' || n === 'dym') {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 30);
    g.addColorStop(0, n === 'dym' ? 'rgba(235,238,245,0.95)' : 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  } else if (n === 'gwiazda') rysujIkone(c, 'gwiazdka', 32, 32, 60);
  else if (n === 'serce') { c.font = '52px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ff4d7a'; c.fillText('♥', 32, 36); }
  return (TEKS[n] = tekstura(cv));
}
function czastka(n, poz, v, zycie = 0.7, rozmiar = 0.6, rosnie = 1) {
  if (G.czastki.length > 220) return;
  const m = new THREE.SpriteMaterial({ map: teksCzastki(n), transparent: true, depthWrite: false });
  const s = new THREE.Sprite(m); s.position.copy(poz); s.scale.setScalar(rozmiar); swiat.add(s);
  G.czastki.push({ s, v, zycie, max: zycie, rozmiar, rosnie });
}
function wybuch(n, poz, ile = 8, sila = 3, zycie = 0.6, rozmiar = 0.5) {
  for (let i = 0; i < ile; i++) {
    const a = Math.random() * Math.PI * 2;
    czastka(n, poz.clone(), V(Math.cos(a) * sila * losowo(0.4, 1), losowo(1, 3), Math.sin(a) * sila * losowo(0.4, 1)), zycie * losowo(0.7, 1.2), rozmiar, 1.6);
  }
}
const KONF = ['#ff5a4f', '#ffcf3a', '#3fbf5f', '#3d7bd9', '#b57cff', '#ff8a3d'].map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
const KONF_G = new THREE.PlaneGeometry(0.18, 0.28);
function konfetti(poz, ile = 30) {
  for (let i = 0; i < ile; i++) {
    const m = new THREE.Mesh(KONF_G, KONF[i % KONF.length]); m.position.copy(poz); swiat.add(m);
    G.czastki.push({ m, v: V(losowo(-4, 4), losowo(5, 10), losowo(-4, 4)), zycie: 1.6, max: 1.6, obr: V(losowo(-9, 9), losowo(-9, 9), 0) });
  }
}
function aktualizujCzastki(dt) {
  for (let i = G.czastki.length - 1; i >= 0; i--) {
    const c = G.czastki[i]; c.zycie -= dt;
    const o = c.s || c.m;
    o.position.addScaledVector(c.v, dt);
    if (c.s) {
      c.v.y -= dt * 1.5; c.v.multiplyScalar(1 - dt * 1.5);
      const u = 1 - c.zycie / c.max; c.s.material.opacity = Math.max(0, 1 - u * u); c.s.scale.setScalar(c.rozmiar * (1 + u * (c.rosnie - 1)));
    } else { c.v.y -= dt * 12; c.m.rotation.x += c.obr.x * dt; c.m.rotation.y += c.obr.y * dt; }
    if (c.zycie <= 0 || o.position.y < -0.5) { swiat.remove(o); if (c.s) c.s.material.dispose(); G.czastki.splice(i, 1); }
  }
}

// ================= budowle =================
function odswiezPola() {
  for (const b of S.k.budowle) {
    if (zbudowane(b.id) || G.pola[b.id]) continue;
    if (!b.po.every(zbudowane)) continue;
    const pad = { typ: 'buduj', x: b.x, z: b.z + (b.rodzaj === 'lada' ? -1.8 : 0), r: 1.25, cfg: b, koszt: b.koszt, wplacone: S.wplacone[b.id] || 0 };
    if (b.rodzaj === 'wagonik') { pad.x = b.x; pad.z = b.z; }
    pad.mesh = pole(2.5); pad.mesh.position.set(pad.x, 0.05, pad.z); swiat.add(pad.mesh);
    pad.napis = napis(b.nazwa, 3.6); pad.napis.position.set(pad.x, 1.0, pad.z - 1.5); swiat.add(pad.napis);
    pad.ikona = b.rodzaj === 'lada' ? 'i:' + b.item : b.rodzaj === 'przetwornia' ? 'i:' + b.wyj : EMOJI[b.rodzaj] || '⭐';
    pad.ost = -1; pad.pojaw = 0;
    G.pola[b.id] = pad; G.pady.push(pad);
    rysujPad(pad);
  }
}
function rysujPad(p) {
  const zostalo = Math.ceil(p.koszt - p.wplacone);
  if (zostalo === p.ost) return; p.ost = zostalo;
  const jasne = S && S.kasa >= zostalo;
  rysujPole(p.mesh.userData.cv, p.ikona, zostalo, p.dol || '', jasne);
  p.mesh.material.map.needsUpdate = true;
}

function postaw(cfg, nowa) {
  const k = S.k;
  const B = { cfg, id: cfg.id, x: cfg.x, z: cfg.z };
  G.budowle[cfg.id] = B;
  const dodajObj = (obj, rotY = 0) => { obj.position.set(cfg.x, 0, cfg.z); obj.rotation.y = rotY; swiat.add(obj); B.obj = obj; return obj; };
  const kol = (x, z, r) => G.kolizje.push({ x, z, r, b: cfg.id });
  switch (cfg.rodzaj) {
    case 'lada': {
      const kolory = { jagody: '#3a4bb0', dzem: '#8a2f9e', wedzona: '#c96a1f', zloto: '#d99a00', krysztal: '#2aa6c9' };
      dodajObj(kopia('lada' + cfg.item, () => MOD.lada(kolory[cfg.item] || '#e0413a')));
      const tab = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: tekstura((() => { const cv = plotno(128, 128), c = cv.getContext('2d'); c.beginPath(); c.arc(64, 64, 60, 0, 7); c.fillStyle = '#fff'; c.fill(); rysujIkone(c, cfg.item, 64, 64, 96); return cv; })()), transparent: true }));
      tab.position.set(0, 2.85, -0.5); B.obj.add(tab);
      B.zapas = S.zapasy[cfg.id] || 0; B.dolot = 0; B.maks = 30; B.meshe = []; B.kolejka = []; B.spawnT = 2; B.sprzedT = 0; B.item = cfg.item;
      B.pad = { typ: 'zrzut', x: cfg.x, z: 5.3, r: 1.05, B, przyjmuje: cfg.item };
      B.znak = znacznik(cfg.item); B.znak.position.set(B.pad.x, 0.035, B.pad.z); swiat.add(B.znak);
      G.pady.push(B.pad);
      B.kasa = { typ: 'kasa', x: cfg.x + 2.05, z: 5.2, r: 0.95, wartosc: 0, meshe: [] };
      G.pady.push(B.kasa);
      dodajKase(B.kasa, S.kasy[cfg.id] || 0);
      for (const dx of [-1, 0, 1]) kol(cfg.x + dx, cfg.z, 0.7);
      for (let i = 0; i < B.zapas; i++) dodajNaLade(B);
      break;
    }
    case 'przetwornia': {
      dodajObj(kopia(cfg.model, () => MOD[cfg.model]()));
      B.ogien = B.obj.getObjectByName('ogien'); B.pow = B.obj.getObjectByName('pow');
      B.wej = S.zapasy[cfg.id] || 0; B.dolot = 0; B.maks = 20; B.meshe = []; B.T = 0;
      B.pad = { typ: 'zrzut', x: cfg.x - 2.25, z: cfg.z - 0.2, r: 1.05, B, przyjmuje: cfg.wej };
      B.znak = znacznik(cfg.wej); B.znak.position.set(B.pad.x, 0.035, B.pad.z); swiat.add(B.znak);
      G.pady.push(B.pad);
      kol(cfg.x, cfg.z, 1.3);
      for (let i = 0; i < B.wej; i++) dodajDoStosu(B, cfg.wej);
      break;
    }
    case 'kopalnia': {
      dodajObj(kopia('kopalnia', () => MOD.kopalnia()), Math.PI / 2);
      B.wyj = S.kopalnia || 0; B.maks = 24; B.meshe = []; B.T = 0;
      B.pad = { typ: 'odbior', x: cfg.x + 2.4, z: cfg.z + 1.6, r: 1.1, B, daje: cfg.wyj };
      G.pady.push(B.pad);
      kol(cfg.x - 0.6, cfg.z, 2.0);
      for (let i = 0; i < B.wyj; i++) dodajDoStosu(B, cfg.wyj);
      break;
    }
    case 'piec': {
      dodajObj(kopia('piec', () => MOD.piec()));
      B.ogien = B.obj.getObjectByName('ogien');
      B.wej = S.zapasy[cfg.id] || 0; B.dolot = 0; B.maks = 20; B.meshe = []; B.T = 0;
      B.pad = { typ: 'zrzut', x: cfg.x, z: cfg.z + 2.1, r: 1.05, B, przyjmuje: cfg.wej };
      B.znak = znacznik(cfg.wej); B.znak.position.set(B.pad.x, 0.035, B.pad.z); swiat.add(B.znak);
      G.pady.push(B.pad);
      kol(cfg.x, cfg.z, 1.3);
      for (let i = 0; i < B.wej; i++) dodajDoStosu(B, cfg.wej);
      break;
    }
    case 'domek': {
      const kolory = ['#d65a3a', '#3d7bd9', '#2fa37a', '#8a56d6', '#e0a12b', '#c95a3a', '#3aa6c9', '#d9446a'];
      const n = parseInt(cfg.id.replace(/\D/g, ''), 10) || 1;
      dodajObj(kopia('domek' + n, () => MOD.domek(kolory[(n - 1) % kolory.length])), cfg.x < 0 ? 0.3 : -0.3);
      kol(cfg.x, cfg.z, 1.9);
      break;
    }
    case 'armatka': {
      dodajObj(kopia('armatka', () => MOD.armatka()));
      B.lufa = B.obj.getObjectByName('lufa'); B.T = losowo(0, 1);
      kol(cfg.x, cfg.z, 1.0);
      break;
    }
    case 'chatka': {
      dodajObj(kopia('chatka', () => MOD.chatka()), cfg.x < 0 ? 0.4 : -0.4);
      const tab = napis(PRZEDMIOTY[cfg.zbiera].nazwa, 2.6); tab.position.set(cfg.x, 3.0, cfg.z); swiat.add(tab);
      kol(cfg.x, cfg.z, 1.3);
      dodajPomocnika(B);
      break;
    }
    case 'warsztat': {
      dodajObj(kopia('warsztat', () => MOD.warsztat()));
      kol(cfg.x, cfg.z, 1.6);
      B.pady = WARSZTAT.map((u, i) => {
        const p = { typ: 'ulepsz', x: cfg.x - 2 + i * 2, z: cfg.z + 2.8, r: 0.9, u, wplacone: 0 };
        p.mesh = pole(1.8); p.mesh.position.set(p.x, 0.05, p.z); swiat.add(p.mesh);
        p.ikona = EMOJI[u.id]; p.ost = -1; ustawUlepszenie(p);
        G.pady.push(p); return p;
      });
      break;
    }
    case 'wagonik': {
      const tory = MOD.tory(cfg.tory); swiat.add(tory);
      B.obj = kopia('wagonik', () => MOD.wagonik()); swiat.add(B.obj);
      B.tory = cfg.tory.map(([x, z]) => V(x, 0, z));
      B.dl = []; let suma = 0; for (let i = 0; i < B.tory.length - 1; i++) { suma += B.tory[i].distanceTo(B.tory[i + 1]); B.dl.push(suma); }
      B.calosc = suma; B.s = 0; B.kier = 0; B.ladunek = []; B.T = 0; B.stan = 'laduje';
      B.obj.position.copy(B.tory[0]);
      break;
    }
    case 'palisada': {
      for (const s of G.segmenty) { s.max = maxPalisady(); s.hp = s.max; wyglądSegmentu(s); }
      break;
    }
    case 'cel': {
      dodajObj(kopia('cel' + k.id, () => MOD.cel(k.id)));
      B.ogien = B.obj.getObjectByName('ogien'); B.swiatlo = B.obj.getObjectByName('swiatlo'); B.pier = czesci(B.obj, 'pier');
      kol(cfg.x, cfg.z, 2.3);
      break;
    }
  }
  if (B.obj && B.obj.userData.dym) B.dym = B.obj.localToWorld(V(...B.obj.userData.dym));
  if (B.obj && nowa) { B.obj.scale.setScalar(0.01); B.rosnie = 0; }
  if (cfg.rodzaj === 'lada' || cfg.rodzaj === 'domek') przeliczKlientow();
}

function zbuduj(cfg) {
  const p = G.pola[cfg.id];
  if (p) { swiat.remove(p.mesh); swiat.remove(p.napis); G.pady.splice(G.pady.indexOf(p), 1); delete G.pola[cfg.id]; }
  S.zbudowane.push(cfg.id); delete S.wplacone[cfg.id];
  postaw(cfg, true);
  dzwiek('buduj');
  konfetti(V(cfg.x, 1.5, cfg.z), 40);
  if (cfg.rodzaj === 'palisada') baner('Mocna palisada!', 'Zwierzęta dłużej ją psują');
  if (cfg.id === S.k.fale.po && S.doFali === null) { S.doFali = S.k.fale.pierwsza; toast('Armatka gotowa! Niedługo przyjdą zwierzęta.'); }
  odswiezPola();
  if (cfg.rodzaj === 'cel') ukonczKraine();
  zapiszGre();
}

function ustawUlepszenie(p) {
  const poz = S.warsztat[p.u.id], cena = p.u.ceny[poz];
  p.koszt = cena === undefined ? Infinity : cena;
  p.dol = cena === undefined ? '' : `${p.u.nazwa} ${poz + 1}`;
  p.ost = -1;
  if (cena === undefined) {
    rysujPole(p.mesh.userData.cv, p.ikona, 'MAX', p.u.nazwa, false); p.mesh.material.map.needsUpdate = true;
  } else rysujPad(p);
}

// stosy przedmiotów: na ladzie (na blacie) i przy przetworni / kopalni (na ziemi)
function dodajNaLade(B) {
  const i = B.meshe.length; if (i >= 40) return;
  const m = przedmiot(B.item), h = wys(B.item), w = i % 10, war = Math.floor(i / 10);
  m.position.set(-1.1 + (w % 5) * 0.55, 1.03 + war * h, -0.22 + Math.floor(w / 5) * 0.42);
  B.obj.add(m); B.meshe.push(m);
}
function zdejmijZLady(B) {
  const m = B.meshe.pop(); if (!m) return null;
  B.obj.remove(m); return m;
}
function pozycjaStosu(B, i, typ) {
  const h = wys(typ), w = i % 6, war = Math.floor(i / 6);
  if (B.cfg.rodzaj === 'kopalnia') return V(B.cfg.x + 1.9 + (w % 3) * 0.48, war * h, B.cfg.z + 1.2 + Math.floor(w / 3) * 0.48);
  if (B.cfg.rodzaj === 'piec') return V(B.cfg.x + 1.35 + (w % 2) * 0.48, war * h, B.cfg.z + 1.2 - Math.floor(w / 2) * 0.42);
  return V(B.cfg.x - 1.55 + (w % 2) * 0.46, war * h, B.cfg.z - 1.5 - Math.floor(w / 2) * 0.42);
}
function dodajDoStosu(B, typ) {
  const i = B.meshe.length; if (i >= 30) { B.meshe.push(null); return; }
  const m = przedmiot(typ); m.position.copy(pozycjaStosu(B, i, typ)); swiat.add(m); B.meshe.push(m);
}
function zdejmijZeStosu(B) {
  const m = B.meshe.pop(); if (m) swiat.remove(m); return m;
}

// ---------- pieniądze na kupce ----------
function dodajKase(k, ile) {
  k.wartosc += ile;
  const cel = Math.min(48, Math.ceil(k.wartosc / Math.max(1, 2 * S.k.ceny)));
  while (k.meshe.length < cel) {
    const i = k.meshe.length, m = przedmiot('kasa');
    m.position.set(k.x - 0.3 + (i % 2) * 0.55, Math.floor(i / 4) * 0.08, k.z - 0.3 + (Math.floor(i / 2) % 2) * 0.32);
    m.rotation.y = (i % 3 - 1) * 0.08; swiat.add(m); k.meshe.push(m);
  }
}
function lupNaZiemi(x, z, ile) {
  const k = { typ: 'kasa', x, z, r: 1.0, wartosc: 0, meshe: [], lup: true };
  G.pady.push(k); dodajKase(k, ile);
  return k;
}

// ================= klienci =================
let klienciNaLady = {};
function przeliczKlientow() {
  klienciNaLady = {};
  for (const b of S.k.budowle) if (b.rodzaj === 'domek' && zbudowane(b.id)) for (const l of b.dla) klienciNaLady[l] = (klienciNaLady[l] || 0) + 1;
}
function cieplo() { return !S.k.cieplo || !zbudowane('piec') ? 'brak' : S.ogrzewanie > 0 ? 'ciepło' : 'zimno'; }
function aktualizujKlientow(dt) {
  const c = cieplo();
  for (const id in G.budowle) {
    const B = G.budowle[id]; if (B.cfg.rodzaj !== 'lada') continue;
    B.spawnT -= dt;
    const co = 7.5 / (1 + 0.65 * (klienciNaLady[id] || 0)) * (c === 'zimno' ? 1.8 : 1);
    if (B.spawnT <= 0 && B.kolejka.length < 6) { B.spawnT = co * losowo(0.8, 1.2); nowyKlient(B); }
    // obsługa pierwszego w kolejce
    const k0 = B.kolejka[0];
    if (k0 && k0.stan === 'czeka' && k0.ma < k0.chce) {
      B.sprzedT -= dt;
      if (B.zapas > 0 && B.sprzedT <= 0) {
        B.sprzedT = 0.2; B.zapas--; k0.ma++; k0.dolot++;
        const m = zdejmijZLady(B);
        if (m) {
          const p = B.obj.localToWorld(m.position.clone()); swiat.add(m);
          lot(m, p, () => V(k0.x, 1.2, k0.z), 0.28, 0.8, () => { swiat.remove(m); k0.dolot--; });
        }
        dzwiek('odloz');
      }
    }
    if (k0 && k0.stan === 'czeka' && k0.ma >= k0.chce && k0.dolot === 0) {
      const ceny = PRZEDMIOTY[B.item].cena * S.k.ceny * (c === 'ciepło' ? 1.25 : 1);
      const zaplata = Math.round(k0.chce * ceny);
      const kasa = B.kasa, n = Math.min(5, zaplata), czesc = zaplata / n;
      for (let i = 0; i < n; i++) {
        const m = przedmiot('kasa'); swiat.add(m);
        lot(m, V(k0.x, 1.3, k0.z), V(kasa.x, 0.3, kasa.z), 0.35, 1.2, () => { swiat.remove(m); dodajKase(kasa, czesc); dzwiek('kasa'); }, i * 0.07);
      }
      k0.stan = 'odchodzi'; rysujDymek(k0.dymek, 'serce', 0);
      k0.cel = V(B.x + (Math.random() < 0.5 ? -1 : 1) * losowo(10, 16), 0, 32);
      B.kolejka.shift();
      B.kolejka.forEach((k, i) => { k.miejsce = i; });
    }
  }
  for (let i = G.klienci.length - 1; i >= 0; i--) {
    const k = G.klienci[i];
    let cel = k.cel;
    if (k.stan !== 'odchodzi') cel = V(k.B.x, 0, 8.6 + k.miejsce * 1.15);
    const dx = cel.x - k.x, dz = cel.z - k.z, d = Math.hypot(dx, dz);
    const v = 2.8;
    if (d > 0.05) {
      const s = Math.min(d, v * dt); k.x += dx / d * s; k.z += dz / d * s;
      k.kat = Math.atan2(dx, dz); k.faza += dt * 9;
    } else if (k.stan === 'idzie' && k.miejsce === 0) { k.stan = 'czeka'; }
    if (k.stan !== 'odchodzi' && d <= 0.05) { k.kat = Math.PI; }
    const ruch = d > 0.05 ? 1 : 0;
    k.obj.position.set(k.x, 0, k.z); k.obj.rotation.y = k.kat;
    k.nogi.forEach((n, j) => { n.rotation.x = ruch * Math.sin(k.faza + j * Math.PI) * 0.6; });
    k.rece.forEach((n, j) => { n.rotation.x = ruch * -Math.sin(k.faza + j * Math.PI) * 0.5; });
    k.dymek.position.set(k.x, 2.05, k.z);
    if (k.stan !== 'odchodzi') rysujDymek(k.dymek, k.B.item, k.chce - k.ma);
    k.dymek.visible = k.stan === 'odchodzi' ? d > 8 : k.miejsce < 3;
    if (k.stan === 'odchodzi' && d < 0.3) { swiat.remove(k.obj); swiat.remove(k.dymek); G.klienci.splice(i, 1); }
  }
}
function nowyKlient(B) {
  const obj = kopia('klient' + (G.liczKlient % 8), () => MOD.klient(G.liczKlient % 8));
  G.liczKlient++;
  const [a, b] = S.k.chca;
  const k = { B, obj, x: B.x + losowo(-6, 6), z: 33, kat: Math.PI, faza: 0, stan: 'idzie', chce: Math.floor(losowo(a, b + 1)), ma: 0, dolot: 0,
    miejsce: B.kolejka.length, nogi: czesci(obj, 'noga'), rece: czesci(obj, 'reka'), dymek: dymek() };
  B.kolejka.push(k); G.klienci.push(k);
  swiat.add(obj, k.dymek);
}

// ================= zwierzęta i fale =================
const KIERUNKI = { N: 'z północy', NE: 'z północnego wschodu', NW: 'z północnego zachodu', E: 'ze wschodu', W: 'z zachodu' };
function nowaFala() {
  S.fala++;
  const k = S.k;
  let sklad = k.fale.sklad(S.fala);
  if (S.nieskonczona) sklad = sklad.concat(k.fale.sklad(S.fala).filter((_, i) => i % 2 === 0));
  const wej = [...k.wejscia].sort(() => Math.random() - 0.5).slice(0, S.fala < 3 ? 1 : 2);
  sklad.forEach((typ, i) => G.doWypuszczenia.push({ typ, wej: wej[i % wej.length], T: i * 0.65 }));
  const nazwy = [...new Set(sklad)].map(t => ZWIERZETA[t].nazwa);
  baner(`Fala ${S.fala}: ${nazwy.join(' i ')}!`, 'Idą ' + wej.map(w => KIERUNKI[w]).join(' i '), true);
  dzwiek('fala');
  grajMuzyke(true);
  S.doFali = Math.max(30, k.fale.co * Math.max(0.7, 1 - S.fala * 0.015) * (S.nieskonczona ? 0.8 : 1));
}
function noweZwierze(typ, wej) {
  const def = ZWIERZETA[typ];
  const [sx, sz] = WEJSCIA[wej];
  const x = sx + losowo(-4, 4), z = sz + losowo(-3, 3);
  // najbliższe odcinki palisady
  const posort = [...G.segmenty].sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z));
  const seg = posort[Math.floor(Math.random() * Math.min(4, posort.length))];
  const obj = kopia('z' + typ, () => MOD.zwierze(typ));
  const skala = typ === 'yeti' ? 1.3 : 1;
  obj.scale.setScalar(skala);
  obj.position.set(x, 0, z); swiat.add(obj);
  const mnoznik = S.nieskonczona ? 1 + S.fala * 0.03 : 1;
  const zw = { typ, def, obj, x, z, sx: x, sz: z, zycie: def.zycie * mnoznik, max: def.zycie * mnoznik, stan: 'idzie', seg, kat: 0, faza: Math.random() * 6,
    zjadl: 0, T: 0, nogi: czesci(obj, 'noga'), ogon: obj.getObjectByName('ogon'), pasek: pasekZycia(), wys: (obj.userData.wys || 1.5) * skala, odrzut: V(), migaj: 0 };
  zw.pasek.visible = false; swiat.add(zw.pasek);
  G.zwierzeta.push(zw);
}
function celJedzenia(zw) {
  let naj = null, nd = Infinity;
  for (const id in G.budowle) {
    const B = G.budowle[id];
    const ma = B.cfg.rodzaj === 'lada' ? B.zapas : (B.cfg.rodzaj === 'przetwornia' || B.cfg.rodzaj === 'piec') ? B.wej : B.cfg.rodzaj === 'kopalnia' ? B.wyj : 0;
    if (ma <= 0) continue;
    const p = B.pad.typ === 'odbior' ? B.pad : B.cfg.rodzaj === 'lada' ? { x: B.x, z: B.z - 1.4 } : B.pad;
    const d = Math.hypot(p.x - zw.x, p.z - zw.z);
    if (d < nd) { nd = d; naj = { B, x: p.x, z: p.z }; }
  }
  return naj;
}
function zjedz(B) {
  if (B.cfg.rodzaj === 'lada' && B.zapas > 0) { B.zapas--; zdejmijZLady(B); return true; }
  if ((B.cfg.rodzaj === 'przetwornia' || B.cfg.rodzaj === 'piec') && B.wej > 0) { B.wej--; zdejmijZeStosu(B); return true; }
  if (B.cfg.rodzaj === 'kopalnia' && B.wyj > 0) { B.wyj--; zdejmijZeStosu(B); return true; }
  return false;
}
function idz(zw, x, z, v, dt) {
  const dx = x - zw.x, dz = z - zw.z, d = Math.hypot(dx, dz);
  if (d < 0.1) return true;
  const s = Math.min(d, v * dt); zw.x += dx / d * s; zw.z += dz / d * s; zw.kat = Math.atan2(dx, dz); zw.faza += dt * v * 3;
  return false;
}
function przegon(zw) {
  if (zw.stan === 'ucieka') return;
  zw.stan = 'ucieka'; zw.pasek.visible = false;
  const p = V(zw.x, 1.2, zw.z);
  wybuch('gwiazda', p, 10, 3.5, 0.7, 0.55);
  wybuch('puch', p, 6, 2, 0.6, 0.9);
  dzwiek('ucieka');
  lupNaZiemi(zw.x, zw.z, Math.round(zw.def.nagroda * S.k.ceny));
}
function aktualizujZwierzeta(dt) {
  for (let i = G.zwierzeta.length - 1; i >= 0; i--) {
    const zw = G.zwierzeta[i], def = zw.def;
    zw.x += zw.odrzut.x * dt; zw.z += zw.odrzut.z * dt; zw.odrzut.multiplyScalar(Math.max(0, 1 - dt * 6));
    let ruch = false;
    const s = zw.seg;
    if (zw.stan === 'idzie') {
      const tx = s.x + s.nx * 1.1, tz = s.z + s.nz * 1.1;
      ruch = !idz(zw, tx, tz, def.v, dt);
      if (!ruch) zw.stan = s.zlamany ? 'wchodzi' : 'atakuje';
    } else if (zw.stan === 'atakuje') {
      zw.kat = Math.atan2(-s.nx, -s.nz);
      if (s.zlamany) zw.stan = 'wchodzi';
      else {
        s.hp -= def.sila * dt; s.atak = 0.5; zw.T += dt;
        if (zw.T > 0.5) { zw.T = 0; czastka('puch', V(s.x + s.nx * 0.5, 1, s.z + s.nz * 0.5), V(losowo(-1, 1), 1.5, losowo(-1, 1)), 0.4, 0.5, 1.5); }
        if (s.hp <= 0) { s.hp = 0; wyglądSegmentu(s); dzwiek('pek'); wybuch('puch', V(s.x, 0.8, s.z), 10, 3, 0.8, 1.1); toast('Zwierzęta zrobiły dziurę w palisadzie!'); }
      }
    } else if (zw.stan === 'wchodzi') {
      if (!zw.cel || !G.budowle[zw.cel.B.id]) zw.cel = celJedzenia(zw);
      if (!zw.cel) { zw.stan = 'wraca'; }
      else {
        ruch = !idz(zw, zw.cel.x, zw.cel.z, def.v, dt);
        if (!ruch) { zw.stan = 'je'; zw.T = 0; }
      }
    } else if (zw.stan === 'je') {
      zw.T += dt;
      if (zw.T > 0.9) {
        zw.T = 0;
        if (zjedz(zw.cel.B)) { zw.zjadl++; dzwiek('zjada'); czastka('puch', V(zw.x, 0.8, zw.z), V(0, 2, 0), 0.4, 0.6, 1.4); }
        else { zw.cel = celJedzenia(zw); zw.stan = zw.cel ? 'wchodzi' : 'wraca'; }
        if (zw.zjadl >= def.je) zw.stan = 'wraca';
      }
    } else if (zw.stan === 'wraca') {
      if (wObozie(zw.x, zw.z)) ruch = !idz(zw, s.x + s.nx * 1.5, s.z + s.nz * 1.5, def.v, dt);
      else { ruch = !idz(zw, zw.sx, zw.sz, def.v, dt); if (!ruch) { usunZwierze(i); continue; } }
      if (!ruch && wObozie(zw.x, zw.z)) zw.x += s.nx * 0.2;
    } else if (zw.stan === 'ucieka') {
      ruch = !idz(zw, zw.sx, zw.sz, def.v * 1.7, dt);
      if (!ruch || Math.hypot(zw.x - zw.sx, zw.z - zw.sz) < 1) { usunZwierze(i); continue; }
    }
    // wygląd
    zw.obj.position.set(zw.x, zw.stan === 'ucieka' ? Math.abs(Math.sin(zw.faza)) * 0.25 : 0, zw.z);
    zw.obj.rotation.y = zw.kat;
    const atak = zw.stan === 'atakuje' || zw.stan === 'je';
    const fz = ruch ? zw.faza : atak ? czasGry * 12 : 0;
    zw.nogi.forEach((n, j) => { n.rotation.x = (ruch ? 0.7 : atak ? 0.25 : 0) * Math.sin(fz + (j % 2 ? Math.PI : 0) + (j > 1 ? Math.PI : 0)); });
    if (zw.ogon) zw.ogon.rotation.y = Math.sin(czasGry * 6 + zw.faza) * 0.5;
    if (zw.migaj > 0) { zw.migaj -= dt; zw.obj.visible = Math.floor(zw.migaj * 20) % 2 === 0; } else zw.obj.visible = true;
    if (zw.stan !== 'ucieka' && zw.zycie < zw.max) { zw.pasek.visible = true; rysujPasek(zw.pasek, zw.zycie / zw.max); zw.pasek.position.set(zw.x, zw.wys + 0.4, zw.z); }
  }
  // palisada: pasek i powolne łatanie
  for (const s of G.segmenty) {
    if (s.atak > 0) s.atak -= dt;
    else if (!s.zlamany && s.hp < s.max) s.hp = Math.min(s.max, s.hp + dt * 0.4);
    const r = s.hp / s.max;
    s.pasek.visible = !s.zlamany && r < 0.999;
    if (s.pasek.visible) rysujPasek(s.pasek, r);
    if (s.wew && !s.zlamany) s.wew.position.x = s.atak > 0 ? Math.sin(czasGry * 50) * 0.04 : 0;
  }
}
function wObozie(x, z) { return x > OBOZ.x0 + 0.3 && x < OBOZ.x1 - 0.3 && z > OBOZ.z0 + 0.3 && z < OBOZ.z1; }
function usunZwierze(i) {
  const zw = G.zwierzeta[i]; swiat.remove(zw.obj); swiat.remove(zw.pasek); G.zwierzeta.splice(i, 1);
  if (G.zwierzeta.length === 0) { grajMuzyke(false); if (S.fala > 0) toast('Fala odparta! Brawo!'); }
}
function uderz(zw, sila, skad) {
  if (zw.stan === 'ucieka') return;
  zw.zycie -= sila; zw.migaj = 0.15;
  const dx = zw.x - skad.x, dz = zw.z - skad.z, d = Math.hypot(dx, dz) || 1;
  zw.odrzut.set(dx / d * 5, 0, dz / d * 5);
  if (zw.zycie <= 0) przegon(zw);
}

// armatki śnieżne
const KULA_G = new THREE.SphereGeometry(0.2, 8, 6), KULA_M = new THREE.MeshLambertMaterial({ color: '#ffffff' });
function aktualizujArmatki(dt) {
  for (const id in G.budowle) {
    const B = G.budowle[id]; if (B.cfg.rodzaj !== 'armatka' || B.rosnie !== undefined) continue;
    B.T -= dt;
    let cel = null, nd = 12;
    for (const zw of G.zwierzeta) { if (zw.stan === 'ucieka') continue; const d = Math.hypot(zw.x - B.x, zw.z - B.z); if (d < nd) { nd = d; cel = zw; } }
    if (!cel) continue;
    const kat = Math.atan2(cel.x - B.x, cel.z - B.z);
    B.lufa.rotation.y += (kat - B.lufa.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI > 0 ? Math.min(dt * 8, Math.abs(((kat - B.lufa.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI)) : -Math.min(dt * 8, Math.abs(((kat - B.lufa.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI));
    if (B.T <= 0) {
      B.T = 1.1;
      const m = new THREE.Mesh(KULA_G, KULA_M); swiat.add(m);
      const start = V(B.x, 2.5, B.z), cz = 0.45;
      const cx = cel.x + Math.sin(cel.kat) * cel.def.v * cz * (cel.stan === 'idzie' ? 1 : 0), czz = cel.z + Math.cos(cel.kat) * cel.def.v * cz * (cel.stan === 'idzie' ? 1 : 0);
      G.pociski.push({ m, a: start, b: V(cx, 0.6, czz), t: 0, cz, cel });
      dzwiek('sniezka');
    }
  }
  for (let i = G.pociski.length - 1; i >= 0; i--) {
    const p = G.pociski[i]; p.t += dt;
    const u = Math.min(1, p.t / p.cz);
    p.m.position.lerpVectors(p.a, p.b, u); p.m.position.y += Math.sin(u * Math.PI) * 2;
    if (u >= 1) {
      swiat.remove(p.m); G.pociski.splice(i, 1);
      wybuch('puch', p.b, 5, 2, 0.4, 0.6);
      for (const zw of G.zwierzeta) if (Math.hypot(zw.x - p.b.x, zw.z - p.b.z) < 1.4) uderz(zw, 1, p.a);
    }
  }
}

// ================= pomocnicy =================
function dodajPomocnika(B) {
  const obj = kopia('pomocnik', () => MOD.pomocnik());
  const x = B.x, z = B.z + 1.6;
  obj.position.set(x, 0, z); swiat.add(obj);
  const stos = new THREE.Group(); stos.position.set(0, 0.95, -0.42); obj.add(stos);
  const p = { B, obj, x, z, kat: 0, faza: 0, stan: 'szuka', niesie: [], stos, T: 0, cel: null, nogi: czesci(obj, 'noga'), rece: czesci(obj, 'reka') };
  G.pomocnicy.push(p);
}
function celDostawy(p) { const B = G.budowle[p.B.cfg.do]; return B ? B : null; }
function aktualizujPomocnikow(dt) {
  const v = 3.4 * tempoPomocy();
  for (const p of G.pomocnicy) {
    const typ = p.B.cfg.zbiera, def = Object.values(WEZLY).find(w => w.daje === typ);
    let ruch = false;
    const idzDo = (x, z) => {
      const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz);
      if (d < 0.15) return true;
      const s = Math.min(d, v * dt); p.x += dx / d * s; p.z += dz / d * s; p.kat = Math.atan2(dx, dz); p.faza += dt * 10; ruch = true;
      return false;
    };
    if (p.stan === 'szuka') {
      let naj = null, nd = Infinity;
      for (const w of G.wezly) if (w.def.daje === typ && w.zostalo > 0 && !w.zajety) { const d = Math.hypot(w.x - p.x, w.z - p.z); if (d < nd) { nd = d; naj = w; } }
      if (naj) { p.cel = naj; naj.zajety = p; p.stan = 'idzie'; }
      else if (p.niesie.length) p.stan = 'niesie';
    } else if (p.stan === 'idzie') {
      const w = p.cel, d = Math.hypot(w.x - p.x, w.z - p.z);
      if (d > 1.5) { const a = Math.atan2(w.x - p.x, w.z - p.z); idzDo(w.x - Math.sin(a) * 1.3, w.z - Math.cos(a) * 1.3); }
      else { p.stan = 'zbiera'; p.T = 0; }
    } else if (p.stan === 'zbiera') {
      const w = p.cel; p.T += dt; p.kat = Math.atan2(w.x - p.x, w.z - p.z);
      if (p.T > 0.65 * def.trud / tempoPomocy()) {
        p.T = 0;
        if (w.zostalo > 0) {
          w.zostalo--; pokazWezel(w); w.drga = 0.2;
          const m = przedmiot(typ); const idx = p.niesie.length; p.niesie.push(m); swiat.add(m);
          let y = 0; for (let j = 0; j < idx; j++) y += wys(typ);
          lot(m, V(w.x, 0.8, w.z), () => p.stos.localToWorld(V(0, y, 0)), 0.3, 1, () => { p.stos.add(m); m.position.set(0, y, 0); m.rotation.set(0, 0, 0); });
        }
        if (p.niesie.length >= 5 || w.zostalo <= 0) { if (w.zostalo <= 0 && !w.odrost) w.odrost = w.def.odrost; w.zajety = null; p.stan = p.niesie.length >= 5 ? 'niesie' : 'szuka'; }
      }
    } else if (p.stan === 'niesie') {
      const B = celDostawy(p);
      if (!B) { p.stan = 'szuka'; continue; }
      if (idzDo(B.pad.x, B.pad.z)) { p.stan = 'oddaje'; p.T = 0; }
    } else if (p.stan === 'oddaje') {
      const B = celDostawy(p); p.T -= dt;
      if (p.T <= 0 && p.niesie.length) {
        if (!miejsceW(B)) { p.T = 0.5; }
        else {
          p.T = 0.12;
          const m = p.niesie.pop(); swiat.attach(m);
          przyjmij(B, typ, m);
        }
      }
      if (!p.niesie.length) p.stan = 'szuka';
    }
    p.obj.position.set(p.x, 0, p.z); p.obj.rotation.y = p.kat;
    p.nogi.forEach((n, j) => { n.rotation.x = ruch ? Math.sin(p.faza + j * Math.PI) * 0.6 : 0; });
    p.rece[1].rotation.x = p.stan === 'zbiera' ? -1.2 + Math.sin(czasGry * 14) * 0.4 : ruch ? -Math.sin(p.faza) * 0.5 : 0;
    p.rece[0].rotation.x = ruch ? Math.sin(p.faza) * 0.5 : 0;
  }
}
function miejsceW(B) {
  if (B.cfg.rodzaj === 'lada') return B.zapas + B.dolot < B.maks;
  return B.wej + B.dolot < B.maks;
}
// przedmiot (mesh już w świecie) leci do budowli i tam zostaje
function przyjmij(B, typ, m) {
  B.dolot++;
  const start = m.position.clone();
  if (B.cfg.rodzaj === 'lada') {
    lot(m, start, () => B.obj.localToWorld(V(-1.1 + (B.meshe.length % 5) * 0.55, 1.1, 0)), 0.3, 1.2, () => { swiat.remove(m); B.dolot--; B.zapas++; dodajNaLade(B); });
  } else {
    lot(m, start, () => pozycjaStosu(B, B.meshe.length, typ), 0.3, 1.2, () => { swiat.remove(m); B.dolot--; B.wej++; dodajDoStosu(B, typ); });
  }
  dzwiek('odloz');
}

// ================= produkcja =================
function aktualizujProdukcje(dt) {
  for (const id in G.budowle) {
    const B = G.budowle[id], c = B.cfg;
    if (B.rosnie !== undefined) {
      B.rosnie += dt; const u = Math.min(1, B.rosnie / 0.45);
      B.obj.scale.setScalar(u < 1 ? 0.01 + 1.15 * Math.sin(u * Math.PI / 2) - (u > 0.75 ? (u - 0.75) * 0.6 : 0) : 1);
      if (u >= 1) { B.obj.scale.setScalar(1); delete B.rosnie; }
    }
    if (c.rodzaj === 'przetwornia') {
      const L = G.budowle[c.dla];
      const pracuje = B.wej > 0 && L && L.zapas + L.dolot < L.maks;
      if (B.ogien) B.ogien.visible = pracuje || Math.floor(czasGry * 2) % 2 === 0;
      if (B.ogien && B.ogien.isGroup) B.ogien.children.forEach((f, i) => { f.scale.y = 0.8 + Math.sin(czasGry * 18 + i) * 0.25; });
      if (pracuje) {
        B.T += dt;
        if (B.pow) B.pow.position.y = 1.2 + Math.sin(czasGry * 10) * 0.03;
        if (B.T >= c.czas) {
          B.T = 0; B.wej--; zdejmijZeStosu(B);
          const m = przedmiot(c.wyj); swiat.add(m); m.position.set(B.x, 1.8, B.z);
          przyjmij(L, c.wyj, m);
        }
      }
      if (B.dym && pracuje && Math.random() < dt * 3) czastka('dym', B.dym.clone(), V(losowo(-0.2, 0.2), 1.2, losowo(-0.2, 0.2)), 2, 0.8, 2.5);
    } else if (c.rodzaj === 'kopalnia') {
      if (B.wyj < B.maks) { B.T += dt; if (B.T >= c.co) { B.T = 0; B.wyj++; dodajDoStosu(B, c.wyj); czastka('puch', V(B.x + 1.5, 0.6, B.z + 1), V(0, 1.5, 0), 0.5, 0.6, 1.5); } }
    } else if (c.rodzaj === 'piec') {
      if (S.ogrzewanie > 0) S.ogrzewanie -= dt;
      if (S.ogrzewanie < 4 && B.wej > 0) { B.wej--; zdejmijZeStosu(B); S.ogrzewanie += 12; }
      if (B.ogien) B.ogien.visible = S.ogrzewanie > 0;
      if (B.dym && S.ogrzewanie > 0 && Math.random() < dt * 3) czastka('dym', B.dym.clone(), V(losowo(-0.2, 0.2), 1.3, losowo(-0.2, 0.2)), 2, 0.9, 2.5);
    } else if (c.rodzaj === 'domek') {
      if (B.dym && Math.random() < dt * 1.2) czastka('dym', B.dym.clone(), V(losowo(-0.2, 0.2), 1.0, losowo(-0.2, 0.2)), 2.2, 0.7, 2.5);
    } else if (c.rodzaj === 'wagonik') aktualizujWagonik(B, dt);
    else if (c.rodzaj === 'cel') {
      if (B.swiatlo) B.swiatlo.scale.setScalar(1 + Math.sin(czasGry * 3) * 0.1);
      B.pier?.forEach((r, i) => { r.rotation.z += dt * (0.5 + i * 0.3); r.position.y = 6 + i * 0.9 + Math.sin(czasGry * 2 + i) * 0.15; });
      if (B.dym && Math.random() < dt * 2) czastka('dym', B.dym.clone(), V(losowo(-0.3, 0.3), 1.5, losowo(-0.3, 0.3)), 2.5, 1.2, 2.5);
    }
  }
  // odrastanie krzaków itp.
  for (const w of G.wezly) {
    if (w.zostalo <= 0) {
      if (!w.odrost) w.odrost = w.def.odrost;
      w.odrost -= dt;
      if (w.odrost <= 0) { w.odrost = 0; w.zostalo = w.def.ile; pokazWezel(w); wybuch('gwiazda', V(w.x, 1, w.z), 4, 1.5, 0.5, 0.35); }
    }
    if (w.drga > 0) { w.drga -= dt; w.obj.scale.set(1 + Math.sin(w.drga * 60) * 0.06, 1 - Math.sin(w.drga * 60) * 0.06, 1 + Math.sin(w.drga * 60) * 0.06); }
    else if (w.obj.scale.x !== 1) w.obj.scale.setScalar(1);
    if (w.splawik) w.splawik.position.y = 0.08 + Math.sin(czasGry * 3 + w.x) * 0.04;
  }
}
function aktualizujWagonik(B, dt) {
  const zrodlo = G.budowle[B.cfg.skad], cel = G.budowle[B.cfg.do];
  const poz = s => {
    let i = 0; while (i < B.dl.length - 1 && s > B.dl[i]) i++;
    const s0 = i ? B.dl[i - 1] : 0, u = (s - s0) / (B.dl[i] - s0);
    return { p: V().lerpVectors(B.tory[i], B.tory[i + 1], Math.max(0, Math.min(1, u))), kat: Math.atan2(B.tory[i + 1].x - B.tory[i].x, B.tory[i + 1].z - B.tory[i].z) };
  };
  B.T -= dt;
  if (B.stan === 'laduje') {
    if (zrodlo && zrodlo.wyj > 0 && B.ladunek.length < 8 && B.T <= 0) {
      B.T = 0.15; zrodlo.wyj--; zdejmijZeStosu(zrodlo);
      const m = przedmiot(B.cfg.skad === 'kopalnia' ? 'ruda' : 'ruda');
      if (B.ladunek.length < 4) { m.position.set((B.ladunek.length % 2 - 0.5) * 0.35, 0.75, (Math.floor(B.ladunek.length / 2) - 0.5) * 0.4); B.obj.add(m); }
      B.ladunek.push(m);
    }
    if (B.ladunek.length >= 8 || (B.ladunek.length > 0 && zrodlo && zrodlo.wyj === 0 && B.T < -2)) B.stan = 'jedzie';
  } else if (B.stan === 'jedzie') {
    B.s = Math.min(B.calosc, B.s + dt * 4);
    if (B.s >= B.calosc) B.stan = 'rozladowuje';
  } else if (B.stan === 'rozladowuje') {
    if (B.ladunek.length && B.T <= 0 && cel && miejsceW(cel)) {
      B.T = 0.15; const m = B.ladunek.pop(); if (m.parent) B.obj.remove(m);
      const nm = przedmiot('ruda'); swiat.add(nm); nm.position.copy(B.obj.position).add(V(0, 1, 0));
      przyjmij(cel, 'ruda', nm);
    }
    if (!B.ladunek.length) B.stan = 'wraca';
  } else if (B.stan === 'wraca') {
    B.s = Math.max(0, B.s - dt * 5);
    if (B.s <= 0) { B.stan = 'laduje'; B.T = 0; }
  }
  const { p, kat } = poz(B.s);
  B.obj.position.copy(p); B.obj.rotation.y = kat;
}

// ================= gracz: ruch, zbieranie, machanie, miejsca =================
const wejscie = { x: 0, z: 0, klaw: {} };
function aktualizujGracza(dt) {
  const gr = G.gracz;
  let ix = wejscie.x, iz = wejscie.z;
  const k = wejscie.klaw;
  if (k.ArrowLeft || k.a) ix -= 1; if (k.ArrowRight || k.d) ix += 1; if (k.ArrowUp || k.w) iz -= 1; if (k.ArrowDown || k.s) iz += 1;
  const dl = Math.hypot(ix, iz); if (dl > 1) { ix /= dl; iz /= dl; }
  const v = szybkosc() * Math.min(1, dl);
  gr.x += ix * v * dt; gr.z += iz * v * dt;
  gr.x = Math.max(-ZAKRES, Math.min(ZAKRES, gr.x)); gr.z = Math.max(-ZAKRES, Math.min(ZAKRES, gr.z));
  for (const c of G.kolizje) {
    const dx = gr.x - c.x, dz = gr.z - c.z, d = Math.hypot(dx, dz), m = c.r + 0.4;
    if (d < m && d > 0.0001) { gr.x = c.x + dx / d * m; gr.z = c.z + dz / d * m; }
  }
  gr.ruch = dl > 0.1 ? 1 : 0;
  if (gr.ruch) { gr.kat = Math.atan2(ix, iz); gr.faza += dt * 11; }
  gr.obj.position.set(gr.x, 0, gr.z);
  let dk = gr.kat - gr.obj.rotation.y; dk = Math.atan2(Math.sin(dk), Math.cos(dk));
  gr.obj.rotation.y += dk * Math.min(1, dt * 14);
  gr.nogi.forEach((n, j) => { n.rotation.x = gr.ruch * Math.sin(gr.faza + j * Math.PI) * 0.7; });
  gr.rece[0].rotation.x = gr.ruch * Math.sin(gr.faza) * 0.6;

  // machanie koszyczkiem na zwierzęta
  let blisko = false;
  for (const zw of G.zwierzeta) if (zw.stan !== 'ucieka' && Math.hypot(zw.x - gr.x, zw.z - gr.z) < 2.5) { blisko = true; break; }
  gr.machT -= dt;
  if (blisko && gr.machT <= 0) {
    gr.machT = 0.45; gr.mach = 0.3; dzwiek('mach');
    for (const zw of G.zwierzeta) if (Math.hypot(zw.x - gr.x, zw.z - gr.z) < 2.6) uderz(zw, silaMachu(), gr);
    wybuch('puch', V(gr.x, 1, gr.z), 6, 4, 0.35, 0.5);
  }
  // zbieranie
  let zbiera = null;
  if (gr.plecak.length < pojemnosc()) {
    let nd = 2.1;
    for (const w of G.wezly) { if (w.zostalo <= 0) continue; const d = Math.hypot(w.x - gr.x, w.z - gr.z); if (d < nd) { nd = d; zbiera = w; } }
  }
  if (zbiera) {
    gr.zbierzT += dt;
    const t = tempoZbierania() * zbiera.def.trud;
    if (gr.zbierzT >= t) {
      gr.zbierzT = 0; zbiera.zostalo--; pokazWezel(zbiera); zbiera.drga = 0.2;
      doPlecaka(zbiera.def.daje, V(zbiera.x, 0.9, zbiera.z));
      dzwiek('zbierz');
      if (zbiera.def.daje === 'jagody' && Math.random() < 0.5) czastka('puch', V(zbiera.x, 1, zbiera.z), V(0, 1, 0), 0.4, 0.4, 1.5);
    }
  } else gr.zbierzT = Math.min(gr.zbierzT, 0.2);
  // ręka z koszyczkiem
  if (gr.mach > 0) { gr.mach -= dt; gr.rece[1].rotation.x = -2.6 * Math.sin((gr.mach / 0.3) * Math.PI); gr.rece[1].rotation.z = 0.6 * Math.sin((gr.mach / 0.3) * Math.PI); }
  else if (zbiera) { gr.rece[1].rotation.x = -1.3 + Math.sin(czasGry * 16) * 0.35; gr.rece[1].rotation.z = 0; }
  else { gr.rece[1].rotation.x = -gr.ruch * Math.sin(gr.faza) * 0.6; gr.rece[1].rotation.z = 0; }

  // plecak: kołysanie stosu
  let i = 0;
  for (const e of gr.plecak) {
    if (e.dotarl) {
      e.mesh.position.y += (e.cy - e.mesh.position.y) * Math.min(1, dt * 14);
      e.mesh.position.x = Math.sin(czasGry * 4 + i * 0.35) * 0.012 * i * (0.4 + gr.ruch);
    }
    i++;
  }
  gr.stos.rotation.x = -gr.ruch * 0.08;
  const pelny = gr.plecak.length >= pojemnosc();
  gr.pelny.visible = pelny;
  if (pelny) { let h = 0; for (const e of gr.plecak) h += e.h; gr.pelny.position.set(gr.x, 2.3 + h, gr.z); }

  // miejsca: odkładanie, branie, płacenie
  gr.padT -= dt;
  for (const p of G.pady) {
    const d = Math.hypot(p.x - gr.x, p.z - gr.z);
    if (d > p.r) continue;
    obsluzPad(p, dt);
  }
}

function obsluzPad(p, dt) {
  const gr = G.gracz;
  if (p.typ === 'zrzut') {
    if (gr.padT > 0) return;
    if (!miejsceW(p.B)) return;
    const m = zPlecaka(p.przyjmuje);
    if (m) { gr.padT = 0.07; przyjmij(p.B, p.przyjmuje, m); }
  } else if (p.typ === 'odbior') {
    if (gr.padT > 0 || p.B.wyj <= 0) return;
    if (gr.plecak.length >= pojemnosc()) return;
    gr.padT = 0.08;
    const m = zdejmijZeStosu(p.B); p.B.wyj--;
    doPlecaka(p.daje, m ? m.position.clone() : V(p.x, 0.5, p.z));
  } else if (p.typ === 'kasa') {
    if (p.wartosc <= 0) return;
    const ile = p.meshe.length ? p.wartosc / p.meshe.length : p.wartosc;
    const m = p.meshe.pop();
    p.wartosc -= ile; if (p.meshe.length === 0) p.wartosc = 0;
    dajKase(ile);
    if (m) lot(m, m.position.clone(), () => V(gr.x, 1.2, gr.z), 0.22, 0.8, () => swiat.remove(m));
    dzwiek('kasa');
    if (p.lup && p.wartosc <= 0) G.pady.splice(G.pady.indexOf(p), 1);
  } else if (p.typ === 'buduj' || p.typ === 'ulepsz' || p.typ === 'napraw') {
    if (S.kasa <= 0 || !isFinite(p.koszt)) return;
    const zostalo = p.koszt - p.wplacone;
    const ile = Math.min(S.kasa, zostalo, Math.max(1, p.koszt * dt / 1.3));
    S.kasa -= ile; p.wplacone += ile;
    if (p.typ === 'buduj') S.wplacone[p.cfg.id] = p.wplacone;
    gr.padT -= 0;
    if (!p.wizT || p.wizT <= 0) {
      p.wizT = 0.07;
      const m = przedmiot('kasa'); swiat.add(m);
      lot(m, V(gr.x, 1.3, gr.z), V(p.x, 0.1, p.z), 0.25, 1.0, () => swiat.remove(m));
      dzwiek('placi');
    } else p.wizT -= dt;
    odswiezKase();
    if (p.wplacone >= p.koszt - 0.001) {
      if (p.typ === 'buduj') zbuduj(p.cfg);
      else if (p.typ === 'ulepsz') {
        S.warsztat[p.u.id]++; p.wplacone = 0; ustawUlepszenie(p); dzwiek('buduj'); konfetti(V(p.x, 1, p.z), 20);
        baner(p.u.nazwa + '!', p.u.opis); zmienionyPlecak(); zapiszGre();
      } else {
        const s = p.seg; s.hp = s.max; wyglądSegmentu(s); dzwiek('buduj'); wybuch('gwiazda', V(s.x, 1, s.z), 8, 2, 0.6, 0.5);
      }
    } else if (p.mesh && p.typ !== 'napraw') rysujPad(p);
    else if (p.typ === 'napraw') { const z = Math.ceil(p.koszt - p.wplacone); if (z !== p.ost) { p.ost = z; rysujPole(p.mesh.userData.cv, EMOJI.napraw, z, 'napraw'); p.mesh.material.map.needsUpdate = true; } }
  }
}
function dajKase(ile) { S.kasa += ile; odswiezKase(true); }

// ================= przewodnik (strzałka i zadanie) =================
let zadanieT = 0, zadanieCel = null;
function aktualizujPrzewodnik(dt) {
  zadanieT -= dt;
  if (zadanieT <= 0) { zadanieT = 0.35; wybierzZadanie(); }
  const gr = G.gracz;
  if (zadanieCel) {
    const d = Math.hypot(zadanieCel.x - gr.x, zadanieCel.z - gr.z);
    G.strzalka.visible = d > 1.6;
    G.strzalka.position.set(zadanieCel.x, (zadanieCel.y || 2.6) + Math.abs(Math.sin(czasGry * 3)) * 0.5, zadanieCel.z);
    G.strzalka.rotation.y += dt * 2;
    G.kierunek.visible = d > 5;
    if (G.kierunek.visible) {
      const a = Math.atan2(zadanieCel.x - gr.x, zadanieCel.z - gr.z);
      G.kierunek.position.set(gr.x + Math.sin(a) * 1.9, 0.06, gr.z + Math.cos(a) * 1.9);
      G.kierunek.rotation.z = a + Math.PI;
    }
  } else { G.strzalka.visible = false; G.kierunek.visible = false; }
}
function wybierzZadanie() {
  const gr = G.gracz;
  const ustaw = (tekst, cel) => { $('zadanie').textContent = tekst; zadanieCel = cel; };
  // 1. zwierzęta w obozie
  let naj = null, nd = Infinity;
  for (const zw of G.zwierzeta) {
    if (zw.stan === 'ucieka') continue;
    const d = Math.hypot(zw.x - gr.x, zw.z - gr.z);
    if ((zw.stan === 'je' || zw.stan === 'wchodzi' || zw.stan === 'atakuje') && d < nd) { nd = d; naj = zw; }
  }
  if (naj && (naj.stan !== 'atakuje' || !Object.values(G.budowle).some(b => b.cfg.rodzaj === 'armatka') || naj.seg.hp < naj.seg.max * 0.5)) {
    return ustaw(naj.stan === 'atakuje' ? 'Przegoń zwierzęta od palisady!' : 'Przegoń zwierzęta od zapasów!', { x: naj.x, z: naj.z, y: naj.wys + 1 });
  }
  // 2. dziura w palisadzie
  for (const s of G.segmenty) if (s.pad && S.kasa >= s.pad.koszt - s.pad.wplacone) return ustaw('Napraw dziurę w palisadzie', { x: s.pad.x, z: s.pad.z });
  // 3. budowa, na którą stać
  const pola = Object.values(G.pola).sort((a, b) => (a.koszt - a.wplacone) - (b.koszt - b.wplacone));
  const tanie = pola.find(p => S.kasa >= p.koszt - p.wplacone);
  if (tanie) return ustaw('Zbuduj: ' + tanie.cfg.nazwa, { x: tanie.x, z: tanie.z });
  // 4. pieniądze do zebrania
  let kasa = null, kw = 0;
  for (const p of G.pady) if (p.typ === 'kasa' && p.wartosc > kw) { kw = p.wartosc; kasa = p; }
  const potrzeba = pola.length ? pola[0].koszt - pola[0].wplacone - S.kasa : Infinity;
  if (kasa && (kw >= 4 || kw >= potrzeba)) return ustaw('Zbierz pieniądze', { x: kasa.x, z: kasa.z });
  // 5. coś w plecaku: zanieś
  if (gr.plecak.length) {
    const typy = [...new Set(gr.plecak.map(e => e.typ))];
    let cel = null, cd = Infinity;
    for (const p of G.pady) if (p.typ === 'zrzut' && typy.includes(p.przyjmuje) && miejsceW(p.B)) { const d = Math.hypot(p.x - gr.x, p.z - gr.z); if (d < cd) { cd = d; cel = p; } }
    if (cel && (gr.plecak.length >= pojemnosc() || !gr.plecak.some(e => !e.dotarl) && (cd < 6 || gr.plecak.length >= Math.min(pojemnosc(), 6) || brakWezlow(typy)))) {
      const nazwa = cel.B.cfg.rodzaj === 'lada' ? 'na ladę' : cel.B.cfg.rodzaj === 'piec' ? 'do pieca' : 'do: ' + cel.B.cfg.nazwa;
      return ustaw(`Zanieś ${PRZEDMIOTY[cel.przyjmuje].nazwa.toLowerCase()} ${nazwa}`, { x: cel.x, z: cel.z });
    }
  }
  // 6. co zbierać
  const potrzeby = [];
  for (const id in G.budowle) {
    const B = G.budowle[id];
    if (!B.pad || B.pad.typ !== 'zrzut') continue;
    const ma = B.cfg.rodzaj === 'lada' ? B.zapas : B.wej;
    if (ma + B.dolot < B.maks) potrzeby.push({ typ: B.pad.przyjmuje, ile: ma / B.maks });
  }
  potrzeby.sort((a, b) => a.ile - b.ile);
  const kop = Object.values(G.budowle).find(b => b.cfg.rodzaj === 'kopalnia' && b.wyj > 0);
  for (const pt of potrzeby) {
    if (pt.typ === 'ruda' && kop && !G.budowle.wagonik) return ustaw('Weź rudę z kopalni', { x: kop.pad.x, z: kop.pad.z });
    let w = null, wd = Infinity;
    for (const x of G.wezly) if (x.def.daje === pt.typ && x.zostalo > 0) { const d = Math.hypot(x.x - gr.x, x.z - gr.z); if (d < wd) { wd = d; w = x; } }
    if (w) {
      const co = { jagody: 'Zbieraj jagody z krzaków', ryba: 'Łów ryby w przeręblach', ruda: 'Kop rudę ze skał', wegiel: 'Kop węgiel', krysztal: 'Zbieraj lodowe kryształy' };
      return ustaw(gr.plecak.length >= pojemnosc() ? 'Plecak pełny! Zanieś zbiory' : co[pt.typ] || 'Zbieraj', { x: w.x, z: w.z, y: 2.2 });
    }
  }
  if (pola.length) return ustaw(`Zbieraj na: ${pola[0].cfg.nazwa}`, null);
  ustaw('', null);
}
function brakWezlow(typy) { return !G.wezly.some(w => typy.includes(w.def.daje) && w.zostalo > 0); }

// ================= HUD =================
let hudTypy = [];
function przygotujHud() {
  const typy = new Set();
  for (const b of S.k.budowle) {
    if (b.rodzaj === 'lada') typy.add(b.item);
    if (b.rodzaj === 'przetwornia' || b.rodzaj === 'piec') typy.add(b.wej);
    if (b.rodzaj === 'kopalnia') typy.add(b.wyj);
  }
  for (const r of S.k.regiony) typy.add(WEZLY[r.wezel].daje);
  ['dzem', 'wedzona', 'zloto'].forEach(t => typy.delete(t));
  hudTypy = [...typy];
  const z = $('zasoby'); z.innerHTML = '';
  const kasa = document.createElement('div'); kasa.className = 'chip kasa'; kasa.id = 'h-kasa';
  kasa.innerHTML = `<img src="${ikonaURL('kasa')}" alt=""><span>0</span>`; z.appendChild(kasa);
  const pl = document.createElement('div'); pl.className = 'chip'; pl.id = 'h-plecak';
  pl.innerHTML = `<img src="${ikonaURL('jagody')}" alt=""><span></span>`; z.appendChild(pl);
  for (const t of hudTypy) {
    if (t === 'jagody') continue;
    const c = document.createElement('div'); c.className = 'chip'; c.dataset.typ = t;
    c.innerHTML = `<img src="${ikonaURL(t)}" alt=""><span>0</span>`; z.appendChild(c);
  }
  if (S.k.cieplo) { const c = document.createElement('div'); c.className = 'chip'; c.id = 'h-cieplo'; z.appendChild(c); }
  odswiezKase(); zmienionyPlecak();
}
let kasaWidac = -1;
function odswiezKase(puls) {
  const v = Math.floor(S.kasa);
  if (v !== kasaWidac) { kasaWidac = v; const e = $('h-kasa'); if (e) { e.querySelector('span').textContent = v; if (puls) { e.classList.remove('puls'); void e.offsetWidth; e.classList.add('puls'); } } }
  for (const id in G?.pola || {}) rysujPad(G.pola[id]);
}
function zmienionyPlecak() {
  const pl = G.gracz.plecak;
  const e = $('h-plecak'); if (e) e.querySelector('span').textContent = `${pl.filter(x => x.typ === 'jagody').length}  ·  ${pl.length}/${pojemnosc()}`;
  for (const c of document.querySelectorAll('#zasoby .chip[data-typ]')) c.querySelector('span').textContent = pl.filter(x => x.typ === c.dataset.typ).length;
}
function odswiezHud() {
  if (S.k.cieplo) {
    const c = $('h-cieplo'), st = cieplo();
    c.className = 'chip ' + (st === 'zimno' ? 'zimno' : st === 'ciepło' ? 'cieplo' : '');
    c.textContent = st === 'brak' ? '🔥 piec: zbuduj' : st === 'ciepło' ? `🔥 ciepło ${Math.ceil(S.ogrzewanie)} s` : '🥶 zimno! dorzuć węgla';
  }
  const f = $('fala');
  if (S.doFali !== null) {
    f.hidden = false;
    const zw = G.zwierzeta.filter(z => z.stan !== 'ucieka').length;
    if (zw > 0) { f.textContent = `Zwierzęta: ${zw}`; f.classList.add('blisko'); }
    else { const s = Math.ceil(S.doFali); f.textContent = `Fala ${S.fala + 1} za ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; f.classList.toggle('blisko', s <= 10); }
  } else f.hidden = true;
}
let banerT = null;
function baner(tekst, maly = '', zly = false) {
  const b = $('baner'); b.innerHTML = ''; b.append(tekst);
  if (maly) { const s = document.createElement('small'); s.textContent = maly; b.appendChild(s); }
  b.classList.toggle('zly', zly); b.classList.add('widac');
  clearTimeout(banerT); banerT = setTimeout(() => b.classList.remove('widac'), 2400);
}
let toastT = null;
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('widac'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('widac'), 2600); }

// ================= kamera =================
function ustawKamere(dt, natychmiast) {
  const w = window.innerWidth, h = window.innerHeight, asp = w / h;
  camera.aspect = asp; camera.fov = asp < 1 ? 46 : 40; camera.updateProjectionMatrix();
  const tv = Math.tan(camera.fov * Math.PI / 360);
  const d = Math.max(5.6 / (tv * asp), 7.5 / tv, 13);
  const gr = G.gracz;
  const cel = V(gr.x, 0, gr.z + 1.0);
  if (!ustawKamere.cel || natychmiast) ustawKamere.cel = cel.clone();
  ustawKamere.cel.lerp(cel, Math.min(1, dt * 6));
  const c = ustawKamere.cel, kat = 0.95;
  camera.position.set(c.x, c.y + Math.sin(kat) * d, c.z + Math.cos(kat) * d);
  camera.lookAt(c);
  sun.position.set(c.x + 12, 30, c.z + 10); sun.target.position.copy(c);
  scene.fog.near = d + 6; scene.fog.far = d + 60;
  if (G.snieg) G.snieg.position.set(c.x, 0, c.z);
}

// ================= zapis gry =================
function stanDoZapisu() {
  const z = {
    id: S.k.id, czas: S.czas, kasa: S.kasa, warsztat: S.warsztat, zbudowane: S.zbudowane, wplacone: S.wplacone,
    fala: S.fala, doFali: S.doFali, nieskonczona: S.nieskonczona, ukonczona: S.ukonczona,
    zapasy: {}, kasy: {}, kopalnia: 0, ogrzewanie: S.ogrzewanie,
    palisada: G.segmenty.map(s => Math.round(s.hp * 10) / 10), plecak: G.gracz.plecak.map(e => e.typ), gracz: [G.gracz.x, G.gracz.z],
  };
  for (const id in G.budowle) {
    const B = G.budowle[id];
    if (B.cfg.rodzaj === 'lada') { z.zapasy[id] = B.zapas + B.dolot; z.kasy[id] = Math.round(B.kasa.wartosc); }
    if (B.cfg.rodzaj === 'przetwornia' || B.cfg.rodzaj === 'piec') z.zapasy[id] = B.wej + B.dolot;
    if (B.cfg.rodzaj === 'kopalnia') z.kopalnia = B.wyj;
  }
  // pieniądze z przegonionych zwierząt dolicz do kasy
  for (const p of G.pady) if (p.lup) z.kasa += p.wartosc;
  return z;
}
function zapiszGre() {
  if (!S || !G) return;
  zapis.gry[S.k.id] = stanDoZapisu(); zapis.ostatnia = S.k.id; zapiszDysk();
}
setInterval(() => { if (S && !pauza) zapiszGre(); }, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!pauza) zapiszGre(); if (muzyka) muzyka.pause(); } else if (S && !pauza) grajMuzyke(G.zwierzeta.length > 0); });

// ================= start krainy =================
function uruchomKraine(id, odNowa) {
  const k = KRAINY.find(x => x.id === id);
  const z = !odNowa && zapis.gry[id];
  S = nowyStan(k);
  if (z) {
    Object.assign(S, {
      czas: z.czas || 0, kasa: z.kasa || 0, warsztat: { ...S.warsztat, ...z.warsztat }, zbudowane: [...(z.zbudowane || [])], wplacone: { ...(z.wplacone || {}) },
      fala: z.fala || 0, doFali: z.doFali ?? null, nieskonczona: !!z.nieskonczona, ukonczona: !!z.ukonczona,
      zapasy: z.zapasy || {}, kasy: z.kasy || {}, kopalnia: z.kopalnia || 0, ogrzewanie: z.ogrzewanie || 0, palisada: z.palisada || [], plecak: z.plecak || [], gracz: z.gracz || [...k.start],
    });
    S.plecak = S.plecak.slice(0, pojemnosc());
  }
  zapis.ostatnia = id;
  przeliczKlientow();
  zbudujSwiat();
  przygotujHud();
  ukryjOkna(); $('hud').hidden = false;
  pauza = false;
  ustawKamere(0, true);
  baner(k.nazwa, k.opis);
  grajMuzyke(false);
  zapiszGre();
}

function ukonczKraine() {
  if (S.ukonczona) return;
  S.ukonczona = true;
  const k = S.k, czas = S.czas;
  const gw = czas <= k.gwiazdki[0] ? 3 : czas <= k.gwiazdki[1] ? 2 : 1;
  const stare = zapis.krainy[k.id] || { gwiazdki: 0 };
  let kr = 0;
  if (!zapis.krainy[k.id]) kr += 10 + 5 * k.id;
  kr += 4 * Math.max(0, gw - stare.gwiazdki);
  zapis.krainy[k.id] = { gwiazdki: Math.max(gw, stare.gwiazdki), czas: Math.min(czas, stare.czas || Infinity) };
  zapis.krysztalki += kr;
  zapis.odblokowane = Math.max(zapis.odblokowane, Math.min(KRAINY.length, k.id + 1));
  zapiszGre();
  dzwiek('koniec');
  konfetti(V(G.gracz.x, 2, G.gracz.z), 80);
  setTimeout(() => {
    pauza = true;
    $('ko-tytul').textContent = 'Brawo! ' + k.nazwa;
    $('ko-gw').innerHTML = [1, 2, 3].map(i => `<span class="${i <= gw ? 'pelna' : 'pusta'}">★</span>`).join('');
    const m = Math.floor(czas / 60), s = Math.floor(czas % 60);
    $('ko-info').textContent = `Czas: ${m} min ${s} s. ` + (gw < 3 ? `Na 3 gwiazdki: do ${Math.floor(k.gwiazdki[0] / 60)} min.` : 'Mistrzostwo!');
    $('ko-kr').innerHTML = kr ? `+${kr} <img src="${ikonaURL('krysztalek')}" alt="">` : '';
    $('ko-dalej').hidden = k.id >= KRAINY.length;
    pokazOkno('o-koniec');
  }, 1600);
}

// ================= okna =================
const OKNA = ['o-menu', 'o-krainy', 'o-sklep', 'o-pauza', 'o-koniec', 'o-pytanie'];
function pokazOkno(id) { OKNA.forEach(o => { $(o).hidden = o !== id; }); }
function ukryjOkna() { OKNA.forEach(o => { $(o).hidden = true; }); }
function kr() { return `${zapis.krysztalki} <img src="${ikonaURL('krysztalek')}" alt="">`; }
function pokazMenu() {
  pauza = true; if (muzyka) muzyka.pause();
  $('m-kr').innerHTML = kr();
  $('m-graj').textContent = zapis.gry[zapis.ostatnia] ? `Graj dalej: ${KRAINY[zapis.ostatnia - 1].nazwa}` : 'Graj';
  $('m-wersja').textContent = `Yaceq Survival, wersja ${WERSJA}`;
  ustawPrzelaczniki();
  pokazOkno('o-menu');
}
function ustawPrzelaczniki() {
  for (const [id, k] of [['m-muz', 'muzyka'], ['p-muz', 'muzyka'], ['m-dzw', 'dzwieki'], ['p-dzw', 'dzwieki']]) {
    $(id).textContent = zapis[k] ? 'wł.' : 'wył.'; $(id).classList.toggle('wl', zapis[k]);
  }
}
function pokazKrainy() {
  const l = $('k-lista'); l.innerHTML = '';
  for (const k of KRAINY) {
    const otw = k.id <= zapis.odblokowane, wynik = zapis.krainy[k.id];
    const d = document.createElement('div'); d.className = 'pozycja' + (otw ? '' : ' zamknieta');
    const gw = wynik ? '★'.repeat(wynik.gwiazdki) + '☆'.repeat(3 - wynik.gwiazdki) : '☆☆☆';
    const trwa = zapis.gry[k.id] && !zapis.gry[k.id].ukonczona ? ' · w trakcie' : '';
    d.innerHTML = `<div class="nr">${k.id}</div><div class="tekst"><b>${k.nazwa}</b><small>${otw ? k.opis : 'Ukończ poprzednią krainę'}</small><span class="gw">${gw}</span><small>${trwa}</small></div>`;
    if (otw) {
      const b = document.createElement('button'); b.className = 'maly'; b.textContent = zapis.gry[k.id] ? 'Dalej' : 'Graj';
      b.onclick = () => { dzwiek('klik'); uruchomKraine(k.id); };
      d.appendChild(b);
    }
    l.appendChild(d);
  }
  pokazOkno('o-krainy');
}
let skadSklep = 'o-menu';
function pokazSklep(skad) {
  skadSklep = skad || skadSklep;
  $('s-kr').innerHTML = kr();
  const l = $('s-lista'); l.innerHTML = '';
  for (const u of STALE) {
    const poz = stale(u.id), cena = CENY_STALE[poz];
    const d = document.createElement('div'); d.className = 'pozycja';
    d.innerHTML = `<div class="nr">${EMOJI[u.id] || { mach: '💪', kasa: '🐷', pomoc: '👷' }[u.id]}</div><div class="tekst"><b>${u.nazwa}</b><small>${u.opis}</small><div class="poziomy">${Array.from({ length: u.max }, (_, i) => `<i class="${i < poz ? 'ma' : ''}"></i>`).join('')}</div></div>`;
    const b = document.createElement('button'); b.className = 'maly';
    if (poz >= u.max) { b.textContent = 'MAX'; b.disabled = true; }
    else {
      b.innerHTML = `${cena} <img src="${ikonaURL('krysztalek')}" alt="">`; b.disabled = zapis.krysztalki < cena;
      b.onclick = () => { if (zapis.krysztalki < cena) return; zapis.krysztalki -= cena; zapis.stale[u.id] = poz + 1; zapiszDysk(); dzwiek('buduj'); if (S && G) zmienionyPlecak(); pokazSklep(); };
    }
    d.appendChild(b); l.appendChild(d);
  }
  pokazOkno('o-sklep');
}
function pytanie(tytul, tekst, tak) {
  $('py-tytul').textContent = tytul; $('py-tekst').textContent = tekst;
  const poprzednie = OKNA.find(o => !$(o).hidden);
  $('py-tak').onclick = () => { tak(); };
  $('py-nie').onclick = () => { if (poprzednie) pokazOkno(poprzednie); };
  pokazOkno('o-pytanie');
}

$('m-graj').onclick = () => { audio(); dzwiek('klik'); uruchomKraine(zapis.ostatnia || 1); };
$('m-krainy').onclick = () => { audio(); dzwiek('klik'); pokazKrainy(); };
$('m-sklep').onclick = () => { audio(); dzwiek('klik'); pokazSklep('o-menu'); };
$('k-wroc').onclick = () => { dzwiek('klik'); pokazMenu(); };
$('s-wroc').onclick = () => { dzwiek('klik'); skadSklep === 'o-koniec' ? pokazOkno('o-koniec') : pokazMenu(); };
for (const id of ['m-muz', 'p-muz']) $(id).onclick = () => { audio(); zapis.muzyka = !zapis.muzyka; zapiszDysk(); ustawPrzelaczniki(); if (!zapis.muzyka && muzyka) muzyka.pause(); };
for (const id of ['m-dzw', 'p-dzw']) $(id).onclick = () => { audio(); zapis.dzwieki = !zapis.dzwieki; zapiszDysk(); ustawPrzelaczniki(); dzwiek('klik'); };
$('b-pauza').onclick = () => {
  if (!S) return; audio(); dzwiek('klik'); pauza = true; zapiszGre(); if (muzyka) muzyka.pause();
  const m = Math.floor(S.czas / 60);
  $('p-info').textContent = `${S.k.nazwa} · ${m} min · zbudowane: ${S.zbudowane.length} z ${S.k.budowle.length}`;
  ustawPrzelaczniki(); pokazOkno('o-pauza');
};
$('p-dalej').onclick = () => { dzwiek('klik'); ukryjOkna(); pauza = false; grajMuzyke(G.zwierzeta.length > 0); };
$('p-menu').onclick = () => { dzwiek('klik'); zapiszGre(); pokazMenu(); };
$('p-odnowa').onclick = () => pytanie('Od nowa?', `Cały postęp w krainie „${S.k.nazwa}” zniknie (gwiazdki i kryształki zostają).`, () => { delete zapis.gry[S.k.id]; zapiszDysk(); uruchomKraine(S.k.id, true); });
$('ko-dalej').onclick = () => { dzwiek('klik'); uruchomKraine(S.k.id + 1); };
$('ko-bez').onclick = () => {
  dzwiek('klik'); S.nieskonczona = true; ukryjOkna(); pauza = false;
  if (S.doFali === null || S.doFali > 15) S.doFali = 15;
  baner('Fale bez końca!', 'Za każdą odpartą falę: kryształek'); grajMuzyke(false); zapiszGre();
};
$('ko-sklep').onclick = () => { dzwiek('klik'); pokazSklep('o-koniec'); };

// ================= sterowanie =================
const joy = $('joy'), galka = $('galka');
let dotyk = null;
const cel = renderer.domElement;
cel.addEventListener('pointerdown', e => {
  audio();
  if (pauza || dotyk) return;
  dotyk = { id: e.pointerId, x: e.clientX, y: e.clientY };
  joy.hidden = false; joy.style.left = e.clientX + 'px'; joy.style.top = e.clientY + 'px'; galka.style.transform = '';
  try { cel.setPointerCapture(e.pointerId); } catch (er) { /* stary telefon */ }
});
cel.addEventListener('pointermove', e => {
  if (!dotyk || e.pointerId !== dotyk.id) return;
  const max = 50;
  let dx = e.clientX - dotyk.x, dy = e.clientY - dotyk.y, d = Math.hypot(dx, dy);
  // palec za kółkiem: kółko jedzie za palcem, a ludzik idzie pełną szybkością
  if (d > max) {
    dotyk.x = e.clientX - dx / d * max; dotyk.y = e.clientY - dy / d * max;
    joy.style.left = dotyk.x + 'px'; joy.style.top = dotyk.y + 'px';
    dx = dx / d * max; dy = dy / d * max; d = max;
  }
  galka.style.transform = `translate(${dx}px, ${dy}px)`;
  // małe wychylenie: wolniej; od 40% wychylenia: pełna szybkość
  const sila = d < 4 ? 0 : Math.min(1, d / (max * 0.4));
  wejscie.x = d < 4 ? 0 : dx / d * sila;
  wejscie.z = d < 4 ? 0 : dy / d * sila;
});
const puscDotyk = e => { if (!dotyk || e.pointerId !== dotyk.id) return; dotyk = null; joy.hidden = true; wejscie.x = 0; wejscie.z = 0; };
cel.addEventListener('pointerup', puscDotyk); cel.addEventListener('pointercancel', puscDotyk);
window.addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; wejscie.klaw[k] = true; audio();
  if (e.key === 'Escape' && S && !pauza) $('b-pauza').click();
});
window.addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; wejscie.klaw[k] = false; });
window.addEventListener('blur', () => { wejscie.klaw = {}; });

// ================= pętla =================
function rozmiar() { renderer.setSize(window.innerWidth, window.innerHeight, false); }
window.addEventListener('resize', rozmiar); rozmiar();

let ostatni = performance.now(), pomiar = { t: 0, n: 0, zrobiony: false };
function klatka(teraz) {
  requestAnimationFrame(klatka);
  let dt = (teraz - ostatni) / 1000; ostatni = teraz;
  if (dt > 0.1) dt = 0.1;
  if (S && G && !pauza) aktualizuj(dt);
  if (G) { ustawKamere(dt); renderer.render(scene, camera); }
}
function aktualizuj(dt) {
  {
    czasGry += dt; S.czas += dt;
    aktualizujGracza(dt);
    aktualizujProdukcje(dt);
    aktualizujKlientow(dt);
    aktualizujZwierzeta(dt);
    aktualizujArmatki(dt);
    aktualizujPomocnikow(dt);
    aktualizujLoty(dt);
    aktualizujCzastki(dt);
    aktualizujPrzewodnik(dt);
    for (let i = G.doWypuszczenia.length - 1; i >= 0; i--) {
      const w = G.doWypuszczenia[i]; w.T -= dt;
      if (w.T <= 0) { G.doWypuszczenia.splice(i, 1); noweZwierze(w.typ, w.wej); }
    }
    if (S.doFali !== null) {
      const zywe = G.zwierzeta.some(z => z.stan !== 'ucieka') || G.doWypuszczenia.length > 0;
      if (!zywe || S.nieskonczona) S.doFali -= dt;
      if (S.doFali <= 0) {
        if (S.nieskonczona && S.fala > 0) { zapis.krysztalki += 1; toast('+1 kryształek za falę!'); }
        nowaFala();
      }
    }
    odswiezHud();
    // śnieg
    const p = G.snieg.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * 1.6; if (y < 0) y += 22; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(czasGry + i) * dt * 0.3); }
    p.needsUpdate = true;
    // pomiar płynności: na wolnym telefonie wyłącz cienie
    if (!pomiar.zrobiony) {
      pomiar.t += dt; pomiar.n++;
      if (pomiar.t > 5) {
        pomiar.zrobiony = true;
        if (pomiar.t / pomiar.n > 1 / 40) {
          renderer.shadowMap.enabled = false; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25)); rozmiar();
          scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
        }
      }
    }
  }
}

// uchwyt do testów (konsola przeglądarki)
window.__yaceq = { get S() { return S; }, get G() { return G; }, get cel() { return zadanieCel; }, wejscie, KRAINY, nowaFala: () => nowaFala(), dajKase,
  krok(sek, dt = 1 / 60, rysuj = false) { for (let t = 0; t < sek; t += dt) aktualizuj(dt); if (rysuj) { ustawKamere(1, true); renderer.render(scene, camera); } } };

// ================= logo w menu =================
(function logo() {
  const c = $('logo').getContext('2d');
  const g = c.createRadialGradient(120, 110, 10, 120, 120, 118); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfe3f7');
  c.fillStyle = g; c.beginPath(); c.arc(120, 120, 116, 0, Math.PI * 2); c.fill();
  rysujIkone(c, 'jagody', 120, 128, 190);
})();

// pierwszy obraz za menu: kraina, w której ostatnio grano
(function start() {
  const id = zapis.ostatnia || 1;
  const k = KRAINY.find(x => x.id === id) || KRAINY[0];
  const z = zapis.gry[id];
  S = nowyStan(k);
  if (z) Object.assign(S, { zbudowane: [...(z.zbudowane || [])], zapasy: z.zapasy || {}, kasy: z.kasy || {}, gracz: z.gracz || [...k.start], palisada: z.palisada || [], warsztat: { ...S.warsztat, ...z.warsztat } });
  przeliczKlientow();
  zbudujSwiat();
  ustawKamere(0, true);
  pokazMenu();
  requestAnimationFrame(klatka);
})();

// gra działa też bez internetu (pomocnik z głównego folderu)
if ('serviceWorker' in navigator && window.top === window && /^https:|^http:\/\/(localhost|127\.0\.0\.1)/.test(location.href)) {
  navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
}
