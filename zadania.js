/* Śmierdzipacha: zadania matematyczne dla klas 1–8 szkoły podstawowej.

   Każda klasa ma 8 tematów. Każdy temat to 5 gier: 4 stopnie trudności i powtórka.
   Gra 40 każdej klasy to sprawdzian z całej klasy.

   Zapis zadań: "[3/4]" to ułamek zwykły (gra rysuje go piętrowo), "2[1/3]" to liczba mieszana,
   przecinek dziesiętny jak w szkole (0,75), mnożenie "·", dzielenie ":".

   Każde zadanie ma też wyjaśnienie (`how`): sposób liczenia w pamięci na liczbach z tego zadania.
   W krokach wyjaśnienia rachunki są w nawiasach klamrowych {…}: gra pokazuje je pogrubione,
   a testy przeliczają każdy z nich. */
(() => {
'use strict';

/* ---------- helpers ---------- */
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
const lcm = (a, b) => a / gcd(a, b) * b;
const M = '−';                                   // minus sign
const NB = ' ';
const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
const N = n => { const s = String(Math.abs(n)); const g = Math.abs(n) >= 10000 ? group(s) : s; return n < 0 ? M + g : g; };
const P = n => (n < 0 ? `(${N(n)})` : N(n));          // a negative number inside an expression goes in brackets
// Decimal written from a whole count of 1/10^p: D(75, 2) = "0,75"
const D = (k, p) => {
  const neg = k < 0, s = String(Math.abs(k)).padStart(p + 1, '0');
  let ip = s.slice(0, s.length - p); const fp = s.slice(s.length - p).replace(/0+$/, '');
  if (Number(ip) >= 10000) ip = group(ip);
  return (neg ? M : '') + ip + (fp ? ',' + fp : '');
};
// Fraction in lowest terms; mixed number when bigger than 1 ("1[1/4]")
const F = (n, d, mixed = true) => {
  if (d < 0) { n = -n; d = -d; }
  const k = gcd(n, d); n /= k; d /= k;
  if (d === 1) return N(n);
  const sign = n < 0 ? M : ''; n = Math.abs(n);
  return mixed && n > d ? `${sign}${Math.floor(n / d)}[${n % d}/${d}]` : `${sign}[${n}/${d}]`;
};
const FR = (n, d) => `[${n}/${d}]`;                   // fraction exactly as written in a problem
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(c => SUP[+c]).join('');
const term = (k, v) => (k === 1 ? v : k === -1 ? M + v : N(k) + v);   // 3x, x, −x
// Linear expression k·v + c written the school way: "2x + 6", "−x + 4", "a − 6"
const lin = (k, v, c) => {
  let s = k ? term(k, v) : '';
  if (c) s = s ? `${s} ${c < 0 ? M : '+'} ${N(Math.abs(c))}` : N(c);
  return s || '0';
};
// Explanation: a title and steps; {…} marks a calculation
const H = (t, ...s) => ({ t, s: s.filter(Boolean) });
// Polish noun form after a number: 1 dziesiątka, 2 dziesiątki, 5 dziesiątek
const pl = (n, one, few, many) => { n = Math.abs(n); const d = n % 10, dd = n % 100; return n === 1 ? one : d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many; };
const ile = (n, w) => `${n} ${pl(n, ...{ dz: ['dziesiątka', 'dziesiątki', 'dziesiątek'], st: ['setka', 'setki', 'setek'], jb: ['jabłko', 'jabłka', 'jabłek'], jd: ['jedność', 'jedności', 'jedności'] }[w])}`;

// Builds one problem. `wrongs` are candidate wrong answers; `o.mistake` is a typical error, used half of the time.
function mk(q, a, wrongs, o = {}) {
  const S = v => (typeof v === 'number' ? N(v) : v);
  const A = S(a);
  const ok = v => v !== null && v !== undefined && !(typeof v === 'number' && !Number.isFinite(v)) && S(v) !== A;
  const res = { q, a: A, w: null, sub: o.sub || '', how: o.how || null };
  if (o.sol) res.sol = o.sol;
  if (o.ask) res.ask = o.ask;
  if (ok(o.mistake) && Math.random() < 0.55) { res.w = S(o.mistake); return res; }
  const pool = [...new Set(wrongs.filter(ok).map(S))];
  res.w = pool.length ? pick(pool) : (typeof a === 'number' ? N(a + 1) : A + '0');
  return res;
}
const near = (n, neg) => {
  const out = [n + 1, n - 1, n + 2, n - 2];
  if (Math.abs(n) >= 20) out.push(n + 10, n - 10);
  return neg ? out : out.filter(v => v >= 0);
};
const nearDec = (k, p, neg) => {
  const u = 10 ** (p - 1) || 1;
  return [k + u, k - u, k + 10 * u, k - 10 * u, k * 10, k / 10].filter(v => Number.isInteger(v) && (neg || v >= 0)).map(v => D(v, p));
};
// Wrong fractions close to n/d
const nearFr = (n, d, mixed = true) => [F(n + 1, d, mixed), F(n - 1, d, mixed), F(n, d + 1, mixed), F(n + d, d, mixed), F(n * 2, d, mixed)];
const cmp = (x, y) => (x < y ? '<' : x > y ? '>' : '=');
const T = (nazwa, gen, czas) => ({ nazwa, gen, czas: czas || 1 });
const swap = (a, b) => (Math.random() < 0.5 ? [a, b] : [b, a]);

const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const ROM = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = n => { let s = ''; for (const [v, r] of ROM) while (n >= v) { s += r; n -= v; } return s; };
const zl = v => `${N(v)} zł`;
const deg = v => `${v}°`;
// √n with the square factor taken out: simpleRoot(8) = "2√2", simpleRoot(13) = "√13"
function simpleRoot(n) {
  let k = 1, r = n;
  for (let i = Math.floor(Math.sqrt(n)); i > 1; i--) if (n % (i * i) === 0) { k = i; r = n / (i * i); break; }
  if (r === 1) return N(k);
  return (k > 1 ? N(k) : '') + '√' + r;
}
// A fraction or decimal result shown the way a pupil would write it: decimal when it ends, otherwise a fraction
function nice(n, d) {
  const k = gcd(n, d); n /= k; d /= k;
  for (let p = 0; p <= 3; p++) if ((n * 10 ** p) % d === 0) return D(n * 10 ** p / d, p);
  return F(n, d);
}

/* ============================================================
   Ways of calculating in your head, used by the explanations
   ============================================================ */
// 386 → [300, 80, 6]
const parts = n => { const out = []; let k = 1; while (n > 0) { const d = n % 10; if (d) out.unshift(d * k); n = Math.floor(n / 10); k *= 10; } return out; };
const miejsc = z => (z === 1 ? 'miejsce' : 'miejsca');
function hAdd(a, b) {
  const v = a + b;
  if (a < 10 && b < 10) {
    const big = Math.max(a, b), small = Math.min(a, b);
    if (v <= 10) return H('Doliczanie', `Zacznij od większej liczby, ${big}, i dolicz ${small}.`, `{${big} + ${small} = ${v}}`);
    const c = 10 - big;
    return H('Dopełnianie do 10', `Rozbij ${small} na ${c} i ${small - c}. Dopełnij ${big} do 10. {${big} + ${c} = 10}`, `Dodaj resztę. {10 + ${small - c} = ${v}}`);
  }
  if (b < 10) {
    const u = a % 10;
    if (u + b < 10) return H('Dodawanie jedności', `Dodaj jedności. {${u} + ${b} = ${u + b}}`, `Dziesiątki zostają. {${N(a)} + ${b} = ${N(v)}}`);
    const c = 10 - u;
    if (b === c) return H('Dopełnianie do pełnej dziesiątki', `${u} i ${c} to razem 10, więc wychodzi pełna dziesiątka.`, `{${N(a)} + ${b} = ${N(v)}}`);
    return H('Dopełnianie do pełnej dziesiątki', `Rozbij ${b} na ${c} i ${b - c}. Dopełnij do pełnej dziesiątki. {${N(a)} + ${c} = ${N(a + c)}}`, `Dodaj resztę. {${N(a + c)} + ${b - c} = ${N(v)}}`);
  }
  const ps = parts(b); let s = a; const steps = [];
  if (ps.length > 1) steps.push(`Rozbij ${N(b)} na części. {${ps.map(N).join(' + ')} = ${N(b)}}`);
  for (const p of ps) { steps.push(`{${N(s)} + ${N(p)} = ${N(s + p)}}`); s += p; }
  return H('Dodawanie po kawałku', ...steps);
}
function hSub(a, b) {
  const v = a - b;
  if (a <= 10) return H('Odejmowanie', `Od ${a} odlicz ${b} wstecz. {${a} ${M} ${b} = ${v}}`, `Sprawdź dodawaniem. {${v} + ${b} = ${a}}`);
  if (b < 10) {
    const u = a % 10;
    if (u >= b) return H('Odejmowanie jedności', `Odejmij jedności. {${u} ${M} ${b} = ${u - b}}`, `Dziesiątki zostają. {${N(a)} ${M} ${b} = ${N(v)}}`);
    if (u === 0) return H('Odejmowanie od pełnej dziesiątki', `Odejmij ${b} od jednej dziesiątki. {10 ${M} ${b} = ${10 - b}}`, `Pozostałe dziesiątki zostają. {${N(a - 10)} + ${10 - b} = ${N(v)}}`);
    return H('Odejmowanie do pełnej dziesiątki', `Rozbij ${b} na ${u} i ${b - u}. Najpierw odejmij do pełnej dziesiątki. {${N(a)} ${M} ${u} = ${N(a - u)}}`, `Potem odejmij resztę. {${N(a - u)} ${M} ${b - u} = ${N(v)}}`);
  }
  const ps = parts(b); let s = a; const steps = [];
  if (ps.length > 1) steps.push(`Rozbij ${N(b)} na części. {${ps.map(N).join(' + ')} = ${N(b)}}`);
  for (const p of ps) { steps.push(`{${N(s)} ${M} ${N(p)} = ${N(s - p)}}`); s -= p; }
  steps.push(`Sprawdź dodawaniem. {${N(v)} + ${N(b)} = ${N(a)}}`);
  return H('Odejmowanie po kawałku', ...steps);
}
// One step of the multiplication table, explained with a handy trick
function hMulT(a, b) {
  const p = a * b, has = k => a === k || b === k, other = k => (a === k ? b : a);
  if (has(10)) return H('Mnożenie przez 10', `Mnożenie przez 10 dopisuje zero. {${other(10)} · 10 = ${p}}`);
  if (has(1)) return H('Mnożenie przez 1', `Liczba razy 1 to ta sama liczba. {${other(1)} · 1 = ${p}}`);
  if (has(2)) { const n = other(2); return H('Mnożenie przez 2', `Razy 2 to podwojenie. {${n} + ${n} = ${p}}`); }
  if (has(5)) { const n = other(5); return H('Mnożenie przez 5', `Razy 5 to połowa z razy 10. {${n} · 10 = ${n * 10}}`, `{${n * 10} : 2 = ${p}}`); }
  if (has(9)) { const n = other(9); return H('Mnożenie przez 9', `Razy 9 to razy 10 i odjąć jeden raz. {${n} · 10 = ${n * 10}}`, `{${n * 10} ${M} ${n} = ${p}}`); }
  if (has(4)) { const n = other(4); return H('Mnożenie przez 4', `Razy 4 to dwa razy podwoić. {${n} · 2 = ${n * 2}}`, `{${n * 2} · 2 = ${p}}`); }
  if (has(3)) { const n = other(3); return H('Mnożenie przez 3', `Trzy razy po ${n}. {${n} + ${n} + ${n} = ${p}}`); }
  const m = Math.max(a, b), k = Math.min(a, b);
  return H('Mnożenie przez rozbicie', `Rozbij ${m} na 5 + ${m - 5}.`, `{${k} · 5 = ${k * 5}}`, `{${k} · ${m - 5} = ${k * (m - 5)}}`, `{${k * 5} + ${k * (m - 5)} = ${p}}`);
}
const hDivT = (n, a, b) => H('Dzielenie jako mnożenie', `Pomyśl, ile razy ${a} mieści się w ${n}.`, `{${a} · ${b} = ${n}}`, `Więc {${n} : ${a} = ${b}}`);
// q · d with q split into tens and units (or hundreds)
function hMul2(q, d) {
  const ps = parts(q), pr = ps.map(x => x * d);
  if (ps.length === 1) return H('Mnożenie pełnych dziesiątek i setek', `Pomnóż bez zer i dopisz je na końcu. {${N(q)} · ${d} = ${N(q * d)}}`);
  return H('Mnożenie przez rozbicie', `Rozbij ${N(q)} na części. {${ps.map(N).join(' + ')} = ${N(q)}}`, ...ps.map((x, i) => `{${N(x)} · ${d} = ${N(pr[i])}}`), ps.length > 1 ? `Dodaj. {${pr.map(N).join(' + ')} = ${N(q * d)}}` : null);
}
// a · b for two-digit b: a · tens + a · units
function hMulBig(a, b) {
  const t = b - (b % 10), u = b % 10;
  if (!u) return H('Mnożenie przez pełne dziesiątki', `Pomnóż bez zera. {${a} · ${t / 10} = ${a * t / 10}}`, `Dopisz zero. {${a} · ${t} = ${a * t}}`);
  return H('Mnożenie przez rozbicie', `Rozbij ${b} na ${t} i ${u}.`, `{${a} · ${t} = ${a * t}}`, `{${a} · ${u} = ${a * u}}`, `Dodaj. {${a * t} + ${a * u} = ${a * b}}`);
}
// n : d with n split into parts that divide easily
function hDiv2(n, d) {
  const q = n / d, qs = parts(q), ns = qs.map(x => x * d);
  if (qs.length === 1) return H('Dzielenie jako mnożenie', `Pomyśl, przez ile pomnożyć ${d}, żeby wyszło ${N(n)}. {${d} · ${N(q)} = ${N(n)}}`, `Więc {${N(n)} : ${d} = ${N(q)}}`);
  return H('Dzielenie przez rozbicie', `Rozbij ${N(n)} na części, które łatwo podzielić przez ${d}. {${ns.map(N).join(' + ')} = ${N(n)}}`, ...qs.map((x, i) => `{${N(ns[i])} : ${d} = ${N(x)}}`), qs.length > 1 ? `Dodaj. {${qs.map(N).join(' + ')} = ${N(q)}}` : null);
}
function hPow(b, e) { const v = b ** e; return H('Potęga', `${b}${sup(e)} to ${b} pomnożone przez siebie ${e} razy.`, `{${Array(e).fill(P(b)).join(' · ')} = ${N(v)}}`); }
// p% of w in your head (w chosen so that every step is a whole number)
function pctSteps(p, w) {
  const t = w / 10, v = w * p / 100;
  if (p === 50) return [`50% to połowa. {${N(w)} : 2 = ${N(v)}}`];
  if (p === 25) return [`25% to ćwierć. {${N(w)} : 4 = ${N(v)}}`];
  if (p === 75) return [`25% to ćwierć. {${N(w)} : 4 = ${N(w / 4)}}`, `75% to 3 razy po 25%. {3 · ${N(w / 4)} = ${N(v)}}`];
  if (p === 10) return [`10% to dziesiąta część. {${N(w)} : 10 = ${N(v)}}`];
  if (p === 1) return [`1% to setna część. {${N(w)} : 100 = ${N(v)}}`];
  if (p === 5) return [`10% z ${N(w)} to {${N(w)} : 10 = ${N(t)}}`, `5% to połowa z tego. {${N(t)} : 2 = ${N(v)}}`];
  if (p === 15) return [`10% z ${N(w)} to {${N(w)} : 10 = ${N(t)}}`, `5% to połowa z tego. {${N(t)} : 2 = ${N(t / 2)}}`, `15% to 10% i 5%. {${N(t)} + ${N(t / 2)} = ${N(v)}}`];
  if (p === 35) return [`10% z ${N(w)} to {${N(w)} : 10 = ${N(t)}}`, `30% to {3 · ${N(t)} = ${N(3 * t)}}, a 5% to {${N(t)} : 2 = ${N(t / 2)}}`, `{${N(3 * t)} + ${N(t / 2)} = ${N(v)}}`];
  if (p % 10 === 0) return [`10% z ${N(w)} to {${N(w)} : 10 = ${N(t)}}`, `${p}% to ${p / 10} razy po 10%. {${p / 10} · ${N(t)} = ${N(v)}}`];
  const o = w / 100; return [`1% z ${N(w)} to {${N(w)} : 100 = ${N(o)}}`, `${p}% to ${p} razy po 1%. {${p} · ${N(o)} = ${N(v)}}`];
}
// a/b ± c/d with the common denominator
function fracSteps(a, b, c, d, sign) {
  const m = lcm(b, d), A = a * m / b, C = c * m / d, R = sign === '+' ? A + C : A - C, steps = [`Wspólny mianownik to ${m}.`];
  if (b !== m) steps.push(`{${FR(a, b)} = ${FR(A, m)}}`);
  if (d !== m) steps.push(`{${FR(c, d)} = ${FR(C, m)}}`);
  steps.push(`Teraz ${sign === '+' ? 'dodaj' : 'odejmij'} liczniki. {${FR(A, m)} ${sign === '+' ? '+' : M} ${FR(C, m)} = ${FR(R, m)}}`);
  if (F(R, m) !== FR(R, m)) steps.push(`${R > m ? 'Wyłącz całości i skróć' : 'Skróć'}. {${FR(R, m)} = ${F(R, m)}}`);
  return steps;
}
const reduceStep = (n, d) => (F(n, d) !== FR(n, d) ? `${Math.abs(n) > d ? 'Wyłącz całości i skróć' : 'Skróć'}. {${FR(n, d)} = ${F(n, d)}}` : null);
function hRoman(n) {
  const pieces = []; let k = n;
  for (const [v, r] of ROM) while (k >= v) { pieces.push([v, r]); k -= v; }
  return H('Liczby rzymskie', 'I = 1, V = 5, X = 10, L = 50. Mniejszy znak przed większym odejmujemy (IV = 4, IX = 9).',
    pieces.length > 1 && `${roman(n)} to ${pieces.map(([, r]) => r).join(' + ')}.`, pieces.length > 1 ? `{${pieces.map(([v]) => v).join(' + ')} = ${n}}` : `${n} to po prostu ${roman(n)}.`);
}

/* ============================================================
   KLASA 1: liczby do 20, porównywanie, okienka, pieniądze
   ============================================================ */
const K1 = [
  T('Dodawanie do 10', t => {
    if (t === 4) { const a = randi(1, 4), b = randi(1, 4), c = randi(1, 10 - a - b), v = a + b + c; return mk(`${a} + ${b} + ${c} = ?`, v, near(v), { how: H('Dodawanie kilku liczb', `Dodawaj po kolei. {${a} + ${b} = ${a + b}}`, `{${a + b} + ${c} = ${v}}`) }); }
    const max = [5, 7, 10][t - 1], a = randi(1, max - 1), b = randi(1, max - a);
    return mk(`${a} + ${b} = ?`, a + b, near(a + b), { how: hAdd(a, b) });
  }),
  T('Odejmowanie do 10', t => {
    if (t === 4) { const a = randi(6, 10), b = randi(1, 3), c = randi(1, a - b - 1), v = a - b - c; return mk(`${a} ${M} ${b} ${M} ${c} = ?`, v, near(v), { how: H('Odejmowanie kilku liczb', `Odejmuj po kolei. {${a} ${M} ${b} = ${a - b}}`, `{${a - b} ${M} ${c} = ${v}}`) }); }
    const max = [5, 7, 10][t - 1], a = randi(2, max), b = randi(1, a - 1);
    return mk(`${a} ${M} ${b} = ?`, a - b, near(a - b), { mistake: a + b, how: hSub(a, b) });
  }),
  T('Porównywanie liczb', t => {
    let L, R, lv, rv;
    if (t === 1) { lv = randi(0, 10); rv = randi(0, 10); L = N(lv); R = N(rv); }
    else if (t === 2) { lv = randi(5, 20); rv = Math.random() < 0.2 ? lv : randi(5, 20); L = N(lv); R = N(rv); }
    else if (t === 3) { const a = randi(1, 9), b = randi(1, 10 - a); lv = a + b; rv = Math.max(0, lv + randi(-2, 2)); L = `${a} + ${b}`; R = N(rv); }
    else { const a = randi(1, 9), b = randi(1, 10 - a), c = randi(5, 10), d = randi(0, c - 1); lv = a + b; rv = c - d; L = `${a} + ${b}`; R = `${c} ${M} ${d}`; }
    const s = cmp(lv, rv);
    return mk(`${L} ? ${R}`, s, ['<', '>', '='], { sub: 'Jaki znak: <, > czy =?', how: H('Porównywanie liczb',
      L !== N(lv) ? `Policz lewą stronę. {${L} = ${lv}}` : null, R !== N(rv) ? `Policz prawą stronę. {${R} = ${rv}}` : null,
      s === '=' ? 'Obie strony są równe, więc stawiamy znak =.' : 'Znak < lub > otwiera się w stronę większej liczby.', `{${lv} ${s} ${rv}}`) });
  }),
  T('Dodawanie i odejmowanie do 20', t => {
    if (t === 1) { const b = randi(1, 9), [x, y] = swap('10', String(b)); return mk(`${x} + ${y} = ?`, 10 + b, near(10 + b), { how: H('Dziesiątka i jedności', `Jedna dziesiątka i ${ile(b, 'jd')} to ${10 + b}.`, `{10 + ${b} = ${10 + b}}`) }); }
    if (t === 2) { const u = randi(1, 8), b = randi(1, 9 - u), a = 10 + u; return mk(`${a} + ${b} = ?`, a + b, near(a + b), { how: hAdd(a, b) }); }
    if (t === 3) { const u = randi(2, 9), b = randi(1, u), a = 10 + u; return mk(`${a} ${M} ${b} = ?`, a - b, near(a - b), { how: hSub(a, b) }); }
    const u = randi(1, 6), b = randi(2, 8 - u), c = randi(1, u + b), a = 10 + u, v = a + b - c;
    return mk(`${a} + ${b} ${M} ${c} = ?`, v, near(v), { how: H('Działania po kolei', `Najpierw dodaj. {${a} + ${b} = ${a + b}}`, `Potem odejmij. {${a + b} ${M} ${c} = ${v}}`) });
  }),
  T('Dodawanie z przekroczeniem 10', t => {
    if (t === 4) { const x = randi(2, 7), y = randi(2, 8), z = randi(Math.max(1, 11 - x - y), Math.min(9, 20 - x - y)), v = x + y + z; return mk(`${x} + ${y} + ${z} = ?`, v, near(v), { how: H('Dodawanie kilku liczb', `Dodawaj po kolei. {${x} + ${y} = ${x + y}}`, `{${x + y} + ${z} = ${v}}`) }); }
    const a = t === 1 ? 9 : t === 2 ? randi(7, 8) : randi(3, 9), b = randi(Math.max(2, 11 - a), 9), [x, y] = swap(a, b);
    return mk(`${x} + ${y} = ?`, a + b, near(a + b), { mistake: a + b - 10, how: hAdd(x, y) });
  }),
  T('Odejmowanie z przekroczeniem 10', t => {
    if (t === 4 && Math.random() < 0.5) { const b = randi(2, 9); return mk(`20 ${M} ${b} = ?`, 20 - b, near(20 - b), { mistake: 10 - b, how: H('Odejmowanie od 20', `20 to 10 i 10. Od jednej dziesiątki odejmij ${b}. {10 ${M} ${b} = ${10 - b}}`, `Zostaje jeszcze druga dziesiątka. {10 + ${10 - b} = ${20 - b}}`) }); }
    const a = t === 1 ? randi(11, 12) : t === 2 ? randi(11, 15) : randi(11, 18), u = a - 10, b = randi(u + 1, 9);
    return mk(`${a} ${M} ${b} = ?`, a - b, near(a - b), { mistake: 10 + b - u, how: hSub(a, b) });
  }),
  T('Okienka', t => {
    if (t === 1) { const c = randi(3, 10), a = randi(1, c - 1); return mk(`${a} + ? = ${c}`, c - a, near(c - a).filter(v => v > 0), { mistake: c + a, how: H('Brakująca liczba', `Ile brakuje od ${a} do ${c}? {${c} ${M} ${a} = ${c - a}}`, `Sprawdź. {${a} + ${c - a} = ${c}}`) }); }
    if (t === 2) { const c = randi(5, 20), b = randi(1, Math.min(9, c - 1)); return mk(`? + ${b} = ${c}`, c - b, near(c - b).filter(v => v > 0), { how: H('Brakująca liczba', `Od wyniku odejmij to, co dodano. {${c} ${M} ${b} = ${c - b}}`, `Sprawdź. {${c - b} + ${b} = ${c}}`) }); }
    if (t === 3) { const a = randi(6, 20), b = randi(1, Math.min(9, a - 1)); return mk(`${a} ${M} ? = ${a - b}`, b, near(b).filter(v => v > 0), { how: H('Brakująca liczba', `Ile trzeba zabrać z ${a}, żeby zostało ${a - b}? {${a} ${M} ${a - b} = ${b}}`, `Sprawdź. {${a} ${M} ${b} = ${a - b}}`) }); }
    const b = randi(2, 9), r = randi(1, 20 - b); return mk(`? ${M} ${b} = ${r}`, r + b, near(r + b), { mistake: r - b > 0 ? r - b : null, how: H('Brakująca liczba', `Po odjęciu ${b} zostało ${r}, więc liczba była o ${b} większa. {${r} + ${b} = ${r + b}}`, `Sprawdź. {${r + b} ${M} ${b} = ${r}}`) });
  }),
  T('Pieniądze do 20 zł', t => {
    const coins = [1, 2, 5];
    if (t === 1) { const a = pick([1, 2, 5, 10]), b = pick(coins), v = a + b; return mk(`${a} zł + ${b} zł = ?`, zl(v), [zl(v + 1), zl(Math.max(1, v - 1)), zl(v + 2)], { how: H('Liczenie pieniędzy', `Dodaj złotówki. {${a} + ${b} = ${v}}`, `Razem ${v} zł.`) }); }
    if (t === 2) { const a = pick(coins), b = pick(coins), c = pick(coins), v = a + b + c; return mk(`${a} zł + ${b} zł + ${c} zł = ?`, zl(v), [zl(v + 1), zl(v - 1), zl(v + 2)], { how: H('Liczenie pieniędzy', `Dodawaj monety po kolei. {${a} + ${b} = ${a + b}}`, `{${a + b} + ${c} = ${v}}`, `Razem ${v} zł.`) }); }
    if (t === 3) { const n = pick([10, 10, 5]), a = pick(coins), b = pick(coins), v = n + a + b; return mk(`${n} zł + ${a} zł + ${b} zł = ?`, zl(v), [zl(v + 1), zl(v - 1), zl(a + b + 1)], { how: H('Liczenie pieniędzy', `Najpierw drobne monety. {${a} + ${b} = ${a + b}}`, `Dodaj ${n} zł. {${n} + ${a + b} = ${v}}`) }); }
    const a = randi(2, 9), b = Math.random() < 0.5 ? 10 : 20, v = b - a; return mk(`${b} zł ${M} ${a} zł = ?`, zl(v), [zl(v + 1), zl(v - 1), zl(v + 2)], { sub: 'Ile reszty?', how: hSub(b, a) });
  }),
];

/* ============================================================
   KLASA 2: liczby do 100, mnożenie i dzielenie do 30, pieniądze i miary, liczby rzymskie
   ============================================================ */
const mulIn = (max, list) => { for (;;) { const a = pick(list), b = randi(1, 10); if (a * b <= max && a * b > 1) return [a, b]; } };
const mulProblem = (a, b) => { const p = a * b, [x, y] = swap(a, b); return mk(`${x} · ${y} = ?`, p, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, p + 1, p - 1].filter(v => v > 0), { mistake: a + b, how: hMulT(x, y) }); };
const divProblem = (a, b) => mk(`${a * b} : ${a} = ?`, b, [b + 1, b - 1, b + 2].filter(v => v > 0), { mistake: a * b - a, how: hDivT(a * b, a, b) });
const tensHow = (a, b, sign) => H('Liczenie dziesiątkami', `${a * 10} to ${ile(a, 'dz')}, ${b * 10} to ${ile(b, 'dz')}.`, `{${a} ${sign} ${b} = ${sign === '+' ? a + b : a - b}}`, `{${a * 10} ${sign} ${b * 10} = ${sign === '+' ? (a + b) * 10 : (a - b) * 10}}`);
const K2 = [
  T('Dodawanie i odejmowanie dziesiątek', t => {
    if (t === 1) { const a = randi(1, 8), b = randi(1, 9 - a), v = (a + b) * 10; return mk(`${a * 10} + ${b * 10} = ?`, v, [v + 10, v - 10], { mistake: a + b, how: tensHow(a, b, '+') }); }
    if (t === 2) { const a = randi(2, 9), b = randi(1, a - 1), v = (a - b) * 10; return mk(`${a * 10} ${M} ${b * 10} = ?`, v, [v + 10, v - 10].filter(x => x > 0), { how: tensHow(a, b, M) }); }
    if (t === 3) { const a = randi(11, 69), b = randi(1, Math.floor((99 - a) / 10)) * 10, v = a + b; return mk(`${a} + ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1], { mistake: a + b / 10, how: H('Dodawanie dziesiątek', `Dodaj dziesiątki, jedności zostają. {${Math.floor(a / 10)} + ${b / 10} = ${Math.floor(v / 10)}}`, `{${a} + ${b} = ${v}}`) }); }
    const a = randi(31, 99), b = randi(1, Math.floor(a / 10) - 1) * 10, v = a - b; return mk(`${a} ${M} ${b} = ?`, v, [v + 10, v - 10, v + 1], { mistake: a - b / 10, how: H('Odejmowanie dziesiątek', `Odejmij dziesiątki, jedności zostają. {${Math.floor(a / 10)} ${M} ${b / 10} = ${Math.floor(v / 10)}}`, `{${a} ${M} ${b} = ${v}}`) });
  }),
  T('Dodawanie do 100', t => {
    if (t === 1) { const a = randi(11, 89), u = a % 10, b = randi(1, Math.max(1, 9 - u)); if (u + b > 9) return K2[1].gen(1); return mk(`${a} + ${b} = ?`, a + b, near(a + b), { how: hAdd(a, b) }); }
    if (t === 2) { const b = randi(3, 9), a = randi(1, 8) * 10 + randi(10 - b, 9), v = a + b; return mk(`${a} + ${b} = ?`, v, [v - 10, v + 1, v - 1], { mistake: v - 10, how: hAdd(a, b) }); }
    if (t === 3) { const a = randi(1, 6) * 10 + randi(0, 5), b = randi(1, 8 - Math.floor(a / 10)) * 10 + randi(1, 9 - (a % 10)), v = a + b; return mk(`${a} + ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1], { how: hAdd(a, b) }); }
    const a = randi(15, 59), b = randi(12, 99 - a), v = a + b; return mk(`${a} + ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1], { mistake: (a % 10) + (b % 10) < 10 ? null : v - 10, how: hAdd(a, b) });
  }),
  T('Odejmowanie do 100', t => {
    if (t === 1) { const a = randi(11, 99), u = a % 10; if (u < 2) return K2[2].gen(1); const b = randi(1, u); return mk(`${a} ${M} ${b} = ?`, a - b, near(a - b), { how: hSub(a, b) }); }
    if (t === 2) { const a = randi(2, 9) * 10 + randi(0, 6), u = a % 10, b = randi(u + 1, 9), v = a - b; return mk(`${a} ${M} ${b} = ?`, v, [v + 10, v + 1, v - 1], { mistake: v + 10, how: hSub(a, b) }); }
    if (t === 3) { const a = randi(3, 9) * 10 + randi(2, 9), b = randi(1, Math.floor(a / 10) - 1) * 10 + randi(1, a % 10), v = a - b; return mk(`${a} ${M} ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1].filter(x => x >= 0), { how: hSub(a, b) }); }
    const a = randi(4, 9) * 10 + randi(0, 7), b = randi(1, Math.floor(a / 10) - 2) * 10 + randi(a % 10 + 1, 9), v = a - b;
    return mk(`${a} ${M} ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1].filter(x => x >= 0), { mistake: v + 10, how: hSub(a, b) });
  }),
  T('Mnożenie do 30', t => mulProblem(...mulIn(30, [[2], [2, 3], [2, 3, 4, 5], [2, 3, 4, 5, 6]][t - 1]))),
  T('Dzielenie do 30', t => divProblem(...mulIn(30, [[2, 10], [2, 3], [2, 3, 4, 5], [2, 3, 4, 5, 6]][t - 1]))),
  T('Okienka do 100', t => {
    if (t === 1) { const c = randi(3, 10) * 10, a = randi(1, c / 10 - 1) * 10; return mk(`${a} + ? = ${c}`, c - a, [c - a + 10, c - a - 10].filter(v => v > 0), { mistake: c + a <= 100 ? c + a : null, how: H('Brakująca liczba', `Ile brakuje od ${a} do ${c}? {${c} ${M} ${a} = ${c - a}}`, `Sprawdź. {${a} + ${c - a} = ${c}}`) }); }
    if (t === 2) { const c = randi(30, 100), a = randi(11, c - 5); return Math.random() < 0.5 ? mk(`${a} + ? = ${c}`, c - a, [c - a + 10, c - a - 10, c - a + 1, c - a - 1].filter(v => v > 0), { how: H('Brakująca liczba', `Szukasz, ile brakuje od ${a} do ${c}.`, ...hSub(c, a).s) }) : mk(`${c} ${M} ? = ${a}`, c - a, [c - a + 10, c - a - 10, c + a].filter(v => v > 0 && v <= 100), { how: H('Brakująca liczba', `Ile trzeba zabrać z ${c}, żeby zostało ${a}?`, ...hSub(c, a).s) }); }
    if (t === 3) { const [a, b] = mulIn(30, [2, 3, 4, 5]); return mk(`${a} · ? = ${a * b}`, b, [b + 1, b - 1, a * b - a].filter(v => v > 0), { how: H('Brakująca liczba w mnożeniu', `Jaka liczba razy ${a} daje ${a * b}? To dzielenie. {${a * b} : ${a} = ${b}}`, `Sprawdź. {${a} · ${b} = ${a * b}}`) }); }
    const [a, b] = mulIn(30, [2, 3, 4, 5]); return mk(`? : ${a} = ${b}`, a * b, [a * b + a, a * b - a, a + b].filter(v => v > 0), { how: H('Brakująca liczba w dzieleniu', `Liczba podzielona przez ${a} dała ${b}, więc była ${a} razy większa. {${b} · ${a} = ${a * b}}`, `Sprawdź. {${a * b} : ${a} = ${b}}`) });
  }),
  T('Pieniądze i miary', t => {
    if (t === 1) { const a = randi(1, 7) * 10 + randi(0, 9), b = randi(1, 9 - Math.floor(a / 10)) * 10, v = a + b; return mk(`${a} zł + ${b} zł = ?`, zl(v), [zl(v + 10), zl(v - 10), zl(v + 1)], { how: H('Dodawanie dziesiątek', `Dodaj dziesiątki, jedności zostają. {${a} + ${b} = ${v}}`, `Razem ${v} zł.`) }); }
    if (t === 2) {      // in 2nd class numbers go up to 100, so the changes stay within 100
      const zl = Math.random() < 0.5, big = zl ? 'zł' : 'm', small = zl ? 'gr' : 'cm', v = randi(0, 3);
      if (v === 0) return mk(`1 ${big} = ? ${small}`, 100, [10, 1000, 50], { mistake: 10, how: H('Zamiana jednostek', `1 ${big} to 100 ${small}.`) });
      if (v === 1) return mk(`100 ${small} = ? ${big}`, 1, [10, 100, 2], { how: H('Zamiana jednostek', `100 ${small} to 1 ${big}.`) });
      if (v === 2) return mk(`${zl ? 'Pół złotego' : 'Pół metra'} = ? ${small}`, 50, [5, 25, 100], { mistake: 5, how: H('Połowa', `1 ${big} to 100 ${small}.`, `Połowa ze 100: {100 : 2 = 50}`) });
      const a = randi(1, 9) * 10;
      return mk(`${a} ${small} + ${100 - a} ${small} = ? ${big}`, 1, [100, 2, 10], { mistake: 100, how: H('Zamiana jednostek', `{${a} + ${100 - a} = 100}`, `100 ${small} to 1 ${big}.`) });
    }
    if (t === 3) { const a = randi(11, 89), v = 100 - a; return mk(`100 zł ${M} ${a} zł = ?`, zl(v), [zl(v + 10), zl(v - 1 > 0 ? v - 1 : v + 2), zl(110 - a)].filter(x => x !== zl(v)), { sub: 'Ile reszty ze 100 zł?', how: hSub(100, a) }); }
    const [big, small] = pick([['m', 'cm'], ['zł', 'gr']]), a = randi(1, 9) * 10, v = 100 - a; return mk(`1 ${big} ${M} ${a} ${small} = ? ${small}`, v, [v + 10, v - 10, a].filter(x => x > 0 && x !== v), { mistake: 10 - a / 10 > 0 ? 10 - a / 10 : null, how: H('Zamiana jednostek', `1 ${big} to 100 ${small}.`, `{100 ${M} ${a} = ${v}}`, `Zostaje ${v} ${small}.`) });
  }),
  T('Liczby rzymskie do XII', t => {
    if (t === 1) { const n = pick([1, 2, 3, 5, 6, 7, 8, 10, 11, 12]); return mk(`${roman(n)} = ?`, n, [n + 1, n - 1].filter(v => v > 0), { how: hRoman(n) }); }
    if (t === 2) {
      const n = pick([4, 9, 6, 11, 4, 9, 7, 12, 8]), twin = { 4: 6, 6: 4, 9: 11, 11: 9 }[n];
      if (Math.random() < 0.4 && twin) return mk(`${n} = ?`, roman(n), [roman(twin), roman(n + 1)], { sub: 'Zapisz liczbę po rzymsku', mistake: roman(twin), how: hRoman(n) });
      return mk(`${roman(n)} = ?`, n, [n + 1, n - 1], { mistake: twin || null, how: hRoman(n) });
    }
    if (t === 3) { const n = randi(1, 12); return mk(`${n} = ?`, roman(n), [roman(n + 1), n > 1 ? roman(n - 1) : roman(3)], { sub: 'Zapisz liczbę po rzymsku', mistake: n === 4 ? 'IIII' : n === 9 ? 'VIIII' : n === 6 ? 'IV' : n === 11 ? 'IX' : null, how: hRoman(n) }); }
    const a = randi(1, 8), b = randi(1, 12 - a); return mk(`${roman(a)} + ${roman(b)} = ?`, roman(a + b), [roman(a + b + 1), roman(Math.max(1, a + b - 1))].filter(x => x !== roman(a + b)), { sub: 'Wynik zapisz po rzymsku', how: H('Liczby rzymskie', `Zamień na zwykłe liczby. ${roman(a)} = ${a}, ${roman(b)} = ${b}.`, `{${a} + ${b} = ${a + b}}`, `${a + b} po rzymsku to ${roman(a + b)}.`) });
  }),
];

/* ============================================================
   KLASA 3: tabliczka mnożenia, liczby do 1000, obwody, jednostki
   ============================================================ */
const K3 = [
  T('Dodawanie i odejmowanie do 100', t => (t <= 2 ? K2[1].gen(t + 2) : K2[2].gen(t))),
  T('Tabliczka mnożenia', t => { const a = pick([[2, 3, 4, 5], [6, 7], [8, 9], [2, 3, 4, 5, 6, 7, 8, 9, 10]][t - 1]), b = randi(2, 10); return mulProblem(a, b); }),
  T('Dzielenie w zakresie tabliczki', t => { const a = pick([[2, 3, 4, 5], [6, 7], [8, 9], [2, 3, 4, 5, 6, 7, 8, 9, 10]][t - 1]), b = randi(2, 10); return divProblem(a, b); }),
  T('Mnożenie i dzielenie z okienkiem', t => {
    const a = randi(2, 9), b = randi(2, 10), p = a * b;
    const mulBox = H('Brakująca liczba w mnożeniu', `Jaka liczba razy ${a} daje ${p}? To dzielenie. {${p} : ${a} = ${b}}`, `Sprawdź. {${a} · ${b} = ${p}}`);
    if (t === 1) return mk(`${a} · ? = ${p}`, b, [b + 1, b - 1, p - a].filter(v => v > 0), { how: mulBox });
    if (t === 2) return mk(`? · ${a} = ${p}`, b, [b + 1, b - 1, b + 2].filter(v => v > 0), { how: mulBox });
    if (t === 3) return mk(`${p} : ? = ${b}`, a, [a + 1, a - 1, p - b].filter(v => v > 0 && v !== a), { how: H('Brakująca liczba w dzieleniu', `Przez jaką liczbę podzielić ${p}, żeby wyszło ${b}? {${p} : ${b} = ${a}}`, `Sprawdź. {${b} · ${a} = ${p}}`) });
    return mk(`? : ${a} = ${b}`, p, [p + a, p - a, a + b].filter(v => v > 0), { how: H('Brakująca liczba w dzieleniu', `Liczba podzielona przez ${a} dała ${b}, więc była ${a} razy większa. {${b} · ${a} = ${p}}`, `Sprawdź. {${p} : ${a} = ${b}}`) });
  }),
  T('Liczby do 1000', t => {
    if (t === 1) { const a = randi(1, 8), b = randi(1, 9 - a), v = (a + b) * 100; return mk(`${a * 100} + ${b * 100} = ?`, v, [v + 100, v - 100], { mistake: v / 10, how: H('Liczenie setkami', `${a * 100} to ${ile(a, 'st')}, ${b * 100} to ${ile(b, 'st')}. {${a} + ${b} = ${a + b}}`, `{${a * 100} + ${b * 100} = ${v}}`) }); }
    if (t === 2) { const a = randi(2, 9), b = randi(1, a - 1), v = (a - b) * 100; return mk(`${a * 100} ${M} ${b * 100} = ?`, v, [v + 100, v - 100].filter(x => x > 0), { mistake: a - b, how: H('Liczenie setkami', `${a * 100} to ${ile(a, 'st')}, ${b * 100} to ${ile(b, 'st')}. {${a} ${M} ${b} = ${a - b}}`, `{${a * 100} ${M} ${b * 100} = ${v}}`) }); }
    if (t === 3) { if (Math.random() < 0.5) { const a = randi(1, 8) * 100 + randi(0, 5) * 10, b = randi(1, 4) * 10, v = a + b; return mk(`${a} + ${b} = ?`, v, [v + 100, v - 10, v + 10], { how: H('Dodawanie dziesiątek', `Dodaj dziesiątki, setki zostają. {${(a % 100) / 10} + ${b / 10} = ${(v % 100) / 10}}`, `{${a} + ${b} = ${v}}`) }); } const a = randi(1, 9) * 100 + randi(5, 9) * 10, b = randi(1, 5) * 10, v = a - b; return mk(`${a} ${M} ${b} = ?`, v, [v - 100, v - 10, v + 10], { how: H('Odejmowanie dziesiątek', `Odejmij dziesiątki, setki zostają. {${(a % 100) / 10} ${M} ${b / 10} = ${(v % 100) / 10}}`, `{${a} ${M} ${b} = ${v}}`) }); }
    if (Math.random() < 0.5) { const h = randi(1, 8), d = randi(1, 9), v = (h + 1) * 100; return mk(`${h * 100 + d * 10} + ${100 - d * 10} = ?`, v, [v + 100, v - 10, v + 10], { how: H('Dopełnianie do pełnej setki', `${d * 10} i ${100 - d * 10} dają razem pełną setkę. {${d * 10} + ${100 - d * 10} = 100}`, `{${h * 100} + 100 = ${v}}`) }); }
    const h = randi(1, 9), d = randi(1, 9), v = h * 100; return mk(`${h * 100 + d * 10} ${M} ${d * 10} = ?`, v, [v + 10, v - 10, v - 100].filter(x => x > 0), { how: H('Odejmowanie dziesiątek', `Zabierasz wszystkie dziesiątki, zostają same setki.`, `{${h * 100 + d * 10} ${M} ${d * 10} = ${v}}`) });
  }),
  T('Mnożenie przez 10 i przez 2', t => {
    if (t === 1) { const a = randi(2, 19), [x, y] = swap(a, 10); return mk(`${x} · ${y} = ?`, a * 10, [a * 100, a + 10, a * 10 + 10], { mistake: a + 10, how: H('Mnożenie przez 10', `Mnożenie przez 10 dopisuje zero na końcu. {${a} · 10 = ${a * 10}}`) }); }
    if (t === 2) { const a = randi(11, 49), v = a * 2, tt = a - (a % 10), u = a % 10; return mk(`${a} · 2 = ?`, v, [v + 10, v - 10, v + 2], { mistake: a + 2, how: H('Mnożenie przez 2', 'Podwój osobno dziesiątki i jedności.', `{${tt} · 2 = ${tt * 2}}`, u ? `{${u} · 2 = ${u * 2}}` : null, u ? `{${tt * 2} + ${u * 2} = ${v}}` : null) }); }
    if (t === 3) { const a = randi(11, 49), v = a * 2; return mk(`${v} : 2 = ?`, a, [a + 10, a - 10, a + 1], { mistake: v - 2, how: hDiv2(v, 2) }); }
    if (Math.random() < 0.5) { const a = randi(11, 99); return mk(`${a * 10} : 10 = ?`, a, [a * 100, a + 10, a - 10].filter(v => v > 0), { how: H('Dzielenie przez 10', `Dzielenie przez 10 skreśla zero na końcu. {${a * 10} : 10 = ${a}}`) }); }
    const a = randi(2, 9), b = randi(2, 9), v = a * b * 10; return mk(`${a * 10} · ${b} = ?`, v, [v * 10, v / 10, v + 10], { how: H('Mnożenie pełnych dziesiątek', `Pomnóż bez zera. {${a} · ${b} = ${a * b}}`, `Dopisz zero. {${a * 10} · ${b} = ${v}}`) });
  }),
  T('Obwody figur', t => {
    if (t === 1) { const a = randi(2, 20); return mk('Obwód = ? cm', 4 * a, [2 * a, a * a, 4 * a + 4].filter(v => v !== 4 * a), { sub: `Kwadrat o boku ${a} cm`, sol: `Kwadrat o boku ${a} cm: obwód = 4 · ${a} = ${4 * a} cm`, mistake: a * a === 4 * a ? 2 * a : a * a, how: H('Obwód kwadratu', 'Obwód to suma długości wszystkich boków. Kwadrat ma 4 równe boki.', `{4 · ${a} = ${4 * a}}`, `Obwód ${4 * a} cm.`) }); }
    if (t === 2) { const a = randi(3, 12), b = randi(2, a - 1), v = 2 * (a + b); return mk('Obwód = ? cm', v, [a + b, a * b, v + 2].filter(x => x !== v), { sub: `Prostokąt ${a} cm na ${b} cm`, sol: `Prostokąt ${a} cm na ${b} cm: obwód = ${a} + ${b} + ${a} + ${b} = ${v} cm`, mistake: a + b, how: H('Obwód prostokąta', `Prostokąt ma dwa boki po ${a} cm i dwa po ${b} cm.`, `{${a} + ${b} + ${a} + ${b} = ${v}}`, `Obwód ${v} cm.`) }); }
    if (t === 3) { const a = randi(3, 9), b = randi(3, 9), c = randi(Math.abs(a - b) + 1, Math.min(9, a + b - 1)), v = a + b + c; return mk('Obwód = ? cm', v, [v + 1, v - 1, v + 2], { sub: `Trójkąt o bokach ${a} cm, ${b} cm, ${c} cm`, sol: `Obwód = ${a} + ${b} + ${c} = ${v} cm`, how: H('Obwód trójkąta', 'Dodaj długości trzech boków.', `{${a} + ${b} + ${c} = ${v}}`) }); }
    const a = randi(2, 20); return mk('Bok = ? cm', a, [a * 2, a + 2, a - 1].filter(v => v > 0 && v !== a), { sub: `Kwadrat ma obwód ${4 * a} cm`, sol: `Obwód ${4 * a} cm : 4 = bok ${a} cm`, mistake: 4 * a / 2, how: H('Bok kwadratu z obwodu', 'Kwadrat ma 4 równe boki, więc obwód dzielimy na 4.', `{${4 * a} : 4 = ${a}}`) });
  }),
  T('Jednostki, połowa i ćwierć', t => {
    if (t <= 2) {
      const [big, small, k] = pick(t === 1 ? [['m', 'cm', 100], ['zł', 'gr', 100], ['cm', 'mm', 10]] : [['kg', 'dag', 100], ['km', 'm', 1000], ['h', 'min', 60], ['t', 'kg', 1000], ['dag', 'g', 10]]);
      const n = randi(2, 9); return mk(`${n} ${big} = ? ${small}`, n * k, [n * k * 10, n * k / 10, n * k + k].filter(Number.isInteger), { mistake: k === 60 ? n * 100 : n * k * 10, how: H('Zamiana jednostek', `1 ${big} to ${k} ${small}.`, `{${n} · ${k} = ${n * k}}`, k === 60 ? 'Uwaga, godzina ma 60 minut, a nie 100.' : null) });
    }
    if (t === 3) { const [big, small] = pick([['m', 'cm'], ['zł', 'gr'], ['kg', 'dag']]), n = randi(1, 5), m = randi(1, 9) * 10, v = n * 100 + m; return mk(`${n} ${big} ${m} ${small} = ? ${small}`, v, [n * 10 + m, v + 100, v + 10], { mistake: n * 10 + m, how: H('Zamiana jednostek', `1 ${big} to 100 ${small}. {${n} · 100 = ${n * 100}}`, `Dodaj resztę. {${n * 100} + ${m} = ${v}}`) }); }
    const r = Math.random();
    if (r < 0.4) { const n = randi(2, 20) * 2; return mk(`Połowa z ${n} = ?`, n / 2, [n / 2 + 1, n / 2 - 1, n * 2], { mistake: n - 2, how: H('Połowa', 'Połowa to podział na 2 równe części.', `{${n} : 2 = ${n / 2}}`, `Sprawdź. {${n / 2} + ${n / 2} = ${n}}`) }); }
    if (r < 0.8) { const n = randi(2, 10) * 4; return mk(`Ćwierć z ${n} = ?`, n / 4, [n / 2, n / 4 + 1, n - 4], { mistake: n / 2, how: H('Ćwierć', 'Ćwierć to połowa połowy.', `{${n} : 2 = ${n / 2}}`, `{${n / 2} : 2 = ${n / 4}}`) }); }
    const [q, v, how] = pick([
      ['Pół godziny = ? min', 30, H('Pół godziny', 'Godzina ma 60 minut. Pół to połowa.', '{60 : 2 = 30}')],
      ['Kwadrans = ? min', 15, H('Kwadrans', 'Kwadrans to ćwierć godziny. Godzina ma 60 minut.', '{60 : 4 = 15}')],
      ['Pół litra + pół litra = ? l', 1, H('Pół litra', 'Dwie połowy dają całość.', '{[1/2] + [1/2] = 1}')],
      ['Pół kilograma = ? dag', 50, H('Pół kilograma', '1 kg to 100 dag. Pół to połowa.', '{100 : 2 = 50}')]]);
    return mk(q, v, [v * 2, v === 1 ? 2 : v + 10, v === 15 ? 25 : v / 2].filter(Number.isInteger), { how });
  }),
];

/* ============================================================
   KLASA 4: rachunki w pamięci, dzielenie z resztą, kwadraty i sześciany, kolejność działań,
   liczby rzymskie, działania pisemne, ułamki zwykłe i dziesiętne
   ============================================================ */
const K4 = [
  T('Rachunki w pamięci', t => {
    if (t === 1) {
      const a = randi(11, 69) * 100, b = randi(1, 9) * 100, plus = Math.random() < 0.5, v = plus ? a + b : a - b, s = plus ? '+' : M;
      const how = H('Liczenie setkami', `${N(a)} to ${ile(a / 100, 'st')}, ${b} to ${ile(b / 100, 'st')}.`, `{${a / 100} ${s} ${b / 100} = ${v / 100}}`, `{${N(a)} ${s} ${b} = ${N(v)}}`);
      return plus ? mk(`${N(a)} + ${b} = ?`, v, [v + 100, v - 100, a + b * 10], { how }) : mk(`${N(a)} ${M} ${b} = ?`, v, [v + 100, v - 100, a - b * 10].filter(x => x > 0), { how });
    }
    if (t === 2) { const d = randi(2, 6), q = randi(11, Math.floor(99 / d)); return Math.random() < 0.5 ? mk(`${d * q} : ${d} = ?`, q, [q + 1, q - 1, q + 10], { how: hDiv2(d * q, d) }) : mk(`${q} · ${d} = ?`, q * d, [q * d + 10, q * d - 10, q * d + d], { how: hMul2(q, d) }); }
    if (t === 3) { const a = randi(2, 9) * 10, b = randi(2, 9) * 10, p = a * b; return Math.random() < 0.5 ? mk(`${a} · ${b} = ?`, p, [p * 10, p / 10, p + 100], { how: H('Mnożenie pełnych dziesiątek', `Pomnóż bez zer. {${a / 10} · ${b / 10} = ${p / 100}}`, `Dopisz dwa zera. {${a} · ${b} = ${N(p)}}`) }) : mk(`${N(p)} : ${a} = ?`, b, [b * 10, b / 10, b + 10].filter(Number.isInteger), { how: H('Dzielenie pełnych dziesiątek', `Skreśl po jednym zerze w obu liczbach. {${N(p / 10)} : ${a / 10} = ${b}}`) }); }
    const a = randi(11, 49) * 1000, b = randi(11, 99) * 100, plus = Math.random() < 0.5, v = plus ? a + b : a - b, s = plus ? '+' : M;
    const how = H('Liczenie setkami', `Licz w setkach. ${N(a)} to ${ile(a / 100, 'st')}, ${N(b)} to ${ile(b / 100, 'st')}.`, `{${a / 100} ${s} ${b / 100} = ${v / 100}}`, `{${N(a)} ${s} ${N(b)} = ${N(v)}}`);
    return mk(`${N(a)} ${s} ${N(b)} = ?`, v, [v + 1000, v - 1000, v + 100], { how });
  }),
  T('Dzielenie z resztą', t => {
    const d = t === 1 ? randi(2, 5) : randi(3, 9), q = t <= 2 ? randi(2, 9) : t === 3 ? randi(3, 12) : randi(10, 25), r = randi(1, d - 1), n = d * q + r;
    const R = (a, b) => `${a} r. ${b}`;
    const w = [R(q + 1, r)]; if (q > 1) w.push(R(q - 1, r)); if (r + 1 < d) w.push(R(q, r + 1)); else if (r > 1) w.push(R(q, r - 1));
    return mk(`${n} : ${d} = ?`, R(q, r), w, { mistake: q > 1 ? R(q - 1, r + d) : null, sol: `${n} : ${d} = ${R(q, r)}, bo ${d} · ${q} + ${r} = ${n}`,
      how: H('Dzielenie z resztą', `Szukaj, ile razy ${d} zmieści się w ${n}. {${d} · ${q} = ${d * q}}`, `Następne, {${d} · ${q + 1} = ${d * (q + 1)}}, to już za dużo.`, `Reszta to {${n} ${M} ${d * q} = ${r}}`, `Reszta musi być mniejsza od ${d}. Wynik ${R(q, r)}.`) });
  }),
  T('Kwadraty i sześciany liczb', t => {
    if (t === 1) { const a = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 30]), v = a * a; return mk(`${a}² = ?`, v, [v + a, v - a, v + 1], { mistake: a === 2 ? null : 2 * a, how: H('Kwadrat liczby', `Kwadrat to liczba pomnożona przez siebie, a nie razy 2. {${a}² = ${a} · ${a} = ${v}}`) }); }
    if (t === 2) { const a = pick([1, 2, 3, 4, 5, 6, 10, 20]), v = a ** 3; return mk(`${a}³ = ?`, v, [a * a, v + a, v * 10].filter(x => x !== v), { mistake: a * 3 === v ? null : a * 3, how: H('Sześcian liczby', `Sześcian to liczba pomnożona przez siebie 3 razy. {${a} · ${a} = ${a * a}}`, `{${a * a} · ${a} = ${N(v)}}`) }); }
    if (t === 3) { const a = randi(2, 6), b = randi(2, 6), v = a * a + b * b; return mk(`${a}² + ${b}² = ?`, v, near(v), { mistake: (a + b) ** 2, how: H('Kwadraty, potem dodawanie', 'Najpierw policz każdy kwadrat osobno.', `{${a}² = ${a * a}}`, `{${b}² = ${b * b}}`, `{${a * a} + ${b * b} = ${v}}`) }); }
    const a = randi(2, 4), b = randi(2, 5), c = randi(2, 9), v = a ** 3 * b - c * c; if (v < 0) return K4[2].gen(4);
    return mk(`${a}³ · ${b} ${M} ${c}² = ?`, v, near(v), { mistake: a * 3 * b - c * 2 >= 0 ? a * 3 * b - c * 2 : null, how: H('Potęgi, mnożenie, odejmowanie', 'Najpierw potęgi.', `{${a}³ = ${a ** 3}}`, `{${c}² = ${c * c}}`, `Potem mnożenie. {${a ** 3} · ${b} = ${a ** 3 * b}}`, `Na końcu odejmowanie. {${a ** 3 * b} ${M} ${c * c} = ${v}}`) });
  }),
  T('Kolejność wykonywania działań', t => {
    if (t === 1) { const a = randi(2, 30), b = randi(2, 9), c = randi(2, 9), v = a + b * c; return mk(`${a} + ${b} · ${c} = ?`, v, near(v), { mistake: (a + b) * c, how: H('Kolejność działań', 'Mnożenie robimy przed dodawaniem.', `{${b} · ${c} = ${b * c}}`, `{${a} + ${b * c} = ${v}}`) }); }
    if (t === 2) { const a = randi(5, 20), b = randi(1, a - 2), c = randi(2, 6), v = (a - b) * c; return mk(`(${a} ${M} ${b}) · ${c} = ?`, v, near(v), { mistake: a - b * c >= 0 ? a - b * c : null, how: H('Kolejność działań', 'Najpierw to, co w nawiasie.', `{${a} ${M} ${b} = ${a - b}}`, `{${a - b} · ${c} = ${v}}`) }); }
    if (t === 3) { const s = randi(3, 9), b = randi(1, s - 1), q = randi(2, 9), n = s * q, e = randi(1, 20), v = q + e; return mk(`${n} : (${b} + ${s - b}) + ${e} = ?`, v, near(v), { how: H('Kolejność działań', 'Najpierw nawias.', `{${b} + ${s - b} = ${s}}`, `Potem dzielenie. {${n} : ${s} = ${q}}`, `Na końcu dodawanie. {${q} + ${e} = ${v}}`) }); }
    const c = randi(2, 4), d = randi(2, 4), b = c * d + randi(1, 9), a = randi(2, 5), e = randi(1, 20), v = a * (b - c * d) + e;
    return mk(`${a} · (${b} ${M} ${c} · ${d}) + ${e} = ?`, v, near(v), { mistake: (b - c) * d * a + e > 0 ? (b - c) * d * a + e : null, how: H('Kolejność działań', 'W nawiasie najpierw mnożenie.', `{${c} · ${d} = ${c * d}}`, `{${b} ${M} ${c * d} = ${b - c * d}}`, `Potem mnożenie przed nawiasem. {${a} · ${b - c * d} = ${a * (b - c * d)}}`, `Na końcu dodawanie. {${a * (b - c * d)} + ${e} = ${v}}`) });
  }, 1.2),
  T('Liczby rzymskie', t => {
    if (t === 1) { const n = randi(4, 20); return mk(`${roman(n)} = ?`, n, [n + 1, n - 1, n + 2], { mistake: /IV|IX/.test(roman(n)) ? n + 2 : null, how: hRoman(n) }); }
    if (t === 2) { const n = randi(14, 39); return mk(`${roman(n)} = ?`, n, [n + 1, n - 1, n + 10, n - 10], { mistake: /IV|IX/.test(roman(n)) ? n + 2 : null, how: hRoman(n) }); }
    if (t === 3) { const n = randi(4, 39); return mk(`${n} = ?`, roman(n), [roman(n + 1), roman(n - 1), roman(n + 10)], { sub: 'Zapisz liczbę po rzymsku', how: hRoman(n) }); }
    const a = randi(4, 20), b = randi(4, 19); return mk(`${roman(a)} + ${roman(b)} = ?`, a + b, [a + b + 1, a + b - 1, a + b + 10], { how: H('Liczby rzymskie', `Zamień na zwykłe liczby. ${roman(a)} = ${a}, ${roman(b)} = ${b}.`, `{${a} + ${b} = ${a + b}}`) });
  }),
  T('Działania pisemne', t => {
    if (t === 1) { const a = randi(1200, 7999), b = randi(110, 999); return Math.random() < 0.5 ? mk(`${N(a)} + ${N(b)} = ?`, a + b, [a + b + 10, a + b - 10, a + b + 100, a + b - 100], { how: hAdd(a, b) }) : mk(`${N(a)} ${M} ${N(b)} = ?`, a - b, [a - b + 10, a - b - 10, a - b + 100, a - b - 100], { how: hSub(a, b) }); }
    if (t === 2) { const a = randi(112, 499), b = randi(3, 9), p = a * b; return mk(`${a} · ${b} = ?`, p, [p + 10, p - 10, p + 100, p - 100], { how: hMul2(a, b) }); }
    if (t === 3) { const d = randi(3, 9), q = randi(102, Math.floor(999 / d)), n = d * q; return mk(`${n} : ${d} = ?`, q, [q + 1, q - 1, q + 10, q - 10], { how: hDiv2(n, d) }); }
    const a = randi(12, 49), b = randi(12, 29), p = a * b; return mk(`${a} · ${b} = ?`, p, [p + 10, p - 10, p + 100, p - 100], { mistake: a * (b % 10) + a * Math.floor(b / 10), how: hMulBig(a, b) });
  }, 1.2),
  T('Ułamki zwykłe', t => {
    // wrong answers are reduced proper fractions, like the right one, so their look gives nothing away
    const lie = (d, ...ns) => ns.filter(n => n > 0 && n < d && gcd(n, d) === 1).map(n => FR(n, d));
    if (t === 1) { const d = randi(5, 12), a = randi(1, d - 2), b = randi(1, d - 1 - a); if (gcd(a + b, d) > 1) return K4[6].gen(1); return mk(`${FR(a, d)} + ${FR(b, d)} = ?`, FR(a + b, d), [...lie(d, a + b + 1, a + b - 1, a + b + 2, a + b - 2, a + b + 3, a + b - 3), ...lie(d + d, a + b)], { mistake: lie(d + d, a + b)[0], how: H('Ułamki o tym samym mianowniku', `Mianownik zostaje ${d}. Dodajemy tylko liczniki.`, `{${a} + ${b} = ${a + b}}`, `{${FR(a, d)} + ${FR(b, d)} = ${FR(a + b, d)}}`) }); }
    if (t === 2) { const d = randi(5, 12), a = randi(3, d - 1), b = randi(1, a - 1); if (gcd(a - b, d) > 1) return K4[6].gen(2); return mk(`${FR(a, d)} ${M} ${FR(b, d)} = ?`, FR(a - b, d), (L => (L.length ? L : lie(d + d, a - b, a - b + 1)))(lie(d, a - b + 1, a + b, a - b - 1, a - b + 2, a - b - 2, a - b + 3)), { how: H('Ułamki o tym samym mianowniku', `Mianownik zostaje ${d}. Odejmujemy tylko liczniki.`, `{${a} ${M} ${b} = ${a - b}}`, `{${FR(a, d)} ${M} ${FR(b, d)} = ${FR(a - b, d)}}`) }); }
    if (t === 3) { const d = randi(3, 9), w = randi(1, 3), a = randi(1, d - 1), b = randi(1, d - 1), n = w * d + a + b; if ((gcd(n, d) > 1 && n % d !== 0) || gcd(a, d) > 1 || gcd(b, d) > 1) return K4[6].gen(3); return mk(`${w}${FR(a, d)} + ${FR(b, d)} = ?`, F(n, d), [F(n + d, d), F(n - 1, d), F(n + 1, d)], { how: H('Liczba mieszana i ułamek', `Dodaj same ułamki. {${FR(a, d)} + ${FR(b, d)} = ${FR(a + b, d)}}`, a + b >= d ? `Z ułamka wyłącz całość. {${FR(a + b, d)} = ${F(a + b, d)}}` : null, `Dodaj całości. {${w} + ${F(a + b, d)} = ${F(n, d)}}`) }); }
    const d = randi(3, 9), w = randi(1, 4), a = randi(1, d - 1); if (gcd(a, d) > 1) return K4[6].gen(4); const n = w * d - a;
    return mk(`${w} ${M} ${FR(a, d)} = ?`, F(n, d), [F(n + d, d), F(n + 1, d), F(n - 1, d)], { mistake: w > 1 ? `${w - 1}${FR(a, d)}` : FR(a, d), how: H('Odejmowanie ułamka od całości', `Zamień jedną całość na ułamek. {1 = ${FR(d, d)}}`, `{${FR(d, d)} ${M} ${FR(a, d)} = ${FR(d - a, d)}}`, w > 1 ? `Zostało jeszcze ${w - 1} całych. {${w - 1} + ${FR(d - a, d)} = ${F(n, d)}}` : null) });
  }, 1.1),
  T('Ułamki dziesiętne', t => {
    if (t === 1) {
      if (Math.random() < 0.5) { const p = pick([1, 2]), k = randi(1, 10 ** p - 1); if (k % 10 === 0 && p === 2) return K4[7].gen(1); return mk(`${FR(k, 10 ** p)} = ?`, D(k, p), [D(k, p + 1), D(k, p - 1)], { how: H('Ułamek dziesiętny', p === 1 ? 'Dziesiąte zapisujemy jedną cyfrą po przecinku.' : 'Setne zapisujemy dwiema cyframi po przecinku.', `{${FR(k, 10 ** p)} = ${D(k, p)}}`) }); }
      const m = randi(1, 9), c = randi(1, 9); return mk(`${m} m ${c} cm = ? m`, D(m * 100 + c, 2), [D(m * 10 + c, 1), D(m * 1000 + c, 3)], { mistake: D(m * 10 + c, 1), how: H('Centymetry na metry', `1 cm to setna część metra. {${c} : 100 = ${D(c, 2)}}`, `{${m} + ${D(c, 2)} = ${D(m * 100 + c, 2)}}`) });
    }
    if (t === 2) { const a = randi(1, 99), b = randi(1, 9) * 10; const [x, y] = swap(a, b), s = cmp(x, y), z = v => '0,' + String(v).padStart(2, '0'); return mk(`${D(x, 2)} ? ${D(y, 2)}`, s, ['<', '>', '='], { sub: 'Jaki znak: <, > czy =?', how: H('Porównywanie ułamków dziesiętnych', 'Dopisz zera, żeby obie liczby miały tyle samo cyfr po przecinku.', D(x, 2) !== z(x) && `{${D(x, 2)} = ${z(x)}}`, D(y, 2) !== z(y) && `{${D(y, 2)} = ${z(y)}}`, `Porównaj setne. {${x} ${s} ${y}}`, `Więc {${D(x, 2)} ${s} ${D(y, 2)}}`) }); }
    if (t === 3) { const a = randi(1, 8), b = randi(1, 9 - a), w = randi(0, 3), x = w * 10 + a, v = x + b; return mk(`${D(x, 1)} + ${D(b, 1)} = ?`, D(v, 1), nearDec(v, 1), { how: H('Dodawanie w dziesiątych', `Licz w dziesiątych. ${D(x, 1)} to ${x} dziesiątych, ${D(b, 1)} to ${b} dziesiątych.`, `{${x} + ${b} = ${v}}`, `{${D(x, 1)} + ${D(b, 1)} = ${D(v, 1)}}`) }); }
    if (Math.random() < 0.5) { const a = randi(11, 59), b = randi(2, Math.min(9, a - 2)), v = a - b; return mk(`${D(a, 1)} ${M} ${D(b, 1)} = ?`, D(v, 1), nearDec(v, 1), { how: H('Odejmowanie w dziesiątych', `Licz w dziesiątych. ${D(a, 1)} to ${a} dziesiątych, ${D(b, 1)} to ${b} dziesiątych.`, `{${a} ${M} ${b} = ${v}}`, `{${D(a, 1)} ${M} ${D(b, 1)} = ${D(v, 1)}}`) }); }
    const a = randi(101, 499), b = randi(1, 9) * 10, v = a + b; return mk(`${D(a, 2)} + ${D(b, 2)} = ?`, D(v, 2), [D(v + 10, 2), D(v - 10, 2)], { mistake: D(a + b / 10, 2), how: H('Dodawanie w setnych', `Licz w setnych. ${D(a, 2)} to ${a} setnych, ${D(b, 2)} to ${b} setnych.`, `{${a} + ${b} = ${v}}`, `{${D(a, 2)} + ${D(b, 2)} = ${D(v, 2)}}`) });
  }),
];

/* ============================================================
   KLASA 5: potęgi, podzielność, działania na ułamkach, ułamki dziesiętne, kąty i pola, liczby całkowite
   ============================================================ */
const digits = n => String(n).split('').map(Number);
const divisors = n => Array.from({ length: n }, (_, i) => i + 1).filter(d => n % d === 0);
function divHow(n, d, yes) {
  const ds = digits(n), s = ds.reduce((x, y) => x + y, 0), last = ds[ds.length - 1], last2 = n % 100;
  if (d === 2) return H('Dzielenie przez 2', 'Liczba dzieli się przez 2, gdy jej ostatnia cyfra jest parzysta (0, 2, 4, 6, 8).', `Ostatnia cyfra to ${last}, więc ${yes ? 'tak' : 'nie'}.`);
  if (d === 5) return H('Dzielenie przez 5', 'Liczba dzieli się przez 5, gdy kończy się na 0 albo 5.', `Ostatnia cyfra to ${last}, więc ${yes ? 'tak' : 'nie'}.`);
  if (d === 10) return H('Dzielenie przez 10', 'Liczba dzieli się przez 10, gdy kończy się na 0.', `Ostatnia cyfra to ${last}, więc ${yes ? 'tak' : 'nie'}.`);
  if (d === 4) return H('Dzielenie przez 4', 'Liczba dzieli się przez 4, gdy jej dwie ostatnie cyfry tworzą liczbę podzielną przez 4.', `Dwie ostatnie cyfry to ${String(last2).padStart(2, '0')}. ${yes ? `{${last2} : 4 = ${last2 / 4}}` : `${last2} nie dzieli się przez 4.`}`, `Więc ${yes ? 'tak' : 'nie'}.`);
  return H(`Dzielenie przez ${d}`, `Liczba dzieli się przez ${d}, gdy suma jej cyfr dzieli się przez ${d}.`, `{${ds.join(' + ')} = ${s}}`, `${s} ${s % d === 0 ? '' : 'nie '}dzieli się przez ${d}, więc ${yes ? 'tak' : 'nie'}.`);
}
const K5 = [
  T('Potęgi i kolejność działań', t => {
    if (t === 1) { const [b, e] = pick([[2, 3], [2, 4], [2, 5], [2, 6], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [3, 2], [3, 3], [5, 2], [1, 5], [1, 7], [1, 9], [4, 2]]), v = b ** e; return mk(`${b}${sup(e)} = ?`, v, [b ** (e + 1), b ** (e - 1)], { mistake: b * e === v ? null : b * e, how: hPow(b, e) }); }
    if (t === 2) { const [b, e] = pick([[3, 4], [5, 3], [4, 3], [2, 6], [2, 7], [2, 8], [6, 2], [7, 2], [8, 2], [9, 2], [6, 3], [7, 3], [5, 4], [0, 5], [0, 8], [11, 2]]), v = b ** e; return mk(`${b}${sup(e)} = ?`, v, [b ** (e + 1), b ** (e - 1), v + b].filter(x => x !== v), { mistake: b * e === v ? null : b * e, how: hPow(b, e) }); }
    if (t === 3) { const a = randi(2, 4), b = randi(2, 5), v = a ** 3 + b ** 2; return mk(`${a}³ + ${b}² = ?`, v, near(v), { mistake: a * 3 + b * 2, how: H('Potęgi, potem dodawanie', 'Najpierw policz potęgi.', `{${a}³ = ${a} · ${a} · ${a} = ${a ** 3}}`, `{${b}² = ${b} · ${b} = ${b * b}}`, `{${a ** 3} + ${b * b} = ${v}}`) }); }
    const a = randi(2, 5), b = randi(1, 4), c = randi(2, 4), v = (a + b) ** 2 - c ** 3; if (v < 0) return K5[0].gen(4);
    return mk(`(${a} + ${b})² ${M} ${c}³ = ?`, v, near(v), { mistake: a * a + b * b - c ** 3 >= 0 ? a * a + b * b - c ** 3 : null, how: H('Nawias, potęgi, odejmowanie', `Najpierw nawias. {${a} + ${b} = ${a + b}}`, `Potem potęgi. {${a + b}² = ${(a + b) ** 2}}`, `{${c}³ = ${c ** 3}}`, `{${(a + b) ** 2} ${M} ${c ** 3} = ${v}}`) });
  }),
  T('Podzielność, liczby pierwsze, NWD i NWW', t => {
    if (t <= 2) {
      const d = t === 1 ? pick([2, 5, 10]) : pick([3, 9, 4]), yes = Math.random() < 0.5;
      let n; do { n = randi(100, 999); } while ((n % d === 0) !== yes);
      return mk(`Czy ${n} dzieli się przez ${d}?`, yes ? 'tak' : 'nie', [yes ? 'nie' : 'tak'], { sol: `${n} ${yes ? '' : 'nie '}dzieli się przez ${d}`, how: divHow(n, d, yes) });
    }
    if (t === 3) {
      let p, c; do { p = randi(11, 97); } while (!isPrime(p)); do { c = randi(11, 99); } while (isPrime(c) || c % 2 === 0 || c % 5 === 0);
      let f = 3; while (c % f) f += 2;
      return mk('Która liczba jest pierwsza?', N(p), [N(c)], { sol: `${p} jest liczbą pierwszą, ${c} nie (${c} = ${f} · ${c / f})`, how: H('Liczby pierwsze', 'Liczba pierwsza dzieli się tylko przez 1 i przez samą siebie.', `${c} dzieli się przez ${f}. {${f} · ${c / f} = ${c}}`, `${p} nie dzieli się ani przez 2, ani przez 3, 5 i 7, więc jest pierwsza.`) });
    }
    const a = randi(2, 6) * pick([2, 3]), b = randi(2, 6) * pick([2, 3, 5]);
    if (a === b) return K5[1].gen(4);
    if (Math.random() < 0.5) { const g = gcd(a, b); return mk(`NWD(${a}, ${b}) = ?`, g, [lcm(a, b), g * 2, Math.min(a, b)].filter(v => v !== g), { sub: 'Największy wspólny dzielnik', how: H('Największy wspólny dzielnik', `Dzielniki ${a}: ${divisors(a).join(', ')}.`, `Dzielniki ${b}: ${divisors(b).join(', ')}.`, `Największy wspólny to ${g}.`) }); }
    const l = lcm(a, b), big = Math.max(a, b), small = Math.min(a, b), mult = Array.from({ length: l / big }, (_, i) => big * (i + 1));
    return mk(`NWW(${a}, ${b}) = ?`, l, [a * b, gcd(a, b), l * 2].filter(v => v !== l), { sub: 'Najmniejsza wspólna wielokrotność', how: H('Najmniejsza wspólna wielokrotność', `Wypisuj wielokrotności większej liczby, ${big}: ${mult.join(', ')}.`, `Pierwsza, która dzieli się przez ${small}, to ${l}. {${l} : ${small} = ${l / small}}`) });
  }),
  T('Skracanie i rozszerzanie ułamków', t => {
    const d0 = randi(3, 9), n0 = randi(1, d0 - 1); if (gcd(n0, d0) > 1) return K5[2].gen(t);
    const k = randi(2, t <= 2 ? 4 : 8);
    if (t === 1) return mk(`${FR(n0, d0)} = [?/${d0 * k}]`, N(n0 * k), [N(n0 * k + 1), N(n0 + k), N(n0 * k - 1)].filter(x => x !== '0'), { how: H('Rozszerzanie ułamka', `Mianownik pomnożono przez ${k}. {${d0} · ${k} = ${d0 * k}}`, `Licznik mnożymy przez to samo. {${n0} · ${k} = ${n0 * k}}`) });
    if (t === 2) return mk(`${FR(n0 * k, d0 * k)} = [?/${d0}]`, N(n0), [N(n0 + 1), N(n0 * k), N(n0 + k)].filter(x => x !== N(n0)), { how: H('Skracanie ułamka', `Mianownik podzielono przez ${k}. {${d0 * k} : ${k} = ${d0}}`, `Licznik dzielimy przez to samo. {${n0 * k} : ${k} = ${n0}}`) });
    // wrong answers are reduced fractions too, so they cannot be ruled out without calculating
    const irr = ([n, d]) => n > 0 && n < d && gcd(n, d) === 1 && n * d0 !== n0 * d;
    const wr = [[n0 + 1, d0], [n0, d0 + 1], [n0 - 1, d0], [n0 + 1, d0 + 1], [n0, d0 + 2], [n0 + 2, d0], [n0 + 1, d0 + 2]].filter(irr).map(([n, d]) => FR(n, d));
    return mk(`Skróć: ${FR(n0 * k, d0 * k)} = ?`, FR(n0, d0), wr, { sub: 'Do postaci nieskracalnej', mistake: irr([n0, d0 * k]) ? FR(n0, d0 * k) : null, how: H('Skracanie ułamka', `Licznik i mianownik dzielą się przez ${k}.`, `{${n0 * k} : ${k} = ${n0}}`, `{${d0 * k} : ${k} = ${d0}}`, `{${FR(n0 * k, d0 * k)} = ${FR(n0, d0)}}`) });
  }),
  T('Dodawanie i odejmowanie ułamków', t => {
    let b, d;
    if (t === 1) { b = pick([2, 3, 4, 5]); d = b * pick([2, 3]); } else { [b, d] = pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [4, 5], [6, 8], [3, 8]]); }
    const a = randi(1, b - 1), c = randi(1, d - 1);
    if (gcd(a, b) > 1 || gcd(c, d) > 1) return K5[3].gen(t);
    if (t <= 2) return mk(`${FR(a, b)} + ${FR(c, d)} = ?`, F(a * d + c * b, b * d), nearFr(a * d + c * b, b * d), { mistake: F(a + c, b + d), how: H('Wspólny mianownik', ...fracSteps(a, b, c, d, '+'), 'Uwaga, mianowników nie dodajemy.') });
    if (t === 3) {
      const x = a * d, y = c * b; if (x === y) return K5[3].gen(3);
      const [hi, lo] = x > y ? [[a, b], [c, d]] : [[c, d], [a, b]], n = hi[0] * lo[1] - lo[0] * hi[1], m = b * d;
      return mk(`${FR(hi[0], hi[1])} ${M} ${FR(lo[0], lo[1])} = ?`, F(n, m), nearFr(n, m), { mistake: hi[1] !== lo[1] && hi[0] > lo[0] ? F(hi[0] - lo[0], Math.abs(hi[1] - lo[1])) : null, how: H('Wspólny mianownik', ...fracSteps(hi[0], hi[1], lo[0], lo[1], M)) });
    }
    const w1 = randi(1, 3), w2 = randi(1, 2), n = (w1 * b + a) * d + (w2 * d + c) * b, m = b * d, mm = lcm(b, d), R = a * mm / b + c * mm / d;
    return mk(`${w1}${FR(a, b)} + ${w2}${FR(c, d)} = ?`, F(n, m), nearFr(n, m), { mistake: `${w1 + w2}${F(a + c, b + d)}`, how: H('Liczby mieszane', `Dodaj osobno całości. {${w1} + ${w2} = ${w1 + w2}}`, 'Potem ułamki.', ...fracSteps(a, b, c, d, '+'), `Połącz. {${w1 + w2} + ${F(R, mm)} = ${F(n, m)}}`) });
  }, 1.25),
  T('Mnożenie i dzielenie ułamków', t => {
    if (t === 1) {
      if (Math.random() < 0.5) { const d = randi(2, 9), n = randi(1, d - 1), k = d * randi(1, 3); if (gcd(n, d) > 1) return K5[4].gen(1); return mk(`${FR(n, d)} · ${k} = ?`, F(n * k, d), [F(n + k, d), F(n * k + d, d)], { mistake: F(n, d * k), how: H('Ułamek razy liczba', 'Mnożymy tylko licznik, mianownik zostaje.', `{${FR(n, d)} · ${k} = ${FR(n * k, d)}}`, reduceStep(n * k, d)) }); }
      const d = randi(2, 6), n = randi(1, d - 1), w = d * randi(2, 9); if (gcd(n, d) > 1) return K5[4].gen(1); const one = w / d;
      return mk(`${FR(n, d)} z ${w} = ?`, one * n, [one, one * n + n, w * n].filter(v => v !== one * n), { mistake: n > 1 ? one : w - one, how: H('Ułamek z liczby', `Jedna ${d === 2 ? 'połowa' : `${d}. część`} z ${w}. {${w} : ${d} = ${one}}`, n > 1 ? `Bierzemy ${n} takie części. {${one} · ${n} = ${one * n}}` : null) });
    }
    if (t === 2) { const b = randi(2, 7), d = randi(2, 7), a = randi(1, b - 1), c = randi(1, d - 1); if (gcd(a, b) > 1 || gcd(c, d) > 1) return K5[4].gen(2); return mk(`${FR(a, b)} · ${FR(c, d)} = ?`, F(a * c, b * d), nearFr(a * c, b * d), { mistake: F(a * d, b * c), how: H('Mnożenie ułamków', 'Licznik razy licznik, mianownik razy mianownik.', `{${FR(a, b)} · ${FR(c, d)} = ${FR(a * c, b * d)}}`, reduceStep(a * c, b * d)) }); }
    if (t === 3) {
      if (Math.random() < 0.5) { const b = randi(2, 7), d = randi(2, 7), a = randi(1, b - 1), c = randi(1, d - 1); if (gcd(a, b) > 1 || gcd(c, d) > 1) return K5[4].gen(3); return mk(`${FR(a, b)} : ${FR(c, d)} = ?`, F(a * d, b * c), nearFr(a * d, b * c), { mistake: F(a * c, b * d), how: H('Dzielenie ułamków', 'Dzielenie przez ułamek to mnożenie przez jego odwrotność.', `{${FR(a, b)} : ${FR(c, d)} = ${FR(a, b)} · ${FR(d, c)}}`, `{${FR(a, b)} · ${FR(d, c)} = ${FR(a * d, b * c)}}`, reduceStep(a * d, b * c)) }); }
      const w = randi(2, 6), d = randi(2, 5), c = randi(1, d - 1); if (gcd(c, d) > 1) return K5[4].gen(3);
      return mk(`${w} : ${FR(c, d)} = ?`, F(w * d, c), [F(w * c, d), F(w * d + 1, c)], { mistake: F(w * c, d), how: H('Dzielenie przez ułamek', 'Dzielenie przez ułamek to mnożenie przez jego odwrotność.', `{${w} : ${FR(c, d)} = ${w} · ${FR(d, c)}}`, `{${w} · ${FR(d, c)} = ${FR(w * d, c)}}`, reduceStep(w * d, c)) });
    }
    const w = randi(1, 2), b = randi(2, 5), a = randi(1, b - 1), d = randi(2, 6), c = randi(1, d - 1);
    if (gcd(a, b) > 1 || gcd(c, d) > 1) return K5[4].gen(4);
    const im = w * b + a, toImp = `Zamień liczbę mieszaną na ułamek. {${w}${FR(a, b)} = ${FR(im, b)}}`;
    if (Math.random() < 0.5) return mk(`${w}${FR(a, b)} · ${FR(c, d)} = ?`, F(im * c, b * d), nearFr(im * c, b * d), { mistake: `${w}${F(a * c, b * d)}`, how: H('Mnożenie liczby mieszanej', toImp, `{${FR(im, b)} · ${FR(c, d)} = ${FR(im * c, b * d)}}`, reduceStep(im * c, b * d)) });
    return mk(`${w}${FR(a, b)} : ${FR(c, d)} = ?`, F(im * d, b * c), nearFr(im * d, b * c), { mistake: F(im * c, b * d), how: H('Dzielenie liczby mieszanej', toImp, `Dzielenie przez ułamek to mnożenie przez odwrotność. {${FR(im, b)} · ${FR(d, c)} = ${FR(im * d, b * c)}}`, reduceStep(im * d, b * c)) });
  }, 1.25),
  T('Ułamki dziesiętne: działania', t => {
    if (t === 1) {
      const z = randi(1, 3), k = 10 ** z, a = randi(11, 999), p = pick([1, 2]);
      return Math.random() < 0.5
        ? mk(`${D(a, p)} · ${N(k)} = ?`, D(a * k, p), [D(a * k, p + 1), D(a * k * 10, p), D(a, p + z)], { how: H('Mnożenie przez 10, 100, 1000', `Przesuń przecinek o ${z} ${miejsc(z)} w prawo, bo ${N(k)} ma ${z} ${z === 1 ? 'zero' : 'zera'}.`, `{${D(a, p)} · ${N(k)} = ${D(a * k, p)}}`) })
        : mk(`${D(a, p)} : ${N(k)} = ?`, D(a, p + z), [D(a, p + z - 1), D(a * k, p), D(a, p + z + 1)], { how: H('Dzielenie przez 10, 100, 1000', `Przesuń przecinek o ${z} ${miejsc(z)} w lewo, bo ${N(k)} ma ${z} ${z === 1 ? 'zero' : 'zera'}.`, `{${D(a, p)} : ${N(k)} = ${D(a, p + z)}}`) });
    }
    if (t === 2) {
      const a = randi(2, 9), b = randi(2, 9);
      return Math.random() < 0.5
        ? mk(`${D(a, 1)} · ${b} = ?`, D(a * b, 1), nearDec(a * b, 1), { mistake: D(a * b, 2), how: H('Mnożenie w dziesiątych', `${D(a, 1)} to ${a} dziesiątych. {${a} · ${b} = ${a * b}}`, `${a * b} dziesiątych to ${D(a * b, 1)}. {${D(a, 1)} · ${b} = ${D(a * b, 1)}}`) })
        : mk(`${D(a * b, 1)} : ${b} = ?`, D(a, 1), nearDec(a, 1), { mistake: D(a, 2), how: H('Dzielenie w dziesiątych', `${D(a * b, 1)} to ${a * b} dziesiątych. {${a * b} : ${b} = ${a}}`, `${a} dziesiątych to ${D(a, 1)}. {${D(a * b, 1)} : ${b} = ${D(a, 1)}}`) });
    }
    if (t === 3) { const a = randi(2, 9), b = randi(2, 9); return mk(`${D(a, 1)} · ${D(b, 1)} = ?`, D(a * b, 2), [D(a * b, 3), D(a * b + 1, 2)], { mistake: D(a * b, 1), how: H('Mnożenie ułamków dziesiętnych', `Pomnóż bez przecinków. {${a} · ${b} = ${a * b}}`, 'Obie liczby mają po jednej cyfrze po przecinku, więc wynik ma dwie.', `{${D(a, 1)} · ${D(b, 1)} = ${D(a * b, 2)}}`) }); }
    const b = randi(2, 9), q = randi(2, 9), p = pick([1, 2]), k = 10 ** p;
    return mk(`${D(b * q, p)} : ${D(b, p)} = ?`, N(q), [N(q * 10), D(q, 2)].filter(x => x !== N(q)), { mistake: D(q, 1), how: H('Dzielenie przez ułamek dziesiętny', `Pomnóż obie liczby przez ${k}. Wynik dzielenia się nie zmienia.`, `{${D(b * q, p)} · ${k} = ${b * q}}`, `{${D(b, p)} · ${k} = ${b}}`, `{${b * q} : ${b} = ${q}}`) });
  }, 1.15),
  T('Kąty i pola figur', t => {
    if (t === 1) { const a = randi(30, 80), b = randi(30, 150 - a - 10), c = 180 - a - b; return mk(`${deg(a)} + ${deg(b)} + ? = 180°`, deg(c), [deg(c + 10), deg(360 - a - b), deg(c - 10)].filter(x => x !== deg(c)), { sub: 'Trzeci kąt trójkąta', sol: `${a}° + ${b}° + ${c}° = 180°`, mistake: deg(360 - a - b), how: H('Kąty trójkąta', 'Suma kątów w trójkącie to zawsze 180°.', `{${a} + ${b} = ${a + b}}`, `{180 ${M} ${a + b} = ${c}}`, `Trzeci kąt ma ${c}°.`) }); }
    if (t === 2) { const top = randi(2, 14) * 10, base = (180 - top) / 2; return mk('Kąt przy podstawie = ?', deg(base), [deg(180 - top), deg(top), deg(base + 10)].filter(x => x !== deg(base)), { sub: `Trójkąt równoramienny, kąt między ramionami ${top}°`, sol: `(180° − ${top}°) : 2 = ${base}°`, mistake: deg(180 - top), how: H('Trójkąt równoramienny', 'Suma kątów to 180°, a dwa kąty przy podstawie są równe.', `{180 ${M} ${top} = ${180 - top}}`, `Dzielimy na dwa równe kąty. {${180 - top} : 2 = ${base}}`) }); }
    if (t === 3) {
      if (Math.random() < 0.5) { const a = randi(2, 12), h = randi(1, 6) * 2; return mk('P = ? cm²', a * h / 2, [a * h, a * h / 2 + 2], { sub: `Trójkąt: a = ${a} cm, h = ${h} cm`, sol: `Trójkąt: P = ${a} · ${h} : 2 = ${a * h / 2} cm²`, mistake: a * h, how: H('Pole trójkąta', 'Pole trójkąta to podstawa razy wysokość, podzielone przez 2.', `{${a} · ${h} = ${a * h}}`, `{${a * h} : 2 = ${a * h / 2}}`) }); }
      const a = randi(3, 12), h = randi(2, 9); return mk('P = ? cm²', a * h, [a * h + a, 2 * (a + h)].filter(v => v !== a * h), { sub: `Równoległobok: a = ${a} cm, h = ${h} cm`, sol: `Równoległobok: P = ${a} · ${h} = ${a * h} cm²`, mistake: Number.isInteger(a * h / 2) ? a * h / 2 : null, how: H('Pole równoległoboku', 'Pole równoległoboku to podstawa razy wysokość.', `{${a} · ${h} = ${a * h}}`) });
    }
    const a = randi(4, 12), b = randi(2, a - 1), h = randi(1, 5) * 2, v = (a + b) * h / 2;
    return mk('P = ? cm²', v, [(a + b) * h, v + h], { sub: `Trapez: a = ${a} cm, b = ${b} cm, h = ${h} cm`, sol: `Trapez: P = (${a} + ${b}) · ${h} : 2 = ${v} cm²`, mistake: (a + b) * h, how: H('Pole trapezu', 'Dodaj podstawy, pomnóż przez wysokość i podziel przez 2.', `{${a} + ${b} = ${a + b}}`, `{${a + b} · ${h} = ${(a + b) * h}}`, `{${(a + b) * h} : 2 = ${v}}`) });
  }, 1.2),
  T('Liczby całkowite: dodawanie i odejmowanie', t => {
    const a = randi(1, 12), b = randi(1, 12);
    if (t === 1) { if (a === b) return K5[7].gen(1); const v = b - a; return mk(`${M}${a} + ${b} = ?`, v, near(v, true), { mistake: a - b, how: H('Liczby ujemne', `Na osi liczbowej stań na ${M}${a} i przejdź ${b} w prawo.`, v > 0 ? `Dodatnich jest więcej. {${b} ${M} ${a} = ${v}}` : `Ujemnych jest więcej. {${a} ${M} ${b} = ${a - b}}, więc wynik to ${N(v)}.`, `{${M}${a} + ${b} = ${N(v)}}`) }); }
    if (t === 2) { const x = randi(1, 9), y = randi(x + 1, 15); return mk(`${x} ${M} ${y} = ?`, x - y, near(x - y, true), { mistake: y - x, how: H('Liczby ujemne', `Odejmujesz więcej, niż masz, więc wynik będzie ujemny.`, `{${y} ${M} ${x} = ${y - x}}`, `{${x} ${M} ${y} = ${N(x - y)}}`) }); }
    if (t === 3) return mk(`${M}${a} ${M} ${b} = ?`, -a - b, near(-a - b, true), { mistake: b - a === 0 ? a + b : b - a, how: H('Liczby ujemne', `Jesteś na ${M}${a} i idziesz jeszcze ${b} w lewo. Ujemne się sumują.`, `{${a} + ${b} = ${a + b}}`, `{${M}${a} ${M} ${b} = ${N(-a - b)}}`) });
    if (Math.random() < 0.5) return mk(`${M}${a} ${M} (${M}${b}) = ?`, b - a, near(b - a, true), { mistake: -a - b, how: H('Odejmowanie liczby ujemnej', 'Odjąć liczbę ujemną to tak samo, jak dodać dodatnią.', `{${M}${a} ${M} (${M}${b}) = ${M}${a} + ${b}}`, `{${M}${a} + ${b} = ${N(b - a)}}`) });
    const c = randi(1, 6), v = a - b - c; return mk(`${a} + (${M}${b}) ${M} ${c} = ?`, v, near(v, true), { mistake: a + b - c, how: H('Dodawanie liczby ujemnej', 'Dodać liczbę ujemną to tak samo, jak odjąć.', `{${a} + (${M}${b}) = ${a} ${M} ${b}}`, `{${a} ${M} ${b} = ${N(a - b)}}`, `{${N(a - b)} ${M} ${c} = ${N(v)}}`) });
  }),
];

/* ============================================================
   KLASA 6: ułamki razem, liczby całkowite, procenty, wyrażenia, równania, prędkość, objętość
   ============================================================ */
// A fraction n/d and a decimal k/10^p combined with one operation; the answer in the simplest school form
function fracDec(op) {
  const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 10], [3, 10]]), [k, p] = pick([[5, 1], [25, 2], [2, 1], [75, 2], [4, 1], [6, 1], [15, 2]]);
  const P10 = 10 ** p;
  let rn, rd, sym;
  if (op === '+') { rn = n * P10 + k * d; rd = d * P10; sym = '+'; }
  else if (op === '-') { rn = n * P10 - k * d; rd = d * P10; sym = M; if (rn <= 0) return fracDec(op); }
  else if (op === '*') { rn = n * k; rd = d * P10; sym = '·'; }
  else { rn = n * P10; rd = d * k; sym = ':'; }
  const fracFirst = op === '+' || op === '*' ? Math.random() < 0.5 : true;
  const L = fracFirst ? FR(n, d) : D(k, p), R = fracFirst ? D(k, p) : FR(n, d);
  const tenth = rd % 10 === 0 ? nice(rn + rd / 10, rd) : nice(rn + 1, rd), ans = nice(rn, rd);
  let how;
  if (op !== ':') {
    const fd = nice(n, d), L2 = fracFirst ? fd : D(k, p), R2 = fracFirst ? D(k, p) : fd;
    how = H('Ułamek zwykły i dziesiętny', `Zamień ułamek zwykły na dziesiętny. {${FR(n, d)} = ${fd}}`, `{${L2} ${sym} ${R2} = ${ans}}`);
  } else {
    const kr = k / gcd(k, P10), pr = P10 / gcd(k, P10), inv = kr === 1 ? N(pr) : FR(pr, kr);
    how = H('Ułamek zwykły i dziesiętny', `Zamień ułamek dziesiętny na zwykły. {${D(k, p)} = ${FR(kr, pr)}}`, `Dzielenie przez ułamek to mnożenie przez odwrotność. {${FR(n, d)} : ${FR(kr, pr)} = ${FR(n, d)} · ${inv}}`, `{${FR(n, d)} · ${inv} = ${FR(n * pr, d * kr)}}`, F(n * pr, d * kr) !== FR(n * pr, d * kr) || ans !== FR(n * pr, d * kr) ? `{${FR(n * pr, d * kr)} = ${ans}}` : null);
  }
  return mk(`${L} ${sym} ${R} = ?`, ans, [tenth, nice(rn * 2, rd), nice(rn + rd, rd)], { how });
}
const K6 = [
  T('Ułamki zwykłe i dziesiętne razem', t => fracDec(['+', '-', '*', ':'][t - 1]), 1.3),
  T('Zamiana ułamków i zaokrąglanie', t => {
    const opts = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 20], [7, 20], [3, 25]];
    const [n, d] = pick(opts); let p = 1; while ((n * 10 ** p) % d) p++; const k = n * 10 ** p / d, P10 = 10 ** p;
    if (t === 1) return mk(`${FR(n, d)} = ?`, D(k, p), [D(k, p + 1), D(k + 1, p), D(n, 1)].filter(x => x !== D(k, p)), { mistake: `${n},${d}`, how: H('Ułamek zwykły na dziesiętny', `Rozszerz ułamek tak, żeby w mianowniku było ${N(P10)}. Mnożymy przez ${P10 / d}.`, `{${FR(n, d)} = ${FR(k, P10)}}`, `{${FR(k, P10)} = ${D(k, p)}}`) });
    if (t === 2) return mk(`${D(k, p)} = ?`, F(n, d), [F(n + 1, d), F(n, d + 1), F(d, n)], { sub: 'Zapisz jako ułamek zwykły', how: H('Ułamek dziesiętny na zwykły', `${p === 1 ? 'Jedna cyfra' : p === 2 ? 'Dwie cyfry' : 'Trzy cyfry'} po przecinku, więc w mianowniku ${N(P10)}. {${D(k, p)} = ${FR(k, P10)}}`, `Skróć. {${FR(k, P10)} = ${F(n, d)}}`) });
    if (t === 3) {
      const [a, b] = pick([[1, 3], [2, 3], [1, 6], [5, 6], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [1, 9], [2, 9], [4, 9], [5, 9], [7, 9], [8, 9], [1, 12], [5, 12], [7, 12], [2, 11]]), h = Math.round(a * 100 / b), th = Math.floor(a * 1000 / b), third = th % 10;
      return mk(`${FR(a, b)} ≈ ?`, D(h, 2), [D(Math.floor(a * 100 / b) === h ? h + 1 : h - 1, 2), D(Math.round(a * 10 / b), 1), D(h + 10, 2)].filter(x => x !== D(h, 2)), { sub: 'Zaokrąglij do części setnych', sol: `${a}/${b} ≈ ${D(h, 2)}`, how: H('Zaokrąglanie', `Podziel ${a} przez ${b} do trzeciej cyfry po przecinku. Wychodzi ${D(th, 3)}…`, `Trzecia cyfra po przecinku to ${third}. ${third >= 5 ? 'To 5 albo więcej, więc druga cyfra rośnie o 1.' : 'To mniej niż 5, więc druga cyfra zostaje.'}`, `Wynik ${D(h, 2)}.`) });
    }
    const [a, b] = pick([[1, 3], [2, 3], [1, 9], [2, 9], [4, 9], [5, 9], [7, 9], [8, 9], [1, 6], [5, 6], [1, 11], [2, 11], [5, 11], [1, 12], [5, 12], [7, 12], [1, 15], [2, 15]]);
    const [s, wr, long] = periodic(a, b);
    return mk(`${FR(a, b)} = ?`, s, [wr], { sub: 'Ułamek okresowy', sol: `${a}/${b} = ${s}`, how: H('Ułamek okresowy', `Podziel ${a} przez ${b}. Wychodzi ${long}… i cyfry się powtarzają bez końca.`, `Powtarzającą się część piszemy w nawiasie: ${s}.`) });
  }, 1.1),
  T('Liczby całkowite: wszystkie działania', t => {
    const a = randi(2, 12), b = randi(2, 12), c = randi(2, 9);
    if (t === 1) return Math.random() < 0.5
      ? mk(`(${M}${a}) · ${b} = ?`, -a * b, [-a * b + a, -a * b - b], { mistake: a * b, how: H('Mnożenie liczb ujemnych', 'Minus razy plus daje minus.', `{${a} · ${b} = ${a * b}}`, `{(${M}${a}) · ${b} = ${N(-a * b)}}`) })
      : mk(`(${M}${a}) · (${M}${b}) = ?`, a * b, [a * b + a, a * b - b], { mistake: -a * b, how: H('Mnożenie liczb ujemnych', 'Minus razy minus daje plus.', `{${a} · ${b} = ${a * b}}`, `{(${M}${a}) · (${M}${b}) = ${a * b}}`) });
    if (t === 2) return Math.random() < 0.5
      ? mk(`(${M}${a * b}) : ${b} = ?`, -a, [-a + 1, -a - 1], { mistake: a, how: H('Dzielenie liczb ujemnych', 'Minus przez plus daje minus.', `{${a * b} : ${b} = ${a}}`, `{(${M}${a * b}) : ${b} = ${N(-a)}}`) })
      : mk(`(${M}${a * b}) : (${M}${b}) = ?`, a, [a + 1, a - 1], { mistake: -a, how: H('Dzielenie liczb ujemnych', 'Minus przez minus daje plus.', `{${a * b} : ${b} = ${a}}`, `{(${M}${a * b}) : (${M}${b}) = ${a}}`) });
    if (t === 3) { const x = randi(2, 9), y = randi(2, 9), v = -x + y * -c; return mk(`${M}${x} + ${y} · (${M}${c}) = ?`, v, near(v, true), { mistake: (-x + y) * -c, how: H('Kolejność działań z minusem', 'Najpierw mnożenie. Plus razy minus daje minus.', `{${y} · (${M}${c}) = ${N(-y * c)}}`, `{${M}${x} + (${N(-y * c)}) = ${N(v)}}`) }); }
    if (Math.random() < 0.5) { const e = randi(2, 3), v = (-c) ** e; return mk(`(${M}${c})${sup(e)} = ?`, v, [v + c, (-c) * e], { mistake: -v, how: H('Potęga liczby ujemnej', e % 2 === 0 ? 'Parzysta liczba minusów daje plus.' : 'Nieparzysta liczba minusów daje minus.', `{${Array(e).fill(`(${M}${c})`).join(' · ')} = ${N(v)}}`) }); }
    const x = randi(2, 9), y = randi(2, 9), v = x * x - y * -c;
    return mk(`(${M}${x})² ${M} ${y} · (${M}${c}) = ?`, v, near(v, true), { mistake: -(x * x) + y * c, how: H('Kolejność działań z minusem', `Najpierw potęga. {(${M}${x})² = ${x * x}}`, `Potem mnożenie. {${y} · (${M}${c}) = ${N(-y * c)}}`, `Odjąć liczbę ujemną to dodać. {${x * x} ${M} (${N(-y * c)}) = ${v}}`) });
  }),
  T('Procenty', t => {
    if (t === 1) { const p = pick([1, 10, 25, 50]), w = p === 1 ? 100 * randi(2, 9) : p === 25 ? 4 * randi(2, 25) : 10 * randi(2, 20), v = w * p / 100; return mk(`${p}% z ${w} = ?`, v, [v * 2, v + 10, w - v].filter(x => x !== v && x > 0), { how: H('Procent liczby w pamięci', ...pctSteps(p, w)) }); }
    if (t === 2) {
      const [n, d, pc] = pick([[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [1, 10, 10], [3, 10, 30]]);
      return Math.random() < 0.5
        ? mk(`${FR(n, d)} = ?%`, `${pc}%`, [`${n * 10}%`, `${pc + 5}%`, `${d}%`].filter(x => x !== `${pc}%`), { sol: `${n}/${d} = ${pc}%`, how: H('Ułamek na procent', `Procent to setna część. Rozszerz ułamek do mianownika 100.`, `{${FR(n, d)} = ${FR(pc, 100)}}`, `${pc} setnych to ${pc}%.`) })
        : mk(`${pc}% = ?`, F(n, d), [F(n + 1, d), FR(1, pc), F(n, d * 2)].filter(x => x !== F(n, d)), { sub: 'Zapisz jako ułamek zwykły', sol: `${pc}% = ${n}/${d}`, how: H('Procent na ułamek', `${pc}% to ${pc} setnych. {${pc}% = ${FR(pc, 100)}}`, `Skróć. {${FR(pc, 100)} = ${F(n, d)}}`) });
    }
    if (t === 3) { const p = pick([10, 20, 25, 50, 75]), w = 20 * randi(1, 10), part = w * p / 100; return mk(`${part} to ?% liczby ${w}`, `${p}%`, [`${p + 5}%`, `${p * 2}%`, `${Math.max(1, p - 5)}%`].filter(x => x !== `${p}%`), { sol: `${part} to ${p}% liczby ${w}`, how: H('Jaki to procent', `Zapisz, jaką częścią ${w} jest ${part}, i skróć. {${FR(part, w)} = ${F(part, w)}}`, `Rozszerz do mianownika 100. {${F(part, w)} = ${FR(p, 100)}}`, `${p} setnych to ${p}%.`) }); }
    const p = pick([10, 20, 25, 50]), w = 20 * randi(2, 15), up = Math.random() < 0.5, x = w * p / 100, v = up ? w + x : w - x;
    return mk(`${w} zł ${up ? '+' : M} ${p}% = ?`, zl(v), [zl(up ? w - x : w + x), zl(up ? w + p : w - p)], { sub: up ? 'Podwyżka ceny' : 'Obniżka ceny', sol: `${w} zł ${up ? 'po podwyżce' : 'po obniżce'} o ${p}% = ${zl(v)}`, how: H(up ? 'Podwyżka o procent' : 'Obniżka o procent', `Policz ${p}% z ${w}.`, ...pctSteps(p, w), `${up ? 'Dodaj' : 'Odejmij'} to od ceny. {${w} ${up ? '+' : M} ${x} = ${v}}`) });
  }, 1.1),
  T('Wyrażenia algebraiczne', t => {
    if (t === 1) { const k = randi(2, 9), c = randi(1, 15), x = randi(2, 9), v = pick(['a', 'x', 'b']); return mk(`${k}${v} + ${c} = ?`, k * x + c, [k + x + c, k * x, k * (x + c)], { sub: `dla ${v} = ${x}`, sol: `${k} · ${x} + ${c} = ${k * x + c}`, how: H('Wartość wyrażenia', `${k}${v} oznacza ${k} · ${v}. Wstaw ${x} w miejsce ${v}.`, `Najpierw mnożenie. {${k} · ${x} = ${k * x}}`, `{${k * x} + ${c} = ${k * x + c}}`) }); }
    if (t === 2) { const a = randi(2, 9), b = randi(2, 9), v = pick(['x', 'a', 'y']); return mk(`${a}${v} + ${b}${v} = ?`, term(a + b, v), [term(a * b, v), N(a + b)], { mistake: `${a + b}${v}²`, how: H('Wyrazy podobne', `Dodajemy liczby przed literą, a litera zostaje. Jak ${ile(a, 'jb')} i ${ile(b, 'jb')} to razem ${ile(a + b, 'jb')}.`, `{${a} + ${b} = ${a + b}}`, `{${a}${v} + ${b}${v} = ${term(a + b, v)}}`) }); }
    if (t === 3) { const a = randi(5, 12), b = randi(1, a - 2), c = randi(1, 5), v = pick(['x', 'a']); return mk(`${a}${v} ${M} ${term(b, v)} + ${term(c, v)} = ?`, term(a - b + c, v), [term(a - b - c, v), term(a + b + c, v), term(a - b + c + 1, v)].filter(s => !s.startsWith(M) && s !== '0' + v), { how: H('Wyrazy podobne', 'Licz same liczby przed literą, po kolei.', `{${a} ${M} ${b} + ${c} = ${a - b + c}}`, `{${a}${v} ${M} ${term(b, v)} + ${term(c, v)} = ${term(a - b + c, v)}}`) }); }
    const a = randi(2, 6), b = randi(1, 8), c = randi(2, 6), d = randi(1, 8);
    if (b === d) return K6[4].gen(4);
    return mk(`${a}x + ${b} + ${c}x ${M} ${d} = ?`, lin(a + c, 'x', b - d), [lin(a + c + 1, 'x', b - d), lin(a * c, 'x', b - d)], { mistake: lin(a + c, 'x', b + d), how: H('Wyrazy podobne', 'Zbierz osobno wyrazy z x i osobno same liczby.', `{${a}x + ${c}x = ${term(a + c, 'x')}}`, `{${b} ${M} ${d} = ${N(b - d)}}`, `{${a}x + ${b} + ${c}x ${M} ${d} = ${lin(a + c, 'x', b - d)}}`) });
  }, 1.1),
  T('Równania', t => {
    const x = randi(2, 12);
    if (t === 1) { const b = randi(2, 20); return mk(`x + ${b} = ${x + b}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: 2 * x + b, how: H('Równanie', `Odejmij ${b} od obu stron. x = {${x + b} ${M} ${b} = ${x}}`, `Sprawdź. {${x} + ${b} = ${x + b}}`) }); }
    if (t === 2) { const a = randi(2, 9); return mk(`${a}x = ${a * x}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: a * x - a, how: H('Równanie', `${a}x to ${a} · x. Podziel obie strony przez ${a}. x = {${a * x} : ${a} = ${x}}`, `Sprawdź. {${a} · ${x} = ${a * x}}`) }); }
    if (t === 3) { const a = randi(2, 6), b = randi(1, 15); return mk(`${a}x ${M} ${b} = ${N(a * x - b)}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (a * x - 2 * b) % a === 0 && a * x - 2 * b > 0 ? (a * x - 2 * b) / a : null, how: H('Równanie', `Dodaj ${b} do obu stron. ${a}x = {${N(a * x - b)} + ${b} = ${a * x}}`, `Podziel przez ${a}. x = {${a * x} : ${a} = ${x}}`, `Sprawdź. {${a} · ${x} ${M} ${b} = ${N(a * x - b)}}`) }); }
    // degree 4: still with x on one side only, as the curriculum of classes 4–6 says, e.g. (x − 2) : 3 = 4 or 3(x + 2) = 21
    if (Math.random() < 0.5) {
      const a = randi(2, 5), b = randi(1, 9), c = randi(2, 9), X = a * c + b;
      return mk(`${FR(`x ${M} ${b}`, a)} = ${c}`, X, [X + 1, X - 1], { sub: 'x = ?', ask: 'x', mistake: a * c - b > 0 ? a * c - b : null, how: H('Równanie z ułamkiem', `Pomnóż obie strony przez ${a}. x ${M} ${b} = {${c} · ${a} = ${a * c}}`, `Dodaj ${b}. x = {${a * c} + ${b} = ${X}}`, `Sprawdź. {(${X} ${M} ${b}) : ${a} = ${c}}`) });
    }
    const a = randi(2, 6), b = randi(1, 9), v = a * (x + b);
    return mk(`${a}(x + ${b}) = ${v}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: v - b, how: H('Równanie z nawiasem', `Podziel obie strony przez ${a}. x + ${b} = {${v} : ${a} = ${x + b}}`, `Odejmij ${b}. x = {${x + b} ${M} ${b} = ${x}}`, `Sprawdź. {${a} · (${x} + ${b}) = ${v}}`) });
  }, 1.2),
  T('Prędkość, droga i czas', t => {
    const v = pick([4, 5, 10, 12, 15, 20, 30, 40, 50, 60, 70, 80, 90]), h = randi(2, 5);
    if (t === 1) return mk('s = ? km', v * h, [v + h, v * h + v, v * (h - 1)], { sub: `Prędkość ${v} km/h, czas ${h} h`, sol: `s = ${v} km/h · ${h} h = ${v * h} km`, mistake: v + h, how: H('Droga', `${v} km/h znaczy ${v} km w każdej godzinie. Droga to prędkość razy czas.`, `{${v} · ${h} = ${v * h}}`, `Droga ${v * h} km.`) });
    if (t === 2) return mk('v = ? km/h', v, [v * h * h, v + h, v * 2].filter(x => x !== v), { sub: `Droga ${v * h} km, czas ${h} h`, sol: `v = ${v * h} km : ${h} h = ${v} km/h`, mistake: v * h * h, how: H('Prędkość', 'Prędkość to droga podzielona przez czas.', `{${v * h} : ${h} = ${v}}`, `${v} km na każdą godzinę, czyli ${v} km/h.`) });
    if (t === 3) return mk('t = ? h', h, [h + 1, h * 2, v].filter(x => x !== h), { sub: `Droga ${v * h} km, prędkość ${v} km/h`, sol: `t = ${v * h} km : ${v} km/h = ${h} h`, how: H('Czas', `Czas to droga podzielona przez prędkość. Ile razy ${v} km mieści się w ${v * h} km?`, `{${v * h} : ${v} = ${h}}`) });
    const [min, frac] = pick([[30, 2], [15, 4], [20, 3], [12, 5], [6, 10]]), w = frac * randi(1, 12), s = w / frac;
    return mk('s = ? km', s, [w * min, w / 2 === s ? w : w / 2, s + w / frac / 2].filter(z => Number.isInteger(z) && z !== s), { sub: `Prędkość ${w} km/h, czas ${min} min`, sol: `${min} min = ${FR(1, frac)} h, więc s = ${w} : ${frac} = ${s} km`, mistake: w * min, how: H('Droga w minutach', `Godzina ma 60 minut. {60 : ${min} = ${frac}}, więc ${min} min to ${FR(1, frac)} godziny.`, `W tym czasie jedzie ${FR(1, frac)} z ${w} km. {${w} : ${frac} = ${s}}`) });
  }, 1.2),
  T('Objętość prostopadłościanu', t => {
    if (t === 1) { const a = randi(2, 10), u = pick(['cm', 'dm']); return mk(`V = ? ${u}³`, a ** 3, [a * a, 6 * a * a, 3 * a], { sub: `Sześcian o krawędzi ${a} ${u}`, sol: `Sześcian o krawędzi ${a} ${u}: V = ${a ** 3} ${u}³`, mistake: a * a, how: H('Objętość sześcianu', 'Objętość to długość razy szerokość razy wysokość. W sześcianie wszystkie są równe.', `{${a} · ${a} · ${a} = ${a ** 3}}`) }); }
    if (t === 2) { const a = randi(2, 6), b = randi(2, 6), c = randi(2, 9); return mk('V = ? cm³', a * b * c, [a * b + c, 2 * (a * b + b * c + a * c), a * b * c + a * b], { sub: `Prostopadłościan ${a} cm × ${b} cm × ${c} cm`, sol: `V = ${a} · ${b} · ${c} = ${a * b * c} cm³`, how: H('Objętość prostopadłościanu', 'Pomnóż trzy wymiary.', `{${a} · ${b} = ${a * b}}`, `{${a * b} · ${c} = ${a * b * c}}`) }); }
    if (t === 3) { const [from, to, k, fact] = pick([['dm³', 'l', 1, '1 dm³ to 1 litr.'], ['l', 'cm³', 1000, '1 litr to 1000 cm³.'], ['l', 'ml', 1000, '1 litr to 1000 ml.'], ['m³', 'dm³', 1000, '1 m³ to 1000 dm³.']]), n = randi(2, 9); return mk(`${n} ${from} = ? ${to}`, n * k, [n * 10, n * 100, n * k * 10].filter(v => v !== n * k), { how: H('Jednostki objętości', fact, `{${n} · ${k} = ${n * k}}`) }); }
    const a = randi(2, 5), b = randi(2, 6), c = randi(2, 9); return mk('c = ? cm', c, [c + 1, a * b * c - a * b, c * 2].filter(v => v !== c), { sub: `Prostopadłościan: V = ${a * b * c} cm³, a = ${a} cm, b = ${b} cm`, sol: `c = ${a * b * c} : (${a} · ${b}) = ${c} cm`, how: H('Brakujący wymiar', `V = a · b · c. Najpierw pole podstawy. {${a} · ${b} = ${a * b}}`, `Podziel objętość przez pole podstawy. {${a * b * c} : ${a * b} = ${c}}`) });
  }, 1.2),
];

/* ============================================================
   KLASA 7: procenty, potęgi, notacja wykładnicza, pierwiastki, wyrażenia, równania, Pitagoras, układ współrzędnych
   ============================================================ */
const pt = (x, y) => `(${N(x)}, ${N(y)})`;
const K7 = [
  T('Procenty', t => {
    if (t === 1) { const p = pick([5, 15, 30, 40, 60, 75]), w = 20 * randi(2, 20), v = w * p / 100; return mk(`${p}% z ${w} = ?`, v, [v + 5, v + 10, v * 2].filter(x => x !== v), { how: H('Procent liczby w pamięci', ...pctSteps(p, w)) }); }
    if (t === 2) { const p = pick([5, 15, 20, 30, 40, 60, 75, 80]), w = 20 * randi(1, 10), part = w * p / 100; return mk(`${part} to ?% liczby ${w}`, `${p}%`, [`${p + 5}%`, `${p + 10}%`, `${Math.max(1, p - 5)}%`].filter(x => x !== `${p}%`), { sol: `${part} to ${p}% liczby ${w}`, how: H('Jaki to procent', `Podziel część przez całość. {${part} : ${w} = ${D(p, 2)}}`, `${D(p, 2)} to ${p} setnych, czyli ${p}%.`) }); }
    if (t === 3) {
      const p = pick([10, 20, 50]), w = 100 * randi(1, 9), x = w * p / 100, up = w + x, y = up * p / 100, v = up - y;
      return mk(`${w} zł, +${p}%, potem ${M}${p}% = ?`, zl(v), [zl(w), zl(w + w * p / 100)], { sub: 'Podwyżka, a potem obniżka', sol: `${w} zł + ${p}% = ${zl(up)}, potem ${M}${p}% = ${zl(v)}`, mistake: zl(w), how: H('Dwie zmiany ceny', `Podwyżka. ${p}% z ${w} to {${w} : 100 · ${p} = ${x}}`, `{${w} + ${x} = ${up}}`, `Obniżkę liczymy od nowej, wyższej ceny. ${p}% z ${up} to {${up} : 100 · ${p} = ${y}}`, `{${up} ${M} ${y} = ${v}}`, 'Dlatego cena nie wraca do początkowej.') });
    }
    const p = pick([10, 20, 25, 50]), k = 100 / p, x = k * randi(2, 20), part = x * p / 100;
    return mk(`${p}% liczby = ${part}`, x, [part * p / 100, x + part, x / 2].filter(v => Number.isInteger(v) && v !== x), { sub: 'Jaka to liczba?', ask: 'liczba', sol: `${p}% liczby ${x} to ${part}`, how: H('Liczba z jej procentu', `${p}% to ${FR(1, k)} liczby. Cała liczba jest ${k} razy większa.`, `{${part} · ${k} = ${x}}`, `Sprawdź. {${p}% z ${x} = ${part}}`) });
  }, 1.2),
  T('Potęgi: działania', t => {
    const b = randi(2, 7), m = randi(2, 6), n = randi(2, 6);
    if (t === 1) return mk(`${b}${sup(m)} · ${b}${sup(n)} = ?`, `${b}${sup(m + n)}`, [`${b * b}${sup(m + n)}`, `${b}${sup(m + n + 1)}`], { mistake: m * n === m + n ? null : `${b}${sup(m * n)}`, how: H('Mnożenie potęg', 'Przy mnożeniu potęg o tej samej podstawie wykładniki dodajemy.', `{${m} + ${n} = ${m + n}}`, `{${b}${sup(m)} · ${b}${sup(n)} = ${b}${sup(m + n)}}`) });
    if (t === 2) { const k = m + n; return mk(`${b}${sup(k)} : ${b}${sup(n)} = ?`, `${b}${sup(m)}`, [`${b}${sup(k + n)}`, `${b}${sup(m + 1)}`], { mistake: Number.isInteger(k / n) && k / n !== m ? `${b}${sup(k / n)}` : null, how: H('Dzielenie potęg', 'Przy dzieleniu potęg o tej samej podstawie wykładniki odejmujemy.', `{${k} ${M} ${n} = ${m}}`, `{${b}${sup(k)} : ${b}${sup(n)} = ${b}${sup(m)}}`) }); }
    if (t === 3) return mk(`(${b}${sup(m)})${sup(n)} = ?`, `${b}${sup(m * n)}`, [`${b}${sup(m * n + 1)}`, `${b}${sup(m * n - 1)}`], { mistake: m + n === m * n ? null : `${b}${sup(m + n)}`, how: H('Potęga potęgi', 'Potęgę podnosimy do potęgi, mnożąc wykładniki.', `{${m} · ${n} = ${m * n}}`, `{(${b}${sup(m)})${sup(n)} = ${b}${sup(m * n)}}`) });
    const r = Math.random();
    if (r < 0.3) { const base = randi(2, 99); return mk(`${base}⁰ = ?`, 1, [0], { how: H('Potęga zero', 'Każda liczba różna od zera podniesiona do potęgi 0 daje 1.', `{${base}⁰ = 1}`) }); }
    if (r < 0.65) { const c = randi(2, 3), e = randi(2, 5), v = (-c) ** e; return mk(`(${M}${c})${sup(e)} = ?`, v, [-v], { how: H('Potęga liczby ujemnej', e % 2 === 0 ? 'Parzysta liczba minusów daje plus.' : 'Nieparzysta liczba minusów daje minus.', `{${Array(e).fill(`(${M}${c})`).join(' · ')} = ${N(v)}}`) }); }
    const [a, c] = pick([[2, 5], [5, 2], [4, 5], [2, 3]]), e = randi(2, 4);
    return mk(`${a}${sup(e)} · ${c}${sup(e)} = ?`, `${a * c}${sup(e)}`, [`${a + c}${sup(e)}`], { mistake: `${a * c}${sup(2 * e)}`, how: H('Iloczyn potęg', 'Gdy wykładniki są równe, mnożymy podstawy, a wykładnik zostaje.', `{${a} · ${c} = ${a * c}}`, `{${a}${sup(e)} · ${c}${sup(e)} = ${a * c}${sup(e)}}`) });
  }),
  T('Notacja wykładnicza', t => {
    if (t === 1) { const a = randi(2, 9), e = randi(3, 6); return mk(`${a} · 10${sup(e)} = ?`, N(a * 10 ** e), [N(a * 10 ** (e + 1)), N(a * 10 ** (e - 1))], { mistake: N(a * 10 * e), how: H('Potęga dziesiątki', `10${sup(e)} to jedynka i ${e} zer. Mnożenie przez nią dopisuje ${e} zer.`, `{${a} · 10${sup(e)} = ${N(a * 10 ** e)}}`) }); }
    if (t === 2) { const k = randi(11, 99), e = randi(3, 6), n = k * 10 ** (e - 1); if (k % 10 === 0) return K7[2].gen(2); return mk(`${N(n)} = ?`, `${D(k, 1)} · 10${sup(e)}`, [`${D(k, 1)} · 10${sup(e - 1)}`, `${D(k, 1)} · 10${sup(e + 1)}`], { sub: 'Zapisz w notacji wykładniczej', sol: `${N(n)} = ${D(k, 1)} · 10${sup(e)}`, how: H('Notacja wykładnicza', `Przesuń przecinek tak, żeby przed nim została jedna cyfra. Wychodzi ${D(k, 1)}.`, `Przecinek przesunięto o ${e} miejsc, więc mnożymy przez 10${sup(e)}.`, `{${N(n)} = ${D(k, 1)} · 10${sup(e)}}`) }); }
    if (t === 3) { const k = randi(11, 99), e = randi(2, 5); return mk(`${D(k, 1)} · 10${sup(e)} = ?`, N(k * 10 ** (e - 1)), [N(k * 10 ** e), N(k * 10 ** (e - 2))], { how: H('Notacja wykładnicza', `Mnożenie przez 10${sup(e)} przesuwa przecinek o ${e} miejsc w prawo.`, `{${D(k, 1)} · 10${sup(e)} = ${N(k * 10 ** (e - 1))}}`) }); }
    const a = randi(2, 4), b = randi(2, Math.floor(9 / a)), e = randi(2, 4), f = randi(2, 4);
    return mk(`(${a} · 10${sup(e)}) · (${b} · 10${sup(f)}) = ?`, `${a * b} · 10${sup(e + f)}`, [`${a + b} · 10${sup(e + f)}`, `${a * b} · 10${sup(e + f + 1)}`], { mistake: e * f === e + f ? null : `${a * b} · 10${sup(e * f)}`, how: H('Mnożenie w notacji wykładniczej', `Pomnóż liczby. {${a} · ${b} = ${a * b}}`, `Pomnóż potęgi dziesiątki, dodając wykładniki. {10${sup(e)} · 10${sup(f)} = 10${sup(e + f)}}`) });
  }, 1.2),
  T('Pierwiastki', t => {
    if (t === 1) { const a = randi(2, 15); return mk(`√${a * a} = ?`, a, [a + 1, a - 1], { mistake: a * a % 2 === 0 ? a * a / 2 : null, how: H('Pierwiastek kwadratowy', `Szukamy liczby, która pomnożona przez siebie daje ${a * a}. To nie jest połowa.`, `{${a} · ${a} = ${a * a}}`, `Więc {√${a * a} = ${a}}`) }); }
    if (t === 2) { const a = randi(2, 6), neg = Math.random() < 0.35; return neg ? mk(`∛(${M}${a ** 3}) = ?`, -a, [a, -a - 1], { mistake: a, how: H('Pierwiastek sześcienny', `Szukamy liczby, która pomnożona przez siebie 3 razy daje ${M}${a ** 3}.`, `{(${M}${a}) · (${M}${a}) · (${M}${a}) = ${M}${a ** 3}}`, `Więc {∛(${M}${a ** 3}) = ${M}${a}}`) }) : mk(`∛${a ** 3} = ?`, a, [a + 1, a - 1, a * a].filter(v => v > 0 && v !== a), { how: H('Pierwiastek sześcienny', `Szukamy liczby, która pomnożona przez siebie 3 razy daje ${a ** 3}.`, `{${a} · ${a} · ${a} = ${a ** 3}}`, `Więc {∛${a ** 3} = ${a}}`) }); }
    if (t === 3) {
      if (Math.random() < 0.5) { let n; do { n = randi(5, 200); } while (Number.isInteger(Math.sqrt(n))); const k = Math.floor(Math.sqrt(n)); return mk(`√${n} jest między ? a ?`, `${k} i ${k + 1}`, [`${k - 1} i ${k}`, `${k + 1} i ${k + 2}`].filter(x => !x.startsWith('0 ')), { sub: 'Między którymi liczbami całkowitymi?', sol: `${k}² = ${k * k} < ${n} < ${(k + 1) ** 2} = ${k + 1}², więc √${n} jest między ${k} a ${k + 1}`, how: H('Szacowanie pierwiastka', `Szukaj kwadratów liczb blisko ${n}.`, `{${k}² = ${k * k}}`, `{${k + 1}² = ${(k + 1) ** 2}}`, `{${k * k} < ${n} < ${(k + 1) ** 2}}`, `Więc √${n} jest między ${k} a ${k + 1}.`) }); }
      const a = randi(2, 5), b = randi(2, 5); return mk(`√(${a * a} · ${b * b}) = ?`, a * b, [a * a + b * b, a + b, a * b + 1].filter(v => v !== a * b), { how: H('Pierwiastek z iloczynu', 'Pierwiastek z iloczynu to iloczyn pierwiastków.', `{√(${a * a} · ${b * b}) = √${a * a} · √${b * b}}`, `{√${a * a} · √${b * b} = ${a} · ${b}}`, `{${a} · ${b} = ${a * b}}`) });
    }
    if (Math.random() < 0.5) { const k = randi(2, 6), r = pick([2, 3, 5]); return mk(`√${k * k * r} = ?`, `${k}√${r}`, [`${r}√${k}`, `${k + 1}√${r}`], { sub: 'Wyłącz czynnik przed pierwiastek', mistake: `${k * k}√${r}`, how: H('Wyłączanie czynnika', `Rozłóż ${k * k * r} tak, żeby jeden czynnik był kwadratem. {${k * k * r} = ${k * k} · ${r}}`, `{√${k * k} = ${k}}`, `Wychodzi przed pierwiastek. {√${k * k * r} = ${k}√${r}}`) }); }
    const [x, y] = pick([[2, 8], [3, 12], [2, 18], [5, 20], [3, 27], [2, 32]]), v = Math.sqrt(x * y);
    return mk(`√${x} · √${y} = ?`, v, [v + 1, x * y], { mistake: Math.sqrt(y / x), how: H('Iloczyn pierwiastków', 'Iloczyn pierwiastków to pierwiastek z iloczynu.', `{√${x} · √${y} = √${x * y}}`, `{√${x * y} = ${v}}`) });
  }),
  T('Wyrażenia algebraiczne', t => {
    if (t === 1) { const a = randi(2, 7), b = randi(1, 6), c = randi(1, a + b - 1); const e = `${a}x + ${term(b, 'x')} ${M} ${term(c, 'x')}`; return mk(`${e} = ?`, term(a + b - c, 'x'), [term(a + b + c, 'x'), term(a + b - c + 1, 'x')], { mistake: term(a + b - c, 'x²'), how: H('Wyrazy podobne', 'Licz liczby przed x, a x zostaje bez zmian. Samo x to 1x.', `{${a} + ${b} ${M} ${c} = ${a + b - c}}`, `{${e} = ${term(a + b - c, 'x')}}`) }); }
    if (t === 2) { const k = randi(2, 7), c = randi(1, 9), neg = Math.random() < 0.4, s = neg ? M : '+'; return mk(`${k}(x ${s} ${c}) = ?`, lin(k, 'x', neg ? -k * c : k * c), [lin(k, 'x', neg ? k * c : -k * c), lin(k + c, 'x', 0)], { mistake: lin(k, 'x', neg ? -c : c), how: H('Mnożenie nawiasu', `Pomnóż ${k} przez każdy wyraz w nawiasie.`, `{${k} · x = ${k}x}`, `{${k} · ${c} = ${k * c}}`, `{${k}(x ${s} ${c}) = ${lin(k, 'x', neg ? -k * c : k * c)}}`) }); }
    if (t === 3) {
      if (Math.random() < 0.5) { const c = randi(1, 9); return mk(`${M}(x ${M} ${c}) = ?`, lin(-1, 'x', c), [lin(1, 'x', c)], { mistake: lin(-1, 'x', -c), how: H('Minus przed nawiasem', 'Minus przed nawiasem zmienia znaki wszystkich wyrazów w nawiasie.', `{${M}(x ${M} ${c}) = ${lin(-1, 'x', c)}}`) }); }
      const k = randi(2, 5), c = randi(1, 6), j = randi(1, k - 1);
      return mk(`${k}(a ${M} ${c}) ${M} ${term(j, 'a')} = ?`, lin(k - j, 'a', -k * c), [lin(k + j, 'a', -k * c), lin(k - j, 'a', k * c)], { mistake: lin(k - j, 'a', -c), how: H('Nawias i wyrazy podobne', `Wymnóż nawias. {${k}(a ${M} ${c}) = ${k}a ${M} ${k * c}}`, `Zbierz wyrazy z a. {${k}a ${M} ${term(j, 'a')} = ${term(k - j, 'a')}}`, `{${k}(a ${M} ${c}) ${M} ${term(j, 'a')} = ${lin(k - j, 'a', -k * c)}}`) });
    }
    const a = randi(1, 6), b = randi(1, 6);
    if (Math.random() < 0.5) return mk(`(x + ${a})(x + ${b}) = ?`, `x² + ${a + b}x + ${a * b}`, [`x² + ${a * b}x + ${a + b}`, `2x + ${a * b}`], { mistake: `x² + ${a * b}`, how: H('Mnożenie sum', 'Pomnóż każdy wyraz pierwszego nawiasu przez każdy wyraz drugiego.', '{x · x = x²}', `{x · ${b} + ${a} · x = ${a + b}x}`, `{${a} · ${b} = ${a * b}}`, `{(x + ${a})(x + ${b}) = x² + ${a + b}x + ${a * b}}`) });
    if (a === b) return K7[4].gen(4);
    const mid = b - a, mx = Math.abs(mid) === 1 ? 'x' : `${Math.abs(mid)}x`, ans = `x² ${mid < 0 ? M : '+'} ${mx} ${M} ${a * b}`;
    return mk(`(x ${M} ${a})(x + ${b}) = ?`, ans, [`x² ${mid < 0 ? '+' : M} ${mx} ${M} ${a * b}`, `x² + ${a + b}x ${M} ${a * b}`], { mistake: `x² ${M} ${a * b}`, how: H('Mnożenie sum', 'Pomnóż każdy wyraz pierwszego nawiasu przez każdy wyraz drugiego.', '{x · x = x²}', `{x · ${b} ${M} ${a} · x = ${lin(mid, 'x', 0)}}`, `{(${M}${a}) · ${b} = ${M}${a * b}}`, `{(x ${M} ${a})(x + ${b}) = ${ans}}`) });
  }, 1.25),
  T('Równania', t => {
    const x = randi(2, 12);
    if (t === 1) { const a = randi(2, 9), b = randi(1, 20); return mk(`${a}x + ${b} = ${a * x + b}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (a * x + 2 * b) % a === 0 ? (a * x + 2 * b) / a : null, how: H('Równanie', `Odejmij ${b} od obu stron. ${a}x = {${a * x + b} ${M} ${b} = ${a * x}}`, `Podziel przez ${a}. x = {${a * x} : ${a} = ${x}}`, `Sprawdź. {${a} · ${x} + ${b} = ${a * x + b}}`) }); }
    if (t === 2) { const a = randi(2, 6), c = randi(1, x - 1); return mk(`${a}(x ${M} ${c}) = ${a * (x - c)}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (a * (x - c) + c) % a === 0 && (a * (x - c) + c) / a !== x ? (a * (x - c) + c) / a : null, how: H('Równanie z nawiasem', `Podziel obie strony przez ${a}. x ${M} ${c} = {${a * (x - c)} : ${a} = ${x - c}}`, `Dodaj ${c}. x = {${x - c} + ${c} = ${x}}`) }); }
    if (t === 3) { const d = randi(2, 6), v = randi(2, 9); return mk(`${FR('x', d)} = ${v}`, d * v, [d * v + d, v], { sub: 'x = ?', ask: 'x', mistake: d + v, how: H('Równanie z ułamkiem', `x podzielone przez ${d} daje ${v}. Pomnóż obie strony przez ${d}.`, `x = {${v} · ${d} = ${d * v}}`, `Sprawdź. {${d * v} : ${d} = ${v}}`) }); }
    if (Math.random() < 0.5) { const [a, b] = pick([[4, 3], [2, 5], [3, 2], [5, 4], [5, 2]]), k = randi(2, 4); return mk(`${FR('x', b * k)} = ${FR(a, b)}`, a * k, [a + k, a * b * k], { sub: 'Proporcja: x = ?', ask: 'x', how: H('Proporcja', `Mianownik ${b * k} jest ${k} razy większy od ${b}, więc licznik też.`, `x = {${a} · ${k} = ${a * k}}`, `Sprawdź. {${FR(a * k, b * k)} = ${FR(a, b)}}`) }); }
    const a = randi(4, 8), c = randi(1, a - 2), b = randi(1, 10), d = (a - c) * x - b; if (d <= 0) return K7[5].gen(4);
    return mk(`${a}x ${M} ${b} = ${term(c, 'x')} + ${d}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (d - b) % (a - c) === 0 && (d - b) / (a - c) > 0 && (d - b) / (a - c) !== x ? (d - b) / (a - c) : null, how: H('Równanie', `Odejmij ${term(c, 'x')} od obu stron. {${a}x ${M} ${term(c, 'x')} = ${term(a - c, 'x')}}`, `Dodaj ${b}. ${term(a - c, 'x')} = {${d} + ${b} = ${d + b}}`, `Podziel przez ${a - c}. x = {${d + b} : ${a - c} = ${x}}`) });
  }, 1.25),
  T('Twierdzenie Pitagorasa', t => {
    const triples = [[3, 4, 5], [6, 8, 10], [9, 12, 15], [12, 16, 20], [15, 20, 25], [18, 24, 30], [5, 12, 13], [10, 24, 26],
      [8, 15, 17], [7, 24, 25], [20, 21, 29], [12, 35, 37], [9, 40, 41], [16, 30, 34], [24, 32, 40], [21, 28, 35]];
    const legs = ([a, b, c]) => (Math.random() < 0.5 ? [a, b, c] : [b, a, c]);
    if (t <= 2) { const [a, b, c] = legs(pick(t === 1 ? triples.slice(0, 8) : triples.slice(6))); return mk('c = ?', c, [c + 1, c - 1], { sub: `Trójkąt prostokątny, przyprostokątne ${a} i ${b}`, sol: `c = √(${a}² + ${b}²) = √${a * a + b * b} = ${c}`, mistake: a + b, how: H('Twierdzenie Pitagorasa', 'Kwadrat przeciwprostokątnej to suma kwadratów przyprostokątnych. Boków nie dodajemy.', `{${a}² + ${b}² = ${a * a} + ${b * b}}`, `{${a * a} + ${b * b} = ${a * a + b * b}}`, `{√${a * a + b * b} = ${c}}`) }); }
    if (t === 3) { const [a, b, c] = legs(pick(triples)); return mk('b = ?', b, [b + 1, b - 1].filter(v => v > 0), { sub: `Przeciwprostokątna ${c}, przyprostokątna ${a}`, sol: `b = √(${c}² − ${a}²) = √${c * c - a * a} = ${b}`, mistake: c - a === b ? null : c - a, how: H('Twierdzenie Pitagorasa', 'Szukamy przyprostokątnej, więc od kwadratu przeciwprostokątnej odejmujemy kwadrat drugiej przyprostokątnej.', `{${c}² ${M} ${a}² = ${c * c} ${M} ${a * a}}`, `{${c * c} ${M} ${a * a} = ${c * c - a * a}}`, `{√${c * c - a * a} = ${b}}`) }); }
    const r = Math.random();
    if (r < 0.35) { const a = randi(2, 9); return mk('d = ?', `${a}√2`, [`${a}√3`, `${2 * a}`, `${a * 2}√2`], { sub: `Przekątna kwadratu o boku ${a}`, sol: `Przekątna kwadratu o boku ${a} = ${a}√2`, mistake: `${a}√3`, how: H('Przekątna kwadratu', 'Przekątna dzieli kwadrat na dwa trójkąty prostokątne.', `{${a}² + ${a}² = ${2 * a * a}}`, `{√${2 * a * a} = ${a}√2}`) }); }
    if (r < 0.65) { const a = 2 * randi(1, 6), h = `${a / 2 === 1 ? '' : a / 2}√3`; return mk('h = ?', h, [`${a}√3`, `${a / 2 === 1 ? '' : a / 2}√2`], { sub: `Wysokość trójkąta równobocznego o boku ${a}`, sol: `h = ${a}√3 : 2 = ${h}`, mistake: `${a}√3`, how: H('Wysokość trójkąta równobocznego', `Wysokość dzieli podstawę na połowy po ${a / 2}.`, `{${a}² ${M} ${a / 2}² = ${a * a - a * a / 4}}`, a === 2 ? 'h = √3' : `{√${a * a - a * a / 4} = ${h}}`) }); }
    const [a, b] = pick([[1, 2], [2, 3], [1, 3], [1, 4], [2, 4], [3, 5]]), s = a * a + b * b, out = simpleRoot(s);
    return mk('c = ?', out, [simpleRoot(s + 1), N(a + b)].filter(x => x !== out), { sub: `Trójkąt prostokątny, przyprostokątne ${a} i ${b}`, sol: `c = √(${a}² + ${b}²) = √${s} = ${out}`, how: H('Twierdzenie Pitagorasa', `{${a}² + ${b}² = ${s}}`, `c = √${s}.`, out !== '√' + s ? `Wyłącz czynnik przed pierwiastek. {√${s} = ${out}}` : 'Tego pierwiastka nie da się uprościć.') });
  }),
  T('Układ współrzędnych', t => {
    if (t === 1) { const y = randi(-5, 8), x1 = randi(-6, 4), x2 = x1 + 2 * randi(1, 5), m = (x1 + x2) / 2; return mk('S = ?', pt(m, y), [pt(m + 1, y), pt(x2 - x1, y), pt(m, y + 1)], { sub: `Środek odcinka A = ${pt(x1, y)}, B = ${pt(x2, y)}`, sol: `Środek odcinka ${pt(x1, y)} – ${pt(x2, y)}: S = ${pt(m, y)}`, how: H('Środek odcinka', 'Współrzędne środka to średnie współrzędnych końców.', `{(${N(x1)} + ${P(x2)}) : 2 = ${N(m)}}`, `Druga współrzędna się nie zmienia, ${N(y)}.`) }); }
    if (t === 2) { const x1 = randi(-6, 6), y1 = randi(-6, 6), dx = 2 * randi(-4, 4), dy = 2 * randi(1, 4), x2 = x1 + dx, y2 = y1 + dy, mx = (x1 + x2) / 2, my = (y1 + y2) / 2; return mk('S = ?', pt(mx, my), [pt(my, mx), pt(dx / 2, dy / 2), pt(mx + 1, my)].filter(s => s !== pt(mx, my)), { sub: `Środek odcinka A = ${pt(x1, y1)}, B = ${pt(x2, y2)}`, sol: `S = (${N(x1)} + ${N(x2)}) : 2, (${N(y1)} + ${N(y2)}) : 2 = ${pt(mx, my)}`, how: H('Środek odcinka', 'Współrzędne środka to średnie współrzędnych końców.', `{(${N(x1)} + ${P(x2)}) : 2 = ${N(mx)}}`, `{(${N(y1)} + ${P(y2)}) : 2 = ${N(my)}}`) }); }
    if (t === 3) { const x = randi(-6, 6), y1 = randi(-6, 2), y2 = randi(y1 + 1, 9); return mk('|AB| = ?', y2 - y1, [Math.abs(y2 + y1), y2 - y1 + 1].filter(v => v !== y2 - y1 && v > 0), { sub: `A = ${pt(x, y1)}, B = ${pt(x, y2)}`, sol: `|AB| = ${N(y2)} − ${P(y1)} = ${y2 - y1}`, mistake: Math.abs(y2 + y1) !== y2 - y1 && y2 + y1 !== 0 ? Math.abs(y2 + y1) : null, how: H('Długość odcinka pionowego', 'Oba punkty mają tę samą pierwszą współrzędną, więc odejmij drugie.', `{${N(y2)} ${M} ${P(y1)} = ${y2 - y1}}`) }); }
    const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]), x1 = randi(-4, 4), y1 = randi(-4, 4), [dx, dy] = swap(a, b);
    return mk('|AB| = ?', c, [a + b, c + 1], { sub: `A = ${pt(x1, y1)}, B = ${pt(x1 + dx, y1 + dy)}`, sol: `|AB| = √(${dx}² + ${dy}²) = ${c}`, mistake: a + b, how: H('Długość odcinka', `Różnica pierwszych współrzędnych to ${dx}, drugich ${dy}. Dalej z twierdzenia Pitagorasa.`, `{${dx}² + ${dy}² = ${c * c}}`, `{√${c * c} = ${c}}`) });
  }, 1.2),
];

