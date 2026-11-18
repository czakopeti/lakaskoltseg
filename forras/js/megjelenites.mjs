// Az elszámolás (eredmény) HTML-je. Ugyanezt használja az építő (a HTML-ben már benne van a szám)
// és a böngésző (élő számolás), így a kettő nem térhet el.
import * as S from './szamitas.mjs';

const nf = new Intl.NumberFormat('hu-HU', { useGrouping: 'always' });
export const fmt = (n) => nf.format(Math.round(n));
export const tized = (n, j = 1) => new Intl.NumberFormat('hu-HU', { maximumFractionDigits: j }).format(n);
export const ftx = (n) => `${fmt(n)}&nbsp;Ft`;

const ROMAI = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.', 'XI.', 'XII.'];
export function datumHu(iso) {
  if (!iso) return '';
  const [e, h, n] = iso.slice(0, 10).split('-').map(Number);
  return `${e}. ${S.HONAPOK[h - 1]} ${n}.`;
}
/** „2026. október 19-én” */
export function datumNapon(iso) {
  const [e, h, n] = iso.slice(0, 10).split('-').map(Number);
  return `${e}. ${S.HONAPOK[h - 1]} ${n}-${S.napRag(n)}`;
}
/** „2026. november 30-ig” */
export const datumIg = (iso) => datumHu(iso).replace(/\.$/, '-ig');
export function datumRomai(iso) {
  const [, h, n] = iso.slice(0, 10).split('-').map(Number);
  return `${ROMAI[h - 1]} ${n}.`;
}
/** Évszám utáni rag hangrendje: 2026-tól, 2027-től, 2028-ban, 2029-ben. */
export function hatso(ev) {
  const d = ev % 10;
  if (d === 0) return [0, 2, 3, 6, 8].includes(Math.floor(ev / 10) % 10);
  return [3, 6, 8].includes(d);
}
export const rag = (ev, h, e) => `${ev}-${hatso(ev) ? h : e}`;
/** 2026-os, 2027-es, 2028-as, 2035-ös */
export function os(ev) {
  const d = ev % 10, t = Math.floor(ev / 10) % 10;
  const r = d === 0 ? ({ 1: 'es', 2: 'as', 3: 'as', 4: 'es', 5: 'es', 6: 'as', 7: 'es', 8: 'as', 9: 'es', 0: 'as' })[t] : ({ 1: 'es', 2: 'es', 3: 'as', 4: 'es', 5: 'ös', 6: 'os', 7: 'es', 8: 'as', 9: 'es' })[d];
  return `${ev}-${r}`;
}
/** januárban … novemberben */
export function honapBan(h) { const n = S.HONAPOK[h - 1]; return n + (/(szeptember|október|november|december)$/.test(n) ? 'ben' : 'ban'); }
export function honapHu(ev, honap) { return `${ev}. ${S.HONAPOK[honap - 1]}`; }

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function vegosszeg(mi, ertek, megj) {
  return `<div class="vegosszeg"><span class="mi">${mi}</span><span class="mennyi" data-osszeg="${Math.round(ertek)}"><span class="ertek">${fmt(ertek)}</span><span class="ft">Ft</span></span>${megj ? `<p class="megj">${megj}</p>` : ''}</div>`;
}
/* Minden tétel mellett látszik, honnan jön: hivatalos (jogszabály, NAV), saját (te adtad meg) vagy becslés (a mi feltevésünk). */
const JEL = {
  hivatalos: ['hivatalos', 'Jogszabályban rögzített mérték vagy a NAV közzétett adata'],
  sajat: ['saját', 'Ezt te adtad meg'],
  becsles: ['becslés', 'A mi feltevésünk. A Források oldalon látod, honnan számoljuk'],
};
// A források oldalának címe: élesben /forrasok/, előnézetben relatív. A böngésző a lábléc linkjéből állítja be.
let forrasokUrl = '/forrasok/';
export function forrasokHelye(u) { if (u) forrasokUrl = u; }
/** f: hivatalos | sajat | becsles. A hivatalos a konkrét forrásra, a becslés a magyarázatra visz. */
export function jel(f, href = '') {
  if (!f || !JEL[f]) return '';
  const cel = f === 'hivatalos' ? (href || forrasokUrl) : f === 'becsles' ? `${forrasokUrl}#becslesek` : '';
  if (!cel) return `<span class="jel jel-${f}" title="${JEL[f][1]}">${JEL[f][0]}</span>`;
  const kulso = /^https?:/.test(cel) && !cel.startsWith(globalThis.location?.origin || '#');
  return `<a class="jel jel-${f}" href="${esc(cel)}" title="${JEL[f][1]}"${kulso ? ' target="_blank" rel="noopener"' : ''}>${JEL[f][0]}</a>`;
}
/** Jelmagyarázat a panel aljára, csak a ténylegesen használt jelölésekkel. */
export function jelekkel(html) {
  const van = Object.keys(JEL).filter((f) => html.includes(`jel-${f}"`));
  if (!van.length) return html;
  const szo = { hivatalos: 'jogszabály vagy NAV-tájékoztató szerinti tétel, a jelölésre kattintva a forrást látod', sajat: 'te adtad meg', becsles: `a mi feltevésünk, a valóság ettől eltérhet. <a href="${forrasokUrl}#becslesek">Mi alapján becsüljük?</a>` };
  const minta = { hivatalos: '<span class="jel jel-hivatalos">hivatalos</span>', sajat: '<span class="jel jel-sajat">saját</span>', becsles: '<span class="jel jel-becsles">becslés</span>' };
  return `${html}<p class="jelmagyarazat">${van.map((f) => `${minta[f]} ${szo[f]}`).join('<br>')}</p>`;
}
export function tetel(nev, ertek, { cls = '', al = '', href = '', forras = '', forrasUrl = '' } = {}) {
  const n = href ? `<a href="${href}">${nev}</a>` : nev;
  return `<li class="${cls}"><span>${n}${forras ? ` ${jel(forras, forrasUrl)}` : ''}${al ? `<span class="al">${al}</span>` : ''}</span><span class="ossz-ertek">${ertek}</span></li>`;
}
/** A táblázat tbody-sorainak első cellája sorfejléc (th scope=row), hogy a felolvasó minden számhoz kimondja, mi az. */
export const sorfejek = (html) => html.replace(/(<tr[^>]*>)<td>(.*?)<\/td>/g, '$1<th scope="row">$2</th>');
export const megjegyzes = (s, cls = '') => `<p class="megjegyzes ${cls}">${s}</p>`;
/**
 * Levezetés: a számítás lépései a látogató számaival és a jogszabályhellyel. lepesek: [mi, képlet, jogszabályhely] (a hamis elemek kimaradnak).
 * Valódi sorrend, ezért számozott lista.
 */
export function levezetes(lepesek) {
  const l = lepesek.filter(Boolean);
  if (!l.length) return '';
  return `<details class="levezetes"><summary>Hogyan számoltuk, lépésről lépésre</summary><ol>${l.map(([mi, kepl, par]) => `<li><span class="lv-mi">${mi}</span><span class="lv-kepl">${kepl}</span>${par ? `<span class="lv-par">${par}</span>` : ''}</li>`).join('')}</ol></details>`;
}
const F = (n) => `${fmt(n)}&nbsp;Ft`;
const SZ = (n, j = 2) => `${tized(n, j)}%`;
export const hibaPanel = (uz) => `<p class="hiba" role="alert">${esc(uz)}</p>`;

/* ---------- Üres állapot ---------- */
export function uresPanel(mi) {
  return `<div class="ures"><p class="ures-cim">Itt lesz az elszámolás.</p><p>${mi}</p><ul class="tetelek ures-sorok" aria-hidden="true"><li><span></span><span></span></li><li><span></span><span></span></li><li><span></span><span></span></li></ul></div>`;
}
/** Felirat a minta-eredmény fölött: világos, hogy nem a látogató adata. */
export const mintaJelzes = (leiras, kerd = 'Írd be a saját adataidat, és a minta helyett azokkal számolunk.') => `<p class="minta-jelzes"><strong>Minta:</strong> ${esc(leiras)}. ${esc(kerd)}</p>`;
// „Add meg…”, „Válaszd ki…”: hiányzó adat. Minden más üzenet (tartomány, ellentmondás) a beírt adat ellenőrzését kéri.
export const hianyPanel = (uz) => `<div class="ures"><p class="ures-cim">${/^([^.]*: )?(add meg|válaszd|válassz|írd be|töltsd ki|hiányzik)/i.test(uz) ? 'Még egy adat hiányzik.' : 'Ellenőrizd a beírt adatot.'}</p><p>${esc(uz)}</p></div>`;

export function nevelo(nev) {
  const t = String(nev).trim().toLowerCase();
  return /^([aáeéiíoóöőuúüű]|5|1(?!\d)|1\d{3}(?!\d)|1\d{6}(?!\d))/.test(t) ? 'az' : 'a';
}
const nevvel = (nev, nagy = false) => { const n = nevelo(nev); return `${nagy ? n[0].toUpperCase() + n.slice(1) : n} ${esc(nev)}`; };


/* ---------- Következő lépés ---------- */
/** lepesek: S.kovetkezoLepesek eredménye; utak: kalkulátorkulcs → cím (a lap #utak adatából). */
export function kovetkezoBlokk(lepesek, utak) {
  const l = (lepesek || []).filter((x) => utak?.[x.cel]);
  if (!l.length) return '';
  return `<div class="kovetkezo"><p class="kovetkezo-cim">Következő lépés</p><ul>${l.map((x) => `<li><a href="${esc(utak[x.cel] + S.kovetkezoQuery(x.q))}" data-kovetkezo>${esc(x.cim)}</a><span>${esc(x.szoveg)}</span></li>`).join('')}</ul></div>`;
}

