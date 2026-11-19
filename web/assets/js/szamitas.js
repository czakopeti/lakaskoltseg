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
  const ismeretlen = b.ismeretlen === true;
  if (!ismeretlen && (b.szerzesiErtek === '' || b.szerzesiErtek == null || Number.isNaN(Number(b.szerzesiErtek)))) return { hiba: 'Add meg, mennyiért szerezted. Ha nem tudod megállapítani, jelöld be az erre szolgáló négyzetet.' };
  const tabla = szabaly(adat, 'szja_eladas.jovedelem_hanyad').ertek.szazalek_evenkent;
  const kulcs = szabaly(adat, 'szja_eladas.ado_mertek').ertek.szazalek;
  const bev = szabaly(adat, 'szja_eladas.bevallas').ertek;
  const reszlet = szabaly(adat, 'szja_eladas.reszletfizetes').ertek;
  // Állagmegóvás: csak az eladás előtti 24 hónapból, és csak ha meghaladja az eladási ár 5%-át (Szja tv. 3. § 32.)
  const am = szabaly(adat, 'szja_eladas.allagmegovas').ertek;
  const allagBeirt = szam(b.allagmegovas), allagHatar = Math.round(ar * am.szazalek_bevetel / 100);
  const allagJar = allagBeirt > allagHatar;
  const tetelek = { szerzesiErtek: szam(b.szerzesiErtek), szerzesKoltseg: szam(b.szerzesKoltseg), beruhazas: szam(b.beruhazas), allagmegovas: allagJar ? allagBeirt : 0, eladasKoltseg: szam(b.eladasKoltseg) };
  // Ha a szerzési érték nem állapítható meg: a bevétel 25%-a a számított összeg, más költség nélkül (Szja tv. 62. § (3))
  const ism = szabaly(adat, 'szja_eladas.ismeretlen_szerzes').ertek.szazalek;
  const osszKoltseg = ismeretlen ? 0 : Object.values(tetelek).reduce((x, y) => x + y, 0);
  const koltseg = Math.min(osszKoltseg, ar); // a költség nem haladhatja meg a bevételt
  const szamitott = ismeretlen ? Math.round(ar * ism / 100) : ar - koltseg;
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
    ismeretlen, ismSzazalek: ism, allagBeirt, allagHatar, allagJar, allagHonap: am.honap,
    megmarad: ar - szam(b.eladasKoltseg) - ado,
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
  const host = b.host || 'ingatlanmerleg', az = b.azonosito || 'hatarido';
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
  const sz = (k) => szabaly(adat, `illetek.${k}`);
  const resz = ertek * hanyad / 100;
  // Haszonélvezettel terhelt lakásnál a vevő a haszonélvezet értékével csökkentett érték után fizet (Itv. 19. §)
  const he = b.haszonelvezoKor !== '' && b.haszonelvezoKor != null && Number(b.haszonelvezoKor) >= 0 && !Number.isNaN(Number(b.haszonelvezoKor)) ? haszonelvezet(adat, { ertek: resz, tipus: 'holtig', kor: Number(b.haszonelvezoKor) }) : null;
  const alap = resz - (he && !he.hiba ? he.jog : 0);
  const alt = altalanosIlletek(adat, alap);
  const l = [{ kulcs: 'altalanos', nev: 'Általános mérték', ado: alt, jar: true, miert: `a ${hanyad < 100 ? `rád eső ${fmtSzam(alap)} Ft ` : ''}forgalmi érték ${sz('altalanos_mertek').ertek.szazalek}%-a` }];
  if (b.rokon) l.push({ kulcs: 'egyenesagi', nev: 'Egyenes ági rokontól vagy házastárstól', ado: 0, jar: true, miert: 'illetékmentes' });
  if (b.telek) l.push({ kulcs: 'telek', nev: 'Telek, 4 éven belüli építéssel', ado: 0, jar: true, miert: `illetékmentes, ha ${sz('telek').ertek.beepites_ev} éven belül lakóházat építesz rá` });
  if (b.csok) l.push({ kulcs: 'csok_plusz', nev: 'CSOK Plusz vagy falusi CSOK', ado: 0, jar: true, miert: 'illetékmentes' });
  const eladott = nem0(b.eladottErtek) * (b.eladottHanyad === '' || b.eladottHanyad == null ? 100 : Number(b.eladottHanyad)) / 100;
  const cs = sz('cserepotlo').ertek;
  if (eladott > 0) {
    // 'elotte': a vétel előtt 3 éven belül, 'elotte5': 3–5 éve, 'utana': a vétel után 1 éven belül.
    // A teljes mentesség (olcsóbb új lakás) csak 3 éven belüli eladásnál jár (Itv. 26. § (1) y)), a különbözet 5 éven belül (21. § (2) b)).
    const olcsobb = alap <= eladott;
    const ablakban = b.eladasMikor === 'elotte' || b.eladasMikor === 'utana' || (b.eladasMikor === 'elotte5' && !olcsobb);
    l.push({ kulcs: 'cserepotlo', nev: 'Cserét pótló vétel', ado: ablakban ? altalanosIlletek(adat, alap - eladott) : null, jar: ablakban, kulonbozet: Math.max(0, alap - eladott), eladott, vitas: b.eladasMikor === 'elotte5',
      miert: ablakban ? (olcsobb ? 'az új lakás nem drágább az eladottnál' : `a ${fmtSzam(alap - eladott)} Ft különbözet ${sz('altalanos_mertek').ertek.szazalek}%-a`)
        : b.eladasMikor === 'elotte5' ? `olcsóbb új lakásnál a mentesség csak ${cs.mentes_elotte_ev} éven belüli eladásnál jár` : `csak akkor jár, ha az eladás a vétel előtt ${cs.elotte_ev} éven belül vagy utána ${cs.utana_ev} éven belül történik` });
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
  return { ertek, hanyad, resz, haszonelvezet: he && !he.hiba ? he : null, alap, altalanos: alt, lehetosegek: l, legjobb, ado: legjobb.ado, megtakaritas: alt - legjobb.ado,
    reszletben: b.elso ? f.reszlet_honap : 0, hatarido_nap: sz('fizetesi_hatarido').ertek.nap,
    forgalmi: adat.lakasar ? forgalmiOsszevetes(adat, { ertek, terulet: b.terulet, megye: b.megye, telepTipus: b.telepTipus, uj: b.ujVallalkozotol }) : null };
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
  f.push({ kulcs: 'eletkor', nev: 'Életkor', ok: k1 === null ? null : k1 && k2, par: '2. § 4. pont', szoveg: `${kor.tol} éves kortól a ${kor.ig}. születésnapodig igényelheted${van(b.eletkor2) ? ', közös igénylésnél mindkettőtöknek' : ''}.` });
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
  if (o >= toke) return { hiba: 'Ez a teljes tartozás, vagyis végtörlesztés. Ilyenkor a teljes hátralévő kamatot megspórolod.' };
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
  // Hitellel: az önerő megtérülése. A törlesztő tőkerésze vagyon marad, a kamat költség.
  const hitel = Math.min(nem0(b.hitel), ar);
  let h = null;
  if (hitel > 0) {
    const kamat = Number(b.kamat) > 0 ? Number(b.kamat) : szabaly(adat, 'wekerle_plusz.piaci_kamat').ertek.szazalek;
    const ev = Number(b.futamido) > 0 ? Math.round(Number(b.futamido)) : 20;
    const haviT = torlesztoKamatbol(hitel, ev * 12, kamat);
    let t = hitel, elsoKamat = 0;
    for (let i = 0; i < 12; i++) { const k = t * kamat / 100 / 12; elsoKamat += k; t -= haviT - k; }
    const onero = beruhazas - hitel;
    const hfm = szabaly(adat, 'hitel.hfm').ertek.altalanos;
    h = { hitel, kamat, kamatSajat: Number(b.kamat) > 0, ev, havi: Math.round(haviT), eves: Math.round(haviT * 12), elsoKamat: Math.round(elsoKamat), elsoToke: Math.round(haviT * 12 - elsoKamat), onero,
      penzaram: Math.round(netto - haviT * 12), keszpenzHozam: onero > 0 ? (netto - haviT * 12) / onero * 100 : null, oneroHozam: onero > 0 ? (netto - elsoKamat) / onero * 100 : null,
      hfm, hfmFelett: hitel > ar * hfm / 100 };
  }
  // Összevetés kockázatmentes állampapírral: ugyanannyi saját pénz egy évre
  const ap = b.allampapir === '' || b.allampapir == null || Number.isNaN(Number(b.allampapir)) ? szabaly(adat, 'berles_vetel.allampapir').ertek.szazalek : Number(b.allampapir);
  const sajatPenz = h ? h.onero : beruhazas;
  const apKamat = Math.round(Math.max(0, sajatPenz) * ap / 100);
  const lakasHozam = h ? netto - h.elsoKamat : netto;
  return { ar, illetek: ill, egyeb: nem0(b.egyeb), felujitas: nem0(b.felujitas), beruhazas, havi, honap, bevetel, koltseg, ado: ad.ado, adoModszer: ad.jobb, netto,
    brutto: bevetel / beruhazas * 100, nettoHozam: netto / beruhazas * 100, megterules: netto > 0 ? beruhazas / netto : null,
    hitel: h, allampapir: { szazalek: ap, sajat: !(b.allampapir === '' || b.allampapir == null), alap: sajatPenz, kamat: apKamat, lakas: Math.round(lakasHozam), kulonbseg: Math.round(lakasHozam - apKamat) } };
}

