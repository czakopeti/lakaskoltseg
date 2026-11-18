// Az adatfájlok betöltése és összefésülése egy objektumba (az építő, a frissítők és a tesztek közös belépője).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const GYOKER = join(dirname(fileURLToPath(import.meta.url)), '..');

export function olvas(rel) { return JSON.parse(readFileSync(join(GYOKER, rel), 'utf8')); }
export function ir(rel, obj) {
  // Számlisták egy sorban, hogy a git-különbség olvasható maradjon
  const s = JSON.stringify(obj, null, 2).replace(/\[\s*((?:-?[\d.]+|null)(?:,\s*(?:-?[\d.]+|null))*)\s*\]/g, (m, b) => `[${b.split(/,\s*/).join(', ')}]`);
  writeFileSync(join(GYOKER, rel), s + '\n');
}

export function betoltAdat() {
  return {
    szabalyok: olvas('data/szabalyok.json'),
    inflacio: olvas('data/inflacio.json'),
    allapot: olvas('data/allapot.json'),
    valtozasok: olvas('data/valtozasok.json'),
  };
}

/** A mai nap Budapesten, YYYY-MM-DD; az EPIT_DATUM környezeti változóval felülírható (teszthez). */
export function maBudapest() {
  if (process.env.EPIT_DATUM) return process.env.EPIT_DATUM;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());
}
