// Forrásfigyelő: szövegkivonat, szakasz, változásfelismerés, a források listája a szabályokból.
import test from 'node:test';
import assert from 'node:assert/strict';
import { szovegge, szakasz, lenyomat, ertekel, forrasLista, jegySzoveg, tenyek, VALTOZAT } from '../frissito/figyelo.mjs';
import { olvas } from '../forras/adat.mjs';

const lap = (torzs) => `<html><head><style>x{}</style><script>var a=1</script></head><body><nav>Menü ${Math.random()}</nav><main><h1>Illeték</h1><p>${torzs}</p></main><footer>Lábléc</footer></body></html>`;
const hosszu = 'Az illeték mértéke a forgalmi érték 4%-a. '.repeat(12);

test('a szöveg a menü, a lábléc és a szkriptek nélkül, szóközökre egyszerűsítve', () => {
  assert.equal(szovegge(lap('A  mérték\n4&nbsp;%.')), 'Illeték A mérték 4 %.');
  assert.equal(szovegge(lap('Frissítve: 2026.11.18. A mérték 4%.'), ['Frissítve: [\\d.]+']), 'Illeték A mérték 4%.');
});

test('szakasz a két jelző között; hiányzó kezdőjelzőnél null', () => {
  assert.equal(szakasz('a b KEZD c d VEG e', 'KEZD', 'VEG'), 'KEZD c d ');
  assert.equal(szakasz('a b c', 'NINCS'), null);
});

test('első látás, változatlan, változott, gyanús', () => {
  const f = { url: 'https://pelda.hu' };
  const elso = { v: VALTOZAT, ...ertekel(f, undefined, lap(hosszu)) };
  assert.equal(elso.allapot, 'uj');
  assert.equal(ertekel(f, elso, lap(hosszu)).allapot, 'valtozatlan', 'a menü változó része nem számít');
  assert.equal(ertekel(f, elso, lap(hosszu.replace('4%', '3%'))).allapot, 'valtozott');
  assert.equal(ertekel(f, elso, lap('Hiba történt.')).allapot, 'gyanus');
  assert.equal(ertekel({ ...f, tol: 'Nincs ilyen cím' }, elso, lap(hosszu)).allapot, 'gyanus');
  assert.equal(lenyomat('a').length, 16);
});

test('csak a számot és mértéket tartalmazó mondatok számítanak: a változó ajánló, számláló és oldalsáv nem riaszt', () => {
  const f = { url: 'https://pelda.hu' };
  const cikk = (extra) => `<main><h1>Illeték</h1><p>${hosszu} A határidő 30 nap. Az illetékmentesség értékhatára 50 millió forint. ${extra}</p></main><aside>Népszerű: a nyugdíj 3,6%-kal nő ${Math.random()}</aside>`;
  const elso = { v: VALTOZAT, ...ertekel(f, undefined, cikk('Olvasták: 1234-szer. Ajánló: Így rendezd be a nappalit.')) };
  assert.equal(ertekel(f, elso, cikk('Olvasták: 5678-szor. Ajánló: Tíz tipp a kertedhez.')).allapot, 'valtozatlan');
  // Csak eltűnt egy mondat: először vár, a második egymás utáni hiánynál szól
  const hianyos = cikk('').replace('A határidő 30 nap. ', '');
  const h1 = ertekel(f, elso, hianyos);
  assert.equal(h1.allapot, 'valtozatlan');
  assert.deepEqual(h1.tenyek, elso.tenyek, 'az alap nem változik, amíg nincs megerősítve');
  assert.equal(ertekel(f, { ...elso, hiany: h1.hiany }, hianyos).allapot, 'valtozott');
  assert.deepEqual(tenyek('Szja tv. 57/A. § (4) bekezdés a) pont Ugrás a myNAV oldalamra.'), [], 'felületi szöveg nem ténymondat');
  assert.deepEqual(tenyek('12 órája Részvény / Deviza / Áru Kiment az erő a forintból, 7,2 milliárd forint. Elolvasom 2026-11-18 Megjelentek a kereseti adatok, 737 400 forint. Az ügyvédi díj a vételár 1%-a.'), ['Az ügyvédi díj a vételár 1%-a.'], 'hírfolyam nem ténymondat');
  const v = ertekel(f, elso, cikk('').replace('30 nap', '15 nap'));
  assert.equal(v.allapot, 'valtozott');
  assert.deepEqual(v.ujMondatok, ['A határidő 15 nap.']);
  assert.equal(v.eltunt, 1);
  assert.match(jegySzoveg({ ma: '2026-11-25', valtozott: [{ url: f.url, nev: 'Példa', ...v }], gyanus: [], hiba: [] }), /> A határidő 15 nap\.[\s\S]*Eltűnt mondat: 1/);
  assert.equal(ertekel(f, { lenyomat: 'regi', hossz: 900 }, cikk('')).allapot, 'uj', 'régi formátumú állapotból csendben új alap');
  assert.equal(ertekel(f, { ...elso, v: VALTOZAT - 1 }, cikk('').replace('30 nap', '15 nap')).allapot, 'uj', 'új mondatválogatásnál is');
  // Két letöltés: a kérésenként változó promó nem kerül az alapba, a rövid hibaoldal mellett a jó letöltés elég
  const ket = (x) => [cikk(`Ajánlat: 3,${x}% THM-mel most`), cikk('Ajánlat: 2,9% kamattal ma.')];
  const alap = { v: VALTOZAT, ...ertekel(f, undefined, ket(1)) };
  assert.equal(ertekel(f, alap, ket(7)).allapot, 'valtozatlan');
  assert.equal(ertekel(f, alap, [lap('Ellenőrzés folyamatban.'), cikk('')]).allapot, 'valtozatlan');
  assert.equal(ertekel(f, alap, [lap('Ellenőrzés.'), lap('Ellenőrzés.')]).allapot, 'gyanus');
  assert.deepEqual(tenyek('Szép napot! Az illeték 4%. Kattints ide.'), ['Az illeték 4%.']);
  assert.deepEqual(tenyek('Bárkinek járhat ingyen 8-11 millió forint, ha nyugdíjba megy: egyszerű igényelni! Mennyi az illeték 2026-ban? Az illeték 4%.'), ['Az illeték 4%.'], 'kattintásvadász cím és kérdés nem számít');
  assert.equal(szovegge('<p>A<!-- promó 3,09% THM -->B</p>'), 'A B', 'a HTML-megjegyzés kimarad');
});

