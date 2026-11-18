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
