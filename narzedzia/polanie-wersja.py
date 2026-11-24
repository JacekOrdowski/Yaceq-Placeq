"""Age of Polan: zapisuje starą wersję gry jako osobną kopię w polanie/wersje/N/.

Użycie (z głównego folderu repozytorium):
    python narzedzia/polanie-wersja.py NUMER SKROT_COMMITA

Bierze pliki gry z podanego zapisu w repozytorium (commita tej wersji, jest w polanie/ZMIANY.md)
i poprawia ścieżki, żeby kopia działała z podfolderu:
- biblioteka 3D (z survival/), muzyka i dźwięki (z age2/) oraz lista gier są brane z głównych folderów,
- każda wersja ma swój własny zapis postępu w telefonie (żeby wersje sobie nie przeszkadzały),
- w menu jest przycisk powrotu do wyboru wersji.
"""
import re
import subprocess
import sys
from pathlib import Path

PLIKI_TEKST = ['index.html', 'gra.js', 'dane.js', 'modele.js', 'manifest.webmanifest']
PLIKI_TEKST += ['postacie.js', 'portrety.js']  # od wersji 6 i 12
PLIKI_BIN = ['ikona-180.png', 'ikona-192.png', 'ikona-512.png']


def z_repo(commit, sciezka):
    return subprocess.run(['git', 'show', f'{commit}:polanie/{sciezka}'], check=True, capture_output=True).stdout


def zamien(tekst, stare, nowe, plik):
    if stare not in tekst:
        raise SystemExit(f'Nie znaleziono w {plik}: {stare}')
    return tekst.replace(stare, nowe)


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    nr, commit = int(sys.argv[1]), sys.argv[2]
    cel = Path('polanie') / 'wersje' / str(nr)
    cel.mkdir(parents=True, exist_ok=True)
    for p in PLIKI_BIN:
        (cel / p).write_bytes(z_repo(commit, p))
    for p in PLIKI_TEKST:
        try:
            t = z_repo(commit, p).decode('utf-8').replace('\r\n', '\n')
        except subprocess.CalledProcessError:
            continue  # tego pliku w starszej wersji nie było (postacie.js jest od wersji 6)
        if p == 'postacie.js':
            # pliki postaci (modele i ruchy) są tylko w głównym folderze gry
            t = zamien(t, "'../survival/three.module.min.js'", "'../../../survival/three.module.min.js'", p)
            t = t.replace("from './postacie/", "from '../../postacie/").replace("L.load('postacie/' + n", "L.load('../../postacie/' + n")
            t = t.replace("TL.load('postacie/' + n", "TL.load('../../postacie/' + n")  # faktury stworów (od wersji 21)
        if p == 'portrety.js':  # malowane portrety (od wersji 25) są tylko w głównym folderze gry
            t = t.replace("const FOLDER_PORTRETOW = 'portrety/';", "const FOLDER_PORTRETOW = '../../portrety/';")
        if p == 'index.html':  # tło ekranu startowego (od wersji 25)
            t = t.replace("url('obrazy/", "url('../../obrazy/").replace('src="ikony/', 'src="../../ikony/')
        if p in ('gra.js', 'modele.js'):
            t = zamien(t, "'../survival/three.module.min.js'", "'../../../survival/three.module.min.js'", p)
        if p == 'gra.js':
            t = t.replace('src="ikony/', 'src="../../ikony/').replace('src=\\"ikony/', 'src=\\"../../ikony/').replace('src=\\"portrety/', 'src=\\"../../portrety/')  # malowane ikony (od wersji 26), portrety w kolejce (od 29)
            if "'../age2/muzyka/' +" in t:  # do wersji 22 muzyka z Age of Haskap, potem własna (polanie/muzyka/)
                t = zamien(t, "'../age2/muzyka/' +", "'../../../age2/muzyka/' +", p)
            else:
                t = zamien(t, "e.a.src = 'muzyka/' +", "e.a.src = '../../muzyka/' +", p)
            t = zamien(t, "fetch('../age2/dzwieki/", "fetch('../../../age2/dzwieki/", p)
            if not re.search(r"const KLUCZ = '[^']*';", t):
                raise SystemExit('Nie znaleziono KLUCZ w gra.js')
            t = re.sub(r"const KLUCZ = '[^']*';", f"const KLUCZ = 'age-of-polan-1-w{nr}';", t, count=1)
            # kopia startuje od razu z menu, a przycisk „Inne wersje gry” wraca do wyboru wersji w najnowszej grze
            t = zamien(t, 'if (WERSJE.length > 1) pokazWersje(); else pokazMenu();', 'pokazMenu();', p)
            t = zamien(t, "$('m-wersje').hidden = WERSJE.length < 2;", "$('m-wersje').hidden = false;", p)
            t = zamien(t, "$('m-wersje').onclick = () => { dzwiek('klik'); pokazWersje(); };", "$('m-wersje').onclick = () => { location.href = '../../'; };", p)
        if p == 'index.html':
            t = zamien(t, '<title>Age of Polan</title>', f'<title>Age of Polan (wersja {nr})</title>', p)
            t = zamien(t, 'src="../gry.js"', 'src="../../../gry.js"', p)
        (cel / p).write_text(t, encoding='utf-8', newline='\n')
    print(f'Zapisano wersję {nr} (z {commit}) w {cel}')


if __name__ == '__main__':
    main()
