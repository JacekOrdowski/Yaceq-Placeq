// Age of Polan: modele 3D (własne, proste bryły; konie, Gontyna, stwory z dawnych wierzeń i bohaterowie z podań). Każdy model to jedna bryła z kolorami w wierzchołkach,
// dzięki temu telefon rysuje setki postaci bez zwalniania.
import * as THREE from '../../../survival/three.module.min.js';

const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S3 = new THREE.Vector3(), P3 = new THREE.Vector3();
// jedna część modelu: bryła, kolor, położenie, obrót, skala
function cz(g, kolor, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  E.set(rx, ry, rz); Q.setFromEuler(E); P3.set(x, y, z); S3.set(sx, sy, sz);
  return { g, k: kolor, m: M4.clone().compose(P3, Q, S3) };
}
// część, która się rusza: rodzaj 1 = noga albo ręka (wahadło wokół biodra/barku), 2 = wiatr, 3 = koło
export function st(p, rodzaj, osY = 0, znak = 1, osZ = 0) { p.s = [rodzaj, osY, znak, osZ]; return p; }
// faktury rysowane przez kartę graficzną: 1 drewno, 2 strzecha, 3 gont, 4 cegła, 5 kamień, 6 liście
const WZORY = {
  '#c08a52': 1, '#a87443': 1, '#b9864f': 1, '#9a6a3a': 1, '#8a5c32': 1, '#7a4a26': 1, '#d4a76a': 1, '#c9995c': 1, '#8a5530': 1, '#6b4527': 1, '#5e3d22': 1, '#7a5030': 1, '#6e4a2c': 1, '#5a3d26': 1, '#d8a874': 1, '#c79a63': 1, '#a8693a': 1, '#5a3518': 1, '#8a4f2a': 1, '#a0603a': 1,
  '#d4b265': 2, '#b8954c': 2, '#e2c76a': 2, '#e3c56a': 2, '#ecd47e': 2, '#cfae62': 2,
  '#7b5a3c': 3, '#6a4c31': 3, '#a5452f': 3, '#8a3826': 3, '#5d6470': 3, '#4a505b': 3,
  '#b5553a': 4, '#9c4630': 4,
  '#9aa0a8': 5, '#7d838c': 5, '#a3a9b1': 5, '#8f8a80': 5, '#7d7369': 5, '#8a8178': 5, '#a08a6e': 5, '#4d4a4f': 5, '#7b5a4a': 5, '#c49a6c': 5, '#a87b52': 5,
  '#a07848': 1, '#8a6238': 1,
};
const HSL = {};
// skleja części w jedną bryłę z kolorami; opcje.wiatr: liście (albo wszystko, gdy opcje.wszystko) kołyszą się na wietrze
export function polacz(czesci, opcje = {}) {
  const pos = [], nor = [], col = [], wz = [], ru = [], c = new THREE.Color();
  for (const p of czesci) {
    const g = (p.g.index ? p.g.toNonIndexed() : p.g.clone()).applyMatrix4(p.m);
    c.set(p.k);
    let w = WZORY[String(p.k).toLowerCase()] || 0;
    if (!w) { c.getHSL(HSL); if (HSL.h > 0.2 && HSL.h < 0.45 && HSL.s > 0.25 && HSL.l < 0.7) w = 6; }
    let s = p.s || [0, 0, 0, 0];
    if (!p.s && opcje.wiatr && (opcje.wszystko || w === 6)) s = [2, 0, opcje.wiatr, 0];
    const a = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < a.count; i++) {
      pos.push(a.getX(i), a.getY(i), a.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.r, c.g, c.b); wz.push(w); ru.push(s[0], s[1], s[2], s[3]);
    }
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('wzor', new THREE.Float32BufferAttribute(wz, 1));
  g.setAttribute('staw', new THREE.Float32BufferAttribute(ru, 4));
  g.computeBoundingSphere();
  return g;
}
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const cyl = (r1, r2, h, s = 8) => new THREE.CylinderGeometry(r1, r2, h, s);
const kula = (r, s = 8) => new THREE.SphereGeometry(r, s, Math.max(4, s - 2));
const stozek = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
const dach4 = (r, h) => new THREE.ConeGeometry(r, h, 4);

const SKORA = '#f1c193', BRAZ = '#7a4a26', DREWNO = '#b9864f', CIEMNE = '#4b3020', KAMIEN = '#9aa0a8', KAMIEN2 = '#7d838c', METAL = '#c9ced6', SLOMA = '#e3c56a';
export const KOLORY_STRON = ['#2f6fd6', '#d8382f', '#e0a020', '#8e4fd0'];
const CIEMNIEJ = ['#214f9c', '#9c2620', '#a8740f', '#62309c'];

function cache(f) { const m = new Map(); return (...a) => { const k = a.join('|'); if (!m.has(k)) m.set(k, f(...a)); return m.get(k); }; }

