// Yaceq Survival: modele 3D składane z prostych brył (bez plików graficznych).
import * as THREE from './three.module.min.js';

const MAT = {};
export function mat(kolor, opcje = {}) {
  const k = kolor + JSON.stringify(opcje);
  if (!MAT[k]) MAT[k] = new THREE.MeshLambertMaterial({ color: kolor, flatShading: true, ...opcje });
  return MAT[k];
}
const GEO = {};
function geo(k, f) { return GEO[k] || (GEO[k] = f()); }

function dodaj(g, mesh, x = 0, y = 0, z = 0) { mesh.position.set(x, y, z); g.add(mesh); return mesh; }
function box(w, h, d, kol) { return new THREE.Mesh(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), mat(kol)); }
function cyl(rt, rb, h, kol, seg = 10) { return new THREE.Mesh(geo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), mat(kol)); }
function sph(r, kol, wd = 10, wy = 8) { return new THREE.Mesh(geo(`s${r},${wd},${wy}`, () => new THREE.SphereGeometry(r, wd, wy)), mat(kol)); }
function ico(r, kol, det = 0) { return new THREE.Mesh(geo(`i${r},${det}`, () => new THREE.IcosahedronGeometry(r, det)), mat(kol)); }
function cone(r, h, kol, seg = 8) { return new THREE.Mesh(geo(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), mat(kol)); }
function dode(r, kol) { return new THREE.Mesh(geo(`d${r}`, () => new THREE.DodecahedronGeometry(r, 0)), mat(kol)); }
function okta(r, kol, opc) { return new THREE.Mesh(geo(`o${r}`, () => new THREE.OctahedronGeometry(r, 0)), mat(kol, opc)); }

export function cien(obj, rzuca = true) {
  obj.traverse(o => { if (o.isMesh) { o.castShadow = rzuca; o.receiveShadow = false; } });
  return obj;
}

// ---------------- postacie ----------------
export function osoba({ kurtka = '#ff8a3d', czapka = '#d6332b', pompon = '#ffffff', spodnie = '#384052', skora = '#f2c7a2', skala = 1, kaptur = false } = {}) {
  const g = new THREE.Group();
  const nogi = [], rece = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.name = 'noga' + nogi.length; piv.position.set(s * 0.14, 0.52, 0); g.add(piv);
    dodaj(piv, box(0.17, 0.5, 0.2, spodnie), 0, -0.25, 0);
    dodaj(piv, box(0.19, 0.12, 0.27, '#4a3324'), 0, -0.47, 0.03);
    nogi.push(piv);
  }
  dodaj(g, cyl(0.27, 0.36, 0.72, kurtka, 9), 0, 0.86, 0);
  dodaj(g, cyl(0.37, 0.37, 0.1, '#f4f1ea', 9), 0, 0.52, 0);
  dodaj(g, box(0.05, 0.5, 0.05, '#f4f1ea'), 0, 0.88, 0.31);
  dodaj(g, sph(0.27, skora), 0, 1.43, 0);
  for (const s of [-1, 1]) dodaj(g, sph(0.035, '#1d1d24', 6, 4), s * 0.1, 1.46, 0.24);
  dodaj(g, sph(0.05, '#ff9a8a', 6, 4), 0.15, 1.36, 0.2).scale.set(1, 0.6, 0.6);
  dodaj(g, sph(0.05, '#ff9a8a', 6, 4), -0.15, 1.36, 0.2).scale.set(1, 0.6, 0.6);
  if (kaptur) {
    const k = dodaj(g, new THREE.Mesh(geo('kapt', () => new THREE.SphereGeometry(0.33, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62)), mat(czapka)), 0, 1.45, -0.04);
    k.rotation.x = -0.35;
    dodaj(g, new THREE.Mesh(geo('futro', () => new THREE.TorusGeometry(0.27, 0.07, 6, 12)), mat('#f6f2e8')), 0, 1.47, 0.12);
  } else {
    dodaj(g, new THREE.Mesh(geo('czap', () => new THREE.SphereGeometry(0.29, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)), mat(czapka)), 0, 1.5, 0);
    dodaj(g, cyl(0.3, 0.3, 0.09, '#f4f1ea', 10), 0, 1.52, 0);
    dodaj(g, sph(0.1, pompon, 7, 5), 0, 1.81, 0);
  }
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.name = 'reka' + rece.length; piv.position.set(s * 0.36, 1.12, 0); g.add(piv);
    dodaj(piv, box(0.14, 0.5, 0.15, kurtka), 0, -0.22, 0);
    dodaj(piv, sph(0.08, '#3a4a6a', 6, 4), 0, -0.48, 0);
    rece.push(piv);
  }
  g.scale.setScalar(skala);
  g.userData = { rece };
  return cien(g);
}

export function koszyczek(skala = 1) {
  const g = new THREE.Group();
  dodaj(g, cyl(0.2, 0.15, 0.2, '#c48a4e', 9), 0, 0, 0);
  dodaj(g, cyl(0.21, 0.21, 0.04, '#9a6633', 9), 0, 0.1, 0);
  const u = dodaj(g, new THREE.Mesh(geo('ucho', () => new THREE.TorusGeometry(0.17, 0.025, 4, 10, Math.PI)), mat('#9a6633')), 0, 0.1, 0);
  dodaj(g, sph(0.16, '#33449e', 8, 4), 0, 0.08, 0).scale.set(1, 0.45, 1);
  g.scale.setScalar(skala);
  return cien(g);
}

