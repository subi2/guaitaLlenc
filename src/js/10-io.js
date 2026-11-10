/* ── Fitxers: desat, obertura, importació, exportació ────────── */
const FORMAT = 'guaitaLlenc';
const NS_LLENC = 'https://github.com/subi2/guaitaApps/llenc';

const IO = GL.io = {
  /* ── serialització ── */
  serialize(opt = {}) {
    const st = opt.store || App.store;
    const doc = clone(st.doc);
    // descarta actius no utilitzats
    const used = st.usedAssets();
    for (const k in doc.assets) if (!used.has(k)) delete doc.assets[k];
    doc.props.modified = new Date().toISOString();
    doc.props.app = APP + ' ' + VERSION;
    const out = { format: FORMAT, version: VERSION, saved: doc.props.modified, doc };
    if (!opt.noLog) { out.log = st.log.slice(-5000); if (GL.gh && GL.gh.linked(st.doc.id)) out.ts = st.exportTs(); }
    return out;
  },
  parse(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('El fitxer no és un document vàlid de guaitaLlenç.'); }
    if (!data || data.format !== FORMAT || !data.doc) throw new Error('El fitxer no és un document de guaitaLlenç.');
    return this.migrate(data);
  },
  migrate(data) {
    const d = data.doc;
    d.pages = d.pages || {}; d.objs = d.objs || {}; d.assets = d.assets || {}; d.props = d.props || {};
    if (!Object.keys(d.pages).length) { const b = Store.blankDoc(); d.pages = b.pages; }
    for (const id in d.pages) { const p = d.pages[id]; p.guides = p.guides || { h: [], v: [] }; }
    d.props.unit = d.props.unit || 'mm';
    if (!d.props.colors || !d.props.tstyles) { const p0 = Object.values(d.pages)[0]; GL.lib.initDocStyles(d, Math.min(p0.w, p0.h), true); }
    return data;
  },
  async pack(data) { // JSON → deflate → base64
    return b64FromBytes(await deflate(utf8.enc(JSON.stringify(data))));
  },
  async unpack(b64) {
    return JSON.parse(utf8.dec(await inflate(bytesFromB64(b64.replace(/\s+/g, '')))));
  },

  /* ── desat ── */
  async save(as) {
    const st = App.store;
    const name = safeName(st.props.name);
    const json = JSON.stringify(this.serialize());
    const blob = new Blob([json], { type: 'application/json' });
    if (!as && App.fileHandle && App.fileHandle.createWritable) {
      try {
        const w = await App.fileHandle.createWritable(); await w.write(blob); await w.close();
        this.markSaved('Desat a ' + App.fileHandle.name); return true;
      } catch (e) { if (e.name === 'AbortError') return false; console.warn(e); }
    }
    if (window.showSaveFilePicker) {
      try {
        const h = await window.showSaveFilePicker({ suggestedName: name + '.llenc', types: [{ description: 'Document de guaitaLlenç', accept: { 'application/x-guaita-llenc': ['.llenc'] } }] });
        const w = await h.createWritable(); await w.write(blob); await w.close();
        App.fileHandle = h; App.fileName = h.name;
        this.markSaved('Desat com a ' + h.name); return true;
      } catch (e) { if (e.name === 'AbortError') return false; console.warn(e); }
    }
    downloadBlob(blob, name + '.llenc');
    this.markSaved('Document baixat: ' + name + '.llenc');
    return true;
  },
  markSaved(msg) {
    App.store.savedVersion = App.store.version;
    GL.saveState && GL.saveState();
    if (msg) UI.toast(msg);
  },

  /* ── obertura ── */
  async openPicker() {
    if (window.showOpenFilePicker) {
      try {
        const [h] = await window.showOpenFilePicker({ types: [{ description: 'Documents i imatges', accept: { 'application/x-guaita-llenc': ['.llenc'], 'image/svg+xml': ['.svg'], 'image/png': ['.png'], 'application/json': ['.json'] } }] });
        const f = await h.getFile();
        return this.openFile(f, h);
      } catch (e) { if (e.name === 'AbortError') return; console.warn(e); }
    }
    const f = await pickFile('.llenc,.svg,.png,.json');
    if (f) return this.openFile(f);
  },
  // obre un fitxer com a document (o l'importa si no conté un document)
  async openFile(file, handle) {
    const name = file.name || '';
    const ext = name.split('.').pop().toLowerCase();
    try {
      if (ext === 'llenc' || ext === 'json') {
        const data = this.parse(await readFileAs(file, 'text'));
        this.loadData(data, { handle, fileName: name });
        UI.toast('Obert: ' + name);
        return true;
      }
      if (ext === 'svg' || file.type === 'image/svg+xml') {
        const text = await readFileAs(file, 'text');
        const data = await this.fromSVG(text);
        if (data) { this.loadData(data, { fileName: name }); UI.toast('Document editable recuperat de ' + name); return true; }
        if (!App.store.doc) await newFromAsset(file);
        else await this.importFiles([file]);
        return true;
      }
      if (ext === 'png' || file.type === 'image/png') {
        const buf = new Uint8Array(await readFileAs(file, 'buf'));
        const data = await this.fromPNG(buf);
        if (data) { this.loadData(data, { fileName: name }); UI.toast('Document editable recuperat de ' + name); return true; }
      }
      if (/^image\//.test(file.type) || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp'].includes(ext)) {
        if (!App.store.doc) await newFromAsset(file);
        else await this.importFiles([file]);
        return true;
      }
      UI.toast('Format no compatible: ' + (ext || name), 'err');
    } catch (e) { console.error(e); UI.toast(e.message || 'No s\'ha pogut obrir el fitxer', 'err', 4000); }
    return false;
  },
  loadData(data, opt) {
    GL.start && GL.start.close();
    App.loadDoc(data.doc, data.log || [], Object.assign({ ts: data.ts }, opt));
    Autosave.now();
  },
  async fromSVG(text) {
    const m = /<guaita:llenc[^>]*>([\s\S]*?)<\/guaita:llenc>/.exec(text);
    if (!m) return null;
    const raw = m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    return this.migrate(await this.unpack(raw));
  },
  async fromPNG(u8) {
    const chunks = pngChunks(u8);
    if (!chunks) return null;
    for (const c of chunks) {
      if (c.type !== 'zTXt' && c.type !== 'iTXt' && c.type !== 'tEXt') continue;
      const d = c.data;
      const z = d.indexOf(0);
      const key = utf8.dec(d.subarray(0, z));
      if (key !== FORMAT) continue;
      if (c.type === 'zTXt') return this.migrate(JSON.parse(utf8.dec(await inflate(d.subarray(z + 2)))));
      if (c.type === 'tEXt') return this.migrate(await this.unpack(utf8.dec(d.subarray(z + 1))));
    }
    return null;
  },

  /* ── importació dins del document ── */
  async importFiles(files, at) {
    const st = App.store;
    const pg = App.pageId;
    const ids = [];
    let i = 0;
    st.begin('Importa');
    try {
      for (const f of files) {
        const ext = (f.name || '').split('.').pop().toLowerCase();
        const off = pt(i * 24, i * 24); i++;
        const where = at ? pt(at.x + off.x, at.y + off.y) : null;
        if (ext === 'svg' || f.type === 'image/svg+xml') {
          const id = await this.importSVGText(await readFileAs(f, 'text'), pg, where, (f.name || 'SVG').replace(/\.svg$/i, ''));
          if (id) ids.push(id);
        } else if (/^image\//.test(f.type) || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'ico'].includes(ext)) {
          const id = await this.importImage(f, pg, where);
          if (id) ids.push(id);
        } else if (ext === 'llenc') {
          // incrusta les pàgines d'un altre document com a grups
          const data = this.parse(await readFileAs(f, 'text'));
          const p0 = Object.values(data.doc.pages).sort(byZ)[0];
          const objs = Object.values(data.doc.objs).filter(o => o.page === p0.id);
          const tops = insertTree({ objs, assets: data.doc.assets }, pg, 0, 0);
          ids.push(...tops);
        } else UI.toast('No es pot importar ' + f.name, 'warn');
      }
    } catch (e) { console.error(e); UI.toast(e.message || 'Error en importar', 'err'); }
    st.commit();
    if (ids.length) { App.select(ids); setTool('select'); }
    return ids;
  },
  async importImage(file, pageId, at, name) {
    const url = typeof file === 'string' ? file : await readFileAs(file, 'url');
    const img = await loadImage(url);
    let mime = /^data:([^;,]+)/.exec(url)[1];
    let data = url.slice(url.indexOf(',') + 1);
    let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    // formats poc compatibles amb altres apps → PNG
    if (!/png|jpeg|webp|gif|svg/.test(mime)) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0);
      const u = c.toDataURL('image/png'); mime = 'image/png'; data = u.slice(u.indexOf(',') + 1);
    }
    if (!w || !h) { w = 300; h = 150; }
    const st = App.store;
    const page = st.page(pageId);
    const aid = st.addAsset(mime, data, w, h);
    // ajusta a la pàgina (80 %)
    let s = Math.min(1, page.w * 0.8 / w, page.h * 0.8 / h);
    const ow = w * s, oh = h * s;
    const c = at || pt(page.w / 2, page.h / 2);
    return st.add({ type: 'image', page: pageId, asset: aid, x: rnd(c.x - ow / 2, 3), y: rnd(c.y - oh / 2, 3), w: rnd(ow, 3), h: rnd(oh, 3), crop: { x: 0, y: 0, w, h }, r: 0, fill: { t: 'none', c: '#000000ff' }, stroke: { t: 'solid', c: '#1a1a1aff' }, sw: 0, lockRatio: true, name: name || (typeof file === 'string' ? 'Imatge' : (file.name || 'Imatge').replace(/\.[^.]+$/, '')) });
  },
  async importSVGText(text, pageId, at, name) {
    const res = SvgImport.parse(text);
    if (!res || !res.items.length) { UI.toast('L\'SVG no conté elements compatibles', 'warn'); return null; }
    const st = App.store;
    const page = st.page(pageId);
    // ajusta i centra
    const b = res.box;
    let s = 1;
    if (b.w > page.w * 0.9 || b.h > page.h * 0.9) s = Math.min(page.w * 0.9 / b.w, page.h * 0.9 / b.h);
    const c = at || pt(page.w / 2, page.h / 2);
    const T = Mx.chain(Mx.tr(c.x, c.y), Mx.sc(s), Mx.tr(-(b.x + b.w / 2), -(b.y + b.h / 2)));
    const ids = await SvgImport.emit(res.items, pageId, T, s);
    if (ids.length > 1) {
      const gid = st.add({ type: 'group', page: pageId, name: name || 'SVG' });
      const keys = keysBetween(null, null, ids.length);
      ids.forEach((id, i) => { st.set(id, 'parent', gid); st.set(id, 'z', keys[i]); });
      return gid;
    }
    return ids[0] || null;
  },

  /* ── exportació ── */
  async svgFor(pageId, opt = {}) {
    let meta = '';
    if (opt.editable) meta = `<metadata><guaita:llenc xmlns:guaita="${NS_LLENC}" encoding="deflate-base64" version="${VERSION}">${await this.pack(this.serialize({ noLog: true }))}</guaita:llenc></metadata>`;
    return R.pageSVG(pageId, Object.assign({ meta }, opt));
  },
  async rasterize(pageId, scale, type = 'image/png', opt = {}) {
    const page = App.store.page(pageId);
    const svg = R.pageSVG(pageId, { transparent: opt.transparent, pxSize: 1 });
    const W = Math.max(1, Math.round(page.w * scale)), H = Math.max(1, Math.round(page.h * scale));
    if (W * H > 268e6) throw new Error('Imatge massa gran per al navegador (' + W + ' × ' + H + ' px)');
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const img = await loadImage(url);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      if (type === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, W, H);
      const blob = await new Promise(r => c.toBlob(r, type, opt.quality || 0.92));
      if (!blob) throw new Error('No s\'ha pogut generar la imatge');
      return blob;
    } finally { URL.revokeObjectURL(url); }
  },
  async pngEditable(pageId, scale, transparent) {
    const blob = await this.rasterize(pageId, scale, 'image/png', { transparent });
    const u8 = new Uint8Array(await blob.arrayBuffer());
    const payload = await deflate(utf8.enc(JSON.stringify(this.serialize({ noLog: true }))));
    const key = utf8.enc(FORMAT);
    const data = new Uint8Array(key.length + 2 + payload.length);
    data.set(key, 0); data[key.length] = 0; data[key.length + 1] = 0; data.set(payload, key.length + 2);
    const pngU = pngInsertChunk(u8, 'zTXt', data);
    // pHYs amb la resolució equivalent
    const dpm = Math.round(96 * scale / 0.0254);
    const phys = new Uint8Array(9); const dv = new DataView(phys.buffer); dv.setUint32(0, dpm); dv.setUint32(4, dpm); phys[8] = 1;
    return new Blob([pngInsertChunk(pngU, 'pHYs', phys)], { type: 'image/png' });
  },
  async exportRun(o) {
    const st = App.store;
    const pages = o.pages;
    const base = safeName(st.props.name);
    const multi = pages.length > 1;
    const fname = (p, i, ext) => multi ? `${base}-${String(i + 1).padStart(2, '0')}-${safeName(p.name)}.${ext}` : `${base}.${ext}`;
    if (o.fmt === 'pdf') { await this.printPDF(pages.map(p => p.id)); return; }
    const files = [];
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      if (o.fmt === 'png') files.push({ name: fname(p, i, 'png'), blob: o.editable ? await this.pngEditable(p.id, o.scale, o.transparent) : await this.rasterize(p.id, o.scale, 'image/png', { transparent: o.transparent }) });
      else if (o.fmt === 'jpg') files.push({ name: fname(p, i, 'jpg'), blob: await this.rasterize(p.id, o.scale, 'image/jpeg', { quality: o.quality }) });
      else if (o.fmt === 'svg') files.push({ name: fname(p, i, 'svg'), blob: new Blob([await this.svgFor(p.id, { editable: o.editable, transparent: o.transparent })], { type: 'image/svg+xml' }) });
    }
    if (files.length === 1) downloadBlob(files[0].blob, files[0].name);
    else downloadBlob(await makeZip(files), base + '-' + o.fmt + '.zip');
    UI.toast(files.length === 1 ? 'Exportat: ' + files[0].name : `Exportades ${files.length} pàgines en un ZIP`);
  },
  async printPDF(pageIds) {
    const st = App.store;
    const root = $('#printRoot');
    root.textContent = '';
    const css = [];
    const sizes = new Map();
    for (const id of pageIds) {
      const p = st.page(id);
      const wmm = rnd(toU(p.w, 'mm'), 3), hmm = rnd(toU(p.h, 'mm'), 3);
      const key = 'pg' + String(wmm).replace('.', '_') + 'x' + String(hmm).replace('.', '_');
      if (!sizes.has(key)) { sizes.set(key, 1); css.push(`@page ${key}{size:${wmm}mm ${hmm}mm;margin:0}`); }
      const d = el('div', { class: 'ppage', style: { page: key, width: wmm + 'mm', height: hmm + 'mm' } });
      d.innerHTML = R.pageSVG(id, { pre: 'pr' + id + '-' });
      root.append(d);
    }
    const first = st.page(pageIds[0]);
    css.unshift(`@page{size:${rnd(toU(first.w, 'mm'), 3)}mm ${rnd(toU(first.h, 'mm'), 3)}mm;margin:0}`);
    const style = el('style', { id: 'printStyle', text: css.join('\n') });
    document.head.append(style);
    const prevTitle = document.title;
    document.title = safeName(st.props.name);
    await new Promise(r => setTimeout(r, 120));
    const done = () => { root.textContent = ''; style.remove(); document.title = prevTitle; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(() => { if (root.childNodes.length && !matchMedia('print').matches) done(); }, 1500);
    UI.toast('Tria «Desa com a PDF» al diàleg d\'impressió');
  },
};

