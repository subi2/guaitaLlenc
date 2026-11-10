/* ── Icones (traç 1,5 px, quadrícula 20) ─────────────────────── */
const IC = {
  select: '<path d="M5 3.5l9.5 6.2-4.3 1 2.6 4.8-1.9 1-2.6-4.8-3.3 3z" fill="currentColor" stroke="currentColor" stroke-linejoin="round" stroke-width="1"/>',
  hand: '<path d="M7 10V4.8a1.2 1.2 0 012.4 0V9m0-.5V3.7a1.2 1.2 0 012.4 0v5m0-.2V4.8a1.2 1.2 0 012.4 0v6.4m0-3.4a1.2 1.2 0 012.4 0v3.9c0 3.1-2.2 5.3-5.2 5.3h-1c-1.7 0-2.9-.7-3.9-2l-2.6-3.6a1.3 1.3 0 012-1.6L7 11.6"/>',
  rect: '<rect x="3.5" y="4.5" width="13" height="11" rx="1"/>',
  ellipse: '<ellipse cx="10" cy="10" rx="6.5" ry="6"/>',
  polygon: '<path d="M10 3.5l6.8 12H3.2z" stroke-linejoin="round"/>',
  star: '<path d="M10 3l2.1 4.5 4.9.6-3.6 3.3 1 4.8L10 13.8 5.6 16.2l1-4.8L3 8.1l4.9-.6z" stroke-linejoin="round"/>',
  line: '<path d="M4 16L16 4"/>',
  arrow: '<path d="M4 16L15.5 4.5M9.5 4.2h6.3v6.3"/>',
  pen: '<path d="M10 3l4.8 7.2-2.9 4.3H8.1l-2.9-4.3z" stroke-linejoin="round"/><path d="M10 3v6"/><circle cx="10" cy="10" r="1.2"/><path d="M8 17.2h4"/>',
  text: '<path d="M4.5 5.5V4h11v1.5M10 4v12.2M7.6 16.2h4.8"/>',
  image: '<rect x="3" y="4" width="14" height="12" rx="1.5"/><circle cx="7.5" cy="8.3" r="1.4"/><path d="M3.5 14.2l4.2-3.8 3 2.6 2.3-2 3.5 3.2"/>',
  group: '<rect x="3" y="3" width="14" height="14" rx="1.5" stroke-dasharray="2 2"/><rect x="6" y="6" width="5" height="5" rx=".5"/><rect x="9.5" y="9.5" width="4.5" height="4.5" rx=".5"/>',
  path: '<path d="M4 15C6 6 14 14 16 5"/><circle cx="4" cy="15" r="1.3" fill="currentColor"/><circle cx="16" cy="5" r="1.3" fill="currentColor"/>',
  eye: '<path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5z"/><circle cx="10" cy="10" r="2.2"/>',
  eyeOff: '<path d="M3 3l14 14M8.3 5.2A7.8 7.8 0 0110 5c4.7 0 7.5 5 7.5 5a12.9 12.9 0 01-2.3 2.9M12.3 14.6c-.7.3-1.5.4-2.3.4-4.7 0-7.5-5-7.5-5A13 13 0 015.6 6.6"/>',
  lock: '<rect x="4.5" y="9" width="11" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 016 0V9"/>',
  unlock: '<rect x="4.5" y="9" width="11" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 015.8-1"/>',
  chev: '<path d="M7 4l6 6-6 6"/>',
  chevL: '<path d="M13 4l-6 6 6 6"/>',
  chevD: '<path d="M4 7l6 6 6-6"/>',
  plus: '<path d="M10 4v12M4 10h12"/>',
  minus: '<path d="M4 10h12"/>',
  close: '<path d="M5 5l10 10M15 5L5 15"/>',
  trash: '<path d="M4 6h12M8 6V4.5h4V6M5.5 6l.8 10h7.4l.8-10"/>',
  dup: '<rect x="7" y="7" width="9.5" height="9.5" rx="1.5"/><path d="M13 7V5a1.5 1.5 0 00-1.5-1.5h-6A1.5 1.5 0 004 5v6a1.5 1.5 0 001.5 1.5H7"/>',
  page: '<path d="M5 3h7l3.5 3.5V17H5z"/><path d="M12 3v3.5h3.5"/>',
  pages: '<rect x="3" y="5" width="9" height="12" rx="1"/><path d="M7 5V3h10v12h-5"/>',
  search: '<circle cx="9" cy="9" r="5.5"/><path d="M13 13l4 4"/>',
  upload: '<path d="M10 13V3.5M6 7.5l4-4 4 4M4 13v3.5h12V13"/>',
  aL: '<path d="M3.5 3v14"/><rect x="6" y="5.5" width="9" height="3.5" rx=".6"/><rect x="6" y="11" width="5.5" height="3.5" rx=".6"/>',
  aCH: '<path d="M10 3v14"/><rect x="5" y="5.5" width="10" height="3.5" rx=".6"/><rect x="6.8" y="11" width="6.4" height="3.5" rx=".6"/>',
  aR: '<path d="M16.5 3v14"/><rect x="5" y="5.5" width="9" height="3.5" rx=".6"/><rect x="8.5" y="11" width="5.5" height="3.5" rx=".6"/>',
  aT: '<path d="M3 3.5h14"/><rect x="5.5" y="6" width="3.5" height="9" rx=".6"/><rect x="11" y="6" width="3.5" height="5.5" rx=".6"/>',
  aCV: '<path d="M3 10h14"/><rect x="5.5" y="5" width="3.5" height="10" rx=".6"/><rect x="11" y="6.8" width="3.5" height="6.4" rx=".6"/>',
  aB: '<path d="M3 16.5h14"/><rect x="5.5" y="5" width="3.5" height="9" rx=".6"/><rect x="11" y="8.5" width="3.5" height="5.5" rx=".6"/>',
  dH: '<path d="M3 3v14M17 3v14"/><rect x="7.7" y="6" width="4.6" height="8" rx=".6"/>',
  dV: '<path d="M3 3h14M3 17h14"/><rect x="6" y="7.7" width="8" height="4.6" rx=".6"/>',
  flipH: '<path d="M10 3v14" stroke-dasharray="1.5 1.5"/><path d="M7.5 6L3 14h4.5zM12.5 6L17 14h-4.5z" stroke-linejoin="round"/>',
  flipV: '<path d="M3 10h14" stroke-dasharray="1.5 1.5"/><path d="M6 7.5L14 3v4.5zM6 12.5l8 4.5v-4.5z" stroke-linejoin="round"/>',
  rot: '<path d="M15.5 9.5a5.5 5.5 0 11-1.8-4.2M14.5 2.5v3.3h-3.3"/>',
  radius: '<path d="M4 16V9a5 5 0 015-5h7"/>',
  corners: '<path d="M4 8V5.5A1.5 1.5 0 015.5 4H8M12 4h2.5A1.5 1.5 0 0116 5.5V8M16 12v2.5a1.5 1.5 0 01-1.5 1.5H12M8 16H5.5A1.5 1.5 0 014 14.5V12"/>',
  link: '<path d="M8.5 11.5l3-3M7.2 9.3L5.6 11a2.6 2.6 0 003.7 3.7l1.6-1.6M12.8 10.7l1.6-1.7A2.6 2.6 0 0010.7 5.3L9.1 6.9"/>',
  unlink: '<path d="M7.2 9.3L5.6 11a2.6 2.6 0 003.7 3.7l1.6-1.6M12.8 10.7l1.6-1.7A2.6 2.6 0 0010.7 5.3L9.1 6.9M4 4l2 2M16 16l-2-2"/>',
  tL: '<path d="M3.5 5h13M3.5 8.5h8M3.5 12h13M3.5 15.5h8"/>',
  tC: '<path d="M3.5 5h13M6 8.5h8M3.5 12h13M6 15.5h8"/>',
  tR: '<path d="M3.5 5h13M8.5 8.5h8M3.5 12h13M8.5 15.5h8"/>',
  under: '<path d="M6 3.5V9a4 4 0 008 0V3.5M5 17h10"/>',
  strike: '<path d="M3.5 10h13M13.5 6.5c0-1.6-1.6-2.8-3.5-2.8S6.5 4.8 6.5 6.3c0 1.2.8 2 2.4 2.5M7 13.4c0 1.6 1.4 2.9 3.4 2.9 2 0 3.5-1.1 3.5-2.7 0-.9-.4-1.6-1.2-2.1"/>',
  italic: '<path d="M8.5 4h6M5.5 16h6M11.5 4l-3 12"/>',
  caseUp: '<path d="M2.5 15l3.2-9.5h.6L9.5 15M3.6 12h4.8M11 15V5.5h3.2a2.3 2.3 0 010 4.6H11m0 0h3.6a2.5 2.5 0 010 4.9H11"/>',
  autoW: '<path d="M3 10h14M6 7l-3 3 3 3M14 7l3 3-3 3"/>',
  autoH: '<path d="M10 3v14M7 6l3-3 3 3M7 14l3 3 3-3"/><path d="M4 3h3M13 3h3" opacity=".5"/>',
  fixed: '<rect x="4" y="4" width="12" height="12" rx="1" stroke-dasharray="2 1.6"/><path d="M7 8h6M10 8v5"/>',
  drop: '<path d="M10 3.5S5 9.3 5 12.3a5 5 0 0010 0C15 9.3 10 3.5 10 3.5z"/>',
  picker: '<path d="M13.4 3.8l2.8 2.8-1.8 1.8-2.8-2.8zM12.4 7.4l-7 7L4 16l1.6-1.4 7-7"/>',
  grid: '<path d="M3 7.5h14M3 12.5h14M7.5 3v14M12.5 3v14"/>',
  ruler: '<rect x="2.5" y="6.5" width="15" height="7" rx="1"/><path d="M5.5 6.5v2.5M8.5 6.5v3.5M11.5 6.5v2.5M14.5 6.5v3.5"/>',
  crop: '<path d="M6 2.5V14h11.5M2.5 6H14v11.5"/>',
  nodes: '<path d="M4 14C7 5 13 15 16 6"/><rect x="2.5" y="12.5" width="3" height="3" fill="currentColor"/><rect x="14.5" y="4.5" width="3" height="3" fill="currentColor"/><rect x="8.5" y="8.5" width="3" height="3"/>',
  front: '<rect x="3" y="3" width="9" height="9" rx="1" opacity=".5"/><rect x="8" y="8" width="9" height="9" rx="1" fill="currentColor"/>',
  back: '<rect x="8" y="8" width="9" height="9" rx="1" opacity=".5"/><rect x="3" y="3" width="9" height="9" rx="1" fill="currentColor"/>',
  undo: '<path d="M7 5L3.5 8.5 7 12"/><path d="M3.5 8.5h8a4.5 4.5 0 010 9H9"/>',
  redo: '<path d="M13 5l3.5 3.5L13 12"/><path d="M16.5 8.5h-8a4.5 4.5 0 000 9H11"/>',
  file: '<path d="M5 3h6.5L15 6.5V17H5z"/><path d="M11.5 3v3.5H15"/>',
  save: '<path d="M4 4h9.5L16 6.5V16H4z"/><path d="M7 4v4h6V4M7 16v-5h6v5"/>',
  export: '<path d="M10 3v9.5M6.5 9L10 12.5 13.5 9M4 14v2.5h12V14"/>',
  info: '<circle cx="10" cy="10" r="7"/><path d="M10 9v4.5M10 6.4v.2"/>',
  keyboard: '<rect x="2.5" y="5" width="15" height="10" rx="1.5"/><path d="M5.5 8h1M8.5 8h1M11.5 8h1M14 8h.5M5.5 11h1M7.5 12h5M14 11h.5"/>',
  focus: '<path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"/>',
  shadow: '<rect x="3" y="3" width="10" height="10" rx="1"/><path d="M15.5 7v8.5H7" opacity=".55" stroke-width="2.2"/>',
  blur: '<circle cx="10" cy="10" r="6.5" stroke-dasharray="1.6 1.6"/><circle cx="10" cy="10" r="3"/>',
  swap: '<path d="M5 7h10l-3-3M15 13H5l3 3"/>',
  rotL: '<path d="M4.5 9.5a5.5 5.5 0 101.8-4.2M5.5 2.5v3.3h3.3"/>',
  orientP: '<rect x="6" y="3" width="8" height="14" rx="1"/>',
  orientL: '<rect x="3" y="6" width="14" height="8" rx="1"/>',
  check: '<path d="M4 10.5l4 4 8-9"/>',
  more: '<circle cx="5" cy="10" r=".9" fill="currentColor"/><circle cx="10" cy="10" r=".9" fill="currentColor"/><circle cx="15" cy="10" r=".9" fill="currentColor"/>',
  layers: '<path d="M10 3l7 4-7 4-7-4z" stroke-linejoin="round"/><path d="M3 10.5l7 4 7-4M3 14l7 4 7-4" stroke-linejoin="round"/>',
  cloud: '<path d="M6 15.5h8.2a3.3 3.3 0 00.5-6.6A4.8 4.8 0 005.4 8 3.8 3.8 0 006 15.5z" stroke-linejoin="round"/>',
  history: '<path d="M3.5 10a6.5 6.5 0 101.9-4.6M3.5 3.5v3h3"/><path d="M10 6.5V10l2.5 1.5"/>',
};
function icon(name, cls) {
  return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"${cls ? ` class="${cls}"` : ''}>${IC[name] || ''}</svg>`;
}
const TYPE_ICON = { rect: 'rect', ellipse: 'ellipse', polygon: 'polygon', star: 'star', line: 'line', path: 'path', text: 'text', image: 'image', group: 'group' };