// postać trzymająca koszyczek w prawej ręce
function siekiera() {
  const g = new THREE.Group();
  dodaj(g, box(0.07, 0.75, 0.07, '#8e5629'), 0, -0.3, 0);
  dodaj(g, box(0.06, 0.26, 0.32, '#b8c0cc'), 0, -0.62, 0.13);
  dodaj(g, box(0.07, 0.27, 0.06, '#e8edf3'), 0, -0.62, 0.3);
  return g;
}
function kilof() {
  const g = new THREE.Group();
  dodaj(g, box(0.07, 0.75, 0.07, '#8e5629'), 0, -0.3, 0);
  const o = dodaj(g, box(0.07, 0.09, 0.62, '#8d939d'), 0, -0.66, 0);
  o.rotation.x = 0.12;
  return g;
}
function narzedzia(reka, skala) {
  const k = koszyczek(1.1 * skala); k.position.set(0, -0.58, 0.12); k.name = 'narjagody'; reka.add(k);
  const s = siekiera(); s.scale.setScalar(skala); s.position.set(0, -0.5, 0); s.name = 'nardrewno'; s.visible = false; reka.add(s);
  const t = kilof(); t.scale.setScalar(skala); t.position.set(0, -0.5, 0); t.name = 'narkamien'; t.visible = false; reka.add(t);
}
export function gracz() {
  const g = osoba({ kurtka: '#ff7a2f', czapka: '#e0302a' });
  narzedzia(g.userData.rece[1], 1);
  g.userData = {};
  return g;
}

const KURTKI = ['#3d7bd9', '#2fa37a', '#d9446a', '#8a56d6', '#e0a12b', '#3aa6c9', '#c95a3a', '#5d6fd6'];
export function klient(i) {
  const g = osoba({ kurtka: KURTKI[i % KURTKI.length], czapka: KURTKI[(i + 3) % KURTKI.length], kaptur: i % 2 === 0, skala: 0.82 });
  g.userData = {};
  return g;
}
export function pomocnik() {
  const g = osoba({ kurtka: '#4caf50', czapka: '#ffd23f', pompon: '#4caf50', skala: 0.85 });
  narzedzia(g.userData.rece[1], 0.95);
  g.userData = {};
  return g;
}

// ---------------- zwierzęta (przodem do +z) ----------------
function czworonog(o) {
  const g = new THREE.Group(); const nogi = [];
  const s = o.s;
  dodaj(g, box(0.5 * s, 0.42 * s, 0.9 * s, o.kol), 0, 0.55 * s, 0);
  dodaj(g, box(0.36 * s, 0.3 * s, 0.3 * s, o.brzuch), 0, 0.5 * s, 0.36 * s);
  const glowa = new THREE.Group(); glowa.name = 'glowa'; glowa.position.set(0, 0.8 * s, 0.52 * s); g.add(glowa);
  dodaj(glowa, box(0.4 * s, 0.34 * s, 0.34 * s, o.kol), 0, 0, 0);
  const nos = dodaj(glowa, cone(0.13 * s, 0.32 * s, o.brzuch, 6), 0, -0.05 * s, 0.3 * s); nos.rotation.x = Math.PI / 2;
  dodaj(glowa, sph(0.045 * s, '#1b1b1f', 6, 4), 0, -0.05 * s, 0.46 * s);
  for (const x of [-1, 1]) {
    dodaj(glowa, cone(0.08 * s, 0.22 * s, o.kol, 4), x * 0.13 * s, 0.26 * s, -0.02 * s);
    dodaj(glowa, sph(0.035 * s, '#1b1b1f', 6, 4), x * 0.1 * s, 0.06 * s, 0.17 * s);
  }
  const ogon = new THREE.Group(); ogon.name = 'ogon'; ogon.position.set(0, 0.62 * s, -0.45 * s); g.add(ogon);
  const og = dodaj(ogon, cone(0.13 * s, 0.6 * s, o.kol, 6), 0, 0, -0.28 * s); og.rotation.x = -Math.PI / 2 - 0.4;
  dodaj(ogon, sph(0.09 * s, o.koniec, 6, 4), 0, 0.12 * s, -0.56 * s);
  for (const [x, z] of [[-0.17, 0.3], [0.17, 0.3], [-0.17, -0.3], [0.17, -0.3]]) {
    const piv = new THREE.Group(); piv.name = 'noga' + nogi.length; piv.position.set(x * s, 0.4 * s, z * s); g.add(piv);
    dodaj(piv, box(0.12 * s, 0.4 * s, 0.12 * s, o.lapy), 0, -0.2 * s, 0);
    nogi.push(piv);
  }
  g.userData = { wys: 1.2 * s };
  return cien(g);
}
function niedzwiedz() {
  const g = new THREE.Group(); const nogi = [];
  const t = dodaj(g, sph(0.6, '#f3f5f8', 10, 8), 0, 0.85, 0); t.scale.set(0.95, 0.8, 1.3);
  const glowa = new THREE.Group(); glowa.position.set(0, 1.05, 0.85); g.add(glowa);
  dodaj(glowa, sph(0.36, '#f3f5f8', 10, 8), 0, 0, 0);
  dodaj(glowa, sph(0.17, '#e7e9ee', 8, 6), 0, -0.08, 0.3).scale.set(1, 0.8, 1);
  dodaj(glowa, sph(0.07, '#1b1b1f', 6, 4), 0, -0.02, 0.45);
  for (const x of [-1, 1]) {
    dodaj(glowa, sph(0.1, '#f3f5f8', 6, 4), x * 0.24, 0.27, -0.02);
    dodaj(glowa, sph(0.04, '#1b1b1f', 6, 4), x * 0.13, 0.08, 0.31);
  }
  for (const [x, z] of [[-0.32, 0.45], [0.32, 0.45], [-0.32, -0.45], [0.32, -0.45]]) {
    const piv = new THREE.Group(); piv.name = 'noga' + nogi.length; piv.position.set(x, 0.6, z); g.add(piv);
    dodaj(piv, cyl(0.16, 0.18, 0.6, '#eceef3', 7), 0, -0.3, 0);
    nogi.push(piv);
  }
  g.userData = { wys: 1.9 };
  return cien(g);
}
function pingwin() {
  const g = new THREE.Group(); const nogi = [];
  const t = dodaj(g, sph(0.36, '#22252e', 10, 8), 0, 0.5, 0); t.scale.set(0.9, 1.3, 0.85);
  const b = dodaj(g, sph(0.3, '#f8f8f6', 10, 8), 0, 0.45, 0.1); b.scale.set(0.8, 1.15, 0.8);
  dodaj(g, sph(0.24, '#22252e', 10, 8), 0, 1.0, 0.02);
  const dz = dodaj(g, cone(0.07, 0.2, '#ff9b2f', 6), 0, 0.98, 0.3); dz.rotation.x = Math.PI / 2;
  for (const x of [-1, 1]) dodaj(g, sph(0.045, '#fff', 6, 4), x * 0.1, 1.06, 0.2);
  for (const x of [-1, 1]) {
    const piv = new THREE.Group(); piv.name = 'noga' + nogi.length; piv.position.set(x * 0.32, 0.7, 0); g.add(piv);
    const s = dodaj(piv, box(0.06, 0.45, 0.2, '#22252e'), 0, -0.2, 0); s.rotation.z = x * 0.2;
    nogi.push(piv);
    dodaj(g, box(0.14, 0.05, 0.2, '#ff9b2f'), x * 0.12, 0.03, 0.12);
  }
  g.userData = { wys: 1.4, skrzydla: true };
  return cien(g);
}
function yeti() {
  const g = new THREE.Group(); const nogi = [];
  const t = dodaj(g, ico(0.8, '#f4f6fb', 1), 0, 1.45, 0); t.scale.set(1, 1.15, 0.85);
  dodaj(g, ico(0.5, '#f4f6fb', 1), 0, 2.45, 0.1);
  const tw = dodaj(g, sph(0.33, '#8fa6c8', 10, 8), 0, 2.42, 0.38); tw.scale.set(1, 0.9, 0.6);
  for (const x of [-1, 1]) {
    dodaj(g, sph(0.07, '#ffffff', 6, 4), x * 0.13, 2.5, 0.55);
    dodaj(g, sph(0.035, '#16233a', 6, 4), x * 0.13, 2.5, 0.6);
    const r = dodaj(g, cone(0.09, 0.35, '#d9d2c2', 6), x * 0.38, 2.85, 0); r.rotation.z = -x * 0.5;
  }
  dodaj(g, box(0.3, 0.08, 0.05, '#2b3954'), 0, 2.27, 0.6);
  for (const x of [-1, 1]) {
    const piv = new THREE.Group(); piv.name = 'noga' + nogi.length; piv.position.set(x * 0.85, 1.95, 0); g.add(piv);
    const r = dodaj(piv, ico(0.28, '#eef1f8', 0), 0, -0.6, 0); r.scale.set(1, 2.4, 1);
    nogi.push(piv);
  }
  for (const x of [-1, 1]) {
    const piv = new THREE.Group(); piv.name = 'noga' + nogi.length; piv.position.set(x * 0.38, 0.75, 0); g.add(piv);
    const n = dodaj(piv, ico(0.3, '#eef1f8', 0), 0, -0.42, 0); n.scale.set(1, 1.6, 1);
    nogi.push(piv);
  }
  g.userData = { wys: 3.3 };
  return cien(g);
}
export function zwierze(typ) {
  if (typ === 'lis') return czworonog({ s: 1, kol: '#e7782d', brzuch: '#fff5ea', koniec: '#ffffff', lapy: '#3b2a22' });
  if (typ === 'wilk') return czworonog({ s: 1.35, kol: '#8c97a6', brzuch: '#d9dee6', koniec: '#5e6875', lapy: '#5e6875' });
  if (typ === 'niedzwiedz') return niedzwiedz();
  if (typ === 'pingwin') return pingwin();
  return yeti();
}

