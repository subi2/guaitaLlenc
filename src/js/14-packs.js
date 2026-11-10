/* ── Paquets .llencpack, biblioteca d'usuari i mode infantil ──── */
const PACK_FORMAT = 'guaitaLlencPack';
const USER_PACK = 'user';

const Packs = GL.packs = {
  list: [],               // paquets carregats (sense el d'usuari)
  user: null,             // paquet d'usuari
  symIndex: new Map(),    // id de símbol → { svg, name, pack }
  ready: false,
  async init() {
    try {
      const all = (await Autosave.tx('readonly', s => s.getAll(), 'packs')) || [];
      for (const p of all) { if (p.id === USER_PACK) this.user = p; else this.list.push(p); }
    } catch (e) { console.warn('paquets', e); }
    if (!this.user) this.user = this.blankUser();
    this.reindex();
    this.ready = true;
    // publicat a la web: intenta carregar el paquet infantil del mateix lloc
    if (!this.list.some(p => p.id === 'infantil') && /^https?:/.test(location.protocol)) {
      for (const url of ['packs/infantil.llencpack.json', '../packs/infantil.llencpack.json', 'infantil.llencpack.json']) {
        try { const r = await fetch(url); if (r.ok) { await this.install(await r.json(), true); break; } } catch (e) { }
      }
    }
  },
  blankUser() { return { format: PACK_FORMAT, version: 1, id: USER_PACK, name: 'Els meus', templates: [], symbols: [], cats: {}, symCats: {} }; },
  reindex() {
    this.symIndex.clear();
    for (const p of this.all()) for (const s of p.symbols || []) if (s.svg) this.symIndex.set(s.id, { svg: s.svg, name: s.name, pack: p.id });
    // paletes dels paquets
    for (const p of this.list) for (const P of p.palettes || []) if (!Lib.PALETTES.some(x => x.id === P.id)) Lib.PALETTES.push(P);
    if (GL.libPanel && GL.libPanel.el && !GL.libPanel.el.hidden) GL.libPanel.render();
  },
  all() { return this.list.concat(this.user ? [this.user] : []); },
  validate(p) {
    if (!p || p.format !== PACK_FORMAT || !p.id || !p.name) throw new Error('No és un paquet de guaitaLlenç vàlid.');
    p.templates = Array.isArray(p.templates) ? p.templates : [];
    p.symbols = Array.isArray(p.symbols) ? p.symbols : [];
    for (const s of p.symbols) if (s.svg && /<script|on\w+=|javascript:/i.test(s.svg)) throw new Error('El paquet conté codi no permès.');
    return p;
  },
  async install(p, silent) {
    this.validate(p);
    if (p.id === USER_PACK) p.id = 'user-' + uid(5);
    p.installed = Date.now();
    await Autosave.tx('readwrite', s => s.put(p), 'packs');
    this.list = this.list.filter(x => x.id !== p.id).concat(p);
    this.reindex();
    if (!silent) UI.toast(`Paquet «${p.name}» carregat: ${p.templates.length} plantilles · ${p.symbols.length} símbols`);
    return p;
  },
  async remove(id) {
    await Autosave.tx('readwrite', s => s.delete(id), 'packs');
    this.list = this.list.filter(x => x.id !== id);
    this.reindex();
  },
  async saveUser() { await Autosave.tx('readwrite', s => s.put(this.user), 'packs'); this.reindex(); },
  async loadFile(file) {
    try { return await this.install(JSON.parse(await readFileAs(file, 'text'))); }
    catch (e) { UI.toast(e.message || 'No s\'ha pogut carregar el paquet', 'err', 4000); }
  },
  async loadURL(url) {
    try { const r = await fetch(url); if (!r.ok) throw new Error('No s\'ha pogut descarregar (' + r.status + ')'); return await this.install(await r.json()); }
    catch (e) { UI.toast(e.message || 'No s\'ha pogut descarregar el paquet', 'err', 4000); }
  },
  exportPack(p) {
    const out = Object.assign({}, p); delete out.installed;
    if (p.id === USER_PACK) { out.id = 'meus-' + uid(5); out.name = (App.store.props.author || 'Els meus') + ' · col·lecció'; out.author = App.store.props.author || ''; }
    downloadBlob(new Blob([JSON.stringify(out)], { type: 'application/json' }), safeName(out.name) + '.llencpack.json');
  },
};