/* ---------- Ingatlaneladás szja-ja ---------- */
export function eladasPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const f = (kulcs) => S.szabaly(adat, `szja_eladas.${kulcs}`).forras.url;
  const megj = r.hanyad === 0
    ? `${rag(r.szerzesEv, 'ban', 'ben')} szerezted, ${rag(r.eladasEv, 'ban', 'ben')} adod el. A szerzést követő ötödik évtől az eladásból nem keletkezik adóköteles jövedelem.`
    : r.veszteseg ? 'A költségeid elérik az eladási árat, ezért nincs jövedelem, és adó sincs.'
      : `A számított összeg ${r.hanyad}%-a a jövedelem, ennek ${r.kulcs}%-a az adó.`;
  let h = vegosszeg('Fizetendő személyi jövedelemadó', r.ado, megj);
  h += '<ul class="tetelek">';
  h += tetel('Eladási ár', ftx(r.ar), { forras: 'sajat' });
  if (r.ismeretlen) {
    h += tetel(`A szerzési érték nem állapítható meg: az ár ${r.ismSzazalek}%-a számít`, ftx(r.szamitott), { forras: 'hivatalos', forrasUrl: f('ismeretlen_szerzes'), al: 'ilyenkor más költség nem vonható le' });
  } else {
    h += tetel('Szerzési érték', `−${ftx(r.tetelek.szerzesiErtek)}`, { cls: 'levonas', forras: 'sajat' });
    if (r.tetelek.szerzesKoltseg) h += tetel('A szerzés költségei', `−${ftx(r.tetelek.szerzesKoltseg)}`, { cls: 'levonas', forras: 'sajat', al: 'illeték, ügyvédi díj' });
    if (r.tetelek.beruhazas) h += tetel('Értéknövelő beruházás', `−${ftx(r.tetelek.beruhazas)}`, { cls: 'levonas', forras: 'sajat', al: 'időkorlát és összeghatár nélkül' });
    if (r.allagBeirt) h += tetel(`Állagmegóvás az utolsó ${r.allagHonap} hónapban`, r.allagJar ? `−${ftx(r.allagBeirt)}` : '0&nbsp;Ft', { cls: r.allagJar ? 'levonas' : '', forras: 'hivatalos', forrasUrl: f('allagmegovas'), al: r.allagJar ? `meghaladja az eladási ár 5%-át (${ftx(r.allagHatar)})` : `nem vonható le: ${ftx(r.allagBeirt)} nem haladja meg az eladási ár 5%-át, ${ftx(r.allagHatar)}-ot` });
    if (r.tetelek.eladasKoltseg) h += tetel('Az eladás költségei', `−${ftx(r.tetelek.eladasKoltseg)}`, { cls: 'levonas', forras: 'sajat', al: 'közvetítő, hirdetés' });
    h += tetel('Számított összeg', ftx(r.szamitott), { al: r.levagva ? 'A költség legfeljebb az eladási árig számolható el.' : '' });
  }
  h += tetel(`Ebből jövedelem: ${r.hanyad}%`, ftx(r.jovedelem), { forras: 'hivatalos', forrasUrl: f('jovedelem_hanyad'), al: r.evek === 0 ? 'a szerzés évében adod el' : `a szerzést követő ${r.evek}. évben adod el` });
  h += tetel(`Személyi jövedelemadó: ${r.kulcs}%`, ftx(r.ado), { cls: 'vegso', forras: 'hivatalos', forrasUrl: f('ado_mertek') });
  h += '</ul>';
  h += `<ul class="tetelek masodik">${tetel('Az eladásból megmarad', ftx(r.megmarad), { cls: 'vegso', al: `az ár, mínusz az eladás költségei és az adó; a hitel visszafizetése nélkül` })}</ul>`;
  // Lépcső: évről évre kisebb rész adóköteles. Az oszlop magassága a százalék, a kiemelt az eladás éve.
  h += `<p class="panel-cim" id="lepcso-cim">Hogyan csökken az adóköteles rész?</p><ol class="lepcso" aria-labelledby="lepcso-cim">${r.skala.map((x, i) => `<li class="${x.most ? 'most' : ''}" style="--p:${x.szazalek};--i:${i}"><span class="lp-szazalek">${x.szazalek}%</span><span class="lp-oszlop"></span><span class="lp-ev">${x.ev}${x.szazalek === 0 ? '<small>és később</small>' : ''}</span>${x.most ? '<span class="sr">, ebben az évben adod el</span>' : ''}</li>`).join('')}</ol>`;
  h += levezetes([
    r.ismeretlen ? ['Számított összeg', `${F(r.ar)} × ${r.ismSzazalek}% = ${F(r.szamitott)}, mert a szerzési érték nem állapítható meg`, 'Szja tv. 62. § (3)']
      : ['Számított összeg', `${F(r.ar)} − ${F(r.osszKoltseg)} = ${F(r.szamitott)}${r.levagva ? ' (a költség legfeljebb az eladási árig vonható le)' : ''}`, 'Szja tv. 62. § (1)'],
    !r.ismeretlen && r.allagBeirt > 0 && ['Állagmegóvás', `${F(r.allagBeirt)} ${r.allagJar ? '>' : '≤'} ${F(r.ar)} × 5% = ${F(r.allagHatar)}, ezért ${r.allagJar ? 'levonható' : 'nem vonható le'}`, 'Szja tv. 3. § 32. pont'],
    ['Eltelt évek', `${r.eladasEv} − ${r.szerzesEv} = ${r.evek} év, ezért a számított összeg ${r.hanyad}%-a jövedelem`, 'Szja tv. 62. § (4)'],
    ['Jövedelem', `${F(r.szamitott)} × ${r.hanyad}% = ${F(r.jovedelem)}`, ''],
    ['Adó', `${F(r.jovedelem)} × ${r.kulcs}% = ${F(r.ado)}`, 'Szja tv. 8. § (1)'],
  ]);
  h = jelekkel(h);
  if (r.ado > 0) {
    h += megjegyzes(`Az adót az eladást követő évben, ${datumIg(r.bevallas)} kell bevallani és befizetni.${r.reszletben ? ` Ekkora összeget kérelemre ${r.reszletben} havi részletben is megfizethetsz, pótlék nélkül.` : ''}`);
    if (r.jovoreAdo < r.ado) h += megjegyzes(r.jovoreAdo === 0 ? `Ha ${rag(r.eladasEv + 1, 'ban', 'ben')} adnád el, már nem kellene adót fizetned.` : `Ha ${rag(r.eladasEv + 1, 'ban', 'ben')} adnád el, az adó ${ftx(r.jovoreAdo)} lenne, vagyis ${fmt(r.ado - r.jovoreAdo)} forinttal kevesebb. ${r.mentesEv}. január 1-jétől adómentes.`);
    h += `<button class="szoveg-gomb naptar-gomb" type="button" data-naptar="${r.bevallas}" data-naptar-cim="Ingatlaneladás szja-ja: bevallás és befizetés" data-naptar-leiras="A ${r.eladasEv}. évi eladás adója: ${fmt(r.ado)} Ft. Az éves szja-bevallásban kell szerepeltetni.">A határidőt a naptáramba teszem</button>`;
  }
  h += megjegyzes('Szocho és egészségügyi hozzájárulás nem jár, ha nem vállalkozásszerűen adod el. Nem számol a kalkulátor a termőföldből átminősített telekkel, a vállalkozói tevékenységgel, a házassági vagyonközösség megszüntetésével és a többi különleges adómentességgel.', 'halk');
  return h;
}

/* ---------- Vagyonszerzési illeték ---------- */
export function illetekPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const f = (k) => S.szabaly(adat, `illetek.${k}`).forras.url;
  const kedv = r.legjobb.kulcs !== 'altalanos';
  let h = vegosszeg('Fizetendő vagyonszerzési illeték', r.ado, kedv ? `${r.legjobb.nev}: ${r.legjobb.miert}. Kedvezmény nélkül ${ftx(r.altalanos)} lenne.` : `A forgalmi érték ${S.szabaly(adat, 'illetek.altalanos_mertek').ertek.szazalek}%-a. Kedvezmény nem jár a megadott adatokkal.`);
  h += '<ul class="tetelek">';
  h += tetel('Vételár', ftx(r.ertek), { forras: 'sajat', al: 'Az illeték alapja a NAV által megállapított forgalmi érték. Ha ez eltér a vételártól, az illeték is eltér.' });
  if (r.hanyad < 100) h += tetel(`A rád eső rész: ${tized(r.hanyad, 2)}%`, ftx(r.resz), { forras: 'sajat' });
  if (r.haszonelvezet) h += tetel(`Haszonélvezet, ${r.haszonelvezet.kor} éves haszonélvezővel`, `−${ftx(r.haszonelvezet.jog)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: S.szabaly(adat, 'haszonelvezet.vetel').forras.url, al: 'a vevő a haszonélvezettel csökkentett érték után fizet' });
  h += tetel('Általános mérték', ftx(r.altalanos), { forras: 'hivatalos', forrasUrl: f('altalanos_mertek') });
  if (kedv) h += tetel(r.legjobb.nev, `−${ftx(r.megtakaritas)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: f(r.legjobb.kulcs) });
  h += tetel('Fizetendő illeték', ftx(r.ado), { cls: 'vegso' });
  h += '</ul>';
  if (r.lehetosegek.length > 1) {
    h += `<p class="panel-cim">Melyik kedvezmény jár?</p><ul class="tetelek lehetosegek">${r.lehetosegek.map((x) => `<li class="${x === r.legjobb ? 'kiemelt-sor' : ''}${x.jar ? '' : ' nem-jar'}"><span>${x.nev}<span class="al">${x.miert}</span></span><span class="ossz-ertek">${x.jar ? ftx(x.ado) : 'nem jár'}</span></li>`).join('')}</ul>`;
    h += megjegyzes('Ha több kedvezmény is jár, a neked legkedvezőbbel számolunk. A kedvezményt a NAV-nál kell kérni, általában az adásvételi szerződés benyújtásakor, a B400-as adatlapon.');
  }
  h += levezetes([
    r.hanyad < 100 && ['A rád eső rész', `${F(r.ertek)} × ${SZ(r.hanyad)} = ${F(r.resz)}`, 'Itv. 19. § (1)'],
    r.haszonelvezet && ['Haszonélvezet levonva', `${F(r.resz)} − ${F(r.haszonelvezet.jog)} (${F(r.haszonelvezet.egy)} × ${r.haszonelvezet.szorzo}) = ${F(r.alap)}`, 'Itv. 72. §'],
    ['Általános illeték', `${F(r.alap)} × ${S.szabaly(adat, 'illetek.altalanos_mertek').ertek.szazalek}% = ${F(r.altalanos)}`, 'Itv. 19. § (1)'],
    ...r.lehetosegek.filter((x) => x.kulcs !== 'altalanos').map((x) => [x.nev, x.jar ? (x.kulcs === 'cserepotlo' ? `(${F(r.alap)} − ${F(x.eladott)}) × 4% = ${F(x.ado)}` : x.kulcs === 'elso_lakas_35' ? `${F(r.altalanos)} × 50% = ${F(x.ado)}` : x.kulcs === 'uj_lakas' && x.ado ? `${F(r.altalanos)} − a 15 millió forintra eső illeték = ${F(x.ado)}` : `${F(x.ado)}: ${x.miert}`) : `nem jár: ${x.miert}`, { cserepotlo: 'Itv. 21. §', elso_lakas_35: 'Itv. 26. § (6)', uj_lakas: 'Itv. 26. § (1) f)', csok_plusz: 'Itv. 26. § (1)', egyenesagi: 'Itv. 26. § (1)', telek: 'Itv. 26. § (1) a)' }[x.kulcs] || '']),
    ['A legkedvezőbb', `${r.legjobb.nev}: ${F(r.ado)}`, ''],
  ]);
  h = jelekkel(h);
  if (r.ado > 0) h += megjegyzes(`Az illetéket nem a szerződéskor fizeted, hanem a NAV határozata alapján, a kézbesítéstől számított ${r.hatarido_nap} napon belül.${r.reszletben ? ` Első lakásnál kérelemre ${r.reszletben} havi részletben, pótlék nélkül is fizetheted.` : ''}`);
  return h;
}