// ---------------- przyroda ----------------
export function sosna(igly = '#2d6c5c', wys = 1) {
  const g = new THREE.Group();
  dodaj(g, cyl(0.16, 0.22, 0.8, '#6b4630', 6), 0, 0.4, 0);
  const pk = [[1.25, 1.3, 1.1], [1.0, 1.15, 1.85], [0.72, 1.0, 2.55], [0.42, 0.8, 3.15]];
  for (const [r, h, y] of pk) {
    dodaj(g, cone(r, h, igly, 7), 0, y, 0);
    dodaj(g, cone(r * 0.72, h * 0.42, '#f7fbff', 7), 0, y + h * 0.3, 0);
  }
  g.scale.set(wys, wys, wys);
  return cien(g);
}
export function krzak() {
  const g = new THREE.Group();
  const lis = [[0, 0.45, 0, 0.55], [0.38, 0.38, 0.12, 0.42], [-0.36, 0.36, -0.08, 0.42], [0.05, 0.36, 0.38, 0.4], [-0.08, 0.72, -0.1, 0.38]];
  for (const [x, y, z, r] of lis) dodaj(g, ico(r, '#2f6b45', 0), x, y, z);
  for (const [x, y, z, r] of [[0, 0.95, -0.05, 0.26], [0.36, 0.7, 0.1, 0.18], [-0.32, 0.66, -0.08, 0.18]]) {
    dodaj(g, sph(r, '#f7fbff', 7, 4), x, y, z).scale.set(1, 0.45, 1);
  }
  const jagody = [];
  let i = 0;
  for (const [x, y, z] of [[0.3, 0.55, 0.45], [-0.25, 0.5, 0.48], [0.55, 0.35, 0.25], [-0.58, 0.32, 0.12], [0.1, 0.25, 0.68],
    [0.42, 0.62, -0.3], [-0.45, 0.6, -0.32], [0, 0.82, 0.32], [0.62, 0.48, -0.05], [-0.15, 0.3, -0.62]]) {
    const b = dodaj(g, sph(0.085, i % 3 ? '#2f3f9c' : '#4a5ec2', 6, 4), x, y, z);
    b.scale.set(1, 1.55, 1); b.rotation.z = (i - 5) * 0.12;
    b.name = 'cz'; jagody.push(b); i++;
  }
  return cien(g);
}
export function przerebel() {
  const g = new THREE.Group();
  const w = dodaj(g, new THREE.Mesh(geo('woda', () => new THREE.CircleGeometry(0.62, 14)), mat('#1f4f78')), 0, 0.03, 0);
  w.rotation.x = -Math.PI / 2; w.receiveShadow = true;
  const r = dodaj(g, new THREE.Mesh(geo('obrecz', () => new THREE.TorusGeometry(0.66, 0.13, 5, 14)), mat('#e9f5ff')), 0, 0.05, 0);
  r.rotation.x = -Math.PI / 2;
  const sp = new THREE.Group(); sp.name = 'splawik'; sp.position.set(0.15, 0.08, 0.1); g.add(sp);
  dodaj(sp, sph(0.09, '#e8392f', 7, 5), 0, 0.04, 0);
  dodaj(sp, sph(0.07, '#ffffff', 7, 5), 0, 0.12, 0);
  return g;
}
export function skala(rodzaj) {
  const g = new THREE.Group();
  const kol = rodzaj === 'wegla' ? '#4b4e57' : rodzaj === 'glaz' ? '#9aa1ab' : '#8d939d';
  const k = dodaj(g, dode(0.75, kol), 0, 0.5, 0); k.scale.set(1.1, 0.85, 1);
  const k2 = dodaj(g, dode(0.45, kol), 0.55, 0.3, 0.3);
  k2.rotation.y = 1;
  dodaj(g, sph(0.4, '#f7fbff', 7, 4), -0.1, 1.08, 0).scale.set(1, 0.35, 0.9);
  const grudki = [];
  for (const [x, y, z] of [[0.35, 0.65, 0.5], [-0.4, 0.55, 0.55], [0.1, 0.9, 0.42], [0.7, 0.45, 0.6], [-0.6, 0.38, 0.2], [0.2, 0.3, 0.8]]) {
    const gr = dodaj(g, rodzaj === 'wegla' ? dode(0.13, '#16161b') : rodzaj === 'glaz' ? dode(0.16, '#c3c9d2') : okta(0.12, '#ffcc33'), x, y, z);
    gr.name = 'cz'; grudki.push(gr);
  }
  return cien(g);
}
export function lod() {
  const g = new THREE.Group();
  dodaj(g, sph(0.6, '#f2f8ff', 8, 4), 0, 0.05, 0).scale.set(1.2, 0.3, 1.2);
  const kr = [];
  for (const [x, z, h, r] of [[0, 0, 1.4, 0.32], [0.35, 0.2, 1.0, 0.24], [-0.32, 0.18, 0.9, 0.22], [0.1, -0.35, 0.8, 0.2], [-0.2, -0.25, 1.1, 0.22]]) {
    const o = dodaj(g, okta(r, '#7fe0fb', { transparent: true, opacity: 0.88 }), x, h * 0.45, z);
    o.scale.set(1, h / r * 0.5, 1); o.rotation.y = x * 3;
    o.name = 'cz'; kr.push(o);
  }
  return cien(g);
}
export function zaspa(s = 1) {
  const m = sph(1, '#f7fbff', 9, 5); m.scale.set(1.6 * s, 0.35 * s, 1.1 * s); m.receiveShadow = true;
  return m;
}
export function kamyk(s = 1) { const m = dode(0.5 * s, '#9aa1ab'); m.scale.y = 0.7; return cien(m); }