/* ---------------- Lakásvásárlás induló költsége ---------------- */
/** A közjegyzői munkadíj a hitelösszeg (ügyérték) sávjai szerint; támogatott hitelnél a 15%-a. */
export function kozjegyzoDij(adat, hitel, tamogatott = false) {
  const k = szabaly(adat, 'vetel_koltsegek.kozjegyzo').ertek;
  let also = 0, dij = 0;
  for (const [felso, alap, sz] of k.savok) { if (hitel <= felso) { dij = alap + Math.max(0, hitel - also) * sz / 100; break; } also = felso; }
  return Math.round(tamogatott ? dij * k.tamogatott_szazalek / 100 : dij);
}
/**
 * b: { vetelar, hitel, tamogatott (Wekerle Plusz), megtakaritas, kitol: 'magan'|'vallalkozo'|'rokon', elso, fiatal35, csok,
 *      ugyvedi, ertekbecsles, kozjegyzo, folyositas (Ft, ha tudod; üresen a becslés), egyeb (költözés, felújítás, berendezés), foglaloSzazalek }
 * A pénz, amely a hitelen felül kell: önerő, illeték, mellékköltségek, időrendben.
 */
export function indulo(adat, b) {
  const ar = Number(b.vetelar);
  if (!(ar > 0)) return { hiba: 'Add meg a lakás vételárát.' };
  const hitelBe = nem0(b.hitel);
  if (hitelBe >= ar) return { hiba: 'A hitel nem lehet több a vételárnál. A bank a forgalmi érték legfeljebb 80%-át, első lakásnál 90%-át adja.' };
  const v = (k) => szabaly(adat, `vetel_koltsegek.${k}`).ertek;
  const megadott = (x) => !(x === '' || x == null || Number.isNaN(Number(x)));
  const uj = b.kitol === 'vallalkozo';
  // Illeték: a kedvezmények közül a legjobb (illetek())
  const ill = illetek(adat, { ertek: ar, ujVallalkozotol: uj, rokon: b.kitol === 'rokon', csok: b.csok === true, elso: b.elso === true, fiatal35: b.fiatal35 === true });
  const hfm = szabaly(adat, 'hitel.hfm').ertek;
  const hfmSz = b.elso === true ? hfm.elso_lakas : hfm.altalanos;
  // A bank a saját értékbecslése szerinti forgalmi értékből számol; ha ez a vételárnál kisebb, több önerő kell
  const bankErtek = megadott(b.bankErtek) && Number(b.bankErtek) > 0 ? Number(b.bankErtek) : ar;
  const hfmMax = Math.floor(bankErtek * hfmSz / 100);
  const hitel = hitelBe;
  const onero = ar - hitel;
  const tam = b.tamogatott === true && hitel > 0;
  const fh = v('foldhivatal');
  const tetel = (kulcs, nev, becsult, sajat, mikor, forras) => ({ kulcs, nev, ft: Math.round(megadott(sajat) ? Number(sajat) : becsult), sajat: megadott(sajat), mikor, forras });
  const ugyvedSz = uj ? v('ugyvedi').uj_szazalek : v('ugyvedi').szazalek;
  const fo = v('folyositas');
  const tetelek = [
    tetel('ugyvedi', 'Ügyvédi díj', ar * ugyvedSz / 100, b.ugyvedi, 'szerzodes', 'vetel_koltsegek.ugyvedi'),
    tetel('foldhivatal', 'Földhivatal: tulajdonjog bejegyzése', fh.tulajdon_ft, '', 'szerzodes', 'vetel_koltsegek.foldhivatal'),
  ];
  if (hitel > 0) tetelek.push(
    tetel('ertekbecsles', 'Értékbecslés', v('ertekbecsles').ft, b.ertekbecsles, 'hitel', 'vetel_koltsegek.ertekbecsles'),
    tetel('kozjegyzo', 'Közjegyzői okirat', kozjegyzoDij(adat, hitel, tam), b.kozjegyzo, 'hitel', 'vetel_koltsegek.kozjegyzo'),
    tetel('folyositas', 'Folyósítási díj', tam ? fo.tamogatott_max_ft : Math.min(hitel * fo.szazalek / 100, fo.max_ft), b.folyositas, 'hitel', 'vetel_koltsegek.folyositas'),
    tetel('jelzalog', 'Földhivatal: jelzálog és tulajdoni lap', fh.jelzalog_ft + fh.tulajdoni_lap_ft, '', 'hitel', 'vetel_koltsegek.foldhivatal'),
  );
  const egyeb = nem0(b.egyeb);
  const mellek = tetelek.reduce((x, t) => x + t.ft, 0);
  const osszes = onero + ill.ado + mellek + egyeb;
  const fsz = megadott(b.foglaloSzazalek) ? Number(b.foglaloSzazalek) : v('foglalo').szazalek;
  const foglalo = Math.min(onero, Math.round(ar * fsz / 100));
  const osszeg = (mikor) => tetelek.filter((t) => t.mikor === mikor).reduce((x, t) => x + t.ft, 0);
  const lepesek = [
    { kulcs: 'szerzodes', nev: 'A szerződés aláírásakor', ft: foglalo + osszeg('szerzodes'), mi: `foglaló (a vételár ${tized1(fsz)}%-a), ügyvédi díj, földhivatali díj` },
    hitel > 0 && { kulcs: 'hitel', nev: 'A hitelkérelemtől a folyósításig', ft: osszeg('hitel'), mi: 'értékbecslés, közjegyző, folyósítási és földhivatali díj' },
    { kulcs: 'birtok', nev: 'A birtokba adáskor', ft: onero - foglalo, mi: hitel > 0 ? 'az önerő maradéka; a többit a bank utalja az eladónak' : 'a vételár maradéka' },
    ill.ado > 0 && { kulcs: 'illetek', nev: 'Hetekkel, hónapokkal később', ft: ill.ado, mi: `illeték, a NAV fizetési meghagyásától ${v('illetek_fizetes').nap} napon belül` },
    egyeb > 0 && { kulcs: 'egyeb', nev: 'Költözéskor', ft: egyeb, mi: 'költözés, felújítás, berendezés' },
  ].filter(Boolean);
  const megtakaritas = megadott(b.megtakaritas) ? nem0(b.megtakaritas) : null;
  return { ar, hitel, onero, oneroSzazalek: onero / ar * 100, tam, illetek: ill, tetelek, mellek, egyeb, osszes, foglalo, foglaloSzazalek: fsz, lepesek,
    hfmSz, hfmMax, hfmFelett: hitel > hfmMax, bankErtek, bankAlacsonyabb: bankErtek < ar, uj, ugyvedSz, becsult: tetelek.some((t) => !t.sajat && ['ugyvedi', 'ertekbecsles', 'folyositas'].includes(t.kulcs)),
    megtakaritas, hiany: megtakaritas === null ? null : osszes - megtakaritas, vetelarFelett: osszes - onero };
}
const tized1 = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

