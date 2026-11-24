// Age of Polan: realistyczne postacie z ruchem (modele i ruchy Quaternius, CC0; pliki w folderze postacie/,
// przygotowuje je narzedzia/polanie-postacie.py). Gdy kamera jest blisko, ludzie są rysowani tymi postaciami,
// a z daleka zostają proste bryły z modele.js (żeby telefon nie zwalniał).
import * as THREE from '../survival/three.module.min.js';
import { GLTFLoader } from './postacie/GLTFLoader.js';
import * as SU from './postacie/SkeletonUtils.js';
import { KOLORY_STRON } from './modele.js';

export const SKALA = 0.72;
const P = {}; // wczytane pliki
let gotowe = false, wczytywanie = null;
export const sa = () => gotowe;

const PLIKI = ['chlop', 'chlopka', 'mysliwy', 'mysliwa', 'glowa_m', 'glowa_k', 'broda', 'wlosy_krotkie', 'wlosy_dlugie', 'wlosy_sciete', 'wlosy_koki'];
export function wczytaj() {
  if (wczytywanie) return wczytywanie;
  const L = new GLTFLoader(), jeden = n => new Promise((ok, zle) => L.load('postacie/' + n, ok, undefined, zle));
  wczytywanie = Promise.all([...PLIKI.map(n => jeden(n + '.gltf')), jeden('ruchy.glb')]).then(w => {
    PLIKI.forEach((n, i) => { P[n] = w[i]; });
    for (const a of w[PLIKI.length].animations) RUCHY[a.name] = a;
    przygotuj();
    gotowe = true;
  }).catch(e => { console.warn('Postacie nie wczytały się, zostają proste bryły', e); });
  return wczytywanie;
}
const RUCHY = {};

// ---------- przygotowanie wzorów (raz) ----------
const MAT = new Map(), JASNOSC = 1.35;
// tańszy materiał (Lambert) z tą samą fakturą; skóra i włosy mogą mieć swój odcień
function lambert(m, kolor) {
  const k = (m.map ? m.map.uuid : m.uuid) + '|' + (kolor || '');
  if (!MAT.has(k)) {
    // faktury są dość ciemne przy naszym świetle: rozjaśniamy je (kolor ponad 1)
    const c = new THREE.Color(kolor || (m.map ? '#ffffff' : m.color)).multiplyScalar(JASNOSC);
    MAT.set(k, new THREE.MeshLambertMaterial({ map: m.map || null, color: c, side: THREE.DoubleSide }));
  }
  return MAT.get(k);
}
// głowa z ciała bazowego: tylko trójkąty przypięte do głowy i szyi
function tylkoGlowa(scena) {
  scena.traverse(m => {
    if (!m.isSkinnedMesh || /eye/i.test(m.name) || /eyebrow/i.test(m.name)) return;
    const naz = m.skeleton.bones.map(b => b.name), glowa = new Set(['Head', 'neck_01'].map(n => naz.indexOf(n)));
    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, ix = m.geometry.index;
    if (!ix) return;
    const dom = v => { let b = 0, w = -1; for (let k = 0; k < 4; k++) { const x = sw.getComponent(v, k); if (x > w) { w = x; b = si.getComponent(v, k); } } return b; };
    const nowe = [];
    for (let t = 0; t < ix.count; t += 3) { const a = ix.getX(t), b = ix.getX(t + 1), c = ix.getX(t + 2); if (glowa.has(dom(a)) && glowa.has(dom(b)) && glowa.has(dom(c))) nowe.push(a, b, c); }
    m.geometry = m.geometry.clone(); m.geometry.setIndex(nowe);
  });
}
const SKORA = '#f3d2b8', WLOSY = ['#6b4528', '#c9a46a', '#8a4a22', '#3a2a1e', '#a08a70'];
function przygotuj() {
  tylkoGlowa(P.glowa_m.scene); tylkoGlowa(P.glowa_k.scene);
  for (const n of PLIKI) P[n].scene.traverse(m => {
    if (!m.isMesh) return;
    const skora = /regular|superhero/i.test(m.material.name || '') || /regular|superhero/i.test(m.material.map && m.material.map.name || '');
    m.material = lambert(m.material, skora ? SKORA : null);
    m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false;
  });
}

