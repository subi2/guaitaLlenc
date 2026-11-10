/* ── Geometria ───────────────────────────────────────────────── */
// Matrius afins [a,b,c,d,e,f]: x' = a x + c y + e ; y' = b x + d y + f
const Mx = {
  id: () => [1, 0, 0, 1, 0, 0],
  tr: (x, y) => [1, 0, 0, 1, x, y],
  sc: (x, y = x) => [x, 0, 0, y, 0, 0],
  rot: r => { const c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, 0, 0]; },
  mul(m, n) { // m·n (aplica n primer)
    return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  },
  chain(...ms) { return ms.reduce((a, b) => Mx.mul(a, b)); },
  ap(m, p) { return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] }; },
  apv(m, p) { return { x: m[0] * p.x + m[2] * p.y, y: m[1] * p.x + m[3] * p.y }; },
  inv(m) {
    const d = m[0] * m[3] - m[1] * m[2] || 1e-12;
    return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d];
  },
  det: m => m[0] * m[3] - m[1] * m[2],
  str: m => `matrix(${m.map(v => rnd(v, 6)).join(' ')})`,
};
const pt = (x, y) => ({ x, y });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rotPt = (p, c, r) => { const s = Math.sin(r), k = Math.cos(r), dx = p.x - c.x, dy = p.y - c.y; return { x: c.x + dx * k - dy * s, y: c.y + dx * s + dy * k }; };
const normAng = a => { a = a % 360; if (a > 180) a -= 360; if (a <= -180) a += 360; return a; };

function rectUnion(rs) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rs) { if (!r) continue; x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
  return isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}
function rectOfPts(ps) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of ps) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
const rectsHit = (a, b) => a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
const rectHas = (r, p) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/* ── marcs d'objecte ── */
const G = {};
G.isBoxed = o => o.type !== 'line' && o.type !== 'group';
// matriu local→pàgina (incloent reflexions)
G.matrix = o => Mx.chain(Mx.tr(o.x + o.w / 2, o.y + o.h / 2), Mx.rot((o.rot || 0) * DEG), Mx.sc(o.fx || 1, o.fy || 1), Mx.tr(-o.w / 2, -o.h / 2));
// marc de manipulació (sense reflexions): local (0..w,0..h) → pàgina
G.frameM = o => Mx.chain(Mx.tr(o.x + o.w / 2, o.y + o.h / 2), Mx.rot((o.rot || 0) * DEG), Mx.tr(-o.w / 2, -o.h / 2));
G.center = o => ({ x: o.x + o.w / 2, y: o.y + o.h / 2 });
G.corners = o => { const m = G.frameM(o); return [pt(0, 0), pt(o.w, 0), pt(o.w, o.h), pt(0, o.h)].map(p => Mx.ap(m, p)); };

// AABB en coordenades de pàgina
G.aabb = function (o, store) {
  store = store || GL.store;
  if (o.type === 'line') return rectOfPts([o.p1, o.p2]);
  if (o.type === 'group') {
    const kids = store.children(o.id).filter(c => c.visible !== false);
    return rectUnion(kids.map(c => G.aabb(c, store))) || { x: 0, y: 0, w: 0, h: 0 };
  }
  if (!o.rot) return { x: o.x, y: o.y, w: o.w, h: o.h };
  return rectOfPts(G.corners(o));
};
G.selBox = (ids, store) => { store = store || GL.store; return rectUnion(ids.map(id => store.obj(id)).filter(Boolean).map(o => G.aabb(o, store))); };

