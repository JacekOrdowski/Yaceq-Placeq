// Age of Haskap II: modele 3D (własne, proste bryły). Każdy model to jedna bryła z kolorami w wierzchołkach,
// dzięki temu telefon rysuje setki postaci bez zwalniania.
import * as THREE from '../../../survival/three.module.min.js';

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
export const JEDNOSTKI3D = { osadnik, wojownik, tarczownik, obronca, wlocznik, pikinier, procarz, procarz2, kusznik, zwiadowca, jezdziec, rycerz, taran, katapulta };

// ---------- budynki (środek modelu = środek budynku, podłoga na y = 0) ----------
function flaga(k, x, y, z) { return [cz(cyl(0.03, 0.03, 1.0), BRAZ, x, y + 0.5, z), cz(box(0.45, 0.28, 0.03), k, x + 0.24, y + 0.85, z)]; }
const BUD = {
  ratusz(k, d) {
    return [cz(box(3.7, 0.35, 3.7), KAMIEN2, 0, 0.17, 0), cz(box(3.2, 1.6, 3.2), '#efe2c4', 0, 1.15, 0),
      cz(dach4(2.6, 1.4), k, 0, 2.65, 0, 0, Math.PI / 4), cz(box(0.9, 1.1, 0.9), '#efe2c4', 0, 3.6, 0), cz(dach4(0.8, 0.8), d, 0, 4.55, 0, 0, Math.PI / 4),
      cz(box(0.8, 1.1, 0.06), CIEMNE, 0, 0.9, 1.61), cz(box(0.5, 0.5, 0.06), '#7fb5e8', -1.0, 1.3, 1.61), cz(box(0.5, 0.5, 0.06), '#7fb5e8', 1.0, 1.3, 1.61),
      cz(box(0.06, 0.5, 0.5), '#7fb5e8', 1.61, 1.3, 0), cz(box(0.06, 0.5, 0.5), '#7fb5e8', -1.61, 1.3, 0),
      cz(kula(0.22, 8), '#3a4bb0', -0.2, 2.25, 1.62), cz(kula(0.22, 8), '#3a4bb0', 0.2, 2.25, 1.62), cz(kula(0.22, 8), '#3a4bb0', 0, 2.55, 1.6), cz(box(0.3, 0.1, 0.1), '#3e8e3e', 0.15, 2.82, 1.6, 0, 0, 0.5),
      ...flaga(k, 0, 4.9, 0)];
  },
  dom(k, d) {
    return [cz(box(1.5, 0.9, 1.5), '#d8a874', 0, 0.45, 0), cz(dach4(1.3, 0.9), d, 0, 1.35, 0, 0, Math.PI / 4), cz(box(0.4, 0.6, 0.05), CIEMNE, 0, 0.3, 0.76),
      cz(box(0.3, 0.3, 0.05), '#7fb5e8', 0.45, 0.55, 0.76), cz(box(0.2, 0.5, 0.2), KAMIEN2, -0.4, 1.5, -0.3)];
  },
  spichlerz(k, d) {
    const c = [cz(cyl(0.9, 0.95, 1.6, 12), '#d9b36c', -0.4, 0.8, -0.3), cz(stozek(1.1, 0.9, 12), k, -0.4, 2.05, -0.3), cz(box(1.0, 0.7, 0.9), DREWNO, 0.75, 0.35, 0.6)];
    for (const [x, z] of [[0.4, 1.2], [0.85, 1.25], [1.25, 1.1]]) c.push(cz(cyl(0.18, 0.14, 0.22, 8), SLOMA, x, 0.11, z), cz(kula(0.13, 6), '#3a4bb0', x, 0.24, z, 0, 0, 0, 1, 0.5, 1));
    return c;
  },
  tartak(k, d) {
    const c = [];
    for (const [x, z] of [[-1.1, -1.0], [1.1, -1.0], [-1.1, 0.6], [1.1, 0.6]]) c.push(cz(box(0.15, 1.4, 0.15), BRAZ, x, 0.7, z));
    c.push(cz(box(2.6, 0.12, 2.0), k, 0, 1.5, -0.2, 0.18, 0, 0));
    for (let i = 0; i < 3; i++) c.push(cz(cyl(0.18, 0.18, 2.0, 8), '#9a6a3a', 0, 0.18 + i * 0.32, -0.6 + (i % 2) * 0.2, 0, 0, Math.PI / 2));
    c.push(cz(cyl(0.18, 0.18, 2.0, 8), '#9a6a3a', 0, 0.18, -0.25, 0, 0, Math.PI / 2), cz(cyl(0.35, 0.35, 0.05, 12), METAL, 0.9, 0.5, 1.05, Math.PI / 2, 0, 0));
    return c;
  },
  szopa(k, d) {
    return [cz(box(1.8, 1.1, 1.4), '#a08a6e', -0.4, 0.55, -0.4), cz(dach4(1.4, 0.8), k, -0.4, 1.5, -0.4, 0, Math.PI / 4, 0, 1.25, 1, 1),
      cz(box(0.9, 0.35, 0.6), BRAZ, 0.8, 0.45, 0.9), cz(cyl(0.12, 0.12, 0.08, 8), CIEMNE, 0.45, 0.18, 0.9, 0, 0, Math.PI / 2), cz(cyl(0.12, 0.12, 0.08, 8), CIEMNE, 1.15, 0.18, 0.9, 0, 0, Math.PI / 2),
      cz(kula(0.15, 5), KAMIEN, 0.65, 0.7, 0.9), cz(kula(0.14, 5), '#f2c94c', 0.95, 0.7, 0.85), cz(box(0.5, 0.6, 0.05), CIEMNE, -0.4, 0.3, 0.31)];
  },
  kopalnia(k, d) {
    return [cz(box(1.4, 1.0, 1.2), '#7d6a5a', -0.6, 0.5, -0.6), cz(dach4(1.1, 0.7), k, -0.6, 1.35, -0.6, 0, Math.PI / 4, 0, 1.2, 1, 1),
      cz(box(1.0, 1.0, 0.25), CIEMNE, 0.6, 0.5, -0.9), cz(box(1.2, 0.15, 0.4), BRAZ, 0.6, 1.05, -0.85), cz(box(0.15, 1.0, 0.15), BRAZ, 0.05, 0.5, -0.75), cz(box(0.15, 1.0, 0.15), BRAZ, 1.15, 0.5, -0.75),
      cz(box(0.08, 0.04, 1.6), METAL, 0.45, 0.03, 0.4), cz(box(0.08, 0.04, 1.6), METAL, 0.75, 0.03, 0.4), cz(box(0.5, 0.3, 0.6), '#555b63', 0.6, 0.3, 0.7),
      cz(kula(0.12, 5), '#c4622d', 0.5, 0.5, 0.7), cz(kula(0.11, 5), '#7b5a4a', 0.72, 0.5, 0.62)];
  },
  pole(k, d) {
    const c = [cz(box(2.9, 0.06, 2.9), '#8b5a30', 0, 0.03, 0)];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) c.push(cz(kula(0.3, 6), '#3e8e3e', i * 0.9, 0.22, j * 0.9, 0, 0, 0, 1, 0.7, 1), cz(kula(0.09, 5), '#3a4bb0', i * 0.9 + 0.12, 0.38, j * 0.9 + 0.1));
    c.push(cz(box(0.08, 0.5, 0.08), BRAZ, -1.35, 0.25, -1.35), cz(box(0.4, 0.25, 0.03), k, -1.15, 0.45, -1.35));
    return c;
  },
  koszary(k, d) {
    return [cz(box(2.6, 1.2, 1.8), '#c79a63', 0, 0.6, -0.3), cz(dach4(1.9, 0.9), k, 0, 1.65, -0.3, 0, Math.PI / 4, 0, 1.4, 1, 1),
      cz(box(0.7, 0.8, 0.05), CIEMNE, 0, 0.4, 0.61), cz(box(1.2, 0.08, 0.08), BRAZ, 0.6, 0.6, 1.1), cz(box(0.08, 0.7, 0.08), BRAZ, 0.1, 0.35, 1.1), cz(box(0.08, 0.7, 0.08), BRAZ, 1.1, 0.35, 1.1),
      cz(cyl(0.02, 0.02, 1.0), BRAZ, 0.4, 0.6, 1.15, 0, 0, 0.2), cz(cyl(0.02, 0.02, 1.0), BRAZ, 0.8, 0.6, 1.15, 0, 0, -0.2), ...flaga(k, -1.1, 1.2, -1.1)];
  },
  strzelnica(k, d) {
    const c = [cz(box(1.8, 1.0, 1.4), '#c79a63', -0.4, 0.5, -0.5), cz(dach4(1.35, 0.8), k, -0.4, 1.4, -0.5, 0, Math.PI / 4, 0, 1.3, 1, 1)];
    for (const x of [0.2, 1.0]) c.push(cz(cyl(0.35, 0.35, 0.08, 14), '#f3efe6', x, 0.7, 1.0, Math.PI / 2, 0, 0), cz(cyl(0.22, 0.22, 0.09, 14), '#d8382f', x, 0.7, 1.0, Math.PI / 2, 0, 0), cz(cyl(0.08, 0.08, 0.1, 10), '#f3efe6', x, 0.7, 1.0, Math.PI / 2, 0, 0), cz(box(0.06, 0.4, 0.06), BRAZ, x, 0.2, 1.0));
    return c;
  },
  stajnia(k, d) {
    const c = [cz(box(2.2, 1.1, 1.5), '#a8693a', 0, 0.55, -0.5), cz(dach4(1.6, 0.9), k, 0, 1.55, -0.5, 0, Math.PI / 4, 0, 1.4, 1, 1), cz(box(0.8, 0.8, 0.05), CIEMNE, 0, 0.4, 0.26)];
    for (let x = -1.2; x <= 1.21; x += 0.6) c.push(cz(box(0.07, 0.5, 0.07), BRAZ, x, 0.25, 1.3));
    c.push(cz(box(2.5, 0.06, 0.06), BRAZ, 0, 0.4, 1.3), cz(box(0.5, 0.25, 0.3), SLOMA, 1.0, 0.13, 0.75));
    return c;
  },
  kuznia(k, d) {
    return [cz(box(2.2, 1.2, 1.7), KAMIEN, 0, 0.6, -0.4), cz(dach4(1.6, 0.8), k, 0, 1.6, -0.4, 0, Math.PI / 4, 0, 1.3, 1, 1), cz(box(0.45, 1.4, 0.45), KAMIEN2, 0.7, 1.7, -0.8),
      cz(box(0.5, 0.25, 0.25), '#555b63', 0.4, 0.5, 0.9), cz(box(0.25, 0.35, 0.2), '#555b63', 0.4, 0.2, 0.9), cz(box(0.6, 0.5, 0.06), '#ff8a3d', -0.4, 0.4, 0.46)];
  },
  wieza(k, d) {
    return [cz(box(1.3, 3.0, 1.3), KAMIEN, 0, 1.5, 0), cz(box(1.6, 0.3, 1.6), KAMIEN2, 0, 3.15, 0), cz(dach4(1.25, 1.0), k, 0, 3.8, 0, 0, Math.PI / 4),
      cz(box(0.25, 0.4, 0.05), CIEMNE, 0, 2.2, 0.66), cz(box(0.5, 0.8, 0.05), CIEMNE, 0, 0.4, 0.66), ...flaga(k, 0, 4.2, 0)];
  },
  warsztat(k, d) {
    const c = [];
    for (const [x, z] of [[-1.2, -1.1], [1.2, -1.1], [-1.2, 0.3], [1.2, 0.3]]) c.push(cz(box(0.16, 1.6, 0.16), BRAZ, x, 0.8, z));
    c.push(cz(dach4(1.9, 0.9), k, 0, 2.0, -0.4, 0, Math.PI / 4, 0, 1.3, 1, 1), cz(cyl(0.6, 0.6, 0.12, 14), DREWNO, 0.6, 0.6, 0.9, Math.PI / 2, 0, 0), cz(box(1.4, 0.3, 0.6), DREWNO, -0.4, 0.15, -0.4));
    return c;
  },
};
export const budynek = cache((typ, strona) => polacz(BUD[typ](KOLORY_STRON[strona], CIEMNIEJ[strona])));

