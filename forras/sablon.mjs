// Oldalkeret és űrlap-építőkockák: fejléc, lábléc, űrlapkártya mezői, elszámolás, pecsét, guilloche.
// A motor az autózom (czakopeti/autokoltseg) sablonjából jön; a saját vizuális identitás a DIZAJN.md szerint épül rá.
import { datumHu, fmt, honapHu } from './js/megjelenites.mjs';

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const MENU = [
  { ut: 'vagyonszerzesi-illetek-kalkulator/', nev: 'Illeték' },
  { ut: 'wekerle-plusz-kalkulator/', nev: 'Wekerle Plusz' },
  { ut: 'lakasvaltas-kalkulator/', nev: 'Lakásváltás' },
  { ut: 'ingatlaneladas-szja-kalkulator/', nev: 'Eladás adója' },
  { ut: 'lakaskiadas-ado-kalkulator/', nev: 'Kiadás adója' },
];
/**
 * Az oldal szerkezete: minden tartalmi oldal pontosan egy csoportban. Ebből épül a főoldal, a balról beúszó menü,
 * a lábléc, az llms.txt és az oldalak alján a „Kapcsolódó oldalak” sáv, így mindenhol ugyanaz a rend.
 * Az elemek: [cím, név, rövid mondat a menübe, és ha kell, a hosszabb név a főoldalra és az llms.txt-be].
 */
