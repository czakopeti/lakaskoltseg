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
/**
 * Egész napos események .ics fájlként, mindegyik előtt egy héttel emlékeztetővel.
 * Egy esemény ({ nap, cim, leiras }) vagy { esemenyek: [...] }. nap: YYYY-MM-DD
 */
export function naptarFajl(b) {
  const host = b.host || 'lakaskoltseg', az = b.azonosito || 'hatarido';
  const lista = b.esemenyek || [b];
  const ev = (e, i) => {
    const d = e.nap.replace(/-/g, '');
    const kov = new Date(Date.parse(`${e.nap}T00:00:00Z`) + 86400000).toISOString().slice(0, 10).replace(/-/g, '');
    return ['BEGIN:VEVENT', `UID:${az}-${i}-${d}@${host}`, `DTSTAMP:${d}T000000Z`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${kov}`, `SUMMARY:${icsEsc(e.cim)}`, `DESCRIPTION:${icsEsc(e.leiras || '')}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(e.cim)}`, 'TRIGGER:-P7D', 'END:VALARM', 'END:VEVENT'];
  };
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${host}//Hataridok//HU`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...lista.flatMap(ev), 'END:VCALENDAR', ''].join('\r\n');
}

/* ---------------- Vagyonszerzési illeték ---------------- */
const nem0 = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? 0 : Math.max(0, Number(v)));
/** Az általános illeték egy alapra: 4%, az 1 milliárd forint feletti részre 2%, ingatlanonként legfeljebb 200 millió forint. */
export function altalanosIlletek(adat, alap) {
  const m = szabaly(adat, 'illetek.altalanos_mertek').ertek.szazalek;
  const n = szabaly(adat, 'illetek.nagy_ertek').ertek;
  const a = Math.max(0, alap);
  return Math.round(Math.min(Math.min(a, n.hatar_ft) * m / 100 + Math.max(0, a - n.hatar_ft) * n.szazalek_felette / 100, n.felso_hatar_ft));
}
/**
 * b: { ertek, hanyad (%), ujVallalkozotol, rokon, csok, elso, fiatal35, eladottErtek, eladottHanyad (%), eladasMikor: 'elotte' | 'utana' | 'regebben' }
 * Minden kedvezményt kiszámol, amely jár, és a legkedvezőbbet választja.
 */
