/* Wspólna lista naszych gier: przycisk „Inne gry” w menu każdej gry otwiera to okienko.
   Każda gra dodaje u siebie przycisk z atrybutem data-inne-gry i wczytuje ten plik (ścieżką do głównego folderu).
   Nowa gra: dopisz ją do listy GRY poniżej (folder liczony od głównego folderu strony). */
(function () {
  const GRY = [
    { folder: '', nazwa: 'Śmierdzipacha', opis: 'Matematyka od 1. do 8. klasy: armia biegnie przez bramki z wynikami.', ikona: '🧮' },
    { folder: 'survival/', nazwa: 'Yaceq Survival', opis: 'Jagody kamczackie, zimowy obóz, pomocnicy i zwierzęta (3D).', ikona: '🫐' },
    { folder: 'age/', nazwa: 'Age of Yaceq', opis: 'Budujesz miasto gdzie chcesz i przechodzisz przez kolejne ery w ratuszu (3D).', ikona: '🏰' },
    { folder: 'age2/', nazwa: 'Age of Haskap II', opis: 'Dowodzisz osadnikami, budujesz osadę i walczysz z osadą komputera (3D).', ikona: '👑' },
    { folder: 'wersja-robocza/', nazwa: 'Obrona bazy (wersja robocza)', opis: 'Meteory lecą na bazę, a Strażnik strzela do nich z wieżyczkami.', ikona: '☄️' },
  ];
  const skrypt = document.currentScript;
  const glowny = new URL('.', skrypt ? skrypt.src : location.href);

  function okno() {
    let o = document.getElementById('inne-gry');
    if (o) return o;
    const st = document.createElement('style');
    st.textContent = `
#inne-gry { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; background: rgba(20, 30, 50, 0.6);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif; padding: 16px; }
#inne-gry[hidden] { display: none; }
#inne-gry .ig-karta { width: min(420px, 100%); max-height: 90vh; overflow: auto; background: #fff; color: #213047; border-radius: 22px;
  padding: 18px 16px 14px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35); }
#inne-gry h2 { margin: 0 0 12px; font-size: 24px; font-weight: 900; text-align: center; }
#inne-gry a { display: flex; gap: 12px; align-items: center; padding: 12px; margin-bottom: 10px; border-radius: 16px; background: #eef3fa;
  color: inherit; text-decoration: none; box-shadow: 0 4px 0 #c9d3e2; }
#inne-gry a:active { transform: translateY(3px); box-shadow: 0 1px 0 #c9d3e2; }
#inne-gry a.ta { background: #fff4d6; box-shadow: 0 4px 0 #e8cf8f; }
#inne-gry .ig-ikona { font-size: 34px; width: 44px; text-align: center; flex: none; }
#inne-gry b { display: block; font-size: 18px; font-weight: 900; }
#inne-gry small { display: block; font-size: 13px; color: #5a6b84; font-weight: 700; line-height: 1.3; }
#inne-gry button { display: block; width: 100%; padding: 12px; border: 0; border-radius: 14px; background: #e9eef6; color: #213047;
  font: inherit; font-size: 18px; font-weight: 900; box-shadow: 0 4px 0 #c3ccda; cursor: pointer; }`;
    document.head.appendChild(st);
    o = document.createElement('div'); o.id = 'inne-gry'; o.hidden = true;
    const k = document.createElement('div'); k.className = 'ig-karta';
    k.innerHTML = '<h2>Nasze gry</h2>';
    const tu = location.href.split('#')[0].split('?')[0];
    for (const g of GRY) {
      const a = document.createElement('a');
      a.href = new URL(g.folder, glowny).href;
      const ta = tu === a.href || tu === a.href + 'index.html';
      if (ta) a.className = 'ta';
      a.innerHTML = `<span class="ig-ikona">${g.ikona}</span><span><b>${g.nazwa}${ta ? ' (ta gra)' : ''}</b><small>${g.opis}</small></span>`;
      if (ta) a.addEventListener('click', e => { e.preventDefault(); o.hidden = true; });
      k.appendChild(a);
    }
    const zamknij = document.createElement('button'); zamknij.textContent = 'Wróć'; zamknij.onclick = () => { o.hidden = true; };
    k.appendChild(zamknij);
    o.appendChild(k);
    o.addEventListener('click', e => { if (e.target === o) o.hidden = true; });
    document.body.appendChild(o);
    return o;
  }
  window.pokazInneGry = () => { okno().hidden = false; };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-inne-gry]');
    if (b) { e.preventDefault(); window.pokazInneGry(); }
  });
})();
