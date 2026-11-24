// Age of Polan: portrety bogów (rysowane w SVG, nasze własne): popiersie z twarzą, włosy, broda, szaty
// i znaki boga (piorun, słońce, młot, kłosy, wieniec, róg...) na tle w kolorach jego żywiołu.
// portret(id) zwraca tekst <svg> do wstawienia na stronę.

const SKORA = '#f0c9a4', SKORA_C = '#d9a47c';
let nr = 0;

function oko(x, y, kolor = '#3b5a7a', blysk = false) {
  return `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.6" fill="#fffaf2"/><circle cx="${x}" cy="${y + 0.4}" r="3.6" fill="${kolor}"/>` +
    `<circle cx="${x}" cy="${y + 0.4}" r="1.7" fill="#1a1a22"/><circle cx="${x + 1.2}" cy="${y - 0.8}" r="0.9" fill="#fff"/>` +
    (blysk ? `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="${kolor}" opacity="0.25"/>` : '');
}
// twarz (środek x, y): owal, uszy, oczy, brwi, nos, usta, rumieńce
function twarz(o = {}) {
  const x = o.x ?? 100, y = o.y ?? 112, s = o.s ?? 1, sk = o.skora || SKORA, skc = o.skoraC || SKORA_C;
  const k = o.kobieta;
  return `<g transform="translate(${x} ${y}) scale(${s}) translate(-100 -112)">
    <ellipse cx="66" cy="114" rx="7" ry="11" fill="${skc}"/><ellipse cx="134" cy="114" rx="7" ry="11" fill="${skc}"/>
    <path d="M100 66 C128 66 136 88 135 112 C134 140 120 160 100 162 C80 160 66 140 65 112 C64 88 72 66 100 66 Z" fill="${sk}"/>
    <path d="M100 66 C120 66 130 80 133 100 C126 86 114 80 100 80 Z" fill="#fff" opacity="0.12"/>
    ${oko(85, 110, o.oczy, o.blysk)}${oko(115, 110, o.oczy, o.blysk)}
    <path d="M${k ? '76 101 Q85 96 94 100' : '74 101 Q85 94 95 99'}" stroke="${o.brwi || '#5b3a22'}" stroke-width="${k ? 2.2 : 3.6}" fill="none" stroke-linecap="round"/>
    <path d="M${k ? '106 100 Q115 96 124 101' : '105 99 Q115 94 126 101'}" stroke="${o.brwi || '#5b3a22'}" stroke-width="${k ? 2.2 : 3.6}" fill="none" stroke-linecap="round"/>
    <path d="M100 112 Q96 126 93 130 Q100 134 107 130" stroke="${skc}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="79" cy="128" rx="7" ry="4" fill="#e88a7a" opacity="${k ? 0.45 : 0.25}"/><ellipse cx="121" cy="128" rx="7" ry="4" fill="#e88a7a" opacity="${k ? 0.45 : 0.25}"/>
    ${o.usta === false ? '' : `<path d="M90 143 Q100 ${o.smutna ? 139 : 149} 110 143" stroke="#a24a3a" stroke-width="${k ? 3 : 2.6}" fill="${k ? '#c8645a' : 'none'}" stroke-linecap="round"/>`}
  </g>`;
}
// broda i wąsy
function broda(kolor, dl = 1, x = 100, y = 112, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s}) translate(-100 -112)">
    <path d="M66 118 C68 ${150 + dl * 20} 86 ${170 + dl * 34} 100 ${176 + dl * 36} C114 ${170 + dl * 34} 132 ${150 + dl * 20} 134 118 C128 140 118 146 100 146 C82 146 72 140 66 118 Z" fill="${kolor}"/>
    <path d="M78 138 C88 130 96 134 100 136 C104 134 112 130 122 138 C114 142 106 141 100 139 C94 141 86 142 78 138 Z" fill="${kolor}"/>
    <path d="M84 ${158 + dl * 14} Q90 ${170 + dl * 20} 92 ${180 + dl * 24} M116 ${158 + dl * 14} Q110 ${170 + dl * 20} 108 ${180 + dl * 24} M100 ${160 + dl * 18} L100 ${186 + dl * 30}" stroke="#000" stroke-opacity="0.18" stroke-width="2" fill="none"/>
  </g>`;
}
function wlosy(kolor, typ = 'krotkie') {
  if (typ === 'dlugie') return `<path d="M60 116 C54 70 76 52 100 52 C124 52 146 70 140 116 C150 150 146 190 138 214 L126 214 C134 180 132 150 130 120 C126 92 116 80 100 80 C84 80 74 92 70 120 C68 150 66 180 74 214 L62 214 C54 190 50 150 60 116 Z" fill="${kolor}"/>`;
  if (typ === 'warkocze') return `<path d="M62 112 C58 72 78 54 100 54 C122 54 142 72 138 112 C132 90 118 78 100 78 C82 78 68 90 62 112 Z" fill="${kolor}"/>` +
    [62, 138].map(x => `<path d="M${x} 112 Q${x + (x < 100 ? -8 : 8)} 150 ${x + (x < 100 ? -4 : 4)} 196" stroke="${kolor}" stroke-width="12" fill="none" stroke-linecap="round"/>` +
      [130, 150, 170, 188].map(yy => `<circle cx="${x + (x < 100 ? -6 : 6)}" cy="${yy}" r="6.5" fill="${kolor}" stroke="#000" stroke-opacity="0.15"/>`).join('')).join('');
  if (typ === 'rozwiane') return `<path d="M62 112 C56 70 80 50 104 52 C130 52 150 66 160 80 C172 74 186 76 194 84 C176 86 168 94 152 96 C176 102 186 112 190 124 C172 114 156 112 140 112 C134 90 118 80 100 80 C82 80 70 92 66 116 Z" fill="${kolor}"/>`;
  if (typ === 'lyse') return `<path d="M64 112 C62 96 66 84 72 78 C70 94 70 104 68 118 Z M136 112 C138 96 134 84 128 78 C130 94 130 104 132 118 Z" fill="${kolor}"/>`;
  return `<path d="M62 116 C56 72 78 54 100 54 C122 54 144 72 138 116 C136 98 128 86 118 82 C110 90 92 92 80 84 C70 90 64 102 62 116 Z" fill="${kolor}"/>`;
}
// popiersie: szata i płaszcz
function popiersie(szata, plaszcz, lamowka = '#e2b65a') {
  return `<path d="M14 250 C20 196 52 180 100 176 C148 180 180 196 186 250 Z" fill="${szata}"/>
    <path d="M14 250 C18 204 40 186 70 180 L82 250 Z M186 250 C182 204 160 186 130 180 L118 250 Z" fill="${plaszcz}"/>
    <path d="M70 180 L82 250 M130 180 L118 250" stroke="${lamowka}" stroke-width="4"/>
    <path d="M84 168 L100 196 L116 168 Z" fill="${SKORA_C}"/><rect x="88" y="150" width="24" height="28" fill="${SKORA_C}"/>
    <path d="M78 180 Q100 200 122 180" stroke="${lamowka}" stroke-width="5" fill="none"/>`;
}
function tlo(id, c1, c2) {
  return `<defs><radialGradient id="t${id}" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
    <rect width="200" height="250" fill="url(#t${id})"/>`;
}
const RAMKA = `<rect x="3" y="3" width="194" height="244" rx="14" fill="none" stroke="#e2b65a" stroke-width="6"/><rect x="9" y="9" width="182" height="232" rx="10" fill="none" stroke="#7a4a26" stroke-width="2" opacity="0.6"/>`;
const piorun = (x, y, s = 1, k = '#ffd84a') => `<path transform="translate(${x} ${y}) scale(${s})" d="M10 0 L-6 22 L4 22 L-8 46 L16 16 L5 16 L16 0 Z" fill="${k}" stroke="#b07a0a" stroke-width="1.5"/>`;
const slonce = (x, y, r, k = '#ffd84a') => `<g transform="translate(${x} ${y})">${Array.from({ length: 16 }, (_, i) => `<path d="M0 ${-r - 4} L5 ${-r - 26} L-5 ${-r - 26} Z" fill="${k}" transform="rotate(${i * 22.5})" opacity="0.85"/>`).join('')}<circle r="${r}" fill="${k}" opacity="0.5"/></g>`;
const klos = (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0 L0 -60" stroke="#c99a3a" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${i % 2 ? 5 : -5}" cy="${-30 - i * 6}" rx="4.5" ry="8" fill="#e8c06a" transform="rotate(${i % 2 ? 25 : -25} ${i % 2 ? 5 : -5} ${-30 - i * 6})"/>`).join('')}</g>`;
const kwiat = (x, y, k = '#ff9ccc', s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-6" rx="4" ry="6.5" fill="${k}" transform="rotate(${a})"/>`).join('')}<circle r="3.4" fill="#ffd84a"/></g>`;
const wieniec = (y, kolory, s = 1) => Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.12 + i * 0.095); return kwiat(100 - Math.cos(a) * 44, y - Math.sin(a) * 20, kolory[i % kolory.length], s); }).join('');
const platek = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#ffffff" stroke-width="2" stroke-linecap="round">${[0, 60, 120].map(a => `<path d="M0 -9 L0 9" transform="rotate(${a})"/>`).join('')}</g>`;
const plomien = (x, y, s = 1, k1 = '#ff7a1a', k2 = '#ffd84a') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C-14 -10 -10 -30 0 -46 C2 -32 12 -30 10 -16 C16 -20 16 -10 12 -2 Z" fill="${k1}"/><path d="M0 -2 C-6 -8 -4 -18 0 -26 C3 -18 8 -14 4 -4 Z" fill="${k2}"/></g>`;

