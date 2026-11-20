// Age of Haskap II: modele 3D (własne, proste bryły). Każdy model to jedna bryła z kolorami w wierzchołkach,
// dzięki temu telefon rysuje setki postaci bez zwalniania.
import * as THREE from '../survival/three.module.min.js';

const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S3 = new THREE.Vector3(), P3 = new THREE.Vector3();
// jedna część modelu: bryła, kolor, położenie, obrót, skala
function cz(g, kolor, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  E.set(rx, ry, rz); Q.setFromEuler(E); P3.set(x, y, z); S3.set(sx, sy, sz);
  return { g, k: kolor, m: M4.clone().compose(P3, Q, S3) };
}
// skleja części w jedną bryłę z kolorami
export function polacz(czesci) {
  const pos = [], nor = [], col = [], c = new THREE.Color();
  for (const p of czesci) {
    const g = (p.g.index ? p.g.toNonIndexed() : p.g.clone()).applyMatrix4(p.m);
    c.set(p.k);
    const a = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < a.count; i++) {
      pos.push(a.getX(i), a.getY(i), a.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.r, c.g, c.b);
    }
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const cyl = (r1, r2, h, s = 8) => new THREE.CylinderGeometry(r1, r2, h, s);
const kula = (r, s = 8) => new THREE.SphereGeometry(r, s, Math.max(4, s - 2));
const stozek = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
const dach4 = (r, h) => new THREE.ConeGeometry(r, h, 4);

const SKORA = '#f1c193', BRAZ = '#7a4a26', DREWNO = '#b9864f', CIEMNE = '#4b3020', KAMIEN = '#9aa0a8', KAMIEN2 = '#7d838c', METAL = '#c9ced6', SLOMA = '#e3c56a';
export const KOLORY_STRON = ['#2f6fd6', '#d8382f'];
const CIEMNIEJ = ['#214f9c', '#9c2620'];

function cache(f) { const m = new Map(); return (...a) => { const k = a.join('|'); if (!m.has(k)) m.set(k, f(...a)); return m.get(k); }; }

// ---------- postacie (zaokrąglone, z twarzą) ----------
const kaps = (r, h, s = 8) => new THREE.CapsuleGeometry(r, h, 3, s);
const kulaG = (r, ws = 12, hs = 8) => new THREE.SphereGeometry(r, ws, hs);
const czapa = (r, th) => new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, th);
const WLOSY = ['#5b3a22', '#8a5a2b', '#2e2018', '#c98e4a'], OCZY = '#1d2330', POLICZKI = '#f29a8c', SPODNIE = '#6b4a30';
// głowa z oczami, noskiem, rumieńcami i włosami (patrzy w stronę +z)
function glowaZ(x, y, z, wlosy = WLOSY[0], r = 0.165) {
  return [
    cz(kulaG(r), SKORA, x, y, z),
    cz(czapa(r + 0.008, 1.25), wlosy, x, y + 0.004, z - 0.014),
    cz(kulaG(r * 0.15, 6, 4), OCZY, x - r * 0.35, y + r * 0.08, z + r * 0.9),
    cz(kulaG(r * 0.15, 6, 4), OCZY, x + r * 0.35, y + r * 0.08, z + r * 0.9),
    cz(kulaG(r * 0.17, 6, 4), '#e8a77a', x, y - r * 0.18, z + r * 1.0),
    cz(kulaG(r * 0.18, 6, 4), POLICZKI, x - r * 0.58, y - r * 0.25, z + r * 0.76, 0, 0, 0, 1, 0.6, 0.5),
    cz(kulaG(r * 0.18, 6, 4), POLICZKI, x + r * 0.58, y - r * 0.25, z + r * 0.76, 0, 0, 0, 1, 0.6, 0.5),
  ];
}
function nakrycie(rodzaj, k, ciemny, y = 0.9, z = 0) {
  if (rodzaj === 'kapelusz') return [cz(cyl(0.27, 0.27, 0.02, 16), SLOMA, 0, y + 0.1, z), cz(czapa(0.15, Math.PI / 2), SLOMA, 0, y + 0.1, z), cz(cyl(0.153, 0.153, 0.035, 14), k, 0, y + 0.125, z)];
  if (rodzaj === 'helm') return [cz(czapa(0.182, 1.5), METAL, 0, y + 0.005, z), cz(box(0.025, 0.06, 0.24), ciemny, 0, y + 0.17, z), cz(box(0.025, 0.09, 0.02), METAL, 0, y - 0.01, z + 0.175)];
  if (rodzaj === 'kaptur') return [cz(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, 1.95), ciemny, 0, y + 0.01, z - 0.03, -0.35, 0, 0)];
  return [];
}
// ludzik: buty, nogi, tunika z paskiem, ręce, głowa z twarzą; prawa ręka może być osobno (zbieracz)
function czlowiek(k, ciemny, glowa = 'kapelusz', prawa = true, wlosy = WLOSY[0]) {
  const c = [
    cz(kulaG(0.062, 8, 6), CIEMNE, -0.085, 0.045, 0.03, 0, 0, 0, 1, 0.7, 1.5), cz(kulaG(0.062, 8, 6), CIEMNE, 0.085, 0.045, 0.03, 0, 0, 0, 1, 0.7, 1.5),
    cz(kaps(0.058, 0.2), SPODNIE, -0.085, 0.2, 0), cz(kaps(0.058, 0.2), SPODNIE, 0.085, 0.2, 0),
    cz(cyl(0.16, 0.22, 0.2, 14), k, 0, 0.4, 0),
    cz(kaps(0.165, 0.2, 12), k, 0, 0.58, 0, 0, 0, 0, 1, 1, 0.85),
    cz(cyl(0.172, 0.172, 0.045, 14), BRAZ, 0, 0.47, 0, 0, 0, 0, 1, 1, 0.86),
    cz(kaps(0.05, 0.22), k, -0.215, 0.56, 0, 0, 0, -0.18), cz(kulaG(0.05, 8, 6), SKORA, -0.245, 0.4, 0.01),
    ...glowaZ(0, 0.9, 0, wlosy),
    ...nakrycie(glowa, k, ciemny),
  ];
  if (prawa) c.push(cz(kaps(0.05, 0.2), k, 0.225, 0.58, 0.05, -0.55, 0, 0.12), cz(kulaG(0.05, 8, 6), SKORA, 0.25, 0.47, 0.14));
  return c;
}
// zbieracz bez prawej ręki: ręka z narzędziem to osobna część, która się rusza (ramie3D)
export const osadnik = cache(strona => polacz(czlowiek(KOLORY_STRON[strona], CIEMNIEJ[strona], 'kapelusz', false, WLOSY[strona ? 2 : 1])));
// prawa ręka z narzędziem; punkt obrotu (0, 0, 0) to bark, ręka zwisa w dół, narzędzie wskazuje do przodu
// narzędzia: 'reka' (sama ręka), 'zrywa' (jagoda w dłoni), 'mlotek', 'siekiera', 'kilof'
export const ramie3D = cache((narz, strona) => {
  const k = KOLORY_STRON[strona], dl = -0.34;
  const c = [cz(kaps(0.05, 0.22), k, 0, -0.16, 0), cz(kulaG(0.052, 8, 6), SKORA, 0, dl, 0)];
  if (narz === 'zrywa') c.push(cz(kula(0.06, 6), '#3a4bb0', 0, dl - 0.02, 0.05));
  if (narz === 'mlotek') c.push(cz(cyl(0.022, 0.022, 0.34, 6), BRAZ, 0, dl, 0.15, Math.PI / 2, 0, 0), cz(box(0.07, 0.15, 0.08), '#555b63', 0, dl, 0.31));
  if (narz === 'siekiera') c.push(cz(cyl(0.022, 0.022, 0.55, 6), BRAZ, 0, dl, 0.22, Math.PI / 2, 0, 0), cz(box(0.03, 0.17, 0.12), METAL, 0, dl + 0.07, 0.44));
  if (narz === 'kilof') c.push(cz(cyl(0.022, 0.022, 0.55, 6), BRAZ, 0, dl, 0.22, Math.PI / 2, 0, 0), cz(box(0.04, 0.42, 0.05), '#555b63', 0, dl, 0.47), cz(stozek(0.03, 0.08, 4), METAL, 0, dl + 0.25, 0.47), cz(stozek(0.03, 0.08, 4), METAL, 0, dl - 0.25, 0.47, Math.PI, 0, 0));
  return polacz(c);
});
// koszyk przy lewym boku zbieracza (gdy zrywa jagody)
export const koszBok = cache(() => polacz([cz(cyl(0.13, 0.1, 0.16, 8), SLOMA, 0, 0, 0), cz(kula(0.1, 6), '#3a4bb0', 0, 0.07, 0, 0, 0, 0, 1, 0.45, 1), cz(box(0.02, 0.18, 0.2), SLOMA, 0, 0.12, 0)]));
export const kosz = cache(() => polacz([cz(cyl(0.16, 0.12, 0.18, 12), SLOMA, 0, 0, 0), cz(kulaG(0.12, 10, 6), '#3a4bb0', 0, 0.08, 0, 0, 0, 0, 1, 0.5, 1)]));
export const wojownik = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  return polacz([...czlowiek(k, d, 'helm'), cz(cyl(0.035, 0.07, 0.55), BRAZ, 0.3, 0.75, 0.12, 0.6, 0, 0), cz(cyl(0.2, 0.2, 0.05, 10), d, -0.27, 0.6, 0.06, 0, 0, Math.PI / 2), cz(kula(0.05, 6), METAL, -0.3, 0.6, 0.06)]);
});
export const wlocznik = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  return polacz([...czlowiek(k, d, 'helm'), cz(cyl(0.025, 0.025, 1.5), BRAZ, 0.27, 0.85, 0.05), cz(stozek(0.05, 0.18, 6), METAL, 0.27, 1.65, 0.05), cz(box(0.06, 0.4, 0.3), d, -0.27, 0.6, 0.05)]);
});
export const procarz = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  return polacz([...czlowiek(k, d, 'kaptur'), cz(cyl(0.012, 0.012, 0.5), BRAZ, 0.28, 0.85, 0.05, 0, 0, 0.4), cz(kula(0.06, 6), KAMIEN, 0.38, 1.08, 0.05), cz(box(0.16, 0.2, 0.1), BRAZ, -0.12, 0.5, -0.18)]);
});
export const tarczownik = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  return polacz([...czlowiek(k, d, 'helm'), cz(cyl(0.035, 0.035, 0.55), METAL, 0.3, 0.75, 0.12, 0.6, 0, 0), cz(box(0.07, 0.6, 0.45), d, -0.29, 0.6, 0.06), cz(cyl(0.08, 0.08, 0.08, 8), METAL, -0.34, 0.6, 0.06, 0, 0, Math.PI / 2)]);
});
export const obronca = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  return polacz([...czlowiek(METAL, d, 'helm'), cz(box(0.5, 0.18, 0.3), k, 0, 0.55, 0), cz(stozek(0.06, 0.25, 6), k, 0, 1.25, 0),
    cz(box(0.05, 0.75, 0.09), METAL, 0.3, 0.95, 0.14, 0.5, 0, 0), cz(box(0.2, 0.05, 0.08), BRAZ, 0.3, 0.62, 0.0, 0.5, 0, 0),
    cz(box(0.07, 0.62, 0.48), d, -0.29, 0.6, 0.06), cz(kula(0.1, 6), '#3a4bb0', -0.34, 0.65, 0.06)]);
});
export const pikinier = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  return polacz([...czlowiek(k, d, 'helm'), cz(cyl(0.025, 0.025, 2.0), BRAZ, 0.27, 1.05, 0.05), cz(stozek(0.06, 0.28, 6), METAL, 0.27, 2.17, 0.05), cz(box(0.06, 0.45, 0.32), d, -0.27, 0.6, 0.05)]);
});
export const procarz2 = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  return polacz([...czlowiek(k, d, 'kaptur'), cz(cyl(0.012, 0.012, 0.5), BRAZ, 0.28, 0.85, 0.05, 0, 0, 0.4), cz(kula(0.065, 6), '#3d4148', 0.38, 1.08, 0.05), cz(box(0.18, 0.22, 0.1), '#555b63', -0.12, 0.5, -0.18), cz(box(0.5, 0.06, 0.06), METAL, 0, 0.75, 0.13)]);
});
export const kusznik = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  return polacz([...czlowiek(k, d, 'helm'), cz(box(0.06, 0.06, 0.6), BRAZ, 0.22, 0.75, 0.25), cz(box(0.6, 0.04, 0.04), METAL, 0.22, 0.75, 0.48), cz(box(0.16, 0.36, 0.1), BRAZ, -0.12, 0.6, -0.2)]);
});
// jeźdźcy: renifer (lżejszy, rozgałęzione poroże) albo łoś (większy, łopaty poroża); zwierzęta zaokrąglone
function jazda(strona, zwierze, zbroja) {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  const los = zwierze === 'los', s = los ? 1.18 : 1, sierc = los ? '#5a3b25' : '#8d7a64', jasna = los ? '#7a5638' : '#efe7da', nogi = los ? '#3e2716' : '#6b5a48';
  const c = [
    cz(kaps(0.24 * s, 0.5 * s, 12), sierc, 0, 0.78 * s, -0.02, Math.PI / 2, 0, 0),
    cz(kulaG(0.2 * s, 10, 8), jasna, 0, 0.74 * s, 0.22 * s, 0, 0, 0, 1, 0.9, 1),
    cz(kaps(0.1 * s, 0.3 * s, 8), jasna, 0, 1.03 * s, 0.45 * s, -0.6, 0, 0),
    cz(kulaG(0.14 * s, 12, 8), sierc, 0, 1.22 * s, 0.62 * s, 0, 0, 0, 0.85, 0.9, 1.35),
    cz(kulaG(0.065 * s, 8, 6), los ? '#3b2618' : '#2a2a2a', 0, 1.18 * s, 0.8 * s),
    cz(kulaG(0.022, 6, 4), OCZY, -0.085 * s, 1.27 * s, 0.68 * s), cz(kulaG(0.022, 6, 4), OCZY, 0.085 * s, 1.27 * s, 0.68 * s),
    cz(kulaG(0.05, 6, 4), sierc, -0.12 * s, 1.32 * s, 0.53 * s, 0, 0, 0.7, 1, 0.5, 1.6), cz(kulaG(0.05, 6, 4), sierc, 0.12 * s, 1.32 * s, 0.53 * s, 0, 0, -0.7, 1, 0.5, 1.6),
    cz(kulaG(0.06, 6, 4), jasna, 0, 0.86 * s, -0.5 * s),
    cz(cyl(0.2, 0.24, 0.08, 12), k, 0, 1.02 * s, -0.05),
  ];
  for (const sx of [-0.13, 0.13]) for (const sz of [-0.32, 0.32]) c.push(cz(cyl(0.048 * s, 0.04 * s, 0.56 * s, 8), nogi, sx * s, 0.3 * s, sz * s), cz(cyl(0.052 * s, 0.052 * s, 0.06, 8), '#2a2a2a', sx * s, 0.03, sz * s));
  if (los) c.push(cz(kulaG(0.05, 6, 4), sierc, 0, 1.05 * s, 0.7 * s, 0, 0, 0, 1, 1.6, 1));
  const yr = 1.35 * s, zr = 0.6 * s;
  if (los) for (const sx of [-1, 1]) c.push(cz(cyl(0.025, 0.025, 0.3), '#d9c7a3', sx * 0.15, yr, zr, 0, 0, sx * 0.9), cz(kulaG(0.2, 8, 6), '#d9c7a3', sx * 0.36, yr + 0.15, zr - 0.02, 0, 0, sx * 0.25, 1, 0.18, 0.65));
  else for (const sx of [-1, 1]) c.push(cz(cyl(0.02, 0.02, 0.45), '#d9c7a3', sx * 0.12, yr + 0.15, zr - 0.05, -0.3, 0, sx * 0.5), cz(cyl(0.015, 0.015, 0.22), '#d9c7a3', sx * 0.22, yr + 0.3, zr + 0.06, 0.6, 0, sx * 0.3), cz(cyl(0.015, 0.015, 0.2), '#d9c7a3', sx * 0.27, yr + 0.36, zr - 0.12, -0.6, 0, sx * 0.6));
  // jeździec siedzi w siodle
  const b = 1.06 * s;
  c.push(cz(kaps(0.055, 0.22), SPODNIE, -0.2, b - 0.08, 0.05, 0.5, 0, -0.35), cz(kaps(0.055, 0.22), SPODNIE, 0.2, b - 0.08, 0.05, 0.5, 0, 0.35),
    cz(kaps(0.15, 0.16, 12), zbroja ? METAL : k, 0, b + 0.24, -0.04, 0, 0, 0, 1, 1, 0.85),
    cz(kaps(0.048, 0.2), zbroja ? METAL : k, -0.2, b + 0.22, 0.1, -0.9, 0, -0.2), cz(kulaG(0.048, 8, 6), SKORA, -0.22, b + 0.14, 0.24),
    ...glowaZ(0, b + 0.56, -0.02, WLOSY[strona ? 2 : 3], 0.15));
  if (zbroja) c.push(cz(czapa(0.166, 1.5), METAL, 0, b + 0.565, -0.02), cz(box(0.025, 0.06, 0.22), d, 0, b + 0.72, -0.02), cz(box(0.04, 0.35, 0.25), d, -0.25, b + 0.25, -0.05),
    cz(cyl(0.025, 0.025, 1.5), BRAZ, 0.24, b + 0.3, 0.25, Math.PI / 2 - 0.15, 0, 0), cz(stozek(0.045, 0.16, 6), METAL, 0.24, b + 0.41, 1.0, Math.PI / 2 - 0.15, 0, 0),
    cz(kaps(0.048, 0.2), METAL, 0.2, b + 0.22, 0.08, -0.9, 0, 0.2));
  else c.push(...nakrycie('kaptur', k, d, b + 0.56, -0.02), cz(kaps(0.048, 0.2), k, 0.2, b + 0.22, 0.08, -0.9, 0, 0.2), cz(cyl(0.02, 0.02, 0.7), BRAZ, 0.22, b + 0.3, 0.2, 1.0, 0, 0));
  return polacz(c);
}
export const zwiadowca = cache(strona => jazda(strona, 'renifer', false));
export const jezdziec = cache(strona => jazda(strona, 'renifer', true));
export const rycerz = cache(strona => jazda(strona, 'los', true));
export const katapulta = cache(strona => {
  const k = KOLORY_STRON[strona];
  const c = [cz(box(0.9, 0.15, 1.5), DREWNO, 0, 0.35, 0), cz(box(0.12, 0.8, 0.12), BRAZ, -0.3, 0.8, -0.1), cz(box(0.12, 0.8, 0.12), BRAZ, 0.3, 0.8, -0.1),
    cz(box(0.7, 0.1, 0.1), BRAZ, 0, 1.15, -0.1), cz(box(0.1, 0.1, 1.3), '#9a6a3a', 0, 0.75, 0.15, -0.5, 0, 0), cz(cyl(0.22, 0.18, 0.15, 10), BRAZ, 0, 1.08, 0.72),
    cz(kula(0.17, 8), '#a8c8ff', 0, 1.22, 0.72), cz(kula(0.07, 6), '#3a4bb0', 0.08, 1.3, 0.78), cz(box(0.92, 0.1, 0.3), k, 0, 0.5, -0.6)];
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) c.push(cz(cyl(0.2, 0.2, 0.1, 10), CIEMNE, sx, 0.2, sz, 0, 0, Math.PI / 2));
  return polacz(c);
});
export const taran = cache(strona => {
  const k = KOLORY_STRON[strona];
  const c = [cz(box(0.9, 0.12, 1.6), DREWNO, 0, 0.35, 0), cz(dach4(0.95, 0.7), k, 0, 1.05, 0, 0, Math.PI / 4, 0, 1, 1, 1.75),
    cz(cyl(0.13, 0.13, 1.9, 8), BRAZ, 0, 0.6, 0.15, Math.PI / 2, 0, 0), cz(cyl(0.17, 0.13, 0.25, 8), METAL, 0, 0.6, 1.15, Math.PI / 2, 0, 0)];
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) c.push(cz(cyl(0.2, 0.2, 0.1, 10), CIEMNE, sx, 0.2, sz, 0, 0, Math.PI / 2));
  for (const sx of [-0.4, 0.4]) for (const sz of [-0.7, 0.7]) c.push(cz(box(0.08, 0.7, 0.08), BRAZ, sx, 0.7, sz));
  return polacz(c);
});
// wóz kupiecki: renifer ciągnie wóz z plandeką w kolorze gracza i koszami jagód
export const woz = cache(strona => {
  const k = KOLORY_STRON[strona], DRZ = '#a87443', DRZ2 = '#8a5c32';
  const c = [cz(box(0.72, 0.1, 0.95), DRZ2, 0, 0.42, -0.35),
    cz(box(0.72, 0.22, 0.05), DRZ, 0, 0.58, 0.1), cz(box(0.72, 0.22, 0.05), DRZ, 0, 0.58, -0.8), cz(box(0.05, 0.22, 0.95), DRZ, 0.36, 0.58, -0.35), cz(box(0.05, 0.22, 0.95), DRZ, -0.36, 0.58, -0.35),
    cz(new THREE.CylinderGeometry(0.37, 0.37, 0.7, 12, 1, false, Math.PI / 2, Math.PI), k, 0, 0.68, -0.45, Math.PI / 2, 0, 0),
    cz(new THREE.CylinderGeometry(0.375, 0.375, 0.05, 12, 1, false, Math.PI / 2, Math.PI), '#f3efe6', 0, 0.68, -0.08, Math.PI / 2, 0, 0),
    cz(cyl(0.12, 0.1, 0.12, 8), SLOMA, -0.15, 0.53, 0.0), cz(kula(0.09, 6), '#3a4bb0', -0.15, 0.59, 0.0, 0, 0, 0, 1, 0.5, 1), cz(cyl(0.12, 0.1, 0.12, 8), SLOMA, 0.15, 0.53, 0.0), cz(kula(0.09, 6), '#3a4bb0', 0.15, 0.59, 0.0, 0, 0, 0, 1, 0.5, 1),
    cz(box(0.04, 0.04, 0.75), DRZ2, -0.22, 0.45, 0.45), cz(box(0.04, 0.04, 0.75), DRZ2, 0.22, 0.45, 0.45)];
  for (const sx of [-0.42, 0.42]) c.push(cz(cyl(0.21, 0.21, 0.06, 12), '#5a3518', sx, 0.21, -0.38, 0, 0, Math.PI / 2), cz(cyl(0.06, 0.06, 0.08, 8), METAL, sx, 0.21, -0.38, 0, 0, Math.PI / 2));
  // renifer
  const R = '#8d7a64', RJ = '#efe7da', z0 = 0.62;
  c.push(cz(kaps(0.15, 0.32, 10), R, 0, 0.55, z0, Math.PI / 2, 0, 0), cz(kaps(0.07, 0.2, 8), RJ, 0, 0.72, z0 + 0.25, -0.6, 0, 0),
    cz(kulaG(0.1, 10, 8), R, 0, 0.85, z0 + 0.38, 0, 0, 0, 0.85, 0.9, 1.3), cz(kulaG(0.045, 6, 4), '#2a2a2a', 0, 0.82, z0 + 0.52),
    cz(kulaG(0.018, 6, 4), OCZY, -0.06, 0.89, z0 + 0.44), cz(kulaG(0.018, 6, 4), OCZY, 0.06, 0.89, z0 + 0.44));
  for (const sx of [-1, 1]) c.push(cz(cyl(0.015, 0.015, 0.3, 4), '#d9c7a3', sx * 0.08, 1.02, z0 + 0.33, -0.3, 0, sx * 0.5), cz(cyl(0.012, 0.012, 0.15, 4), '#d9c7a3', sx * 0.15, 1.12, z0 + 0.4, 0.6, 0, sx * 0.3));
  for (const sx of [-0.08, 0.08]) for (const sz of [-0.2, 0.2]) c.push(cz(cyl(0.03, 0.026, 0.42, 6), '#6b5a48', sx, 0.21, z0 + sz));
  c.push(cz(box(0.3, 0.05, 0.08), k, 0, 0.7, z0 + 0.08));
  return polacz(c);
});
export const JEDNOSTKI3D = { osadnik, wojownik, tarczownik, obronca, wlocznik, pikinier, procarz, procarz2, kusznik, zwiadowca, jezdziec, rycerz, taran, katapulta, woz };

