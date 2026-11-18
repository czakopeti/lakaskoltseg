// Az oldal felépítése: node epit.mjs            → web/ (éles, Cloudflare Pages ezt szolgálja ki)
//                      node epit.mjs --elonezet → elonezet/ (relatív linkek, bármilyen tárhelyen vagy fájlként is megy)
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { betoltAdat, olvas, maBudapest, GYOKER } from './forras/adat.mjs';
import { alaprajzJel, lastmodDontes, CSOPORTOK } from './forras/sablon.mjs';
import * as O from './forras/oldalak.mjs';
import * as M from './forras/js/megjelenites.mjs';

const elonezet = process.argv.includes('--elonezet');
const KI = join(GYOKER, elonezet ? 'elonezet' : 'web');
const cfg = olvas('config.json');
const adat = betoltAdat();
const ma = maBudapest();
const ev = Number(ma.slice(0, 4));

// Figyelmeztetés, ha élesítés előtt hiányzik valami
const hianyzik = [];
if (!cfg.uzemelteto.nev) hianyzik.push('üzemeltető neve');
if (cfg.uzemelteto.tipus !== 'magánszemély' && !cfg.uzemelteto.szekhely) hianyzik.push('székhely');
if (!cfg.kapcsolat_email) hianyzik.push('kapcsolati e-mail');
if (cfg.eles && hianyzik.length) {
  console.error(`HIBA: az eles: true mellett hiányzik: ${hianyzik.join(', ')}. Töltsd ki a config.json-t.`);
  process.exit(1);
}
if (hianyzik.length) console.warn(`Figyelem: előnézeti mód (noindex). Élesítés előtt kitöltendő: ${hianyzik.join(', ')}.`);

