// Böngészős réteg: menü, űrlapok, élő elszámolás, megosztható link.
// Szerverre csak az megy, amit a látogató a visszajelzés-dobozban maga elküld.
import * as S from './szamitas.js?v=961a3832';
import * as M from './megjelenites.js?v=961a3832';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const csendes = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tarolo = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* */ } },
};

/* ---------- Névtelen mérés ---------- */
// Csak darabszámok: melyik oldalon hányan kezdtek bele és jutottak eredményig, mentettek, osztottak meg.
// Se süti, se azonosító, se a beírt adatok; a böngészőben sem tárolunk hozzá semmit. Oldalbetöltésenként egy esemény egyszer.
const elkuldve = new Set();
function meres(esemeny) {
  if (elkuldve.has(esemeny) || location.protocol !== 'https:') return;
  elkuldve.add(esemeny);
  try { fetch('/api/meres', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ut: location.pathname, esemeny }) }).catch(() => {}); } catch { /* */ }
}
document.addEventListener('click', (ev) => { if (ev.target.closest?.('nav.tovabb a')) meres('tovabb'); });

/* ---------- Menü ---------- */
// Balról beúszó panel. A <dialog> kezeli a fókuszt és az Esc-et; a háttérre kattintva is bezárul.
const fg = $('.fiok-gomb'), fiok = $('#fiok');
if (fg && fiok?.showModal) {
  const zar = () => { fiok.classList.add('zarul'); setTimeout(() => { fiok.close(); fiok.classList.remove('zarul'); }, csendes ? 0 : 180); };
  fg.addEventListener('click', () => { fiok.showModal(); fg.setAttribute('aria-expanded', 'true'); });
  fiok.addEventListener('close', () => { fg.setAttribute('aria-expanded', 'false'); fg.focus(); });
  $('.fiok-zar', fiok)?.addEventListener('click', zar);
  fiok.addEventListener('click', (ev) => { if (ev.target === fiok) zar(); });
  fiok.addEventListener('cancel', (ev) => { ev.preventDefault(); zar(); });
}

/* ---------- A főoldal makettje: a szélességhez igazodik, és az egérrel finoman forgatható ---------- */
const szin = $('[data-makett]');
if (szin) {
  const meretez = () => szin.style.setProperty('--k', Math.min(1, szin.clientWidth / 620).toFixed(3));
  meretez();
  if ('ResizeObserver' in window) new ResizeObserver(meretez).observe(szin);
  if (!csendes && matchMedia('(hover: hover)').matches) {
    szin.addEventListener('pointermove', (ev) => {
      const r = szin.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
      szin.style.setProperty('--rz', `${(-34 + x * 22).toFixed(1)}deg`);
      szin.style.setProperty('--rx', `${(58 - y * 10).toFixed(1)}deg`);
    });
    szin.addEventListener('pointerleave', () => { szin.style.removeProperty('--rz'); szin.style.removeProperty('--rx'); });
  }
}

/* ---------- Űrlap-segédek ---------- */
/** 180000000 → „180 000 000” (nem törő szóközzel, ahogy az eredményben is). */
const ezresen = (v) => String(v ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
/** Gépelés közben tagol, és a kurzor ugyanannyi számjegy után marad, ahol volt. */
function ezresMezo(el) {
  el.addEventListener('input', () => {
    const elotte = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/\D/g, '').length;
    const uj = ezresen(el.value);
    if (uj === el.value) return;
    el.value = uj;
    let poz = 0, db = 0;
    while (poz < uj.length && db < elotte) { if (/\d/.test(uj[poz])) db++; poz++; }
    try { el.setSelectionRange(poz, poz); } catch { /* */ }
  });
  if (el.value) el.value = ezresen(el.value);
}