export function illetek(adat, b) {
  const ertek = Number(b.ertek);
  if (!(ertek > 0)) return { hiba: 'Add meg a lakás vételárát.' };
  const hanyad = b.hanyad === '' || b.hanyad == null ? 100 : Number(b.hanyad);
  if (!(hanyad > 0 && hanyad <= 100)) return { hiba: 'A tulajdoni hányad 1 és 100% között lehet.' };
  const alap = ertek * hanyad / 100;
  const alt = altalanosIlletek(adat, alap);
  const sz = (k) => szabaly(adat, `illetek.${k}`);
  const l = [{ kulcs: 'altalanos', nev: 'Általános mérték', ado: alt, jar: true, miert: `a ${hanyad < 100 ? `rád eső ${fmtSzam(alap)} Ft ` : ''}forgalmi érték ${sz('altalanos_mertek').ertek.szazalek}%-a` }];
  if (b.rokon) l.push({ kulcs: 'egyenesagi', nev: 'Egyenes ági rokontól vagy házastárstól', ado: 0, jar: true, miert: 'illetékmentes' });
  if (b.csok) l.push({ kulcs: 'csok_plusz', nev: 'CSOK Plusz vagy falusi CSOK', ado: 0, jar: true, miert: 'illetékmentes' });
  const eladott = nem0(b.eladottErtek) * (b.eladottHanyad === '' || b.eladottHanyad == null ? 100 : Number(b.eladottHanyad)) / 100;
  const cs = sz('cserepotlo').ertek;
  if (eladott > 0) {
    const ablakban = b.eladasMikor === 'elotte' || b.eladasMikor === 'utana';
    l.push({ kulcs: 'cserepotlo', nev: 'Cserét pótló vétel', ado: ablakban ? altalanosIlletek(adat, alap - eladott) : null, jar: ablakban, kulonbozet: Math.max(0, alap - eladott), eladott,
      miert: ablakban ? (alap <= eladott ? 'az új lakás nem drágább az eladottnál' : `a ${fmtSzam(alap - eladott)} Ft különbözet ${sz('altalanos_mertek').ertek.szazalek}%-a`) : `csak akkor jár, ha az eladás a vétel előtt ${cs.elotte_ev} éven belül vagy utána ${cs.utana_ev} éven belül történik` });
  }
  const uj = sz('uj_lakas').ertek;
  if (b.ujVallalkozotol) {
    const jar = ertek <= uj.ertekhatar_ft;
    l.push({ kulcs: 'uj_lakas', nev: 'Új lakás vállalkozótól', ado: jar ? (ertek <= uj.mentes_resz_ft ? 0 : alt - altalanosIlletek(adat, uj.mentes_resz_ft * hanyad / 100)) : null, jar,
      miert: jar ? (ertek <= uj.mentes_resz_ft ? `${fmtSzam(uj.mentes_resz_ft)} Ft-ig illetékmentes` : `a ${fmtSzam(uj.mentes_resz_ft)} Ft-ra eső illetéket nem kell megfizetni`) : `csak ${fmtSzam(uj.ertekhatar_ft)} Ft-os forgalmi értékig jár` });
  }
  const f = sz('elso_lakas_35').ertek;
  if (b.elso && b.fiatal35) {
    const jar = ertek <= f.ertekhatar_ft;
    l.push({ kulcs: 'elso_lakas_35', nev: '35 év alatti első lakásszerző', ado: jar ? Math.round(alt * (100 - f.kedvezmeny_szazalek) / 100) : null, jar,
      miert: jar ? `az illeték ${f.kedvezmeny_szazalek}%-a` : `csak akkor jár, ha az egész lakás legfeljebb ${fmtSzam(f.ertekhatar_ft)} Ft-ot ér` });
  }
  const jaro = l.filter((x) => x.jar);
  const legjobb = jaro.reduce((m, x) => (x.ado < m.ado ? x : m), jaro[0]);
  return { ertek, hanyad, alap, altalanos: alt, lehetosegek: l, legjobb, ado: legjobb.ado, megtakaritas: alt - legjobb.ado,
    reszletben: b.elso ? f.reszlet_honap : 0, hatarido_nap: sz('fizetesi_hatarido').ertek.nap };
}
const fmtSzam = (n) => new Intl.NumberFormat('hu-HU', { useGrouping: 'always' }).format(Math.round(n));

/* ---------------- Wekerle Plusz ---------------- */
/**
 * b: { eletkor, eletkor2 (közös igénylésnél), tulajdon: 'nincs' | 'kicsi' | 'kivetel' | 'van', ingatlan: 'lakas' | 'haz', allapot: 'uj' | 'hasznalt',
 *      vetelar, alapterulet, onero, futamido (év), piaciKamat (%) }
 * Feltételenként { nev, ok: true | false | null (nincs megadva), szoveg, par } a rendelet paragrafusával.
 */
