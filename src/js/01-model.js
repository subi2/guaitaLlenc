/* ── Model de document i operacions ─────────────────────────────
   document → pàgines → objectes (amb grups niats)
   Cada canvi és una operació {c, t, id, k?, v?, l, a}
     c: col·lecció 'o' objectes · 'p' pàgines · 'a' actius · 'd' document
     t: 'add' | 'set' | 'del'
     l: rellotge de Lamport · a: actor
   Fusió: darrer que escriu guanya per propietat (LWW). */

const LOG_CAP = 20000;

const DEFAULTS = {
  common: { visible: true, locked: false, opacity: 1, blend: 'normal', rot: 0, fx: 1, fy: 1 },
  fill: { t: 'solid', c: '#d9d9d9ff' },
  stroke: { t: 'none', c: '#1a1a1aff' },
};

const TYPE_NAMES = {
  rect: 'Rectangle', ellipse: 'El·lipse', polygon: 'Polígon', star: 'Estrella', line: 'Línia',
  path: 'Trajecte', text: 'Text', image: 'Imatge', group: 'Grup'
};

function getActor() {
  try {
    let a = localStorage.getItem('guaitaLlenc.actor');
    if (!a) { a = uid(8); localStorage.setItem('guaitaLlenc.actor', a); }
    return a;
  } catch (e) { return uid(8); }
}

class Store {
  constructor() {
    this.actor = getActor();
    this.clock = 0;
    this.doc = null;
    this.ts = new Map();         // `${c}|${id}|${k}` → [l, a]
    this.log = [];
    this.undoStack = [];
    this.redoStack = [];
    this.tx = null;
    this.listeners = new Set();
    this.pending = null;
    this.version = 0;            // s'incrementa a cada canvi (per al desat)
    this.savedVersion = 0;
  }

  /* ── cicle de vida ── */
  static blankDoc(o = {}) {
    const pageId = uid();
    const doc = {
      id: uid(12), v: 1,
      props: {
        name: o.name || 'Sense títol', unit: o.unit || 'mm', grid: o.grid || fromU(5, 'mm'),
        created: new Date().toISOString(), author: o.author || '', app: APP + ' ' + VERSION
      },
      pages: {}, objs: {}, assets: {}
    };
    GL.lib && GL.lib.initDocStyles(doc, Math.min(o.w || fromU(210, 'mm'), o.h || fromU(297, 'mm')));
    doc.pages[pageId] = { id: pageId, name: 'Pàgina 1', z: keyBetween(null, null), w: o.w || fromU(210, 'mm'), h: o.h || fromU(297, 'mm'), bg: o.bg || '#ffffffff', guides: { h: [], v: [] } };
    return doc;
  }
  load(doc, log, ts) {
    this.doc = doc;
    this.ts.clear();
    if (Array.isArray(ts)) for (let i = 0; i + 2 < ts.length; i += 3) { this.ts.set(ts[i], [ts[i + 1], ts[i + 2]]); if (ts[i + 1] > this.clock) this.clock = ts[i + 1]; }
    this.log = Array.isArray(log) ? log.slice(-LOG_CAP) : [];
    for (const op of this.log) if (op.l > this.clock) this.clock = op.l;
    this.undoStack = []; this.redoStack = []; this.tx = null;
    this.version++; this.savedVersion = this.version;
    this.emit({ all: true });
  }

  exportTs() { const out = []; for (const [k, v] of this.ts) out.push(k, v[0], v[1]); return out; }
  // últim actor que ha tocat un objecte {l, a}
  lastEditor(id) {
    let best = null;
    const pre = 'o|' + id + '|';
    for (const [k, v] of this.ts) if (k.startsWith(pre) && (!best || v[0] > best.l)) best = { l: v[0], a: v[1] };
    return best;
  }

