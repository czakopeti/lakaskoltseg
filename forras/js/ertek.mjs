// „Mennyit ér a lakásom?”: sávos becslés a KSH Ingatlanadattár utcai és települési átlagaiból.
// Az adat ugyanaz, mint a lakásár-térképé (/adatok/lakasarak/), a számítás a szamitas.mjs lakasErtek függvénye.
import { lakasErtek } from './szamitas.mjs';
import { fmt, tized, meres } from './megjelenites.mjs';

const doboz = document.querySelector('[data-ertek]');
if (doboz) indit(doboz).catch((e) => {
  const ki = doboz.querySelector('.elsz-tartalom');
  if (ki) ki.innerHTML = `<p class="elsz-ures">Az adatokat most nem sikerült betölteni (${esc(e.message || e)}). Próbáld újra később.</p>`;
});

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^(budapest|bp\.?)[\s,]+/, '').replace(/\s+/g, ' ').trim();
const ROMAI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII'];
// A kerületek közismert nevei, hogy „Újbuda” vagy „Zugló” is működjön
const KERNEV = { I: 'Várkerület', III: 'Óbuda-Békásmegyer', IV: 'Újpest', V: 'Belváros-Lipótváros', VI: 'Terézváros', VII: 'Erzsébetváros', VIII: 'Józsefváros', IX: 'Ferencváros', X: 'Kőbánya', XI: 'Újbuda', XII: 'Hegyvidék', XIII: 'Angyalföld, Újlipótváros', XIV: 'Zugló', XV: 'Rákospalota, Pestújhely, Újpalota', XVII: 'Rákosmente', XVIII: 'Pestszentlőrinc-Pestszentimre', XIX: 'Kispest', XX: 'Pesterzsébet', XXI: 'Csepel', XXII: 'Budafok-Tétény', XXIII: 'Soroksár' };
const MAS_NEV = { obuda: 'III', bekasmegyer: 'III', ujlipotvaros: 'XIII', angyalfold: 'XIII', rakospalota: 'XV', ujpalota: 'XV', pestszentlorinc: 'XVIII', pestszentimre: 'XVIII', lipotvaros: 'V', belvaros: 'V', budafok: 'XXII', varnegyed: 'I' };
for (const [r, n] of Object.entries(KERNEV)) for (const x of n.split(/,\s*/)) MAS_NEV[norm(x)] = r;
/** „11”, „11. ker”, „XI”, „xi. kerület”, „Újbuda” → „XI”; különben null. */
export function kerulet(v) {
  const s = norm(v).replace(/\s*(\.|\bker\b\.?|\bkerulet\b)\s*/g, ' ').trim();
  if (MAS_NEV[s]) return MAS_NEV[s];
  if (/^\d{1,2}$/.test(s) && +s >= 1 && +s <= 23) return ROMAI[+s - 1];
  const r = s.toUpperCase();
  return ROMAI.includes(r) ? r : null;
}
const millio = (ft) => `${tized(ft / 1e6, ft >= 1e8 ? 0 : 1)} millió Ft`;
const TIPUS = { t: 'társasházi lakás', p: 'panellakás', h: 'családi ház', o: 'lakóingatlan' };

