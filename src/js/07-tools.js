/* ── Interacció amb el llenç: eines, ajustos, edició ──────────── */
const Tools = GL.tools = {};
const ROT_CURSOR = (a) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><g transform='rotate(${Math.round(a)} 12 12)'><path d='M7 15a7 7 0 0 1 10 -6' fill='none' stroke='white' stroke-width='4'/><path d='M7 15a7 7 0 0 1 10 -6' fill='none' stroke='black' stroke-width='1.6'/><path d='M14.5 6l3.5 3-4 2z' fill='black' stroke='white' stroke-width='1'/><path d='M5 12.5l2 3.5 3-3z' fill='black' stroke='white' stroke-width='1'/></g></svg>`)}") 12 12, crosshair`;
const RESIZE_CURSORS = ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'];
function resizeCursor(deg) { const a = ((deg % 180) + 180) % 180; return RESIZE_CURSORS[Math.round(a / 45) % 4]; }
const PEN_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M4 3l9 4.5-2.4 2.4 4 9-2.2 1-4-9L6 13z' fill='black' stroke='white' stroke-width='1.2' stroke-linejoin='round'/></svg>`)}") 4 3, crosshair`;

/* ── Ajustos (guies intel·ligents) ─────────────────────────────── */
const Snap = {
  c: null,
  prepare(pageId, exclude) {
    const st = App.store, page = st.page(pageId);
    const ex = new Set();
    for (const id of exclude) { ex.add(id); for (const d of st.descendants(id)) ex.add(d.id); for (const a of st.ancestors(id)) ex.add(a.id); }
    const xs = [], ys = [], rects = [];
    const pr = { x: 0, y: 0, w: page.w, h: page.h };
    xs.push({ v: 0, r: pr }, { v: page.w / 2, r: pr, mid: 1 }, { v: page.w, r: pr });
    ys.push({ v: 0, r: pr }, { v: page.h / 2, r: pr, mid: 1 }, { v: page.h, r: pr });
    if (App.opts.smart) {
      for (const id in st.doc.objs) {
        const o = st.doc.objs[id];
        if (o.page !== pageId || ex.has(id) || !st.isVisible(id)) continue;
        const r = G.aabb(o);
        if (!r || !isFinite(r.x)) continue;
        if (o.parent === pageId || (App.scope && o.parent === App.scope)) rects.push(r);
        xs.push({ v: r.x, r }, { v: r.x + r.w / 2, r, mid: 1 }, { v: r.x + r.w, r });
        ys.push({ v: r.y, r }, { v: r.y + r.h / 2, r, mid: 1 }, { v: r.y + r.h, r });
      }
    }
    if (App.opts.guides && page.guides) {
      for (const g of page.guides.v || []) xs.push({ v: g, guide: 1 });
      for (const g of page.guides.h || []) ys.push({ v: g, guide: 1 });
    }
    this.c = { pageId, xs, ys, rects, page };
  },
  T() { return 6 / App.z; },
  best(vals, cands) {
    const T = this.T();
    let best = null;
    for (const mv of vals) for (const c of cands) {
      const d = c.v - mv.v;
      if (Math.abs(d) <= T && (!best || Math.abs(d) < Math.abs(best.d) - 1e-9)) best = { d, c, mv };
    }
    return best;
  },
  grid(v) { const g = App.store.props.grid || 1; return Math.round(v / g) * g; },
  // ajusta una caixa en moviment; axes: quins valors de la caixa poden ajustar
  box(b, opt = {}) {
    const res = { dx: 0, dy: 0, lines: [], gaps: [] };
    if (!this.c) return res;
    const useGrid = App.opts.snapGrid;
    const X = opt.xs || [{ v: b.x, k: 0 }, { v: b.x + b.w / 2, k: 1 }, { v: b.x + b.w, k: 2 }];
    const Y = opt.ys || [{ v: b.y, k: 0 }, { v: b.y + b.h / 2, k: 1 }, { v: b.y + b.h, k: 2 }];
    let bx = opt.noX ? null : this.best(X, this.c.xs);
    let by = opt.noY ? null : this.best(Y, this.c.ys);
    if (bx) res.dx = bx.d; else if (useGrid && !opt.noX) { const g = this.grid(X[0].v); if (Math.abs(g - X[0].v) <= this.T() * 2) res.dx = g - X[0].v; }
    if (by) res.dy = by.d; else if (useGrid && !opt.noY) { const g = this.grid(Y[0].v); if (Math.abs(g - Y[0].v) <= this.T() * 2) res.dy = g - Y[0].v; }
    // espais iguals entre veïns (només en moure)
    if (opt.gaps && App.opts.smart) {
      const nb = { x: b.x + res.dx, y: b.y + res.dy, w: b.w, h: b.h };
      if (!bx) { const g = this.equalGap(nb, 'x'); if (g) { res.dx += g.d; res.gaps.push(...g.marks); } }
      if (!by) { const g = this.equalGap(nb, 'y'); if (g) { res.dy += g.d; res.gaps.push(...g.marks); } }
    }
    const fb = { x: b.x + res.dx, y: b.y + res.dy, w: b.w, h: b.h };
    if (bx) this.linesFor('x', bx.c.v, fb, res.lines, X.map(v => v.v + res.dx));
    if (by) this.linesFor('y', by.c.v, fb, res.lines, Y.map(v => v.v + res.dy));
    return res;
  },
  point(p, opt = {}) {
    const r = this.box({ x: p.x, y: p.y, w: 0, h: 0 }, { xs: [{ v: p.x }], ys: [{ v: p.y }], noX: opt.noX, noY: opt.noY });
    return r;
  },
  linesFor(axis, v, fb, out, moving) {
    if (!moving.some(m => Math.abs(m - v) < 1e-6)) return;
    const pg = this.c.pageId;
    const cands = (axis === 'x' ? this.c.xs : this.c.ys).filter(c => Math.abs(c.v - v) < 1e-6);
    let lo = axis === 'x' ? fb.y : fb.x, hi = axis === 'x' ? fb.y + fb.h : fb.x + fb.w;
    const dots = [];
    for (const c of cands) {
      if (c.guide) continue;
      if (!c.r) continue;
      if (axis === 'x') { lo = Math.min(lo, c.r.y); hi = Math.max(hi, c.r.y + c.r.h); dots.push(pt(v, c.r.y), pt(v, c.r.y + c.r.h)); }
      else { lo = Math.min(lo, c.r.x); hi = Math.max(hi, c.r.x + c.r.w); dots.push(pt(c.r.x, v), pt(c.r.x + c.r.w, v)); }
    }
    if (axis === 'x') { dots.push(pt(v, fb.y), pt(v, fb.y + fb.h)); out.push({ a: pt(v, lo), b: pt(v, hi), page: pg, dots }); }
    else { dots.push(pt(fb.x, v), pt(fb.x + fb.w, v)); out.push({ a: pt(lo, v), b: pt(hi, v), page: pg, dots }); }
  },
  equalGap(b, axis) {
    const T = this.T();
    const rs = this.c.rects;
    const X = axis === 'x';
    const over = r => X ? (r.y < b.y + b.h && r.y + r.h > b.y) : (r.x < b.x + b.w && r.x + r.w > b.x);
    const lo = X ? b.x : b.y, sz = X ? b.w : b.h;
    let L = null, Rn = null;
    for (const r of rs) {
      if (!over(r)) continue;
      const a = X ? r.x : r.y, e = X ? r.x + r.w : r.y + r.h;
      if (e <= lo + T && (!L || e > (X ? L.x + L.w : L.y + L.h))) L = r;
      if (a >= lo + sz - T && (!Rn || a < (X ? Rn.x : Rn.y))) Rn = r;
    }
    if (!L || !Rn) return null;
    const le = X ? L.x + L.w : L.y + L.h, rs0 = X ? Rn.x : Rn.y;
    const target = (le + rs0 - sz) / 2;
    const d = target - lo;
    if (Math.abs(d) > T || rs0 - le < sz) return null;
    const gap = target - le;
    if (gap < 0.5) return null;
    const mid = X ? b.y + b.h / 2 : b.x + b.w / 2;
    const pg = this.c.pageId, u = App.store.props.unit;
    const lab = fmtLen(gap, u);
    const marks = X
      ? [{ a: pt(le, mid), b: pt(target, mid), axis: 'x', page: pg, label: lab }, { a: pt(target + sz, mid), b: pt(rs0, mid), axis: 'x', page: pg, label: lab }]
      : [{ a: pt(mid, le), b: pt(mid, target), axis: 'y', page: pg, label: lab }, { a: pt(mid, target + sz), b: pt(mid, rs0), axis: 'y', page: pg, label: lab }];
    return { d, marks };
  },
  clear() { this.c = null; App.snapLines = []; App.snapGaps = []; },
};
GL.Snap = Snap;

