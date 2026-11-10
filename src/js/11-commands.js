/* ── Ordres, menús i teclat ──────────────────────────────────── */
const hasSel = () => App.sel.length > 0;
const sel1 = t => () => App.sel.length === 1 && (!t || [].concat(t).includes(App.store.obj(App.sel[0]).type));
const docOpen = () => !!App.store.doc;
const tx = (label, fn) => { App.store.begin(label); try { fn(); } finally { App.store.commit(); } };

function alignSel(kind) {
  const st = App.store;
  const ids = topOnly(App.sel);
  if (!ids.length) return;
  let ref;
  if (ids.length === 1) { const p = App.page(); ref = App.scope && st.obj(App.scope) ? G.aabb(st.obj(App.scope)) : { x: 0, y: 0, w: p.w, h: p.h }; }
  else ref = G.selBox(ids);
  tx('Alinea', () => {
    for (const id of ids) {
      const o = st.obj(id), b = G.aabb(o);
      let dx = 0, dy = 0;
      if (kind === 'left') dx = ref.x - b.x;
      if (kind === 'right') dx = ref.x + ref.w - (b.x + b.w);
      if (kind === 'hcenter') dx = ref.x + ref.w / 2 - (b.x + b.w / 2);
      if (kind === 'top') dy = ref.y - b.y;
      if (kind === 'bottom') dy = ref.y + ref.h - (b.y + b.h);
      if (kind === 'vcenter') dy = ref.y + ref.h / 2 - (b.y + b.h / 2);
      const out = {}; G.translateObj(o, dx, dy, out); for (const k in out) st.patch(k, out[k]);
    }
  });
}
function distribute(axis) {
  const st = App.store;
  const ids = topOnly(App.sel);
  if (ids.length < 3) return;
  const items = ids.map(id => ({ id, b: G.aabb(st.obj(id)) })).sort((a, b) => axis === 'h' ? a.b.x - b.b.x : a.b.y - b.b.y);
  const first = items[0].b, last = items[items.length - 1].b;
  const total = items.reduce((s, it) => s + (axis === 'h' ? it.b.w : it.b.h), 0);
  const span = axis === 'h' ? last.x + last.w - first.x : last.y + last.h - first.y;
  const gap = (span - total) / (items.length - 1);
  let pos = axis === 'h' ? first.x : first.y;
  tx('Distribueix', () => {
    for (const it of items) {
      const cur = axis === 'h' ? it.b.x : it.b.y;
      const out = {}; G.translateObj(st.obj(it.id), axis === 'h' ? pos - cur : 0, axis === 'v' ? pos - cur : 0, out);
      for (const k in out) st.patch(k, out[k]);
      pos += (axis === 'h' ? it.b.w : it.b.h) + gap;
    }
  });
}
function zorder(kind) {
  const st = App.store;
  const ids = topOnly(App.sel);
  if (!ids.length) return;
  tx('Ordena', () => {
    const byParent = {};
    for (const id of ids) { const o = st.obj(id); (byParent[o.parent] = byParent[o.parent] || []).push(o); }
    for (const pid in byParent) {
      const moving = byParent[pid].sort(byZ);
      const mset = new Set(moving.map(o => o.id));
      const sib = st.children(pid);
      const rest = sib.filter(o => !mset.has(o.id));
      let lo, hi;
      if (kind === 'front') { lo = rest.length ? rest[rest.length - 1].z : null; hi = null; }
      else if (kind === 'back') { lo = null; hi = rest.length ? rest[0].z : null; }
      else if (kind === 'forward') {
        const topIdx = Math.max(...moving.map(o => sib.indexOf(o)));
        const nxt = sib.slice(topIdx + 1).find(o => !mset.has(o.id));
        if (!nxt) continue;
        const ri = rest.indexOf(nxt);
        lo = nxt.z; hi = rest[ri + 1] ? rest[ri + 1].z : null;
      } else {
        const botIdx = Math.min(...moving.map(o => sib.indexOf(o)));
        const prv = sib.slice(0, botIdx).reverse().find(o => !mset.has(o.id));
        if (!prv) continue;
        const ri = rest.indexOf(prv);
        hi = prv.z; lo = rest[ri - 1] ? rest[ri - 1].z : null;
      }
      const keys = keysBetween(lo, hi, moving.length);
      moving.forEach((o, i) => st.set(o.id, 'z', keys[i]));
    }
  });
}
function groupSel() {
  const st = App.store;
  const ids = topOnly(App.sel);
  if (ids.length < 1) return;
  const objs = ids.map(id => st.obj(id)).sort(byZ);
  const parent = objs[objs.length - 1].parent;
  const page = objs[0].page;
  tx('Agrupa', () => {
    const topZ = objs[objs.length - 1].z;
    const sib = st.children(parent).filter(o => !ids.includes(o.id));
    const above = sib.find(o => o.z > topZ);
    const gid = st.add({ type: 'group', page, parent, z: keyBetween(topZ, above ? above.z : null), name: st.autoName('group', page) });
    const keys = keysBetween(null, null, objs.length);
    objs.forEach((o, i) => { st.set(o.id, 'parent', gid); st.set(o.id, 'z', keys[i]); });
    cleanupGroups();
    App.select([gid]);
  });
}
function ungroupSel() {
  const st = App.store;
  const groups = App.objs().filter(o => o.type === 'group');
  if (!groups.length) return;
  const out = [];
  tx('Desagrupa', () => {
    for (const g of groups) {
      const kids = st.children(g.id);
      const sib = st.children(g.parent);
      const i = sib.findIndex(o => o.id === g.id);
      const lo = sib[i - 1] ? sib[i - 1].z : null, hi = sib[i + 1] ? sib[i + 1].z : null;
      const keys = keysBetween(lo, hi, kids.length);
      kids.forEach((k, j) => {
        st.set(k.id, 'parent', g.parent); st.set(k.id, 'z', keys[j]);
        // l'opacitat del grup es multiplica als fills
        if (g.opacity < 1) st.set(k.id, 'opacity', rnd((k.opacity == null ? 1 : k.opacity) * g.opacity, 3));
        out.push(k.id);
      });
      st.op('o', 'del', g.id);
    }
  });
  App.select(out);
}
function flipSel(axis) {
  const st = App.store;
  const ids = topOnly(App.sel);
  if (!ids.length) return;
  const b = G.selBox(ids);
  const c = pt(b.x + b.w / 2, b.y + b.h / 2);
  const T = Mx.chain(Mx.tr(c.x, c.y), Mx.sc(axis === 'h' ? -1 : 1, axis === 'v' ? -1 : 1), Mx.tr(-c.x, -c.y));
  tx('Reflecteix', () => {
    const out = {};
    for (const id of ids) G.transformObj(st.obj(id), T, out);
    for (const id in out) st.patch(id, out[id]);
  });
}
function rotateSel(a) {
  const st = App.store;
  const ids = topOnly(App.sel);
  if (!ids.length) return;
  const b = G.selBox(ids), c = pt(b.x + b.w / 2, b.y + b.h / 2);
  tx('Gira', () => { const out = {}; for (const id of ids) G.rotateObj(st.obj(id), c, a, out); for (const id in out) st.patch(id, out[id]); });
}
function nudge(dx, dy) {
  const st = App.store;
  const ids = topOnly(App.sel).filter(id => !st.isLocked(id));
  if (!ids.length) return;
  st.begin('Desplaça');
  const out = {}; for (const id of ids) G.translateObj(st.obj(id), dx, dy, out);
  for (const id in out) st.patch(id, out[id]);
  st.commit();
  // agrupa pulsacions consecutives en un sol pas d'historial
  const top = st.undoStack[st.undoStack.length - 1], prev = st.undoStack[st.undoStack.length - 2];
  if (top && prev && prev.label === 'Desplaça' && Date.now() - (prev._t || 0) < 800 && eq(prev._ids, ids)) {
    prev.fwd = prev.fwd.concat(top.fwd); prev.inv = prev.inv.concat(top.inv); st.undoStack.pop();
    compactTx(prev); prev._t = Date.now();
  } else if (top) { top._t = Date.now(); top._ids = ids; }
}
function convertToPath() {
  const st = App.store;
  const objs = App.objs().filter(o => ['rect', 'ellipse', 'polygon', 'star', 'line'].includes(o.type));
  if (!objs.length) return;
  tx('Converteix a trajecte', () => {
    for (const o of objs) {
      const p = G.toPath(o);
      if (!p) continue;
      if (o.type === 'line') { const { p1, p2, ...rest } = o; st.del([o.id]); const n = Object.assign({}, rest, p, { id: o.id }); delete n.p1; delete n.p2; st.op('o', 'add', o.id, n); }
      else { for (const k of ['r', 'n', 'ratio']) if (k in o) st.set(o.id, k, undefined); st.patch(o.id, p); }
    }
  });
  if (objs.length === 1) { App.select([objs[0].id]); }
  UI.toast('Convertit a trajecte · doble clic per editar-ne els nodes');
}
let STYLE_CLIP = null;
const STYLE_KEYS = ['fill', 'stroke', 'sw', 'dash', 'cap', 'join', 'opacity', 'blend', 'shadow', 'blur', 'ff', 'fs', 'fw', 'fi', 'lh', 'ls', 'ta', 'deco', 'tt', 'as', 'ae', 'r'];
function copyStyle() {
  const o = App.objs()[0]; if (!o) return;
  STYLE_CLIP = {}; for (const k of STYLE_KEYS) if (o[k] !== undefined) STYLE_CLIP[k] = clone(o[k]);
  STYLE_CLIP._type = o.type;
  UI.toast('Estil copiat');
}
function pasteStyle() {
  if (!STYLE_CLIP) return;
  tx('Enganxa l\'estil', () => {
    for (const o of App.objs()) {
      const p = {};
      for (const k in STYLE_CLIP) {
        if (k === '_type') continue;
        if (['ff', 'fs', 'fw', 'fi', 'lh', 'ls', 'ta', 'deco', 'tt'].includes(k) && o.type !== 'text') continue;
        if (k === 'r' && o.type !== 'rect' && o.type !== 'image') continue;
        if ((k === 'as' || k === 'ae') && o.type !== 'line' && o.type !== 'path') continue;
        if (o.type === 'group' && !['opacity', 'blend', 'shadow', 'blur'].includes(k)) continue;
        p[k] = clone(STYLE_CLIP[k]);
      }
      patchText(o, p);
    }
  });
}
function selectAll() {
  if (App.mode && App.mode.type === 'nodes') return;
  const scope = App.scope || App.pageId;
  App.select(App.store.children(scope).filter(o => o.visible !== false && !o.locked).map(o => o.id));
}
async function replaceImage() {
  const o = App.objs()[0]; if (!o || o.type !== 'image') return;
  const f = await pickFile('image/*'); if (!f) return;
  const url = await readFileAs(f, 'url');
  const img = await loadImage(url);
  const st = App.store;
  tx('Reemplaça la imatge', () => {
    const w = img.naturalWidth, h = img.naturalHeight;
    const aid = st.addAsset(/^data:([^;,]+)/.exec(url)[1], url.slice(url.indexOf(',') + 1), w, h);
    // omple el marc actual retallant al centre
    const fr = o.w / o.h, ir = w / h;
    let cw = w, ch = h;
    if (ir > fr) cw = h * fr; else ch = w / fr;
    st.patch(o.id, { asset: aid, crop: { x: rnd((w - cw) / 2, 3), y: rnd((h - ch) / 2, 3), w: rnd(cw, 3), h: rnd(ch, 3) } });
  });
}
function resetCrop() {
  const o = App.objs()[0]; if (!o || o.type !== 'image') return;
  const a = App.store.doc.assets[o.asset];
  const s = Math.min(o.w / (o.crop ? o.crop.w : a.w), o.h / (o.crop ? o.crop.h : a.h));
  const w = a.w * s, h = a.h * s, c = G.center(o);
  tx('Restableix el retall', () => App.store.patch(o.id, { crop: { x: 0, y: 0, w: a.w, h: a.h }, w, h, x: c.x - w / 2, y: c.y - h / 2 }));
}
function imageNatural() {
  const o = App.objs()[0]; if (!o || o.type !== 'image') return;
  const cr = o.crop || App.store.doc.assets[o.asset];
  const c = G.center(o);
  tx('Mida original', () => App.store.patch(o.id, { w: cr.w, h: cr.h, x: c.x - cr.w / 2, y: c.y - cr.h / 2 }));
}
function fitPageToContent() {
  const st = App.store, p = App.page();
  const kids = st.children(p.id).filter(o => o.visible !== false);
  if (!kids.length) { UI.toast('La pàgina no té contingut', 'warn'); return; }
  const b = rectUnion(kids.map(o => G.aabb(o)));
  tx('Ajusta la pàgina al contingut', () => {
    const out = {}; for (const o of kids) G.translateObj(o, -b.x, -b.y, out);
    for (const id in out) st.patch(id, out[id]);
    resizePage(p.id, b.w, b.h);
  });
  App.fitPage();
}

