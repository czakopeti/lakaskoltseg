// KSH Helységnévtár: minden település neve, KSH-kódja, vármegyéje, járása és irányítószámai.
// A lakásérték-becslő ebből ismeri fel azokat a településeket is, ahol a KSH nem közöl lakásárat,
// és az irányítószámot. Évente egyszer jelenik meg új kiadás (január 1-jei állapot).
import { inflateRawSync } from 'node:zlib';

export const HNT = {
  nev: 'KSH Helységnévtár',
  oldal: 'https://www.ksh.hu/apps/hntr.main',
  url: (ev) => `https://www.ksh.hu/docs/helysegnevtar/hnt_letoltes_${ev}.xlsx`,
};

/** Egy .xlsx (zip) fájlból a megadott nevű belső fájl szövege, vagy null. Csak a tömörítetlen és a deflate módot ismeri. */
function zipFajl(buf, nev) {
  // A központi könyvtár vége (End of Central Directory) a fájl végén
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('nem zip fájl');
  const db = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let k = 0; k < db; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('hibás zip-könyvtár');
    const mod = buf.readUInt16LE(p + 10), meret = buf.readUInt32LE(p + 20);
    const nh = buf.readUInt16LE(p + 28), eh = buf.readUInt16LE(p + 30), mh = buf.readUInt16LE(p + 32);
    const helyi = buf.readUInt32LE(p + 42);
    const fnev = buf.toString('utf8', p + 46, p + 46 + nh);
    if (fnev === nev) {
      const lnh = buf.readUInt16LE(helyi + 26), leh = buf.readUInt16LE(helyi + 28);
      const adat = buf.subarray(helyi + 30 + lnh + leh, helyi + 30 + lnh + leh + meret);
      return (mod === 8 ? inflateRawSync(adat) : adat).toString('utf8');
    }
    p += 46 + nh + eh + mh;
  }
  return null;
}

const xmlSzoveg = (s) => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** A munkafüzet n-edik (1-től) lapja sorok tömbjeként; a cellák szövegek, oszlopbetű szerint helyükön. */
export function xlsxLap(buf, n) {
  const ss = zipFajl(buf, 'xl/sharedStrings.xml');
  const kozos = ss ? [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => xmlSzoveg(m[1])) : [];
  const lap = zipFajl(buf, `xl/worksheets/sheet${n}.xml`);
  if (lap == null) return null;
  const oszlop = (ref) => [...ref.replace(/\d+$/, '')].reduce((t, c) => t * 26 + c.charCodeAt(0) - 64, 0) - 1;
  return [...lap.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((r) => {
    const sor = [];
    for (const c of r[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const tipus = /t="(\w+)"/.exec(c[2])?.[1], belso = c[3] || '';
      const v = /<v>([\s\S]*?)<\/v>/.exec(belso)?.[1];
      sor[oszlop(c[1])] = tipus === 's' ? kozos[Number(v)] : tipus === 'inlineStr' ? xmlSzoveg(belso) : v != null ? xmlSzoveg(v) : '';
    }
    return sor;
  });
}

/**
 * A két lapból (Helységek, Településrészek): { kod5: [név, vármegye, járás, [irányítószámok]] }.
 * Budapestet kihagyjuk: a kerületeket a becslő a saját adataiból és az irányítószám 2–3. jegyéből ismeri.
 */
export function hntFeldolgoz(helysegek, reszek) {
  const fej = helysegek.findIndex((r) => r[0] === 'Helység megnevezése');
  if (fej < 0) return null;
  const ki = {};
  for (const r of helysegek.slice(fej + 1)) {
    const kod = String(r[1] || '').padStart(5, '0');
    if (!r[0] || !/^\d{5}$/.test(kod) || r[0] === 'Budapest') continue;
    ki[kod] = [String(r[0]).trim(), String(r[3] || '').trim(), String(r[5] || '').trim(), []];
  }
  const rf = reszek ? reszek.findIndex((r) => r[0] === 'Helység KSH kód') : -1;
  if (rf >= 0) {
    for (const r of reszek.slice(rf + 1)) {
      const kod = String(r[0] || '').padStart(5, '0'), irsz = String(r[5] || '').trim();
      if (ki[kod] && /^\d{4}$/.test(irsz) && !ki[kod][3].includes(irsz)) ki[kod][3].push(irsz);
    }
  }
  for (const v of Object.values(ki)) v[3].sort();
  return ki;
}

/** Hihető-e az új lista: legalább 3000 település, és nem tűnt el a régiek tizede. null, ha rendben. */
export function hntHiheto(regi, uj) {
  const n = uj ? Object.keys(uj).length : 0;
  if (n < 3000) return `csak ${n} település van benne`;
  if (regi) {
    const eltunt = Object.keys(regi.telepulesek || {}).filter((k) => !uj[k]).length;
    if (eltunt > 50) return `${eltunt} korábbi település hiányzik belőle`;
  }
  return null;
}