/* ── Dreceres ── */
const KEYNAME = IS_MAC ? { Ctrl: '⌘', Shift: '⇧', Alt: '⌥', Del: '⌫', Enter: '↩' } : { Ctrl: 'Ctrl', Shift: 'Maj', Alt: 'Alt', Del: 'Supr', Enter: 'Retorn' };
function keyLabel(k) {
  if (!k) return '';
  return k.split('+').map(p => KEYNAME[p] || ({ PageUp: 'RePàg', PageDown: 'AvPàg', Esc: 'Esc', Space: 'Espai', Tab: 'Tab', Up: '↑', Down: '↓', Left: '←', Right: '→' }[p]) || p).join(IS_MAC ? '' : '+');
}
function eventKey(e) {
  if (['Control', 'Shift', 'Alt', 'Meta', 'AltGraph'].includes(e.key)) return null;
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  let k = e.key || '';
  const code = e.code || '';
  if (/^[a-z]$/i.test(k)) k = k.toUpperCase();                       // lletres segons la disposició
  else if (["+", "-", "'", '/', '[', ']', ';', '\\', '?'].includes(k)) { if (k === '?') k = '/'; } // símbols sense Maj
  else if (/^Key[A-Z]$/.test(code)) k = code.slice(3);                 // Alt/⌥ + lletra
  else if (/^Digit\d$/.test(code)) k = code.slice(5);
  else if (/^Numpad\d$/.test(code)) k = code.slice(6);
  else if (code === 'NumpadAdd' || code === 'Equal') k = '+';
  else if (code === 'NumpadSubtract' || code === 'Minus') k = '-';
  else if (code === 'BracketLeft') k = '[';
  else if (code === 'BracketRight') k = ']';
  else if (code === 'Quote') k = "'";
  else if (code === 'Slash') k = '/';
  else if (code === 'Semicolon') k = ';';
  else if (code === 'Backslash') k = '\\';
  else if (k === ' ') k = 'Space';
  else if (k === 'Escape') k = 'Esc';
  else if (k === 'Delete' || k === 'Backspace') k = 'Del';
  else if (k.startsWith('Arrow')) k = k.slice(5);
  else if (k.length === 1) k = k.toUpperCase();
  parts.push(k);
  return parts.join('+');
}
/* ── Registre d'ordres ── */
const Cmd = {
  list: new Map(),
  keys: new Map(),
  def(c) {
    this.list.set(c.id, c);
    for (const k of [].concat(c.key || [], c.alt || [])) this.keys.set(k, c.id);
    return c;
  },
  get(id) { return this.list.get(id); },
  enabled(id) { const c = this.get(id); return !!c && (!c.enabled || c.enabled()); },
  run(id, arg) {
    const c = this.get(id);
    if (!c) return false;
    if (c.enabled && !c.enabled()) return false;
    try { c.run(arg); } catch (e) { console.error(e); UI.toast('Error: ' + (e.message || e), 'err'); }
    UI.hideTip();
    return true;
  },
  byKey(k) { return this.keys.get(k); },
};