/* ── pàgines ── */
async function addPage(dup) {
  const st = App.store;
  const cur = App.page();
  let id;
  tx(dup ? 'Duplica la pàgina' : 'Pàgina nova', () => {
    id = st.addPage({ w: cur.w, h: cur.h, bg: cur.bg, name: dup ? cur.name + ' (còpia)' : undefined, guides: dup ? clone(cur.guides) : { h: [], v: [] } }, cur.id);
    if (dup) { const data = cloneTree(st.children(cur.id).map(o => o.id)); insertTree(data, id, 0, 0); }
  });
  App.opts.pagesPanel = true;
  App.setPage(id, { reveal: true });
  GL.pagesStrip.build();
}
async function deletePage() {
  const st = App.store;
  const pages = st.pagesSorted();
  if (pages.length < 2) { UI.toast('El document ha de tenir com a mínim una pàgina', 'warn'); return; }
  const cur = App.page();
  const n = st.children(cur.id).length;
  if (n && !(await UI.confirm('Elimina la pàgina', `«${cur.name}» té ${n} ${n === 1 ? 'capa' : 'capes'}. Es pot desfer amb ${keyLabel('Ctrl+Z')}.`, 'Elimina', true))) return;
  const i = pages.findIndex(p => p.id === cur.id);
  const next = pages[i + 1] || pages[i - 1];
  tx('Elimina la pàgina', () => st.delPage(cur.id));
  App.setPage(next.id);
}
function gotoPage(d) {
  const pages = App.store.pagesSorted();
  const i = pages.findIndex(p => p.id === App.pageId);
  const n = pages[clamp(i + d, 0, pages.length - 1)];
  if (n && n.id !== App.pageId) App.setPage(n.id, { reveal: true });
}
function movePageStep(d) {
  const pages = App.store.pagesSorted();
  const i = pages.findIndex(p => p.id === App.pageId);
  const j = i + d;
  if (j < 0 || j >= pages.length) return;
  movePage(App.pageId, pages[j].id, d < 0 ? 'before' : 'after');
}

