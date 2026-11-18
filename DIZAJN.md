# Dizájn

2026. november 18-án teljesen újraterveztük. A korábbi tervrajz- és okirat-világ (rajzlap, alaprajz-makett, bélyegző, római számos rovatok) megszűnt.

## Honnan jön a szerkezet

A legnagyobb forgalmú külföldi kalkulátoroldalak (Bankrate, NerdWallet, Zillow, Calculator.net) bevált rendje: a kalkulátor a hajtás fölött van, bal oldalt a mezők, jobb oldalt az élő eredmény bontással, alatta a magyarázat, a gyakori kérdések és a források. Ezt a szerkezetet vettük át. Az arculatukat (színeiket, logójukat) nem: a saját arculat a budapesti villamos sárgája és a tinta.

## Elemek

| Elem | Szabály |
|---|---|
| Színek | Fehér alap, `#F3F4F6` felület, tinta `#14161B`, villamossárga `#FFD21A`, halvány sárga `#FFF3C2`. Sötét módban `#16181D` alap, a sárga marad. |
| Betűk | Bricolage Grotesque a címekhez és a nagy számokhoz (750–780, szoros betűköz), Onest a szöveghez és az űrlaphoz. Mindkettő OFL, saját tárhelyről (`forras/fonts`). |
| Logó | Sárga lekerekített négyzet tintaszínű házzal, mellette a szókép. A favicon ugyanez. |
| Űrlap (`.forgalmi`) | Szürke kártya 28 px sarkokkal. A mezők fehérek 16 px sarkokkal, a szám nagy Bricolage betűvel. Fókuszban tinta keret és sárga gyűrű. A választók kerek csipek, a jelölőnégyzetek kapcsolók. |
| Eredmény (`.elszamolas`) | Fehér kártya, asztali nézetben görgetéskor a helyén marad. A végösszeg sárga blokkon, nagy számmal. |
| Adatjelölés (`.jel`) | **hivatalos**: tinta csip, a forrásra visz. **saját**: keretes. **becslés**: halvány sárga. |
| Ábrák | Tinta és sárga. A kiemelt oszlop (az idei év, a nyerő változat) mindig sárga. |
| Főoldal | Nagy cím, a leggyakoribb kalkulátorok csipként, mellette a sárga mintakártya valódi számítással (címkézve), alatta élethelyzetenként kártyák. A kártya rámutatáskor sárgára vált. |
| Nyomtatás | Egyoszlopos kimutatás: fejléc a címmel és a dátummal, az eredmény, a levezetés nyitva, a végén a források. |

## Mozgás

Egyetlen hangsúlyos mozzanat: a főoldalon a mintakártya beúszik, és a költségsáv három része egymás után kitöltődik. A kalkulátorokban csak az mozdul, ami a látogató műveletére válaszol: a végösszeg számlálva vált, az oszlopok egyszer felnőnek, a menü jobbról beúszik. A `prefers-reduced-motion` beállításnál minden mozgás kikapcsol.

## Amit nem csinálunk

Nincs csupa nagybetűs címke, nincs nyíl a linkek végén, és nincs egyforma árnyék minden kártyán. Az árnyék csak az eredménykártyán és a főoldali mintakártyán van, mert azok a legfontosabbak.