// ---------------- przedmioty (do noszenia na plecach i na ladach) ----------------
const PRZ = {};
function nowyPrzedmiot(typ) {
  const g = new THREE.Group();
  let h = 0.25;
  if (typ === 'jagody') { const k = koszyczek(0.85); k.position.y = 0.08; g.add(k); h = 0.22; }
  else if (typ === 'dzem') {
    dodaj(g, cyl(0.15, 0.15, 0.22, '#5b2077', 9), 0, 0.11, 0);
    dodaj(g, cyl(0.16, 0.16, 0.06, '#e0413a', 9), 0, 0.25, 0);
    dodaj(g, box(0.2, 0.08, 0.02, '#fff6e6'), 0, 0.11, 0.15);
    h = 0.29;
  } else if (typ === 'ryba' || typ === 'wedzona') {
    const k = typ === 'ryba' ? ['#6fa8d6', '#3f78a8'] : ['#d48a3c', '#8f4f1c'];
    const b = dodaj(g, sph(0.2, k[0], 8, 6), 0, 0.11, 0); b.scale.set(0.75, 0.55, 1.6);
    const o = dodaj(g, cone(0.13, 0.2, k[1], 4), 0, 0.11, -0.36); o.rotation.x = Math.PI / 2;
    h = 0.22;
  } else if (typ === 'ruda') {
    dodaj(g, dode(0.2, '#8d939d'), 0, 0.15, 0);
    dodaj(g, okta(0.08, '#ffcc33'), 0.12, 0.2, 0.1);
    dodaj(g, okta(0.06, '#ffcc33'), -0.1, 0.25, 0.05);
    h = 0.3;
  } else if (typ === 'zloto') {
    dodaj(g, box(0.44, 0.15, 0.22, '#f2b51f'), 0, 0.08, 0);
    dodaj(g, box(0.36, 0.04, 0.15, '#ffe27a'), 0, 0.17, 0);
    h = 0.18;
  } else if (typ === 'wegiel') {
    dodaj(g, dode(0.19, '#26272d'), 0, 0.15, 0);
    dodaj(g, dode(0.12, '#3a3c45'), 0.12, 0.18, 0.06);
    h = 0.28;
  } else if (typ === 'krysztal') {
    const o = dodaj(g, okta(0.2, '#7fe0fb'), 0, 0.2, 0); o.scale.y = 1.3;
    h = 0.4;
  } else if (typ === 'drewno') {
    const b = dodaj(g, cyl(0.13, 0.13, 0.62, '#9a6236', 8), 0, 0.13, 0); b.rotation.z = Math.PI / 2;
    for (const x of [-0.315, 0.315]) { const c = dodaj(g, cyl(0.11, 0.11, 0.02, '#e3b47c', 8), x, 0.13, 0); c.rotation.z = Math.PI / 2; }
    h = 0.26;
  } else if (typ === 'kamien') {
    dodaj(g, box(0.42, 0.24, 0.3, '#a3a9b3'), 0, 0.12, 0);
    dodaj(g, box(0.3, 0.05, 0.22, '#c3c9d2'), 0.02, 0.26, 0);
    h = 0.27;
  } else if (typ === 'kasa') {
    dodaj(g, box(0.46, 0.07, 0.25, '#2f9b45'), 0, 0.035, 0);
    dodaj(g, box(0.47, 0.072, 0.06, '#d8f3dc'), 0, 0.035, 0);
    h = 0.08;
  }
  g.userData.h = h;
  return cien(g);
}
export function przedmiot(typ) {
  if (!PRZ[typ]) PRZ[typ] = nowyPrzedmiot(typ);
  const c = PRZ[typ].clone(); c.userData = { h: PRZ[typ].userData.h, typ };
  return c;
}
export function wysokosc(typ) { if (!PRZ[typ]) PRZ[typ] = nowyPrzedmiot(typ); return PRZ[typ].userData.h; }

