/* Wersja robocza: nowa gra na telefon (na razie bez zadań, najpierw grywalność).
   Baza pod kopułą broni się przed deszczem meteorów. Gracz przesuwa palcem robota, który strzela prosto w górę,
   wieżyczki pomagają z boku, a po każdym nowym poziomie gracz wybiera jedną z trzech kart: nową wieżyczkę albo ulepszenie.
   Na końcu etapu przylatuje Asteroida. */
(() => {
'use strict';
const HAS_DOM = typeof document !== 'undefined';
const WERSJA = 6;          // numer wersji gry; opis zmian w wersja-robocza/ZMIANY.md

/* ============================================================
   Helpers
   ============================================================ */
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const TAU = Math.PI * 2;
const mmss = s => { s = Math.max(0, Math.floor(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const big = n => n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',')} mln`
  : n >= 1e4 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace('.', ',')} tys.` : String(Math.round(n));

/* ============================================================
   World
   Logical units: the world is always 400 wide and the ground line is fixed,
   so on every phone the meteors have the same way down to the dome
   ============================================================ */
const W = 400, GROUND = 740, BOTTOM = 784;   // below the ground only a thin strip: the rest of the screen is sky
const DOME_H = 100, DOME_RX = 232, DOME_TOP = GROUND - DOME_H;
const FIELD_Y = 430;                       // middle of the slowing field
const POLE = { charge: 3.5, dur: 5, launch: 0.35, open: 0.28, close: 0.3, linger: 3 };   // the field generator: seconds of each phase; meteors stay slow a while after leaving the field
const SPAWN_Y = -40;
const VISIBLE_Y = 40;                      // turrets aim only at meteors below this line
const SLOT_X = [52, 124, 200, 276, 348];   // turret pads; the robot stands in the middle one
const ROBOT_SLOT = 2, BUILD_ORDER = [1, 3, 0, 4];
const TIME_BOSS = 210;                     // the Asteroid comes at 3:30
const ROBOT_SPEED = 650;                   // how fast the robot walks after the finger
const ROBOT_GUN_Y = GROUND - 54;
// meteors come in waves: from the left, from the right, onto the middle, or everywhere at once
const ZONES = { lewa: [46, 152], srodek: [140, 260], prawa: [248, 354], wszedzie: [46, 354] };   // not too close to the screen sides
const EDGE = 38;                           // meteors never drift closer than this to a side
const domeY = x => { const u = (x - W / 2) / DOME_RX; return GROUND - DOME_H * Math.sqrt(Math.max(0, 1 - u * u)); };

/* ============================================================
   Balance (checked with narzedzia/balans-robocza.js)
   ============================================================ */
const BAL = {
  baseHp: 3000,
  hp0: 10, hpGrow: 45, hpPow: 1.0,         // meteor life: hp0 × (1 + t / hpGrow)^hpPow
  rate0: 0.9, rateGrow: 0.028,             // meteors per second: rate0 + rateGrow × t
  stageHp: 1.1, stageRate: 0.03,            // every next stage
  bossHp: 24000, bossSpeed: 7,
  robotLvl: 0.085,                         // the robot's own growth per level
  side: 0.4,                               // strength of the turrets beside the robot (1 = as strong as in version 2)
  xpNeed: L => Math.round(6 + 2.5 * (3.5 * L + 0.22 * L * L)),   // about 12 cards in a battle
};
const KINDS = {
  meteor: { r: 13, hp: 1,   v: [52, 70],  dmg: 14, xp: 1 },
  shard:  { r: 12, hp: 1.4, v: [92, 115], dmg: 22, xp: 2 },
  red:    { r: 15, hp: 4.5, v: [34, 44],  dmg: 40, xp: 4 },
  big:    { r: 21, hp: 3,   v: [40, 52],  dmg: 32, xp: 3 },
};
function spawnKind(t) {
  const r = Math.random();
  const pShard = t < 35 ? 0 : Math.min(0.22, (t - 35) / 300);
  const pRed = t < 55 ? 0 : Math.min(0.14, (t - 55) / 600);
  const pBig = t < 90 ? 0 : Math.min(0.12, (t - 90) / 700);
  if (r < pShard) return 'shard';
  if (r < pShard + pRed) return 'red';
  if (r < pShard + pRed + pBig) return 'big';
  return 'meteor';
}

/* ============================================================
   Weapons and cards
   Every card adds a star; after 4 stars the weapon's super card can come
   ============================================================ */
// Cards come less often than in version 4, but each one gives more
const WEAPONS = {
  robot: { name: 'Strażnik', short: 'Strażnik', color: '#6ff4ff', build: 'Robot, którego przesuwasz palcem. Strzela prosto w górę',
    ups: [
      { id: 'multi', name: 'Dodatkowa lufa', text: '+1 pocisk obok, lekko rozchylony', max: 3 },
      { id: 'dmg', name: 'Mocniejsza amunicja', text: 'Pociski +80% obrażeń i nowa, większa amunicja', max: 3 },
      { id: 'rate', name: 'Szybkie strzelanie', text: 'Strażnik strzela o 50% szybciej', max: 2 },
      { id: 'pierce', name: 'Przebijające pociski', text: 'Pocisk przebija 2 meteory więcej', max: 2 },
      { id: 'crit', name: 'Celne oko', text: '+25% szans na podwójne trafienie', max: 2 },
    ],
    sup: { name: 'Deszcz pocisków', text: 'Co 4 sekundy wachlarz 10 pocisków' } },
  laser: { name: 'Laser', short: 'Laser', color: '#b56cff', build: 'Cienki fioletowy promień rani wszystko na swojej drodze',
    ups: [
      { id: 'dmg', name: 'Mocniejszy laser', text: 'Laser +90% obrażeń', max: 3 },
      { id: 'dur', name: 'Dłuższy promień', text: 'Laser świeci o 70% dłużej', max: 2 },
      { id: 'cool', name: 'Krótsza przerwa', text: 'Przerwa między strzałami o 40% krótsza', max: 2 },
      { id: 'two', name: 'Drugi promień', text: 'Laser strzela dwoma promieniami', max: 1 },
    ],
    sup: { name: 'Laser bez przerwy', text: 'Laser świeci cały czas' } },
  pole: { name: 'Pole zwalniające', short: 'Pole', color: '#5cf0c0', build: 'Generator wystrzeliwuje pas, w którym meteory mocno zwalniają',
    ups: [
      { id: 'dur', name: 'Dłuższe pole', text: 'Pole działa o 50% dłużej', max: 2 },
      { id: 'charge', name: 'Szybsze ładowanie', text: 'Generator ładuje się o 40% szybciej', max: 2 },
      { id: 'slow', name: 'Gęste pole', text: 'Meteory w polu są jeszcze wolniejsze', max: 1 },
      { id: 'wide', name: 'Szersze pole', text: 'Pas pola o 70% szerszy', max: 1 },
    ],
    sup: { name: 'Pole na stałe', text: 'Pole działa cały czas' } },
  dzialo: { name: 'Działo ogniowe', short: 'Działo', color: '#ff9a3c', build: 'Pociski wybuchają i podpalają meteory dookoła',
    ups: [
      { id: 'dmg', name: 'Mocniejszy wybuch', text: 'Wybuchy +90% obrażeń', max: 3 },
      { id: 'big', name: 'Większy wybuch', text: 'Wybuch o 50% większy', max: 2 },
      { id: 'more', name: 'Drugi pocisk', text: '+1 pocisk w każdym strzale', max: 2 },
      { id: 'fast', name: 'Szybkie ładowanie', text: 'Działo strzela o 50% częściej', max: 2 },
    ],
    sup: { name: 'Bombardowanie', text: 'Co 5 sekund 8 wybuchów naraz' } },
  piorun: { name: 'Wieża piorunów', short: 'Piorun', color: '#8ec5ff', build: 'Piorun skacze z meteoru na meteor',
    ups: [
      { id: 'jump', name: 'Dłuższy piorun', text: 'Piorun skacze na 3 meteory więcej', max: 2 },
      { id: 'dmg', name: 'Mocniejszy piorun', text: 'Piorun +90% obrażeń', max: 3 },
      { id: 'fast', name: 'Częstsze pioruny', text: 'Piorun uderza o 50% częściej', max: 2 },
      { id: 'stun', name: 'Ogłuszenie', text: 'Trafiony meteor na chwilę staje', max: 1 },
    ],
    sup: { name: 'Burza', text: 'Uderzają 3 pioruny naraz' } },
  rakiety: { name: 'Wyrzutnia rakiet', short: 'Rakiety', color: '#ff6464', build: 'Rakiety same lecą do najtwardszych meteorów',
    ups: [
      { id: 'more', name: 'Więcej rakiet', text: '+2 rakiety w każdej salwie', max: 2 },
      { id: 'dmg', name: 'Mocniejsze rakiety', text: 'Rakiety +90% obrażeń', max: 3 },
      { id: 'fast', name: 'Szybkie ładowanie', text: 'Wyrzutnia strzela o 50% częściej', max: 2 },
      { id: 'big', name: 'Większy wybuch', text: 'Wybuch rakiety o 60% większy', max: 1 },
    ],
    sup: { name: 'Wielka salwa', text: 'Co 6 sekund 10 rakiet naraz' } },
};
const STARS_FOR_SUPER = 3;
const LASER_W = 6;                         // the laser is a thin beam
// The robot's ammunition changes with every "Mocniejsza amunicja" card: other colour, bigger, another kind
const AMMO = [
  { name: 'Iskry', col: '120,244,255' },
  { name: 'Plazma', col: '90,160,255' },
  { name: 'Pociski fuzyjne', col: '255,110,215' },
  { name: 'Złote włócznie', col: '255,212,90' },
];
const TURRETS = ['laser', 'pole', 'dzialo', 'piorun', 'rakiety'];
const COMBOS = [
  { id: 'zamroz', a: 'laser', b: 'pole', name: 'Laser i pole', text: 'Laser zadaje 2× większe obrażenia meteorom w polu' },
  { id: 'iskra', a: 'robot', b: 'piorun', name: 'Iskrzące pociski', text: 'Co 5. seria Strażnika wywołuje piorun' },
  { id: 'napalm', a: 'dzialo', b: 'pole', name: 'Podwójny wybuch', text: 'Wybuch w polu wybucha drugi raz' },
  { id: 'roj', a: 'rakiety', b: 'piorun', name: 'Rakiety z piorunem', text: 'Wybuch rakiety razi piorunem 3 meteory obok' },
];
const HEAL = 0.3;

/* ============================================================
   Battle state
   ============================================================ */
function newBattle(stage, opts = {}) {
  const G = {
    stage, fx: !!opts.fx, demo: !!opts.demo, t: 0, over: null,
    hpMul: Math.pow(BAL.stageHp, stage - 1), rateMul: 1 + BAL.stageRate * (stage - 1),
    baseMax: BAL.baseHp, baseHp: BAL.baseHp,
    enemies: [], bullets: [], shells: [], rockets: [], later: [],
    nums: [], booms: [], bolts: [], sparks: [], embers: [], ev: [],
    w: {}, combos: {}, dmg: {}, kills: 0, slowed: 0, cards: [],
    xp: 0, lvl: 1, need: BAL.xpNeed(1), pending: 0, rerolls: 1,
    spawnAcc: 0, nextSurge: 55, surge: null, wave: null, lastZone: null, aim: W / 2, boss: null, bossDone: false,
    domeFlash: 0, domeFreeze: 0, impacts: [], cracks: [], shake: 0, nextId: 1,
  };
  addWeapon(G, 'robot');
  return G;
}
const emit = (G, name) => { if (G.fx) G.ev.push(name); };
const up = (w, id) => w.ups[id] || 0;

function addWeapon(G, key) {
  const used = Object.values(G.w).map(w => w.slot);
  const slot = key === 'robot' ? ROBOT_SLOT : BUILD_ORDER.find(s => !used.includes(s));
  G.w[key] = { key, slot, x: SLOT_X[slot], ups: {}, stars: 0, sup: false, cd: 0.4, supCd: 2, ang: 0, kick: 0,
    on: false, phase: 0.4, h: 64, beams: [], volleys: 0, side: 0, built: G.t, vx: 0, step: 0 };
  if (!(key in G.dmg)) G.dmg[key] = 0;
}

/* ---------- meteors ---------- */
function spawnEnemy(G, kind, x, y) {
  const K = KINDS[kind], t = G.demo ? 25 : Math.min(G.t, TIME_BOSS);
  const hp = BAL.hp0 * Math.pow(1 + t / BAL.hpGrow, BAL.hpPow) * K.hp * G.hpMul;
  const x0 = clamp(x ?? rand(46, W - 46), EDGE + 6, W - EDGE - 6), y0 = y ?? SPAWN_Y - rand(0, 60);
  const vy = rand(K.v[0], K.v[1]);
  const e = { id: G.nextId++, kind, x: x0, y: y0, r: K.r, hp, max: hp, vx: rand(-5, 5), vy,   // almost straight down
    dmg: Math.round(K.dmg * (1 + t / 240)), xp: K.xp, slow: 0, stun: 0, burn: 0, burnT: 0, inc: 0, flash: 0,
    pend: 0, pendT: 0, variant: randi(0, 2), slowShown: false, slowT: 0, slowAmt: 0, dead: false, born: G.t, spin: rand(-1.6, 1.6), rot0: rand(0, TAU) };
  G.enemies.push(e);
  return e;
}
function spawnUpdate(G, dt) {
  const t = G.demo ? 25 : G.t;
  let rate = (BAL.rate0 + BAL.rateGrow * Math.min(t, TIME_BOSS)) * G.rateMul;
  if (G.boss) rate *= 0.35;
  // the next wave: left, middle or right (never the same side twice in a row), now and then everywhere at once
  if (!G.wave || (G.wave.t -= dt) <= 0) {
    const all = G.t > 25 && Math.random() < Math.min(0.3, 0.1 + G.t / 1000);
    const sides = ['lewa', 'srodek', 'prawa'].filter(z => z !== G.lastZone);
    const zone = all ? 'wszedzie' : pick(sides);
    G.wave = { zone, t: rand(3.5, 6) };
    if (zone !== 'wszedzie') G.lastZone = zone;
  }
  G.spawnAcc += rate * dt;
  while (G.spawnAcc >= 1) { G.spawnAcc -= 1; const Z = ZONES[G.wave.zone]; spawnEnemy(G, spawnKind(t), rand(Z[0], Z[1])); }
  if (G.demo) return;
  // a swarm every 35 seconds, from one side
  if (!G.boss && t >= G.nextSurge && t < TIME_BOSS - 15) {
    const zone = pick(['lewa', 'srodek', 'prawa']);
    G.surge = { left: Math.round((5 + t / 12) * G.rateMul), zone, acc: 0 };
    G.nextSurge += 35; emit(G, `roj-${zone}`);
  }
  if (G.surge) {
    G.surge.acc += dt * 7;
    while (G.surge.acc >= 1 && G.surge.left > 0) {
      G.surge.acc -= 1; G.surge.left--;
      const Z = ZONES[G.surge.zone];
      spawnEnemy(G, Math.random() < 0.2 ? 'shard' : 'meteor', rand(Z[0], Z[1]));
    }
    if (G.surge.left <= 0) G.surge = null;
  }
  if (!G.boss && !G.bossDone && t >= TIME_BOSS) spawnBoss(G);
}

/* ---------- the Asteroid ---------- */
function spawnBoss(G) {
  const hp = BAL.bossHp * G.hpMul;
  G.boss = { isBoss: true, x: W / 2, y: -150, r: 150, hp, max: hp, slow: 0, spit: 3, flash: 0, pend: 0, pendT: 0, inc: 0, stun: 0, dead: false };
  emit(G, 'boss');
}
function bossUpdate(G, dt) {
  const B = G.boss;
  if (!B) return;
  B.y += BAL.bossSpeed * (1 - B.slow * 0.6) * dt;
  B.flash = Math.max(0, B.flash - dt);
  B.spit -= dt;
  if (B.spit <= 0) {
    B.spit = 2.4;
    for (let i = 0; i < 3; i++) spawnEnemy(G, Math.random() < 0.3 ? 'shard' : 'meteor', B.x + rand(-0.8, 0.8) * B.r, B.y + B.r * 0.75);
  }
  popPending(G, B, dt);
  if (B.y + B.r * 0.86 >= DOME_TOP) { G.baseHp = 0; G.domeFlash = 1; G.shake = 1; }
}

/* ---------- damage ---------- */
function numAt(G, e, v, crit) {
  if (!G.fx || v < 0.5) return;
  const x = e.isBoss ? e.x + rand(-90, 90) : e.x + rand(-7, 7);
  const y = e.isBoss ? e.y + e.r * 0.72 + rand(-25, 15) : e.y - e.r * 0.6;
  G.nums.push({ x, y, v: Math.round(v), t: 0, crit: !!crit });
  if (G.nums.length > 90) G.nums.shift();
}
function popPending(G, e, dt) {
  e.pendT -= dt;
  // tiny sums wait until they grow, so the sky is not full of "-1"
  if (e.pend >= 8 && e.pendT <= 0) { numAt(G, e, e.pend); e.pend = 0; e.pendT = 0.32; }
}
// cont: continuous damage (laser, field, burning) — its numbers are added up and shown every third of a second
function hurt(G, e, dmg, src, crit, cont) {
  if (e.dead || e.hp <= 0) return;
  const done = Math.min(dmg, e.hp);
  e.hp -= dmg; G.dmg[src] = (G.dmg[src] || 0) + done;
  if (!cont) e.flash = 0.07;
  if (G.fx) { if (cont) e.pend += dmg; else numAt(G, e, dmg, crit); }
  if (e.hp <= 0) { if (e.isBoss) killBoss(G); else killEnemy(G, e); }
}
function killEnemy(G, e) {
  e.dead = true; G.kills++;
  if (e.pend >= 5) numAt(G, e, e.pend);
  if (G.fx) {
    const col = e.kind === 'red' ? '#ff5a5a' : e.kind === 'shard' ? '#cfd6e0' : '#ffb066';
    for (let i = 0; i < 5; i++) { const a = rand(0, TAU), v = rand(40, 130); G.sparks.push({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rand(0.25, 0.45), col, s: rand(1.5, 3) }); }
    G.booms.push({ x: e.x, y: e.y, rad: e.r * 1.4, t: 0, life: 0.22, col: 'pop' });
    emit(G, 'pop');
  }
  if (G.demo) return;
  G.xp += e.xp;
  let lv = false;
  while (G.xp >= G.need) { G.xp -= G.need; G.lvl++; G.need = BAL.xpNeed(G.lvl); G.pending++; lv = true; }
  if (lv) emit(G, 'poziom');
}
function killBoss(G) {
  const B = G.boss;
  B.dead = true; G.bossDone = true;
  if (G.fx) {
    for (let i = 0; i < 14; i++) G.booms.push({ x: B.x + rand(-1, 1) * B.r * 0.8, y: B.y + rand(-1, 1) * B.r * 0.8, rad: rand(40, 90), t: -i * 0.07, life: 0.6, col: 'fire' });
    G.shake = 1;
  }
  for (const e of G.enemies) if (!e.dead) { e.dead = true; if (G.fx) G.booms.push({ x: e.x, y: e.y, rad: e.r * 1.8, t: -rand(0, 0.5), life: 0.35, col: 'fire' }); }
  G.boss = null;
  G.over = 'win'; emit(G, 'wygrana');
}

function explode(G, x, y, rad, dmg, src, burn, second) {
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, rr = rad + e.r;
    if (dx * dx + dy * dy < rr * rr) {
      hurt(G, e, dmg, src);
      if (burn && !e.dead) { e.burn = Math.max(e.burn, burn); e.burnT = 2.5; e.burnSrc = src; }
    }
  }
  const B = G.boss;
  if (B) { const d = Math.hypot(B.x - x, B.y - y); if (d < rad + B.r) hurt(G, B, dmg, src); }
  if (G.fx) { G.booms.push({ x, y, rad, t: 0, life: 0.38, col: src === 'rakiety' ? 'red' : 'fire' }); emit(G, 'wybuch'); }
  if (!second && src === 'dzialo' && G.combos.napalm && G.w.pole && G.w.pole.on && Math.abs(y - FIELD_Y) < G.w.pole.h / 2 + 10)
    G.later.push({ at: G.t + 0.3, x, y, rad, dmg: dmg * 0.7, src, burn, second: true });
  if (src === 'rakiety' && G.combos.roj) {
    const near = G.enemies.filter(e => !e.dead && Math.hypot(e.x - x, e.y - y) < 130).slice(0, 3);
    for (const e of near) lightning(G, x, y, e, 0, 28 * BAL.side * (1 + 0.9 * up(G.w.piorun, 'dmg')), 'piorun', 0);
  }
}
function lightning(G, x0, y0, first, jumps, dmg, src, stun) {
  const pts = [[x0, y0]], hit = new Set();
  let cur = first;
  for (let j = 0; cur && j <= jumps; j++) {
    hit.add(cur);
    pts.push([cur.x, cur.isBoss ? cur.y + cur.r * 0.8 : cur.y]);
    hurt(G, cur, dmg, src);
    if (stun && !cur.isBoss) cur.stun = Math.max(cur.stun, stun);
    let best = null, bd = 120 * 120;
    for (const e of G.enemies) {
      if (e.dead || hit.has(e) || e.y < VISIBLE_Y) continue;
      const d = (e.x - cur.x) ** 2 + (e.y - (cur.isBoss ? cur.y + cur.r * 0.8 : cur.y)) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    cur = best;
  }
  if (G.fx) G.bolts.push({ pts, t: 0 });
}

/* ---------- targets ---------- */
function visible(G) { return G.enemies.filter(e => !e.dead && e.y > VISIBLE_Y); }
// the meteor nearest the dome that is not already being finished off by bullets on the way
function lowest(G, skipFull) {
  let best = null, by = -1e9, any = null, ay = -1e9;
  for (const e of G.enemies) {
    if (e.dead || e.y < VISIBLE_Y) continue;
    if (e.y > ay) { ay = e.y; any = e; }
    if (skipFull && e.inc >= e.hp) continue;
    if (e.y > by) { by = e.y; best = e; }
  }
  best = best || any;
  // with the Asteroid in the sky, meteors still high up can wait: shoot the Asteroid
  if (G.boss && (!best || best.y < 450)) return G.boss;
  return best;
}
function strongest(G, skip) {
  let best = null, bh = -1;
  for (const e of G.enemies) if (!e.dead && e.y > VISIBLE_Y && e !== skip && e.hp > bh) { bh = e.hp; best = e; }
  if (G.boss && (!best || G.boss.hp > bh * 3)) return G.boss;
  return best;
}
function clusterTarget(G) {
  const V = G.enemies.filter(e => !e.dead && e.y > VISIBLE_Y + 30 && e.y < DOME_TOP - 10);
  if (!V.length) return G.boss ? { x: G.boss.x + rand(-80, 80), y: G.boss.y + G.boss.r * 0.8, vx: 0, vy: 0, slow: 0 } : null;
  let best = null, bs = -1;
  for (let i = 0; i < Math.min(18, V.length); i++) {
    const c = V.length > 18 ? pick(V) : V[i];
    let n = 0;
    for (const e of V) { const dx = e.x - c.x, dy = e.y - c.y; if (dx * dx + dy * dy < 3600) n++; }
    const s = n + c.y / 800;
    if (s > bs) { bs = s; best = c; }
  }
  return best;
}
const aimY = e => (e.isBoss ? e.y + e.r * 0.6 : e.y);
const speedOf = e => (e.isBoss ? 0 : e.stun > 0 ? 0 : 1 - e.slow);

/* ---------- the dome: a hit freezes the field and cracks it; the weaker the base, the more lasting cracks ---------- */
const crackCount = G => Math.floor((1 - Math.max(0, G.baseHp) / G.baseMax) * 16);
function crackShape(branches, size) {
  const lines = [];
  for (let i = 0; i < branches; i++) {
    let a = (i / branches) * TAU + rand(-0.4, 0.4), px = 0, py = 0;
    const pts = [[0, 0]], n = randi(3, 5);
    for (let j = 0; j < n; j++) {
      a += rand(-0.6, 0.6);
      const l = rand(5, 11) * size * (1 - j * 0.12);
      px += Math.cos(a) * l; py += Math.sin(a) * l * 0.7; pts.push([px, py]);
      if (Math.random() < 0.35) lines.push([[px, py], [px + Math.cos(a + 1) * l * 0.5, py + Math.sin(a + 1) * l * 0.35]]);
    }
    lines.push(pts);
  }
  return lines;
}
function domeHit(G, x) {
  G.domeFreeze = 1;
  G.impacts.push({ x, y: domeY(x), t: 0, shape: crackShape(randi(4, 6), 1.4) });
  if (G.impacts.length > 12) G.impacts.shift();
  const want = crackCount(G);
  while (G.cracks.length < want) G.cracks.push({ x: x + rand(-10, 10), y: domeY(x) + rand(4, 24), shape: crackShape(randi(3, 5), 1.5) });
}

/* ---------- weapons ---------- */
function fireBullet(G, x, y, a, dmg, pierce, crit, tgt, tier = 0) {
  G.bullets.push({ x, y, vx: Math.sin(a) * 950, vy: -Math.cos(a) * 950, dmg, pierce, crit, tgt, tier, pl: pierce, hits: [], dead: false });
  if (tgt) tgt.inc += dmg;
}
// The robot walks after the finger and always shoots straight up: full power only right in front of it.
// Extra barrels add bullets beside, a little spread out, but never enough to cover the whole sky.
function updRobot(G, w, dt) {
  const tx = clamp(G.aim, 22, W - 22), x0 = w.x;
  w.x += clamp(tx - w.x, -ROBOT_SPEED * dt, ROBOT_SPEED * dt);
  w.vx = (w.x - x0) / dt; w.step += Math.abs(w.x - x0);
  const interval = 0.3 / (1 + 0.5 * up(w, 'rate'));
  // every new level makes the robot a little stronger by itself, whatever cards were picked
  const n = 1 + up(w, 'multi'), dmg = 18 * (1 + 0.8 * up(w, 'dmg')) * (1 + BAL.robotLvl * (G.lvl - 1)), pierce = 2 * up(w, 'pierce'), crit = 0.25 * up(w, 'crit');
  const tier = up(w, 'dmg');
  w.cd -= dt; w.kick = Math.max(0, w.kick - dt * 7);
  if (w.cd <= 0) {
    w.cd = Math.max(0, w.cd + interval);
    for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; fireBullet(G, w.x + k * 7, ROBOT_GUN_Y, k * 0.035, dmg, pierce, crit, null, tier); }
    w.volleys++; w.kick = 1; w.side ^= 1;
    if (G.combos.iskra && G.w.piorun && w.volleys % 5 === 0) { const tg = lowest(G, false); if (tg) lightning(G, w.x, ROBOT_GUN_Y, tg, 3, 26 * BAL.side * (1 + 0.9 * up(G.w.piorun, 'dmg')), 'piorun', 0); }
    emit(G, 'strzal');
  }
  if (w.sup) {
    w.supCd -= dt;
    if (w.supCd <= 0) { w.supCd = 4; for (let i = 0; i < 10; i++) fireBullet(G, w.x, ROBOT_GUN_Y, -0.45 + 0.9 * i / 9, dmg, pierce + 1, crit, null, tier); emit(G, 'salwa'); }
  }
}
// The demo in the menu walks by itself after the most dangerous meteor
function autoAim(G) {
  let best = null, by = -1e9;
  for (const e of G.enemies) if (!e.dead && e.y > 0 && e.y > by) { by = e.y; best = e; }
  return best ? best.x : W / 2;
}
function cycle(G, w, dt, dur, cool, sound) {
  if (w.sup) { w.on = true; return; }
  w.phase -= dt;
  if (w.phase <= 0) { w.on = !w.on; w.phase = w.on ? dur : cool; if (w.on) emit(G, sound); }
}
function updLaser(G, w, dt) {
  const n = 1 + up(w, 'two');
  while (w.beams.length < n) w.beams.push({ ang: w.beams.length ? 0.3 : -0.2 });
  cycle(G, w, dt, 2.4 * (1 + 0.7 * up(w, 'dur')), 2.6 * Math.pow(0.6, up(w, 'cool')), 'laser');
  const ox = w.x, oy = GROUND - 13;
  const t0 = lowest(G, false);
  for (let i = 0; i < n; i++) {
    const B = w.beams[i];
    let tg = t0;
    if (i === 1) tg = G.boss || strongest(G, t0) || t0;
    const want = tg ? Math.atan2(tg.x - ox, oy - aimY(tg)) : 0;
    B.ang += clamp(want - B.ang, -dt * 2.4, dt * 2.4);
  }
  if (!w.on) return;
  const width = LASER_W, dps = 60 * BAL.side * (1 + 0.9 * up(w, 'dmg'));
  for (const B of w.beams) {
    const dx = Math.sin(B.ang), dy = -Math.cos(B.ang);
    for (const e of G.enemies) {
      if (e.dead) continue;
      const rx = e.x - ox, ry = e.y - oy;
      if (rx * dx + ry * dy <= 0) continue;
      if (Math.abs(rx * dy - ry * dx) < e.r + width / 2) hurt(G, e, dps * dt * (G.combos.zamroz && e.slow > 0 ? 2 : 1), 'laser', false, true);
    }
    const BO = G.boss;
    if (BO) { const rx = BO.x - ox, ry = BO.y - oy; if (rx * dx + ry * dy > 0 && Math.abs(rx * dy - ry * dx) < BO.r) hurt(G, BO, dps * dt * (G.combos.zamroz && BO.slow > 0 ? 2 : 1), 'laser', false, true); }
  }
}
// The generator charges, fires a shot up to the sky, and the field spreads from there to both sides.
// The field does not hurt: it only slows meteors down, so the other weapons have more time.
function updPole(G, w, dt) {
  w.h = 80 * (1 + 0.7 * up(w, 'wide'));
  w.kick = Math.max(0, w.kick - dt * 3);
  if (!w.state) { w.state = 'charge'; w.phase = w.chargeT = 1.5; }      // the first field comes soon after building
  w.phase -= dt;
  if (w.state === 'charge') {
    w.charge = clamp(1 - w.phase / w.chargeT, 0, 1);
    if (!w.whine && w.phase < 1) { w.whine = true; emit(G, 'ladowanie'); }
    if (w.phase <= 0) { w.state = 'launch'; w.phase = POLE.launch; w.charge = 0; w.kick = 1; emit(G, 'pole-strzal'); }
  } else if (w.state === 'launch') {
    if (w.phase <= 0) { w.state = 'open'; w.phase = POLE.open; emit(G, 'pole'); }
  } else if (w.state === 'open') {
    if (w.phase <= 0) { w.state = 'on'; w.phase = POLE.dur * (1 + 0.5 * up(w, 'dur')); }
  } else if (w.state === 'on') {
    if (w.sup) w.phase = Math.max(w.phase, 1);
    if (w.phase <= 0) { w.state = 'close'; w.phase = POLE.close; }
  } else if (w.state === 'close' && w.phase <= 0) {
    w.state = 'charge'; w.phase = w.chargeT = POLE.charge * Math.pow(0.6, up(w, 'charge')); w.whine = false;
  }
  w.on = w.state === 'open' || w.state === 'on';
  const u = w.state === 'open' ? 1 - w.phase / POLE.open : 1;
  w.spread = w.state === 'open' ? 1 - (1 - u) * (1 - u) : w.state === 'on' || w.state === 'close' ? 1 : 0;
  if (!w.on) return;
  const slow = Math.min(0.9, 0.7 + 0.12 * up(w, 'slow')), reach = 440 * w.spread;
  const y0 = FIELD_Y - w.h / 2, y1 = FIELD_Y + w.h / 2;
  for (const e of G.enemies) {
    if (e.dead || e.y + e.r < y0 || e.y - e.r > y1 || Math.abs(e.x - w.x) > reach) continue;
    e.slow = Math.max(e.slow, slow); e.slowAmt = slow; e.slowT = POLE.linger;
    if (!e.slowShown) { e.slowShown = true; G.slowed++; if (G.fx && Math.random() < 0.2) G.nums.push({ x: e.x, y: e.y - 14, v: 'Wolniej', t: 0, slow: true }); }
  }
  const B = G.boss;
  if (B && B.y + B.r > y0) B.slow = slow;
}
function updDzialo(G, w, dt) {
  w.cd -= dt; w.kick = Math.max(0, w.kick - dt * 5);
  const n = 1 + up(w, 'more'), rad = 42 * (1 + 0.5 * up(w, 'big')), dmg = 40 * BAL.side * (1 + 0.9 * up(w, 'dmg'));
  if (w.cd <= 0) {
    const tg = clusterTarget(G);
    if (!tg) w.cd = 0.2;
    else {
      w.cd = 1.7 * Math.pow(0.67, up(w, 'fast'));
      for (let i = 0; i < n; i++) {
        const e = i === 0 ? tg : clusterTarget(G) || tg, T = 0.5, f = speedOf(e);
        const tx = e.x + (e.vx || 0) * f * T, ty = (e.isBoss ? e.y : e.y + (e.vy || 0) * f * T);
        G.shells.push({ x0: w.x, y0: GROUND - 34, tx, ty, x: w.x, y: GROUND - 34, t: -i * 0.12, T, rad, dmg, burn: dmg * 0.22 });
        if (i === 0) w.ang = Math.atan2(tx - w.x, GROUND - 34 - ty) * 0.6;
      }
      w.kick = 1; emit(G, 'dzialo');
    }
  }
  if (w.sup) {
    w.supCd -= dt;
    if (w.supCd <= 0) {
      w.supCd = 5;
      const V = visible(G);
      for (let i = 0; i < 8; i++) {
        const e = V.length ? pick(V) : null;
        G.later.push({ at: G.t + i * 0.09, x: e ? e.x : rand(40, W - 40), y: e ? e.y : rand(150, 500), rad: rad * 1.1, dmg, src: 'dzialo', burn: dmg * 0.22 });
      }
    }
  }
}
function updPiorun(G, w, dt) {
  w.cd -= dt;
  if (w.cd > 0) return;
  const tg = lowest(G, false);
  if (!tg) { w.cd = 0.2; return; }
  w.cd = 1.25 * Math.pow(0.67, up(w, 'fast'));
  const jumps = 3 + 3 * up(w, 'jump'), dmg = 30 * BAL.side * (1 + 0.9 * up(w, 'dmg')), stun = up(w, 'stun') ? 0.45 : 0;
  lightning(G, w.x, GROUND - 52, tg, jumps, dmg, 'piorun', stun);
  if (w.sup) {
    const V = visible(G);
    for (let i = 0; i < 2 && V.length; i++) lightning(G, w.x, GROUND - 52, pick(V), jumps, dmg, 'piorun', stun);
  }
  w.kick = 1; emit(G, 'piorun');
}
function launchRocket(G, w, i, n, tgt) {
  G.rockets.push({ x: w.x + (i - (n - 1) / 2) * 5, y: GROUND - 40, vx: rand(-120, 120), vy: -250, tgt,
    dmg: 55 * BAL.side * (1 + 0.9 * up(w, 'dmg')), rad: 34 * (1 + 0.6 * up(w, 'big')), t: 0, dead: false, smoke: 0 });
}
function updRakiety(G, w, dt) {
  w.cd -= dt; w.kick = Math.max(0, w.kick - dt * 4);
  if (w.cd <= 0) {
    const tg = strongest(G);
    if (!tg) w.cd = 0.2;
    else {
      w.cd = 2.2 * Math.pow(0.67, up(w, 'fast'));
      const n = 2 + 2 * up(w, 'more'), V = visible(G).sort((a, b) => b.hp - a.hp).slice(0, 6);
      for (let i = 0; i < n; i++) launchRocket(G, w, i, n, i === 0 ? tg : (V.length ? pick(V) : tg));
      w.kick = 1; emit(G, 'rakieta');
    }
  }
  if (w.sup) {
    w.supCd -= dt;
    if (w.supCd <= 0) { w.supCd = 6; const V = visible(G); for (let i = 0; i < 10; i++) launchRocket(G, w, i, 10, V.length ? pick(V) : G.boss); emit(G, 'rakieta'); }
  }
}
const UPDATE = { robot: updRobot, laser: updLaser, pole: updPole, dzialo: updDzialo, piorun: updPiorun, rakiety: updRakiety };

/* ---------- projectiles ---------- */
function segHit(x0, y0, x1, y1, cx, cy, r) {
  const dx = x1 - x0, dy = y1 - y0, l = dx * dx + dy * dy;
  const u = l ? clamp(((cx - x0) * dx + (cy - y0) * dy) / l, 0, 1) : 0;
  const px = x0 + dx * u - cx, py = y0 + dy * u - cy;
  return px * px + py * py < r * r;
}
function moveBullets(G, dt) {
  const B = G.boss;
  for (const b of G.bullets) {
    const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    for (const e of G.enemies) {
      if (e.dead || b.hits.includes(e.id)) continue;
      if (Math.abs(e.x - nx) > 40 || e.y < ny - 40 || e.y > b.y + 40) continue;
      if (segHit(b.x, b.y, nx, ny, e.x, e.y, e.r + 2 + b.tier)) {
        const c = Math.random() < b.crit;
        hurt(G, e, b.dmg * (c ? 2 : 1), 'robot', c);
        if (G.fx) G.sparks.push({ x: e.x + rand(-4, 4), y: e.y + e.r * 0.5, vx: rand(-60, 60), vy: rand(20, 90), t: 0, life: 0.18, col: '#bdfcff', s: 2 });
        b.hits.push(e.id);
        if (--b.pierce < 0) { b.dead = true; break; }
      }
    }
    if (!b.dead && B && segHit(b.x, b.y, nx, ny, B.x, B.y, B.r)) {
      const c = Math.random() < b.crit;
      hurt(G, B, b.dmg * (c ? 2 : 1), 'robot', c);
      b.dead = true;
    }
    b.x = nx; b.y = ny;
    if (ny < -240 || nx < -30 || nx > W + 30) b.dead = true;
  }
  if (G.bullets.some(b => b.dead)) {
    for (const b of G.bullets) if (b.dead && b.tgt) { b.tgt.inc -= b.dmg; b.tgt = null; }
    G.bullets = G.bullets.filter(b => !b.dead);
  }
}
function moveShells(G, dt) {
  for (const s of G.shells) {
    s.t += dt;
    if (s.t < 0) continue;
    const u = Math.min(1, s.t / s.T);
    s.x = s.x0 + (s.tx - s.x0) * u;
    s.y = s.y0 + (s.ty - s.y0) * u - Math.sin(u * Math.PI) * 60;
    if (u >= 1) { s.dead = true; explode(G, s.tx, s.ty, s.rad, s.dmg, 'dzialo', s.burn); }
  }
  G.shells = G.shells.filter(s => !s.dead);
}
function moveRockets(G, dt) {
  for (const r of G.rockets) {
    r.t += dt;
    let tg = r.tgt;
    if (!tg || tg.dead || tg.hp <= 0) tg = r.tgt = strongest(G);
    const sp = Math.min(560, 250 + r.t * 650);
    let a = Math.atan2(r.vx, -r.vy);
    if (tg) {
      const want = Math.atan2(tg.x - r.x, r.y - aimY(tg));
      let d = want - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
      a += clamp(d, -dt * 7, dt * 7);
    }
    r.vx = Math.sin(a) * sp; r.vy = -Math.cos(a) * sp;
    r.x += r.vx * dt; r.y += r.vy * dt;
    if (G.fx && (r.smoke -= dt) <= 0) { r.smoke = 0.03; G.sparks.push({ x: r.x - r.vx * 0.02, y: r.y - r.vy * 0.02, vx: rand(-10, 10), vy: rand(-10, 10), t: 0, life: 0.4, col: 'smoke', s: rand(2.5, 4) }); }
    let boom = r.y < -120 || r.t > 4;
    if (tg && Math.hypot(tg.x - r.x, aimY(tg) - r.y) < (tg.isBoss ? tg.r * 0.5 : tg.r + 6)) boom = true;
    if (!boom) for (const e of G.enemies) if (!e.dead && Math.abs(e.x - r.x) < e.r + 5 && Math.abs(e.y - r.y) < e.r + 5) { boom = true; break; }
    if (boom) { r.dead = true; if (r.y > -100) explode(G, r.x, r.y, r.rad, r.dmg, 'rakiety'); }
  }
  G.rockets = G.rockets.filter(r => !r.dead);
}

/* ============================================================
   One step of the battle (also used by the balance tool, without the screen)
   ============================================================ */
function step(G, dt) {
  if (G.over || G.pending) return;
  G.t += dt;
  if (G.demo) G.aim = autoAim(G);
  spawnUpdate(G, dt);
  for (const e of G.enemies) { e.slowT -= dt; e.slow = e.slowT > 0 ? e.slowAmt : 0; }
  if (G.boss) G.boss.slow = 0;
  if (G.w.pole) updPole(G, G.w.pole, dt);
  for (const k in G.w) { if (k !== 'pole') UPDATE[k](G, G.w[k], dt); G.w[k].flash = Math.max(0, (G.w[k].flash || 0) - dt * 1.5); }
  if (G.boss) bossUpdate(G, dt);
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt);
    if (e.stun > 0) e.stun -= dt;
    const f = speedOf(e);
    e.x += e.vx * f * dt; e.y += e.vy * f * dt;
    if ((e.x < EDGE && e.vx < 0) || (e.x > W - EDGE && e.vx > 0)) e.vx = -e.vx;
    if (e.burnT > 0) { e.burnT -= dt; hurt(G, e, e.burn * dt, e.burnSrc, false, true); if (e.dead) continue; }
    popPending(G, e, dt);
    if (e.y + e.r * 0.5 >= domeY(e.x)) {
      e.dead = true;
      if (!G.demo) G.baseHp -= e.dmg;
      G.domeFlash = Math.min(1, G.domeFlash + 0.3);
      if (G.fx) { G.booms.push({ x: e.x, y: domeY(e.x), rad: e.r * 2.2, t: 0, life: 0.35, col: 'fire' }); domeHit(G, e.x); emit(G, 'uderzenie'); }
    }
  }
  moveBullets(G, dt);
  moveShells(G, dt);
  moveRockets(G, dt);
  if (G.later.length) {
    const now = G.later.filter(l => G.t >= l.at);
    if (now.length) { G.later = G.later.filter(l => G.t < l.at); for (const l of now) explode(G, l.x, l.y, l.rad, l.dmg, l.src, l.burn, l.second); }
  }
  if (G.enemies.some(e => e.dead)) G.enemies = G.enemies.filter(e => !e.dead);
  if (!G.over && G.baseHp <= 0) {
    G.baseHp = 0; G.over = 'lose'; G.shake = 1; G.pending = 0;
    if (G.fx) { for (let i = 0; i < 8; i++) G.booms.push({ x: W / 2 + rand(-120, 120), y: GROUND - rand(0, 80), rad: rand(40, 80), t: -i * 0.1, life: 0.6, col: 'fire' }); emit(G, 'przegrana'); }
  }
  if (G.over) { G.bullets = []; G.shells = []; G.rockets = []; G.later = []; for (const k in G.w) G.w[k].on = false; }
}
// visual effects keep moving also during the victory and the defeat
function stepFx(G, dt) {
  G.domeFlash = Math.max(0, G.domeFlash - dt * 2.5);
  G.domeFreeze = Math.max(0, G.domeFreeze - dt * 1.4);
  G.shake = Math.max(0, G.shake - dt * 2);
  if (!dt) return;
  for (const n of G.nums) n.t += dt;
  for (const b of G.booms) b.t += dt;
  for (const b of G.bolts) b.t += dt;
  for (const s of G.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.col !== 'smoke') s.vy += 160 * dt; }
  G.nums = G.nums.filter(n => n.t < 0.8);
  G.booms = G.booms.filter(b => b.t < b.life);
  G.bolts = G.bolts.filter(b => b.t < 0.22);
  G.sparks = G.sparks.filter(s => s.t < s.life);
  for (const im of G.impacts) im.t += dt;
  G.impacts = G.impacts.filter(im => im.t < 1.4);
  // embers flying off the burning meteors and the Asteroid
  if (G.fx) {
    for (const e of G.embers) { e.t += dt; e.x += e.vx * dt; e.y += e.vy * dt; }
    G.embers = G.embers.filter(e => e.t < e.life);
    for (const e of G.enemies) {
      if (G.embers.length >= 180 || Math.random() > dt * 5) continue;
      G.embers.push({ x: e.x + rand(-0.5, 0.5) * e.r, y: e.y - e.r * rand(0.3, 1.2), vx: rand(-14, 14), vy: rand(-35, 5), t: 0, life: rand(0.3, 0.65), s: rand(1.1, 2.3) });
    }
    const B = G.boss;
    if (B) for (let i = 0; i < 2 && G.embers.length < 220; i++) {
      const a = Math.PI * rand(0.15, 0.85);
      G.embers.push({ x: B.x + Math.cos(a) * B.r, y: B.y + Math.sin(a) * B.r, vx: rand(-20, 20), vy: rand(-40, 10), t: 0, life: rand(0.4, 0.8), s: rand(1.5, 3) });
    }
  }
}

