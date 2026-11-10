// Genera packs/infantil.llencpack.json
// Copyright (C) 2026 SBS BiM Consulting, Jordi Subirós — AGPL-3.0-only
import fs from 'node:fs';
import { SYMBOLS, SYM_CATS } from './gen-symbols.mjs';

const MM = 96 / 25.4;
const hx = c => c.length === 7 ? c + 'ff' : c;
const solid = c => ({ t: 'solid', c: hx(c) });
const NONE = { t: 'none', c: '#000000ff' };
const INK = '#2d2a32';
const SYMS = new Set(SYMBOLS.map(s => s.id));

// constructor de pàgina (coordenades en mm o px segons la unitat)
function B(W, H, k) {
  const items = [];
  const u = v => +(v * k).toFixed(3);
  const api = {
    W, H, items,
    rect(x, y, w, h, fill, o = {}) { items.push({ type: 'rect', x: u(x), y: u(y), w: u(w), h: u(h), r: u(o.r || 0), fill: fill ? solid(fill) : NONE, stroke: solid(o.stroke || INK), sw: o.sw ? u(o.sw) : 0, dash: o.dash, rot: o.rot || 0, opacity: o.op == null ? 1 : o.op }); return api; },
    ell(x, y, w, h, fill, o = {}) { items.push({ type: 'ellipse', x: u(x), y: u(y), w: u(w), h: u(h), fill: fill ? solid(fill) : NONE, stroke: solid(o.stroke || INK), sw: o.sw ? u(o.sw) : 0, dash: o.dash, opacity: o.op == null ? 1 : o.op }); return api; },
    line(x1, y1, x2, y2, col = INK, sw = 0.6, o = {}) { items.push({ type: 'line', p1: { x: u(x1), y: u(y1) }, p2: { x: u(x2), y: u(y2) }, fill: NONE, stroke: solid(col), sw: u(sw), cap: 'round', dash: o.dash, ae: o.ae }); return api; },
    text(x, y, w, text, o = {}) {
      items.push({ type: 'text', x: u(x), y: u(y), w: u(w), text, ff: o.ff || 'Baloo 2', fs: u(o.fs || 5), fw: o.fw || 400, lh: o.lh || 1.15, ls: o.ls || 0, ta: o.ta || 'left', auto: 'h', tt: o.tt || 'none', fill: solid(o.c || INK), stroke: solid(o.sc || '#ffffff'), sw: o.sw ? u(o.sw) : 0, rot: o.rot || 0 });
      return api;
    },
    title(x, y, w, text, o = {}) { return api.text(x, y, w, text, Object.assign({ ff: 'Fredoka', fw: 700, lh: 1.05 }, o)); },
    sym(id, x, y, w, h, o = {}) { if (!SYMS.has(id)) throw new Error('símbol desconegut: ' + id); items.push({ type: 'sym', sym: id, x: u(x), y: u(y), w: u(w), h: u(h == null ? w : h), rot: o.rot || 0, opacity: o.op == null ? 1 : o.op }); return api; },
    // línies d'escriptura
    lines(x, y, w, n, gap, col = '#c9cfd8') { for (let i = 0; i < n; i++) api.line(x, y + i * gap, x + w, y + i * gap, col, 0.4); return api; },
  };
  return api;
}
const SIZES = {
  a4: [210, 297, 'mm'], a4l: [297, 210, 'mm'], a3: [297, 420, 'mm'], a3l: [420, 297, 'mm'], a5: [148, 210, 'mm'], a5l: [210, 148, 'mm'],
  sq: [1080, 1080, 'px'], hd: [1920, 1080, 'px'],
};
const T = [];
function tpl(id, name, cat, tags, size, pages) {
  const [W, H, unit] = SIZES[size];
  const k = unit === 'mm' ? MM : 1;
  const out = pages.map(fn => {
    const b = B(W, H, k);
    const r = fn(b) || {};
    return { name: r.name, bg: hx(r.bg || '#ffffff'), items: b.items };
  });
  T.push({ id, name, cat, tags, w: +(W * k).toFixed(3), h: +(H * k).toFixed(3), unit, pages: out });
}