// ---------------- budowle ----------------
export function lada(kolorDaszka = '#e0413a') {
  const g = new THREE.Group();
  dodaj(g, box(3, 0.16, 1.2, '#b9773f'), 0, 0.95, 0);
  dodaj(g, box(3, 0.85, 0.12, '#8e5629'), 0, 0.45, 0.55);
  dodaj(g, box(0.12, 0.85, 1.1, '#8e5629'), -1.44, 0.45, 0);
  dodaj(g, box(0.12, 0.85, 1.1, '#8e5629'), 1.44, 0.45, 0);
  // słupki i kolorowy szyld z tyłu, żeby nie zasłaniały towaru
  for (const x of [-1.4, 1.4]) dodaj(g, box(0.12, 1.4, 0.12, '#7a4520'), x, 1.7, -0.5);
  for (let i = 0; i < 6; i++) dodaj(g, box(0.48, 0.32, 0.08, i % 2 ? '#ffffff' : kolorDaszka), -1.2 + i * 0.48, 2.2, -0.5);
  dodaj(g, box(3.0, 0.08, 0.2, '#f7fbff'), 0, 2.4, -0.5);
  g.userData.blat = 1.03;
  return cien(g);
}
export function kuchnia() {
  const g = new THREE.Group();
  dodaj(g, cyl(1.15, 1.25, 0.5, '#8e939c', 10), 0, 0.25, 0);
  dodaj(g, cyl(0.85, 0.7, 0.75, '#33343c', 12), 0, 0.85, 0);
  const p = dodaj(g, cyl(0.8, 0.8, 0.05, '#6a2a8a', 12), 0, 1.2, 0);
  const ogien = new THREE.Group(); ogien.name = 'ogien'; g.add(ogien);
  for (const [x, z] of [[0.6, 0.6], [-0.6, 0.55], [0, 0.85]]) {
    dodaj(ogien, cone(0.18, 0.5, '#ff8a1f', 5), x, 0.65, z);
    dodaj(ogien, cone(0.1, 0.32, '#ffd23f', 5), x, 0.6, z + 0.05);
  }
  dodaj(g, box(0.08, 0.9, 0.08, '#7a4520'), 0.35, 1.55, 0).rotation.z = 0.4;
  p.name = 'pow';
  return cien(g);
}
export function wedzarnia() {
  const g = new THREE.Group();
  dodaj(g, box(2.2, 1.6, 1.8, '#8e5629'), 0, 0.8, -0.2);
  const d = dodaj(g, new THREE.Mesh(geo('dach3', () => new THREE.CylinderGeometry(1.45, 1.45, 2.3, 3)), mat('#5c3a24')), 0, 1.95, -0.2);
  d.rotation.z = Math.PI / 2; d.rotation.y = Math.PI / 2; d.scale.set(1, 1, 0.6);
  dodaj(g, box(0.4, 1.1, 0.4, '#8e939c'), 0.6, 2.6, -0.4);
  dodaj(g, box(1.6, 1.0, 0.1, '#2a1a10'), 0, 0.7, 0.71);
  for (const x of [-0.5, 0, 0.5]) dodaj(g, sph(0.12, '#d48a3c', 6, 4), x, 1.0, 0.8).scale.set(0.7, 1.8, 0.5);
  g.userData.dym = [0.6, 3.2, -0.4];
  return cien(g);
}
export function huta() {
  const g = new THREE.Group();
  dodaj(g, cyl(1.0, 1.25, 2.2, '#a4553a', 10), 0, 1.1, 0);
  dodaj(g, cone(1.05, 0.8, '#7c3b27', 10), 0, 2.6, 0);
  dodaj(g, cyl(0.25, 0.25, 1.2, '#5a5d66', 8), 0, 3.3, 0);
  const o = dodaj(g, box(0.8, 0.7, 0.2, '#ffb02e', ), 0, 0.7, 1.1);
  o.material = new THREE.MeshBasicMaterial({ color: '#ffa22e' });
  o.name = 'ogien'; g.userData.dym = [0, 4, 0];
  return cien(g);
}
export function kopalnia() {
  const g = new THREE.Group();
  const m = dodaj(g, sph(2.3, '#8d939d', 9, 6), 0, 0, -0.8); m.scale.set(1.2, 0.9, 1);
  dodaj(g, sph(1.5, '#f7fbff', 8, 4), 0, 1.75, -1.0).scale.set(1, 0.3, 0.9);
  dodaj(g, box(1.6, 1.6, 0.4, '#121318'), 0, 0.8, 1.15);
  for (const x of [-0.85, 0.85]) dodaj(g, box(0.22, 1.9, 0.22, '#8e5629'), x, 0.95, 1.3);
  dodaj(g, box(2.0, 0.24, 0.26, '#8e5629'), 0, 1.9, 1.3);
  return cien(g);
}
export function domek(kolor = '#d65a3a', sciana = '#c99a6b') {
  const g = new THREE.Group();
  dodaj(g, box(3, 2, 2.6, sciana), 0, 1, 0);
  const d = dodaj(g, new THREE.Mesh(geo('dach', () => new THREE.CylinderGeometry(1.95, 1.95, 3.4, 3)), mat(kolor)), 0, 2.55, 0);
  d.rotation.z = Math.PI / 2; d.rotation.y = 0; d.scale.set(0.62, 1, 1);
  const s = dodaj(g, new THREE.Mesh(geo('dachs', () => new THREE.CylinderGeometry(1.95, 1.95, 3.45, 3, 1, false, -0.35, 0.7)), mat('#f7fbff')), 0, 2.6, 0);
  s.rotation.z = Math.PI / 2; s.scale.set(0.62, 1, 1);
  dodaj(g, box(0.4, 1.0, 0.4, '#8e939c'), 0.9, 3.2, -0.4);
  dodaj(g, box(0.6, 1.1, 0.06, '#6b4024'), 0, 0.55, 1.31);
  for (const x of [-0.9, 0.9]) {
    const o = dodaj(g, box(0.55, 0.5, 0.06, '#ffd76a'), x, 1.25, 1.31);
    o.material = new THREE.MeshBasicMaterial({ color: '#ffd76a' });
  }
  g.userData.dym = [0.9, 3.8, -0.4];
  return cien(g);
}
export function armatka() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) dodaj(g, box(0.18, 1.8, 0.18, '#8e5629'), x, 0.9, z);
  dodaj(g, box(1.6, 0.2, 1.6, '#b9773f'), 0, 1.85, 0);
  dodaj(g, box(1.62, 0.06, 1.62, '#f7fbff'), 0, 1.97, 0);
  const lufa = new THREE.Group(); lufa.name = 'lufa'; lufa.position.set(0, 2.25, 0); g.add(lufa);
  dodaj(lufa, sph(0.32, '#4a6fa5', 8, 6), 0, 0, 0);
  const r = dodaj(lufa, cyl(0.16, 0.22, 0.9, '#3a5a8a', 8), 0, 0.15, 0.4); r.rotation.x = Math.PI / 2 - 0.35;
  dodaj(g, sph(0.14, '#ffffff', 6, 4), 0.45, 2.05, -0.4);
  dodaj(g, sph(0.14, '#ffffff', 6, 4), 0.25, 2.05, -0.5);
  return cien(g);
}
export function chatka() {
  const g = new THREE.Group();
  dodaj(g, box(2.2, 1.5, 1.9, '#9a6236'), 0, 0.75, 0);
  for (let i = 0; i < 4; i++) dodaj(g, cyl(0.1, 0.1, 2.25, '#7a4520', 6), 0, 0.2 + i * 0.38, 0.97).rotation.z = Math.PI / 2;
  const d = dodaj(g, new THREE.Mesh(geo('dach2', () => new THREE.CylinderGeometry(1.4, 1.4, 2.6, 3)), mat('#3f7f4f')), 0, 1.95, 0);
  d.rotation.z = Math.PI / 2; d.scale.set(0.6, 1, 1);
  dodaj(g, box(0.55, 0.9, 0.06, '#4a2c18'), 0, 0.45, 1.0);
  return cien(g);
}
export function warsztat() {
  const g = new THREE.Group();
  dodaj(g, box(2.8, 0.15, 2.0, '#8e5629'), 0, 0.07, 0);
  for (const [x, z] of [[-1.3, -0.9], [1.3, -0.9], [-1.3, 0.9], [1.3, 0.9]]) dodaj(g, box(0.16, 2.2, 0.16, '#7a4520'), x, 1.1, z);
  dodaj(g, box(3.0, 0.15, 2.3, '#4a6fa5'), 0, 2.25, 0);
  dodaj(g, box(3.05, 0.06, 2.35, '#f7fbff'), 0, 2.35, 0);
  dodaj(g, box(2.6, 1.2, 0.12, '#9a6236'), 0, 0.75, -0.9);
  dodaj(g, box(0.7, 0.35, 0.35, '#3a3c45'), -0.5, 0.8, 0);
  dodaj(g, box(0.3, 0.6, 0.3, '#5a5d66'), -0.5, 0.4, 0);
  dodaj(g, box(0.8, 0.5, 0.6, '#b9773f'), 0.7, 0.4, 0.1);
  return cien(g);
}
export function piec() {
  const g = new THREE.Group();
  dodaj(g, cyl(1.1, 1.3, 1.6, '#8e939c', 10), 0, 0.8, 0);
  dodaj(g, cyl(1.15, 1.15, 0.2, '#6c717b', 10), 0, 1.65, 0);
  dodaj(g, cyl(0.3, 0.3, 1.4, '#5a5d66', 8), 0, 2.4, -0.3);
  const o = dodaj(g, box(0.9, 0.6, 0.2, '#ff8a1f'), 0, 0.6, 1.15);
  o.material = new THREE.MeshBasicMaterial({ color: '#ff8a1f' });
  o.name = 'ogien'; g.userData.dym = [0, 3.2, -0.3];
  return cien(g);
}
export function cel(nr) {
  const g = new THREE.Group();
  if (nr === 1) { // Wielki Piec
    dodaj(g, cyl(1.9, 2.3, 2.6, '#8e939c', 12), 0, 1.3, 0);
    dodaj(g, cyl(1.5, 1.9, 1.4, '#a4553a', 12), 0, 3.3, 0);
    dodaj(g, cyl(0.5, 0.5, 2.2, '#5a5d66', 8), 0, 5, 0);
    const o = dodaj(g, box(1.5, 1.2, 0.3, '#ff8a1f'), 0, 1.0, 2.15); o.material = new THREE.MeshBasicMaterial({ color: '#ff8a1f' });
    o.name = 'ogien'; g.userData.dym = [0, 6.2, 0];
  } else if (nr === 2) { // Lodowa Latarnia
    dodaj(g, cyl(1.6, 2.0, 1.0, '#c9d6e6', 10), 0, 0.5, 0);
    dodaj(g, cyl(0.9, 1.3, 4.5, '#f2f6fb', 10), 0, 3.2, 0);
    for (let i = 0; i < 3; i++) dodaj(g, cyl(1.0 - i * 0.12, 1.05 - i * 0.12, 0.3, '#e0413a', 10), 0, 1.8 + i * 1.3, 0);
    const l = dodaj(g, sph(0.8, '#9ff3ff', 10, 8), 0, 6.0, 0); l.material = new THREE.MeshBasicMaterial({ color: '#9ff3ff' });
    dodaj(g, cone(1.0, 0.9, '#3a5a8a', 10), 0, 7.1, 0);
    l.name = 'swiatlo';
  } else if (nr === 3) { // Złota Brama
    for (const x of [-2, 2]) { dodaj(g, box(0.9, 4.5, 0.9, '#f2b51f'), x, 2.25, 0); dodaj(g, cone(0.7, 0.9, '#ffe27a', 4), x, 4.95, 0); }
    dodaj(g, box(5, 0.8, 0.9, '#e2a114'), 0, 4.1, 0);
    const s = dodaj(g, sph(0.6, '#ffe27a', 10, 8), 0, 5.0, 0); s.material = new THREE.MeshBasicMaterial({ color: '#ffe27a' });
    s.name = 'swiatlo';
  } else if (nr === 4) { // Kryształowy Pałac
    dodaj(g, cyl(2.2, 2.4, 0.6, '#c9d6e6', 10), 0, 0.3, 0);
    for (const [x, z, h] of [[0, 0, 5.5], [1.3, 0.6, 3.5], [-1.3, 0.6, 3.8], [0.9, -1.0, 3.0], [-1.0, -1.0, 3.2]]) {
      const o = dodaj(g, okta(0.7, '#7fe0fb', { transparent: true, opacity: 0.9 }), x, 0.6 + h * 0.5, z); o.scale.set(1, h / 1.4, 1);
    }
    const s = dodaj(g, sph(0.4, '#e8fbff', 8, 6), 0, 6.4, 0); s.material = new THREE.MeshBasicMaterial({ color: '#e8fbff' });
    s.name = 'swiatlo';
  } else if (nr === 5) { // Pomnik Yaceqa
    dodaj(g, box(3.2, 1.2, 3.2, '#8e939c'), 0, 0.6, 0);
    dodaj(g, box(2.6, 0.4, 2.6, '#a8aeb8'), 0, 1.4, 0);
    const p = osoba({ kurtka: '#f2b51f', czapka: '#f2b51f', pompon: '#ffe27a', spodnie: '#e2a114', skora: '#f2c84a', skala: 2.2 });
    p.position.y = 1.6; p.userData.rece[1].rotation.x = -2.6; p.userData = {}; g.add(p);
    const k = koszyczek(2.2); k.position.set(0.8, 6.0, 0.5); g.add(k);
  } else { // Wieża Zorzy
    dodaj(g, cyl(2.0, 2.4, 1.2, '#5a6478', 8), 0, 0.6, 0);
    dodaj(g, cyl(0.8, 1.4, 6.5, '#3e4a63', 8), 0, 4.4, 0);
    const kol = ['#62f0a8', '#5fd8f5', '#b57cff'];
    const sw = [];
    for (let i = 0; i < 3; i++) {
      const r = dodaj(g, new THREE.Mesh(new THREE.TorusGeometry(1.3 + i * 0.25, 0.12, 6, 20), new THREE.MeshBasicMaterial({ color: kol[i] })), 0, 6 + i * 0.9, 0);
      r.rotation.x = Math.PI / 2; r.name = 'pier'; sw.push(r);
    }
    const s = dodaj(g, sph(0.7, '#e8fbff', 10, 8), 0, 8.4, 0); s.material = new THREE.MeshBasicMaterial({ color: '#e8fbff' });
    s.name = 'swiatlo';
  }
  return cien(g);
}
export function wagonik() {
  const g = new THREE.Group();
  dodaj(g, box(0.9, 0.5, 1.2, '#6c717b'), 0, 0.5, 0);
  dodaj(g, box(0.95, 0.08, 1.25, '#4a4d55'), 0, 0.76, 0);
  for (const [x, z] of [[-0.45, -0.4], [0.45, -0.4], [-0.45, 0.4], [0.45, 0.4]]) {
    const k = dodaj(g, cyl(0.16, 0.16, 0.08, '#2b2c31', 8), x, 0.2, z); k.rotation.z = Math.PI / 2;
  }
  return cien(g);
}
export function tory(punkty) {
  const g = new THREE.Group();
  for (let i = 0; i < punkty.length - 1; i++) {
    const [ax, az] = punkty[i], [bx, bz] = punkty[i + 1];
    const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz), kat = Math.atan2(dx, dz);
    for (const s of [-0.4, 0.4]) {
      const sz = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, d), mat('#5a5d66'));
      sz.position.set((ax + bx) / 2 + Math.cos(kat) * s, 0.1, (az + bz) / 2 - Math.sin(kat) * s); sz.rotation.y = kat; g.add(sz);
    }
    for (let t = 0.3; t < d; t += 0.7) {
      const p = box(1.1, 0.06, 0.2, '#7a4520'); p.position.set(ax + dx * t / d, 0.04, az + dz * t / d); p.rotation.y = kat; g.add(p);
    }
  }
  return g;
}

