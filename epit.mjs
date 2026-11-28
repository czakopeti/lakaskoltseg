// Az oldal felépítése: node epit.mjs            → web/ (éles, Cloudflare Pages ezt szolgálja ki)
//                      node epit.mjs --elonezet → elonezet/ (relatív linkek, bármilyen tárhelyen vagy fájlként is megy)
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { betoltAdat, olvas, maBudapest, GYOKER } from './forras/adat.mjs';
import { lastmodDontes, CSOPORTOK } from './forras/sablon.mjs';
import { xlsx, csv } from './forras/xlsx.mjs';
import * as O from './forras/oldalak.mjs';
import * as T from './forras/telepulesek.mjs';
import * as M from './forras/js/megjelenites.mjs';
import * as S from './forras/js/szamitas.mjs';

const elonezet = process.argv.includes('--elonezet');
const KI = join(GYOKER, elonezet ? 'elonezet' : 'web');
const cfg = olvas('config.json');
// Az előnézet (GitHub Pages) a saját címét írja a kanonikus címbe és a strukturált adatokba, hogy ne mutasson nem élő domainre
if (process.argv.includes('--elonezet') && process.env.ELONEZET_DOMAIN) cfg.domain = process.env.ELONEZET_DOMAIN.replace(/\/+$/, '');
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
const JS = ['szamitas', 'megjelenites', 'app', 'terkep', 'ertek'];
const jsNyers = Object.fromEntries(JS.map((f) => [f, readFileSync(join(GYOKER, `forras/js/${f}.mjs`), 'utf8')]));
const jsOssz = JS.map((f) => jsNyers[f]).join('');
const jsVerzio = createHash('sha1').update(jsOssz).digest('hex').slice(0, 8);
for (const f of JS) writeFileSync(join(KI, `assets/js/${f}.js`), jsNyers[f].replace(/from '\.\/(\w+)\.mjs'/g, `from './$1.js?v=${jsVerzio}'`));
const verzio = createHash('sha1').update(css + jsOssz).digest('hex').slice(0, 8);
// Az egyedi lakásárak szóródása (a „Mennyit ér a lakásom?” sávjához), az utcai és települési átlagokból
const utcakOssz = Object.fromEntries(readdirSync(join(GYOKER, 'data/utcak')).map((f) => [f.replace('.json', ''), JSON.parse(readFileSync(join(GYOKER, 'data/utcak', f), 'utf8'))]));
adat.arSzoras = S.arSzoras(adat.arak, utcakOssz);
const kerek = (o) => JSON.parse(JSON.stringify(o, (key, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 10000) / 10000 : v)));
// A település- és vármegyeoldalak listája (melyiknek van saját oldala)
const arLista = T.oldalLista(adat);
let adatV = '';
// A lakásár-térkép adatai: árak, határok, utcák vármegyénként (tömör JSON, a böngésző tölti be)
{
  const ki = join(KI, O.ARAK_ADAT);
  mkdirSync(join(ki, 'utcak'), { recursive: true });
  const { forras, ellenorizve, evek, megyek, egysegek } = adat.arak;
  const becsles = { cimke: null, szorzok: {} };
  // A térképen 2 évig visszamegyünk a legutóbbi valódi árig; ilyenkor a szorzó mellett az alapév sorszáma is megy: [szorzó, évIndex]
  for (const [kod, u] of Object.entries(egysegek)) {
    const b = S.arBecsles(adat, u, 'o', { visszaEv: 2 });
    if (b) { becsles.cimke = b.cimke; const sz = Math.round(b.szorzo * 1000) / 1000; becsles.szorzok[kod] = b.regebbi ? [sz, b.alapIx] : sz; }
  }
  const megfiz = { m2: S.MEGFIZ_M2, forras: adat.kereset.forras, ertek: {} };
  for (const [kod, u] of Object.entries(egysegek)) {
    const s = evek.map((ev) => { const x = S.megfizethetoseg(adat, kod, u, ev); return x ? Math.round(x.evek * 10) / 10 : null; });
    if (s.some((v) => v != null)) megfiz.ertek[kod] = s;
    // mára: a becsült mai ár a legfrissebb (akár előzetes) keresettel
    const ma = S.megfizethetosegMa(adat, kod, u);
    if (ma) (megfiz.ma ??= {})[kod] = Math.round(ma.evek * 10) / 10;
  }
  // Az éves jelentés letölthető táblázata
  const jsor = T.jelentesSorok(adat);
  writeFileSync(join(ki, `lakasarak-${evek.at(-1)}.csv`), csv([['Település vagy kerület', 'Vármegye', 'KSH-kód', `Átlagár ${evek.at(-1)} (Ft/m²)`, `Adásvétel ${evek.at(-1)}`, 'Változás egy év alatt (%)', 'Évi átlagos változás 3 év alatt (%)', 'Változás az első év óta (%)', 'Első év', `Nettó átlagkereset ${evek.at(-1)} (Ft/hó)`, `${S.MEGFIZ_M2} m² ára évnyi nettó keresetben`, 'Becsült mai ár (Ft/m²)', 'Becslés időpontja'],
    ...jsor.map((x) => [x.n, x.megye, x.kod, x.ar * 1000, x.db, x.valt1 == null ? null : Math.round(x.valt1 * 10) / 10, x.valt3 == null ? null : Math.round(x.valt3 * 10) / 10, x.valtKezd == null ? null : Math.round(x.valtKezd), x.kezdEv, x.kereset, x.evek == null ? null : Math.round(x.evek * 10) / 10, x.becsles == null ? null : x.becsles * 1000, x.becslesCimke])]));
  const arakSzoveg = JSON.stringify({ forras, ellenorizve, evek, megyek, egysegek, oldalak: Object.fromEntries(arLista.egysegek), becsles, megfiz, szoras: kerek(adat.arSzoras) });
  writeFileSync(join(ki, 'arak.json'), arakSzoveg);
  // Lakásár és jövedelem: az országos sor és a vármegyei megfizethetőség egy fájlban
  if (adat.arjov) {
    const aj = adat.arjov, mm = T.megyeMegfiz(adat);
    writeFileSync(join(ki, 'ar-jovedelem.csv'), csv([['Terület', 'Mutató', ...aj.evek.map(String)],
      ['Magyarország', 'Lakásár és háztartási jövedelem aránya (Eurostat tipsho60, hosszú távú átlag = 100)', ...aj.lt],
      ...(mm ? mm.sorok.map((s) => [s.nev, `Hány év nettó átlagkereset egy ${S.MEGFIZ_M2} m²-es lakás (KSH)`, ...aj.evek.map((e) => { const i = mm.evek.indexOf(e); return i < 0 || s.ertek[i] == null ? null : Math.round(s.ertek[i] * 10) / 10; })]) : [])]));
  }
  // A becslőnek: minden település (KSH Helységnévtár) és irányítószám. Ahol nincs elég friss adat a becsléshez,
  // ott a legközelebbi három település, ahol van (a térkép-alakzatok középpontja szerint).
  let telepSzoveg = '';
  if (existsSync(join(GYOKER, 'data/hnt.json'))) {
    const hnt = JSON.parse(readFileSync(join(GYOKER, 'data/hnt.json'), 'utf8')).telepulesek;
    const geo = JSON.parse(readFileSync(join(GYOKER, 'forras/geo/orszag.json'), 'utf8'));
    const kozep = new Map(geo.u.map(([k, , b]) => [k, [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]]));
    const vanAdat = (k) => egysegek[k] && S.frissAtlag(egysegek[k].s.o || [], egysegek[k].s.od || [], egysegek[k].s.o || []) != null;
    const jok = [...kozep.keys()].filter((k) => vanAdat(k) && egysegek[k].m !== '01');
    const szomszed = (k) => {
      const c = kozep.get(k);
      if (!c) return [];
      return jok.map((j) => [j, (kozep.get(j)[0] - c[0]) ** 2 + (kozep.get(j)[1] - c[1]) ** 2]).sort((x, y) => x[1] - y[1]).slice(0, 3).map(([j]) => j);
    };
    const t = {}, irsz = {};
    for (const [k, [n, m, , isz]] of Object.entries(hnt)) {
      for (const z of isz) (irsz[z] ??= []).push(k);
      if (!vanAdat(k)) t[k] = [n, m, szomszed(k)];
    }
    telepSzoveg = JSON.stringify({ forras: { nev: 'KSH Helységnévtár', url: 'https://www.ksh.hu/apps/hntr.main' }, nincs: t, irsz });
    writeFileSync(join(ki, 'telepulesek.json'), telepSzoveg);
  }
  adatV = createHash('sha1').update(arakSzoveg + JSON.stringify(utcakOssz) + telepSzoveg).digest('hex').slice(0, 8);
  for (const f of ['orszag', 'budapest']) cpSync(join(GYOKER, `forras/geo/${f}.json`), join(ki, `${f}.json`));
  for (const f of readdirSync(join(GYOKER, 'data/utcak'))) cpSync(join(GYOKER, 'data/utcak', f), join(ki, 'utcak', f));
}
if (existsSync(join(GYOKER, 'forras/kepek'))) for (const f of readdirSync(join(GYOKER, 'forras/kepek'))) cpSync(join(GYOKER, 'forras/kepek', f), join(KI, f === 'og.png' ? 'assets/og.png' : f));