/* ── PNG: blocs ── */
function pngChunks(u8) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (u8[i] !== sig[i]) return null;
  const out = [];
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let p = 8;
  while (p + 8 <= u8.length) {
    const len = dv.getUint32(p);
    const type = String.fromCharCode(u8[p + 4], u8[p + 5], u8[p + 6], u8[p + 7]);
    out.push({ type, data: u8.subarray(p + 8, p + 8 + len), at: p });
    p += 12 + len;
    if (type === 'IEND') break;
  }
  return out;
}
function pngInsertChunk(u8, type, data) {
  const chunks = pngChunks(u8);
  const iend = chunks.find(c => c.type === 'IEND');
  const at = type === 'pHYs' ? chunks.find(c => c.type === 'IDAT').at : iend.at;
  const len = data.length;
  const ch = new Uint8Array(12 + len);
  const dv = new DataView(ch.buffer);
  dv.setUint32(0, len);
  for (let i = 0; i < 4; i++) ch[4 + i] = type.charCodeAt(i);
  ch.set(data, 8);
  dv.setUint32(8 + len, crc32(ch.subarray(4, 8 + len)));
  // treu pHYs existent
  let src = u8;
  if (type === 'pHYs') { const ex = chunks.find(c => c.type === 'pHYs'); if (ex) { const L = 12 + ex.data.length; src = new Uint8Array(u8.length - L); src.set(u8.subarray(0, ex.at)); src.set(u8.subarray(ex.at + L), ex.at); return pngInsertChunk(src, type, data); } }
  const out = new Uint8Array(src.length + ch.length);
  out.set(src.subarray(0, at)); out.set(ch, at); out.set(src.subarray(at), at + ch.length);
  return out;
}