// Escala/deforma un objecte amb una transformació afí de pàgina T (retorna pegats per id)
G.transformObj = function (o, T, out, store, scaleText) {
  store = store || GL.store; out = out || {};
  if (o.type === 'line') {
    out[o.id] = { p1: Mx.ap(T, o.p1), p2: Mx.ap(T, o.p2) };
    return out;
  }
  if (o.type === 'group') {
    for (const c of store.children(o.id)) G.transformObj(c, T, out, store, scaleText);
    return out;
  }
  const L = [T[0], T[1], T[2], T[3], 0, 0];
  const r = (o.rot || 0) * DEG;
  const u = Mx.apv(L, pt(Math.cos(r), Math.sin(r)));
  const v = Mx.apv(L, pt(-Math.sin(r), Math.cos(r)));
  const lu = Math.hypot(u.x, u.y), lv = Math.hypot(v.x, v.y);
  const c = Mx.ap(T, G.center(o));
  let w = Math.max(o.w * lu, 0.01), h = Math.max(o.h * lv, 0.01);
  let rot = Math.atan2(u.y, u.x) / DEG;
  const perp = pt(-u.y / lu, u.x / lu);
  const s = Math.sign(v.x * perp.x + v.y * perp.y) || 1;
  let fx = o.fx || 1, fy = (o.fy || 1) * s;
  const p = { x: c.x - w / 2, y: c.y - h / 2, w, h, rot: rnd(normAng(rot), 4), fx, fy };
  if (o.type === 'text') {
    const k = Math.sqrt(Math.abs(Mx.det(L)));
    if (scaleText && Math.abs(lu - lv) < 1e-3 * Math.max(lu, lv)) p.fs = Math.max(1, rnd(o.fs * k, 2));
    if (o.auto === 'w' && Math.abs(lu - 1) > 1e-6 && !(scaleText && Math.abs(lu - lv) < 1e-3)) p.auto = 'h';
  }
  out[o.id] = p;
  return out;
};
G.rotateObj = function (o, c, ang, out, store) {
  store = store || GL.store; out = out || {};
  const r = ang * DEG;
  if (o.type === 'line') { out[o.id] = { p1: rotPt(o.p1, c, r), p2: rotPt(o.p2, c, r) }; return out; }
  if (o.type === 'group') { for (const k of store.children(o.id)) G.rotateObj(k, c, ang, out, store); return out; }
  const nc = rotPt(G.center(o), c, r);
  out[o.id] = { x: nc.x - o.w / 2, y: nc.y - o.h / 2, rot: rnd(normAng((o.rot || 0) + ang), 4) };
  return out;
};
G.translateObj = function (o, dx, dy, out, store) {
  store = store || GL.store; out = out || {};
  if (o.type === 'line') out[o.id] = { p1: pt(o.p1.x + dx, o.p1.y + dy), p2: pt(o.p2.x + dx, o.p2.y + dy) };
  else if (o.type === 'group') for (const k of store.children(o.id)) G.translateObj(k, dx, dy, out, store);
  else out[o.id] = { x: o.x + dx, y: o.y + dy };
  return out;
};

/* ── formes paramètriques ── */
G.polyPts = function (n, w, h, star, ratio) {
  n = Math.max(3, n | 0);
  const pts = [], cx = w / 2, cy = h / 2;
  const cnt = star ? n * 2 : n;
  for (let i = 0; i < cnt; i++) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / cnt;
    const k = star && i % 2 ? ratio : 1;
    pts.push(pt(cx + Math.cos(a) * cx * k, cy + Math.sin(a) * cy * k));
  }
  // la forma omple exactament la seva caixa
  const b = rectOfPts(pts);
  const sx = w / (b.w || 1), sy = h / (b.h || 1);
  return pts.map(p => pt((p.x - b.x) * sx, (p.y - b.y) * sy));
};
G.radii = function (o) {
  const r = Array.isArray(o.r) ? o.r : [o.r || 0, o.r || 0, o.r || 0, o.r || 0];
  const m = Math.min(o.w, o.h) / 2;
  return r.map(v => clamp(v || 0, 0, m));
};
const KAPPA = 0.5522847498;
G.rrectNodes = function (w, h, r) {
  const [tl, tr, br, bl] = r, k = 1 - KAPPA, n = [];
  const N = (x, y, i, o) => n.push({ x, y, i: i || null, o: o || null, s: 0 });
  if (tl) { N(0, tl, null, pt(0, tl * k)); N(tl, 0, pt(tl * k, 0)); } else N(0, 0);
  if (tr) { N(w - tr, 0, null, pt(w - tr * k, 0)); N(w, tr, pt(w, tr * k)); } else N(w, 0);
  if (br) { N(w, h - br, null, pt(w, h - br * k)); N(w - br, h, pt(w - br * k, h)); } else N(w, h);
  if (bl) { N(bl, h, null, pt(bl * k, h)); N(0, h - bl, pt(0, h - bl * k)); } else N(0, h);
  return [{ n, c: true }];
};
G.ellipseNodes = function (w, h) {
  const rx = w / 2, ry = h / 2, kx = rx * KAPPA, ky = ry * KAPPA;
  return [{
    c: true, n: [
      { x: rx, y: 0, i: pt(rx - kx, 0), o: pt(rx + kx, 0), s: 2 },
      { x: w, y: ry, i: pt(w, ry - ky), o: pt(w, ry + ky), s: 2 },
      { x: rx, y: h, i: pt(rx + kx, h), o: pt(rx - kx, h), s: 2 },
      { x: 0, y: ry, i: pt(0, ry + ky), o: pt(0, ry - ky), s: 2 },
    ]
  }];
};

