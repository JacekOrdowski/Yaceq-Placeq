/* Śmierdzipacha: silnik gry (ruch, walka, grafika, dźwięk, ekrany).
   Zadania matematyczne dla klas 1–8 są w pliku zadania.js. */
(() => {
'use strict';
const HAS_DOM = typeof document !== 'undefined';
const Z = globalThis.Zadania;
const WERSJA = 18;         // numer wersji gry; opis zmian w ZMIANY.md

/* ============================================================
   Helpers
   ============================================================ */
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const MINUS = '−';
const group = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* ============================================================
   Stage settings
   8 classes (klasa 1–8) × 40 stages. Later stages: more gates, less time, more enemies.
   ============================================================ */
const STAGES = 40;
const START = 10;          // soldiers at the start, before armoury upgrades
// The youngest read slowest, so they get the most time per problem
const CLASS_CFG = [
  { think: 9.0, speed: 5.0 }, { think: 9.0, speed: 5.3 }, { think: 8.5, speed: 5.6 }, { think: 8.5, speed: 5.9 },
  { think: 8.5, speed: 6.0 }, { think: 8.5, speed: 6.2 }, { think: 9.0, speed: 6.2 }, { think: 9.5, speed: 6.4 },
];
// Worlds: every topic of a level runs through another place; brighter ones for the youngest, city and space for the oldest
const LEVEL_WORLDS = [
  ['most', 'las', 'kanion', 'snieg'], ['las', 'most', 'snieg', 'kanion'], ['kanion', 'las', 'most', 'snieg'], ['snieg', 'kanion', 'las', 'wulkan'],
  ['wulkan', 'las', 'kanion', 'miasto'], ['miasto', 'snieg', 'wulkan', 'kanion'], ['miasto', 'wulkan', 'kosmos', 'snieg'], ['kosmos', 'miasto', 'wulkan', 'kanion'],
];
const worldOf = (cls, s) => LEVEL_WORLDS[cls][s === STAGES - 1 ? 0 : Math.floor(s / 5) % 4];
// "Gra na próbę": a look through the keyhole into any level, a mix of all its topics (degrees 1–3) on the road of its middle game
const TRIAL_S = 19;
function trialInfo(cls) {
  const T = Z.KLASY[cls].tematy;
  return { name: 'Gra na próbę', tier: 2, review: true, final: false, trial: true, time: Math.max(...T.map(t => t.czas || 1)),
    gen: () => Z.stage(cls, randi(0, T.length - 1) * 5 + randi(0, 2)).gen() };
}
function stageConfig(cls, s, trial) {
  const C = CLASS_CFG[cls], info = trial ? trialInfo(cls) : Z.stage(cls, s), f = s / (STAGES - 1), d = Math.floor(s / 10);
  const think = C.think * (1.1 - 0.3 * f) * (info.time || 1);
  const speed = C.speed + 0.6 * f;
  // After every gate: a calm moment with the reward on the side of the right answer, then enemies and obstacles,
  // and only when they are behind comes the next problem, with the whole thinking time before its gate
  const lead = 1.0, zone = s < 10 ? 4.4 : 5.0;
  return {
    cls, s, info, think, speed, lead, zone, start: START, trial: !!trial,
    first: speed * (think + 1.0), spacing: speed * (lead + zone + think),
    gates: trial ? 6 : 5 + d + (s >= 35 ? 1 : 0),
    rLo: Math.round((5 + 2 * d) * (1 + 0.7 * f)), rHi: Math.round((15 + 3 * d) * (1 + 0.7 * f)),   // soldiers won or lost at one gate (more in later games, against bigger hordes)
    foeBase: 10 + 2.5 * d,                      // the size of the hordes follows this, not the bigger rewards
    squadsPer: s < 5 ? 2 : s < 15 ? 3 : 4, enemyMul: s === 0 ? 2.6 : 3.8,   // enemies per span = enemyMul × average gate reward, in waves
    foes: FOE_ORDER.slice(0, clamp(2 + Math.floor(s / 6) + Math.floor(cls / 3), 2, FOE_ORDER.length)),
    brutes: s >= 8,                             // big enemies with many lives, from game 9
    bridges: s >= 3 ? 1 : 0,                    // broken bridge to repair by shooting, from game 4
    obstacles: s < 1 ? [] : s < 3 ? ['bus'] : s < 6 ? ['bus', 'barrels', 'truck'] : ['bus', 'truck', 'barrels', 'hammer'],
    obstPer: s >= 20 ? 1.4 : s >= 1 ? 1 : 0,    // obstacles per span (1.4 = sometimes two)
    hurt: 3 + d,                                // soldiers lost under the hammer or in the fire (2 more at a burning bus or lorry)
  };
}
// Enemies walking against the army; every kind is hard in another way, a big one may lead the horde
const FOES = {
  zombie: { hp: 1, speed: 2.0, dmg: 1, w: 0.36, sc: 1.15, n: 1 },
  ant: { hp: 1, speed: 3.1, dmg: 1, w: 0.32, sc: 0.95, n: 1.3 },             // fast and many
  wasp: { hp: 1, speed: 2.6, dmg: 1, w: 0.3, sc: 1.0, n: 0.9, fly: true },  // flies in zigzags
  snake: { hp: 2, speed: 1.7, dmg: 1, w: 0.36, sc: 1.1, n: 0.75 },          // two hits, slithers
  clown: { hp: 3, speed: 1.5, dmg: 1, w: 0.4, sc: 1.2, n: 0.6 },            // three hits
};
const FOE_ORDER = ['zombie', 'ant', 'wasp', 'snake', 'clown'];
const BIG_HP = { zombie: 1, ant: 0.8, wasp: 0.9, snake: 1.15, clown: 1.3 };
// a burning bus or lorry blocks one half of the road; the hammer falls on one half; barrels stand on one half
const CAR_X0 = 0.55, CAR_X1 = 3.35, CAR = { bus: { len: 5.2, h: 3.0 }, truck: { len: 7.6, h: 3.6 } }, HAMMER_W = 1.25, HAMMER_P = 2.0, BARREL_W = 0.5;

/* ============================================================
   Weapons, power-ups and the armoury (bought with gold earned by playing; never with money, never by chance)
   ============================================================ */
// Toy-like weapons: damage of one shot and how fast the army fires
const WEAPONS = [
  { name: 'Blaster', dmg: 1, rate: 1.0 },
  { name: 'Turboblaster', dmg: 1.5, rate: 1.1 },
  { name: 'Plazma', dmg: 2, rate: 1.2 },
  { name: 'Działko', dmg: 2.5, rate: 1.3 },
  { name: 'Laser', dmg: 3, rate: 1.4 },
];
const MAX_WEAPON = WEAPONS.length - 1;
const POWERS = { giant: { name: 'Olbrzymy', dmg: 1.5, rate: 1 }, turbo: { name: 'Szybki ogień', dmg: 1, rate: 1.4 } };
// Permanent upgrades (like in Archero), bought level by level in the armoury; from: the level of the game that opens them,
// needs: another upgrade that has to be bought first. Prices of every next level.
const SKILLS = {
  army: { name: 'Żołnierze na start', from: 1, prices: [50, 100, 180, 320, 550, 900, 1400, 2200] },
  rate: { name: 'Szybkie strzelanie', from: 1, prices: [60, 120, 220, 400, 700, 1150, 1800, 2700] },
  weapon: { name: 'Broń na start', from: 1, prices: [300, 1800] },
  front: { name: 'Dodatkowa lufa', from: 1, prices: [400, 3800] },
  pierce: { name: 'Pociski przeszywające', from: 1, prices: [150, 900, 3000] },
  multi: { name: 'Podwójny strzał', from: 2, prices: [600, 2000, 4800] },
  fire: { name: 'Ogniste pociski', from: 2, prices: [650, 2100, 5000] },
  ice: { name: 'Mrożące pociski', from: 3, prices: [900, 2600, 5600] },
  diag: { name: 'Boczne lufy', from: 3, prices: [1300, 4500] },
  bounce: { name: 'Odbijanie od ścian', from: 4, needs: 'diag', prices: [1700, 4200] },
  poison: { name: 'Zatrute pociski', from: 4, prices: [2000, 4000, 6800] },
  bolt: { name: 'Działo elektryczne', from: 5, prices: [2800, 5500, 8800] },
  boom: { name: 'Wybuchający wrogowie', from: 6, prices: [3500, 6200, 9500] },
};
const SKILL_KEYS = Object.keys(SKILLS);
const KIT0 = Object.fromEntries(SKILL_KEYS.map(k => [k, 0]));
const maxLv = k => SKILLS[k].prices.length;
// What every level of an upgrade does
const ARMY_PER = 3, RATE_PER = 0.06;                      // soldiers at the start; faster shooting
const FRONT = [1, 2, 3], FRONT_RATE = [1, 0.6, 0.47];     // bullets side by side (the volleys come less often)
const MULTI = [0, 0.2, 0.35, 0.5];                        // chance of a second volley right behind the first
const DIAG = [0, 0.25, 0.5], DIAG_DX = 0.42;              // chance of two slanting bullets; their step sideways for every step forward
const BOUNCE = [0, 1, 2];                                 // times a slanting bullet bounces off the edge of the road
const BURN = [0, 0.4, 0.6, 0.8], BURN_T = 2.5;            // fire: extra damage (share of the shot) over 2.5 s
const FREEZE = [0, 0.1, 0.2, 0.3], FREEZE_T = 1.3, SLOW_T = 1.5;   // ice: a hit slows, some freeze; a frozen enemy breaks on the army without harm
const POISON = [0, 2, 3, 4], POISON_DPS = 0.15, POISON_T = 6;        // poison: most stacks; each takes this share of the shot every second
const BOLT_EVERY = [0, 2.0, 1.6, 1.3], BOLT_JUMPS = [0, 3, 4, 5], BOLT_DMG = 1.2, BOLT_RANGE = 16, BOLT_HOP = 2.8;   // lightning jumping from enemy to enemy
const BOOM = [0, 0.12, 0.2, 0.3], BOOM_R = 1.0, BOOM_DMG = 1.2;    // a beaten enemy may blow up and hurt the ones next to it (a big one always does)
// At the monster: more bullets hit harder, fire, poison and lightning add some, ice softens its blow
const BOSS_FIRE = [0, 0.1, 0.18, 0.25], BOSS_POISON = [0, 0.1, 0.18, 0.25], BOSS_BOLT = [0, 0.08, 0.14, 0.2], BOSS_ICE = [0, 0.12, 0.22, 0.3];
const bossMul = k => FRONT[k.front] * FRONT_RATE[k.front] * (1 + MULTI[k.multi]) * (1 + 0.5 * DIAG[k.diag]) * (1 + 0.06 * k.pierce + 0.05 * k.bounce)
  * (1 + BOSS_FIRE[k.fire] + BOSS_POISON[k.poison] + BOSS_BOLT[k.bolt]);
// Gold: mostly for stars, and for the chest after the monster. The best result of every game counts, so playing a game again
// pays only for new stars and a better chest (and a little for every right answer). Higher levels pay more.
const GOLD = { star: [0, 40, 75, 100], chest: [0, 15, 35, 50, 70], brute: 1 };
const lvlMul = c => 1 + 0.25 * c;
const starGold = (c, n) => Math.round(GOLD.star[n] * lvlMul(c) / 5) * 5;
const chestGold = (c, t) => Math.round(GOLD.chest[t] * lvlMul(c) / 5) * 5;
const answerGold = c => 1 + (c >> 1);
const PIERCE = [2, 3, 3, 4, 5];     // how many enemies one shot of each weapon can hit
const shotDmg = g => WEAPONS[g.weapon].dmg * (g.giant ? POWERS.giant.dmg : 1);
const shotRate = g => WEAPONS[g.weapon].rate * (g.turbo ? POWERS.turbo.rate : 1) * (1 + RATE_PER * g.kit.rate);
const firePower = g => shotDmg(g) * shotRate(g) * bossMul(g.kit);       // how hard one soldier hits the monster

// The game is tuned for a player who collected this share of all the gold so far and spent it in the armoury
// (cheapest upgrade first): with less gold it is harder, with more easier. Right answers always win.
const EXPECT = 0.8, ANSWERS = 14;
let KIT_PLAN = null;
function expectedKit(c, s) {
  if (!KIT_PLAN) {
    KIT_PLAN = [];
    const kit = { ...KIT0 }; let gold = 0;
    for (let cc = 0; cc < Z.KLASY.length; cc++) for (let ss = 0; ss < STAGES; ss++) {
      for (;;) {
        let best = null;
        for (const k of SKILL_KEYS) if (canBuy(kit, k, cc) && (!best || SKILLS[k].prices[kit[k]] < SKILLS[best].prices[kit[best]])) best = k;
        if (!best || SKILLS[best].prices[kit[best]] > gold) break;
        gold -= SKILLS[best].prices[kit[best]]; kit[best]++;
      }
      KIT_PLAN.push({ ...kit });
      gold += EXPECT * (starGold(cc, 3) + chestGold(cc, 4) + answerGold(cc) * ANSWERS);
    }
  }
  return KIT_PLAN[c * STAGES + s];
}
// can the next level of this upgrade be bought on level c (counted from 0)?
const canBuy = (kit, k, c) => kit[k] < maxLv(k) && SKILLS[k].from <= c + 1 && (!SKILLS[k].needs || kit[SKILLS[k].needs] > 0);
// How much stronger the enemies are than in the first game (all their lives together), so that the expected armoury
// loses as many soldiers to them as an army without upgrades in the first games. Measured by narzedzia/balans.js
// (run it again after changing upgrades or prices): [game number counted from 0 over all levels, strength].
const ENEMY_P = [[0, 1], [4, 1.04], [14, 2.04], [24, 3.2], [34, 3.34], [44, 3.36], [54, 5.12], [64, 6.17], [74, 5.36], [84, 6.06], [94, 9.02], [104, 11.95], [114, 13.83], [124, 16.88], [134, 17.69], [144, 15.83], [154, 16.01], [164, 18.75], [174, 20.12], [184, 18.86], [194, 18.11], [204, 19.65], [214, 21.21], [224, 20.71], [234, 22.61], [244, 27.27], [254, 28.08], [264, 25.57], [274, 25.87], [284, 28.58], [294, 28.08], [304, 25.87], [314, 24.98]];
let scaleHook = null;     // only for the balance tests
function enemyScale(c, s) {
  if (scaleHook) return scaleHook(c, s);
  const G = c * STAGES + s, T = ENEMY_P;
  if (G >= T[T.length - 1][0]) return T[T.length - 1][1];
  let i = 0; while (T[i + 1][0] < G) i++;
  const [g0, p0] = T[i], [g1, p1] = T[i + 1], f = (G - g0) / (g1 - g0);
  return Math.exp(Math.log(p0) + f * (Math.log(p1) - Math.log(p0)));
}
// the growth comes as more enemies (up to 1.7 times as many) and the rest as more lives
const foeSplit = P => { const n = Math.min(1.7, Math.pow(P, 0.3)); return [n, P / n]; };

/* ============================================================
   Simulation (no drawing here, so it can be tested without a browser)
   ============================================================ */
const CAP = 150;          // most soldiers shown in one group
const ROAD = 4;           // half width of the lanes
const XMAX = 3.2;         // how far the army centre can go sideways
const FORM = 0.27;        // spacing of the formation
const FIGHT_DIST = 11;    // the army stops this far in front of the monster
// The fight goes in rounds: every answer (or a run-out clock) is one round.
// The army fires (each soldier hits with the fire power of its weapon), then the monster strikes back.
// Speed does not matter, only whether the answer is right.
const ATK_FRAC = 0.075;   // the monster's blow kills this share of the expected army, never more than the smallest reward,
                          // so a right answer always brings at least as many soldiers as the blow takes
const ROUNDS = 6;         // monster life ≈ this many volleys of the expected army
const BLAST_SHARE = 0.15; // the fireball after a wrong answer takes at least this share of the army
const HP_K = 1.8;         // monster strength: with every gate right and fight answers at random it wins about 1 time in 3
const OX = new Float32Array(CAP), OZ = new Float32Array(CAP);
for (let i = 0; i < CAP; i++) { const r = FORM * Math.sqrt(i + 0.35), t = i * 2.39996; OX[i] = Math.cos(t) * r; OZ[i] = Math.sin(t) * r * 0.9; }
const radius = n => FORM * Math.sqrt(clamp(n, 1, CAP)) + 0.3;
// A big army marches as a narrower column, so it is clear which gate it takes
const squeeze = n => Math.min(1, 1.9 / (FORM * Math.sqrt(clamp(n, 1, CAP))));
// Things to shoot at the side of the road; each has a number of hits it needs
const PROP_W = { cage: 0.75, crate: 0.7, bridge: 0.95 }, BRIDGE_L = 6;
const RANGE = 26;         // how far a shot flies

function makeGroup(n, scale) {
  const men = [];
  for (let i = 0; i < Math.min(n, CAP); i++) men.push({ ox: OX[i] * scale, oz: OZ[i] * scale, ph: Math.random() * 4, hp: 1, max: 1 });
  return men;
}
// No learning by heart: a problem never comes twice in one game, and the problems of the last two games of the same stage
// are avoided too (the right gate's side is drawn anew for every gate)
const RECENT = new Map(), probKey = p => `${p.q}|${p.sub || ''}|${p.a}`;
function freshProblem(g) {
  const recent = RECENT.get(`${g.cls}-${g.trial ? 'proba' : g.s}`) || [], seen = k => g.used.has(k) || recent.some(set => set !== g.used && set.has(k));
  let p = g.gen();
  for (let tries = 0; tries < 40 && seen(probKey(p)); tries++) p = g.gen();
  for (let tries = 0; tries < 20 && g.used.has(probKey(p)); tries++) p = g.gen();   // a small pool: at least not twice in this game
  g.used.add(probKey(p));
  return p;
}

// kit: the levels of the armoury upgrades (bought ones plus the ones from the last chest); trial: "gra na próbę"
// with the expected armoury of the middle of the level instead of the player's own
function createGame(cls, s, attract, kit, trial, lazy) {
  if (trial) { s = TRIAL_S; kit = expectedKit(cls, s + 1); }
  const cfg = stageConfig(cls, s, trial);
  kit = { ...KIT0, ...(kit || {}) };
  for (const k of SKILL_KEYS) kit[k] = clamp(kit[k] | 0, 0, maxLv(k));
  const g = {
    cls, s, cfg, kit, attract: !!attract, trial: !!trial, time: 0, state: 'run', endAt: 0, gen: cfg.info.gen, used: new Set(), world: worldOf(cls, s),
    army: { x: 0, tx: 0, z: 0, n: attract ? 40 : cfg.start + ARMY_PER * kit.army, born: new Float32Array(CAP).fill(-10) },
    gates: [], squads: [], live: [], props: [], obst: [], bullets: [], blasts: [], hits: [], monster: null, fight: null, finishZ: 1e9,
    fire: 0, boltT: 0, correct: 0, answered: 0, mistakes: [], events: [], gold: 0, goldPer: trial ? 0 : answerGold(cls),
    weapon: kit.weapon, giant: false, turbo: false,
  };
  if (attract) return g;
  // enemies do not follow the player's armoury: they are as strong as the armoury expected at this game
  const [nK, hpK] = foeSplit(enemyScale(cls, s));
  g.hpK = hpK;
  const key = `${cls}-${trial ? 'proba' : s}`, rec = RECENT.get(key) || [];
  RECENT.set(key, [g.used, ...rec].slice(0, 3));          // this game and the two before it
  let z = 6;
  for (let k = 0; k < cfg.gates; k++) {
    z += k ? cfg.spacing : cfg.first;
    g.gates.push({ z, p: freshProblem(g), r: randi(cfg.rLo, cfg.rHi), left: Math.random() < 0.5, done: false, choseLeft: false, ok: false, t: 0,
      showZ: k ? z - cfg.speed * cfg.think : -1e9, shown: k === 0, showAt: 0 });
  }
  const tail = Math.max(42, cfg.speed * (cfg.lead + cfg.zone + 2.5));
  const avgR = (cfg.rLo + cfg.rHi) / 2, d = Math.floor(s / 10);
  // Between two gates (and after the last one): first the reward, then enemies and obstacles
  const kinds = ['cage', 'crate'];
  if (cfg.bridges) kinds.push('bridge');
  while (kinds.length < cfg.gates) kinds.push(kinds.length % 2 ? 'crate' : 'cage');
  for (let k = 0; k < cfg.gates; k++) {
    const gt = g.gates[k], z0 = gt.z, end = k + 1 < cfg.gates ? g.gates[k + 1].showZ : z0 + tail - FIGHT_DIST - 4;
    const side = gt.left ? -1 : 1;                     // the side of the right answer: the reward is waiting there
    if (k < cfg.gates - 1 || cfg.gates === 1) {
      const kind = kinds[k], hp = Math.round((avgR * { cage: 0.6, crate: 0.75, bridge: 1.1 }[kind] + randi(1, 3)) * hpK);
      const prop = { kind, x: side * (kind === 'bridge' ? 3.0 : 2.7), z: z0 + cfg.speed * 0.8 + (kind === 'bridge' ? 5 : 4), hp, max: hp, hit: -1, done: false, doneAt: 0 };
      if (kind === 'cage') prop.reward = randi(cfg.rLo, cfg.rHi);
      if (kind === 'bridge') prop.power = Math.random() < 0.5 ? 'giant' : 'turbo';
      g.props.push(prop);
    }
    // enemies show up a moment after the gate, ahead of the army, and walk against it
    const wake = z0 + cfg.speed * cfg.lead;
    for (let j = 0; j < cfg.squadsPer; j++) {
      const kind = pick(cfg.foes), F = FOES[kind];
      const n = Math.max(3, Math.round(avgR * cfg.enemyMul / cfg.squadsPer * F.n * nK) + randi(0, 2));
      // waves one after another through the whole stretch, each from its own spot
      const ahead = 18 + rand(0, 6), w0 = wake + j * cfg.speed * cfg.zone * 0.8 / cfg.squadsPer, sz = w0 + ahead;
      const sq = { kind, x: rand(-2.6, 2.6), z: sz, wake: w0, men: makeGroup(n, kind === 'ant' ? 0.85 : 1.0), active: false, span: k, ph: rand(0, 6) };
      for (const m of sq.men) { m.hp = m.max = F.hp * hpK; }
      if (cfg.brutes && Math.random() < 0.7) {           // a big one walks in front of the horde
        const hp = Math.round((Math.round(cfg.foeBase * 0.35) + randi(2, 4)) * BIG_HP[kind] * hpK);
        sq.men.unshift({ ox: 0, oz: -0.9, ph: Math.random() * 4, hp, max: hp, big: true });
      }
      g.squads.push(sq);
    }
    // obstacles in the second half of the enemy stretch, never two on the same spot
    const nObst = cfg.obstPer ? Math.floor(cfg.obstPer + Math.random() * 0.999 * (cfg.obstPer % 1 ? 1 : 0)) : 0;
    const from = wake + 9, to = end - 3;
    for (let i = 0; i < nObst && to > from; i++) {
      const type = pick(cfg.obstacles), oz = nObst > 1 ? from + (to - from) * (i + 0.5) / nObst : rand(from, to), os = Math.random() < 0.5 ? -1 : 1;
      const o = { type, side: os, z: oz, span: k, hit: false };
      if (CAR[type]) Object.assign(o, { x: os * (CAR_X0 + CAR_X1) / 2, len: CAR[type].len });
      else if (type === 'hammer') Object.assign(o, { x: os * 1.7, len: 1.2, off: rand(0, HAMMER_P), lastHit: -1 });
      else Object.assign(o, { x: os * 1.9, len: 0.8, barrels: [os * 1.2, os * 2.5].map(bx => ({ x: bx, hp: (2 + d) * hpK, max: (2 + d) * hpK, hit: -1, done: false })) });
      g.obst.push(o);
    }
  }
  z = g.gates[cfg.gates - 1].z;
  g.monster = { x: 0, z: z + tail, hp: 1, max: 1, kind: cls, atkK: 2, anim: -9, hit: -9, dead: false, deadAt: 0 };
  g.finishZ = g.monster.z + 6;
  // Monster strength follows what a player with the expected armoury would bring with every gate right (a few quick test
  // runs of this very stage). The player's own armoury does not change it: a stronger army beats it in fewer rounds.
  // In the browser this is worked out bit by bit (while the card before the game is shown, then during the run).
  g.calib = { kit: trial ? kit : expectedKit(cls, s), runs: [], sim: null };
  if (!lazy) calibrate(g, Infinity);
  return g;
}
const CALIB_RUNS = 3, CALIB_DT = 1 / 15;
// Advances the test runs by at most this many steps; true when the monster is ready
function calibrate(g, steps) {
  const C = g.calib;
  if (!C) return true;
  while (C.runs.length < CALIB_RUNS && steps > 0) {
    if (!C.sim) C.sim = perfectSim(g, C.kit);
    const sim = C.sim;
    for (; steps > 0 && sim.state === 'run' && sim.time < 600; steps--) { sim.army.tx = autoSteer(sim); step(sim, CALIB_DT); sim.events.length = 0; }
    if (sim.state !== 'run' || sim.time >= 600) { C.runs.push({ n: sim.army.n, power: firePower(sim) }); C.sim = null; }
  }
  if (C.runs.length < CALIB_RUNS) return false;
  let N0 = 0, NP0 = 0;
  for (const r of C.runs) { N0 += r.n / CALIB_RUNS; NP0 += r.n * r.power / CALIB_RUNS; }
  N0 = Math.max(12, N0); NP0 = Math.max(12, NP0);
  const atkK = clamp(Math.round(N0 * ATK_FRAC), 2, g.cfg.rLo);
  const hp = Math.max(60, Math.round(HP_K * ROUNDS * NP0 / 10) * 10);
  Object.assign(g.monster, { hp, max: hp, atkK });
  g.calib = null;
  return true;
}

// A copy of the stage to be played with every gate right and the given armoury, steering to the things at the side of the road
// between gates (the army and its fire power at the monster set the monster's strength)
function perfectSim(g, kit) {
  return {
    ...g, calib: null, time: 0, state: 'run', events: [], bullets: [], blasts: [], hits: [], fight: null, fire: 0, boltT: 0, correct: 0, answered: 0, mistakes: [], gold: 0,
    kit, weapon: kit.weapon, giant: false, turbo: false,
    army: { x: 0, tx: 0, z: 0, n: g.cfg.start + ARMY_PER * kit.army, born: new Float32Array(CAP) },
    gates: g.gates.map(x => ({ ...x })), props: g.props.map(b => ({ ...b })), monster: { ...g.monster },
    squads: g.squads.map(q => ({ ...q, men: q.men.map(m => ({ ...m })) })),
    obst: g.obst.map(o => ({ ...o, barrels: o.barrels && o.barrels.map(b => ({ ...b })) })),
  };
}

// How a careful player steers: the right gate when its problem is close, otherwise shoot the reward,
// face the enemies and keep away from burning cars, hammers and fire
function autoSteer(g) {
  const a = g.army, gt = g.gates.find(x => !x.done);
  if (gt && gt.shown && gt.z - a.z < g.cfg.speed * 2.2) return gt.left ? -1.9 : 1.9;
  const danger = g.obst.find(o => !o.hit && o.z + o.len > a.z - 0.5 && o.z - a.z < 9 && !(o.type === 'barrels' && o.barrels.every(b => b.done)));
  if (danger) return -danger.side * 1.9;
  const p = g.props.find(q => !q.done && q.z + (q.kind === 'bridge' ? BRIDGE_L : 0) > a.z - 1 && q.z - a.z < 30);
  if (p) return p.z - a.z > 3.5 ? p.x * 0.85 : -Math.sign(p.x) * 1.6;
  const sq = g.squads.find(q => q.active && q.men.length && q.z > a.z);
  return sq ? clamp(sq.x, -1.9, 1.9) : a.tx;
}
function grow(g, k) {
  const a = g.army;
  for (let i = a.n; i < Math.min(a.n + k, CAP); i++) a.born[i] = g.time;
  a.n += k;
}
function propDone(g, p) {
  p.done = true; p.doneAt = g.time;
  if (p.kind === 'cage') { grow(g, p.reward); g.events.push({ type: 'cage', x: p.x, z: p.z, n: p.reward }); }
  else if (p.kind === 'crate') {
    if (g.weapon < MAX_WEAPON) { g.weapon++; g.events.push({ type: 'weapon', x: p.x, z: p.z, name: WEAPONS[g.weapon].name }); }
    else { grow(g, 10); g.events.push({ type: 'cage', x: p.x, z: p.z, n: 10 }); }
  } else {
    g[p.power] = true;
    g.events.push({ type: 'power', x: p.x, z: p.z + BRIDGE_L, name: POWERS[p.power].name, power: p.power });
  }
}

// An enemy is beaten (by a shot, fire, poison, lightning or a blast); with "wybuchający wrogowie" it may blow up
function killMan(g, s, j) {
  const m = s.men[j], mx = s.x + m.ox, mz = s.z + m.oz;
  s.men.splice(j, 1);
  if (m.big) g.gold += g.goldPer && GOLD.brute;
  g.events.push({ type: 'kill', x: mx, z: mz, big: !!m.big, kind: s.kind });
  const p = BOOM[g.kit.boom];
  if (p && (m.big || Math.random() < p)) g.blasts.push({ x: mx, z: mz, r: m.big ? BOOM_R * 1.6 : BOOM_R });
}
// A hit by a shot: the damage, then fire, poison and ice stick to the enemy
function hitMan(g, s, j, dmg) {
  const m = s.men[j], K = g.kit, t = g.time;
  m.hp -= dmg; m.hit = t;
  if (m.hp <= 0) { killMan(g, s, j); return; }
  if (K.fire) { m.burn = t + BURN_T; m.bd = BURN[K.fire] * dmg / BURN_T; }
  if (K.poison) { m.ps = Math.min(POISON[K.poison], (m.pt > t ? m.ps : 0) + 1); m.pt = t + POISON_T; m.pd = POISON_DPS * dmg; }
  if (K.ice) { m.slow = t + SLOW_T; if (Math.random() < FREEZE[K.ice]) m.frz = t + FREEZE_T; }
}
// Blasts of beaten enemies (one may set off the next); a few per step at most
function blasts(g) {
  for (let n = 0; n < 40 && g.blasts.length; n++) {
    const B = g.blasts.shift(), dmg = BOOM_DMG * shotDmg(g);
    g.events.push({ type: 'boom', x: B.x, z: B.z, r: B.r });
    for (const s of g.squads) {
      if (!s.active || Math.abs(s.z - B.z) > B.r + 4) continue;
      for (let j = s.men.length - 1; j >= 0; j--) {
        const m = s.men[j];
        if (Math.hypot(s.x + m.ox - B.x, s.z + m.oz - B.z) < B.r) { m.hp -= dmg; m.hit = g.time; if (m.hp <= 0) killMan(g, s, j); }
      }
    }
  }
  g.blasts.length = 0;
}
// The electric gun: a lightning bolt hits the nearest enemy ahead and jumps on to the next ones
function lightning(g) {
  const a = g.army, K = g.kit;
  let s0 = null, m0 = null, best = BOLT_RANGE;
  for (const s of g.squads) {
    if (!s.active) continue;
    for (const m of s.men) { const dz = s.z + m.oz - a.z; if (dz > 0.5 && dz < best && Math.abs(s.x + m.ox - a.x) < 4) { best = dz; s0 = s; m0 = m; } }
  }
  if (!m0) return false;
  const chain = [[s0, m0]], pts = [[a.x, a.z + 0.6]];
  let px = s0.x + m0.ox, pz = s0.z + m0.oz; pts.push([px, pz]);
  while (chain.length < BOLT_JUMPS[K.bolt]) {
    let ns = null, nm = null, nd = BOLT_HOP;
    for (const s of g.squads) {
      if (!s.active || Math.abs(s.z - pz) > BOLT_HOP + 3) continue;
      for (const m of s.men) { if (chain.some(c => c[1] === m)) continue; const d = Math.hypot(s.x + m.ox - px, s.z + m.oz - pz); if (d < nd) { nd = d; ns = s; nm = m; } }
    }
    if (!nm) break;
    chain.push([ns, nm]); px = ns.x + nm.ox; pz = ns.z + nm.oz; pts.push([px, pz]);
  }
  g.events.push({ type: 'bolt', pts });
  const dmg = BOLT_DMG * shotDmg(g);
  for (const [s, m] of chain) { const j = s.men.indexOf(m); if (j >= 0) { m.hp -= dmg; m.hit = g.time; if (m.hp <= 0) killMan(g, s, j); } }
  return true;
}
// One volley: bullets side by side; sometimes a second volley right behind it and two slanting bullets
function shoot(g, x, z, vx) {
  const K = g.kit;
  g.bullets.push({ x: clamp(x, -ROAD + 0.2, ROAD - 0.2), z, vx, d: 0, pierce: PIERCE[g.weapon] + K.pierce, id: 0,
    bounce: vx ? BOUNCE[K.bounce] : 0, range: vx ? RANGE * (1 + 0.3 * BOUNCE[K.bounce]) : RANGE,
    el: K.fire || K.ice || K.poison ? pick(['fire', 'ice', 'poison'].filter(e => K[e])) : null });   // the colour shows one of its powers
}
function volleyAt(g, x, z) {
  const n = FRONT[g.kit.front];
  for (let k = 0; k < n; k++) shoot(g, x + (k - (n - 1) / 2) * 0.32, z, 0);
}
// A shot barrel bursts into flames: enemies close to it burn too
function explodeBarrel(g, o, br) {
  br.done = true;
  g.events.push({ type: 'barrel', x: br.x, z: o.z });
  for (const s of g.squads) {
    if (!s.active) continue;
    for (let j = s.men.length - 1; j >= 0; j--) {
      const m = s.men[j];
      if (Math.hypot(s.x + m.ox - br.x, s.z + m.oz - o.z) < 1.6 && !m.big) killMan(g, s, j);
    }
  }
}
// A bullet hits everything in its way during this step (as many enemies as it can pierce), so the result does not
// depend on how many steps a second the phone makes
let bulletId = 0;
function bulletHit(g, b, zPrev) {
  const lo = zPrev - 0.25, hi = b.z + 0.25, dmg = shotDmg(g);
  if (!b.id) b.id = ++bulletId;
  let hit = false;
  for (const s of g.live) {
    if (s.z < lo - 3 || s.z > hi + 3) continue;
    const w = FOES[s.kind].w;
    for (let j = s.men.length - 1; j >= 0; j--) {
      const m = s.men[j], mx = s.x + m.ox, mz = s.z + m.oz;
      if (m.hb !== b.id && mz >= lo && mz <= hi && Math.abs(mx - b.x) < (m.big ? w * 2 : w)) {
        m.hb = b.id; hit = true;
        hitMan(g, s, j, dmg);
        if (--b.pierce <= 0) return true;
      }
    }
  }
  if (hit) return false;
  for (const o of g.obst) {
    if (o.type !== 'barrels' || o.z > hi || o.z + o.len < lo) continue;
    for (const br of o.barrels) {
      if (br.done || Math.abs(br.x - b.x) > BARREL_W) continue;
      br.hp -= dmg; br.hit = g.time;
      if (br.hp <= 0) explodeBarrel(g, o, br);
      return true;
    }
  }
  for (const p of g.props) {
    const len = p.kind === 'bridge' ? BRIDGE_L : 0.4;
    if (!p.done && p.hp > 0 && p.z <= hi && p.z + len >= lo && Math.abs(p.x - b.x) < PROP_W[p.kind]) {
      p.hp = Math.max(0, p.hp - dmg); p.hit = g.time;
      if (p.hp <= 0 && g.state === 'run') propDone(g, p);
      return true;
    }
  }
  const M = g.monster;
  if (M && !M.dead && hi >= M.z - 1.4) { M.hit = g.time; g.events.push({ type: 'spark', x: b.x, z: M.z - 1.4 }); return true; }
  return false;
}

function startFight(g) {
  g.state = 'fight';
  g.army.tx = 0;
  g.fight = { p: null, r: 0, left: true, done: true, next: g.time + 1.6, deadline: 0, shownAt: 0, count: 0, volleyUntil: 0 };
  g.events.push({ type: 'fight' });
}
function nextFightProblem(g) {
  const f = g.fight;
  f.p = freshProblem(g); f.r = randi(g.cfg.rLo, g.cfg.rHi); f.left = Math.random() < 0.5;
  f.done = false; f.shownAt = g.time; f.deadline = g.time + g.cfg.think; f.count++;
  g.events.push({ type: 'fightProblem' });
}
// left: true / false = the button picked; null = time ran out
function answerFight(g, left) {
  const f = g.fight;
  if (!f || !f.p || f.done || g.state !== 'fight') return;
  f.done = true; f.next = g.time + 1.9; f.volleyUntil = g.time + 0.6; g.answered++;
  const ok = left === f.left, t = g.time, M = g.monster;
  if (ok) { g.correct++; g.gold += g.goldPer; grow(g, f.r); }
  else g.mistakes.push({ q: f.p.q, a: f.p.a, w: left === null ? null : f.p.w, sol: f.p.sol, ask: f.p.ask });
  // The round: army volley, then the monster's blow (and a fireball after a wrong answer)
  // (frost from the ice bullets softens the blow)
  g.hits.push({ at: t + 0.6, kind: 'volley' }, { at: t + 0.65, kind: 'growl', fire: !ok }, { at: t + 1.2, kind: 'stomp', n: Math.round(M.atkK * (1 - BOSS_ICE[g.kit.ice])) });
  if (!ok) g.hits.push({ at: t + 1.2, kind: 'blast', n: Math.max(f.r, Math.round(BLAST_SHARE * g.army.n)) });   // a big army feels it too
  g.events.push({ type: 'fightAnswer', ok, timeout: left === null, p: f.p, r: f.r });
}

function step(g, dt) {
  g.time += dt;
  const a = g.army, ev = g.events, M = g.monster;
  if (g.attract) a.tx = Math.sin(g.time * 0.55) * 2.2;
  a.x += (clamp(a.tx, -XMAX, XMAX) - a.x) * Math.min(1, dt * 14);
  let sp = g.cfg.speed;
  if (g.state === 'fight' || g.state === 'lost') sp = 0;
  if (g.state === 'won') sp = a.z < g.finishZ + 6 ? g.cfg.speed * 0.7 : 0;
  a.z += sp * dt;
  if (g.state === 'run' && M && a.z >= M.z - FIGHT_DIST) { a.z = M.z - FIGHT_DIST; calibrate(g, Infinity); startFight(g); }

  // The next problem appears when the enemies and obstacles after the last gate are behind (or at the latest at its point)
  if (g.state === 'run') {
    const nx = g.gates.find(x => !x.done);
    if (nx && !nx.shown) {
      const k = g.gates.indexOf(nx) - 1;
      const clear = !g.squads.some(q => q.span === k && q.men.length) && !g.obst.some(o => o.span === k && o.z + o.len > a.z);
      if (a.z >= nx.showZ || clear) { nx.shown = true; nx.showAt = a.z; ev.push({ type: 'problem' }); }
    }
  }
  // Gates
  if (g.state === 'run') {
    for (const gt of g.gates) {
      if (gt.done || a.z < gt.z) continue;
      gt.done = true; gt.t = g.time; gt.choseLeft = a.x < 0; gt.ok = gt.choseLeft === gt.left;
      g.answered++;
      if (gt.ok) { g.correct++; g.gold += g.goldPer; grow(g, gt.r); ev.push({ type: 'gate', ok: true, gate: gt, n: gt.r }); }
      else {
        const loss = Math.min(gt.r, a.n - 1);     // a gate never takes the last soldier
        a.n -= loss;
        g.mistakes.push({ q: gt.p.q, a: gt.p.a, w: gt.p.w, sol: gt.p.sol, ask: gt.p.ask });
        ev.push({ type: 'gate', ok: false, gate: gt, n: loss });
      }
    }
  }

  // Shooting (in the fight only during the volley after an answer)
  const volley = g.state === 'fight' && g.time < g.fight.volleyUntil;
  const K = g.kit;
  g.live = g.squads.filter(q => q.active && q.men.length);      // only these can be hit
  if (a.n > 0 && (g.state === 'run' || volley)) {
    g.fire += (volley ? Math.min(40, 8 + a.n / 3) : (5 + 1.8 * Math.sqrt(a.n)) * shotRate(g) * FRONT_RATE[K.front]) * dt;
    const sq = squeeze(a.n);
    while (g.fire >= 1) {
      g.fire -= 1;
      const i = Math.floor(Math.random() * Math.min(a.n, CAP)), x = a.x + OX[i] * sq, z = a.z + OZ[i] + 0.3;
      volleyAt(g, x, z);
      if (K.multi && Math.random() < MULTI[K.multi]) volleyAt(g, x, z - 0.8);
      if (K.diag && Math.random() < DIAG[K.diag]) { shoot(g, x, z, -DIAG_DX); shoot(g, x, z, DIAG_DX); }
    }
  }
  const bv = (30 + sp) * dt, edge = ROAD - 0.15;
  for (let i = g.bullets.length - 1; i >= 0; i--) {
    const b = g.bullets[i], zp = b.z;
    b.z += bv; b.d += bv;
    if (b.vx) {                          // a slanting bullet bounces off the edge of the road, or flies off it
      b.x += b.vx * bv;
      if (Math.abs(b.x) > edge) { if (b.bounce > 0) { b.bounce--; b.vx = -b.vx; b.x = Math.sign(b.x) * 2 * edge - b.x; b.id = 0; } else b.d = 1e9; }
    }
    if (b.d > b.range || bulletHit(g, b, zp)) { g.bullets[i] = g.bullets[g.bullets.length - 1]; g.bullets.pop(); }
  }
  if (g.blasts.length) blasts(g);
  if (K.bolt && g.state === 'run') { g.boltT += dt; if (g.boltT >= BOLT_EVERY[K.bolt] && lightning(g)) g.boltT = 0; }

  // Zombies and the things at the side of the road
  const R = radius(a.n), RX = (R - 0.3) * squeeze(a.n) + 0.5, RZ = R + 0.2;
  const inside = (dx, dz) => (dx / RX) ** 2 + (dz / RZ) ** 2 < 1;
  const running = g.state === 'run';
  for (let si = g.squads.length - 1; si >= 0; si--) {
    const s = g.squads[si], F = FOES[s.kind];
    if (!s.active) { if (running && a.z >= s.wake) { s.active = true; s.born = g.time; ev.push({ type: 'horde', kind: s.kind }); } else continue; }
    if (running) {
      const t = g.time, sx = s.x, step = F.speed * dt;
      s.z -= step;
      const wave = s.kind === 'wasp' ? Math.sin(t * 3.2 + s.ph) * 1.6 : s.kind === 'snake' ? Math.sin(t * 2.4 + s.ph) * 0.8 : 0;
      s.x = clamp(s.x + (clamp(a.x - s.x, -1, 1) * 0.9 + wave) * dt, -3.4, 3.4);
      for (let j = s.men.length - 1; j >= 0; j--) {
        const m = s.men[j];
        // fire and poison keep hurting; a frozen enemy stands still, a cold one walks at half speed
        const dot = (m.burn > t ? m.bd : 0) + (m.pt > t ? m.ps * m.pd : 0);
        if (dot) { m.hp -= dot * dt; if (m.hp <= 0) { killMan(g, s, j); continue; } }
        const hold = m.frz > t ? 1 : m.slow > t ? 0.5 : 0;
        if (hold) { m.oz += step * hold; m.ox -= (s.x - sx) * hold; }
        const dx = s.x + m.ox - a.x, dz = s.z + m.oz - a.z;
        // a big one takes several soldiers; on the road the last soldier always survives, so the monster is always reached
        const k = Math.min(a.n - 1, m.big ? Math.min(4, Math.ceil(m.hp)) : F.dmg);
        const touch = inside(dx, dz) && a.n > 0, past = dz < -RZ - 0.4;
        if ((touch || past) && m.frz > t) { s.men.splice(j, 1); ev.push({ type: 'shatter', x: a.x + dx, z: a.z + dz }); }   // a frozen one breaks without harm
        else if (touch) { s.men.splice(j, 1); a.n -= k; ev.push({ type: 'clash', x: a.x + dx, z: a.z + dz, big: !!m.big, n: k, kind: s.kind }); }
        else if (past) { s.men.splice(j, 1); a.n -= Math.max(0, k); ev.push({ type: 'leak', x: a.x + dx, z: a.z + dz, n: Math.max(0, k), kind: s.kind }); }   // got past the army
      }
    }
    if (!s.men.length) g.squads.splice(si, 1);
  }
  // Obstacles: a burning bus or lorry, a hammer falling from above, burning barrels
  if (running) {
    for (const o of g.obst) {
      if (o.hit || a.z < o.z - RZ * 0.7 || a.z > o.z + o.len + RZ * 0.5) continue;
      let hurt = false;
      if (CAR[o.type]) hurt = Math.abs(a.x - o.x) < (CAR_X1 - CAR_X0) / 2 + RX * 0.55 - 0.3;
      else if (o.type === 'hammer') { const ph = (g.time + o.off) % HAMMER_P; hurt = ph < 0.32 && ph > 0.06 && Math.abs(a.x - o.x) < HAMMER_W + RX * 0.55 - 0.2; }
      else for (const br of o.barrels) if (!br.done && Math.abs(a.x - br.x) < BARREL_W + RX * 0.6 - 0.2) { hurt = true; br.done = true; ev.push({ type: 'barrel', x: br.x, z: o.z }); }
      if (hurt) {
        const k = Math.min(g.cfg.hurt + (CAR[o.type] ? 2 : 0), a.n - 1);
        if (o.type !== 'barrels') o.hit = true;
        a.n -= k; ev.push({ type: 'trap', kind: o.type, x: o.type === 'barrels' ? a.x : o.x, z: o.z, n: k });
      }
    }
  }
  for (const p of g.props) {
    if (p.done || !running) continue;
    const len = p.kind === 'bridge' ? BRIDGE_L : 0;
    if (a.z > p.z - R * 0.8 - 0.4 && a.z < p.z + len + 0.4 && Math.abs(p.x - a.x) < RX + PROP_W[p.kind] - 0.4) {
      const loss = Math.min(p.kind === 'bridge' ? 6 : 5, a.n - 1);   // ran into it (or into the hole) before it was shot open
      p.done = true; p.doneAt = g.time; p.lost = true; a.n -= loss;
      ev.push({ type: 'smash', x: p.x, z: p.z, n: loss, kind: p.kind });
    }
  }

  // Monster fight
  if (g.state === 'fight') {
    const f = g.fight;
    if (f.p && !f.done && g.time >= f.deadline) answerFight(g, null);
    if (f.done && g.time >= f.next && M.hp > 0) nextFightProblem(g);
  }
  while (g.hits.length && g.hits[0].at <= g.time) {
    const h = g.hits.shift();
    if (g.state !== 'fight') continue;
    if (h.kind === 'volley') {
      const dmg = Math.min(M.hp, Math.round(a.n * firePower(g)));
      M.hp -= dmg; M.hit = g.time;
      ev.push({ type: 'volley', n: dmg });
      if (M.hp <= 0) { g.hits.length = 0; break; }     // a beaten monster does not strike back
    } else if (h.kind === 'growl') { M.anim = g.time; ev.push({ type: 'growl', fire: h.fire }); }
    else { const k = Math.min(h.n, a.n); a.n -= k; ev.push({ type: h.kind, n: k }); }
  }

  // End of the stage
  if (g.state === 'fight' && M.hp <= 0) {
    M.dead = true; M.deadAt = g.time;
    if (a.n < 1) a.n = 1;
    g.state = 'won'; g.endAt = g.time + 2.6; ev.push({ type: 'won' });
  } else if ((g.state === 'run' || g.state === 'fight') && a.n <= 0) {
    a.n = 0; g.state = 'lost'; g.endAt = g.time + 3.0; ev.push({ type: 'lost' });
  }
}

if (!HAS_DOM) {
  globalThis.ArmiaLiczb = { STAGES, stageConfig, createGame, step, answerFight, autoSteer, WEAPONS, SKILLS, SKILL_KEYS, KIT0, GOLD, FOES, firePower,
    expectedKit, enemyScale, bossMul, starGold, chestGold, answerGold, canBuy, maxLv, calibrate, setScale: f => { scaleHook = f; }, forget: () => RECENT.clear() };
  return;
}

/* ============================================================
   Saved progress (stays on this phone only)
   ============================================================ */
const KEY = 'armia-liczb-v2';
const NCLS = Z.KLASY.length;
// stars and chest: the best result of every game; boost: upgrades from the last chest for the next game
const save = { stars: new Array(NCLS * STAGES).fill(0), chest: new Array(NCLS * STAGES).fill(0), next: [0, 0], music: true, sfx: true, learn: true, tab: 0,
  gold: 0, arm: { ...KIT0 }, boost: [], skin: 0, skins: [0], ver: 0, start: null, placed: 0 };
try { Object.assign(save, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* storage blocked */ }
if (!Array.isArray(save.stars) || save.stars.length !== NCLS * STAGES) save.stars = new Array(NCLS * STAGES).fill(0);
if (!Array.isArray(save.chest) || save.chest.length !== NCLS * STAGES) save.chest = new Array(NCLS * STAGES).fill(0);
if (!Array.isArray(save.next) || save.next.length !== 2) save.next = [0, 0];
save.placed = clamp(Math.floor(+save.placed || 0), 0, NCLS - 1);     // levels opened by the selection or an exam
save.gold = Math.max(0, Math.floor(+save.gold || 0));
// upgrades bought before version 14 stay ("Siła ognia" is now "Szybkie strzelanie")
const oldArm = save.arm || {};
if (oldArm.rate === undefined && oldArm.power !== undefined) oldArm.rate = oldArm.power;
save.arm = Object.fromEntries(SKILL_KEYS.map(k => [k, clamp(Math.floor(+oldArm[k] || 0), 0, maxLv(k))]));
save.boost = Array.isArray(save.boost) ? save.boost.filter(b => b && SKILLS[b.k] && b.n > 0).slice(0, 3) : [];
// from version 14 stars pay much better: the stars won before get their gold once
if (!(save.ver >= 14)) {
  save.gold += save.stars.reduce((t, n, i) => t + starGold(Math.floor(i / STAGES), n | 0), 0);
  save.ver = 14;
}
if (!Array.isArray(save.skins)) save.skins = [0];
if (!save.skins.includes(save.skin)) save.skin = 0;
// music is no longer chosen by the player: every game draws one of the styles (an old "off" setting is kept)
if (save.musicStyle === 'off') save.music = false;
delete save.musicStyle;
save.music = save.music !== false;
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* storage blocked */ } };
const starsOf = (c, s) => save.stars[c * STAGES + s];
const gamesDone = c => save.stars.slice(c * STAGES, (c + 1) * STAGES).filter(x => x > 0).length;
// A level opens when every game of the level before it is passed, or by the selection at the start or a passed exam
// (levels already played before version 14 stay open); in a level the games open one after another.
// "Gra na próbę" can be played in every level; in a closed one it is the exam.
const levelOpen = c => c === 0 || c <= save.placed || gamesDone(c - 1) === STAGES || gamesDone(c) > 0;
const unlocked = (c, s) => levelOpen(c) && (s === 0 || starsOf(c, s - 1) > 0 || starsOf(c, s) > 0);
// the game after this one, or the first one still to pass
function nextGame(c, s) {
  if (s + 1 < STAGES && unlocked(c, s + 1)) return [c, s + 1];
  for (let cc = 0; cc < NCLS; cc++) for (let ss = 0; ss < STAGES; ss++) if (unlocked(cc, ss) && !starsOf(cc, ss) && cc >= c) return [cc, ss];
  return [c, s];
}
// the bought upgrades together with the ones from the last chest
const playKit = () => { const k = { ...save.arm }; for (const b of save.boost) k[b.k] = Math.min(maxLv(b.k), k[b.k] + b.n); return k; };
// What a good player (who collects the expected share of all the gold) has earned before the first game of level c
function expectedGold(c) {
  let t = 0;
  for (let cc = 0; cc < c; cc++) t += STAGES * EXPECT * (starGold(cc, 3) + chestGold(cc, 4) + answerGold(cc) * ANSWERS);
  return t;
}
// everything the player owns: gold, bought upgrades and army colours
const wealth = () => save.gold + SKILL_KEYS.reduce((t, k) => t + SKILLS[k].prices.slice(0, save.arm[k]).reduce((a, b) => a + b, 0), 0)
  + save.skins.reduce((t, i) => t + (SKINS[i] ? SKINS[i].price : 0), 0);
// A jump to level c (selection or exam): it and every level below open, and the gold is made up to what a good player
// has at its start, so the enemies there are not too strong; who already has as much gets nothing
function openUpTo(c) {
  const add = Math.max(0, Math.round((expectedGold(c) - wealth()) / 10) * 10);
  save.placed = Math.max(save.placed, c); save.gold += add;
  let s = 0; while (s < STAGES - 1 && starsOf(c, s)) s++;
  if (save.next[0] <= c) save.next = [c, s];
  persist();
  return add;
}

/* ============================================================
   Sound: music and effects are generated, no sound files
   ============================================================ */
const Snd = (() => {
  let ctx = null, master, musicBus, sfxBus, noise, unlocked = false, silent = null;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = save.music ? 0.32 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  // A short silent WAV: playing it through an <audio> element lets iPhone sound play even with the ring switch set to silent
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
    if (ctx.state !== 'running') ctx.resume().then(() => { if (want && !cur && want.style && want.style !== 'retro') play(want.name, want.style, true); }).catch(() => {});
    if (unlocked) return;
    unlocked = true;
    try { const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0); } catch (e) { /* ignore */ }
    if (!navigator.audioSession) {
      try { silent = new Audio(silentWav()); silent.loop = true; silent.setAttribute('playsinline', ''); const p = silent.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
  }
  const live = () => ctx && ctx.state === 'running';

  function env(gn, t, peak, dur) {
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    gn.gain.setValueAtTime(peak, t + Math.max(0.008, dur * 0.55));
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, f, t, dur, vol, dest, f2, lp) {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    let node = o;
    if (lp) { const q = ctx.createBiquadFilter(); q.type = 'lowpass'; q.frequency.value = lp; o.connect(q); node = q; }
    node.connect(gn); gn.connect(dest); env(gn, t, vol, dur);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function hiss(t, dur, vol, dest, type, freq, q) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    s.connect(f); f.connect(gn); gn.connect(dest);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function kick(t, v) {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(gn); gn.connect(musicBus); o.start(t); o.stop(t + 0.26);
  }

  /* ---------- music ---------- */
  // Each bar: chord root (MIDI), chord type and melody notes [step, note, length in 16ths]
  const MAJ = [0, 4, 7], MIN = [0, 3, 7];
  const RUN_A = [
    [48, MAJ, [[0, 76, 2], [2, 79, 2], [4, 84, 2], [6, 79, 2], [8, 76, 2], [10, 79, 2], [12, 81, 2], [14, 79, 2]]],
    [45, MIN, [[0, 76, 2], [2, 81, 2], [4, 84, 2], [6, 81, 2], [8, 76, 2], [10, 81, 2], [12, 83, 2], [14, 81, 2]]],
    [41, MAJ, [[0, 77, 2], [2, 81, 2], [4, 84, 2], [6, 81, 2], [8, 77, 2], [10, 81, 2], [12, 84, 2], [14, 86, 2]]],
    [43, MAJ, [[0, 86, 3], [3, 83, 1], [4, 79, 2], [6, 83, 2], [8, 86, 4], [12, 84, 2], [14, 83, 2]]],
  ];
  const RUN_B = [
    [48, MAJ, [[0, 84, 4], [4, 79, 2], [6, 81, 2], [8, 84, 6], [14, 86, 2]]],
    [45, MIN, [[0, 88, 4], [4, 86, 2], [6, 84, 2], [8, 81, 6], [14, 79, 2]]],
    [41, MAJ, [[0, 81, 4], [4, 84, 2], [6, 81, 2], [8, 77, 4], [12, 79, 2], [14, 81, 2]]],
    [43, MAJ, [[0, 79, 4], [4, 83, 2], [6, 86, 2], [8, 91, 4], [12, 86, 4]]],
  ];
  const FIGHT_A = [
    [45, MIN, [[0, 81, 2], [2, 84, 2], [4, 88, 2], [6, 84, 2], [8, 81, 2], [10, 84, 2], [12, 88, 2], [14, 89, 2]]],
    [41, MAJ, [[0, 89, 2], [2, 84, 2], [4, 81, 2], [6, 84, 2], [8, 89, 4], [12, 88, 2], [14, 86, 2]]],
    [43, MAJ, [[0, 86, 2], [2, 83, 2], [4, 79, 2], [6, 83, 2], [8, 86, 4], [12, 88, 2], [14, 86, 2]]],
    [40, MAJ, [[0, 88, 4], [4, 92, 2], [6, 88, 2], [8, 83, 4], [12, 80, 2], [14, 83, 2]]],
  ];
  const FIGHT_B = [
    [45, MIN, [[0, 93, 4], [4, 91, 2], [6, 89, 2], [8, 88, 4], [12, 84, 4]]],
    [41, MAJ, [[0, 89, 4], [4, 88, 2], [6, 86, 2], [8, 84, 4], [12, 81, 4]]],
    [43, MAJ, [[0, 83, 2], [2, 86, 2], [4, 91, 4], [8, 89, 2], [10, 88, 2], [12, 86, 4]]],
    [40, MAJ, [[0, 88, 2], [2, 80, 2], [4, 83, 2], [6, 88, 2], [8, 92, 6], [14, 88, 2]]],
  ];
  const TRACKS = {
    menu: { bpm: 108, bars: [...RUN_B, ...RUN_A], drums: 'soft', lead: 0.06 },
    run: { bpm: 128, bars: [...RUN_A, ...RUN_B], drums: 'run', lead: 0.075 },
    fight: { bpm: 152, bars: [...FIGHT_A, ...FIGHT_B], drums: 'fight', lead: 0.075 },
  };
  for (const k in TRACKS) for (const bar of TRACKS[k].bars) { const by = []; for (const n of bar[2]) by[n[0]] = n; bar.push(by); }
  let track = null, stepN = 0, nextT = 0, timer = null;
  function playStep(T, st, t, sd) {
    const bar = T.bars[Math.floor(st / 16) % T.bars.length], s = st % 16, root = bar[0];
    const bassNote = root + (T.drums === 'fight' ? (s % 4 === 2 ? 12 : 0) : (s % 4 === 2 ? 12 : s % 8 === 6 ? 7 : 0));
    if (s % 2 === 0) tone('square', mtof(bassNote), t, sd * 1.7, 0.11, musicBus, 0, 700);
    if (T.drums === 'run') {
      if (s === 0 || s === 8 || (s === 10 && (st >> 4) % 2)) kick(t, 0.8);
      if (s === 4 || s === 12) { hiss(t, 0.15, 0.22, musicBus, 'bandpass', 1900, 0.8); tone('triangle', 190, t, 0.07, 0.16, musicBus, 120); }
      if (s % 2 === 0) hiss(t, 0.03, s % 4 === 2 ? 0.1 : 0.05, musicBus, 'highpass', 7500);
    } else if (T.drums === 'fight') {
      if (s % 4 === 0) kick(t, 0.9);
      if (s === 4 || s === 12) { hiss(t, 0.16, 0.26, musicBus, 'bandpass', 1800, 0.8); tone('triangle', 180, t, 0.07, 0.18, musicBus, 110); }
      hiss(t, 0.025, s % 2 ? 0.05 : 0.09, musicBus, 'highpass', 8000);
    } else if (s % 4 === 2) hiss(t, 0.03, 0.04, musicBus, 'highpass', 8000);
    if (s % 4 === 2) for (const iv of bar[1]) tone('triangle', mtof(root + 24 + iv), t, sd * 1.2, 0.028, musicBus);
    const n = bar[3][s];
    if (n) tone('square', mtof(n[1]), t, sd * n[2] * 0.92, T.lead, musicBus, 0, 2600);
  }
  function tick() {
    if (!live() || !track) return;
    const T = TRACKS[track], sd = 60 / T.bpm / 4;
    if (nextT < ctx.currentTime - 0.05) nextT = ctx.currentTime + 0.03;   // came back from a pause
    while (nextT < ctx.currentTime + 0.15) { playStep(T, stepN, nextT, sd); nextT += sd; stepN++; }
  }
  function playSeq(name) {
    if (track === name && timer) return;
    track = name; stepN = 0;
    if (!init()) return;
    nextT = ctx.currentTime + 0.05;
    if (!timer) timer = setInterval(tick, 25);
  }

  /* ---------- recorded music: loops in muzyka/, made by narzedzia/muzyka.py with real instrument sounds ---------- */
  // where the loop starts and ends in every file (printed by narzedzia/muzyka.py)
  const MUSIC_LOOPS = { 'wesola-bieg': [0.5, 33.603424], 'wesola-walka': [0.5, 29.590884],
    'chill-bieg': [0.5, 46.214308], 'chill-walka': [0.5, 41.351066], 'elektro-bieg': [0.5, 33.042404], 'elektro-walka': [0.5, 29.156712],
    'turbo-bieg': [0.5, 30.5], 'turbo-walka': [0.5, 27.928549], 'neon-bieg': [0.5, 28.735261], 'neon-walka': [0.5, 26.1],
    'skok-bieg': [0.5, 27.928549], 'skok-walka': [0.5, 26.1] };
  const buffers = {}, loading = {}, failed = {};
  let cur = null, want = null;
  function loadLoop(file) {
    if (buffers[file]) return Promise.resolve(buffers[file]);
    if (Date.now() - (failed[file] || -1e9) < 60000) return Promise.resolve(null);   // do not ask again at once after a failure
    if (!loading[file]) {
      loading[file] = fetch(`muzyka/${file}.mp3`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej)))
        .then(buf => (buffers[file] = buf)).catch(() => { failed[file] = Date.now(); return null; })
        .finally(() => { delete loading[file]; });
    }
    return loading[file];
  }
  function startLoop(file) {
    const [a, b] = MUSIC_LOOPS[file], t = ctx.currentTime;
    const src = ctx.createBufferSource(), gn = ctx.createGain();
    src.buffer = buffers[file]; src.loop = true; src.loopStart = a; src.loopEnd = b;
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(1, t + 0.5);
    src.connect(gn); gn.connect(musicBus); src.start(t + 0.02, a);
    cur = { file, src, gn };
  }
  function stopLoop() {
    if (!cur) return;
    const { src, gn } = cur, t = ctx.currentTime;
    gn.gain.cancelScheduledValues(t); gn.gain.setValueAtTime(Math.max(0.0001, gn.gain.value), t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    src.stop(t + 0.65); cur = null;
  }
  // name: menu, run or fight; style: wesola, chill, elektro, turbo, neon, skok, retro (the old tunes made in code) or null (off)
  // lesson: the calm music of the practice, kept in memory next to the game's style and played without its pair
  function play(name, style, retry, lesson) {
    want = { name, style };
    if (!style) { track = null; stopLoop(); return; }
    if (style === 'retro') { stopLoop(); playSeq(name); return; }
    track = null;
    const file = `${style}-${name === 'fight' ? 'walka' : 'bieg'}`;
    if (cur && cur.file === file && !retry) return;
    stopLoop();
    if (!init()) return;
    if (!lesson) for (const k in buffers) if (!k.startsWith(style + '-') && k !== LESSON_FILE) delete buffers[k];   // keep only one style in memory (and the practice music)
    loadLoop(file).then(buf => {
      if (!want || want.name !== name || want.style !== style || (cur && cur.file === file)) return;
      if (!buf) { playSeq(name); return; }            // no file (for example offline): the tunes made in code
      if (live()) startLoop(file);
    });
    if (!lesson) loadLoop(`${style}-${name === 'fight' ? 'bieg' : 'walka'}`);
  }
  const LESSON_FILE = 'chill-bieg';
  function stop() { track = null; want = null; stopLoop(); }
  function setMusic(on) { if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.05); }
  function duck(on) { if (musicBus && save.music) musicBus.gain.setTargetAtTime(on ? 0.1 : 0.32, ctx.currentTime, 0.1); }

  /* ---------- effects ---------- */
  const last = {};
  const fx = (name, gap, fn) => () => {
    if (!save.sfx || !live()) return;
    const t = ctx.currentTime;
    if (gap && last[name] && t - last[name] < gap) return;
    last[name] = t; fn(t);
  };
  return {
    unlock, play, stop, setMusic, duck,
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); if (silent) silent.pause(); },
    resume() {
      if (ctx && ctx.state !== 'running' && (save.music || save.sfx)) ctx.resume().catch(() => {});
      if (silent && silent.paused) { const p = silent.play(); if (p && p.catch) p.catch(() => {}); }
    },
    good: fx('good', 0, t => { [84, 88, 91, 96].forEach((m, i) => tone('square', mtof(m), t + i * 0.06, 0.12, 0.12, sfxBus, 0, 4200)); tone('triangle', mtof(96), t + 0.24, 0.32, 0.12, sfxBus); }),
    bad: fx('bad', 0, t => { tone('sawtooth', 330, t, 0.38, 0.15, sfxBus, 105, 1400); hiss(t, 0.25, 0.1, sfxBus, 'lowpass', 900); }),
    pop: fx('pop', 0.05, t => tone('square', rand(480, 760), t, 0.05, 0.035, sfxBus, 190, 3000)),
    shot: fx('shot', 0.085, t => hiss(t, 0.035, 0.035, sfxBus, 'bandpass', 2600, 1.4)),
    coin: fx('coin', 0, t => { tone('square', 988, t, 0.08, 0.08, sfxBus); tone('square', 1319, t + 0.08, 0.26, 0.08, sfxBus); }),
    tap: fx('tap', 0.03, t => tone('triangle', 560, t, 0.05, 0.08, sfxBus)),
    reinforce: fx('reinforce', 0, t => { [72, 76, 79, 84, 88].forEach((m, i) => tone('square', mtof(m), t + i * 0.065, 0.14, 0.09, sfxBus, 0, 3600)); }),
    stomp: fx('stomp', 0.2, t => { tone('sine', 120, t, 0.4, 0.55, sfxBus, 32); hiss(t, 0.32, 0.3, sfxBus, 'lowpass', 420); }),
    hit: fx('hit', 0.1, t => { hiss(t, 0.28, 0.32, sfxBus, 'lowpass', 2400); tone('square', 230, t, 0.14, 0.08, sfxBus, 100, 1600); }),
    boom: fx('boom', 0.2, t => { hiss(t, 0.65, 0.42, sfxBus, 'lowpass', 1300); tone('sine', 95, t, 0.45, 0.42, sfxBus, 30); }),
    growl: fx('growl', 0.5, t => { tone('sawtooth', 95, t, 0.45, 0.09, sfxBus, 70, 600); hiss(t, 0.4, 0.07, sfxBus, 'bandpass', 380, 1.2); }),
    roar: fx('roar', 0, t => {
      const o = tone('sawtooth', 150, t, 1.1, 0.2, sfxBus, 62, 900);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 18; lg.gain.value = 12;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 1.15);
      hiss(t, 1.0, 0.22, sfxBus, 'bandpass', 520, 0.7);
    }),
    win: fx('win', 0, t => { [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => tone('square', mtof(m), t + i * 0.12, i === 6 ? 0.6 : 0.14, 0.12, sfxBus, 0, 3800)); }),
    // A zombie horde comes into view: low, wobbly moan
    groan: fx('groan', 1.5, t => {
      const o = tone('sawtooth', rand(85, 110), t, 0.9, 0.07, sfxBus, 62, 520);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 6; lg.gain.value = 9;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 0.95);
      hiss(t, 0.7, 0.04, sfxBus, 'bandpass', 300, 1.5);
    }),
    thud: fx('thud', 0.12, t => { tone('sine', 160, t, 0.25, 0.4, sfxBus, 45); hiss(t, 0.2, 0.18, sfxBus, 'lowpass', 700); }),
    // Cage broken open: clank and a short cheer
    freed: fx('freed', 0, t => {
      hiss(t, 0.2, 0.25, sfxBus, 'bandpass', 3200, 2); tone('square', 880, t, 0.06, 0.06, sfxBus, 0, 3000);
      [72, 76, 79].forEach((m, i) => tone('triangle', mtof(m), t + 0.08 + i * 0.07, 0.2, 0.12, sfxBus));
    }),
    // New weapon or power: rising sweep and a bright chord
    power: fx('power', 0, t => {
      tone('sawtooth', 220, t, 0.45, 0.08, sfxBus, 1760, 3000);
      [84, 88, 91, 96].forEach(m => tone('square', mtof(m), t + 0.4, 0.45, 0.05, sfxBus, 0, 4000));
    }),
    splash: fx('splash', 0.3, t => { hiss(t, 0.6, 0.35, sfxBus, 'lowpass', 1600); hiss(t + 0.05, 0.4, 0.12, sfxBus, 'highpass', 4000); }),
    // the electric gun: a crackle with a falling buzz
    zap: fx('zap', 0.12, t => { hiss(t, 0.12, 0.2, sfxBus, 'highpass', 5000); tone('square', 1800, t, 0.12, 0.05, sfxBus, 300, 5000); }),
    // a small blast of a beaten enemy
    pof: fx('pof', 0.09, t => { hiss(t, 0.22, 0.2, sfxBus, 'lowpass', 900); tone('sine', 140, t, 0.16, 0.18, sfxBus, 50); }),
    // ice breaking
    ice: fx('ice', 0.07, t => { tone('triangle', rand(2400, 3200), t, 0.08, 0.06, sfxBus, 1600); hiss(t, 0.09, 0.08, sfxBus, 'highpass', 6000); }),
    // the chest: a tick for every answer, a shake and the lid opening with a sparkle
    tick: fx('tick', 0.03, t => tone('square', 1320, t, 0.04, 0.05, sfxBus, 0, 5000)),
    shake: fx('shake', 0.1, t => { hiss(t, 0.12, 0.18, sfxBus, 'bandpass', 700, 1.5); tone('sine', 180, t, 0.1, 0.2, sfxBus, 110); }),
    open: fx('open', 0, t => {
      hiss(t, 0.3, 0.2, sfxBus, 'bandpass', 1400, 0.8);
      [79, 84, 88, 91, 96, 100].forEach((m, i) => tone('triangle', mtof(m), t + 0.12 + i * 0.055, 0.3, 0.1, sfxBus));
    }),
    // Booing crowd, "uuuuu": several low voices through the formants of the vowel "u", sliding down
    boo: fx('boo', 1, t => {
      const dur = 2.1, out = ctx.createGain(), mix = ctx.createGain();
      out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(1, t + 0.3);
      out.gain.setValueAtTime(1, t + 1.3); out.gain.linearRampToValueAtTime(0, t + dur);
      out.connect(sfxBus);
      for (const [f, q, v] of [[330, 3, 1.6], [820, 5, 0.5]]) {
        const bp = ctx.createBiquadFilter(), g = ctx.createGain();
        bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; g.gain.value = v;
        mix.connect(bp); bp.connect(g); g.connect(out);
      }
      for (let i = 0; i < 7; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        const f = rand(120, 215), t0 = t + rand(0, 0.15);
        o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.06, t0); o.frequency.exponentialRampToValueAtTime(f * 0.8, t + dur);
        lfo.frequency.value = rand(4.5, 6.5); lg.gain.value = f * 0.02;
        lfo.connect(lg); lg.connect(o.frequency);
        g.gain.value = 0.11; o.connect(g); g.connect(mix);
        o.start(t0); lfo.start(t0); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
      }
      hiss(t, dur, 0.06, out, 'bandpass', 420, 1.5);
    }),
  };
})();