/* ── ZIP (emmagatzemat, sense compressió) ── */
async function makeZip(files) {
  const parts = [], central = [];
  let offset = 0;
  const now = new Date();
  const dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer());
    const name = utf8.enc(f.name);
    const crc = crc32(data);
    const lh = new Uint8Array(30 + name.length); const v = new DataView(lh.buffer);
    v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true);
    v.setUint16(10, dt, true); v.setUint16(12, dd, true); v.setUint32(14, crc, true); v.setUint32(18, data.length, true); v.setUint32(22, data.length, true);
    v.setUint16(26, name.length, true); v.setUint16(28, 0, true); lh.set(name, 30);
    parts.push(lh, data);
    const ch = new Uint8Array(46 + name.length); const c = new DataView(ch.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true); c.setUint32(42, offset, true); ch.set(name, 46);
    central.push(ch);
    offset += lh.length + data.length;
  }
  const csize = central.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array(22); const e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}
GL.makeZip = makeZip; GL.pngChunks = pngChunks; GL.pngInsertChunk = pngInsertChunk;

function loadImage(url) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('No s\'ha pogut llegir la imatge')); i.src = url; });
}
function pickFile(accept, multiple) {
  return new Promise(res => {
    const inp = $('#fileInput');
    inp.value = ''; inp.accept = accept || ''; inp.multiple = !!multiple;
    inp.onchange = () => res(multiple ? Array.from(inp.files) : inp.files[0]);
    inp.click();
  });
}
GL.pickFile = pickFile;
async function newFromAsset(file) {
  // document nou amb la mida de la imatge
  const url = await readFileAs(file, 'url');
  let w = 1080, h = 1080;
  try { const img = await loadImage(url); w = img.naturalWidth || w; h = img.naturalHeight || h; } catch (e) { }
  const doc = Store.blankDoc({ name: (file.name || 'Imatge').replace(/\.[^.]+$/, ''), unit: 'px', w, h });
  IO.loadData({ doc, log: [] }, {});
  await IO.importFiles([file], pt(w / 2, h / 2));
}