function ertekek(form) {
  const o = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; else o[el.name] ??= ''; }
    else if (el.type === 'checkbox') o[el.name] = el.checked;
    else o[el.name] = el.dataset.ezres !== undefined ? el.value.replace(/\D/g, '') : el.value.trim();
  }
  return o;
}
function beallit(form, e) {
  for (const [k, v] of Object.entries(e)) {
    const els = form.elements[k];
    if (!els) continue;
    for (const el of els instanceof RadioNodeList ? [...els] : [els]) {
      if (el.type === 'radio') el.checked = el.value === String(v);
      else if (el.type === 'checkbox') el.checked = v === true || v === '1';
      else el.value = el.dataset.ezres !== undefined ? ezresen(v) : v;
    }
  }
}
function lathatosag(form) {
  const e = ertekek(form);
  $$('[data-mutat]', form).forEach((el) => {
    el.hidden = !el.dataset.mutat.split('|').some((f) => {
      const [k, v] = f.split('=');
      return v === undefined ? e[k] === true : String(e[k]) === v;
    });
  });
}
function urlbe(form) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(ertekek(form))) if (v !== '' && v !== false) p.set(k, v === true ? '1' : v);
  try { history.replaceState(null, '', `${location.pathname}${[...p.keys()].length ? `?${p}` : ''}`); } catch { /* beágyazott nézet */ }
}
function urlbol() {
  const p = new URLSearchParams(location.search);
  if (![...p.keys()].length) return null;
  const o = {};
  for (const [k, v] of p) o[k] = v === '1' ? true : v;
  return o;
}
const szam = (v) => (v === '' || v == null ? NaN : Number(String(v).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')));

/* ---------- Élő elszámolás ---------- */
let elozoOsszeg = null;
function frissit(panel, html, valtozott) {
  // Ha semmi nem változott (például a mező elhagyásakor jövő „change” az „input” után), nem rajzoljuk újra:
  // különben az épp kattintott link (Következő lépés, forrásjelölés) kicserélődne a kattintás alatt.
  if (panel._utolso === html) return;
  // Az első kirajzolás után a belépő animációk (lépcső) nem játszódnak újra minden billentyűnél
  if (panel._utolso !== undefined) panel.classList.add('nyugodt');
  panel._utolso = html;
  panel.innerHTML = html;
  const kesz = !panel.querySelector('.ures');
  const pecset = $('.pecset');
  // SVG-n nincs .hidden tulajdonság, ezért az attribútumot kezeljük
  if (pecset && kesz && pecset.hasAttribute('hidden')) { pecset.removeAttribute('hidden'); if (!csendes) pecset.classList.add('ut'); }
  $$('.g-vonal', panel).forEach((v) => !csendes && v.classList.add('rajzol'));
  const m = $('[data-osszeg]', panel);
  const mini = $('.mini');
  if (!m) { elozoOsszeg = null; if (mini) mini.dataset.van = ''; return; }
  const cel = Number(m.dataset.osszeg);
  if (valtozott && !mintaMutat && elozoOsszeg !== null && elozoOsszeg !== cel) {
    m.closest('.vegosszeg')?.classList.add('villan');
    if (!csendes) {
      const span = $('.ertek', m), tol = elozoOsszeg, t0 = performance.now();
      const lep = (t) => { const x = Math.min(1, (t - t0) / 380); span.textContent = M.fmt(tol + (cel - tol) * (1 - (1 - x) ** 3)); if (x < 1) requestAnimationFrame(lep); };
      requestAnimationFrame(lep);
    }
  }
  elozoOsszeg = cel;
  if (mini && mintaMutat) mini.dataset.van = '';
  else if (mini) { mini.dataset.van = '1'; $('.mi', mini).textContent = $('.vegosszeg .mi', panel)?.textContent || ''; $('.mennyi', mini).textContent = `${M.fmt(cel)} Ft`; }
}

const ures = (e, mezok) => mezok.every((k) => e[k] === '' || e[k] == null);

/* ---------- Kalkulátorok ---------- */
// Minden kalkulátor egy függvény: (adat, e, form) → az elszámolás HTML-je. A kulcs a form data-kalk értéke.
// Üres űrlapnál címkézett mintát mutat (mintaMutat = true), a látogató adatai soha nincsenek előre kitöltve.
let mintaMutat = false;
// A kalkulátorok az M.KALKULATOROK közös leírásából: ugyanaz számol az építéskor (minta) és itt.
const KALK = Object.fromEntries(Object.keys(M.KALKULATOROK).map((t) => [t, (adat, e) => { const r = M.kalkHtml(t, adat, e); mintaMutat = r.minta; return r.html; }]));

/* ---------- Határidő a naptárba: a böngésző készíti a fájlt, hozzánk nem jut el semmi ---------- */
document.addEventListener('click', (ev) => {
  const g = ev.target.closest?.('[data-naptar], [data-naptar-lista]');
  if (!g) return;
  meres('naptar');
  const kozos = { azonosito: g.closest('[data-kalk-nev]')?.dataset.kalkNev || 'hatarido', host: location.hostname || 'lakaskoltseg' };
  const fajl = S.naptarFajl(g.dataset.naptarLista ? { ...kozos, esemenyek: JSON.parse(g.dataset.naptarLista) } : { ...kozos, nap: g.dataset.naptar, cim: g.dataset.naptarCim, leiras: g.dataset.naptarLeiras });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([fajl], { type: 'text/calendar;charset=utf-8' }));
  a.download = 'hatarido.ics';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

/* ---------- A pecsét a források oldalára visz ---------- */
function pecsetLink() {
  const p = $('.pecset'), cel = $('.lablec a[href*="forrasok"]')?.href;
  if (!p || !cel) return;
  const menj = () => { location.href = cel; };
  p.addEventListener('click', menj);
  p.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); menj(); } });
}
pecsetLink();
// A jelölések linkjei a források oldalára mutatnak, a lábléc linkjéből vesszük a pontos címet.
M.forrasokHelye($('.lablec a[href*="forrasok"]')?.getAttribute('href'));

