// „Mennyit ér a lakásom?”: sávos becslés a KSH Ingatlanadattár utcai és települési átlagaiból.
// Az adat ugyanaz, mint a lakásár-térképé (/adatok/lakasarak/), a számítás a szamitas.mjs lakasErtek függvénye.
import { lakasErtek } from './szamitas.mjs';
import { fmt, tized } from './megjelenites.mjs';

const doboz = document.querySelector('[data-ertek]');
if (doboz) indit(doboz).catch((e) => {
  const ki = doboz.querySelector('.elsz-tartalom');
  if (ki) ki.innerHTML = `<p class="elsz-ures">Az adatokat most nem sikerült betölteni (${esc(e.message || e)}). Próbáld újra később.</p>`;
});

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^budapest\s+/, '').replace(/\s+/g, ' ').trim();
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

  let kod = null, utcak = [];
  async function telepValt() {
    const uj = nevek.get(norm(iTelep.value)) || null;
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

  function szamol() {
    const m2 = Number(String(iM2.value).replace(',', '.'));
    if (!kod || !(m2 >= 10)) {
      ki.innerHTML = iTelep.value && !kod
        ? '<p class="elsz-ures">Ezt a települést nem találjuk. Válassz a listából. Ahol egy évben sem volt legalább három adásvétel, ott a KSH nem közöl árat.</p>'
        : '<p class="elsz-ures">Add meg a települést vagy kerületet és az alapterületet. Ha tudod az utcát is, pontosabb lesz.</p>';
      return;
    }
    const un = utcaNev();
    const e = lakasErtek(A, utcak, { kod, utca: un || null, tipus: iTipus.value, m2 });
    if (!e) { ki.innerHTML = '<p class="elsz-ures">Ehhez a településhez az elmúlt három évből nincs elég adat a becsléshez.</p>'; return; }
    if (un === false) e.megjegyzes.unshift('Ezt az utcát nem találjuk a listában, ezért a település átlagával számoltunk.');
    e.utcaNev = un;
    ki.innerHTML = kimenet(e, A, telepUt, kod);
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

  iTelep.addEventListener('change', async () => { await telepValt(); szamol(); });
  iTelep.addEventListener('input', async () => { if (nevek.has(norm(iTelep.value))) { await telepValt(); szamol(); } });
  for (const i of [iUtca, iTipus, iM2]) { i.addEventListener('input', szamol); i.addEventListener('change', szamol); }
  form.addEventListener('submit', (ev) => { ev.preventDefault(); szamol(); });
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
</details>`;
}