/* ── col·locació síncrona d'SVG a qualsevol magatzem ── */
function emitSync(st, items, pageId, T, s, parent) {
  const ids = [];
  for (const it of items) {
    let id = null;
    if (it.kind === 'group') {
      const kids = emitSync(st, it.kids, pageId, T, s, null);
      if (!kids.length) continue;
      id = st.add({ type: 'group', page: pageId, parent: parent || pageId, name: it.name || undefined, opacity: it.opacity < 1 ? it.opacity : 1 });
      const keys = keysBetween(null, null, kids.length);
      kids.forEach((k, i) => { st.set(k, 'parent', id); st.set(k, 'z', keys[i]); });
    } else if (it.kind === 'path') {
      const patch = G.pathFromPage(G.mapSP(it.sp, q => Mx.ap(T, q)));
      const o = Object.assign({}, it.base, patch, { type: 'path', page: pageId, parent: parent || pageId, sw: rnd(it.base.sw * s, 3), opacity: it.opacity < 1 ? it.opacity : 1 });
      if (o.fill.t === 'none' && !(o.sw > 0)) continue;
      id = st.add(o);
    } else if (it.kind === 'obj') {
      const o = clone(it.o);
      o.page = pageId; o.parent = parent || pageId;
      if (o.type === 'line') { o.p1 = Mx.ap(T, o.p1); o.p2 = Mx.ap(T, o.p2); o.sw = rnd(o.sw * s, 3); }
      else {
        const c = Mx.ap(T, pt(o.x + o.w / 2, o.y + o.h / 2));
        o.w *= s; o.h *= s; o.x = c.x - o.w / 2; o.y = c.y - o.h / 2; o.sw = rnd((o.sw || 0) * s, 3);
        if (o.type === 'rect' && o.r) o.r = rnd(o.r * s, 3);
        if (o.type === 'text') { o.fs = rnd(o.fs * s, 2); const f = TextKit.fit(o); o.w = f.w; o.h = f.h; o.x = c.x - o.w / 2; o.y = c.y - o.h / 2; }
      }
      if (it.opacity < 1) o.opacity = it.opacity;
      id = st.add(o);
    }
    if (id) ids.push(id);
  }
  return ids;
}
// insereix un SVG encaixat en una caixa (x, y, w, h) — retorna l'id de nivell superior
function placeSvg(st, pageId, svg, box, name, o = {}) {
  const res = SvgImport.parse(svg);
  if (!res || !res.items.length) return null;
  const b = res.box;
  const s = Math.min(box.w / (b.w || 1), box.h / (b.h || 1));
  const T = Mx.chain(Mx.tr(box.x + box.w / 2, box.y + box.h / 2), Mx.sc(s), Mx.tr(-(b.x + b.w / 2), -(b.y + b.h / 2)));
  const ids = emitSync(st, res.items, pageId, T, s, null);
  let id = ids[0] || null;
  if (ids.length > 1) {
    id = st.add({ type: 'group', page: pageId, name });
    const keys = keysBetween(null, null, ids.length);
    ids.forEach((k, i) => { st.set(k, 'parent', id); st.set(k, 'z', keys[i]); });
  } else if (id) st.set(id, 'name', name);
  if (id && o.rot) { const ob = st.obj(id); const c = pt(box.x + box.w / 2, box.y + box.h / 2); const out = {}; G.rotateObj(ob, c, o.rot, out, st); for (const k in out) st.patch(k, out[k]); }
  if (id && o.opacity != null && o.opacity < 1) st.set(id, 'opacity', o.opacity);
  return id;
}
GL.placeSvg = placeSvg;
function symSvg(id) {
  const s = Packs.symIndex.get(id);
  if (s) return s;
  const core = Lib.symbols().find(x => x.id === id);
  return core ? { svg: core.svg, name: core.name } : null;
}

