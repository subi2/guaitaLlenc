// Proves unitàries de guaitaLlenç amb jsdom
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const vc = new VirtualConsole();
vc.on('error', e => { if (!/Not implemented/.test(String(e))) console.error(e); });
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message || e))) console.error(e.message || e); });
vc.on('warn', m => console.warn(m));

const HTML = fs.readFileSync(new URL('../dist/guaitaLlenc-v0.13.0.html', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const fails = [];
function ok(c, msg) { if (c) pass++; else { fail++; fails.push(msg); } }
function near(a, b, eps = 1e-3) { return Math.abs(a - b) <= eps; }
async function test(name, fn) {
  try { await fn(); } catch (e) { fail++; fails.push(name + ' → ' + (e.stack || e)); }
}

const dom = new JSDOM(HTML, {
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://localhost/',
  beforeParse(w) {
    w.__GL_TEST__ = true;
    w.ResizeObserver = class { observe() { } disconnect() { } };
    w.matchMedia = () => ({ matches: false, addEventListener() { } });
    w.CompressionStream = globalThis.CompressionStream;
    w.DecompressionStream = globalThis.DecompressionStream;
    w.TextEncoder = globalThis.TextEncoder; w.TextDecoder = globalThis.TextDecoder;
    w.queueMicrotask = globalThis.queueMicrotask;
    w.HTMLElement.prototype.scrollIntoView = function () { };
    w.HTMLCanvasElement.prototype.getContext = function () { return null; };
  },
});
const w = dom.window;
const GL = w.GL;
// streams de Node per a la compressió
w.Blob = globalThis.Blob; w.Response = globalThis.Response;
const flush = () => new Promise(r => setTimeout(r, 30));

await test('arrencada', async () => {
  await GL.boot();
  ok(!!GL.app && !!GL.store, 'app i store creats');
  const doc = GL.Store.blankDoc({ unit: 'mm' });
  GL.app.loadDoc(doc, []);
  ok(GL.store.pagesSorted().length === 1, 'document amb una pàgina');
});

/* ── utilitats ── */
await test('índexs fraccionaris', () => {
  let keys = [GL.keyBetween(null, null)];
  for (let i = 0; i < 200; i++) keys.push(GL.keyBetween(keys[keys.length - 1], null));
  for (let i = 0; i < 200; i++) keys.unshift(GL.keyBetween(null, keys[0]));
  let a = keys[100], b = keys[101];
  for (let i = 0; i < 60; i++) { const m = GL.keyBetween(a, b); ok(a < m && m < b, 'clau entre ' + a + ' i ' + b); b = m; }
  ok(keys.every((k, i) => i === 0 || keys[i - 1] < k), 'ordre creixent');
  ok(!keys.some(k => k.endsWith('0')), 'sense zeros finals');
  const ks = GL.keysBetween('V', 'W', 5);
  ok(ks.length === 5 && ks.every((k, i) => k > 'V' && k < 'W' && (i === 0 || ks[i - 1] < k)), 'keysBetween');
});
await test('expressions', () => {
  const E = GL.evalExpr;
  ok(E('12,5') === 12.5, 'coma decimal');
  ok(E('10+5*2') === 20, 'precedència');
  ok(E('(10+5)*2') === 30, 'parèntesis');
  ok(E('-4') === -4, 'negatiu');
  ok(E('50%', { ref: 200 }) === 100, 'percentatge');
  ok(near(E('10mm', { unit: 'cm' }), 1), 'unitats');
  ok(near(E('1in', { unit: 'mm' }), 25.4), 'polzades a mm');
  ok(isNaN(E('alert(1)')), 'rebutja codi');
  ok(isNaN(E('3+')), 'rebutja incomplet');
  ok(isNaN(E('')), 'buit');
});
await test('colors', () => {
  ok(GL.hexA('#abc') === '#aabbccff', 'hex curt');
  ok(GL.hexA('#AABBCC') === '#aabbccff', 'hex llarg');
  ok(GL.parseCssColor('rgb(255, 0, 0)') === '#ff0000ff', 'rgb');
  ok(GL.parseCssColor('rgba(0,0,255,.5)') === '#0000ff80', 'rgba');
  ok(GL.parseCssColor('white') === '#ffffffff', 'nom');
  ok(GL.parseCssColor('transparent') === '#00000000', 'transparent');
  const c = GL.rgbaOf('#11223380'); ok(c.r === 17 && c.g === 34 && c.b === 51 && near(c.a, 128 / 255), 'rgbaOf');
});
await test('crc32', () => { ok(GL.crc32(new TextEncoder().encode('123456789')) === 0xcbf43926, 'crc estàndard'); });

/* ── model ── */
await test('model: afegir, canviar, eliminar, desfer', async () => {
  const st = GL.store, pg = GL.app.pageId;
  st.begin('t'); const id = st.add({ type: 'rect', page: pg, x: 10, y: 20, w: 100, h: 50, fill: { t: 'solid', c: '#ff0000ff' } }); st.commit();
  ok(st.obj(id) && st.obj(id).z, 'objecte creat amb z');
  st.begin('t'); st.set(id, 'x', 50); st.set(id, 'x', 60); st.set(id, 'x', 70); st.commit();
  ok(st.obj(id).x === 70, 'valor final');
  const last = st.undoStack[st.undoStack.length - 1];
  ok(last.fwd.length === 1, 'compactació de canvis repetits');
  st.undo(); ok(st.obj(id).x === 10, 'desfer restaura');
  st.redo(); ok(st.obj(id).x === 70, 'refer');
  st.begin('d'); st.del([id]); st.commit();
  ok(!st.obj(id), 'eliminat');
  st.undo(); ok(st.obj(id) && st.obj(id).x === 70, 'desfer eliminació');
  st.begin('d'); st.del([id]); st.commit();
});
await test('model: grups i eliminació en cascada', () => {
  const st = GL.store, pg = GL.app.pageId;
  st.begin('g');
  const a = st.add({ type: 'rect', page: pg, x: 0, y: 0, w: 10, h: 10 });
  const b = st.add({ type: 'rect', page: pg, x: 20, y: 0, w: 10, h: 10 });
  st.commit();
  GL.app.select([a, b]);
  GL.Cmd.run('obj.group');
  const gid = GL.app.sel[0];
  ok(st.obj(gid).type === 'group' && st.children(gid).length === 2, 'grup amb 2 fills');
  const box = GL.G.aabb(st.obj(gid));
  ok(near(box.x, 0) && near(box.w, 30), 'caixa del grup');
  GL.Cmd.run('edit.delete');
  ok(!st.obj(gid) && !st.obj(a) && !st.obj(b), 'elimina en cascada');
  GL.Cmd.run('edit.undo');
  ok(st.obj(gid) && st.obj(a) && st.obj(b) && st.obj(a).parent === gid, 'desfer restaura jerarquia');
  GL.app.select([gid]);
  GL.Cmd.run('obj.ungroup');
  ok(!st.obj(gid) && st.obj(a).parent === pg, 'desagrupa');
  GL.app.select([a, b]); GL.Cmd.run('edit.delete');
});
await test('model: LWW remot', () => {
  const st = GL.store, pg = GL.app.pageId;
  st.begin('x'); const id = st.add({ type: 'rect', page: pg, x: 0, y: 0, w: 10, h: 10 }); st.commit();
  st.begin('x'); st.set(id, 'x', 5); st.commit();
  const l = st.clock;
  ok(!st.applyRemote({ c: 'o', t: 'set', id, k: 'x', v: 99, l: l - 1, a: 'zzz' }) || st.obj(id).x === 5, 'operació antiga ignorada');
  ok(st.obj(id).x === 5, 'conserva el valor més nou');
  st.applyRemote({ c: 'o', t: 'set', id, k: 'x', v: 42, l: l + 5, a: 'zzz' });
  ok(st.obj(id).x === 42 && st.clock >= l + 5, 'operació nova aplicada i rellotge avançat');
  st.begin('x'); st.del([id]); st.commit();
});
await test('model: ordre z i reordenació', () => {
  const st = GL.store, pg = GL.app.pageId;
  st.begin('z');
  const ids = [0, 1, 2, 3].map(i => st.add({ type: 'rect', page: pg, x: i * 20, y: 0, w: 10, h: 10 }));
  st.commit();
  GL.app.select([ids[0]]); GL.Cmd.run('arr.front');
  let order = st.children(pg).map(o => o.id);
  ok(order[order.length - 1] === ids[0], 'porta al davant');
  GL.app.select([ids[0]]); GL.Cmd.run('arr.back');
  order = st.children(pg).map(o => o.id);
  ok(order[0] === ids[0], 'envia al fons');
  GL.app.select([ids[0]]); GL.Cmd.run('arr.forward');
  order = st.children(pg).map(o => o.id);
  ok(order[1] === ids[0], 'endavant un pas');
  GL.app.select([ids[2]]); GL.Cmd.run('arr.backward');
  order = st.children(pg).map(o => o.id);
  ok(order.join() === [ids[1], ids[2], ids[0], ids[3]].join(), 'enrere un pas');
  GL.app.select(ids); GL.Cmd.run('edit.delete');
});
await test('alinea i distribueix', () => {
  const st = GL.store, pg = GL.app.pageId;
  st.begin('a');
  const a = st.add({ type: 'rect', page: pg, x: 0, y: 0, w: 10, h: 10 });
  const b = st.add({ type: 'rect', page: pg, x: 50, y: 30, w: 20, h: 10 });
  const c = st.add({ type: 'rect', page: pg, x: 200, y: 60, w: 10, h: 10 });
  st.commit();
  GL.app.select([a, b, c]);
  GL.Cmd.run('align.top');
  ok(st.obj(a).y === 0 && st.obj(b).y === 0 && st.obj(c).y === 0, 'alinea a dalt');
  GL.Cmd.run('align.distH');
  const ga = st.obj(b).x - (st.obj(a).x + 10), gb = st.obj(c).x - (st.obj(b).x + 20);
  ok(near(ga, gb), 'espais iguals');
  GL.app.select([a]);
  GL.Cmd.run('align.hcenter');
  ok(near(st.obj(a).x + 5, GL.app.page().w / 2), 'centra a la pàgina');
  GL.app.select([a, b, c]); GL.Cmd.run('edit.delete');
});
await test('duplica i enganxa', () => {
  const st = GL.store, pg = GL.app.pageId;
  st.begin('d'); const a = st.add({ type: 'ellipse', page: pg, x: 10, y: 10, w: 30, h: 30 }); st.commit();
  GL.app.select([a]);
  GL.Cmd.run('edit.duplicate');
  const d = GL.app.sel[0];
  ok(d !== a && st.obj(d).type === 'ellipse' && st.obj(d).x === 20, 'duplicat desplaçat');
  ok(st.obj(d).z > st.obj(a).z, 'duplicat a sobre');
  GL.clip.copy();
  GL.clip.pasteData(GL.clip.data);
  ok(GL.app.sel[0] !== d && st.obj(GL.app.sel[0]).x === 30, 'enganxa desplaçat');
  GL.app.select(st.children(pg).map(o => o.id)); GL.Cmd.run('edit.delete');
});

/* ── geometria ── */
await test('transformacions', () => {
  const G = GL.G, Mx = GL.Mx;
  const o = { id: 'a', type: 'rect', x: 0, y: 0, w: 100, h: 50, rot: 0, fx: 1, fy: 1 };
  const T = Mx.chain(Mx.tr(0, 0), Mx.sc(2, 3));
  const p = G.transformObj(o, T, {})['a'];
  ok(near(p.w, 200) && near(p.h, 150) && near(p.x, 0) && near(p.y, 0), 'escala');
  const m = G.transformObj(o, Mx.sc(-1, 1), {})['a'];
  ok(near(m.x, -100) && near(m.w, 100) && Math.abs(Math.abs(m.rot) - 180) < 1e-6 && m.fy === -1, 'reflexió');
  // la reflexió ha de deixar els vèrtexs en el lloc correcte
  const pm = Object.assign({}, o, m);
  const cs = G.corners(pm).map(q => Mx.ap(G.matrix(pm), { x: 0, y: 0 }));
  const tl = Mx.ap(G.matrix(pm), { x: 0, y: 0 });
  ok(near(tl.x, 0) && near(tl.y, 0), 'origen local reflectit a la dreta');
  void cs;
  const r = G.rotateObj(o, { x: 50, y: 25 }, 90, {})['a'];
  ok(near(r.rot, 90) && near(r.x, 0) && near(r.y, 0), 'rotació sobre el centre');
});
await test('trajectes: anada i tornada', () => {
  const G = GL.G;
  const sp = [{ c: true, n: [{ x: 10, y: 10, i: null, o: { x: 30, y: 0 } }, { x: 60, y: 20, i: { x: 50, y: 0 }, o: null }, { x: 40, y: 70, i: null, o: null }] }];
  for (const [rot, fx, fy] of [[0, 1, 1], [30, 1, 1], [-75, -1, 1], [120, 1, -1]]) {
    const p = G.pathFromPage(sp, rot, fx, fy);
    const o = Object.assign({ id: 'p', type: 'path' }, p);
    const back = G.pageSP(o);
    let maxd = 0;
    back[0].n.forEach((n, i) => { const q = sp[0].n[i]; maxd = Math.max(maxd, Math.hypot(n.x - q.x, n.y - q.y)); if (q.o) maxd = Math.max(maxd, Math.hypot(n.o.x - q.o.x, n.o.y - q.o.y)); });
    ok(maxd < 1e-3, `trajecte conservat (rot ${rot}, f ${fx},${fy}) · ${maxd}`);
  }
});
await test('parseD', () => {
  const G = GL.G;
  let sp = G.parseD('M10 10 L20 10 L20 20 Z');
  ok(sp.length === 1 && sp[0].c && sp[0].n.length === 3, 'polígon tancat');
  sp = G.parseD('m0 0 h10 v10 h-10 z m20 0 l5 5');
  ok(sp.length === 2 && sp[1].n[0].x === 20 && sp[1].n[1].x === 25, 'relatius i subtrajectes');
  sp = G.parseD('M0 0 C10 0 20 10 20 20 S30 40 40 40');
  ok(sp[0].n.length === 3 && sp[0].n[1].o && Math.abs(sp[0].n[1].o.x - 20) < 1e-9 && Math.abs(sp[0].n[1].o.y - 30) < 1e-9, 'corba suau S reflectida');
  sp = G.parseD('M0 0 Q10 10 20 0 T40 0');
  ok(sp[0].n.length === 3, 'quadràtiques');
  sp = G.parseD('M0 0 A10 10 0 0 1 20 0');
  const b = G.spBBox(sp);
  ok(near(b.w, 20, 0.05) && near(b.h, 10, 0.05), 'arc semicircular: ' + JSON.stringify(b));
  sp = G.parseD('M0,0a5,5 0 1 1 10,0a5,5 0 1 1 -10,0');
  ok(near(G.spBBox(sp).w, 10, 0.05), 'arcs amb comes');
  sp = G.parseD('M0 0a5 5 0 1010 0');
  ok(sp[0].n.length >= 2, 'indicadors enganxats');
});
await test('dividir segment', () => {
  const G = GL.G;
  const sp = [{ c: false, n: [{ x: 0, y: 0, i: null, o: { x: 0, y: 50 } }, { x: 100, y: 0, i: { x: 100, y: 50 }, o: null }] }];
  const before = G.spBBox(sp);
  const k = G.splitAt(sp, 0, 0, 0.5);
  ok(k === 1 && sp[0].n.length === 3, 'node inserit');
  ok(near(sp[0].n[1].x, 50) && near(sp[0].n[1].y, 37.5), 'punt al mig de la corba');
  const after = G.spBBox(sp);
  ok(near(before.w, after.w) && near(before.h, after.h), 'forma conservada');
  const nn = G.nearestOnSP(sp, { x: 50, y: 40 });
  ok(nn && nn.d < 3, 'proximitat al traç');
});
await test('formes a trajecte', () => {
  const G = GL.G;
  for (const o of [{ type: 'rect', x: 0, y: 0, w: 100, h: 60, r: 10 }, { type: 'rect', x: 0, y: 0, w: 100, h: 60, r: [0, 20, 0, 5] }, { type: 'ellipse', x: 0, y: 0, w: 80, h: 40 }, { type: 'star', x: 0, y: 0, w: 50, h: 50, n: 5, ratio: 0.5 }]) {
    const p = G.toPath(o);
    const b = G.spBBox(p.sp);
    ok(near(b.w, o.w, 0.5) && near(b.h, o.h, 0.5), o.type + ' conserva la caixa ' + JSON.stringify(b));
  }
});

/* ── text ── */
await test('maquetació de text', () => {
  const T = GL.TextKit;
  const o = { text: 'una dues tres quatre cinc', ff: 'IBM Plex Sans', fs: 10, fw: 400, lh: 1.2, ls: 0, auto: 'h', w: 60 };
  const L = T.layout(o);
  ok(L.lines.length > 1, 'ajust de línia');
  ok(L.lines.every((s, i) => L.widths[i] <= 60.01 || !s.includes(' ')), 'cap línia supera l\'amplada');
  ok(near(L.h, L.lines.length * 12), 'alçada = línies × interlineat');
  const o2 = Object.assign({}, o, { auto: 'w', text: 'a\nbb\nccc' });
  ok(T.layout(o2).lines.length === 3, 'salts de línia');
  const o3 = Object.assign({}, o, { text: 'supercalifragilisticexpialidocious', w: 30 });
  ok(T.layout(o3).lines.length > 1, 'paraules llargues trencades');
  ok(T.caseOf({ tt: 'upper' }, 'això') === 'AIXÒ', 'majúscules catalanes');
});

/* ── render i exportació ── */
await test('SVG de pàgina', async () => {
  const st = GL.store, pg = GL.app.pageId;
  st.begin('r');
  st.add({ type: 'rect', page: pg, x: 10, y: 10, w: 50, h: 40, r: 4, fill: { t: 'linear', a: 45, s: [{ o: 0, c: '#ff0000ff' }, { o: 1, c: '#0000ff80' }] }, stroke: { t: 'solid', c: '#000000ff' }, sw: 2, dash: 'dash', shadow: { on: true, x: 2, y: 2, b: 4, c: '#00000040' } });
  st.add({ type: 'text', page: pg, x: 10, y: 80, w: 100, h: 20, text: 'Hola <&> "món"', ff: 'IBM Plex Sans', fs: 16, fw: 700, lh: 1.25, ls: 0.02, auto: 'w', fill: { t: 'solid', c: '#111111ff' } });
  st.add({ type: 'line', page: pg, p1: { x: 0, y: 0 }, p2: { x: 100, y: 100 }, stroke: { t: 'solid', c: '#000000ff' }, sw: 2, ae: 'tri', as: 'circle' });
  st.add({ type: 'star', page: pg, x: 100, y: 100, w: 40, h: 40, n: 6, ratio: 0.4, fill: { t: 'radial', s: [{ o: 0, c: '#ffffffff' }, { o: 1, c: '#000000ff' }] }, opacity: 0.5, blend: 'multiply' });
  st.commit();
  const svg = GL.R.pageSVG(pg);
  const d = new w.DOMParser().parseFromString(svg, 'image/svg+xml');
  ok(!d.querySelector('parsererror'), 'SVG ben format');
  ok(svg.includes('viewBox="0 0 '), 'viewBox');
  ok(svg.includes('linearGradient') && svg.includes('radialGradient'), 'degradats');
  ok(svg.includes('Hola &lt;&amp;&gt; &quot;món&quot;'), 'text escapat');
  ok(svg.includes("@font-face{font-family:'IBM Plex Sans';font-style:normal;font-weight:700"), 'tipografia incrustada');
  ok(!svg.includes('class="hit"'), 'sense zones de clic');
  ok(svg.includes('mix-blend-mode:multiply') && svg.includes('opacity="0.5"'), 'opacitat i fusió');
  ok(svg.includes('<filter'), 'filtre d\'ombra');
  const ed = await GL.io.svgFor(pg, { editable: true });
  ok(/<guaita:llenc[^>]*>[A-Za-z0-9+/=]+<\/guaita:llenc>/.test(ed), 'SVG editable amb document incrustat');
  const back = await GL.io.fromSVG(ed);
  ok(back && back.doc && Object.keys(back.doc.objs).length === Object.keys(st.doc.objs).length, 'recupera el document de l\'SVG');
});
await test('serialització', () => {
  const data = GL.io.serialize();
  const txt = JSON.stringify(data);
  const back = GL.io.parse(txt);
  ok(back.format === 'guaitaLlenc' && back.version === '0.13.0', 'format i versió');
  ok(Object.keys(back.doc.objs).length === Object.keys(GL.store.doc.objs).length, 'mateixos objectes');
  let threw = false; try { GL.io.parse('{"a":1}'); } catch (e) { threw = true; }
  ok(threw, 'rebutja fitxers aliens');
});
await test('PNG editable (blocs)', async () => {
  // PNG mínim 1×1
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const png = Uint8Array.from(Buffer.from(b64, 'base64'));
  const payload = await GL.deflate(new TextEncoder().encode(JSON.stringify(GL.io.serialize({ noLog: true }))));
  const key = new TextEncoder().encode('guaitaLlenc');
  const data = new Uint8Array(key.length + 2 + payload.length);
  data.set(key); data.set(payload, key.length + 2);
  const out = GL.pngInsertChunk(png, 'zTXt', data);
  const ch = GL.pngChunks(out);
  ok(ch.map(c => c.type).join(',') === 'IHDR,IDAT,zTXt,IEND', 'ordre dels blocs: ' + ch.map(c => c.type).join(','));
  const z = ch.find(c => c.type === 'zTXt');
  const crc = new DataView(out.buffer).getUint32(z.at + 8 + z.data.length);
  ok(crc === GL.crc32(out.subarray(z.at + 4, z.at + 8 + z.data.length)), 'CRC correcte');
  const back = await GL.io.fromPNG(out);
  ok(back && Object.keys(back.doc.objs).length === Object.keys(GL.store.doc.objs).length, 'recupera el document del PNG');
  const phys = new Uint8Array(9);
  const out2 = GL.pngInsertChunk(out, 'pHYs', phys);
  ok(GL.pngChunks(out2).map(c => c.type).join(',') === 'IHDR,pHYs,IDAT,zTXt,IEND', 'pHYs abans d\'IDAT');
});
await test('ZIP', async () => {
  const z = await GL.makeZip([{ name: 'a.txt', blob: new Blob(['hola']) }, { name: 'b.txt', blob: new Blob(['món']) }]);
  const u = new Uint8Array(await z.arrayBuffer());
  const dv = new DataView(u.buffer);
  ok(dv.getUint32(0, true) === 0x04034b50, 'capçalera local');
  const end = u.length - 22;
  ok(dv.getUint32(end, true) === 0x06054b50 && dv.getUint16(end + 10, true) === 2, 'directori central amb 2 entrades');
});
await test('importació SVG', async () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="100" viewBox="0 0 400 200">
    <style>.a{fill:#ff0000}.b{stroke:#00f;stroke-width:4;fill:none}</style>
    <defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><circle id="dot" r="5"/></defs>
    <rect class="a" x="0" y="0" width="100" height="50" rx="5"/>
    <g transform="translate(200 0) rotate(45)"><rect x="0" y="0" width="40" height="40" fill="url(#g)"/><circle cx="50" cy="50" r="10" class="b"/></g>
    <path d="M10 150 C 50 100 100 200 150 150" class="b"/>
    <use xlink:href="#dot" x="300" y="150" fill="green"/>
    <text x="10" y="190" font-size="20" font-family="Georgia">Hola</text>
    <rect x="0" y="0" width="10" height="10" style="display:none"/>
  </svg>`;
  const res = GL.SvgImport.parse(svg);
  ok(res && res.items.length === 5, 'elements de primer nivell: ' + (res && res.items.length));
  const kinds = res.items.map(i => i.kind + ':' + (i.o ? i.o.type : ''));
  ok(kinds[0] === 'obj:rect' && near(res.items[0].o.w, 50) && near(res.items[0].o.r, 2.5), 'rectangle escalat pel viewBox');
  ok(res.items[0].o.fill.c === '#ff0000ff', 'estil de classe CSS');
  ok(res.items[1].kind === 'group' && res.items[1].kids[0].kind === 'path' && res.items[1].kids[0].base.fill.t === 'linear', 'grup rotat → trajectes amb degradat');
  ok(res.items[2].kind === 'path' && near(res.items[2].base.sw, 2), 'gruix escalat');
  ok(res.items[4].kind === 'obj' && res.items[4].o.type === 'text' && res.items[4].o.ff === 'Georgia', 'text');
  const st = GL.store, pg = GL.app.pageId;
  const n0 = Object.keys(st.doc.objs).length;
  st.begin('i'); const gid = await GL.io.importSVGText(svg, pg, null, 'prova'); st.commit();
  ok(st.obj(gid).type === 'group' && Object.keys(st.doc.objs).length > n0 + 4, 'objectes creats al document');
  const b = GL.G.aabb(st.obj(gid));
  const page = GL.app.page();
  ok(near(b.x + b.w / 2, page.w / 2, 1) && near(b.y + b.h / 2, page.h / 2, 1), 'centrat a la pàgina');
});
await test('pàgines', async () => {
  const st = GL.store;
  const n = st.pagesSorted().length;
  GL.Cmd.run('page.add');
  ok(st.pagesSorted().length === n + 1 && GL.app.pageId === st.pagesSorted()[n].id, 'pàgina nova activa');
  const p2 = GL.app.pageId;
  st.begin('p'); const r = st.add({ type: 'rect', page: p2, x: 1, y: 1, w: 5, h: 5 }); st.commit();
  GL.Cmd.run('page.dup');
  const p3 = GL.app.pageId;
  ok(p3 !== p2 && st.children(p3).length === 1 && st.children(p3)[0].id !== r, 'duplica amb contingut');
  GL.app.select([st.children(p3)[0].id]);
  GL.moveToPage(GL.app.sel, st.pagesSorted()[0].id, false);
  ok(st.children(p3).length === 0, 'mou a una altra pàgina');
  GL.movePage(p3, st.pagesSorted()[0].id, 'before');
  ok(st.pagesSorted()[0].id === p3, 'reordena pàgines');
});

await test('v0.11: colors amb nom i paletes', async () => {
  const st = GL.store, pg = GL.app.pageId, L = GL.lib;
  ok(st.props.colors.length === 6 && st.props.tstyles.length >= 7, 'document amb colors i estils per defecte');
  st.begin('c'); const id = st.add({ type: 'rect', page: pg, x: 0, y: 0, w: 10, h: 10, fill: { t: 'solid', c: '#000000ff' } }); st.commit();
  GL.app.select([id]); L.applyColorToSel('c3');
  ok(st.obj(id).fill.ref === 'c3', 'color enllaçat');
  L.applyPalette('bosc');
  ok(GL.R.resolve(st.obj(id).fill) === '#d9a441ff', 'la paleta recoloreja: ' + GL.R.resolve(st.obj(id).fill));
  ok(GL.R.pageSVG(pg).includes('#d9a441'), 'exportació amb el color resolt');
  st.begin('x'); L.setColor('c3', '#ff0000ff'); st.commit();
  ok(GL.R.resolve(st.obj(id).fill) === '#ff0000ff', 'editar el color propaga');
  st.begin('x'); L.removeColor('c3'); st.commit();
  ok(!st.obj(id).fill.ref && st.obj(id).fill.c === '#ff0000ff', 'eliminar desenllaça conservant el color');
  GL.Cmd.run('edit.undo'); GL.Cmd.run('edit.undo');
  ok(st.obj(id).fill.ref === 'c3', 'desfer restaura l\'enllaç');
  GL.app.select([id]); GL.Cmd.run('edit.delete');
});
await test('v0.11: estils de text', () => {
  const st = GL.store, pg = GL.app.pageId, L = GL.lib;
  st.begin('t');
  const a = st.add({ type: 'text', page: pg, x: 0, y: 0, w: 10, h: 10, text: 'A', ff: 'IBM Plex Sans', fs: 12, fw: 400, lh: 1.2, ls: 0, auto: 'w' });
  const b = st.add({ type: 'text', page: pg, x: 0, y: 50, w: 10, h: 10, text: 'B', ff: 'IBM Plex Sans', fs: 12, fw: 400, lh: 1.2, ls: 0, auto: 'w' });
  st.commit();
  L.applyTStyle('t1', [st.obj(a), st.obj(b)]);
  const t1 = L.tstyles().find(s => s.id === 't1');
  ok(st.obj(a).ts === 't1' && st.obj(a).fs === t1.fs && st.obj(a).fw === 700, 'estil aplicat');
  st.begin('m'); st.set(a, 'fs', 99); st.set(a, 'ff', 'IBM Plex Serif'); st.commit();
  L.updateTStyle('t1', st.obj(a));
  ok(st.obj(b).fs === 99 && st.obj(b).ff === 'IBM Plex Serif', 'actualitzar l\'estil propaga als enllaçats');
  const nid = L.newTStyle(st.obj(b));
  ok(st.obj(b).ts === nid && L.tstyles().some(s => s.id === nid), 'estil nou des d\'un text');
  L.removeTStyle(nid);
  ok(!st.obj(b).ts, 'eliminar l\'estil desenllaça');
  GL.app.select([a, b]); GL.Cmd.run('edit.delete');
});
await test('v0.11: camps variables', () => {
  const st = GL.store, L = GL.lib;
  st.begin('f'); st.setDoc('name', 'Projecte X'); st.setDoc('author', 'Jordi'); st.setDoc('fields', { assignatura: 'Representació' }); st.commit();
  const pg = GL.app.pageId;
  st.begin('t'); const id = st.add({ type: 'text', page: pg, x: 0, y: 0, w: 10, h: 10, text: '{títol} · {autor} · {assignatura} · {pàgina}/{pàgines} · {desconegut}', ff: 'IBM Plex Sans', fs: 12, fw: 400, lh: 1.2, ls: 0, auto: 'w' }); st.commit();
  const n = st.pagesSorted().length, i = st.pagesSorted().findIndex(p => p.id === pg) + 1;
  ok(L.fieldText(st.obj(id)) === `Projecte X · Jordi · Representació · ${i}/${n} · {desconegut}`, 'substitució: ' + L.fieldText(st.obj(id)));
  ok(GL.R.pageSVG(pg).includes('Projecte X · Jordi'), 'camps a l\'exportació');
  ok(st.obj(id).text.includes('{títol}'), 'el text original es conserva');
  GL.app.select([id]); GL.Cmd.run('edit.delete');
});
await test('v0.11: plantilles', () => {
  const st = GL.store, L = GL.lib;
  ok(L.TEMPLATES.length >= 25, 'nombre de plantilles: ' + L.TEMPLATES.length);
  for (const t of L.TEMPLATES) {
    const svg = L.preview(t);
    const d = new w.DOMParser().parseFromString(svg, 'image/svg+xml');
    ok(svg.length > 200 && !d.querySelector('parsererror'), 'vista prèvia vàlida: ' + t.id);
  }
  const n0 = st.pagesSorted().length;
  const set = L.TEMPLATES.find(t => t.id === 'pres-set');
  L.insertTemplate(set);
  ok(st.pagesSorted().length === n0 + 6, 'insereix 6 pàgines');
  ok(st.children(GL.app.pageId).length > 3, 'pàgina amb contingut');
  const cx = L.TEMPLATES.find(t => t.id === 'lamina-a3');
  L.insertTemplate(cx);
  const texts = Object.values(st.doc.objs).filter(o => o.page === GL.app.pageId && o.type === 'text');
  ok(texts.some(o => o.text === '{títol}'), 'caixetí amb camps');
  ok(Object.values(st.doc.objs).some(o => o.page === GL.app.pageId && o.fill && o.fill.ref), 'objectes enllaçats a la paleta');
});
await test('v0.11: símbols', async () => {
  const L = GL.lib;
  const syms = L.symbols();
  ok(syms.length >= 120, 'nombre de símbols: ' + syms.length);
  let bad = 0;
  for (const s of syms) { const r = GL.SvgImport.parse(s.svg); if (!r || !r.items.length) bad++; }
  ok(bad === 0, 'tots els símbols s\'importen (' + bad + ' errors)');
  const st = GL.store, n0 = Object.keys(st.doc.objs).length;
  await L.insertSymbol(syms.find(s => s.id === 'nord'));
  ok(Object.keys(st.doc.objs).length > n0, 'símbol inserit');
  const o = st.obj(GL.app.sel[0]);
  ok(o && o.name === 'Nord', 'nom del símbol');
});

await test('v0.12: paquet infantil', async () => {
  const pack = JSON.parse(fs.readFileSync(new URL('../packs/infantil.llencpack.json', import.meta.url), 'utf8'));
  const P = GL.packs;
  await P.init();
  await P.install(pack, true);
  ok(P.list.some(p => p.id === 'infantil'), 'paquet instal·lat');
  ok(pack.templates.length >= 50 && pack.symbols.length >= 200, `contingut: ${pack.templates.length} plantilles, ${pack.symbols.length} símbols`);
  let bad = 0;
  for (const s of pack.symbols) { const r = GL.SvgImport.parse(s.svg); if (!r || !r.items.length) { bad++; fails.push('símbol buit: ' + s.id); } }
  ok(bad === 0, 'tots els símbols s\'importen');
  const st = GL.store;
  const missing = new Set();
  for (const t of pack.templates) for (const pg of t.pages) for (const it of pg.items) if (it.type === 'sym' && !P.symIndex.has(it.sym)) missing.add(it.sym);
  ok(missing.size === 0, 'símbols referenciats existents: ' + [...missing].join(','));
  const cat = GL.catalog.templates().filter(t => t.src === pack.name);
  ok(cat.length === pack.templates.length, 'catàleg de plantilles');
  let prevBad = 0;
  for (const t of cat) { const svg = t.thumb(); const d = new w.DOMParser().parseFromString(svg, 'image/svg+xml'); if (svg.length < 300 || d.querySelector('parsererror')) { prevBad++; fails.push('vista prèvia: ' + t.key); } }
  ok(prevBad === 0, 'vistes prèvies vàlides');
  const n0 = st.pagesSorted().length, o0 = Object.keys(st.doc.objs).length;
  const tr = cat.find(t => t.key === 'infantil:triptic-animals');
  tr.insert();
  ok(st.pagesSorted().length === n0 + 2, 'tríptic: 2 pàgines');
  ok(Object.keys(st.doc.objs).length > o0 + 20, 'tríptic amb contingut');
  GL.Cmd.run('edit.undo');
  ok(st.pagesSorted().length === n0, 'desfer la inserció');
  // símbol del paquet
  const sym = GL.catalog.symbols().find(s => s.key === 'infantil:gat');
  sym.insert();
  const g = st.obj(GL.app.sel[0]);
  ok(g && g.name === 'Gat' && g.type === 'group', 'il·lustració inserida com a grup editable');
  const b = GL.G.aabb(g);
  ok(b.w > 50 && b.w < GL.app.page().w, 'mida raonable');
});
await test('v0.12: biblioteca d\'usuari', async () => {
  const st = GL.store, P = GL.packs;
  const before = P.user.symbols.length;
  // desat directe (sense diàleg)
  const ids = GL.app.sel.slice();
  const tree = GL.cloneTree(ids);
  P.user.symbols.push({ id: 'u1', name: 'Gat meu', tree, box: GL.G.selBox(ids), thumb: '<svg xmlns="http://www.w3.org/2000/svg"/>' });
  await P.saveUser();
  const us = GL.catalog.symbols().find(s => s.key === 'user:u1');
  ok(us && P.user.symbols.length === before + 1, 'símbol d\'usuari al catàleg');
  const n = Object.keys(st.doc.objs).length;
  us.insert();
  ok(Object.keys(st.doc.objs).length > n, 'símbol d\'usuari inserit');
  const pid = GL.app.pageId;
  P.user.templates.push({ id: 'ut1', name: 'Pàgina meva', cat: 'meves', w: 500, h: 400, unit: 'px', tree: GL.cloneTree(st.children(pid).map(o => o.id)), pages: [{ bg: '#ffeeeeff' }] });
  const ut = GL.catalog.templates().find(t => t.key === 'user:ut1');
  const pc = st.pagesSorted().length;
  ut.insert();
  ok(st.pagesSorted().length === pc + 1 && st.page(GL.app.pageId).w === 500 && st.children(GL.app.pageId).length > 0, 'plantilla d\'usuari inserida');
  let threw = false; try { P.validate({ format: 'x' }); } catch (e) { threw = true; }
  ok(threw, 'rebutja paquets no vàlids');
  threw = false; try { P.validate({ format: 'guaitaLlencPack', id: 'x', name: 'x', symbols: [{ svg: '<svg onload="alert(1)"/>' }] }); } catch (e) { threw = true; }
  ok(threw, 'rebutja codi dins del paquet');
});
await test('v0.12: mode infantil', () => {
  GL.kids.set(true);
  ok(w.document.body.classList.contains('kids') && GL.kidsTextBase().ff === 'Fredoka', 'mode infantil actiu');
  GL.kids.set(false);
  ok(!w.document.body.classList.contains('kids') && GL.kidsTextBase() === null, 'mode infantil desactivat');
  ok(GL.FontKit.families().includes('Fredoka') && GL.FontKit.families().includes('Baloo 2'), 'tipografies infantils incrustades');
});

await test('v0.12.1: paquet empresa', async () => {
  const pack = JSON.parse(fs.readFileSync(new URL('../packs/empresa.llencpack.json', import.meta.url), 'utf8'));
  const P = GL.packs;
  await P.install(pack, true);
  ok(pack.templates.length >= 45 && pack.symbols.length >= 150, `contingut: ${pack.templates.length} plantilles, ${pack.symbols.length} símbols`);
  let bad = 0;
  for (const s of pack.symbols) { const r = GL.SvgImport.parse(s.svg); if (!r || !r.items.length) { bad++; fails.push('símbol buit: ' + s.id); } }
  ok(bad === 0, 'tots els símbols d\'empresa s\'importen');
  const cat = GL.catalog.templates().filter(t => t.src === pack.name);
  let prevBad = 0;
  for (const t of cat) { const svg = t.thumb(); const d = new w.DOMParser().parseFromString(svg, 'image/svg+xml'); if (svg.length < 300 || d.querySelector('parsererror')) { prevBad++; fails.push('vista prèvia: ' + t.key); } }
  ok(cat.length === pack.templates.length && prevBad === 0, 'vistes prèvies vàlides');
  const fonts = new Set(); for (const t of pack.templates) for (const pg of t.pages) for (const it of pg.items) if (it.ff) fonts.add(it.ff);
  ok([...fonts].every(f => GL.FontKit.families().includes(f)), 'tipografies disponibles: ' + [...fonts].join(', '));
  const st = GL.store, n0 = st.pagesSorted().length;
  cat.find(t => t.key === 'empresa:pres-corp').insert();
  ok(st.pagesSorted().length === n0 + 10, 'presentació de 10 diapositives');
  ok(P.symIndex.has('e-kpi') && P.symIndex.has('gat'), 'els dos paquets conviuen');
});

await test('paquet arquitectura', async () => {
  const pack = JSON.parse(fs.readFileSync(new URL('../packs/arquitectura.llencpack.json', import.meta.url), 'utf8'));
  const P = GL.packs;
  await P.install(pack, true);
  ok(pack.templates.length >= 25 && pack.symbols.length >= 400, `contingut: ${pack.templates.length} plantilles, ${pack.symbols.length} símbols`);
  let bad = 0;
  for (const s of pack.symbols) { const r = GL.SvgImport.parse(s.svg); if (!r || !r.items.length) { bad++; fails.push('símbol buit: ' + s.id); } }
  ok(bad === 0, 'tots els símbols d\'arquitectura s\'importen');
  const missing = new Set();
  for (const t of pack.templates) for (const pg of t.pages) for (const it of pg.items) if (it.type === 'sym' && !P.symIndex.has(it.sym)) missing.add(it.sym);
  ok(missing.size === 0, 'referències de símbols: ' + [...missing].join(','));
  const cat = GL.catalog.templates().filter(t => t.src === pack.name);
  let prevBad = 0;
  for (const t of cat) { const svg = t.thumb(); const d = new w.DOMParser().parseFromString(svg, 'image/svg+xml'); if (svg.length < 300 || d.querySelector('parsererror')) { prevBad++; fails.push('vista prèvia: ' + t.key); } }
  ok(cat.length === pack.templates.length && prevBad === 0, 'vistes prèvies vàlides');
});

/* ── GitHub asíncron (v0.13) ── */
function fakeGH() {
  const files = new Map(); let n = 0;
  const conflict = () => { const e = new Error('conflicte'); e.conflict = true; e.status = 409; return e; };
  return {
    files,
    api() {
      return {
        async list(p) {
          const pre = p + '/', names = new Map();
          for (const [path, v] of files) if (path.startsWith(pre)) {
            const rest = path.slice(pre.length), nm = rest.split('/')[0], dir = rest.includes('/');
            if (!names.has(nm)) names.set(nm, { name: nm, type: dir ? 'dir' : 'file', sha: dir ? 'd' : v[v.length - 1].sha });
          }
          return names.size ? [...names.values()] : null;
        },
        async read(p, ref) { const v = files.get(p); if (!v) return null; if (!ref) return v[v.length - 1].text; const e = v.find(x => x.sha === ref); return e ? e.text : null; },
        async write(p, text, sha, msg) {
          const v = files.get(p) || [];
          const cur = v[v.length - 1];
          if ((cur && cur.sha !== sha) || (!cur && sha)) throw conflict();
          const e = { sha: 's' + (++n), text, msg, date: new Date(2026, 10, 10, 10, n).toISOString() };
          v.push(e); files.set(p, v); return e.sha;
        },
        async commits(p) { return (files.get(p) || []).slice().reverse().map(e => ({ sha: e.sha, date: e.date, message: e.msg, name: 'x', login: 'x' })); },
      };
    }
  };
}
const mkStore = actor => { const s = new GL.Store(); s.actor = actor; return s; };
const rectOf = (s, pid, id, x) => s.add({ id, type: 'rect', page: pid, x, y: 0, w: 10, h: 10, fill: { t: 'solid', c: '#ff0000ff' } });
const sameState = (a, b) => GL.gh.canon(a.doc.objs) === GL.gh.canon(b.doc.objs) && GL.gh.canon(a.doc.pages) === GL.gh.canon(b.doc.pages);

await test('github: compactOps i canon', () => {
  const G = GL.gh;
  const ops = [
    { c: 'o', t: 'add', id: 'a', l: 1 }, { c: 'o', t: 'set', id: 'a', k: 'x', l: 2 }, { c: 'o', t: 'set', id: 'a', k: 'x', l: 3 },
    { c: 'o', t: 'set', id: 'a', k: 'y', l: 4 }, { c: 'o', t: 'del', id: 'a', l: 5 }, { c: 'o', t: 'add', id: 'a', l: 6 }, { c: 'o', t: 'set', id: 'a', k: 'x', l: 7 },
  ];
  const c = G.compactOps(ops);
  ok(c.map(o => o.l).join() === '1,3,4,5,6,7', 'compacta sets consecutius: ' + c.map(o => o.l));
  ok(G.canon({ b: 1, a: { d: 2, c: 3 } }) === G.canon({ a: { c: 3, d: 2 }, b: 1 }), 'canon independent de l\'ordre');
});

await test('github: dos editors, fusió LWW i convergència', async () => {
  const srv = fakeGH(), G = GL.gh;
  const A = mkStore('A'); A.load(GL.Store.blankDoc({ unit: 'mm' }), []);
  const pid = A.pagesSorted()[0].id;
  rectOf(A, pid, 'r1', 0); rectOf(A, pid, 'r2', 50);
  const eA = new G.GhSync({ store: A, api: srv.api(), path: 'd/doc-1', user: { login: 'ana', name: 'Ana' } });
  let r = await eA.sync('inici');
  ok(r.pushed && srv.files.has('d/doc-1/doc.llenc') && srv.files.has('d/doc-1/ops/A.jsonl'), 'primera pujada crea instantània i registre');
  // B arrenca des de la instantània
  const snap = GL.io.parse(await srv.api().read('d/doc-1/doc.llenc'));
  ok(Array.isArray(snap.ts) && snap.ts.length > 0 && snap.authors.A.login === 'ana', 'instantània amb ts i autors');
  const B = mkStore('B'); B.load(snap.doc, [], snap.ts);
  const eB = new G.GhSync({ store: B, api: srv.api(), path: 'd/doc-1', user: { login: 'biel', name: 'Biel' }, state: { seen: snap.seen, snapSha: srv.files.get('d/doc-1/doc.llenc')[0].sha } });
  ok(sameState(A, B), 'B comença igual que A');
  r = await eB.sync(); ok(r.applied === 0 && !B.pending && eB.pending().length === 0, 'sense canvis no es reben ni es pugen operacions');
  // edicions concurrents
  A.begin(); A.set('r1', 'x', 111); A.set('r1', 'fill', { t: 'solid', c: '#00ff00ff' }); A.commit();
  B.begin(); B.set('r1', 'fill', { t: 'solid', c: '#0000ffff' }); B.set('r2', 'y', 77); rectOf(B, pid, 'r3', 90); B.commit();
  await eB.sync('canvis de B');
  r = await eA.sync('canvis d\'A');
  ok(r.applied > 0, 'A rep els canvis de B (' + r.applied + ')');
  await eB.sync();
  ok(sameState(A, B), 'convergència després de sincronitzar');
  ok(A.obj('r1').x === 111 && A.obj('r2').y === 77 && !!A.obj('r3'), 'canvis de totes dues bandes presents');
  const f = A.obj('r1').fill.c;
  ok(f === '#00ff00ff' || f === '#0000ffff', 'conflicte de propietat resolt per LWW: ' + f);
  r = await eA.sync(); ok(r.applied === 0 && !r.pushed, 'idempotent');
  // esborrat vs edició antiga
  A.begin(); A.del(['r2']); A.commit();
  B.begin(); B.set('r1', 'y', 5); B.commit();
  await eA.sync(); await eB.sync(); await eA.sync();
  ok(!A.obj('r2') && !B.obj('r2'), 'l\'esborrat es propaga');
  ok(sameState(A, B), 'convergència després d\'esborrar');
  // autoria
  const lastR1 = A.lastEditor('r1');
  ok(lastR1 && (lastR1.a === 'A' || lastR1.a === 'B'), 'últim editor conegut');
  const cont = eA.contributors();
  ok(cont.length >= 1 && cont.reduce((s, c) => s + c.n, 0) === Object.keys(A.doc.objs).length, 'recompte d\'autoria per objecte');
  ok(cont.some(c => c.who && c.who.login === 'biel'), 'noms d\'autor des de la instantània');
});

await test('github: conflicte de pujada i reintent', async () => {
  const srv = fakeGH(), G = GL.gh;
  const A = mkStore('A'); A.load(GL.Store.blankDoc({ unit: 'mm' }), []);
  const pid = A.pagesSorted()[0].id; rectOf(A, pid, 'r1', 0);
  const eA = new G.GhSync({ store: A, api: srv.api(), path: 'd/c', user: null });
  await eA.sync();
  const snap = GL.io.parse(await srv.api().read('d/c/doc.llenc'));
  const B = mkStore('B'); B.load(snap.doc, [], snap.ts);
  const eB = new G.GhSync({ store: B, api: srv.api(), path: 'd/c', state: { seen: snap.seen, snapSha: srv.files.get('d/c/doc.llenc')[0].sha } });
  B.begin(); B.set('r1', 'w', 33); B.commit();
  const res = await eB.pull();           // B mira el remot...
  A.begin(); A.set('r1', 'h', 44); A.commit();
  await eA.sync();                        // ...A puja abans que B
  let conflicted = false;
  try { await eB.push(res); } catch (e) { conflicted = !!e.conflict; }
  ok(conflicted, 'la pujada amb sha vell dóna conflicte');
  await eB.sync(); await eA.sync();
  ok(A.obj('r1').w === 33 && A.obj('r1').h === 44 && B.obj('r1').w === 33 && B.obj('r1').h === 44, 'després del reintent tothom té els dos canvis');
});

await test('github: ts persistent evita sobreescriure amb operacions velles', () => {
  const s = mkStore('A'); s.load(GL.Store.blankDoc({ unit: 'mm' }), []);
  const pid = s.pagesSorted()[0].id; rectOf(s, pid, 'r1', 0);
  s.set('r1', 'x', 5);
  const ts = s.exportTs(), doc = JSON.parse(JSON.stringify(s.doc));
  const s2 = mkStore('B'); s2.load(doc, [], ts);
  ok(s2.clock >= s.clock, 'rellotge restaurat');
  const old = { c: 'o', t: 'set', id: 'r1', k: 'x', v: 999, l: 0, a: 'Z' };
  ok(!s2.applyRemote(old) && s2.obj('r1').x === 5, 'una operació antiga no sobreescriu');
  const del = { c: 'o', t: 'del', id: 'r1', l: 0, a: 'Z' };
  ok(!s2.applyRemote(del) && !!s2.obj('r1'), 'un esborrat antic no elimina');
});

await test('github: actius via instantània', async () => {
  const srv = fakeGH(), G = GL.gh;
  const A = mkStore('A'); A.load(GL.Store.blankDoc({ unit: 'mm' }), []);
  const pid = A.pagesSorted()[0].id;
  const eA = new G.GhSync({ store: A, api: srv.api(), path: 'd/i' });
  await eA.sync();
  const snap = GL.io.parse(await srv.api().read('d/i/doc.llenc'));
  const B = mkStore('B'); B.load(snap.doc, [], snap.ts);
  const eB = new G.GhSync({ store: B, api: srv.api(), path: 'd/i', state: { seen: snap.seen, snapSha: srv.files.get('d/i/doc.llenc')[0].sha } });
  const aid = A.addAsset('image/png', 'AAAA', 4, 4);
  A.add({ id: 'im1', type: 'image', page: pid, x: 0, y: 0, w: 4, h: 4, asset: aid });
  await eA.sync();
  const r = await eB.sync();
  ok(!!B.obj('im1') && !!B.doc.assets[aid] && B.doc.assets[aid].data === 'AAAA', 'B rep l\'objecte i les dades de l\'actiu (' + r.assets + ')');
  ok(!srv.files.get('d/i/ops/A.jsonl')[0].text.includes('AAAA'), 'el registre d\'operacions no duplica les dades');
});

await test('github: historial, comparació i restauració', async () => {
  const srv = fakeGH(), G = GL.gh;
  const A = mkStore('A'); A.load(GL.Store.blankDoc({ unit: 'mm' }), []);
  const pid = A.pagesSorted()[0].id;
  rectOf(A, pid, 'r1', 0); rectOf(A, pid, 'r2', 50);
  const eA = new G.GhSync({ store: A, api: srv.api(), path: 'd/h', user: { login: 'ana' } });
  await eA.sync('v1');
  A.begin(); A.del(['r2']); A.set('r1', 'x', 200); rectOf(A, pid, 'r3', 5); A.commit();
  await eA.sync('v2');
  const hist = await eA.history();
  ok(hist.length >= 2 && hist[0].message.includes('v2'), 'historial amb ' + hist.length + ' versions');
  const v1 = await eA.version(hist[hist.length - 1].sha);
  ok(!!v1.doc.objs.r2 && !v1.doc.objs.r3, 'la versió 1 conté r2 i no r3');
  const d = G.diffDocs(v1.doc, A.doc);
  ok(d.objs.added.join() === 'r3' && d.objs.removed.join() === 'r2' && d.objs.changed.length === 1 && d.objs.changed[0].keys.includes('x'), 'diferències correctes');
  G.restoreInto(A, v1.doc);
  ok(!!A.obj('r2') && !A.obj('r3') && A.obj('r1').x === 0, 'restauració aplicada');
  ok(G.diffDocs(v1.doc, A.doc).objs.added.length + G.diffDocs(v1.doc, A.doc).objs.removed.length + G.diffDocs(v1.doc, A.doc).objs.changed.length === 0, 'estat idèntic a la versió');
  A.undo();
  ok(!A.obj('r2') && !!A.obj('r3'), 'la restauració es pot desfer');
  A.redo();
  // la restauració es propaga a un altre editor
  const snapNow = GL.io.parse(await srv.api().read('d/h/doc.llenc'));
  const B = mkStore('B'); B.load(snapNow.doc, [], snapNow.ts);
  const eB = new G.GhSync({ store: B, api: srv.api(), path: 'd/h', state: { seen: snapNow.seen, snapSha: srv.files.get('d/h/doc.llenc').slice(-1)[0].sha } });
  await eA.sync('restaura');
  await eB.sync();
  ok(!!B.obj('r2') && !B.obj('r3') && B.obj('r1').x === 0, 'B rep la restauració');
  ok(sameState(A, B), 'A i B convergeixen després de restaurar');
});

await test('github: adaptador REST', async () => {
  const calls = [];
  w.fetch = async (url, o) => {
    calls.push({ url, method: o.method, headers: o.headers, body: o.body });
    const R = (st, body) => ({ ok: st < 300, status: st, json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
    if (/\/contents\/d%20x\/f\.llenc(\?|$)/.test(url) && o.method === 'PUT') return R(201, { content: { sha: 'nou' } });
    if (/\/contents\/d%20x\?/.test(url)) return R(200, [{ name: 'f.llenc', sha: 'abc', type: 'file', size: 4 }]);
    if (/\/contents\/falta/.test(url)) return R(404, { message: 'Not Found' });
    if (/\/commits\?/.test(url)) return R(200, [{ sha: 'c1', commit: { message: 'm', author: { name: 'N', date: '2026-11-10T10:00:00Z' } }, author: { login: 'ana', avatar_url: 'u' } }]);
    return R(409, { message: 'conflict' });
  };
  const api = new GL.gh.GhRest({ token: 'T', repo: 'o/r', branch: 'main' });
  const l = await api.list('d x');
  ok(l.length === 1 && l[0].sha === 'abc', 'list');
  ok(calls[0].headers.Authorization === 'Bearer T' && calls[0].url.startsWith('https://api.github.com/repos/o/r/contents/'), 'capçaleres i URL');
  ok((await api.read('falta')) === null, '404 en llegir dóna null');
  const sha = await api.write('d x/f.llenc', 'àèí', 'old', 'msg');
  const b = JSON.parse(calls[calls.length - 1].body);
  ok(sha === 'nou' && b.sha === 'old' && b.branch === 'main' && Buffer.from(b.content, 'base64').toString('utf8') === 'àèí', 'write amb sha, branca i UTF-8');
  const cm = await api.commits('d x/f.llenc');
  ok(cm[0].login === 'ana' && cm[0].sha === 'c1', 'commits');
  let err = null; try { await api.write('altre', 'x', 's', 'm'); } catch (e) { err = e; }
  ok(err && err.conflict && /Conflicte/.test(err.message), 'conflicte reconegut');
});

await test('github: interfície', async () => {
  const G = GL.gh;
  G.init();
  GL.app.loadDoc(GL.Store.blankDoc({ unit: 'mm' }), []);
  ok(!G.linked(), 'document sense vincular');
  ok(GL.Cmd.get('gh.sync') && GL.Cmd.get('gh.history') && !GL.Cmd.enabled('gh.history'), 'ordres registrades; historial desactivat sense vincle');
  G.docs[GL.store.doc.id] = { path: 'd/x', opsSha: {}, seen: {}, pushedL: 0, authors: {} };
  ok(G.linked() && GL.Cmd.enabled('gh.history'), 'ordres actives amb vincle');
  GL.store.add({ type: 'rect', page: GL.app.pageId, x: 0, y: 0, w: 5, h: 5 });
  G.refresh();
  ok(w.document.querySelector('#ghBtn').classList.contains('pend'), 'indicador amb canvis pendents');
  const ser = GL.io.serialize();
  ok(Array.isArray(ser.ts) && ser.ts.length > 0, 'el desat local d\'un document vinculat inclou les marques de temps');
  delete G.docs[GL.store.doc.id];
  ok(GL.io.serialize().ts === undefined, 'sense vincle no s\'inclou ts');
});

await flush();
console.log(`\n${pass} proves superades, ${fail} errors`);
if (fails.length) { console.log(fails.map(f => '  ✗ ' + f).join('\n')); process.exit(1); }
process.exit(0);
