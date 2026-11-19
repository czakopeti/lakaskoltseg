import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet, kitakar, jegy, tisztitAdatok, ervenyesUt } from '../functions/api/visszajelzes.js';

/** Memóriabeli KV a Cloudflare-éhez hasonló felülettel. */
function kv() {
  const m = new Map();
  return {
    m,
    async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, v); },
    async list({ prefix }) { return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; },
  };
}
const keres = (b, origin = 'https://ingatlanmerleg.pages.dev') =>
  new Request('https://ingatlanmerleg.pages.dev/api/visszajelzes', { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(b) });

test('szavazatok számlálása oldalanként', async () => {
  const env = { SZAVAZAT: kv() };
  for (const ertek of ['fel', 'fel', 'le']) assert.equal((await onRequestPost({ request: keres({ ut: '/forrasok/', ertek }), env })).status, 200);
  const o = await (await onRequestGet({ env })).json();
  assert.deepEqual(o['/forrasok/'], { fel: 2, le: 1 });
});

test('idegen oldalról és rossz útvonallal nem fogad', async () => {
  const env = { SZAVAZAT: kv() };
  assert.equal((await onRequestPost({ request: keres({ ut: '/a/', ertek: 'fel' }, 'https://gonosz.example'), env })).status, 403);
  assert.equal((await onRequestPost({ request: keres({ ut: 'https://x.hu', ertek: 'fel' }), env })).status, 400);
  assert.equal(ervenyesUt('/kotelezo-biztositas-valtas/'), true);
  assert.equal(ervenyesUt('/../x'), false);
});

test('szöveges visszajelzés GitHub-jegy lesz, kitakart elérhetőséggel', async () => {
  const env = { SZAVAZAT: kv(), GITHUB_TOKEN: 'teszt' };
  let kuldott;
  const eredeti = globalThis.fetch;
  globalThis.fetch = async (url, o) => { kuldott = { url, ...JSON.parse(o.body), auth: o.headers.authorization }; return new Response('{}', { status: 201 }); };
  try {
    const r = await onRequestPost({ request: keres({ ut: '/forrasok/', ertek: 'szoveg', szoveg: 'Rossz! hívj: +36 30 123 4567, @valaki, a@b.hu. Ára 30 000 000 Ft', cim: 'Megjavítsam? | autózom', adatok: { a_javitas: '600000', '<rossz>': 'x' }, eredmeny: 'A javítás olcsóbb: 974 400 Ft' }), env });
    assert.equal(r.status, 200);
  } finally { globalThis.fetch = eredeti; }
  assert.match(kuldott.url, /repos\/czakopeti\/lakaskoltseg-visszajelzes\/issues$/);
  assert.equal(kuldott.auth, 'Bearer teszt');
  assert.deepEqual(kuldott.labels, ['visszajelzes']);
  assert.equal(kuldott.title, 'Visszajelzés: Megjavítsam?');
  assert.doesNotMatch(kuldott.body, /123 4567|a@b\.hu/);
  assert.match(kuldott.body, /30 000 000 Ft/, 'az árat nem takarja ki');
  assert.doesNotMatch(kuldott.body, /@valaki/, 'nincs @említés');
  assert.match(kuldott.body, /\| a_javitas \| 600000 \|/);
  assert.doesNotMatch(kuldott.body, /<rossz>/);
});

test('robotcsapda, üres szöveg és napi korlát', async () => {
  const env = { SZAVAZAT: kv(), GITHUB_TOKEN: 'teszt' };
  const eredeti = globalThis.fetch;
  let db = 0;
  globalThis.fetch = async () => { db++; return new Response('{}', { status: 201 }); };
  try {
    assert.equal((await onRequestPost({ request: keres({ ut: '/a/', ertek: 'szoveg', szoveg: 'spam spam', web: 'http://x' }), env })).status, 200);
    assert.equal(db, 0, 'a csapdába esett kérés nem nyit jegyet');
    assert.equal((await onRequestPost({ request: keres({ ut: '/a/', ertek: 'szoveg', szoveg: ' ' }), env })).status, 400);
    for (let i = 0; i < 30; i++) await onRequestPost({ request: keres({ ut: '/a/', ertek: 'szoveg', szoveg: `hiba ${i}` }), env });
    assert.equal((await onRequestPost({ request: keres({ ut: '/a/', ertek: 'szoveg', szoveg: 'egy túl sok' }), env })).status, 429);
    assert.equal(db, 30);
  } finally { globalThis.fetch = eredeti; }
});

test('beállítás nélkül nem omlik össze', async () => {
  assert.equal((await onRequestPost({ request: keres({ ut: '/a/', ertek: 'fel' }), env: {} })).status, 200);
  assert.equal((await onRequestPost({ request: keres({ ut: '/a/', ertek: 'szoveg', szoveg: 'valami' }), env: {} })).status, 503);
});

test('segédek', () => {
  assert.equal(kitakar('11773016-11111018 számla'), '[kitakarva] számla');
  assert.equal(kitakar('06 1 234 5678'), '[kitakarva]');
  assert.equal(kitakar('2016-os szerzés, 41 850 000 Ft, 54 nm'), '2016-os szerzés, 41 850 000 Ft, 54 nm');
  assert.deepEqual(tisztitAdatok({ kw: 75, rovid: false, ures: '', tel: '+36 30 111 2222' }), { kw: '75', tel: '[kitakarva]' });
  assert.match(jegy({ ut: '/x/', szoveg: 'a\nb', adatok: {} }).body, /> a\n> b/);
});