  /* ── consultes ── */
  obj(id) { return this.doc.objs[id]; }
  page(id) { return this.doc.pages[id]; }
  get props() { return this.doc.props; }
  pagesSorted() { return Object.values(this.doc.pages).sort(byZ); }
  children(parentId) {
    const out = [];
    for (const id in this.doc.objs) { const o = this.doc.objs[id]; if (o.parent === parentId) out.push(o); }
    return out.sort(byZ);
  }
  descendants(id, out = []) {
    for (const c of this.children(id)) { out.push(c); if (c.type === 'group') this.descendants(c.id, out); }
    return out;
  }
  ancestors(id) {
    const out = []; let o = this.obj(id);
    while (o && this.doc.objs[o.parent]) { o = this.doc.objs[o.parent]; out.push(o); }
    return out;
  }
  pageOf(id) { const o = this.obj(id); return o ? o.page : null; }
  isVisible(id) { let o = this.obj(id); while (o) { if (o.visible === false) return false; o = this.doc.objs[o.parent]; } return true; }
  isLocked(id) { let o = this.obj(id); while (o) { if (o.locked) return true; o = this.doc.objs[o.parent]; } return false; }
  topZ(parentId) { const c = this.children(parentId); return c.length ? c[c.length - 1].z : null; }

  /* ── aplicació d'operacions ── */
  coll(c) { return c === 'o' ? this.doc.objs : c === 'p' ? this.doc.pages : c === 'a' ? this.doc.assets : null; }
  tick() { return ++this.clock; }
  // aplica una operació local (genera marca de temps i inversa)
  op(c, t, id, k, v) {
    const op = { c, t, id, l: this.tick(), a: this.actor };
    if (t === 'set') { op.k = k; op.v = v === undefined ? null : clone(v); if (v === undefined) op.u = 1; }
    else if (t === 'add') op.v = clone(k);
    const inv = this.applyRaw(op);
    if (inv === false) return false;
    if (this.tx) { this.tx.fwd.push(op); this.tx.inv.push(inv); }
    else { this.undoStack.push({ label: '', fwd: [op], inv: [inv] }); this.redoStack.length = 0; }
    return true;
  }
  // aplica una operació remota respectant LWW
  applyRemote(op) {
    if (op.l > this.clock) this.clock = op.l;
    return this.applyRaw(op, true) !== false;
  }
  newer(key, op) {
    const cur = this.ts.get(key);
    if (!cur) return true;
    return op.l > cur[0] || (op.l === cur[0] && op.a > cur[1]);
  }
  applyRaw(op, remote) {
    const d = this.doc;
    let inv = null;
    if (op.c === 'd') {
      const key = 'd||' + op.k;
      if (remote && !this.newer(key, op)) return false;
      inv = { c: 'd', t: 'set', id: 'doc', k: op.k, v: clone(d.props[op.k]) };
      if (d.props[op.k] === undefined) { inv.v = null; inv.u = 1; }
      if (op.u) delete d.props[op.k]; else d.props[op.k] = clone(op.v);
      this.ts.set(key, [op.l, op.a]);
      this.touch({ doc: true });
    } else {
      const coll = this.coll(op.c);
      if (op.t === 'add') {
        const key = op.c + '|' + op.id + '|';
        if (remote && !this.newer(key, op)) return false;
        if (coll[op.id] && !remote) return false;
        coll[op.id] = clone(op.v);
        this.ts.set(key, [op.l, op.a]);
        inv = { c: op.c, t: 'del', id: op.id };
        this.touch(op.c, op.id, true);
      } else if (op.t === 'del') {
        const prev = coll[op.id];
        if (!prev) return false;
        if (remote && !this.newer(op.c + '|' + op.id + '|', op)) return false;
        delete coll[op.id];
        this.ts.set(op.c + '|' + op.id + '|', [op.l, op.a]);
        inv = { c: op.c, t: 'add', id: op.id, v: clone(prev) };
        this.touch(op.c, op.id, true);
      } else if (op.t === 'set') {
        const target = coll[op.id];
        if (!target) return false;
        const key = op.c + '|' + op.id + '|' + op.k;
        if (remote && !this.newer(key, op)) return false;
        const prev = target[op.k];
        inv = { c: op.c, t: 'set', id: op.id, k: op.k, v: prev === undefined ? null : clone(prev) };
        if (prev === undefined) inv.u = 1;
        if (op.u) delete target[op.k]; else target[op.k] = clone(op.v);
        this.ts.set(key, [op.l, op.a]);
        this.touch(op.c, op.id, op.k === 'z' || op.k === 'parent' || op.k === 'page' || op.k === 'visible' || op.k === 'locked' || op.k === 'name');
      }
    }
    this.logOp(op);
    this.version++;
    return inv;
  }
  logOp(op) {
    const e = Object.assign({}, op);
    if (op.c === 'a' && op.t === 'add') e.v = { mime: op.v.mime, w: op.v.w, h: op.v.h, ref: 1 };
    this.log.push(e);
    if (this.log.length > LOG_CAP * 1.2) this.log.splice(0, this.log.length - LOG_CAP);
  }