/* ============================================================
   Cards after a new level
   ============================================================ */
function makeOffer(G) {
  const C = [], built = Object.keys(G.w), turrets = built.length - 1;
  for (const k of TURRETS) if (!G.w[k] && built.length < 5) C.push({ type: 'build', w: k, weight: turrets < 2 ? 1.8 : 1 });
  if (turrets === 0) {          // the first card: two new turrets and one upgrade of the robot
    const u = pick(WEAPONS.robot.ups);
    return shuffle([...shuffle(C).slice(0, 2), { type: 'up', w: 'robot', id: u.id, lvl: 0, weight: 1 }]);
  }
  for (const k of built) {
    const w = G.w[k];
    for (const u of WEAPONS[k].ups) if (up(w, u.id) < u.max) C.push({ type: 'up', w: k, id: u.id, lvl: up(w, u.id), weight: 1 });
    if (w.stars >= STARS_FOR_SUPER && !w.sup) C.push({ type: 'super', w: k, weight: 4 });
  }
  for (const c of COMBOS) if (G.w[c.a] && G.w[c.b] && !G.combos[c.id]) C.push({ type: 'combo', id: c.id, weight: 1.4 });
  if (G.baseHp < G.baseMax * 0.6) C.push({ type: 'heal', weight: G.baseHp < G.baseMax * 0.3 ? 2 : 0.8 });
  const out = [];
  while (out.length < 3 && C.length) {
    let s = 0; for (const c of C) s += c.weight;
    let r = Math.random() * s, i = 0;
    for (; i < C.length - 1; i++) { r -= C[i].weight; if (r <= 0) break; }
    out.push(C.splice(i, 1)[0]);
  }
  while (out.length < 3) out.push({ type: 'heal', weight: 1 });
  return out;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function cardInfo(c) {
  if (c.type === 'build') return { title: WEAPONS[c.w].name, text: WEAPONS[c.w].build, tag: 'Nowa' };
  if (c.type === 'up') {
    const u = WEAPONS[c.w].ups.find(x => x.id === c.id);
    const text = c.w === 'robot' && c.id === 'dmg' ? `Pociski +80% obrażeń. Nowa amunicja: ${AMMO[Math.min(AMMO.length - 1, (c.lvl || 0) + 1)].name}` : u.text;
    return { title: u.name, text, tag: WEAPONS[c.w].short };
  }
  if (c.type === 'super') return { title: WEAPONS[c.w].sup.name, text: WEAPONS[c.w].sup.text, tag: 'Super' };
  if (c.type === 'combo') { const k = COMBOS.find(x => x.id === c.id); return { title: k.name, text: k.text, tag: 'Połączenie' }; }
  return { title: 'Naprawa bazy', text: `Baza odzyskuje ${Math.round(HEAL * 100)}% życia`, tag: 'Naprawa' };
}
function applyCard(G, c) {
  if (c.type === 'build') addWeapon(G, c.w);
  else if (c.type === 'up') {
    const w = G.w[c.w]; w.ups[c.id] = up(w, c.id) + 1; w.stars++; w.flash = 1;
    if (c.w === 'robot' && c.id === 'dmg') emit(G, `amunicja-${w.ups.dmg}`);
  }
  else if (c.type === 'super') { G.w[c.w].sup = true; G.w[c.w].flash = 1; }
  else if (c.type === 'combo') G.combos[c.id] = true;
  else { G.baseHp = Math.min(G.baseMax, G.baseHp + G.baseMax * HEAL); G.cracks.length = Math.min(G.cracks.length, crackCount(G)); }   // a repaired dome loses cracks
  G.cards.push(c.type === 'up' ? `${c.w}.${c.id}` : c.type === 'heal' ? 'heal' : `${c.type}.${c.w || c.id}`);
  if (G.pending > 0) G.pending--;
}

if (!HAS_DOM) {
  module.exports = { newBattle, step, makeOffer, applyCard, cardInfo, BAL, WEAPONS, TURRETS, COMBOS, TIME_BOSS, KINDS };
  return;
}

/* ============================================================
   Saved settings
   ============================================================ */
const SAVE_KEY = 'wersja-robocza';
const save = (() => {
  const d = { best: 1, stage: 1, music: true, sfx: true, speed: 1, played: 0 };
  try { return Object.assign(d, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { return d; }
})();
function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* private mode */ } }

/* ============================================================
   Sound: effects made in code, music from Śmierdzipacha's folder
   ============================================================ */
const Sound = (() => {
  let ctx = null, master, musicBus, sfxBus, noise, zaps = [], unlocked = false, silent = null, cur = null, want = null;
  const buffers = {}, loading = {}, lastAt = {};
  const LOOPS = { 'neon-walka': [0.5, 26.1], 'turbo-walka': [0.5, 27.928549], 'chill-bieg': [0.5, 46.214308] };
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5;
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = save.music ? 0.3 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = save.sfx ? 0.8 : 0; sfxBus.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    zaps = [11, 23, 37].map(makeZap);
    return true;
  }
  // An electric discharge, made once: a sharp snap, a crackle of tiny sparks that thins out, and the buzz of the arc
  function makeZap(seed) {
    const sr = ctx.sampleRate, n = Math.floor(sr * 0.3), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), R = seeded(seed);
    const snap = Math.floor(sr * 0.012);
    for (let i = 0; i < snap; i++) d[i] += (R() * 2 - 1) * (1 - i / snap);
    for (let i = 0; i < n;) {
      const t = i / n, len = Math.floor(sr * (0.0006 + R() * 0.0035)), amp = (0.45 + R() * 0.55) * Math.pow(1 - t, 1.4);
      for (let j = 0; j < len && i + j < n; j++) d[i + j] += (R() * 2 - 1) * amp * (1 - j / len);
      i += Math.floor(sr * (0.001 + R() * 0.009 * (0.3 + 2.5 * t)));
    }
    const f = 85 + R() * 45, step = Math.floor(sr * 0.005);
    let a = 0, ph = 0;
    for (let k = 0; k < n; k++) {
      if (k % step === 0) a = 0.12 + R() * 0.4;
      ph += f / sr;
      d[k] += (2 * (ph % 1) - 1) * a * Math.pow(1 - k / n, 2.2) * 0.55;
    }
    for (let k = 0; k < n; k++) d[k] = Math.tanh(d[k] * 1.8) * 0.85;
    return buf;
  }
  function zap(t, vol) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
    s.buffer = pick(zaps); s.playbackRate.value = rand(0.85, 1.2);
    f.type = 'highpass'; f.frequency.value = 500;
    gn.gain.value = vol;
    s.connect(f); f.connect(gn); gn.connect(sfxBus); s.start(t);
  }
  // A short silent WAV through an <audio> element lets iPhone sound play even with the ring switch set to silent
  function silentWav() {
    const n = 4000, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, 'data'); v.setUint32(40, n, true);
    b.fill(128, 44);
    let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return 'data:audio/wav;base64,' + btoa(s);
  }
  function unlock() {
    if (!save.music && !save.sfx) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
    if (!init()) return;
    if (ctx.state !== 'running') ctx.resume().then(() => { if (want && !cur) music(want); }).catch(() => {});
    if (unlocked) return;
    unlocked = true;
    try { const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0); } catch (e) { /* ignore */ }
    if (!navigator.audioSession) {
      try { silent = new Audio(silentWav()); silent.loop = true; silent.setAttribute('playsinline', ''); const p = silent.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
  }
  const live = () => ctx && ctx.state === 'running';
  function tone(type, f, t, dur, vol, f2, lp) {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    let node = o;
    if (lp) { const q = ctx.createBiquadFilter(); q.type = 'lowpass'; q.frequency.value = lp; o.connect(q); node = q; }
    node.connect(gn); gn.connect(sfxBus);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(t, dur, vol, type, freq, q) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    s.connect(f); f.connect(gn); gn.connect(sfxBus);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  const GAP = { strzal: 0.075, pop: 0.05, wybuch: 0.09, uderzenie: 0.14, piorun: 0.1, rakieta: 0.15, dzialo: 0.12 };
  function play(name) {
    if (!save.sfx || !live()) return;
    const t = ctx.currentTime;
    if (GAP[name] && t - (lastAt[name] || -9) < GAP[name]) return;
    lastAt[name] = t;
    switch (name) {
      case 'strzal': tone('square', 1500, t, 0.05, 0.025, 700, 3000); break;
      case 'salwa': for (let i = 0; i < 5; i++) tone('square', 1700 - i * 120, t + i * 0.025, 0.05, 0.03, 800, 3000); break;
      case 'pop': hiss(t, 0.07, 0.06, 'bandpass', rand(900, 1500), 1.5); break;
      case 'wybuch': hiss(t, 0.3, 0.18, 'lowpass', 700); tone('sine', 120, t, 0.22, 0.2, 45); break;
      case 'uderzenie': tone('sine', 90, t, 0.25, 0.32, 40); hiss(t, 0.2, 0.12, 'lowpass', 400); break;
      case 'piorun': zap(t, 0.3); break;
      case 'rakieta': hiss(t, 0.35, 0.08, 'bandpass', 1800, 0.8); break;
      case 'dzialo': tone('sine', 220, t, 0.12, 0.12, 80); break;
      case 'laser': tone('sawtooth', 300, t, 0.35, 0.04, 900, 1800); break;
      case 'ladowanie': tone('sine', 180, t, 1.0, 0.045, 950); tone('triangle', 183, t, 1.0, 0.03, 960); break;
      case 'pole-strzal': hiss(t, 0.35, 0.14, 'bandpass', 900, 0.7); tone('sine', 160, t, 0.25, 0.18, 60); tone('square', 600, t, 0.3, 0.035, 1800, 2500); break;
      case 'pole': tone('sine', 520, t, 0.45, 0.07, 500); tone('sine', 780, t + 0.03, 0.4, 0.05, 760); hiss(t, 0.35, 0.05, 'highpass', 4000); break;
      case 'poziom': [0, 4, 7, 12].forEach((s, i) => tone('triangle', 523.25 * Math.pow(2, s / 12), t + i * 0.07, 0.22, 0.12)); break;
      case 'karta': tone('triangle', 784, t, 0.12, 0.1); tone('triangle', 1175, t + 0.07, 0.2, 0.1); break;
      case 'roj': [0, 0.18].forEach(d => tone('square', 440, t + d, 0.12, 0.06, 330, 1500)); break;
      case 'boss': hiss(t, 1.8, 0.25, 'lowpass', 160); tone('sawtooth', 70, t, 1.6, 0.12, 50, 400); break;
      case 'wygrana': [0, 4, 7, 12, 16].forEach((s, i) => tone('triangle', 523.25 * Math.pow(2, s / 12), t + i * 0.11, 0.35, 0.14)); break;
      case 'przegrana': [7, 4, 0, -5].forEach((s, i) => tone('triangle', 392 * Math.pow(2, s / 12), t + i * 0.16, 0.35, 0.12)); break;
      case 'klik': tone('triangle', 660, t, 0.07, 0.08); break;
    }
  }
  function load(file) {
    if (buffers[file]) return Promise.resolve(buffers[file]);
    if (!loading[file]) {
      loading[file] = fetch(`../muzyka/${file}.mp3`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej)))
        .then(buf => (buffers[file] = buf)).catch(() => null).finally(() => { delete loading[file]; });
    }
    return loading[file];
  }
  function stop() {
    if (!cur) return;
    const { src, gn } = cur, t = ctx.currentTime;
    gn.gain.cancelScheduledValues(t); gn.gain.setValueAtTime(Math.max(0.0001, gn.gain.value), t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    src.stop(t + 0.65); cur = null;
  }
  function music(file) {
    want = file;
    if (!ctx) return;
    if (!file) { stop(); return; }
    if (cur && cur.file === file) return;
    load(file).then(buf => {
      if (!buf || want !== file || !live() || (cur && cur.file === file)) return;
      stop();
      const [a, b] = LOOPS[file], t = ctx.currentTime;
      const src = ctx.createBufferSource(), gn = ctx.createGain();
      src.buffer = buf; src.loop = true; src.loopStart = a; src.loopEnd = b;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(1, t + 0.5);
      src.connect(gn); gn.connect(musicBus); src.start(t + 0.02, a);
      cur = { file, src, gn };
    });
  }
  function settings() {
    if (!ctx) return;
    musicBus.gain.value = save.music ? 0.3 : 0;
    sfxBus.gain.value = save.sfx ? 0.8 : 0;
  }
  function suspend(on) { if (!ctx) return; if (on) ctx.suspend().catch(() => {}); else if (save.music || save.sfx) ctx.resume().catch(() => {}); }
  return { unlock, play, music, settings, suspend };
})();