/* ── Cartells (A4/A3 vertical) ─────────────────────────────────── */
const POSTERS = [
  { id: 'festa', name: 'Festa de l\'escola', t: 'GRAN FESTA!', s: 'Música, jocs i berenar per a tothom', bg: '#fff0f5', a: '#ef476f', b: '#ffd23f', syms: ['globus-festa', 'pastis', 'confeti', 'regal'], top: 'banderoles' },
  { id: 'excursio', name: 'Excursió', t: 'Anem d\'excursió', s: 'Porta motxilla, gorra, aigua i esmorzar', bg: '#eaf7e6', a: '#3f9b5b', b: '#ffb703', syms: ['bus', 'muntanya', 'arbre', 'motxilla'], top: null },
  { id: 'concurs', name: 'Concurs de dibuix', t: 'Concurs de dibuix', s: 'Tema: el meu lloc preferit', bg: '#f3efff', a: '#8e6cdb', b: '#ffd23f', syms: ['paleta', 'pinzell', 'llapis', 'trofeu'], top: 'banderoles2' },
  { id: 'reciclar', name: 'Reciclem!', t: 'Reciclem a l\'escola', s: 'Groc: envasos · Blau: paper · Verd: vidre', bg: '#e9f8ef', a: '#2e8b57', b: '#5aa9e6', syms: ['reciclar', 'terra', 'arbre', 'gota'], top: null },
  { id: 'santjordi', name: 'Sant Jordi', t: 'Feliç Sant Jordi', s: 'Un llibre i una rosa', bg: '#fff4f0', a: '#d62828', b: '#3f9b5b', syms: ['drac', 'rosa', 'llibre-rosa', 'castell'], top: null },
  { id: 'castanyada', name: 'Castanyada', t: 'Castanyada', s: 'Castanyes, moniatos i panellets', bg: '#fff3e0', a: '#a0522d', b: '#f4a259', syms: ['castanya', 'panellets', 'carabassa', 'arbre-tardor'], top: null },
  { id: 'nadal', name: 'Nadal', t: 'Bon Nadal!', s: 'Festival de Nadal · Sala d\'actes', bg: '#eef6ff', a: '#c1121f', b: '#3f9b5b', syms: ['arbre-nadal', 'tio', 'regal', 'ninot-neu'], top: 'banderoles2' },
  { id: 'carnaval', name: 'Carnaval', t: 'Carnaval!', s: 'Vine disfressat i balla amb nosaltres', bg: '#fff8e1', a: '#8e6cdb', b: '#ef476f', syms: ['antifac', 'confeti', 'globus-festa', 'nota'], top: 'banderoles' },
  { id: 'ciencia', name: 'Fira de ciència', t: 'Fira de ciència', s: 'Experiments, robots i molt més', bg: '#eaf4ff', a: '#1d5fa8', b: '#ffb703', syms: ['microscopi', 'coet', 'bombeta', 'lupa'], top: null },
  { id: 'concert', name: 'Concert', t: 'Concert de primavera', s: 'Coral i orquestra de l\'escola', bg: '#fff7ec', a: '#d1495b', b: '#00798c', syms: ['guitarra', 'tambor', 'nota', 'microfon'], top: null },
  { id: 'esports', name: 'Jornada esportiva', t: 'Jornada esportiva', s: 'Curses, relleus i jocs d\'equip', bg: '#eef9f0', a: '#ef6f1f', b: '#2b9348', syms: ['futbol', 'basquet', 'meta', 'medalla'], top: 'banderoles2' },
  { id: 'llibres', name: 'Mercat de llibres', t: 'Mercat de llibres', s: 'Intercanvia els llibres que ja has llegit', bg: '#f5f0ff', a: '#5a3fa0', b: '#ff8c42', syms: ['llibre', 'mussol', 'bombeta', 'llapis'], top: null },
  { id: 'espai', name: 'Nit d\'estrelles', t: 'Nit d\'estrelles', s: 'Observació del cel amb telescopis', bg: '#1d2552', a: '#ffd23f', b: '#ffffff', syms: ['saturn', 'coet', 'estel-fugac', 'telescopi'], top: null, dark: true },
  { id: 'animals', name: 'Protegim els animals', t: 'Cuidem els animals', s: 'Projecte de classe sobre la fauna', bg: '#effaf3', a: '#2d6a4f', b: '#ffb703', syms: ['tortuga', 'balena', 'abella', 'mussol'], top: null },
  { id: 'esbusca', name: 'Es busca', t: 'ES BUSCA', s: 'Ha desaparegut el nostre amic.\nSi el veus, avisa la classe de 3r!', bg: '#fdf3d8', a: '#7a3b1e', b: '#c1121f', syms: ['gat'], top: null, wanted: true },
  { id: 'santjoan', name: 'Revetlla', t: 'Revetlla de Sant Joan', s: 'Foguera, coca i molta seguretat', bg: '#1f1b3a', a: '#ffb703', b: '#ff7b2b', syms: ['foc', 'estrella', 'lluna', 'nota'], top: null, dark: true },
];
const posterA = P => b => { // títol gran a dalt, il·lustració central, dades a baix
  const { W, H } = b;
  if (P.top) b.sym(P.top, 0, 0, W, W * 0.24);
  if (P.wanted) {
    b.rect(12, 12, W - 24, H - 24, null, { sw: 1.6, stroke: P.a });
    b.title(14, 22, W - 28, P.t, { fs: 30, ta: 'center', c: P.a });
    b.rect(40, 58, W - 80, 120, '#ffffff', { sw: 1.2, stroke: P.a });
    b.sym(P.syms[0], 55, 68, W - 110, 100);
    b.title(14, 186, W - 28, 'Nom: ...........', { fs: 13, ta: 'center', c: P.a });
    b.text(24, 210, W - 48, P.s, { fs: 7, ta: 'center' });
    b.title(14, 250, W - 28, 'RECOMPENSA: una abraçada', { fs: 9, ta: 'center', c: P.b });
    return { bg: P.bg };
  }
  const tc = P.dark ? P.a : P.a, txt = P.dark ? '#ffffff' : INK;
  b.title(16, P.top ? 52 : 26, W - 32, P.t, { fs: 24, ta: 'center', c: tc });
  b.ell(W / 2 - 70, 92, 140, 140, P.b, { op: 0.25 });
  b.sym(P.syms[0], W / 2 - 52, 108, 104);
  b.sym(P.syms[1], 14, 200, 44);
  b.sym(P.syms[2], W - 58, 196, 44);
  b.text(20, 246, W - 40, P.s, { fs: 7.5, ta: 'center', c: txt, fw: 600 });
  b.rect(30, 262, W - 60, 20, P.a, { r: 10 });
  b.title(30, 266.5, W - 60, 'Dia: __ / __   ·   Hora: __ : __', { fs: 6.5, ta: 'center', c: '#ffffff', ff: 'Baloo 2', fw: 600 });
  return { bg: P.bg };
};
const posterB = P => b => { // franja de color, títol a l'esquerra, il·lustracions disperses
  const { W, H } = b;
  b.rect(0, 0, W, 120, P.a);
  b.sym(P.syms[3], W - 80, 24, 66);
  b.title(16, 26, W - 100, P.t, { fs: 21, c: '#ffffff' });
  b.text(16, 92, W - 100, P.s, { fs: 6.5, c: '#ffffff' });
  b.sym('ona-sep', 0, 112, W, 16);
  b.sym(P.syms[0], 20, 140, 90);
  b.sym(P.syms[1], 116, 146, 74);
  b.rect(16, 236, W - 32, 46, '#ffffff', { r: 6, sw: 0.8, stroke: P.a });
  b.title(24, 242, W - 48, 'On i quan?', { fs: 8, c: P.a });
  b.text(24, 254, W - 48, 'Lloc: ..................................................\nDia i hora: ..........................................', { fs: 5.5, lh: 1.5 });
  return { bg: P.bg };
};
for (const P of POSTERS) {
  tpl('cartell-' + P.id, 'Cartell · ' + P.name, 'cartells', 'cartell pòster ' + P.name.toLowerCase(), 'a4', [posterA(P)]);
}
for (const P of POSTERS.filter(x => !x.wanted && !x.dark).slice(0, 8)) {
  tpl('cartell2-' + P.id, 'Cartell en franja · ' + P.name, 'cartells', 'cartell pòster ' + P.name.toLowerCase(), 'a4', [posterB(P)]);
}
// cartells grans A3
tpl('a3-normes', 'Normes de la classe', 'cartells', 'normes classe convivència', 'a3', [b => {
  const { W } = b;
  b.sym('banderoles', 0, 0, W, W * 0.2);
  b.title(20, 70, W - 40, 'Les normes de la nostra classe', { fs: 26, ta: 'center', c: '#1d5fa8' });
  const N = [['emo-content', 'Som amables i ens ajudem'], ['emo-pensatiu', 'Escoltem quan algú parla'], ['reciclar', 'Cuidem el material i la classe'], ['mestre', 'Aixequem la mà per parlar'], ['emo-riure', 'Ens ho passem bé aprenent']];
  N.forEach(([s, t], i) => { const y = 130 + i * 54; b.rect(26, y, W - 52, 46, ['#fff3b0', '#d7f0ff', '#e3f7d9', '#ffe0ea', '#efe6ff'][i], { r: 10 }); b.sym(s, 34, y + 4, 38); b.title(84, y + 13, W - 120, (i + 1) + '. ' + t, { fs: 12, c: INK }); });
  b.text(26, 404, W - 52, 'Signem tots: ...........................................................................', { fs: 6 });
  return { bg: '#ffffff' };
}]);
tpl('a3-mural', 'Mural del curs', 'cartells', 'mural curs collage', 'a3l', [b => {
  const { W, H } = b;
  b.sym('fons-suro', 0, 0, W, H);
  b.rect(130, 16, 160, 36, '#ffffff', { r: 4, rot: -2 });
  b.title(130, 22, 160, 'El nostre curs', { fs: 18, ta: 'center', c: '#c1121f' });
  [[20, 70, -5], [150, 76, 3], [280, 66, -2], [40, 180, 4], [170, 186, -3], [300, 176, 2]].forEach(([x, y, r]) => { b.sym('polaroid', x, y, 100, 105, { rot: r }); });
  b.sym('xinxeta', 196, 6, 22); b.sym('cinta-adhesiva', 30, 64, 40);
  return { bg: '#d9a066' };
}]);

