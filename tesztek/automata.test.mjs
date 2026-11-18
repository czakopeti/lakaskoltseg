// Önálló frissítők: a KSH éves infláció és a PMÁP-kamat kiolvasása, hihetőségi őr, és hogy a figyelő nem nyit jegyet arról, amit ezek kezelnek.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kshEvesInflacio, kshUrl, pmapKamat, hiheto, jegySzoveg } from '../frissito/automata.mjs';
import { forrasLista } from '../frissito/figyelo.mjs';
import { olvas } from '../forras/adat.mjs';

// A KSH valódi közléseinek szövege (2026. január 13., illetve 2025. január 14.)
const ksh2025 = `<html><head><title>Prices increase by 3.3% in December and by 4.4% on average in 2025</title></head><body><nav>Menu</nav>
<h1>Prices increase by 3.3% in December and by 4.4% on average in 2025</h1>
<p>In December 2025, consumer prices were 3.3% higher on average than a year earlier and 0.1% higher than in the previous month. In 2025, prices were up by 4.4% on average compared to the previous year.</p></body></html>`;
const ksh2024 = `<h1>Prices 4.6% higher in December and 3.7% higher on average in 2024</h1><p>In 2024, prices were up by 3.7% on average compared to the previous year.</p>`;

test('KSH: az éves átlag kiolvasása a decemberi közlésből', () => {
  assert.equal(kshEvesInflacio(ksh2025, '2025'), 4.4);
  assert.equal(kshEvesInflacio(ksh2024, '2024'), 3.7);
  assert.equal(kshEvesInflacio('<p>In 2023, prices were down by 0.4% on average compared to the previous year.</p>', '2023'), -0.4);
  assert.equal(kshEvesInflacio(ksh2025, '2024'), null, 'más év nem keveredhet bele');
  assert.equal(kshEvesInflacio('<p>Consumer prices 2.1% higher on average than in same month of previous year</p>', '2025'), null, 'havi közlésből nem olvas éves átlagot');
  assert.equal(kshEvesInflacio(ksh2025.replace('up by 4.4%', 'up by 4.5%'), '2025'), null, 'ha a cím és a szöveg ellentmond, inkább semmi');
  assert.equal(kshUrl('2026'), 'https://www.ksh.hu/en/first-releases/far/efar2612.html');
});

test('PMÁP: a meghirdetett kamat az Államkincstár oldaláról', () => {
  assert.equal(pmapKamat('<div><span>KAMAT:</span> <strong>4,50%</strong></div><div>FUTAMIDŐ: 10 év</div>'), 4.5);
  assert.equal(pmapKamat('<p>KAMAT: 10,25 %</p>'), 10.25);
  assert.equal(pmapKamat('<p>A kifizetendő kamat mértéke a kamatbázisból adódik.</p>'), null);
});

test('hihetőségi őr: tartomány és ugrás', () => {
  const h = { min: 0, max: 30, ugras: 8 };
  assert.ok(hiheto(5.1, 4.5, h));
  assert.ok(hiheto(15, null, h), 'régi érték nélkül csak a tartomány számít');
  assert.ok(!hiheto(45, 4.5, h));
  assert.ok(!hiheto(13, 4.5, h), 'túl nagy ugrás');
  assert.ok(!hiheto(NaN, 4.5, h));
});

test('a jegy csak gond esetén íródik', () => {
  assert.equal(jegySzoveg({ gond: [] }), '');
  assert.match(jegySzoveg({ gond: [{ nev: 'X', url: 'https://x.hu', ok: 'nincs' }] }), /régi érték maradt[\s\S]*\[X\]\(https:\/\/x\.hu\)/);
});

test('a figyelő gépi frissítésűnek tudja a PMÁP-oldalt, a többi forrást nem', () => {
  const l = forrasLista(olvas('data/szabalyok.json'), olvas('data/figyelo.json').kulon);
  const pmap = l.find((x) => x.szabalyok.includes('berles_vetel.allampapir'));
  assert.equal(pmap.automata, true);
  assert.equal(l.filter((x) => x.automata).length, 1);
  assert.ok(Array.isArray(olvas('data/valtozasok.json').bejegyzesek));
});
