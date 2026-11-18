// Oldalkeret és űrlap-építőkockák: fejléc, lábléc, űrlapkártya mezői, elszámolás, pecsét, guilloche.
// A motor az autózom (czakopeti/autokoltseg) sablonjából jön; a saját vizuális identitás a DIZAJN.md szerint épül rá.
import { datumHu, fmt, honapHu } from './js/megjelenites.mjs';

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const MENU = [
  { ut: 'ingatlaneladas-szja-kalkulator/', nev: 'Eladás adója' },
  { ut: 'forrasok/', nev: 'Források' },
  { ut: 'rolunk/', nev: 'Rólunk' },
];
/**
 * Az oldal szerkezete: minden tartalmi oldal pontosan egy csoportban. Ebből épül a főoldal, a balról beúszó menü,
 * a lábléc, az llms.txt és az oldalak alján a „Kapcsolódó oldalak” sáv, így mindenhol ugyanaz a rend.
 * Az elemek: [cím, név, rövid mondat a menübe, és ha kell, a hosszabb név a főoldalra és az llms.txt-be].
 */
export const CSOPORTOK = [
  { id: 'eladas', cim: 'Eladod a lakásod', bevezeto: 'Mennyi marad az eladási árból, és mit kér belőle az adóhivatal.', elemek: [
    ['ingatlaneladas-szja-kalkulator/', 'Eladás adója', 'Mennyi szja-t fizetsz, és mikortól semennyit', 'Ingatlaneladás szja-ja'],
  ] },
  { id: 'adatok', cim: 'Adatok és források', bevezeto: 'A szabályok, amelyekkel számolunk, forrással és dátummal.', elemek: [
    ['forrasok/', 'Honnan vannak a számok?', 'Minden szabály forrása és dátuma'],
  ] },
];
/** Az oldalról szóló, nem tartalmi oldalak: csak a menüben és a láblécben. */
export const OLDALROL = [
  ['rolunk/', 'Rólunk és szerkesztői elvek', ''],
  ['adatvedelem/', 'Adatvédelem', ''],
  ['impresszum/', 'Impresszum', ''],
];
/** A balról beúszó menü: a csoportok, és a végén az oldalról szóló lapok. */
export const FIOK = [...CSOPORTOK, { id: 'oldalrol', cim: 'Az oldalról', elemek: OLDALROL.slice(0, 1) }];
/** Melyik csoportba tartozik egy oldal (a „Kapcsolódó oldalak” sávhoz). */
export const csoportja = (ut) => CSOPORTOK.find((cs) => cs.elemek.some(([u]) => u === ut)) || null;
const HAMBURGER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

/** A kalkulátorok címe a kalkulátor kulcsa szerint: a „Következő lépés” linkjeihez (app.mjs). */
export const KALK_UTAK = { eladas: 'ingatlaneladas-szja-kalkulator/' };

/** Linkkészítő: élesben /ut/, előnézetben relatív útvonal index.html-lel. */
export function linkelo(oldalUt, elonezet) {
  const elo = '../'.repeat(oldalUt ? oldalUt.split('/').filter(Boolean).length : 0);
  return {
    l: (ut = '', q = '') => (elonezet ? `${elo}${ut}index.html${q}` : `/${ut}${q}`),
    a: (fajl) => (elonezet ? `${elo}assets/${fajl}` : `/assets/${fajl}`),
    gyoker: (fajl) => (elonezet ? `${elo}${fajl}` : `/${fajl}`),
  };
}

/* ---------- Grafikai elemek ---------- */