const k = { cfg, adat, ma, ev, elonezet, verzio, arLista, adatV };
const oldalak = [
  ['', O.fooldal(k)],
  [O.INDULO_UT, O.induloOldal(k)],
  [O.ILLETEK_UT, O.illetekOldal(k)],
  [O.HITEL_UT, O.hitelkepessegOldal(k)],
  [O.WEKERLE_UT, O.wekerleOldal(k)],
  [O.CSOK_UT, O.csokOldal(k)],
  [O.MENETE_UT, O.meneteOldal(k)],
  [O.TAMOGATAS_UT, O.tamogatasOldal(k)],
  [O.ARAK_UT, O.arakOldal(k)],
  [O.FLIP_UT, O.flipOldal(k)],
  [T.JELENTES_UT, T.jelentesOldal(k, arLista)],
  [T.ERTEK_UT, T.ertekOldal(k)],
  [T.METRO_UT, T.metroOldal(k)],
  [T.ARJOV_UT, T.arJovOldal(k)],
  ...[...arLista.megyek.keys()].map((m) => [arLista.megyek.get(m), T.megyeOldal(k, m, arLista)]),
  ...[...arLista.egysegek.keys()].map((kod) => [arLista.egysegek.get(kod), T.telepulesOldal(k, kod, arLista)]),
  [O.LTP_UT, O.lakastakarekOldal(k)],
  [O.ELOT_UT, O.elotorlesztesOldal(k)],
  [O.VALTAS_UT, O.lakasvaltasOldal(k)],
  [O.ELADAS_UT, O.eladasOldal(k)],
  [O.KIADAS_UT, O.kiadasOldal(k)],
  [O.HOZAM_UT, O.hozamOldal(k)],
  [O.ROVID_UT, O.rovidtavOldal(k)],
  [O.EMELES_UT, O.emelesOldal(k)],
  [O.INGYENES_UT, O.ingyenesOldal(k)],
  [O.HASZON_UT, O.haszonelvezetOldal(k)],
  [O.BERLES_UT, O.berlesVetelOldal(k)],
  ['forrasok/', O.forrasokOldal(k)],
  [O.ADATOK_UT, O.adatokOldal(k)],
  [O.BEAGYAZAS_UT, O.beagyazasOldal(k)],
  ['rolunk/', O.rolunkOldal(k)],
  ['impresszum/', O.impresszumOldal(k)],
  ['adatvedelem/', O.adatvedelemOldal(k)],
];
for (const [ut, html] of oldalak) {
  mkdirSync(join(KI, ut), { recursive: true });
  writeFileSync(join(KI, ut, 'index.html'), html);
}
writeFileSync(join(KI, '404.html'), O.nemTalalhatoOldal(k));
// Beágyazható kalkulátorok (iframe-be, noindex) és a letölthető adatok (Excel, CSV)
for (const [ut, html] of O.beagyazottOldalak(k)) {
  mkdirSync(join(KI, ut), { recursive: true });
  writeFileSync(join(KI, ut, 'index.html'), html);
}
{
  const tablak = O.adatTablak(adat);
  mkdirSync(join(KI, O.ADATOK_UT), { recursive: true });
  for (const t of tablak) writeFileSync(join(KI, O.ADATOK_UT, `${t.fajl}.csv`), csv(t.sorok));
  if (elonezet) { mkdirSync(join(KI, O.JSON_UT), { recursive: true }); for (const [f, o] of Object.entries(O.adatJsonok(adat, cfg))) writeFileSync(join(KI, O.JSON_UT, f), `${JSON.stringify(o, null, 2)}\n`); }
  writeFileSync(join(KI, O.ADATOK_UT, 'ingatlanmerleg-adatok.xlsx'), xlsx([
    { nev: 'Olvass el', sorok: [['Ingatlanmérleg: adatok'], ['Forrás', `${cfg.domain}/${O.ADATOK_UT}`], ['Készült', ma], ['Felhasználás', 'CC BY 4.0, a forrás megjelölésével: „Forrás: KSH, Ingatlanmérleg”'], [], ['Munkalap', 'Tartalom', 'Forrás'], ...tablak.map((t) => [t.nev, t.cim, t.forras])], szelessegek: [22, 80, 40] },
    ...tablak.map((t) => ({ nev: t.nev, sorok: t.sorok, szelessegek: t.szelessegek })),
  ]));
}
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
  Cross-Origin-Resource-Policy: same-site
  Strict-Transport-Security: max-age=31536000; includeSubDomains
