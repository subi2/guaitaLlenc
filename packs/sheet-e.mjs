import fs from 'node:fs';
import { SYMBOLS } from './gen-empresa-symbols.mjs';
console.log('símbols:', SYMBOLS.length, 'ids únics:', new Set(SYMBOLS.map(s=>s.id)).size);
const cells = SYMBOLS.map(s => `<div><div class=t>${s.svg}</div><span>${s.id}</span></div>`).join('');
fs.writeFileSync('/tmp/claude-0/-home-claude/62c1dd17-dba0-5b5c-a827-496c12ec5967/scratchpad/sheet-e.html', `<style>body{margin:0;font:9px sans-serif;display:grid;grid-template-columns:repeat(16,1fr);gap:2px;background:#ddd}div>div{background:#fff;aspect-ratio:1;padding:4px}svg{width:100%;height:100%}span{display:block;text-align:center;height:11px;overflow:hidden}</style>${cells}`);