/** Kis alaprajz az űrlap sarkába (maszkként, egyszínű vonalrajz). Saját rajz, nem valódi lakás. */
export function alaprajzJel() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" fill="none" stroke="#000" stroke-width="3.2" stroke-linejoin="miter">
<path d="M40 60H260V250H40Z"/><path d="M48 68H252V242H48Z" stroke-width="1"/>
<path d="M160 60V150M160 186V250M160 150H205M235 150H260M40 170H92M124 170H160"/>
<path d="M205 150A30 30 0 0 1 235 180M92 170A32 32 0 0 0 124 202M160 186A36 36 0 0 1 124 150" stroke-width="1"/>
<path d="M80 56H130M80 64H130M190 56H235M190 64H235M36 95V140M44 95V140" stroke-width="1"/>
<path d="M40 276H260M40 270V282M260 270V282M160 270V282M282 60V250M276 60H288M276 250H288" stroke-width="1"/>
</svg>`;
}
/** A főoldal alaprajza: egy 54 négyzetméteres, kétszobás lakás, méretvonalakkal. A falak egyszer kirajzolódnak. */
export function alaprajzNagy() {
  const fal = (d) => `<path class="fal" pathLength="1" d="${d}"/>`;
  return `<svg class="alaprajz" viewBox="0 0 584 420" role="img" aria-label="Egy 54 négyzetméteres, kétszobás lakás alaprajza méretvonalakkal">
${fal('M40 50H520V340H40Z')}${fal('M300 50V180')}${fal('M300 226V340')}${fal('M300 180H380')}${fal('M424 180H520')}${fal('M40 232H120')}${fal('M164 232H300')}${fal('M190 232V340')}
<g class="ker">
<path class="vekony" d="M380 180A44 44 0 0 1 424 224M120 232A44 44 0 0 0 164 276M300 226A46 46 0 0 1 254 180M236 340A40 40 0 0 1 276 300"/>
<path class="vekony" d="M90 45H210M90 55H210M350 45H470M350 55H470M515 230V300M525 230V300M35 262V312M45 262V312"/>
<text x="170" y="138" text-anchor="middle">nappali</text><text class="nm" x="170" y="158" text-anchor="middle">21,4 m²</text>
<text x="410" y="112" text-anchor="middle">hálószoba</text><text class="nm" x="410" y="132" text-anchor="middle">12,8 m²</text>
<text x="410" y="266" text-anchor="middle">konyha</text><text class="nm" x="410" y="286" text-anchor="middle">9,6 m²</text>
<text x="115" y="294" text-anchor="middle">fürdő</text><text class="nm" x="115" y="314" text-anchor="middle">4,7 m²</text>
<text x="245" y="278" text-anchor="middle">előtér</text><text class="nm" x="245" y="296" text-anchor="middle">5,5 m²</text>
<path class="meret" d="M40 378H520M40 370V386M520 370V386M300 370V386M36 382L44 374M296 382L304 374M516 382L524 374M546 50V340M538 50H554M538 340H554M542 54L550 46M542 344L550 336"/>
<text class="m" x="170" y="402" text-anchor="middle">4,85</text><text class="m" x="410" y="402" text-anchor="middle">4,10</text><text class="m" x="566" y="195" text-anchor="middle" transform="rotate(90 566 195)">5,40</text>
</g></svg>`;
}

/** Érkeztető bélyegző a dátummal: a forrásolt szabályokkal számolt eredmény jele. */
const HO_ROV = ['JAN', 'FEBR', 'MÁRC', 'ÁPR', 'MÁJ', 'JÚN', 'JÚL', 'AUG', 'SZEPT', 'OKT', 'NOV', 'DEC'];
export function pecset(ma, ut = true, marka = '', link = false) {
  const [ev, ho, nap] = ma.split('-').map(Number);
  // A bélyegzőn a saját nevünk áll: a miénk, nem hatóságé. Kattintásra a forrásokhoz visz.
  return `<svg class="pecset${ut ? ' ut' : ''}" viewBox="0 0 168 92" aria-hidden="true">${link ? '<title>Honnan jönnek a számok? Kattints a forrásokért.</title>' : ''}