/* ── instanciació de plantilles de paquet ── */
function buildPackPage(st, pageId, page) {
  const prev = R.curDoc; R.curDoc = st.doc;
  try {
    for (const it of page.items || []) {
      if (it.type === 'sym') {
        const s = symSvg(it.sym);
        if (s) placeSvg(st, pageId, s.svg, it, s.name, { rot: it.rot, opacity: it.opacity });
        continue;
      }
      addBuilt(st, pageId, [it], null);
    }
  } finally { R.curDoc = prev; }
}
function buildPackTemplate(st, t, opt = {}) {
  const ids = [];
  let after = opt.after || null;
  t.pages.forEach((pg, i) => {
    const name = pg.name ? (t.pages.length > 1 ? t.name.split(' · ').pop() + ' · ' + pg.name : pg.name) : t.name.split(' · ').pop();
    let pid;
    if (i === 0 && opt.reuse) { pid = opt.reuse; st.setPage(pid, 'w', t.w); st.setPage(pid, 'h', t.h); st.setPage(pid, 'name', name); }
    else pid = st.addPage({ w: t.w, h: t.h, name }, after);
    st.setPage(pid, 'bg', pg.bg || '#ffffffff');
    after = pid;
    if (t.tree) insertTreeInto(st, t.tree, pid);
    else buildPackPage(st, pid, pg);
    ids.push(pid);
  });
  return ids;
}
// inserció d'arbres (biblioteca d'usuari) en un magatzem qualsevol
function insertTreeInto(st, tree, pageId, dx = 0, dy = 0) {
  const prev = App.store; App.store = st;
  try { return insertTree(clone(tree), pageId, dx, dy); } finally { App.store = prev; }
}