/* ── diàlegs ── */
function exportDialog(preset) {
  const st = App.store;
  const pages = st.pagesSorted();
  const s = Object.assign({ fmt: 'png', scale: 2, transparent: false, quality: 0.9, range: 'current', editable: false, custom: '' }, Export.last, preset || {});
  const body = el('div');
  const fg = el('div', { class: 'fmt-grid' });
  const FM = [['png', 'PNG', 'imatge'], ['jpg', 'JPG', 'foto'], ['svg', 'SVG', 'vectorial'], ['pdf', 'PDF', 'impressió']];
  const btns = FM.map(([k, a, b]) => { const x = el('button', { class: 'fmt', type: 'button' }, el('b', { text: a }), el('span', { text: b })); x.addEventListener('click', () => { s.fmt = k; paint(); }); fg.append(x); return [k, x]; });
  body.append(fg);
  const opts = el('div');
  body.append(opts);
  const prev = el('div', { class: 'exp-prev' });
  body.append(prev);
  const pagesOf = () => {
    if (s.range === 'current') return [App.page()];
    if (s.range === 'all') return pages;
    const set = new Set();
    for (const part of String(s.custom).split(/[,;\s]+/)) { const m = /^(\d+)(?:-(\d+))?$/.exec(part); if (!m) continue; const a = +m[1], b = m[2] ? +m[2] : a; for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (pages[i - 1]) set.add(pages[i - 1]); }
    return Array.from(set);
  };
  const paint = () => {
    btns.forEach(([k, x]) => x.classList.toggle('on', s.fmt === k));
    opts.textContent = '';
    const grp = (label, ctl) => el('div', { class: 'fgroup' }, el('span', { class: 'lbl', text: label }), ctl);
    if (pages.length > 1) {
      const rr = el('div', { class: 'ibar' });
      for (const [k, l] of [['current', 'Pàgina actual'], ['all', 'Totes (' + pages.length + ')'], ['custom', 'Interval']]) { const b = el('button', { type: 'button', text: l, class: s.range === k ? 'on' : '' }); b.style.fontSize = '11.5px'; b.addEventListener('click', () => { s.range = k; paint(); }); rr.append(b); }
      opts.append(grp('Pàgines', rr));
      if (s.range === 'custom') {
        const inp = el('input', { value: s.custom || '1-' + pages.length, placeholder: 'p. ex. 1-3, 5' });
        inp.addEventListener('input', () => { s.custom = inp.value; info(); });
        inp.addEventListener('keydown', e => e.stopPropagation());
        s.custom = inp.value;
        opts.append(el('div', { class: 'fld plain', style: { marginTop: '6px' } }, inp));
      }
    }
    if (s.fmt === 'png' || s.fmt === 'jpg') {
      const sc = el('div', { class: 'ibar' });
      for (const k of [0.5, 1, 2, 3, 4]) { const b = el('button', { type: 'button', text: fmtNum(k) + '×', class: s.scale === k ? 'on' : '' }); b.style.fontSize = '11.5px'; b.addEventListener('click', () => { s.scale = k; paint(); }); sc.append(b); }
      // resolucions d'impressió
      for (const dpi of [150, 300]) { const k = dpi / 96; const b = el('button', { type: 'button', text: dpi + ' ppp', class: Math.abs(s.scale - k) < 1e-6 ? 'on' : '' }); b.style.fontSize = '11.5px'; b.addEventListener('click', () => { s.scale = k; paint(); }); sc.append(b); }
      opts.append(grp('Escala', sc));
    }
    if (s.fmt === 'png' || s.fmt === 'svg') {
      const row = el('div', { class: 'row', style: { marginTop: '12px' } });
      const t1 = el('label', { class: 'chk' }, el('input', { type: 'checkbox' }), 'Fons transparent');
      t1.firstChild.checked = s.transparent; t1.firstChild.addEventListener('change', e => { s.transparent = e.target.checked; });
      const t2 = el('label', { class: 'chk', 'data-tip': 'Incrusta el document perquè es pugui tornar a obrir i editar amb guaitaLlenç' }, el('input', { type: 'checkbox' }), 'Editable (inclou el document)');
      t2.firstChild.checked = s.editable; t2.firstChild.addEventListener('change', e => { s.editable = e.target.checked; info(); });
      row.append(t1, el('span', { class: 'grow' }), t2);
      opts.append(row);
    }
    if (s.fmt === 'jpg') {
      const r = el('div', { class: 'row' });
      const q = Slider({ min: 40, max: 100, get: () => Math.round(s.quality * 100), set: v => { s.quality = v / 100; ql.textContent = v + '%'; } });
      const ql = el('span', { class: 'st-mono', text: Math.round(s.quality * 100) + '%', style: { width: '40px', textAlign: 'right' } });
      r.append(q, ql);
      opts.append(grp('Qualitat', r));
    }
    if (s.fmt === 'pdf') opts.append(el('p', { class: 'p-note', style: { marginTop: '12px' }, text: 'S\'obrirà el diàleg d\'impressió del navegador amb la mida exacta de cada pàgina. Tria «Desa com a PDF». Els textos i les formes es mantenen vectorials.' }));
    info();
  };
  const info = () => {
    const ps = pagesOf();
    const p = ps[0];
    let t = '';
    if (!p) t = 'Cap pàgina seleccionada';
    else if (s.fmt === 'png' || s.fmt === 'jpg') t = `${Math.round(p.w * s.scale)} × ${Math.round(p.h * s.scale)} px`;
    else t = `${fmtLen(p.w, 'mm', -1)} × ${fmtLen(p.h, 'mm', -1)} mm`;
    prev.textContent = '';
    prev.append(el('span', { text: t }), el('span', { text: ps.length > 1 && s.fmt !== 'pdf' ? `${ps.length} fitxers · ZIP` : ps.length + (ps.length === 1 ? ' pàgina' : ' pàgines') }));
  };
  paint();
  UI.dialog({
    title: 'Exporta', body, width: 480,
    buttons: [{ label: 'Cancel·la', ghost: true }, {
      label: 'Exporta', primary: true, run: async () => {
        const ps = pagesOf();
        if (!ps.length) { UI.toast('Indica un interval de pàgines vàlid', 'warn'); return false; }
        Export.last = Object.assign({}, s);
        try { await IO.exportRun(Object.assign({}, s, { pages: ps })); } catch (e) { console.error(e); UI.toast(e.message || 'Error en exportar', 'err', 4000); }
      }
    }],
  });
}
const Export = { last: {} };

