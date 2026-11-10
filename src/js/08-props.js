/* ── Panell de propietats ────────────────────────────────────── */
const MIXED = Symbol('mixed');
function common(objs, f) {
  if (!objs.length) return MIXED;
  const v0 = f(objs[0]);
  for (let i = 1; i < objs.length; i++) if (!eq(f(objs[i]), v0)) return MIXED;
  return v0;
}

// aplica un pegat a text recalculant-ne la mida
function patchText(o, p) {
  const st = App.store;
  const tmp = Object.assign({}, o, p);
  if (o.type === 'text') {
    const fit = TextKit.fit(tmp);
    p.h = fit.h;
    if (tmp.auto === 'w') {
      p.w = fit.w;
      if (tmp.ta === 'center') p.x = o.x + (o.w - fit.w) / 2;
      else if (tmp.ta === 'right') p.x = o.x + o.w - fit.w;
    }
  }
  st.patch(o.id, p);
}
GL.patchText = patchText;

/* camp numèric amb arrossegament, fórmules i unitats */
function NumField(opt) {
  const input = el('input', { spellcheck: 'false', inputmode: 'decimal', 'aria-label': opt.tip || opt.label || '' });
  const lab = el('span', { class: 'fl' });
  if (opt.icon) lab.innerHTML = icon(opt.icon); else lab.textContent = opt.label || '';
  if (opt.tip) lab.setAttribute('data-tip', opt.tip);
  const fu = el('span', { class: 'fu' });
  const box = el('div', { class: 'fld' }, lab, input, fu);
  if (opt.wide) box.style.gridColumn = 'span 2';
  const unit = () => opt.unit === 'len' ? App.store.props.unit : null;
  const toDisp = v => opt.unit === 'len' ? toU(v, unit()) : opt.unit === '%' ? v * 100 : v;
  const fromDisp = v => opt.unit === 'len' ? fromU(v, unit()) : opt.unit === '%' ? v / 100 : v;
  const dec = () => opt.unit === 'len' ? UNIT_DEC[unit()] + 1 : (opt.dec != null ? opt.dec : 1);
  let editing = false, cur = null;
  const show = () => {
    const v = opt.get();
    cur = v;
    box.classList.toggle('mixed', v === MIXED);
    fu.textContent = opt.unit === 'len' ? '' : opt.unit === '%' ? '%' : opt.unit === 'deg' ? '°' : (opt.suffix || '');
    if (editing) return;
    input.value = v === MIXED ? '' : v == null ? '' : fmtNum(toDisp(v), dec());
    input.placeholder = v === MIXED ? 'Mixt' : '';
    input.disabled = !!(opt.disabled && opt.disabled());
    box.style.opacity = input.disabled ? .45 : '';
  };
  const clampV = v => clamp(v, opt.min != null ? opt.min : -Infinity, opt.max != null ? opt.max : Infinity);
  const commit = (raw) => {
    const ref = opt.ref ? toDisp(opt.ref()) : undefined;
    let v = evalExpr(raw, { unit: unit(), ref });
    if (!isFinite(v)) { box.classList.add('err'); setTimeout(() => box.classList.remove('err'), 400); show(); return; }
    v = clampV(fromDisp(v));
    App.store.begin(opt.label ? 'Canvia ' + opt.label : 'Canvia valor');
    opt.set(v, true);
    App.store.commit();
    show();
  };
  input.addEventListener('focus', () => { editing = true; setTimeout(() => input.select(), 0); });
  input.addEventListener('blur', () => { if (editing) { editing = false; if (input.value !== '' && (cur === MIXED || input.value !== fmtNum(toDisp(cur), dec()))) commit(input.value); else show(); } });
  input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') { editing = false; commit(input.value); input.blur(); App.stage.focus(); }
    else if (e.key === 'Escape') { editing = false; show(); input.blur(); App.stage.focus(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const base = cur === MIXED || cur == null ? 0 : cur;
      const st = (opt.step || (opt.unit === 'len' ? fromU(1, unit()) : 1)) * (e.shiftKey ? 10 : 1) * (e.altKey ? 0.1 : 1);
      const v = clampV(base + (e.key === 'ArrowUp' ? st : -st));
      App.store.begin('Canvia valor'); opt.set(v, true); App.store.commit();
      editing = false; show(); editing = true; input.select();
    }
  });
  // arrossegar l'etiqueta
  lab.addEventListener('pointerdown', e => {
    if (input.disabled) return;
    e.preventDefault();
    lab.setPointerCapture(e.pointerId);
    const base = cur === MIXED || cur == null ? 0 : cur;
    let acc = 0, moved = false;
    const step = opt.dragStep || opt.step || (opt.unit === 'len' ? fromU(1, unit()) / (unit() === 'px' ? 1 : 2) : opt.unit === '%' ? 0.01 : 1);
    App.store.begin('Canvia valor');
    const mv = ev => {
      acc += ev.movementX;
      if (!moved && Math.abs(acc) < 2) return;
      moved = true;
      const k = (ev.shiftKey ? 10 : 1) * (ev.altKey ? 0.1 : 1);
      const v = clampV(base + Math.round(acc) * step * k);
      opt.set(v, false);
      show();
    };
    const up = () => { lab.removeEventListener('pointermove', mv); lab.removeEventListener('pointerup', up); App.store.commit(); document.body.style.cursor = ''; };
    lab.addEventListener('pointermove', mv); lab.addEventListener('pointerup', up);
    document.body.style.cursor = 'ew-resize';
  });
  box.refresh = show;
  show();
  return box;
}

/* desplegable */
function SelField(opt) {
  const b = el('button', { class: 'sel', type: 'button' });
  if (opt.wide) { b.style.gridColumn = 'span 2'; b.style.width = '100%'; }
  if (opt.tip) b.setAttribute('data-tip', opt.tip);
  const show = () => {
    const v = opt.get();
    const o = opt.options().find(x => eq(x.value, v));
    b.textContent = v === MIXED ? 'Mixt' : o ? o.label : (opt.fallback ? opt.fallback(v) : String(v));
    if (opt.styleOf && o) Object.assign(b.style, opt.styleOf(o));
  };
  b.addEventListener('click', () => {
    if (b.classList.contains('open')) { UI.closeMenus(); return; }
    UI.dropdown(b, opt.options(), opt.get(), v => { App.store.begin('Canvia ' + (opt.label || 'valor')); opt.set(v); App.store.commit(); show(); });
  });
  b.refresh = show;
  show();
  return b;
}

/* barra d'icones exclusiva */
function IconBar(opt) {
  const bar = el('div', { class: 'ibar' });
  if (opt.wide) bar.style.gridColumn = 'span 2';
  const btns = opt.items.map(it => {
    const btn = el('button', { type: 'button', html: icon(it.icon), 'data-tip': it.tip });
    if (it.text) { btn.innerHTML = ''; btn.textContent = it.text; btn.style.fontSize = '11px'; btn.style.fontWeight = '500'; }
    btn.addEventListener('click', () => {
      App.store.begin(it.tip || 'Canvia');
      if (opt.toggle) opt.set(it.value, !btn.classList.contains('on')); else opt.set(it.value);
      App.store.commit(); show();
    });
    bar.append(btn); return { btn, it };
  });
  const show = () => { const v = opt.get(); btns.forEach(({ btn, it }) => btn.classList.toggle('on', opt.toggle ? !!(v && v[it.value]) : eq(v, it.value))); };
  bar.refresh = show; show();
  return bar;
}

function Toggle(opt) {
  const t = el('button', { class: 'tog', type: 'button', role: 'switch', 'data-tip': opt.tip || '' });
  const show = () => { const v = opt.get(); t.classList.toggle('on', !!v && v !== MIXED); t.setAttribute('aria-checked', !!v); };
  t.addEventListener('click', () => { App.store.begin(opt.tip || 'Canvia'); opt.set(!t.classList.contains('on')); App.store.commit(); show(); });
  t.refresh = show; show();
  return t;
}

function Slider(opt) {
  const r = el('input', { type: 'range', class: 'range', min: opt.min, max: opt.max, step: opt.step || 1 });
  const show = () => { const v = opt.get(); if (v !== MIXED) r.value = v; r.style.setProperty('--p', ((r.value - opt.min) / (opt.max - opt.min) * 100) + '%'); };
  let tx = false;
  r.addEventListener('pointerdown', () => { App.store.begin(opt.label || 'Canvia'); tx = true; });
  r.addEventListener('input', () => { if (!tx) { App.store.begin(opt.label || 'Canvia'); tx = true; } opt.set(+r.value); show(); });
  r.addEventListener('change', () => { if (tx) { App.store.commit(); tx = false; } });
  r.addEventListener('keydown', e => e.stopPropagation());
  r.refresh = show; show();
  return r;
}

