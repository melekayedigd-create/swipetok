// SwipePlay — main app
(function () {
  const S = SP, st = S.store, $ = s => document.querySelector(s);
  const CACHE_MAX = 20;
  let mode = 'offline', tab = 'feed', feedItems = [], slides = [], active = -1, runners = {}, cursor = null, loadingMore = false, aiRot = 0, feedSort = 'new';

  // ---------- local data ----------
  const me = () => st.get('name', null) || (() => { const n = 'player' + Math.floor(1000 + Math.random() * 9000); st.set('name', n); return n; })();
  const saved = () => st.get('saved', {});
  const liked = () => st.get('liked', {});
  const cache = () => st.get('cache', []);
  const mine = () => st.get('mine', []);
  const strip = e => { const o = Object.assign({}, e); delete o._el; return o; };

  function cachePut(e) {
    if (e.kind !== 'user' || !e.online || mine().some(m => m.publishedId === e.id)) return;
    let c = cache().filter(x => x.entry.id !== e.id);
    c.push({ entry: strip(e), seen: Date.now() });
    c.sort((a, b) => a.seen - b.seen);
    while (c.length > CACHE_MAX) c.shift();          // the oldest game you saw is removed first
    st.set('cache', c);
  }
  S.saveDraft = p => {
    const list = mine(); const m = list.find(x => x.project === p || x.id === p._id);
    if (m) { m.project = p; m.updatedAt = Date.now(); } else list.unshift({ id: p._id = p._id || S.uid(), project: p, updatedAt: Date.now() });
    st.set('mine', list.map(x => Object.assign({}, x, { project: Object.assign({}, x.project) })));
    if (tab === 'create') renderCreate();
  };
  const mineEntry = m => ({ id: m.publishedId || 'local-' + m.id, kind: 'user', title: m.project.title || 'Untitled', desc: m.project.desc, emoji: m.project.icon, author: me(), project: m.project, mine: true, online: !!m.publishedId, likes: 0, comments: 0 });
  const gameOf = e => e.kind === 'ai' ? S.AI_GAMES.find(g => g.key === e.key) : S.Blocks.userGame(e);

  // ---------- mode ----------
  function computeMode() { return (navigator.onLine !== false && S.netOn !== false) ? 'online' : 'offline'; }
  function setMode(m, quiet) {
    const changed = m !== mode; mode = m; S.initBackend();
    const pill = $('#modePill'); const demo = S.backend.kind === 'demo';
    pill.className = 'mode ' + m + (demo && m === 'online' ? ' demo' : '');
    pill.innerHTML = m === 'online' ? `${S.icon('wifi')}<span>${demo ? 'Demo' : 'Online'}</span>` : `${S.icon('wifiOff')}<span>Offline</span>`;
    if (changed && !quiet) { S.toast(m === 'online' ? 'Back online — community games are on' : 'Offline mode — your downloaded & AI games'); buildFeed(); }
    if (tab === 'me') renderMe();
  }
  S.netChanged = on => { S.netOn = !!on; setMode(computeMode()); };
  window.addEventListener('online', () => setMode(computeMode()));
  window.addEventListener('offline', () => setMode('offline'));

  // ---------- feed ----------
  async function buildFeed() {
    destroyRunners(); feedItems = []; cursor = null; aiRot = Math.floor(Math.random() * 15); active = -1;
    const feed = $('#feed'); feed.innerHTML = ''; feed.scrollTop = 0; slides = [];
    $('#feedTabs').classList.toggle('hidden', mode !== 'online');
    if (mode === 'online') {
      try { const r = await S.backend.list(null, feedSort); cursor = r.cursor; appendItems(mix(r.items)); }
      catch (err) { console.warn(err); S.toast('Could not reach the server — showing offline games'); appendItems(offlineList()); }
    } else appendItems(offlineList());
    if (!feedItems.length) appendItems(S.shuffle(S.aiEntries()));
    onScroll(true);
  }
  function offlineList() {
    const seen = new Set(), out = [];
    const push = e => { if (e && !seen.has(e.id)) { seen.add(e.id); out.push(e); } };
    S.aiEntries().forEach(push); cache().forEach(c => push(c.entry)); Object.values(saved()).forEach(e => e.kind === 'user' && push(e)); mine().forEach(m => push(mineEntry(m)));
    return S.shuffle(out);
  }
  function mix(online) {
    const ai = S.aiEntries(), out = [];
    online.forEach((e, i) => { out.push(e); if (i % 3 === 2) out.push(ai[aiRot++ % ai.length]); });
    if (online.length < 3) for (let k = 0; k < 4; k++) out.push(ai[aiRot++ % ai.length]);
    return out;
  }
  function appendItems(items) {
    const feed = $('#feed');
    for (const e of items) { const i = feedItems.length; feedItems.push(e); const el = slideEl(e, i); slides.push(el); feed.appendChild(el); }
  }
  async function loadMore() {
    if (loadingMore) return; loadingMore = true;
    try {
      if (mode === 'online' && cursor) { const r = await S.backend.list(cursor, feedSort); cursor = r.cursor; appendItems(mix(r.items)); }
      else appendItems(mode === 'online' ? S.shuffle(S.aiEntries()).slice(0, 6).concat(S.shuffle(cache().map(c => c.entry)).slice(0, 4)) : offlineList());
    } catch (e) { appendItems(S.shuffle(S.aiEntries()).slice(0, 5)); }
    loadingMore = false;
  }
  function slideEl(e, i) {
    const el = document.createElement('div'); el.className = 'slide'; el.dataset.i = i;
    const isLiked = !!liked()[e.id], isSaved = !!saved()[e.id];
    const col = e.color || '#7c5cff';
    el.innerHTML = `
      <div class="slide-glow" style="--gc:${col}"></div>
      <div class="stage-wrap"><div class="stage-host"></div></div>
      <div class="rail">
        <button class="rb like ${isLiked ? 'on' : ''}" data-a="like">${S.icon('heart')}<span>${S.fmt((e.likes || 0))}</span></button>
        <button class="rb" data-a="cmt">${S.icon('comment')}<span>${e.kind === 'ai' ? '' : S.fmt(e.comments || 0)}</span></button>
        <button class="rb save ${isSaved ? 'on' : ''}" data-a="save">${S.icon('bookmark')}<span>${isSaved ? 'Saved' : 'Save'}</span></button>
        <button class="rb" data-a="restart">${S.icon('restart')}<span>Restart</span></button>
      </div>
      <div class="meta">
        <div class="who"><span class="av" style="background:${e.ai ? 'linear-gradient(135deg,#7c5cff,#ff4d8d)' : avColor(e.author)}">${e.ai ? S.icon('robot') : S.esc((e.author || '?')[0].toUpperCase())}</span><b>@${S.esc(e.author || 'unknown')}</b>
          ${e.ai ? `<span class="badge ai" data-a="aiinfo">${S.icon('sparkle')}AI-made</span>` : ''}${e.mine ? '<span class="badge mine">Yours</span>' : ''}${e.kind === 'user' && !e.mine && mode !== 'online' ? '<span class="badge dl">Downloaded</span>' : ''}</div>
        <div class="ttl">${S.esc(e.emoji || '🎮')} ${S.esc(e.title)}</div>
        <div class="desc">${S.esc(e.desc || '')}</div>
      </div>`;
    el.addEventListener('click', ev => { const b = ev.target.closest('[data-a]'); if (b) act(b.dataset.a, e, el, b); });
    return el;
  }
  function avColor(n) { let h = 0; for (const c of String(n || '')) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 70% 45%)`; }

  function ensureRunner(i) {
    if (runners[i] || !feedItems[i]) return;
    const host = slides[i].querySelector('.stage-host'); const g = gameOf(feedItems[i]); if (!g) return;
    runners[i] = new S.Runner(host, g);
  }
  function destroyRunners() { for (const k in runners) { runners[k].destroy(); } runners = {}; }
  let scrollRaf = 0;
  function onScroll(force) {
    if (scrollRaf && !force) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0; const feed = $('#feed'); const h = feed.clientHeight || 1;
      const i = Math.max(0, Math.min(feedItems.length - 1, Math.round(feed.scrollTop / h)));
      if (i !== active || force === true) activate(i);
    });
  }
  function activate(i) {
    active = i;
    for (const k in runners) { const n = +k; if (Math.abs(n - i) > 2) { runners[k].destroy(); delete runners[k]; } else runners[k].setActive(false); }
    for (let n = i - 1; n <= i + 1; n++) ensureRunner(n);
    if (runners[i] && tab === 'feed' && !overlayOpen()) runners[i].setActive(true);
    const e = feedItems[i]; if (e) cachePut(e);
    if (i >= feedItems.length - 3) loadMore();
  }
  function pauseFeed() { for (const k in runners) runners[k].setActive(false); }
  function resumeFeed() { if (tab === 'feed' && runners[active] && !overlayOpen()) runners[active].setActive(true); }
  const overlayOpen = () => !$('#player').classList.contains('hidden') || S.Editor.isOpen() || !$('#sheet').classList.contains('hidden') || !$('#dialog').classList.contains('hidden');

  // ---------- slide actions ----------
  async function act(a, e, el, btn) {
    if (a === 'aiinfo') { dialog(`<div class="dlg-ic">${S.icon('robot')}</div><h3>Made by AI</h3><p>This game was designed and coded by an AI. The 15 AI games are built into SwipePlay, so they always work, even offline.</p>`, [{ t: 'Got it' }]); return; }
    if (a === 'restart') { const r = runners[+el.dataset.i]; if (r) r.restart(false); return; }
    if (a === 'save') {
      const s = saved(); if (s[e.id]) { delete s[e.id]; S.toast('Removed from saved'); } else { s[e.id] = strip(e); S.toast('Saved — playable offline'); }
      st.set('saved', s); const on = !!s[e.id]; btn.classList.toggle('on', on); btn.querySelector('span').textContent = on ? 'Saved' : 'Save'; S.sfx('tap'); return;
    }
    if (a === 'like') {
      const L = liked(), on = !L[e.id];
      if (e.kind === 'user' && e.online && !e.mine) { if (mode !== 'online') { S.toast('Likes need internet'); return; } }
      if (on) L[e.id] = 1; else delete L[e.id]; st.set('liked', L);
      e.likes = Math.max(0, (e.likes || 0) + (on ? 1 : -1)); btn.classList.toggle('on', on); btn.querySelector('span').textContent = S.fmt(e.likes);
      if (on) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); S.sfx('pop'); }
      if (e.kind === 'user' && e.online) S.backend.like(e.id, on).catch(err => S.toast(err.message));
      return;
    }
    if (a === 'cmt') openComments(e, el);
  }

  // ---------- comments ----------
  async function openComments(e, el) {
    if (e.kind === 'ai') { sheet(`<div class="sh-h"><b>Comments</b></div><div class="empty">${S.icon('robot')}<p>Comments are for community games. AI games are built into the app.</p></div>`); return; }
    if (!e.online) { sheet(`<div class="sh-h"><b>Comments</b></div><div class="empty">${S.icon('cloud')}<p>${e.mine ? 'Publish this game to get comments.' : 'Comments load when you are online.'}</p></div>`); return; }
    if (mode !== 'online') { sheet(`<div class="sh-h"><b>Comments</b></div><div class="empty">${S.icon('wifiOff')}<p>You're offline. Comments need internet.</p></div>`); return; }
    sheet(`<div class="sh-h"><b>Comments</b><span class="muted" id="cmtN">${S.fmt(e.comments || 0)}</span></div><div class="cmts" id="cmts"><div class="spin"></div></div>
      <form class="cmt-in" id="cmtForm"><span class="av sm" style="background:${avColor(me())}">${S.esc(me()[0].toUpperCase())}</span><input id="cmtText" maxlength="300" placeholder="Add a comment…" autocomplete="off"><button class="send">${S.icon('send')}</button></form>`);
    const load = async () => {
      try { const list = await S.backend.comments(e.id); $('#cmts').innerHTML = list.length ? list.map(c => `<div class="cmt"><span class="av sm" style="background:${avColor(c.author)}">${S.esc((c.author || '?')[0].toUpperCase())}</span><div><b>${S.esc(c.author)}</b> <span class="muted">${S.ago(c.createdAt)}</span><p>${S.esc(c.text)}</p></div></div>`).join('') : '<div class="empty small"><p>No comments yet. Be the first!</p></div>'; }
      catch (err) { $('#cmts').innerHTML = `<div class="empty small"><p>${S.esc(err.message)}</p></div>`; }
    };
    load();
    $('#cmtForm').onsubmit = async ev => {
      ev.preventDefault(); const t = $('#cmtText').value.trim(); if (!t) return; $('#cmtText').value = '';
      try { await S.backend.comment(e.id, t, me()); e.comments = (e.comments || 0) + 1; $('#cmtN').textContent = S.fmt(e.comments); const sp = el.querySelector('[data-a="cmt"] span'); if (sp) sp.textContent = S.fmt(e.comments); load(); }
      catch (err) { S.toast(err.message); }
    };
  }

  // ---------- sheets & dialogs ----------
  function sheet(html) { pauseFeed(); const s = $('#sheet'); s.innerHTML = `<div class="sh-card"><div class="grab"></div>${html}</div>`; s.classList.remove('hidden'); s.onclick = ev => { if (ev.target === s) closeSheet(); }; }
  function closeSheet() { $('#sheet').classList.add('hidden'); $('#sheet').innerHTML = ''; resumeFeed(); }
  function dialog(html, buttons) {
    pauseFeed(); const d = $('#dialog');
    d.innerHTML = `<div class="dlg">${html}<div class="dlg-b">${buttons.map((b, i) => `<button class="${b.cls || (i === buttons.length - 1 ? 'primary' : 'ghost')}" data-i="${i}">${b.t}</button>`).join('')}</div></div>`;
    d.classList.remove('hidden');
    d.onclick = ev => { const b = ev.target.closest('[data-i]'); if (!b && ev.target !== d) return; const btn = b ? buttons[+b.dataset.i] : null; if (btn && btn.keep && btn.fn) { btn.fn(); return; } closeDialog(); if (btn && btn.fn) btn.fn(); };
    const inp = d.querySelector('input'); if (inp) setTimeout(() => inp.focus(), 50);
  }
  function closeDialog() { $('#dialog').classList.add('hidden'); $('#dialog').innerHTML = ''; resumeFeed(); }
  S.confirm = (msg, ok, fn) => dialog(`<p>${S.esc(msg)}</p>`, [{ t: 'Cancel' }, { t: ok, cls: 'danger', fn }]);
  S.prompt = (title, def, fn) => dialog(`<h3>${S.esc(title)}</h3><input class="dlg-in" value="${S.esc(def || '')}" maxlength="24">`, [{ t: 'Cancel' }, { t: 'OK', fn: () => fn($('#dialog .dlg-in') ? $('#dialog .dlg-in').value : def) }]);

  // ---------- full-screen player ----------
  let pRunner = null;
  function play(entryOrGame) {
    pauseFeed(); const p = $('#player'); const g = entryOrGame.make ? entryOrGame : gameOf(entryOrGame);
    p.innerHTML = `<div class="pl-top"><button class="ib" id="plBack">${S.icon('back')}</button><b>${S.esc(g.title)}</b>${g.ai ? `<span class="badge ai">${S.icon('sparkle')}AI-made</span>` : ''}<button class="ib" id="plRst">${S.icon('restart')}</button></div><div class="pl-stage"><div class="stage-host"></div></div>`;
    p.classList.remove('hidden');
    pRunner = new S.Runner(p.querySelector('.stage-host'), g); pRunner.setActive(true);
    $('#plBack').onclick = closePlayer; $('#plRst').onclick = () => pRunner.restart(false);
  }
  function closePlayer() { if (pRunner) pRunner.destroy(); pRunner = null; $('#player').classList.add('hidden'); $('#player').innerHTML = ''; resumeFeed(); }
  S.playProject = p => play(S.Blocks.userGame({ id: 'test-' + (p._id || 'x'), project: p, title: p.title, desc: p.desc, emoji: p.icon }));

  // ---------- tabs ----------
  function go(t) {
    tab = t; document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + t));
    document.querySelectorAll('#tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    document.body.dataset.tab = t;
    if (t === 'feed') resumeFeed(); else pauseFeed();
    if (t === 'lib') renderLib(); if (t === 'create') renderCreate(); if (t === 'me') renderMe();
  }

  // ---------- library ----------
  let libTab = 'ai';
  function card(e) {
    return `<button class="gcard" data-id="${S.esc(e.id)}"><div class="gc-art" style="--gc:${e.color || avColor(e.title)}"><span>${S.esc(e.emoji || '🎮')}</span>${e.ai ? `<i class="badge ai">${S.icon('sparkle')}AI</i>` : ''}</div><div class="gc-t">${S.esc(e.title)}</div><div class="gc-a">@${S.esc(e.author || '')}</div></button>`;
  }
  function renderLib() {
    const c = cache(), sv = Object.values(saved());
    const lists = { ai: S.aiEntries(), saved: sv, dl: c.slice().reverse().map(x => x.entry), mine: mine().map(mineEntry) };
    const L = lists[libTab];
    $('#v-lib').innerHTML = `
      <div class="pg-h"><h1>Library</h1><p class="muted">${mode === 'online' ? 'Everything here also works offline.' : 'Offline — these games are on your phone.'}</p></div>
      <div class="seg">
        <button data-lt="ai" class="${libTab === 'ai' ? 'on' : ''}">AI games <b>15</b></button>
        <button data-lt="saved" class="${libTab === 'saved' ? 'on' : ''}">Saved <b>${sv.length}</b></button>
        <button data-lt="dl" class="${libTab === 'dl' ? 'on' : ''}">Downloaded <b>${c.length}/${CACHE_MAX}</b></button>
        <button data-lt="mine" class="${libTab === 'mine' ? 'on' : ''}">Mine <b>${mine().length}</b></button>
      </div>
      ${libTab === 'dl' ? `<div class="note">${S.icon('download')}<span>Community games you watch are kept for offline play. Only the last ${CACHE_MAX} are kept — when a new one arrives, the oldest one you saw is deleted. Save a game to keep it forever.</span></div>` : ''}
      ${libTab === 'ai' ? `<div class="note ai">${S.icon('robot')}<span>These 15 games were made by AI and are built into the app.</span></div>` : ''}
      <div class="ggrid">${L.length ? L.map(card).join('') : `<div class="empty">${S.icon(libTab === 'saved' ? 'bookmark' : libTab === 'mine' ? 'edit' : 'download')}<p>${libTab === 'saved' ? 'Tap the bookmark on any game to save it.' : libTab === 'mine' ? 'Make a game in the Create tab.' : 'Games you watch online appear here.'}</p></div>`}</div>`;
    $('#v-lib').onclick = ev => {
      const s = ev.target.closest('[data-lt]'); if (s) { libTab = s.dataset.lt; renderLib(); return; }
      const g = ev.target.closest('.gcard'); if (g) { const e = L.find(x => x.id === g.dataset.id); if (e) play(e); }
    };
  }

  // ---------- create ----------
  function renderCreate() {
    const list = mine();
    $('#v-create').innerHTML = `
      <div class="pg-h"><h1>Create</h1><p class="muted">Build games with blocks, like Scratch. Share them with everyone.</p></div>
      <div class="new-row">
        <button class="newcard" data-new="starter"><span class="nc-ic">🐱</span><b>Starter game</b><small>A ready-made catch game to learn from</small></button>
        <button class="newcard" data-new="blank"><span class="nc-ic">${S.icon('plus')}</span><b>Blank game</b><small>Start from one sprite</small></button>
      </div>
      <h2 class="sec">My games</h2>
      <div class="mylist">${list.length ? list.map(m => `
        <div class="mycard" data-id="${m.id}">
          <div class="mc-ic">${S.esc(m.project.icon || '🎮')}</div>
          <div class="mc-b"><b>${S.esc(m.project.title || 'Untitled')}</b><span class="tag ${m.publishedId ? 'pub' : ''}">${m.publishedId ? (m.server === 'demo' ? 'Published (demo)' : 'Published') : 'Draft'}</span><small class="muted">edited ${S.ago(m.updatedAt)} ago</small></div>
          <div class="mc-a">
            <button class="mini" data-m="edit">${S.icon('edit')}</button><button class="mini" data-m="play">${S.icon('play')}</button>
            <button class="mini acc" data-m="pub">${S.icon('upload')}</button><button class="mini red" data-m="del">${S.icon('trash')}</button>
          </div>
        </div>`).join('') : `<div class="empty">${S.icon('sparkle')}<p>No games yet. Start with the starter game to see how blocks work.</p></div>`}</div>`;
    $('#v-create').onclick = ev => {
      const n = ev.target.closest('[data-new]'); if (n) { const p = n.dataset.new === 'starter' ? S.Blocks.starterProject() : S.Blocks.blankProject(); p._id = S.uid(); S.saveDraft(p); openEditor(p); return; }
      const b = ev.target.closest('[data-m]'); if (!b) return; const id = b.closest('.mycard').dataset.id; const m = mine().find(x => x.id === id); if (!m) return;
      m.project._id = m.id;
      if (b.dataset.m === 'edit') openEditor(m.project);
      if (b.dataset.m === 'play') S.playProject(m.project);
      if (b.dataset.m === 'del') S.confirm(`Delete "${m.project.title}"?${m.publishedId ? ' It will also be removed online.' : ''}`, 'Delete', async () => { if (m.publishedId && mode === 'online') { try { await S.backend.unpublish(m.publishedId); } catch (e) {} } st.set('mine', mine().filter(x => x.id !== id)); renderCreate(); });
      if (b.dataset.m === 'pub') publishDialog(m);
    };
  }
  function openEditor(p) { pauseFeed(); S.Editor.open(p, { onDone: () => { S.saveDraft(p); renderCreate(); resumeFeed(); } }); }
  function publishDialog(m) {
    if (mode !== 'online') { dialog(`<div class="dlg-ic">${S.icon('wifiOff')}</div><h3>You're offline</h3><p>Connect to the internet to publish your game.</p>`, [{ t: 'OK' }]); return; }
    const demo = S.backend.kind === 'demo';
    const unpub = m.publishedId ? [{ t: 'Unpublish', cls: 'ghost danger-t', fn: async () => { try { await S.backend.unpublish(m.publishedId); } catch (e) { S.toast(e.message); } const l = mine(); const x = l.find(y => y.id === m.id); delete x.publishedId; st.set('mine', l); renderCreate(); S.toast('Unpublished'); } }] : [];
    dialog(`<div class="dlg-ic">${S.icon('upload')}</div><h3>${m.publishedId ? 'Update online game' : 'Publish your game'}</h3>
      <p>${demo ? '<b class="warn">Demo server:</b> only this phone can see it. Add your Firebase project in Profile ▸ Server so everyone can play.' : 'Everyone using SwipePlay will be able to play, like and comment on it.'}</p>
      <div class="pubprev"><span>${S.esc(m.project.icon || '🎮')}</span><div><b>${S.esc(m.project.title || 'Untitled')}</b><small>by @${S.esc(me())}</small></div></div>
      ${m.publishedId ? '<p class="muted small">Updating re-uploads the game (likes and comments start over).</p>' : ''}`,
      [...unpub, { t: 'Cancel' }, { t: m.publishedId ? 'Update' : 'Publish', fn: async () => {
        try {
          if (m.publishedId) { try { await S.backend.unpublish(m.publishedId); } catch (e) {} }
          const id = await S.backend.publish({ title: m.project.title || 'Untitled', desc: m.project.desc || '', emoji: m.project.icon || '🎮', author: me(), project: m.project });
          const l = mine(); const x = l.find(y => y.id === m.id); x.publishedId = id; x.server = S.backend.kind; st.set('mine', l); renderCreate(); S.toast('Published! 🎉'); S.sfx('win');
        } catch (e) { S.toast(e.message); }
      } }]);
  }

  // ---------- profile ----------
  function renderMe() {
    const c = S.firebaseConfig(), saved_ = S.store.get('fbcfg', {}) || {};
    const bytes = (() => { let n = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += k.length + (localStorage.getItem(k) || '').length; } } catch (e) {} return n * 2; })();
    $('#v-me').innerHTML = `
      <div class="prof"><div class="av xl" style="background:${avColor(me())}">${S.esc(me()[0].toUpperCase())}</div>
        <div><h1>@${S.esc(me())}</h1><button class="link" data-p="name">${S.icon('edit')} Change name</button></div></div>
      <div class="stats"><div><b>${mine().length}</b><span>made</span></div><div><b>${mine().filter(m => m.publishedId).length}</b><span>published</span></div><div><b>${Object.keys(saved()).length}</b><span>saved</span></div><div><b>${cache().length}/${CACHE_MAX}</b><span>downloaded</span></div></div>
      <h2 class="sec">Connection</h2>
      <div class="panel">
        <div class="row-s"><span class="dot ${mode === 'online' ? 'on' : ''}"></span><b>${mode === 'online' ? 'Online mode' : 'Offline mode'}</b><span class="muted">${mode === 'online' ? 'community games, likes, comments' : 'AI games + your downloaded games'}</span></div>
        <div class="row-s"><span class="dot ${c ? 'on' : 'warn'}"></span><b>Server: ${c ? 'Firebase · ' + S.esc(c.projectId) : 'Demo (this phone only)'}</b></div>
        <details ${c ? '' : 'open'}><summary>Firebase settings</summary>
          <p class="muted small">Paste the <b>apiKey</b> and <b>projectId</b> from Firebase console ▸ Project settings ▸ Your apps ▸ Web app. Everyone who installs the APK must use the same project to see each other's games (put it in js/config.js before building).</p>
          <label class="fld">apiKey<input id="fbKey" value="${S.esc(saved_.apiKey || '')}" placeholder="AIza…" autocomplete="off"></label>
          <label class="fld">projectId<input id="fbPid" value="${S.esc(saved_.projectId || '')}" placeholder="swipeplay-12345" autocomplete="off"></label>
          <div class="btns"><button class="primary" data-p="fbsave">Save & test</button><button class="ghost" data-p="fbclear">Use built-in / demo</button></div>
        </details>
      </div>
      <h2 class="sec">Storage</h2>
      <div class="panel"><div class="row-s"><b>${(bytes / 1024).toFixed(0)} KB</b><span class="muted">used on this phone</span></div>
        <div class="btns"><button class="ghost" data-p="cleardl">Clear downloaded games</button><button class="ghost" data-p="mute">${S.store.get('mute', false) ? 'Sound: off' : 'Sound: on'}</button></div></div>
      <h2 class="sec">About</h2>
      <div class="panel about">${S.icon('robot')}<p><b>SwipePlay 1.0</b><br>The 15 built-in games were made by AI and are always marked <span class="badge ai">${S.icon('sparkle')}AI-made</span>. Community games are made by players with the block editor.</p></div>`;
    $('#v-me').onclick = async ev => {
      const b = ev.target.closest('[data-p]'); if (!b) return;
      if (b.dataset.p === 'name') S.prompt('Your name', me(), v => { v = (v || '').trim().replace(/\s+/g, '_').slice(0, 20); if (v) { st.set('name', v); renderMe(); } });
      if (b.dataset.p === 'cleardl') S.confirm('Delete all downloaded games? (Saved games stay.)', 'Clear', () => { st.set('cache', []); renderMe(); });
      if (b.dataset.p === 'mute') { st.set('mute', !st.get('mute', false)); renderMe(); }
      if (b.dataset.p === 'fbclear') { st.del('fbcfg'); st.del('fbauth'); setMode(mode, true); renderMe(); buildFeed(); }
      if (b.dataset.p === 'fbsave') {
        const k = $('#fbKey').value.trim(), p = $('#fbPid').value.trim(); if (!k || !p) { S.toast('Fill in both fields'); return; }
        st.set('fbcfg', { apiKey: k, projectId: p }); st.del('fbauth'); S.initBackend(); b.textContent = 'Testing…';
        try { await S.backend.test(); S.toast('Connected to Firebase ✔'); } catch (e) { S.toast('Firebase error: ' + e.message); }
        setMode(computeMode(), true); renderMe(); buildFeed();
      }
    };
  }

  // ---------- Android back button ----------
  window.onAndroidBack = () => {
    if (!$('#dialog').classList.contains('hidden')) { closeDialog(); return true; }
    if (!$('#sheet').classList.contains('hidden')) { closeSheet(); return true; }
    if (!$('#player').classList.contains('hidden')) { closePlayer(); return true; }
    if (S.Editor.isOpen()) return S.Editor.back();
    if (tab !== 'feed') { go('feed'); return true; }
    return false;
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseFeed(); else resumeFeed(); });

  // ---------- boot ----------
  function boot() {
    document.querySelectorAll('#tabs [data-tab]').forEach(b => b.onclick = () => go(b.dataset.tab));
    $('#feed').addEventListener('scroll', () => onScroll(), { passive: true });
    $('#modePill').onclick = () => dialog(`<div class="dlg-ic">${S.icon(mode === 'online' ? 'wifi' : 'wifiOff')}</div><h3>${mode === 'online' ? 'Online mode' : 'Offline mode'}</h3><p>${mode === 'online' ? 'You see games made by other players and can like, save and comment. Games you watch are kept for offline play (last ' + CACHE_MAX + ').' : 'No internet: you see the 15 AI games, games you saved, your own games and the last ' + CACHE_MAX + ' community games you watched.'}</p>`, [{ t: 'OK' }]);
    document.querySelectorAll('#feedTabs [data-sort]').forEach(b => b.onclick = () => { feedSort = b.dataset.sort; document.querySelectorAll('#feedTabs [data-sort]').forEach(x => x.classList.toggle('on', x === b)); buildFeed(); });
    window.addEventListener('resize', () => { const f = $('#feed'); if (active >= 0) f.scrollTop = active * f.clientHeight; });
    me(); setMode(computeMode(), true); buildFeed(); go('feed');
    setTimeout(() => $('#splash') && $('#splash').classList.add('gone'), 600);
  }
  S.go = go; S.debug = { feedItems: () => feedItems, runners: () => runners, active: () => active, mode: () => mode, buildFeed, cache };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