/* ============================================================
   Text with fractions: "[3/4]" is shown as a stacked fraction
   ============================================================ */
const FR_RE = /\[([^\/\]]+)\/([^\]]+)\]/g;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const richHTML = s => esc(s).replace(FR_RE, '<span class="fr"><span>$1</span><span>$2</span></span>');
const plain = s => String(s).replace(/(\d)\[/g, '$1 [').replace(FR_RE, '$1/$2');
const richCache = new Map();
function parseRich(s) {
  let segs = richCache.get(s);
  if (segs) return segs;
  segs = []; let lastI = 0;
  String(s).replace(FR_RE, (m, n, d, i) => { if (i > lastI) segs.push({ t: s.slice(lastI, i) }); segs.push({ n, d }); lastI = i + m.length; return m; });
  if (lastI < s.length) segs.push({ t: s.slice(lastI) });
  if (richCache.size > 400) richCache.clear();
  richCache.set(s, segs);
  return segs;
}

/* ============================================================
   Drawing
   ============================================================ */
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const FD = '"Lilita One", "Paytone One", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const PITCH = 36 * Math.PI / 180, SINP = Math.sin(PITCH), COSP = Math.cos(PITCH), TANP = Math.tan(PITCH);
const CAM_H = 10, CAM_BACK = 8;
const ARMY_D = CAM_H * SINP + CAM_BACK * COSP;     // depth of the army from the camera
const ARMY_K = -(-CAM_H * COSP + CAM_BACK * SINP) / ARMY_D;   // army sits this many F below the view centre
const MON_H = 7.6;                                 // monster height used to frame the fight
const MON_K = (() => { const ry = MON_H + 1.2 - CAM_H, rz = CAM_BACK + FIGHT_DIST; return (ry * COSP + rz * SINP) / (-ry * SINP + rz * COSP); })();
const view = { w: 1, h: 1, dpr: 1, F0: 400, F: 400, cx: 0, cy: 0, camX: 0, camZ: 0, sx: 0, sy: 0, hudBottom: 0, k: 0, fightY: 0, topY: 0 };
const P0 = {}, P1 = {}, P2 = {}, P3 = {}, P4 = {};

function layout() {
  const w = window.innerWidth, h = window.innerHeight;
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * view.dpr); canvas.height = Math.round(h * view.dpr);
  view.w = w; view.h = h; view.cx = w / 2;
  const horizon = Math.max(h * 0.16, view.hudBottom + 6);
  const Fw = Math.min(w, h * 0.62) * ARMY_D / 9.6;
  const Fh = (h * 0.8 - horizon) / (ARMY_K + TANP);
  view.F0 = Math.max(120, Math.min(Fw, Fh));
  if (!view.fightY) view.fightY = h * 0.62;
  if (!view.topY) view.topY = h * 0.17;
}
// Moves the camera between running (army low on screen) and fighting (army above the answer buttons)
function updateCamera(fighting, dt) {
  view.k += ((fighting ? 1 : 0) - view.k) * Math.min(1, dt * 2.5);
  const yRun = view.h * 0.8, yFight = view.fightY;
  const Ff = Math.max(100, Math.min(view.F0, (yFight - view.topY) / (ARMY_K + MON_K)));
  view.F = view.F0 + (Ff - view.F0) * view.k;
  view.cy = yRun + (yFight - yRun) * view.k - view.F * ARMY_K;
}

