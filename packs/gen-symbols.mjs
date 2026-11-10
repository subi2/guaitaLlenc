// Il·lustracions originals del paquet infantil (SVG pla, 100×100)
// Copyright (C) 2026 SBS BiM Consulting, Jordi Subirós — AGPL-3.0-only
const O = '#2d2a32', W = 2.4;
const st = (f) => `fill="${f}" stroke="${O}" stroke-width="${W}"`;
export const c = (cx, cy, r, f) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${st(f)}/>`;
export const e = (cx, cy, rx, ry, f, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${st(f)}${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
export const r = (x, y, w, h, rx, f, rot) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${st(f)}${rot ? ` transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"` : ''}/>`;
export const p = (d, f) => `<path d="${d}" ${st(f)}/>`;
export const l = (d, sw = W, col = O) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
const dot = (x, y, rr = 2.6) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${O}"/><circle cx="${x + rr * .35}" cy="${y - rr * .35}" r="${rr * .32}" fill="#fff"/>`;
const eyes = (x1, x2, y, rr) => dot(x1, y, rr) + dot(x2, y, rr);
const smile = (cx, cy, w = 8, d = 4) => l(`M${cx - w / 2} ${cy}q${w / 2} ${d} ${w} 0`, 2);
const blush = (x1, x2, y, col = '#ff8fa3') => `<ellipse cx="${x1}" cy="${y}" rx="3.6" ry="2.2" fill="${col}" opacity=".7"/><ellipse cx="${x2}" cy="${y}" rx="3.6" ry="2.2" fill="${col}" opacity=".7"/>`;
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const S = [];
const add = (id, name, cat, tags, body) => S.push({ id, name, cat, tags, svg: wrap(body) });

/* ── Cares d'animals (generades) ── */
function face(col, o = {}) {
  let b = '';
  const ear = o.ear || 'round', ec = o.earIn || '#ffb3c1';
  if (ear === 'tri') b += p('M22 42L24 12L44 28Z', col) + p('M78 42L76 12L56 28Z', col) + p('M27 34L28 20L38 28Z', ec).replace(st(ec), `fill="${ec}"`);
  if (ear === 'round') b += c(24, 26, 12, o.earCol || col) + c(76, 26, 12, o.earCol || col) + `<circle cx="24" cy="26" r="6" fill="${ec}"/><circle cx="76" cy="26" r="6" fill="${ec}"/>`;
  if (ear === 'long') b += e(36, 18, 8, 20, col, -8) + e(64, 18, 8, 20, col, 8) + `<ellipse cx="36" cy="20" rx="3.5" ry="13" fill="${ec}" transform="rotate(-8 36 20)"/><ellipse cx="64" cy="20" rx="3.5" ry="13" fill="${ec}" transform="rotate(8 64 20)"/>`;
  if (o.mane) b += c(50, 54, 40, o.mane);
  b += c(50, 54, o.fr || 32, col);
  if (ear === 'floppy') b += e(20, 50, 9, 18, o.earCol || '#8a5a3b', 18) + e(80, 50, 9, 18, o.earCol || '#8a5a3b', -18);
  if (ear === 'horn') b += p('M30 30q-8-10 -4-20q4 8 12 12z', '#f4e3c1') + p('M70 30q8-10 4-20q-4 8 -12 12z', '#f4e3c1') + e(22, 42, 10, 6, col, -20) + e(78, 42, 10, 6, col, 20);
  if (o.patch) b += o.patch;
  b += eyes(39, 61, 50, o.eye || 3);
  if (o.snout) b += e(50, 66, 13, 9, o.snout);
  if (o.nose !== false) b += e(50, 61, 4, 3, o.noseCol || O).replace(`stroke-width="${W}"`, 'stroke-width="1"');
  b += o.mouth || l('M44 67q6 5 12 0', 2);
  if (o.whisk) b += l('M28 60h-12M28 64l-11 3M72 60h12M72 64l11 3', 1.4);
  if (o.extra) b += o.extra;
  b += blush(32, 68, 62);
  return b;
}
add('gat', 'Gat', 'animals', 'gat mix felí', face('#f6a945', { ear: 'tri', whisk: true, patch: l('M50 24v8M42 26l2 6M58 26l-2 6', 2) }));
add('gos', 'Gos', 'animals', 'gos gosset', face('#e9c79a', { ear: 'floppy', earCol: '#8a5a3b', snout: '#fff3e0', patch: e(62, 46, 9, 8, '#8a5a3b') }));
add('ossa', 'Ós', 'animals', 'ós ossa bru', face('#a8714b', { ear: 'round', earIn: '#e0b48c', snout: '#e8c9a6' }));
add('conill', 'Conill', 'animals', 'conill conilla', face('#f2f2f2', { ear: 'long', mouth: l('M50 64v4M44 70q6 4 12 0', 2) + r(46.5, 68, 7, 6, 1.5, '#fff') }));
add('guineu', 'Guineu', 'animals', 'guineu guilla', face('#f07a2b', { ear: 'tri', earIn: '#fff', patch: p('M28 62q22 22 44 0q-6 18 -22 20q-16 -2 -22 -20z', '#fff') }));
add('lleo', 'Lleó', 'animals', 'lleó felí sabana', face('#f7c34b', { ear: 'round', earIn: '#e8a33a', mane: '#c8692b', fr: 28 }));
add('panda', 'Panda', 'animals', 'panda ós xina', face('#fff', { ear: 'round', earCol: O, earIn: '#555', patch: e(38, 50, 8, 10, '#3a3640', -20) + e(62, 50, 8, 10, '#3a3640', 20) }));
add('koala', 'Koala', 'animals', 'koala austràlia', face('#a7a9b4', { ear: 'round', earIn: '#e6e7ec', nose: false, extra: e(50, 61, 7, 9, '#3a3640') }));
add('porc', 'Porc', 'animals', 'porc porquet granja', face('#ffb3c1', { ear: 'tri', earIn: '#ff8fa3', nose: false, extra: e(50, 64, 11, 8, '#ff8fa3') + `<circle cx="46" cy="64" r="2" fill="${O}"/><circle cx="54" cy="64" r="2" fill="${O}"/>`, mouth: '' }));
add('ratoli', 'Ratolí', 'animals', 'ratolí rata', face('#c4c6cf', { ear: 'round', earIn: '#ffb3c1', whisk: true, noseCol: '#ff7a95' }));
add('mico', 'Mico', 'animals', 'mico mona simi', face('#8a5a3b', { ear: 'round', earIn: '#e8c9a6', extra: p('M30 48q0-14 20-12q20-2 20 12q0 26 -20 26q-20 0 -20 -26z', '#e8c9a6') + eyes(41, 59, 50, 3) + e(50, 60, 3, 2, O) + l('M43 66q7 6 14 0', 2) }));
add('vaca', 'Vaca', 'animals', 'vaca granja', face('#fff', { ear: 'horn', snout: '#ffb3c1', patch: e(36, 40, 9, 7, O, 20) }));
add('tigre', 'Tigre', 'animals', 'tigre felí', face('#f58a2b', { ear: 'round', earIn: '#fff', whisk: true, patch: l('M50 24v10M40 27l3 7M60 27l-3 7M20 50h8M72 50h8M21 58h7M72 58h7', 3) }));
add('granota', 'Granota', 'animals', 'granota gripau', c(34, 32, 12, '#7ccf5b') + c(66, 32, 12, '#7ccf5b') + e(50, 60, 34, 26, '#7ccf5b') + c(34, 31, 7, '#fff') + c(66, 31, 7, '#fff') + dot(35, 31, 3.4) + dot(67, 31, 3.4) + l('M32 64q18 16 36 0', 2.4) + blush(28, 72, 58));
add('mussol', 'Mussol', 'animals', 'mussol òliba ocell nit', p('M22 30L30 14L40 26Q50 22 60 26L70 14L78 30Q86 60 70 82Q50 94 30 82Q14 60 22 30Z', '#9b6b47') + e(50, 70, 16, 14, '#e8c9a6') + c(38, 42, 11, '#fff') + c(62, 42, 11, '#fff') + dot(38, 42, 4.5) + dot(62, 42, 4.5) + p('M46 52l4 7 4-7z', '#f6a945') + l('M44 66l2 3 2-3M52 66l2 3 2-3M48 74l2 3 2-3', 1.6));