${cfg.eles ? '' : '  X-Robots-Tag: noindex, nofollow, noarchive\n'}
# A beágyazható kalkulátorok bármely oldalon megjelenhetnek iframe-ben
/beagyaz/*
  ! X-Frame-Options
  ! Cross-Origin-Resource-Policy
  Content-Security-Policy: frame-ancestors *

# A letölthető CSV-k bármely oldalról és táblázatkezelőből lekérhetők (Google Táblázat, Excel), egy óráig gyorsítótárazhatók
/adatok/*.csv
  ! Cross-Origin-Resource-Policy
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600
  Content-Type: text/csv; charset=utf-8

# Az adatcsatorna (JSON) bármely oldalról lekérhető; egy óráig gyorsítótárazható
/adatok/v1/*
  ! Cross-Origin-Resource-Policy
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600
  Content-Type: application/json; charset=utf-8

# A lakásár-térkép adatai: bárhonnan lekérhetők, egy napig gyorsítótárazhatók
/adatok/lakasarak/*
  ! Cross-Origin-Resource-Policy
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=86400
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
  // Biztonsági kapcsolat (RFC 9116). A lejárat minden építéskor egy évvel későbbre tolódik, a heti frissítés miatt sosem jár le.
  if (cfg.eles && cfg.kapcsolat_email) {
    mkdirSync(join(KI, '.well-known'), { recursive: true });
    const lejar = new Date(Date.parse(`${ma}T00:00:00Z`) + 365 * 864e5).toISOString().replace(/\.\d+Z$/, 'Z');
    writeFileSync(join(KI, '.well-known/security.txt'), `Contact: mailto:${cfg.kapcsolat_email}\nExpires: ${lejar}\nPreferred-Languages: hu, en\nCanonical: ${cfg.domain}/.well-known/security.txt\n`);
  }
  // A szöveges térkép az AI-asszisztenseknek: ugyanazok a csoportok és ugyanaz a sorrend, mint a főoldalon.
  const LLMS = {
    'mennyi-lakashitelt-kaphatok/': `felvehető lakáshitel az MNB 2026-os szabályai szerint: JTM 25–60% a jövedelemtől (800 000 Ft-os küszöb) és a kamatperiódustól függően, HFM 80% (első lakásnál 90%), összevetve a Wekerle Plusszal`,
    'airbnb-vagy-hosszu-tavu-kiadas/': `rövid távú (Airbnb, Booking) vagy hosszú távú lakáskiadás adó után: tételes átalányadó lakószobánként (Budapesten 150 000, máshol 38 400 Ft/év), 10% költséghányad vagy tételes elszámolás 15% szja és 13% szocho mellett, 5% áfa 20 millió forint felett, 4% turizmusfejlesztési hozzájárulás, platformjutalék, takarítás, rezsi; fordulópont foglalt éjszakában; a budapesti moratórium és a kerületi tilalmak`,
    'lakasvasarlas-koltsegei-kalkulator/': `mennyi saját pénz kell egy lakás megvételéhez: önerő (HFM 80%, első lakásnál 90%), illeték a kedvezményekkel, ügyvédi díj, földhivatal (10 600 Ft, jelzálog 20 000 Ft), értékbecslés, közjegyzői díj a díjszabás sávjai szerint, folyósítási díj; időrendben, a megtakarításból hiányzó összeggel`,
    'alberlet-vagy-lakasvasarlas-kalkulator/': `albérlet vagy hitelből vétel: a vagyon N év múlva havi modellel, illetékkel és mellékköltségekkel, karbantartással, a bérlő pénze Prémium Magyar Állampapírban; három forgatókönyv a lakásárakra (infláció ±3 százalékpont), és melyik évben kerül előre a vétel`,
    'wekerle-plusz-lakastakarek-kalkulator/': `Wekerle Plusz lakástakarék a T/1114. törvényjavaslat szerint (2027. január 1-jétől, még nincs elfogadva): állami támogatás az első 5 évben a befizetés 10%-a, legfeljebb 120 000 Ft/év, a 6. évtől 20%, legfeljebb 240 000 Ft/év, legalább 3% kamat az első 10 évben évi 1,2 millió Ft befizetésig, legalább 5 év, csak lakáscélra (vásárlás, építés, energetikai korszerűsítés, akadálymentesítés); összevetés Prémium Magyar Állampapírral`,
    'elotorlesztes-kalkulator/': `lakáshitel előtörlesztése: kamatmegtakarítás rövidebb futamidővel vagy kisebb törlesztővel, az előtörlesztési díj után`,
    'lakas-befektetes-hozam-kalkulator/': `kiadásra vett lakás bruttó és nettó hozama illetékkel, felújítással, üres hónapokkal, költségekkel és szja-val`,
    'berleti-dij-emeles-inflacio/': `bérleti díj emelése a KSH előző évi átlagos inflációjával (${Object.entries(adat.inflacio.evek).map(([e, x]) => `${e}: ${String(x.szazalek).replace('.', ',')}%`).join(', ')})`,
    'oroklesi-ajandekozasi-illetek-kalkulator/': `öröklési és ajándékozási illeték: lakásnál 9%, más vagyonnál 18%, egyenes ági rokon, házastárs és testvér között mentes; tiszta érték terhekkel és haszonélvezettel`,
    'haszonelvezeti-jog-erteke/': `a haszonélvezet értéke az Itv. 72. § szerint: a forgalmi érték huszada az életkor szerinti szorzóval (10, 8, 6, 4), a csupasz tulajdon, és az illeték vételnél és lemondáskor`,
    'vagyonszerzesi-illetek-kalkulator/': `lakásvásárlás illetéke (4%) és minden kedvezmény: cserét pótló vétel 5 éven belüli eladással, új lakás vállalkozótól, 35 év alatti első lakásszerző, CSOK Plusz, egyenes ági rokon; a legkedvezőbb kiválasztásával`,
    'wekerle-plusz-kalkulator/': `a Wekerle Plusz hitel feltételei a 298/2026. Korm. rendelet paragrafusaival (18–45 év, 50 millió forint, 3% új és 5% használt lakásra, ár- és négyzetméterár-korlát), havi törlesztő és a támogatás értéke`,
    'csok-plusz-kalkulator/': (() => { const c = (k) => adat.szabalyok.temak.find((t) => t.id === 'csok_plusz').tetelek.find((x) => x.kulcs === k).ertek; const o = c('osszeg'), ka = c('kamat'), ve = c('vetelar'); const mi = (x) => M.fmt(x / 1e6); return `a CSOK Plusz hitel az 518/2023. Korm. rendelet paragrafusaival: ${mi(o.egy_ft)}, ${mi(o.ketto_ft)} vagy ${mi(o.harom_ft)} millió forint a meglévő és vállalt gyerekek száma szerint, legfeljebb ${ka.szazalek}% kamat ${ka.tamogatas_max_ev} évig, az első évben csak kamat, ${c('hazaspar').feleseg_max_kor} év alatti feleség, árkorlát ${mi(ve.elso_lakas_ft)} és ${mi(ve.egyeb_ft)} millió forint, ${mi(c('tartozascsokkentes').ft)} millió forint tartozáscsökkentés a második és minden további gyerek után, törlesztési szünet, és mi történik, ha nem születik meg a vállalt gyerek`; })(),
    'lakasvaltas-kalkulator/': `eladás és vétel egy lapon: az eladás szja-ja, a régi hitel, az illeték a cserét pótló kedvezménnyel, és mennyi hitel kell az új lakáshoz`,
    'lakaskiadas-ado-kalkulator/': `lakáskiadás szja-ja: 10% költséghányad vagy tételes elszámolás, a döntési pont, negyedéves adóelőleg és bevallás naptárfájlban`,
    'ingatlaneladas-szja-kalkulator/': `az eladott lakás, ház vagy telek személyi jövedelemadója a szerzés és az eladás évéből, az elszámolható költségekkel; mikortól adómentes, és meddig kell bevallani`,
    'lakasvasarlas-menete/': `a lakásvásárlás lépései sorrendben (foglaló és adásvételi szerződés, hitelkérelem, értékbecslés, közjegyző, földhivatal, birtokba adás, illeték), minden lépésnél a díjjal és a határidővel, egy 50 millió forintos minta számaival`,
    'flipping-kalkulator/': `lakás vétele, felújítása és eladása: illeték, ügyvéd, hitel díjai és kamata, rezsi, közvetítő és az ingatlaneladás szja-ja (Szja tv. 62. §, a nyereség adóköteles része évenként), a nullszaldós eladási ár, és mennyi lenne az adó, ha később adnád el`,
    'mennyit-er-a-lakasom/': `becsült mai érték egy lakásra vagy házra sávval (a hasonló lakások fele és tízből nyolc milyen áron kel el), az utca vagy a település valódi eladási áraiból (KSH Ingatlanadattár), a KSH negyedéves árindexével a legfrissebb negyedévre hozva`,
    'lakasarak/ar-jovedelem/': `a lakásárak és a háztartási jövedelmek aránya Magyarországon 2000-től (Eurostat, hosszú távú átlag = 100), magyarázattal, és hány év nettó átlagkereset egy 50 m²-es lakás vármegyénként és Budapesten évenként és ma (KSH)`,
    'lakasarak/metro/': `a budapesti metró- és HÉV-megállók 500 méteres körzetének átlagos négyzetméterára megállónként, vonalanként ábrán, a kerületi átlaghoz mért különbséggel (KSH utcai eladási árak, OpenStreetMap megállók)`,
    'lakasarak/jelentes/': `éves jelentés a legutóbbi év valódi lakáseladásaiból: fő megállapítások, kvadráns (árszint és egyéves drágulás) Budapest kerületeiről és a városokról, megfizethetőség (hány évnyi nettó átlagkereset egy 50 m²-es lakás), legnagyobb drágulások és csökkenések, letölthető CSV`,
    'lakasarak/': `mai lakásárak becsléssel (a legutóbbi valódi eladási árak a KSH lakásárindexeivel a legfrissebb negyedévre hozva) és valódi lakáseladási árak (KSH Ingatlanadattár, NAV-illetékadatok) településenként, budapesti kerületenként és utcánként, ${adat.arak.evek[0]}–${adat.arak.evek.at(-1)}: átlagos négyzetméterár típusonként (társasház, panel, családi ház), adásvételek száma, drágulás, térképen évenkénti animációval; letölthető JSON`,
    'lakastamogatasok/': `a Wekerle Plusz és a CSOK Plusz egy táblázatban (kinek, mennyi, kamat, árkorlát, önerő, illeték, gyerekek után), és az illetékkedvezmények jogszabályhellyel`,
    'forrasok/': `minden szabály jogszabályhelye, forrása és az ellenőrzés napja`,
    'adatok/': `a KSH lakásárai településtípusonként és régiónként, az éves infláció és a szabályok Excelben, CSV-ben és JSON-ban, CC BY 4.0`,
    'beagyazas/': `ingyenes, beágyazható kalkulátorok más weboldalakra`,
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
