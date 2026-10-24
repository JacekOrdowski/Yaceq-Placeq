/* Wersja robocza: sprawdza balans bitwy bez ekranu.
   Rozgrywa wiele bitew na kilku etapach. Karty są wybierane „losowo” (jak dziecko, które klika cokolwiek)
   albo „z głową” (najpierw super i połączenia, potem wieżyczki i ulepszenia). Strażnika prowadzi:
   „gracz” (co 0,2 s idzie tam, gdzie meteory są najgroźniejsze), „słaby gracz” (co 0,5 s i nie zawsze trafia w miejsce)
   albo nikt („stoi” na środku, także z kartami wybieranymi „na wieżyczki”). Kto stoi, ma przegrać nawet z najlepszymi kartami.
   Uruchom: node narzedzia/balans-robocza.js [bitew na etap] [ostatni etap] */
'use strict';
const R = require('../wersja-robocza/gra.js');
const N = +process.argv[2] || 40, LAST = +process.argv[3] || 5;
const rand = (a, b) => a + Math.random() * (b - a);
const DOME_TOP = 640;

const choosers = {
  losowo: (G, off) => off[Math.floor(Math.random() * off.length)],
  'z głową': (G, off) => {
    const built = Object.keys(G.w).length - 1;
    const score = c => c.type === 'super' ? 100 : c.type === 'combo' ? 70
      : c.type === 'build' ? 60 - 10 * built : c.type === 'heal' ? (G.baseHp < G.baseMax * 0.4 ? 90 : 5)
      : 30 + (c.w === 'robot' ? 12 : 0) + (c.id === 'dmg' ? 8 : 0) + Math.random() * 10;
    return off.reduce((a, b) => (score(b) > score(a) ? b : a));
  },
  // the best a robot standing still can do: everything into the turrets
  'na wieżyczki': (G, off) => {
    const score = c => c.type === 'super' && c.w !== 'robot' ? 100 : c.type === 'combo' ? 80 : c.type === 'build' ? 90
      : c.type === 'heal' ? (G.baseHp < G.baseMax * 0.5 ? 95 : 5) : c.w !== 'robot' ? 50 + Math.random() * 10 : 10 + Math.random() * 10;
    return off.reduce((a, b) => (score(b) > score(a) ? b : a));
  },
};
// where the meteors are most dangerous: many of them, close to the dome
function bestX(G) {
  const r = G.w.robot, half = 6 + up(r, 'multi') * 4;
  let best = r.x, bs = -1;
  for (let x = 22; x <= 378; x += 6) {
    let sc = 0;
    for (const e of G.enemies) if (!e.dead && e.y > -30 && Math.abs(e.x - x) < e.r + half) sc += 0.2 + (Math.max(0, e.y) / DOME_TOP) ** 2;
    sc -= Math.abs(x - r.x) * 0.002;
    if (sc > bs) { bs = sc; best = x; }
  }
  if (G.boss && bs < 0.3) best = G.boss.x;
  return best;
}
const up = (w, id) => w.ups[id] || 0;
const mover = (react, miss) => () => { let next = 0; return G => { if (G.t >= next) { next = G.t + react; G.aim = bestX(G) + rand(-miss, miss); } }; };
const movers = { gracz: mover(0.2, 0), 'słaby gracz': mover(0.5, 30), stoi: () => G => { G.aim = 200; } };

function battle(stage, choose, makeMove) {
  const G = R.newBattle(stage), dt = 1 / 30, move = makeMove();
  let bossAt = null, minHp = 1;
  while (!G.over && G.t < 600) {
    if (G.pending) { R.applyCard(G, choose(G, R.makeOffer(G))); continue; }
    move(G);
    R.step(G, dt);
    if (G.boss && bossAt === null) bossAt = G.t;
    minHp = Math.min(minHp, G.baseHp / G.baseMax);
  }
  return { win: G.over === 'win', t: G.t, hp: G.baseHp / G.baseMax, minHp, lvl: G.lvl, bossFight: bossAt !== null && G.over === 'win' ? G.t - bossAt : null, dmg: G.dmg, w: Object.keys(G.w) };
}

const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const pct = x => (isNaN(x) ? '   –' : `${Math.round(x * 100)}%`).padStart(5);
const sec = x => (isNaN(x) ? '   –' : `${Math.round(x)}`.padStart(4));
const RUNS = [['gracz', 'z głową'], ['gracz', 'losowo'], ['słaby gracz', 'losowo'], ['stoi', 'z głową'], ['stoi', 'na wieżyczki']];
console.log(`Bitew na etap: ${N}\n`);
for (const [who, how] of RUNS) {
  console.log(`Strażnik: ${who}, karty: ${how}`);
  console.log('etap  wygrane  przegrane przed/z Asteroidą  życie po wygranej  najniżej  poziom  walka z Asteroidą (s)');
  const share = {};
  for (let st = 1; st <= LAST; st++) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(battle(st, choosers[how], movers[who]));
    const wins = res.filter(r => r.win), lost = res.filter(r => !r.win), early = lost.filter(r => r.t < R.TIME_BOSS).length;
    console.log(`${String(st).padStart(4)}   ${pct(wins.length / N)}       ${pct(early / N)} / ${pct((lost.length - early) / N)}          ${pct(avg(wins.map(r => r.hp)))}              ${pct(avg(res.map(r => r.minHp)))}   ${avg(res.map(r => r.lvl)).toFixed(1).padStart(5)}   ${sec(avg(wins.map(r => r.bossFight)))}`);
    if (st === 1) for (const r of res) { const tot = Object.values(r.dmg).reduce((a, b) => a + b, 0); for (const k of r.w) (share[k] = share[k] || []).push(r.dmg[k] / tot); }
  }
  console.log('Udział broni w obrażeniach na etapie 1: ' + Object.entries(share).map(([k, v]) => `${k} ${pct(avg(v)).trim()}`).join(', ') + '\n');
}