/* ── trajectes ──
   subtrajecte: { c: tancat, n: [ { x, y, i:{x,y}|null, o:{x,y}|null, s } ] }
   i = nansa d'entrada, o = nansa de sortida (absolutes, en coordenades locals naturals) */
G.mapSP = (sp, f) => sp.map(s => ({ c: s.c, n: s.n.map(n => ({ x: f(n).x, y: f(n).y, i: n.i ? f(n.i) : null, o: n.o ? f(n.o) : null, s: n.s || 0 })) }));
G.pathD = function (sp, sx = 1, sy = 1) {
  const f = (p) => rnd(p.x * sx, 3) + ' ' + rnd(p.y * sy, 3);
  let d = '';
  for (const s of sp) {
    const n = s.n;
    if (!n.length) continue;
    d += 'M' + f(n[0]);
    const seg = (a, b) => (a.o || b.i) ? 'C' + f(a.o || a) + ' ' + f(b.i || b) + ' ' + f(b) : 'L' + f(b);
    for (let k = 1; k < n.length; k++) d += seg(n[k - 1], n[k]);
    if (s.c && n.length > 1) { if (n[n.length - 1].o || n[0].i) d += seg(n[n.length - 1], n[0]); d += 'Z'; }
  }
  return d;
};
// segments [p0,p1,p2,p3]
G.segments = function (sp) {
  const out = [];
  sp.forEach((s, si) => {
    const n = s.n;
    const cnt = s.c ? n.length : n.length - 1;
    for (let k = 0; k < cnt; k++) {
      const a = n[k], b = n[(k + 1) % n.length];
      out.push({ si, k, p: [pt(a.x, a.y), a.o ? pt(a.o.x, a.o.y) : pt(a.x, a.y), b.i ? pt(b.i.x, b.i.y) : pt(b.x, b.y), pt(b.x, b.y)], line: !a.o && !b.i });
    }
  });
  return out;
};
function bez(p, t) {
  const u = 1 - t;
  return pt(u * u * u * p[0].x + 3 * u * u * t * p[1].x + 3 * u * t * t * p[2].x + t * t * t * p[3].x,
    u * u * u * p[0].y + 3 * u * u * t * p[1].y + 3 * u * t * t * p[2].y + t * t * t * p[3].y);
}
function bezExtrema(a, b, c, d) { // arrels de la derivada en un eix
  const A = -a + 3 * b - 3 * c + d, B = 2 * (a - 2 * b + c), C = b - a;
  const ts = [];
  if (Math.abs(A) < 1e-12) { if (Math.abs(B) > 1e-12) ts.push(-C / B); }
  else { const D = B * B - 4 * A * C; if (D >= 0) { const s = Math.sqrt(D); ts.push((-B + s) / (2 * A), (-B - s) / (2 * A)); } }
  return ts.filter(t => t > 0 && t < 1);
}
G.spBBox = function (sp) {
  const pts = [];
  for (const s of sp) for (const n of s.n) pts.push(pt(n.x, n.y));
  for (const sg of G.segments(sp)) {
    if (sg.line) continue;
    const p = sg.p;
    for (const t of bezExtrema(p[0].x, p[1].x, p[2].x, p[3].x).concat(bezExtrema(p[0].y, p[1].y, p[2].y, p[3].y))) pts.push(bez(p, t));
  }
  return pts.length ? rectOfPts(pts) : { x: 0, y: 0, w: 0, h: 0 };
};
// nodes del trajecte en coordenades de pàgina
G.pageSP = function (o) {
  const sx = o.nw ? o.w / o.nw : 1, sy = o.nh ? o.h / o.nh : 1;
  const m = Mx.mul(G.matrix(o), Mx.sc(sx, sy));
  return G.mapSP(o.sp, p => Mx.ap(m, p));
};
// pegat de propietats per a un trajecte donat en coordenades de pàgina (conserva rotació i reflexió)
G.pathFromPage = function (spPage, rot = 0, fx = 1, fy = 1) {
  const RF = Mx.mul(Mx.rot(rot * DEG), Mx.sc(fx, fy));
  const IRF = Mx.inv(RF);
  const spU = G.mapSP(spPage, p => Mx.apv(IRF, p));
  const b = G.spBBox(spU);
  const w = b.w, h = b.h;
  const cU = pt(b.x + w / 2, b.y + h / 2);
  const C = Mx.apv(RF, cU);
  const sp = G.mapSP(spU, p => pt(rnd(p.x - b.x, 4), rnd(p.y - b.y, 4)));
  return { x: C.x - w / 2, y: C.y - h / 2, w: Math.max(w, 0), h: Math.max(h, 0), nw: w, nh: h, sp, rot, fx, fy };
};
// converteix una forma a trajecte (pegat complet)
G.toPath = function (o) {
  let sp;
  if (o.type === 'path') return null;
  if (o.type === 'rect' || o.type === 'image') {
    const r = G.radii(o);
    sp = r.some(v => v > 0) ? G.rrectNodes(o.w, o.h, r) : [{ c: true, n: [pt(0, 0), pt(o.w, 0), pt(o.w, o.h), pt(0, o.h)].map(p => ({ x: p.x, y: p.y, i: null, o: null, s: 0 })) }];
  } else if (o.type === 'ellipse') sp = G.ellipseNodes(o.w, o.h);
  else if (o.type === 'polygon' || o.type === 'star') {
    sp = [{ c: true, n: G.polyPts(o.n || 5, o.w, o.h, o.type === 'star', o.ratio || 0.5).map(p => ({ x: p.x, y: p.y, i: null, o: null, s: 0 })) }];
  } else if (o.type === 'line') {
    const p = G.pathFromPage([{ c: false, n: [{ x: o.p1.x, y: o.p1.y, i: null, o: null, s: 0 }, { x: o.p2.x, y: o.p2.y, i: null, o: null, s: 0 }] }]);
    return Object.assign(p, { type: 'path', fill: { t: 'none', c: '#000000ff' } });
  } else return null;
  return { type: 'path', sp, nw: o.w, nh: o.h, fr: 'nonzero' };
};

