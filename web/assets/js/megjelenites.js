// Az elszámolás (eredmény) HTML-je. Ugyanezt használja az építő (a HTML-ben már benne van a szám)
// és a böngésző (élő számolás), így a kettő nem térhet el.
import * as S from './szamitas.js?v=b301b154';

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