// Az adatfájlok egy napig cache-elhetők, ezért az adat változásakor új ?v= kerül az URL-re
async function json(url) {
  const v = document.querySelector('[data-adat-v]')?.dataset.adatV;
  const r = await fetch(v ? `${url}?v=${v}` : url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function indit(el) {
  const alap = el.dataset.alap, telepUt = el.dataset.telepUt || '/lakasarak/';
  const form = el.querySelector('form'), ki = el.querySelector('.elsz-tartalom');
  const iTelep = form.querySelector('#e-telep'), iUtca = form.querySelector('#e-utca'), iTipus = form.querySelector('#e-tipus'), iM2 = form.querySelector('#e-m2');
  const lTelep = form.querySelector('#e-telep-lista'), lUtca = form.querySelector('#e-utca-lista'), sugo = form.querySelector('[data-utca-sugo]');
  const A = await json(`${alap}arak.json`);
  // Név → kód. A kerületeket „XI. kerület” alakban is felismerjük.
  const nevek = new Map();
  const opciok = [];
  for (const [kod, u] of Object.entries(A.egysegek)) {
    if (!u.s?.o?.some((v) => v != null)) continue;
    nevek.set(norm(u.n), kod);
    opciok.push(u.n);
  }
  opciok.sort((x, y) => x.localeCompare(y, 'hu'));
  lTelep.innerHTML = opciok.map((n) => `<option value="${esc(n)}">`).join('');
  const utcaCache = new Map();
  const utcakMegye = (m) => { if (!utcaCache.has(m)) utcaCache.set(m, json(`${alap}utcak/${m}.json`).catch(() => ({}))); return utcaCache.get(m); };

  // Név (vagy kerületszám, kerületnév) → kód
  function keres(v) {
    const n = norm(v);
    if (nevek.has(n)) return nevek.get(n);
    const r = kerulet(v);
    return r ? nevek.get(norm(`${r}. kerület`)) || null : null;
  }
  const csakBudapest = (v) => /^(budapest|bp\.?)$/.test(String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
  // Javaslatok, ha a beírt név nem pontos: ami ezzel kezdődik, utána ami tartalmazza
  function javaslatok(v) {
    const n = norm(v);
    if (n.length < 2) return [];
    const kezd = opciok.filter((o) => norm(o).startsWith(n)), benne = opciok.filter((o) => !norm(o).startsWith(n) && norm(o).includes(n));
    return [...kezd, ...benne].slice(0, 8);
  }

  let kod = null, utcak = [];
  async function telepValt() {
    const uj = keres(iTelep.value);
    if (uj && norm(iTelep.value) !== norm(A.egysegek[uj].n)) iTelep.value = A.egysegek[uj].n;
    if (uj === kod) return;
    kod = uj; utcak = [];
    iUtca.value = ''; lUtca.innerHTML = '';
    iUtca.disabled = !kod;
    iUtca.placeholder = kod ? 'pl. Kossuth Lajos utca' : 'előbb a települést add meg';
    if (!kod) return;
    const u = A.egysegek[kod];
    utcak = (await utcakMegye(u.m))[kod] || [];
    lUtca.innerHTML = utcak.map((x) => `<option value="${esc(x[0])}">`).join('');
    sugo.textContent = utcak.length ? `${fmt(utcak.length)} utcáról van adat. Csak azok az utcák szerepelnek, ahol a KSH közölt árat.` : 'Itt a KSH nem közöl utcai árat, a település átlagával számolunk.';
    if (!utcak.length) { iUtca.disabled = true; iUtca.placeholder = 'ehhez a településhez nincs utcai adat'; }
  }

  function utcaNev() {
    const v = norm(iUtca.value);
    if (!v) return null;
    return utcak.find((x) => norm(x[0]) === v)?.[0] || false;
  }

  const valaszto = (cim, nevekL) => `<div class="ev-valaszto"><p>${cim}</p><div class="ev-gombsor">${nevekL.map(([ertek, felirat]) => `<button type="button" class="ev-valaszt" data-telep="${esc(ertek)}">${felirat}</button>`).join('')}</div></div>`;
  const kerValaszto = () => valaszto('Budapesten kerületenként nagyon mások az árak. Melyik kerületben van a lakás?', ROMAI.map((r) => [`Budapest ${r}. kerület`, `<b>${r}.</b>${KERNEV[r] ? ` <span>${esc(KERNEV[r])}</span>` : ''}`]).filter(([n]) => nevek.has(norm(n))));

  // Mobilon az eredmény az űrlap alatt van: a választót oda kell görgetni, különben észre sem veszi
  const mutat = () => { if (window.matchMedia('(max-width: 900px)').matches) ki.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  // kerdez: a gombra kattintva (vagy Enterre) a hiányzó mezőre ugrunk és megmondjuk, mi kell még
  function szamol(kerdez = false) {
    const m2 = Number(String(iM2.value).replace(',', '.'));
    if (iTelep.value || iM2.value) meres('indit');
    if (!kod) {
      if (csakBudapest(iTelep.value)) { ki.innerHTML = kerValaszto(); mutat(); return; }
      if (iTelep.value) {
        const j = javaslatok(iTelep.value);
        ki.innerHTML = j.length ? valaszto('Erre gondoltál?', j.map((n) => [n, esc(n)])) : '<p class="elsz-ures">Ezt a települést nem találjuk. Ellenőrizd a nevét. Ahol egy évben sem volt legalább három adásvétel, ott a KSH nem közöl árat.</p>';
        mutat();
      } else ki.innerHTML = '<p class="elsz-ures">Kezdd a településsel vagy a budapesti kerülettel (például „Debrecen” vagy „XI. kerület”).</p>';
      if (kerdez) iTelep.focus();
      return;
    }
    if (!(m2 >= 10)) {
      ki.innerHTML = `<p class="elsz-ures">${iM2.value ? 'Az alapterület legalább 10 m² legyen.' : `${esc(A.egysegek[kod].n)} megvan. Már csak az alapterület hiányzik: hány négyzetméteres a lakás?`}</p>`;
      if (kerdez) iM2.focus();
      return;
    }
    const un = utcaNev();
    const e = lakasErtek(A, utcak, { kod, utca: un || null, tipus: iTipus.value, m2 });
    if (!e) { ki.innerHTML = '<p class="elsz-ures">Ehhez a településhez az elmúlt három évből nincs elég adat a becsléshez.</p>'; return; }
    if (un === false) e.megjegyzes.unshift('Ezt az utcát nem találjuk a listában, ezért a település átlagával számoltunk.');
    e.utcaNev = un;
    ki.innerHTML = kimenet(e, A, telepUt, kod);
    meres('kesz');
    const q = new URLSearchParams({ t: kod, ...(un ? { u: un } : {}), tipus: iTipus.value, m2: String(m2) });
    history.replaceState(null, '', `?${q}`);
  }

  // Megosztott link: ?t=<kód>&u=<utca>&tipus=&m2=
  const p = new URLSearchParams(location.search);
  if (p.get('t') && A.egysegek[p.get('t')]) {
    iTelep.value = A.egysegek[p.get('t')].n;
    await telepValt();
    if (p.get('u')) iUtca.value = p.get('u');
    if (p.get('tipus') && TIPUS[p.get('tipus')]) iTipus.value = p.get('tipus');
    if (p.get('m2')) iM2.value = p.get('m2');
    szamol();
  }

  // PDF: a böngésző nyomtatás/mentés PDF-be funkciója, a nyomtatási stílus csak a becslést és a forrásokat hagyja meg
  ki.addEventListener('click', async (ev) => {
    const pdf = ev.target.closest('[data-ev-pdf]'), masol = ev.target.closest('[data-ev-masol]');
    if (pdf) {
      meres('nyomtat');
      ki.querySelectorAll('details').forEach((d) => { d.open = true; });
      const regi = document.title;
      const u = A.egysegek[kod];
      document.title = `Ingatlanmérleg becslés - ${u ? u.n : ''}${utcaNev() ? ` ${utcaNev()}` : ''} ${iM2.value} m2`.replace(/\s+/g, ' ').trim();
      window.print();
      setTimeout(() => { document.title = regi; }, 1000);
    }
    if (masol) {
      meres('megosztas');
      try { await navigator.clipboard.writeText(location.href); masol.textContent = 'Kimásolva'; } catch { masol.textContent = location.href; }
      setTimeout(() => { masol.textContent = 'Link másolása'; }, 2500);
    }
  });

  iTelep.addEventListener('change', async () => { await telepValt(); szamol(); });
  iTelep.addEventListener('input', async () => { if (nevek.has(norm(iTelep.value))) { await telepValt(); szamol(); } });
  for (const i of [iUtca, iTipus, iM2]) { i.addEventListener('input', szamol); i.addEventListener('change', szamol); }
  form.addEventListener('submit', (ev) => { ev.preventDefault(); szamol(true); });
  // Kerület- vagy településválasztó gombok az eredmény helyén
  ki.addEventListener('click', async (ev) => {
    const g = ev.target.closest('[data-telep]');
    if (!g) return;
    iTelep.value = g.dataset.telep;
    await telepValt();
    szamol();
    if (!(Number(String(iM2.value).replace(',', '.')) >= 10)) iM2.focus();
  });
}

function sav(e) {
  const s = e.sav, min = s[0.1], max = s[0.9], w = max - min || 1;
  const x = (v) => ((v - min) / w) * 100;
  return `<div class="ev-sav" aria-hidden="true">
<div class="ev-sav-vonal"></div>
<div class="ev-sav-doboz" style="left:${x(s[0.25]).toFixed(1)}%;width:${(x(s[0.75]) - x(s[0.25])).toFixed(1)}%"></div>
<div class="ev-sav-jel" style="left:${x(s[0.5]).toFixed(1)}%"></div>
</div>
<div class="ev-sav-cimkek" aria-hidden="true"><span>${millio(min)}</span><span>${millio(max)}</span></div>`;
}

function kimenet(e, A, telepUt, kod) {
  const s = e.sav;
  const oldal = A.oldalak?.[kod];
  const hol = e.hol === 'utca'
    ? `Az utca ${fmt(e.utca.db)} eladásából (${e.utca.evek[0]}–${e.utca.evek.at(-1)}, átlagosan ${fmt(Math.round(e.utca.ar) * 1000)} Ft/m² ${A.evek.at(-1)}-es áron)${e.utca.suly < 0.9 ? `, a kevés eladás miatt ${Math.round((1 - e.utca.suly) * 100)}%-ban a település átlagával együtt` : ''}.`
    : `A település ${fmt(e.telepules.db)} ${TIPUS[e.tipus]}-eladásából (${e.telepules.evek[0]}–${e.telepules.evek.at(-1)}, átlagosan ${fmt(Math.round(e.telepules.ar) * 1000)} Ft/m² ${A.evek.at(-1)}-es áron).`;
  return `<div class="ev-fo">
<p class="ev-cim">${esc(e.nev)}${e.hol === 'utca' ? `, ${esc(e.utcaNev)}` : ''}: egy ${fmt(e.m2)} m²-es ${TIPUS[e.tipus]} ma körülbelül</p>
<p class="ev-szam">${millio(s[0.5])}</p>
<p class="ev-al">${fmt(e.m2ar)} Ft/m², ${esc(e.cimke)}</p>
</div>
${sav(e)}
<ul class="ev-lista">
<li>A hasonló lakások <strong>fele</strong> ${millio(s[0.25])} és ${millio(s[0.75])} között kel el.</li>
<li><strong>Tízből nyolc</strong> ${millio(s[0.1])} és ${millio(s[0.9])} között.</li>
<li>Jó állapotú, felújított lakásnál inkább a sáv felső, felújítandónál az alsó részére számíts.</li>
</ul>
<details class="ev-reszlet"><summary>Miből számoltuk?</summary>
<p>${hol}</p>
<p>${e.szorzo !== 1 ? `A ${A.evek.at(-1)}-es árat a KSH lakásárindexeivel hoztuk a mai szintre (${esc(e.cimke)}): ${tized((e.szorzo - 1) * 100, 0)}%-os drágulás.` : `Ez a ${A.evek.at(-1)}-es árszint, frissebb árindex nincs hozzá.`}</p>
${e.megjegyzes.map((m) => `<p>${esc(m)}</p>`).join('')}
${oldal ? `<p><a href="${telepUt.replace(/lakasarak\/$/, '')}${oldal}">${esc(e.nev)}: lakásárak évenként és utcánként</a></p>` : ''}
</details>
<div class="ev-gombok csak-kepernyo"><button type="button" class="gomb" data-ev-pdf>Letöltés PDF-ben</button><button type="button" class="szoveg-gomb" data-ev-masol>Link másolása</button></div>
<p class="csak-nyomtatas ev-labjegy">Készült: ${new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })} A becslés újra megnyitható ezen a címen: ${esc(location.origin + location.pathname)}?${esc(decodeURIComponent(new URLSearchParams({ t: kod, ...(e.utcaNev ? { u: e.utcaNev } : {}), tipus: e.tipus, m2: String(e.m2) }).toString()).replace(/\+/g, ' '))}</p>`;
}
