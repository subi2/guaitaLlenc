// Símbols originals del paquet Arquitectura i enginyeria (100×100)
// Copyright (C) 2026 SBS BiM Consulting, Jordi Subirós — AGPL-3.0-only
// Convencions inspirades en la pràctica habitual (UNE/ISO); no són reproduccions oficials.
const K = '#111111', W = 2.6;
const ST = (f = '#fff', sw = W, col = K) => `fill="${f}" stroke="${col}" stroke-width="${sw}"`;
const L = (d, col = K, sw = W, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"${extra}/>`;
const P = (d, f = '#fff', sw = W, col = K) => `<path d="${d}" ${ST(f, sw, col)}/>`;
const C = (cx, cy, r, f = '#fff', sw = W, col = K) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${ST(f, sw, col)}/>`;
const R = (x, y, w, h, f = '#fff', rx = 0, sw = W, col = K) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${ST(f, sw, col)}/>`;
const T = (x, y, s, txt, o = {}) => `<text x="${x}" y="${y}" font-family="IBM Plex Sans, sans-serif" font-size="${s}" font-weight="${o.w || 600}" text-anchor="${o.a || 'middle'}" fill="${o.c || K}">${txt}</text>`;
const D = (cx, cy, r, f = K) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`;
const DASH = (a = '8 5') => ` stroke-dasharray="${a}"`;
const wrap = b => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const S = [];
const add = (id, name, cat, tags, body) => S.push({ id: 'a-' + id, name, cat, tags, svg: wrap(body) });

/* ════ 1. ANOTACIÓ ════ */
// marques de secció
for (const l of ['A', 'B', 'C', 'D']) {
  add('seccio-' + l, 'Secció ' + l, 'anotacio', 'secció tall marca ' + l, C(30, 40, 16) + T(30, 46, 18, l) + P('M30 60L18 76H42Z', K) + L('M46 40H96', K, 2.6, DASH('10 4 2 4')));
}
add('seccio-full', 'Marca de secció amb full', 'anotacio', 'secció tall làmina referència', C(50, 50, 30) + L('M20 50H80') + T(50, 42, 16, 'A') + T(50, 70, 13, 'A-201', { w: 500 }) + P('M50 20L36 6H64Z', K));
add('detall', 'Referència de detall', 'anotacio', 'detall ampliació referència', C(50, 50, 30) + L('M20 50H80') + T(50, 42, 16, '3') + T(50, 70, 13, 'D-05', { w: 500 }));
add('detall-zona', 'Zona de detall', 'anotacio', 'detall zona ampliació', C(36, 40, 26, 'none', 2.2) + L('M54 58L76 78', K, 2.2) + C(82, 82, 12) + T(82, 87, 12, '1'));
add('alcat', 'Marca d\'alçat', 'anotacio', 'alçat vista elevació', C(50, 54, 22) + P('M50 18L34 40H66Z', K) + T(50, 60, 16, '2'));
add('alcat4', 'Marca d\'alçats interiors', 'anotacio', 'alçats interiors quatre direccions', R(34, 34, 32, 32) + [[50, 14, 0], [86, 50, 90], [50, 86, 180], [14, 50, 270]].map(([x, y, r], i) => `<g transform="rotate(${r} 50 50)">${P('M50 8L40 28H60Z', K)}</g>`).join('') + T(50, 56, 16, 'A'));
add('vista', 'Punt de vista', 'anotacio', 'vista perspectiva càmera', C(30, 50, 10, K) + L('M38 44L90 18M38 56L90 82') + L('M80 22A40 40 0 0 1 80 78', K, 1.8, DASH('4 4')));
add('simetria', 'Eix de simetria', 'anotacio', 'eix simetria', L('M50 4V96', K, 2, DASH('14 4 2 4')) + L('M38 14h24M38 20h24M38 80h24M38 86h24'));
add('linia-tall', 'Línia de tall', 'anotacio', 'línia tall trencament', L('M4 50H40L46 36L54 64L60 50H96'));
add('ampliacio', 'Ampliació', 'anotacio', 'ampliació lupa detall', C(40, 40, 26) + L('M60 60L88 88', K, 5) + L('M28 40h24M40 28v24'));
// nord
add('nord-1', 'Nord clàssic', 'anotacio', 'nord orientació', C(50, 50, 40) + P('M50 10L64 70L50 60L36 70Z', K));
add('nord-2', 'Nord amb N', 'anotacio', 'nord orientació', P('M50 22L64 82L50 72L36 82Z', K) + T(50, 18, 18, 'N'));
add('nord-3', 'Nord rosa', 'anotacio', 'nord rosa dels vents', P('M50 4L58 42L96 50L58 58L50 96L42 58L4 50L42 42Z') + P('M50 4L58 42L50 50L42 42Z', K) + C(50, 50, 4, K));
add('nord-4', 'Nord minimal', 'anotacio', 'nord fletxa', L('M50 90V14M36 30L50 12L64 30') + T(66, 62, 18, 'N', { a: 'start' }));
add('nord-5', 'Nord cercle partit', 'anotacio', 'nord orientació', C(50, 54, 32) + `<path d="M50 22A32 32 0 0 1 50 86Z" fill="${K}"/>` + P('M50 6L58 22H42Z', K));
// escales gràfiques
for (const [e, lab] of [['50', '0 1 2 3m'], ['100', '0 2 4 6m'], ['200', '0 5 10m'], ['500', '0 10 20m'], ['1000', '0 25 50m']]) {
  const ticks = lab.replace('m', '').split(' ');
  add('escala-' + e, 'Escala gràfica 1:' + e, 'anotacio', 'escala gràfica ' + e, [0, 1, 2, 3].map(i => `<rect x="${6 + i * 22}" y="44" width="22" height="8" fill="${i % 2 ? '#fff' : K}" stroke="${K}" stroke-width="1.6"/>`).join('') + ticks.map((t, i) => T(6 + i * (88 / (ticks.length - 1)), 38, 9, t + (i === ticks.length - 1 ? ' m' : ''), { w: 500 })).join('') + T(50, 70, 10, '1:' + e, { w: 600 }));
}
// eixos estructurals
for (const l of ['1', '2', '3', '4', '5', '6', 'A', 'B', 'C', 'D', 'E', 'F']) add('eix-' + l, 'Eix ' + l, 'anotacio', 'eix estructural replanteig ' + l, C(50, 26, 20) + T(50, 33, 20, l) + L('M50 46V98', K, 2, DASH('12 4 2 4')));
// cotes
add('cota', 'Cota lineal', 'anotacio', 'cota mesura dimensió', L('M10 30V70M90 30V70M10 56H90') + L('M10 56l7-4M10 56l7 4M90 56l-7-4M90 56l-7 4') + T(50, 50, 12, '3,50', { w: 500 }));
add('cota-tick', 'Cota amb tic', 'anotacio', 'cota tic arquitectura', L('M10 30V70M90 30V70M4 56H96') + L('M5 61l10-10M85 61l10-10', K, 3) + T(50, 50, 12, '3,50', { w: 500 }));
add('cota-cadena', 'Cota en cadena', 'anotacio', 'cota cadena', L('M6 30V70M36 30V70M64 30V70M94 30V70M2 56H98') + L('M1 61l10-10M31 61l10-10M59 61l10-10M89 61l10-10', K, 3) + T(21, 50, 9, '1,20', { w: 500 }) + T(50, 50, 9, '1,10', { w: 500 }) + T(79, 50, 9, '1,20', { w: 500 }));
add('cota-angle', 'Cota angular', 'anotacio', 'cota angle graus', L('M14 86L90 86M14 86L64 22') + L('M58 86A44 44 0 0 0 42 52') + T(66, 66, 11, '52°', { w: 500 }));
add('cota-radi', 'Cota de radi', 'anotacio', 'cota radi diàmetre', C(50, 50, 36, 'none') + L('M50 50L78 28') + P('M78 28l-9 1 5 6Z', K) + D(50, 50, 2.5) + T(58, 66, 11, 'R 1,80', { w: 500 }));
add('nivell-planta', 'Cota de nivell (planta)', 'anotacio', 'cota nivell planta altura', C(30, 50, 12) + `<path d="M30 38A12 12 0 0 1 42 50H30Z M30 62A12 12 0 0 1 18 50H30Z" fill="${K}"/>` + T(48, 56, 16, '+3,20', { a: 'start', w: 500 }));
add('nivell-alcat', 'Cota de nivell (alçat)', 'anotacio', 'cota nivell alçat secció', P('M30 60L18 44H42Z', K) + L('M4 60H96M30 44V30') + T(50, 26, 15, '+3,20', { a: 'start', w: 500 }));
add('nivell-zero', 'Cota ±0,00', 'anotacio', 'cota nivell zero referència', P('M30 60L18 44H42Z', '#fff') + L('M4 60H96M30 44V30') + T(50, 26, 15, '±0,00', { a: 'start', w: 500 }));
add('pendent', 'Pendent', 'anotacio', 'pendent inclinació coberta', L('M10 70L90 40') + P('M90 40l-12-1 4 9Z', K) + T(46, 46, 14, '2 %', { w: 500 }));
add('pujada', 'Sentit de pujada', 'anotacio', 'escala pujada sentit', D(16, 50, 5) + L('M16 50H84') + P('M88 50L74 42V58Z', K) + T(50, 38, 11, 'PUJA', { w: 600 }));
add('rampa', 'Rampa', 'anotacio', 'rampa pendent accessible', R(6, 30, 88, 40) + L('M14 50H80') + P('M86 50L74 43V57Z', K) + T(46, 44, 10, '8 %', { w: 500 }));
add('revisio', 'Núvol de revisió', 'anotacio', 'revisió núvol canvi', L('M20 30q4-12 14-6q6-10 16-2q8-8 16 2q12-2 12 10q10 6 2 16q4 12-8 14q-4 10-16 6q-8 8-16 0q-12 4-14-8q-12-4-6-16q-8-10 0-16z', K, 2.2) + P('M70 70L86 96H54Z') + T(70, 92, 12, '2'));
add('triangle-rev', 'Triangle de revisió', 'anotacio', 'revisió número', P('M50 12L90 84H10Z') + T(50, 74, 32, 'A'));
add('etiqueta-hab', 'Etiqueta d\'habitació', 'anotacio', 'habitació espai etiqueta nom superfície', R(8, 26, 84, 48, '#fff', 4) + L('M8 52H92', K, 1.6) + T(50, 46, 15, 'Dormitori') + T(50, 67, 13, '12,40 m²', { w: 500 }));
add('etiqueta-hab2', 'Etiqueta d\'habitació simple', 'anotacio', 'habitació nom', T(50, 46, 16, 'SALA') + T(50, 66, 12, 'S = 24,6 m²', { w: 500 }) + L('M20 52H80', K, 1.2));
add('etiqueta-porta', 'Etiqueta de porta', 'anotacio', 'porta fusteria referència', `<ellipse cx="50" cy="50" rx="40" ry="24" ${ST()}/>` + T(50, 57, 20, 'P1'));
add('etiqueta-fin', 'Etiqueta de finestra', 'anotacio', 'finestra fusteria referència', `<polygon points="50,24 90,50 50,76 10,50" ${ST()}/>` + T(50, 57, 18, 'F3'));
add('etiqueta-mur', 'Etiqueta de mur', 'anotacio', 'mur tipus paret referència', R(14, 34, 72, 32, '#fff', 16) + T(50, 57, 18, 'M2'));
add('etiqueta-mat', 'Etiqueta de material', 'anotacio', 'material crida etiqueta', D(14, 82, 4) + L('M14 82L40 40H92') + T(42, 34, 12, 'Formigó HA-25', { a: 'start', w: 500 }));
add('crida', 'Crida', 'anotacio', 'crida nota leader', P('M18 86L30 70', K) + L('M12 92L36 64H70') + R(40, 20, 52, 38, '#fff', 4) + L('M48 32h36M48 42h28', K, 2));
add('nota', 'Nota general', 'anotacio', 'nota observació', R(10, 14, 80, 72, '#fff', 4) + T(18, 32, 12, 'NOTES', { a: 'start', w: 700 }) + L('M18 44h64M18 56h64M18 68h40', K, 1.8));
add('numero-pas', 'Número de referència', 'anotacio', 'número referència bombolla', C(50, 50, 32) + T(50, 61, 30, '1'));
add('hexagon', 'Referència hexagonal', 'anotacio', 'referència element tipus', `<polygon points="30,16 70,16 90,50 70,84 30,84 10,50" ${ST()}/>` + T(50, 58, 22, 'E1'));
add('demolir', 'Enderrocar', 'anotacio', 'enderroc demolició', R(10, 20, 80, 60, '#fff', 0, 2.4, K) + L('M10 20L90 80M90 20L10 80', '#d62828', 3));
add('fletxa-nord-pl', 'Orientació solar', 'anotacio', 'sol orientació soleig', C(50, 50, 14, '#ffd23f') + L('M50 20V8M50 92V80M20 50H8M92 50H80M29 29l-8-8M79 79l-8-8M29 71l-8 8M79 21l-8 8'));

/* ════ 2. LLEGENDES I CAPES ════ */
const sw = (id, name, tags, pat, bg = '#fff') => add('trama-' + id, 'Trama: ' + name, 'llegendes', 'trama material llegenda ' + tags, `<rect x="10" y="10" width="80" height="80" fill="${bg}"/>${pat}` + R(10, 10, 80, 80, 'none', 0, 2));
const hatch = (step, ang, sw2 = 1.4, col = K, dash = '') => {
  let out = '';
  if (ang === 90) { for (let x = 10 + step / 2; x < 90; x += step) out += `<path d="M${x} 10V90" stroke="${col}" stroke-width="${sw2}"${dash}/>`; return out; }
  for (let k = -80 + step / 2; k < 80; k += step) { const x0 = Math.max(10, 10 - k), x1 = Math.min(90, 90 - k); if (x1 - x0 > 0.5) out += `<path d="M${x0.toFixed(1)} ${(90 - (x0 + k - 10)).toFixed(1)}L${x1.toFixed(1)} ${(90 - (x1 + k - 10)).toFixed(1)}" stroke="${col}" stroke-width="${sw2}"${dash}/>`; }
  return out;
};
sw('formigo', 'Formigó', 'formigó', Array.from({ length: 26 }, (_, i) => `<circle cx="${12 + (i * 37) % 78}" cy="${12 + (i * 53) % 78}" r="${1 + (i % 3) * .6}" fill="${K}"/>`).join('') + Array.from({ length: 10 }, (_, i) => `<path d="M${16 + (i * 29) % 70} ${18 + (i * 41) % 70}l5 2-2 5z" fill="none" stroke="${K}" stroke-width="1"/>`).join(''), '#eeeeee');
sw('formigo-armat', 'Formigó armat', 'formigó armat', hatch(10, 0, 1) + Array.from({ length: 12 }, (_, i) => `<circle cx="${14 + (i * 37) % 74}" cy="${14 + (i * 53) % 74}" r="1.4" fill="${K}"/>`).join(''), '#e6e6e6');
sw('mao', 'Obra de fàbrica', 'maó fàbrica', hatch(7, 0, 1.6, '#b5462a'), '#f6d7c9');
sw('aillament', 'Aïllament', 'aïllament tèrmic', L('M10 50q5-30 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0', K, 1.6) + L('M10 50q5 30 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0', K, 1.6), '#fff6c9');
sw('terreny', 'Terreny', 'terreny terra', Array.from({ length: 30 }, (_, i) => `<circle cx="${12 + (i * 31) % 78}" cy="${12 + (i * 47) % 78}" r="1.2" fill="#6b4a2e"/>`).join('') + hatch(16, 90, 1, '#6b4a2e', ' stroke-dasharray="3 6"'), '#efe3cf');
sw('fusta', 'Fusta', 'fusta', L('M10 30q20-6 40 0t40 0M10 50q20 6 40 0t40 0M10 70q20-6 40 0t40 0', '#8a5a3b', 1.6) + `<ellipse cx="60" cy="50" rx="8" ry="3" fill="none" stroke="#8a5a3b" stroke-width="1.2"/>`, '#f2dfc6');
sw('acer', 'Acer', 'acer metall', hatch(5, 0, 1.4, '#333'), '#dfe4ea');
sw('vidre', 'Vidre', 'vidre', L('M20 80L40 20M36 80L56 20', '#4ba3c7', 1.4), '#e4f4fb');
sw('grava', 'Grava', 'grava drenatge', Array.from({ length: 30 }, (_, i) => `<circle cx="${15 + (i * 31) % 70}" cy="${15 + (i * 43) % 70}" r="${2 + (i % 3)}" fill="none" stroke="${K}" stroke-width="1.2"/>`).join(''), '#f0f0f0');
sw('aigua', 'Aigua', 'aigua làmina', L('M10 32q10-6 20 0t20 0t20 0t20 0M10 52q10-6 20 0t20 0t20 0t20 0M10 72q10-6 20 0t20 0t20 0t20 0', '#2f80c0', 1.6), '#dceffc');
sw('gespa', 'Gespa', 'gespa vegetació jardí', Array.from({ length: 18 }, (_, i) => `<path d="M${14 + (i * 23) % 72} ${24 + (i * 37) % 62}l2-7 2 7" fill="none" stroke="#3f8f3f" stroke-width="1.4"/>`).join(''), '#dff2d6');
sw('pedra', 'Pedra', 'pedra mamposteria', L('M10 36h30l8-12M40 36l10 22H10M50 58h40M66 58l-6-24H90M60 34L52 10M30 90l6-32M70 90l-6-32', K, 1.6), '#ececec');
sw('ceramica', 'Paviment ceràmic', 'paviment rajola ceràmica', Array.from({ length: 5 }, (_, i) => `<path d="M10 ${10 + i * 20}H90M${10 + i * 20} 10V90" stroke="#888" stroke-width="1"/>`).join(''), '#faf7f2');
sw('morter', 'Morter', 'morter arrebossat', Array.from({ length: 40 }, (_, i) => `<circle cx="${11 + (i * 29) % 80}" cy="${11 + (i * 43) % 80}" r=".9" fill="${K}"/>`).join(''), '#f5f5f5');
sw('impermeable', 'Impermeabilització', 'impermeabilització làmina', L('M10 46H90M10 54H90', K, 2) + L('M10 50H90', K, 1, DASH('3 3')), '#e8e8f6');
sw('enderroc', 'Enderroc', 'enderroc demolició', hatch(9, 0, 1.4, '#d62828', ' stroke-dasharray="6 4"'), '#fff');
const ltype = (id, name, dash, col = K, swd = 3) => add('linia-' + id, 'Línia: ' + name, 'llegendes', 'tipus línia llegenda ' + name.toLowerCase(), L('M8 50H92', col, swd, dash ? DASH(dash) : '') + T(50, 76, 11, name, { w: 500 }));
ltype('continua', 'Contínua', '');
ltype('discontinua', 'Discontínua', '10 6');
ltype('oculta', 'Oculta', '5 5', K, 2);
ltype('eix', 'Eix', '18 5 3 5', K, 2);
ltype('enderroc', 'Enderroc', '8 5', '#d62828');
ltype('nova', 'Nova construcció', '', '#2b6cd6', 4);
ltype('limit', 'Límit de parcel·la', '18 5 3 5 3 5', K, 2.4);
ltype('fina', 'Fina', '', K, 1.2);
ltype('gruixuda', 'Gruixuda', '', K, 6);
// codis d'estat i ús
const swatch = (id, name, col, tags) => add('codi-' + id, name, 'llegendes', 'color codi llegenda ' + tags, R(10, 22, 34, 34, col, 3, 2) + T(52, 44, 12, name, { a: 'start', w: 500 }));
[['existent', 'Existent', '#9aa0a6', 'existent'], ['enderroc', 'A enderrocar', '#f28b82', 'enderroc demolició'], ['nou', 'Obra nova', '#7aa7f2', 'nou obra'], ['residencial', 'Residencial', '#fbe7a1', 'ús residencial'], ['terciari', 'Terciari', '#f7c6a3', 'ús terciari oficines'], ['dotacional', 'Dotacional', '#c9b6ec', 'ús dotacional equipament'], ['verd', 'Zona verda', '#b7e1a1', 'verd espai lliure'], ['viari', 'Viari', '#d5d8dc', 'viari circulació'], ['comunes', 'Zones comunes', '#bfe3ef', 'comunes circulació'], ['instal', 'Instal·lacions', '#f6b26b', 'instal·lacions tècniques'], ['sector-a', 'Sector d\'incendi A', '#ffd6d6', 'sector incendi'], ['sector-b', 'Sector d\'incendi B', '#fff1c1', 'sector incendi']].forEach(([id, n, c, t]) => swatch(id, n, c, t));
add('capes', 'Capes', 'llegendes', 'capes layers', P('M50 14L90 34 50 54 10 34Z', '#e8eef9') + L('M10 50l40 20 40-20M10 66l40 20 40-20'));
add('llegenda-marc', 'Marc de llegenda', 'llegendes', 'llegenda quadre', R(6, 6, 88, 88, '#fff', 2) + R(6, 6, 88, 16, K) + T(50, 18, 10, 'LLEGENDA', { c: '#fff', w: 700 }) + [32, 50, 68].map(y => R(14, y - 6, 12, 10, '#ddd', 1, 1.4) + L(`M32 ${y - 1}h48`, K, 1.6)).join(''));

/* ════ 3. INSTAL·LACIONS ════ */
const E = '#d6281b', AG = '#1f6fd1', AC = '#e2402a', GS = '#e8a200', CL = '#11998e', VT = '#5c6b7a', TC = '#7b4fd6', SN = '#7a5230';
// electricitat
const plug = (x, y) => C(x, y, 18) + L(`M${x - 18} ${y}H${x + 18}`, K, 0) + `<path d="M${x - 18} ${y}A18 18 0 0 1 ${x + 18} ${y}Z" fill="${K}"/>`;
add('el-endoll', 'Endoll', 'electricitat', 'endoll presa corrent', L('M50 74V58M36 92h28') + `<path d="M28 58A22 22 0 0 1 72 58Z" ${ST('#fff')}/>` + L('M28 58H72'));
add('el-endoll-doble', 'Endoll doble', 'electricitat', 'endoll doble presa', L('M50 74V58M36 92h28') + `<path d="M28 58A22 22 0 0 1 72 58Z" ${ST('#fff')}/>` + `<path d="M20 58A30 30 0 0 1 80 58" fill="none" stroke="${K}" stroke-width="${W}"/>` + L('M20 58H80'));
add('el-endoll-estanc', 'Endoll estanc', 'electricitat', 'endoll estanc exterior IP', L('M50 74V58M36 92h28') + `<path d="M28 58A22 22 0 0 1 72 58Z" fill="${K}" stroke="${K}" stroke-width="${W}"/>` + T(50, 30, 12, 'IP'));
add('el-endoll-forca', 'Presa de força', 'electricitat', 'endoll força trifàsica', L('M50 74V58M36 92h28') + `<path d="M28 58A22 22 0 0 1 72 58Z" ${ST('#fff')}/>` + L('M28 58H72M50 36v22M40 40l10 6 10-6'));
add('el-endoll-cuina', 'Presa de cuina', 'electricitat', 'endoll cuina forn', L('M50 74V58M36 92h28') + `<path d="M28 58A22 22 0 0 1 72 58Z" ${ST('#fff')}/>` + L('M28 58H72') + T(50, 54, 12, 'C'));
const sw1 = (id, name, tags, extra) => add('el-' + id, name, 'electricitat', 'interruptor ' + tags, C(36, 64, 10) + L('M42 56L74 22') + (extra || ''));
sw1('interruptor', 'Interruptor simple', 'simple', L('M74 22l8 8'));
sw1('interruptor-doble', 'Interruptor doble', 'doble', L('M74 22l8 8M64 32l8 8'));
sw1('commutat', 'Commutat', 'commutat escala', L('M74 22l8 8') + L('M30 72L14 90M14 90l-6-6'));
sw1('creuament', 'Creuament', 'creuament', L('M74 22l8 8M30 72L14 90M14 90l-6-6M14 90l6 6'));
sw1('regulador', 'Regulador', 'regulador dimmer', L('M74 22l8 8') + P('M62 66l18-10v20Z', K));
add('el-polsador', 'Polsador', 'electricitat', 'polsador pulsador', C(50, 50, 20) + C(50, 50, 8, K));
add('el-timbre', 'Timbre', 'electricitat', 'timbre brunzidor', `<path d="M24 56A26 26 0 0 1 76 56Z" ${ST()}/>` + L('M20 56H80M50 56v24'));
add('el-quadre', 'Quadre elèctric', 'electricitat', 'quadre elèctric protecció', R(18, 22, 64, 56) + `<path d="M18 22L82 78V22Z" fill="${K}"/>`);
add('el-quadre-sec', 'Subquadre', 'electricitat', 'subquadre secundari', R(18, 22, 64, 56) + `<path d="M18 78L82 22V78Z" fill="#999"/>`);
add('el-comptador', 'Comptador elèctric', 'electricitat', 'comptador electricitat', R(22, 22, 56, 56) + T(50, 60, 22, 'kWh', { w: 700 }).replace('font-size="22"', 'font-size="16"'));
add('el-cgp', 'Caixa general de protecció', 'electricitat', 'CGP escomesa', R(18, 30, 64, 40) + T(50, 57, 16, 'CGP', { w: 700 }));
add('el-terra', 'Presa de terra', 'electricitat', 'terra posada a terra', L('M50 14V54M26 54H74M34 66H66M42 78H58'));
add('el-ascomesa', 'Escomesa elèctrica', 'electricitat', 'escomesa connexió xarxa', L('M10 50H60') + P('M60 30L90 50L60 70Z', K));
add('el-motor', 'Motor', 'electricitat', 'motor', C(50, 50, 30) + T(50, 60, 26, 'M'));
add('el-transformador', 'Transformador', 'electricitat', 'transformador', C(38, 50, 22, 'none') + C(62, 50, 22, 'none'));
add('el-generador', 'Grup electrogen', 'electricitat', 'generador grup electrogen', C(50, 50, 30) + T(50, 60, 26, 'G'));
add('el-sai', 'SAI', 'electricitat', 'SAI UPS alimentació', R(16, 26, 68, 48) + T(50, 57, 18, 'SAI', { w: 700 }));
add('el-tub', 'Línia encastada', 'electricitat', 'línia cablejat encastat', L('M8 50H92', E, 3) + L('M30 42l8 16M42 42l8 16M54 42l8 16', E, 2));
add('el-safata', 'Safata de cables', 'electricitat', 'safata cables', L('M8 36H92M8 64H92', K, 2.4) + L('M8 50H92', K, 1.4, DASH('6 4')));
add('el-detector', 'Detector de moviment', 'electricitat', 'detector presència moviment sensor', C(50, 50, 18) + L('M22 30a36 36 0 0 0 0 40M14 22a48 48 0 0 0 0 56M78 30a36 36 0 0 1 0 40M86 22a48 48 0 0 1 0 56', K, 2));
add('el-termostat', 'Termòstat', 'electricitat', 'termòstat temperatura', R(22, 22, 56, 56, '#fff', 4) + T(50, 60, 22, 'T', { w: 700 }));
// il·luminació
add('il-punt', 'Punt de llum', 'illuminacio', 'llum punt sostre', C(50, 50, 20) + L('M36 36l28 28M64 36L36 64'));
add('il-aplic', 'Aplic de paret', 'illuminacio', 'aplic paret llum', `<path d="M30 70A20 20 0 0 1 70 70Z" ${ST()}/>` + L('M30 70h40M40 52l20 18M60 52L40 70'));
add('il-empotrat', 'Downlight empotrat', 'illuminacio', 'downlight encastat foco', C(50, 50, 22) + C(50, 50, 10, K));
add('il-led', 'Lluminària LED', 'illuminacio', 'LED panell lluminària', R(18, 18, 64, 64) + L('M18 18l64 64M82 18L18 82', K, 1.6));
add('il-lineal', 'Lluminària lineal', 'illuminacio', 'fluorescent lineal tub', R(8, 40, 84, 20) + L('M8 40l8-12M92 40l-8-12M8 60l8 12M92 60l-8 12'));
add('il-carril', 'Carril amb focus', 'illuminacio', 'carril focus', L('M8 30H92', K, 4) + [24, 50, 76].map(x => L(`M${x} 30v12`) + C(x, 54, 10)).join(''));
add('il-focus', 'Projector', 'illuminacio', 'projector focus', C(36, 50, 16) + L('M52 40L90 24M52 60L90 76', K, 2));
add('il-emergencia', 'Llum d\'emergència', 'illuminacio', 'emergència enllumenat', R(16, 34, 68, 32, '#fff') + `<path d="M50 34V66" stroke="${K}" stroke-width="${W}"/><path d="M16 34h34v32H16Z" fill="#2e9e4f" stroke="${K}" stroke-width="${W}"/>`);
add('il-exterior', 'Fanal', 'illuminacio', 'fanal enllumenat exterior', L('M50 92V30M50 30q0-14 20-14') + P('M60 16h20l-4 10H64Z', '#fff'));
add('il-baliza', 'Balisa', 'illuminacio', 'balisa enllumenat jardí', R(40, 24, 20, 68) + R(40, 24, 20, 14, '#ffd23f'));
add('il-tira', 'Tira LED', 'illuminacio', 'tira LED indirecta', L('M8 50H92', '#e8a200', 6) + [16, 30, 44, 58, 72, 86].map(x => D(x, 50, 2, '#fff')).join(''));
add('il-sensor', 'Sensor de llum', 'illuminacio', 'sensor lluminositat', C(50, 50, 18) + T(50, 57, 18, 'L'));
// fontaneria i sanejament
add('ai-escomesa', 'Escomesa d\'aigua', 'aigua', 'escomesa aigua xarxa', L('M8 50H60', AG, 3) + P('M60 34L88 50L60 66Z', AG));
add('ai-comptador', 'Comptador d\'aigua', 'aigua', 'comptador aigua', C(50, 50, 26) + T(50, 58, 20, 'm³', { w: 600 }).replace('font-size="20"', 'font-size="18"') + L('M4 50h20M76 50h20', AG, 3));
add('ai-clau', 'Clau de pas', 'aigua', 'clau pas vàlvula', L('M6 50H94', AG, 3) + P('M30 32L70 68V32L30 68Z', '#fff'));
add('ai-valvula-ret', 'Vàlvula de retenció', 'aigua', 'vàlvula retenció antiretorn', L('M6 50H94', AG, 3) + P('M30 32L70 68V32L30 68Z', '#fff') + `<path d="M30 32L50 50 30 68Z" fill="${K}"/>`);
add('ai-aixeta', 'Aixeta', 'aigua', 'aixeta grifo', L('M10 40H54q14 0 14 14v20', AG, 4) + R(30, 24, 12, 16, '#fff', 2));
add('ai-freda', 'Aigua freda', 'aigua', 'aigua freda AF canonada', L('M8 50H92', AG, 4) + T(50, 38, 14, 'AF', { c: AG }));
add('ai-acs', 'Aigua calenta (ACS)', 'aigua', 'ACS aigua calenta sanitària', L('M8 50H92', AC, 4, DASH('12 6')) + T(50, 38, 14, 'ACS', { c: AC }));
add('ai-retorn', 'Retorn ACS', 'aigua', 'retorn ACS recirculació', L('M8 50H92', AC, 3, DASH('3 5')) + T(50, 38, 14, 'RACS', { c: AC }));
add('ai-termo', 'Termo elèctric', 'aigua', 'termo escalfador acumulador', R(30, 10, 40, 80, '#fff', 20) + T(50, 58, 16, 'T', { w: 700 }) + L('M42 90v6M58 90v6'));
add('ai-escalfador', 'Escalfador', 'aigua', 'escalfador gas instantani', R(26, 14, 48, 70, '#fff', 6) + P('M50 36q10 12 4 22q-6 8-12 0q-4-10 8-22Z', AC));
add('ai-diposit', 'Dipòsit', 'aigua', 'dipòsit aljub aigua', R(18, 22, 64, 62, '#e3f0fb', 8) + L('M18 44H82', AG, 2, DASH('6 4')));
add('ai-grup-pressio', 'Grup de pressió', 'aigua', 'grup pressió bomba', C(50, 50, 28) + P('M38 34L70 50 38 66Z', '#fff'));
add('ai-bomba', 'Bomba', 'aigua', 'bomba impulsió', C(50, 50, 28) + L('M50 22L78 50 50 78'));
add('ai-filtre', 'Filtre', 'aigua', 'filtre descalcificador', L('M6 50H24M76 50h18', AG, 3) + `<polygon points="50,24 76,50 50,76 24,50" ${ST()}/>` + L('M38 62L62 38', K, 2));
add('ai-ducha', 'Punt de dutxa', 'aigua', 'dutxa punt', C(50, 50, 20) + [0, 1, 2, 3, 4, 5].map(i => D(50 + Math.cos(i) * 10, 50 + Math.sin(i) * 10, 2)).join(''));
add('ai-reg', 'Reg', 'aigua', 'reg aspersor jardí', C(50, 66, 8, AG) + L('M50 58V40M30 30q20-20 40 0M20 40q30-30 60 0', AG, 2));
add('sa-baixant', 'Baixant', 'sanejament', 'baixant pluvial residual', C(50, 50, 18) + D(50, 50, 6) + T(50, 90, 12, 'BP', { c: SN }));
add('sa-bonera', 'Bonera', 'sanejament', 'bonera desguàs coberta', R(30, 30, 40, 40) + L('M30 30l40 40M70 30L30 70', K, 1.6));
add('sa-arqueta', 'Arqueta', 'sanejament', 'arqueta registre', R(22, 22, 56, 56) + R(32, 32, 36, 36, 'none', 0, 1.6));
add('sa-arqueta-sif', 'Arqueta sifònica', 'sanejament', 'arqueta sifònica', R(22, 22, 56, 56) + `<path d="M22 22h56v56Z" fill="${K}"/>`);
add('sa-pou', 'Pou de registre', 'sanejament', 'pou registre clavegueram', C(50, 50, 30) + C(50, 50, 18, 'none', 1.6));
add('sa-pericó', 'Pericó', 'sanejament', 'pericó caixa sifònica', C(50, 50, 24) + L('M34 50h32M50 34v32', K, 1.6));
add('sa-colector', 'Col·lector', 'sanejament', 'col·lector tub sanejament', L('M8 50H92', SN, 5) + P('M60 38L74 50 60 62Z', SN));
add('sa-canal', 'Canal de recollida', 'sanejament', 'canal reixa interceptora', R(6, 38, 88, 24) + L('M16 38v24M28 38v24M40 38v24M52 38v24M64 38v24M76 38v24', K, 1.6));
add('sa-separador', 'Separador de greixos', 'sanejament', 'separador greixos hidrocarburs', R(14, 26, 72, 48) + L('M38 26v30M62 44v30', K, 2));
add('sa-ventilacio', 'Ventilació primària', 'sanejament', 'ventilació baixant', C(50, 60, 14) + L('M50 46V14M40 22l10-10 10 10'));
// gas
add('gs-escomesa', 'Escomesa de gas', 'gas', 'escomesa gas', L('M8 50H60', GS, 3) + P('M60 34L88 50L60 66Z', GS));
add('gs-comptador', 'Comptador de gas', 'gas', 'comptador gas', R(22, 22, 56, 56) + T(50, 58, 18, 'G', { w: 700 }) + L('M4 50h18M78 50h18', GS, 3));
add('gs-clau', 'Clau de gas', 'gas', 'clau tall gas', L('M6 50H94', GS, 3) + P('M30 32L70 68V32L30 68Z', GS));
add('gs-caldera', 'Caldera', 'gas', 'caldera calefacció', R(24, 12, 52, 76, '#fff', 4) + C(50, 42, 12) + L('M38 70h24M38 78h24'));
add('gs-cuina', 'Cuina de gas', 'gas', 'cuina fogons gas', R(14, 14, 72, 72) + [[34, 34], [66, 34], [34, 66], [66, 66]].map(([x, y]) => C(x, y, 10, 'none')).join(''));
add('gs-regulador', 'Regulador de gas', 'gas', 'regulador pressió gas', L('M6 50H94', GS, 3) + C(50, 50, 16) + L('M40 40l20 20'));
add('gs-detector', 'Detector de gas', 'gas', 'detector fuita gas', C(50, 50, 26) + T(50, 58, 18, 'G', { c: GS, w: 700 }) + L('M24 24l8 8M76 24l-8 8'));
add('gs-reixa', 'Reixa de ventilació de gas', 'gas', 'reixa ventilació gas', R(18, 26, 64, 48) + L('M26 38h48M26 50h48M26 62h48', K, 2));
add('gs-canonada', 'Canonada de gas', 'gas', 'canonada gas', L('M8 50H92', GS, 4) + T(50, 38, 14, 'GAS', { c: GS }));
add('gs-diposit', 'Dipòsit GLP', 'gas', 'dipòsit GLP propà', R(10, 34, 80, 32, '#fff8e1', 16) + T(50, 56, 14, 'GLP', { w: 700 }));
// climatització i ventilació
add('cl-impulsio', 'Reixa d\'impulsió', 'clima', 'reixa impulsió aire', R(16, 30, 68, 40) + L('M16 30l68 40') + P('M50 6V22M42 14l8 8 8-8', 'none'));
add('cl-retorn', 'Reixa de retorn', 'clima', 'reixa retorn aire', R(16, 30, 68, 40) + L('M16 30l68 40M84 30L16 70') + L('M50 22V6M42 14l8-8 8 8'));
add('cl-difusor', 'Difusor', 'clima', 'difusor rotacional sostre', R(20, 20, 60, 60) + C(50, 50, 22, 'none', 1.8) + C(50, 50, 10, 'none', 1.8));
add('cl-conducte', 'Conducte', 'clima', 'conducte aire', L('M6 36H94M6 64H94', CL, 3) + L('M30 36L42 64M58 36L70 64', CL, 1.4));
add('cl-conducte-circ', 'Conducte circular', 'clima', 'conducte circular', C(50, 50, 28, '#fff', 3, CL) + L('M50 22V78', CL, 1.4));
add('cl-extractor', 'Extractor', 'clima', 'extractor ventilador', C(50, 50, 30) + P('M50 50q-4-22 10-24q6 14-10 24ZM50 50q22-4 24 10q-14 6-24-10ZM50 50q4 22-10 24q-6-14 10-24ZM50 50q-22 4-24-10q14-6 24 10Z', K, 1));
add('cl-recuperador', 'Recuperador de calor', 'clima', 'recuperador calor ventilació mecànica', R(12, 22, 76, 56) + L('M12 22L88 78M88 22L12 78') + C(50, 50, 8, '#fff'));
add('cl-split-int', 'Split interior', 'clima', 'split interior aire condicionat', R(10, 34, 80, 26, '#fff', 8) + L('M18 50h64', K, 1.6) + L('M28 66q4 8 0 14M50 66q4 8 0 14M72 66q4 8 0 14', CL, 2));
add('cl-split-ext', 'Unitat exterior', 'clima', 'unitat exterior condensadora', R(10, 22, 80, 56, '#fff', 4) + C(38, 50, 18, 'none', 2) + L('M68 34v32M76 34v32', K, 1.6));
add('cl-fancoil', 'Fan-coil', 'clima', 'fancoil', R(12, 30, 76, 40) + T(50, 57, 16, 'FC', { w: 700 }));
add('cl-bomba-calor', 'Bomba de calor', 'clima', 'bomba calor aerotèrmia', R(14, 22, 72, 56, '#fff', 4) + T(50, 57, 16, 'BC', { w: 700 }));
add('cl-radiador', 'Radiador', 'clima', 'radiador calefacció', R(12, 30, 76, 40, '#fff', 3) + [24, 36, 48, 60, 72].map(x => L(`M${x} 30v40`, K, 1.8)).join(''));
add('cl-terra-rad', 'Terra radiant', 'clima', 'terra radiant calefacció', L('M10 20H86q6 0 6 6t-6 6H14q-6 0-6 6t6 6H86q6 0 6 6t-6 6H14q-6 0-6 6t6 6H86q6 0 6 6t-6 6H10', AC, 2.4));
add('cl-termostat', 'Termòstat ambient', 'clima', 'termòstat clima', C(50, 50, 22) + T(50, 57, 18, 'T', { w: 700 }));
add('cl-vmc', 'VMC', 'clima', 'VMC ventilació mecànica controlada', R(14, 26, 72, 48) + T(50, 57, 16, 'VMC', { w: 700 }));
add('cl-xemeneia', 'Xemeneia', 'clima', 'xemeneia conducte fums', R(36, 20, 28, 72) + L('M30 20h40M40 14q4-8 0-12M56 14q4-8 0-12', K, 2));
add('cl-comporta', 'Comporta tallafoc', 'clima', 'comporta tallafoc conducte', L('M6 36H94M6 64H94', CL, 3) + L('M50 30V70', '#d62828', 4) + T(50, 90, 11, 'CT', { c: '#d62828' }));
add('cl-refredadora', 'Refredadora', 'clima', 'refredadora chiller', R(10, 24, 80, 52) + C(30, 50, 12, 'none') + C(70, 50, 12, 'none'));
add('cl-torre', 'Torre de refrigeració', 'clima', 'torre refrigeració', P('M28 90L36 30H64L72 90Z') + L('M30 20q6-8 0-14M50 20q6-8 0-14M70 20q6-8 0-14', K, 2));
add('cl-sonda', 'Sonda de temperatura', 'clima', 'sonda temperatura sensor', C(50, 50, 16) + L('M50 66V92', K, 2) + T(50, 56, 14, 't', { w: 700 }));
add('cl-humitat', 'Sensor d\'humitat', 'clima', 'humitat higròmetre', C(50, 50, 22) + P('M50 36q10 12 8 18a8 8 0 0 1 -16 0q-2-6 8-18Z', AG));
add('cl-co2', 'Sensor de CO₂', 'clima', 'CO2 qualitat aire sensor', C(50, 50, 26) + T(50, 57, 16, 'CO₂', { w: 700 }));
// elevació
add('el-ascensor', 'Ascensor (planta)', 'elevacio', 'ascensor elevador planta', R(16, 16, 68, 68) + L('M16 16l68 68M84 16L16 84', K, 1.6) + R(16, 76, 68, 8, K));
add('el-ascensor-sym', 'Ascensor', 'elevacio', 'ascensor senyal', R(20, 10, 60, 80, '#fff', 4) + P('M38 32L50 18L62 32Z', K) + P('M38 68L50 82L62 68Z', K) + L('M50 40v20', K, 2));
add('el-muntacarregues', 'Muntacàrregues', 'elevacio', 'muntacàrregues muntaplats', R(16, 16, 68, 68) + R(30, 30, 40, 40, 'none', 0, 2) + L('M30 30l40 40', K, 1.6));
add('el-escala-mec', 'Escala mecànica', 'elevacio', 'escala mecànica', L('M10 82H28L72 22H90', K, 4) + L('M36 62l6-8M46 50l6-8M56 38l6-8', K, 2));
add('el-plataforma', 'Plataforma elevadora', 'elevacio', 'plataforma elevadora accessible', R(18, 60, 64, 10) + L('M26 70l48 20M74 70L26 90') + L('M50 56V18M40 28l10-10 10 10', K, 2));
add('el-sala-maq', 'Sala de màquines', 'elevacio', 'sala màquines ascensor', R(14, 20, 72, 60) + C(50, 50, 16, 'none') + L('M50 34v32M34 50h32', K, 1.6));
add('el-salvaescales', 'Salvaescales', 'elevacio', 'salvaescales cadira', L('M10 86h18v-14h18v-14h18v-14h18v-14h10', K, 2.4) + R(44, 30, 18, 22, '#fff', 3));
// renovables
add('re-fotovoltaica', 'Placa fotovoltaica', 'renovables', 'fotovoltaica solar placa', P('M8 74L22 26H92L78 74Z', '#dfe8f8') + L('M31 74l11-48M55 74l11-48M15 50h70', K, 1.8));
add('re-termica', 'Captador solar tèrmic', 'renovables', 'solar tèrmica captador', R(10, 26, 80, 48, '#fff2e0') + L('M18 34v32M30 34v32M42 34v32M54 34v32M66 34v32M78 34v32', AC, 2));
add('re-inversor', 'Inversor', 'renovables', 'inversor fotovoltaic', R(18, 18, 64, 64) + L('M18 82L82 18', K, 1.6) + L('M26 34q6-8 12 0t12 0', K, 2) + L('M58 66h16M58 72h16', K, 2));
add('re-bateria', 'Bateria', 'renovables', 'bateria emmagatzematge', R(14, 26, 66, 48) + R(80, 40, 8, 20, K) + L('M30 50h12M36 44v12M56 50h12', K, 3));
add('re-recarrega', 'Punt de recàrrega VE', 'renovables', 'recàrrega vehicle elèctric carregador', R(28, 14, 34, 74, '#fff', 4) + P('M48 26L38 48H48L42 66L56 40H46Z', '#2e9e4f', 1.6) + L('M62 40h10v30a6 6 0 0 0 12 0V30', K, 2.4));
add('re-eolica', 'Aerogenerador', 'renovables', 'eòlica aerogenerador vent', L('M50 40V94', K, 3) + [0, 120, 240].map(a => `<g transform="rotate(${a} 50 40)">${P('M50 40Q46 22 50 6Q54 22 50 40Z', '#fff', 2)}</g>`).join('') + C(50, 40, 4, K));
add('re-geotermia', 'Geotèrmia', 'renovables', 'geotèrmia sonda', L('M8 30H92', K, 2) + L('M40 30V88q10 8 20 0V30', AC, 3));
add('re-aerotermia', 'Aerotèrmia', 'renovables', 'aerotèrmia bomba calor', R(12, 22, 76, 56, '#fff', 4) + C(40, 50, 18, 'none', 2) + P('M40 50q-2-12 6-14q4 8-6 14Z', K, 1) + T(74, 56, 12, 'A', { w: 700 }));
add('re-comptador-bi', 'Comptador bidireccional', 'renovables', 'comptador bidireccional autoconsum', R(22, 22, 56, 56) + L('M32 42h36M60 34l8 8-8 8M68 58H32M40 50l-8 8 8 8', K, 2));
// telecomunicacions i seguretat
add('tc-presa-tv', 'Presa de TV', 'telecom', 'TV antena presa', C(50, 50, 24) + T(50, 57, 16, 'TV', { w: 700 }));
add('tc-presa-dades', 'Presa de dades', 'telecom', 'dades RJ45 xarxa', R(26, 26, 48, 48) + T(50, 57, 14, 'RJ45', { w: 700 }).replace('font-size="14"', 'font-size="12"'));
add('tc-telefon', 'Presa de telèfon', 'telecom', 'telèfon presa', C(50, 50, 24) + T(50, 57, 16, 'TF', { w: 700 }));
add('tc-fibra', 'Fibra òptica', 'telecom', 'fibra òptica FTTH', C(50, 50, 24) + T(50, 57, 14, 'FO', { w: 700 }));
add('tc-wifi', 'Punt d\'accés Wi-Fi', 'telecom', 'wifi punt accés', C(50, 70, 6, TC, 0) + L('M30 56a28 28 0 0 1 40 0M20 44a42 42 0 0 1 60 0', TC, 3));
add('tc-riti', 'RITI / RITS', 'telecom', 'RITI RITS recinte telecomunicacions', R(14, 26, 72, 48) + T(50, 57, 14, 'RITI', { w: 700 }));
add('tc-antena', 'Antena', 'telecom', 'antena TV', L('M50 92V30M30 30h40M34 40h32M38 50h24', K, 2.4) + P('M50 30L44 16h12Z', K));
add('tc-parabolica', 'Antena parabòlica', 'telecom', 'parabòlica satèl·lit', P('M20 30q10 40 50 50L20 30Z', '#fff') + L('M45 55L70 30M56 70l-6 22h20'));
add('tc-cctv', 'Càmera CCTV', 'telecom', 'càmera videovigilància CCTV', P('M14 30L70 30L80 46L24 46Z') + L('M30 46l6 20h30M66 66V86'));
add('tc-interfon', 'Intèrfon', 'telecom', 'intèrfon porter', R(30, 12, 40, 76, '#fff', 6) + C(50, 32, 8, 'none', 2) + L('M40 56h20M40 64h20M40 72h20', K, 2));
add('tc-videoporter', 'Videoporter', 'telecom', 'videoporter', R(28, 12, 44, 76, '#fff', 6) + R(36, 22, 28, 22, '#dfe8f8', 2) + C(50, 64, 6, 'none', 2));
add('tc-acces', 'Control d\'accés', 'telecom', 'control accés lector targeta', R(30, 14, 40, 72, '#fff', 6) + R(38, 26, 24, 16, K) + C(50, 64, 8, 'none', 2));
add('tc-alarma', 'Central d\'alarma', 'telecom', 'alarma intrusió', R(20, 24, 60, 52, '#fff', 4) + T(50, 56, 14, 'ALM', { w: 700 }));
add('tc-altaveu', 'Altaveu', 'telecom', 'altaveu megafonia', P('M20 40h14l22-16v52L34 60H20Z') + L('M66 38q8 12 0 24M74 30q14 20 0 40', K, 2.4));
add('tc-rellotge', 'Rellotge sincronitzat', 'telecom', 'rellotge sincronitzat', C(50, 50, 30) + L('M50 28v22l14 8'));
add('tc-domotica', 'Domòtica', 'telecom', 'domòtica automatització KNX', R(18, 18, 64, 64, '#fff', 8) + P('M30 54L50 34l20 20v16H30Z', '#fff', 2) + D(50, 58, 4, TC));

/* ════ 4. PROTECCIÓ CONTRA INCENDIS ════ */
const PCI = '#d62828';
const red = (id, name, tags, body) => add('pci-' + id, name, 'incendis', 'incendis protecció ' + tags, R(8, 8, 84, 84, PCI, 6, 0) + body);
const wl = (d, sw2 = 4) => L(d, '#fff', sw2);
const wf = d => `<path d="${d}" fill="#fff"/>`;
red('extintor', 'Extintor', 'extintor', wf('M40 30h20v58H40Z') + wf('M44 22h10v8H44Z') + wl('M54 24h14l6 10', 3) + wf('M70 34l10 6-4 4Z'));
red('bie', 'BIE (mànega)', 'BIE mànega boca equipada', `<circle cx="46" cy="50" r="24" fill="none" stroke="#fff" stroke-width="6"/><circle cx="46" cy="50" r="10" fill="none" stroke="#fff" stroke-width="5"/>` + wl('M70 50h12l2 12', 4));
red('hidrant', 'Hidrant', 'hidrant columna', wf('M38 30h24v54H38Z') + wf('M34 24h32v8H34Z') + wf('M26 50h12v10H26ZM62 50h12v10H62Z'));
red('polsador', 'Polsador d\'alarma', 'polsador alarma', R(24, 24, 52, 52, 'none', 4, 4, '#fff') + C(50, 50, 10, '#fff', 0) + wl('M64 70l12 12'));
red('sirena', 'Sirena', 'sirena alarma acústica', wf('M24 40h12l20-14v48L36 60H24Z') + wl('M64 38q8 12 0 24M72 30q14 20 0 40', 3.4));
red('telefon', 'Telèfon d\'emergència', 'telèfon emergència', wf('M30 24h12l4 14-8 6q6 12 18 18l6-8 14 4v12a4 4 0 0 1 -4 4Q26 70 26 28a4 4 0 0 1 4 -4Z'));
red('columna-seca', 'Columna seca', 'columna seca', wf('M42 20h16v64H42Z') + wf('M28 34h14v10H28ZM58 34h14v10H58Z') );
red('ruixador', 'Ruixador', 'ruixador sprinkler', wf('M44 18h12v22H44Z') + wf('M34 40h32l-6 8H40Z') + [[30, 66], [40, 74], [50, 78], [60, 74], [70, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`).join(''));
red('manta', 'Manta ignífuga', 'manta ignífuga', R(26, 24, 48, 52, 'none', 2, 4, '#fff') + wl('M34 36h32M34 48h32M34 60h32', 2.6));
red('direccio', 'Direcció a equip', 'fletxa direcció equip', wf('M20 44h40V30l22 20-22 20V56H20Z'));
add('pci-detector-fum', 'Detector de fum', 'incendis', 'detector fum incendis', C(50, 50, 26) + T(50, 58, 20, 'F', { c: PCI, w: 700 }));
add('pci-detector-calor', 'Detector tèrmic', 'incendis', 'detector calor tèrmic', C(50, 50, 26) + T(50, 58, 20, 'T', { c: PCI, w: 700 }));
add('pci-central', 'Central d\'incendis', 'incendis', 'central detecció incendis', R(16, 22, 68, 56, '#fff') + `<path d="M16 22h68v14H16Z" fill="${PCI}"/>` + T(50, 64, 14, 'CDI', { w: 700 }));
add('pci-porta-tf', 'Porta tallafoc', 'incendis', 'porta tallafoc EI', L('M10 86V14') + L('M10 14A72 72 0 0 1 82 86', K, 2, DASH('6 4')) + L('M10 86H82', K, 2) + T(56, 52, 16, 'EI-60', { c: PCI, w: 700 }));
add('pci-sector', 'Límit de sector', 'incendis', 'sectorització límit sector incendi', L('M6 50H94', PCI, 6) + L('M6 50H94', '#fff', 2, DASH('8 8')));
add('pci-origen', 'Origen d\'evacuació', 'incendis', 'origen evacuació recorregut', C(50, 50, 14, '#2e9e4f', 0) + C(50, 50, 6, '#fff', 0));
add('pci-recorregut', 'Recorregut d\'evacuació', 'incendis', 'recorregut evacuació', L('M8 50H80', '#2e9e4f', 4, DASH('10 6')) + P('M92 50L76 40V60Z', '#2e9e4f', 0));
add('pci-sortida-pl', 'Sortida de planta', 'incendis', 'sortida planta evacuació', R(20, 24, 60, 52, '#2e9e4f', 4, 0) + T(50, 57, 16, 'SP', { c: '#fff', w: 700 }));
add('pci-ocupacio', 'Ocupació', 'incendis', 'ocupació aforament persones', C(50, 50, 30) + T(50, 46, 12, 'OCUP.', { w: 700 }) + T(50, 64, 14, '120 p', { w: 500 }));
add('pci-hidrant-ext', 'Hidrant exterior (planta)', 'incendis', 'hidrant exterior', C(50, 50, 20, PCI, 0) + T(50, 57, 16, 'H', { c: '#fff', w: 700 }));
add('pci-zona-refugi', 'Zona de refugi', 'incendis', 'zona refugi accessible evacuació', R(14, 14, 72, 72, '#2e9e4f', 6, 0) + T(50, 58, 18, 'ZR', { c: '#fff', w: 700 }));
add('pci-evac-ascensor', 'Ascensor d\'emergència', 'incendis', 'ascensor emergència bombers', R(18, 10, 64, 80, PCI, 6, 0) + P('M38 30L50 18L62 30Z', '#fff', 0) + P('M38 70L50 82L62 70Z', '#fff', 0) + T(50, 57, 14, 'EMG', { c: '#fff', w: 700 }));