/* ---------------- Bérlés vagy vétel ---------------- */
/** Havi léptékű modell: ugyanannyi pénz megy ki mindkét úton; ami az egyikben kevesebb, az befektetésbe kerül. */
function berlesVetelFut({ ar, hitel, kamat, futamido, kezdo, berlet, kozos, karbSz, arNo, berNo, hozam, evek, eladasLevonas = () => 0 }) {
  const rH = kamat / 100 / 12, n = futamido * 12;
  const havi = hitel > 0 ? torlesztoKamatbol(hitel, n, kamat) : 0;
  const rB = Math.pow(1 + hozam / 100, 1 / 12) - 1;
  let tartozas = hitel, ertek = ar, rent = berlet, kozosM = kozos;
  let vetelBef = 0, berlesBef = kezdo; // a bérlő a kezdő pénzt befekteti
  const evente = [];
  for (let m = 1; m <= evek * 12; m++) {
    vetelBef *= 1 + rB; berlesBef *= 1 + rB;
    let t = 0;
    if (m <= n && tartozas > 0) { const k = tartozas * rH; t = havi; tartozas = Math.max(0, tartozas - (havi - k)); }
    const vetelKiad = t + kozosM + ertek * karbSz / 100 / 12;
    const d = vetelKiad - rent;
    if (d > 0) berlesBef += d; else vetelBef += -d;
    ertek *= Math.pow(1 + arNo / 100, 1 / 12);
    if (m % 12 === 0) {
      const levonas = eladasLevonas(ertek, m / 12);
      evente.push({ ev: m / 12, vetel: ertek - tartozas + vetelBef - levonas, berles: berlesBef, ertek, tartozas, berlet: rent, levonas });
      rent *= 1 + berNo / 100; kozosM *= 1 + berNo / 100;
    }
  }
  return { havi, evente, vege: evente[evente.length - 1] };
}
/**
 * b: { vetelar, onero, kamat, futamido, berlet (havi), kozos (havi, ha veszed), evek, arNo, berNo, hozam, karbantartas (%) }
 */