const RYS = {
  // Perun: burza, pioruny, groźny wzrok, ruda broda, hełm, topór
  perun: id => tlo(id, '#4a6aa0', '#121a33') + piorun(28, 30, 1.3) + piorun(158, 46, 1.1) + piorun(150, 150, 0.8, '#fff3a8') +
    `<path d="M160 120 L176 210" stroke="#6b4527" stroke-width="7"/><path d="M168 112 C190 108 196 128 184 140 C178 130 170 126 164 128 Z" fill="#c9ced6" stroke="#555" stroke-width="1.5"/>` +
    popiersie('#8a2b20', '#5a1a14') + wlosy('#8a4a22', 'dlugie') + twarz({ oczy: '#2a6ab0', brwi: '#6b3418', blysk: true }) + broda('#8a4a22', 1.2) +
    `<path d="M64 92 C64 60 80 46 100 44 C120 46 136 60 136 92 Z" fill="#b8bec6" stroke="#6a6f78" stroke-width="2"/><path d="M98 86 L102 86 L102 118 L98 118 Z" fill="#8f949c"/><circle cx="100" cy="40" r="5" fill="#e2b65a"/>`,
  // Weles: noc, rogi, czarna broda, niedźwiedzia skóra, wąż
  weles: id => tlo(id, '#3e5a3a', '#0e1a12') + `<circle cx="160" cy="40" r="16" fill="#e8e4c8" opacity="0.8"/><circle cx="166" cy="36" r="14" fill="#16261a"/>` +
    popiersie('#3a2a1e', '#5a4030', '#8f7a5a') + wlosy('#2a201a', 'dlugie') + twarz({ oczy: '#3e8a4a', brwi: '#1a1410', skora: '#e8bf98' }) + broda('#2a201a', 1.5) +
    `<path d="M66 80 C48 70 40 46 50 24 C54 44 62 56 76 66 Z M134 80 C152 70 160 46 150 24 C146 44 138 56 124 66 Z" fill="#e8ddc4" stroke="#8a7a5a" stroke-width="2"/>` +
    `<path d="M30 236 C40 210 20 200 34 186 C46 174 60 186 54 198" stroke="#5a8a3a" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="54" cy="198" r="7" fill="#5a8a3a"/><circle cx="56" cy="196" r="1.6" fill="#ffd84a"/>`,
  // Swaróg: kuźnia, iskry, siwa broda, łysa głowa, młot, fartuch
  swarog: id => tlo(id, '#ffb347', '#5a1e08') + Array.from({ length: 14 }, (_, i) => `<circle cx="${20 + (i * 37) % 160}" cy="${20 + (i * 53) % 120}" r="${1.5 + i % 3}" fill="#ffd84a" opacity="0.8"/>`).join('') +
    `<path d="M150 230 L170 120" stroke="#6b4527" stroke-width="8"/><rect x="150" y="98" width="40" height="26" rx="3" fill="#555b63" transform="rotate(10 170 111)"/>` +
    popiersie('#7a5030', '#4a3020', '#c49a6c') + `<path d="M60 250 L74 196 L126 196 L140 250 Z" fill="#5e3d22"/>` + wlosy('#c8c8c8', 'lyse') + twarz({ oczy: '#6a4a2a', brwi: '#d8d8d8' }) + broda('#d8d8d8', 1.4),
  // Dażbóg: złote słońce za głową, złote włosy, biała szata
  dazbog: id => tlo(id, '#fff2b0', '#d98a1a') + slonce(100, 104, 64) + popiersie('#f4ecd8', '#e2b65a', '#c98f34') + wlosy('#e8b84a', 'krotkie') +
    twarz({ oczy: '#b07a0a', brwi: '#c98f34' }) + broda('#e8b84a', 0.3) + `<path d="M72 64 L80 48 L90 60 L100 42 L110 60 L120 48 L128 64 Z" fill="#ffd84a" stroke="#b07a0a" stroke-width="1.5"/>`,
  // Mokosz: matka ziemia, chusta, kłosy, wrzeciono
  mokosz: id => tlo(id, '#c9b46a', '#3e5a2a') + klos(28, 230, -12) + klos(44, 236, -4) + klos(170, 234, 10) + klos(156, 238, 4) +
    popiersie('#8a3a2a', '#5a7a3a', '#efe3c4') + `<path d="M56 120 C50 70 74 46 100 46 C126 46 150 70 144 120 C150 160 140 190 130 200 L70 200 C60 190 50 160 56 120 Z" fill="#c8402e"/>` +
    twarz({ kobieta: true, oczy: '#6a4a2a', brwi: '#5b3a22' }) + `<path d="M62 96 C70 70 130 70 138 96" stroke="#efe3c4" stroke-width="5" fill="none"/>` +
    [74, 88, 100, 112, 126].map(x => `<circle cx="${x}" cy="${78 + Math.abs(100 - x) * 0.3}" r="2.5" fill="#efe3c4"/>`).join(''),
  // Jaryło: młodzieniec, wieniec z kwiatów, zieleń wiosny
  jarylo: id => tlo(id, '#c8f0a0', '#3e8a3e') + Array.from({ length: 8 }, (_, i) => kwiat(18 + (i * 29) % 170, 30 + (i * 41) % 90, ['#ffffff', '#ffd84a', '#ff9ccc'][i % 3], 0.9)).join('') +
    popiersie('#f4ecd8', '#4a8f3a', '#ffd84a') + wlosy('#d9a45a', 'krotkie') + twarz({ oczy: '#3e8a4a', brwi: '#a8743a' }) + wieniec(70, ['#ffffff', '#ffd84a', '#ff9ccc', '#7fb2ff'], 1.15),
  // Strzybóg: wichura, rozwiane siwe włosy i broda, róg
  strzybog: id => tlo(id, '#cfe8ff', '#2a5a8a') + [40, 80, 120, 200].map((y, i) => `<path d="M${10 + i * 6} ${y} C60 ${y - 20} 110 ${y + 16} 190 ${y - 8}" stroke="#ffffff" stroke-opacity="0.55" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('') +
    popiersie('#5f7a9a', '#3a5070', '#cfe8ff') + wlosy('#e4e8ee', 'rozwiane') + twarz({ oczy: '#2a6ab0', brwi: '#e4e8ee' }) + broda('#e4e8ee', 1.1) +
    `<path d="M150 200 C170 196 184 176 186 156 L176 154 C170 172 160 184 146 188 Z" fill="#e8ddc4" stroke="#8a7a5a" stroke-width="2"/>`,
  // Swarożyc: ogień, płomienie zamiast włosów
  swarozyc: id => tlo(id, '#ff8a3d', '#5a0e08') + plomien(30, 240, 1.6) + plomien(170, 244, 1.4) + plomien(40, 120, 0.9) + plomien(160, 110, 1) +
    popiersie('#a5452f', '#5a1a14', '#ffd84a') + [70, 84, 100, 116, 130].map((x, i) => plomien(x, 84, 0.9 + (i === 2 ? 0.4 : 0))).join('') + twarz({ oczy: '#e8641a', brwi: '#a8301a', blysk: true }),
  // Łada: dziewczyna z warkoczami i wiankiem, kwiaty
  lada: id => tlo(id, '#ffe0f0', '#c8648a') + Array.from({ length: 10 }, (_, i) => kwiat(14 + (i * 37) % 172, 20 + (i * 47) % 210, ['#ffffff', '#ff9ccc', '#ffd84a'][i % 3], 1.1)).join('') +
    popiersie('#f4ecd8', '#c8648a', '#ff9ccc') + wlosy('#c98e4a', 'warkocze') + twarz({ kobieta: true, oczy: '#3e6aa0', brwi: '#a8743a' }) + wieniec(68, ['#ff9ccc', '#ffffff', '#ffd84a', '#c8402e'], 1.2),
  // Świętowit: cztery twarze (widać trzy), róg obfitości, biały koń w tle
  swietowit: id => tlo(id, '#f4ecd8', '#7a5a2a') + `<path d="M150 70 C164 54 186 56 192 70 L196 120 L180 124 L176 96 C170 104 160 104 154 96 Z" fill="#ffffff" opacity="0.7"/>` +
    popiersie('#efe6d2', '#a5452f', '#e2b65a') + `<g opacity="0.85">${twarz({ x: 62, y: 118, s: 0.62, usta: true })}${twarz({ x: 138, y: 118, s: 0.62 })}</g>` +
    wlosy('#a8743a', 'krotkie') + twarz({ oczy: '#3e6aa0', brwi: '#7a4a26' }) + broda('#a8743a', 0.8) +
    `<path d="M68 70 C68 50 132 50 132 70 L128 82 L72 82 Z" fill="#e2b65a" stroke="#b07a0a" stroke-width="2"/>` +
    `<path d="M24 236 C20 200 30 176 52 168 L58 178 C42 188 36 206 38 236 Z" fill="#e8ddc4" stroke="#8a7a5a" stroke-width="2"/>`,
  // Marzanna: zima, blada twarz, białe włosy, płatki śniegu, słomiany wianek
  marzanna: id => tlo(id, '#e4f2ff', '#3a5a8a') + Array.from({ length: 12 }, (_, i) => platek(16 + (i * 31) % 168, 18 + (i * 43) % 220, 0.9)).join('') +
    popiersie('#dceaf6', '#7aa0c8', '#ffffff') + wlosy('#f0f4f8', 'dlugie') + twarz({ kobieta: true, oczy: '#6aa0d8', brwi: '#c8d4e0', skora: '#f2e4e0', skoraC: '#d8c4c4', smutna: true }) +
    `<path d="M64 82 C70 62 130 62 136 82" stroke="#d9b45a" stroke-width="7" fill="none"/>` + [70, 84, 100, 116, 130].map(x => `<path d="M${x} 74 L${x - 4} 60 M${x} 74 L${x + 4} 60" stroke="#c99a3a" stroke-width="2"/>`).join(''),
  // Trzygłów: trzy głowy (niebo, ziemia, podziemie), fioletowe tło, księżyc
  trzyglow: id => tlo(id, '#9a7ac8', '#1e1236') + `<circle cx="100" cy="36" r="12" fill="#f4ecd8" opacity="0.85"/>` + popiersie('#5a3a7a', '#2a1a40', '#c8a8ff') +
    `${wlosy('#3a2a1e', 'krotkie')}` + twarz({ x: 56, y: 124, s: 0.7, oczy: '#7aa0d8', brwi: '#3a2a1e' }) + twarz({ x: 144, y: 124, s: 0.7, oczy: '#a8301a', brwi: '#3a2a1e' }) +
    broda('#3a2a1e', 0.6, 56, 124, 0.7) + broda('#3a2a1e', 0.6, 144, 124, 0.7) + twarz({ oczy: '#e2b65a', brwi: '#3a2a1e', blysk: true }) + broda('#3a2a1e', 1) +
    `<path d="M72 70 L78 52 L90 64 L100 46 L110 64 L122 52 L128 70 Z" fill="#c8a8ff" stroke="#6a4a9a" stroke-width="1.5"/>`,
};

export function portret(id) {
  const f = RYS[id]; if (!f) return '';
  const n = 'p' + (nr++);
  return `<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${id}">${f(n)}${RAMKA}</svg>`;
}
