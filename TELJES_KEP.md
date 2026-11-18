# A teljes kép (2026. november 18.)

Minden, amit egy lakással kapcsolatban ki lehet számolni vagy el kell dönteni, élethelyzet szerint. Pontozás 1–5: kereslet, rés, megépíthető (van-e ellenőrizhető, géppel figyelhető forrása). **Kész** = fent van. **Terv** = megépül, sorrendben. **Jelölt** = a szabályokat még forrásból ellenőrizni kell, addig a pontszám becslés. **Nem** = nem építjük.

## Veszel

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Vagyonszerzési illeték, minden kedvezménnyel | 5 | 3 | 3 | Terv (2.) |
| A vétel teljes költsége: illeték, ügyvéd, földhivatal, értékbecslés, közjegyző | 4 | 4 | 3 | Jelölt |
| Mennyi hitelt kaphatsz: jövedelem, önerő, az MNB adósságfék-szabályai | 5 | 3 | 4 | Jelölt |
| Wekerle Plusz jogosultság és törlesztő | 5 | 2 | 5 | Terv (5.) |
| Melyik támogatás jár: Wekerle Plusz, CSOK Plusz, babaváró, falusi CSOK | 5 | 3 | 3 | Jelölt |
| Új lakás: áfa, illetékkedvezmény, fizetési ütemezés | 3 | 4 | 3 | Jelölt |
| Venni vagy bérelni | 4 | 4 | 3 | Jelölt |
| Előtörlesztés: megéri-e, mennyit spórol | 4 | 3 | 4 | Jelölt |

## Eladsz

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Eladás szja-ja | 4 | 4 | 5 | **Kész** |
| Mennyi marad az eladási árból: közvetítő, szja, hitel végtörlesztése | 4 | 4 | 4 | Jelölt |
| Lakásváltás: eladás és vétel együtt | 4 | 5 | 3 | Terv (3.) |

## Kiadod

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Lakáskiadás adója: 10% vagy tételes | 4 | 4 | 4 | Terv (4.) |
| Hozam: megéri-e kiadásra venni | 4 | 4 | 3 | Jelölt |
| Rövid távú kiadás (szálláshely): tételes átalány, helyi szabályok | 3 | 4 | 2 | Jelölt |
| Bérleti díj emelése az inflációval (KSH) | 3 | 4 | 5 | Jelölt |
| Lakásbérleti szerződés, kitölthető | 5 | 2 | 3 | Jelölt |

## Örökölsz vagy ajándékba kapsz

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Öröklési és ajándékozási illeték | 4 | 3 | 4 | Jelölt |
| Haszonélvezet értéke | 3 | 5 | 4 | Jelölt |
| Örökölt vagy ajándékba kapott ingatlan eladása | 3 | 5 | 3 | Jelölt (a kész szja-oldal bővítése) |

## Laksz benne

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Építményadó és kommunális adó településenként | 4 | 4 | 4 | Jelölt |
| Felújítási és energetikai támogatások | 4 | 3 | 2 | Jelölt |
| Mit fizetsz a lakásért havonta | 3 | 3 | 3 | Jelölt |

## Mindegyikhez

- Határidő naptárfájlban (az szja-oldalon kész).
- Forrás és dátum minden tételnél, JSON-adatcsatorna, llms.txt (kész).
- „Az én lakásom” lap a böngészőben mentett adatokkal: csak ha három-négy kalkulátor már kész.

## Nem építjük

Banki ajánlatok rangsora, ingatlanár-becslő, hirdetéskereső, ügyvédkereső. Ezekhez vagy fizetős adat kell, vagy a hitelközvetítők terepe.

# Hogyan frissül magától

Három réteg van, és mindegyik ingyenes (nyilvános tároló, GitHub Actions).

1. **Dátumfüggő részek.** Az évszámok, a példák és a skálák az építéskor számolódnak. A heti futás újraépíti az oldalt, január első hetében naponta.
2. **Forrásfigyelő** (`frissito/figyelo.mjs`, `.github/workflows/frissites.yml`). Hétfőnként letölt minden oldalt, amelyre a `data/szabalyok.json` hivatkozik, és összeveti a szövegét a legutóbb látottal. Új szabály forrása magától bekerül a figyeltek közé. Ha egy forrás megváltozott, `forrasvaltozas` címkéjű jegyet nyit az érintett szabályok kulcsával, és a GitHub e-mailt küld. Ha semmi nem változott, a „Legutóbbi ellenőrzés” dátuma lép.
3. **Felülvizsgálat.** A jegy alapján a szabályt ember vagy egy ütemezett Claude-futás írja át. Jogszabályszöveget gép magától nem vesz át: egy rosszul értelmezett bekezdés rossz adót számolna.

Ami még hiányzik a teljes fedéshez:

- A törvények hatályos szövege (Itv., Szja tv.) a Nemzeti Jogszabálytárból, és a Magyar Közlöny tartalomjegyzékének kulcsszavas figyelése (illeték, lakás, Wekerle, személyi jövedelemadó). Így a változást a kihirdetéskor látjuk, nem akkor, amikor a NAV átírja az oldalát.
- A benyújtott törvényjavaslatok figyelése a parlament.hu-n.
- A szaksajtós források cseréje elsődlegesre. A hírportálok oldala gyakran változik, ezek téves riasztást adhatnak.
- Idősorok gépi átvétele ott, ahol szám a forrás: KSH lakbér- és árindex, MNB lakáshitel-kamatok, jegybanki alapkamat.
