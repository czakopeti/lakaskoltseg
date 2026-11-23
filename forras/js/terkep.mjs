// A lakásár-térkép: valódi eladási árak (KSH Ingatlanadattár) településenként és budapesti kerületenként.
// SVG-térkép külső könyvtár nélkül; az adat és a határok a /adatok/lakasarak/ alól jönnek.
import { fmt, tized, evBan, AR_SZINEK as SZINEK, AR_HATAR as HATAR, arOsztaly as osztaly, meres } from './megjelenites.mjs';

const doboz = document.querySelector('[data-terkep]');
if (doboz) indit(doboz).catch((e) => {
  const h = doboz.querySelector('[data-orszag]');
  if (h) h.innerHTML = `<p class="tk-tolt">A térképet most nem sikerült betölteni (${esc(e.message || e)}). Az árakat lent táblázatban is megtalálod.</p>`;
});

const LASSU = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TIPUS = { o: 'Minden lakóingatlan', t: 'Társasházi lakás', p: 'Panellakás', h: 'Családi ház' };
const LEPES_MS = 1100;

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
const ft = (ezer) => `${fmt(ezer * 1000)} Ft`;
const ftRovid = (ezer) => (ezer >= 1000 ? `${tized(ezer / 1000, 2)} millió` : `${fmt(ezer)} ezer`);
const szaz = (v) => `${v >= 0 ? '+' : '−'}${fmt(Math.abs(Math.round(v)))}%`;