<rect x="3" y="3" width="162" height="86" rx="5" fill="none" stroke="currentColor" stroke-width="3"/>
<rect x="8.5" y="8.5" width="151" height="75" rx="2.5" fill="none" stroke="currentColor" stroke-width="1"/>
<path d="M9 30H159M9 62H159" stroke="currentColor" stroke-width="1"/>
<text aria-hidden="true" x="84" y="24" text-anchor="middle" fill="currentColor" font-family="Jost, sans-serif" font-weight="600" font-size="11" letter-spacing="1.2">${esc(marka.toLocaleUpperCase('hu'))}</text>
<text aria-hidden="true" x="84" y="54" text-anchor="middle" fill="currentColor" font-family="Jost, sans-serif" font-weight="600" font-size="21" letter-spacing=".5">${ev} ${HO_ROV[ho - 1]} ${String(nap).padStart(2, '0')}</text>
<text aria-hidden="true" x="84" y="77" text-anchor="middle" fill="currentColor" font-family="Jost, sans-serif" font-weight="600" font-size="9.5" letter-spacing="1.1">FORRÁSSAL SZÁMOLVA</text>
</svg>`;
}

/** Ideiglenes szókép a munkanévvel. A végleges logó a név és a domain kiválasztása után készül (marka/). */
const logo = (cfg) => `<span class="logo logo-szoveg">${esc(cfg.marka)}</span>`;

/**
 * Az adatok dátuma: a szabályok legutóbbi kézi vagy gépi ellenőrzésének napja (data/allapot.json),
 * ennek híján a legfrissebb tételszintű ellenőrzés (data/szabalyok.json → ellenorizve).
 */
export function adatDatum(adat) {
  if (adat.allapot.utolso_ellenorzes) return { cimke: 'Ellenőrizve', iso: adat.allapot.utolso_ellenorzes.slice(0, 10) };
  const d = [];
  JSON.stringify(adat.szabalyok, (k, v) => { if (k === 'ellenorizve' && typeof v === 'string') d.push(v); return v; });
  d.sort();
  return { cimke: 'Ellenőrizve', iso: d[d.length - 1] };
}

// A sitemap lastmod-jához: két építés tartalma ugyanaz-e. A dátumokat (ellenőrzés napja, mai nap) és a
// CSS/JS verziószámot kitakarjuk, mert ezek nem a látogatónak szóló tartalom változásai.
const HONAPNEV = 'január|február|március|április|május|június|július|augusztus|szeptember|október|november|december';
export function tartalomLenyomat(html) {
  return html
    .replace(/\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?/g, '#')
    .replace(new RegExp(`\\d{4}\\. (${HONAPNEV}) \\d{1,2}\\.(, \\d{2}:\\d{2})?`, 'g'), '#')
    .replace(/\?v=\w+/g, '');
}
export function lastmodDontes(regiHtml, ujHtml, regiDatum, ma) {
  if (!regiHtml || !regiDatum) return ma;
  return tartalomLenyomat(regiHtml) === tartalomLenyomat(ujHtml) ? regiDatum : ma;
}

/* ---------- Oldalkeret ---------- */

export function oldal(k, { cim, leiras, ut, tartalom, jsonld = [], adatJson = null, indexelheto = true }) {
  const { cfg, elonezet, verzio } = k;
  const L = linkelo(ut, elonezet);
  const kanonikus = `${cfg.domain}/${ut}`;
  const teljesCim = ut ? `${cim} | ${cfg.marka}` : cim;
  // Minden oldalhoz: WebPage a frissítés dátumával és a kiadóval (szervezet, logóval). A frissességi jelzés a
  // ceevio-laborban irányjelző hatású volt az AI-említésre.
  const kiado = { '@type': 'Organization', name: cfg.marka, url: `${cfg.domain}/`, ...(cfg.szlogen ? { slogan: cfg.szlogen } : {}) };
  const lap = { '@context': 'https://schema.org', '@type': 'WebPage', name: cim, description: leiras, url: kanonikus, inLanguage: 'hu', dateModified: adatDatum(k.adat).iso, isPartOf: { '@type': 'WebSite', name: cfg.marka, url: `${cfg.domain}/` }, publisher: kiado };
  const ld = [lap, ...jsonld].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${cfg.eles && !elonezet && !/\.pages\.dev$/.test(new URL(cfg.domain).host) ? `<script>/* A régi Cloudflare-címről (pages.dev) a saját domainre visz, ugyanarra az aloldalra */if(/\\.pages\\.dev$/.test(location.hostname))location.replace(${JSON.stringify(cfg.domain)}+location.pathname+location.search+location.hash)</script>` : ''}
<title>${esc(teljesCim)}</title>
<meta name="description" content="${esc(leiras)}">
<meta name="robots" content="${!cfg.eles ? 'noindex, nofollow' : indexelheto ? 'index, follow, max-image-preview:large' : 'noindex, follow'}">
<link rel="canonical" href="${kanonikus}">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="${esc(cfg.marka)}">
<meta property="og:title" content="${esc(cim)}">
<meta property="og:description" content="${esc(leiras)}">
<meta property="og:url" content="${kanonikus}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#EDF1F7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0D1F47" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${L.gyoker('favicon.svg')}" type="image/svg+xml">
${elonezet ? '' : `<link rel="preload" href="${L.a('fonts/jost-latin-wght-normal.woff2')}" as="font" type="font/woff2" crossorigin>`}
<link rel="stylesheet" href="${L.a(`style.css?v=${verzio}`)}">
${ld}
</head>
<body>
<a class="ugras" href="#tartalom">Ugrás a tartalomra</a>
<header class="fejlec"><div class="keret">
<button class="fiok-gomb" type="button" aria-label="Menü" aria-haspopup="dialog" aria-controls="fiok" aria-expanded="false">${HAMBURGER}<span>Menü</span></button>
<div class="marka-blokk"><a class="jegy" href="${L.l('')}" aria-label="${esc(cfg.marka)}, főoldal">${logo(cfg)}</a>${cfg.szlogen ? `<p class="szlogen">${esc(cfg.szlogen)}</p>` : ''}</div>
<nav class="menu" id="fomenu" aria-label="Fő menü">${MENU.map((m) => `<a href="${L.l(m.ut)}"${m.ut === ut ? ' aria-current="page"' : ''}>${m.nev}</a>`).join('')}</nav>
</div></header>
<dialog class="fiok" id="fiok" aria-label="Minden oldal">
<div class="fiok-fej"><a class="jegy" href="${L.l('')}" aria-label="${esc(cfg.marka)}, főoldal">${logo(cfg)}</a><button class="fiok-zar" type="button" aria-label="Menü bezárása">✕</button></div>
<nav aria-label="Minden oldal">${FIOK.map((cs) => `<h2>${cs.cim}</h2><ul>${cs.elemek.map(([u, n, d]) => `<li><a href="${L.l(u)}"${u === ut ? ' aria-current="page"' : ''}><span><b>${n}</b>${d ? `<small>${d}</small>` : ''}</span></a></li>`).join('')}</ul>`).join('')}</nav>
</dialog>
<main id="tartalom">
${(() => {
  const t = tartalom(L);
  if (VJ_NELKUL.includes(ut)) return t.replace(VJ_HELY, '');
  if (t.includes(VJ_HELY)) return t.replace(VJ_HELY, visszajelzesDoboz(cfg, ut, true));
  return `${t}\n<div class="keret">${visszajelzesDoboz(cfg, ut, false)}</div>`;
})()}
</main>
${lablec(k, L)}
${adatJson ? `<script type="application/json" id="adat">${JSON.stringify(adatJson)}</script>\n<script type="application/json" id="utak">${JSON.stringify(Object.fromEntries(Object.entries(KALK_UTAK).map(([kk, u]) => [kk, L.l(u)])))}</script>` : ''}
<script type="module" src="${L.a(`js/app.js?v=${verzio}`)}"></script>
</body>
</html>
`;
}

