// Genera packs/arquitectura.llencpack.json
// Copyright (C) 2026 SBS BiM Consulting, Jordi Subirós — AGPL-3.0-only
import fs from 'node:fs';
import { SYMBOLS, SYM_CATS } from './gen-arq-symbols.mjs';

const MM = 96 / 25.4;
const hx = c => c.length === 7 ? c + 'ff' : c;
const solid = c => ({ t: 'solid', c: hx(c) });
const NONE = { t: 'none', c: '#000000ff' };
const K = '#111111', MUTE = '#666666', LINE = '#bbbbbb';
const SYMS = new Set(SYMBOLS.map(s => s.id));
const SANS = 'IBM Plex Sans', COND = 'IBM Plex Sans Condensed', MONO = 'IBM Plex Mono';

function B(W, H, k) {
  const items = [];
  const u = v => +(v * k).toFixed(3);
  const api = {
    W, H, items,
    rect(x, y, w, h, fill, o = {}) { items.push({ type: 'rect', x: u(x), y: u(y), w: u(w), h: u(h), r: u(o.r || 0), fill: fill ? solid(fill) : NONE, stroke: solid(o.stroke || K), sw: o.sw ? u(o.sw) : 0, dash: o.dash, rot: 0, opacity: o.op == null ? 1 : o.op }); return api; },
    box(x, y, w, h, sw = 0.35, col = K) { return api.rect(x, y, w, h, null, { sw, stroke: col }); },
    line(x1, y1, x2, y2, col = K, sw = 0.25, o = {}) { items.push({ type: 'line', p1: { x: u(x1), y: u(y1) }, p2: { x: u(x2), y: u(y2) }, fill: NONE, stroke: solid(col), sw: u(sw), cap: 'butt', dash: o.dash, ae: o.ae }); return api; },
    text(x, y, w, text, o = {}) { items.push({ type: 'text', x: u(x), y: u(y), w: u(w), text, rot: o.rot || 0, ff: o.ff || SANS, fs: u(o.fs || 2.5), fw: o.fw || 400, lh: o.lh || 1.35, ls: o.ls || 0, ta: o.ta || 'left', auto: 'h', tt: o.tt || 'none', fill: solid(o.c || K), stroke: solid('#ffffff'), sw: 0 }); return api; },
    title(x, y, w, t, o = {}) { return api.text(x, y, w, t, Object.assign({ fw: 700, lh: 1.15 }, o)); },
    label(x, y, w, t, o = {}) { return api.text(x, y, w, t, Object.assign({ ff: COND, fw: 600, tt: 'upper', ls: 0.06, fs: 1.7, c: MUTE }, o)); },
    sym(id, x, y, w, h, o = {}) { if (!SYMS.has('a-' + id) && !SYMS.has(id)) throw new Error('símbol desconegut: ' + id); items.push({ type: 'sym', sym: SYMS.has('a-' + id) ? 'a-' + id : id, x: u(x), y: u(y), w: u(w), h: u(h == null ? w : h), rot: o.rot || 0, opacity: o.op == null ? 1 : o.op }); return api; },
  };
  return api;
}
const SIZES = { a4: [210, 297, 'mm'], a4l: [297, 210, 'mm'], a3: [297, 420, 'mm'], a3l: [420, 297, 'mm'], a1l: [841, 594, 'mm'], a1: [594, 841, 'mm'], a0l: [1189, 841, 'mm'], hd: [1920, 1080, 'px'] };
const TPL = [];
function tpl(id, name, cat, tags, size, pages) {
  const [W, H, unit] = SIZES[size];
  const k = unit === 'mm' ? MM : 1;
  const out = pages.map(fn => { const b = B(W, H, k); const r = fn(b) || {}; return { name: r.name, bg: hx(r.bg || '#ffffff'), items: b.items }; });
  TPL.push({ id, name, cat, tags, w: +(W * k).toFixed(3), h: +(H * k).toFixed(3), unit, pages: out });
}

/* caixetí normalitzat (s: factor d'escala respecte A3) */
function caixeti(b, x, y, w, s = 1) {
  const h = 34 * s;
  b.box(x, y, w, h, 0.5 * s);
  const cw = [0.30, 0.22, 0.16, 0.16, 0.16].map(f => f * w);
  let cx = x;
  const cells = [
    [['Projecte', '{títol}', 3.4], ['Plànol', 'Planta baixa · Distribució', 2.6]],
    [['Promotor', 'Nom del promotor', 2.4], ['Emplaçament', 'Carrer, número · Població', 2.2]],
    [['Autor', '{autor}', 2.4], ['Col·legiat núm.', '00000/0', 2.2]],
    [['Escala', '1:100', 3.4], ['Data', '{data}', 2.4]],
    [['Plànol núm.', 'A-{pàgina}', 4.6], ['Revisió', 'R0', 2.4]],
  ];
  cells.forEach((col, i) => {
    if (i) b.line(cx, y, cx, y + h, K, 0.3 * s);
    col.forEach(([lab, val, fs], j) => {
      const yy = y + j * h / 2;
      if (j) b.line(cx, yy, cx + cw[i], yy, K, 0.2 * s);
      b.label(cx + 2 * s, yy + 1.6 * s, cw[i] - 4 * s, lab, { fs: 1.6 * s });
      b.text(cx + 2 * s, yy + 5.6 * s, cw[i] - 4 * s, val, { fs: fs * s, fw: i === 0 && j === 0 ? 700 : 500 });
    });
    cx += cw[i];
  });
  return h;
}
const marc = (b, m = 10, s = 1) => { b.box(m, m, b.W - 2 * m, b.H - 2 * m, 0.7 * s); };

