// Település-, kerület- és vármegyeoldalak a KSH Ingatlanadattár valódi eladási áraiból.
// Csak ott van saját oldal, ahol az utolsó három évben együtt legalább OLDAL_MIN_DB adásvétel volt (a kerületeknek mindig),
// hogy minden oldalon legyen érdemi adat. A kisebb települések a vármegyeoldal táblázatában szerepelnek.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as M from './js/megjelenites.mjs';
import * as S from './js/szamitas.mjs';
import { oldal, oldalfej, morzsaLd, tovabb, esc, gyik, gyikLd, forrasLista, datumHu } from './sablon.mjs';
import { ARAK_UT, ILLETEK_UT, INDULO_UT, FLIP_UT } from './oldalak.mjs';
import { GYOKER } from './adat.mjs';

export const OLDAL_MIN_DB = 90;
const TIPUS = { o: 'Összesen', t: 'Társasházi lakás', p: 'Panellakás', h: 'Családi ház' };

export const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\./g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const megyeRovid = (n) => n.replace(/ vármegye$/, '');
// „az 1.”, „az 5.”, „az 50.”, „a 6.”: a névelő a szám kiejtésétől függ (egy, öt, ezer)
const azSzam = (n) => { const t = String(n); return `${t[0] === '5' || (t[0] === '1' && (t.length === 1 || t.length === 4)) ? 'az' : 'a'} ${t}.`; };
const helyezes = (n) => (n === 1 ? 'a legdrágább' : `${azSzam(n)} legdrágább`);
const az = (nev) => `${/^[aáeéiíoóöőuúüű]/i.test(nev) ? 'az' : 'a'} ${nev}`;

const geo = {};
function geom(nev) { return (geo[nev] ||= JSON.parse(readFileSync(join(GYOKER, `forras/geo/${nev}.json`), 'utf8'))); }
const utcaCache = {};
function utcak(m) {
  if (!(m in utcaCache)) { const f = join(GYOKER, `data/utcak/${m}.json`); utcaCache[m] = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}; }
  return utcaCache[m];
}

/** Melyik egységnek és vármegyének van oldala: { egysegek: Map(kód → út), megyek: Map(kód → út) } */
export function oldalLista(adat) {
  const a = adat.arak, n = a.evek.length - 1;
  const egysegek = new Map(), megyek = new Map();
  for (const [k, u] of Object.entries(a.egysegek)) {
    const db3 = [n, n - 1, n - 2].reduce((t, i) => t + (u.s.od?.[i] || 0), 0);
    if ((u.t === 5 || db3 >= OLDAL_MIN_DB) && u.s.o?.[n] != null) egysegek.set(k, `${ARAK_UT}${slug(u.n)}/`);
  }
  for (const [k, m] of Object.entries(a.megyek)) megyek.set(k, `${ARAK_UT}${slug(k === '01' ? 'Budapest' : m.n)}/`);
  return { egysegek, megyek };
}

const ft = (ezer) => `${M.fmt(ezer * 1000)} Ft`;
const szaz = (v) => (v == null ? '–' : `${v >= 0 ? '+' : '−'}${M.fmt(Math.abs(Math.round(v)))}%`);
const valt = (s, i, j) => (s?.[i] != null && s?.[j] != null ? (s[i] / s[j] - 1) * 100 : null);