// słupek palisady
export function slupki(dlugosc, mocna) {
  const g = new THREE.Group();
  const n = Math.max(2, Math.round(dlugosc / 0.42));
  for (let i = 0; i < n; i++) {
    const x = -dlugosc / 2 + (i + 0.5) * dlugosc / n;
    const h = 1.5 + ((i * 37) % 5) * 0.06;
    dodaj(g, cyl(0.19, 0.21, h, '#a8693a', 6), x, h / 2, 0);
    dodaj(g, cone(0.19, 0.35, '#c98a52', 6), x, h + 0.17, 0);
  }
  if (mocna) for (const y of [0.45, 1.15]) dodaj(g, box(dlugosc, 0.12, 0.46, '#5a5d66'), 0, y, 0);
  else dodaj(g, box(dlugosc, 0.1, 0.44, '#8e5629'), 0, 1.0, 0);
  return cien(g);
}

export { THREE };

// brama w palisadzie: dwa skrzydła na zawiasach (otwierają się do środka obozu)
export function brama(dlugosc, mocna) {
  const g = new THREE.Group();
  for (const x of [-dlugosc / 2, dlugosc / 2]) {
    dodaj(g, cyl(0.26, 0.28, 2.1, '#8e5629', 6), x, 1.05, 0);
    dodaj(g, cone(0.27, 0.4, '#c98a52', 6), x, 2.3, 0);
    dodaj(g, sph(0.2, '#f7fbff', 6, 4), x, 2.5, 0).scale.set(1, 0.5, 1);
  }
  const szer = dlugosc / 2 - 0.25;
  [-1, 1].forEach((s, i) => {
    const sk = new THREE.Group(); sk.name = 'skrz' + i; sk.position.set(s * (dlugosc / 2 - 0.22), 0, 0); g.add(sk);
    const n = 3;
    for (let j = 0; j < n; j++) dodaj(sk, box(szer / n - 0.03, 1.45, 0.14, '#b9773f'), -s * (szer * (j + 0.5) / n), 0.85, 0);
    for (const y of [0.35, 1.35]) dodaj(sk, box(szer, 0.13, 0.18, '#8e5629'), -s * szer / 2, y, 0);
    const k = Math.atan2(1.0, szer);
    const p1 = dodaj(sk, box(Math.hypot(szer, 1.0), 0.12, 0.2, mocna ? '#5a5d66' : '#a8432f'), -s * szer / 2, 0.85, 0);
    p1.rotation.z = s * k;
    dodaj(sk, box(szer, 0.08, 0.2, '#f7fbff'), -s * szer / 2, 1.6, 0);
  });
  return cien(g);
}