/* ── Làmines ── */
tpl('lamina-a3', 'Làmina A3 amb caixetí', 'lamines', 'làmina plànol caixetí A3', 'a3l', [b => { marc(b); caixeti(b, 10, 253, 400); b.sym('nord-2', 382, 20, 20); b.sym('escala-100', 330, 228, 70, 20); b.text(16, 16, 200, 'Zona de dibuix', { fs: 3, c: LINE }); return {}; }]);
tpl('lamina-a1', 'Làmina A1 amb caixetí', 'lamines', 'làmina plànol caixetí A1', 'a1l', [b => { marc(b, 20, 2); caixeti(b, 20, 506, 801, 2); b.sym('nord-3', 760, 40, 50); b.sym('escala-100', 640, 460, 160, 44); b.label(40, 40, 300, 'Llegenda', { fs: 4 }); [['codi-existent'], ['codi-enderroc'], ['codi-nou']].forEach(([s], i) => b.sym(s, 36, 52 + i * 24, 70, 22)); return {}; }]);
tpl('lamina-a0', 'Làmina A0 amb caixetí', 'lamines', 'làmina plànol caixetí A0', 'a0l', [b => { marc(b, 25, 2.6); caixeti(b, 25, 728, 1139, 2.6); b.sym('nord-1', 1080, 50, 70); b.sym('escala-200', 900, 660, 220, 60); return {}; }]);
tpl('lamina-concurs', 'Panell de concurs A1', 'lamines', 'panell concurs lema A1', 'a1', [b => { b.rect(0, 0, 594, 70, K); b.title(30, 22, 400, 'LEMA DEL CONCURS', { fs: 18, c: '#ffffff', ff: COND, ls: 0.06 }); b.text(420, 30, 150, 'Panell 1/3', { fs: 7, c: '#cccccc', ta: 'right' }); b.rect(30, 100, 534, 360, '#eeeeee'); b.text(30, 270, 534, 'Imatge principal', { fs: 8, ta: 'center', c: MUTE }); b.rect(30, 480, 260, 200, '#f4f4f4'); b.rect(304, 480, 260, 200, '#f4f4f4'); b.title(30, 700, 534, 'Idea del projecte', { fs: 9 }); b.text(30, 720, 534, 'Text explicatiu de la proposta: estratègia d\'implantació, programa i materialitat.', { fs: 5, lh: 1.5 }); b.sym('nord-4', 520, 480, 30); return {}; }]);