/** Kis térkép: a vármegye (vagy Budapest) települései az átlagár szerint színezve, a kiemelt egységgel. */
function miniTerkep(adat, megyeKod, kiemelt, L, lista) {
  const a = adat.arak, n = a.evek.length - 1;
  const szin = (k) => { const v = a.egysegek[k]?.s.o?.[n]; return v == null ? null : M.AR_SZINEK[M.arOsztaly(v)]; };
  const link = (k, belso) => { const ut = lista.egysegek.get(k); return ut && k !== kiemelt ? `<a href="${L.l(ut)}" aria-label="${esc(a.egysegek[k].n)}">${belso}</a>` : belso; };
  const ut = (k, d) => { const c = szin(k); const nev = a.egysegek[k]?.n; return link(k, `<path d="${d}" class="${k === kiemelt ? 'mt-kiemelt' : ''}${c ? '' : ' mt-nincs'}"${c ? ` style="fill:${c}"` : ''}>${nev ? `<title>${esc(nev)}${a.egysegek[k].s.o?.[n] != null ? `: ${ft(a.egysegek[k].s.o[n])}/m²` : ''}</title>` : ''}</path>`); };
  if (megyeKod === '01') {
    const B = geom('budapest');
    return `<svg class="mini-terkep" viewBox="${B.vb}" role="img" aria-label="Budapest kerületei az átlagos négyzetméterár szerint">${B.u.map(([k, d]) => ut(k, d)).join('')}</svg>`;
  }
  const G = geom('orszag');
  const mNev = megyeRovid(a.megyek[megyeKod]?.n || '');
  const mUt = G.m.find(([x]) => x === mNev)?.[1];
  if (!mUt) return '';
  const sz = mUt.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const xs = sz.filter((_, i) => i % 2 === 0), ys = sz.filter((_, i) => i % 2 === 1);
  const [x0, y0, x1, y1] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const p = 3, bent = ([, , bb]) => bb[0] >= x0 - 0.5 && bb[2] <= x1 + 0.5 && bb[1] >= y0 - 0.5 && bb[3] <= y1 + 0.5;
  // A vármegye befoglaló téglalapjába eső települések közül csak a saját vármegyéjéé színes (a szomszédos megyéké halvány)
  const sajat = (k) => a.egysegek[k]?.m === megyeKod;
  const utak = G.u.filter(bent).map(([k, d]) => (sajat(k) ? ut(k, d) : `<path d="${d}" class="mt-szomszed"/>`)).join('');
  return `<svg class="mini-terkep" viewBox="${x0 - p} ${y0 - p} ${x1 - x0 + 2 * p} ${y1 - y0 + 2 * p}" role="img" aria-label="${esc(mNev)} vármegye települései az átlagos négyzetméterár szerint"><clipPath id="mt-vagas"><path d="${mUt}"/></clipPath><g clip-path="url(#mt-vagas)">${utak}</g><path d="${mUt}" class="mt-megye"/></svg>`;
}
const skala = () => `<div class="mini-skala" aria-hidden="true"><span>${M.fmt(M.AR_HATAR.ar[0])} ezer Ft/m² alatt</span><i>${M.AR_SZINEK.map((c) => `<b style="background:${c}"></b>`).join('')}</i><span>${M.tized(M.AR_HATAR.ar.at(-1) / 1000, 2)} millió felett</span></div>`;

function evTabla(s, evek) {
  const tipusok = ['o', 't', 'p', 'h'].filter((t) => s[t]?.some((v) => v != null));
  return `<div class="tabla-tarto"><table class="tabla kicsi-tabla"><thead><tr><th scope="col">Év</th>${tipusok.map((t) => `<th scope="col">${TIPUS[t]}, Ft/m²</th>`).join('')}</tr></thead><tbody>${evek.map((ev, i) => `<tr><th scope="row">${ev}</th>${tipusok.map((t) => `<td>${s[t]?.[i] != null ? `${M.fmt(s[t][i] * 1000)}<small> · ${M.fmt(s[`${t}d`]?.[i] || 0)} db</small>` : '–'}</td>`).join('')}</tr>`).reverse().join('')}</tbody></table></div>`;
}

