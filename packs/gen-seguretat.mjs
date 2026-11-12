// Genera packs/seguretat-investigacio.llencpack.json (només símbols i gràfics)
// Copyright (C) 2026 SBS BiM Consulting, Jordi Subirós — AGPL-3.0-only
import fs from 'node:fs';
import { SYMBOLS, SYM_CATS } from './gen-seguretat-symbols.mjs';

const pack = {
  format: 'guaitaLlencPack', version: 1, id: 'seguretat-investigacio', name: 'Seguretat, policia i investigació', app: 'guaitaLlenç 0.13.2',
  description: 'Símbols genèrics i originals de seguretat ciutadana, vigilància, espionatge i investigació, per a cartells, tallers i jocs de rol. No inclou escuts, logotips ni distintius de cossos policials reals, ni personatges de ficció ni les seves marques.',
  author: 'SBS BiM Consulting, Jordi Subirós', license: 'AGPL-3.0-only (codi) · símbols originals sota la mateixa llicència',
  created: new Date().toISOString().slice(0, 10),
  cats: {},
  symCats: SYM_CATS,
  palettes: [
    { id: 'seg-neutra', name: 'Neutra', c: ['#111111', '#555555', '#d62828', '#f5c400', '#ffffff', '#888888'] },
    { id: 'seg-vigilancia', name: 'Vigilància', c: ['#1f5fbf', '#111111', '#d62828', '#f5c400', '#ffffff', '#1e8a44'] },
    { id: 'seg-secret', name: 'Secret', c: ['#111111', '#d62828', '#f5c400', '#ffffff', '#333333', '#888888'] },
  ],
  symbols: SYMBOLS,
  templates: [],
};
fs.writeFileSync(new URL('./seguretat-investigacio.llencpack.json', import.meta.url), JSON.stringify(pack));
console.log('símbols:', SYMBOLS.length, 'mida:', (JSON.stringify(pack).length / 1024).toFixed(0) + ' KB');