/* ── Tríptics (A4 horitzontal, 2 cares) ────────────────────────── */
const col3 = (b, i) => ({ x: i * 99 + 8, w: 83 });
const TRIPTICS = [
  { id: 'animals', name: 'Animals del món', a: '#2d6a4f', b2: '#ffb703', bg: '#f2fbf5', cover: 'lleo', t: 'Animals del món', items: [['elefant', 'L\'elefant'], ['girafa', 'La girafa'], ['pingui', 'El pingüí'], ['balena', 'La balena']] },
  { id: 'sistema', name: 'El sistema solar', a: '#1d2552', b2: '#ffd23f', bg: '#f1f3ff', cover: 'saturn', t: 'El sistema solar', items: [['sol', 'El Sol'], ['terra', 'La Terra'], ['lluna-crat', 'La Lluna'], ['planeta', 'Els planetes']] },
  { id: 'receptes', name: 'Receptes saludables', a: '#c1121f', b2: '#7ccf5b', bg: '#fff8f0', cover: 'poma', t: 'Menjar sa', items: [['pastanaga', 'Verdures'], ['poma', 'Fruita'], ['pa', 'Cereals'], ['llet', 'Làctics']] },
  { id: 'barri', name: 'El meu barri', a: '#1d5fa8', b2: '#ff8c42', bg: '#f2f8ff', cover: 'casa', t: 'El meu barri', items: [['escola', 'L\'escola'], ['botiga', 'Les botigues'], ['arbre', 'El parc'], ['bus', 'El transport']] },
  { id: 'estacions', name: 'Les estacions', a: '#8e6cdb', b2: '#ffd23f', bg: '#fbf8ff', cover: 'arcsm', t: 'Les quatre estacions', items: [['flor', 'Primavera'], ['sol', 'Estiu'], ['arbre-tardor', 'Tardor'], ['ninot-neu', 'Hivern']] },
  { id: 'medi', name: 'Cuidem el planeta', a: '#2e8b57', b2: '#5aa9e6', bg: '#effaf4', cover: 'terra', t: 'Cuidem el planeta', items: [['reciclar', 'Reciclar'], ['gota', 'Estalviar aigua'], ['bici', 'Moure\'s en bici'], ['planta', 'Plantar arbres']] },
];
for (const Tr of TRIPTICS) {
  tpl('triptic-' + Tr.id, 'Tríptic · ' + Tr.name, 'triptics', 'tríptic fulletó treball ' + Tr.name.toLowerCase(), 'a4l', [
    b => { // exterior: interior solapa · contraportada · portada
      const c1 = col3(b, 0), c2 = col3(b, 1), c3 = col3(b, 2);
      b.line(99, 6, 99, 204, '#c9cfd8', 0.3, { dash: '4 4' }); b.line(198, 6, 198, 204, '#c9cfd8', 0.3, { dash: '4 4' });
      // portada (columna dreta)
      b.rect(198, 0, 99, 210, Tr.a);
      b.title(c3.x, 26, c3.w, Tr.t, { fs: 15, ta: 'center', c: '#ffffff' });
      b.ell(c3.x + 6, 72, 71, 71, Tr.b2, { op: 0.9 });
      b.sym(Tr.cover, c3.x + 13, 79, 57);
      b.text(c3.x, 160, c3.w, 'Fet per: {autor}\nCurs: {assignatura}', { fs: 5, ta: 'center', c: '#ffffff', fw: 600, lh: 1.4 });
      // contraportada (columna central)
      b.title(c2.x, 24, c2.w, 'Sabies que...?', { fs: 11, ta: 'center', c: Tr.a });
      b.sym('bombeta', c2.x + 26, 46, 30);
      b.text(c2.x, 84, c2.w, 'Escriu aquí una curiositat sorprenent sobre el tema. Les dades curtes i clares són les que es recorden millor.', { fs: 4.6, ta: 'center', lh: 1.35 });
      b.rect(c2.x, 150, c2.w, 40, '#ffffff', { r: 4, sw: 0.5, stroke: Tr.a });
      b.text(c2.x + 4, 156, c2.w - 8, 'Fonts consultades:\n· ............................\n· ............................', { fs: 4, lh: 1.5 });
      // solapa interior (columna esquerra)
      b.title(c1.x, 24, c1.w, 'Endevinalla', { fs: 11, ta: 'center', c: Tr.a });
      b.sym('bafarada-pensa', c1.x + 6, 44, 70, 56);
      b.text(c1.x + 16, 58, 50, 'Qui sóc?', { fs: 6, ta: 'center', fw: 700 });
      b.lines(c1.x, 120, c1.w, 6, 10);
      return { bg: Tr.bg, name: 'Exterior' };
    },
    b => { // interior: 3 columnes de contingut
      b.line(99, 6, 99, 204, '#c9cfd8', 0.3, { dash: '4 4' }); b.line(198, 6, 198, 204, '#c9cfd8', 0.3, { dash: '4 4' });
      b.rect(0, 0, 297, 22, Tr.a);
      b.title(8, 5, 281, Tr.t, { fs: 9, c: '#ffffff', ta: 'center' });
      for (let i = 0; i < 3; i++) {
        const c = col3(b, i), [s, t] = Tr.items[i + (i === 2 ? 1 : 0)];
        b.rect(c.x, 30, c.w, 64, '#ffffff', { r: 6, sw: 0.6, stroke: Tr.b2 });
        b.sym(s, c.x + 20, 34, 44);
        b.title(c.x, 80, c.w, t, { fs: 8, ta: 'center', c: Tr.a });
        b.text(c.x, 102, c.w, 'Explica-ho amb les teves paraules: com és, on viu o per a què serveix, i què t\'ha agradat més.', { fs: 4.4, lh: 1.4 });
        b.lines(c.x, 146, c.w, 5, 10);
      }
      return { bg: '#ffffff', name: 'Interior' };
    },
  ]);
}
/* ── Díptics ── */
tpl('diptic-llibre', 'Díptic · Fitxa de llibre', 'triptics', 'díptic fitxa lectura llibre', 'a4l', [
  b => { b.line(148.5, 6, 148.5, 204, '#c9cfd8', 0.3, { dash: '4 4' }); b.rect(148.5, 0, 148.5, 210, '#5a3fa0'); b.title(160, 40, 126, 'El meu llibre preferit', { fs: 18, ta: 'center', c: '#ffffff' }); b.sym('llibre', 190, 96, 64); b.text(160, 174, 126, '{autor}', { fs: 7, ta: 'center', c: '#ffffff' }); b.sym('mussol', 40, 50, 70); b.text(14, 140, 120, 'Recomanat per a nens i nenes curiosos', { fs: 6, ta: 'center' }); return { bg: '#f7f3ff', name: 'Exterior' }; },
  b => { b.line(148.5, 6, 148.5, 204, '#c9cfd8', 0.3, { dash: '4 4' }); const q = ['Títol', 'Autor/a', 'Personatges', 'De què va?', 'El que més m\'ha agradat', 'Puntuació']; q.forEach((t, i) => { const x = i < 3 ? 12 : 160, y = 16 + (i % 3) * 64; b.title(x, y, 126, t, { fs: 8, c: '#5a3fa0' }); if (t === 'Puntuació') { for (let s = 0; s < 5; s++) b.sym('estrelleta', x + s * 22, y + 14, 18); } else b.lines(x, y + 18, 126, 4, 10); }); return { bg: '#ffffff', name: 'Interior' }; },
]);

