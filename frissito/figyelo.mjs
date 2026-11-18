// Forrásfigyelő: minden forrásoldalt letölt, amelyre a data/szabalyok.json hivatkozik (és a data/figyelo.json külön listáját),
// a szövegéből lenyomatot készít, és összeveti a legutóbb látottal. Adatot NEM ír át: ha egy forrás megváltozott,
// jelentést ad (a workflow ebből GitHub-jegyet nyit), a szabályt ember vagy az ütemezett Claude-futás vizsgálja felül.
import { createHash } from 'node:crypto';
import { olvas, ir, maBudapest } from '../forras/adat.mjs';

/** A HTML látható szövege, szóközökre egyszerűsítve. A kihagy lista mintái (például változó dátumok) kimaradnak. */
export function szovegge(html, kihagy = []) {
  let t = String(html)
    .replace(/<(script|style|noscript|svg|nav|header|footer)[\s\S]*?<\/\1>/gi, ' ')
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

/** A figyelendő források: a szabályok forrásai (melyik szabály függ tőlük), és a külön felvett oldalak. */
export function forrasLista(szabalyok, kulon = []) {
  const m = new Map();
  for (const t of szabalyok.temak) for (const x of t.tetelek) {
    const e = m.get(x.forras.url) || { url: x.forras.url, nev: x.forras.nev, szabalyok: [] };
    e.szabalyok.push(`${t.id}.${x.kulcs}`);
    m.set(x.forras.url, e);
  }
  for (const k of kulon) m.set(k.url, { szabalyok: [], ...m.get(k.url), ...k });
  return [...m.values()];
}

/**
 * Egy forrás kiértékelése. elozo: a legutóbbi állapot ({ lenyomat, hossz }), html: a most letöltött oldal.
 * Eredmény: { allapot: 'uj' | 'valtozatlan' | 'valtozott' | 'gyanus', lenyomat, hossz }
 * „gyanus”: a jelző eltűnt, vagy az oldal a korábbi hossz felénél rövidebb (hibaoldal, átszervezés): ilyenkor nem írjuk felül a lenyomatot.
 */
export function ertekel(forras, elozo, html) {
  const sz = szakasz(szovegge(html, forras.kihagy), forras.tol, forras.ig);
  if (sz == null || sz.length < 200) return { allapot: 'gyanus', ok: sz == null ? 'a figyelt szakasz jelzője nincs az oldalon' : 'az oldal szövege túl rövid' };
  const most = { lenyomat: lenyomat(sz), hossz: sz.length };
  if (!elozo?.lenyomat) return { allapot: 'uj', ...most };
  if (elozo.lenyomat === most.lenyomat) return { allapot: 'valtozatlan', ...most };
  if (most.hossz < elozo.hossz / 2) return { allapot: 'gyanus', ok: 'az oldal szövege a korábbi felénél rövidebb' };
  return { allapot: 'valtozott', ...most };
}

async function letolt(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (forrasfigyelo; +https://github.com/czakopeti/lakaskoltseg)', 'accept-language': 'hu' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

/** Futtatás: frissíti a data/figyelo.json-t, és jelentést ír a szabványos kimenetre (JSON). */
export async function futtat({ leto = letolt } = {}) {
  const szabalyok = olvas('data/szabalyok.json');
  const f = olvas('data/figyelo.json');
  const ma = maBudapest();
  const jelentes = { ma, valtozott: [], gyanus: [], hiba: [], uj: [], valtozatlan: 0 };
  for (const forras of forrasLista(szabalyok, f.kulon)) {
    const elozo = f.allapot[forras.url];
    try {
      const e = ertekel(forras, elozo, await leto(forras.url));
      if (e.allapot === 'valtozatlan') jelentes.valtozatlan++;
      else jelentes[e.allapot].push({ url: forras.url, nev: forras.nev, szabalyok: forras.szabalyok, ok: e.ok, elozoLatva: elozo?.latva });
      // Változásnál az új lenyomatot rögzítjük, hogy ugyanarról egyszer szóljunk; a jegy őrzi, hogy felül kell vizsgálni.
      if (e.lenyomat) f.allapot[forras.url] = { lenyomat: e.lenyomat, hossz: e.hossz, latva: e.allapot === 'valtozatlan' ? elozo.latva : ma, ellenorizve: ma };
    } catch (err) {
      jelentes.hiba.push({ url: forras.url, nev: forras.nev, ok: String(err.message || err) });
    }
  }
  // Már nem hivatkozott források kivezetése
  const elo = new Set(forrasLista(szabalyok, f.kulon).map((x) => x.url));
  for (const u of Object.keys(f.allapot)) if (!elo.has(u)) delete f.allapot[u];
  ir('data/figyelo.json', f);
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
  const sor = (x) => `- [${x.nev || x.url}](${x.url})${x.szabalyok?.length ? `\n  Érintett szabályok: ${x.szabalyok.map((s) => `\`${s}\``).join(', ')}` : ''}${x.ok ? `\n  Ok: ${x.ok}` : ''}`;
  const r = [];
  if (j.valtozott.length) r.push(`## Megváltozott a forrás szövege\n\nNézd meg, változott-e a szabály. Ha igen, írd át a \`data/szabalyok.json\` tételét, ha nem, frissítsd az \`ellenorizve\` dátumát.\n\n${j.valtozott.map(sor).join('\n')}`);
  if (j.gyanus.length) r.push(`## Gyanús válasz (átszervezett vagy hibás oldal)\n\n${j.gyanus.map(sor).join('\n')}`);
  if (j.hiba.length) r.push(`## Nem sikerült letölteni\n\n${j.hiba.map(sor).join('\n')}`);
  return r.length ? `Forrásfigyelő, ${j.ma}.\n\n${r.join('\n\n')}\n` : '';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const j = await futtat();
  const szoveg = jegySzoveg(j);
  console.error(`Változatlan: ${j.valtozatlan}, új: ${j.uj.length}, változott: ${j.valtozott.length}, gyanús: ${j.gyanus.length}, hiba: ${j.hiba.length}`);
  process.stdout.write(szoveg);
}