export function berlesVetel(adat, b) {
  const ar = Number(b.vetelar), berlet = Number(b.berlet);
  if (!(ar > 0)) return { hiba: 'Add meg, mennyibe kerülne a lakás.' };
  if (!(berlet > 0)) return { hiba: 'Add meg a hasonló lakás havi bérleti díját.' };
  const megadott = (x) => !(x === '' || x == null || Number.isNaN(Number(x)));
  const onero = megadott(b.onero) ? Math.min(ar, nem0(b.onero)) : NaN;
  if (!(onero >= 0)) return { hiba: 'Add meg, mennyi saját pénzt tennél a vételárba.' };
  const evek = megadott(b.evek) ? Math.round(Number(b.evek)) : 10;
  if (!(evek >= 1 && evek <= 40)) return { hiba: 'Az időtáv 1 és 40 év között lehet.' };
  const inf = adat.inflacio?.evek || {};
  const utolso = Object.keys(inf).sort().pop();
  const infSz = utolso ? inf[utolso].szazalek : 0;
  const bv = (k) => szabaly(adat, `berles_vetel.${k}`).ertek;
  const kamat = megadott(b.kamat) && Number(b.kamat) >= 0 ? Number(b.kamat) : szabaly(adat, 'wekerle_plusz.piaci_kamat').ertek.szazalek;
  const futamido = megadott(b.futamido) && Number(b.futamido) > 0 ? Math.round(Number(b.futamido)) : 20;
  // A lakásár alapesete: ha megadod, hol van a lakás, a KSH szerinti hosszú távú átlag azon a településtípuson, különben az infláció
  const trend = TELEPULESTIPUS[b.telepules] ? lakasarTrend(adat, b.telepules) : null;
  const arNo = megadott(b.arNo) ? Number(b.arNo) : trend ? Math.round(trend.hosszu * 10) / 10 : infSz;
  const berNo = megadott(b.berNo) ? Number(b.berNo) : infSz;
  const hozam = megadott(b.hozam) ? Number(b.hozam) : bv('allampapir').szazalek;
  const karbSz = megadott(b.karbantartas) ? Number(b.karbantartas) : bv('karbantartas').szazalek;
  const kozos = nem0(b.kozos);
  const hitel = ar - onero;
  const ind = indulo(adat, { vetelar: ar, hitel: hitel > 0 ? hitel : '' });
  if (ind.hiba) return ind;
  const kezdo = ind.osszes; // a vevő ennyi saját pénzt ad ki; a bérlő ugyanennyit befektet
  const el = bv('forgatokonyv').elteres_szazalekpont;
  // Ha a végén eladod: közvetítő, és öt éven belül az eladás adója (a szerzés költségeit levonva)
  const eladod = b.eladod === true;
  const kozvSz = megadott(b.kozvetito) ? Number(b.kozvetito) : bv('kozvetito').szazalek;
  const ugyved = ind.tetelek.find((t) => t.kulcs === 'ugyvedi')?.ft || 0;
  const ev0 = Number(adat.ev) || new Date().getFullYear();
  const eladasLevonas = eladod ? (ertek, ev) => {
    const kozv = ertek * kozvSz / 100;
    const szja = eladasSzja(adat, { eladasiAr: ertek, szerzesEv: ev0, eladasEv: ev0 + ev, szerzesiErtek: ar, szerzesKoltseg: ind.illetek.ado + ugyved, eladasKoltseg: kozv });
    return kozv + (szja.hiba ? 0 : szja.ado);
  } : () => 0;
  const alap = { ar, hitel, kamat, futamido, kezdo, berlet, kozos, karbSz, berNo, hozam, evek, eladasLevonas };
  const fk = [['borulato', 'Borúlátó', arNo - el], ['alap', 'Alapeset', arNo], ['derulato', 'Derűlátó', arNo + el]].map(([kulcs, nev, a]) => {
    const r = berlesVetelFut({ ...alap, arNo: a });
    const elso = r.evente.find((x) => x.vetel >= x.berles);
    return { kulcs, nev, arNo: a, vetel: Math.round(r.vege.vetel), berles: Math.round(r.vege.berles), kulonbseg: Math.round(r.vege.vetel - r.vege.berles), fordul: elso ? elso.ev : null, ertek: Math.round(r.vege.ertek), tartozas: Math.round(r.vege.tartozas), evente: r.evente, havi: Math.round(r.havi) };
  });
  const a = fk[1];
  // Mai értéken: a jövőbeli forintot az infláció feltevésével visszaszámoljuk
  const defl = Math.pow(1 + infSz / 100, -evek);
  for (const f of fk) { f.vetelMa = Math.round(f.vetel * defl); f.berlesMa = Math.round(f.berles * defl); f.levonas = Math.round(f.evente[f.evente.length - 1].levonas || 0); }
  // A saját lakás valódi havi költsége az első évben: ami nem tér vissza (kamat, közös költség, karbantartás, a lekötött pénz elmaradt hozama)
  const haviT = hitel > 0 ? torlesztoKamatbol(hitel, futamido * 12, kamat) : 0;
  let t = hitel, elsoKamat = 0;
  for (let i = 0; i < 12 && t > 0; i++) { const k = t * kamat / 100 / 12; elsoKamat += k; t -= haviT - k; }
  const valodi = { kamat: Math.round(elsoKamat / 12), kozos, karbantartas: Math.round(ar * karbSz / 1200), elmaradt: Math.round(kezdo * hozam / 1200), ertekNo: Math.round(ar * arNo / 1200) };
  valodi.osszes = valodi.kamat + valodi.kozos + valodi.karbantartas + valodi.elmaradt;
  valodi.netto = valodi.osszes - valodi.ertekNo;
  return { ar, onero, hitel, eladod, kozvSz, kozvSajat: megadott(b.kozvetito), valodi, arSajat: megadott(b.arNo), trend, defl, kamat, kamatSajat: megadott(b.kamat), futamido, berlet, kozos, evek, arNo, berNo, hozam, karbSz, infSz, infEv: utolso, kezdo, indulo: ind,
    havi: a.havi, elsoHaviVetel: Math.round(a.havi + kozos + ar * karbSz / 100 / 12), forgatokonyvek: fk, alap: a, nyero: a.kulonbseg >= 0 ? 'vetel' : 'berles', elteres: el,
    hfmFelett: ind.hfmFelett, hfmSz: ind.hfmSz };
}

