// Minden kalkulátoroldal a böngészőbe csak a saját szabálytémáit küldi. Ez a teszt kiolvassa a kész oldalból ezt az adatot,
// és azzal futtatja a kalkulátort minden mezőt kitöltve: ha egy téma hiányzik, a számítás hibát dob (így derült ki a haszonélvezet hiánya).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as M from '../forras/js/megjelenites.mjs';

const TELE = { eladasiAr: '60000000', szerzesiErtek: '40000000', szerzesEv: '2023', eladasEv: '2026', szerzesKoltseg: '1000000', beruhazas: '1000000', eladasKoltseg: '500000',
  ertek: '50000000', hanyad: '50', kitol: 'vallalkozo', eladottErtek: '30000000', eladasMikor: 'elotte', elso: true, fiatal35: true, csok: false, telek: false, haszonelvezoKor: '70',
  vetelar: '60000000', onero: '10000000', eletkor: '30', alapterulet: '55', tulajdon: 'nincs', allapot: 'hasznalt', ingatlan: 'lakas', futamido: '25', piaciKamat: '6,5',
  havi: '200000', honap: '12', egyeb: '100000', koltseg: '300000', ertekcsokkenes: '100000', berelt: '0', kozvetito: '1000000', hitelTartozas: '5000000', vetelKoltseg: '500000', megtakaritas: '2000000', sorrend: 'elobb_vesz', telepules: 'fovaros', terulet: '55', megye: 'borsod', telepTipus: 'varos',
  jovedelem: '700000', meglevo: '20000', periodus: 'kozep', kamat: '6', zold: true, elsoLakas: true, jogcim: 'ajandek', vagyon: 'lakas', terhek: '1000000', rokonsag: 'egyeb',
  tipus: 'hatarozott', kor: '60', evek: '10', rokon: false, toke: '20000000', ev: '2024', osszeg: '2000000', dij: '1', dij2: '', sajat: '',
  allagmegovas: '3500000', ismeretlen: false, hitel: '40000000', allampapir: '4,5', berlet: '220000', kozos: '25000', arNo: '4', berNo: '4', hozam: '4,5', karbantartas: '1,5',
  ejAr: '30000', ejszaka: '18', tartozkodas: '2,5', platform: '15', takaritas: '7000', rezsi: '30000', kozosEv: '300000', egyebEv: '200000', szobak: '2', telepules: 'budapest', tobbLakas: false, hosszuHavi: '250000', hosszuHonap: '11',
  tamogatott: true, ugyvedi: '400000', ertekbecsles: '0', kozjegyzo: '60000', folyositas: '0', foglalo: '10',
  felujitas: '5000000', szamlas: true, eladasiAr: '60000000', honap: '8', rezsi: '40000', kozvetito: '3',
  gyerekek: '1', vallalt: '2', felesegKor: '33', varandos: false, kozosLakas: 'nincs', csokHitel: '30000000' };

test('minden kalkulátor lefut a saját oldalának adataival, minden mező kitöltve', () => {
  const web = new URL('../web/', import.meta.url).pathname;
  if (!existsSync(web)) execFileSync('node', ['epit.mjs'], { cwd: new URL('..', import.meta.url).pathname });
  let db = 0;
  for (const d of readdirSync(web, { withFileTypes: true }).filter((x) => x.isDirectory())) {
    const f = `${web}${d.name}/index.html`;
    if (!existsSync(f)) continue;
    const html = readFileSync(f, 'utf8');
    const tipus = html.match(/data-kalk="(\w+)"/)?.[1];
    if (!tipus) continue;
    const adat = JSON.parse(html.match(/<script type="application\/json" id="adat">(.*?)<\/script>/s)[1]);
    const e = { ...TELE, ev: tipus === 'emeles' ? '2024' : TELE.ev };
    assert.doesNotThrow(() => M.kalkHtml(tipus, adat, e), `${d.name} (${tipus})`);
    assert.match(M.kalkHtml(tipus, adat, e).html, /data-osszeg|class="ures"/, d.name);
    db++;
  }
  assert.ok(db >= 14, `kalkulátoroldalak: ${db}`);
});
