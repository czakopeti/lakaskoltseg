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

// A KSH lak0025 tábla két lehetséges HTML-alakja: régiónként ismételt cella, illetve rowspan (a régió csak az első sorban)
const evekFej = '<tr><th>Region</th><th>Settlement type</th><th>2023</th><th>2024</th><th>2025</th></tr>';
const sorok = (reszek, rowspan) => reszek.map(([cim, ertekek]) => `<tr><td colspan="5">${cim}</td></tr>` + ['capital', 'county seats', 'towns', 'villages', 'total'].map((t, i) => `<tr>${!rowspan || i === 0 ? `<th${rowspan ? ' rowspan="5"' : ''}>Country</th>` : ''}<td>${t}</td>${ertekek[i].map((x) => `<td class="${x === '1,194' ? 'elozetes' : ''}">${x}</td>`).join('')}</tr>`).join('')).join('');
const minta = [['Second-hand dwellings', [['887', '977', '1,194'], ['502', '566', '689'], ['335', '402', '479'], ['152', '194', '245'], ['440', '531', '625']]], ['New dwellings<sup>a</sup>', [['1,267', '1,454', '1,610'], ['748', '879', '1,008'], ['800', '905', '1,049'], ['677', '761', '944'], ['1,004', '1,167', '..']]]];
const budapestSor = '<tr><td>Budapest</td><td>capital</td><td>1</td><td>2</td><td>3</td></tr>';

test('KSH lakásár-tábla: az országos sorok településtípusonként, mindkét HTML-alakban', async () => {
  const { kshLakasar } = await import('../frissito/automata.mjs');
  for (const rowspan of [false, true]) {
    const r = kshLakasar(`<table>${evekFej}${budapestSor}${sorok(minta, rowspan)}</table>`);
    assert.deepEqual(r.evek, [2023, 2024, 2025]);
    assert.deepEqual(r.hasznalt.fovaros, [887, 977, 1194]);
    assert.deepEqual(r.hasznalt.kozseg, [152, 194, 245]);
    assert.deepEqual(r.uj.orszag, [1004, 1167, null], 'a „..” hiányzó adat');
  }
  assert.equal(kshLakasar('<table><tr><td>Nincs adat</td></tr></table>'), null);
  assert.equal(kshLakasar(`<table>${evekFej}${sorok(minta.slice(0, 1), false)}</table>`), null, 'ha az új lakások hiányoznak, inkább semmi');
});

test('KSH lakásár-tábla: hihetőségi őr', async () => {
  const { kshLakasar, lakasarHiheto } = await import('../frissito/automata.mjs');
  const regi = { evek: [2023, 2024], hasznalt: { fovaros: [887, 977], megyeszekhely: [502, 566], varos: [335, 402], kozseg: [152, 194], orszag: [440, 531] }, uj: { fovaros: [1267, 1454], megyeszekhely: [748, 879], varos: [800, 905], kozseg: [677, 761], orszag: [1004, 1167] } };
  const uj = kshLakasar(`<table>${evekFej}${sorok(minta, false)}</table>`);
  assert.equal(lakasarHiheto(regi, uj), null, 'új év, hihető ugrás');
  const ugras = structuredClone(uj); ugras.hasznalt.fovaros[2] = 2500;
  assert.match(lakasarHiheto(regi, ugras), /2025, fovaros: 977 után 2500/);
  const atiras = structuredClone(uj); atiras.hasznalt.varos[0] = 200;
  assert.match(lakasarHiheto(regi, atiras), /2023, varos: 335 helyett 200/);
  assert.match(lakasarHiheto({ ...regi, evek: [2022, 2023, 2024] }, uj), /hiányzik egy korábbi év/);
});
