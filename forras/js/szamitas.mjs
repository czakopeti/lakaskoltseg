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

/* ---------------- Mennyi hitelt kaphatsz ---------------- */
/** A havi törlesztőből felvehető hitel (annuitás jelenértéke), éves névleges kamatból. */
export function hitelTorlesztobol(havi, honapok, kamatSzazalek) {
  const r = kamatSzazalek / 100 / 12;
  return r > 0 ? havi * (1 - Math.pow(1 + r, -honapok)) / r : havi * honapok;
}
/**
 * b: { jovedelem (havi nettó, a háztartásé), meglevo (meglévő havi törlesztők), periodus: 'rovid' | 'kozep' | 'hosszu', zold, kamat (%), futamido (év), ertek, elsoLakas }
 * A JTM a törlesztőt, a HFM a hitelt korlátozza az ingatlan értékéhez képest; a kisebbik a felvehető.
 */
export function hitelkepesseg(adat, b) {
  const jov = Number(b.jovedelem);
  if (!(jov > 0)) return { hiba: 'Add meg a havi nettó jövedelmet.' };
  const j = szabaly(adat, 'hitel.jtm').ertek, h = szabaly(adat, 'hitel.hfm').ertek;
  const per = ['rovid', 'kozep', 'hosszu'].includes(b.periodus) ? b.periodus : 'hosszu';
  const felette = jov >= j.kuszob_ft;
  let jtm = (felette ? j.felette : j.alatta)[per];
  if (b.zold && per === 'hosszu' && !felette) jtm = j.zold_alatta_hosszu;
  const meglevo = nem0(b.meglevo);
  const maxTorleszto = Math.max(0, jov * jtm / 100 - meglevo);
  const ev = Number(b.futamido) > 0 ? Number(b.futamido) : 25;
  const kamat = Number(b.kamat) > 0 ? Number(b.kamat) : szabaly(adat, 'wekerle_plusz.piaci_kamat').ertek.szazalek;
  const kamatSajat = Number(b.kamat) > 0;
  const jtmHitel = Math.floor(hitelTorlesztobol(maxTorleszto, ev * 12, kamat) / 1000) * 1000;
  const ertek = nem0(b.ertek);
  const hfm = b.elsoLakas || b.zold ? h.elso_lakas : h.altalanos;
  const hfmHitel = ertek ? Math.floor(ertek * hfm / 100) : null;
  const max = hfmHitel === null ? jtmHitel : Math.min(jtmHitel, hfmHitel);
  const kot = hfmHitel === null ? 'jtm' : jtmHitel <= hfmHitel ? 'jtm' : 'hfm';
  // Ugyanebből a jövedelemből a Wekerle Plusszal: a kamat a teljes futamidőre fix, ezért a leghosszabb kamatperiódus korlátja érvényes
  const wp = szabaly(adat, 'wekerle_plusz.kamat').ertek, wo = szabaly(adat, 'wekerle_plusz.osszeg').ertek;
  const jtmHosszu = (felette ? j.felette : j.alatta).hosszu;
  const wpTorl = Math.max(0, jov * jtmHosszu / 100 - meglevo);
  const wekerle = ['uj_szazalek', 'hasznalt_szazalek'].map((k) => ({ kamat: wp[k], hitel: Math.min(wo.max_ft, Math.floor(hitelTorlesztobol(wpTorl, Math.min(ev, wo.max_ev) * 12, wp[k]) / 1000) * 1000) }));
  return { jov, jtm, felette, kuszob: j.kuszob_ft, per, meglevo, maxTorleszto: Math.round(maxTorleszto), ev, kamat, kamatSajat, jtmHitel, ertek, hfm, hfmHitel, max, kot,
    onero: ertek ? Math.max(0, ertek - max) : null, havi: Math.round(torlesztoKamatbol(max, ev * 12, kamat)), wekerle };
}