function shortcutsDialog() {
  const groups = [
    ['Eines', [['Selecció', 'V'], ['Mà (o mantén Espai)', 'H'], ['Rectangle', 'R'], ['El·lipse', 'O'], ['Polígon', 'Y'], ['Estrella', 'Shift+Y'], ['Línia', 'L'], ['Fletxa', 'Shift+L'], ['Ploma', 'P'], ['Text', 'T'], ['Imatge', 'Shift+Ctrl+K']]],
    ['Edició', [['Desfés', 'Ctrl+Z'], ['Refés', 'Ctrl+Shift+Z'], ['Duplica', 'Ctrl+D'], ['Enganxa al mateix lloc', 'Ctrl+Shift+V'], ['Elimina', 'Del'], ['Selecciona-ho tot', 'Ctrl+A'], ['Edita (text, nodes, retall)', 'Enter'], ['Surt / deselecciona', 'Esc']]],
    ['Objecte', [['Agrupa', 'Ctrl+G'], ['Desagrupa', 'Ctrl+Shift+G'], ['Porta al davant', 'Ctrl+Shift+]'], ['Envia al fons', 'Ctrl+Shift+['], ['Converteix a trajecte', 'Ctrl+Shift+O'], ['Bloqueja', 'Ctrl+Shift+L'], ['Amaga', 'Ctrl+Shift+H'], ['Copia l\'estil', 'Ctrl+Alt+C'], ['Enganxa l\'estil', 'Ctrl+Alt+V']]],
    ['Vista', [['Apropa / allunya', 'Ctrl++'], ['Ajusta a la pàgina', 'Shift+1'], ['Ajusta a la selecció', 'Shift+2'], ['Mida real', 'Shift+0'], ['Regles', 'Shift+R'], ['Graella', "Ctrl+'"], ['Mode focus', 'Tab'], ['Paleta d\'ordres', 'Ctrl+K']]],
    ['Modificadors', [['Proporcional / 45°', 'Shift'], ['Des del centre / duplica', 'Alt'], ['Selecció profunda / sense ajust', 'Ctrl'], ['Desplaça 1 / 10', '↑ / Shift+↑']]],
    ['Pàgines i fitxer', [['Pàgina anterior / següent', 'PageUp'], ['Desa', 'Ctrl+S'], ['Obre', 'Ctrl+O'], ['Exporta', 'Ctrl+Shift+E'], ['PDF', 'Ctrl+P']]],
  ];
  const b = el('div', { class: 'shortcuts' });
  for (const [h, ks] of groups) {
    const g = el('div', { class: 'g' }, el('h4', { text: h }));
    for (const [l, k] of ks) g.append(el('div', { class: 'k' }, el('span', { text: l }), el('span', { text: k.split(' / ').map(keyLabel).join(' / ') })));
    b.append(g);
  }
  UI.dialog({ title: 'Dreceres de teclat', body: b, width: 640 });
}
function aboutDialog() {
  const b = el('div', { html: `
    <div style="display:flex;align-items:center;gap:12px;margin:4px 0 14px"><svg viewBox="0 0 32 32" style="width:40px;height:40px;color:var(--acc)"><rect x="5" y="5" width="22" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M11 21 L21 11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
    <div><div style="font:600 18px var(--f-ui);color:var(--tx)">guaita<span style="color:var(--acc)">Llenç</span> <span style="font:500 11px var(--f-mono);color:var(--tx3)">v${VERSION}</span></div><div>Editor gràfic de pàgines, pòsters i làmines · Guaita Apps</div></div></div>
    <p>Aplicació autònoma en un sol fitxer HTML: funciona sense connexió i sense enviar res a cap servidor. Els documents es desen al teu ordinador (.llenc) i, automàticament, en aquest navegador.</p>
    <p>Copyright © 2026 SBS BiM Consulting, Jordi Subirós.<br>Programari lliure sota la llicència <b>GNU AGPL-3.0-only</b>. Tipografies IBM Plex sota llicència SIL Open Font License 1.1.</p>
    <p style="font:11px var(--f-mono);color:var(--tx3)">SPDX-License-Identifier: AGPL-3.0-only</p>` });
  UI.dialog({ title: 'Sobre guaitaLlenç', body: b, width: 500, buttons: [{ label: 'Tanca', primary: true }] });
}
async function docPropsDialog() {
  const st = App.store;
  const body = el('div');
  const mk = (label, val, k) => { const inp = el('input', { value: val || '', spellcheck: 'false' }); inp.dataset.k = k; inp.addEventListener('keydown', e => e.stopPropagation()); body.append(el('div', { class: 'fgroup' }, el('span', { class: 'lbl', text: label }), el('div', { class: 'fld plain' }, inp))); return inp; };
  const a = mk('Títol', st.props.name, 'name');
  const b = mk('Autor', st.props.author, 'author');
  const c = mk('Descripció', st.props.desc, 'desc');
  const dt = mk('Data (buida = avui)', st.props.date, 'date');
  const d = st.props;
  // camps variables personalitzats
  const fields = Object.assign({}, d.fields || {});
  const fbox = el('div', { class: 'fields-box' });
  const drawF = () => {
    fbox.textContent = '';
    for (const k of Object.keys(fields)) {
      const kv = el('input', { value: k, spellcheck: 'false', 'aria-label': 'Nom del camp' });
      const vv = el('input', { value: fields[k], spellcheck: 'false', 'aria-label': 'Valor' });
      for (const x of [kv, vv]) x.addEventListener('keydown', e => e.stopPropagation());
      kv.addEventListener('change', () => { const nk = kv.value.trim().replace(/[{}]/g, ''); if (!nk || nk === k) { kv.value = k; return; } fields[nk] = fields[k]; delete fields[k]; drawF(); });
      vv.addEventListener('input', () => { fields[k] = vv.value; });
      const del = el('button', { class: 'icon-btn sm', html: icon('trash'), 'data-tip': 'Elimina el camp' });
      del.addEventListener('click', () => { delete fields[k]; drawF(); });
      fbox.append(el('div', { class: 'frow' }, el('div', { class: 'fld plain' }, kv), el('div', { class: 'fld plain grow' }, vv), del));
    }
    const add = el('button', { class: 'btn ghost', text: '+ Afegeix un camp' });
    add.addEventListener('click', () => { let n = 1; while (fields['camp' + n] !== undefined) n++; fields['camp' + n] = ''; drawF(); });
    fbox.append(add);
  };
  drawF();
  body.append(el('div', { class: 'fgroup' }, el('span', { class: 'lbl', text: 'Camps variables · escriu {nom} dins d\'un text' }), el('div', { class: 'p-note', style: { margin: '0 0 6px' }, text: 'Sempre disponibles: {títol} {autor} {data} {pàgina} {pàgines}' }), fbox));
  body.append(el('p', { class: 'p-note', style: { marginTop: '14px' }, text: `Creat: ${d.created ? new Date(d.created).toLocaleString('ca') : '—'} · ${Object.keys(st.doc.pages).length} pàgines · ${Object.keys(st.doc.objs).length} objectes · ${Object.keys(st.doc.assets).length} imatges` }));
  const ok = await UI.dialog({ title: 'Propietats del document', body, width: 440, buttons: [{ label: 'Cancel·la', ghost: true, value: false }, { label: 'Desa', primary: true, value: true }] });
  if (!ok) return;
  tx('Propietats del document', () => { for (const inp of [a, b, c, dt]) st.setDoc(inp.dataset.k, inp.value.trim() || (inp.dataset.k === 'name' ? 'Sense títol' : '')); st.setDoc('fields', fields); GL.lib.refitFields(); });
  $('#docName').value = st.props.name;
}

