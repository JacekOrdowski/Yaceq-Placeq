"""Age of Haskap II: zapisuje starą wersję gry jako osobną kopię w age2/wersje/N/.

Użycie (z głównego folderu repozytorium):
    python narzedzia/age2-wersja.py NUMER SKROT_COMMITA

Bierze pliki gry z podanego zapisu w repozytorium (commita tej wersji, jest w age2/ZMIANY.md)
i poprawia ścieżki, żeby kopia działała z podfolderu:
- biblioteka 3D (z survival/), muzyka i lista gier są brane z głównych folderów,
- każda wersja ma swój własny zapis postępu w telefonie (żeby wersje sobie nie przeszkadzały),
- w menu jest przycisk powrotu do wyboru wersji.
"""
import re
import subprocess
import sys
from pathlib import Path

PLIKI_TEKST = ['index.html', 'gra.js', 'dane.js', 'modele.js', 'manifest.webmanifest']
PLIKI_BIN = ['ikona-180.png', 'ikona-192.png', 'ikona-512.png']


def z_repo(commit, sciezka):
    return subprocess.run(['git', 'show', f'{commit}:age2/{sciezka}'], check=True, capture_output=True).stdout


def zamien(tekst, stare, nowe, plik):
    if stare not in tekst:
        raise SystemExit(f'Nie znaleziono w {plik}: {stare}')
    return tekst.replace(stare, nowe)


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    nr, commit = int(sys.argv[1]), sys.argv[2]
    cel = Path('age2') / 'wersje' / str(nr)
    cel.mkdir(parents=True, exist_ok=True)
    for p in PLIKI_BIN:
        (cel / p).write_bytes(z_repo(commit, p))
    for p in PLIKI_TEKST:
        t = z_repo(commit, p).decode('utf-8').replace('\r\n', '\n')
        if p in ('gra.js', 'modele.js'):
            t = zamien(t, "'../survival/three.module.min.js'", "'../../../survival/three.module.min.js'", p)
        if p == 'gra.js':
            t = t.replace("'../muzyka/", "'../../../muzyka/")
            # muzyka (od wersji 13) jest tylko w głównym folderze gry
            t = t.replace("'muzyka/' +", "'../../muzyka/' +")
            # dźwięki (od wersji 12) są tylko w głównym folderze gry
            t = t.replace("fetch('dzwieki/", "fetch('../../dzwieki/")
            t = zamien(t, "register('../sw.js', { scope: '../' })", "register('../../../sw.js', { scope: '../../../' })", p) if "register('../sw.js'" in t else t
            if not re.search(r"const KLUCZ = '[^']*';", t):
                raise SystemExit('Nie znaleziono KLUCZ w gra.js')
            t = re.sub(r"const KLUCZ = '[^']*';", f"const KLUCZ = 'age-of-haskap-2-w{nr}';", t, count=1)
            # kopia startuje od razu z menu, a przycisk „Inne wersje gry” wraca do wyboru wersji w najnowszej grze
            t = zamien(t, 'if (WERSJE.length > 1) pokazWersje(); else pokazMenu();', 'pokazMenu();', p)
            t = zamien(t, "$('m-wersje').hidden = WERSJE.length < 2;", "$('m-wersje').hidden = false;", p)
            t = zamien(t, "$('m-wersje').onclick = () => { dzwiek('klik'); pokazWersje(); };", "$('m-wersje').onclick = () => { location.href = '../../'; };", p)
        if p == 'index.html':
            t = zamien(t, '<title>Age of Haskap II</title>', f'<title>Age of Haskap II (wersja {nr})</title>', p)
            t = zamien(t, 'src="../gry.js"', 'src="../../../gry.js"', p)
        (cel / p).write_text(t, encoding='utf-8', newline='\n')
    print(f'Zapisano wersję {nr} (z {commit}) w {cel}')


if __name__ == '__main__':
    main()
