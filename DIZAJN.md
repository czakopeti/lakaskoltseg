# Dizájn

> **Állapot (2026. november 18.):** ez a fájl az autózom dizájnleírása, a motorral együtt jött át. A lakásos oldal saját vizuális identitást kap: az űrlap tárgyi világa a **tulajdoni lap** és az **adásvételi szerződés** lesz (I–II–III. rész, széljegyek, ügyvédi ellenjegyzés, földhivatali érkeztető bélyegző), saját színekkel és betűvel. Az Overpass a közúti táblák betűjéből származik, ezért itt cserélni kell. Amíg az új identitás nincs elfogadva, az alábbi elemek és osztálynevek élnek a kódban, és ez a leírás a működésükről szól.

Az oldal tárgyi világa a **forgalmi engedély** és a **NAV-határozat**. Minden új oldal ebből a kettőből építkezik.

## Elemek

| Elem | Mire való | Szabály |
|---|---|---|
| Forgalmi-kártya (`.forgalmi`) | Az űrlap | Lekerekített „plasztikkártya”, guilloche-rozetta a sarokban. A mezők előtt a forgalmi valódi kódja (P.1, P.2, P.3, V.9, B), csak ha tényleg onnan jön az adat. |
| Beírósor (`.beir`) | Számmező | Aláhúzott mező, mint egy nyomtatványon. Nincs dobozos input. |
| Négyzet (`.negyzet`) | Rádió és jelölő | Nyomtatványos négyzet pipával. |
| Elszámolás (`.elszamolas`) | Az eredmény | Perforált felső élű papírlap, tételsorok, a végösszeg alatt könyvelői dupla aláhúzás. |
| Pecsét (`.pecset`) | Az egyetlen látványos mozzanat | Az első eredménynél (a mintánál is) egyszer rácsapódik. A gyűrűben a saját nevünk áll, nem a NAV-é, és a források oldalára visz. |
| Költséggörbe (`.grafikon`) | Benzin vagy villany | Két vonal, a megtérülés pontja jelölve. A vonal egyszer kirajzolódik, ha új eredmény jön. Keskeny kijelzőn a végcímkék helyett a jelmagyarázat azonosít. |
| Adatjelölés (`.jel`) | Bizalom | Minden tétel mellett: **hivatalos** (NAV vagy jogszabály, telt keret), **saját** (a látogató adta meg, vékony keret), **becslés** (a mi feltevésünk, szaggatott keret). A panel alján jelmagyarázat, csak a használt jelölésekkel. |
| Mentett autó (`.autom`) | Visszatérő látogató | Csak gombnyomásra ment és tölt be. Az űrlap mindig üresen nyílik. |

## Színek

Papír `#E9EEE5`, lap `#F8FAF5`, tinta `#13312A`, halvány tinta `#4A655D`, guilloche `#A9C3B6`, pecsétvörös `#B3261E`.
A pecsétvörös csak a pecséten, a logón és a hibaüzenetben szerepel. Sötét módban ugyanezek a szerepek mélyzöld alapon.

Grafikonsorok: A `#B0600C` (borostyán), B `#0E7C9E` (petrol); sötét módban `#CF8027` és `#289ABB`. A dataviz-validátorral ellenőrizve (színtévesztőknél is megkülönböztethető).

## Betűk

Egyetlen család: **Overpass** (változó vastagság, SIL OFL). A közúti táblák betűjéből (Highway Gothic) származik, ezért illik az autós témához, és nem a megszokott „generált oldal” betűpárosa. Címek és összegek 800-as, szöveg 400-as, mezőcímkék 600-as vastagsággal. Mondatkezdő írásmód mindenhol, nincs csupa nagybetűs felirat.

## Amit kerülünk

Csupa nagybetűs feliratok a címek fölött, monospace címkék, középső pontos felsorolás, nyíl a gombok végén, 01/02/03 számozás, ha nincs valódi sorrend, egyforma kártyák rácsban, görgetésre beúszó szekciók, egyetlen kiemelt szó a címben.