/* ── definició de les ordres ── */
function defineCommands() {
  const C = c => Cmd.def(c);
  const st = () => App.store;
  // fitxer
  C({ id: 'file.new', label: 'Document nou…', key: 'Ctrl+Alt+N', icon: 'file', run: () => GL.start.open() });
  C({ id: 'file.open', label: 'Obre…', key: 'Ctrl+O', run: () => IO.openPicker() });
  C({ id: 'file.save', label: 'Desa', key: 'Ctrl+S', icon: 'save', enabled: docOpen, run: () => IO.save(false) });
  C({ id: 'file.saveAs', label: 'Desa com a .llenc…', key: 'Ctrl+Shift+S', enabled: docOpen, run: () => IO.save(true) });
  C({ id: 'file.saveSvgEd', label: 'SVG editable…', enabled: docOpen, run: () => exportDialog({ fmt: 'svg', editable: true, range: 'current' }) });
  C({ id: 'file.savePngEd', label: 'PNG editable…', enabled: docOpen, run: () => exportDialog({ fmt: 'png', editable: true, range: 'current' }) });
  C({ id: 'file.import', label: 'Importa imatges o SVG…', key: 'Ctrl+Shift+I', enabled: docOpen, run: async () => { const fs = await pickFile('image/*,.svg,.llenc', true); if (fs && fs.length) IO.importFiles(fs); } });
  C({ id: 'file.export', label: 'Exporta…', key: 'Ctrl+Shift+E', icon: 'export', enabled: docOpen, run: () => exportDialog() });
  C({ id: 'file.exportPng', label: 'PNG…', enabled: docOpen, run: () => exportDialog({ fmt: 'png', editable: false }) });
  C({ id: 'file.exportJpg', label: 'JPG…', enabled: docOpen, run: () => exportDialog({ fmt: 'jpg' }) });
  C({ id: 'file.exportSvg', label: 'SVG…', enabled: docOpen, run: () => exportDialog({ fmt: 'svg', editable: false }) });
  C({ id: 'file.pdf', label: 'PDF (impressió)…', key: 'Ctrl+P', enabled: docOpen, run: () => exportDialog({ fmt: 'pdf', range: App.store.pagesSorted().length > 1 ? 'all' : 'current' }) });
  C({ id: 'file.props', label: 'Propietats del document…', enabled: docOpen, run: docPropsDialog });
  // edició
  C({ id: 'edit.undo', label: 'Desfés', key: 'Ctrl+Z', icon: 'undo', enabled: () => docOpen() && App.store.canUndo, run: () => { const e = App.store.undo(); if (e && e.label) UI.toast('Desfet: ' + e.label.toLowerCase(), 'ok', 1400); } });
  C({ id: 'edit.redo', label: 'Refés', key: 'Ctrl+Shift+Z', alt: 'Ctrl+Y', icon: 'redo', enabled: () => docOpen() && App.store.canRedo, run: () => { const e = App.store.redo(); if (e && e.label) UI.toast('Refet: ' + e.label.toLowerCase(), 'ok', 1400); } });
  C({ id: 'edit.cut', label: 'Retalla', key: 'Ctrl+X', enabled: hasSel, run: () => { GL.clip.copy(); tx('Retalla', () => App.store.del(App.sel)); } });
  C({ id: 'edit.copy', label: 'Copia', key: 'Ctrl+C', enabled: hasSel, run: () => GL.clip.copy() });
  C({ id: 'edit.paste', label: 'Enganxa', key: 'Ctrl+V', enabled: () => docOpen(), run: async () => {
    if (navigator.clipboard && navigator.clipboard.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const it of items) {
          const img = it.types.find(t => t.startsWith('image/') && t !== 'image/svg+xml');
          if (img) { const b = await it.getType(img); await IO.importFiles([new File([b], 'enganxat.' + img.split('/')[1], { type: img })], App.pasteAt()); return; }
          if (it.types.includes('text/plain')) { const t = await (await it.getType('text/plain')).text(); return GL.clip.pasteText(t); }
        }
      } catch (e) { }
    }
    GL.clip.paste(null);
  } });
  C({ id: 'edit.pasteInPlace', label: 'Enganxa al mateix lloc', key: 'Ctrl+Shift+V', enabled: () => !!GL.clip.data, run: () => GL.clip.pasteData(GL.clip.data, true) });
  C({ id: 'edit.duplicate', label: 'Duplica', key: 'Ctrl+D', icon: 'dup', enabled: hasSel, run: () => { let ids; tx('Duplica', () => { ids = duplicateSel(10, 10); }); App.select(ids); } });
  C({ id: 'edit.delete', label: 'Elimina', key: 'Del', icon: 'trash', enabled: hasSel, run: () => { tx('Elimina', () => { App.store.del(App.sel); cleanupGroups(); }); App.clearSel(); } });
  C({ id: 'edit.selectAll', label: 'Selecciona-ho tot', key: 'Ctrl+A', enabled: docOpen, run: selectAll });
  C({ id: 'edit.deselect', label: 'Deselecciona', key: 'Esc', enabled: hasSel, run: () => App.clearSel() });
  C({ id: 'edit.selectSame', label: 'Selecciona el mateix tipus', enabled: hasSel, run: () => { const t = new Set(App.objs().map(o => o.type)); App.select(App.store.children(App.scope || App.pageId).filter(o => t.has(o.type) && o.visible !== false && !o.locked).map(o => o.id)); } });
  C({ id: 'edit.copyStyle', label: 'Copia l\'estil', key: 'Ctrl+Alt+C', enabled: sel1(), run: copyStyle });
  C({ id: 'edit.pasteStyle', label: 'Enganxa l\'estil', key: 'Ctrl+Alt+V', enabled: () => hasSel() && !!STYLE_CLIP, run: pasteStyle });
  // vista
  C({ id: 'view.zoomIn', label: 'Apropa', key: 'Ctrl++', alt: ['+', 'Shift++', 'Ctrl+Shift++'], enabled: docOpen, run: () => App.zoomStep(1) });
  C({ id: 'view.zoomOut', label: 'Allunya', key: 'Ctrl+-', alt: ['-'], enabled: docOpen, run: () => App.zoomStep(-1) });
  C({ id: 'view.fit', label: 'Ajusta a la pàgina', key: 'Shift+1', alt: ['Ctrl+0'], enabled: docOpen, run: () => App.view === 'all' ? App.zoomToRect(App.worldRect(), 60) : App.fitPage() });
  C({ id: 'view.fitSel', label: 'Ajusta a la selecció', key: 'Shift+2', enabled: docOpen, run: () => App.fitSelection() });
  C({ id: 'view.100', label: 'Mida real (100 %)', key: 'Shift+0', alt: ['Ctrl+1'], enabled: docOpen, run: () => App.zoom100() });
  C({ id: 'view.page', label: 'Pàgina activa', enabled: docOpen, checked: () => App.view === 'page', run: () => App.setView('page') });
  C({ id: 'view.all', label: 'Totes les pàgines', enabled: docOpen, checked: () => App.view === 'all', run: () => App.setView('all') });
  C({ id: 'view.rulers', label: 'Regles', key: 'Shift+R', checked: () => App.opts.rulers, run: () => toggleOpt('rulers') });
  C({ id: 'view.guides', label: 'Mostra les guies', key: 'Ctrl+;', checked: () => App.opts.guides, run: () => toggleOpt('guides') });
  C({ id: 'view.lockGuides', label: 'Bloqueja les guies', checked: () => App.opts.guidesLocked, run: () => toggleOpt('guidesLocked') });
  C({ id: 'view.clearGuides', label: 'Esborra les guies de la pàgina', enabled: () => { const p = App.page(); return !!(p && p.guides && (p.guides.h.length || p.guides.v.length)); }, run: () => tx('Esborra les guies', () => App.store.setPage(App.pageId, 'guides', { h: [], v: [] })) });
  C({ id: 'view.grid', label: 'Graella', key: "Ctrl+'", checked: () => App.opts.grid, run: () => toggleOpt('grid') });
  C({ id: 'view.snapGrid', label: 'Ajusta a la graella', key: "Ctrl+Shift+'", checked: () => App.opts.snapGrid, run: () => toggleOpt('snapGrid') });
  C({ id: 'view.smart', label: 'Guies intel·ligents', checked: () => App.opts.smart, run: () => toggleOpt('smart') });
  C({ id: 'view.clip', label: 'Retalla el contingut a la pàgina', checked: () => App.opts.clip, run: () => { toggleOpt('clip'); App.layoutPages(); } });
  C({ id: 'view.pagesPanel', label: 'Panell de pàgines', checked: () => App.opts.pagesPanel, run: () => { App.opts.pagesPanel = !App.opts.pagesPanel; GL.pagesStrip.build(); } });
  C({ id: 'view.rightPanel', label: 'Panell de propietats i capes', key: 'Ctrl+\\', checked: () => App.opts.rightPanel, run: () => { App.opts.rightPanel = !App.opts.rightPanel; $('#app').classList.toggle('no-right', !App.opts.rightPanel); setTimeout(() => App.applyView(), 0); } });
  C({ id: 'view.focus', label: 'Mode focus', key: 'Tab', icon: 'focus', run: () => { $('#app').classList.toggle('focus-mode'); setTimeout(() => App.applyView(), 0); if ($('#app').classList.contains('focus-mode')) UI.toast('Mode focus · prem Tab per tornar'); } });
  C({ id: 'view.unitMenu', label: 'Unitats…', hidden: true, run: () => { const r = $('#rulerCorner').getBoundingClientRect(); UI.menu(unitItems(), r.left, r.bottom + 4); } });
  for (const u of Object.keys(UNITS)) C({ id: 'view.unit.' + u, label: 'Unitats: ' + u, checked: () => App.store.doc && App.store.props.unit === u, enabled: docOpen, run: () => { tx('Unitats', () => App.store.setDoc('unit', u)); App.applyView(); GL.props.rebuild(); } });
  // eines
  for (const [t, k, l] of [['select', 'V', 'Eina de selecció'], ['hand', 'H', 'Eina mà'], ['rect', 'R', 'Rectangle'], ['ellipse', 'O', 'El·lipse'], ['polygon', 'Y', 'Polígon'], ['star', 'Shift+Y', 'Estrella'], ['line', 'L', 'Línia'], ['arrow', 'Shift+L', 'Fletxa'], ['pen', 'P', 'Ploma'], ['text', 'T', 'Text']]) {
    C({ id: 'tool.' + t, label: l, key: k, icon: TOOLS.flatMap(x => x.group || [x]).find(x => x.tool === t)?.icon, enabled: docOpen, checked: () => App.tool === t, run: () => setTool(t) });
  }
  C({ id: 'lib.toggle', label: 'Biblioteca', key: 'B', icon: 'layers', enabled: docOpen, checked: () => GL.libPanel.el && !GL.libPanel.el.hidden, run: () => GL.libPanel.toggle() });
  C({ id: 'lib.templates', label: 'Plantilla…', icon: 'pages', enabled: docOpen, run: () => GL.libPanel.toggle(true, 'tpl') });
  C({ id: 'lib.symbols', label: 'Imatge de la biblioteca…', icon: 'star', enabled: docOpen, run: () => GL.libPanel.toggle(true, 'sym') });
  C({ id: 'lib.styles', label: 'Colors i estils del document', icon: 'drop', enabled: docOpen, run: () => GL.libPanel.toggle(true, 'sty') });
  C({ id: 'insert.field', label: 'Camp variable…', enabled: () => App.objs().some(o => o.type === 'text') || !!GL.textEdit.id, run: () => { const r = App.stage.getBoundingClientRect(); UI.menu(GL.lib.fieldList().map(k => ({ label: '{' + k + '}', run: () => GL.insertField(k) })), r.left + r.width / 2 - 100, r.top + 80); } });
  for (const P of GL.lib.PALETTES) C({ id: 'pal.' + P.id, label: 'Paleta: ' + P.name, enabled: docOpen, checked: () => App.store.doc && App.store.props.palette === P.id, run: () => GL.lib.applyPalette(P.id) });
  C({ id: 'user.saveTpl', label: 'Desa la pàgina com a plantilla…', icon: 'save', enabled: docOpen, run: () => saveUserTemplate() });
  C({ id: 'user.saveSym', label: 'Desa la selecció com a símbol…', icon: 'save', enabled: hasSel, run: () => saveUserSymbol() });
  C({ id: 'gh.config', label: 'Connexió amb GitHub…', icon: 'cloud', run: () => GH.configDialog() });
  C({ id: 'gh.sync', label: 'Sincronitza amb GitHub…', key: 'Ctrl+Alt+S', icon: 'cloud', enabled: docOpen, run: () => GH.syncNow() });
  C({ id: 'gh.open', label: 'Obre des de GitHub…', run: () => GH.openRemote() });
  C({ id: 'gh.history', label: 'Historial de versions…', icon: 'history', enabled: () => docOpen() && GH.linked(), run: () => GH.historyDialog() });
  C({ id: 'gh.unlink', label: 'Desvincula de GitHub', enabled: () => docOpen() && GH.linked(), run: () => GH.unlink() });
  C({ id: 'packs.manage', label: 'Paquets de biblioteca…', icon: 'layers', run: () => packsDialog() });
  C({ id: 'kids.toggle', label: 'Mode infantil', checked: () => GL.kids.on, run: () => GL.kids.set(!GL.kids.on) });
  C({ id: 'insert.image', label: 'Imatge…', key: 'Shift+Ctrl+K', icon: 'image', enabled: docOpen, run: async () => { const fs = await pickFile('image/*,.svg', true); if (fs && fs.length) IO.importFiles(fs); } });
  // objecte
  C({ id: 'obj.edit', label: 'Edita (text, nodes, retall)', key: 'Enter', enabled: sel1(), run: () => editObject(App.objs()[0]) });
  C({ id: 'obj.group', label: 'Agrupa', key: 'Ctrl+G', icon: 'group', enabled: hasSel, run: groupSel });
  C({ id: 'obj.ungroup', label: 'Desagrupa', key: 'Ctrl+Shift+G', enabled: () => App.objs().some(o => o.type === 'group'), run: ungroupSel });
  C({ id: 'obj.toPath', label: 'Converteix a trajecte', key: 'Ctrl+Shift+O', icon: 'nodes', enabled: () => App.objs().some(o => ['rect', 'ellipse', 'polygon', 'star', 'line'].includes(o.type)), run: convertToPath });
  C({ id: 'obj.crop', label: 'Retalla la imatge', icon: 'crop', enabled: sel1('image'), run: () => editObject(App.objs()[0]) });
  C({ id: 'obj.resetCrop', label: 'Restableix el retall', enabled: sel1('image'), run: resetCrop });
  C({ id: 'obj.replaceImage', label: 'Reemplaça la imatge…', enabled: sel1('image'), run: replaceImage });
  C({ id: 'obj.imageNatural', label: 'Mida original de la imatge', enabled: sel1('image'), run: imageNatural });
  C({ id: 'obj.rotR', label: 'Gira 90° a la dreta', enabled: hasSel, run: () => rotateSel(90) });
  C({ id: 'obj.rotL', label: 'Gira 90° a l\'esquerra', icon: 'rotL', enabled: hasSel, run: () => rotateSel(-90) });
  C({ id: 'obj.flipH', label: 'Reflecteix horitzontalment', key: 'Shift+H', icon: 'flipH', enabled: hasSel, run: () => flipSel('h') });
  C({ id: 'obj.flipV', label: 'Reflecteix verticalment', key: 'Shift+V', icon: 'flipV', enabled: hasSel, run: () => flipSel('v') });
  C({ id: 'obj.lock', label: 'Bloqueja / desbloqueja', key: 'Ctrl+Shift+L', icon: 'lock', enabled: hasSel, run: () => { const v = !App.objs().every(o => o.locked); tx(v ? 'Bloqueja' : 'Desbloqueja', () => App.objs().forEach(o => App.store.set(o.id, 'locked', v))); if (v) App.clearSel(); } });
  C({ id: 'obj.unlockAll', label: 'Desbloqueja-ho tot a la pàgina', enabled: () => docOpen() && Object.values(App.store.doc.objs).some(o => o.page === App.pageId && o.locked), run: () => tx('Desbloqueja-ho tot', () => Object.values(App.store.doc.objs).filter(o => o.page === App.pageId && o.locked).forEach(o => App.store.set(o.id, 'locked', false))) });
  C({ id: 'obj.hide', label: 'Amaga / mostra', key: 'Ctrl+Shift+H', icon: 'eyeOff', enabled: hasSel, run: () => { const v = !App.objs().every(o => o.visible === false); tx(v ? 'Amaga' : 'Mostra', () => App.objs().forEach(o => App.store.set(o.id, 'visible', !v))); } });
  C({ id: 'obj.showAll', label: 'Mostra-ho tot a la pàgina', enabled: () => docOpen() && Object.values(App.store.doc.objs).some(o => o.page === App.pageId && o.visible === false), run: () => tx('Mostra-ho tot', () => Object.values(App.store.doc.objs).filter(o => o.page === App.pageId && o.visible === false).forEach(o => App.store.set(o.id, 'visible', true))) });
  C({ id: 'obj.rename', label: 'Reanomena…', key: 'F2', enabled: sel1(), run: async () => { const o = App.objs()[0]; const n = await UI.prompt('Reanomena', 'Nom de la capa', o.name); if (n && n.trim()) tx('Reanomena', () => App.store.set(o.id, 'name', n.trim())); } });
  // organitza
  C({ id: 'arr.front', label: 'Porta al davant', key: 'Ctrl+Shift+]', icon: 'front', enabled: hasSel, run: () => zorder('front') });
  C({ id: 'arr.forward', label: 'Porta endavant', key: 'Ctrl+]', enabled: hasSel, run: () => zorder('forward') });
  C({ id: 'arr.backward', label: 'Envia enrere', key: 'Ctrl+[', enabled: hasSel, run: () => zorder('backward') });
  C({ id: 'arr.back', label: 'Envia al fons', key: 'Ctrl+Shift+[', icon: 'back', enabled: hasSel, run: () => zorder('back') });
  for (const [k, l, ic, key] of [['left', 'Alinea a l\'esquerra', 'aL', 'Alt+A'], ['hcenter', 'Centra horitzontalment', 'aCH', 'Alt+H'], ['right', 'Alinea a la dreta', 'aR', 'Alt+D'], ['top', 'Alinea a dalt', 'aT', 'Alt+W'], ['vcenter', 'Centra verticalment', 'aCV', 'Alt+V'], ['bottom', 'Alinea a baix', 'aB', 'Alt+S']]) C({ id: 'align.' + k, label: l, icon: ic, key, enabled: hasSel, run: () => alignSel(k) });
  C({ id: 'align.distH', label: 'Distribueix horitzontalment', icon: 'dH', key: 'Alt+Shift+H', enabled: () => topOnly(App.sel).length >= 3, run: () => distribute('h') });
  C({ id: 'align.distV', label: 'Distribueix verticalment', icon: 'dV', key: 'Alt+Shift+V', enabled: () => topOnly(App.sel).length >= 3, run: () => distribute('v') });
  // pàgines
  C({ id: 'page.add', label: 'Pàgina nova', key: 'Ctrl+Shift+N', icon: 'plus', enabled: docOpen, run: () => addPage(false) });
  C({ id: 'page.dup', label: 'Duplica la pàgina', icon: 'dup', enabled: docOpen, run: () => addPage(true) });
  C({ id: 'page.del', label: 'Elimina la pàgina', icon: 'trash', enabled: () => docOpen() && App.store.pagesSorted().length > 1, run: deletePage });
  C({ id: 'page.rename', label: 'Reanomena la pàgina…', enabled: docOpen, run: async () => { const p = App.page(); const n = await UI.prompt('Reanomena la pàgina', 'Nom', p.name); if (n && n.trim()) tx('Reanomena la pàgina', () => App.store.setPage(p.id, 'name', n.trim())); } });
  C({ id: 'page.prev', label: 'Pàgina anterior', key: 'PageUp', icon: 'chevL', enabled: () => docOpen() && App.store.pagesSorted()[0].id !== App.pageId, run: () => gotoPage(-1) });
  C({ id: 'page.next', label: 'Pàgina següent', key: 'PageDown', icon: 'chev', enabled: () => { if (!docOpen()) return false; const p = App.store.pagesSorted(); return p[p.length - 1].id !== App.pageId; }, run: () => gotoPage(1) });
  C({ id: 'page.up', label: 'Mou la pàgina enrere', enabled: () => docOpen() && App.store.pagesSorted()[0].id !== App.pageId, run: () => movePageStep(-1) });
  C({ id: 'page.down', label: 'Mou la pàgina endavant', enabled: () => { if (!docOpen()) return false; const p = App.store.pagesSorted(); return p[p.length - 1].id !== App.pageId; }, run: () => movePageStep(1) });
  C({ id: 'page.fitContent', label: 'Ajusta la pàgina al contingut', enabled: docOpen, run: fitPageToContent });
  C({ id: 'page.size', label: 'Mida i fons de la pàgina…', enabled: docOpen, run: () => { App.clearSel(); App.exitMode(); GL.props.rebuild(); UI.toast('Edita la mida i el fons al panell de propietats'); } });
  // ajuda
  C({ id: 'help.palette', label: 'Paleta d\'ordres', key: 'Ctrl+K', icon: 'search', run: () => Palette.open() });
  C({ id: 'help.keys', label: 'Dreceres de teclat', key: 'Shift+/', alt: ['F1', '/'], icon: 'keyboard', run: shortcutsDialog });
  C({ id: 'help.about', label: 'Sobre guaitaLlenç', icon: 'info', run: aboutDialog });
}
function toggleOpt(k) {
  App.opts[k] = !App.opts[k];
  $('#app').classList.toggle('no-rulers', !App.opts.rulers);
  App.applyView(); App.drawOv();
  GL.props && GL.props.refresh();
}
function unitItems() { return Object.keys(UNITS).map(u => ({ cmd: 'view.unit.' + u, label: { px: 'Píxels (px)', mm: 'Mil·límetres (mm)', cm: 'Centímetres (cm)', in: 'Polzades (in)', pt: 'Punts (pt)' }[u] })); }

