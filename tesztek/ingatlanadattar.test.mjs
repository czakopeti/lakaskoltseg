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
  assert.equal(b.lepes1.hol, 'a megyeszékhelyeken');
  assert.ok(b.ar > deb.s.o.at(-1));
  assert.match(b.cimke, /negyedév|^\d{4}$/);
  assert.equal(Math.round(b.ar), Math.round(deb.s.o.at(-1) * b.szorzo));
});

test('megfizethetőség: évnyi nettó kereset egy 50 m²-es lakásra, kerületnél a budapesti', async () => {
  const { betoltAdat } = await import('../forras/adat.mjs');
  const S = await import('../forras/js/szamitas.mjs');
  const adat = betoltAdat();
  const [kod, u] = Object.entries(adat.arak.egysegek).find(([, x]) => x.n === 'Budapest XI. kerület');
  const m = S.megfizethetoseg(adat, kod, u);
  const ev = adat.arak.evek.at(-1);
  assert.equal(m.kereset, adat.kereset.megye.Budapest[adat.kereset.evek.indexOf(ev)]);
  assert.ok(Math.abs(m.evek - (u.s.o.at(-1) * 1000 * 50) / (m.kereset * 12)) < 1e-9);
});

test('lakásérték: utcai becslés szűkebb sávval, kevés eladásnál a település felé húz', async () => {
  const { lakasErtek } = await import('../forras/js/szamitas.mjs');
  const ev = [2022, 2023, 2024];
  const A = { evek: ev, becsles: { cimke: '2026. II. negyedév', szorzok: { 1: 1.2 } }, szoras: { telep: { t: { szigma: 0.4 }, o: { szigma: 0.5 } }, utca: { szigma: 0.28, tau: 0.19 } },
    egysegek: { 1: { n: 'Próbaváros', m: '02', t: 3, s: { o: [500, 550, 600], od: [100, 100, 100], t: [500, 550, 600], td: [100, 100, 100] } } } };
  const utcak = [['Fő utca', [800, 880, 960], [50, 50, 50]], ['Kis utca', [null, null, 1200], [null, null, 3]]];
  const tel = lakasErtek(A, utcak, { kod: '1', tipus: 't', m2: 50 });
  const fo = lakasErtek(A, utcak, { kod: '1', utca: 'Fő utca', tipus: 't', m2: 50 });
  const kis = lakasErtek(A, utcak, { kod: '1', utca: 'Kis utca', tipus: 't', m2: 50 });
  assert.equal(tel.hol, 'telepules');
  assert.ok(Math.abs(tel.telepules.ar - 600) < 1, 'a régebbi évek a település indexével 2024-re hozva');
  assert.equal(fo.hol, 'utca');
  assert.ok(fo.sav[0.5] > tel.sav[0.5] * 1.4, 'a drágább utca feljebb viszi');
  assert.ok(fo.sav[0.9] / fo.sav[0.1] < tel.sav[0.9] / tel.sav[0.1], 'az utca szűkebb sávot ad');
  assert.ok(kis.utca.suly < fo.utca.suly, 'kevés eladásnál kisebb az utca súlya');
  assert.ok(kis.m2ar < 1200 * 1.2 * 1000 && kis.m2ar > 600 * 1.2 * 1000 * 0.9);
  assert.ok(tel.sav[0.1] < tel.sav[0.25] && tel.sav[0.25] < tel.sav[0.5] && tel.sav[0.5] < tel.sav[0.75] && tel.sav[0.75] < tel.sav[0.9]);
  assert.equal(lakasErtek(A, utcak, { kod: '1', tipus: 'h', m2: 50 }).tipus, 'o', 'családi ház adat nélkül: összes lakóingatlan');
  assert.equal(lakasErtek(A, utcak, { kod: '9', tipus: 't', m2: 50 }), null);
});

test('árszórás: az átlagok évenkénti ugrásából visszaadja a beállított szórást', async () => {
  const { arSzoras } = await import('../forras/js/szamitas.mjs');
  // Szimulált piac: a lakások négyzetméterára lognormális, σ = 0.3; az átlag n eladásból
  let mag = 7; const rnd = () => { mag = (mag * 16807) % 2147483647; return mag / 2147483647; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
  const atl = (n, szint) => { let s = 0; for (let i = 0; i < n; i++) s += szint * Math.exp(0.3 * gauss() - 0.045); return Math.round(s / n); };
  const egysegek = {}, utcak = {};
  for (let k = 0; k < 300; k++) {
    const n = 3 + (k % 20), ev = [0, 1, 2, 3].map((i) => 500 * 1.1 ** i);
    egysegek[k] = { m: '02', s: { o: ev.map((v) => atl(400, v)), od: [400, 400, 400, 400] } };
    utcak[k] = [['A utca', ev.map((v) => atl(n, v)), [n, n, n, n]]];
  }
  const megyek = { '02': { s: { o: [500, 550, 605, 666] } } };
  const sz = arSzoras({ egysegek, megyek }, { '02': utcak });
  assert.ok(Math.abs(sz.utca.szigma - 0.3) < 0.05, `utcai szórás ${sz.utca.szigma}`);
});
