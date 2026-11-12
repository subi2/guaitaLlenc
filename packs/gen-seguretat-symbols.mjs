// Símbols originals del paquet Seguretat, policia i investigació (100×100)
// Copyright (C) 2026 SBS BiM Consulting, Jordi Subirós — AGPL-3.0-only
// Formes genèriques de seguretat ciutadana, vigilància i investigació.
// No reprodueixen escuts, logotips, distintius ni llibreries de cossos policials reals,
// ni personatges de ficció ni les seves marques.
const K = '#111111', W = 2.6, BL = '#1f5fbf', YE = '#f5c400', RD = '#d62828', GR = '#1e8a44', GY = '#888888';
const ST = (f = '#fff', sw = W, col = K) => `fill="${f}" stroke="${col}" stroke-width="${sw}"`;
const L = (d, col = K, sw = W, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"${extra}/>`;
const P = (d, f = '#fff', sw = W, col = K) => `<path d="${d}" ${ST(f, sw, col)}/>`;
const C = (cx, cy, r, f = '#fff', sw = W, col = K) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${ST(f, sw, col)}/>`;
const R = (x, y, w, h, f = '#fff', rx = 0, sw = W, col = K) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${ST(f, sw, col)}/>`;
const D = (cx, cy, r, f = K) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`;
const T = (x, y, s, txt, f = K, w = 700) => `<text x="${x}" y="${y}" font-family="IBM Plex Sans, sans-serif" font-size="${s}" font-weight="${w}" text-anchor="middle" fill="${f}">${txt}</text>`;
const DASH = (a = '8 5') => ` stroke-dasharray="${a}"`;
const STRIPES = (x, y, w, h, col = K) => { let s = ''; for (let i = -h; i < w; i += 16) s += `<path d="M${x + i} ${y + h} L${x + i + 8} ${y + h} L${x + i + 8 + h} ${y} L${x + i + h} ${y}Z" fill="${col}"/>`; return s; };
const wrap = b => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const S = [];
const add = (id, name, cat, tags, body) => S.push({ id: 'sg-' + id, name, cat, tags, svg: wrap(body) });

/* ════ 1. POLICIA I SEGURETAT CIUTADANA ════ */
add('escut', 'Escut genèric', 'policia', 'escut seguretat protecció', P('M50 8L86 20V48C86 72 70 86 50 94C30 86 14 72 14 48V20Z', '#fff', 3) + L('M50 14V88', K, 1.4, DASH('3 3')));
add('placa', 'Placa genèrica', 'policia', 'placa identificació insígnia', R(18, 22, 64, 56, '#fff', 14, 3) + C(50, 50, 16, YE, 2.5));
add('gorra', 'Gorra de plat', 'policia', 'gorra uniforme cap', P('M22 60Q50 24 78 60Z', K, 2) + P('M12 60H88Q82 72 50 72Q18 72 12 60Z', K, 2));
add('cinta-perimetre', 'Cinta de perímetre', 'policia', 'cinta perímetre zona tallada', R(4, 38, 92, 24, YE, 0, 2.5) + STRIPES(4, 38, 92, 24, K));
add('emissora', 'Emissora portàtil', 'policia', 'emissora walkie talkie radio comunicació', R(36, 34, 28, 44, '#fff', 5) + R(42, 22, 5, 14, K, 1, 2) + R(38, 42, 20, 12, GY, 2, 1.6) + C(50, 65, 4, K, 1.6));
add('llanterna', 'Llanterna', 'policia', 'llanterna llum focus', R(40, 14, 20, 14, K, 3) + P('M36 28H64L70 84H30Z', '#fff') + C(50, 56, 8, YE, 1.5));
add('sirena', 'Llum giratòria', 'policia', 'sirena llum emergència alarma', P('M28 70A22 22 0 0 1 72 70Z', RD, 2.4) + R(22, 70, 56, 12, K, 3) + L('M50 46V50M30 56L24 50M70 56L76 50', K, 2));
add('patrulla', 'Vehicle patrulla genèric', 'policia', 'cotxe vehicle patrulla emergència', R(14, 50, 72, 22, '#fff', 8) + P('M30 50L42 34H66L78 50Z', '#fff') + R(44, 27, 12, 7, RD, 1, 1.6) + C(32, 74, 7, K) + C(68, 74, 7, K));
add('esposes', 'Esposes', 'policia', 'esposes menottes detenció', C(34, 52, 16, 'none', 3.2) + C(66, 52, 16, 'none', 3.2) + L('M50 52H50', K, 3));
add('cinturo', 'Cinturó tàctic', 'policia', 'cinturó equipament', R(8, 42, 84, 16, K, 6) + R(40, 36, 20, 28, '#fff', 3, 2));
add('pito', 'Xiulet', 'policia', 'xiulet pito alt', P('M18 56H58L86 40V72L58 56H18Z', K, 2) + C(40, 56, 6, 'none', 1.4, '#fff'));
add('con', 'Con de senyalització', 'policia', 'con senyalització tallat carrer', P('M50 14L76 82H24Z', YE, 2.6) + R(16, 82, 68, 8, K, 2) + L('M34 52H66', '#fff', 6));
add('barrera', 'Barrera de tancament', 'policia', 'barrera tancament pas', R(6, 42, 88, 8, '#fff', 2) + STRIPES(6, 42, 88, 8, RD) + L('M14 50V80M86 50V80', K, 3));
add('radar', 'Radar de velocitat', 'policia', 'radar velocitat càmera control', R(30, 24, 40, 52, '#fff', 6) + C(50, 40, 9, K) + L('M42 66H58M50 66V82', K, 2.4) + C(50, 40, 3, RD, 1));
add('bicicleta', 'Bicicleta de patrulla genèrica', 'policia', 'bicicleta bici vehicle patrulla', C(26, 66, 14, 'none', 3) + C(74, 66, 14, 'none', 3) + L('M26 66L44 46H62L74 66M44 46L40 36H32M62 46L66 36', K, 3));
add('helicopter', 'Helicòpter genèric', 'policia', 'helicòpter aeronau vigilància', R(30, 44, 40, 24, '#fff', 12) + L('M70 56H90V50', K, 2.6) + L('M10 36H90', K, 3) + L('M50 36V44', K, 2.6) + L('M36 80H64', K, 2.6));
add('furgo', 'Furgó genèric', 'policia', 'furgó vehicle transport', R(10, 40, 62, 36, '#fff', 4) + P('M72 46H88L92 60V76H72Z', '#fff') + C(30, 78, 6, K) + C(80, 78, 6, K));

/* ════ 2. ESPIONATGE I VIGILÀNCIA ════ */
add('agent', 'Agent amb gavardina', 'espionatge', 'agent espia gavardina silueta', C(50, 30, 11, K) + R(30, 22, 40, 4, K, 2) + P('M36 22Q50 6 64 22Z', K) + P('M32 44L50 40L68 44L72 94H28Z', K) + R(40, 26, 8, 4, '#fff', 1, 0) + R(52, 26, 8, 4, '#fff', 1, 0));
add('ulleres', 'Ulleres de sol', 'espionatge', 'ulleres sol incògnit', C(32, 52, 16, K) + C(68, 52, 16, K) + L('M48 50Q50 46 52 50', K, 3) + L('M16 50L6 44M84 50L94 44', K, 3));
add('maleti', 'Maletí', 'espionatge', 'maletí maleta portador', R(12, 36, 76, 46, K, 4) + L('M12 56H88', YE, 2.4) + P('M40 36V28H60V36', 'none', 3) + R(44, 52, 12, 8, YE, 1, 1.6));
add('microfon', 'Micròfon ocult', 'espionatge', 'micròfon ocult escolta', C(50, 50, 30, 'none', 2.2, K) + C(50, 50, 16, '#fff', 2.6) + C(50, 50, 6, K));
add('camera-espia', 'Càmera espia', 'espionatge', 'càmera espia vigilància botó', C(50, 50, 30, K) + C(50, 50, 20, '#fff', 2) + C(50, 50, 8, BL));
add('binocles', 'Binocles', 'espionatge', 'binocles observació prismàtics', C(30, 62, 18) + C(70, 62, 18) + R(40, 46, 20, 12, K, 3) + L('M12 56L16 40M88 56L84 40', K, 2.6));
add('clau-codi', 'Teclat de codi', 'espionatge', 'clau codi accés teclat', R(22, 16, 56, 68, '#fff', 8) + [0, 1, 2].map(r => [0, 1, 2].map(c => C(38 + c * 12, 34 + r * 16, 4, K, 1, K)).join('')).join('') + C(50, 80, 3, RD, 1));
add('sobre-confidencial', 'Sobre confidencial', 'espionatge', 'sobre confidencial document secret', R(14, 30, 72, 44, '#fff', 3) + L('M14 30L50 58L86 30') + T(50, 88, 9, 'CONFIDENCIAL', RD));
add('segell-secret', 'Segell SECRET', 'espionatge', 'segell secret classificat', R(18, 38, 64, 24, 'none', 4, 3, RD) + T(50, 56, 15, 'SECRET', RD));
add('segell-classificat', 'Segell CLASSIFICAT', 'espionatge', 'segell classificat reservat', R(14, 38, 72, 24, 'none', 4, 3, RD) + T(50, 55, 9, 'CLASSIFICAT', RD));
add('ull', 'Ull de vigilància', 'espionatge', 'ull vigilància observació', P('M10 50Q50 16 90 50Q50 84 10 50Z', '#fff') + C(50, 50, 14, K) + C(50, 50, 5, RD, 0, RD));
add('wifi-interceptat', 'Senyal interceptat', 'espionatge', 'wifi senyal interceptat escolta', L('M22 58A40 40 0 0 1 78 58') + L('M34 64A24 24 0 0 1 66 64') + D(50, 72, 5) + L('M14 86L86 14', RD, 4));
add('mapa-ruta', 'Mapa amb ruta', 'espionatge', 'mapa ruta seguiment trajecte', P('M10 20L36 14L64 22L90 14V82L64 90L36 82L10 88Z', '#fff') + L('M20 70Q40 40 50 56T82 30', RD, 2.4, DASH('5 4')) + C(20, 70, 4, K, 1, K) + C(82, 30, 4, K, 1, K));
add('xifrat', 'Xifratge', 'espionatge', 'xifrat codi clau criptografia', R(30, 46, 40, 36, '#fff', 4) + L('M38 46V36Q38 22 50 22Q62 22 62 36V46') + T(50, 70, 13, '01'));
add('portatil', 'Ordinador amb codi', 'espionatge', 'ordinador portàtil codi pantalla', R(22, 20, 56, 40, '#fff', 3) + R(16, 62, 68, 8, K, 3) + L('M30 32H44M30 40H60M30 48H50', GR, 2.2));
add('passaport', 'Passaport genèric en blanc', 'espionatge', 'passaport document identitat', R(26, 14, 48, 72, K, 4) + C(50, 40, 10, 'none', 2, YE) + L('M36 66H64M36 74H58', YE, 2));
add('usb', 'Memòria USB', 'espionatge', 'memòria USB dades clau', R(34, 22, 32, 56, '#fff', 4) + R(42, 14, 16, 12, GY, 2, 2) + R(40, 66, 20, 8, BL, 1, 1.6));
add('targeta-acces', 'Targeta d\'accés', 'espionatge', 'targeta accés passi seguretat', R(14, 28, 72, 44, '#fff', 6) + R(22, 38, 14, 12, YE, 2, 1.6) + L('M44 40H78M44 50H70M44 60H76', K, 2.2));
add('guants', 'Guants', 'espionatge', 'guants protecció proves', P('M28 84V44Q28 36 36 36Q44 36 44 44V30Q44 22 52 22Q60 22 60 30V40Q60 32 68 32Q76 32 76 40V64Q76 84 56 84Z', '#fff', 2.4));

/* ════ 3. INVESTIGACIÓ I PROVES ════ */
add('lupa', 'Lupa', 'investigacio', 'lupa investigació detall', C(42, 42, 26) + L('M60 60L86 86', K, 6));
add('empremtes', 'Empremtes dactilars', 'investigacio', 'empremtes dactilars identificació', [8, 16, 24, 32].map(r => L(`M${50 - r} 60A${r} ${r + 6} 0 0 1 ${50 + r} 60`, K, 2.2)).join('') + L('M50 40V68', K, 2.2));
add('carpeta-cas', 'Carpeta de cas', 'investigacio', 'carpeta expedient cas arxiu', P('M12 30H40L48 40H88V82H12Z', '#fff') + R(30, 52, 40, 14, YE, 1, 1.6) + T(50, 63, 9, 'CAS'));
add('pistes', 'Pistes numerades', 'investigacio', 'pistes marcadors seqüència proves', L('M24 50H76', K, 2) + C(20, 50, 10, RD) + T(20, 55, 11, '1', '#fff') + C(50, 50, 10, RD) + T(50, 55, 11, '2', '#fff') + C(80, 50, 10, RD) + T(80, 55, 11, '3', '#fff'));
add('no-creuar', 'Cinta de no creuar', 'investigacio', 'cinta no creuar zona restringida', R(4, 40, 92, 20, RD, 0, 2.5) + STRIPES(4, 40, 92, 20, '#fff'));
add('sospitosos', 'Panell de sospitosos', 'investigacio', 'panell sospitosos fitxa identificació', [16, 50, 84].map(x => R(x - 12, 22, 24, 56, '#fff', 3, 2) + C(x, 38, 6) + P(`M${x - 9} 74Q${x} 52 ${x + 9} 74Z`)).join(''));
add('notes', 'Llibreta de notes', 'investigacio', 'notes llibreta apunts', R(24, 14, 52, 72, '#fff', 2) + L('M32 32H68M32 44H68M32 56H60M32 68H68', GY, 2));
add('adn', 'Hèlix d\'ADN', 'investigacio', 'adn genètica proves biològiques', L('M30 10Q70 30 30 50T30 90', BL, 3) + L('M70 10Q30 30 70 50T70 90', RD, 3) + [22, 36, 50, 64, 78].map(y => L(`M38 ${y} H62`, K, 2)).join(''));
add('cronologia', 'Cronologia', 'investigacio', 'cronologia línia temporal seqüència', L('M10 50H90', K, 2.4) + [20, 40, 60, 80].map(x => C(x, 50, 5, '#fff', 2.2)).join('') + L('M46 34V42M66 34V42', K, 1.8));
add('interrogant', 'Interrogant', 'investigacio', 'interrogant dubte sospita', C(50, 50, 36) + T(50, 66, 50, '?'));
add('fil-vermell', 'Fil vermell', 'investigacio', 'fil vermell connexions relacions', [[20, 25], [80, 25], [50, 80], [20, 70], [80, 70]].map(([x, y]) => C(x, y, 7)).join('') + L('M20 25L80 70M80 25L20 70M20 25L50 80M80 25L50 80', RD, 2, DASH('5 4')));
add('cctv', 'Càmera de videovigilància', 'investigacio', 'càmera cctv videovigilància vigilància', R(28, 36, 44, 26, '#fff', 6) + P('M72 44L90 34V66L72 56Z') + L('M50 62V82H40', K, 2.6) + C(40, 49, 4, RD, 1));
add('testimoni', 'Testimoni', 'investigacio', 'testimoni declaració globus diàleg', P('M14 18H86V66H52L30 84V66H14Z', '#fff') + L('M28 34H72M28 46H62', GY, 2.4));
add('bossa-proves', 'Bossa de proves', 'investigacio', 'bossa proves evidència precintada', P('M24 34H76L84 90H16Z', '#fff') + R(36, 22, 28, 16, '#fff', 3) + R(38, 56, 24, 16, YE, 1, 1.6) + L('M30 40L70 40', GY, 1.2));
add('cronometre', 'Cronòmetre', 'investigacio', 'cronòmetre temps hora', C(50, 56, 32) + R(44, 10, 12, 8, K, 2) + L('M50 56V36M50 56H64', K, 2.6));
add('custodia', 'Cadena de custòdia', 'investigacio', 'cadena custòdia traçabilitat enllaços', [18, 42, 66].map(x => R(x, 40, 28, 20, 'none', 10, 3)).join('') + L('M14 50H18M82 50H86', K, 2.6));
add('mapa-delicte', 'Mapa de punts', 'investigacio', 'mapa punts zona concentració', P('M10 22L36 16L64 24L90 16V82L64 88L36 82L10 90Z', '#fff') + C(30, 40, 5, RD, 1, RD) + C(40, 46, 5, RD, 1, RD) + C(56, 60, 5, RD, 1, RD) + C(66, 34, 5, RD, 1, RD));

/* ════ 4. SENYALS DE SEGURETAT ════ */
add('zona-videovigilada', 'Zona de videovigilància', 'senyals', 'senyal vigilància càmera zona', R(8, 8, 84, 84, YE, 6, 2.6) + R(24, 26, 52, 30, '#fff', 4, 2) + P('M72 36L84 30V50L72 44Z', K, 1.6) + C(44, 41, 5, K, 1.2) + T(50, 76, 7.5, 'VIDEOVIGILÀNCIA'));
add('acces-restringit', 'Accés restringit', 'senyals', 'accés restringit prohibit senyal', C(50, 50, 40, '#fff', 6, RD) + L('M22 78L78 22', RD, 8));
add('punt-ajuda', 'Punt d\'ajuda', 'senyals', 'punt d\'ajuda informació senyal', R(10, 10, 80, 80, BL, 10, 0) + T(50, 70, 60, '?', '#fff'));
add('punt-trobada', 'Punt de trobada', 'senyals', 'punt trobada reunió senyal', R(10, 10, 80, 80, GR, 10, 0) + C(50, 38, 10, '#fff', 2.4) + P('M34 84Q50 56 66 84Z', '#fff', 2.4));
add('prohibit-fotografiar', 'Prohibit fotografiar', 'senyals', 'prohibit fotografiar càmera senyal', C(50, 50, 40, '#fff', 6, RD) + R(30, 40, 40, 26, K, 3) + C(50, 53, 7, '#fff', 2) + L('M22 78L78 22', RD, 8));
add('prohibit-el-pas', 'Prohibit el pas', 'senyals', 'prohibit pas accés senyal', C(50, 50, 40, '#fff', 6, RD) + L('M30 50H70', RD, 9));
add('zona-control', 'Zona de control', 'senyals', 'control zona punt de control senyal', R(10, 10, 80, 80, '#fff', 8, 3) + L('M50 22V78M22 50H78', K, 2, DASH('6 5')) + C(50, 50, 9, RD));

export const SYMBOLS = S;
export const SYM_CATS = {
  policia: 'Policia i seguretat ciutadana', espionatge: 'Espionatge i vigilància', investigacio: 'Investigació i proves', senyals: 'Senyals de seguretat',
};