/* ---------- Hibajelzés: a levélbe a beírt adatok és az eredmény is bekerül ---------- */
/** Az eredménypanel fő sora szövegként (a hibajelzéshez), vagy üres, ha nincs eredmény. */
function eredmenySzoveg() {
  const panel = $('.elsz-tartalom');
  if (!panel) return '';
  const mi = $('.vegosszeg .mi', panel)?.textContent, ertek = $('[data-osszeg] .ertek', panel)?.textContent;
  return mi && ertek ? `${mi}: ${ertek} Ft` : '';
}
const vanMinta = () => Boolean($('.elsz-tartalom .minta-jelzes'));
$('[data-hibajelzes]')?.addEventListener('click', (ev) => {
  const a = ev.currentTarget, cim = a.dataset.cim;
  const e = eredmenySzoveg();
  const torzs = e
    ? `Szerintem ez az eredmény hibás:\n${e}${vanMinta() ? '\n(Ez a minta eredménye volt.)' : ''}\n\nAz oldal a beírt adatokkal:\n${location.href}\n\nMit vártál volna, és miért?\n`
    : `Visszajelzés erről az oldalról:\n${location.href}\n\n`;
  a.href = `mailto:${cim}?subject=${encodeURIComponent(`${e ? 'Hibás összeg' : 'Visszajelzés'}: ${document.title}`)}&body=${encodeURIComponent(torzs)}`;
});

/* ---------- Visszajelzés: Igen / Nem, és Nem után pár szó ---------- */
// A szavazatot ebben a böngészőben megjegyezzük, hogy kétszer ne számoljuk. Név, IP-cím nem megy.
// Azok a kalkulátorok, amelyeknek az adatai nem kerülhetnek linkbe vagy visszajelzésbe (például név, cím, helyrajzi szám).
const NEM_KULDHETO = [];
function visszajelzes() {
  const d = $('[data-visszajelzes]');
  if (!d) return;
  const ut = d.dataset.ut, kulcs = `vj:${ut}`;
  const urlap = $('.vj-urlap', d), allapot = $('.vj-allapot', d), gombok = $$('[data-vj]', d);
  const kuld = async (b) => {
    const r = await fetch('/api/visszajelzes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ut, ...b }) });
    if (!r.ok) throw new Error(String(r.status));
  };
  const jelol = (ertek) => gombok.forEach((g) => g.setAttribute('aria-pressed', String(g.dataset.vj === ertek)));
  const levelLink = d.dataset.email ? ` vagy írj nekünk: <a href="mailto:${d.dataset.email}">${d.dataset.email}</a>` : '';
  const volt = tarolo.get(kulcs);
  if (volt) jelol(volt);
  gombok.forEach((g) => g.addEventListener('click', () => {
    const ertek = g.dataset.vj;
    if (tarolo.get(kulcs) !== ertek) { kuld({ ertek }).catch(() => {}); tarolo.set(kulcs, ertek); }
    jelol(ertek);
    if (ertek === 'fel') { urlap.hidden = true; allapot.textContent = 'Köszönjük, hogy jelezted!'; }
    else { urlap.hidden = false; allapot.textContent = ''; urlap.elements.szoveg.focus(); }
  }));
  urlap.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const szoveg = urlap.elements.szoveg.value.trim();
    if (szoveg.length < 3) { allapot.textContent = 'Írj pár szót arról, mi nem stimmel.'; urlap.elements.szoveg.focus(); return; }
    const b = { ertek: 'szoveg', szoveg, cim: document.title, web: urlap.elements.web.value };
    const f = $('form[data-kalk]');
    if (urlap.elements.adatok?.checked && f && !NEM_KULDHETO.includes(f.dataset.kalk)) {
      b.adatok = Object.fromEntries(Object.entries(ertekek(f)).filter(([, v]) => v !== '' && v !== false));
      b.eredmeny = eredmenySzoveg();
      b.minta = vanMinta();
    }
    const gomb = $('button[type="submit"]', urlap);
    gomb.disabled = true; gomb.textContent = 'Küldöm…';
    try {
      await kuld(b);
      urlap.reset(); urlap.hidden = true;
      allapot.textContent = 'Megkaptuk, köszönjük! Átnézzük, és ha hibát találunk, kijavítjuk.';
    } catch {
      allapot.innerHTML = `Most nem sikerült elküldeni. Próbáld újra kicsit később,${levelLink || ' köszönjük a türelmet'}.`;
    } finally { gomb.disabled = false; gomb.textContent = 'Elküldöm'; }
  });
}
visszajelzes();