// ---------- postacie: prawdziwe proporcje (głowa to około 1/7 wzrostu), twarz z brwiami, nosem i ustami,
// lniana koszula z haftem, pas, portki, onuce i skórzane buty; fryzura „pod garnek”, u niektórych broda ----------
const kaps = (r, h, s = 8) => new THREE.CapsuleGeometry(r, h, 2, s);
const kulaG = (r, ws = 12, hs = 8) => new THREE.SphereGeometry(r, ws, hs);
const czapa = (r, th) => new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, th);
const WLOSY = ['#5b3a22', '#8a5a2b', '#2e2018', '#c98e4a', '#d9c08a', '#9a9a9a'], OCZY = '#1d2330', POLICZKI = '#f29a8c', SPODNIE = '#6b4a30';
const BUTY = '#4a3020', ONUCE = '#d8ccb0', RZEMYK = '#6b4527', HAFT = '#efe3c4', USTA = '#a8584a', BIALKO = '#f6f3ee';
// głowa (patrzy w stronę +z): lekko podłużna, szczęka, uszy, oczy z białkami, brwi, nos, usta, włosy; broda: pełna broda z wąsami
function glowaZ(x, y, z, wlosy = WLOSY[0], r = 0.11, broda = false) {
  const c = [
    cz(kulaG(r, 12, 9), SKORA, x, y, z, 0, 0, 0, 0.94, 1.08, 1),
    cz(kulaG(r * 0.78, 10, 6), SKORA, x, y - r * 0.38, z + r * 0.16, 0, 0, 0, 1, 0.78, 0.92),
    cz(czapa(r * 1.07, 1.35), wlosy, x, y + r * 0.06, z - r * 0.1, -0.12, 0, 0),
    cz(box(r * 1.55, r * 0.28, r * 0.32), wlosy, x, y + r * 0.6, z + r * 0.66, -0.35, 0, 0),
    cz(kulaG(r * 0.2, 5, 4), SKORA, x - r * 0.93, y - r * 0.05, z), cz(kulaG(r * 0.2, 5, 4), SKORA, x + r * 0.93, y - r * 0.05, z),
    cz(kulaG(r * 0.17, 6, 4), BIALKO, x - r * 0.36, y + r * 0.14, z + r * 0.83), cz(kulaG(r * 0.17, 6, 4), BIALKO, x + r * 0.36, y + r * 0.14, z + r * 0.83),
    cz(kulaG(r * 0.1, 5, 4), OCZY, x - r * 0.36, y + r * 0.14, z + r * 0.97), cz(kulaG(r * 0.1, 5, 4), OCZY, x + r * 0.36, y + r * 0.14, z + r * 0.97),
    cz(box(r * 0.44, r * 0.09, r * 0.1), wlosy, x - r * 0.37, y + r * 0.38, z + r * 0.88, 0, 0, 0.12), cz(box(r * 0.44, r * 0.09, r * 0.1), wlosy, x + r * 0.37, y + r * 0.38, z + r * 0.88, 0, 0, -0.12),
    cz(kulaG(r * 0.19, 6, 5), '#e8a77a', x, y - r * 0.08, z + r * 1.0, 0.3, 0, 0, 0.85, 1.25, 1),
    cz(kulaG(r * 0.16, 6, 4), POLICZKI, x - r * 0.55, y - r * 0.22, z + r * 0.74, 0, 0, 0, 1, 0.6, 0.5), cz(kulaG(r * 0.16, 6, 4), POLICZKI, x + r * 0.55, y - r * 0.22, z + r * 0.74, 0, 0, 0, 1, 0.6, 0.5),
  ];
  if (broda) c.push(cz(kulaG(r * 0.72, 10, 6), wlosy, x, y - r * 0.62, z + r * 0.38, 0.25, 0, 0, 1.02, 0.95, 0.78),
    cz(box(r * 0.7, r * 0.14, r * 0.16), wlosy, x, y - r * 0.32, z + r * 0.9, 0, 0, 0));
  else c.push(cz(box(r * 0.42, r * 0.07, r * 0.06), USTA, x, y - r * 0.42, z + r * 0.9));
  return c;
}
// nakrycia głowy: słomkowy kapelusz, stożkowy hełm z nosalem i kolczym czepcem, kaptur z peleryną
function nakrycie(rodzaj, k, ciemny, y = 0.98, z = 0) {
  if (rodzaj === 'kapelusz') return [cz(cyl(0.175, 0.185, 0.016, 14), SLOMA, 0, y + 0.1, z - 0.03, -0.22, 0, 0), cz(cyl(0.1, 0.112, 0.06, 16), SLOMA, 0, y + 0.135, z - 0.04, -0.22, 0, 0), cz(czapa(0.1, Math.PI / 2), SLOMA, 0, y + 0.16, z - 0.045, -0.22, 0, 0), cz(cyl(0.114, 0.114, 0.022, 16), k, 0, y + 0.12, z - 0.035, -0.22, 0, 0)];
  if (rodzaj === 'helm') return [cz(stozek(0.122, 0.2, 14), METAL, 0, y + 0.15, z - 0.005), cz(cyl(0.124, 0.124, 0.03, 14), '#8f949c', 0, y + 0.055, z - 0.005),
    cz(box(0.022, 0.1, 0.02), '#8f949c', 0, y + 0.0, z + 0.118), cz(kula(0.022, 6), METAL, 0, y + 0.255, z),
    cz(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 14, 1, true, 0.9, Math.PI * 2 - 1.8), '#8f949c', 0, y - 0.03, z - 0.005), cz(box(0.024, 0.05, 0.2), ciemny, 0, y + 0.14, z, 0, 0, 0)];
  if (rodzaj === 'kaptur') return [cz(new THREE.SphereGeometry(0.135, 16, 10, 0, Math.PI * 2, 0, 1.95), ciemny, 0, y + 0.015, z - 0.025, -0.35, 0, 0), cz(stozek(0.2, 0.16, 16), ciemny, 0, y - 0.13, z - 0.01)];
  return [];
}
// człowiek (wzrost około 1,1): buty, onuce z rzemykami, portki, lniana koszula do kolan w kolorze strony z haftowanym brzegiem,
// pas ze sprzączką, ramiona z łokciami i dłońmi, szyja, głowa; prawa ręka może być osobno (osadnik), bezRak: bez obu rąk (trening)
function czlowiek(k, ciemny, glowa = 'kapelusz', prawa = true, wlosy = WLOSY[0], broda = false, bezRak = false) {
  const N0 = 0.52, c = [];
  for (const sx of [-1, 1]) {
    const x = sx * 0.075, zn = -sx;
    c.push(st(cz(kulaG(0.052, 8, 5), BUTY, x, 0.035, 0.03, 0, 0, 0, 1, 0.68, 1.75), 1, N0, zn),
      st(cz(kaps(0.045, 0.18, 8), ONUCE, x, 0.17, 0), 1, N0, zn),
      st(cz(cyl(0.048, 0.048, 0.014, 8), RZEMYK, x, 0.12, 0, 0.25, 0, 0), 1, N0, zn), st(cz(cyl(0.048, 0.048, 0.014, 8), RZEMYK, x, 0.21, 0, -0.25, 0, 0), 1, N0, zn),
      st(cz(kaps(0.058, 0.17, 8), SPODNIE, x, 0.36, 0), 1, N0, zn));
  }
  c.push(cz(cyl(0.145, 0.19, 0.24, 14), k, 0, 0.42, 0, 0, 0, 0, 1, 1, 0.88),
    cz(cyl(0.192, 0.192, 0.03, 14), HAFT, 0, 0.31, 0, 0, 0, 0, 1, 1, 0.88), cz(cyl(0.194, 0.194, 0.01, 14), ciemny, 0, 0.33, 0, 0, 0, 0, 1, 1, 0.88),
    cz(kaps(0.145, 0.17, 12), k, 0, 0.66, 0, 0, 0, 0, 1.14, 1, 0.78),
    cz(cyl(0.155, 0.158, 0.045, 14), RZEMYK, 0, 0.535, 0, 0, 0, 0, 1.06, 1, 0.82), cz(box(0.05, 0.04, 0.02), METAL, 0, 0.535, 0.13),
    cz(cyl(0.07, 0.085, 0.03, 14), HAFT, 0, 0.83, 0), cz(box(0.03, 0.1, 0.012), HAFT, 0, 0.77, 0.115),
    cz(cyl(0.048, 0.054, 0.08, 10), SKORA, 0, 0.86, 0),
    ...glowaZ(0, 0.98, 0, wlosy, 0.11, broda), ...nakrycie(glowa, k, ciemny));
  // ramiona: bark, ramię, łokieć, przedramię z haftowanym mankietem, dłoń (lewa zawsze, prawa gdy prawa = true)
  const reka = (sx, zn) => [
    st(cz(kulaG(0.06, 8, 6), k, sx * 0.17, 0.77, 0), 1, 0.77, zn),
    st(cz(kaps(0.045, 0.15, 8), k, sx * 0.205, 0.66, 0, 0, 0, sx * 0.1), 1, 0.77, zn),
    st(cz(kaps(0.04, 0.13, 8), k, sx * 0.22, 0.5, 0.025, -0.12, 0, sx * 0.04), 1, 0.77, zn),
    st(cz(cyl(0.044, 0.044, 0.025, 8), HAFT, sx * 0.222, 0.43, 0.03), 1, 0.77, zn),
    st(cz(kulaG(0.042, 6, 5), SKORA, sx * 0.224, 0.39, 0.035, 0, 0, 0, 0.9, 1.15, 1), 1, 0.77, zn)];
  if (!bezRak) c.push(...reka(-1, 0.7));
  if (prawa && !bezRak) c.push(...reka(1, -0.4));
  return c;
}
// osadnik bez prawej ręki: ręka z narzędziem to osobna część, która się rusza (ramie3D); w: wariant (włosy, broda)
const WARIANTY = [[1, true], [4, false], [0, true], [3, false], [2, true], [5, true]];
export const osadnik = cache((strona, w = 0, trening = 0) => { const [wl, br] = WARIANTY[(w + strona * 2) % WARIANTY.length]; return polacz(czlowiek(KOLORY_STRON[strona], CIEMNIEJ[strona], 'kapelusz', false, WLOSY[wl], br, !!trening)); });
// prawa ręka z narzędziem; punkt obrotu (0, 0, 0) to bark, ręka zwisa w dół, narzędzie wskazuje do przodu
// narzędzia: 'reka' (sama ręka), 'zrywa' (jagoda w dłoni), 'mlotek', 'siekiera', 'kilof'
export const ramie3D = cache((narz, strona) => {
  const k = KOLORY_STRON[strona], dl = -0.36;
  const c = [cz(kulaG(0.06, 8, 6), k, -0.03, 0, 0), cz(kaps(0.045, 0.15, 8), k, 0, -0.11, 0), cz(kaps(0.04, 0.13, 8), k, 0, -0.27, 0.01), cz(cyl(0.044, 0.044, 0.025, 8), HAFT, 0, -0.335, 0.012),
    cz(kulaG(0.044, 6, 5), SKORA, 0, dl, 0.012, 0, 0, 0, 0.9, 1.15, 1)];
  if (narz === 'zrywa') c.push(cz(kula(0.06, 6), '#3a4bb0', 0, dl - 0.02, 0.05));
  if (narz === 'mlotek') c.push(cz(cyl(0.022, 0.022, 0.34, 6), BRAZ, 0, dl, 0.15, Math.PI / 2, 0, 0), cz(box(0.07, 0.15, 0.08), '#555b63', 0, dl, 0.31));
  if (narz === 'siekiera') c.push(cz(cyl(0.022, 0.022, 0.55, 6), BRAZ, 0, dl, 0.22, Math.PI / 2, 0, 0), cz(box(0.03, 0.17, 0.12), METAL, 0, dl + 0.07, 0.44));
  if (narz === 'kilof') c.push(cz(cyl(0.022, 0.022, 0.55, 6), BRAZ, 0, dl, 0.22, Math.PI / 2, 0, 0), cz(box(0.04, 0.42, 0.05), '#555b63', 0, dl, 0.47), cz(stozek(0.03, 0.08, 4), METAL, 0, dl + 0.25, 0.47), cz(stozek(0.03, 0.08, 4), METAL, 0, dl - 0.25, 0.47, Math.PI, 0, 0));
  return polacz(c);
});
// ręka w gardzie do treningu (bark w (0, 0, 0)): ramię w dół i do przodu, przedramię w górę, pięść owinięta rzemieniem przy brodzie
export const piesc3D = cache(strona => {
  const k = KOLORY_STRON[strona];
  return polacz([cz(kulaG(0.06, 8, 6), k, 0, 0, 0), cz(kaps(0.045, 0.13, 8), k, 0, -0.08, 0.06, 0.7, 0, 0), cz(kaps(0.04, 0.12, 8), k, 0, -0.06, 0.2, -0.6, 0, 0),
    cz(kulaG(0.058, 10, 8), '#8a5a32', 0, 0.03, 0.26, 0, 0, 0, 1, 1, 1.1), cz(cyl(0.05, 0.05, 0.03, 10), HAFT, 0, -0.02, 0.23, -0.6, 0, 0)]);
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
  return polacz([...czlowiek(METAL, d, 'helm', true, WLOSY[0], true), cz(kaps(0.15, 0.17, 16), k, 0, 0.645, 0.003, 0, 0, 0, 1.19, 1.03, 0.82), cz(cyl(0.165, 0.17, 0.05, 16), HAFT, 0, 0.5, 0, 0, 0, 0, 1.12, 1, 0.84), cz(stozek(0.05, 0.18, 6), k, 0, 1.3, 0),
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
// koń (gniady, kary albo biały); s = wielkość; zwraca części konia (głowa w stronę +z); kapa: derka w kolorze strony
function kon(s, sierc, grzywa, kapa = null) {
  const nogi = sierc, kopyto = '#2a2420';
  const c = [
    cz(kaps(0.23 * s, 0.55 * s, 12), sierc, 0, 0.8 * s, -0.02, Math.PI / 2, 0, 0),
    cz(kaps(0.1 * s, 0.34 * s, 8), sierc, 0, 1.08 * s, 0.42 * s, -0.75, 0, 0),
    cz(kulaG(0.13 * s, 12, 8), sierc, 0, 1.28 * s, 0.6 * s, 0.5, 0, 0, 0.75, 0.8, 1.6),
    cz(kulaG(0.08 * s, 8, 6), '#3a2a22', 0, 1.2 * s, 0.78 * s, 0, 0, 0, 1, 0.8, 1),
    cz(kulaG(0.022, 6, 4), OCZY, -0.08 * s, 1.33 * s, 0.62 * s), cz(kulaG(0.022, 6, 4), OCZY, 0.08 * s, 1.33 * s, 0.62 * s),
    cz(stozek(0.035 * s, 0.12 * s, 5), sierc, -0.06 * s, 1.45 * s, 0.52 * s, -0.2, 0, 0.2), cz(stozek(0.035 * s, 0.12 * s, 5), sierc, 0.06 * s, 1.45 * s, 0.52 * s, -0.2, 0, -0.2),
    // grzywa i ogon
    cz(box(0.06 * s, 0.1 * s, 0.42 * s), grzywa, 0, 1.2 * s, 0.32 * s, -0.75, 0, 0), cz(box(0.07 * s, 0.07 * s, 0.1 * s), grzywa, 0, 1.4 * s, 0.56 * s),
    st(cz(kaps(0.06 * s, 0.38 * s, 6), grzywa, 0, 0.72 * s, -0.55 * s, 0.5, 0, 0), 2, 0, 0.08),
  ];
  for (const sx of [-0.12, 0.12]) for (const sz of [-0.34, 0.34]) { const zn = sx * sz > 0 ? 1 : -1; c.push(st(cz(cyl(0.05 * s, 0.04 * s, 0.6 * s, 8), nogi, sx * s, 0.32 * s, sz * s), 1, 0.62 * s, zn, sz * s), st(cz(cyl(0.055 * s, 0.055 * s, 0.07, 8), kopyto, sx * s, 0.035, sz * s), 1, 0.62 * s, zn, sz * s)); }
  if (kapa) c.push(cz(box(0.52 * s, 0.34 * s, 0.75 * s), kapa, 0, 0.78 * s, -0.05 * s), cz(box(0.53 * s, 0.05 * s, 0.76 * s), '#f2c94c', 0, 0.62 * s, -0.05 * s));
  return c;
}
// jeźdźcy na koniach: zwiadowca na gniadym, jeździec w zbroi, pancerny na karym koniu w derce
function jazda(strona, zwierze, zbroja) {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  const ciezki = zwierze === 'los', s = ciezki ? 1.12 : 1;
  const c = kon(s, ciezki ? '#2e2420' : zbroja ? '#6b4428' : '#8a5a32', ciezki ? '#141010' : '#2e2018', ciezki ? k : null);
  c.push(cz(cyl(0.2, 0.24, 0.08, 12), k, 0, 1.04 * s, -0.05));
  // jeździec siedzi w siodle
  const b = 1.08 * s;
  c.push(cz(kaps(0.055, 0.22), SPODNIE, -0.2, b - 0.08, 0.05, 0.5, 0, -0.35), cz(kaps(0.055, 0.22), SPODNIE, 0.2, b - 0.08, 0.05, 0.5, 0, 0.35),
    cz(kaps(0.14, 0.16, 14), zbroja ? METAL : k, 0, b + 0.24, -0.04, 0, 0, 0, 1.12, 1, 0.8), cz(cyl(0.15, 0.15, 0.04, 14), RZEMYK, 0, b + 0.12, -0.04, 0, 0, 0, 1.08, 1, 0.84),
    cz(cyl(0.046, 0.052, 0.08, 10), SKORA, 0, b + 0.44, -0.03),
    cz(kaps(0.048, 0.2), zbroja ? METAL : k, -0.2, b + 0.22, 0.1, -0.9, 0, -0.2), cz(kulaG(0.048, 8, 6), SKORA, -0.22, b + 0.14, 0.24),
    ...glowaZ(0, b + 0.56, -0.02, WLOSY[strona ? 2 : 3], 0.11, zbroja));
  if (zbroja) c.push(...nakrycie('helm', k, d, b + 0.56, -0.02), cz(box(0.04, 0.38, 0.28), d, -0.25, b + 0.25, -0.05),
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
    cz(kula(0.17, 8), KAMIEN, 0, 1.22, 0.72), cz(kula(0.09, 6), KAMIEN2, 0.08, 1.3, 0.78), cz(box(0.92, 0.1, 0.3), k, 0, 0.5, -0.6)];
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) c.push(st(cz(cyl(0.2, 0.2, 0.1, 10), CIEMNE, sx, 0.2, sz, 0, 0, Math.PI / 2), 3, 0.2, 1, sz), st(cz(box(0.11, 0.36, 0.05), '#6b4527', sx, 0.2, sz), 3, 0.2, 1, sz));
  return polacz(c);
});
export const taran = cache(strona => {
  const k = KOLORY_STRON[strona];
  const c = [cz(box(0.9, 0.12, 1.6), DREWNO, 0, 0.35, 0), cz(dach4(0.95, 0.7), k, 0, 1.05, 0, 0, Math.PI / 4, 0, 1, 1, 1.75),
    cz(cyl(0.13, 0.13, 1.9, 8), BRAZ, 0, 0.6, 0.15, Math.PI / 2, 0, 0), cz(cyl(0.17, 0.13, 0.25, 8), METAL, 0, 0.6, 1.15, Math.PI / 2, 0, 0)];
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) c.push(st(cz(cyl(0.2, 0.2, 0.1, 10), CIEMNE, sx, 0.2, sz, 0, 0, Math.PI / 2), 3, 0.2, 1, sz), st(cz(box(0.11, 0.36, 0.05), '#6b4527', sx, 0.2, sz), 3, 0.2, 1, sz));
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
  for (const sx of [-0.42, 0.42]) c.push(st(cz(cyl(0.21, 0.21, 0.06, 12), '#5a3518', sx, 0.21, -0.38, 0, 0, Math.PI / 2), 3, 0.21, 1, -0.38), st(cz(cyl(0.06, 0.06, 0.08, 8), METAL, sx, 0.21, -0.38, 0, 0, Math.PI / 2), 3, 0.21, 1, -0.38),
    st(cz(box(0.07, 0.38, 0.05), '#3a2414', sx, 0.21, -0.38), 3, 0.21, 1, -0.38));
  // koń w zaprzęgu
  const z0 = 0.62;
  c.push(...przesunCz(kon(0.72, '#8a5a32', '#2e2018'), 0, 0, z0));
  c.push(cz(box(0.3, 0.05, 0.08), k, 0, 0.7, z0 + 0.08));
  return polacz(c);
});
// rzemieślnik: kaptur, skórzany fartuch, pas z narzędziami; prawa ręka z młotkiem to osobna część (jak u zbieracza)
export const rzemieslnik = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona], SKORA_F = '#7a5030';
  return polacz([...czlowiek(k, d, 'kaptur', false, WLOSY[3], true),
    cz(box(0.26, 0.36, 0.03), SKORA_F, 0, 0.42, 0.18), cz(box(0.2, 0.12, 0.03), SKORA_F, 0, 0.66, 0.125),
    cz(box(0.07, 0.09, 0.05), '#5e3d22', -0.17, 0.42, 0.13), cz(cyl(0.015, 0.015, 0.16, 5), '#555b63', -0.17, 0.5, 0.13),
    cz(box(0.09, 0.08, 0.05), '#5e3d22', 0.15, 0.42, 0.15), cz(box(0.05, 0.13, 0.03), METAL, 0.15, 0.5, 0.15)]);
});
// ---------- stwory z dawnych wierzeń (nasze projekty) ----------
const OCZY_ZAR = '#ffe14a', OCZY_CZ = '#ff3a2a';
// przesuwa (i powiększa) części razem z punktami obrotu nóg i rąk
function przesunCz(czesci, x, y, z, sk = 1) {
  const m = new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeScale(sk, sk, sk));
  for (const p of czesci) { p.m.premultiply(m); if (p.s && p.s[0] === 1) p.s = [1, p.s[1] * sk + y, p.s[2], p.s[3] * sk + z]; }
  return czesci;
}
// Raróg: ognisty ptak (unosi się nad ziemią, skrzydła falują na wietrze)
export const rarog = cache(strona => {
  const k = KOLORY_STRON[strona];
  const c = [cz(kulaG(0.24, 12, 10), '#ff7a1a', 0, 0.45, 0, 0, 0, 0, 0.9, 0.85, 1.25), cz(kulaG(0.18, 10, 8), '#ffb347', 0, 0.42, 0.12, 0, 0, 0, 0.8, 0.8, 1),
    cz(kulaG(0.14, 10, 8), '#ff8a2a', 0, 0.68, 0.26), cz(stozek(0.05, 0.16, 6), '#ffd84a', 0, 0.66, 0.44, Math.PI / 2, 0, 0),
    cz(kulaG(0.025, 6, 4), OCZY, -0.07, 0.72, 0.36), cz(kulaG(0.025, 6, 4), OCZY, 0.07, 0.72, 0.36),
    cz(stozek(0.05, 0.22, 5), '#ff3a1a', 0, 0.86, 0.2, -0.4, 0, 0), cz(stozek(0.04, 0.18, 5), '#ffd84a', -0.06, 0.82, 0.16, -0.6, 0, 0.3), cz(stozek(0.04, 0.18, 5), '#ffd84a', 0.06, 0.82, 0.16, -0.6, 0, -0.3),
    cz(cyl(0.2, 0.2, 0.05, 10), k, 0, 0.58, 0.05, 0.3, 0, 0)];
  for (const sx of [-1, 1]) {
    c.push(st(cz(box(0.6, 0.04, 0.3), '#ff6a10', sx * 0.45, 0.55, -0.02, 0, 0, sx * -0.35), 2, 0, 0.14), st(cz(box(0.4, 0.035, 0.22), '#ffd84a', sx * 0.78, 0.66, -0.06, 0, 0, sx * -0.5), 2, 0, 0.16));
    c.push(cz(stozek(0.06, 0.5, 4), sx > 0 ? '#ff3a1a' : '#ffb347', sx * 0.06, 0.42, -0.45, -Math.PI / 2 - 0.3, 0, 0));
  }
  c.push(cz(stozek(0.07, 0.6, 4), '#ffd84a', 0, 0.45, -0.5, -Math.PI / 2 - 0.2, 0, 0));
  return polacz(c);
});
// Leszy: duch puszczy, olbrzym z pnia i gałęzi, z mchem na głowie i świecącymi oczami
export const leszy = cache(strona => {
  const k = KOLORY_STRON[strona], KORA = '#6b4527', KORA2 = '#5a3d26', MECH = '#4a8f3a';
  const c = [
    st(cz(cyl(0.13, 0.16, 0.75, 7), KORA2, -0.2, 0.37, 0), 1, 0.75, -1), st(cz(cyl(0.13, 0.16, 0.75, 7), KORA2, 0.2, 0.37, 0), 1, 0.75, 1),
    cz(cyl(0.32, 0.36, 1.1, 9), KORA, 0, 1.25, 0), cz(cyl(0.34, 0.34, 0.12, 9), k, 0, 1.05, 0),
    cz(kulaG(0.34, 10, 8), MECH, 0, 1.95, -0.02, 0, 0, 0, 1.1, 0.8, 1.1), cz(kulaG(0.22, 8, 6), '#5fa04a', 0.18, 2.12, 0.05), cz(kulaG(0.2, 8, 6), '#3f7a30', -0.2, 2.1, -0.05),
    cz(kulaG(0.05, 6, 4), OCZY_ZAR, -0.12, 1.72, 0.3), cz(kulaG(0.05, 6, 4), OCZY_ZAR, 0.12, 1.72, 0.3),
    cz(box(0.34, 0.3, 0.06), MECH, 0, 1.45, 0.32), cz(stozek(0.05, 0.35, 5), MECH, 0, 1.25, 0.32, Math.PI, 0, 0),
  ];
  for (const sx of [-1, 1]) c.push(st(cz(cyl(0.07, 0.1, 0.8, 6), KORA, sx * 0.48, 1.35, 0.05, 0, 0, sx * 0.5), 1, 1.65, sx * 0.6),
    st(cz(cyl(0.03, 0.04, 0.45, 5), KORA2, sx * 0.72, 1.05, 0.15, 0.4, 0, sx * -0.3), 1, 1.65, sx * 0.6), cz(cyl(0.04, 0.05, 0.5, 5), KORA2, sx * 0.25, 2.2, -0.05, 0, 0, sx * -0.6), cz(kulaG(0.1, 6, 4), '#5fa04a', sx * 0.42, 2.38, -0.05));
  return polacz(c);
});
// Wilkołak: przygarbiony wilk na dwóch łapach
export const wilkolak = cache(strona => {
  const k = KOLORY_STRON[strona], SIERSC = '#6f6c70', SIERSC2 = '#4f4c52', JASNA = '#a8a4a8';
  const c = [
    st(cz(kaps(0.08, 0.32, 6), SIERSC2, -0.14, 0.28, -0.05, 0.25, 0, 0), 1, 0.5, -1), st(cz(kaps(0.08, 0.32, 6), SIERSC2, 0.14, 0.28, -0.05, 0.25, 0, 0), 1, 0.5, 1),
    cz(kaps(0.22, 0.4, 10), SIERSC, 0, 0.8, 0.05, 0.5, 0, 0), cz(kulaG(0.18, 8, 6), JASNA, 0, 0.82, 0.22, 0, 0, 0, 1, 1.1, 0.6),
    cz(box(0.46, 0.1, 0.36), k, 0, 0.62, -0.02, 0.4, 0, 0),
    cz(kulaG(0.17, 10, 8), SIERSC, 0, 1.18, 0.3), cz(box(0.14, 0.12, 0.24), SIERSC, 0, 1.12, 0.48), cz(kulaG(0.04, 6, 4), '#1a1a1a', 0, 1.14, 0.6),
    cz(box(0.1, 0.03, 0.12), '#f4f4f4', 0, 1.06, 0.5), cz(kulaG(0.03, 6, 4), OCZY_ZAR, -0.07, 1.24, 0.43), cz(kulaG(0.03, 6, 4), OCZY_ZAR, 0.07, 1.24, 0.43),
    cz(stozek(0.06, 0.16, 4), SIERSC2, -0.1, 1.38, 0.26), cz(stozek(0.06, 0.16, 4), SIERSC2, 0.1, 1.38, 0.26),
    st(cz(kaps(0.07, 0.4, 6), SIERSC, 0, 0.55, -0.38, -0.9, 0, 0), 2, 0, 0.1),
  ];
  for (const sx of [-1, 1]) c.push(st(cz(kaps(0.06, 0.35, 6), SIERSC, sx * 0.26, 0.82, 0.2, -0.5, 0, sx * -0.2), 1, 1.0, sx * 0.7), st(cz(stozek(0.04, 0.1, 4), '#f4f4f4', sx * 0.28, 0.62, 0.4, Math.PI / 2, 0, 0), 1, 1.0, sx * 0.7));
  return polacz(c);
});
// Płanetnik: duch chmur w szarym płaszczu, z laską, otoczony chmurkami
export const planetnik = cache(strona => {
  const k = KOLORY_STRON[strona], PLASZCZ = '#5f6b7a', CHMURA = '#e4eaf2';
  const c = [cz(stozek(0.32, 0.95, 12), PLASZCZ, 0, 0.47, 0), cz(kaps(0.16, 0.2, 10), PLASZCZ, 0, 0.95, 0), cz(cyl(0.2, 0.22, 0.06, 12), k, 0, 0.72, 0),
    ...glowaZ(0, 1.2, 0, '#d8dde3', 0.12, true), ...nakrycie('kaptur', PLASZCZ, '#4a5563', 1.2, 0), cz(stozek(0.09, 0.3, 8), '#eef2f6', 0, 1.0, 0.1, Math.PI, 0, 0),
    cz(cyl(0.025, 0.025, 1.5, 6), BRAZ, 0.3, 0.8, 0.12), cz(kulaG(0.08, 8, 6), '#bfe6ff', 0.3, 1.58, 0.12)];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.push(st(cz(kulaG(0.17 + (i % 2) * 0.05, 8, 6), CHMURA, Math.cos(a) * 0.42, 1.55 + (i % 3) * 0.08, Math.sin(a) * 0.42), 2, 0, 0.04)); }
  return polacz(c);
});
// Żmij: ognisty skrzydlaty wąż (unosi się nad ziemią)
export const zmij = cache(strona => {
  const k = KOLORY_STRON[strona], LUSKA = '#3f7a3a', LUSKA2 = '#c9a227', BRZUCH = '#e0a040';
  const c = [];
  for (let i = 0; i < 7; i++) { const t = i / 6, r = 0.2 - t * 0.12; c.push(st(cz(kulaG(r, 10, 8), i % 2 ? LUSKA : '#4f8a3a', Math.sin(t * 5) * 0.12, 0.45 - t * 0.15, 0.25 - t * 1.1), 2, 0, 0.05 + t * 0.05)); }
  c.push(cz(kulaG(0.2, 10, 8), BRZUCH, 0, 0.4, 0.25, 0, 0, 0, 0.9, 0.7, 1.1),
    cz(kaps(0.1, 0.3, 8), LUSKA, 0, 0.62, 0.45, -0.6, 0, 0), cz(kulaG(0.16, 10, 8), LUSKA, 0, 0.82, 0.62, 0, 0, 0, 0.9, 0.8, 1.3), cz(box(0.16, 0.08, 0.2), LUSKA2, 0, 0.76, 0.8),
    cz(kulaG(0.03, 6, 4), OCZY_ZAR, -0.08, 0.9, 0.72), cz(kulaG(0.03, 6, 4), OCZY_ZAR, 0.08, 0.9, 0.72),
    cz(stozek(0.03, 0.18, 5), LUSKA2, -0.08, 1.0, 0.55, -0.6, 0, 0.3), cz(stozek(0.03, 0.18, 5), LUSKA2, 0.08, 1.0, 0.55, -0.6, 0, -0.3),
    cz(stozek(0.05, 0.16, 4), k, 0, 0.98, 0.62, -0.3, 0, 0), cz(stozek(0.05, 0.14, 4), k, 0, 0.7, 0.1, -0.3, 0, 0));
  for (const sx of [-1, 1]) c.push(st(cz(box(0.75, 0.035, 0.45), LUSKA2, sx * 0.5, 0.62, 0.15, 0, 0, sx * -0.4), 2, 0, 0.12), st(cz(box(0.04, 0.04, 0.5), LUSKA, sx * 0.8, 0.78, 0.15, 0, 0, sx * -0.4), 2, 0, 0.12));
  return polacz(c);
});
// Rusałka: wodna panna w jasnozielonej sukni, z długimi włosami i wiankiem
export const rusalka = cache(strona => {
  const k = KOLORY_STRON[strona], SUKNIA = '#9fd8c8', WLOSY_R = '#3f7f5f';
  const c = [cz(stozek(0.3, 0.8, 12), SUKNIA, 0, 0.4, 0), cz(kaps(0.14, 0.18, 10), SUKNIA, 0, 0.78, 0), cz(cyl(0.15, 0.15, 0.04, 12), k, 0, 0.7, 0),
    cz(cyl(0.045, 0.05, 0.08, 10), SKORA, 0, 1.0, 0), ...glowaZ(0, 1.12, 0, WLOSY_R, 0.115), cz(kaps(0.1, 0.42, 8), WLOSY_R, 0, 0.88, -0.09),
    cz(new THREE.TorusGeometry(0.115, 0.025, 6, 14), '#4a8f3a', 0, 1.21, 0, Math.PI / 2, 0, 0)];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.push(cz(kulaG(0.03, 6, 4), ['#ffffff', '#ffd84a', '#ff9ccc'][i % 3], Math.cos(a) * 0.115, 1.23, Math.sin(a) * 0.115)); }
  for (const sx of [-1, 1]) c.push(st(cz(kaps(0.045, 0.24, 6), '#cfeee4', sx * 0.2, 0.82, 0.05, -0.4, 0, sx * -0.2), 1, 0.95, sx * 0.6), cz(kulaG(0.05, 6, 4), '#7fd0ff', sx * 0.24, 0.68, 0.18));
  return polacz(c);
});
// Biały Koń Świętowita: wielki biały koń w derce w kolorze strony, ze złotym ogłowiem
export const konSw = cache(strona => {
  const k = KOLORY_STRON[strona];
  const c = kon(1.3, '#f2f0ea', '#e3d7b8', k);
  c.push(cz(box(0.28, 0.05, 0.05), '#f2c94c', 0, 1.62, 0.8), cz(stozek(0.05, 0.22, 6), '#f2c94c', 0, 1.95, 0.72, -0.3, 0, 0));
  return polacz(c);
});
// Strzyga: blady nocny upiór w podartym ciemnym płaszczu, z długimi rękami i czerwonymi oczami
export const strzyga = cache(strona => {
  const k = KOLORY_STRON[strona], PLASZCZ = '#3b3550', SKORA_S = '#c9d1d9';
  const c = [st(cz(kaps(0.06, 0.35, 6), '#2a2638', -0.1, 0.25, 0), 1, 0.5, -1), st(cz(kaps(0.06, 0.35, 6), '#2a2638', 0.1, 0.25, 0), 1, 0.5, 1),
    cz(stozek(0.34, 0.95, 9), PLASZCZ, 0, 0.75, -0.02), cz(cyl(0.18, 0.2, 0.05, 10), k, 0, 0.85, 0),
    cz(kulaG(0.16, 10, 8), SKORA_S, 0, 1.36, 0.06), cz(kulaG(0.035, 6, 4), OCZY_CZ, -0.06, 1.4, 0.2), cz(kulaG(0.035, 6, 4), OCZY_CZ, 0.06, 1.4, 0.2),
    cz(box(0.1, 0.03, 0.02), '#f4f4f4', 0, 1.29, 0.21), cz(czapa(0.18, 1.6), '#1a1824', 0, 1.38, 0.0), cz(kaps(0.12, 0.3, 6), '#1a1824', 0, 1.15, -0.12)];
  for (const sx of [-1, 1]) c.push(st(cz(kaps(0.045, 0.5, 6), SKORA_S, sx * 0.3, 0.95, 0.12, -0.7, 0, sx * -0.25), 1, 1.15, sx * 0.7), st(cz(stozek(0.03, 0.14, 4), '#e8e8e8', sx * 0.36, 0.75, 0.42, Math.PI / 2 + 0.3, 0, 0), 1, 1.15, sx * 0.7));
  return polacz(c);
});
// Bies: rogaty, kudłaty demon z Bieszczad
export const bies = cache(strona => {
  const k = KOLORY_STRON[strona], FUTRO = '#4a3326', FUTRO2 = '#33241b', ROG = '#d9c7a3';
  const c = [st(cz(kaps(0.12, 0.4, 7), FUTRO2, -0.2, 0.35, 0), 1, 0.65, -1), st(cz(kaps(0.12, 0.4, 7), FUTRO2, 0.2, 0.35, 0), 1, 0.65, 1),
    st(cz(cyl(0.12, 0.12, 0.08, 7), '#1a1410', -0.2, 0.04, 0.03), 1, 0.65, -1), st(cz(cyl(0.12, 0.12, 0.08, 7), '#1a1410', 0.2, 0.04, 0.03), 1, 0.65, 1),
    cz(kaps(0.36, 0.45, 12), FUTRO, 0, 1.05, 0, 0.15, 0, 0), cz(box(0.7, 0.14, 0.5), k, 0, 0.82, 0),
    cz(kulaG(0.25, 10, 8), FUTRO, 0, 1.68, 0.12), cz(box(0.22, 0.14, 0.16), '#5a3d2e', 0, 1.6, 0.32),
    cz(kulaG(0.045, 6, 4), OCZY_CZ, -0.1, 1.74, 0.32), cz(kulaG(0.045, 6, 4), OCZY_CZ, 0.1, 1.74, 0.32), cz(box(0.14, 0.03, 0.02), '#f4f4f4', 0, 1.52, 0.4),
    st(cz(kaps(0.05, 0.5, 6), FUTRO2, 0, 0.75, -0.42, -1.0, 0, 0), 2, 0, 0.1), cz(stozek(0.07, 0.14, 4), FUTRO2, 0, 0.6, -0.72, -1.6, 0, 0)];
  for (const sx of [-1, 1]) {
    c.push(cz(stozek(0.06, 0.38, 6), ROG, sx * 0.2, 1.98, 0.08, -0.2, 0, sx * -0.5), cz(stozek(0.035, 0.2, 5), ROG, sx * 0.35, 2.15, 0.02, -0.5, 0, sx * -1.1));
    c.push(st(cz(kaps(0.09, 0.45, 7), FUTRO, sx * 0.45, 1.1, 0.1, -0.4, 0, sx * -0.2), 1, 1.35, sx * 0.7), st(cz(kulaG(0.1, 6, 4), FUTRO2, sx * 0.5, 0.78, 0.3), 1, 1.35, sx * 0.7));
  }
  return polacz(c);
});
// ---------- bohaterowie z podań ----------
const ZLOTO = '#f2c94c', CZERWIEN = '#c8281e';
// Krak: książę w złotej koronie, czerwony płaszcz, miecz
export const krak = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  const c = [...czlowiek(k, d, '', true, '#8a5a2b', true), cz(box(0.4, 0.66, 0.035), CZERWIEN, 0, 0.5, -0.15, 0.1, 0, 0), cz(cyl(0.05, 0.05, 0.04, 8), ZLOTO, 0.15, 0.8, 0.08),
    cz(cyl(0.118, 0.112, 0.06, 16), ZLOTO, 0, 1.075, -0.005)];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.push(cz(stozek(0.028, 0.08, 4), ZLOTO, Math.cos(a) * 0.105, 1.14, Math.sin(a) * 0.105), cz(kula(0.016, 5), CZERWIEN, Math.cos(a) * 0.117, 1.075, Math.sin(a) * 0.117)); }
  c.push(cz(box(0.04, 0.62, 0.07), METAL, 0.3, 0.78, 0.15, 0.5, 0, 0), cz(box(0.18, 0.04, 0.06), ZLOTO, 0.27, 0.53, 0.03, 0.5, 0, 0), cz(kula(0.03, 6), ZLOTO, 0.26, 0.48, -0.0));
  return polacz(c);
});
// Waligóra: wielki siłacz z maczugą z pnia
export const waligora = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona];
  const c = przesunCz([...czlowiek('#7a5030', d, '', true, '#c98e4a', true), cz(box(0.3, 0.09, 0.03), k, 0, 0.7, 0.12, 0, 0, 0.6), cz(box(0.3, 0.09, 0.03), k, 0, 0.7, -0.12, 0, 0, -0.6),
    cz(cyl(0.07, 0.12, 1.0, 7), '#6b4527', 0.32, 0.95, 0.2, 0.6, 0, 0), cz(kula(0.05, 5), '#4a8f3a', 0.32, 1.35, 0.5)], 0, 0, 0, 1.3);
  return polacz(c);
});
// Lech: hełm z nosalem, czerwona tarcza z białym orłem, włócznia, czerwony płaszcz
export const lech = cache(strona => {
  const k = KOLORY_STRON[strona], d = CIEMNIEJ[strona], BIALY = '#f4f4f0';
  const c = [...czlowiek(k, d, 'helm', true, '#5b3a22', true), cz(box(0.4, 0.66, 0.035), CZERWIEN, 0, 0.5, -0.15, 0.1, 0, 0), cz(cyl(0.05, 0.05, 0.04, 8), ZLOTO, -0.15, 0.8, 0.08),
    cz(cyl(0.025, 0.025, 1.7), BRAZ, 0.28, 0.95, 0.08), cz(stozek(0.05, 0.2, 6), METAL, 0.28, 1.9, 0.08),
    cz(box(0.06, 0.62, 0.46), CZERWIEN, -0.3, 0.62, 0.06),
    cz(kulaG(0.06, 6, 4), BIALY, -0.34, 0.72, 0.06), cz(box(0.02, 0.06, 0.3), BIALY, -0.34, 0.66, 0.06), cz(box(0.02, 0.16, 0.08), BIALY, -0.34, 0.55, 0.06),
    cz(box(0.02, 0.05, 0.05), ZLOTO, -0.34, 0.76, 0.06)];
  return polacz(c);
});
// pociski stworów: ogień (Raróg, Żmij), woda (Rusałka), grad (Płanetnik)
export const pociskStwora = cache(typ => {
  if (typ === 'rusalka') return polacz([cz(kulaG(0.1, 8, 6), '#7fd0ff'), cz(kulaG(0.06, 6, 4), '#e0f6ff', 0.03, 0.03, 0.03)]);
  if (typ === 'planetnik') return polacz([cz(new THREE.IcosahedronGeometry(0.1), '#eef6ff'), cz(new THREE.IcosahedronGeometry(0.07), '#cfe6ff', 0.08, 0.02, 0)]);
  return polacz([cz(kulaG(0.13, 8, 6), '#ff7a1a'), cz(kulaG(0.08, 6, 4), '#ffd84a', 0, 0.04, 0.03)]);
});
export const JEDNOSTKI3D = { rarog, leszy, wilkolak, planetnik, zmij, rusalka, kon: konSw, strzyga, bies, krak, waligora, lech, rzemieslnik, osadnik, wojownik, tarczownik, obronca, wlocznik, pikinier, procarz, procarz2, kusznik, zwiadowca, jezdziec, rycerz, taran, katapulta, woz };

