"""Age of Polan: przygotowuje lekkie pliki postaci (Quaternius, CC0) do folderu polanie/postacie/.

Użycie (z głównego folderu repozytorium):
    python narzedzia/polanie-postacie.py FOLDER_Z_PACZKAMI

FOLDER_Z_PACZKAMI zawiera pobrane z itch.io darmowe paczki (wersje Standard) pod nazwami:
    postacie.zip  = Universal Base Characters[Standard].zip
    stroje.zip    = Modular Character Outfits - Fantasy[Standard].zip
    ual1.zip      = Universal Animation Library[Standard].zip
    ual2.zip      = Universal Animation Library 2[Standard].zip

Co robi (żeby gra szybko się wczytywała na telefonie):
- stroje, głowy, włosy: zostawia tylko kolor (bez map wypukłości i szorstkości), faktury zmniejsza do 512 × 512 (JPG),
- ruchy: z dwóch bibliotek (razem 16 MB) wybiera tylko te, których używa gra, i zapisuje je w jednym małym pliku ruchy.glb.
"""
import io
import json
import struct
import sys
import zipfile
from pathlib import Path

from PIL import Image

CEL = Path('polanie') / 'postacie'
FAKTURA = 512
# ruchy używane w grze (nazwy z bibliotek Quaternius)
RUCHY = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Walk_Carry_Loop', 'TreeChopping_Loop', 'Farm_Harvest', 'Fixing_Kneeling',
         'Punch_Jab', 'Punch_Cross', 'Sword_Attack', 'Sword_Regular_A', 'Sword_Regular_B', 'OverhandThrow', 'Death01', 'Sword_Idle',
         'Idle_Shield_Loop', 'Spell_Simple_Shoot']
STROJE = 'Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Outfits/'
GLOWY = 'Universal Base Characters[Standard]/Base Characters/Godot - UE/'
TEKSTURY_GLOW = 'Universal Base Characters[Standard]/Base Characters/Textures/'
WLOSY = 'Universal Base Characters[Standard]/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/'
TEKSTURY_WLOSOW = 'Universal Base Characters[Standard]/Hairstyles/Textures/'
# pliki do gry: (zip, folder, nazwa pliku glTF, nazwa w grze)
MODELE = [
    ('stroje.zip', STROJE, 'Male_Peasant', 'chlop'), ('stroje.zip', STROJE, 'Male_Ranger', 'mysliwy'),
    ('stroje.zip', STROJE, 'Female_Peasant', 'chlopka'), ('stroje.zip', STROJE, 'Female_Ranger', 'mysliwa'),
    ('postacie.zip', GLOWY, 'Superhero_Male_FullBody', 'glowa_m'), ('postacie.zip', GLOWY, 'Superhero_Female_FullBody', 'glowa_k'),
    ('postacie.zip', WLOSY, 'Hair_Beard', 'broda'), ('postacie.zip', WLOSY, 'Hair_SimpleParted', 'wlosy_krotkie'),
    ('postacie.zip', WLOSY, 'Hair_Long', 'wlosy_dlugie'), ('postacie.zip', WLOSY, 'Hair_Buzzed', 'wlosy_scięte'.replace('ę', 'e')),
    ('postacie.zip', WLOSY, 'Hair_Buns', 'wlosy_koki'),
]
# jaśniejsza skóra zamiast ciemnej (głowy); faktury szukane też w folderach z teksturami
ZAMIANY = {'T_Superhero_Male_Dark.png': 'T_Superhero_Male_Ligh.png', 'T_Superhero_Female_Dark_BaseColor.png': 'T_Superhero_Female_Light_BaseColor.png'}


def znajdz(z, folder, nazwa):
    for f in (folder, TEKSTURY_GLOW, TEKSTURY_WLOSOW, GLOWY):
        try:
            return z.read(f + nazwa)
        except KeyError:
            pass
    raise SystemExit(f'Brak pliku {nazwa}')


def faktura(dane, plik):
    im = Image.open(io.BytesIO(dane)).convert('RGB').resize((FAKTURA, FAKTURA), Image.LANCZOS)
    im.save(CEL / plik, 'JPEG', quality=85, optimize=True)


def model(zipy, zipn, folder, nazwa, cel):
    z = zipy[zipn]
    j = json.loads(z.read(folder + nazwa + '.gltf'))
    (CEL / (cel + '.bin')).write_bytes(z.read(folder + j['buffers'][0]['uri']))
    j['buffers'][0]['uri'] = cel + '.bin'
    # tylko kolor: bez map wypukłości, metaliczności i szorstkości
    uzyte = set()
    for m in j.get('materials', []):
        m.pop('normalTexture', None)
        p = m.setdefault('pbrMetallicRoughness', {})
        p.pop('metallicRoughnessTexture', None)
        p['metallicFactor'] = 0
        p['roughnessFactor'] = 1
        if 'baseColorTexture' in p:
            uzyte.add(j['textures'][p['baseColorTexture']['index']]['source'])
    for i, im in enumerate(j.get('images', [])):
        if i not in uzyte:
            continue
        zrodlo = im['uri']
        zrodlo = ZAMIANY.get(zrodlo, zrodlo).replace('_png.png', '.png')
        plik = Path(zrodlo).stem.lower() + '.jpg'
        if not (CEL / plik).exists():
            faktura(znajdz(z, folder, zrodlo), plik)
        im['uri'] = plik
        im['mimeType'] = 'image/jpeg'
    for i, im in enumerate(j.get('images', [])):
        if i not in uzyte:
            im['uri'] = 'brak.jpg'
    (CEL / (cel + '.gltf')).write_text(json.dumps(j, separators=(',', ':')), encoding='utf-8')


