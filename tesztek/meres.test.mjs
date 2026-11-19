import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { onRequestPost, onRequestGet, osszesit, ervenyes, ESEMENYEK } from '../functions/api/meres.js';
import { UTAK } from '../kozos/utak.js';

/** Memóriabeli KV metaadattal, a Cloudflare-éhez hasonló felülettel. */
function kv({ hibas = false } = {}) {
  const m = new Map();
  return {
    m,
    async get(k) { return m.get(k)?.v ?? null; },
    async put(k, v, o = {}) { if (hibas) throw new Error('KV-korlát'); m.set(k, { v, metadata: o.metadata }); },
    async list({ prefix }) { return { keys: [...m.entries()].filter(([k]) => k.startsWith(prefix)).map(([name, x]) => ({ name, metadata: x.metadata })), list_complete: true }; },
  };
}
const keres = (b, origin = 'https://ingatlanmerleg.pages.dev') =>
  new Request('https://ingatlanmerleg.pages.dev/api/meres', { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: typeof b === 'string' ? b : JSON.stringify(b) });
const honap = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date()).slice(0, 7);

test('mérés: események számlálása oldalanként, havi összesítő és befejezési arány', async () => {
  const env = { SZAVAZAT: kv() };
  const kuld = (ut, esemeny) => onRequestPost({ request: keres({ ut, esemeny }), env });
  for (let i = 0; i < 4; i++) assert.equal((await kuld('/forrasok/', 'indit')).status, 200);
  for (let i = 0; i < 3; i++) await kuld('/forrasok/', 'kesz');
  await kuld('/rolunk/', 'indit');
  await kuld('/rolunk/', 'mentes');
  const o = await (await onRequestGet({ request: new Request(`https://ingatlanmerleg.pages.dev/api/meres?honap=${honap}`), env })).json();
  assert.equal(o.honap, honap);
  assert.equal(o.oldalak['/forrasok/'].indit, 4);
  assert.equal(o.oldalak['/forrasok/'].kesz, 3);
  assert.equal(o.oldalak['/forrasok/'].befejezesi_arany, 75);
  assert.equal(o.oldalak['/rolunk/'].befejezesi_arany, 0);
  assert.equal(o.osszesen.indit, 5);
  assert.equal(o.osszesen.kesz, 3);
  assert.equal(o.osszesen.mentes, 1);
  assert.equal(o.osszesen.befejezesi_arany, 60);
  // a kulcsban nincs semmi a látogatóról: hónap, oldal, esemény
  for (const k of env.SZAVAZAT.m.keys()) assert.match(k, /^m:\d{4}-\d{2}:\/[a-z0-9\-/]*:[a-z]+$/);
});

test('mérés: csak ismert oldalra és eseményre, idegen oldalról semmit', async () => {
  const env = { SZAVAZAT: kv() };
  assert.equal((await onRequestPost({ request: keres({ ut: '/nincs-ilyen/', esemeny: 'indit' }), env })).status, 400);
  assert.equal((await onRequestPost({ request: keres({ ut: '/forrasok/', esemeny: 'barmi' }), env })).status, 400);
  assert.equal((await onRequestPost({ request: keres({ ut: '/forrasok/', esemeny: 'indit' }, 'https://gonosz.example'), env })).status, 403);
  assert.equal((await onRequestPost({ request: keres('nem json'), env })).status, 400);
  assert.equal((await onRequestPost({ request: keres({ ut: '/forrasok/', esemeny: 'indit', x: 'a'.repeat(400) }), env })).status, 413);
  assert.equal(env.SZAVAZAT.m.size, 0);
  assert.equal(ervenyes(null), false);
  assert.equal(ervenyes({ ut: '/', esemeny: 'tovabb' }), true);
});

test('mérés: KV-hiba és hiányzó tároló esetén sem dob hibát a látogatónak', async () => {
  assert.equal((await onRequestPost({ request: keres({ ut: '/', esemeny: 'tovabb' }), env: { SZAVAZAT: kv({ hibas: true }) } })).status, 202);
  assert.equal((await onRequestPost({ request: keres({ ut: '/', esemeny: 'tovabb' }), env: {} })).status, 200);
  assert.equal((await onRequestGet({ request: new Request('https://ingatlanmerleg.pages.dev/api/meres?honap=2026-1'), env: { SZAVAZAT: kv() } })).status, 400);
});

test('mérés: az összesítő más hónap kulcsait kihagyja', () => {
  const o = osszesit([{ name: 'm:2026-10:/:indit', metadata: { n: 5 } }, { name: 'm:2026-11:/:indit', metadata: { n: 2 } }, { name: 'sz:/', metadata: null }], '2026-11');
  assert.equal(o.osszesen.indit, 2);
  assert.equal(o.osszesen.befejezesi_arany, 0);
  assert.deepEqual(Object.keys(o.osszesen).filter((k) => k !== 'befejezesi_arany'), ESEMENYEK);
});

test('mérés: az oldallista egyezik a megépített oldalakkal', () => {
  const web = new URL('../web/', import.meta.url).pathname;
  for (const u of UTAK) assert.ok(existsSync(`${web}${u}index.html`), `hiányzik: ${u}`);
  const konyvtarak = readdirSync(web, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(`${web}${d.name}/index.html`)).map((d) => `${d.name}/`);
  for (const d of konyvtarak) assert.ok(UTAK.includes(d), `nincs a mérés listáján: ${d}`);
});
