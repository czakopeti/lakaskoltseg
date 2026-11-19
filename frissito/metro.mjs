// A budapesti metró- és HÉV-megállók, és a 500 méteren belüli utcák az OpenStreetMapből (Overpass API, ODbL).
// Havonta fut a GitHub Actionsben (.github/workflows/metro.yml): a megállók ritkán változnak, de így az új állomások
// és átnevezések maguktól bekerülnek. Az árakat az építés számolja hozzá a KSH utcai adataiból (data/utcak/01.json).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const GYOKER = join(dirname(fileURLToPath(import.meta.url)), '..');
const KI = join(GYOKER, 'data/metro.json');
const TUKROK = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
export const SUGAR_M = 500;
const VONALAK = '^(M[1-4]|H[5-9])$';

async function overpass(q) {
  let utolso;
  for (const url of TUKROK) {
    for (let p = 0; p < 2; p++) {
      try {
        const r = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), headers: { 'User-Agent': 'ingatlanmerleg.hu (lakaskoltseg repo)' }, signal: AbortSignal.timeout(300000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      } catch (e) { utolso = e; console.error(`overpass ${url} ${p + 1}. próba: ${e.message}`); await new Promise((ok) => setTimeout(ok, 15000)); }
    }
  }
  throw new Error(`egyik Overpass-tükör sem válaszolt: ${utolso?.message}`);
}

const tav = (a, b) => { // méter, egyenlítői közelítéssel (Budapest méretében bőven elég)
  const R = 6371000, f = Math.PI / 180, x = (b[1] - a[1]) * f * Math.cos(((a[0] + b[0]) / 2) * f), y = (b[0] - a[0]) * f;
  return R * Math.hypot(x, y);
};

/** Vonalak a megállók sorrendjével: útvonal-relációnként az első irány megállói, név szerint összevonva. */
export function vonalakFeldolgoz(j) {
  const nodes = new Map(j.elements.filter((e) => e.type === 'node').map((e) => [e.id, e]));
  const rel = j.elements.filter((e) => e.type === 'relation');
  const vonalak = new Map();
  for (const r of rel) {
    const ref = r.tags?.ref; if (!ref || vonalak.has(ref)) continue;
    const allomasok = [];
    for (const m of r.members || []) {
      if (m.type !== 'node' || !/^stop/.test(m.role || '')) continue;
      const n = nodes.get(m.ref); const nev = n?.tags?.name?.replace(/\s*\((M\d|HÉV)\)$/, '').trim();
      if (!n || !nev || allomasok.some((a) => a.nev === nev)) continue;
      allomasok.push({ nev, lat: n.lat, lon: n.lon });
    }
    if (allomasok.length >= 3) vonalak.set(ref, { ref, nev: r.tags.name || ref, szin: r.tags.colour || null, allomasok });
  }
  return [...vonalak.values()].sort((a, b) => a.ref.localeCompare(b.ref, 'hu', { numeric: true }));
}

/** Utcák kerületenként, a vonalak megállóihoz rendelve (a legközelebbi pontjuk távolsága szerint). */
export function utcakFeldolgoz(j, vonalak) {
  const romai = (s) => (s.match(/^([IVXL]+)\.\s*kerület/) || [])[1];
  let ker = null; const ki = [];
  const allomasok = vonalak.flatMap((v) => v.allomasok.map((a, i) => ({ v: v.ref, i, a })));
  for (const e of j.elements) {
    if (e.type === 'area') { ker = romai(e.tags?.name || '') || null; continue; }
    if (e.type !== 'way' || !ker || !e.tags?.name || !e.geometry) continue;
    for (const s of allomasok) {
      let min = Infinity;
      for (const p of e.geometry) { const d = tav([p.lat, p.lon], [s.a.lat, s.a.lon]); if (d < min) min = d; }
      if (min <= SUGAR_M) ki.push([s.v, s.i, ker, e.tags.name, Math.round(min)]);
    }
  }
  // Egy utca több darabból áll: kerületenként és megállónként a legkisebb távolság marad
  const egy = new Map();
  for (const x of ki) { const k = x.slice(0, 4).join('|'); if (!egy.has(k) || egy.get(k)[4] > x[4]) egy.set(k, x); }
  return [...egy.values()];
}

async function fut() {
  const kozos = `area["name"="Budapest"]["admin_level"="8"]["boundary"="administrative"]->.bp;
rel["type"="route"]["route"~"^(subway|light_rail|train)$"]["ref"~"${VONALAK}"](area.bp)->.vonal;`;
  const j1 = await overpass(`[out:json][timeout:180];\n${kozos}\n.vonal out body;\nnode(r.vonal);\nout;`);
  const vonalak = vonalakFeldolgoz(j1);
  if (vonalak.length < 4) throw new Error(`csak ${vonalak.length} vonalat találtunk`);
  // A megállók Budapesten belül, a kerületek területére bontva
  const j2 = await overpass(`[out:json][timeout:600];\n${kozos}\nnode(r.vonal:"stop")(area.bp)->.st;\nnode(r.vonal:"stop_entry_only")(area.bp)->.st2;\nnode(r.vonal:"stop_exit_only")(area.bp)->.st3;\n(.st;.st2;.st3;)->.st;\nrel(area.bp)["boundary"="administrative"]["admin_level"="9"];\nmap_to_area->.ker;\nforeach.ker->.k(\n  .k out tags;\n  way(area.k)["highway"]["name"](around.st:${SUGAR_M});\n  out tags geom;\n);`);
  const utcak = utcakFeldolgoz(j2, vonalak);
  const uj = { forras: { nev: 'OpenStreetMap-közreműködők (ODbL), Overpass API', url: 'https://www.openstreetmap.org/copyright' }, kelt: new Date().toISOString().slice(0, 10), sugar: SUGAR_M, vonalak, utcak };
  if (utcak.length < 300) throw new Error(`gyanúsan kevés utca: ${utcak.length}`);
  const regi = existsSync(KI) ? JSON.parse(readFileSync(KI, 'utf8')) : null;
  if (regi && JSON.stringify({ ...regi, kelt: 0 }) === JSON.stringify({ ...uj, kelt: 0 })) { console.log('metro.json: nincs változás'); return; }
  writeFileSync(KI, `${JSON.stringify(uj)}\n`);
  console.log(`metro.json: ${vonalak.length} vonal, ${vonalak.reduce((s, v) => s + v.allomasok.length, 0)} megálló, ${utcak.length} utca–megálló pár`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) fut().catch((e) => { console.error(e); process.exit(1); });
