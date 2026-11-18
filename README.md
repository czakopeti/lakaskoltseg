# lakásköltség (munkanév)

Magyar kalkulátoroldal a lakásvásárlás, a lakáseladás és a lakáskiadás költségeiről: vagyonszerzési illeték, ingatlaneladás szja-ja, lakáskiadás adója, Wekerle Plusz hitel. Minden szabály forrással és dátummal. Az [autózom](https://autozom.hu) (czakopeti/autokoltseg) motorjára épül.

Statikus oldal. Nincs adatbázis, nincs szerver, nincs süti. Az űrlapok mindig üresen nyílnak.

**Állapot:** saját arculat (DIZAJN.md), 11 kalkulátor öt élethelyzetben (lásd `TELJES_KEP.md`), heti forrásfigyelő. Az oldal munkaverzió (`eles: false`), minden lapja noindex. A teljes terv: `TELJES_KEP.md`, a sorrend: `TARTALOMTERV.md`.

## Felépítés

| Mappa / fájl | Mi van benne |
|---|---|
| `data/szabalyok.json` | Minden szabály: gépi érték, szöveg, jogszabályhely, forrás, az ellenőrzés napja és szintje. A `nyitott` lista a még ellenőrizendő kérdéseket tartja. |
| `data/inflacio.json` | A KSH éves átlagos inflációja évenként, forrással. A bérleti díj emelésének oldala ebből számol. |
| `data/allapot.json` | A legutóbbi teljes ellenőrzés napja. |
| `forras/js/szamitas.mjs` | A számítási mag. A böngésző, az építő és a tesztek is ezt használják. |
| `forras/js/megjelenites.mjs` | Az eredménypanelek, és a `KALKULATOROK` leírás: melyik mező kell, mi a minta, melyik panel. Ezt használja az építő (a minta a HTML-ben van) és a böngésző is. |
| `forras/js/app.mjs` | Böngészős réteg: menü, élő számolás, megosztható link, visszajelzés. A kalkulátorok a `KALK` táblába kerülnek. |
| `forras/oldalak.mjs`, `forras/sablon.mjs` | Az oldalak szövege és kerete. |
| `frissito/figyelo.mjs`, `data/figyelo.json` | Forrásfigyelő: a szabályok forrásoldalainak lenyomata. Változásnál a heti futás jegyet nyit. |
| `functions/api/` | Cloudflare Pages Functions: névtelen mérés és visszajelzés. |
| `tesztek/` | Szerkezet, szabályfájl, számítás, végpontok. |
| `web/` | A kész oldal. A Cloudflare Pages ezt szolgálja ki. Kézzel ne szerkeszd, az `epit.mjs` írja. |
| `SZOVEG_STILUS.md`, `DIZAJN.md` | Szöveg- és dizájnszabályok. |

## Parancsok (Node 22, nincs függőség)

```
node epit.mjs                 # web/ felépítése
node epit.mjs --elonezet      # elonezet/ – relatív linkekkel, fájlként is megnyitható
node --test tesztek/*.test.mjs
node frissito/figyelo.mjs      # forrásfigyelő (internet kell)
```

## Cloudflare Pages (ingyenes csomag)

1. Workers & Pages → Create → Pages → Connect to Git → `czakopeti/lakaskoltseg`.
2. Framework preset: None. Build command: üres. Build output directory: `web`.
3. A kapott `.pages.dev` címet írd a `config.json` `domain` mezőjébe, ha eltér a `lakaskoltseg.pages.dev`-től.
4. Számláló: Storage & Databases → KV → `lakaskoltseg-szavazat`, majd a projektben Settings → Bindings → KV namespace, változónév: `SZAVAZAT`.
5. Szöveges visszajelzés: privát `czakopeti/lakaskoltseg-visszajelzes` tároló, hozzá fine-grained token (Issues: Read and write), a projektben `GITHUB_TOKEN` néven, Secret típussal.

## Élesítés előtt

- Végleges név, domain, logó (`config.json`: `marka`, `domain`, `szlogen`).
- Kapcsolati e-mail, IndexNow-kulcs (`config.json`).
- A saját domain felvétele a `functions/api/*.js` `ENGEDETT` listájába.
- A `data/szabalyok.json` `nyitott` listájának lezárása, a `masodlagos` szintű tételek összevetése az elsődleges forrással.
- `eles: true`.