// ---------- rzeczy w rękach i na głowie (proste bryły w kolorach) ----------
const GM = new Map();
const mat = k => { if (!GM.has(k)) GM.set(k, new THREE.MeshLambertMaterial({ color: k })); return GM.get(k); };
const DRZ = '#7a4a26', MET = '#c9ced6', MET2 = '#8f949c';
function bryla(geo, kolor, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { const m = new THREE.Mesh(geo, mat(kolor)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; }
// przedmiot trzymany w dłoni: trzonek idzie od dłoni do przodu (oś +z), w pozycji spoczynkowej modelu
const PRZEDMIOTY = {
  siekiera: () => [bryla(new THREE.CylinderGeometry(0.018, 0.022, 0.62, 6), DRZ, 0, 0, 0.18, Math.PI / 2), bryla(new THREE.BoxGeometry(0.02, 0.16, 0.11), MET, 0, 0.06, 0.45)],
  kilof: () => [bryla(new THREE.CylinderGeometry(0.018, 0.022, 0.62, 6), DRZ, 0, 0, 0.18, Math.PI / 2), bryla(new THREE.BoxGeometry(0.03, 0.42, 0.04), '#555b63', 0, 0, 0.47)],
  mlotek: () => [bryla(new THREE.CylinderGeometry(0.016, 0.018, 0.36, 6), DRZ, 0, 0, 0.1, Math.PI / 2), bryla(new THREE.BoxGeometry(0.06, 0.12, 0.07), '#555b63', 0, 0, 0.27)],
  sierp: () => [bryla(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 6), DRZ, 0, 0, 0.05, Math.PI / 2), bryla(new THREE.TorusGeometry(0.1, 0.012, 4, 10, Math.PI * 1.2), MET, 0, 0.06, 0.18, 0, Math.PI / 2, 0)],
  maczuga: () => [bryla(new THREE.CylinderGeometry(0.02, 0.05, 0.62, 7), '#6b4527', 0, 0, 0.2, Math.PI / 2)],
  miecz: () => [bryla(new THREE.BoxGeometry(0.05, 0.012, 0.7), MET, 0, 0, 0.42), bryla(new THREE.BoxGeometry(0.2, 0.03, 0.03), '#5a3518', 0, 0, 0.07), bryla(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 6), DRZ, 0, 0, 0, Math.PI / 2)],
  topor: () => [bryla(new THREE.CylinderGeometry(0.02, 0.024, 0.8, 6), DRZ, 0, 0, 0.24, Math.PI / 2), bryla(new THREE.BoxGeometry(0.02, 0.22, 0.14), MET, 0, 0.08, 0.58)],
  wlocznia: () => [bryla(new THREE.CylinderGeometry(0.016, 0.016, 1.9, 6), DRZ, 0, 0, 0.35, Math.PI / 2), bryla(new THREE.ConeGeometry(0.035, 0.2, 6), MET, 0, 0, 1.38, Math.PI / 2)],
  proca: () => [bryla(new THREE.SphereGeometry(0.035, 6, 4), '#7d838c', 0, -0.04, 0.05)],
  luk: () => [bryla(new THREE.TorusGeometry(0.42, 0.014, 4, 16, Math.PI * 0.9), DRZ, 0, 0, 0, 0, Math.PI / 2, Math.PI / 2 - Math.PI * 0.45)],
};
// tarcza w kolorze strony na lewej ręce
function tarcza(strona) { const g = new THREE.Group(); g.add(bryla(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 16), KOLORY_STRON[strona], 0, 0, 0, 0, 0, Math.PI / 2), bryla(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), MET, -0.02, 0, 0, 0, 0, Math.PI / 2), bryla(new THREE.TorusGeometry(0.24, 0.015, 4, 20), DRZ, 0, 0, 0, 0, Math.PI / 2, 0)); return g; }
// stożkowy hełm z nosalem
function helm() { const g = new THREE.Group(); g.add(bryla(new THREE.ConeGeometry(0.115, 0.2, 12), MET, 0, 0.14, -0.01), bryla(new THREE.CylinderGeometry(0.117, 0.117, 0.03, 12), MET2, 0, 0.045, -0.01), bryla(new THREE.BoxGeometry(0.02, 0.09, 0.015), MET2, 0, -0.01, 0.105), bryla(new THREE.SphereGeometry(0.02, 6, 4), MET, 0, 0.25, -0.01)); return g; }
// stroje w kolorze strony: w fakturze przefarbowujemy jasną lnianą koszulę chłopa i zielone części stroju myśliwego
// (cieniowanie zostaje, zmienia się tylko barwa), po tym widać, czyj to człowiek
const MAT_STRONY = new Map();
function farbuj(obraz, mysliwy, kolor) {
  const W = 512, cv = document.createElement('canvas'); cv.width = cv.height = W;
  const c = cv.getContext('2d'); c.drawImage(obraz, 0, 0, W, W);
  const d = c.getImageData(0, 0, W, W), px = d.data, k = new THREE.Color(kolor);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    const s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
    let h = 0; if (mx !== mn) { h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h = (h * 60 + 360) % 360; }
    if (!(mysliwy ? h > 70 && h < 170 && s > 0.12 : l > 0.36 && s < 0.32)) continue;
    const jas = Math.min(1.6, l / 0.5) * (mysliwy ? 1.15 : 0.95);
    px[i] = Math.min(255, k.r * 255 * jas); px[i + 1] = Math.min(255, k.g * 255 * jas); px[i + 2] = Math.min(255, k.b * 255 * jas);
  }
  c.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function materialStrony(m, strona) {
  const klucz = m.uuid + '|' + strona;
  if (!MAT_STRONY.has(klucz)) {
    const mapa = farbuj(m.map.image, /ranger/i.test(m.map.name), KOLORY_STRON[strona]);
    MAT_STRONY.set(klucz, new THREE.MeshLambertMaterial({ map: mapa, color: m.color.clone(), side: THREE.DoubleSide }));
  }
  return MAT_STRONY.get(klucz);
}

