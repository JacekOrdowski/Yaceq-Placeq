// Yaceq Survival: ikony rysowane w kodzie (pasek u góry, dymki klientów, pola budowy).
// Każda ikona rysuje się w kwadracie o środku (cx, cy) i boku s.

function ell(c, x, y, rx, ry, rot, fill) {
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}
function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function poly(c, pts, fill) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); c.closePath();
  c.fillStyle = fill; c.fill();
}

function jagoda(c, x, y, s, rot) {
  // podłużna jagoda kamczacka: granatowa z sinym nalotem
  const g = c.createLinearGradient(x - s, y - s, x + s, y + s);
  g.addColorStop(0, '#6f80dd'); g.addColorStop(1, '#25307d');
  ell(c, x, y, s * 0.42, s, rot, g);
  ell(c, x - s * 0.12, y - s * 0.35, s * 0.12, s * 0.3, rot, 'rgba(255,255,255,0.45)');
}

const RYS = {
  jagody(c, s) {
    poly(c, [[-0.05 * s, -0.42 * s], [0.38 * s, -0.5 * s], [0.12 * s, -0.22 * s]], '#3f9b4f');
    jagoda(c, -0.2 * s, 0.05 * s, 0.3 * s, -0.5);
    jagoda(c, 0.2 * s, 0.08 * s, 0.3 * s, 0.45);
    jagoda(c, 0, -0.08 * s, 0.32 * s, 0);
  },
  dzem(c, s) {
    rr(c, -0.32 * s, -0.22 * s, 0.64 * s, 0.68 * s, 0.12 * s); c.fillStyle = '#5b2077'; c.fill();
    rr(c, -0.32 * s, -0.22 * s, 0.64 * s, 0.68 * s, 0.12 * s); c.lineWidth = s * 0.05; c.strokeStyle = '#e9d8f5'; c.stroke();
    rr(c, -0.2 * s, 0.02 * s, 0.4 * s, 0.22 * s, 0.04 * s); c.fillStyle = '#fff6e6'; c.fill();
    ell(c, 0, 0.13 * s, 0.07 * s, 0.07 * s, 0, '#3446b8');
    rr(c, -0.38 * s, -0.42 * s, 0.76 * s, 0.22 * s, 0.06 * s); c.fillStyle = '#e0413a'; c.fill();
    for (let i = -2; i <= 2; i++) ell(c, i * 0.14 * s, -0.31 * s, 0.035 * s, 0.035 * s, 0, '#fff');
  },
  ryba(c, s, kol = '#6fa8d6', ciemny = '#3f78a8') {
    poly(c, [[0.28 * s, 0], [0.48 * s, -0.22 * s], [0.48 * s, 0.22 * s]], ciemny);
    ell(c, -0.04 * s, 0, 0.36 * s, 0.2 * s, 0, kol);
    poly(c, [[-0.05 * s, -0.16 * s], [0.12 * s, -0.3 * s], [0.14 * s, -0.12 * s]], ciemny);
    ell(c, -0.24 * s, -0.04 * s, 0.045 * s, 0.045 * s, 0, '#fff');
    ell(c, -0.24 * s, -0.04 * s, 0.022 * s, 0.022 * s, 0, '#123');
  },
  wedzona(c, s) {
    RYS.ryba(c, s, '#d48a3c', '#8f4f1c');
    c.strokeStyle = 'rgba(120,60,20,0.6)'; c.lineWidth = s * 0.035;
    for (const x of [-0.1, 0.02, 0.14]) { c.beginPath(); c.moveTo(x * s, -0.15 * s); c.lineTo((x - 0.05) * s, 0.15 * s); c.stroke(); }
  },
  ruda(c, s) {
    poly(c, [[-0.4 * s, 0.25 * s], [-0.3 * s, -0.2 * s], [0, -0.38 * s], [0.34 * s, -0.18 * s], [0.42 * s, 0.22 * s], [0.05 * s, 0.38 * s]], '#868d99');
    poly(c, [[-0.3 * s, -0.2 * s], [0, -0.38 * s], [0.34 * s, -0.18 * s], [0.02 * s, -0.05 * s]], '#a7aeb9');
    for (const [x, y] of [[-0.15, 0.1], [0.12, 0.15], [0.2, -0.12], [-0.05, -0.2]]) {
      poly(c, [[x * s, (y - 0.07) * s], [(x + 0.07) * s, y * s], [x * s, (y + 0.07) * s], [(x - 0.07) * s, y * s]], '#ffcc33');
    }
  },
  zloto(c, s) {
    poly(c, [[-0.44 * s, 0.24 * s], [-0.28 * s, -0.16 * s], [0.28 * s, -0.16 * s], [0.44 * s, 0.24 * s]], '#f2b51f');
    poly(c, [[-0.28 * s, -0.16 * s], [0.28 * s, -0.16 * s], [0.2 * s, 0.02 * s], [-0.2 * s, 0.02 * s]], '#ffe27a');
    poly(c, [[-0.2 * s, 0.02 * s], [0.2 * s, 0.02 * s], [0.44 * s, 0.24 * s], [-0.44 * s, 0.24 * s]], '#e2a114');
  },
  wegiel(c, s) {
    poly(c, [[-0.38 * s, 0.2 * s], [-0.26 * s, -0.24 * s], [0.1 * s, -0.36 * s], [0.38 * s, -0.08 * s], [0.3 * s, 0.3 * s], [-0.08 * s, 0.36 * s]], '#26272d');
    poly(c, [[-0.26 * s, -0.24 * s], [0.1 * s, -0.36 * s], [0.04 * s, -0.04 * s]], '#4a4c56');
    poly(c, [[0.1 * s, -0.36 * s], [0.38 * s, -0.08 * s], [0.04 * s, -0.04 * s]], '#3a3c45');
  },
  krysztal(c, s) {
    poly(c, [[0, -0.46 * s], [0.3 * s, -0.08 * s], [0, 0.46 * s], [-0.3 * s, -0.08 * s]], '#5fd8f5');
    poly(c, [[0, -0.46 * s], [0.3 * s, -0.08 * s], [0, 0.02 * s]], '#c9f6ff');
    poly(c, [[0, -0.46 * s], [-0.3 * s, -0.08 * s], [0, 0.02 * s]], '#94ecff');
  },
  drewno(c, s) {
    rr(c, -0.42 * s, -0.17 * s, 0.7 * s, 0.34 * s, 0.1 * s); c.fillStyle = '#9a6236'; c.fill();
    c.strokeStyle = '#7a4520'; c.lineWidth = s * 0.03;
    for (const y of [-0.06, 0.06]) { c.beginPath(); c.moveTo(-0.38 * s, y * s); c.lineTo(0.2 * s, y * s); c.stroke(); }
    ell(c, 0.28 * s, 0, 0.17 * s, 0.17 * s, 0, '#e3b47c');
    c.beginPath(); c.arc(0.28 * s, 0, 0.1 * s, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(0.28 * s, 0, 0.04 * s, 0, Math.PI * 2); c.stroke();
  },
  kamien(c, s) {
    poly(c, [[-0.4 * s, 0.28 * s], [-0.4 * s, -0.08 * s], [-0.18 * s, -0.3 * s], [0.38 * s, -0.3 * s], [0.38 * s, 0.1 * s], [0.18 * s, 0.28 * s]], '#a3a9b3');
    poly(c, [[-0.4 * s, -0.08 * s], [-0.18 * s, -0.3 * s], [0.38 * s, -0.3 * s], [0.16 * s, -0.08 * s]], '#c9ced6');
    poly(c, [[0.16 * s, -0.08 * s], [0.38 * s, -0.3 * s], [0.38 * s, 0.1 * s], [0.16 * s, 0.28 * s]], '#868d98');
  },
  kasa(c, s) {
    rr(c, -0.46 * s, -0.26 * s, 0.92 * s, 0.52 * s, 0.07 * s); c.fillStyle = '#2f9b45'; c.fill();
    rr(c, -0.38 * s, -0.18 * s, 0.76 * s, 0.36 * s, 0.05 * s); c.lineWidth = s * 0.04; c.strokeStyle = '#8fe09c'; c.stroke();
    ell(c, 0, 0, 0.13 * s, 0.13 * s, 0, '#8fe09c');
    c.fillStyle = '#1f6e30'; c.font = `900 ${0.16 * s}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('zł', 0, 0.01 * s);
  },
  krysztalek(c, s) { // waluta stała (płatek śniegu)
    c.strokeStyle = '#7fe3ff'; c.lineWidth = s * 0.09; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3;
      c.beginPath(); c.moveTo(Math.cos(a) * -0.42 * s, Math.sin(a) * -0.42 * s); c.lineTo(Math.cos(a) * 0.42 * s, Math.sin(a) * 0.42 * s); c.stroke();
    }
    ell(c, 0, 0, 0.12 * s, 0.12 * s, 0, '#e8fbff');
  },
  gwiazdka(c, s, kol = '#ffd24a') {
    const p = [];
    for (let i = 0; i < 10; i++) { const r = (i % 2 ? 0.2 : 0.46) * s, a = -Math.PI / 2 + i * Math.PI / 5; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    poly(c, p, kol);
  },
};

export function rysujIkone(c, typ, cx, cy, s) {
  const f = RYS[typ]; if (!f) return;
  c.save(); c.translate(cx, cy); f(c, s); c.restore();
}

const pamiec = {};
export function ikonaURL(typ, px = 64) {
  const k = typ + px; if (pamiec[k]) return pamiec[k];
  const cv = document.createElement('canvas'); cv.width = cv.height = px;
  rysujIkone(cv.getContext('2d'), typ, px / 2, px / 2, px * 0.92);
  return (pamiec[k] = cv.toDataURL());
}
export function maIkone(typ) { return !!RYS[typ]; }