// ---------- budynki w stylu słowiańskim (nasze projekty; środek modelu = środek budynku, podłoga na y = 0) ----------
// kolor gracza widać na kalenicach, okiennicach i chorągiewkach; dachy są ze strzechy albo z gontu
const BAL = '#c08a52', BAL2 = '#a87443', STRZECHA = '#d4b265', STRZECHA2 = '#b8954c', GONT = '#7b5a3c', GONT2 = '#6a4c31', BIEL = '#efe6d2',
  DACHOWKA = '#a5452f', DACHOWKA2 = '#8a3826', LUPEK = '#5d6470', LUPEK2 = '#4a505b',
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
  const ciem = { [STRZECHA]: STRZECHA2, [DACHOWKA]: DACHOWKA2, [LUPEK]: LUPEK2 }[kolor] || GONT2;
  c.push(cz(box(L + 0.02, 0.05, 0.12), ciem, cx, yB + 0.02, cz0 + D - 0.04), cz(box(L + 0.02, 0.05, 0.12), ciem, cx, yB + 0.02, cz0 - D + 0.04));
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
  // żerdzie wzdłuż płotu (cienka belka wzdłuż osi z obrócona do kierunku płotu)
  for (const y of [h * 0.4, h * 0.8]) c.push(cz(box(0.035, 0.035, d), kol, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, ry, 0));
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