/* ============================================================
   KLASA 8: statystyka, prawdopodobieństwo, nierówności, równania, procenty, trójkąty i symetria, bryły, koło
   ============================================================ */
const ineq = (s, b) => `x ${s} ${N(b)}`;
const flip = s => ({ '>': '<', '<': '>', '≥': '≤', '≤': '≥' }[s]);
// a / b (less than 1) as a repeating decimal "0,1(6)", the same without the brackets "0,16", and its first digits "0,1666"
function periodic(a, b) {
  const digits = [], seen = new Map(); let r = a % b;
  while (r && !seen.has(r)) { seen.set(r, digits.length); r *= 10; digits.push(Math.floor(r / b)); r %= b; }
  const st = seen.get(r), pre = digits.slice(0, st).join(''), rep = digits.slice(st).join('');
  const long = (pre + rep.repeat(Math.ceil(6 / rep.length))).slice(0, Math.max(4, pre.length + 2 * rep.length));
  return [`0,${pre}(${rep})`, `0,${pre}${rep}`, `0,${long}`];
}
const pStep = (k, n) => (F(k, n) !== FR(k, n) ? `P = {${FR(k, n)} = ${F(k, n)}}` : `P = ${FR(k, n)}`);
const AXES = { kwadrat: 'Kwadrat ma 4 osie: dwie przez środki przeciwległych boków i dwie po przekątnych.', prostokąt: 'Prostokąt ma 2 osie, przez środki przeciwległych boków. Przekątne nie są osiami.', 'trójkąt równoboczny': 'Trójkąt równoboczny ma 3 osie, po jednej z każdego wierzchołka do środka przeciwległego boku.', romb: 'Romb ma 2 osie, wzdłuż przekątnych.', 'sześciokąt foremny': 'Sześciokąt foremny ma 6 osi: 3 przez wierzchołki i 3 przez środki boków.', 'trójkąt równoramienny': 'Trójkąt równoramienny ma 1 oś, przez wierzchołek między ramionami.', 'pięciokąt foremny': 'Pięciokąt foremny ma 5 osi, z każdego wierzchołka do środka przeciwległego boku.' , 'ośmiokąt foremny': 'Ośmiokąt foremny ma tyle osi, ile boków: przez przeciwległe wierzchołki i przez środki przeciwległych boków.',
  'siedmiokąt foremny': 'Siedmiokąt foremny ma tyle osi, ile boków: każda idzie przez wierzchołek i środek boku naprzeciwko.',
  'dziesięciokąt foremny': 'Dziesięciokąt foremny ma tyle osi, ile boków: przez przeciwległe wierzchołki i przez środki przeciwległych boków.',
  'trapez równoramienny': 'Trapez równoramienny ma jedną oś: przez środki obu podstaw.',
  'trójkąt różnoboczny': 'Trójkąt różnoboczny ma wszystkie boki różne, więc żadna linia nie dzieli go na dwie pasujące połówki.',
  'równoległobok, który nie jest prostokątem ani rombem': 'Taki równoległobok po złożeniu na pół nigdy nie pasuje do siebie, więc nie ma osi symetrii.' };