function proj(x, y, z, o) {
  const rx = x - view.camX, ry = y - CAM_H, rz = z - view.camZ;
  const d = -ry * SINP + rz * COSP;
  if (d < 0.6) return false;
  const v = ry * COSP + rz * SINP, s = view.F / d;
  o.x = view.cx + rx * s + view.sx; o.y = view.cy - v * s + view.sy; o.s = s; o.d = d;
  return true;
}
function poly4(fill, stroke, lw) {
  ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.lineTo(P3.x, P3.y); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
// Flat rectangle on the ground, a wall facing the camera (z fixed) or a wall along the road (x fixed)
function ground(x0, x1, z0, z1, y, fill) { if (proj(x0, y, z0, P0) && proj(x1, y, z0, P1) && proj(x1, y, z1, P2) && proj(x0, y, z1, P3)) poly4(fill); }
function wallZ(x0, x1, y0, y1, z, fill, stroke, lw) { if (proj(x0, y0, z, P0) && proj(x1, y0, z, P1) && proj(x1, y1, z, P2) && proj(x0, y1, z, P3)) { poly4(fill, stroke, lw); return true; } return false; }
function wallX(x, z0, z1, y0, y1, fill) { if (proj(x, y0, z0, P0) && proj(x, y0, z1, P1) && proj(x, y1, z1, P2) && proj(x, y1, z0, P3)) poly4(fill); }
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function outlined(text, x, y, size, fill, stroke) {
  ctx.font = `${size}px ${FD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * 0.18); ctx.strokeStyle = stroke; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// Rich text on the canvas: text runs and stacked fractions, centred on (cx, cy), shrunk to fit maxW
function richWidth(segs, size) {
  let w = 0;
  for (const g of segs) {
    if (g.t !== undefined) { ctx.font = `${size}px ${FD}`; w += ctx.measureText(g.t).width; }
    else { ctx.font = `${size * 0.62}px ${FD}`; w += Math.max(ctx.measureText(g.n).width, ctx.measureText(g.d).width) + size * 0.2; }
  }
  return w;
}
function drawRich(s, cx, cy, size, fill, stroke, maxW) {
  const segs = parseRich(s);
  let w = richWidth(segs, size);
  if (maxW && w > maxW) { size *= maxW / w; w = maxW; }
  let x = cx - w / 2;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const put = (t, px, py, fs) => {
    ctx.font = `${fs}px ${FD}`;
    if (stroke) { ctx.lineWidth = Math.max(2, fs * 0.18); ctx.strokeStyle = stroke; ctx.strokeText(t, px, py); }
    ctx.fillStyle = fill; ctx.fillText(t, px, py);
  };
  for (const g of segs) {
    if (g.t !== undefined) {
      ctx.font = `${size}px ${FD}`; const tw = ctx.measureText(g.t).width;
      put(g.t, x + tw / 2, cy, size); x += tw;
    } else {
      const fs = size * 0.62; ctx.font = `${fs}px ${FD}`;
      const fw = Math.max(ctx.measureText(g.n).width, ctx.measureText(g.d).width) + size * 0.2, mx = x + fw / 2;
      const bar = () => { ctx.beginPath(); ctx.moveTo(x + size * 0.06, cy); ctx.lineTo(x + fw - size * 0.06, cy); ctx.stroke(); };
      ctx.lineCap = 'round';
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = size * 0.07 + Math.max(2, fs * 0.18); bar(); }
      ctx.strokeStyle = fill; ctx.lineWidth = Math.max(1.2, size * 0.07); bar();
      put(g.n, mx, cy - size * 0.36, fs); put(g.d, mx, cy + size * 0.38, fs);
      x += fw;
    }
  }
}

/* ---------- soldier and zombie sprites, drawn once ---------- */
const SW = 72, SH = 108;
// Army colours to choose in the armoury: main, dark, light
const SKINS = [
  { name: 'Niebieski', price: 0, c: ['#2f7df6', '#1c4fb4', '#9cc4ff'] },
  { name: 'Zielony', price: 30, c: ['#2fae5a', '#1d7a3d', '#9fe6b8'] },
  { name: 'Pomarańczowy', price: 30, c: ['#f08a24', '#b25d0f', '#ffd0a0'] },
  { name: 'Fioletowy', price: 50, c: ['#8a4fd6', '#5a2a9c', '#d4b8f7'] },
  { name: 'Czarny', price: 60, c: ['#3a4150', '#1e232d', '#9aa3b5'] },
  { name: 'Złoty', price: 150, c: ['#f2c230', '#b8860b', '#fff0a8'] },
];
function makeSoldier(col, frame) {
  const c = document.createElement('canvas'); c.width = SW; c.height = SH;
  const x = c.getContext('2d');
  const [main, dark, light] = col, ink = '#15233b', boot = '#262b36';
  const ph = frame / 4 * Math.PI * 2, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 3;
  x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 3.5; x.strokeStyle = ink;
  const blob = (path, fill) => { x.beginPath(); path(); x.fillStyle = fill; x.fill(); x.stroke(); };
  const legTop = 72 - bob;
  blob(() => rr(x, 22, legTop, 12, 104 - legTop - Math.max(0, sw) * 7, 5), boot);
  blob(() => rr(x, 38, legTop, 12, 104 - legTop - Math.max(0, -sw) * 7, 5), boot);
  blob(() => x.ellipse(13, 58 - bob + sw * 4, 7, 10, 0, 0, Math.PI * 2), dark);
  blob(() => x.ellipse(59, 58 - bob - sw * 4, 7, 10, 0, 0, Math.PI * 2), dark);
  blob(() => rr(x, 15, 40 - bob, 42, 38, 14), main);
  blob(() => rr(x, 23, 45 - bob, 26, 24, 7), dark);                  // backpack, seen from behind
  blob(() => x.arc(36, 29 - bob, 19, 0, Math.PI * 2), main);        // helmet
  x.beginPath(); x.arc(36, 29 - bob, 12, Math.PI * 1.15, Math.PI * 1.6); x.strokeStyle = light; x.lineWidth = 5; x.stroke();
  return c;
}
// Zombies walk towards the army, so we see their faces; a big one is fatter and angrier
function makeZombie(frame, big) {
  const c = document.createElement('canvas'); c.width = SW; c.height = SH;
  const x = c.getContext('2d');
  const ink = '#15233b', skin = big ? '#74b84f' : '#93d36c', skinDk = big ? '#4f8a33' : '#62a446';
  const shirt = big ? '#7a4a2a' : '#7b5fb8', shirtDk = big ? '#4e2c16' : '#4f3a85', pants = '#3b4252';
  const ph = frame / 4 * Math.PI * 2, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 2.5, lean = sw * 2.5;
  x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 3.5; x.strokeStyle = ink;
  const blob = (path, fill) => { x.beginPath(); path(); x.fillStyle = fill; x.fill(); x.stroke(); };
  const legTop = 74 - bob;
  blob(() => rr(x, 22, legTop, 12, 104 - legTop - Math.max(0, sw) * 6, 4), pants);
  blob(() => rr(x, 38, legTop, 12, 104 - legTop - Math.max(0, -sw) * 6, 4), pants);
  const bw = big ? 50 : 40, bx = 36 - bw / 2 + lean;
  // torn shirt with a ragged hem
  blob(() => {
    x.moveTo(bx + 8, 42 - bob); x.lineTo(bx + bw - 8, 42 - bob); x.quadraticCurveTo(bx + bw + 2, 44 - bob, bx + bw, 60 - bob);
    for (let i = 0; i <= 6; i++) x.lineTo(bx + bw - i * bw / 6, 78 - bob + (i % 2 ? -5 : 1));
    x.quadraticCurveTo(bx - 2, 44 - bob, bx + 8, 42 - bob);
  }, shirt);
  x.beginPath(); x.moveTo(bx + 12, 56 - bob); x.lineTo(bx + 18, 62 - bob); x.lineTo(bx + 14, 66 - bob); x.strokeStyle = shirtDk; x.lineWidth = 3; x.stroke();
  x.strokeStyle = ink; x.lineWidth = 3.5;
  // arms stretched towards us: sleeves and hands in front of the chest
  blob(() => x.ellipse(bx + 2, 54 - bob + sw * 3, 8, 7, 0, 0, Math.PI * 2), shirtDk);
  blob(() => x.ellipse(bx + bw - 2, 54 - bob - sw * 3, 8, 7, 0, 0, Math.PI * 2), shirtDk);
  blob(() => x.ellipse(bx + 6, 50 - bob + sw * 3, 7, 6.5, 0, 0, Math.PI * 2), skin);
  blob(() => x.ellipse(bx + bw - 6, 50 - bob - sw * 3, 7, 6.5, 0, 0, Math.PI * 2), skin);
  // head
  const hr = big ? 19 : 16, hx = 36 + lean * 1.4, hy = 27 - bob;
  blob(() => x.arc(hx, hy, hr, 0, Math.PI * 2), skin);
  x.fillStyle = skinDk; x.beginPath(); x.ellipse(hx - hr * 0.45, hy + hr * 0.1, hr * 0.32, hr * 0.26, 0, 0, Math.PI * 2); x.ellipse(hx + hr * 0.45, hy + hr * 0.1, hr * 0.32, hr * 0.26, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(hx - hr * 0.42, hy, hr * 0.24, 0, 7); x.arc(hx + hr * 0.42, hy, hr * 0.2, 0, 7); x.fill();
  x.fillStyle = ink; x.beginPath(); x.arc(hx - hr * 0.36, hy + 1, hr * 0.1, 0, 7); x.arc(hx + hr * 0.47, hy - 1, hr * 0.09, 0, 7); x.fill();
  if (big) { x.beginPath(); x.moveTo(hx - hr * 0.75, hy - hr * 0.42); x.lineTo(hx - hr * 0.2, hy - hr * 0.22); x.moveTo(hx + hr * 0.75, hy - hr * 0.42); x.lineTo(hx + hr * 0.2, hy - hr * 0.22); x.stroke(); }
  x.beginPath(); x.moveTo(hx - hr * 0.42, hy + hr * 0.55); x.quadraticCurveTo(hx, hy + hr * 0.4, hx + hr * 0.45, hy + hr * 0.58); x.stroke();
  x.fillStyle = '#ffffff'; x.fillRect(hx - 1, hy + hr * 0.46, 5, 5);
  x.beginPath(); x.moveTo(hx - 3, hy - hr); x.lineTo(hx - 6, hy - hr - 6); x.moveTo(hx + 3, hy - hr); x.lineTo(hx + 5, hy - hr - 5); x.stroke();
  return c;
}
const ZOMB = [[0, 1, 2, 3].map(f => makeZombie(f, false)), [0, 1, 2, 3].map(f => makeZombie(f, true))];
// The other enemies, all seen from the front as they come at the army; big ones are darker and angrier
const spriteCtx = () => { const c = document.createElement('canvas'); c.width = SW; c.height = SH; const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 3.5; x.strokeStyle = '#15233b'; return [c, x]; };
const blobOn = x => (path, fill) => { x.beginPath(); path(); x.fillStyle = fill; x.fill(); x.stroke(); };
function eyesOn(x, hx, hy, r, gap, big, look = 0) {
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(hx - gap, hy, r, 0, 7); x.arc(hx + gap, hy, r, 0, 7); x.fill(); x.stroke();
  x.fillStyle = '#15233b'; x.beginPath(); x.arc(hx - gap + look, hy + r * 0.2, r * 0.48, 0, 7); x.arc(hx + gap + look, hy + r * 0.2, r * 0.48, 0, 7); x.fill();
  if (big) { x.beginPath(); x.moveTo(hx - gap - r * 1.2, hy - r * 1.5); x.lineTo(hx - gap + r * 0.9, hy - r * 0.8); x.moveTo(hx + gap + r * 1.2, hy - r * 1.5); x.lineTo(hx + gap - r * 0.9, hy - r * 0.8); x.stroke(); }
}
function makeAnt(frame, big) {
  const [c, x] = spriteCtx(), blob = blobOn(x), ph = frame / 4 * Math.PI * 2, sw = Math.sin(ph);
  const body = big ? '#8e2a1a' : '#c8452e', dark = big ? '#561409' : '#82261a';
  x.lineWidth = 3;
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {           // six thin legs, stepping in turn
    const lift = ((i + (sd > 0 ? 1 : 0)) % 2 ? sw : -sw) * 4, y0 = 70 + i * 6;
    x.beginPath(); x.moveTo(36 + sd * 8, y0); x.quadraticCurveTo(36 + sd * (22 + i * 3), y0 - 6 + lift, 36 + sd * (24 + i * 4), 102 - i * 2 + Math.min(0, lift)); x.stroke();
  }
  x.lineWidth = 3.5;
  blob(() => x.ellipse(36, 50, 17, 14, 0, 0, 7), dark);              // abdomen, behind
  blob(() => x.ellipse(36, 72, 9, 8, 0, 0, 7), body);                // waist
  blob(() => x.arc(36, 66 - Math.abs(sw) * 1.5, 15, 0, 7), body);    // head in front
  for (const sd of [-1, 1]) {                                         // antennae and pincers
    x.beginPath(); x.moveTo(36 + sd * 6, 53); x.quadraticCurveTo(36 + sd * 14, 34, 36 + sd * 22, 36 + sw * sd * 2); x.stroke();
    x.fillStyle = dark; x.beginPath(); x.arc(36 + sd * 22, 36 + sw * sd * 2, 3.5, 0, 7); x.fill(); x.stroke();
    blob(() => { x.moveTo(36 + sd * 4, 78); x.quadraticCurveTo(36 + sd * 12, 84, 36 + sd * 3, 90); x.quadraticCurveTo(36 + sd * 6, 84, 36 + sd * 2, 80); }, dark);
  }
  eyesOn(x, 36, 63, 5.5, 6.5, big);
  return c;
}
function makeWasp(frame, big) {
  const [c, x] = spriteCtx(), blob = blobOn(x), up = frame % 2 ? 1 : -1;
  const yel = big ? '#e7a90e' : '#ffd23f', blk = '#232323';
  x.globalAlpha = 0.75;                                                 // see-through wings, flapping
  for (const sd of [-1, 1]) blob(() => x.ellipse(36 + sd * 18, 34 + up * 5, 16, 9, sd * (0.5 + up * 0.35), 0, 7), '#e8f6ff');
  x.globalAlpha = 1;
  x.lineWidth = 2.5;
  for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { x.beginPath(); x.moveTo(36 + sd * 6, 62 + i * 6); x.lineTo(36 + sd * 12, 74 + i * 6); x.stroke(); }
  x.lineWidth = 3.5;
  blob(() => { x.moveTo(36, 96); x.lineTo(31, 84); x.lineTo(41, 84); x.closePath(); }, blk);   // the sting
  blob(() => x.ellipse(36, 66, 13, 19, 0, 0, 7), yel);
  x.save(); x.beginPath(); x.ellipse(36, 66, 13, 19, 0, 0, 7); x.clip(); x.fillStyle = blk;
  for (const y of [58, 68, 78]) x.fillRect(20, y, 32, 5);
  x.restore(); x.beginPath(); x.ellipse(36, 66, 13, 19, 0, 0, 7); x.stroke();
  blob(() => x.arc(36, 40, 13, 0, 7), yel);
  x.fillStyle = blk; x.beginPath(); x.ellipse(36, 30, 9, 4, 0, 0, 7); x.fill();
  for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(36 + sd * 4, 28); x.quadraticCurveTo(36 + sd * 8, 16, 36 + sd * 14, 17); x.stroke(); }
  eyesOn(x, 36, 40, 5, 5.5, big);
  return c;
}
function makeSnake(frame, big) {
  const [c, x] = spriteCtx(), blob = blobOn(x), ph = frame / 4 * Math.PI * 2, sw = Math.sin(ph);
  const green = big ? '#2f8a3a' : '#4caf50', dark = big ? '#1b5a24' : '#2e7d32', belly = '#c5e86c';
  blob(() => x.ellipse(36, 95, 27, 9, 0, 0, 7), dark);                // coils on the ground
  blob(() => x.ellipse(36 - sw * 2, 86, 21, 8, 0, 0, 7), green);
  x.lineWidth = 15; x.strokeStyle = '#15233b';                       // the neck rises in an S, outline first
  const neck = () => { x.beginPath(); x.moveTo(36, 84); x.bezierCurveTo(52 + sw * 4, 74, 18 + sw * 4, 62, 36 + sw * 3, 46); };
  neck(); x.stroke(); x.lineWidth = 9; x.strokeStyle = green; neck(); x.stroke();
  x.lineWidth = 3; x.strokeStyle = belly; neck(); x.stroke();
  x.lineWidth = 3.5; x.strokeStyle = '#15233b';
  const hx = 36 + sw * 3;
  if (frame % 2) { x.strokeStyle = '#e53935'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(hx, 50); x.lineTo(hx, 58); x.moveTo(hx, 58); x.lineTo(hx - 3, 62); x.moveTo(hx, 58); x.lineTo(hx + 3, 62); x.stroke(); x.strokeStyle = '#15233b'; x.lineWidth = 3.5; }
  blob(() => x.ellipse(hx, 38, 15, 12, 0, 0, 7), green);
  x.fillStyle = dark; for (const [dx, dy] of [[-7, -6], [6, -7], [0, -9]]) { x.beginPath(); x.arc(hx + dx, 38 + dy, 2.2, 0, 7); x.fill(); }
  eyesOn(x, hx, 36, 4.5, 6, big);
  return c;
}
function makeClown(frame, big) {
  const [c, x] = spriteCtx(), blob = blobOn(x), ph = frame / 4 * Math.PI * 2, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 2.5;
  const suit = big ? '#7b2fa8' : '#ff4d4d', suit2 = big ? '#3fa9f5' : '#3fa9f5', hair = big ? '#ff8a1f' : '#3fa9f5';
  const legTop = 76 - bob;
  blob(() => rr(x, 24, legTop, 11, 96 - legTop - Math.max(0, sw) * 5, 4), suit2);
  blob(() => rr(x, 37, legTop, 11, 96 - legTop - Math.max(0, -sw) * 5, 4), suit2);
  blob(() => x.ellipse(26, 100 - Math.max(0, sw) * 5, 12, 6, 0, 0, 7), '#e53935');    // big shoes
  blob(() => x.ellipse(46, 100 - Math.max(0, -sw) * 5, 12, 6, 0, 0, 7), '#e53935');
  blob(() => rr(x, 15, 46 - bob, 42, 34, 14), suit);
  x.fillStyle = '#ffffff'; for (const [dx, dy] of [[24, 54], [44, 58], [33, 68], [22, 72], [48, 72]]) { x.beginPath(); x.arc(dx, dy - bob, 3.2, 0, 7); x.fill(); }
  blob(() => x.ellipse(12, 56 - bob + sw * 3, 7, 9, 0, 0, 7), suit);       // arms reaching out
  blob(() => x.ellipse(60, 56 - bob - sw * 3, 7, 9, 0, 0, 7), suit);
  blob(() => x.arc(12, 50 - bob + sw * 3, 6, 0, 7), '#ffffff');
  blob(() => x.arc(60, 50 - bob - sw * 3, 6, 0, 7), '#ffffff');
  for (let i = 0; i < 5; i++) blob(() => x.arc(20 + i * 8, 45 - bob, 5.5, 0, 7), '#fff6c0');   // frilly collar
  const hx = 36, hy = 28 - bob;
  for (const sd of [-1, 1]) for (const [dx, dy] of [[17, -4], [19, 5], [13, -11]]) blob(() => x.arc(hx + sd * dx, hy + dy, 6.5, 0, 7), hair);   // curly wig
  blob(() => x.arc(hx, hy, 15, 0, 7), '#fbf7f0');
  eyesOn(x, hx, hy - 3, 4.2, 6, big);
  x.beginPath(); x.moveTo(hx - 9, hy + 6); x.quadraticCurveTo(hx, hy + 15, hx + 9, hy + 6); x.strokeStyle = '#e53935'; x.lineWidth = 3.5; x.stroke(); x.strokeStyle = '#15233b';
  blob(() => x.arc(hx, hy + 3, 4.5, 0, 7), '#e53935');                   // red nose
  blob(() => { x.moveTo(hx - 7, hy - 13); x.lineTo(hx, hy - 27); x.lineTo(hx + 7, hy - 13); x.closePath(); }, '#ffd23f');   // little hat
  return c;
}
const FOE_ART = { zombie: makeZombie, ant: makeAnt, wasp: makeWasp, snake: makeSnake, clown: makeClown };
const FOE_SPR = Object.fromEntries(Object.entries(FOE_ART).map(([k, f]) => [k, [false, true].map(big => [0, 1, 2, 3].map(fr => f(fr, big)))]));
const FOE_FX = { zombie: ['#93d36c', '#4f8a33', '#7b5fb8'], ant: ['#c8452e', '#82261a', '#3b1d14'], wasp: ['#ffd23f', '#232323', '#e8f6ff'],
  snake: ['#4caf50', '#2e7d32', '#c5e86c'], clown: ['#ff4d4d', '#ffffff', '#3fa9f5', '#ffd23f'] };
const FOE_NAMES = { zombie: 'zombie', ant: 'mrówki', wasp: 'osy', snake: 'węże', clown: 'klauny' };
const armySprites = [];
const armySprite = (skin, f) => (armySprites[skin] = armySprites[skin] || [0, 1, 2, 3].map(k => makeSoldier(SKINS[skin].c, k)))[f];
const backOut = t => { const c = 1.9; t -= 1; return 1 + t * t * ((c + 1) * t + c); };

/* ---------- monsters: one for every class ---------- */
const MONSTERS = [
  { name: 'Glutek', body: '#5cc443', dark: '#2c7a26', light: '#b9f59a', eyes: 1, horns: 0, size: 0.82 },
  { name: 'Artur Pająkojad', body: '#2f3539', dark: '#23282b', light: '#f3a99a', horn: '#e8dfc3', chalk: true, size: 0.86 },   // drawn in chalk by the owner for his son
  { name: 'Hedwigonna', body: '#fbfbf7', dark: '#16181d', light: '#f2a44b', owl: true, fem: true, size: 0.9 },   // made with a 3D pen by the owner's child
  { name: 'Głazor', body: '#8e98a5', dark: '#4f5966', light: '#cfd6de', eyes: 2, horns: 0, cracks: true, size: 0.94 },
  { name: 'Płomyk', body: '#e2452f', dark: '#871d12', light: '#ffb07a', eyes: 2, horns: 2, flames: true, size: 0.96 },
  { name: 'Lodowiec', body: '#79cfee', dark: '#2a7fa6', light: '#e8f9ff', eyes: 2, horns: 1, spikes: true, size: 0.98 },
  { name: 'Trójoki', body: '#23a094', dark: '#115d56', light: '#9fe8e0', eyes: 3, horns: 2, spikes: true, size: 1.0 },
  { name: 'Liczożerca', body: '#b02a3e', dark: '#5a1020', light: '#ff9aa8', eyes: 2, horns: 2, wings: true, spikes: true, size: 1.0 },
];

// Artur Pająkojad looks like the chalk drawing on the blackboard at home: a lemon-shaped head with a huge toothy grin,
// spiral eyes, horns, antennae with little balls and a row of short pink legs
function drawPajakojad(T, t, u, X, Y, lunge, breathe, flash, alpha) {
  const chalk = '#f4efdc', ink = '#15233b', lw = Math.max(2, 0.09 * u);
  const line = (w = 1) => { ctx.lineWidth = lw * 2.2 * w; ctx.strokeStyle = ink; ctx.stroke(); ctx.lineWidth = lw * 1.1 * w; ctx.strokeStyle = chalk; ctx.stroke(); };
  const cy = 2.85 + lunge * 0.3, hw = 3.9 * (1 + lunge * 0.04), hh = 2.25 * breathe * (1 + lunge * 0.05);
  // short legs keep pattering under the head
  for (let i = 0; i < 6; i++) {
    const lx = (i - 2.5) * 0.9, lift = Math.max(0, Math.sin(t * 7 + i * 2.1)) * 0.25;
    ctx.beginPath(); ctx.moveTo(X(lx * 0.85), Y(cy - 1.6)); ctx.lineTo(X(lx * 1.12), Y(0.25 + lift));
    ctx.lineWidth = 0.4 * u + lw * 2; ctx.strokeStyle = ink; ctx.stroke();
    ctx.lineWidth = 0.4 * u; ctx.strokeStyle = T.light; ctx.stroke();
  }
  // antennae wobble, horns are shaded with chalk strokes
  for (const sd of [-1, 1]) {
    const sw = Math.sin(t * 3 + sd) * 0.25 + lunge * 0.3, bx = sd * 2.5, by = cy + 1.2, tx = sd * (3.05 + sw * 0.5), ty = cy + hh + 1.35;
    ctx.beginPath(); ctx.moveTo(X(bx), Y(by)); ctx.quadraticCurveTo(X(sd * 3.4), Y(by + 1.4), X(tx), Y(ty)); line(0.8);
    ctx.beginPath(); ctx.arc(X(tx), Y(ty + 0.3), 0.3 * u, 0, Math.PI * 2); ctx.fillStyle = T.body; ctx.fill(); line(0.8);
    const hy = cy + hh * 0.72, horn = () => {
      ctx.beginPath(); ctx.moveTo(X(sd * 0.75), Y(hy)); ctx.quadraticCurveTo(X(sd * 0.95), Y(hy + 1.3), X(sd * 1.5), Y(cy + hh + 1.25));
      ctx.quadraticCurveTo(X(sd * 1.6), Y(hy + 0.9), X(sd * 2.0), Y(hy - 0.25)); ctx.closePath();
    };
    horn(); ctx.fillStyle = T.horn; ctx.fill();
    ctx.save(); ctx.clip(); ctx.beginPath();
    for (let k = 0; k < 7; k++) { const y0 = hy - 0.2 + k * 0.3; ctx.moveTo(X(sd * 0.5), Y(y0)); ctx.lineTo(X(sd * 2.2), Y(y0 + 0.7)); }
    ctx.lineWidth = Math.max(1, lw * 0.6); ctx.strokeStyle = '#b9ad8a'; ctx.stroke(); ctx.restore();
    horn(); line();
  }
  // head
  const head = () => {
    ctx.beginPath(); ctx.moveTo(X(-hw), Y(cy - 0.15));
    ctx.bezierCurveTo(X(-hw * 0.72), Y(cy + hh * 1.3), X(hw * 0.72), Y(cy + hh * 1.3), X(hw), Y(cy - 0.15));
    ctx.bezierCurveTo(X(hw * 0.7), Y(cy - hh * 1.15), X(-hw * 0.7), Y(cy - hh * 1.15), X(-hw), Y(cy - 0.15)); ctx.closePath();
  };
  head(); ctx.fillStyle = T.body; ctx.fill(); line();
  // spiral eyes spin the other way round
  for (const sd of [-1, 1]) {
    const ex = sd * 1.35, eY = cy + 1.1, er = 0.6, spin = t * (2 + lunge * 6);
    ctx.beginPath(); ctx.arc(X(ex), Y(eY), er * u, 0, Math.PI * 2); ctx.fillStyle = '#fffbe9'; ctx.fill(); line(0.8);
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) { const a = sd * (k / 40 * Math.PI * 3.6 + spin), r = er * 0.82 * k / 40; const px = X(ex + Math.cos(a) * r), py = Y(eY + Math.sin(a) * r); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.lineWidth = Math.max(1.5, 0.11 * u); ctx.strokeStyle = ink; ctx.stroke();
  }
  // nose
  const ny = cy - 0.1;
  ctx.beginPath(); ctx.moveTo(X(-0.2), Y(ny + 1.55)); ctx.lineTo(X(0.2), Y(ny + 1.55)); ctx.quadraticCurveTo(X(0.5), Y(ny + 0.6), X(0.62), Y(ny + 0.05));
  ctx.quadraticCurveTo(X(0.42), Y(ny - 0.12), X(0.24), Y(ny + 0.05)); ctx.quadraticCurveTo(X(0), Y(ny - 0.15), X(-0.24), Y(ny + 0.05));
  ctx.quadraticCurveTo(X(-0.42), Y(ny - 0.12), X(-0.62), Y(ny + 0.05)); ctx.quadraticCurveTo(X(-0.5), Y(ny + 0.6), X(-0.2), Y(ny + 1.55)); ctx.closePath();
  ctx.fillStyle = T.dark; ctx.fill(); line(0.8);
  // the huge grin opens wider when he attacks
  const open = lunge * 0.3, L = [-hw * 0.88, cy + 0.05], R = [hw * 0.88, cy - 0.25], C = [0, cy - 0.6];
  const lo = [[hw * 0.6, cy - hh - open], [-hw * 0.6, cy - hh - open]];
  const upAt = s => [(1 - s) * (1 - s) * L[0] + 2 * s * (1 - s) * C[0] + s * s * R[0], (1 - s) * (1 - s) * L[1] + 2 * s * (1 - s) * C[1] + s * s * R[1]];
  const loAt = s => { const a = (1 - s) ** 3, b = 3 * s * (1 - s) ** 2, c = 3 * s * s * (1 - s), d = s ** 3; return [a * R[0] + b * lo[0][0] + c * lo[1][0] + d * L[0], a * R[1] + b * lo[0][1] + c * lo[1][1] + d * L[1]]; };
  const mouth = () => {
    ctx.beginPath(); ctx.moveTo(X(L[0]), Y(L[1])); ctx.quadraticCurveTo(X(C[0]), Y(C[1]), X(R[0]), Y(R[1]));
    ctx.bezierCurveTo(X(lo[0][0]), Y(lo[0][1]), X(lo[1][0]), Y(lo[1][1]), X(L[0]), Y(L[1])); ctx.closePath();
  };
  mouth(); ctx.fillStyle = '#4a0d18'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#f8f4e6'; ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.5, 0.06 * u);
  for (let i = 0; i < 9; i++) {
    const [ax, ay] = upAt(i / 9), [bx, by] = upAt((i + 1) / 9), [mx, my] = upAt((i + 0.5) / 9);
    ctx.beginPath(); ctx.moveTo(X(ax), Y(ay + 0.1)); ctx.lineTo(X(mx), Y(my - 0.6)); ctx.lineTo(X(bx), Y(by + 0.1)); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const s0 = 0.06 + i * 0.11, [ax, ay] = loAt(s0), [bx, by] = loAt(s0 + 0.11), [mx, my] = loAt(s0 + 0.055);
    ctx.beginPath(); ctx.moveTo(X(ax), Y(ay - 0.1)); ctx.lineTo(X(mx), Y(my + 0.55)); ctx.lineTo(X(bx), Y(by - 0.1)); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
  mouth(); line(0.9);
  if (flash) { ctx.globalAlpha = 0.25 * alpha; head(); ctx.fillStyle = '#ffffff'; ctx.fill(); }
}

// Hedwigonna looks like the 3D pen figure: a snowy owl with speckled wings and sleepy orange eyes,
// holding a letter with a red seal and standing on a blue board
function drawHedwigonna(T, t, u, X, Y, lunge, breathe, flash, alpha) {
  const ink = T.dark, lw = Math.max(2, 0.12 * u);
  const outline = (w = 1) => { ctx.lineWidth = lw * w; ctx.strokeStyle = ink; ctx.stroke(); };
  const by = 2.25, H = y => by + (y - by) * breathe * (1 + lunge * 0.05) + lunge * 0.25;
  // blue board, black feet and legs
  ctx.beginPath(); rr(ctx, X(-2.9), Y(0.42), 5.8 * u, 0.42 * u, 0.2 * u); ctx.fillStyle = '#2d8fe0'; ctx.fill(); outline(0.8);
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(X(sd * 1.25), Y(0.42)); ctx.lineTo(X(sd * 3.15), Y(0.42)); ctx.quadraticCurveTo(X(sd * 2.7), Y(0.95), X(sd * 1.5), Y(1.0)); ctx.closePath();
    ctx.fillStyle = ink; ctx.fill(); outline(0.6);
    ctx.beginPath(); ctx.moveTo(X(sd * 1.7), Y(0.7)); ctx.lineTo(X(sd * 1.75), Y(H(2.5))); ctx.lineWidth = 0.6 * u; ctx.strokeStyle = ink; ctx.stroke();
  }
  // the letter with a red seal swings a little under the talons
  const ly = 0.78 + Math.sin(t * 3) * 0.05;
  ctx.beginPath(); rr(ctx, X(-1.15), Y(ly + 1.3), 2.3 * u, 1.3 * u, 0.12 * u); ctx.fillStyle = '#ffffff'; ctx.fill(); outline(0.8);
  ctx.beginPath(); ctx.moveTo(X(-1.05), Y(ly + 1.22)); ctx.lineTo(X(0), Y(ly + 0.6)); ctx.lineTo(X(1.05), Y(ly + 1.22)); outline(0.6);
  ctx.beginPath(); ctx.arc(X(0), Y(ly + 0.62), 0.27 * u, 0, Math.PI * 2); ctx.fillStyle = '#e2382c'; ctx.fill(); outline(0.5);
  // speckled wings hang at the sides and rise when she attacks
  const DOTS = [[0.35, -0.6, 0.12], [0.75, -1.0, 0.1], [0.4, -1.4, 0.13], [0.95, -1.7, 0.11], [0.55, -2.0, 0.12], [1.0, -2.3, 0.1], [0.3, -2.4, 0.1]];
  for (const sd of [-1, 1]) {
    const ang = (Math.sin(t * 2.2 + sd) * 0.05 + lunge * 0.85) * -sd;
    ctx.save(); ctx.translate(X(sd * 2.0), Y(H(5.3))); ctx.rotate(ang);
    const P = (x, y) => [sd * x * u, -y * u];
    const wing = () => {
      ctx.beginPath(); ctx.moveTo(...P(0, 0.1)); ctx.quadraticCurveTo(...P(1.05, -0.1), ...P(1.25, -1.5)); ctx.quadraticCurveTo(...P(1.35, -2.9), ...P(0.85, -3.3));
      ctx.quadraticCurveTo(...P(0.3, -3.35), ...P(0.05, -2.6)); ctx.closePath();
    };
    wing(); ctx.fillStyle = T.body; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = ink; ctx.fillRect(-2 * u, 2.45 * u, 4 * u, 2 * u);
    for (const [x, y, r] of DOTS) { ctx.beginPath(); ctx.arc(...P(x, y), r * u, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = T.body; for (const [x, y] of [[0.5, -2.7], [0.95, -2.85], [0.7, -3.1]]) { ctx.beginPath(); ctx.arc(...P(x, y), 0.09 * u, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    wing(); outline();
    ctx.restore();
  }
  // body
  const body = () => {
    ctx.beginPath(); ctx.moveTo(X(-2.0), Y(H(by)));
    ctx.bezierCurveTo(X(-2.35), Y(H(3.85)), X(-2.45), Y(H(5.2)), X(-2.2), Y(H(6.0)));
    ctx.bezierCurveTo(X(-1.9), Y(H(7.3)), X(1.9), Y(H(7.3)), X(2.2), Y(H(6.0)));
    ctx.bezierCurveTo(X(2.45), Y(H(5.2)), X(2.35), Y(H(3.85)), X(2.0), Y(H(by))); ctx.closePath();
  };
  body(); ctx.fillStyle = T.body; ctx.fill(); outline();
  // a few soft strokes like the plastic of the 3D pen, and the dark streak on the chest
  ctx.strokeStyle = '#d8dade'; ctx.lineWidth = Math.max(1, lw * 0.45);
  for (const [x, y, r, a] of [[-1.2, 3.3, 0.5, 0.4], [1.1, 3.6, 0.55, 2.2], [-0.4, 4.2, 0.6, 1.2], [0.9, 4.6, 0.45, 3.4], [-1.4, 4.9, 0.4, 5.0], [0.2, 6.6, 0.5, 0.2]]) {
    ctx.beginPath(); ctx.arc(X(x), Y(H(y)), r * u, a, a + 2.2); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(X(0.05), Y(H(4.0))); ctx.quadraticCurveTo(X(-0.12), Y(H(3.4)), X(0.02), Y(H(2.9))); ctx.lineWidth = lw * 1.1; ctx.strokeStyle = ink; ctx.stroke();
  // talons hold the letter
  ctx.beginPath(); rr(ctx, X(-1.75), Y(H(2.45)), 3.5 * u, (H(2.45) - 1.95) * u, 0.2 * u); ctx.fillStyle = ink; ctx.fill();
  ctx.fillStyle = T.light; for (const x of [-1.05, -0.38, 0.38, 1.05]) { ctx.beginPath(); ctx.ellipse(X(x), Y(2.15), 0.18 * u, 0.22 * u, 0, 0, Math.PI * 2); ctx.fill(); }
  // sleepy orange eyes under heavy lids; the lids lift when she attacks
  const ey = H(5.6), lid = (t % 4.3) < 0.12 ? 1 : 0.34 - lunge * 0.3;
  for (const sd of [-1, 1]) {
    const ex = sd * 0.95, rx = 0.7, ry = 0.55;
    ctx.beginPath(); ctx.ellipse(X(ex), Y(ey), (rx + 0.1) * u, (ry + 0.1) * u, 0, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(X(ex), Y(ey), rx * u, ry * u, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = T.light; ctx.fillRect(X(ex - rx), Y(ey + ry), 2 * rx * u, 2 * ry * u);
    ctx.beginPath(); ctx.arc(X(ex - sd * 0.08), Y(ey - 0.02), 0.36 * u, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill();
    ctx.beginPath(); ctx.arc(X(ex - sd * 0.2), Y(ey + 0.15), 0.09 * u, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    const li = ey + ry - 2 * ry * lid, lo = li + 0.18;     // the lid line is lower on the inner side: a stern look
    ctx.beginPath(); ctx.moveTo(X(ex - sd * (rx + 0.2)), Y(lo)); ctx.lineTo(X(ex + sd * (rx + 0.2)), Y(li - 0.1)); ctx.lineTo(X(ex + sd * (rx + 0.2)), Y(ey + ry + 0.2)); ctx.lineTo(X(ex - sd * (rx + 0.2)), Y(ey + ry + 0.2)); ctx.closePath();
    ctx.fillStyle = T.body; ctx.fill();
    ctx.beginPath(); ctx.moveTo(X(ex - sd * (rx + 0.2)), Y(lo)); ctx.lineTo(X(ex + sd * (rx + 0.2)), Y(li - 0.1)); outline(0.9);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(X(ex), Y(ey), (rx + 0.05) * u, (ry + 0.05) * u, 0, 0, Math.PI * 2); outline(0.8);
    // the dark line of the face under each eye
    ctx.beginPath(); ctx.moveTo(X(sd * 0.3), Y(ey - 0.85)); ctx.quadraticCurveTo(X(sd * 1.15), Y(ey - 1.1), X(sd * 2.0), Y(ey - 0.55)); outline();
  }
  // small dark beak
  ctx.beginPath(); ctx.moveTo(X(-0.14), Y(ey - 0.35)); ctx.lineTo(X(0.14), Y(ey - 0.35)); ctx.lineTo(X(0.03), Y(ey - 1.0 - lunge * 0.15)); ctx.closePath(); ctx.fillStyle = ink; ctx.fill();
  if (flash) { ctx.globalAlpha = 0.22 * alpha; body(); ctx.fillStyle = '#ffcf8a'; ctx.fill(); }
}

function drawMonster(M, g, o) {
  const T = MONSTERS[M.kind], t = g.time, u = o.s * T.size;
  const atk = clamp(1 - (t - M.anim) / 0.7, 0, 1), lunge = Math.sin(atk * Math.PI);
  let alpha = 1, sink = 0, tilt = 0;
  if (M.dead) { const k = clamp((t - M.deadAt) / 1.1, 0, 1); alpha = 1 - k; sink = k * 2.5; tilt = k * 0.5; }
  if (alpha <= 0) return;
  const breathe = 1 + 0.03 * Math.sin(t * 2.4);
  const X = x => o.x + x * u, Y = y => o.y - (y - sink) * u;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (tilt) { ctx.translate(o.x, o.y); ctx.rotate(tilt); ctx.translate(-o.x, -o.y); }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#15233b'; ctx.lineWidth = Math.max(2, 0.09 * u);
  // shadow
  ctx.fillStyle = 'rgba(10,30,50,0.28)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 3.4 * u, 0.8 * u, 0, 0, Math.PI * 2); ctx.fill();
  if (T.chalk) { drawPajakojad(T, t, u, X, Y, lunge, breathe, t - M.hit < 0.06 && !M.dead, alpha); ctx.restore(); return; }
  if (T.owl) { drawHedwigonna(T, t, u, X, Y, lunge, breathe, t - M.hit < 0.06 && !M.dead, alpha); ctx.restore(); return; }
  const cy = 3.2 + lunge * 0.35, rx = 3.0 * (1 + lunge * 0.05), ry = 2.9 * breathe * (1 + lunge * 0.06);
  // wings
  if (T.wings) {
    const flap = Math.sin(t * 5) * 0.4;
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(X(sd * 1.8), Y(cy + 1.4)); ctx.lineTo(X(sd * 5.4), Y(cy + 3.6 + flap)); ctx.lineTo(X(sd * 4.6), Y(cy + 0.6 + flap));
      ctx.lineTo(X(sd * 3.6), Y(cy + 1.4)); ctx.lineTo(X(sd * 2.9), Y(cy - 0.2)); ctx.closePath();
      ctx.fillStyle = T.dark; ctx.fill(); ctx.stroke();
    }
  }
  // feet and arms
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(X(sd * 1.4), Y(0.35), 0.9 * u, 0.45 * u, 0, 0, Math.PI * 2); ctx.fillStyle = T.dark; ctx.fill(); ctx.stroke();
    const raise = lunge * 1.6;
    ctx.beginPath(); ctx.ellipse(X(sd * 3.0), Y(cy - 0.4 + raise), 0.75 * u, 1.25 * u, sd * (0.5 + lunge * 0.8), 0, Math.PI * 2); ctx.fillStyle = T.body; ctx.fill(); ctx.stroke();
    for (let c = -1; c <= 1; c++) { ctx.beginPath(); ctx.arc(X(sd * 3.2 + c * 0.32), Y(cy - 1.5 + raise * 1.3), 0.18 * u, 0, Math.PI * 2); ctx.fillStyle = '#fff6e0'; ctx.fill(); ctx.stroke(); }
  }
  // horns
  if (T.horns) {
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      if (T.horns === 1) { ctx.moveTo(X(sd * 0.9), Y(cy + ry - 0.3)); ctx.lineTo(X(sd * 1.3), Y(cy + ry + 1.0)); ctx.lineTo(X(sd * 1.7), Y(cy + ry - 0.5)); }
      else { ctx.moveTo(X(sd * 1.0), Y(cy + ry - 0.4)); ctx.quadraticCurveTo(X(sd * 2.6), Y(cy + ry + 0.4), X(sd * 2.4), Y(cy + ry + 1.9)); ctx.quadraticCurveTo(X(sd * 2.0), Y(cy + ry + 0.5), X(sd * 1.9), Y(cy + ry - 0.6)); }
      ctx.closePath(); ctx.fillStyle = '#fff1d6'; ctx.fill(); ctx.stroke();
    }
  }
  // spikes along the back
  if (T.spikes) {
    for (let i = -2; i <= 2; i++) {
      const a0 = -Math.PI / 2 + i * 0.38, bx = Math.cos(a0) * rx, by = -Math.sin(a0) * ry;
      ctx.beginPath(); ctx.moveTo(X(bx - 0.35), Y(cy + by - 0.15)); ctx.lineTo(X(bx * 1.12), Y(cy + by * 1.22 + 0.5)); ctx.lineTo(X(bx + 0.35), Y(cy + by - 0.15)); ctx.closePath();
      ctx.fillStyle = T.light; ctx.fill(); ctx.stroke();
    }
  }
  // body
  ctx.beginPath();
  if (T.fur) {
    for (let i = 0; i <= 40; i++) { const a0 = i / 40 * Math.PI * 2, rr2 = 1 + (i % 2 ? 0.07 : -0.02); const px = X(Math.cos(a0) * rx * rr2), py = Y(cy + Math.sin(a0) * ry * rr2); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath();
  } else ctx.ellipse(X(0), Y(cy), rx * u, ry * u, 0, 0, Math.PI * 2);
  ctx.fillStyle = T.body; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(X(0), Y(cy - 0.9), 1.9 * u, 1.5 * u, 0, 0, Math.PI * 2); ctx.fillStyle = T.light; ctx.fill();
  if (T.spots) { ctx.fillStyle = T.dark; for (const [sx, sy, r] of [[-1.9, 4.6, 0.35], [2.0, 4.3, 0.42], [-2.3, 2.2, 0.3], [2.4, 1.9, 0.28]]) { ctx.beginPath(); ctx.arc(X(sx), Y(sy + lunge * 0.35), r * u, 0, Math.PI * 2); ctx.fill(); } }
  if (T.cracks) { ctx.beginPath(); ctx.moveTo(X(-2.2), Y(4.6)); ctx.lineTo(X(-1.6), Y(4.0)); ctx.lineTo(X(-1.9), Y(3.4)); ctx.moveTo(X(2.0), Y(2.0)); ctx.lineTo(X(1.5), Y(2.6)); ctx.lineTo(X(1.8), Y(3.1)); ctx.strokeStyle = T.dark; ctx.stroke(); ctx.strokeStyle = '#15233b'; }
  if (T.flames) {
    for (let i = -2; i <= 2; i++) {
      const h = 0.9 + 0.4 * Math.sin(t * 9 + i * 1.7);
      ctx.beginPath(); ctx.moveTo(X(i * 0.55 - 0.3), Y(cy + ry - 0.25)); ctx.quadraticCurveTo(X(i * 0.55), Y(cy + ry + h * 1.6), X(i * 0.55 + 0.3), Y(cy + ry - 0.25)); ctx.closePath();
      ctx.fillStyle = i % 2 ? '#ffd23f' : '#ff8a2a'; ctx.fill();
    }
  }
  // eyes look at the army
  const ey = cy + 1.05, eyes = T.eyes === 1 ? [[0, ey + 0.2, 0.95]] : T.eyes === 2 ? [[-0.95, ey, 0.62], [0.95, ey, 0.62]] : [[-1.15, ey - 0.1, 0.5], [0, ey + 0.55, 0.55], [1.15, ey - 0.1, 0.5]];
  const blink = (t % 3.7) < 0.12;
  for (const [ex, eY, er] of eyes) {
    ctx.beginPath(); ctx.ellipse(X(ex), Y(eY), er * u, (blink ? 0.12 : 1) * er * u, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    if (!blink) { ctx.beginPath(); ctx.arc(X(ex), Y(eY - er * 0.3), er * 0.45 * u, 0, Math.PI * 2); ctx.fillStyle = '#15233b'; ctx.fill(); ctx.beginPath(); ctx.arc(X(ex - er * 0.15), Y(eY - er * 0.12), er * 0.14 * u, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(X(ex - er * 1.0), Y(eY + er * 1.05)); ctx.lineTo(X(ex + er * 0.9), Y(eY + er * (ex < 0 ? 0.6 : 1.25) + (ex === 0 ? -0.2 : 0))); ctx.lineWidth = Math.max(2, 0.16 * u); ctx.stroke(); ctx.lineWidth = Math.max(2, 0.09 * u);
  }
  // mouth opens wide when attacking
  const mw = 1.5, mh = 0.35 + lunge * 0.95, my = cy - 0.75;
  ctx.beginPath(); ctx.ellipse(X(0), Y(my), mw * u, mh * u, 0, 0, Math.PI * 2); ctx.fillStyle = '#5b0f1c'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  for (let i = -2; i <= 2; i++) {
    const tx = i * 0.5; ctx.beginPath(); ctx.moveTo(X(tx - 0.2), Y(my + mh * 0.75)); ctx.lineTo(X(tx), Y(my + mh * 0.75 - 0.35)); ctx.lineTo(X(tx + 0.2), Y(my + mh * 0.75)); ctx.closePath(); ctx.fill();
  }
  // flash when hit
  if (t - M.hit < 0.06 && !M.dead) { ctx.globalAlpha = 0.25 * alpha; ctx.beginPath(); ctx.ellipse(X(0), Y(cy), rx * u, ry * u, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.restore();
}

/* ---------- scenery ---------- */
/* ---------- worlds: every topic of a level runs through another place ---------- */
// sky top/bottom, far silhouette, ground gradient, ground marks, road colours, rails, decoration, hole in a broken road
const WORLDS = {
  most: { name: 'Most nad morzem', sky: ['#6fc0f2', '#d9f1ff'], far: ['hills', '#a9cfe8'], ground: ['#79bfe9', '#3b8fd0', '#14589a'], marks: 'waves',
    side: '#e4e6ea', road: '#a9afb8', edge: '#f4f5f7', dash: 'rgba(255,255,255,0.92)', deck: '#a5352b', rail: 'bridge', hole: ['#0d3a66', '#1d5f9c'], splash: ['#7cc4ff', '#ffffff', '#1d5f9c'] },
  las: { name: 'Las', sky: ['#78c4ee', '#e4f6ff'], far: ['hills', '#79ab6e'], ground: ['#8fd16a', '#5fae48', '#3f8c34'], marks: 'grass',
    side: '#8a6a43', road: '#b98f5c', edge: '#e2c69a', dash: 'rgba(255,240,210,0.7)', rail: 'fence', decor: 'tree', hole: ['#24170a', '#3d2a14'], splash: ['#6b4424', '#8fd16a', '#3d2a14'] },
  kanion: { name: 'Kanion', sky: ['#f1a95f', '#ffe3b3'], far: ['mesas', '#d4835a'], ground: ['#eab274', '#d99650', '#b9773c'], marks: 'sand',
    side: '#a87a48', road: '#cfa572', edge: '#f4d8a6', dash: 'rgba(255,245,220,0.75)', rail: 'none', walls: ['#c4683a', '#9e4c27', '#e38c57'], decor: 'cactus', hole: ['#2e170b', '#4e2a15'], splash: ['#e9b071', '#b8743a', '#ffe2b0'] },
  snieg: { name: 'Śnieżne góry', sky: ['#9fd0f3', '#f3f9ff'], far: ['peaks', '#b7cde3'], ground: ['#f6f9fd', '#dfeaf5', '#c4d7ea'], marks: 'snow',
    side: '#e6edf5', road: '#b6c6d8', edge: '#ffffff', dash: 'rgba(255,255,255,0.95)', rail: 'fence', decor: 'pine', hole: ['#12304d', '#2b5276'], splash: ['#ffffff', '#cfe6ff', '#7fb2e0'], fall: 'snow' },
  wulkan: { name: 'Wulkan', sky: ['#2b1220', '#d4502a'], far: ['volcano', '#3d2224'], ground: ['#3d2c2b', '#2a1e1e', '#181212'], marks: 'lava',
    side: '#2b2323', road: '#504747', edge: '#ff7a2a', dash: 'rgba(255,150,60,0.75)', rail: 'none', decor: 'rock', hole: ['#ff5a14', '#ffb02e'], splash: ['#ff6a1a', '#ffd23f', '#ff3a10'], fall: 'embers', lavaGlow: true },
  miasto: { name: 'Miasto nocą', sky: ['#0b1430', '#2e3d72'], far: ['skyline', '#18213f'], ground: ['#1d2438', '#161c2c', '#10141f'], marks: null,
    side: '#5c6274', road: '#383d4c', edge: '#ffd23f', dash: 'rgba(255,255,255,0.7)', rail: 'lamps', decor: 'building', hole: ['#04060b', '#111726'], splash: ['#8a93a8', '#ffffff', '#3a3f4e'], stars: true },
  kosmos: { name: 'Kosmos', sky: ['#04030d', '#1c1142'], far: ['planets'], ground: ['#0b0922', '#0e0a2b', '#120b38'], marks: 'stars',
    side: '#363b52', road: '#565c74', edge: '#3ef0ff', dash: 'rgba(62,240,255,0.7)', rail: 'neon', decor: 'asteroid', hole: ['#000000', '#0e0a2b'], splash: ['#3ef0ff', '#ffffff', '#8a4fd6'], stars: true },
};

// Far scenery on the horizon, fixed to the screen
function drawFar(Wd, hy, W) {
  const [kind, col] = Wd.far;
  ctx.fillStyle = col;
  if (kind === 'hills') {
    ctx.beginPath(); ctx.moveTo(0, hy);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, hy - 6 - 10 * (0.5 + 0.5 * Math.sin(x * 0.013 + 1.3)) * (0.6 + 0.4 * Math.sin(x * 0.031)));
    ctx.lineTo(W, hy); ctx.closePath(); ctx.fill();
  } else if (kind === 'mesas') {
    ctx.beginPath(); ctx.moveTo(0, hy);
    for (let i = 0; i <= 12; i++) {
      const x0 = i / 12 * W, h = 10 + 26 * hash(i + 3), w = W / 12;
      ctx.lineTo(x0 + w * 0.15, hy - h); ctx.lineTo(x0 + w * 0.85, hy - h); ctx.lineTo(x0 + w, hy - 4);
    }
    ctx.lineTo(W, hy); ctx.closePath(); ctx.fill();
  } else if (kind === 'peaks') {
    const pts = [];
    for (let i = 0; i <= 14; i++) pts.push([i / 14 * W, hy - (i % 2 ? 14 + 40 * hash(i * 7.3) : 4 + 10 * hash(i))]);
    ctx.beginPath(); ctx.moveTo(0, hy); for (const [x, y] of pts) ctx.lineTo(x, y); ctx.lineTo(W, hy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let i = 1; i < 14; i += 2) {
      const [x, y] = pts[i], [xa, ya] = pts[i - 1], [xb, yb] = pts[i + 1], k = 0.35;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (xa - x) * k, y + (ya - y) * k); ctx.lineTo(x + (xb - x) * k, y + (yb - y) * k); ctx.closePath(); ctx.fill();
    }
  } else if (kind === 'volcano') {
    const cx = W * 0.62, top = hy - 70;
    ctx.beginPath(); ctx.moveTo(cx - 170, hy); ctx.lineTo(cx - 26, top); ctx.lineTo(cx + 26, top); ctx.lineTo(cx + 190, hy); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, hy); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, hy - 8 - 8 * hash(x)); ctx.lineTo(W, hy); ctx.closePath(); ctx.fill();
    const glow = ctx.createRadialGradient(cx, top, 2, cx, top, 70);
    glow.addColorStop(0, 'rgba(255,200,80,0.9)'); glow.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = glow; ctx.fillRect(cx - 70, top - 70, 140, 100);
  } else if (kind === 'skyline') {
    for (let i = 0; i < 26; i++) {
      const w = W / 22, x = i * w * 0.9 - 10, h = 18 + 60 * hash(i * 3.1);
      ctx.fillStyle = col; ctx.fillRect(x, hy - h, w * 0.8, h);
      ctx.fillStyle = 'rgba(255,214,110,0.55)';
      for (let r = 0; r < h / 9 - 1; r++) for (let c = 0; c < 2; c++) if (hash(i * 31 + r * 7 + c) > 0.55) ctx.fillRect(x + 3 + c * w * 0.35, hy - h + 5 + r * 9, 3, 4);
    }
  } else if (kind === 'planets') {
    const p1 = ctx.createRadialGradient(W * 0.2, hy * 0.35, 4, W * 0.24, hy * 0.42, 60);
    p1.addColorStop(0, '#ffcf8a'); p1.addColorStop(1, '#a8452a');
    ctx.fillStyle = p1; ctx.beginPath(); ctx.arc(W * 0.24, hy * 0.42, 46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,170,0.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(W * 0.24, hy * 0.42, 74, 14, -0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#7fb7ff'; ctx.beginPath(); ctx.arc(W * 0.82, hy * 0.25, 14, 0, Math.PI * 2); ctx.fill();
  }
}
// Stars in a night or space sky, fixed to the screen, twinkling
function drawSkyStars(hy, t) {
  for (let i = 0; i < 70; i++) {
    const x = hash(i * 1.7) * view.w, y = hash(i * 2.9 + 5) * hy;
    ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + i));
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, i % 9 ? 1.5 : 2.5, i % 9 ? 1.5 : 2.5);
  }
  ctx.globalAlpha = 1;
}
// Small marks on the ground beside the road, so the world moves past: waves, grass, sand, snow, lava cracks, stars
function drawMarks(Wd, g) {
  const kind = Wd.marks;
  if (!kind) return;
  const zc0 = Math.floor(view.camZ / 6) * 6, near = kind === 'waves' ? 7.5 : 5.2;
  if (kind === 'waves' || kind === 'lava') {
    ctx.strokeStyle = kind === 'waves' ? 'rgba(255,255,255,0.32)' : `rgba(255,${110 + 40 * Math.sin(g.time * 2) | 0},30,0.75)`;
    ctx.lineCap = 'round'; ctx.lineWidth = kind === 'waves' ? 1.6 : 2.2; ctx.beginPath();
  }
  for (let zc = zc0; zc < view.camZ + 140; zc += 6) {
    for (let j = 0; j < 6; j++) {
      let x = (hash(zc * 0.37 + j * 7.1) - 0.5) * 100; if (Math.abs(x) < near) x += x < 0 ? -near : near;
      const z = zc + hash(zc * 0.71 + j * 3.3) * 6;
      if (!proj(x, 0, z, P0)) continue;
      const l = 0.8 * P0.s;
      if (kind === 'waves') { const wob = Math.sin(g.time * 1.5 + j + zc) * 0.15 * P0.s; ctx.moveTo(P0.x - l + wob, P0.y); ctx.quadraticCurveTo(P0.x + wob, P0.y - l * 0.3, P0.x + l + wob, P0.y); }
      else if (kind === 'lava') { ctx.moveTo(P0.x - l, P0.y); ctx.lineTo(P0.x - l * 0.2, P0.y - l * 0.12); ctx.lineTo(P0.x + l * 0.4, P0.y + l * 0.05); ctx.lineTo(P0.x + l, P0.y - l * 0.1); }
      else if (kind === 'grass') { ctx.fillStyle = j % 2 ? '#4f9a3a' : '#7cc45a'; ctx.fillRect(P0.x - 0.04 * P0.s, P0.y - 0.35 * P0.s, Math.max(1, 0.08 * P0.s), 0.35 * P0.s); ctx.fillRect(P0.x + 0.1 * P0.s, P0.y - 0.25 * P0.s, Math.max(1, 0.07 * P0.s), 0.25 * P0.s); }
      else if (kind === 'sand') { ctx.fillStyle = j % 2 ? '#c98a4a' : '#f3c98c'; ctx.fillRect(P0.x, P0.y, Math.max(1.5, 0.12 * P0.s), Math.max(1, 0.06 * P0.s)); }
      else if (kind === 'snow') { ctx.fillStyle = j % 2 ? '#c9dbee' : '#ffffff'; ctx.beginPath(); ctx.ellipse(P0.x, P0.y, Math.max(1.5, 0.3 * P0.s), Math.max(1, 0.08 * P0.s), 0, 0, Math.PI * 2); ctx.fill(); }
      else if (kind === 'stars') { ctx.fillStyle = j % 3 ? 'rgba(255,255,255,0.8)' : 'rgba(140,200,255,0.9)'; const r = Math.max(1, 0.06 * P0.s); ctx.fillRect(P0.x - r, P0.y - r, r * 2, r * 2); }
    }
  }
  if (kind === 'waves' || kind === 'lava') ctx.stroke();
}
// Canyon walls far on both sides, with a ragged top and layers of rock
function drawCanyonWalls(Wd, zn, zf) {
  for (const sx of [-1, 1]) {
    const x = sx * 9.5;
    ctx.beginPath(); let first = true;
    for (let z = zn; z <= zf; z += 4) { if (!proj(x, 0, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); }
    for (let z = Math.floor(zf / 4) * 4; z >= zn; z -= 4) { const h = 11 + 5 * hash(Math.floor(z / 4) + sx * 50); if (proj(x, h, z, P0)) ctx.lineTo(P0.x, P0.y); }
    ctx.closePath(); ctx.fillStyle = Wd.walls[0]; ctx.fill();
    ctx.strokeStyle = Wd.walls[1]; ctx.lineWidth = 2;
    for (const y of [3, 6.5]) { ctx.beginPath(); first = true; for (let z = zn; z <= zf; z += 4) { if (!proj(x, y + hash(Math.floor(z / 4)) * 0.6, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); } ctx.stroke(); }
  }
}
// Rails along the road: bridge rails, a wooden fence, street lamps or neon posts
function drawRails(Wd, g, zn) {
  const far = view.camZ + 110;
  if (Wd.rail === 'fence') {
    for (const sx of [-4.55, 4.55]) {
      ctx.strokeStyle = '#7a5531'; ctx.lineCap = 'round';
      for (let z = Math.ceil(zn / 3) * 3; z < far; z += 3) {
        if (!proj(sx, 0, z, P0) || !proj(sx, 0.9, z, P1)) continue;
        ctx.lineWidth = Math.max(1.5, 0.14 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
      }
      ctx.beginPath(); let first = true;
      for (let z = zn; z <= far; z += 3) { if (!proj(sx, 0.75, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); }
      ctx.lineWidth = 3; ctx.strokeStyle = '#9b6f42'; ctx.stroke();
    }
  } else if (Wd.rail === 'lamps') {
    ctx.globalCompositeOperation = 'lighter';
    for (let z = Math.ceil(zn / 12) * 12; z < far; z += 12) for (const sx of [-3.6, 3.6]) {
      if (!proj(sx, 0.01, z, P0)) continue;
      ctx.fillStyle = 'rgba(255,214,120,0.16)'; ctx.beginPath(); ctx.ellipse(P0.x, P0.y, 1.8 * P0.s, 0.6 * P0.s, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let z = Math.ceil(zn / 12) * 12; z < far; z += 12) for (const sx of [-4.6, 4.6]) {
      if (!proj(sx, 0, z, P0) || !proj(sx, 4.2, z, P1) || !proj(sx * 0.82, 4.2, z, P2)) continue;
      ctx.strokeStyle = '#2a2f3b'; ctx.lineWidth = Math.max(1.5, 0.12 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.stroke();
      const r = Math.max(2, 0.28 * P2.s), gl = ctx.createRadialGradient(P2.x, P2.y, 0, P2.x, P2.y, r * 3);
      gl.addColorStop(0, 'rgba(255,240,190,1)'); gl.addColorStop(1, 'rgba(255,200,90,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(P2.x, P2.y, r * 3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (Wd.rail === 'neon') {
    ctx.globalCompositeOperation = 'lighter';
    for (const sx of [-4.5, 4.5]) {
      ctx.beginPath(); let first = true;
      for (let z = zn; z <= far; z += 3) { if (!proj(sx, 0.6, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); }
      ctx.strokeStyle = 'rgba(62,240,255,0.35)'; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = 'rgba(200,255,255,0.95)'; ctx.lineWidth = 2; ctx.stroke();
      for (let z = Math.ceil(zn / 4) * 4; z < far; z += 4) {
        if (!proj(sx, 0, z, P0) || !proj(sx, 0.6, z, P1)) continue;
        ctx.strokeStyle = 'rgba(62,240,255,0.7)'; ctx.lineWidth = Math.max(1, 0.08 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

const TOWER_GAP = 80, TOWER_X = 5.25, TOWER_TOP = 16;
function drawBackdrop(g) {
  const Wd = WORLDS[g.world], W = view.w, H = view.h, hy = view.cy - view.F * TANP + view.sy;
  const sky = ctx.createLinearGradient(0, 0, 0, Math.max(1, hy));
  sky.addColorStop(0, Wd.sky[0]); sky.addColorStop(1, Wd.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, Math.max(0, hy) + 1);
  if (Wd.stars) drawSkyStars(hy, g.time);
  drawFar(Wd, hy, W);
  const gr = ctx.createLinearGradient(0, hy, 0, H);
  gr.addColorStop(0, Wd.ground[0]); gr.addColorStop(0.18, Wd.ground[1]); gr.addColorStop(1, Wd.ground[2]);
  ctx.fillStyle = gr; ctx.fillRect(0, hy, W, H - hy);
  drawMarks(Wd, g);

  const zn = view.camZ + 1.0, zf = view.camZ + 175;
  if (Wd.walls) drawCanyonWalls(Wd, zn, zf);
  if (Wd.lavaGlow) for (const sx of [-1, 1]) {        // rivers of lava beside the road
    ground(sx * 6.2, sx * 7.6, zn, zf, 0, `rgba(255,${90 + 30 * Math.sin(g.time * 1.7) | 0},20,0.85)`);
    ground(sx * 6.6, sx * 7.2, zn, zf, 0.005, 'rgba(255,214,90,0.8)');
  }
  if (Wd.deck) { wallX(-4.75, zn, zf, -1.0, 0, Wd.deck); wallX(4.75, zn, zf, -1.0, 0, Wd.deck); }
  ground(-4.75, 4.75, zn, zf, 0, Wd.side);
  ground(-4.35, 4.35, zn, zf, 0, Wd.road);
  ground(-4.0, -3.86, zn, view.camZ + 120, 0.01, Wd.edge);
  ground(3.86, 4.0, zn, view.camZ + 120, 0.01, Wd.edge);
  const d0 = Math.floor(zn / 4) * 4;
  for (let z = d0; z < view.camZ + 110; z += 4) ground(-0.09, 0.09, Math.max(z, zn), z + 2, 0.01, Wd.dash);
  if (g.finishZ < view.camZ + 170 && g.finishZ > view.camZ) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) {
      ground(-4.35 + c * 0.87, -4.35 + (c + 1) * 0.87, g.finishZ + r * 0.8, g.finishZ + (r + 1) * 0.8, 0.02, (r + c) % 2 ? '#15233b' : '#ffffff');
    }
  }
  for (const p of g.props) if (p.kind === 'bridge') drawBridge(p, g);
  if (Wd.rail !== 'bridge') { drawRails(Wd, g, zn); return; }
  for (const sx of [-4.5, 4.5]) {
    ctx.strokeStyle = '#c4372c'; ctx.lineCap = 'butt';
    const p0 = Math.ceil(zn / 1.6) * 1.6;
    for (let z = p0; z < view.camZ + 110; z += 1.6) {
      if (!proj(sx, 0, z, P0) || !proj(sx, 1.0, z, P1)) continue;
      ctx.lineWidth = Math.max(1, 0.09 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
    }
    for (const [ya, yb] of [[0.92, 1.06], [0.46, 0.56]]) {
      ctx.beginPath(); let first = true;
      for (let z = zn; z <= view.camZ + 120; z += 3) { if (!proj(sx, yb, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); }
      for (let z = view.camZ + 120; z >= zn; z -= 3) { if (proj(sx, ya, z, P0)) ctx.lineTo(P0.x, P0.y); }
      ctx.closePath(); ctx.fillStyle = '#d8443a'; ctx.fill();
    }
  }
  ctx.strokeStyle = '#b8382d';
  for (const sx of [-TOWER_X, TOWER_X]) {
    const k0 = Math.floor((zn - 30) / TOWER_GAP);
    ctx.lineWidth = 2.6; ctx.beginPath();
    for (let k = k0; k < k0 + 4; k++) {
      const za = 30 + k * TOWER_GAP, mid = za + TOWER_GAP / 2; let first = true;
      for (let z = Math.max(za, zn); z <= Math.min(za + TOWER_GAP, zf); z += 2) {
        const y = 1.6 + (TOWER_TOP - 1.6) * Math.pow((z - mid) / (TOWER_GAP / 2), 2);
        if (!proj(sx, y, z, P0)) { first = true; continue; }
        if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y);
      }
    }
    ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath();
    for (let z = Math.ceil(zn / 3) * 3; z < view.camZ + 100; z += 3) {
      const k = Math.floor((z - 30) / TOWER_GAP), mid = 30 + k * TOWER_GAP + TOWER_GAP / 2;
      const y = 1.6 + (TOWER_TOP - 1.6) * Math.pow((z - mid) / (TOWER_GAP / 2), 2);
      if (!proj(sx, y, z, P0) || !proj(sx, 1.0, z, P1)) continue;
      ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y);
    }
    ctx.stroke();
  }
}

function drawTower(z) {
  for (const sx of [-TOWER_X, TOWER_X]) {
    const inner = sx < 0 ? sx + 0.5 : sx - 0.5;
    wallX(inner, z, z + 1.1, -6, TOWER_TOP + 0.6, '#9b2f26');
    wallZ(sx - 0.5, sx + 0.5, -6, TOWER_TOP + 0.6, z, '#c63d31');
    if (proj(sx, TOWER_TOP + 0.6, z, P0)) { ctx.fillStyle = '#e0574a'; ctx.fillRect(P0.x - 0.5 * P0.s, P0.y, P0.s, Math.max(1, 0.25 * P0.s)); }
  }
  for (const y of [TOWER_TOP - 4.2, TOWER_TOP - 0.8]) {
    if (proj(-TOWER_X, y, z, P0) && proj(TOWER_X, y, z, P1) && proj(TOWER_X, y, z + 1.1, P2) && proj(-TOWER_X, y, z + 1.1, P3)) poly4('#8e2a22');
    wallZ(-TOWER_X, TOWER_X, y, y + 0.9, z, '#c63d31');
  }
}

function drawGate(gt, g) {
  const z = gt.z, top = 2.5, beam = 3.4;
  const age = gt.done ? g.time - gt.t : 0;
  const fade = gt.done ? clamp(1 - (age - 0.6) / 0.6, 0, 1) : 1;
  if (fade <= 0) return;
  ctx.globalAlpha = fade;
  for (let side = 0; side < 2; side++) {
    const isLeft = side === 0, x0 = isLeft ? -ROAD : 0.06, x1 = isLeft ? -0.06 : ROAD;
    let fill = 'rgba(70,165,255,0.45)';
    if (gt.done) fill = isLeft === gt.choseLeft ? (gt.ok ? 'rgba(40,200,105,0.7)' : 'rgba(235,65,55,0.7)') : 'rgba(70,165,255,0.2)';
    if (!wallZ(x0, x1, 0, top, z, fill, 'rgba(255,255,255,0.95)', 0)) continue;
    ctx.lineWidth = Math.max(1.5, 0.07 * P0.s); ctx.stroke();
    const w = P1.x - P0.x;
    if (!proj((x0 + x1) / 2, top * 0.52, z, P4)) continue;
    drawRich(!gt.shown ? '?' : isLeft === gt.left ? gt.p.a : gt.p.w, P4.x, P4.y, 1.25 * P4.s, '#ffffff', '#15233b', w * 0.86);
  }
  for (const px of [-ROAD - 0.12, 0, ROAD + 0.12]) wallZ(px - 0.12, px + 0.12, 0, beam, z, '#f1f3f6', '#15233b', 1);
  if (wallZ(-ROAD - 0.25, ROAD + 0.25, top + 0.05, beam, z, '#ffc531', '#15233b', 1.5) && proj(0, (top + beam) / 2 + 0.02, z, P4)) {
    const bw = P1.x - P0.x, bh = P0.y - P3.y;
    drawRich(gt.shown ? gt.p.q : 'Najpierw wrogowie', P4.x, P4.y, Math.min(bh * 0.62, 0.55 * P4.s), '#15233b', null, bw * 0.9);
    if (!gt.done && proj(ROAD - 0.3, beam + 0.55, z, P4)) {
      const fs = clamp(0.62 * P4.s, 10, 26);
      outlined('+' + gt.r, P4.x, P4.y, fs, '#4be08a', '#0d4a26');
    }
  }
  ctx.globalAlpha = 1;
}

// Number of hits still needed, and what you get, above a thing at the side of the road
function propLabels(p, g, top) {
  if (p.z - g.army.z > 48 || !proj(p.x, top, p.z, P4)) return;
  const s = P4.s;
  outlined(String(Math.ceil(p.hp)), P4.x, P4.y - 0.3 * s, clamp(0.7 * s, 12, 34), '#ffffff', '#15233b');
  const what = p.kind === 'cage' ? '+' + p.reward : g.weapon < MAX_WEAPON ? WEAPONS[g.weapon + 1].name : '+10';
  outlined(what, P4.x, P4.y - 0.95 * s, clamp(0.45 * s, 10, 22), p.kind === 'cage' || g.weapon >= MAX_WEAPON ? '#4be08a' : '#ffd23f', '#15233b');
}
// A cage with prisoners waving from inside: shoot it open and they join the army
function drawCage(p, g) {
  const x0 = p.x - 0.7, x1 = p.x + 0.7, z0 = p.z, z1 = p.z + 1.0, h = 1.5, lit = g.time - p.hit < 0.06;
  ground(x0, x1, z0, z1, 0.02, '#5b3d22');
  for (const [dx, dz] of [[-0.33, 0.55], [0.33, 0.6], [0, 0.3]]) {
    if (!proj(p.x + dx, 0.05, p.z + dz, P0)) continue;
    const hh = 0.95 * P0.s * 0.8, ww = hh * SW / SH;
    ctx.drawImage(armySprite(save.skin, ((g.time * 4 + dx * 9) | 0) & 3), P0.x - ww / 2, P0.y - hh, ww, hh);
  }
  if (proj(x0, h, z0, P0) && proj(x1, h, z0, P1) && proj(x1, h, z1, P2) && proj(x0, h, z1, P3)) poly4('rgba(120,86,52,0.92)', '#15233b', 1);
  ctx.strokeStyle = lit ? '#ffe28a' : '#8c96a3'; ctx.lineCap = 'round';
  for (let i = 0; i <= 6; i++) {
    const bx = x0 + (x1 - x0) * i / 6;
    if (!proj(bx, 0, z0, P0) || !proj(bx, h, z0, P1)) continue;
    ctx.lineWidth = Math.max(1.5, 0.08 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
  }
  wallZ(x0, x1, h - 0.16, h, z0, lit ? '#ffe28a' : '#6b7480', '#15233b', 1);
  wallZ(x0, x1, 0, 0.14, z0, '#6b7480', '#15233b', 1);
  propLabels(p, g, h + 0.6);
}
// A crate with a better weapon inside
function drawCrate(p, g) {
  const x0 = p.x - 0.65, x1 = p.x + 0.65, z0 = p.z, z1 = p.z + 1.1, h = 1.2, lit = g.time - p.hit < 0.06;
  const side = view.camX < p.x ? x0 : x1;
  wallX(side, z0, z1, 0, h, lit ? '#a8c47a' : '#46602b');
  if (proj(x0, h, z0, P0) && proj(x1, h, z0, P1) && proj(x1, h, z1, P2) && proj(x0, h, z1, P3)) poly4(lit ? '#d4ec9e' : '#86a85a', '#15233b', 1);
  if (!wallZ(x0, x1, 0, h, z0, lit ? '#c4e08e' : '#5d7a3a', '#15233b', 1.5)) return;
  ctx.lineWidth = Math.max(1, 0.06 * P0.s);
  wallZ(x0 + 0.08, x1 - 0.08, h * 0.42, h * 0.58, z0, '#ffd23f', '#15233b', 1);
  if (proj(p.x, h * 0.5, z0, P4)) outlined('★', P4.x, P4.y, clamp(0.55 * P4.s, 10, 26), '#ffd23f', '#15233b');
  propLabels(p, g, h + 0.6);
}
// A broken piece of the road: every hit lays another plank; finished, it gives a power for the rest of the game
const PLANKS = 12;
function drawBridge(p, g) {
  if (p.done && !p.lost && g.time - p.doneAt > 3) { /* fully built, stays as a plain road */ }
  const x0 = p.x - PROP_W.bridge, x1 = p.x + PROP_W.bridge, z0 = p.z, z1 = p.z + BRIDGE_L;
  if (z1 < view.camZ + 1) return;
  const built = p.done && !p.lost ? PLANKS : Math.floor((1 - p.hp / p.max) * PLANKS);
  if (built < PLANKS) {
    const [h0, h1] = WORLDS[g.world].hole;
    ground(x0, x1, Math.max(z0, view.camZ + 1), z1, 0.012, h0);
    ground(x0 + 0.08, x1 - 0.08, Math.max(z0, view.camZ + 1), z1, 0.014, h1);
  }
  const pl = BRIDGE_L / PLANKS, lit = g.time - p.hit < 0.06;
  for (let i = 0; i < built; i++) {
    const za = z0 + i * pl + 0.05, zb = z0 + (i + 1) * pl - 0.05;
    if (zb < view.camZ + 1) continue;
    ground(x0 + 0.04, x1 - 0.04, za, zb, 0.03, i === built - 1 && lit ? '#ffd9a0' : i % 2 ? '#c58a4a' : '#b37a3d');
  }
  for (const ex of [x0, x1]) ground(ex - 0.05, ex + 0.05, Math.max(z0, view.camZ + 1), z1, 0.035, '#6b4424');
}
/* ---------- obstacles: a burning bus or lorry, a hammer falling from above, burning barrels ---------- */
// A burning bus or lorry standing on one half of the road: steer to the other half
const sideFace = (x, z0, z1, y0, y1, fill, lw) => { if (proj(x, y0, z0, P0) && proj(x, y0, z1, P1) && proj(x, y1, z1, P2) && proj(x, y1, z0, P3)) { poly4(fill, '#15233b', lw); return true; } return false; };
const topFace = (x0, x1, z0, z1, y, fill, lw) => { if (proj(x0, y, z0, P0) && proj(x1, y, z0, P1) && proj(x1, y, z1, P2) && proj(x0, y, z1, P3)) poly4(fill, '#15233b', lw); };
function fireAt(x, y, z, size, t, k) {
  if (!proj(x, y, z, P4)) return;
  const w = size * P4.s, cx = P4.x, base = P4.y;
  const flame = (dx, hgt, col, ph) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx + dx - w * 0.32, base);
    ctx.quadraticCurveTo(cx + dx - w * 0.36, base - hgt * 0.55, cx + dx + Math.sin(t * 11 + ph) * w * 0.12, base - hgt);
    ctx.quadraticCurveTo(cx + dx + w * 0.36, base - hgt * 0.55, cx + dx + w * 0.32, base); ctx.closePath(); ctx.fill();
  };
  flame(-w * 0.25, w * (1.3 + 0.3 * Math.sin(t * 8 + k)), '#ff5a1a', k);
  flame(w * 0.25, w * (1.15 + 0.3 * Math.sin(t * 9.5 + k * 2)), '#ff5a1a', k + 1);
  flame(0, w * (1.55 + 0.25 * Math.sin(t * 12 + k * 3)), '#ffa726', k + 2);
  flame(0, w * 0.8, '#fff1a8', k + 3);
}
function smokeAt(x, y, z, t, k) {
  for (let i = 0; i < 6; i++) {
    const ph = (t * 0.4 + i / 6 + k * 0.13) % 1;
    if (!proj(x + Math.sin(ph * 5 + k + i) * 0.7, y + ph * 5.5, z + ph * 2, P4)) continue;
    ctx.globalAlpha = 0.55 * (1 - ph); ctx.fillStyle = i % 2 ? '#2f3238' : '#4b4f57';
    ctx.beginPath(); ctx.arc(P4.x, P4.y, (0.45 + ph * 1.2) * P4.s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function signText(text, x, y, z, size, fill, stroke) { if (proj(x, y, z, P4)) outlined(text, P4.x, P4.y, clamp(size * P4.s, 8, 40), fill, stroke); }
function drawCar(o, g) {
  const sd = o.side, x0 = sd > 0 ? CAR_X0 : -CAR_X1, x1 = sd > 0 ? CAR_X1 : -CAR_X0, z0 = o.z, t = g.time, lw = 1.2;
  const seen = view.camX < x0 ? x0 : view.camX > x1 ? x1 : null;     // the long side facing the middle of the road
  const xc = (x0 + x1) / 2, glow = `rgb(255,${150 + 40 * Math.sin(t * 7) | 0},60)`, len = CAR[o.type].len;
  // the fire lights up the road around it
  if (proj(xc, 0.02, z0 + len / 2, P4)) {
    const r = (len * 0.75) * P4.s, grd = ctx.createRadialGradient(P4.x, P4.y, 0, P4.x, P4.y, r);
    grd.addColorStop(0, `rgba(255,140,40,${0.45 + 0.1 * Math.sin(t * 6)})`); grd.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(P4.x, P4.y, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  }
  const wheels = zs => { if (seen === null) return; for (const wz of zs) if (proj(seen, 0.42, wz, P4)) { ctx.fillStyle = '#1b1d22'; ctx.beginPath(); ctx.ellipse(P4.x, P4.y, 0.24 * P4.s, 0.44 * P4.s, 0, 0, Math.PI * 2); ctx.fill(); } };
  const windows = (za, zb, y0, y1, n) => { if (seen === null) return; for (let i = 0; i < n; i++) { const wa = za + (zb - za) * (i + 0.12) / n, wb = za + (zb - za) * (i + 0.88) / n; sideFace(seen, wa, wb, y0, y1, glow, 1); } };
  const front = (y1, body, dark) => {                                    // wheels, mirrors, lights and bumper of a front
    for (const wx of [x0 + 0.25, x1 - 0.75]) wallZ(wx, wx + 0.5, 0, 0.42, z0 + 0.5, '#1b1d22', null, 0);
    for (const mx of [x0 - 0.22, x1 + 0.02]) wallZ(mx, mx + 0.2, y1 - 1.1, y1 - 0.55, z0 + 0.1, dark, '#15233b', 1);
    wallZ(x0, x1, 0.3, y1, z0, body, '#15233b', lw);
    wallZ(x0, x1, 0.3, 0.55, z0, '#1b1d22', null, 0);
    for (const hx of [x0 + 0.3, x1 - 0.55]) wallZ(hx, hx + 0.25, 0.65, 0.88, z0, '#ffe08a', '#15233b', 1);
  };
  if (o.type === 'bus') {
    const z1 = z0 + len, h = CAR.bus.h;
    if (seen !== null) sideFace(seen, z0, z1, 0.3, h, '#b8352a', lw);
    windows(z0 + 0.4, z1 - 0.2, 1.4, 2.4, 5);
    wheels([z0 + 1.0, z1 - 1.0]);
    topFace(x0, x1, z0, z1, h, '#4a1a14', lw);
    front(h, '#d63a2f', '#7a1f14');
    wallZ(x0 + 0.2, xc - 0.04, 1.3, 2.45, z0, glow, '#15233b', 1.2);         // two panes of the windscreen, fire behind them
    wallZ(xc + 0.04, x1 - 0.2, 1.3, 2.45, z0, glow, '#15233b', 1.2);
    wallZ(x0 + 0.35, x1 - 0.35, 2.55, 2.88, z0, '#1b1d22', null, 0);           // the destination sign
    signText('AUTOBUS', xc, 2.72, z0, 0.32, '#ffb02e', '#1b1d22');
    wallZ(x0 + 0.3, x1 - 0.3, 0.95, 1.1, z0, '#ffffff', null, 0);              // white stripe
    for (let i = 0; i < 3; i++) fireAt(xc + (i - 1) * 0.6, h, z0 + 0.8 + i * 1.6, 0.8, t, i);
    fireAt(xc - 0.4, 2.2, z0 + 0.05, 0.45, t, 5);                             // flames out of the windscreen
    smokeAt(xc, h + 1.2, z0 + 2.2, t, 0);
  } else {
    const zc = z0 + 2.3, z1 = z0 + len, h = CAR.truck.h, hc = 2.7;
    if (seen !== null) sideFace(seen, zc + 0.15, z1, 0.5, h, '#d9dee5', lw);   // the trailer, further away
    if (seen !== null) { sideFace(seen, zc + 1.2, z1 - 0.8, 1.5, 2.5, '#2f5fb8', 1); }
    wheels([zc + 1.3, z1 - 1.5, z1 - 0.7]);
    topFace(x0, x1, zc + 0.15, z1, h, '#8f979f', lw);
    wallZ(x0, x1, 0.5, h, zc + 0.15, '#c3cad2', '#15233b', lw);
    wallZ(xc - 0.75, xc + 0.75, hc + 0.2, h - 0.15, zc + 0.15, '#2f5fb8', '#15233b', 1);   // the blue TIR plate, seen above the cab
    signText('TIR', xc, (hc + h) / 2 + 0.02, zc + 0.15, 0.55, '#ffffff', '#1d3f80');
    if (seen !== null) sideFace(seen, z0, zc, 0.3, hc, '#2f5fb8', lw);       // the cab in front
    windows(z0 + 0.3, zc - 0.5, 1.5, 2.3, 1);
    wheels([z0 + 0.9]);
    topFace(x0, x1, z0, zc, hc, '#1d3f80', lw);
    front(hc, '#3b6fd0', '#1d3f80');
    wallZ(x0 + 0.2, x1 - 0.2, 1.45, 2.4, z0, glow, '#15233b', 1.2);
    wallZ(x0 + 0.45, x1 - 0.45, 0.6, 1.25, z0, '#1b1d22', null, 0);           // grille
    for (let i = 1; i < 4; i++) wallZ(x0 + 0.5, x1 - 0.5, 0.6 + i * 0.16, 0.65 + i * 0.16, z0, '#6b7480', null, 0);
    for (let i = 0; i < 4; i++) fireAt(xc + (i % 2 ? 0.55 : -0.55), h, zc + 0.9 + i * 1.2, 0.85, t, i);
    fireAt(xc, hc, z0 + 0.9, 0.6, t, 7);
    smokeAt(xc, h + 1.2, zc + 2.5, t, 1);
  }
}
// height of the hammer's head: it falls fast, stays down a moment, rises slowly and waits
function hammerY(o, t) {
  const ph = (t + o.off) % HAMMER_P;
  return ph < 0.08 ? 3.4 * (1 - (ph / 0.08) ** 2) : ph < 0.4 ? 0 : ph < 1.3 ? 3.4 * Math.sin((ph - 0.4) / 0.9 * Math.PI / 2) : 3.4;
}
function drawHammer(o, g) {
  const W = HAMMER_W, x0 = o.x - W, x1 = o.x + W, z = o.z, y = hammerY(o, g.time), top = 5.6, zb = z + 0.6;
  if (proj(o.x, 0.02, zb, P0)) {
    ctx.fillStyle = `rgba(10,20,30,${0.12 + 0.3 * (1 - y / 3.4)})`;
    ctx.beginPath(); ctx.ellipse(P0.x, P0.y, W * P0.s * 1.05, W * P0.s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
  for (const px of [x0 - 0.4, x1 + 0.4]) wallZ(px - 0.14, px + 0.14, 0, top, zb, '#5d6676', '#15233b', 1);
  if (wallZ(x0 - 0.6, x1 + 0.6, top - 0.45, top, zb, '#ffc531', '#15233b', 1.5)) {
    for (let i = 0; i < 6; i++) { const xa = x0 - 0.6 + (x1 - x0 + 1.2) * (i + 0.25) / 6; wallZ(xa, xa + 0.22, top - 0.43, top - 0.02, zb, '#15233b', null, 0); }
  }
  wallZ(o.x - 0.13, o.x + 0.13, y + 1.1, top - 0.45, zb, '#aab3c2', '#15233b', 1);
  wallX(view.camX < o.x ? x0 : x1, z, z + 1.2, y, y + 1.1, '#4f5866');
  if (proj(x0, y + 1.1, z, P0) && proj(x1, y + 1.1, z, P1) && proj(x1, y + 1.1, z + 1.2, P2) && proj(x0, y + 1.1, z + 1.2, P3)) poly4('#8e98a7', '#15233b', 1);
  wallZ(x0, x1, y, y + 1.1, z, '#6b7480', '#15233b', 1.5);
  // dust and a thump at every blow, when the army is near enough to hear it
  const cyc = Math.floor((g.time + o.off) / HAMMER_P);
  if (y === 0 && o.fxAt !== cyc) {
    o.fxAt = cyc;
    rings.push({ x: o.x, z: zb, t: 0, size: 3, c: 'rgba(255,255,255,0.8)' });
    if (Math.abs(o.z - g.army.z) < 26 && g.state === 'run') Snd.thud();
  }
}
function drawBarrel(br, o, g) {
  const r = 0.42, h = 1.0, z = o.z, lit = g.time - br.hit < 0.06;
  if (!proj(br.x - r, 0, z, P0) || !proj(br.x + r, 0, z, P1) || !proj(br.x, h, z, P2)) return;
  const w = P1.x - P0.x, top = P2.y, bot = (P0.y + P1.y) / 2, cx = (P0.x + P1.x) / 2, lw = Math.max(1.5, 0.06 * P0.s);
  ctx.strokeStyle = '#15233b'; ctx.lineWidth = lw; ctx.fillStyle = lit ? '#ff8a6a' : '#c0392b';
  ctx.beginPath(); ctx.moveTo(cx - w / 2, top); ctx.lineTo(cx - w / 2, bot); ctx.ellipse(cx, bot, w / 2, w * 0.18, 0, Math.PI, 0, true); ctx.lineTo(cx + w / 2, top); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#8b969e'; ctx.lineWidth = Math.max(2, 0.08 * P0.s);
  for (const k of [0.28, 0.72]) { ctx.beginPath(); ctx.ellipse(cx, bot + (top - bot) * k, w / 2 - 1, w * 0.13, 0, 0, Math.PI); ctx.stroke(); }
  ctx.fillStyle = '#7a1f14'; ctx.strokeStyle = '#15233b'; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(cx, top, w / 2, w * 0.18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const t = g.time, H = w * 1.15;
  const flame = (k, dx, hgt, col) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx + dx - w * 0.2, top);
    ctx.quadraticCurveTo(cx + dx - w * 0.22, top - hgt * 0.5, cx + dx + Math.sin(t * 12 + k) * w * 0.08, top - hgt);
    ctx.quadraticCurveTo(cx + dx + w * 0.22, top - hgt * 0.5, cx + dx + w * 0.2, top); ctx.closePath(); ctx.fill();
  };
  flame(0, -w * 0.16, H * (0.8 + 0.2 * Math.sin(t * 9)), '#ff6a1a'); flame(1, w * 0.16, H * (0.7 + 0.2 * Math.sin(t * 11 + 1)), '#ff6a1a');
  flame(2, 0, H * (0.95 + 0.15 * Math.sin(t * 13 + 2)), '#ffb02e'); flame(3, 0, H * 0.5, '#fff2a8');
  if (o.z - g.army.z < 40) outlined(String(Math.ceil(br.hp)), cx, top - H - 0.3 * P0.s, clamp(0.5 * P0.s, 10, 22), '#ffffff', '#15233b');
}

// Labels for a bridge (drawn above the soldiers): hits needed and the power it gives
function drawBridgeLabels(p, g) {
  if (p.done) return;
  if (!proj(p.x, 0.4, p.z + BRIDGE_L * 0.5, P4)) return;
  const s = P4.s;
  outlined(String(Math.ceil(p.hp)), P4.x, P4.y, clamp(0.8 * s, 12, 36), '#ffffff', '#15233b');
  if (proj(p.x, 0.6, p.z + BRIDGE_L + 0.2, P4)) bubble(P4.x, P4.y, POWERS[p.power].name, '#8a4fd6', clamp(0.42 * P4.s, 10, 18));
}

/* ---------- scenery beside the road in every world, drawn once as pictures ---------- */
const DECOR = {
  tree: { h: 5.2, xs: [5.6, 13], n: 2 }, pine: { h: 5.8, xs: [5.6, 13], n: 2 }, cactus: { h: 3.0, xs: [5.4, 9], n: 2 },
  rock: { h: 1.8, xs: [8.2, 14], n: 2 }, asteroid: { h: 2.2, xs: [6, 15], n: 2, float: true },
};
function makeDecor(kind, v) {
  const c = document.createElement('canvas'); c.width = 120; c.height = 180;
  const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 4; x.strokeStyle = '#15233b';
  const blob = (path, fill) => { x.beginPath(); path(); x.fillStyle = fill; x.fill(); x.stroke(); };
  if (kind === 'tree') {
    blob(() => rr(x, 52, 110, 16, 66, 5), '#7a4a26');
    const g1 = v ? '#4f9e3c' : '#62b348', g2 = v ? '#3b7f2e' : '#4b9638';
    blob(() => { x.arc(40, 90, 30, 0, 7); }, g2); blob(() => { x.arc(80, 88, 30, 0, 7); }, g2); blob(() => { x.arc(60, 55, 40, 0, 7); }, g1);
    x.fillStyle = 'rgba(255,255,255,0.25)'; x.beginPath(); x.arc(50, 40, 12, 0, 7); x.fill();
  } else if (kind === 'pine') {
    blob(() => rr(x, 54, 140, 12, 36, 4), '#6b4424');
    const green = v ? '#2f6f4a' : '#3d8158';
    for (const [y, w] of [[150, 52], [112, 42], [76, 32]]) {
      blob(() => { x.moveTo(60, y - 52); x.lineTo(60 + w, y); x.lineTo(60 - w, y); x.closePath(); }, green);
      x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(60, y - 52); x.lineTo(60 + w * 0.42, y - 30); x.lineTo(60 - w * 0.42, y - 30); x.closePath(); x.fill();
    }
  } else if (kind === 'cactus') {
    if (v) {   // a sandstone boulder
      blob(() => { x.moveTo(14, 176); x.quadraticCurveTo(10, 120, 50, 112); x.quadraticCurveTo(100, 104, 108, 176); x.closePath(); }, '#c98a4a');
      x.strokeStyle = '#a0662f'; x.beginPath(); x.moveTo(30, 150); x.lineTo(90, 146); x.stroke();
    } else {
      const g = '#4f9e3c';
      blob(() => rr(x, 46, 30, 28, 146, 14), g);
      blob(() => { rr(x, 14, 80, 20, 50, 10); }, g); blob(() => rr(x, 14, 116, 40, 18, 9), g);
      blob(() => { rr(x, 88, 60, 20, 56, 10); }, g); blob(() => rr(x, 66, 104, 42, 18, 9), g);
      x.strokeStyle = '#2f6f28'; x.lineWidth = 2; x.beginPath(); x.moveTo(60, 40); x.lineTo(60, 170); x.stroke();
    }
  } else if (kind === 'rock') {
    blob(() => { x.moveTo(8, 176); x.lineTo(22, 120); x.lineTo(58, 100); x.lineTo(100, 118); x.lineTo(114, 176); x.closePath(); }, v ? '#3a3030' : '#4a3d3b');
    x.strokeStyle = '#ff7a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(36, 170); x.lineTo(50, 140); x.lineTo(64, 150); x.lineTo(76, 124); x.stroke();
  } else if (kind === 'asteroid') {
    blob(() => { x.moveTo(20, 120); x.lineTo(30, 72); x.lineTo(70, 56); x.lineTo(104, 80); x.lineTo(108, 128); x.lineTo(70, 160); x.lineTo(32, 152); x.closePath(); }, v ? '#7d7f96' : '#9a93a8');
    x.fillStyle = 'rgba(21,35,59,0.35)'; for (const [cx, cy, r] of [[50, 96, 12], [80, 124, 9], [76, 84, 6]]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }
  }
  return c;
}
const decorImg = {};
const decorSprite = (kind, v) => (decorImg[kind + v] = decorImg[kind + v] || makeDecor(kind, v));
const DECOR_STEP = 5;
// Lists the scenery near the camera for the far-to-near drawing
function listDecor(g) {
  const Wd = WORLDS[g.world];
  if (Wd.decor === 'building') return listBuildings();
  const D = DECOR[Wd.decor];
  if (!D) return;
  const k0 = Math.floor(view.camZ / DECOR_STEP);
  for (let k = k0; k < k0 + 34; k++) for (const sx of [-1, 1]) for (let j = 0; j < 2; j++) {
    const h = hash(k * 13.1 + sx * 3.7 + j * 29.3);
    if (h < 0.35) continue;
    const z = (k + hash(k * 7.7 + sx + j * 5.1)) * DECOR_STEP, x = sx * (D.xs[0] + (D.xs[1] - D.xs[0]) * hash(k * 3.3 + sx * 9.1 + j * 1.7));
    const y = D.float ? 1 + 2.5 * hash(k + j) + 0.3 * Math.sin(g.time + k) : 0;
    if (z < view.camZ + 1 || !proj(x, y, z, P0)) continue;
    if (P0.x < -150 || P0.x > view.w + 150) continue;
    const o = item(6, P0.d); o.x = P0.x; o.y = P0.y; o.s = P0.s * D.h * (0.8 + 0.4 * h); o.img = decorSprite(Wd.decor, (k + j) & 1);
  }
}
// City blocks with lit windows on both sides of the road
const BLOCK = 10;
function listBuildings() {
  const k0 = Math.floor(view.camZ / BLOCK);
  for (let k = k0; k < k0 + 17; k++) for (const sx of [-1, 1]) {
    const z0 = k * BLOCK + 1, z1 = z0 + 6 + 2 * hash(k * 5 + sx), xi = sx * 6.2;
    if (z1 < view.camZ + 1 || !proj(xi, 0, Math.max(z0, view.camZ + 1.2), P0)) continue;
    const o = item(7, P0.d); o.sx = sx; o.z0 = z0; o.z1 = z1; o.bk = k;
    o.h = 6 + 18 * hash(k * 11.3 + sx * 2.1); o.w = 4 + 3 * hash(k * 2.9 + sx);
  }
}
function drawBuilding(o) {
  const { sx, z1, h, w } = o, z0 = Math.max(o.z0, view.camZ + 1.2), xi = sx * 6.2, xo = sx * (6.2 + w);
  const tone = 30 + Math.round(20 * hash(o.bk * 1.7 + sx)), wall = `rgb(${tone},${tone + 8},${tone + 34})`, front = `rgb(${tone + 14},${tone + 22},${tone + 50})`;
  wallX(xi, z0, z1, 0, h, wall);
  if (h < CAM_H && proj(xi, h, z0, P0) && proj(xo, h, z0, P1) && proj(xo, h, z1, P2) && proj(xi, h, z1, P3)) poly4(`rgb(${tone + 24},${tone + 30},${tone + 58})`);
  wallZ(Math.min(xi, xo), Math.max(xi, xo), 0, h, z0, front);
  // windows on the side facing the road
  for (let r = 1.2; r < h - 0.8; r += 1.7) for (let zz = z0 + 0.6; zz < z1 - 0.5; zz += 1.5) {
    if (hash(o.bk * 97 + r * 13 + zz * 7 + sx) < 0.45) continue;
    if (!proj(xi, r, zz, P0) || !proj(xi, r + 0.8, zz + 0.7, P1)) continue;
    ctx.fillStyle = hash(r * 3 + zz) > 0.3 ? '#ffd86e' : '#9fd8ff';
    ctx.fillRect(Math.min(P0.x, P1.x), P1.y, Math.max(1, Math.abs(P1.x - P0.x)), Math.max(1, P0.y - P1.y));
  }
}

/* ---------- drawing list sorted far to near ---------- */
const pool = []; let pn = 0; const order = [];
function item(kind, d) { let o = pool[pn]; if (!o) o = pool[pn] = {}; pn++; o.k = kind; o.d = d; return o; }
const byDepth = (p, q) => q.d - p.d;

// spr: the enemy's pictures (none for soldiers); fly: height above the road (the shadow stays on the road); m: the enemy (fire, ice, poison on it)
function addSoldier(team, x, z, frame, sc, spr, fly, m) {
  if (!proj(x, 0, z, P0)) return;
  if (P0.y > view.h + 80 || P0.y < -80 || P0.x < -60 || P0.x > view.w + 60) return;
  const o = item(0, P0.d); o.team = team; o.x = P0.x; o.y = P0.y; o.s = P0.s * sc; o.f = frame; o.spr = spr || null; o.m = m || null;
  const rx = 0.34 * P0.s * sc, ry = 0.14 * P0.s * sc;
  ctx.moveTo(P0.x + rx, P0.y); ctx.ellipse(P0.x, P0.y, rx, ry, 0, 0, Math.PI * 2);
  if (fly && proj(x, fly, z, P1)) o.y = P1.y;
}

// What the upgrades do to an enemy: a block of ice, a bluish cold, flames over the head, green poison bubbles
function drawStatus(m, x, y, w, h, t) {
  if (m.frz > t) {
    ctx.beginPath(); rr(ctx, x - w * 0.56, y - h * 1.03, w * 1.12, h * 1.06, Math.max(2, w * 0.18));
    ctx.fillStyle = 'rgba(170,225,255,0.55)'; ctx.fill(); ctx.lineWidth = Math.max(1, h * 0.04); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w * 0.36, y - h * 0.85); ctx.lineTo(x - w * 0.12, y - h * 0.95); ctx.stroke();
  } else if (m.slow > t) {           // cold: a small snowflake dot over the head
    ctx.fillStyle = '#bfe6ff'; ctx.strokeStyle = '#2a78b8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x + w * 0.3, y - h * 0.95, Math.max(2, w * 0.12), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  if (m.burn > t) {
    const f = 0.8 + 0.25 * Math.sin(t * 22 + m.ph * 3), fx = x + Math.sin(t * 9 + m.ph) * w * 0.06, fy = y - h * 0.92, r = Math.max(2, w * 0.22) * f;
    ctx.fillStyle = '#ff6a1f'; ctx.beginPath(); ctx.moveTo(fx, fy - r * 2.2); ctx.quadraticCurveTo(fx + r * 1.2, fy - r * 0.4, fx, fy + r * 0.5); ctx.quadraticCurveTo(fx - r * 1.2, fy - r * 0.4, fx, fy - r * 2.2); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(fx, fy - r * 1.3); ctx.quadraticCurveTo(fx + r * 0.6, fy - r * 0.1, fx, fy + r * 0.3); ctx.quadraticCurveTo(fx - r * 0.6, fy - r * 0.1, fx, fy - r * 1.3); ctx.fill();
  }
  if (m.pt > t && m.ps) {
    ctx.fillStyle = '#7be35a'; ctx.strokeStyle = '#1f5a12'; ctx.lineWidth = 1;
    for (let i = 0; i < Math.min(3, m.ps); i++) {
      const k = (t * 0.9 + i / 3 + m.ph) % 1, bx = x + (i - 1) * w * 0.28, by = y - h * (0.7 + 0.5 * k), r = Math.max(1.5, w * 0.09) * (1 - 0.4 * k);
      ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawEntities(g) {
  pn = 0;
  const a = g.army, t = g.time, moving = g.state === 'run' || g.state === 'won' || g.attract;
  ctx.beginPath();     // collects ground shadows while soldiers are listed
  const an = Math.min(a.n, CAP), sq = squeeze(a.n), big = g.giant ? 1.35 : 1;
  for (let i = 0; i < an; i++) {
    const age = t - a.born[i];
    const sc = (age < 0.35 ? Math.max(0.05, backOut(age / 0.35)) : 1) * big;
    addSoldier(0, clamp(a.x + OX[i] * sq * big, -3.95, 3.95), a.z + OZ[i] * big, moving ? ((t * 9 + i * 0.73) | 0) & 3 : ((t * 3 + i) | 0) & 1, sc);
  }
  for (const s of g.squads) {
    if (!s.active) continue;                         // enemies jump out a moment after the gate
    const F = FOES[s.kind], pop = clamp((t - s.born) / 0.45, 0, 1), k = pop < 1 ? Math.max(0.05, backOut(pop)) : 1;
    const fly = F.fly ? 1.3 + 0.25 * Math.sin(t * 8 + s.ph) : 0;
    for (const m of s.men) addSoldier(1, s.x + m.ox, s.z + m.oz, m.frz > t ? 0 : ((t * (F.fly ? 14 : 6) + m.ph) | 0) & 3, (m.big ? 1.75 : F.sc) * k, FOE_SPR[s.kind][m.big ? 1 : 0], fly, m);
  }
  ctx.fillStyle = 'rgba(10,30,50,0.22)'; ctx.fill();

  for (const gt of g.gates) if (gt.z > view.camZ + 1 && gt.z < view.camZ + 170 && proj(0, 0, gt.z, P0)) { const o = item(2, P0.d); o.r = gt; }
  for (const p of g.props) if (!p.done && p.kind !== 'bridge' && proj(p.x, 0, p.z, P0)) { const o = item(3, P0.d); o.r = p; }
  for (const ob of g.obst) {
    if (ob.z + ob.len < view.camZ + 1 || ob.z > view.camZ + 160) continue;
    if (CAR[ob.type]) { if (proj(ob.x, 0, Math.max(ob.z, view.camZ + 1), P0)) { const o = item(10, P0.d); o.r = ob; } }
    else if (ob.type === 'hammer') { if (proj(ob.x, 0, ob.z, P0)) { const o = item(8, P0.d); o.r = ob; } }
    else for (const br of ob.barrels) if (!br.done && proj(br.x, 0, ob.z, P0)) { const o = item(9, P0.d); o.r = ob; o.b = br; }
  }
  const M = g.monster;
  if (M && M.z < view.camZ + 175 && proj(M.x, 0, M.z, P0)) { const o = item(5, P0.d); o.x = P0.x; o.y = P0.y; o.s = P0.s; }
  if (WORLDS[g.world].rail === 'bridge') {
    const k0 = Math.floor((view.camZ - 30) / TOWER_GAP);
    for (let k = k0; k < k0 + 3; k++) { const z = 30 + k * TOWER_GAP; if (z > view.camZ + 1 && proj(0, 0, z, P0)) { const o = item(4, P0.d); o.z = z; } }
  } else listDecor(g);

  order.length = pn; for (let i = 0; i < pn; i++) order[i] = pool[i];
  order.sort(byDepth);
  for (const o of order) {
    if (o.k === 0) {
      const h = 0.95 * o.s, w = h * SW / SH;
      ctx.drawImage(o.spr ? o.spr[o.f] : armySprite(save.skin, o.f), o.x - w / 2, o.y - h, w, h);
      if (o.m) drawStatus(o.m, o.x, o.y, w, h, g.time);
    } else if (o.k === 2) drawGate(o.r, g);
    else if (o.k === 3) (o.r.kind === 'cage' ? drawCage : drawCrate)(o.r, g);
    else if (o.k === 4) drawTower(o.z);
    else if (o.k === 6) { const w = o.s * 120 / 180; ctx.drawImage(o.img, o.x - w / 2, o.y - o.s, w, o.s); }
    else if (o.k === 7) drawBuilding(o);
    else if (o.k === 5) drawMonster(g.monster, g, o);
    else if (o.k === 8) drawHammer(o.r, g);
    else if (o.k === 9) drawBarrel(o.b, o.r, g);
    else if (o.k === 10) drawCar(o.r, g);
  }
}

function bubble(x, y, text, fill, size) {
  ctx.font = `${size}px ${FD}`;
  const tw = ctx.measureText(text).width, pw = tw + size * 0.95, ph = size * 1.32;
  ctx.beginPath(); rr(ctx, x - pw / 2, y - ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = Math.max(2, size * 0.13); ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + size * 0.06);
}

function drawMonsterBar(g) {
  const M = g.monster;
  if (!M || M.dead || M.z > view.camZ + 120) return;
  const T = MONSTERS[M.kind];
  if (!proj(M.x, MON_H * T.size + 0.9, M.z, P0)) return;
  const w = clamp(5.2 * P0.s, 90, view.w - 40), h = clamp(0.42 * P0.s, 8, 16), x = P0.x - w / 2, y = Math.max(view.topY - 14, P0.y);
  const fs = clamp(0.55 * P0.s, 12, 22);
  outlined(T.name, P0.x, y - h - fs * 0.55, fs, '#ffffff', '#15233b');
  ctx.beginPath(); rr(ctx, x - 2, y - h / 2 - 2, w + 4, h + 4, h); ctx.fillStyle = '#15233b'; ctx.fill();
  const k = M.hp / M.max;
  if (k > 0) { ctx.beginPath(); rr(ctx, x, y - h / 2, Math.max(h, w * k), h, h / 2); ctx.fillStyle = k > 0.5 ? '#3ad06e' : k > 0.25 ? '#ffc531' : '#ff4d40'; ctx.fill(); }
  if (h >= 12) { ctx.font = `${h * 0.95}px ${FD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText(group(Math.ceil(M.hp)), P0.x, y + 1); }
  // damage of the last volley, rising from the bar
  for (let i = hitTexts.length - 1; i >= 0; i--) {
    const f = hitTexts[i]; f.t += hitDt;
    if (f.t > 1.1) { hitTexts.splice(i, 1); continue; }
    ctx.globalAlpha = clamp(1.6 - f.t * 1.5, 0, 1);
    outlined(f.text, P0.x + w * 0.3, y + 56 - f.t * 30, 30, '#ffe066', '#15233b');
    ctx.globalAlpha = 1;
  }
}

/* ---------- effects ---------- */
const parts = [], floats = [], confetti = [], rings = [], balls = [], hitTexts = [];
let hitDt = 0;
const fx = { flash: 0, flashColor: '0,0,0', shake: 0 };
function burst(x, z, colors, n, y) {
  if (parts.length > 600) return;
  for (let i = 0; i < n; i++) parts.push({ x, y: y || 0.5, z, vx: rand(-2.5, 2.5), vy: rand(2, 5.5), vz: rand(-2, 2.5), t: 0, max: rand(0.35, 0.65), c: pick(colors), sz: rand(0.08, 0.16) });
}
function floatText(text, color) { floats.push({ text, color, t: 0 }); }
function confettiBurst() {
  if (REDUCED) return;
  const cols = ['#ffc531', '#2f7df6', '#e5463b', '#1f9d55', '#ffffff', '#8a4fd6'];
  for (let i = 0; i < 150; i++) confetti.push({ x: rand(0, view.w), y: rand(-view.h * 0.4, -10), vx: rand(-40, 40), vy: rand(120, 260), r: rand(0, 6), vr: rand(-6, 6), c: pick(cols), w: rand(6, 11), h: rand(3, 6) });
}

// Shots look different for every weapon: glow colour, core colour, thickness and length
const SHOT_FX = [
  ['rgba(255,170,40,0.55)', 'rgba(255,245,190,1)', 0.26, 1.0],
  ['rgba(255,110,30,0.6)', 'rgba(255,230,170,1)', 0.3, 1.2],
  ['rgba(255,60,200,0.6)', 'rgba(255,215,250,1)', 0.34, 1.3],
  ['rgba(255,50,40,0.65)', 'rgba(255,225,200,1)', 0.42, 1.2],
  ['rgba(40,220,255,0.65)', 'rgba(220,255,255,1)', 0.3, 2.2],
];
// bullets with fire, ice or poison take their colour
const EL_FX = { fire: ['rgba(255,90,20,0.7)', 'rgba(255,240,170,1)'], ice: ['rgba(120,200,255,0.7)', 'rgba(240,252,255,1)'], poison: ['rgba(90,220,60,0.7)', 'rgba(225,255,200,1)'] };
const bolts = [], PREV = { x: 0, y: 0 }, SHOT_BATCH = {};
function drawEffects(g, dt) {
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  const [glow0, core0, thick, len] = SHOT_FX[g.weapon], fat = g.giant ? 1.35 : 1;
  // bullets of one colour and about one thickness are drawn together (many bullets with the upgrades)
  for (const k in SHOT_BATCH) SHOT_BATCH[k].length = 0;
  for (const b of g.bullets) {
    if (!proj(b.x, 0.55 * fat, b.z, P0) || !proj(b.x - (b.vx || 0) * len, 0.55 * fat, b.z - len, P1)) continue;
    const w = Math.max(3, thick * fat * P0.s), key = (b.el || 'n') + Math.min(5, Math.round(w / 4));
    (SHOT_BATCH[key] || (SHOT_BATCH[key] = [])).push(P1.x, P1.y, P0.x, P0.y);
  }
  for (const key in SHOT_BATCH) {
    const L = SHOT_BATCH[key];
    if (!L.length) continue;
    const E = EL_FX[key.slice(0, -1)], w = Math.max(3, +key.slice(-1) * 4);
    ctx.beginPath();
    for (let i = 0; i < L.length; i += 4) { ctx.moveTo(L[i], L[i + 1]); ctx.lineTo(L[i + 2], L[i + 3]); }
    ctx.strokeStyle = E ? E[0] : glow0; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = E ? E[1] : core0; ctx.lineWidth = Math.max(1.2, w * 0.4); ctx.stroke();
  }
  // lightning of the electric gun: a jagged line through the enemies it hit
  for (let i = bolts.length - 1; i >= 0; i--) {
    const B = bolts[i]; B.t += dt;
    if (B.t > 0.24) { bolts.splice(i, 1); continue; }
    ctx.globalAlpha = 1 - B.t / 0.24; ctx.beginPath();
    let first = true;
    for (let k = 0; k < B.pts.length; k++) {
      const [x, z] = B.pts[k];
      if (!proj(x, 0.8, z, P0)) continue;
      if (first) { ctx.moveTo(P0.x, P0.y); first = false; PREV.x = P0.x; PREV.y = P0.y; continue; }
      for (let q = 1; q <= 3; q++) { const f = q / 4, j = (Math.random() - 0.5) * 18; ctx.lineTo(PREV.x + (P0.x - PREV.x) * f + j, PREV.y + (P0.y - PREV.y) * f + j * 0.6); }
      ctx.lineTo(P0.x, P0.y); PREV.x = P0.x; PREV.y = P0.y;
    }
    ctx.strokeStyle = 'rgba(110,190,255,0.85)'; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
  // shock waves from the monster's stomp
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.t += dt;
    if (r.t > 0.6) { rings.splice(i, 1); continue; }
    if (!proj(r.x, 0.05, r.z, P0)) continue;
    const k = r.t / 0.6, rad = (1 + k * r.size) * P0.s;
    ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.c; ctx.lineWidth = Math.max(2, 0.3 * P0.s * (1 - k));
    ctx.beginPath(); ctx.ellipse(P0.x, P0.y, rad, rad * 0.42, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  // fireballs thrown after a wrong answer
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i]; b.t += dt;
    const k = b.t / 0.55;
    if (k >= 1) { balls.splice(i, 1); continue; }
    const x = b.x0 + (b.x1 - b.x0) * k, z = b.z0 + (b.z1 - b.z0) * k, y = 3.2 + 2.5 * Math.sin(k * Math.PI) - 2.7 * k;
    if (!proj(x, y, z, P0)) continue;
    const rad = Math.max(6, 0.55 * P0.s);
    const grd = ctx.createRadialGradient(P0.x, P0.y, 0, P0.x, P0.y, rad * 1.6);
    grd.addColorStop(0, '#fff6c2'); grd.addColorStop(0.35, '#ffb02e'); grd.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(P0.x, P0.y, rad * 1.6, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t += dt;
    if (p.t > p.max) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
    p.vy -= 14 * dt; p.x += p.vx * dt; p.y = Math.max(0, p.y + p.vy * dt); p.z += p.vz * dt;
    if (!proj(p.x, p.y, p.z, P0)) continue;
    const s = p.sz * P0.s * (1 - p.t / p.max * 0.5);
    ctx.fillStyle = p.c; ctx.fillRect(P0.x - s / 2, P0.y - s / 2, s, s);
  }
  const a = g.army;
  if (g.state === 'run') {
    for (const s of g.squads) {
      if (!s.active || !s.men.length || s.z - a.z > 48) continue;
      const small = s.men.filter(m => !m.big).length, col = FOE_FX[s.kind][1], up = FOES[s.kind].fly ? 1.4 : 0;
      if (small && proj(s.x, 1.9 + up, s.z + 0.3, P0) && P0.y > view.hudBottom) bubble(P0.x, P0.y, String(small), col, clamp(0.55 * P0.s, 13, 22));
      for (const m of s.men) if (m.big && proj(s.x + m.ox, 3.0 + up, s.z + m.oz, P0) && P0.y > view.hudBottom) bubble(P0.x, P0.y, String(Math.ceil(m.hp)), col, clamp(0.5 * P0.s, 12, 20));
    }
    for (const p of g.props) if (p.kind === 'bridge' && p.z - a.z < 48) drawBridgeLabels(p, g);
  }
  hitDt = dt; drawMonsterBar(g);
  if (a.n > 0 && proj(a.x, 1.75 * (g.giant ? 1.35 : 1), a.z + radius(a.n) * 0.55, P0)) {
    bubble(P0.x, P0.y, String(a.n), SKINS[save.skin].c[0], 24);
    if (!g.attract) {
      const tags = [WEAPONS[g.weapon].name, g.giant && POWERS.giant.name, g.turbo && POWERS.turbo.name].filter(Boolean).join(' · ');
      ctx.globalAlpha = 0.95; outlined(tags, P0.x, P0.y + 26, 14, '#ffffff', '#15233b'); ctx.globalAlpha = 1;
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.t += dt;
      if (f.t > 1.1) { floats.splice(i, 1); continue; }
      ctx.globalAlpha = clamp(1.6 - f.t * 1.5, 0, 1);
      outlined(f.text, P0.x + 56, P0.y - 18 - f.t * 70, 34, f.color, '#15233b');
      ctx.globalAlpha = 1;
    }
  } else floats.length = 0;
  const fall = WORLDS[g.world].fall;
  if (fall && !REDUCED) {
    const t = g.time, W = view.w, H = view.h, snow = fall === 'snow';
    for (let i = 0; i < 46; i++) {
      const sp = snow ? 30 + 40 * hash(i * 1.3) : -(20 + 40 * hash(i * 1.3));
      const x = ((hash(i * 2.1) * W + Math.sin(t * 0.8 + i) * 18) % W + W) % W, y = ((hash(i * 3.7) * H + t * sp) % H + H) % H;
      ctx.globalAlpha = snow ? 0.85 : 0.5 + 0.5 * Math.sin(t * 6 + i);
      ctx.fillStyle = snow ? '#ffffff' : (i % 2 ? '#ffb02e' : '#ff5a14');
      ctx.beginPath(); ctx.arc(x, y, snow ? 1.5 + 2 * hash(i) : 1.2 + 1.3 * hash(i), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (fx.flash > 0) {
    fx.flash = Math.max(0, fx.flash - dt * 2.2);
    const grd = ctx.createRadialGradient(view.w / 2, view.h / 2, view.h * 0.25, view.w / 2, view.h / 2, view.h * 0.75);
    grd.addColorStop(0, `rgba(${fx.flashColor},0)`); grd.addColorStop(1, `rgba(${fx.flashColor},${0.55 * fx.flash})`);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, view.w, view.h);
  }
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i]; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt;
    if (c.y > view.h + 20) { confetti.splice(i, 1); continue; }
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r); ctx.fillStyle = c.c; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); ctx.restore();
  }
}