export function wekerle(adat, b) {
  const w = (k) => szabaly(adat, `wekerle_plusz.${k}`).ertek;
  const ar = Number(b.vetelar);
  if (!(ar > 0)) return { hiba: 'Add meg a vételárat.' };
  const kor = w('eletkor'), kam = w('kamat'), ossz = w('osszeg'), on = w('onero'), eh = w('ertekhatar'), ml = w('meglevo_lakas');
  const van = (v) => v !== '' && v != null && !Number.isNaN(Number(v));
  const korOk = (x) => (van(x) ? Number(x) >= kor.tol && Number(x) < kor.ig : null);
  const f = [];
  const k1 = korOk(b.eletkor), k2 = van(b.eletkor2) ? korOk(b.eletkor2) : true;
  f.push({ kulcs: 'eletkor', nev: 'Életkor', ok: k1 === null ? null : k1 && k2, par: '2. § 4. pont', szoveg: `${kor.tol} évesen már, a ${kor.ig}. születésnapodig még igényelheted${van(b.eletkor2) ? ', közös igénylésnél mindkettőtöknek' : ''}.` });
  const tok = { nincs: true, kicsi: true, kivetel: true, van: false }[b.tulajdon] ?? null;
  f.push({ kulcs: 'tulajdon', nev: 'Meglévő lakástulajdon', ok: tok, par: '11. §', szoveg: `Nem lehet és nem is lehetett ${ml.max_hanyad_szazalek}% feletti tulajdonod lakásban. Kivétel a legfeljebb ${fmtSzam(ml.kivetel_ertek_ft)} Ft-ot érő, a lebontott és a haszonélvezettel terhelt lakás.` });
  const max = b.ingatlan === 'haz' ? eh.haz_max_ft : eh.lakas_max_ft;
  f.push({ kulcs: 'vetelar', nev: 'Vételár', ok: ar <= max, par: '14. § (2)', szoveg: `${b.ingatlan === 'haz' ? 'Családi háznál' : 'Lakásnál'} legfeljebb bruttó ${fmtSzam(max)} Ft.` });
  const nm = van(b.alapterulet) && Number(b.alapterulet) > 0 ? ar / Number(b.alapterulet) : null;
  f.push({ kulcs: 'nmar', nev: 'Négyzetméterár', ok: nm === null ? null : nm <= eh.nm_max_ft, par: '15. §', ertek: nm, szoveg: `Legfeljebb bruttó ${fmtSzam(eh.nm_max_ft)} Ft/m²${nm ? `. Nálad ${fmtSzam(nm)} Ft/m²` : ''}.` });
  const onero = nem0(b.onero);
  const kert = Math.max(0, ar - onero);
  const minOnero = Math.ceil(ar * on.min_szazalek / 100);
  f.push({ kulcs: 'onero', nev: 'Önerő', ok: van(b.onero) ? onero >= minOnero : null, par: '35. §', szoveg: `Legalább a vételár ${on.min_szazalek}%-a, vagyis ${fmtSzam(minOnero)} Ft. Megfelelő pótfedezettel kevesebb is lehet.` });
  f.push({ kulcs: 'osszeg', nev: 'Hitelösszeg', ok: van(b.onero) ? kert <= ossz.max_ft : null, par: '31. § (1)', szoveg: `Legfeljebb ${fmtSzam(ossz.max_ft)} Ft${van(b.onero) && kert > ossz.max_ft ? `. Ehhez ${fmtSzam(ar - ossz.max_ft)} Ft önerő kell` : ''}.` });
  const ev = van(b.futamido) && Number(b.futamido) > 0 ? Math.min(Number(b.futamido), ossz.max_ev) : ossz.max_ev;
  const hitel = van(b.onero) ? Math.min(kert, ossz.max_ft) : Math.min(ar - minOnero, ossz.max_ft);
  const kamat = b.allapot === 'uj' ? kam.uj_szazalek : kam.hasznalt_szazalek;
  const havi = torlesztoKamatbol(hitel, ev * 12, kamat);
  const pk = van(b.piaciKamat) && Number(b.piaciKamat) > 0 ? Number(b.piaciKamat) : w('piaci_kamat').szazalek;
  const piaciHavi = torlesztoKamatbol(hitel, ev * 12, pk);
  const ill = illetek(adat, { ertek: ar, ujVallalkozotol: b.allapot === 'uj' && b.ujVallalkozotol });
  const nemOk = f.filter((x) => x.ok === false), hianyzik = f.filter((x) => x.ok === null);
  return { ar, hitel, onero: van(b.onero) ? onero : minOnero, oneroFeltetelezett: !van(b.onero), ev, kamat, havi: Math.round(havi), osszesen: Math.round(havi * ev * 12), kamatOssz: Math.round(havi * ev * 12 - hitel),
    piaciKamat: pk, piaciSajat: van(b.piaciKamat), piaciHavi: Math.round(piaciHavi), megtakaritas: Math.round((piaciHavi - havi) * ev * 12),
    feltetelek: f, jogosult: nemOk.length ? false : hianyzik.length ? null : true, nemOk, hianyzik, illetek: ill.hiba ? 0 : ill.ado, bentlakas: w('bentlakas').ev };
}

