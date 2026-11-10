// Build guaitaLlenç → un sol HTML autònom
import fs from 'node:fs';
import path from 'node:path';

const VERSION = '0.13.0';
const root = path.dirname(new URL(import.meta.url).pathname);
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');

const FONTS = [
  ['IBM Plex Sans', 300, 'normal', 'ibm-plex-sans-latin-300-normal'],
  ['IBM Plex Sans', 400, 'normal', 'ibm-plex-sans-latin-400-normal'],
  ['IBM Plex Sans', 500, 'normal', 'ibm-plex-sans-latin-500-normal'],
  ['IBM Plex Sans', 600, 'normal', 'ibm-plex-sans-latin-600-normal'],
  ['IBM Plex Sans', 700, 'normal', 'ibm-plex-sans-latin-700-normal'],
  ['IBM Plex Sans', 400, 'italic', 'ibm-plex-sans-latin-400-italic'],
  ['IBM Plex Sans', 700, 'italic', 'ibm-plex-sans-latin-700-italic'],
  ['IBM Plex Serif', 400, 'normal', 'ibm-plex-serif-latin-400-normal'],
  ['IBM Plex Serif', 700, 'normal', 'ibm-plex-serif-latin-700-normal'],
  ['IBM Plex Serif', 400, 'italic', 'ibm-plex-serif-latin-400-italic'],
  ['IBM Plex Mono', 400, 'normal', 'ibm-plex-mono-latin-400-normal'],
  ['IBM Plex Mono', 500, 'normal', 'ibm-plex-mono-latin-500-normal'],
  ['IBM Plex Sans Condensed', 400, 'normal', 'ibm-plex-sans-condensed-latin-400-normal'],
  ['IBM Plex Sans Condensed', 500, 'normal', 'ibm-plex-sans-condensed-latin-500-normal'],
  ['IBM Plex Sans Condensed', 600, 'normal', 'ibm-plex-sans-condensed-latin-600-normal'],
  ['Fredoka', 400, 'normal', 'fredoka-latin-400-normal'],
  ['Fredoka', 600, 'normal', 'fredoka-latin-600-normal'],
  ['Fredoka', 700, 'normal', 'fredoka-latin-700-normal'],
  ['Baloo 2', 400, 'normal', 'baloo-2-latin-400-normal'],
  ['Baloo 2', 600, 'normal', 'baloo-2-latin-600-normal'],
  ['Baloo 2', 800, 'normal', 'baloo-2-latin-800-normal'],
  ['Inter', 400, 'normal', 'inter-latin-400-normal'],
  ['Inter', 500, 'normal', 'inter-latin-500-normal'],
  ['Inter', 700, 'normal', 'inter-latin-700-normal'],
  ['Montserrat', 400, 'normal', 'montserrat-latin-400-normal'],
  ['Montserrat', 600, 'normal', 'montserrat-latin-600-normal'],
  ['Montserrat', 800, 'normal', 'montserrat-latin-800-normal'],
];
const fontData = FONTS.map(([f, w, s, file]) => ({
  f, w, s, d: fs.readFileSync(path.join(root, 'fonts', file + '.woff2')).toString('base64')
}));

const jsDir = path.join(root, 'src/js');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort();
const js = jsFiles.map(f => `// ── ${f} ──\n` + rd('src/js/' + f)).join('\n');

let html = rd('src/shell.html')
  .replaceAll('%%VERSION%%', VERSION)
  .replace('/*%%CSS%%*/', () => rd('src/style.css'))
  .replace('<!--%%BODY%%-->', () => rd('src/body.html').replaceAll('%%VERSION%%', VERSION))
  .replace('/*%%FONTS%%*/', () => 'const GL_FONTS = ' + JSON.stringify(fontData) + ';')
  .replace('/*%%JS%%*/', () => js.replaceAll('%%VERSION%%', VERSION));

const out = path.join(root, 'dist', `guaitaLlenc-v${VERSION}.html`);
fs.writeFileSync(out, html);
// JS sol per a node --check
fs.writeFileSync(path.join(root, 'dist', 'app.check.js'), js);
console.log('OK', out, (html.length / 1024).toFixed(0) + ' KB');