/* ---------- Wekerle Plusz ---------- */
const JEL_OK = { true: ['ok', 'teljesül'], false: ['nem', 'nem teljesül'], null: ['nincs', 'add meg'] };
export function wekerlePanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const src = S.szabaly(adat, 'wekerle_plusz.kamat').forras.url;
  const allapot = r.jogosult === true ? 'A megadott adatok alapján jogosult vagy.' : r.jogosult === false ? `${r.nemOk.length === 1 ? 'Egy feltétel' : `${r.nemOk.length} feltétel`} nem teljesül: ${r.nemOk.map((x) => x.nev.toLowerCase()).join(', ')}.` : `Még ${r.hianyzik.length === 1 ? 'egy adat' : `${r.hianyzik.length} adat`} hiányzik a döntéshez: ${r.hianyzik.map((x) => x.nev.toLowerCase()).join(', ')}.`;
  let h = vegosszeg('Havi törlesztő', r.havi, `${fmt(r.hitel)} Ft hitel ${r.ev} évre, ${tized(r.kamat, 1)}% fix kamattal. ${allapot}`);
  h += `<p class="panel-cim">A feltételek, a rendelet szerint</p><ul class="feltetelek">${r.feltetelek.map((x) => `<li class="f-${JEL_OK[x.ok][0]}"><span class="f-jel" aria-hidden="true"></span><span><b>${x.nev}</b> <span class="sr">${JEL_OK[x.ok][1]}</span><span class="al">${x.szoveg} <a href="${src}" target="_blank" rel="noopener">${x.par}</a></span></span></li>`).join('')}</ul>`;
  h += '<ul class="tetelek">';
  h += tetel('Vételár', ftx(r.ar), { forras: 'sajat' });
  h += tetel('Önerő', `−${ftx(r.onero)}`, { cls: 'levonas', forras: r.oneroFeltetelezett ? 'becsles' : 'sajat', al: r.oneroFeltetelezett ? 'A legkisebb önerővel számoltunk, add meg a sajátodat.' : '' });
  h += tetel('Hitelösszeg', ftx(r.hitel));
  h += tetel(`Kamat: ${tized(r.kamat, 1)}%`, `${ftx(r.kamatOssz)}`, { forras: 'hivatalos', forrasUrl: src, al: `${r.ev} év alatt, összesen ${ftx(r.osszesen)}-ot fizetsz vissza` });
  h += tetel(`Ugyanez ${tized(r.piaciKamat, 1)}% kamattal`, `${ftx(r.piaciHavi)}/hó`, { forras: r.piaciSajat ? 'sajat' : 'becsles', forrasUrl: S.szabaly(adat, 'wekerle_plusz.piaci_kamat').forras.url, al: 'támogatás nélküli piaci hitelnél' });
  h += tetel('Ennyit ér a támogatás', ftx(r.megtakaritas), { cls: 'vegso', al: `${r.ev} év alatt` });
  h += '</ul>';
  h += levezetes([
    ['Hitelösszeg', r.oneroFeltetelezett ? `${F(r.ar)} − ${F(r.onero)} (a legkisebb, 10% önerő) = ${F(r.hitel)}` : (r.ar - r.onero > r.hitel ? `${F(r.ar)} − ${F(r.onero)} = ${F(r.ar - r.onero)}, de legfeljebb ${F(r.hitel)}` : `${F(r.ar)} − ${F(r.onero)} = ${F(r.hitel)}`), '31. § (1), 35. §'],
    ['Havi kamatláb', `${tized(r.kamat, 1)}% ÷ 12 = ${tized(r.kamat / 12, 4)}%`, '32. §'],
    ['Havi törlesztő', `${F(r.hitel)} × r ÷ (1 − (1 + r)<sup>−${r.ev * 12}</sup>) = ${F(r.havi)}`, ''],
    ['Visszafizetendő', `${F(r.havi)} × ${r.ev * 12} hónap = ${F(r.osszesen)}`, ''],
    ['A támogatás értéke', `(${F(r.piaciHavi)} − ${F(r.havi)}) × ${r.ev * 12} = ${F(r.megtakaritas)}`, ''],
  ]);
  h = jelekkel(h);
  h += megjegyzes(`A vételár mellé illetéket is fizetsz, mert a Wekerle Plusz nem ad mentességet, és az illeték a hitelbe sem számítható bele. Kedvezmény nélkül ez ${ftx(r.illetek)}.`);
  h += megjegyzes(`${r.bentlakas} évig a lakásban kell laknod, ezalatt nem adhatod ki, és elidegenítési és terhelési tilalom van rajta.`);
  return h;
}

/* ---------- Lakáskiadás adója ---------- */
export function kiadasPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const src = (k) => S.szabaly(adat, `berbeadas.${k}`).forras.url;
  const nev = { koltseghanyad: `${r.kh}% költséghányaddal`, teteles: 'tételes költségelszámolással' };
  let h = vegosszeg(`Éves személyi jövedelemadó, ${nev[r.jobb]}`, r.ado, r.kulonbseg ? `Ez ${ftx(r.kulonbseg)}-tal kevesebb, mint a másik módszerrel. Havonta átlagosan ${ftx(r.haviAdo)} az adó.` : 'A két módszer ugyanannyi adót ad.');
  h += '<ul class="tetelek">';
  h += tetel(`Bérleti díj: ${r.honap} hónap`, ftx(r.havi * r.honap), { forras: 'sajat' });
  if (r.bevetel > r.havi * r.honap) h += tetel('Egyéb bevétel', ftx(r.bevetel - r.havi * r.honap), { forras: 'sajat', al: 'például megtérített közös költség, átalány rezsi' });
  if (r.berelt) h += tetel('Bérleti díj, amit máshol fizetsz', `−${ftx(r.berelt)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: src('berelt_lakas') });
  h += '</ul>';
  h += `<div class="ket-modszer">${['koltseghanyad', 'teteles'].map((m) => { const x = m === 'teteles' ? r.B : r.A; return `<div class="modszer${r.jobb === m ? ' nyero' : ''}"><p class="m-cim">${m === 'teteles' ? 'Tételes elszámolás' : `${r.kh}% költséghányad`} ${jel('hivatalos', src(m))}</p><p class="m-al">${m === 'teteles' ? `${ftx(r.koltseg)} igazolt költség levonva` : `${ftx(r.alap * r.kh / 100)} költségnek számít, számla nélkül`}</p><p class="m-sor"><span>Jövedelem</span><span>${ftx(x.jovedelem)}</span></p><p class="m-sor m-ado"><span>Adó, ${r.kulcs}%</span><span>${ftx(x.ado)}</span></p></div>`; }).join('')}</div>`;
  // A döntési pont: méretvonal, rajta a te költséged
  const max = Math.max(r.dontesiPont * 2, r.koltseg * 1.15, 1);
  const pos = (v) => Math.min(100, (v / max) * 100);
  h += `<p class="panel-cim">Mikor jobb a tételes elszámolás?</p><div class="dontes" style="--d:${pos(r.dontesiPont)}%;--k:${pos(r.koltseg)}%"><div class="d-sav"><span class="d-bal">10% jobb</span><span class="d-jobb">tételes jobb</span></div><span class="d-pont" aria-hidden="true"></span><span class="d-te" aria-hidden="true"></span></div><p class="d-felirat">Évi <b>${ftx(r.dontesiPont)}</b> igazolt költség felett a tételes elszámolás az olcsóbb. ${r.koltseg ? `A te költséged ${ftx(r.koltseg)}.` : 'Költséget nem adtál meg.'}</p>`;
  h += levezetes([
    ['Bevétel', `${F(r.havi)} × ${r.honap}${r.bevetel > r.havi * r.honap ? ` + ${F(r.bevetel - r.havi * r.honap)}` : ''} = ${F(r.bevetel)}`, 'Szja tv. 16. §'],
    r.berelt && ['Máshol fizetett bérleti díj levonva', `${F(r.bevetel)} − ${F(r.berelt)} = ${F(r.alap)}`, 'Szja tv. 17. §'],
    ['10% költséghányaddal', `${F(r.alap)} × 90% = ${F(r.A.jovedelem)}, adó ${F(r.A.jovedelem)} × ${r.kulcs}% = ${F(r.A.ado)}`, 'Szja tv. 17. § (2)'],
    ['Tételes elszámolással', `${F(r.alap)} − ${F(r.koltseg)} = ${F(r.B.jovedelem)}, adó ${F(r.B.jovedelem)} × ${r.kulcs}% = ${F(r.B.ado)}`, 'Szja tv. 3. melléklet'],
    ['Döntési pont', `${F(r.alap)} × ${r.kh}% = ${F(r.dontesiPont)}: e fölötti költségnél a tételes az olcsóbb`, ''],
  ]);
  h = jelekkel(h);
  if (r.ado > 0) {
    const negyed = Math.round(r.ado / 4);
    h += megjegyzes(`${r.honap === 12 ? `Negyedévente nagyjából ${ftx(negyed)} adóelőleget fizetsz` : 'Negyedévente adóelőleget fizetsz az abban a negyedévben kapott bérleti díj után'}, a negyedévet követő hónap 12-ig: ${r.elolegek.map((e) => datumHu(e.nap).replace(/^\d{4}\. /, '').replace(/\.$/, '')).join(', ')}. Az éves bevallás határideje ${datumHu(r.bevallas)}`);
    const lista = [...r.elolegek.map((e) => ({ nap: e.nap, cim: `Lakáskiadás: ${e.negyedev}. negyedévi adóelőleg`, leiras: `A ${r.ev}. ${e.negyedev}. negyedévi bérleti díj adóelőlege${r.honap === 12 ? `, nagyjából ${fmt(negyed)} Ft` : ''}.` })), { nap: r.bevallas, cim: 'Szja-bevallás: a lakáskiadás jövedelme', leiras: `A ${r.ev}. évi bérbeadás jövedelme önálló tevékenységként.` }];
    h += `<button class="szoveg-gomb naptar-gomb" type="button" data-naptar-lista="${esc(JSON.stringify(lista))}">A határidőket a naptáramba teszem</button>`;
  }
  return h;
}

/* ---------- Lakásváltás ---------- */
export function lakasvaltasPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const nincsHiany = r.hiany <= 0;
  let h = vegosszeg(nincsHiany ? 'Ennyi marad a váltás után' : 'Ennyi hitel kell még a váltáshoz', Math.abs(r.hiany), nincsHiany ? 'Az eladásból és a megtakarításodból kifizeted az új lakást és minden költségét.' : 'Az eladásból kapott pénz és a megtakarításod után ennyi hiányzik az új lakás árához és költségeihez.');
  h += `<div class="valtas"><div class="v-oldal"><p class="m-cim">Eladás</p><ul class="tetelek">`;
  h += tetel('Eladási ár', ftx(r.elado), { forras: 'sajat' });
  if (r.kozvetito) h += tetel('Ingatlanközvetítő', `−${ftx(r.kozvetito)}`, { cls: 'levonas', forras: 'sajat' });
  if (r.tartozas) h += tetel('A régi hitel végtörlesztése', `−${ftx(r.tartozas)}`, { cls: 'levonas', forras: 'sajat' });
  h += tetel('Személyi jövedelemadó', r.szja.ado ? `−${ftx(r.szja.ado)}` : (r.szjaHianyzik ? '?' : ftx(0)), { cls: 'levonas', forras: r.szjaHianyzik ? '' : 'hivatalos', forrasUrl: S.szabaly(adat, 'szja_eladas.jovedelem_hanyad').forras.url, al: r.szjaHianyzik ? 'Add meg a szerzés évét és értékét, és kiszámoljuk.' : r.szja.hanyad ? `a számított összeg ${r.szja.hanyad}%-a után` : 'a szerzést követő 5. évtől nincs' });
  h += tetel('Ennyit kapsz kézhez', ftx(r.kapsz), { cls: 'vegso' });
  h += `</ul></div><div class="v-oldal"><p class="m-cim">Vétel</p><ul class="tetelek">`;
  h += tetel('Vételár', ftx(r.vetel), { forras: 'sajat' });
  h += tetel('Illeték, cserét pótló vétellel', `+${ftx(r.illetek.ado)}`, { forras: 'hivatalos', forrasUrl: S.szabaly(adat, 'illetek.cserepotlo').forras.url, al: r.illetekMegtakaritas ? `kedvezmény nélkül ${ftx(r.illetekNelkul)} lenne` : '' });
  if (r.vetelKoltseg) h += tetel('Ügyvéd, értékbecslés, egyéb', `+${ftx(r.vetelKoltseg)}`, { forras: 'sajat' });
  h += tetel('Ennyi kell az új lakáshoz', ftx(r.kell), { cls: 'vegso' });
  h += '</ul></div></div>';
  if (r.megtakaritas) h += `<ul class="tetelek"><li class="levonas"><span>Megtakarításod ${jel('sajat')}</span><span class="ossz-ertek">−${ftx(r.megtakaritas)}</span></li></ul>`;
  h += levezetes([
    ['Kézhez kapod', `${F(r.elado)} − ${F(r.kozvetito)} − ${F(r.tartozas)} − ${F(r.szja.ado)} = ${F(r.kapsz)}`, ''],
    ['Illeték, cserét pótló vétellel', `max(0; ${F(r.vetel)} − ${F(r.elado)}) × 4% = ${F(r.illetek.ado)}`, 'Itv. 21. §'],
    ['Az új lakáshoz kell', `${F(r.vetel)} + ${F(r.illetek.ado)} + ${F(r.vetelKoltseg)} = ${F(r.kell)}`, ''],
    ['Különbség', `${F(r.kell)} − ${F(r.kapsz)} − ${F(r.megtakaritas)} = ${F(r.hiany)}`, ''],
  ]);
  h = jelekkel(h);
  if (r.illetekMegtakaritas) h += megjegyzes(`A cserét pótló vétel ${ftx(r.illetekMegtakaritas)} illetéket spórol: csak a két lakás értékének különbözete után fizetsz.`);
  h += megjegyzes(r.sorrend === 'elobb_vesz' ? `Ha előbb veszel, a régi lakást a vétel után ${r.utanaEv} éven belül el kell adnod, hogy a kedvezmény járjon. Addig a két lakás árát egyszerre kell előteremtened, ehhez gyakran áthidaló hitel kell.` : `Ha előbb adod el, az új lakást az eladás után ${r.elotteEv} éven belül kell megvenned, hogy a kedvezmény járjon.`);
  return h;
}

/* ---------- Mennyi hitelt kaphatsz ---------- */
const PER = { rovid: '5 évnél rövidebb', kozep: '5–10 éves', hosszu: 'legalább 10 éves vagy végig fix' };
export function hitelkepessegPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const src = (k) => S.szabaly(adat, `hitel.${k}`).forras.url;
  let h = vegosszeg('Ennyi lakáshitelt kaphatsz legfeljebb', r.max, `${r.ev} évre, ${tized(r.kamat, 1)}% kamattal, havi ${ftx(r.havi)} törlesztővel. ${r.kot === 'hfm' ? 'Most az ingatlan értéke a szűkebb korlát.' : 'Most a jövedelmed a szűkebb korlát.'}`);
  h += '<ul class="tetelek">';
  h += tetel('Havi nettó jövedelem', ftx(r.jov), { forras: 'sajat' });
  h += tetel(`A törlesztő legfeljebb ${r.jtm}%`, ftx(Math.round(r.jov * r.jtm / 100)), { forras: 'hivatalos', forrasUrl: src('jtm'), al: `${r.felette ? `${fmt(r.kuszob)} Ft felett` : `${fmt(r.kuszob)} Ft alatt`}, ${PER[r.per]} kamatperiódussal` });
  if (r.meglevo) h += tetel('Meglévő törlesztők', `−${ftx(r.meglevo)}`, { cls: 'levonas', forras: 'sajat' });
  h += tetel('Ennyi lehet az új hitel törlesztője', ftx(r.maxTorleszto));
  h += '</ul>';
  h += `<p class="panel-cim">A két korlát</p><ul class="tetelek lehetosegek"><li class="${r.kot === 'jtm' ? 'kiemelt-sor' : ''}"><span>A jövedelmed szerint (JTM) ${jel('hivatalos', src('jtm'))}<span class="al">${ftx(r.maxTorleszto)} törlesztő ${r.ev} évre, ${tized(r.kamat, 1)}% kamattal${r.kamatSajat ? '' : ` ${jel('becsles')}`}</span></span><span class="ossz-ertek">${ftx(r.jtmHitel)}</span></li>`;
  h += `<li class="${r.kot === 'hfm' ? 'kiemelt-sor' : ''}${r.hfmHitel === null ? ' nem-jar' : ''}"><span>Az ingatlan értéke szerint (HFM) ${jel('hivatalos', src('hfm'))}<span class="al">${r.hfmHitel === null ? 'Add meg az ingatlan értékét.' : `a ${ftx(r.ertek)} érték ${r.hfm}%-a`}</span></span><span class="ossz-ertek">${r.hfmHitel === null ? '?' : ftx(r.hfmHitel)}</span></li></ul>`;
  h += `<p class="panel-cim">Ugyanebből a jövedelemből Wekerle Plusszal</p><ul class="tetelek">${r.wekerle.map((w) => tetel(`${tized(w.kamat, 0)}% kamattal ${w.kamat < 4 ? '(új lakás)' : '(használt lakás)'}`, ftx(w.hitel), { forras: 'hivatalos', forrasUrl: S.szabaly(adat, 'wekerle_plusz.kamat').forras.url, al: 'a kamat végig fix, ezért a leghosszabb kamatperiódus korlátja érvényes; legfeljebb 50 millió forint' })).join('')}</ul>`;
  h += levezetes([
    ['Legnagyobb törlesztő', `${F(r.jov)} × ${r.jtm}% − ${F(r.meglevo)} = ${F(r.maxTorleszto)}`, '32/2014. MNB rendelet'],
    ['A jövedelem szerinti hitel', `${F(r.maxTorleszto)} × (1 − (1 + r)<sup>−${r.ev * 12}</sup>) ÷ r, r = ${tized(r.kamat, 2)}% ÷ 12: ${F(r.jtmHitel)}`, ''],
    r.hfmHitel !== null && ['Az ingatlan szerinti hitel', `${F(r.ertek)} × ${r.hfm}% = ${F(r.hfmHitel)}`, '32/2014. MNB rendelet'],
    ['A kisebbik', F(r.max), ''],
  ]);
  h = jelekkel(h);
  if (r.onero !== null) h += megjegyzes(`A ${ftx(r.ertek)} lakáshoz ${ftx(r.onero)} önerő kell, és erre jön még az illeték, amit a hitelbe nem lehet beleszámítani.`);
  h += megjegyzes('Ez a jogszabály szerinti felső határ. A bank ennél szigorúbban is dönthet, és a jövedelmet az igazolások szerint számolja.');
  return h;
}

/* ---------- Öröklés és ajándékozás ---------- */
const ROKON = { egyenesagi: 'egyenes ági rokon', hazastars: 'házastárs', testver: 'testvér', egyeb: '' };
export function ingyenesPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const src = (k) => S.szabaly(adat, `ingyenes.${k}`).forras.url;
  const mi = r.jogcim === 'ajandek' ? 'ajándékozási' : 'öröklési';
  let h = vegosszeg(`Fizetendő ${mi} illeték`, r.ado, r.mentes ? `Illetékmentes, mert ${ROKON[r.rokonsag]} ${r.jogcim === 'ajandek' ? 'ajándékoz' : 'után örökölsz'}. Mentesség nélkül ${ftx(r.adoMentesNelkul)} lenne.` : `A tiszta érték ${r.kulcs}%-a.`);
  h += '<ul class="tetelek">';
  h += tetel('Forgalmi érték', ftx(r.ertek), { forras: 'sajat', al: 'Az illetéket a NAV által megállapított érték után szabják ki.' });
  if (r.hanyad < 100) h += tetel(`A rád eső rész: ${tized(r.hanyad, 2)}%`, ftx(r.resz), { forras: 'sajat' });
  if (r.terhek) h += tetel('Terhek, például ráterhelt hitel', `−${ftx(r.terhek)}`, { cls: 'levonas', forras: 'sajat' });
  if (r.haszonelvezet) h += tetel(`Haszonélvezet, ${r.haszonelvezet.kor} éves haszonélvezővel`, `−${ftx(r.haszonelvezet.jog)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: S.szabaly(adat, 'haszonelvezet.szorzo').forras.url, al: `az egyévi érték ${r.haszonelvezet.szorzo}-szorosa` });
  h += tetel('Tiszta érték', ftx(r.tiszta), { forras: 'hivatalos', forrasUrl: src('tiszta_ertek') });
  h += tetel(r.mentes ? 'Illetékmentes' : `Illeték: ${r.kulcs}%`, ftx(r.ado), { cls: 'vegso', forras: 'hivatalos', forrasUrl: r.mentes ? src('mentes') : src('mertek') });
  h += '</ul>';
  h += levezetes([
    r.hanyad < 100 && ['A rád eső rész', `${F(r.ertek)} × ${SZ(r.hanyad)} = ${F(r.resz)}`, ''],
    ['Tiszta érték', `${F(r.resz)} − ${F(r.terhek)}${r.haszonelvezet ? ` − ${F(r.haszonelvezet.jog)}` : ''} = ${F(r.tiszta)}`, 'Itv. 7. §'],
    ['Illeték', r.mentes ? `mentes, ezért 0 Ft (mentesség nélkül ${F(r.tiszta)} × ${r.kulcs}% = ${F(r.adoMentesNelkul)})` : `${F(r.tiszta)} × ${r.kulcs}% = ${F(r.ado)}`, r.mentes ? 'Itv. 16. §, 17. §' : 'Itv. 12. §'],
  ]);
  h = jelekkel(h);
  if (r.rokonsag === 'egyeb') h += megjegyzes('Az élettárs, a sógor, az unokatestvér, a nagynéni és a nagybácsi nem mentes.');
  h += megjegyzes(r.jogcim === 'ajandek' ? 'Az ajándékozási szerződést ügyvéd vagy közjegyző ellenjegyzi, és a földhivatalba benyújtva jut el a NAV-hoz. Az illetéket a NAV határozata alapján fizeted.' : 'Az öröklési illetéket a hagyatéki eljárás után, a NAV határozata alapján fizeted. Ha egyszer eladod a lakást, a szerzés napja az örökhagyó halálának napja.');
  return h;
}

