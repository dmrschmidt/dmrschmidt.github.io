// node --test eingegangen/api/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baue } from './index.mjs';

// Tabelle im Speicher mit denselben drei Griffen wie die echte
const speicher = () => {
  const zeilen = new Map();
  const k = (key) => key.pk + '|' + key.sk;
  return {
    zeilen,
    kachel: async (pk) => [...zeilen.values()].filter((z) => z.pk === pk),
    kerze: async (key, c, f) => {
      const z = zeilen.get(k(key)) || { ...key, c, f };
      z.kerzen = (z.kerzen || 0) + 1; zeilen.set(k(key), z);
      return z.kerzen;
    },
    bezieh: async (key, e) => {
      const z = zeilen.get(k(key)) || { ...key };
      if (z.name) return null;
      Object.assign(z, e); zeilen.set(k(key), z);
      return z;
    },
  };
};
const api = (db = speicher()) => {
  const h = baue(db, () => 1763000000000, () => 0.5);
  const ruf = async (method, pfad, daten) => {
    const r = await h({ requestContext: { http: { method } }, rawPath: '/api' + pfad, body: daten === undefined ? undefined : typeof daten === 'string' ? daten : JSON.stringify(daten) });
    return { status: r.statusCode, ...JSON.parse(r.body) };
  };
  return { db, get: (p) => ruf('GET', p), post: (p, d) => ruf('POST', p, d) };
};
const topf = { col: 3, floor: 4, name: 'Herr Welkhardt', art: 'farn', ursache: 'Staunässe', letzte: 'Oh no.' };

test('leere Kachel', async () => {
  assert.deepEqual(await api().get('/kachel/0/0'), { status: 200, fenster: [] });
});

test('Kerzen zählen hoch und stehen in der richtigen Kachel', async () => {
  const a = api();
  assert.equal((await a.post('/kerze', { col: -1, floor: 1 })).kerzen, 1);
  assert.equal((await a.post('/kerze', { col: -1, floor: 1 })).kerzen, 2);
  await a.post('/kerze', { col: 40, floor: 33 });
  assert.deepEqual((await a.get('/kachel/-1/0')).fenster, [{ c: -1, f: 1, kerzen: 2 }]);
  assert.deepEqual((await a.get('/kachel/1/1')).fenster, [{ c: 40, f: 33, kerzen: 1 }]);
  assert.deepEqual((await a.get('/kachel/0/0')).fenster, []);
});

test('Fenster beziehen, dann ist es belegt', async () => {
  const a = api();
  const r = await a.post('/fenster', topf);
  assert.equal(r.status, 200);
  assert.deepEqual(r.fenster, { c: 3, f: 4, kerzen: 0, name: 'Herr Welkhardt', art: 'farn', ursache: 'Staunässe', letzte: 'Oh no.', seed: 700000, wann: 1763000000000 });
  assert.equal((await a.post('/fenster', { ...topf, name: 'Zweiter' })).status, 409);
  assert.equal((await a.get('/kachel/0/0')).fenster[0].name, 'Herr Welkhardt');
});

test('Kerzen bleiben, wenn später jemand einzieht', async () => {
  const a = api();
  await a.post('/kerze', { col: 3, floor: 4 });
  assert.equal((await a.post('/fenster', topf)).fenster.kerzen, 1);
});

test('Gründerfenster und Treppenhaus sind nicht zu haben', async () => {
  const a = api();
  assert.equal((await a.post('/fenster', { ...topf, col: -1, floor: 1 })).status, 409);
  assert.equal((await a.post('/fenster', { ...topf, col: 6, floor: 2 })).status, 400);
  assert.equal((await a.post('/kerze', { col: 0, floor: 2 })).status, 400);
});

test('Unsinn wird abgewiesen, nie mit 403 oder 404', async () => {
  const a = api();
  const faelle = [
    await a.get('/nix'), await a.get('/kachel/a/b'), await a.get('/kachel/0/-1'),
    await a.post('/kerze', 'kein json'), await a.post('/kerze', { col: 1.5, floor: 1 }), await a.post('/kerze', { col: 1, floor: -1 }),
    await a.post('/kerze', { col: 2000000, floor: 1 }), await a.post('/kerze', null), await a.post('/weg', { col: 1, floor: 1 }),
    await a.post('/fenster', { ...topf, name: '   ' }), await a.post('/fenster', { ...topf, art: 'tanne' }),
    await a.post('/fenster', { ...topf, name: 'x'.repeat(3000) }),
  ];
  for (const f of faelle) assert.equal(f.status, 400);
  assert.equal(a.db.zeilen.size, 0);
});

test('Texte werden gekürzt und von Markup befreit', async () => {
  const r = await api().post('/fenster', { ...topf, name: ' <b>Bernd</b>\n' + 'x'.repeat(60), ursache: '', letzte: 7 });
  assert.equal(r.fenster.name.length, 40);
  assert.ok(r.fenster.name.startsWith('bBernd/b'));
  assert.equal(r.fenster.ursache, 'ungeklärt');
  assert.equal(r.fenster.letzte, '');
});

test('ein Fehler der Tabelle wird zu 500', async () => {
  const kaputt = baue({ kachel: async () => { throw new Error('weg'); } });
  const stumm = console.error; console.error = () => {};
  const r = await kaputt({ requestContext: { http: { method: 'GET' } }, rawPath: '/api/kachel/0/0' });
  console.error = stumm;
  assert.equal(r.statusCode, 500);
});