/* ── menús ── */
function menuDefs() {
  const recents = () => (GL.start.recentCache || []).slice(0, 8).map(r => ({ label: r.name || 'Sense títol', run: () => GL.start.openRecent(r.id) }));
  return [
    { label: 'Fitxer', items: () => [{ cmd: 'file.new' }, { cmd: 'file.open' }, { label: 'Recents', sub: (() => { const r = recents(); return r.length ? r : [{ label: 'Cap document recent', disabled: true }]; })() }, '-', { cmd: 'file.save' }, { label: 'Desa com a', sub: [{ cmd: 'file.saveAs' }, { cmd: 'file.saveSvgEd' }, { cmd: 'file.savePngEd' }] }, '-', { cmd: 'file.import' }, { label: 'GitHub', sub: [{ cmd: 'gh.sync' }, { cmd: 'gh.history' }, '-', { cmd: 'gh.open' }, { cmd: 'gh.config' }, { cmd: 'gh.unlink' }] }, { label: 'Exporta', sub: [{ cmd: 'file.export' }, '-', { cmd: 'file.exportPng' }, { cmd: 'file.exportJpg' }, { cmd: 'file.exportSvg' }, { cmd: 'file.pdf' }] }, '-', { cmd: 'file.props' }, { label: 'Paleta del document', sub: GL.lib.PALETTES.map(P => ({ cmd: 'pal.' + P.id })) }, { cmd: 'lib.styles' }] },
    { label: 'Edita', items: () => [{ cmd: 'edit.undo', label: App.store.canUndo && App.store.undoStack[App.store.undoStack.length - 1].label ? 'Desfés ' + App.store.undoStack[App.store.undoStack.length - 1].label.toLowerCase() : 'Desfés' }, { cmd: 'edit.redo' }, '-', { cmd: 'edit.cut' }, { cmd: 'edit.copy' }, { cmd: 'edit.paste' }, { cmd: 'edit.pasteInPlace' }, { cmd: 'edit.duplicate' }, { cmd: 'edit.delete' }, '-', { cmd: 'edit.selectAll' }, { cmd: 'edit.selectSame' }, { cmd: 'edit.deselect' }, '-', { cmd: 'edit.copyStyle' }, { cmd: 'edit.pasteStyle' }, '-', { cmd: 'help.palette' }] },
    { label: 'Visualitza', items: () => [{ cmd: 'view.zoomIn' }, { cmd: 'view.zoomOut' }, { cmd: 'view.fit' }, { cmd: 'view.fitSel' }, { cmd: 'view.100' }, '-', { cmd: 'view.page' }, { cmd: 'view.all' }, '-', { cmd: 'view.rulers' }, { label: 'Guies', sub: [{ cmd: 'view.guides' }, { cmd: 'view.lockGuides' }, { cmd: 'view.clearGuides' }] }, { cmd: 'view.grid' }, { cmd: 'view.snapGrid' }, { cmd: 'view.smart' }, { cmd: 'view.clip' }, '-', { label: 'Panells', sub: [{ cmd: 'view.rightPanel' }, { cmd: 'view.pagesPanel' }, { cmd: 'lib.toggle' }] }, { cmd: 'view.focus' }, { cmd: 'kids.toggle' }, '-', { label: 'Unitats', sub: unitItems() }] },
    { label: 'Insereix', items: [{ cmd: 'tool.rect' }, { cmd: 'tool.ellipse' }, { cmd: 'tool.polygon' }, { cmd: 'tool.star' }, '-', { cmd: 'tool.line' }, { cmd: 'tool.arrow' }, { cmd: 'tool.pen' }, '-', { cmd: 'tool.text' }, { cmd: 'insert.field' }, { cmd: 'insert.image' }, { cmd: 'file.import', label: 'Imatge o SVG des de fitxer…' }, '-', { cmd: 'lib.templates' }, { cmd: 'lib.symbols' }, '-', { cmd: 'lib.toggle' }, { cmd: 'packs.manage' }, '-', { cmd: 'user.saveTpl' }, { cmd: 'user.saveSym' }] },
    { label: 'Objecte', items: [{ cmd: 'obj.edit' }, '-', { cmd: 'obj.group' }, { cmd: 'obj.ungroup' }, { cmd: 'obj.toPath' }, '-', { label: 'Imatge', sub: [{ cmd: 'obj.crop' }, { cmd: 'obj.resetCrop' }, { cmd: 'obj.imageNatural' }, { cmd: 'obj.replaceImage' }] }, '-', { label: 'Transforma', sub: [{ cmd: 'obj.rotR' }, { cmd: 'obj.rotL' }, '-', { cmd: 'obj.flipH' }, { cmd: 'obj.flipV' }] }, '-', { cmd: 'obj.lock' }, { cmd: 'obj.unlockAll' }, { cmd: 'obj.hide' }, { cmd: 'obj.showAll' }, { cmd: 'obj.rename' }] },
    { label: 'Organitza', items: () => [{ cmd: 'arr.front' }, { cmd: 'arr.forward' }, { cmd: 'arr.backward' }, { cmd: 'arr.back' }, '-', { label: 'Alinea', sub: [{ cmd: 'align.left' }, { cmd: 'align.hcenter' }, { cmd: 'align.right' }, '-', { cmd: 'align.top' }, { cmd: 'align.vcenter' }, { cmd: 'align.bottom' }] }, { label: 'Distribueix', sub: [{ cmd: 'align.distH' }, { cmd: 'align.distV' }] }, '-', { label: 'Mou a la pàgina', sub: movePageItems() }] },
    { label: 'Pàgina', items: () => GL.pageMenu() },
    { label: 'Ajuda', items: [{ cmd: 'help.keys' }, { cmd: 'help.palette' }, '-', { cmd: 'help.about' }] },
  ];
}
function movePageItems() {
  if (!App.store.doc) return [];
  const pages = App.store.pagesSorted();
  return pages.map((p, i) => ({ label: `${i + 1}. ${p.name}`, disabled: !hasSel() || p.id === App.pageId, run: () => { tx('Mou a la pàgina', () => moveToPage(App.sel, p.id, false)); UI.toast('Mogut a «' + p.name + '»'); } }));
}
GL.pageMenu = () => [{ cmd: 'page.add' }, { cmd: 'page.dup' }, { cmd: 'page.rename' }, { cmd: 'page.del' }, '-', { cmd: 'page.prev' }, { cmd: 'page.next' }, { cmd: 'page.up' }, { cmd: 'page.down' }, '-', { cmd: 'page.fitContent' }, { cmd: 'page.size' }];
GL.contextMenu = function () {
  const objs = App.objs();
  if (!objs.length) return [{ cmd: 'edit.paste' }, { cmd: 'edit.pasteInPlace' }, '-', { cmd: 'edit.selectAll' }, '-', { cmd: 'page.add' }, { cmd: 'page.size' }, '-', { cmd: 'view.fit' }, { cmd: 'view.grid' }, { cmd: 'view.rulers' }];
  const one = objs.length === 1 ? objs[0] : null;
  return [
    one && ['text', 'path', 'image', 'group'].includes(one.type) ? { cmd: 'obj.edit', label: { text: 'Edita el text', path: 'Edita els nodes', image: 'Retalla la imatge', group: 'Entra al grup' }[one.type] } : null,
    { cmd: 'edit.cut' }, { cmd: 'edit.copy' }, { cmd: 'edit.paste' }, { cmd: 'edit.duplicate' }, { cmd: 'edit.delete' }, '-',
    { cmd: 'arr.front' }, { cmd: 'arr.forward' }, { cmd: 'arr.backward' }, { cmd: 'arr.back' }, '-',
    { cmd: 'obj.group' }, objs.some(o => o.type === 'group') ? { cmd: 'obj.ungroup' } : null, { cmd: 'obj.toPath' }, '-',
    { cmd: 'edit.copyStyle' }, { cmd: 'edit.pasteStyle' }, '-',
    { label: 'Mou a la pàgina', sub: movePageItems() },
    { cmd: 'obj.flipH' }, { cmd: 'obj.flipV' }, '-', { cmd: 'obj.lock' }, { cmd: 'obj.hide' }, one ? { cmd: 'obj.rename' } : null,
  ];
};