/* fila de pintura (emplenament o traç) */
function PaintRow(opt) {
  const row = el('div', { class: 'paint-row' });
  const sw = el('button', { class: 'swatch', type: 'button', 'data-tip': 'Tria el color' }, el('i'));
  const txt = el('input', { spellcheck: 'false', 'aria-label': 'Color hexadecimal' });
  const fld = el('div', { class: 'fld plain grow' }, txt);
  const op = NumField({ label: '', unit: '%', min: 0, max: 1, step: 0.01, dragStep: 0.01, dec: 0, get: () => { const p = opt.get(); return p === MIXED || !p || p.t !== 'solid' ? (p && p.t !== 'none' && p !== MIXED ? 1 : MIXED) : alphaOf(p.c); }, set: v => { const p = opt.get(); if (p && p !== MIXED && p.t === 'solid') { const { r, g, b } = rgbaOf(p.c); opt.set({ t: 'solid', c: toHexA(r, g, b, v) }); } }, disabled: () => { const p = opt.get(); return !p || p === MIXED || p.t !== 'solid'; } });
  op.style.width = '62px'; op.querySelector('.fl').style.width = '8px';
  const unl = el('button', { class: 'icon-btn sm', html: icon('unlink'), 'data-tip': 'Desenllaça el color del document' });
  unl.addEventListener('click', () => { const p = opt.get(); if (!p || p === MIXED || !p.ref) return; App.store.begin('Desenllaça'); opt.set({ t: 'solid', c: R.resolve(p) }); App.store.commit(); });
  const rm = el('button', { class: 'icon-btn sm', html: icon('minus'), 'data-tip': opt.removeTip || 'Treu' });
  rm.addEventListener('click', () => { App.store.begin('Treu'); opt.set({ t: 'none', c: (opt.get() || {}).c || '#000000ff' }); App.store.commit(); });
  row.append(sw, fld, op, unl, rm);
  let quick = null;
  if (GL.kids && GL.kids.on && opt.quick !== false) {
    quick = el('div', { class: 'quick-cols' });
    for (const c of KIDS_COLORS) { const q = el('button', { type: 'button', class: 'qc', style: { background: c }, 'data-tip': c.toUpperCase() }); q.addEventListener('click', () => { App.store.begin('Color'); opt.set({ t: 'solid', c: hexA(c) }); App.store.commit(); show(); }); quick.append(q); }
  }
  const show = () => {
    const p = opt.get();
    const i = sw.firstChild;
    sw.classList.toggle('none', !p || p.t === 'none');
    sw.classList.toggle('mixed', p === MIXED);
    if (p === MIXED) { txt.value = ''; txt.placeholder = 'Mixt'; i.style.background = ''; }
    else if (!p || p.t === 'none') { txt.value = ''; txt.placeholder = 'Cap'; }
    else if (p.t === 'solid') { const c = R.resolve(p); const nm = p.ref && GL.lib.colorOf(p.ref); if (document.activeElement !== txt) txt.value = nm ? '◆ ' + nm : hex6(c).slice(1).toUpperCase(); txt.placeholder = ''; i.style.background = cssColor(c); }
    else { txt.value = p.t === 'linear' ? 'Degradat lineal' : 'Degradat radial'; i.style.background = gradCSS(p); }
    unl.hidden = !(p && p !== MIXED && p.ref);
    fld.classList.toggle('linked', !!(p && p !== MIXED && p.ref));
    txt.readOnly = !!(p && p !== MIXED && ((p.t !== 'solid' && p.t !== 'none') || p.ref));
    op.refresh();
  };
  txt.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') { txt.blur(); App.stage.focus(); }
  });
  txt.addEventListener('change', () => {
    let v = txt.value.trim();
    if (/^[0-9a-f]{3,8}$/i.test(v)) v = '#' + v;
    const c = parseCssColor(v);
    if (!c) { show(); return; }
    const p = opt.get();
    const a = p && p !== MIXED && p.t === 'solid' ? alphaOf(p.c) : 1;
    const { r, g, b } = rgbaOf(c);
    App.store.begin('Canvia el color'); opt.set({ t: 'solid', c: toHexA(r, g, b, alphaOf(c) < 1 ? alphaOf(c) : a) }); App.store.commit();
    show();
  });
  sw.addEventListener('click', () => {
    let p = opt.get();
    if (!p || p === MIXED || p.t === 'none') p = { t: 'solid', c: (p && p !== MIXED && p.c) || '#000000ff' };
    openColorPicker(sw, p, (np) => { opt.set(np); show(); }, { gradient: opt.gradient !== false });
  });
  row.refresh = show; show();
  if (quick) { const w = el('div', { class: 'paint-wrap' }, row, quick); w.refresh = show; return w; }
  return row;
}
function gradCSS(p) {
  const stops = (p.s || []).slice().sort((a, b) => a.o - b.o).map(s => `${cssColor(s.c)} ${rnd(s.o * 100, 1)}%`).join(',');
  return p.t === 'radial' ? `radial-gradient(circle, ${stops})` : `linear-gradient(${(p.a || 0) + 90}deg, ${stops})`;
}