/* ---------------- Lakásárak a KSH szerint ---------------- */
export const TELEPULESTIPUS = { fovaros: ['Budapest', 'Budapesten'], megyeszekhely: ['Megyeszékhely', 'a megyeszékhelyeken'], varos: ['Más város', 'a többi városban'], kozseg: ['Község', 'a községekben'], orszag: ['Országos átlag', 'országosan'] };
const atlagNo = (a, b, ev) => (Math.pow(b / a, 1 / ev) - 1) * 100;
/**
 * A használt lakások átlagos négyzetméterárának évi átlagos változása egy településtípuson, a KSH idősorából.
 * hosszu: a teljes idősorra (egy fellendülés és egy visszaesés is benne van), tiz: az utolsó 10 évre.
 */
export function lakasarTrend(adat, tipus) {
  const la = adat.lakasar;
  const sor = la?.hasznalt?.[tipus];
  if (!sor || !TELEPULESTIPUS[tipus]) return null;
  const n = la.evek.length - 1;
  const tol = la.evek[0], ig = la.evek[n];
  const t10 = Math.max(0, n - 10);
  return { tipus, nev: TELEPULESTIPUS[tipus][0], hol: TELEPULESTIPUS[tipus][1], tol, ig, hosszu: atlagNo(sor[0], sor[n], ig - tol), tiz: atlagNo(sor[t10], sor[n], ig - la.evek[t10]), tizTol: la.evek[t10], arM2: sor[n] * 1000, forras: la.forras };
}

