// Il·lustracions originals del paquet Empresa (línia duotò, 100×100)
// Copyright (C) 2026 SBS BiM Consulting, Jordi Subirós — AGPL-3.0-only
const K = '#1f2a44', A = '#cfe0ff', B = '#2f6fed', W = 3.6;
const at = f => `fill="${f}" stroke="${K}" stroke-width="${W}"`;
const L = (d, col = K, sw = W) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
const F = (d, f = A) => `<path d="${d}" ${at(f)}/>`;
const C = (cx, cy, r, f = A) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${at(f)}/>`;
const R = (x, y, w, h, rx = 4, f = A) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${at(f)}/>`;
const E = (cx, cy, rx, ry, f = A) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${at(f)}/>`;
const D = (cx, cy, r, f = K) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`;
const wrap = b => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const S = [];
const add = (id, name, cat, tags, body) => S.push({ id, name, cat, tags, svg: wrap(body) });

/* ── Finances ── */
add('e-moneda', 'Moneda', 'finances', 'moneda diners euro', C(50, 50, 36) + L('M62 34a18 18 0 1 0 0 32M30 46h26M30 56h26'));
add('e-bitllets', 'Bitllets', 'finances', 'bitllets diners efectiu', R(10, 30, 70, 40, 4, '#fff') + R(20, 22, 70, 40, 4) + C(55, 42, 9, '#fff') + L('M28 30v24M82 30v24'));
add('e-cartera', 'Cartera', 'finances', 'cartera wallet', F('M14 32h66a6 6 0 0 1 6 6v40a6 6 0 0 1 -6 6H20a6 6 0 0 1 -6 -6Z') + F('M62 50h26v16H62a8 8 0 0 1 0 -16Z', '#fff') + D(66, 58, 3) + L('M18 32l46-16 6 16'));
add('e-targeta', 'Targeta bancària', 'finances', 'targeta crèdit pagament', R(10, 24, 80, 52, 6) + `<rect x="10" y="36" width="80" height="10" fill="${K}"/>` + L('M20 62h20M50 62h10'));
add('e-guardiola', 'Guardiola', 'finances', 'estalvi guardiola', F('M20 54q0-24 32-24q14 0 22 8l10-4-2 12q6 6 6 14q0 10-12 14v10H66v-6H44v6H34V78q-14-8 -14-24Z') + D(70, 50, 3) + L('M44 30q2-10 12-8'));
add('e-grafic-puja', 'Creixement', 'finances', 'creixement gràfic pujada vendes', L('M10 88H90M10 88V10') + F('M18 80h12V60H18ZM40 80h12V46H40ZM62 80h12V30H62Z') + L('M20 50L42 34L58 42L86 16M72 16h14v14', B));
add('e-grafic-baixa', 'Descens', 'finances', 'descens pèrdues gràfic', L('M10 88H90M10 88V10') + L('M16 24L40 44L56 36L86 70M72 70h14V56', '#e5484d'));
add('e-pastis', 'Gràfic circular', 'finances', 'gràfic pastís percentatge', C(46, 54, 34) + F(`M46 54V20A34 34 0 0 1 80 54Z`, B) + F('M54 46V12A34 34 0 0 1 88 46Z', '#fff').replace('M54 46V12A34 34 0 0 1 88 46Z', 'M54 46V12A34 34 0 0 1 88 46Z'));
add('e-percent', 'Percentatge', 'finances', 'percentatge descompte', C(30, 30, 12) + C(70, 70, 12) + L('M78 18L22 82'));
add('e-calcul', 'Calculadora', 'finances', 'calculadora comptabilitat', R(22, 8, 56, 84, 8) + R(30, 16, 40, 18, 2, '#fff') + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => D(36 + (i % 3) * 14, 46 + Math.floor(i / 3) * 14, 4)).join('') + R(58, 74, 12, 12, 2, B));
add('e-factura', 'Factura', 'finances', 'factura rebut document', F('M20 8h48l14 14v70l-8-6-8 6-8-6-8 6-8-6-8 6-8-6Z', '#fff') + L('M30 30h28M30 42h40M30 54h40M30 66h20') + L('M62 64h10', B, 5));
add('e-borsa', 'Borsa', 'finances', 'borsa accions mercat', L('M8 90H92') + [[18, 40, 60, 30], [36, 30, 50, 20], [54, 46, 72, 36], [72, 20, 44, 14]].map(([x, y1, y2, yb], i) => L(`M${x + 6} ${y1 - 8}V${y2 + 8}`) + R(x, y1, 12, y2 - y1, 2, i % 2 ? '#fde2e2' : '#d6f5e3')).join(''));
add('e-banc', 'Banc', 'finances', 'banc entitat', F('M8 34L50 10L92 34Z') + [20, 40, 60, 80].map(x => R(x - 5, 40, 10, 38, 2, '#fff')).join('') + R(8, 80, 84, 10, 2));
add('e-euro', 'Euro', 'finances', 'euro moneda', C(50, 50, 38, '#fff') + L('M64 30a22 22 0 1 0 0 40M26 44h30M26 56h30', B));
add('e-pressupost', 'Pressupost', 'finances', 'pressupost previsió', F('M14 10h56l16 16v64H14Z', '#fff') + L('M24 30h30M24 44h52M24 56h52M24 68h52') + R(52, 74, 26, 10, 2, B));