function render(g, dt) {
  const a = g.army;
  updateCamera(g.state === 'fight' || (g.state === 'lost' && !!g.fight), dt);
  view.camX += (a.x * 0.35 - view.camX) * Math.min(1, dt * 6);
  view.camZ = a.z - CAM_BACK;
  if (fx.shake > 0 && !REDUCED) { fx.shake = Math.max(0, fx.shake - dt); const m = 18 * fx.shake; view.sx = rand(-m, m); view.sy = rand(-m, m); }
  else { view.sx = 0; view.sy = 0; }
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  drawBackdrop(g);
  drawEntities(g);
  drawEffects(g, dt);
}

/* ============================================================
   Screens, HUD and controls
   ============================================================ */
const $ = id => document.getElementById(id);
const screens = { menu: $('scrMenu'), levels: $('scrLevels'), intro: $('scrIntro'), pause: $('scrPause'), result: $('scrResult'), lesson: $('scrLesson'), armory: $('scrArmory'), chest: $('scrChest'),
  start: $('scrStart'), select: $('scrSelect') };
const hud = $('hud'), probCard = $('probCard'), probText = $('probText'), probSub = $('probSub'), probTime = $('probTime'), probReward = $('probReward');
const fight = $('fightPanel'), fqText = $('fqText'), fqSub = $('fqSub'), fqTime = $('fqTime'), ansL = $('ansL'), ansR = $('ansR');
const ICON = {
  star: on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill="${on ? '#ffc531' : '#e3d6bb'}" stroke="${on ? '#8a5a00' : '#cbbd9f'}" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" stroke="none"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
};