/* ════ 5. SENYALÈTICA ════ */
const GR = '#1e8a44', BL = '#1f5fbf', YE = '#f5c400', RD = '#d62828';
// pictogrames reutilitzables (en blanc o negre)
const pRun = (f, x = 0, y = 0) => `<g transform="translate(${x} ${y})" fill="${f}" stroke="${f}"><circle cx="58" cy="22" r="7" stroke="none"/><path d="M50 32l-14 6-6 12M50 32l-4 22 14 10 4 20M46 54l-12 16-14 2M50 32l14 12 12-2" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const pPerson = (f, x = 50, y = 0, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${f}"><circle cx="0" cy="22" r="8"/><path d="M-12 34h24v28h-6v26h-12V62h-6Z"/></g>`;
const pDoor = f => `<path d="M24 16h30v68H24Z" fill="none" stroke="${f}" stroke-width="5"/>`;
const pArrow = (f, rot = 0) => `<g transform="rotate(${rot} 50 50)"><path d="M20 44h40V30l22 20-22 20V56H20Z" fill="${f}"/></g>`;
const pStairs = f => `<path d="M14 84h18V68h18V52h18V36h18" fill="none" stroke="${f}" stroke-width="6"/>`;
const pCross = f => `<path d="M40 18h20v22h22v20H60v22H40V60H18V40h22Z" fill="${f}"/>`;
const pWheel = f => `<g fill="none" stroke="${f}" stroke-width="5"><circle cx="46" cy="66" r="18"/></g><circle cx="44" cy="20" r="7" fill="${f}"/><path d="M42 30v26h22l8 22" fill="none" stroke="${f}" stroke-width="6" stroke-linejoin="round"/><path d="M42 42h16" stroke="${f}" stroke-width="5"/>`;
const sq = (bg, body, rx = 6) => R(8, 8, 84, 84, bg, rx, 0) + body;
const exitS = (id, name, rot, extra = '') => add('sg-' + id, name, 'evacuacio', 'evacuació sortida emergència fletxa ' + name.toLowerCase(), `<rect x="2" y="20" width="96" height="60" rx="4" fill="${GR}"/>` + `<g transform="translate(-2 18) scale(.64)">${pRun('#fff')}${pDoor('#fff').replace('M24 16', 'M90 16').replace('h30', 'h-24')}</g>` + `<g transform="translate(48 22) scale(.56)">${pArrow('#fff', rot)}</g>` + extra);
exitS('sortida', 'Sortida (dreta)', 0); exitS('sortida-esq', 'Sortida (esquerra)', 180); exitS('sortida-amunt', 'Sortida (endavant)', -90); exitS('sortida-avall', 'Sortida (avall)', 90); exitS('sortida-diag', 'Sortida (diagonal)', -45); exitS('sortida-diag2', 'Sortida (diagonal avall)', 45);
add('sg-sortida-text', 'SORTIDA', 'evacuacio', 'sortida text evacuació', `<rect x="2" y="30" width="96" height="40" rx="4" fill="${GR}"/>` + T(50, 58, 18, 'SORTIDA', { c: '#fff', w: 700 }));
add('sg-sortida-emer', 'SORTIDA D\'EMERGÈNCIA', 'evacuacio', 'sortida emergència text', `<rect x="2" y="26" width="96" height="48" rx="4" fill="${GR}"/>` + T(50, 47, 11, 'SORTIDA', { c: '#fff', w: 700 }) + T(50, 63, 11, 'D\'EMERGÈNCIA', { c: '#fff', w: 700 }));
add('sg-fletxa-verda', 'Fletxa d\'evacuació', 'evacuacio', 'fletxa evacuació verda', sq(GR, pArrow('#fff')));
add('sg-punt-trobada', 'Punt de trobada', 'evacuacio', 'punt trobada reunió evacuació', sq(GR, pPerson('#fff', 30, 6, .7) + pPerson('#fff', 70, 6, .7) + pPerson('#fff', 50, 22, .7) + L('M14 84l10-10M86 84l-10-10M14 16l10 10M86 16l-10 10', '#fff', 4)));
add('sg-escala-evac', 'Escala d\'evacuació', 'evacuacio', 'escala evacuació', sq(GR, pStairs('#fff') + `<g transform="translate(-10 -14) scale(.7)">${pRun('#fff')}</g>`));
add('sg-primers-aux', 'Primers auxilis', 'evacuacio', 'primers auxilis farmaciola', sq(GR, pCross('#fff')));
add('sg-dea', 'Desfibril·lador', 'evacuacio', 'desfibril·lador DEA', sq(GR, `<path d="M50 80S16 58 16 36a17 17 0 0 1 34 -6 17 17 0 0 1 34 6c0 22-34 44-34 44Z" fill="#fff"/><path d="M54 30L40 52h12L44 72l18-28H50Z" fill="${GR}"/>`));
add('sg-dutxa-emer', 'Dutxa d\'emergència', 'evacuacio', 'dutxa emergència rentaulls', sq(GR, pPerson('#fff', 50, 22, .8) + L('M30 18h40M38 24v6M50 24v6M62 24v6', '#fff', 4)));
add('sg-sortida-adapt', 'Sortida accessible', 'evacuacio', 'sortida accessible evacuació', sq(GR, `<g transform="translate(-6 0) scale(.9)">${pWheel('#fff')}</g>`) + `<g transform="translate(46 10) scale(.4)">${pArrow('#fff')}</g>`);
// prohibició
const ban = (id, name, tags, body) => add('sg-' + id, name, 'prohibicio', 'prohibit prohibició ' + tags, C(50, 50, 40, '#fff', 9, RD) + body + L('M22 22L78 78', RD, 9));
ban('fumar', 'Prohibit fumar', 'fumar', R(18, 52, 50, 10, K, 0, 0) + R(68, 52, 10, 10, '#999', 0, 0) + L('M72 46q4-8 0-14', K, 3));
ban('ascensor', 'No usar l\'ascensor en cas d\'incendi', 'ascensor incendi', R(32, 22, 36, 56, '#fff', 3, 3) + P('M42 38L50 28L58 38Z', K) + P('M42 62L50 72L58 62Z', K));
ban('pas', 'Prohibit el pas', 'pas accés', pPerson(K, 50, 6, .9));
ban('foc', 'Prohibit fer foc', 'foc flama', `<path d="M50 20q12 16 12 30a12 12 0 0 1 -24 0q0-8 6-14q2 10 6 10q-4-12 0-26Z" fill="${K}"/>`);
ban('aigua', 'No apagar amb aigua', 'aigua', `<path d="M50 22q16 22 16 34a16 16 0 0 1 -32 0q0-12 16-34Z" fill="${K}"/>`);
ban('mobil', 'Prohibit el mòbil', 'mòbil telèfon', R(38, 20, 24, 60, K, 4, 0) + R(42, 26, 16, 40, '#fff', 0, 0));
ban('menjar', 'Prohibit menjar', 'menjar beure', L('M38 20v60M30 20v18a8 8 0 0 0 16 0V20M62 20q-8 6-8 22h8v38', K, 4));
ban('gossos', 'Prohibit gossos', 'gossos animals', `<path d="M24 60q0-14 16-14h20l8-12h8l-2 14q8 4 8 12v14h-6V64H36v10h-6Z" fill="${K}"/>`);
ban('aparcar', 'Prohibit aparcar', 'aparcar estacionar', T(50, 66, 46, 'P', { w: 800 }));
ban('tocar', 'Prohibit tocar', 'tocar mà', `<path d="M40 74V40a5 5 0 0 1 10 0v-8a5 5 0 0 1 10 0v6a5 5 0 0 1 10 0v26q0 10-10 14H50Q40 78 32 64l-6-10a5 5 0 0 1 8 -4Z" fill="${K}"/>`);
// obligació
const must = (id, name, tags, body) => add('sg-' + id, name, 'obligacio', 'obligació obligatori ' + tags, C(50, 50, 42, BL, 0) + body);
must('casc', 'Casc obligatori', 'casc EPI obra', `<path d="M20 64a30 30 0 0 1 60 0Z" fill="#fff"/><rect x="14" y="62" width="72" height="8" rx="4" fill="#fff"/>`);
must('armilla', 'Armilla obligatòria', 'armilla alta visibilitat', `<path d="M34 20l8 8h16l8-8 14 10v48H20V30Z" fill="#fff"/>` + L('M20 54h60', BL, 4));
must('auditiu', 'Protecció auditiva', 'protecció auditiva soroll', L('M24 60V46a26 26 0 0 1 52 0v14', '#fff', 6) + R(16, 54, 16, 24, '#fff', 6, 0) + R(68, 54, 16, 24, '#fff', 6, 0));
must('ulleres', 'Protecció ocular', 'ulleres protecció ocular', R(14, 40, 30, 22, '#fff', 10, 0) + R(56, 40, 30, 22, '#fff', 10, 0) + L('M44 48h12', '#fff', 5));
must('guants', 'Guants obligatoris', 'guants protecció mans', `<path d="M36 82V44a5 5 0 0 1 10 0V30a5 5 0 0 1 10 0v4a5 5 0 0 1 10 0v34q0 14-14 14Z" fill="#fff"/>`);
must('calcat', 'Calçat de seguretat', 'calçat botes', `<path d="M22 70V32h22v24l30 6q6 2 6 8v6H22Z" fill="#fff"/>`);
must('mans', 'Rentar-se les mans', 'rentar mans higiene', L('M30 26h30q10 0 10 10v4', '#fff', 6) + `<path d="M36 82V58a5 5 0 0 1 10 0v-6a5 5 0 0 1 10 0v4a5 5 0 0 1 10 0v12q0 14-14 14Z" fill="#fff"/>`);
must('passamans', 'Utilitzeu el passamà', 'passamà escala', pStairs('#fff') + L('M14 54L86 18', '#fff', 4));
must('mascareta', 'Mascareta obligatòria', 'mascareta protecció respiratòria', `<path d="M24 42q26-10 52 0v20q-26 16-52 0Z" fill="#fff"/>` + L('M24 46L14 40M76 46l10-6', '#fff', 3));
// advertència
const warn = (id, name, tags, body) => add('sg-' + id, name, 'advertencia', 'advertència perill risc ' + tags, `<path d="M50 8L94 86H6Z" fill="${YE}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/>` + body);
warn('electric', 'Risc elèctric', 'elèctric electricitat', `<path d="M56 30L40 58h12L44 78l22-32H54Z" fill="${K}"/>`);
warn('calent', 'Superfície calenta', 'calent temperatura', L('M36 60q6-8 0-16t0-16M50 60q6-8 0-16t0-16M64 60q6-8 0-16t0-16', K, 4) + L('M30 72h40', K, 4));
warn('relliscos', 'Terra relliscós', 'relliscós caiguda', `<circle cx="56" cy="36" r="5" fill="${K}"/>` + L('M54 44l-8 16-12 4M52 52l12 10M30 74h42', K, 5));
warn('caiguda', 'Risc de caiguda', 'caiguda desnivell', `<circle cx="40" cy="40" r="5" fill="${K}"/>` + L('M40 48l4 14 10 4M40 54l-10 6M24 74h22v-8h26', K, 5));
warn('gas', 'Risc de gas', 'gas inflamable', `<path d="M50 30q12 14 12 28a12 12 0 0 1 -24 0q0-8 6-14q2 10 6 10q-4-12 0-24Z" fill="${K}"/>`);
warn('cap', 'Cops al cap', 'cop cap alçada lliure', L('M24 42h52', K, 6) + `<circle cx="50" cy="60" r="7" fill="${K}"/>` + L('M50 68v12', K, 6));
warn('carretons', 'Carretons elevadors', 'carretó elevador toro', `<path d="M30 74V44h22l8 14v16Z" fill="${K}"/><circle cx="36" cy="76" r="5" fill="${K}"/><circle cx="56" cy="76" r="5" fill="${K}"/>` + L('M62 40v36h12', K, 4));
warn('general', 'Perill general', 'perill atenció', R(46, 34, 8, 28, K, 2, 0) + C(50, 72, 5, K, 0));
warn('laser', 'Raig làser', 'làser', C(42, 60, 6, K, 0) + L('M42 60h34M42 60l-8-8M42 60l-8 8M42 60v-12', K, 3));
warn('obra', 'Obres', 'obres construcció', `<circle cx="44" cy="40" r="5" fill="${K}"/>` + L('M44 48l-4 18M40 66l-6 10M40 66l10 10M42 54l14 6M30 76h30', K, 4) + `<path d="M58 58l12 18H52Z" fill="${K}"/>`);
// orientació i serveis (blau)
const info = (id, name, tags, body, bg = BL) => add('sg-' + id, name, 'orientacio', 'senyalètica orientació ' + tags, sq(bg, body));
info('wc', 'Lavabos', 'lavabo WC serveis', pPerson('#fff', 32, 10, .9) + `<g transform="translate(68 10) scale(.9)" fill="#fff"><circle cx="0" cy="22" r="8"/><path d="M-6 34h12l10 30H8v24H-8V64h-8Z"/></g>` + L('M50 18v66', '#fff', 3));
info('wc-h', 'Lavabo homes', 'lavabo homes WC', pPerson('#fff', 50, 6, 1));
info('wc-d', 'Lavabo dones', 'lavabo dones WC', `<g transform="translate(50 6)" fill="#fff"><circle cx="0" cy="22" r="8"/><path d="M-7 34h14l12 32H9v22H-9V66h-12Z"/></g>`);
info('wc-inclusiu', 'Lavabo inclusiu', 'lavabo inclusiu tothom', pPerson('#fff', 24, 14, .7) + `<g transform="translate(50 14) scale(.7)" fill="#fff"><circle cx="0" cy="22" r="8"/><path d="M-7 34h14l12 32H9v22H-9V66h-12Z"/></g>` + `<g transform="translate(66 22) scale(.55)">${pWheel('#fff')}</g>`);
info('wc-adapt', 'Lavabo adaptat', 'lavabo adaptat accessible', pWheel('#fff'));
info('canviador', 'Canviador de nadons', 'canviador nadons', `<rect x="18" y="58" width="64" height="8" fill="#fff"/><circle cx="30" cy="48" r="7" fill="#fff"/><path d="M38 44h34l6 12H38Z" fill="#fff"/>`);
info('ascensor-info', 'Ascensor', 'ascensor', `<rect x="26" y="14" width="48" height="72" rx="4" fill="none" stroke="#fff" stroke-width="5"/>` + `<path d="M40 34l10-12 10 12ZM40 66l10 12 10-12Z" fill="#fff"/>` + pPerson('#fff', 50, 26, .45));
info('escales', 'Escales', 'escales', pStairs('#fff'));
info('rampa', 'Rampa', 'rampa', L('M14 80L86 40V80Z', '#fff', 5));
info('recepcio', 'Recepció', 'recepció', `<rect x="14" y="58" width="72" height="22" fill="#fff"/>` + pPerson('#fff', 50, 2, .6) + `<circle cx="70" cy="52" r="5" fill="#fff"/>`);
info('info', 'Informació', 'informació punt', `<circle cx="50" cy="26" r="7" fill="#fff"/><path d="M40 40h16v34h6v8H38v-8h6V48h-4Z" fill="#fff"/>`);
info('parking', 'Aparcament', 'aparcament pàrquing', T(50, 74, 60, 'P', { c: '#fff', w: 800 }));
info('bicis', 'Aparcament de bicicletes', 'bicicletes aparcament', `<g fill="none" stroke="#fff" stroke-width="5"><circle cx="28" cy="62" r="14"/><circle cx="72" cy="62" r="14"/><path d="M28 62l14-26h24l6 26M42 36l8 26h-22M66 36L50 62M36 30h10"/></g>`);
info('cafeteria', 'Cafeteria', 'cafeteria bar', `<path d="M22 40h46v18a18 18 0 0 1 -18 18H40a18 18 0 0 1 -18 -18Z" fill="#fff"/>` + L('M68 46h6a8 8 0 0 1 0 16h-6M36 16q-4 6 0 12M50 16q-4 6 0 12', '#fff', 4));
info('reunions', 'Sala de reunions', 'sala reunions', `<ellipse cx="50" cy="62" rx="30" ry="10" fill="#fff"/>` + pPerson('#fff', 22, 4, .5) + pPerson('#fff', 50, 0, .5) + pPerson('#fff', 78, 4, .5));
info('aula', 'Aula', 'aula classe', `<rect x="14" y="16" width="72" height="40" fill="none" stroke="#fff" stroke-width="5"/>` + pPerson('#fff', 32, 40, .5) + pPerson('#fff', 66, 40, .5));
info('biblioteca', 'Biblioteca', 'biblioteca llibres', `<path d="M50 30Q34 20 14 22v54q20-2 36 8ZM50 30q16-10 36-8v54q-20-2-36 8Z" fill="#fff"/>` + L('M50 30v54', BL, 3));
info('vestidor', 'Vestidors', 'vestidor', L('M50 30a8 8 0 1 1 8 8l-8 6 32 18H18l32-18', '#fff', 5));
info('telefon', 'Telèfon', 'telèfon', `<path d="M26 18h14l6 16-8 6q6 14 20 20l6-8 16 6v14a6 6 0 0 1 -6 6Q20 76 20 24a6 6 0 0 1 6 -6Z" fill="#fff"/>`);
info('wifi', 'Wi-Fi', 'wifi internet', `<circle cx="50" cy="72" r="6" fill="#fff"/>` + L('M30 56a28 28 0 0 1 40 0M18 44a44 44 0 0 1 64 0M8 30a58 58 0 0 1 84 0', '#fff', 5));
info('recarrega', 'Recàrrega de vehicles', 'recàrrega vehicle elèctric', `<path d="M56 16L30 54h18L40 84l30-42H52Z" fill="#fff"/>`);
info('fumadors', 'Zona de fumadors', 'fumadors', `<rect x="14" y="54" width="56" height="10" fill="#fff"/><rect x="72" y="54" width="10" height="10" fill="#ddd"/>` + L('M76 46q4-8 0-14', '#fff', 3));
info('direccio', 'Direcció', 'fletxa direcció', pArrow('#fff'));
info('direccio-esq', 'Direcció esquerra', 'fletxa direcció esquerra', pArrow('#fff', 180));
info('direccio-amunt', 'Direcció amunt', 'fletxa direcció amunt', pArrow('#fff', -90));
info('farmacia', 'Farmàcia', 'farmàcia', pCross('#fff'), GR);
info('consergeria', 'Consergeria', 'consergeria', `<path d="M20 70a30 30 0 0 1 60 0Z" fill="#fff"/><rect x="14" y="70" width="72" height="8" fill="#fff"/><circle cx="50" cy="34" r="4" fill="#fff"/>`);
info('magatzem', 'Magatzem', 'magatzem', `<path d="M14 40L50 20l36 20v44H14Z" fill="#fff"/><rect x="30" y="52" width="40" height="32" fill="${BL}"/>`);
info('sala-tecnica', 'Sala tècnica', 'sala tècnica instal·lacions', `<g transform="translate(0 0)">${P('M44 14h12l2 10 7 3 8-6 8 8-6 8 3 7 10 2v12l-10 2-3 7 6 8-8 8-8-6-7 3-2 10H44l-2-10-7-3-8 6-8-8 6-8-3-7-10-2V44l10-2 3-7-6-8 8-8 8 6 7-3Z', '#fff', 0)}</g>` + C(50, 50, 10, BL, 0));
// plantes i numeració
for (const pl of ['-2', '-1', '0', '1', '2', '3', '4', '5']) add('sg-planta' + pl, 'Planta ' + pl, 'retolacio', 'planta número retolació ' + pl, R(10, 10, 80, 80, '#1d2533', 8, 0) + T(50, 70, pl.length > 1 ? 40 : 50, pl === '0' ? 'PB' : pl, { c: '#fff', w: 700 }).replace('font-size="50"', `font-size="${pl === '0' ? 40 : 50}"`));
for (const n of ['101', '102', '201', 'A1']) add('sg-porta-' + n, 'Rètol de porta ' + n, 'retolacio', 'rètol porta número habitació', R(14, 22, 72, 56, '#fff', 6, 2.4) + T(50, 60, 24, n, { w: 700 }));
add('sg-directori', 'Directori de plantes', 'retolacio', 'directori edifici plantes', R(10, 6, 80, 88, '#1d2533', 4, 0) + [['3', 'Oficines'], ['2', 'Sales'], ['1', 'Aules'], ['0', 'Recepció']].map(([n, t], i) => T(22, 30 + i * 18, 12, n, { c: '#ffd23f', w: 700 }) + T(32, 30 + i * 18, 10, t, { c: '#fff', a: 'start', w: 500 })).join(''));
add('sg-placa', 'Placa identificativa', 'retolacio', 'placa rètol nom', R(6, 30, 88, 40, '#f2f2f2', 4, 2) + T(50, 50, 11, 'Nom de l\'espai', { w: 700 }) + T(50, 62, 8, 'Descripció', { w: 400 }));
add('sg-braille', 'Rètol amb Braille', 'retolacio', 'braille accessible tàctil', R(14, 18, 72, 64, '#fff', 6, 2.4) + T(50, 46, 16, 'AULA 3', { w: 700 }) + [0, 1, 2, 3, 4, 5].map(i => D(30 + (i % 3) * 6 + Math.floor(i / 3) * 24, 62 + (i % 2) * 6, 1.8)).join(''));
// accessibilitat
add('ac-sia', 'Símbol d\'accessibilitat', 'accessibilitat', 'SIA accessibilitat cadira rodes', sq(BL, pWheel('#fff')));
add('ac-itinerari', 'Itinerari accessible', 'accessibilitat', 'itinerari accessible', sq(BL, `<g transform="translate(-14 0) scale(.85)">${pWheel('#fff')}</g>` + `<g transform="translate(46 26) scale(.48)">${pArrow('#fff')}</g>`));
add('ac-bucle', 'Bucle magnètic', 'accessibilitat', 'bucle magnètic audició', sq(BL, `<path d="M36 70q-14-6-14-24a26 26 0 0 1 52 0q0 12-10 18-6 4-6 12a8 8 0 0 1 -14 4" fill="none" stroke="#fff" stroke-width="5"/>` + T(70, 82, 16, 'T', { c: '#fff', w: 800 })));
add('ac-plaça', 'Plaça reservada', 'accessibilitat', 'plaça reservada aparcament accessible', R(8, 8, 84, 84, '#fff', 0, 3) + `<g transform="translate(20 20) scale(.6)">${sq(BL, pWheel('#fff'))}</g>` + L('M8 92V8', '#ffd23f', 4) + L('M92 92V8', '#ffd23f', 4));
add('ac-cecs', 'Persones cegues', 'accessibilitat', 'persones cegues bastó', sq(BL, pPerson('#fff', 44, 6, .9) + L('M54 46L80 86', '#fff', 3)));
add('ac-sords', 'Persones sordes', 'accessibilitat', 'persones sordes llengua signes', sq(BL, `<path d="M40 74q-14-6-14-24a24 24 0 0 1 48 0q0 10-8 16" fill="none" stroke="#fff" stroke-width="5"/>` + L('M20 80L80 20', '#fff', 5)));
add('ac-paviment', 'Paviment podotàctil', 'accessibilitat', 'paviment podotàctil botons', R(10, 10, 80, 80, '#ffd23f', 0, 0) + Array.from({ length: 25 }, (_, i) => D(18 + (i % 5) * 16, 18 + Math.floor(i / 5) * 16, 4, '#d9a900')).join(''));