/** Igaz, ha az ellenőrzés a megadott napnál (alapból 45) régebbi: ekkor az oldal jelzi, hogy a szabályok felülvizsgálata esedékes. */
export function ellenorzesKesik(utolso, ma, nap = 45) {
  if (!utolso || !ma) return false;
  return (Date.parse(String(ma).slice(0, 10)) - Date.parse(String(utolso).slice(0, 10))) / 86400000 > nap;
}
function lablec(k, L) {
  const { adat, ma, cfg } = k;
  return `<footer class="lablec"><div class="keret">
<div>
<p><strong>Független oldal, nem hatóság és nem hitelközvetítő.</strong> A jogszabályok és a NAV közzétett tájékoztatói alapján számolunk. A számítások tájékoztató jellegűek, és nem helyettesítik az adótanácsadást vagy az ügyvédet. A ténylegesen fizetendő adót és illetéket a NAV határozata tartalmazza.</p>
<p>A szabályokat rendszeresen összevetjük a forrásokkal. Legutóbbi ellenőrzés: ${datumHu(adatDatum(adat).iso)}</p>
</div>
<nav class="lablec-csoportok" aria-label="Az oldal tartalma">${[...CSOPORTOK, { cim: esc(cfg.marka), elemek: OLDALROL }].map((cs) => `<div><h2>${cs.cim}</h2><ul>${cs.elemek.map(([u, n]) => `<li><a href="${L.l(u)}">${n}</a></li>`).join('')}</ul></div>`).join('')}</nav>
</div></footer>`;
}

