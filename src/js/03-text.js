/* ── Tipografia i maquetació de text ────────────────────────── */
const EMBED_FAMILIES = ['IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono', 'IBM Plex Sans Condensed', 'Fredoka', 'Baloo 2', 'Inter', 'Montserrat'];
const SYS_FAMILIES = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Tahoma', 'Impact'];
const GENERIC = { 'IBM Plex Serif': 'serif', 'Georgia': 'serif', 'Times New Roman': 'serif', 'IBM Plex Mono': 'monospace', 'Courier New': 'monospace' };
const WEIGHTS = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };

const FontKit = {
  data: (typeof GL_FONTS !== 'undefined') ? GL_FONTS : [],
  css: null,
  install() {
    const rules = this.data.map(f => `@font-face{font-family:'${f.f}';font-style:${f.s};font-weight:${f.w};font-display:block;src:url(data:font/woff2;base64,${f.d}) format('woff2');}`).join('\n');
    const st = document.createElement('style');
    st.id = 'glFonts'; st.textContent = rules;
    document.head.append(st);
  },
  async ready() {
    if (!document.fonts || !document.fonts.load) return;
    const loads = this.data.map(f => document.fonts.load(`${f.s === 'italic' ? 'italic ' : ''}${f.w} 20px '${f.f}'`).catch(() => null));
    await Promise.all(loads);
  },
  families() { return EMBED_FAMILIES.concat(SYS_FAMILIES); },
  isEmbedded: ff => EMBED_FAMILIES.includes(ff),
  weightsOf(ff) {
    if (!EMBED_FAMILIES.includes(ff)) return [400, 700];
    return Array.from(new Set(this.data.filter(f => f.f === ff).map(f => f.w))).sort((a, b) => a - b);
  },
  stack(ff) { return `'${ff}', ${GENERIC[ff] || 'sans-serif'}`; },
  // @font-face amb només les variants utilitzades (per exportar)
  faceCSS(used) {
    const out = [];
    for (const f of this.data) {
      const key = f.f + '|' + f.w + '|' + f.s;
      if (used.has(key) || used.has(f.f + '|*')) out.push(`@font-face{font-family:'${f.f}';font-style:${f.s};font-weight:${f.w};src:url(data:font/woff2;base64,${f.d}) format('woff2');}`);
    }
    return out.join('');
  },
  // variant real més propera disponible
  nearest(ff, w, italic) {
    const vs = this.data.filter(f => f.f === ff);
    if (!vs.length) return null;
    const st = italic ? 'italic' : 'normal';
    const pool = vs.filter(f => f.s === st).length ? vs.filter(f => f.s === st) : vs;
    return pool.reduce((a, b) => Math.abs(b.w - w) < Math.abs(a.w - w) ? b : a);
  },
};

const TextKit = {
  ctx: null,
  cache: new Map(),
  metricsCache: new Map(),
  c2d() {
    if (!this.ctx) { try { this.ctx = document.createElement('canvas').getContext('2d'); } catch (e) { this.ctx = null; } }
    return this.ctx;
  },
  font(o) { return `${o.fi ? 'italic ' : ''}${o.fw || 400} ${o.fs}px ${FontKit.stack(o.ff || 'IBM Plex Sans')}`; },
  measure(o, s) {
    const c = this.c2d();
    const ls = (o.ls || 0) * o.fs * s.length; // ls en fracció d'em
    if (!c || !c.measureText) return s.length * o.fs * 0.55 + ls; // jsdom
    c.font = this.font(o);
    return c.measureText(s).width + ls;
  },
  metrics(o) {
    const key = this.font(o);
    let m = this.metricsCache.get(key);
    if (m) return m;
    const c = this.c2d();
    let asc = o.fs * 1.025, desc = o.fs * 0.275;
    if (c && c.measureText) {
      c.font = key;
      const t = c.measureText('Hg');
      if (t.fontBoundingBoxAscent) { asc = t.fontBoundingBoxAscent; desc = t.fontBoundingBoxDescent; }
    }
    m = { asc, desc };
    if (this.metricsCache.size > 500) this.metricsCache.clear();
    this.metricsCache.set(key, m);
    return m;
  },
  caseOf(o, s) { return o.tt === 'upper' ? s.toLocaleUpperCase('ca') : o.tt === 'lower' ? s.toLocaleLowerCase('ca') : s; },
  wrap(o, para, maxW) {
    if (para === '') return [''];
    const toks = para.split(/( +)/).filter(t => t !== '');
    const lines = [];
    let line = '';
    const fits = s => this.measure(o, s.replace(/ +$/, '')) <= maxW + 0.01;
    for (const t of toks) {
      const cand = line + t;
      if (fits(cand)) { line = cand; continue; }
      if (/^ +$/.test(t)) { line = cand; continue; } // espais penjats
      if (line) { lines.push(line); line = ''; }
      if (fits(t)) { line = t; continue; }
      // paraula més llarga que la caixa: trenca per caràcters
      let part = '';
      for (const ch of Array.from(t)) {
        if (part && !fits(part + ch)) { lines.push(part); part = ch; } else part += ch;
      }
      line = part;
    }
    lines.push(line);
    return lines;
  },
  layout(o) {
    const key = [GL.lib ? GL.lib.fieldText(o) : o.text, o.ff, o.fs, o.fw, o.fi ? 1 : 0, o.ls, o.lh, o.tt, o.auto, o.auto === 'w' ? '' : rnd(o.w, 2)].join('\u0001');
    let L = this.cache.get(key);
    if (L) return L;
    const text = this.caseOf(o, GL.lib ? GL.lib.fieldText(o) : (o.text || ''));
    const paras = text.split('\n');
    const lines = [];
    for (const p of paras) {
      if (o.auto === 'w') lines.push(p);
      else lines.push(...this.wrap(o, p, Math.max(1, o.w)));
    }
    const widths = lines.map(s => this.measure(o, s.replace(/ +$/, '')));
    const m = this.metrics(o);
    const lineH = (o.lh || 1.25) * o.fs;
    const w = o.auto === 'w' ? Math.max(1, ...widths.map(v => Math.ceil(v * 100) / 100)) : o.w;
    const h = Math.max(lineH, lines.length * lineH);
    const base = (lineH - (m.asc + m.desc)) / 2 + m.asc;
    L = { lines, widths, lineH, base, w, h };
    if (this.cache.size > 2000) this.cache.clear();
    this.cache.set(key, L);
    return L;
  },
  // dimensions resultants (per mantenir w/h coherents al model)
  fit(o) { const L = this.layout(o); return { w: rnd(L.w, 3), h: rnd(L.h, 3) }; },
};

GL.FontKit = FontKit; GL.TextKit = TextKit;
