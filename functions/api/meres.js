// Névtelen használatmérés (Cloudflare Pages Function, címe: /api/meres).
//
// POST {ut, esemeny}        → napi számláló nő eggyel (KV: SZAVAZAT, kulcs: n:ÉÉÉÉ-HH-NN:<ut>:<esemény>)
// GET  ?honap=ÉÉÉÉ-HH       → az adott hónap számlálói oldalanként, a befejezési arány, és napokra bontva (napok)
//
// 2026. november 24-ig havi kulcsok voltak (m:ÉÉÉÉ-HH:<ut>:<esemény>). Ezeket a havi összesítő továbbra is beszámolja,
// a napi bontásban „napra nem bontott” tételként jelennek meg. Eseményenként egy írás marad (KV ingyenes kerete: napi 1000 írás).
//
// Csak számlálók vannak: se IP-cím, se süti, se azonosító, se a beírt adatok. A böngészőben sem tárolunk
// ehhez semmit: oldalbetöltésenként egy esemény legfeljebb egyszer megy el (lásd app.mjs, meres()).
// Csak ismert oldalra és ismert eseményre számolunk, hogy idegen kulcsokkal ne lehessen teleírni a tárolót.
import { UTAK } from '../../kozos/utak.js';

export const HASZNALAT = ['indit', 'kesz', 'mentes', 'megosztas', 'nyomtat', 'kovetkezo', 'tovabb', 'naptar'];
// Érkezés kívülről, a forrás fajtája szerint (lásd megjelenites.mjs, erkezesForras)
export const ERKEZES = ['erk_chatgpt', 'erk_perplexity', 'erk_claude', 'erk_gemini', 'erk_copilot', 'erk_google', 'erk_bing', 'erk_facebook', 'erk_mas', 'erk_kozvetlen'];
export const ESEMENYEK = [...HASZNALAT, ...ERKEZES];
// A saját domain bekötésekor ide kell felvenni (például lakasom\.hu|www\.lakasom\.hu).
const ENGEDETT = /^(ingatlanmerleg\.hu|www\.ingatlanmerleg\.hu|[a-z0-9-]+\.pages\.dev|localhost|127\.0\.0\.1)$/;
const ISMERT = new Set(UTAK.map((u) => `/${u}`));

const valasz = (adat, status = 200) =>
  new Response(JSON.stringify(adat), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const budapestNap = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());
const budapestHonap = () => budapestNap().slice(0, 7);
export const kulcs = (nap, ut, esemeny) => `n:${nap}:${ut}:${esemeny}`;
export const ervenyes = (b) => !!b && typeof b.ut === 'string' && ISMERT.has(b.ut) && ESEMENYEK.includes(b.esemeny);

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  try { if (origin && !ENGEDETT.test(new URL(origin).hostname)) return valasz({ hiba: 'tiltott' }, 403); } catch { return valasz({ hiba: 'tiltott' }, 403); }
  if (Number(request.headers.get('content-length') || 0) > 300) return valasz({ hiba: 'túl hosszú' }, 413);
  const t = await request.text();
  if (t.length > 300) return valasz({ hiba: 'túl hosszú' }, 413);
  let b;
  try { b = JSON.parse(t); } catch { return valasz({ hiba: 'rossz kérés' }, 400); }
  if (!ervenyes(b)) return valasz({ hiba: 'ismeretlen' }, 400);
  if (!env.SZAVAZAT) return valasz({ ok: true, szamlalo: false });
  const k = kulcs(budapestNap(), b.ut, b.esemeny);
  try {
    const n = (Number(await env.SZAVAZAT.get(k)) || 0) + 1;
    // a darabszám a metaadatban is ott van, így a havi összesítő egyetlen listázással kiolvasható
    await env.SZAVAZAT.put(k, String(n), { metadata: { n } });
  } catch {
    // KV-korlát vagy egyidejű írás: egy esemény elveszhet, a látogatónak ebből semmi nem látszik
    return valasz({ ok: false }, 202);
  }
  return valasz({ ok: true });
}