/* ---------------- Lakáskiadás adója ---------------- */
/**
 * b: { havi, honap, egyeb (évi egyéb bevétel), koltseg (évi igazolt költség), ertekcsokkenes (évi), berelt (évi bérleti díj máshol), ev }
 * Mindkét módszert kiszámolja; a döntési pont az a költségösszeg, amely felett a tételes elszámolás az olcsóbb.
 */
export function berbeadas(adat, b) {
  const sz = (k) => szabaly(adat, `berbeadas.${k}`).ertek;
  const havi = Number(b.havi);
  if (!(havi > 0)) return { hiba: 'Add meg a havi bérleti díjat.' };
  const honap = b.honap === '' || b.honap == null ? 12 : Math.round(Number(b.honap));
  if (!(honap >= 1 && honap <= 12)) return { hiba: 'Hány hónapig adod ki? 1 és 12 között.' };
  const kulcs = sz('ado_mertek').szazalek, kh = sz('koltseghanyad').szazalek;
  const bevetel = havi * honap + nem0(b.egyeb);
  const berelt = Math.min(nem0(b.berelt), bevetel);
  const alap = bevetel - berelt;
  const koltseg = nem0(b.koltseg) + nem0(b.ertekcsokkenes);
  const A = { jovedelem: alap * (100 - kh) / 100 }; A.ado = Math.round(A.jovedelem * kulcs / 100);
  const B = { jovedelem: Math.max(0, alap - koltseg) }; B.ado = Math.round(B.jovedelem * kulcs / 100);
  const ev = Number(b.ev) || new Date().getFullYear();
  const nap = String(sz('adoeloleg').nap).padStart(2, '0');
  const bev = sz('bevallas');
  const jobb = B.ado < A.ado ? 'teteles' : 'koltseghanyad';
  const ado = Math.min(A.ado, B.ado);
  return { havi, honap, bevetel, berelt, alap, koltseg, kh, kulcs, A, B, jobb, ado, dontesiPont: Math.round(alap * kh / 100), kulonbseg: Math.abs(A.ado - B.ado), haviAdo: Math.round(ado / honap),
    elolegek: [`${ev}-04-${nap}`, `${ev}-07-${nap}`, `${ev}-10-${nap}`, `${ev + 1}-01-${nap}`].map((nap, i) => ({ nap, negyedev: i + 1 })),
    bevallas: `${ev + 1}-${String(bev.honap).padStart(2, '0')}-${String(bev.nap).padStart(2, '0')}`, ev };
}

/* ---------------- Lakásváltás: eladás és vétel együtt ---------------- */
/**
 * b: { eladasiAr, szerzesEv, szerzesiErtek, koltsegek (levonható, összesen), kozvetito (Ft), hitelTartozas, vetelar, vetelKoltseg (ügyvéd, értékbecslés…), megtakaritas, eladasEv, sorrend: 'elobb_elad' | 'elobb_vesz' }
 */
