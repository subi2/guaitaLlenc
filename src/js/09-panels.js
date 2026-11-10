/* ── Capes, pàgines, barra d'eines i barra de menús ───────────── */
const Layers = {
  root: null, open: new Set(), drag: null,
  init() {
    this.root = $('#layers');
    this.render = rafThrottle(() => this.build());
    App.on('sel', () => this.syncSel());
    App.on('page', () => this.render());
    App.store.on(ch => { if (ch.structure || ch.all || ch.history) this.render(); });
    const act = $('#layersActions');
    const add = (ic, tip, cmd) => { const b = el('button', { class: 'icon-btn xs', html: icon(ic), 'data-tip': tip, 'data-cmd': cmd }); b.addEventListener('click', () => Cmd.run(cmd)); act.append(b); };
    add('group', 'Agrupa', 'obj.group');
    add('trash', 'Elimina', 'edit.delete');
    this.root.addEventListener('pointerleave', () => { if (App.hover) { App.hover = null; App.drawOv(); } });
  },
  build() {
    const st = App.store;
    if (!st.doc || !App.page()) return;
    const frag = document.createDocumentFragment();
    const sel = new Set(App.sel);
    // obre automàticament els grups que contenen la selecció
    for (const id of App.sel) for (const a of st.ancestors(id)) this.open.add(a.id);
    const rows = [];
    const walk = (pid, depth) => {
      const kids = st.children(pid).slice().reverse();
      for (const o of kids) {
        const row = this.row(o, depth, sel);
        frag.append(row); rows.push(row);
        if (o.type === 'group' && this.open.has(o.id)) walk(o.id, depth + 1);
      }
    };
    walk(App.pageId, 0);
    this.root.textContent = '';
    if (!rows.length) this.root.append(el('div', { class: 'ly-empty', text: 'Aquesta pàgina encara no té capes.' }));
    this.root.append(frag);
  },
  row(o, depth, sel) {
    const st = App.store;
    const r = el('div', { class: 'ly-row' + (sel.has(o.id) ? ' is-sel' : '') + (o.visible === false || st.isVisible(o.id) === false ? ' dim' : ''), 'data-id': o.id, role: 'treeitem', draggable: 'false' });
    r.style.paddingLeft = (6 + depth * 14) + 'px';
    const caret = el('span', { class: 'ly-caret' + (this.open.has(o.id) ? ' open' : ''), html: o.type === 'group' ? icon('chev') : '' });
    caret.addEventListener('pointerdown', e => { e.stopPropagation(); if (o.type !== 'group') return; if (this.open.has(o.id)) this.open.delete(o.id); else this.open.add(o.id); this.build(); });
    const name = el('span', { class: 'ly-name', text: o.name || TYPE_NAMES[o.type] });
    const lockB = el('button', { class: 'ly-btn' + (o.locked ? ' act' : ''), html: icon(o.locked ? 'lock' : 'unlock'), 'data-tip': o.locked ? 'Desbloqueja' : 'Bloqueja' });
    const eyeB = el('button', { class: 'ly-btn' + (o.visible === false ? ' act' : ''), html: icon(o.visible === false ? 'eyeOff' : 'eye'), 'data-tip': o.visible === false ? 'Mostra' : 'Amaga' });
    lockB.addEventListener('pointerdown', e => { e.stopPropagation(); st.begin(o.locked ? 'Desbloqueja' : 'Bloqueja'); st.set(o.id, 'locked', !o.locked); st.commit(); if (!o.locked) App.select(App.sel.filter(x => x !== o.id)); });
    eyeB.addEventListener('pointerdown', e => { e.stopPropagation(); st.begin(o.visible === false ? 'Mostra' : 'Amaga'); st.set(o.id, 'visible', o.visible === false); st.commit(); });
    r.append(caret, el('span', { class: 'ly-ico', html: icon(TYPE_ICON[o.type]) }), name, lockB, eyeB);
    r.addEventListener('pointerenter', () => { if (!this.drag) { App.hover = o.id; App.drawOv(); } });
    r.addEventListener('pointerdown', e => this.down(e, o, r));
    r.addEventListener('dblclick', e => { e.stopPropagation(); this.rename(o, name); });
    r.addEventListener('contextmenu', e => { e.preventDefault(); if (!App.isSel(o.id)) App.select([o.id]); UI.menu(GL.contextMenu(), e.clientX, e.clientY); });
    return r;
  },
  rename(o, nameEl) {
    const inp = el('input', { value: o.name || '', spellcheck: 'false' });
    nameEl.textContent = ''; nameEl.append(inp);
    inp.focus(); inp.select();
    const done = ok => { if (ok && inp.value.trim() && inp.value !== o.name) { App.store.begin('Reanomena'); App.store.set(o.id, 'name', inp.value.trim()); App.store.commit(); } this.build(); };
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
    inp.addEventListener('blur', () => done(true));
    inp.addEventListener('pointerdown', e => e.stopPropagation());
  },
  down(e, o, row) {
    if (e.button !== 0) return;
    const st = App.store;
    if (e.shiftKey && App.sel.length) {
      // rang entre l'últim i aquest (mateix pare)
      const last = st.obj(App.sel[App.sel.length - 1]);
      if (last && last.parent === o.parent) {
        const sib = st.children(o.parent);
        const a = sib.findIndex(x => x.id === last.id), b = sib.findIndex(x => x.id === o.id);
        App.select(App.sel.concat(sib.slice(Math.min(a, b), Math.max(a, b) + 1).map(x => x.id)));
      } else App.toggleSel(o.id);
    } else if (e.ctrlKey || e.metaKey) App.toggleSel(o.id);
    else if (!App.isSel(o.id)) App.select([o.id]);
    // arrossegar per reordenar
    const y0 = e.clientY;
    let started = false, target = null;
    const ids = topOnly(App.sel.slice());
    const move = ev => {
      if (!started) { if (Math.abs(ev.clientY - y0) < 4) return; started = true; this.drag = true; }
      $$('.ly-drop-before,.ly-drop-after,.ly-drop-in', this.root).forEach(x => x.classList.remove('ly-drop-before', 'ly-drop-after', 'ly-drop-in'));
      const over = document.elementFromPoint(ev.clientX, ev.clientY);
      const tr = over && over.closest('.ly-row');
      target = null;
      if (!tr || ids.includes(tr.dataset.id)) return;
      const to = st.obj(tr.dataset.id);
      if (!to || ids.some(id => st.ancestors(to.id).some(a => a.id === id))) return;
      const rr = tr.getBoundingClientRect();
      const f = (ev.clientY - rr.top) / rr.height;
      let pos = f < .5 ? 'before' : 'after';
      if (to.type === 'group' && f > .25 && f < .75) pos = 'in';
      tr.classList.add('ly-drop-' + pos);
      target = { id: to.id, pos };
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
      this.drag = false;
      $$('.ly-drop-before,.ly-drop-after,.ly-drop-in', this.root).forEach(x => x.classList.remove('ly-drop-before', 'ly-drop-after', 'ly-drop-in'));
      if (started && target) reorderTo(ids, target.id, target.pos);
      else if (!started && !e.shiftKey && !e.ctrlKey && !e.metaKey && App.sel.length > 1) App.select([o.id]);
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  },
  syncSel() {
    const sel = new Set(App.sel);
    let needBuild = false;
    for (const id of App.sel) for (const a of App.store.ancestors(id)) if (!this.open.has(a.id)) { this.open.add(a.id); needBuild = true; }
    if (needBuild) { this.build(); }
    $$('.ly-row', this.root).forEach(r => r.classList.toggle('is-sel', sel.has(r.dataset.id)));
    const first = this.root.querySelector('.ly-row.is-sel');
    if (first) first.scrollIntoView({ block: 'nearest' });
  },
};
GL.layers = Layers;

// mou objectes a una posició de l'arbre (la llista es mostra de davant cap enrere)
function reorderTo(ids, targetId, pos) {
  const st = App.store;
  const t = st.obj(targetId);
  if (!t) return;
  let parent, below, above;
  if (pos === 'in') { parent = t.id; const kids = st.children(t.id); below = kids.length ? kids[kids.length - 1].z : null; above = null; }
  else {
    parent = t.parent;
    const sib = st.children(parent).filter(x => !ids.includes(x.id));
    const i = sib.findIndex(x => x.id === t.id);
    // "before" a la llista = per sobre en z
    if (pos === 'before') { below = t.z; above = sib[i + 1] ? sib[i + 1].z : null; }
    else { above = t.z; below = sib[i - 1] ? sib[i - 1].z : null; }
  }
  const sorted = ids.map(id => st.obj(id)).sort(byZ);
  const keys = keysBetween(below, above, sorted.length);
  st.begin('Reordena');
  sorted.forEach((o, i) => {
    if (o.parent !== parent) {
      st.set(o.id, 'parent', parent);
      const pg = st.obj(parent) ? st.obj(parent).page : parent;
      if (o.page !== pg) { st.set(o.id, 'page', pg); for (const d of st.descendants(o.id)) st.set(d.id, 'page', pg); }
    }
    st.set(o.id, 'z', keys[i]);
  });
  cleanupGroups();
  st.commit();
}
GL.reorderTo = reorderTo;
// elimina grups buits o amb un sol fill
function cleanupGroups() {
  const st = App.store;
  for (const id in st.doc.objs) {
    const o = st.doc.objs[id];
    if (!o || o.type !== 'group') continue;
    const kids = st.children(id);
    if (!kids.length) st.op('o', 'del', id);
  }
}
GL.cleanupGroups = cleanupGroups;

/* ── Tira de pàgines ── */
const PagesStrip = {
  init() {
    this.root = $('#pagesStrip');
    this.list = $('#pagesList');
    this.render = rafThrottle(() => this.build());
    App.on('page', () => this.render());
    App.store.on(ch => { if (ch.pages && ch.pages.size || ch.all || ch.structure) this.render(); });
    $('#stPage').addEventListener('click', () => { App.opts.pagesPanel = !App.opts.pagesPanel; this.build(); App.applyView(); });
  },
  build() {
    const st = App.store;
    if (!st.doc) return;
    const pages = st.pagesSorted();
    const idx = pages.findIndex(p => p.id === App.pageId);
    $('#stPage').textContent = `Pàgina ${idx + 1} / ${pages.length}`;
    $('#stPrev').disabled = idx <= 0; $('#stNext').disabled = idx >= pages.length - 1;
    const show = App.opts.pagesPanel;
    if (this.root.hidden === show) { this.root.hidden = !show; requestAnimationFrame(() => App.applyView()); }
    if (!show) return;
    this.list.textContent = '';
    pages.forEach((p, i) => {
      const H = 64, W = Math.max(28, Math.min(120, H * p.w / p.h));
      const th = el('div', { class: 'pg-thumb', style: { width: W + 'px', height: H + 'px' } });
      th.innerHTML = `<svg viewBox="0 0 ${p.w} ${p.h}" preserveAspectRatio="none"><rect width="${p.w}" height="${p.h}" fill="${hex6(p.bg)}" fill-opacity="${alphaOf(p.bg)}"/><use href="#pc-${p.id}"/></svg><span class="pg-num">${i + 1}</span>`;
      const tile = el('div', { class: 'pg-tile' + (p.id === App.pageId ? ' on' : ''), 'data-page': p.id }, th, el('span', { class: 'pg-name', text: p.name }));
      tile.addEventListener('pointerdown', e => this.down(e, p, tile));
      tile.addEventListener('dblclick', async () => { const n = await UI.prompt('Reanomena la pàgina', 'Nom', p.name); if (n && n.trim()) { st.begin('Reanomena la pàgina'); st.setPage(p.id, 'name', n.trim()); st.commit(); } });
      tile.addEventListener('contextmenu', e => { e.preventDefault(); App.setPage(p.id, { reveal: true }); UI.menu(GL.pageMenu(), e.clientX, e.clientY); });
      this.list.append(tile);
    });
    const add = el('button', { class: 'pg-add', html: icon('plus'), 'data-tip': 'Pàgina nova', 'data-cmd': 'page.add' });
    add.addEventListener('click', () => Cmd.run('page.add'));
    this.list.append(add);
    const on = this.list.querySelector('.pg-tile.on'); if (on) on.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  },
  down(e, p, tile) {
    if (e.button !== 0) return;
    App.setPage(p.id, { reveal: true });
    const x0 = e.clientX;
    let started = false, target = null;
    const move = ev => {
      if (!started) { if (Math.abs(ev.clientX - x0) < 5) return; started = true; }
      $$('.pg-tile', this.list).forEach(t => t.classList.remove('drop-l', 'drop-r'));
      const over = document.elementFromPoint(ev.clientX, ev.clientY);
      const t = over && over.closest('.pg-tile');
      target = null;
      if (!t || t === tile) return;
      const r = t.getBoundingClientRect();
      const side = ev.clientX < r.left + r.width / 2 ? 'l' : 'r';
      t.classList.add('drop-' + side);
      target = { id: t.dataset.page, side };
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
      $$('.pg-tile', this.list).forEach(t => t.classList.remove('drop-l', 'drop-r'));
      if (started && target) movePage(p.id, target.id, target.side === 'l' ? 'before' : 'after');
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  },
};
GL.pagesStrip = PagesStrip;
function movePage(id, targetId, pos) {
  const st = App.store;
  const pages = st.pagesSorted().filter(p => p.id !== id);
  const i = pages.findIndex(p => p.id === targetId);
  const a = pos === 'before' ? (pages[i - 1] ? pages[i - 1].z : null) : pages[i].z;
  const b = pos === 'before' ? pages[i].z : (pages[i + 1] ? pages[i + 1].z : null);
  st.begin('Reordena les pàgines'); st.setPage(id, 'z', keyBetween(a, b)); st.commit();
  App.layoutPages();
}
GL.movePage = movePage;

/* ── Barra d'eines ── */
const TOOLS = [
  { tool: 'select', icon: 'select', tip: 'Selecció', key: 'V' },
  { tool: 'hand', icon: 'hand', tip: 'Mà', key: 'H' },
  '-',
  { group: [{ tool: 'rect', icon: 'rect', tip: 'Rectangle', key: 'R' }, { tool: 'ellipse', icon: 'ellipse', tip: 'El·lipse', key: 'O' }, { tool: 'polygon', icon: 'polygon', tip: 'Polígon', key: 'Y' }, { tool: 'star', icon: 'star', tip: 'Estrella', key: 'Shift+Y' }] },
  { group: [{ tool: 'line', icon: 'line', tip: 'Línia', key: 'L' }, { tool: 'arrow', icon: 'arrow', tip: 'Fletxa', key: 'Shift+L' }] },
  { tool: 'pen', icon: 'pen', tip: 'Ploma', key: 'P' },
  { tool: 'text', icon: 'text', tip: 'Text', key: 'T' },
  { cmd: 'insert.image', icon: 'image', tip: 'Imatge', key: 'Shift+Ctrl+K' },
];
const Toolbar = GL.toolbar = {
  groups: [],
  init() {
    const tb = $('#toolbar');
    for (const t of TOOLS) {
      if (t === '-') { tb.append(el('div', { class: 'tool-sep' })); continue; }
      if (t.group) {
        const g = { items: t.group, cur: t.group[0] };
        const b = el('button', { class: 'tool flyout', type: 'button' });
        const paint = () => { b.innerHTML = icon(g.cur.icon); b.dataset.tool = g.cur.tool; b.dataset.tip = g.cur.tip; b.dataset.key = g.cur.key; b.dataset.group = g.items.map(x => x.tool).join(','); };
        paint();
        g.btn = b; g.paint = paint;
        let timer = 0, longed = false;
        const openFly = () => {
          const r = b.getBoundingClientRect();
          longed = true;
          UI.menu(g.items.map(it => ({ label: it.tip, key: it.key, icon: it.icon, checked: () => App.tool === it.tool, run: () => { g.cur = it; paint(); setTool(it.tool); } })), r.right + 6, r.top);
        };
        b.addEventListener('pointerdown', e => { longed = false; timer = setTimeout(openFly, 380); if (e.offsetX > 24 && e.offsetY > 24) { clearTimeout(timer); openFly(); } });
        b.addEventListener('pointerup', () => clearTimeout(timer));
        b.addEventListener('pointerleave', () => clearTimeout(timer));
        b.addEventListener('click', () => { if (!longed) setTool(g.cur.tool); });
        b.addEventListener('contextmenu', e => { e.preventDefault(); openFly(); });
        tb.append(b); this.groups.push(g);
        continue;
      }
      const b = el('button', { class: 'tool', type: 'button', html: icon(t.icon), 'data-tip': t.tip, 'data-key': t.key });
      if (t.tool) { b.dataset.tool = t.tool; b.addEventListener('click', () => setTool(t.tool)); b.addEventListener('dblclick', () => { App.toolLock = !App.toolLock; UI.toast(App.toolLock ? 'Eina fixada: es manté després de dibuixar' : 'Eina alliberada'); }); }
      if (t.cmd) { b.dataset.cmd = t.cmd; b.addEventListener('click', () => Cmd.run(t.cmd)); }
      tb.append(b);
    }
    tb.append(el('div', { class: 'tool-grow' }));
    const lb = el('button', { class: 'tool', type: 'button', html: icon('layers'), 'data-tip': 'Biblioteca', 'data-cmd': 'lib.toggle' });
    lb.dataset.c = 'lib'; lb.addEventListener('click', () => Cmd.run('lib.toggle'));
    tb.insertBefore(el('div', { class: 'tool-sep' }), tb.lastChild); tb.insertBefore(lb, tb.lastChild);
    const extra = [['undo', 'Desfés', 'edit.undo'], ['redo', 'Refés', 'edit.redo'], ['search', 'Paleta d\'ordres', 'help.palette']];
    for (const [ic, tip, cmd] of extra) { const b = el('button', { class: 'tool', type: 'button', html: icon(ic), 'data-tip': tip, 'data-cmd': cmd }); b.addEventListener('click', () => Cmd.run(cmd)); b.dataset.c = cmd; tb.append(b); }
    App.store.on(() => this.syncHistory());
  },
  sync() {
    for (const g of this.groups) { const it = g.items.find(x => x.tool === App.tool); if (it) { g.cur = it; g.paint(); } }
    $$('#toolbar .tool').forEach(b => b.classList.toggle('on', !!b.dataset.tool && b.dataset.tool === App.tool));
  },
  syncHistory: rafThrottle(() => {
    $$('#toolbar .tool[data-c]').forEach(b => { if (b.dataset.c === 'edit.undo') b.disabled = !App.store.canUndo; if (b.dataset.c === 'edit.redo') b.disabled = !App.store.canRedo; b.style.opacity = b.disabled ? .35 : ''; });
  }),
};

/* ── Barra de menús ── */
const Menubar = GL.menubar = {
  items: [], cur: -1,
  init(defs) {
    const nav = $('#menubar');
    this.defs = defs;
    defs.forEach((d, i) => {
      const b = el('button', { class: 'mb-item', type: 'button', text: d.label, role: 'menuitem', 'aria-haspopup': 'true' });
      b.addEventListener('pointerdown', e => { e.preventDefault(); if (this.cur === i && UI.open) { UI.closeMenus(); this.cur = -1; } else this.openAt(i); });
      b.addEventListener('pointerenter', () => { if (UI.open && this.cur >= 0 && this.cur !== i && $('.mb-item.open')) this.openAt(i); });
      nav.append(b); this.items.push(b);
    });
    // camins de menú per a la paleta
    GL.menuPaths = {};
    const walk = (items, path) => { for (const it of (typeof items === 'function' ? [] : items)) { if (!it || it === '-') continue; if (it.cmd && !GL.menuPaths[it.cmd]) GL.menuPaths[it.cmd] = path; if (it.sub && Array.isArray(it.sub)) walk(it.sub, path + ' › ' + it.label); } };
    defs.forEach(d => walk(d.items, d.label));
  },
  openAt(i) {
    const b = this.items[i];
    const r = b.getBoundingClientRect();
    UI.closeMenus();
    this.cur = i;
    UI.menu(this.defs[i].items, r.left, r.bottom + 4, { onClose: () => { b.classList.remove('open'); } });
    b.classList.add('open');
  },
  step(d) { if (this.cur < 0) return; this.openAt((this.cur + d + this.items.length) % this.items.length); const m = UI.open; if (m && m._rows && m._rows[0]) m._rows[0].classList.add('hot'); },
};
