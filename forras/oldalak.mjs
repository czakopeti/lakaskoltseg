// Az oldalak. Minden szám az adatfájlokból jön, a szöveg a SZOVEG_STILUS.md szerint.
// Most a váz van itt: főoldal (munkaverzió), források, rólunk, jogi oldalak. A kalkulátorok a tartalomterv szerint jönnek.
import * as M from './js/megjelenites.mjs';
import * as S from './js/szamitas.mjs';
import { CSOPORTOK, oldal, oldalfej, ellenorzesKesik, morzsaLd, tovabb, esc, datumHu, forgalmi, elszamolas, sor, szamMezo, reszCim, negyzetek, jelolo, gyik, gyikLd, alkalmazasLd, forrasLista, lakasMakett } from './sablon.mjs';

/* ======================= FŐOLDAL ======================= */
/**
 * A főoldal kártyáinak szövege oldalanként: mit kap, aki rákattint. A sorrendet és a csoportot a CSOPORTOK adja (sablon.mjs).
 * A teszt ellenőrzi, hogy minden csoportelemnek van itt szövege.
 */
export const FOOLDAL_KARTYAK = {
  'vagyonszerzesi-illetek-kalkulator/': [() => 'Mennyi illetéket fizetsz a megvett lakás után, és melyik kedvezmény jár: cserét pótló vétel, új lakás, első lakás 35 év alatt, CSOK Plusz.', 'Kiszámolom'],
  'wekerle-plusz-kalkulator/': [() => 'Feltételenként megnézi, megkapod-e a hitelt, és mennyi lesz a havi törlesztő 3% vagy 5% kamattal.', 'Megnézem'],
  'lakasvaltas-kalkulator/': [() => 'Eladás és vétel egy lapon: mennyit kapsz kézhez, mennyibe kerül az új lakás, és mennyi hitel kell még.', 'Kiszámolom'],
  'lakaskiadas-ado-kalkulator/': [() => 'Mennyi adót fizetsz a bérleti díj után, és melyik a jobb: a 10% költséghányad vagy a tételes elszámolás.', 'Kiszámolom'],
  'ingatlaneladas-szja-kalkulator/': [() => 'Mennyi adót fizetsz, ha eladod a lakásod, a házad vagy a telked, mit vonhatsz le, és melyik évtől nem fizetsz semmit.', 'Kiszámolom'],
  'forrasok/': [() => 'Minden szabály, amivel számolunk: jogszabályhely, forrás, és mikor ellenőriztük utoljára.', 'Megnézem'],
};

/** A makett zászlói: a négy leggyakoribb mérték, mind az adatfájlból. A link a kalkulátorra vagy a forrásra visz. */
function zaszlok(k, L) {
  const sz = (kulcs) => S.szabaly(k.adat, kulcs).ertek;
  const wp = sz('wekerle_plusz.kamat');
  return [
    { x: 70, y: 48, ertek: `${sz('illetek.altalanos_mertek').szazalek}%`, cim: 'illeték, ha veszel', href: L.l(ILLETEK_UT) },
    { x: 380, y: 60, ertek: `${sz('szja_eladas.ado_mertek').szazalek}%`, cim: 'adó, ha nyereséggel adod el', href: L.l(ELADAS_UT) },
    { x: 390, y: 215, ertek: `${sz('berbeadas.ado_mertek').szazalek}%`, cim: 'adó, ha kiadod', href: L.l(KIADAS_UT) },
    { x: 75, y: 240, ertek: `${wp.uj_szazalek}% és ${wp.hasznalt_szazalek}%`, cim: 'Wekerle Plusz kamat', href: L.l(WEKERLE_UT) },
  ];
}
export function fooldal(k) {
  const tartalom = (L) => `
<div class="keret nyito"><div>${oldalfej(L, { fo: true, cim: 'Mennyibe kerül venni, eladni vagy kiadni egy lakást?', valasz: 'Illeték, adó és hitel, forinttal kiszámolva. Minden szabály mellett ott a jogszabály és a nap, amikor utoljára ellenőriztük.' }).replace('<div class="keret oldalfej', '<div class="oldalfej')}</div>${lakasMakett(zaszlok(k, L))}</div>
${CSOPORTOK.map((cs) => `<section class="szakasz" id="${cs.id}"><div class="keret">
<h2>${cs.cim}</h2>
<p class="csoport-bevezeto">${cs.bevezeto}</p>
<ul class="lista">
${cs.elemek.map(([u, n, , teljes]) => { const [szoveg, ugrik] = FOOLDAL_KARTYAK[u]; return `<li><a href="${L.l(u)}"><h3>${teljes || n}</h3><p>${szoveg(k)}</p><span class="ugrik">${ugrik}</span></a></li>`; }).join('\n')}
</ul></div></section>`).join('\n')}`;
  return oldal(k, { cim: `${k.cfg.marka}: lakásvásárlás, -eladás és -kiadás költségei`, leiras: 'Vagyonszerzési illeték, ingatlaneladás adója, lakáskiadás adója és kamattámogatott hitel, forrással és dátummal.', ut: '', tartalom });
}

/* ======================= FORRÁSOK ======================= */
const SZINT = { elsodleges: 'jogszabály vagy NAV', masodlagos: 'szaksajtó, ellenőrzés alatt' };

export function forrasokOldal(k) {
  const { adat } = k;
  const ut = 'forrasok/';
  const sz = adat.szabalyok;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: ['Források'], cim: 'Honnan vannak a számok?', bevezeto: 'A jogszabályokból és a NAV tájékoztatóiból. Minden szabály mellett ott a jogszabályhely, a forrás és a nap, amikor utoljára összevetettük vele.' })}