// ---------- przyroda ----------
export const drzewo = cache(() => polacz([cz(cyl(0.12, 0.16, 0.7, 6), '#6b4527', 0, 0.35, 0), cz(stozek(0.7, 1.2, 7), '#2f7d3a', 0, 1.1, 0), cz(stozek(0.55, 1.0, 7), '#3b9446', 0, 1.6, 0), cz(stozek(0.36, 0.7, 7), '#47a653', 0, 2.05, 0)]));
export const krzak = cache(() => {
  const c = [cz(kula(0.45, 7), '#2f7d3a', 0, 0.35, 0, 0, 0, 0, 1, 0.8, 1), cz(kula(0.3, 6), '#3b9446', 0.25, 0.5, 0.1)];
  const r = [[0.3, 0.45, 0.25], [-0.25, 0.5, 0.2], [0.05, 0.62, -0.25], [-0.3, 0.32, -0.2], [0.35, 0.3, -0.15], [0.0, 0.7, 0.1]];
  for (const [x, y, z] of r) c.push(cz(kula(0.08, 5), '#3a4bb0', x, y, z, 0, 0, 0, 0.8, 1.3, 0.8));
  return polacz(c);
});
export const skala = cache(rodzaj => {
  const k1 = rodzaj === 'ruda' ? '#7b5a4a' : KAMIEN, k2 = rodzaj === 'ruda' ? '#4d4a4f' : KAMIEN2;
  const c = [cz(new THREE.DodecahedronGeometry(0.45), k2, 0, 0.25, 0, 0, 0, 0, 1, 0.7, 1), cz(new THREE.DodecahedronGeometry(0.3), k1, 0.2, 0.45, 0.1, 0.4, 0.3, 0), cz(new THREE.DodecahedronGeometry(0.22), k1, -0.25, 0.2, 0.2)];
  if (rodzaj === 'ruda') c.push(cz(new THREE.OctahedronGeometry(0.11), '#c4622d', -0.05, 0.55, 0.25), cz(new THREE.OctahedronGeometry(0.09), '#d9773a', 0.3, 0.3, -0.25), cz(new THREE.OctahedronGeometry(0.07), '#c4622d', -0.3, 0.42, -0.1));
  return polacz(c);
});
export const kamyk = cache(() => polacz([cz(kula(0.09, 5), KAMIEN2)]));
export const pieniek = cache(() => polacz([cz(cyl(0.15, 0.18, 0.22, 10), '#6b4527', 0, 0.11, 0), cz(cyl(0.14, 0.14, 0.02, 10), '#e0c08a', 0, 0.225, 0)]));
export const kolo = cache((r1, r2) => new THREE.RingGeometry(r1, r2, 28).rotateX(-Math.PI / 2));
