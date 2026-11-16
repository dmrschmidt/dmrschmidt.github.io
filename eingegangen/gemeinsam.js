// Eingegangen: gemeinsame Daten für alle drei Entwürfe.
// Die sieben echten Töpfe kommen aus ../tote-maenner/pflanzen.js (vorher laden),
// alle weiteren Verblichenen werden aus einer Zahl (seed) erzeugt. Kein Server:
// Kerzen und eigene Beisetzungen liegen im localStorage dieses Browsers.
const EG = (() => {
  const WURZEL = new URL('.', document.currentScript.src).href;
  // Wo Fotos und Sticker der Gründer liegen; die AWS-Fassung legt sie neben die Seite.
  const TOTE = window.EG_TOTE || WURZEL + '../tote-maenner/';

  // --- Zufall, der bei gleicher Zahl immer dasselbe liefert ---
  const rng = (seed) => {
    let a = (seed ^ 0x9e3779b9) >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const hash = (x, y) => {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const aus = (r, liste) => liste[Math.floor(r() * liste.length)];

  // --- Wortvorrat ---
  const ARTEN = {
    ficus: 'Ficus', kaktus: 'Kaktus', yucca: 'Yucca', farn: 'Farn', sukkulente: 'Sukkulente',
    kraut: 'Küchenkraut', orchidee: 'Orchidee', monstera: 'Monstera',
  };
  const NAMEN = [
    ['Fikus Fabian', 'ficus', 'm'], ['Benjamin Blattlos', 'ficus', 'm'], ['Birgit Feige', 'ficus', 'f'],
    ['Kaktus Jürgen', 'kaktus', 'm'], ['Stachel-Uwe', 'kaktus', 'm'], ['Kaktine', 'kaktus', 'f'], ['Pieks Brosnan', 'kaktus', 'm'],
    ['Yucca Norris', 'yucca', 'm'], ['Palme Anderson', 'yucca', 'f'], ['Jucca-Jutta', 'yucca', 'f'],
    ['Farn Diesel', 'farn', 'm'], ['Farnziska', 'farn', 'f'], ['Wedel-Werner', 'farn', 'm'],
    ['Aloe Vera Lynn', 'sukkulente', 'f'], ['Sukku-Lenny', 'sukkulente', 'm'], ['Dickblatt-Dieter', 'sukkulente', 'm'],
    ['Basil Ikum', 'kraut', 'm'], ['Bernd das Basilikum', 'kraut', 'm'], ['Petra Silie', 'kraut', 'f'], ['Rosi Marin', 'kraut', 'f'], ['Minze Müller', 'kraut', 'f'],
    ['Orchidee Osbourne', 'orchidee', 'f'], ['Orchi-Dörte', 'orchidee', 'f'], ['Frau von Phalaenopsis', 'orchidee', 'f'],
    ['Monstera Lisa', 'monstera', 'f'], ['Herr Löchrig', 'monstera', 'm'], ['Monsti', 'monstera', 'm'],
  ];
  const TITEL = { m: ['Herr', 'Onkel', 'Graf', 'Käpt’n', 'Dr.', 'Opa', 'Don', 'Der alte'], f: ['Frau', 'Tante', 'Gräfin', 'Dr.', 'Oma', 'Madame', 'Señora', 'Die alte'] };
  const NACHNAMEN = ['Blattmann', 'Welkhardt', 'Grünspan', 'von Übertopf', 'Stängel', 'Dörrmann', 'Trockenbrodt', 'Hängeblatt', 'Staunass', 'Zimmergrün', 'Laubfall', 'zu Untersetzer', 'Kompostella', 'Wurzelbach', 'Topfinger', 'Blähton', 'Gießbert', 'Schattig', 'Nordfenster', 'Ableger'];
  const URSACHEN = [
    'zu viel Liebe, vor allem aus der Gießkanne', 'drei Wochen Mallorca (nicht die eigenen)', 'Heizungsluft', 'Staunässe',
    'stand im Zug', 'die Katze', 'wurde für Plastik gehalten', 'Nordfenster', 'das Umtopfen nicht verkraftet', 'Trauermücken',
    'vergessen, aber nicht absichtlich', 'kalter Kaffee als Dünger', 'das Homeoffice endete', 'WG-Auflösung',
    'wurde „nur kurz“ auf den Balkon gestellt', 'der Dezember', 'ein Fußball', 'zu viel Ehrgeiz beim Düngen',
    'die Nachbarin sollte gießen', 'ungeklärt, die Gießkanne schweigt',
  ];
  const LETZTE = ['Oh no.', 'Wasser?', 'Bitte nicht schon wieder gießen.', 'Ich war nie ein Kaktus.', 'War das Bier?', 'Es zieht.', 'Sagt dem Farn, er hatte recht.', 'Ich wollte nie ans Fenster.', 'Dreht mich noch einmal zur Sonne.', '…', 'Wer von euch war das?', 'Ich komme als Unkraut wieder.'];
  const SPRUECHE = [
    '{Er} ging ein, wie {er} lebte: langsam.', '{Er} hat nie geblüht. {Er} wollte nicht angeben.', 'Gegossen, geliebt, gegangen.',
    'Am Ende war es das Licht. Es fehlte.', '{Er} bat um wenig und bekam zu viel.', 'Die Erde sei dir locker und gut durchlässig.',
    '{Er} ließ erst die Blätter hängen, dann uns.', '{Er} überlebte drei Umzüge und keinen Urlaub.', 'Der Topf bleibt. Der Rest ist Erinnerung.',
    '{Er} wuchs uns ans Herz, sonst nirgends.', 'Immergrün war nur so ein Wort.', 'Pflegeleicht, stand auf dem Schild.',
    '{Er} hat nie geklagt. Das war das Problem.', 'Still stand {er} da. Dann noch stiller.',
  ];
  const LEBEN = [
    '{Er} kam aus dem Baumarkt und hatte Großes vor.', '{Er} war ein Geschenk, und so wurde {er} auch behandelt: ausgepackt und hingestellt.',
    '{Er} stand zwölf Wochen in der Originalfolie und hat sich nie beschwert.', '{Er} zog mit um, jedes Mal im Fußraum.',
    '{Er} sah von Anfang an ein bisschen müde aus, wir hielten das für Charakter.', '{Er} wurde auf einem Flohmarkt gerettet. Vorerst.',
    '{Er} war der Grund, warum es hier „wohnlich“ hieß.', '{Er} hatte den besten Platz im Haus und wusste es.',
    '{Er} hörte jedes Telefonat mit und behielt alles für sich.', '{Er} bekam einen Namen, bevor {er} Wasser bekam.',
  ];
  const ABSCHIED = [
    'Dann kam: {ursache}. Es ging schnell, für eine Pflanze.', 'Am Ende hieß es: {ursache}. Mehr wissen wir nicht, mehr wollen wir nicht wissen.',
    'Todesursache laut Haushalt: {ursache}. Die Ermittlungen wurden eingestellt.', 'Offiziell: {ursache}. Inoffiziell fühlen sich alle ein bisschen schuldig.',
    'Was bleibt, ist ein Topf und der Satz: {ursache}.',
  ];
  const TRAUERNDE = ['eine Gießkanne', 'zwei Untersetzer', 'der Übertopf', 'ein halber Sack Blumenerde', 'die Sprühflasche', 'ein Düngestäbchen, unbenutzt', 'der Kaktus von nebenan', 'das Etikett „pflegeleicht“', 'die Fensterbank', 'ein Stützstab'];
  const TOEPFE = ['#b5623c', '#c9744a', '#e9e4d6', '#e2b33c', '#4e7fa3', '#d98a9a', '#3a4a44', '#8a9a5b', '#7d5ba6', '#d9d2c0'];
  const DAUERN = ['11 Tage', '3 Wochen', '6 Wochen', 'einen Sommer', '5 Monate', '1 Jahr', '2 Jahre', '3 Jahre', '4 Jahre', '7 Jahre', '9 Jahre', '14 Jahre'];
  const MONATE = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

  const beuge = (s, g) => s
    .replace(/\{Er\}/g, g === 'f' ? 'Sie' : 'Er').replace(/\{er\}/g, g === 'f' ? 'sie' : 'er');

  // --- Ein Verblichener aus einer Zahl ---
  const toter = (seed) => {
    const r = rng(seed);
    let name, art, g;
    if (r() < 0.5) {
      [name, art, g] = aus(r, NAMEN);
    } else {
      g = r() < 0.5 ? 'm' : 'f';
      art = aus(r, Object.keys(ARTEN));
      name = aus(r, TITEL[g]) + ' ' + aus(r, NACHNAMEN);
    }
    const ursache = aus(r, URSACHEN);
    const jahr = 2024 + Math.floor(r() * 3);
    const p = {
      id: 's' + seed, seed, echt: false, name, art, artName: ARTEN[art], g, ursache,
      gestorben: aus(r, MONATE) + ' ' + jahr,
      dauer: aus(r, DAUERN),
      spruch: beuge(aus(r, SPRUECHE), g),
      text: beuge(aus(r, LEBEN), g) + ' ' + aus(r, ABSCHIED).replace('{ursache}', ursache),
      letzte: aus(r, LETZTE),
      trauernde: [aus(r, TRAUERNDE), aus(r, TRAUERNDE)].filter((x, i, a) => a.indexOf(x) === i),
      topf: aus(r, TOEPFE),
      fremdeKerzen: Math.floor(Math.pow(r(), 3) * 380),
    };
    return p;
  };

  // --- Die sieben Gründer, mit Foto ---
  const GRUENDER = (typeof PFLANZEN === 'undefined' ? [] : PFLANZEN).map((p, i) => ({
    id: p.id, seed: 9000 + i, echt: true, name: p.name, art: 'echt', artName: p.daten, g: 'm',
    ursache: 'wird nicht verraten', gestorben: '2026', dauer: 'viel zu kurz',
    spruch: p.spruch, text: p.text, letzte: p.trauer, trauernde: ['die ganze Fensterbank'],
    topf: '#b5623c', fremdeKerzen: 400 + i * 37, alt: p.alt, selten: p.selten,
    bild: TOTE + 'sticker/' + p.id + '.webp',
    foto: TOTE + 'img/' + p.id + '.jpg',
  }));

  // --- Speicher ---
  const KEY = 'eingegangen-v1';
  const lies = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const schreib = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} };
  const brennt = (id) => !!(lies().kerzen || {})[id];
  const zuende = (id) => { const d = lies(); (d.kerzen ||= {})[id] = 1; schreib(d); };
  const meineKerzen = () => Object.keys(lies().kerzen || {}).length;
  const kerzenZahl = (p) => p.fremdeKerzen + (brennt(p.id) ? 1 : 0);
  const eigene = () => (lies().eigene || []).map(baueEigenen);
  const baueEigenen = (e) => {
    const basis = toter(e.seed);
    const g = 'm';
    // wann (Millisekunden) kommt nur vom Server; lokal Beigesetzte sind immer von heute
    const d = e.wann ? new Date(e.wann) : null;
    const tag = d ? MONATE[d.getMonth()] + ' ' + d.getFullYear() : 'heute';
    return {
      ...basis, id: 'e' + e.seed, eigen: true, name: e.name, art: e.art, artName: ARTEN[e.art], g,
      ursache: e.ursache, letzte: e.letzte || basis.letzte, gestorben: tag, fremdeKerzen: 0,
      spruch: 'Gegossen, geliebt, gegangen.',
      text: e.name + (e.wann ? ' wurde im ' + tag + ' hier beigesetzt. ' : ' wurde heute hier beigesetzt. ') + aus(rng(e.seed + 1), ABSCHIED).replace('{ursache}', e.ursache),
      ort: e.ort,
    };
  };
  // ort: frei wählbar je Entwurf (z. B. {x, y}); kommt beim Lesen unverändert zurück.
  const setzeBei = (daten) => {
    const d = lies();
    const e = { seed: 500000 + Math.floor(Math.random() * 400000), ...daten };
    (d.eigene ||= []).push(e); schreib(d);
    return baueEigenen(e);
  };

  // --- Zeichnung: toter Topf als SVG (viewBox 0 0 120 170, Topfboden bei y=170) ---
  // Gruppe .eg-koerper lässt sich abdunkeln, .eg-augen bleibt sichtbar.
  const DUERR = ['#8a6b3c', '#a58a4d', '#6b5a34', '#93804f', '#7c8458', '#5e4d2e'];
  const svg = (p) => {
    if (p.echt) return `<img class="eg-bild" src="${p.bild}" alt="${p.alt}">`;
    const r = rng(p.seed * 7 + 3);
    const f = () => aus(r, DUERR);
    const j = (n) => (r() - 0.5) * 2 * n;
    let k = '';
    const blatt = (x, y, w, h, dreh, farbe) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${w}" ry="${h}" fill="${farbe}" transform="rotate(${dreh.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    const linie = (d, farbe, breite) => `<path d="${d}" fill="none" stroke="${farbe}" stroke-width="${breite}" stroke-linecap="round"/>`;
    const art = p.art;
    if (art === 'ficus') {
      const sx = 60 + j(4), ox = 56 + j(10);
      k += linie(`M${sx} 122 Q${sx + j(10)} 85 ${ox} 38`, '#5e4d2e', 3.5);
      for (let i = 0; i < 4; i++) {
        const y = 50 + i * 16 + j(4), s = i % 2 ? 1 : -1, x2 = ox + s * (18 + r() * 14);
        k += linie(`M${(ox + sx) / 2 + j(3)} ${y} Q${x2 - s * 6} ${y - 8} ${x2} ${y + 2}`, '#5e4d2e', 1.8);
        if (r() < 0.75) k += blatt(x2 + s * 2, y + 11, 4.5, 9, s * 12 + j(10), f());
      }
      k += blatt(40 + j(4), 119, 8, 3.5, j(20), f()) + blatt(78 + j(4), 120, 7, 3, j(20), f());
    } else if (art === 'kaktus') {
      const neig = j(9), h = 50 + r() * 22, farbe = aus(r, ['#7c8458', '#8d8a5a', '#6f7350']);
      let s = `<rect x="46" y="${122 - h}" width="28" height="${h + 4}" rx="14" fill="${farbe}"/>`;
      if (r() < 0.6) s += linie(`M74 ${112 - h / 3} q14 0 14 ${12 + r() * 10}`, farbe, 9);
      for (let i = 0; i < 9; i++) { const y = 122 - h + 8 + r() * (h - 12), l = r() < 0.5; s += linie(`M${l ? 47 : 73} ${y} l${l ? -5 : 5} ${-2 + j(2)}`, '#d9d2c0', 1); }
      for (let i = 0; i < 3; i++) s += linie(`M${54 + i * 6} ${128 - h} v${h - 12}`, '#0002', 1);
      k += `<g transform="rotate(${neig.toFixed(1)} 60 122)">${s}</g>`;
    } else if (art === 'yucca') {
      const h = 40 + r() * 20, top = 122 - h;
      k += `<rect x="55" y="${top}" width="10" height="${h + 2}" rx="3" fill="#6b5a34"/>`;
      for (let i = 0; i < 9; i++) {
        const s = i % 2 ? 1 : -1, w = 14 + r() * 26, fall = 12 + r() * 40;
        k += linie(`M60 ${top + 2} Q${60 + s * w} ${top - 14 + j(8)} ${60 + s * (w + 6)} ${top + fall}`, f(), 3.2);
      }
    } else if (art === 'farn') {
      for (let i = 0; i < 11; i++) {
        const s = i % 2 ? 1 : -1, w = 12 + r() * 30, hoch = 20 + r() * 35, fall = 10 + r() * 34;
        k += linie(`M${60 + j(6)} 122 Q${60 + s * w * 0.6} ${122 - hoch} ${60 + s * (w + 8)} ${122 - hoch + fall + 14}`, f(), 2.4);
      }
    } else if (art === 'sukkulente') {
      for (let i = 0; i < 9; i++) { const w = (i - 4) * 16; k += blatt(60 + Math.sin(w * Math.PI / 180) * 20, 116 - Math.cos(w * Math.PI / 180) * 9, 5.5, 13, w, f()); }
      k += blatt(60, 113, 6, 8, 0, '#7c8458');
    } else if (art === 'kraut') {
      for (let i = 0; i < 5; i++) {
        const x = 46 + i * 7 + j(2), ox = x + j(14), oy = 62 + r() * 30;
        k += linie(`M${x} 122 Q${x + j(6)} 95 ${ox} ${oy}`, f(), 1.8);
        if (r() < 0.6) k += blatt(ox + 3, oy + 5, 3.5, 6, 30 + j(30), f());
      }
    } else if (art === 'orchidee') {
      k += linie('M66 122 V46', '#c8b98c', 1.6);
      k += linie(`M62 122 Q${58 + j(4)} 70 ${50 + j(6)} 52 Q${40 + j(4)} 44 ${34 + j(4)} ${60 + j(6)}`, '#7c8458', 2.2);
      k += `<rect x="60" y="74" width="8" height="4" rx="1" fill="#d98a9a"/>`;
      k += blatt(40, 122, 17, 5, 18 + j(8), f()) + blatt(82, 123, 16, 5, -20 + j(8), f());
    } else { // monstera
      for (const s of [-1, 1]) {
        const x = 60 + s * (22 + r() * 10), y = 70 + r() * 20;
        k += linie(`M${60 + s * 3} 122 Q${60 + s * 6} ${y - 14} ${x} ${y}`, '#6b5a34', 2.6);
        k += `<g transform="rotate(${(s * (40 + r() * 30)).toFixed(0)} ${x} ${y})"><ellipse cx="${x}" cy="${y + 15}" rx="15" ry="19" fill="${f()}"/>` +
          `<path d="M${x - 15} ${y + 12}h9M${x - 14} ${y + 22}h8M${x + 15} ${y + 12}h-9M${x + 14} ${y + 22}h-8" stroke="#0005" stroke-width="3"/></g>`;
      }
    }
    // Topf mit Wackelaugen
    const br = 54 + j(6), l = 60 - br / 2, re = 60 + br / 2;
    const topf = `<path d="M${l} 124 H${re} L${re - 7} 170 H${l + 7} Z" fill="${p.topf}"/>` +
      `<rect x="${l - 3}" y="116" width="${br + 6}" height="11" rx="3" fill="${p.topf}"/>` +
      `<rect x="${l - 3}" y="116" width="${br + 6}" height="11" rx="3" fill="#0001"/>` +
      `<path d="M${re - 9} 127 L${re - 14} 170 H${re - 7} L${re} 127Z" fill="#0002"/>`;
    const ay = 144 + j(3), ab = 8.5, px = j(2.6), py = j(2.6);
    const auge = (x) => `<circle cx="${x}" cy="${ay}" r="${ab}" fill="#fbfaf4"/><circle cx="${x}" cy="${ay}" r="${ab}" fill="none" stroke="#0003"/>` +
      `<circle cx="${(x + px).toFixed(1)}" cy="${(ay + 2.5 + py).toFixed(1)}" r="4.2" fill="#111"/>`;
    return `<svg class="eg-bild" viewBox="0 0 120 170" role="img" aria-label="${String(p.name).replace(/[&<>"]/g, '')}, ${p.artName}, eingegangen">` +
      `<g class="eg-koerper">${k}${topf}</g><g class="eg-augen">${auge(50)}${auge(70)}</g></svg>`;
  };

  // --- Beisetzen: ein gemeinsamer Dialog, Aussehen über gemeinsam.css und CSS-Variablen ---
  const dialogBeisetzen = (fertig, titel = 'Einen Topf beisetzen') => {
    let d = document.querySelector('dialog.eg-beisetzen');
    if (!d) {
      d = document.createElement('dialog');
      d.className = 'eg-beisetzen';
      d.innerHTML = `<form method="dialog">
        <h2></h2>
        <label>Name <input name="name" required maxlength="40" placeholder="z. B. Herr Welkhardt" autocomplete="off"></label>
        <label>Was war es? <select name="art">${Object.entries(ARTEN).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
        <label>Todesursache <select name="ursache">${URSACHEN.map((u) => `<option>${u}</option>`).join('')}</select></label>
        <label>Letzte Worte <input name="letzte" maxlength="60" placeholder="Oh no." autocomplete="off"></label>
        <p class="eg-klein">Prototyp: bleibt nur in diesem Browser. Foto und Wackelaugen folgen.</p>
        <div class="eg-knoepfe"><button type="button" value="nein">Doch noch nicht</button><button value="ja" class="eg-haupt">Beisetzen</button></div>
      </form>`;
      document.body.append(d);
      d.querySelector('[value=nein]').onclick = () => d.close('nein');
    }
    d.querySelector('h2').textContent = titel;
    d.querySelector('form').reset();
    d.onclose = () => {
      if (d.returnValue !== 'ja') return;
      const f = new FormData(d.querySelector('form'));
      fertig({ name: f.get('name').trim(), art: f.get('art'), ursache: f.get('ursache'), letzte: f.get('letzte').trim() });
    };
    d.showModal();
  };

  return { rng, hash, toter, GRUENDER, ARTEN, svg, brennt, zuende, meineKerzen, kerzenZahl, eigene, eigener: baueEigenen, setzeBei, dialogBeisetzen };
})();
