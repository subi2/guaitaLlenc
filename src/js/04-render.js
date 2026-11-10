/* ── Generació SVG (compartida entre llenç i exportació) ──────── */
const R = {};
const n3 = v => rnd(v, 3);

const DASHES = { solid: 'Contínua', dash: 'Discontínua', dot: 'Puntejada', dashdot: 'Ratlla i punt' };
const BLENDS = { normal: 'Normal', multiply: 'Multiplica', screen: 'Trama', overlay: 'Superposa', darken: 'Enfosqueix', lighten: 'Aclareix', 'color-dodge': 'Sobreexposa', 'color-burn': 'Subexposa', 'hard-light': 'Llum forta', 'soft-light': 'Llum suau', difference: 'Diferència', exclusion: 'Exclusió', hue: 'To', saturation: 'Saturació', color: 'Color', luminosity: 'Lluminositat' };

R.curDoc = null;
R.doc = () => R.curDoc || (GL.store && GL.store.doc);
R.resolve = function (p) {
  if (p && p.ref) { const d = R.doc(); const nc = d && d.props.colors && d.props.colors.find(x => x.id === p.ref); if (nc) return nc.c; }
  return p ? p.c : '#000000ff';
};
R.paint = function (p, kind, gid, defs, lineUS) {
  if (!p || p.t === 'none') return `${kind}="none"`;
  if (p.t === 'solid') {
    const c = R.resolve(p);
    const a = alphaOf(c);
    return `${kind}="${hex6(c)}"` + (a < 1 ? ` ${kind}-opacity="${n3(a)}"` : '');
  }
  const stops = (p.s && p.s.length ? p.s : [{ o: 0, c: '#000000ff' }, { o: 1, c: '#ffffffff' }]).slice().sort((a, b) => a.o - b.o)
    .map(s => { const a = alphaOf(s.c); return `<stop offset="${n3(s.o)}" stop-color="${hex6(s.c)}"${a < 1 ? ` stop-opacity="${n3(a)}"` : ''}/>`; }).join('');
  if (p.t === 'linear') {
    const a = (p.a || 0) * DEG, c = Math.cos(a) / 2, s = Math.sin(a) / 2;
    if (lineUS) {
      const { p1, p2 } = lineUS;
      defs.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${n3(p1.x)}" y1="${n3(p1.y)}" x2="${n3(p2.x)}" y2="${n3(p2.y)}">${stops}</linearGradient>`);
    } else defs.push(`<linearGradient id="${gid}" x1="${n3(.5 - c)}" y1="${n3(.5 - s)}" x2="${n3(.5 + c)}" y2="${n3(.5 + s)}">${stops}</linearGradient>`);
  } else {
    defs.push(`<radialGradient id="${gid}" cx="${n3(p.cx == null ? .5 : p.cx)}" cy="${n3(p.cy == null ? .5 : p.cy)}" r="${n3(p.r || .5)}">${stops}</radialGradient>`);
  }
  return `${kind}="url(#${gid})"`;
};
R.dash = function (o) {
  const sw = o.sw || 1;
  if (!o.dash || o.dash === 'solid') return '';
  if (o.dash === 'dash') return ` stroke-dasharray="${n3(sw * 3)} ${n3(sw * 2)}"`;
  if (o.dash === 'dot') return ` stroke-dasharray="0.001 ${n3(sw * 2)}"`;
  if (o.dash === 'dashdot') return ` stroke-dasharray="${n3(sw * 4)} ${n3(sw * 2)} 0.001 ${n3(sw * 2)}"`;
  if (/^[\d.\s,]+$/.test(o.dash)) return ` stroke-dasharray="${esc(o.dash)}"`;
  return '';
};
R.strokeAttrs = function (o, gid, defs, lineUS) {
  const s = o.stroke;
  if (!s || s.t === 'none' || !(o.sw > 0)) return ' stroke="none"';
  const cap = o.dash === 'dot' ? 'round' : (o.cap || 'butt');
  return ' ' + R.paint(s, 'stroke', gid, defs, lineUS) + ` stroke-width="${n3(o.sw)}"` +
    (cap !== 'butt' ? ` stroke-linecap="${cap}"` : '') + (o.join && o.join !== 'miter' ? ` stroke-linejoin="${o.join}"` : '') + R.dash(o);
};
R.hasStroke = o => o.stroke && o.stroke.t !== 'none' && o.sw > 0;