/* ── selector de color ── */
const Recent = {
  get() { try { return JSON.parse(localStorage.getItem('guaitaLlenc.colors') || '[]'); } catch (e) { return []; } },
  push(c) { try { const l = [c].concat(this.get().filter(x => x !== c)).slice(0, 14); localStorage.setItem('guaitaLlenc.colors', JSON.stringify(l)); } catch (e) { } },
};
function docColors() {
  const set = new Map();
  const addP = p => { if (!p || p.t === 'none') return; if (p.t === 'solid') set.set(p.c, (set.get(p.c) || 0) + 1); else (p.s || []).forEach(s => set.set(s.c, (set.get(s.c) || 0) + 1)); };
  for (const id in App.store.doc.objs) { const o = App.store.doc.objs[id]; addP(o.fill); if (o.sw > 0) addP(o.stroke); }
  for (const p of App.store.pagesSorted()) set.set(p.bg, (set.get(p.bg) || 0) + 1);
  return Array.from(set.entries()).sort((a, b) => b[1] - a[1]).slice(0, 18).map(x => x[0]);
}
function openColorPicker(anchor, paint, onChange, opt = {}) {
  let p = clone(paint);
  if (p.t !== 'solid' && (!p.s || p.s.length < 2)) p.s = [{ o: 0, c: '#000000ff' }, { o: 1, c: '#ffffffff' }];
  let stopI = 0;
  const curColor = () => p.t === 'solid' ? p.c : p.s[stopI].c;
  let { h, s, v } = (() => { const { r, g, b } = rgbaOf(curColor()); return rgb2hsv(r, g, b); })();
  let a = alphaOf(curColor());
  App.store.begin('Canvia el color');
  const root = el('div', { class: 'cpick' });
  const emit = () => { delete p.ref; onChange(clone(p)); };
  const setCol = () => {
    const { r, g, b } = hsv2rgb(h, s, v);
    const c = toHexA(r, g, b, a);
    if (p.t === 'solid') p.c = c; else p.s[stopI].c = c;
    emit(); paintUI();
  };
  const loadCol = () => { const { r, g, b } = rgbaOf(curColor()); const hv = rgb2hsv(r, g, b); if (hv.s > 0 && hv.v > 0) h = hv.h; s = hv.s; v = hv.v; a = alphaOf(curColor()); };
  // pestanyes
  let tabs = null;
  if (opt.gradient) {
    tabs = el('div', { class: 'ibar cp-tabs' });
    for (const [t, lab] of [['solid', 'Sòlid'], ['linear', 'Lineal'], ['radial', 'Radial']]) {
      const b = el('button', { type: 'button', text: lab });
      b.style.fontSize = '11px';
      b.addEventListener('click', () => {
        if (p.t === t) return;
        if (t === 'solid') p = { t: 'solid', c: curColor() };
        else if (p.t === 'solid') { const c = p.c; const { r, g, b: bb } = rgbaOf(c); p = { t, a: 90, s: [{ o: 0, c }, { o: 1, c: toHexA(r, g, bb, 0) }] }; stopI = 0; }
        else p.t = t;
        loadCol(); emit(); build();
      });
      b.dataset.t = t; tabs.append(b);
    }
    root.append(tabs);
  }
  const grad = el('div');
  const sv = el('div', { class: 'cp-sv' }, el('div', { class: 'w' }), el('div', { class: 'b' }), el('div', { class: 'cp-knob' }));
  const hue = el('div', { class: 'cp-bar cp-hue' }, el('div', { class: 'cp-knob' }));
  const alpha = el('div', { class: 'cp-bar cp-alpha' }, el('i'), el('div', { class: 'cp-knob' }));
  const hex = el('input', { spellcheck: 'false' });
  const hexF = el('div', { class: 'fld plain grow' }, hex);
  const aF = NumField({ label: 'A', unit: '%', min: 0, max: 1, step: 0.01, dragStep: 0.01, dec: 0, get: () => a, set: val => { a = val; setCol(); } });
  aF.style.width = '86px'; aF.style.flex = 'none';
  const pick = el('button', { class: 'icon-btn', html: icon('picker'), 'data-tip': 'Comptagotes' });
  if (!window.EyeDropper) pick.disabled = true;
  pick.addEventListener('click', async () => {
    try { const r = await new window.EyeDropper().open(); const c = parseCssColor(r.sRGBHex); const { r: R2, g, b } = rgbaOf(c); const hv = rgb2hsv(R2, g, b); h = hv.h; s = hv.s; v = hv.v; setCol(); } catch (e) { }
  });
  const row = el('div', { class: 'cp-row' }, hexF, aF, pick);
  const swDoc = el('div', { class: 'cp-sw-list' }), swRec = el('div', { class: 'cp-sw-list' });
  root.append(grad, sv, hue, alpha, row, el('div', { class: 'cp-sub', text: 'Colors del document' }), swDoc, el('div', { class: 'cp-sub', text: 'Recents' }), swRec);
  const drag = (elx, fn) => {
    elx.addEventListener('pointerdown', e => {
      e.preventDefault(); elx.setPointerCapture(e.pointerId);
      const f = ev => { const r = elx.getBoundingClientRect(); fn(clamp((ev.clientX - r.left) / r.width, 0, 1), clamp((ev.clientY - r.top) / r.height, 0, 1)); };
      f(e);
      const up = () => { elx.removeEventListener('pointermove', f); elx.removeEventListener('pointerup', up); };
      elx.addEventListener('pointermove', f); elx.addEventListener('pointerup', up);
    });
  };
  drag(sv, (x, y) => { s = x; v = 1 - y; setCol(); });
  drag(hue, (x) => { h = x * 360; setCol(); });
  drag(alpha, (x) => { a = rnd(x, 3); setCol(); });
  hex.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') hex.blur(); });
  hex.addEventListener('change', () => {
    let t = hex.value.trim(); if (/^[0-9a-f]{3,8}$/i.test(t)) t = '#' + t;
    const c = parseCssColor(t); if (!c) { paintUI(); return; }
    const { r, g, b } = rgbaOf(c); const hv = rgb2hsv(r, g, b); h = hv.s ? hv.h : h; s = hv.s; v = hv.v; if (alphaOf(c) < 1) a = alphaOf(c);
    setCol();
  });
  const swatch = (c) => { const d = el('div', { class: 'cp-sw', style: { background: cssColor(c) }, 'data-tip': hex6(c).toUpperCase() }); d.addEventListener('click', () => { const { r, g, b } = rgbaOf(c); const hv = rgb2hsv(r, g, b); h = hv.s ? hv.h : h; s = hv.s; v = hv.v; a = alphaOf(c); setCol(); }); return d; };
  const build = () => {
    if (tabs) $$('button', tabs).forEach(b => b.classList.toggle('on', b.dataset.t === p.t));
    grad.textContent = '';
    if (p.t !== 'solid') {
      const bar = el('div', { class: 'gr-bar' }, el('div', { class: 'bg' }));
      const stopsEl = [];
      p.s.forEach((st, i) => {
        const k = el('div', { class: 'gr-stop' + (i === stopI ? ' on' : ''), style: { left: st.o * 100 + '%', background: cssColor(st.c) } });
        k.addEventListener('pointerdown', e => {
          e.stopPropagation(); e.preventDefault();
          stopI = i; loadCol(); build();
          const kk = grad.querySelectorAll('.gr-stop')[i];
          kk.setPointerCapture(e.pointerId);
          const sy = e.clientY;
          const mv = ev => {
            const r = bar.getBoundingClientRect();
            p.s[i].o = rnd(clamp((ev.clientX - r.left) / r.width, 0, 1), 3);
            kk.style.left = p.s[i].o * 100 + '%';
            kk.style.opacity = Math.abs(ev.clientY - sy) > 40 && p.s.length > 2 ? .3 : 1;
            bar.firstChild.style.background = `linear-gradient(90deg, ${p.s.slice().sort((x, y) => x.o - y.o).map(x => cssColor(x.c) + ' ' + x.o * 100 + '%').join(',')})`;
            emit();
          };
          const up = ev => {
            kk.removeEventListener('pointermove', mv); kk.removeEventListener('pointerup', up);
            if (Math.abs(ev.clientY - sy) > 40 && p.s.length > 2) { p.s.splice(i, 1); stopI = 0; loadCol(); emit(); }
            build();
          };
          kk.addEventListener('pointermove', mv); kk.addEventListener('pointerup', up);
        });
        stopsEl.push(k); bar.append(k);
      });
      bar.addEventListener('pointerdown', e => {
        const r = bar.getBoundingClientRect();
        const o = rnd(clamp((e.clientX - r.left) / r.width, 0, 1), 3);
        p.s.push({ o, c: curColor() }); stopI = p.s.length - 1; emit(); build();
      });
      bar.firstChild.style.background = `linear-gradient(90deg, ${p.s.slice().sort((x, y) => x.o - y.o).map(x => cssColor(x.c) + ' ' + x.o * 100 + '%').join(',')})`;
      const tools = el('div', { class: 'cp-row', style: { marginTop: '8px', marginBottom: '8px' } });
      if (p.t === 'linear') {
        const ang = NumField({ icon: 'rot', unit: 'deg', step: 1, dec: 0, tip: 'Angle', get: () => p.a || 0, set: val => { p.a = rnd(normAng(val), 2); emit(); } });
        ang.classList.add('grow'); tools.append(ang);
      } else tools.append(el('span', { class: 'lbl grow', text: 'Arrossega les parades · fes clic a la barra per afegir-ne' }));
      const rev = el('button', { class: 'icon-btn', html: icon('swap'), 'data-tip': 'Inverteix' });
      rev.addEventListener('click', () => { p.s.forEach(x => x.o = rnd(1 - x.o, 3)); emit(); build(); });
      tools.append(rev);
      grad.append(bar, tools);
    }
    swDoc.textContent = ''; docColors().forEach(c => swDoc.append(swatch(c)));
    swRec.textContent = ''; Recent.get().forEach(c => swRec.append(swatch(c)));
    if (!swRec.children.length) swRec.append(el('span', { class: 'lbl', text: '—' }));
    paintUI();
  };
  const paintUI = () => {
    const { r, g, b } = hsv2rgb(h, 1, 1);
    sv.style.background = `rgb(${r | 0},${g | 0},${b | 0})`;
    const k = sv.lastChild; k.style.left = s * 100 + '%'; k.style.top = (1 - v) * 100 + '%';
    const c = hsv2rgb(h, s, v);
    k.style.background = `rgb(${c.r | 0},${c.g | 0},${c.b | 0})`;
    hue.lastChild.style.left = h / 360 * 100 + '%';
    alpha.querySelector('i').style.background = `linear-gradient(90deg, rgba(${c.r | 0},${c.g | 0},${c.b | 0},0), rgb(${c.r | 0},${c.g | 0},${c.b | 0}))`;
    alpha.lastChild.style.left = a * 100 + '%';
    if (document.activeElement !== hex) hex.value = hex6(curColor()).slice(1).toUpperCase();
    aF.refresh();
    if (p.t !== 'solid') { const k2 = grad.querySelectorAll('.gr-stop')[stopI]; if (k2) k2.style.background = cssColor(curColor()); const bg = grad.querySelector('.gr-bar .bg'); if (bg) bg.style.background = `linear-gradient(90deg, ${p.s.slice().sort((x, y) => x.o - y.o).map(x => cssColor(x.c) + ' ' + x.o * 100 + '%').join(',')})`; }
  };
  build();
  UI.pop(root, anchor, {
    side: 'left',
    onClose: () => { App.store.commit(); if (p.t === 'solid') Recent.push(p.c); else p.s.forEach(x => Recent.push(x.c)); }
  });
}
GL.openColorPicker = openColorPicker;