/* proximitat al trajecte (per inserir nodes) */
G.nearestOnSP = function (sp, p) {
  let best = null;
  for (const sg of G.segments(sp)) {
    let bt = 0, bd = Infinity;
    const N = 32;
    for (let i = 0; i <= N; i++) { const t = i / N, q = bez(sg.p, t), d = dist(q, p); if (d < bd) { bd = d; bt = t; } }
    let lo = Math.max(0, bt - 1 / N), hi = Math.min(1, bt + 1 / N);
    for (let k = 0; k < 18; k++) {
      const t1 = lo + (hi - lo) / 3, t2 = hi - (hi - lo) / 3;
      if (dist(bez(sg.p, t1), p) < dist(bez(sg.p, t2), p)) hi = t2; else lo = t1;
    }
    const t = (lo + hi) / 2, d = dist(bez(sg.p, t), p);
    if (!best || d < best.d) best = { si: sg.si, k: sg.k, t, d, pt: bez(sg.p, t) };
  }
  return best;
};
G.splitAt = function (sp, si, k, t) {
  const s = sp[si], n = s.n, a = n[k], b = n[(k + 1) % n.length];
  const p0 = pt(a.x, a.y), p1 = a.o ? a.o : pt(a.x, a.y), p2 = b.i ? b.i : pt(b.x, b.y), p3 = pt(b.x, b.y);
  const L = (u, v) => pt(lerp(u.x, v.x, t), lerp(u.y, v.y, t));
  const line = !a.o && !b.i;
  const p01 = L(p0, p1), p12 = L(p1, p2), p23 = L(p2, p3), p012 = L(p01, p12), p123 = L(p12, p23), m = L(p012, p123);
  const nn = line ? { x: m.x, y: m.y, i: null, o: null, s: 0 } : { x: m.x, y: m.y, i: p012, o: p123, s: 1 };
  if (!line) { a.o = p01; b.i = p23; }
  n.splice(k + 1, 0, nn);
  return k + 1;
};