/* ── Encaminament de punter ─────────────────────────────────────── */
const Pointer = {
  pts: new Map(), gesture: null, spaceDown: false, panning: null,
  init() {
    const s = App.stage;
    s.addEventListener('pointerdown', e => this.down(e));
    s.addEventListener('pointermove', e => this.move(e));
    s.addEventListener('pointerup', e => this.up(e));
    s.addEventListener('pointercancel', e => this.up(e, true));
    s.addEventListener('pointerleave', () => { App.cursorS = null; App.drawRulers(); if (!App.drag && App.hover) { App.hover = null; App.drawOv(); } });
    s.addEventListener('dblclick', e => this.dbl(e));
    s.addEventListener('wheel', e => this.wheel(e), { passive: false });
    s.addEventListener('contextmenu', e => { e.preventDefault(); this.context(e); });
    // regles → guies
    for (const [cv, axis] of [[App.rulerT, 'h'], [App.rulerL, 'v']]) {
      cv.addEventListener('pointerdown', e => this.rulerDown(e, axis));
    }
    $('#rulerCorner').addEventListener('click', () => Cmd.run('view.unitMenu'));
  },
  tool() { return Tools[App.tool] || Tools.select; },
  down(e) {
    if (!App.store.doc) return;
    UI.closeMenus();
    if (document.activeElement && document.activeElement !== App.stage && document.activeElement.id !== 'textEditor') document.activeElement.blur();
    if (App.mode && App.mode.type === 'text' && e.target.id !== 'textEditor') { App.exitMode(); }
    this.pts.set(e.pointerId, App.evS(e));
    if (this.pts.size === 2 && e.pointerType === 'touch') { this.startGesture(); return; }
    if (this.gesture) return;
    if (e.button === 1 || (e.button === 0 && (this.spaceDown || App.tool === 'hand'))) { this.startPan(e); return; }
    if (e.button !== 0) return;
    App.stage.focus({ preventScroll: true });
    try { App.stage.setPointerCapture(e.pointerId); } catch (_) { }
    const m = App.mode;
    let h = null;
    if (m && Tools[m.type] && Tools[m.type].down) h = Tools[m.type];
    else h = this.tool();
    this.active = h;
    h.down(e);
  },
  move(e) {
    if (!App.store.doc) return;
    const s = App.evS(e);
    App.cursorS = s;
    if (this.pts.has(e.pointerId)) this.pts.set(e.pointerId, s);
    if (this.gesture) { this.moveGesture(); return; }
    if (this.panning) { const p = this.panning; App.pan(e.clientX - p.x, e.clientY - p.y); p.x = e.clientX; p.y = e.clientY; return; }
    const pw = App.s2p(s);
    $('#stPos').textContent = `X ${fmtLen(pw.x, App.store.props.unit)} · Y ${fmtLen(pw.y, App.store.props.unit)}`;
    App.drawRulers();
    const h = this.active || (App.mode && Tools[App.mode.type]) || this.tool();
    if (h && h.move) h.move(e);
  },
  up(e, cancel) {
    this.pts.delete(e.pointerId);
    if (this.gesture) { if (this.pts.size < 2) this.gesture = null; return; }
    if (this.panning) { this.panning = null; this.cursor(); return; }
    const h = this.active;
    this.active = null;
    if (h && h.up) h.up(e, cancel);
    try { App.stage.releasePointerCapture(e.pointerId); } catch (_) { }
  },
  startPan(e) {
    e.preventDefault();
    this.panning = { x: e.clientX, y: e.clientY };
    App.stage.style.cursor = 'grabbing';
    try { App.stage.setPointerCapture(e.pointerId); } catch (_) { }
  },
  startGesture() {
    if (this.active && this.active.up) { App.store.cancel(); this.active = null; App.drag = null; Snap.clear(); }
    const [a, b] = Array.from(this.pts.values());
    this.gesture = { d: dist(a, b), c: pt((a.x + b.x) / 2, (a.y + b.y) / 2), z: App.z };
  },
  moveGesture() {
    const g = this.gesture;
    const [a, b] = Array.from(this.pts.values());
    if (!a || !b) return;
    const c = pt((a.x + b.x) / 2, (a.y + b.y) / 2);
    App.pan(c.x - g.c.x, c.y - g.c.y);
    App.zoomAt(g.z * dist(a, b) / g.d, c.x, c.y);
    g.c = c;
  },
  wheel(e) {
    e.preventDefault();
    if (!App.store.doc) return;
    const s = App.evS(e);
    let dy = e.deltaY, dx = e.deltaX;
    if (e.deltaMode === 1) { dy *= 16; dx *= 16; }
    if (e.ctrlKey || e.metaKey) {
      const f = Math.exp(-clamp(dy, -60, 60) * 0.0125);
      App.zoomAt(App.z * f, s.x, s.y);
    } else {
      if (e.shiftKey && !dx) { dx = dy; dy = 0; }
      App.pan(-dx, -dy);
    }
  },
  dbl(e) {
    if (!App.store.doc) return;
    const m = App.mode;
    if (m && Tools[m.type] && Tools[m.type].dbl) { Tools[m.type].dbl(e); return; }
    if (App.tool !== 'select') return;
    // dins d'un grup: entra-hi
    const id = App.hitAt(e);
    if (!id) { if (App.scope) { App.scope = null; App.drawOv(); } return; }
    const o = App.store.obj(id);
    if (o.type === 'group') {
      App.enterScope(id);
      const inner = App.hitAt(e);
      if (inner) App.select([inner]);
      return;
    }
    editObject(o);
  },
  context(e) {
    if (!App.store.doc) return;
    const id = App.hitAt(e);
    if (id && !App.isSel(id)) App.select([id]);
    else if (!id && !App.mode) App.clearSel();
    UI.menu(GL.contextMenu(), e.clientX, e.clientY);
  },
  cursor(c) {
    if (c) { App.stage.style.cursor = c; return; }
    if (this.spaceDown || App.tool === 'hand') { App.stage.style.cursor = this.panning ? 'grabbing' : 'grab'; return; }
    const t = App.mode ? Tools[App.mode.type] : this.tool();
    App.stage.style.cursor = (t && t.cursor) || 'default';
  },
  // arrossegar des de la regla crea una guia
  rulerDown(e, axis) {
    if (!App.store.doc || !App.opts.guides) return;
    e.preventDefault();
    const cv = e.currentTarget;
    cv.setPointerCapture(e.pointerId);
    const move = ev => {
      const s = App.evS(ev);
      App.guideDrag = { axis, s: axis === 'h' ? s.y : s.x };
      App.drawOv();
    };
    const up = ev => {
      cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up);
      const s = App.evS(ev);
      App.guideDrag = null;
      const { w, h } = App.stageSize();
      if (s.x >= 0 && s.y >= 0 && s.x <= w && s.y <= h) {
        const p = App.s2p(s);
        addGuide(App.pageId, axis, axis === 'h' ? p.y : p.x);
      }
      App.drawOv();
    };
    cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up);
  },
};
GL.pointer = Pointer;

function addGuide(pageId, axis, v) {
  const p = App.store.page(pageId);
  const g = clone(p.guides || { h: [], v: [] });
  g[axis] = (g[axis] || []).concat(rnd(v, 3));
  App.store.begin('Afegeix guia'); App.store.setPage(pageId, 'guides', g); App.store.commit();
}
function guideAt(s) {
  if (!App.opts.guides || App.opts.guidesLocked) return null;
  const p = App.page(); if (!p || !p.guides) return null;
  for (const axis of ['h', 'v']) {
    const arr = p.guides[axis] || [];
    for (let i = 0; i < arr.length; i++) {
      const sp = App.p2s(axis === 'h' ? pt(0, arr[i]) : pt(arr[i], 0));
      if (Math.abs((axis === 'h' ? sp.y : sp.x) - (axis === 'h' ? s.y : s.x)) <= 3) return { page: p.id, axis, i };
    }
  }
  return null;
}

// doble clic / Retorn sobre un objecte
function editObject(o) {
  if (!o || App.store.isLocked(o.id)) return;
  if (o.type === 'text') { App.select([o.id], { keepMode: true }); TextEdit.start(o.id); }
  else if (o.type === 'path') { App.select([o.id]); App.setMode({ type: 'nodes', id: o.id, nsel: new Set() }); }
  else if (o.type === 'image') { App.select([o.id]); App.setMode({ type: 'crop', id: o.id }); }
  else if (o.type === 'group') { App.enterScope(o.id); const k = App.store.children(o.id)[0]; if (k) App.select([k.id]); }
  else if (o.type !== 'line') UI.toast('Converteix-lo a trajecte (' + keyLabel('Ctrl+Shift+O') + ') per editar-ne els nodes');
}
GL.editObject = editObject;