/* ── Oficina i documents ── */
add('e-maleti', 'Maletí', 'oficina', 'maletí feina negoci', R(10, 28, 80, 56, 6) + L('M36 28v-8a6 6 0 0 1 6 -6h16a6 6 0 0 1 6 6v8M10 50h80') + R(44, 44, 12, 12, 2, '#fff'));
add('e-document', 'Document', 'oficina', 'document fitxer', F('M22 8h40l16 16v68H22Z', '#fff') + F('M62 8v16h16Z') + L('M32 42h36M32 54h36M32 66h24'));
add('e-carpeta', 'Carpeta', 'oficina', 'carpeta arxiu', F('M8 24a4 4 0 0 1 4 -4h24l8 8h44a4 4 0 0 1 4 4v48a4 4 0 0 1 -4 4H12a4 4 0 0 1 -4 -4Z'));
add('e-portapapers', 'Portapapers', 'oficina', 'portapapers llista tasques', R(18, 14, 64, 80, 6, '#fff') + R(36, 8, 28, 14, 4) + L('M30 40l4 4 8-8M30 58l4 4 8-8M30 76l4 4 8-8M50 42h22M50 60h22M50 78h22'));
add('e-calendari', 'Calendari', 'oficina', 'calendari agenda cita', R(10, 18, 80, 72, 6, '#fff') + `<path d="M10 24a6 6 0 0 1 6 -6h68a6 6 0 0 1 6 6v14H10Z" fill="${B}" stroke="${K}" stroke-width="${W}"/>` + L('M30 10v16M70 10v16') + [0, 1, 2, 3, 4, 5, 6, 7].map(i => D(26 + (i % 4) * 16, 52 + Math.floor(i / 4) * 18, 3.5)).join(''));
add('e-rellotge', 'Rellotge', 'oficina', 'temps hora horari', C(50, 50, 38, '#fff') + L('M50 26v24l16 10'));
add('e-sobre', 'Correu', 'oficina', 'correu email sobre', R(10, 22, 80, 56, 6, '#fff') + L('M12 26l38 28 38-28'));
add('e-telefon', 'Telèfon', 'oficina', 'telèfon trucada', F('M22 12h16l6 20-10 6q8 16 28 28l6-10 20 6v16a6 6 0 0 1 -6 6Q16 84 16 18a6 6 0 0 1 6 -6Z'));
add('e-mobil', 'Mòbil', 'oficina', 'mòbil telèfon app', R(28, 6, 44, 88, 8, '#fff') + R(34, 16, 32, 60, 2) + D(50, 84, 3));
add('e-impressora', 'Impressora', 'oficina', 'impressora imprimir', R(26, 10, 48, 22, 2, '#fff') + R(10, 32, 80, 38, 6) + R(26, 56, 48, 34, 2, '#fff') + L('M34 70h32M34 80h22') + D(78, 44, 3, B));
add('e-llibreta', 'Llibreta', 'oficina', 'llibreta notes', R(22, 8, 58, 84, 4, '#fff') + L('M22 8v84', B, 8) + L('M36 28h32M36 40h32M36 52h20'));
add('e-boli', 'Bolígraf', 'oficina', 'bolígraf signar escriure', F('M70 10l20 20-50 50-24 6 6-24Z', '#fff') + L('M60 20l20 20M22 62l16 16') + F('M16 86l6-24 16 16Z', B));
add('e-signatura', 'Signatura', 'oficina', 'signatura contracte firmar', F('M14 14h56l16 16v56H14Z', '#fff') + L('M24 66q8-18 14-4t10 -6 10 8 10-4', B) + L('M24 78h52M24 30h36M24 42h44'));
add('e-cafe', 'Cafè', 'oficina', 'cafè descans pausa', F('M18 38h52v28a20 20 0 0 1 -20 20H38a20 20 0 0 1 -20 -20Z', '#fff') + L('M70 44h6a10 10 0 0 1 0 20h-6M34 10q-6 8 0 16M50 10q-6 8 0 16'));
add('e-cadira', 'Cadira d\'oficina', 'oficina', 'cadira oficina', R(30, 10, 40, 40, 10) + R(24, 50, 52, 12, 4, '#fff') + L('M50 62v16M30 90l20-12 20 12M50 78v12'));
add('e-escriptori', 'Lloc de treball', 'oficina', 'escriptori ordinador oficina', L('M6 70H94M14 70v22M86 70v22') + R(28, 18, 44, 34, 3, '#fff') + L('M50 52v10M38 62h24'));
add('e-arxiu', 'Arxivador', 'oficina', 'arxivador calaixos', R(22, 8, 56, 84, 4) + L('M22 36h56M22 64h56') + R(42, 18, 16, 6, 2, '#fff') + R(42, 46, 16, 6, 2, '#fff') + R(42, 74, 16, 6, 2, '#fff'));
add('e-clip', 'Clip', 'oficina', 'clip adjunt', L('M66 34L36 64a10 10 0 0 0 14 14l32-32a18 18 0 0 0 -26 -26L22 54'));
add('e-cerca', 'Cerca', 'oficina', 'cerca lupa buscar', C(42, 42, 26, '#fff') + L('M62 62l26 26', K, 7));
add('e-pin', 'Ubicació', 'oficina', 'ubicació adreça mapa', F('M50 92S20 60 20 38a30 30 0 0 1 60 0c0 22-30 54-30 54Z') + C(50, 38, 10, '#fff'));
add('e-mapa', 'Mapa', 'oficina', 'mapa ruta', F('M8 22l28-10 28 10 28-10v66l-28 10-28-10-28 10Z', '#fff') + L('M36 12v66M64 22v66') + D(50, 46, 6, B));

