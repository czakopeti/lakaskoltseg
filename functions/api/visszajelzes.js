// Visszajelzés-fogadó (Cloudflare Pages Function, címe: /api/visszajelzes).
//
// POST {ut, ertek: 'fel' | 'le'}                  → szavazat a számlálóba (KV: SZAVAZAT)
// POST {ut, ertek: 'szoveg', szoveg, cim, adatok} → GitHub-jegy „visszajelzes” címkével (GITHUB_TOKEN)
// GET                                             → az oldalankénti számlálók JSON-ban
//
// IP-címet és sütit nem tárolunk. A szövegből kitakarjuk az e-mail-címeket és a telefonszámokat,
// és naponta legfeljebb NAPI_KORLAT jegyet nyitunk, hogy egy támadás ne árassza el a postafiókot.
// Beállítás: README, „Visszajelzések” szakasz.

const NAPI_KORLAT = 30;
// Külön privát tároló: ez a tároló nyilvános, a látogatók szövege nem lehet az. A GITHUB_REPO változóval felülírható.
const ALAP_REPO = 'czakopeti/lakaskoltseg-visszajelzes';
// A saját domain bekötésekor ide kell felvenni (például lakasom\.hu|www\.lakasom\.hu).
const ENGEDETT = /^([a-z0-9-]+\.pages\.dev|localhost|127\.0\.0\.1)$/;

const valasz = (adat, status = 200) =>
  new Response(JSON.stringify(adat), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export const ervenyesUt = (ut) => typeof ut === 'string' && ut.length <= 80 && /^\/[a-z0-9\-/]*$/.test(ut) && !ut.includes('//');

/** E-mail-cím, magyar telefonszám és bankszámlaszám helyett [kitakarva]. Az árakhoz nem nyúl. */
export function kitakar(s) {
  return s
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[kitakarva]')
    .replace(/\d{8}[\s-]\d{8}([\s-]\d{8})?/g, '[kitakarva]')
    .replace(/(\+36|\b06)[\s\-/()]*\d{1,2}[\s\-/)]*\d{3}[\s-]?\d{3,4}\b/g, '[kitakarva]');
}

/** GitHubon ne legyen belőle @említés, HTML vagy táblázattörés. */
const semleges = (s) => s.replace(/@/g, '@​').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cella = (s) => semleges(String(s)).replace(/\|/g, '\\|').replace(/\s+/g, ' ');

export function tisztitAdatok(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return {};
  const o = {};
  for (const [k, v] of Object.entries(a).slice(0, 40)) {
    if (!/^[A-Za-z_]{1,30}$/.test(k)) continue;
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') continue;
    const s = String(v).slice(0, 60);
    if (s !== '' && s !== 'false') o[k] = kitakar(s);
  }
  return o;
}

export function jegy({ ut, cim, szoveg, adatok, eredmeny, minta }, domain = 'https://lakaskoltseg.pages.dev') {
  const oldal = cim ? String(cim).slice(0, 80) : ut;
  const idezet = semleges(kitakar(szoveg)).split('\n').map((s) => `> ${s}`).join('\n');
  let body = `**Oldal:** ${domain}${ut}\n\n**A látogató ezt írta:**\n\n${idezet}\n`;
  if (eredmeny) body += `\n**A kapott eredmény:** ${cella(String(eredmeny).slice(0, 120))}${minta ? ' (a minta eredménye volt)' : ''}\n`;
  const sorok = Object.entries(adatok);
  if (sorok.length) body += `\n<details><summary>A beírt adatok</summary>\n\n| Mező | Érték |\n|---|---|\n${sorok.map(([k, v]) => `| ${k} | ${cella(v)} |`).join('\n')}\n\n[Megnyitom ezekkel az adatokkal](${domain}${ut}?${new URLSearchParams(adatok)})\n</details>\n`;
  body += '\n---\nA honlap visszajelzés-gombjából érkezett. Ha megoldottad, zárd le a jegyet.';
  return { title: `Visszajelzés: ${oldal.replace(/\s*\|\s*[^|]+$/, '')}`, body, labels: ['visszajelzes'] };
}

const budapestNap = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  try { if (origin && !ENGEDETT.test(new URL(origin).hostname)) return valasz({ hiba: 'tiltott' }, 403); } catch { return valasz({ hiba: 'tiltott' }, 403); }
  if (Number(request.headers.get('content-length') || 0) > 8000) return valasz({ hiba: 'túl hosszú' }, 413);
  let b;
  try { b = await request.json(); } catch { return valasz({ hiba: 'rossz kérés' }, 400); }
  if (!b || !ervenyesUt(b.ut)) return valasz({ hiba: 'rossz oldal' }, 400);
  if (b.web) return valasz({ ok: true }); // csapda a robotoknak: ember nem tölti ki

  if (b.ertek === 'fel' || b.ertek === 'le') {
    if (!env.SZAVAZAT) return valasz({ ok: true, szamlalo: false });
    const kulcs = `sz:${b.ut}`;
    const most = (await env.SZAVAZAT.get(kulcs, 'json')) || { fel: 0, le: 0 };
    most[b.ertek] += 1;
    await env.SZAVAZAT.put(kulcs, JSON.stringify(most));
    return valasz({ ok: true });
  }

  if (b.ertek === 'szoveg') {
    const szoveg = typeof b.szoveg === 'string' ? b.szoveg.trim().slice(0, 1000) : '';
    if (szoveg.length < 3) return valasz({ hiba: 'üres' }, 400);
    if (!env.GITHUB_TOKEN) return valasz({ hiba: 'nincs beállítva' }, 503);
    if (env.SZAVAZAT) {
      const nk = `napi:${budapestNap()}`;
      const db = Number(await env.SZAVAZAT.get(nk)) || 0;
      if (db >= NAPI_KORLAT) return valasz({ hiba: 'korlát' }, 429);
      await env.SZAVAZAT.put(nk, String(db + 1), { expirationTtl: 172800 });
    }
    const j = jegy({ ut: b.ut, cim: b.cim, szoveg, adatok: tisztitAdatok(b.adatok), eredmeny: b.eredmeny, minta: b.minta === true });
    const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO || ALAP_REPO}/issues`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'lakaskoltseg-visszajelzes', 'content-type': 'application/json' },
      body: JSON.stringify(j),
    });
    return r.ok ? valasz({ ok: true }) : valasz({ hiba: 'github', status: r.status }, 502);
  }
  return valasz({ hiba: 'rossz kérés' }, 400);
}

export async function onRequestGet({ env }) {
  if (!env.SZAVAZAT) return valasz({ szamlalo: false });
  const o = {};
  let cursor;
  do {
    const l = await env.SZAVAZAT.list({ prefix: 'sz:', cursor });
    for (const k of l.keys) o[k.name.slice(3)] = await env.SZAVAZAT.get(k.name, 'json');
    cursor = l.list_complete ? undefined : l.cursor;
  } while (cursor);
  return valasz(o);
}