const K8 = [
  T('Średnia i mediana', t => {
    const n = t === 1 ? 3 : 4;
    if (t <= 2) { let xs, s; do { xs = Array.from({ length: n }, () => randi(1, 12)); s = xs.reduce((a, b) => a + b, 0); } while (s % n); return mk('Średnia = ?', s / n, [s, s / n + 1, s / n - 1].filter(v => v > 0 && v !== s / n), { sub: `Liczby: ${xs.join(', ')}`, sol: `Średnia liczb ${xs.join(', ')} = ${s} : ${n} = ${s / n}`, how: H('Średnia', 'Dodaj wszystkie liczby i podziel przez to, ile ich jest.', `{${xs.join(' + ')} = ${s}}`, `{${s} : ${n} = ${s / n}}`) }); }
    if (t === 3) { const xs = Array.from({ length: 5 }, () => randi(1, 20)), srt = [...xs].sort((a, b) => a - b), med = srt[2]; if (xs[2] === med) return K8[0].gen(3); return mk('Mediana = ?', med, [srt[1], srt[3]].filter(v => v !== med), { sub: `Liczby: ${xs.join(', ')}`, sol: `Po ułożeniu: ${srt.join(', ')}. Mediana = ${med}`, mistake: xs[2], how: H('Mediana', `Najpierw ułóż liczby od najmniejszej. ${srt.join(', ')}.`, `Mediana to liczba w środku, ${med}.`) }); }
    const avg = randi(4, 12), k = randi(3, 5); return mk(`Średnia ${k} liczb = ${avg}`, avg * k, [avg + k, avg * (k - 1), avg * k + avg], { sub: 'Ile wynosi ich suma?', ask: 'Suma', sol: `Suma = ${avg} · ${k} = ${avg * k}`, how: H('Suma ze średniej', 'Średnia to suma podzielona przez liczbę liczb, więc suma to średnia razy liczba liczb.', `{${avg} · ${k} = ${avg * k}}`) });
  }),
  T('Prawdopodobieństwo', t => {
    if (t === 1) {
      const [txt, k, which] = pick([['liczba parzysta', 3, '2, 4, 6'], ['liczba nieparzysta', 3, '1, 3, 5'], ['szóstka', 1, '6'], ['jedynka', 1, '1'], ['liczba większa od 4', 2, '5, 6'],
        ['liczba mniejsza od 3', 2, '1, 2'], ['liczba podzielna przez 3', 2, '3, 6'], ['liczba większa od 2', 4, '3, 4, 5, 6'], ['liczba mniejsza od 5', 4, '1, 2, 3, 4'],
        ['jedynka albo szóstka', 2, '1, 6'], ['liczba większa od 1', 5, '2, 3, 4, 5, 6'], ['liczba pierwsza', 3, '2, 3, 5']]);
      return mk('P = ?', F(k, 6), [F(k, 12), F(6 - k, 6) === F(k, 6) ? F(k + 1, 6) : F(6 - k, 6), FR(1, k + 1)].filter(x => x !== F(k, 6)), { sub: `Rzut kostką: ${txt}`, sol: `Kostka, ${txt}: P = ${F(k, 6)}`, how: H('Prawdopodobieństwo', 'Kostka ma 6 możliwych wyników.', `Pasują ${which}, czyli ${k} z 6.`, pStep(k, 6)) });
    }
    if (t === 2) { const r = randi(1, 6), b = randi(1, 7); return mk('P(czerwona) = ?', F(r, r + b), [F(b, r + b), F(r + 1, r + b + 1)].filter(x => x !== F(r, r + b)), { sub: `W worku są kule: ${r} ${pl(r, 'czerwona', 'czerwone', 'czerwonych')} i ${b} ${pl(b, 'niebieska', 'niebieskie', 'niebieskich')}`, sol: `Czerwone: ${r} z ${r + b} kul, P = ${F(r, r + b)}`, mistake: r < b ? F(r, b) : null, how: H('Prawdopodobieństwo', `Wszystkich kul jest {${r} + ${b} = ${r + b}}`, `Czerwone to ${r} z ${r + b} kul. W mianowniku wszystkie kule, nie tylko niebieskie.`, pStep(r, r + b)) }); }
    if (t === 3) {
      const n = pick([10, 12, 15, 20, 25, 30]), all = Array.from({ length: n }, (_, i) => i + 1), m = randi(Math.ceil(n / 2), n - 2), d = pick([3, 4, 5]);
      const [txt, set] = pick([['liczba parzysta', all.filter(v => v % 2 === 0)], ['liczba nieparzysta', all.filter(v => v % 2)], [`liczba podzielna przez ${d}`, all.filter(v => v % d === 0)],
        [`liczba większa od ${m}`, all.filter(v => v > m)], ['liczba pierwsza', all.filter(v => v > 1 && all.every(q => q < 2 || q >= v || v % q))]]);
      const k = set.length, which = k <= 8 ? set.join(', ') : `${set[0]}, ${set[1]}, ${set[2]}, …, ${set[k - 1]}`, wn = n === 10 ? 20 : 10;
      return mk('P = ?', F(k, n), [F(k + 1, n), k < wn ? F(k, wn) : null, F(n - k, n)].filter(x => x !== F(k, n)), { sub: `Losujemy liczbę od 1 do ${n}: ${txt}`, sol: `${txt}: ${k} z ${n}, P = ${F(k, n)}`, how: H('Prawdopodobieństwo', `Możliwych wyników jest ${n}.`, `Pasują ${which}, czyli ${k} z ${n}.`, pStep(k, n)) });
    }
    const word = pick(['MATEMATYKA', 'KALKULATOR', 'ABRAKADABRA', 'ANANAS', 'LOKOMOTYWA', 'POMARAŃCZA', 'KAKADU', 'PARASOL']), L = word.length, ch = pick([...word]), k = [...word].filter(x => x === ch).length;
    const kinds = new Set(word).size;
    return mk('P = ?', F(k, L), [F(k, L - 1), F(k + 1, L), F(1, kinds)].filter(x => x !== F(k, L)), { sub: `Losujemy literę ze słowa ${word}: litera ${ch}`, sol: `${word} ma ${L} liter, w tym ${k} × ${ch}: P = ${F(k, L)}`, mistake: F(1, kinds) !== F(k, L) ? F(1, kinds) : null, how: H('Prawdopodobieństwo', `${word} ma ${L} liter, liczymy też powtórzenia.`, `Litera ${ch} występuje ${k === 1 ? 'raz' : `${k} razy`}.`, pStep(k, L)) });
  }, 1.1),
  // Turning a formula round to get the wanted quantity (curriculum of classes 7–8): a formula and the letter wanted
  T('Przekształcanie wzorów', t => {
    const div = (w, k) => `Podziel obie strony przez ${k}.`;
    const opts = {
      1: [() => { const w = pick(['a', 'b']), o = w === 'a' ? 'b' : 'a'; return ['P = a · b', w, FR('P', o), [`P · ${o}`, FR(o, 'P'), `P ${M} ${o}`], [div(w, o), `{${w} = ${FR('P', o)}}`]]; },
        () => { const w = pick(['v', 't']), o = w === 'v' ? 't' : 'v'; return ['s = v · t', w, FR('s', o), [`s · ${o}`, FR(o, 's'), `s ${M} ${o}`], [div(w, o), `{${w} = ${FR('s', o)}}`]]; }],
      2: [() => ['v = ' + FR('s', 't'), 's', 'v · t', [FR('v', 't'), FR('t', 'v'), 'v + t'], ['Pomnóż obie strony przez t.', '{s = v · t}']],
        () => ['v = ' + FR('s', 't'), 't', FR('s', 'v'), ['v · s', FR('v', 's'), `s ${M} v`], ['Pomnóż obie strony przez t, a potem podziel przez v.', `{t = ${FR('s', 'v')}}`]],
        () => ['d = ' + FR('m', 'V'), 'm', 'd · V', [FR('d', 'V'), FR('V', 'd'), 'd + V'], ['Pomnóż obie strony przez V.', '{m = d · V}']],
        () => ['d = ' + FR('m', 'V'), 'V', FR('m', 'd'), ['m · d', FR('d', 'm'), `m ${M} d`], ['Pomnóż obie strony przez V, a potem podziel przez d.', `{V = ${FR('m', 'd')}}`]]],
      3: [() => ['V = a · b · h', 'h', FR('V', 'ab'), [`V ${M} ab`, 'V · ab', FR('ab', 'V')], [div('h', 'ab'), `{h = ${FR('V', 'ab')}}`]],
        () => { const w = pick(['a', 'h']), o = w === 'a' ? 'h' : 'a'; return ['P = ' + FR('a · h', 2), w, FR('2P', o), [FR('P', '2' + o), FR('2' + o, 'P'), `2P ${M} ${o}`], ['Pomnóż obie strony przez 2.', '{2P = a · h}', div(w, o), `{${w} = ${FR('2P', o)}}`]]; }],
      4: [() => { const k = randi(2, 5), c = randi(1, 9); return [`y = ${k}x + ${c}`, 'x', FR(`y ${M} ${c}`, k), [`${FR('y', k)} ${M} ${c}`, FR(`y + ${c}`, k), `y ${M} ${c}`], [`Odejmij ${c} od obu stron. {y ${M} ${c} = ${k}x}`, div('x', k), `{x = ${FR(`y ${M} ${c}`, k)}}`]]; },
        () => ['L = 2πr', 'r', FR('L', '2π'), [FR('2π', 'L'), `L ${M} 2π`, 'L · 2π'], [div('r', '2π'), `{r = ${FR('L', '2π')}}`]]],
    };
    const [f, w, a, wrongs, steps] = pick(opts[t])();
    return mk(f, a, wrongs, { sub: `${w} = ?`, sol: `${f}, więc ${w} = ${a}`, how: H('Przekształcanie wzoru', `Chcesz mieć samo ${w} po jednej stronie wzoru.`, ...steps) });
  }, 1.3),
  T('Równania i proporcje', t => {
    const x = randi(2, 12);
    if (t === 1) { const d = randi(2, 5), b = randi(1, 9); return mk(`${FR('x', d)} + ${b} = ${x + b}`, d * x, [d * x + b, d * (x + b)], { sub: 'x = ?', ask: 'x', mistake: x, how: H('Równanie z ułamkiem', `Odejmij ${b} od obu stron. ${FR('x', d)} = {${x + b} ${M} ${b} = ${x}}`, `Pomnóż obie strony przez ${d}. x = {${x} · ${d} = ${d * x}}`) }); }
    if (t === 2) { const a = randi(2, 5), c = randi(1, 6), v = a * (x + c) - x; if (a * c === x) return K8[3].gen(2);   // the hint shows a·c; it must not look like the answer
      return mk(`${a}(x + ${c}) ${M} x = ${v}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (v - c) % (a - 1) === 0 && (v - c) / (a - 1) > 0 && (v - c) / (a - 1) !== x ? (v - c) / (a - 1) : null, how: H('Równanie z nawiasem', `Wymnóż nawias. {${a}(x + ${c}) = ${a}x + ${a * c}}`, `Zbierz wyrazy z x. {${a}x ${M} x = ${term(a - 1, 'x')}}`, `Odejmij ${a * c}. ${term(a - 1, 'x')} = {${v} ${M} ${a * c} = ${v - a * c}}`, a > 2 ? `Podziel przez ${a - 1}. x = {${v - a * c} : ${a - 1} = ${x}}` : null) }); }
    if (t === 3) { const [a, b] = pick([[3, 4], [2, 3], [5, 2], [4, 5], [3, 2]]), k = randi(2, 5); return mk(`${FR(a, 'x')} = ${FR(a * k, b * k)}`, b, [b * k, a * k, b + 1].filter(v => v !== b), { sub: 'Proporcja: x = ?', ask: 'x', how: H('Proporcja', `Skróć prawą stronę przez ${k}. {${FR(a * k, b * k)} = ${FR(a, b)}}`, `Liczniki są równe, więc mianowniki też. x = ${b}.`) }); }
    const d = pick([2, 3, 4]), c = randi(1, 5), v = randi(2, 8), xx = d * v - c;
    return mk(`${FR(`x + ${c}`, d)} = ${v}`, xx, [d * v, xx + 1, xx - 1], { sub: 'x = ?', ask: 'x', mistake: d * v + c, how: H('Równanie z ułamkiem', `Pomnóż obie strony przez ${d}. x + ${c} = {${v} · ${d} = ${d * v}}`, `Odejmij ${c}. x = {${d * v} ${M} ${c} = ${N(xx)}}`) });
  }, 1.3),
  T('Procenty w praktyce', t => {
    if (t === 1) { const w = 100 * randi(1, 20), v = w * 123 / 100, ten = w / 10, one = w / 100; return mk(`${w} zł + 23% VAT = ?`, zl(v), [zl(w * 12 / 10), zl(w * 132 / 100)], { sub: 'Cena z podatkiem VAT', sol: `${w} zł + 23% VAT = ${zl(v)}`, mistake: zl(w + 23), how: H('VAT w pamięci', `10% z ${w} to {${w} : 10 = ${ten}}, więc 20% to {2 · ${ten} = ${2 * ten}}`, `1% to {${w} : 100 = ${one}}, więc 3% to {3 · ${one} = ${3 * one}}`, `23% to {${2 * ten} + ${3 * one} = ${23 * one}}`, `Cena z VAT. {${w} + ${23 * one} = ${v}}`) }); }
    if (t === 2) { const k = pick([1000, 2000, 5000]), p = pick([2, 4, 5, 6]), one = k / 100, v = k + one * p; return mk(`${N(k)} zł, ${p}% na rok`, zl(v), [zl(k + k * p / 10), zl(k + 2 * k * p / 100)], { sub: 'Lokata w banku: ile będzie po roku?', sol: `${N(k)} zł + ${p}% = ${zl(v)}`, mistake: zl(k + p), how: H('Odsetki', `1% z ${N(k)} to {${N(k)} : 100 = ${one}}`, `${p}% to {${p} · ${one} = ${p * one}}`, `Po roku. {${N(k)} + ${p * one} = ${N(v)}}`) }); }
    if (t === 3) {
      const a = 20 * randi(1, 15), pc = pick([10, 20, 25, 50, -10, -20, -25, -50]), b = a + a * pc / 100;
      if (!Number.isInteger(b) || b === a) return K8[4].gen(3);
      const p = Math.round((b - a) / a * 100), q = Math.round((b - a) / b * 100), ch = Math.abs(b - a);
      const sg = p > 0 ? '+' : M; return mk(`${a} zł → ${b} zł`, `${sg}${Math.abs(p)}%`, [`${sg}${ch}%`, `${sg}${Math.abs(p) + 5}%`, `${sg}${2 * Math.abs(p)}%`].filter(x => x !== `${sg}${Math.abs(p)}%`), { sub: 'O ile procent zmieniła się cena?', sol: `${a} zł → ${b} zł: ${p > 0 ? 'wzrost' : 'spadek'} o ${Math.abs(p)}%`, mistake: q !== p ? `${p > 0 ? '+' : M}${Math.abs(q)}%` : null, how: H('Zmiana procentowa', `Cena zmieniła się o ${ch} zł. {${Math.max(a, b)} ${M} ${Math.min(a, b)} = ${ch}}`, `Procent liczymy od starej ceny, ${a} zł. {${FR(ch, a)} = ${F(ch, a)}}`, `{${F(ch, a)} = ${FR(Math.abs(p), 100)}}`, `To ${p > 0 ? 'wzrost' : 'spadek'} o ${Math.abs(p)}%.`) });
    }
    const p = pick([10, 20, 25, 50]), before = 20 * randi(2, 20), after = before - before * p / 100, naive = after * p / 100, times = (100 - p) / p, chunk = after / times;
    return mk(`Po obniżce o ${p}%: ${zl(after)}`, zl(before), [zl(after + p), zl(before + 10)], { sub: 'Ile kosztowało przed obniżką?', sol: `Przed obniżką ${zl(before)}, bo ${zl(before)} − ${p}% = ${zl(after)}`, mistake: Number.isInteger(naive) && after + naive !== before ? zl(after + naive) : null, how: H('Cena przed obniżką', `Po obniżce zostało ${100 - p}% ceny, czyli ${times === 1 ? `tyle samo co ${p}%` : `${times} razy po ${p}%`}.`, times > 1 ? `Więc ${p}% to {${after} : ${times} = ${chunk}}` : `Więc ${p}% to ${after} zł.`, `Cała cena to 100%. {${after} + ${chunk} = ${before}}`, `Uwaga, nie liczymy ${p}% od ceny po obniżce.`) });
  }, 1.3),
  T('Trójkąty i symetria', t => {
    if (t <= 2) {
      const a = randi(2, 9), b = randi(2, 9), ok = Math.random() < 0.5, lo = Math.abs(a - b) + 1, hi = a + b - 1;
      const c = ok ? randi(lo, hi) : (Math.random() < 0.5 || lo <= 1 ? a + b + randi(0, 3) : randi(1, Math.abs(a - b)));
      if (c < 1) return K8[5].gen(t);
      const yes = a + b > c && a + c > b && b + c > a, sides = [a, b, c].sort((x, y) => x - y), sum = sides[0] + sides[1];
      return mk(`Czy z odcinków ${a}, ${b} i ${c} zbudujesz trójkąt?`, yes ? 'tak' : 'nie', [yes ? 'nie' : 'tak'], { sol: `${a}, ${b}, ${c}: ${yes ? 'tak' : 'nie'}, bo ${yes ? 'każdy bok jest krótszy od sumy dwóch pozostałych' : 'jeden bok nie jest krótszy od sumy dwóch pozostałych'}`, how: H('Nierówność trójkąta', 'Najdłuższy odcinek musi być krótszy od sumy dwóch pozostałych.', `{${sides[0]} + ${sides[1]} = ${sum}}`, yes ? `{${sum} > ${sides[2]}}, więc trójkąt da się zbudować.` : `{${sum} ≤ ${sides[2]}}, więc trójkąta nie da się zbudować.`) });
    }
    if (t === 3) { const [f, k] = pick([['kwadrat', 4], ['prostokąt', 2], ['trójkąt równoboczny', 3], ['romb', 2], ['sześciokąt foremny', 6], ['trójkąt równoramienny', 1], ['pięciokąt foremny', 5],
      ['ośmiokąt foremny', 8], ['trapez równoramienny', 1], ['siedmiokąt foremny', 7], ['dziesięciokąt foremny', 10], ['trójkąt różnoboczny', 0], ['równoległobok, który nie jest prostokątem ani rombem', 0]]); return mk('Liczba osi symetrii = ?', k, [k + 1, k * 2, k - 1].filter(v => v >= 0 && v !== k), { sub: `Ile osi symetrii ma ${f}?`, sol: k ? `${f[0].toUpperCase() + f.slice(1)} ma ${k} ${k === 1 ? 'oś' : k < 5 ? 'osie' : 'osi'} symetrii` : `${f[0].toUpperCase() + f.slice(1)} nie ma żadnej osi symetrii`, how: H('Osie symetrii', 'Oś symetrii dzieli figurę na dwie części, które pasują do siebie jak w lustrze.', AXES[f]) }); }
    let x = randi(-7, 7), y = randi(-7, 7); if (!x) x = 3; if (!y) y = -2;
    const [txt, sx, sy, rule] = pick([['osi x', x, -y, 'Względem osi x pierwsza współrzędna zostaje, a druga zmienia znak.'], ['osi y', -x, y, 'Względem osi y pierwsza współrzędna zmienia znak, a druga zostaje.'], ['punktu (0, 0)', -x, -y, 'Względem punktu (0, 0) obie współrzędne zmieniają znak.']]);
    return mk('A′ = ?', pt(sx, sy), [pt(-sx, -sy), pt(y, x), pt(sx === x ? -x : x, sy === y ? -y : y)].filter(s => s !== pt(sx, sy)), { sub: `Punkt symetryczny do A = ${pt(x, y)} względem ${txt}`, sol: `Względem ${txt}: A = ${pt(x, y)} → A′ = ${pt(sx, sy)}`, how: H('Symetria punktu', rule, `A = ${pt(x, y)} → A′ = ${pt(sx, sy)}.`) });
  }, 1.2),
  T('Graniastosłupy i ostrosłupy', t => {
    if (t === 1) { const pp = randi(3, 20), h = randi(2, 9); return mk('V = ? cm³', pp * h, [pp + h, pp * h * 2], { sub: `Graniastosłup: pole podstawy ${pp} cm², wysokość ${h} cm`, sol: `V = ${pp} · ${h} = ${pp * h} cm³`, mistake: Number.isInteger(pp * h / 3) ? pp * h / 3 : null, how: H('Objętość graniastosłupa', 'Objętość graniastosłupa to pole podstawy razy wysokość.', `{${pp} · ${h} = ${pp * h}}`) }); }
    if (t === 2) { const a = randi(2, 8), h = randi(2, 10); return mk('V = ? cm³', a * a * h, [a * h, 4 * a * h, a * a + h], { sub: `Graniastosłup prawidłowy czworokątny: krawędź podstawy ${a} cm, wysokość ${h} cm`, sol: `V = ${a}² · ${h} = ${a * a * h} cm³`, how: H('Objętość graniastosłupa', `Podstawa to kwadrat. Jego pole {${a} · ${a} = ${a * a}}`, `Razy wysokość. {${a * a} · ${h} = ${a * a * h}}`) }); }
    if (t === 3) { const pp = 3 * randi(2, 10), h = randi(2, 9); return mk('V = ? cm³', pp * h / 3, [pp * h, pp * h / 3 + h], { sub: `Ostrosłup: pole podstawy ${pp} cm², wysokość ${h} cm`, sol: `V = ${FR(1, 3)} · ${pp} · ${h} = ${pp * h / 3} cm³`, mistake: pp * h, how: H('Objętość ostrosłupa', `Objętość ostrosłupa to ${FR(1, 3)} pola podstawy razy wysokość.`, `{${pp} · ${h} = ${pp * h}}`, `{${pp * h} : 3 = ${pp * h / 3}}`) }); }
    const a = 3 * randi(1, 4), h = randi(2, 9); return mk('V = ? cm³', a * a * h / 3, [a * a * h, a * h], { sub: `Ostrosłup prawidłowy czworokątny: krawędź podstawy ${a} cm, wysokość ${h} cm`, sol: `V = ${FR(1, 3)} · ${a}² · ${h} = ${a * a * h / 3} cm³`, mistake: a * a * h, how: H('Objętość ostrosłupa', `Podstawa to kwadrat. Jego pole {${a} · ${a} = ${a * a}}`, `{${a * a} · ${h} = ${a * a * h}}`, `Ostrosłup ma ${FR(1, 3)} tej objętości. {${a * a * h} : 3 = ${a * a * h / 3}}`) });
  }, 1.3),
  T('Koło i okrąg', t => {
    const r = randi(2, 15);
    if (t === 1) return mk('P = ?', `${r * r}π`, [`${r}π`, `${r * r * 2}π`], { sub: `Pole koła o promieniu ${r}`, sol: `P = π · ${r}² = ${r * r}π`, mistake: `${2 * r}π`, how: H('Pole koła', 'Pole koła to π razy promień razy promień.', `{${r} · ${r} = ${r * r}}`, `P = ${r * r}π.`) });
    if (t === 2) return mk('Obwód = ?', `${2 * r}π`, [`${r}π`, `${4 * r}π`], { sub: `Obwód okręgu o promieniu ${r}`, sol: `Obwód = 2π · ${r} = ${2 * r}π`, mistake: `${r * r}π`, how: H('Obwód okręgu', 'Obwód okręgu to 2 razy π razy promień.', `{2 · ${r} = ${2 * r}}`, `Obwód = ${2 * r}π.`) });
    if (t === 3) { const d = 2 * r; return mk('P = ?', `${r * r}π`, [`${d}π`, `${r}π`], { sub: `Pole koła o średnicy ${d}`, sol: `Średnica ${d}, więc promień ${r}: P = ${r * r}π`, mistake: `${d * d}π`, how: H('Pole koła ze średnicy', `Promień to połowa średnicy. {${d} : 2 = ${r}}`, `{${r} · ${r} = ${r * r}}`, `P = ${r * r}π.`) }); }
    return Math.random() < 0.5
      ? mk('r = ?', r, [2 * r, r * r, r + 1].filter(v => v !== r), { sub: `Obwód okręgu = ${2 * r}π`, sol: `2πr = ${2 * r}π, więc r = ${r}`, how: H('Promień z obwodu', `Obwód to 2πr, więc 2r = ${2 * r}.`, `r = {${2 * r} : 2 = ${r}}`) })
      : mk('r = ?', r, [r * r, 2 * r, r + 1].filter(v => v !== r), { sub: `Pole koła = ${r * r}π`, sol: `πr² = ${r * r}π, więc r = ${r}`, how: H('Promień z pola', `Pole to πr², więc r · r = ${r * r}.`, `r = {√${r * r} = ${r}}`) });
  }, 1.2),
];

const KLASY = [
  { nr: 1, opis: 'Liczby do 20, porównywanie, pieniądze', tematy: K1 },
  { nr: 2, opis: 'Liczby do 100, mnożenie i dzielenie do 30', tematy: K2 },
  { nr: 3, opis: 'Tabliczka mnożenia, liczby do 1000, jednostki', tematy: K3 },
  { nr: 4, opis: 'Działania pisemne, kwadraty, pierwsze ułamki', tematy: K4 },
  { nr: 5, opis: 'Potęgi, podzielność, ułamki, kąty i pola', tematy: K5 },
  { nr: 6, opis: 'Liczby całkowite, procenty, wyrażenia, równania', tematy: K6 },
  { nr: 7, opis: 'Potęgi, pierwiastki, wyrażenia, Pitagoras', tematy: K7 },
  { nr: 8, opis: 'Statystyka, prawdopodobieństwo, bryły, koło', tematy: K8 },
];

// Every problem remembers how to make more of its kind (for the practice after a mistake)
// In 1st and 2nd class (numbers up to 20 and up to 100) a wrong answer above that range would give the right one away
const RANGE = [20, 100];
function fit(p, c) {
  const L = RANGE[c], int = x => (/^\d+( zł)?$/.test(x) ? parseInt(x, 10) : null);
  const a = int(p.a), w = int(p.w);
  if (!L || a === null || w === null || a > L || w <= L) return p;
  const unit = / zł$/.test(p.a) ? ' zł' : '', alt = [a + 1, a - 1, a + 2, a - 2, a + 10, a - 10].filter(v => v >= 0 && v <= L && v !== a);
  p.w = pick(alt) + unit;
  return p;
}
const make = (tm, t, c) => { const p = fit(tm.gen(t), c); p.again = () => fit(tm.gen(t), c); return p; };
// Stage s (0–39) of class c: 8 topics × (4 levels + a review); stage 40 is the test of the whole class
function stage(c, s) {
  const K = KLASY[c], b = Math.floor(s / 5), pos = s % 5;
  if (pos < 4) { const tm = K.tematy[b]; return { name: tm.nazwa, tier: pos + 1, review: false, final: false, gen: () => make(tm, pos + 1, c), time: tm.czas }; }
  const final = s === 39, pool = K.tematy.slice(0, final ? K.tematy.length : b + 1);
  const gen = () => { const i = final ? randi(0, pool.length - 1) : (Math.random() < 0.4 ? b : randi(0, b)); return make(pool[i], randi(2, 4), c); };
  return { name: final ? `Sprawdzian: level ${c + 1}` : 'Powtórka', tier: 4, review: true, final, gen, time: Math.max(...pool.map(tm => tm.czas)) };
}
// Two practice problems of the same kind as p (same way of calculating, if possible)
function practice(p, n = 2) {
  const out = [], key = x => [x.q, x.sub, x.a].join('|');
  for (let tries = 0; out.length < n && tries < 80; tries++) {
    const q = p.again ? p.again() : null;
    if (!q) break;
    const same = !p.how || !q.how || q.how.t === p.how.t;
    if (key(q) !== key(p) && !out.some(o => key(o) === key(q)) && (same || tries > 60)) out.push(q);
  }
  return out;
}

// A hint instead of the solution: the same way of calculating, but the last result is left for the pupil.
// Results equal to the answer become "?", sentences that say the answer and the checking steps are left out.
const flat = x => String(x).replace(/(\d)\[/g, '$1 [').replace(/\[([^\/\]]+)\/([^\]]+)\]/g, '$1/$2');
const core = x => flat(x).trim().replace(/\s*(zł|gr|cm²|cm³|dm³|m²|cm|dm|mm|km\/h|km|kg|dag|ml|g|l|h|min|s|°|%)\.?$/, '').trim();
function hint(p) {
  if (!p.how) return null;
  const a = core(p.a), esc = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tok = a ? new RegExp(`(^|[^0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż,/])${esc}(?![0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż/]|,\\d)`, 'g') : null;
  const has = x => { if (!tok) return false; tok.lastIndex = 0; return tok.test(x); };
  let hid = false;
  let st = p.how.s.filter(x => !/^Sprawdź/.test(x)).map(x => x.replace(/\{([^}]*)\}/g, (m, c) => {
    const i = c.lastIndexOf('=');
    if (i >= 0 && core(c.slice(i + 1)) === a) { hid = true; return `{${c.slice(0, i + 1)} ?}`; }
    if (!/\d/.test(a) && has(flat(c))) { hid = true; return '{' + flat(c).replace(tok, (t, pre) => pre + '?') + '}'; }   // a sign like < or > as the answer
    return m;
  }));
  // a sentence that ends with the answer is the conclusion: it goes (the answer elsewhere in a sentence is just a number in the task)
  const ends = x => { const raw = flat(x.replace(/\{[^}]*\}/g, ' ')).trim(); if (raw.endsWith('?')) return false;   // a question to think about, not the answer
    const t = raw.replace(/[\s.,!:;]+$/, ''); return has(t) && core(core(t).split(/[\s,(]+/).pop()) === a; };
  const kept = st.filter(x => { if (ends(x)) { hid = true; return false; } return true; });
  if (!kept.length && st.length) {             // only conclusions: the first one, with its last mention of the answer hidden
    const x = flat(st[0]); let at = -1, len = 0; tok.lastIndex = 0;
    for (let m; (m = tok.exec(x));) { at = m.index + m[1].length; len = m[0].length - m[1].length; if (!m[0].length) tok.lastIndex++; }
    kept.push(at < 0 ? x : x.slice(0, at) + '?' + x.slice(at + len));
  }
  // the answer said in the middle of a sentence ("Kwadrat ma 4 osie: …") becomes "?", unless that number is also in the task itself
  const inTask = has(flat(`${p.q} ${p.sub || ''}`));
  const out = inTask ? kept : kept.map(x => x.split(/(\{[^}]*\})/).map(part => part[0] === '{' ? part : flat(part).replace(tok, (t, pre) => pre + '?')).join(''));
  return { t: p.how.t, s: out.length ? out : ['Policz to krok po kroku.'] };
}

globalThis.Zadania = { KLASY, stage, practice, hint, _test: { roman, simpleRoot, nice } };
})();