let game = createGame(save.next[0], save.next[1], true);
let mode = 'menu';            // start | select | menu | levels | intro | play | pause | lesson | chest | result | armory
let pending = null;           // the stage shown on the intro card, started by "Start"
const ui = { shownGate: null, until: 0, lessonQ: null, music: null };
const stageLabel = (c, s) => `Level ${c + 1} · gra ${s + 1}`;
const solved = p => p.sol || (p.q.includes('?') ? p.q.replace('?', p.a) : /^x [<>≤≥]/.test(p.a) ? `${p.q}, więc ${p.a}` : `${p.q}, ${p.ask || 'x'} = ${p.a}`);

function show(name) { for (const k in screens) screens[k].hidden = k !== name; }
// gold earned in a game left through the pause (Menu, Od nowa) is kept, as after a loss
function keepGold(g) {
  if (!g || g.attract || g.trial || g.recorded || !g.gold) return;
  save.gold += g.gold; g.gold = 0; persist();
}
function goMenu() {
  keepGold(game);
  if (!unlocked(save.next[0], save.next[1])) save.next = nextGame(0, 0);
  mode = 'menu'; game = createGame(save.next[0], save.next[1], true); hud.hidden = true; fight.hidden = true; view.hudBottom = 0; layout();
  ui.lessonQ = null; lesson = null; chest = null; $('stink').hidden = true;
  $('btnPlay').textContent = `Graj · ${stageLabel(save.next[0], save.next[1])}`;
  $('btnArmory').textContent = `Zbrojownia · ${group(save.gold)} złota`;
  $('menuVersion').textContent = `Wersja ${WERSJA}`;
  updateSoundBtns(); show('menu'); playMusic('menu', save.next[0]); Snd.duck(false);
}
// trial: "gra na próbę" of level c (the player's upgrades and the chest's do not count there)
function openIntro(c, s, trial) {
  mode = 'intro'; pending = createGame(c, s, false, trial ? null : playKit(), trial, true);
  const info = pending.cfg.info, M = MONSTERS[c];
  const exam = trial && !levelOpen(c);        // the trial of a closed level is its exam
  $('inWorld').textContent = trial ? `Level ${c + 1} · ${exam ? 'egzamin' : 'gra na próbę'} · ${WORLDS[pending.world].name}` : `${stageLabel(c, s)} z ${STAGES} · ${WORLDS[pending.world].name}`;
  $('inTitle').textContent = exam ? `Egzamin do levelu ${c + 1}` : trial ? `Zajrzyj do levelu ${c + 1}` : info.name;
  $('inTopic').textContent = trial ? 'Po trochu ze wszystkich tematów tego levelu'
    : info.final ? 'Sprawdzian z całego levelu' : info.review ? 'Powtórka: wszystkie dotychczasowe tematy tego levelu' : `Stopień trudności ${info.tier} z 4`;
  const ex = pending.gen();          // the second line holds the data of many problems (sides, speed, numbers…)
  $('inExample').innerHTML = richHTML(ex.q); $('inExSub').innerHTML = richHTML(ex.sub || ''); $('inExSub').hidden = !ex.sub;
  $('inMonster').textContent = M.name;
  showHp();
  $('inHint').textContent = exam
    ? 'Wygraj bez ani jednego błędu, a ten level otworzy się razem z niższymi i dostaniesz złoto na start. Ulepszenia są ustawione jak u gracza w połowie levelu.'
    : trial ? 'Ulepszenia są ustawione jak u gracza w połowie tego levelu. Ta gra nie daje złota ani gwiazdek.'
    : c === 0 && s === 0 ? 'Przesuwaj palcem w lewo i w prawo. Wbiegnij w bramkę z dobrym wynikiem.'
    : `${pending.cfg.gates} bramek. Każda daje tylu żołnierzy, ile pokazuje zielona liczba.`;
  const boost = !trial && save.boost.length;
  $('inBoost').hidden = !boost;
  if (boost) $('inBoost').innerHTML = `<small>Ze skrzyni na tę grę</small>${save.boost.map(b => `<span>${skillIcon(b.k)}${esc(SKILLS[b.k].name)} +${b.n}</span>`).join('')}`;
  show('intro');
}
// the monster's strength is worked out while the card is shown
const showHp = () => { $('inHp').textContent = pending && !pending.calib ? group(pending.monster.max) : '…'; };
function startStage(g) {
  game = g; mode = 'play'; pending = null;
  ui.shownGate = null; ui.until = 0; ui.lessonQ = null; lesson = null; $('stink').hidden = true;
  parts.length = 0; floats.length = 0; confetti.length = 0; rings.length = 0; balls.length = 0; hitTexts.length = 0; bolts.length = 0;
  show(null); hud.hidden = false; fight.hidden = true; probCard.hidden = false; view.k = 0;
  $('hudLevel').textContent = g.trial ? `Level ${g.cls + 1} · na próbę` : stageLabel(g.cls, g.s);
  updGold(g);
  updateProblem(g, true);
  view.hudBottom = probCard.getBoundingClientRect().bottom;
  view.topY = $('hudTop').getBoundingClientRect().bottom + 56;
  layout();
  view.camX = 0;
  drawMusicStyle(); playMusic('run', g.cls); Snd.duck(false);
  countGame(g);
}
const restart = g => { keepGold(g); startStage(createGame(g.cls, g.s, false, g.trial ? null : playKit(), g.trial, true)); };
// The counter also notes every game started, by level (nothing about the player; does nothing when the counter is not on the page)
// (and a few more events: the first start from the home screen icon, the choice at the start, the exams);
// if the counter has not loaded yet, it tries again for a few seconds
function countEvent(path, title, tries = 0) {
  try {
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path, title, event: true });
    else if (tries < 10 && document.querySelector('script[data-goatcounter]')) setTimeout(() => countEvent(path, title, tries + 1), 1000);
  } catch (e) { /* counter blocked */ }
}
function countGame(g) {
  const n = g.cls + 1, exam = g.trial && !levelOpen(g.cls);
  if (exam) countEvent(`egzamin/level-${n}`, `Egzamin: level ${n}`);
  else if (g.trial) countEvent(`proba/level-${n}`, `Gra na próbę: level ${n}`);
  else countEvent(`gra/level-${n}`, `Gra: level ${n}`);
}
function pauseGame() { if (mode !== 'play') return; mode = 'pause'; show('pause'); Snd.duck(true); }
function resumeGame() { if (mode !== 'pause') return; mode = 'play'; show(null); last = performance.now(); Snd.resume(); Snd.duck(false); }