// Az adatfájlok egy napig cache-elhetők, ezért az adat változásakor új ?v= kerül az URL-re
async function json(url) {
  const v = document.querySelector('[data-adat-v]')?.dataset.adatV;
  const r = await fetch(v ? `${url}?v=${v}` : url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function indit(el) {
  const alap = el.dataset.alap;
  const alapUt = el.dataset.ut || '/lakasarak/';
  const [A, G, B] = await Promise.all([json(`${alap}arak.json`), json(`${alap}orszag.json`), json(`${alap}budapest.json`)]);
  // A legutóbbi valódi év után egy „ma” lépés: a becsült mai ár (a KSH árindexeivel mára hozva). Ez az alapnézet.
  const valodi = A.evek.length - 1;
  const MA = A.becsles?.cimke ? valodi + 1 : null;
  const evek = MA ? [...A.evek, A.evek[valodi] + 1] : A.evek; // a csúszkához; a felirat mindig evNev()
  if (MA) {
    for (const [k, u] of Object.entries(A.egysegek)) {
      const sz = A.becsles.szorzok[k];
      for (const t of ['o', 't', 'p', 'h']) {
        if (u.s[t]) { const v = u.s[t][valodi]; u.s[t].push(v != null && sz ? Math.round(v * sz) : null); }
        if (u.s[`${t}d`]) u.s[`${t}d`].push(null);
      }
      if (A.megfiz?.ertek?.[k]) A.megfiz.ertek[k].push(A.megfiz.ma?.[k] ?? null);
    }
  }
  const utolso = evek.length - 1;
  const evNev = (ix) => (ix === MA ? `ma (${A.becsles.cimke}, becslés)` : String(evek[ix]));
  const evRovid = (ix) => (ix === MA ? 'ma' : String(evek[ix]));
  const S = { mutato: 'ar', tipus: 'o', ix: utolso, kijelolt: null, jatszik: null };
  const utcaCache = new Map();

  const orszag = el.querySelector('[data-orszag]'), bp = el.querySelector('[data-budapest]');
  const cimke = el.querySelector('[data-ev-cimke]'), csuszka = el.querySelector('[data-ev-csuszka]');
  const tipp = el.querySelector('[data-tipp]'), adatlap = el.querySelector('[data-adatlap]');
  const skala = el.querySelector('[data-skala]'), jatszo = el.querySelector('[data-lejatszas]');

  // ---- rajz
  const [, , W] = G.vb.split(' ').map(Number);
  orszag.innerHTML = `<svg viewBox="${G.vb}" class="tk-svg" role="presentation">${G.u.map(([k, d, bb]) => `<path data-k="${k}" d="${d}" style="--d:${Math.round(((bb[0] + bb[2]) / 2 / W) * 1200)}ms"/>`).join('')}${G.m.map(([, d]) => `<path class="tk-megye" d="${d}"/>`).join('')}</svg>`;
  bp.innerHTML = `<svg viewBox="${B.vb}" class="tk-svg tk-svg-bp" role="presentation">${B.u.map(([k, d]) => `<path data-k="${k}" d="${d}"/>`).join('')}</svg>`;
  const utak = [...el.querySelectorAll('path[data-k]')];

  // ---- érték és szín
  function ertek(k, ix = S.ix, tipus = S.tipus) {
    const s = A.egysegek[k]?.s[tipus];
    const v = s?.[ix];
    if (v == null) return null;
    if (S.mutato === 'ar') return v;
    if (S.mutato === 'evek') return A.megfiz?.ertek?.[k]?.[ix] ?? null;
    return s[0] ? (v / s[0] - 1) * 100 : null;
  }
  const szin = (v) => (v == null ? null : SZINEK[osztaly(v, HATAR[S.mutato])]);
  function fest() {
    for (const p of utak) {
      const c = szin(ertek(p.dataset.k));
      p.style.fill = c || '';
      p.classList.toggle('tk-nincs', !c);
    }
    cimke.textContent = evRovid(S.ix);
    csuszka.max = evek[utolso];
    csuszka.value = evek[S.ix];
    csuszka.setAttribute('aria-valuetext', evNev(S.ix));
    skalaRajz();
    if (S.kijelolt) lapRajz(S.kijelolt, false);
  }
  function skalaRajz() {
    const h = HATAR[S.mutato];
    const cimkek = S.mutato === 'ar' ? h.map((x) => ftRovid(x)) : S.mutato === 'evek' ? h.map((x) => `${x} év`) : h.map((x) => `${x}%`);
    skala.innerHTML = `<p class="tk-skala-cim">${S.mutato === 'ar' ? `Átlagár, Ft/m², ${evNev(S.ix)}` : S.mutato === 'evek' ? `Hány évnyi helyi nettó átlagkereset egy ${A.megfiz?.m2 || 50} m²-es lakás, ${evNev(S.ix)}` : `Drágulás ${evek[0]} óta, ${S.ix === MA ? 'mára (becslés)' : `${evek[S.ix]}-ig`}`}${S.tipus !== 'o' && S.mutato !== 'evek' ? `, ${TIPUS[S.tipus].toLowerCase()}` : ''}</p>
<div class="tk-sav">${SZINEK.map((c, i) => `<i style="background:${c}" title="${i === 0 ? `${cimkek[0]} alatt` : i === SZINEK.length - 1 ? `${cimkek.at(-1)} felett` : `${cimkek[i - 1]} – ${cimkek[i]}`}"></i>`).join('')}</div>
<div class="tk-sav-cimkek">${cimkek.map((c, i) => `<span style="left:${((i + 1) / SZINEK.length) * 100}%">${i % 2 === 0 || cimkek.length < 6 ? c : ''}</span>`).join('')}</div>
<p class="tk-skala-nincs"><i></i>${S.mutato === 'evek' ? 'Nincs adat: kevés adásvétel, vagy erre az évre még nincs kereseti adat' : 'Nincs adat: az évben háromnál kevesebb adásvétel volt'}</p>${S.mutato === 'evek' && A.megfiz?.forras ? `<p class="tk-skala-nincs">Kereset: <a href="${esc(A.megfiz.forras.url)}" target="_blank" rel="noopener">KSH, nettó átlagkereset lakóhely szerint</a>; Budapest kerületeinél a budapesti átlag.</p>` : ''}`;
  }

  // ---- első megjelenés: nyugatról keletre töltődik ki
  const elso = () => { fest(); setTimeout(() => el.classList.add('tk-kesz'), LASSU ? 0 : 1900); };
  if (LASSU || !('IntersectionObserver' in window)) { el.classList.add('tk-kesz'); elso(); }
  else {
    const io = new IntersectionObserver((bej) => { if (bej.some((b) => b.isIntersecting)) { io.disconnect(); requestAnimationFrame(() => requestAnimationFrame(elso)); } }, { threshold: 0.25 });
    io.observe(orszag);
  }

  // ---- buborék
  function tippMutat(k, e) {
    const u = A.egysegek[k];
    const nev = u?.n || 'Nincs adat';
    const v = ertek(k);
    const ar = u?.s[S.tipus]?.[S.ix], db = u?.s[`${S.tipus}d`]?.[S.ix];
    tipp.innerHTML = `<b>${esc(nev)}</b>${ar != null ? `<span>${S.ix === MA ? 'kb. ' : ''}${ft(ar)}/m²${S.ix === MA ? ', becsült mai ár' : db ? `, ${fmt(db)} adásvétel` : ''}</span>${S.mutato === 'valt' && v != null ? `<span>${szaz(v)} ${evek[0]} óta</span>` : ''}${S.mutato === 'evek' && v != null ? `<span>${tized(v, 1)} évnyi nettó átlagkereset egy ${A.megfiz.m2} m²-es lakás</span>` : ''}` : `<span>${evNev(S.ix)}: nincs adat${S.tipus !== 'o' ? ' ennél a típusnál' : ''}</span>`}`;
    tipp.hidden = false;
    const r = el.querySelector('.tk-vaszon').getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    tipp.style.left = `${Math.min(x + 14, r.width - tipp.offsetWidth - 8)}px`;
    tipp.style.top = `${Math.max(y - tipp.offsetHeight - 12, 8)}px`;
  }
  const vaszon = el.querySelector('.tk-vaszon');
  vaszon.addEventListener('pointermove', (e) => {
    const p = e.target.closest('path[data-k]');
    if (!p || e.pointerType === 'touch') { tipp.hidden = true; return; }
    tippMutat(p.dataset.k, e);
  });
  vaszon.addEventListener('pointerleave', () => { tipp.hidden = true; });
  // Mérés: „indit” = bármilyen kattintás vagy beállítás a térképen, „kesz” = valaki megnyitott egy település adatlapját,
  // „kovetkezo” = továbblépett a település saját oldalára
  el.addEventListener('click', (e) => { meres('indit'); if (e.target.closest('.tk-reszletek')) meres('kovetkezo'); });
  el.addEventListener('input', () => meres('indit'));
  vaszon.addEventListener('click', (e) => {
    const p = e.target.closest('path[data-k]');
    if (p && A.egysegek[p.dataset.k]) valaszt(p.dataset.k, true);
  });

  // ---- adatlap
  function valaszt(k, gorget) {
    S.kijelolt = k;
    for (const p of utak) p.classList.toggle('tk-kijelolt', p.dataset.k === k);
    lapRajz(k, true);
    history.replaceState(null, '', `#${encodeURIComponent(A.egysegek[k].n)}`);
    if (gorget) { meres('kesz'); adatlap.scrollIntoView({ behavior: LASSU ? 'auto' : 'smooth', block: 'nearest' }); }
  }
  function grafikon(s) {
    const pontok = s.map((v, i) => [i, v]).filter(([, v]) => v != null);
    if (pontok.length < 2) return '';
    const max = Math.max(...pontok.map(([, v]) => v)), min = Math.min(...pontok.map(([, v]) => v));
    const W2 = 320, H2 = 96, px = (i) => 8 + (i / (evek.length - 1)) * (W2 - 16), py = (v) => H2 - 14 - ((v - min) / (max - min || 1)) * (H2 - 30);
    const d = pontok.map(([i, v], j) => `${j ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join('');
    return `<svg class="tk-grafikon" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="Az átlagár alakulása ${evek[0]} és ${evRovid(utolso)} között"><path class="tk-vonal" d="${d}" pathLength="1"/>${pontok.map(([i, v]) => `<circle cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="${i === S.ix ? 4.5 : 2.5}"${i === S.ix ? ' class="most"' : ''}><title>${evek[i]}: ${ft(v)}/m²</title></circle>`).join('')}<text x="8" y="${H2 - 1}">${evek[0]}</text><text x="${W2 - 8}" y="${H2 - 1}" text-anchor="end">${evRovid(utolso)}</text></svg>`;
  }
  function lapRajz(k, uj) {
    const u = A.egysegek[k];
    if (!u) return;
    const tip = u.s[S.tipus] ? S.tipus : 'o';
    const s = u.s[tip] || [], ar = s[S.ix], db = u.s[`${tip}d`]?.[S.ix];
    const elozo = s[S.ix - 1], kezd = s[0];
    const hol = u.t === 5 ? 'Budapest' : u.t === 1 ? '' : `${A.megyek[u.m]?.n || ''}${/vármegye$/.test(A.megyek[u.m]?.n || '') ? '' : ' vármegye'}`;
    const sorok = ['t', 'p', 'h'].filter((t) => u.s[t]?.[S.ix] != null).map((t) => `<tr><th scope="row">${TIPUS[t]}</th><td>${ft(u.s[t][S.ix])}/m²</td><td>${S.ix === MA ? 'becslés' : `${fmt(u.s[`${t}d`]?.[S.ix] || 0)} db`}</td></tr>`).join('');
    adatlap.innerHTML = `<div class="tk-lap${uj && !LASSU ? ' tk-uj' : ''}">
<button type="button" class="tk-bezar" data-bezar aria-label="Bezárás">×</button>
<p class="tk-hol">${esc(hol)}</p><h3>${esc(u.n)}</h3>
${ar != null ? `<p class="tk-nagy">${S.ix === MA ? 'kb. ' : ''}${ft(ar)}<small>/m², ${evNev(S.ix)}${tip !== 'o' ? `, ${TIPUS[tip].toLowerCase()}` : ''}</small></p>
${S.ix === MA && elozo != null ? `<p class="tk-becsles">Valódi eladási ár ${evBan(evek[valodi])}: <b>${ft(elozo)}/m²</b>${u.s[`${tip}d`]?.[valodi] ? ` (${fmt(u.s[`${tip}d`][valodi])} adásvétel)` : ''}. A becslés ebből indul, a KSH lakásárindexeivel mára hozva.</p>` : ''}${S.ix === valodi && MA && A.becsles?.szorzok?.[k] ? `<p class="tk-becsles">Becsült mai ár, ${A.becsles.cimke}: <b>kb. ${ft(Math.round(ar * A.becsles.szorzok[k]))}/m²</b></p>` : ''}
<p class="tk-valt">${S.ix === MA ? `${kezd != null ? `${evek[0]} óta ${szaz((ar / kezd - 1) * 100)}.` : ''}` : `${db ? `${fmt(db)} adásvétel alapján. ` : ''}${elozo != null ? `Egy év alatt ${szaz((ar / elozo - 1) * 100)}` : ''}${kezd != null && S.ix > 0 ? `${elozo != null ? ', ' : ''}${evek[0]} óta ${szaz((ar / kezd - 1) * 100)}.` : elozo != null ? '.' : ''}`}</p>` : `<p class="tk-valt">${S.ix === MA ? 'Mára nincs becslés: a legutóbbi évben háromnál kevesebb adásvétel volt.' : `${evek[S.ix]}-re nincs adat: az évben háromnál kevesebb adásvétel volt.`}</p>`}
${grafikon(s)}
${sorok ? `<table class="tk-tipusok"><tbody>${sorok}</tbody></table>` : ''}
${A.oldalak?.[k] ? `<a class="tk-reszletek" href="${alapUt}${A.oldalak[k].replace(/^lakasarak\//, '')}">Részletek, utcák, évenkénti táblázat</a>` : ''}
<div data-utcak></div>
</div>`;
    adatlap.hidden = false;
    adatlap.querySelector('[data-bezar]').addEventListener('click', () => { S.kijelolt = null; adatlap.hidden = true; for (const p of utak) p.classList.remove('tk-kijelolt'); history.replaceState(null, '', location.pathname); });
    utcakGomb(k, adatlap.querySelector('[data-utcak]'));
  }
  async function utcak(m) {
    if (!utcaCache.has(m)) utcaCache.set(m, json(`${alap}utcak/${m}.json`).catch(() => ({})));
    return utcaCache.get(m);
  }
  async function utcakGomb(k, hely) {
    const u = A.egysegek[k];
    const lista = (await utcak(u.m))[k];
    const iU = Math.min(S.ix, valodi); // utcánként nincs becslés: a legutóbbi valódi év
    const ebben = lista?.filter((l) => l[1][iU] != null).length || 0;
    if (!ebben || S.kijelolt !== k) return;
    hely.innerHTML = `<button type="button" class="tk-utca-gomb" aria-expanded="false">Utcák szerint, ${evek[iU]} (${fmt(ebben)})</button><div class="tk-utcak" hidden></div>`;
    const gomb = hely.querySelector('button'), doboz2 = hely.querySelector('.tk-utcak');
    gomb.addEventListener('click', () => {
      const nyit = doboz2.hidden;
      doboz2.hidden = !nyit; gomb.setAttribute('aria-expanded', String(nyit));
      if (nyit && !doboz2.innerHTML) utcaTabla(lista, doboz2);
    });
  }
  function utcaTabla(lista, hova) {
    // Csak a kiválasztott év árai, hogy a sorrend összevethető legyen
    const i = Math.min(S.ix, valodi);
    const sorok = lista.filter((l) => l[1][i] != null).map((l) => [l[0], [l[1][i], l[2][i]]]).sort((a, b) => b[1][0] - a[1][0]);
    hova.innerHTML = `<label class="tk-utca-szuro"><span class="sr">Utca keresése</span><input type="search" placeholder="Utca keresése"></label><div class="tk-utca-lista"><table><thead><tr><th scope="col">Utca</th><th scope="col">Ft/m², ${evek[i]}</th><th scope="col">Adásvétel</th></tr></thead><tbody></tbody></table></div><p class="kicsi halk">${evBan(evek[i])} ${sorok.length} utcában volt legalább három adásvétel.${S.ix === MA ? ' Utcánként nincs mai becslés, ezek a legutóbbi valódi eladási árak.' : ''} Másik évhez állítsd át a csúszkát.</p>`;
    const tb = hova.querySelector('tbody'), sz = hova.querySelector('input');
    const rajz = () => {
      const q = sz.value.trim().toLowerCase();
      tb.innerHTML = sorok.filter(([n]) => !q || n.toLowerCase().includes(q)).slice(0, 300).map(([n, [ar, db]]) => `<tr><th scope="row">${esc(n)}</th><td>${fmt(ar * 1000)}</td><td>${fmt(db || 0)}</td></tr>`).join('');
    };
    sz.addEventListener('input', rajz);
    rajz();
  }

  // ---- kezelők
  el.querySelectorAll('[data-mutato]').forEach((b) => b.addEventListener('click', () => {
    S.mutato = b.dataset.mutato;
    el.querySelectorAll('[data-mutato]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    fest();
  }));
  el.querySelector('[data-tipus]').addEventListener('change', (e) => { S.tipus = e.target.value; fest(); });
  csuszka.addEventListener('input', () => { megall(); S.ix = evek.indexOf(Number(csuszka.value)); fest(); });

  function megall() {
    if (!S.jatszik) return;
    clearInterval(S.jatszik); S.jatszik = null;
    el.classList.remove('tk-jatszik');
    jatszo.querySelector('span').textContent = `Lejátszás ${evek[0]}-tól`;
  }
  jatszo.addEventListener('click', () => {
    if (S.jatszik) return megall();
    el.classList.add('tk-jatszik');
    jatszo.querySelector('span').textContent = 'Megállítás';
    S.ix = 0; fest();
    S.jatszik = setInterval(() => {
      if (S.ix >= utolso) return megall();
      S.ix++; fest();
      if (!LASSU) { cimke.classList.remove('tk-villan'); void cimke.offsetWidth; cimke.classList.add('tk-villan'); }
    }, LASSU ? 700 : LEPES_MS);
  });

  // ---- kereső
  const nevek = Object.entries(A.egysegek).map(([k, u]) => [u.n, k]).sort((a, b) => a[0].localeCompare(b[0], 'hu'));
  el.querySelector('#tk-nevek').innerHTML = nevek.map(([n]) => `<option value="${esc(n)}">`).join('');
  const kereso = el.querySelector('[data-kereso]');
  const keres = () => {
    const q = kereso.value.trim().toLowerCase();
    const t = nevek.find(([n]) => n.toLowerCase() === q) || (q.length > 2 && nevek.find(([n]) => n.toLowerCase().startsWith(q)));
    if (t) valaszt(t[1], true);
  };
  kereso.addEventListener('change', keres);
  kereso.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); keres(); } });

  // ---- előre beállított mutató: ?mutato=evek | valt
  const kert = new URLSearchParams(location.search).get('mutato');
  if (kert && HATAR[kert]) { S.mutato = kert; el.querySelectorAll('[data-mutato]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.mutato === kert))); if (el.classList.contains('tk-kesz')) fest(); }

  // ---- megosztott link: #Településnév
  if (location.hash.length > 1) {
    const n = decodeURIComponent(location.hash.slice(1));
    const t = nevek.find(([x]) => x === n);
    if (t) setTimeout(() => valaszt(t[1], false), LASSU ? 0 : 400);
  }
}