// ---------- budynki w stylu słowiańskim (nasze projekty; środek modelu = środek budynku, podłoga na y = 0) ----------
// kolor gracza widać na kalenicach, okiennicach i chorągiewkach; dachy są ze strzechy albo z gontu
const BAL = '#c08a52', BAL2 = '#a87443', STRZECHA = '#d4b265', STRZECHA2 = '#b8954c', GONT = '#7b5a3c', GONT2 = '#6a4c31', BIEL = '#efe6d2',
  SZYBA = '#ffe39a', CIEMNE_D = '#3a2a1a', SIANO = '#e2c76a', ZIEMIA = '#8b5a30', TRAWA = '#3e8e3e', OGIEN = '#ff8a2a';
const pryzma = new THREE.CylinderGeometry(1, 1, 1, 3, 1, false, Math.PI / 2);
// część obrócona wokół osi y całego budynku (np. dach z kalenicą wzdłuż z)
function obroc(czesci, ry, ox = 0, oz = 0) {
  const m = new THREE.Matrix4().makeTranslation(ox, 0, oz).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(new THREE.Matrix4().makeTranslation(-ox, 0, -oz));
  for (const p of czesci) p.m = m.clone().multiply(p.m);
  return czesci;
}
// ściany z bali (zrąb) od y0 do y0 + h; bale wystają na rogach
function zrab(cx, cz0, w, d, h, r = 0.06, y0 = 0, k1 = BAL, k2 = BAL2) {
  const c = [cz(box(w - 0.02, h, d - 0.02), BAL2, cx, y0 + h / 2, cz0)];
  const n = Math.max(2, Math.round(h / (2 * r)));
  for (let i = 0; i < n; i++) {
    const y = y0 + r + i * 2 * r, k = i % 2 ? k1 : k2;
    c.push(cz(cyl(r, r, w + 3 * r, 6), k, cx, y, cz0 + d / 2, 0, 0, Math.PI / 2), cz(cyl(r, r, w + 3 * r, 6), k, cx, y, cz0 - d / 2, 0, 0, Math.PI / 2));
    if (y + r < y0 + h + 0.001) c.push(cz(cyl(r, r, d + 3 * r, 6), i % 2 ? k2 : k1, cx + w / 2, y + r * 0.6, cz0, Math.PI / 2, 0, 0), cz(cyl(r, r, d + 3 * r, 6), i % 2 ? k2 : k1, cx - w / 2, y + r * 0.6, cz0, Math.PI / 2, 0, 0));
  }
  return c;
}
// dach dwuspadowy z kalenicą wzdłuż x; D = połowa głębokości razem z okapem; dW = głębokość ściany pod dachem (szczyt)
function dach(cx, cz0, yB, L, D, H, kolor, kalenica, dW = 0, kSzczytu = BAL, koniki = true) {
  const a = Math.atan2(H, D), S = Math.hypot(D, H) + 0.05;
  const c = [cz(box(L, 0.08, S), kolor, cx, yB + H / 2, cz0 + D / 2, a), cz(box(L, 0.08, S), kolor, cx, yB + H / 2, cz0 - D / 2, -a)];
  // dolna krawędź strzechy / gontu trochę ciemniejsza
  c.push(cz(box(L + 0.02, 0.05, 0.12), kolor === STRZECHA ? STRZECHA2 : GONT2, cx, yB + 0.02, cz0 + D - 0.04), cz(box(L + 0.02, 0.05, 0.12), kolor === STRZECHA ? STRZECHA2 : GONT2, cx, yB + 0.02, cz0 - D + 0.04));
  c.push(cz(box(L + 0.06, 0.1, 0.16), kalenica, cx, yB + H + 0.03, cz0));
  if (dW > 0) {
    const hW = H * (dW / 2) / D, yS = yB + H - hW;
    c.push(cz(pryzma, kSzczytu, cx, yS + hW / 3, cz0, 0, 0, Math.PI / 2, hW / 1.5 - 0.02, L - 0.1, dW / 1.732));
    // biała deska pod szczytem
    c.push(cz(box(0.04, 0.05, dW * 0.7), BIEL, cx + L / 2 - 0.04, yS + 0.04, cz0), cz(box(0.04, 0.05, dW * 0.7), BIEL, cx - L / 2 + 0.04, yS + 0.04, cz0));
  }
  if (koniki) for (const sx of [-1, 1]) {
    const x = cx + sx * (L / 2 + 0.02), y = yB + H + 0.12;
    c.push(cz(box(0.05, 0.42, 0.07), kalenica, x, y, cz0, 0.65, 0, 0), cz(box(0.05, 0.42, 0.07), kalenica, x, y, cz0, -0.65, 0, 0),
      cz(box(0.05, 0.1, 0.14), kalenica, x, y + 0.2, cz0 + 0.14), cz(box(0.05, 0.1, 0.14), kalenica, x, y + 0.2, cz0 - 0.14));
  }
  return c;
}
// okno z okiennicami w kolorze gracza (na ścianie od strony +z; ry obraca na inne ściany)
function okno(k, x, y, z, ry = 0, s = 1) {
  return obroc([cz(box(0.3 * s, 0.26 * s, 0.04), CIEMNE_D, x, y, z), cz(box(0.22 * s, 0.18 * s, 0.05), SZYBA, x, y, z + 0.005), cz(box(0.02, 0.18 * s, 0.06), CIEMNE_D, x, y, z + 0.01),
    cz(box(0.12 * s, 0.28 * s, 0.03), k, x - 0.22 * s, y, z + 0.02), cz(box(0.12 * s, 0.28 * s, 0.03), k, x + 0.22 * s, y, z + 0.02),
    cz(box(0.36 * s, 0.04, 0.08), BIEL, x, y - 0.15 * s, z + 0.03)], ry, x, z - 0.0);
}
function drzwi(x, y, z, w = 0.32, h = 0.55) {
  return [cz(box(w + 0.08, h + 0.06, 0.04), CIEMNE_D, x, y + h / 2, z), cz(box(w, h, 0.05), '#7a4a26', x, y + h / 2, z + 0.01),
    cz(box(0.02, h, 0.06), '#5a3518', x, y + h / 2, z + 0.02), cz(kula(0.025, 5), METAL, x + w * 0.3, y + h * 0.5, z + 0.04)];
}
function flaga(k, x, y, z, h = 1.0) { return [cz(cyl(0.03, 0.03, h), BRAZ, x, y + h / 2, z), cz(box(0.42, 0.26, 0.03), k, x + 0.23, y + h - 0.16, z), cz(kula(0.045, 6), '#f2c94c', x, y + h + 0.03, z)]; }
function plot(x0, z0, x1, z1, h = 0.4, kol = BAL2) {
  const c = [], d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(d / 0.32)), ry = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i <= n; i++) { const t = i / n; c.push(cz(cyl(0.03, 0.035, h, 5), kol, x0 + (x1 - x0) * t, h / 2, z0 + (z1 - z0) * t)); }
  for (const y of [h * 0.4, h * 0.8]) c.push(cz(cyl(0.02, 0.02, d, 5), kol, (x0 + x1) / 2, y, (z0 + z1) / 2, Math.PI / 2, ry, 0));
  return c;
}
function palisada(x0, z0, x1, z1, h = 0.8) {
  const c = [], d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(d / 0.14));
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, hh = h * (0.9 + (i % 3) * 0.06); c.push(cz(cyl(0.065, 0.07, hh, 6), i % 2 ? BAL : BAL2, x, hh / 2, z), cz(stozek(0.065, 0.14, 6), BAL2, x, hh + 0.07, z)); }
  return c;
}
function stosBali(cx, cz0, dl, r, rzedy, ry = 0, kol = '#9a6a3a') {
  const c = [];
  for (let rz = 0; rz < rzedy; rz++) for (let i = 0; i < rzedy - rz; i++) {
    const z = cz0 + (i - (rzedy - rz - 1) / 2) * r * 2.02, y = r + rz * r * 1.75;
    c.push(cz(cyl(r, r, dl, 7), i % 2 ? kol : '#8a5c32', cx, y, z, 0, 0, Math.PI / 2), cz(cyl(r * 0.8, r * 0.8, 0.01, 7), '#e0c08a', cx + dl / 2 + 0.003, y, z, 0, 0, Math.PI / 2));
  }
  return obroc(c, ry, cx, cz0);
}
function koszyk(x, z, s = 1) { return [cz(cyl(0.14 * s, 0.11 * s, 0.18 * s, 10), SLOMA, x, 0.09 * s, z), cz(kula(0.11 * s, 7), '#3a4bb0', x, 0.17 * s, z, 0, 0, 0, 1, 0.45, 1)]; }
function worek(x, z, ry = 0) { return [cz(kula(0.14, 7), '#d9c79e', x, 0.13, z, 0, ry, 0, 1, 1.1, 0.85), cz(cyl(0.04, 0.06, 0.06, 6), '#b9a77e', x, 0.29, z)]; }
function kamienie(x, z, n, s = 1, k1 = KAMIEN, k2 = KAMIEN2) {
  const c = [];
  for (let i = 0; i < n; i++) { const a = i * 2.4, rr = 0.1 + (i % 3) * 0.06; c.push(cz(new THREE.DodecahedronGeometry(0.12 * s), i % 2 ? k1 : k2, x + Math.cos(a) * rr * s, 0.08 * s + (i > 3 ? 0.12 * s : 0), z + Math.sin(a) * rr * s, a, a * 0.7, 0)); }
  return c;
}