/* ── Invitacions i targetes (A5) ── */
const INV = [
  { id: 'aniversari', name: 'Aniversari', t: 'T\'hi convido!', s: 'Celebrem el meu aniversari', bg: '#fff0f5', a: '#ef476f', sy: ['pastis', 'globus-festa', 'regal'] },
  { id: 'pijama', name: 'Festa de pijama', t: 'Festa de pijama', s: 'Porta el sac de dormir i el coixí', bg: '#1d2552', a: '#ffd23f', sy: ['lluna', 'estrella', 'mussol'], dark: true },
  { id: 'final', name: 'Final de curs', t: 'Festa de final de curs', s: 'Celebrem que ja arriben les vacances!', bg: '#e9f6ff', a: '#1d5fa8', sy: ['sol', 'onada', 'gelat'] },
  { id: 'piscina', name: 'Festa a la piscina', t: 'Festa a la piscina', s: 'No t\'oblidis el banyador i la tovallola', bg: '#e6f7ff', a: '#0077b6', sy: ['nedar', 'balena', 'sol'] },
];
for (const I of INV) {
  tpl('invitacio-' + I.id, 'Invitació · ' + I.name, 'targetes', 'invitació targeta ' + I.name.toLowerCase(), 'a5', [b => {
    const W = b.W, txt = I.dark ? '#ffffff' : INK;
    b.sym('marc-dots', 6, 6, W - 12, 198);
    b.sym(I.sy[0], W / 2 - 30, 20, 60);
    b.title(14, 84, W - 28, I.t, { fs: 15, ta: 'center', c: I.a });
    b.text(14, 112, W - 28, I.s, { fs: 6, ta: 'center', c: txt });
    b.text(20, 132, W - 40, 'Dia: ............................\nHora: ..........................\nLloc: ...........................', { fs: 5.5, lh: 1.7, c: txt });
    b.sym(I.sy[1], 16, 170, 28); b.sym(I.sy[2], W - 44, 170, 28);
    b.text(14, 186, W - 28, 'Confirma-ho a: ......................', { fs: 4.5, ta: 'center', c: txt });
    return { bg: I.bg };
  }]);
}
tpl('postal-estiu', 'Postal · Estiu', 'targetes', 'postal estiu vacances', 'a5l', [b => { b.sym('fons-mar', 0, 0, 105, 148); b.sym('sol', 60, 14, 34); b.sym('veler', 16, 46, 54); b.title(8, 104, 92, 'Records de les vacances', { fs: 10, c: '#ffffff', sw: 0 }); b.line(112, 14, 112, 134, '#c9cfd8', 0.4); b.lines(120, 70, 80, 5, 12); b.rect(176, 12, 24, 30, '#fff3d6', { sw: 0.4, stroke: '#c9cfd8', dash: '2 2' }); return { bg: '#ffffff' }; }]);
tpl('postal-nadal', 'Postal · Nadal', 'targetes', 'postal nadal felicitació', 'a5l', [b => { b.sym('fons-nit', 0, 0, 105, 148); b.sym('arbre-nadal', 22, 30, 60); b.sym('floc', 8, 10, 14); b.sym('floc', 80, 96, 16); b.title(4, 112, 97, 'Bon Nadal!', { fs: 12, ta: 'center', c: '#ffd23f' }); b.line(112, 14, 112, 134, '#c9cfd8', 0.4); b.lines(120, 70, 80, 5, 12); b.sym('tio', 160, 14, 40); return { bg: '#ffffff' }; }]);
tpl('jo', 'Això sóc jo', 'targetes', 'presentació alumne sóc jo', 'a4', [b => {
  const W = b.W;
  b.sym('banderoles2', 0, 0, W, 24);
  b.title(14, 30, W - 28, 'Això sóc jo!', { fs: 24, ta: 'center', c: '#ef476f' });
  b.sym('marc-nuvol', 50, 62, 110, 100); b.text(70, 106, 70, 'Enganxa aquí la teva foto o dibuixa\'t', { fs: 4.5, ta: 'center', c: '#8a94a3' });
  const Q = [['Em dic', 'nen1'], ['Tinc ... anys', 'pastis'], ['M\'agrada', 'cor'], ['De gran vull ser', 'estrella'], ['El meu animal preferit', 'gos']];
  Q.forEach(([q, s], i) => { const y = 172 + i * 23; b.sym(s, 18, y, 16); b.title(40, y + 2, 60, q, { fs: 6.5, c: '#1d5fa8' }); b.line(104, y + 12, W - 18, y + 12, '#c9cfd8', 0.5); });
  return { bg: '#fffaf0' };
}]);

