// Önálló frissítők (KSH éves infláció, PMÁP-kamat, KSH lakás-négyzetméterárak): azok a számok, amelyeket a gép maga is be tud hozni a hivatalos forrásból.
// Mindegyik ugyanúgy működik: letölti az oldalt, kiolvassa a számot, és csak akkor írja át az adatot,
// ha a szám hihető. Ha a kiolvasás nem sikerül, vagy a szám valószínűtlenül nagyot ugrik, a régi érték marad,
// és a jelentésbe kerül (a workflow ebből jegyet nyit). Minden átírás a data/valtozasok.json naplóba is bekerül.
import { olvas, ir, maBudapest, GYOKER } from '../forras/adat.mjs';
import { szovegge } from './figyelo.mjs';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { IA, nevlista, tomorit, hiheto as iaHiheto, arindex, ARINDEX_URL, ARINDEX_OLDAL } from './ingatlanadattar.mjs';

const szam = (s) => Number(String(s).replace(',', '.'));
const hu = (n) => String(n).replace('.', ',');

/** A KSH decemberi gyorstájékoztatójából (angol változat) az adott év átlagos inflációja, vagy null. */
export function kshEvesInflacio(html, ev) {
  const t = szovegge(html);
  // „In 2025, prices were up by 4.4% on average compared to the previous year.”
  const a = t.match(new RegExp(`In ${ev},? (?:consumer )?prices (?:were|went) (up|down) by (-?[\\d.]+)% on average`, 'i'));
  // A cím: „Prices increase by 3.3% in December and by 4.4% on average in 2025”, illetve „… and 3.7% higher on average in 2024”
  const b = t.match(new RegExp(`(?:by )?(-?[\\d.]+)% (?:(higher|lower) )?on average in ${ev}`, 'i'));
  const x = a ? (a[1].toLowerCase() === 'down' ? -1 : 1) * szam(a[2]) : null;
  const y = b ? (b[2]?.toLowerCase() === 'lower' ? -1 : 1) * szam(b[1]) : null;
  if (x == null && y == null) return null;
  if (x != null && y != null && x !== y) return null; // a két hely ellentmond: inkább ember nézze meg
  return x ?? y;
}
export const kshUrl = (ev) => `https://www.ksh.hu/en/first-releases/far/efar${String(ev).slice(2)}12.html`;

/** Az Államkincstár PMÁP-oldaláról a meghirdetett kamat („KAMAT: 4,50%”), vagy null. */
export function pmapKamat(html) {
  const m = szovegge(html).match(/KAMAT:?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*%/);
  return m ? szam(m[1]) : null;
}