function setCard(text, sub, cls, reward) {
  probText.innerHTML = richHTML(text);
  const len = plain(text).length;
  probText.classList.toggle('long', len > 13 && len <= 22);
  probText.classList.toggle('xlong', len > 22);
  probSub.innerHTML = richHTML(sub || '');
  probReward.textContent = reward ? '+' + reward : '';
  probReward.hidden = !reward;
  probCard.className = 'problem' + (cls ? ' ' + cls : '');
  void probCard.offsetWidth; probCard.classList.add('pop');
}
function updateProblem(g, force) {
  if (g.state !== 'run' || (g.time < ui.until && !force)) return;
  const next = g.gates.find(x => !x.done);
  if (next && !next.shown) {
    if (ui.shownGate !== 'wait' || force) {
      ui.shownGate = 'wait';
      const k = g.gates.indexOf(next) - 1, foes = [...new Set(g.squads.filter(q => q.span === k).map(q => q.kind))].map(f => FOE_NAMES[f]);
      setCard('Uwaga!', `${foes.length ? 'Nadchodzą ' + foes.join(' i ') + '. ' : ''}Zestrzel wrogów i omijaj pułapki. Potem zadanie.`, 'boss', 0);
    }
    probTime.style.transform = 'scaleX(0)';
  } else if (next) {
    if (ui.shownGate !== next || force) {
      ui.shownGate = next;
      const hint = g.cls === 0 && g.s === 0 && next === g.gates[0] ? 'Przesuń palcem w stronę dobrej odpowiedzi' : next.p.sub;
      setCard(next.p.q, hint, '', next.r);
    }
    const i = g.gates.indexOf(next), from = i ? next.showAt : g.cfg.speed;
    probTime.style.transform = `scaleX(${clamp((next.z - g.army.z) / (next.z - from), 0, 1)})`;
  } else if (ui.shownGate !== 'monster') {
    ui.shownGate = 'monster';
    setCard('Potwór!', `${MONSTERS[g.cls].name} czeka na końcu drogi`, 'boss', 0);
  }
}
function setFight(text, sub, cls) {
  fqText.innerHTML = richHTML(text);
  const len = plain(text).length;
  fqText.classList.toggle('long', len > 13 && len <= 22);
  fqText.classList.toggle('xlong', len > 22);
  fqSub.innerHTML = richHTML(sub || '');
  fight.className = 'fight' + (cls ? ' ' + cls : '');
  void fight.offsetWidth; fight.classList.add('pop');
}
function showFightProblem(g) {
  const f = g.fight;
  setFight(f.p.q, f.count === 1 && g.cls === 0 && g.s < 3 ? 'Stuknij w dobrą odpowiedź' : (f.p.sub || `Dobra odpowiedź: +${f.r} żołnierzy`), '');
  ansL.innerHTML = richHTML(f.left ? f.p.a : f.p.w);
  ansR.innerHTML = richHTML(f.left ? f.p.w : f.p.a);
  ansL.disabled = ansR.disabled = false;
  ansL.className = ansR.className = 'ans';
}
function pickAnswer(left) {
  if (mode !== 'play' || game.state !== 'fight' || !game.fight || game.fight.done) return;
  Snd.unlock();
  (left ? ansL : ansR).classList.add('picked');
  answerFight(game, left);
  handleEvents(game);
}

function onGate(g, e) {
  const p = e.gate.p;
  if (e.ok) {
    setCard('Dobrze!', `+${e.n} żołnierzy` + (g.goldPer ? ` · +${g.goldPer} złota` : ''), 'good', 0); Snd.good(); Snd.coin();
    floatText('+' + e.n, '#4be08a'); fx.flash = 0.6; fx.flashColor = '40,210,110';
  } else {
    if (save.learn) setCard('Źle!', `Twoja odpowiedź: ${p.w}. Zaraz podpowiedź.`, 'bad', 0); else setCard(solved(p), `Twoja odpowiedź: ${p.w}`, 'bad', 0);
    Snd.bad();
    if (save.learn) ui.lessonQ = { p, your: p.w, at: g.time + 1.1 };
    if (e.n > 0) floatText(MINUS + e.n, '#ff6a5e');
    fx.flash = 0.8; fx.flashColor = '235,60,50'; fx.shake = 0.35;
  }
  ui.until = g.time + 1.0;
  updGold(g);
}

const WOOD = ['#c07a33', '#6b4424', '#ffd27a'], ZGREEN = ['#93d36c', '#4f8a33', '#7b5fb8'];
const updGold = g => { $('hudGold').textContent = group(g.gold); };
function handleEvents(g) {
  const a = g.army, M = g.monster;
  for (const e of g.events) {
    switch (e.type) {
      case 'gate': onGate(g, e); break;
      case 'kill':
        if (e.big) { burst(e.x, e.z, FOE_FX[e.kind] || ZGREEN, 22, 1.2); if (g.goldPer) floatText('+' + GOLD.brute + ' złota', '#ffd23f'); Snd.thud(); updGold(g); }
        else { burst(e.x, e.z, FOE_FX[e.kind] || ZGREEN, 5); Snd.pop(); }
        break;
      case 'clash':
        burst(e.x, e.z, FOE_FX[e.kind] || ZGREEN, 3); burst(e.x, e.z, SKINS[save.skin].c, 3); Snd.pop();
        if (e.big || e.n > 1) { floatText(MINUS + e.n, '#ff6a5e'); fx.shake = 0.3; Snd.thud(); }
        break;
      case 'leak':                                   // an enemy got past the army: it still takes soldiers
        if (e.n > 0) { floatText(MINUS + e.n, '#ff6a5e'); burst(a.x, a.z - radius(a.n) * 0.5, SKINS[save.skin].c, 4); Snd.thud(); fx.flash = 0.35; fx.flashColor = '235,60,50'; }
        break;
      case 'trap':
        if (CAR[e.kind]) { burst(a.x, a.z, ['#ffb02e', '#ff5a2a', '#fff2a8', '#4b4f57'], 22, 1.2); burst(a.x, a.z, SKINS[save.skin].c, 10, 0.6); Snd.boom(); }
        else if (e.kind === 'hammer') { rings.push({ x: a.x, z: a.z, t: 0, size: 4, c: 'rgba(255,255,255,0.9)' }); burst(a.x, a.z, SKINS[save.skin].c, 12, 0.5); Snd.stomp(); }
        else { burst(a.x, a.z, ['#ffb02e', '#ff5a2a', '#fff2a8'], 16, 0.8); Snd.boom(); }
        if (e.n > 0) floatText(MINUS + e.n, '#ff6a5e');
        fx.shake = 0.35; fx.flash = 0.6; fx.flashColor = '235,60,50';
        break;
      case 'barrel': burst(e.x, e.z, ['#ffb02e', '#ff5a2a', '#fff2a8', '#7a1f14'], 24, 0.8); Snd.boom(); break;
      case 'boom':                                    // a beaten enemy blew up
        rings.push({ x: e.x, z: e.z, t: 0, size: e.r * 1.6, c: 'rgba(255,150,40,0.95)' }); burst(e.x, e.z, ['#ffb02e', '#ff5a2a', '#fff2a8'], 7, 0.6); Snd.pof();
        break;
      case 'bolt': bolts.push({ pts: e.pts, t: 0 }); Snd.zap(); break;
      case 'shatter': burst(e.x, e.z, ['#dff4ff', '#a9dcff', '#ffffff'], 9, 0.7); Snd.ice(); break;
      case 'problem': updateProblem(g, true); Snd.tap(); break;
      case 'horde': Snd.groan(); break;
      case 'spark': if (Math.random() < 0.5) burst(e.x, e.z, ['#fff2a8', '#ffb02e', MONSTERS[g.cls].light], 2, rand(1.5, 4.5)); Snd.shot(); break;
      case 'cage': burst(e.x, e.z, ['#8c96a3', '#c9d1db', '#ffffff'], 18, 0.8); floatText('+' + e.n, '#4be08a'); Snd.freed(); break;
      case 'weapon':
        burst(e.x, e.z, ['#ffd23f', '#86a85a', '#ffffff'], 24, 0.8); floatText(e.name + '!', '#ffd23f');
        Snd.power(); fx.flash = 0.5; fx.flashColor = '255,210,60';
        break;
      case 'power':
        burst(e.x, e.z, ['#c9a2ff', '#ffd23f', '#ffffff'], 30, 0.6); floatText(e.name + '!', '#d6b8ff');
        Snd.power(); Snd.reinforce(); fx.flash = 0.6; fx.flashColor = '160,90,255';
        break;
      case 'smash':
        if (e.kind === 'bridge') { burst(e.x, e.z + 1, WORLDS[g.world].splash, 26, 0.2); Snd.splash(); }
        else burst(e.x, e.z, WOOD, 16);
        if (e.n > 0) floatText(MINUS + e.n, '#ff6a5e');
        Snd.bad(); fx.shake = 0.25;
        break;
      case 'fight':
        probCard.hidden = true; fight.hidden = false;
        setFight('Walka!', 'Każda odpowiedź to runda: armia strzela, potem atakuje potwór.', 'boss');
        ansL.innerHTML = ansR.innerHTML = '…'; ansL.disabled = ansR.disabled = true;
        view.fightY = fight.getBoundingClientRect().top - 14;
        playMusic('fight', g.cls); Snd.roar(); fx.shake = 0.3;
        break;
      case 'fightProblem': showFightProblem(g); break;
      case 'fightAnswer':
        ansL.disabled = ansR.disabled = true;
        if (e.ok || !save.learn) (g.fight.left ? ansL : ansR).classList.add('right');
        updGold(g);
        if (e.ok) { setFight('Dobrze!', `Posiłki: +${e.r}` + (g.goldPer ? ` · +${g.goldPer} złota` : ''), 'good'); Snd.reinforce(); floatText('+' + e.r, '#4be08a'); fx.flash = 0.5; fx.flashColor = '40,210,110'; }
        else {
          setFight(save.learn ? 'Źle!' : solved(e.p), e.timeout ? 'Za późno! Potwór atakuje' : `Twoja odpowiedź: ${e.p.w}`, 'bad');
          Snd.bad(); Snd.roar();
          if (save.learn) ui.lessonQ = { p: e.p, your: e.timeout ? null : e.p.w, at: g.time + 1.5 };
        }
        break;
      case 'volley': if (e.n > 0) { hitTexts.push({ text: MINUS + group(e.n), t: 0 }); Snd.hit(); } break;
      case 'growl':
        Snd.growl();
        if (e.fire) balls.push({ t: 0, x0: M.x, z0: M.z - 1.5, x1: a.x, z1: a.z });
        break;
      case 'stomp':
        rings.push({ x: M.x, z: M.z - 2, t: 0, size: 9, c: 'rgba(255,255,255,0.9)' });
        if (e.n > 0) { floatText(MINUS + e.n, '#ff6a5e'); burst(a.x, a.z + radius(a.n) * 0.6, SKINS[save.skin].c, 10); }
        Snd.stomp(); fx.shake = 0.3;
        break;
      case 'blast':
        rings.push({ x: a.x, z: a.z, t: 0, size: 3, c: 'rgba(255,170,40,0.95)' });
        burst(a.x, a.z, ['#ffb02e', '#ff5a2a', '#fff2a8'], 18, 1); burst(a.x, a.z, SKINS[save.skin].c, 10);
        if (e.n > 0) floatText(MINUS + e.n, '#ff6a5e');
        Snd.boom(); fx.flash = 0.8; fx.flashColor = '235,60,50'; fx.shake = 0.45;
        break;
      case 'won':
        if (!g.attract) recordGame(g);   // written down at once: leaving through the pause during the celebration loses nothing
        Snd.stop(); Snd.win(); confettiBurst();
        if (M) for (let i = 0; i < 4; i++) burst(M.x + rand(-2, 2), M.z, [MONSTERS[g.cls].body, MONSTERS[g.cls].light, '#ffffff'], 16, rand(1, 6));
        if (g.fight) { setFight('Wygrana!', `${MONSTERS[g.cls].name} ${MONSTERS[g.cls].fem ? 'pokonana' : 'pokonany'}`, 'good'); ansL.disabled = ansR.disabled = true; }
        else setCard('Wygrana!', 'Potwór pokonany', 'good', 0);
        break;
      case 'lost':
        if (!g.attract) recordGame(g);
        Snd.stop(); Snd.boo(); stinkShow(g.lostBy === 'lesson' ? 'Chyba<br>śmierdzi Ci<br>spod pachy!' : '');   // "buuuu" and the joke the children asked for
        if (g.fight) { setFight('Przegrana', g.lostBy === 'lesson' ? 'Trzy złe odpowiedzi w ćwiczeniu' : `${MONSTERS[g.cls].name} ${MONSTERS[g.cls].fem ? 'była silniejsza' : 'był silniejszy'}`, 'bad'); ansL.disabled = ansR.disabled = true; }
        else setCard('Przegrana', g.lostBy === 'lesson' ? 'Trzy złe odpowiedzi w ćwiczeniu' : 'Wrogowie mieli przewagę', 'bad', 0);
        break;
    }
  }
  g.events.length = 0;
}

/* ============================================================
   After a mistake: how to calculate it in your head, then practice of the same kind
   ============================================================ */
const GOAL = 3;   // the bar: 3 fields to the right (right answers) to go back to the game, 3 to the left end the game
const CALM = 20;  // seconds of calm for every practice task; then "Ale bez przesady" and the usual time bar of the game
let lesson = null;
const le = {
  card: $('leCard'), eyebrow: $('leEyebrow'), solved: $('leSolved'), your: $('leYour'), title: $('leTitle'), steps: $('leSteps'), method: $('leMethod'),
  task: $('leTask'), q: $('leQ'), sub: $('leSub'), L: $('leL'), R: $('leR'), msg: $('leMsg'), next: $('leNext'), bar: $('leBar'),
  timebar: $('leTimebar'), time: $('leTime'),
};
// "{…}" in a step is a calculation, shown in bold
const stepHTML = s => s.split(/(\{[^}]*\})/).map(x => x[0] === '{' ? `<b class="calc${plain(x).length < 20 ? ' nw' : ''}">${richHTML(x.slice(1, -1))}</b>` : richHTML(x)).join('');
// a hint, never the answer: the way of calculating with the last result left as "?"
function showHint(p) {
  const h = Z.hint(p);
  le.title.textContent = h.t;
  le.steps.innerHTML = h.s.map(x => `<li><span>${stepHTML(x)}</span></li>`).join('');
  le.method.hidden = false;
}
function setBar(pos) {
  for (const c of le.bar.querySelectorAll('.c')) { const v = +c.dataset.v; c.className = 'c' + (v < 0 && pos <= v ? ' bad' : v > 0 && pos >= v ? ' good' : ''); }
  le.bar.setAttribute('aria-label', pos > 0 ? `Dobre odpowiedzi: ${pos} z ${GOAL}` : pos < 0 ? `Złe odpowiedzi: ${-pos} z ${GOAL}` : 'Pasek na środku');
}
function setMsg(html, cls) { le.msg.innerHTML = html; le.msg.className = 'le-msg' + (cls ? ' ' + cls : ''); le.msg.hidden = !html; }
const later = (sec, fn) => {
  const L = lesson, run = () => { if (lesson !== L || mode !== 'lesson') return; if (document.hidden) setTimeout(run, 300); else fn(); };   // waits while the phone is put away
  setTimeout(run, sec * 1000);
};

