// KSH-monitor, keresetek: járási (és budapesti kerületi) bruttó átlagkereset lakóhely szerint, az év elejétől kumulálva.
// A KSH negyedévente frissíti (2026. november 18-án: 2026. január–szeptember). Táblázatként nem közli,
// csak a térképes oldal szkriptjében van benne: a járások nevét a térkép-alakzatokból, az értékeket a térkép adataiból olvassuk ki.
export const KSHMON = {
  nev: 'KSH-monitor: járási szintű bruttó átlagkeresetek (lakóhely szerint)',
  oldal: 'https://www.ksh.hu/ksh-monitor/keresetek.html',
  url: 'https://www.ksh.hu/ksh-monitor/assets/charts.js',
};

/** A szkriptből: { idoszak: '2026. január–szeptember', ertek: { 'Budakeszi járás': 1063.2, ... } } (ezer Ft/fő/hó), vagy null. */
export function jarasKeresetFeldolgoz(js) {
  const i = js.indexOf('hu_districts_2019"] = ');
  if (i < 0) return null;
  const j = js.indexOf('];', i);
  const nevek = Object.fromEntries([...js.slice(i, j).matchAll(/"id":"(di\d+)"[^{}]*?"name":"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  // A térkép, amelynek a címe járási bruttó átlagkereset
  for (const m of js.matchAll(/Highcharts\.mapChart\("([\w-]+)"/g)) {
    const blokk = js.slice(m.index, js.indexOf('Highcharts.', m.index + 20) > 0 ? js.indexOf('Highcharts.mapChart', m.index + 20) : undefined);
    const cim = /title:\s*\{\s*text:\s*'([^']+)'/.exec(blokk)?.[1] || '';
    if (!/járási szintű bruttó átlagkereset/i.test(cim)) continue;
    const idoszak = /(\d{4}\. [a-zá-űé]+(?:–[a-zá-űé]+)?)/i.exec(cim)?.[1] || null;
    const ertek = {};
    for (const d of blokk.matchAll(/\{"id":"(di\d+)","value":([\d.]+)\}/g)) if (nevek[d[1]]) ertek[nevek[d[1]]] = Number(d[2]);
    return { idoszak, lakohely: /lakóhely/.test(blokk), ertek };
  }
  return null;
}

/** null, ha hihető: legalább 190 járás és kerület, értékek 150 és 3000 ezer Ft között, a medián 350 és 2000 között. */
export function jarasKeresetHiheto(x) {
  const v = Object.values(x?.ertek || {});
  if (v.length < 190) return `csak ${v.length} járás van benne`;
  if (v.some((e) => !(e > 150 && e < 3000))) return 'irreális érték van benne';
  const med = [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];
  if (med < 350 || med > 2000) return `furcsa a medián (${med} ezer Ft)`;
  if (!x.idoszak) return 'nem derül ki, melyik időszak';
  return null;
}
