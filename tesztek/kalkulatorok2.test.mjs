// Hitelképesség, öröklés és ajándékozás, haszonélvezet, előtörlesztés, bérleti díj emelése, hozam: közölt példák és kézi esetek.
import test from 'node:test';
import assert from 'node:assert/strict';
import { betoltAdat } from '../forras/adat.mjs';
import * as S from '../forras/js/szamitas.mjs';

const adat = { ...betoltAdat(), ev: 2026 };

test('hitelképesség: JTM a jövedelem és a kamatperiódus szerint, HFM, a szűkebb korlát', () => {
  const r = S.hitelkepesseg(adat, { jovedelem: 500000, periodus: 'hosszu', kamat: 6.5, futamido: 25, ertek: 60e6 });
  assert.equal(r.jtm, 50); assert.equal(r.maxTorleszto, 250000); // money.hu: 500 000 × 0,5 = 250 000
  assert.equal(r.kot, 'jtm'); assert.equal(r.hfmHitel, 48e6);
  assert.deepEqual(['rovid', 'kozep', 'hosszu'].map((p) => S.hitelkepesseg(adat, { jovedelem: 500000, periodus: p }).jtm), [25, 35, 50]);
  assert.deepEqual(['rovid', 'kozep', 'hosszu'].map((p) => S.hitelkepesseg(adat, { jovedelem: 800000, periodus: p }).jtm), [30, 40, 60]);
  assert.equal(S.hitelkepesseg(adat, { jovedelem: 500000, periodus: 'hosszu', zold: true }).jtm, 60);
  assert.equal(S.hitelkepesseg(adat, { jovedelem: 500000, meglevo: 300000 }).maxTorleszto, 0);
  assert.equal(S.hitelkepesseg(adat, { jovedelem: 2e6, ertek: 40e6, elsoLakas: true }).max, 36e6);
  assert.equal(Math.round(S.hitelTorlesztobol(142263, 300, 3) / 1e4), 3000, 'a törlesztőből visszaszámolt hitel');
});

test('öröklés és ajándékozás: 9% és 18%, mentes rokonok, tiszta érték', () => {
  assert.equal(S.ingyenesIlletek(adat, { ertek: 20e6, rokonsag: 'egyeb' }).ado, 1800000); // Hővége: 20 milliós lakás 1,8 millió
  assert.equal(S.ingyenesIlletek(adat, { ertek: 20e6, vagyon: 'egyeb', rokonsag: 'egyeb' }).ado, 3600000); // Hővége: 3,6 millió
  assert.equal(S.ingyenesIlletek(adat, { ertek: 30e6, rokonsag: 'egyeb' }).ado, 2700000); // Adózáskalkulátor: 30M × 9%
  for (const r of ['egyenesagi', 'hazastars', 'testver']) assert.equal(S.ingyenesIlletek(adat, { ertek: 30e6, rokonsag: r }).ado, 0, r);
  assert.equal(S.ingyenesIlletek(adat, { ertek: 30e6, terhek: 10e6, rokonsag: 'egyeb' }).ado, 1800000);
  const h = S.ingyenesIlletek(adat, { ertek: 50e6, haszonelvezoKor: 70, rokonsag: 'egyeb' });
  assert.equal(h.tiszta, 40e6); assert.equal(h.ado, 3600000);
});

test('haszonélvezet: egyévi érték és az életkor szerinti szorzók (közölt példákkal)', () => {
  assert.equal(S.haszonelvezet(adat, { ertek: 43e6, kor: 55 }).jog, 12900000); // Jogászvilág: 43 millió, 55 év, 6×
  const sav = (kor) => S.haszonelvezet(adat, { ertek: 50e6, kor }).jog;
  assert.deepEqual([24, 25, 50, 51, 65, 66].map(sav), [25e6, 20e6, 20e6, 15e6, 15e6, 10e6]); // Árbecslő: 25, 20, 15, 10 millió
  assert.equal(S.haszonelvezet(adat, { ertek: 50e6, tipus: 'hatarozott', evek: 10 }).jog, 25e6);
  assert.equal(S.haszonelvezet(adat, { ertek: 50e6, tipus: 'hatarozott', evek: 30 }).jog, 50e6, 'legfeljebb a 20-szoros');
  assert.equal(S.haszonelvezet(adat, { ertek: 50e6, tipus: 'hatarozott', evek: 15, kor: 70 }).jog, 10e6, 'legfeljebb az életkor szerinti szorzó');
  assert.equal(S.haszonelvezet(adat, { ertek: 50e6, tipus: 'hatarozatlan' }).jog, 12.5e6);
  const r = S.haszonelvezet(adat, { ertek: 50e6, kor: 70 });
  assert.equal(r.esetek[0].ado, 1600000); assert.equal(r.esetek[1].ado, 900000); assert.equal(r.esetek[2].ado, 400000);
  assert.ok(S.haszonelvezet(adat, { ertek: 50e6, kor: 70, rokon: true }).esetek.slice(1).every((e) => e.ado === 0));
});

test('előtörlesztés: a futamidő rövidítése spórol többet, a díj levonva', () => {
  const r = S.elotorlesztes(adat, { toke: 20e6, kamat: 6, honap: 240, osszeg: 3e6 });
  assert.equal(r.havi, 143286); assert.equal(r.dij, 30000); assert.equal(r.jobb, 'futamido');
  assert.ok(r.futamido.megtakaritas > r.torleszto.megtakaritas);
  assert.equal(r.torleszto.havi, Math.round(S.torlesztoKamatbol(17e6, 240, 6)));
  assert.equal(S.elotorlesztes(adat, { toke: 20e6, kamat: 6, honap: 240, osszeg: 3e6, dij: 0 }).dij, 0);
  assert.match(S.elotorlesztes(adat, { toke: 1e6, kamat: 6, honap: 12, osszeg: 1e6 }).hiba, /végtörlesztés/);
});

test('bérleti díj emelése: a KSH éves átlagával vagy saját mértékkel', () => {
  assert.equal(S.berletiEmeles(adat, { dij: 250000 }).p, 4.4);
  assert.equal(S.berletiEmeles(adat, { dij: 250000 }).uj, 261000);
  assert.equal(S.berletiEmeles(adat, { dij: 250000, ev: '2023' }).uj, 294000);
  assert.equal(S.berletiEmeles(adat, { dij: 200000, sajat: 5 }).uj, 210000);
  for (const [e, x] of Object.entries(adat.inflacio.evek)) assert.ok(/^\d{4}$/.test(e) && x.forras.url.startsWith('https://') && x.szazalek > -5 && x.szazalek < 30);
});

test('hozam: befektetés illetékkel, nettó a jobbik adózással', () => {
  const r = S.hozam(adat, { vetelar: 50e6, havi: 220000, koltseg: 400000 });
  assert.equal(r.beruhazas, 52e6); assert.equal(r.bevetel, 2420000); assert.equal(r.ado, 303000); assert.equal(r.netto, 1717000);
  assert.equal(Math.round(r.brutto * 100), 465);
});