// ---------- wygląd jednostek ----------
// stroj, glowa, wlosy, broda; prawa / lewa: przedmiot w dłoni; helm; tarcza; ruchy: atak, chodzenie
const WYGLAD = {
  osadnik: w => ({ stroj: w % 4 === 3 ? 'chlopka' : 'chlop', kobieta: w % 4 === 3, wlosy: w % 4 === 3 ? (w % 8 === 3 ? 'wlosy_koki' : 'wlosy_dlugie') : ['wlosy_krotkie', 'wlosy_sciete', 'wlosy_krotkie'][w % 3], broda: w % 4 !== 3 && w % 3 !== 1 }),
  rzemieslnik: w => ({ stroj: 'chlop', wlosy: 'wlosy_sciete', broda: true, prawa: 'mlotek' }),
  wojownik: w => ({ stroj: 'chlop', wlosy: 'wlosy_sciete', broda: w % 2 === 0, helm: true, prawa: 'maczuga' }),
  tarczownik: w => ({ stroj: 'chlop', broda: w % 2 === 0, helm: true, prawa: 'topor', tarcza: true }),
  obronca: w => ({ stroj: 'mysliwy', broda: true, helm: true, prawa: 'miecz', tarcza: true }),
  wlocznik: w => ({ stroj: 'chlop', broda: w % 2 === 1, helm: true, prawa: 'wlocznia' }),
  pikinier: w => ({ stroj: 'mysliwy', broda: true, helm: true, prawa: 'wlocznia', tarcza: true }),
  procarz: w => ({ stroj: w % 3 === 2 ? 'mysliwa' : 'mysliwy', kobieta: w % 3 === 2, broda: w % 2 === 0, prawa: 'proca' }),
  procarz2: w => ({ stroj: w % 3 === 2 ? 'mysliwa' : 'mysliwy', kobieta: w % 3 === 2, broda: w % 2 === 0, lewa: 'luk' }),
  kusznik: w => ({ stroj: 'mysliwy', broda: true, helm: true, lewa: 'luk' }),
};
export const ma = typ => !!WYGLAD[typ];

// część do przypięcia (głowa, włosy): siatki z kośćmi przepinamy na szkielet postaci
function dolacz(o, kosci, wzor, kolor) {
  const k = SU.clone(wzor.scene), siatki = [];
  k.traverse(m => { if (m.isSkinnedMesh) siatki.push(m); });
  for (const m of siatki) {
    m.removeFromParent(); m.frustumCulled = false;
    if (kolor) m.material = lambert(m.material, kolor);
    o.add(m); m.bind(new THREE.Skeleton(m.skeleton.bones.map(b => kosci[b.name] || b), m.skeleton.boneInverses), m.bindMatrix);
  }
}
// przedmiot przypięty do kości: ustawiamy go w pozycji spoczynkowej modelu (w miejscu kości), potem już rusza się z nią
function przypnij(kosc, obiekt, x, y, z, ry = 0) {
  kosc.updateWorldMatrix(true, false);
  const p = new THREE.Vector3().setFromMatrixPosition(kosc.matrixWorld);
  obiekt.position.set(p.x + x, p.y + y, p.z + z); obiekt.rotation.y = ry; obiekt.updateMatrix();
  obiekt.applyMatrix4(new THREE.Matrix4().copy(kosc.matrixWorld).invert());
  kosc.add(obiekt);
  return obiekt;
}

