// Az oldalak. Minden szám az adatfájlokból jön, a szöveg a SZOVEG_STILUS.md szerint.
// Most a váz van itt: főoldal (munkaverzió), források, rólunk, jogi oldalak. A kalkulátorok a tartalomterv szerint jönnek.
import * as M from './js/megjelenites.mjs';
import * as S from './js/szamitas.mjs';
import { CSOPORTOK, oldal, oldalfej, ellenorzesKesik, morzsaLd, tovabb, esc, datumHu, forgalmi, elszamolas, sor, szamMezo, reszCim, negyzetek, jelolo, gyik, gyikLd, alkalmazasLd, forrasLista } from './sablon.mjs';

/* ======================= FŐOLDAL ======================= */
/**
 * A főoldal kártyáinak szövege oldalanként: mit kap, aki rákattint. A sorrendet és a csoportot a CSOPORTOK adja (sablon.mjs).
 * A teszt ellenőrzi, hogy minden csoportelemnek van itt szövege.
 */
export const FOOLDAL_KARTYAK = {
  'mennyi-lakashitelt-kaphatok/': [() => 'A jövedelmedből és a lakás értékéből, az MNB adósságfék-szabályai szerint, és ugyanez Wekerle Plusszal.', 'Kiszámolom'],
  'oroklesi-ajandekozasi-illetek-kalkulator/': [() => 'Örökölt vagy ajándékba kapott lakás illetéke, a mentes rokonokkal és a fenntartott haszonélvezettel.', 'Kiszámolom'],
  'haszonelvezeti-jog-erteke/': [() => 'Mennyit ér a haszonélvezet az életkor szerinti szorzóval, és mennyi illeték jár vételnél vagy lemondáskor.', 'Kiszámolom'],
  'elotorlesztes-kalkulator/': [() => 'Mennyi kamatot spórolsz, ha a futamidőt rövidíted, vagy ha a törlesztőt csökkented.', 'Kiszámolom'],
  'berleti-dij-emeles-inflacio/': [() => 'Az új bérleti díj a KSH előző évi átlagos inflációjával, minden évben frissítve.', 'Kiszámolom'],
  'lakas-befektetes-hozam-kalkulator/': [() => 'Bruttó és nettó hozam a vételárral, az illetékkel, a költségekkel és az adóval.', 'Kiszámolom'],
  'airbnb-vagy-hosszu-tavu-kiadas/': [() => 'Melyik hoz többet adó után: rövid távon turistáknak, vagy hosszú távon egy bérlőnek, és hány foglalt éjszakától éri meg.', 'Kiszámolom'],
  'lakasvasarlas-koltsegei-kalkulator/': [() => 'Önerő, illeték, ügyvéd, földhivatal, közjegyző és banki díjak, időrendben: mennyi saját pénz kell, és mennyi hiányzik.', 'Kiszámolom'],
  'alberlet-vagy-lakasvasarlas-kalkulator/': [() => 'A vagyonod 10 vagy 20 év múlva, ha megveszed, és ha bérelsz, három forgatókönyvben a lakásárakra.', 'Kiszámolom'],
  'vagyonszerzesi-illetek-kalkulator/': [() => 'Mennyi illetéket fizetsz a megvett lakás után, és melyik kedvezmény jár: cserét pótló vétel, új lakás, első lakás 35 év alatt, CSOK Plusz.', 'Kiszámolom'],
  'wekerle-plusz-kalkulator/': [() => 'Feltételenként megnézi, megkapod-e a hitelt, és mennyi lesz a havi törlesztő 3% vagy 5% kamattal.', 'Megnézem'],
  'lakasvaltas-kalkulator/': [() => 'Eladás és vétel egy lapon: mennyit kapsz kézhez, mennyibe kerül az új lakás, és mennyi hitel kell még.', 'Kiszámolom'],
  'lakaskiadas-ado-kalkulator/': [() => 'Mennyi adót fizetsz a bérleti díj után, és melyik a jobb: a 10% költséghányad vagy a tételes elszámolás.', 'Kiszámolom'],
  'ingatlaneladas-szja-kalkulator/': [() => 'Mennyi adót fizetsz, ha eladod a lakásod, a házad vagy a telked, mit vonhatsz le, és melyik évtől nem fizetsz semmit.', 'Kiszámolom'],
  'forrasok/': [() => 'Minden szabály, amivel számolunk: jogszabályhely, forrás, és mikor ellenőriztük utoljára.', 'Megnézem'],
};

export function fooldal(k) {
  const sz = (kulcs) => S.szabaly(k.adat, kulcs).ertek;
  // A főoldal mintája: ugyanaz a számítás, mint a kalkulátorban, címkézve
  const p = S.indulo(k.adat, { vetelar: 50e6, hitel: 40e6 });
  const ill = p.illetek.ado, dij = p.vetelarFelett - ill;
  const ar = (x) => (x / p.osszes * 100).toFixed(1);
  const GYORS = [[INDULO_UT, 'Mennyi pénz kell a vételhez?'], [ILLETEK_UT, 'Illeték'], [ELADAS_UT, 'Eladás adója'], [ROVID_UT, 'Airbnb vagy hosszú táv'], [WEKERLE_UT, 'Wekerle Plusz'], [KIADAS_UT, 'Kiadás adója']];
  const tartalom = (L) => `
<section class="hero keret">
<div class="hero-szoveg">
<h1>Mennyibe kerül igazán egy lakás?</h1>
<p class="valasz">Illeték, adó, hitel és minden mellékköltség forintra kiszámolva, ha veszel, eladsz vagy kiadsz. Minden szám mellett ott a jogszabály és a nap, amikor utoljára ellenőriztük.</p>
<nav class="gyors" aria-label="A leggyakoribb kalkulátorok">${GYORS.map(([u, n]) => `<a href="${L.l(u)}">${n}</a>`).join('')}</nav>
<p class="hero-tenyek"><span><b>${sz('illetek.altalanos_mertek').szazalek}%</b> illeték</span><span><b>${sz('szja_eladas.ado_mertek').szazalek}%</b> szja eladáskor</span><span><b>${sz('wekerle_plusz.kamat').uj_szazalek}% és ${sz('wekerle_plusz.kamat').hasznalt_szazalek}%</b> Wekerle Plusz</span></p>
</div>
<a class="hero-kartya" href="${L.l(INDULO_UT)}">
<span class="hk-minta">Minta: 50 millió forintos lakás, 40 millió forint hitellel</span>
<span class="hk-mi">Ennyi saját pénz kell</span>
<span class="hk-szam">${M.fmt(p.osszes)}<small> Ft</small></span>
<span class="hk-sav" aria-hidden="true"><i class="s1" style="--w:${ar(p.onero)}%"></i><i class="s2" style="--w:${ar(ill)}%"></i><i class="s3" style="--w:${ar(dij)}%"></i></span>
<span class="hk-jel"><span class="j1">önerő ${M.tized(p.onero / 1e6, 1)} M</span><span class="j2">illeték ${M.tized(ill / 1e6, 1)} M</span><span class="j3">díjak ${M.tized(dij / 1e6, 1)} M</span></span>
<span class="hk-ido">${p.lepesek.slice(0, 4).map((l) => `<span><span>${l.nev}</span><b>${M.fmt(l.ft)} Ft</b></span>`).join('')}</span>
<span class="hk-tovabb">Számold ki a sajátodat</span>
</a>
</section>
${CSOPORTOK.map((cs) => `<section class="szakasz" id="${cs.id}"><div class="keret">
<div class="szakasz-fej"><h2>${cs.cim}</h2><p class="csoport-bevezeto">${cs.bevezeto}</p></div>
<ul class="lista">
${cs.elemek.map(([u, n, , teljes]) => { const [szoveg, ugrik] = FOOLDAL_KARTYAK[u]; return `<li><a href="${L.l(u)}"><h3>${teljes || n}</h3><p>${szoveg(k)}</p><span class="ugrik">${ugrik}</span></a></li>`; }).join('\n')}
</ul></div></section>`).join('\n')}`;
  return oldal(k, { cim: `${k.cfg.marka}: lakásvásárlás, -eladás és -kiadás költségei`, leiras: 'Vagyonszerzési illeték, ingatlaneladás adója, lakáskiadás adója, Airbnb és kamattámogatott hitel, forrással és dátummal.', ut: '', tartalom });
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
<p>A „becslés” jelölésű tételek a mi feltevéseink, mindegyik egy közzétett forrásra támaszkodik. A saját számaid ezeknél mindig pontosabbak, ezért a kalkulátorokban mindegyiket átírhatod.</p>
<ul>${sz.temak.flatMap((t) => t.tetelek.filter((x) => x.becsles).map((x) => `<li><a href="#${t.id}">${esc(x.nev)}</a>: ${esc(x.szoveg)} <span class="halk">Forrás: <a href="${esc(x.forras.url)}" rel="noopener" target="_blank">${esc(x.forras.nev)}</a>.</span></li>`)).join('')}</ul>
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
  const adatJson = { ...temaAdat(k.adat, ...o.temak), ...(o.adatExtra || {}), ev: k.ev, ma: k.ma };
  const kezdo = M.kalkHtml(o.tipus, adatJson, {}).html;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: [o.nev], cim: o.cim, valasz: o.valasz, friss: M.datumNapon(k.adat.allapot.utolso_ellenorzes || k.ma) })}