/* ── catàleg unificat ── */
const Catalog = GL.catalog = {
  templates() {
    const out = [];
    for (const t of Lib.TEMPLATES) {
      const sz = t.size();
      out.push({ key: 'core:' + t.id, name: t.name, cat: Lib.CATS[t.cat], src: 'Guaita', w: sz.w, h: sz.h, unit: sz.unit, n: t.pages.length, tags: '', thumb: () => Lib.preview(t), insert: () => Lib.insertTemplate(t), create: () => Lib.newFromTemplate(t) });
    }
    for (const p of Packs.all()) for (const t of p.templates) {
      out.push({ key: p.id + ':' + t.id, name: t.name, cat: (p.cats && p.cats[t.cat]) || t.cat || p.name, src: p.name, pack: p, w: t.w, h: t.h, unit: t.unit || 'mm', n: t.tree ? 1 : t.pages.length, tags: t.tags || '', kids: p.id !== USER_PACK, thumb: () => t.thumb || packPreview(t), insert: () => insertPackTemplate(t), create: () => newFromPackTemplate(t), user: p.id === USER_PACK, raw: t });
    }
    return out;
  },
  symbols() {
    const out = [];
    for (const p of Packs.list) for (const s of p.symbols) out.push({ key: p.id + ':' + s.id, id: s.id, name: s.name, cat: (p.symCats && p.symCats[s.cat]) || s.cat, src: p.name, tags: s.tags || '', svg: s.svg, insert: at => insertSym(s.svg, s.name, at), kids: true });
    for (const s of (Packs.user && Packs.user.symbols) || []) out.push({ key: 'user:' + s.id, id: s.id, name: s.name, cat: 'Els meus símbols', src: 'Els meus', tags: '', svg: s.thumb, insert: at => insertUserSym(s, at), user: true, raw: s });
    for (const s of Lib.symbols()) out.push({ key: 'core:' + s.id, id: s.id, name: s.name, cat: s.label, src: 'Guaita', tags: '', svg: s.svg, insert: at => Lib.insertSymbol(s, at) });
    return out;
  },
};
const _ppCache = new Map();
function packPreview(t) {
  if (_ppCache.has(t)) return _ppCache.get(t);
  const st = new Store();
  st.doc = Store.blankDoc({ w: t.w, h: t.h, unit: t.unit || 'mm' });
  st.listeners.clear();
  let svg = '';
  try {
    const pid = st.pagesSorted()[0].id;
    st.setPage(pid, 'bg', t.pages[0].bg || '#ffffffff');
    const prev = R.curDoc; R.curDoc = st.doc;
    if (t.tree) insertTreeInto(st, t.tree, pid); else buildPackPage(st, pid, t.pages[0]);
    R.curDoc = prev;
    svg = R.pageSVG(pid, { store: st, pre: 'pp' + uid(4) + '-' }).replace(/<style>[\s\S]*?<\/style>/, '');
  } catch (e) { console.warn('vista prèvia', t.id, e); }
  _ppCache.set(t, svg);
  return svg;
}
function insertPackTemplate(t) {
  const st = App.store;
  st.begin('Insereix plantilla');
  const ids = buildPackTemplate(st, t, { after: App.pageId });
  st.commit();
  App.opts.pagesPanel = true;
  App.setPage(ids[0], { reveal: true });
  GL.pagesStrip.build();
  UI.toast(ids.length === 1 ? 'Pàgina afegida: ' + t.name : ids.length + ' pàgines afegides');
}
function newFromPackTemplate(t) {
  const doc = Store.blankDoc({ name: t.name.split(' · ').pop(), unit: t.unit || 'mm', w: t.w, h: t.h, grid: t.unit === 'px' ? 10 : fromU(5, 'mm') });
  GL.start.close();
  App.loadDoc(doc, []);
  const st = App.store;
  st.begin('Plantilla');
  buildPackTemplate(st, t, { reuse: st.pagesSorted()[0].id });
  st.commit();
  st.undoStack.length = 0; st.redoStack.length = 0;
  App.setPage(st.pagesSorted()[0].id);
  App.opts.pagesPanel = st.pagesSorted().length > 1;
  GL.pagesStrip.build();
  App.layoutPages(); App.fitPage();
  Autosave.now();
  if (Kids.on) GL.libPanel.toggle(true, 'sym');
}
function insertSym(svg, name, at) {
  const st = App.store, page = App.page();
  const size = Math.min(page.w, page.h) * 0.22;
  const c = at || pt(page.w / 2, page.h / 2);
  st.begin('Insereix ' + name);
  const id = placeSvg(st, App.pageId, svg, { x: c.x - size / 2, y: c.y - size / 2, w: size, h: size }, name);
  st.commit();
  if (id) { App.select([id]); setTool('select'); }
}
function insertUserSym(s, at) {
  const st = App.store, page = App.page();
  const c = at || pt(page.w / 2, page.h / 2);
  const b = s.box || { x: 0, y: 0, w: 0, h: 0 };
  st.begin('Insereix ' + s.name);
  const ids = insertTree(clone(s.tree), App.pageId, c.x - (b.x + b.w / 2), c.y - (b.y + b.h / 2));
  st.commit();
  App.select(ids); setTool('select');
}