/* ── Diplomes (A4 horitzontal) ── */
const DIP = [
  { id: 'lectura', name: 'Gran lector/a', s: 'per haver llegit molts llibres aquest curs', a: '#5a3fa0', sy: 'llibre' },
  { id: 'esport', name: 'Campió/ona', s: 'per l\'esforç i el bon joc en equip', a: '#ef6f1f', sy: 'medalla' },
  { id: 'ciencia', name: 'Jove científic/a', s: 'per la curiositat i els experiments', a: '#1d5fa8', sy: 'microscopi' },
  { id: 'company', name: 'Bon company/a', s: 'per ajudar sempre els altres', a: '#2d6a4f', sy: 'cor' },
];
for (const D of DIP) {
  tpl('diploma-' + D.id, 'Diploma · ' + D.name, 'diplomes', 'diploma reconeixement premi ' + D.name.toLowerCase(), 'a4l', [b => {
    b.rect(8, 8, 281, 194, null, { sw: 2.4, stroke: D.a, r: 6 });
    b.rect(14, 14, 269, 182, null, { sw: 0.6, stroke: D.a, r: 4 });
    b.sym('insignia', 22, 22, 50); b.sym(D.sy, 33, 32, 28);
    b.title(80, 30, 200, 'DIPLOMA', { fs: 26, c: D.a, ls: 0.15 });
    b.text(80, 62, 200, 'S\'atorga a', { fs: 7 });
    b.title(30, 84, 237, 'Nom de l\'alumne/a', { fs: 20, ta: 'center', c: INK, ff: 'Fredoka', fw: 600 });
    b.line(60, 110, 237, 110, D.a, 0.6);
    b.title(30, 118, 237, D.name, { fs: 13, ta: 'center', c: D.a });
    b.text(30, 138, 237, D.s, { fs: 7, ta: 'center' });
    b.line(40, 178, 110, 178, INK, 0.4); b.text(40, 181, 70, 'Mestre/a', { fs: 4.5, ta: 'center' });
    b.line(187, 178, 257, 178, INK, 0.4); b.text(187, 181, 70, '{data}', { fs: 4.5, ta: 'center' });
    b.sym('confeti', 230, 20, 50);
    return { bg: '#fffdf5' };
  }]);
}

