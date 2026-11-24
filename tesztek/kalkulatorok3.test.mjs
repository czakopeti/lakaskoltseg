// Az okosan-elek.hu összevetése után bővített és új kalkulátorok: publikált példákkal és belső ellenőrzésekkel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as S from '../forras/js/szamitas.mjs';
import * as M from '../forras/js/megjelenites.mjs';

const adat = { szabalyok: JSON.parse(readFileSync(new URL('../data/szabalyok.json', import.meta.url))), inflacio: JSON.parse(readFileSync(new URL('../data/inflacio.json', import.meta.url))), ev: 2026, ma: '2026-11-18' };

test('eladás adója: az okosan-elek.hu példája (50 M, 2023 → 2026, 30 M szerzés, 3 M beruházás, 0,5 M átruházás)', () => {
  const r = S.eladasSzja(adat, { eladasiAr: 50e6, szerzesEv: 2023, eladasEv: 2026, szerzesiErtek: 30e6, beruhazas: 3e6, eladasKoltseg: 5e5 });
  assert.equal(r.szamitott, 16.5e6);
  assert.equal(r.jovedelem, 9.9e6);
  assert.equal(r.ado, 1485000);
  assert.equal(r.megmarad, 50e6 - 5e5 - 1485000);
});

test('állagmegóvás: a NAV füzetének példája, 24 M eladásnál az 500 ezres festés nem vonható le', () => {
  const alap = { eladasiAr: 24e6, szerzesEv: 2024, eladasEv: 2026, szerzesiErtek: 16e6 };
  const nem = S.eladasSzja(adat, { ...alap, allagmegovas: 5e5 });
  assert.equal(nem.allagHatar, 1.2e6);
  assert.equal(nem.allagJar, false);
  assert.equal(nem.tetelek.allagmegovas, 0);
  const igen = S.eladasSzja(adat, { ...alap, allagmegovas: 1.3e6 });
  assert.equal(igen.allagJar, true);
  assert.equal(igen.szamitott, 24e6 - 16e6 - 1.3e6);
  // pontosan 5% még nem elég: meg kell haladnia
  assert.equal(S.eladasSzja(adat, { ...alap, allagmegovas: 1.2e6 }).allagJar, false);
});

test('nem állapítható meg a szerzési érték: az ár 25%-a a számított összeg, költség nélkül, időmúlással', () => {
  const r = S.eladasSzja(adat, { eladasiAr: 50e6, szerzesEv: 2023, eladasEv: 2026, ismeretlen: true, beruhazas: 9e6 });
  assert.equal(r.szamitott, 12.5e6);
  assert.equal(r.jovedelem, 7.5e6);
  assert.equal(r.ado, 1125000);
  assert.ok(S.eladasSzja(adat, { eladasiAr: 50e6, szerzesEv: 2023, eladasEv: 2026 }).hiba);
});

test('közjegyzői munkadíj a díjszabás sávjai szerint', () => {
  assert.equal(S.kozjegyzoDij(adat, 20e6), 115000); // Bankmonitor: 20 milliós piaci hitelnél akár 115 000 Ft
  assert.equal(S.kozjegyzoDij(adat, 8e6), 80000);
  assert.equal(S.kozjegyzoDij(adat, 3e6), 45000);
  assert.equal(S.kozjegyzoDij(adat, 20e6, true), 17250);
});

test('induló költség: tételek, időrend és önerőkorlát', () => {
  const r = S.indulo(adat, { vetelar: 50e6, hitel: 40e6, megtakaritas: 12e6 });
  assert.equal(r.onero, 10e6);
  assert.equal(r.illetek.ado, 2e6);
  assert.equal(r.osszes, 10e6 + 2e6 + 500000 + 10600 + 55000 + 165000 + 150000 + 24800);
  assert.equal(r.hiany, r.osszes - 12e6);
  assert.equal(r.lepesek.reduce((x, l) => x + l.ft, 0), r.osszes, 'az időrend összege az egész');
  assert.equal(r.lepesek[0].ft, 5e6 + 500000 + 10600);
  // 80% felett a bank nem ad, első lakásnál 90%-ig
  assert.equal(S.indulo(adat, { vetelar: 50e6, hitel: 41e6 }).hfmFelett, true);
  assert.equal(S.indulo(adat, { vetelar: 50e6, hitel: 41e6, elso: true }).hfmFelett, false);
  // hitel nélkül nincs hiteldíj, új lakásnál 0,5% ügyvéd és a 15 milliós mentes rész
  const k = S.indulo(adat, { vetelar: 25e6, kitol: 'vallalkozo' });
  assert.equal(k.tetelek.length, 2);
  assert.equal(k.tetelek[0].ft, 125000);
  assert.ok(k.illetek.ado < S.altalanosIlletek(adat, 25e6));
  // a beírt összeg felülírja a becslést
  assert.equal(S.indulo(adat, { vetelar: 50e6, hitel: 40e6, folyositas: 0 }).tetelek.find((t) => t.kulcs === 'folyositas').ft, 0);
  // támogatott hitel: közjegyző 15%, banki díj legfeljebb 30 000 Ft
  const t = S.indulo(adat, { vetelar: 50e6, hitel: 40e6, tamogatott: true });
  assert.equal(t.tetelek.find((x) => x.kulcs === 'kozjegyzo').ft, Math.round(165000 * 0.15));
  assert.equal(t.tetelek.find((x) => x.kulcs === 'folyositas').ft, 30000);
});

