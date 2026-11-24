# Postacie: skąd są pliki

Wszystkie pliki w tym folderze są na licencji **CC0** (domena publiczna: wolno używać w grach, także bez podawania autora).
Autor: **Quaternius** (https://quaternius.com), pobrane z itch.io (darmowe wersje Standard) 24.11.2026:

- Universal Base Characters: głowy (`glowa_m`, `glowa_k`), włosy i broda (`wlosy_*`, `broda`)
- Modular Character Outfits – Fantasy: stroje (`chlop`, `chlopka`, `mysliwy`, `mysliwa`)
- Universal Animation Library 1 i 2: ruchy (`ruchy.glb`, tylko te, których używa gra)

Pliki zmniejsza i wybiera skrypt `narzedzia/polanie-postacie.py` (faktury 512 × 512 JPG, bez map wypukłości).
Czytnik modeli (`GLTFLoader.js`, `BufferGeometryUtils.js`, `SkeletonUtils.js`) to część biblioteki three.js 0.170 (licencja MIT).

## Leszy (od wersji 21 gry)

- `leszy1.fbx`, `leszy1.jpg`, `leszy2.fbx`, `leszy2.jpg`: **Free Treant Pack**, autor **Tennessippi Studios**
  (https://tennessippistudios.itch.io/treant-pack), licencja **CC0**, pobrane z itch.io 24.11.2026.
  Faktury zmniejszone do 1024 × 1024 (JPG).
- Czytnik modeli FBX (`FBXLoader.js`, `NURBSCurve.js`, `NURBSUtils.js`) to część biblioteki three.js 0.170 (licencja MIT),
  `fflate.module.js` to biblioteka fflate (licencja MIT).