function grafikon(s, evek) {
  const pontok = s.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pontok.length < 2) return '';
  const max = Math.max(...pontok.map(([, v]) => v)), min = 0;
  const W = 640, H = 220, px = (i) => 40 + (i / (evek.length - 1)) * (W - 60), py = (v) => H - 28 - ((v - min) / (max - min || 1)) * (H - 50);
  const d = pontok.map(([i, v], j) => `${j ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join('');
  const terulet = `${d}L${px(pontok.at(-1)[0]).toFixed(1)} ${py(0)}L${px(pontok[0][0]).toFixed(1)} ${py(0)}Z`;
  return `<figure class="ar-grafikon"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Az átlagos négyzetméterár ${evek[0]} és ${evek.at(-1)} között"><path class="ag-terulet" d="${terulet}"/><path class="ag-vonal" d="${d}" pathLength="1"/>${pontok.map(([i, v]) => `<g><circle cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="${i === evek.length - 1 ? 5 : 3.5}"/>${i === pontok[0][0] || i === evek.length - 1 ? `<text x="${px(i).toFixed(1)}" y="${(py(v) - 12).toFixed(1)}" text-anchor="middle">${M.fmt(v * 1000)}</text>` : ''}</g>`).join('')}${evek.map((ev, i) => (i % 3 === 0 || i === evek.length - 1 ? `<text class="ag-ev" x="${px(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${ev}</text>` : '')).join('')}</svg><figcaption>Átlagos négyzetméterár, Ft (minden lakóingatlan)</figcaption></figure>`;
}

function utcaTabla(lista, evek, ix) {
  // Évenként: egy listában csak ugyanannak az évnek az árai, különben a sorrend félrevezető
  const evSzam = evek.map((_, i) => lista.filter((l) => l[1][i] != null).length);
  const sorok = (i) => lista.filter((l) => l[1][i] != null).sort((x, y) => y[1][i] - x[1][i]);
  const sor = (l, i) => `<tr><th scope="row">${esc(l[0])}</th><td>${M.fmt(l[1][i] * 1000)}</td><td>${M.fmt(l[2][i] || 0)}</td><td>${i > 0 && l[1][i - 1] != null ? szaz((l[1][i] / l[1][i - 1] - 1) * 100) : '–'}</td></tr>`;
  let i0 = ix;
  while (i0 > 0 && !evSzam[i0]) i0--;
  if (!evSzam[i0]) return '';
  const adat = lista.map(([n, ar, db]) => [n, ar, db]);
  return `<div class="utcak" data-utcak>
<div class="utca-vezerlo"><label class="utca-ev"><span>Év</span><select data-utca-ev>${evek.map((ev, i) => (evSzam[i] ? `<option value="${i}"${i === i0 ? ' selected' : ''}>${ev} (${evSzam[i]} utca)</option>` : '')).reverse().join('')}</select></label>
<label class="utca-szuro"><span class="sr">Utca keresése</span><input type="search" placeholder="Utca keresése" data-utca-szuro></label></div>
<div class="tabla-tarto utca-tarto"><table class="tabla kicsi-tabla"><thead><tr><th scope="col">Utca</th><th scope="col">Ft/m², <span data-utca-evcim>${evek[i0]}</span></th><th scope="col">Adásvétel</th><th scope="col">Előző évhez</th></tr></thead><tbody>${sorok(i0).map((l) => sor(l, i0)).join('')}</tbody></table></div>
<p class="kicsi halk">Csak azok az utcák, ahol az adott évben legalább három adásvétel volt. A sorrend az adott év átlagára szerint.</p>
<script type="application/json" data-utca-adat>${JSON.stringify(adat).replace(/</g, '\\u003c')}</script>
</div>
<script>(function(){var d=document.querySelector('[data-utcak]');if(!d)return;var A=JSON.parse(d.querySelector('[data-utca-adat]').textContent),ev=d.querySelector('[data-utca-ev]'),q=d.querySelector('[data-utca-szuro]'),tb=d.querySelector('tbody'),cim=d.querySelector('[data-utca-evcim]'),E=${JSON.stringify(evek)};
var f=function(n){return Math.round(n).toLocaleString('hu-HU')},e=function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
function rajz(){var i=+ev.value,s=q.value.trim().toLowerCase();cim.textContent=E[i];tb.innerHTML=A.filter(function(l){return l[1][i]!=null&&(!s||l[0].toLowerCase().indexOf(s)>=0)}).sort(function(x,y){return y[1][i]-x[1][i]}).map(function(l){var p=i>0&&l[1][i-1]!=null?Math.round((l[1][i]/l[1][i-1]-1)*100):null;return'<tr><th scope="row">'+e(l[0])+'</th><td>'+f(l[1][i]*1000)+'</td><td>'+f(l[2][i]||0)+'</td><td>'+(p==null?'–':(p>=0?'+':'−')+f(Math.abs(p))+'%')+'</td></tr>'}).join('')}
ev.addEventListener('change',rajz);q.addEventListener('input',rajz);})();</script>`;
}

function forrasBlokk(adat, becsles) {
  const f = adat.arak.forras;
  return `<h2>Források</h2>${forrasLista([
    { nev: esc(f.nev), url: f.url, d: `ellenőrizve: ${datumHu(adat.arak.ellenorizve)}` },
    ...(becsles ? [{ nev: esc(becsles.forras.nev), url: becsles.forras.url, d: 'a becsléshez' }] : []),
    { nev: 'Határok: © OpenStreetMap-közreműködők (ODbL), wuerdo/geoHungary', url: 'https://www.openstreetmap.org/copyright', d: '' },
  ])}`;
}

/** Egy település vagy kerület oldala */
export function telepulesOldal(k, kod, lista) {
  const { adat } = k;
  const a = adat.arak, evek = a.evek, n = evek.length - 1, ev = evek[n], ev0 = evek[0];
  const u = a.egysegek[kod], s = u.s, ut = lista.egysegek.get(kod);
  const megye = a.megyek[u.m], mUt = lista.megyek.get(u.m);
  const kerulet = u.t === 5;
  const ar = s.o[n], db = s.od?.[n];
  const tars = Object.entries(a.egysegek).filter(([, x]) => x.m === u.m && x.s.o?.[n] != null).sort((x, y) => y[1].s.o[n] - x[1].s.o[n]);
  const hely = tars.findIndex(([x]) => x === kod) + 1;
  const orszagos = Object.values(a.egysegek).filter((x) => x.s.o?.[n] != null && (x.s.od?.[n] || 0) >= 10).sort((x, y) => y.s.o[n] - x.s.o[n]);
  const orszHely = orszagos.findIndex((x) => x === u) + 1;
  const be = S.arBecsles(adat, u);
  const lista2 = utcak(u.m)[kod] || [];
  const v15 = valt(s.o, n, s.o.findIndex((x) => x != null)), v1 = valt(s.o, n, n - 1);
  const elsoEv = evek[s.o.findIndex((x) => x != null)];
  const megyeAr = megye?.s.o?.[n];
  const kozel = [...lista.egysegek.keys()].filter((x) => x !== kod && (kerulet ? a.egysegek[x].t === 5 : a.egysegek[x].m === u.m)).sort((x, y) => Math.abs(a.egysegek[x].s.o[n] - ar) - Math.abs(a.egysegek[y].s.o[n] - ar)).slice(0, 6).sort((x, y) => a.egysegek[y].s.o[n] - a.egysegek[x].s.o[n]);
  const csoport = kerulet ? 'Budapest' : `${megyeRovid(megye.n)} vármegye`;
  const tipSorok = ['t', 'p', 'h'].filter((t) => s[t]?.[n] != null);
  const legdragabbUtca = lista2.length ? lista2.map(([nv, arr]) => [nv, arr[n]]).filter(([, x]) => x != null).sort((x, y) => y[1] - x[1])[0] : null;
  const cim = `${u.n}: mennyiért kelnek el a lakások?`;
  const leiras = `${u.n} lakásárai ${M.evBan(ev)}: átlagosan ${ft(ar)}/m² ${M.fmt(db)} valódi adásvételből (KSH, NAV-illetékadatok), ${elsoEv} óta ${szaz(v15)}${lista2.length ? `, ${M.fmt(lista2.length)} utca árával` : ''}.`;
  const kerdesek = [
    { k: 'Mennyi most egy négyzetméter?', v: [`${esc(u.n)}: ${M.evBan(ev)} átlagosan ${ft(ar)} volt egy lakás négyzetmétere, ${M.fmt(db)} adásvétel alapján.${be ? ` Az újabb KSH-adatok szerint ${be.hol} ${be.ev}-re ${szaz((be.szorzo - 1) * 100).replace('+', '')}-kal nőttek az árak, így nagyjából ${ft(be.ar)}/m²-rel számolhatsz. Ez becslés.` : ''}`] },
    { k: `Mennyit drágultak a lakások ${elsoEv} óta?`, v: [`${esc(u.n)}: ${szaz(v15).replace('+', '')}-kal, ${ft(s.o.find((x) => x != null))}/m²-ről ${ft(ar)}/m²-re. Egy év alatt ${szaz(v1)}.`] },
    ...(legdragabbUtca ? [{ k: 'Melyik utcában a legdrágábbak a lakások?', v: [`${esc(u.n)}: ${M.evBan(ev)} ${az(esc(legdragabbUtca[0]))} volt a legdrágább, ${ft(legdragabbUtca[1])}/m². Az összes utcát lent, a táblázatban találod.`] }] : []),
  ];
  const tartalom = (L) => `
${oldalfej(L, { morzsa: [['Lakásárak', ARAK_UT], ...(mUt && !kerulet ? [[csoport, mUt]] : kerulet ? [['Budapest', mUt]] : []), u.n], cim, valasz: `${M.evBan(ev)} átlagosan ${ft(ar)} volt egy négyzetméter, ${M.fmt(db)} adásvétel alapján. ${elsoEv} óta ${szaz(v15).replace('+', '')}-kal drágultak a lakások${v1 != null ? `, az utolsó évben ${szaz(v1)}` : ''}. ${megyeAr != null && !kerulet ? `A vármegyei átlag ${ft(megyeAr)}, ` : kerulet ? `A budapesti átlag ${ft(megyeAr)}, ` : ''}${kerulet ? `a 23 kerület közül ez ${helyezes(hely)}.` : `${csoport} ${tars.length} települése közül ez ${helyezes(hely)}.`}${be ? ` Mai becslés: kb. ${ft(be.ar)}/m².` : ''}`, friss: M.datumNapon(a.ellenorizve || k.ma) })}
<div class="keret"><article class="cikk telepules">
<div class="telepules-fej">
<figure class="tmini">${miniTerkep(adat, u.m, kod, L, lista)}${skala()}<figcaption>${esc(csoport)}, ${ev}. <a href="${L.l(ARAK_UT)}#${encodeURIComponent(u.n)}">Megnyitás a nagy térképen</a></figcaption></figure>
<dl class="szam-kartyak">
<div><dt>Átlagár, ${ev}</dt><dd>${ft(ar)}<small>/m²</small></dd></div>
<div><dt>Adásvétel, ${ev}</dt><dd>${M.fmt(db)}</dd></div>
<div><dt>${elsoEv} óta</dt><dd>${szaz(v15)}</dd></div>
${orszHely ? `<div><dt>Az országban</dt><dd>${orszHely}.<small> legdrágább</small></dd></div>` : ''}
</dl>
</div>
${be ? `<p class="becsles-sor"><strong>Mai becslés: kb. ${ft(be.ar)}/m².</strong> A KSH ${be.ev}. évi településtípusos adatai szerint ${be.hol} ${szaz((be.szorzo - 1) * 100).replace('+', '')}-kal drágultak a használt lakások ${be.alapEv} óta. ${esc(u.n)} saját ${be.ev}. évi adatai az Ingatlanadattár következő kiadásában jelennek meg, várhatóan az év végén.</p>` : ''}
${tipSorok.length ? `<h2>Típusonként, ${ev}</h2><div class="tabla-tarto"><table class="tabla"><thead><tr><th scope="col">Típus</th><th scope="col">Ft/m²</th><th scope="col">Adásvétel</th><th scope="col">${elsoEv} óta</th></tr></thead><tbody>${tipSorok.map((t) => `<tr><th scope="row">${TIPUS[t]}</th><td>${M.fmt(s[t][n] * 1000)}</td><td>${M.fmt(s[`${t}d`]?.[n] || 0)}</td><td>${szaz(valt(s[t], n, s[t].findIndex((x) => x != null)))}</td></tr>`).join('')}</tbody></table></div>` : ''}
<h2>Az árak ${elsoEv} óta</h2>
${grafikon(s.o, evek)}
${evTabla(s, evek)}
${lista2.length ? `<h2>Utcánként</h2>\n${utcaTabla(lista2, evek, n)}` : ''}
${kozel.length ? `<h2>${kerulet ? 'Hasonló árú kerületek' : 'Hasonló árú települések a vármegyében'}</h2><ul class="kozeli">${kozel.map((x) => `<li><a href="${L.l(lista.egysegek.get(x))}">${esc(a.egysegek[x].n.replace(/^Budapest /, ''))}</a><span>${ft(a.egysegek[x].s.o[n])}/m²</span></li>`).join('')}</ul>${mUt ? `<p><a href="${L.l(mUt)}">${kerulet ? 'Mind a 23 kerület' : `${esc(csoport)} összes települése`}</a></p>` : ''}` : ''}
<h2>Számolj tovább</h2>
<ul>
<li><a href="${L.l(ILLETEK_UT)}">Mennyi illetéket fizetsz</a>, és elfogadja-e a NAV a vételárat?</li>
<li><a href="${L.l(INDULO_UT)}">Mennyi saját pénz kell</a> a vételár mellé?</li>
<li><a href="${L.l(FLIP_UT)}">Megéri felújítani és eladni?</a></li>
</ul>
<h2>Gyakori kérdések</h2>
${gyik(kerdesek)}
<p class="kicsi halk">Az árak a KSH Ingatlanadattárából valók: a NAV illetékadataiból számolt átlagok a magánszemélyek közötti valódi adásvételekből, nem hirdetési árak. A KSH csak ott közöl adatot, ahol az évben legalább három adásvétel volt. A vállalkozótól vett új lakások első eladása nincs benne.</p>
${forrasBlokk(adat, be)}
${tovabb(L, ARAK_UT)}
</article></div>`;
  return oldal(k, { cim: `${u.n} lakásárai ${ev}: négyzetméterár ${lista2.length ? 'utcánként' : 'típusonként'}, valódi eladásokból`, leiras, ut, tartalom, jsonld: [morzsaLd(k.cfg, [{ nev: 'Lakásárak', ut: ARAK_UT }, ...(mUt ? [{ nev: kerulet ? 'Budapest' : csoport, ut: mUt }] : []), { nev: u.n, ut }]), gyikLd(kerdesek)] });
}

/** Egy vármegye (vagy Budapest) oldala: minden település, amelyről van adat */
export function megyeOldal(k, mkod, lista) {
  const { adat } = k;
  const a = adat.arak, evek = a.evek, n = evek.length - 1, ev = evek[n];
  const m = a.megyek[mkod], s = m.s, ut = lista.megyek.get(mkod);
  const bp = mkod === '01';
  const nev = bp ? 'Budapest' : m.n;
  const sorok = Object.entries(a.egysegek).filter(([, x]) => x.m === mkod && x.s.o?.[n] != null).sort((x, y) => y[1].s.o[n] - x[1].s.o[n]);
  const ar = s.o[n], db = s.od?.[n], v15 = valt(s.o, n, 0);
  const sorrend = Object.entries(a.megyek).filter(([, x]) => x.s.o?.[n] != null).sort((x, y) => y[1].s.o[n] - x[1].s.o[n]);
  const hely = sorrend.findIndex(([x]) => x === mkod) + 1;
  const eleg = sorok.filter(([, x]) => (x.s.od?.[n] || 0) >= 10);
  const [, d] = (eleg.length ? eleg : sorok)[0], [, o] = (eleg.length ? eleg : sorok).at(-1);
  const rovid = (x) => x.replace(/^Budapest /, '');
  const cim = `${nev}: mennyiért kelnek el a lakások?`;
  const leiras = `${nev} lakásárai ${M.evBan(ev)} ${bp ? 'kerületenként' : 'településenként'}: átlagosan ${ft(ar)}/m², ${sorok.length} ${bp ? 'kerület' : 'település'} valódi eladási áraival (KSH Ingatlanadattár), ${evek[0]} óta ${szaz(v15)}.`;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: [['Lakásárak', ARAK_UT], nev], cim, valasz: `${M.evBan(ev)} átlagosan ${ft(ar)} volt egy négyzetméter, ${M.fmt(db)} adásvétel alapján, ${evek[0]} óta ${szaz(v15).replace('+', '')}-kal több. ${bp ? '' : `A 20 vármegye közül ez ${helyezes(hely)}. `}A legdrágább ${bp ? 'kerület' : 'település'}${bp ? '' : ' (legalább 10 adásvétellel)'} ${esc(rovid(d.n))} (${ft(d.s.o[n])}), a legolcsóbb ${esc(rovid(o.n))} (${ft(o.s.o[n])}).`, friss: M.datumNapon(a.ellenorizve || k.ma) })}