/* ════ 6. MOBILIARI I ELEMENTS DE PLANTA ════ */
const M = 'mobiliari';
const door = (id, name, w, swing) => add('pl-' + id, name, M, 'porta planta fusteria ' + name.toLowerCase(), L('M4 90H22M78 90H96', K, 5) + swing);
door('porta-simple', 'Porta simple', 0, L('M22 90V14') + L('M22 14A76 76 0 0 1 78 90', K, 1.4, DASH('5 4')) + L('M22 90V14', K, 3));
door('porta-esq', 'Porta simple (esquerra)', 0, L('M78 90V14', K, 3) + L('M78 14A76 76 0 0 0 22 90', K, 1.4, DASH('5 4')));
door('porta-doble', 'Porta doble', 0, L('M22 90V62M78 90V62', K, 3) + L('M22 62A28 28 0 0 1 50 90M78 62A28 28 0 0 0 50 90', K, 1.4, DASH('5 4')));
door('porta-corredissa', 'Porta corredissa', 0, L('M22 84H60', K, 4) + L('M40 92H78', K, 1.4, DASH('4 3')) + P('M66 84l6-4v8Z', K));
door('porta-galeria', 'Porta d\'encastar', 0, R(22, 82, 56, 6, '#ddd', 0, 1.6) + L('M22 86H52', K, 3));
door('porta-plegable', 'Porta plegable', 0, L('M22 90L36 70L50 90L64 70L78 90', K, 2.4));
door('porta-giratoria', 'Porta giratòria', 0, C(50, 60, 28, 'none', 1.4) + L('M50 32V88M22 60H78', K, 3));
door('porta-vaiven', 'Porta de vaivé', 0, L('M22 90V40', K, 3) + L('M22 40A50 50 0 0 1 72 90M22 140A50 50 0 0 0 72 90', K, 1.4, DASH('5 4')));
door('porta-garatge', 'Porta de garatge', 0, L('M22 90H78', K, 1.6, DASH('6 4')) + L('M22 76H78', K, 4));
const win = (id, name, body) => add('pl-' + id, name, M, 'finestra planta fusteria ' + name.toLowerCase(), R(4, 40, 92, 20, '#fff', 0, 2) + body);
win('finestra', 'Finestra', L('M4 50H96', K, 1.6) + L('M30 40v20M70 40v20', K, 1.4));
win('finestra-batent', 'Finestra batent', L('M4 50H96', K, 1.6) + L('M20 50A30 30 0 0 0 50 20M80 50A30 30 0 0 1 50 20', K, 1.4, DASH('4 3')));
win('finestra-corredissa', 'Finestra corredissa', L('M10 46H56M44 54H90', K, 3));
win('finestral', 'Finestral', L('M4 50H96', K, 1.6) + L('M50 40v20', K, 1.6));
win('mur-cortina', 'Mur cortina', L('M4 50H96', K, 1) + L('M20 40v20M36 40v20M52 40v20M68 40v20M84 40v20', K, 2.4));
add('pl-claraboia', 'Claraboia', M, 'claraboia llum zenital', R(20, 20, 60, 60) + L('M20 20l60 60M80 20L20 80', K, 1.4, DASH('5 4')));
add('pl-escala-recta', 'Escala recta', M, 'escala recta planta', R(30, 4, 40, 92) + Array.from({ length: 10 }, (_, i) => L(`M30 ${14 + i * 8}H70`, K, 1.4)).join('') + L('M50 92V14M42 22l8-8 8 8', K, 2));
add('pl-escala-l', 'Escala en L', M, 'escala L replà planta', P('M10 90V50H50V10H90V90Z') + Array.from({ length: 5 }, (_, i) => L(`M10 ${58 + i * 8}H50`, K, 1.4) + L(`M${58 + i * 8} 10V50`, K, 1.4)).join(''));
add('pl-escala-u', 'Escala en U', M, 'escala U replà ida tornada', R(10, 10, 80, 80) + L('M50 34V90', K, 2) + Array.from({ length: 7 }, (_, i) => L(`M10 ${42 + i * 7}H50M50 ${42 + i * 7}H90`, K, 1.2)).join(''));
add('pl-escala-cargol', 'Escala de cargol', M, 'escala cargol helicoïdal', C(50, 50, 40) + C(50, 50, 6) + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return L(`M${50 + Math.cos(a) * 6} ${50 + Math.sin(a) * 6}L${50 + Math.cos(a) * 40} ${50 + Math.sin(a) * 40}`, K, 1.2); }).join(''));
add('pl-rampa', 'Rampa (planta)', M, 'rampa planta accessible', R(20, 6, 60, 88) + L('M50 86V18M42 26l8-8 8 8', K, 2) + T(50, 56, 10, '8 %', { w: 500 }).replace('y="56"', 'y="56" transform="rotate(-90 64 56)"'));
add('pl-pilar-q', 'Pilar quadrat', M, 'pilar estructura', R(32, 32, 36, 36, K));
add('pl-pilar-c', 'Pilar circular', M, 'pilar circular estructura', C(50, 50, 18, K));
add('pl-pilar-hea', 'Pilar metàl·lic', M, 'pilar HEB metàl·lic', `<path d="M28 28h44v8H54v28h18v8H28v-8h18V36H28Z" fill="${K}"/>`);
add('pl-mur', 'Mur', M, 'mur paret', R(4, 38, 92, 24, '#ddd', 0, 2) + L('M4 38l24 24M24 38l24 24M44 38l24 24M64 38l24 24M84 38l12 12', K, 1));
add('pl-envà', 'Envà', M, 'envà partició', R(4, 44, 92, 12, '#fff', 0, 2));
// sanitaris i cuina
add('pl-wc', 'Inodor', M, 'inodor wc vàter', R(30, 6, 40, 18, '#fff', 4) + `<ellipse cx="50" cy="56" rx="20" ry="28" ${ST()}/>`);
add('pl-lavabo', 'Lavabo', M, 'lavabo pica bany', R(16, 20, 68, 52, '#fff', 8) + `<ellipse cx="50" cy="48" rx="22" ry="16" ${ST()}/>` + D(50, 28, 3));
add('pl-dutxa', 'Plat de dutxa', M, 'dutxa plat', R(12, 12, 76, 76) + L('M12 12l76 76M88 12L12 88', K, 1.2) + C(50, 50, 5));
add('pl-banyera', 'Banyera', M, 'banyera bany', R(6, 24, 88, 52, '#fff', 4) + R(14, 30, 72, 40, 'none', 18, 1.8) + D(24, 50, 3));
add('pl-bide', 'Bidet', M, 'bidet bany', `<ellipse cx="50" cy="56" rx="18" ry="26" ${ST()}/>` + R(34, 16, 32, 12, '#fff', 3));
add('pl-urinari', 'Urinari', M, 'urinari bany', R(30, 20, 40, 10) + `<path d="M32 30h36v22a18 18 0 0 1 -36 0Z" ${ST()}/>`);
add('pl-pica-cuina', 'Pica de cuina', M, 'pica aigüera cuina', R(4, 22, 92, 56) + R(12, 30, 34, 40, 'none', 4, 1.8) + R(54, 30, 34, 40, 'none', 4, 1.8));
add('pl-placa', 'Placa de cocció', M, 'placa cocció vitroceràmica inducció', R(10, 10, 80, 80) + [[30, 30, 12], [70, 30, 9], [30, 70, 9], [70, 70, 12]].map(([x, y, r]) => C(x, y, r, 'none', 1.8)).join(''));
add('pl-nevera', 'Nevera', M, 'nevera frigorífic', R(16, 10, 68, 80) + L('M16 22H84') + T(50, 62, 14, 'NEV', { w: 600 }));
add('pl-rentadora', 'Rentadora', M, 'rentadora electrodomèstic', R(14, 14, 72, 72) + C(50, 54, 22, 'none', 2));
add('pl-rentaplats', 'Rentaplats', M, 'rentaplats', R(14, 14, 72, 72) + T(50, 58, 14, 'RV', { w: 600 }));
add('pl-forn', 'Forn', M, 'forn', R(14, 14, 72, 72) + R(24, 32, 52, 40, 'none', 2, 1.8) + L('M24 24h52', K, 1.8));
add('pl-cuina-lineal', 'Cuina lineal', M, 'cuina mobles', R(4, 30, 92, 40) + L('M28 30v40M52 30v40M76 30v40', K, 1.4) + C(40, 50, 6, 'none', 1.6) + R(56, 38, 16, 24, 'none', 3, 1.6));
// mobiliari
add('pl-llit-doble', 'Llit doble', M, 'llit doble dormitori', R(14, 6, 72, 88, '#fff', 3) + R(20, 12, 28, 16, '#fff', 4, 1.8) + R(52, 12, 28, 16, '#fff', 4, 1.8) + L('M14 36H86M14 36l20 20', K, 1.6));
add('pl-llit-ind', 'Llit individual', M, 'llit individual', R(28, 6, 44, 88, '#fff', 3) + R(34, 12, 32, 16, '#fff', 4, 1.8) + L('M28 36H72', K, 1.6));
add('pl-tauleta', 'Tauleta de nit', M, 'tauleta nit', R(28, 28, 44, 44) + C(50, 50, 8, 'none', 1.6));
add('pl-armari', 'Armari', M, 'armari roba', R(6, 30, 88, 40) + L('M6 70L50 30M50 70L94 30', K, 1.2) + L('M50 30v40', K, 1.6));
add('pl-sofa', 'Sofà', M, 'sofà sala estar', R(6, 26, 88, 48, '#fff', 6) + R(14, 26, 72, 12, 'none', 3, 1.6) + R(6, 26, 10, 48, 'none', 4, 1.6) + R(84, 26, 10, 48, 'none', 4, 1.6) + L('M38 38v36M62 38v36', K, 1.4));
add('pl-butaca', 'Butaca', M, 'butaca seient', R(20, 20, 60, 60, '#fff', 8) + R(20, 20, 60, 14, 'none', 6, 1.6));
add('pl-taula-menjador', 'Taula de menjador', M, 'taula menjador cadires', R(24, 22, 52, 56) + [[30, 10], [58, 10], [30, 80], [58, 80]].map(([x, y]) => R(x, y, 12, 10, '#fff', 2, 1.8)).join('') + R(10, 42, 10, 16, '#fff', 2, 1.8) + R(80, 42, 10, 16, '#fff', 2, 1.8));
add('pl-taula-rodona', 'Taula rodona', M, 'taula rodona', C(50, 50, 22) + [0, 72, 144, 216, 288].map(a => { const r = a * Math.PI / 180; return C(50 + Math.cos(r) * 34, 50 + Math.sin(r) * 34, 7, '#fff', 1.8); }).join(''));
add('pl-escriptori', 'Escriptori', M, 'escriptori oficina', R(10, 20, 80, 40) + R(36, 64, 28, 24, '#fff', 8, 1.8) + R(30, 26, 26, 6, 'none', 1, 1.4));
add('pl-escriptori-l', 'Escriptori en L', M, 'escriptori L oficina', P('M10 14h80v36H46v36H10Z') + R(52, 58, 24, 22, '#fff', 8, 1.8));
add('pl-puesto', 'Llocs de treball', M, 'llocs treball oficina open space', R(8, 30, 84, 40) + L('M50 30v40M8 50h84', K, 1.4) + [[20, 18], [62, 18], [20, 74], [62, 74]].map(([x, y]) => R(x, y, 18, 10, '#fff', 4, 1.6)).join(''));
add('pl-taula-reunio', 'Taula de reunions', M, 'taula reunions', R(18, 30, 64, 40, '#fff', 20) + [26, 42, 58, 74].map(x => R(x - 6, 16, 12, 10, '#fff', 3, 1.6) + R(x - 6, 74, 12, 10, '#fff', 3, 1.6)).join(''));
add('pl-cadira', 'Cadira', M, 'cadira', R(30, 30, 40, 40, '#fff', 4) + R(30, 30, 40, 10, K, 3, 0));
add('pl-pupitre', 'Pupitre', M, 'pupitre escola aula', R(20, 24, 60, 30) + R(36, 60, 28, 20, '#fff', 4, 1.8));
add('pl-pissarra', 'Pissarra', M, 'pissarra aula', R(6, 42, 88, 10, K, 0, 0));
add('pl-prestatge', 'Prestatgeria', M, 'prestatgeria llibreria', R(6, 38, 88, 24) + L('M6 38l22 24M28 38l22 24M50 38l22 24M72 38l22 24', K, 1));
add('pl-piano', 'Piano', M, 'piano', P('M10 30h60q20 0 20 20v20H10Z') + L('M10 58h80', K, 1.6));
// vehicles i entorn
add('pl-cotxe', 'Cotxe (planta)', M, 'cotxe vehicle planta aparcament', R(28, 4, 44, 92, '#fff', 14) + R(34, 24, 32, 16, '#e6eef8', 4, 1.8) + R(34, 62, 32, 12, '#e6eef8', 3, 1.8));
add('pl-placa-park', 'Plaça d\'aparcament', M, 'plaça aparcament', L('M20 4V96M80 4V96', K, 2) + L('M20 96H80', K, 1.4, DASH('5 4')) + T(50, 56, 20, 'P', { w: 700 }));
add('pl-moto', 'Moto (planta)', M, 'moto vehicle', R(42, 10, 16, 80, '#fff', 8) + L('M30 26h40', K, 3));
add('pl-arbre', 'Arbre (planta)', M, 'arbre planta vegetació', C(50, 50, 40, '#eef7ea', 1.8) + L('M50 10q6 20 0 40t0 40M10 50q20-6 40 0t40 0', K, 1) + D(50, 50, 3));
add('pl-arbre2', 'Arbre (planta, contorn)', M, 'arbre planta', L('M50 10q16 0 22 10q14 4 14 18q8 12 0 24q-2 14-16 16q-8 12-20 8q-14 6-22-6q-14-2-16-16q-8-12 0-24q0-14 14-18q8-12 24-12Z', K, 1.8) + D(50, 50, 3));
add('pl-arbre-alcat', 'Arbre (alçat)', M, 'arbre alçat vegetació', C(50, 38, 30, '#eef7ea', 1.8) + L('M50 68V96M50 80l-10-8M50 76l10-8', K, 2));
add('pl-arbust', 'Arbust', M, 'arbust vegetació', L('M24 60q-12-14 4-22q2-16 20-12q12-10 22 2q16 0 12 18q10 14-6 18q-10 10-22 4q-16 6-24-6Z', K, 1.6));
add('pl-persona-planta', 'Persona (planta)', M, 'persona planta escala humana', `<ellipse cx="50" cy="50" rx="30" ry="16" ${ST()}/>` + C(50, 50, 10));
add('pl-persona-alcat', 'Persona (alçat)', M, 'persona alçat escala humana silueta', `<g fill="${K}"><circle cx="50" cy="14" r="8"/><path d="M38 26h24l4 32h-6l-2 38h-8l-2-24-2 24h-8l-2-38h-6Z"/></g>`);
add('pl-persona-camina', 'Persona caminant (alçat)', M, 'persona caminant silueta escala', `<g fill="${K}"><circle cx="52" cy="12" r="8"/></g>` + L('M50 24l-4 28M46 52l-10 20-4 22M46 52l10 18 6 24M48 30l-14 16M48 30l14 14', K, 6));
add('pl-persona-cadira', 'Persona en cadira de rodes', M, 'cadira rodes accessible escala', pWheel(K));