// A sitemap oldalankénti dátumához megjegyezzük a mostani (előző építésű) oldalakat, mielőtt a mappa törlődik
const regiOldalak = new Map();
if (!elonezet && existsSync(join(KI, 'sitemap.xml'))) {
  for (const [, loc, datum] of readFileSync(join(KI, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)) {
    const ut = loc.replace(cfg.domain + '/', '');
    const f = join(KI, ut, 'index.html');
    if (existsSync(f)) regiOldalak.set(ut, { html: readFileSync(f, 'utf8'), datum });
  }
}

rmSync(KI, { recursive: true, force: true });
mkdirSync(join(KI, 'assets/js'), { recursive: true });

// Statikus fájlok: CSS, betűk, JS (a .mjs modulok .js-ként, hogy minden tárhely jó MIME-típussal adja)
cpSync(join(GYOKER, 'forras/fonts'), join(KI, 'assets/fonts'), { recursive: true });
let css = readFileSync(join(GYOKER, 'forras/css/style.css'), 'utf8');
// Előnézetben a betűk a CSS-be ágyazva, hogy szigorú tartalombiztonsági szabályú tárhelyen is megjelenjenek
if (elonezet) css = css.replace(/url\(fonts\/([\w.-]+\.woff2)\)/g, (m, f) => `url(data:font/woff2;base64,${readFileSync(join(GYOKER, 'forras/fonts', f)).toString('base64')})`);
writeFileSync(join(KI, 'assets/style.css'), css);
// A JavaScript-modulok egymást is verziószámmal töltik be: a Cloudflare a böngészőben órákig gyorsítótárazza a fájlokat,
// és enélkül egy új app.js a régi szamitas.js-t kaphatná (2026. november 6-án így állt le két új kalkulátor).
const JS = ['szamitas', 'megjelenites', 'app'];
const jsNyers = Object.fromEntries(JS.map((f) => [f, readFileSync(join(GYOKER, `forras/js/${f}.mjs`), 'utf8')]));
const jsOssz = JS.map((f) => jsNyers[f]).join('');
const jsVerzio = createHash('sha1').update(jsOssz).digest('hex').slice(0, 8);
for (const f of JS) writeFileSync(join(KI, `assets/js/${f}.js`), jsNyers[f].replace(/from '\.\/(\w+)\.mjs'/g, `from './$1.js?v=${jsVerzio}'`));
// Az űrlapkártya rozettája külön fájlban: egyszer töltődik le, és minden oldal a gyorsítótárból veszi.
writeFileSync(join(KI, 'assets/alaprajz.svg'), alaprajzJel());
const verzio = createHash('sha1').update(css + jsOssz).digest('hex').slice(0, 8);
if (existsSync(join(GYOKER, 'forras/kepek'))) for (const f of readdirSync(join(GYOKER, 'forras/kepek'))) cpSync(join(GYOKER, 'forras/kepek', f), join(KI, f === 'og.png' ? 'assets/og.png' : f));

const k = { cfg, adat, ma, ev, elonezet, verzio };
const oldalak = [
  ['', O.fooldal(k)],
  [O.ILLETEK_UT, O.illetekOldal(k)],
  [O.HITEL_UT, O.hitelkepessegOldal(k)],
  [O.WEKERLE_UT, O.wekerleOldal(k)],
  [O.ELOT_UT, O.elotorlesztesOldal(k)],
  [O.VALTAS_UT, O.lakasvaltasOldal(k)],
  [O.ELADAS_UT, O.eladasOldal(k)],
  [O.KIADAS_UT, O.kiadasOldal(k)],
  [O.HOZAM_UT, O.hozamOldal(k)],
  [O.EMELES_UT, O.emelesOldal(k)],
  [O.INGYENES_UT, O.ingyenesOldal(k)],
  [O.HASZON_UT, O.haszonelvezetOldal(k)],
  ['forrasok/', O.forrasokOldal(k)],
  ['rolunk/', O.rolunkOldal(k)],
  ['impresszum/', O.impresszumOldal(k)],
  ['adatvedelem/', O.adatvedelemOldal(k)],
];
for (const [ut, html] of oldalak) {
  mkdirSync(join(KI, ut), { recursive: true });
  writeFileSync(join(KI, ut, 'index.html'), html);
}
writeFileSync(join(KI, '404.html'), O.nemTalalhatoOldal(k));
// A mérő végpont (functions/api/meres.js) csak ezekre az oldalakra számol
if (!elonezet) {
  mkdirSync(join(GYOKER, 'kozos'), { recursive: true });
  writeFileSync(join(GYOKER, 'kozos/utak.js'), `// Az oldalak listája a mérő végpontnak. Az epit.mjs írja, kézzel ne szerkeszd.\nexport const UTAK = ${JSON.stringify(oldalak.map(([ut]) => ut))};\n`);
}

if (!elonezet) {
  // Munkaverzióban (eles: false) a robots.txt engedi a bejárást, hogy a keresők lássák a noindex jelzést,
  // de nem ad meg oldaltérképet. A noindex a HTML-ben és fejlécben is ott van, minden fájlra.
  // Élesben minden kereső- és AI-robot számára nyitott (a ceevio mintájára, név szerint is felsorolva).
  const ROBOTOK = ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'Claude-SearchBot', 'Claude-User', 'ClaudeBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Googlebot', 'Bingbot', 'Applebot'];
  // IndexNow: a kulcsfájllal igazoljuk a Bingnek, hogy a domain a miénk (lásd .github/workflows/indexnow.yml)
  if (cfg.eles && cfg.indexnow_kulcs) writeFileSync(join(KI, `${cfg.indexnow_kulcs}.txt`), cfg.indexnow_kulcs);
  writeFileSync(join(KI, 'robots.txt'), cfg.eles
    ? `# ${cfg.marka}: minden kereső- és AI-robot számára nyitott.\nUser-agent: *\nAllow: /\n\n${ROBOTOK.map((r) => `User-agent: ${r}\nAllow: /\n`).join('\n')}\nSitemap: ${cfg.domain}/sitemap.xml\n`
    : `# Munkaverzió: egyetlen oldal se kerüljön keresőbe.\nUser-agent: *\nAllow: /\n`);
  // A lastmod oldalanként csak akkor lesz mai, ha az oldal tartalma tényleg változott (a minden oldalon
  // szereplő ellenőrzési dátumot nem számítjuk változásnak, különben a Google figyelmen kívül hagyná a dátumot).
  // A noindex oldalak (Az autóm) és az impresszum nem kerülnek bele.
  const urlek = oldalak
    .filter(([ut, html]) => ut !== 'impresszum/' && !/<meta name="robots" content="noindex/.test(html))
    .map(([ut, html]) => `<url><loc>${cfg.domain}/${ut}</loc><lastmod>${lastmodDontes(regiOldalak.get(ut)?.html, html, regiOldalak.get(ut)?.datum, ma)}</lastmod></url>`).join('\n');
  // Gépi adatcsatorna (JSON): a szabályok forrással és dátummal
  mkdirSync(join(KI, O.JSON_UT), { recursive: true });
  for (const [f, o] of Object.entries(O.adatJsonok(adat, cfg))) writeFileSync(join(KI, O.JSON_UT, f), `${JSON.stringify(o, null, 2)}\n`);
  if (cfg.eles) writeFileSync(join(KI, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlek}\n</urlset>\n`);
  writeFileSync(join(KI, '_headers'), `# Biztonsági fejlécek minden oldalra
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  X-Frame-Options: SAMEORIGIN
  Cross-Origin-Opener-Policy: same-origin
${cfg.eles ? '' : '  X-Robots-Tag: noindex, nofollow, noarchive\n'}
# Az adatcsatorna (JSON) bármely oldalról lekérhető; egy óráig gyorsítótárazható
/adatok/v1/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600
  Content-Type: application/json; charset=utf-8

# A betűk és a verziózott fájlok sokáig gyorsítótárazhatók
/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/assets/js/*
  Cache-Control: public, max-age=31536000, immutable
/assets/style.css
  Cache-Control: public, max-age=31536000, immutable

${/\.pages\.dev$/.test(new URL(cfg.domain).host) ? '' : `# A Cloudflare-címek (pages.dev és az előnézetek) ne kerüljenek a keresőkbe: csak a saját domain
https://:project.pages.dev/*
  X-Robots-Tag: noindex
https://:version.:project.pages.dev/*
  X-Robots-Tag: noindex
`}`);
  // A szöveges térkép az AI-asszisztenseknek: ugyanazok a csoportok és ugyanaz a sorrend, mint a főoldalon.
  const LLMS = {
    'mennyi-lakashitelt-kaphatok/': `felvehető lakáshitel az MNB 2026-os szabályai szerint: JTM 25–60% a jövedelemtől (800 000 Ft-os küszöb) és a kamatperiódustól függően, HFM 80% (első lakásnál 90%), összevetve a Wekerle Plusszal`,
    'elotorlesztes-kalkulator/': `lakáshitel előtörlesztése: kamatmegtakarítás rövidebb futamidővel vagy kisebb törlesztővel, az előtörlesztési díj után`,
    'lakas-befektetes-hozam-kalkulator/': `kiadásra vett lakás bruttó és nettó hozama illetékkel, felújítással, üres hónapokkal, költségekkel és szja-val`,
    'berleti-dij-emeles-inflacio/': `bérleti díj emelése a KSH előző évi átlagos inflációjával (${Object.entries(adat.inflacio.evek).map(([e, x]) => `${e}: ${String(x.szazalek).replace('.', ',')}%`).join(', ')})`,
    'oroklesi-ajandekozasi-illetek-kalkulator/': `öröklési és ajándékozási illeték: lakásnál 9%, más vagyonnál 18%, egyenes ági rokon, házastárs és testvér között mentes; tiszta érték terhekkel és haszonélvezettel`,
    'haszonelvezeti-jog-erteke/': `a haszonélvezet értéke az Itv. 72. § szerint: a forgalmi érték huszada az életkor szerinti szorzóval (10, 8, 6, 4), a csupasz tulajdon, és az illeték vételnél és lemondáskor`,
    'vagyonszerzesi-illetek-kalkulator/': `lakásvásárlás illetéke (4%) és minden kedvezmény: cserét pótló vétel 5 éven belüli eladással, új lakás vállalkozótól, 35 év alatti első lakásszerző, CSOK Plusz, egyenes ági rokon; a legkedvezőbb kiválasztásával`,
    'wekerle-plusz-kalkulator/': `a Wekerle Plusz hitel feltételei a 298/2026. Korm. rendelet paragrafusaival (18–45 év, 50 millió forint, 3% új és 5% használt lakásra, ár- és négyzetméterár-korlát), havi törlesztő és a támogatás értéke`,
    'lakasvaltas-kalkulator/': `eladás és vétel egy lapon: az eladás szja-ja, a régi hitel, az illeték a cserét pótló kedvezménnyel, és mennyi hitel kell az új lakáshoz`,
    'lakaskiadas-ado-kalkulator/': `lakáskiadás szja-ja: 10% költséghányad vagy tételes elszámolás, a döntési pont, negyedéves adóelőleg és bevallás naptárfájlban`,
    'ingatlaneladas-szja-kalkulator/': `az eladott lakás, ház vagy telek személyi jövedelemadója a szerzés és az eladás évéből, az elszámolható költségekkel; mikortól adómentes, és meddig kell bevallani`,
    'forrasok/': `minden szabály jogszabályhelye, forrása és az ellenőrzés napja`,
    'rolunk/': `független, ingyenes, forrással; mi hivatalos, mi saját adat, mi becslés`,
  };
  const sor = ([u, n, , teljes]) => `- [${teljes || n}](${cfg.domain}/${u}): ${LLMS[u]}`;
  writeFileSync(join(KI, 'llms.txt'), `# ${cfg.marka}

> ${M.nevelo(cfg.marka).replace(/^a/, 'A')} ${cfg.marka} független, ingyenes magyar oldal a lakásvásárlás, a lakáseladás és a lakáskiadás költségeiről: vagyonszerzési illeték, ingatlaneladás személyi jövedelemadója, lakáskiadás adója, kamattámogatott hitel. Minden szabálynál ott a jogszabályhely, a forrás és az ellenőrzés napja. Nem hatóság és nem hitelközvetítő. Legutóbbi ellenőrzés: ${M.datumHu(adat.allapot.utolso_ellenorzes)}

${CSOPORTOK.map((cs) => `## ${cs.cim}\n\n${cs.bevezeto}\n\n${cs.elemek.map(sor).join('\n')}`).join('\n\n')}

## Gépi adatok

- [JSON-adatcsatorna](${cfg.domain}/adatok/v1/index.json): a szabályok gépi formában, forrással és dátummal; regisztráció és kulcs nélkül, CC BY 4.0

## Az oldalról

- [Rólunk és szerkesztői elvek](${cfg.domain}/rolunk/): ${LLMS['rolunk/'] || 'független, ingyenes, forrással'}
`);
}

console.log(`Kész: ${oldalak.length + 1} oldal → ${KI.replace(GYOKER + '/', '')} (dátum: ${ma}, verzió: ${verzio})`);