/* ── Animals de cos sencer ── */
add('peix', 'Peix', 'animals', 'peix mar aigua', p('M18 50L4 34V66Z', '#ff8c42') + e(50, 50, 34, 22, '#ffb347') + l('M44 32q-8 18 0 36', 2) + l('M58 36q4 14 0 28', 1.6) + dot(72, 46, 3.2) + l('M80 56q-4 3 -8 0', 2) + p('M44 30q8-16 22-6z', '#ff8c42'));
add('balena', 'Balena', 'animals', 'balena mar', p('M10 58Q12 28 52 28Q86 28 88 52Q90 78 54 78Q20 78 10 58Z', '#5aa9e6') + p('M10 58Q4 44 2 38Q12 42 16 50Z', '#5aa9e6') + p('M22 66q30 14 62 -6q-4 18 -30 18q-22 0 -32 -12z', '#cfe8ff') + dot(70, 48, 3) + l('M50 26q-4-12 -10-14M50 26q2-12 8-16M50 26q0-10 0-16', 2, '#5aa9e6') + blush(78, 78, 56));
add('dofi', 'Dofí', 'animals', 'dofí mar', p('M8 62Q22 26 62 30Q80 32 92 46L80 48Q72 70 40 70Q24 70 8 62Z', '#7fa7d6') + p('M50 31L56 16L64 33Z', '#7fa7d6') + p('M14 62L4 74L22 68Z', '#7fa7d6') + dot(70, 44, 2.8) + l('M74 54q4 0 8-4', 1.8));
add('pop', 'Pop', 'animals', 'pop mar tentacles', [20, 34, 50, 66, 80].map((x, i) => l(`M${x} 60q${i % 2 ? 6 : -6} 16 ${i % 2 ? -4 : 4} 30`, 8, '#c86fd6')).join('') + e(50, 42, 30, 28, '#d88be3') + eyes(40, 60, 44, 3.4) + smile(50, 54, 10) + blush(32, 68, 52));
add('tortuga', 'Tortuga', 'animals', 'tortuga rèptil', e(84, 58, 9, 8, '#9bd36a') + r(24, 66, 10, 14, 4, '#9bd36a') + r(62, 66, 10, 14, 4, '#9bd36a') + p('M14 68Q16 30 50 30Q82 30 84 68Z', '#4f9d4f') + l('M30 68L38 46H62L70 68M38 46L50 32L62 46M50 46v22', 2) + dot(87, 56, 2.2));
add('papallona', 'Papallona', 'animals', 'papallona insecte primavera', e(30, 36, 20, 18, '#ff8fb1', -20) + e(70, 36, 20, 18, '#ff8fb1', 20) + e(34, 68, 14, 12, '#ffd166', 20) + e(66, 68, 14, 12, '#ffd166', -20) + c(30, 36, 6, '#fff') + c(70, 36, 6, '#fff') + e(50, 52, 5, 26, O) + l('M48 26q-6-12 -14-14M52 26q6-12 14-14', 2));
add('abella', 'Abella', 'animals', 'abella insecte mel', e(36, 34, 14, 10, '#e6f4ff', -30) + e(64, 34, 14, 10, '#e6f4ff', 30) + e(50, 58, 30, 22, '#ffd23f') + `<path d="M36 40v36M50 36v44M64 40v36" stroke="${O}" stroke-width="6"/>` + eyes(72, 80, 54, 2.4) + p('M20 58L10 58L20 54Z', O));
add('marieta', 'Marieta', 'animals', 'marieta insecte', c(50, 26, 12, O) + e(50, 58, 32, 30, '#ef3b3b') + l('M50 30v58', 2.4) + [[36, 48], [64, 48], [32, 66], [68, 66], [44, 78], [56, 78]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${O}"/>`).join('') + eyes(45, 55, 24, 2));
add('cargol', 'Cargol', 'animals', 'cargol', p('M8 82H84Q92 82 92 74V62Q84 66 78 74H8Z', '#f2c48d') + c(48, 50, 26, '#c8834b') + l('M48 50m-6 0a6 6 0 1 0 6 -6a12 12 0 1 1 -12 12a18 18 0 1 0 18 -18', 2.2) + l('M82 64L80 44M88 64L92 46', 2) + `<circle cx="80" cy="44" r="3" fill="${O}"/><circle cx="92" cy="46" r="3" fill="${O}"/>`);
add('ocell', 'Ocell', 'animals', 'ocell pardal', e(48, 54, 30, 26, '#5bc0eb') + p('M30 52q14 -6 26 6q-14 14 -26 -6z', '#2e9ccb') + p('M76 48L92 52L76 58Z', '#ffb703') + dot(64, 44, 3) + p('M18 54L4 46L8 62Z', '#2e9ccb') + l('M40 80v10M54 80v10', 2.4));
add('pingui', 'Pingüí', 'animals', 'pingüí pol fred', e(50, 56, 28, 36, '#2f3a4a') + e(50, 62, 18, 26, '#fff') + eyes(42, 58, 38, 3) + p('M46 44L54 44L50 50Z', '#ffb703') + e(26, 60, 6, 16, '#2f3a4a', 20) + e(74, 60, 6, 16, '#2f3a4a', -20) + e(40, 92, 8, 4, '#ffb703') + e(60, 92, 8, 4, '#ffb703'));
add('dino', 'Dinosaure', 'animals', 'dinosaure dino', p('M14 76Q10 54 30 52Q36 30 58 30Q78 30 80 48Q92 50 92 60Q92 68 80 68Q78 86 56 86H30Q14 86 14 76Z', '#7ccf5b') + [36, 46, 56, 66].map(x => p(`M${x - 5} 31L${x} 20L${x + 5} 31Z`, '#ffb703')).join('') + dot(74, 50, 3) + l('M82 62q4 2 8 0', 2) + r(32, 82, 10, 12, 3, '#7ccf5b') + r(56, 82, 10, 12, 3, '#7ccf5b'));
add('elefant', 'Elefant', 'animals', 'elefant sabana', e(20, 46, 16, 22, '#a7b4c6') + e(80, 46, 16, 22, '#a7b4c6') + c(50, 44, 26, '#b9c4d4') + p('M42 58Q40 86 52 90Q60 92 60 84Q56 82 56 76Q58 64 58 58Z', '#b9c4d4') + eyes(40, 60, 42, 3) + blush(34, 66, 54));
add('girafa', 'Girafa', 'animals', 'girafa sabana', r(40, 40, 16, 56, 6, '#ffcf56') + e(58, 30, 22, 14, '#ffcf56', -10) + l('M50 18L48 8M60 16L62 6', 2.4) + `<circle cx="48" cy="8" r="3" fill="#a8714b"/><circle cx="62" cy="6" r="3" fill="#a8714b"/>` + [[46, 52], [50, 68], [45, 82], [62, 36]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="3" fill="#c8834b"/>`).join('') + dot(58, 26, 2.6) + e(74, 33, 5, 4, '#e8b04a'));
add('cavall', 'Cavall', 'animals', 'cavall poni granja', p('M30 92V58Q24 30 50 18L56 10L60 20Q80 26 84 50Q86 60 76 62Q66 62 62 52L54 58V92Z', '#c8834b') + p('M50 18Q40 22 34 40Q30 50 32 60L42 44Q46 30 56 22Z', '#5c3b28') + dot(66, 36, 2.8) + `<circle cx="80" cy="54" r="1.6" fill="${O}"/>`);
add('ovella', 'Ovella', 'animals', 'ovella be granja', [[30, 40], [50, 32], [70, 40], [78, 58], [66, 74], [44, 76], [26, 66], [22, 50]].map(([x, y]) => c(x, y, 14, '#fff')).join('') + c(50, 54, 24, '#fff') + e(50, 54, 14, 17, '#4a4550') + eyes(45, 55, 50, 2.6) + `<circle cx="46" cy="50" r="1" fill="#fff"/>` + l('M46 62q4 3 8 0', 1.8, '#fff'));
add('gallina', 'Gallina', 'animals', 'gallina pollastre granja', p('M18 60Q18 30 46 30Q70 30 76 52L90 46L84 62Q80 86 50 86Q18 86 18 60Z', '#fff') + p('M38 30q-2-12 6-12q2-8 8 0q8 -2 6 12z', '#ef3b3b') + p('M18 50L6 52L18 58Z', '#ffb703') + dot(30, 44, 2.6) + e(26, 58, 4, 6, '#ef3b3b') + p('M44 62q14 -4 20 8q-14 8 -20 -8z', '#f2f2f2'));
add('pollet', 'Pollet', 'animals', 'pollet pasqua', c(50, 56, 30, '#ffe066') + eyes(40, 60, 50, 3.2) + p('M45 58L55 58L50 66Z', '#ff9f1c') + l('M46 24q4-8 4 2q2-8 6 0', 2) + blush(32, 68, 62) + l('M40 86v8M60 86v8', 2.4, '#ff9f1c'));
add('anec', 'Ànec', 'animals', 'ànec bassa', p('M14 64Q14 50 34 50Q30 24 52 22Q72 22 72 42Q70 50 62 54Q86 52 92 40Q94 82 50 84Q14 84 14 64Z', '#ffd23f') + p('M70 38L88 40L74 46Z', '#ff9f1c') + dot(58, 34, 2.8) + p('M38 62q14 -6 22 6q-12 8 -22 -6z', '#f7b801'));

/* ── Natura ── */
const ray = (cx, cy, r1, r2, n, col, sw = 3) => Array.from({ length: n }, (_, i) => { const a = i * Math.PI * 2 / n; return `M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)}L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}`; }).join('');
add('sol', 'Sol', 'natura', 'sol estiu temps', l(ray(50, 50, 30, 44, 12), 4, '#ffb703') + c(50, 50, 24, '#ffd23f') + eyes(42, 58, 46, 2.8) + smile(50, 56, 12, 5) + blush(36, 64, 54));
add('nuvol', 'Núvol', 'natura', 'núvol temps cel', p('M22 72Q8 72 8 60Q8 46 24 46Q26 28 46 28Q62 28 66 42Q72 36 80 38Q94 42 92 58Q92 72 78 72Z', '#f4f7fb'));
add('pluja', 'Pluja', 'natura', 'pluja núvol temps tardor', p('M22 56Q8 56 8 44Q8 30 24 30Q26 12 46 12Q62 12 66 26Q72 20 80 22Q94 26 92 42Q92 56 78 56Z', '#cfd8e6') + [[26, 66], [44, 72], [62, 66], [80, 72], [34, 86], [70, 86]].map(([x, y]) => p(`M${x} ${y}q-5 8 0 10q5 -2 0 -10z`, '#5aa9e6')).join(''));
add('arcsm', 'Arc de Sant Martí', 'natura', 'arc iris pluja colors', ['#ef3b3b', '#ff9f1c', '#ffd23f', '#7ccf5b', '#5aa9e6', '#8e6cdb'].map((col, i) => l(`M${8 + i * 5} 76A${42 - i * 5} ${42 - i * 5} 0 0 1 ${92 - i * 5} 76`, 5.2, col)).join('') + p('M2 78Q2 66 14 66Q20 60 26 66Q34 66 34 78Z', '#fff') + p('M66 78Q66 66 78 66Q84 60 90 66Q98 66 98 78Z', '#fff'));
add('lluna', 'Lluna', 'natura', 'lluna nit', p('M64 12A40 40 0 1 0 88 66A32 32 0 1 1 64 12Z', '#ffe680') + dot(44, 52, 2.4) + l('M48 66q6 3 10 -2', 2) + `<circle cx="36" cy="40" r="4" fill="#ffd23f" opacity=".7"/><circle cx="30" cy="66" r="3" fill="#ffd23f" opacity=".7"/>`);
add('estrella', 'Estrella', 'natura', 'estrella nit cel', p('M50 6L62 36L94 38L69 58L78 90L50 72L22 90L31 58L6 38L38 36Z', '#ffd23f') + eyes(42, 58, 50, 2.6) + smile(50, 58, 8, 3));
add('llamp', 'Llamp', 'natura', 'llamp tempesta', p('M58 4L22 54H46L36 96L80 38H54Z', '#ffd23f'));
add('floc', 'Floc de neu', 'natura', 'neu hivern fred', l('M50 8V92M14 29L86 71M14 71L86 29M50 22l-8-8M50 22l8-8M50 78l-8 8M50 78l8 8M24 35l-11 0M24 35l-3 -10M76 65l11 0M76 65l3 10M24 65l-11 0M24 65l-3 10M76 35l11 0M76 35l3 -10', 4, '#5aa9e6'));
add('ninot-neu', 'Ninot de neu', 'natura', 'neu hivern nadal', c(50, 70, 24, '#fff') + c(50, 34, 17, '#fff') + r(36, 8, 28, 14, 2, O) + r(30, 20, 40, 4, 2, O) + eyes(44, 56, 32, 2.4) + p('M50 37l12 3-12 3z', '#ff9f1c') + l('M34 46q16 8 32 0', 5, '#ef3b3b') + `<circle cx="50" cy="62" r="2.4" fill="${O}"/><circle cx="50" cy="74" r="2.4" fill="${O}"/>` + l('M27 62L10 50M73 62L90 50', 2.4, '#8a5a3b'));
add('flor', 'Flor', 'natura', 'flor primavera', l('M50 56V96M50 80q14-12 22-6q-6 10 -22 6', 3, '#4f9d4f') + [0, 72, 144, 216, 288].map(a => e(50 + Math.cos((a - 90) * Math.PI / 180) * 16, 40 + Math.sin((a - 90) * Math.PI / 180) * 16, 11, 13, '#ff8fb1', a)).join('') + c(50, 40, 10, '#ffd23f'));
add('gira-sol', 'Gira-sol', 'natura', 'gira-sol flor estiu', l('M50 60V96M50 82q-14-12 -22-6q6 10 22 6', 3, '#4f9d4f') + Array.from({ length: 14 }, (_, i) => e(50 + Math.cos(i / 14 * 6.283) * 22, 38 + Math.sin(i / 14 * 6.283) * 22, 8, 5, '#ffd23f', i / 14 * 360)).join('') + c(50, 38, 15, '#8a5a3b'));
add('tulipa', 'Tulipa', 'natura', 'tulipa flor primavera', l('M50 54V96', 3, '#4f9d4f') + p('M50 92Q30 80 28 60Q40 66 50 80Z', '#7ccf5b') + p('M30 22Q30 58 50 58Q70 58 70 22L60 34L50 18L40 34Z', '#ef476f'));
add('arbre', 'Arbre', 'natura', 'arbre bosc', r(43, 60, 14, 34, 3, '#8a5a3b') + c(50, 40, 30, '#5fbf5f') + c(30, 50, 16, '#5fbf5f') + c(70, 50, 16, '#5fbf5f') + `<circle cx="38" cy="34" r="4" fill="#ef3b3b"/><circle cx="62" cy="46" r="4" fill="#ef3b3b"/><circle cx="52" cy="26" r="4" fill="#ef3b3b"/>`);
add('pi', 'Pi', 'natura', 'pi avet arbre bosc', r(44, 78, 12, 16, 2, '#8a5a3b') + p('M50 6L74 40H62L82 64H66L88 82H12L34 64H18L38 40H26Z', '#3f9b5b'));
add('arbre-tardor', 'Arbre de tardor', 'natura', 'arbre tardor', r(43, 60, 14, 34, 3, '#8a5a3b') + c(50, 40, 30, '#f4a259') + c(30, 50, 16, '#e76f51') + c(70, 50, 16, '#f4a259') + p('M18 92q4-6 8 0q-4 4 -8 0z', '#e76f51') + p('M78 88q4-6 8 0q-4 4 -8 0z', '#f4a259'));
add('cactus', 'Cactus', 'natura', 'cactus desert', r(18, 76, 64, 20, 4, '#e07a5f') + r(40, 14, 20, 64, 10, '#6fbf73') + p('M40 52H28Q22 52 22 46V34Q22 28 28 28Q32 28 32 34V44H40', '#6fbf73') + p('M60 44H70V30Q70 24 76 24Q80 24 80 30V44Q80 52 72 52H60', '#6fbf73') + c(50, 12, 5, '#ff8fb1'));
add('fulla', 'Fulla', 'natura', 'fulla tardor natura', p('M50 92Q10 70 20 30Q40 6 80 10Q90 50 50 92Z', '#7ccf5b') + l('M50 92Q50 50 76 16M46 60L30 46M54 46L36 30M58 70L72 56', 2));
add('bolet', 'Bolet', 'natura', 'bolet tardor bosc', r(38, 50, 24, 40, 8, '#fff3e0') + p('M8 54Q10 12 50 12Q90 12 92 54Z', '#ef3b3b') + `<circle cx="34" cy="30" r="6" fill="#fff"/><circle cx="62" cy="24" r="5" fill="#fff"/><circle cx="74" cy="42" r="5" fill="#fff"/><circle cx="24" cy="46" r="4" fill="#fff"/>` + eyes(44, 56, 66, 2.4) + smile(50, 74, 6, 3));
add('muntanya', 'Muntanya', 'natura', 'muntanya paisatge neu', p('M2 90L36 26L56 58L70 40L98 90Z', '#7d8fa6') + p('M36 26L46 44L40 42L34 48L28 40Z', '#fff') + p('M70 40L78 54L72 52L66 56Z', '#fff'));
add('onada', 'Onada', 'natura', 'mar ona platja estiu', p('M2 70Q14 30 46 34Q70 38 64 58Q56 46 44 52Q36 58 46 66Q62 76 98 60V98H2Z', '#5aa9e6') + l('M8 82q12-6 24 0t24 0t24 0t16 0', 2.4, '#fff'));
add('castanya', 'Castanya', 'natura', 'castanya tardor castanyada', p('M50 12Q86 40 82 70Q78 92 50 92Q22 92 18 70Q14 40 50 12Z', '#8a4b2b') + p('M24 74Q50 86 76 74Q72 92 50 92Q28 92 24 74Z', '#e8c9a6') + l('M36 34q6-8 14-8', 2, '#c8834b'));
add('foc', 'Foc', 'natura', 'foc foguera sant joan', p('M50 6Q62 28 74 38Q90 54 84 74Q78 94 50 94Q22 94 16 74Q12 56 28 44Q30 58 40 60Q34 34 50 6Z', '#ff7b2b') + p('M50 46Q58 60 64 68Q70 86 50 88Q32 86 36 70Q40 62 46 60Q44 54 50 46Z', '#ffd23f'));
add('gota', 'Gota d\'aigua', 'natura', 'aigua gota', p('M50 8Q78 44 78 64A28 28 0 0 1 22 64Q22 44 50 8Z', '#5aa9e6') + eyes(42, 58, 62, 2.6) + smile(50, 70, 8, 3) + p('M34 56q0-10 8-18', '#fff').replace(st('#fff'), 'fill="none" stroke="#fff" stroke-width="3"'));
add('planta', 'Planta en test', 'natura', 'planta test', p('M28 62H72L66 94H34Z', '#e07a5f') + r(24, 56, 52, 10, 3, '#e07a5f') + l('M50 56V26', 3, '#4f9d4f') + p('M50 40Q30 40 24 22Q44 20 50 40Z', '#7ccf5b') + p('M50 32Q70 30 76 12Q56 10 50 32Z', '#7ccf5b'));
add('terra', 'Planeta Terra', 'natura', 'terra món planeta medi ambient', c(50, 50, 40, '#5aa9e6') + p('M26 28Q40 22 46 32Q40 40 46 48Q38 56 26 50Q18 40 26 28Z', '#7ccf5b') + p('M60 54Q74 50 80 60Q76 76 62 82Q56 70 60 54Z', '#7ccf5b') + p('M58 18Q66 16 72 22Q66 28 58 24Z', '#7ccf5b'));
add('reciclar', 'Reciclatge', 'natura', 'reciclar medi ambient', [0, 120, 240].map(a => `<g transform="rotate(${a} 50 54)">` + l('M28 66L42 40', 7, '#3fa34d') + p('M36 34L50 32L46 46Z', '#3fa34d') + '</g>').join(''));

/* ── Menjar ── */
add('poma', 'Poma', 'menjar', 'poma fruita', p('M50 30Q30 16 18 34Q8 56 24 80Q36 96 50 86Q64 96 76 80Q92 56 82 34Q70 16 50 30Z', '#ef3b3b') + l('M50 30Q50 18 56 10', 3, '#8a5a3b') + p('M54 22Q66 8 78 16Q68 28 54 22Z', '#7ccf5b') + `<ellipse cx="34" cy="46" rx="5" ry="9" fill="#fff" opacity=".5"/>`);
add('pera', 'Pera', 'menjar', 'pera fruita', p('M50 14Q60 14 60 30Q60 44 72 56Q82 70 74 84Q64 96 50 94Q36 96 26 84Q18 70 28 56Q40 44 40 30Q40 14 50 14Z', '#b5d66b') + l('M50 14Q50 6 56 2', 3, '#8a5a3b'));
add('platan', 'Plàtan', 'menjar', 'plàtan fruita', p('M14 30Q16 82 70 82Q88 80 92 72Q70 70 50 58Q30 44 24 24Z', '#ffd23f') + l('M24 28Q26 60 60 72', 2) + p('M14 30L18 22L26 24L24 30Z', '#8a5a3b'));
add('maduixa', 'Maduixa', 'menjar', 'maduixa fruita', p('M50 92Q14 66 20 40Q28 26 50 30Q72 26 80 40Q86 66 50 92Z', '#ef3b3b') + p('M30 30L40 20L50 28L60 20L70 30L60 34L50 30L40 34Z', '#4f9d4f') + [[36, 46], [50, 44], [64, 46], [42, 60], [58, 60], [50, 74]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.6" fill="#ffd23f"/>`).join(''));
add('sindria', 'Síndria', 'menjar', 'síndria fruita estiu', p('M6 40A44 44 0 0 0 94 40Z', '#3f9b5b') + p('M12 40A38 38 0 0 0 88 40Z', '#ff5d6c') + [[30, 52], [50, 60], [70, 52], [40, 68], [60, 68]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3.4" fill="${O}"/>`).join(''));
add('taronja', 'Taronja', 'menjar', 'taronja fruita', c(50, 54, 36, '#ff9f1c') + p('M50 18Q64 4 76 12Q66 24 50 18Z', '#7ccf5b') + `<circle cx="40" cy="44" r="1.6" fill="#e8850a"/><circle cx="62" cy="62" r="1.6" fill="#e8850a"/><circle cx="56" cy="40" r="1.6" fill="#e8850a"/>`);
add('raim', 'Raïm', 'menjar', 'raïm fruita verema tardor', [[38, 30], [50, 30], [62, 30], [44, 42], [56, 42], [32, 42], [68, 42], [38, 54], [50, 54], [62, 54], [44, 66], [56, 66], [50, 78]].map(([x, y]) => c(x, y, 8, '#8e6cdb')).join('') + l('M50 22V8', 3, '#8a5a3b') + p('M50 14Q36 2 26 12Q38 20 50 14Z', '#7ccf5b'));
add('pastanaga', 'Pastanaga', 'menjar', 'pastanaga verdura', p('M30 30Q46 22 62 34Q66 40 60 50L24 92Q20 94 20 88L28 48Q26 36 30 30Z', '#ff8c42') + l('M38 46l8 4M32 62l8 4M28 76l6 3', 2) + p('M54 30Q60 8 72 6Q68 22 58 32Z', '#7ccf5b') + p('M60 36Q82 26 92 34Q78 44 62 40Z', '#7ccf5b'));
add('tomaquet', 'Tomàquet', 'menjar', 'tomàquet verdura', c(50, 56, 34, '#ef3b3b') + p('M34 26L44 30L50 20L56 30L66 26L60 36L50 32L40 36Z', '#4f9d4f') + `<ellipse cx="36" cy="48" rx="5" ry="8" fill="#fff" opacity=".45"/>`);
add('pa', 'Pa', 'menjar', 'pa barra fleca', p('M10 62Q8 40 30 32Q60 22 82 34Q96 42 90 60Q84 76 50 78Q14 80 10 62Z', '#e9b872') + l('M32 40q4 10 0 22M50 34q4 12 0 26M68 36q4 10 0 22', 2.6, '#c8834b'));
add('croissant', 'Croissant', 'menjar', 'croissant esmorzar', p('M8 66Q10 40 28 38L40 30Q50 26 60 30L72 38Q90 40 92 66Q80 54 72 58Q60 50 50 50Q40 50 28 58Q20 54 8 66Z', '#f2b45a') + l('M28 40l4 16M40 32l2 18M60 32l-2 18M72 40l-4 16', 2));
add('pizza', 'Pizza', 'menjar', 'pizza menjar', p('M50 92L10 20Q50 2 90 20Z', '#ffd166') + p('M10 20Q50 2 90 20L86 28Q50 12 14 28Z', '#e0a050') + c(40, 34, 7, '#ef3b3b') + c(62, 36, 6, '#ef3b3b') + c(50, 58, 6, '#ef3b3b') + `<circle cx="56" cy="50" r="2.4" fill="#4f9d4f"/><circle cx="36" cy="48" r="2.4" fill="#4f9d4f"/>`);
add('gelat', 'Gelat', 'menjar', 'gelat estiu postres', p('M30 52L50 96L70 52Z', '#e9b872') + l('M36 60l22 18M44 54l20 16M64 60l-22 18M56 54l-20 16', 1.6) + c(50, 42, 18, '#ff8fb1') + c(36, 50, 10, '#ff8fb1') + c(64, 50, 10, '#ff8fb1') + c(50, 20, 6, '#ef3b3b'));
add('pastis', 'Pastís', 'menjar', 'pastís aniversari festa', r(14, 50, 72, 40, 6, '#ffb3c1') + r(14, 50, 72, 14, 6, '#fff') + p('M14 60q9 10 18 0t18 0t18 0t18 0', '#fff').replace(st('#fff'), 'fill="none" stroke="#fff" stroke-width="5"') + [30, 50, 70].map(x => r(x - 3, 30, 6, 20, 1.5, '#5aa9e6') + p(`M${x} 18q6 6 0 10q-6 -4 0 -10z`, '#ffb703')).join(''));
add('magdalena', 'Magdalena', 'menjar', 'magdalena cupcake postres', p('M22 54H78L70 92H30Z', '#5aa9e6') + l('M36 56l2 36M50 56v36M64 56l-2 36', 2) + p('M18 56Q14 34 34 32Q38 14 56 18Q74 16 76 34Q90 38 82 56Z', '#ffb3c1') + c(52, 14, 6, '#ef3b3b') + `<rect x="34" y="40" width="5" height="2" fill="#ffd23f" transform="rotate(30 36 41)"/><rect x="58" y="34" width="5" height="2" fill="#5aa9e6"/><rect x="48" y="46" width="5" height="2" fill="#7ccf5b" transform="rotate(-30 50 47)"/>`);
add('galeta', 'Galeta', 'menjar', 'galeta postres', c(50, 50, 38, '#e0a050') + [[36, 36], [60, 32], [64, 58], [40, 62], [52, 48], [30, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#6b3f26"/>`).join(''));
add('ou', 'Ou ferrat', 'menjar', 'ou esmorzar', p('M20 50Q8 30 28 22Q42 8 60 18Q82 12 88 34Q96 56 80 70Q70 90 46 84Q22 86 18 70Q10 60 20 50Z', '#fff') + c(52, 50, 16, '#ffc93c'));
add('formatge', 'Formatge', 'menjar', 'formatge', p('M8 70L80 30L92 52V80H8Z', '#ffd23f') + p('M8 70L80 30L92 52Z', '#ffe680') + `<circle cx="30" cy="76" r="5" fill="#e8b90f"/><circle cx="60" cy="68" r="6" fill="#e8b90f"/><circle cx="80" cy="74" r="3" fill="#e8b90f"/>`);
add('entrepa', 'Entrepà', 'menjar', 'entrepà menjar', p('M10 50Q10 26 50 26Q90 26 90 50Z', '#e9b872') + p('M8 54q10-6 20 0t20 0t20 0t24 0V60H8Z', '#7ccf5b') + r(10, 58, 80, 8, 2, '#ef3b3b') + r(10, 66, 80, 8, 2, '#ffd23f') + r(10, 74, 80, 12, 5, '#e9b872') + `<ellipse cx="34" cy="36" rx="3" ry="1.6" fill="#fff"/><ellipse cx="56" cy="34" rx="3" ry="1.6" fill="#fff"/>`);
add('llet', 'Got de llet', 'menjar', 'llet got esmorzar', p('M26 18H74L68 92H32Z', '#e6f4ff') + p('M28 40H72L68 92H32Z', '#fff') + eyes(43, 57, 62, 2.4) + smile(50, 70, 8, 3));
add('panellets', 'Panellets', 'menjar', 'panellets tots sants castanyada', c(30, 64, 18, '#f4e3c1') + c(70, 64, 18, '#f4e3c1') + c(50, 44, 18, '#f4e3c1') + [[30, 64], [70, 64], [50, 44]].map(([x, y]) => Array.from({ length: 6 }, (_, i) => `<ellipse cx="${x + Math.cos(i) * 10}" cy="${y + Math.sin(i * 1.3) * 9}" rx="2.6" ry="1.6" fill="#c8a46a"/>`).join('')).join(''));

/* ── Transports ── */
const wheel = (x, y, rr = 9) => c(x, y, rr, '#3a3640') + `<circle cx="${x}" cy="${y}" r="${rr * .4}" fill="#cfd8e6"/>`;
add('cotxe', 'Cotxe', 'transport', 'cotxe vehicle', p('M8 70V54Q8 48 16 46L28 30Q32 26 40 26H62Q68 26 72 32L82 46Q92 48 92 56V70Z', '#ef3b3b') + p('M32 46L40 32H50V46Z', '#cfe8ff') + p('M56 46V32H64L74 46Z', '#cfe8ff') + wheel(28, 72) + wheel(72, 72) + `<circle cx="88" cy="58" r="3" fill="#ffd23f"/>`);
add('bus', 'Autobús escolar', 'transport', 'autobús bus escola excursió', r(6, 24, 88, 50, 8, '#ffc93c') + [14, 32, 50].map(x => r(x, 32, 14, 16, 2, '#cfe8ff')).join('') + r(70, 32, 18, 30, 2, '#cfe8ff') + l('M6 56H66', 2.4) + wheel(26, 76) + wheel(74, 76) + `<circle cx="92" cy="66" r="3" fill="#fff"/>`);
add('tren', 'Tren', 'transport', 'tren locomotora', r(8, 34, 44, 40, 4, '#5aa9e6') + r(50, 20, 34, 54, 4, '#ef3b3b') + r(56, 28, 22, 16, 2, '#cfe8ff') + r(18, 16, 12, 18, 2, '#3a3640') + c(24, 10, 6, '#f2f2f2') + c(34, 4, 4, '#f2f2f2') + wheel(22, 78, 8) + wheel(46, 78, 8) + wheel(72, 78, 8) + l('M2 90H98', 3));
add('avio', 'Avió', 'transport', 'avió viatge vacances', p('M8 52Q8 42 20 42H78Q94 42 94 52Q94 62 78 62H20Q8 62 8 52Z', '#f4f7fb') + p('M40 44L56 14H66L58 44Z', '#5aa9e6') + p('M40 60L56 88H66L58 60Z', '#5aa9e6') + p('M12 44L6 26H16L24 44Z', '#ef3b3b') + [30, 42, 54, 66].map(x => `<circle cx="${x}" cy="50" r="3" fill="#5aa9e6"/>`).join('') + p('M80 46Q90 46 90 52H78Z', '#cfe8ff'));
add('coet', 'Coet', 'transport', 'coet espai', p('M50 4Q74 24 70 64H30Q26 24 50 4Z', '#f4f7fb') + c(50, 36, 9, '#5aa9e6') + p('M30 50L14 72L30 66Z', '#ef3b3b') + p('M70 50L86 72L70 66Z', '#ef3b3b') + p('M36 64H64L58 74H42Z', '#8e98a8') + p('M42 76Q50 100 58 76Z', '#ff9f1c') + p('M46 76Q50 90 54 76Z', '#ffd23f'));
add('vaixell', 'Vaixell', 'transport', 'vaixell mar', p('M8 60H92L80 84H20Z', '#ef3b3b') + r(28, 40, 44, 20, 2, '#f4f7fb') + [36, 50, 64].map(x => `<circle cx="${x}" cy="50" r="3.4" fill="#5aa9e6"/>`).join('') + r(44, 22, 12, 18, 2, '#ffc93c') + l('M2 92q8-5 16 0t16 0t16 0t16 0t16 0t16 0', 2.4, '#5aa9e6'));
add('veler', 'Veler', 'transport', 'veler vaixell vela mar', p('M10 70H90L78 86H22Z', '#8a5a3b') + l('M50 70V8', 3) + p('M52 10L84 64H52Z', '#f4f7fb') + p('M48 18L20 64H48Z', '#ffd23f') + l('M2 94q8-5 16 0t16 0t16 0t16 0t16 0t16 0', 2.4, '#5aa9e6'));
add('bici', 'Bicicleta', 'transport', 'bicicleta bici', c(22, 66, 16, 'none') + c(78, 66, 16, 'none') + l('M22 66L40 40H70L78 66M40 40L50 66H22M70 40L50 66M36 30H46M66 32l4 8', 3.4, '#ef3b3b'));
add('globus', 'Globus aerostàtic', 'transport', 'globus aire', p('M50 4Q86 4 86 38Q86 58 62 72H38Q14 58 14 38Q14 4 50 4Z', '#ff8fb1') + p('M50 4Q64 4 64 38Q64 58 56 72H44Q36 58 36 38Q36 4 50 4Z', '#ffd23f') + l('M38 72L40 84M62 72L60 84', 2) + r(38, 82, 24, 14, 3, '#c8834b'));
add('helicopter', 'Helicòpter', 'transport', 'helicòpter', l('M14 18H86M50 18V30', 3.4) + e(44, 50, 30, 22, '#7ccf5b') + p('M44 34Q66 36 66 54H44Z', '#cfe8ff') + p('M72 48H92L96 38L88 40L84 46H74Z', '#7ccf5b') + l('M24 80H66M34 72v8M56 72v8', 3));
add('tractor', 'Tractor', 'transport', 'tractor granja', r(36, 22, 30, 32, 3, '#cfe8ff') + p('M30 54V24H70V44H90V70H30Z', '#7ccf5b').replace('V24H70', 'V24H32V18H70V24H70') + c(38, 70, 18, '#3a3640') + `<circle cx="38" cy="70" r="7" fill="#ffd23f"/>` + wheel(80, 76, 10) + r(82, 30, 5, 14, 1, '#3a3640'));
add('submari', 'Submarí', 'transport', 'submarí mar', e(48, 60, 40, 22, '#ffd23f') + r(40, 26, 20, 18, 4, '#ffd23f') + l('M50 26V12H62', 3) + [32, 48, 64].map(x => c(x, 60, 6, '#cfe8ff')).join('') + p('M86 52L98 44V76L86 68Z', '#ff9f1c'));
add('camio', 'Camió', 'transport', 'camió vehicle', r(4, 28, 58, 42, 3, '#5aa9e6') + p('M62 40H80L94 56V70H62Z', '#ef3b3b') + p('M68 46H78L86 56H68Z', '#cfe8ff') + wheel(22, 74) + wheel(78, 74));
add('patinet', 'Patinet', 'transport', 'patinet', l('M26 78H72L78 16M70 16H86', 4, '#8e6cdb') + c(26, 82, 8, '#3a3640') + c(74, 82, 8, '#3a3640'));

/* ── Edificis ── */
add('casa', 'Casa', 'edificis', 'casa llar', r(18, 46, 64, 48, 2, '#ffe0b3') + p('M8 50L50 12L92 50Z', '#ef3b3b') + r(42, 64, 16, 30, 2, '#8a5a3b') + r(24, 56, 14, 14, 2, '#cfe8ff') + r(62, 56, 14, 14, 2, '#cfe8ff') + r(66, 18, 10, 18, 1, '#a0522d'));
add('escola', 'Escola', 'edificis', 'escola col·legi', r(10, 40, 80, 54, 2, '#ffd59e') + p('M4 44L50 14L96 44Z', '#5aa9e6') + c(50, 32, 7, '#fff') + l('M50 28v4l3 2', 1.6) + r(42, 70, 16, 24, 2, '#8a5a3b') + [18, 66].map(x => r(x, 52, 16, 14, 2, '#cfe8ff')).join('') + l('M50 14V4', 2) + p('M50 4H62L58 8L62 12H50Z', '#ef3b3b'));
add('castell', 'Castell', 'edificis', 'castell conte princesa', r(24, 34, 52, 60, 1, '#c4c6cf') + [8, 76].map(x => r(x, 24, 16, 70, 1, '#b0b3be') + p(`M${x - 2} 26L${x + 8} 6L${x + 18} 26Z`, '#8e6cdb')).join('') + p('M24 34V26H32V34H40V26H48V34H52V26H60V34H68V26H76V34Z', '#c4c6cf') + p('M40 94V72Q50 60 60 72V94Z', '#8a5a3b') + l('M16 6V0', 2) + p('M16 0H24L22 3L24 6H16Z', '#ef3b3b'));
add('far', 'Far', 'edificis', 'far mar', p('M36 92L40 34H60L64 92Z', '#fff') + p('M38 52H62L63 64H37Z', '#ef3b3b') + p('M36 80H64L64 92H36Z', '#ef3b3b') + r(36, 22, 28, 14, 2, '#ffd23f') + p('M34 22L50 8L66 22Z', '#ef3b3b') + `<path d="M64 26L96 16V36Z" fill="#ffd23f" opacity=".5"/><path d="M36 26L4 16V36Z" fill="#ffd23f" opacity=".5"/>`);
add('botiga', 'Botiga', 'edificis', 'botiga mercat', r(10, 36, 80, 58, 2, '#fff3e0') + p('M6 22H94L90 40H10Z', '#ef3b3b') + [18, 36, 54, 72].map(x => p(`M${x} 22H${x + 9}L${x + 7} 40H${x}Z`, '#fff')).join('') + r(18, 52, 28, 26, 2, '#cfe8ff') + r(56, 52, 22, 42, 2, '#8a5a3b'));
add('tenda', 'Tenda de campanya', 'edificis', 'tenda campanya colònies acampada', p('M6 88L50 14L94 88Z', '#ff9f1c') + p('M50 14L36 88H64Z', '#e8850a') + p('M42 88L50 56L58 88Z', '#3a3640') + l('M2 90H98', 3));
add('iglu', 'Iglú', 'edificis', 'iglú neu pol', p('M6 86A44 44 0 0 1 94 86Z', '#eef6ff') + p('M36 86V70A14 14 0 0 1 64 70V86Z', '#3a3640') + l('M16 64H84M10 76h18M72 76h18M24 50H76M38 34h24M40 64V50M60 64V50M50 50V34M30 50V64M70 50V64', 1.6, '#9cb8d6'));
add('gratacel', 'Gratacel', 'edificis', 'gratacel ciutat edifici', r(30, 10, 40, 84, 2, '#7d8fa6') + Array.from({ length: 7 }, (_, j) => [36, 47, 58].map(x => `<rect x="${x}" y="${18 + j * 10}" width="6" height="6" fill="#ffe680"/>`).join('')).join('') + r(8, 50, 22, 44, 2, '#a7b4c6') + r(70, 40, 22, 54, 2, '#a7b4c6'));

/* ── Persones (diversitat) ── */
const SK = ['#f9d7b5', '#efc093', '#d49a6a', '#a8714b', '#7a4b2e', '#5a3420'];
const HAIR = [
  ['#3a2a20', 'curt'], ['#f2c14e', 'cues'], ['#8a3b1e', 'llarg'], ['#1d1d22', 'arrissat'], ['#c8692b', 'monyo'], ['#5c3b28', 'curt'],
];
function kid(skin, hairCol, style, shirt) {
  let b = '';
  if (style === 'llarg') b += p('M18 50Q16 14 50 14Q84 14 82 50V82H18Z', hairCol);
  if (style === 'cues') b += c(14, 46, 10, hairCol) + c(86, 46, 10, hairCol);
  if (style === 'monyo') b += c(50, 12, 11, hairCol);
  b += p('M24 100Q24 76 50 76Q76 76 76 100Z', shirt);
  b += c(50, 48, 28, skin);
  if (style === 'arrissat') b += [[28, 30], [38, 22], [50, 18], [62, 22], [72, 30], [78, 42], [22, 42]].map(([x, y]) => c(x, y, 10, hairCol)).join('');
  else b += p('M22 46Q22 18 50 18Q78 18 78 46Q70 34 56 32Q44 40 22 46Z', hairCol);
  b += eyes(40, 60, 50, 3) + smile(50, 60, 12, 5) + blush(32, 68, 58);
  return b;
}
const SHIRTS = ['#5aa9e6', '#ef476f', '#7ccf5b', '#ffb703', '#8e6cdb', '#ff8c42'];
for (let i = 0; i < 12; i++) {
  const [hc, sty] = HAIR[i % HAIR.length];
  add('nen' + (i + 1), 'Infant ' + (i + 1), 'persones', 'nen nena infant alumne persona', kid(SK[(i * 5) % SK.length], hc, sty, SHIRTS[i % SHIRTS.length]));
}
add('mestre', 'Mestre', 'persones', 'mestre professor docent', kid('#efc093', '#8e8e8e', 'curt', '#3f9b5b') + c(40, 50, 8, 'none') + c(60, 50, 8, 'none') + l('M48 50h4', 2));
add('astronauta', 'Astronauta', 'persones', 'astronauta espai', r(26, 64, 48, 34, 10, '#f4f7fb') + c(50, 42, 30, '#f4f7fb') + r(30, 28, 40, 28, 12, '#3a5a8a') + `<path d="M36 34q8-4 16-2" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>` + r(40, 72, 20, 12, 2, '#ef3b3b'));

/* ── Escola ── */
add('llapis', 'Llapis', 'escola', 'llapis escriure', p('M20 80L70 30L82 42L32 92Z', '#ffd23f') + p('M70 30L78 22Q82 18 86 22L90 26Q94 30 90 34L82 42Z', '#ff8fb1') + p('M20 80L32 92L12 98Z', '#f4d3a3') + p('M14 94L12 98L17 96Z', O));
add('llibre', 'Llibre', 'escola', 'llibre lectura biblioteca', p('M50 26Q34 16 8 20V82Q34 78 50 88Z', '#5aa9e6') + p('M50 26Q66 16 92 20V82Q66 78 50 88Z', '#5aa9e6') + p('M50 28Q36 20 14 24V76Q36 74 50 82Z', '#fff') + p('M50 28Q64 20 86 24V76Q64 74 50 82Z', '#fff') + l('M22 36q12 0 22 4M22 46q12 0 22 4M56 40q10-4 22-4M56 50q10-4 22-4', 1.6, '#9cb8d6'));
add('motxilla', 'Motxilla', 'escola', 'motxilla escola', l('M36 22Q36 8 50 8Q64 8 64 22', 4) + r(18, 20, 64, 74, 16, '#ef476f') + r(28, 54, 44, 30, 8, '#ff8fb1') + l('M34 66H66', 2.4) + r(44, 44, 12, 6, 3, '#ffd23f'));
add('regle', 'Regle', 'escola', 'regle mesurar', r(6, 36, 88, 28, 3, '#ffd23f', -14) + `<g transform="rotate(-14 50 50)">${Array.from({ length: 9 }, (_, i) => `<path d="M${14 + i * 9} 36v${i % 2 ? 7 : 12}" stroke="${O}" stroke-width="2"/>`).join('')}</g>`);
add('tisores', 'Tisores', 'escola', 'tisores manualitats', c(24, 76, 12, '#ef3b3b') + c(24, 34, 12, '#ef3b3b') + `<circle cx="24" cy="76" r="5" fill="#fff"/><circle cx="24" cy="34" r="5" fill="#fff"/>` + p('M34 70L94 34L40 58Z', '#cfd8e6') + p('M34 40L94 76L40 52Z', '#cfd8e6') + `<circle cx="44" cy="55" r="2.4" fill="${O}"/>`);
add('pinzell', 'Pinzell', 'escola', 'pinzell pintura art', p('M20 92L58 38L66 44L28 96Z', '#c8834b') + r(56, 26, 14, 18, 2, '#cfd8e6', 36) + p('M66 24Q78 4 92 6Q88 22 72 32Z', '#5aa9e6'));
add('paleta', 'Paleta de pintor', 'escola', 'paleta pintura art colors', p('M50 10Q90 10 92 46Q94 72 72 70Q60 68 62 80Q64 92 48 92Q8 90 8 52Q8 10 50 10Z', '#f2c48d') + c(32, 34, 7, '#ef3b3b') + c(52, 26, 7, '#ffd23f') + c(72, 34, 7, '#5aa9e6') + c(26, 56, 7, '#7ccf5b') + c(38, 74, 7, '#8e6cdb') + `<circle cx="74" cy="54" r="6" fill="#fff" stroke="${O}" stroke-width="2"/>`);
add('globus-terr', 'Globus terraqüi', 'escola', 'globus terraqüi geografia món', c(50, 42, 30, '#5aa9e6') + p('M34 26Q44 22 48 30Q42 38 48 46Q40 52 30 46Q24 36 34 26Z', '#7ccf5b') + p('M58 46Q70 44 72 54Q66 66 58 66Q54 58 58 46Z', '#7ccf5b') + l('M18 18A40 40 0 0 0 76 74', 3) + l('M50 72V88M34 92H66', 3.4));
add('pissarra', 'Pissarra', 'escola', 'pissarra classe', r(8, 14, 84, 60, 3, '#8a5a3b') + r(14, 20, 72, 48, 1, '#2f5d4a') + l('M24 34h20M24 44h30M58 30l10 10M68 30l-10 10M24 56c6-6 10 6 16 0', 2, '#fff') + l('M30 74L22 94M70 74L78 94', 3));
add('microscopi', 'Microscopi', 'escola', 'microscopi ciència laboratori', r(18, 84, 64, 10, 3, '#5a6a80') + p('M64 84Q80 70 72 52', '#cfd8e6').replace(st('#cfd8e6'), `fill="none" stroke="${O}" stroke-width="6"`) + r(34, 58, 30, 6, 2, '#a7b4c6') + r(40, 14, 14, 40, 3, '#8e98a8', -24) + r(36, 6, 18, 10, 2, '#3a3640', -24));
add('ordinador', 'Ordinador', 'escola', 'ordinador tecnologia', r(12, 14, 76, 52, 4, '#3a3640') + r(18, 20, 64, 40, 2, '#5aa9e6') + p('M40 66H60L64 80H36Z', '#8e98a8') + r(26, 80, 48, 6, 3, '#8e98a8') + l('M28 32h20M28 40h30M28 48h14', 2.4, '#fff'));
add('bombeta', 'Bombeta', 'escola', 'bombeta idea', l(ray(50, 40, 32, 42, 9).split('M').filter(Boolean).slice(5).map(x => 'M' + x).join(''), 3, '#ffb703') + p('M50 12A26 26 0 0 1 64 60V70H36V60A26 26 0 0 1 50 12Z', '#ffe066') + r(36, 70, 28, 16, 3, '#a7b4c6') + l('M36 76h28M36 82h28', 1.6) + l('M44 60l-4-16 10 6 10-6-4 16', 1.8));
add('trofeu', 'Trofeu', 'escola', 'trofeu copa guanyador premi', p('M26 10H74V34Q74 58 50 62Q26 58 26 34Z', '#ffd23f') + l('M26 18H12Q10 40 30 44M74 18H88Q90 40 70 44', 3.4) + r(44, 60, 12, 16, 2, '#ffd23f') + r(30, 76, 40, 14, 3, '#8a5a3b') + p('M50 22L54 31L63 32L56 38L58 47L50 42L42 47L44 38L37 32L46 31Z', '#fff3b0'));
add('medalla', 'Medalla', 'escola', 'medalla premi guanyador', p('M30 4H46L56 40H40Z', '#5aa9e6') + p('M70 4H54L44 40H60Z', '#ef3b3b') + c(50, 64, 26, '#ffd23f') + c(50, 64, 18, '#ffe680') + p('M50 52L54 61L63 62L56 68L58 77L50 72L42 77L44 68L37 62L46 61Z', '#ffd23f'));
add('calculadora', 'Calculadora', 'escola', 'calculadora matemàtiques', r(20, 6, 60, 88, 8, '#5a6a80') + r(28, 14, 44, 18, 2, '#c7e8c0') + Array.from({ length: 12 }, (_, i) => r(28 + (i % 3) * 16, 40 + Math.floor(i / 3) * 13, 12, 9, 2, i % 3 === 2 ? '#ff9f1c' : '#eef0ee')).join(''));
add('rosa-vents', 'Rosa dels vents', 'escola', 'rosa dels vents nord brúixola orientació mapa', c(50, 50, 40, '#fff3d6') + p('M50 6L58 42L94 50L58 58L50 94L42 58L6 50L42 42Z', '#ffd23f') + p('M50 6L58 42L50 50L42 42Z', '#ef3b3b') + c(50, 50, 4, O));
add('lupa', 'Lupa', 'escola', 'lupa investigar ciència', l('M62 62L90 90', 10, '#8a5a3b') + c(40, 40, 28, '#cfe8ff') + l('M26 32q4-10 14-12', 3, '#fff'));
add('rellotge-esc', 'Despertador', 'escola', 'rellotge despertador hora', c(26, 18, 10, '#ffd23f') + c(74, 18, 10, '#ffd23f') + c(50, 54, 36, '#ef3b3b') + c(50, 54, 28, '#fff') + l('M50 54V36M50 54L62 62', 3) + l('M28 90L34 82M72 90L66 82', 4));
add('diploma-ic', 'Diploma', 'escola', 'diploma títol', r(8, 20, 84, 52, 3, '#fff3d6') + l('M20 34h60M20 44h44M20 54h52', 2, '#c8a46a') + c(74, 66, 12, '#ef3b3b') + p('M68 76L64 92L72 88L76 94L80 78Z', '#ef3b3b'));

/* ── Esports ── */
add('futbol', 'Pilota de futbol', 'esports', 'futbol pilota esport', c(50, 50, 40, '#fff') + p('M50 34L64 44L58 60H42L36 44Z', O) + l('M50 34V12M64 44L84 36M58 60L70 80M42 60L30 80M36 44L16 36', 2.4));
add('basquet', 'Pilota de bàsquet', 'esports', 'bàsquet pilota esport', c(50, 50, 40, '#ff8c42') + l('M50 10V90M10 50H90M22 22Q42 50 22 78M78 22Q58 50 78 78', 2.4));
add('tennis', 'Raqueta de tennis', 'esports', 'tennis raqueta esport', e(42, 38, 26, 32, '#fff', -30) + `<g transform="rotate(-30 42 38)" stroke="${O}" stroke-width="1.2">${[-16, -8, 0, 8, 16].map(x => `<path d="M${42 + x} 10V66"/><path d="M18 ${38 + x}H66"/>`).join('')}</g>` + r(60, 64, 10, 34, 3, '#ef3b3b', -30) + c(82, 22, 10, '#d4f04a'));
add('nedar', 'Ulleres de natació', 'esports', 'natació nedar piscina esport', l('M4 50H16M84 50H96', 4, '#ef476f') + r(14, 34, 32, 30, 14, '#5aa9e6') + r(54, 34, 32, 30, 14, '#5aa9e6') + l('M46 48h8', 4) + l('M2 84q8-5 16 0t16 0t16 0t16 0t16 0t16 0', 2.4, '#5aa9e6'));
add('xiulet', 'Xiulet', 'esports', 'xiulet àrbitre esport', p('M14 44H56Q56 30 70 30Q90 30 90 52Q90 74 68 74Q48 74 48 58H24Q14 58 14 50Z', '#ffd23f') + c(70, 52, 6, '#3a3640'));
add('meta', 'Bandera de meta', 'esports', 'cursa meta guanyador', l('M18 96V6', 4) + r(18, 8, 64, 42, 0, '#fff') + Array.from({ length: 12 }, (_, i) => `<rect x="${18 + (i % 4) * 16}" y="${8 + Math.floor(i / 4) * 14}" width="${(i + Math.floor(i / 4)) % 2 ? 0 : 16}" height="14" fill="${O}"/>`).join(''));
add('bambes', 'Bambes', 'esports', 'sabatilles córrer esport', p('M8 70V44Q8 36 18 36L34 38Q40 52 56 50L84 58Q94 62 92 72V80H8Z', '#5aa9e6') + r(8, 74, 84, 10, 4, '#fff') + l('M28 42l6 6M36 40l6 6M44 42l6 4', 2.4, '#fff'));
add('bici-esport', 'Casc', 'esports', 'casc bici seguretat', p('M8 66Q8 22 50 22Q92 22 92 66Z', '#7ccf5b') + l('M30 28L36 66M50 22V66M70 28L64 66', 2.4) + r(4, 62, 92, 8, 4, '#3a3640'));
add('patins', 'Patí', 'esports', 'patí patinatge', p('M22 14H50V54L80 62Q90 66 88 76H22Z', '#ff8fb1') + l('M30 22h12M30 30h12M30 38h12', 2.4, '#fff') + c(32, 86, 8, '#ffd23f') + c(76, 86, 8, '#ffd23f') + l('M20 78H90', 3));

/* ── Música ── */
add('nota', 'Nota musical', 'musica', 'nota música', e(30, 74, 14, 10, O, -20) + e(74, 64, 14, 10, O, -20) + l('M42 72V18L86 8V62', 4) + l('M42 30L86 20', 8));
add('guitarra', 'Guitarra', 'musica', 'guitarra música', p('M40 50Q22 40 18 58Q14 78 34 88Q56 98 64 76Q74 70 68 56Q62 44 50 48Z', '#e9a05a') + c(40, 70, 8, '#3a3640') + r(46, 10, 10, 50, 2, '#8a5a3b', 34) + l('M34 76L74 14', 1.2));
add('tambor', 'Tambor', 'musica', 'tambor percussió música', r(16, 38, 68, 46, 6, '#ef3b3b') + e(50, 38, 34, 10, '#f4f7fb') + l('M16 50L34 84L50 50L66 84L84 50', 2.4, '#ffd23f') + l('M30 26L64 6M70 26L36 6', 4, '#8a5a3b'));
add('piano', 'Piano', 'musica', 'piano teclat música', r(6, 30, 88, 44, 4, '#fff') + Array.from({ length: 7 }, (_, i) => l(`M${18.5 + i * 12.5} 30V74`, 2)).join('') + [0, 1, 3, 4, 5].map(i => `<rect x="${14 + i * 12.5}" y="30" width="8" height="26" fill="${O}"/>`).join(''));
add('microfon', 'Micròfon', 'musica', 'micròfon cantar música', r(36, 10, 28, 44, 14, '#a7b4c6') + l('M40 22h20M40 30h20M40 38h20', 1.6) + l('M26 40Q26 66 50 66Q74 66 74 40M50 66V88M36 90H64', 3.4));
add('trompeta', 'Trompeta', 'musica', 'trompeta música', p('M8 44H58L88 26V74L58 56H8Z', '#ffd23f') + r(26, 30, 6, 14, 2, '#ffd23f') + r(38, 30, 6, 14, 2, '#ffd23f') + r(50, 30, 6, 14, 2, '#ffd23f'));
add('flauta', 'Flauta', 'musica', 'flauta música', r(10, 42, 84, 14, 7, '#ffe0b3', -20) + `<g transform="rotate(-20 50 49)">${[30, 42, 54, 66, 78].map(x => `<circle cx="${x}" cy="49" r="2.6" fill="${O}"/>`).join('')}</g>`);
add('auriculars', 'Auriculars', 'musica', 'auriculars música escoltar', l('M18 60V48Q18 14 50 14Q82 14 82 48V60', 6) + r(10, 52, 18, 32, 6, '#ef476f') + r(72, 52, 18, 32, 6, '#ef476f'));

/* ── Festes i tradicions ── */
add('rosa', 'Rosa de Sant Jordi', 'festes', 'rosa sant jordi flor', l('M50 52V96', 3.4, '#3f9b5b') + p('M50 76Q30 60 24 70Q36 84 50 80Z', '#7ccf5b') + p('M50 70Q70 54 78 64Q66 78 50 74Z', '#7ccf5b') + p('M30 30Q28 54 50 56Q72 54 70 30Q60 40 50 34Q40 40 30 30Z', '#ef233c') + p('M36 22Q50 6 64 22Q60 34 50 34Q40 34 36 22Z', '#ff4d6d'));
add('drac', 'Drac', 'festes', 'drac sant jordi', p('M10 74Q14 50 34 50Q38 30 58 28Q74 28 80 40Q94 40 94 52Q94 62 82 62Q80 82 58 84H24Q10 84 10 74Z', '#7ccf5b') + [44, 54, 64].map(x => p(`M${x - 5} 30L${x} 18L${x + 5} 30Z`, '#ef3b3b')).join('') + dot(74, 44, 3) + p('M58 52Q64 40 76 48Q70 62 58 52Z', '#a6e38a') + p('M94 56L98 50L98 62Z', '#ff9f1c') + l('M24 84L22 94M44 84L46 94', 3.4));
add('llibre-rosa', 'Llibre i rosa', 'festes', 'sant jordi llibre rosa', r(14, 40, 56, 50, 3, '#5aa9e6', -8) + r(20, 44, 46, 42, 2, '#fff', -8) + l('M72 30V88', 3, '#3f9b5b') + p('M60 20Q60 36 72 36Q84 36 84 20Q78 26 72 22Q66 26 60 20Z', '#ef233c'));
add('tio', 'Tió', 'festes', 'tió nadal caga tió', l('M30 78L24 94M56 78L60 94', 5, '#8a5a3b') + e(44, 62, 36, 20, '#a0612f') + p('M14 54Q20 40 44 42Q60 42 62 54V74Q40 84 14 72Z', '#ef3b3b') + l('M18 72Q40 80 60 72', 2, '#fff') + c(78, 60, 18, '#d9a066') + `<circle cx="78" cy="60" r="10" fill="none" stroke="#b07a45" stroke-width="1.6"/>` + p('M62 50Q60 30 78 28Q92 28 94 44Q84 36 74 42Q68 46 62 50Z', '#d62828') + c(96, 46, 4, '#fff') + eyes(72, 84, 58, 2.8) + smile(78, 66, 9, 3.4) + blush(68, 88, 64))
add('barretina', 'Barretina', 'festes', 'barretina tradició', p('M10 80Q10 66 50 66Q90 66 90 80Q90 90 50 90Q10 90 10 80Z', '#d62828') + p('M14 76Q24 30 60 18Q86 12 88 28Q74 22 66 40Q58 60 86 76Z', '#d62828') + r(10, 70, 80, 12, 4, '#a4161a'));
add('castellers', 'Castellers', 'festes', 'castellers castell humà tradició', [[20, 82], [40, 82], [60, 82], [80, 82], [30, 56], [50, 56], [70, 56], [40, 30], [60, 30], [50, 8]].map(([x, y], i) => r(x - 8, y, 16, 18, 4, i < 4 ? '#fff' : i < 7 ? '#ef3b3b' : '#5aa9e6') + c(x, y - 6, 6, SK[i % 4])).join('') + l('M10 98H90', 3));
add('gegant', 'Gegant', 'festes', 'gegant festa major', p('M24 98L34 46H66L76 98Z', '#8e6cdb') + l('M30 58L12 40M70 58L88 40', 6, '#f9d7b5') + c(50, 30, 18, '#f9d7b5') + p('M30 24Q30 6 50 6Q70 6 70 24Q60 16 50 18Q40 16 30 24Z', '#8a3b1e') + p('M30 16L36 2L44 12L50 0L56 12L64 2L70 16Z', '#ffd23f') + eyes(43, 57, 30, 2.6) + smile(50, 38, 8, 3));
add('carabassa', 'Carabassa', 'festes', 'carabassa tardor castanyada', e(50, 58, 40, 32, '#ff8c42') + l('M50 26Q40 58 50 90M50 26Q60 58 50 90M26 34Q16 58 26 84M74 34Q84 58 74 84', 2) + r(46, 16, 8, 14, 2, '#6b8f3a'));
add('regal', 'Regal', 'festes', 'regal aniversari nadal', r(14, 40, 72, 54, 3, '#ef476f') + r(8, 30, 84, 16, 3, '#ff8fb1') + r(44, 30, 12, 64, 0, '#ffd23f') + p('M50 30Q30 6 24 22Q24 32 50 30Z', '#ffd23f') + p('M50 30Q70 6 76 22Q76 32 50 30Z', '#ffd23f'));
add('globus-festa', 'Globus', 'festes', 'globus festa aniversari', [[30, 34, '#ef476f'], [62, 28, '#5aa9e6'], [48, 48, '#ffd23f']].map(([x, y, col]) => l(`M${x} ${y + 22}q-4 16 ${50 - x} 40`, 1.8) + e(x, y, 16, 20, col) + p(`M${x - 3} ${y + 20}h6l-3 4z`, col)).join(''));
add('confeti', 'Confeti', 'festes', 'confeti festa celebració', Array.from({ length: 18 }, (_, i) => { const x = 8 + (i * 37) % 84, y = 8 + (i * 53) % 84, col = ['#ef476f', '#ffd23f', '#5aa9e6', '#7ccf5b', '#8e6cdb'][i % 5]; return i % 3 ? `<rect x="${x}" y="${y}" width="9" height="4" rx="1" fill="${col}" transform="rotate(${i * 40} ${x + 4} ${y + 2})"/>` : `<circle cx="${x}" cy="${y}" r="3.4" fill="${col}"/>`; }).join(''));
add('antifac', 'Antifaç', 'festes', 'antifaç carnaval disfressa', p('M6 40Q20 26 50 38Q80 26 94 40Q96 62 76 66Q60 66 50 54Q40 66 24 66Q4 62 6 40Z', '#8e6cdb') + e(30, 48, 9, 7, '#fff') + e(70, 48, 9, 7, '#fff') + p('M84 34Q96 10 90 4Q80 16 80 32Z', '#ffd23f'));
add('arbre-nadal', 'Arbre de Nadal', 'festes', 'arbre nadal', r(42, 82, 16, 14, 2, '#8a5a3b') + p('M50 10L80 46H66L88 82H12L34 46H20Z', '#3f9b5b') + p('M50 2L53 9L61 9L55 14L57 22L50 17L43 22L45 14L39 9L47 9Z', '#ffd23f') + [[42, 38], [58, 54], [36, 66], [66, 72], [50, 74]].map(([x, y], i) => c(x, y, 4, ['#ef3b3b', '#5aa9e6', '#ffd23f'][i % 3])).join(''));
add('mona', 'Mona de Pasqua', 'festes', 'mona pasqua ou xocolata', r(10, 62, 80, 28, 8, '#e9b872') + p('M14 64q8-8 16 0t16 0t16 0t16 0t8 0', '#fff').replace(st('#fff'), 'fill="none" stroke="#fff" stroke-width="4"') + e(36, 46, 14, 18, '#8a4b2b') + e(62, 46, 14, 18, '#5aa9e6') + l('M50 40q6 4 12 0t12 0M50 52q6 -4 12 0t12 0', 2, '#fff') + c(24, 60, 6, '#ffd23f') + c(78, 58, 6, '#ef476f'));
add('estel', 'Estel', 'festes', 'estel vent volar', p('M50 4L80 40L50 76L20 40Z', '#ef476f') + p('M50 4L80 40H20Z', '#ffd23f') + l('M50 4V76M20 40H80', 1.6) + l('M50 76q-10 6 0 10t0 10', 2.4) + p('M44 84l6-2 0 6z', '#5aa9e6'));
add('ou-pasqua', 'Ou decorat', 'festes', 'ou pasqua decorat', e(50, 52, 30, 40, '#ffd166') + l('M22 40q14 8 28 0t28 0M20 60q15 -8 30 0t30 0', 4, '#ef476f') + [34, 50, 66].map(x => `<circle cx="${x}" cy="50" r="3" fill="#5aa9e6"/>`).join(''));
add('pessebre-estrella', 'Estel de Nadal', 'festes', 'estrella nadal', p('M50 6L58 38L90 30L66 52L84 80L54 66L44 96L40 64L10 74L32 50L12 24L44 36Z', '#ffd23f'));

/* ── Espai ── */
add('saturn', 'Saturn', 'espai', 'saturn planeta espai', e(50, 50, 46, 12, 'none', -18) + c(50, 50, 26, '#f4a259') + l('M28 40q22-6 44 0M26 56q24 6 48 0', 2, '#e07a5f') + `<path d="M8 62A46 12 -18 0 0 92 38" fill="none" stroke="${O}" stroke-width="${W}" transform=""/>`);
add('ovni', 'OVNI', 'espai', 'ovni nau extraterrestre', p('M30 40A20 20 0 0 1 70 40Z', '#cfe8ff') + e(50, 48, 42, 12, '#a7b4c6') + [24, 50, 76].map(x => c(x, 50, 4, '#ffd23f')).join('') + `<path d="M36 60L22 94H78L64 60Z" fill="#ffe680" opacity=".45"/>` + c(50, 32, 7, '#7ccf5b') + eyes(47, 53, 32, 1.4));
add('estel-fugac', 'Estel fugaç', 'espai', 'estel fugaç espai desig', l('M8 92L54 46', 6, '#ffd23f') + l('M14 70L44 40M30 96L60 66', 3, '#ffe680') + p('M66 14L71 28L86 28L74 37L78 52L66 43L54 52L58 37L46 28L61 28Z', '#ffd23f'));
add('lluna-crat', 'Lluna plena', 'espai', 'lluna espai cràter', c(50, 50, 40, '#d6dbe4') + c(36, 38, 8, '#b8bfcc') + c(62, 60, 11, '#b8bfcc') + c(58, 30, 5, '#b8bfcc') + c(32, 64, 5, '#b8bfcc'));
add('satel', 'Satèl·lit', 'espai', 'satèl·lit espai', r(4, 38, 30, 24, 2, '#5aa9e6') + r(66, 38, 30, 24, 2, '#5aa9e6') + l('M14 38v24M24 38v24M76 38v24M86 38v24', 1.6) + r(34, 34, 32, 32, 4, '#cfd8e6') + l('M50 34V18', 2.4) + c(50, 14, 5, '#ef3b3b'));
add('telescopi', 'Telescopi', 'espai', 'telescopi astronomia', r(22, 20, 64, 20, 6, '#5aa9e6', -24) + r(12, 40, 16, 12, 3, '#3a3640', -24) + l('M50 44L30 92M50 44L70 92M50 44V92', 3));
add('planeta', 'Planeta', 'espai', 'planeta espai', c(50, 50, 34, '#8e6cdb') + c(38, 40, 8, '#b49cf0') + c(60, 62, 6, '#b49cf0') + c(84, 20, 6, '#ffd23f') + c(16, 82, 4, '#ffd23f'));
add('marcia', 'Extraterrestre', 'espai', 'extraterrestre marcià espai', l('M38 26L30 8M62 26L70 8', 2.4) + c(30, 8, 4, '#ffd23f') + c(70, 8, 4, '#ffd23f') + e(50, 50, 30, 28, '#7ccf5b') + c(50, 46, 12, '#fff') + dot(50, 46, 5) + smile(50, 64, 14, 5) + p('M30 76L24 96H76L70 76Z', '#7ccf5b'));

/* ── Emocions (generades) ── */
const EMO = {
  content: [l('M36 60q14 14 28 0', 3)],
  trist: [l('M36 68q14 -12 28 0', 3), `<path d="M33 52q-2 8 2 8q4 0 2 -8z" fill="#5aa9e6"/>`],
  enfadat: [l('M36 66q14 -8 28 0', 3), l('M30 36L44 42M70 36L56 42', 3)],
  sorpres: [`<ellipse cx="50" cy="66" rx="7" ry="9" fill="${O}"/>`],
  por: [l('M36 66l6 -4 4 4 4 -4 4 4 4 -4 6 4', 2.4), l('M30 34l12 4M70 34l-12 4', 2.4)],
  enamorat: [l('M36 60q14 14 28 0', 3)],
  riure: [p('M32 58H68Q66 80 50 80Q34 80 32 58Z', '#fff')],
  cansat: [l('M40 66h20', 3)],
  pensatiu: [l('M42 66q8 -4 16 2', 3), c(84, 18, 5, '#fff') + c(76, 30, 3, '#fff')],
  guinyant: [l('M36 60q14 14 28 0', 3)],
};
const EMO_NAMES = { content: 'Content', trist: 'Trist', enfadat: 'Enfadat', sorpres: 'Sorprès', por: 'Por', enamorat: 'Enamorat', riure: 'Rient', cansat: 'Cansat', pensatiu: 'Pensatiu', guinyant: 'Picant l\'ullet' };
for (const k in EMO) {
  let b = c(50, 52, 40, k === 'enfadat' ? '#ff8a6b' : k === 'trist' ? '#9cc7f0' : '#ffd23f');
  if (k === 'enamorat') b += [36, 64].map(x => p(`M${x} 52q-10-8 -8-14q4-6 8 0q4-6 8 0q2 6 -8 14z`, '#ef233c')).join('');
  else if (k === 'cansat' || k === 'riure') b += l('M30 46q6 4 12 0M58 46q6 4 12 0', 3);
  else if (k === 'guinyant') b += dot(38, 46, 3.6) + l('M56 46q6 -4 12 0', 3);
  else b += eyes(38, 62, 46, k === 'sorpres' || k === 'por' ? 4.6 : 3.6);
  b += EMO[k].join('');
  if (k !== 'enfadat' && k !== 'trist') b += blush(28, 72, 58);
  add('emo-' + k, EMO_NAMES[k], 'emocions', 'emoció cara ' + EMO_NAMES[k].toLowerCase(), b);
}

/* ── Decoracions ── */
const FR = ['#ef476f', '#ffd23f', '#5aa9e6', '#7ccf5b', '#8e6cdb', '#ff8c42'];
// banderoles
add('banderoles', 'Banderoles', 'decoracio', 'banderoles festa garlanda', l('M0 14Q50 34 100 14', 2) + Array.from({ length: 7 }, (_, i) => { const x = 4 + i * 13.5, y = 14 + Math.sin((x / 100) * Math.PI) * 18; return p(`M${x} ${y - 2}h11l-5.5 16z`, FR[i % 6]); }).join(''));
add('banderoles2', 'Banderoles rectes', 'decoracio', 'banderoles festa', l('M0 10H100', 2) + Array.from({ length: 8 }, (_, i) => p(`M${2 + i * 12.5} 10h10v14l-5 -4l-5 4z`, FR[(i + 2) % 6])).join(''));
// bafarades
add('bafarada', 'Bafarada', 'decoracio', 'bafarada còmic diàleg', p('M50 8Q92 8 92 40Q92 70 52 70L30 92L36 68Q8 64 8 40Q8 8 50 8Z', '#fff'));
add('bafarada-pensa', 'Bafarada de pensament', 'decoracio', 'bafarada pensament còmic', p('M24 54Q6 52 10 36Q8 20 26 20Q32 6 50 10Q66 4 76 16Q94 16 92 34Q98 50 82 56Q78 70 60 66Q46 74 36 64Q24 66 24 54Z', '#fff') + c(22, 78, 6, '#fff') + c(12, 92, 4, '#fff'));
add('bafarada-crit', 'Bafarada de crit', 'decoracio', 'bafarada crit còmic', p('M50 4L58 20L76 10L74 30L96 32L80 46L96 62L74 64L78 86L58 74L46 94L40 74L18 84L24 64L4 58L20 46L6 30L26 28L22 8L42 20Z', '#ffd23f'));
add('bafarada-quad', 'Cartell de text', 'decoracio', 'rètol cartell text', r(6, 14, 88, 56, 10, '#fff') + p('M60 70L70 90L74 70Z', '#fff'));
add('rotulo', 'Rètol de fusta', 'decoracio', 'rètol fusta cartell', l('M30 56V96M70 56V96', 5, '#8a5a3b') + r(6, 12, 88, 46, 6, '#d9a066') + l('M14 26h72M14 42h72', 1.4, '#b07a45'));
// cintes i insígnies
add('cinta', 'Cinta de títol', 'decoracio', 'cinta títol banner', p('M2 40H18V70H2L10 55Z', '#c9184a') + p('M98 40H82V70H98L90 55Z', '#c9184a') + r(14, 30, 72, 30, 2, '#ef476f'));
add('cinta2', 'Cinta ondulada', 'decoracio', 'cinta ondulada banner', p('M6 36Q28 26 50 36T94 36V64Q72 54 50 64T6 64Z', '#5aa9e6'));
add('insignia', 'Insígnia', 'decoracio', 'insígnia segell premi', p('M50 4L60 12L72 8L76 20L88 24L84 36L92 46L84 56L88 68L76 72L72 84L60 80L50 88L40 80L28 84L24 72L12 68L16 56L8 46L16 36L12 24L24 20L28 8L40 12Z', '#ffd23f') + c(48, 46, 26, '#fff3b0'));
add('escut', 'Escut', 'decoracio', 'escut insígnia', p('M50 6L88 18V48Q88 78 50 94Q12 78 12 48V18Z', '#5aa9e6') + p('M50 16L78 26V48Q78 70 50 84Q22 70 22 48V26Z', '#cfe8ff'));
add('etiqueta', 'Etiqueta', 'decoracio', 'etiqueta preu', p('M8 30H72L94 50L72 70H8Z', '#7ccf5b') + c(78, 50, 4, '#fff'));
// marcs
add('marc-ondulat', 'Marc ondulat', 'decoracio', 'marc vora', p('M10 10' + 'q5 -5 10 0'.repeat(8) + 'q5 5 0 10'.repeat(8) + 'q-5 5 -10 0'.repeat(8) + 'q-5 -5 0 -10'.repeat(8) + 'z', 'none'));
add('marc-dots', 'Marc de punts', 'decoracio', 'marc vora punts', Array.from({ length: 36 }, (_, i) => { const t = i / 36 * 4, s = Math.floor(t), f = t - s; const pts = [[8, 8], [92, 8], [92, 92], [8, 92], [8, 8]]; const x = pts[s][0] + (pts[s + 1][0] - pts[s][0]) * f, y = pts[s][1] + (pts[s + 1][1] - pts[s][1]) * f; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${FR[i % 6]}"/>`; }).join(''));
add('marc-doble', 'Marc doble', 'decoracio', 'marc vora', r(4, 4, 92, 92, 6, 'none') + r(10, 10, 80, 80, 3, 'none'));
add('marc-cantons', 'Marc de cantonades', 'decoracio', 'marc cantonades', [[0, 0], [90, 0], [90, 90], [0, 90]].map(([a, b2]) => `<g transform="rotate(${a} 50 50)">` + p('M6 30V10Q6 6 10 6H30', 'none').replace(st('none'), `fill="none" stroke="${FR[a / 90 % 6]}" stroke-width="6"`) + c(14, 14, 3, FR[(a / 90 + 2) % 6]) + '</g>').join(''));
add('marc-estrelles', 'Marc d\'estrelles', 'decoracio', 'marc estrelles', r(10, 10, 80, 80, 4, 'none') + [[10, 10], [90, 10], [90, 90], [10, 90]].map(([x, y], i) => p(`M${x} ${y - 9}L${x + 3} ${y - 3}L${x + 9} ${y - 3}L${x + 4} ${y + 2}L${x + 6} ${y + 8}L${x} ${y + 4}L${x - 6} ${y + 8}L${x - 4} ${y + 2}L${x - 9} ${y - 3}L${x - 3} ${y - 3}Z`, FR[i])).join(''));
add('marc-nuvol', 'Marc de núvol', 'decoracio', 'marc núvol', p('M20 30Q20 10 40 14Q50 4 62 14Q82 10 82 30Q96 40 86 56Q94 76 76 80Q66 96 50 86Q34 96 24 80Q6 76 14 56Q4 40 20 30Z', '#fff'));
add('polaroid', 'Foto polaroid', 'decoracio', 'foto marc polaroid', r(14, 8, 72, 84, 2, '#fff', -4) + r(20, 14, 60, 56, 1, '#cfe8ff', -4) + p('M24 64L40 46L52 58L60 50L76 66Z', '#7ccf5b').replace('Z', 'Z').replace(st('#7ccf5b'), `fill="#7ccf5b" transform="rotate(-4 50 50)"`) + `<circle cx="66" cy="30" r="5" fill="#ffd23f" transform="rotate(-4 50 50)"/>` + r(36, 2, 28, 10, 1, '#ffe680', 6));
add('cinta-adhesiva', 'Cinta adhesiva', 'decoracio', 'cinta adhesiva washi', `<rect x="10" y="38" width="80" height="24" fill="#ffd23f" opacity=".8" transform="rotate(-8 50 50)"/>` + l('M14 36l4 6-4 6 4 6-4 6M86 34l-4 6 4 6-4 6 4 6', 1, '#e8b90f'));
// separadors i formes
add('separador', 'Separador', 'decoracio', 'separador línia', l('M4 50H38M62 50H96', 3) + p('M50 38L56 50L50 62L44 50Z', '#ffd23f'));
add('ona-sep', 'Separador ondulat', 'decoracio', 'separador ondulat', l('M4 50q8 -12 16 0t16 0t16 0t16 0t16 0t12 0', 4, '#5aa9e6'));
add('cor', 'Cor', 'decoracio', 'cor amor', p('M50 88Q8 60 10 34Q12 14 30 14Q44 14 50 28Q56 14 70 14Q88 14 90 34Q92 60 50 88Z', '#ef476f') + `<ellipse cx="28" cy="32" rx="5" ry="8" fill="#fff" opacity=".5" transform="rotate(30 28 32)"/>`);
add('estrelleta', 'Espurna', 'decoracio', 'espurna brillant', p('M50 4Q54 46 96 50Q54 54 50 96Q46 54 4 50Q46 46 50 4Z', '#ffd23f'));
add('taca', 'Taca', 'decoracio', 'taca forma orgànica', p('M30 14Q52 2 70 16Q92 24 88 50Q94 76 70 84Q50 98 30 84Q6 78 10 52Q4 28 30 14Z', '#ffd166'));
add('taca2', 'Taca de pintura', 'decoracio', 'taca pintura', p('M50 10Q66 14 68 28Q86 20 88 38Q82 50 90 60Q86 78 70 74Q66 92 50 86Q36 96 28 80Q10 82 14 62Q4 50 16 40Q10 22 30 24Q36 8 50 10Z', '#8ecae6') + c(90, 84, 5, '#8ecae6') + c(10, 14, 4, '#8ecae6'));
add('fletxa-dib', 'Fletxa dibuixada', 'decoracio', 'fletxa dibuix', l('M8 70Q30 20 70 34', 4) + l('M58 22L72 34L56 44', 4));
add('fletxa-espiral', 'Fletxa en espiral', 'decoracio', 'fletxa espiral', l('M8 80Q20 40 46 50Q62 58 52 70Q40 76 40 60Q42 30 88 22', 3.4) + l('M76 14L90 22L80 34', 3.4));
add('subratllat', 'Subratllat', 'decoracio', 'subratllat traç', l('M6 58Q50 40 94 50M14 66Q50 54 86 60', 5, '#ffd23f'));
add('cercle-dib', 'Cercle dibuixat', 'decoracio', 'cercle encerclar', l('M70 18Q30 4 12 36Q2 66 36 84Q72 96 90 66Q100 36 64 22', 4, '#ef476f'));
add('xinxeta', 'Xinxeta', 'decoracio', 'xinxeta suro', c(50, 34, 20, '#ef476f') + p('M42 50h16l-8 40z', '#cfd8e6'));
add('clip', 'Clip', 'decoracio', 'clip paper', l('M40 92V22Q40 8 52 8Q64 8 64 22V78Q64 86 56 86Q48 86 48 78V30', 5, '#8e98a8'));
// fons i patrons (quadrats grans)
const pat = (bg, fg) => r(0, 0, 100, 100, 0, bg).replace(`stroke="${O}"`, 'stroke="none"') + fg;
add('fons-punts', 'Fons de punts', 'fons', 'fons patró punts', pat('#fff3d6', Array.from({ length: 25 }, (_, i) => `<circle cx="${10 + (i % 5) * 20}" cy="${10 + Math.floor(i / 5) * 20}" r="4" fill="#ffd166"/>`).join('')));
add('fons-ratlles', 'Fons de ratlles', 'fons', 'fons patró ratlles', pat('#e6f4ff', Array.from({ length: 10 }, (_, i) => `<path d="M${-50 + i * 20} 100L${50 + i * 20} 0" stroke="#bfe0ff" stroke-width="7"/>`).join('')));
add('fons-quadres', 'Fons de quadrícula', 'fons', 'fons quadrícula llibreta', pat('#fff', Array.from({ length: 9 }, (_, i) => `<path d="M${10 + i * 10} 0V100M0 ${10 + i * 10}H100" stroke="#cde3f5" stroke-width="1"/>`).join('') + '<path d="M18 0V100" stroke="#ef476f" stroke-width="1.4"/>'));
add('fons-cel', 'Fons de cel', 'fons', 'fons cel núvols', pat('#bfe3ff', p('M8 34Q2 34 2 28Q2 20 12 20Q14 12 24 12Q32 12 34 20Q42 18 44 26Q46 34 38 34Z', '#fff').replace(st('#fff'), 'fill="#fff"') + p('M58 70Q52 70 52 64Q52 56 62 56Q64 48 74 48Q82 48 84 56Q92 54 94 62Q96 70 88 70Z', '#fff').replace(st('#fff'), 'fill="#fff"')));
add('fons-gespa', 'Fons de prat', 'fons', 'fons prat gespa paisatge', pat('#bfe3ff', `<path d="M0 64Q30 50 60 62T100 58V100H0Z" fill="#7ccf5b"/><path d="M0 78Q40 66 70 78T100 74V100H0Z" fill="#5fbf5f"/><circle cx="82" cy="20" r="10" fill="#ffd23f"/>`));
add('fons-mar', 'Fons de mar', 'fons', 'fons mar aigua', pat('#5aa9e6', `<path d="M0 30q12-6 25 0t25 0t25 0t25 0" fill="none" stroke="#8ecae6" stroke-width="3"/><path d="M0 60q12-6 25 0t25 0t25 0t25 0" fill="none" stroke="#8ecae6" stroke-width="3"/><path d="M0 100V86Q30 78 60 86T100 84V100Z" fill="#f2d49b"/>`));
add('fons-nit', 'Fons de nit', 'fons', 'fons nit estrelles espai', pat('#24305e', Array.from({ length: 16 }, (_, i) => `<circle cx="${(i * 37) % 100}" cy="${(i * 61) % 100}" r="${1 + (i % 3)}" fill="#fff"/>`).join('') + '<circle cx="78" cy="22" r="10" fill="#ffe680"/>'));
add('fons-confeti', 'Fons de festa', 'fons', 'fons festa confeti', pat('#fff0f5', Array.from({ length: 22 }, (_, i) => `<rect x="${(i * 41) % 96}" y="${(i * 29) % 96}" width="7" height="3" rx="1" fill="${FR[i % 6]}" transform="rotate(${i * 33} ${(i * 41) % 96} ${(i * 29) % 96})"/>`).join('')));
add('fons-pissarra', 'Fons de pissarra', 'fons', 'fons pissarra', pat('#2f5d4a', `<rect x="3" y="3" width="94" height="94" fill="none" stroke="#8a5a3b" stroke-width="6"/>`));
add('fons-suro', 'Fons de suro', 'fons', 'fons suro tauler', pat('#d9a066', Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 37) % 100}" cy="${(i * 53) % 100}" r="1.4" fill="#b07a45"/>`).join('')));

export const SYMBOLS = S;
export const SYM_CATS = { animals: 'Animals', natura: 'Natura i estacions', menjar: 'Menjar', transport: 'Transports', edificis: 'Edificis', persones: 'Persones', escola: 'Escola', esports: 'Esports', musica: 'Música', festes: 'Festes i tradicions', espai: 'Espai', emocions: 'Emocions', decoracio: 'Decoracions', fons: 'Fons i patrons' };
