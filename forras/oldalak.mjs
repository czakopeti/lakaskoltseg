// Az oldalak. Minden szám az adatfájlokból jön, a szöveg a SZOVEG_STILUS.md szerint.
// Most a váz van itt: főoldal (munkaverzió), források, rólunk, jogi oldalak. A kalkulátorok a tartalomterv szerint jönnek.
import * as M from './js/megjelenites.mjs';
import * as S from './js/szamitas.mjs';
import { CSOPORTOK, oldal, oldalfej, ellenorzesKesik, morzsaLd, tovabb, esc, datumHu, forgalmi, elszamolas, sor, kod, szamMezo, reszCim, gyik, gyikLd, alkalmazasLd, forrasLista, alaprajzNagy } from './sablon.mjs';

/* ======================= FŐOLDAL ======================= */
/**
 * A főoldal kártyáinak szövege oldalanként: mit kap, aki rákattint. A sorrendet és a csoportot a CSOPORTOK adja (sablon.mjs).
 * A teszt ellenőrzi, hogy minden csoportelemnek van itt szövege.
 */
export const FOOLDAL_KARTYAK = {
  'ingatlaneladas-szja-kalkulator/': [() => 'Mennyi adót fizetsz, ha eladod a lakásod, a házad vagy a telked, mit vonhatsz le, és melyik évtől nem fizetsz semmit.', 'Kiszámolom'],
  'forrasok/': [() => 'Minden szabály, amivel számolunk: jogszabályhely, forrás, és mikor ellenőriztük utoljára.', 'Megnézem'],
};