/* ---------- Megosztott link ---------- */
// Aki megosztott linket nyit, a küldő adataival látja a számítást. Ezt kiírjuk, és egy gombbal üresre állítható.
function megosztottJelzes(form) {
  const j = document.createElement('div');
  j.className = 'megosztva';
  j.setAttribute('role', 'note');
  j.innerHTML = '<p><strong>Ezt a számítást megosztották veled.</strong> A küldő adataival látod. Írd át a saját adataidra, vagy <button class="szoveg-gomb" type="button">kezdd üres űrlappal</button>.</p>';
  form.querySelector('.forgalmi-fej')?.after(j);
  const el = () => j.remove();
  $('button', j).addEventListener('click', () => {
    el();
    form.reset();
    try { history.replaceState(null, '', location.pathname); } catch { /* */ }
    form.dispatchEvent(new Event('input'));
    form.querySelector('input:not([type=hidden]), select')?.focus();
  });
  form.addEventListener('input', (ev) => { if (ev.isTrusted) el(); }, { once: false });
}

/* ---------- Indítás ---------- */
function indit() {
  const form = $('form[data-kalk]');
  if (!form) return;
  const tipus = form.dataset.kalk;
  if (!KALK[tipus]) return;
  const adat = JSON.parse($('#adat').textContent);
  const panel = $('.elsz-tartalom');
  $$('input[data-ezres]', form).forEach(ezresMezo);
  const u = urlbol();
  if (u) {
    beallit(form, u);
    if (u.megosztva) megosztottJelzes(form);
  }
  const utak = (() => { try { return JSON.parse($('#utak')?.textContent || '{}'); } catch { return {}; } })();
  // Csak valódi eredmény után (nem minta, nem hiányzó adat), a már beírt adatokkal.
  const kovetkezo = (html) => (mintaMutat || !html.includes('data-osszeg') ? '' : M.kovetkezoBlokk(S.kovetkezoLepesek(tipus, ertekek(form)), utak));
  panel?.addEventListener('click', (ev) => { if (ev.target.closest?.('[data-kovetkezo]')) meres('kovetkezo'); });
  const szamol = (valtozott) => {
    lathatosag(form);
    mintaMutat = false;
    const html = KALK[tipus](adat, ertekek(form), form);
    frissit(panel, html + kovetkezo(html), valtozott);
    // Eredményig jutott: valódi (nem minta) összeg látszik, és előtte maga írt be valamit
    if (valtozott && elkuldve.has('indit') && !mintaMutat && panel.querySelector('[data-osszeg]')) meres('kesz');
    if (valtozott && !NEM_KULDHETO.includes(tipus)) urlbe(form);
  };
  form.addEventListener('input', (ev) => { if (ev.isTrusted) meres('indit'); szamol(true); });
  form.addEventListener('change', (ev) => { if (ev.isTrusted) meres('indit'); szamol(true); });
  form.addEventListener('submit', (ev) => ev.preventDefault());
  szamol(false);
  $('[data-urit]')?.addEventListener('click', () => { form.reset(); szamol(true); });

  // Mobilon a lap alján is látszik az összeg, amíg az elszámolás nincs a képernyőn
  const mini = $('.mini'), elsz = $('.elszamolas');
  if (mini && elsz && 'IntersectionObserver' in window) {
    mini.hidden = false;
    new IntersectionObserver(([b]) => mini.classList.toggle('lathato', mini.dataset.van === '1' && !b.isIntersecting && b.boundingClientRect.top > 0), { threshold: 0.1 }).observe(elsz);
  }

  // Megosztás: a link a beírt adatokat viszi, és jelzi, hogy megosztott számítás. Telefonon a rendszer megosztó menüje.
  const masol = $('[data-masol]');
  const masolFelirat = masol?.textContent;
  masol?.addEventListener('click', async () => {
    meres('megosztas');
    let link = `${location.origin}${location.pathname}`;
    if (!NEM_KULDHETO.includes(tipus)) {
      urlbe(form);
      const cim = new URL(location.href);
      if (cim.search) cim.searchParams.set('megosztva', '1');
      link = cim.toString();
    }
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title: document.title, url: link }); return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(link); masol.textContent = 'Link a vágólapon, beillesztheted'; }
    catch { masol.textContent = 'Másold ki a címsorból'; }
    setTimeout(() => (masol.textContent = masolFelirat), 2600);
  });
  $$('[data-nyomtat]').forEach((g) => g.addEventListener('click', () => { meres('nyomtat'); try { print(); } catch { /* */ } }));
}

indit();
