// Település-, kerület- és vármegyeoldalak a KSH Ingatlanadattár valódi eladási áraiból.
// Csak ott van saját oldal, ahol az utolsó három évben együtt legalább OLDAL_MIN_DB adásvétel volt (a kerületeknek mindig),
// hogy minden oldalon legyen érdemi adat. A kisebb települések a vármegyeoldal táblázatában szerepelnek.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as M from './js/megjelenites.mjs';
import * as S from './js/szamitas.mjs';
import { oldal, oldalfej, morzsaLd, tovabb, esc, gyik, gyikLd, forrasLista, datumHu, forgalmi, elszamolas, sor, szamMezo } from './sablon.mjs';
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
const szazAbsz = (sz) => `${M.fmt(Math.abs(Math.round((sz - 1) * 100)))}%`;
/** A mai becslés magyarázata egy mondatban (két lépés). */
function becslesMagyarazat(be, nev) {
  const r = [];
  if (be.lepes1) r.push(`a KSH ${be.lepes1.ev}. évi adatai szerint ${be.lepes1.hol} ${szazAbsz(be.lepes1.szorzo)}-kal ${be.lepes1.szorzo >= 1 ? 'drágultak' : 'olcsóbbodtak'} a használt lakások ${be.alapEv} óta`);
  if (be.lepes2) r.push(`a KSH negyedéves árindexe szerint ${S.negyedevNev(be.lepes2.negyedev)}ében országosan ${szazAbsz(be.lepes2.szorzo)}-kal ${be.lepes2.szorzo >= 1 ? 'magasabbak' : 'alacsonyabbak'} az árak, mint ${be.lepes1 ? be.lepes1.ev : be.alapEv} átlagában`);
  return `${r.join(', ')}. Ez becslés: azt feltételezi, hogy ${nev} árai ugyanígy mozogtak.`;
}
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
    ...(becsles?.lepes1 ? [{ nev: esc(becsles.forras.nev), url: becsles.forras.url, d: 'a becsléshez' }] : []),
    ...(adat.kereset ? [{ nev: esc(adat.kereset.forras.nev), url: adat.kereset.forras.url, d: 'a megfizethetőséghez' }] : []),
    ...(becsles?.lepes2 && becsles.indexForras ? [{ nev: esc(becsles.indexForras.nev), url: becsles.indexForras.url, d: 'a becsléshez' }] : []),
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
  const mf = S.megfizethetoseg(adat, kod, u);
  const keresetHol = kerulet ? 'budapesti' : 'helyi';
  const lista2 = utcak(u.m)[kod] || [];
  const v15 = valt(s.o, n, s.o.findIndex((x) => x != null)), v1 = valt(s.o, n, n - 1);
  const elsoEv = evek[s.o.findIndex((x) => x != null)];
  const megyeAr = megye?.s.o?.[n];
  const kozel = [...lista.egysegek.keys()].filter((x) => x !== kod && (kerulet ? a.egysegek[x].t === 5 : a.egysegek[x].m === u.m)).sort((x, y) => Math.abs(a.egysegek[x].s.o[n] - ar) - Math.abs(a.egysegek[y].s.o[n] - ar)).slice(0, 6).sort((x, y) => a.egysegek[y].s.o[n] - a.egysegek[x].s.o[n]);
  const csoport = kerulet ? 'Budapest' : `${megyeRovid(megye.n)} vármegye`;
  const tipSorok = ['t', 'p', 'h'].filter((t) => s[t]?.[n] != null);
  const legdragabbUtca = lista2.length ? lista2.map(([nv, arr]) => [nv, arr[n]]).filter(([, x]) => x != null).sort((x, y) => y[1] - x[1])[0] : null;
  const cim = `${u.n}: mennyiért kelnek el a lakások?`;
  const leiras = `${u.n} lakásárai ${M.evBan(ev)}: átlagosan ${ft(ar)}/m² ${M.fmt(db)} valódi adásvételből (KSH, NAV-illetékadatok), ${elsoEv} óta ${szaz(v15)}${be ? `; becsült mai ár (${be.cimke}) kb. ${ft(be.ar)}/m²` : ''}${lista2.length ? `, ${M.fmt(lista2.length)} utca árával` : ''}.`;
  const kerdesek = [
    { k: 'Mennyi most egy négyzetméter?', v: [`${esc(u.n)}: ${M.evBan(ev)} átlagosan ${ft(ar)} volt egy lakás négyzetmétere, ${M.fmt(db)} adásvétel alapján.${be ? ` Mára (${be.cimke}) nagyjából ${ft(be.ar)}/m²-rel számolhatsz, mert ${becslesMagyarazat(be, esc(u.n))}` : ''}`] },
    { k: `Mennyit drágultak a lakások ${elsoEv} óta?`, v: [`${esc(u.n)}: ${szaz(v15).replace('+', '')}-kal, ${ft(s.o.find((x) => x != null))}/m²-ről ${ft(ar)}/m²-re. Egy év alatt ${szaz(v1)}.`] },
    ...(mf ? [{ k: 'Hány évnyi fizetésbe kerül egy lakás?', v: [`${esc(u.n)}: egy ${S.MEGFIZ_M2} m²-es lakás ${M.evBan(ev)} átlagosan ${ft(mf.ar * S.MEGFIZ_M2)} volt, ez ${M.tized(mf.evek, 1)} évnyi ${keresetHol} nettó átlagkereset (havi ${ft(mf.kereset / 1000)}, a KSH szerint, lakóhely alapján). Közben semmit nem költve.`] }] : []),
    ...(legdragabbUtca ? [{ k: 'Melyik utcában a legdrágábbak a lakások?', v: [`${esc(u.n)}: ${M.evBan(ev)} ${az(esc(legdragabbUtca[0]))} volt a legdrágább, ${ft(legdragabbUtca[1])}/m². Az összes utcát lent, a táblázatban találod.`] }] : []),
  ];
  const tartalom = (L) => `
${oldalfej(L, { morzsa: [['Lakásárak', ARAK_UT], ...(mUt && !kerulet ? [[csoport, mUt]] : kerulet ? [['Budapest', mUt]] : []), u.n], cim, valasz: `${M.evBan(ev)} átlagosan ${ft(ar)} volt egy négyzetméter, ${M.fmt(db)} adásvétel alapján. ${elsoEv} óta ${szaz(v15).replace('+', '')}-kal drágultak a lakások${v1 != null ? `, az utolsó évben ${szaz(v1)}` : ''}. ${megyeAr != null && !kerulet ? `A vármegyei átlag ${ft(megyeAr)}, ` : kerulet ? `A budapesti átlag ${ft(megyeAr)}, ` : ''}${kerulet ? `a 23 kerület közül ez ${helyezes(hely)}.` : `${csoport} ${tars.length} települése közül ez ${helyezes(hely)}.`}${mf ? ` Egy ${S.MEGFIZ_M2} m²-es lakás ára ${M.tized(mf.evek, 1)} évnyi ${keresetHol} nettó átlagkereset.` : ''}${be ? ` Becsült mai ár (${be.cimke}): kb. ${ft(be.ar)}/m².` : ''}`, friss: M.datumNapon(a.ellenorizve || k.ma) })}
<div class="keret"><article class="cikk telepules">
<div class="telepules-fej">
<figure class="tmini">${miniTerkep(adat, u.m, kod, L, lista)}${skala()}<figcaption>${esc(csoport)}, ${ev}. <a href="${L.l(ARAK_UT)}#${encodeURIComponent(u.n)}">Megnyitás a nagy térképen</a></figcaption></figure>
<dl class="szam-kartyak">
<div><dt>Átlagár, ${ev}</dt><dd>${ft(ar)}<small>/m²</small></dd></div>
${be ? `<div class="becsles-kartya"><dt>Becsült mai ár, ${be.cimke}</dt><dd>${ft(be.ar)}<small>/m²</small></dd></div>` : `<div><dt>Adásvétel, ${ev}</dt><dd>${M.fmt(db)}</dd></div>`}
<div><dt>${elsoEv} óta</dt><dd>${szaz(v15)}</dd></div>
${mf ? `<div><dt>${S.MEGFIZ_M2} m² ára, ${ev}</dt><dd>${M.tized(mf.evek, 1)}<small> évnyi fizetés</small></dd></div>` : orszHely ? `<div><dt>Az országban</dt><dd>${orszHely}.<small> legdrágább</small></dd></div>` : ''}
</dl>
</div>
${be ? `<p class="becsles-sor"><strong>Becsült mai ár, ${be.cimke}: kb. ${ft(be.ar)}/m².</strong> Így számoltuk: ${becslesMagyarazat(be, esc(u.n))} A valódi eladási árak ${be.alapEv + 1}-től az Ingatlanadattár következő kiadásaiban jelennek meg, és akkor ezek váltják a becslést.</p>` : ''}
<p class="ertek-link"><a class="gomb" href="${L.l(ERTEK_UT)}?t=${kod}">Mennyit ér a lakásom itt?</a> Becslés sávval, utcánként is.</p>
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
  return oldal(k, { cim: be ? `${u.n} lakásárai ${ev}–${be.ev}: valódi eladások és mai becslés${lista2.length ? ', utcánként' : ''}` : `${u.n} lakásárai ${ev}: négyzetméterár ${lista2.length ? 'utcánként' : 'típusonként'}, valódi eladásokból`, leiras, ut, tartalom, jsonld: [morzsaLd(k.cfg, [{ nev: 'Lakásárak', ut: ARAK_UT }, ...(mUt ? [{ nev: kerulet ? 'Budapest' : csoport, ut: mUt }] : []), { nev: u.n, ut }]), gyikLd(kerdesek)] });
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

/* ======================= ÉVES JELENTÉS ======================= */
// A legújabb Ingatlanadattár-évből magától generált jelentés: megállapítások, kvadráns, megfizethetőség, legnagyobb változások.
export const JELENTES_UT = `${ARAK_UT}jelentes/`;
const JELENTES_MIN_DB = 30;

/** Minden egység mutatói a legutóbbi évre (a CSV-hez és a jelentéshez). */
export function jelentesSorok(adat) {
  const a = adat.arak, n = a.evek.length - 1;
  return Object.entries(a.egysegek).map(([kod, u]) => {
    const s = u.s.o || [];
    const mf = S.megfizethetoseg(adat, kod, u);
    const mfMa = S.megfizethetosegMa(adat, kod, u);
    const be = S.arBecsles(adat, u);
    const i0 = s.findIndex((x) => x != null);
    return { kod, n: u.n, m: u.m, t: u.t, megye: a.megyek[u.m]?.n || '', ar: s[n], db: u.s.od?.[n] || 0, valt1: valt(s, n, n - 1), valt3: s[n] != null && s[n - 3] != null ? (Math.pow(s[n] / s[n - 3], 1 / 3) - 1) * 100 : null, valtKezd: i0 >= 0 ? valt(s, n, i0) : null, kezdEv: a.evek[i0], evek: mf?.evek ?? null, evekMa: mfMa?.evek ?? null, kereset: mf?.kereset ?? null, becsles: be?.ar ?? null, becslesCimke: be?.cimke ?? null };
  }).filter((x) => x.ar != null);
}

function median(t) { const s = [...t].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : 0; }

/** Kvadráns: vízszintesen az árszint, függőlegesen az egyéves drágulás, a pont mérete az adásvételek száma. */
function kvadrans(pontok, { cim, cimkek = 'mind', id }) {
  const W = 760, H = 520, bal = 70, jobb = 24, fent = 36, lent = 52;
  const xs = pontok.map((p) => p.ar), ys = pontok.map((p) => p.valt1);
  const xMin = Math.min(...xs) * 0.92, xMax = Math.max(...xs) * 1.05;
  const yMin = Math.min(-2, Math.min(...ys) * 1.12), yMax = Math.max(...ys) * 1.12;
  const x = (v) => bal + ((v - xMin) / (xMax - xMin)) * (W - bal - jobb);
  const y = (v) => fent + ((yMax - v) / (yMax - yMin)) * (H - fent - lent);
  const mx = median(xs), my = median(ys);
  const dbMax = Math.max(...pontok.map((p) => p.db));
  const r = (db) => 4 + 14 * Math.sqrt(db / dbMax);
  const tickX = []; for (let v = Math.ceil(xMin / 100) * 100; v <= xMax; v += (xMax - xMin > 900 ? 200 : 100)) tickX.push(v);
  const tickY = []; const lepes = yMax - yMin > 40 ? 10 : 5; for (let v = Math.ceil(yMin / lepes) * lepes; v <= yMax; v += lepes) tickY.push(v);
  const rovid = (n) => n.replace(/^Budapest /, '').replace(/ kerület$/, '');
  const cimkezett = new Set(cimkek === 'mind' ? pontok.map((p) => p.kod) : [...pontok].sort((p, q) => q.db - p.db).slice(0, 10).concat([...pontok].sort((p, q) => q.valt1 - p.valt1).slice(0, 3), [...pontok].sort((p, q) => p.valt1 - q.valt1).slice(0, 3), [...pontok].sort((p, q) => q.ar - p.ar).slice(0, 3)).map((p) => p.kod));
  return `<figure class="kvadrans" data-abra="${id}"><figcaption><b>${esc(cim)}</b></figcaption>
