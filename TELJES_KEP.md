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

# Alapelv: csak magától frissülő adat (2026. november 18.)

Az oldalra csak olyan adat kerül, amely ember nélkül is naprakész marad: vagy a gép tölti le és írja át (forrással, dátummal, ésszerűségi ellenőrzéssel), vagy a gép figyeli a forrását, és változáskor jelez. Amit egyik módon sem lehet frissen tartani, az nem kerül ki.

| Adat | Hogyan frissül |
|---|---|
| Jogszabályi szabályok (illeték, szja, Wekerle Plusz, MNB) | A forrásfigyelő hetente letölti a forrásoldalt, és változáskor jelez. Az átírás ellenőrzést kíván, nem automatikus. |
| KSH infláció | Gépi (`frissito/automata.mjs`). Január 8-tól naponta keresi a KSH decemberi gyorstájékoztatójában (angol változat), és ha a cím és a szöveg ugyanazt a számot adja, és a szám hihető, maga veszi fel. Január 15-től az elavulás-őr is szól, ha még mindig hiányzik. |
| PMÁP kamat | Gépi. Hetente kiolvassa a „KAMAT: x%” sort az Államkincstár oldaláról; 0 és 30% között, és legfeljebb 8 százalékpontos ugrásnál írja át. Különben a régi marad, és jegy nyílik. A forrásfigyelő erről az oldalról nem nyit külön jegyet. |
| KSH lakásárindex, négyzetméterárak, lakbérek (tervezett) | Negyedévente vagy évente a KSH-ból maga tölti le; ha a letöltés vagy az ésszerűségi ellenőrzés hibát ad, a régi érték marad, és jelez. |
| ÉTDR összesítés (tervezett) | Az Építési Pulzus közzétett összesítő fájljából, hetente. |
| Cikkek (tervezett) | Minden szám az adatfájlból jön, ahogy a kalkulátoroké; a szabály változásával a cikk is változik. |
| KSH lakás-négyzetméterár | Gépi. Hetente letölti a KSH STADAT 18.1.2.9. táblát (angol HTML), az országos sorokat településtípusonként. Csak akkor írja át, ha egyetlen korábbi év sem hiányzik, a korábbi évek legfeljebb 15%-kal módosulnak, és az új év az előzőhöz képest −30% és +60% között van. A Bérlés vagy vétel kalkulátorban a „Hol van a lakás?” választás után ez a lakásár alapesete (a teljes idősor évi átlaga), és a táblázat az oldalon magától frissül. Régiónként is (a használt lakásokra): az illetékkalkulátorban az alapterület, a vármegye és a településtípus megadásával összeveti a vételár négyzetméterárát a környékbeli átlaggal, és ha annak felénél kisebb (`illetek.forgalmi_ertek`, a küszöb a mi becslésünk), figyelmeztet, hogy a NAV az Itv. 70. § szerint magasabb forgalmi értéket állapíthat meg. Később: adattáblák. |
| Változásnapló | `data/valtozasok.json`. A gépi frissítő minden átírást beír (nap, régi és új érték, forrás); a Források oldal „Mi változott?” része ebből készül. A kézi átírásokat a heti felülvizsgálat veszi fel. |
| Adattáblák (tervezett) | Építéskor készülnek az adatfájlból. |
| Becslések (ügyvéd, értékbecslés, jutalék) | A forrásfigyelő a forráscikkeket is figyeli. Ezek a legkevésbé friss tételek, ezért mindig átírhatók, és becslésként jelöljük őket. |
| Budapesti kerületi Airbnb-szabályok | Csak dátummal ellátott összefoglaló; a forrásai a figyelőben vannak. Adatbázist nem építünk belőle, mert nem frissíthető megbízhatóan. |

# Hogyan frissül magától

Három réteg van, és mindegyik ingyenes (nyilvános tároló, GitHub Actions).

1. **Dátumfüggő részek.** Az évszámok, a példák és a skálák az építéskor számolódnak. A heti futás újraépíti az oldalt, január első hetében naponta.
2. **Forrásfigyelő** (`frissito/figyelo.mjs`, `.github/workflows/frissites.yml`). Hétfőnként letölt minden oldalt, amelyre a `data/szabalyok.json` hivatkozik, kétszer, és a számot és mértéket tartalmazó mondatokat (%, Ft, §, év, nap, határidő) veti össze a legutóbb látottakkal. Csak a mindkét letöltésben szereplő mondat számít; a reklám, az ajánlott cikk, a felkiáltó és kérdő cím kimarad. A jegyben az új mondat szövege is ott van. Ha egy oldal letiltja a gépi letöltést, egyszer szól, és 60 napig nem ismétli; az ilyen szakcikkek mögötti jogszabályt (Itv., JTM-rendelet, Áfa tv., Htv., Szocho tv.) a Nemzeti Jogszabálytárból közvetlenül figyeli. Új szabály forrása magától bekerül a figyeltek közé. Ha egy forrás megváltozott, `forrasvaltozas` címkéjű jegyet nyit az érintett szabályok kulcsával, és a GitHub e-mailt küld. Ha semmi nem változott, a „Legutóbbi ellenőrzés” dátuma lép.
3. **Felülvizsgálat.** A jegy alapján a szabályt ember vagy egy ütemezett Claude-futás írja át. Jogszabályszöveget gép magától nem vesz át: egy rosszul értelmezett bekezdés rossz adót számolna.

