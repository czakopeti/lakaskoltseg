// Ingatlaneladás szja-ja: a NAV skálája szerint, ismert példákkal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { betoltAdat } from '../forras/adat.mjs';
import * as S from '../forras/js/szamitas.mjs';
import * as M from '../forras/js/megjelenites.mjs';

const adat = betoltAdat();
const alap = { eladasEv: 2026, eladasiAr: 60000000, szerzesiErtek: 50000000, szerzesKoltseg: 2000000 };

test('2024-es szerzés, 2026-os eladás: 8 millió számított összeg 90%-a a jövedelem (a cldhome.com közölt példája)', () => {
  const r = S.eladasSzja(adat, { ...alap, szerzesEv: 2024 });
  assert.equal(r.szamitott, 8000000);
  assert.equal(r.hanyad, 90);
  assert.equal(r.jovedelem, 7200000);
  assert.equal(r.ado, 1080000);
  assert.equal(r.bevallas, '2027-05-20');
  assert.equal(r.mentesEv, 2029);
  assert.equal(r.jovoreAdo, 720000);
});

test('a skála évenként: 100, 100, 90, 60, 30, 0 (NAV, 2026-os eladásra: 2025 → 100%, 2022 → 30%, 2021 → 0%)', () => {
  const szazalek = (szerzesEv) => S.eladasSzja(adat, { ...alap, szerzesEv }).hanyad;
  assert.deepEqual([2026, 2025, 2024, 2023, 2022, 2021, 2005].map(szazalek), [100, 100, 90, 60, 30, 0, 0]);
  assert.equal(S.eladasSzja(adat, { ...alap, szerzesEv: 2021 }).ado, 0);
});

test('a költség legfeljebb az eladási árig számolható el, veszteségnél nincs adó', () => {
  const r = S.eladasSzja(adat, { eladasEv: 2026, szerzesEv: 2025, eladasiAr: 40000000, szerzesiErtek: 45000000, beruhazas: 3000000 });
  assert.equal(r.szamitott, 0); assert.equal(r.ado, 0); assert.ok(r.levagva && r.veszteseg);
});

test('500 000 forintig részletfizetés jár, felette nem', () => {
  assert.equal(S.eladasSzja(adat, { eladasEv: 2026, szerzesEv: 2025, eladasiAr: 33000000, szerzesiErtek: 30000000 }).reszletben, 12);
  assert.equal(S.eladasSzja(adat, { ...alap, szerzesEv: 2024 }).reszletben, 0);
});

test('hiányzó és ellentmondó adat', () => {
  assert.match(S.eladasSzja(adat, { szerzesEv: 2024 }).hiba, /eladási árat/);
  assert.match(S.eladasSzja(adat, { ...alap, szerzesEv: '' }).hiba, /melyik évben/);
  assert.match(S.eladasSzja(adat, { ...alap, szerzesEv: 2027 }).hiba, /nem lehet későbbi/);
  assert.match(S.eladasSzja(adat, { eladasEv: 2026, szerzesEv: 2024, eladasiAr: 1, szerzesiErtek: '' }).hiba, /mennyiért/);
});

test('a panel: végösszeg, forrásjelölés, határidő a naptárba', () => {
  const h = M.eladasPanel(adat, S.eladasSzja(adat, { ...alap, szerzesEv: 2024 }));
  assert.match(h, /data-osszeg="1080000"/);
  assert.match(h, /jel-hivatalos" href="https:\/\/nav\.gov\.hu/);
  assert.match(h, /2027\. május 20-ig/);
  assert.match(h, /data-naptar="2027-05-20"/);
  assert.match(h, /2027-ben adnád el, az adó 720\u00a0000/);
  assert.ok(!M.eladasPanel(adat, S.eladasSzja(adat, { ...alap, szerzesEv: 2020 })).includes('data-naptar'));
});

test('naptárfájl: egész napos esemény, egy héttel előtte emlékeztető', () => {
  const f = S.naptarFajl({ nap: '2027-05-20', cim: 'Szja; bevallás', leiras: 'a' });
  assert.match(f, /DTSTART;VALUE=DATE:20270520\r\nDTEND;VALUE=DATE:20270521/);
  assert.match(f, /SUMMARY:Szja\\; bevallás/);
  assert.match(f, /TRIGGER:-P7D/);
});