/* ============================================================
   Drawing
   ============================================================ */
const $ = id => document.getElementById(id);
const canvas = $('scene'), ctx = canvas.getContext('2d');
const view = { w: 0, h: 0, dpr: 1, s: 1, ox: 0, oy: 0, k: 1, top: 0 };
const FONT = '"Lilita One", "Paytone One", "Arial Rounded MT Bold", system-ui, sans-serif';
let bg = null, SPR = {}, FLAME = {}, HEX = {};

function resize() {
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.w = window.innerWidth; view.h = window.innerHeight;
  canvas.width = Math.round(view.w * view.dpr); canvas.height = Math.round(view.h * view.dpr);
  view.s = Math.min(view.w / W, view.h / 640);
  view.ox = (view.w - W * view.s) / 2; view.oy = view.h - BOTTOM * view.s;
  view.k = view.s * view.dpr; view.top = -view.oy / view.s;
  buildSprites(); buildBackground();
}
function toWorld(sx = 0, sy = 0) { ctx.setTransform(view.k, 0, 0, view.k, (view.ox + sx) * view.dpr, (view.oy + sy) * view.dpr); }
function spriteCanvas(wu, hu) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(wu * view.k)); c.height = Math.max(1, Math.ceil(hu * view.k));
  const x = c.getContext('2d'); x.scale(c.width / wu, c.height / hu); x.lineJoin = 'round'; x.lineCap = 'round';
  return [c, x];
}
// a little seeded randomness, so the city and the cracks look the same every time
function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function buildBackground() {
  const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
  const x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, c.height);
  sky.addColorStop(0, '#202227'); sky.addColorStop(0.55, '#34363c'); sky.addColorStop(0.85, '#45474c'); sky.addColorStop(1, '#202125');
  x.fillStyle = sky; x.fillRect(0, 0, c.width, c.height);
  x.setTransform(view.k, 0, 0, view.k, view.ox * view.dpr, view.oy * view.dpr);
  const left = -view.ox / view.s - 10, right = W + view.ox / view.s + 10;
  const R = seeded(7);
  // two rows of skyscrapers in the fog
  for (const [col, hMin, hMax, alpha] of [['#3d3f45', 120, 330, 0.9], ['#2c2e33', 50, 210, 1]]) {
    x.fillStyle = col; x.globalAlpha = alpha;
    for (let bx = left; bx < right;) {
      const bw = 18 + R() * 34, bh = hMin + R() * (hMax - hMin);
      x.fillRect(bx, GROUND - bh, bw, bh + 5);
      if (R() < 0.3) x.fillRect(bx + bw * 0.45, GROUND - bh - 26, 2.5, 26);
      if (R() < 0.25) { x.beginPath(); x.moveTo(bx, GROUND - bh); x.lineTo(bx + bw / 2, GROUND - bh - bw * 0.5); x.lineTo(bx + bw, GROUND - bh); x.fill(); }
      bx += bw + R() * 8;
    }
  }
  x.globalAlpha = 1;
  const fog = x.createLinearGradient(0, GROUND - 260, 0, GROUND);
  fog.addColorStop(0, 'rgba(70,72,78,0)'); fog.addColorStop(1, 'rgba(85,88,94,0.55)');
  x.fillStyle = fog; x.fillRect(left, GROUND - 260, right - left, 260);
  // light of the base
  const glow = x.createRadialGradient(W / 2, GROUND - 20, 10, W / 2, GROUND - 20, 210);
  glow.addColorStop(0, 'rgba(235,240,245,0.55)'); glow.addColorStop(0.35, 'rgba(200,210,220,0.18)'); glow.addColorStop(1, 'rgba(200,210,220,0)');
  x.fillStyle = glow; x.fillRect(W / 2 - 220, GROUND - 230, 440, 260);
  // ground
  const gr = x.createLinearGradient(0, GROUND, 0, BOTTOM);
  gr.addColorStop(0, '#1b1c20'); gr.addColorStop(1, '#0e0f11');
  x.fillStyle = gr; x.fillRect(left, GROUND, right - left, BOTTOM - GROUND + 400);
  x.fillStyle = '#2a2c31'; x.fillRect(left, GROUND, right - left, 3);
  bg = c;
}