/* ---------- Haszonélvezet ---------- */
export function haszonelvezetPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const src = (k) => S.szabaly(adat, `haszonelvezet.${k}`).forras.url;
  let h = vegosszeg('A haszonélvezet értéke', r.jog, `A lakás értékének ${tized(r.szazalek, 0)}%-a. A tulajdonra, haszonélvezet nélkül, ${ftx(r.csupasz)} jut.`);
  // A lakás értéke két részre: haszonélvezet és csupasz tulajdon
  h += `<div class="osztas" style="--p:${Math.min(100, r.szazalek).toFixed(1)}%" role="img" aria-label="A lakás értékéből ${tized(r.szazalek, 0)}% a haszonélvezet"><span class="o-he"><b>haszonélvezet</b>${tized(r.szazalek, 0)}%</span><span class="o-cs"><b>tulajdon</b>${tized(100 - r.szazalek, 0)}%</span></div><p class="osztas-jel" aria-hidden="true"><span class="j-he">haszonélvezet <b>${tized(r.szazalek, 0)}%</b></span><span>tulajdon <b>${tized(100 - r.szazalek, 0)}%</b></span></p>`;
  h += '<ul class="tetelek">';
  h += tetel('Forgalmi érték', ftx(r.ertek), { forras: 'sajat' });
  h += tetel('Egyévi érték: a huszada', ftx(r.egy), { forras: 'hivatalos', forrasUrl: src('egyevi') });
  h += tetel(`Szorzó: ${r.szorzo}`, `× ${r.szorzo}`, { forras: 'hivatalos', forrasUrl: src(r.tipus === 'holtig' ? 'szorzo' : 'hatarozott'), al: r.tipus === 'holtig' ? `holtig tartó, ${r.kor} éves haszonélvező` : r.tipus === 'hatarozott' ? 'határozott időre, a kikötött évekkel' : 'határozatlan időre' });
  h += tetel('A haszonélvezet értéke', ftx(r.jog), { cls: 'vegso' });
  h += '</ul>';
  if (r.tipus === 'holtig') h += `<p class="panel-cim">Az életkor szerinti szorzók</p><ol class="lepcso szorzok">${r.savok.map(([a, c, x], i) => `<li class="${x === r.szorzo ? 'most' : ''}" style="--p:${x * 10};--i:${i}"><span class="lp-szazalek">${x}×</span><span class="lp-oszlop"></span><span class="lp-ev">${a === 0 ? '25 alatt' : c > 150 ? '65 felett' : `${a}–${c}`}</span></li>`).join('')}</ol>`;
  h += `<p class="panel-cim">Mennyi illeték jár, ha…</p><ul class="tetelek lehetosegek">${r.esetek.map((e) => `<li><span>${e.nev}<span class="al">${e.al}</span></span><span class="ossz-ertek">${ftx(e.ado)}</span></li>`).join('')}</ul>`;
  h += levezetes([
    ['Egyévi érték', `${F(r.ertek)} ÷ 20 = ${F(r.egy)}`, 'Itv. 72. § (1)'],
    ['A haszonélvezet értéke', `${F(r.egy)} × ${r.szorzo} = ${F(r.jog)}`, r.tipus === 'holtig' ? 'Itv. 72. § (4)' : 'Itv. 72. § (2)–(3)'],
    ['A tulajdon értéke', `${F(r.ertek)} − ${F(r.jog)} = ${F(r.csupasz)}`, ''],
  ]);
  h = jelekkel(h);
  h += megjegyzes('A kalkulátor az illetékhez használt törvényi értéket számolja. Egy haszonélvezettel terhelt lakás piaci ára ennél lényegesen alacsonyabb is lehet.');
  return h;
}

