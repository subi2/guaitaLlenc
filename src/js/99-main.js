/* ── Arrencada ───────────────────────────────────────────────── */
function bindChrome() {
  // nom del document
  const dn = $('#docName');
  dn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') { if (e.key === 'Escape') dn.value = App.store.props.name; dn.blur(); App.stage.focus(); } });
  dn.addEventListener('change', () => { const v = dn.value.trim() || 'Sense títol'; dn.value = v; App.store.begin('Reanomena el document'); App.store.setDoc('name', v); App.store.commit(); });
  App.store.on(ch => {
    if (!App.store.doc) return;
    if ((ch.doc || ch.all) && document.activeElement !== dn) dn.value = App.store.props.name;
    document.title = App.store.props.name + ' — guaitaLlenç';
  });
  // vista
  $$('#viewSeg button').forEach(b => b.addEventListener('click', () => App.setView(b.dataset.view)));
  // zoom
  $('#zoomBtn').addEventListener('click', () => {
    const r = $('#zoomBtn').getBoundingClientRect();
    const z = v => ({ label: Math.round(v * 100) + '%', checked: Math.abs(App.z - v) < 1e-3, run: () => { const { w, h } = App.stageSize(); App.zoomAt(v, w / 2, h / 2); } });
    UI.menu([{ cmd: 'view.zoomIn' }, { cmd: 'view.zoomOut' }, '-', { cmd: 'view.fit' }, { cmd: 'view.fitSel' }, '-', z(0.25), z(0.5), z(1), z(2), z(4)], r.right - 220, r.bottom + 4);
  });
  $('#stUnit').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); UI.menu(unitItems(), r.left, r.top - 180); });
  App.store.on(() => { if (App.store.doc) $('#stUnit').textContent = App.store.props.unit; });
  // botons amb ordre associada
  $$('[data-cmd]').forEach(b => {
    if (b.closest('#toolbar') || b.closest('.align-bar')) return;
    const c = Cmd.get(b.dataset.cmd);
    if (b.classList.contains('icon-btn') && !b.innerHTML.trim() && c && c.icon) b.innerHTML = icon(c.icon);
    if (!b._bound) { b._bound = true; b.addEventListener('click', () => Cmd.run(b.dataset.cmd)); }
  });
  // separador propietats/capes
  const sp = $('#panelSplit'), pp = $('#propsPanel'), lp = $('#layersPanel');
  sp.addEventListener('pointerdown', e => {
    e.preventDefault(); sp.setPointerCapture(e.pointerId); sp.classList.add('drag');
    const rp = $('#rightPanel').getBoundingClientRect();
    const mv = ev => { const f = clamp((ev.clientY - rp.top) / rp.height, 0.15, 0.88); pp.style.flex = `0 0 ${f * 100}%`; lp.style.flex = '1 1 0'; };
    const up = () => { sp.classList.remove('drag'); sp.removeEventListener('pointermove', mv); sp.removeEventListener('pointerup', up); };
    sp.addEventListener('pointermove', mv); sp.addEventListener('pointerup', up);
  });
  // amplada del panell dret
  const rz = $('#rightResize');
  rz.addEventListener('pointerdown', e => {
    e.preventDefault(); rz.setPointerCapture(e.pointerId);
    const mv = ev => { document.documentElement.style.setProperty('--rp', clamp(innerWidth - ev.clientX, 220, 440) + 'px'); };
    const up = () => { rz.removeEventListener('pointermove', mv); rz.removeEventListener('pointerup', up); App.applyView(); };
    rz.addEventListener('pointermove', mv); rz.addEventListener('pointerup', up);
  });
  App.on('sel', () => setHint());
  App.on('sel', () => {
    const b = App.selWorldBox();
    const e = $('#stSel');
    if (!b || !App.sel.length) { e.textContent = ''; return; }
    const u = App.store.props.unit;
    e.textContent = `${App.sel.length > 1 ? App.sel.length + ' obj. · ' : ''}${fmtLen(b.w, u)} × ${fmtLen(b.h, u)} ${u}`;
  });
  App.store.on(rafThrottle(() => { if (!App.sel.length) return; App.emit('selbox'); }));
}
App.listeners.selbox = new Set();

async function boot() {
  FontKit.install();
  UI.init();
  App.init();
  defineCommands();
  Menubar.init(menuDefs());
  Toolbar.init();
  LibPanel.init();
  Kids.init();
  TextEdit.init();
  Pointer.init();
  Props.init();
  Layers.init();
  PagesStrip.init();
  Keys.init();
  Clip.init();
  Drop.init();
  Autosave.init();
  GH.init();
  bindChrome();
  setTool('select');
  try { await FontKit.ready(); } catch (e) { }
  TextKit.cache.clear(); TextKit.metricsCache.clear();
  await Packs.init();
  PWA.register();
  await Start.open(true);
  // tecla de focus perduda: torna al llenç
  App.stage.addEventListener('pointerdown', () => { if (document.activeElement === document.body) App.stage.focus({ preventScroll: true }); });
}

GL.boot = boot;
if (!TEST) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}