const BUD = {
  // Dworek Jagodowy: dwór z bali na kamiennej podmurówce, ganek na słupach, wysoki dach z gontu, dzwonniczka
  ratusz(k, d) {
    const c = [cz(box(3.5, 0.26, 3.0), KAMIEN2, 0, 0.13, -0.25), cz(box(3.56, 0.06, 3.06), KAMIEN, 0, 0.27, -0.25),
      ...zrab(0, -0.3, 3.0, 2.3, 1.45, 0.085, 0.28),
      ...dach(0, -0.3, 1.68, 3.6, 1.55, 1.25, GONT, k, 2.3),
      // ganek
      cz(box(1.7, 0.14, 0.9), BAL2, 0, 0.35, 1.3), cz(box(0.5, 0.08, 0.3), KAMIEN, 0, 0.18, 1.85),
      ...dach(0, 1.3, 1.2, 1.9, 0.62, 0.36, GONT, k, 0, BAL, false),
      ...drzwi(0, 0.42, 0.86, 0.5, 0.8),
      cz(kula(0.1, 8), '#3a4bb0', -0.1, 1.33, 0.89), cz(kula(0.1, 8), '#3a4bb0', 0.1, 1.33, 0.89), cz(kula(0.1, 8), '#3a4bb0', 0, 1.49, 0.88), cz(box(0.18, 0.05, 0.05), TRAWA, 0.1, 1.62, 0.88, 0, 0, 0.5),
      ...okno(k, -1.05, 1.0, 0.87, 0, 1.1), ...okno(k, 1.05, 1.0, 0.87, 0, 1.1),
      ...okno(k, 1.53, 1.0, -0.3, Math.PI / 2, 1.1), ...okno(k, -1.53, 1.0, -0.3, -Math.PI / 2, 1.1),
      // dzwonniczka na dachu
      cz(box(0.6, 0.55, 0.6), BAL, 0, 3.1, -0.3), cz(box(0.36, 0.3, 0.62), CIEMNE_D, 0, 3.15, -0.3), cz(kula(0.1, 8), '#c9a227', 0, 3.1, -0.3),
      cz(dach4(0.55, 0.6), GONT, 0, 3.66, -0.3, 0, Math.PI / 4), cz(kula(0.06, 6), '#f2c94c', 0, 3.98, -0.3),
      ...flaga(k, 1.45, 0.4, 1.7, 1.6), ...flaga(k, -1.45, 0.4, 1.7, 1.6),
      ...koszyk(1.2, 1.5), ...koszyk(-1.2, 1.55, 0.9)];
    for (const x of [-0.75, 0.75]) for (const z of [0.95, 1.7]) c.push(cz(cyl(0.06, 0.07, 0.8, 8), BAL, x, 0.82, z), cz(box(0.16, 0.06, 0.16), BAL2, x, 1.23, z));
    c.push(cz(box(1.6, 0.06, 0.05), BAL2, 0, 0.75, 1.72), cz(box(0.6, 0.06, 0.05), BAL2, -0.45, 0.75, 1.72));
    return c;
  },
  // chatka: zrąb z bali, strzecha, okiennice, komin, drewutnia i ławka
  dom(k, d) {
    return [cz(box(1.5, 0.1, 1.3), KAMIEN2, 0, 0.05, -0.05),
      ...zrab(0, -0.05, 1.25, 1.05, 0.72, 0.06, 0.08),
      ...dach(0, -0.05, 0.78, 1.65, 0.78, 0.66, STRZECHA, k, 1.05),
      ...drzwi(0.28, 0.1, 0.49),
      ...okno(k, -0.28, 0.48, 0.49),
      ...okno(k, 0.64, 0.48, -0.05, Math.PI / 2, 0.8),
      cz(box(0.2, 0.55, 0.2), KAMIEN, -0.38, 1.25, -0.3), cz(box(0.24, 0.06, 0.24), KAMIEN2, -0.38, 1.54, -0.3),
      cz(box(0.5, 0.06, 0.16), BAL2, -0.42, 0.2, 0.75), cz(box(0.05, 0.18, 0.12), BAL2, -0.62, 0.09, 0.75), cz(box(0.05, 0.18, 0.12), BAL2, -0.22, 0.09, 0.75),
      ...stosBali(-0.82, -0.1, 0.32, 0.055, 3, Math.PI / 2),
      cz(box(0.25, 0.04, 0.2), KAMIEN, 0.28, 0.02, 0.7)];
  },
  // spichlerz na palach z kamiennymi grzybkami, drabina, kosze i worki
  spichlerz(k, d) {
    const c = [];
    for (const x of [-0.7, 0, 0.7]) for (const z of [-0.6, 0.45]) c.push(cz(cyl(0.07, 0.08, 0.45, 6), BAL2, x, 0.22, z), cz(cyl(0.13, 0.1, 0.07, 8), KAMIEN, x, 0.48, z));
    c.push(cz(box(1.75, 0.08, 1.35), BAL2, 0, 0.55, -0.08), ...zrab(0, -0.08, 1.6, 1.15, 0.85, 0.06, 0.59),
      ...dach(0, -0.08, 1.42, 2.1, 0.9, 0.8, STRZECHA, k, 1.15),
      ...drzwi(0.35, 0.6, 0.5, 0.36, 0.6), ...okno(k, -0.35, 1.05, 0.5, 0, 0.8));
    for (const s of [-1, 1]) c.push(cz(box(0.04, 0.85, 0.04), BAL2, 0.35 + s * 0.15, 0.36, 0.78, -0.35, 0, 0));
    for (let i = 0; i < 4; i++) c.push(cz(box(0.3, 0.03, 0.04), BAL, 0.35, 0.08 + i * 0.17, 0.92 - i * 0.06, -0.35, 0, 0));
    c.push(...koszyk(-0.55, 0.85), ...koszyk(-0.85, 0.7, 0.9), ...koszyk(-0.3, 1.05, 0.85), ...worek(0.95, 0.85), ...worek(1.15, 0.6, 0.5), ...flaga(k, -1.2, 0, -0.8, 1.3));
    return c;
  },
  // skład drewna (tartak): wiata na słupach, stosy bali, deski, kozioł z belką, pniak z siekierą
  tartak(k, d) {
    const c = [];
    for (const [x, z] of [[-1.15, -1.15], [1.15, -1.15], [-1.15, -0.1], [1.15, -0.1]]) c.push(cz(cyl(0.07, 0.08, 1.2, 6), BAL, x, 0.6, z));
    c.push(...dach(0, -0.62, 1.2, 2.6, 0.75, 0.45, GONT, k, 0, BAL, true));
    for (let i = 0; i < 6; i++) c.push(cz(box(2.0, 0.05, 0.22), i % 2 ? '#d4a76a' : '#c9995c', 0, 0.04 + i * 0.055, -0.95));
    for (let i = 0; i < 5; i++) c.push(cz(box(2.0, 0.05, 0.22), i % 2 ? '#d4a76a' : '#c9995c', 0, 0.04 + i * 0.055, -0.6));
    c.push(...stosBali(-0.45, 0.65, 1.3, 0.12, 3), ...stosBali(0.85, 0.75, 0.9, 0.1, 2, Math.PI / 2));
    // kozioł do piłowania z belką i piłą
    for (const x of [0.55, 1.05]) c.push(cz(box(0.05, 0.5, 0.05), BAL2, x, 0.22, 0.05, 0.45, 0, 0), cz(box(0.05, 0.5, 0.05), BAL2, x, 0.22, 0.05, -0.45, 0, 0));
    c.push(cz(cyl(0.1, 0.1, 0.9, 7), '#9a6a3a', 0.8, 0.45, 0.05, 0, 0, Math.PI / 2), cz(box(0.5, 0.12, 0.015), METAL, 0.8, 0.62, 0.05, 0, 0, 0.3), cz(box(0.08, 0.05, 0.03), BRAZ, 1.05, 0.7, 0.05));
    // pniak z siekierą i wióry
    c.push(cz(cyl(0.17, 0.19, 0.3, 9), '#7a5030', -1.05, 0.15, 1.0), cz(cyl(0.16, 0.16, 0.01, 9), '#e0c08a', -1.05, 0.305, 1.0),
      cz(cyl(0.02, 0.02, 0.38, 5), BRAZ, -1.0, 0.45, 1.02, 0, 0, -0.5), cz(box(0.03, 0.1, 0.13), METAL, -1.08, 0.32, 1.02, 0, 0, -0.5));
    for (let i = 0; i < 6; i++) c.push(cz(box(0.08, 0.015, 0.04), '#e0c08a', -0.85 + (i % 3) * 0.12, 0.01, 0.8 + Math.floor(i / 3) * 0.25, 0, i, 0));
    c.push(...flaga(k, 1.25, 0, -1.25, 1.4));
    return c;
  },
  // kamieniołom: bloki kamienia, szopka, żuraw z liną, taczka z kamieniami
  szopa(k, d) {
    const c = [cz(box(1.1, 0.75, 0.8), BAL2, -0.75, 0.38, -0.85), ...dach(-0.75, -0.85, 0.75, 1.3, 0.55, 0.4, GONT, k, 0.8),
      cz(box(0.5, 0.3, 0.5), KAMIEN, 0.6, 0.15, -0.8), cz(box(0.5, 0.3, 0.5), KAMIEN2, 1.1, 0.15, -0.85), cz(box(0.48, 0.28, 0.48), KAMIEN, 0.85, 0.44, -0.82, 0, 0.2, 0),
      cz(box(0.4, 0.25, 0.4), KAMIEN2, -0.9, 0.12, 0.35, 0, 0.4, 0), cz(box(0.36, 0.22, 0.36), KAMIEN, -0.55, 0.11, 0.6, 0, 0.9, 0),
      ...kamienie(0.2, 0.75, 7, 1.2)];
    // żuraw: trójnóg, belka, lina, wiszący blok
    c.push(cz(cyl(0.04, 0.05, 1.7, 6), BAL, 0.75, 0.8, 0.2, 0.25, 0, 0.2), cz(cyl(0.04, 0.05, 1.7, 6), BAL, 1.05, 0.8, 0.0, -0.1, 0, -0.25), cz(cyl(0.04, 0.05, 1.7, 6), BAL, 0.6, 0.8, -0.1, -0.3, 0, 0.05),
      cz(cyl(0.035, 0.035, 1.4, 6), BAL2, 0.55, 1.62, 0.35, 0, 0, Math.PI / 2 - 0.25), cz(cyl(0.01, 0.01, 0.8, 4), '#d9c79e', 0.05, 1.2, 0.35), cz(box(0.25, 0.2, 0.25), KAMIEN, 0.05, 0.72, 0.35));
    // taczka
    c.push(cz(box(0.35, 0.15, 0.45), BAL2, -0.15, 0.25, 1.05), cz(cyl(0.1, 0.1, 0.05, 10), CIEMNE, -0.15, 0.1, 1.33, 0, 0, Math.PI / 2), cz(box(0.03, 0.03, 0.5), BAL2, -0.27, 0.22, 0.75), cz(box(0.03, 0.03, 0.5), BAL2, -0.03, 0.22, 0.75),
      ...kamienie(-0.15, 1.05, 3, 0.6), ...flaga(k, -1.25, 0, 0.0, 1.3));
    return c;
  },
  // kopalnia rudy: skalny pagórek, wejście w drewnianej ramie, tory z wózkiem, latarnia, kupka rudy
  kopalnia(k, d) {
    const c = [];
    for (const [x, z, s] of [[-0.6, -0.8, 0.75], [0.3, -0.95, 0.7], [0.95, -0.5, 0.55], [-1.05, -0.2, 0.5], [-0.2, -0.55, 0.6]]) c.push(cz(new THREE.DodecahedronGeometry(s), x > 0 ? '#7d7369' : '#8a8178', x, s * 0.55, z, x, z, 0, 1, 0.8, 1));
    c.push(cz(box(0.75, 0.75, 0.3), '#1b1714', 0, 0.38, -0.1), cz(box(0.1, 0.85, 0.12), BAL, -0.42, 0.42, 0.02), cz(box(0.1, 0.85, 0.12), BAL, 0.42, 0.42, 0.02), cz(box(1.0, 0.12, 0.16), BAL2, 0, 0.88, 0.02),
      cz(box(0.4, 0.14, 0.03), BAL, 0, 1.05, 0.05), cz(kula(0.05, 6), '#c4622d', -0.1, 1.05, 0.08), cz(kula(0.05, 6), '#c4622d', 0.1, 1.05, 0.08));
    for (const x of [-0.18, 0.18]) c.push(cz(box(0.04, 0.03, 1.4), METAL, x, 0.02, 0.6));
    for (let i = 0; i < 6; i++) c.push(cz(box(0.5, 0.025, 0.07), BAL2, 0, 0.01, 0.0 + i * 0.24));
    c.push(cz(box(0.42, 0.25, 0.5), '#555b63', 0, 0.25, 0.85), cz(cyl(0.07, 0.07, 0.5, 8), CIEMNE, 0, 0.08, 0.7, 0, 0, Math.PI / 2), cz(cyl(0.07, 0.07, 0.5, 8), CIEMNE, 0, 0.08, 1.0, 0, 0, Math.PI / 2),
      ...kamienie(0, 0.85, 4, 0.5, '#c4622d', '#7b5a4a').map(p => { p.m.premultiply(new THREE.Matrix4().makeTranslation(0, 0.3, 0)); return p; }),
      ...kamienie(0.85, 0.75, 6, 0.9, '#c4622d', '#7b5a4a'),
      cz(cyl(0.035, 0.04, 1.1, 6), BAL2, -0.75, 0.55, 0.65), cz(box(0.16, 0.2, 0.16), CIEMNE_D, -0.75, 1.0, 0.75), cz(kula(0.06, 6), SZYBA, -0.75, 0.98, 0.75),
      ...flaga(k, 1.15, 0, 0.3, 1.2));
    return c;
  },
  // plantacja haskapu: grządki, krzaki przy palikach, płotek z wikliny, strach na wróble
  pole(k, d) {
    const c = [cz(box(2.9, 0.06, 2.9), ZIEMIA, 0, 0.03, 0)];
    for (let i = -1; i <= 1; i++) {
      c.push(cz(box(0.5, 0.06, 2.6), '#7a4d27', i * 0.9, 0.08, 0));
      for (let j = -1; j <= 1; j++) {
        const x = i * 0.9, z = j * 0.85;
        c.push(cz(kula(0.26, 7), TRAWA, x, 0.3, z, 0, 0, 0, 1, 0.8, 1), cz(kula(0.18, 6), '#4ea055', x + 0.1, 0.42, z + 0.05), cz(cyl(0.015, 0.015, 0.6, 4), BAL2, x - 0.18, 0.3, z));
        for (const [dx, dy, dz] of [[0.14, 0.42, 0.16], [-0.12, 0.36, 0.18], [0.02, 0.52, -0.12], [0.2, 0.3, -0.08]]) c.push(cz(kula(0.05, 5), '#3a4bb0', x + dx, dy, z + dz, 0, 0, 0, 0.8, 1.3, 0.8));
      }
    }
    c.push(...plot(-1.4, -1.4, 1.4, -1.4, 0.32), ...plot(-1.4, -1.4, -1.4, 1.4, 0.32));
    // strach na wróble
    c.push(cz(cyl(0.025, 0.025, 0.9, 5), BAL2, 1.25, 0.45, -1.2), cz(cyl(0.02, 0.02, 0.6, 5), BAL2, 1.25, 0.72, -1.2, 0, 0, Math.PI / 2), cz(kula(0.1, 7), SIANO, 1.25, 0.98, -1.2),
      cz(cyl(0.16, 0.16, 0.02, 10), SLOMA, 1.25, 1.06, -1.2), cz(box(0.22, 0.28, 0.08), k, 1.25, 0.66, -1.2));
    return c;
  },
  // Strażnica Krzaka: długa izba z bali, palisada, stojak z włóczniami, kukła do ćwiczeń, chorągiew
  koszary(k, d) {
    const c = [cz(box(2.5, 0.1, 1.6), KAMIEN2, -0.1, 0.05, -0.55), ...zrab(-0.1, -0.55, 2.3, 1.35, 0.95, 0.07, 0.1),
      ...dach(-0.1, -0.55, 1.05, 2.6, 0.95, 0.75, GONT, k, 1.35),
      ...drzwi(-0.1, 0.1, 0.13, 0.42, 0.65), ...okno(k, -0.75, 0.62, 0.13), ...okno(k, 0.55, 0.62, 0.13),
      cz(cyl(0.2, 0.2, 0.04, 14), k, -0.1, 0.95, 0.15, Math.PI / 2, 0, 0), cz(cyl(0.07, 0.07, 0.05, 10), METAL, -0.1, 0.95, 0.17, Math.PI / 2, 0, 0),
      ...palisada(-1.35, 0.45, -1.35, 1.3, 0.8), ...palisada(-1.35, 1.3, -0.5, 1.3, 0.8)];
    // stojak z włóczniami
    c.push(cz(box(0.6, 0.05, 0.06), BAL2, 0.75, 0.55, 0.6), cz(box(0.05, 0.6, 0.05), BAL2, 0.47, 0.3, 0.6), cz(box(0.05, 0.6, 0.05), BAL2, 1.03, 0.3, 0.6));
    for (let i = 0; i < 4; i++) c.push(cz(cyl(0.015, 0.015, 1.0, 4), BAL, 0.57 + i * 0.12, 0.5, 0.62, 0.12, 0, 0), cz(stozek(0.03, 0.1, 4), METAL, 0.57 + i * 0.12, 1.0, 0.68, 0.12, 0, 0));
    // kukła ze słomy
    c.push(cz(cyl(0.03, 0.03, 1.0, 5), BAL2, 0.35, 0.5, 1.15), cz(kula(0.17, 7), SIANO, 0.35, 0.75, 1.15, 0, 0, 0, 1, 1.4, 1), cz(kula(0.1, 7), SIANO, 0.35, 1.05, 1.15), cz(cyl(0.02, 0.02, 0.5, 5), BAL2, 0.35, 0.82, 1.15, 0, 0, Math.PI / 2));
    c.push(...flaga(k, 1.2, 0, -0.1, 1.9));
    return c;
  },
  // strzelnica: chatka, tarcze na snopkach słomy, płotek, ławka
  strzelnica(k, d) {
    const c = [...zrab(-0.6, -0.75, 1.3, 1.0, 0.75, 0.06, 0), ...dach(-0.6, -0.75, 0.75, 1.6, 0.72, 0.6, STRZECHA, k, 1.0),
      ...drzwi(-0.35, 0, -0.24), ...okno(k, -0.95, 0.45, -0.24, 0, 0.8)];
    for (const [x, z] of [[0.45, 0.85], [1.05, 0.55]]) c.push(cz(box(0.5, 0.35, 0.3), SIANO, x, 0.18, z), cz(cyl(0.24, 0.24, 0.04, 16), '#f3efe6', x, 0.62, z, Math.PI / 2, 0, 0),
      cz(cyl(0.16, 0.16, 0.045, 16), '#d8382f', x, 0.62, z + 0.003, Math.PI / 2, 0, 0), cz(cyl(0.07, 0.07, 0.05, 12), '#f3efe6', x, 0.62, z + 0.006, Math.PI / 2, 0, 0), cz(box(0.04, 0.3, 0.04), BAL2, x, 0.42, z - 0.05));
    c.push(...plot(-1.35, 0.25, -1.35, 1.35, 0.35), cz(box(0.7, 0.05, 0.18), BAL2, -0.6, 0.22, 0.6), cz(box(0.05, 0.2, 0.15), BAL2, -0.88, 0.1, 0.6), cz(box(0.05, 0.2, 0.15), BAL2, -0.32, 0.1, 0.6),
      ...kamienie(-0.45, 0.95, 4, 0.5), ...flaga(k, 1.25, 0, -1.1, 1.4));
    return c;
  },
  // Zagroda reniferów: obora z bali, ogrodzony wybieg, stóg siana, koryto, poroże nad drzwiami
  stajnia(k, d) {
    const c = [...zrab(0, -0.85, 2.1, 1.0, 0.85, 0.065, 0), ...dach(0, -0.85, 0.85, 2.4, 0.72, 0.62, STRZECHA, k, 1.0),
      cz(box(0.7, 0.7, 0.05), CIEMNE_D, 0, 0.35, -0.33), cz(box(0.05, 0.7, 0.06), BAL, 0, 0.35, -0.31), cz(box(0.7, 0.05, 0.06), BAL, 0, 0.35, -0.31, 0, 0, 0.78),
      ...okno(k, 0.75, 0.5, -0.33, 0, 0.8), ...okno(k, -0.75, 0.5, -0.33, 0, 0.8),
      ...plot(-1.35, -0.2, -1.35, 1.35, 0.42), ...plot(-1.35, 1.35, 1.35, 1.35, 0.42), ...plot(1.35, 1.35, 1.35, -0.2, 0.42)];
    for (const sx of [-1, 1]) c.push(cz(cyl(0.018, 0.018, 0.35, 4), '#d9c7a3', sx * 0.12, 0.92, -0.3, 0, 0, sx * 0.6), cz(cyl(0.015, 0.015, 0.18, 4), '#d9c7a3', sx * 0.22, 1.04, -0.3, 0, 0, sx * 0.1));
    c.push(cz(kula(0.4, 8), SIANO, 0.8, 0.3, 0.7, 0, 0, 0, 1, 0.8, 1), cz(kula(0.25, 7), '#ecd47e', 0.75, 0.55, 0.65),
      cz(box(0.6, 0.15, 0.22), BAL2, -0.6, 0.18, 0.75), cz(box(0.52, 0.04, 0.15), '#7fb5e8', -0.6, 0.25, 0.75), ...flaga(k, -1.2, 0, -1.25, 1.3));
    return c;
  },
  // kuźnia: kamienno-drewniana, otwarta z przodu, kamienny komin z ogniem, kowadło na pniaku, koryto z wodą
  kuznia(k, d) {
    const c = [cz(box(2.2, 0.85, 0.3), KAMIEN, 0, 0.42, -1.05), cz(box(0.3, 0.85, 1.4), KAMIEN2, -1.0, 0.42, -0.45),
      ...dach(0, -0.35, 0.85, 2.5, 1.0, 0.6, GONT, k, 0, BAL, true)];
    for (const x of [1.05, 0.0]) c.push(cz(cyl(0.07, 0.08, 0.85, 6), BAL, x, 0.42, 0.45));
    c.push(cz(box(0.7, 0.45, 0.6), KAMIEN2, 0.55, 0.22, -0.65), cz(box(0.45, 0.06, 0.4), OGIEN, 0.55, 0.46, -0.6), cz(kula(0.12, 6), '#ffd36b', 0.55, 0.5, -0.6, 0, 0, 0, 1.4, 0.5, 1.2),
      cz(box(0.45, 1.6, 0.45), KAMIEN, 0.75, 1.2, -0.95), cz(box(0.52, 0.08, 0.52), KAMIEN2, 0.75, 2.0, -0.95),
      cz(cyl(0.16, 0.19, 0.32, 8), '#7a5030', -0.2, 0.16, 0.2), cz(box(0.36, 0.12, 0.16), '#4a4f57', -0.2, 0.38, 0.2), cz(box(0.16, 0.1, 0.12), '#4a4f57', -0.4, 0.37, 0.2), cz(box(0.2, 0.08, 0.1), '#4a4f57', -0.2, 0.28, 0.2),
      cz(box(0.6, 0.22, 0.28), BAL2, -0.75, 0.11, 0.8), cz(box(0.52, 0.04, 0.2), '#7fb5e8', -0.75, 0.2, 0.8),
      cz(box(0.3, 0.2, 0.25), '#7a4a26', 0.1, 0.3, -0.7, 0, 0, 0.2));
    for (let i = 0; i < 3; i++) c.push(cz(box(0.04, 0.3, 0.02), BRAZ, -0.5 + i * 0.18, 0.62, -0.88), cz(box(0.1, 0.06, 0.03), METAL, -0.5 + i * 0.18, 0.48, -0.87));
    c.push(cz(new THREE.TorusGeometry(0.1, 0.025, 5, 10, Math.PI * 1.3), METAL, 1.05, 0.95, 0.55, 0, 0, Math.PI * 0.85), ...flaga(k, -1.25, 0, 0.9, 1.3));
    return c;
  },
  // Ambona: drewniana wieża na czterech nogach z bali, krzyżulce, pomost z barierką, daszek z gontu, drabina
  wieza(k, d) {
    const c = [], h = 2.5;
    for (const [x, z] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) c.push(cz(cyl(0.08, 0.1, h, 7), BAL, x * 0.9, h / 2, z * 0.9, z * 0.06, 0, -x * 0.06), cz(cyl(0.11, 0.12, 0.12, 7), KAMIEN, x * 0.95, 0.06, z * 0.95));
    for (const y of [0.8, 1.7]) for (const [a, b, ry] of [[0, 0.5, 0], [0, -0.5, 0], [0.5, 0, Math.PI / 2], [-0.5, 0, Math.PI / 2]]) {
      c.push(cz(box(0.04, 0.95, 0.05), BAL2, a, y, b, 0, ry, 0.85), cz(box(0.04, 0.95, 0.05), BAL2, a, y, b, 0, ry, -0.85));
    }
    c.push(cz(box(1.4, 0.1, 1.4), BAL2, 0, h, 0));
    for (const [a, b, ry] of [[0, 0.68, 0], [0, -0.68, 0], [0.68, 0, Math.PI / 2], [-0.68, 0, Math.PI / 2]]) c.push(cz(box(1.4, 0.06, 0.05), BAL, a, h + 0.4, b, 0, ry, 0), cz(box(1.4, 0.28, 0.03), BAL2, a, h + 0.18, b, 0, ry, 0));
    for (const [x, z] of [[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]]) c.push(cz(cyl(0.04, 0.04, 0.85, 5), BAL, x, h + 0.42, z));
    c.push(cz(dach4(1.15, 0.65), GONT, 0, h + 1.15, 0, 0, Math.PI / 4), cz(box(0.16, 0.16, 0.16), k, 0, h + 1.5, 0), ...flaga(k, 0, h + 1.5, 0, 0.7));
    for (const s of [-1, 1]) c.push(cz(box(0.04, h + 0.1, 0.04), BAL2, s * 0.16, h / 2, 0.82, -0.12, 0, 0));
    for (let i = 0; i < 8; i++) c.push(cz(box(0.32, 0.03, 0.04), BAL, 0, 0.2 + i * 0.3, 0.86 - i * 0.036));
    return c;
  },
  // Wieża z cegły: kwadratowa, z cegły z jaśniejszymi pasami, blanki, drewniany daszek, okienka strzelnicze
  wieza2(k, d) {
    const CEG = '#b5553a', CEG2 = '#9c4630', c = [cz(box(1.5, 0.3, 1.5), KAMIEN2, 0, 0.15, 0)];
    for (let i = 0; i < 9; i++) c.push(cz(box(1.25 - i * 0.012, 0.3, 1.25 - i * 0.012), i % 2 ? CEG : CEG2, 0, 0.45 + i * 0.3, 0), cz(box(1.27 - i * 0.012, 0.025, 1.27 - i * 0.012), '#e0d2bd', 0, 0.3 + i * 0.3, 0));
    c.push(cz(box(1.55, 0.18, 1.55), KAMIEN, 0, 3.05, 0));
    for (let i = 0; i < 4; i++) for (const t of [-0.5, 0, 0.5]) { const a = i * Math.PI / 2; c.push(cz(box(0.24, 0.26, 0.16), CEG, Math.sin(a) * 0.68 + Math.cos(a) * t, 3.27, Math.cos(a) * 0.68 - Math.sin(a) * t, 0, a, 0)); }
    for (const [x, z, ry] of [[0, 0.64, 0], [0.64, 0, Math.PI / 2], [0, -0.64, 0], [-0.64, 0, Math.PI / 2]]) c.push(cz(box(0.1, 0.36, 0.05), CIEMNE_D, x, 2.3, z, 0, ry, 0), cz(box(0.1, 0.36, 0.05), CIEMNE_D, x, 1.4, z, 0, ry, 0));
    for (const [x, z] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) c.push(cz(cyl(0.04, 0.04, 0.7, 5), BAL, x, 3.5, z));
    c.push(cz(dach4(1.15, 0.7), GONT, 0, 4.2, 0, 0, Math.PI / 4), cz(box(0.14, 0.14, 0.14), k, 0, 4.58, 0), ...flaga(k, 0, 4.58, 0, 0.7), ...drzwi(0, 0.3, 0.64, 0.36, 0.6),
      cz(box(1.0, 0.1, 0.06), k, 0, 2.8, 0.64), cz(box(0.06, 0.1, 1.0), k, 0.64, 2.8, 0));
    return c;
  },
  // Twierdza Jagodowa: kamienna podstawa, okrągła wieża z blankami, stożkowy dach, chorągwie, jagody nad bramą
  wieza3(k, d) {
    const c = [cz(box(1.85, 0.5, 1.85), KAMIEN2, 0, 0.25, 0), cz(box(1.9, 0.08, 1.9), KAMIEN, 0, 0.52, 0)];
    for (let i = 0; i < 7; i++) c.push(cz(cyl(0.78 - i * 0.01, 0.8 - i * 0.01, 0.42, 14), i % 2 ? KAMIEN : '#a3a9b1', 0, 0.77 + i * 0.42, 0));
    c.push(cz(cyl(0.95, 0.85, 0.2, 14), KAMIEN2, 0, 3.75, 0));
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; c.push(cz(box(0.24, 0.3, 0.16), KAMIEN, Math.sin(a) * 0.88, 4.0, Math.cos(a) * 0.88, 0, a, 0)); }
    c.push(cz(stozek(0.95, 1.2, 14), GONT, 0, 4.75, 0), cz(cyl(0.98, 0.98, 0.08, 14), k, 0, 4.18, 0), cz(kula(0.08, 6), '#f2c94c', 0, 5.4, 0), ...flaga(k, 0, 5.38, 0, 0.8));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3; c.push(cz(box(0.1, 0.4, 0.05), CIEMNE_D, Math.sin(a) * 0.79, 2.4 + (i % 2) * 0.8, Math.cos(a) * 0.79, 0, a, 0)); }
    for (const sx of [-1, 1]) c.push(cz(box(0.04, 1.0, 0.32), k, sx * 0.82, 2.7, 0.15, 0, 0, 0), cz(box(0.36, 0.06, 0.06), BAL2, sx * 0.82, 3.2, 0.15, 0, Math.PI / 2, 0));
    c.push(...drzwi(0, 0.55, 0.79, 0.42, 0.7), cz(kula(0.09, 7), '#3a4bb0', -0.08, 1.45, 0.8), cz(kula(0.09, 7), '#3a4bb0', 0.08, 1.45, 0.8), cz(kula(0.09, 7), '#3a4bb0', 0, 1.58, 0.79));
    return c;
  },
  // palisada: dwa rzędy zaostrzonych pali z wiązaniem i chorągiewką w kolorze gracza
  mur(k, d) {
    const c = [];
    for (let i = 0; i < 4; i++) for (const [z, dx] of [[-0.18, 0], [0.18, 0.12]]) {
      const x = -0.36 + i * 0.24 + dx; if (x > 0.45) continue;
      const h = 0.95 + ((i * 7 + (dx ? 3 : 0)) % 3) * 0.06;
      c.push(cz(cyl(0.1, 0.11, h, 6), (i + (dx ? 1 : 0)) % 2 ? BAL : BAL2, x, h / 2, z), cz(stozek(0.1, 0.2, 6), BAL2, x, h + 0.1, z));
    }
    c.push(cz(box(0.98, 0.07, 0.5), '#6b4527', 0, 0.55, 0), cz(box(0.98, 0.07, 0.5), '#6b4527', 0, 0.2, 0), cz(box(0.5, 0.06, 0.52), k, 0, 0.75, 0));
    return c;
  },
  // mur z cegieł: blok z cegieł w pasy, kamienna podmurówka, blanki na rogach
  mur2(k, d) {
    const CEG = '#b5553a', CEG2 = '#9c4630', c = [cz(box(1.0, 0.22, 1.0), KAMIEN2, 0, 0.11, 0)];
    for (let i = 0; i < 4; i++) c.push(cz(box(0.94, 0.22, 0.94), i % 2 ? CEG : CEG2, 0, 0.33 + i * 0.22, 0), cz(box(0.96, 0.02, 0.96), '#e0d2bd', 0, 0.22 + i * 0.22, 0));
    c.push(cz(box(1.0, 0.08, 1.0), KAMIEN, 0, 1.15, 0));
    for (const [x, z] of [[-0.33, -0.33], [0.33, -0.33], [-0.33, 0.33], [0.33, 0.33]]) c.push(cz(box(0.3, 0.24, 0.3), CEG, x, 1.31, z));
    c.push(cz(box(0.36, 0.08, 0.98), k, 0, 1.2, 0), cz(box(0.98, 0.08, 0.36), k, 0, 1.2, 0));
    return c;
  },
  // mur ze stalowymi sztabami: cegły okute stalowymi pasami z nitami
  mur3(k, d) {
    const c = BUD.mur2(k, d), STAL = '#4a4f57';
    for (const y of [0.42, 0.86]) c.push(cz(box(1.0, 0.07, 1.0), STAL, 0, y, 0));
    for (const [x, z] of [[-0.48, 0], [0.48, 0], [0, -0.48], [0, 0.48]]) c.push(cz(box(x ? 0.04 : 0.12, 1.0, z ? 0.04 : 0.12), STAL, x, 0.62, z));
    for (const [x, z] of [[-0.49, -0.3], [-0.49, 0.3], [0.49, -0.3], [0.49, 0.3], [-0.3, 0.49], [0.3, 0.49], [-0.3, -0.49], [0.3, -0.49]]) c.push(cz(kula(0.03, 4), METAL, x, 0.86, z));
    return c;
  },
  // brama drewniana: dwa słupy, wrota z pasem w kolorze gracza, daszek
  brama(k, d) {
    return [cz(cyl(0.1, 0.12, 1.4, 6), BAL, -0.4, 0.7, 0), cz(cyl(0.1, 0.12, 1.4, 6), BAL, 0.4, 0.7, 0),
      cz(box(0.7, 0.95, 0.08), '#8a5530', 0, 0.5, 0), cz(box(0.04, 0.95, 0.09), '#5a3518', 0, 0.5, 0), cz(box(0.7, 0.1, 0.09), k, 0, 0.75, 0), cz(box(0.7, 0.06, 0.09), '#5a3518', 0, 0.3, 0),
      ...dach(0, 0, 1.4, 1.0, 0.35, 0.3, GONT, k, 0, BAL, false)];
  },
  brama2(k, d) {
    const CEG = '#b5553a';
    return [cz(box(0.26, 1.5, 0.9), CEG, -0.37, 0.75, 0), cz(box(0.26, 1.5, 0.9), CEG, 0.37, 0.75, 0), cz(box(1.0, 0.3, 0.9), CEG, 0, 1.35, 0),
      cz(box(0.48, 1.0, 0.07), '#8a5530', 0, 0.5, 0), cz(box(0.48, 0.1, 0.08), k, 0, 0.72, 0), cz(box(1.02, 0.08, 0.92), KAMIEN, 0, 1.54, 0),
      cz(box(0.24, 0.2, 0.24), CEG, -0.37, 1.68, 0), cz(box(0.24, 0.2, 0.24), CEG, 0.37, 1.68, 0)];
  },
  brama3(k, d) {
    const c = BUD.brama2(k, d), STAL = '#4a4f57';
    c.push(cz(box(0.5, 0.06, 0.09), STAL, 0, 0.3, 0.01), cz(box(0.5, 0.06, 0.09), STAL, 0, 0.9, 0.01), cz(box(1.0, 0.06, 0.92), STAL, 0, 1.22, 0));
    for (const x of [-0.15, 0, 0.15]) c.push(cz(kula(0.025, 4), METAL, x, 0.6, 0.05));
    return c;
  },
  // Jarmark Jagodowy: trzy kramy z pasiastymi daszkami, kosze z jagodami, słoje z dżemem, beczki, waga, sznur z chorągiewkami
  jarmark(k, d) {
    const c = [cz(box(2.8, 0.06, 2.8), '#c9a77a', 0, 0.03, 0)];
    const kram = (x, z, ry, kol) => {
      const p = [];
      for (const [a, b] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) p.push(cz(cyl(0.035, 0.04, 1.1, 5), BAL, x + a, 0.55, z + b));
      p.push(cz(box(1.1, 0.45, 0.4), BAL2, x, 0.25, z + 0.18), cz(box(1.14, 0.05, 0.44), BAL, x, 0.48, z + 0.18));
      for (let i = 0; i < 6; i++) p.push(cz(box(0.19, 0.04, 0.8), i % 2 ? '#f3efe6' : kol, x - 0.475 + i * 0.19, 1.15, z, 0.22, 0, 0));
      return obroc(p, ry, x, z);
    };
    c.push(...kram(-0.65, -0.75, 0, k), ...kram(0.75, -0.55, -0.5, '#e8b923'), ...kram(-0.55, 0.75, Math.PI, k));
    // towary
    c.push(...koszyk(-0.95, -0.55, 0.8), ...koszyk(-0.65, -0.55, 0.8), ...koszyk(-0.35, -0.55, 0.8));
    for (const [x, z] of [[0.6, -0.3], [0.78, -0.25], [0.95, -0.2]]) c.push(cz(cyl(0.07, 0.07, 0.14, 8), '#8a2f9e', x, 0.57, z), cz(cyl(0.075, 0.075, 0.03, 8), '#f3efe6', x, 0.655, z));
    c.push(cz(cyl(0.18, 0.16, 0.4, 10), '#8a5530', 1.0, 0.2, 0.7), cz(cyl(0.185, 0.185, 0.03, 10), METAL, 1.0, 0.3, 0.7), cz(cyl(0.18, 0.16, 0.4, 10), '#8a5530', 0.65, 0.2, 0.95),
      cz(cyl(0.02, 0.02, 0.35, 4), BRAZ, -0.55, 0.68, 0.6), cz(box(0.4, 0.02, 0.02), BRAZ, -0.55, 0.86, 0.6), cz(cyl(0.08, 0.06, 0.03, 8), '#c9a227', -0.73, 0.78, 0.6), cz(cyl(0.08, 0.06, 0.03, 8), '#c9a227', -0.37, 0.78, 0.6),
      ...worek(0.2, 0.45), ...worek(0.35, 0.25, 0.7));
    // słup z flagą i sznur z chorągiewkami
    c.push(...flaga(k, 0.2, 0, 0.1, 1.9));
    for (const [x1, z1] of [[-1.15, -1.05], [1.2, -0.9], [-1.1, 1.1]]) {
      for (let i = 1; i < 6; i++) { const t = i / 6, x = 0.2 + (x1 - 0.2) * t, z = 0.1 + (z1 - 0.1) * t, y = 1.75 - Math.sin(t * Math.PI) * 0.25 - t * 0.5; c.push(cz(stozek(0.05, 0.12, 3), i % 2 ? k : '#ffd84a', x, y, z, Math.PI, 0, 0)); }
    }
    return c;
  },
  // warsztat: otwarta wiata z ramą, wielkie koło, niedokończone ramię machiny, stół z narzędziami, zwój liny
  warsztat(k, d) {
    const c = [];
    for (const [x, z] of [[-1.15, -1.1], [1.15, -1.1], [-1.15, 0.3], [1.15, 0.3]]) c.push(cz(cyl(0.08, 0.09, 1.5, 6), BAL, x, 0.75, z));
    c.push(cz(box(2.4, 0.1, 0.12), BAL2, 0, 1.45, 0.3), cz(box(2.4, 0.1, 0.12), BAL2, 0, 1.45, -1.1), ...dach(0, -0.4, 1.5, 2.6, 0.95, 0.6, GONT, k, 0, BAL, true),
      cz(new THREE.TorusGeometry(0.45, 0.05, 6, 16), BAL2, 0.55, 0.5, 0.75, 0, Math.PI / 2, 0), cz(cyl(0.07, 0.07, 0.12, 8), BAL, 0.55, 0.5, 0.75, 0, 0, Math.PI / 2));
    for (let i = 0; i < 4; i++) c.push(cz(box(0.04, 0.9, 0.04), BAL2, 0.55, 0.5, 0.75, i * Math.PI / 4, 0, 0));
    c.push(cz(box(1.2, 0.12, 0.12), BAL, -0.4, 0.3, -0.4, 0, 0.3, 0.35), cz(box(0.2, 0.25, 0.4), BAL2, -0.4, 0.12, -0.4), cz(cyl(0.14, 0.12, 0.08, 10), BAL2, 0.15, 0.55, -0.6),
      cz(box(0.8, 0.06, 0.4), BAL, -0.6, 0.5, 0.85), cz(box(0.06, 0.48, 0.06), BAL2, -0.95, 0.24, 0.7), cz(box(0.06, 0.48, 0.06), BAL2, -0.25, 0.24, 0.7), cz(box(0.06, 0.48, 0.06), BAL2, -0.95, 0.24, 1.0), cz(box(0.06, 0.48, 0.06), BAL2, -0.25, 0.24, 1.0),
      cz(box(0.25, 0.04, 0.05), METAL, -0.7, 0.55, 0.85, 0, 0.4, 0), cz(cyl(0.015, 0.015, 0.25, 4), BRAZ, -0.45, 0.55, 0.9, 0, 0, Math.PI / 2), cz(box(0.08, 0.06, 0.08), '#555b63', -0.33, 0.56, 0.9),
      cz(new THREE.TorusGeometry(0.15, 0.05, 5, 12), '#d9c79e', 1.0, 0.05, -0.55, Math.PI / 2, 0, 0), cz(new THREE.TorusGeometry(0.12, 0.05, 5, 12), '#d9c79e', 1.0, 0.12, -0.55, Math.PI / 2, 0, 0),
      ...stosBali(-0.3, -0.85, 1.4, 0.09, 2), ...flaga(k, 1.25, 0, 1.2, 1.3));
    return c;
  },
};
export const budynek = cache((typ, strona) => polacz(BUD[typ](KOLORY_STRON[strona], CIEMNIEJ[strona])));
// stosik rzeczy na plecach zbieracza: n sztuk (jagody w koszyczkach, polana, kamienie, ruda)
export const stos = cache((sur, n) => {
  const c = [], kol = { kamien: [KAMIEN, KAMIEN2], zelazo: ['#c4622d', '#7b5a4a'] }[sur];
  for (let i = 0; i < n; i++) {
    const rz = Math.floor(i / 2), x = (i % 2 ? 0.09 : -0.09) * (n === 1 ? 0 : 1), y = rz * 0.13;
    if (sur === 'jagody') c.push(cz(cyl(0.085, 0.07, 0.1, 8), SLOMA, x, y, 0), cz(kula(0.07, 6), '#3a4bb0', x, y + 0.04, 0, 0, 0, 0, 1, 0.5, 1));
    else if (sur === 'drewno') c.push(cz(cyl(0.055, 0.055, 0.34, 7), i % 2 ? '#9a6a3a' : '#8a5c32', 0, y + (i % 2) * 0.06, 0.0 + (i % 2 ? 0.0 : 0), 0, 0, Math.PI / 2), cz(cyl(0.045, 0.045, 0.01, 7), '#e0c08a', 0.171, y + (i % 2) * 0.06, 0, 0, 0, Math.PI / 2));
    else c.push(cz(new THREE.DodecahedronGeometry(0.075), kol[i % 2], x, y, 0, i, i * 0.5, 0));
  }
  return polacz(c);
});