/* ── Llegendes d'instal·lacions ── */
function legendSheet(id, name, tags, color, entries) {
  tpl('llegenda-' + id, 'Llegenda · ' + name, 'llegendes', 'llegenda símbols ' + tags, 'a4', [b => {
    b.rect(0, 0, 210, 26, color); b.title(14, 8, 180, 'Llegenda · ' + name, { fs: 7, c: '#ffffff' });
    entries.forEach(([s, t], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 14 + col * 95, y = 36 + row * 15.5;
      b.sym(s, x, y, 12);
      b.text(x + 16, y + 3.6, 76, t, { fs: 3 });
      b.line(x, y + 13.5, x + 88, y + 13.5, '#dddddd', 0.2);
    });
    caixeti(b, 10, 260, 190, 0.85);
    return {};
  }]);
}
legendSheet('electricitat', 'Electricitat', 'elèctrica electricitat', '#d6281b', [['el-endoll', 'Presa de corrent 16 A'], ['el-endoll-doble', 'Presa doble'], ['el-endoll-estanc', 'Presa estanca IP-55'], ['el-endoll-forca', 'Presa de força 25 A'], ['el-endoll-cuina', 'Presa de cuina'], ['el-interruptor', 'Interruptor simple'], ['el-interruptor-doble', 'Interruptor doble'], ['el-commutat', 'Commutat'], ['el-creuament', 'Creuament'], ['el-regulador', 'Regulador'], ['el-polsador', 'Polsador'], ['el-timbre', 'Timbre'], ['el-quadre', 'Quadre general'], ['el-quadre-sec', 'Subquadre'], ['el-comptador', 'Comptador'], ['el-cgp', 'Caixa general de protecció'], ['el-terra', 'Presa de terra'], ['el-detector', 'Detector de presència'], ['il-punt', 'Punt de llum'], ['il-aplic', 'Aplic de paret'], ['il-empotrat', 'Downlight'], ['il-led', 'Panell LED'], ['il-lineal', 'Lluminària lineal'], ['il-emergencia', 'Enllumenat d\'emergència'], ['tc-presa-tv', 'Presa de TV'], ['tc-presa-dades', 'Presa de dades RJ45'], ['tc-wifi', 'Punt d\'accés Wi-Fi'], ['re-recarrega', 'Recàrrega vehicle elèctric']]);
legendSheet('fontaneria', 'Fontaneria i sanejament', 'fontaneria aigua sanejament', '#1f6fd1', [['ai-escomesa', 'Escomesa d\'aigua'], ['ai-comptador', 'Comptador d\'aigua'], ['ai-clau', 'Clau de pas'], ['ai-valvula-ret', 'Vàlvula de retenció'], ['ai-freda', 'Aigua freda'], ['ai-acs', 'Aigua calenta sanitària'], ['ai-retorn', 'Retorn d\'ACS'], ['ai-termo', 'Termo elèctric'], ['ai-escalfador', 'Escalfador'], ['ai-diposit', 'Dipòsit'], ['ai-grup-pressio', 'Grup de pressió'], ['ai-filtre', 'Filtre / descalcificador'], ['ai-aixeta', 'Aixeta'], ['ai-reg', 'Punt de reg'], ['sa-baixant', 'Baixant'], ['sa-bonera', 'Bonera'], ['sa-arqueta', 'Arqueta de registre'], ['sa-arqueta-sif', 'Arqueta sifònica'], ['sa-pou', 'Pou de registre'], ['sa-pericó', 'Pericó'], ['sa-colector', 'Col·lector'], ['sa-canal', 'Canal de recollida'], ['sa-separador', 'Separador de greixos'], ['sa-ventilacio', 'Ventilació primària']]);
legendSheet('clima', 'Climatització i ventilació', 'climatització ventilació gas', '#11998e', [['cl-impulsio', 'Reixa d\'impulsió'], ['cl-retorn', 'Reixa de retorn'], ['cl-difusor', 'Difusor rotacional'], ['cl-conducte', 'Conducte rectangular'], ['cl-conducte-circ', 'Conducte circular'], ['cl-extractor', 'Extractor'], ['cl-recuperador', 'Recuperador de calor'], ['cl-split-int', 'Unitat interior'], ['cl-split-ext', 'Unitat exterior'], ['cl-fancoil', 'Fan-coil'], ['cl-bomba-calor', 'Bomba de calor'], ['cl-radiador', 'Radiador'], ['cl-terra-rad', 'Terra radiant'], ['cl-termostat', 'Termòstat'], ['cl-vmc', 'VMC'], ['cl-comporta', 'Comporta tallafoc'], ['cl-co2', 'Sensor de CO₂'], ['gs-escomesa', 'Escomesa de gas'], ['gs-comptador', 'Comptador de gas'], ['gs-clau', 'Clau de gas'], ['gs-caldera', 'Caldera'], ['gs-reixa', 'Reixa de ventilació'], ['gs-detector', 'Detector de gas'], ['re-aerotermia', 'Aerotèrmia']]);
legendSheet('pci', 'Protecció contra incendis', 'incendis PCI evacuació', '#d62828', [['pci-extintor', 'Extintor'], ['pci-bie', 'BIE'], ['pci-hidrant', 'Hidrant'], ['pci-polsador', 'Polsador d\'alarma'], ['pci-sirena', 'Sirena'], ['pci-columna-seca', 'Columna seca'], ['pci-ruixador', 'Ruixador'], ['pci-detector-fum', 'Detector de fum'], ['pci-detector-calor', 'Detector tèrmic'], ['pci-central', 'Central de detecció'], ['pci-porta-tf', 'Porta tallafoc'], ['pci-sector', 'Límit de sector'], ['il-emergencia', 'Enllumenat d\'emergència'], ['sg-sortida', 'Senyal de sortida'], ['pci-origen', 'Origen d\'evacuació'], ['pci-recorregut', 'Recorregut d\'evacuació'], ['pci-sortida-pl', 'Sortida de planta'], ['pci-zona-refugi', 'Zona de refugi'], ['pci-evac-ascensor', 'Ascensor d\'emergència'], ['pci-ocupacio', 'Ocupació']]);
legendSheet('trames', 'Trames i materials', 'trames materials', K, [['trama-formigo', 'Formigó en massa'], ['trama-formigo-armat', 'Formigó armat'], ['trama-mao', 'Obra de fàbrica'], ['trama-aillament', 'Aïllament tèrmic'], ['trama-terreny', 'Terreny natural'], ['trama-fusta', 'Fusta'], ['trama-acer', 'Acer'], ['trama-vidre', 'Vidre'], ['trama-grava', 'Grava'], ['trama-aigua', 'Aigua'], ['trama-gespa', 'Gespa'], ['trama-pedra', 'Pedra'], ['trama-ceramica', 'Paviment ceràmic'], ['trama-morter', 'Morter'], ['trama-impermeable', 'Impermeabilització'], ['trama-enderroc', 'Enderroc'], ['linia-continua', 'Línia vista'], ['linia-oculta', 'Línia oculta'], ['linia-eix', 'Eix'], ['linia-limit', 'Límit de parcel·la']]);