<div class="keret"><article class="cikk" style="padding-top:20px">
${sz.temak.map((t) => `<h2 id="${t.id}">${t.cim}</h2>
<dl class="szabalyok">
${t.tetelek.map((x) => `<div><dt>${esc(x.nev)}</dt><dd><p>${esc(x.szoveg)}</p>${x.megjegyzes ? `<p class="kicsi halk">${esc(x.megjegyzes)}</p>` : ''}<p class="kicsi halk">${esc(x.jogszabaly)}. Forrás: <a href="${esc(x.forras.url)}" rel="noopener" target="_blank">${esc(x.forras.nev)}</a>${x.forras.kelt ? ` (${datumHu(x.forras.kelt)})` : ''}. Szint: ${SZINT[x.szint]}. Ellenőrizve: ${datumHu(x.ellenorizve)}</p></dd></div>`).join('\n')}
</dl>`).join('\n')}
${sz.nyitott.length ? `<h2 id="nyitott">Amit még ellenőrzünk</h2>
<ul>${sz.nyitott.map((n) => `<li>${esc(n.mi)} ${esc(n.teendo)}</li>`).join('')}</ul>` : ''}
<h2 id="becslesek">Amit becsülünk, és mi alapján</h2>
<p>A „becslés” jelölésű tételek a mi feltevéseink. Ide kerül majd mindegyik, a forrásával együtt. A saját számaid ezeknél mindig pontosabbak, ezért a kalkulátorokban mindegyiket átírhatod.</p>
<h2>Hogyan frissül?</h2>
<p>A szabályokat egy adatfájlban tartjuk, tételenként az ellenőrzés napjával. Ha jogszabály változik, a tételt átírjuk, és a dátum is frissül.${ellenorzesKesik(adat.allapot.utolso_ellenorzes, k.ma) ? ' A legutóbbi teljes ellenőrzés több mint 45 napja volt, a felülvizsgálat esedékes.' : ''}</p>
<p class="halk">Legutóbbi ellenőrzés: ${datumHu(adat.allapot.utolso_ellenorzes || k.ma)}.</p>
<h2>Hibát találtál?</h2>
<p>${k.cfg.kapcsolat_email ? `Írj a ${esc(k.cfg.kapcsolat_email)} címre. Minden jelzést megnézünk.` : 'Az oldal alján lévő dobozban jelezheted.'}</p>
${tovabb(L, ut)}
</article></div>`;
  return oldal(k, { cim: 'Honnan vannak a számok?', leiras: `${M.nevelo(k.cfg.marka).replace(/^a/, 'A')} ${k.cfg.marka} szabályainak forrásai: jogszabályhely, közzététel és az ellenőrzés napja.`, ut, tartalom, jsonld: [morzsaLd(k.cfg, [{ nev: 'Források', ut }])] });
}

/** Gépi adatcsatorna: a szabályok JSON-ban, regisztráció nélkül. */
export const JSON_UT = 'adatok/v1/';
export function adatJsonok(adat, cfg) {
  const kozos = { forras: cfg.domain, licenc: 'CC BY 4.0', ellenorizve: adat.allapot.utolso_ellenorzes };
  return {
    'index.json': { ...kozos, leiras: 'Magyar lakásvásárlási, -eladási és -kiadási szabályok gépi formában.', fajlok: [{ fajl: 'szabalyok.json', url: `${cfg.domain}/${JSON_UT}szabalyok.json`, leiras: adat.szabalyok.leiras }] },
    'szabalyok.json': { ...kozos, ...adat.szabalyok },
  };
}

/* ======================= RÓLUNK ======================= */
export function rolunkOldal(k) {
  const { cfg } = k;
  const ut = 'rolunk/';
  const marka = cfg.marka;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: ['Rólunk'], cim: 'Kik vagyunk, és hogyan dolgozunk?', valasz: `${M.nevelo(marka).replace(/^a/, 'A')} ${marka} független, ingyenes oldal. A szabályokat a jogszabályokból és a NAV tájékoztatóiból vesszük, és minden eredménynél jelöljük, mi hivatalos, mi a te adatod és mi becslés.` })}
<div class="keret"><article class="cikk">
<h2>Ki készíti?</h2>
<p>${cfg.uzemelteto.nev ? `Az oldalt ${esc(cfg.uzemelteto.nev)} üzemelteti.` : 'Az üzemeltető adatai az oldal indulásakor kerülnek ide és az Impresszumba.'} Nem vagyunk a NAV, bank, hitelközvetítő vagy ingatlaniroda, és egyiktől sem kapunk pénzt azért, hogy mit írunk.</p>
<h2>Szerkesztői elvek</h2>
<ul>
<li><strong>Forrás nélkül nincs szám.</strong> Minden szabálynál ott a jogszabályhely, a forrás és az ellenőrzés napja. A <a href="${L.l('forrasok/')}">Források</a> oldalon egy helyen is megtalálod őket.</li>
<li><strong>Megmondjuk, mi biztos és mi nem.</strong> Az eredményekben minden sor jelölést kap: <em>hivatalos</em>, ha jogszabály vagy NAV-tájékoztató szerinti tétel, <em>saját</em>, ha te adtad meg, <em>becslés</em>, ha a mi feltevésünk.</li>
<li><strong>Bankokat nem rangsorolunk.</strong> A hitelnél semleges kamattal vagy a jogszabály szerinti fix kamattal számolunk. A konkrét ajánlatokért a bankok és az összehasonlító oldalak felé mutatunk, jutalék nélkül.</li>
<li><strong>A hibát kijavítjuk.</strong> Ha valami nem stimmel, az oldalak alján jelezheted.</li>
<li><strong>Nem gyűjtünk rólad adatot.</strong> Nincs regisztráció és nincs követő süti. Amit beírsz, a böngésződben marad. Részletek az <a href="${L.l('adatvedelem/')}">Adatvédelem</a> oldalon.</li>
</ul>
<h2>Amit nem vállalunk</h2>
<p>A kalkulátorok tájékoztató jellegűek, és nem helyettesítik az adótanácsadást, az ügyvédet vagy a bank ajánlatát. A ténylegesen fizetendő adót és illetéket a NAV határozata tartalmazza.</p>
${tovabb(L, ut)}
</article></div>`;
  return oldal(k, { cim: 'Rólunk és szerkesztői elveink', leiras: `Ki készíti ${M.nevelo(marka)} ${marka} oldalt, honnan vannak a számok, hogyan ellenőrizzük és javítjuk őket.`, ut, tartalom });
}

/* ======================= JOGI OLDALAK ======================= */
const kitoltendo = (x) => x || '<em class="halk">kitöltés alatt</em>';

export function impresszumOldal(k) {
  const { cfg } = k;
  const u = cfg.uzemelteto;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: ['Impresszum'], cim: 'Impresszum' })}
