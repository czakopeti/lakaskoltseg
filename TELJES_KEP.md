# A teljes kép (2026. november 18.)

Kész: 11 kalkulátor. A nem épített jelöltek mellett ott az ok.

Minden, amit egy lakással kapcsolatban ki lehet számolni vagy el kell dönteni, élethelyzet szerint. Pontozás 1–5: kereslet, rés, megépíthető (van-e ellenőrizhető, géppel figyelhető forrása). **Kész** = fent van. **Terv** = megépül, sorrendben. **Jelölt** = a szabályokat még forrásból ellenőrizni kell, addig a pontszám becslés. **Nem** = nem építjük.

## Veszel

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Vagyonszerzési illeték, minden kedvezménnyel | 5 | 3 | 4 | **Kész** |
| A vétel teljes költsége: illeték, ügyvéd, földhivatal, értékbecslés, közjegyző | 5 | 4 | 4 | **Kész** (újrapontozva 13 pontra, mert az okosan-elek is megépítette): a földhivatal és a közjegyző díjszabás szerint, az ügyvéd, az értékbecslés és a folyósítás becslésként, forrással. Amiben több: időrend (aláíráskor, folyósításig, birtokba adáskor, illeték később), HFM-korlát, támogatott hitel díjai. |
| Mennyi hitelt kaphatsz: jövedelem, önerő, az MNB adósságfék-szabályai | 5 | 3 | 4 | **Kész** |
| Wekerle Plusz jogosultság és törlesztő | 5 | 2 | 5 | **Kész** |
| Melyik támogatás jár: Wekerle Plusz, CSOK Plusz, babaváró, falusi CSOK | 5 | 3 | 3 | Később: a CSOK Plusz és a falusi CSOK rendeletét még nem ellenőriztük, a hitelközvetítők ezt jól lefedik. |
| Új lakás: áfa, illetékkedvezmény, fizetési ütemezés | 3 | 4 | 3 | Később (10 pont): az illetékkedvezmény az illetékkalkulátorban kész. |
| Venni vagy bérelni | 4 | 4 | 4 | **Kész** (újrapontozva 12 pontra): a feltevések forrásoltak (KSH infláció, PMÁP-kamat, Bankmonitor karbantartás), mindegyik átírható, és három forgatókönyv mutatja a bizonytalanságot. Amiben több: valós illeték és mellékköltség, havi modell, fordulópont évre. |
| Előtörlesztés: megéri-e, mennyit spórol | 4 | 3 | 4 | **Kész** |

## Eladsz

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Eladás szja-ja | 4 | 4 | 5 | **Kész** |
| Mennyi marad az eladási árból: közvetítő, szja, hitel végtörlesztése | 4 | 4 | 4 | **Kész** a lakásváltásban („Ennyit kapsz kézhez”) |
| Lakásváltás: eladás és vétel együtt | 4 | 5 | 4 | **Kész** |

## Kiadod

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Lakáskiadás adója: 10% vagy tételes | 4 | 4 | 5 | **Kész** |
| Hozam: megéri-e kiadásra venni | 4 | 4 | 4 | **Kész** |
| Rövid távú kiadás (Airbnb) vagy hosszú távú | 4 | 4 | 4 | **Kész** (újrapontozva 12 pontra, mert a budapesti moratórium 2026 végén lejár): a három adózási mód, áfa, turizmusfejlesztési hozzájárulás, jutalék, fordulópont foglalt éjszakában. A kerületi szabályokból nem építünk adatbázist, csak a mai állapotot írjuk ki dátummal. |
| Bérleti díj emelése az inflációval (KSH) | 3 | 4 | 5 | **Kész** |
| Lakásbérleti szerződés, kitölthető | 5 | 2 | 3 | Nem most (10 pont): jogi minta, ügyvédi ellenőrzés nélkül nem adnánk ki. |

## Örökölsz vagy ajándékba kapsz

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Öröklési és ajándékozási illeték | 4 | 3 | 4 | **Kész** |
| Haszonélvezet értéke | 3 | 5 | 4 | **Kész** |
| Örökölt vagy ajándékba kapott ingatlan eladása | 3 | 5 | 3 | Részben kész: az szja-oldal mezői és kérdései kitérnek rá. |

## Laksz benne

| Oldal | K | R | M | Állapot |
|---|---|---|---|---|
| Építményadó és kommunális adó településenként | 4 | 4 | 2 | Később: 3 155 település rendeletéből kellene gépi adatbázis, ennek a forrását (Magyar Államkincstár, helyi adó adatbázis) még meg kell találni. |
| Felújítási és energetikai támogatások | 4 | 3 | 2 | Később: a Wekerle Plusz energetikai pillére 2027-ben indul, a feltételei még nem jelentek meg. |
| Mit fizetsz a lakásért havonta | 3 | 3 | 3 | Nem most (9 pont). |

## Mindegyikhez

- Határidő naptárfájlban (kész az eladás szja-jánál és a lakáskiadásnál).
- Forrás és dátum minden tételnél, JSON-adatcsatorna, llms.txt (kész).
- „Az én lakásom” lap a böngészőben mentett adatokkal: csak ha három-négy kalkulátor már kész.

## Nem építjük

Banki ajánlatok rangsora, ingatlanár-becslő, hirdetéskereső, ügyvédkereső. Ezekhez vagy fizetős adat kell, vagy a hitelközvetítők terepe.

# Hogyan frissül magától

Három réteg van, és mindegyik ingyenes (nyilvános tároló, GitHub Actions).