/* ---------------- Öröklés és ajándékozás illetéke ---------------- */
/** b: { jogcim: 'orokles' | 'ajandek', vagyon: 'lakas' | 'egyeb', ertek, hanyad (%), terhek, haszonelvezoKor (ha az ajándékozó haszonélvezetet tart meg), rokonsag } */
export function ingyenesIlletek(adat, b) {
  const ertek = Number(b.ertek);
  if (!(ertek > 0)) return { hiba: 'Add meg az ingatlan forgalmi értékét.' };
  const m = szabaly(adat, 'ingyenes.mertek').ertek;
  const hanyad = b.hanyad === '' || b.hanyad == null ? 100 : Number(b.hanyad);
  if (!(hanyad > 0 && hanyad <= 100)) return { hiba: 'A tulajdoni hányad 1 és 100% között lehet.' };
  const resz = ertek * hanyad / 100;
  const he = b.haszonelvezoKor !== '' && b.haszonelvezoKor != null && Number(b.haszonelvezoKor) > 0 ? haszonelvezet(adat, { ertek: resz, tipus: 'holtig', kor: Number(b.haszonelvezoKor) }) : null;
  const terhek = nem0(b.terhek);
  const tiszta = Math.max(0, resz - terhek - (he ? he.jog : 0));
  const mentesKor = szabaly(adat, 'ingyenes.mentes').ertek.kor;
  const mentes = mentesKor.includes(b.rokonsag);
  const kulcs = b.vagyon === 'egyeb' ? m.altalanos : m.lakas;
  return { jogcim: b.jogcim === 'ajandek' ? 'ajandek' : 'orokles', ertek, hanyad, resz, terhek, haszonelvezet: he, tiszta, kulcs, mentes, rokonsag: b.rokonsag || '', ado: mentes ? 0 : Math.round(tiszta * kulcs / 100), adoMentesNelkul: Math.round(tiszta * kulcs / 100) };
}

/* ---------------- Haszonélvezet értéke ---------------- */
/** b: { ertek, tipus: 'holtig' | 'hatarozott' | 'hatarozatlan', kor, evek, rokon } */
export function haszonelvezet(adat, b) {
  const ertek = Number(b.ertek);
  if (!(ertek > 0)) return { hiba: 'Add meg a lakás forgalmi értékét.' };
  const egy = ertek / szabaly(adat, 'haszonelvezet.egyevi').ertek.osztoja;
  const savok = szabaly(adat, 'haszonelvezet.szorzo').ertek.savok;
  const hz = szabaly(adat, 'haszonelvezet.hatarozott').ertek;
  const korSzorzo = (k) => (savok.find(([a, c]) => k >= a && k <= c) || savok[savok.length - 1])[2];
  const tipus = ['holtig', 'hatarozott', 'hatarozatlan'].includes(b.tipus) ? b.tipus : 'holtig';
  const kor = Number(b.kor);
  let szorzo;
  if (tipus === 'holtig') {
    if (!(kor >= 0 && b.kor !== '' && b.kor != null)) return { hiba: 'Add meg a haszonélvező életkorát.' };
    szorzo = korSzorzo(kor);
  } else if (tipus === 'hatarozott') {
    const evek = Number(b.evek);
    if (!(evek > 0)) return { hiba: 'Add meg, hány évre szól a haszonélvezet.' };
    szorzo = Math.min(evek, hz.max_szorzo, kor > 0 ? korSzorzo(kor) : hz.max_szorzo);
  } else szorzo = hz.hatarozatlan;
  const jog = Math.round(egy * szorzo);
  const csupasz = ertek - jog;
  const l = szabaly(adat, 'haszonelvezet.lemondas').ertek;
  const rokon = !!b.rokon;
  return { ertek, egy: Math.round(egy), tipus, kor, szorzo, jog, csupasz, szazalek: jog / ertek * 100, rokon, savok,
    esetek: [
      { kulcs: 'vetel', nev: 'Megveszed a haszonélvezettel terhelt lakást', alap: csupasz, ado: altalanosIlletek(adat, csupasz), al: 'a vevő a haszonélvezettel csökkentett érték után fizet' },
      { kulcs: 'lemondas_ingyen', nev: 'A haszonélvező ingyen lemond, és a tulajdonosé lesz', alap: jog, ado: rokon ? 0 : Math.round(jog * l.ingyenes / 100), al: rokon ? 'egyenes ági rokonok és házastársak között mentes' : `a haszonélvezet értékének ${l.ingyenes}%-a ajándékozási illeték` },
      { kulcs: 'lemondas_penzert', nev: 'A haszonélvező pénzért mond le', alap: jog, ado: rokon ? 0 : altalanosIlletek(adat, jog), al: rokon ? 'egyenes ági rokonok és házastársak között mentes' : `a haszonélvezet értékének ${l.ellenertek}%-a visszterhes illeték` },
    ] };
}

