/* ── Utilitats ───────────────────────────────────────────────── */
const VERSION = '%%VERSION%%';
const APP = 'guaitaLlenç';
const GL = window.GL = { VERSION };
const TEST = !!window.__GL_TEST__;
const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
const SVGNS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (v, d = 2) => { const p = Math.pow(10, d); return Math.round(v * p) / p; };
const DEG = Math.PI / 180;
const isNum = v => typeof v === 'number' && isFinite(v);
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const eq = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

function uid(n = 10) {
  const c = '0123456789abcdefghijklmnopqrstuvwxyz';
  let s = Date.now().toString(36).slice(-5);
  const a = new Uint8Array(n);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 256);
  for (let i = s.length; i < n; i++) s += c[a[i] % 36];
  return s;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// número amb coma decimal catalana i sense zeros sobrers
function fmtNum(v, d = 2) {
  if (!isFinite(v)) return '';
  let s = rnd(v, d).toString();
  if (s === '-0') s = '0';
  return s.replace('.', ',');
}
function debounce(fn, ms) {
  let t; const f = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  f.flush = (...a) => { clearTimeout(t); fn(...a); };
  f.cancel = () => clearTimeout(t);
  return f;
}
function rafThrottle(fn) {
  let q = false;
  return () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; fn(); }); };
}
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
function svgEl(tag, attrs) {
  const e = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  return e;
}
function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

/* ── Índexs fraccionaris (ordre estable i fusionable) ─────────── */
const FI_DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function fiMid(a, b) {
  const zero = FI_DIGITS[0];
  if (b !== null && a >= b) throw new Error('fi: ' + a + ' >= ' + b);
  if (b) {
    let n = 0;
    while ((a[n] || zero) === b[n]) n++;
    if (n > 0) return b.slice(0, n) + fiMid(a.slice(n), b.slice(n));
  }
  const da = a ? FI_DIGITS.indexOf(a[0]) : 0;
  const db = b !== null ? FI_DIGITS.indexOf(b[0]) : FI_DIGITS.length;
  if (db - da > 1) return FI_DIGITS[Math.round(0.5 * (da + db))];
  if (b && b.length > 1) return b.slice(0, 1);
  return FI_DIGITS[da] + fiMid(a.slice(1), null);
}
// clau entre a i b (null = extrems)
function keyBetween(a, b) {
  a = a || ''; b = b || null;
  if (b !== null && a >= b) { // claus col·lidides: busca una clau just després d'a
    return a + 'V';
  }
  let k = fiMid(a, b);
  while (k.endsWith('0')) k = k.slice(0, -1) + '1';
  return k;
}
function keysBetween(a, b, n) {
  const out = [];
  let prev = a;
  for (let i = 0; i < n; i++) { prev = keyBetween(prev, b); out.push(prev); }
  return out;
}

/* ── Unitats ─────────────────────────────────────────────────── */
// intern: px CSS a 96 ppp
const UNITS = { px: 1, mm: 96 / 25.4, cm: 96 / 2.54, in: 96, pt: 96 / 72 };
const UNIT_DEC = { px: 0, mm: 1, cm: 2, in: 3, pt: 1 };
const toU = (px, u) => px / UNITS[u];
const fromU = (v, u) => v * UNITS[u];
function fmtLen(px, u, extra = 0) { return fmtNum(toU(px, u), UNIT_DEC[u] + extra); }

/* Avaluador d'expressions segur per als camps numèrics
   admet: 12,5  10+5  50%  20mm  2*(3+1)  -4 */
function evalExpr(str, opt = {}) {
  const unit = opt.unit || null;      // unitat de visualització del camp
  const ref = opt.ref;                // valor de referència per a %
  const s = String(str).trim().replace(/,/g, '.').replace(/\s+/g, '');
  if (!s) return NaN;
  let i = 0;
  const peek = () => s[i];
  function num() {
    const m = /^(\d+\.?\d*|\.\d+)(px|mm|cm|in|pt|%|°)?/.exec(s.slice(i));
    if (!m) throw 0;
    i += m[0].length;
    let v = parseFloat(m[1]);
    const u = m[2];
    if (u === '%') { if (!isNum(ref)) throw 0; v = ref * v / 100; }
    else if (u && u !== '°' && unit && UNITS[u]) v = UNITS[u] * v / UNITS[unit];
    return v;
  }
  function factor() {
    const c = peek();
    if (c === '-') { i++; return -factor(); }
    if (c === '+') { i++; return factor(); }
    if (c === '(') { i++; const v = expr(); if (peek() !== ')') throw 0; i++; return v; }
    return num();
  }
  function term() {
    let v = factor();
    while (peek() === '*' || peek() === '/') {
      const o = s[i++]; const r = factor();
      v = o === '*' ? v * r : v / r;
    }
    return v;
  }
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') {
      const o = s[i++]; const r = term();
      v = o === '+' ? v + r : v - r;
    }
    return v;
  }
  try { const v = expr(); if (i !== s.length || !isFinite(v)) return NaN; return v; }
  catch (e) { return NaN; }
}