Ami már gépi: a KSH éves átlagos inflációja és a PMÁP-kamat önálló frissítője (`frissito/automata.mjs`, a heti futás első lépése), és az infláció elavulás-őre (január 15-től jegyet nyit, ha az előző év hiányzik).

A heti felülvizsgálatot egy ütemezett Claude-futás végzi, hétfőnként 6:47-kor (Budapest), a forrásfigyelő után. A nyitott `forrasvaltozas` jegyek alapján átírja az egyértelmű változást forrással, a többit a nyitott listára veszi, és szól Péternek.

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

# Külső audit (2026. november 18., második kör)

| Megállapítás | Mit csináltunk |
|---|---|
| A GitHub Pages-en a kanonikus cím a még nem élő pages.dev | Az előnézet a saját címét írja a kanonikus címbe és a strukturált adatokba (`ELONEZET_DOMAIN`). A megosztott link eddig is az aktuális címet használta. |
| Nincs egyértelmű kezdőpont | A főoldalon egy fő gomb: „Számold ki, mennyi pénz kell a vételhez”, a többi kalkulátor alatta. |
| A Wekerle Plusz „jogosult vagy” üzenete banki jóváhagyásnak hathat | „Megfelelsz a rendelet feltételeinek. A hitelt a bank bírálja el…” |
| A becsléseket tartalmazó végösszeg túl pontosnak tűnik | Becsült tétel esetén a végösszeg kerekítve („kb. 12,9 millió Ft”), alatta a forintra pontos szám. Ha minden becsült tételt beírsz, nincs kerekítés. |
| A bérlés–vétel alapfeltevése vitatható | Az eredmény alatt kiemelve: feltevés, nem előrejelzés, és a két szélső forgatókönyv eredménye. |
| Vitatott szabályok | Cserét pótló vétel: a teljes mentességnél 3 év, a különbözetnél 5 év (Itv. 26. § (1) y), 21. § (2) b)); az űrlapon külön választható, és az eredmény jelzi. Wekerle Plusz illeték: az Itv. mentességei között nem szerepel, mentesség nélkül számolunk. |
| Nincs banki forgalmiérték-mező | Az induló költségnél választható mező; a hitel felső határát ebből számoljuk. |
| Adatátadás böngészőben tárolva | Nem építjük: az űrlap üresen nyílik. A linkek továbbadják a beírt számokat, és minden számítás megosztható. |


## Adatok, letöltések, beágyazás (2026. november 19.)

- `adatok/`: a KSH lakásárai (országos és régiós), az éves infláció és minden szabály táblázatban, egy Excel-munkafüzetben (`ingatlanmerleg-adatok.xlsx`, a `forras/xlsx.mjs` írja függőség nélkül), CSV-ben (pontosvessző, tizedesvessző, UTF-8 BOM) és JSON-ban (`adatok/v1/`). Minden építéskor az adatfájlokból készül, ezért magától frissül. Google Táblázatba IMPORTDATA-val, Excelbe a Weblapról menüvel húzható be. CC BY 4.0.
- `beagyazas/` és `beagyaz/<kalkulátor>/`: minden kalkulátor iframe-be tehető, fejléc és lábléc nélkül, noindex, kanonikusan a fő oldalra mutat. A magasságot üzenetben küldi, a befogadó kód tartalmaz egy látható forráslinket (ez a valódi visszamutató link). A `_headers` a `/beagyaz/*` útvonalon engedi a keretezést.
- Menü: Lakást veszel, Lakáshitel, Eladod a lakásod, Kiadod a lakásod, Örökölsz, Adatok és források. A főcím a mottó: „Számolj, mielőtt aláírsz.”
- Ellenőrző szkript (Playwright): minden oldal mobilon és asztalon, konzolhiba, túlcsordulás, belső linkek, duplikált id, címkék, és minden kalkulátor mintával, nullával és extrém értékkel.
