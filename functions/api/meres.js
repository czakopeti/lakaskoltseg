// Névtelen használatmérés (Cloudflare Pages Function, címe: /api/meres).
//
// POST {ut, esemeny}        → havi számláló nő eggyel (KV: SZAVAZAT, kulcs: m:ÉÉÉÉ-HH:<ut>:<esemény>)
// GET  ?honap=ÉÉÉÉ-HH       → az adott hónap számlálói oldalanként, és a befejezési arány
//
// Csak számlálók vannak: se IP-cím, se süti, se azonosító, se a beírt adatok. A böngészőben sem tárolunk
// ehhez semmit: oldalbetöltésenként egy esemény legfeljebb egyszer megy el (lásd app.mjs, meres()).
// Csak ismert oldalra és ismert eseményre számolunk, hogy idegen kulcsokkal ne lehessen teleírni a tárolót.
import { UTAK } from '../../kozos/utak.js';

export const ESEMENYEK = ['indit', 'kesz', 'mentes', 'megosztas', 'nyomtat', 'kovetkezo', 'tovabb', 'naptar'];
// A saját domain bekötésekor ide kell felvenni (például lakasom\.hu|www\.lakasom\.hu).
const ENGEDETT = /^(ingatlanmerleg\.hu|www\.ingatlanmerleg\.hu|[a-z0-9-]+\.pages\.dev|localhost|127\.0\.0\.1)$/;
const ISMERT = new Set(UTAK.map((u) => `/${u}`));

const valasz = (adat, status = 200) =>
  new Response(JSON.stringify(adat), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const budapestHonap = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date()).slice(0, 7);
export const kulcs = (honap, ut, esemeny) => `m:${honap}:${ut}:${esemeny}`;
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
  const k = kulcs(budapestHonap(), b.ut, b.esemeny);
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

/** A havi számlálókból oldalankénti táblázat és befejezési arány. */
export function osszesit(kulcsok, honap) {
  const oldalak = {}, osszesen = Object.fromEntries(ESEMENYEK.map((e) => [e, 0]));
  for (const { name, metadata } of kulcsok) {
    const m = name.match(/^m:(\d{4}-\d{2}):(\/[^:]*):([a-z]+)$/);
    if (!m || m[1] !== honap) continue;
    const n = Number(metadata?.n) || 0;
    (oldalak[m[2]] ??= {})[m[3]] = n;
    if (m[3] in osszesen) osszesen[m[3]] += n;
  }
  const arany = (o) => (o.indit ? Math.round(((o.kesz || 0) / o.indit) * 1000) / 10 : null);
  for (const o of Object.values(oldalak)) o.befejezesi_arany = arany(o);
  return { honap, osszesen: { ...osszesen, befejezesi_arany: arany(osszesen) }, oldalak };
}

export async function onRequestGet({ request, env }) {
  const honap = new URL(request.url).searchParams.get('honap') || budapestHonap();
  if (!/^\d{4}-\d{2}$/.test(honap)) return valasz({ hiba: 'a hónap formája: ÉÉÉÉ-HH' }, 400);
  if (!env.SZAVAZAT) return valasz({ szamlalo: false });
  const kulcsok = [];
  let cursor;
  do {
    const l = await env.SZAVAZAT.list({ prefix: `m:${honap}:`, cursor });
    kulcsok.push(...l.keys);
    cursor = l.list_complete ? undefined : l.cursor;
  } while (cursor);
  return valasz(osszesit(kulcsok, honap));
}