<div class="keret"><article class="cikk" style="padding-top:12px">
<div class="tabla-tarto"><table class="tabla"><tbody>
<tr><td>Weboldal</td><td>${cfg.domain.replace('https://', '')}</td></tr>
<tr><td>Üzemeltető</td><td>${kitoltendo(u.nev ? esc(u.nev) : '')}</td></tr>
${u.tipus === 'magánszemély' && !u.szekhely ? '' : `<tr><td>Székhely</td><td>${kitoltendo(u.szekhely)}</td></tr>`}
${u.tipus === 'magánszemély' && !u.adoszam ? '' : `<tr><td>Adószám</td><td>${kitoltendo(u.adoszam)}</td></tr>`}
${u.tipus === 'magánszemély' && !u.nyilvantartasi_szam ? '' : `<tr><td>Nyilvántartási szám</td><td>${kitoltendo(u.nyilvantartasi_szam)}</td></tr>`}
<tr><td>E-mail</td><td>${cfg.kapcsolat_email ? `<a href="mailto:${esc(cfg.kapcsolat_email)}">${esc(cfg.kapcsolat_email)}</a>` : kitoltendo('')}</td></tr>
${u.telefon ? `<tr><td>Telefon</td><td><a href="tel:${esc(u.telefon.replace(/\s/g, ''))}">${esc(u.telefon)}</a></td></tr>` : ''}
<tr><td>Tárhelyszolgáltató</td><td>${cfg.tarhely.nev}, ${cfg.tarhely.cim}</td></tr>
</tbody></table></div>
<h2>Felelősség</h2>
<p>A kalkulátorok a jogszabályok és a NAV közzétett tájékoztatói alapján számolnak, és tájékoztató jellegűek. Nem minősülnek adó-, jogi vagy pénzügyi tanácsadásnak. A ténylegesen fizetendő adót és illetéket a NAV határozata tartalmazza. Az adatok pontosságára gondosan figyelünk, de a számítások alapján hozott döntésekért nem vállalunk felelősséget.</p>
</article></div>`;
  return oldal(k, { cim: 'Impresszum', leiras: `${M.nevelo(cfg.marka).replace(/^a/, 'A')} ${cfg.marka} üzemeltetőjének és tárhelyszolgáltatójának adatai.`, ut: 'impresszum/', tartalom });
}

export function adatvedelemOldal(k) {
  const { cfg } = k;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: ['Adatvédelem'], cim: 'Adatvédelem', bevezeto: 'Nem gyűjtünk rólad adatot. A kalkulátorok a böngésződben számolnak, amit beírsz, az csak akkor jut el hozzánk, ha a visszajelzés-dobozban magad elküldöd.' })}
<div class="keret"><article class="cikk" style="padding-top:12px">
<h2>Sütik és követés</h2>
<p>Nem használunk sütit, nem azonosítunk, és hirdetés sincs az oldalon. A betűtípusokat magunk szolgáljuk ki. Ha ezen valaha változtatunk, előbb itt jelezzük, és csak a hozzájárulásoddal kapcsolunk be bármit.</p>
<h2>Mit számolunk a kalkulátorokban?</h2>
<p>Hogy lássuk, melyik kalkulátor működik jól, oldalanként és havonta néhány darabszámot gyűjtünk: hányan kezdtek el adatot beírni, hányan jutottak eredményig, hányan osztották meg vagy nyomtatták ki a számítást, és hányan kattintottak tovább egy másik kalkulátorra. Egy számláló nő eggyel, más nem történik. A beírt adataidat, az eredményt, az IP-címedet nem küldjük és nem tároljuk, sütit vagy más azonosítót nem teszünk a gépedre. Mivel ezekből a számokból senki sem azonosítható, ez nem személyes adat.</p>
<h2>Visszajelzés</h2>
<p>Az oldalak alján megkérdezzük, hasznos volt-e az oldal. Az Igen vagy Nem gombnyomásból csak egy számláló nő az adott oldalnál. Nem tároljuk, ki nyomta meg, és az IP-címét sem. A böngésződ megjegyzi a választásodat, hogy ugyanazt a szavazatot ne számoljuk kétszer.</p>
<p>Ha a Nem után pár szót is írsz és elküldöd, a szöveget és az oldal címét kapjuk meg. Kalkulátornál, ha a négyzetet bejelölve hagyod, a beírt számokat (például vételár, szerzés éve) és a kapott eredményt is. Név és e-mail-cím nem kell hozzá. Ha mégis beleírsz e-mail-címet, telefonszámot vagy bankszámlaszámot, azt eltárolás előtt kitakarjuk. A visszajelzéseket a fejlesztéshez használt GitHub (GitHub, Inc., USA, a Microsoft-csoport tagja, csatlakozott az EU–USA adatvédelmi keretrendszerhez) feladatkezelőjében tároljuk. Arra használjuk, hogy kijavítsuk a hibát, és a lezárása után legfeljebb egy évig őrizzük meg. A jogalap a szolgáltatás javításához fűződő jogos érdekünk.</p>
<h2>Megosztott számítás</h2>
<p>A „Számítás megosztása” gomb egy linket készít, amelyben a kalkulátorba beírt számok benne vannak, így aki megkapja, ugyanazt a számítást látja. A linket te küldöd el annak, akinek akarod, hozzánk nem jut el.</p>
<h2>Szervernapló</h2>
<p>Az oldalt a ${cfg.tarhely.nev} (${cfg.tarhely.cim}) szolgálja ki. Mint minden tárhelyszolgáltató, technikai naplót vezet a kérésekről (például IP-cím, időpont, böngésző), a szolgáltatás biztonsága és működése érdekében. Ezeket mi nem használjuk, és nem kötjük személyhez. A Cloudflare amerikai cég, és tagja az EU–USA adatvédelmi keretrendszernek (Data Privacy Framework), ezért az Európai Unióból továbbított adatokra az uniós szintű védelem vonatkozik.</p>
<h2>Adatkezelő és jogaid</h2>
<p>Adatkezelő: ${kitoltendo(cfg.uzemelteto.nev)}${cfg.kapcsolat_email ? `, ${cfg.kapcsolat_email}` : ''}. Kérhetsz tájékoztatást, helyesbítést, törlést és korlátozást, és tiltakozhatsz az adatkezelés ellen. Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz fordulhatsz (NAIH, 1055 Budapest, Falk Miksa utca 9–11., naih.hu).</p>
</article></div>`;
  return oldal(k, { cim: 'Adatvédelem', leiras: `${M.nevelo(cfg.marka).replace(/^a/, 'A')} ${cfg.marka} nem használ sütit és nem azonosít, a számítás a böngészőben fut.`, ut: 'adatvedelem/', tartalom });
}

export function nemTalalhatoOldal(k) {
  const tartalom = (L) => `
${oldalfej(L, { cim: 'Ez az oldal nincs meg', bevezeto: `Lehet, hogy elírás van a címben, vagy az oldal máshová került. <a href="${L.l('')}">Vissza a főoldalra</a>` })}`;
  return oldal({ ...k, cfg: { ...k.cfg, eles: false } }, { cim: 'Az oldal nem található', leiras: 'Az oldal nem található.', ut: '', tartalom });
}

/* ======================= KALKULÁTOROLDALAK ======================= */
/** A kalkulátorhoz szükséges szabályok (a böngészőbe csak ez megy). */
const temaAdat = (adat, ...idk) => ({ szabalyok: { temak: adat.szabalyok.temak.filter((t) => idk.includes(t.id)) } });
/** Források listája szabálykulcsokból, ismétlés nélkül, közzététellel és az ellenőrzés napjával. */
function forrasokBol(adat, kulcsok, extra = []) {
  const m = new Map();
  for (const kk of kulcsok) { const x = S.szabaly(adat, kk); if (!m.has(x.forras.url)) m.set(x.forras.url, { nev: x.forras.nev, url: x.forras.url, d: `${x.forras.kelt ? `${datumHu(x.forras.kelt)} ` : ''}Ellenőrizve: ${datumHu(x.ellenorizve)}` }); }
  return forrasLista([...m.values(), ...extra]);
}
/**
 * Egy kalkulátoroldal váza: fej a válasszal, űrlap, elszámolás a címkézett mintával (ugyanaz a kód számolja, mint a böngészőben),
 * magyarázat, gyakori kérdések, források. o: { ut, tipus, nev, cim, valasz, urlapCim, urlapAl, urlap, cikk, kerdesek, forrasKulcsok, temak, oldalCim, leiras }
 */
function kalkOldal(k, o) {
  const adatJson = { ...temaAdat(k.adat, ...o.temak), ev: k.ev, ma: k.ma };
  const kezdo = M.kalkHtml(o.tipus, adatJson, {}).html;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: [o.nev], cim: o.cim, valasz: o.valasz, friss: M.datumNapon(k.adat.allapot.utolso_ellenorzes || k.ma) })}
