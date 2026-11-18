// A szabályfájl: minden tételnek van forrása, dátuma és ellenőrzési szintje, és a kulcsszámok egyeznek a forrásokkal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { betoltAdat } from '../forras/adat.mjs';
import * as S from '../forras/js/szamitas.mjs';

const adat = betoltAdat();
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

test('minden szabálynak van jogszabályhelye, forrása, dátuma és szintje', () => {
  const kulcsok = new Set();
  for (const t of adat.szabalyok.temak) {
    assert.ok(t.id && t.cim && t.tetelek.length, t.id);
    for (const x of t.tetelek) {
      const k = `${t.id}.${x.kulcs}`;
      assert.ok(!kulcsok.has(k), `kétszer szerepel: ${k}`); kulcsok.add(k);
      assert.ok(x.nev && x.szoveg && x.jogszabaly, `hiányos: ${k}`);
      assert.match(x.forras.url, /^https:\/\//, `forrás: ${k}`);
      assert.ok(x.forras.nev, `forrásnév: ${k}`);
      assert.ok(x.forras.kelt === '' || DATUM.test(x.forras.kelt), `forrás kelte: ${k}`);
      assert.match(x.ellenorizve, DATUM, `ellenőrzés napja: ${k}`);
      assert.ok(['elsodleges', 'masodlagos'].includes(x.szint), `szint: ${k}`);
      assert.ok(!/nem [^.]*, hanem /.test(x.szoveg) && !/: [a-zíéáőúűöüó]+\.$/.test(x.szoveg), `szövegstílus: ${k}`);
    }
  }
  for (const n of adat.szabalyok.nyitott) assert.ok(n.mi && n.teendo && DATUM.test(n.rogzitve));
});

test('a kulcsszámok a forrás szerintiek', () => {
  assert.equal(S.szabaly(adat, 'illetek.altalanos_mertek').ertek.szazalek, 4);
  assert.deepEqual(S.szabaly(adat, 'szja_eladas.jovedelem_hanyad').ertek.szazalek_evenkent, [100, 100, 90, 60, 30, 0]);
  assert.equal(S.szabaly(adat, 'szja_eladas.ado_mertek').ertek.szazalek, 15);
  const wp = (k) => S.szabaly(adat, `wekerle_plusz.${k}`).ertek;
  assert.deepEqual(wp('eletkor'), { tol: 18, ig: 45 });
  assert.deepEqual(wp('kamat'), { uj_szazalek: 3, hasznalt_szazalek: 5 });
  assert.throws(() => S.szabaly(adat, 'illetek.nincs_ilyen'));
});

test('törlesztő: 30 millió forint 25 évre a Wekerle Plusz két kamatával (a Bankmonitor közölt számaival egyezik)', () => {
  assert.equal(Math.round(S.torlesztoKamatbol(30e6, 300, 3)), 142263);
  assert.equal(Math.round(S.torlesztoKamatbol(30e6, 300, 5)), 175377);
  assert.equal(S.torlesztoKamatbol(12e6, 120, 0), 100000);
});

test('összeg betűvel (szerződéshez)', () => {
  assert.equal(S.betuvel(45500000), 'negyvenötmillió-ötszázezer');
});