// brama na 4 kratki (od x = -2 do 2): dwa filary, belka (albo łuk z cegły) i dwa skrzydła wrót; otwarte skrzydła są obrócone do +z
function brama3D(poziom, zamk, k) {
  const c = [], CEG = '#b5553a', CEG2 = '#9c4630', STAL = '#4a4f57', WROTA = '#8a5530', OKUCIA = '#5a3518', W = 4, H = W / 2;
  if (poziom === 1) {
    for (const sx of [-1, 1]) {
      const x = sx * (H - 0.18);
      c.push(cz(cyl(0.17, 0.19, 2.1, 8), BAL, x, 1.05, 0), cz(stozek(0.17, 0.32, 8), BAL2, x, 2.26, 0));
      c.push(cz(cyl(0.11, 0.12, 1.6, 6), BAL2, x, 0.8, 0.22), cz(cyl(0.11, 0.12, 1.6, 6), BAL2, x, 0.8, -0.22));
    }
    c.push(cz(box(W, 0.2, 0.32), '#6b4527', 0, 1.88, 0), cz(box(W - 0.7, 0.13, 0.34), k, 0, 1.69, 0));
    // daszek nad przejściem
    c.push(cz(box(W - 1.2, 0.08, 0.72), GONT, 0, 2.13, 0.17, 0.45, 0, 0), cz(box(W - 1.2, 0.08, 0.72), GONT, 0, 2.13, -0.17, -0.45, 0, 0), cz(box(W - 1.1, 0.07, 0.07), BAL2, 0, 2.3, 0));
  } else {
    for (const sx of [-1, 1]) {
      const x = sx * (H - 0.25);
      c.push(cz(box(0.5, 0.22, 1.0), KAMIEN2, x, 0.11, 0));
      for (let i = 0; i < 7; i++) c.push(cz(box(0.44, 0.27, 0.94), i % 2 ? CEG : CEG2, x, 0.355 + i * 0.27, 0));
      c.push(cz(box(0.52, 0.1, 1.0), KAMIEN, x, 2.24, 0), cz(box(0.2, 0.22, 0.2), CEG, x - 0.12, 2.4, -0.3), cz(box(0.2, 0.22, 0.2), CEG, x + 0.12, 2.4, 0.3));
    }
    c.push(cz(box(W - 0.9, 0.38, 0.94), CEG, 0, 1.99, 0), cz(box(W - 0.8, 0.08, 1.0), KAMIEN, 0, 2.22, 0), cz(box(W - 1.8, 0.16, 0.96), k, 0, 1.92, 0));
    for (const x of [-1.05, -0.35, 0.35, 1.05]) c.push(cz(box(0.24, 0.2, 0.24), CEG, x, 2.36, 0));
    if (poziom === 3) {
      for (const sx of [-1, 1]) for (const y of [0.6, 1.3]) c.push(cz(box(0.48, 0.06, 0.98), STAL, sx * (H - 0.25), y, 0));
      c.push(cz(box(W - 0.88, 0.06, 0.98), STAL, 0, 1.82, 0), cz(box(W - 0.88, 0.06, 0.98), STAL, 0, 2.14, 0));
      for (const x of [-1.2, -0.6, 0, 0.6, 1.2]) c.push(cz(kula(0.035, 4), METAL, x, 1.99, 0.48), cz(kula(0.035, 4), METAL, x, 1.99, -0.48));
    }
  }
  // skrzydła wrót: zawias przy filarze, każde do połowy przejścia
  const zaw = poziom === 1 ? H - 0.35 : H - 0.49, sz = zaw - 0.02, h = poziom === 1 ? 1.5 : 1.72;
  for (const sx of [-1, 1]) {
    const czesci = [cz(box(sz, h, 0.1), WROTA, 0, h / 2 + 0.05, 0)];
    for (let i = 1; i < 5; i++) czesci.push(cz(box(0.025, h, 0.11), OKUCIA, -sz / 2 + i * sz / 5, h / 2 + 0.05, 0));
    czesci.push(cz(box(sz, 0.08, 0.12), poziom === 3 ? STAL : OKUCIA, 0, 0.35, 0), cz(box(sz, 0.08, 0.12), poziom === 3 ? STAL : OKUCIA, 0, h - 0.2, 0));
    czesci.push(cz(box(Math.hypot(sz, h - 0.6) - 0.05, 0.07, 0.12), OKUCIA, 0, h / 2 + 0.05, 0, 0, 0, sx * Math.atan2(h - 0.6, sz)));
    czesci.push(cz(box(sz * 0.8, 0.1, 0.12), k, 0, h * 0.62, 0));
    // środek skrzydła względem zawiasu: zamknięte leży w linii bramy, otwarte obrócone o 90° (do +z)
    const ry = zamk ? 0 : sx * Math.PI / 2 * 0.92, ox = -sx * sz / 2;
    c.push(...obroc(czesci.map(p => { p.m.premultiply(new THREE.Matrix4().makeTranslation(sx * zaw + ox, 0, 0)); return p; }), ry, sx * zaw, 0));
  }
  return c;
}
// renifer z porożem i uprzężą w kolorze gracza (patrzy w stronę +x); x, z, ry: gdzie stoi i jak jest obrócony
function renifer(k, x, z, ry) {
  const F = '#8a6a4a', J = '#ece4d2', R = '#d9c7a3', p = [
    cz(kaps(0.13, 0.32, 8), F, 0, 0.52, 0, 0, 0, Math.PI / 2), cz(kula(0.1, 7), J, 0.2, 0.55, 0, 0, 0, 0, 1, 1.2, 1.3),
    cz(cyl(0.06, 0.075, 0.3, 7), F, 0.25, 0.7, 0, 0, 0, -0.6), cz(box(0.22, 0.12, 0.11), F, 0.38, 0.82, 0), cz(kula(0.035, 5), CIEMNE, 0.5, 0.8, 0),
    cz(kula(0.05, 5), J, -0.28, 0.58, 0), cz(box(0.06, 0.15, 0.17), k, 0.22, 0.64, 0, 0, 0, -0.6)];
  for (const [lx, lz] of [[0.17, 0.07], [0.17, -0.07], [-0.17, 0.07], [-0.17, -0.07]]) p.push(cz(cyl(0.028, 0.02, 0.38, 5), F, lx, 0.19, lz), cz(cyl(0.03, 0.03, 0.04, 5), CIEMNE, lx, 0.02, lz));
  for (const sx of [-1, 1]) p.push(cz(cyl(0.013, 0.013, 0.32, 4), R, 0.33, 1.0, sx * 0.1, sx * 0.55, 0, 0.15), cz(cyl(0.011, 0.011, 0.15, 4), R, 0.41, 1.05, sx * 0.14, sx * 0.3, 0, -0.9),
    cz(cyl(0.011, 0.011, 0.14, 4), R, 0.27, 1.1, sx * 0.17, sx * 0.6, 0, 0.6), cz(cyl(0.01, 0.01, 0.12, 4), R, 0.35, 1.15, sx * 0.2, sx * 0.9, 0, -0.3));
  const m = new THREE.Matrix4().makeTranslation(x, 0, z).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(new THREE.Matrix4().makeScale(1.45, 1.45, 1.45));
  for (const q of p) q.m.premultiply(m);
  return p;
}
const BUD = {
  // Dworek Jagodowy: dwór z bali na kamiennej podmurówce, ganek na słupach, wysoki dach z gontu, dzwonniczka
  ratusz(k, d) {
    const c = [cz(box(3.5, 0.26, 3.0), KAMIEN2, 0, 0.13, -0.25), cz(box(3.56, 0.06, 3.06), KAMIEN, 0, 0.27, -0.25),
      ...zrab(0, -0.3, 3.0, 2.3, 1.45, 0.085, 0.28),
      ...dach(0, -0.3, 1.68, 3.6, 1.55, 1.25, DACHOWKA, k, 2.3),
      // ganek
      cz(box(1.7, 0.14, 0.9), BAL2, 0, 0.35, 1.3), cz(box(0.5, 0.08, 0.3), KAMIEN, 0, 0.18, 1.85),
      ...dach(0, 1.3, 1.2, 1.9, 0.62, 0.36, DACHOWKA, k, 0, BAL, false),
      ...drzwi(0, 0.42, 0.86, 0.5, 0.8),
      cz(kula(0.1, 8), '#3a4bb0', -0.1, 1.33, 0.89), cz(kula(0.1, 8), '#3a4bb0', 0.1, 1.33, 0.89), cz(kula(0.1, 8), '#3a4bb0', 0, 1.49, 0.88), cz(box(0.18, 0.05, 0.05), TRAWA, 0.1, 1.62, 0.88, 0, 0, 0.5),
      ...okno(k, -1.05, 1.0, 0.87, 0, 1.1), ...okno(k, 1.05, 1.0, 0.87, 0, 1.1),
      ...okno(k, 1.53, 1.0, -0.3, Math.PI / 2, 1.1), ...okno(k, -1.53, 1.0, -0.3, -Math.PI / 2, 1.1),
      // wieża z dzwonem na tylnym rogu: kamienny dół, izba z bali, otwarta dzwonnica, wysoki dach z opaską w kolorze gracza
      cz(box(1.0, 1.95, 1.0), KAMIEN, 1.3, 0.98, -1.25), cz(box(1.06, 0.08, 1.06), KAMIEN2, 1.3, 1.96, -1.25), cz(box(1.04, 0.06, 1.04), KAMIEN2, 1.3, 0.9, -1.25),
      ...zrab(1.3, -1.25, 0.9, 0.9, 0.85, 0.06, 2.0), ...okno(k, 1.76, 2.45, -1.25, Math.PI / 2, 0.8),
      cz(box(0.98, 0.07, 0.98), BAL2, 1.3, 2.88, -1.25), cz(kula(0.15, 8), '#c9a227', 1.3, 3.12, -1.25, 0, 0, 0, 1, 1.15, 1), cz(cyl(0.02, 0.02, 0.2, 4), BRAZ, 1.3, 3.32, -1.25),
      cz(box(1.08, 0.12, 1.08), k, 1.3, 3.5, -1.25), cz(dach4(0.9, 1.4), GONT, 1.3, 4.25, -1.25, 0, Math.PI / 4), cz(kula(0.08, 6), '#f2c94c', 1.3, 4.98, -1.25),
      ...flaga(k, 1.3, 4.93, -1.25, 0.9),
      // kamienne schody i dróżka przed gankiem
      cz(box(0.9, 0.05, 0.5), KAMIEN, 0, 0.03, 2.05), cz(box(0.7, 0.05, 0.35), KAMIEN2, 0.05, 0.03, 2.45),
      ...flaga(k, 1.45, 0.4, 1.7, 1.6), ...flaga(k, -1.45, 0.4, 1.7, 1.6),
      ...koszyk(1.2, 1.5), ...koszyk(-1.2, 1.55, 0.9)];
    for (const x of [-0.75, 0.75]) for (const z of [0.95, 1.7]) c.push(cz(cyl(0.06, 0.07, 0.8, 8), BAL, x, 0.82, z), cz(box(0.16, 0.06, 0.16), BAL2, x, 1.23, z));
    for (const [x, z] of [[1.3 + 0.38, -1.25 + 0.38], [1.3 - 0.38, -1.25 + 0.38], [1.3 + 0.38, -1.25 - 0.38], [1.3 - 0.38, -1.25 - 0.38]]) c.push(cz(cyl(0.05, 0.05, 0.6, 6), BAL, x, 3.18, z));
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
    // wielki wyplatany kosz na jagody pod strzechą
    c.push(cz(cyl(0.32, 0.28, 0.95, 12), '#b9864f', -1.12, 0.48, 0.0), cz(cyl(0.34, 0.34, 0.05, 12), BAL2, -1.12, 0.3, 0.0), cz(cyl(0.34, 0.34, 0.05, 12), BAL2, -1.12, 0.72, 0.0),
      cz(stozek(0.44, 0.45, 12), STRZECHA, -1.12, 1.17, 0.0), cz(kula(0.06, 6), k, -1.12, 1.42, 0.0));
    // szyld z jagodami na szczycie
    c.push(cz(box(0.04, 0.38, 0.6), BAL, 1.08, 1.68, -0.08), cz(box(0.045, 0.42, 0.64), k, 1.075, 1.68, -0.08),
      cz(kula(0.09, 7), '#3a4bb0', 1.12, 1.63, -0.2), cz(kula(0.09, 7), '#3a4bb0', 1.12, 1.63, 0.04), cz(kula(0.09, 7), '#3a4bb0', 1.12, 1.78, -0.08), cz(box(0.04, 0.05, 0.16), TRAWA, 1.12, 1.87, -0.02, 0.5, 0, 0));
    return c;
  },
  // skład drewna (tartak): wiata na słupach, stosy bali, deski, kozioł z belką, pniak z siekierą
  tartak(k, d) {
    const c = [];
    for (const [x, z] of [[-1.15, -1.15], [1.15, -1.15], [-1.15, -0.1], [1.15, -0.1]]) c.push(cz(cyl(0.07, 0.08, 1.2, 6), BAL, x, 0.6, z));
    c.push(...dach(0, -0.62, 1.2, 2.6, 0.75, 0.45, GONT, k, 0, BAL, true));
    for (let i = 0; i < 6; i++) c.push(cz(box(2.0, 0.05, 0.22), i % 2 ? '#d4a76a' : '#c9995c', 0, 0.04 + i * 0.055, -0.95));
    for (let i = 0; i < 5; i++) c.push(cz(box(2.0, 0.05, 0.22), i % 2 ? '#d4a76a' : '#c9995c', 0, 0.04 + i * 0.055, -0.6));
    c.push(...stosBali(-0.45, 0.65, 1.3, 0.13, 4), ...stosBali(0.85, 0.75, 0.9, 0.1, 2, Math.PI / 2));
    // szyld z piłą tarczową
    c.push(cz(cyl(0.035, 0.04, 1.3, 6), BAL2, 1.3, 0.65, 0.35), cz(box(0.04, 0.42, 0.48), k, 1.3, 1.1, 0.35), cz(cyl(0.16, 0.16, 0.03, 14), METAL, 1.33, 1.1, 0.35, 0, 0, Math.PI / 2), cz(cyl(0.04, 0.04, 0.035, 8), CIEMNE, 1.34, 1.1, 0.35, 0, 0, Math.PI / 2));
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
  // kamieniołom: ściana wyrobiska z tarasami ciętego kamienia, szopa z narzędziami, żuraw z blokiem, stos bloków, taczka
  szopa(k, d) {
    const c = [];
    let y = 0;
    [[2.7, 0.55, 0.75, -1.05], [2.3, 0.5, 0.55, -1.2], [1.7, 0.45, 0.38, -1.3]].forEach(([w, h, dd, z], i) => {
      c.push(cz(box(w, h, dd), i % 2 ? KAMIEN2 : KAMIEN, 0, y + h / 2, z), cz(box(w + 0.02, 0.04, dd + 0.02), '#a3a9b1', 0, y + h, z));
      for (let j = -2; j <= 2; j++) if (Math.abs(j * 0.55) < w / 2 - 0.1) c.push(cz(box(0.03, h - 0.06, 0.02), KAMIEN2, j * 0.55 + i * 0.12, y + h / 2, z + dd / 2 + 0.005));
      y += h;
    });
    c.push(cz(new THREE.DodecahedronGeometry(0.32), '#8f8a80', -0.85, 1.6, -1.3, 0.4, 0.2, 0, 1, 0.7, 1), cz(new THREE.DodecahedronGeometry(0.26), KAMIEN2, 0.75, 1.55, -1.35, 0.1, 0.8, 0, 1, 0.7, 1));
    // szopa
    c.push(cz(box(1.0, 0.7, 0.75), BAL2, -0.85, 0.35, 0.4), ...dach(-0.85, 0.4, 0.7, 1.2, 0.5, 0.38, GONT, k, 0.75), ...drzwi(-0.7, 0, 0.78, 0.3, 0.5),
      cz(cyl(0.02, 0.02, 0.6, 4), BRAZ, -1.2, 0.3, 0.82, 0.15, 0, 0.2), cz(box(0.3, 0.05, 0.05), METAL, -1.26, 0.6, 0.84, 0, 0, 0.2));
    // bloki gotowe do wywiezienia
    c.push(cz(box(0.45, 0.3, 0.45), KAMIEN, 0.55, 0.15, 0.65, 0, 0.1, 0), cz(box(0.45, 0.3, 0.45), KAMIEN2, 1.05, 0.15, 0.6, 0, -0.15, 0), cz(box(0.42, 0.28, 0.42), KAMIEN, 0.8, 0.44, 0.62, 0, 0.3, 0),
      cz(box(0.4, 0.28, 0.4), KAMIEN2, 0.75, 0.14, 1.12, 0, 0.5, 0), ...kamienie(0.1, -0.3, 6, 1.1));
    // żuraw: trójnóg, belka, lina, wiszący blok
    c.push(cz(cyl(0.04, 0.05, 1.9, 6), BAL, 1.0, 0.9, -0.2, 0.25, 0, 0.2), cz(cyl(0.04, 0.05, 1.9, 6), BAL, 1.3, 0.9, -0.4, -0.1, 0, -0.25), cz(cyl(0.04, 0.05, 1.9, 6), BAL, 0.85, 0.9, -0.5, -0.3, 0, 0.05),
      cz(cyl(0.035, 0.035, 1.4, 6), BAL2, 0.55, 1.8, -0.3, 0, 0, Math.PI / 2 - 0.25), cz(cyl(0.01, 0.01, 0.9, 4), '#d9c79e', 0.0, 1.3, -0.3), cz(box(0.3, 0.24, 0.3), KAMIEN, 0.0, 0.75, -0.3));
    // taczka
    c.push(cz(box(0.35, 0.15, 0.45), BAL2, 0.0, 0.25, 1.05), cz(cyl(0.1, 0.1, 0.05, 10), CIEMNE, 0.0, 0.1, 1.33, 0, 0, Math.PI / 2), cz(box(0.03, 0.03, 0.5), BAL2, -0.12, 0.22, 0.75), cz(box(0.03, 0.03, 0.5), BAL2, 0.12, 0.22, 0.75),
      ...kamienie(0.0, 1.05, 3, 0.6), ...flaga(k, -1.3, 0, 1.15, 1.4));
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
    // wieża wyciągowa nad wejściem: dwa słupy z podporami, belka, koło z liną
    for (const sx of [-1, 1]) c.push(cz(cyl(0.055, 0.065, 2.05, 6), BAL, sx * 0.47, 1.02, 0.15, 0, 0, sx * 0.07), cz(cyl(0.045, 0.05, 2.0, 6), BAL2, sx * 0.43, 0.95, 0.52, -0.37, 0, sx * 0.05),
      cz(box(0.04, 0.04, 0.6), BAL2, sx * 0.45, 1.25, 0.32, 0.5, 0, 0));
    c.push(cz(box(1.05, 0.1, 0.14), BAL2, 0, 2.02, 0.15), cz(new THREE.TorusGeometry(0.3, 0.04, 6, 16), '#555b63', 0, 2.3, 0.15), cz(cyl(0.05, 0.05, 0.14, 8), CIEMNE, 0, 2.3, 0.15, Math.PI / 2, 0, 0),
      cz(box(0.58, 0.025, 0.025), '#555b63', 0, 2.3, 0.15, 0, 0, 0.8), cz(box(0.58, 0.025, 0.025), '#555b63', 0, 2.3, 0.15, 0, 0, -0.8),
      cz(cyl(0.012, 0.012, 1.3, 4), '#d9c79e', 0.3, 1.65, 0.15), cz(box(0.22, 0.1, 0.16), k, 0, 2.02, 0.23));
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
      ...dach(-0.1, -0.55, 1.05, 2.6, 0.95, 0.75, LUPEK, k, 1.35),
      ...drzwi(-0.1, 0.1, 0.13, 0.42, 0.65), ...okno(k, -0.75, 0.62, 0.13), ...okno(k, 0.55, 0.62, 0.13),
      cz(cyl(0.2, 0.2, 0.04, 14), k, -0.1, 0.95, 0.15, Math.PI / 2, 0, 0), cz(cyl(0.07, 0.07, 0.05, 10), METAL, -0.1, 0.95, 0.17, Math.PI / 2, 0, 0),
      ...palisada(-1.35, 0.45, -1.35, 1.3, 0.8), ...palisada(-1.35, 1.3, -0.5, 1.3, 0.8)];
    // stojak z włóczniami
    c.push(cz(box(0.6, 0.05, 0.06), BAL2, 0.75, 0.55, 0.6), cz(box(0.05, 0.6, 0.05), BAL2, 0.47, 0.3, 0.6), cz(box(0.05, 0.6, 0.05), BAL2, 1.03, 0.3, 0.6));
    for (let i = 0; i < 4; i++) c.push(cz(cyl(0.015, 0.015, 1.0, 4), BAL, 0.57 + i * 0.12, 0.5, 0.62, 0.12, 0, 0), cz(stozek(0.03, 0.1, 4), METAL, 0.57 + i * 0.12, 1.0, 0.68, 0.12, 0, 0));
    // kukła ze słomy
    c.push(cz(cyl(0.03, 0.03, 1.0, 5), BAL2, 0.35, 0.5, 1.15), cz(kula(0.17, 7), SIANO, 0.35, 0.75, 1.15, 0, 0, 0, 1, 1.4, 1), cz(kula(0.1, 7), SIANO, 0.35, 1.05, 1.15), cz(cyl(0.02, 0.02, 0.5, 5), BAL2, 0.35, 0.82, 1.15, 0, 0, Math.PI / 2));
    c.push(...flaga(k, 1.2, 0, -0.1, 1.9));
    // wieża strażnicza na rogu palisady
    for (const [x, z] of [[-1.42, 1.08], [-0.98, 1.08], [-1.42, 1.52], [-0.98, 1.52]]) c.push(cz(cyl(0.05, 0.06, 1.75, 6), BAL, x, 0.87, z));
    c.push(cz(box(0.6, 0.07, 0.6), BAL2, -1.2, 1.4, 1.3), cz(box(0.62, 0.22, 0.03), BAL2, -1.2, 1.55, 1.6), cz(box(0.62, 0.22, 0.03), BAL2, -1.2, 1.55, 1.0),
      cz(box(0.03, 0.22, 0.62), BAL2, -1.5, 1.55, 1.3), cz(box(0.03, 0.22, 0.62), BAL2, -0.9, 1.55, 1.3), cz(box(0.64, 0.06, 0.64), k, -1.2, 1.78, 1.3),
      cz(dach4(0.52, 0.45), LUPEK, -1.2, 2.03, 1.3, 0, Math.PI / 4), cz(box(0.04, 0.04, 0.5), BAL2, -1.2, 0.7, 1.08, 0, 0, 0.9));
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
    // tyczka z drewnianym ptakiem (cel dla najlepszych strzelców)
    c.push(cz(cyl(0.04, 0.055, 2.4, 6), BAL2, 0.55, 1.2, -0.45), cz(box(0.5, 0.04, 0.04), BAL2, 0.55, 2.2, -0.45), cz(kula(0.12, 7), '#d4a76a', 0.55, 2.5, -0.45, 0, 0, 0, 1.4, 1, 1),
      cz(kula(0.07, 6), '#d4a76a', 0.72, 2.58, -0.45), cz(stozek(0.03, 0.1, 4), '#e8b923', 0.82, 2.58, -0.45, 0, 0, -Math.PI / 2),
      cz(box(0.16, 0.03, 0.22), k, 0.52, 2.55, -0.32, 0.5, 0, 0), cz(box(0.16, 0.03, 0.22), k, 0.52, 2.55, -0.58, -0.5, 0, 0), cz(box(0.14, 0.03, 0.1), k, 0.36, 2.52, -0.45, 0, 0, 0.3));
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
      cz(box(0.6, 0.15, 0.22), BAL2, -0.6, 0.18, 0.75), cz(box(0.52, 0.04, 0.15), '#7fb5e8', -0.6, 0.25, 0.75), ...flaga(k, -1.2, 0, -1.25, 1.3),
      ...renifer(k, -0.1, 0.5, 0.4));
    return c;
  },
  // kuźnia: kamienno-drewniana, otwarta z przodu, kamienny komin z ogniem, kowadło na pniaku, koryto z wodą
  kuznia(k, d) {
    const c = [cz(box(2.2, 0.85, 0.3), KAMIEN, 0, 0.42, -1.05), cz(box(0.3, 0.85, 1.4), KAMIEN2, -1.0, 0.42, -0.45),
      ...dach(0, -0.35, 0.85, 2.5, 1.0, 0.6, LUPEK, k, 0, BAL, true)];
    for (const x of [1.05, 0.0]) c.push(cz(cyl(0.07, 0.08, 0.85, 6), BAL, x, 0.42, 0.45));
    c.push(cz(box(0.7, 0.45, 0.6), KAMIEN2, 0.55, 0.22, -0.65), cz(box(0.45, 0.06, 0.4), OGIEN, 0.55, 0.46, -0.6), cz(kula(0.12, 6), '#ffd36b', 0.55, 0.5, -0.6, 0, 0, 0, 1.4, 0.5, 1.2),
      cz(box(0.45, 1.6, 0.45), KAMIEN, 0.75, 1.2, -0.95), cz(box(0.52, 0.08, 0.52), KAMIEN2, 0.75, 2.0, -0.95),
      cz(cyl(0.16, 0.19, 0.32, 8), '#7a5030', -0.2, 0.16, 0.2), cz(box(0.36, 0.12, 0.16), '#4a4f57', -0.2, 0.38, 0.2), cz(box(0.16, 0.1, 0.12), '#4a4f57', -0.4, 0.37, 0.2), cz(box(0.2, 0.08, 0.1), '#4a4f57', -0.2, 0.28, 0.2),
      cz(box(0.6, 0.22, 0.28), BAL2, -0.75, 0.11, 0.8), cz(box(0.52, 0.04, 0.2), '#7fb5e8', -0.75, 0.2, 0.8),
      cz(box(0.3, 0.2, 0.25), '#7a4a26', 0.1, 0.3, -0.7, 0, 0, 0.2));
    for (let i = 0; i < 3; i++) c.push(cz(box(0.04, 0.3, 0.02), BRAZ, -0.5 + i * 0.18, 0.62, -0.88), cz(box(0.1, 0.06, 0.03), METAL, -0.5 + i * 0.18, 0.48, -0.87));
    c.push(cz(new THREE.TorusGeometry(0.1, 0.025, 5, 10, Math.PI * 1.3), METAL, 1.05, 0.95, 0.55, 0, 0, Math.PI * 0.85), ...flaga(k, -1.25, 0, 0.9, 1.3));
    // szyld z kowadłem na słupie przed kuźnią
    c.push(cz(cyl(0.035, 0.04, 1.4, 6), BAL2, 0.55, 0.7, 1.15), cz(box(0.5, 0.36, 0.04), k, 0.55, 1.25, 1.15), cz(box(0.44, 0.3, 0.045), BAL, 0.55, 1.25, 1.15),
      cz(box(0.26, 0.06, 0.05), '#4a4f57', 0.55, 1.3, 1.18), cz(box(0.1, 0.1, 0.05), '#4a4f57', 0.55, 1.22, 1.18), cz(box(0.2, 0.04, 0.05), '#4a4f57', 0.55, 1.15, 1.18));
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
  // bramy na 4 kratki (od x = -2 do 2): drewniana, ceglana, okuta stalą; wersje z „Z” są zamknięte
  brama(k, d) { return brama3D(1, false, k); },
  bramaZ(k, d) { return brama3D(1, true, k); },
  brama2(k, d) { return brama3D(2, false, k); },
  brama2Z(k, d) { return brama3D(2, true, k); },
  brama3(k, d) { return brama3D(3, false, k); },
  brama3Z(k, d) { return brama3D(3, true, k); },
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
  // Gontyna: świątynia z bali na kamiennej podmurówce, stromy dach z gontu, przed nią czterolicy posąg boga, ogień w kamiennym kręgu i słupy ze wstążkami
  gontyna(k, d) {
    const c = [cz(box(2.3, 0.22, 2.0), KAMIEN2, 0, 0.11, -0.35), cz(box(2.36, 0.06, 2.06), KAMIEN, 0, 0.23, -0.35),
      ...zrab(0, -0.4, 1.9, 1.5, 1.05, 0.075, 0.25),
      ...dach(0, -0.4, 1.28, 2.25, 1.05, 1.35, GONT, k, 1.5),
      ...drzwi(0, 0.25, 0.36, 0.4, 0.7)];
    // rzeźbione słupy przy wejściu
    for (const x of [-0.42, 0.42]) c.push(cz(cyl(0.07, 0.08, 1.1, 6), BAL2, x, 0.8, 0.45), cz(box(0.16, 0.1, 0.16), k, x, 1.3, 0.45));
    // posąg: czworoboczny słup z czterema twarzami i okrągłą czapą
    const px = 0.85, pz = 0.85;
    c.push(cz(box(0.36, 0.16, 0.36), KAMIEN, px, 0.08, pz), cz(box(0.24, 1.5, 0.24), '#b9a27a', px, 0.9, pz));
    for (let r = 0; r < 4; r++) {
      const a = r * Math.PI / 2, ox = Math.sin(a) * 0.125, oz = Math.cos(a) * 0.125;
      c.push(cz(box(0.16, 0.2, 0.02), '#a08a6e', px + ox, 1.38, pz + oz, 0, a, 0), cz(kulaG(0.022, 6, 4), OCZY, px + ox * 1.05 + Math.cos(a) * 0.04, 1.43, pz + oz * 1.05 - Math.sin(a) * 0.04),
        cz(kulaG(0.022, 6, 4), OCZY, px + ox * 1.05 - Math.cos(a) * 0.04, 1.43, pz + oz * 1.05 + Math.sin(a) * 0.04), cz(box(0.12, 0.03, 0.02), '#7d6a52', px + ox * 1.08, 1.32, pz + oz * 1.08, 0, a, 0),
        cz(box(0.04, 0.3, 0.02), '#a08a6e', px + ox * 1.06, 0.95, pz + oz * 1.06, 0, a, 0));
    }
    c.push(cz(cyl(0.2, 0.17, 0.12, 12), '#8a5c32', px, 1.7, pz), cz(czapa(0.17, 1.4), k, px, 1.75, pz), cz(cyl(0.04, 0.04, 0.38, 6), '#f2c94c', px + 0.17, 1.0, pz + 0.12, 0.3, 0, -0.5));
    // ognisko w kamiennym kręgu
    const fx = -0.7, fz = 0.95;
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.push(cz(kula(0.07, 5), KAMIEN, fx + Math.cos(a) * 0.22, 0.05, fz + Math.sin(a) * 0.22)); }
    c.push(cz(box(0.3, 0.05, 0.06), '#6b4527', fx, 0.05, fz, 0, 0.6, 0), cz(box(0.3, 0.05, 0.06), '#6b4527', fx, 0.05, fz, 0, -0.6, 0), cz(stozek(0.12, 0.3, 6), OGIEN, fx, 0.2, fz), cz(stozek(0.06, 0.2, 5), '#ffd36b', fx, 0.2, fz));
    // słupy ze wstążkami w kolorze strony
    for (const [x, z] of [[-1.15, -1.2], [1.15, -1.2], [-1.15, 0.45]]) c.push(cz(cyl(0.04, 0.05, 1.3, 6), BAL, x, 0.65, z), st(cz(box(0.03, 0.4, 0.08), k, x + 0.04, 1.1, z), 2, 0, 0.06), cz(kula(0.05, 5), '#f2c94c', x, 1.33, z));
    return c;
  },
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
// powiększenie modelu [w poziomie, w pionie]: budynek wypełnia swój plac
const SKALA = { gontyna: [1.08, 1.1], ratusz: [1.1, 1.12], dom: [1.12, 1.2], spichlerz: [1.12, 1.2], tartak: [1.05, 1.12], szopa: [1.03, 1.05], kopalnia: [1.1, 1.1],
  koszary: [1.1, 1.15], strzelnica: [1.08, 1.12], stajnia: [1.08, 1.15], kuznia: [1.1, 1.15], jarmark: [1.04, 1.08], warsztat: [1.06, 1.12] };