/**
 * Az oldal teteje. A ceevio-labor (L3b, L4) szerint az AI-említést a „válasz elöl” növeli bizonyítottan:
 * a cím maga a kérdés, és az első bekezdés (valasz) rögtön megválaszolja, konkrét számmal. A bevezető csak utána jön.
 * A frissességi dátum (friss) irányjelző hatású volt, ezért minden számoló oldalon kiírjuk.
 */
export function oldalfej(L, { morzsa, cim, valasz = '', bevezeto, fo = false, friss = '' }) {
  const m = morzsa ? `<ol class="morzsa" aria-label="Hol vagy">${[`<li><a href="${L.l('')}">Főoldal</a></li>`, ...morzsa.map((x) => (Array.isArray(x) ? `<li><a href="${L.l(x[1])}">${x[0]}</a></li>` : `<li aria-current="page">${x}</li>`))].join('')}</ol>` : '';
  return `<div class="keret oldalfej${fo ? ' fo' : ''}">${m}<h1>${cim}</h1>${valasz ? `<p class="valasz">${valasz}</p>` : ''}${bevezeto ? `<p class="bevezeto">${bevezeto}</p>` : ''}${friss ? `<p class="friss">Az adatokat ${friss} ellenőriztük. <a href="${L.l('forrasok/')}">Honnan vannak a számok?</a></p>` : ''}</div>`;
}

/* ---------- Űrlap-építőkockák ---------- */

/** Szakaszcím az űrlapon. A római szám a tulajdoni lap része (I. az ingatlan, II. a tulajdonjog, III. a terhek), csak ha az adat tényleg ott van. */
export const reszCim = (resz, cim) => `<legend>${resz ? `<span class="resz">${resz}</span>` : ''}${cim}</legend>`;

/** A mező előtti kód: az okirat valódi rovata (például a tulajdoni lap I., II., III. része), csak ha az adat tényleg onnan jön. */
export const kod = (k, mi = '') => `<span class="kod${k ? '' : ' ures'}"${k && mi ? ` title="${esc(mi)}"` : ''} aria-hidden="true">${k || ''}</span>`;
export const sor = (k, belso, attr = '') => `<div class="sor"${attr}>${kod(k)}<div class="mezo">${belso}</div></div>`;

export function szamMezo({ id, cim, me = '', ertek = '', sugo = '', min = '', max = '', placeholder = '', szeles = false, extra = '', nev = '', tized = false }) {
  return `<label for="${id}">${cim}</label><div class="beir${szeles ? ' szeles' : ''}"><input id="${id}" name="${nev || id}" type="${tized ? 'text' : 'number'}" inputmode="${tized ? 'decimal' : 'numeric'}"${tized ? ' pattern="[0-9]+([,.][0-9]+)?" autocomplete="off"' : ''}${min !== '' ? ` min="${min}"` : ''}${max !== '' ? ` max="${max}"` : ''} value="${ertek}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}>${me ? `<span class="me">${me}</span>` : ''}</div>${extra}${sugo ? `<span class="sugo">${sugo}</span>` : ''}`;
}