/* ── biblioteca d'usuari ── */
async function saveUserTemplate() {
  const st = App.store, p = App.page();
  const kids = st.children(p.id);
  if (!kids.length) { UI.toast('La pàgina és buida', 'warn'); return; }
  const name = await UI.prompt('Desa la pàgina com a plantilla', 'Nom de la plantilla', p.name);
  if (!name) return;
  const tree = cloneTree(kids.map(o => o.id));
  const thumb = R.pageSVG(p.id, { pre: 'u' + uid(4) + '-' }).replace(/<style>[\s\S]*?<\/style>/, '');
  Packs.user.templates.push({ id: uid(), name: name.trim(), cat: 'meves', w: p.w, h: p.h, unit: st.props.unit, tree, thumb, pages: [{ bg: p.bg }] });
  Packs.user.cats = Object.assign({ meves: 'Les meves plantilles' }, Packs.user.cats);
  await Packs.saveUser();
  UI.toast('Plantilla desada a «Els meus»');
}
async function saveUserSymbol() {
  const st = App.store;
  const ids = topOnly(App.sel);
  if (!ids.length) { UI.toast('Selecciona els objectes que vols desar', 'warn'); return; }
  const name = await UI.prompt('Desa com a símbol', 'Nom del símbol', ids.length === 1 ? st.obj(ids[0]).name : 'Símbol');
  if (!name) return;
  const tree = cloneTree(ids);
  const box = G.selBox(ids);
  // miniatura: SVG d'una pàgina temporal amb només la selecció
  const tmp = new Store(); tmp.doc = Store.blankDoc({ w: Math.max(1, box.w), h: Math.max(1, box.h), unit: 'px', bg: '#ffffff00' }); tmp.listeners.clear();
  const pid = tmp.pagesSorted()[0].id;
  tmp.doc.props.colors = st.props.colors;
  insertTreeInto(tmp, tree, pid, -box.x, -box.y);
  const thumb = R.pageSVG(pid, { store: tmp, transparent: true, pre: 'us' + uid(4) + '-' }).replace(/<style>[\s\S]*?<\/style>/, '');
  Packs.user.symbols.push({ id: uid(), name: name.trim(), tree, box, thumb });
  await Packs.saveUser();
  UI.toast('Símbol desat a «Els meus»');
}
async function removeUserItem(kind, id) {
  const k = kind === 'tpl' ? 'templates' : 'symbols';
  Packs.user[k] = Packs.user[k].filter(x => x.id !== id);
  await Packs.saveUser();
}

/* ── gestor de paquets ── */
async function packsDialog() {
  const body = el('div');
  const draw = () => {
    body.textContent = '';
    body.append(el('p', { text: 'Els paquets afegeixen plantilles, il·lustracions i paletes. Es desen en aquest navegador i funcionen sense connexió.' }));
    const list = el('div', { class: 'pack-list' });
    const row = (p, user) => {
      const r = el('div', { class: 'pack-row' });
      r.append(el('div', { class: 'pack-ico', html: icon(user ? 'save' : 'layers') }));
      r.append(el('div', { class: 'pack-meta' }, el('b', { text: p.name }), el('span', { text: `${p.templates.length} plantilles · ${p.symbols.length} símbols${p.author ? ' · ' + p.author : ''}` })));
      const ex = el('button', { class: 'btn ghost', text: 'Exporta' });
      ex.addEventListener('click', () => Packs.exportPack(p));
      r.append(ex);
      if (!user) { const rm = el('button', { class: 'icon-btn sm', html: icon('trash'), 'data-tip': 'Treu el paquet' }); rm.addEventListener('click', async () => { if (await UI.confirm('Treu el paquet', `Es traurà «${p.name}» d'aquest navegador. Els documents que ja l'han fet servir no canvien.`, 'Treu', true)) { await Packs.remove(p.id); draw(); } }); r.append(rm); }
      list.append(r);
    };
    for (const p of Packs.list) row(p);
    row(Packs.user, true);
    if (!Packs.list.length) list.prepend(el('div', { class: 'p-note', text: 'Encara no hi ha cap paquet carregat.' }));
    body.append(list);
    const acts = el('div', { class: 'row', style: { marginTop: '14px' } });
    const bF = el('button', { class: 'btn', html: icon('upload') + '<span>Carrega un fitxer…</span>' }); bF.querySelector('svg').style.width = '14px';
    bF.addEventListener('click', async () => { const f = await pickFile('.json,.llencpack'); if (f) { await Packs.loadFile(f); draw(); } });
    const urlIn = el('input', { placeholder: 'o enganxa l\'adreça web d\'un paquet', spellcheck: 'false' });
    urlIn.addEventListener('keydown', async e => { e.stopPropagation(); if (e.key === 'Enter' && urlIn.value.trim()) { await Packs.loadURL(urlIn.value.trim()); draw(); } });
    acts.append(bF, el('div', { class: 'fld plain grow' }, urlIn));
    body.append(acts);
  };
  draw();
  await UI.dialog({ title: 'Paquets de biblioteca', body, width: 560, buttons: [{ label: 'Fet', primary: true }] });
  if (GL.libPanel.el && !GL.libPanel.el.hidden) GL.libPanel.render();
}
GL.packsDialog = packsDialog;

