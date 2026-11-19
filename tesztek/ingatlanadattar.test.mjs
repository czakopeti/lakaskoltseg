// A KSH Ingatlanadattár tömörítése és józansági próbája, és az évszám ragozása.
import test from 'node:test';
import assert from 'node:assert/strict';
import { nevlista, tomorit, hiheto } from '../frissito/ingatlanadattar.mjs';
import { evBan } from '../forras/js/megjelenites.mjs';

const LISTA = `const telepList = [
\t{id:'01',   nev:'Budapest',megye:'01',tipus:0},
\t{id:'14216',nev:'Budapest 11. kerület',megye:'01',tipus:5},
\t{id:'02112',nev:'Budapest 17. kerület',megye:'01',tipus:5},
\t{id:'31653',nev:'Gödöllő',megye:'13',tipus:3},
];`;
const SOROK = [
  { megye: '01', telaz: '01', szint: 1, ev: 2023, total_ar: 900, total_db: 30000 },
  { megye: '01', telaz: '01', szint: 1, ev: 2024, total_ar: 981, total_db: 29249 },
  { megye: '01', telaz: '14216', szint: 3, kozter: 'együtt', ev: 2024, total_ar: 1130, total_db: 2455, panel_ar: 988, panel_db: 500 },
  { megye: '01', telaz: '14216', szint: 2, kozter: 'Bartók Béla út', ev: 2024, total_ar: 1300, total_db: 40 },
  { megye: '13', telaz: '31653', szint: 2, kozter: 'Munkácsy Mihály utca', ev: 2023, total_ar: 700, total_db: 9 },
];

test('településlista: kerületnevek római számmal', () => {
  const n = nevlista(LISTA);
  assert.equal(n['14216'].n, 'Budapest XI. kerület');
  assert.equal(n['02112'].n, 'Budapest XVII. kerület');
  assert.equal(n['31653'].t, 3);
});

test('tömörítés: évek, vármegye, egység, utcák', () => {
  const t = tomorit(SOROK, nevlista(LISTA));
  assert.deepEqual(t.evek, [2023, 2024]);
  assert.deepEqual(t.megyek['01'].s.o, [900, 981]);
  assert.deepEqual(t.egysegek['14216'].s.p, [null, 988]);
  assert.equal(t.egysegek['14216'].s.h, undefined, 'az üres típus kimarad');
  assert.deepEqual(t.utcak['01']['14216'][0], ['Bartók Béla út', [null, 1300], [null, 40]]);
  assert.ok(t.utcak['13']['31653']);
});

test('józansági próba: kevés vármegye, visszalépő év', () => {
  const t = tomorit(SOROK, nevlista(LISTA));
  assert.match(hiheto(null, t), /vármegyét/);
  const regi = { evek: [2023, 2024, 2025] };
  const megyek = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(i + 1).padStart(2, '0'), { s: { o: [500] } }]));
  assert.match(hiheto(regi, { ...t, megyek }), /korábban 2025/);
});

test('évszám ragozása', () => {
  assert.deepEqual([2015, 2016, 2020, 2023, 2024, 2026, 2027, 2028, 2030, 2040].map(evBan), ['2015-ben', '2016-ban', '2020-ban', '2023-ban', '2024-ben', '2026-ban', '2027-ben', '2028-ban', '2030-ban', '2040-ben']);
});

test('településoldalak: rövid cím, ki kap oldalt, becslés', async () => {
  const { slug, oldalLista } = await import('../forras/telepulesek.mjs');
  const { betoltAdat } = await import('../forras/adat.mjs');
  const S = await import('../forras/js/szamitas.mjs');
  assert.equal(slug('Budapest XI. kerület'), 'budapest-xi-kerulet');
  assert.equal(slug('Hajdú-Bihar vármegye'), 'hajdu-bihar-varmegye');
  assert.equal(slug('Őrbottyán'), 'orbottyan');
  const adat = betoltAdat();
  const l = oldalLista(adat);
  const kerulet = Object.entries(adat.arak.egysegek).filter(([, u]) => u.t === 5).map(([k]) => k);
  assert.ok(kerulet.every((k) => l.egysegek.has(k)), 'minden kerületnek van oldala');
  assert.equal(l.megyek.size, 20);
  assert.equal(new Set(l.egysegek.values()).size, l.egysegek.size, 'nincs két azonos cím');
  const deb = Object.values(adat.arak.egysegek).find((u) => u.n === 'Debrecen');
  const b = S.arBecsles(adat, deb);
  assert.equal(b.hol, 'a megyeszékhelyeken');
  assert.ok(b.ar > deb.s.o.at(-1));
});
