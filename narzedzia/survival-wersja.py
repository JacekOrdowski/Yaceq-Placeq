"""Yaceq Survival: zapisuje starą wersję gry jako osobną kopię w survival/wersje/N/.

Użycie (z głównego folderu repozytorium):
    python narzedzia/survival-wersja.py NUMER SKROT_COMMITA

Bierze pliki gry z podanego zapisu w repozytorium (commita tej wersji, jest w survival/ZMIANY.md)
i poprawia ścieżki, żeby kopia działała z podfolderu:
- biblioteka 3D i muzyka są brane z głównych folderów (bez kopiowania dużych plików),
- każda wersja ma swój własny zapis postępu w telefonie (żeby wersje sobie nie przeszkadzały),
- w menu jest przycisk powrotu do wyboru wersji.
"""
import subprocess
import sys
from pathlib import Path

PLIKI_TEKST = ['index.html', 'gra.js', 'krainy.js', 'modele.js', 'ikony.js', 'manifest.webmanifest']
PLIKI_BIN = ['ikona-180.png', 'ikona-192.png', 'ikona-512.png']


def z_repo(commit, sciezka):
    return subprocess.run(['git', 'show', f'{commit}:survival/{sciezka}'], check=True, capture_output=True).stdout


def zamien(tekst, stare, nowe, plik):
    if stare not in tekst:
        raise SystemExit(f'Nie znaleziono w {plik}: {stare}')
    return tekst.replace(stare, nowe)


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    nr, commit = int(sys.argv[1]), sys.argv[2]
    cel = Path('survival') / 'wersje' / str(nr)
    cel.mkdir(parents=True, exist_ok=True)
    for p in PLIKI_BIN:
        (cel / p).write_bytes(z_repo(commit, p))
    for p in PLIKI_TEKST:
        t = z_repo(commit, p).decode('utf-8')
        if p in ('gra.js', 'modele.js'):
            t = zamien(t, "'./three.module.min.js'", "'../../three.module.min.js'", p)
        if p == 'gra.js':
            t = zamien(t, '`../muzyka/', '`../../../muzyka/', p)
            t = zamien(t, "register('../sw.js', { scope: '../' })", "register('../../../sw.js', { scope: '../../../' })", p)
            t = zamien(t, "const KLUCZ = 'yaceq-survival';", f"const KLUCZ = 'yaceq-survival-w{nr}';", p)
            # od wersji 5 gra ma własny wybór wersji: w kopii start od razu z menu, a przycisk wraca do głównej listy
            if 'pokazWersje();\n  requestAnimationFrame' in t:
                t = zamien(t, 'pokazWersje();\n  requestAnimationFrame', 'pokazMenu();\n  requestAnimationFrame', p)
                t = zamien(t, "$('m-wersje').onclick = () => { dzwiek('klik'); pokazWersje(); };", "$('m-wersje').onclick = () => { location.href = '../../'; };", p)
        if p == 'index.html':
            t = zamien(t, '<title>Yaceq Survival</title>', f'<title>Yaceq Survival (wersja {nr})</title>', p)
        if p == 'index.html' and 'id="m-wersje"' not in t:
            t = zamien(t, '<div class="drobne" id="m-wersja"></div>',
                       '<div class="drobne" id="m-wersja"></div>\n'
                       '    <a class="przycisk drugi" href="../../" style="text-decoration:none">Inne wersje gry</a>', p)
        (cel / p).write_text(t, encoding='utf-8', newline='\n')
    print(f'Zapisano wersję {nr} (z {commit}) w {cel}')


if __name__ == '__main__':
    main()