// filtre d'efectes (ombra + desenfocament de capa)
R.filter = function (o, fid) {
  const sh = o.shadow && o.shadow.on ? o.shadow : null;
  const bl = o.blur > 0 ? o.blur : 0;
  if (!sh && !bl) return '';
  let f = `<filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">`;
  let src = 'SourceGraphic';
  if (bl) { f += `<feGaussianBlur in="SourceGraphic" stdDeviation="${n3(bl / 2)}" result="b"/>`; src = 'b'; }
  if (sh) {
    const a = alphaOf(sh.c);
    f += `<feGaussianBlur in="${src === 'b' ? 'b' : 'SourceAlpha'}" stdDeviation="${n3((sh.b || 0) / 2)}" result="sb"/>` +
      `<feOffset in="sb" dx="${n3(sh.x || 0)}" dy="${n3(sh.y || 0)}" result="so"/>` +
      `<feFlood flood-color="${hex6(sh.c)}" flood-opacity="${n3(a)}"/><feComposite in2="so" operator="in" result="sc"/>` +
      `<feMerge><feMergeNode in="sc"/><feMergeNode in="${src}"/></feMerge>`;
  }
  return f + '</filter>';
};

// arrowheads per a una línia/obert: retorna {mk, p1, p2} amb els extrems escurçats
R.arrows = function (o, a, b, dirA, dirB, gid, defs) {
  let mk = '';
  const sw = o.sw || 1;
  const col = o.stroke && o.stroke.t !== 'none' ? o.stroke : null;
  if (!col || !(o.sw > 0)) return { mk, a, b };
  const paint = col.t === 'solid' ? col : { t: 'solid', c: (col.s && col.s[0] ? col.s[0].c : '#000000ff') };
  const draw = (type, tip, dir) => {
    const s = G.arrowShape(type, tip, dir, sw);
    if (!s) return 0;
    mk += s.fill ? `<path d="${s.d}" ${R.paint(paint, 'fill', '', [])} stroke="none"/>`
      : `<path d="${s.d}" fill="none" ${R.paint(paint, 'stroke', '', [])} stroke-width="${n3(sw)}" stroke-linecap="${o.cap || 'round'}" stroke-linejoin="round"/>`;
    return s.inset;
  };
  let ia = 0, ib = 0;
  if (o.as && o.as !== 'none') ia = draw(o.as, a, dirA);
  if (o.ae && o.ae !== 'none') ib = draw(o.ae, b, dirB);
  const sh = (p, dir, d) => pt(p.x - Math.cos(dir) * d, p.y - Math.sin(dir) * d);
  return { mk, a: ia ? sh(a, dirA, ia) : a, b: ib ? sh(b, dirB, ib) : b };
};

/* Contingut d'un objecte (coordenades locals; línies en coord. de pàgina)
   ctx: { exp: exportació, pre: prefix d'ids, assets } */
