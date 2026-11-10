/* ── Biblioteca: paletes, estils, camps, plantilles i símbols ─── */
const COLOR_NAMES = ['Principal', 'Secundari', 'Accent', 'Text', 'Fons', 'Neutre'];
const PALETTES = [
  { id: 'grafit', name: 'Grafit', c: ['#1f2a2e', '#3d6b73', '#e85d3f', '#16191a', '#eef0ee', '#8a9490'] },
  { id: 'caixeti', name: 'Caixetí', c: ['#0b0d0c', '#2c3430', '#c8ff2e', '#111413', '#f3f5f2', '#7b8580'] },
  { id: 'institucional', name: 'Institucional', c: ['#1b3a5c', '#2f6ea3', '#e0a100', '#14202c', '#f3f5f8', '#8b98a6'] },
  { id: 'terracota', name: 'Terracota', c: ['#7a3b2e', '#c4693d', '#e9b44c', '#2b1d17', '#f6efe6', '#a89282'] },
  { id: 'mediterrani', name: 'Mediterrani', c: ['#0f4c75', '#3282b8', '#f2a541', '#102a3b', '#f4f7f9', '#8fa6b5'] },
  { id: 'bosc', name: 'Bosc', c: ['#2d4a3e', '#5b8c5a', '#d9a441', '#1c2a24', '#f1f3ec', '#8c9a8a'] },
  { id: 'pastel', name: 'Pastel', c: ['#5a5d9d', '#9fb4d8', '#f4a7a3', '#2e2f45', '#fbf7f2', '#b9b3c9'] },
  { id: 'mono', name: 'Monocrom', c: ['#111111', '#444444', '#888888', '#111111', '#f2f2f2', '#aaaaaa'] },
];
// estils de text: mida en fracció del costat curt de la pàgina
const TSTYLE_DEFS = [
  { id: 't1', name: 'Títol', ff: 'IBM Plex Sans', fw: 700, k: 0.075, lh: 1.1, ls: -0.01, col: 'c4' },
  { id: 't2', name: 'Subtítol', ff: 'IBM Plex Sans', fw: 500, k: 0.04, lh: 1.2, ls: 0, col: 'c2' },
  { id: 't3', name: 'Cos', ff: 'IBM Plex Sans', fw: 400, k: 0.021, lh: 1.45, ls: 0, col: 'c4' },
  { id: 't4', name: 'Peu', ff: 'IBM Plex Sans', fw: 400, k: 0.015, lh: 1.3, ls: 0, col: 'c6' },
  { id: 't5', name: 'Etiqueta', ff: 'IBM Plex Sans', fw: 600, k: 0.014, lh: 1.2, ls: 0.08, tt: 'upper', col: 'c3' },
  { id: 't6', name: 'Dada', ff: 'IBM Plex Sans', fw: 700, k: 0.12, lh: 1, ls: -0.02, col: 'c3' },
  { id: 't7', name: 'Cita', ff: 'IBM Plex Serif', fw: 400, fi: true, k: 0.035, lh: 1.3, ls: 0, col: 'c1' },
];
const TYPO_KEYS = ['ff', 'fs', 'fw', 'fi', 'lh', 'ls', 'tt', 'deco'];