/* ── UI: menús, finestres, avisos ── */
const UI = {
  root: null, open: null, tipTimer: 0, tipEl: null,
  init() {
    this.root = $('#layerRoot');
    this.toasts = el('div', { class: 'toasts' });
    document.body.append(this.toasts);
    // tooltips
    document.addEventListener('pointerover', e => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t || t === this.tipTarget) return;
      this.hideTip();
      this.tipTarget = t;
      this.tipTimer = setTimeout(() => this.showTip(t), 550);
    });
    document.addEventListener('pointerout', e => {
      if (this.tipTarget && (!e.relatedTarget || !this.tipTarget.contains(e.relatedTarget))) this.hideTip();
    });
    document.addEventListener('pointerdown', () => this.hideTip(), true);
    // clics fora dels menús
    document.addEventListener('pointerdown', e => {
      if (!this.open) return;
      if (e.target.closest('.menu, .pop, .mb-item, .sel.open')) return;
      this.closeMenus();
    }, true);
    window.addEventListener('blur', () => this.closeMenus());
    window.addEventListener('resize', () => this.closeMenus());
  },
  showTip(t) {
    if (!t.isConnected || this.open) return;
    const label = t.getAttribute('data-tip');
    const cmd = t.getAttribute('data-cmd') ? Cmd.get(t.getAttribute('data-cmd')) : null;
    const k = t.getAttribute('data-key') || (cmd && cmd.key ? [].concat(cmd.key)[0] : '');
    const tip = el('div', { class: 'tip' }, label, k ? el('kbd', { text: keyLabel(k) }) : null);
    document.body.append(tip);
    const r = t.getBoundingClientRect(), tr = tip.getBoundingClientRect();
    let x = r.left + r.width / 2 - tr.width / 2, y = r.bottom + 6;
    if (t.closest('#toolbar')) { x = r.right + 8; y = r.top + r.height / 2 - tr.height / 2; }
    if (y + tr.height > innerHeight - 4) y = r.top - tr.height - 6;
    tip.style.left = clamp(x, 4, innerWidth - tr.width - 4) + 'px';
    tip.style.top = y + 'px';
    this.tipEl = tip;
  },
  hideTip() { clearTimeout(this.tipTimer); this.tipTarget = null; if (this.tipEl) { this.tipEl.remove(); this.tipEl = null; } },

  toast(msg, type = 'ok', ms = 2600) {
    const t = el('div', { class: 'toast ' + type }, el('i'), el('span', { text: msg }));
    this.toasts.append(t);
    while (this.toasts.children.length > 3) this.toasts.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 220); }, ms);
  },

  /* menú genèric: items = [{cmd} | {label, run, key, checked, disabled, sub:[...]} | '-' | {head}] */
  menu(items, x, y, opt = {}) {
    if (!opt.keep) this.closeMenus(opt.keepTop);
    const m = el('div', { class: 'menu' + (opt.cls ? ' ' + opt.cls : ''), role: 'menu' });
    const resolved = (typeof items === 'function' ? items() : items).filter(Boolean);
    let hotIdx = -1;
    const rows = [];
    for (const it of resolved) {
      if (it === '-') { if (m.lastChild && !m.lastChild.classList.contains('ms')) m.append(el('div', { class: 'ms' })); continue; }
      if (it.head) { m.append(el('div', { class: 'mh', text: it.head })); continue; }
      let label = it.label, key = it.key, run = it.run, checked = it.checked, disabled = it.disabled, ic = it.icon;
      if (it.cmd) {
        const c = Cmd.get(it.cmd);
        if (!c) continue;
        label = label || c.label; key = key || (c.key ? [].concat(c.key)[0] : ''); run = () => Cmd.run(it.cmd);
        disabled = c.enabled ? !c.enabled() : false;
        if (c.checked) checked = c.checked();
        ic = ic || c.icon;
      }
      if (typeof disabled === 'function') disabled = disabled();
      if (typeof checked === 'function') checked = checked();
      const row = el('div', { class: 'mi' + (it.sub ? ' sub' : '') + (disabled ? ' dis' : ''), role: 'menuitem' });
      if (checked) row.insertAdjacentHTML('beforeend', `<svg class="chk-mark" viewBox="0 0 10 10"><path d="M1.5 5.2l2.4 2.4 4.6-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`);
      else if (ic) row.insertAdjacentHTML('beforeend', icon(ic, 'mi-ico'));
      row.append(el('span', { text: label }));
      if (key) row.append(el('span', { class: 'mk', text: keyLabel(key) }));
      if (it.sub) {
        row.addEventListener('pointerenter', () => openSub());
        const openSub = () => {
          if (m._sub && m._sub._row === row) return;
          this.closeSub(m);
          const r = row.getBoundingClientRect();
          const sm = this.menu(it.sub, r.right + 2, r.top - 5, { keep: true, parentMenu: m });
          sm._row = row; m._sub = sm;
          row.classList.add('hot');
        };
        row.addEventListener('click', openSub);
      } else {
        row.addEventListener('pointerenter', () => { this.closeSub(m); });
        row.addEventListener('click', () => { if (disabled) return; this.closeMenus(); if (opt.onPick) opt.onPick(it); if (run) run(); });
      }
      row._it = it;
      rows.push(row);
      m.append(row);
    }
    if (m.lastChild && m.lastChild.classList.contains('ms')) m.lastChild.remove();
    this.root.append(m);
    const r = m.getBoundingClientRect();
    let px = x, py = y;
    if (px + r.width > innerWidth - 6) px = opt.parentMenu ? opt.parentMenu.getBoundingClientRect().left - r.width - 2 : innerWidth - r.width - 6;
    if (py + r.height > innerHeight - 6) py = Math.max(6, innerHeight - r.height - 6);
    m.style.left = Math.max(6, px) + 'px'; m.style.top = py + 'px';
    m._rows = rows; m._parent = opt.parentMenu || null;
    m._hot = hotIdx;
    if (!opt.parentMenu) { this.open = m; m._onClose = opt.onClose; }
    return m;
  },
  closeSub(m) {
    if (m._sub) { this.closeSub(m._sub); if (m._sub._row) m._sub._row.classList.remove('hot'); m._sub.remove(); m._sub = null; }
  },
  closeMenus() {
    $$('.menu, .pop', this.root).forEach(x => { if (x._onClose) x._onClose(); x.remove(); });
    $$('.mb-item.open').forEach(b => b.classList.remove('open'));
    $$('.sel.open').forEach(b => b.classList.remove('open'));
    this.open = null;
  },
  // navegació per teclat dins menús oberts
  menuKey(e) {
    if (!this.open) return false;
    let m = this.open;
    while (m._sub) m = m._sub;
    const rows = m._rows.filter(r => !r.classList.contains('dis'));
    const cur = rows.findIndex(r => r.classList.contains('hot'));
    const k = e.key;
    if (k === 'Escape') { if (m._parent) { this.closeSub(m._parent); } else this.closeMenus(); return true; }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      rows.forEach(r => r.classList.remove('hot'));
      const n = rows.length;
      const i = k === 'ArrowDown' ? (cur + 1) % n : (cur - 1 + n) % n;
      if (rows[i]) { rows[i].classList.add('hot'); rows[i].scrollIntoView({ block: 'nearest' }); }
      return true;
    }
    if (k === 'ArrowRight' && cur >= 0 && rows[cur].classList.contains('sub')) { rows[cur].click(); const s = m._sub; if (s && s._rows[0]) s._rows[0].classList.add('hot'); return true; }
    if (k === 'ArrowLeft' && m._parent) { this.closeSub(m._parent); return true; }
    if ((k === 'ArrowLeft' || k === 'ArrowRight') && !m._parent && GL.menubar) { GL.menubar.step(k === 'ArrowRight' ? 1 : -1); return true; }
    if (k === 'Enter' && cur >= 0) { rows[cur].click(); return true; }
    return false;
  },

  // finestra emergent ancorada
  pop(content, anchor, opt = {}) {
    if (!opt.keep) this.closeMenus();
    const p = el('div', { class: 'pop' + (opt.cls ? ' ' + opt.cls : '') });
    p.append(content);
    this.root.append(p);
    const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor;
    const pr = p.getBoundingClientRect();
    let x = opt.side === 'left' ? r.left - pr.width - 8 : r.left;
    let y = opt.side === 'left' ? r.top - 10 : r.bottom + 6;
    if (x < 6) x = r.right + 8;
    if (y + pr.height > innerHeight - 8) y = Math.max(8, innerHeight - pr.height - 8);
    if (x + pr.width > innerWidth - 8) x = innerWidth - pr.width - 8;
    p.style.left = x + 'px'; p.style.top = y + 'px';
    this.open = p; p._onClose = opt.onClose;
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => this.fitPop(p)); ro.observe(p); }
    return p;
  },
  fitPop(p) {
    if (!p.isConnected) return;
    const r = p.getBoundingClientRect();
    if (r.bottom > innerHeight - 8) p.style.top = Math.max(8, innerHeight - r.height - 8) + 'px';
    if (r.right > innerWidth - 8) p.style.left = Math.max(8, innerWidth - r.width - 8) + 'px';
  },

  // desplegable personalitzat
  dropdown(anchor, options, cur, onPick, opt = {}) {
    anchor.classList.add('open');
    const r = anchor.getBoundingClientRect();
    const m = this.menu(options.map(o => ({ label: o.label, value: o.value, run: () => onPick(o.value), style: o.style })), r.left, r.bottom + 4, { cls: 'dd', onClose: () => anchor.classList.remove('open') });
    m.style.minWidth = Math.max(r.width, 140) + 'px';
    m._rows.forEach(row => {
      const it = row._it;
      if (eq(it.value, cur)) { row.classList.add('cur'); requestAnimationFrame(() => row.scrollIntoView({ block: 'nearest' })); }
      if (it.style) Object.assign(row.firstChild.style, it.style);
    });
    anchor.classList.add('open');
    return m;
  },

  // diàleg modal
  dialog({ title, body, buttons = [], width, onClose, cls }) {
    return new Promise(res => {
      const prev = document.activeElement;
      const veil = el('div', { class: 'veil' });
      const dlg = el('div', { class: 'dlg' + (cls ? ' ' + cls : ''), role: 'dialog', 'aria-modal': 'true' });
      if (width) dlg.style.width = `min(${width}px, calc(100vw - 32px))`;
      const stack = UI._dlgs || (UI._dlgs = []);
      const close = v => { veil.remove(); document.removeEventListener('keydown', onKey, true); const i = stack.indexOf(close); if (i >= 0) stack.splice(i, 1); if (onClose) onClose(v); res(v); if (prev && prev.focus) prev.focus(); };
      stack.push(close);
      const head = el('div', { class: 'dlg-h' }, el('span', { text: title }), el('button', { class: 'icon-btn sm', html: icon('close'), onclick: () => close(null), 'aria-label': 'Tanca' }));
      const b = el('div', { class: 'dlg-b' });
      if (typeof body === 'string') b.innerHTML = body; else if (body) b.append(body);
      dlg.append(head, b);
      if (buttons.length) {
        const f = el('div', { class: 'dlg-f' });
        for (const bt of buttons) {
          const btn = el('button', { class: 'btn' + (bt.primary ? ' primary' : '') + (bt.ghost ? ' ghost' : '') + (bt.danger ? ' danger' : ''), text: bt.label });
          btn.addEventListener('click', async () => {
            if (bt.run) { const r = await bt.run(); if (r === false) return; close(r === undefined ? bt.value : r); }
            else close(bt.value);
          });
          f.append(btn);
          bt._el = btn;
        }
        dlg.append(f);
      }
      const onKey = e => {
        if (stack[stack.length - 1] !== close) return; // només el diàleg superior respon al teclat
        if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(null); }
        else if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA' && !e.target.closest('.sel')) {
          const p = buttons.find(x => x.primary);
          if (p && p._el) { e.preventDefault(); e.stopPropagation(); p._el.click(); }
        }
        e.stopPropagation();
      };
      document.addEventListener('keydown', onKey, true);
      veil.addEventListener('pointerdown', e => { if (e.target === veil) close(null); });
      veil.append(dlg);
      document.body.append(veil);
      const f = dlg.querySelector('input:not([type=checkbox]), .btn.primary');
      if (f) setTimeout(() => { f.focus(); if (f.select) f.select(); }, 20);
      dlg._close = close;
    });
  },
  async prompt(title, label, value) {
    const inp = el('input', { class: '', value: value || '', spellcheck: 'false' });
    const fld = el('div', { class: 'fld plain' }, inp);
    const body = el('div', null, el('div', { class: 'lbl', text: label, style: { marginBottom: '6px' } }), fld);
    const r = await this.dialog({ title, body, buttons: [{ label: 'Cancel·la', ghost: true, value: null }, { label: "D'acord", primary: true, run: () => inp.value }] });
    return r;
  },
  confirm(title, text, ok = "D'acord", danger) {
    return this.dialog({ title, body: el('p', { text }), buttons: [{ label: 'Cancel·la', ghost: true, value: false }, { label: ok, primary: !danger, danger, value: true }] });
  },
};