function openLesson(p, your) {
  const tasks = p.how ? Z.practice(p, 6) : [];
  if (tasks.length < 2) return;   // nothing to practise: keep playing
  lesson = { p, tasks, n: 0, pos: 0, cur: null, left: true, busy: false, panels: [hud.hidden, fight.hidden] };
  mode = 'lesson';
  if (save.music) Snd.play('run', 'chill', false, true); Snd.duck(false);   // calm music; the game and its clock wait
  hud.hidden = fight.hidden = true;   // the problem behind the card would only confuse
  le.eyebrow.textContent = 'Podpowiedź';
  le.solved.innerHTML = richHTML(p.q) + (p.sub ? `<small>${richHTML(p.sub)}</small>` : ''); le.solved.hidden = false;
  le.your.innerHTML = your === null ? 'Zabrakło czasu' : richHTML(`Twoja odpowiedź: ${your}. To nie to.`); le.your.hidden = false;
  showHint(p);
  le.task.hidden = true; setMsg(''); setBar(0);
  le.next.textContent = 'Ćwiczymy'; le.next.hidden = false;
  show('lesson'); le.card.scrollTop = 0;
}
function nextTask() {
  const L = lesson;
  if (L.n >= L.tasks.length) L.tasks.push(...Z.practice(L.p, 4));
  const t = L.cur = L.tasks[L.n++] || L.tasks[(L.n - 1) % L.tasks.length];
  L.left = Math.random() < 0.5; L.busy = false; L.t = 0; L.hurry = false;
  le.eyebrow.textContent = 'Ćwiczenie bez pośpiechu'; le.timebar.hidden = true;
  le.solved.hidden = le.your.hidden = true; le.method.hidden = true;
  le.q.innerHTML = richHTML(t.q);
  const len = plain(t.q).length;
  le.q.classList.toggle('long', len > 13 && len <= 22); le.q.classList.toggle('xlong', len > 22);
  le.sub.innerHTML = richHTML(t.sub || ''); le.sub.hidden = !t.sub;
  le.L.innerHTML = richHTML(L.left ? t.a : t.w); le.R.innerHTML = richHTML(L.left ? t.w : t.a);
  le.L.className = le.R.className = 'ans'; le.L.disabled = le.R.disabled = false;
  le.task.hidden = false; setMsg(''); le.next.hidden = true;
  le.card.scrollTop = 0;
}
// The clock of a practice task runs only while the card is on screen: 20 calm seconds, then the game's time bar
function lessonTick(dt) {
  const L = lesson;
  if (!L || !L.cur || L.busy || le.task.hidden) return;
  L.t += dt;
  if (L.t < CALM) return;
  const think = game.cfg.think;
  if (!L.hurry) { L.hurry = true; le.eyebrow.textContent = 'Ale bez przesady'; le.timebar.hidden = false; Snd.tap(); }
  le.time.style.transform = `scaleX(${clamp(1 - (L.t - CALM) / think, 0, 1)})`;
  if (L.t >= CALM + think) lessonPick(null);
}
// left: true / false = the button picked; null = the time ran out (it counts as a wrong answer)
function lessonPick(left) {
  const L = lesson;
  if (!L || !L.cur || L.busy || le.task.hidden) return;
  Snd.unlock();
  L.busy = true; le.L.disabled = le.R.disabled = true; le.timebar.hidden = true;
  const btn = left === null ? null : left ? le.L : le.R;
  if (left === L.left) {
    L.pos++; setBar(L.pos); btn.classList.add('right'); Snd.good(); Snd.coin();
    game.gold += game.goldPer; updGold(game);     // practice after a mistake earns gold too
    const gold = game.goldPer ? `<small>+${game.goldPer} złota</small>` : '';
    if (L.pos < GOAL) { setMsg('Dobrze!' + gold, 'good'); later(0.9, nextTask); }
    else { setMsg('Super! Grasz dalej.' + gold, 'good'); Snd.reinforce(); later(1.4, closeLesson); }
  } else {
    L.pos--; setBar(L.pos); if (btn) btn.classList.add('picked'); Snd.bad(); shakeCard();
    if (L.pos <= -GOAL) { setMsg('Chyba śmierdzi Ci spod pachy!', 'bad'); later(1.8, lessonLost); }
    else {
      setMsg(left === null ? 'Za długo!<small>To liczy się jak zła odpowiedź. Spójrz na podpowiedź i spróbuj z nowym zadaniem.</small>'
        : 'Jeszcze nie.<small>Spójrz na podpowiedź i spróbuj z nowym zadaniem.</small>', 'bad');
      showHint(L.cur);                              // a hint for this task, the answer stays hidden
      le.next.textContent = 'Następne zadanie'; le.next.hidden = false;
    }
  }
}
function lessonNext() {
  if (!lesson || mode !== 'lesson') return;
  if (lesson.cur && lesson.pos >= GOAL) closeLesson(); else nextTask();
}
function leaveLesson() {
  [hud.hidden, fight.hidden] = lesson.panels;
  lesson = null; mode = 'play'; show(null); last = performance.now();
}
function closeLesson() {
  leaveLesson(); Snd.duck(false);
  if (ui.music) playMusic(ui.music.track, ui.music.cls);    // back to the music of this game
}
// three wrong answers on the bar: the game ends with the joke
function lessonLost() {
  leaveLesson();
  const g = game;
  if (g.state !== 'run' && g.state !== 'fight') return;
  g.lostBy = 'lesson'; g.state = 'lost'; g.endAt = g.time + 3.0; g.events.push({ type: 'lost' });
  handleEvents(g);
}
function shakeCard() { if (!REDUCED) { le.card.classList.remove('shake'); void le.card.offsetWidth; le.card.classList.add('shake'); } }

/* ============================================================
   The chest after the monster: 5 problems against one bar that runs all the time.
   Every right answer is a point, finishing before the lightning mark one more:
   6 points diamond, 5 gold, 3–4 silver, less wood. Inside: gold (the best chest of every game counts, like stars)
   and upgrades for the next game only, so they can be tried before buying.
   ============================================================ */
const CHESTS = [null,
  { name: 'Drewniana', body: '#b8743a', dark: '#6b3f1a', band: '#e2b25a' },
  { name: 'Srebrna', body: '#c3ccd8', dark: '#66717f', band: '#f4f7fa' },
  { name: 'Złota', body: '#f4c534', dark: '#a37405', band: '#fff1ad' },
  { name: 'Diamentowa', body: '#5fd4f2', dark: '#1d6f96', band: '#e6fbff' },
];
const CHEST_N = 5, CHEST_FAST = 0.35, CHEST_TIME = 0.6;   // problems; share of the bar left for the speed point; seconds per problem × thinking time
const CHEST_BOOST = [null, [1], [1, 1], [2, 1], [2, 2]];  // the chest's upgrades: how many levels each
const chestTier = (ok, fast) => { const p = ok + (fast ? 1 : 0); return p >= 6 ? 4 : p >= 5 ? 3 : p >= 3 ? 2 : 1; };
function chestSVG(t) {
  const C = CHESTS[t], gem = t === 4 ? `<path d="M60 56l6 6-6 7-6-7z" fill="#ffffff" stroke="${C.dark}" stroke-width="1.5"/>` : '';
  return `<svg viewBox="0 0 120 104" aria-hidden="true"><ellipse class="chest-glow" cx="60" cy="50" rx="44" ry="20" fill="#fff4b0"/>
    <g class="chest-lid"><path d="M14 50V38Q14 20 60 20Q106 20 106 38V50Z" fill="${C.body}" stroke="${C.dark}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M26 50V27M94 50V27" stroke="${C.band}" stroke-width="8"/><path d="M14 50V38Q14 20 60 20Q106 20 106 38V50Z" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linejoin="round"/></g>
    <rect x="14" y="50" width="92" height="44" rx="6" fill="${C.body}" stroke="${C.dark}" stroke-width="3"/>
    <path d="M26 52V92M94 52V92" stroke="${C.band}" stroke-width="8"/><rect x="14" y="50" width="92" height="44" rx="6" fill="none" stroke="${C.dark}" stroke-width="3"/>
    <rect x="51" y="46" width="18" height="22" rx="4" fill="${C.band}" stroke="${C.dark}" stroke-width="2.5"/>${gem || `<circle cx="60" cy="56" r="3" fill="${C.dark}"/>`}</svg>`;
}
let chest = null;
const ch = { card: $('chCard'), eyebrow: $('chEyebrow'), title: $('chTitle'), box: $('chChest'), info: $('chInfo'), tiers: $('chTiers'), quiz: $('chQuiz'),
  dots: $('chDots'), time: $('chTime'), q: $('chQ'), sub: $('chSub'), L: $('chL'), R: $('chR'), loot: $('chLoot'), go: $('chGo') };
function openChest(g) {
  recordGame(g);
  mode = 'chest'; fight.hidden = true; hud.hidden = true; $('stink').hidden = true;
  chest = { g, phase: 'ready', n: 0, ok: 0, T: CHEST_N * g.cfg.think * CHEST_TIME, t: 0, cur: null, left: true, busy: false, tier: 1 };
  ch.eyebrow.textContent = `${MONSTERS[g.cls].name} ${MONSTERS[g.cls].fem ? 'pokonana' : 'pokonany'}!`;
  ch.title.textContent = 'Skrzynia!';
  ch.info.innerHTML = `${CHEST_N} zadań na czas. Pasek leci cały czas. Każda dobra odpowiedź poprawia skrzynię, a skończ przed znakiem <b>⚡</b>, to będzie jeszcze lepsza.`;
  ch.tiers.innerHTML = [1, 2, 3, 4].map(t => `<span>${chestSVG(t)}<small>${CHESTS[t].name}</small></span>`).join('');
  ch.tiers.hidden = false; ch.quiz.hidden = true; ch.loot.hidden = true; ch.info.hidden = false;
  setChestBox(1, false);
  ch.go.textContent = 'Otwieram!'; ch.go.hidden = false;
  show('chest'); ch.card.scrollTop = 0;
}
function setChestBox(t, pop) {
  chest.tier = t;
  ch.box.className = 'chest-wrap t' + t;
  ch.box.innerHTML = chestSVG(t) + `<span class="chest-name">${CHESTS[t].name}</span>`;
  if (pop && !REDUCED) { void ch.box.offsetWidth; ch.box.classList.add('pop'); }
}
function chestStart() {
  if (!chest || chest.phase !== 'ready') return;
  chest.phase = 'quiz'; chest.t = 0;
  ch.tiers.hidden = true; ch.info.hidden = true; ch.go.hidden = true; ch.quiz.hidden = false;
  ch.dots.innerHTML = Array.from({ length: CHEST_N }, () => '<i></i>').join('');
  chestNext();
}
function chestNext() {
  const C = chest, p = C.cur = freshProblem(C.g);
  C.left = Math.random() < 0.5; C.busy = false;
  ch.q.innerHTML = richHTML(p.q); ch.sub.innerHTML = richHTML(p.sub || ''); ch.sub.hidden = !p.sub;
  const len = plain(p.q).length;
  ch.q.classList.toggle('long', len > 13 && len <= 22); ch.q.classList.toggle('xlong', len > 22);
  ch.L.innerHTML = richHTML(C.left ? p.a : p.w); ch.R.innerHTML = richHTML(C.left ? p.w : p.a);
  ch.L.className = ch.R.className = 'ans'; ch.L.disabled = ch.R.disabled = false;
}
// the bar runs on during the answers too
function chestTick(dt) {
  const C = chest;
  if (!C || C.phase !== 'quiz') return;
  C.t += dt;
  ch.time.style.transform = `scaleX(${clamp(1 - C.t / C.T, 0, 1)})`;
  const fast = C.t <= C.T * (1 - CHEST_FAST);
  ch.time.parentNode.classList.toggle('late', !fast);
  const t = chestTier(C.ok, fast && C.n === CHEST_N);
  if (C.n < CHEST_N && chestTier(C.ok, false) !== C.tier) setChestBox(chestTier(C.ok, false), true);
  else if (C.n === CHEST_N && t !== C.tier) setChestBox(t, true);
  if (C.t >= C.T) chestDone();
}
function chestPick(left) {
  const C = chest;
  if (!C || C.phase !== 'quiz' || C.busy) return;
  Snd.unlock();
  C.busy = true; ch.L.disabled = ch.R.disabled = true;
  const ok = left === C.left, dot = ch.dots.children[C.n];
  C.n++;
  if (ok) { C.ok++; dot.className = 'good'; (left ? ch.L : ch.R).classList.add('right'); Snd.tick(); Snd.coin(); }
  else { dot.className = 'bad'; (left ? ch.L : ch.R).classList.add('picked'); (C.left ? ch.L : ch.R).classList.add('right'); Snd.bad(); }
  const done = C.n >= CHEST_N, fast = C.t <= C.T * (1 - CHEST_FAST);
  if (done) { C.phase = 'wait'; C.fast = fast; }
  setTimeout(() => {
    if (chest !== C || mode !== 'chest') return;
    if (done) chestDone(); else if (C.phase === 'quiz') chestNext();
  }, ok ? 350 : 900);
}
// What is inside: gold for a better chest than ever in this game, and upgrades for the next game
function chestLoot(g, tier) {
  const i = g.cls * STAGES + g.s, best = save.chest[i];
  const gold = Math.max(0, chestGold(g.cls, tier) - chestGold(g.cls, best));
  save.chest[i] = Math.max(best, tier);
  const boosts = [];
  let extra = 0;
  for (const n of CHEST_BOOST[tier]) {
    const opts = SKILL_KEYS.filter(k => SKILLS[k].from <= g.cls + 1 && save.arm[k] < maxLv(k) && !boosts.some(b => b.k === k)
      && (!SKILLS[k].needs || save.arm[SKILLS[k].needs] > 0 || boosts.some(b => b.k === SKILLS[k].needs)));
    if (!opts.length) { extra += Math.round(20 * lvlMul(g.cls) / 5) * 5; continue; }   // everything bought: gold instead
    let sum = 0; const w = opts.map(k => (sum += save.arm[k] ? 1 : 3));                 // upgrades not bought yet come up more often
    const r = Math.random() * sum, k = opts[w.findIndex(x => x > r)];
    boosts.push({ k, n: Math.min(n, maxLv(k) - save.arm[k]) });
  }
  return { tier, gold: gold + extra, boosts, first: best === 0, better: tier > best };
}
function chestDone() {
  const C = chest;
  if (!C || C.phase === 'open') return;
  const fast = C.phase === 'wait' ? C.fast : false;
  C.phase = 'open';
  const g = C.g, tier = chestTier(C.ok, fast && C.n === CHEST_N), L = g.chest = chestLoot(g, tier);
  g.pay.chest = L.gold;
  save.gold += L.gold; save.boost = L.boosts; persist();
  ch.quiz.hidden = true;
  ch.title.textContent = `Skrzynia ${CHESTS[tier].name.toLowerCase()}!`;
  ch.eyebrow.textContent = `Dobre odpowiedzi: ${C.ok} z ${CHEST_N}` + (fast && C.n === CHEST_N ? ' · szybko ⚡' : C.n < CHEST_N ? ' · zabrakło czasu' : '');
  setChestBox(tier, false);
  const shake = i => setTimeout(() => { if (chest !== C) return; ch.box.classList.remove('shake'); void ch.box.offsetWidth; ch.box.classList.add('shake'); Snd.shake(); }, i * 380);
  if (!REDUCED) for (let i = 0; i < 3; i++) shake(i);
  setTimeout(() => {
    if (chest !== C) return;
    ch.box.classList.remove('shake'); ch.box.classList.add('open'); Snd.open(); confettiBurst();
    const gold = L.gold ? `<div class="loot-gold">${COIN}+${group(L.gold)} złota</div>` : `<p class="hint">Złoto za taką skrzynię w tej grze już było. Lepsza skrzynia da więcej.</p>`;
    const items = L.boosts.map(b => `<div class="loot-item">${skillIcon(b.k)}<span><b>${esc(SKILLS[b.k].name)} +${b.n}</b><small>na następną grę</small></span></div>`).join('');
    ch.loot.innerHTML = gold + items + (L.boosts.length ? '<p class="hint">Ulepszenia ze skrzyni działają w następnej grze. Na zawsze kupisz je w Zbrojowni.</p>' : '');
    ch.loot.hidden = false; ch.go.textContent = 'Dalej'; ch.go.hidden = false;
  }, REDUCED ? 100 : 1250);
}
/* ============================================================
   At the very first start: "Jak chcesz grać?" – from level 1, or the selection of mercenaries:
   stages from level 1 up, 5 problems each (a mix of the level's topics); 4 right ones pass the stage
   and the next one comes. The last passed stage is the level the player starts in (all below it open too),
   with gold made up to what a good player has there. 4 of 5 because with two answers guessing is right half the time.
   ============================================================ */
const SEL_N = 5, SEL_PASS = 4;
const RANKS = ['Rekrut', 'Szeregowy', 'Starszy szeregowy', 'Kapral', 'Plutonowy', 'Sierżant', 'Chorąży', 'Porucznik', 'Kapitan'];
let sel = null;
const se = { card: $('seCard'), eyebrow: $('seEyebrow'), title: $('seTitle'), sarge: $('seSarge'), say: $('seSay'), quiz: $('seQuiz'),
  dots: $('seDots'), time: $('seTime'), q: $('seQ'), sub: $('seSub'), L: $('seL'), R: $('seR'), go: $('seGo'), back: $('seBack') };
function openStart() { mode = 'start'; show('start'); }
function chooseBegin() { save.start = 'od-poczatku'; persist(); countEvent('start/od-poczatku', 'Start: od początku'); goMenu(); }
// from: 'start' (the first start) or 'levels' (the button on the level screen, any time later)
function openSelect(from = 'start') {
  mode = 'select';
  sel = { c: 0, n: 0, ok: 0, phase: 'intro', used: new Set(), passed: -1, t: 0, busy: false, from };
  se.sarge.src = armySprite(save.skin, 0).toDataURL();
  se.eyebrow.textContent = 'Selekcja najemników';
  se.title.textContent = 'Baczność, rekrucie!';
  se.say.textContent = `Pokaż, co umiesz. Każdy etap to ${SEL_N} zadań z jednej klasy, po trochu ze wszystkich tematów. ${SEL_PASS} dobre odpowiedzi i idziesz wyżej. Na końcu przydzielę cię do oddziału.` + (from === 'levels' ? ' Nic nie tracisz: otwarte levele, gwiazdki i złoto zostają.' : '');
  se.quiz.hidden = true; se.go.textContent = 'Do boju!'; se.go.hidden = false; se.back.textContent = 'Wróć'; se.back.hidden = false;
  show('select'); se.card.scrollTop = 0;
}
function selStage() {
  const S = sel;
  S.phase = 'quiz'; S.n = 0; S.ok = 0;
  S.think = stageConfig(S.c, TRIAL_S, true).think; S.gen = trialInfo(S.c).gen;
  se.eyebrow.textContent = `Stopień: ${RANKS[S.passed + 1]}`;
  se.title.textContent = `Etap ${S.c + 1}: level ${S.c + 1}`;
  se.say.textContent = S.c ? `Zadania z ${S.c + 1}. klasy. Uwaga, będzie trudniej!` : 'Zadania z 1. klasy. Na rozgrzewkę!';
  se.dots.innerHTML = Array.from({ length: SEL_N }, () => '<i></i>').join('');
  se.quiz.hidden = false; se.go.hidden = true; se.back.hidden = false;   // "Wróć" leaves at any moment, nothing changes
  selNext();
}
function selNext() {
  const S = sel;
  let p = S.gen();
  for (let i = 0; i < 30 && S.used.has(probKey(p)); i++) p = S.gen();
  S.used.add(probKey(p)); S.cur = p; S.left = Math.random() < 0.5; S.busy = false; S.t = 0;
  se.q.innerHTML = richHTML(p.q); se.sub.innerHTML = richHTML(p.sub || ''); se.sub.hidden = !p.sub;
  const len = plain(p.q).length;
  se.q.classList.toggle('long', len > 13 && len <= 22); se.q.classList.toggle('xlong', len > 22);
  se.L.innerHTML = richHTML(S.left ? p.a : p.w); se.R.innerHTML = richHTML(S.left ? p.w : p.a);
  se.L.className = se.R.className = 'ans'; se.L.disabled = se.R.disabled = false;
}
// every problem has the thinking time of a game of its level
function selTick(dt) {
  const S = sel;
  if (!S || S.phase !== 'quiz' || S.busy) return;
  S.t += dt;
  se.time.style.transform = `scaleX(${clamp(1 - S.t / S.think, 0, 1)})`;
  if (S.t >= S.think) selPick(null);
}
// left: true / false = the button picked; null = the time ran out
function selPick(left) {
  const S = sel;
  if (!S || S.phase !== 'quiz' || S.busy) return;
  Snd.unlock();
  S.busy = true; se.L.disabled = se.R.disabled = true;
  const ok = left === S.left, dot = se.dots.children[S.n];
  S.n++;
  if (ok) { S.ok++; dot.className = 'good'; (left ? se.L : se.R).classList.add('right'); Snd.tick(); }
  else { dot.className = 'bad'; if (left !== null) (left ? se.L : se.R).classList.add('picked'); (S.left ? se.L : se.R).classList.add('right'); Snd.bad(); }
  setTimeout(() => { if (sel === S && mode === 'select') { if (S.n >= SEL_N) selStageEnd(); else selNext(); } }, ok ? 450 : 1100);
}
function selStageEnd() {
  const S = sel, pass = S.ok >= SEL_PASS;
  se.quiz.hidden = true;
  if (!pass || S.c === NCLS - 1) { if (pass) S.passed = S.c; selFinish(); return; }
  S.passed = S.c; S.phase = 'between';
  Snd.good(); Snd.reinforce();
  se.eyebrow.textContent = `Awans: ${RANKS[S.passed + 1]}`;
  se.title.textContent = `Etap ${S.c + 1} zaliczony!`;
  se.say.textContent = `${S.ok} z ${SEL_N} dobrze. Dobra robota! Następny etap: level ${S.c + 2}.`;
  se.go.textContent = 'Dalej'; se.go.hidden = false;
}
function selFinish() {
  const S = sel, c = Math.max(0, S.passed);
  let had = 0; for (let k = 1; k < NCLS; k++) if (levelOpen(k)) had = k;   // the highest level open before
  S.phase = 'done';
  const add = openUpTo(c), lower = c < had;
  if (!save.start) save.start = 'selekcja';
  if (!lower) save.tab = c;
  persist();
  if (S.from === 'levels') countEvent(`selekcja/level-${c + 1}`, `Selekcja z ekranu leveli: level ${c + 1}`);
  else countEvent(`start/selekcja-level-${c + 1}`, `Start: selekcja, przydział level ${c + 1}`);
  S.add = add;
  Snd.win(); confettiBurst();
  se.eyebrow.textContent = `Stopień: ${RANKS[S.passed + 1]}`;
  se.title.textContent = lower ? `Wynik: level ${c + 1}` : `Przydział: level ${c + 1}`;
  se.say.textContent = (lower
    ? (S.passed < 0 ? 'Tym razem żaden etap nie zaliczony.' : `Melduję: zaliczone etapy do levelu ${S.passed + 1}.`)
      + ` Masz już otwarte levele do levelu ${had + 1}, więc wszystko zostaje po staremu.`
    : S.passed < 0
    ? 'Zaczynasz od podstaw, od levelu 1. Do roboty, rekrucie!'
    : `Melduję: zaliczone etapy do levelu ${S.passed + 1}. Przydział: level ${c + 1}.` + (c ? ' Niższe levele też masz otwarte.' : ''))
    + (add ? ` Na start dostajesz ${group(add)} złota. Wydaj je w Zbrojowni, zanim ruszysz do boju!` : '')
    + (!lower && c + 1 < NCLS ? ` Wyższy level otworzysz, przechodząc ten albo zdając egzamin.` : '');
  se.go.textContent = add ? 'Do Zbrojowni' : 'Do oddziału!'; se.go.hidden = false;
  se.back.textContent = 'Do menu'; se.back.hidden = !add;
}
function selGo() {
  const S = sel;
  if (!S) return;
  if (S.phase === 'intro') selStage();
  else if (S.phase === 'between') { S.c++; selStage(); }
  else if (S.phase === 'done') { sel = null; goMenu(); if (S.add) openArmory('menu'); }
}
function selBack() {
  const S = sel;
  if (!S) return;
  if (S.phase !== 'done') { sel = null; if (S.from === 'levels') { mode = 'levels'; buildLevelList(); show('levels'); } else openStart(); }
  else { sel = null; goMenu(); }
}
function chestGo() {
  if (!chest) return;
  if (chest.phase === 'ready') chestStart();
  else if (chest.phase === 'open' && !ch.loot.hidden) { const g = chest.g; chest = null; showResult(g); }
}

/* ============================================================
   Armoury: permanent upgrades and army colours, bought with gold earned by playing
   ============================================================ */
const COIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#ffc531" stroke="#8a5a00" stroke-width="2"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#d99300" stroke-width="2"/></svg>';
let armoryBack = 'menu';
// Pictures of the upgrades: bullets drawn for the ones about barrels and shots, emoji for the rest
const streak = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#ff8a1a" stroke-width="3.4" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#fff3b0" stroke-width="1.3" stroke-linecap="round"/>`;
const svgIc = body => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const SKILL_IC = {
  rate: '⏩', weapon: '🔫', fire: '🔥', ice: '❄️', poison: '☠️', bolt: '⚡', boom: '💥',
  front: svgIc(streak(8, 21, 8, 4) + streak(16, 21, 16, 4)),
  multi: svgIc(streak(12, 22, 12, 15) + streak(12, 11, 12, 3)),
  pierce: svgIc(`<circle cx="12" cy="15" r="3.6" fill="#6fbf4a" stroke="#2c5a1a" stroke-width="1.4"/><circle cx="12" cy="7" r="3.6" fill="#6fbf4a" stroke="#2c5a1a" stroke-width="1.4"/>` + streak(12, 22, 12, 2)),
  diag: svgIc(streak(12, 21, 12, 4) + streak(11, 20, 4, 6) + streak(13, 20, 20, 6)),
  bounce: svgIc(`<path d="M3 3v18M21 3v18" stroke="#8a93a3" stroke-width="2.2" stroke-linecap="round"/><path d="M11 22L19 15L5 8L12 2" fill="none" stroke="#ff8a1a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 22L19 15L5 8L12 2" fill="none" stroke="#fff3b0" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`),
};
const skillIcon = k => `<span class="sk-ic" aria-hidden="true">${k === 'army' ? `<img alt="" src="${armySprite(save.skin, 0).toDataURL()}">` : SKILL_IC[k]}</span>`;
const pct = x => Math.round(100 * x) + '%';
// What the upgrade does now (L) and what the next level adds
const SKILL_TXT = {
  army: L => `Na start: ${START + ARMY_PER * L} żołnierzy` + (L < maxLv('army') ? `, potem ${START + ARMY_PER * (L + 1)}.` : '.'),
  rate: L => (L ? `Strzelanie szybsze o ${pct(RATE_PER * L)}` : `Każdy poziom: strzelanie szybsze o ${pct(RATE_PER)}`) + (L && L < maxLv('rate') ? `, potem o ${pct(RATE_PER * (L + 1))}.` : '.'),
  weapon: L => `Teraz: ${WEAPONS[L].name}.` + (L < maxLv('weapon') ? ` Następna: ${WEAPONS[L + 1].name}.` : ' Skrzynie w grze dają jeszcze lepszą.'),
  front: L => L ? `${FRONT[L]} pociski obok siebie naraz.` + (L < maxLv('front') ? ' Potem 3.' : '') : 'Dwa pociski obok siebie naraz, potem trzy.',
  pierce: L => `Każdy pocisk trafia o ${L || 1} ${(L || 1) === 1 ? 'wroga' : 'wrogów'} więcej` + (L && L < maxLv('pierce') ? `, potem o ${L + 1}.` : L ? '.' : ', potem jeszcze więcej.'),
  multi: L => `Druga seria tuż za pierwszą: ${pct(MULTI[L || 1])} strzałów` + (L && L < maxLv('multi') ? `, potem ${pct(MULTI[L + 1])}.` : '.'),
  fire: L => `Trafiony wróg płonie i traci życie przez chwilę. Potwór dostaje o ${pct(BOSS_FIRE[L || 1])} więcej.` + (L && L < maxLv('fire') ? ' Następny poziom: mocniejszy ogień.' : ''),
  ice: L => `Trafiony wróg zwalnia, ${pct(FREEZE[L || 1])} zamarza. Zamrożony rozbija się o armię bez strat. Potwór uderza o ${pct(BOSS_ICE[L || 1])} słabiej.`,
  diag: L => `Dwa pociski pod kątem do przodu w ${pct(DIAG[L || 1])} strzałów. Trafiają wrogów z boku.` + (L && L < maxLv('diag') ? ` Potem ${pct(DIAG[L + 1])}.` : ''),
  bounce: L => `Pociski z bocznych luf odbijają się od brzegu drogi: ${BOUNCE[L || 1]} ${(L || 1) === 1 ? 'raz' : 'razy'}.` + (L && L < maxLv('bounce') ? ' Potem 2 razy.' : ''),
  poison: L => `Trucizna zabiera życie przez 6 sekund. Kolejne trafienia ją wzmacniają, do ${POISON[L || 1]} razy. Potwór dostaje o ${pct(BOSS_POISON[L || 1])} więcej.`,
  bolt: L => `Co ${String(BOLT_EVERY[L || 1]).replace('.', ',')} s piorun skacze po ${BOLT_JUMPS[L || 1]} wrogach.` + (L && L < maxLv('bolt') ? ` Potem co ${String(BOLT_EVERY[L + 1]).replace('.', ',')} s po ${BOLT_JUMPS[L + 1]}.` : ''),
  boom: L => `Pokonany wróg wybucha (${pct(BOOM[L || 1])}) i rani sąsiadów. Duzi wybuchają zawsze.` + (L && L < maxLv('boom') ? ` Potem ${pct(BOOM[L + 1])}.` : ''),
};
// the highest level open to the player (upgrades open with it)
const topLevel = () => { let c = 0; while (c + 1 < NCLS && levelOpen(c + 1)) c++; return c; };
function openArmory(from) {
  armoryBack = from; mode = 'armory'; buildArmory(); show('armory');
  screens.armory.querySelector('.card').scrollTop = 0;
}
// "Kup polecane": buys the cheapest upgrade again and again while the gold lasts (like the player the game is tuned for)
function buyRecommended() {
  const top = topLevel();
  for (let n = 0; n < 200; n++) {
    let best = null;
    for (const k of SKILL_KEYS) if (canBuy(save.arm, k, top) && (!best || SKILLS[k].prices[save.arm[k]] < SKILLS[best].prices[save.arm[best]])) best = k;
    if (!best || SKILLS[best].prices[save.arm[best]] > save.gold) break;
    save.gold -= SKILLS[best].prices[save.arm[best]]; save.arm[best]++;
  }
  persist(); Snd.coin(); Snd.power(); buildArmory();
}
function buildArmory() {
  $('arGold').textContent = group(save.gold);
  const list = $('arList'); list.innerHTML = '';
  const top = topLevel();
  $('arAuto').hidden = !SKILL_KEYS.some(k => canBuy(save.arm, k, top) && SKILLS[k].prices[save.arm[k]] <= save.gold);
  for (const key of SKILL_KEYS) {
    const A = SKILLS[key], L = save.arm[key], max = L >= maxLv(key), price = max ? 0 : A.prices[L];
    const closed = A.from > top + 1, needs = !closed && A.needs && !save.arm[A.needs];
    const boost = save.boost.find(b => b.k === key);
    const row = document.createElement('div'); row.className = 'ar-item' + (closed ? ' closed' : '');
    row.innerHTML = `${skillIcon(key)}<div class="ar-txt"><h3>${esc(A.name)}</h3><div class="pips">${A.prices.map((_, i) => `<i class="${i < L ? 'on' : ''}"></i>`).join('')}</div>`
      + `<p>${esc(SKILL_TXT[key](L))}</p>` + (boost ? `<p class="ar-boost">Ze skrzyni: +${boost.n} na następną grę</p>` : '') + '</div>';
    const b = document.createElement('button'); b.className = 'buy';
    b.innerHTML = max ? 'Gotowe' : closed ? `Od levelu ${A.from}` : needs ? 'Najpierw boczne lufy' : `${COIN}${group(price)}`;
    if (closed || needs) b.classList.add('note');
    b.disabled = max || closed || needs || save.gold < price;
    b.setAttribute('aria-label', max ? `${A.name}: najwyższy poziom` : closed ? `${A.name}: od levelu ${A.from}` : `Kup: ${A.name} za ${price} złota`);
    b.addEventListener('click', () => {
      if (save.gold < price || !canBuy(save.arm, key, top)) return;
      save.gold -= price; save.arm[key]++; persist(); Snd.unlock(); Snd.coin(); Snd.power(); buildArmory();
    });
    row.appendChild(b); list.appendChild(row);
  }
  const box = $('arSkins'); box.innerHTML = '';
  SKINS.forEach((K, i) => {
    const own = save.skins.includes(i), b = document.createElement('button');
    b.className = 'skin' + (save.skin === i ? ' on' : '');
    b.innerHTML = `<img alt="" src="${armySprite(i, 0).toDataURL()}"><span>${esc(K.name)}</span>` + (own ? '' : `<span class="price">${COIN}${K.price}</span>`);
    b.disabled = !own && save.gold < K.price;
    b.setAttribute('aria-pressed', String(save.skin === i));
    b.addEventListener('click', () => {
      if (!own) { if (save.gold < K.price) return; save.gold -= K.price; save.skins.push(i); Snd.coin(); }
      save.skin = i; persist(); Snd.unlock(); Snd.tap(); buildArmory();
    });
    box.appendChild(b);
  });
}
function closeArmory() {
  if (armoryBack === 'result') { mode = 'result'; showResultAgain(); } else goMenu();
}