export function lakasvaltas(adat, b) {
  const elado = Number(b.eladasiAr), vetel = Number(b.vetelar);
  if (!(elado > 0)) return { hiba: 'Add meg, mennyiért adod el a mostani lakásodat.' };
  if (!(vetel > 0)) return { hiba: 'Add meg az új lakás vételárát.' };
  const eladasEv = Number(b.eladasEv) || new Date().getFullYear();
  const kozvetito = nem0(b.kozvetito);
  let szja = { ado: 0, hanyad: 0, nincs: true };
  if (b.szerzesEv !== '' && b.szerzesEv != null && b.szerzesiErtek !== '' && b.szerzesiErtek != null) {
    szja = eladasSzja(adat, { eladasEv, szerzesEv: Number(b.szerzesEv), eladasiAr: elado, szerzesiErtek: Number(b.szerzesiErtek), szerzesKoltseg: nem0(b.koltsegek), eladasKoltseg: kozvetito });
    if (szja.hiba) return szja;
  }
  const ill = illetek(adat, { ertek: vetel, eladottErtek: elado, eladasMikor: b.sorrend === 'elobb_vesz' ? 'utana' : 'elotte' });
  const tartozas = nem0(b.hitelTartozas);
  const kapsz = elado - kozvetito - tartozas - szja.ado;
  const kell = vetel + ill.ado + nem0(b.vetelKoltseg);
  const megtakaritas = nem0(b.megtakaritas);
  const hiany = kell - kapsz - megtakaritas;
  return { elado, vetel, kozvetito, tartozas, szja, illetek: ill, illetekNelkul: ill.altalanos, illetekMegtakaritas: ill.altalanos - ill.ado, vetelKoltseg: nem0(b.vetelKoltseg), kapsz, kell, megtakaritas, hiany,
    sorrend: b.sorrend === 'elobb_vesz' ? 'elobb_vesz' : 'elobb_elad', utanaEv: szabaly(adat, 'illetek.cserepotlo').ertek.utana_ev, elotteEv: szabaly(adat, 'illetek.cserepotlo').ertek.elotte_ev, szjaHianyzik: szja.nincs === true };
}

/* ---------------- Következő lépés ---------------- */
/** Kalkulátoronként legfeljebb két ajánlás: { cel, cim, szoveg, q }. Csak a látogató által beírt adat megy át a következő űrlapra. */
export function kovetkezoLepesek(kalk, e) {
  switch (kalk) {
    case 'eladas': return [{ cel: 'lakasvaltas', cim: 'Az árából másik lakást veszel?', szoveg: 'Eladás és vétel egy lapon: az adó, az illeték a cserét pótló kedvezménnyel, és mennyi hitel kell.', q: { eladasiAr: e.eladasiAr, szerzesEv: e.szerzesEv, szerzesiErtek: e.szerzesiErtek } }];
    case 'illetek': return [{ cel: 'wekerle', cim: 'Megkapod a Wekerle Plusz hitelt?', szoveg: 'Feltételenként a rendelet szerint, és a havi törlesztő 3% vagy 5% kamattal.', q: { vetelar: e.ertek } }];
    case 'wekerle': return [{ cel: 'illetek', cim: 'Mennyi lesz az illeték, és jár-e kedvezmény?', szoveg: 'A Wekerle Plusz nem ad mentességet, de más kedvezmény járhat.', q: { ertek: e.vetelar } }];
    case 'lakasvaltas': return [{ cel: 'illetek', cim: 'Az illeték részletesen, minden kedvezménnyel', szoveg: 'Tulajdoni hányad, új lakás, 35 év alatti első lakás, rokontól vétel.', q: { ertek: e.vetelar, eladottErtek: e.eladasiAr, eladasMikor: e.sorrend === 'elobb_vesz' ? 'utana' : 'elotte' } }];
    case 'kiadas': return [{ cel: 'eladas', cim: 'Ha egyszer eladnád: mennyi lenne az adó?', szoveg: 'A szerzés évéből és az árakból, évről évre csökkenő skálával.', q: {} }];
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