<div class="keret asztal">
${forgalmi({ kalk: o.tipus, cim: o.urlapCim, al: o.urlapAl || '', tartalom: o.urlap, extra: ` data-kalk-nev="${o.tipus}"` })}
${elszamolas(k, kezdo, { kesz: true })}
</div>
<div class="keret"><article class="cikk">
${o.cikk}
<h2>Gyakori kérdések</h2>
${gyik(o.kerdesek)}
<h2>Források</h2>
${forrasokBol(k.adat, o.forrasKulcsok, o.forrasExtra)}
${tovabb(L, o.ut)}
</article></div>`;
  return oldal(k, { cim: o.oldalCim, leiras: o.leiras, ut: o.ut, tartalom, adatJson, jsonld: [alkalmazasLd(k.cfg, o.oldalCim.replace(/:.*$/, ''), o.ut, o.leiras), gyikLd(o.kerdesek), morzsaLd(k.cfg, [{ nev: o.nev, ut: o.ut }])] });
}

/* ======================= INGATLANELADÁS SZJA-JA ======================= */
export const ELADAS_UT = 'ingatlaneladas-szja-kalkulator/';
export function eladasOldal(k) {
  const { adat } = k;
  const sz = (kulcs) => S.szabaly(adat, `szja_eladas.${kulcs}`);
  const tabla = sz('jovedelem_hanyad').ertek.szazalek_evenkent;
  const kulcs = sz('ado_mertek').ertek.szazalek;
  const mentesEvek = tabla.length - 1;
  const pelda = S.eladasSzja(adat, { eladasEv: k.ev, szerzesEv: k.ev - 2, eladasiAr: 60000000, szerzesiErtek: 50000000, szerzesKoltseg: 2000000 });
  return kalkOldal(k, {
    ut: ELADAS_UT, tipus: 'eladas', nev: 'Eladás adója', temak: ['szja_eladas'],
    oldalCim: `Ingatlaneladás szja-kalkulátor ${k.ev}: mennyi az adó?`,
    leiras: `Ingatlaneladás adója ${k.ev}-ben: a szerzés évéből, az eladási árból és a költségekből kiszámolja a ${kulcs}%-os szja-t, és megmutatja, melyik évtől adómentes.`,
    cim: 'Mennyi adót fizetsz, ha eladod az ingatlanod?',
    valasz: `A nyereség egy része után ${kulcs}% személyi jövedelemadót, a szerzést követő ${mentesEvek}. évtől pedig semennyit. Egy ${k.ev - 2}-ben 50 millió forintért vett és ${M.rag(k.ev, 'ban', 'ben')} 60 millió forintért eladott lakásnál, 2 millió forint költséggel ez ${M.fmt(pelda.ado)} Ft.`,
    urlapCim: 'Az eladott ingatlan', urlapAl: 'Lakás, ház, nyaraló, telek',
    urlap: `
<fieldset>${reszCim('', 'Az eladás')}
${sor('', szamMezo({ id: 'eladasiAr', cim: 'Eladási ár', me: 'Ft', placeholder: 'pl. 60 000 000', min: 0, szeles: true, sugo: 'Az adásvételi szerződésben szereplő vételár. Ha csak a tulajdoni hányadodat adod el, a rád eső rész.' }))}
${sor('', szamMezo({ id: 'eladasEv', cim: 'Az eladás éve', placeholder: `pl. ${k.ev}`, min: 2017, max: k.ev + 5, sugo: `Amikor a szerződést benyújtják a földhivatalhoz. Ha üresen hagyod, az idei évvel (${k.ev}) számolunk.` }))}
</fieldset>
<fieldset>${reszCim('II.', 'A szerzés')}
<p class="fieldset-megj">A tulajdoni lap II. részében, a tulajdonjogod bejegyzésénél találod.</p>
${sor('II.', szamMezo({ id: 'szerzesEv', cim: 'A szerzés éve', placeholder: `pl. ${k.ev - 2}`, min: 1950, max: k.ev + 5, sugo: 'Vételnél a szerződés földhivatali érkezésének éve, öröklésnél az örökhagyó halálának éve.' }))}
${sor('', szamMezo({ id: 'szerzesiErtek', cim: 'Szerzési érték', me: 'Ft', placeholder: 'pl. 50 000 000', min: 0, szeles: true, sugo: 'Vételnél az akkori vételár. Öröklésnél a hagyatéki eljárásban megállapított érték.' }))}
</fieldset>
<fieldset>${reszCim('', 'Levonható költségek')}
<p class="fieldset-megj">Csak azt írd be, amiről számlád vagy okiratod van.</p>
${sor('', szamMezo({ id: 'szerzesKoltseg', cim: 'A szerzés költségei', me: 'Ft', placeholder: 'pl. 2 000 000', min: 0, szeles: true, sugo: 'A megfizetett illeték, az ügyvédi díj.' }))}
${sor('', szamMezo({ id: 'beruhazas', cim: 'Értéknövelő beruházás', me: 'Ft', placeholder: 'pl. 3 000 000', min: 0, szeles: true, sugo: 'Felújítás, bővítés, korszerűsítés, számlával.' }))}
${sor('', szamMezo({ id: 'eladasKoltseg', cim: 'Az eladás költségei', me: 'Ft', placeholder: 'pl. 1 500 000', min: 0, szeles: true, sugo: 'Ingatlanközvetítő, hirdetés, energetikai tanúsítvány.' }))}
</fieldset>`,
    cikk: `<h2>Hogyan számol az adóhivatal?</h2>