// Lost: a green stink cloud and a big joke over the scene, until the result card
function stinkShow(text) {
  const el = $('stink');
  el.querySelector('.stink-text').innerHTML = text || 'Śmierdzi Ci<br>spod pachy!!!';
  el.hidden = false; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
}
// The end of a game is written down at once (stars, gold for new stars and answers, the next game), before the chest
function recordGame(g) {
  if (g.recorded) return;
  g.recorded = true;
  const won = g.state === 'won', c = g.cls, s = g.s, i = c * STAGES + s;
  const ratio = g.answered ? g.correct / g.answered : 0;
  g.stars = won ? (ratio === 1 ? 3 : ratio >= 0.75 ? 2 : 1) : 0;
  g.pay = { stars: 0, answers: 0, chest: 0 };
  if (g.trial) {                                               // the keyhole game gives nothing and changes nothing,
    g.exam = !levelOpen(c);                                    // but in a closed level it is the exam:
    if (g.exam && won && g.stars === 3) {                    // won without a mistake, the level opens
      g.passed = true; g.pay.exam = openUpTo(c);
      countEvent(`egzamin/level-${c + 1}/zdany`, `Egzamin zdany: level ${c + 1}`);
    }
    return;
  }
  save.boost = [];                                             // the chest's upgrades were for this one game
  const before = save.stars[i];
  g.pay.stars = Math.max(0, starGold(c, g.stars) - starGold(c, before));   // only new stars pay
  g.pay.answers = g.gold;                                      // gold earned in the game is kept even after a loss
  if (won) save.stars[i] = Math.max(before, g.stars);
  if (!before) save.next = won ? nextGame(c, s) : [c, s];    // a replayed old game leaves "Graj" where the player got to
  save.gold += g.pay.stars + g.pay.answers;
  persist();
}
function showResult(g) {
  recordGame(g);
  mode = 'result'; fight.hidden = true; $('stink').hidden = true;
  const won = g.state === 'won', c = g.cls, s = g.s, stars = g.stars, P = g.pay;
  const gain = P.stars + P.answers + P.chest;
  $('reGold').textContent = g.passed ? `+${group(P.exam)} · masz ${group(save.gold)}` : g.trial ? '0 · gra na próbę' : `+${group(gain)} · masz ${group(save.gold)}`;
  const why = [P.stars && `gwiazdki +${group(P.stars)}`, P.chest && `skrzynia +${group(P.chest)}`, P.answers && `odpowiedzi +${group(P.answers)}`].filter(Boolean);
  $('reGoldWhy').textContent = g.trial ? '' : why.join(' · ') + (won && !P.stars && stars ? (why.length ? ' · ' : '') + 'za te gwiazdki złoto już było' : '');
  $('reLevel').textContent = g.exam ? `Level ${c + 1} · egzamin` : g.trial ? `Level ${c + 1} · gra na próbę` : `${stageLabel(c, s)} · ${g.cfg.info.name}`;
  $('reTitle').textContent = g.passed ? 'Egzamin zdany!' : g.exam && won ? 'Egzamin niezdany' : won ? 'Wygrana!' : g.lostBy === 'lesson' ? 'Chyba śmierdzi Ci spod pachy!' : 'Śmierdzi Ci spod pachy!!!';
  $('reStars').innerHTML = [0, 1, 2].map(i => ICON.star(i < stars)).join('');
  [...$('reStars').children].forEach((el, i) => el.classList.toggle('on', i < stars));
  $('reStars').hidden = !won;
  $('reNote').textContent = g.passed
    ? `Level ${c + 1} jest otwarty, razem z niższymi.` + (P.exam ? ' Złoto na start wydaj w Zbrojowni.' : '')
    : g.exam ? `Egzamin do levelu ${c + 1}: trzeba wygrać bez ani jednego błędu (3 gwiazdki). Spróbuj jeszcze raz! Albo przejdź wszystkie ${STAGES} gier levelu ${c}.`
    : g.trial ? `To była gra na próbę. Level ${c + 1} jest już otwarty: zagraj w niego naprawdę.`
    : won ? (stars === 3 ? 'Wszystkie odpowiedzi dobre. Brawo!' : 'Bez pomyłek będą 3 gwiazdki i więcej złota.')
    : (g.fight ? 'W walce każda dobra odpowiedź to posiłki. Spróbuj jeszcze raz.' : 'Dobre odpowiedzi dają więcej żołnierzy. Spróbuj jeszcze raz.');
  $('reCorrect').textContent = `${g.correct} z ${g.answered}`;
  $('reArmy').textContent = String(g.army.n);
  const list = $('reList'); list.innerHTML = '';
  for (const m of g.mistakes.slice(0, 6)) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${richHTML(solved(m))}</strong><span></span>`;
    li.lastChild.innerHTML = m.w === null ? 'Za późno' : richHTML(`Twoja odpowiedź: ${m.w}`);
    list.appendChild(li);
  }
  $('reReview').hidden = g.mistakes.length === 0;
  const nx = save.next, same = nx[0] === c && nx[1] === s;     // the same game again: everything is passed
  $('btnNext').hidden = !won || (g.trial && !g.passed);
  $('btnNext').textContent = g.passed ? `Graj w level ${c + 1}` : same ? 'Cała gra ukończona!' : nx[0] > c ? `Level ${nx[0] + 1}` : 'Następna gra';
  $('btnNext').disabled = same && !g.passed;
  $('btnResultArmory').hidden = g.trial && !g.passed;
  show('result');
}
function showResultAgain() {
  $('reGold').textContent = $('reGold').textContent.replace(/masz [\d ]+/, `masz ${group(save.gold)}`);
  show('result');
}

function buildLevelList() {
  const tabs = $('classTabs'), box = $('levelList');
  tabs.innerHTML = '';
  Z.KLASY.forEach((K, c) => {
    const b = document.createElement('button');
    b.className = 'tab' + (c === save.tab ? ' on' : '') + (levelOpen(c) ? '' : ' closed'); b.textContent = String(c + 1);
    b.setAttribute('aria-label', `Level ${c + 1}` + (levelOpen(c) ? '' : ', zamknięty')); b.setAttribute('aria-pressed', String(c === save.tab));
    b.addEventListener('click', () => { Snd.unlock(); Snd.tap(); save.tab = c; persist(); buildLevelList(); });
    tabs.appendChild(b);
  });
  const c = save.tab, K = Z.KLASY[c];
  const done = save.stars.slice(c * STAGES, c * STAGES + STAGES).filter(x => x > 0).length;
  $('lvClass').textContent = `Level ${c + 1}`;
  $('btnSelect').hidden = levelOpen(NCLS - 1);   // with every level open the selection has nothing left to open
  $('lvAbout').textContent = `${c + 1}. klasa · ${K.opis} · ukończone: ${done} z ${STAGES}`;
  box.innerHTML = '';
  // a closed level says what opens it; every level has "gra na próbę"
  const top = document.createElement('div'); top.className = 'lv-top';
  top.innerHTML = levelOpen(c)
    ? `<button class="btn btn-light lv-trial" id="btnTrial">Zagraj na próbę</button><p class="lv-trial-why">Zajrzyj przez dziurkę od klucza: po trochu ze wszystkich tematów, ulepszenia ustawione jak w połowie levelu. Nie daje złota ani gwiazdek.</p>`
    : `<p class="lv-lock">${ICON.lock}<span>Level ${c + 1} otworzy się, gdy przejdziesz wszystkie ${STAGES} gier levelu ${c} (masz ${gamesDone(c - 1)} z ${STAGES}) albo zdasz egzamin.</span></p>`
      + `<button class="btn btn-gold lv-trial" id="btnTrial">Egzamin</button><p class="lv-trial-why">Po trochu ze wszystkich tematów tego levelu. Wygraj bez ani jednego błędu, a level otworzy się razem z niższymi i dostaniesz złoto na start.</p>`;
  box.appendChild(top);
  top.querySelector('#btnTrial').addEventListener('click', () => { Snd.unlock(); Snd.tap(); openIntro(c, TRIAL_S, true); });
  K.tematy.forEach((tm, b) => {
    const sec = document.createElement('section'); sec.className = 'topic-row';
    sec.innerHTML = `<h3>${esc(tm.nazwa)}</h3><div class="grid5"></div>`;
    const grid = sec.querySelector('.grid5');
    for (let s = b * 5; s < b * 5 + 5; s++) {
      const info = Z.stage(c, s), btn = document.createElement('button');
      const isNext = save.next[0] === c && save.next[1] === s;
      btn.className = 'lvl' + (info.review ? ' rev' : '') + (isNext ? ' cur' : '');
      if (unlocked(c, s)) {
        btn.innerHTML = `<span>${s + 1}</span><span class="st">${[0, 1, 2].map(k => ICON.star(k < starsOf(c, s))).join('')}</span>`;
        btn.setAttribute('aria-label', `Gra ${s + 1}: ${info.name}, gwiazdki: ${starsOf(c, s)} z 3`);
        btn.addEventListener('click', () => { Snd.unlock(); Snd.tap(); openIntro(c, s); });
      } else { btn.disabled = true; btn.innerHTML = ICON.lock; btn.setAttribute('aria-label', `Gra ${s + 1}, zablokowana`); }
      grid.appendChild(btn);
    }
    box.appendChild(sec);
  });
}
// Music: every game draws a style at random, never the same twice in a row; the fight keeps the style of its game
const MUSIC_POOL = ['elektro', 'retro', 'wesola', 'chill', 'turbo', 'neon', 'skok'];
let musicStyle = MUSIC_POOL[Math.floor(Math.random() * MUSIC_POOL.length)];
function drawMusicStyle() { const rest = MUSIC_POOL.filter(m => m !== musicStyle); musicStyle = rest[Math.floor(Math.random() * rest.length)]; }
function playMusic(track, cls) { ui.music = { track, cls }; Snd.play(track, save.music ? musicStyle : null); }
function updateSoundBtns() {
  for (const [key, label] of [['music', 'Muzyka'], ['sfx', 'Dźwięki'], ['learn', 'Nauka po błędzie']]) {
    for (const b of document.querySelectorAll(`[data-toggle="${key}"]`)) { b.textContent = `${label}: ${save[key] ? 'wł.' : 'wył.'}`; b.setAttribute('aria-pressed', String(save[key])); }
  }
}
function toggle(key) {
  save[key] = !save[key]; persist(); updateSoundBtns();
  if (save[key] && key !== 'learn') Snd.unlock();
  if (key === 'music') { Snd.setMusic(save.music); if (ui.music) playMusic(ui.music.track, ui.music.cls); }
}

const tap = (id, fn) => $(id).addEventListener('click', () => { Snd.unlock(); Snd.tap(); fn(); });
tap('btnPlay', () => openIntro(save.next[0], save.next[1]));
tap('btnLevels', () => { mode = 'levels'; save.tab = save.next[0]; buildLevelList(); show('levels'); });
tap('btnLevelsClose', goMenu);
for (const b of document.querySelectorAll('[data-toggle]')) b.addEventListener('click', () => { Snd.unlock(); toggle(b.dataset.toggle); Snd.tap(); });
tap('btnStart', () => startStage(pending));
tap('btnIntroBack', goMenu);
tap('btnPause', pauseGame);
tap('btnResume', resumeGame);
tap('btnRestart', () => restart(game));
tap('btnPauseMenu', goMenu);
tap('btnNext', () => { const [c, s] = save.next; openIntro(c, s); });
tap('btnAgain', () => restart(game));
tap('btnResultMenu', goMenu);
tap('btnArmory', () => openArmory('menu'));
tap('btnResultArmory', () => openArmory('result'));
tap('btnArmoryBack', closeArmory);
$('arAuto').addEventListener('click', () => { Snd.unlock(); buyRecommended(); });
se.L.addEventListener('click', () => selPick(true));
se.R.addEventListener('click', () => selPick(false));
tap('seGo', selGo);
tap('seBack', selBack);
tap('stBegin', chooseBegin);
tap('stSelect', openSelect);
tap('btnSelect', () => openSelect('levels'));
ch.L.addEventListener('click', () => chestPick(true));
ch.R.addEventListener('click', () => chestPick(false));
tap('chGo', chestGo);
le.L.addEventListener('click', () => lessonPick(true));
le.R.addEventListener('click', () => lessonPick(false));
tap('leNext', lessonNext);
ansL.addEventListener('click', () => pickAnswer(true));
ansR.addEventListener('click', () => pickAnswer(false));

/* ============================================================
   How to add the game to the home screen: shown every time the game is opened in a phone browser
   (not when it already runs from the home screen), with pictures for iPhone and Android
   ============================================================ */
const UA = navigator.userAgent || '';
const IS_IOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// big Android tablets open pages in Chrome's "computer" mode and do not say Android, but they have a touch screen
const IS_ANDROID = /Android/i.test(UA) || (/X11; Linux x86_64/.test(UA) && !/CrOS/.test(UA) && navigator.maxTouchPoints > 1);
// browsers inside other apps (Messenger, Facebook, Instagram, TikTok…) cannot put a page on the home screen
const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|Line\/|TikTok|musical_ly|Snapchat|GSA\/|; wv\)/.test(UA);
const isStandalone = () => navigator.standalone === true ||
  (!!window.matchMedia && ['standalone', 'fullscreen', 'minimal-ui'].some(m => matchMedia(`(display-mode: ${m})`).matches));
const canOfferInstall = () => (IS_IOS || IS_ANDROID) && !isStandalone() && window.top === window;
let installEvent = null;      // Android Chrome: the system "install" window, if the phone offers it
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; $('instInstall').hidden = instOS !== 'android'; });
window.addEventListener('appinstalled', () => { installEvent = null; closeInstall(); $('btnInstallHelp').hidden = true; });

// Pictures: a phone screen with the button to tap circled in orange
const TAP = '#ff9f1a', INK = '#15233b', BLUEI = '#2f7df6', GREY = '#5f6b7d';
const pic = body => `<svg viewBox="0 0 260 140" aria-hidden="true"><rect width="260" height="140" rx="14" fill="#e8eef6"/>${body}</svg>`;
const dots = (x, y, vertical) => `<g fill="${INK}">${[-7, 0, 7].map(d => `<circle cx="${vertical ? x : x + d}" cy="${vertical ? y + d : y}" r="2.3"/>`).join('')}</g>`;
const ring = (x, y, r) => `<circle class="tap" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${TAP}" stroke-width="4"/>`;
const box = (x, y, w, h) => `<rect class="tap" x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="none" stroke="${TAP}" stroke-width="3.5"/>`;
const row = (y, label, icon, hi) => `${hi ? `<rect x="74" y="${y}" width="168" height="26" rx="8" fill="#fff3d6"/>` : ''}<text x="86" y="${y + 17}" font-size="12" fill="${INK}">${label}</text>${icon || ''}${hi ? box(72, y - 2, 172, 30) : ''}`;
// a menu row with its icon on the left, as in Safari on iOS 26
const rowL = (x, y, w, label, icon, hi) => `${hi ? `<rect x="${x}" y="${y}" width="${w}" height="26" rx="8" fill="#fff3d6"/>` : ''}${icon || ''}<text x="${x + 32}" y="${y + 17}" font-size="12" fill="${INK}">${label}</text>${hi ? box(x - 2, y - 2, w + 4, 30) : ''}`;
const bookIcon = (x, y) => `<path d="M${x - 7} ${y - 5}q3.5-2 7 0q3.5-2 7 0v11q-3.5-2-7 0q-3.5-2-7 0zM${x} ${y - 5}v11" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
const shareIcon = (x, y) => `<g fill="none" stroke="${BLUEI}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M${x} ${y + 2}v-12M${x - 4} ${y - 6}l4-4 4 4M${x - 6} ${y - 2}h-2v10h16v-10h-2"/></g>`;
const plusIcon = (x, y) => `<g fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"><rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="3"/><path d="M${x} ${y - 4}v8M${x - 4} ${y}h8"/></g>`;
const installIcon = (x, y) => `<g fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M${x - 5} ${y - 8}h-5v12h20v-12h-5M${x - 4} ${y + 9}h8M${x} ${y + 4}v5M${x} ${y - 10}v9M${x - 3.5} ${y - 4.5}l3.5 3.5 3.5-3.5"/></g>`;
const starIcon = (x, y) => `<path d="M${x} ${y - 8}l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
const gameIcon = (x, y, s) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.24}" fill="#ffc531" stroke="${INK}" stroke-width="2"/><text class="disp" x="${x + s / 2}" y="${y + s * 0.62}" text-anchor="middle" font-size="${s * 0.34}" fill="${INK}">7·8</text>`;
// QR code with the game's address (made with segno, checked by reading it back), for tablets without SMS or messengers
const GAME_URL = 'jacekordowski.github.io/Yaceq-Placeq';
const QR = { n: 33, d: 'M0 0h7v1h-7zM11 0h1v1h-1zM13 0h4v1h-4zM18 0h1v1h-1zM20 0h3v1h-3zM26 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM10 1h1v1h-1zM12 1h1v1h-1zM14 1h1v1h-1zM16 1h2v1h-2zM19 1h1v1h-1zM26 1h1v1h-1zM32 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM10 2h2v1h-2zM13 2h1v1h-1zM16 2h1v1h-1zM19 2h1v1h-1zM21 2h1v1h-1zM23 2h2v1h-2zM26 2h1v1h-1zM28 2h3v1h-3zM32 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h2v1h-2zM11 3h1v1h-1zM14 3h2v1h-2zM18 3h6v1h-6zM26 3h1v1h-1zM28 3h3v1h-3zM32 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM10 4h3v1h-3zM14 4h1v1h-1zM16 4h1v1h-1zM18 4h3v1h-3zM26 4h1v1h-1zM28 4h3v1h-3zM32 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM10 5h1v1h-1zM12 5h1v1h-1zM14 5h2v1h-2zM20 5h2v1h-2zM23 5h1v1h-1zM26 5h1v1h-1zM32 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h7v1h-7zM8 7h1v1h-1zM10 7h3v1h-3zM14 7h1v1h-1zM18 7h3v1h-3zM22 7h1v1h-1zM1 8h1v1h-1zM3 8h4v1h-4zM8 8h2v1h-2zM12 8h2v1h-2zM17 8h1v1h-1zM19 8h1v1h-1zM24 8h3v1h-3zM28 8h2v1h-2zM31 8h1v1h-1zM0 9h5v1h-5zM8 9h2v1h-2zM11 9h1v1h-1zM13 9h2v1h-2zM16 9h1v1h-1zM18 9h2v1h-2zM21 9h1v1h-1zM23 9h1v1h-1zM28 9h3v1h-3zM1 10h1v1h-1zM3 10h1v1h-1zM5 10h3v1h-3zM9 10h1v1h-1zM11 10h2v1h-2zM16 10h3v1h-3zM21 10h3v1h-3zM25 10h1v1h-1zM28 10h5v1h-5zM2 11h1v1h-1zM7 11h1v1h-1zM10 11h1v1h-1zM12 11h2v1h-2zM16 11h4v1h-4zM23 11h1v1h-1zM25 11h3v1h-3zM30 11h1v1h-1zM3 12h4v1h-4zM8 12h1v1h-1zM11 12h1v1h-1zM14 12h1v1h-1zM16 12h3v1h-3zM21 12h1v1h-1zM23 12h5v1h-5zM32 12h1v1h-1zM3 13h1v1h-1zM10 13h2v1h-2zM14 13h3v1h-3zM18 13h1v1h-1zM22 13h2v1h-2zM25 13h1v1h-1zM27 13h1v1h-1zM0 14h1v1h-1zM2 14h2v1h-2zM5 14h3v1h-3zM11 14h2v1h-2zM15 14h2v1h-2zM19 14h2v1h-2zM22 14h1v1h-1zM26 14h1v1h-1zM28 14h1v1h-1zM30 14h1v1h-1zM1 15h1v1h-1zM9 15h1v1h-1zM16 15h2v1h-2zM22 15h4v1h-4zM29 15h2v1h-2zM32 15h1v1h-1zM0 16h7v1h-7zM12 16h4v1h-4zM17 16h2v1h-2zM20 16h1v1h-1zM22 16h7v1h-7zM0 17h3v1h-3zM5 17h1v1h-1zM7 17h2v1h-2zM10 17h1v1h-1zM14 17h2v1h-2zM17 17h4v1h-4zM22 17h1v1h-1zM26 17h1v1h-1zM28 17h1v1h-1zM30 17h3v1h-3zM2 18h1v1h-1zM4 18h1v1h-1zM6 18h4v1h-4zM12 18h3v1h-3zM16 18h1v1h-1zM18 18h2v1h-2zM21 18h3v1h-3zM27 18h1v1h-1zM29 18h2v1h-2zM32 18h1v1h-1zM0 19h1v1h-1zM2 19h1v1h-1zM4 19h1v1h-1zM7 19h6v1h-6zM14 19h1v1h-1zM17 19h1v1h-1zM20 19h1v1h-1zM23 19h2v1h-2zM28 19h3v1h-3zM32 19h1v1h-1zM3 20h5v1h-5zM9 20h2v1h-2zM13 20h1v1h-1zM17 20h1v1h-1zM19 20h1v1h-1zM24 20h1v1h-1zM27 20h1v1h-1zM29 20h1v1h-1zM31 20h2v1h-2zM0 21h1v1h-1zM2 21h1v1h-1zM4 21h1v1h-1zM8 21h5v1h-5zM15 21h3v1h-3zM19 21h1v1h-1zM22 21h2v1h-2zM25 21h6v1h-6zM0 22h1v1h-1zM4 22h3v1h-3zM8 22h1v1h-1zM11 22h1v1h-1zM14 22h1v1h-1zM17 22h1v1h-1zM21 22h3v1h-3zM27 22h2v1h-2zM30 22h3v1h-3zM0 23h1v1h-1zM4 23h2v1h-2zM8 23h1v1h-1zM13 23h2v1h-2zM16 23h1v1h-1zM19 23h1v1h-1zM22 23h3v1h-3zM26 23h2v1h-2zM30 23h2v1h-2zM0 24h3v1h-3zM5 24h4v1h-4zM10 24h2v1h-2zM14 24h2v1h-2zM19 24h1v1h-1zM23 24h7v1h-7zM8 25h1v1h-1zM10 25h2v1h-2zM13 25h2v1h-2zM18 25h1v1h-1zM21 25h1v1h-1zM24 25h1v1h-1zM28 25h1v1h-1zM30 25h2v1h-2zM0 26h7v1h-7zM11 26h1v1h-1zM13 26h2v1h-2zM16 26h1v1h-1zM19 26h3v1h-3zM23 26h2v1h-2zM26 26h1v1h-1zM28 26h1v1h-1zM30 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM8 27h1v1h-1zM10 27h1v1h-1zM13 27h1v1h-1zM15 27h1v1h-1zM19 27h1v1h-1zM22 27h3v1h-3zM28 27h4v1h-4zM0 28h1v1h-1zM2 28h3v1h-3zM6 28h1v1h-1zM8 28h1v1h-1zM11 28h1v1h-1zM15 28h1v1h-1zM17 28h1v1h-1zM20 28h1v1h-1zM22 28h7v1h-7zM31 28h2v1h-2zM0 29h1v1h-1zM2 29h3v1h-3zM6 29h1v1h-1zM8 29h1v1h-1zM11 29h1v1h-1zM13 29h2v1h-2zM16 29h2v1h-2zM19 29h4v1h-4zM24 29h2v1h-2zM27 29h1v1h-1zM29 29h2v1h-2zM32 29h1v1h-1zM0 30h1v1h-1zM2 30h3v1h-3zM6 30h1v1h-1zM10 30h2v1h-2zM13 30h2v1h-2zM19 30h1v1h-1zM23 30h3v1h-3zM27 30h3v1h-3zM31 30h2v1h-2zM0 31h1v1h-1zM6 31h1v1h-1zM8 31h1v1h-1zM10 31h2v1h-2zM15 31h3v1h-3zM19 31h2v1h-2zM22 31h1v1h-1zM25 31h1v1h-1zM27 31h2v1h-2zM30 31h3v1h-3zM0 32h7v1h-7zM13 32h1v1h-1zM15 32h2v1h-2zM18 32h3v1h-3zM23 32h2v1h-2zM27 32h2v1h-2z' };
const qrPic = () => `<svg class="qr" viewBox="-4 -4 ${QR.n + 8} ${QR.n + 8}" shape-rendering="crispEdges" role="img" aria-label="Kod QR z adresem gry"><rect x="-4" y="-4" width="${QR.n + 8}" height="${QR.n + 8}" fill="#fff"/><path d="${QR.d}" fill="${INK}"/></svg>
  <div class="qr-url">Aparat nie widzi kodu? Wpisz w przeglądarce:<br><b>${GAME_URL}</b></div>`;
// Many Android phones do not read QR codes in the plain camera, or only after a setting is switched on
const QR_ANDROID = 'Na Androidzie nic się nie pojawia? W aparacie wybierz <b>Google Lens</b> (albo w aplikacji <b>Google</b> stuknij ikonę aparatu). W Samsungu włącz w ustawieniach aparatu <b>Skanuj kody QR</b>. Jeśli zdjęcie kodu już jest, otwórz je w <b>Zdjęciach Google</b> i stuknij <b>Lens</b>.';
const INSTALL = {
  ios: [
    ['Stuknij <b>⋯</b> (trzy kropki) obok adresu strony na dole ekranu. Jeśli od razu widzisz ikonę <b>Udostępnij</b> (kwadrat ze strzałką w górę), stuknij ją i przejdź do kroku 3.',
      pic(`<rect x="14" y="12" width="232" height="70" rx="10" fill="#fff"/><text class="disp" x="130" y="46" text-anchor="middle" font-size="20" fill="${INK}">Śmierdzipacha</text><text x="130" y="66" text-anchor="middle" font-size="10" fill="${GREY}">strona gry w Safari</text>
        <circle cx="34" cy="111" r="16" fill="#fff"/><path d="M38 103l-8 8 8 8" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
        <rect x="58" y="95" width="188" height="32" rx="16" fill="#fff" stroke="#cdd6e2"/><text x="72" y="115" font-size="11" fill="${INK}">jacekordowski.github.io</text>
        <circle cx="226" cy="111" r="12" fill="#e8eef6"/>${dots(226, 111)}${ring(226, 111, 18)}`)],
    ['Stuknij <b>Udostępnij</b>. Jest na samej górze menu.',
      pic(`<rect x="64" y="10" width="182" height="120" rx="16" fill="#fff"/>${rowL(72, 18, 166, 'Udostępnij', shareIcon(88, 32), true)}
        ${rowL(72, 48, 166, 'Dodaj do Zakładki', `<path d="M83 53h10v14l-5-4-5 4z" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`)}
        ${rowL(72, 74, 166, 'Dodaj zakładkę do…', bookIcon(88, 87))}${rowL(72, 100, 166, 'Nowa karta', `<path d="M88 107v12M82 113h12" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`)}`)],
    ['Stuknij <b>Do ekranu głównego</b>. Jeśli nie widzisz tego napisu, stuknij najpierw <b>Pokaż więcej</b> (kółko ze strzałką) albo przewiń listę w dół.',
      pic(`<rect x="10" y="6" width="240" height="128" rx="14" fill="#fff"/>${gameIcon(20, 12, 22)}<text x="50" y="22" font-size="11" fill="${INK}">Śmierdzipacha</text><text x="50" y="33" font-size="8" fill="${GREY}">jacekordowski.github.io</text>
        ${[['Kopiuj', 46], ['Zakładki', 96], ['Czytelnia', 146], ['Pokaż więcej', 206]].map(([t, x]) => `<circle cx="${x}" cy="54" r="11" fill="#e3e8ef"/><text x="${x}" y="77" text-anchor="middle" font-size="8" fill="${INK}">${t}</text>`).join('')}
        <path d="M201 52l5 5 5-5" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="206" cy="54" r="15" fill="none" stroke="${TAP}" stroke-width="2.5" stroke-dasharray="4 3"/>
        <text x="50" y="96" font-size="11" fill="${GREY}">Znajdź na stronie</text>
        ${rowL(18, 104, 224, 'Do ekranu głównego', plusIcon(34, 117), true)}`)],
    ['Zostaw włączone <b>Otwórz jako aplikację www</b> i stuknij niebieski przycisk <b>Dodaj</b> w prawym górnym rogu.',
      pic(`<rect x="14" y="10" width="232" height="120" rx="14" fill="#fff"/><circle cx="34" cy="30" r="11" fill="#e3e8ef"/><path d="M30 26l8 8M38 26l-8 8" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
        <text x="114" y="34" text-anchor="middle" font-size="11" fill="${INK}">Do ekranu głównego</text>
        <rect x="190" y="18" width="48" height="24" rx="12" fill="${BLUEI}"/><text x="214" y="34" text-anchor="middle" font-size="12" fill="#fff">Dodaj</text>${box(186, 14, 56, 32)}
        ${gameIcon(28, 52, 34)}<text x="74" y="66" font-size="12" fill="${INK}">Śmierdzipacha</text><text x="74" y="80" font-size="8" fill="${GREY}">https://jacekordowski.github.io/…</text>
        <text x="28" y="112" font-size="11" fill="${INK}">Otwórz jako aplikację www</text><rect x="196" y="99" width="36" height="20" rx="10" fill="#34c759"/><circle cx="222" cy="109" r="8" fill="#fff"/>`)],
  ],
  android: [
    ['W przeglądarce Chrome stuknij ikonę <b>Zainstaluj</b> na pasku adresu: ekran ze strzałką w dół, obok gwiazdki.',
      pic(`<rect x="10" y="12" width="240" height="42" rx="21" fill="#fff"/><text x="26" y="37" font-size="11" fill="${INK}">github.io/Yaceq-Placeq/</text>
        ${installIcon(196, 33)}${ring(196, 33, 17)}${starIcon(230, 33)}
        <rect x="10" y="62" width="240" height="68" rx="10" fill="#fff"/><text class="disp" x="130" y="102" text-anchor="middle" font-size="20" fill="${INK}">Śmierdzipacha</text>`)],
    ['Nie widzisz tej ikony? Stuknij <b>⋮</b> (trzy kropki) w prawym górnym rogu i wybierz <b>Zainstaluj aplikację</b>. W niektórych telefonach ten napis to <b>Dodaj do ekranu głównego</b>.',
      pic(`<rect x="70" y="8" width="176" height="124" rx="12" fill="#fff"/>${row(14, 'Nowa karta', '')}${row(38, 'Historia', '')}${row(62, 'Pobrane pliki', '')}${row(88, 'Zainstaluj aplikację', '', true)}${row(112, 'Ustawienia', '')}`)],
    ['W okienku <b>Zainstaluj aplikację</b> stuknij <b>Zainstaluj</b>. Jeśli telefon zapyta, gdzie położyć ikonę, wybierz <b>Dodaj automatycznie</b>.',
      pic(`<rect x="20" y="12" width="220" height="116" rx="18" fill="#fff"/><text x="38" y="38" font-size="13" fill="${INK}">Zainstaluj aplikację</text>${gameIcon(38, 52, 30)}
        <text x="78" y="64" font-size="12" fill="${INK}">Śmierdzipacha</text><text x="78" y="78" font-size="9" fill="${GREY}">jacekordowski.github.io</text>
        <text x="138" y="114" text-anchor="middle" font-size="12" fill="${BLUEI}">Anuluj</text><text x="196" y="114" text-anchor="middle" font-size="12" fill="${BLUEI}">Zainstaluj</text>${box(166, 98, 60, 24)}`)],
  ],
  qr: [
    ['Na drugim telefonie albo tablecie otwórz <b>Aparat</b> i skieruj go na ten kod. <b>Nie rób zdjęcia</b>: przytrzymaj aparat chwilę nad kodem.', qrPic()],
    ['Stuknij link, który pojawi się na ekranie. Otworzy się gra.', ''],
    [QR_ANDROID, ''],
    ['Dodaj grę do ekranu tamtego urządzenia. Instrukcja pokaże się tam sama. Jest też w zakładkach <b>iPhone / iPad</b> i <b>Android</b>.', ''],
  ],
  done: ['Gotowe! Uruchamiaj grę tą ikoną. Otworzy się na cały ekran, jak zwykła aplikacja.',
    pic(`<rect x="10" y="8" width="240" height="124" rx="12" fill="#5b6fd6"/>${[0, 1, 2, 3].map(i => [0, 1].map(j => (i === 1 && j === 0) ? '' : `<rect x="${34 + i * 52}" y="${20 + j * 58}" width="36" height="36" rx="9" fill="rgba(255,255,255,0.35)"/>`).join('')).join('')}
      ${gameIcon(86, 20, 36)}${ring(104, 38, 26)}<text x="104" y="70" text-anchor="middle" font-size="9" fill="#fff">Śmierdzipacha</text>`)],
  inApp: ['Ten link otworzył się w komunikatorze, np. w Messengerze. Stąd nie da się dodać gry do ekranu. Stuknij <b>⋯</b> albo <b>⋮</b> w rogu i wybierz <b>Otwórz w przeglądarce</b> (Safari albo Chrome). Możesz też skopiować link i wkleić go w przeglądarce.',
    pic(`<rect x="10" y="10" width="240" height="34" rx="10" fill="#fff"/><path d="M24 21l10 10M34 21L24 31" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/><text x="130" y="31" text-anchor="middle" font-size="11" fill="${INK}">jacekordowski.github.io</text>
      ${dots(230, 27)}${ring(230, 27, 15)}<rect x="96" y="52" width="150" height="76" rx="12" fill="#fff"/>
      <rect x="102" y="60" width="138" height="26" rx="8" fill="#fff3d6"/><text x="112" y="77" font-size="11" fill="${INK}">Otwórz w przeglądarce</text>${box(100, 58, 142, 30)}<text x="112" y="111" font-size="11" fill="${GREY}">Kopiuj link</text>`)],
};
let instOS = IS_ANDROID ? 'android' : 'ios';
function renderInstall() {
  const li = ([text, svg]) => `<li><p><span>${text}</span></p>${svg}</li>`;
  const inApp = IN_APP && canOfferInstall(), qr = instOS === 'qr' && !inApp;
  $('instTitle').textContent = inApp ? 'Otwórz grę w przeglądarce' : qr ? 'Gra na innym tablecie lub telefonie' : 'Dodaj grę do ekranu telefonu';
  $('instWhy').textContent = inApp ? 'Potem dodasz ją do ekranu telefonu i będzie się otwierać jak aplikacja.'
    : qr ? 'Wystarczy aparat. Nie trzeba SMS-a, WhatsAppa ani e-maila.'
    : 'Gra otworzy się jak aplikacja: na cały ekran, bez paska przeglądarki, jednym stuknięciem.';
  $('instTabs').hidden = inApp;
  $('instCopy').hidden = !inApp;
  $('instInstall').hidden = !(installEvent && instOS === 'android' && !inApp);
  $('instSteps').innerHTML = inApp ? li(INSTALL.inApp) : INSTALL[instOS].map(li).join('') + (qr ? '' : li(INSTALL.done));
  for (const b of $('instTabs').children) b.setAttribute('aria-selected', String(b.dataset.os === instOS));
}
function openInstall() { renderInstall(); $('scrInstall').hidden = false; $('scrInstall').querySelector('.card').scrollTop = 0; }
function closeInstall() { $('scrInstall').hidden = true; }
for (const b of $('instTabs').children) b.addEventListener('click', () => { Snd.unlock(); Snd.tap(); instOS = b.dataset.os; renderInstall(); });
tap('instClose', closeInstall);
tap('instLater', closeInstall);
tap('btnInstallHelp', openInstall);
tap('instInstall', () => {
  if (!installEvent) return;
  installEvent.prompt();
  installEvent.userChoice.then(c => { if (c.outcome === 'accepted') closeInstall(); }).catch(() => {});
  installEvent = null; renderInstall();
});
// Share the game: the QR code for another phone or tablet, also when the game already runs from the home screen
const SHARE_URL = `https://${GAME_URL}/`;
function openShare() {
  $('shQr').innerHTML = qrPic(); $('shAndroid').innerHTML = QR_ANDROID;
  $('shSend').hidden = !navigator.share;
  $('shCopy').textContent = 'Kopiuj link';
  $('scrShare').hidden = false; $('scrShare').querySelector('.card').scrollTop = 0;
}
function closeShare() { $('scrShare').hidden = true; }
tap('btnShare', openShare);
tap('shClose', closeShare);
tap('shBack', closeShare);
tap('shSend', () => { navigator.share({ title: 'Śmierdzipacha', text: 'Zagraj w Śmierdzipachę: matematyka w biegu i w walce!', url: SHARE_URL }).catch(() => {}); });
tap('shCopy', () => {
  const done = () => { $('shCopy').textContent = 'Skopiowano link'; };
  try { navigator.clipboard.writeText(SHARE_URL).then(done, () => { prompt('Skopiuj ten link:', SHARE_URL); }); } catch (e) { prompt('Skopiuj ten link:', SHARE_URL); }
});
tap('instCopy', () => {
  const done = () => { $('instCopy').textContent = 'Skopiowano. Wklej link w Safari albo Chrome'; };
  try { navigator.clipboard.writeText(location.href).then(done, () => { prompt('Skopiuj ten link:', location.href); }); } catch (e) { prompt('Skopiuj ten link:', location.href); }
});

// Steering: the army follows the finger
let drag = null;
canvas.addEventListener('pointerdown', e => {
  Snd.unlock();
  if (mode !== 'play' || game.state !== 'run') return;
  drag = { id: e.pointerId, x: e.clientX };
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});
canvas.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id || mode !== 'play' || game.state !== 'run') return;
  const dx = e.clientX - drag.x; drag.x = e.clientX;
  game.army.tx = clamp(game.army.tx + dx / (view.F / ARMY_D) * 1.15, -XMAX, XMAX);
});
const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
document.addEventListener('touchmove', e => { if (mode === 'play') e.preventDefault(); }, { passive: false });

const keys = { left: false, right: false };
window.addEventListener('keydown', e => {
  const L = e.key === 'ArrowLeft' || e.key === 'a', R = e.key === 'ArrowRight' || e.key === 'd';
  if (mode === 'play' && game.state === 'fight' && (L || R)) { if (!e.repeat) pickAnswer(L); return; }
  if (!$('scrInstall').hidden) { if (e.key === 'Escape') closeInstall(); return; }
  if (!$('scrShare').hidden) { if (e.key === 'Escape') closeShare(); return; }
  if (mode === 'lesson') { if ((L || R) && !e.repeat) lessonPick(L); return; }
  if (mode === 'chest') { if ((L || R) && !e.repeat) chestPick(L); return; }
  if (mode === 'select') { if ((L || R) && !e.repeat) selPick(L); return; }
  if (L) keys.left = true; else if (R) keys.right = true;
  else if (e.key === 'Escape' || e.key === 'p') { if (mode === 'play') pauseGame(); else if (mode === 'pause') resumeGame(); }
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  else if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseGame(); Snd.suspend(); } else if (mode !== 'pause') Snd.resume(); });
window.addEventListener('resize', () => {
  if (mode === 'play') { view.hudBottom = probCard.hidden ? view.hudBottom : probCard.getBoundingClientRect().bottom; if (!fight.hidden) view.fightY = fight.getBoundingClientRect().top - 14; }
  layout();
});

let last = performance.now();
// the monster's test runs, a few milliseconds in every frame; true when ready
function calibFor(g, ms) {
  if (!g || !g.calib) return false;
  const t0 = performance.now();
  while (g.calib && performance.now() - t0 < ms) calibrate(g, 20);
  return !g.calib;
}
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  if (mode === 'play') {
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir && game.state === 'run') game.army.tx = clamp(game.army.tx + dir * 7 * dt, -XMAX, XMAX);
    step(game, dt);
    handleEvents(game);
    updateProblem(game, false);
    if (game.state === 'fight' && game.fight.p && !game.fight.done) fqTime.style.transform = `scaleX(${clamp((game.fight.deadline - game.time) / game.cfg.think, 0, 1)})`;
    $('hudProg').style.transform = `scaleX(${clamp(game.army.z / (game.monster.z - FIGHT_DIST), 0, 1)})`;
    if (game.state !== 'run' && game.state !== 'fight' && game.time > game.endAt) { if (game.state === 'won' && !game.trial) openChest(game); else showResult(game); }
    else if (ui.lessonQ && game.time >= ui.lessonQ.at) {
      const q = ui.lessonQ; ui.lessonQ = null;
      if (game.state === 'run' || game.state === 'fight') openLesson(q.p, q.your);
    }
    calibFor(game, 3);
  } else if (mode === 'lesson') { lessonTick(dt); calibFor(game, 6); }
  else if (mode === 'chest') { chestTick(dt); step(game, dt); handleEvents(game); }
  else if (mode === 'select') { selTick(dt); step(game, dt); handleEvents(game); }
  else if (mode !== 'pause') {
    if (mode === 'intro' && pending && pending.calib && calibFor(pending, 8)) showHp();
    step(game, dt);
    handleEvents(game);
  }
  render(game, dt);
  requestAnimationFrame(frame);
}

function boot() {
  layout();
  goMenu();
  if ('serviceWorker' in navigator && window.top === window && /^https:|^http:\/\/(localhost|127\.0\.0\.1)/.test(location.href)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});   // lets the game open without internet
  }
  $('btnInstallHelp').hidden = !canOfferInstall();
  if (!save.start && !save.stars.some(x => x > 0)) openStart();   // a new player: "Jak chcesz grać?"
  // the first start from the home screen icon: the game was added to this phone (counted once per phone)
  if (isStandalone() && !save.installed) { save.installed = true; persist(); countEvent('instalacja', 'Gra dodana do ekranu telefonu'); }
  if (canOfferInstall()) openInstall();
  if (document.fonts && document.fonts.load) document.fonts.load(`40px ${FD}`, 'Aąćęńśźż').catch(() => {});
  requestAnimationFrame(t => { last = t; frame(t); });
}
const hot = window.claude && window.claude.hot;
if (hot && hot.ready) hot.ready(boot); else boot();
})();