export function negyzetek(name, cim, opciok, ertek, idElotag = '') {
  const id = `${idElotag}${name}-c`;
  return `<span class="mezo-cim" id="${id}">${cim}</span><div class="negyzetek" role="radiogroup" aria-labelledby="${id}">${opciok.map(([v, t]) => `<label class="negyzet"><input type="radio" name="${name}" value="${v}"${String(v) === String(ertek) ? ' checked' : ''}><span class="n"></span>${t}</label>`).join('')}</div>`;
}

export function jelolo(name, cim, leiras = '', be = false, attr = '') {
  return `<label class="negyzet hosszu"${attr}><input type="checkbox" name="${name}"${be ? ' checked' : ''}><span class="n"></span><span class="tobb"><span>${cim}</span>${leiras ? `<small>${leiras}</small>` : ''}</span></label>`;
}

export function valaszto(id, cim, opciok, ertek, sugo = '') {
  return `<label for="${id}">${cim}</label><div class="valaszto"><select id="${id}" name="${id}">${opciok.map(([v, t]) => `<option value="${v}"${String(v) === String(ertek) ? ' selected' : ''}>${t}</option>`).join('')}</select></div>${sugo ? `<span class="sugo">${sugo}</span>` : ''}`;
}

/** Az űrlapkártya kerete. (Az osztálynév a motorból öröklődik; az új identitással együtt kap saját nevet.) */
export function forgalmi({ cim, al = '', tartalom, kalk, extra = '', osztaly = '' }) {
  return `<form class="forgalmi${osztaly ? ` ${osztaly}` : ''}"${kalk ? ` data-kalk="${kalk}"` : ''} novalidate${extra}><span class="gilos" aria-hidden="true"></span><div class="forgalmi-fej"><h2>${cim}</h2>${al ? `<p>${al}</p>` : ''}</div>${tartalom}</form>`;
}

/** Az elszámolás kerete a pecséttel. */
export function elszamolas(k, belso, { cim = 'Elszámolás', gombok = true, labjegy = '', szeles = false, kesz = false } = {}) {
  return `<section class="elszamolas${szeles ? ' szeles' : ''}" id="eredmeny" aria-labelledby="elsz-cim">
<div class="elsz-fej"><h2 id="elsz-cim">${cim}</h2>${(() => { const d = adatDatum(k.adat); return `<time datetime="${d.iso}" title="${d.cimke === 'Ellenőrizve' ? 'Ekkor vetettük össze a szabályokat a forrásokkal' : 'A legfrissebb adat napja'}">${d.cimke}: ${datumHu(d.iso)}</time>`; })()}</div>
<div class="elsz-tartalom" aria-live="polite">${belso}</div>
${gombok ? `<div class="elsz-lab"><button class="szoveg-gomb" type="button" data-masol>Számítás megosztása</button><button class="szoveg-gomb" type="button" data-nyomtat>Nyomtatás</button></div>${VJ_HELY}` : labjegy ? `<div class="elsz-lab"><p class="kicsi">${labjegy}</p></div>` : ''}
${pecset(k.ma, true, k.cfg.marka, true).replace('<svg class="pecset ut"', `<svg class="pecset${kesz ? ' ut' : ''}"${kesz ? '' : ' hidden'}`)}
</section>
<a class="mini" href="#eredmeny" hidden><span class="mi"></span><span class="mennyi"></span></a>`;
}


/* ---------- Visszajelzés ---------- */
const VJ_HELY = '<!--visszajelzes-->';
// Ezeken az oldalakon nincs visszajelzés-doboz (jogi szöveg, főoldal)
const VJ_NELKUL = ['', 'impresszum/', 'adatvedelem/'];
const HUVELYK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"><path d="M7 10.5v9.5H4v-9.5h3Zm0 0 3.6-6.8c1.6 0 2.7 1.1 2.3 2.8L12.4 10h5.4a2 2 0 0 1 2 2.4l-1.2 5.9a2.1 2.1 0 0 1-2.1 1.7H7"/></svg>';