/* ── Colors ──────────────────────────────────────────────────── */
// format intern: '#rrggbbaa'
function hexA(c) {
  if (!c) return '#000000ff';
  c = String(c).trim().toLowerCase();
  if (/^#[0-9a-f]{8}$/.test(c)) return c;
  if (/^#[0-9a-f]{6}$/.test(c)) return c + 'ff';
  if (/^#[0-9a-f]{3,4}$/.test(c)) { let r = '#'; for (let k = 1; k < c.length; k++) r += c[k] + c[k]; return r.length === 7 ? r + 'ff' : r; }
  return null;
}
function rgbaOf(c) {
  const h = hexA(c) || '#000000ff';
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16), a: parseInt(h.slice(7, 9), 16) / 255 };
}
function toHexA(r, g, b, a = 1) {
  const h = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b) + h(a * 255);
}
const hex6 = c => (hexA(c) || '#000000ff').slice(0, 7);
const alphaOf = c => rgbaOf(c).a;
const cssColor = c => { const { r, g, b, a } = rgbaOf(c); return a >= 1 ? hex6(c) : `rgba(${r},${g},${b},${rnd(a, 3)})`; };
function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return { h, s: mx ? d / mx : 0, v: mx };
}
function hsv2rgb(h, s, v) {
  const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255 };
}
const NAMED = { black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00', cyan: '#00ffff', magenta: '#ff00ff', gray: '#808080', grey: '#808080', orange: '#ffa500', purple: '#800080', lime: '#00ff00', navy: '#000080', teal: '#008080', maroon: '#800000', olive: '#808000', silver: '#c0c0c0', pink: '#ffc0cb', brown: '#a52a2a', gold: '#ffd700', transparent: '#00000000' };
let _cctx = null;
function parseCssColor(s) {
  if (!s) return null;
  s = String(s).trim();
  const h = hexA(s); if (h) return h;
  const low = s.toLowerCase();
  if (NAMED[low]) return hexA(NAMED[low]);
  let m = /^rgba?\(\s*([\d.]+)(%?)[\s,]+([\d.]+)(%?)[\s,]+([\d.]+)(%?)(?:[\s,/]+([\d.]+)(%?))?\s*\)$/i.exec(s);
  if (m) {
    const c = (v, p) => p ? parseFloat(v) * 2.55 : parseFloat(v);
    const a = m[7] == null ? 1 : (m[8] ? parseFloat(m[7]) / 100 : parseFloat(m[7]));
    return toHexA(c(m[1], m[2]), c(m[3], m[4]), c(m[5], m[6]), a);
  }
  try {
    if (!_cctx) _cctx = document.createElement('canvas').getContext('2d');
    if (_cctx) {
      _cctx.fillStyle = '#010203'; _cctx.fillStyle = s;
      const v = _cctx.fillStyle;
      if (v !== '#010203' || low === '#010203') return parseCssColor(v);
    }
  } catch (e) { /* jsdom */ }
  return null;
}

/* ── Binari i base64 ─────────────────────────────────────────── */
function b64FromBytes(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
function bytesFromB64(b64) {
  const s = atob(b64); const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}
const utf8 = { enc: s => new TextEncoder().encode(s), dec: u => new TextDecoder().decode(u) };
async function streamBytes(u8, stream) {
  const rs = new Blob([u8]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(rs).arrayBuffer());
}
const deflate = u8 => streamBytes(u8, new CompressionStream('deflate'));
const inflate = u8 => streamBytes(u8, new DecompressionStream('deflate'));
let _crcT = null;
function crc32(u8, crc = 0) {
  if (!_crcT) { _crcT = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; _crcT[n] = c >>> 0; } }
  crc = crc ^ 0xffffffff;
  for (let i = 0; i < u8.length; i++) crc = _crcT[(crc ^ u8[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function hashStr(s) { // FNV-1a 32 bits (deduplicació d'actius)
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += Math.max(1, (s.length / 20000) | 0)) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36) + '-' + s.length.toString(36);
}
function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function readFileAs(file, how) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = () => rej(r.error);
    if (how === 'text') r.readAsText(file);
    else if (how === 'url') r.readAsDataURL(file);
    else r.readAsArrayBuffer(file);
  });
}
function safeName(s) { return (String(s || 'document').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'document').slice(0, 120); }

Object.assign(GL, { uid, esc, fmtNum, keyBetween, keysBetween, evalExpr, hexA, rgbaOf, toHexA, parseCssColor, crc32, UNITS, toU, fromU, deflate, inflate, b64FromBytes, bytesFromB64 });
