/* ── GitHub asíncron: sincronització, historial i autoria (v0.13) ──
   Al repositori, cada document és una carpeta <dir>/<nom>-<id>/ amb
     doc.llenc            instantània completa (+ marques de temps, autors)
     ops/<actor>.jsonl    registre d'operacions de cada editor
   Cada editor només escriu el seu fitxer d'operacions; la instantània es
   desa amb control de versió (sha) i, si hi ha conflicte, es torna a fusionar. */
const GH_FILE = 'doc.llenc';
const GH_KEY = 'guaitaLlenc.gh', GH_DOCS = 'guaitaLlenc.gh.docs';

const encPath = p => p.split('/').map(encodeURIComponent).join('/');
function ghMsg(status, m) {
  if (status === 401) return 'El token de GitHub no és vàlid o ha caducat.';
  if (status === 403) return 'GitHub ha denegat l\'accés (permisos del token o límit de peticions).';
  if (status === 404) return 'Repositori o branca no trobats, o el token no hi té accés.';
  if (status === 409 || status === 422) return 'Conflicte: el fitxer ha canviat al repositori.';
  return 'GitHub ' + status + (m ? ': ' + m : '');
}

/* ── Adaptador REST (es pot substituir en proves) ── */
class GhRest {
  constructor(cfg) { this.cfg = cfg; }
  get base() { return '/repos/' + this.cfg.repo; }
  async call(method, url, body, raw) {
    let r;
    try {
      r = await fetch('https://api.github.com' + url, {
        method, cache: 'no-store',
        headers: Object.assign({ Authorization: 'Bearer ' + this.cfg.token, Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, body ? { 'Content-Type': 'application/json' } : {}),
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) { const er = new Error('Sense connexió amb GitHub.'); er.status = 0; throw er; }
    if (r.status === 404 && method === 'GET') return null;
    if (!r.ok) {
      let m = ''; try { m = (await r.json()).message || ''; } catch (e) { }
      const er = new Error(ghMsg(r.status, m)); er.status = r.status; er.conflict = r.status === 409 || r.status === 422; throw er;
    }
    return raw ? r.text() : r.json();
  }
  user() { return this.call('GET', '/user'); }
  repo() { return this.call('GET', this.base); }
  async list(path) {
    const r = await this.call('GET', `${this.base}/contents/${encPath(path)}?ref=${encodeURIComponent(this.cfg.branch)}`);
    return Array.isArray(r) ? r.map(e => ({ name: e.name, sha: e.sha, type: e.type })) : null;
  }
  read(path, ref) { return this.call('GET', `${this.base}/contents/${encPath(path)}?ref=${encodeURIComponent(ref || this.cfg.branch)}`, null, true); }
  async write(path, text, sha, message) {
    const body = { message, branch: this.cfg.branch, content: b64FromBytes(utf8.enc(text)) };
    if (sha) body.sha = sha;
    const r = await this.call('PUT', `${this.base}/contents/${encPath(path)}`, body);
    return r.content.sha;
  }
  async commits(path) {
    const r = await this.call('GET', `${this.base}/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(this.cfg.branch)}&per_page=60`);
    return (r || []).map(c => ({ sha: c.sha, date: c.commit.author.date, message: c.commit.message, name: c.commit.author.name, login: c.author && c.author.login, avatar: c.author && c.author.avatar_url }));
  }
}

/* ── Comparació, restauració i vista prèvia de versions ── */
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
const ceq = (a, b) => a === b || canon(a) === canon(b);
const DIFF_SKIP = new Set(['modified', 'app', 'created']);

function diffDocs(A, B) { // A: anterior · B: nova
  const d = { objs: { added: [], removed: [], changed: [] }, pages: { added: [], removed: [], changed: [] }, props: [], assets: [] };
  const keys = (x, y) => { const out = []; for (const k of new Set(Object.keys(x).concat(Object.keys(y)))) if (!ceq(x[k], y[k])) out.push(k); return out; };
  for (const coll of ['objs', 'pages']) {
    for (const id in B[coll]) {
      if (!A[coll][id]) d[coll].added.push(id);
      else { const ks = keys(A[coll][id], B[coll][id]); if (ks.length) d[coll].changed.push({ id, keys: ks }); }
    }
    for (const id in A[coll]) if (!B[coll][id]) d[coll].removed.push(id);
  }
  d.props = keys(A.props || {}, B.props || {}).filter(k => !DIFF_SKIP.has(k));
  for (const id in (B.assets || {})) if (!(A.assets || {})[id]) d.assets.push(id);
  return d;
}
const diffCount = d => d.objs.added.length + d.objs.removed.length + d.objs.changed.length + d.pages.added.length + d.pages.removed.length + d.pages.changed.length + d.props.length;

// Aplica l'estat d'una versió antiga com a operacions noves (desfeble i sincronitzable)
function restoreInto(store, target) {
  const cur = store.doc;
  const d = diffDocs(cur, target);
  const depth = (id, doc) => { let n = 0, o = doc.objs[id]; while (o && doc.objs[o.parent]) { n++; o = doc.objs[o.parent]; } return n; };
  store.begin('Restaura versió');
  try {
    for (const id of d.assets) store.op('a', 'add', id, clone(target.assets[id]));
    for (const id of d.pages.added) store.op('p', 'add', id, clone(target.pages[id]));
    for (const c of d.pages.changed) for (const k of c.keys) store.op('p', 'set', c.id, k, target.pages[c.id][k]);
    for (const id of d.objs.removed.sort((a, b) => depth(b, cur) - depth(a, cur))) store.op('o', 'del', id);
    for (const id of d.objs.added.sort((a, b) => depth(a, target) - depth(b, target))) store.op('o', 'add', id, clone(target.objs[id]));
    for (const c of d.objs.changed) for (const k of c.keys) store.op('o', 'set', c.id, k, target.objs[c.id][k]);
    for (const id of d.pages.removed) store.op('p', 'del', id);
    for (const k of d.props) store.op('d', 'set', 'doc', k, target.props[k]);
  } finally { store.commit(); }
  return d;
}

function ghPreview(doc, pageId) {
  const st = new Store(); st.doc = doc; st.listeners.clear();
  const prev = R.curDoc; R.curDoc = doc;
  try { return R.pageSVG(pageId, { store: st, pre: 'gh' + uid(4) + '-' }).replace(/<style>[\s\S]*?<\/style>/, ''); }
  catch (e) { console.warn(e); return ''; } finally { R.curDoc = prev; }
}

// Redueix les operacions pendents: només l'última «set» per clau
function compactOps(ops) {
  const out = [], last = new Map();
  for (const op of ops) {
    if (op.t === 'set') {
      const k = op.c + '|' + op.id + '|' + op.k;
      if (last.has(k)) out[last.get(k)] = null;
      last.set(k, out.length);
    } else for (const [k] of last) if (k.startsWith(op.c + '|' + op.id + '|')) last.delete(k);
    out.push(op);
  }
  return out.filter(Boolean);
}

/* ── Nucli de sincronització (independent de la interfície) ── */
class GhSync {
  constructor({ store, api, path, state, user }) {
    this.store = store; this.api = api; this.path = path; this.user = user || null;
    this.me = store.actor;
    const s = this.st = state || {};
    s.opsSha = s.opsSha || {}; s.seen = s.seen || {}; s.pushedL = s.pushedL || 0; s.authors = s.authors || {};
  }
  get myFile() { return this.me + '.jsonl'; }
  pending() { return this.store.log.filter(o => o.a === this.me && o.l > this.st.pushedL); }

  async pull() {
    const { store, api, path, st } = this;
    const res = { applied: 0, assets: 0, remoteExists: false };
    const dir = await api.list(path);
    const snapE = dir && dir.find(e => e.name === GH_FILE);
    res.remoteExists = !!snapE;
    const opsDir = dir ? await api.list(path + '/ops') : null;
    const ops = [];
    for (const e of opsDir || []) {
      const actor = e.name.replace(/\.jsonl$/, '');
      if (actor === this.me) { st.opsSha[e.name] = e.sha; continue; }
      if (st.opsSha[e.name] === e.sha) continue;
      const text = await api.read(path + '/ops/' + e.name);
      for (const line of (text || '').split('\n')) {
        if (!line) continue;
        let op; try { op = JSON.parse(line); } catch (x) { continue; }
        if (op.l > (st.seen[actor] || 0)) ops.push(op);
      }
      st.opsSha[e.name] = e.sha;
    }
    ops.sort((a, b) => a.l - b.l || (a.a < b.a ? -1 : a.a > b.a ? 1 : 0));
    for (const op of ops) {
      if (op.l > (st.seen[op.a] || 0)) st.seen[op.a] = op.l;
      if (op.c === 'a' && op.t === 'add') continue; // les dades dels actius venen a la instantània
      if (store.applyRemote(op)) res.applied++;
    }
    const missing = Object.values(store.doc.objs).some(o => o.asset && !store.doc.assets[o.asset]);
    if (snapE && (snapE.sha !== st.snapSha || missing)) {
      const text = await api.read(path + '/' + GH_FILE);
      if (text) {
        const snap = JSON.parse(text);
        for (const id in (snap.doc.assets || {})) if (!store.doc.assets[id]) { store.doc.assets[id] = snap.doc.assets[id]; store.touch('a', id); store.version++; res.assets++; }
        for (const k in (snap.authors || {})) if (k !== this.me) st.authors[k] = snap.authors[k];
      }
    }
    if (snapE) st.snapSha = snapE.sha;
    return res;
  }

  snapshot() {
    const { store, st } = this;
    const data = IO.serialize({ noLog: true, store });
    data.ts = store.exportTs(); data.clock = store.clock; data.seen = Object.assign({}, st.seen); data.authors = st.authors;
    return data;
  }

  async push(res, message) {
    const { store, api, path, st } = this;
    const raw = this.pending();
    const mine = compactOps(raw);
    let authorsChanged = false;
    if (this.user && !ceq(st.authors[this.me], this.user)) { st.authors[this.me] = this.user; authorsChanged = true; }
    const need = mine.length || res.applied || res.assets || !res.remoteExists || authorsChanged || st.snapDirty;
    if (!need) return false;
    const msg = message || `guaitaLlenç · ${store.props.name} · ${mine.length} canvis`;
    if (mine.length) {
      const file = path + '/ops/' + this.myFile;
      let text = st.opsSha[this.myFile] ? (await api.read(file)) || '' : '';
      if (text && !text.endsWith('\n')) text += '\n';
      text += mine.map(o => JSON.stringify(o)).join('\n') + '\n';
      st.opsSha[this.myFile] = await api.write(file, text, st.opsSha[this.myFile], msg);
      st.pushedL = Math.max.apply(null, raw.map(o => o.l));
      st.seen[this.me] = st.pushedL;
      st.snapDirty = true;
    }
    st.snapSha = await api.write(path + '/' + GH_FILE, JSON.stringify(this.snapshot()), st.snapSha || undefined, msg);
    st.snapDirty = false;
    st.lastSync = Date.now();
    return true;
  }

  async sync(message) {
    let last;
    for (let i = 0; i < 4; i++) {
      const res = await this.pull();
      try { res.pushed = await this.push(res, message); this.st.lastSync = Date.now(); return res; }
      catch (e) { if (!e.conflict) throw e; last = e; }
    }
    throw last;
  }

  /* ── historial ── */
  history() { return this.api.commits(this.path + '/' + GH_FILE); }
  async version(sha) {
    const text = await this.api.read(this.path + '/' + GH_FILE, sha);
    if (!text) throw new Error('No s\'ha trobat aquesta versió.');
    return IO.parse(text);
  }
  // recompte d'objectes per últim editor
  contributors() {
    const st = this.store, cnt = {};
    for (const id in st.doc.objs) { const e = st.lastEditor(id); if (e) cnt[e.a] = (cnt[e.a] || 0) + 1; }
    return Object.keys(cnt).map(a => ({ actor: a, n: cnt[a], who: this.st.authors[a] || null })).sort((x, y) => y.n - x.n);
  }
}

/* ── Interfície ── */
const GH = GL.gh = {
  cfg: { token: '', repo: '', branch: 'main', dir: 'guaitaLlenc', remember: false, auto: 0, user: null },
  docs: {}, busy: false, sync: null,
  GhRest, GhSync, diffDocs, restoreInto, compactOps, canon,

  init() {
    try {
      const c = JSON.parse(localStorage.getItem(GH_KEY) || 'null'); if (c) Object.assign(this.cfg, c);
      this.docs = JSON.parse(localStorage.getItem(GH_DOCS) || '{}') || {};
    } catch (e) { }
    const b = $('#ghBtn');
    if (b) b.addEventListener('click', () => { const r = b.getBoundingClientRect(); UI.menu(this.menuItems(), r.left, r.bottom + 4); });
    App.store.on(ch => { if (ch.objs || ch.pages || ch.doc || ch.history || ch.all) this.refreshSoon(); });
    this.refreshSoon = debounce(() => this.refresh(), 400);
    setInterval(() => this.tick(), 60000);
    this.refresh();
  },
  configured() { return !!(this.cfg.token && this.cfg.repo); },
  linked(docId) { return !!this.docs[docId || (App.store.doc && App.store.doc.id)]; },
  state() { return App.store.doc ? this.docs[App.store.doc.id] : null; },
  saveCfg() {
    try {
      const c = Object.assign({}, this.cfg); if (!c.remember) delete c.token;
      localStorage.setItem(GH_KEY, JSON.stringify(c));
    } catch (e) { }
  },
  saveDocs() { try { localStorage.setItem(GH_DOCS, JSON.stringify(this.docs)); } catch (e) { } },
  api() { return new GhRest(this.cfg); },
  engine() {
    const st = App.store, s = this.state();
    if (!s) return null;
    return new GhSync({ store: st, api: this.api(), path: s.path, state: s, user: this.cfg.user });
  },
  pendingCount() { const e = this.linked() && this.engine(); return e ? compactOps(e.pending()).length : 0; },

  /* estat al botó de la barra */
  refresh(kind, msg) {
    const b = $('#ghBtn'); if (!b) return;
    const linked = App.store.doc && this.linked();
    let cls = 'off', tip = this.configured() ? 'GitHub: document sense vincular' : 'GitHub: sense configurar';
    if (linked) {
      const n = this.pendingCount(), s = this.state();
      cls = n ? 'pend' : 'ok';
      tip = n ? `GitHub: ${n} canvis pendents de pujar` : 'GitHub: sincronitzat' + (s.lastSync ? ' · ' + new Date(s.lastSync).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }) : '');
    }
    if (kind) { cls = kind; tip = msg || tip; }
    b.className = 'icon-btn sm gh-btn ' + cls;
    b.innerHTML = icon('cloud');
    b.setAttribute('data-tip', tip);
  },
  menuItems() {
    return [{ cmd: 'gh.sync' }, { cmd: 'gh.history' }, '-', { cmd: 'gh.open' }, { cmd: 'gh.config' }, { cmd: 'gh.unlink' }];
  },
  async tick() {
    if (!this.cfg.auto || this.busy || !App.store.doc || !this.linked() || !this.configured()) return;
    const s = this.state();
    if (this.pendingCount() || Date.now() - (s.lastSync || 0) > this.cfg.auto * 60000) this.syncNow(true);
  },

  /* ── configuració ── */
  async configDialog() {
    const c = this.cfg;
    const mk = (label, attrs, hint) => {
      const inp = el('input', Object.assign({ spellcheck: 'false', autocomplete: 'off' }, attrs));
      return { inp, row: el('div', { style: { marginTop: '10px' } }, el('div', { class: 'lbl', text: label, style: { marginBottom: '5px' } }), el('div', { class: 'fld plain' }, inp), hint ? el('div', { class: 'p-note', text: hint }) : null) };
    };
    const tok = mk('Token personal de GitHub', { type: 'password', value: c.token || '', placeholder: 'github_pat_…' }, 'Token «fine-grained» amb permís de lectura i escriptura de «Contents» només al repositori. No s\'envia enlloc més que a api.github.com.');
    const rep = mk('Repositori', { value: c.repo || '', placeholder: 'usuari/repositori' });
    const br = mk('Branca', { value: c.branch || 'main' });
    const dir = mk('Carpeta dels documents', { value: c.dir || 'guaitaLlenc' });
    const rem = el('input', { type: 'checkbox' }); rem.checked = !!c.remember;
    const auto = el('input', { type: 'number', min: '0', max: '60', value: String(c.auto || 0) });
    const status = el('div', { class: 'p-note', style: { marginTop: '10px', minHeight: '18px' } });
    const body = el('div', null,
      el('p', { text: 'Connecta guaitaLlenç amb un repositori de GitHub per treballar en equip de manera asíncrona, amb historial i autoria de cada canvi.' }),
      tok.row, rep.row,
      el('div', { class: 'row', style: { gap: '10px' } }, br.row, dir.row),
      el('label', { class: 'chk', style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' } }, rem, el('span', { text: 'Recorda el token en aquest navegador' })),
      el('div', { class: 'row', style: { gap: '8px', alignItems: 'center', marginTop: '10px' } }, el('span', { class: 'lbl', text: 'Sincronitza automàticament cada' }), el('div', { class: 'fld plain', style: { width: '64px' } }, auto), el('span', { class: 'lbl', text: 'min (0 = manual)' })),
      status);
    const read = () => ({ token: tok.inp.value.trim(), repo: rep.inp.value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, ''), branch: br.inp.value.trim() || 'main', dir: dir.inp.value.trim().replace(/^\/+|\/+$/g, '') || 'guaitaLlenc', remember: rem.checked, auto: Math.max(0, Math.min(60, parseInt(auto.value) || 0)) });
    const test = async () => {
      const n = read();
      if (!n.token || !/^[\w.-]+\/[\w.-]+$/.test(n.repo)) { status.textContent = 'Cal un token i un repositori amb el format usuari/repositori.'; return false; }
      status.textContent = 'Comprovant la connexió…';
      try {
        const api = new GhRest(n);
        const u = await api.user(); const r = await api.repo();
        if (!r) throw new Error(ghMsg(404));
        if (r.permissions && !r.permissions.push) throw new Error('El token no té permís d\'escriptura en aquest repositori.');
        const bs = await api.list(''); void bs;
        n.user = { login: u.login, name: u.name || u.login };
        status.textContent = `Connectat com a ${u.login}.`;
        return n;
      } catch (e) { status.textContent = e.message; return false; }
    };
    const r = await UI.dialog({
      title: 'Connexió amb GitHub', body, width: 520, buttons: [
        { label: 'Cancel·la', ghost: true, value: null },
        { label: 'Prova', ghost: true, run: async () => { await test(); return false; } },
        { label: 'Desa', primary: true, run: async () => { const n = await test(); if (!n) return false; return n; } }]
    });
    if (!r) return false;
    Object.assign(this.cfg, r); this.saveCfg(); this.refresh();
    UI.toast('GitHub configurat: ' + r.repo);
    return true;
  },

  /* ── vincula i sincronitza ── */
  async syncNow(silent) {
    if (!App.store.doc) return;
    if (this.busy) return;
    if (!this.configured() && !(await this.configDialog())) return;
    const st = App.store;
    if (!this.linked()) {
      const slug = safeName(st.props.name).toLowerCase().replace(/[^a-z0-9àèéíòóúçïü]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
      const path = this.cfg.dir + '/' + slug + '-' + st.doc.id.slice(0, 6);
      const ok = await UI.confirm('Vincula amb GitHub', `Es pujarà el document a «${this.cfg.repo}» → ${path}/ (branca ${this.cfg.branch}).`, 'Vincula i puja');
      if (!ok) return;
      this.docs[st.doc.id] = { path, snapSha: null, opsSha: {}, seen: {}, pushedL: 0, authors: {} };
      this.saveDocs();
    }
    let message;
    if (!silent) {
      const m = await UI.prompt('Sincronitza amb GitHub', 'Nota de la versió (opcional)', '');
      if (m === null) return;
      message = m.trim() ? `guaitaLlenç · ${st.props.name} · ${m.trim()}` : undefined;
    }
    this.busy = true; this.refresh('busy', 'GitHub: sincronitzant…');
    try {
      const eng = this.engine();
      const res = await eng.sync(message);
      this.saveDocs();
      if (!silent || res.applied) UI.toast(res.applied ? `Sincronitzat · ${res.applied} canvis rebuts` : res.pushed ? 'Versió pujada a GitHub' : 'Ja està al dia');
      if (res.applied || res.assets) Autosave.queue();
    } catch (e) {
      console.warn(e); this.busy = false; this.refresh('err', 'GitHub: ' + e.message);
      UI.toast(e.message || 'Error de sincronització', 'err', 4500); return;
    }
    this.busy = false; this.refresh();
  },
  async unlink() {
    if (!this.linked()) return;
    if (!(await UI.confirm('Desvincula de GitHub', 'El document deixarà de sincronitzar-se. Els fitxers al repositori no s\'esborren.', 'Desvincula', true))) return;
    delete this.docs[App.store.doc.id]; this.saveDocs(); this.refresh();
  },

  /* ── obre un document del repositori ── */
  async openRemote() {
    if (!this.configured() && !(await this.configDialog())) return;
    const api = this.api();
    let items;
    try { items = (await api.list(this.cfg.dir)) || []; } catch (e) { UI.toast(e.message, 'err', 4500); return; }
    items = items.filter(e => e.type === 'dir');
    const body = el('div'); let pick = null;
    if (!items.length) body.append(el('p', { text: 'Encara no hi ha cap document a ' + this.cfg.repo + '/' + this.cfg.dir + '.' }));
    const list = el('div', { class: 'pack-list' });
    for (const e of items) {
      const r = el('div', { class: 'pack-row' }, el('div', { class: 'pack-ico', html: icon('file') }), el('div', { class: 'pack-meta' }, el('b', { text: e.name })));
      const b = el('button', { class: 'btn', text: 'Obre' });
      b.addEventListener('click', () => { pick = e.name; r.closest('.dlg')._close(e.name); });
      r.append(b); list.append(r);
    }
    body.append(list);
    const name = await UI.dialog({ title: 'Documents a GitHub', body, width: 480, buttons: [{ label: 'Tanca', ghost: true, value: null }] });
    if (!name) return;
    this.busy = true; this.refresh('busy', 'GitHub: baixant…');
    try {
      const path = this.cfg.dir + '/' + name;
      const dir = await api.list(path);
      const e = dir && dir.find(x => x.name === GH_FILE);
      if (!e) throw new Error('Aquesta carpeta no conté cap document.');
      const data = IO.parse(await api.read(path + '/' + GH_FILE));
      IO.loadData(data, { fileName: name + '.llenc', ts: data.ts });
      this.docs[data.doc.id] = { path, snapSha: e.sha, opsSha: {}, seen: data.seen || {}, pushedL: 0, authors: data.authors || {}, lastSync: Date.now() };
      this.saveDocs();
      UI.toast('Obert des de GitHub: ' + name);
    } catch (e) { console.warn(e); UI.toast(e.message || 'No s\'ha pogut obrir', 'err', 4500); }
    this.busy = false; this.refresh();
    void pick;
  },

  /* ── historial de versions ── */
  async historyDialog() {
    if (!this.linked()) { UI.toast('Primer cal vincular el document amb GitHub.', 'warn'); return; }
    const eng = this.engine();
    const body = el('div', null, el('p', { class: 'p-note', text: 'Carregant l\'historial…' }));
    const cache = new Map();
    const getV = async sha => { if (!cache.has(sha)) cache.set(sha, await eng.version(sha)); return cache.get(sha); };
    const sel = new Set();
    let commits = [];
    const dlgP = UI.dialog({ title: 'Historial de versions', body, width: 640, buttons: [{ label: 'Tanca', primary: true }] });
    const fmt = d => new Date(d).toLocaleString('ca-ES', { dateStyle: 'medium', timeStyle: 'short' });
    const whoOf = c => c.login || c.name || 'desconegut';
    const draw = () => {
      body.textContent = '';
      const cont = eng.contributors();
      if (cont.length) body.append(el('div', { class: 'gh-contrib' }, el('span', { class: 'lbl', text: 'Autors dels objectes actuals' }), ...cont.map(c => el('span', { class: 'gh-chip', text: `${c.who ? c.who.login : 'editor ' + c.actor.slice(0, 4)} · ${c.n}` }))));
      const cmpBtn = el('button', { class: 'btn', text: 'Compara seleccionades', disabled: true });
      const upd = () => { cmpBtn.disabled = sel.size < 1 || sel.size > 2; cmpBtn.textContent = sel.size === 1 ? 'Compara amb l\'actual' : 'Compara seleccionades'; };
      cmpBtn.addEventListener('click', () => this.compareDialog(eng, commits.filter(c => sel.has(c.sha)), getV, fmt));
      body.append(el('div', { class: 'row', style: { margin: '10px 0 6px', gap: '8px', alignItems: 'center' } }, cmpBtn, el('span', { class: 'p-note', text: `${commits.length} versions` })));
      const list = el('div', { class: 'pack-list gh-hist' });
      commits.forEach((c, i) => {
        const chk = el('input', { type: 'checkbox' }); chk.checked = sel.has(c.sha);
        chk.addEventListener('change', () => { if (chk.checked) sel.add(c.sha); else sel.delete(c.sha); if (sel.size > 2) { const first = sel.values().next().value; sel.delete(first); draw(); } upd(); });
        const av = c.avatar ? el('img', { class: 'gh-av', src: c.avatar, alt: '' }) : el('div', { class: 'gh-av', text: whoOf(c).slice(0, 1).toUpperCase() });
        const pv = el('button', { class: 'btn ghost', text: 'Vista prèvia' });
        pv.addEventListener('click', () => this.previewDialog(c, getV, fmt));
        const rs = el('button', { class: 'btn ghost', text: 'Restaura', disabled: i === 0 });
        rs.addEventListener('click', async () => {
          if (!(await UI.confirm('Restaura la versió', `El document tornarà a l'estat de ${fmt(c.date)} (${whoOf(c)}). Es crearà com un canvi nou: es pot desfer i no s'esborra l'historial.`, 'Restaura'))) return;
          try { const v = await getV(c.sha); const d = restoreInto(App.store, v.doc); App.renderer.invalidateAll(); UI.toast(`Versió restaurada · ${diffCount(d)} diferències aplicades`); }
          catch (e) { UI.toast(e.message, 'err', 4000); }
        });
        list.append(el('div', { class: 'pack-row' }, chk, av, el('div', { class: 'pack-meta' }, el('b', { text: whoOf(c) + (i === 0 ? ' · darrera' : '') }), el('span', { text: fmt(c.date) + ' · ' + c.message.split('\n')[0] })), pv, rs));
      });
      if (!commits.length) list.append(el('div', { class: 'p-note', text: 'Encara no hi ha cap versió pujada.' }));
      body.append(list); upd();
    };
    try { commits = await eng.history(); draw(); }
    catch (e) { body.textContent = ''; body.append(el('p', { text: e.message })); }
    await dlgP;
  },
  async previewDialog(c, getV, fmt) {
    const body = el('div', null, el('p', { class: 'p-note', text: 'Carregant…' }));
    const dlgP = UI.dialog({ title: 'Versió de ' + fmt(c.date), body, width: 560, buttons: [{ label: 'Tanca', primary: true }] });
    try {
      const v = await getV(c.sha);
      const pages = Object.values(v.doc.pages).sort(byZ);
      const box = el('div', { class: 'gh-prev' });
      const show = id => { box.innerHTML = ghPreview(v.doc, id); const s = box.querySelector('svg'); if (s) { s.removeAttribute('width'); s.removeAttribute('height'); } };
      body.textContent = '';
      if (pages.length > 1) {
        const bar = el('div', { class: 'row', style: { gap: '6px', marginBottom: '8px', flexWrap: 'wrap' } });
        pages.forEach((p, i) => { const b = el('button', { class: 'btn ghost', text: p.name || 'Pàgina ' + (i + 1) }); b.addEventListener('click', () => show(p.id)); bar.append(b); });
        body.append(bar);
      }
      body.append(box, el('p', { class: 'p-note', text: `${Object.keys(v.doc.objs).length} objectes · ${pages.length} pàgines · ${c.message.split('\n')[0]}` }));
      show(pages[0].id);
    } catch (e) { body.textContent = ''; body.append(el('p', { text: e.message })); }
    await dlgP;
  },
  async compareDialog(eng, picked, getV, fmt) {
    const body = el('div', null, el('p', { class: 'p-note', text: 'Comparant…' }));
    const dlgP = UI.dialog({ title: 'Compara versions', body, width: 760, buttons: [{ label: 'Tanca', primary: true }] });
    try {
      picked = picked.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
      const A = await getV(picked[0].sha);
      const B = picked[1] ? await getV(picked[1].sha) : { doc: App.store.doc };
      const labA = fmt(picked[0].date), labB = picked[1] ? fmt(picked[1].date) : 'Document actual';
      const d = diffDocs(A.doc, B.doc);
      body.textContent = '';
      const mkP = (doc, lab) => {
        const box = el('div', { class: 'gh-prev sm' });
        const p0 = Object.values(doc.pages).sort(byZ)[0];
        box.innerHTML = p0 ? ghPreview(doc, p0.id) : '';
        const s = box.querySelector('svg'); if (s) { s.removeAttribute('width'); s.removeAttribute('height'); }
        return el('div', { class: 'gh-col' }, el('div', { class: 'lbl', text: lab }), box);
      };
      body.append(el('div', { class: 'gh-cmp' }, mkP(A.doc, labA), mkP(B.doc, labB)));
      const nm = (doc, id) => { const o = doc.objs[id]; return o ? (o.name || TYPE_NAMES[o.type] || id) : id; };
      const lines = [];
      d.pages.added.forEach(id => lines.push(['+', 'Pàgina afegida: ' + (B.doc.pages[id].name || id)]));
      d.pages.removed.forEach(id => lines.push(['−', 'Pàgina eliminada: ' + (A.doc.pages[id].name || id)]));
      d.pages.changed.forEach(c => lines.push(['~', 'Pàgina ' + (B.doc.pages[c.id].name || c.id) + ': ' + c.keys.join(', ')]));
      d.objs.added.forEach(id => lines.push(['+', 'Afegit: ' + nm(B.doc, id)]));
      d.objs.removed.forEach(id => lines.push(['−', 'Eliminat: ' + nm(A.doc, id)]));
      d.objs.changed.forEach(c => lines.push(['~', nm(B.doc, c.id) + ': ' + c.keys.join(', ')]));
      d.props.forEach(k => lines.push(['~', 'Document: ' + k]));
      body.append(el('p', { class: 'p-note', text: lines.length ? `${lines.length} diferència${lines.length === 1 ? '' : 's'}` : 'Les dues versions són idèntiques.' }));
      const ul = el('div', { class: 'gh-diff' });
      lines.slice(0, 200).forEach(([s, t]) => ul.append(el('div', { class: 'gh-d gh-d' + (s === '+' ? 'a' : s === '−' ? 'r' : 'c') }, el('b', { text: s }), el('span', { text: t }))));
      if (lines.length > 200) ul.append(el('div', { class: 'p-note', text: `… i ${lines.length - 200} més` }));
      body.append(ul);
    } catch (e) { body.textContent = ''; body.append(el('p', { text: e.message })); }
    await dlgP;
  },
};