/* ── puntes de fletxa ── */
G.ARROWS = { none: 'Cap', tri: 'Triangle', open: 'Oberta', circle: 'Cercle', square: 'Quadrat', bar: 'Barra' };
G.arrowSize = sw => Math.max(6, sw * 3 + 4);
// retorna {d, fill:bool, inset}
G.arrowShape = function (type, tip, dir, sw) {
  const L = G.arrowSize(sw);
  const ux = Math.cos(dir), uy = Math.sin(dir), px = -uy, py = ux;
  const P = (a, b) => pt(tip.x + ux * a + px * b, tip.y + uy * a + py * b);
  const f = q => rnd(q.x, 3) + ' ' + rnd(q.y, 3);
  if (type === 'tri') { const a = P(0, 0), b = P(-L, L * 0.55), c = P(-L, -L * 0.55); return { d: `M${f(a)}L${f(b)}L${f(c)}Z`, fill: true, inset: L * 0.85 }; }
  if (type === 'open') { const a = P(-L * 0.85, L * 0.6), b = P(0, 0), c = P(-L * 0.85, -L * 0.6); return { d: `M${f(a)}L${f(b)}L${f(c)}`, fill: false, inset: sw * 0.5 }; }
  if (type === 'circle') { const r = L * 0.42, c = P(-r, 0); return { d: `M${f(pt(c.x - r, c.y))}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`, fill: true, inset: r }; }
  if (type === 'square') { const s = L * 0.38; const a = P(0, s), b = P(0, -s), c = P(-2 * s, -s), d = P(-2 * s, s); return { d: `M${f(a)}L${f(b)}L${f(c)}L${f(d)}Z`, fill: true, inset: s }; }
  if (type === 'bar') { const a = P(0, L * 0.55), b = P(0, -L * 0.55); return { d: `M${f(a)}L${f(b)}`, fill: false, inset: 0 }; }
  return null;
};