export const budynek = cache((typ, strona) => {
  const c = BUD[typ](KOLORY_STRON[strona], CIEMNIEJ[strona]), s = SKALA[typ];
  if (s) { const m = new THREE.Matrix4().makeScale(s[0], s[1], s[0]); for (const p of c) p.m.premultiply(m); }
  return polacz(c);
});
// stosik rzeczy na plecach zbieracza: n sztuk (jagody w koszyczkach, polana, kamienie, ruda)
export const stos = cache((sur, n) => {
  const c = [], kol = { kamien: [KAMIEN, KAMIEN2], zelazo: ['#c4622d', '#7b5a4a'], zloto: ['#d9dde3', '#f4f6f9'] }[sur] || [KAMIEN, KAMIEN2];
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
  } else if (gat === 'swierkS') { // świerk przysypany śniegiem (Mroźna Tundra)
    c.push(cz(cyl(0.11, 0.15, 0.7, 6), '#5e3d22', 0, 0.35, 0));
    for (const [r, h, y, k] of [[0.72, 0.9, 0.85, '#245f37'], [0.6, 0.85, 1.3, '#2b6d3f'], [0.46, 0.75, 1.72, '#327a46'], [0.3, 0.6, 2.1, '#3a8650']]) {
      c.push(cz(stozek(r, h, 8), k, 0, y, 0), cz(stozek(r * 0.66, h * 0.6, 8), '#f4f8fc', 0, y + h * 0.215, 0));
    }
  } else if (gat === 'palma') { // palma (Oaza): wygięty pień z odcinków, pióropusz liści, orzechy
    for (let i = 0; i < 5; i++) c.push(cz(cyl(0.085 - i * 0.008, 0.1 - i * 0.008, 0.47, 6), i % 2 ? '#a07848' : '#8a6238', i * i * 0.018, 0.23 + i * 0.44, 0, 0, 0, -0.05 - i * 0.05));
    const kx = 0.42, ky = 2.2;
    for (let i = 0; i < 7; i++) { const a = i * 0.9; c.push(cz(kula(0.5, 6), i % 2 ? '#4f9a3a' : '#3f8a32', kx + Math.cos(a) * 0.42, ky - 0.1, Math.sin(a) * 0.42, 0, -a, -0.45, 1, 0.07, 0.24)); }
    for (const [x, z] of [[0.08, 0.06], [-0.06, 0.05], [0.0, -0.08]]) c.push(cz(kula(0.07, 5), '#6b4a2a', kx + x, ky - 0.12, z));
  } else { // modrzew: smukły, jasnozielony
    c.push(cz(cyl(0.07, 0.11, 0.6, 6), '#6e4a2c', 0, 0.3, 0));
    for (const [r, h, y, k] of [[0.5, 1.0, 0.85, '#7fae4c'], [0.4, 0.9, 1.35, '#8bba55'], [0.28, 0.8, 1.85, '#98c45f'], [0.16, 0.5, 2.25, '#a3cc68']]) c.push(cz(stozek(r, h, 7), k, 0, y, 0));
  }
  return polacz(c, { wiatr: 0.035 });
});
// ozdoby krajobrazu (nie zasłaniają drogi, są tylko do patrzenia)
export const OZDOBY = ['trawa', 'trawa2', 'kwiatyB', 'kwiatyZ', 'kwiatyF', 'paproc', 'muchomor', 'borowik', 'kamyki', 'kloda', 'krzaczek', 'jagodnik', 'trzcina', 'zaspa', 'kaktus', 'sucha', 'runa'];
export const ozdoba = cache(rodzaj => {
  const c = [];
  if (rodzaj === 'trawa' || rodzaj === 'trawa2' || rodzaj === 'sucha') {
    const k = rodzaj === 'trawa' ? ['#5aa646', '#6db552', '#4c9a3e'] : rodzaj === 'trawa2' ? ['#86b84e', '#9bc45a', '#77ad48'] : ['#c9b06a', '#b89c58', '#d8c27a'];
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
  } else if (rodzaj === 'trzcina') {
    // trzciny przy wodzie: cienkie łodygi, niektóre z brązową pałką
    for (let i = 0; i < 7; i++) { const a = i * 2.3, d = 0.04 + (i % 3) * 0.05, h = 0.45 + (i % 4) * 0.12, x = Math.cos(a) * d, z = Math.sin(a) * d; c.push(cz(cyl(0.01, 0.015, h, 3), i % 2 ? '#7a9a4a' : '#8aa858', x, h / 2, z, Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12)); if (i % 2 === 0) c.push(cz(cyl(0.026, 0.026, 0.11, 5), '#6b4527', x + Math.cos(a) * 0.05, h - 0.02, z + Math.sin(a) * 0.05)); }
  } else if (rodzaj === 'runa') {
    // kamień z runami (Jotunheim): stojąca płyta z wyrytymi niebieskimi znakami i czapą śniegu
    c.push(cz(box(0.42, 1.0, 0.16), '#8a8178', 0, 0.5, 0, 0, 0, 0.04), cz(box(0.38, 0.07, 0.17), '#f4f8fc', 0.02, 1.02, 0, 0, 0, 0.04));
    for (const [y, w, a] of [[0.25, 0.2, 0], [0.42, 0.14, 0.7], [0.58, 0.22, -0.6], [0.74, 0.12, 0.5], [0.86, 0.18, 0]]) c.push(cz(box(w, 0.035, 0.02), '#4a78c8', 0.02 * y, y, 0.085, 0, 0, a), cz(box(w, 0.035, 0.02), '#4a78c8', 0.02 * y, y, -0.085, 0, 0, -a));
    c.push(cz(new THREE.DodecahedronGeometry(0.14), '#7d838c', 0.25, 0.06, 0.1), cz(new THREE.DodecahedronGeometry(0.1), '#9aa0a8', -0.22, 0.05, -0.05));
  } else if (rodzaj === 'zaspa') {
    c.push(cz(new THREE.SphereGeometry(0.34, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), '#f6f9fc', 0, 0, 0, 0, 0, 0, 1.6, 0.28, 1.1));
  } else if (rodzaj === 'kaktus') {
    c.push(cz(cyl(0.08, 0.09, 0.62, 7), '#5f9a4a', 0, 0.31, 0), cz(kula(0.08, 6), '#5f9a4a', 0, 0.62, 0),
      cz(cyl(0.045, 0.045, 0.14, 6), '#5f9a4a', 0.11, 0.3, 0, 0, 0, Math.PI / 2), cz(cyl(0.045, 0.045, 0.2, 6), '#5f9a4a', 0.18, 0.4, 0),
      cz(cyl(0.04, 0.04, 0.12, 6), '#5f9a4a', -0.1, 0.22, 0, 0, 0, Math.PI / 2), cz(cyl(0.04, 0.04, 0.15, 6), '#5f9a4a', -0.16, 0.29, 0), cz(kula(0.03, 4), '#ff9ec7', 0, 0.7, 0));
  } else if (rodzaj === 'jagodnik') {
    // niskie krzaczki borówek z czerwonymi kropkami (to nie haskap, nie da się ich zbierać)
    c.push(cz(kula(0.14, 6), '#4c8f3e', 0, 0.08, 0, 0, 0, 0, 1.3, 0.55, 1.1));
    for (const [x, z] of [[0.08, 0.06], [-0.07, 0.05], [0.02, -0.08]]) c.push(cz(kula(0.025, 4), '#c2263a', x, 0.13, z));
  }
  const wiatr = { trawa: 0.25, trawa2: 0.25, sucha: 0.25, trzcina: 0.3, kwiatyB: 0.3, kwiatyZ: 0.3, kwiatyF: 0.3, paproc: 0.2, krzaczek: 0.08, jagodnik: 0.1 }[rodzaj];
  return polacz(c, wiatr ? { wiatr, wszystko: true } : {});
});
export const krzak = cache(() => {
  const c = [cz(kula(0.45, 7), '#2f7d3a', 0, 0.35, 0, 0, 0, 0, 1, 0.8, 1), cz(kula(0.3, 6), '#3b9446', 0.25, 0.5, 0.1)];
  const r = [[0.3, 0.45, 0.25], [-0.25, 0.5, 0.2], [0.05, 0.62, -0.25], [-0.3, 0.32, -0.2], [0.35, 0.3, -0.15], [0.0, 0.7, 0.1]];
  for (const [x, y, z] of r) c.push(cz(kula(0.08, 5), '#3a4bb0', x, y, z, 0, 0, 0, 0.8, 1.3, 0.8));
  return polacz(c, { wiatr: 0.06, wszystko: true });
});
export const skala = cache(rodzaj => {
  const k1 = rodzaj === 'ruda' ? '#7b5a4a' : rodzaj === 'zloto' ? '#9aa3ad' : KAMIEN, k2 = rodzaj === 'ruda' ? '#4d4a4f' : rodzaj === 'zloto' ? '#7d838c' : KAMIEN2;
  const c = [cz(new THREE.DodecahedronGeometry(0.45), k2, 0, 0.25, 0, 0, 0, 0, 1, 0.7, 1), cz(new THREE.DodecahedronGeometry(0.3), k1, 0.2, 0.45, 0.1, 0.4, 0.3, 0), cz(new THREE.DodecahedronGeometry(0.22), k1, -0.25, 0.2, 0.2)];
  if (rodzaj === 'zloto') c.push(cz(new THREE.OctahedronGeometry(0.11), '#eef2f6', -0.05, 0.55, 0.25), cz(new THREE.OctahedronGeometry(0.09), '#ffffff', 0.3, 0.32, -0.22), cz(new THREE.OctahedronGeometry(0.08), '#cfd6de', -0.3, 0.4, -0.1));
  if (rodzaj === 'ruda') c.push(cz(new THREE.OctahedronGeometry(0.11), '#c4622d', -0.05, 0.55, 0.25), cz(new THREE.OctahedronGeometry(0.09), '#d9773a', 0.3, 0.3, -0.25), cz(new THREE.OctahedronGeometry(0.07), '#c4622d', -0.3, 0.42, -0.1));
  return polacz(c);
});
export const kamyk = cache(() => polacz([cz(kula(0.09, 5), KAMIEN2)]));
// skały, przez które nie da się przejść (grzbiety na mapie Skalne Przełęcze); w śniegu z białymi czapami, na piasku z piaskowca
export const glaz = cache(motyw => {
  const [k1, k2] = motyw === 'piasek' ? ['#c49a6c', '#a87b52'] : ['#8f8a80', '#7d7369'];
  const c = [cz(new THREE.DodecahedronGeometry(0.72), k2, 0, 0.35, 0, 0, 0, 0, 1, 1.1, 1), cz(new THREE.DodecahedronGeometry(0.5), k1, 0.25, 0.85, 0.1, 0.4, 0.3, 0),
    cz(new THREE.DodecahedronGeometry(0.42), k2, -0.3, 0.7, -0.2, 0.2, 0.8, 0.1), cz(new THREE.DodecahedronGeometry(0.3), k1, 0.05, 1.25, -0.05, 0.6, 0.2, 0.3)];
  if (motyw === 'zima') c.push(cz(new THREE.DodecahedronGeometry(0.32), '#f4f8fc', 0.05, 1.42, -0.05, 0.6, 0.2, 0.3, 1.1, 0.45, 1.1), cz(new THREE.DodecahedronGeometry(0.4), '#eef3f8', 0.25, 1.08, 0.1, 0, 0, 0, 1.1, 0.4, 1.1));
  return polacz(c);
});
// ruiny po zburzonym budynku: popiół, osmalone belki i kamienie
export const gruz = cache(w => {
  const c = [cz(cyl(w * 0.5, w * 0.52, 0.03, 16), '#3b332c', 0, 0.015, 0), cz(cyl(w * 0.32, w * 0.34, 0.035, 14), '#2a2420', 0.1, 0.02, -0.05)];
  const n = 4 + w * 3;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39, r = (0.15 + ((i * 37) % 10) / 10 * 0.32) * w, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (i % 3 === 2) c.push(cz(new THREE.DodecahedronGeometry(0.09 + (i % 4) * 0.03), i % 2 ? '#7d838c' : '#5c6168', x, 0.07, z, a, a, 0));
    else c.push(cz(cyl(0.06, 0.07, 0.45 + (i % 4) * 0.18, 6), i % 2 ? '#2e2620' : '#4a3a2c', x, 0.07, z, Math.PI / 2, a, 0.15 * (i % 3)));
  }
  c.push(cz(cyl(0.07, 0.09, 0.6, 6), '#2e2620', w * 0.2, 0.3, w * 0.15, 0.25, 0, 0.2));
  return polacz(c);
});
export const pieniek = cache(() => polacz([cz(cyl(0.15, 0.18, 0.22, 10), '#6b4527', 0, 0.11, 0), cz(cyl(0.14, 0.14, 0.02, 10), '#e0c08a', 0, 0.225, 0)]));
export const kolo = cache((r1, r2) => new THREE.RingGeometry(r1, r2, 28).rotateX(-Math.PI / 2));