/* ── Paleta d'ordres ── */
const Palette = {
  recent: [],
  open() {
    if ($('.cmdk')) return;
    UI.closeMenus();
    const veil = el('div', { class: 'veil', style: { background: 'rgba(5,6,6,.35)', backdropFilter: 'none' } });
    const box = el('div', { class: 'cmdk' });
    const inp = el('input', { placeholder: 'Busca una ordre…', spellcheck: 'false' });
    const list = el('div', { class: 'cmdk-list' });
    box.append(el('span', { html: icon('search', 'ck-ico') }), inp, list);
    veil.append(box);
    document.body.append(veil);
    let hot = 0, items = [];
    const paths = GL.menuPaths || {};
    const render = () => {
      const q = norm(inp.value.trim());
      const all = Array.from(Cmd.list.values()).filter(c => !c.hidden);
      let scored = all.map(c => {
        const lab = norm(c.label), path = norm(paths[c.id] || '');
        let s = 0;
        if (!q) s = 1 + (this.recent.includes(c.id) ? 10 - this.recent.indexOf(c.id) : 0);
        else if (lab.startsWith(q)) s = 100;
        else if (lab.includes(q)) s = 60;
        else if ((path + ' ' + lab).includes(q)) s = 30;
        else { // subseqüència
          let i = 0; for (const ch of lab) if (ch === q[i]) i++;
          if (i === q.length) s = 10;
        }
        const en = Cmd.enabled(c.id);
        return { c, s: s > 0 ? s + (en ? 1000 : 0) : 0, en };
      }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
      const enabled = new Set(scored.filter(x => x.en).map(x => x.c.id));
      items = scored.slice(0, 60).map(x => x.c);
      hot = Math.min(hot, Math.max(0, items.length - 1));
      list.textContent = '';
      if (!items.length) list.append(el('div', { class: 'ck-empty', text: 'Cap ordre coincideix' }));
      items.forEach((c, i) => {
        const lab = el('span');
        const L = c.label, nl = norm(L), qi = q ? nl.indexOf(q) : -1;
        if (qi >= 0) lab.append(L.slice(0, qi), el('b', { text: L.slice(qi, qi + q.length) }), L.slice(qi + q.length));
        else lab.textContent = L;
        const row = el('div', { class: 'ck-item' + (i === hot ? ' hot' : '') + (enabled.has(c.id) ? '' : ' dis') }, lab, paths[c.id] ? el('span', { class: 'ck-path', text: paths[c.id] }) : null, c.key ? el('span', { class: 'mk', text: keyLabel([].concat(c.key)[0]) }) : null);
        row.addEventListener('pointermove', () => { if (hot !== i) { hot = i; render(); } });
        row.addEventListener('click', () => pick(c));
        list.append(row);
      });
      const h = list.querySelector('.hot'); if (h) h.scrollIntoView({ block: 'nearest' });
    };
    const close = () => { veil.remove(); };
    const pick = c => {
      if (!Cmd.enabled(c.id)) { UI.toast('«' + c.label + '» no està disponible ara mateix', 'warn'); return; }
      close();
      this.recent = [c.id].concat(this.recent.filter(x => x !== c.id)).slice(0, 8);
      setTimeout(() => Cmd.run(c.id), 0);
    };
    inp.addEventListener('input', () => { hot = 0; render(); });
    inp.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'ArrowDown') { hot = Math.min(items.length - 1, hot + 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { hot = Math.max(0, hot - 1); render(); e.preventDefault(); }
      else if (e.key === 'Enter') { if (items[hot]) pick(items[hot]); e.preventDefault(); }
      else if (e.key === 'Escape') { close(); e.preventDefault(); }
    });
    veil.addEventListener('pointerdown', e => { if (e.target === veil) close(); });
    render();
    inp.focus();
  },
};

GL.UI = UI; GL.Cmd = Cmd; GL.icon = icon; GL.Palette = Palette;