export function fooldal(k) {
  const tartalom = (L) => `
<div class="keret nyito"><div>${oldalfej(L, { fo: true, cim: 'Mennyibe kerül venni, eladni vagy kiadni egy lakást?', valasz: 'Illeték, adó és hitel, forinttal kiszámolva. Minden szabály mellett ott a jogszabály és a nap, amikor utoljára ellenőriztük.' }).replace('<div class="keret oldalfej', '<div class="oldalfej')}</div>${alaprajzNagy()}</div>
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

/* ======================= INGATLANELADÁS SZJA-JA ======================= */
export const ELADAS_UT = 'ingatlaneladas-szja-kalkulator/';
/** A kalkulátorhoz szükséges szabályok (a böngészőbe csak ez megy). */
const temaAdat = (adat, ...idk) => ({ szabalyok: { temak: adat.szabalyok.temak.filter((t) => idk.includes(t.id)) } });
export function eladasOldal(k) {
  const { adat } = k;
  const ut = ELADAS_UT;
  const sz = (kulcs) => S.szabaly(adat, `szja_eladas.${kulcs}`);
  const tabla = sz('jovedelem_hanyad').ertek.szazalek_evenkent;
  const kulcs = sz('ado_mertek').ertek.szazalek;
  const mentesEvek = tabla.length - 1;
  const pelda = S.eladasSzja(adat, { eladasEv: k.ev, szerzesEv: k.ev - 2, eladasiAr: 60000000, szerzesiErtek: 50000000, szerzesKoltseg: 2000000 });
  const kerdesek = [
    { k: 'Mikor nem kell adót fizetni az eladott ingatlan után?', v: [`Ha a szerzést követő ${mentesEvek}. évben vagy később adod el. Aki ${M.rag(k.ev - mentesEvek, 'ban', 'ben')} vagy korábban szerezte az ingatlanát, annak a ${k.ev}. évi eladásból nincs adóköteles jövedelme.`, 'Akkor sincs adó, ha a költségeid elérik az eladási árat, vagyis nem volt nyereséged.'] },
    { k: 'Számít, hogy lakást, nyaralót vagy telket adok el?', v: ['Nem. 2017. január 1-je óta minden ingatlanra ugyanaz az ötéves skála érvényes, a lakás és a többi ingatlan között nincs különbség.'] },
    { k: 'Melyik nap számít a szerzés időpontjának?', v: [esc(sz('szerzes_idopontja').szoveg), 'A tulajdoni lap II. részében a tulajdonjogod bejegyzése mellett találod az érkezés napját.'] },
    { k: 'Milyen költségeket vonhatok le?', v: [esc(sz('koltsegek').szoveg), 'A költségek együtt legfeljebb az eladási árig számolhatók el, veszteséget nem lehet kimutatni.'] },
    { k: 'Mikor és hogyan kell befizetni?', v: [esc(sz('bevallas').szoveg), esc(sz('reszletfizetes').szoveg)] },
  ];
  const leiras = `Ingatlaneladás adója ${k.ev}-ben: a szerzés évéből, az eladási árból és a költségekből kiszámolja a ${kulcs}%-os szja-t, és megmutatja, melyik évtől adómentes.`;
  const tartalom = (L) => `
${oldalfej(L, { morzsa: ['Eladás adója'], cim: 'Mennyi adót fizetsz, ha eladod az ingatlanod?', valasz: `A nyereség egy része után ${kulcs}% személyi jövedelemadót, a szerzést követő ${mentesEvek}. évtől pedig semennyit. Egy ${k.ev - 2}-ben 50 millió forintért vett és ${M.rag(k.ev, 'ban', 'ben')} 60 millió forintért eladott lakásnál, 2 millió forint költséggel ez ${M.fmt(pelda.ado)} Ft.`, friss: M.datumNapon(adat.allapot.utolso_ellenorzes || k.ma) })}
<div class="keret asztal">
${forgalmi({ kalk: 'eladas', cim: 'Az eladott ingatlan', al: 'Lakás, ház, nyaraló, telek', tartalom: `
<fieldset>${reszCim('', 'Az eladás')}
${sor('', szamMezo({ id: 'eladasiAr', cim: 'Eladási ár', me: 'Ft', placeholder: 'pl. 60 000 000', min: 0, szeles: true, sugo: 'Az adásvételi szerződésben szereplő vételár. Ha csak a tulajdoni hányadodat adod el, a rád eső rész.' }))}
${sor('', szamMezo({ id: 'eladasEv', cim: 'Az eladás éve', placeholder: `pl. ${k.ev}`, min: 2017, max: k.ev + 5, sugo: `Amikor a szerződést benyújtják a földhivatalhoz. Ha üresen hagyod, az idei évvel (${k.ev}) számolunk.` }))}
</fieldset>
<fieldset>${reszCim('II.', 'A szerzés')}
<p class="fieldset-megj">A tulajdoni lap II. részében, a tulajdonjogod bejegyzésénél találod.</p>
${sor(kod('II.', 'A tulajdoni lap II. része: tulajdonosok és a szerzés'), szamMezo({ id: 'szerzesEv', cim: 'A szerzés éve', placeholder: `pl. ${k.ev - 2}`, min: 1950, max: k.ev + 5, sugo: 'Vételnél a szerződés földhivatali érkezésének éve, öröklésnél az örökhagyó halálának éve.' }))}
${sor('', szamMezo({ id: 'szerzesiErtek', cim: 'Szerzési érték', me: 'Ft', placeholder: 'pl. 50 000 000', min: 0, szeles: true, sugo: 'Vételnél az akkori vételár. Öröklésnél a hagyatéki eljárásban megállapított érték.' }))}
</fieldset>
<fieldset>${reszCim('', 'Levonható költségek')}
<p class="fieldset-megj">Csak azt írd be, amiről számlád vagy okiratod van.</p>
${sor('', szamMezo({ id: 'szerzesKoltseg', cim: 'A szerzés költségei', me: 'Ft', placeholder: 'pl. 2 000 000', min: 0, szeles: true, sugo: 'A megfizetett illeték, az ügyvédi díj.' }))}
${sor('', szamMezo({ id: 'beruhazas', cim: 'Értéknövelő beruházás', me: 'Ft', placeholder: 'pl. 3 000 000', min: 0, szeles: true, sugo: 'Felújítás, bővítés, korszerűsítés, számlával.' }))}
${sor('', szamMezo({ id: 'eladasKoltseg', cim: 'Az eladás költségei', me: 'Ft', placeholder: 'pl. 1 500 000', min: 0, szeles: true, sugo: 'Ingatlanközvetítő, hirdetés, energetikai tanúsítvány.' }))}
</fieldset>`, extra: ' data-kalk-nev="eladas-szja"' })}
${elszamolas(k, M.mintaJelzes(`egy ${k.ev - 2}-ben 50 millió forintért vett és ${M.rag(k.ev, 'ban', 'ben')} 60 millió forintért eladott lakás, 2 millió forint illetékkel és ügyvédi díjjal`, 'Írd be a saját adataidat, és a minta helyett azokkal számolunk.') + M.eladasPanel(adat, pelda), { kesz: true })}
</div>
<div class="keret"><article class="cikk">
<h2>Hogyan számol az adóhivatal?</h2>
<p>Az eladási árból levonod, amennyiért szerezted, és a számlával igazolt költségeket. Ami marad, az a számított összeg. Ebből annál kevesebb számít jövedelemnek, minél régebben a tiéd az ingatlan.</p>
<div class="tabla-tarto"><table class="tabla"><thead><tr><th>Mikor adod el</th><th>A számított összegből jövedelem</th></tr></thead><tbody>
${tabla.map((p, i) => `<tr><th scope="row">${i === 0 ? 'A szerzés évében' : i === tabla.length - 1 ? `A szerzést követő ${i}. évben és később` : `A szerzést követő ${i}. évben`}</th><td>${p}%</td></tr>`).join('')}
</tbody></table></div>
<p>A jövedelem után ${kulcs}% az adó. Az évek naptári évek: aki ${k.ev - 1} decemberében szerzett, annak ${k.ev} már a szerzést követő első év.</p>
<h2>Gyakori kérdések</h2>
${gyik(kerdesek)}
<h2>Források</h2>
${forrasLista([...new Map(['ado_mertek', 'jovedelem_hanyad', 'koltsegek', 'bevallas'].map((x) => [sz(x).forras.url, { nev: sz(x).forras.nev, url: sz(x).forras.url, d: `${sz(x).forras.kelt ? `${datumHu(sz(x).forras.kelt)} ` : ''}Ellenőrizve: ${datumHu(sz(x).ellenorizve)}` }])).values(), { nev: 'A személyi jövedelemadóról szóló 1995. évi CXVII. törvény 59–64. §', d: '' }])}
${tovabb(L, ut)}
</article></div>`;
  return oldal(k, {
    cim: `Ingatlaneladás szja-kalkulátor ${k.ev}: mennyi az adó?`,
    leiras, ut, tartalom,
    adatJson: { ...temaAdat(adat, 'szja_eladas'), ev: k.ev, ma: k.ma },
    jsonld: [alkalmazasLd(k.cfg, 'Ingatlaneladás szja-kalkulátor', ut, leiras), gyikLd(kerdesek), morzsaLd(k.cfg, [{ nev: 'Eladás adója', ut }])],
  });
}