<p>Az eladási árból levonod, amennyiért szerezted, és a számlával igazolt költségeket. Ami marad, az a számított összeg. Ebből annál kevesebb számít jövedelemnek, minél régebben a tiéd az ingatlan.</p>
<div class="tabla-tarto"><table class="tabla"><thead><tr><th>Mikor adod el</th><th>A számított összegből jövedelem</th></tr></thead><tbody>
${tabla.map((p, i) => `<tr><th scope="row">${i === 0 ? 'A szerzés évében' : i === tabla.length - 1 ? `A szerzést követő ${i}. évben és később` : `A szerzést követő ${i}. évben`}</th><td>${p}%</td></tr>`).join('')}
</tbody></table></div>
<p>A jövedelem után ${kulcs}% az adó. Az évek naptári évek: aki ${k.ev - 1} decemberében szerzett, annak ${k.ev} már a szerzést követő első év.</p>`,
    kerdesek: [
      { k: 'Mikor nem kell adót fizetni az eladott ingatlan után?', v: [`Ha a szerzést követő ${mentesEvek}. évben vagy később adod el. Aki ${M.rag(k.ev - mentesEvek, 'ban', 'ben')} vagy korábban szerezte az ingatlanát, annak a ${k.ev}. évi eladásból nincs adóköteles jövedelme.`, 'Akkor sincs adó, ha a költségeid elérik az eladási árat, vagyis nem volt nyereséged.'] },
      { k: 'Számít, hogy lakást, nyaralót vagy telket adok el?', v: ['Nem. 2017. január 1-je óta minden ingatlanra ugyanaz az ötéves skála érvényes, a lakás és a többi ingatlan között nincs különbség.'] },
      { k: 'Melyik nap számít a szerzés időpontjának?', v: [esc(sz('szerzes_idopontja').szoveg), 'A tulajdoni lap II. részében a tulajdonjogod bejegyzése mellett találod az érkezés napját.'] },
      { k: 'Milyen költségeket vonhatok le?', v: [esc(sz('koltsegek').szoveg), 'A költségek együtt legfeljebb az eladási árig számolhatók el, veszteséget nem lehet kimutatni.'] },
      { k: 'Mikor és hogyan kell befizetni?', v: [esc(sz('bevallas').szoveg), esc(sz('reszletfizetes').szoveg)] },
    ],
    forrasKulcsok: ['szja_eladas.ado_mertek', 'szja_eladas.jovedelem_hanyad'], forrasExtra: [{ nev: 'A személyi jövedelemadóról szóló 1995. évi CXVII. törvény 59–64. §', d: '' }],
  });
}

/* ======================= VAGYONSZERZÉSI ILLETÉK ======================= */
export const ILLETEK_UT = 'vagyonszerzesi-illetek-kalkulator/';
export function illetekOldal(k) {
  const { adat } = k;
  const sz = (kk) => S.szabaly(adat, `illetek.${kk}`);
  const m = sz('altalanos_mertek').ertek.szazalek, cs = sz('cserepotlo').ertek, f = sz('elso_lakas_35').ertek, uj = sz('uj_lakas').ertek;
  const p1 = S.illetek(adat, { ertek: 60e6 }), p2 = S.illetek(adat, { ertek: 60e6, eladottErtek: 45e6, eladasMikor: 'elotte' });
  return kalkOldal(k, {
    ut: ILLETEK_UT, tipus: 'illetek', nev: 'Illeték', temak: ['illetek'],
    oldalCim: `Vagyonszerzési illeték kalkulátor ${k.ev}: minden kedvezménnyel`,
    leiras: `Lakásvásárlás illetéke ${k.ev}-ben: ${m}% és a kedvezmények (cserét pótló vétel, új lakás, 35 év alatti első lakás, CSOK Plusz, rokontól vétel), a legkedvezőbb kiválasztásával.`,
    cim: 'Mennyi illetéket fizetsz, ha lakást veszel?',
    valasz: `A forgalmi érték ${m}%-át, egy 60 millió forintos lakásnál ${M.fmt(p1.ado)} Ft-ot. Ha az elmúlt ${cs.elotte_ev} évben eladtál egy 45 millió forintos lakást, csak a különbözet után fizetsz: ${M.fmt(p2.ado)} Ft-ot.`,
    urlapCim: 'A megvett lakás', urlapAl: 'Ingatlan-adásvétel',
    urlap: `
<fieldset>${reszCim('I.', 'A lakás')}
${sor('', szamMezo({ id: 'ertek', cim: 'Vételár', me: 'Ft', placeholder: 'pl. 68 000 000', min: 0, szeles: true, sugo: 'Az illetéket a NAV a forgalmi értékből számolja, ez általában a vételár.' }))}
${sor('II.', szamMezo({ id: 'hanyad', cim: 'Tulajdoni hányad, amit szerzel', me: '%', placeholder: '100', min: 1, max: 100, tized: true, sugo: 'Ha ketten veszitek fele-fele arányban, 50. A tulajdoni lap II. részében így jegyzik be.' }))}
${sor('', negyzetek('kitol', 'Kitől veszed?', [['magan', 'Magánszemélytől'], ['vallalkozo', 'Új lakás, építő vállalkozótól'], ['rokon', 'Szülőtől, gyermektől, házastárstól']], ''))}
</fieldset>
<fieldset>${reszCim('', 'Eladott lakás')}
<p class="fieldset-megj">Ha a vétel előtt ${cs.elotte_ev} éven belül eladtál egy lakást, vagy utána ${cs.utana_ev} éven belül eladod, csak a különbözet után fizetsz.</p>
${sor('', szamMezo({ id: 'eladottErtek', cim: 'Az eladott lakás ára', me: 'Ft', placeholder: 'pl. 52 000 000', min: 0, szeles: true, sugo: 'Ha csak a hányadodat adtad el, a rád eső rész.' }))}
${sor('', negyzetek('eladasMikor', 'Mikor adtad vagy adod el?', [['elotte', `A vétel előtt ${cs.elotte_ev} éven belül`], ['utana', `A vétel után ${cs.utana_ev} éven belül`], ['regebben', 'Régebben']], ''))}
</fieldset>
<fieldset>${reszCim('', 'Rád vonatkozik?')}
${sor('', jelolo('elso', 'Ez az első lakásod', 'Nincs és nem is volt lakásod, és lakásban 50%-os vagy nagyobb tulajdoni hányadod.'))}
${sor('', jelolo('fiatal35', 'Még nem töltötted be a 35. évedet', `Az első lakásnál ${f.ertekhatar_ft / 1e6} millió forintos értékig fele az illeték.`))}
${sor('', jelolo('csok', 'CSOK Plusz hitellel vagy falusi CSOK-kal veszed', 'Ilyenkor nincs illeték.'))}
</fieldset>`,
    cikk: `<h2>Mikor mennyi az illeték?</h2>