R.inner = function (o, ctx) {
  const pre = (ctx.pre || '') + o.id;
  const defs = [];
  let body = '';
  const hit = ctx.exp ? '' : ' class="hit" fill="none" stroke="transparent" stroke-width="10" vector-effect="non-scaling-stroke"';
  const F = () => R.paint(o.fill, 'fill', 'f-' + pre, defs);
  const S = (lineUS) => R.strokeAttrs(o, 's-' + pre, defs, lineUS);
  switch (o.type) {
    case 'rect': {
      const r = G.radii(o);
      let shape;
      if (r.every(v => v === r[0])) shape = `<rect width="${n3(o.w)}" height="${n3(o.h)}"${r[0] ? ` rx="${n3(r[0])}"` : ''}`;
      else shape = `<path d="${G.pathD(G.rrectNodes(o.w, o.h, r))}"`;
      body = `${shape} ${F()}${S()}/>`;
      if (!ctx.exp) body += `${shape}${hit}/>`;
      break;
    }
    case 'ellipse': {
      const shape = `<ellipse cx="${n3(o.w / 2)}" cy="${n3(o.h / 2)}" rx="${n3(o.w / 2)}" ry="${n3(o.h / 2)}"`;
      body = `${shape} ${F()}${S()}/>` + (ctx.exp ? '' : `${shape}${hit}/>`);
      break;
    }
    case 'polygon': case 'star': {
      const pts = G.polyPts(o.n || 5, o.w, o.h, o.type === 'star', o.ratio || 0.5).map(p => n3(p.x) + ',' + n3(p.y)).join(' ');
      body = `<polygon points="${pts}" ${F()}${S()}${o.join ? '' : ' stroke-linejoin="round"'}/>` + (ctx.exp ? '' : `<polygon points="${pts}"${hit}/>`);
      break;
    }
    case 'path': {
      const sx = o.nw ? o.w / o.nw : 1, sy = o.nh ? o.h / o.nh : 1;
      let sp = o.sp || [];
      let mk = '';
      const first = sp[0];
      if (first && !first.c && first.n.length > 1 && ((o.as && o.as !== 'none') || (o.ae && o.ae !== 'none'))) {
        // fletxes als extrems del primer subtrajecte obert
        const sc = G.mapSP([first], p => pt(p.x * sx, p.y * sy))[0];
        const n = sc.n, A = n[0], B = n[n.length - 1];
        const ca = A.o || n[1].i || n[1], cb = B.i || n[n.length - 2].o || n[n.length - 2];
        const dA = Math.atan2(A.y - ca.y, A.x - ca.x), dB = Math.atan2(B.y - cb.y, B.x - cb.x);
        const r = R.arrows(o, pt(A.x, A.y), pt(B.x, B.y), dA, dB, pre, defs);
        mk = r.mk;
        A.x = r.a.x; A.y = r.a.y; B.x = r.b.x; B.y = r.b.y;
        sp = [sc].concat(G.mapSP(sp.slice(1), p => pt(p.x * sx, p.y * sy)));
        const d = G.pathD(sp);
        body = `<path d="${d}" ${F()}${S()}${o.fr === 'evenodd' ? ' fill-rule="evenodd"' : ''}/>` + mk + (ctx.exp ? '' : `<path d="${d}"${hit}/>`);
        break;
      }
      const d = G.pathD(sp, sx, sy);
      body = `<path d="${d}" ${F()}${S()}${o.fr === 'evenodd' ? ' fill-rule="evenodd"' : ''}/>` + (ctx.exp ? '' : `<path d="${d}"${hit}/>`);
      break;
    }
    case 'line': {
      const dir = Math.atan2(o.p2.y - o.p1.y, o.p2.x - o.p1.x);
      const r = R.arrows(o, o.p1, o.p2, dir + Math.PI, dir, pre, defs);
      body = `<line x1="${n3(r.a.x)}" y1="${n3(r.a.y)}" x2="${n3(r.b.x)}" y2="${n3(r.b.y)}"${S({ p1: o.p1, p2: o.p2 })}/>` + r.mk;
      if (!ctx.exp) body += `<line x1="${n3(o.p1.x)}" y1="${n3(o.p1.y)}" x2="${n3(o.p2.x)}" y2="${n3(o.p2.y)}" class="hit" stroke="transparent" stroke-width="12" vector-effect="non-scaling-stroke"/>`;
      break;
    }
    case 'text': {
      const L = TextKit.layout(o);
      const anchor = o.ta === 'center' ? 'middle' : o.ta === 'right' ? 'end' : 'start';
      const ax = o.ta === 'center' ? o.w / 2 : o.ta === 'right' ? o.w : 0;
      const spans = L.lines.map((s, i) => `<tspan x="${n3(ax)}" y="${n3(L.base + i * L.lineH)}">${esc(s.replace(/ +$/, '')) || ' '}</tspan>`).join('');
      const fam = esc(FontKit.stack(o.ff || 'IBM Plex Sans')).replace(/&#39;/g, "'");
      body = `<text xml:space="preserve" font-family="${fam}" font-size="${n3(o.fs)}" font-weight="${o.fw || 400}"${o.fi ? ' font-style="italic"' : ''}${o.ls ? ` letter-spacing="${n3(o.ls * o.fs)}"` : ''}${o.deco && o.deco !== 'none' ? ` text-decoration="${o.deco}"` : ''} text-anchor="${anchor}" ${F()}${S()}${R.hasStroke(o) ? ' paint-order="stroke"' : ''}>${spans}</text>`;
      if (!ctx.exp) body = `<rect class="hit" width="${n3(o.w)}" height="${n3(o.h)}" fill="transparent"/>` + body;
      break;
    }
    case 'image': {
      const a = (ctx.assets || GL.store.doc.assets)[o.asset];
      const cr = o.crop || { x: 0, y: 0, w: a ? a.w : o.w, h: a ? a.h : o.h };
      const sx = o.w / (cr.w || 1), sy = o.h / (cr.h || 1);
      const r = G.radii(o);
      const cid = 'c-' + pre;
      const clip = r.every(v => v === r[0]) ? `<rect width="${n3(o.w)}" height="${n3(o.h)}"${r[0] ? ` rx="${n3(r[0])}"` : ''}/>` : `<path d="${G.pathD(G.rrectNodes(o.w, o.h, r))}"/>`;
      defs.push(`<clipPath id="${cid}">${clip}</clipPath>`);
      const tf = `matrix(${n3(sx)} 0 0 ${n3(sy)} ${n3(-cr.x * sx)} ${n3(-cr.y * sy)})`;
      let img;
      if (!a) img = `<rect width="${n3(o.w)}" height="${n3(o.h)}" fill="#e3e6e4"/>`;
      else if (ctx.exp) img = `<image width="${a.w}" height="${a.h}" preserveAspectRatio="none" transform="${tf}" href="data:${a.mime};base64,${a.data}"/>`;
      else img = `<use href="#as-${o.asset}" transform="${tf}"/>`;
      body = `<g clip-path="url(#${cid})">${img}</g>`;
      if (R.hasStroke(o)) body += clip.replace('/>', ` fill="none"${S()}/>`);
      if (!ctx.exp) body = `<rect class="hit" width="${n3(o.w)}" height="${n3(o.h)}" fill="transparent"/>` + body;
      break;
    }
  }
  return (defs.length ? `<defs>${defs.join('')}</defs>` : '') + body;
};
R.transform = o => (o.type === 'line' || o.type === 'group') ? '' : Mx.str(G.matrix(o));

/* SVG autònom d'una pàgina (exportació) */
R.pageSVG = function (pageId, opt = {}) {
  const st = opt.store || GL.store;
  const prevDoc = R.curDoc; R.curDoc = st.doc;
  try { return R._pageSVG(pageId, opt, st); } finally { R.curDoc = prevDoc; }
};
R._pageSVG = function (pageId, opt, st) {
  const page = st.page(pageId);
  const used = new Set();
  let n = 0;
  const pre = opt.pre || ('e' + (Date.now() % 1e6).toString(36) + '-');
  const walk = (parentId) => st.children(parentId).filter(o => o.visible !== false).map(o => {
    const fid = 'fx-' + pre + o.id;
    const flt = R.filter(o, fid);
    const attrs = (o.opacity < 1 ? ` opacity="${n3(o.opacity)}"` : '') + (flt ? ` filter="url(#${fid})"` : '') + (o.blend && o.blend !== 'normal' ? ` style="mix-blend-mode:${o.blend}"` : '');
    const label = ` data-name="${esc(o.name || '')}"`;
    n++;
    if (o.type === 'group') return `<g${attrs}${label}>${flt ? `<defs>${flt}</defs>` : ''}${walk(o.id)}</g>`;
    if (o.type === 'text') { const v = FontKit.nearest(o.ff, o.fw || 400, o.fi); if (v) used.add(v.f + '|' + v.w + '|' + v.s); }
    const tf = R.transform(o);
    const inner = R.inner(o, { exp: true, pre, assets: st.doc.assets });
    return `<g${attrs}${label}>${flt ? `<defs>${flt}</defs>` : ''}${tf ? `<g transform="${tf}">${inner}</g>` : inner}</g>`;
  }).join('');
  const content = walk(pageId);
  const unit = st.props.unit;
  const phys = unit !== 'px';
  const W = phys ? fmtLen(page.w, 'mm', 2).replace(',', '.') + 'mm' : n3(page.w);
  const H = phys ? fmtLen(page.h, 'mm', 2).replace(',', '.') + 'mm' : n3(page.h);
  const css = FontKit.faceCSS(used);
  const bg = opt.transparent ? '' : `<rect width="${n3(page.w)}" height="${n3(page.h)}" ${R.paint({ t: 'solid', c: page.bg || '#ffffffff' }, 'fill')}/>`;
  const meta = opt.meta || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${opt.pxSize ? n3(page.w * opt.pxSize) : W}" height="${opt.pxSize ? n3(page.h * opt.pxSize) : H}" viewBox="0 0 ${n3(page.w)} ${n3(page.h)}">` +
    `<title>${esc(page.name || '')}</title>${meta}${css ? `<style>${css}</style>` : ''}${bg}${content}</svg>`;
};

/* ── Renderitzador en viu ─────────────────────────────────────── */
class Renderer {
  constructor(store, svg) {
    this.store = store;
    this.svg = svg;
    this.vp = svg.querySelector('#vp');
    this.layer = svg.querySelector('#pagesLayer');
    this.defs = svg.querySelector('#assetDefs');
    this.els = new Map();     // id → element
    this.pageEls = new Map();
    this.assetEls = new Map();
    this.dirty = new Set();
    this.dirtyParents = new Set();
    this.full = true;
    this.editingText = null;
    this.layoutDirty = true;
    this.schedule = rafThrottle(() => this.flush());
    store.on(ch => this.onChange(ch));
  }
  onChange(ch) {
    if (ch.all) { this.full = true; }
    else {
      if (ch.objs) for (const id of ch.objs) this.dirty.add(id);
      if (ch.pages && ch.pages.size) this.layoutDirty = true;
      if (ch.structure) this.layoutDirty = true;
      if (ch.assets && ch.assets.size) this.assetsDirty = true;
      // canvis de colors, estils o camps del document: revisa tot (la clau evita refer-ho)
      if (ch.doc || (ch.pages && ch.pages.size)) for (const id in this.store.doc.objs) this.dirty.add(id);
    }
    this.schedule();
  }
  invalidateAll() { this.full = true; this.schedule(); }
  flush() {
    const st = this.store;
    if (!st.doc) return;
    if (this.full) {
      this.full = false;
      this.layer.textContent = ''; this.defs.textContent = '';
      this.els.clear(); this.pageEls.clear(); this.assetEls.clear();
      this.syncAssets();
      for (const p of st.pagesSorted()) this.ensurePage(p);
      for (const id in st.doc.objs) this.dirty.add(id);
      this.layoutDirty = true;
    }
    if (this.assetsDirty) { this.assetsDirty = false; this.syncAssets(); }
    // pàgines
    for (const [id, g] of this.pageEls) if (!st.page(id)) { g.remove(); this.pageEls.delete(id); }
    for (const p of st.pagesSorted()) this.ensurePage(p);
    // objectes
    const parents = this.dirtyParents;
    for (const id of this.dirty) {
      const o = st.obj(id);
      const cur = this.els.get(id);
      if (!o) { if (cur) { parents.add(cur.parentNode); cur.remove(); this.els.delete(id); } continue; }
      if (!st.page(o.page)) continue;
      const elx = this.ensureObj(o);
      const container = this.containerOf(o);
      if (container && elx.parentNode !== container) { container.append(elx); parents.add(container); }
      else if (elx.parentNode) parents.add(elx.parentNode);
      this.updateObj(o, elx);
    }
    this.dirty.clear();
    for (const c of parents) if (c && c.isConnected !== false) this.reorder(c);
    parents.clear();
    if (this.layoutDirty) { this.layoutDirty = false; GL.app && GL.app.layoutPages(); }
    GL.app && GL.app.afterRender();
  }
  syncAssets() {
    const as = this.store.doc.assets;
    for (const [id, e] of this.assetEls) if (!as[id]) { e.remove(); this.assetEls.delete(id); }
    for (const id in as) {
      if (this.assetEls.has(id)) continue;
      const a = as[id];
      const im = svgEl('image', { id: 'as-' + id, width: a.w, height: a.h, preserveAspectRatio: 'none' });
      im.setAttribute('href', `data:${a.mime};base64,${a.data}`);
      this.defs.append(im);
      this.assetEls.set(id, im);
    }
  }
  ensurePage(p) {
    let g = this.pageEls.get(p.id);
    if (!g) {
      g = svgEl('g', { class: 'pg', id: 'pg-' + p.id, 'data-page': p.id });
      g.innerHTML = `<rect class="pg-bg"/><clipPath id="pgc-${p.id}"><rect class="pg-clip"/></clipPath><g class="pc" id="pc-${p.id}" data-page="${p.id}"></g>`;
      this.layer.append(g);
      this.pageEls.set(p.id, g);
      g._bg = g.firstChild; g._clip = g.querySelector('.pg-clip'); g._pc = g.querySelector('.pc');
    }
    if (g._w !== p.w || g._h !== p.h) {
      g._w = p.w; g._h = p.h;
      for (const r of [g._bg, g._clip]) { r.setAttribute('width', p.w); r.setAttribute('height', p.h); }
    }
    if (g._fill !== p.bg) {
      g._fill = p.bg;
      g._bg.setAttribute('fill', hex6(p.bg)); g._bg.setAttribute('fill-opacity', alphaOf(p.bg));
    }
    return g;
  }
  containerOf(o) {
    if (o.parent === o.page) { const g = this.pageEls.get(o.page); return g ? g._pc : null; }
    const p = this.store.obj(o.parent);
    if (!p) return null;
    return this.ensureObj(p);
  }
  ensureObj(o) {
    let e = this.els.get(o.id);
    if (e && e._type !== o.type) { e.remove(); e = null; }
    if (!e) {
      e = svgEl('g', { id: 'o-' + o.id, 'data-id': o.id, class: 'obj' });
      e._type = o.type;
      if (o.type === 'group') { e._defs = svgEl('defs'); e.append(e._defs); }
      else { e._defs = svgEl('defs'); e._g = svgEl('g'); e.append(e._defs, e._g); }
      this.els.set(o.id, e);
      if (o.type === 'group') for (const c of this.store.children(o.id)) this.dirty.add(c.id);
    }
    return e;
  }
  updateObj(o, e) {
    const vis = o.visible !== false;
    e.style.display = vis ? '' : 'none';
    e.classList.toggle('locked', !!o.locked);
    e.classList.toggle('editing-text', this.editingText === o.id);
    if (o.opacity < 1) e.setAttribute('opacity', n3(o.opacity)); else e.removeAttribute('opacity');
    e.style.mixBlendMode = o.blend && o.blend !== 'normal' ? o.blend : '';
    const fid = 'fx-' + o.id;
    const flt = R.filter(o, fid);
    if (e._flt !== flt) { e._flt = flt; e._defs.innerHTML = flt; if (flt) e.setAttribute('filter', `url(#${fid})`); else e.removeAttribute('filter'); }
    if (o.type === 'group') return;
    const tf = R.transform(o);
    if (e._tf !== tf) { e._tf = tf; if (tf) e._g.setAttribute('transform', tf); else e._g.removeAttribute('transform'); }
    const key = innerKey(o);
    if (e._k !== key) { e._k = key; e._g.innerHTML = R.inner(o, {}); }
  }
  reorder(container) {
    const st = this.store;
    let pid = container.getAttribute('data-page') && container.classList.contains('pc') ? container.getAttribute('data-page') : container.getAttribute('data-id');
    if (!pid) return;
    const kids = st.children(pid);
    let ref = container.firstChild;
    if (ref && ref.tagName === 'defs') ref = ref.nextSibling;
    for (const k of kids) {
      const e = this.els.get(k.id);
      if (!e) continue;
      if (e !== ref) container.insertBefore(e, ref);
      else ref = ref.nextSibling;
    }
  }
  setEditingText(id) {
    const prev = this.editingText;
    this.editingText = id;
    for (const k of [prev, id]) { if (!k) continue; const e = this.els.get(k); if (e) e.classList.toggle('editing-text', this.editingText === k); }
  }
}
function innerKey(o) {
  // tot excepte la posició/rotació/efectes de capa
  const { x, y, rot, fx, fy, opacity, blend, shadow, blur, name, visible, locked, z, parent, page, ...rest } = o;
  let dep = '';
  if (o.fill && o.fill.ref) dep += R.resolve(o.fill);
  if (o.stroke && o.stroke.ref) dep += R.resolve(o.stroke);
  if (o.type === 'text' && o.text && o.text.includes('{')) dep += '|' + GL.lib.fieldText(o);
  return JSON.stringify(rest) + dep;
}

GL.R = R; GL.Renderer = Renderer;
GL.DASHES = DASHES; GL.BLENDS = BLENDS;