<p class="csak-nyomtatas nyomtat-fej"><strong>${esc(o.cim)}</strong><br>${esc(k.cfg.marka)}, ${esc(k.cfg.domain.replace(/^https?:\/\//, ''))}/${o.ut}. A szabályokat utoljára ${M.datumNapon(k.adat.allapot.utolso_ellenorzes || k.ma)} ellenőriztük. Tájékoztató számítás, nem adótanácsadás.</p>
<div class="keret asztal">
${forgalmi({ kalk: o.tipus, cim: o.urlapCim, al: o.urlapAl || '', tartalom: o.urlap, extra: ` data-kalk-nev="${o.tipus}"` })}
${elszamolas(k, kezdo, { kesz: true })}
</div>
<div class="keret"><article class="cikk">
${o.cikk}
<h2>Gyakori kérdések</h2>
${gyik(o.kerdesek)}
<h2 class="forras-cim">Források</h2>
${forrasokBol(k.adat, o.forrasKulcsok, (o.forrasExtra || []).filter((x) => x.nev))}
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
<p class="fieldset-megj">A tulajdoni lap II. részében, a tulajdonjogod bejegyzésénél találod a jogcímet és a dátumot.</p>
${sor('', negyzetek('jogcim', 'Hogyan lett a tiéd?', [['vetel', 'Vettem'], ['orokles', 'Örököltem'], ['ajandek', 'Ajándékba kaptam'], ['epites', 'Építettem']], ''))}
<p class="fieldset-megj jogcim-megj" data-mutat="jogcim=vetel|jogcim=">A szerzés éve: amikor a szerződést benyújtották a földhivatalhoz. A szerzési érték: az akkori vételár.</p>
<p class="fieldset-megj jogcim-megj" data-mutat="jogcim=orokles">A szerzés éve: az örökhagyó halálának éve. A szerzési érték: a hagyatéki leltárban szereplő érték. Az ötéves skála ugyanúgy jár, mint vételnél.</p>
<p class="fieldset-megj jogcim-megj" data-mutat="jogcim=ajandek">A szerzési érték: az az érték, amely után az ajándékozási illetéket kiszabták. Ha a szerzés illetékmentes volt, a NAV 9. információs füzete szerint számolj, vagy kérdezd a könyvelődet.</p>
<p class="fieldset-megj jogcim-megj" data-mutat="jogcim=epites">A szerzési érték: a saját vagy a házastársad nevére szóló számlák szerinti érték, de legalább a beépített anyagérték.</p>
${sor('II.', szamMezo({ id: 'szerzesEv', cim: 'A szerzés éve', placeholder: `pl. ${k.ev - 2}`, min: 1950, max: k.ev + 5 }))}
${sor('', szamMezo({ id: 'szerzesiErtek', cim: 'Szerzési érték', me: 'Ft', placeholder: 'pl. 50 000 000', min: 0, szeles: true }))}
${sor('', jelolo('ismeretlen', 'Nem állapítható meg, mennyiért szereztem', `Nincs szerződés, hagyatéki leltár vagy illetékkiszabás. Ilyenkor az eladási ár ${sz('ismeretlen_szerzes').ertek.szazalek}%-a számít, és más költség nem vonható le.`))}
</fieldset>
<fieldset>${reszCim('', 'Levonható költségek')}
<p class="fieldset-megj">Csak azt írd be, amiről számlád vagy okiratod van.</p>
<p class="fieldset-megj" data-mutat="ismeretlen">Ha a szerzési érték nem állapítható meg, ezeket nem vonjuk le.</p>
${sor('', szamMezo({ id: 'szerzesKoltseg', cim: 'A szerzés költségei', me: 'Ft', placeholder: 'pl. 2 000 000', min: 0, szeles: true, sugo: 'A megfizetett illeték, az ügyvédi díj.' }))}
${sor('', szamMezo({ id: 'beruhazas', cim: 'Értéknövelő beruházás', me: 'Ft', placeholder: 'pl. 3 000 000', min: 0, szeles: true, sugo: 'Ami az ingatlan értékét növelte: nyílászárócsere, szigetelés, fűtéskorszerűsítés, bővítés. Bármikor készült, levonható. A saját munkád értéke nem.' }))}
${sor('', szamMezo({ id: 'allagmegovas', cim: `Állagmegóvás az eladás előtti ${sz('allagmegovas').ertek.honap} hónapban`, me: 'Ft', placeholder: 'pl. 1 800 000', min: 0, szeles: true, sugo: `Festés, javítás, burkolatcsere. Csak akkor vonható le, ha együtt meghaladja az eladási ár ${sz('allagmegovas').ertek.szazalek_bevetel}%-át.` }))}
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
      { k: 'Levonható a festés, ha eladás előtt kifestettem?', v: [esc(sz('allagmegovas').szoveg)] },
      { k: 'Mi van, ha nem tudom, mennyiért szereztem?', v: [esc(sz('ismeretlen_szerzes').szoveg)] },
      { k: 'Mikor és hogyan kell befizetni?', v: [esc(sz('bevallas').szoveg), esc(sz('reszletfizetes').szoveg)] },
    ],
    forrasKulcsok: ['szja_eladas.ado_mertek', 'szja_eladas.jovedelem_hanyad', 'szja_eladas.allagmegovas', 'szja_eladas.ismeretlen_szerzes'], forrasExtra: [{ nev: 'A személyi jövedelemadóról szóló 1995. évi CXVII. törvény 59–64. §', d: '' }],
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
    ut: ILLETEK_UT, tipus: 'illetek', nev: 'Illeték', temak: ['illetek', 'haszonelvezet'],
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
${sor('', jelolo('telek', 'Telket veszel, és 4 éven belül lakóházat építesz rá', 'Ilyenkor nincs illeték. Ha nem épül meg a ház, késedelmi pótlékkal kell megfizetni.'))}
</fieldset>
<fieldset>${reszCim('III.', 'Haszonélvezet')}
<p class="fieldset-megj">Ha a lakáson haszonélvezet marad (a tulajdoni lap III. részében látod), kevesebb illetéket fizetsz.</p>
${sor('', szamMezo({ id: 'haszonelvezoKor', cim: 'A haszonélvező életkora', me: 'év', placeholder: 'pl. 72', min: 0, max: 120 }))}
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
    ut: WEKERLE_UT, tipus: 'wekerle', nev: 'Wekerle Plusz', temak: ['wekerle_plusz', 'illetek', 'haszonelvezet'],
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
    ut: VALTAS_UT, tipus: 'lakasvaltas', nev: 'Lakásváltás', temak: ['illetek', 'szja_eladas', 'haszonelvezet'],
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

/* ======================= MENNYI HITELT KAPHATSZ ======================= */
export const HITEL_UT = 'mennyi-lakashitelt-kaphatok/';
export function hitelkepessegOldal(k) {
  const { adat } = k;
  const j = S.szabaly(adat, 'hitel.jtm').ertek, h = S.szabaly(adat, 'hitel.hfm').ertek;
  const p = S.hitelkepesseg(adat, { jovedelem: 500000, periodus: 'hosszu', kamat: 6.5, futamido: 25 });
  return kalkOldal(k, {
    ut: HITEL_UT, tipus: 'hitelkepesseg', nev: 'Mennyi hitelt kaphatsz', temak: ['hitel', 'wekerle_plusz'],
    oldalCim: `Mennyi lakáshitelt kaphatok? JTM és HFM ${k.ev}`,
    leiras: `A felvehető lakáshitel a jövedelmedből és az ingatlan értékéből, az MNB ${k.ev}. évi adósságfék-szabályai szerint, és ugyanez Wekerle Plusszal.`,
    cim: 'Mennyi lakáshitelt kaphatsz?',
    valasz: `Annyit, amennyinek a törlesztője belefér a nettó jövedelmed ${j.alatta.rovid}–${j.felette.hosszu}%-ába, és ami legfeljebb a lakás értékének ${h.altalanos}%-a, első lakásnál ${h.elso_lakas}%-a. Havi 500 000 forint nettóból végig fix kamattal, ${M.tized(6.5, 1)}%-kal 25 évre ez nagyjából ${M.fmt(Math.round(p.jtmHitel / 1e5) / 10)} millió forint.`,
    urlapCim: 'A jövedelmed és a lakás', urlapAl: '32/2014. (IX. 10.) MNB rendelet',
    urlap: `
<fieldset>${reszCim('', 'Jövedelem')}
${sor('', szamMezo({ id: 'jovedelem', cim: 'Havi nettó jövedelem', me: 'Ft', placeholder: 'pl. 650 000', min: 0, szeles: true, sugo: 'Ha ketten igénylitek, a kettőtöké együtt, ahogy a munkáltatói igazoláson áll.' }))}
${sor('', szamMezo({ id: 'meglevo', cim: 'Meglévő hitelek havi törlesztője', me: 'Ft', placeholder: 'pl. 0', min: 0, szeles: true, sugo: 'Személyi kölcsön, autóhitel, hitelkártya. Ezek is beleszámítanak.' }))}
</fieldset>
<fieldset>${reszCim('', 'A hitel')}
${sor('', negyzetek('periodus', 'Kamatperiódus', [['hosszu', 'Legalább 10 év vagy végig fix'], ['kozep', '5–10 év'], ['rovid', '5 évnél rövidebb']], ''))}
${sor('', szamMezo({ id: 'kamat', cim: 'Kamat', me: '%', placeholder: '6,5', tized: true, sugo: 'Ha van banki ajánlatod, annak az ügyleti kamata.' }))}
${sor('', szamMezo({ id: 'futamido', cim: 'Futamidő', me: 'év', placeholder: '25', min: 1, max: 35 }))}
${sor('', jelolo('zold', 'Energiahatékony lakás (zöld hitel)', 'Kedvezőbb JTM és HFM jár.'))}
</fieldset>
<fieldset>${reszCim('I.', 'A lakás')}
${sor('', szamMezo({ id: 'ertek', cim: 'A lakás értéke', me: 'Ft', placeholder: 'pl. 55 000 000', min: 0, szeles: true, sugo: 'A bank az értékbecslés szerinti forgalmi értékkel számol, ez lehet kevesebb a vételárnál.' }))}
${sor('', jelolo('elsoLakas', 'Első lakásodat veszed', `Ilyenkor a lakás értékének ${h.elso_lakas}%-áig is adhat hitelt a bank.`))}
</fieldset>`,
    cikk: `<h2>A jövedelem szerinti korlát (JTM)</h2>
<div class="tabla-tarto"><table class="tabla"><thead><tr><th>Kamatperiódus</th><th>${M.fmt(j.kuszob_ft)} Ft nettó alatt</th><th>${M.fmt(j.kuszob_ft)} Ft felett</th></tr></thead><tbody>
<tr><th scope="row">5 évnél rövidebb</th><td>${j.alatta.rovid}%</td><td>${j.felette.rovid}%</td></tr>
<tr><th scope="row">5–10 év</th><td>${j.alatta.kozep}%</td><td>${j.felette.kozep}%</td></tr>
<tr><th scope="row">Legalább 10 év vagy végig fix</th><td>${j.alatta.hosszu}%</td><td>${j.felette.hosszu}%</td></tr>
</tbody></table></div>
<p>A törlesztők összege, a meglévő hiteleidet is beleértve, legfeljebb ekkora része lehet az igazolt nettó jövedelmednek. Minél hosszabb ideig fix a kamat, annál nagyobb törlesztőt enged a szabály, mert annál kisebb a kamatemelés kockázata.</p>
<h2>Az ingatlan szerinti korlát (HFM)</h2>
<p>A forinthitel legfeljebb a lakás forgalmi értékének ${h.altalanos}%-a lehet, vagyis legalább ${100 - h.altalanos}% önerő kell. Első lakás vásárlásánál és energiahatékony lakásnál a bank ${h.elso_lakas}%-ig mehet el, ha vállalja. Az értéket az értékbecslő állapítja meg.</p>`,
    kerdesek: [
      { k: 'Mi a JTM?', v: ['A jövedelemarányos törlesztőrészlet-mutató: a havi törlesztőid összege osztva az igazolt nettó jövedelmeddel. Az MNB szabja meg a felső határát, a bank ennél szigorúbb is lehet.'] },
      { k: 'Miért kaphatok több hitelt fix kamattal?', v: [`Mert a szabály a hosszú kamatperiódusnál nagyobb törlesztőt enged: ${M.fmt(j.kuszob_ft)} forint alatti jövedelemnél ${j.alatta.hosszu}%-ot a ${j.alatta.rovid}% helyett.`] },
      { k: 'Beleszámít a párom jövedelme?', v: ['Igen, ha adóstársként ő is aláírja a szerződést. Ilyenkor a közös jövedelemhez és a közös törlesztőkhöz mérik a korlátot.'] },
      { k: 'Mennyi önerő kell?', v: [`Általában a lakás értékének ${100 - h.altalanos}%-a, első lakásnál ${100 - h.elso_lakas}%-a, és erre jön még az illeték, amit a hitelből nem fizethetsz ki.`] },
    ],
    forrasKulcsok: ['hitel.jtm', 'hitel.hfm'], forrasExtra: [{ nev: 'MNB: Tájékoztató a túlzott eladósodottság kockázatairól (mintatájékoztató, 2026. január 1.)', url: 'https://www.mnb.hu/letoltes/a-tulzott-eladosodottsag-kockazatairol-szolo-mintatajekoztato-2026-01-01.pdf', d: '' }],
  });
}

/* ======================= ÖRÖKLÉS ÉS AJÁNDÉKOZÁS ======================= */
export const INGYENES_UT = 'oroklesi-ajandekozasi-illetek-kalkulator/';
export function ingyenesOldal(k) {
  const { adat } = k;
  const m = S.szabaly(adat, 'ingyenes.mertek').ertek;
  return kalkOldal(k, {
    ut: INGYENES_UT, tipus: 'ingyenes', nev: 'Öröklés és ajándék', temak: ['ingyenes', 'haszonelvezet', 'illetek'],
    oldalCim: `Öröklési és ajándékozási illeték kalkulátor ${k.ev}`,
    leiras: `Örökölt vagy ajándékba kapott lakás illetéke ${k.ev}-ben: ${m.lakas}% vagy ${m.altalanos}%, a mentes rokonokkal, a terhekkel és a fenntartott haszonélvezettel.`,
    cim: 'Mennyi illetéket fizetsz, ha lakást örökölsz vagy kapsz?',
    valasz: `Szülőtől, gyermektől, nagyszülőtől, házastárstól és testvértől semennyit. Mástól lakásnál a tiszta érték ${m.lakas}%-át, más vagyonnál ${m.altalanos}%-át: egy 40 millió forintos örökölt lakás után ${M.fmt(40e6 * m.lakas / 100)} Ft-ot.`,
    urlapCim: 'Az örökség vagy az ajándék', urlapAl: 'Ingyenes vagyonszerzés',
    urlap: `
<fieldset>${reszCim('', 'Mi történik?')}
${sor('', negyzetek('jogcim', 'Hogyan kapod?', [['orokles', 'Öröklöm'], ['ajandek', 'Ajándékba kapom']], ''))}
${sor('', negyzetek('rokonsag', 'Kitől?', [['egyenesagi', 'Szülő, gyermek, nagyszülő, unoka'], ['hazastars', 'Házastárs'], ['testver', 'Testvér'], ['egyeb', 'Mástól']], ''))}
</fieldset>
<fieldset>${reszCim('I.', 'Az ingatlan')}
${sor('', negyzetek('vagyon', 'Mi az?', [['lakas', `Lakás, ház (${m.lakas}%)`], ['egyeb', `Telek, garázs, nyaraló, üzlet (${m.altalanos}%)`]], ''))}
${sor('', szamMezo({ id: 'ertek', cim: 'Forgalmi érték', me: 'Ft', placeholder: 'pl. 40 000 000', min: 0, szeles: true }))}
${sor('II.', szamMezo({ id: 'hanyad', cim: 'A rád eső tulajdoni hányad', me: '%', placeholder: '100', tized: true }))}
</fieldset>
<fieldset>${reszCim('III.', 'Terhek')}
<p class="fieldset-megj">A tulajdoni lap III. részében látod őket. Csökkentik az illeték alapját.</p>
${sor('', szamMezo({ id: 'terhek', cim: 'Ráterhelt hitel, tartozás', me: 'Ft', placeholder: 'pl. 0', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'haszonelvezoKor', cim: 'Ha haszonélvezet marad rajta: a haszonélvező életkora', me: 'év', placeholder: 'pl. 70', min: 0, max: 120, sugo: 'Gyakori, hogy a szülő odaadja a lakást, de holtig benne lakhat.' }))}
</fieldset>`,
    cikk: `<h2>Mikor mennyi?</h2>
<div class="tabla-tarto"><table class="tabla"><thead><tr><th>Kitől</th><th>Lakás</th><th>Más vagyon</th></tr></thead><tbody>
<tr><th scope="row">Szülő, gyermek, nagyszülő, unoka</th><td>mentes</td><td>mentes</td></tr>
<tr><th scope="row">Házastárs</th><td>mentes</td><td>mentes</td></tr>
<tr><th scope="row">Testvér</th><td>mentes</td><td>mentes</td></tr>
<tr><th scope="row">Élettárs, sógor, nagynéni, unokatestvér, barát</th><td>${m.lakas}%</td><td>${m.altalanos}%</td></tr>
</tbody></table></div>
<p>Az illeték alapja a tiszta érték: a forgalmi értékből levonják a terheket, például a lakásra bejegyzett hitelt és a haszonélvezet értékét. Testvérek között az öröklés és az ajándékozás mentes, az adásvétel viszont nem.</p>`,
    kerdesek: [
      { k: 'Kell illetéket fizetni, ha a szüleimtől öröklök?', v: ['Nem. Egyenes ági rokonok, vagyis szülő, gyermek, nagyszülő és unoka között az öröklés és az ajándékozás illetékmentes.'] },
      { k: 'És ha az élettársamtól örökölök?', v: [esc(S.szabaly(adat, 'ingyenes.elettars').szoveg)] },
      { k: 'Mi az a tiszta érték?', v: [esc(S.szabaly(adat, 'ingyenes.tiszta_ertek').szoveg)] },
      { k: 'Mikor kell kifizetni?', v: ['Nem rögtön: a NAV a hagyatéki eljárás vagy az ajándékozási szerződés benyújtása után határozatot küld, és abban áll a határidő.'] },
      { k: 'Ha eladom az örökölt lakást, kell adót fizetnem?', v: ['Csak ha az örökhagyó halálától számítva öt éven belül adod el. A szerzési érték a hagyatéki eljárásban megállapított érték.'] },
    ],
    forrasKulcsok: ['ingyenes.mertek', 'ingyenes.mentes', 'ingyenes.elettars'], forrasExtra: [{ nev: 'Az illetékekről szóló 1990. évi XCIII. törvény 7–17. §', d: '' }],
  });
}

/* ======================= HASZONÉLVEZET ======================= */
export const HASZON_UT = 'haszonelvezeti-jog-erteke/';
export function haszonelvezetOldal(k) {
  const { adat } = k;
  const p = S.haszonelvezet(adat, { ertek: 50e6, kor: 70 }), q = S.haszonelvezet(adat, { ertek: 50e6, kor: 45 });
  return kalkOldal(k, {
    ut: HASZON_UT, tipus: 'haszonelvezet', nev: 'Haszonélvezet', temak: ['haszonelvezet', 'illetek'],
    oldalCim: 'Haszonélvezeti jog értéke kalkulátor: életkor szerinti szorzóval',
    leiras: 'A haszonélvezet értéke az illetéktörvény szerint (a forgalmi érték huszada, életkor szerinti szorzóval), a csupasz tulajdon értéke, és az illeték vételnél és lemondáskor.',
    cim: 'Mennyit ér a haszonélvezeti jog?',
    valasz: `A lakás értékének huszadát szorozzák a haszonélvező életkora szerint 10-zel, 8-cal, 6-tal vagy 4-gyel. Egy 50 millió forintos lakáson a 70 éves haszonélvező joga ${M.fmt(p.jog)} Ft-ot ér, a 45 évesé ${M.fmt(q.jog)} Ft-ot.`,
    urlapCim: 'A lakás és a haszonélvezet', urlapAl: 'Itv. 72. §',
    urlap: `
<fieldset>${reszCim('I.', 'A lakás')}
${sor('', szamMezo({ id: 'ertek', cim: 'Forgalmi érték, haszonélvezet nélkül', me: 'Ft', placeholder: 'pl. 50 000 000', min: 0, szeles: true }))}
</fieldset>
<fieldset>${reszCim('III.', 'A haszonélvezet')}
<p class="fieldset-megj">A tulajdoni lap III. részében, a haszonélvezeti jog bejegyzésénél látod, kié és meddig.</p>
${sor('', negyzetek('tipus', 'Meddig szól?', [['holtig', 'Holtig'], ['hatarozott', 'Meghatározott évekig'], ['hatarozatlan', 'Határozatlan ideig']], ''))}
${sor('', szamMezo({ id: 'kor', cim: 'A haszonélvező életkora', me: 'év', placeholder: 'pl. 68', min: 0, max: 120 }))}
${sor('', szamMezo({ id: 'evek', cim: 'Hány évre szól?', me: 'év', placeholder: 'pl. 10', min: 1, max: 99 }), ' data-mutat="tipus=hatarozott"')}
${sor('', jelolo('rokon', 'A haszonélvező és a tulajdonos egyenes ági rokon vagy házastárs', 'Például szülő és gyermek. Lemondáskor ilyenkor nincs illeték.'))}
</fieldset>`,
    cikk: `<h2>Hogyan számolják?</h2>
<p>Az egyévi érték a lakás forgalmi értékének huszada, mintha a haszonélvezet évente a lakás értékének 5%-át érné. Holtig tartó haszonélvezetnél ezt szorozzák az életkor szerint:</p>
<div class="tabla-tarto"><table class="tabla"><thead><tr><th>A haszonélvező életkora</th><th>Szorzó</th><th>A lakás értékének</th></tr></thead><tbody>
${S.szabaly(adat, 'haszonelvezet.szorzo').ertek.savok.map(([a, c, x]) => `<tr><th scope="row">${a === 0 ? '25 év alatt' : c > 150 ? '65 év felett' : `${a}–${c} év`}</th><td>${x}×</td><td>${x * 5}%</td></tr>`).join('')}
</tbody></table></div>
<p>Határozott időnél az egyévi értéket a kikötött évekkel szorozzák, legfeljebb a 20-szorosáig. Határozatlan időnél az ötszörösét veszik.</p>`,
    kerdesek: [
      { k: 'Mennyi illetéket fizetek, ha haszonélvezettel terhelt lakást veszek?', v: [esc(S.szabaly(adat, 'haszonelvezet.vetel').szoveg)] },
      { k: 'Mi történik, ha a haszonélvező lemond a jogáról?', v: [esc(S.szabaly(adat, 'haszonelvezet.lemondas').szoveg)] },
      { k: 'Ennyit ér a lakás a piacon is?', v: ['Nem feltétlenül. Ez a törvényi érték, amellyel az illetéket számolják. Haszonélvezettel terhelt lakást kevesen vesznek, ezért a piaci ára gyakran ennél is alacsonyabb.'] },
    ],
    forrasKulcsok: ['haszonelvezet.egyevi', 'haszonelvezet.szorzo', 'haszonelvezet.hatarozott', 'haszonelvezet.lemondas'],
  });
}

/* ======================= ELŐTÖRLESZTÉS ======================= */
export const ELOT_UT = 'elotorlesztes-kalkulator/';
export function elotorlesztesOldal(k) {
  const { adat } = k;
  const p = S.elotorlesztes(adat, { toke: 20e6, kamat: 6, honap: 240, osszeg: 3e6 });
  return kalkOldal(k, {
    ut: ELOT_UT, tipus: 'elotorlesztes', nev: 'Előtörlesztés', temak: ['elotorlesztes'],
    oldalCim: 'Előtörlesztés kalkulátor: rövidebb futamidő vagy kisebb törlesztő?',
    leiras: 'Mennyi kamatot spórolsz a lakáshitel előtörlesztésével, ha a futamidőt rövidíted, vagy ha a törlesztőt csökkented, a díjjal együtt.',
    cim: 'Megéri előtörleszteni a lakáshitelt?',
    valasz: `Általában igen, és a futamidő rövidítése spórol többet. 20 millió forint tartozásnál 6% kamattal, még 20 évvel, 3 millió forint előtörlesztés ${M.fmt(Math.round(p.futamido.netto / 1e5) / 10)} millió forint kamatot spórol, ha a futamidő rövidül, és ${M.fmt(Math.round(p.torleszto.netto / 1e5) / 10)} milliót, ha a törlesztő csökken.`,
    urlapCim: 'A hitel most', urlapAl: 'A bank éves értesítőjében',
    urlap: `
<fieldset>${reszCim('', 'A hitel')}
${sor('', szamMezo({ id: 'toke', cim: 'Fennálló tőketartozás', me: 'Ft', placeholder: 'pl. 20 000 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'kamat', cim: 'Ügyleti kamat', me: '%', placeholder: 'pl. 6', tized: true }))}
${sor('', szamMezo({ id: 'ev', cim: 'Hátralévő futamidő', me: 'év', placeholder: 'pl. 20', tized: true }))}
</fieldset>
<fieldset>${reszCim('', 'Az előtörlesztés')}
${sor('', szamMezo({ id: 'osszeg', cim: 'Mennyit törlesztenél elő?', me: 'Ft', placeholder: 'pl. 3 000 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'dij', cim: 'Előtörlesztési díj', me: '%', placeholder: `${M.tized(S.szabaly(adat, 'elotorlesztes.mfl_dij').ertek.max_szazalek, 0)}`, tized: true, sugo: 'A bank hirdetményében. Kamatperiódus fordulóján gyakran 0.' }))}
</fieldset>`,
    cikk: `<h2>Rövidebb futamidő vagy kisebb törlesztő?</h2>
<p>Ha a törlesztő marad, és a futamidő rövidül, a teljes előtörlesztett összeg a hátralévő évek kamatát csökkenti, ezért ez spórol többet. Ha a futamidő marad, és a törlesztő csökken, kisebb lesz a havi terhed, de tovább fizetsz kamatot.</p>
<p>Az előtörlesztés akkor éri meg igazán, ha a hitel kamata magasabb, mint amennyit a pénzed máshol, kockázat nélkül hozna.</p>`,
    kerdesek: [
      { k: 'Mennyi az előtörlesztési díj?', v: [esc(S.szabaly(adat, 'elotorlesztes.mfl_dij').szoveg), esc(S.szabaly(adat, 'elotorlesztes.mfl_dij').megjegyzes)] },
      { k: 'Előtörleszthetem a Wekerle Plusz hitelt?', v: ['Igen, de a kamattámogatott hiteleknél a kedvezményes kamat miatt ritkán éri meg: a 3% vagy 5% kamat alacsonyabb lehet, mint amennyit a pénzed állampapírban hozna.'] },
    ],
    forrasKulcsok: ['elotorlesztes.mfl_dij'],
  });
}

/* ======================= BÉRLETI DÍJ EMELÉSE ======================= */
export const EMELES_UT = 'berleti-dij-emeles-inflacio/';
export function emelesOldal(k) {
  const { adat } = k;
  const evek = Object.keys(adat.inflacio.evek).sort(), utolso = evek[evek.length - 1], p = adat.inflacio.evek[utolso].szazalek;
  return kalkOldal(k, {
    ut: EMELES_UT, tipus: 'emeles', nev: 'Bérleti díj emelése', temak: [],
    oldalCim: `Bérleti díj emelése inflációval ${Number(utolso) + 1}: KSH átlagos infláció`,
    leiras: `A bérleti díj emelése az előző évi átlagos inflációval: ${utolso}-ben ${M.tized(p, 1)}% a KSH szerint. Az új díj, a különbség havonta és évente.`,
    cim: 'Mennyivel emelheted a bérleti díjat az inflációval?',
    valasz: `A KSH szerint ${M.rag(Number(utolso), 'ban', 'ben')} az átlagos infláció ${M.tized(p, 1)}% volt. Egy havi 240 000 forintos díj ezzel ${M.fmt(Math.round(240000 * (1 + p / 100)))} Ft-ra emelkedik.`,
    urlapCim: 'A bérleti díj', urlapAl: 'Bérleti szerződés szerinti emelés',
    urlap: `
<fieldset>${reszCim('', 'A díj')}
${sor('', szamMezo({ id: 'dij', cim: 'Mostani havi bérleti díj', me: 'Ft', placeholder: 'pl. 240 000', min: 0, szeles: true }))}
${sor('', negyzetek('ev', 'Melyik év inflációjával?', evek.slice().reverse().map((e) => [e, `${e}: ${M.tized(adat.inflacio.evek[e].szazalek, 1)}%`]), ''))}
${sor('', szamMezo({ id: 'sajat', cim: 'Vagy a saját mértékkel', me: '%', placeholder: 'pl. 5', tized: true, sugo: 'Ha a szerződés más mértéket ír, például fix 5%-ot.' }))}
</fieldset>`,
    cikk: `<h2>Mit kell tudni?</h2>
<p>A bérbeadó csak akkor emelhet díjat, ha a szerződés ezt lehetővé teszi, és csak úgy, ahogy ott áll. A leggyakoribb kikötés: „évente a KSH által közzétett előző évi átlagos fogyasztói árindex mértékével”. A KSH ezt minden év januárjában közli.</p>
<p>Ha a szerződés semmit nem mond az emelésről, a díjat csak a bérlővel közösen, szerződésmódosítással lehet megváltoztatni.</p>`,
    kerdesek: [
      { k: 'Melyik inflációt kell használni?', v: ['Amit a szerződés ír. Ha „előző évi átlagos inflációt” ír, akkor a KSH által januárban közölt éves átlagot, nem a decemberi, 12 havi adatot.'] },
      { k: 'Mikor frissül ez az oldal?', v: ['Amikor a KSH januárban közli az előző év átlagát, felvesszük. Január 15-től az oldal ellenőrzése jelez, ha még hiányzik.'] },
    ],
    forrasKulcsok: [], forrasExtra: evek.map((e) => ({ nev: `${e}: ${adat.inflacio.evek[e].forras.nev}`, url: adat.inflacio.evek[e].forras.url, d: datumHu(adat.inflacio.evek[e].forras.kelt) })),
    adatExtra: { inflacio: adat.inflacio },
  });
}

/* ======================= MEGÉRI KIADÁSRA VENNI? ======================= */
export const HOZAM_UT = 'lakas-befektetes-hozam-kalkulator/';
export function hozamOldal(k) {
  const { adat } = k;
  const p = S.hozam(adat, { vetelar: 48e6, havi: 230000, honap: 11, koltseg: 450000, ev: k.ev });
  return kalkOldal(k, {
    ut: HOZAM_UT, tipus: 'hozam', nev: 'Megéri kiadásra venni?', temak: ['illetek', 'berbeadas', 'haszonelvezet', 'wekerle_plusz', 'hitel', 'berles_vetel'],
    oldalCim: 'Lakás bérbeadás hozam kalkulátor: megéri kiadásra venni?',
    leiras: 'Kiadásra vett lakás bruttó és nettó hozama: vételár, illeték, felújítás, bérleti díj, üres hónapok, költségek és az szja, a jobbik adózási módszerrel.',
    cim: 'Megéri lakást venni kiadásra?',
    valasz: `A nettó hozam számít: a bérleti díjból a költségek és az adó után maradó rész a teljes befektetéshez képest. Egy 48 millió forintos, havi 230 000 forintért, évi 11 hónapra kiadott lakásnál ez ${M.tized(p.nettoHozam, 1)}% évente, az értéknövekedés nélkül.`,
    urlapCim: 'A befektetés', urlapAl: 'Vétel és bérbeadás',
    urlap: `
<fieldset>${reszCim('', 'A vétel')}
${sor('', szamMezo({ id: 'vetelar', cim: 'Vételár', me: 'Ft', placeholder: 'pl. 48 000 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'egyeb', cim: 'Ügyvéd és egyéb vételi költség', me: 'Ft', placeholder: 'pl. 600 000', min: 0, szeles: true, sugo: 'Az illetéket kiszámoljuk, ide ne írd bele.' }))}
${sor('', szamMezo({ id: 'felujitas', cim: 'Felújítás, berendezés', me: 'Ft', placeholder: 'pl. 2 500 000', min: 0, szeles: true }))}
</fieldset>
<fieldset>${reszCim('', 'A bérbeadás')}
${sor('', szamMezo({ id: 'havi', cim: 'Havi bérleti díj', me: 'Ft', placeholder: 'pl. 230 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'honap', cim: 'Hány hónapig van kiadva egy évben?', me: 'hónap', placeholder: '11', min: 1, max: 12 }))}
${sor('', szamMezo({ id: 'koltseg', cim: 'Éves költségek', me: 'Ft', placeholder: 'pl. 450 000', min: 0, szeles: true, sugo: 'Közös költség, biztosítás, építményadó, karbantartás, ha te fizeted.' }))}
</fieldset>
<fieldset>${reszCim('III.', 'Hitel')}
<p class="fieldset-megj">Ha hitelből veszed. A bank a lakásra jelzálogot jegyez be, a tulajdoni lap III. részébe.</p>
${sor('', szamMezo({ id: 'hitel', cim: 'Hitelösszeg', me: 'Ft', placeholder: 'pl. 30 000 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'kamat', cim: 'Kamat', me: '%', placeholder: M.tized(S.szabaly(adat, 'wekerle_plusz.piaci_kamat').ertek.szazalek, 1), tized: true, sugo: 'Ha üresen hagyod, összehasonlító piaci kamattal számolunk. Kamattámogatott hitellel kiadásra nem vehetsz lakást.' }))}
${sor('', szamMezo({ id: 'futamido', cim: 'Futamidő', me: 'év', placeholder: '20', min: 1, max: 35 }))}
</fieldset>
<fieldset>${reszCim('', 'Összevetés')}
${sor('', szamMezo({ id: 'allampapir', cim: 'Kockázatmentes hozam', me: '%', placeholder: M.tized(S.szabaly(adat, 'berles_vetel.allampapir').ertek.szazalek, 2), tized: true, sugo: 'A Prémium Magyar Állampapír kamata. Ha más befektetéssel vetnéd össze, írd át.' }))}
</fieldset>`,
    cikk: `<h2>Bruttó és nettó hozam</h2>
<p>A bruttó hozam az éves bérleti díj a teljes befektetéshez, vagyis a vételárhoz, az illetékhez és a felújításhoz képest. A hirdetések gyakran ezt mutatják. A nettó hozam ebből levonja a költségeket és az adót, ez az, ami tényleg a tiéd.</p>
<p>A kalkulátor az adót a 10% költséghányaddal és a tételes elszámolással is kiszámolja, és a kisebbet veszi. Az ingatlan értéknövekedése nincs benne: az bizonytalan, és csak eladáskor realizálódik.</p>`,
    kerdesek: [
      { k: 'Mennyi a jó bérleti hozam?', v: ['Akkor éri meg, ha a nettó hozam meghaladja azt, amit a pénzed kockázat nélkül hozna, például állampapírban. A lakás mellett szól, hogy az értéke az inflációval együtt nőhet, ellene, hogy nehezen és drágán lehet eladni.'] },
      { k: 'Hitelből is megéri?', v: ['Ha a hitel kamata magasabb, mint a nettó hozam, a különbséget a saját pénzedből fizeted. Kamattámogatott hitellel kiadásra nem vehetsz lakást: a Wekerle Plusznál öt évig ott kell laknod.'] },
    ],
    forrasKulcsok: ['illetek.altalanos_mertek', 'berbeadas.ado_mertek', 'berbeadas.koltseghanyad', 'hitel.hfm', 'berles_vetel.allampapir'],
  });
}

/* ======================= LAKÁSVÁSÁRLÁS INDULÓ KÖLTSÉGE ======================= */
export const INDULO_UT = 'lakasvasarlas-koltsegei-kalkulator/';
export function induloOldal(k) {
  const { adat } = k;
  const v = (kk) => S.szabaly(adat, `vetel_koltsegek.${kk}`).ertek;
  const p = S.indulo(adat, { vetelar: 50e6, hitel: 40e6 });
  const fh = v('foldhivatal'), uv = v('ugyvedi');
  return kalkOldal(k, {
    ut: INDULO_UT, tipus: 'indulo', nev: 'Mennyi pénz kell a vételhez?', temak: ['illetek', 'haszonelvezet', 'hitel', 'vetel_koltsegek'],
    oldalCim: `Lakásvásárlás költségei kalkulátor ${k.ev}: mennyi pénz kell a vételáron felül?`,
    leiras: 'Önerő, illeték a kedvezményekkel, ügyvéd, földhivatal, értékbecslés, közjegyző és folyósítási díj, időrendben: mennyi saját pénz kell, és mennyi hiányzik a megtakarításodból.',
    cim: 'Mennyi saját pénz kell egy lakás megvételéhez?',
    valasz: `Az önerő, plusz az illeték és a mellékköltségek. Egy 50 millió forintos lakásnál 40 millió forint hitellel ez ${M.fmt(p.osszes)} Ft, ebből ${M.fmt(p.vetelarFelett)} Ft a vételáron felül. A legnagyobb tétel az illeték, és az érkezik utoljára.`,
    urlapCim: 'A lakás és a hitel', urlapAl: 'Ingatlan-adásvétel',
    urlap: `
<fieldset>${reszCim('I.', 'A lakás')}
${sor('', szamMezo({ id: 'vetelar', cim: 'Vételár', me: 'Ft', placeholder: 'pl. 50 000 000', min: 0, szeles: true }))}
${sor('', negyzetek('kitol', 'Kitől veszed?', [['magan', 'Magánszemélytől'], ['vallalkozo', 'Új lakás, építő vállalkozótól'], ['rokon', 'Szülőtől, gyermektől, házastárstól']], ''))}
</fieldset>
<fieldset>${reszCim('III.', 'A hitel')}
${sor('', szamMezo({ id: 'hitel', cim: 'Hitelösszeg', me: 'Ft', placeholder: 'pl. 40 000 000', min: 0, szeles: true, sugo: 'Ha nem veszel fel hitelt, hagyd üresen.' }))}
${sor('', jelolo('tamogatott', 'Wekerle Plusz vagy más államilag támogatott hitel', 'A közjegyző munkadíjának 15%-át fizeted, és a banki díjak együtt legfeljebb 30 000 forintot tehetnek ki.'))}
</fieldset>
<fieldset>${reszCim('', 'Rád vonatkozik?')}
${sor('', jelolo('elso', 'Ez az első lakásod', 'A bank első lakásnál a forgalmi érték 90%-áig adhat hitelt, egyébként 80%-áig.'))}
${sor('', jelolo('fiatal35', 'Még nem töltötted be a 35. évedet', 'Első lakásnál kisebb lehet az illeték.'))}
${sor('', jelolo('csok', 'CSOK Plusz hitellel vagy falusi CSOK-kal veszed', 'Ilyenkor nincs illeték.'))}
</fieldset>
<fieldset>${reszCim('', 'Amit már tudsz')}
<p class="fieldset-megj">Ha üresen hagyod, becsléssel számolunk. Ha már van ajánlatod, írd be a pontos összeget.</p>
${sor('', szamMezo({ id: 'megtakaritas', cim: 'Megtakarításod', me: 'Ft', placeholder: 'pl. 12 000 000', min: 0, szeles: true, sugo: 'Ebből látod, mennyi hiányzik.' }))}
${sor('', szamMezo({ id: 'ugyvedi', cim: 'Ügyvédi díj', me: 'Ft', placeholder: `a vételár ${M.tized(uv.szazalek, 1)}%-a`, min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'ertekbecsles', cim: 'Értékbecslés', me: 'Ft', placeholder: M.fmt(v('ertekbecsles').ft), min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'kozjegyzo', cim: 'Közjegyző', me: 'Ft', placeholder: 'a díjszabás szerint', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'folyositas', cim: 'Folyósítási díj', me: 'Ft', placeholder: 'a felső határ', min: 0, szeles: true, sugo: 'Ha a bankod elengedi, írd be, hogy 0.' }))}
${sor('', szamMezo({ id: 'foglalo', cim: 'Foglaló', me: '%', placeholder: M.tized(v('foglalo').szazalek, 0), tized: true, sugo: 'A vételár hány százalékát fizeted a szerződéskor.' }))}
${sor('', szamMezo({ id: 'egyeb', cim: 'Költözés, felújítás, berendezés', me: 'Ft', placeholder: 'pl. 1 500 000', min: 0, szeles: true }))}
</fieldset>`,
    cikk: `<h2>Mi minden kell a vételáron felül?</h2>
<div class="tabla-tarto"><table class="tabla"><thead><tr><th>Tétel</th><th>Mennyi</th><th>Mikor</th></tr></thead><tbody>
<tr><th scope="row">Foglaló</th><td>a gyakorlatban a vételár ${M.tized(v('foglalo').szazalek, 0)}%-a, a vételár része</td><td>a szerződéskor</td></tr>
<tr><th scope="row">Ügyvédi díj</th><td>a vételár ${M.tized(uv.uj_szazalek, 1)}–${M.tized(uv.szazalek, 0)}%-a, megállapodás szerint</td><td>a szerződéskor</td></tr>
<tr><th scope="row">Földhivatal</th><td>tulajdonjog ${M.fmt(fh.tulajdon_ft)} Ft, jelzálog ${M.fmt(fh.jelzalog_ft)} Ft</td><td>a beadáskor</td></tr>
<tr><th scope="row">Értékbecslés</th><td>0–90 000 Ft, bankonként</td><td>a hitelkérelemkor</td></tr>
<tr><th scope="row">Közjegyző</th><td>a hitelösszeg szerint sávosan, 20 millió forintnál ${M.fmt(S.kozjegyzoDij(adat, 20e6))} Ft munkadíj</td><td>a szerződéskötéskor</td></tr>
<tr><th scope="row">Folyósítási díj</th><td>legfeljebb a hitel ${M.tized(v('folyositas').szazalek, 2)}%-a, legfeljebb ${M.fmt(v('folyositas').max_ft)} Ft</td><td>a folyósításkor</td></tr>
<tr><th scope="row">Illeték</th><td>a forgalmi érték ${S.szabaly(adat, 'illetek.altalanos_mertek').ertek.szazalek}%-a, kedvezménnyel kevesebb</td><td>a NAV meghagyásától ${v('illetek_fizetes').nap} napon belül</td></tr>
</tbody></table></div>
<p>A bank a vételárnak csak egy részét adja: legfeljebb a forgalmi érték ${S.szabaly(adat, 'hitel.hfm').ertek.altalanos}%-át, első lakásnál ${S.szabaly(adat, 'hitel.hfm').ertek.elso_lakas}%-át. A különbözet az önerő. A foglalót és az ügyvédi díjat a hitel folyósítása előtt kell kifizetni, az illetéket pedig hetekkel vagy hónapokkal a beköltözés után. Ezért érdemes ezt az összeget a vételtől külön félretenni.</p>`,
    kerdesek: [
      { k: 'Mennyi pénz kell egy lakás megvételéhez a vételáron felül?', v: [`Az illeték (általában a vételár ${S.szabaly(adat, 'illetek.altalanos_mertek').ertek.szazalek}%-a), az ügyvédi díj és a földhivatal, hitelnél ehhez jön az értékbecslés, a közjegyző és a folyósítási díj. Egy 50 millió forintos lakásnál 40 millió forint hitellel ez együtt ${M.fmt(p.vetelarFelett)} Ft.`] },
      { k: 'Mikor kell kifizetni az illetéket?', v: [esc(S.szabaly(adat, 'vetel_koltsegek.illetek_fizetes').szoveg)] },
      { k: 'Mennyi a földhivatali díj?', v: [esc(S.szabaly(adat, 'vetel_koltsegek.foldhivatal').szoveg)] },
      { k: 'Mennyibe kerül a közjegyző a lakáshitelhez?', v: [esc(S.szabaly(adat, 'vetel_koltsegek.kozjegyzo').szoveg)] },
      { k: 'Mennyi önerő kell?', v: [esc(S.szabaly(adat, 'hitel.hfm').szoveg), 'A bank a saját értékbecslése szerinti forgalmi értékből számol. Ha ez a vételárnál kisebb, több önerő kell.'] },
    ],
    forrasKulcsok: ['illetek.altalanos_mertek', 'hitel.hfm', 'vetel_koltsegek.foldhivatal', 'vetel_koltsegek.ugyvedi', 'vetel_koltsegek.ertekbecsles', 'vetel_koltsegek.kozjegyzo', 'vetel_koltsegek.folyositas', 'vetel_koltsegek.foglalo', 'vetel_koltsegek.illetek_fizetes'],
  });
}

/* ======================= BÉRLÉS VAGY VÉTEL ======================= */
export const BERLES_UT = 'alberlet-vagy-lakasvasarlas-kalkulator/';
export function berlesVetelOldal(k) {
  const { adat } = k;
  const bv = (kk) => S.szabaly(adat, `berles_vetel.${kk}`).ertek;
  const p = S.berlesVetel({ ...adat, inflacio: adat.inflacio }, { vetelar: 50e6, onero: 10e6, berlet: 220000, kozos: 25000, evek: 10 });
  const infEv = Object.keys(adat.inflacio.evek).sort().pop();
  return kalkOldal(k, {
    ut: BERLES_UT, tipus: 'berlesvetel', nev: 'Bérlés vagy vétel', temak: ['illetek', 'haszonelvezet', 'hitel', 'vetel_koltsegek', 'wekerle_plusz', 'berles_vetel'],
    adatExtra: { inflacio: adat.inflacio },
    oldalCim: 'Albérlet vagy lakásvásárlás kalkulátor: melyikkel jársz jobban?',
    leiras: 'Bérlés vagy hitelből vétel: a vagyonod N év múlva három forgatókönyvben, az illetékkel, a mellékköltségekkel, a karbantartással, és ha bérelsz, a pénzed állampapírban.',
    cim: 'Albérlet vagy saját lakás: melyikkel jársz jobban?',
    valasz: `A bérlési díj, a lakásárak és az időtáv dönti el. Egy 50 millió forintos lakás 10 millió forint önerővel, szemben egy havi 220 000 forintos albérlettel: alapesetben 10 év múlva ${M.fmt(Math.abs(p.alap.kulonbseg) / 1e6)} millió forinttal több vagyonod lesz, ha ${p.nyero === 'vetel' ? 'megveszed' : 'bérelsz'}${p.alap.fordul ? `, és a vétel a ${p.alap.fordul}. évben kerül előre` : ''}.`,
    urlapCim: 'A két út', urlapAl: 'Vétel hitelből, vagy bérlés',
    urlap: `
<fieldset>${reszCim('I.', 'Ha megveszed')}
${sor('', szamMezo({ id: 'vetelar', cim: 'Vételár', me: 'Ft', placeholder: 'pl. 50 000 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'onero', cim: 'Önerő', me: 'Ft', placeholder: 'pl. 10 000 000', min: 0, szeles: true, sugo: 'A vételárból ennyit fizetsz saját pénzből. A többi hitel. Az illetéket és a mellékköltségeket mi adjuk hozzá.' }))}
${sor('III.', szamMezo({ id: 'kamat', cim: 'Hitelkamat', me: '%', placeholder: M.tized(S.szabaly(adat, 'wekerle_plusz.piaci_kamat').ertek.szazalek, 1), tized: true, sugo: 'Wekerle Plusszal 3% vagy 5%.' }))}
${sor('', szamMezo({ id: 'futamido', cim: 'Futamidő', me: 'év', placeholder: '20', min: 1, max: 35 }))}
${sor('', szamMezo({ id: 'kozos', cim: 'Közös költség és biztosítás', me: 'Ft', placeholder: 'pl. 25 000', min: 0, szeles: true, sugo: 'Havonta, amit tulajdonosként fizetnél. Ha bérlőként is te fizetnéd, hagyd üresen.' }))}
</fieldset>
<fieldset>${reszCim('', 'Ha bérelsz')}
${sor('', szamMezo({ id: 'berlet', cim: 'Havi bérleti díj', me: 'Ft', placeholder: 'pl. 220 000', min: 0, szeles: true, sugo: 'Egy hasonló lakásé, ugyanazon a környéken.' }))}
</fieldset>
<fieldset>${reszCim('', 'Feltevések')}
<p class="fieldset-megj">Ha üresen hagyod, ezekkel számolunk. Mindegyiket átírhatod.</p>
${sor('', szamMezo({ id: 'evek', cim: 'Időtáv', me: 'év', placeholder: '10', min: 1, max: 40 }))}
${sor('', szamMezo({ id: 'arNo', cim: 'A lakásár változása évente', me: '%', placeholder: M.tized(p.infSz, 1), tized: true, sugo: `Alapesetben a KSH ${infEv}. évi átlagos inflációja. A borúlátó és a derűlátó változat ${bv('forgatokonyv').elteres_szazalekpont} százalékponttal tér el.` }))}
${sor('', szamMezo({ id: 'berNo', cim: 'A bérleti díj változása évente', me: '%', placeholder: M.tized(p.infSz, 1), tized: true }))}
${sor('', szamMezo({ id: 'hozam', cim: 'A befektetés hozama', me: '%', placeholder: M.tized(bv('allampapir').szazalek, 1), tized: true, sugo: 'Amit a bérlő a megmaradó pénzén keres. Alapesetben a Prémium Magyar Állampapír kamata.' }))}
${sor('', szamMezo({ id: 'karbantartas', cim: 'Karbantartás évente', me: '%', placeholder: M.tized(bv('karbantartas').szazalek, 1), tized: true, sugo: 'A lakás értékének ennyi százaléka megy el évente javításra, festésre, gépcserére.' }))}
</fieldset>`,
    cikk: `<h2>Hogyan számolunk?</h2>
<p>Mindkét úton ugyanannyi pénz megy ki. A vevő az önerőt, az illetéket és a mellékköltségeket kifizeti, a bérlő ugyanezt az összeget befekteti. Havonta a vevő törlesztőt, közös költséget és karbantartást fizet, a bérlő bérleti díjat. Ami az egyiknél kevesebb, azt befekteti.</p>
<p>A végén a vevő vagyona a lakás értéke, mínusz a még meglévő tartozás, plusz amit befektetett. A bérlőé a befektetése. A lakásárakat senki sem tudja előre, ezért három változatot mutatunk: alapesetben az árak az inflációval nőnek, a borúlátóban ${bv('forgatokonyv').elteres_szazalekpont} százalékponttal lassabban, a derűlátóban ennyivel gyorsabban.</p>
<h2>Amit a számok nem mutatnak</h2>
<p>A bérlés rugalmas: el tudsz költözni, ha munkát vagy várost váltasz. A saját lakás biztonság: nem mondhatják fel, és átalakíthatod. A vételnek eladáskor is van költsége, a közvetítő és ha öt éven belül adod el, az adó.</p>`,
    kerdesek: [
      { k: 'Mikor éri meg albérletben maradni?', v: ['Ha rövid időre tervezel: a vétel illetéke és mellékköltségei több év alatt térülnek meg. Akkor is, ha a bérleti díj a hasonló lakás törlesztőjénél sokkal kisebb, és a különbséget tényleg félreteszed.'] },
      { k: 'Mikor éri meg lakást venni?', v: ['Ha hosszú távra tervezel, a bérleti díj közel van a törlesztőhöz, és a lakásárak legalább az inflációval nőnek. Kamattámogatott hitellel, például a Wekerle Plusszal, a vétel hamarabb előre kerül.'] },
      { k: 'Mennyit hoz a pénz, ha nem veszek lakást?', v: [esc(S.szabaly(adat, 'berles_vetel.allampapir').szoveg)] },
    ],
    forrasKulcsok: ['berles_vetel.allampapir', 'berles_vetel.karbantartas', 'berles_vetel.forgatokonyv', 'wekerle_plusz.piaci_kamat', 'illetek.altalanos_mertek', 'vetel_koltsegek.ugyvedi'],
  });
}

/* ======================= RÖVID VAGY HOSSZÚ TÁVÚ KIADÁS ======================= */
export const ROVID_UT = 'airbnb-vagy-hosszu-tavu-kiadas/';
export function rovidtavOldal(k) {
  const { adat } = k;
  const v = (kk) => S.szabaly(adat, `rovid_tav.${kk}`);
  const at = v('atalany').ertek;
  const p = S.rovidTav(adat, { ejAr: 32000, ejszaka: 20, tartozkodas: 3, takaritas: 8000, rezsi: 35000, kozosEv: 360000, szobak: 1, telepules: 'budapest', hosszuHavi: 260000 });
  return kalkOldal(k, {
    ut: ROVID_UT, tipus: 'rovidtav', nev: 'Airbnb vagy hosszú távú kiadás', temak: ['berbeadas', 'rovid_tav'],
    oldalCim: `Airbnb vagy hosszú távú kiadás kalkulátor ${k.ev}: melyik hoz többet adó után?`,
    leiras: `Rövid távú (Airbnb, Booking) és hosszú távú lakáskiadás adó után: tételes átalányadó (${M.fmt(at.budapest_ft)} Ft/szoba Budapesten), 10% költséghányad vagy tételes elszámolás, áfa, turizmusfejlesztési hozzájárulás, jutalék, takarítás, rezsi, és a fordulópont.`,
    cim: 'Airbnb vagy hosszú távú bérlő: melyik hoz többet?',
    valasz: `A foglalt éjszakák száma dönti el. Egy budapesti egyszobás lakásnál 32 000 forintos éjszakai árral és havi 20 foglalt éjszakával rövid távon évi ${M.fmt(p.rovid.netto)} Ft marad, hosszú távon havi 260 000 forintért ${M.fmt(p.hosszu.netto)} Ft. A rövid táv itt havi ${M.tized(p.fordul, 1)} foglalt éjszakától hoz többet.`,
    urlapCim: 'A lakás kétféle kiadása', urlapAl: 'Szálláshely vagy bérlet',
    urlap: `
<fieldset>${reszCim('I.', 'A lakás')}
${sor('', negyzetek('telepules', 'Hol van?', [['budapest', 'Budapesten'], ['mas', 'Máshol']], ''))}
${sor('', szamMezo({ id: 'szobak', cim: 'Lakószobák', me: 'szoba', placeholder: '1', min: 1, max: 8, sugo: 'A tételes átalányadó lakószobánként jár. Ahol ágy elfér, az lakószoba.' }))}
${sor('', jelolo('tobbLakas', 'Több lakásban is adsz ki szállást', 'Ilyenkor a tételes átalányadó nem választható.'))}
${sor('', szamMezo({ id: 'kozosEv', cim: 'Közös költség, biztosítás, építményadó', me: 'Ft/év', placeholder: 'pl. 360 000', min: 0, szeles: true, sugo: 'Ami mindkét esetben a tiéd.' }))}
</fieldset>
<fieldset>${reszCim('', 'Rövid távon')}
${sor('', szamMezo({ id: 'ejAr', cim: 'Ár egy éjszakára', me: 'Ft', placeholder: 'pl. 32 000', min: 0, szeles: true, sugo: 'Amit a vendég fizet, az idegenforgalmi adó nélkül.' }))}
${sor('', szamMezo({ id: 'ejszaka', cim: 'Foglalt éjszakák havonta', me: 'éj', placeholder: 'pl. 20', min: 0, max: 31, tized: true, sugo: 'Az éves átlag. Nyáron több, télen kevesebb.' }))}
${sor('', szamMezo({ id: 'tartozkodas', cim: 'Átlagos tartózkodás', me: 'éj', placeholder: '3', min: 1, tized: true }))}
${sor('', szamMezo({ id: 'takaritas', cim: 'Takarítás és mosatás foglalásonként', me: 'Ft', placeholder: 'pl. 8 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'rezsi', cim: 'Rezsi és internet havonta', me: 'Ft', placeholder: 'pl. 35 000', min: 0, szeles: true, sugo: 'Rövid távon a tiéd, hosszú távon a bérlőé.' }))}
${sor('', szamMezo({ id: 'platform', cim: 'A platform jutaléka', me: '%', placeholder: M.tized(v('platform').ertek.szazalek, 1), tized: true, sugo: 'Az Airbnb a legtöbb szállásadótól ennyit von le.' }))}
${sor('', szamMezo({ id: 'egyebEv', cim: 'Kopás, javítás, felszerelés', me: 'Ft/év', placeholder: 'pl. 300 000', min: 0, szeles: true }))}
</fieldset>
<fieldset>${reszCim('', 'Hosszú távon')}
${sor('', szamMezo({ id: 'hosszuHavi', cim: 'Havi bérleti díj', me: 'Ft', placeholder: 'pl. 260 000', min: 0, szeles: true }))}
${sor('', szamMezo({ id: 'hosszuHonap', cim: 'Hány hónapig van kiadva egy évben?', me: 'hónap', placeholder: '12', min: 1, max: 12 }))}
</fieldset>`,
    cikk: `<h2>Mi a különbség adóban?</h2>
<p>A hosszú távú bérbeadás ingatlan-bérbeadás: 15% szja, szocho nélkül. A rövid távú kiadás szálláshely-szolgáltatás: adószám, NTAK-regisztráció és bejelentés a jegyzőnél kell hozzá, és három adózási mód közül választhatsz.</p>
<div class="tabla-tarto"><table class="tabla"><thead><tr><th>Adózási mód</th><th>Mennyi</th><th>Mikor jó</th></tr></thead><tbody>
<tr><th scope="row">Tételes átalányadó</th><td>lakószobánként ${M.fmt(at.budapest_ft)} Ft Budapesten, ${M.fmt(at.mashol_ft)} Ft máshol, évente</td><td>ha jól megy a kiadás; csak egy lakásra</td></tr>
<tr><th scope="row">10% költséghányad</th><td>a bevétel 90%-a után 15% szja és 13% szocho</td><td>ritkán éri meg</td></tr>
<tr><th scope="row">Tételes költségelszámolás</th><td>a bevétel és a számlával igazolt költségek különbsége után 15% szja és 13% szocho</td><td>ha sok a költség, vagy több lakást adsz ki</td></tr>
</tbody></table></div>
<p>Ehhez jön a turizmusfejlesztési hozzájárulás (a szállásdíj ${v('tfh').ertek.szazalek}%-a), és ha az éves bevétel eléri a ${M.fmt(v('afa_mentesseg').ertek.ft / 1e6)} millió forintot, ${v('afa_mertek').ertek.szazalek}% áfa. Az idegenforgalmi adót a vendégtől szeded be.</p>
<h2>Budapest, ${M.datumHu(k.ma)}</h2>
<p>${esc(v('budapest').szoveg)} A kerületi szabályok gyakran változnak, ezért mielőtt belekezdesz, mindig kérdezd meg az önkormányzatot.</p>`,
    kerdesek: [
      { k: 'Mennyi az Airbnb adója Budapesten?', v: [esc(v('atalany').szoveg)] },
      { k: 'Kell áfát fizetni rövid távú kiadás után?', v: [esc(v('afa_mentesseg').szoveg), esc(v('afa_mertek').szoveg), esc(v('afa_mentesseg').megjegyzes)] },
      { k: 'Kezdhetek most Airbnb-zni Budapesten?', v: [esc(v('budapest').szoveg)] },
      { k: 'Ki fizeti az idegenforgalmi adót?', v: [esc(v('ifa').szoveg)] },
    ],
    forrasKulcsok: ['rovid_tav.atalany', 'rovid_tav.onallo', 'rovid_tav.afa_mentesseg', 'rovid_tav.afa_mertek', 'rovid_tav.tfh', 'rovid_tav.platform', 'rovid_tav.budapest', 'berbeadas.ado_mertek'],
  });
}