<svg class="kv-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cim)}" xmlns="http://www.w3.org/2000/svg">
<rect class="kv-negyed kv-dragul" x="${x(mx)}" y="${fent}" width="${W - jobb - x(mx)}" height="${y(my) - fent}"/>
<rect class="kv-negyed kv-felzarkozik" x="${bal}" y="${fent}" width="${x(mx) - bal}" height="${y(my) - fent}"/>
<text class="kv-negyednev" x="${W - jobb - 8}" y="${fent + 18}" text-anchor="end">Drága, és tovább drágul</text>
<text class="kv-negyednev" x="${bal + 8}" y="${fent + 18}">Olcsóbb, de felzárkózik</text>
<text class="kv-negyednev" x="${W - jobb - 8}" y="${H - lent - 10}" text-anchor="end">Drága, de lassul</text>
<text class="kv-negyednev" x="${bal + 8}" y="${H - lent - 10}">Olcsóbb, és lassan mozdul</text>
${tickX.map((v) => `<line class="kv-racs" x1="${x(v)}" x2="${x(v)}" y1="${fent}" y2="${H - lent}"/><text class="kv-tengely" x="${x(v)}" y="${H - lent + 18}" text-anchor="middle">${M.fmt(v)}</text>`).join('')}
${tickY.map((v) => `<line class="kv-racs${v === 0 ? ' kv-nulla' : ''}" x1="${bal}" x2="${W - jobb}" y1="${y(v)}" y2="${y(v)}"/><text class="kv-tengely" x="${bal - 8}" y="${y(v) + 4}" text-anchor="end">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}%</text>`).join('')}
<line class="kv-kozep" x1="${x(mx)}" x2="${x(mx)}" y1="${fent}" y2="${H - lent}"/><line class="kv-kozep" x1="${bal}" x2="${W - jobb}" y1="${y(my)}" y2="${y(my)}"/>
<text class="kv-tengelycim" x="${(bal + W - jobb) / 2}" y="${H - 8}" text-anchor="middle">Átlagos négyzetméterár, ezer Ft</text>
<text class="kv-tengelycim" transform="translate(16 ${(fent + H - lent) / 2}) rotate(-90)" text-anchor="middle">Drágulás egy év alatt</text>
${(() => {
    // Feliratok ütközés nélkül: jobbra, ha nem fér, balra, ha úgy sem, elmarad (a buborékban ott a név)
    const kor = (p) => { const cx = x(p.ar), cy = y(p.valt1), rr = r(p.db) * 0.8; return [cx - rr, cy - rr, cx + rr, cy + rr, p.kod]; };
    const korok = pontok.map(kor);
    const nb = (xx, yy, w, anchor) => (anchor === 'end' ? [xx - w, yy - 13, xx, yy + 4] : [xx, yy - 13, xx + w, yy + 4]);
    const foglalt = [nb(W - jobb - 8, fent + 18, 175, 'end'), nb(bal + 8, fent + 18, 175, 'start'), nb(W - jobb - 8, H - lent - 10, 130, 'end'), nb(bal + 8, H - lent - 10, 190, 'start')], ki = [], feliratok = [];
    const korFigyel = cimkek === 'mind';
    const utkozik = (b) => foglalt.some((f) => b[0] < f[2] && b[2] > f[0] && b[1] < f[3] && b[3] > f[1]);
    for (const p of [...pontok].sort((p1, q) => q.db - p1.db)) {
      const cx = x(p.ar), cy = y(p.valt1), rr = r(p.db);
      let felirat = '';
      if (cimkezett.has(p.kod)) {
        const t = rovid(p.n), w = t.length * 7.6 + 4;
        for (const [bx, dy, anchor] of [[cx + rr + 3, 0, 'start'], [cx - rr - 3 - w, 0, 'end'], [cx - w / 2, -rr - 9, 'start'], [cx - w / 2, rr + 13, 'start']]) {
          const doboz = [bx, cy + dy - 9, bx + w, cy + dy + 7];
          if (bx >= bal && bx + w <= W - jobb && !utkozik(doboz) && !(korFigyel && korok.some((c) => c[4] !== p.kod && doboz[0] < c[2] && doboz[2] > c[0] && doboz[1] < c[3] && doboz[3] > c[1]))) { foglalt.push(doboz); felirat = `<text x="${(anchor === 'start' ? bx : bx + w).toFixed(1)}" y="${(cy + dy + 4).toFixed(1)}" text-anchor="${anchor}">${esc(t)}</text>`; break; }
        }
      }
      ki.push(`<g class="kv-pont"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr.toFixed(1)}"><title>${esc(p.n)}: ${M.fmt(p.ar * 1000)} Ft/m², egy év alatt ${szaz(p.valt1)}, ${M.fmt(p.db)} adásvétel${p.becsles ? `; becsült mai ár ${M.fmt(p.becsles * 1000)} Ft/m²` : ''}</title></circle></g>`);
      if (felirat) feliratok.push(felirat);
    }
    return ki.join('') + `<g class="kv-feliratok">${feliratok.join('')}</g>`;
  })()}