def czytaj_glb(b):
    dl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + dl])
    p = 20 + dl
    bl = struct.unpack('<I', b[p:p + 4])[0]
    return j, b[p + 8:p + 8 + bl]


def ruchy(zipy):
    """Jeden plik GLB z wybranymi ruchami: szkielet (same węzły z nazwami) + animacje, bez siatek i faktur."""
    zrodla = []
    for zipn, sciezka in (('ual1.zip', 'Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb'),
                          ('ual2.zip', 'Universal Animation Library 2[Standard]/Unreal-Godot/UAL2_Standard.glb')):
        zrodla.append(czytaj_glb(zipy[zipn].read(sciezka)))
    nowy = {'asset': {'version': '2.0', 'generator': 'polanie-postacie.py'}, 'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [],
            'animations': [], 'accessors': [], 'bufferViews': [], 'buffers': [{'byteLength': 0}]}
    dane = bytearray()
    wezly = {}  # nazwa węzła -> indeks w nowym pliku (szkielet jest taki sam w obu bibliotekach)
    j0 = zrodla[0][0]
    korzenie = j0['scenes'][j0.get('scene', 0)]['nodes']

    def kopiuj_wezel(j, i, rodzic=None):
        n = j['nodes'][i]
        nn = {k: v for k, v in n.items() if k in ('name', 'translation', 'rotation', 'scale')}
        nowy['nodes'].append(nn)
        ni = len(nowy['nodes']) - 1
        wezly[n.get('name', str(i))] = ni
        dzieci = [kopiuj_wezel(j, c) for c in n.get('children', []) if 'mesh' not in j['nodes'][c]]
        if dzieci:
            nn['children'] = dzieci
        return ni

    nowy['scenes'][0]['nodes'] = [kopiuj_wezel(j0, r) for r in korzenie if 'mesh' not in j0['nodes'][r]]
    znalezione = set()
    for j, binarne in zrodla:
        for a in j['animations']:
            if a['name'] not in RUCHY or a['name'] in znalezione:
                continue
            znalezione.add(a['name'])
            mapa = {}

            def akcesor(ai):
                if ai in mapa:
                    return mapa[ai]
                acc = dict(j['accessors'][ai])
                bv = j['bufferViews'][acc['bufferView']]
                start = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
                ile = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[acc['type']] * acc['count']
                bajtow = ile * {5126: 4, 5123: 2, 5125: 4, 5121: 1}[acc['componentType']]
                kawalek = bytes(binarne[start:start + bajtow])
                while len(dane) % 4:
                    dane.append(0)
                nowy['bufferViews'].append({'buffer': 0, 'byteOffset': len(dane), 'byteLength': len(kawalek)})
                dane.extend(kawalek)
                acc['bufferView'] = len(nowy['bufferViews']) - 1
                acc.pop('byteOffset', None)
                nowy['accessors'].append(acc)
                mapa[ai] = len(nowy['accessors']) - 1
                return mapa[ai]

            sam = [{'input': akcesor(s['input']), 'output': akcesor(s['output']), 'interpolation': s.get('interpolation', 'LINEAR')} for s in a['samplers']]
            kan = []
            for c in a['channels']:
                nazwa = j['nodes'][c['target']['node']].get('name')
                if nazwa not in wezly:
                    continue
                kan.append({'sampler': c['sampler'], 'target': {'node': wezly[nazwa], 'path': c['target']['path']}})
            nowy['animations'].append({'name': a['name'], 'samplers': sam, 'channels': kan})
    brak = set(RUCHY) - znalezione
    if brak:
        raise SystemExit(f'Nie znaleziono ruchów: {sorted(brak)}')
    while len(dane) % 4:
        dane.append(0)
    nowy['buffers'][0]['byteLength'] = len(dane)
    js = json.dumps(nowy, separators=(',', ':')).encode('utf-8')
    while len(js) % 4:
        js += b' '
    calosc = 12 + 8 + len(js) + 8 + len(dane)
    glb = struct.pack('<III', 0x46546C67, 2, calosc) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(dane), 0x004E4942) + bytes(dane)
    (CEL / 'ruchy.glb').write_bytes(glb)
    return len(nowy['animations'])


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    zipy = {n: zipfile.ZipFile(folder / n) for n in ('postacie.zip', 'stroje.zip', 'ual1.zip', 'ual2.zip')}
    CEL.mkdir(parents=True, exist_ok=True)
    for zipn, fold, nazwa, cel in MODELE:
        model(zipy, zipn, fold, nazwa, cel)
    Image.new('RGB', (4, 4), (128, 128, 128)).save(CEL / 'brak.jpg', 'JPEG')
    n = ruchy(zipy)
    print(f'Gotowe: {len(MODELE)} modeli, {n} ruchów w {CEL}')


if __name__ == '__main__':
    main()
