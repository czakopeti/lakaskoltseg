// Az illeték, a Wekerle Plusz, a lakáskiadás és a lakásváltás számításai, közölt példákkal és kézzel ellenőrzött esetekkel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { betoltAdat } from '../forras/adat.mjs';
import * as S from '../forras/js/szamitas.mjs';
import * as M from '../forras/js/megjelenites.mjs';

const adat = { ...betoltAdat(), ev: 2026 };

test('illeték: általános, cserét pótló, új lakás, 35 év alatti első lakás, hányad, nagy érték', () => {
  assert.equal(S.illetek(adat, { ertek: 50e6 }).ado, 2000000); // Bankmonitor: 50 milliónál 2 millió
  assert.equal(S.illetek(adat, { ertek: 60e6, eladottErtek: 45e6, eladasMikor: 'elotte' }).ado, 600000);
  assert.equal(S.illetek(adat, { ertek: 40e6, eladottErtek: 45e6, eladasMikor: 'utana' }).ado, 0);
  assert.equal(S.illetek(adat, { ertek: 60e6, eladottErtek: 45e6, eladasMikor: 'regebben' }).ado, 2400000);
  assert.equal(S.illetek(adat, { ertek: 14e6, ujVallalkozotol: true }).ado, 0);
  assert.equal(S.illetek(adat, { ertek: 25e6, ujVallalkozotol: true }).ado, 400000);
  assert.equal(S.illetek(adat, { ertek: 35e6, ujVallalkozotol: true }).ado, 1400000); // Ingatlan.com: 35 milliós új lakásnál 1,4 millió
  assert.equal(S.illetek(adat, { ertek: 15e6, elso: true, fiatal35: true }).ado, 300000); // Privátbankár: 15 milliónál 300 000
  assert.equal(S.illetek(adat, { ertek: 16e6, elso: true, fiatal35: true }).ado, 640000);
  assert.equal(S.illetek(adat, { ertek: 60e6, hanyad: 50 }).ado, 1200000);
  assert.equal(S.illetek(adat, { ertek: 60e6, csok: true }).ado, 0);
  assert.equal(S.illetek(adat, { ertek: 2e9 }).ado, 60000000);
  assert.equal(S.altalanosIlletek(adat, 20e9), 200000000);
  const r = S.illetek(adat, { ertek: 60e6, eladottErtek: 45e6, eladasMikor: 'elotte', rokon: true });
  assert.equal(r.legjobb.kulcs, 'egyenesagi');
  assert.match(S.illetek(adat, {}).hiba, /vételárát/);
});

test('Wekerle Plusz: törlesztők (Bankmonitor és BiztosDöntés közölt számai), feltételek', () => {
  assert.equal(S.wekerle(adat, { vetelar: 40e6, onero: 10e6, allapot: 'uj' }).havi, 142263);
  assert.equal(S.wekerle(adat, { vetelar: 40e6, onero: 10e6, allapot: 'hasznalt' }).havi, 175377);
  assert.equal(S.wekerle(adat, { vetelar: 60e6, onero: 10e6, allapot: 'hasznalt' }).havi, 292295);
  const ok = S.wekerle(adat, { vetelar: 62e6, alapterulet: 54, onero: 12e6, eletkor: 31, tulajdon: 'nincs', ingatlan: 'lakas', allapot: 'hasznalt' });
  assert.equal(ok.jogosult, true);
  const nem = S.wekerle(adat, { vetelar: 80e6, alapterulet: 50, onero: 5e6, eletkor: 45, tulajdon: 'van', ingatlan: 'lakas' });
  assert.deepEqual(nem.nemOk.map((x) => x.kulcs).sort(), ['eletkor', 'nmar', 'onero', 'osszeg', 'tulajdon']);
  assert.equal(S.wekerle(adat, { vetelar: 110e6, ingatlan: 'haz' }).feltetelek.find((x) => x.kulcs === 'vetelar').ok, true);
  assert.equal(S.wekerle(adat, { vetelar: 110e6, ingatlan: 'lakas' }).feltetelek.find((x) => x.kulcs === 'vetelar').ok, false);
  assert.equal(S.wekerle(adat, { vetelar: 40e6, eletkor: 30, eletkor2: 46 }).feltetelek[0].ok, false, 'közös igénylésnél mindkettőre');
  assert.equal(S.wekerle(adat, { vetelar: 40e6 }).jogosult, null, 'hiányzó adatnál nincs döntés');
  assert.equal(S.wekerle(adat, { vetelar: 60e6 }).illetek, 2400000, 'a hitel nem ad illetékmentességet');
});