  /* ── transaccions i historial ── */
  begin(label) {
    if (this.tx) { this.tx.depth++; if (label && !this.tx.label) this.tx.label = label; return; }
    this.tx = { label: label || '', fwd: [], inv: [], depth: 1 };
  }
  commit() {
    if (!this.tx) return;
    if (--this.tx.depth > 0) return;
    const tx = this.tx; this.tx = null;
    if (!tx.fwd.length) return;
    compactTx(tx);
    this.undoStack.push({ label: tx.label, fwd: tx.fwd, inv: tx.inv });
    if (this.undoStack.length > 400) this.undoStack.shift();
    this.redoStack.length = 0;
    this.emit({ history: true });
  }
  cancel() { // desfà la transacció oberta
    if (!this.tx) return;
    const tx = this.tx; this.tx = null;
    for (let i = tx.inv.length - 1; i >= 0; i--) this.replay(tx.inv[i]);
  }
  replay(op) {
    const o = Object.assign({}, op, { l: this.tick(), a: this.actor });
    return this.applyRaw(o);
  }
  undo() {
    if (this.tx) this.commit();
    const e = this.undoStack.pop();
    if (!e) return null;
    for (let i = e.inv.length - 1; i >= 0; i--) this.replay(e.inv[i]);
    this.redoStack.push(e);
    this.emit({ history: true });
    return e;
  }
  redo() {
    const e = this.redoStack.pop();
    if (!e) return null;
    for (const op of e.fwd) this.replay(op);
    this.undoStack.push(e);
    this.emit({ history: true });
    return e;
  }
  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }

  /* ── notificació de canvis (agrupada per microtasca) ── */
  touch(c, id, structural) {
    if (!this.pending) {
      this.pending = { objs: new Set(), pages: new Set(), assets: new Set(), doc: false, structure: false };
      queueMicrotask(() => { const p = this.pending; this.pending = null; this.emit(p); });
    }
    const p = this.pending;
    if (typeof c === 'object') { if (c.doc) p.doc = true; return; }
    if (c === 'o') p.objs.add(id);
    else if (c === 'p') { p.pages.add(id); p.structure = true; }
    else if (c === 'a') p.assets.add(id);
    if (structural) p.structure = true;
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(ch) { for (const fn of this.listeners) { try { fn(ch); } catch (e) { console.error(e); } } }

  /* ── ajudants d'alt nivell ── */
  set(id, k, v) {
    const o = this.obj(id);
    if (!o || eq(o[k], v)) return;
    this.op('o', 'set', id, k, v);
  }
  patch(id, p) { for (const k in p) this.set(id, k, p[k]); }
  setPage(id, k, v) { const p = this.page(id); if (p && !eq(p[k], v)) this.op('p', 'set', id, k, v); }
  setDoc(k, v) { if (!eq(this.doc.props[k], v)) this.op('d', 'set', 'doc', k, v); }
  add(o, opt = {}) {
    o = Object.assign({}, DEFAULTS.common, o);
    if (!o.id) o.id = uid();
    if (!o.parent) o.parent = o.page;
    if (!o.z) o.z = opt.below ? keyBetween(null, (this.children(o.parent)[0] || {}).z || null) : keyBetween(this.topZ(o.parent), null);
    for (const k in o) if (o[k] === undefined) delete o[k];
    if (!o.name) o.name = this.autoName(o.type, o.page);
    this.op('o', 'add', o.id, o);
    return o.id;
  }
  autoName(type, pageId) {
    const base = TYPE_NAMES[type] || 'Objecte';
    let n = 0;
    for (const id in this.doc.objs) { const o = this.doc.objs[id]; if (o.page === pageId && o.type === type) n++; }
    return base + ' ' + (n + 1);
  }
  del(ids) {
    const all = new Set();
    for (const id of ids) {
      if (!this.obj(id)) continue;
      all.add(id);
      for (const d of this.descendants(id)) all.add(d.id);
    }
    // fills primer perquè la inversa els restauri després dels pares
    const list = Array.from(all).sort((a, b) => this.ancestors(b).length - this.ancestors(a).length);
    for (const id of list) this.op('o', 'del', id);
    return list;
  }
  addPage(p, afterId) {
    const pages = this.pagesSorted();
    let a = null, b = null;
    if (afterId) { const i = pages.findIndex(x => x.id === afterId); a = pages[i] ? pages[i].z : null; b = pages[i + 1] ? pages[i + 1].z : null; }
    else a = pages.length ? pages[pages.length - 1].z : null;
    const clean = {}; for (const k in p) if (p[k] !== undefined) clean[k] = p[k];
    const page = Object.assign({ id: uid(), name: 'Pàgina ' + (pages.length + 1), w: fromU(210, 'mm'), h: fromU(297, 'mm'), bg: '#ffffffff', guides: { h: [], v: [] } }, clean);
    page.z = keyBetween(a, b);
    this.op('p', 'add', page.id, page);
    return page.id;
  }
  delPage(id) {
    const objs = Object.values(this.doc.objs).filter(o => o.page === id && o.parent === id).map(o => o.id);
    this.del(objs);
    this.op('p', 'del', id);
  }
  addAsset(mime, data, w, h) {
    const id = 'as' + hashStr(data);
    if (!this.doc.assets[id]) this.op('a', 'add', id, { id, mime, data, w, h });
    return id;
  }
  // garbage-collect d'actius no referenciats (en desar)
  usedAssets() {
    const used = new Set();
    for (const id in this.doc.objs) { const o = this.doc.objs[id]; if (o.asset) used.add(o.asset); }
    return used;
  }
}
function byZ(a, b) { return a.z < b.z ? -1 : a.z > b.z ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0; }

// Compacta conjunts consecutius sobre la mateixa clau (arrossegaments)
function compactTx(tx) {
  const fwd = [], inv = [];
  const lastSet = new Map();
  const touched = new Set();
  for (let i = 0; i < tx.fwd.length; i++) {
    const op = tx.fwd[i], iv = tx.inv[i];
    if (op.t === 'set') {
      const key = op.c + '|' + op.id + '|' + op.k;
      const j = lastSet.get(key);
      if (j !== undefined && !touched.has(op.c + '|' + op.id + '#' + j)) {
        fwd[j] = op; // es conserva la primera inversa
        continue;
      }
      lastSet.set(key, fwd.length);
    } else {
      // una operació estructural trenca la compactació per a aquest id
      for (const [k] of lastSet) if (k.startsWith(op.c + '|' + op.id + '|')) lastSet.delete(k);
    }
    fwd.push(op); inv.push(iv);
  }
  tx.fwd = fwd; tx.inv = inv;
}

GL.Store = Store;
GL.byZ = byZ;
GL.TYPE_NAMES = TYPE_NAMES;
