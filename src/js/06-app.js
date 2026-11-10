/* ── Nucli de l'aplicació: estat, vista, selecció, superposició ─ */
const ZMIN = 0.05, ZMAX = 64;

const App = GL.app = {
  store: null, renderer: null,
  sel: [], pageId: null, scope: null,
  tool: 'select', toolLock: false,
  view: 'page',
  z: 1, px: 0, py: 0,
  opts: { rulers: true, guides: true, guidesLocked: false, grid: false, snapGrid: false, smart: true, clip: true, pagesPanel: false, rightPanel: true },
  hover: null,
  mode: null,              // { type: 'text'|'nodes'|'crop', id, ... }
  pagePos: new Map(),
  listeners: { sel: new Set(), view: new Set(), page: new Set() },
  snapLines: [], snapGaps: [], marquee: null, badge: null, hud: null,
  ovExtra: null,
  labelRects: [],
  fileHandle: null, fileName: null,

  init() {
    this.stage = $('#stage');
    this.svg = $('#world');
    this.vpEl = $('#vp');
    this.ov = $('#overlay');
    this.shadowLayer = $('#pageShadows');
    this.rulerT = $('#rulerTop'); this.rulerL = $('#rulerLeft');
    this.store = GL.store = new Store();
    this.renderer = new Renderer(this.store, this.svg);
    this.drawOv = rafThrottle(() => this.drawOverlay());
    this.drawRulers = rafThrottle(() => this.paintRulers());
    this.store.on(ch => this.onStoreChange(ch));
    new ResizeObserver(() => { this.applyView(); }).observe(this.stage);
  },
  on(ev, fn) { this.listeners[ev].add(fn); },
  emit(ev, d) { for (const fn of this.listeners[ev]) { try { fn(d); } catch (e) { console.error(e); } } },

  /* ── document ── */
  loadDoc(doc, log, opt = {}) {
    this.mode = null; this.sel = []; this.scope = null; this.hover = null;
    this.store.load(doc, log, opt.ts);
    const pages = this.store.pagesSorted();
    this.pageId = pages[0].id;
    this.fileHandle = opt.handle || null;
    this.fileName = opt.fileName || null;
    $('#app').classList.remove('no-doc');
    this.opts.pagesPanel = pages.length > 1;
    this.renderer.invalidateAll();
    this.renderer.flush();
    this.layoutPages();
    this.fitPage();
    this.emit('sel'); this.emit('page'); this.emit('view');
    GL.panels && GL.panels.refreshAll();
  },
  onStoreChange(ch) {
    if (!this.store.doc) return;
    // neteja selecció d'objectes eliminats
    if (ch.objs && ch.objs.size || ch.all) {
      const before = this.sel.length;
      this.sel = this.sel.filter(id => this.store.obj(id));
      if (this.scope && !this.store.obj(this.scope)) this.scope = null;
      if (this.mode && this.mode.id && !this.store.obj(this.mode.id)) this.exitMode();
      if (before !== this.sel.length) this.emit('sel');
    }
    if (!this.store.page(this.pageId)) { const p = this.store.pagesSorted()[0]; if (p) this.setPage(p.id); }
    this.drawOv();
  },
  afterRender() { this.drawOv(); this.updateEmpty(); },

  /* ── pàgines ── */
  page() { return this.store.page(this.pageId); },
  setPage(id, opt = {}) {
    if (!this.store.page(id)) return;
    const changed = id !== this.pageId;
    if (changed) { this.exitMode(); this.sel = []; this.scope = null; }
    this.pageId = id;
    this.layoutPages();
    if (this.view === 'page' && changed && !opt.keepView) this.fitPage();
    else if (this.view === 'all' && changed && opt.reveal) this.revealPage(id);
    this.emit('page'); this.emit('sel');
  },
  layoutPages() {
    const st = this.store; if (!st.doc) return;
    const pages = st.pagesSorted();
    this.pagePos.clear();
    if (this.view === 'page') {
      for (const p of pages) this.pagePos.set(p.id, { x: 0, y: 0, vis: p.id === this.pageId });
    } else {
      const gap = 80;
      const n = pages.length;
      const cols = n <= 3 ? n : Math.ceil(Math.sqrt(n * 1.6));
      let x = 0, y = 0, rowH = 0, col = 0;
      for (const p of pages) {
        if (col === cols) { col = 0; x = 0; y += rowH + gap; rowH = 0; }
        this.pagePos.set(p.id, { x, y, vis: true });
        x += p.w + gap; rowH = Math.max(rowH, p.h); col++;
      }
    }
    for (const p of pages) {
      const g = this.renderer.pageEls.get(p.id);
      const pos = this.pagePos.get(p.id);
      if (!g) continue;
      g.setAttribute('transform', `translate(${pos.x} ${pos.y})`);
      g.style.display = pos.vis ? '' : 'none';
      g._pc.setAttribute('clip-path', this.opts.clip ? `url(#pgc-${p.id})` : '');
      if (!this.opts.clip) g._pc.removeAttribute('clip-path');
    }
    this.applyView();
  },
  pageAt(w) { // pàgina sota un punt del món
    for (const p of this.store.pagesSorted()) {
      const pos = this.pagePos.get(p.id);
      if (pos && pos.vis && w.x >= pos.x && w.x <= pos.x + p.w && w.y >= pos.y && w.y <= pos.y + p.h) return p.id;
    }
    return null;
  },
  worldRect() { // rectangle de totes les pàgines visibles
    const rs = [];
    for (const p of this.store.pagesSorted()) { const pos = this.pagePos.get(p.id); if (pos && pos.vis) rs.push({ x: pos.x, y: pos.y, w: p.w, h: p.h }); }
    return rectUnion(rs);
  },

  /* ── vista ── */
  setView(v) {
    if (v === this.view) return;
    const prevPage = this.pageId;
    this.view = v;
    this.exitMode();
    this.layoutPages();
    if (v === 'all') this.zoomToRect(this.worldRect(), 60); else this.fitPage();
    $$('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    this.pageId = prevPage;
    this.emit('view');
  },
  applyView() {
    if (!this.store || !this.store.doc) return;
    this.vpEl.setAttribute('transform', `matrix(${this.z} 0 0 ${this.z} ${this.px} ${this.py})`);
    // ombres de pàgina
    const frag = document.createDocumentFragment();
    for (const p of this.store.pagesSorted()) {
      const pos = this.pagePos.get(p.id);
      if (!pos || !pos.vis) continue;
      const s = this.w2s(pt(pos.x, pos.y));
      frag.append(el('div', { class: 'pg-shadow' + (p.id === this.pageId ? ' active' : ''), style: { left: s.x + 'px', top: s.y + 'px', width: p.w * this.z + 'px', height: p.h * this.z + 'px' } }));
    }
    this.shadowLayer.textContent = ''; this.shadowLayer.append(frag);
    this.drawOv(); this.drawRulers();
    if (GL.textEdit) GL.textEdit.position();
    const zs = Math.round(this.z * 100) + '%';
    $('#zoomBtn').firstChild.textContent = zs;
    $('#stZoom').textContent = zs;
  },
  stageSize() { return { w: this.stage.clientWidth, h: this.stage.clientHeight }; },
  zoomAt(nz, sx, sy) {
    nz = clamp(nz, ZMIN, ZMAX);
    const w = this.s2w(pt(sx, sy));
    this.z = nz;
    this.px = sx - w.x * nz; this.py = sy - w.y * nz;
    this.applyView();
  },
  zoomStep(dir) {
    const steps = [0.05, 0.1, 0.125, 0.25, 0.333, 0.5, 0.667, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64];
    let nz;
    if (dir > 0) nz = steps.find(s => s > this.z * 1.001) || ZMAX;
    else nz = steps.slice().reverse().find(s => s < this.z * 0.999) || ZMIN;
    const { w, h } = this.stageSize();
    this.zoomAt(nz, w / 2, h / 2);
  },
  zoomToRect(r, pad = 48) {
    if (!r) return;
    const { w, h } = this.stageSize();
    if (!w || !h) return;
    const z = clamp(Math.min((w - pad * 2) / Math.max(r.w, 1), (h - pad * 2) / Math.max(r.h, 1)), ZMIN, ZMAX);
    this.z = z;
    this.px = w / 2 - (r.x + r.w / 2) * z;
    this.py = h / 2 - (r.y + r.h / 2) * z;
    this.applyView();
  },
  fitPage() {
    const p = this.page(); if (!p) return;
    const pos = this.pagePos.get(p.id) || { x: 0, y: 0 };
    this.zoomToRect({ x: pos.x, y: pos.y, w: p.w, h: p.h }, 56);
  },
  zoom100() { const { w, h } = this.stageSize(); this.zoomAt(1, w / 2, h / 2); },
  fitSelection() {
    const b = this.selWorldBox();
    if (b) this.zoomToRect(b, 80); else this.fitPage();
  },
  revealPage(id) {
    const p = this.store.page(id), pos = this.pagePos.get(id);
    if (!p || !pos) return;
    const s1 = this.w2s(pt(pos.x, pos.y)), s2 = this.w2s(pt(pos.x + p.w, pos.y + p.h));
    const { w, h } = this.stageSize();
    if (s1.x < 0 || s1.y < 0 || s2.x > w || s2.y > h) this.zoomToRect({ x: pos.x, y: pos.y, w: p.w, h: p.h }, 56);
  },
  pan(dx, dy) { this.px += dx; this.py += dy; this.applyView(); },

  /* ── coordenades ── */
  w2s: function (p) { return { x: p.x * this.z + this.px, y: p.y * this.z + this.py }; },
  s2w: function (p) { return { x: (p.x - this.px) / this.z, y: (p.y - this.py) / this.z }; },
  evS(e) { const r = this.stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; },
  evW(e) { return this.s2w(this.evS(e)); },
  off(pageId) { return this.pagePos.get(pageId || this.pageId) || { x: 0, y: 0 }; },
  p2w(p, pageId) { const o = this.off(pageId); return { x: p.x + o.x, y: p.y + o.y }; },
  w2p(p, pageId) { const o = this.off(pageId); return { x: p.x - o.x, y: p.y - o.y }; },
  p2s(p, pageId) { return this.w2s(this.p2w(p, pageId)); },
  s2p(p, pageId) { return this.w2p(this.s2w(p), pageId); },

  /* ── selecció ── */
  objs(ids) { return (ids || this.sel).map(id => this.store.obj(id)).filter(Boolean); },
  select(ids, opt = {}) {
    ids = Array.from(new Set(ids)).filter(id => this.store.obj(id));
    if (!opt.keepMode && this.mode && this.mode.type !== 'text') this.exitMode();
    if (ids.length) {
      const pg = this.store.obj(ids[0]).page;
      ids = ids.filter(id => this.store.obj(id).page === pg);
      if (pg !== this.pageId) { this.pageId = pg; this.layoutPages(); this.emit('page'); }
    }
    if (eq(ids, this.sel)) return;
    this.sel = ids;
    this.emit('sel');
    this.drawOv();
  },
  clearSel() { this.select([]); },
  toggleSel(id) { this.select(this.sel.includes(id) ? this.sel.filter(x => x !== id) : this.sel.concat(id)); },
  isSel: function (id) { return this.sel.includes(id); },
  selWorldBox() {
    const b = G.selBox(this.sel);
    if (!b) return null;
    const pg = this.store.obj(this.sel[0]).page;
    const o = this.off(pg);
    return { x: b.x + o.x, y: b.y + o.y, w: b.w, h: b.h };
  },
  // objecte seleccionable a partir d'un element del DOM
  pickFromEl(target, deep) {
    const g = target && target.closest ? target.closest('[data-id]') : null;
    if (!g) return null;
    let id = g.getAttribute('data-id');
    let o = this.store.obj(id);
    if (!o || this.store.isLocked(id)) return null;
    if (deep) return id;
    // puja fins al fill directe de l'àmbit actual
    const scopeId = this.scope && this.store.obj(this.scope) && this.store.obj(this.scope).page === o.page ? this.scope : o.page;
    const chain = [o].concat(this.store.ancestors(id));
    const idx = chain.findIndex(x => x.parent === scopeId);
    if (idx >= 0) return chain[idx].id;
    // fora de l'àmbit: surt-ne
    return chain[chain.length - 1].id;
  },
  hitAt(e, deep) {
    const els = document.elementsFromPoint(e.clientX, e.clientY);
    for (const t of els) {
      if (!this.svg.contains(t)) continue;
      const id = this.pickFromEl(t, deep);
      if (id) return id;
    }
    return null;
  },
  enterScope(id) {
    this.scope = id;
    this.drawOv();
  },

  /* ── modes d'edició ── */
  setMode(m) { this.exitMode(); this.mode = m; this.emit('sel'); this.drawOv(); setHint(); },
  exitMode() {
    if (!this.mode) return;
    const m = this.mode; this.mode = null;
    if (m.type === 'text' && GL.textEdit) GL.textEdit.end();
    if (m.type === 'pen' && GL.tools.pen) GL.tools.pen.finish(true);
    this.emit('sel'); this.drawOv(); setHint();
  },

  /* ── estat buit ── */
  updateEmpty() {
    const hint = $('#emptyHint');
    const p = this.page();
    const empty = p && this.view === 'page' && !this.store.children(p.id).length && !this.mode;
    hint.hidden = !empty;
    if (empty) {
      const pos = this.off(p.id);
      const c = this.w2s(pt(pos.x + p.w / 2, pos.y + p.h / 2));
      hint.style.left = c.x + 'px'; hint.style.top = c.y + 'px';
      hint.style.display = p.w * this.z < 360 || p.h * this.z < 180 ? 'none' : '';
    }
  },

  /* ── superposició ── */
  objFramePts(o) { // cantonades del marc en pantalla
    const pg = o.page;
    if (o.type === 'line') return null;
    if (o.type === 'group') { const b = G.aabb(o); return [pt(b.x, b.y), pt(b.x + b.w, b.y), pt(b.x + b.w, b.y + b.h), pt(b.x, b.y + b.h)].map(p => this.p2s(p, pg)); }
    return G.corners(o).map(p => this.p2s(p, pg));
  },
  // marc de transformació de la selecció (en coordenades de pàgina)
  selFrame() {
    const objs = this.objs();
    if (!objs.length) return null;
    if (objs.length === 1) {
      const o = objs[0];
      if (o.type === 'line') return { line: true, o, page: o.page };
      if (o.type !== 'group') return { x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot || 0, o, page: o.page, text: o.type === 'text' };
    }
    const b = G.selBox(this.sel);
    return { x: b.x, y: b.y, w: b.w, h: b.h, rot: 0, page: objs[0].page, multi: true };
  },
  // nanses en pantalla
  handles() {
    const f = this.selFrame();
    if (!f || this.mode) return [];
    if (this.objs().some(o => this.store.isLocked(o.id))) return [];
    const out = [];
    if (f.line) {
      out.push({ k: 'p1', s: this.p2s(f.o.p1, f.page) }, { k: 'p2', s: this.p2s(f.o.p2, f.page) });
      return out;
    }
    const m = Mx.chain(Mx.tr(f.x + f.w / 2, f.y + f.h / 2), Mx.rot(f.rot * DEG), Mx.tr(-f.w / 2, -f.h / 2));
    const P = (u, v) => this.p2s(Mx.ap(m, pt(u * f.w, v * f.h)), f.page);
    const sw = f.w * this.z, sh = f.h * this.z;
    const small = sw < 26 || sh < 26;
    const pos = [[0, 0], [.5, 0], [1, 0], [1, .5], [1, 1], [.5, 1], [0, 1], [0, .5]];
    pos.forEach(([u, v], i) => {
      const side = i % 2 === 1;
      if (f.text && (i === 1 || i === 5)) return;
      if (side && small) return;
      if (side && (i === 1 || i === 5) && sw < 40) return;
      if (side && (i === 3 || i === 7) && sh < 40) return;
      out.push({ k: 'r', i, s: P(u, v), side });
    });
    // zones de rotació a fora de les cantonades
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([u, v], i) => {
      const c = P(u, v), ctr = P(.5, .5);
      const d = Math.hypot(c.x - ctr.x, c.y - ctr.y) || 1;
      out.push({ k: 'rot', i, s: pt(c.x + (c.x - ctr.x) / d * 12, c.y + (c.y - ctr.y) / d * 12), ang: Math.atan2(c.y - ctr.y, c.x - ctr.x) });
    });
    return out;
  },
  drawOverlay() {
    const st = this.store; if (!st.doc) return;
    const z = this.z;
    let h = '';
    const P = (p, pg) => this.p2s(p, pg);
    const poly = ps => ps.map(p => rnd(p.x, 1) + ',' + rnd(p.y, 1)).join(' ');
    const { w: SW, h: SH } = this.stageSize();
    // etiquetes de pàgina (vista de totes)
    this.labelRects = [];
    if (this.view === 'all') {
      for (const p of st.pagesSorted()) {
        const pos = this.pagePos.get(p.id); if (!pos) continue;
        const s = this.w2s(pt(pos.x, pos.y));
        const act = p.id === this.pageId;
        h += `<text class="ov-label${act ? ' active' : ''}" x="${s.x}" y="${s.y - 8}">${esc(p.name)}</text>`;
        this.labelRects.push({ id: p.id, x: s.x, y: s.y - 22, w: Math.max(60, String(p.name || '').length * 7), h: 18 });
      }
    }
    // graella
    if (this.opts.grid) {
      const g = st.props.grid || fromU(5, 'mm');
      const gs = g * z;
      if (gs >= 4) {
        for (const p of st.pagesSorted()) {
          const pos = this.pagePos.get(p.id); if (!pos || !pos.vis) continue;
          const s = this.w2s(pt(pos.x, pos.y));
          const id = 'gridp-' + p.id;
          h += `<defs><pattern id="${id}" x="${s.x}" y="${s.y}" width="${gs}" height="${gs}" patternUnits="userSpaceOnUse"><path d="M${gs} 0V${gs}H0" fill="none" stroke="rgba(49,198,255,.22)" stroke-width="1"/></pattern></defs>`;
          h += `<rect x="${s.x}" y="${s.y}" width="${p.w * z}" height="${p.h * z}" fill="url(#${id})"/>`;
        }
      }
    }
    // guies de regle
    if (this.opts.guides) {
      for (const p of st.pagesSorted()) {
        const pos = this.pagePos.get(p.id); if (!pos || !pos.vis || !p.guides) continue;
        const hot = this.guideHot && this.guideHot.page === p.id ? this.guideHot : null;
        const xs = this.view === 'all' ? [this.w2s(pt(pos.x, 0)).x, this.w2s(pt(pos.x + p.w, 0)).x] : [0, SW];
        const ys = this.view === 'all' ? [this.w2s(pt(0, pos.y)).y, this.w2s(pt(0, pos.y + p.h)).y] : [0, SH];
        (p.guides.h || []).forEach((gy, i) => { const y = rnd(this.p2s(pt(0, gy), p.id).y, 1) + .5; h += `<line class="${hot && hot.axis === 'h' && hot.i === i ? 'ov-guide-hot' : 'ov-guide'}" x1="${xs[0]}" x2="${xs[1]}" y1="${y}" y2="${y}"/>`; });
        (p.guides.v || []).forEach((gx, i) => { const x = rnd(this.p2s(pt(gx, 0), p.id).x, 1) + .5; h += `<line class="${hot && hot.axis === 'v' && hot.i === i ? 'ov-guide-hot' : 'ov-guide'}" y1="${ys[0]}" y2="${ys[1]}" x1="${x}" x2="${x}"/>`; });
      }
    }
    if (this.guideDrag) {
      const g = this.guideDrag;
      if (g.axis === 'h') h += `<line class="ov-guide-hot" x1="0" x2="${SW}" y1="${g.s}" y2="${g.s}"/>`;
      else h += `<line class="ov-guide-hot" y1="0" y2="${SH}" x1="${g.s}" x2="${g.s}"/>`;
    }
    // àmbit de grup
    if (this.scope && st.obj(this.scope)) {
      const ps = this.objFramePts(st.obj(this.scope));
      if (ps) h += `<polygon class="ov-dash" points="${poly(ps)}"/>`;
    }
    // hover
    if (this.hover && !this.isSel(this.hover) && st.obj(this.hover) && !this.drag) {
      h += this.outlineOf(st.obj(this.hover), 'ov-hover');
    }
    const mode = this.mode;
    // selecció
    if (!mode || mode.type === 'text') {
      const objs = this.objs();
      const multi = objs.length > 1 || (objs[0] && objs[0].type === 'group');
      if (multi || (mode && mode.type === 'text')) for (const o of objs) h += this.outlineOf(o, 'ov-line', true);
      const f = this.selFrame();
      if (f && !(mode && mode.type === 'text')) {
        if (f.line) {
          const a = P(f.o.p1, f.page), b = P(f.o.p2, f.page);
          h += `<line class="ov-halo" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><line class="ov-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
        } else {
          const m = Mx.chain(Mx.tr(f.x + f.w / 2, f.y + f.h / 2), Mx.rot(f.rot * DEG), Mx.tr(-f.w / 2, -f.h / 2));
          const ps = [pt(0, 0), pt(f.w, 0), pt(f.w, f.h), pt(0, f.h)].map(q => P(Mx.ap(m, q), f.page));
          h += `<polygon class="ov-halo" points="${poly(ps)}"/><polygon class="ov-line" points="${poly(ps)}"/>`;
        }
        for (const hd of this.handles()) {
          if (hd.k === 'rot') continue;
          if (hd.k === 'p1' || hd.k === 'p2') { h += `<circle class="ov-handle" cx="${hd.s.x}" cy="${hd.s.y}" r="4.5"/>`; continue; }
          const sz = hd.side ? 6 : 8;
          if (hd.side) {
            const ang = f.rot + ((hd.i === 1 || hd.i === 5) ? 0 : 90);
            h += `<rect class="ov-handle" x="${-sz * 1.6 / 2}" y="${-sz / 2 + 1}" width="${sz * 1.6}" height="${sz - 2}" rx="2" transform="translate(${rnd(hd.s.x, 1)} ${rnd(hd.s.y, 1)}) rotate(${ang})"/>`;
          } else h += `<rect class="ov-handle" x="${-sz / 2}" y="${-sz / 2}" width="${sz}" height="${sz}" rx="1.5" transform="translate(${rnd(hd.s.x, 1)} ${rnd(hd.s.y, 1)}) rotate(${f.rot})"/>`;
        }
        // insígnia de mida
        if (!this.hud) {
          const bx = this.selWorldBox();
          if (bx) {
            const u = st.props.unit;
            const txt = f.line ? fmtLen(Math.hypot(f.o.p2.x - f.o.p1.x, f.o.p2.y - f.o.p1.y), u) + ' ' + u : `${fmtLen(f.multi ? bx.w : f.w, u)} × ${fmtLen(f.multi ? bx.h : f.h, u)}`;
            const bottom = this.w2s(pt(bx.x + bx.w / 2, bx.y + bx.h));
            h += this.badgeSVG(txt, bottom.x, bottom.y + 18);
          }
        }
      }
    }
    // modes
    if (mode && mode.type === 'nodes') h += GL.tools.nodes.overlay();
    if (mode && mode.type === 'crop') h += GL.tools.crop.overlay();
    if (mode && mode.type === 'pen') h += GL.tools.pen.overlay();
    if (this.ovExtra) h += this.ovExtra;
    // guies intel·ligents
    for (const l of this.snapLines) {
      const a = this.p2s(l.a, l.page), b = this.p2s(l.b, l.page);
      h += `<line class="ov-snap" x1="${rnd(a.x, 1) + .5}" y1="${rnd(a.y, 1) + .5}" x2="${rnd(b.x, 1) + .5}" y2="${rnd(b.y, 1) + .5}"/>`;
      if (l.dots) for (const d of l.dots) { const s = this.p2s(d, l.page); h += `<path class="ov-snap" d="M${s.x - 3} ${s.y - 3}l6 6m0-6l-6 6"/>`; }
    }
    for (const g of this.snapGaps) {
      const a = this.p2s(g.a, g.page), b = this.p2s(g.b, g.page);
      h += `<line class="ov-gap" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
      const cap = g.axis === 'x' ? `M${a.x} ${a.y - 4}v8M${b.x} ${b.y - 4}v8` : `M${a.x - 4} ${a.y}h8M${b.x - 4} ${b.y}h8`;
      h += `<path class="ov-gap" d="${cap}"/>`;
      if (g.label) h += this.badgeSVG(g.label, (a.x + b.x) / 2, (a.y + b.y) / 2 + (g.axis === 'x' ? 14 : 0) , 'mag', g.axis === 'y' ? 26 : 0);
    }
    // selecció per rectangle
    if (this.marquee) {
      const m = this.marquee;
      h += `<rect class="ov-marquee" x="${Math.min(m.a.x, m.b.x)}" y="${Math.min(m.a.y, m.b.y)}" width="${Math.abs(m.b.x - m.a.x)}" height="${Math.abs(m.b.y - m.a.y)}"/>`;
    }
    if (this.hud) h += this.badgeSVG(this.hud.text, this.hud.x, this.hud.y);
    this.ov.innerHTML = h;
  },
  badgeSVG(txt, x, y, cls, dx = 0) {
    const w = txt.length * 6.4 + 12;
    return `<g class="ov-badge${cls ? ' ' + cls : ''}" transform="translate(${rnd(x - w / 2 + dx, 1)} ${rnd(y - 9, 1)})"><rect width="${rnd(w, 1)}" height="18" rx="4"/><text x="${rnd(w / 2, 1)}" y="12.6" text-anchor="middle">${esc(txt)}</text></g>`;
  },
  outlineOf(o, cls, thin) {
    const pg = o.page;
    if (o.type === 'line') {
      const a = this.p2s(o.p1, pg), b = this.p2s(o.p2, pg);
      return `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    }
    if (o.type === 'path' || o.type === 'ellipse') {
      const sp = o.type === 'path' ? G.pageSP(o) : G.mapSP(G.ellipseNodes(o.w, o.h), p => Mx.ap(G.matrix(o), p));
      return `<path class="${cls}" d="${G.pathD(G.mapSP(sp, p => this.p2s(p, pg)))}"/>`;
    }
    const ps = this.objFramePts(o);
    return ps ? `<polygon class="${cls}" points="${ps.map(p => rnd(p.x, 1) + ',' + rnd(p.y, 1)).join(' ')}"/>` : '';
  },

  /* ── regles ── */
  paintRulers() {
    if (!this.opts.rulers || !this.store.doc) return;
    const dpr = window.devicePixelRatio || 1;
    const u = this.store.props.unit;
    const upx = UNITS[u];
    const pos = this.off();
    const sel = this.selWorldBox();
    $('#rulerCorner').textContent = u;
    for (const [cv, horiz] of [[this.rulerT, true], [this.rulerL, false]]) {
      const W = cv.clientWidth, H = cv.clientHeight;
      if (!W || !H) continue;
      if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      const c = cv.getContext('2d');
      if (!c) continue;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#111413'; c.fillRect(0, 0, W, H);
      const len = horiz ? W : H;
      const origin = horiz ? this.w2s(pt(pos.x, 0)).x : this.w2s(pt(0, pos.y)).y;
      const ppu = this.z * upx; // píxels de pantalla per unitat
      // pas "bonic"
      const raw = 64 / ppu;
      const pow = Math.pow(10, Math.floor(Math.log10(raw)));
      const step = [1, 2, 5, 10].map(k => k * pow).find(s => s >= raw) || 10 * pow;
      const sub = step / (String(step / pow).startsWith('2') ? 4 : 5);
      // pàgina i selecció
      const p = this.page();
      if (p) {
        const a = origin, b = origin + (horiz ? p.w : p.h) * this.z;
        c.fillStyle = '#1a1f1d';
        if (horiz) c.fillRect(a, 0, b - a, H); else c.fillRect(0, a, W, b - a);
      }
      if (sel) {
        const a = (horiz ? this.w2s(pt(sel.x, 0)).x : this.w2s(pt(0, sel.y)).y);
        const b = (horiz ? this.w2s(pt(sel.x + sel.w, 0)).x : this.w2s(pt(0, sel.y + sel.h)).y);
        c.fillStyle = 'rgba(200,255,46,.09)';
        if (horiz) c.fillRect(a, 0, b - a, H); else c.fillRect(0, a, W, b - a);
        c.fillStyle = 'rgba(200,255,46,.7)';
        if (horiz) { c.fillRect(Math.round(a), 0, 1, H); c.fillRect(Math.round(b) - 1, 0, 1, H); } else { c.fillRect(0, Math.round(a), W, 1); c.fillRect(0, Math.round(b) - 1, W, 1); }
      }
      c.strokeStyle = '#3a423e'; c.fillStyle = '#7b8580';
      c.font = '500 9px "IBM Plex Mono", monospace';
      c.lineWidth = 1;
      const v0 = (-origin) / ppu, v1 = (len - origin) / ppu;
      const startS = Math.floor(v0 / sub) * sub;
      c.beginPath();
      for (let v = startS; v <= v1; v += sub) {
        const s = Math.round(origin + v * ppu) + .5;
        const major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
        const tl = major ? (horiz ? H : W) : (horiz ? H * .3 : W * .3);
        if (horiz) { c.moveTo(s, H); c.lineTo(s, H - tl); } else { c.moveTo(W, s); c.lineTo(W - tl, s); }
        if (major) {
          const lab = fmtNum(v, step < 1 ? 2 : 0);
          if (horiz) c.fillText(lab, s + 3, 9);
          else { c.save(); c.translate(9, s + 3); c.rotate(-Math.PI / 2); c.textAlign = 'right'; c.fillText(lab, 0, 0); c.restore(); }
        }
      }
      c.stroke();
      // cursor
      if (this.cursorS) {
        const s = Math.round(horiz ? this.cursorS.x : this.cursorS.y) + .5;
        c.strokeStyle = '#c8ff2e'; c.beginPath();
        if (horiz) { c.moveTo(s, 0); c.lineTo(s, H); } else { c.moveTo(0, s); c.lineTo(W, s); }
        c.stroke();
      }
    }
  },
};

/* text d'ajuda contextual a la barra d'estat */
function setHint(txt) {
  const e = $('#stHint');
  if (!e) return;
  if (txt == null) {
    const m = App.mode;
    const k = s => s.replace(/\[(.+?)\]/g, (_, x) => `<kbd>${keyLabel(x)}</kbd>`);
    const T = {
      select: App.sel.length ? '[Shift] proporcional · [Alt] des del centre · [Alt]+arrossega per duplicar' : 'Fes clic per seleccionar · arrossega per a selecció múltiple · [Space] per desplaçar',
      hand: 'Arrossega per desplaçar la vista',
      rect: 'Arrossega per dibuixar · [Shift] quadrat · [Alt] des del centre',
      ellipse: 'Arrossega per dibuixar · [Shift] cercle · [Alt] des del centre',
      polygon: 'Arrossega per dibuixar · [Shift] proporcional',
      star: 'Arrossega per dibuixar · [Shift] proporcional',
      line: 'Arrossega per traçar · [Shift] angles de 45°',
      arrow: 'Arrossega per traçar · [Shift] angles de 45°',
      pen: 'Clic: vèrtex · arrossega: corba · clic al primer node per tancar · [Enter] acaba',
      text: 'Clic: text lliure · arrossega: caixa de text amb amplada fixa',
    };
    let s = T[App.tool] || '';
    if (m && m.type === 'nodes') s = 'Arrossega nodes i nanses · doble clic: suau/cantó · clic al traç: afegeix node · [Del] elimina · [Esc] surt';
    if (m && m.type === 'crop') s = 'Arrossega la imatge per encaixar-la · nanses: retall · [Enter] o [Esc] per acabar';
    if (m && m.type === 'text') s = '[Esc] o clic fora per acabar l\'edició';
    if (m && m.type === 'pen') s = T.pen;
    e.innerHTML = k(s);
  } else e.innerHTML = txt;
}
GL.setHint = setHint;