/* ── Escola: punts de llibre, horari, fitxes ── */
tpl('punts-llibre', 'Punts de llibre (4)', 'escola', 'punt de llibre lectura', 'a4', [b => {
  const sy = ['mussol', 'dino', 'coet', 'papallona'], cols = ['#ffe0ea', '#e3f7d9', '#d7f0ff', '#fff3b0'], ac = ['#ef476f', '#2d6a4f', '#1d5fa8', '#c77d00'];
  for (let i = 0; i < 4; i++) { const x = 12 + i * 48; b.rect(x, 12, 42, 270, cols[i], { r: 6, sw: 0.4, stroke: '#c9cfd8', dash: '3 3' }); b.ell(x + 17, 20, 8, 8, '#ffffff'); b.sym(sy[i], x + 4, 40, 34); b.title(x + 2, 90, 38, 'Llegir és viatjar', { fs: 8, ta: 'center', c: ac[i] }); b.text(x + 4, 240, 34, 'Aquest llibre és de:\n..................', { fs: 4, ta: 'center' }); }
  return { bg: '#ffffff' };
}]);
tpl('horari', 'Horari setmanal', 'escola', 'horari setmana classe', 'a4l', [b => {
  b.title(14, 10, 200, 'El meu horari', { fs: 18, c: '#1d5fa8' }); b.sym('rellotge-esc', 250, 6, 30);
  const D = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'], C = ['#ffd6e0', '#d7f0ff', '#e3f7d9', '#fff3b0', '#efe6ff'];
  D.forEach((d, i) => { b.rect(44 + i * 49, 40, 46, 14, C[i], { r: 3 }); b.title(44 + i * 49, 42.5, 46, d, { fs: 5.2, ta: 'center', ff: 'Baloo 2', fw: 600 }); });
  for (let r = 0; r < 6; r++) { b.text(10, 62 + r * 23, 32, ['9:00', '10:00', '11:00', '11:30', '12:30', '15:00'][r], { fs: 4.6, fw: 600 }); for (let i = 0; i < 5; i++) b.rect(44 + i * 49, 58 + r * 23, 46, 20, r === 3 ? '#f2f2f2' : '#ffffff', { r: 3, sw: 0.4, stroke: '#c9cfd8' }); }
  b.title(44, 128.5, 241, 'P A T I', { fs: 6, ta: 'center', c: '#8a94a3' });
  return { bg: '#ffffff' };
}]);
tpl('calendari', 'Calendari mensual', 'escola', 'calendari mes', 'a4', [b => {
  b.sym('banderoles2', 0, 0, b.W, 24);
  b.title(14, 28, b.W - 28, 'Mes de ...........', { fs: 18, ta: 'center', c: '#ef476f' });
  ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].forEach((d, i) => b.title(12 + i * 26.6, 58, 25, d, { fs: 6, ta: 'center', c: i > 4 ? '#ef476f' : '#1d5fa8' }));
  for (let r = 0; r < 6; r++) for (let i = 0; i < 7; i++) b.rect(12 + i * 26.6, 70 + r * 30, 25, 28, i > 4 ? '#fff0f5' : '#ffffff', { r: 3, sw: 0.4, stroke: '#c9cfd8' });
  b.sym('sol', 14, 256, 22); b.text(40, 262, 150, 'Dies especials: ....................................', { fs: 5 });
  return { bg: '#ffffff' };
}]);
tpl('fitxa-animal', 'Fitxa d\'animal', 'escola', 'fitxa animal ciències treball', 'a4', [b => {
  const W = b.W;
  b.rect(0, 0, W, 34, '#2d6a4f'); b.title(14, 9, W - 28, 'Fitxa de l\'animal', { fs: 16, c: '#ffffff' }); b.sym('lupa', W - 40, 4, 26);
  b.rect(14, 44, 90, 90, '#eaf7e6', { r: 8 }); b.sym('tortuga', 24, 54, 70);
  const F = ['Nom', 'On viu', 'Què menja', 'Com es mou', 'Mida'];
  F.forEach((f, i) => { b.title(112, 46 + i * 18, 80, f + ':', { fs: 6.5, c: '#2d6a4f' }); b.line(112, 58 + i * 18, W - 14, 58 + i * 18, '#c9cfd8', 0.5); });
  b.title(14, 146, W - 28, 'Curiositats', { fs: 9, c: '#2d6a4f' }); b.lines(14, 166, W - 28, 8, 12);
  b.sym('papallona', W - 36, 262, 22); b.sym('marieta', 14, 264, 18);
  return { bg: '#ffffff' };
}]);
tpl('fitxa-lectura', 'Fitxa de lectura', 'escola', 'fitxa lectura llibre', 'a4', [b => {
  const W = b.W;
  b.title(14, 14, W - 28, 'La meva fitxa de lectura', { fs: 18, c: '#5a3fa0' }); b.sym('llibre', W - 50, 8, 36);
  const F = [['Títol', 2], ['Autor/a', 1], ['Personatges principals', 3], ['Resum', 6]];
  let y = 50; for (const [f, n] of F) { b.title(14, y, 150, f, { fs: 7.5, c: '#5a3fa0' }); b.lines(14, y + 14, W - 28, n, 10); y += 18 + n * 10; }
  b.title(14, y, 150, 'Dibuixa la teva escena preferida', { fs: 7.5, c: '#5a3fa0' }); b.rect(14, y + 12, W - 28, 50, '#ffffff', { r: 6, sw: 0.5, stroke: '#c9cfd8', dash: '3 3' });
  return { bg: '#ffffff' };
}]);
tpl('mapa-tresor', 'Mapa del tresor', 'escola', 'mapa tresor joc pirates', 'a4l', [b => {
  b.rect(10, 10, 277, 190, '#f4e3c1', { r: 10, sw: 1.2, stroke: '#8a5a3b' });
  b.title(20, 18, 200, 'Mapa del tresor', { fs: 16, c: '#7a3b1e' });
  b.sym('muntanya', 30, 50, 60); b.sym('pi', 100, 120, 34); b.sym('pi', 120, 130, 28); b.sym('far', 230, 40, 40); b.sym('onada', 200, 140, 80, 50); b.sym('castell', 140, 40, 46);
  b.line(60, 110, 100, 170, '#c1121f', 1, { dash: '4 3' }); b.line(100, 170, 180, 150, '#c1121f', 1, { dash: '4 3' }); b.line(180, 150, 220, 100, '#c1121f', 1, { dash: '4 3', ae: 'tri' });
  b.title(214, 88, 20, 'X', { fs: 18, c: '#c1121f' }); b.sym('rosa-vents', 24, 150, 34);
  return { bg: '#fffaf0' };
}]);
tpl('comic3', 'Còmic de 3 vinyetes', 'escola', 'còmic historieta vinyetes', 'a4l', [b => {
  b.title(10, 8, 277, 'Títol del còmic', { fs: 14, ta: 'center', c: '#c1121f' });
  for (let i = 0; i < 3; i++) { b.rect(10 + i * 93, 30, 88, 170, '#ffffff', { sw: 1.2, r: 2 }); b.sym('bafarada', 22 + i * 93, 40, 40, 34); }
  b.sym('nen2', 30, 130, 50); b.sym('gos', 130, 140, 40); b.sym('bafarada-crit', 205, 120, 60);
  return { bg: '#fffef5' };
}]);
tpl('comic6', 'Còmic de 6 vinyetes', 'escola', 'còmic historieta vinyetes', 'a4', [b => {
  b.title(10, 8, 190, 'La meva historieta', { fs: 14, ta: 'center', c: '#1d5fa8' });
  for (let i = 0; i < 6; i++) { const x = 10 + (i % 2) * 96, y = 30 + Math.floor(i / 2) * 88; b.rect(x, y, 92, 84, '#ffffff', { sw: 1.2, r: 2 }); b.text(x + 3, y + 2, 10, String(i + 1), { fs: 5, fw: 700, c: '#8a94a3' }); }
  b.sym('bafarada', 20, 40, 40, 32);
  return { bg: '#ffffff' };
}]);
tpl('medalles', 'Full d\'insígnies', 'escola', 'insígnies adhesius medalles premis', 'a4', [b => {
  const T2 = ['Molt bé!', 'Genial!', 'Fantàstic!', 'Bona feina!', 'Ets un crac!', 'Ho has aconseguit!'], S2 = ['estrella', 'trofeu', 'cor', 'medalla', 'coet', 'sol'];
  for (let i = 0; i < 12; i++) { const x = 14 + (i % 3) * 63, y = 14 + Math.floor(i / 3) * 70; b.sym('insignia', x, y, 56); b.sym(S2[i % 6], x + 16, y + 10, 24); b.title(x, y + 34, 56, T2[i % 6], { fs: 5.4, ta: 'center', c: '#7a3b1e' }); }
  return { bg: '#ffffff' };
}]);
tpl('menu', 'Menú setmanal', 'escola', 'menú menjador alimentació', 'a4', [b => {
  const W = b.W;
  b.title(14, 14, W - 28, 'Menú de la setmana', { fs: 18, ta: 'center', c: '#c1121f' });
  const D = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'], S2 = ['pastanaga', 'pizza', 'peix', 'tomaquet', 'pastis'];
  D.forEach((d, i) => { const y = 46 + i * 48; b.rect(14, y, W - 28, 42, i % 2 ? '#fff8f0' : '#f2fbf5', { r: 8 }); b.sym(S2[i], 20, y + 4, 34); b.title(62, y + 6, 100, d, { fs: 8, c: '#c1121f' }); b.text(62, y + 20, W - 90, 'Primer: ..................   Segon: ..................   Postres: ..........', { fs: 4.6 }); });
  return { bg: '#ffffff' };
}]);
tpl('diari', 'Pàgina de diari', 'escola', 'diari escriure redacció', 'a4', [b => {
  const W = b.W;
  b.sym('fons-quadres', 0, 0, W, 297);
  b.title(28, 16, 120, 'Querit diari...', { fs: 14, c: '#ef476f' }); b.text(140, 22, 56, 'Data: {data}', { fs: 5 });
  b.sym('emo-content', W - 34, 40, 20); b.text(110, 46, 70, 'Avui em sento:', { fs: 5, ta: 'right' });
  b.sym('cinta-adhesiva', 140, 200, 40); b.sym('polaroid', 130, 206, 66, 70, { rot: 4 });
  return { bg: '#ffffff' };
}]);

