// Forrásfigyelő: minden forrásoldalt letölt, amelyre a data/szabalyok.json hivatkozik (és a data/figyelo.json külön listáját),
// a szövegéből kiválogatja a számot tartalmazó mondatokat (mérték, összeg, határidő, jogszabályhely), és ezeket veti össze a legutóbb látottakkal.
// Minden oldalt kétszer tölt le, és csak a mindkétszer szereplő mondatot nézi. A hirdetések, ajánlott cikkek és számlálók így nem adnak téves riasztást. Adatot NEM ír át: ha egy forrás megváltozott,
// jelentést ad (a workflow ebből GitHub-jegyet nyit), a szabályt ember vagy az ütemezett Claude-futás vizsgálja felül.
import { createHash } from 'node:crypto';
import { olvas, ir, maBudapest } from '../forras/adat.mjs';

/** A HTML látható szövege, szóközökre egyszerűsítve. A kihagy lista mintái (például változó dátumok) kimaradnak. */
export function szovegge(html, kihagy = []) {
  let t = String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;|&#\d+;/gi, ' ');
  for (const k of kihagy) t = t.replace(new RegExp(k, 'g'), ' ');
  return t.replace(/\s+/g, ' ').trim();
}
/** A figyelt szakasz: a tol és az ig jelző közti rész (ha meg van adva és megtalálható), különben az egész szöveg. */
export function szakasz(szoveg, tol = '', ig = '') {
  const a = tol ? szoveg.indexOf(tol) : 0;
  if (a < 0) return null;
  const b = ig ? szoveg.indexOf(ig, a + tol.length) : -1;
  return szoveg.slice(a, b > a ? b : undefined);
}
export const lenyomat = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// A szabályok szempontjából érdekes mondat: van benne szám, és mérték, összeg, idő vagy jogszabályhely.
// Reklám, felületi szöveg és hírfolyam („12 órája”, „Elolvasom 2026-11-18”, „Kapcsolódó cikkek”): ezek naponta változnak, a szabályhoz nincs közük.
const REKLAM = /(PROMÓCIÓ|Hirdetés|Szponzorált|THM.*Részletek|textbox_adv|-->|Ugrás a|Bejelentkezés|Belépés|Kattints|Megosztás|Feliratkoz|cookie|süti|Elolvasom|Tovább olvas|Kapcsolódó|Legfrissebb|Legolvasott|Népszerű|Ajánló|\b\d+\s*(perce|órája|napja|hete)\b|\b20\d\d-\d\d-\d\d\b|\s\/\s\S+\s\/\s)/i;
const TENY = /(%|százalék|forint|\bFt\b|§|millió|ezer|\bév|\bnap|hónap|határid|mérték|kamat)/i;
/** A szöveg „ténymondatai”: számot és mértéket tartalmazó mondatok, sorba rendezve, ismétlés nélkül. */
export function tenyek(szoveg) {
  // A felkiáltó és kérdő mondat többnyire ajánlott cikk címe vagy reklám, a szabályt kijelentő mondat írja le; a reklámblokkot is kihagyjuk.
  const m = szoveg.split(/(?<=[.!?;])\s+(?=[A-ZÁÉÍÓÖŐÚÜŰ0-9(„"])/u).map((x) => x.trim())
    .filter((x) => x.length >= 12 && x.length <= 400 && /\d/.test(x) && TENY.test(x) && !/[!?]$/.test(x) && !REKLAM.test(x));
  return [...new Set(m)].sort();
}
const rovid = (x) => lenyomat(x).slice(0, 10);
/** A mondatválogatás változata: ha a szabályai változnak, minden forrás csendben új alapot kap, téves riasztás nélkül. */
export const VALTOZAT = 5;

/** A figyelendő források: a szabályok forrásai (melyik szabály függ tőlük), és a külön felvett oldalak. */
export function forrasLista(szabalyok, kulon = []) {
  const m = new Map();
  for (const t of szabalyok.temak) for (const x of t.tetelek) {
    const e = m.get(x.forras.url) || { url: x.forras.url, nev: x.forras.nev, szabalyok: [], automata: true };
    e.szabalyok.push(`${t.id}.${x.kulcs}`);
    e.automata = e.automata && !!x.automata; // csak akkor, ha a forrás minden szabályát az önálló frissítő kezeli
    m.set(x.forras.url, e);
  }
  for (const k of kulon) { const e = m.get(k.url); m.set(k.url, { ...e, automata: false, ...k, szabalyok: [...new Set([...(e?.szabalyok || []), ...(k.szabalyok || [])])] }); }
  return [...m.values()];
}

/**
 * Egy forrás kiértékelése. elozo: a legutóbbi állapot ({ tenyek: [mondatlenyomatok], hossz }), html: a most letöltött oldal.
 * Eredmény: { allapot: 'uj' | 'valtozatlan' | 'valtozott' | 'gyanus', tenyek, hossz, ujMondatok, eltunt }
 * „gyanus”: a jelző eltűnt, vagy az oldal szövege túl rövid, vagy a ténymondatok fele eltűnt (hibaoldal, átszervezés).
 * Régi formátumú állapotnál (csak lenyomat) csendben új alapot veszünk fel.
 */
export function ertekel(forras, elozo, html) {
  // Több letöltésnél (ugyanaz az oldal kétszer) csak a mindkettőben szereplő mondat számít: a kérésenként változó reklám, ajánló és belépési sáv kiesik.
  const lapok = (Array.isArray(html) ? html : [html]).map((h) => szakasz(szovegge(h, forras.kihagy), forras.tol, forras.ig)).filter((x) => x != null && x.length >= 200);
  if (!lapok.length) {
    const sz = szakasz(szovegge(Array.isArray(html) ? html[0] : html, forras.kihagy), forras.tol, forras.ig);
    return { allapot: 'gyanus', ok: sz == null ? 'a figyelt szakasz jelzője nincs az oldalon' : 'az oldal szövege túl rövid' };
  }
  const halmazok = lapok.map((x) => tenyek(x));
  const t = halmazok[0].filter((m) => halmazok.every((h) => h.includes(m)));
  const most = { tenyek: t.map(rovid), hossz: Math.max(...lapok.map((x) => x.length)) };
  if (!elozo?.tenyek || elozo.v !== VALTOZAT) return { allapot: 'uj', ...most };
  const regi = new Set(elozo.tenyek), uj = new Set(most.tenyek);
  const ujMondatok = t.filter((x) => !regi.has(rovid(x)));
  const eltunt = elozo.tenyek.filter((h) => !uj.has(h)).length;
  if (!ujMondatok.length && !eltunt) return { allapot: 'valtozatlan', ...most };
  // Ha csak egy-két mondat tűnt el, és új nincs, a következő futásig várunk: ha akkor is hiányzik ugyanaz, szólunk.
  if (!ujMondatok.length && eltunt <= 2) {
    const hiany = elozo.tenyek.filter((h) => !uj.has(h)).sort().join(',');
    if (elozo.hiany !== hiany) return { allapot: 'valtozatlan', tenyek: elozo.tenyek, hossz: most.hossz, hiany };
  }
  if (elozo.tenyek.length >= 4 && eltunt > elozo.tenyek.length / 2) return { allapot: 'gyanus', ok: `a korábbi ${elozo.tenyek.length} ténymondatból ${eltunt} eltűnt (átszervezett vagy hibás oldal)` };
  return { allapot: 'valtozott', ...most, ujMondatok, eltunt };
}

/**
 * Tartós gond (letiltott vagy csak böngészőben megjelenő oldal): csak az első alkalommal jelentjük, utána hetente nem.
 * Visszaad: { jelent, allapot } – az allapot a figyelő állapotába kerül, a régi lenyomat megmarad.
 */
// A gond fajtája: a megszűnt oldal (404) külön, a többi letöltési hiba (tiltás, időtúllépés, hálózat) egy fajta, a gyanús válasz okonként.
export const gondFajta = (ok) => /HTTP 40[4]|HTTP 410/.test(ok) ? 'nincs' : /HTTP \d|fetch|timeout|abort|ECONN|ENOTFOUND|socket/i.test(ok) ? 'letoltes' : ok;
export function gondAllapot(elozo, okSzoveg, ma) {
  const ok = gondFajta(okSzoveg);
  // Ha ugyanez a gond az elmúlt 60 napban már volt (az oldal csak néha tilt le), nem szólunk újra.
  const nemregVolt = elozo?.utolsoGond === ok && elozo.utolsoGondNap && (Date.parse(ma) - Date.parse(elozo.utolsoGondNap)) / 864e5 <= 60;
  const jelent = elozo?.gond ? elozo.gond !== ok : !nemregVolt;
  return { jelent, allapot: { ...(elozo || {}), gond: ok, gondOta: elozo?.gond === ok ? elozo.gondOta : ma, utolsoGond: ok, utolsoGondNap: ma, ellenorizve: ma } };
}

async function letolt(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (forrasfigyelo; +https://github.com/czakopeti/lakaskoltseg)', 'accept-language': 'hu' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

/** Kétszer tölti le az oldalt, kis szünettel. Ha a második nem sikerül, az első is elég. */
async function ketszer(url, leto) {
  const a = await leto(url);
  await new Promise((r) => setTimeout(r, leto === letolt ? 1500 : 0));
  try { return [a, await leto(url)]; } catch { return [a]; }
}

/** Futtatás: frissíti a data/figyelo.json-t, és jelentést ír a szabványos kimenetre (JSON). */
export async function futtat({ leto = letolt } = {}) {
  const szabalyok = olvas('data/szabalyok.json');
  const f = olvas('data/figyelo.json');
  const ma = maBudapest();
  const jelentes = { ma, valtozott: [], gyanus: [], hiba: [], uj: [], valtozatlan: 0, tartos: 0 };
  for (const forras of forrasLista(szabalyok, f.kulon)) {
    const elozo = f.allapot[forras.url];
    const gond = (hova, ok) => {
      const g = gondAllapot(elozo, ok, ma);
      f.allapot[forras.url] = g.allapot;
      if (g.jelent) jelentes[hova].push({ url: forras.url, nev: forras.nev, szabalyok: forras.szabalyok, ok });
      else jelentes.tartos++;
    };
    try {
      const e = ertekel(forras, elozo, await ketszer(forras.url, leto));
      if (e.allapot === 'gyanus') { gond('gyanus', e.ok); continue; }
      // Amit az önálló frissítő (frissito/automata.mjs) kezel, arról nem kell jegy: ott a szám magától átáll, a gond külön jelentésbe megy
      if (e.allapot === 'valtozatlan' || (e.allapot === 'valtozott' && forras.automata)) jelentes.valtozatlan++;
      else jelentes[e.allapot].push({ url: forras.url, nev: forras.nev, szabalyok: forras.szabalyok, ok: e.ok, elozoLatva: elozo?.latva, ujMondatok: e.ujMondatok, eltunt: e.eltunt });
      // Változásnál az új lenyomatot rögzítjük, hogy ugyanarról egyszer szóljunk; a jegy őrzi, hogy felül kell vizsgálni.
      if (e.tenyek) f.allapot[forras.url] = { v: VALTOZAT, hossz: e.hossz, tenyek: e.tenyek, ...(e.hiany ? { hiany: e.hiany } : {}), latva: e.allapot === 'valtozatlan' ? elozo.latva : ma, ellenorizve: ma, ...(elozo?.utolsoGond ? { utolsoGond: elozo.utolsoGond, utolsoGondNap: elozo.utolsoGondNap } : {}) };
    } catch (err) {
      gond('hiba', String(err.message || err));
    }
  }
  // Már nem hivatkozott források kivezetése
  const elo = new Set(forrasLista(szabalyok, f.kulon).map((x) => x.url));
  for (const u of Object.keys(f.allapot)) if (!elo.has(u)) delete f.allapot[u];
  ir('data/figyelo.json', f);
  // Elavulás-őr: január 15-től kell lennie az előző évi átlagos inflációnak (a bérleti díj emelésének oldala ebből számol)
  const inf = olvas('data/inflacio.json');
  const elozoEv = String(Number(ma.slice(0, 4)) - 1);
  if (ma.slice(5) >= '01-15' && !inf.evek[elozoEv]) jelentes.hiba.push({ url: 'https://www.ksh.hu/', nev: `KSH: a ${elozoEv}. évi átlagos infláció még nincs a data/inflacio.json-ban`, ok: 'A KSH január közepén közli. Vedd fel forrással, és a bérleti díj oldala magától átáll.' });
  // A „legutóbbi ellenőrzés” csak akkor lép, ha minden forrást elértünk, és egyik sem változott
  if (!jelentes.valtozott.length && !jelentes.gyanus.length && !jelentes.hiba.length) {
    const a = olvas('data/allapot.json');
    a.utolso_ellenorzes = `${ma}T${new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
    ir('data/allapot.json', a);
  }
  return jelentes;
}

/** A jegy szövege a jelentésből (üres, ha nincs teendő). */
export function jegySzoveg(j) {
  const mondatok = (x) => (x.ujMondatok?.length ? `\n  Új vagy átírt mondat:${x.ujMondatok.slice(0, 8).map((m) => `\n  > ${m.slice(0, 300)}`).join('')}${x.ujMondatok.length > 8 ? `\n  (és még ${x.ujMondatok.length - 8})` : ''}` : '') + (x.eltunt ? `\n  Eltűnt mondat: ${x.eltunt}` : '');
  const sor = (x) => `- [${x.nev || x.url}](${x.url})${x.szabalyok?.length ? `\n  Érintett szabályok: ${x.szabalyok.map((s) => `\`${s}\``).join(', ')}` : ''}${x.ok ? `\n  Ok: ${x.ok}` : ''}${mondatok(x)}`;
  const r = [];
  if (j.valtozott.length) r.push(`## Megváltozott a forrás szövege\n\nNézd meg, változott-e a szabály. Ha igen, írd át a \`data/szabalyok.json\` tételét, ha nem, frissítsd az \`ellenorizve\` dátumát.\n\n${j.valtozott.map(sor).join('\n')}`);
  const tartos = 'Ugyanezt a gondot csak egyszer jelezzük. Ha marad, keress helyette letölthető forrást (lehetőleg a jogszabályt, a NAV-ot vagy a kibocsátót), vagy vedd fel a mögötte álló jogszabályt a `data/figyelo.json` kulon listájára.';
  if (j.gyanus.length) r.push(`## Gyanús válasz (átszervezett vagy csak böngészőben megjelenő oldal)\n\n${tartos}\n\n${j.gyanus.map(sor).join('\n')}`);
  if (j.hiba.length) r.push(`## Nem sikerült letölteni\n\n${tartos}\n\n${j.hiba.map(sor).join('\n')}`);
  return r.length ? `Forrásfigyelő, ${j.ma}.\n\n${r.join('\n\n')}\n` : '';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const j = await futtat();
  const szoveg = jegySzoveg(j);
  const f = olvas('data/figyelo.json');
  console.error(`Figyelt ténymondat: ${Object.values(f.allapot).reduce((a, x) => a + (x.tenyek?.length || 0), 0)}. Változatlan: ${j.valtozatlan}, új: ${j.uj.length}, változott: ${j.valtozott.length}, gyanús: ${j.gyanus.length}, hiba: ${j.hiba.length}, tartós (már jelzett) gond: ${j.tartos}`);
  process.stdout.write(szoveg);
}