/** A hónap számlálóiból (napi és régi havi kulcsok) oldalankénti táblázat, befejezési arány és napi bontás. */
export function osszesit(kulcsok, honap) {
  const ures = () => Object.fromEntries(ESEMENYEK.map((e) => [e, 0]));
  const oldalak = {}, osszesen = ures(), napok = {};
  for (const { name, metadata } of kulcsok) {
    const m = name.match(/^(?:n:(\d{4}-\d{2})-(\d{2})|m:(\d{4}-\d{2})):(\/[^:]*):([a-z_]+)$/);
    if (!m || (m[1] || m[3]) !== honap || !ESEMENYEK.includes(m[5])) continue;
    const n = Number(metadata?.n) || 0, ut = m[4], e = m[5];
    const nap = m[1] ? `${m[1]}-${m[2]}` : 'napra nem bontott';
    (oldalak[ut] ??= {})[e] = (oldalak[ut][e] || 0) + n;
    osszesen[e] += n;
    const d = (napok[nap] ??= { osszesen: ures(), oldalak: {} });
    d.osszesen[e] += n;
    (d.oldalak[ut] ??= {})[e] = (d.oldalak[ut][e] || 0) + n;
  }
  const arany = (o) => (o.indit ? Math.round(((o.kesz || 0) / o.indit) * 1000) / 10 : null);
  for (const o of Object.values(oldalak)) o.befejezesi_arany = arany(o);
  // A napok időrendben, a régi, napra nem bontott tétel elöl
  const rendezett = Object.fromEntries(Object.entries(napok).sort(([a], [b]) => (a < b ? (b.startsWith('napra') ? 1 : -1) : (a.startsWith('napra') ? -1 : 1))));
  return { honap, osszesen: { ...osszesen, befejezesi_arany: arany(osszesen) }, oldalak, napok: rendezett };
}

export async function onRequestGet({ request, env }) {
  const honap = new URL(request.url).searchParams.get('honap') || budapestHonap();
  if (!/^\d{4}-\d{2}$/.test(honap)) return valasz({ hiba: 'a hónap formája: ÉÉÉÉ-HH' }, 400);
  if (!env.SZAVAZAT) return valasz({ szamlalo: false });
  const kulcsok = [];
  for (const prefix of [`n:${honap}-`, `m:${honap}:`]) {
    let cursor;
    do {
      const l = await env.SZAVAZAT.list({ prefix, cursor });
      kulcsok.push(...l.keys);
      cursor = l.list_complete ? undefined : l.cursor;
    } while (cursor);
  }
  const o = osszesit(kulcsok, honap);
  return new URL(request.url).searchParams.get('nezet') === 'tabla' ? tabla(o) : valasz(o);
}

/** Emberi nézet (?nezet=tabla): napok soronként, oldalak lenyitva. Csak darabszámok, ezért nyilvános lehet. */
const NEVEK = { indit: 'Elkezdte', kesz: 'Eredmény', mentes: 'Letöltés', megosztas: 'Megosztás', nyomtat: 'Nyomtatás', kovetkezo: 'Következő lépés', tovabb: 'Továbblépés', naptar: 'Naptár', erk_chatgpt: 'ChatGPT', erk_perplexity: 'Perplexity', erk_claude: 'Claude', erk_gemini: 'Gemini', erk_copilot: 'Copilot', erk_google: 'Google', erk_bing: 'Bing, DuckDuckGo', erk_facebook: 'Facebook', erk_mas: 'Más oldal', erk_kozvetlen: 'Közvetlen' };
const e = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export function tabla(o) {
  const resz = (cim, oszlopok) => {
    const fej = `<tr><th></th>${oszlopok.map((x) => `<th>${NEVEK[x]}</th>`).join('')}</tr>`;
    const sor = (c, d, cls = '') => `<tr class="${cls}"><th>${e(c)}</th>${oszlopok.map((x) => `<td>${d[x] || ''}</td>`).join('')}</tr>`;
    const van = (d) => oszlopok.some((x) => d[x]);
    const napok = Object.entries(o.napok).reverse().filter(([, d]) => van(d.osszesen)).map(([nap, d]) => sor(nap, d.osszesen, 'nap') + Object.entries(d.oldalak).filter(([, x]) => van(x)).sort((a, b) => oszlopok.reduce((s, k) => s + (b[1][k] || 0) - (a[1][k] || 0), 0)).map(([ut, x]) => sor(`   ${ut}`, x, 'oldal')).join('')).join('');
    return `<h2>${cim}</h2>${napok ? `<table>${fej}${napok}</table>` : '<p>Még nincs adat.</p>'}`;
  };
  const erk = ERKEZES.reduce((s, x) => s + (o.osszesen[x] || 0), 0);
  const html = `<!doctype html><html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Mérés, ${e(o.honap)}</title>
<style>body{font:15px/1.4 system-ui,sans-serif;margin:24px;color:#14161B}table{border-collapse:collapse;margin-bottom:28px}th,td{padding:4px 10px;text-align:right;border-bottom:1px solid #e5e5e5}th:first-child{text-align:left;white-space:pre}tr.nap th,tr.nap td{font-weight:700;background:#FFF3C2}tr.oldal{color:#555;font-size:13px}h2{font-size:18px;margin-top:28px}</style>
<h1>Használat, ${e(o.honap)}</h1><p>Összesen ${erk} érkezés kívülről, ${o.osszesen.indit} kezdés, ${o.osszesen.kesz} eredmény${o.osszesen.befejezesi_arany != null ? ` (${o.osszesen.befejezesi_arany}%)` : ''}. A legfrissebb nap van felül. Az érkezéseket 2026. november 24-től számoljuk.</p>
${resz('Honnan jöttek', ERKEZES)}${resz('Mit csináltak', HASZNALAT)}</html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