/* ── Quadres ── */
function table(b, x, y, w, cols, rows, rh = 7, head = K) {
  b.rect(x, y, w, rh, head);
  let cx = x;
  cols.forEach(([t, f, al]) => { b.text(cx + 1.5, y + 1.8, w * f - 3, t, { fs: 2.4, fw: 600, c: '#ffffff', ta: al || 'left' }); cx += w * f; });
  for (let r = 0; r < rows; r++) { const yy = y + rh * (r + 1); if (r % 2) b.rect(x, yy, w, rh, '#f4f4f4'); b.line(x, yy + rh, x + w, yy + rh, '#cccccc', 0.15); }
  cx = x; cols.slice(0, -1).forEach(([, f]) => { cx += w * f; b.line(cx, y + rh, cx, y + rh * (rows + 1), '#dddddd', 0.15); });
}
tpl('quadre-superficies', 'Quadre de superfícies', 'quadres', 'quadre superfícies útils construïdes', 'a4', [b => { b.title(14, 14, 182, 'Quadre de superfícies', { fs: 8 }); b.text(14, 24, 182, '{títol}', { fs: 3.4, c: MUTE }); table(b, 14, 36, 182, [['Planta', 0.18], ['Espai', 0.42], ['Sup. útil (m²)', 0.2, 'right'], ['Sup. construïda (m²)', 0.2, 'right']], 22); b.rect(14, 204, 182, 9, '#eeeeee'); b.title(16, 206.5, 100, 'TOTAL', { fs: 3.2 }); b.text(110, 206.5, 84, '0,00 m²', { fs: 3.2, fw: 700, ta: 'right' }); caixeti(b, 10, 260, 190, 0.85); return {}; }]);
tpl('quadre-revisions', 'Quadre de revisions', 'quadres', 'quadre revisions canvis versions', 'a4l', [b => { b.title(14, 14, 260, 'Control de revisions', { fs: 8 }); table(b, 14, 30, 269, [['Rev.', 0.08], ['Data', 0.14], ['Descripció del canvi', 0.5], ['Autor', 0.14], ['Revisat', 0.14]], 14, 8); b.sym('triangle-rev', 14, 160, 12); b.text(30, 163, 200, 'Indiqueu cada canvi al plànol amb un núvol i el triangle de revisió.', { fs: 3 }); return {}; }]);
tpl('quadre-fusteries', 'Quadre de fusteries', 'quadres', 'quadre fusteries portes finestres memòria', 'a4l', [b => { b.title(14, 12, 260, 'Quadre de fusteries', { fs: 8 }); [['etiqueta-porta', 'P1', 'Porta interior batent'], ['etiqueta-porta', 'P2', 'Porta corredissa'], ['etiqueta-fin', 'F1', 'Finestra batent'], ['etiqueta-fin', 'F2', 'Finestral corredís']].forEach(([s, n, t], i) => { const x = 14 + i * 68; b.box(x, 28, 62, 150, 0.3); b.sym(s, x + 21, 32, 20, 14); b.rect(x + 10, 52, 42, 70, null, { sw: 0.5 }); b.sym(i < 2 ? (i ? 'pl-porta-corredissa' : 'pl-porta-simple') : (i === 2 ? 'pl-finestra-batent' : 'pl-finestra-corredissa'), x + 11, 128, 40, 20); b.text(x + 3, 154, 56, t + '\nMides: ... × ... cm\nMaterial: alumini\nVidre: 4/16/4', { fs: 2.4, lh: 1.5 }); }); return {}; }]);