/* ── Importador SVG → objectes editables ── */
const SvgImport = {
  parse(text) {
    let doc;
    try { doc = new DOMParser().parseFromString(text, 'image/svg+xml'); } catch (e) { return null; }
    const root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return null;
    this.doc = doc;
    this.css = this.parseCSS(Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n'));
    const items = [];
    // mida i viewBox de l'arrel
    const len = (v, ref) => { if (!v) return null; const m = /^([\d.e+-]+)\s*(px|mm|cm|in|pt|%)?$/i.exec(v.trim()); if (!m) return null; const n = parseFloat(m[1]); if (m[2] === '%') return ref ? n / 100 * ref : null; return n * (UNITS[m[2]] || 1); };
    const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    let W = len(root.getAttribute('width')), H = len(root.getAttribute('height'));
    let M = Mx.id();
    if (vb.length === 4 && vb.every(isFinite) && vb[2] > 0 && vb[3] > 0) {
      if (!W && !H) { W = vb[2]; H = vb[3]; } else if (!W) W = H * vb[2] / vb[3]; else if (!H) H = W * vb[3] / vb[2];
      const sx = W / vb[2], sy = H / vb[3], s = Math.min(sx, sy);
      M = Mx.chain(Mx.tr((W - vb[2] * s) / 2, (H - vb[3] * s) / 2), Mx.sc(s), Mx.tr(-vb[0], -vb[1]));
    }
    this.walk(root, M, this.styleOf(root, this.baseStyle()), items, 0);
    const pts = [];
    for (const it of items) for (const p of it.bbox) pts.push(p);
    const box = pts.length ? rectOfPts(pts) : { x: 0, y: 0, w: W || 100, h: H || 100 };
    return { items, box };
  },
  baseStyle() { return { fill: '#000000', stroke: 'none', 'stroke-width': '1', opacity: '1', 'fill-opacity': '1', 'stroke-opacity': '1', 'fill-rule': 'nonzero', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'font-family': 'sans-serif', 'font-size': '16', 'font-weight': '400', 'font-style': 'normal', 'text-anchor': 'start', display: 'inline', visibility: 'visible', 'stroke-dasharray': 'none', 'letter-spacing': '0' }; },
  parseCSS(text) {
    const rules = [];
    text = text.replace(/\/\*[\s\S]*?\*\//g, '');
    const re = /([^{}]+)\{([^}]*)\}/g; let m;
    while ((m = re.exec(text))) {
      const decl = {};
      m[2].split(';').forEach(d => { const i = d.indexOf(':'); if (i > 0) decl[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim().replace(/\s*!important$/, ''); });
      m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(sel => rules.push({ sel, decl }));
    }
    return rules;
  },
  INHERIT: ['fill', 'stroke', 'stroke-width', 'fill-opacity', 'stroke-opacity', 'fill-rule', 'stroke-linecap', 'stroke-linejoin', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'visibility', 'stroke-dasharray', 'letter-spacing'],
  styleOf(e, parent) {
    const s = {};
    for (const k of this.INHERIT) s[k] = parent[k];
    s.opacity = '1'; s.display = 'inline';
    const apply = d => { for (const k in d) s[k] = d[k]; };
    const attrs = {};
    for (const k of this.INHERIT.concat(['opacity', 'display'])) { const v = e.getAttribute(k); if (v != null && v !== 'inherit') attrs[k] = v; }
    apply(attrs);
    // regles CSS simples (.classe, #id, element)
    const cls = (e.getAttribute('class') || '').split(/\s+/).filter(Boolean);
    const tag = e.nodeName.toLowerCase(), id = e.getAttribute('id');
    for (const r of this.css) {
      const sel = r.sel;
      if (/^\.[\w-]+$/.test(sel) ? cls.includes(sel.slice(1)) : /^#[\w-]+$/.test(sel) ? id === sel.slice(1) : /^[a-z]+$/i.test(sel) ? tag === sel.toLowerCase() : /^[a-z]+\.[\w-]+$/i.test(sel) ? (tag === sel.split('.')[0] && cls.includes(sel.split('.')[1])) : false) apply(r.decl);
    }
    const st = e.getAttribute('style');
    if (st) st.split(';').forEach(d => { const i = d.indexOf(':'); if (i > 0) { const k = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim().replace(/\s*!important$/, ''); if (v !== 'inherit') s[k] = v; } });
    return s;
  },
  parseTransform(t) {
    let M = Mx.id();
    if (!t) return M;
    const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g; let m;
    while ((m = re.exec(t))) {
      const a = m[2].trim().split(/[\s,]+/).map(Number);
      let T = Mx.id();
      if (m[1] === 'matrix' && a.length === 6) T = a;
      else if (m[1] === 'translate') T = Mx.tr(a[0] || 0, a[1] || 0);
      else if (m[1] === 'scale') T = Mx.sc(a[0], a.length > 1 ? a[1] : a[0]);
      else if (m[1] === 'rotate') { T = Mx.rot((a[0] || 0) * DEG); if (a.length >= 3) T = Mx.chain(Mx.tr(a[1], a[2]), T, Mx.tr(-a[1], -a[2])); }
      else if (m[1] === 'skewX') T = [1, 0, Math.tan(a[0] * DEG), 1, 0, 0];
      else if (m[1] === 'skewY') T = [1, Math.tan(a[0] * DEG), 0, 1, 0, 0];
      M = Mx.mul(M, T);
    }
    return M;
  },
  num(e, k, d = 0) { const v = parseFloat(e.getAttribute(k)); return isFinite(v) ? v : d; },
  walk(e, M, style, out, depth) {
    if (depth > 40) return;
    for (const c of Array.from(e.children)) {
      const tag = c.nodeName.toLowerCase().replace(/^svg:/, '');
      if (['defs', 'style', 'metadata', 'title', 'desc', 'clippath', 'mask', 'pattern', 'symbol', 'lineargradient', 'radialgradient', 'filter', 'marker', 'script'].includes(tag)) continue;
      const s = this.styleOf(c, style);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      const T = Mx.mul(M, this.parseTransform(c.getAttribute('transform')));
      const op = parseFloat(s.opacity); const opacity = isFinite(op) ? op : 1;
      if (tag === 'g' || tag === 'a' || tag === 'switch') {
        const kids = [];
        this.walk(c, T, s, kids, depth + 1);
        if (!kids.length) continue;
        if (kids.length === 1) { kids[0].opacity = (kids[0].opacity || 1) * opacity; out.push(kids[0]); }
        else out.push({ kind: 'group', kids, opacity, name: c.getAttribute('id') || c.getAttribute('inkscape:label'), bbox: kids.flatMap(k => k.bbox) });
        continue;
      }
      if (tag === 'svg') { const x = this.num(c, 'x'), y = this.num(c, 'y'); this.walk(c, Mx.mul(T, Mx.tr(x, y)), s, out, depth + 1); continue; }
      if (tag === 'use') {
        const href = c.getAttribute('href') || c.getAttribute('xlink:href') || '';
        const ref = href.startsWith('#') ? this.doc.getElementById(href.slice(1)) : null;
        if (!ref) continue;
        const x = this.num(c, 'x'), y = this.num(c, 'y');
        const wrap = this.doc.createElementNS(SVGNS, 'g');
        wrap.append(ref.nodeName.toLowerCase() === 'symbol' ? (() => { const g = this.doc.createElementNS(SVGNS, 'g'); Array.from(ref.childNodes).forEach(n => g.append(n.cloneNode(true))); return g; })() : ref.cloneNode(true));
        this.walk(wrap, Mx.mul(T, Mx.tr(x, y)), s, out, depth + 1);
        continue;
      }
      const item = this.element(c, tag, T, s);
      if (item) { item.opacity = opacity; out.push(item); }
    }
  },
  paint(v, alpha) {
    if (!v || v === 'none' || v === 'transparent') return { t: 'none', c: '#000000ff' };
    const m = /url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/.exec(v);
    if (m) {
      const g = this.doc.getElementById(m[1]);
      const pg = g ? this.gradient(g, alpha) : null;
      if (pg) return pg;
      const fb = v.replace(m[0], '').trim();
      return fb ? this.paint(fb, alpha) : { t: 'solid', c: '#808080ff' };
    }
    if (v === 'currentColor') v = '#000000';
    const c = parseCssColor(v);
    if (!c) return { t: 'solid', c: '#000000ff' };
    const { r, g, b, a } = rgbaOf(c);
    return { t: 'solid', c: toHexA(r, g, b, a * alpha) };
  },
  gradient(g, alpha) {
    const tag = g.nodeName.toLowerCase();
    let stopsEl = g, guard = 0;
    while (stopsEl && !stopsEl.querySelector('stop') && guard++ < 6) { const h = stopsEl.getAttribute('href') || stopsEl.getAttribute('xlink:href'); stopsEl = h ? this.doc.getElementById(h.slice(1)) : null; }
    if (!stopsEl) return null;
    const s = Array.from(stopsEl.querySelectorAll('stop')).map(st => {
      const sty = this.styleOf(st, {});
      const off = st.getAttribute('offset') || '0';
      const o = off.endsWith('%') ? parseFloat(off) / 100 : parseFloat(off);
      const col = parseCssColor(st.getAttribute('stop-color') || sty['stop-color'] || '#000') || '#000000ff';
      const so = parseFloat(st.getAttribute('stop-opacity') || sty['stop-opacity'] || '1');
      const { r, g: gg, b, a } = rgbaOf(col);
      return { o: clamp(isFinite(o) ? o : 0, 0, 1), c: toHexA(r, gg, b, a * (isFinite(so) ? so : 1) * alpha) };
    });
    if (!s.length) return null;
    if (s.length === 1) return { t: 'solid', c: s[0].c };
    if (tag === 'radialgradient') return { t: 'radial', s };
    const n = k => { const v = g.getAttribute(k); return v == null ? null : v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v); };
    const x1 = n('x1') ?? 0, y1 = n('y1') ?? 0, x2 = n('x2') ?? 1, y2 = n('y2') ?? 0;
    return { t: 'linear', a: rnd(Math.atan2(y2 - y1, x2 - x1) / DEG, 2), s };
  },
  common(s) {
    const fo = parseFloat(s['fill-opacity']), so = parseFloat(s['stroke-opacity']);
    const sw = parseFloat(s['stroke-width']);
    const o = {
      fill: this.paint(s.fill, isFinite(fo) ? fo : 1),
      stroke: this.paint(s.stroke, isFinite(so) ? so : 1),
      sw: s.stroke && s.stroke !== 'none' ? (isFinite(sw) ? sw : 1) : 0,
      cap: s['stroke-linecap'] || 'butt', join: s['stroke-linejoin'] || 'miter',
      fr: s['fill-rule'] === 'evenodd' ? 'evenodd' : 'nonzero',
    };
    const da = s['stroke-dasharray'];
    if (da && da !== 'none') o.dash = da.replace(/,/g, ' ').trim();
    return o;
  },
  element(e, tag, T, s) {
    const n = (k, d) => this.num(e, k, d);
    const sc = Math.sqrt(Math.abs(Mx.det(T))) || 1;
    const base = this.common(s);
    base.sw = rnd(base.sw * sc, 3);
    const simple = Math.abs(T[1]) < 1e-9 && Math.abs(T[2]) < 1e-9 && T[0] > 0 && T[3] > 0;
    let sp = null;
    if (tag === 'rect') {
      const x = n('x'), y = n('y'), w = n('width'), h = n('height');
      if (!(w > 0 && h > 0)) return null;
      let rx = n('rx', NaN), ry = n('ry', NaN); if (!isFinite(rx)) rx = isFinite(ry) ? ry : 0; if (!isFinite(ry)) ry = rx;
      if (simple && Math.abs(rx - ry) < 1e-6) {
        const p = Mx.ap(T, pt(x, y));
        const W = w * T[0], H = h * T[3];
        return { kind: 'obj', o: Object.assign({ type: 'rect', x: p.x, y: p.y, w: W, h: H, r: rnd(Math.min(rx * Math.min(T[0], T[3]), W / 2, H / 2), 3) }, base), bbox: [p, pt(p.x + W, p.y + H)] };
      }
      sp = G.mapSP(rx > 0 ? G.rrectNodes(w, h, [rx, rx, rx, rx]) : [{ c: true, n: [pt(0, 0), pt(w, 0), pt(w, h), pt(0, h)].map(q => ({ x: q.x, y: q.y, i: null, o: null })) }], q => pt(q.x + x, q.y + y));
    } else if (tag === 'circle' || tag === 'ellipse') {
      const cx = n('cx'), cy = n('cy');
      const rx = tag === 'circle' ? n('r') : n('rx'), ry = tag === 'circle' ? n('r') : n('ry');
      if (!(rx > 0 && ry > 0)) return null;
      if (simple) {
        const p = Mx.ap(T, pt(cx - rx, cy - ry));
        const W = 2 * rx * T[0], H = 2 * ry * T[3];
        return { kind: 'obj', o: Object.assign({ type: 'ellipse', x: p.x, y: p.y, w: W, h: H }, base), bbox: [p, pt(p.x + W, p.y + H)] };
      }
      sp = G.mapSP(G.ellipseNodes(2 * rx, 2 * ry), q => pt(q.x + cx - rx, q.y + cy - ry));
    } else if (tag === 'line') {
      const a = Mx.ap(T, pt(n('x1'), n('y1'))), b = Mx.ap(T, pt(n('x2'), n('y2')));
      if (!base.sw) return null;
      return { kind: 'obj', o: Object.assign(base, { type: 'line', p1: a, p2: b, fill: { t: 'none', c: '#000000ff' } }), bbox: [a, b] };
    } else if (tag === 'polyline' || tag === 'polygon') {
      const nums = (e.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number).filter(isFinite);
      const ps = []; for (let i = 0; i + 1 < nums.length; i += 2) ps.push({ x: nums[i], y: nums[i + 1], i: null, o: null });
      if (ps.length < 2) return null;
      sp = [{ c: tag === 'polygon', n: ps }];
    } else if (tag === 'path') {
      sp = G.parseD(e.getAttribute('d') || '');
      if (!sp.length) return null;
    } else if (tag === 'text') {
      const txt = Array.from(e.querySelectorAll('tspan')).length ? Array.from(e.childNodes).map(k => k.textContent).join('').replace(/\s+/g, ' ').trim() : (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt) return null;
      const first = e.querySelector('tspan') || e;
      const x = parseFloat((first.getAttribute('x') || e.getAttribute('x') || '0').split(/[\s,]+/)[0]) || 0;
      const y = parseFloat((first.getAttribute('y') || e.getAttribute('y') || '0').split(/[\s,]+/)[0]) || 0;
      const fsz = parseFloat(s['font-size']) || 16;
      const fsRaw = fsz * sc;
      const fam = (s['font-family'] || '').split(',')[0].replace(/['"]/g, '').trim();
      const ff = FontKit.families().find(f => norm(f) === norm(fam)) || (/serif/i.test(fam) && !/sans/i.test(fam) ? 'IBM Plex Serif' : /mono/i.test(fam) ? 'IBM Plex Mono' : 'IBM Plex Sans');
      const fwRaw = s['font-weight']; const fw = fwRaw === 'bold' ? 700 : fwRaw === 'normal' ? 400 : (parseInt(fwRaw) || 400);
      const o = Object.assign({}, base, { type: 'text', text: txt, ff, fs: rnd(fsRaw, 2), fw: FontKit.weightsOf(ff).reduce((a, b) => Math.abs(b - fw) < Math.abs(a - fw) ? b : a, 400), fi: s['font-style'] === 'italic', lh: 1.2, ls: 0, auto: 'w', ta: s['text-anchor'] === 'middle' ? 'center' : s['text-anchor'] === 'end' ? 'right' : 'left' });
      if (o.fill.t === 'none' && o.sw === 0) o.fill = { t: 'solid', c: '#000000ff' };
      const fit = TextKit.fit(o);
      const L = TextKit.layout(o);
      const p = Mx.ap(T, pt(x, y));
      const rot = Math.atan2(T[1], T[0]) / DEG;
      o.w = fit.w; o.h = fit.h;
      const ax = o.ta === 'center' ? fit.w / 2 : o.ta === 'right' ? fit.w : 0;
      // la línia base de la primera línia cau a (x, y)
      const local = pt(ax, L.base);
      const r = rot * DEG;
      const cx = p.x - (Math.cos(r) * (local.x - fit.w / 2) - Math.sin(r) * (local.y - fit.h / 2));
      const cy = p.y - (Math.sin(r) * (local.x - fit.w / 2) + Math.cos(r) * (local.y - fit.h / 2));
      o.x = cx - fit.w / 2; o.y = cy - fit.h / 2; o.rot = rnd(rot, 3);
      return { kind: 'obj', o, bbox: G.corners(o) };
    } else if (tag === 'image') {
      const href = e.getAttribute('href') || e.getAttribute('xlink:href') || '';
      if (!href.startsWith('data:image')) return null;
      const x = n('x'), y = n('y'), w = n('width'), h = n('height');
      const p = Mx.ap(T, pt(x, y));
      const rot = Math.atan2(T[1], T[0]) / DEG;
      const W = w * Math.hypot(T[0], T[1]), H = h * Math.hypot(T[2], T[3]);
      const box = { x: p.x, y: p.y, w: W, h: H, rot: 0 };
      return { kind: 'image', href, box, rot, bbox: [p, Mx.ap(T, pt(x + w, y + h)), Mx.ap(T, pt(x + w, y)), Mx.ap(T, pt(x, y + h))] };
    } else return null;
    // trajecte genèric
    const spT = G.mapSP(sp, q => Mx.ap(T, q));
    const b = G.spBBox(spT);
    if (!isFinite(b.x)) return null;
    return { kind: 'path', sp: spT, base, bbox: [pt(b.x, b.y), pt(b.x + b.w, b.y + b.h)] };
  },
  // crea els objectes al document aplicant la transformació final T
  async emit(items, pageId, T, s) {
    const st = App.store;
    const ids = [];
    for (const it of items) {
      let id = null;
      if (it.kind === 'group') {
        const kids = await this.emit(it.kids, pageId, T, s);
        if (!kids.length) continue;
        id = st.add({ type: 'group', page: pageId, name: it.name || undefined, opacity: it.opacity < 1 ? it.opacity : 1 });
        const keys = keysBetween(null, null, kids.length);
        kids.forEach((k, i) => { st.set(k, 'parent', id); st.set(k, 'z', keys[i]); });
      } else if (it.kind === 'path') {
        const sp = G.mapSP(it.sp, q => Mx.ap(T, q));
        const patch = G.pathFromPage(sp);
        const o = Object.assign({}, it.base, patch, { type: 'path', page: pageId, sw: rnd(it.base.sw * s, 3), opacity: it.opacity < 1 ? it.opacity : 1 });
        if (o.fill.t === 'none' && !(o.sw > 0)) continue;
        id = st.add(o);
      } else if (it.kind === 'image') {
        try {
          const iid = await IO.importImage(it.href, pageId, null);
          const b = it.box;
          const p = Mx.ap(T, pt(b.x, b.y));
          const nw = b.w * s, nh = b.h * s;
          const ang = it.rot * DEG;
          const c = pt(p.x + Math.cos(ang) * nw / 2 - Math.sin(ang) * nh / 2, p.y + Math.sin(ang) * nw / 2 + Math.cos(ang) * nh / 2);
          st.patch(iid, { x: c.x - nw / 2, y: c.y - nh / 2, w: nw, h: nh, rot: rnd(it.rot, 3), opacity: it.opacity < 1 ? it.opacity : 1 });
          id = iid;
        } catch (e) { }
      } else if (it.kind === 'obj') {
        const o = clone(it.o);
        o.page = pageId;
        if (o.type === 'line') { o.p1 = Mx.ap(T, o.p1); o.p2 = Mx.ap(T, o.p2); o.sw = rnd(o.sw * s, 3); }
        else {
          const c = Mx.ap(T, pt(o.x + o.w / 2, o.y + o.h / 2));
          o.w *= s; o.h *= s; o.x = c.x - o.w / 2; o.y = c.y - o.h / 2; o.sw = rnd((o.sw || 0) * s, 3);
          if (o.type === 'rect' && o.r) o.r = rnd(o.r * s, 3);
          if (o.type === 'text') { o.fs = rnd(o.fs * s, 2); const f = TextKit.fit(o); const cc = c; o.w = f.w; o.h = f.h; o.x = cc.x - o.w / 2; o.y = cc.y - o.h / 2; }
        }
        if (it.opacity < 1) o.opacity = it.opacity;
        id = st.add(o);
      }
      if (id) ids.push(id);
    }
    return ids;
  },
};
GL.SvgImport = SvgImport;

/* ── Desat automàtic (IndexedDB) ── */
const Autosave = GL.autosave = {
  db: null,
  async open() {
    if (this.db || !window.indexedDB) return this.db;
    this.db = await new Promise(res => {
      const r = indexedDB.open('guaitaLlenc', 2);
      r.onupgradeneeded = () => { const db = r.result; for (const n of ['docs', 'packs']) if (!db.objectStoreNames.contains(n)) db.createObjectStore(n, { keyPath: 'id' }); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    });
    return this.db;
  },
  async tx(mode, fn, store = 'docs') {
    const db = await this.open(); if (!db) return null;
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode); const s = t.objectStore(store);
      const r = fn(s);
      t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error);
    });
  },
  init() {
    this.queue = debounce(() => this.now(), 1500);
    App.store.on(ch => { if (ch.objs || ch.pages || ch.doc || ch.history) { if (App.store.doc) { GL.saveState(); this.queue(); } } });
    window.addEventListener('beforeunload', () => { this.queue.flush(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.queue.flush(); });
  },
  async now() {
    const st = App.store;
    if (!st.doc || this.busy) return;
    this.busy = true;
    try {
      const data = IO.serialize();
      const p0 = st.pagesSorted()[0];
      let thumb = '';
      try { thumb = R.pageSVG(p0.id, { pre: 't-' }); if (thumb.length > 400000) thumb = ''; thumb = thumb.replace(/<style>[\s\S]*?<\/style>/, ''); } catch (e) { }
      await this.tx('readwrite', s => s.put({ id: st.doc.id, name: st.props.name, updated: Date.now(), pages: Object.keys(st.doc.pages).length, data: JSON.stringify(data), thumb }));
      this.lastSaved = Date.now();
      this.autoVersion = st.version;
      GL.saveState();
    } catch (e) { console.warn('desat automàtic', e); }
    this.busy = false;
  },
  async list() {
    const all = await this.tx('readonly', s => s.getAll());
    return (all || []).sort((a, b) => b.updated - a.updated).map(({ data, ...rest }) => rest);
  },
  async get(id) { return this.tx('readonly', s => s.get(id)); },
  async remove(id) { return this.tx('readwrite', s => s.delete(id)); },
};
GL.saveState = function () {
  const st = App.store, e = $('#saveState');
  if (!e || !st.doc) return;
  const fileSaved = st.savedVersion === st.version;
  const autoSaved = Autosave.autoVersion === st.version;
  e.className = 'save-state ' + (fileSaved ? 'saved' : autoSaved ? '' : 'dirty');
  e.setAttribute('data-tip', fileSaved ? 'Desat al fitxer' : autoSaved ? 'Desat automàticament en aquest navegador · Ctrl+S per desar el fitxer' : 'Canvis pendents de desar');
};

/* ── Porta-retalls ── */
const CLIP_MARK = 'guaitaLlenc/clip';
const Clip = GL.clip = {
  data: null,
  init() {
    document.addEventListener('copy', e => { if (this.skip(e)) return; if (!App.sel.length) return; e.preventDefault(); this.copy(e.clipboardData); });
    document.addEventListener('cut', e => { if (this.skip(e)) return; if (!App.sel.length) return; e.preventDefault(); this.copy(e.clipboardData); App.store.begin('Retalla'); App.store.del(App.sel); App.store.commit(); });
    document.addEventListener('paste', e => { if (this.skip(e)) return; e.preventDefault(); this.paste(e.clipboardData); });
  },
  skip(e) { const t = e.target; return !App.store.doc || (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) || $('.veil'); },
  copy(dt) {
    const data = cloneTree(App.sel);
    data.mark = CLIP_MARK; data.page = App.pageId; data.stamp = uid();
    data.box = G.selBox(App.sel);
    this.data = data;
    const json = JSON.stringify(data);
    if (dt) { dt.setData('text/plain', json); try { dt.setData('image/svg+xml', ''); } catch (e) { } }
    else if (navigator.clipboard) navigator.clipboard.writeText(json).catch(() => { });
  },
  async paste(dt, inPlace) {
    const st = App.store;
    if (dt) {
      const files = Array.from(dt.files || []);
      if (files.length) { await IO.importFiles(files, App.pasteAt()); return; }
      const txt = dt.getData('text/plain');
      if (txt) return this.pasteText(txt, inPlace);
      const html = dt.getData('text/html');
      if (html && /<svg/i.test(html)) return this.pasteText(html.slice(html.search(/<svg/i)), inPlace);
    } else if (this.data) this.pasteData(this.data, inPlace);
  },
  async pasteText(txt, inPlace) {
    const st = App.store;
    if (txt.includes(CLIP_MARK)) { try { const d = JSON.parse(txt); if (d.mark === CLIP_MARK) return this.pasteData(this.data && this.data.stamp === d.stamp ? this.data : d, inPlace); } catch (e) { } }
    if (/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(txt)) { st.begin('Enganxa SVG'); const id = await IO.importSVGText(txt, App.pageId, App.pasteAt(), 'SVG enganxat'); st.commit(); if (id) App.select([id]); return; }
    // text pla → objecte de text
    const p = App.pasteAt() || pt(App.page().w / 2, App.page().h / 2);
    const o = Object.assign({ type: 'text', page: App.pageId, text: txt.slice(0, 20000), ff: 'IBM Plex Sans', fs: 24, fw: 400, lh: 1.25, ls: 0, ta: 'left', auto: txt.length > 60 ? 'h' : 'w', w: Math.min(App.page().w * 0.6, 520) }, newStyle('text'));
    const f = TextKit.fit(o); o.w = f.w; o.h = f.h; o.x = p.x - o.w / 2; o.y = p.y - o.h / 2;
    st.begin('Enganxa text'); const id = st.add(o); st.commit();
    App.select([id]);
  },
  pasteData(d, inPlace) {
    const st = App.store;
    let dx = 0, dy = 0;
    // al mateix lloc a una altra pàgina; desplaçat si és la mateixa
    if (!inPlace && d.page === App.pageId) { d._n = (d._n || 0) + 1; dx = dy = 10 * d._n; }
    st.begin('Enganxa');
    const ids = insertTree(d, App.pageId, dx, dy);
    st.commit();
    App.select(ids);
    setTool('select');
  },
};
// punt d'enganxat: el cursor si és sobre la pàgina activa
App.pasteAt = function () {
  if (!this.cursorS) return null;
  const p = this.s2p(this.cursorS);
  const pg = this.page();
  if (p.x < 0 || p.y < 0 || p.x > pg.w || p.y > pg.h) return null;
  return p;
};

/* ── Arrossegar i deixar anar fitxers ── */
const Drop = {
  init() {
    const veil = $('#dropVeil');
    let depth = 0;
    const has = e => Array.from((e.dataTransfer && e.dataTransfer.types) || []).includes('Files');
    window.addEventListener('dragenter', e => { if (!has(e)) return; e.preventDefault(); depth++; if (App.store.doc && !$('.veil')) veil.hidden = false; });
    window.addEventListener('dragleave', e => { if (!has(e)) return; depth = Math.max(0, depth - 1); if (!depth) veil.hidden = true; });
    window.addEventListener('dragover', e => { if (has(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
    window.addEventListener('drop', async e => {
      if (!has(e)) return;
      e.preventDefault(); depth = 0; veil.hidden = true;
      if ($('.veil') && !$('.start')) return;
      const files = Array.from(e.dataTransfer.files);
      if (!files.length) return;
      // documents: obre; la resta: importa
      const docFile = files.find(f => /\.(llenc|json)$/i.test(f.name));
      if (docFile || !App.store.doc || $('.start')) { await IO.openFile(docFile || files[0]); if (files.length > 1 && App.store.doc) await IO.importFiles(files.filter(f => f !== (docFile || files[0]))); return; }
      // un sol SVG/PNG editable de guaitaLlenç s'importa com a contingut (no substitueix el document)
      const r = App.stage.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientY >= r.top;
      let at = null;
      if (inside) {
        const w = App.s2w(pt(e.clientX - r.left, e.clientY - r.top));
        const pg = App.pageAt(w);
        if (pg) { if (pg !== App.pageId) App.setPage(pg, { keepView: true }); at = App.w2p(w, pg); }
      }
      await IO.importFiles(files, at);
    });
  },
};
GL.drop = Drop;