/** Vármegye → KSH-régió (a STADAT lakásár-táblájának régiói). */
export const MEGYEK = [['budapest', 'Budapest', 'budapest'], ['bacs', 'Bács-Kiskun', 'del_alfold'], ['baranya', 'Baranya', 'del_dunantul'], ['bekes', 'Békés', 'del_alfold'], ['borsod', 'Borsod-Abaúj-Zemplén', 'eszak_magyarorszag'], ['csongrad', 'Csongrád-Csanád', 'del_alfold'], ['fejer', 'Fejér', 'kozep_dunantul'], ['gyor', 'Győr-Moson-Sopron', 'nyugat_dunantul'], ['hajdu', 'Hajdú-Bihar', 'eszak_alfold'], ['heves', 'Heves', 'eszak_magyarorszag'], ['jasz', 'Jász-Nagykun-Szolnok', 'eszak_alfold'], ['komarom', 'Komárom-Esztergom', 'kozep_dunantul'], ['nograd', 'Nógrád', 'eszak_magyarorszag'], ['pest', 'Pest', 'pest'], ['somogy', 'Somogy', 'del_dunantul'], ['szabolcs', 'Szabolcs-Szatmár-Bereg', 'eszak_alfold'], ['tolna', 'Tolna', 'del_dunantul'], ['vas', 'Vas', 'nyugat_dunantul'], ['veszprem', 'Veszprém', 'kozep_dunantul'], ['zala', 'Zala', 'nyugat_dunantul']];
const REGIO_NEV = { budapest: 'Budapesten', pest: 'Pest megyében', kozep_dunantul: 'Közép-Dunántúlon', nyugat_dunantul: 'Nyugat-Dunántúlon', del_dunantul: 'Dél-Dunántúlon', eszak_magyarorszag: 'Észak-Magyarországon', eszak_alfold: 'az Észak-Alföldön', del_alfold: 'a Dél-Alföldön' };
const TIPUS_HOL = { megyeszekhely: 'a megyeszékhelyeken', varos: 'a városokban', kozseg: 'a községekben' };

/**
 * A vételár négyzetméterára a KSH szerinti környékbeli átlaghoz képest (régió és településtípus; új lakásnál az országos átlag).
 * Ha jóval kisebb, a NAV a forgalmi értéket magasabban állapíthatja meg (Itv. 70. §). null, ha nincs elég adat.
 */
export function forgalmiOsszevetes(adat, b) {
  const la = adat.lakasar, ertek = Number(b.ertek), terulet = Number(b.terulet);
  const megye = MEGYEK.find(([k]) => k === b.megye);
  if (!la || !(ertek > 0) || !(terulet > 0) || !megye) return null;
  const regio = megye[2];
  let tipus = regio === 'budapest' ? 'fovaros' : TIPUS_HOL[b.telepTipus] ? b.telepTipus : null;
  if (!tipus) return { hiany: 'Add meg, milyen településen van a lakás.' };
  if (regio === 'pest' && tipus === 'megyeszekhely') tipus = 'varos'; // Pest megye székhelye Budapest
  let sor, hol, uj = false, evek = la.evek;
  if (b.uj && la.uj?.[tipus]?.some((x) => x != null)) { sor = la.uj[tipus]; hol = tipus === 'fovaros' ? 'Budapesten' : `országosan, ${TIPUS_HOL[tipus]}`; uj = true; }
  else if (la.hasznaltRegio?.[regio]?.[tipus]) { sor = la.hasznaltRegio[regio][tipus]; hol = tipus === 'fovaros' ? 'Budapesten' : `${REGIO_NEV[regio]}, ${TIPUS_HOL[tipus]}`; }
  else { sor = la.hasznalt[tipus]; hol = tipus === 'fovaros' ? 'Budapesten' : `országosan, ${TIPUS_HOL[tipus]}`; }
  let i = Math.min(sor.length, evek.length) - 1;
  while (i > 0 && sor[i] == null) i--;
  const atlag = sor[i] * 1000, m2 = ertek / terulet;
  const kuszob = szabaly(adat, 'illetek.forgalmi_ertek').ertek.jelzes_szazalek;
  return { m2: Math.round(m2), atlag, ev: evek[i], hol, uj, arany: m2 / atlag * 100, kuszob, alacsony: m2 / atlag * 100 < kuszob, megye: megye[1] };
}

