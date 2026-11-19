// A KSH Ingatlanadattár (a NAV illetékadataiból számolt valódi eladási árak) tömörítése a lakásár-térképhez.
// Forrás: https://www.ksh.hu/s/ingatlanadattar/inga-data.json és a hozzá tartozó településlista (assets/teleplist.js).
// szint 1: vármegye, szint 3 („együtt”): település vagy budapesti kerület, szint 2: utca.
// *_ar: átlagár, ezer Ft/m²; *_db: az adásvételek száma. A KSH csak ott közöl adatot, ahol legalább 3 adásvétel volt.

export const IA = {
  oldal: 'https://www.ksh.hu/s/ingatlanadattar/',
  adat: 'https://www.ksh.hu/s/ingatlanadattar/inga-data.json',
  nevek: 'https://www.ksh.hu/s/ingatlanadattar/assets/teleplist.js',
};

// Mezők a sorozatokban: összes, családi ház, többlakásos társasház, lakótelepi panel
export const TIPUSOK = [['o', 'total'], ['h', 'cshaz'], ['t', 'tobbl'], ['p', 'panel']];

/** A KSH településlistája: id → { n, m, t } (t: 0 vármegye, 1 Budapest, 2 megyei jogú város, 3 város, 4 község, 5 kerület) */
export function nevlista(js) {
  const out = {};
  for (const m of js.matchAll(/\{\s*id:'(\d+)',\s*nev:'((?:[^'\\]|\\.)*)',\s*megye:'(\d+)',\s*tipus:(\d)\s*\}/g)) {
    out[m[1]] = { n: m[2].replace(/\\'/g, "'").replace(/^Budapest 0?(\d+)\. kerület$/, (_, d) => `Budapest ${romai(Number(d))}. kerület`), m: m[3], t: Number(m[4]) };
  }
  return out;
}

const romai = (n) => [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
const ures = (evek) => evek.map(() => null);

function sorozat(evek) {
  const s = {};
  for (const [r] of TIPUSOK) { s[r] = ures(evek); s[r + 'd'] = ures(evek); }
  return s;
}
function beir(s, i, x) {
  for (const [r, k] of TIPUSOK) {
    if (x[k + '_ar'] != null) s[r][i] = x[k + '_ar'];
    if (x[k + '_db'] != null) s[r + 'd'][i] = x[k + '_db'];
  }
}
// A teljesen üres típusokat elhagyjuk, hogy kisebb legyen a fájl
function tisztit(s) {
  for (const [r] of TIPUSOK) if (s[r].every((v) => v == null)) { delete s[r]; delete s[r + 'd']; }
  return s;
}

/**
 * tomorit(sorok, nevek) → { evek, megyek: {kód: {n, s}}, egysegek: {kód: {n, m, t, s}}, utcak: {megye: {kód: [[utca, ár[], db[]]]}} }
 */
export function tomorit(sorok, nevek) {
  const evek = [...new Set(sorok.map((x) => x.ev))].filter(Number.isFinite).sort((a, b) => a - b);
  const ix = new Map(evek.map((e, i) => [e, i]));
  const megyek = {}, egysegek = {}, utcak = {};
  for (const x of sorok) {
    const i = ix.get(x.ev);
    if (i == null) continue;
    if (x.szint === 1) {
      const m = (megyek[x.telaz] ||= { n: nevek[x.telaz]?.n || x.telaz, s: sorozat(evek) });
      beir(m.s, i, x);
    } else if (x.szint === 3) {
      const nv = nevek[x.telaz];
      const e = (egysegek[x.telaz] ||= { n: nv?.n || x.telaz, m: x.megye, t: nv?.t ?? 4, s: sorozat(evek) });
      beir(e.s, i, x);
    } else if (x.szint === 2 && x.kozter) {
      const mu = (utcak[x.megye] ||= {});
      const lista = (mu[x.telaz] ||= new Map());
      const u = lista.get(x.kozter) || [x.kozter, ures(evek), ures(evek)];
      u[1][i] = x.total_ar ?? null;
      u[2][i] = x.total_db ?? null;
      lista.set(x.kozter, u);
    }
  }
  for (const m of Object.values(megyek)) tisztit(m.s);
  for (const e of Object.values(egysegek)) tisztit(e.s);
  const ut = {};
  for (const [m, tel] of Object.entries(utcak)) {
    ut[m] = {};
    for (const [k, lista] of Object.entries(tel)) ut[m][k] = [...lista.values()].sort((a, b) => a[0].localeCompare(b[0], 'hu'));
  }
  return { evek, megyek, egysegek, utcak: ut };
}

/** Józansági próba: null, ha rendben, különben a gond szövege. */
export function hiheto(regi, uj) {
  if (!uj.evek.length) return 'nincs egyetlen év sem az adatban';
  const ujEv = uj.evek.at(-1);
  if (regi?.evek?.length && ujEv < regi.evek.at(-1)) return `az utolsó év ${ujEv}, korábban ${regi.evek.at(-1)} volt`;
  if (Object.keys(uj.megyek).length !== 20) return `${Object.keys(uj.megyek).length} vármegyét találtam, 20 helyett`;
  const n = Object.values(uj.egysegek).filter((e) => e.s.o?.at(-1) != null).length;
  if (n < 1000) return `a legutóbbi évre csak ${n} településen van adat`;
  const bp = uj.megyek['01']?.s.o?.at(-1);
  if (!(bp >= 300 && bp <= 5000)) return `a budapesti átlagár valószínűtlen: ${bp} ezer Ft/m²`;
  const regiBp = regi?.megyek?.['01']?.s.o;
  if (regiBp && regi.evek.at(-1) === ujEv && Math.abs(bp - regiBp.at(-1)) > regiBp.at(-1) * 0.3) return `a budapesti átlagár ugyanarra az évre ${regiBp.at(-1)} helyett ${bp}`;
  return null;
}

/**
 * KSH STADAT 18.2.1.8 (lak0036.csv, ISO-8859-2, pontosvessző): a „YYYY = 100,0%” blokkból a használt lakások tiszta árindexe.
 * → { bazis, negyedevek: [["2025-1", 94.2], ...] } vagy null.
 */
export const ARINDEX_URL = 'https://www.ksh.hu/stadat_files/lak/hu/lak0036.csv';
export const ARINDEX_OLDAL = 'https://www.ksh.hu/stadat_files/lak/hu/lak0036.html';
export function arindex(csvSzoveg) {
  const sorok = csvSzoveg.split(/\r?\n/).map((x) => x.split(';'));
  // a kódolástól független minta (ISO-8859-2-ként vagy UTF-8-ként olvasva is talál)
  const fej = sorok.find((r) => /Tiszta.{1,20}haszn/.test(r.join(';')));
  if (!fej) return null;
  const oszlop = fej.findIndex((c) => /Tiszta.{1,20}haszn/.test(c));
  const kezd = sorok.findIndex((r) => /^\d{4} = 100/.test(r[0].trim()));
  if (kezd < 0 || oszlop < 0) return null;
  const bazis = Number(sorok[kezd][0].trim().slice(0, 4));
  const RN = { 'I.': 1, 'II.': 2, 'III.': 3, 'IV.': 4 };
  const out = [];
  let ev = null;
  for (let i = kezd + 1; i < sorok.length; i++) {
    const r = sorok[i];
    if (/= 100/.test(r[0])) break;
    if (/^\d{4}\.?$/.test(r[0].trim())) ev = Number(r[0].trim().slice(0, 4));
    const q = RN[(r[1] || '').trim()];
    const v = Number(String(r[oszlop] || '').replace(/\s/g, '').replace(',', '.'));
    if (ev && q && r[oszlop] && r[oszlop].trim() && Number.isFinite(v)) out.push([`${ev}-${q}`, v]);
  }
  return out.length ? { bazis, negyedevek: out } : null;
}

/*
 * A KSH TIMEA (map.ksh.hu) nyilvános ArcGIS-szolgáltatásából: a teljes munkaidőben alkalmazásban állók nettó átlagkeresete
 * a munkavállalók lakcíme szerint (TYWN006), településenként és vármegyénként, évente (az utolsó év félévi, előzetes adat).
 */
const TIMEA = 'https://map.ksh.hu/arcgis/rest/services/ksh_map/MapServer';
export const KERESET = {
  oldal: 'https://map.ksh.hu/timea/?locale=hu',
  telep: `${TIMEA}/2/query?where=M_KOD%3D%27TYWN006%27&outFields=ELEM_KOD,TELEP_NEV,MEGYE_NEV,VALUE,VON_IDO&returnGeometry=false&f=json`,
  megye: `${TIMEA}/4/query?where=M_KOD%3D%27TYWN006%27&outFields=MEGYE_NEV,VALUE,VON_IDO&returnGeometry=false&f=json`,
  mutato: `${TIMEA}/8/query?where=MUTATO_KOD%3D%27TYWN006%27&outFields=MUTATO_MEGNEV&returnGeometry=false&f=json`,
};
/** → { evek, telep: { 4 jegyű törzsszám: [Ft/hó évenként] }, megye: { név: [...] }, megnevezes } */
export function keresetFeldolgoz(telepJson, megyeJson, mutatoJson) {
  const t = telepJson?.features || [], m = megyeJson?.features || [];
  const evek = [...new Set([...t, ...m].map((f) => Number(f.attributes.VON_IDO)))].filter(Number.isFinite).sort((a, b) => a - b);
  const ix = new Map(evek.map((e, i) => [e, i]));
  const telep = {}, megye = {};
  for (const { attributes: a } of t) {
    const k = String(a.ELEM_KOD).padStart(4, '0');
    (telep[k] ||= evek.map(() => null))[ix.get(Number(a.VON_IDO))] = a.VALUE == null ? null : Math.round(a.VALUE);
  }
  for (const { attributes: a } of m) (megye[a.MEGYE_NEV] ||= evek.map(() => null))[ix.get(Number(a.VON_IDO))] = a.VALUE == null ? null : Math.round(a.VALUE);
  const megnevezes = mutatoJson?.features?.[0]?.attributes?.MUTATO_MEGNEV || '';
  return { evek, telep, megye, megnevezes };
}
export function keresetHiheto(regi, uj) {
  if (uj.evek.length < 3) return `csak ${uj.evek.length} év van benne`;
  if (Object.keys(uj.megye).length !== 20) return `${Object.keys(uj.megye).length} vármegyét találtam, 20 helyett`;
  const n = Object.values(uj.telep).filter((s) => s[uj.evek.length - 2] != null).length;
  if (n < 2500) return `csak ${n} településen van adat`;
  const bp = uj.megye.Budapest?.[uj.evek.length - 2];
  if (!(bp > 150000 && bp < 3000000)) return `valószínűtlen budapesti nettó átlagkereset: ${bp}`;
  if (regi?.evek?.length && uj.evek.at(-1) < regi.evek.at(-1)) return `az utolsó év ${uj.evek.at(-1)}, korábban ${regi.evek.at(-1)} volt`;
  return null;
}