</svg>
<p class="kicsi halk">A vonalak a ${pontok.length} pont mediánja szerint osztják négy részre a piacot: ${M.fmt(Math.round(mx) * 1000)} Ft/m² és ${szaz(my)}. A kör mérete az adásvételek számával arányos.</p>
</figure>`;
}

function savDiagram(sorok, { cim, ertek, felirat, id, max }) {
  const W = 760, sorH = 26, bal = 210, H = sorok.length * sorH + 10;
  const m = max ?? Math.max(...sorok.map(ertek));
  return `<figure class="savok" data-abra="${id}"><figcaption><b>${esc(cim)}</b></figcaption><svg class="sv-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cim)}" xmlns="http://www.w3.org/2000/svg">${sorok.map((s, i) => `<g><text class="sv-nev" x="${bal - 10}" y="${i * sorH + 17}" text-anchor="end">${esc(s.n.replace(/^Budapest /, ''))}</text><rect x="${bal}" y="${i * sorH + 4}" width="${((ertek(s) / m) * (W - bal - 170)).toFixed(1)}" height="${sorH - 8}" rx="4"/><text class="sv-ertek" x="${(bal + (ertek(s) / m) * (W - bal - 170) + 8).toFixed(1)}" y="${i * sorH + 17}">${felirat(s)}</text></g>`).join('')}</svg></figure>`;
}

export function jelentesOldal(k, lista) {
  const { adat } = k;
  const a = adat.arak, ev = a.evek.at(-1), ev0 = a.evek[0];
  const sorok = jelentesSorok(adat);
  const eleg = sorok.filter((x) => x.db >= JELENTES_MIN_DB && x.valt1 != null);
  const ker = sorok.filter((x) => x.t === 5 && x.valt1 != null);
  const varos = eleg.filter((x) => x.m !== '01' && x.db >= 100);
  const bp = a.megyek['01'], n = a.evek.length - 1;
  const bpValt = valt(bp.s.o, n, n - 1);
  const orsz = (() => { let ar = 0, db = 0, arE = 0, dbE = 0; for (const m of Object.values(a.megyek)) { const v = m.s.o?.[n], d = m.s.od?.[n] || 0, vE = m.s.o?.[n - 1], dE = m.s.od?.[n - 1] || 0; if (v != null) { ar += v * d; db += d; } if (vE != null) { arE += vE * dE; dbE += dE; } } return { ar: ar / db, db, valt: (ar / db) / (arE / dbE) * 100 - 100 }; })();
  const fel = [...eleg].sort((x, y) => y.valt1 - x.valt1), le = [...eleg].sort((x, y) => x.valt1 - y.valt1);
  const mfEleg = eleg.filter((x) => x.evek != null).sort((x, y) => y.evek - x.evek);
  const kerMf = ker.filter((x) => x.evek != null).sort((x, y) => y.evek - x.evek);
  const link = (x) => (lista.egysegek.has(x.kod) ? `<a href="LINK:${lista.egysegek.get(x.kod)}">${esc(x.n.replace(/^Budapest /, ''))}</a>` : esc(x.n));
  const ut = JELENTES_UT;
  const cim = `Éves lakásár-jelentés: a ${ev}-es év valódi eladásai`;
  const tiz = (v) => v.toFixed(1).replace('.', ',');
  const evFelirat = (s) => `${tiz(s.evek)} év${s.evekMa ? `, ma kb. ${tiz(s.evekMa)}` : ''}`;
  // A mai szint becslése: Budapest és az ország (a vármegyék becsült árának adásvétellel súlyozott átlaga)
  const megyeBecs = Object.entries(a.megyek).map(([m, mu]) => ({ m, db: mu.s.od?.[n] || 0, be: S.arBecsles(adat, { ...mu, m }) })).filter((x) => x.be);
  const maCimke = megyeBecs[0]?.be.cimke;
  const bpMa = megyeBecs.find((x) => x.m === '01')?.be.ar;
  const orszMa = megyeBecs.reduce((t, x) => t + x.be.ar * x.db, 0) / (megyeBecs.reduce((t, x) => t + x.db, 0) || 1);
  const csokkent = fel.filter((x) => x.valt1 < 0);
  const oszlopok = [['Ft/m², ' + ev, (x) => M.fmt(x.ar * 1000)], ['Egy év alatt', (x) => szaz(x.valt1)], ['Adásvétel', (x) => M.fmt(x.db)], ['Becsült mai ár', (x) => (x.becsles ? `${M.fmt(x.becsles * 1000)} Ft/m²` : '–')]];
  const leiras = `Éves jelentés a ${ev}. évi valódi lakáseladásokból (KSH Ingatlanadattár): hol drágult és hol olcsóbbodott a lakás, kvadráns a kerületekről és városokról, és hány évnyi fizetés egy ${S.MEGFIZ_M2} m²-es lakás.`;
  const csvNev = `lakasarak-${ev}.csv`;
  const allitasok = [
    `Az országban átlagosan ${ft(Math.round(orsz.ar))} volt egy lakás négyzetmétere, ${szaz(orsz.valt).replace('+', '')}-kal ${orsz.valt >= 0 ? 'több' : 'kevesebb'}, mint egy évvel korábban (${M.fmt(orsz.db)} adásvétel, a vármegyék súlyozott átlaga).`,
    `Budapesten ${ft(bp.s.o[n])} volt egy négyzetméter, ${szaz(bpValt)} egy év alatt. A legdrágább kerület ${az(ker.sort((x, y) => y.ar - x.ar)[0].n.replace(/^Budapest /, ''))} (${ft(ker[0].ar)}), a legolcsóbb ${az(ker.at(-1).n.replace(/^Budapest /, ''))} (${ft(ker.at(-1).ar)}).`,
    `Azok közül, ahol legalább ${JELENTES_MIN_DB} adásvétel volt, ${fel[0].n} drágult a legjobban (${szaz(fel[0].valt1)}), ${le[0].valt1 < 0 ? `${le[0].n} olcsóbbodott a legtöbbet (${szaz(le[0].valt1)})` : `${le[0].n} drágult a legkevésbé (${szaz(le[0].valt1)})`}.`,
    mfEleg.length ? `A legkevésbé megfizethető település ${mfEleg[0].n}: ott egy ${S.MEGFIZ_M2} m²-es lakás ára ${M.tized(mfEleg[0].evek, 1)} évnyi helyi nettó átlagkereset. Budapesten ez kerülettől függően ${M.tized(kerMf.at(-1).evek, 1)} és ${M.tized(kerMf[0].evek, 1)} év között van, a legjobban megfizethető település ${mfEleg.at(-1).n} (${M.tized(mfEleg.at(-1).evek, 1)} év).` : '',
    `${ev0} óta a budapesti átlagár ${szaz(valt(bp.s.o, n, 0)).replace('+', '')}-kal nőtt.`,
    maCimke ? `Mára (${maCimke}, becslés) az országos átlag kb. ${ft(Math.round(orszMa / 10) * 10)}, a budapesti kb. ${ft(Math.round(bpMa / 10) * 10)} négyzetméterenként.` : '',
  ].filter(Boolean);
  const tabla = (t, oszl) => `<div class="tabla-tarto"><table class="tabla kicsi-tabla"><thead><tr><th scope="col">Hol?</th>${oszl.map(([c]) => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${t.map((x) => `<tr><th scope="row">${link(x)}</th>${oszl.map(([, f]) => `<td>${f(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const tartalom = (L) => {
    const html = `
${oldalfej(L, { morzsa: [['Lakásárak', ARAK_UT], `Éves jelentés (${ev})`], cim, valasz: allitasok[0] + ' ' + allitasok[1], friss: M.datumNapon(a.ellenorizve || k.ma) })}
<div class="keret"><article class="cikk jelentes">
<h2>A legfontosabb számok</h2>
<ul class="allitasok">${allitasok.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<p class="becsles-sor">A KSH a valódi eladási árakat körülbelül egy év késéssel közli, ezért ${ev} a legutóbbi teljes év. A ${ev + 1}-es adatok várhatóan ${ev + 2} végén jelennek meg, és akkor ez a jelentés magától átáll rájuk. A mai árakat (${esc(sorok.find((x) => x.becslesCimke)?.becslesCimke || '')}) becsléssel a táblázatokban, <a href="${L.l(ARAK_UT)}">a térképen</a> és <a href="${L.l(ERTEK_UT)}">a lakásérték-becslőben</a> találod.</p>
<h2>A piac négy negyede: Budapest kerületei</h2>
${kvadrans(ker, { cim: `Budapest kerületei, ${ev}: árszint és drágulás`, cimkek: 'mind', id: 'kvadrans-kerulet' })}
<h2>A piac négy negyede: a városok</h2>
${kvadrans(varos, { cim: `Városok legalább 100 adásvétellel, ${ev}: árszint és drágulás`, cimkek: 'valogatott', id: 'kvadrans-varos' })}
<h2>Hány évnyi fizetésbe kerül egy lakás?</h2>
<p>Egy ${S.MEGFIZ_M2} m²-es lakás ára, osztva a helyben lakók nettó átlagkeresetével (KSH, lakóhely szerint, ${ev}). A „ma kb.” érték a becsült mai árral és a legfrissebb, ${adat.kereset?.evek.at(-1)}-es (előzetes) keresettel számol. Budapest kerületeinél a budapesti átlagkeresettel számolunk. <a href="${L.l(ARAK_UT)}?mutato=evek">Térképen az egész ország</a>, az országos idősor 2000 óta pedig <a href="${L.l(ARJOV_UT)}">a lakásár és jövedelem oldalon</a>.</p>
${savDiagram(kerMf, { cim: `Budapest kerületei: hány év fizetés egy ${S.MEGFIZ_M2} m²-es lakás, ${ev}`, ertek: (s) => s.evek, felirat: evFelirat, id: 'megfiz-kerulet' })}
${savDiagram(mfEleg.slice(0, 15), { cim: `A legkevésbé megfizethető települések, ${ev}`, ertek: (s) => s.evek, felirat: evFelirat, id: 'megfiz-felso', max: mfEleg[0]?.evek })}
${savDiagram(mfEleg.slice(-15).reverse(), { cim: `A legjobban megfizethető települések, ${ev}`, ertek: (s) => s.evek, felirat: evFelirat, id: 'megfiz-also', max: mfEleg[0]?.evek })}
<h2>Hol drágult a legjobban ${M.evBan(ev)}?</h2>
${tabla(fel.slice(0, 20), oszlopok)}
<h2>Hol drágult a legkevésbé?</h2>
<p>${csokkent.length === 0 ? 'Egyetlen településen és kerületen sem csökkentek az árak.' : csokkent.length === 1 ? `Csökkenés csak egy helyen volt: ${esc(csokkent[0].n)} (${szaz(csokkent[0].valt1)}).` : `${csokkent.length} helyen csökkentek az árak, a táblázat többi helyén nőttek, csak lassabban.`}</p>
${tabla(le.slice(0, 20), oszlopok)}
<p class="kicsi halk">Csak ahol ${M.evBan(ev)} legalább ${JELENTES_MIN_DB} adásvétel volt. Kevés eladásnál az átlag évről évre nagyobbat ugrik, ezért nézd meg az adásvételek számát is.</p>
<h2>Letöltés és idézés</h2>
<p>Az összes település és kerület mutatói egy fájlban: <a href="${L.gyoker(`${ARAK_ADAT_JEL}${csvNev}`)}" download>${csvNev}</a> (pontosvesszővel tagolt, Excelben megnyitható). Az ábrák alatt a <em>Letöltés képként</em> gombbal PNG-t kapsz.</p>
<p class="idezes">Forrás: Ingatlanmérleg (ingatlanmerleg.hu), a KSH Ingatlanadattára és kereseti adatai alapján, ${ev}.</p>
${forrasBlokk(adat, null)}
${tovabb(L, ARAK_UT)}
</article></div>
<script>(function(){document.querySelectorAll('[data-abra]').forEach(function(f){var s=f.querySelector('svg');if(!s)return;var b=document.createElement('button');b.type='button';b.className='abra-letolt';b.textContent='Letöltés képként';b.addEventListener('click',function(){var c=s.cloneNode(true),cs=getComputedStyle(document.documentElement);var st=document.createElement('style');st.textContent=Array.prototype.map.call(document.styleSheets,function(x){try{return Array.prototype.map.call(x.cssRules,function(r){return /^\\.(kv-|sv-)/.test(r.selectorText||'')?r.cssText:''}).join('')}catch(e){return''}}).join('').replace(/var\\(--([\\w-]+)\\)/g,function(m,v){return cs.getPropertyValue('--'+v).trim()||'#000'});c.insertBefore(st,c.firstChild);var vb=s.viewBox.baseVal,w=vb.width*2,h=vb.height*2+60;c.setAttribute('width',vb.width);c.setAttribute('height',vb.height);var u='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(c));var im=new Image();im.onload=function(){var cv=document.createElement('canvas');cv.width=w;cv.height=h;var x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#14161B';x.font='600 26px sans-serif';x.fillText(f.querySelector('figcaption').textContent,20,36);x.drawImage(im,0,50,w,h-60);x.font='16px sans-serif';x.fillStyle='#5A606C';x.fillText('Forrás: ingatlanmerleg.hu, KSH-adatok alapján',20,h-8);var a=document.createElement('a');a.download=(f.dataset.abra||'abra')+'.png';a.href=cv.toDataURL('image/png');a.click();};im.src=u;});f.appendChild(b);});})();</script>`;
    return html.replace(/href="LINK:([^"]+)"/g, (m0, u) => `href="${L.l(u)}"`);
  };
  return oldal(k, { cim: `Éves lakásár-jelentés (${ev}): drágulás, megfizethetőség, kvadráns, valódi eladásokból`, leiras, ut, tartalom, jsonld: [morzsaLd(k.cfg, [{ nev: 'Lakásárak', ut: ARAK_UT }, { nev: `Éves jelentés (${ev})`, ut }]), { '@context': 'https://schema.org', '@type': 'Article', headline: cim, description: leiras, inLanguage: 'hu', url: `${k.cfg.domain}/${ut}`, dateModified: a.ellenorizve || k.ma, author: { '@type': 'Organization', name: k.cfg.marka, url: `${k.cfg.domain}/` }, isBasedOn: a.forras.url }, { '@context': 'https://schema.org', '@type': 'Dataset', name: `Lakásárak és megfizethetőség településenként, ${ev}`, description: leiras, url: `${k.cfg.domain}/${ut}`, inLanguage: 'hu', isAccessibleForFree: true, isBasedOn: [a.forras.url, adat.kereset?.forras.url].filter(Boolean), distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${k.cfg.domain}/${ARAK_ADAT_JEL}${csvNev}` }] }] });
}
export const ARAK_ADAT_JEL = 'adatok/lakasarak/';

/* ======================= MENNYIT ÉR A LAKÁSOM? ======================= */
export const ERTEK_UT = 'mennyit-er-a-lakasom/';
export function ertekOldal(k) {
  const { adat } = k;
  const a = adat.arak, ev = a.evek.at(-1);
  const sz = adat.arSzoras || { telep: {}, utca: null };
  const ut = ERTEK_UT;
  const negyed = (s) => Math.round((Math.exp(0.6745 * s) - 1) * 100);
  const cim = 'Mennyit ér a lakásom?';
  const leiras = `Becsült mai érték sávval, a környéken valóban eladott lakások áraiból (KSH Ingatlanadattár, NAV-illetékadatok): utcánként, ha ott elég adásvétel volt, különben a település vagy kerület átlagából, ${a.evek.length} év adatából.`;
  const cimke = Object.values(a.egysegek).map((u) => S.arBecsles(adat, u)).find(Boolean)?.cimke || String(ev);
  const kerdesek = [
    { k: 'Mennyire pontos a becslés?', v: [`Annyira, amennyire a környék valódi eladásai engedik. Egy utcán belül is nagy a különbség a lakások között: a négyzetméterárak fele nagyjából ±${negyed(sz.utca?.szigma ?? 0.28)}%-on belül van az utca átlagától, a település egészében ±${negyed(sz.telep?.t?.szigma ?? 0.42)}%-on belül. Ezért mutatunk sávot egyetlen szám helyett. Hogy a sávon belül hol van a lakásod, azt az állapota, az emelet, a kilátás, a fűtés és az alaprajz dönti el, amit a KSH-adat nem ismer.`] },
    { k: 'Miért nem egyezik a hirdetési árakkal?', v: ['A hirdetésben a kért ár szerepel, ez itt az eladási ár, amit a vevő végül kifizetett és illetéket fizetett utána. Alku után a lakások jellemzően a hirdetési ár alatt kelnek el.'] },
    { k: `Hogyan lesz ${ev}-es adatból mai ár?`, v: [`A legutóbbi három év eladásait a település árindexével ${ev}-re hozzuk, majd a KSH lakásárindexeivel a legfrissebb negyedévre: ${esc(cimke)}. A lépések a <a href="../${ARAK_UT}">település oldalán</a> részletesen is látszanak.`] },
    { k: 'Mire használhatom?', v: [`Tájékozódásra: eladás előtt, vételi ajánlathoz, öröklésnél vagy válásnál első közelítésnek. Hitelhez és hivatalos ügyekhez értékbecslő kell, és az illeték alapjául a NAV is a környékbeli eladásokkal veti össze a vételárat. Ezt <a href="../${ILLETEK_UT}">az illetékkalkulátor</a> is megmutatja.`] },
  ];
  const kezdo = `<p class="elsz-ures">Add meg a települést vagy kerületet és az alapterületet. Ha tudod az utcát is, pontosabb lesz.</p>`;
  const urlap = `
<fieldset>
${sor('', `<label for="e-telep">Település vagy budapesti kerület</label><div class="beir szeles"><input id="e-telep" name="telep" type="text" list="e-telep-lista" autocomplete="off" placeholder="pl. Debrecen vagy XI. kerület"><datalist id="e-telep-lista"></datalist></div>`)}
${sor('', `<label for="e-utca">Utca <span class="halk">(nem kötelező)</span></label><div class="beir szeles"><input id="e-utca" name="utca" type="text" list="e-utca-lista" autocomplete="off" placeholder="előbb a települést add meg" disabled><datalist id="e-utca-lista"></datalist></div><span class="sugo" data-utca-sugo>Csak azok az utcák szerepelnek, ahol a KSH közölt árat.</span>`)}
${sor('', `<label for="e-tipus">Milyen ingatlan?</label><div class="beir szeles"><select id="e-tipus" name="tipus"><option value="t">Társasházi lakás</option><option value="p">Panellakás</option><option value="h">Családi ház</option><option value="o">Nem tudom, vagy más</option></select></div>`)}
${sor('', szamMezo({ id: 'e-m2', nev: 'm2', cim: 'Alapterület', me: 'm²', placeholder: 'pl. 60', min: 10, max: 1000 }))}
</fieldset>`;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: [['Lakásárak', ARAK_UT], 'Mennyit ér a lakásom?'], cim, valasz: `Add meg, hol van és mekkora, és a környéken valóban eladott lakások árából kiszámoljuk, mennyit érhet ma (${esc(cimke)}). Egy szám helyett sávot kapsz, mert egy utcán belül is nagyok a különbségek.`, friss: M.datumNapon(a.ellenorizve || k.ma) })}
<div class="keret ertek" data-ertek data-adat-v="${k.adatV || ''}" data-alap="${L.gyoker(ARAK_ADAT_JEL)}" data-telep-ut="${L.l(ARAK_UT)}"><div class="asztal">
${forgalmi({ cim: 'A lakás', al: `KSH Ingatlanadattár, ${a.evek[0]}–${ev}`, tartalom: urlap, osztaly: 'ertek-urlap' })}
${elszamolas(k, kezdo, { gombok: false, labjegy: 'Tájékoztató becslés, nem értékbecslés.' })}
</div></div>
<div class="keret"><article class="cikk">
<h2>Hogyan számolunk?</h2>
<ol>
<li><strong>Utca.</strong> Ha az utcában az elmúlt három évben volt adásvétel, ezek átlagából indulunk. Kevés eladásnál az utca átlaga erősen ugrál, ezért ilyenkor a település átlagát is beleszámítjuk, annál nagyobb súllyal, minél kevesebb az eladás.</li>
<li><strong>Település vagy kerület.</strong> Ha nincs utcai adat, a település választott típusú ingatlanjainak (társasházi, panel, családi ház) átlagát használjuk az utolsó három évből.</li>
<li><strong>Mai ár.</strong> A régebbi évek árait a település árindexével ${ev}-re hozzuk, majd a KSH használtlakás-árindexeivel a legfrissebb negyedévre (${esc(cimke)}).</li>
<li><strong>Sáv.</strong> A KSH csak átlagot közöl, de abból, hogy a kevés eladásból számolt átlagok mennyire ugrálnak évről évre, kiszámolható, mennyire szórnak az egyes lakások árai. ${sz.utca ? `${M.fmt(sz.utca.minta)} utcai évpár alapján egy utcán belül a lakások fele ±${negyed(sz.utca.szigma)}%-on belül van.` : ''} Ebből adjuk meg, hogy a hasonló lakások fele és tízből nyolc milyen áron kelt el.</li>
</ol>
<p>A becslés magától frissül: amikor a KSH új évet vagy új negyedéves árindexet ad ki, a számok átállnak.</p>
<h2>Gyakori kérdések</h2>
${gyik(kerdesek)}
${forrasBlokk(adat, null)}
${tovabb(L, ut)}
</article></div>
<script type="module" src="${L.a(`js/ertek.js?v=${k.verzio}`)}"></script>`;
  return oldal(k, { cim: 'Mennyit ér a lakásom? Becslés utcánként, valódi eladási árakból', leiras, ut, tartalom, jsonld: [morzsaLd(k.cfg, [{ nev: 'Lakásárak', ut: ARAK_UT }, { nev: 'Mennyit ér a lakásom?', ut }]), gyikLd(kerdesek), { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Mennyit ér a lakásom?', url: `${k.cfg.domain}/${ut}`, applicationCategory: 'FinanceApplication', operatingSystem: 'Web', inLanguage: 'hu', isAccessibleForFree: true, offers: { '@type': 'Offer', price: 0, priceCurrency: 'HUF' }, isBasedOn: a.forras.url }] });
}

/* ======================= METRÓ- ÉS HÉV-TÉRKÉP ======================= */
// A megállók 500 méteres körzetében lévő utcák valódi eladási árai (KSH utcai adat), a megállók az OSM-ből (data/metro.json).
export const METRO_UT = `${ARAK_UT}metro/`;
const METRO_MIN_DB = 15;
// Budapesten az országos skála szinte minden megállót a két legsötétebb színbe tenne, ezért itt saját határok kellenek
const METRO_HATAR = [650, 750, 850, 950, 1050, 1150, 1250, 1350, 1450];
const metroSkala = () => `<div class="mini-skala" aria-hidden="true"><span>${M.fmt(METRO_HATAR[0])} ezer Ft/m² alatt</span><i>${M.AR_SZINEK.map((c) => `<b style="background:${c}"></b>`).join('')}</i><span>${M.tized(METRO_HATAR.at(-1) / 1000, 2)} millió felett</span></div>`;

export function metroAdat(adat) {
  const f = join(GYOKER, 'data/metro.json');
  if (!existsSync(f)) return null;
  const mj = JSON.parse(readFileSync(f, 'utf8'));
  const a = adat.arak, n = a.evek.length - 1;
  const kerKod = {};
  for (const [kod, u] of Object.entries(a.egysegek)) { const m = u.n.match(/^Budapest ([IVXL]+)\. kerület$/); if (m) kerKod[m[1]] = kod; }
  const ut = utcak('01');
  const utcaAr = new Map();
  const ar = (ker, nev) => {
    const kod = kerKod[ker]; if (!kod) return null;
    const kulcs = `${kod}|${nev}`;
    if (!utcaAr.has(kulcs)) { const sor = (ut[kod] || []).find((x) => x[0] === nev); utcaAr.set(kulcs, sor ? S.frissAtlag(sor[1], sor[2], a.egysegek[kod].s.o) : null); }
    return utcaAr.get(kulcs);
  };
  const vonalak = mj.vonalak.map((v) => {
    const allomasok = v.allomasok.map((al, i) => {
      const sorok = mj.utcak.filter((x) => x[0] === v.ref && x[1] === i).map(([, , ker, nev, tav]) => ({ ker, nev, tav, ...(ar(ker, nev) || {}) })).filter((x) => x.ar);
      const db = sorok.reduce((s, x) => s + x.db, 0);
      const kerek = [...new Set(mj.utcak.filter((x) => x[0] === v.ref && x[1] === i).map((x) => x[2]))];
      const atlag = db ? sorok.reduce((s, x) => s + x.ar * x.db, 0) / db : null;
      // A kerület(ek) átlagához képest: mennyivel drágább a megálló környéke
      const kerAtl = kerek.length ? kerek.map((k2) => a.egysegek[kerKod[k2]]?.s.o[n]).filter(Boolean) : [];
      const ker = kerAtl.length ? kerAtl.reduce((s, x) => s + x, 0) / kerAtl.length : null;
      return { nev: al.nev, lat: al.lat, lon: al.lon, ar: db >= METRO_MIN_DB ? Math.round(atlag) : null, db, utcaDb: sorok.length, kerek, felar: db >= METRO_MIN_DB && ker ? (atlag / ker - 1) * 100 : null, utcak: sorok.sort((x, y) => y.db - x.db).slice(0, 8) };
    }).filter((al) => al.kerek.length); // csak a budapesti megállók
    return { ...v, allomasok };
  }).filter((v) => v.allomasok.length >= 3).sort((x, y) => (x.ref[0] === y.ref[0] ? x.ref.localeCompare(y.ref) : x.ref[0] === 'M' ? -1 : 1));
  return { forras: mj.forras, kelt: mj.kelt, sugar: mj.sugar, vonalak, ev: a.evek[n], evTol: a.evek[Math.max(0, n - 2)] };
}

function vonalAbra(v, i) {
  const lepes = 46, bal = 30, W = Math.max(520, bal + 150 + (v.allomasok.length - 1) * lepes), H = 185, y = 34;
  const szin = v.szin || '#14161B';
  const pontok = v.allomasok.map((al, j) => {
    const x = bal + j * lepes;
    const c = al.ar ? M.AR_SZINEK[M.arOsztaly(al.ar, METRO_HATAR)] : 'var(--hatter)';
    return `<g class="mt-allomas" style="--k:${j}"><circle cx="${x}" cy="${y}" r="11" fill="${c}"${al.ar ? '' : ' class="mt-nincs"'}><title>${esc(al.nev)}: ${al.ar ? `${M.fmt(al.ar * 1000)} Ft/m² (${M.fmt(al.db)} eladás)${al.felar != null ? `, ${szaz(al.felar)} a kerülethez képest` : ''}` : 'kevés eladás a környéken'}</title></circle><text x="${x}" y="${y + 24}" transform="rotate(40 ${x} ${y + 24})">${esc(al.nev)}</text></g>`;
  }).join('');
  return `<figure class="mt-vonal" data-mt="${i}"><figcaption><span class="mt-jel" style="background:${szin}">${esc(v.ref)}</span> ${esc(v.nev.replace(/^.*?:\s*/, ''))}</figcaption>
<div class="mt-gorgo"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(v.ref)} vonal megállói ár szerint színezve" xmlns="http://www.w3.org/2000/svg"><line class="mt-sin" x1="${bal}" x2="${bal + (v.allomasok.length - 1) * lepes}" y1="${y}" y2="${y}" stroke="${szin}"/>${pontok}</svg></div></figure>`;
}

export function metroOldal(k) {
  const { adat } = k;
  const md = metroAdat(adat);
  const ut = METRO_UT;
  const minden = md.vonalak.flatMap((v) => v.allomasok.filter((al) => al.ar).map((al) => ({ ...al, vonal: v.ref })));
  // Átszálló megállók: név szerint egyszer
  const egyedi = [...new Map(minden.map((x) => [x.nev, x])).values()].sort((x, y) => y.ar - x.ar);
  const legdragabb = egyedi[0], legolcsobb = egyedi.at(-1);
  const felar = [...egyedi].filter((x) => x.felar != null).sort((x, y) => y.felar - x.felar);
  const cim = 'Lakásárak a metró és a HÉV mentén';
  const leiras = `Mennyibe kerül egy négyzetméter a budapesti metró- és HÉV-megállók ${md.sugar} méteres körzetében? Valódi eladási árak (KSH Ingatlanadattár, ${md.evTol}–${md.ev}) megállónként, vonalanként, a kerületi átlaggal összevetve.`;
  const tabla = (t) => `<div class="tabla-tarto"><table class="tabla kicsi-tabla"><thead><tr><th scope="col">Megálló</th><th scope="col">Vonal</th><th scope="col">Ft/m²</th><th scope="col">A kerülethez képest</th><th scope="col">Eladás</th></tr></thead><tbody>${t.map((x) => `<tr><th scope="row">${esc(x.nev)}</th><td>${esc(x.vonal)}</td><td>${M.fmt(x.ar * 1000)}</td><td>${x.felar == null ? '–' : szaz(x.felar)}</td><td>${M.fmt(x.db)}</td></tr>`).join('')}</tbody></table></div>`;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: [['Lakásárak', ARAK_UT], 'Metró és HÉV'], cim, valasz: `A metró- és HÉV-megállók ${md.sugar} méteres körzetében ${esc(legdragabb.nev)} környéke a legdrágább (${ft(legdragabb.ar)}/m²), ${esc(legolcsobb.nev)} környéke a legolcsóbb (${ft(legolcsobb.ar)}/m²). Valódi eladási árak ${md.evTol}–${md.ev} között, ${md.ev}-es árszinten.`, friss: M.datumNapon(adat.arak.ellenorizve || k.ma) })}
<div class="keret"><article class="cikk metro">
<p>Minden kör egy megálló, a színe az ${md.sugar} méteren belüli utcák átlagos négyzetméterára. Vidd fölé az egeret, vagy koppints rá. Üres a kör, ahol a környéken ${METRO_MIN_DB}-nél kevesebb lakást adtak el.</p>
${metroSkala()}
${md.vonalak.map((v, i) => vonalAbra(v, i)).join('\n')}
<h2>A legdrágább megállók környéke</h2>
${tabla(egyedi.slice(0, 12))}
<h2>A legolcsóbb megállók környéke</h2>
${tabla(egyedi.slice(-12).reverse())}
<h2>Ahol a megálló a legtöbbet számít</h2>
<p>A megálló környékének átlaga a kerület átlagához képest. Pozitív, ha a megálló közelében drágábban kelnek el a lakások, mint a kerületben általában.</p>
${tabla(felar.slice(0, 12))}
<h2>Hogyan számolunk?</h2>
<p>A megállók helyét és az ${md.sugar} méteren belüli utcákat az OpenStreetMapből vesszük (havonta frissül). Minden utcához a KSH Ingatlanadattár utcai átlagárát rendeljük, az utolsó három év eladásaiból, a kerület árindexével ${md.ev}-re hozva, és a megálló átlaga az utcák eladásszámmal súlyozott átlaga. A hosszú utcáknak (például az Andrássy útnak vagy a Bartók Béla útnak) a teljes utcára számolt átlaga szerepel, akkor is, ha csak egy szakaszuk van a megálló közelében.</p>
<p class="kicsi halk">Megállók és utcák: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-közreműködők (ODbL), letöltve ${datumHu(md.kelt)}.</p>
${forrasBlokk(adat, null)}
${tovabb(L, ut)}
</article></div>`;
  return oldal(k, { cim: `Lakásárak a metró és a HÉV mentén: megállónként, valódi eladásokból, ${md.ev}`, leiras, ut, tartalom, jsonld: [morzsaLd(k.cfg, [{ nev: 'Lakásárak', ut: ARAK_UT }, { nev: 'Metró és HÉV', ut }]), { '@context': 'https://schema.org', '@type': 'Dataset', name: `Lakásárak a budapesti metró- és HÉV-megállók környékén, ${md.ev}`, description: leiras, url: `${k.cfg.domain}/${ut}`, inLanguage: 'hu', isAccessibleForFree: true, isBasedOn: [adat.arak.forras.url, 'https://www.openstreetmap.org/'] }] });
}

/* ======================= LAKÁSÁR ÉS JÖVEDELEM ======================= */
// Országosan: Eurostat tipsho60 (2000-től, évente). Helyben: hány év nettó kereset egy 50 m²-es lakás, vármegyénként.
export const ARJOV_UT = `${ARAK_UT}ar-jovedelem/`;
const tiz1 = (v) => (v == null ? '–' : v.toFixed(1).replace('.', ','));
const elojel = (v) => (v == null ? '–' : `${v >= 0 ? '+' : '−'}${tiz1(Math.abs(v))}%`);

/** Vármegyék és Budapest: évenként hány év nettó átlagkereset egy MEGFIZ_M2-es lakás (ár és kereset ugyanarra az évre), plusz mára. */
export function megyeMegfiz(adat) {
  const a = adat.arak, ke = adat.kereset;
  if (!ke) return null;
  const evek = a.evek.filter((e) => ke.evek.includes(e));
  const sorok = Object.entries(a.megyek).map(([m, mu]) => {
    const nev = mu.n.replace(/ vármegye$/, '');
    const k = ke.megye[nev];
    const ertek = evek.map((e) => { const ar = mu.s.o?.[a.evek.indexOf(e)]; const kk = k?.[ke.evek.indexOf(e)]; return ar && kk ? (ar * 1000 * S.MEGFIZ_M2) / (kk * 12) : null; });
    const be = S.arBecsles(adat, { ...mu, m });
    const kMa = k?.at(-1);
    return { m, nev, ertek, ma: be && kMa ? (be.ar * 1000 * S.MEGFIZ_M2) / (kMa * 12) : null, maCimke: be?.cimke };
  }).filter((x) => x.ertek.some((v) => v != null)).sort((x, y) => (y.ertek.at(-1) ?? 0) - (x.ertek.at(-1) ?? 0));
  return { evek, sorok, keresetEv: ke.evek.at(-1), keresetNev: ke.megnevezes };
}

function arJovAbra(aj) {
  const W = 760, H = 360, bal = 46, jobb = 70, fent = 24, lent = 38;
  const v = aj.lt, ev = aj.evek, n = ev.length;
  const min = Math.floor(Math.min(...v.filter((x) => x != null)) / 10) * 10 - 5, max = Math.ceil(Math.max(...v.filter((x) => x != null)) / 10) * 10 + 5;
  const x = (i) => bal + (i / (n - 1)) * (W - bal - jobb), y = (val) => fent + ((max - val) / (max - min)) * (H - fent - lent);
  const pontok = v.map((val, i) => (val == null ? null : [x(i), y(val)]));
  const ut = pontok.filter(Boolean).map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const iMax = v.indexOf(Math.max(...v)), iMin = v.indexOf(Math.min(...v.filter((q) => q != null))), iUt = n - 1;
  const racs = []; for (let t = Math.ceil(min / 10) * 10; t <= max; t += 10) racs.push(t);
  const cimke = (i, szoveg, lent2) => `<g class="aj-cimke"><circle cx="${pontok[i][0].toFixed(1)}" cy="${pontok[i][1].toFixed(1)}" r="5"/><text x="${pontok[i][0].toFixed(1)}" y="${(pontok[i][1] + (lent2 ? 22 : -12)).toFixed(1)}" text-anchor="${i === iUt ? 'end' : 'middle'}">${esc(szoveg)}</text></g>`;
  const elo = aj.becsult?.[ev[iUt]] === 'p';
  return `<figure class="aj-abra" data-abra="ar-jovedelem"><figcaption><b>Lakásár a háztartási jövedelemhez képest, Magyarország, ${ev[0]}–${ev.at(-1)}</b><span class="halk"> (100 = a ${ev[0]} óta mért átlag)</span></figcaption>
<svg class="aj-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Vonaldiagram: a lakásárak és a jövedelmek aránya ${ev[0]} és ${ev.at(-1)} között" xmlns="http://www.w3.org/2000/svg">
<rect class="aj-felso" x="${bal}" y="${fent}" width="${W - bal - jobb}" height="${(y(100) - fent).toFixed(1)}"/>
${racs.map((t) => `<line class="aj-racs${t === 100 ? ' aj-atlag' : ''}" x1="${bal}" x2="${W - jobb}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/><text class="aj-tengely" x="${bal - 8}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${t}</text>`).join('')}
<text class="aj-atlagnev" x="${W - jobb + 6}" y="${(y(100) + 4).toFixed(1)}">átlag</text>
<text class="aj-zona" x="${bal + 8}" y="${fent + 16}">nehezebben megfizethető</text>
<text class="aj-zona" x="${bal + 8}" y="${H - lent - 8}">könnyebben megfizethető</text>
${ev.map((e, i) => (e % 5 === 0 || i === n - 1 ? `<text class="aj-tengely" x="${x(i).toFixed(1)}" y="${H - lent + 20}" text-anchor="middle">${e}</text>` : '')).join('')}
<path class="aj-vonal" d="${ut}"/>
${cimke(iMax, `${ev[iMax]}: ${tiz1(v[iMax])}`)}${cimke(iMin, `${ev[iMin]}: ${tiz1(v[iMin])}`, true)}${cimke(iUt, `${ev[iUt]}: ${tiz1(v[iUt])}${elo ? ' (előzetes)' : ''}`)}
</svg></figure>`;
}

export function arJovOldal(k) {
  const { adat } = k;
  const aj = adat.arjov;
  const ut = ARJOV_UT;
  const ev = aj.evek, v = aj.lt, n = ev.length - 1, utEv = ev[n];
  const iEv = (e) => ev.indexOf(e);
  const valtEv = (e0) => (iEv(e0) >= 0 && v[iEv(e0)] ? (v[n] / v[iEv(e0)] - 1) * 100 : null);
  const iMax = v.indexOf(Math.max(...v)), iMin = v.indexOf(Math.min(...v.filter((q) => q != null)));
  const tiz = valtEv(utEv - 10), ot = valtEv(utEv - 5), egy = valtEv(utEv - 1);
  const elo = aj.becsult?.[utEv] === 'p';
  const atlTav = v[n] - 100;
  const allapot = Math.abs(atlTav) < 3 ? 'nagyjából a hosszú távú átlagán áll' : atlTav > 0 ? `${tiz1(atlTav)}%-kal a hosszú távú átlaga fölött van` : `${tiz1(-atlTav)}%-kal a hosszú távú átlaga alatt van`;
  const mm = megyeMegfiz(adat);
  const cim = 'Lakásár és jövedelem: mennyivel nehezebb ma lakást venni?';
  const valasz = `${M.evBan(utEv)} a lakásárak és a háztartási jövedelmek aránya ${allapot}${elo ? ' (előzetes adat)' : ''}. Tíz év alatt ${tiz1(Math.abs(tiz))}%-kal ${tiz >= 0 ? 'romlott' : 'javult'}, de ${M.evBan(ev[iMax])} még rosszabb volt a helyzet, mint ma.`;
  const leiras = `Hogyan változott a lakásárak és a jövedelmek aránya Magyarországon ${ev[0]} óta (Eurostat), és hány év nettó keresetbe kerül egy ${S.MEGFIZ_M2} m²-es lakás vármegyénként és Budapesten (KSH).`;
  const kerdesek = [
    { k: 'Mit mutat ez a szám?', v: [`Azt, hogy a lakásárak a háztartások egy főre jutó, rendelkezésre álló jövedelméhez képest drágábbak vagy olcsóbbak-e, mint általában. A 100 a ${ev[0]} óta mért átlag. 110 azt jelenti, hogy a lakás a jövedelemhez képest 10%-kal drágább, mint átlagosan. Nem azt mutatja, hány év fizetésébe kerül egy lakás, arra lent a vármegyei táblázat felel.`] },
    { k: 'Mennyit romlott a helyzet tíz év alatt?', v: [`A ${utEv - 10}-es évhez mérve ${elojel(tiz)} a változás. Ez igaz, de a kiinduló év erősen befolyásolja: ${ev[iMin]} körül volt a legjobb a helyzet az egész időszakban (${tiz1(v[iMin])}), így onnan nézve minden emelkedés nagynak látszik. A ${ev[0]} óta mért átlaghoz képest most ${allapot}.`] },
    { k: 'Miért javult 2023-ban?', v: ['Mert a magas infláció idején a bérek és a jövedelmek gyorsabban nőttek, mint a lakásárak. Így a lakás a jövedelemhez képest olcsóbb lett.'] },
    { k: 'Miért nem egyezik a vármegyei táblával?', v: [`Mert mást mér. Az Eurostat a háztartások egy főre jutó jövedelmével számol, a vármegyei tábla a teljes munkaidős alkalmazottak nettó átlagkeresetével (KSH), és egy konkrét, ${S.MEGFIZ_M2} m²-es lakás árával. Az irányuk általában ugyanaz.`] },
  ];
  const tabla = `<div class="tabla-tarto"><table class="tabla kicsi-tabla"><thead><tr><th scope="col">Év</th><th scope="col">Arány (átlag = 100)</th><th scope="col">Előző évhez</th></tr></thead><tbody>${ev.map((e, i) => [e, i]).reverse().map(([e, i]) => `<tr><th scope="row">${e}${aj.becsult?.[e] === 'p' ? ' <span class="halk">(előzetes)</span>' : aj.becsult?.[e] === 'e' ? ' <span class="halk">(becsült)</span>' : ''}</th><td>${tiz1(v[i])}</td><td>${i ? szaz((v[i] / v[i - 1] - 1) * 100) : '–'}</td></tr>`).join('')}</tbody></table></div>`;
  const megyeTabla = mm ? `<div class="tabla-tarto"><table class="tabla kicsi-tabla"><thead><tr><th scope="col">Hol?</th>${mm.evek.map((e) => `<th scope="col">${e}</th>`).join('')}<th scope="col">Ma kb.</th></tr></thead><tbody>${mm.sorok.map((s) => `<tr><th scope="row">${esc(s.nev)}</th>${s.ertek.map((q) => `<td>${tiz1(q)}</td>`).join('')}<td><b>${tiz1(s.ma)}</b></td></tr>`).join('')}</tbody></table></div>` : '';
  const bp = mm?.sorok.find((s) => s.m === '01');
  const tartalom = (L) => `
${oldalfej(L, { morzsa: [['Lakásárak', ARAK_UT], 'Lakásár és jövedelem'], cim, valasz, friss: M.datumNapon(aj.ellenorizve || k.ma) })}
<div class="keret"><article class="cikk ar-jov">
${arJovAbra(aj)}
<ul class="allitasok">
<li>${M.evBan(utEv)} a mutató ${tiz1(v[n])}, vagyis a lakásár a jövedelemhez képest ${allapot}.</li>
<li>Egy év alatt ${elojel(egy)}, öt év alatt ${elojel(ot)}, tíz év alatt ${elojel(tiz)} a változás.</li>
<li>A legrosszabb év ${ev[iMax]} volt (${tiz1(v[iMax])}), a legjobb ${ev[iMin]} (${tiz1(v[iMin])}).</li>
</ul>
<p class="kicsi halk">Forrás: Eurostat (tipsho60), frissítve ${datumHu(aj.frissitve || aj.forras.kelt)} A jövedelem a háztartások egy főre jutó, korrigált bruttó rendelkezésre álló jövedelme. Az Eurostat évente frissíti, és az oldal ilyenkor magától átáll.${elo ? ` A ${utEv}-es érték előzetes, később még módosulhat.` : ''}</p>
${mm ? `<h2>Helyben: hány év fizetés egy ${S.MEGFIZ_M2} m²-es lakás?</h2>
<p>Egy ${S.MEGFIZ_M2} m²-es lakás átlagos ára, osztva a helyben lakók éves nettó átlagkeresetével (KSH), ugyanarra az évre. A „ma kb.” oszlop a becsült mai árral (${esc(mm.sorok[0]?.maCimke || '')}) és a legfrissebb, ${mm.keresetEv}-es${/előzetes/i.test(mm.keresetNev || '') ? ' előzetes' : ''} keresettel számol.${bp ? ` Budapesten ${M.evBan(mm.evek[0])} ${tiz1(bp.ertek[0])} év volt, ${M.evBan(mm.evek.at(-1))} ${tiz1(bp.ertek.at(-1))}, ma kb. ${tiz1(bp.ma)}.` : ''} Településenként <a href="${L.l(ARAK_UT)}?mutato=evek">a térképen</a> nézheted meg.</p>
${megyeTabla}` : ''}
<h2>Az országos mutató évenként</h2>
${tabla}
<p>Letöltés: <a href="${L.gyoker(`${ARAK_ADAT_JEL}ar-jovedelem.csv`)}" download>ar-jovedelem.csv</a></p>
<h2>Gyakori kérdések</h2>
${gyik(kerdesek)}
<h2>Források</h2>
${forrasLista([{ nev: esc(aj.forras.nev), url: aj.forras.url, d: `frissítve: ${datumHu(aj.frissitve || aj.forras.kelt)}` }, { nev: esc(adat.arak.forras.nev), url: adat.arak.forras.url, d: 'a vármegyei árakhoz' }, ...(adat.kereset ? [{ nev: esc(adat.kereset.forras.nev), url: adat.kereset.forras.url, d: 'a keresetekhez' }] : [])])}
${tovabb(L, ut)}
</article></div>`;
  return oldal(k, { cim: `Lakásár és jövedelem aránya ${ev[0]}–${utEv}: mennyivel nehezebb ma lakást venni?`, leiras, ut, tartalom, jsonld: [morzsaLd(k.cfg, [{ nev: 'Lakásárak', ut: ARAK_UT }, { nev: 'Lakásár és jövedelem', ut }]), gyikLd(kerdesek), { '@context': 'https://schema.org', '@type': 'Dataset', name: `Lakásár és jövedelem aránya Magyarországon, ${ev[0]}–${utEv}`, description: leiras, url: `${k.cfg.domain}/${ut}`, inLanguage: 'hu', isAccessibleForFree: true, temporalCoverage: `${ev[0]}/${utEv}`, isBasedOn: [aj.forras.url, adat.arak.forras.url], distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${k.cfg.domain}/${ARAK_ADAT_JEL}ar-jovedelem.csv` }] }] });
}