/* ── analitzador de 'd' SVG → subtrajectes cúbics absoluts ── */
G.parseD = function (d) {
  const toks = String(d).match(/[a-df-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || [];
  let i = 0, cmd = null;
  const sp = [];
  let cur = null, x = 0, y = 0, sx = 0, sy = 0, lc = null, lq = null, prev = '';
  const isCmd = t => /^[a-z]$/i.test(t);
  const num = () => parseFloat(toks[i++]);
  const flag = () => { // els indicadors d'arc poden anar enganxats ("01")
    const t = toks[i];
    if (t.length > 1 && /^[01]/.test(t)) { toks[i] = t.slice(1); return +t[0]; }
    i++; return +t;
  };
  const start = (px, py) => { cur = { c: false, n: [{ x: px, y: py, i: null, o: null, s: 0 }] }; sp.push(cur); };
  const last = () => cur.n[cur.n.length - 1];
  const lineTo = (px, py) => { if (!cur) start(x, y); cur.n.push({ x: px, y: py, i: null, o: null, s: 0 }); };
  const cubic = (x1, y1, x2, y2, px, py) => { if (!cur) start(x, y); last().o = pt(x1, y1); cur.n.push({ x: px, y: py, i: pt(x2, y2), o: null, s: 0 }); };
  while (i < toks.length) {
    if (isCmd(toks[i])) cmd = toks[i++];
    else if (!cmd) { i++; continue; }
    const rel = cmd === cmd.toLowerCase() && cmd !== 'z' && cmd !== 'Z' ? 1 : 0;
    const C = cmd.toUpperCase();
    try {
      if (C === 'M') {
        let nx = num(), ny = num(); if (rel) { nx += x; ny += y; }
        x = sx = nx; y = sy = ny; start(x, y); cmd = rel ? 'l' : 'L'; lc = lq = null;
      } else if (C === 'L') { let nx = num(), ny = num(); if (rel) { nx += x; ny += y; } lineTo(nx, ny); x = nx; y = ny; lc = lq = null; }
      else if (C === 'H') { let nx = num(); if (rel) nx += x; lineTo(nx, y); x = nx; lc = lq = null; }
      else if (C === 'V') { let ny = num(); if (rel) ny += y; lineTo(x, ny); y = ny; lc = lq = null; }
      else if (C === 'C') {
        let a = num(), b = num(), c = num(), e = num(), f = num(), g = num();
        if (rel) { a += x; b += y; c += x; e += y; f += x; g += y; }
        cubic(a, b, c, e, f, g); lc = pt(c, e); lq = null; x = f; y = g;
      } else if (C === 'S') {
        let c = num(), e = num(), f = num(), g = num();
        if (rel) { c += x; e += y; f += x; g += y; }
        const r = lc && /[CS]/i.test(prev) ? pt(2 * x - lc.x, 2 * y - lc.y) : pt(x, y);
        cubic(r.x, r.y, c, e, f, g); lc = pt(c, e); lq = null; x = f; y = g;
      } else if (C === 'Q' || C === 'T') {
        let qx, qy;
        if (C === 'Q') { qx = num(); qy = num(); if (rel) { qx += x; qy += y; } }
        else { const r = lq && /[QT]/i.test(prev) ? pt(2 * x - lq.x, 2 * y - lq.y) : pt(x, y); qx = r.x; qy = r.y; }
        let f = num(), g = num(); if (rel) { f += x; g += y; }
        cubic(x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y), f + 2 / 3 * (qx - f), g + 2 / 3 * (qy - g), f, g);
        lq = pt(qx, qy); lc = null; x = f; y = g;
      } else if (C === 'A') {
        const rx = num(), ry = num(), ph = num(), la = flag(), sw = flag();
        let f = num(), g = num(); if (rel) { f += x; g += y; }
        for (const c of arcToCubic(x, y, f, g, rx, ry, ph, la, sw)) cubic(c[0], c[1], c[2], c[3], c[4], c[5]);
        x = f; y = g; lc = lq = null;
      } else if (C === 'Z') {
        if (cur) {
          cur.c = true;
          const n = cur.n, a = n[0], b = n[n.length - 1];
          if (n.length > 1 && Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6) { a.i = b.i; n.pop(); }
        }
        x = sx; y = sy; cur = null; lc = lq = null;
        cmd = null;
      } else { i++; }
    } catch (e) { break; }
    prev = C;
    if (toks[i] !== undefined && !isCmd(toks[i]) && C === 'Z') i++;
  }
  return sp.filter(s => s.n.length > 0 && s.n.every(n => isFinite(n.x) && isFinite(n.y)));
};
function arcToCubic(x1, y1, x2, y2, rx, ry, phi, fa, fs) {
  if (rx === 0 || ry === 0) return [[x1, y1, x2, y2, x2, y2]];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const ph = phi * DEG, cp = Math.cos(ph), sp = Math.sin(ph);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
  let lam = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
  if (lam > 1) { lam = Math.sqrt(lam); rx *= lam; ry *= lam; }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let k = Math.sqrt(Math.max(0, num / den)); if (fa === fs) k = -k;
  const cxp = k * rx * y1p / ry, cyp = -k * ry * x1p / rx;
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
  let t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dt > 0) dt -= 2 * Math.PI; else if (fs && dt < 0) dt += 2 * Math.PI;
  const segs = Math.ceil(Math.abs(dt) / (Math.PI / 2));
  const d = dt / segs, out = [];
  const kk = 4 / 3 * Math.tan(d / 4);
  const P = (t) => pt(cx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp, cy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp);
  const D = (t) => pt(-rx * Math.sin(t) * cp - ry * Math.cos(t) * sp, -rx * Math.sin(t) * sp + ry * Math.cos(t) * cp);
  for (let s = 0; s < segs; s++) {
    const a = t1 + s * d, b = a + d;
    const pa = P(a), pb = P(b), da = D(a), db = D(b);
    out.push([pa.x + kk * da.x, pa.y + kk * da.y, pb.x - kk * db.x, pb.y - kk * db.y, pb.x, pb.y]);
  }
  return out;
}

GL.Mx = Mx; GL.G = G;
