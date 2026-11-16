// Eingegangen-API: was Besucher im Haus gegenüber getan haben. Läuft als Lambda hinter CloudFront (/api/*).
//   GET  /api/kachel/{tx}/{ty}  alle Fenster einer Kachel (32 x 32), in denen eine Kerze brennt oder jemand eingezogen ist
//   POST /api/kerze    {col, floor}                               eine Kerze mehr im Fenster
//   POST /api/fenster  {col, floor, name, art, ursache, letzte}   ein freies Fenster beziehen
// Welche Töpfe sonst in den Fenstern stehen, rechnet der Browser aus der Adresse aus; hier liegt nur Echtes.
// Antwortet nie mit 403 oder 404: die ersetzt CloudFront durch die Fehlerseite der Website.

export const KACHEL = 32;
const TREPPE = 6, GRENZE = 1000000;
const ARTEN = ['ficus', 'kaktus', 'yucca', 'farn', 'sukkulente', 'kraut', 'orchidee', 'monstera'];
const GRUENDER = new Set(['-1,1', '1,1', '-2,1', '2,1', '-1,2', '1,2', '2,2']); // wie GRUENDER_ORT in gegenueber/index.html

const antwort = (statusCode, daten) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  body: JSON.stringify(daten),
});
const mod = (a, n) => ((a % n) + n) % n;
const istFenster = (c, f) => Number.isInteger(c) && Number.isInteger(f) && Math.abs(c) <= GRENZE && f >= 0 && f <= GRENZE && mod(c, TREPPE) !== 0;
const schluessel = (c, f) => ({ pk: `K#${Math.floor(c / KACHEL)}#${Math.floor(f / KACHEL)}`, sk: `${c}#${f}` });
// Steuerzeichen und spitze Klammern raus, damit nichts davon je als Markup endet
const text = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max) : '');
const nachAussen = ({ c, f, kerzen = 0, name, art, ursache, letzte, seed, wann }) =>
  (name ? { c, f, kerzen, name, art, ursache, letzte, seed, wann } : { c, f, kerzen });

export const baue = (db, uhr = Date.now, zufall = Math.random) => async (event) => {
  try {
    const methode = event.requestContext?.http?.method;
    const pfad = (event.rawPath || '').replace(/^\/api/, '');
    if (methode === 'GET') {
      const m = pfad.match(/^\/kachel\/(-?\d{1,6})\/(\d{1,6})$/);
      if (!m) return antwort(400, { fehler: 'unbekannt' });
      const fenster = await db.kachel(`K#${+m[1]}#${+m[2]}`);
      return antwort(200, { fenster: fenster.map(nachAussen) });
    }
    if (methode !== 'POST') return antwort(400, { fehler: 'unbekannt' });
    const roh = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString() : event.body || '';
    if (roh.length > 2000) return antwort(400, { fehler: 'zu lang' });
    let d;
    try { d = JSON.parse(roh); } catch { return antwort(400, { fehler: 'kein json' }); }
    const c = d?.col, f = d?.floor;
    if (!istFenster(c, f)) return antwort(400, { fehler: 'kein fenster' });

    if (pfad === '/kerze') return antwort(200, { kerzen: await db.kerze(schluessel(c, f), c, f) });

    if (pfad === '/fenster') {
      const name = text(d.name, 40);
      if (!name || !ARTEN.includes(d.art)) return antwort(400, { fehler: 'unvollständig' });
      if (GRUENDER.has(c + ',' + f)) return antwort(409, { fehler: 'belegt' });
      const eintrag = {
        c, f, name, art: d.art, ursache: text(d.ursache, 80) || 'ungeklärt', letzte: text(d.letzte, 60),
        seed: 500000 + Math.floor(zufall() * 400000), wann: uhr(),
      };
      const neu = await db.bezieh(schluessel(c, f), eintrag);
      return neu ? antwort(200, { fenster: nachAussen(neu) }) : antwort(409, { fehler: 'belegt' });
    }
    return antwort(400, { fehler: 'unbekannt' });
  } catch (e) {
    console.error(e);
    return antwort(500, { fehler: 'kaputt' });
  }
};

// --- DynamoDB: Tabelle mit pk = Kachel, sk = "col#floor" ---
const dynamo = async () => {
  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  const TableName = process.env.TABELLE;
  return {
    async kachel(pk) {
      const alle = [];
      let ExclusiveStartKey;
      do {
        const r = await doc.send(new QueryCommand({ TableName, KeyConditionExpression: 'pk = :p', ExpressionAttributeValues: { ':p': pk }, ExclusiveStartKey }));
        alle.push(...r.Items);
        ExclusiveStartKey = r.LastEvaluatedKey;
      } while (ExclusiveStartKey);
      return alle;
    },
    async kerze(Key, c, f) {
      const r = await doc.send(new UpdateCommand({
        TableName, Key, UpdateExpression: 'ADD kerzen :eins SET c = :c, f = :f',
        ExpressionAttributeValues: { ':eins': 1, ':c': c, ':f': f }, ReturnValues: 'UPDATED_NEW',
      }));
      return r.Attributes.kerzen;
    },
    async bezieh(Key, e) {
      try {
        const r = await doc.send(new UpdateCommand({
          TableName, Key, ConditionExpression: 'attribute_not_exists(#name)',
          UpdateExpression: 'SET #name = :name, art = :art, ursache = :ursache, letzte = :letzte, seed = :seed, wann = :wann, c = :c, f = :f',
          ExpressionAttributeNames: { '#name': 'name' },
          ExpressionAttributeValues: { ':name': e.name, ':art': e.art, ':ursache': e.ursache, ':letzte': e.letzte, ':seed': e.seed, ':wann': e.wann, ':c': e.c, ':f': e.f },
          ReturnValues: 'ALL_NEW',
        }));
        return r.Attributes;
      } catch (fehler) {
        if (fehler.name === 'ConditionalCheckFailedException') return null;
        throw fehler;
      }
    },
  };
};

let echt;
export const handler = async (event) => baue(await (echt ||= dynamo()))(event);