/* ── targetes amb miniatura diferida ── */
const ThumbQ = {
  q: [], busy: false,
  push(th, fn) { this.q.push([th, fn]); if (!this.busy) this.run(); },
  run() {
    this.busy = true;
    const step = (dl) => {
      const t0 = performance.now();
      while (this.q.length && performance.now() - t0 < 14) {
        const [th, fn] = this.q.shift();
        if (!th.isConnected) continue;
        th.innerHTML = fn();
        const s = th.querySelector('svg'); if (s) { s.removeAttribute('width'); s.removeAttribute('height'); }
      }
      if (this.q.length) (window.requestIdleCallback || requestAnimationFrame)(step); else this.busy = false;
      void dl;
    };
    (window.requestIdleCallback || requestAnimationFrame)(step);
  },
};
function tplCard(t, onClick, onRemove) {
  const card = el('button', { class: 'tpl-card', type: 'button', 'data-tip': t.name + (t.n > 1 ? ` · ${t.n} pàgines` : '') });
  const th = el('div', { class: 'tpl-th' });
  th.style.aspectRatio = `${t.w} / ${t.h}`;
  ThumbQ.push(th, t.thumb);
  const frame = el('div', { class: 'tpl-frame' }, th);
  if (t.n > 1) frame.append(el('span', { class: 'tpl-n', text: t.n }));
  card.append(frame, el('span', { text: t.name.split(' · ').pop() }));
  card.addEventListener('click', onClick);
  if (onRemove) card.addEventListener('contextmenu', e => { e.preventDefault(); UI.menu([{ label: 'Elimina de «Els meus»', run: onRemove }], e.clientX, e.clientY); });
  return card;
}
GL.tplCard = tplCard;

/* ── mode infantil ── */
const KIDS_FONTS = ['Fredoka', 'Baloo 2', 'IBM Plex Sans', 'IBM Plex Serif'];
const KIDS_COLORS = ['#ef476f', '#ff8c42', '#ffd23f', '#7ccf5b', '#2e8b57', '#5aa9e6', '#1d5fa8', '#8e6cdb', '#ff8fb1', '#8a5a3b', '#ffffff', '#2d2a32'];
const Kids = GL.kids = {
  on: false,
  init() {
    try { this.on = localStorage.getItem('guaitaLlenc.kids') === '1'; } catch (e) { }
    this.apply();
  },
  set(v) {
    this.on = !!v;
    try { localStorage.setItem('guaitaLlenc.kids', this.on ? '1' : '0'); } catch (e) { }
    this.apply();
    UI.toast(this.on ? 'Mode infantil activat' : 'Mode infantil desactivat');
  },
  apply() {
    document.body.classList.toggle('kids', this.on);
    if (this.on) { App.opts.rulers = false; App.opts.smart = true; }
    else App.opts.rulers = true;
    $('#app').classList.toggle('no-rulers', !App.opts.rulers);
    if (App.store && App.store.doc) { App.applyView(); GL.props && GL.props.rebuild(); }
    if (GL.toolbar && GL.toolbar.sync) GL.toolbar.sync();
  },
};
// estil per defecte del text en mode infantil
GL.kidsTextBase = () => Kids.on ? { ff: 'Fredoka', fw: 600, fs: 36 } : null;