/* ── construcció del panell ─────────────────────────────────── */
const Props = GL.props = {
  root: null, fields: [], sig: '',
  init() {
    this.root = $('#props');
    App.on('sel', () => this.rebuild());
    App.on('page', () => this.rebuild());
    App.store.on(ch => { if (ch.history || ch.all) this.rebuild(); else this.refreshSoon(); });
    this.refreshSoon = rafThrottle(() => this.refresh());
  },
  refresh() {
    const sig = this.signature();
    if (sig !== this.sig) return this.rebuild();
    for (const f of this.fields) if (f.refresh) f.refresh();
  },
  signature() {
    const objs = App.objs();
    const m = App.mode;
    return (m ? m.type + ':' + (m.id || '') : '') + '|' + App.pageId + '|' + objs.map(o => o.id + ':' + o.type + ':' + (o.fill ? o.fill.t : '') + ':' + (o.stroke ? o.stroke.t : '') + ':' + (o.sw > 0 ? 1 : 0) + ':' + (o.shadow && o.shadow.on ? 1 : 0) + ':' + (o.blur > 0 ? 1 : 0) + ':' + (Array.isArray(o.r) ? 4 : 1) + ':' + (o.auto || '')).join(',') + '|' + App.store.props.unit;
  },
  rebuild() {
    if (!App.store.doc) return;
    const keep = document.activeElement && this.root.contains(document.activeElement);
    if (keep && this.sig === this.signature()) { this.refresh(); return; }
    this.sig = this.signature();
    this.fields = [];
    const scroll = this.root.scrollTop;
    this.root.textContent = '';
    const objs = App.objs();
    if (App.mode && App.mode.type === 'nodes') this.buildNodes();
    else if (!objs.length) this.buildPage();
    else this.buildSel(objs);
    this.root.scrollTop = scroll;
  },
  F(f) { this.fields.push(f); return f; },
  sec(title, actions) {
    const s = el('div', { class: 'p-sec' });
    const h = el('div', { class: 'p-sec-h' }, el('span', { class: 't', text: title }));
    if (actions) { const a = el('div', { class: 'a' }); actions.forEach(x => a.append(x)); h.append(a); }
    s.append(h);
    this.root.append(s);
    return s;
  },
  btn(ic, tip, fn, cls) { const b = el('button', { class: 'icon-btn sm' + (cls ? ' ' + cls : ''), html: icon(ic), 'data-tip': tip, type: 'button' }); b.addEventListener('click', fn); return b; },

  /* sense selecció: pàgina i document */
  buildPage() {
    const st = App.store, p = App.page();
    if (!p) return;
    const title = el('div', { class: 'p-title' }, el('span', { class: 'ico', html: icon('page') }));
    const nm = el('input', { value: p.name, spellcheck: 'false', 'aria-label': 'Nom de la pàgina' });
    nm.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') nm.blur(); });
    nm.addEventListener('change', () => { st.begin('Reanomena la pàgina'); st.setPage(p.id, 'name', nm.value.trim() || p.name); st.commit(); });
    title.append(nm, el('span', { class: 'sub', text: 'Pàgina' }));
    this.root.append(title);
    const s1 = this.sec('Mida de pàgina');
    const presetSel = this.F(SelField({
      label: 'mida', wide: true,
      options: () => PAGE_PRESETS.map(x => ({ label: x.name + '  ·  ' + x.desc, value: x.id })).concat([{ label: 'Personalitzada', value: 'custom' }]),
      get: () => { const cur = App.page(); const m = PAGE_PRESETS.find(x => (Math.abs(x.w - cur.w) < .5 && Math.abs(x.h - cur.h) < .5) || (Math.abs(x.h - cur.w) < .5 && Math.abs(x.w - cur.h) < .5)); return m ? m.id : 'custom'; },
      set: v => { const x = PAGE_PRESETS.find(q => q.id === v); if (!x) return; const cur = App.page(); const land = cur.w > cur.h; resizePage(cur.id, land && x.w < x.h ? x.h : x.w, land && x.w < x.h ? x.w : x.h); },
    }));
    const g = el('div', { class: 'grid2' });
    g.append(presetSel);
    g.append(this.F(NumField({ label: 'W', unit: 'len', min: 1, tip: 'Amplada', get: () => App.page().w, set: v => resizePage(p.id, v, App.page().h) })));
    g.append(this.F(NumField({ label: 'H', unit: 'len', min: 1, tip: 'Alçada', get: () => App.page().h, set: v => resizePage(p.id, App.page().w, v) })));
    s1.append(g);
    const r = el('div', { class: 'row' });
    r.append(this.F(IconBar({ items: [{ value: 'p', icon: 'orientP', tip: 'Vertical' }, { value: 'l', icon: 'orientL', tip: 'Horitzontal' }], get: () => App.page().w > App.page().h ? 'l' : 'p', set: v => { const c = App.page(); if ((v === 'l') !== (c.w > c.h)) resizePage(c.id, c.h, c.w); } })));
    r.firstChild.style.width = '74px';
    r.append(el('span', { class: 'grow' }));
    const fitB = el('button', { class: 'btn ghost', text: 'Ajusta al contingut', 'data-tip': 'Redimensiona la pàgina perquè s\'ajusti als objectes' });
    fitB.addEventListener('click', () => Cmd.run('page.fitContent'));
    r.append(fitB);
    s1.append(r);
    const s2 = this.sec('Fons');
    s2.append(this.F(PaintRow({ gradient: false, removeTip: 'Fons transparent', get: () => ({ t: alphaOf(App.page().bg) === 0 ? 'none' : 'solid', c: App.page().bg }), set: v => st.setPage(p.id, 'bg', v.t === 'none' ? hex6(v.c) + '00' : v.c) })));
    const s3 = this.sec('Document');
    const g3 = el('div', { class: 'grid2' });
    g3.append(this.F(SelField({ label: 'unitats', options: () => Object.keys(UNITS).map(u => ({ label: { px: 'Píxels (px)', mm: 'Mil·límetres (mm)', cm: 'Centímetres (cm)', in: 'Polzades (in)', pt: 'Punts (pt)' }[u], value: u })), get: () => st.props.unit, set: v => { st.setDoc('unit', v); App.applyView(); }, tip: 'Unitats' })));
    g3.append(this.F(NumField({ icon: 'grid', unit: 'len', min: 0.5, tip: 'Mida de la graella', get: () => st.props.grid, set: v => { st.setDoc('grid', v); App.drawOv(); } })));
    s3.append(g3);
    const tg = (label, key) => { const row = el('div', { class: 'row' }, el('span', { class: 'grow lbl', text: label })); row.append(this.F(Toggle({ tip: label, get: () => App.opts[key], set: v => { App.opts[key] = v; App.drawOv(); GL.syncViewOpts && GL.syncViewOpts(); } }))); return row; };
    s3.append(tg('Mostra la graella', 'grid'), tg('Ajusta a la graella', 'snapGrid'), tg('Guies intel·ligents', 'smart'));
    const info = el('div', { class: 'p-note' });
    const n = Object.keys(st.doc.objs).length, np = Object.keys(st.doc.pages).length;
    info.textContent = `${np} ${np === 1 ? 'pàgina' : 'pàgines'} · ${n} ${n === 1 ? 'objecte' : 'objectes'}`;
    s3.append(info);
  },

  buildNodes() {
    const o = App.store.obj(App.mode.id);
    const title = el('div', { class: 'p-title' }, el('span', { class: 'ico', html: icon('nodes') }), el('input', { value: o.name, readonly: true }), el('span', { class: 'sub', text: 'Nodes' }));
    this.root.append(title);
    const s = this.sec('Edició de nodes');
    const m = App.mode;
    const setType = (t) => {
      const sp = G.pageSP(o);
      for (const key of m.nsel) {
        const [si, k] = key.split(':').map(Number); const s0 = sp[si]; const n = s0 && s0.n[k]; if (!n) continue;
        if (t === 0) { n.i = null; n.o = null; n.s = 0; }
        else {
          const N = s0.n.length, prev = s0.n[(k - 1 + N) % N], next = s0.n[(k + 1) % N];
          const tx = (next.x - prev.x) / 4, ty = (next.y - prev.y) / 4;
          n.i = pt(n.x - tx, n.y - ty); n.o = pt(n.x + tx, n.y + ty); n.s = 2;
        }
      }
      App.store.begin('Tipus de node'); App.store.patch(o.id, G.pathFromPage(sp, o.rot, o.fx, o.fy)); App.store.commit();
    };
    const r = el('div', { class: 'row' });
    const b1 = el('button', { class: 'btn', text: 'Cantó' }); b1.addEventListener('click', () => setType(0));
    const b2 = el('button', { class: 'btn', text: 'Suau' }); b2.addEventListener('click', () => setType(1));
    const b3 = el('button', { class: 'btn', text: 'Obre / tanca' }); b3.addEventListener('click', () => {
      const cur = App.store.obj(o.id);
      const sp = clone(cur.sp); sp.forEach(x => x.c = !x.c);
      App.store.begin('Obre o tanca'); App.store.set(o.id, 'sp', sp); App.store.commit();
    });
    r.append(b1, b2, b3);
    s.append(r);
    s.append(el('div', { class: 'p-note', text: 'Doble clic sobre un node per alternar cantó i corba. Fes clic al traç per afegir un node. Alt + nansa per trencar la simetria.' }));
    const ex = el('button', { class: 'btn primary', text: 'Fet', style: { marginTop: '10px', width: '100%' } });
    ex.addEventListener('click', () => App.exitMode());
    s.append(ex);
  },

  /* selecció */
  buildSel(objs) {
    const st = App.store;
    const one = objs.length === 1 ? objs[0] : null;
    const types = new Set(objs.map(o => o.type));
    // títol
    const title = el('div', { class: 'p-title' });
    title.append(el('span', { class: 'ico', html: icon(one ? TYPE_ICON[one.type] : 'layers') }));
    if (one) {
      const nm = el('input', { value: one.name || '', spellcheck: 'false', 'aria-label': 'Nom de la capa' });
      nm.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') nm.blur(); });
      nm.addEventListener('change', () => { st.begin('Reanomena'); st.set(one.id, 'name', nm.value.trim() || one.name); st.commit(); });
      title.append(nm, el('span', { class: 'sub', text: TYPE_NAMES[one.type] }));
    } else title.append(el('span', { style: { flex: 1, fontWeight: 500 }, text: `${objs.length} objectes` }));
    this.root.append(title);
    // alineació
    const al = this.sec(objs.length > 1 ? 'Alinea' : 'Alinea a la pàgina');
    const bar = el('div', { class: 'align-bar' });
    [['aL', 'align.left', 'Alinea a l\'esquerra'], ['aCH', 'align.hcenter', 'Centra horitzontalment'], ['aR', 'align.right', 'Alinea a la dreta'], ['aT', 'align.top', 'Alinea a dalt'], ['aCV', 'align.vcenter', 'Centra verticalment'], ['aB', 'align.bottom', 'Alinea a baix'], ['dH', 'align.distH', 'Distribueix horitzontalment'], ['dV', 'align.distV', 'Distribueix verticalment']].forEach(([ic, cmd, tip]) => {
      const b = el('button', { html: icon(ic), 'data-tip': tip, 'data-cmd': cmd, type: 'button' });
      if (!Cmd.enabled(cmd)) b.disabled = true;
      b.addEventListener('click', () => Cmd.run(cmd));
      bar.append(b);
    });
    al.append(bar);
    this.buildGeom(objs, one, types);
    if (types.size === 1 && types.has('text')) this.buildText(objs);
    else if (types.has('text') && objs.every(o => o.type === 'text')) this.buildText(objs);
    this.buildLayer(objs);
    const fillable = objs.filter(o => o.type !== 'line' && o.type !== 'group' && o.type !== 'image');
    if (fillable.length) this.buildFill(fillable);
    const strokable = objs.filter(o => o.type !== 'group');
    if (strokable.length) this.buildStroke(strokable);
    this.buildEffects(objs.filter(o => true));
    if (one && one.type === 'image') this.buildImage(one);
  },
  buildGeom(objs, one, types) {
    const st = App.store;
    const s = this.sec('Disposició');
    const g = el('div', { class: 'grid2' });
    const boxed = one && G.isBoxed(one);
    const pageRef = () => App.page();
    const getBox = () => {
      const cur = App.objs();
      if (cur.length === 1 && G.isBoxed(cur[0])) return cur[0];
      return G.selBox(App.sel) || { x: 0, y: 0, w: 0, h: 0 };
    };
    const moveTo = (k, v) => {
      const cur = App.objs();
      if (cur.length === 1 && G.isBoxed(cur[0])) { st.set(cur[0].id, k, v); return; }
      const b = G.selBox(App.sel);
      const dx = k === 'x' ? v - b.x : 0, dy = k === 'y' ? v - b.y : 0;
      const out = {}; for (const id of topOnly(App.sel)) G.translateObj(st.obj(id), dx, dy, out);
      for (const id in out) st.patch(id, out[id]);
    };
    const sizeTo = (k, v) => {
      const cur = App.objs();
      v = Math.max(v, 0.01);
      if (cur.length === 1 && G.isBoxed(cur[0])) {
        const o = cur[0];
        const p = { [k]: v };
        if (o.lockRatio) { if (k === 'w') p.h = v * o.h / o.w; else p.w = v * o.w / o.h; }
        if (o.type === 'text') { if (k === 'w') { p.auto = 'h'; if (o.lockRatio) p.fs = rnd(o.fs * v / o.w, 2); patchText(o, p); } return; }
        st.patch(o.id, p); return;
      }
      const b = G.selBox(App.sel);
      if (!b) return;
      const sx = k === 'w' ? v / (b.w || 1) : 1, sy = k === 'h' ? v / (b.h || 1) : 1;
      const T = Mx.chain(Mx.tr(b.x, b.y), Mx.sc(sx, sy), Mx.tr(-b.x, -b.y));
      const out = {}; for (const id of topOnly(App.sel)) G.transformObj(st.obj(id), T, out);
      for (const id in out) st.patch(id, out[id]);
    };
    g.append(this.F(NumField({ label: 'X', unit: 'len', tip: 'Posició X', ref: () => pageRef().w, get: () => common(App.objs().length === 1 ? App.objs() : [getBox()], o => rnd(getBox().x, 4)), set: v => moveTo('x', v) })));
    g.append(this.F(NumField({ label: 'Y', unit: 'len', tip: 'Posició Y', ref: () => pageRef().h, get: () => rnd(getBox().y, 4), set: v => moveTo('y', v) })));
    const isText = one && one.type === 'text';
    g.append(this.F(NumField({ label: 'W', unit: 'len', tip: 'Amplada', min: 0.01, ref: () => pageRef().w, get: () => rnd(getBox().w, 4), set: v => sizeTo('w', v) })));
    g.append(this.F(NumField({ label: 'H', unit: 'len', tip: isText ? 'Alçada (automàtica)' : 'Alçada', min: 0.01, ref: () => pageRef().h, get: () => rnd(getBox().h, 4), set: v => sizeTo('h', v), disabled: () => isText })));
    s.append(g);
    const r2 = el('div', { class: 'row' });
    if (boxed) {
      const rot = this.F(NumField({ icon: 'rot', unit: 'deg', tip: 'Rotació', dec: 1, get: () => App.store.obj(one.id) ? App.store.obj(one.id).rot || 0 : 0, set: v => { const o = st.obj(one.id); const c = G.center(o); st.patch(o.id, G.rotateObj(o, c, normAng(v) - (o.rot || 0))[o.id]); } }));
      rot.classList.add('grow'); r2.append(rot);
    } else if (objs.length) {
      const rot = this.F(NumField({ icon: 'rot', unit: 'deg', tip: 'Gira la selecció', dec: 1, get: () => 0, set: v => { const b = G.selBox(App.sel); const c = pt(b.x + b.w / 2, b.y + b.h / 2); const out = {}; for (const id of topOnly(App.sel)) G.rotateObj(st.obj(id), c, v, out); for (const id in out) st.patch(id, out[id]); } }));
      rot.classList.add('grow'); r2.append(rot);
    }
    if (boxed && one.type !== 'text') {
      const lk = this.btn(one.lockRatio ? 'link' : 'unlink', 'Manté la proporció', () => { st.begin('Proporció'); st.set(one.id, 'lockRatio', !st.obj(one.id).lockRatio); st.commit(); this.rebuild(); }, one.lockRatio ? 'on' : '');
      r2.append(lk);
    }
    r2.append(this.btn('flipH', 'Reflecteix horitzontalment', () => Cmd.run('obj.flipH')), this.btn('flipV', 'Reflecteix verticalment', () => Cmd.run('obj.flipV')));
    s.append(r2);
    // específics de forma
    if (one && (one.type === 'rect' || one.type === 'image')) {
      const per = Array.isArray(one.r);
      const r3 = el('div', { class: 'row' });
      if (!per) {
        const rf = this.F(NumField({ icon: 'radius', unit: 'len', min: 0, tip: 'Radi de les cantonades', get: () => { const o = st.obj(one.id); return Array.isArray(o.r) ? MIXED : o.r || 0; }, set: v => st.set(one.id, 'r', v) }));
        rf.classList.add('grow'); r3.append(rf);
      } else {
        const g4 = el('div', { class: 'grid2 grow' });
        ['↖', '↗', '↘', '↙'].forEach((lab, i) => g4.append(this.F(NumField({ label: lab, unit: 'len', min: 0, tip: ['Superior esquerra', 'Superior dreta', 'Inferior dreta', 'Inferior esquerra'][i], get: () => (st.obj(one.id).r || [0, 0, 0, 0])[i] || 0, set: v => { const r = (st.obj(one.id).r || [0, 0, 0, 0]).slice(); r[i] = v; st.set(one.id, 'r', r); } }))));
        r3.append(g4);
        r3.style.alignItems = 'flex-start';
      }
      r3.append(this.btn('corners', 'Cantonades independents', () => {
        const o = st.obj(one.id);
        st.begin('Cantonades');
        st.set(o.id, 'r', Array.isArray(o.r) ? (o.r[0] || 0) : [o.r || 0, o.r || 0, o.r || 0, o.r || 0]);
        st.commit(); this.rebuild();
      }, per ? 'on' : ''));
      s.append(r3);
    }
    if (one && (one.type === 'polygon' || one.type === 'star')) {
      const r3 = el('div', { class: 'grid2' });
      r3.append(this.F(NumField({ label: 'N', tip: one.type === 'star' ? 'Puntes' : 'Costats', min: 3, max: 64, step: 1, dragStep: 0.2, dec: 0, get: () => st.obj(one.id).n || 5, set: v => st.set(one.id, 'n', Math.round(v)) })));
      if (one.type === 'star') r3.append(this.F(NumField({ label: 'R', unit: '%', tip: 'Radi interior', min: 0.05, max: 0.99, step: 0.01, dragStep: 0.005, dec: 0, get: () => st.obj(one.id).ratio || 0.5, set: v => st.set(one.id, 'ratio', rnd(v, 3)) })));
      s.append(r3);
    }
    if (one && one.type === 'line') {
      const r3 = el('div', { class: 'grid2' });
      r3.append(this.F(NumField({ label: 'L', unit: 'len', tip: 'Longitud', min: 0.01, get: () => { const o = st.obj(one.id); return dist(o.p1, o.p2); }, set: v => { const o = st.obj(one.id); const a = Math.atan2(o.p2.y - o.p1.y, o.p2.x - o.p1.x); st.set(o.id, 'p2', pt(rnd(o.p1.x + Math.cos(a) * v, 3), rnd(o.p1.y + Math.sin(a) * v, 3))); } })));
      r3.append(this.F(NumField({ icon: 'rot', unit: 'deg', tip: 'Angle', dec: 1, get: () => { const o = st.obj(one.id); return normAng(Math.atan2(o.p2.y - o.p1.y, o.p2.x - o.p1.x) / DEG); }, set: v => { const o = st.obj(one.id); const L = dist(o.p1, o.p2), a = v * DEG; st.set(o.id, 'p2', pt(rnd(o.p1.x + Math.cos(a) * L, 3), rnd(o.p1.y + Math.sin(a) * L, 3))); } })));
      s.append(r3);
    }
  },
  buildText(objs) {
    const st = App.store;
    const s = this.sec('Text');
    const all = () => App.objs().filter(o => o.type === 'text');
    const setT = (k, v) => { for (const o of all()) patchText(o, Object.assign({ [k]: v }, k !== 'auto' && o.ts ? { ts: undefined } : {})); if (GL.textEdit.id) GL.textEdit.position(); };
    const tsr = el('div', { class: 'row', style: { marginBottom: '6px' } });
    const tsSel = this.F(SelField({
      label: 'estil', tip: 'Estil de text del document',
      options: () => [{ label: 'Sense estil', value: null }].concat(GL.lib.tstyles().map(x => ({ label: x.name, value: x.id }))),
      get: () => common(all(), o => o.ts || null),
      set: v => { if (v) GL.lib.applyTStyle(v, all()); else for (const o of all()) st.set(o.id, 'ts', undefined); },
    }));
    tsSel.classList.add('grow');
    const fldBtn = this.btn('plus', 'Insereix un camp variable', e => {
      const r = fldBtn.getBoundingClientRect();
      UI.menu(GL.lib.fieldList().map(k => ({ label: '{' + k + '}', run: () => insertField(k) })).concat(['-', { label: 'Edita els camps…', run: () => Cmd.run('file.props') }]), r.left - 120, r.bottom + 4);
    });
    tsr.append(tsSel, fldBtn);
    s.append(tsr);
    const fam = this.F(SelField({
      label: 'tipus de lletra', wide: true, tip: 'Tipus de lletra',
      options: () => (GL.kids.on ? KIDS_FONTS : FontKit.families()).map(f => ({ label: f, value: f, style: { fontFamily: FontKit.stack(f) } })),
      get: () => common(all(), o => o.ff || 'IBM Plex Sans'),
      set: v => { for (const o of all()) { const ws = FontKit.weightsOf(v); const w = ws.reduce((a, b) => Math.abs(b - (o.fw || 400)) < Math.abs(a - (o.fw || 400)) ? b : a, ws[0]); patchText(o, { ff: v, fw: w }); } },
      styleOf: o => ({ fontFamily: FontKit.stack(o.value) }),
    }));
    s.append(fam);
    const g = el('div', { class: 'grid2' });
    g.style.marginTop = '6px';
    g.append(this.F(SelField({
      label: 'pes', tip: 'Pes',
      options: () => { const f = common(all(), o => o.ff || 'IBM Plex Sans'); return FontKit.weightsOf(f === MIXED ? 'IBM Plex Sans' : f).map(w => ({ label: WEIGHTS[w] + ' ' + w, value: w })); },
      get: () => common(all(), o => o.fw || 400), set: v => setT('fw', v), fallback: v => WEIGHTS[v] || v,
    })));
    g.append(this.F(NumField({ label: 'Mida', icon: 'text', tip: 'Mida (px)', min: 1, max: 2000, step: 1, dec: 1, suffix: 'px', get: () => common(all(), o => o.fs), set: v => setT('fs', rnd(v, 2)) })));
    g.append(this.F(NumField({ label: '↕', tip: 'Interlineat', unit: '%', min: 0.5, max: 5, step: 0.05, dragStep: 0.01, dec: 0, get: () => common(all(), o => o.lh || 1.25), set: v => setT('lh', rnd(v, 3)) })));
    g.append(this.F(NumField({ label: '↔', tip: 'Interletratge', unit: '%', min: -0.5, max: 2, step: 0.01, dragStep: 0.005, dec: 1, get: () => common(all(), o => o.ls || 0), set: v => setT('ls', rnd(v, 4)) })));
    if (GL.kids.on) { g.lastChild.remove(); g.lastChild.remove(); }
    s.append(g);
    const r = el('div', { class: 'row' });
    const ta = this.F(IconBar({ items: [{ value: 'left', icon: 'tL', tip: 'Alinea a l\'esquerra' }, { value: 'center', icon: 'tC', tip: 'Centra' }, { value: 'right', icon: 'tR', tip: 'Alinea a la dreta' }], get: () => common(all(), o => o.ta || 'left'), set: v => {
      for (const o of all()) { st.set(o.id, 'ta', v); }
      if (GL.textEdit.id) GL.textEdit.position();
    } }));
    ta.classList.add('grow');
    const sty = this.F(IconBar({
      toggle: true,
      items: [{ value: 'fi', icon: 'italic', tip: 'Cursiva' }, { value: 'under', icon: 'under', tip: 'Subratllat' }, { value: 'strike', icon: 'strike', tip: 'Ratllat' }, { value: 'upper', icon: 'caseUp', tip: 'Majúscules' }],
      get: () => { const o = all()[0] || {}; return { fi: !!o.fi, under: o.deco === 'underline', strike: o.deco === 'line-through', upper: o.tt === 'upper' }; },
      set: (k, on) => {
        for (const o of all()) {
          if (k === 'fi') patchText(o, { fi: on });
          if (k === 'under') patchText(o, { deco: on ? 'underline' : 'none' });
          if (k === 'strike') patchText(o, { deco: on ? 'line-through' : 'none' });
          if (k === 'upper') patchText(o, { tt: on ? 'upper' : 'none' });
        }
        if (GL.textEdit.id) GL.textEdit.position();
      },
    }));
    sty.classList.add('grow');
    r.append(ta, sty);
    s.append(r);
    const r2 = el('div', { class: 'row' });
    r2.append(el('span', { class: 'lbl grow', text: 'Mida de la caixa' }));
    const auto = this.F(IconBar({ items: [{ value: 'w', icon: 'autoW', tip: 'Amplada automàtica' }, { value: 'h', icon: 'autoH', tip: 'Amplada fixa, alçada automàtica' }], get: () => common(all(), o => o.auto || 'w'), set: v => setT('auto', v) }));
    auto.style.width = '74px';
    r2.append(auto);
    s.append(r2);
  },
  buildLayer(objs) {
    const st = App.store;
    const s = this.sec('Capa');
    const r = el('div', { class: 'row' });
    const sl = this.F(Slider({ min: 0, max: 100, label: 'Opacitat', get: () => { const v = common(App.objs(), o => o.opacity == null ? 1 : o.opacity); return v === MIXED ? 100 : Math.round(v * 100); }, set: v => { for (const o of App.objs()) st.set(o.id, 'opacity', v / 100); } }));
    const f = this.F(NumField({ label: '', unit: '%', tip: 'Opacitat', min: 0, max: 1, step: 0.01, dragStep: 0.01, dec: 0, get: () => common(App.objs(), o => o.opacity == null ? 1 : o.opacity), set: v => { for (const o of App.objs()) st.set(o.id, 'opacity', rnd(v, 3)); } }));
    f.style.width = '64px'; f.querySelector('.fl').style.width = '8px';
    r.append(sl, f);
    s.append(r);
    const r2 = el('div', { class: 'row adv' });
    const bl = this.F(SelField({ label: 'mode de fusió', tip: 'Mode de fusió', options: () => Object.entries(BLENDS).map(([v, l]) => ({ label: l, value: v })), get: () => common(App.objs(), o => o.blend || 'normal'), set: v => { for (const o of App.objs()) st.set(o.id, 'blend', v); } }));
    bl.classList.add('grow');
    r2.append(bl);
    s.append(r2);
  },
  buildFill(objs) {
    const st = App.store;
    const ids = objs.map(o => o.id);
    const get = () => common(ids.map(id => st.obj(id)).filter(Boolean), o => o.fill || { t: 'none' });
    const has = get();
    const add = this.btn('plus', 'Afegeix emplenament', () => { st.begin('Emplenament'); for (const id of ids) { const o = st.obj(id); st.set(id, 'fill', { t: 'solid', c: o.type === 'text' ? '#1a1a1aff' : '#d9d9d9ff' }); } st.commit(); this.rebuild(); });
    const textOnly = objs.every(o => o.type === 'text');
    const s = this.sec(textOnly ? 'Color del text' : 'Emplenament', has === MIXED || (has && has.t !== 'none') ? [] : [add]);
    if (has && (has === MIXED || has.t !== 'none')) {
      s.append(this.F(PaintRow({ get, set: v => { for (const id of ids) st.set(id, 'fill', v); this.sig === this.signature() || this.refreshSoon(); } })));
      const fr = objs.filter(o => o.type === 'path');
      if (fr.length) {
        const r = el('div', { class: 'row' }, el('span', { class: 'lbl grow', text: 'Regla de farciment' }));
        r.append(this.F(IconBar({ items: [{ value: 'nonzero', text: 'No nul', tip: 'No nul' }, { value: 'evenodd', text: 'Parell-senar', tip: 'Parell-senar (forats)' }], get: () => common(fr.map(o => st.obj(o.id)), o => o.fr || 'nonzero'), set: v => { for (const o of fr) st.set(o.id, 'fr', v); } })));
        r.lastChild.style.width = '150px';
        s.append(r);
      }
    }
  },
  buildStroke(objs) {
    const st = App.store;
    const ids = objs.map(o => o.id);
    const cur = () => ids.map(id => st.obj(id)).filter(Boolean);
    const on = common(cur(), o => !!(o.stroke && o.stroke.t !== 'none' && o.sw > 0));
    const add = this.btn('plus', 'Afegeix traç', () => {
      st.begin('Traç');
      for (const o of cur()) { st.set(o.id, 'stroke', o.stroke && o.stroke.t !== 'none' ? o.stroke : { t: 'solid', c: '#1a1a1aff' }); if (!(o.sw > 0)) st.set(o.id, 'sw', o.type === 'text' ? 1 : 2); }
      st.commit(); this.rebuild();
    });
    const s = this.sec('Traç', on === true ? [] : [add]);
    if (on === false) return;
    s.append(this.F(PaintRow({
      get: () => common(cur(), o => (o.sw > 0 && o.stroke) ? o.stroke : { t: 'none' }),
      set: v => { for (const o of cur()) { st.set(o.id, 'stroke', v); if (v.t === 'none') st.set(o.id, 'sw', 0); } }, removeTip: 'Treu el traç',
    })));
    const g = el('div', { class: 'grid2' });
    g.style.marginTop = '6px';
    g.append(this.F(NumField({ label: '≡', tip: 'Gruix (px)', min: 0, max: 500, step: 0.5, dragStep: 0.25, dec: 2, suffix: 'px', get: () => common(cur(), o => o.sw || 0), set: v => { for (const o of cur()) st.set(o.id, 'sw', rnd(v, 3)); } })));
    if (GL.kids.on) g.style.gridTemplateColumns = '1fr';
    g.append(this.F(SelField({ label: 'estil', tip: 'Estil de línia', options: () => Object.entries(DASHES).map(([v, l]) => ({ label: l, value: v })), get: () => common(cur(), o => o.dash || 'solid'), set: v => { for (const o of cur()) st.set(o.id, 'dash', v); } })));
    s.append(g);
    const r = el('div', { class: 'row' });
    r.classList.add('adv');
    r.append(this.F(IconBar({ items: [{ value: 'butt', text: 'Pla', tip: 'Extrem pla' }, { value: 'round', text: 'Rodó', tip: 'Extrem rodó' }, { value: 'square', text: 'Quadrat', tip: 'Extrem quadrat' }], get: () => common(cur(), o => o.cap || 'butt'), set: v => { for (const o of cur()) st.set(o.id, 'cap', v); } })));
    r.lastChild.classList.add('grow');
    r.append(this.F(IconBar({ items: [{ value: 'miter', text: '⌐', tip: 'Unió en angle' }, { value: 'round', text: '◠', tip: 'Unió arrodonida' }, { value: 'bevel', text: '◺', tip: 'Unió bisellada' }], get: () => common(cur(), o => o.join || 'miter'), set: v => { for (const o of cur()) st.set(o.id, 'join', v); } })));
    r.lastChild.style.width = '96px';
    s.append(r);
    const lines = objs.filter(o => o.type === 'line' || (o.type === 'path' && o.sp && o.sp[0] && !o.sp[0].c));
    if (lines.length) {
      const g2 = el('div', { class: 'grid2' });
      g2.style.marginTop = '6px';
      const opts = () => Object.entries(G.ARROWS).map(([v, l]) => ({ label: l, value: v }));
      g2.append(this.F(SelField({ label: 'inici', tip: 'Punta inicial', options: opts, get: () => common(lines.map(o => st.obj(o.id)), o => o.as || 'none'), set: v => { for (const o of lines) st.set(o.id, 'as', v); }, fallback: () => 'Inici' })));
      g2.append(this.F(SelField({ label: 'final', tip: 'Punta final', options: opts, get: () => common(lines.map(o => st.obj(o.id)), o => o.ae || 'none'), set: v => { for (const o of lines) st.set(o.id, 'ae', v); } })));
      s.append(el('div', { class: 'lbl', text: 'Puntes (inici · final)', style: { marginTop: '8px' } }), g2);
    }
  },
  buildEffects(objs) {
    const st = App.store;
    const cur = () => App.objs();
    const s = this.sec('Efectes');
    // ombra
    const shOn = () => common(cur(), o => !!(o.shadow && o.shadow.on));
    const r1 = el('div', { class: 'row' }, el('span', { html: icon('shadow'), class: 'lbl', style: { width: '16px', display: 'flex' } }), el('span', { class: 'grow', text: 'Ombra' }));
    r1.append(this.F(Toggle({ tip: 'Ombra', get: () => shOn() === true, set: v => { for (const o of cur()) st.set(o.id, 'shadow', Object.assign({ x: 0, y: 4, b: 12, c: '#00000040' }, o.shadow || {}, { on: v })); this.rebuild(); } })));
    s.append(r1);
    if (shOn() === true) {
      const g = el('div', { class: 'grid3' });
      g.style.marginTop = '6px';
      const shSet = (k, v) => { for (const o of cur()) st.set(o.id, 'shadow', Object.assign({}, o.shadow, { [k]: v })); };
      g.append(this.F(NumField({ label: 'X', tip: 'Desplaçament X (px)', step: 1, dec: 1, get: () => common(cur(), o => o.shadow ? o.shadow.x : 0), set: v => shSet('x', rnd(v, 2)) })));
      g.append(this.F(NumField({ label: 'Y', tip: 'Desplaçament Y (px)', step: 1, dec: 1, get: () => common(cur(), o => o.shadow ? o.shadow.y : 0), set: v => shSet('y', rnd(v, 2)) })));
      g.append(this.F(NumField({ icon: 'blur', tip: 'Desenfocament (px)', min: 0, step: 1, dec: 1, get: () => common(cur(), o => o.shadow ? o.shadow.b : 0), set: v => shSet('b', rnd(v, 2)) })));
      s.append(g);
      const pr = this.F(PaintRow({ gradient: false, get: () => common(cur(), o => ({ t: 'solid', c: o.shadow.c })), set: v => { if (v.t === 'none') { for (const o of cur()) st.set(o.id, 'shadow', Object.assign({}, o.shadow, { on: false })); this.rebuild(); return; } shSet('c', v.c); } }));
      pr.style.marginTop = '6px';
      s.append(pr);
    }
    const blOn = () => common(cur(), o => o.blur > 0);
    const r2 = el('div', { class: 'row adv' }, el('span', { html: icon('blur'), class: 'lbl', style: { width: '16px', display: 'flex' } }), el('span', { class: 'grow', text: 'Desenfocament' }));
    if (blOn() === true) {
      const f = this.F(NumField({ label: '', tip: 'Desenfocament (px)', min: 0.1, max: 200, step: 1, dec: 1, suffix: 'px', get: () => common(cur(), o => o.blur || 0), set: v => { for (const o of cur()) st.set(o.id, 'blur', rnd(v, 2)); } }));
      f.style.width = '76px'; f.querySelector('.fl').style.width = '8px';
      r2.append(f);
    }
    r2.append(this.F(Toggle({ tip: 'Desenfocament', get: () => blOn() === true, set: v => { for (const o of cur()) st.set(o.id, 'blur', v ? (o.blurMem || 4) : 0); if (!v) for (const o of cur()) if (o.blur > 0) st.set(o.id, 'blurMem', o.blur); this.rebuild(); } })));
    s.append(r2);
  },
  buildImage(o) {
    const s = this.sec('Imatge');
    const a = App.store.doc.assets[o.asset];
    const r = el('div', { class: 'row' });
    const b1 = el('button', { class: 'btn grow', html: icon('crop') + '<span>Retalla</span>' }); b1.querySelector('svg').style.width = '14px';
    b1.addEventListener('click', () => editObject(App.store.obj(o.id)));
    const b2 = el('button', { class: 'btn grow', text: 'Reemplaça…' });
    b2.addEventListener('click', () => Cmd.run('obj.replaceImage'));
    r.append(b1, b2);
    s.append(r);
    const r2 = el('div', { class: 'row' });
    const b3 = el('button', { class: 'btn ghost grow', text: 'Restableix el retall' });
    b3.addEventListener('click', () => Cmd.run('obj.resetCrop'));
    const b4 = el('button', { class: 'btn ghost grow', text: 'Mida original' });
    b4.addEventListener('click', () => Cmd.run('obj.imageNatural'));
    r2.append(b3, b4);
    s.append(r2);
    if (a) s.append(el('div', { class: 'p-note', text: `${a.w} × ${a.h} px · ${a.mime.replace('image/', '').toUpperCase()} · ${Math.round(a.data.length * 0.75 / 1024)} kB` }));
  },
};