/* ---------------- Rövid vagy hosszú távú kiadás ---------------- */
/** Egy év rövid távú kiadás egy adott kihasználtsággal: bevétel, költség, a három adózási mód, és ami marad. */
function rovidEv(adat, b, ejszaka) {
  const v = (k) => szabaly(adat, `rovid_tav.${k}`).ertek;
  const brutto = b.ejAr * ejszaka * 12;
  const afaKoteles = brutto > v('afa_mentesseg').ft;
  const afa = afaKoteles ? brutto * v('afa_mertek').szazalek / (100 + v('afa_mertek').szazalek) : 0;
  const bevetel = brutto - afa;
  const platform = brutto * b.platform / 100;
  const foglalas = b.tartozkodas > 0 ? ejszaka * 12 / b.tartozkodas : 0;
  const takaritas = foglalas * b.takaritas;
  const tfh = bevetel * v('tfh').szazalek / 100;
  const rezsi = b.rezsi * 12;
  const koltseg = platform + takaritas + tfh + rezsi + b.kozosEv + b.egyebEv;
  const o = v('onallo'), at = v('atalany');
  const kulcs = o.szja_szazalek + o.szocho_szazalek;
  const modok = [
    { kulcs: 'atalany', nev: 'Tételes átalányadó', jar: !b.tobbLakas, ado: b.szobak * (b.budapest ? at.budapest_ft : at.mashol_ft), miert: b.tobbLakas ? 'csak akkor választható, ha egyetlen lakásban adsz ki szállást' : `${b.szobak} lakószoba × ${fmtSzam(b.budapest ? at.budapest_ft : at.mashol_ft)} Ft, a bevételtől függetlenül` },
    { kulcs: 'koltseghanyad', nev: '10% költséghányaddal', jar: true, jovedelem: bevetel * (100 - o.koltseghanyad_szazalek) / 100, miert: `a bevétel ${100 - o.koltseghanyad_szazalek}%-a után ${o.szja_szazalek}% szja és ${o.szocho_szazalek}% szocho` },
    { kulcs: 'teteles', nev: 'Tételes költségelszámolással', jar: true, jovedelem: Math.max(0, bevetel - koltseg), miert: `a bevétel és a költségek különbsége után ${o.szja_szazalek}% szja és ${o.szocho_szazalek}% szocho` },
  ];
  for (const m of modok) if (m.ado === undefined) m.ado = Math.round(m.jovedelem * kulcs / 100);
  const legjobb = modok.filter((m) => m.jar).reduce((a, m) => (m.ado < a.ado ? m : a));
  return { ejszaka, brutto, afaKoteles, afa: Math.round(afa), bevetel: Math.round(bevetel), platform: Math.round(platform), foglalas, takaritas: Math.round(takaritas), tfh: Math.round(tfh), rezsi, koltseg: Math.round(koltseg), modok, legjobb, ado: legjobb.ado,
    netto: Math.round(bevetel - koltseg - legjobb.ado) };
}
/**
 * b: { ejAr (Ft/éj, amit a vendég fizet, idegenforgalmi adó nélkül), ejszaka (foglalt éj havonta), tartozkodas (éj/foglalás), platform (%), takaritas (Ft/foglalás), rezsi (Ft/hó),
 *      kozosEv, egyebEv (Ft/év), szobak, telepules: 'budapest'|'mas', tobbLakas, hosszuHavi, hosszuHonap }
 */
export function rovidTav(adat, b) {
  const megadott = (x) => !(x === '' || x == null || Number.isNaN(Number(x)));
  const ejAr = Number(b.ejAr), ejszaka = Number(b.ejszaka), hosszuHavi = Number(b.hosszuHavi);
  if (!(ejAr > 0)) return { hiba: 'Add meg, mennyit fizet a vendég egy éjszakára.' };
  if (!(ejszaka > 0)) return { hiba: 'Add meg, havonta hány éjszakára foglalnak.' };
  if (ejszaka > 31) return { hiba: 'Egy hónapban legfeljebb 31 foglalt éjszaka lehet.' };
  if (!(hosszuHavi > 0)) return { hiba: 'Add meg, mennyiért adnád ki hosszú távra havonta.' };
  const v = (k) => szabaly(adat, `rovid_tav.${k}`).ertek;
  const p = {
    ejAr, tartozkodas: megadott(b.tartozkodas) && Number(b.tartozkodas) > 0 ? Number(b.tartozkodas) : 3,
    platform: megadott(b.platform) ? Number(b.platform) : v('platform').szazalek, platformSajat: megadott(b.platform),
    takaritas: nem0(b.takaritas), rezsi: nem0(b.rezsi), kozosEv: nem0(b.kozosEv), egyebEv: nem0(b.egyebEv),
    szobak: megadott(b.szobak) && Number(b.szobak) >= 1 ? Math.round(Number(b.szobak)) : 1,
    budapest: b.telepules !== 'mas', tobbLakas: b.tobbLakas === true,
  };
  const r = rovidEv(adat, p, ejszaka);
  // Hosszú távon a rezsit a bérlő fizeti; a közös költség és az egyéb költség a tulajdonosé
  const honap = megadott(b.hosszuHonap) ? Math.round(Number(b.hosszuHonap)) : 12;
  const h = berbeadas(adat, { havi: hosszuHavi, honap, koltseg: p.kozosEv + p.egyebEv, ev: adat.ev });
  if (h.hiba) return h;
  const hosszuNetto = Math.round(h.bevetel - p.kozosEv - p.egyebEv - h.ado);
  // Fordulópont: hány foglalt éjszaka kell havonta, hogy a rövid táv utolérje a hosszút
  let fordul = null;
  if (rovidEv(adat, p, 30.4).netto >= hosszuNetto) {
    let lo = 0, hi = 30.4;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (rovidEv(adat, p, m).netto >= hosszuNetto) hi = m; else lo = m; }
    fordul = Math.ceil(hi * 10) / 10;
  }
  return { ...p, ejszaka, kihasznaltsag: ejszaka / 30.4 * 100, rovid: r, hosszu: { havi: hosszuHavi, honap, bevetel: h.bevetel, ado: h.ado, modszer: h.jobb, koltseg: p.kozosEv + p.egyebEv, netto: hosszuNetto },
    kulonbseg: r.netto - hosszuNetto, nyero: r.netto >= hosszuNetto ? 'rovid' : 'hosszu', fordul, moratoriumIg: v('budapest').moratorium_ig };
}