const Lib = GL.lib = {
  PALETTES, TSTYLE_DEFS,
  initDocStyles(doc, S, keep) {
    const P = PALETTES[0];
    if (!doc.props.colors || !keep) doc.props.colors = P.c.map((c, i) => ({ id: 'c' + (i + 1), name: COLOR_NAMES[i], c: c + 'ff' }));
    if (!doc.props.tstyles || !keep) doc.props.tstyles = TSTYLE_DEFS.map(t => ({ id: t.id, name: t.name, ff: t.ff, fw: t.fw, fi: !!t.fi, fs: rnd(Math.max(6, S * t.k), 1), lh: t.lh, ls: t.ls, tt: t.tt || 'none', deco: 'none', col: t.col }));
    if (!doc.props.fields) doc.props.fields = { assignatura: '' };
    doc.props.palette = doc.props.palette || P.id;
    doc.props.styleBase = doc.props.styleBase || S;
  },

  /* ── camps variables ── */
  BUILTIN: [['títol', 'Títol del document'], ['autor', 'Autor'], ['data', 'Data'], ['pàgina', 'Número de pàgina'], ['pàgines', 'Total de pàgines']],
  fieldValue(key, o, d) {
    const k = norm(key.trim());
    const pr = d.props;
    if (k === 'titol') return pr.name || '';
    if (k === 'autor') return pr.author || '';
    if (k === 'data') return pr.date || new Date().toLocaleDateString('ca', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (k === 'pagina' || k === 'pagines') {
      const pages = Object.values(d.pages).sort(byZ);
      if (k === 'pagines') return String(pages.length);
      const i = pages.findIndex(p => p.id === (o && o.page));
      return String(i + 1 || 1);
    }
    const f = pr.fields || {};
    for (const fk in f) if (norm(fk) === k) return f[fk];
    return null;
  },
  fieldText(o) {
    const t = o.text || '';
    if (!t.includes('{')) return t;
    const d = R.doc();
    if (!d) return t;
    return t.replace(/\{([^{}\n]{1,40})\}/g, (m, k) => { const v = this.fieldValue(k, o, d); return v == null ? m : v; });
  },
  fieldList() {
    const d = App.store.doc;
    return this.BUILTIN.map(x => x[0]).concat(Object.keys(d.props.fields || {}));
  },
  // recalcula la mida dels textos amb camps (després de canviar-los)
  refitFields() {
    const st = App.store;
    for (const id in st.doc.objs) { const o = st.doc.objs[id]; if (o.type === 'text' && (o.text || '').includes('{')) patchText(o, {}); }
  },

  /* ── colors amb nom i paletes ── */
  colors() { return App.store.props.colors || []; },
  applyPalette(pid) {
    const P = PALETTES.find(x => x.id === pid); if (!P) return;
    const st = App.store;
    st.begin('Paleta ' + P.name);
    const cols = clone(this.colors());
    P.c.forEach((c, i) => { if (cols[i]) cols[i].c = c + 'ff'; else cols.push({ id: 'c' + (i + 1), name: COLOR_NAMES[i], c: c + 'ff' }); });
    st.setDoc('colors', cols); st.setDoc('palette', pid);
    st.commit();
    UI.toast('Paleta «' + P.name + '» aplicada');
  },
  setColor(id, c) {
    const cols = clone(this.colors()); const x = cols.find(q => q.id === id); if (!x) return;
    x.c = c; App.store.setDoc('colors', cols);
  },
  addColor(c, name) {
    const cols = clone(this.colors());
    let n = cols.length + 1, id; do { id = 'c' + n++; } while (cols.some(q => q.id === id));
    cols.push({ id, name: name || 'Color ' + (cols.length + 1), c });
    App.store.setDoc('colors', cols);
    return id;
  },
  removeColor(id) {
    const st = App.store;
    const nc = this.colors().find(q => q.id === id); if (!nc) return;
    // desenllaça els objectes que el fan servir
    for (const oid in st.doc.objs) { const o = st.doc.objs[oid]; for (const k of ['fill', 'stroke']) if (o[k] && o[k].ref === id) st.set(oid, k, { t: 'solid', c: nc.c }); }
    st.setDoc('colors', this.colors().filter(q => q.id !== id));
  },
  applyColorToSel(id) {
    const st = App.store, nc = this.colors().find(q => q.id === id); if (!nc) return;
    const objs = App.objs(); if (!objs.length) { UI.toast('Selecciona algun objecte per aplicar-hi el color', 'warn'); return; }
    st.begin('Aplica ' + nc.name);
    const paint = { t: 'solid', c: nc.c, ref: id };
    const walk = o => {
      if (o.type === 'group') return st.children(o.id).forEach(walk);
      if (o.type === 'line' || (o.type === 'path' && (!o.fill || o.fill.t === 'none'))) { st.set(o.id, 'stroke', paint); if (!(o.sw > 0)) st.set(o.id, 'sw', 2); }
      else if (o.type === 'image') { st.set(o.id, 'stroke', paint); if (!(o.sw > 0)) st.set(o.id, 'sw', 2); }
      else st.set(o.id, 'fill', paint);
    };
    objs.forEach(walk);
    st.commit();
  },
  colorOf(ref) { const nc = this.colors().find(q => q.id === ref); return nc ? nc.name : null; },

  /* ── estils de text ── */
  tstyles() { return App.store.props.tstyles || []; },
  tstylePatch(s, doc) {
    const p = { ts: s.id };
    for (const k of TYPO_KEYS) if (s[k] !== undefined) p[k] = s[k];
    if (s.col) { const d = doc || App.store.doc; const nc = (d.props.colors || []).find(q => q.id === s.col); if (nc) p.fill = { t: 'solid', c: nc.c, ref: s.col }; }
    return p;
  },
  applyTStyle(id, objs) {
    const s = this.tstyles().find(q => q.id === id); if (!s) return;
    const st = App.store;
    objs = (objs || App.objs()).filter(o => o.type === 'text');
    if (!objs.length) { UI.toast('Selecciona un text per aplicar-hi l\'estil', 'warn'); return; }
    st.begin('Estil ' + s.name);
    for (const o of objs) patchText(o, this.tstylePatch(s));
    st.commit();
  },
  // desa l'estil a partir d'un text i el propaga als textos enllaçats
  updateTStyle(id, from) {
    const st = App.store;
    const list = clone(this.tstyles()); const s = list.find(q => q.id === id); if (!s || !from) return;
    for (const k of TYPO_KEYS) s[k] = from[k] !== undefined ? from[k] : s[k];
    s.col = from.fill && from.fill.ref ? from.fill.ref : s.col;
    st.begin('Actualitza l\'estil ' + s.name);
    st.setDoc('tstyles', list);
    for (const oid in st.doc.objs) { const o = st.doc.objs[oid]; if (o.type === 'text' && o.ts === id && oid !== from.id) patchText(o, this.tstylePatch(s)); }
    st.commit();
    UI.toast('Estil «' + s.name + '» actualitzat');
  },
  newTStyle(from) {
    const st = App.store;
    const list = clone(this.tstyles());
    let n = list.length + 1, id; do { id = 't' + n++; } while (list.some(q => q.id === id));
    const s = { id, name: 'Estil ' + (list.length + 1) };
    for (const k of TYPO_KEYS) s[k] = from[k];
    s.col = from.fill && from.fill.ref ? from.fill.ref : null;
    list.push(s);
    st.begin('Estil nou'); st.setDoc('tstyles', list); st.set(from.id, 'ts', id); st.commit();
    return id;
  },
  removeTStyle(id) {
    const st = App.store;
    st.begin('Elimina l\'estil');
    for (const oid in st.doc.objs) if (st.doc.objs[oid].ts === id) st.set(oid, 'ts', undefined);
    st.setDoc('tstyles', this.tstyles().filter(q => q.id !== id));
    st.commit();
  },
  renameItem(kind, id, name) {
    const st = App.store;
    const key = kind === 'color' ? 'colors' : 'tstyles';
    const list = clone(st.props[key]); const x = list.find(q => q.id === id); if (!x) return;
    x.name = name; st.begin('Reanomena'); st.setDoc(key, list); st.commit();
  },
};

/* ── constructor de plantilles ──────────────────────────────────── */
function TB(W, H, doc) {
  const S = Math.min(W, H), m = S * 0.06;
  const base = doc.props.styleBase || S;
  const k = S / base;
  const col = (ref, a) => { if (ref && ref[0] === '#') return { t: 'solid', c: hexA(ref) }; const nc = doc.props.colors.find(q => q.id === ref) || doc.props.colors[0]; let c = nc.c; if (a != null) { const q = rgbaOf(c); c = toHexA(q.r, q.g, q.b, a); return { t: 'solid', c }; } return { t: 'solid', c, ref }; };
  const B = {
    W, H, S, m,
    X: p => W * p / 100, Y: p => H * p / 100,
    rect: (x, y, w, h, c, o = {}) => Object.assign({ type: 'rect', x, y, w, h, r: o.r || 0, fill: c ? col(c, o.a) : { t: 'none', c: '#000000ff' }, stroke: o.stroke ? col(o.stroke) : { t: 'solid', c: '#1a1a1aff' }, sw: o.sw || 0 }, o.extra || {}),
    ellipse: (x, y, w, h, c, o = {}) => ({ type: 'ellipse', x, y, w, h, fill: c ? col(c, o.a) : { t: 'none', c: '#000000ff' }, stroke: o.stroke ? col(o.stroke) : { t: 'solid', c: '#1a1a1aff' }, sw: o.sw || 0 }),
    line: (x1, y1, x2, y2, c, sw = S * 0.003, o = {}) => ({ type: 'line', p1: pt(x1, y1), p2: pt(x2, y2), fill: { t: 'none', c: '#000000ff' }, stroke: col(c), sw, cap: 'butt', ae: o.ae, dash: o.dash }),
    text: (x, y, w, txt, sid, o = {}) => {
      const s = doc.props.tstyles.find(q => q.id === sid) || doc.props.tstyles[2];
      const t = Object.assign({ type: 'text', x, y, w, text: txt, auto: 'h', ta: o.ta || 'left' }, Lib.tstylePatch(s, doc));
      if (Math.abs(k - 1) > 0.02) { t.fs = rnd(t.fs * k, 1); delete t.ts; }
      if (o.scale) { t.fs = rnd(t.fs * o.scale, 1); delete t.ts; }
      if (o.c) { t.fill = col(o.c); }
      if (o.fw) { t.fw = o.fw; delete t.ts; }
      if (o.anchor === 'bottom') t._bottom = y;
      return t;
    },
    img: (x, y, w, h, label) => ({ type: 'group', name: 'Imatge (espai reservat)', kids: [B.rect(x, y, w, h, 'c6', { a: 0.22 }), B.text(x, y + h / 2 - S * 0.012, w, label || 'Imatge', 't4', { ta: 'center' })] }),
    // caixetí amb camps variables
    caixeti(y, h) {
      const out = [B.line(m, y, W - m, y, 'c4', S * 0.002)];
      const cols = [['Títol', '{títol}', 0.34], ['Autor', '{autor}', 0.22], ['Assignatura', '{assignatura}', 0.22], ['Data', '{data}', 0.13], ['Làmina', '{pàgina}/{pàgines}', 0.09]];
      let x = m; const tw = W - 2 * m;
      cols.forEach(([lab, f, fr], i) => {
        const w = tw * fr;
        if (i) out.push(B.line(x, y, x, y + h, 'c6', S * 0.0012));
        out.push(B.text(x + S * 0.008, y + h * 0.16, w - S * 0.016, lab, 't5'));
        out.push(B.text(x + S * 0.008, y + h * 0.48, w - S * 0.016, f, 't3', { scale: i === 0 ? 1.15 : 0.95, fw: i === 0 ? 600 : 400 }));
        x += w;
      });
      return out;
    },
  };
  return B;
}
const LOREM = 'Text de mostra per substituir. Descriu aquí la idea principal del projecte, el context i els objectius en poques línies.';
const pr = id => PAGE_PRESETS.find(p => p.id === id);
const land = id => { const p = pr(id); return { w: Math.max(p.w, p.h), h: Math.min(p.w, p.h), unit: p.unit }; };
const port = id => { const p = pr(id); return { w: Math.min(p.w, p.h), h: Math.max(p.w, p.h), unit: p.unit }; };
const px = (w, h) => ({ w, h, unit: 'px' });

const PRES = {
  cover: B => [B.rect(0, 0, B.W, B.H, 'c1'), B.rect(B.m, B.Y(62), B.S * 0.12, B.S * 0.012, 'c3'), B.text(B.m, B.Y(30), B.X(70), 'Títol de la presentació', 't1', { c: 'c5', scale: 1.2 }), B.text(B.m, B.Y(68), B.X(60), 'Subtítol o context', 't2', { c: 'c6' }), B.text(B.m, B.Y(86), B.X(60), '{autor} · {data}', 't4', { c: 'c6' })],
  section: B => [B.rect(0, 0, B.X(38), B.H, 'c2'), B.text(B.m, B.Y(40), B.X(38) - 2 * B.m, '01', 't6', { c: 'c5' }), B.text(B.X(44), B.Y(42), B.X(48), 'Nom de la secció', 't1'), B.text(B.X(44), B.Y(58), B.X(46), 'Una frase que introdueixi el que ve a continuació.', 't2')],
  textimg: B => [B.text(B.m, B.m, B.X(40), 'Títol de la diapositiva', 't1', { scale: 0.7 }), B.text(B.m, B.Y(34), B.X(38), LOREM + ' ' + LOREM, 't3', { scale: 1.1 }), B.img(B.X(50), 0, B.X(50), B.H), B.text(B.m, B.Y(92), B.X(30), '{pàgina}', 't4')],
  twocol: B => [B.text(B.m, B.m, B.X(80), 'Dues columnes', 't1', { scale: 0.7 }), B.rect(B.m, B.Y(28), B.S * 0.08, B.S * 0.008, 'c3'), B.text(B.m, B.Y(34), B.X(40), 'Primer punt', 't2', { scale: 0.8 }), B.text(B.m, B.Y(44), B.X(40), LOREM, 't3', { scale: 1.1 }), B.text(B.X(54), B.Y(34), B.X(40), 'Segon punt', 't2', { scale: 0.8 }), B.text(B.X(54), B.Y(44), B.X(40), LOREM, 't3', { scale: 1.1 }), B.text(B.m, B.Y(92), B.X(30), '{pàgina}', 't4')],
  quote: B => [B.rect(0, 0, B.W, B.H, 'c5'), B.text(B.X(12), B.Y(14), B.X(20), '“', 't6', { c: 'c3', scale: 2 }), B.text(B.X(18), B.Y(32), B.X(64), 'Una cita breu i potent que resumeixi la idea central.', 't7', { scale: 1.6 }), B.text(B.X(18), B.Y(72), B.X(60), '— Nom de l\'autor', 't4', { scale: 1.3 })],
  end: B => [B.rect(0, 0, B.W, B.H, 'c4'), B.text(B.m, B.Y(38), B.X(80), 'Gràcies', 't1', { c: 'c5', scale: 1.4, ta: 'left' }), B.rect(B.m, B.Y(58), B.S * 0.12, B.S * 0.012, 'c3'), B.text(B.m, B.Y(64), B.X(60), 'contacte@exemple.cat · {autor}', 't2', { c: 'c6', scale: 0.8 })],
};

const TEMPLATES = [
  // paper
  { id: 'poster-clas', name: 'Pòster clàssic', cat: 'paper', size: () => port('a2'), pages: [B => [B.rect(0, 0, B.W, B.Y(22), 'c1'), B.text(B.m, B.Y(5), B.X(80), 'Títol del pòster', 't1', { c: 'c5', scale: 1.2 }), B.text(B.m, B.Y(14), B.X(80), 'Subtítol del projecte o de l\'esdeveniment', 't2', { c: 'c6' }), B.img(B.m, B.Y(26), B.W - 2 * B.m, B.Y(38)), B.text(B.m, B.Y(68), B.X(42), LOREM + ' ' + LOREM, 't3'), B.text(B.X(54), B.Y(68), B.X(40), LOREM, 't3'), ...B.caixeti(B.Y(92), B.Y(6))]] },
  { id: 'poster-bold', name: 'Pòster impacte', cat: 'paper', size: () => port('a3'), pages: [B => [B.rect(0, 0, B.W, B.H, 'c1'), B.rect(B.m, B.Y(8), B.S * 0.16, B.S * 0.02, 'c3'), B.text(B.m, B.Y(14), B.X(86), 'GRAN TÍTOL EN DUES LÍNIES', 't1', { c: 'c5', scale: 1.5 }), B.ellipse(B.X(48), B.Y(46), B.X(70), B.X(70), 'c3', { a: 0.9 }), B.text(B.m, B.Y(84), B.X(50), 'Data, lloc i informació pràctica', 't2', { c: 'c5' }), B.text(B.m, B.Y(91), B.X(60), '{autor}', 't4', { c: 'c6' })]] },
  { id: 'poster-event', name: 'Cartell d\'acte', cat: 'paper', size: () => port('a3'), pages: [B => [B.rect(0, 0, B.W, B.H, 'c5'), B.text(B.m, B.m, B.X(60), 'Jornada · conferència', 't5'), B.text(B.m, B.Y(12), B.X(50), '24', 't6', { scale: 1.8 }), B.text(B.m, B.Y(30), B.X(50), 'Novembre 2026', 't2'), B.line(B.m, B.Y(38), B.W - B.m, B.Y(38), 'c4'), B.text(B.m, B.Y(42), B.X(86), 'Títol de l\'acte', 't1', { scale: 1.1 }), B.img(B.m, B.Y(60), B.W - 2 * B.m, B.Y(26)), B.text(B.m, B.Y(90), B.X(60), 'Lloc · hora · inscripció', 't3')]] },
  { id: 'lamina-a3', name: 'Làmina A3 amb caixetí', cat: 'paper', size: () => land('a3'), pages: [B => [B.text(B.m, B.m * 0.8, B.X(60), 'Títol de la làmina', 't1', { scale: 0.6 }), B.img(B.m, B.Y(16), B.X(44), B.Y(64), 'Planta'), B.img(B.X(52), B.Y(16), B.X(42), B.Y(30), 'Secció'), B.img(B.X(52), B.Y(50), B.X(42), B.Y(30), 'Alçat'), ...B.caixeti(B.Y(85), B.Y(10))]] },
  { id: 'lamina-a1', name: 'Làmina A1 de projecte', cat: 'paper', size: () => land('a1'), pages: [B => [B.img(B.m, B.m, B.X(62), B.Y(76), 'Imatge principal'), B.text(B.X(70), B.m, B.X(25), 'Títol del projecte', 't1', { scale: 0.7 }), B.rect(B.X(70), B.Y(20), B.S * 0.06, B.S * 0.006, 'c3'), B.text(B.X(70), B.Y(24), B.X(25), LOREM + ' ' + LOREM + ' ' + LOREM, 't3'), B.img(B.X(70), B.Y(52), B.X(25), B.Y(30), 'Esquema'), ...B.caixeti(B.Y(88), B.Y(7))]] },
  { id: 'portada', name: 'Portada de dossier', cat: 'paper', size: () => port('a4'), pages: [B => [B.rect(0, 0, B.X(8), B.H, 'c3'), B.text(B.X(16), B.Y(14), B.X(70), '{assignatura}', 't5'), B.text(B.X(16), B.Y(20), B.X(76), '{títol}', 't1', { scale: 1.1 }), B.text(B.X(16), B.Y(40), B.X(70), 'Subtítol del treball', 't2'), B.img(B.X(16), B.Y(50), B.X(76), B.Y(30)), B.text(B.X(16), B.Y(86), B.X(70), '{autor}', 't3', { fw: 600 }), B.text(B.X(16), B.Y(90), B.X(70), '{data}', 't4')]] },
  { id: 'informe', name: 'Pàgina d\'informe', cat: 'paper', size: () => port('a4'), pages: [B => [B.text(B.m, B.m, B.X(60), '{títol}', 't4'), B.line(B.m, B.m * 1.6, B.W - B.m, B.m * 1.6, 'c6', B.S * 0.0012), B.text(B.m, B.Y(10), B.X(80), 'Encapçalament de capítol', 't1', { scale: 0.6 }), B.text(B.m, B.Y(18), B.X(42), LOREM + ' ' + LOREM + ' ' + LOREM, 't3'), B.text(B.X(52), B.Y(18), B.X(42), LOREM + ' ' + LOREM, 't3'), B.img(B.m, B.Y(50), B.W - 2 * B.m, B.Y(30)), B.text(B.m, B.Y(81), B.X(60), 'Figura 1 · Peu de figura', 't4'), B.text(B.m, B.Y(94), B.W - 2 * B.m, '{pàgina}', 't4', { ta: 'right' })]] },
  { id: 'diptic', name: 'Díptic', cat: 'paper', size: () => land('a4'), pages: [
    B => [B.rect(B.X(50), 0, B.X(50), B.H, 'c1'), B.text(B.X(55), B.Y(30), B.X(40), 'Títol del díptic', 't1', { c: 'c5' }), B.text(B.X(55), B.Y(60), B.X(40), 'Subtítol', 't2', { c: 'c6' }), B.text(B.m, B.Y(70), B.X(38), 'Informació de contacte\nadreça · web · correu', 't3')],
    B => [B.text(B.m, B.m, B.X(38), 'Interior', 't5'), B.text(B.m, B.Y(14), B.X(40), 'Títol de l\'interior', 't1', { scale: 0.6 }), B.text(B.m, B.Y(28), B.X(40), LOREM + ' ' + LOREM, 't3'), B.img(B.X(54), B.m, B.X(40), B.H - 2 * B.m)],
  ] },
  { id: 'targeta', name: 'Targeta de visita', cat: 'paper', size: () => land('card'), pages: [B => [B.rect(0, 0, B.X(4), B.H, 'c3'), B.text(B.X(12), B.Y(22), B.X(80), 'Nom i cognoms', 't2', { scale: 1.3, fw: 600, c: 'c4' }), B.text(B.X(12), B.Y(40), B.X(80), 'Càrrec o professió', 't4', { scale: 1.6 }), B.text(B.X(12), B.Y(66), B.X(80), 'telèfon · correu@exemple.cat\nweb.exemple.cat', 't4', { scale: 1.5, c: 'c4' })]] },
  { id: 'minimal', name: 'Cartell minimal', cat: 'paper', size: () => port('a4'), pages: [B => [B.line(B.m, B.Y(20), B.W - B.m, B.Y(20), 'c4'), B.text(B.m, B.Y(40), B.W - 2 * B.m, 'Títol centrat', 't1', { ta: 'center' }), B.text(B.m, B.Y(56), B.W - 2 * B.m, 'Una línia de context', 't2', { ta: 'center' }), B.line(B.m, B.Y(80), B.W - B.m, B.Y(80), 'c4'), B.text(B.m, B.Y(84), B.W - 2 * B.m, '{data}', 't4', { ta: 'center' })]] },
  // presentació
  { id: 'pres-set', name: 'Presentació completa', cat: 'pres', size: () => px(1920, 1080), pages: [PRES.cover, PRES.section, PRES.textimg, PRES.twocol, PRES.quote, PRES.end] },
  { id: 'pres-cover', name: 'Portada', cat: 'pres', size: () => px(1920, 1080), pages: [PRES.cover] },
  { id: 'pres-section', name: 'Secció', cat: 'pres', size: () => px(1920, 1080), pages: [PRES.section] },
  { id: 'pres-textimg', name: 'Text i imatge', cat: 'pres', size: () => px(1920, 1080), pages: [PRES.textimg] },
  { id: 'pres-twocol', name: 'Dues columnes', cat: 'pres', size: () => px(1920, 1080), pages: [PRES.twocol] },
  { id: 'pres-quote', name: 'Cita', cat: 'pres', size: () => px(1920, 1080), pages: [PRES.quote] },
  { id: 'pres-end', name: 'Tancament', cat: 'pres', size: () => px(1920, 1080), pages: [PRES.end] },
  // xarxes
  { id: 'sq-ad', name: 'Anunci quadrat', cat: 'social', size: () => px(1080, 1080), pages: [B => [B.img(0, 0, B.W, B.Y(60)), B.rect(0, B.Y(60), B.W, B.Y(40), 'c1'), B.text(B.m, B.Y(66), B.X(86), 'Missatge principal', 't1', { c: 'c5', scale: 0.8 }), B.text(B.m, B.Y(86), B.X(86), 'Data · lloc · enllaç', 't2', { c: 'c3', scale: 0.7 })]] },
  { id: 'sq-quote', name: 'Cita quadrada', cat: 'social', size: () => px(1080, 1080), pages: [B => [B.rect(0, 0, B.W, B.H, 'c3'), B.text(B.m, B.Y(12), B.X(20), '“', 't6', { c: 'c1', scale: 1.8 }), B.text(B.m * 1.4, B.Y(34), B.X(80), 'Una frase que valgui la pena compartir.', 't7', { c: 'c1', scale: 1.6 }), B.text(B.m * 1.4, B.Y(82), B.X(80), '@compte', 't2', { c: 'c1', scale: 0.7 })]] },
  { id: 'vert', name: 'Publicació vertical', cat: 'social', size: () => px(1080, 1350), pages: [B => [B.rect(0, 0, B.W, B.H, 'c5'), B.text(B.m, B.m, B.X(80), 'Novetat', 't5', { scale: 1.6 }), B.text(B.m, B.Y(10), B.X(86), 'Títol de la publicació', 't1', { scale: 0.9 }), B.img(B.m, B.Y(32), B.W - 2 * B.m, B.Y(52)), B.text(B.m, B.Y(88), B.X(86), 'Text breu amb la crida a l\'acció', 't3', { scale: 1.5 })]] },
  { id: 'story', name: 'Història', cat: 'social', size: () => px(1080, 1920), pages: [B => [B.img(0, 0, B.W, B.H, 'Imatge de fons'), B.rect(0, B.Y(60), B.W, B.Y(40), 'c1', { a: 0.85 }), B.text(B.m, B.Y(64), B.X(86), 'Títol de la història', 't1', { c: 'c5' }), B.text(B.m, B.Y(80), B.X(86), 'Llisca cap amunt', 't2', { c: 'c3', scale: 0.8 })]] },
  { id: 'banner', name: 'Bàner', cat: 'social', size: () => px(1500, 500), pages: [B => [B.rect(0, 0, B.W, B.H, 'c1'), B.rect(B.X(62), 0, B.X(38), B.H, 'c2'), B.text(B.m, B.Y(26), B.X(54), 'Nom o lema', 't1', { c: 'c5', scale: 0.9 }), B.text(B.m, B.Y(66), B.X(54), 'Una línia de descripció', 't2', { c: 'c6', scale: 0.7 }), B.ellipse(B.X(72), B.Y(15), B.Y(70), B.Y(70), 'c3')]] },
  // infografia
  { id: 'timeline', name: 'Cronologia', cat: 'info', size: () => land('a3'), pages: [B => {
    const out = [B.text(B.m, B.m, B.X(70), 'Cronologia', 't1', { scale: 0.7 }), B.line(B.m, B.Y(52), B.W - B.m, B.Y(52), 'c4', B.S * 0.004)];
    for (let i = 0; i < 5; i++) {
      const x = B.m + (B.W - 2 * B.m) * (i + 0.5) / 5, r = B.S * 0.022;
      out.push(B.ellipse(x - r, B.Y(52) - r, 2 * r, 2 * r, i % 2 ? 'c2' : 'c3'));
      out.push(B.text(x - B.X(8), i % 2 ? B.Y(60) : B.Y(30), B.X(16), String(2020 + i * 2), 't6', { ta: 'center', scale: 0.35 }));
      out.push(B.text(x - B.X(8), i % 2 ? B.Y(68) : B.Y(38), B.X(16), 'Fita o esdeveniment destacat', 't3', { ta: 'center', scale: 0.9 }));
    }
    return out;
  }] },
  { id: 'steps', name: 'Procés en passos', cat: 'info', size: () => px(1920, 1080), pages: [B => {
    const out = [B.text(B.m, B.m, B.X(70), 'Com funciona', 't1', { scale: 0.7 })];
    for (let i = 0; i < 4; i++) {
      const w = (B.W - 2 * B.m - 3 * B.S * 0.03) / 4, x = B.m + i * (w + B.S * 0.03);
      out.push(B.rect(x, B.Y(34), w, B.Y(50), i === 0 ? 'c3' : 'c5', { r: B.S * 0.012 }));
      out.push(B.text(x + B.S * 0.03, B.Y(38), w - B.S * 0.06, String(i + 1).padStart(2, '0'), 't6', { scale: 0.5, c: i === 0 ? 'c1' : 'c3' }));
      out.push(B.text(x + B.S * 0.03, B.Y(56), w - B.S * 0.06, 'Pas ' + (i + 1), 't2', { scale: 0.8, c: 'c4' }));
      out.push(B.text(x + B.S * 0.03, B.Y(64), w - B.S * 0.06, 'Descripció breu del que passa en aquesta etapa.', 't3'));
      if (i < 3) out.push(B.line(x + w + B.S * 0.004, B.Y(59), x + w + B.S * 0.026, B.Y(59), 'c6', B.S * 0.004, { ae: 'tri' }));
    }
    return out;
  }] },
  { id: 'compare', name: 'Comparativa', cat: 'info', size: () => port('a4'), pages: [B => {
    const out = [B.text(B.m, B.m, B.X(80), 'A o B?', 't1'), B.rect(B.m, B.Y(20), B.X(42), B.Y(8), 'c2'), B.rect(B.X(52), B.Y(20), B.X(42), B.Y(8), 'c3'), B.text(B.m + B.S * 0.02, B.Y(22), B.X(36), 'Opció A', 't2', { c: 'c5' }), B.text(B.X(52) + B.S * 0.02, B.Y(22), B.X(36), 'Opció B', 't2', { c: 'c1' })];
    for (let i = 0; i < 5; i++) {
      const y = B.Y(32 + i * 11);
      out.push(B.line(B.m, y + B.Y(9), B.W - B.m, y + B.Y(9), 'c6', B.S * 0.0012));
      out.push(B.text(B.m, y, B.X(42), 'Característica ' + (i + 1) + ': valor', 't3'));
      out.push(B.text(B.X(52), y, B.X(42), 'Característica ' + (i + 1) + ': valor', 't3'));
    }
    return out;
  }] },
  { id: 'stats', name: 'Dades destacades', cat: 'info', size: () => px(1080, 1350), pages: [B => {
    const out = [B.rect(0, 0, B.W, B.H, 'c1'), B.text(B.m, B.m, B.X(86), 'En xifres', 't5', { scale: 1.6 })];
    const d = [['84%', 'dels usuaris ho recomanen'], ['2,4 M', 'de visites l\'últim any'], ['36', 'projectes completats']];
    d.forEach(([n, t], i) => { const y = B.Y(14 + i * 28); out.push(B.text(B.m, y, B.X(86), n, 't6', { scale: 1.1 })); out.push(B.text(B.m, y + B.Y(13), B.X(70), t, 't2', { c: 'c5', scale: 0.8 })); });
    return out;
  }] },
];
Lib.TEMPLATES = TEMPLATES;
Lib.CATS = { paper: 'Paper i impressió', pres: 'Presentació', social: 'Xarxes', info: 'Infografia' };

// insereix els objectes construïts en una pàgina d'un magatzem
function addBuilt(st, pageId, list, parent) {
  for (const it of list) {
    if (it.type === 'group') {
      const gid = st.add({ type: 'group', page: pageId, parent: parent || pageId, name: it.name });
      addBuilt(st, pageId, it.kids, gid);
      continue;
    }
    const o = clone(it);
    o.page = pageId; o.parent = parent || pageId;
    if (o.type === 'text') { const f = TextKit.fit(o); o.h = f.h; if (o.auto === 'w') o.w = f.w; o.name = (o.text || 'Text').replace(/\s+/g, ' ').slice(0, 28); }
    st.add(o);
  }
}
// afegeix les pàgines d'una plantilla al magatzem (reutilitza la primera si està buida)
Lib.buildTemplate = function (st, tpl, opt = {}) {
  const prev = R.curDoc; R.curDoc = st.doc;
  try {
    const sz = tpl.size();
    const ids = [];
    let after = opt.after || null;
    tpl.pages.forEach((fn, i) => {
      let pid;
      if (i === 0 && opt.reuse) { pid = opt.reuse; st.setPage(pid, 'w', rnd(sz.w, 3)); st.setPage(pid, 'h', rnd(sz.h, 3)); st.setPage(pid, 'name', tpl.pages.length > 1 ? tpl.name + ' ' + (i + 1) : tpl.name); }
      else pid = st.addPage({ w: rnd(sz.w, 3), h: rnd(sz.h, 3), name: tpl.pages.length > 1 ? tpl.name + ' ' + (i + 1) : tpl.name }, after);
      after = pid;
      const page = st.page(pid);
      if (opt.bg !== false) st.setPage(pid, 'bg', '#ffffffff');
      addBuilt(st, pid, fn(TB(page.w, page.h, st.doc)), null);
      ids.push(pid);
    });
    return ids;
  } finally { R.curDoc = prev; }
};
// document nou a partir d'una plantilla
Lib.newFromTemplate = function (tpl) {
  const sz = tpl.size();
  const doc = Store.blankDoc({ name: tpl.name, unit: sz.unit, w: sz.w, h: sz.h, grid: sz.unit === 'px' ? 10 : fromU(5, 'mm') });
  GL.start.close();
  App.loadDoc(doc, []);
  const st = App.store;
  st.begin('Plantilla');
  Lib.buildTemplate(st, tpl, { reuse: st.pagesSorted()[0].id });
  st.commit();
  st.undoStack.length = 0; st.redoStack.length = 0;
  App.setPage(st.pagesSorted()[0].id);
  App.opts.pagesPanel = st.pagesSorted().length > 1;
  GL.pagesStrip.build();
  App.layoutPages(); App.fitPage();
  GL.autosave.now();
};
// afegeix les pàgines d'una plantilla al document obert
Lib.insertTemplate = function (tpl) {
  const st = App.store;
  st.begin('Insereix plantilla');
  const ids = Lib.buildTemplate(st, tpl, { after: App.pageId });
  st.commit();
  App.opts.pagesPanel = true;
  App.setPage(ids[0], { reveal: true });
  GL.pagesStrip.build();
  UI.toast(ids.length === 1 ? 'Pàgina afegida: ' + tpl.name : ids.length + ' pàgines afegides');
};
// vista prèvia SVG (en memòria cau)
const _tplCache = new Map();
Lib.preview = function (tpl) {
  if (_tplCache.has(tpl.id)) return _tplCache.get(tpl.id);
  const sz = tpl.size();
  const st = new Store();
  st.doc = Store.blankDoc({ w: sz.w, h: sz.h, unit: sz.unit });
  st.listeners.clear();
  const prev = R.curDoc; R.curDoc = st.doc;
  let svg = '';
  try {
    Lib.buildTemplate(st, tpl, { reuse: st.pagesSorted()[0].id });
    svg = R.pageSVG(st.pagesSorted()[0].id, { store: st, pre: 'tp' + tpl.id + '-' }).replace(/<style>[\s\S]*?<\/style>/, '');
  } catch (e) { console.warn(e); }
  R.curDoc = prev;
  _tplCache.set(tpl.id, svg);
  return svg;
};

/* ── símbols ─────────────────────────────────────────────────────── */
const SYM_ARCH = [
  ['nord', 'Nord', '<circle cx="12" cy="12" r="9"/><path d="M12 4l3.6 12.5L12 13.8l-3.6 2.7z" fill="#1a1a1a"/>'],
  ['nord2', 'Nord simple', '<path d="M12 3v18M12 3l-4 7h8z" fill="#1a1a1a"/><path d="M9 21h6"/>'],
  ['escala', 'Escala gràfica', '<path d="M2 13h20M2 10v6M7 11v4M12 10v6M17 11v4M22 10v6"/><rect x="2" y="12" width="5" height="2" fill="#1a1a1a"/><rect x="12" y="12" width="5" height="2" fill="#1a1a1a"/>'],
  ['cota', 'Cota', '<path d="M3 12h18M3 8v8M21 8v8M5.5 9.5l-2.5 2.5 2.5 2.5M18.5 9.5l2.5 2.5-2.5 2.5"/>'],
  ['nivell', 'Cota de nivell', '<path d="M3 16h18M12 16l-3.5-5h7z" fill="#1a1a1a"/><path d="M14 8h6"/>'],
  ['seccio', 'Marca de secció', '<circle cx="9" cy="12" r="5"/><path d="M4 12h10M14 12h7M18 9l3 3-3 3"/>'],
  ['eix', 'Eix', '<circle cx="12" cy="6" r="4"/><path d="M12 10v12" stroke-dasharray="3 2"/>'],
  ['vista', 'Punt de vista', '<circle cx="8" cy="12" r="3" fill="#1a1a1a"/><path d="M10.5 10.5L20 5M10.5 13.5L20 19"/>'],
  ['porta', 'Porta (planta)', '<path d="M4 20V4M4 4a16 16 0 0116 16M4 20h16"/>'],
  ['porta2', 'Porta doble', '<path d="M2 20h20M2 20V9M22 20V9M2 9a11 11 0 0110 11M22 9a11 11 0 00-10 11"/>'],
  ['finestra', 'Finestra (planta)', '<path d="M2 9h20v6H2zM2 12h20M6 9v6M18 9v6"/>'],
  ['escales', 'Escala (planta)', '<rect x="5" y="2" width="14" height="20"/><path d="M5 6h14M5 10h14M5 14h14M5 18h14M12 21V4M10 6l2-2 2 2"/>'],
  ['pilar', 'Pilar', '<rect x="7" y="7" width="10" height="10" fill="#1a1a1a"/>'],
  ['llit', 'Llit doble', '<rect x="3" y="2" width="18" height="20" rx="1"/><rect x="5" y="4" width="6" height="4" rx="1"/><rect x="13" y="4" width="6" height="4" rx="1"/><path d="M3 10h18"/>'],
  ['llit1', 'Llit individual', '<rect x="6" y="2" width="12" height="20" rx="1"/><rect x="8" y="4" width="8" height="4" rx="1"/><path d="M6 10h12"/>'],
  ['sofa', 'Sofà', '<rect x="2" y="7" width="20" height="11" rx="2"/><path d="M2 10h20M6 10v8M18 10v8M12 10v8"/>'],
  ['taula', 'Taula i cadires', '<rect x="6" y="7" width="12" height="10" rx="1"/><rect x="8" y="3" width="3" height="3"/><rect x="13" y="3" width="3" height="3"/><rect x="8" y="18" width="3" height="3"/><rect x="13" y="18" width="3" height="3"/>'],
  ['taular', 'Taula rodona', '<circle cx="12" cy="12" r="5"/><circle cx="12" cy="3.5" r="2"/><circle cx="12" cy="20.5" r="2"/><circle cx="3.5" cy="12" r="2"/><circle cx="20.5" cy="12" r="2"/>'],
  ['cadira', 'Cadira', '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M6 6h12v3H6z" fill="#1a1a1a"/>'],
  ['wc', 'Vàter', '<rect x="7" y="2" width="10" height="5" rx="1"/><ellipse cx="12" cy="14" rx="5" ry="7"/>'],
  ['lavabo', 'Lavabo', '<rect x="3" y="5" width="18" height="14" rx="2"/><ellipse cx="12" cy="12" rx="6" ry="4"/><circle cx="12" cy="7" r=".9" fill="#1a1a1a"/>'],
  ['dutxa', 'Dutxa', '<rect x="3" y="3" width="18" height="18"/><path d="M3 3l18 18M21 3L3 21"/><circle cx="12" cy="12" r="1.5"/>'],
  ['banyera', 'Banyera', '<rect x="2" y="5" width="20" height="14" rx="1"/><rect x="4" y="7" width="16" height="10" rx="4"/>'],
  ['cuina', 'Fogons', '<rect x="3" y="3" width="18" height="18"/><circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><circle cx="8" cy="16" r="2.5"/><circle cx="16" cy="16" r="2.5"/>'],
  ['nevera', 'Nevera', '<rect x="5" y="2" width="14" height="20"/><path d="M5 9h14M16 4v3M16 11v4"/>'],
  ['pica', 'Pica de cuina', '<rect x="2" y="6" width="20" height="12"/><rect x="4" y="8" width="7" height="8" rx="1"/><rect x="13" y="8" width="7" height="8" rx="1"/>'],
  ['cotxe', 'Cotxe (planta)', '<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M8 7h8M8 17h8"/><rect x="8.5" y="8" width="7" height="8" rx="1"/>'],
  ['bici', 'Bicicleta', '<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h5l3 8M10 8l3 8M9 6h3"/>'],
  ['arbre', 'Arbre (planta)', '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" opacity=".6"/>'],
  ['arbre2', 'Arbre (alçat)', '<circle cx="12" cy="9" r="7"/><path d="M12 16v6M9 22h6"/>'],
  ['arbre3', 'Conífera', '<path d="M12 2l6 12H6zM12 8l7 10H5z"/><path d="M12 18v4"/>'],
  ['arbust', 'Arbust', '<path d="M4 18a4 4 0 014-6 4.5 4.5 0 018 0 4 4 0 014 6z"/>'],
  ['persona', 'Persona', '<circle cx="12" cy="4" r="2.5"/><path d="M12 7v8M8 10l4-2 4 2M9 22l3-7 3 7"/>'],
  ['persona2', 'Persona caminant', '<circle cx="13" cy="4" r="2.5"/><path d="M12 7l-2 7M10 14l-3 8M10 14l4 3 1 5M11 9l4 3M11 9l-4 2"/>'],
  ['personap', 'Persona (planta)', '<ellipse cx="12" cy="12" rx="8" ry="4.5"/><circle cx="12" cy="12" r="3"/>'],
  ['grup', 'Grup de persones', '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="5" r="2.5"/><path d="M3 20c0-4 2-7 4-7s4 3 4 7M13 20c0-4 2-7 4-7s4 3 4 7M8 17c0-5 2-8 4-8s4 3 4 8"/>'],
];
const SYM_ARROWS = [
  ['f-dreta', 'Fletxa dreta', '<path d="M3 12h17M14 6l6 6-6 6"/>'],
  ['f-esq', 'Fletxa esquerra', '<path d="M21 12H4M10 6l-6 6 6 6"/>'],
  ['f-amunt', 'Fletxa amunt', '<path d="M12 21V4M6 10l6-6 6 6"/>'],
  ['f-avall', 'Fletxa avall', '<path d="M12 3v17M6 14l6 6 6-6"/>'],
  ['f-doble', 'Fletxa doble', '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>'],
  ['f-corba', 'Fletxa corba', '<path d="M4 18c2-8 8-12 15-12M14 2l5 4-5 4"/>'],
  ['f-retorn', 'Retorn', '<path d="M20 5v6a4 4 0 01-4 4H4M8 11l-4 4 4 4"/>'],
  ['f-circ', 'Circular', '<path d="M20 12a8 8 0 11-2.3-5.6M20 4v4h-4"/>'],
  ['f-plena', 'Fletxa plena', '<path d="M2 9h11V4l9 8-9 8v-5H2z" fill="#1a1a1a"/>'],
  ['f-chev', 'Galó', '<path d="M8 4l8 8-8 8"/>'],
  ['f-chev2', 'Galó doble', '<path d="M5 4l8 8-8 8M12 4l8 8-8 8"/>'],
  ['f-diag', 'Fletxa diagonal', '<path d="M5 19L19 5M9 5h10v10"/>'],
];
const SYM_SHAPES = [
  ['bombolla', 'Bombolla de diàleg', '<path d="M4 4h16a1 1 0 011 1v10a1 1 0 01-1 1h-9l-5 4v-4H4a1 1 0 01-1-1V5a1 1 0 011-1z"/>'],
  ['segell', 'Segell', '<path d="M12 2l2.2 2.6 3.3-.6.8 3.3 3 1.6-1.4 3.1 1.4 3.1-3 1.6-.8 3.3-3.3-.6L12 22l-2.2-2.6-3.3.6-.8-3.3-3-1.6L4.1 12 2.7 8.9l3-1.6.8-3.3 3.3.6z"/>'],
  ['cinta', 'Cinta', '<path d="M2 7h20l-3 5 3 5H2l3-5z"/>'],
  ['cor', 'Cor', '<path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/>'],
  ['check', 'Correcte', '<circle cx="12" cy="12" r="9"/><path d="M7.5 12.5l3 3 6-7"/>'],
  ['creu', 'Incorrecte', '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>'],
  ['mes', 'Més', '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v9M7.5 12h9"/>'],
  ['info2', 'Informació', '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'],
  ['avis', 'Avís', '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'],
  ['marc', 'Marc de cantonades', '<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"/>'],
  ['pin', 'Ubicació', '<path d="M12 22s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/>'],
  ['estrella2', 'Estrella', '<path d="M12 2l3 6.6 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.2l1.5-7L2 9.4l7-.8z"/>'],
  ['sol', 'Sol', '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'],
  ['lluna', 'Lluna', '<path d="M20 14A8 8 0 1110 4a6.5 6.5 0 0010 10z"/>'],
  ['bombeta', 'Idea', '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0012 3z"/>'],
  ['casa', 'Casa', '<path d="M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6"/>'],
  ['edifici', 'Edifici', '<path d="M4 21V3h10v18M14 9h6v12M2 21h20M7 7h1M10 7h1M7 11h1M10 11h1M7 15h1M10 15h1M17 13h1M17 17h1"/>'],
  ['calendari', 'Calendari', '<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/>'],
  ['rellotge', 'Rellotge', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'],
  ['correu', 'Correu', '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 7l9 6 9-6"/>'],
  ['telefon', 'Telèfon', '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z"/>'],
  ['web', 'Web', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'],
  ['grafic', 'Gràfic de barres', '<path d="M3 21h18M6 21V11M11 21V6M16 21v-7M21 21V9" stroke-width="2.4"/>'],
  ['pastis', 'Gràfic circular', '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l7 5"/>'],
];
const SYM_CATS = [
  ['arch', 'Arquitectura', SYM_ARCH],
  ['arrows', 'Fletxes', SYM_ARROWS],
  ['shapes', 'Formes i icones', SYM_SHAPES],
];
Lib.symbols = function () {
  const out = [];
  for (const [cat, label, list] of SYM_CATS) for (const [id, name, body] of list) out.push({ id, name, cat, label, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>` });
  // icones de la interfície reutilitzades
  const skip = new Set(['select', 'hand', 'chev', 'chevL', 'chevD', 'more', 'minus', 'close']);
  for (const k in IC) { if (skip.has(k)) continue; out.push({ id: 'ui-' + k, name: k, cat: 'ui', label: 'Interfície', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>` }); }
  return out;
};
Lib.insertSymbol = async function (sym, at) {
  const st = App.store, page = App.page();
  const size = Math.round(Math.min(page.w, page.h) * 0.14);
  const svg = sym.svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
  st.begin('Insereix símbol');
  const id = await GL.io.importSVGText(svg, App.pageId, at || null, sym.name);
  if (id && st.obj(id)) st.set(id, 'name', sym.name);
  st.commit();
  if (id) { App.select([id]); setTool('select'); }
};

/* ── panell de biblioteca ────────────────────────────────────────── */
const LibPanel = GL.libPanel = {
  el: null, tab: 'tpl', q: '',
  init() {
    const p = this.el = el('aside', { id: 'library', hidden: true, 'aria-label': 'Biblioteca' });
    const tabs = el('div', { class: 'lib-tabs' });
    for (const [k, l] of [['tpl', 'Plantilles'], ['sym', 'Imatges'], ['sty', 'Estils']]) {
      const b = el('button', { type: 'button', text: l, 'data-t': k });
      b.addEventListener('click', () => { if (this.tab !== k) this.cat = null; this.tab = k; this.render(); });
      tabs.append(b);
    }
    const close = el('button', { class: 'icon-btn sm', html: icon('close'), 'data-tip': 'Tanca la biblioteca' });
    close.addEventListener('click', () => this.toggle(false));
    const search = el('input', { placeholder: 'Cerca…', spellcheck: 'false' });
    search.addEventListener('input', () => { this.q = search.value; this.render(); });
    search.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { search.value = ''; this.q = ''; this.render(); search.blur(); } });
    this.search = search;
    this.body = el('div', { class: 'lib-body' });
    p.append(el('div', { class: 'lib-head' }, tabs, close), el('div', { class: 'lib-search' }, el('span', { html: icon('search') }), search), this.body);
    $('#stageWrap').append(p);
    App.store.on(ch => { if (!this.el.hidden && this.tab === 'sty' && (ch.doc || ch.all)) this.renderSoon(); });
    App.on('sel', () => { if (!this.el.hidden && this.tab === 'sty') this.renderSoon(); });
    this.renderSoon = rafThrottle(() => this.render());
  },
  toggle(v, tab) {
    if (tab) this.tab = tab;
    const show = v === undefined ? this.el.hidden : v;
    this.el.hidden = !show;
    const sw = $('#stageWrap'), was = sw.classList.contains('lib-open');
    if (was !== show) { sw.classList.toggle('lib-open', show); const lw = (document.body.classList.contains('kids') ? 320 : 292) / 2; App.px += show ? -lw : lw; requestAnimationFrame(() => App.applyView()); }
    $('#toolbar .tool[data-c="lib"]')?.classList.toggle('on', show);
    if (show) this.render();
  },
  render() {
    $$('.lib-tabs button', this.el).forEach(b => b.classList.toggle('on', b.dataset.t === this.tab));
    this.search.parentElement.hidden = this.tab === 'sty';
    const b = this.body; b.textContent = '';
    if (this.tab === 'tpl') this.renderTpl(b);
    else if (this.tab === 'sym') this.renderSym(b);
    else this.renderSty(b);
  },
  match(s) { const q = norm(this.q.trim()); return !q || norm(s).includes(q); },
  chips(b, cats) {
    if (cats.length < 2) return;
    const row = el('div', { class: 'lib-chips' });
    for (const c of ['Tot'].concat(cats)) {
      const x = el('button', { type: 'button', text: c, class: (this.cat || 'Tot') === c ? 'on' : '' });
      x.addEventListener('click', () => { this.cat = c === 'Tot' ? null : c; this.render(); this.body.scrollTop = 0; });
      row.append(x);
    }
    b.append(row);
  },
  actions(b, kind) {
    const row = el('div', { class: 'lib-acts' });
    const a1 = el('button', { class: 'btn ghost', type: 'button', html: icon('save') + `<span>${kind === 'tpl' ? 'Desa la pàgina' : 'Desa la selecció'}</span>`, 'data-tip': kind === 'tpl' ? 'Desa la pàgina actual com a plantilla teva' : 'Desa els objectes seleccionats com a símbol teu' });
    a1.addEventListener('click', () => Cmd.run(kind === 'tpl' ? 'user.saveTpl' : 'user.saveSym'));
    const a2 = el('button', { class: 'btn ghost', type: 'button', html: icon('layers') + '<span>Paquets…</span>' });
    a2.addEventListener('click', () => Cmd.run('packs.manage'));
    $$('svg', row); row.append(a1, a2);
    $$('svg', row).forEach(x => x.style.width = '14px');
    b.append(row);
  },
  renderTpl(b) {
    this.actions(b, 'tpl');
    let all = Catalog.templates();
    if (GL.kids.on) all = all.filter(t => t.kids || t.user).concat(all.filter(t => !t.kids && !t.user));
    const cats = Array.from(new Set(all.map(t => t.cat)));
    this.chips(b, cats);
    const list = all.filter(t => (!this.cat || t.cat === this.cat) && this.match(t.name + ' ' + t.cat + ' ' + t.tags + ' ' + t.src));
    let cur = null, g = null;
    for (const t of list) {
      if (t.cat !== cur) { cur = t.cat; b.append(el('div', { class: 'lib-h', text: cur })); g = el('div', { class: 'lib-tpl' }); b.append(g); }
      g.append(GL.tplCard(t, () => t.insert(), t.user ? () => removeUserItem('tpl', t.raw.id) : null));
    }
    if (!list.length) b.append(el('div', { class: 'ly-empty', text: 'Cap plantilla coincideix amb la cerca.' }));
    if (!GL.packs.list.length) b.append(this.packHint());
  },
  packHint() {
    const d = el('div', { class: 'pack-hint' }, el('b', { text: 'Vols més contingut?' }), el('span', { text: 'Carrega el paquet infantil i escolar: més de 50 plantilles i 230 il·lustracions.' }));
    const bt = el('button', { class: 'btn primary', text: 'Carrega un paquet…' });
    bt.addEventListener('click', () => Cmd.run('packs.manage'));
    d.append(bt);
    return d;
  },
  renderSym(b) {
    this.actions(b, 'sym');
    let all = Catalog.symbols();
    if (GL.kids.on) all = all.filter(s => s.cat !== 'Interfície');
    const cats = Array.from(new Set(all.map(s => s.cat)));
    this.chips(b, cats);
    all = all.filter(s => (!this.cat || s.cat === this.cat) && this.match(s.name + ' ' + s.cat + ' ' + s.tags));
    let cur = null, g = null;
    for (const s of all.slice(0, 600)) {
      if (s.cat !== cur) { cur = s.cat; b.append(el('div', { class: 'lib-h', text: cur })); g = el('div', { class: 'lib-sym' }); b.append(g); }
      const t = el('button', { class: 'sym', type: 'button', html: s.svg || '', 'data-tip': s.name });
      const sv = t.querySelector('svg'); if (sv) { sv.removeAttribute('width'); sv.removeAttribute('height'); }
      t.addEventListener('pointerdown', e => this.dragSym(e, s, t));
      if (s.user) t.addEventListener('contextmenu', e => { e.preventDefault(); UI.menu([{ label: 'Elimina de «Els meus»', run: () => removeUserItem('sym', s.raw.id) }], e.clientX, e.clientY); });
      g.append(t);
    }
    if (!all.length) b.append(el('div', { class: 'ly-empty', text: 'Cap símbol coincideix amb la cerca.' }));
    if (!GL.packs.list.length && !this.q) b.append(this.packHint());
  },
  dragSym(e, s, tile) {
    if (e.button !== 0) return;
    e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY;
    let ghost = null;
    const mv = ev => {
      if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 5) { ghost = el('div', { class: 'sym-ghost', html: s.svg }); document.body.append(ghost); }
      if (ghost) { ghost.style.left = ev.clientX - 22 + 'px'; ghost.style.top = ev.clientY - 22 + 'px'; }
    };
    const up = ev => {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
      if (ghost) {
        ghost.remove();
        const r = App.stage.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom && !this.el.contains(document.elementFromPoint(ev.clientX, ev.clientY))) {
          const w = App.s2w(pt(ev.clientX - r.left, ev.clientY - r.top));
          const pg = App.pageAt(w);
          if (pg) { if (pg !== App.pageId) App.setPage(pg, { keepView: true }); s.insert(App.w2p(w, pg)); }
        }
      } else s.insert();
    };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    void tile;
  },
  renderSty(b) {
    const st = App.store;
    // paletes
    b.append(el('div', { class: 'lib-h', text: 'Paletes' }));
    const pl = el('div', { class: 'pal-list' });
    for (const P of PALETTES) {
      const row = el('button', { class: 'pal' + (st.props.palette === P.id ? ' on' : ''), type: 'button' });
      const sw = el('span', { class: 'pal-sw' });
      P.c.forEach(c => sw.append(el('i', { style: { background: c } })));
      row.append(sw, el('span', { text: P.name }));
      row.addEventListener('click', () => Lib.applyPalette(P.id));
      pl.append(row);
    }
    b.append(pl);
    // colors amb nom
    const addC = el('button', { class: 'icon-btn xs', html: icon('plus'), 'data-tip': 'Desa el color de la selecció' });
    addC.addEventListener('click', () => {
      const o = App.objs()[0];
      const p = o && (o.fill && o.fill.t === 'solid' ? o.fill : o.stroke && o.stroke.t === 'solid' ? o.stroke : null);
      st.begin('Color nou');
      const id = Lib.addColor(p ? R.resolve(p) : '#808080ff');
      if (o && p) st.set(o.id, o.fill === p ? 'fill' : 'stroke', { t: 'solid', c: p.c, ref: id });
      st.commit();
    });
    b.append(el('div', { class: 'lib-h row' }, el('span', { text: 'Colors del document' }), addC));
    const cl = el('div', { class: 'nc-list' });
    for (const nc of Lib.colors()) {
      const row = el('div', { class: 'nc' });
      const sw = el('button', { class: 'swatch', type: 'button', 'data-tip': 'Edita el color' }, el('i', { style: { background: cssColor(nc.c) } }));
      sw.addEventListener('click', () => openColorPicker(sw, { t: 'solid', c: nc.c }, p => Lib.setColor(nc.id, p.c), { gradient: false }));
      const name = el('button', { class: 'nc-name', type: 'button', text: nc.name, 'data-tip': 'Aplica a la selecció' });
      name.addEventListener('click', () => Lib.applyColorToSel(nc.id));
      name.addEventListener('dblclick', async () => { const n = await UI.prompt('Reanomena el color', 'Nom', nc.name); if (n && n.trim()) Lib.renameItem('color', nc.id, n.trim()); });
      const uses = Object.values(st.doc.objs).filter(o => (o.fill && o.fill.ref === nc.id) || (o.stroke && o.stroke.ref === nc.id)).length;
      const del = el('button', { class: 'ly-btn', html: icon('trash'), 'data-tip': 'Elimina el color' });
      del.addEventListener('click', () => { st.begin('Elimina el color'); Lib.removeColor(nc.id); st.commit(); });
      row.append(sw, name, el('span', { class: 'nc-hex', text: hex6(nc.c).toUpperCase() + (uses ? ' · ' + uses : '') }), del);
      cl.append(row);
    }
    b.append(cl);
    // estils de text
    const sel = App.objs().filter(o => o.type === 'text');
    const addT = el('button', { class: 'icon-btn xs', html: icon('plus'), 'data-tip': 'Crea un estil a partir del text seleccionat' });
    addT.addEventListener('click', () => { if (!sel[0]) { UI.toast('Selecciona un text', 'warn'); return; } Lib.newTStyle(sel[0]); });
    b.append(el('div', { class: 'lib-h row' }, el('span', { text: 'Estils de text' }), addT));
    const tl = el('div', { class: 'ts-list' });
    for (const s of Lib.tstyles()) {
      const row = el('div', { class: 'ts' + (sel.length && sel.every(o => o.ts === s.id) ? ' on' : '') });
      const prev = el('button', { class: 'ts-prev', type: 'button', text: s.name, 'data-tip': 'Aplica al text seleccionat' });
      Object.assign(prev.style, { fontFamily: FontKit.stack(s.ff), fontWeight: s.fw, fontStyle: s.fi ? 'italic' : 'normal', textTransform: s.tt === 'upper' ? 'uppercase' : 'none', fontSize: clamp(s.fs / (st.props.styleBase || 800) * 260, 11, 22) + 'px' });
      prev.addEventListener('click', () => Lib.applyTStyle(s.id));
      prev.addEventListener('dblclick', async () => { const n = await UI.prompt('Reanomena l\'estil', 'Nom', s.name); if (n && n.trim()) Lib.renameItem('ts', s.id, n.trim()); });
      const meta = el('span', { class: 'ts-meta', text: `${s.fw} · ${fmtNum(s.fs, 1)} px` });
      const upd = el('button', { class: 'ly-btn', html: icon('swap'), 'data-tip': 'Actualitza amb el text seleccionat' });
      upd.addEventListener('click', () => { if (!sel[0]) { UI.toast('Selecciona un text', 'warn'); return; } Lib.updateTStyle(s.id, sel[0]); });
      const del = el('button', { class: 'ly-btn', html: icon('trash'), 'data-tip': 'Elimina l\'estil' });
      del.addEventListener('click', () => Lib.removeTStyle(s.id));
      row.append(prev, meta, upd, del);
      tl.append(row);
    }
    b.append(tl);
    b.append(el('div', { class: 'p-note', style: { margin: '10px 2px' }, text: 'Els colors i estils enllaçats s\'actualitzen a tot el document quan els edites. Doble clic sobre un nom per reanomenar-lo.' }));
  },
};