/* ── Seguretat i senyalètica ── */
tpl('pla-evacuacio', 'Plànol d\'evacuació', 'senyaletica', 'plànol evacuació emergència vostè és aquí', 'a3l', [b => { b.rect(0, 0, 420, 34, '#1e8a44'); b.title(16, 9, 300, 'PLÀNOL D\'EVACUACIÓ · PLANTA 1', { fs: 10, c: '#ffffff', ff: COND }); b.rect(16, 46, 290, 236, '#f7f7f7', { sw: 0.4, stroke: K }); b.text(16, 160, 290, 'Insereix aquí el plànol de planta', { fs: 5, ta: 'center', c: '#999999' }); b.rect(140, 150, 18, 18, '#d62828', { r: 9 }); b.text(110, 172, 80, 'VOSTÈ ÉS AQUÍ', { fs: 3, fw: 700, c: '#d62828', ta: 'center' }); b.title(318, 46, 90, 'Llegenda', { fs: 5 }); [['sg-sortida', 'Sortida'], ['pci-recorregut', 'Recorregut'], ['pci-extintor', 'Extintor'], ['pci-bie', 'BIE'], ['pci-polsador', 'Polsador'], ['sg-primers-aux', 'Primers auxilis'], ['sg-punt-trobada', 'Punt de trobada'], ['sg-dea', 'Desfibril·lador']].forEach(([s, t], i) => { b.sym(s, 318, 58 + i * 20, 14); b.text(336, 62 + i * 20, 70, t, { fs: 3.4 }); }); b.rect(318, 226, 90, 56, '#fff4d6', { r: 2 }); b.title(322, 230, 82, 'EN CAS D\'EMERGÈNCIA', { fs: 3.2, c: '#d62828' }); b.text(322, 238, 82, '1. Mantingueu la calma\n2. No useu l\'ascensor\n3. Seguiu la senyalització\n4. Aneu al punt de trobada\nEmergències: 112', { fs: 2.8, lh: 1.5 }); b.sym('nord-2', 284, 52, 16); return {}; }]);
tpl('cataleg-senyals', 'Catàleg de senyalètica', 'senyaletica', 'catàleg senyals senyalètica edifici', 'a3', [b => { b.title(16, 16, 260, 'Catàleg de senyalètica', { fs: 12 }); const groups = [['Evacuació', ['sg-sortida', 'sg-sortida-esq', 'sg-fletxa-verda', 'sg-punt-trobada', 'sg-primers-aux', 'sg-dea']], ['Incendis', ['pci-extintor', 'pci-bie', 'pci-polsador', 'pci-sirena', 'pci-hidrant', 'pci-columna-seca']], ['Prohibició i obligació', ['sg-fumar', 'sg-ascensor', 'sg-pas', 'sg-casc', 'sg-armilla', 'sg-ulleres']], ['Advertència', ['sg-electric', 'sg-calent', 'sg-relliscos', 'sg-caiguda', 'sg-gas', 'sg-general']], ['Orientació', ['sg-wc', 'sg-ascensor-info', 'sg-escales', 'sg-info', 'sg-parking', 'sg-cafeteria']], ['Accessibilitat', ['ac-sia', 'ac-itinerari', 'ac-bucle', 'sg-wc-adapt', 'ac-plaça', 'sg-braille']]]; groups.forEach(([g, list], gi) => { const y = 40 + gi * 60; b.label(16, y, 200, g, { fs: 3, c: K }); list.forEach((s, i) => { b.sym(s, 16 + i * 44, y + 8, 34); b.text(16 + i * 44, y + 44, 34, 'S-' + (gi + 1) + (i + 1), { fs: 2.6, ta: 'center', ff: MONO }); }); }); return {}; }]);
tpl('senyals-obra', 'Senyals de seguretat d\'obra', 'senyaletica', 'senyals obra seguretat EPI', 'a3l', [b => { b.rect(0, 0, 420, 297, '#ffffff'); b.rect(0, 0, 420, 40, '#f5c400'); b.title(20, 12, 380, 'OBRA EN CONSTRUCCIÓ · PROHIBIT EL PAS A PERSONES ALIENES', { fs: 9, ff: COND, ta: 'center' }); ['sg-casc', 'sg-armilla', 'sg-calcat', 'sg-guants', 'sg-ulleres', 'sg-auditiu'].forEach((s, i) => b.sym(s, 25 + i * 64, 60, 50)); ['sg-obra', 'sg-caiguda', 'sg-electric', 'sg-cap', 'sg-carretons', 'sg-general'].forEach((s, i) => b.sym(s, 25 + i * 64, 140, 50)); ['sg-pas', 'sg-fumar', 'sg-foc'].forEach((s, i) => b.sym(s, 105 + i * 80, 216, 56)); return {}; }]);
tpl('retols-porta', 'Rètols de porta', 'senyaletica', 'rètol porta placa', 'a4', [b => { for (let i = 0; i < 4; i++) { const y = 14 + i * 68; b.rect(20, y, 170, 58, '#f2f2f2', { r: 4, sw: 0.3, stroke: LINE }); b.rect(20, y, 8, 58, '#1f5fbf', { r: 2 }); b.title(40, y + 14, 120, ['Aula 3', 'Sala de reunions', 'Direcció', 'Lavabos'][i], { fs: 9 }); b.text(40, y + 30, 120, ['Planta 1', 'Planta 2', 'Planta 2 · Despatx 201', 'Planta baixa'][i], { fs: 4, c: MUTE }); b.sym(['sg-aula', 'sg-reunions', 'sg-info', 'sg-wc'][i], 156, y + 14, 28); } return {}; }]);
tpl('retol-planta', 'Rètol de planta', 'senyaletica', 'rètol planta número', 'a4l', [b => { b.rect(0, 0, 297, 210, '#1d2533'); b.title(30, 40, 100, '2', { fs: 90, c: '#ffffff' }); b.label(30, 30, 100, 'Planta', { fs: 6, c: '#ffd23f' }); [['Aules 201-210', 'sg-direccio'], ['Sala de professors', 'sg-direccio-esq'], ['Lavabos', 'sg-direccio'], ['Ascensor', 'sg-direccio-esq']].forEach(([t, s], i) => { const y = 40 + i * 34; b.sym(s, 140, y, 22); b.text(170, y + 5, 120, t, { fs: 7, c: '#ffffff', fw: 500 }); }); return { bg: '#1d2533' }; }]);
tpl('directori', 'Directori d\'edifici', 'senyaletica', 'directori edifici plantes', 'a3', [b => { b.rect(0, 0, 297, 420, '#1d2533'); b.title(24, 30, 249, 'Directori', { fs: 18, c: '#ffffff' }); b.text(24, 58, 249, 'Nom de l\'edifici', { fs: 6, c: '#aab3c2' }); [['4', 'Oficines i administració'], ['3', 'Departaments'], ['2', 'Sales de reunions'], ['1', 'Aules i tallers'], ['PB', 'Recepció · Cafeteria'], ['-1', 'Aparcament']].forEach(([n, t], i) => { const y = 90 + i * 48; b.rect(24, y, 249, 40, '#263043', { r: 3 }); b.title(32, y + 9, 40, n, { fs: 14, c: '#ffd23f' }); b.text(80, y + 14, 180, t, { fs: 6.4, c: '#ffffff' }); }); b.sym('ac-sia', 24, 386, 18); b.sym('sg-ascensor-info', 48, 386, 18); b.sym('sg-wc', 72, 386, 18); return { bg: '#1d2533' }; }]);