/* mides de pàgina predefinides */
const mm = v => fromU(v, 'mm');
const PAGE_PRESETS = [
  { id: 'a4', name: 'A4', desc: '210 × 297 mm', w: mm(210), h: mm(297), unit: 'mm', g: 'paper' },
  { id: 'a3', name: 'A3', desc: '297 × 420 mm', w: mm(297), h: mm(420), unit: 'mm', g: 'paper' },
  { id: 'a2', name: 'A2', desc: '420 × 594 mm', w: mm(420), h: mm(594), unit: 'mm', g: 'paper' },
  { id: 'a1', name: 'A1', desc: '594 × 841 mm', w: mm(594), h: mm(841), unit: 'mm', g: 'paper' },
  { id: 'a0', name: 'A0', desc: '841 × 1189 mm', w: mm(841), h: mm(1189), unit: 'mm', g: 'paper' },
  { id: 'a5', name: 'A5', desc: '148 × 210 mm', w: mm(148), h: mm(210), unit: 'mm', g: 'paper' },
  { id: 'letter', name: 'Carta', desc: '8,5 × 11 in', w: 816, h: 1056, unit: 'in', g: 'paper' },
  { id: 'card', name: 'Targeta', desc: '85 × 55 mm', w: mm(85), h: mm(55), unit: 'mm', g: 'paper' },
  { id: 'hd', name: 'Pantalla 16:9', desc: '1920 × 1080 px', w: 1920, h: 1080, unit: 'px', g: 'screen' },
  { id: 'sd', name: 'Pantalla 4:3', desc: '1024 × 768 px', w: 1024, h: 768, unit: 'px', g: 'screen' },
  { id: 'ig', name: 'Quadrat 1:1', desc: '1080 × 1080 px', w: 1080, h: 1080, unit: 'px', g: 'screen' },
  { id: 'igp', name: 'Vertical 4:5', desc: '1080 × 1350 px', w: 1080, h: 1350, unit: 'px', g: 'screen' },
  { id: 'story', name: 'Història 9:16', desc: '1080 × 1920 px', w: 1080, h: 1920, unit: 'px', g: 'screen' },
  { id: 'web', name: 'Web 16:10', desc: '1440 × 900 px', w: 1440, h: 900, unit: 'px', g: 'screen' },
  { id: 'banner', name: 'Bàner 3:1', desc: '1500 × 500 px', w: 1500, h: 500, unit: 'px', g: 'screen' },
];
GL.PAGE_PRESETS = PAGE_PRESETS;
function resizePage(id, w, h) {
  const st = App.store;
  st.setPage(id, 'w', rnd(Math.max(1, w), 3));
  st.setPage(id, 'h', rnd(Math.max(1, h), 3));
}
GL.resizePage = resizePage;

// insereix un camp {clau} al text en edició o al final dels textos seleccionats
function insertField(k) {
  const tag = '{' + k + '}';
  const ta = GL.textEdit.ta;
  if (GL.textEdit.id) {
    const a = ta.selectionStart, b = ta.selectionEnd;
    ta.value = ta.value.slice(0, a) + tag + ta.value.slice(b);
    ta.selectionStart = ta.selectionEnd = a + tag.length;
    GL.textEdit.input(); ta.focus();
    return;
  }
  App.store.begin('Insereix camp');
  for (const o of App.objs()) if (o.type === 'text') patchText(o, { text: (o.text ? o.text + ' ' : '') + tag });
  App.store.commit();
}
GL.insertField = insertField;
