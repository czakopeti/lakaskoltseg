// A KSH lakásár-idősor a bérlés vagy vétel kalkulátorban: átlagos évi változás településtípusonként, és az alapeset választása.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../forras/js/szamitas.mjs';
import * as M from '../forras/js/megjelenites.mjs';
import { betoltAdat } from '../forras/adat.mjs';

const adat = betoltAdat();
const alap = { vetelar: 50e6, onero: 10e6, berlet: 220000, kozos: 25000, evek: 10, karbantartas: 0 };

test('az évi átlagos változás a KSH idősorból (Budapest, 2007–2025: 266 → 1194 ezer Ft/m²)', () => {
  const t = S.lakasarTrend({ lakasar: { evek: [2007, 2025], hasznalt: { fovaros: [266, 1194] } } }, 'fovaros');
  assert.ok(Math.abs(t.hosszu - 8.70) < 0.01);
  assert.equal(S.lakasarTrend(adat, 'nincsilyen'), null);
  for (const k of ['fovaros', 'megyeszekhely', 'varos', 'kozseg', 'orszag']) {
    const r = S.lakasarTrend(adat, k);
    assert.ok(r.hosszu > -5 && r.hosszu < 20, k);
    assert.equal(r.ig - r.tizTol, 10);
  }
});

test('ha megadod, hol van a lakás, a lakásár alapesete a KSH-átlag; a beírt érték és az üres választás nem változik', () => {
  const inf = S.berlesVetel(adat, alap);
  const bp = S.berlesVetel(adat, { ...alap, telepules: 'fovaros' });
  const t = S.lakasarTrend(adat, 'fovaros');
  assert.equal(bp.arNo, Math.round(t.hosszu * 10) / 10);
  assert.equal(bp.berNo, inf.berNo, 'a bérleti díj továbbra is az inflációval nő');
  assert.equal(inf.arNo, inf.infSz);
  assert.equal(S.berlesVetel(adat, { ...alap, telepules: 'fovaros', arNo: 2 }).arNo, 2);
  assert.ok(bp.alap.vetel > inf.alap.vetel, 'gyorsabb áremelkedésnél a vétel vagyona nagyobb');
  const html = M.berlesVetelPanel(adat, bp);
  assert.match(html, /KSH adatából jön[\s\S]*Budapesten 2007 és 20\d\d között/);
  assert.match(html, /a lakásár évente [\d,]+%-kal, a bérleti díj [\d,]+%-kal nő/);
  assert.doesNotMatch(M.berlesVetelPanel(adat, inf), /KSH adatából jön/);
});

test('illeték: a négyzetméterár összevetése a KSH szerinti környékbeli átlaggal', () => {
  const la = adat.lakasar, n = la.evek.length - 1;
  // Miskolc környéki város, 55 m², 6 millió: Észak-Magyarország városainak átlaga ennél jóval nagyobb
  const r = S.illetek(adat, { ertek: 6e6, terulet: 55, megye: 'borsod', telepTipus: 'varos' });
  const atlag = la.hasznaltRegio.eszak_magyarorszag.varos[n] * 1000;
  assert.equal(r.forgalmi.atlag, atlag);
  assert.equal(r.forgalmi.m2, Math.round(6e6 / 55));
  assert.equal(r.forgalmi.alacsony, 6e6 / 55 < atlag * 0.5);
  assert.match(r.forgalmi.hol, /Észak-Magyarországon, a városokban/);
  // Budapest: a településtípust nem kell megadni
  const bp = S.illetek(adat, { ertek: 30e6, terulet: 55, megye: 'budapest' });
  assert.equal(bp.forgalmi.hol, 'Budapesten');
  assert.ok(bp.forgalmi.alacsony, '545 ezer Ft/m² a budapesti átlag fele alatt');
  assert.ok(!S.illetek(adat, { ertek: 70e6, terulet: 55, megye: 'budapest' }).forgalmi.alacsony);
  // Pest megyében nincs megyeszékhely: a városok átlaga
  assert.equal(S.illetek(adat, { ertek: 30e6, terulet: 60, megye: 'pest', telepTipus: 'megyeszekhely' }).forgalmi.atlag, la.hasznaltRegio.pest.varos[n] * 1000);
  // Új lakás vállalkozótól: az új lakások átlaga
  assert.equal(S.illetek(adat, { ertek: 60e6, terulet: 50, megye: 'budapest', ujVallalkozotol: true }).forgalmi.uj, true);
  // Hiányos adat: nincs összevetés, vagy kéri a településtípust
  assert.equal(S.illetek(adat, { ertek: 30e6, megye: 'budapest' }).forgalmi, null);
  assert.match(S.illetek(adat, { ertek: 30e6, terulet: 50, megye: 'zala' }).forgalmi.hiany, /milyen településen/);
  const html = M.illetekPanel(adat, bp);
  assert.match(html, /Elfogadja a NAV a vételárat\?[\s\S]*Itv\. 70\. §[\s\S]*33\/2007/);
  assert.doesNotMatch(M.illetekPanel(adat, S.illetek(adat, { ertek: 30e6 })), /Elfogadja a NAV/);
});