/** A „Hasznos volt?” doboz. Kalkulátornál a beírt számokat is elküldheti a látogató, ha akarja. */
export function visszajelzesDoboz(cfg, ut, kalk) {
  const email = cfg.kapcsolat_email;
  return `<div class="vj${kalk ? '' : ' vj-oldal'}" data-visszajelzes data-ut="/${esc(ut)}"${email ? ` data-email="${esc(email)}"` : ''}>
<p class="vj-kerdes" id="vj-kerdes">${kalk ? 'Hasznos volt ez a számítás?' : 'Hasznos volt ez az oldal?'}</p>
<div class="vj-gombok" role="group" aria-labelledby="vj-kerdes"><button class="vj-gomb" type="button" data-vj="fel" aria-pressed="false">${HUVELYK}<span>Igen</span></button><button class="vj-gomb vj-le" type="button" data-vj="le" aria-pressed="false">${HUVELYK}<span>Nem</span></button></div>
<form class="vj-urlap" hidden novalidate>
<label for="vj-szoveg">${kalk ? 'Mi nem stimmel, vagy mit vártál volna?' : 'Mi hiányzott, vagy mi nem stimmel?'}</label>
<textarea id="vj-szoveg" name="szoveg" rows="3" maxlength="1000"></textarea>
${kalk ? '<label class="vj-jelolo"><input type="checkbox" name="adatok" checked><span>A beírt számokat és az eredményt is elküldöm, hogy lássátok, hol csúszott el</span></label>' : ''}
<input class="vj-csapda" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">
<div class="vj-sor"><button class="gomb" type="submit">Elküldöm</button><p class="kicsi halk">Nevet, e-mail-címet, pontos címet és helyrajzi számot ne írj bele.${email ? ` Ha választ is szeretnél, <a data-hibajelzes data-cim="${esc(email)}" href="mailto:${esc(email)}">írj levelet</a>.` : ''}</p></div>
</form>
<p class="vj-allapot" role="status"></p>
</div>`;
}

/* ---------- Tartalmi elemek ---------- */

export function gyik(kerdesek) {
  return `<div class="gyik">${kerdesek.map((q) => `<details><summary>${q.k}</summary><div class="valasz">${q.v.map((p) => `<p>${p}</p>`).join('')}</div></details>`).join('')}</div>`;
}
export function gyikLd(kerdesek) {
  const t = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: kerdesek.map((q) => ({ '@type': 'Question', name: t(q.k), acceptedAnswer: { '@type': 'Answer', text: t(q.v.join(' ')) } })) };
}
export function morzsaLd(cfg, elemek) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ nev: 'Főoldal', ut: '' }, ...elemek].map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.nev, item: `${cfg.domain}/${e.ut}` })) };
}
export function alkalmazasLd(cfg, nev, ut, leiras) {
  return { '@context': 'https://schema.org', '@type': 'WebApplication', name: nev, url: `${cfg.domain}/${ut}`, description: leiras, applicationCategory: 'FinanceApplication', operatingSystem: 'Web', inLanguage: 'hu', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'HUF' } };
}
export function forrasLista(elemek) {
  return `<ul class="forrasok">${elemek.map((f) => `<li>${f.url ? `<a href="${f.url}" rel="noopener" target="_blank">${f.nev}</a>` : `<span>${f.nev}</span>`}${f.d ? `<small>${f.d}</small>` : ''}</li>`).join('')}</ul>`;
}
export function tovabb(L, aktiv) {
  // Előbb a saját csoport oldalai, utána a többi csoporté: így minden oldal minden tartalmi oldalra linkel.
  const sajat = csoportja(aktiv);
  const sorrend = sajat ? [sajat, ...CSOPORTOK.filter((cs) => cs !== sajat)] : CSOPORTOK;
  const t = sorrend.flatMap((cs) => cs.elemek).filter(([u]) => u !== aktiv);
  return `<nav class="tovabb" aria-label="Kapcsolódó oldalak">${t.map(([u, n]) => `<a href="${L.l(u)}">${n}</a>`).join('')}</nav>`;
}

export { datumHu, fmt, honapHu };