export const CSOPORTOK = [
  { id: 'veszel', cim: 'Lakást veszel', bevezeto: 'Amit a vételáron felül fizetsz, és a kamattámogatott hitel, amely jár neked.', elemek: [
    ['lakasvasarlas-koltsegei-kalkulator/', 'Mennyi pénz kell?', 'Önerő, illeték, mellékköltségek, időrendben', 'Mennyi pénz kell a vételhez?'],
    ['vagyonszerzesi-illetek-kalkulator/', 'Illeték', 'Mennyi, és melyik kedvezmény jár', 'Vagyonszerzési illeték'],
    ['mennyi-lakashitelt-kaphatok/', 'Mennyi hitelt kaphatsz', 'A jövedelmed és a lakás értéke szerint', 'Mennyi lakáshitelt kaphatsz'],
    ['wekerle-plusz-kalkulator/', 'Wekerle Plusz', 'Jogosultság és törlesztő', 'Wekerle Plusz hitel'],
    ['elotorlesztes-kalkulator/', 'Előtörlesztés', 'Rövidebb futamidő vagy kisebb törlesztő', 'Előtörlesztés'],
    ['alberlet-vagy-lakasvasarlas-kalkulator/', 'Bérlés vagy vétel', 'Melyikkel jársz jobban hosszú távon', 'Albérlet vagy lakásvásárlás'],
  ] },
  { id: 'valtasz', cim: 'Eladod, és másikat veszel', bevezeto: 'A két ügylet egy lapon, mert az egyik adója és a másik illetéke összefügg.', elemek: [
    ['lakasvaltas-kalkulator/', 'Lakásváltás', 'Eladás és vétel együtt, hitelszükséglet', 'Lakásváltás'],
    ['ingatlaneladas-szja-kalkulator/', 'Eladás adója', 'Mennyi szja-t fizetsz, és mikortól semennyit', 'Ingatlaneladás szja-ja'],
  ] },
  { id: 'kiadod', cim: 'Kiadod a lakásod', bevezeto: 'Mennyi adó jár a bérleti díj után, és mikor kell befizetni.', elemek: [
    ['lakaskiadas-ado-kalkulator/', 'Kiadás adója', '10% vagy tételes, határidőkkel', 'Lakáskiadás adója'],
    ['lakas-befektetes-hozam-kalkulator/', 'Megéri kiadásra venni?', 'Bruttó és nettó hozam', 'Megéri kiadásra venni?'],
    ['airbnb-vagy-hosszu-tavu-kiadas/', 'Airbnb vagy hosszú táv', 'Melyik hoz többet adó után', 'Airbnb vagy hosszú távú kiadás'],
    ['berleti-dij-emeles-inflacio/', 'Bérleti díj emelése', 'A KSH átlagos inflációjával', 'Bérleti díj emelése az inflációval'],
  ] },
  { id: 'orokolsz', cim: 'Örökölsz vagy ajándékba kapod', bevezeto: 'Családon belül többnyire nincs illeték, de a haszonélvezet és a terhek számítanak.', elemek: [
    ['oroklesi-ajandekozasi-illetek-kalkulator/', 'Öröklés és ajándék', 'Mennyi illeték, ki mentes', 'Öröklési és ajándékozási illeték'],
    ['haszonelvezeti-jog-erteke/', 'Haszonélvezet', 'Mennyit ér, és mi az illetéke', 'A haszonélvezet értéke'],
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
export const KALK_UTAK = { rovidtav: 'airbnb-vagy-hosszu-tavu-kiadas/', indulo: 'lakasvasarlas-koltsegei-kalkulator/', berlesvetel: 'alberlet-vagy-lakasvasarlas-kalkulator/', hitelkepesseg: 'mennyi-lakashitelt-kaphatok/', ingyenes: 'oroklesi-ajandekozasi-illetek-kalkulator/', haszonelvezet: 'haszonelvezeti-jog-erteke/', elotorlesztes: 'elotorlesztes-kalkulator/', emeles: 'berleti-dij-emeles-inflacio/', hozam: 'lakas-befektetes-hozam-kalkulator/', eladas: 'ingatlaneladas-szja-kalkulator/', illetek: 'vagyonszerzesi-illetek-kalkulator/', wekerle: 'wekerle-plusz-kalkulator/', kiadas: 'lakaskiadas-ado-kalkulator/', lakasvaltas: 'lakasvaltas-kalkulator/' };

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

/** Ideiglenes szókép a munkanévvel. A végleges logó a név és a domain kiválasztása után készül (marka/). */
const logo = (cfg) => `<span class="logo"><i class="logo-jel" aria-hidden="true"></i><span class="logo-szoveg">${esc(cfg.marka)}</span></span>`;

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
<meta property="og:image" content="${cfg.domain}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(cfg.marka)}: mennyibe kerül valójában a lakás? Ingyenes kalkulátorok forrással és dátummal.">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16181D" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${L.gyoker('favicon.svg')}" type="image/svg+xml">
${elonezet ? '' : `<link rel="preload" href="${L.a('fonts/bricolage-grotesque-latin-opsz-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${L.a('fonts/onest-latin-wght-normal.woff2')}" as="font" type="font/woff2" crossorigin>`}
<link rel="stylesheet" href="${L.a(`style.css?v=${verzio}`)}">
${ld}
</head>
<body>
<a class="ugras" href="#tartalom">Ugrás a tartalomra</a>
<header class="fejlec"><div class="keret">
<div class="marka-blokk"><a class="jegy" href="${L.l('')}" aria-label="${esc(cfg.marka)}, főoldal">${logo(cfg)}</a>${cfg.szlogen ? `<p class="szlogen">${esc(cfg.szlogen)}</p>` : ''}</div>
<nav class="menu" id="fomenu" aria-label="Fő menü">${MENU.map((m) => `<a href="${L.l(m.ut)}"${m.ut === ut ? ' aria-current="page"' : ''}>${m.nev}</a>`).join('')}</nav>
<button class="fiok-gomb" type="button" aria-label="Minden kalkulátor" aria-haspopup="dialog" aria-controls="fiok" aria-expanded="false">${HAMBURGER}<span>Minden kalkulátor</span></button>
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
export const reszCim = (resz, cim) => `<legend>${cim}</legend>`;

/** A mező előtti kód: az okirat valódi rovata (például a tulajdoni lap I., II., III. része), csak ha az adat tényleg onnan jön. */
export const kod = (k, mi = '') => `<span class="kod${k ? '' : ' ures'}"${k && mi ? ` title="${esc(mi)}"` : ''} aria-hidden="true">${k || ''}</span>`;
export const sor = (k, belso, attr = '') => `<div class="sor"${attr}><div class="mezo">${belso}</div></div>`;

/** Számmező. Forintnál (me: 'Ft') szöveges mező ezres tagolással: a böngésző számmezője nem tud szóközt mutatni. */
export function szamMezo({ id, cim, me = '', ertek = '', sugo = '', min = '', max = '', placeholder = '', szeles = false, extra = '', nev = '', tized = false, ezres = me === 'Ft' }) {
  const szoveges = tized || ezres;
  return `<label for="${id}">${cim}</label><div class="beir${szeles ? ' szeles' : ''}"><input id="${id}" name="${nev || id}" type="${szoveges ? 'text' : 'number'}" inputmode="${tized ? 'decimal' : 'numeric'}"${tized ? ' pattern="[0-9]+([,.][0-9]+)?" autocomplete="off"' : ''}${ezres ? ' data-ezres autocomplete="off"' : ''}${min !== '' ? ` min="${min}"` : ''}${max !== '' ? ` max="${max}"` : ''} value="${ertek}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}>${me ? `<span class="me">${me}</span>` : ''}</div>${extra}${sugo ? `<span class="sugo">${sugo}</span>` : ''}`;
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
  return `<form class="forgalmi${osztaly ? ` ${osztaly}` : ''}"${kalk ? ` data-kalk="${kalk}"` : ''} novalidate${extra}><div class="forgalmi-fej"><h2>${cim}</h2>${al ? `<p>${al}</p>` : ''}</div>${tartalom}</form>`;
}

/** Az elszámolás kerete a pecséttel. */
export function elszamolas(k, belso, { cim = 'Elszámolás', gombok = true, labjegy = '', szeles = false, kesz = false } = {}) {
  return `<section class="elszamolas${szeles ? ' szeles' : ''}" id="eredmeny" aria-labelledby="elsz-cim">
<div class="elsz-fej"><h2 id="elsz-cim">${cim === 'Elszámolás' ? 'Eredmény' : cim}</h2>${(() => { const d = adatDatum(k.adat); return `<time datetime="${d.iso}" title="${d.cimke === 'Ellenőrizve' ? 'Ekkor vetettük össze a szabályokat a forrásokkal' : 'A legfrissebb adat napja'}">${d.cimke}: ${datumHu(d.iso)}</time>`; })()}</div>
<div class="elsz-tartalom" aria-live="polite">${belso}</div>
${gombok ? `<div class="elsz-lab"><button class="szoveg-gomb" type="button" data-masol>Számítás megosztása</button><button class="szoveg-gomb" type="button" data-nyomtat>Nyomtatás</button></div>${VJ_HELY}` : labjegy ? `<div class="elsz-lab"><p class="kicsi">${labjegy}</p></div>` : ''}
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