/* ── Eina de selecció ──────────────────────────────────────────── */
Tools.select = {
  cursor: 'default',
  down(e) {
    const s = App.evS(e);
    // etiquetes de pàgina
    for (const r of App.labelRects) if (s.x >= r.x && s.x <= r.x + r.w && s.y >= r.y && s.y <= r.y + r.h) { App.setPage(r.id); return; }
    // nanses
    const hd = this.handleAt(s);
    if (hd) { this.startTransform(e, hd); return; }
    // guies
    const g = guideAt(s);
    if (g && !App.hitAt(e)) { this.startGuideDrag(e, g); return; }
    const deep = e.ctrlKey || e.metaKey;
    let id = App.hitAt(e, deep);
    // clic dins el marc de selecció manté la selecció (arrossegar)
    if (!id && App.sel.length && !e.shiftKey) {
      const b = App.selWorldBox();
      const w = App.s2w(s);
      if (b && rectHas(b, w) && App.sel.length > 1) id = App.sel[0];
    }
    if (id) {
      if (App.scope && !App.store.ancestors(id).some(a => a.id === App.scope)) App.scope = null;
      if (e.shiftKey) { App.toggleSel(id); if (!App.isSel(id)) return; }
      else if (!App.isSel(id)) App.select([id]);
      this.startMove(e);
      return;
    }
    // espai buit
    const wpg = App.pageAt(App.s2w(s));
    if (wpg && wpg !== App.pageId && App.view === 'all') App.setPage(wpg);
    if (App.scope) { App.scope = null; }
    if (!e.shiftKey) App.clearSel();
    this.startMarquee(e);
  },
  move(e) {
    if (App.drag) return App.drag.move(e);
    // hover i cursor
    const s = App.evS(e);
    const hd = this.handleAt(s);
    if (hd) {
      if (hd.k === 'rot') Pointer.cursor(ROT_CURSOR(hd.ang / DEG + 135));
      else if (hd.k === 'r') { const f = App.selFrame(); const ang = [225, 270, 315, 0, 45, 90, 135, 180][hd.i] + (f ? f.rot : 0); Pointer.cursor(resizeCursor(ang)); }
      else Pointer.cursor('crosshair');
      if (App.hover) { App.hover = null; App.drawOv(); }
      return;
    }
    const g = guideAt(s);
    const id = App.hitAt(e, e.ctrlKey || e.metaKey);
    if (g && !id) { Pointer.cursor(g.axis === 'h' ? 'row-resize' : 'col-resize'); App.guideHot = g; App.drawOv(); return; }
    if (App.guideHot) { App.guideHot = null; App.drawOv(); }
    Pointer.cursor();
    if (id !== App.hover) { App.hover = id; App.drawOv(); }
  },
  up(e, cancel) {
    if (App.drag) { const d = App.drag; App.drag = null; d.up(e, cancel); }
    Snap.clear(); App.hud = null; App.drawOv(); App.drawRulers();
  },
  handleAt(s) {
    const hs = App.handles();
    let best = null, bd = 9;
    for (const h of hs) {
      const r = h.k === 'rot' ? 10 : 7;
      const d = dist(h.s, s);
      if (d <= r && (h.k !== 'rot' || d < bd) && (!best || d < bd || best.k === 'rot')) { if (h.k === 'rot' && best && best.k !== 'rot') continue; best = h; bd = d; }
    }
    return best;
  },

  /* moure */
  startMove(e) {
    const st = App.store;
    const s0 = App.evS(e);
    let started = false, ids = [], snaps = null, box0 = null, page0 = App.pageId;
    const begin = (ev) => {
      started = true;
      st.begin('Mou');
      if (ev.altKey) { ids = duplicateSel(0, 0); App.select(ids); } else ids = App.sel.slice();
      ids = topOnly(ids);
      snaps = ids.map(id => clone(st.obj(id)));
      snaps.forEach(o => { if (o.type === 'group') st.descendants(o.id).forEach(d => snaps.push(clone(d))); });
      box0 = G.selBox(ids);
      page0 = st.obj(ids[0]).page;
      Snap.prepare(page0, ids);
    };
    App.drag = {
      move: (ev) => {
        const s = App.evS(ev);
        if (!started) { if (dist(s, s0) < 3) return; begin(ev); }
        let dx = (s.x - s0.x) / App.z, dy = (s.y - s0.y) / App.z;
        if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
        const r = Snap.box({ x: box0.x + dx, y: box0.y + dy, w: box0.w, h: box0.h }, { gaps: true, noX: ev.shiftKey && dx === 0, noY: ev.shiftKey && dy === 0 });
        if (!ev.metaKey && !ev.ctrlKey) { dx += r.dx; dy += r.dy; App.snapLines = r.lines; App.snapGaps = r.gaps; } else { App.snapLines = []; App.snapGaps = []; }
        const map = new Map(snaps.map(o => [o.id, o]));
        const out = {};
        for (const id of ids) G.translateObj(map.get(id), dx, dy, out, { children: pid => snaps.filter(o => o.parent === pid).sort(byZ) });
        for (const id in out) st.patch(id, out[id]);
        App.hud = null;
        App.drawOv(); App.drawRulers();
      },
      up: (ev, cancel) => {
        if (!started) {
          // clic sense moure: dins un grup seleccionat, selecciona l'element
          if (!ev.shiftKey && App.sel.length > 1) { const id = App.hitAt(ev); if (id) App.select([id]); }
          return;
        }
        if (cancel) { st.cancel(); return; }
        // canvi de pàgina (vista de totes)
        if (App.view === 'all') {
          const b = G.selBox(ids);
          const wc = App.p2w(pt(b.x + b.w / 2, b.y + b.h / 2), page0);
          const np = App.pageAt(wc);
          if (np && np !== page0) moveToPage(ids, np, true);
        }
        st.commit();
      },
    };
  },

  /* transformar (mida / rotació / extrems de línia) */
  startTransform(e, hd) {
    const st = App.store;
    const f = App.selFrame();
    const ids = topOnly(App.sel.slice());
    const snaps = new Map();
    for (const id of ids) { const o = st.obj(id); snaps.set(id, clone(o)); for (const d of st.descendants(id)) snaps.set(d.id, clone(d)); }
    const snapStore = { children: pid => Array.from(snaps.values()).filter(o => o.parent === pid).sort(byZ) };
    const pg = f.page;
    st.begin(hd.k === 'rot' ? 'Gira' : 'Canvia la mida');
    Snap.prepare(pg, ids);
    const p0 = App.s2p(App.evS(e), pg);

    if (hd.k === 'p1' || hd.k === 'p2') {
      const o0 = snaps.get(f.o.id);
      App.drag = {
        move: (ev) => {
          let p = App.s2p(App.evS(ev), pg);
          const other = hd.k === 'p1' ? o0.p2 : o0.p1;
          if (ev.shiftKey) {
            const a = Math.round(Math.atan2(p.y - other.y, p.x - other.x) / (Math.PI / 4)) * (Math.PI / 4);
            const L = dist(p, other); p = pt(other.x + Math.cos(a) * L, other.y + Math.sin(a) * L);
            App.snapLines = [];
          } else {
            const r = Snap.point(p); p = pt(p.x + r.dx, p.y + r.dy); App.snapLines = r.lines;
          }
          st.set(f.o.id, hd.k, pt(rnd(p.x, 3), rnd(p.y, 3)));
          const L = dist(p, other), ang = Math.atan2(p.y - other.y, p.x - other.x) / DEG;
          const s = App.evS(ev);
          App.hud = { text: `${fmtLen(L, st.props.unit)} ${st.props.unit} · ${fmtNum(normAng(ang), 1)}°`, x: s.x + 14 + 50, y: s.y + 26 };
          App.drawOv();
        },
        up: (ev, cancel) => { if (cancel) st.cancel(); else st.commit(); },
      };
      return;
    }

    if (hd.k === 'rot') {
      const C = pt(f.x + f.w / 2, f.y + f.h / 2);
      const a0 = Math.atan2(p0.y - C.y, p0.x - C.x);
      const single = !f.multi;
      const rot0 = single ? (f.o.rot || 0) : 0;
      App.drag = {
        move: (ev) => {
          const p = App.s2p(App.evS(ev), pg);
          let d = (Math.atan2(p.y - C.y, p.x - C.x) - a0) / DEG;
          let total = rot0 + d;
          if (ev.shiftKey) { total = Math.round(total / 15) * 15; d = total - rot0; }
          const out = {};
          for (const id of ids) G.rotateObj(snaps.get(id), C, d, out, snapStore);
          for (const id in out) st.patch(id, out[id]);
          const s = App.evS(ev);
          App.hud = { text: fmtNum(normAng(total), 1) + '°', x: s.x + 30, y: s.y + 24 };
          Pointer.cursor(ROT_CURSOR(Math.atan2(p.y - C.y, p.x - C.x) / DEG + 135));
          App.drawOv();
        },
        up: (ev, cancel) => { if (cancel) st.cancel(); else st.commit(); Pointer.cursor(); },
      };
      return;
    }

    // canvi de mida
    const i = hd.i;
    const L = [0, 6, 7].includes(i), Rr = [2, 3, 4].includes(i), T = [0, 1, 2].includes(i), B = [4, 5, 6].includes(i);
    const corner = i % 2 === 0;
    const b0 = { x: f.x, y: f.y, w: f.w, h: f.h, rot: f.rot };
    const FM = Mx.chain(Mx.tr(b0.x + b0.w / 2, b0.y + b0.h / 2), Mx.rot(b0.rot * DEG), Mx.tr(-b0.w / 2, -b0.h / 2));
    const IFM = Mx.inv(FM);
    const single = !f.multi ? f.o : null;
    const isText = single && single.type === 'text';
    const ratio = b0.w / (b0.h || 1);
    App.drag = {
      move: (ev) => {
        const p = App.s2p(App.evS(ev), pg);
        const u = Mx.ap(IFM, p);
        let x0 = 0, x1 = b0.w, y0 = 0, y1 = b0.h;
        const alt = ev.altKey;
        if (L) x0 = u.x; if (Rr) x1 = u.x; if (T) y0 = u.y; if (B) y1 = u.y;
        // ajust a guies (sense rotació)
        App.snapLines = [];
        if (!b0.rot && !ev.ctrlKey && !ev.metaKey) {
          const xs = [], ys = [];
          if (L) xs.push({ v: b0.x + x0 }); if (Rr) xs.push({ v: b0.x + x1 });
          if (T) ys.push({ v: b0.y + y0 }); if (B) ys.push({ v: b0.y + y1 });
          const r = Snap.box({ x: b0.x + Math.min(x0, x1), y: b0.y + Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) }, { xs: xs.length ? xs : [{ v: NaN }], ys: ys.length ? ys : [{ v: NaN }], noX: !xs.length, noY: !ys.length });
          if (L) x0 += r.dx; if (Rr) x1 += r.dx; if (T) y0 += r.dy; if (B) y1 += r.dy;
          App.snapLines = r.lines;
        }
        if (alt) { // simètric respecte del centre
          if (L) x1 = b0.w - x0; else if (Rr) x0 = b0.w - x1;
          if (T) y1 = b0.h - y0; else if (B) y0 = b0.h - y1;
        }
        const keep = (ev.shiftKey !== false && ev.shiftKey) || (isText && corner) || (single && single.lockRatio);
        if (keep && b0.w && b0.h) {
          let w = x1 - x0, h = y1 - y0;
          if (corner) {
            const s = Math.max(Math.abs(w) / b0.w, Math.abs(h) / b0.h);
            const nw = b0.w * s * Math.sign(w || 1), nh = b0.h * s * Math.sign(h || 1);
            if (alt) { x0 = (b0.w - nw) / 2; x1 = x0 + nw; y0 = (b0.h - nh) / 2; y1 = y0 + nh; }
            else { if (L) x0 = x1 - nw; else x1 = x0 + nw; if (T) y0 = y1 - nh; else y1 = y0 + nh; }
          } else if (L || Rr) { const nh = Math.abs(w) / ratio; y0 = (b0.h - nh) / 2; y1 = y0 + nh; }
          else { const nw = Math.abs(h) * ratio; x0 = (b0.w - nw) / 2; x1 = x0 + nw; }
        }
        let flipX = x1 < x0, flipY = y1 < y0;
        let nw = Math.max(Math.abs(x1 - x0), 0.01), nh = Math.max(Math.abs(y1 - y0), 0.01);
        const lc = pt(Math.min(x0, x1) + nw / 2, Math.min(y0, y1) + nh / 2);
        const C = Mx.ap(FM, lc);
        if (single) {
          const o0 = snaps.get(single.id);
          const patch = { x: C.x - nw / 2, y: C.y - nh / 2, w: nw, h: nh };
          if (flipX) patch.fx = -(o0.fx || 1); else patch.fx = o0.fx || 1;
          if (flipY) patch.fy = -(o0.fy || 1); else patch.fy = o0.fy || 1;
          if (isText) {
            delete patch.fx; delete patch.fy;
            if (corner) { const k = nw / b0.w; patch.fs = Math.max(1, rnd(o0.fs * k, 2)); }
            else patch.auto = 'h';
            const tmp = Object.assign({}, o0, patch);
            const fit = TextKit.fit(tmp);
            patch.h = fit.h; if (tmp.auto === 'w') patch.w = fit.w;
            // manté l'àncora vertical superior
            const c2 = Mx.ap(FM, pt(Math.min(x0, x1) + patch.w / 2, (T ? b0.h - patch.h : 0) + patch.h / 2));
            patch.x = c2.x - patch.w / 2; patch.y = c2.y - patch.h / 2;
          }
          st.patch(single.id, patch);
          const s = App.evS(ev);
          App.hud = { text: `${fmtLen(nw, st.props.unit)} × ${fmtLen(isText ? patch.h : nh, st.props.unit)}`, x: s.x + 50, y: s.y + 26 };
        } else {
          // mapa afí de la caixa antiga a la nova
          const sx = (flipX ? -1 : 1) * nw / (b0.w || 1), sy = (flipY ? -1 : 1) * nh / (b0.h || 1);
          const nx = C.x - nw / 2, ny = C.y - nh / 2;
          const ax = flipX ? nx + nw : nx, ay = flipY ? ny + nh : ny;
          const Tm = Mx.chain(Mx.tr(ax, ay), Mx.sc(sx, sy), Mx.tr(-b0.x, -b0.y));
          const out = {};
          const uni = corner && Math.abs(Math.abs(sx) - Math.abs(sy)) < 1e-6;
          for (const id of ids) G.transformObj(snaps.get(id), Tm, out, snapStore, uni);
          for (const id in out) {
            const o0 = snaps.get(id);
            if (o0 && o0.type === 'text') { const tmp = Object.assign({}, o0, out[id]); const fit = TextKit.fit(tmp); out[id].h = fit.h; if (tmp.auto === 'w') out[id].w = fit.w; }
            st.patch(id, out[id]);
          }
          const s = App.evS(ev);
          App.hud = { text: `${fmtLen(nw, st.props.unit)} × ${fmtLen(nh, st.props.unit)}`, x: s.x + 50, y: s.y + 26 };
        }
        App.drawOv();
      },
      up: (ev, cancel) => { if (cancel) st.cancel(); else st.commit(); },
    };
  },

  /* selecció per rectangle */
  startMarquee(e) {
    const a = App.evS(e);
    const base = e.shiftKey ? App.sel.slice() : [];
    App.drag = {
      move: (ev) => {
        const b = App.evS(ev);
        App.marquee = { a, b };
        const pg = App.pageId;
        const pa = App.s2p(a, pg), pb = App.s2p(b, pg);
        const r = { x: Math.min(pa.x, pb.x), y: Math.min(pa.y, pb.y), w: Math.abs(pb.x - pa.x), h: Math.abs(pb.y - pa.y) };
        const scope = App.scope || pg;
        const hit = App.store.children(scope).filter(o => o.visible !== false && !App.store.isLocked(o.id) && rectsHit(G.aabb(o), r)).map(o => o.id);
        App.select(base.concat(hit.filter(id => !base.includes(id))), { keepMode: true });
        App.drawOv();
      },
      up: () => { App.marquee = null; App.drawOv(); },
    };
  },

  startGuideDrag(e, g) {
    const st = App.store;
    const p = st.page(g.page);
    st.begin('Mou guia');
    App.drag = {
      move: (ev) => {
        const s = App.evS(ev);
        const pp = App.s2p(s, g.page);
        const gs = clone(st.page(g.page).guides);
        gs[g.axis][g.i] = rnd(g.axis === 'h' ? pp.y : pp.x, 3);
        st.setPage(g.page, 'guides', gs);
        App.guideHot = g;
        App.hud = { text: fmtLen(gs[g.axis][g.i], st.props.unit) + ' ' + st.props.unit, x: s.x + 40, y: s.y + 24 };
        App.drawOv();
      },
      up: (ev) => {
        const s = App.evS(ev);
        if (s.x < 0 || s.y < 0) { // deixada a la regla: elimina
          const gs = clone(st.page(g.page).guides);
          gs[g.axis].splice(g.i, 1);
          st.setPage(g.page, 'guides', gs);
        }
        App.guideHot = null;
        st.commit();
      },
    };
    void p;
  },
};
Tools.hand = { cursor: 'grab', down(e) { Pointer.startPan(e); }, move() { }, up() { } };