/* ── Documents tècnics ── */
tpl('detall-constructiu', 'Fitxa de detall constructiu', 'documents', 'detall constructiu secció fitxa', 'a4', [b => { b.title(14, 14, 150, 'Detall constructiu D-05', { fs: 7 }); b.text(14, 24, 150, 'Trobada façana – forjat', { fs: 3.4, c: MUTE }); b.sym('detall', 176, 10, 20); b.rect(14, 36, 120, 150, '#fafafa', { sw: 0.3, stroke: LINE }); b.text(14, 108, 120, 'Dibuix del detall', { fs: 4, c: '#aaaaaa', ta: 'center' }); b.title(142, 36, 54, 'Capes', { fs: 4 }); [['trama-ceramica', '1. Paviment'], ['trama-morter', '2. Morter'], ['trama-aillament', '3. Aïllament'], ['trama-formigo-armat', '4. Forjat'], ['trama-mao', '5. Fàbrica'], ['trama-impermeable', '6. Làmina']].forEach(([s, t], i) => { b.sym(s, 142, 46 + i * 16, 12); b.text(158, 50 + i * 16, 40, t, { fs: 2.8 }); }); b.title(14, 196, 182, 'Especificacions', { fs: 4 }); b.text(14, 204, 182, 'Descripció dels materials, gruixos i condicions d\'execució segons el plec de condicions.', { fs: 3, lh: 1.5 }); caixeti(b, 10, 260, 190, 0.85); return {}; }]);
tpl('memoria', 'Memòria tècnica', 'documents', 'memòria tècnica projecte document', 'a4', [
  b => { b.rect(0, 0, 210, 297, '#ffffff'); b.rect(0, 0, 14, 297, K); b.label(30, 60, 160, 'Projecte bàsic i d\'execució', { fs: 4, c: K }); b.title(30, 70, 160, '{títol}', { fs: 16 }); b.text(30, 110, 160, 'Memòria tècnica', { fs: 7, c: MUTE }); b.line(30, 124, 190, 124, K, 0.5); b.text(30, 130, 160, 'Emplaçament: Carrer, número · Població\nPromotor: Nom del promotor\nArquitecte: {autor}\nData: {data}', { fs: 3.6, lh: 1.7 }); b.sym('nord-5', 30, 230, 18); return { name: 'Portada' }; },
  b => { b.title(20, 24, 170, 'Índex', { fs: 10 }); ['1. Memòria descriptiva', '2. Memòria constructiva', '3. Compliment del CTE', '   3.1 Seguretat estructural', '   3.2 Seguretat en cas d\'incendi', '   3.3 Seguretat d\'utilització i accessibilitat', '   3.4 Salubritat', '   3.5 Protecció contra el soroll', '   3.6 Estalvi d\'energia', '4. Instal·lacions', '5. Annexos'].forEach((t, i) => { b.text(20, 46 + i * 11, 150, t, { fs: 3.6 }); b.text(170, 46 + i * 11, 20, String(3 + i * 2), { fs: 3.6, ta: 'right', ff: MONO }); b.line(20, 53 + i * 11, 190, 53 + i * 11, '#e5e5e5', 0.15); }); return { name: 'Índex' }; },
  b => { b.text(20, 12, 120, '{títol} · Memòria', { fs: 2.4, c: MUTE }); b.text(150, 12, 40, '{pàgina}', { fs: 2.4, c: MUTE, ta: 'right' }); b.line(20, 17, 190, 17, LINE, 0.2); b.title(20, 26, 170, '3.2 Seguretat en cas d\'incendi', { fs: 7 }); b.text(20, 40, 170, 'Justificació del compliment del DB SI. Descripció de la sectorització, l\'evacuació d\'ocupants, les instal·lacions de protecció i la intervenció dels bombers.', { fs: 3.2, lh: 1.6 }); table(b, 20, 70, 170, [['Sector', 0.3], ['Ús', 0.3], ['Superfície', 0.2, 'right'], ['EI', 0.2, 'right']], 5, 7); [['pci-extintor', 'Extintors 21A-113B cada 15 m'], ['pci-bie', 'BIE de 25 mm'], ['pci-detector-fum', 'Detecció automàtica'], ['il-emergencia', 'Enllumenat d\'emergència']].forEach(([s, t], i) => { b.sym(s, 20, 124 + i * 16, 12); b.text(36, 128 + i * 16, 150, t, { fs: 3.2 }); }); return { name: 'Interior' }; },
]);
tpl('fitxa-tipologia', 'Fitxa de tipologia d\'habitatge', 'documents', 'fitxa tipologia habitatge', 'a4', [b => { b.rect(0, 0, 210, 30, K); b.title(14, 9, 120, 'Tipologia A · 3 dormitoris', { fs: 7, c: '#ffffff' }); b.text(140, 10, 56, '78,40 m² útils', { fs: 4.4, c: '#ffffff', ta: 'right' }); b.rect(14, 40, 120, 150, '#fafafa', { sw: 0.3, stroke: LINE }); b.text(14, 112, 120, 'Planta de l\'habitatge', { fs: 4, c: '#aaaaaa', ta: 'center' }); b.sym('nord-2', 116, 44, 14); b.sym('escala-50', 70, 176, 60, 16); table(b, 142, 40, 54, [['Espai', 0.6], ['m²', 0.4, 'right']], 9, 7); [['pl-llit-doble'], ['pl-sofa'], ['pl-cuina-lineal'], ['pl-banyera']].forEach(([s], i) => b.sym(s, 14 + i * 30, 200, 24)); return {}; }]);
tpl('checklist-inst', 'Comprovació d\'instal·lacions', 'documents', 'checklist comprovació instal·lacions recepció obra', 'a4', [b => { b.title(14, 14, 182, 'Full de comprovació d\'instal·lacions', { fs: 7 }); b.text(14, 24, 182, 'Obra: {títol} · Data: {data}', { fs: 3, c: MUTE }); const sec = [['Electricitat', 'el-quadre', ['Quadre identificat', 'Diferencials provats', 'Presa de terra < 37 Ω']], ['Fontaneria', 'ai-comptador', ['Prova de pressió', 'Claus de pas', 'ACS a temperatura']], ['Climatització', 'cl-split-ext', ['Càrrega de refrigerant', 'Desguassos', 'Termòstats']], ['Incendis', 'pci-extintor', ['Extintors revisats', 'Senyalització', 'Enllumenat d\'emergència']]]; sec.forEach(([t, s, items], i) => { const y = 36 + i * 52; b.sym(s, 14, y, 14); b.title(32, y + 3, 120, t, { fs: 4.4 }); items.forEach((it, j) => { b.box(32, y + 15 + j * 9, 5, 5, 0.3); b.text(41, y + 15.5 + j * 9, 120, it, { fs: 3.2 }); b.text(160, y + 15.5 + j * 9, 36, 'OK / NO', { fs: 2.6, c: MUTE, ta: 'right' }); }); }); return {}; }]);
tpl('cartell-obra', 'Cartell d\'obra', 'documents', 'cartell obra promotor llicència', 'a3l', [b => { b.rect(0, 0, 420, 297, '#ffffff'); b.rect(0, 0, 420, 70, K); b.title(20, 20, 380, '{títol}', { fs: 16, c: '#ffffff' }); b.text(20, 46, 380, 'Construcció d\'edifici plurifamiliar · 24 habitatges', { fs: 6, c: '#cccccc' }); [['Promotor', 'Nom del promotor'], ['Arquitectura', '{autor}'], ['Direcció d\'execució', 'Nom'], ['Coordinació de seguretat', 'Nom'], ['Empresa constructora', 'Nom'], ['Llicència d\'obres', 'Núm. 0000/2026']].forEach(([a, v], i) => { const x = 20 + (i % 2) * 200, y = 90 + Math.floor(i / 2) * 50; b.label(x, y, 180, a, { fs: 3.4 }); b.text(x, y + 8, 180, v, { fs: 7, fw: 600 }); }); b.rect(0, 250, 420, 47, '#f5c400'); ['sg-casc', 'sg-armilla', 'sg-calcat', 'sg-pas'].forEach((s, i) => b.sym(s, 20 + i * 40, 256, 34)); b.text(200, 266, 200, 'Termini d\'execució: 18 mesos', { fs: 6, fw: 600 }); return {}; }]);
tpl('croquis', 'Full de croquis', 'documents', 'croquis quadrícula esbós', 'a4', [b => { for (let x = 10; x <= 200; x += 5) b.line(x, 10, x, 260, (x - 10) % 25 ? '#e3e8ee' : '#c8d1dc', 0.15); for (let y = 10; y <= 260; y += 5) b.line(10, y, 200, y, (y - 10) % 25 ? '#e3e8ee' : '#c8d1dc', 0.15); caixeti(b, 10, 264, 190, 0.7); return {}; }]);

