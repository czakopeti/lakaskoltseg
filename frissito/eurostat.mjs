// Eurostat: a lakásár és a háztartási jövedelem aránya (Standardised house price-to-income ratio, tipsho60), Magyarország.
// JSON-stat 2.0 formátum, évente frissül. A gépi letöltést a GitHub Actions végzi (frissito/automata.mjs).
export const ARJOV = {
  url: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tipsho60?geo=HU&lang=en',
  oldal: 'https://ec.europa.eu/eurostat/databrowser/view/tipsho60/default/table',
  nev: 'Eurostat: Standardised house price-to-income ratio (tipsho60)',
};

/** JSON-stat → { frissitve, evek, lt (hosszú távú átlag = 100), i25 (2025 = 100 vagy az aktuális bázis), bazis, becsult: {ev: 'p'|'e'} } */
export function arJovFeldolgoz(j) {
  const dim = j.dimension, ids = j.id, size = j.size;
  const idx = (d) => dim[d].category.index;
  const evek = Object.entries(idx('time')).sort((a, b) => a[1] - b[1]).map(([e]) => Number(e));
  const egysegek = idx('unit');
  const lepes = (d) => ids.slice(ids.indexOf(d) + 1).reduce((s, x) => s * size[ids.indexOf(x)], 1);
  const pos = (unit, ti) => egysegek[unit] * lepes('unit') + ti * lepes('time');
  const bazisKod = Object.keys(egysegek).find((u) => /^PTIR_I\d+$/.test(u));
  const sor = (u) => (u in egysegek ? evek.map((_, ti) => j.value[pos(u, ti)] ?? null) : null);
  const lt = sor('PTIR_LT_AVG');
  const becsult = {};
  if (lt) evek.forEach((e, ti) => { const s = j.status?.[pos('PTIR_LT_AVG', ti)]; if (s) becsult[e] = s; });
  return { frissitve: String(j.updated || '').slice(0, 10), evek, lt, bazisEv: bazisKod ? 2000 + Number(bazisKod.slice(6)) : null, ib: bazisKod ? sor(bazisKod) : null, becsult };
}

export function arJovHiheto(regi, uj) {
  if (!uj?.lt) return 'nincs benne a hosszú távú átlaghoz mért sor (PTIR_LT_AVG)';
  const ertek = uj.lt.filter((v) => v != null);
  if (ertek.length < 15) return `csak ${ertek.length} év van benne`;
  if (ertek.some((v) => v < 30 || v > 300)) return 'valószínűtlen érték a sorban';
  if (regi && regi.evek.at(-1) > uj.evek.at(-1)) return `az utolsó év ${uj.evek.at(-1)}, korábban ${regi.evek.at(-1)} volt`;
  return null;
}