<div class="keret"><article class="cikk telepules">
<figure class="tmini tmini-nagy">${miniTerkep(adat, mkod, null, L, lista)}${skala()}<figcaption>${esc(nev)}, ${ev}. Kattints egy ${bp ? 'kerületre' : 'településre'} az oldaláért.</figcaption></figure>
<h2>${bp ? 'A kerületek' : 'A települések'}, ${ev}</h2>
<div class="tabla-tarto"><table class="tabla kicsi-tabla"><thead><tr><th scope="col">${bp ? 'Kerület' : 'Település'}</th><th scope="col">Ft/m²</th><th scope="col">Adásvétel</th><th scope="col">Egy év alatt</th></tr></thead><tbody>${sorok.map(([kk, x]) => `<tr><th scope="row">${lista.egysegek.has(kk) ? `<a href="${L.l(lista.egysegek.get(kk))}">${esc(rovid(x.n))}</a>` : esc(rovid(x.n))}</th><td>${M.fmt(x.s.o[n] * 1000)}</td><td>${M.fmt(x.s.od?.[n] || 0)}</td><td>${szaz(valt(x.s.o, n, n - 1))}</td></tr>`).join('')}</tbody></table></div>
<p class="kicsi halk">Csak ahol ${M.evBan(ev)} legalább három adásvétel volt. Saját oldala annak van, ahol az utolsó három évben együtt legalább ${OLDAL_MIN_DB} adásvétel volt${bp ? ' (a kerületeknek mindig)' : ''}.</p>
<h2>Az árak ${evek[0]} óta</h2>
${grafikon(s.o, evek)}
${evTabla(s, evek)}
<p class="kicsi halk">Az árak a KSH Ingatlanadattárából valók: a NAV illetékadataiból számolt átlagok a magánszemélyek közötti valódi adásvételekből, nem hirdetési árak.</p>
${forrasBlokk(adat, null)}
${tovabb(L, ARAK_UT)}
</article></div>`;
  return oldal(k, { cim: `${nev} lakásárai ${ev} ${bp ? 'kerületenként' : 'településenként'}, valódi eladásokból`, leiras, ut, tartalom, jsonld: [morzsaLd(k.cfg, [{ nev: 'Lakásárak', ut: ARAK_UT }, { nev, ut }])] });
}