test('bérlés vagy vétel: növekedés és hozam nélkül a vagyon kézzel ellenőrizhető', () => {
  const r = S.berlesVetel(adat, { vetelar: 40e6, onero: 40e6, berlet: 200000, evek: 5, arNo: 0, berNo: 0, hozam: 0, karbantartas: 0 });
  assert.equal(r.hitel, 0);
  // a vevő nem fizet semmit havonta, ezért a bérleti díjat félreteszi; a bérlő a kezdő pénzt tartja
  assert.equal(r.alap.vetel, 40e6 + 200000 * 12 * 5);
  assert.equal(r.alap.berles, r.kezdo);
  assert.equal(r.kezdo, S.indulo(adat, { vetelar: 40e6 }).osszes);
});

test('bérlés vagy vétel: a forgatókönyvek sorrendje és a hitel lefutása', () => {
  const r = S.berlesVetel(adat, { vetelar: 50e6, onero: 10e6, berlet: 220000, kozos: 25000, evek: 25, futamido: 20, karbantartas: 0 });
  const [b, a, d] = r.forgatokonyvek;
  assert.ok(b.vetel < a.vetel && a.vetel < d.vetel);
  assert.equal(b.berles, a.berles, 'karbantartás nélkül a bérlő vagyonát a lakásár nem befolyásolja');
  assert.equal(a.tartozas, 0, '20 év után a hitel elfogyott');
  assert.equal(r.forgatokonyvek[1].arNo, adat.inflacio.evek[Object.keys(adat.inflacio.evek).sort().pop()].szazalek);
  assert.ok(S.berlesVetel(adat, { vetelar: 50e6, berlet: 200000 }).hiba);
});

test('hozam hitellel: a pénzáram a nettóból a törlesztő, és összevetés az állampapírral', () => {
  const r = S.hozam(adat, { vetelar: 48e6, havi: 230000, honap: 11, koltseg: 450000, hitel: 30e6, kamat: 6, futamido: 20 });
  assert.equal(r.hitel.havi, Math.round(S.torlesztoKamatbol(30e6, 240, 6)));
  assert.equal(r.hitel.penzaram, Math.round(r.netto - S.torlesztoKamatbol(30e6, 240, 6) * 12));
  assert.equal(r.allampapir.alap, r.hitel.onero);
  assert.equal(r.allampapir.kamat, Math.round(r.hitel.onero * 0.045));
  const h = S.hozam(adat, { vetelar: 48e6, havi: 230000 });
  assert.equal(h.hitel, null);
  assert.equal(h.allampapir.alap, h.beruhazas);
});

test('az új panelek mintával és kitöltve is rendereznek', () => {
  for (const t of ['indulo', 'berlesvetel']) {
    const m = M.kalkHtml(t, adat, {});
    assert.equal(m.minta, true);
    assert.match(m.html, /data-osszeg/);
  }
  assert.match(M.kalkHtml('eladas', adat, { eladasiAr: '24000000', szerzesEv: '2024', szerzesiErtek: '16000000', allagmegovas: '500000' }).html, /nem vonható le/);
  assert.match(M.kalkHtml('eladas', adat, { eladasiAr: '24000000', szerzesEv: '2024', ismeretlen: true }).html, /25%/);
});