/* ---------- Előtörlesztés ---------- */
export function elotorlesztesPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const nyero = r.jobb === 'futamido' ? r.futamido : r.torleszto;
  let h = vegosszeg('Ennyi kamatot spórolsz, a díj után', nyero.netto, r.jobb === 'futamido' ? `Ha a törlesztő marad, és a futamidő rövidül ${r.futamido.rovidul} hónappal.` : 'Ha a futamidő marad, és a törlesztő csökken.');
  h += '<ul class="tetelek">';
  h += tetel('Fennálló tartozás', ftx(r.toke), { forras: 'sajat' });
  h += tetel(`Mostani törlesztő, ${r.n} hónapig`, ftx(r.havi), { al: `${tized(r.kamat, 2)}% kamattal, a hátralévő kamat ${ftx(r.alapKamat)}` });
  h += tetel('Előtörlesztés', `−${ftx(r.osszeg)}`, { cls: 'levonas', forras: 'sajat' });
  h += tetel(`Előtörlesztési díj: ${tized(r.dijSz, 2)}%`, ftx(r.dij), { forras: r.dijSajat ? 'sajat' : 'hivatalos', forrasUrl: S.szabaly(adat, 'elotorlesztes.mfl_dij').forras.url, al: r.dijSajat ? '' : 'a Minősített Fogyasztóbarát Lakáshitelek felső határa, a sajátodat átírhatod' });
  h += '</ul>';
  const ev = (m) => `${Math.floor(m / 12)} év${m % 12 ? ` ${m % 12} hónap` : ''}`;
  h += `<div class="ket-modszer"><div class="modszer${r.jobb === 'futamido' ? ' nyero' : ''}"><p class="m-cim">Rövidebb futamidő</p><p class="m-al">A törlesztő marad ${ftx(r.havi)}, ${ev(r.futamido.honap)} alatt fizeted vissza.</p><p class="m-sor"><span>Kamatmegtakarítás</span><span>${ftx(r.futamido.megtakaritas)}</span></p><p class="m-sor m-ado"><span>A díj után</span><span>${ftx(r.futamido.netto)}</span></p></div><div class="modszer${r.jobb === 'torleszto' ? ' nyero' : ''}"><p class="m-cim">Kisebb törlesztő</p><p class="m-al">${ftx(r.torleszto.havi)} havonta, ${ftx(r.torleszto.csokken)}-tal kevesebb.</p><p class="m-sor"><span>Kamatmegtakarítás</span><span>${ftx(r.torleszto.megtakaritas)}</span></p><p class="m-sor m-ado"><span>A díj után</span><span>${ftx(r.torleszto.netto)}</span></p></div></div>`;
  h += levezetes([
    ['Mostani törlesztő', `${F(r.toke)} × r ÷ (1 − (1 + r)<sup>−${r.n}</sup>), r = ${tized(r.kamat, 2)}% ÷ 12: ${F(r.havi)}`, ''],
    ['Hátralévő kamat most', `${F(r.havi)} × ${r.n} − ${F(r.toke)} = ${F(r.alapKamat)}`, ''],
    ['Új tartozás', `${F(r.toke)} − ${F(r.osszeg)} = ${F(r.toke - r.osszeg)}`, ''],
    ['Rövidebb futamidővel', `ugyanazzal a törlesztővel ${r.futamido.honap} hónap, a kamat ${F(r.futamido.megtakaritas)}-tal kevesebb`, ''],
    ['Kisebb törlesztővel', `${r.n} hónapra ${F(r.torleszto.havi)}, a kamat ${F(r.torleszto.megtakaritas)}-tal kevesebb`, ''],
    ['Díj', `${F(r.osszeg)} × ${tized(r.dijSz, 2)}% = ${F(r.dij)}`, ''],
  ]);
  h = jelekkel(h);
  h += megjegyzes('A rövidebb futamidő mindig több kamatot spórol. A kisebb törlesztő akkor jó választás, ha a havi terhet akarod csökkenteni. Kamatperiódus fordulóján az előtörlesztés gyakran díjmentes.');
  return h;
}

/* ---------- Bérleti díj emelése ---------- */
export function emelesPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  let h = vegosszeg('Az új havi bérleti díj', r.uj, r.sajat ? `${tized(r.p, 1)}%-os emeléssel.` : `A ${r.ev}. évi átlagos inflációval, ${tized(r.p, 1)}%-kal emelve.`);
  h += '<ul class="tetelek">';
  h += tetel('Mostani díj', ftx(r.dij), { forras: 'sajat' });
  h += tetel(r.sajat ? `Emelés: ${tized(r.p, 1)}%` : `KSH, ${r.ev}. évi átlag: ${tized(r.p, 1)}%`, `+${ftx(r.havi)}`, { forras: r.sajat ? 'sajat' : 'hivatalos', forrasUrl: r.forras?.url });
  h += tetel('Új díj', ftx(r.uj), { cls: 'vegso', al: `évente ${ftx(r.evi)}-tal több` });
  h += '</ul>';
  h += `<p class="panel-cim">Az éves átlagos infláció (KSH)</p><ol class="lepcso inflacio" style="grid-template-columns:repeat(${r.evek.length}, minmax(0, 1fr))">${r.evek.map((x, i) => `<li class="${!r.sajat && x.ev === r.ev ? 'most' : ''}" style="--p:${Math.min(100, x.szazalek / 18 * 100).toFixed(0)};--i:${i}"><span class="lp-szazalek">${tized(x.szazalek, 1)}%</span><span class="lp-oszlop"></span><span class="lp-ev">${x.ev}</span></li>`).join('')}</ol>`;
  h += levezetes([['Új díj', `${F(r.dij)} × (1 + ${tized(r.p, 1)}%) = ${F(r.uj)}`, r.sajat ? '' : `KSH, ${r.ev}. évi átlag`]]);
  h = jelekkel(h);
  h += megjegyzes('A bérleti díjat csak akkor emelheted, ha a szerződés megengedi, és úgy, ahogy ott áll. A leggyakoribb kikötés az előző évi átlagos infláció, ezt a KSH minden januárban közli.');
  return h;
}