/* ── Xarxes / pantalla ── */
tpl('presentacio-projecte', 'Presentació de projecte', 'presentacions', 'presentació diapositives projecte', 'hd', [
  b => { b.rect(0, 0, 1920, 1080, '#5a3fa0'); b.sym('confeti', 1400, 40, 460); b.title(140, 300, 1300, 'El nostre projecte', { fs: 140, c: '#ffffff' }); b.text(140, 520, 1200, 'Classe de {assignatura} · {autor}', { fs: 48, c: '#e6dcff' }); b.sym('coet', 1380, 480, 420); return { bg: '#5a3fa0', name: 'Portada' }; },
  b => { b.title(120, 90, 1600, 'Què volíem descobrir?', { fs: 90, c: '#5a3fa0' }); b.sym('lupa', 1420, 300, 360); b.text(120, 300, 1180, 'Escriu aquí la pregunta del projecte i per què ens interessava.', { fs: 52, lh: 1.35 }); return { bg: '#ffffff', name: 'Pregunta' }; },
  b => { b.title(120, 90, 1600, 'Què hem fet?', { fs: 90, c: '#5a3fa0' }); ['1', '2', '3'].forEach((n, i) => { b.rect(120 + i * 580, 300, 520, 560, ['#ffe0ea', '#d7f0ff', '#e3f7d9'][i], { r: 40 }); b.title(170 + i * 580, 340, 420, 'Pas ' + n, { fs: 70, c: '#5a3fa0' }); b.text(170 + i * 580, 460, 420, 'Explica breument aquest pas.', { fs: 44 }); }); return { bg: '#ffffff', name: 'Procés' }; },
  b => { b.rect(0, 0, 1920, 1080, '#ffd23f'); b.title(120, 380, 1500, 'Moltes gràcies!', { fs: 160, c: '#5a3fa0' }); b.sym('emo-riure', 1460, 300, 360); return { bg: '#ffd23f', name: 'Final' }; },
]);
tpl('xarxes-anunci', 'Anunci quadrat', 'presentacions', 'xarxes publicació anunci quadrat', 'sq', [b => { b.sym('fons-confeti', 0, 0, 1080, 1080); b.sym('bafarada-crit', 140, 120, 800, 800); b.title(260, 400, 560, 'Notícia de la classe!', { fs: 92, ta: 'center', c: '#c1121f' }); b.text(220, 700, 640, 'Escriu aquí la notícia', { fs: 44, ta: 'center' }); return { bg: '#fff0f5' }; }]);