// només els elements de nivell superior (sense descendents d'altres seleccionats)
function topOnly(ids) {
  const set = new Set(ids);
  return ids.filter(id => !App.store.ancestors(id).some(a => set.has(a.id)));
}
GL.topOnly = topOnly;

/* ── Eines de creació de formes ─────────────────────────────────── */
function shapeTool(type) {
  return {
    cursor: 'crosshair',
    down(e) {
      const st = App.store;
      const s0 = App.evS(e);
      let pg = App.view === 'all' ? (App.pageAt(App.s2w(s0)) || App.pageId) : App.pageId;
      if (pg !== App.pageId) App.setPage(pg, { keepView: true });
      let p0 = App.s2p(s0, pg);
      Snap.prepare(pg, []);
      const sp = Snap.point(p0); p0 = pt(p0.x + sp.dx, p0.y + sp.dy);
      let id = null;
      const make = () => {
        st.begin('Crea ' + (TYPE_NAMES[type] || '').toLowerCase());
        id = st.add(Object.assign({ type, page: pg, x: p0.x, y: p0.y, w: 1, h: 1 }, newStyle(type)));
        App.select([id]);
      };
      App.drag = {
        move: (ev) => {
          const s = App.evS(ev);
          if (!id) { if (dist(s, s0) < 3) return; make(); }
          let p = App.s2p(s, pg);
          if (!ev.ctrlKey && !ev.metaKey) { const r = Snap.point(p); p = pt(p.x + r.dx, p.y + r.dy); App.snapLines = r.lines; }
          let dx = p.x - p0.x, dy = p.y - p0.y;
          if (ev.shiftKey) { const m = Math.max(Math.abs(dx), Math.abs(dy)); dx = m * Math.sign(dx || 1); dy = m * Math.sign(dy || 1); }
          let x = p0.x, y = p0.y, w = dx, h = dy;
          if (ev.altKey) { x = p0.x - Math.abs(dx); y = p0.y - Math.abs(dy); w = Math.abs(dx) * 2; h = Math.abs(dy) * 2; }
          else { if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; } }
          st.patch(id, { x: rnd(x, 3), y: rnd(y, 3), w: Math.max(rnd(w, 3), 0.5), h: Math.max(rnd(h, 3), 0.5) });
          App.hud = { text: `${fmtLen(w, st.props.unit)} × ${fmtLen(h, st.props.unit)}`, x: s.x + 50, y: s.y + 26 };
          App.drawOv();
        },
        up: () => {
          if (!id) {
            const d = 100;
            st.begin('Crea ' + (TYPE_NAMES[type] || '').toLowerCase());
            id = st.add(Object.assign({ type, page: pg, x: rnd(p0.x - d / 2, 3), y: rnd(p0.y - d / 2, 3), w: d, h: d }, newStyle(type)));
            App.select([id]);
          }
          st.commit();
          if (!App.toolLock) setTool('select');
        },
      };
    },
    up() { if (App.drag) { const d = App.drag; App.drag = null; d.up(); } Snap.clear(); App.hud = null; App.drawOv(); },
    move(e) { if (App.drag) App.drag.move(e); },
  };
}
for (const t of ['rect', 'ellipse', 'polygon', 'star']) Tools[t] = shapeTool(t);