/* ---------------- Előtörlesztés ---------------- */
function futtat(toke, r, havi, maxHonap) {
  let t = toke, kamat = 0, n = 0;
  while (t > 0.5 && n < maxHonap + 1200) { const k = t * r; kamat += k; t = t + k - havi; n++; if (t < 0) t = 0; }
  return { kamat, honap: n };
}
/** b: { toke (fennálló tartozás), kamat (%), honap (hátralévő hónapok), osszeg (előtörlesztés), dij (%) } */
export function elotorlesztes(adat, b) {
  const toke = Number(b.toke), kamat = Number(b.kamat), n = Math.round(Number(b.honap)), o = Number(b.osszeg);
  if (!(toke > 0)) return { hiba: 'Add meg a fennálló tartozást.' };
  if (!(kamat >= 0) || b.kamat === '' || b.kamat == null) return { hiba: 'Add meg a hitel kamatát.' };
  if (!(n > 0)) return { hiba: 'Add meg, hány hónap van még hátra.' };
  if (!(o > 0)) return { hiba: 'Add meg, mennyit törlesztenél elő.' };
  if (o >= toke) return { hiba: 'Ez a teljes tartozás: ilyenkor végtörlesztésről van szó, a megtakarítás a hátralévő kamat egésze.' };
  const r = kamat / 100 / 12;
  const havi = torlesztoKamatbol(toke, n, kamat);
  const alapKamat = havi * n - toke;
  const uj = toke - o;
  const A = futtat(uj, r, havi, n);
  const haviB = torlesztoKamatbol(uj, n, kamat);
  const B = { kamat: haviB * n - uj, honap: n };
  const dijSz = b.dij === '' || b.dij == null ? szabaly(adat, 'elotorlesztes.mfl_dij').ertek.max_szazalek : Number(b.dij);
  const dij = Math.round(o * dijSz / 100);
  const mA = alapKamat - A.kamat, mB = alapKamat - B.kamat;
  return { toke, kamat, n, havi: Math.round(havi), osszeg: o, dijSz, dijSajat: !(b.dij === '' || b.dij == null), dij, alapKamat: Math.round(alapKamat),
    futamido: { honap: A.honap, rovidul: n - A.honap, megtakaritas: Math.round(mA), netto: Math.round(mA - dij) },
    torleszto: { havi: Math.round(haviB), csokken: Math.round(havi - haviB), megtakaritas: Math.round(mB), netto: Math.round(mB - dij) },
    jobb: mA >= mB ? 'futamido' : 'torleszto' };
}

/* ---------------- Bérleti díj emelése az inflációval ---------------- */
/** b: { dij, ev (melyik év átlagos inflációjával), sajat (%) } */
export function berletiEmeles(adat, b) {
  const dij = Number(b.dij);
  if (!(dij > 0)) return { hiba: 'Add meg a mostani havi bérleti díjat.' };
  const evek = Object.keys(adat.inflacio.evek).sort();
  const sajat = b.sajat !== '' && b.sajat != null && !Number.isNaN(Number(b.sajat));
  const ev = evek.includes(String(b.ev)) ? String(b.ev) : evek[evek.length - 1];
  const p = sajat ? Number(b.sajat) : adat.inflacio.evek[ev].szazalek;
  const uj = Math.round(dij * (1 + p / 100));
  return { dij, ev, p, sajat, uj, havi: uj - dij, evi: (uj - dij) * 12, forras: sajat ? null : adat.inflacio.evek[ev].forras, evek: evek.map((e) => ({ ev: e, szazalek: adat.inflacio.evek[e].szazalek })) };
}

