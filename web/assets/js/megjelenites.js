// Az elszámolás (eredmény) HTML-je. Ugyanezt használja az építő (a HTML-ben már benne van a szám)
// és a böngésző (élő számolás), így a kettő nem térhet el.
import * as S from './szamitas.js?v=db03edd2';

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
  h += tetel('Szerzési érték', `−${ftx(r.tetelek.szerzesiErtek)}`, { cls: 'levonas', forras: 'sajat' });
  if (r.tetelek.szerzesKoltseg) h += tetel('A szerzés költségei', `−${ftx(r.tetelek.szerzesKoltseg)}`, { cls: 'levonas', forras: 'sajat', al: 'illeték, ügyvédi díj' });
  if (r.tetelek.beruhazas) h += tetel('Értéknövelő beruházás', `−${ftx(r.tetelek.beruhazas)}`, { cls: 'levonas', forras: 'sajat' });
  if (r.tetelek.eladasKoltseg) h += tetel('Az eladás költségei', `−${ftx(r.tetelek.eladasKoltseg)}`, { cls: 'levonas', forras: 'sajat', al: 'közvetítő, hirdetés' });
  h += tetel('Számított összeg', ftx(r.szamitott), { al: r.levagva ? 'A költség legfeljebb az eladási árig számolható el.' : '' });
  h += tetel(`Ebből jövedelem: ${r.hanyad}%`, ftx(r.jovedelem), { forras: 'hivatalos', forrasUrl: f('jovedelem_hanyad'), al: r.evek === 0 ? 'a szerzés évében adod el' : `a szerzést követő ${r.evek}. évben adod el` });
  h += tetel(`Személyi jövedelemadó: ${r.kulcs}%`, ftx(r.ado), { cls: 'vegso', forras: 'hivatalos', forrasUrl: f('ado_mertek') });
  h += '</ul>';
  // Lépcső: évről évre kisebb rész adóköteles. Az oszlop magassága a százalék, a kiemelt az eladás éve.
  h += `<p class="panel-cim" id="lepcso-cim">Hogyan csökken az adóköteles rész?</p><ol class="lepcso" aria-labelledby="lepcso-cim">${r.skala.map((x, i) => `<li class="${x.most ? 'most' : ''}" style="--p:${x.szazalek};--i:${i}"><span class="lp-szazalek">${x.szazalek}%</span><span class="lp-oszlop"></span><span class="lp-ev">${x.ev}${x.szazalek === 0 ? '<small>és később</small>' : ''}</span>${x.most ? '<span class="sr">, ebben az évben adod el</span>' : ''}</li>`).join('')}</ol>`;
  h = jelekkel(h);
  if (r.ado > 0) {
    h += megjegyzes(`Az adót az eladást követő évben, ${datumIg(r.bevallas)} kell bevallani és befizetni.${r.reszletben ? ` Ekkora összeget kérelemre ${r.reszletben} havi részletben is megfizethetsz, pótlék nélkül.` : ''}`);
    if (r.jovoreAdo < r.ado) h += megjegyzes(r.jovoreAdo === 0 ? `Ha ${rag(r.eladasEv + 1, 'ban', 'ben')} adnád el, már nem kellene adót fizetned.` : `Ha ${rag(r.eladasEv + 1, 'ban', 'ben')} adnád el, az adó ${ftx(r.jovoreAdo)} lenne, vagyis ${fmt(r.ado - r.jovoreAdo)} forinttal kevesebb. ${r.mentesEv}. január 1-jétől adómentes.`);
    h += `<button class="szoveg-gomb naptar-gomb" type="button" data-naptar="${r.bevallas}" data-naptar-cim="Ingatlaneladás szja-ja: bevallás és befizetés" data-naptar-leiras="A ${r.eladasEv}. évi eladás adója: ${fmt(r.ado)} Ft. Az éves szja-bevallásban kell szerepeltetni.">A határidőt a naptáramba teszem</button>`;
  }
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
  if (r.hanyad < 100) h += tetel(`A rád eső rész: ${tized(r.hanyad, 2)}%`, ftx(r.alap), { forras: 'sajat' });
  h += tetel('Általános mérték', ftx(r.altalanos), { forras: 'hivatalos', forrasUrl: f('altalanos_mertek') });
  if (kedv) h += tetel(r.legjobb.nev, `−${ftx(r.megtakaritas)}`, { cls: 'levonas', forras: 'hivatalos', forrasUrl: f(r.legjobb.kulcs) });
  h += tetel('Fizetendő illeték', ftx(r.ado), { cls: 'vegso' });
  h += '</ul>';
  if (r.lehetosegek.length > 1) {
    h += `<p class="panel-cim">Melyik kedvezmény jár?</p><ul class="tetelek lehetosegek">${r.lehetosegek.map((x) => `<li class="${x === r.legjobb ? 'kiemelt-sor' : ''}${x.jar ? '' : ' nem-jar'}"><span>${x.nev}<span class="al">${x.miert}</span></span><span class="ossz-ertek">${x.jar ? ftx(x.ado) : 'nem jár'}</span></li>`).join('')}</ul>`;
    h += megjegyzes('Ha több kedvezmény is jár, a neked legkedvezőbbel számolunk. A kedvezményt a NAV-nál kell kérni, általában az adásvételi szerződés benyújtásakor, a B400-as adatlapon.');
  }
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
  h = jelekkel(h);
  if (r.illetekMegtakaritas) h += megjegyzes(`A cserét pótló vétel ${ftx(r.illetekMegtakaritas)} illetéket spórol: csak a két lakás értékének különbözete után fizetsz.`);
  h += megjegyzes(r.sorrend === 'elobb_vesz' ? `Ha előbb veszel, a régi lakást a vétel után ${r.utanaEv} éven belül el kell adnod, hogy a kedvezmény járjon. Addig a két lakás árát egyszerre kell előteremtened, ehhez gyakran áthidaló hitel kell.` : `Ha előbb adod el, az új lakást az eladás után ${r.elotteEv} éven belül kell megvenned, hogy a kedvezmény járjon.`);
  return h;
}