/* ---------- Megéri kiadásra venni? ---------- */
export function hozamPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  let h = vegosszeg('Nettó éves hozam, adó után', r.netto, `A teljes befektetés ${tized(r.nettoHozam, 2)}%-a évente${r.megterules ? `, nagyjából ${tized(r.megterules, 0)} év alatt térül meg` : ''}. Az értéknövekedés nincs benne.`);
  h += `<div class="ket-modszer"><div class="modszer"><p class="m-cim">Bruttó hozam</p><p class="m-nagy">${tized(r.brutto, 2)}%</p><p class="m-al">a bérleti díj a befektetéshez képest</p></div><div class="modszer nyero nincs-cimke"><p class="m-cim">Nettó hozam</p><p class="m-nagy">${tized(r.nettoHozam, 2)}%</p><p class="m-al">költségek és adó után</p></div></div>`;
  h += '<ul class="tetelek">';
  h += tetel('Vételár', ftx(r.ar), { forras: 'sajat' });
  h += tetel('Illeték', `+${ftx(r.illetek)}`, { forras: 'hivatalos', forrasUrl: S.szabaly(adat, 'illetek.altalanos_mertek').forras.url, al: 'kedvezmény nélkül' });
  if (r.egyeb) h += tetel('Egyéb vételi költség', `+${ftx(r.egyeb)}`, { forras: 'sajat' });
  if (r.felujitas) h += tetel('Felújítás, berendezés', `+${ftx(r.felujitas)}`, { forras: 'sajat' });
  h += tetel('A teljes befektetés', ftx(r.beruhazas), { cls: 'vegso' });
  h += '</ul><ul class="tetelek masodik">';
  h += tetel(`Bérleti díj: ${r.honap} hónap`, ftx(r.bevetel), { forras: 'sajat' });
  if (r.koltseg) h += tetel('Költségek', `−${ftx(r.koltseg)}`, { cls: 'levonas', forras: 'sajat' });
  h += tetel(`Adó, ${r.adoModszer === 'teteles' ? 'tételes elszámolással' : '10% költséghányaddal'}`, `−${ftx(r.ado)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: S.szabaly(adat, 'berbeadas.ado_mertek').forras.url });
  h += tetel('Nettó évente', ftx(r.netto), { cls: 'vegso' });
  h += '</ul>';
  h += levezetes([
    ['A befektetés', `${F(r.ar)} + ${F(r.illetek)} + ${F(r.egyeb)} + ${F(r.felujitas)} = ${F(r.beruhazas)}`, ''],
    ['Bruttó hozam', `${F(r.bevetel)} ÷ ${F(r.beruhazas)} = ${tized(r.brutto, 2)}%`, ''],
    ['Nettó évente', `${F(r.bevetel)} − ${F(r.koltseg)} − ${F(r.ado)} = ${F(r.netto)}`, 'Szja tv. 16–17. §'],
    ['Nettó hozam', `${F(r.netto)} ÷ ${F(r.beruhazas)} = ${tized(r.nettoHozam, 2)}%`, ''],
    r.megterules && ['Megtérülés', `${F(r.beruhazas)} ÷ ${F(r.netto)} = ${tized(r.megterules, 1)} év`, ''],
  ]);
  if (r.hitel) {
    const x = r.hitel;
    h += `<p class="panel-cim">Hitellel: mit hoz az önerőd?</p>`;
    h += `<div class="ket-modszer"><div class="modszer${x.penzaram >= 0 ? ' nyero nincs-cimke' : ''}"><p class="m-cim">Pénz a zsebedben</p><p class="m-nagy">${x.keszpenzHozam === null ? '–' : `${tized(x.keszpenzHozam, 1)}%`}</p><p class="m-al">évi ${x.penzaram >= 0 ? '' : 'mínusz '}${ftx(Math.abs(x.penzaram))} a törlesztő után</p></div><div class="modszer${x.oneroHozam >= 0 ? ' nyero nincs-cimke' : ''}"><p class="m-cim">A tőketörlesztéssel együtt</p><p class="m-nagy">${x.oneroHozam === null ? '–' : `${tized(x.oneroHozam, 1)}%`}</p><p class="m-al">a kamat költség, a tőke a vagyonod marad</p></div></div>`;
    h += '<ul class="tetelek">';
    h += tetel('Hitel', ftx(x.hitel), { forras: 'sajat' });
    h += tetel(`Kamat: ${tized(x.kamat, 2)}%, ${x.ev} év`, `${ftx(x.havi)}/hó`, { forras: x.kamatSajat ? 'sajat' : 'becsles', al: x.kamatSajat ? '' : 'összehasonlító piaci kamat, írd be a saját ajánlatodat' });
    h += tetel('Önerő', ftx(x.onero), { al: 'a teljes befektetés, mínusz a hitel' });
    h += tetel('Első évi kamat', `−${ftx(x.elsoKamat)}`, { cls: 'levonas' });
    h += tetel('Első évi tőketörlesztés', ftx(x.elsoToke), { al: 'ezzel nő a lakásban lévő saját részed' });
    h += '</ul>';
    if (x.hfmFelett) h += megjegyzes(`A bank a lakás forgalmi értékének legfeljebb ${x.hfm}%-át adja hitelre, vagyis ${ftx(r.ar * x.hfm / 100)}-ot.`, 'figyelem');
    if (x.penzaram < 0) h += megjegyzes(`A bérleti díj nem fedezi a törlesztőt: évente ${ftx(-x.penzaram)}-ot, havonta nagyjából ${ftx(-x.penzaram / 12)}-ot a saját pénzedből teszel hozzá.`);
  }
  const ap = r.allampapir;
  h += `<p class="panel-cim">És ha állampapírba tennéd?</p>`;
  h += '<ul class="tetelek">';
  h += tetel(`${r.hitel ? 'Az önerőd' : 'A teljes befektetés'} Prémium Magyar Állampapírban, ${tized(ap.szazalek, 2)}%`, `${ftx(ap.kamat)}/év`, { forras: ap.sajat ? 'sajat' : 'hivatalos', forrasUrl: S.szabaly(adat, 'berles_vetel.allampapir').forras.url, al: 'kamatadómentes, kockázat és bérlő nélkül' });
  h += tetel(r.hitel ? 'A lakás, a kamat után' : 'A lakás, adó után', `${ftx(ap.lakas)}/év`, { al: 'az értéknövekedés nélkül' });
  h += tetel(ap.kulonbseg >= 0 ? 'A lakás többet hoz' : 'Az állampapír többet hoz', `${ftx(Math.abs(ap.kulonbseg))}/év`, { cls: 'vegso' });
  h += '</ul>';
  const kell = ap.alap > 0 ? (ap.kamat - ap.lakas) / r.beruhazas * 100 : null;
  if (ap.kulonbseg < 0 && kell !== null) h += megjegyzes(`A lakás akkor éri utol az állampapírt, ha az értéke évente legalább ${tized(kell, 1)}%-kal nő. Ezt a bérleti díj nem fedezi, a lakásárak alakulásán múlik.`);
  h += levezetes([
    r.hitel && ['Törlesztő', `${F(r.hitel.hitel)}, ${tized(r.hitel.kamat, 2)}%, ${r.hitel.ev * 12} hónap: ${F(r.hitel.havi)} havonta, ${F(r.hitel.eves)} évente`, ''],
    r.hitel && ['Pénz a zsebedben', `${F(r.netto)} − ${F(r.hitel.eves)} = ${F(r.hitel.penzaram)}; ÷ ${F(r.hitel.onero)} = ${tized(r.hitel.keszpenzHozam, 2)}%`, ''],
    r.hitel && ['A tőketörlesztéssel együtt', `(${F(r.netto)} − ${F(r.hitel.elsoKamat)}) ÷ ${F(r.hitel.onero)} = ${tized(r.hitel.oneroHozam, 2)}%`, ''],
    ['Állampapír', `${F(ap.alap)} × ${tized(ap.szazalek, 2)}% = ${F(ap.kamat)}`, ''],
  ]).replace('<details class="levezetes"><summary>Hogyan számoltuk, lépésről lépésre</summary>', '<details class="levezetes"><summary>A hitel és az állampapír, lépésről lépésre</summary>');
  h = jelekkel(h);
  h += megjegyzes('Az üres hónapok, a bérlőcsere és a nagyobb javítások gyakran többe kerülnek, mint elsőre gondolnád. Számolj legalább egy üres hónappal évente.');
  return h;
}

/* ---------- Lakásvásárlás induló költsége ---------- */
const BECSLES_KULCS = ['ugyvedi', 'ertekbecsles', 'folyositas'];
export function induloPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const fu = (k) => S.szabaly(adat, k).forras.url;
  const megj = r.hiany === null
    ? `Ebből ${ftx(r.onero)} az önerő, ${ftx(r.vetelarFelett)} pedig a vételáron felüli költség.`
    : r.hiany > 0 ? `A megtakarításodból ${ftx(r.hiany)} hiányzik. Ebből ${ftx(r.vetelarFelett)} a vételáron felüli költség.`
      : `A megtakarításod fedezi, és ${ftx(-r.hiany)} marad. Ebből ${ftx(r.vetelarFelett)} a vételáron felüli költség.`;
  let h = vegosszeg('Ennyi saját pénz kell a vételhez', r.osszes, megj);
  if (r.hfmFelett) h += megjegyzes(`A bank a lakás forgalmi értékének legfeljebb ${r.hfmSz}%-át adhatja hitelre, ez ${ftx(r.hfmMax)}. Ehhez legalább ${ftx(r.ar - r.hfmMax)} önerő kell.`, 'figyelem');
  h += '<ul class="tetelek">';
  h += tetel('Vételár', ftx(r.ar), { forras: 'sajat' });
  if (r.hitel) h += tetel(r.tam ? 'Hitel (Wekerle Plusz)' : 'Hitel', `−${ftx(r.hitel)}`, { cls: 'levonas', forras: 'sajat' });
  h += tetel(`Önerő: a vételár ${tized(r.oneroSzazalek, 0)}%-a`, ftx(r.onero), { cls: 'vegso' });
  h += '</ul><ul class="tetelek masodik">';
  const ill = r.illetek;
  h += tetel(ill.legjobb.kulcs === 'altalanos' ? 'Illeték, 4%' : `Illeték: ${ill.legjobb.nev}`, ftx(ill.ado), { forras: 'hivatalos', forrasUrl: fu(`illetek.${ill.legjobb.kulcs === 'altalanos' ? 'altalanos_mertek' : ill.legjobb.kulcs}`), al: ill.legjobb.kulcs === 'altalanos' ? '' : `kedvezmény nélkül ${ftx(ill.altalanos)} lenne` });
  for (const t of r.tetelek) h += tetel(t.nev, ftx(t.ft), { forras: t.sajat ? 'sajat' : BECSLES_KULCS.includes(t.kulcs) ? 'becsles' : 'hivatalos', forrasUrl: fu(t.forras), al: t.kulcs === 'ugyvedi' && !t.sajat ? `a vételár ${tized(r.ugyvedSz, 1)}%-a${r.uj ? ', új lakásnál gyakran a vételárban van' : ''}` : t.kulcs === 'kozjegyzo' && !t.sajat ? `a díjszabás szerinti munkadíj${r.tam ? ', támogatott hitelnél 15%' : ''}` : t.kulcs === 'folyositas' && !t.sajat ? (r.tam ? 'támogatott hitelnél a banki díjak felső határa' : 'a felső határ; sok bank elengedi') : '' });
  if (r.egyeb) h += tetel('Költözés, felújítás, berendezés', ftx(r.egyeb), { forras: 'sajat' });
  h += tetel('A vételáron felül', ftx(r.vetelarFelett), { cls: 'vegso' });
  h += '</ul>';
  // Időrend: mikor melyik összeg kell. Valódi sorrend, ezért számozott.
  h += `<p class="panel-cim" id="idorend-cim">Mikor mennyi kell?</p><ol class="idorend" aria-labelledby="idorend-cim">${r.lepesek.map((l, i) => `<li style="--i:${i};--p:${Math.max(2, l.ft / r.osszes * 100).toFixed(1)}%"><span class="ir-mikor">${l.nev}</span><span class="ir-ossz">${ftx(l.ft)}</span><span class="ir-sav" aria-hidden="true"></span><span class="ir-mi">${l.mi}</span></li>`).join('')}</ol>`;
  if (r.hitel) h += megjegyzes(`A foglalót és az ügyvédi díjat a hitel folyósítása előtt, saját pénzből fizeted. Ha a foglaló nagyobb a szokásos ${tized(r.foglaloSzazalek, 0)}%-nál, ennyivel több kell az aláíráskor.`);
  if (r.megtakaritas !== null) h += `<ul class="tetelek masodik">${tetel('Megtakarításod', ftx(r.megtakaritas), { forras: 'sajat' })}${tetel(r.hiany > 0 ? 'Hiányzik' : 'Marad', ftx(Math.abs(r.hiany)), { cls: 'vegso' })}</ul>`;
  h += levezetes([
    ['Önerő', `${F(r.ar)} − ${F(r.hitel)} = ${F(r.onero)}`, ''],
    ['Illeték', ill.legjobb.kulcs === 'altalanos' ? `${F(r.ar)} × 4% = ${F(ill.ado)}` : `${ill.legjobb.nev}: ${F(ill.ado)}`, 'Itv. 19. §'],
    ...r.tetelek.map((t) => [t.nev, t.sajat ? `${F(t.ft)}, amit beírtál` : t.kulcs === 'ugyvedi' ? `${F(r.ar)} × ${tized(r.ugyvedSz, 1)}% = ${F(t.ft)}` : F(t.ft), '']),
    ['Összesen', `${F(r.onero)} + ${F(ill.ado)} + ${F(r.mellek)}${r.egyeb ? ` + ${F(r.egyeb)}` : ''} = ${F(r.osszes)}`, ''],
  ]);
  h = jelekkel(h);
  h += megjegyzes('Nem számoltuk: a lakásbiztosítást (a bank előírja), a bankszámla díját és az ingatlanközvetítőt, ha a vevő fizeti. A banki akciók miatt a hitel díjai gyakran kisebbek; ha tudod a pontos összeget, írd be.', 'halk');
  return h;
}

/* ---------- Bérlés vagy vétel ---------- */
export function berlesVetelPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const a = r.alap;
  const vesz = r.nyero === 'vetel';
  let h = vegosszeg(vesz ? `Ennyivel több vagyonod lesz ${r.evek} év múlva, ha megveszed` : `Ennyivel több vagyonod lesz ${r.evek} év múlva, ha bérelsz`, Math.round(Math.abs(a.kulonbseg) / 1e5) * 1e5,
    `Alapeset: a lakásár és a bérleti díj évente ${tized(r.arNo, 1)}%-kal nő, a bérlő a megmaradó pénzét ${tized(r.hozam, 1)}%-on fekteti be. ${a.fordul ? `A vétel a ${a.fordul}. évben kerül előre.` : `A vétel ${r.evek} év alatt nem kerül előre.`}`);
  h += `<div class="ket-modszer"><div class="modszer vagyon${vesz ? ' nyero' : ''}"><p class="m-cim">Ha megveszed</p><p class="m-nagy">${fmt(a.vetel / 1e6)}<small> millió Ft</small></p><p class="m-al">a lakás ${fmt(a.ertek / 1e6)} millió, mínusz ${fmt(a.tartozas / 1e6)} millió tartozás, plusz a befektetés</p></div><div class="modszer vagyon${vesz ? '' : ' nyero'}"><p class="m-cim">Ha bérelsz</p><p class="m-nagy">${fmt(a.berles / 1e6)}<small> millió Ft</small></p><p class="m-al">a kezdő pénz és a havi különbség befektetve</p></div></div>`;
  // Évről évre: a két vagyon az alapesetben
  const max = Math.max(...a.evente.map((x) => Math.max(x.vetel, x.berles)), 1);
  h += `<p class="panel-cim" id="parok-cim">Évről évre, alapesetben</p><ol class="parok" aria-labelledby="parok-cim">${a.evente.map((x, i) => `<li style="--v:${(Math.max(0, x.vetel) / max * 100).toFixed(1)}%;--b:${(Math.max(0, x.berles) / max * 100).toFixed(1)}%;--i:${i}"><span class="pr-v" aria-hidden="true"></span><span class="pr-b" aria-hidden="true"></span><span class="pr-ev">${x.ev}.</span><span class="sr">${x.ev}. év: vétel ${fmt(x.vetel)} Ft, bérlés ${fmt(x.berles)} Ft</span></li>`).join('')}</ol><p class="parok-jel" aria-hidden="true"><span class="j-v">vétel</span><span class="j-b">bérlés</span></p>`;
  h += `<p class="panel-cim">Három forgatókönyv a lakásárakra</p><div class="tabla-tarto"><table class="tabla"><thead><tr><th scope="col"></th><th scope="col">Lakásár/év</th><th scope="col">Vétel</th><th scope="col">Bérlés</th><th scope="col">Fordul</th></tr></thead><tbody>${r.forgatokonyvek.map((f) => `<tr${f.kulcs === 'alap' ? ' class="kiemelt-sor"' : ''}><th scope="row">${f.nev}</th><td>${tized(f.arNo, 1)}%</td><td>${fmt(f.vetel / 1e6)} M</td><td>${fmt(f.berles / 1e6)} M</td><td>${f.fordul ? `${f.fordul}. év` : 'nincs'}</td></tr>`).join('')}</tbody></table></div><p class="kicsi halk">A „fordul” oszlop az az év, amelytől a vétel több vagyont hagy, mint a bérlés.</p>`;
  h += '<ul class="tetelek">';
  h += tetel('Kezdő pénz a vételhez', ftx(r.kezdo), { al: `önerő ${fmt(r.onero)} Ft, illeték és mellékköltségek; ennyit fektet be a bérlő` });
  if (r.hitel) h += tetel(`Hitel: ${fmt(r.hitel)} Ft, ${tized(r.kamat, 2)}%, ${r.futamido} év`, `${ftx(r.havi)}/hó`, { forras: r.kamatSajat ? 'sajat' : 'becsles' });
  h += tetel('Vétel: havi kiadás az első évben', `${ftx(r.elsoHaviVetel)}/hó`, { al: `törlesztő${r.kozos ? ', közös költség' : ''} és karbantartás (évi ${tized(r.karbSz, 1)}%)` });
  h += tetel('Bérlés: havi díj az első évben', `${ftx(r.berlet)}/hó`, { forras: 'sajat' });
  h += tetel('Lakásár és bérleti díj változása', `${tized(r.arNo, 1)}% / ${tized(r.berNo, 1)}%`, { forras: 'becsles', al: `alapesetben a KSH ${r.infEv}. évi átlagos inflációja` });
  h += tetel('A befektetés hozama', `${tized(r.hozam, 1)}%`, { forras: 'becsles', al: 'a Prémium Magyar Állampapír kamata, kamatadómentes' });
  h += '</ul>';
  h += levezetes([
    ['Kezdő pénz', `${F(r.onero)} önerő + ${F(r.kezdo - r.onero)} illeték és mellékköltség = ${F(r.kezdo)}`, ''],
    ['Havonta', 'a vevő törlesztőt, közös költséget és karbantartást fizet, a bérlő bérleti díjat; ami az egyiknél kevesebb, az befektetésbe kerül', ''],
    ['Évente', `a lakás értéke ${tized(r.arNo, 1)}%-kal, a bérleti díj és a közös költség ${tized(r.berNo, 1)}%-kal nő, a befektetés ${tized(r.hozam, 1)}%-ot hoz`, ''],
    ['Vétel vagyona', `${F(a.ertek)} − ${F(a.tartozas)} tartozás + befektetés = ${F(a.vetel)}`, ''],
    ['Bérlés vagyona', `befektetés = ${F(a.berles)}`, ''],
  ]);
  h = jelekkel(h);
  if (r.hfmFelett) h += megjegyzes(`Ekkora önerővel a bank nem ad hitelt: legfeljebb a forgalmi érték ${r.hfmSz}%-át adhatja.`, 'figyelem');
  h += megjegyzes('Nem számoltuk: az eladás költségét, ha a végén eladnád; a bérlő kaucióját; és hogy a bérlő tényleg befekteti-e a különbséget. Wekerle Plusszal írd be a 3% vagy 5% kamatot.', 'halk');
  return h;
}

/* ---------- Rövid vagy hosszú távú kiadás ---------- */
export function rovidtavPanel(adat, r) {
  if (r.hiba) return hianyPanel(r.hiba);
  const fu = (k) => S.szabaly(adat, `rovid_tav.${k}`).forras.url;
  const R = r.rovid, H = r.hosszu, rov = r.nyero === 'rovid';
  let h = vegosszeg(rov ? 'Rövid távú kiadással ennyivel több marad évente' : 'Hosszú távú kiadással ennyivel több marad évente', Math.abs(r.kulonbseg),
    `Havi ${tized(r.ejszaka, 1)} foglalt éjszakával (${tized(r.kihasznaltsag, 0)}% kihasználtság). ${r.fordul === null ? 'Teljes kihasználtsággal sem éri utol a hosszú távú kiadást.' : `A rövid táv havi ${tized(r.fordul, 1)} foglalt éjszakától hoz többet.`}`);
  if (r.budapest) h += megjegyzes(`Budapesten ${datumIg(r.moratoriumIg)} új rövid távú szálláshelyet nem lehet nyilvántartásba venni, a VI. kerületben pedig tilos. Ha most kezdenéd, előbb kérdezd meg a kerületi önkormányzatot.`, 'figyelem');
  h += `<div class="ket-modszer"><div class="modszer hoz${rov ? ' nyero' : ''}"><p class="m-cim">Rövid távon</p><p class="m-nagy">${fmt(R.netto)}<small> Ft</small></p><p class="m-al">évente, adó után; havonta ${ftx(R.netto / 12)}</p></div><div class="modszer hoz${rov ? '' : ' nyero'}"><p class="m-cim">Hosszú távon</p><p class="m-nagy">${fmt(H.netto)}<small> Ft</small></p><p class="m-al">évente, adó után; havonta ${ftx(H.netto / 12)}</p></div></div>`;
  h += '<p class="panel-cim">Rövid távon</p><ul class="tetelek">';
  h += tetel(`Szállásdíj: ${fmt(r.ejAr)} Ft × ${tized(r.ejszaka, 1)} éj × 12`, ftx(R.brutto), { forras: 'sajat' });
  if (R.afaKoteles) h += tetel('Áfa, 5%', `−${ftx(R.afa)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: fu('afa_mentesseg'), al: 'az éves bevétel meghaladja a 20 millió forintos alanyi mentességet' });
  h += tetel(`Platform jutaléka, ${tized(r.platform, 1)}%`, `−${ftx(R.platform)}`, { cls: 'levonas', forras: r.platformSajat ? 'sajat' : 'becsles', forrasUrl: fu('platform') });
  if (R.takaritas) h += tetel(`Takarítás, ${fmt(R.foglalas)} foglalás`, `−${ftx(R.takaritas)}`, { cls: 'levonas', forras: 'sajat', al: `átlagosan ${tized(r.tartozkodas, 1)} éjszakás foglalásokkal` });
  h += tetel('Turizmusfejlesztési hozzájárulás, 4%', `−${ftx(R.tfh)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: fu('tfh') });
  if (R.rezsi) h += tetel('Rezsi és internet', `−${ftx(R.rezsi)}`, { cls: 'levonas', forras: 'sajat', al: 'hosszú távon ezt a bérlő fizeti' });
  if (r.kozosEv) h += tetel('Közös költség, biztosítás, adó', `−${ftx(r.kozosEv)}`, { cls: 'levonas', forras: 'sajat' });
  if (r.egyebEv) h += tetel('Egyéb: kopás, javítás, felszerelés', `−${ftx(r.egyebEv)}`, { cls: 'levonas', forras: 'sajat' });
  h += tetel(R.legjobb.nev, `−${ftx(R.ado)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: fu(R.legjobb.kulcs === 'atalany' ? 'atalany' : 'onallo') });
  h += tetel('Marad évente', ftx(R.netto), { cls: 'vegso' });
  h += '</ul>';
  h += `<p class="panel-cim">Melyik adózás a legjobb?</p><ul class="tetelek lehetosegek">${R.modok.map((m) => `<li class="${m === R.legjobb ? 'kiemelt-sor' : ''}${m.jar ? '' : ' nem-jar'}"><span>${m.nev}<span class="al">${m.miert}</span></span><span class="ossz-ertek">${m.jar ? ftx(m.ado) : 'nem jár'}</span></li>`).join('')}</ul>`;
  h += '<p class="panel-cim">Hosszú távon</p><ul class="tetelek">';
  h += tetel(`Bérleti díj: ${fmt(H.havi)} Ft × ${H.honap} hónap`, ftx(H.bevetel), { forras: 'sajat' });
  if (H.koltseg) h += tetel('Közös költség és egyéb', `−${ftx(H.koltseg)}`, { cls: 'levonas', forras: 'sajat' });
  h += tetel(`Szja, ${H.modszer === 'teteles' ? 'tételes elszámolással' : '10% költséghányaddal'}`, `−${ftx(H.ado)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: S.szabaly(adat, 'berbeadas.ado_mertek').forras.url, al: 'ingatlan-bérbeadásnál szocho nincs' });
  h += tetel('Marad évente', ftx(H.netto), { cls: 'vegso' });
  h += '</ul>';
  h += levezetes([
    ['Szállásdíj', `${F(r.ejAr)} × ${tized(r.ejszaka, 1)} × 12 = ${F(R.brutto)}${R.afaKoteles ? `, ebből áfa ${F(R.afa)}` : ', alanyi áfamentesen'}`, R.afaKoteles ? 'Áfa tv. 3. sz. melléklet' : 'Áfa tv. 188. §'],
    ['Költségek', `${F(R.platform)} jutalék + ${F(R.takaritas)} takarítás + ${F(R.tfh)} TFH + ${F(R.rezsi)} rezsi + ${F(r.kozosEv + r.egyebEv)} egyéb = ${F(R.koltseg)}`, ''],
    ...R.modok.filter((m) => m.jar).map((m) => [m.nev, m.kulcs === 'atalany' ? `${r.szobak} × ${F(m.ado / r.szobak)} = ${F(m.ado)}` : `${F(m.jovedelem)} × 28% = ${F(m.ado)}`, m.kulcs === 'atalany' ? 'Szja tv. 57/A. §' : 'Szja tv. 17. §; Szocho tv.']),
    ['Rövid távon marad', `${F(R.bevetel)} − ${F(R.koltseg)} − ${F(R.ado)} = ${F(R.netto)}`, ''],
    ['Hosszú távon marad', `${F(H.bevetel)} − ${F(H.koltseg)} − ${F(H.ado)} = ${F(H.netto)}`, 'Szja tv. 16–17. §'],
    r.fordul !== null && ['Fordulópont', `havi ${tized(r.fordul, 1)} foglalt éjszakánál egyezik a két összeg`, ''],
  ]);
  h = jelekkel(h);
  h += megjegyzes('Az idegenforgalmi adót a vendégtől szeded be, ezért nincs benne. Nem számoltuk: a platform jutaléka utáni áfát, a berendezés beszerzését és a szocho éves felső határát. Rövid távon a bevétel szezonális: nyáron több, télen kevesebb a foglalás, ezért az éves átlaggal számolj.', 'halk');
  return h;
}

/* ---------- A kalkulátorok közös leírása: ugyanez fut az építéskor (minta) és a böngészőben ---------- */
const sz = (v) => (v === '' || v == null ? NaN : Number(String(v).replace(/[\s  ]/g, '').replace(',', '.')));
const ures = (e, mezok) => mezok.every((k) => e[k] === '' || e[k] == null || e[k] === false);
export const KALKULATOROK = {
  eladas: {
    kulcs: ['eladasiAr', 'szerzesiErtek', 'szerzesEv', 'ismeretlen'],
    minta: (ev) => ({ adat: { eladasiAr: '60000000', szerzesiErtek: '50000000', szerzesKoltseg: '2000000', szerzesEv: String(ev - 2), eladasEv: String(ev) }, leiras: `egy ${ev - 2}-ben 50 millió forintért vett és ${rag(ev, 'ban', 'ben')} 60 millió forintért eladott lakás, 2 millió forint illetékkel és ügyvédi díjjal` }),
    panel: (adat, e) => eladasPanel(adat, S.eladasSzja(adat, { eladasEv: e.eladasEv === '' || e.eladasEv == null ? adat.ev : sz(e.eladasEv), szerzesEv: sz(e.szerzesEv), eladasiAr: sz(e.eladasiAr), szerzesiErtek: e.szerzesiErtek === '' || e.szerzesiErtek == null ? '' : sz(e.szerzesiErtek), szerzesKoltseg: sz(e.szerzesKoltseg), beruhazas: sz(e.beruhazas), allagmegovas: sz(e.allagmegovas), eladasKoltseg: sz(e.eladasKoltseg), ismeretlen: e.ismeretlen === true })),
  },
  illetek: {
    kulcs: ['ertek'],
    minta: () => ({ adat: { ertek: '68000000', eladottErtek: '52000000', eladasMikor: 'elotte' }, leiras: 'egy 68 millió forintos lakás, miközben az előző lakásodat két éve 52 millióért adtad el' }),
    panel: (adat, e) => illetekPanel(adat, S.illetek(adat, { ertek: sz(e.ertek), hanyad: e.hanyad === '' || e.hanyad == null ? 100 : sz(e.hanyad), ujVallalkozotol: e.kitol === 'vallalkozo', rokon: e.kitol === 'rokon', csok: e.csok === true, telek: e.telek === true, haszonelvezoKor: e.haszonelvezoKor, elso: e.elso === true, fiatal35: e.fiatal35 === true, eladottErtek: sz(e.eladottErtek), eladasMikor: e.eladasMikor || 'elotte' })),
  },
  wekerle: {
    kulcs: ['vetelar', 'eletkor', 'onero', 'alapterulet'],
    minta: () => ({ adat: { vetelar: '62000000', alapterulet: '54', onero: '12000000', eletkor: '31', tulajdon: 'nincs', ingatlan: 'lakas', allapot: 'hasznalt' }, leiras: 'egy 31 éves vevő, 62 millió forintos, 54 négyzetméteres használt lakás, 12 millió forint önerővel' }),
    panel: (adat, e) => wekerlePanel(adat, S.wekerle(adat, { vetelar: sz(e.vetelar), alapterulet: e.alapterulet, onero: e.onero, eletkor: e.eletkor, eletkor2: e.kozos === true ? e.eletkor2 : '', tulajdon: e.tulajdon || '', ingatlan: e.ingatlan || 'lakas', allapot: e.allapot || 'hasznalt', futamido: e.futamido, piaciKamat: e.piaciKamat === '' || e.piaciKamat == null ? '' : sz(e.piaciKamat), ujVallalkozotol: e.allapot === 'uj' })),
  },
  kiadas: {
    kulcs: ['havi'],
    minta: (ev) => ({ adat: { havi: '260000', honap: '12', koltseg: '420000', ev: String(ev) }, leiras: 'havi 260 000 forintért egész évben kiadott lakás, évi 420 000 forint számlával igazolt költséggel' }),
    panel: (adat, e) => kiadasPanel(adat, S.berbeadas(adat, { havi: sz(e.havi), honap: e.honap, egyeb: sz(e.egyeb), koltseg: sz(e.koltseg), ertekcsokkenes: sz(e.ertekcsokkenes), berelt: sz(e.berelt), ev: adat.ev })),
  },
  hitelkepesseg: {
    kulcs: ['jovedelem'],
    minta: () => ({ adat: { jovedelem: '650000', meglevo: '0', periodus: 'hosszu', kamat: '6,5', futamido: '25', ertek: '55000000' }, leiras: 'havi 650 000 forint nettó háztartási jövedelem, más hitel nélkül, végig fix kamatú hitel 25 évre, egy 55 millió forintos lakáshoz' }),
    panel: (adat, e) => hitelkepessegPanel(adat, S.hitelkepesseg(adat, { jovedelem: sz(e.jovedelem), meglevo: sz(e.meglevo), periodus: e.periodus, zold: e.zold === true, kamat: e.kamat === '' || e.kamat == null ? '' : sz(e.kamat), futamido: e.futamido, ertek: sz(e.ertek), elsoLakas: e.elsoLakas === true })),
  },
  ingyenes: {
    kulcs: ['ertek'],
    minta: () => ({ adat: { jogcim: 'orokles', vagyon: 'lakas', ertek: '40000000', rokonsag: 'egyeb' }, leiras: 'egy 40 millió forintos lakás, amelyet a nagynénédtől örökölsz' }),
    panel: (adat, e) => ingyenesPanel(adat, S.ingyenesIlletek(adat, { jogcim: e.jogcim || 'orokles', vagyon: e.vagyon || 'lakas', ertek: sz(e.ertek), hanyad: e.hanyad === '' || e.hanyad == null ? 100 : sz(e.hanyad), terhek: sz(e.terhek), haszonelvezoKor: e.haszonelvezoKor, rokonsag: e.rokonsag || 'egyeb' })),
  },
  haszonelvezet: {
    kulcs: ['ertek'],
    minta: () => ({ adat: { ertek: '50000000', tipus: 'holtig', kor: '68' }, leiras: 'egy 50 millió forintos lakás, holtig tartó haszonélvezettel, 68 éves haszonélvezővel' }),
    panel: (adat, e) => haszonelvezetPanel(adat, S.haszonelvezet(adat, { ertek: sz(e.ertek), tipus: e.tipus || 'holtig', kor: e.kor, evek: e.evek, rokon: e.rokon === true })),
  },
  elotorlesztes: {
    kulcs: ['toke', 'osszeg'],
    minta: () => ({ adat: { toke: '20000000', kamat: '6', ev: '20', osszeg: '3000000' }, leiras: '20 millió forint tartozás 6% kamattal, még 20 év, és 3 millió forint előtörlesztés' }),
    panel: (adat, e) => elotorlesztesPanel(adat, S.elotorlesztes(adat, { toke: sz(e.toke), kamat: e.kamat === '' || e.kamat == null ? '' : sz(e.kamat), honap: sz(e.ev) * 12, osszeg: sz(e.osszeg), dij: e.dij === '' || e.dij == null ? '' : sz(e.dij) })),
  },
  emeles: {
    kulcs: ['dij'],
    minta: () => ({ adat: { dij: '240000' }, leiras: 'havi 240 000 forintos bérleti díj' }),
    panel: (adat, e) => emelesPanel(adat, S.berletiEmeles(adat, { dij: sz(e.dij), ev: e.ev, sajat: e.sajat === '' || e.sajat == null ? '' : sz(e.sajat) })),
  },
  hozam: {
    kulcs: ['vetelar', 'havi'],
    minta: () => ({ adat: { vetelar: '48000000', egyeb: '600000', felujitas: '2500000', havi: '230000', honap: '11', koltseg: '450000' }, leiras: 'egy 48 millió forintos lakás 2,5 millió forintos felújítással, havi 230 000 forintért kiadva, évi 11 hónapra' }),
    panel: (adat, e) => hozamPanel(adat, S.hozam(adat, { vetelar: sz(e.vetelar), egyeb: sz(e.egyeb), felujitas: sz(e.felujitas), havi: sz(e.havi), honap: e.honap, koltseg: sz(e.koltseg), ev: adat.ev, hitel: sz(e.hitel), kamat: e.kamat === '' || e.kamat == null ? '' : sz(e.kamat), futamido: e.futamido, allampapir: e.allampapir === '' || e.allampapir == null ? '' : sz(e.allampapir) })),
  },
  rovidtav: {
    kulcs: ['ejAr', 'ejszaka', 'hosszuHavi'],
    minta: () => ({ adat: { ejAr: '32000', ejszaka: '20', tartozkodas: '3', takaritas: '8000', rezsi: '35000', kozosEv: '360000', szobak: '1', telepules: 'budapest', hosszuHavi: '260000' }, leiras: 'egy budapesti egyszobás lakás 32 000 forintért éjszakánként, havi 20 foglalt éjszakával, vagy hosszú távra havi 260 000 forintért' }),
    panel: (adat, e) => { const o = (k) => (e[k] === '' || e[k] == null ? '' : sz(e[k])); return rovidtavPanel(adat, S.rovidTav(adat, { ejAr: sz(e.ejAr), ejszaka: sz(e.ejszaka), tartozkodas: o('tartozkodas'), platform: o('platform'), takaritas: sz(e.takaritas), rezsi: sz(e.rezsi), kozosEv: sz(e.kozosEv), egyebEv: sz(e.egyebEv), szobak: o('szobak'), telepules: e.telepules || 'budapest', tobbLakas: e.tobbLakas === true, hosszuHavi: sz(e.hosszuHavi), hosszuHonap: o('hosszuHonap') })); },
  },
  indulo: {
    kulcs: ['vetelar'],
    minta: () => ({ adat: { vetelar: '50000000', hitel: '40000000', kitol: 'magan', megtakaritas: '12000000' }, leiras: 'egy 50 millió forintos használt lakás 40 millió forint piaci hitellel, 12 millió forint megtakarítással' }),
    panel: (adat, e) => induloPanel(adat, S.indulo(adat, { vetelar: sz(e.vetelar), hitel: sz(e.hitel), tamogatott: e.tamogatott === true, megtakaritas: e.megtakaritas === '' || e.megtakaritas == null ? '' : sz(e.megtakaritas), kitol: e.kitol || 'magan', elso: e.elso === true, fiatal35: e.fiatal35 === true, csok: e.csok === true, ugyvedi: e.ugyvedi === '' || e.ugyvedi == null ? '' : sz(e.ugyvedi), ertekbecsles: e.ertekbecsles === '' || e.ertekbecsles == null ? '' : sz(e.ertekbecsles), kozjegyzo: e.kozjegyzo === '' || e.kozjegyzo == null ? '' : sz(e.kozjegyzo), folyositas: e.folyositas === '' || e.folyositas == null ? '' : sz(e.folyositas), egyeb: sz(e.egyeb), foglaloSzazalek: e.foglalo === '' || e.foglalo == null ? '' : sz(e.foglalo) })),
  },
  berlesvetel: {
    kulcs: ['vetelar', 'berlet'],
    minta: () => ({ adat: { vetelar: '50000000', onero: '10000000', berlet: '220000', kozos: '25000', evek: '10' }, leiras: 'egy 50 millió forintos lakás 10 millió forint önerővel, vagy egy hasonló lakás bérlése havi 220 000 forintért, 10 évre' }),
    panel: (adat, e) => { const o = (k) => (e[k] === '' || e[k] == null ? '' : sz(e[k])); return berlesVetelPanel(adat, S.berlesVetel(adat, { vetelar: sz(e.vetelar), onero: o('onero'), berlet: sz(e.berlet), kozos: sz(e.kozos), evek: o('evek'), kamat: o('kamat'), futamido: o('futamido'), arNo: o('arNo'), berNo: o('berNo'), hozam: o('hozam'), karbantartas: o('karbantartas') })); },
  },
  lakasvaltas: {
    kulcs: ['eladasiAr', 'vetelar'],
    minta: (ev) => ({ adat: { eladasiAr: '60000000', szerzesEv: String(ev - 7), szerzesiErtek: '35000000', kozvetito: '1800000', hitelTartozas: '8000000', vetelar: '85000000', vetelKoltseg: '900000', megtakaritas: '5000000', sorrend: 'elobb_elad' }, leiras: `egy ${ev - 7}-ben 35 millióért vett lakás eladása 60 millióért, 8 millió forint hiteltartozással, és egy 85 milliós lakás vétele 5 millió forint megtakarítással` }),
    panel: (adat, e) => lakasvaltasPanel(adat, S.lakasvaltas(adat, { eladasiAr: sz(e.eladasiAr), szerzesEv: e.szerzesEv, szerzesiErtek: e.szerzesiErtek === '' || e.szerzesiErtek == null ? '' : sz(e.szerzesiErtek), koltsegek: sz(e.koltsegek), kozvetito: sz(e.kozvetito), hitelTartozas: sz(e.hitelTartozas), vetelar: sz(e.vetelar), vetelKoltseg: sz(e.vetelKoltseg), megtakaritas: sz(e.megtakaritas), eladasEv: adat.ev, sorrend: e.sorrend })),
  },
};
/** A kalkulátor eredménye. Üres űrlapnál címkézett minta: { html, minta }. */
export function kalkHtml(tipus, adat, e = {}) {
  const k = KALKULATOROK[tipus];
  if (!k) return { html: uresPanel('Töltsd ki az űrlapot.'), minta: false };
  if (!ures(e, k.kulcs)) return { html: k.panel(adat, e), minta: false };
  const m = k.minta(adat.ev);
  const be = { ...e };
  for (const [kk, v] of Object.entries(m.adat)) if (be[kk] === '' || be[kk] == null || be[kk] === false) be[kk] = v;
  return { html: mintaJelzes(m.leiras, 'Írd be a saját adataidat, és a minta helyett azokkal számolunk.') + k.panel(adat, be), minta: true };
}