// nowa postać: { obj, mixer, graj(nazwa, szybkosc), przedmioty, typ }
export function stworz(typ, strona, w = 0) {
  if (!gotowe || !WYGLAD[typ]) return null;
  const opis = WYGLAD[typ](w);
  const obj = new THREE.Group(), cialo = SU.clone(P[opis.stroj].scene);
  obj.add(cialo); cialo.scale.setScalar(SKALA); cialo.updateMatrixWorld(true);
  const kosci = {}; cialo.traverse(n => { if (n.isBone) kosci[n.name] = n; });
  dolacz(cialo, kosci, opis.kobieta ? P.glowa_k : P.glowa_m);
  if (opis.wlosy && !opis.helm) dolacz(cialo, kosci, P[opis.wlosy], WLOSY[(w + strona) % WLOSY.length]);
  if (opis.broda) dolacz(cialo, kosci, P.broda, WLOSY[(w + strona) % WLOSY.length]);
  // przedmioty w pozycji spoczynkowej: modele mają ręce opuszczone (lekko na boki), dłonie przy biodrach
  const cialoOdwr = new THREE.Matrix4().copy(cialo.matrixWorld).invert();
  const wModelu = kosc => { kosc.updateWorldMatrix(true, false); return new THREE.Matrix4().multiplyMatrices(cialoOdwr, kosc.matrixWorld); };
  const przedmioty = {};
  const wDloni = (nazwaKosci, rzecz, z = 0.02) => {
    const kosc = kosci[nazwaKosci]; if (!kosc) return null;
    const g = new THREE.Group(); for (const m of PRZEDMIOTY[rzecz]()) g.add(m);
    // w modelu (przed skalą) dłoń jest na wysokości bioder; przedmiot trzymany przed sobą
    const m = wModelu(kosc), p = new THREE.Vector3().setFromMatrixPosition(m);
    g.position.set(p.x, p.y - 0.02, p.z + z); g.updateMatrix();
    g.applyMatrix4(new THREE.Matrix4().copy(m).invert()); kosc.add(g);
    return g;
  };
  for (const n of ['siekiera', 'kilof', 'mlotek', 'sierp']) if (typ === 'osadnik') { przedmioty[n] = wDloni('hand_r', n); przedmioty[n].visible = false; }
  if (opis.prawa) przedmioty.prawa = wDloni('hand_r', opis.prawa);
  if (opis.lewa) przedmioty.lewa = wDloni('hand_l', opis.lewa);
  if (opis.tarcza && kosci.lowerarm_l) {
    const t = tarcza(strona), m = wModelu(kosci.lowerarm_l), p = new THREE.Vector3().setFromMatrixPosition(m);
    t.position.set(p.x - 0.09, p.y - 0.05, p.z + 0.05); t.updateMatrix(); t.applyMatrix4(new THREE.Matrix4().copy(m).invert()); kosci.lowerarm_l.add(t);
  }
  if (opis.helm && kosci.Head) {
    const h = helm(), m = wModelu(kosci.Head), p = new THREE.Vector3().setFromMatrixPosition(m);
    h.position.set(p.x, p.y + 0.07, p.z + 0.01); h.scale.setScalar(1.12); h.updateMatrix(); h.applyMatrix4(new THREE.Matrix4().copy(m).invert()); kosci.Head.add(h);
  }
  // kolor strony: koszula chłopa albo zielone części stroju myśliwego są przefarbowane na kolor strony
  cialo.traverse(m => { if (m.isMesh && m.material.map && /peasant|ranger/i.test(m.material.map.name || '')) m.material = materialStrony(m.material, strona); });
  const mixer = new THREE.AnimationMixer(cialo);
  const akcje = {};
  let teraz = null;
  function graj(nazwa, szybkosc = 1, raz = false) {
    const klip = RUCHY[nazwa]; if (!klip) return;
    let a = akcje[nazwa];
    if (!a) { a = akcje[nazwa] = mixer.clipAction(klip); if (raz) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } }
    a.timeScale = szybkosc;
    if (teraz === a) return;
    a.reset().play();
    if (teraz) a.crossFadeFrom(teraz, 0.22, false);
    teraz = a;
  }
  return { obj, mixer, graj, przedmioty, opis, typ, kosci };
}
// ile trwa ruch (sekundy), np. żeby dopasować cios do odstępu między uderzeniami
export const dlugosc = nazwa => RUCHY[nazwa] ? RUCHY[nazwa].duration : 1;