/* ════ 7. ESTRUCTURA I CONSTRUCCIÓ ════ */
add('es-biga', 'Biga', 'estructura', 'biga estructura', R(4, 40, 92, 20, '#eee') + L('M4 40l20 20M24 40l20 20M44 40l20 20M64 40l20 20', K, 1));
add('es-encastament', 'Encastament', 'estructura', 'encastament suport', L('M20 20V80', K, 4) + L('M20 28l-12 8M20 40l-12 8M20 52l-12 8M20 64l-12 8M20 76l-12 8', K, 1.6) + L('M20 50H90', K, 3));
add('es-recolzament', 'Recolzament articulat', 'estructura', 'suport articulat', P('M50 40L30 72H70Z') + L('M20 80H80', K, 2) + L('M26 80l-6 8M38 80l-6 8M50 80l-6 8M62 80l-6 8M74 80l-6 8', K, 1.4) + C(50, 40, 4, K));
add('es-recolzament-mov', 'Recolzament mòbil', 'estructura', 'suport lliscant', P('M50 34L30 62H70Z') + C(38, 70, 6) + C(62, 70, 6) + L('M20 80H80', K, 2));
add('es-carrega', 'Càrrega puntual', 'estructura', 'càrrega força', L('M50 10V76', K, 3) + P('M50 90L40 72H60Z', K) + T(64, 30, 12, 'P', { a: 'start' }));
add('es-carrega-rep', 'Càrrega repartida', 'estructura', 'càrrega repartida uniforme', L('M10 20H90') + [14, 30, 46, 62, 78].map(x => L(`M${x + 4} 20V60`, K, 2) + P(`M${x + 4} 70L${x} 60H${x + 8}Z`, K)).join('') + T(50, 14, 12, 'q'));
add('es-moment', 'Moment', 'estructura', 'moment flector', L('M74 30A32 32 0 1 0 74 70', K, 3) + P('M80 76L64 74L72 62Z', K) + T(50, 56, 14, 'M'));
add('es-armadura', 'Armadura', 'estructura', 'armadura barra corrugada', L('M6 50H94', K, 4) + Array.from({ length: 11 }, (_, i) => L(`M${10 + i * 8} 44l4 12`, K, 1.4)).join(''));
add('es-perfil-ipe', 'Perfil IPE', 'estructura', 'perfil IPE acer', `<path d="M24 14h52v8H54v56h22v8H24v-8h22V22H24Z" fill="#dfe4ea" stroke="${K}" stroke-width="2"/>`);
add('es-perfil-tub', 'Perfil tubular', 'estructura', 'perfil tub quadrat', R(24, 24, 52, 52, '#dfe4ea', 2) + R(32, 32, 36, 36, '#fff', 1, 2));
add('es-sabata', 'Sabata', 'estructura', 'sabata fonamentació', R(14, 62, 72, 24, '#eee') + R(40, 14, 20, 48, '#eee') + L('M4 62H96', K, 1.4, DASH('6 4')));
add('es-pilotatge', 'Pilotatge', 'estructura', 'pilot fonament profund', R(20, 14, 60, 20, '#eee') + R(28, 34, 12, 56, '#eee') + R(60, 34, 12, 56, '#eee'));
add('es-junta', 'Junta de dilatació', 'estructura', 'junta dilatació', R(4, 30, 42, 40, '#eee') + R(54, 30, 42, 40, '#eee') + L('M50 22V78', K, 1.4, DASH('4 3')));
add('es-forjat', 'Forjat unidireccional', 'estructura', 'forjat biguetes revoltó', R(4, 30, 92, 12, '#eee') + [12, 36, 60, 84].map(x => P(`M${x - 6} 42h12v20h-12Z`, '#bbb', 2)).join('') + L('M18 52h12M42 52h12M66 52h12', K, 1.6, DASH('3 3')));