/* ---------------- Megéri kiadásra venni? ---------------- */
/** b: { vetelar, egyeb (ügyvéd, egyéb vételi költség), felujitas, havi (bérleti díj), honap (kiadott hónap egy évben), koltseg (évi), ev } */
export function hozam(adat, b) {
  const ar = Number(b.vetelar), havi = Number(b.havi);
  if (!(ar > 0)) return { hiba: 'Add meg a vételárat.' };
  if (!(havi > 0)) return { hiba: 'Add meg a várható havi bérleti díjat.' };
  const honap = b.honap === '' || b.honap == null ? 11 : Math.round(Number(b.honap));
  if (!(honap >= 1 && honap <= 12)) return { hiba: 'Hány hónapig lesz kiadva egy évben? 1 és 12 között.' };
  const ill = altalanosIlletek(adat, ar);
  const beruhazas = ar + ill + nem0(b.egyeb) + nem0(b.felujitas);
  const bevetel = havi * honap;
  const koltseg = nem0(b.koltseg);
  const ad = berbeadas(adat, { havi, honap, koltseg, ev: b.ev });
  const netto = bevetel - koltseg - ad.ado;
  return { ar, illetek: ill, egyeb: nem0(b.egyeb), felujitas: nem0(b.felujitas), beruhazas, havi, honap, bevetel, koltseg, ado: ad.ado, adoModszer: ad.jobb, netto,
    brutto: bevetel / beruhazas * 100, nettoHozam: netto / beruhazas * 100, megterules: netto > 0 ? beruhazas / netto : null };
}

/* ---------------- Következő lépés ---------------- */
/** Kalkulátoronként legfeljebb két ajánlás: { cel, cim, szoveg, q }. Csak a látogató által beírt adat megy át a következő űrlapra. */
export function kovetkezoLepesek(kalk, e) {
  switch (kalk) {
    case 'eladas': return [{ cel: 'lakasvaltas', cim: 'Az árából másik lakást veszel?', szoveg: 'Eladás és vétel egy lapon: az adó, az illeték a cserét pótló kedvezménnyel, és mennyi hitel kell.', q: { eladasiAr: e.eladasiAr, szerzesEv: e.szerzesEv, szerzesiErtek: e.szerzesiErtek } }];
    case 'illetek': return [{ cel: 'wekerle', cim: 'Megkapod a Wekerle Plusz hitelt?', szoveg: 'Feltételenként a rendelet szerint, és a havi törlesztő 3% vagy 5% kamattal.', q: { vetelar: e.ertek } }];
    case 'wekerle': return [{ cel: 'illetek', cim: 'Mennyi lesz az illeték, és jár-e kedvezmény?', szoveg: 'A Wekerle Plusz nem ad mentességet, de más kedvezmény járhat.', q: { ertek: e.vetelar } }];
    case 'lakasvaltas': return [{ cel: 'illetek', cim: 'Az illeték részletesen, minden kedvezménnyel', szoveg: 'Tulajdoni hányad, új lakás, 35 év alatti első lakás, rokontól vétel.', q: { ertek: e.vetelar, eladottErtek: e.eladasiAr, eladasMikor: e.sorrend === 'elobb_vesz' ? 'utana' : 'elotte' } }];
    case 'hitelkepesseg': return [{ cel: 'wekerle', cim: 'Megkapod a Wekerle Plusz hitelt?', szoveg: 'Feltételenként a rendelet szerint, 3% vagy 5% fix kamattal.', q: { vetelar: e.ertek } }];
    case 'hozam': return [{ cel: 'kiadas', cim: 'Az adó részletesen: 10% vagy tételes?', szoveg: 'A döntési pont és a negyedéves adóelőleg határidői.', q: { havi: e.havi, honap: e.honap, koltseg: e.koltseg } }];
    case 'emeles': return [{ cel: 'kiadas', cim: 'Mennyi adót fizetsz az új díj után?', szoveg: '10% költséghányaddal vagy tételesen.', q: { havi: e.dij } }];
    case 'ingyenes': return [{ cel: 'haszonelvezet', cim: 'Mennyit ér a haszonélvezet?', szoveg: 'Az életkor szerinti szorzóval, és mi a teendő, ha lemond róla.', q: { ertek: e.ertek } }];
    case 'haszonelvezet': return [{ cel: 'eladas', cim: 'Ha egyszer eladod: mennyi lesz az adó?', szoveg: 'A szerzés évéből és az árakból.', q: {} }];
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