<div class="tabla-tarto"><table class="tabla"><thead><tr><th>Eset</th><th>Illeték</th></tr></thead><tbody>
<tr><th scope="row">Általános eset</th><td>a forgalmi érték ${m}%-a</td></tr>
<tr><th scope="row">Cserét pótló vétel: eladás a vétel előtt ${cs.elotte_ev} éven belül vagy utána ${cs.utana_ev} éven belül</th><td>a két lakás értékének különbözete után ${m}%</td></tr>
<tr><th scope="row">Új lakás vállalkozótól, legfeljebb ${uj.mentes_resz_ft / 1e6} millió forint</th><td>nincs</td></tr>
<tr><th scope="row">Új lakás vállalkozótól, ${uj.mentes_resz_ft / 1e6}–${uj.ertekhatar_ft / 1e6} millió forint</th><td>a ${uj.mentes_resz_ft / 1e6} millió forintra eső rész nélkül</td></tr>
<tr><th scope="row">35 év alatti első lakásszerző, legfeljebb ${f.ertekhatar_ft / 1e6} millió forint</th><td>az illeték fele</td></tr>
<tr><th scope="row">CSOK Plusz vagy falusi CSOK</th><td>nincs</td></tr>
<tr><th scope="row">Szülőtől, gyermektől, házastárstól</th><td>nincs</td></tr>
<tr><th scope="row">Otthon Start vagy Wekerle Plusz hitel</th><td>a hitel önmagában nem ad kedvezményt</td></tr>
</tbody></table></div>
<p>Az illetéket a NAV határozat alapján szabja ki. Az adásvételi szerződést az ügyvéd nyújtja be a földhivatalhoz, és a kedvezményt is ilyenkor, a B400-as adatlapon kell kérni.</p>`,
    kerdesek: [
      { k: 'Mikor kell kifizetni az illetéket?', v: [`Nem a szerződéskor, hanem amikor megkapod a NAV határozatát: a kézbesítéstől számított ${sz('fizetesi_hatarido').ertek.nap} napon belül. Ez a vétel után általában néhány hónap.`] },
      { k: 'Mi az a cserét pótló vétel?', v: [esc(sz('cserepotlo').szoveg), `2026. január 1-je óta az eladás a vétel előtt ${cs.elotte_ev} éven belül is beszámít, korábban 3 év volt a határ.`] },
      { k: 'Jár kedvezmény a Wekerle Plusz vagy az Otthon Start mellé?', v: [esc(sz('tamogatott_hitel').szoveg)] },
      { k: 'Mennyi az illeték, ha csak a lakás felét veszem meg?', v: ['A rád eső rész értéke után fizetsz. Egy 60 millió forintos lakás feléért az illeték alapja 30 millió forint.', `A 35 év alattiak kedvezményénél viszont az egész lakás értéke számít: ha az ${f.ertekhatar_ft / 1e6} millió forint felett van, a fele sem kedvezményes.`] },
      { k: 'Ki számít első lakásszerzőnek?', v: ['Akinek nincs és nem is volt lakástulajdona, lakásban 50%-os vagy nagyobb tulajdoni hányada, és lakáshoz kapcsolódó, bejegyzett vagyoni értékű joga.'] },
    ],
    forrasKulcsok: ['illetek.altalanos_mertek', 'illetek.cserepotlo', 'illetek.uj_lakas', 'illetek.elso_lakas_35', 'illetek.tamogatott_hitel'], forrasExtra: [{ nev: 'Az illetékekről szóló 1990. évi XCIII. törvény (Itv.) 19–26. §', d: '' }],
  });
}

/* ======================= WEKERLE PLUSZ ======================= */
export const WEKERLE_UT = 'wekerle-plusz-kalkulator/';
export function wekerleOldal(k) {
  const { adat } = k;
  const w = (kk) => S.szabaly(adat, `wekerle_plusz.${kk}`).ertek;
  const kam = w('kamat'), ossz = w('osszeg'), kor = w('eletkor'), eh = w('ertekhatar');
  const p = S.wekerle(adat, { vetelar: 40e6, onero: 10e6, allapot: 'hasznalt' }), q = S.wekerle(adat, { vetelar: 40e6, onero: 10e6, allapot: 'uj' });
  return kalkOldal(k, {
    ut: WEKERLE_UT, tipus: 'wekerle', nev: 'Wekerle Plusz', temak: ['wekerle_plusz', 'illetek'],
    oldalCim: 'Wekerle Plusz kalkulátor: jogosultság és törlesztő',
    leiras: `Wekerle Plusz hitel: feltételenként a 298/2026. Korm. rendelet szerint, havi törlesztő ${kam.uj_szazalek}% vagy ${kam.hasznalt_szazalek}% fix kamattal, és mennyit ér a támogatás.`,
    cim: 'Megkapod a Wekerle Plusz hitelt, és mennyi lesz a törlesztő?',
    valasz: `${kor.tol} és ${kor.ig} év között, legfeljebb ${M.fmt(ossz.max_ft / 1e6)} millió forintot, ${ossz.max_ev} évre. Egy 30 millió forintos hitel törlesztője használt lakásnál ${kam.hasznalt_szazalek}% kamattal ${M.fmt(p.havi)} Ft, új lakásnál ${kam.uj_szazalek}%-kal ${M.fmt(q.havi)} Ft havonta.`,
    urlapCim: 'A vevő és a lakás', urlapAl: '298/2026. (X. 27.) Korm. rendelet',
    urlap: `