// estil per defecte de cada tipus
const STYLE_MEMO = {};
function newStyle(type) {
  const base = { fill: { t: 'solid', c: '#d9d9d9ff' }, stroke: { t: 'solid', c: '#1a1a1aff' }, sw: 0, opacity: 1 };
  if (type === 'polygon') Object.assign(base, { n: 6 });
  if (type === 'star') Object.assign(base, { n: 5, ratio: 0.45 });
  if (type === 'rect') base.r = 0;
  if (type === 'line' || type === 'path') Object.assign(base, { fill: { t: 'none', c: '#d9d9d9ff' }, sw: 2, cap: 'round', join: 'round' });
  if (type === 'text') Object.assign(base, { fill: { t: 'solid', c: '#1a1a1aff' }, sw: 0 });
  return Object.assign(base, clone(STYLE_MEMO[type] || {}));
}
GL.newStyle = newStyle;

/* ── Línia i fletxa ─────────────────────────────────────────────── */
function lineTool(arrow) {
  return {
    cursor: 'crosshair',
    down(e) {
      const st = App.store;
      const s0 = App.evS(e);
      const pg = App.view === 'all' ? (App.pageAt(App.s2w(s0)) || App.pageId) : App.pageId;
      if (pg !== App.pageId) App.setPage(pg, { keepView: true });
      Snap.prepare(pg, []);
      let p0 = App.s2p(s0, pg);
      const r0 = Snap.point(p0); p0 = pt(p0.x + r0.dx, p0.y + r0.dy);
      let id = null;
      App.drag = {
        move: (ev) => {
          const s = App.evS(ev);
          if (!id) {
            if (dist(s, s0) < 3) return;
            st.begin(arrow ? 'Crea fletxa' : 'Crea línia');
            id = st.add(Object.assign({ type: 'line', page: pg, p1: p0, p2: p0, name: arrow ? st.autoName('line', pg).replace('Línia', 'Fletxa') : undefined }, newStyle('line'), arrow ? { ae: 'tri' } : {}));
            App.select([id]);
          }
          let p = App.s2p(s, pg);
          if (ev.shiftKey) {
            const a = Math.round(Math.atan2(p.y - p0.y, p.x - p0.x) / (Math.PI / 4)) * (Math.PI / 4);
            const L = dist(p, p0); p = pt(p0.x + Math.cos(a) * L, p0.y + Math.sin(a) * L); App.snapLines = [];
          } else { const r = Snap.point(p); p = pt(p.x + r.dx, p.y + r.dy); App.snapLines = r.lines; }
          st.set(id, 'p2', pt(rnd(p.x, 3), rnd(p.y, 3)));
          const L = dist(p, p0);
          App.hud = { text: `${fmtLen(L, st.props.unit)} ${st.props.unit} · ${fmtNum(normAng(Math.atan2(p.y - p0.y, p.x - p0.x) / DEG), 1)}°`, x: s.x + 60, y: s.y + 26 };
          App.drawOv();
        },
        up: () => { if (id) { st.commit(); if (!App.toolLock) setTool('select'); } },
      };
    },
    move(e) { if (App.drag) App.drag.move(e); },
    up() { if (App.drag) { const d = App.drag; App.drag = null; d.up(); } Snap.clear(); App.hud = null; App.drawOv(); },
  };
}
Tools.line = lineTool(false);
Tools.arrow = lineTool(true);

/* ── Text ───────────────────────────────────────────────────────── */
Tools.text = {
  cursor: 'text',
  down(e) {
    const st = App.store;
    const hit = App.hitAt(e, true);
    if (hit && st.obj(hit).type === 'text') { App.select([hit]); TextEdit.start(hit); setTool('select', true); return; }
    const s0 = App.evS(e);
    const pg = App.view === 'all' ? (App.pageAt(App.s2w(s0)) || App.pageId) : App.pageId;
    if (pg !== App.pageId) App.setPage(pg, { keepView: true });
    const p0 = App.s2p(s0, pg);
    App.drag = {
      move: (ev) => {
        const s = App.evS(ev);
        if (dist(s, s0) < 4) { App.marquee = null; return; }
        App.marquee = { a: s0, b: s };
        App.drawOv();
      },
      up: (ev) => {
        const s = App.evS(ev);
        const m = App.marquee; App.marquee = null;
        const base = Object.assign({ type: 'text', page: pg, text: '', ff: 'IBM Plex Sans', fs: 24, fw: 400, lh: 1.25, ls: 0, ta: 'left' }, newStyle('text'));
        if (GL.kidsTextBase && GL.kidsTextBase()) Object.assign(base, GL.kidsTextBase());
        if (STYLE_MEMO.text) Object.assign(base, clone(STYLE_MEMO.text));
        let o;
        if (m && dist(s, s0) >= 4) {
          const p1 = App.s2p(s, pg);
          o = Object.assign(base, { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.max(20, Math.abs(p1.x - p0.x)), auto: 'h' });
        } else {
          o = Object.assign(base, { x: p0.x, y: p0.y - base.fs * base.lh / 2, w: 10, auto: 'w' });
        }
        const fit = TextKit.fit(o); o.h = fit.h; if (o.auto === 'w') o.w = fit.w;
        st.begin('Crea text');
        o.name = 'Text';
        const id = st.add(o);
        st.commit();
        App.select([id]);
        setTool('select', true);
        TextEdit.start(id, { fresh: true });
      },
    };
  },
  move(e) { if (App.drag) App.drag.move(e); },
  up(e) { if (App.drag) { const d = App.drag; App.drag = null; d.up(e); } App.drawOv(); },
};