/* ── teclat ── */
const Keys = {
  init() {
    window.addEventListener('keydown', e => this.down(e), true);
    window.addEventListener('keyup', e => this.up(e), true);
  },
  down(e) {
    if (UI.menuKey(e)) { e.preventDefault(); return; }
    const t = e.target;
    const inField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if ($('.veil')) return; // diàlegs: gestionen el seu teclat
    if (inField) return;
    if (!App.store.doc) { const k = eventKey(e); if (k === 'Ctrl+O') { e.preventDefault(); Cmd.run('file.open'); } return; }
    // espai: mà temporal
    if (e.code === 'Space' && !e.repeat) { e.preventDefault(); if (!Pointer.spaceDown) { Pointer.spaceDown = true; Pointer.cursor(); } return; }
    if (e.code === 'Space') { e.preventDefault(); return; }
    // modes d'edició
    const m = App.mode;
    if (m && GL.tools[m.type] && GL.tools[m.type].key && GL.tools[m.type].key(e)) { e.preventDefault(); return; }
    const k = eventKey(e);
    if (!k) return;
    // fletxes
    if (/^(Shift\+|Alt\+|Alt\+Shift\+)?(Up|Down|Left|Right)$/.test(k) && App.sel.length) {
      e.preventDefault();
      const big = e.shiftKey ? 10 : 1, small = e.altKey ? 0.1 : 1;
      const u = App.store.props.unit;
      const step = (u === 'px' ? 1 : fromU(1, u === 'mm' ? 'mm' : u === 'cm' ? 'mm' : u)) * big * small;
      const dir = k.split('+').pop();
      nudge(dir === 'Left' ? -step : dir === 'Right' ? step : 0, dir === 'Up' ? -step : dir === 'Down' ? step : 0);
      return;
    }
    if (k === 'Esc') {
      e.preventDefault();
      if (App.mode) { App.exitMode(); return; }
      if (App.tool !== 'select') { setTool('select'); return; }
      if (App.scope) { const g = App.scope; App.scope = null; App.select([g]); return; }
      if ($('#app').classList.contains('focus-mode')) { Cmd.run('view.focus'); return; }
      App.clearSel(); return;
    }
    const id = Cmd.byKey(k);
    if (id) {
      e.preventDefault();
      Cmd.run(id);
      return;
    }
  },
  up(e) {
    if (e.code === 'Space') { Pointer.spaceDown = false; Pointer.cursor(); }
  },
};
GL.keys = Keys;