test('rövid vagy hosszú távú kiadás: adózási módok, áfahatár, fordulópont', () => {
  const alap = { ejAr: 32000, ejszaka: 20, tartozkodas: 3, takaritas: 8000, rezsi: 35000, kozosEv: 360000, szobak: 1, telepules: 'budapest', hosszuHavi: 260000 };
  const r = S.rovidTav(adat, alap);
  assert.equal(r.rovid.brutto, 32000 * 20 * 12);
  assert.equal(r.rovid.afa, 0, '20 millió alatt alanyi mentes');
  assert.equal(r.rovid.legjobb.kulcs, 'atalany');
  assert.equal(r.rovid.ado, 150000);
  assert.equal(r.rovid.platform, Math.round(r.rovid.brutto * 0.155));
  assert.equal(r.rovid.tfh, Math.round(r.rovid.bevetel * 0.04));
  // vidéken 38 400 Ft szobánként; két lakásnál nincs átalány
  assert.equal(S.rovidTav(adat, { ...alap, telepules: 'mas', szobak: 2 }).rovid.ado, 76800);
  const tobb = S.rovidTav(adat, { ...alap, tobbLakas: true });
  assert.notEqual(tobb.rovid.legjobb.kulcs, 'atalany');
  const t = tobb.rovid.modok.find((m) => m.kulcs === 'teteles');
  assert.equal(t.ado, Math.round((tobb.rovid.bevetel - tobb.rovid.koltseg) * 0.28));
  // 20 millió felett 5% áfa a díjban
  const nagy = S.rovidTav(adat, { ...alap, ejAr: 90000, ejszaka: 25 });
  assert.equal(nagy.rovid.afaKoteles, true);
  assert.equal(nagy.rovid.afa, Math.round(90000 * 25 * 12 * 5 / 105));
  // a fordulóponton a két nettó egyezik
  const f = S.rovidTav(adat, { ...alap, ejszaka: r.fordul });
  assert.ok(f.kulonbseg >= 0, `fordulópont: ${r.fordul}, különbség ${f.kulonbseg}`);
  assert.ok(S.rovidTav(adat, { ...alap, ejszaka: Math.round((r.fordul - 0.1) * 10) / 10 }).kulonbseg < 0, 'egy tizeddel alatta még a hosszú táv nyer');
  // hosszú táv: ugyanaz, mint a kiadás adója kalkulátorban
  assert.equal(r.hosszu.ado, S.berbeadas(adat, { havi: 260000, honap: 12, koltseg: 360000, ev: 2026 }).ado);
  assert.ok(S.rovidTav(adat, { ...alap, ejszaka: 40 }).hiba);
});

test('határesetek: cserét pótló vétel két határideje', () => {
  const ill = (b) => S.illetek(adat, { ertek: 40e6, ...b });
  // drágább új lakás, 3–5 éve eladva: a különbözet után
  assert.equal(ill({ ertek: 60e6, eladottErtek: 40e6, eladasMikor: 'elotte5' }).ado, 800000);
  // olcsóbb új lakás, 3 éven belül: mentes
  assert.equal(ill({ eladottErtek: 50e6, eladasMikor: 'elotte' }).ado, 0);
  // olcsóbb új lakás, 3–5 éve: a törvény betűje szerint nincs mentesség, a teljes 4% jár
  const r = ill({ eladottErtek: 50e6, eladasMikor: 'elotte5' });
  assert.equal(r.ado, 1600000);
  assert.equal(r.lehetosegek.find((x) => x.kulcs === 'cserepotlo').jar, false);
  // a panel jelzi a kettős határidőt
  assert.match(M.kalkHtml('illetek', adat, { ertek: '40000000', eladottErtek: '50000000', eladasMikor: 'elotte5' }).html, /kettős a határidő/);
});

test('határesetek: értékhatárok pontosan a határon', () => {
  const f = S.szabaly(adat, 'illetek.elso_lakas_35').ertek, uj = S.szabaly(adat, 'illetek.uj_lakas').ertek;
  assert.equal(S.illetek(adat, { ertek: f.ertekhatar_ft, elso: true, fiatal35: true }).ado, S.altalanosIlletek(adat, f.ertekhatar_ft) / 2);
  assert.equal(S.illetek(adat, { ertek: f.ertekhatar_ft + 1, elso: true, fiatal35: true }).ado, S.altalanosIlletek(adat, f.ertekhatar_ft + 1));
  assert.equal(S.illetek(adat, { ertek: uj.mentes_resz_ft, ujVallalkozotol: true }).ado, 0);
  assert.equal(S.illetek(adat, { ertek: uj.ertekhatar_ft, ujVallalkozotol: true }).ado, S.altalanosIlletek(adat, uj.ertekhatar_ft - uj.mentes_resz_ft));
  assert.equal(S.illetek(adat, { ertek: uj.ertekhatar_ft + 1, ujVallalkozotol: true }).ado, S.altalanosIlletek(adat, uj.ertekhatar_ft + 1));
  // eladás: a szerzést követő 5. évben már nincs adó, a 4.-ben még van
  assert.equal(S.eladasSzja(adat, { eladasiAr: 50e6, szerzesEv: 2021, eladasEv: 2026, szerzesiErtek: 30e6 }).ado, 0);
  assert.ok(S.eladasSzja(adat, { eladasiAr: 50e6, szerzesEv: 2022, eladasEv: 2026, szerzesiErtek: 30e6 }).ado > 0);
  // a 200 milliós illetékplafon
  assert.equal(S.altalanosIlletek(adat, 20e9), 200e6);
});