/* ---------------- Következő lépés ---------------- */
/** Kalkulátoronként legfeljebb három ajánlás: { cel, cim, szoveg, q }. Csak a látogató által beírt adat megy át a következő űrlapra. */
export function kovetkezoLepesek(kalk, e) {
  switch (kalk) {
    case 'eladas': return [{ cel: 'lakasvaltas', cim: 'Az árából másik lakást veszel?', szoveg: 'Az eladás adója, az új lakás illetéke a cserekedvezménnyel, és mennyi hitel kell még.', q: { eladasiAr: e.eladasiAr, szerzesEv: e.szerzesEv, szerzesiErtek: e.szerzesiErtek } }];
    case 'illetek': return [{ cel: 'indulo', cim: 'Mennyi pénz kell összesen?', szoveg: 'Az illeték mellett az önerő, az ügyvéd, a közjegyző és a földhivatal, időrendben.', q: { vetelar: e.ertek } }, { cel: 'wekerle', cim: 'Megkapod a Wekerle Plusz hitelt?', szoveg: 'Pontról pontra a rendelet szerint, és a havi törlesztő 3 vagy 5%-os kamattal.', q: { vetelar: e.ertek } }];
    case 'wekerle': return [{ cel: 'indulo', cim: 'Mennyi saját pénz kell összesen?', szoveg: 'Önerő, illeték és mellékköltségek, támogatott hitel díjaival.', q: { vetelar: e.vetelar, tamogatott: true } }, { cel: 'illetek', cim: 'Mennyi lesz az illeték, és jár-e kedvezmény?', szoveg: 'A Wekerle Plusz nem ad mentességet, de más kedvezmény járhat.', q: { ertek: e.vetelar } }];
    case 'lakasvaltas': return [{ cel: 'illetek', cim: 'Az illeték részletesen, minden kedvezménnyel', szoveg: 'Tulajdoni hányad, új lakás, 35 év alatti első lakás, rokontól vétel.', q: { ertek: e.vetelar, eladottErtek: e.eladasiAr, eladasMikor: e.sorrend === 'elobb_vesz' ? 'utana' : 'elotte' } }];
    case 'hitelkepesseg': return [{ cel: 'indulo', cim: 'Mennyi saját pénz kell a vételhez?', szoveg: 'Önerő, illeték és minden mellékköltség, időrendben.', q: { vetelar: e.ertek, elso: e.elsoLakas } }, { cel: 'wekerle', cim: 'Megkapod a Wekerle Plusz hitelt?', szoveg: 'Pontról pontra a rendelet szerint, 3 vagy 5%-os fix kamattal.', q: { vetelar: e.ertek } }];
    case 'hozam': return [{ cel: 'kiadas', cim: 'Az adó részletesen: 10% vagy tételes?', szoveg: 'A döntési pont és a negyedéves adóelőleg határidői.', q: { havi: e.havi, honap: e.honap, koltseg: e.koltseg } }];
    case 'emeles': return [{ cel: 'kiadas', cim: 'Mennyi adót fizetsz az új díj után?', szoveg: '10% költséghányaddal vagy tételesen.', q: { havi: e.dij } }];
    case 'ingyenes': return [{ cel: 'haszonelvezet', cim: 'Mennyit ér a haszonélvezet?', szoveg: 'A haszonélvező életkora szerint, és mi történik, ha lemond róla.', q: { ertek: e.ertek } }];
    case 'haszonelvezet': return [{ cel: 'eladas', cim: 'Mennyi adót fizetsz, ha később eladod?', szoveg: 'A szerzés éve és az árak alapján.', q: {} }];
    case 'indulo': return [{ cel: 'hitelkepesseg', cim: 'Megkapod ezt a hitelt?', szoveg: 'A jövedelmedből, az MNB adósságfék-szabályai szerint.', q: { ertek: e.vetelar } }, { cel: 'wekerle', cim: 'Jár neked a Wekerle Plusz?', szoveg: '3 vagy 5%-os fix kamat. Pontról pontra megnézzük a feltételeket.', q: { vetelar: e.vetelar } }, { cel: 'berlesvetel', cim: 'Megéri megvenni, vagy jobb bérelni?', szoveg: 'A vagyonod 10 vagy 20 év múlva, három forgatókönyvben.', q: { vetelar: e.vetelar, onero: e.vetelar && e.hitel ? String(Number(String(e.vetelar).replace(/\D/g, '')) - Number(String(e.hitel).replace(/\D/g, ''))) : '' } }];
    case 'berlesvetel': return [{ cel: 'indulo', cim: 'Mennyi pénz kell a vételhez?', szoveg: 'Önerő, illeték és minden mellékköltség, időrendben.', q: { vetelar: e.vetelar, hitel: e.vetelar && e.onero ? String(Number(String(e.vetelar).replace(/\D/g, '')) - Number(String(e.onero).replace(/\D/g, ''))) : '' } }, { cel: 'hitelkepesseg', cim: 'Mennyi hitelt kaphatsz?', szoveg: 'A jövedelmedből és a lakás értékéből.', q: { ertek: e.vetelar } }];
    case 'rovidtav': return [{ cel: 'kiadas', cim: 'A hosszú távú kiadás adója részletesen', szoveg: '10% vagy tételes, a negyedéves adóelőleg határidőivel.', q: { havi: e.hosszuHavi, honap: e.hosszuHonap } }, { cel: 'hozam', cim: 'Megéri kiadásra venni?', szoveg: 'Bruttó és nettó hozam, hitellel és állampapírral összevetve.', q: { havi: e.hosszuHavi } }];
    case 'kiadas': return [{ cel: 'eladas', cim: 'Mennyi adót fizetnél, ha később eladnád?', szoveg: 'A szerzés éve és az árak alapján. Minél régebben a tiéd, annál kevesebb.', q: {} }];
    default: return [];
  }
}
/** A link paraméterei: csak a kitöltött értékek. */
export function kovetkezoQuery(q) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q || {})) if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, v === true ? '1' : String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}