/* ── Presentació ── */
tpl('pres-projecte', 'Presentació de projecte', 'documents', 'presentació projecte arquitectura', 'hd', [
  b => { b.rect(0, 0, 1920, 1080, K); b.label(120, 380, 1200, 'Projecte d\'arquitectura', { fs: 34, c: '#bbbbbb' }); b.title(120, 430, 1600, '{títol}', { fs: 120, c: '#ffffff' }); b.text(120, 640, 1400, '{autor} · {data}', { fs: 40, c: '#bbbbbb' }); return { bg: K, name: 'Portada' }; },
  b => { b.title(120, 100, 1600, 'Emplaçament', { fs: 70 }); b.rect(120, 240, 1100, 740, '#eeeeee'); b.sym('nord-3', 1100, 270, 90); b.text(1300, 260, 500, 'Descripció de la parcel·la, l\'entorn, l\'orientació i els accessos.', { fs: 38, lh: 1.4 }); return { name: 'Emplaçament' }; },
  b => { b.title(120, 100, 1600, 'Programa', { fs: 70 }); [['codi-residencial', 'Habitatge', '1.850 m²'], ['codi-terciari', 'Local comercial', '320 m²'], ['codi-comunes', 'Zones comunes', '410 m²'], ['codi-verd', 'Espai lliure', '600 m²']].forEach(([s, t, v], i) => { const y = 280 + i * 160; b.sym(s, 120, y, 200, 120); b.text(380, y + 40, 800, t, { fs: 48 }); b.title(1300, y + 36, 400, v, { fs: 56, ta: 'right' }); }); return { name: 'Programa' }; },
  b => { b.title(120, 100, 1600, 'Plantes', { fs: 70 }); b.rect(120, 240, 820, 740, '#eeeeee'); b.rect(980, 240, 820, 740, '#eeeeee'); b.sym('escala-200', 1500, 900, 280, 70); return { name: 'Plantes' }; },
  b => { b.title(120, 100, 1600, 'Instal·lacions i sostenibilitat', { fs: 70 }); [['re-fotovoltaica', 'Fotovoltaica'], ['re-aerotermia', 'Aerotèrmia'], ['cl-recuperador', 'Ventilació amb recuperació'], ['re-recarrega', 'Recàrrega VE']].forEach(([s, t], i) => { const x = 120 + i * 430; b.sym(s, x + 95, 320, 200); b.text(x, 560, 390, t, { fs: 38, ta: 'center' }); }); return { name: 'Instal·lacions' }; },
  b => { b.rect(0, 0, 1920, 1080, K); b.title(120, 440, 1600, 'Gràcies', { fs: 140, c: '#ffffff' }); return { bg: K, name: 'Final' }; },
]);