const pack = {
  format: 'guaitaLlencPack', version: 1, id: 'infantil', name: 'Infantil i escolar', app: 'guaitaLlenç 0.12',
  description: 'Plantilles i il·lustracions per a nens i nenes de 6 a 16 anys: cartells, tríptics, invitacions, diplomes i material d\'aula.',
  author: 'SBS BiM Consulting, Jordi Subirós', license: 'AGPL-3.0-only (codi) · il·lustracions originals sota la mateixa llicència',
  created: new Date().toISOString().slice(0, 10),
  cats: { cartells: 'Cartells', triptics: 'Tríptics i díptics', targetes: 'Invitacions i targetes', diplomes: 'Diplomes', escola: 'Material d\'aula', presentacions: 'Presentacions i xarxes' },
  symCats: SYM_CATS,
  palettes: [{ id: 'vius', name: 'Colors vius', c: ['#ef476f', '#5aa9e6', '#ffd23f', '#2d2a32', '#fff8e1', '#7ccf5b'] }, { id: 'caramel', name: 'Caramel', c: ['#8e6cdb', '#ff8fb1', '#ffd166', '#2d2a32', '#fff0f5', '#8ecae6'] }],
  symbols: SYMBOLS,
  templates: T,
};
fs.writeFileSync(new URL('./infantil.llencpack.json', import.meta.url), JSON.stringify(pack));
console.log('plantilles:', T.length, 'pàgines:', T.reduce((a, t) => a + t.pages.length, 0), 'símbols:', SYMBOLS.length, 'mida:', (JSON.stringify(pack).length / 1024).toFixed(0) + ' KB');