1. **Dátumfüggő részek.** Az évszámok, a példák és a skálák az építéskor számolódnak. A heti futás újraépíti az oldalt, január első hetében naponta.
2. **Forrásfigyelő** (`frissito/figyelo.mjs`, `.github/workflows/frissites.yml`). Hétfőnként letölt minden oldalt, amelyre a `data/szabalyok.json` hivatkozik, és összeveti a szövegét a legutóbb látottal. Új szabály forrása magától bekerül a figyeltek közé. Ha egy forrás megváltozott, `forrasvaltozas` címkéjű jegyet nyit az érintett szabályok kulcsával, és a GitHub e-mailt küld. Ha semmi nem változott, a „Legutóbbi ellenőrzés” dátuma lép.
3. **Felülvizsgálat.** A jegy alapján a szabályt ember vagy egy ütemezett Claude-futás írja át. Jogszabályszöveget gép magától nem vesz át: egy rosszul értelmezett bekezdés rossz adót számolna.

Ami már gépi: a KSH éves átlagos inflációjának elavulás-őre (január 15-től jegyet nyit, ha az előző év hiányzik).

Ami még hiányzik a teljes fedéshez:

- A törvények hatályos szövege (Itv., Szja tv.) a Nemzeti Jogszabálytárból, és a Magyar Közlöny tartalomjegyzékének kulcsszavas figyelése (illeték, lakás, Wekerle, személyi jövedelemadó). Így a változást a kihirdetéskor látjuk, nem akkor, amikor a NAV átírja az oldalát.
- A benyújtott törvényjavaslatok figyelése a parlament.hu-n.
- A szaksajtós források cseréje elsődlegesre. A hírportálok oldala gyakran változik, ezek téves riasztást adhatnak.
- Idősorok gépi átvétele ott, ahol szám a forrás: KSH lakbér- és árindex, MNB lakáshitel-kamatok, jegybanki alapkamat.

# Versenytársak (2026. november 18.)

| Oldal | Amiben erős | Amit átvettünk vagy jobban csinálunk |
|---|---|---|
| okosan-elek.hu | Levezetés a beírt számokkal, „Adatok ellenőrizve”, módszertan. Hat ingatlanos kalkulátor: illeték, eladás adója, bérlés vagy vétel, kiadás adója, induló költség, hozam | Mind a hat megvan nálunk is, és mellé még hét. Az eladás adójánál átvettük az állagmegóvás 24 hónap / 5% szabályát és a 25%-os szabályt, ha a szerzési érték nem állapítható meg; a példájukat (50 M, 1 485 000 Ft) teszt ellenőrzi. Amiben többek vagyunk: jogszabályhely minden lépésnél, a következő évi adó, naptárfájl, időrend az induló költségnél, hitel és állampapír a hozamnál, és a lakásváltás, a Wekerle Plusz, a haszonélvezet, amely náluk nincs. |
| holahaz.hu | Vétel, ajándék, öröklés és eladás egy űrlapon; telek, haszonélvezet | Telek 4 éven belüli építéssel és haszonélvezettel terhelt vétel az illetékkalkulátorban |
| banknavigator.hu | Tulajdoni hányad, részletfizetés | Mindkettő megvan |
| ingatlanosmom.hu | Közös költség és rezsi pontos kezelése bérbeadásnál | A NAV 10. füzete szerint a mezők magyarázatában |
| money.hu, ingatlan.com | Ajándékba kapott ingatlan szerzési értéke | Jogcím szerinti magyarázat az eladás adójánál |
| ingatlan5.hu | Életjáradék, értékbecslés | Nem építjük: az értékbecsléshez nincs ingyenes, megbízható adat |

Ami csak nálunk van: lakásváltás eladással és vétellel egy lapon, a Wekerle Plusz feltételenként a rendelet paragrafusával, a hitelképesség összevetve a Wekerle Plusszal, a lakáskiadás döntési pontja, határidők naptárfájlban, minden szabály forrással és az ellenőrzés napjával, és heti forrásfigyelő.


# Külső javaslatok (2026. november 18.)

Egy másik értékelés öt fejlesztést javasolt. Pontozás (K: kereslet, R: rés a piacon, M: mennyire tudjuk megbízhatóan, 1–5):

| Javaslat | K | R | M | Döntés |
|---|---|---|---|---|
| Teljes lakásvásárlási költség | 5 | 4 | 4 | Kész ugyanezen a napon |
| Bérlés vagy vásárlás, átlátható módszertannal | 4 | 4 | 4 | Kész, a módszertan az oldalon és a levezetésben |
| Kalkulátorok összekapcsolása | 4 | 4 | 5 | **Kész** a „Következő lépés” linkjeivel: a vásárlási lánc (induló költség, hitel, Wekerle Plusz, illeték, bérlés vagy vétel) továbbadja az árat. Közös, böngészőben tárolt profilt nem építünk, mert az űrlapnak üresen kell nyílnia, és ami a látogató gépén marad, azt mi nem látjuk. |
| Letölthető, megosztható eredmény | 3 | 3 | 5 | **Kész**: a nyomtatás (és a PDF-be mentés) egyoszlopos kimutatás fejléccel, a nyitott levezetéssel és a forráslistával; a megosztható link már megvolt. Külön PDF-generátor nem kell, a böngésző tudja. |
| Ellenőrizhető számítási motor | 5 | 5 | 5 | Megvan: 55 teszt publikált példákkal, a kedvezmények közül a legkedvezőbbet választjuk, heti forrásfigyelő. |
