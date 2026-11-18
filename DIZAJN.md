# Dizájn

Az oldal tárgyi világa a **tervrajz** és az **ingatlanos okirat**: alaprajz méretvonalakkal, tulajdoni lap, adásvételi szerződés, érkeztető bélyegző. Világosban fehér rajzlap halvány négyzethálón, sötétben kéknyomat.

## Elemek

| Elem | Mire való | Szabály |
|---|---|---|
| Alaprajz (`.alaprajz`) | A főoldal nyitóképe | Egy 54 m²-es lakás vonalrajza. A falak egyszer kirajzolódnak, utána jönnek a feliratok és a méretvonalak. Saját rajz. |
| Rajzlap (`.forgalmi`) | Az űrlap | Szögletes lap eltolt árnyékkal, a sarkában kis alaprajz. Az osztálynév a motorból öröklődött. |
| Rész-jelölés (`reszCim`, `.kod`) | Hol találod az adatot | Római szám a tulajdoni lap része szerint: I. az ingatlan, II. a tulajdonjog és a szerzés, III. a terhek. Csak akkor, ha az adat tényleg ott van. |
| Beírósor (`.beir`) | Számmező | Aláhúzott mező, mint egy nyomtatványon. Amit a látogató beír, az **tollkék**: kitöltött nyomtatvány. |
| Elszámolás (`.elszamolas`) | Az eredmény | Sima lap. A végösszeg alatt **méretvonal** fut, ahogy a rajzokon a méretet jelölik. |
| Bélyegző (`.pecset`) | Az egyetlen látványos mozzanat | Téglalap alakú érkeztető bélyegző a nappal, ibolya színben. Az első eredménynél egyszer rácsapódik. A saját nevünk áll rajta, és a források oldalára visz. |
| Adatjelölés (`.jel`) | Bizalom | Minden tétel mellett: **hivatalos** (jogszabály vagy NAV), **saját** (a látogató adta meg), **becslés** (a mi feltevésünk). A hivatalos jelölés a forrásra visz. |
| Minta (`.minta-jelzes`) | Üres űrlap | Az űrlap mindig üresen nyílik. Az eredmény helyén címkézett minta áll, amíg a látogató nem ír be adatot. |
| Határidő (`data-naptar`) | Naptárfájl | A böngésző készíti, hozzánk nem jut el semmi. |

## Színek

| Szerep | Világos | Sötét (kéknyomat) |
|---|---|---|
| Háttér (`--papir`) | `#EDF1F7` | `#0D1F47` |
| Lap (`--lap`) | `#FCFDFF` | `#122A5C` |
| Nyomtatott szöveg (`--tinta`) | `#121A2F` | `#EAF0FC` |
| Másodlagos szöveg (`--tinta2`) | `#4B5873` | `#A8B8DC` |
| Toll: beírt adat, méretvonal, link (`--toll`) | `#1D3FBB` | `#A9C8FF` |
| Bélyegző (`--pecset`) | `#6A2C91` | `#E0B4FA` |
| Hiba (`--hiba`) | `#B3261E` | `#FF8A7A` |

A tollkék csak ott szerepel, ahol a látogató ír vagy kattint, és a méretvonalakon. A bélyegző-ibolya csak a bélyegzőn és az éppen érvényes sor kiemelésén.

## Betűk

**Jost** (változó vastagság, SIL OFL) a címekhez, az űrlaphoz és a számokhoz: geometrikus betű, az építészrajzok feliratainak rokona. Címek 600-as, összegek 500-as vastagsággal, hogy a nagy szám könnyű maradjon. **Literata** (SIL OFL) a folyó szöveghez: okiratba illő, jól olvasható talpas betű. Mondatkezdő írásmód mindenhol, csupa nagybetű csak a bélyegzőn.

## Amit kerülünk

Krémszínű papír talpas címbetűvel, lekerekített kártyák rácsban, csupa nagybetűs címke a címek fölött, monospace címkék, középső pontos felsorolás, nyíl a gombok végén, számozás, ha nincs valódi sorrend, görgetésre beúszó szekciók, egyetlen kiemelt szó a címben, ház- és kulcsikonok.