function rockGlow(x, cx, cy, r) {
  const gl = x.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.9);
  gl.addColorStop(0, 'rgba(255,225,180,0.6)'); gl.addColorStop(1, 'rgba(255,160,80,0)');
  x.fillStyle = gl; x.beginPath(); x.arc(cx, cy, r * 1.9, 0, TAU); x.fill();
}
// A flickering flame tail: several pictures with the flame tongues in other places, shown one after another
const FLAME_FRAMES = 10;
function flameFrames(r, len) {
  const out = [], wu = 2.8 * r, hu = len + 1.3 * r, cx = wu / 2, cy = len, N = 16;
  const LAYERS = [[1.12, 1, '255,105,30', '255,165,75', 0.55], [0.78, 0.8, '255,150,55', '255,210,125', 0.6], [0.42, 0.45, '255,230,170', '255,250,235', 0.9]];
  for (let f = 0; f < FLAME_FRAMES; f++) {
    const [c, x] = spriteCanvas(wu, hu), ph = f / FLAME_FRAMES * TAU;
    x.globalCompositeOperation = 'lighter';
    LAYERS.forEach(([k, lk, col0, col1, a], li) => {
      const L = len * lk;
      const g = x.createLinearGradient(0, cy, 0, cy - L);
      g.addColorStop(0, `rgba(${col1},${a})`); g.addColorStop(0.45, `rgba(${col0},${a * 0.6})`); g.addColorStop(1, `rgba(${col0},0)`);
      x.fillStyle = g;
      const edge = (u, side) => {
        const wob = Math.sin(u * 7 - ph * (1 + li * 0.5) + side * 1.3) * 0.16 + Math.sin(u * 13 + ph * 2 + side * 2) * 0.08;
        return cx + side * r * k * Math.pow(1 - u, 0.6) * (1 + wob) + r * 0.25 * Math.sin(ph + u * 3) * u;
      };
      x.beginPath();
      for (let i = 0; i <= N; i++) { const u = i / N; (i ? x.lineTo : x.moveTo).call(x, edge(u, -1), cy - L * u); }
      for (let i = N; i >= 0; i--) { const u = i / N; x.lineTo(edge(u, 1), cy - L * u); }
      x.arc(cx, cy, r * k, 0, Math.PI);
      x.closePath(); x.fill();
    });
    out.push(c);
  }
  return { frames: out, w: wu, h: hu, ax: cx, ay: cy };
}
// a lumpy outline instead of a perfect circle
function lumpyPts(cx, cy, r, R, n = 11) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * (0.86 + R() * 0.16); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return pts;
}
function smoothPath(x, pts) {
  const n = pts.length, mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], m0 = mid(pts[n - 1], pts[0]);
  x.beginPath(); x.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); x.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
  x.closePath();
}
// A rock: dark with a light side, craters with a shiny rim, glowing cracks of hot stone, specks, and a white outline
function rockSprite(r, variant) {
  const [c, x] = spriteCanvas(4 * r, 4 * r), cx = 2 * r, cy = 2 * r, R = seeded(31 + variant * 17 + Math.round(r));
  rockGlow(x, cx, cy, r);
  const pts = lumpyPts(cx, cy, r, R);
  smoothPath(x, pts);
  const g = x.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r * 1.05);
  g.addColorStop(0, '#3a3a41'); g.addColorStop(0.55, '#17171a'); g.addColorStop(1, '#070708');
  x.fillStyle = g; x.fill();
  x.save(); x.clip();
  const craters = [[0.3, 0.22, 0.3], [-0.38, -0.2, 0.21], [0.05, -0.52, 0.14], [-0.3, 0.46, 0.13], [0.52, -0.22, 0.1]];
  for (const [ux, uy, ur] of craters) {
    const jx = cx + (ux + (R() - 0.5) * 0.2) * r, jy = cy + (uy + (R() - 0.5) * 0.2) * r, rr = ur * r * (0.8 + R() * 0.4);
    x.fillStyle = 'rgba(0,0,0,0.6)'; x.beginPath(); x.ellipse(jx, jy, rr, rr * 0.8, 0.4, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(215,215,225,0.6)'; x.lineWidth = Math.max(0.8, r * 0.05);
    x.beginPath(); x.ellipse(jx, jy, rr, rr * 0.8, 0.4, 0.15, Math.PI * 0.95); x.stroke();
  }
  for (let i = 0; i < 2; i++) {
    let px = cx + (R() - 0.5) * r * 0.8, py = cy + (R() - 0.5) * r * 0.8, a = R() * TAU;
    x.beginPath(); x.moveTo(px, py);
    for (let j = 0; j < 4; j++) { a += (R() - 0.5) * 1.4; px += Math.cos(a) * r * 0.22; py += Math.sin(a) * r * 0.22; x.lineTo(px, py); }
    x.strokeStyle = 'rgba(255,110,35,0.55)'; x.lineWidth = r * 0.13; x.stroke();
    x.strokeStyle = 'rgba(255,215,150,0.95)'; x.lineWidth = r * 0.045; x.stroke();
  }
  x.fillStyle = 'rgba(255,255,255,0.2)';
  for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(cx + (R() - 0.5) * 1.5 * r, cy + (R() - 0.5) * 1.5 * r, r * 0.035, 0, TAU); x.fill(); }
  x.restore();
  smoothPath(x, pts);
  x.strokeStyle = '#f2f2f2'; x.lineWidth = Math.max(1, r * 0.085); x.stroke();
  return { c, w: 4 * r, h: 4 * r, ax: cx, ay: cy };
}
// Crystals cut into facets: red ones glow inside, black ones have a glowing crack
function crystalSprite(r, red) {
  const [c, x] = spriteCanvas(4 * r, 4 * r), cx = 2 * r, cy = 2 * r;
  rockGlow(x, cx, cy, r * 0.9);
  const P = (red ? [[0, -1.2], [0.85, -0.45], [0.9, 0.5], [0, 1.15], [-0.85, 0.55], [-0.8, -0.6]] : [[0, -1.35], [0.75, -0.15], [0.15, 1.25], [-0.7, 0.1]]).map(([u, v]) => [cx + u * r, cy + v * r]);
  const core = [cx + (red ? -0.15 : 0.05) * r, cy + (red ? -0.1 : -0.05) * r];
  const shades = red ? ['#ff6b6b', '#e0303f', '#b31b2a', '#8a1220', '#c62434', '#f04a55'] : ['#3b4048', '#1c1f24', '#0d0e10', '#272b31'];
  P.forEach((p, i) => {   // one triangle per facet, each in another shade
    const q = P[(i + 1) % P.length];
    x.beginPath(); x.moveTo(core[0], core[1]); x.lineTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.closePath();
    x.fillStyle = shades[i % shades.length]; x.fill();
    x.strokeStyle = red ? 'rgba(255,170,170,0.35)' : 'rgba(200,210,220,0.25)'; x.lineWidth = Math.max(0.6, r * 0.04); x.stroke();
  });
  if (red) {
    glowDot(x, core[0], core[1], r * 0.8, 'rgba(255,120,120,0.6)');
    x.fillStyle = '#fff';   // a small twinkle
    x.beginPath(); x.moveTo(cx - 0.45 * r, cy - 0.75 * r); x.lineTo(cx - 0.38 * r, cy - 0.55 * r); x.lineTo(cx - 0.45 * r, cy - 0.35 * r); x.lineTo(cx - 0.52 * r, cy - 0.55 * r); x.closePath(); x.fill();
  } else {
    x.beginPath(); x.moveTo(cx + 0.05 * r, cy - 1 * r); x.lineTo(cx - 0.25 * r, cy - 0.25 * r); x.lineTo(cx + 0.2 * r, cy - 0.05 * r); x.lineTo(cx - 0.1 * r, cy + 0.8 * r);
    x.strokeStyle = 'rgba(140,210,255,0.6)'; x.lineWidth = r * 0.16; x.stroke();
    x.strokeStyle = '#eaf6ff'; x.lineWidth = r * 0.06; x.stroke();
  }
  x.beginPath(); P.forEach((p, i) => (i ? x.lineTo : x.moveTo).call(x, p[0], p[1])); x.closePath();
  x.strokeStyle = red ? '#ffb0b0' : '#eef1f5'; x.lineWidth = Math.max(1, r * 0.09); x.stroke();
  return { c, w: 4 * r, h: 4 * r, ax: cx, ay: cy };
}
function bossSprite() {
  const r = 150, [c, x] = spriteCanvas(2.5 * r, 2.5 * r), cx = 1.25 * r, cy = 1.25 * r;
  const gl = x.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.25);
  gl.addColorStop(0, 'rgba(255,170,80,0.5)'); gl.addColorStop(1, 'rgba(255,120,40,0)');
  x.fillStyle = gl; x.beginPath(); x.arc(cx, cy, r * 1.25, 0, TAU); x.fill();
  const g = x.createRadialGradient(cx - r * 0.2, cy + r * 0.25, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#ffd27a'); g.addColorStop(0.55, '#f5a043'); g.addColorStop(1, '#c4561c');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  x.save(); x.beginPath(); x.arc(cx, cy, r * 0.99, 0, TAU); x.clip();
  const R = seeded(99);
  for (let i = 0; i < 26; i++) {
    let px = cx + (R() - 0.5) * 2 * r, py = cy + (R() - 0.5) * 2 * r, a = R() * TAU;
    x.beginPath(); x.moveTo(px, py);
    for (let j = 0; j < 5; j++) { a += (R() - 0.5) * 1.6; px += Math.cos(a) * r * 0.18; py += Math.sin(a) * r * 0.18; x.lineTo(px, py); }
    x.strokeStyle = 'rgba(150,52,16,0.85)'; x.lineWidth = 5; x.stroke();
    x.strokeStyle = 'rgba(255,230,160,0.65)'; x.lineWidth = 1.6; x.stroke();
  }
  x.restore();
  x.strokeStyle = 'rgba(120,40,10,0.6)'; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, r * 0.98, 0, TAU); x.stroke();
  return { c, w: 2.5 * r, h: 2.5 * r, ax: cx, ay: cy };
}
function buildSprites() {
  SPR = {
    meteor: [0, 1, 2].map(v => rockSprite(KINDS.meteor.r, v)),
    big: [0, 1, 2].map(v => rockSprite(KINDS.big.r, v)),
    red: [crystalSprite(KINDS.red.r, true)],
    shard: [crystalSprite(KINDS.shard.r, false)],
    boss: bossSprite(),
  };
  FLAME = { meteor: flameFrames(KINDS.meteor.r, 5.3 * KINDS.meteor.r), big: flameFrames(KINDS.big.r, 5 * KINDS.big.r),
    red: flameFrames(KINDS.red.r * 0.9, 4.4 * KINDS.red.r), shard: flameFrames(KINDS.shard.r * 0.85, 5 * KINDS.shard.r) };
  HEX = {};
}