// taśmociąg z punktu a do b (na wysokości ok. 0.6)
export function tasmociag(ax, az, bx, bz) {
  const g = new THREE.Group();
  const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz), kat = Math.atan2(dx, dz);
  const t = new THREE.Group(); t.position.set((ax + bx) / 2, 0, (az + bz) / 2); t.rotation.y = kat; g.add(t);
  dodaj(t, box(0.8, 0.12, d + 0.4, '#2e3038'), 0, 0.58, 0);
  for (const s of [-1, 1]) dodaj(t, box(0.1, 0.22, d + 0.5, '#8e939c'), s * 0.45, 0.62, 0);
  for (let z = -d / 2; z <= d / 2 + 0.01; z += 0.45) {
    const w = dodaj(t, cyl(0.07, 0.07, 0.82, '#5a5d66', 6), 0, 0.5, z); w.rotation.z = Math.PI / 2;
  }
  for (let z = -d / 2; z <= d / 2 + 0.01; z += Math.max(1, d / 3)) for (const s of [-1, 1]) dodaj(t, box(0.1, 0.5, 0.1, '#5a5d66'), s * 0.38, 0.25, z);
  const pasy = new THREE.Group(); pasy.name = 'cz'; t.add(pasy);
  for (let z = -d / 2; z < d / 2; z += 0.3) dodaj(pasy, box(0.78, 0.02, 0.06, '#4a4d57'), 0, 0.65, z);
  return cien(g);
}