// ---------- przyroda ----------
// drzewa: kilka gatunków (świerk, sosna, brzoza, dąb, modrzew); wszystkie mają pień przy y = 0
export const GATUNKI = ['swierk', 'sosna', 'brzoza', 'dab', 'modrzew'];
export const drzewo = cache((gat = 'swierk') => {
  const c = [];
  if (gat === 'swierk') {
    c.push(cz(cyl(0.11, 0.15, 0.7, 6), '#5e3d22', 0, 0.35, 0));
    for (const [r, h, y, k] of [[0.72, 0.9, 0.85, '#245f37'], [0.6, 0.85, 1.3, '#2b6d3f'], [0.46, 0.75, 1.72, '#327a46'], [0.3, 0.6, 2.1, '#3a8650']]) c.push(cz(stozek(r, h, 8), k, 0, y, 0));
  } else if (gat === 'sosna') {
    c.push(cz(cyl(0.08, 0.13, 1.7, 6), '#8a4f2a', 0, 0.85, 0), cz(cyl(0.05, 0.08, 0.5, 5), '#a0603a', 0.12, 1.55, 0, 0, 0, -0.5));
    for (const [x, y, z, r] of [[0, 2.0, 0, 0.5], [0.32, 1.85, 0.12, 0.36], [-0.28, 1.9, -0.1, 0.38], [0.05, 2.25, -0.2, 0.32], [0.2, 1.75, -0.3, 0.3]]) c.push(cz(kula(r, 7), y > 2 ? '#3f7d3c' : '#356f35', x, y, z, 0, 0, 0, 1, 0.55, 1));
  } else if (gat === 'brzoza') {
    c.push(cz(cyl(0.07, 0.1, 1.5, 7), '#ece8dc', 0, 0.75, 0));
    for (const [y, a] of [[0.3, 0], [0.55, 2], [0.85, 4], [1.15, 1], [1.35, 3]]) c.push(cz(box(0.07, 0.03, 0.02), '#2c2a28', Math.cos(a) * 0.08, y, Math.sin(a) * 0.08, 0, -a, 0));
    for (const [x, y, z, r] of [[0, 1.75, 0, 0.42], [0.28, 1.55, 0.1, 0.3], [-0.25, 1.6, -0.12, 0.32], [0.08, 2.05, -0.1, 0.3], [-0.1, 1.4, 0.25, 0.25]]) c.push(cz(kula(r, 7), y > 1.7 ? '#8cc65a' : '#79b84d', x, y, z));
  } else if (gat === 'dab') {
    c.push(cz(cyl(0.16, 0.24, 1.0, 7), '#5a3d26', 0, 0.5, 0), cz(cyl(0.07, 0.1, 0.6, 5), '#5a3d26', 0.22, 1.05, 0, 0, 0, -0.7), cz(cyl(0.07, 0.1, 0.6, 5), '#5a3d26', -0.2, 1.05, 0.05, 0, 0, 0.7));
    for (const [x, y, z, r] of [[0, 1.6, 0, 0.62], [0.45, 1.4, 0.1, 0.45], [-0.45, 1.45, -0.05, 0.47], [0.1, 1.45, 0.45, 0.42], [-0.05, 1.5, -0.45, 0.44], [0.05, 1.95, 0.05, 0.42]]) c.push(cz(kula(r, 7), y > 1.7 ? '#58963f' : '#4a8636', x, y, z));
  } else { // modrzew: smukły, jasnozielony
    c.push(cz(cyl(0.07, 0.11, 0.6, 6), '#6e4a2c', 0, 0.3, 0));
    for (const [r, h, y, k] of [[0.5, 1.0, 0.85, '#7fae4c'], [0.4, 0.9, 1.35, '#8bba55'], [0.28, 0.8, 1.85, '#98c45f'], [0.16, 0.5, 2.25, '#a3cc68']]) c.push(cz(stozek(r, h, 7), k, 0, y, 0));
  }
  return polacz(c);
});
// ozdoby krajobrazu (nie zasłaniają drogi, są tylko do patrzenia)
export const OZDOBY = ['trawa', 'trawa2', 'kwiatyB', 'kwiatyZ', 'kwiatyF', 'paproc', 'muchomor', 'borowik', 'kamyki', 'kloda', 'krzaczek', 'jagodnik'];
export const ozdoba = cache(rodzaj => {
  const c = [];
  if (rodzaj === 'trawa' || rodzaj === 'trawa2') {
    const k = rodzaj === 'trawa' ? ['#5aa646', '#6db552', '#4c9a3e'] : ['#86b84e', '#9bc45a', '#77ad48'];
    for (let i = 0; i < 6; i++) { const a = i * 1.05; c.push(cz(stozek(0.025, 0.22 + (i % 3) * 0.06, 3), k[i % 3], Math.cos(a) * 0.05, 0.12, Math.sin(a) * 0.05, Math.sin(a) * 0.35, 0, Math.cos(a) * 0.35)); }
  } else if (rodzaj.startsWith('kwiaty')) {
    const kol = { kwiatyB: '#ffffff', kwiatyZ: '#ffd84a', kwiatyF: '#b48cff' }[rodzaj];
    for (const [x, z, h] of [[0, 0, 0.2], [0.08, 0.05, 0.16], [-0.06, 0.07, 0.18], [0.03, -0.08, 0.14]]) {
      c.push(cz(cyl(0.008, 0.008, h, 3), '#4c9a3e', x, h / 2, z));
      for (let p = 0; p < 5; p++) { const a = p * 1.256; c.push(cz(kula(0.022, 4), kol, x + Math.cos(a) * 0.025, h, z + Math.sin(a) * 0.025, 0, 0, 0, 1, 0.5, 1)); }
      c.push(cz(kula(0.016, 4), '#f2a51c', x, h + 0.008, z));
    }
  } else if (rodzaj === 'paproc') {
    for (let i = 0; i < 7; i++) { const a = i * 0.9; c.push(cz(kula(0.13, 5), i % 2 ? '#3f8a3a' : '#4d9a45', Math.cos(a) * 0.14, 0.1, Math.sin(a) * 0.14, 0, -a, 0.5, 1.8, 0.18, 0.55)); }
  } else if (rodzaj === 'muchomor') {
    c.push(cz(cyl(0.025, 0.03, 0.14, 6), '#f4efe2', 0, 0.07, 0), cz(new THREE.SphereGeometry(0.08, 8, 5, 0, Math.PI * 2, 0, 1.4), '#d8382f', 0, 0.12, 0));
    for (const [x, z] of [[0.03, 0.02], [-0.03, 0.03], [0.0, -0.04], [0.05, -0.02]]) c.push(cz(kula(0.012, 4), '#ffffff', x, 0.19, z));
    c.push(cz(cyl(0.018, 0.02, 0.08, 5), '#f4efe2', 0.12, 0.04, 0.06), cz(new THREE.SphereGeometry(0.05, 7, 4, 0, Math.PI * 2, 0, 1.4), '#d8382f', 0.12, 0.07, 0.06));
  } else if (rodzaj === 'borowik') {
    c.push(cz(cyl(0.035, 0.045, 0.12, 6), '#e8dcc0', 0, 0.06, 0), cz(new THREE.SphereGeometry(0.085, 8, 5, 0, Math.PI * 2, 0, 1.35), '#7a4a26', 0, 0.1, 0),
      cz(cyl(0.025, 0.03, 0.08, 6), '#e8dcc0', -0.1, 0.04, 0.05), cz(new THREE.SphereGeometry(0.055, 7, 4, 0, Math.PI * 2, 0, 1.35), '#8a5a30', -0.1, 0.065, 0.05));
  } else if (rodzaj === 'kamyki') {
    for (const [x, z, s] of [[0, 0, 0.11], [0.15, 0.06, 0.07], [-0.1, 0.1, 0.06], [0.05, -0.13, 0.05]]) c.push(cz(new THREE.DodecahedronGeometry(s), s > 0.08 ? '#9aa0a8' : '#7d838c', x, s * 0.5, z, x * 9, z * 7, 0, 1, 0.65, 1));
  } else if (rodzaj === 'kloda') {
    c.push(cz(cyl(0.12, 0.13, 1.1, 7), '#6b4527', 0, 0.11, 0, 0, 0, Math.PI / 2), cz(cyl(0.1, 0.1, 0.01, 7), '#c9a26a', 0.555, 0.11, 0, 0, 0, Math.PI / 2),
      cz(kula(0.1, 5), '#4f9a3a', -0.2, 0.2, 0.02, 0, 0, 0, 1.6, 0.4, 1), cz(kula(0.08, 5), '#5aa646', 0.25, 0.19, -0.03, 0, 0, 0, 1.4, 0.4, 1),
      cz(cyl(0.03, 0.04, 0.25, 4), '#6b4527', -0.3, 0.2, 0.1, 0.9, 0, 0.3));
  } else if (rodzaj === 'krzaczek') {
    c.push(cz(kula(0.22, 6), '#3e7f38', 0, 0.16, 0, 0, 0, 0, 1, 0.75, 1), cz(kula(0.15, 6), '#4a8f40', 0.14, 0.22, 0.06), cz(kula(0.13, 6), '#356f33', -0.12, 0.2, -0.08));
  } else if (rodzaj === 'jagodnik') {
    // niskie krzaczki borówek z czerwonymi kropkami (to nie haskap, nie da się ich zbierać)
    c.push(cz(kula(0.14, 6), '#4c8f3e', 0, 0.08, 0, 0, 0, 0, 1.3, 0.55, 1.1));
    for (const [x, z] of [[0.08, 0.06], [-0.07, 0.05], [0.02, -0.08]]) c.push(cz(kula(0.025, 4), '#c2263a', x, 0.13, z));
  }
  return polacz(c);
});
export const krzak = cache(() => {
  const c = [cz(kula(0.45, 7), '#2f7d3a', 0, 0.35, 0, 0, 0, 0, 1, 0.8, 1), cz(kula(0.3, 6), '#3b9446', 0.25, 0.5, 0.1)];
  const r = [[0.3, 0.45, 0.25], [-0.25, 0.5, 0.2], [0.05, 0.62, -0.25], [-0.3, 0.32, -0.2], [0.35, 0.3, -0.15], [0.0, 0.7, 0.1]];
  for (const [x, y, z] of r) c.push(cz(kula(0.08, 5), '#3a4bb0', x, y, z, 0, 0, 0, 0.8, 1.3, 0.8));
  return polacz(c);
});
export const skala = cache(rodzaj => {
  const k1 = rodzaj === 'ruda' ? '#7b5a4a' : rodzaj === 'zloto' ? '#e8b923' : KAMIEN, k2 = rodzaj === 'ruda' ? '#4d4a4f' : rodzaj === 'zloto' ? '#8f8a80' : KAMIEN2;
  const c = [cz(new THREE.DodecahedronGeometry(0.45), k2, 0, 0.25, 0, 0, 0, 0, 1, 0.7, 1), cz(new THREE.DodecahedronGeometry(0.3), k1, 0.2, 0.45, 0.1, 0.4, 0.3, 0), cz(new THREE.DodecahedronGeometry(0.22), k1, -0.25, 0.2, 0.2)];
  if (rodzaj === 'zloto') c.push(cz(new THREE.OctahedronGeometry(0.11), '#ffe066', -0.05, 0.55, 0.25), cz(new THREE.OctahedronGeometry(0.09), '#fff3a8', 0.3, 0.32, -0.22), cz(new THREE.OctahedronGeometry(0.08), '#f2c94c', -0.3, 0.4, -0.1));
  if (rodzaj === 'ruda') c.push(cz(new THREE.OctahedronGeometry(0.11), '#c4622d', -0.05, 0.55, 0.25), cz(new THREE.OctahedronGeometry(0.09), '#d9773a', 0.3, 0.3, -0.25), cz(new THREE.OctahedronGeometry(0.07), '#c4622d', -0.3, 0.42, -0.1));
  return polacz(c);
});
export const kamyk = cache(() => polacz([cz(kula(0.09, 5), KAMIEN2)]));
export const pieniek = cache(() => polacz([cz(cyl(0.15, 0.18, 0.22, 10), '#6b4527', 0, 0.11, 0), cz(cyl(0.14, 0.14, 0.02, 10), '#e0c08a', 0, 0.225, 0)]));
export const kolo = cache((r1, r2) => new THREE.RingGeometry(r1, r2, 28).rotateX(-Math.PI / 2));