/* ---------- turrets and the robot ---------- */
// soft light: one small picture per colour, drawn at any size (much faster than a new gradient every frame)
const GLOW = {};
function glowDot(x, cx, cy, r, col, a = 1) {
  let g = GLOW[col];
  if (!g) {
    g = document.createElement('canvas'); g.width = g.height = 64;
    const q = g.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    q.fillStyle = gr; q.fillRect(0, 0, 64, 64); GLOW[col] = g;
  }
  const old = x.globalAlpha;
  x.globalAlpha = old * a; x.drawImage(g, cx - r, cy - r, 2 * r, 2 * r); x.globalAlpha = old;
}
function rrect(x, px, py, w, h, r) { x.beginPath(); x.roundRect ? x.roundRect(px, py, w, h, r) : x.rect(px, py, w, h); }
function drawPad(x, cx, cy, lit) {
  x.fillStyle = '#121316'; x.beginPath(); x.ellipse(cx, cy + 1, 17, 4, 0, 0, TAU); x.fill();
  if (lit) { glowDot(x, cx, cy - 4, 22, 'rgba(235,240,250,0.55)'); x.fillStyle = '#e8edf5'; x.fillRect(cx - 9, cy - 3, 18, 2.5); }
}
const hexRgb = h => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;
// a ring of light when a weapon gets a card
function upgradeFlash(x, cx, cy, f, col) {
  if (!(f > 0)) return;
  const r = 16 + (1 - f) * 42;
  const old = x.globalCompositeOperation;
  x.globalCompositeOperation = 'lighter';
  x.strokeStyle = `rgba(${col},${0.9 * f})`; x.lineWidth = 1 + 3 * f;
  x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();
  glowDot(x, cx, cy, r, `rgba(${col},0.55)`, f);
  x.globalCompositeOperation = old;
}
// The robot walks with bending knees and leans into the walk. With its cards it changes:
// the colour follows its ammunition, it grows a little, gets shoulder pads, an antenna, and a jetpack with the super card.
function drawRobot(x, cx, cy, w, tm) {
  const tier = w ? up(w, 'dmg') : 0, stars = w ? w.stars : 0, multi = w ? up(w, 'multi') : 0, col = AMMO[tier].col;
  const S = 1 + 0.045 * Math.min(stars, 7), vx = w ? w.vx : 0, walking = Math.abs(vx) > 25, ph = w ? w.step * 0.13 : 0;
  const lean = clamp(-vx / 3500, -0.16, 0.16), bob = walking ? Math.abs(Math.sin(ph)) * 2.2 : Math.sin(tm * 2.5) * 0.7;
  const kick = w ? w.kick : 0;
  x.save(); x.translate(cx, cy); x.scale(S, S); x.lineCap = 'round'; x.lineJoin = 'round';
  x.fillStyle = 'rgba(0,0,0,0.35)'; x.beginPath(); x.ellipse(0, 0.5, 15, 3, 0, 0, TAU); x.fill();
  // legs seen from the front: while walking they lift in turns, knees bend outward and the feet step sideways
  const dir = Math.sign(vx) || 1;
  for (const side of [-1, 1]) {
    const p = ph + (side > 0 ? Math.PI : 0), lift = walking ? Math.max(0, Math.sin(p)) * 6 : 0;
    const hx = side * 5, hy = -19 - bob * 0.3;
    const fx = hx + side * 1.5 + (walking ? Math.cos(p) * 3.5 * dir : side * 0.8), fy = -1.5 - lift;
    const kx = (hx + fx) / 2 + side * (2 + lift * 0.45), ky = (hy + fy) / 2 + 0.5;
    x.strokeStyle = '#141820'; x.lineWidth = 5.5;
    x.beginPath(); x.moveTo(hx, hy); x.lineTo(kx, ky); x.lineTo(fx, fy); x.stroke();
    x.strokeStyle = '#323a46'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(hx, hy); x.lineTo(kx, ky); x.stroke();
    x.fillStyle = '#3d4552'; x.beginPath(); x.arc(kx, ky, 2.7, 0, TAU); x.fill();
    x.fillStyle = `rgba(${col},0.9)`; x.beginPath(); x.arc(kx, ky, 1, 0, TAU); x.fill();
    rrect(x, fx - 5, fy - 1.8, 10, 4, 2); x.fillStyle = '#1b2029'; x.fill();
    x.fillStyle = `rgba(${col},0.95)`; x.fillRect(fx - 4, fy + 1.4, 8, 1.3);
    if (lift > 0.5) glowDot(x, fx, fy + 3, 4, `rgba(${col},0.6)`, lift / 6);   // little thruster under the lifted foot
  }
  // upper body
  x.translate(0, -20 - bob); x.rotate(lean);
  if (w && w.sup) {   // jetpack with two flames
    rrect(x, -9, -17, 18, 14, 4); x.fillStyle = '#20252e'; x.fill();
    for (const s of [-5, 5]) { glowDot(x, s, 1, 7 + Math.sin(tm * 25 + s) * 2, `rgba(${col},0.9)`); x.fillStyle = '#fff'; x.fillRect(s - 1, -3, 2, 3); }
  }
  x.beginPath(); x.moveTo(-11, 0); x.lineTo(-13, -14); x.quadraticCurveTo(-13, -19, -8, -19); x.lineTo(8, -19); x.quadraticCurveTo(13, -19, 13, -14); x.lineTo(11, 0); x.closePath();
  const tg = x.createLinearGradient(-13, 0, 13, 0);
  tg.addColorStop(0, '#161a21'); tg.addColorStop(0.5, '#2c333e'); tg.addColorStop(1, '#14181f');
  x.fillStyle = tg; x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.1)'; x.lineWidth = 0.8;
  x.beginPath(); x.moveTo(-9, -5); x.lineTo(-4, -5); x.moveTo(4, -5); x.lineTo(9, -5); x.moveTo(-10, -15); x.lineTo(10, -15); x.stroke();
  x.fillStyle = '#0f1218'; x.fillRect(-11, -3, 22, 3);
  x.fillStyle = `rgba(${col},0.8)`; x.fillRect(-2, -3, 4, 3);
  glowDot(x, 0, -10, 10, `rgba(${col},0.85)`);
  x.strokeStyle = `rgba(${col},0.95)`; x.lineWidth = 1.2; x.beginPath(); x.arc(0, -10, 4.6, 0, TAU); x.stroke();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -10, 2.3, 0, TAU); x.fill();
  // head with a glowing visor
  rrect(x, -7, -29, 14, 10, 4); x.fillStyle = '#232a35'; x.fill();
  x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(-5, -28.3, 10, 1);
  rrect(x, -5.5, -26.2, 11, 3.6, 1.8); x.fillStyle = `rgba(${col},0.95)`; x.fill();
  glowDot(x, 0, -24.4, 8, `rgba(${col},0.5)`);
  if (stars >= 4) {
    x.strokeStyle = '#3a424e'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(4, -29); x.lineTo(6.5, -37); x.stroke();
    glowDot(x, 6.5, -37, 3.5, `rgba(${col},0.95)`, 0.5 + 0.5 * Math.sin(tm * 6));
  }
  if (stars >= 2) for (const s of [-1, 1]) {   // shoulder pads
    rrect(x, s * 13 - 5.5, -21.5, 11, 6.5, 3); x.fillStyle = '#323a46'; x.fill();
    x.fillStyle = `rgba(${col},0.9)`; x.fillRect(s * 13 - 4, -19.6, 8, 1.3);
  }
  // arm cannons: thicker and with more barrels for every extra barrel card
  for (const side of [-1, 1]) {
    const k = (w && w.side === (side > 0 ? 1 : 0)) ? kick * 4 : 0, bw = 9 + multi * 2.6, nb = 1 + multi;
    x.save(); x.translate(side * 14, -14);
    rrect(x, -bw / 2, -20 + k, bw, 22, 4);
    const ag = x.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    ag.addColorStop(0, '#aeb9c4'); ag.addColorStop(0.45, '#f4fbff'); ag.addColorStop(1, '#8794a1');
    x.fillStyle = ag; x.fill();
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(-bw / 2, -3 + k, bw, 1.2);
    x.fillStyle = `rgba(${col},0.95)`; x.fillRect(-bw / 2, -9 + k, bw, 2.6);
    for (let i = 0; i < nb; i++) { const bx = (i - (nb - 1) / 2) * 3; x.fillStyle = '#1d232c'; x.fillRect(bx - 1.2, -23 + k, 2.4, 3.5); }
    glowDot(x, 0, -22 + k, 7 + kick * 5, `rgba(${col},0.8)`);
    x.restore();
  }
  x.restore();
  if (w) upgradeFlash(x, cx, cy - 26 * S, w.flash, col);
}
// pedestal under every turret: shiny metal, rivets and a blinking light in the weapon's colour
function turretBase(x, cx, cy, accent, tm) {
  x.beginPath(); x.moveTo(cx - 16, cy); x.lineTo(cx - 11, cy - 10); x.lineTo(cx + 11, cy - 10); x.lineTo(cx + 16, cy); x.closePath();
  const g = x.createLinearGradient(0, cy - 10, 0, cy);
  g.addColorStop(0, '#363c46'); g.addColorStop(1, '#14171b');
  x.fillStyle = g; x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.16)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(cx - 11, cy - 10); x.lineTo(cx + 11, cy - 10); x.stroke();
  x.strokeStyle = 'rgba(0,0,0,0.4)'; x.beginPath(); x.moveTo(cx - 13.5, cy - 4.5); x.lineTo(cx + 13.5, cy - 4.5); x.stroke();
  x.fillStyle = '#626a75';
  for (const rx of [-9, -3, 3, 9]) { x.beginPath(); x.arc(cx + rx, cy - 7.3, 0.8, 0, TAU); x.fill(); }
  const blink = 0.5 + 0.5 * Math.sin(tm * 3 + cx);
  glowDot(x, cx + 12.5, cy - 2.5, 4, `rgba(${accent},0.9)`, blink);
  x.fillStyle = `rgb(${accent})`; x.fillRect(cx + 11.9, cy - 3.1, 1.3, 1.3);
}
function drawTurret(x, key, cx, cy, w, tm) {
  const kick = w ? w.kick : 0;
  if (key === 'laser') {
    const a = w && w.beams[0] ? w.beams[0].ang : -0.3, on = !!(w && w.on);
    turretBase(x, cx, cy, '181,108,255', tm);
    x.fillStyle = '#1e1a26'; x.beginPath(); x.arc(cx, cy - 11, 7.5, Math.PI, 0); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 0.8; x.beginPath(); x.arc(cx, cy - 11, 7, Math.PI * 1.1, Math.PI * 1.6); x.stroke();
    x.save(); x.translate(cx, cy - 13); x.rotate(a);
    rrect(x, -5.5, -30, 11, 32, 4);
    const bg2 = x.createLinearGradient(-5.5, 0, 5.5, 0);
    bg2.addColorStop(0, '#221d2c'); bg2.addColorStop(0.5, '#4a3f5e'); bg2.addColorStop(1, '#1c1824');
    x.fillStyle = bg2; x.fill();
    for (const yy of [-25, -20, -15]) {   // cooling fins that light up while it fires
      x.fillStyle = '#16121c'; x.fillRect(-7.5, yy, 15, 2.4);
      x.fillStyle = on ? 'rgba(210,160,255,0.95)' : 'rgba(120,80,170,0.7)'; x.fillRect(-7.5, yy + 2.4, 15, 0.8);
    }
    rrect(x, 5.2, -12, 4, 12, 2); x.fillStyle = '#2d2640'; x.fill();
    x.fillStyle = 'rgba(200,140,255,0.95)'; x.fillRect(6.2, on ? -10.5 : -4, 2, on ? 9 : 2.5);
    x.beginPath(); x.moveTo(0, -38); x.lineTo(3.6, -32.5); x.lineTo(0, -29.5); x.lineTo(-3.6, -32.5); x.closePath();
    x.fillStyle = '#ecdcff'; x.fill();
    glowDot(x, 0, -33, on ? 12 : 7, 'rgba(190,120,255,0.95)', on ? 1 : 0.6);
    x.restore();
  } else if (key === 'pole') {
    turretBase(x, cx, cy, '92,240,192', tm);
    for (const s of [-1, 1]) {   // two capacitors beside the mast
      rrect(x, cx + s * 9 - 2.5, cy - 22, 5, 12, 2); x.fillStyle = '#20262c'; x.fill();
      x.fillStyle = 'rgba(110,245,210,0.85)'; x.fillRect(cx + s * 9 - 1, cy - 12 - 9 * (w && w.state === 'charge' ? w.charge : 1), 2, 9 * (w && w.state === 'charge' ? w.charge : 1));
    }
    const ch = !w || !w.state ? 1 : w.state === 'charge' ? w.charge : w.state === 'launch' ? 1 : 0.2;
    x.fillStyle = '#1b1f22'; rrect(x, cx - 4.5, cy - 37, 9, 28, 3); x.fill();
    x.fillStyle = '#0b2a24'; x.fillRect(cx - 2, cy - 34, 4, 23);
    x.fillStyle = '#6ff5d2'; x.fillRect(cx - 2, cy - 11 - 23 * ch, 4, 23 * ch);
    if (ch > 0.05) glowDot(x, cx, cy - 11 - 23 * ch, 7, 'rgba(120,255,215,0.9)', ch);
    rrect(x, cx - 16, cy - 45, 32, 10, 5);
    const hg = x.createLinearGradient(0, cy - 45, 0, cy - 35);
    hg.addColorStop(0, '#323a40'); hg.addColorStop(1, '#161a1d');
    x.fillStyle = hg; x.fill();
    x.fillStyle = 'rgba(255,255,255,0.15)'; x.fillRect(cx - 12, cy - 44, 24, 0.8);
    const eye = Math.min(1, 0.3 + 0.7 * ch + kick);
    for (const s of [-1, 1]) { glowDot(x, cx + s * 10, cy - 40, 8 + 6 * eye, 'rgba(160,255,220,0.95)', eye); x.fillStyle = '#eafff7'; x.beginPath(); x.arc(cx + s * 10, cy - 40, 3, 0, TAU); x.fill(); }
    if (w && w.state === 'charge') {   // a ring around the head fills up while the generator charges
      x.lineCap = 'round'; x.lineWidth = 3;
      x.strokeStyle = 'rgba(110,255,210,0.18)'; x.beginPath(); x.arc(cx, cy - 40, 21, 0, TAU); x.stroke();
      x.strokeStyle = ch > 0.97 && tm % 0.2 < 0.1 ? '#ffffff' : '#6ff5d2';
      x.beginPath(); x.arc(cx, cy - 40, 21, -Math.PI / 2, -Math.PI / 2 + TAU * ch); x.stroke();
      if (ch > 0.55) {   // energy streams into the generator just before the shot
        const k = (ch - 0.55) / 0.45;
        for (let i = 0; i < 7; i++) {
          const u = (tm * 1.7 + i / 7) % 1, a = i * TAU / 7 + 0.4, d = 30 * (1 - u);
          glowDot(x, cx + Math.cos(a) * d, cy - 40 + Math.sin(a) * d * 0.7, 4.5, 'rgba(150,255,220,0.95)', k * u);
        }
      }
    }
    if (kick > 0) glowDot(x, cx, cy - 41, 12 + 30 * kick, 'rgba(170,255,225,0.9)', kick);
  } else if (key === 'dzialo') {
    const a = w ? w.ang : -0.4, r = kick * 5;
    turretBase(x, cx, cy, '255,154,60', tm);
    x.fillStyle = '#262b33'; x.beginPath(); x.arc(cx - 10.5, cy - 15, 6, 0, TAU); x.fill();   // ammo drum
    x.strokeStyle = '#4c535d'; x.lineWidth = 1; x.stroke();
    x.fillStyle = '#5f6772'; for (let i = 0; i < 4; i++) { const b = i * Math.PI / 2 + 0.4; x.beginPath(); x.arc(cx - 10.5 + Math.cos(b) * 3.6, cy - 15 + Math.sin(b) * 3.6, 0.8, 0, TAU); x.fill(); }
    x.save(); x.translate(cx, cy - 13); x.rotate(a);
    rrect(x, -6.5, -26 + r, 13, 29, 3);
    const cg = x.createLinearGradient(-6.5, 0, 6.5, 0);
    cg.addColorStop(0, '#1d222a'); cg.addColorStop(0.5, '#414955'); cg.addColorStop(1, '#181c22');
    x.fillStyle = cg; x.fill();
    x.fillStyle = '#525a66'; for (const yy of [-19, -11]) x.fillRect(-7, yy + r, 14, 2);
    rrect(x, -8, -31 + r, 16, 6.5, 2); x.fillStyle = '#2b3139'; x.fill();   // muzzle brake with slots
    x.fillStyle = '#0d0f12'; x.fillRect(-6, -29.5 + r, 3, 3.4); x.fillRect(3, -29.5 + r, 3, 3.4);
    x.fillStyle = `rgba(255,${Math.round(150 - kick * 40)},60,${0.45 + kick * 0.55})`; x.fillRect(-4, -6 + r, 8, 1.8); x.fillRect(-4, -3 + r, 8, 1.8);
    glowDot(x, 0, -30 + r, 7 + kick * 12, 'rgba(255,170,80,0.9)', 0.35 + kick * 0.65);
    x.restore();
  } else if (key === 'piorun') {
    turretBase(x, cx, cy, '142,197,255', tm);
    x.fillStyle = '#3a414c'; x.fillRect(cx - 1.5, cy - 50, 3, 40);
    for (let i = 0; i < 5; i++) {   // insulator discs
      const yy = cy - 14 - i * 7.5, ww = 19 - i * 2.2;
      x.fillStyle = '#1f232b'; x.beginPath(); x.ellipse(cx, yy, ww / 2, 3.2, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(150,200,255,0.85)'; x.lineWidth = 1.1; x.beginPath(); x.ellipse(cx, yy - 0.6, ww / 2 - 1, 2, 0, Math.PI, TAU); x.stroke();
    }
    const oy = cy - 56;
    x.strokeStyle = '#4a525e'; x.lineWidth = 1.2; x.beginPath(); x.arc(cx, oy, 8, 0, TAU); x.stroke();
    glowDot(x, cx, oy, 14 + kick * 9, 'rgba(160,205,255,0.95)');
    x.fillStyle = '#eef6ff'; x.beginPath(); x.arc(cx, oy, 4.5, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(205,232,255,0.9)'; x.lineWidth = 0.9;   // little sparks crackle around the orb
    const R = seeded(Math.floor(tm * 18) * 7 + Math.round(cx));
    for (let i = 0; i < 3; i++) {
      let b = R() * TAU, px = cx + Math.cos(b) * 5, py = oy + Math.sin(b) * 5;
      x.beginPath(); x.moveTo(px, py);
      for (let j = 0; j < 3; j++) { b += (R() - 0.5) * 1.3; px += Math.cos(b) * 3.6; py += Math.sin(b) * 3.6; x.lineTo(px, py); }
      x.stroke();
    }
  } else if (key === 'rakiety') {
    turretBase(x, cx, cy, '255,100,100', tm);
    x.save(); x.translate(cx, cy - 13); x.rotate(-0.22 + kick * 0.08);
    rrect(x, -13, -21, 26, 22, 3);
    const rg = x.createLinearGradient(0, -21, 0, 1);
    rg.addColorStop(0, '#343a43'); rg.addColorStop(1, '#191c21');
    x.fillStyle = rg; x.fill();
    x.save(); rrect(x, -13, -3, 26, 4, 1); x.clip();   // yellow and black stripes
    x.fillStyle = '#ffcf3a'; x.fillRect(-13, -3, 26, 4);
    x.fillStyle = '#16181c'; for (let i = -16; i < 16; i += 5) { x.beginPath(); x.moveTo(i, 1); x.lineTo(i + 2.5, 1); x.lineTo(i + 6.5, -3); x.lineTo(i + 4, -3); x.closePath(); x.fill(); }
    x.restore();
    const iv = 2.2 * Math.pow(0.67, w ? up(w, 'fast') : 0), loaded = w && w.cd !== undefined ? clamp(1 - w.cd / iv, 0, 1) : 1;
    let n = 0;
    for (const ty of [-15.5, -8]) for (const tx of [-6, 6]) {   // four tubes; rockets come back as it reloads
      x.fillStyle = '#0c0e11'; x.beginPath(); x.arc(tx, ty, 4, 0, TAU); x.fill();
      if (loaded >= (n + 1) / 4 - 0.01) { x.fillStyle = '#ff6464'; x.beginPath(); x.arc(tx, ty, 2.7, 0, TAU); x.fill(); x.fillStyle = '#ffe1e1'; x.beginPath(); x.arc(tx - 0.7, ty - 0.7, 0.9, 0, TAU); x.fill(); }
      n++;
    }
    x.strokeStyle = '#414852'; x.lineWidth = 1; x.beginPath(); x.moveTo(10, -21); x.lineTo(13, -31); x.stroke();
    glowDot(x, 13, -31, 3.5, 'rgba(255,90,90,0.95)', tm % 1 < 0.5 ? 1 : 0.25);
    x.restore();
  }
  if (w && w.sup) glowDot(x, cx, cy - 20, 34, 'rgba(190,110,255,0.35)');
  if (w) upgradeFlash(x, cx, cy - 22, w.flash, hexRgb(WEAPONS[key].color));
}

/* ---------- the slowing field: an energy wall with a honeycomb ---------- */
const HEX_A = 9;
function hexPath(x, cx, cy, a) {
  x.beginPath();
  for (let i = 0; i < 6; i++) { const ang = Math.PI / 6 + i * Math.PI / 3; (i ? x.lineTo : x.moveTo).call(x, cx + a * Math.cos(ang), cy + a * Math.sin(ang)); }
  x.closePath();
}
// one wide picture of the honeycomb for each field height, made once
function hexBand(h) {
  if (HEX[h]) return HEX[h];
  const per = Math.sqrt(3) * HEX_A, L = -view.ox / view.s - per, wu = W + 2 * view.ox / view.s + 3 * per;
  const [c, x] = spriteCanvas(wu, h);
  x.strokeStyle = 'rgba(160,255,228,0.38)'; x.lineWidth = 0.8;
  for (let row = 0; (row - 1) * 1.5 * HEX_A < h; row++) {
    const cy = h / 2 + (row % 2 ? 1 : -1) * Math.ceil(row / 2) * 1.5 * HEX_A, off = (Math.ceil(row / 2) % 2) ? per / 2 : 0;
    for (let cx = off; cx < wu + per; cx += per) { hexPath(x, cx, cy, HEX_A * 0.9); x.stroke(); }
  }
  return (HEX[h] = { c, wu, per, L });
}
function drawField(P, tm) {
  const L = -view.ox / view.s, R = W + view.ox / view.s;
  const fade = P.state === 'close' ? P.phase / POLE.close : 1, h = P.h * (0.2 + 0.8 * fade), y0 = FIELD_Y - h / 2, y1 = y0 + h;
  const reach = 440 * P.spread, x0 = Math.max(L, P.x - reach), x1 = Math.min(R, P.x + reach);
  if (x1 <= x0) return;
  const pulse = (0.85 + Math.sin(tm * 5) * 0.15) * fade;
  ctx.save();
  // glassy body: brighter at the edges, darker in the middle
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(90,255,200,${0.34 * pulse})`); g.addColorStop(0.3, `rgba(40,170,150,${0.14 * pulse})`);
  g.addColorStop(0.7, `rgba(40,170,150,${0.14 * pulse})`); g.addColorStop(1, `rgba(90,255,200,${0.34 * pulse})`);
  ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, h);
  ctx.globalCompositeOperation = 'lighter';
  // the honeycomb drifts slowly sideways
  const HB = hexBand(P.h), hx = HB.L + (tm * 12) % HB.per, ppu = HB.c.width / HB.wu;
  ctx.globalAlpha = 0.55 + 0.45 * pulse;
  ctx.drawImage(HB.c, (x0 - hx) * ppu, 0, (x1 - x0) * ppu, HB.c.height, x0, y0, x1 - x0, h);
  // a few cells light up and fade
  for (let i = 0; i < 6; i++) {
    const k = Math.floor(tm * 1.5 + i * 0.37), r1 = seeded(k * 31 + i * 7)(), r2 = seeded(k * 17 + i * 11)();
    const life = (tm * 1.5 + i * 0.37) % 1, cx = x0 + 8 + r1 * Math.max(0, x1 - x0 - 16), cy = y0 + 9 + r2 * Math.max(0, h - 18);
    ctx.globalAlpha = Math.sin(life * Math.PI) * fade;
    hexPath(ctx, cx, cy, HEX_A * 0.85); ctx.fillStyle = 'rgba(140,255,220,0.35)'; ctx.fill();
  }
  ctx.globalAlpha = fade;
  // a soft light sweeps along the wall
  const sw = L - 80 + (tm * 170) % (R - L + 160), s0 = Math.max(x0, sw - 50), s1 = Math.min(x1, sw + 50);
  if (s1 > s0) {
    const sg = ctx.createLinearGradient(sw - 50, 0, sw + 50, 0);
    sg.addColorStop(0, 'rgba(150,255,225,0)'); sg.addColorStop(0.5, 'rgba(150,255,225,0.22)'); sg.addColorStop(1, 'rgba(150,255,225,0)');
    ctx.fillStyle = sg; ctx.fillRect(s0, y0, s1 - s0, h);
  }
  ctx.restore();
  // wavy glowing edges with sparks running along them
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
  for (const [ey, dir] of [[y0, 1], [y1, -1]]) {
    const wave = xx => ey + dir * (1.6 * Math.sin(xx * 0.06 + tm * 5 * dir) + 1.1 * Math.sin(xx * 0.17 - tm * 7));
    ctx.beginPath();
    for (let xx = x0; xx <= x1 + 9; xx += 9) { const cx = Math.min(xx, x1); xx === x0 ? ctx.moveTo(cx, wave(cx)) : ctx.lineTo(cx, wave(cx)); }
    ctx.strokeStyle = `rgba(90,255,200,${0.3 * fade})`; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = `rgba(215,255,240,${0.95 * fade})`; ctx.lineWidth = 1.8; ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const sx = x0 + ((tm * (110 + i * 23) * dir + i * 97) % (x1 - x0) + (x1 - x0)) % (x1 - x0);
      glowDot(ctx, sx, wave(sx), 9, 'rgba(200,255,240,0.95)', fade);
    }
  }
  if (P.state === 'open') {
    const u = 1 - P.phase / POLE.open;
    glowDot(ctx, P.x, FIELD_Y, 60 * (1 - u) + 20, 'rgba(200,255,235,0.95)', 1 - u);
    for (const fx of [x0, x1]) { ctx.fillStyle = 'rgba(210,255,240,0.9)'; ctx.fillRect(fx - 1.5, y0 - 6, 3, h + 12); glowDot(ctx, fx, FIELD_Y, h * 0.8, 'rgba(150,255,220,0.8)'); }
  }
  ctx.restore();
  // emitters at both sides of the screen hold the wall
  if (P.spread >= 1) for (const [ex, sd] of [[L + 3, 1], [R - 3, -1]]) {
    ctx.fillStyle = '#16191d'; rrect(ctx, ex - (sd > 0 ? 3 : 7), y0 - 8, 10, h + 16, 4); ctx.fill();
    for (const ny of [y0, y1]) glowDot(ctx, ex + sd * 2, ny, 9, 'rgba(160,255,220,0.95)', fade);
    glowDot(ctx, ex + sd * 2, FIELD_Y, 14 + Math.sin(tm * 8) * 3, 'rgba(120,255,210,0.7)', fade);
  }
}

/* ---------- the dome: a trembling, flowing force field ---------- */
function drawDome(G, tm) {
  const fr = G.domeFreeze || 0, fluid = 1 - fr, df = G.domeFlash, hpF = Math.max(0, G.baseHp) / G.baseMax;
  const flick = !G.demo && hpF < 0.3 && Math.random() < 0.1 ? 0.45 : 1;   // a weak dome flickers
  const N = 48, pts = [];
  for (let i = 0; i <= N; i++) {
    const th = Math.PI * i / N, xs = W / 2 - DOME_RX * Math.cos(th);
    // the surface ripples like liquid; after a hit it stiffens, and gives way where the meteor struck
    let d = 2.4 * fluid * (Math.sin(th * 9 + tm * 3.1) * 0.6 + Math.sin(th * 15 - tm * 4.7) * 0.4);
    for (const im of G.impacts) if (im.t < 0.35) { const k = (xs - im.x) / 28; d -= 4.5 * (1 - im.t / 0.35) * Math.exp(-k * k); }
    pts.push([W / 2 - (DOME_RX + d) * Math.cos(th), GROUND - (DOME_H + d * 0.45) * Math.sin(th)]);
  }
  const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
  const col = `${Math.round(120 + 115 * fr)},${Math.round(212 + 35 * fr)},255`;   // cyan while flowing, icy white while frozen
  path();
  const g = ctx.createLinearGradient(0, DOME_TOP, 0, GROUND);
  g.addColorStop(0, `rgba(${col},${(0.15 + fr * 0.22 + df * 0.12) * flick})`); g.addColorStop(1, `rgba(${col},${(0.04 + fr * 0.1) * flick})`);
  ctx.fillStyle = g; ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [sc, sp, al] of [[0.9, 1.3, 0.24], [0.78, -1.7, 0.16]]) {   // inner layers flowing the other way
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const th = Math.PI * i / N, d = 3 * fluid * Math.sin(th * 7 + tm * sp * 2);
      const x = W / 2 - (DOME_RX * sc + d) * Math.cos(th), y = GROUND - (DOME_H * sc + d * 0.5) * Math.sin(th);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = `rgba(${col},${al * (0.45 + 0.55 * fluid) * flick})`; ctx.lineWidth = 1.2; ctx.stroke();
  }
  for (let i = 0; i < 3; i++) {   // lights sliding over the surface
    const p = pts[Math.round(((tm * 0.17 + i / 3) % 1) * N)];
    glowDot(ctx, p[0], p[1], 22, `rgba(${col},0.35)`, fluid * flick);
  }
  path();
  ctx.strokeStyle = `rgba(${col},${(0.2 + fr * 0.25) * flick})`; ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = `rgba(232,250,255,${Math.min(1, 0.55 + fr * 0.4 + df * 0.3) * flick})`; ctx.lineWidth = 1.6 + fr; ctx.stroke();
  ctx.restore();
  if (!G.cracks.length && !G.impacts.length) return;
  // cracks stay inside the glass of the dome
  ctx.save();
  path(); ctx.closePath(); ctx.clip();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const crack = (cx, cy, shape, al, wd) => {
    ctx.beginPath();
    for (const line of shape) line.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y)));
    ctx.strokeStyle = `rgba(150,225,255,${al * 0.35})`; ctx.lineWidth = wd * 3.2; ctx.stroke();
    ctx.strokeStyle = `rgba(246,252,255,${al})`; ctx.lineWidth = wd; ctx.stroke();
  };
  for (const c of G.cracks) crack(c.x, c.y, c.shape, (0.45 + 0.4 * fr) * flick, 0.9);
  for (const im of G.impacts) {
    const al = 1 - im.t / 1.4;
    glowDot(ctx, im.x, im.y, 28 * (1 - im.t * 0.4), 'rgba(225,246,255,0.9)', al * (im.t < 0.4 ? 1 : 0.45));
    crack(im.x, im.y, im.shape, al, 1.25);
  }
  ctx.restore();
}

/* ---------- the scene ---------- */
function render(G, real) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(bg, 0, 0);
  if (!G) return;
  const sh = G.shake * 6, sx = sh ? rand(-sh, sh) : 0, sy = sh ? rand(-sh, sh) : 0;
  toWorld(sx, sy);
  const tm = performance.now() / 1000;
  // the Asteroid
  const B = G.boss;
  if (B) {
    const S = SPR.boss;
    ctx.drawImage(S.c, B.x - S.ax, B.y - S.ay, S.w, S.h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.18 + 0.64 * i / 8), fx = B.x + Math.cos(a) * B.r * 0.95, fy = B.y + Math.sin(a) * B.r * 0.95;
      const l = 40 + Math.sin(tm * 9 + i * 1.7) * 14;
      glowDot(ctx, fx, fy + l * 0.3, l * 0.6, 'rgba(255,150,60,0.55)');
    }
    if (B.flash > 0) { ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.globalCompositeOperation = 'source-over';
  }
  // the slowing field: the shot from the generator, then the band spreading to both sides
  const P = G.w.pole;
  if (P && P.state === 'launch') {
    const u = 1 - P.phase / POLE.launch, e = 1 - (1 - u) * (1 - u), y = GROUND - 45 + (FIELD_Y - GROUND + 45) * e;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(110,255,205,0.35)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(P.x, Math.min(GROUND - 45, y + 90)); ctx.lineTo(P.x, y); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,255,240,0.9)'; ctx.lineWidth = 3; ctx.stroke();
    glowDot(ctx, P.x, y, 30, 'rgba(150,255,220,0.95)'); glowDot(ctx, P.x, y, 10, 'rgba(245,255,250,1)');
    ctx.globalCompositeOperation = 'source-over';
  }
  if (P && (P.on || P.state === 'close')) drawField(P, tm);
  // meteors
  ctx.globalCompositeOperation = 'lighter';
  // embers in three batches by age: yellow, orange, red (one fill each is much faster than one per ember)
  for (const [lo, hi, col] of [[0, 0.35, 'rgba(255,225,150,0.9)'], [0.35, 0.7, 'rgba(255,150,60,0.75)'], [0.7, 1, 'rgba(220,70,30,0.5)']]) {
    ctx.beginPath();
    for (const m of G.embers) { const u = m.t / m.life; if (u >= lo && u < hi) ctx.rect(m.x - m.s / 2, m.y - m.s / 2, m.s, m.s); }
    ctx.fillStyle = col; ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  const base = view.k, ox = (view.ox + sx) * view.dpr, oy = (view.oy + sy) * view.dpr;
  for (const e of G.enemies) {
    const list = SPR[e.kind], S = list[e.variant % list.length], F = FLAME[e.kind];
    const a = Math.atan2(-e.vx, e.vy), c = Math.cos(a) * base, s = Math.sin(a) * base;
    ctx.setTransform(c, s, -s, c, ox + e.x * base, oy + e.y * base);
    // the faster the meteor really falls, the longer its flame (slowed ones get a short one)
    const stretch = clamp(0.45 + speedOf(e) * e.vy / 110, 0.5, 1.5);
    ctx.drawImage(F.frames[Math.floor(tm * 14 + e.id * 3.7) % FLAME_FRAMES], -F.ax, -F.ay * stretch, F.w, F.h * stretch);
    const rot = a + e.rot0 + e.spin * (G.t - e.born), rc = Math.cos(rot) * base, rs = Math.sin(rot) * base;
    ctx.setTransform(rc, rs, -rs, rc, ox + e.x * base, oy + e.y * base);
    ctx.drawImage(S.c, -S.ax, -S.ay, S.w, S.h);
    ctx.setTransform(c, s, -s, c, ox + e.x * base, oy + e.y * base);
    ctx.globalCompositeOperation = 'lighter';   // the front of the rock glows from the heat
    ctx.strokeStyle = 'rgba(255,170,90,0.55)'; ctx.lineWidth = e.r * 0.16;
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.9, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    if (e.flash > 0) { ctx.globalAlpha = 0.55; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, e.r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    if (e.burnT > 0) { ctx.globalAlpha = 0.6; glowDot(ctx, 0, -2, e.r * 1.3, 'rgba(255,120,30,0.9)'); ctx.globalAlpha = 1; }
    if (e.slow > 0) glowDot(ctx, 0, 0, e.r * 1.9, 'rgba(110,255,210,0.5)', Math.min(1, e.slowT + 0.3));
    if (e.stun > 0) { ctx.strokeStyle = 'rgba(220,180,255,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, e.r + 3, 0, TAU); ctx.stroke(); }
  }
  toWorld(sx, sy);
  // cannon shells and rockets
  for (const s of G.shells) { if (s.t < 0) continue; glowDot(ctx, s.x, s.y, 9, 'rgba(255,170,80,0.9)'); ctx.fillStyle = '#ffe6bd'; ctx.beginPath(); ctx.arc(s.x, s.y, 3.2, 0, TAU); ctx.fill(); }
  for (const r of G.rockets) {
    const a = Math.atan2(r.vx, -r.vy);
    ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(a);
    glowDot(ctx, 0, 7, 8, 'rgba(255,170,70,0.9)');
    ctx.fillStyle = '#f2e6e6'; rrect(ctx, -2.2, -7, 4.4, 11, 2); ctx.fill();
    ctx.fillStyle = '#ff6464'; ctx.beginPath(); ctx.moveTo(-2.2, -7); ctx.lineTo(0, -11); ctx.lineTo(2.2, -7); ctx.fill();
    ctx.restore();
  }
  for (const s of G.sparks) if (s.col === 'smoke') { ctx.globalAlpha = 0.35 * (1 - s.t / s.life); ctx.fillStyle = '#9a9ca2'; ctx.beginPath(); ctx.arc(s.x, s.y, s.s * (1 + s.t * 2), 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  // light: lasers, bullets, lightning, explosions
  ctx.globalCompositeOperation = 'lighter';
  const LZ = G.w.laser;
  if (LZ && LZ.on) {
    for (const Bm of LZ.beams) {
      const dx = Math.sin(Bm.ang), dy = -Math.cos(Bm.ang), ox2 = LZ.x + dx * 35, oy2 = GROUND - 13 + dy * 35;
      const fl = 1 + Math.sin(tm * 40) * 0.15;
      ctx.beginPath(); ctx.moveTo(ox2, oy2); ctx.lineTo(ox2 + dx * 1500, oy2 + dy * 1500);
      ctx.strokeStyle = 'rgba(165,85,255,0.3)'; ctx.lineWidth = 4.5 * fl; ctx.stroke();
      ctx.strokeStyle = 'rgba(200,140,255,0.85)'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.strokeStyle = 'rgba(252,240,255,0.95)'; ctx.lineWidth = 0.7; ctx.stroke();
      glowDot(ctx, ox2, oy2, 9, 'rgba(200,140,255,0.9)');
    }
  }
  // the robot's bullets: colour, size and kind follow its ammunition; piercing ones are longer, like lances
  ctx.lineCap = 'round';
  for (let tier = 0; tier < AMMO.length; tier++) {
    const list = G.bullets.filter(b => b.tier === tier);
    if (!list.length) continue;
    const col = AMMO[tier].col, len = 0.02 + tier * 0.007, wd = 2.4 + tier * 1.1;
    ctx.beginPath();
    for (const b of list) { const L = len * (1 + 0.4 * b.pl); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * L, b.y - b.vy * L); }
    ctx.strokeStyle = `rgba(${col},0.32)`; ctx.lineWidth = wd * 2.8; ctx.stroke();
    ctx.strokeStyle = `rgba(${col},0.95)`; ctx.lineWidth = wd; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = wd * 0.35; ctx.stroke();
    if (tier >= 1) for (const b of list) glowDot(ctx, b.x, b.y, 4 + tier * 2.6, `rgba(${col},0.9)`);
  }
  for (const b of G.bolts) {
    const al = 1 - b.t / 0.22;
    ctx.beginPath();
    for (let i = 0; i < b.pts.length - 1; i++) {
      const [x0, y0] = b.pts[i], [x1, y1] = b.pts[i + 1];
      ctx.moveTo(x0, y0);
      for (let j = 1; j < 5; j++) ctx.lineTo(x0 + (x1 - x0) * j / 5 + rand(-7, 7), y0 + (y1 - y0) * j / 5 + rand(-7, 7));
      ctx.lineTo(x1, y1);
    }
    ctx.strokeStyle = `rgba(110,170,255,${0.45 * al})`; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = `rgba(235,245,255,${al})`; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const b of G.booms) {
    if (b.t < 0) continue;
    const u = b.t / b.life, rr = b.rad * (0.45 + 0.65 * u), al = 1 - u;
    const col = b.col === 'red' ? '255,110,90' : b.col === 'pop' ? '255,210,160' : '255,160,70';
    glowDot(ctx, b.x, b.y, rr, `rgba(${col},0.8)`, al);
    glowDot(ctx, b.x, b.y, rr * 0.5, 'rgba(255,245,220,0.95)', al);
    if (b.col !== 'pop') { ctx.strokeStyle = `rgba(${col},${0.5 * al})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.rad * (0.6 + 0.6 * u), 0, TAU); ctx.stroke(); }
  }
  for (const s of G.sparks) if (s.col !== 'smoke') { ctx.globalAlpha = 1 - s.t / s.life; ctx.fillStyle = s.col; ctx.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s); }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  // dome, base, turrets
  drawDome(G, tm);
  // the house in the middle
  ctx.fillStyle = '#2b2f36';
  ctx.fillRect(W / 2 - 34, GROUND - 26, 68, 26);
  ctx.beginPath(); ctx.moveTo(W / 2 - 40, GROUND - 26); ctx.lineTo(W / 2, GROUND - 44); ctx.lineTo(W / 2 + 40, GROUND - 26); ctx.fill();
  ctx.fillStyle = 'rgba(255,214,140,0.75)';
  for (const wx of [-24, -12, 8, 20]) ctx.fillRect(W / 2 + wx, GROUND - 18, 5, 6);
  for (let s = 0; s < 5; s++) {
    if (s === ROBOT_SLOT) continue;
    const w = Object.values(G.w).find(q => q.slot === s);
    drawPad(ctx, SLOT_X[s], GROUND, !w);
    if (w) drawTurret(ctx, w.key, SLOT_X[s], GROUND, w, tm);
  }
  drawRobot(ctx, G.w.robot.x, GROUND, G.w.robot, tm);
  // the life of the base
  if (!G.demo) {
    const f = G.baseHp / G.baseMax, ax = W / 2, ay = GROUND - 22, ar = 50, a0 = Math.PI * 1.2, a1 = Math.PI * 1.8;
    ctx.lineCap = 'round'; ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(20,22,26,0.7)'; ctx.beginPath(); ctx.arc(ax, ay, ar, a0, a1); ctx.stroke();
    ctx.strokeStyle = f > 0.5 ? '#4fe3a0' : f > 0.25 ? '#ffd24a' : '#ff5a4f';
    if (f > 0) { ctx.beginPath(); ctx.arc(ax, ay, ar, a0, a0 + (a1 - a0) * f); ctx.stroke(); }
    ctx.font = `20px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,12,14,0.8)'; ctx.strokeText(String(Math.ceil(G.baseHp)), ax, ay - ar - 6);
    ctx.fillStyle = ctx.strokeStyle = f > 0.5 ? '#4fe3a0' : f > 0.25 ? '#ffd24a' : '#ff5a4f';
    ctx.fillText(String(Math.ceil(G.baseHp)), ax, ay - ar - 6);
  }
  // damage numbers
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const n of G.nums) {
    const u = n.t / 0.8, rise = 22 * Math.min(1, u * 2.2), al = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
    const sz = n.slow ? 13 : n.crit ? 24 : 15, pop = u < 0.12 ? 1 + (0.12 - u) * 4 : 1;
    ctx.font = `${Math.round(sz * pop)}px ${FONT}`;
    ctx.globalAlpha = al;
    const txt = n.slow ? n.v : `-${n.v}`;
    ctx.lineWidth = 3.5; ctx.strokeStyle = n.slow ? 'rgba(60,10,10,0.9)' : 'rgba(40,18,18,0.85)'; ctx.strokeText(txt, n.x, n.y - rise);
    ctx.fillStyle = n.slow ? '#ff5656' : n.crit ? '#ff4b3e' : '#f6c9bd';
    ctx.fillText(txt, n.x, n.y - rise);
  }
  ctx.globalAlpha = 1;
}

/* ---------- card pictures ---------- */
const ICON = {};
function iconFor(key, kind) {
  const id = `${key}:${kind || ''}`;
  if (ICON[id]) return ICON[id];
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round';
  const g = x.createRadialGradient(80, 80, 10, 80, 80, 90);
  const tint = kind === 'super' ? ['#7b3cc4', '#2a1645'] : kind === 'combo' ? ['#c99a2e', '#3a2a0e'] : ['#2f7f6d', '#12201e'];
  g.addColorStop(0, tint[0]); g.addColorStop(1, tint[1]);
  x.fillStyle = g; x.fillRect(0, 0, 160, 160);
  if (key === 'heal') {
    x.fillStyle = '#ff5a6a'; x.beginPath(); x.moveTo(80, 128); x.bezierCurveTo(20, 90, 30, 34, 80, 56); x.bezierCurveTo(130, 34, 140, 90, 80, 128); x.fill();
    x.fillStyle = '#fff'; x.fillRect(72, 64, 16, 44); x.fillRect(58, 78, 44, 16);
  } else if (key.includes('+')) {
    const [a, b] = key.split('+');
    x.save(); x.translate(44, 140); x.scale(1.3, 1.3); paintIcon(x, a); x.restore();
    x.save(); x.translate(116, 140); x.scale(1.3, 1.3); paintIcon(x, b); x.restore();
    x.fillStyle = '#ffe9a8'; x.font = `44px ${FONT}`; x.textAlign = 'center'; x.fillText('+', 80, 70);
  } else { x.save(); x.translate(80, 148); x.scale(2.1, 2.1); paintIcon(x, key); x.restore(); }
  return (ICON[id] = c.toDataURL());
}
function paintIcon(x, key) {
  const fake = { ang: -0.35, kick: 0, on: true, beams: [{ ang: -0.35 }], side: 0, sup: false, ups: {}, stars: 0, vx: 0, step: 0, flash: 0 };
  if (key === 'robot') drawRobot(x, 0, 0, fake, 0);
  else drawTurret(x, key, 0, 0, fake, 0);
}

/* ============================================================
   Screens
   ============================================================ */
const screens = ['scrMenu', 'scrCards', 'scrPause', 'scrResult'];
function show(id) { for (const s of screens) $(s).hidden = s !== id; document.body.classList.toggle('modal', !!id && id !== 'scrMenu'); }
let G = null, demo = null, mode = 'menu', paused = false, overT = 0, resultShown = false, offer = null, lastHud = {}, cardsAt = 0;

function startBattle(stage) {
  save.stage = stage; save.played++; store();
  G = newBattle(stage, { fx: true });
  mode = 'battle'; paused = false; overT = 0; resultShown = false; lastHud = {};
  show(null); $('hud').hidden = false; $('bossBar').hidden = true;
  $('hudStage').textContent = `Etap ${stage}`;
  speedLabel();
  Sound.music('neon-walka');
  if (save.played <= 3) setTimeout(() => banner('Przesuwaj palcem<br>w lewo i w prawo!', 'hint'), 600);
}
function toMenu() {
  mode = 'menu'; G = null; paused = false;
  $('hud').hidden = true; $('banner').className = '';
  menuStage();
  show('scrMenu');
  Sound.music(null);
}
function menuStage() {
  save.stage = clamp(save.stage, 1, save.best);
  $('menuStage').textContent = `Etap ${save.stage}`;
  $('stPrev').disabled = save.stage <= 1;
  $('stNext').disabled = save.stage >= save.best;
}
function speedLabel() { $('btnSpeed').textContent = `×${save.speed}`; }
function banner(html, kind) {
  const b = $('banner');
  b.innerHTML = html; b.className = ''; void b.offsetWidth; b.className = `show ${kind || ''}`;
}

/* ---------- level up ---------- */
function starsHtml(w) {
  let s = '';
  for (let i = 0; i < STARS_FOR_SUPER; i++) s += `<i class="${w && w.stars > i ? 'on' : ''}"></i>`;
  return s + `<i class="sup ${w && w.sup ? 'on' : ''}"></i>`;
}
function slotsHtml() {
  let h = '';
  for (let s = 0; s < 5; s++) {
    const w = Object.values(G.w).find(q => q.slot === s);
    h += w ? `<div class="slot"><img src="${iconFor(w.key)}" alt="${WEAPONS[w.key].name}"><div class="stars">${starsHtml(w)}</div></div>` : '<div class="slot empty"></div>';
  }
  return h;
}
function openCards() {
  offer = makeOffer(G); cardsAt = performance.now();
  $('cardSlots').innerHTML = slotsHtml();
  $('cardLevel').textContent = `Poziom ${G.lvl - G.pending + 1}`;
  const box = $('cardList');
  box.innerHTML = '';
  offer.forEach((c, i) => {
    const info = cardInfo(c), key = c.type === 'combo' ? (() => { const k = COMBOS.find(q => q.id === c.id); return `${k.a}+${k.b}`; })() : c.type === 'heal' ? 'heal' : c.w;
    const b = document.createElement('button');
    b.className = `pick ${c.type}`;
    b.style.animationDelay = `${i * 0.06}s`;
    b.innerHTML = `<span class="ptitle">${info.title}</span><span class="pimg"><img src="${iconFor(key, c.type)}" alt=""><em>${info.tag}</em></span>`
      + (c.type === 'up' ? `<span class="stars">${starsHtml(G.w[c.w])}</span>` : '') + `<span class="ptext">${info.text}</span>`;
    b.addEventListener('click', () => choose(c));
    box.appendChild(b);
  });
  $('btnReroll').hidden = G.rerolls <= 0;
  $('btnReroll').textContent = `Losuj inne karty (${G.rerolls})`;
  show('scrCards');
}
function choose(c) {
  if (performance.now() - cardsAt < 350) return;   // a quick double tap must not also pick the next level's card
  applyCard(G, c);
  Sound.play('karta');
  if (G.pending > 0) openCards(); else show(null);
}

/* ---------- the end of a battle ---------- */
function showResult() {
  resultShown = true;
  const win = G.over === 'win';
  if (win) { save.best = Math.max(save.best, G.stage + 1); store(); }
  $('resTitle').textContent = win ? 'Zwycięstwo!' : 'Baza zniszczona';
  $('resTitle').className = win ? 'win' : 'lose';
  $('resStage').textContent = `Etap ${G.stage}`;
  $('resStats').innerHTML = `<div><b>${mmss(G.t)}</b><span>czas</span></div><div><b>${G.kills}</b><span>meteory</span></div><div><b>${Math.round(100 * G.baseHp / G.baseMax)}%</b><span>życie bazy</span></div>`;
  const rows = Object.keys(G.w).map(k => ({ k, d: G.dmg[k] || 0, t: Math.max(1, G.t - G.w[k].built) })).sort((a, b) => b.d - a.d);
  $('resTable').innerHTML = rows.map(r => `<tr><td><img src="${iconFor(r.k)}" alt=""><span>${WEAPONS[r.k].name}</span><span class="stars">${starsHtml(G.w[r.k])}</span></td>`
    + (r.k === 'pole' ? `<td>${big(G.slowed)}<small>spowolnione meteory</small></td><td>–</td></tr>` : `<td>${big(r.d)}</td><td>${big(r.d / r.t)}</td></tr>`)).join('');
  $('btnNext').hidden = !win;
  $('btnNext').textContent = `Etap ${G.stage + 1}`;
  show('scrResult');
}

/* ---------- top bar ---------- */
function updateHud() {
  const tsec = Math.floor(G.t);
  if (lastHud.t !== tsec) { lastHud.t = tsec; $('hudTime').textContent = mmss(tsec); }
  const xpf = Math.round(100 * G.xp / G.need);
  if (lastHud.xp !== xpf) { lastHud.xp = xpf; $('xpFill').style.width = `${xpf}%`; }
  if (lastHud.lvl !== G.lvl) { lastHud.lvl = G.lvl; $('xpLvl').textContent = `Poziom ${G.lvl}`; }
  const B = G.boss;
  $('bossBar').hidden = !B;
  if (B) {
    const f = Math.max(0, B.hp / B.max) * 10, layers = Math.ceil(f), part = f - (layers - 1);
    const key = `${layers}:${Math.round(part * 200)}`;
    if (lastHud.boss !== key) {
      lastHud.boss = key;
      const COL = ['#ff4a3d', '#ff7a2f', '#ffb02e', '#e94bd0', '#9b5cff'];
      $('bossFill').style.width = `${part * 100}%`;
      $('bossFill').style.background = COL[(layers - 1) % COL.length];
      $('bossTrack').style.background = layers > 1 ? COL[(layers - 2) % COL.length] : '#2a1d1d';
      $('bossX').textContent = `×${layers}`;
    }
  }
}
function handleEvents() {
  const keep = [];
  for (const e of G.ev) {
    if (e.startsWith('amunicja-')) { if (!$('scrCards').hidden) keep.push(e); else banner(`Nowa amunicja:<br>${AMMO[+e.slice(9)].name}!`, 'hint'); continue; }
    if (e.startsWith('roj-')) { banner(`Rój meteorów<br>${{ lewa: 'z lewej!', prawa: 'z prawej!', srodek: 'na środek!' }[e.slice(4)]}`, 'warn'); Sound.play('roj'); continue; }
    else if (e === 'boss') { banner('Nadlatuje Asteroida!', 'boss'); Sound.music('turbo-walka'); }
    else if (e === 'wygrana') Sound.music(null);
    else if (e === 'przegrana') Sound.music(null);
    Sound.play(e);
  }
  G.ev = keep;
}

/* ---------- main loop ---------- */
let last = 0;
function frame(now) {
  const real = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  if (mode === 'battle' && G) {
    keyMove(real);
    if (!paused && !G.pending && !G.over) {
      let left = real * save.speed;
      while (left > 1e-6 && !G.pending && !G.over) { const h = Math.min(left, 1 / 60); step(G, h); left -= h; }
    }
    stepFx(G, paused || (G.pending && !G.over) ? 0 : real * (G.over ? 1 : save.speed));
    handleEvents();
    if (G.pending && !G.over && $('scrCards').hidden && !paused) openCards();
    else if (!G.pending && !$('scrCards').hidden) show(null);
    if (G.over) { overT += real; if (overT > 1.8 && !resultShown) showResult(); }
    updateHud();
    render(G, real);
  } else {
    if (!demo) demo = newDemo();
    let left = real;
    while (left > 1e-6) { const h = Math.min(left, 1 / 60); step(demo, h); left -= h; }
    stepFx(demo, real); demo.ev.length = 0;
    render(demo, real);
  }
  requestAnimationFrame(frame);
}
function newDemo() {
  const d = newBattle(1, { fx: true, demo: true });
  applyCard(d, { type: 'build', w: 'laser' }); applyCard(d, { type: 'build', w: 'pole' }); applyCard(d, { type: 'build', w: 'dzialo' });
  d.w.robot.ups.multi = 1;
  return d;
}

/* ---------- buttons ---------- */
function tap(id, fn) { $(id).addEventListener('click', e => { Sound.unlock(); Sound.play('klik'); fn(e); }); }
tap('btnPlay', () => startBattle(save.stage));
tap('stPrev', () => { save.stage = Math.max(1, save.stage - 1); store(); menuStage(); });
tap('stNext', () => { save.stage = Math.min(save.best, save.stage + 1); store(); menuStage(); });
tap('btnPause', () => { if (G && !G.over) { paused = true; show('scrPause'); } });
tap('btnResume', () => { paused = false; show(G && G.pending ? 'scrCards' : null); });
tap('btnQuit', () => toMenu());
tap('btnSpeed', () => { save.speed = save.speed === 1 ? 2 : 1; store(); speedLabel(); });
tap('btnReroll', () => { if (G.rerolls > 0) { G.rerolls--; openCards(); } });
tap('btnNext', () => startBattle(G.stage + 1));
tap('btnAgain', () => startBattle(G.stage));
tap('btnMenu', () => toMenu());
for (const b of document.querySelectorAll('[data-toggle]')) {
  const k = b.dataset.toggle, label = () => { b.textContent = `${k === 'music' ? 'Muzyka' : 'Dźwięki'}: ${save[k] ? 'wł.' : 'wył.'}`; b.setAttribute('aria-pressed', String(save[k])); };
  label();
  b.addEventListener('click', () => { save[k] = !save[k]; store(); label(); Sound.unlock(); Sound.settings(); });
}
document.addEventListener('pointerdown', () => Sound.unlock(), { passive: true });
// the robot walks to where the finger is (anywhere on the screen, only left and right matter)
let dragging = false;
const keys = {};
function aimAt(clientX) { if (mode === 'battle' && G && !paused) G.aim = clamp((clientX - view.ox) / view.s, 22, W - 22); }
canvas.addEventListener('pointerdown', e => { dragging = true; aimAt(e.clientX); try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* old browser */ } });
canvas.addEventListener('pointermove', e => { if (dragging) aimAt(e.clientX); });
for (const t of ['pointerup', 'pointercancel']) canvas.addEventListener(t, () => { dragging = false; });
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });
function keyMove(dt) {
  const d = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  if (d && G) G.aim = clamp(G.w.robot.x + d * 60, 22, W - 22);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Sound.suspend(true); if (mode === 'battle' && G && !G.over && !G.pending) { paused = true; show('scrPause'); } }
  else Sound.suspend(false);
});
window.addEventListener('resize', resize);
$('menuVersion').textContent = `Wersja ${WERSJA}`;
resize();
menuStage();
show('scrMenu');
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const k in ICON) delete ICON[k]; });
requestAnimationFrame(t => { last = t; frame(t); });

// for automatic tests only (address with ?test)
if (/[?&]test\b/.test(location.search)) window.WR = { get G() { return G; }, get FLAME() { return FLAME; }, startBattle, step, applyCard, makeOffer, set paused(v) { paused = v; } };
})();