const TextEdit = GL.textEdit = {
  ta: null, id: null,
  init() {
    this.ta = $('#textEditor');
    this.ta.addEventListener('input', () => this.input());
    this.ta.addEventListener('keydown', e => {
      if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); App.exitMode(); App.stage.focus(); return; }
      e.stopPropagation();
    });
    this.ta.addEventListener('blur', () => { setTimeout(() => { if (App.mode && App.mode.type === 'text' && document.activeElement !== this.ta) App.exitMode(); }, 0); });
    this.ta.addEventListener('pointerdown', e => e.stopPropagation());
  },
  start(id, opt = {}) {
    const o = App.store.obj(id);
    if (!o || o.type !== 'text') return;
    if (App.mode) App.exitMode();
    App.mode = { type: 'text', id };
    this.id = id;
    App.store.begin('Edita text');
    App.renderer.setEditingText(id);
    const ta = this.ta;
    ta.value = o.text || '';
    ta.style.display = 'block';
    this.position();
    ta.focus();
    if (!opt.fresh) ta.select();
    App.emit('sel'); App.drawOv(); setHint();
  },
  input() {
    const o = App.store.obj(this.id); if (!o) return;
    const tmp = Object.assign({}, o, { text: this.ta.value });
    const fit = TextKit.fit(tmp);
    const patch = { text: this.ta.value, h: fit.h };
    if (o.auto === 'w') {
      patch.w = fit.w;
      // alineació: manté l'ancoratge segons l'alineació
      if (o.ta === 'center') patch.x = o.x + (o.w - fit.w) / 2;
      else if (o.ta === 'right') patch.x = o.x + o.w - fit.w;
    }
    App.store.patch(this.id, patch);
    this.position();
  },
  position() {
    if (!App.mode || App.mode.type !== 'text') return;
    const o = App.store.obj(this.id); if (!o) return;
    const ta = this.ta, z = App.z;
    const tl = App.p2s(G.corners(o)[0], o.page);
    const fam = FontKit.stack(o.ff || 'IBM Plex Sans');
    const col = o.fill && o.fill.t === 'solid' ? cssColor(o.fill.c) : (o.fill && o.fill.s ? cssColor(o.fill.s[0].c) : '#111');
    Object.assign(ta.style, {
      left: tl.x + 'px', top: tl.y + 'px',
      width: (o.auto === 'w' ? Math.max(o.w, 2) * z + 4 * z + 2 : o.w * z) + 'px',
      height: Math.max(o.h, o.fs * (o.lh || 1.25)) * z + 'px',
      font: `${o.fi ? 'italic ' : ''}${o.fw || 400} ${o.fs * z}px ${fam}`,
      lineHeight: (o.lh || 1.25) * o.fs * z + 'px',
      letterSpacing: (o.ls || 0) * o.fs * z + 'px',
      textAlign: o.ta || 'left',
      color: col,
      textTransform: o.tt === 'upper' ? 'uppercase' : o.tt === 'lower' ? 'lowercase' : 'none',
      textDecoration: o.deco && o.deco !== 'none' ? o.deco : 'none',
      transform: `rotate(${o.rot || 0}deg)`,
      opacity: o.opacity,
    });
    ta.classList.toggle('wrap', o.auto !== 'w');
    if (o.auto === 'w' && o.ta && o.ta !== 'left') ta.style.width = Math.max(o.w, 2) * z + 2 + 'px';
  },
  end() {
    const id = this.id;
    this.id = null;
    this.ta.style.display = 'none';
    App.renderer.setEditingText(null);
    const o = App.store.obj(id);
    if (o && !(o.text || '').trim()) App.store.del([id]);
    App.store.commit();
    this.ta.blur();
    if (o && App.store.obj(id)) App.select([id], { keepMode: true });
  },
};

/* ── Ploma ──────────────────────────────────────────────────────── */
Tools.pen = {
  cursor: PEN_CURSOR,
  st: null,
  down(e) {
    const s = App.evS(e);
    let S = this.st;
    if (!S) {
      const pg = App.view === 'all' ? (App.pageAt(App.s2w(s)) || App.pageId) : App.pageId;
      if (pg !== App.pageId) App.setPage(pg, { keepView: true });
      S = this.st = { page: pg, n: [], drag: null, ghost: null };
      Snap.prepare(pg, []);
      App.select([], { keepMode: true }); App.mode = { type: 'pen' }; setHint();
    }
    let p = App.s2p(s, S.page);
    if (S.n.length >= 2 && dist(App.p2s(S.n[0], S.page), s) < 8) { this.finish(false, true); return; }
    if (e.shiftKey && S.n.length) p = snap45(S.n[S.n.length - 1], p);
    else { const r = Snap.point(p); p = pt(p.x + r.dx, p.y + r.dy); }
    const node = { x: p.x, y: p.y, i: null, o: null, s: 0 };
    S.n.push(node);
    S.drag = { node, s0: s };
    App.drawOv();
  },
  move(e) {
    const S = this.st; if (!S) return;
    const s = App.evS(e);
    let p = App.s2p(s, S.page);
    if (S.drag) {
      if (dist(s, S.drag.s0) > 2) {
        const n = S.drag.node;
        n.o = pt(p.x, p.y); n.i = pt(2 * n.x - p.x, 2 * n.y - p.y); n.s = 2;
      }
    } else {
      if (e.shiftKey && S.n.length) p = snap45(S.n[S.n.length - 1], p);
      S.ghost = p;
      S.closeHot = S.n.length >= 2 && dist(App.p2s(S.n[0], S.page), s) < 8;
    }
    App.drawOv();
  },
  up() { if (this.st) this.st.drag = null; },
  key(e) {
    if (!this.st) return false;
    if (e.key === 'Enter' || e.key === 'Escape') { this.finish(false); return true; }
    if (e.key === 'Backspace' || e.key === 'Delete') { this.st.n.pop(); if (!this.st.n.length) this.finish(true); App.drawOv(); return true; }
    return false;
  },
  finish(cancel, close) {
    const S = this.st; this.st = null;
    if (App.mode && App.mode.type === 'pen') App.mode = null;
    Snap.clear();
    if (!S || cancel || S.n.length < 2) { App.drawOv(); setHint(); return; }
    const st = App.store;
    const patch = G.pathFromPage([{ c: !!close, n: S.n }]);
    st.begin('Crea trajecte');
    const id = st.add(Object.assign({ type: 'path', page: S.page, fr: 'nonzero' }, newStyle('path'), patch));
    st.commit();
    App.select([id]);
    if (!App.toolLock) setTool('select');
    setHint();
  },
  overlay() {
    const S = this.st; if (!S || !S.n.length) return '';
    const P = p => App.p2s(p, S.page);
    const sp = [{ c: false, n: S.n.map(n => ({ x: P(n).x, y: P(n).y, i: n.i ? P(n.i) : null, o: n.o ? P(n.o) : null })) }];
    let h = `<path class="ov-halo" d="${G.pathD(sp)}"/><path class="ov-pen" d="${G.pathD(sp)}"/>`;
    const last = S.n[S.n.length - 1];
    if (S.ghost && !S.drag) {
      const a = P(last), b = P(S.ghost);
      const c1 = last.o ? P(last.o) : a;
      h += `<path class="ov-pen-ghost" d="M${a.x} ${a.y}C${c1.x} ${c1.y} ${b.x} ${b.y} ${b.x} ${b.y}"/>`;
    }
    S.n.forEach((n, i) => {
      const q = P(n);
      if (n.o && i === S.n.length - 1) { const a = P(n.i), b = P(n.o); h += `<line class="ov-ctrl-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><circle class="ov-ctrl" cx="${a.x}" cy="${a.y}" r="3"/><circle class="ov-ctrl" cx="${b.x}" cy="${b.y}" r="3"/>`; }
      const hot = i === 0 && S.closeHot;
      h += `<rect class="ov-node${i === S.n.length - 1 || hot ? ' sel' : ''}" x="${q.x - (hot ? 5 : 3.5)}" y="${q.y - (hot ? 5 : 3.5)}" width="${hot ? 10 : 7}" height="${hot ? 10 : 7}"/>`;
    });
    return h;
  },
};
function snap45(a, p) {
  const ang = Math.round(Math.atan2(p.y - a.y, p.x - a.x) / (Math.PI / 4)) * (Math.PI / 4);
  const L = dist(a, p);
  return pt(a.x + Math.cos(ang) * L, a.y + Math.sin(ang) * L);
}