test('a bank alacsonyabb értékbecslése több önerőt kér', () => {
  const r = S.indulo(adat, { vetelar: 50e6, hitel: 40e6, bankErtek: 45e6 });
  assert.equal(r.hfmMax, 36e6);
  assert.equal(r.hfmFelett, true);
  assert.equal(S.indulo(adat, { vetelar: 50e6, hitel: 36e6, bankErtek: 45e6 }).hfmFelett, false);
  assert.match(M.kalkHtml('indulo', adat, { vetelar: '50000000', hitel: '40000000', bankErtek: '45000000' }).html, /általa megállapított/);
});

test('becsült eredmény kerekítve, a pontos szám mellette', () => {
  assert.equal(M.kozelitoen(12905400), 'kb. 12,9 millió');
  assert.equal(M.kozelitoen(863160).replace(/\s/g, ' '), 'kb. 863 000');
  const h = M.kalkHtml('indulo', adat, { vetelar: '50000000', hitel: '40000000' }).html;
  assert.match(h, /kb\. 12,9 millió/);
  assert.match(h, /Forintra pontosan 12\s905\s400 Ft/);
  // ha minden becsült tételt beírtál, nincs kerekítés
  const p = M.kalkHtml('indulo', adat, { vetelar: '50000000', hitel: '40000000', ugyvedi: '400000', ertekbecsles: '0', folyositas: '0' }).html;
  assert.doesNotMatch(p, /kb\./);
  // Wekerle: a megfelelés nem banki jóváhagyás
  assert.match(M.kalkHtml('wekerle', adat, {}).html, /A hitelt a bank bírálja el/);
});

test('bérlés vagy vétel: eladás a végén, mai érték, valódi havi költség', () => {
  const alap = { vetelar: 40e6, onero: 40e6, berlet: 200000, evek: 5, arNo: 0, berNo: 0, hozam: 0, karbantartas: 0 };
  const r = S.berlesVetel(adat, { ...alap, eladod: true });
  assert.equal(r.alap.vetel, 40e6 + 200000 * 12 * 5 - 40e6 * 0.03, 'a közvetítő díja levonva, nyereség nélkül nincs adó');
  // gyors drágulásnál öt éven belül az eladás adója is levonódik
  const d = S.berlesVetel(adat, { ...alap, evek: 3, arNo: 10, eladod: true });
  const e = d.alap.evente[2];
  const kozv = e.ertek * 0.03;
  const szja = S.eladasSzja(adat, { eladasiAr: e.ertek, szerzesEv: 2026, eladasEv: 2029, szerzesiErtek: 40e6, szerzesKoltseg: d.indulo.illetek.ado + d.indulo.tetelek.find((t) => t.kulcs === 'ugyvedi').ft, eladasKoltseg: kozv }).ado;
  assert.ok(szja > 0);
  assert.ok(Math.abs(e.levonas - (kozv + szja)) < 1);
  // mai érték
  const m = S.berlesVetel(adat, { ...alap, evek: 10 });
  assert.equal(m.alap.vetelMa, Math.round(m.alap.vetel * Math.pow(1 + m.infSz / 100, -10)));
  // valódi havi költség: hitel nélkül csak a lekötött pénz elmaradt hozama és a karbantartás
  const v = S.berlesVetel(adat, { ...alap, hozam: 6, karbantartas: 1 }).valodi;
  assert.equal(v.kamat, 0);
  assert.equal(v.elmaradt, Math.round(S.indulo(adat, { vetelar: 40e6 }).osszes * 6 / 1200));
  assert.equal(v.karbantartas, Math.round(40e6 * 1 / 1200));
});

test('Wekerle Plusz lakástakarék: támogatás, plafon, öt év', async () => {
  const { betoltAdat } = await import('../forras/adat.mjs');
  const S = await import('../forras/js/szamitas.mjs');
  const adat = betoltAdat();
  const r = S.lakastakarek(adat, { havi: 100000, evek: 10 });
  assert.equal(r.befizetes, 12000000);
  assert.equal(r.tamogatas, 5 * 120000 + 5 * 240000);
  assert.ok(r.kamat > 0 && Math.abs(r.osszesen - (r.befizetes + r.tamogatas + r.kamat)) <= 2);
  // havi 150 000 Ft-nál nem jár több támogatás, és a többlet nem kamatozik garantáltan
  const f = S.lakastakarek(adat, { havi: 150000, evek: 10 });
  assert.equal(f.tamogatas, 1800000);
  assert.equal(f.felett, 6000000);
  // kis befizetésnél a támogatás arányos: 10%, majd 20%
  const k = S.lakastakarek(adat, { havi: 10000, evek: 6 });
  assert.equal(k.tamogatas, 5 * 12000 + 24000);
  assert.match(S.lakastakarek(adat, { havi: 50000, evek: 4 }).hiba, /Legalább 5 évig/);
  assert.equal(S.lakastakarek(adat, { havi: 50000, evek: 15 }).evek, 10);
});
