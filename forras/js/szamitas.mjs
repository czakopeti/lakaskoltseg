// A számítási mag. A böngésző, az építő és a tesztek is ezt használják. Minden mérték a data/szabalyok.json-ból jön.
// A kalkulátorok a tartalomterv elfogadása után kerülnek ide; most a közös segédfüggvények vannak itt.

export const HONAPOK = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
/** 1-jén, 2-án, 5-én, 20-án */
export function napRag(n) { const d = n % 10; return n === 1 ? 'jén' : n === 2 || [20, 30].includes(n) || [3, 6, 8].includes(d) ? 'án' : 'én'; }

/** Egy szabálytétel a kulcsa szerint (például 'illetek.altalanos_mertek'); hibát dob, ha nincs ilyen, hogy elírás ne maradjon rejtve. */
export function szabaly(adat, kulcs) {
  const [tema, nev] = kulcs.split('.');
  const t = adat.szabalyok.temak.find((x) => x.id === tema)?.tetelek.find((x) => x.kulcs === nev);
  if (!t) throw new Error(`Nincs ilyen szabály: ${kulcs}`);
  return t;
}

/** Annuitásos havi törlesztő éves névleges kamatból (a kamattámogatott hitelek fix kamata így értendő). */
export function torlesztoKamatbol(hitel, honapok, kamatSzazalek) {
  const r = kamatSzazalek / 100 / 12;
  return r > 0 ? hitel * r / (1 - Math.pow(1 + r, -honapok)) : hitel / honapok;
}

/* ---------------- Összeg betűvel (szerződéshez) ---------------- */
const EGY = ['', 'egy', 'két', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'];
const TIZ = ['', 'tizen', 'huszon', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];
function harom(n, vegso) {
  const s = Math.floor(n / 100), r = n % 100, t = Math.floor(r / 10), e = r % 10;
  let x = s ? (s === 1 ? 'száz' : `${EGY[s]}száz`) : '';
  if (e === 0) x += t === 1 ? 'tíz' : t === 2 ? 'húsz' : TIZ[t];
  else x += TIZ[t] + (e === 2 && vegso ? 'kettő' : EGY[e]);
  return x;
}
/** 1 500 000 → „egymillió-ötszázezer”; 1 999 → „ezerkilencszázkilencvenkilenc”. */
export function betuvel(n) {
  n = Math.floor(Math.abs(Number(n)));
  if (!n) return 'nulla';
  const mrd = Math.floor(n / 1e9), mil = Math.floor((n % 1e9) / 1e6), ezr = Math.floor((n % 1e6) / 1e3), egys = n % 1e3;
  const reszek = [];
  if (mrd) reszek.push(`${harom(mrd, false)}milliárd`);
  if (mil) reszek.push(`${harom(mil, false)}millió`);
  if (ezr) reszek.push(n < 2000 ? 'ezer' : `${harom(ezr, false)}ezer`);
  if (egys) reszek.push(harom(egys, true));
  return n > 2000 ? reszek.join('-') : reszek.join('');
}

/* ---------------- Következő lépés ---------------- */
/** Kalkulátoronként legfeljebb két ajánlás: { cel, cim, szoveg, q }. Csak a látogató által beírt adat megy át a következő űrlapra. */
export function kovetkezoLepesek(kalk, e) {
  switch (kalk) {
    default: return [];
  }
}
/** A link paraméterei: csak a kitöltött értékek. */
export function kovetkezoQuery(q) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q || {})) if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}