/* ════ 8. TOPOGRAFIA I URBANISME ════ */
add('to-corba', 'Corba de nivell', 'topografia', 'corba nivell topografia', L('M6 70q20-30 44-10t44-20', '#8a5a3b', 2) + L('M6 82q20-30 44-10t44-20', '#8a5a3b', 1.2) + L('M6 58q20-30 44-10t44-20', '#8a5a3b', 1.2) + T(60, 50, 10, '120', { c: '#8a5a3b', w: 500 }));
add('to-cota', 'Punt de cota', 'topografia', 'punt cota topogràfica', L('M44 50h12M50 44v12', K, 2) + T(56, 42, 12, '124,35', { a: 'start', w: 500 }));
add('to-vertex', 'Vèrtex geodèsic', 'topografia', 'vèrtex geodèsic', P('M50 20L80 76H20Z') + D(50, 58, 4));
add('to-fita', 'Fita de parcel·la', 'topografia', 'fita parcel·la límit', C(50, 50, 12) + L('M38 50H62M50 38V62', K, 1.6));
add('to-talus', 'Talús', 'topografia', 'talús desmunt terraplè', L('M6 30H94', K, 2) + Array.from({ length: 12 }, (_, i) => L(`M${10 + i * 7.5} 30v${i % 2 ? 14 : 26}`, K, 1.4)).join(''));
add('to-mur-cont', 'Mur de contenció', 'topografia', 'mur contenció', L('M6 50H94', K, 4) + Array.from({ length: 12 }, (_, i) => L(`M${10 + i * 7.5} 50l-5 10`, K, 1.4)).join(''));
add('to-tanca', 'Tanca', 'topografia', 'tanca tancat límit', L('M6 50H94', K, 2) + Array.from({ length: 9 }, (_, i) => L(`M${10 + i * 10} 44l6 12`, K, 2)).join(''));
add('to-pas-zebra', 'Pas de vianants', 'topografia', 'pas zebra vianants', Array.from({ length: 6 }, (_, i) => R(10 + i * 14, 20, 8, 60, K, 0, 0)).join(''));
add('to-carril-bici', 'Carril bici', 'topografia', 'carril bici', L('M6 30H94M6 70H94', '#1e8a44', 3) + `<g transform="translate(30 32) scale(.36)" fill="none" stroke="#1e8a44" stroke-width="10"><circle cx="28" cy="62" r="18"/><circle cx="96" cy="62" r="18"/><path d="M28 62l18-34h32l18 34M46 28l12 34"/></g>`);
add('to-parada-bus', 'Parada d\'autobús', 'topografia', 'parada bus transport', C(50, 50, 30, BL, 0) + T(50, 60, 26, 'BUS', { c: '#fff', w: 800 }).replace('font-size="26"', 'font-size="20"'));
add('to-metro', 'Metro', 'topografia', 'metro transport públic', R(20, 20, 60, 60, '#d62828', 10, 0) + T(50, 66, 40, 'M', { c: '#fff', w: 800 }));
add('to-contenidor', 'Contenidors', 'topografia', 'contenidors reciclatge residus', ['#f5c400', '#1f5fbf', '#1e8a44', '#777'].map((c, i) => R(8 + i * 22, 36, 18, 40, c, 3, 1.6)).join(''));
add('to-banc', 'Banc', 'topografia', 'banc mobiliari urbà', R(10, 40, 80, 20, '#fff', 3) + L('M10 50H90', K, 1.4));
add('to-font', 'Font', 'topografia', 'font aigua potable', C(50, 50, 20) + P('M50 36q8 10 6 16a6 6 0 0 1 -12 0q-2-6 6-16Z', AG, 1));
add('to-fanal', 'Fanal (planta)', 'topografia', 'fanal enllumenat planta', C(50, 50, 10, '#fff') + L('M30 50H70M50 30V70', K, 1.4) + C(50, 50, 22, 'none', 1, '#e8a200'));
add('to-escocell', 'Escocell', 'topografia', 'escocell arbre', R(26, 26, 48, 48) + C(50, 50, 8, '#eef7ea'));

export const SYMBOLS = S;
export const SYM_CATS = {
  anotacio: 'Anotació de plànols', llegendes: 'Llegendes, trames i capes',
  electricitat: 'Electricitat', illuminacio: 'Il·luminació', aigua: 'Fontaneria', sanejament: 'Sanejament', gas: 'Gas', clima: 'Climatització i ventilació', elevacio: 'Elevació i mecàniques', renovables: 'Energies renovables', telecom: 'Telecomunicacions i seguretat',
  incendis: 'Protecció contra incendis', evacuacio: 'Senyals d\'evacuació', prohibicio: 'Senyals de prohibició', obligacio: 'Senyals d\'obligació', advertencia: 'Senyals d\'advertència', orientacio: 'Orientació i serveis', retolacio: 'Retolació', accessibilitat: 'Accessibilitat',
  mobiliari: 'Mobiliari i elements de planta', estructura: 'Estructura', topografia: 'Topografia i urbanisme',
};
