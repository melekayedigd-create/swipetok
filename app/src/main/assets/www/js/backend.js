// SwipePlay — online backend: Firebase (Firestore REST + anonymous auth) or a local demo server
(function () {
  const store = SP.store;

  function cfg() {
    const saved = store.get('fbcfg', null);
    const c = saved && saved.apiKey ? saved : (window.SWIPEPLAY_FIREBASE || {});
    return c.apiKey && c.projectId ? c : null;
  }

  // ---------- Firestore value encoding ----------
  const enc = v => typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === 'boolean' ? { booleanValue: v } : v instanceof Date ? { timestampValue: v.toISOString() } : { stringValue: String(v == null ? '' : v) };
  const dec = f => f == null ? null : 'integerValue' in f ? +f.integerValue : 'doubleValue' in f ? +f.doubleValue : 'booleanValue' in f ? f.booleanValue : 'timestampValue' in f ? Date.parse(f.timestampValue) : 'stringValue' in f ? f.stringValue : null;
  const fields = o => { const r = {}; for (const k in o) r[k] = enc(o[k]); return r; };
  const unfields = f => { const r = {}; for (const k in (f || {})) r[k] = dec(f[k]); return r; };

  async function fetchT(url, opt, ms) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms || 12000);
    try { return await fetch(url, Object.assign({ signal: ctl.signal }, opt)); } finally { clearTimeout(t); }
  }

  class Firebase {
    constructor(c) { this.c = c; this.kind = 'firebase'; this.base = `https://firestore.googleapis.com/v1/projects/${c.projectId}/databases/(default)/documents`; this.root = `projects/${c.projectId}/databases/(default)/documents`; }
    async auth() {
      let a = store.get('fbauth', null);
      if (a && a.key === this.c.apiKey && a.exp > Date.now() + 60000) return a;
      let r;
      if (a && a.key === this.c.apiKey && a.refresh) {
        r = await fetchT(`https://securetoken.googleapis.com/v1/token?key=${this.c.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(a.refresh) });
        if (r.ok) { const j = await r.json(); a = { key: this.c.apiKey, token: j.id_token, refresh: j.refresh_token, uid: j.user_id, exp: Date.now() + (+j.expires_in) * 1000 }; store.set('fbauth', a); return a; }
      }
      r = await fetchT(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.c.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) });
      if (!r.ok) throw new Error('Sign-in failed (' + r.status + '). Is Anonymous sign-in enabled in Firebase?');
      const j = await r.json();
      a = { key: this.c.apiKey, token: j.idToken, refresh: j.refreshToken, uid: j.localId, exp: Date.now() + (+j.expiresIn) * 1000 };
      store.set('fbauth', a); return a;
    }
    async uid() { return (await this.auth()).uid; }
    async req(path, opt, needAuth) {
      const h = { 'Content-Type': 'application/json' };
      if (needAuth) h.Authorization = 'Bearer ' + (await this.auth()).token;
      const r = await fetchT(this.base + path, Object.assign({ headers: h }, opt));
      if (!r.ok) { let m = r.status; try { const j = await r.json(); m = (j.error && j.error.message) || m; } catch (e) {} throw new Error('Server: ' + m); }
      return r.status === 204 ? null : r.json();
    }
    toEntry(doc) {
      const f = unfields(doc.fields); const id = doc.name.split('/').pop();
      let project = null; try { project = JSON.parse(f.project || 'null'); } catch (e) {}
      return { id, kind: 'user', online: true, title: f.title, desc: f.desc, emoji: f.icon, author: f.author, authorId: f.authorId, likes: f.likes || 0, comments: f.comments || 0, createdAt: f.createdAt || 0, project };
    }
    async list(cursor, sort) {
      const q = { structuredQuery: { from: [{ collectionId: 'games' }], orderBy: [{ field: { fieldPath: sort === 'top' ? 'likes' : 'createdAt' }, direction: 'DESCENDING' }], limit: 10 } };
      if (cursor) q.structuredQuery.startAt = { values: [sort === 'top' ? { integerValue: String(cursor) } : { timestampValue: new Date(cursor).toISOString() }], before: false };
      const res = await this.req(':runQuery', { method: 'POST', body: JSON.stringify(q) });
      const items = (res || []).filter(x => x.document).map(x => this.toEntry(x.document));
      const last = items[items.length - 1];
      return { items, cursor: items.length === 10 && last ? (sort === 'top' ? last.likes : last.createdAt) : null };
    }
    async publish(e) {
      const a = await this.auth();
      const body = { fields: fields({ title: e.title, desc: e.desc || '', icon: e.emoji || '🎮', author: e.author, authorId: a.uid, likes: 0, comments: 0, createdAt: new Date(), project: JSON.stringify(e.project) }) };
      const doc = await this.req('/games', { method: 'POST', body: JSON.stringify(body) }, true);
      return doc.name.split('/').pop();
    }
    async unpublish(id) { await this.req('/games/' + id, { method: 'DELETE' }, true); }
    async commit(writes) {
      const a = await this.auth();
      const r = await fetchT(this.base + ':commit', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.token }, body: JSON.stringify({ writes }) });
      if (!r.ok) { let m = r.status; try { m = (await r.json()).error.message; } catch (e) {} throw new Error('Server: ' + m); }
    }
    async like(id, on) {
      const uid = await this.uid(); const likeDoc = `${this.root}/games/${id}/likes/${uid}`;
      const inc = { transform: { document: `${this.root}/games/${id}`, fieldTransforms: [{ fieldPath: 'likes', increment: { integerValue: on ? '1' : '-1' } }] } };
      await this.commit(on ? [{ update: { name: likeDoc, fields: fields({ at: new Date() }) }, currentDocument: { exists: false } }, inc] : [{ delete: likeDoc, currentDocument: { exists: true } }, inc]);
    }
    async comments(id) {
      const res = await this.req(`/games/${id}/comments?pageSize=60&orderBy=createdAt%20desc`, { method: 'GET' });
      return ((res && res.documents) || []).map(d => Object.assign({ id: d.name.split('/').pop() }, unfields(d.fields)));
    }
    async comment(id, text, author) {
      const uid = await this.uid(); const cid = SP.uid();
      await this.commit([
        { update: { name: `${this.root}/games/${id}/comments/${cid}`, fields: fields({ text, author, authorId: uid, createdAt: new Date() }) }, currentDocument: { exists: false } },
        { transform: { document: `${this.root}/games/${id}`, fieldTransforms: [{ fieldPath: 'comments', increment: { integerValue: '1' } }] } }
      ]);
    }
    async test() { await this.auth(); await this.list(null); return true; }
  }

  // ---------- demo server: lives only on this phone ----------
  class Demo {
    constructor() { this.kind = 'demo'; }
    db() { return store.get('demo_db', { games: [], comments: {}, likes: {} }); }
    save(d) { store.set('demo_db', d); }
    async uid() { return 'me'; }
    async list(cursor, sort) {
      const d = this.db(); let g = d.games.slice();
      g.sort((a, b) => sort === 'top' ? b.likes - a.likes : b.createdAt - a.createdAt);
      const start = cursor || 0; const items = g.slice(start, start + 10).map(x => Object.assign({ online: true, kind: 'user' }, x));
      return { items, cursor: start + 10 < g.length ? start + 10 : null };
    }
    async publish(e) { const d = this.db(); const id = 'demo-' + SP.uid(); d.games.push({ id, title: e.title, desc: e.desc, emoji: e.emoji, author: e.author, authorId: 'me', likes: 0, comments: 0, createdAt: Date.now(), project: e.project }); this.save(d); return id; }
    async unpublish(id) { const d = this.db(); d.games = d.games.filter(g => g.id !== id); this.save(d); }
    async like(id, on) { const d = this.db(); const g = d.games.find(x => x.id === id); if (g) g.likes = Math.max(0, g.likes + (on ? 1 : -1)); this.save(d); }
    async comments(id) { return (this.db().comments[id] || []).slice().reverse(); }
    async comment(id, text, author) { const d = this.db(); (d.comments[id] = d.comments[id] || []).push({ id: SP.uid(), text, author, authorId: 'me', createdAt: Date.now() }); const g = d.games.find(x => x.id === id); if (g) g.comments++; this.save(d); }
    async test() { return true; }
  }

  SP.backend = null;
  SP.initBackend = () => { const c = cfg(); SP.backend = c ? new Firebase(c) : new Demo(); return SP.backend; };
  SP.firebaseConfig = cfg;
})();