const pack = {
  format: 'guaitaLlencPack', version: 1, id: 'arquitectura', name: 'Arquitectura i enginyeria', app: 'guaitaLlenç 0.12.1',
  description: 'Símbols tècnics per a plànols: anotació, llegendes i trames, instal·lacions (electricitat, aigua, gas, clima, elevació, renovables, telecomunicacions), protecció contra incendis, senyalètica, mobiliari, estructura i urbanisme. Convencions inspirades en UNE/ISO; no substitueixen la senyalització homologada.',
  author: 'SBS BiM Consulting, Jordi Subirós', license: 'AGPL-3.0-only (codi) · símbols originals sota la mateixa llicència',
  created: new Date().toISOString().slice(0, 10),
  cats: { lamines: 'Làmines i caixetins', llegendes: 'Llegendes', quadres: 'Quadres', senyaletica: 'Seguretat i senyalètica', documents: 'Documents tècnics' },
  symCats: SYM_CATS,
  palettes: [
    { id: 'arq-tecnica', name: 'Tècnica B/N', c: ['#111111', '#555555', '#d62828', '#111111', '#ffffff', '#bbbbbb'] },
    { id: 'arq-instal', name: 'Instal·lacions', c: ['#d6281b', '#1f6fd1', '#e8a200', '#111111', '#ffffff', '#11998e'] },
    { id: 'arq-seguretat', name: 'Seguretat', c: ['#1e8a44', '#1f5fbf', '#f5c400', '#111111', '#ffffff', '#d62828'] },
    { id: 'arq-paisatge', name: 'Paisatge', c: ['#3f6b4a', '#8fb98a', '#c8a46a', '#2a2a2a', '#f4f1ea', '#9aa0a6'] },
  ],
  symbols: SYMBOLS,
  templates: TPL,
};
fs.writeFileSync(new URL('./arquitectura.llencpack.json', import.meta.url), JSON.stringify(pack));
console.log('plantilles:', TPL.length, 'pàgines:', TPL.reduce((a, t) => a + t.pages.length, 0), 'símbols:', SYMBOLS.length, 'mida:', (JSON.stringify(pack).length / 1024).toFixed(0) + ' KB');