/* ---------- A kalkulátorok közös leírása: ugyanez fut az építéskor (minta) és a böngészőben ---------- */
const sz = (v) => (v === '' || v == null ? NaN : Number(String(v).replace(/[\s  ]/g, '').replace(',', '.')));
const ures = (e, mezok) => mezok.every((k) => e[k] === '' || e[k] == null || e[k] === false);
export const KALKULATOROK = {
  eladas: {
    kulcs: ['eladasiAr', 'szerzesiErtek', 'szerzesEv'],
    minta: (ev) => ({ adat: { eladasiAr: '60000000', szerzesiErtek: '50000000', szerzesKoltseg: '2000000', szerzesEv: String(ev - 2), eladasEv: String(ev) }, leiras: `egy ${ev - 2}-ben 50 millió forintért vett és ${rag(ev, 'ban', 'ben')} 60 millió forintért eladott lakás, 2 millió forint illetékkel és ügyvédi díjjal` }),
    panel: (adat, e) => eladasPanel(adat, S.eladasSzja(adat, { eladasEv: e.eladasEv === '' || e.eladasEv == null ? adat.ev : sz(e.eladasEv), szerzesEv: sz(e.szerzesEv), eladasiAr: sz(e.eladasiAr), szerzesiErtek: e.szerzesiErtek === '' || e.szerzesiErtek == null ? '' : sz(e.szerzesiErtek), szerzesKoltseg: sz(e.szerzesKoltseg), beruhazas: sz(e.beruhazas), eladasKoltseg: sz(e.eladasKoltseg) })),
  },
  illetek: {
    kulcs: ['ertek'],
    minta: () => ({ adat: { ertek: '68000000', eladottErtek: '52000000', eladasMikor: 'elotte' }, leiras: 'egy 68 millió forintos lakás, miközben az előző lakásodat két éve 52 millióért adtad el' }),
    panel: (adat, e) => illetekPanel(adat, S.illetek(adat, { ertek: sz(e.ertek), hanyad: e.hanyad === '' || e.hanyad == null ? 100 : sz(e.hanyad), ujVallalkozotol: e.kitol === 'vallalkozo', rokon: e.kitol === 'rokon', csok: e.csok === true, elso: e.elso === true, fiatal35: e.fiatal35 === true, eladottErtek: sz(e.eladottErtek), eladasMikor: e.eladasMikor || 'elotte' })),
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