/* ── Edició de nodes ────────────────────────────────────────────── */
Tools.nodes = {
  cursor: 'default',
  sp() { const m = App.mode, o = App.store.obj(m.id); return o ? G.pageSP(o) : null; },
  hit(s) {
    const m = App.mode, o = App.store.obj(m.id); if (!o) return null;
    const sp = G.pageSP(o);
    const P = p => App.p2s(p, o.page);
    // nanses dels nodes seleccionats
    for (const key of m.nsel) {
      const [si, k] = key.split(':').map(Number);
      const n = sp[si] && sp[si].n[k]; if (!n) continue;
      for (const hk of ['i', 'o']) if (n[hk] && dist(P(n[hk]), s) < 6) return { t: 'h', si, k, hk };
    }
    for (let si = 0; si < sp.length; si++) for (let k = 0; k < sp[si].n.length; k++) if (dist(P(sp[si].n[k]), s) < 6) return { t: 'n', si, k };
    const near = G.nearestOnSP(G.mapSP(sp, P), s);
    if (near && near.d < 6) return { t: 's', si: near.si, k: near.k, t2: near.t };
    return null;
  },
  down(e) {
    const st = App.store, m = App.mode, o = st.obj(m.id);
    const s0 = App.evS(e);
    const h = this.hit(s0);
    if (!h) {
      const id = App.hitAt(e);
      App.exitMode();
      if (id && id !== m.id) App.select([id]); else if (!id) App.clearSel();
      return;
    }
    st.begin('Edita nodes');
    let sp = G.pageSP(o);
    if (h.t === 's') {
      const k = G.splitAt(sp, h.si, h.k, h.t2);
      st.patch(o.id, G.pathFromPage(sp, o.rot, o.fx, o.fy));
      m.nsel = new Set([h.si + ':' + k]);
      sp = G.pageSP(st.obj(o.id));
      h.t = 'n'; h.k = k;
    } else if (h.t === 'n') {
      const key = h.si + ':' + h.k;
      if (e.shiftKey) { if (m.nsel.has(key)) m.nsel.delete(key); else m.nsel.add(key); }
      else if (!m.nsel.has(key)) m.nsel = new Set([key]);
    }
    const start = clone(sp);
    const p0 = App.s2p(s0, o.page);
    App.drag = {
      move: (ev) => {
        const p = App.s2p(App.evS(ev), o.page);
        const dx = p.x - p0.x, dy = p.y - p0.y;
        const cur = clone(start);
        if (h.t === 'h') {
          const n = cur[h.si].n[h.k];
          const nh = pt(start[h.si].n[h.k][h.hk].x + dx, start[h.si].n[h.k][h.hk].y + dy);
          n[h.hk] = nh;
          const other = h.hk === 'i' ? 'o' : 'i';
          if (ev.altKey) n.s = 0;
          else if (n.s === 2 && n[other]) n[other] = pt(2 * n.x - nh.x, 2 * n.y - nh.y);
          else if (n.s === 1 && n[other]) {
            const L = dist(start[h.si].n[h.k][other], n), a = Math.atan2(n.y - nh.y, n.x - nh.x);
            n[other] = pt(n.x + Math.cos(a) * L, n.y + Math.sin(a) * L);
          }
        } else {
          for (const key of m.nsel) {
            const [si, k] = key.split(':').map(Number);
            const n = cur[si] && cur[si].n[k]; if (!n) continue;
            n.x += dx; n.y += dy;
            if (n.i) n.i = pt(n.i.x + dx, n.i.y + dy);
            if (n.o) n.o = pt(n.o.x + dx, n.o.y + dy);
          }
        }
        st.patch(o.id, G.pathFromPage(cur, o.rot, o.fx, o.fy));
        App.drawOv();
      },
      up: (ev, cancel) => { if (cancel) st.cancel(); else st.commit(); },
    };
    App.drawOv();
  },
  move(e) {
    if (App.drag) return App.drag.move(e);
    const h = this.hit(App.evS(e));
    Pointer.cursor(h ? (h.t === 's' ? PEN_CURSOR : 'move') : 'default');
  },
  up(e, c) { if (App.drag) { const d = App.drag; App.drag = null; d.up(e, c); } App.drawOv(); },
  dbl(e) {
    const st = App.store, m = App.mode, o = st.obj(m.id);
    const h = this.hit(App.evS(e));
    if (!h || h.t !== 'n') { if (!h) App.exitMode(); return; }
    const sp = G.pageSP(o);
    const s = sp[h.si], n = s.n[h.k];
    if (n.i || n.o) { n.i = null; n.o = null; n.s = 0; }
    else {
      const N = s.n.length;
      const prev = s.n[(h.k - 1 + N) % N], next = s.n[(h.k + 1) % N];
      const ex = (!s.c && h.k === 0) ? n : prev, nx = (!s.c && h.k === N - 1) ? n : next;
      const tx = (nx.x - ex.x) / 4, ty = (nx.y - ex.y) / 4;
      n.i = pt(n.x - tx, n.y - ty); n.o = pt(n.x + tx, n.y + ty); n.s = 2;
    }
    st.begin('Canvia el tipus de node'); st.patch(o.id, G.pathFromPage(sp, o.rot, o.fx, o.fy)); st.commit();
    App.drawOv();
  },
  key(e) {
    const m = App.mode;
    if (e.key === 'Escape' || e.key === 'Enter') { App.exitMode(); return true; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && m.nsel.size) {
      const st = App.store, o = st.obj(m.id);
      const sp = G.pageSP(o);
      const rm = Array.from(m.nsel).map(k => k.split(':').map(Number)).sort((a, b) => b[1] - a[1]);
      for (const [si, k] of rm) if (sp[si]) sp[si].n.splice(k, 1);
      const keep = sp.filter(s => s.n.length >= 2);
      st.begin('Elimina nodes');
      if (!keep.length) { st.del([o.id]); st.commit(); App.exitMode(); return true; }
      keep.forEach(s => { if (s.n.length < 3) s.c = false; });
      st.patch(o.id, G.pathFromPage(keep, o.rot, o.fx, o.fy));
      st.commit();
      m.nsel = new Set();
      App.drawOv();
      return true;
    }
    if (e.key.startsWith('Arrow') && m.nsel.size) {
      const st = App.store, o = st.obj(m.id);
      const d = (e.shiftKey ? 10 : 1) / (e.altKey ? 10 : 1);
      const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0, dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0;
      const sp = G.pageSP(o);
      for (const key of m.nsel) { const [si, k] = key.split(':').map(Number); const n = sp[si] && sp[si].n[k]; if (!n) continue; n.x += dx; n.y += dy; if (n.i) n.i = pt(n.i.x + dx, n.i.y + dy); if (n.o) n.o = pt(n.o.x + dx, n.o.y + dy); }
      st.begin('Mou nodes'); st.patch(o.id, G.pathFromPage(sp, o.rot, o.fx, o.fy)); st.commit();
      return true;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { const o = App.store.obj(m.id); m.nsel = new Set(); G.pageSP(o).forEach((s, si) => s.n.forEach((_, k) => m.nsel.add(si + ':' + k))); App.drawOv(); return true; }
    return false;
  },
  overlay() {
    const m = App.mode, o = App.store.obj(m.id); if (!o) return '';
    const P = p => App.p2s(p, o.page);
    const sp = G.pageSP(o);
    const ssp = G.mapSP(sp, P);
    let h = `<path class="ov-halo" d="${G.pathD(ssp)}"/><path class="ov-line" d="${G.pathD(ssp)}"/>`;
    ssp.forEach((s, si) => s.n.forEach((n, k) => {
      const key = si + ':' + k;
      if (!m.nsel.has(key)) return;
      for (const hk of ['i', 'o']) if (n[hk]) h += `<line class="ov-ctrl-line" x1="${n.x}" y1="${n.y}" x2="${n[hk].x}" y2="${n[hk].y}"/><circle class="ov-ctrl" cx="${n[hk].x}" cy="${n[hk].y}" r="3.5"/>`;
    }));
    ssp.forEach((s, si) => s.n.forEach((n, k) => {
      const sel = m.nsel.has(si + ':' + k);
      h += (n.i || n.o) ? `<circle class="ov-node${sel ? ' sel' : ''}" cx="${n.x}" cy="${n.y}" r="4"/>` : `<rect class="ov-node${sel ? ' sel' : ''}" x="${n.x - 3.5}" y="${n.y - 3.5}" width="7" height="7"/>`;
    }));
    return h;
  },
};

/* ── Retall d'imatge ────────────────────────────────────────────── */
Tools.crop = {
  cursor: 'move',
  info(o) {
    const a = App.store.doc.assets[o.asset];
    const cr = o.crop || { x: 0, y: 0, w: a.w, h: a.h };
    return { a, cr, sx: o.w / cr.w, sy: o.h / cr.h };
  },
  handles(o) {
    const m = G.frameM(o);
    const pos = [[0, 0], [.5, 0], [1, 0], [1, .5], [1, 1], [.5, 1], [0, 1], [0, .5]];
    return pos.map(([u, v], i) => ({ i, s: App.p2s(Mx.ap(m, pt(u * o.w, v * o.h)), o.page) }));
  },
  down(e) {
    const st = App.store, m = App.mode, o = st.obj(m.id);
    if (!o) { App.exitMode(); return; }
    const s0 = App.evS(e);
    const hd = this.handles(o).find(h => dist(h.s, s0) < 8);
    const IFM = Mx.inv(G.frameM(o));
    const pl = Mx.ap(IFM, App.s2p(s0, o.page));
    const { a, cr, sx, sy } = this.info(o);
    const inside = pl.x >= 0 && pl.y >= 0 && pl.x <= o.w && pl.y <= o.h;
    // dins la imatge fantasma també es pot arrossegar
    const gx = -cr.x * sx, gy = -cr.y * sy;
    const inGhost = pl.x >= gx && pl.y >= gy && pl.x <= gx + a.w * sx && pl.y <= gy + a.h * sy;
    if (!hd && !inside && !inGhost) { App.exitMode(); const id = App.hitAt(e); if (id) App.select([id]); return; }
    st.begin('Retalla');
    const o0 = clone(o), cr0 = clone(cr);
    const FM0 = G.frameM(o0), IFM0 = Mx.inv(FM0);
    App.drag = {
      move: (ev) => {
        const p = Mx.ap(IFM0, App.s2p(App.evS(ev), o0.page));
        const dx = p.x - pl.x, dy = p.y - pl.y;
        if (!hd) { // desplaça la imatge sota el marc
          const nx = clamp(cr0.x - dx / sx, 0, a.w - cr0.w), ny = clamp(cr0.y - dy / sy, 0, a.h - cr0.h);
          st.set(o0.id, 'crop', { x: rnd(nx, 3), y: rnd(ny, 3), w: cr0.w, h: cr0.h });
        } else {
          const i = hd.i;
          let x0 = 0, x1 = o0.w, y0 = 0, y1 = o0.h;
          // límits de la imatge en coordenades locals
          const minX = -cr0.x * sx, maxX = (a.w - cr0.x) * sx, minY = -cr0.y * sy, maxY = (a.h - cr0.y) * sy;
          if ([0, 6, 7].includes(i)) x0 = clamp(dx, minX, o0.w - 4);
          if ([2, 3, 4].includes(i)) x1 = clamp(o0.w + dx, 4, maxX);
          if ([0, 1, 2].includes(i)) y0 = clamp(dy, minY, o0.h - 4);
          if ([4, 5, 6].includes(i)) y1 = clamp(o0.h + dy, 4, maxY);
          const nw = x1 - x0, nh = y1 - y0;
          const C = Mx.ap(FM0, pt(x0 + nw / 2, y0 + nh / 2));
          st.patch(o0.id, { x: C.x - nw / 2, y: C.y - nh / 2, w: nw, h: nh, crop: { x: rnd(cr0.x + x0 / sx, 3), y: rnd(cr0.y + y0 / sy, 3), w: rnd(nw / sx, 3), h: rnd(nh / sy, 3) } });
        }
        App.drawOv();
      },
      up: (ev, c) => { if (c) st.cancel(); else st.commit(); },
    };
  },
  move(e) {
    if (App.drag) return App.drag.move(e);
    const o = App.store.obj(App.mode.id); if (!o) return;
    const s = App.evS(e);
    const hd = this.handles(o).find(h => dist(h.s, s) < 8);
    Pointer.cursor(hd ? resizeCursor([225, 270, 315, 0, 45, 90, 135, 180][hd.i] + (o.rot || 0)) : 'move');
  },
  up(e, c) { if (App.drag) { const d = App.drag; App.drag = null; d.up(e, c); } App.drawOv(); },
  dbl() { App.exitMode(); },
  key(e) { if (e.key === 'Escape' || e.key === 'Enter') { App.exitMode(); return true; } return false; },
  overlay() {
    const o = App.store.obj(App.mode.id); if (!o) return '';
    const { a, cr, sx, sy } = this.info(o);
    const M = Mx.chain(Mx.tr(App.px, App.py), Mx.sc(App.z), Mx.tr(App.off(o.page).x, App.off(o.page).y), G.frameM(o));
    const gx = -cr.x * sx, gy = -cr.y * sy, gw = a.w * sx, gh = a.h * sy;
    const f = (x, y) => { const p = Mx.ap(M, pt(x, y)); return rnd(p.x, 2) + ' ' + rnd(p.y, 2); };
    const ghost = `M${f(gx, gy)}L${f(gx + gw, gy)}L${f(gx + gw, gy + gh)}L${f(gx, gy + gh)}Z`;
    const frame = `M${f(0, 0)}L${f(o.w, 0)}L${f(o.w, o.h)}L${f(0, o.h)}Z`;
    let h = `<defs><clipPath id="cropHole"><path d="${ghost}${frame}" clip-rule="evenodd"/></clipPath></defs>`;
    h += `<g clip-path="url(#cropHole)" opacity=".4"><image href="data:${a.mime};base64,${a.data}" width="${a.w}" height="${a.h}" preserveAspectRatio="none" transform="${Mx.str(Mx.chain(M, Mx.tr(gx, gy), Mx.sc(sx, sy)))}"/></g>`;
    h += `<path class="ov-dash" d="${ghost}"/>`;
    h += `<path class="ov-halo" d="${frame}"/><path class="ov-line" d="${frame}"/>`;
    // regla dels terços
    for (const t of [1 / 3, 2 / 3]) h += `<path d="M${f(o.w * t, 0)}L${f(o.w * t, o.h)}M${f(0, o.h * t)}L${f(o.w, o.h * t)}" stroke="rgba(255,255,255,.5)" stroke-width=".75" fill="none"/>`;
    for (const hd of this.handles(o)) {
      const side = hd.i % 2 === 1;
      h += side ? `<rect class="ov-handle acc" x="${hd.s.x - 5}" y="${hd.s.y - 5}" width="10" height="10" rx="2"/>` : `<path class="ov-handle acc" d="M${hd.s.x - 6} ${hd.s.y - 6}h12v12h-12z"/>`;
    }
    return h;
  },
};

/* ── canvi d'eina ── */
function setTool(t, silent) {
  if (App.mode && App.mode.type === 'pen' && t !== 'pen') Tools.pen.finish(false);
  if (App.mode && (App.mode.type === 'nodes' || App.mode.type === 'crop') && t !== 'select') App.exitMode();
  App.tool = t;
  $$('#toolbar .tool').forEach(b => b.classList.toggle('on', b.dataset.tool === t || (b.dataset.group || '').split(',').includes(t) && b.dataset.tool === t));
  if (GL.toolbar) GL.toolbar.sync();
  Pointer.cursor();
  if (!silent) setHint(); else setHint();
  App.hover = null;
  App.drawOv();
}
GL.setTool = setTool;

/* ── duplicació i canvi de pàgina ── */
function cloneTree(ids, st) {
  st = st || App.store;
  const objs = [];
  const add = (o) => { objs.push(clone(o)); if (o.type === 'group') st.children(o.id).forEach(add); };
  topOnly(ids).map(id => st.obj(id)).filter(Boolean).sort(byZ).forEach(add);
  const assets = {};
  for (const o of objs) if (o.asset && st.doc.assets[o.asset]) assets[o.asset] = clone(st.doc.assets[o.asset]);
  return { objs, assets };
}
// insereix un conjunt clonat amb ids nous; retorna els ids de nivell superior
function insertTree(data, pageId, dx = 0, dy = 0, opt = {}) {
  const st = App.store;
  for (const k in data.assets) { const a = data.assets[k]; if (!st.doc.assets[k]) st.op('a', 'add', k, a); }
  const map = {};
  for (const o of data.objs) map[o.id] = uid();
  const tops = [];
  const parentOf = o => map[o.parent] ? map[o.parent] : (opt.parent || pageId);
  // ordre: pares abans que fills; z nous al capdamunt
  const byParent = {};
  for (const o of data.objs) (byParent[parentOf(o)] = byParent[parentOf(o)] || []).push(o);
  const zs = {};
  for (const pid in byParent) {
    const list = byParent[pid].sort(byZ);
    const top = map[list[0].parent] ? null : (opt.aboveZ !== undefined ? opt.aboveZ : st.topZ(pid));
    const next = opt.belowZ !== undefined && !map[list[0].parent] ? opt.belowZ : null;
    const keys = keysBetween(top, next, list.length);
    list.forEach((o, i) => zs[o.id] = keys[i]);
  }
  for (const o of data.objs) {
    const n = clone(o);
    n.id = map[o.id]; n.page = pageId; n.parent = parentOf(o); n.z = zs[o.id];
    if (!map[o.parent]) { tops.push(n.id); const out = {}; G.translateObj(n, dx, dy, out, { children: () => [] }); Object.assign(n, out[n.id] || {}); }
    else { const out = {}; G.translateObj(n, dx, dy, out, { children: () => [] }); Object.assign(n, out[n.id] || {}); }
    st.op('o', 'add', n.id, n);
  }
  return tops;
}
function duplicateSel(dx, dy) {
  const st = App.store;
  const ids = topOnly(App.sel);
  if (!ids.length) return [];
  const data = cloneTree(ids);
  const pg = st.obj(ids[0]).page;
  const parent = st.obj(ids[0]).parent;
  const sameParent = ids.every(id => st.obj(id).parent === parent);
  // just a sobre de l'element més alt
  const tops = insertTree(data, pg, dx, dy, sameParent ? { parent: parent !== pg ? parent : undefined } : {});
  return tops;
}
function moveToPage(ids, pageId, keepWorld) {
  const st = App.store;
  ids = topOnly(ids);
  if (!ids.length) return;
  const from = st.obj(ids[0]).page;
  const fo = App.off(from), to = App.off(pageId);
  const dx = keepWorld ? fo.x - to.x : 0, dy = keepWorld ? fo.y - to.y : 0;
  const data = cloneTree(ids);
  st.del(ids);
  const tops = insertTree(data, pageId, dx, dy);
  App.select(tops);
  return tops;
}
GL.cloneTree = cloneTree; GL.insertTree = insertTree; GL.duplicateSel = duplicateSel; GL.moveToPage = moveToPage;
