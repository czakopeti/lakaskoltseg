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

/* ---------------- Ingatlaneladás szja-ja ---------------- */
/**
 * b: { eladasEv, szerzesEv, eladasiAr, szerzesiErtek, szerzesKoltseg, beruhazas, eladasKoltseg }
 * A számított összeg a bevétel mínusz a költségek. Ebből a szerzés óta eltelt évek szerint lesz jövedelem (Szja tv. 62. §).
 */
export function eladasSzja(adat, b) {
  const szam = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? 0 : Math.max(0, Number(v)));
  const ar = Number(b.eladasiAr), szerzesEv = Math.round(Number(b.szerzesEv)), eladasEv = Math.round(Number(b.eladasEv));
  if (!(ar > 0)) return { hiba: 'Add meg az eladási árat.' };
  if (!(szerzesEv > 1900)) return { hiba: 'Add meg, melyik évben szerezted az ingatlant.' };
  if (!(eladasEv > 1900)) return { hiba: 'Add meg az eladás évét.' };
  if (szerzesEv > eladasEv) return { hiba: 'A szerzés éve nem lehet későbbi, mint az eladásé.' };
  if (b.szerzesiErtek === '' || b.szerzesiErtek == null || Number.isNaN(Number(b.szerzesiErtek))) return { hiba: 'Add meg, mennyiért szerezted.' };
  const tabla = szabaly(adat, 'szja_eladas.jovedelem_hanyad').ertek.szazalek_evenkent;
  const kulcs = szabaly(adat, 'szja_eladas.ado_mertek').ertek.szazalek;
  const bev = szabaly(adat, 'szja_eladas.bevallas').ertek;
  const reszlet = szabaly(adat, 'szja_eladas.reszletfizetes').ertek;
  const tetelek = { szerzesiErtek: szam(b.szerzesiErtek), szerzesKoltseg: szam(b.szerzesKoltseg), beruhazas: szam(b.beruhazas), eladasKoltseg: szam(b.eladasKoltseg) };
  const osszKoltseg = Object.values(tetelek).reduce((x, y) => x + y, 0);
  const koltseg = Math.min(osszKoltseg, ar); // a költség nem haladhatja meg a bevételt
  const szamitott = ar - koltseg;
  const evek = eladasEv - szerzesEv;
  const hanyad = tabla[Math.min(evek, tabla.length - 1)];
  const jovedelem = szamitott * hanyad / 100;
  const ado = Math.round(jovedelem * kulcs / 100);
  const mentesEv = szerzesEv + tabla.length - 1;
  // a következő évi eladásnál mennyi lenne az adó (ha még nem mentes)
  const jovoreHanyad = tabla[Math.min(evek + 1, tabla.length - 1)];
  const jovoreAdo = Math.round(szamitott * jovoreHanyad / 100 * kulcs / 100);
  return {
    ar, szerzesEv, eladasEv, evek, tetelek, osszKoltseg, koltseg, levagva: osszKoltseg > ar, szamitott, hanyad, jovedelem, kulcs, ado,
    mentesEv, jovoreHanyad, jovoreAdo, veszteseg: szamitott === 0 && hanyad > 0,
    bevallas: `${eladasEv + 1}-${String(bev.honap).padStart(2, '0')}-${String(bev.nap).padStart(2, '0')}`,
    reszletben: ado > 0 && ado <= reszlet.hatar_ft ? reszlet.honap : 0,
    skala: tabla.map((sz, i) => ({ ev: szerzesEv + i, szazalek: sz, most: Math.min(evek, tabla.length - 1) === i })),
  };
}

/* ---------------- Határidő naptárfájlban ---------------- */
const icsEsc = (s) => String(s).replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
/** Egész napos esemény .ics fájlként, egy héttel előtte emlékeztetővel. nap: YYYY-MM-DD */
export function naptarFajl({ nap, cim, leiras = '', azonosito = 'hatarido', host = 'lakaskoltseg' }) {
  const d = nap.replace(/-/g, '');
  const kov = new Date(Date.parse(`${nap}T00:00:00Z`) + 86400000).toISOString().slice(0, 10).replace(/-/g, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${host}//Hataridok//HU`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:${azonosito}-${d}@${host}`, `DTSTAMP:${d}T000000Z`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${kov}`, `SUMMARY:${icsEsc(cim)}`, `DESCRIPTION:${icsEsc(leiras)}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(cim)}`, 'TRIGGER:-P7D', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
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