// ścinalne drzewo: pniak zostaje, korona (z pniem) przewraca się i odrasta
export function drzewo(igly = '#86bfe9') {
  const g = new THREE.Group();
  dodaj(g, cyl(0.24, 0.3, 0.35, '#7a4f32', 7), 0, 0.17, 0);
  dodaj(g, cyl(0.22, 0.22, 0.03, '#e3b47c', 7), 0, 0.36, 0);
  const k = new THREE.Group(); k.name = 'cz'; g.add(k);
  dodaj(k, cyl(0.16, 0.22, 0.8, '#6b4630', 6), 0, 0.4, 0);
  for (const [r, h, y] of [[1.15, 1.25, 1.1], [0.92, 1.1, 1.8], [0.66, 0.95, 2.45], [0.38, 0.75, 3.0]]) {
    dodaj(k, cone(r, h, igly, 7), 0, y, 0);
    dodaj(k, cone(r * 0.72, h * 0.42, '#f7fbff', 7), 0, y + h * 0.3, 0);
  }
  return cien(g);
}
// skład: drewniany podest z niskimi bokami
export function sklad(kolor = '#8e5629') {
  const g = new THREE.Group();
  dodaj(g, box(2.6, 0.14, 2.6, '#b9773f'), 0, 0.07, 0);
  for (const [x, z] of [[-1.25, -1.25], [1.25, -1.25], [-1.25, 1.25], [1.25, 1.25]]) dodaj(g, box(0.16, 0.9, 0.16, kolor), x, 0.45, z);
  for (const z of [-1.25, 1.25]) dodaj(g, box(2.6, 0.12, 0.1, kolor), 0, 0.7, z);
  dodaj(g, box(0.1, 0.12, 2.6, kolor), -1.25, 0.7, 0);
  return cien(g);
}
