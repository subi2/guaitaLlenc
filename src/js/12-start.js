/* ── Pantalla d'inici ────────────────────────────────────────── */
const Start = GL.start = {
  veil: null, recentCache: [],
  async refreshRecents() { try { this.recentCache = await Autosave.list(); } catch (e) { this.recentCache = []; } return this.recentCache; },
  async open(first) {
    if (this.veil) return;
    UI.closeMenus();
    const recents = await this.refreshRecents();
    const veil = this.veil = el('div', { class: 'veil' });
    const box = el('div', { class: 'start', role: 'dialog', 'aria-label': 'Inici' });
    // estat del formulari
    let sel = PAGE_PRESETS[0], land = false, transparent = false;
    let cw = sel.w, ch = sel.h, unit = sel.unit;
    // columna principal
    const main = el('div', { class: 'st-main' });
    main.append(el('div', { class: 'st-brand', html: `<svg viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M11 21 L21 11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><span class="n">guaita<b>Llenç</b></span><span class="v">v${VERSION}</span>` }));
    const presets = el('div', { class: 'st-presets' });
    const tiles = [];
    for (const [g, title] of [['paper', 'Paper i impressió'], ['screen', 'Pantalla i xarxes']]) {
      const grp = el('div', { class: 'st-group' }, el('div', { class: 'st-h', text: title }));
      const grid = el('div', { class: 'st-grid' });
      for (const p of PAGE_PRESETS.filter(x => x.g === g)) {
        const k = 54 / Math.max(p.w, p.h);
        const t = el('button', { class: 'preset', type: 'button' }, el('div', { class: 'shape' }, el('i', { style: { width: p.w * k + 'px', height: p.h * k + 'px' } })), el('div', { class: 'pn', text: p.name }), el('div', { class: 'pd', text: p.desc }));
        t.addEventListener('click', () => { sel = p; land = false; cw = p.w; ch = p.h; unit = p.unit; sync(); });
        t.addEventListener('dblclick', () => create());
        t._p = p; tiles.push(t); grid.append(t);
      }
      grp.append(grid); presets.append(grp);
    }
    const seg = el('div', { class: 'seg st-seg' });
    const bBlank = el('button', { type: 'button', text: 'Document en blanc', class: 'on' }), bTpl = el('button', { type: 'button', text: 'Plantilles' });
    seg.append(bBlank, bTpl);
    const tplBox = el('div', { class: 'st-presets', hidden: true });
    const showTpl = v => { bBlank.classList.toggle('on', !v); bTpl.classList.toggle('on', v); presets.hidden = v; tplBox.hidden = !v; foot.style.display = v ? 'none' : ''; if (v && !tplBox.childNodes.length) fillTpl(); };
    bBlank.addEventListener('click', () => showTpl(false)); bTpl.addEventListener('click', () => showTpl(true));
    const fillTpl = () => {
      tplBox.textContent = '';
      let all = GL.catalog.templates();
      if (GL.kids.on) all = all.filter(t => t.kids || t.user).concat(all.filter(t => !t.kids && !t.user));
      let cur = null, grid = null;
      for (const t of all) {
        if (t.cat !== cur) { cur = t.cat; const grp = el('div', { class: 'st-group' }, el('div', { class: 'st-h', text: t.cat + (t.src !== 'Guaita' && t.src !== 'Els meus' ? ' · ' + t.src : '') })); grid = el('div', { class: 'st-tpl' }); grp.append(grid); tplBox.append(grp); }
        grid.append(GL.tplCard(t, () => t.create()));
      }
      if (!GL.packs.list.length) tplBox.append(GL.libPanel.packHint());
    };
    this.refillTpl = () => { if (!tplBox.hidden) fillTpl(); else tplBox.textContent = ''; };
    const kidsT = el('label', { class: 'chk st-kids', 'data-tip': 'Interfície simplificada, tipografies arrodonides i contingut per a nens' }, el('input', { type: 'checkbox' }), 'Mode infantil');
    kidsT.firstChild.checked = GL.kids.on;
    kidsT.firstChild.addEventListener('change', e => { GL.kids.set(e.target.checked); if (e.target.checked) showTpl(true); else fillTpl(); });
    main.append(el('div', { class: 'st-top' }, seg, kidsT), presets, tplBox);
    if (GL.kids.on) setTimeout(() => showTpl(true), 0);
    // peu: personalitzada
    const foot = el('div', { class: 'st-foot' });
    const wIn = el('input', { inputmode: 'decimal' }), hIn = el('input', { inputmode: 'decimal' });
    const wF = el('div', { class: 'fld' }, el('span', { class: 'fl', text: 'W' }), wIn), hF = el('div', { class: 'fld' }, el('span', { class: 'fl', text: 'H' }), hIn);
    const uBtn = el('button', { class: 'sel', type: 'button', style: { width: '70px' } });
    const orient = el('div', { class: 'ibar', style: { width: '64px' } });
    const oP = el('button', { type: 'button', html: icon('orientP'), 'data-tip': 'Vertical' }), oL = el('button', { type: 'button', html: icon('orientL'), 'data-tip': 'Horitzontal' });
    orient.append(oP, oL);
    const bgT = el('label', { class: 'chk' }, el('input', { type: 'checkbox' }), 'Fons transparent');
    const go = el('button', { class: 'btn primary lg', text: 'Crea el document' });
    foot.append(wF, el('span', { class: 'lbl', text: '×' }), hF, uBtn, orient, bgT, el('span', { style: { flex: 1 } }), go);
    main.append(foot);
    const readCustom = () => {
      const w = evalExpr(wIn.value, { unit }), h = evalExpr(hIn.value, { unit });
      if (isFinite(w) && w > 0) cw = fromU(w, unit);
      if (isFinite(h) && h > 0) ch = fromU(h, unit);
      sel = null;
    };
    for (const inp of [wIn, hIn]) {
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { readCustom(); create(); } });
      inp.addEventListener('change', () => { readCustom(); land = cw > ch; sync(); });
    }
    oP.addEventListener('click', () => { if (cw > ch) { [cw, ch] = [ch, cw]; } land = false; sync(); });
    oL.addEventListener('click', () => { if (cw < ch) { [cw, ch] = [ch, cw]; } land = true; sync(); });
    uBtn.addEventListener('click', () => UI.dropdown(uBtn, Object.keys(UNITS).map(u => ({ label: u, value: u })), unit, v => { unit = v; sync(); }));
    bgT.firstChild.addEventListener('change', e => { transparent = e.target.checked; });
    const sync = () => {
      tiles.forEach(t => t.classList.toggle('on', !!sel && t._p === sel));
      wIn.value = fmtNum(toU(cw, unit), UNIT_DEC[unit]);
      hIn.value = fmtNum(toU(ch, unit), UNIT_DEC[unit]);
      uBtn.textContent = unit;
      oP.classList.toggle('on', ch >= cw); oL.classList.toggle('on', cw > ch);
    };
    const create = () => {
      const name = 'Sense títol';
      const doc = Store.blankDoc({ name, unit, w: rnd(cw, 3), h: rnd(ch, 3), bg: transparent ? '#ffffff00' : '#ffffffff', grid: unit === 'px' ? 10 : fromU(5, 'mm') });
      this.close();
      App.loadDoc(doc, []);
      $('#docName').value = name;
      Autosave.now();
      setTimeout(() => App.stage.focus({ preventScroll: true }), 30);
    };
    go.addEventListener('click', create);
    sync();
    // columna lateral
    const side = el('div', { class: 'st-side' });
    const openB = el('button', { class: 'st-open', type: 'button', html: `${icon('upload')}<span>Obre un document o una imatge</span><small>.llenc · SVG · PNG · JPG — o arrossega'ls aquí</small>` });
    openB.addEventListener('click', () => IO.openPicker());
    const packB = el('button', { class: 'btn ghost', type: 'button', html: icon('layers') + '<span>Paquets de biblioteca…</span>' });
    packB.querySelector('svg').style.width = '14px';
    packB.addEventListener('click', async () => { await GL.packsDialog(); this.refillTpl && this.refillTpl(); });
    side.append(openB, packB, el('div', { class: 'st-h', text: 'Recents', style: { marginTop: '10px' } }));
    const list = el('div', { class: 'st-recents' });
    if (!recents.length) list.append(el('div', { class: 'st-empty', text: 'Els documents es desen automàticament en aquest navegador i apareixeran aquí.' }));
    recents.slice(0, 30).forEach((r, i) => {
      const th = el('div', { class: 'th' });
      if (r.thumb) { th.innerHTML = r.thumb; const s = th.querySelector('svg'); if (s) { s.removeAttribute('width'); s.removeAttribute('height'); } }
      const cont = i === 0 && first;
      const x = el('button', { class: 'icon-btn sm x', html: icon('close'), 'data-tip': 'Treu dels recents' });
      x.addEventListener('click', async e => { e.stopPropagation(); await Autosave.remove(r.id); row.remove(); });
      const row = el('div', { class: 'rc' + (cont ? ' cont' : '') }, th, el('div', { class: 'meta' }, el('div', { class: 'nm', text: r.name || 'Sense títol' }), el('div', { class: 'dt', text: cont ? 'Continua on ho vas deixar' : relTime(r.updated) + (r.pages > 1 ? ` · ${r.pages} pàgines` : '') })), x);
      row.addEventListener('click', () => this.openRecent(r.id));
      list.append(row);
    });
    side.append(list, el('div', { class: 'st-legal', html: `© 2026 SBS BiM Consulting, Jordi Subirós · <span style="white-space:nowrap">AGPL-3.0-only</span><br>Funciona sense connexió · res surt del teu ordinador` }));
    box.append(main, side);
    veil.append(box);
    document.body.append(veil);
    // arrossegar sobre la zona d'obrir
    openB.addEventListener('dragover', e => { e.preventDefault(); openB.classList.add('drag'); });
    openB.addEventListener('dragleave', () => openB.classList.remove('drag'));
    this.onKey = e => {
      if (e.key === 'Escape' && App.store.doc) { e.preventDefault(); e.stopPropagation(); this.close(); }
      else if (e.key === 'Enter' && !e.target.closest('input')) { e.preventDefault(); create(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); IO.openPicker(); }
    };
    document.addEventListener('keydown', this.onKey, true);
    veil.addEventListener('pointerdown', e => { if (e.target === veil && App.store.doc) this.close(); });
    go.focus();
  },
  close() {
    if (!this.veil) return;
    this.veil.remove(); this.veil = null;
    document.removeEventListener('keydown', this.onKey, true);
  },
  async openRecent(id) {
    const r = await Autosave.get(id);
    if (!r) { UI.toast('No s\'ha trobat el document', 'err'); return; }
    try {
      const data = IO.parse(r.data);
      this.close();
      App.loadDoc(data.doc, data.log || [], { ts: data.ts });
      $('#docName').value = App.store.props.name;
      Autosave.autoVersion = App.store.version;
      GL.saveState();
    } catch (e) { UI.toast(e.message, 'err'); }
  },
};
function relTime(t) {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return 'ara mateix';
  if (d < 3600) return `fa ${Math.round(d / 60)} min`;
  if (d < 86400) return `fa ${Math.round(d / 3600)} h`;
  if (d < 86400 * 7) { const n = Math.round(d / 86400); return `fa ${n} ${n === 1 ? 'dia' : 'dies'}`; }
  return new Date(t).toLocaleDateString('ca', { day: 'numeric', month: 'short', year: 'numeric' });
}