test('minden szabály forrása figyelt, a szabálykulcsokkal együtt', () => {
  const sz = olvas('data/szabalyok.json'), f = olvas('data/figyelo.json');
  const lista = forrasLista(sz, f.kulon);
  for (const t of sz.temak) for (const x of t.tetelek) assert.ok(lista.find((l) => l.url === x.forras.url).szabalyok.includes(`${t.id}.${x.kulcs}`));
  const nav = lista.find((l) => l.url.includes('Ingatlan-adasvetel'));
  assert.ok(nav.szabalyok.includes('szja_eladas.jovedelem_hanyad'));
  assert.equal(new Set(lista.map((l) => l.url)).size, lista.length);
});

test('a jegy szövege: csak akkor van, ha van teendő', () => {
  assert.equal(jegySzoveg({ ma: '2026-11-18', valtozott: [], gyanus: [], hiba: [], uj: [], valtozatlan: 9 }), '');
  const s = jegySzoveg({ ma: '2026-11-18', valtozott: [{ url: 'https://nav.gov.hu/x', nev: 'NAV', szabalyok: ['illetek.altalanos_mertek'] }], gyanus: [], hiba: [{ url: 'https://y', ok: 'HTTP 503' }] });
  assert.match(s, /Megváltozott a forrás/); assert.match(s, /`illetek\.altalanos_mertek`/); assert.match(s, /HTTP 503/);
});

test('tartós letöltési gond: csak az első alkalommal jelentjük, a régi lenyomat megmarad', async () => {
  const { gondAllapot } = await import('../frissito/figyelo.mjs');
  const elso = gondAllapot({ lenyomat: 'abc', hossz: 900 }, 'HTTP 403', '2026-11-18');
  assert.equal(elso.jelent, true);
  assert.equal(elso.allapot.lenyomat, 'abc');
  assert.equal(elso.allapot.gondOta, '2026-11-18');
  const masodik = gondAllapot(elso.allapot, 'HTTP 403', '2026-11-25');
  assert.equal(masodik.jelent, false);
  assert.equal(masodik.allapot.gondOta, '2026-11-18');
  assert.equal(gondAllapot(masodik.allapot, 'HTTP 404', '2026-12-02').jelent, true, 'más gond újra szól');
  assert.equal(gondAllapot(masodik.allapot, 'fetch failed', '2026-12-02').jelent, false, 'tiltás, időtúllépés, hálózati hiba egy fajta');
  // Az oldal közben helyreállt, aztán megint letilt: 60 napon belül nem szólunk újra, utána igen
  const helyre = { tenyek: ['x'], utolsoGond: 'letoltes', utolsoGondNap: '2026-11-25' };
  assert.equal(gondAllapot(helyre, 'HTTP 403', '2026-12-09').jelent, false);
  assert.equal(gondAllapot(helyre, 'HTTP 403', '2027-02-10').jelent, true);
});