// A KSH STADAT-táblák angol HTML-je: a „Country” sorok településtípusonként, a használt és az új lakásokra külön.
const TIPUS_EN = [['capital', 'fovaros'], ['county seats', 'megyeszekhely'], ['towns', 'varos'], ['villages', 'kozseg'], ['total', 'orszag']];
const REGIO_EN = { budapest: 'budapest', pest: 'pest', 'central transdanubia': 'kozep_dunantul', 'western transdanubia': 'nyugat_dunantul', 'southern transdanubia': 'del_dunantul', 'northern hungary': 'eszak_magyarorszag', 'northern great plain': 'eszak_alfold', 'southern great plain': 'del_alfold' };
const REGIO_TIPUS = { capital: 'fovaros', 'county seats': 'megyeszekhely', towns: 'varos', villages: 'kozseg', together: 'egyutt' };
const cellaSzoveg = (c) => c.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** A lak0025 táblából: { evek, hasznalt: {tipus: [..]}, uj: {...} }, vagy null, ha a szerkezet nem a várt. */
export function kshLakasar(html) {
  const sorok = [...String(html).matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => [...m[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => cellaSzoveg(c[1])));
  const fej = sorok.find((s) => s.filter((c) => /^(19|20)\d\d$/.test(c)).length >= 3);
  if (!fej) return null;
  const evek = fej.filter((c) => /^(19|20)\d\d$/.test(c)).map(Number);
  const ki = { evek, hasznalt: {}, uj: {} };
  let resz = null, regio = '';
  for (const s of sorok) {
    const sor = s.join(' ');
    if (/second-hand/i.test(sor) && s.filter(Boolean).length <= 2) { resz = 'hasznalt'; continue; }
    if (/new dwellings/i.test(sor) && s.filter(Boolean).length <= 2) { resz = 'uj'; continue; }
    const i = s.findIndex((c) => REGIO_TIPUS[c.toLowerCase()] || c.toLowerCase() === 'total');
    if (i < 0) continue;
    if (i > 0 && s[i - 1]) regio = s[i - 1];
    if (!resz) continue;
    const ertekek = s.slice(i + 1).map((c) => (c === '..' || c === '' ? null : Number(c.replace(/[,\s]/g, ''))));
    if (ertekek.length !== evek.length || ertekek.some((x) => x !== null && !Number.isFinite(x))) return null;
    const t = s[i].toLowerCase();
    if (/^country$/i.test(regio)) { const k = TIPUS_EN.find(([en]) => en === t)?.[1]; if (k) ki[resz][k] = ertekek; }
    else if (resz === 'hasznalt' && REGIO_EN[regio.toLowerCase()] && REGIO_TIPUS[t]) ((ki.hasznaltRegio ??= {})[REGIO_EN[regio.toLowerCase()]] ??= {})[REGIO_TIPUS[t]] = ertekek;
  }
  for (const r of ['hasznalt', 'uj']) if (TIPUS_EN.some(([, k]) => !ki[r][k])) return null;
  // A régiós sorok csak akkor kellenek, ha mind a nyolc régió megvan, hiánytalanul
  const rg = ki.hasznaltRegio;
  if (!rg || Object.values(REGIO_EN).some((k) => !rg[k]) || Object.values(rg).some((x) => Object.values(x).some((sor) => sor.some((v) => v == null || v <= 0)))) delete ki.hasznaltRegio;
  return ki;
}

/** A régi és az új táblázat összevetése: a régi évek legfeljebb 15%-kal módosulhatnak, az új év az előzőhöz képest −30% és +60% között. */
export function lakasarHiheto(regi, uj) {
  if (!uj || !regi.evek.every((e) => uj.evek.includes(e))) return 'hiányzik egy korábbi év';
  for (const r of ['hasznalt', 'uj']) for (const [t, sor] of Object.entries(uj[r])) {
    if (r === 'hasznalt' && sor.some((x) => x == null || x <= 0)) return `hiányzó érték: használt, ${t}`;
    for (const [i, e] of uj.evek.entries()) {
      const j = regi.evek.indexOf(e), x = sor[i];
      if (x == null) continue;
      if (j >= 0 && regi[r][t][j] != null && Math.abs(x / regi[r][t][j] - 1) > 0.15) return `${e}, ${t}: ${regi[r][t][j]} helyett ${x}`;
      const elozo = sor[i - 1];
      if (j < 0 && elozo != null && (x / elozo < 0.7 || x / elozo > 1.6)) return `${e}, ${t}: ${elozo} után ${x}`;
    }
  }
  return null;
}

/** Hihetőség: tartományon belül, és a régihez képest legfeljebb ugras százalékponttal tér el (ha van régi). */
export function hiheto(uj, regi, { min, max, ugras }) {
  if (!Number.isFinite(uj) || uj < min || uj > max) return false;
  return regi == null || Math.abs(uj - regi) <= ugras;
}

async function letolt(url, ido = 30000) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (onallo-frissito; +https://github.com/czakopeti/lakaskoltseg)', 'accept-language': 'hu,en' }, redirect: 'follow', signal: AbortSignal.timeout(ido) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

/**
 * Futtatás. Visszaad: { ma, atirt: [{mi, regi, uj, forras}], gond: [{nev, url, ok}] }.
 * leto: tesztben cserélhető letöltő (url → html | null, ha nincs ilyen oldal).
 */
export async function futtat({ leto = letolt, ma = maBudapest() } = {}) {
  const j = { ma, atirt: [], gond: [] };
  const naplo = olvas('data/valtozasok.json');

  // 1. Az előző évi átlagos infláció (a KSH január közepén közli). Január 8-tól nézzük, amíg meg nem jelenik.
  const inf = olvas('data/inflacio.json');
  const elozo = String(Number(ma.slice(0, 4)) - 1);
  if (!inf.evek[elozo] && ma.slice(5) >= '01-08') {
    const url = kshUrl(elozo);
    try {
      const html = await leto(url);
      if (html != null) {
        const p = kshEvesInflacio(html, elozo);
        const regi = inf.evek[String(Number(elozo) - 1)]?.szazalek;
        if (p == null) j.gond.push({ nev: `KSH: a ${elozo}. évi átlagos infláció`, url, ok: 'Az oldal megvan, de nem találtam rajta az éves átlagot (vagy két helyen mást ír).' });
        else if (!hiheto(p, regi, { min: -5, max: 40, ugras: 12 })) j.gond.push({ nev: `KSH: a ${elozo}. évi átlagos infláció`, url, ok: `Valószínűtlen érték: ${hu(p)}% (előző év: ${hu(regi)}%). Nem írtam át.` });
        else {
          inf.evek[elozo] = { szazalek: p, forras: { nev: `KSH: Fogyasztói árak, ${elozo}. december`, url, kelt: ma } };
          j.atirt.push({ mi: `A ${elozo}. évi átlagos infláció (KSH)`, regi: null, uj: p, url });
        }
      } // 404: még nem jelent meg, a figyelő január 15-től szól
    } catch (e) { j.gond.push({ nev: `KSH: a ${elozo}. évi átlagos infláció`, url, ok: String(e.message || e) }); }
  }
  if (inf.evek[elozo]) inf.ellenorizve = ma;
  ir('data/inflacio.json', inf);

  // 2. A Prémium Magyar Állampapír kamata (a bérlés vagy vétel kockázatmentes hozama).
  const sz = olvas('data/szabalyok.json');
  const t = sz.temak.find((x) => x.id === 'berles_vetel')?.tetelek.find((x) => x.kulcs === 'allampapir');
  if (t) {
    const url = t.forras.url;
    try {
      const html = await leto(url);
      const k = html == null ? null : pmapKamat(html);
      const regi = t.ertek.szazalek;
      if (k == null) j.gond.push({ nev: 'Államkincstár: a Prémium Magyar Állampapír kamata', url, ok: 'Nem találtam a „KAMAT: x%” sort az oldalon. Lehet, hogy átszervezték.' });
      else if (!hiheto(k, regi, { min: 0, max: 30, ugras: 8 })) j.gond.push({ nev: 'Államkincstár: a Prémium Magyar Állampapír kamata', url, ok: `Valószínűtlen érték: ${hu(k)}% (eddig: ${hu(regi)}%). Nem írtam át.` });
      else {
        if (k !== regi) {
          t.ertek.szazalek = k;
          t.forras.kelt = ma;
          j.atirt.push({ mi: 'A Prémium Magyar Állampapír kamata (Államkincstár)', regi, uj: k, url });
        }
        t.ellenorizve = ma;
      }
    } catch (e) { j.gond.push({ nev: 'Államkincstár: a Prémium Magyar Állampapír kamata', url, ok: String(e.message || e) }); }
    ir('data/szabalyok.json', sz);
  }

  // 3. A lakások átlagos négyzetméterára településtípusonként (KSH STADAT, évente egyszer bővül)
  const la = olvas('data/lakasar.json');
  try {
    const html = await leto(la.letoltes);
    const uj = html == null ? null : kshLakasar(html);
    const gond = uj ? lakasarHiheto(la, uj) : 'nem találtam a várt táblázatot (az országos sorokat településtípusonként)';
    if (gond) j.gond.push({ nev: 'KSH: a lakások átlagos négyzetméterára', url: la.forras.url, ok: `${gond}. Nem írtam át.` });
    else {
      const ujEv = uj.evek[uj.evek.length - 1], regiEv = la.evek[la.evek.length - 1];
      if (!uj.hasznaltRegio) j.gond.push({ nev: 'KSH: a lakások átlagos négyzetméterára régiónként', url: la.forras.url, ok: 'A régiós sorokat nem találtam hiánytalanul. Az országos adatot átírtam, a régiósat nem.' });
      const valtozott = JSON.stringify([uj.evek, uj.hasznalt, uj.uj, uj.hasznaltRegio || la.hasznaltRegio]) !== JSON.stringify([la.evek, la.hasznalt, la.uj, la.hasznaltRegio]);
      if (valtozott) {
        if (ujEv > regiEv) j.atirt.push({ mi: `A lakások ${ujEv}. évi átlagos négyzetméterára, Budapest, használt (KSH, ezer Ft/m²)`, regi: la.hasznalt.fovaros[la.evek.length - 1], uj: uj.hasznalt.fovaros[uj.evek.length - 1], url: la.forras.url });
        else {
          // Ugyanaz az év, módosított adat: az első módosított sort írjuk a naplóba (országos, aztán régiós)
          const sorok = [...Object.entries(uj.hasznalt).map(([t, x]) => [`országos, ${t}`, x, la.hasznalt[t]]), ...Object.entries(uj.hasznaltRegio || {}).flatMap(([r, o]) => Object.entries(o).map(([t, x]) => [`${r}, ${t}`, x, la.hasznaltRegio?.[r]?.[t]]))];
          const elso = sorok.find(([, x, r]) => JSON.stringify(x) !== JSON.stringify(r));
          const i = elso && elso[2] ? elso[1].findIndex((v, k) => v !== elso[2][k]) : -1;
          j.atirt.push(i >= 0
            ? { mi: `A KSH módosította a lakások négyzetméterárát (${uj.evek[i]}, ${elso[0].replace(/_/g, '-')}, használt, ezer Ft/m²${sorok.filter(([, x, r]) => JSON.stringify(x) !== JSON.stringify(r)).length > 1 ? ', és más sorokat is' : ''})`, regi: elso[2][i], uj: elso[1][i], url: la.forras.url }
            : { mi: 'A lakások négyzetméterára régiónként (KSH, használt lakások, új adatsor)', regi: null, uj: null, url: la.forras.url });
        }
        Object.assign(la, { evek: uj.evek, hasznalt: uj.hasznalt, uj: uj.uj }, uj.hasznaltRegio ? { hasznaltRegio: uj.hasznaltRegio } : {});
        la.forras.kelt = ma;
      }
      la.ellenorizve = ma;
      ir('data/lakasar.json', la);
    }
  } catch (e) { j.gond.push({ nev: 'KSH: a lakások átlagos négyzetméterára', url: la.forras.url, ok: String(e.message || e) }); }

  // 4. Valódi eladási árak településenként és utcánként (KSH Ingatlanadattár, évente egyszer bővül)
  const iaNev = 'KSH Ingatlanadattár: eladási árak településenként';
  try {
    const regi = existsSync(join(GYOKER, 'data/ingatlanadattar.json')) ? olvas('data/ingatlanadattar.json') : null;
    const [adat, lista] = [await leto(IA.adat, 180000), await leto(IA.nevek, 60000)];
    if (adat == null || lista == null) j.gond.push({ nev: iaNev, url: IA.oldal, ok: 'Az adatfájl vagy a településlista nem érhető el a megszokott címen.' });
    else {
      const uj = tomorit(JSON.parse(adat.replace(/^\uFEFF/, '')), nevlista(lista));
      const gond = iaHiheto(regi, uj);
      if (gond) j.gond.push({ nev: iaNev, url: IA.oldal, ok: `${gond[0].toUpperCase()}${gond.slice(1)}. Nem írtam át.` });
      else {
        const { utcak, ...fo } = uj;
        const valtozott = !regi || JSON.stringify([fo.evek, fo.megyek, fo.egysegek]) !== JSON.stringify([regi.evek, regi.megyek, regi.egysegek]);
        if (valtozott) {
          const ujEv = fo.evek.at(-1);
          j.atirt.push(regi && regi.evek.at(-1) === ujEv
            ? { mi: `A KSH módosította az Ingatlanadattár ${ujEv}. évi adatait (Budapest, ezer Ft/m²)`, regi: regi.megyek['01'].s.o.at(-1), uj: fo.megyek['01'].s.o.at(-1), url: IA.oldal }
            : { mi: `Megjelentek az Ingatlanadattár ${ujEv}. évi adatai (Budapest, ezer Ft/m²)`, regi: regi ? regi.megyek['01'].s.o.at(-1) : null, uj: fo.megyek['01'].s.o.at(-1), url: IA.oldal });
          ir('data/ingatlanadattar.json', { forras: { nev: 'KSH Ingatlanadattár (a NAV illetékadatai alapján)', url: IA.oldal, letoltes: IA.adat, kelt: ma }, ellenorizve: ma, ...fo });
          utcakIr(utcak);
        } else if (regi) { regi.ellenorizve = ma; ir('data/ingatlanadattar.json', regi); }
      }
    }
  } catch (e) { j.gond.push({ nev: iaNev, url: IA.oldal, ok: String(e.message || e) }); }

  // 5. A KSH negyedéves lakáspiaci árindexe (használt lakások, tiszta árváltozás): a mai ár becsléséhez
  const aiNev = 'KSH: negyedéves lakáspiaci árindex';
  try {
    const regi = existsSync(join(GYOKER, 'data/arindex.json')) ? olvas('data/arindex.json') : null;
    const szoveg = await leto(ARINDEX_URL);
    const uj = szoveg == null ? null : arindex(szoveg);
    const utolso = uj?.negyedevek.at(-1);
    const gond = !uj ? 'nem találtam a „YYYY = 100” blokkot a használt lakások tiszta árindexével'
      : uj.negyedevek.length < 8 ? `csak ${uj.negyedevek.length} negyedév van benne`
      : !(utolso[1] > 20 && utolso[1] < 300) ? `valószínűtlen utolsó érték: ${utolso[1]}`
      : regi && regi.negyedevek.at(-1)[0] > utolso[0] ? `az utolsó negyedév ${utolso[0]}, korábban ${regi.negyedevek.at(-1)[0]} volt` : null;
    if (gond) j.gond.push({ nev: aiNev, url: ARINDEX_OLDAL, ok: `${gond[0].toUpperCase()}${gond.slice(1)}. Nem írtam át.` });
    else {
      if (!regi || JSON.stringify([uj.bazis, uj.negyedevek]) !== JSON.stringify([regi.bazis, regi.negyedevek])) {
        if (!regi || regi.negyedevek.at(-1)[0] !== utolso[0]) j.atirt.push({ mi: `A KSH negyedéves lakásárindexe, ${utolso[0].slice(0, 4)}. ${['I', 'II', 'III', 'IV'][Number(utolso[0].slice(5)) - 1]}. negyedév (használt lakások, ${uj.bazis} = 100)`, regi: null, uj: utolso[1], url: ARINDEX_OLDAL });
      }
      ir('data/arindex.json', { leiras: 'KSH STADAT 18.2.1.8: a használt lakások tiszta árindexe negyedévenként (a megadott év átlaga = 100). A mai ár becsléséhez.', forras: { nev: 'KSH STADAT 18.2.1.8. Lakáspiaci árindex negyedévenként', url: ARINDEX_OLDAL, letoltes: ARINDEX_URL, kelt: regi && JSON.stringify(regi.negyedevek) === JSON.stringify(uj.negyedevek) ? regi.forras.kelt : ma }, ellenorizve: ma, bazis: uj.bazis, negyedevek: uj.negyedevek });
    }
  } catch (e) { j.gond.push({ nev: aiNev, url: ARINDEX_OLDAL, ok: String(e.message || e) }); }

  for (const a of j.atirt) naplo.bejegyzesek.unshift({ datum: ma, mi: a.mi, regi: a.regi, uj: a.uj, forras: a.url, gepi: true });
  if (j.atirt.length) ir('data/valtozasok.json', naplo);
  return j;
}

/** Utcák vármegyénként: soronként egy település, hogy a git-különbség olvasható maradjon. */
function utcakIr(utcak) {
  mkdirSync(join(GYOKER, 'data/utcak'), { recursive: true });
  for (const [m, tel] of Object.entries(utcak)) {
    writeFileSync(join(GYOKER, `data/utcak/${m}.json`), `{\n${Object.entries(tel).map(([k, l]) => `${JSON.stringify(k)}: ${JSON.stringify(l)}`).join(',\n')}\n}\n`);
  }
}

/** A jegy szövege (csak a gondok; az átírások a commitban és a naplóban látszanak). */
export function jegySzoveg(j) {
  if (!j.gond.length) return '';
  return `## Az önálló frissítő nem tudott frissíteni\n\nA régi érték maradt. Nézd meg a forrást, és ha kell, írd át kézzel.\n\n${j.gond.map((g) => `- [${g.nev}](${g.url})\n  Ok: ${g.ok}`).join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const j = await futtat();
  console.error(`Önálló frissítők: átírva ${j.atirt.length}, gond ${j.gond.length}`);
  for (const a of j.atirt) console.error(`  ${a.mi}: ${a.regi ?? '–'} → ${a.uj}`);
  process.stdout.write(jegySzoveg(j));
}