test('lakáskiadás: a két módszer, a döntési pont, a határidők', () => {
  const r = S.berbeadas(adat, { havi: 250000, koltseg: 400000, ev: 2026 });
  assert.equal(r.A.ado, 405000); assert.equal(r.B.ado, 390000); assert.equal(r.jobb, 'teteles'); assert.equal(r.dontesiPont, 300000);
  assert.equal(S.berbeadas(adat, { havi: 250000, koltseg: 200000 }).jobb, 'koltseghanyad');
  const b = S.berbeadas(adat, { havi: 250000, berelt: 1200000 });
  assert.equal(b.alap, 1800000); assert.equal(b.A.ado, 243000);
  assert.deepEqual(r.elolegek.map((x) => x.nap), ['2026-04-12', '2026-07-12', '2026-10-12', '2027-01-12']);
  assert.equal(r.bevallas, '2027-05-20');
  assert.match(S.berbeadas(adat, { havi: 1, honap: 13 }).hiba, /12 között/);
  const ics = S.naptarFajl({ esemenyek: r.elolegek.map((e) => ({ nap: e.nap, cim: 'Előleg' })) });
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 4);
});

test('lakásváltás: kézhez, kell, hiány, illeték a cserét pótló vétellel', () => {
  const r = S.lakasvaltas(adat, { eladasiAr: 60e6, szerzesEv: 2019, szerzesiErtek: 35e6, kozvetito: 1.8e6, hitelTartozas: 8e6, vetelar: 85e6, vetelKoltseg: 900000, megtakaritas: 5e6, eladasEv: 2026 });
  assert.equal(r.kapsz, 50200000); assert.equal(r.kell, 86900000); assert.equal(r.hiany, 31700000);
  assert.equal(r.illetek.ado, 1000000); assert.equal(r.illetekMegtakaritas, 2400000);
  const friss = S.lakasvaltas(adat, { eladasiAr: 60e6, szerzesEv: 2024, szerzesiErtek: 50e6, vetelar: 50e6, eladasEv: 2026 });
  assert.equal(friss.szja.ado, 1350000); assert.equal(friss.illetek.ado, 0); assert.ok(friss.hiany < 0);
});

test('minden kalkulátor üresen címkézett mintát mutat, kitöltve a saját adatot', () => {
  for (const t of Object.keys(M.KALKULATOROK)) {
    const u = M.kalkHtml(t, adat, {});
    assert.ok(u.minta && u.html.includes('minta-jelzes') && u.html.includes('data-osszeg'), t);
  }
  const k = M.kalkHtml('illetek', adat, { ertek: '50000000' });
  assert.ok(!k.minta && k.html.includes('data-osszeg="2000000"'));
});

test('illeték: telek 4 éven belüli építéssel, haszonélvezettel terhelt vétel', () => {
  assert.equal(S.illetek(adat, { ertek: 20e6, telek: true }).ado, 0);
  const r = S.illetek(adat, { ertek: 50e6, haszonelvezoKor: 70 });
  assert.equal(r.alap, 40e6); assert.equal(r.ado, 1600000);
});

test('minden kalkulátor eredménye levezetést ad, a látogató számaival', () => {
  for (const t of Object.keys(M.KALKULATOROK)) {
    const h = M.kalkHtml(t, adat, {}).html;
    assert.match(h, /class="levezetes"/, t);
    assert.ok((h.match(/<li><span class="lv-mi">/g) || []).length >= 1, t);
  }
  assert.match(M.kalkHtml('eladas', adat, { eladasiAr: '60000000', szerzesiErtek: '50000000', szerzesKoltseg: '2000000', szerzesEv: '2024', eladasEv: '2026' }).html, /8\u00a0000\u00a0000&nbsp;Ft × 90% = 7\u00a0200\u00a0000&nbsp;Ft/);
});