<fieldset>${reszCim('', 'Te')}
${sor('', szamMezo({ id: 'eletkor', cim: 'Életkorod', me: 'év', placeholder: 'pl. 31', min: 0, max: 120 }))}
${sor('', jelolo('kozos', 'Ketten igénylitek', 'Házastárssal vagy élettárssal. Mindkettőtökre vonatkozik a korhatár.'))}
${sor('', szamMezo({ id: 'eletkor2', cim: 'A társad életkora', me: 'év', placeholder: 'pl. 33', min: 0, max: 120 }), ' data-mutat="kozos"')}
${sor('II.', negyzetek('tulajdon', 'Van vagy volt lakásod?', [['nincs', 'Nincs és nem is volt'], ['kicsi', 'Csak 50%-os vagy kisebb hányad'], ['kivetel', `Van, de legfeljebb ${M.fmt(w('meglevo_lakas').kivetel_ertek_ft / 1e6)} millió forintot ér`], ['van', '50%-nál nagyobb hányad']], ''))}
</fieldset>
<fieldset>${reszCim('I.', 'A lakás')}
${sor('', negyzetek('allapot', 'Új vagy használt?', [['hasznalt', `Használt (${kam.hasznalt_szazalek}%)`], ['uj', `Új vagy építés (${kam.uj_szazalek}%)`]], ''))}
${sor('', negyzetek('ingatlan', 'Lakás vagy ház?', [['lakas', 'Lakás'], ['haz', 'Családi ház']], ''))}
${sor('', szamMezo({ id: 'vetelar', cim: 'Vételár', me: 'Ft', placeholder: 'pl. 62 000 000', min: 0, szeles: true }))}
${sor('I.', szamMezo({ id: 'alapterulet', cim: 'Hasznos alapterület', me: 'm²', placeholder: 'pl. 54', min: 1, max: 2000, sugo: 'A tulajdoni lap I. részében vagy az alaprajzon.' }))}
</fieldset>
<fieldset>${reszCim('', 'A hitel')}
${sor('', szamMezo({ id: 'onero', cim: 'Önerő', me: 'Ft', placeholder: 'pl. 12 000 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'futamido', cim: 'Futamidő', me: 'év', placeholder: `${ossz.max_ev}`, min: 1, max: ossz.max_ev, sugo: `Ha üresen hagyod, ${ossz.max_ev} évvel számolunk.` }))}
${sor('', szamMezo({ id: 'piaciKamat', cim: 'Összehasonlító piaci kamat', me: '%', placeholder: `${M.tized(w('piaci_kamat').szazalek, 1)}`, tized: true, sugo: 'Ha van piaci ajánlatod, írd be a kamatát, és azzal vetjük össze.' }))}
</fieldset>`,
    cikk: `<h2>A feltételek röviden</h2>
<ul>
<li><strong>Életkor:</strong> ${kor.tol} évesen már, a ${kor.ig}. születésnapodig még igényelheted. Házasság, gyermekvállalás és biztosítási idő nem feltétel.</li>
<li><strong>Első lakás:</strong> nem lehet és nem is lehetett 50%-nál nagyobb tulajdonod lakásban, kivéve a legfeljebb ${M.fmt(w('meglevo_lakas').kivetel_ertek_ft / 1e6)} millió forintot érő, lebontott vagy haszonélvezettel terhelt lakást.</li>
<li><strong>A lakás:</strong> lakásnál legfeljebb ${M.fmt(eh.lakas_max_ft / 1e6)}, háznál ${M.fmt(eh.haz_max_ft / 1e6)} millió forint, és legfeljebb ${M.fmt(eh.nm_max_ft)} forint négyzetméterenként.</li>
<li><strong>A hitel:</strong> legfeljebb ${M.fmt(ossz.max_ft / 1e6)} millió forint, ${ossz.max_ev} évre, legalább ${w('onero').min_szazalek}% önerővel. Új lakásra ${kam.uj_szazalek}%, használtra ${kam.hasznalt_szazalek}% a kamat, a teljes futamidőre.</li>
<li><strong>Utána:</strong> ${w('bentlakas').bejelentkezes_nap} napon belül be kell jelentkezned, ${w('bentlakas').ev} évig ott kell laknod, és nem adhatod ki.</li>
</ul>
<p>Bankot nem ajánlunk: a kamat minden banknál legfeljebb ugyanannyi, a díjakban és a feltételekben lehet különbség. A bankok ajánlatait a hitelösszehasonlító oldalakon találod.</p>`,
    kerdesek: [
      { k: 'Hány éves koromig igényelhetem?', v: [`A ${kor.ig}. születésnapodig. Ha ketten igénylitek, mindkettőtöknek ${kor.ig} év alattinak kell lennie.`] },
      { k: 'Jár mellé illetékmentesség?', v: [esc(S.szabaly(adat, 'wekerle_plusz.illetek').szoveg), `<a href="../${ILLETEK_UT}">Az illetékkalkulátorban</a> megnézheted, melyik kedvezmény jár.`] },
      { k: 'Mi a különbség az Otthon Starthoz képest?', v: ['Új lakásra a kamat ugyanúgy legfeljebb 3%, használtra viszont 5%. Van korhatár, nem kell biztosítási idő, és élettársak is igényelhetik közösen.', 'A 2026. november 16. előtt benyújtott Otthon Start-kérelmekre a régi szabályok érvényesek.'] },
      { k: 'Kiadhatom a lakást?', v: [`Nem: ${w('bentlakas').ev} évig neked kell ott laknod, és ez alatt a lakást nem adhatod másnak használatra.`] },
    ],
    forrasKulcsok: ['wekerle_plusz.kamat', 'wekerle_plusz.illetek', 'wekerle_plusz.piaci_kamat'],
  });
}

/* ======================= LAKÁSKIADÁS ADÓJA ======================= */
export const KIADAS_UT = 'lakaskiadas-ado-kalkulator/';
export function kiadasOldal(k) {
  const { adat } = k;
  const b = (kk) => S.szabaly(adat, `berbeadas.${kk}`);
  const kulcs = b('ado_mertek').ertek.szazalek, kh = b('koltseghanyad').ertek.szazalek;
  const p = S.berbeadas(adat, { havi: 250000, ev: k.ev });
  return kalkOldal(k, {
    ut: KIADAS_UT, tipus: 'kiadas', nev: 'Kiadás adója', temak: ['berbeadas'],
    oldalCim: `Lakáskiadás adója ${k.ev}: ${kh}% költséghányad vagy tételes?`,
    leiras: `Lakáskiadás szja-ja ${k.ev}-ben: ${kulcs}% a ${kh}% költséghányaddal vagy tételes elszámolással, a döntési ponttal és a negyedéves adóelőleg határidőivel.`,
    cim: 'Mennyi adót fizetsz, ha kiadod a lakásod?',
    valasz: `A jövedelem ${kulcs}%-át. ${kh}% költséghányaddal havi 250 000 forintos bérleti díjnál ez évi ${M.fmt(p.A.ado)} Ft. Ha az igazolt költséged évi ${M.fmt(p.dontesiPont)} Ft fölött van, a tételes elszámolás az olcsóbb.`,
    urlapCim: 'A kiadott lakás', urlapAl: 'Tartós bérbeadás magánszemélyként',
    urlap: `
<fieldset>${reszCim('', 'Bevétel')}
${sor('', szamMezo({ id: 'havi', cim: 'Havi bérleti díj', me: 'Ft', placeholder: 'pl. 260 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'honap', cim: 'Hány hónapig adod ki az évben?', me: 'hónap', placeholder: '12', min: 1, max: 12 }))}
${sor('', szamMezo({ id: 'egyeb', cim: 'Egyéb bevétel egy évben', me: 'Ft', placeholder: 'pl. 0', min: 0, szeles: true, sugo: 'Amit a bérlő a díjon felül neked fizet, például a közös költséget vagy átalány rezsit. A mérőóra szerint pontosan áthárított rezsi nem bevétel.' }))}
</fieldset>
<fieldset>${reszCim('', 'Költségek egy évben')}
<p class="fieldset-megj">Csak a számlával igazolt, kifizetett tételek. Ezekkel a tételes elszámolás számol.</p>
${sor('', szamMezo({ id: 'koltseg', cim: 'Igazolt költségek', me: 'Ft', placeholder: 'pl. 420 000', min: 0, szeles: true, sugo: 'Rezsi, amit te fizetsz, közös költség, karbantartás, javítás, felújítás.' }))}
${sor('', szamMezo({ id: 'ertekcsokkenes', cim: 'Értékcsökkenés', me: 'Ft', placeholder: 'pl. 0', min: 0, szeles: true, sugo: 'Az szja-törvény 11. melléklete szerint. Ha nem tudod, hagyd üresen, vagy kérdezd a könyvelődet.' }))}
${sor('', szamMezo({ id: 'berelt', cim: 'Bérleti díj, amit máshol fizetsz', me: 'Ft', placeholder: 'pl. 0', min: 0, szeles: true, sugo: 'Ha más településen 90 napnál hosszabban bérelsz lakást, ennek a díja levonható.' }))}
</fieldset>`,
    cikk: `<h2>Melyiket válaszd?</h2>
<p>A ${kh}% költséghányadnál a bevétel ${100 - kh}%-a után fizetsz, és semmit nem kell igazolnod. A tételes elszámolásnál a számlákkal igazolt költségeket vonod le. Ha ezek egy évben többet tesznek ki, mint a bevétel ${kh}%-a, a tételes az olcsóbb.</p>
<p>A választás egész évre szól. A ${kh}%-os költséghányad mellett más költséget nem számolhatsz el, és ha más önálló tevékenységed is van, ott is ezt kell alkalmaznod.</p>
<h2>Határidők</h2>
<ul>
<li><strong>Adóelőleg:</strong> negyedévente, a negyedévet követő hónap ${b('adoeloleg').ertek.nap}-ig: április, július, október és január ${b('adoeloleg').ertek.nap}.</li>
<li><strong>Bevallás:</strong> a következő év május 20-ig, az éves szja-bevallásban.</li>
<li><strong>Bizonylat:</strong> a bérleti díjról bizonylatot kell kiállítanod a sorszámmal, a felek adataival, az ingatlan címével, az összeggel és az időszakkal.</li>
</ul>`,
    kerdesek: [
      { k: 'Kell adószám a lakáskiadáshoz?', v: [esc(b('adoszam').szoveg)] },
      { k: 'Mi számít bevételnek?', v: [esc(b('bevetel').szoveg)] },
      { k: 'Kell szociális hozzájárulási adót fizetni?', v: [esc(b('csak_szja').szoveg)] },
      { k: 'Mi van, ha a bérlő egy cég?', v: ['Ha a bérlő cég vagy egyéni vállalkozó, ő vonja le és fizeti be az adóelőleget, és erről igazolást ad. Az éves bevallásban neked kell szerepeltetned a jövedelmet.'] },
      { k: 'Én is bérlek lakást máshol. Levonhatom?', v: [esc(b('berelt_lakas').szoveg)] },
    ],
    forrasKulcsok: ['berbeadas.ado_mertek', 'berbeadas.csak_szja'],
  });
}

/* ======================= LAKÁSVÁLTÁS ======================= */
export const VALTAS_UT = 'lakasvaltas-kalkulator/';
export function lakasvaltasOldal(k) {
  const { adat } = k;
  const cs = S.szabaly(adat, 'illetek.cserepotlo').ertek;
  const p = S.lakasvaltas(adat, { eladasiAr: 60e6, szerzesEv: k.ev - 7, szerzesiErtek: 35e6, vetelar: 85e6, eladasEv: k.ev });
  return kalkOldal(k, {
    ut: VALTAS_UT, tipus: 'lakasvaltas', nev: 'Lakásváltás', temak: ['illetek', 'szja_eladas'],
    oldalCim: 'Lakásváltás kalkulátor: eladás és vétel egy lapon',
    leiras: 'Eladod a lakásod, és másikat veszel: az eladás adója, az illeték a cserét pótló kedvezménnyel, a régi hitel, és mennyi pénz vagy hitel kell az új lakáshoz.',
    cim: 'Mennyibe kerül, ha eladod a lakásod, és másikat veszel?',
    valasz: `Az illetéket csak a két lakás árának különbözete után fizeted, ha az eladás és a vétel között legfeljebb ${cs.elotte_ev} év telik el. Egy 60 millió forintos lakás eladásánál és egy 85 milliós vételénél ez ${M.fmt(p.illetek.ado)} Ft a ${M.fmt(p.illetekNelkul)} Ft helyett.`,
    urlapCim: 'A két lakás', urlapAl: 'Eladás és vétel',
    urlap: `
<fieldset>${reszCim('', 'A mostani lakásod')}
${sor('', szamMezo({ id: 'eladasiAr', cim: 'Eladási ár', me: 'Ft', placeholder: 'pl. 60 000 000', min: 0, szeles: true }))}
${sor('II.', szamMezo({ id: 'szerzesEv', cim: 'Mikor szerezted?', placeholder: `pl. ${k.ev - 7}`, min: 1950, max: k.ev + 1, sugo: `Ha ${k.ev - 5} előtt, az eladás után nem fizetsz adót.` }))}
${sor('', szamMezo({ id: 'szerzesiErtek', cim: 'Mennyiért szerezted?', me: 'Ft', placeholder: 'pl. 35 000 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'koltsegek', cim: 'Levonható költségek', me: 'Ft', placeholder: 'pl. 0', min: 0, szeles: true, sugo: 'Annak idején fizetett illeték, ügyvéd, számlás felújítás.' }))}
${sor('', szamMezo({ id: 'kozvetito', cim: 'Ingatlanközvetítő díja', me: 'Ft', placeholder: 'pl. 1 800 000', min: 0, szeles: true }))}
${sor('III.', szamMezo({ id: 'hitelTartozas', cim: 'Fennálló hiteltartozás', me: 'Ft', placeholder: 'pl. 8 000 000', min: 0, szeles: true, sugo: 'Ha jelzálog van rajta (a tulajdoni lap III. része), az eladáskor végtörlesztened kell.' }))}
</fieldset>
<fieldset>${reszCim('', 'Az új lakás')}
${sor('', szamMezo({ id: 'vetelar', cim: 'Vételár', me: 'Ft', placeholder: 'pl. 85 000 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'vetelKoltseg', cim: 'Egyéb költségek', me: 'Ft', placeholder: 'pl. 900 000', min: 0, szeles: true, sugo: 'Ügyvéd, értékbecslés, földhivatal, költözés.' }))}
${sor('', szamMezo({ id: 'megtakaritas', cim: 'Megtakarításod, amit beleteszel', me: 'Ft', placeholder: 'pl. 5 000 000', min: 0, szeles: true }))}
${sor('', negyzetek('sorrend', 'Melyiket intézed előbb?', [['elobb_elad', 'Előbb eladom'], ['elobb_vesz', 'Előbb veszek']], ''))}
</fieldset>`,
    cikk: `<h2>Előbb eladni vagy előbb venni?</h2>
<p>A cserét pótló kedvezmény mindkét sorrendben jár, de más a határidő. Ha előbb eladsz, ${cs.elotte_ev} éved van megvenni az új lakást. Ha előbb veszel, a régit ${cs.utana_ev} éven belül el kell adnod.</p>
<p>Előbb eladni biztonságosabb: tudod, mennyi pénzed lesz, és nem kell egyszerre két lakást finanszírozni. Cserébe lehet, hogy egy ideig albérletben laksz. Előbb venni kényelmesebb, de a két vételárat egyszerre kell előteremteni, ehhez a bankok áthidaló hitelt adnak.</p>
<h2>Mit számol a kalkulátor?</h2>
<p>Az eladásból levonja a közvetítő díját, a régi hitel végtörlesztését és az eladás személyi jövedelemadóját. A vételhez hozzáadja az illetéket a cserét pótló kedvezménnyel és az egyéb költségeket. A kettő különbsége, mínusz a megtakarításod, az, amennyi hitel még kell.</p>`,
    kerdesek: [
      { k: 'Mennyi illetéket fizetek lakáscserénél?', v: [`Csak a két lakás értékének különbözete után, ha az eladás a vétel előtt ${cs.elotte_ev} éven belül vagy utána ${cs.utana_ev} éven belül történik. Ha az új lakás olcsóbb, nincs illeték.`] },
      { k: 'Az eladás adóját beszámítják az új lakásba?', v: ['Nem. Az eladás személyi jövedelemadója és a vétel illetéke külön szabály: az adót az eladott lakás nyereségéből és a tulajdonban tartás idejéből számolják, akkor is, ha az árát új lakásra költöd.', 'A szerzést követő 5. évtől nincs adó, ezért érdemes megnézni, nem éri-e meg az eladással kivárni az évfordulót.'] },
      { k: 'Mi van, ha a régi lakáson még hitel van?', v: ['Az eladáskor a vevő pénzéből először a bankot fizetik ki, a jelzálogjogot csak így lehet törölni a tulajdoni lapról. Ezért a tartozás csökkenti, amennyit kézhez kapsz.'] },
    ],
    forrasKulcsok: ['illetek.cserepotlo', 'illetek.altalanos_mertek', 'szja_eladas.jovedelem_hanyad'],
  });
}