/* ── Comunicació i màrqueting ── */
add('e-megafon', 'Megàfon', 'marqueting', 'megàfon anunci campanya', F('M14 40h16l40-22v64L30 60H14Z') + L('M30 60l6 24h10l-4-24M80 38q8 12 0 24'));
add('e-xat', 'Xat', 'marqueting', 'xat missatge conversa', F('M10 16h56a6 6 0 0 1 6 6v30a6 6 0 0 1 -6 6H34L18 70V58h-8a6 6 0 0 1 -6 -6V22a6 6 0 0 1 6 -6Z', '#fff') + F('M80 34h4a6 6 0 0 1 6 6v28a6 6 0 0 1 -6 6h-6v12L64 74H44a6 6 0 0 1 -6 -6v-4') + L('M20 32h36M20 42h24'));
add('e-diana', 'Objectiu', 'marqueting', 'objectiu diana meta target', C(46, 54, 36, '#fff') + C(46, 54, 22) + C(46, 54, 8, B) + L('M46 54L86 14M74 14h12v12'));
add('e-cohet', 'Llançament', 'marqueting', 'llançament startup coet', F('M50 8q24 18 20 52H30Q26 26 50 8Z', '#fff') + C(50, 36, 8) + F('M30 46L16 66h14ZM70 46l14 20H70Z', B) + L('M42 70l-4 16M50 70v20M58 70l4 16'));
add('e-bombeta', 'Idea', 'marqueting', 'idea innovació creativitat', F('M50 10a28 28 0 0 1 16 51v11H34V61A28 28 0 0 1 50 10Z', '#fff4c2') + L('M36 80h28M40 90h20M42 50l8 8 8-8'));
add('e-estrella', 'Valoració', 'marqueting', 'valoració opinió estrella', F('M50 8l12 26 28 3-21 19 6 28-25-14-25 14 6-28-21-19 28-3Z', '#fff4c2'));
add('e-cor', 'M\'agrada', 'marqueting', 'agrada cor fidelització', F('M50 86S10 62 10 34a20 20 0 0 1 40 -6 20 20 0 0 1 40 6c0 28-40 52-40 52Z', '#fde2e2'));
add('e-compartir', 'Compartir', 'marqueting', 'compartir xarxa', C(24, 50, 12) + C(76, 24, 12) + C(76, 76, 12) + L('M35 44l30-14M35 56l30 14'));
add('e-etiqueta', 'Oferta', 'marqueting', 'oferta preu etiqueta descompte', F('M10 46V14a4 4 0 0 1 4 -4h32l44 44-36 36Z') + C(30, 30, 7, '#fff'));
add('e-regal', 'Regal', 'marqueting', 'regal promoció', R(14, 40, 72, 50, 4, '#fff') + R(10, 28, 80, 14, 3) + L('M50 28v62') + L('M50 28q-20-24 -28-10q0 10 28 10M50 28q20-24 28-10q0 10 -28 10', B));
add('e-premi', 'Premi', 'marqueting', 'premi guardó qualitat', C(50, 38, 26, '#fff4c2') + F('M34 58L26 92l24-10 24 10-8-34', B) + F('M50 24l5 10 11 1-8 8 2 11-10-5-10 5 2-11-8-8 11-1Z', '#fff'));
add('e-news', 'Butlletí', 'marqueting', 'butlletí notícies newsletter', R(10, 14, 80, 72, 4, '#fff') + R(18, 22, 30, 24, 2) + L('M56 24h26M56 34h26M56 44h20M18 58h64M18 68h64M18 78h40'));
add('e-video', 'Vídeo', 'marqueting', 'vídeo reproduir', R(8, 18, 84, 64, 8) + F('M42 36l22 14-22 14Z', '#fff'));
add('e-camera', 'Càmera', 'marqueting', 'càmera foto', F('M10 30h18l8-12h28l8 12h18v54H10Z') + C(50, 56, 16, '#fff') + D(78, 40, 3));
add('e-wifi', 'Connexió', 'marqueting', 'wifi connexió internet', L('M10 38a56 56 0 0 1 80 0M22 52a38 38 0 0 1 56 0M34 66a20 20 0 0 1 32 0') + D(50, 80, 6, B));
add('e-web', 'Web', 'marqueting', 'web internet global', C(50, 50, 38, '#fff') + L('M12 50h76M50 12q20 38 0 76M50 12q-20 38 0 76M18 30h64M18 70h64'));
add('e-qr', 'Codi QR', 'marqueting', 'qr codi', R(12, 12, 30, 30, 3, '#fff') + R(58, 12, 30, 30, 3, '#fff') + R(12, 58, 30, 30, 3, '#fff') + [[22, 22], [68, 22], [22, 68]].map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="10" fill="${K}"/>`).join('') + [[58, 58], [72, 58], [58, 72], [80, 80], [66, 66], [80, 64]].map(([x, y]) => `<rect x="${x}" y="${y}" width="8" height="8" fill="${K}"/>`).join(''));

/* ── Tecnologia ── */
add('e-portatil', 'Portàtil', 'tecnologia', 'portàtil ordinador', R(18, 18, 64, 44, 4, '#fff') + R(24, 24, 52, 32, 2) + F('M6 70h88l-6 10H12Z'));
add('e-monitor', 'Monitor', 'tecnologia', 'monitor pantalla', R(8, 12, 84, 56, 4, '#fff') + L('M40 68l-4 16h28l-4-16M30 86h40') + L('M20 52l14-14 10 10 16-18 20 18', B));
add('e-nuvol', 'Núvol', 'tecnologia', 'núvol cloud dades', F('M28 74a20 20 0 0 1 -2 -40 26 26 0 0 1 50 4 18 18 0 0 1 0 36Z', '#fff') + L('M50 44v22M40 56l10 10 10-10', B));
add('e-base', 'Base de dades', 'tecnologia', 'dades servidor base', E(50, 22, 32, 10, '#fff') + F('M18 22v56c0 6 14 10 32 10s32-4 32-10V22') + L('M18 41c0 6 14 10 32 10s32-4 32-10M18 60c0 6 14 10 32 10s32-4 32-10'));
add('e-servidor', 'Servidor', 'tecnologia', 'servidor hosting', R(14, 10, 72, 24, 4) + R(14, 38, 72, 24, 4) + R(14, 66, 72, 24, 4) + [22, 50, 78].map(y => D(26, y, 3, B) + L(`M40 ${y}h34`)).join(''));
add('e-codi', 'Codi', 'tecnologia', 'codi programació desenvolupament', R(8, 14, 84, 72, 6, '#fff') + L('M34 38L20 50l14 12M66 38l14 12-14 12M56 32L44 68', B));
add('e-engranatge', 'Configuració', 'tecnologia', 'engranatge configuració procés', F('M44 8h12l2 12 8 4 10-7 8 8-7 10 4 8 12 2v12l-12 2-4 8 7 10-8 8-10-7-8 4-2 12H44l-2-12-8-4-10 7-8-8 7-10-4-8-12-2V44l12-2 4-8-7-10 8-8 10 7 8-4Z') + C(50, 50, 13, '#fff'));
add('e-escut', 'Seguretat', 'tecnologia', 'seguretat escut protecció', F('M50 8l36 12v26c0 24-16 40-36 46C30 86 14 70 14 46V20Z') + L('M34 50l12 12 22-24', B, 5));
add('e-cadenat', 'Cadenat', 'tecnologia', 'cadenat privacitat', R(18, 44, 64, 46, 6) + L('M30 44V32a20 20 0 0 1 40 0v12') + D(50, 64, 6, '#fff') + L('M50 68v10', '#fff'));
add('e-robot', 'Automatització', 'tecnologia', 'robot ia automatització', R(20, 30, 60, 50, 10) + C(38, 54, 7, '#fff') + C(62, 54, 7, '#fff') + L('M40 70h20M50 30V16M10 50v14M90 50v14') + D(50, 14, 5, B));
add('e-xarxa', 'Xarxa', 'tecnologia', 'xarxa connexió nodes', C(50, 50, 10, B) + [[16, 20], [84, 20], [16, 80], [84, 80], [50, 10]].map(([x, y]) => C(x, y, 8) + L(`M50 50L${x} ${y}`)).join(''));
add('e-dispositius', 'Multidispositiu', 'tecnologia', 'dispositius responsive', R(8, 18, 60, 42, 3, '#fff') + R(54, 34, 26, 48, 4) + R(80, 52, 14, 30, 3, '#fff') + L('M22 74h32'));
add('e-ia', 'Intel·ligència artificial', 'tecnologia', 'ia cervell intel·ligència', F('M50 14a20 20 0 0 0 -32 10 18 18 0 0 0 -4 28 18 18 0 0 0 12 26 20 20 0 0 0 24 6Z') + F('M50 14a20 20 0 0 1 32 10 18 18 0 0 1 4 28 18 18 0 0 1 -12 26 20 20 0 0 1 -24 6Z', '#fff') + L('M50 14v70M30 36h10M60 48h12M30 62h12'));

/* ── Logística i operacions ── */
add('e-camio', 'Enviament', 'logistica', 'camió enviament transport repartiment', R(6, 26, 54, 44, 3, '#fff') + F('M60 40h20l14 16v14H60Z') + C(24, 74, 8, '#fff') + C(76, 74, 8, '#fff'));
add('e-caixa', 'Paquet', 'logistica', 'paquet caixa producte', F('M50 8l40 18v48L50 92 10 74V26Z') + L('M10 26l40 18 40-18M50 44v48M30 17l40 18', K));
add('e-magatzem', 'Magatzem', 'logistica', 'magatzem estoc', F('M8 36L50 12l42 24v54H8Z', '#fff') + R(26, 50, 48, 40, 2) + L('M26 63h48M26 76h48'));
add('e-carro', 'Compra', 'logistica', 'carro compra botiga online', L('M6 14h14l10 50h50l8-36H24') + C(36, 80, 7, '#fff') + C(74, 80, 7, '#fff') + F('M28 28h60l-8 36H34Z'));
add('e-bossa', 'Bossa de compra', 'logistica', 'bossa compra comerç', F('M18 34h64l-4 56H22Z') + L('M36 40V28a14 14 0 0 1 28 0v12'));
add('e-avio', 'Viatge', 'logistica', 'avió viatge exportació', F('M48 10q6-2 8 4l2 26 30 18v8l-30-8-2 20 10 8v6l-16-4-16 4v-6l10-8-2-20-30 8v-8l30-18 2-26q2-6 6-4Z', '#fff'));
add('e-globus', 'Internacional', 'logistica', 'internacional global món', C(50, 50, 38) + F('M30 28q14-6 18 6-6 8 0 16-10 6-20-2-6-10 2-20Z', '#fff') + F('M60 52q12-2 16 8-4 14-16 18-4-12 0-26Z', '#fff'));
add('e-proces', 'Procés', 'logistica', 'procés flux cicle', L('M74 30A30 30 0 0 0 20 46M26 70a30 30 0 0 0 54 -16') + F('M76 14v18H58Z', B) + F('M24 86V68h18Z', B));
add('e-fabrica', 'Fàbrica', 'logistica', 'fàbrica indústria producció', F('M8 88V48l22-14v14l22-14v14l22-14V20h16v68Z') + R(20, 62, 10, 10, 1, '#fff') + R(42, 62, 10, 10, 1, '#fff') + R(64, 62, 10, 10, 1, '#fff'));
add('e-eina', 'Manteniment', 'logistica', 'manteniment eines servei', L('M30 70L70 30', K, 8) + F('M70 30a16 16 0 1 1 18 -18l-10 10-8-2-2-8Z') + F('M14 74l12-12 12 12-12 12Z', B));
add('e-casc', 'Obra', 'logistica', 'obra construcció casc', F('M12 66a38 38 0 0 1 76 0Z', '#ffd666') + R(6, 64, 88, 12, 4) + L('M50 28v38M34 32v20M66 32v20'));
add('e-grua', 'Construcció', 'logistica', 'grua construcció', L('M30 92V10M30 14H90M30 14L14 28H30M52 14l-22 24M78 14v30') + R(70, 44, 16, 14, 2) + R(18, 86, 26, 6, 1, K));

/* ── Persones i equip ── */
const SK = ['#f3cfae', '#e0ab80', '#c58b5c', '#8d5a38', '#5e3a24'];
const HC = ['#2d2420', '#6b4a2e', '#c99a4b', '#1a1a1e', '#8c8c8c'];
function avatar(i, shirt) {
  const sk = SK[i % 5], hc = HC[(i * 3) % 5];
  let b = C(50, 50, 46, '#eef3fb');
  b += `<path d="M18 88q4-26 32-26q28 0 32 26" fill="${shirt}" stroke="${K}" stroke-width="${W}"/>`;
  if (i % 3 === 1) b += `<path d="M28 46q0-28 22-28q22 0 22 28v18H28Z" fill="${hc}" stroke="${K}" stroke-width="${W}"/>`;
  b += C(50, 42, 18, sk);
  b += i % 3 === 2 ? `<path d="M32 38q2-18 18-18q16 0 18 18q-8-8-18-8q-10 0-18 8Z" fill="${hc}" stroke="${K}" stroke-width="${W}"/>` : `<path d="M32 40q0-20 18-20q18 0 18 20q-10-10-36 0Z" fill="${hc}" stroke="${K}" stroke-width="${W}"/>`;
  if (i % 4 === 3) b += L('M38 42h8M54 42h8M46 42h8', K, 2.4) + `<circle cx="42" cy="42" r="5" fill="none" stroke="${K}" stroke-width="2.4"/><circle cx="58" cy="42" r="5" fill="none" stroke="${K}" stroke-width="2.4"/>`;
  else b += D(43, 43, 2) + D(57, 43, 2);
  b += L('M45 51q5 4 10 0', K, 2.4);
  return b;
}
const SH = ['#2f6fed', '#1f2a44', '#16a085', '#e67e22', '#8e44ad', '#c0392b', '#7f8c8d', '#2c3e50'];
for (let i = 0; i < 12; i++) add('e-avatar' + (i + 1), 'Persona ' + (i + 1), 'persones', 'persona avatar perfil equip', avatar(i, SH[i % SH.length]));
const fig = (x, sh, sk, hc) => `<path d="M${x - 14} 92v-22q0-14 14-14q14 0 14 14v22" fill="${sh}" stroke="${K}" stroke-width="${W}"/>` + C(x, 40, 10, sk) + `<path d="M${x - 10} 38q0-12 10-12q10 0 10 12q-6-5-20 0Z" fill="${hc}" stroke="${K}" stroke-width="${W}"/>`;
add('e-equip', 'Equip', 'persones', 'equip grup persones', fig(26, '#16a085', SK[1], HC[0]) + fig(74, '#e67e22', SK[3], HC[3]) + fig(50, B, SK[0], HC[2]).replace(/92/g, '94'));
add('e-reunio', 'Reunió', 'persones', 'reunió taula persones', E(50, 66, 40, 12, '#fff') + fig(20, '#8e44ad', SK[2], HC[1]).replace(/v-22/g, 'v-24') + fig(80, B, SK[4], HC[3]) + R(34, 54, 32, 4, 1, K));
add('e-presentacio', 'Presentació', 'persones', 'presentació ponència pissarra', R(36, 10, 58, 40, 3, '#fff') + L('M44 40l10-12 8 6 14-14', B) + L('M64 50v18M54 78l10-10 10 10') + fig(22, '#1f2a44', SK[1], HC[0]) + L('M30 66L42 34', K, 3));
add('e-encaixada', 'Acord', 'persones', 'acord encaixada mans tracte', F('M4 40h18l6 26H8Z', B) + F('M96 40H78l-6 26h20Z', '#1f2a44') + F('M26 44l16-8 14 6 18 0 6 22-14 14-12-4-10 6-16-14Z', SK[1]) + L('M56 42l-14 10q-4 6 4 8l12-6M54 62l8 8M48 66l6 6M60 56l10 10'));
add('e-orador', 'Ponent', 'persones', 'ponent conferència orador', C(50, 26, 14, SK[2]) + `<path d="M36 24q0-14 14-14t14 14q-8-6-28 0Z" fill="${HC[1]}" stroke="${K}" stroke-width="${W}"/>` + F('M28 64q0-22 22-22t22 22', '#2c3e50') + F('M22 60h56l-6 32H28Z', '#fff') + R(40, 70, 20, 8, 2, B) + L('M50 60V48'));
add('e-org', 'Organigrama', 'persones', 'organigrama estructura jerarquia', R(36, 8, 28, 20, 4, B) + R(8, 66, 24, 20, 4) + R(38, 66, 24, 20, 4) + R(68, 66, 24, 20, 4) + L('M50 28v18M20 66V46h60v20M50 46v20'));
add('e-contractacio', 'Contractació', 'persones', 'contractació feina ocupació cv', F('M18 10h44l14 14v66H18Z', '#fff') + C(40, 36, 9) + L('M28 58q12-12 24 0M28 70h36M28 80h24') + C(74, 74, 14, B) + L('M68 74l5 5 9-9', '#fff', 4));
add('e-formacio', 'Formació', 'persones', 'formació curs aprenentatge', F('M50 14L94 34 50 54 6 34Z') + L('M24 42v20q26 16 52 0V42M88 36v26'));
add('e-client', 'Atenció al client', 'persones', 'client atenció suport', C(50, 44, 20, SK[0]) + L('M26 46a24 24 0 0 1 48 0M26 46v10M74 46v10q0 16-18 18') + R(20, 48, 10, 16, 4, B) + R(70, 48, 10, 16, 4, B) + `<path d="M22 94q4-20 28-20q24 0 28 20" fill="${A}" stroke="${K}" stroke-width="${W}"/>`);

/* ── Sectors ── */
add('e-salut', 'Salut', 'sectors', 'salut medicina farmàcia', R(14, 14, 72, 72, 16) + F('M40 26h20v14h14v20H60v14H40V60H26V40h14Z', '#fff'));
add('e-restaurant', 'Restauració', 'sectors', 'restaurant menjar hostaleria', C(50, 54, 34, '#fff') + C(50, 54, 22) + L('M10 12v26a8 8 0 0 0 8 8v40M18 12v22M26 12v26a8 8 0 0 1 -8 8M84 12q-10 6-10 30h10v44'));
add('e-botiga', 'Comerç', 'sectors', 'botiga comerç retail', F('M8 36l8-22h68l8 22Z') + R(14, 36, 72, 54, 2, '#fff') + R(24, 52, 22, 38, 2) + R(54, 52, 22, 20, 2) + L('M8 36q7 10 14 0t14 0 14 0 14 0 14 0 14 0'));
add('e-immobiliaria', 'Immobiliària', 'sectors', 'immobiliària habitatge casa venda', F('M10 50L50 14l40 36v40H10Z', '#fff') + R(40, 62, 20, 28, 2) + R(66, 26, 26, 18, 2, B) + `<path d="M70 35h18" stroke="#fff" stroke-width="3"/>`);
add('e-energia', 'Energia', 'sectors', 'energia sostenible electricitat', F('M58 6L22 56h24l-6 38 38-52H54Z', '#fff4c2'));
add('e-solar', 'Energia solar', 'sectors', 'solar placa renovable sostenibilitat', F('M10 58l14-30h52l14 30Z') + L('M28 58l8-30M50 58V28M72 58l-8-30M16 44h68') + L('M50 58v20M34 86h32') + C(80, 16, 7, '#ffd666'));
add('e-fulla', 'Sostenibilitat', 'sectors', 'sostenibilitat ecologia verd fulla', F('M20 80Q14 30 84 16q6 64 -64 64Z', '#d6f5e3') + L('M20 80Q44 54 64 36'));
add('e-advocat', 'Legal', 'sectors', 'legal justícia advocat balança', L('M50 12v72M30 86h40M14 26h72') + F('M14 26L4 54a12 10 0 0 0 20 0Z') + F('M86 26L76 54a12 10 0 0 0 20 0Z'));
add('e-educacio', 'Educació', 'sectors', 'educació escola formació llibre', F('M50 26Q34 16 10 18v60q24-2 40 8Z', '#fff') + F('M50 26q16-10 40-8v60q-24-2-40 8Z') + L('M50 26v60M20 34h20M20 46h20M60 34h20M60 46h20'));
add('e-turisme', 'Turisme', 'sectors', 'turisme viatge maleta vacances', R(22, 26, 56, 60, 8) + L('M40 26V16h20v10M36 26v60M64 26v60') + C(32, 90, 4, '#fff') + C(68, 90, 4, '#fff'));
add('e-cotxe', 'Automoció', 'sectors', 'cotxe automoció flota', F('M8 70V56l10-4 12-18h40l12 18 10 4v14Z') + C(28, 72, 8, '#fff') + C(72, 72, 8, '#fff') + L('M34 50h32'));
add('e-agricultura', 'Agricultura', 'sectors', 'agricultura camp cultiu', L('M50 92V30') + F('M50 54q-26 0-30-24 26 0 30 24ZM50 42q26 0 30-24-26 0-30 24ZM50 72q-22 0-26-18 22 0 26 18Z', '#d6f5e3') + L('M10 92h80'));
add('e-arquitectura', 'Arquitectura', 'sectors', 'arquitectura plànol projecte', R(10, 10, 80, 80, 3, '#fff') + L('M10 50h40V10M50 50v40M50 70h40') + L('M20 20l20 20', B));
add('e-art', 'Disseny', 'sectors', 'disseny creatiu art', F('M50 10a40 40 0 1 0 0 80q8 0 8-8 0-6-4-10 0-6 6-6h12a18 18 0 0 0 18 -18Q90 10 50 10Z', '#fff') + C(30, 44, 6, '#e5484d') + C(44, 26, 6, '#ffd666') + C(66, 30, 6, B) + C(28, 64, 6, '#16a085'));

/* ── Gràfics i dades (editables) ── */
add('e-kpi', 'Targeta KPI', 'dades', 'kpi indicador dada xifra', R(6, 18, 88, 64, 8, '#fff') + `<rect x="16" y="30" width="34" height="6" rx="3" fill="${A}"/><rect x="16" y="46" width="44" height="14" rx="3" fill="${K}"/>` + L('M62 66l8-10 6 6 10-14', B));
add('e-barres', 'Gràfic de barres', 'dades', 'gràfic barres dades', L('M10 90H92') + [[16, 50, B], [34, 30, A], [52, 60, B], [70, 18, A]].map(([x, y, c]) => R(x, y, 14, 90 - y, 2, c)).join(''));
add('e-linies', 'Gràfic de línies', 'dades', 'gràfic línies tendència', L('M10 10V90H92') + L('M16 72L34 52 52 60 70 32 88 40', B, 4) + L('M16 80L34 70 52 74 70 56 88 62', '#9fb3d1', 3) + [[34, 52], [52, 60], [70, 32]].map(([x, y]) => D(x, y, 4, B)).join(''));
add('e-donut', 'Gràfic d\'anell', 'dades', 'gràfic anell donut percentatge', `<circle cx="50" cy="50" r="32" fill="none" stroke="${A}" stroke-width="16"/><path d="M50 18a32 32 0 1 1 -30 42" fill="none" stroke="${B}" stroke-width="16"/>`);
add('e-progres', 'Barra de progrés', 'dades', 'progrés avanç barra', R(6, 40, 88, 20, 10, '#fff') + `<rect x="8" y="42" width="60" height="16" rx="8" fill="${B}"/>`);
add('e-embut', 'Embut de vendes', 'dades', 'embut vendes funnel conversió', F('M8 14h84l-14 22H22Z', B) + F('M24 40h52l-10 22H34Z') + F('M36 66h28l-8 22H44Z', '#fff'));
add('e-cronologia', 'Cronologia', 'dades', 'cronologia fites timeline', L('M6 50H94') + [16, 38, 62, 84].map((x, i) => C(x, 50, 7, i === 1 ? B : '#fff') + L(`M${x} ${i % 2 ? 58 : 42}V${i % 2 ? 76 : 24}`)).join(''));
add('e-matriu', 'Matriu DAFO', 'dades', 'dafo matriu anàlisi swot', R(8, 8, 40, 40, 4, '#d6f5e3') + R(52, 8, 40, 40, 4, '#fde2e2') + R(8, 52, 40, 40, 4, A) + R(52, 52, 40, 40, 4, '#fff4c2'));
add('e-mapa-calor', 'Taula de dades', 'dades', 'taula dades graella', R(8, 14, 84, 72, 4, '#fff') + `<rect x="8" y="14" width="84" height="16" rx="4" fill="${K}"/>` + L('M8 48h84M8 66h84M36 30v56M64 30v56', '#9fb3d1', 2));
add('e-velocimetre', 'Rendiment', 'dades', 'rendiment velocímetre indicador', L('M12 72a38 38 0 0 1 76 0', A, 12) + L('M12 72a38 38 0 0 1 58 -32', B, 12) + L('M50 72L70 44', K, 4) + D(50, 72, 6));
add('e-diagrama', 'Diagrama de flux', 'dades', 'diagrama flux procés', R(32, 6, 36, 18, 9) + F('M50 36l18 14-18 14-18-14Z', '#fff4c2') + R(8, 74, 30, 18, 3) + R(62, 74, 30, 18, 3) + L('M50 24v12M32 50H23v24M68 50h9v24'));

/* ── Decoració i fons ── */
const pat = (bg, body) => `<rect width="100" height="100" fill="${bg}"/>` + body;
add('e-fons-punts', 'Trama de punts', 'fons', 'fons trama punts', pat('#f4f7fc', Array.from({ length: 100 }, (_, i) => `<circle cx="${5 + (i % 10) * 10}" cy="${5 + Math.floor(i / 10) * 10}" r="1.2" fill="#b9c8e4"/>`).join('')));
add('e-fons-linies', 'Línies diagonals', 'fons', 'fons diagonals línies', pat('#1f2a44', Array.from({ length: 14 }, (_, i) => `<path d="M${-40 + i * 10} 100L${60 + i * 10} 0" stroke="#2a3a5e" stroke-width="3"/>`).join('')));
add('e-fons-ones', 'Ones suaus', 'fons', 'fons ones', pat('#ffffff', `<path d="M0 70q25-20 50 0t50 0V100H0Z" fill="${A}"/><path d="M0 82q25-14 50 0t50 0V100H0Z" fill="${B}"/>`));
add('e-fons-geo', 'Geomètric', 'fons', 'fons geomètric triangles', pat('#eef3fb', `<path d="M0 0L40 0L0 40Z" fill="${B}"/><path d="M100 100L60 100L100 60Z" fill="${A}"/><circle cx="84" cy="18" r="10" fill="none" stroke="${B}" stroke-width="3"/>`));
add('e-fons-blocs', 'Blocs de color', 'fons', 'fons blocs corporatiu', pat('#ffffff', `<rect x="62" y="0" width="38" height="100" fill="${K}"/><rect x="50" y="0" width="12" height="100" fill="${B}"/>`));
add('e-fons-graella', 'Graella tècnica', 'fons', 'fons graella plànol blueprint', pat('#183a6b', Array.from({ length: 11 }, (_, i) => `<path d="M${i * 10} 0V100M0 ${i * 10}H100" stroke="#2c5592" stroke-width="${i % 5 ? .6 : 1.4}"/>`).join('')));
add('e-fons-degradat', 'Degradat', 'fons', 'fons degradat', `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${B}"/><stop offset="1" stop-color="#1f2a44"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/>`);
add('e-fons-cercles', 'Cercles', 'fons', 'fons cercles', pat('#f7f9fc', `<circle cx="90" cy="10" r="40" fill="${A}"/><circle cx="10" cy="96" r="26" fill="${A}" opacity=".6"/><circle cx="90" cy="10" r="22" fill="none" stroke="${B}" stroke-width="2"/>`));
add('e-separador', 'Separador', 'decoracio', 'separador línia', L('M6 50h36M58 50h36') + `<rect x="44" y="44" width="12" height="12" fill="${B}" transform="rotate(45 50 50)"/>`);
add('e-marc-cantons', 'Cantonades', 'decoracio', 'marc cantonades', L('M8 30V8h22M70 8h22v22M92 70v22H70M30 92H8V70', B, 4));
add('e-cita', 'Cometes', 'decoracio', 'cita cometes testimoni', F('M12 60q0-30 26-40l4 8q-14 8-14 18h12v28H12Z', B) + F('M54 60q0-30 26-40l4 8q-14 8-14 18h12v28H54Z', B));
add('e-check', 'Validat', 'decoracio', 'validat correcte check', C(50, 50, 38, '#d6f5e3') + L('M32 52l12 12 24-26', '#16a085', 6));
add('e-creu', 'No', 'decoracio', 'no incorrecte creu', C(50, 50, 38, '#fde2e2') + L('M36 36l28 28M64 36L36 64', '#e5484d', 6));
add('e-fletxa', 'Fletxa', 'decoracio', 'fletxa següent', L('M10 50h76M66 30l20 20-20 20', B, 6));
add('e-fletxa-circ', 'Fletxa circular', 'decoracio', 'fletxa circular continu', L('M80 50A30 30 0 1 1 64 24', B, 5) + F('M58 12l12 14-16 6Z', B));
add('e-numero', 'Número', 'decoracio', 'número pas', C(50, 50, 38, B) + `<text x="50" y="62" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="800" font-size="36" fill="#fff">1</text>`);
add('e-placeholder', 'Logotip de mostra', 'decoracio', 'logotip logo marca placeholder', R(10, 26, 30, 48, 6, B) + F('M18 62l12-24 12 24Z', '#fff').replace(at('#fff'), 'fill="#fff"') + `<text x="48" y="58" font-family="Montserrat, sans-serif" font-weight="800" font-size="16" fill="${K}">LOGO</text>`);
add('e-segell', 'Segell de qualitat', 'decoracio', 'segell qualitat garantia certificat', F('M50 6l8 7 10-3 4 10 10 3-1 10 7 8-7 8 1 10-10 3-4 10-10-3-8 7-8-7-10 3-4-10-10-3 1-10-7-8 7-8-1-10 10-3 4-10 10 3Z', B) + C(50, 50, 24, '#fff') + L('M38 50l8 8 16-16', '#16a085', 5));

add('e-trofeu', 'Trofeu', 'marqueting', 'trofeu èxit guanyador', F('M28 10h44v24q0 24-22 26Q28 58 28 34Z', '#fff4c2') + L('M28 18H14q0 22 16 24M72 18h14q0 22-16 24M50 60v14') + R(32, 74, 36, 14, 3));
add('e-bandera', 'Fita', 'marqueting', 'fita bandera objectiu assolit', L('M20 92V10') + F('M20 12h56l-10 16 10 16H20Z', B));
add('e-clau', 'Clau', 'tecnologia', 'clau accés', C(30, 50, 18) + C(30, 50, 6, '#fff') + L('M48 50h42M80 50v14M68 50v10'));
add('e-ticket', 'Entrada', 'marqueting', 'entrada tiquet esdeveniment', F('M8 28h84v14a8 8 0 0 0 0 16v14H8V58a8 8 0 0 0 0 -16Z') + L('M66 28v44', K, 3) + L('M22 44h30M22 56h22'));
add('e-microfon', 'Podcast', 'marqueting', 'micròfon podcast entrevista', R(36, 8, 28, 50, 14) + L('M24 44q0 26 26 26t26-26M50 70v18M36 90h28'));
add('e-pila', 'Bateria', 'tecnologia', 'bateria energia càrrega', R(10, 30, 72, 40, 6, '#fff') + R(82, 42, 8, 16, 2, K) + `<rect x="16" y="36" width="44" height="28" rx="3" fill="#16a085"/>`);
add('e-maleta-doc', 'Dossier', 'oficina', 'dossier informe enquadernat', R(20, 8, 60, 84, 4, '#fff') + R(20, 8, 60, 22, 4, B) + L('M30 44h40M30 56h40M30 68h26') + [16, 30, 44, 58, 72, 86].map(y => `<circle cx="20" cy="${y}" r="2" fill="${K}"/>`).join(''));
add('e-lupa-grafic', 'Anàlisi', 'dades', 'anàlisi auditoria estudi', C(42, 42, 30, '#fff') + L('M64 64l26 26', K, 7) + L('M26 52l10-10 8 6 14-16', B));

export const SYMBOLS = S;
export const SYM_CATS = { finances: 'Finances', oficina: 'Oficina i documents', marqueting: 'Màrqueting i comunicació', tecnologia: 'Tecnologia', logistica: 'Logística i operacions', persones: 'Persones i equip', sectors: 'Sectors', dades: 'Gràfics i dades', decoracio: 'Elements gràfics', fons: 'Fons' };
