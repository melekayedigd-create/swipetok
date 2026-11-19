// SwipePlay — Scratch-style blocks: definitions + runtime
(function () {
  const W = 360, H = 640, D = SP.draw;
  const CAT = { events: '#ffbf00', motion: '#4c97ff', looks: '#9966ff', sound: '#cf63cf', control: '#ffab19', sensing: '#5cb1d6', operators: '#59c059', variables: '#ff8c1a' };
  const CATN = { events: 'Events', motion: 'Motion', looks: 'Looks', sound: 'Sound', control: 'Control', sensing: 'Sensing', operators: 'Operators', variables: 'Variables' };
  const BACKDROPS = {
    night: ['#0b1a3a', '#3b1d5c'], sunset: ['#ffb36b', '#4a2a6a'], ocean: ['#0a4a7a', '#04162b'], forest: ['#1f5a3a', '#0b2219'],
    space: ['#05060f', '#1a0b2e'], candy: ['#ff9ad5', '#7c5cff'], sky: ['#7fd3ff', '#e9f8ff'], dark: ['#11141c', '#11141c'], light: ['#f3f5fa', '#f3f5fa'], lava: ['#3a0b0b', '#ff6a3d']
  };
  const SOUNDS = ['pop', 'coin', 'jump', 'hit', 'win', 'lose', 'laser', 'tick'];
  const B = {};
  function def(op, cat, text, args, opt) { B[op] = Object.assign({ op, cat, text, args: args || {} }, opt || {}); }
  const N = (d) => ({ t: 'num', d }), T = (d) => ({ t: 'text', d }), BO = { t: 'bool' };
  // events
  def('flag', 'events', 'when ▶ game starts', 0, { hat: 1 });
  def('tapStage', 'events', 'when stage tapped', 0, { hat: 1 });
  def('tapMe', 'events', 'when this sprite tapped', 0, { hat: 1 });
  def('receive', 'events', 'when I receive %m', { m: T('go') }, { hat: 1 });
  def('broadcast', 'events', 'broadcast %m', { m: T('go') });
  // motion
  def('move', 'motion', 'move %n steps', { n: N(10) });
  def('turnR', 'motion', 'turn ↻ %n degrees', { n: N(15) });
  def('turnL', 'motion', 'turn ↺ %n degrees', { n: N(15) });
  def('pointDir', 'motion', 'point in direction %d', { d: N(90) });
  def('pointFinger', 'motion', 'point towards finger');
  def('goXY', 'motion', 'go to x: %x y: %y', { x: N(0), y: N(0) });
  def('goFinger', 'motion', 'go to finger');
  def('goRandom', 'motion', 'go to random position');
  def('glide', 'motion', 'glide %s secs to x: %x y: %y', { s: N(1), x: N(0), y: N(0) });
  def('changeX', 'motion', 'change x by %n', { n: N(10) });
  def('setX', 'motion', 'set x to %n', { n: N(0) });
  def('changeY', 'motion', 'change y by %n', { n: N(10) });
  def('setY', 'motion', 'set y to %n', { n: N(0) });
  def('bounce', 'motion', 'if on edge, bounce');
  def('xpos', 'motion', 'x position', 0, { r: 1 });
  def('ypos', 'motion', 'y position', 0, { r: 1 });
  def('direction', 'motion', 'direction', 0, { r: 1 });
  // looks
  def('sayFor', 'looks', 'say %t for %s secs', { t: T('Hello!'), s: N(2) });
  def('say', 'looks', 'say %t', { t: T('Hi!') });
  def('costume', 'looks', 'switch costume to %c', { c: { t: 'costume', d: '⭐' } });
  def('color', 'looks', 'set color to %c', { c: { t: 'color', d: '#ff4d8d' } });
  def('setSize', 'looks', 'set size to %n %', { n: N(100) });
  def('changeSize', 'looks', 'change size by %n', { n: N(10) });
  def('show', 'looks', 'show'); def('hide', 'looks', 'hide');
  def('front', 'looks', 'go to front layer');
  def('backdrop', 'looks', 'switch backdrop to %c', { c: { t: 'menu', d: 'night', o: Object.keys(BACKDROPS) } });
  // sound
  def('sound', 'sound', 'play sound %s', { s: { t: 'menu', d: 'pop', o: SOUNDS } });
  def('note', 'sound', 'play note %n', { n: N(60) });
  // control
  def('wait', 'control', 'wait %s secs', { s: N(1) });
  def('repeat', 'control', 'repeat %n', { n: N(10) }, { c: 1 });
  def('forever', 'control', 'forever', 0, { c: 1, cap: 1 });
  def('if', 'control', 'if %b then', { b: BO }, { c: 1 });
  def('ifElse', 'control', 'if %b then', { b: BO }, { c: 2 });
  def('waitUntil', 'control', 'wait until %b', { b: BO });
  def('repeatUntil', 'control', 'repeat until %b', { b: BO }, { c: 1 });
  def('cloneStart', 'control', 'when I start as a clone', 0, { hat: 1 });
  def('clone', 'control', 'create clone of myself');
  def('delClone', 'control', 'delete this clone', 0, { cap: 1 });
  def('gameOver', 'control', 'game over: %r', { r: { t: 'menu', d: 'you win', o: ['you win', 'you lose'] } }, { cap: 1 });
  // sensing
  def('touching', 'sensing', 'touching %o ?', { o: { t: 'sprite', d: 'edge' } }, { bool: 1 });
  def('fingerDown', 'sensing', 'finger down?', 0, { bool: 1 });
  def('fingerX', 'sensing', 'finger x', 0, { r: 1 });
  def('fingerY', 'sensing', 'finger y', 0, { r: 1 });
  def('distFinger', 'sensing', 'distance to finger', 0, { r: 1 });
  def('timer', 'sensing', 'timer', 0, { r: 1 });
  def('resetTimer', 'sensing', 'reset timer');
  // operators
  def('add', 'operators', '%a + %b', { a: N(''), b: N('') }, { r: 1 });
  def('sub', 'operators', '%a − %b', { a: N(''), b: N('') }, { r: 1 });
  def('mul', 'operators', '%a × %b', { a: N(''), b: N('') }, { r: 1 });
  def('div', 'operators', '%a ÷ %b', { a: N(''), b: N('') }, { r: 1 });
  def('rand', 'operators', 'pick random %a to %b', { a: N(1), b: N(10) }, { r: 1 });
  def('gt', 'operators', '%a > %b', { a: N(''), b: N(50) }, { bool: 1 });
  def('lt', 'operators', '%a < %b', { a: N(''), b: N(50) }, { bool: 1 });
  def('eq', 'operators', '%a = %b', { a: N(''), b: N(50) }, { bool: 1 });
  def('and', 'operators', '%a and %b', { a: BO, b: BO }, { bool: 1 });
  def('or', 'operators', '%a or %b', { a: BO, b: BO }, { bool: 1 });
  def('not', 'operators', 'not %a', { a: BO }, { bool: 1 });
  def('mod', 'operators', '%a mod %b', { a: N(''), b: N(2) }, { r: 1 });
  def('round', 'operators', 'round %a', { a: N('') }, { r: 1 });
  // variables
  def('setVar', 'variables', 'set %v to %n', { v: { t: 'var', d: 'score' }, n: T(0) });
  def('changeVar', 'variables', 'change %v by %n', { v: { t: 'var', d: 'score' }, n: N(1) });
  def('getVar', 'variables', '%v', { v: { t: 'var', d: 'score' } }, { r: 1 });

  function newBlock(op) {
    const d = B[op], b = { op, a: {} };
    for (const k in d.args) b.a[k] = d.args[k].d === undefined ? '' : d.args[k].d;
    if (d.c) b.s1 = []; if (d.c === 2) b.s2 = [];
    return b;
  }
  const clone = o => JSON.parse(JSON.stringify(o));
  const SHAPES = { '●': 1, '■': 1, '▲': 1, '★': 1, '◆': 1 };

  function drawCostume(g, token, color, s) {
    if (SHAPES[token]) {
      g.fillStyle = color || '#ff4d8d'; g.beginPath();
      if (token === '●') g.arc(0, 0, s / 2, 0, 7);
      else if (token === '■') g.rect(-s / 2, -s / 2, s, s);
      else if (token === '▲') { g.moveTo(0, -s / 2); g.lineTo(s / 2, s / 2); g.lineTo(-s / 2, s / 2); g.closePath(); }
      else if (token === '◆') { g.moveTo(0, -s / 2); g.lineTo(s / 2, 0); g.lineTo(0, s / 2); g.lineTo(-s / 2, 0); g.closePath(); }
      else { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? s * .22 : s / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); }
      g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke();
    } else D.emoji(g, token || '❓', 0, s * .04, s);
  }
  function drawBackdrop(g, name) { const c = BACKDROPS[name] || BACKDROPS.night; D.bg(g, W, H, c[0], c[1]); }

  // ---------------- runtime ----------------
  const wrapDir = d => { d = ((d + 180) % 360 + 360) % 360 - 180; return d === -180 ? 180 : d; };
  class Runtime {
    constructor(project, api) { this.p = project; this.api = api; }
    makeInst(spr, isClone, from) {
      const I = from ? Object.assign({}, from, { say: '', sayUntil: 0 }) : { x: +spr.x || 0, y: +spr.y || 0, dir: +spr.dir || 90, size: +spr.size || 100, visible: spr.visible !== false, costume: spr.costume || '⭐', color: spr.color || '#ff4d8d', say: '' };
      I.spr = spr; I.isClone = isClone; I.dead = false; I.layer = ++this.layerN; return I;
    }
    reset() {
      this.layerN = 0; this.time = 0; this.t0 = 0; this.ended = false; this.started = false;
      this.vars = {}; for (const v of (this.p.vars || ['score'])) this.vars[v] = 0;
      this.bg = this.p.bg || 'night';
      this.insts = (this.p.sprites || []).map(s => this.makeInst(s, false));
      this.threads = []; this.finger = { down: false, x: 0, y: 0 };
    }
    rad(I) { return 24 * I.size / 100; }
    hats(op, filter, only) {
      for (const I of (only ? [only] : this.insts.slice())) {
        if (I.dead || (op === 'flag' && I.isClone)) continue;
        for (const st of (I.spr.scripts || [])) {
          const h = st.blocks && st.blocks[0];
          if (h && h.op === op && (!filter || filter(h, I))) this.spawn(I, st);
        }
      }
    }
    spawn(I, st) {
      const ex = this.threads.find(t => t.I === I && t.st === st && !t.done);
      const gen = this.run(I, st.blocks.slice(1));
      if (ex) ex.gen = gen; else this.threads.push({ I, st, gen, done: false });
    }
    update(dt) {
      if (!this.started) { this.started = true; this.hats('flag'); }
      this.time += dt;
      const list = this.threads.slice();
      for (const t of list) {
        if (this.ended) break;
        if (t.done || t.I.dead) { t.done = true; continue; }
        let r; try { r = t.gen.next(); } catch (e) { console.error(e); r = { done: true }; }
        if (r.done) t.done = true;
      }
      this.threads = this.threads.filter(t => !t.done && !t.I.dead);
      this.insts = this.insts.filter(I => !I.dead);
      for (const I of this.insts) if (I.say && I.sayUntil && this.time > I.sayUntil) { I.say = ''; I.sayUntil = 0; }
      if ('score' in this.vars) this.api.set(+this.vars.score || 0);
    }
    hit(sx, sy) {
      const list = this.insts.filter(I => I.visible && !I.dead).sort((a, b) => b.layer - a.layer);
      return list.find(I => Math.hypot(sx - I.x, sy - I.y) < this.rad(I) + 8);
    }
    down(x, y) { const sx = x - W / 2, sy = H / 2 - y; this.finger = { down: true, x: sx, y: sy }; const I = this.hit(sx, sy); if (I) this.hats('tapMe', null, I); this.hats('tapStage'); }
    move(x, y) { this.finger.x = x - W / 2; this.finger.y = H / 2 - y; }
    up() { this.finger.down = false; }
    fence(I) { const r = this.rad(I) * .5; I.x = Math.max(-W / 2 - r, Math.min(W / 2 + r, I.x)); I.y = Math.max(-H / 2 - r, Math.min(H / 2 + r, I.y)); }
    cloneOf(I) {
      if (this.insts.length > 160) return;
      const C = this.makeInst(I.spr, true, I); this.insts.push(C);
      for (const st of (I.spr.scripts || [])) if (st.blocks[0] && st.blocks[0].op === 'cloneStart') this.spawn(C, st);
    }
    val(I, v) { return (v && typeof v === 'object' && v.op) ? this.rep(I, v) : v; }
    num(I, v) { const x = +this.val(I, v); return isFinite(x) ? x : 0; }
    str(I, v) { const x = this.val(I, v); return x == null ? '' : String(x); }
    bool(I, v) { const x = this.val(I, v); return x === true || x === 'true' || (typeof x === 'number' && x !== 0); }
    touching(I, name) {
      const r = this.rad(I);
      if (name === 'edge') return Math.abs(I.x) + r > W / 2 || Math.abs(I.y) + r > H / 2;
      if (name === 'finger') return this.finger.down && Math.hypot(this.finger.x - I.x, this.finger.y - I.y) < r + 6;
      return this.insts.some(o => o !== I && !o.dead && o.visible && o.spr.name === name && Math.hypot(o.x - I.x, o.y - I.y) < (r + this.rad(o)) * .82);
    }
    rep(I, b) {
      const a = b.a || {}, n = k => this.num(I, a[k]);
      switch (b.op) {
        case 'xpos': return Math.round(I.x); case 'ypos': return Math.round(I.y); case 'direction': return Math.round(I.dir);
        case 'touching': return I.visible && this.touching(I, this.str(I, a.o));
        case 'fingerDown': return this.finger.down; case 'fingerX': return Math.round(this.finger.x); case 'fingerY': return Math.round(this.finger.y);
        case 'distFinger': return Math.round(Math.hypot(this.finger.x - I.x, this.finger.y - I.y));
        case 'timer': return Math.round((this.time - this.t0) * 100) / 100;
        case 'add': return n('a') + n('b'); case 'sub': return n('a') - n('b'); case 'mul': return n('a') * n('b');
        case 'div': return n('b') === 0 ? 0 : n('a') / n('b');
        case 'mod': { const m = n('b'); return m === 0 ? 0 : ((n('a') % m) + m) % m; }
        case 'round': return Math.round(n('a'));
        case 'rand': { let x = n('a'), y = n('b'); if (x > y) [x, y] = [y, x]; return (Number.isInteger(x) && Number.isInteger(y)) ? Math.floor(x + Math.random() * (y - x + 1)) : x + Math.random() * (y - x); }
        case 'gt': return n('a') > n('b'); case 'lt': return n('a') < n('b');
        case 'eq': { const x = this.val(I, a.a), y = this.val(I, a.b); return (isFinite(+x) && isFinite(+y) && String(x) !== '' && String(y) !== '') ? +x === +y : String(x).toLowerCase() === String(y).toLowerCase(); }
        case 'and': return this.bool(I, a.a) && this.bool(I, a.b); case 'or': return this.bool(I, a.a) || this.bool(I, a.b); case 'not': return !this.bool(I, a.a);
        case 'getVar': return this.vars[a.v] == null ? 0 : this.vars[a.v];
      }
      return 0;
    }
    *run(I, list) { for (const b of list) { if (I.dead || this.ended) return; yield* this.ex(I, b); } }
    *ex(I, b) {
      const a = b.a || {}, n = k => this.num(I, a[k]), s = k => this.str(I, a[k]), bo = k => this.bool(I, a[k]);
      switch (b.op) {
        case 'move': { const d = n('n'), r = I.dir * Math.PI / 180; I.x += d * Math.sin(r); I.y += d * Math.cos(r); this.fence(I); break; }
        case 'turnR': I.dir = wrapDir(I.dir + n('n')); break;
        case 'turnL': I.dir = wrapDir(I.dir - n('n')); break;
        case 'pointDir': I.dir = wrapDir(n('d')); break;
        case 'pointFinger': I.dir = wrapDir(Math.atan2(this.finger.x - I.x, this.finger.y - I.y) * 180 / Math.PI); break;
        case 'goXY': I.x = n('x'); I.y = n('y'); this.fence(I); break;
        case 'goFinger': I.x = this.finger.x; I.y = this.finger.y; break;
        case 'goRandom': I.x = Math.random() * 320 - 160; I.y = Math.random() * 580 - 290; break;
        case 'glide': { const dur = Math.max(0, n('s')), x0 = I.x, y0 = I.y, x1 = n('x'), y1 = n('y'), t0 = this.time; while (this.time < t0 + dur) { const k = (this.time - t0) / dur; I.x = x0 + (x1 - x0) * k; I.y = y0 + (y1 - y0) * k; yield; } I.x = x1; I.y = y1; break; }
        case 'changeX': I.x += n('n'); this.fence(I); break; case 'setX': I.x = n('n'); this.fence(I); break;
        case 'changeY': I.y += n('n'); this.fence(I); break; case 'setY': I.y = n('n'); this.fence(I); break;
        case 'bounce': { const r = this.rad(I); if (I.x - r < -W / 2) { I.x = -W / 2 + r; I.dir = wrapDir(-I.dir); } if (I.x + r > W / 2) { I.x = W / 2 - r; I.dir = wrapDir(-I.dir); } if (I.y + r > H / 2) { I.y = H / 2 - r; I.dir = wrapDir(180 - I.dir); } if (I.y - r < -H / 2) { I.y = -H / 2 + r; I.dir = wrapDir(180 - I.dir); } break; }
        case 'sayFor': { I.say = s('t'); const until = this.time + n('s'); I.sayUntil = 0; while (this.time < until) yield; if (I.say === s('t')) I.say = ''; break; }
        case 'say': I.say = s('t'); I.sayUntil = 0; break;
        case 'costume': I.costume = s('c'); break;
        case 'color': I.color = s('c'); break;
        case 'setSize': I.size = Math.max(5, Math.min(600, n('n'))); break;
        case 'changeSize': I.size = Math.max(5, Math.min(600, I.size + n('n'))); break;
        case 'show': I.visible = true; break; case 'hide': I.visible = false; break;
        case 'front': I.layer = ++this.layerN; break;
        case 'backdrop': this.bg = s('c'); break;
        case 'sound': this.api.sfx(s('s')); break;
        case 'note': this.api.note(n('n')); break;
        case 'wait': { const until = this.time + n('s'); do { yield; } while (this.time < until); break; }
        case 'repeat': { const k = Math.round(n('n')); for (let i = 0; i < k; i++) { yield* this.run(I, b.s1 || []); yield; if (I.dead || this.ended) return; } break; }
        case 'forever': for (;;) { yield* this.run(I, b.s1 || []); yield; if (I.dead || this.ended) return; }
        case 'if': if (bo('b')) yield* this.run(I, b.s1 || []); break;
        case 'ifElse': yield* this.run(I, bo('b') ? (b.s1 || []) : (b.s2 || [])); break;
        case 'waitUntil': while (!bo('b')) { yield; if (I.dead || this.ended) return; } break;
        case 'repeatUntil': while (!bo('b')) { yield* this.run(I, b.s1 || []); yield; if (I.dead || this.ended) return; } break;
        case 'clone': this.cloneOf(I); break;
        case 'delClone': if (I.isClone) I.dead = true; return;
        case 'gameOver': { const win = s('r') === 'you win'; this.ended = true; if ('score' in this.vars) this.api.set(+this.vars.score || 0); this.api.end(win); return; }
        case 'resetTimer': this.t0 = this.time; break;
        case 'broadcast': { const m = s('m'); this.hats('receive', (h, J) => this.str(J, h.a.m) === m); break; }
        case 'setVar': { const v = this.val(I, a.n); this.vars[a.v] = (v !== '' && isFinite(+v)) ? +v : v; break; }
        case 'changeVar': this.vars[a.v] = (+this.vars[a.v] || 0) + n('n'); break;
      }
    }
    draw(g) {
      drawBackdrop(g, this.bg);
      const list = this.insts.filter(I => I.visible && !I.dead).sort((x, y) => x.layer - y.layer);
      for (const I of list) {
        const sz = 48 * I.size / 100;
        g.save(); g.translate(W / 2 + I.x, H / 2 - I.y); if (I.spr.rotate) g.rotate((I.dir - 90) * Math.PI / 180);
        drawCostume(g, I.costume, I.color, sz); g.restore();
      }
      for (const I of list) if (I.say) {
        const x = W / 2 + I.x, y = H / 2 - I.y - 24 * I.size / 100 - 12;
        g.font = '600 13px system-ui,sans-serif'; const tw = Math.min(200, g.measureText(I.say).width) + 20;
        const bx = Math.max(4, Math.min(W - tw - 4, x - tw / 2));
        D.rr(g, bx, y - 30, tw, 28, 12); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.2)'; g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - 6, y - 3); g.lineTo(x + 2, y + 6); g.lineTo(x + 6, y - 3); g.fill();
        D.text(g, I.say.length > 28 ? I.say.slice(0, 27) + '…' : I.say, bx + tw / 2, y - 16, 13, '#1a1d27', 'center', 600);
      }
      let mx = 10;
      for (const k in this.vars) {
        const txt = k + '  ' + (typeof this.vars[k] === 'number' ? Math.round(this.vars[k] * 100) / 100 : this.vars[k]);
        g.font = '700 13px system-ui,sans-serif'; const w = g.measureText(txt).width + 18; if (mx + w > W - 10) break;
        D.rr(g, mx, 12, w, 26, 13); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); D.text(g, txt, mx + w / 2, 25, 13, '#ffcf8a', 'center', 700); mx += w + 6;
      }
    }
  }

  function userGame(entry) {
    const p = entry.project || {};
    return { key: 'u_' + entry.id, title: entry.title || p.title || 'Untitled', emoji: entry.emoji || p.icon || '🎮', how: entry.desc || p.desc || 'Made with SwipePlay blocks.', ai: false, hud: false, make: api => new Runtime(p, api) };
  }

  // ---------------- templates ----------------
  function starterProject() {
    const s = (op, a, extra) => Object.assign({ op, a: a || {} }, extra || {});
    return {
      v: 1, title: 'Star Catcher', desc: 'Drag the cat to catch 10 falling stars!', icon: '🐱', bg: 'night', vars: ['score'],
      sprites: [
        { name: 'Cat', costume: '🐱', color: '#ff4d8d', x: 0, y: -250, size: 130, dir: 90, visible: true, rotate: false, scripts: [
          { x: 16, y: 16, blocks: [s('flag'), s('setVar', { v: 'score', n: 0 }), s('forever', {}, { s1: [s('if', { b: s('fingerDown') }, { s1: [s('setX', { n: s('fingerX') })] })] })] },
          { x: 16, y: 290, blocks: [s('flag'), s('waitUntil', { b: s('gt', { a: s('getVar', { v: 'score' }), b: 9 }) }), s('gameOver', { r: 'you win' })] }
        ] },
        { name: 'Star', costume: '⭐', color: '#ffd23f', x: 0, y: 330, size: 90, dir: 90, visible: false, rotate: false, scripts: [
          { x: 16, y: 16, blocks: [s('flag'), s('hide'), s('forever', {}, { s1: [s('clone'), s('wait', { s: 0.8 })] })] },
          { x: 16, y: 230, blocks: [s('cloneStart'), s('goXY', { x: s('rand', { a: -160, b: 160 }), y: 330 }), s('show'),
            s('repeatUntil', { b: s('lt', { a: s('ypos'), b: -315 }) }, { s1: [s('changeY', { n: -6 }), s('if', { b: s('touching', { o: 'Cat' }) }, { s1: [s('changeVar', { v: 'score', n: 1 }), s('sound', { s: 'coin' }), s('delClone')] })] }),
            s('delClone')] }
        ] }
      ]
    };
  }
  function blankProject() {
    return { v: 1, title: 'My game', desc: '', icon: '🎮', bg: 'night', vars: ['score'], sprites: [
      { name: 'Hero', costume: '🐤', color: '#ffd23f', x: 0, y: 0, size: 120, dir: 90, visible: true, rotate: false, scripts: [
        { x: 16, y: 16, blocks: [{ op: 'flag', a: {} }, { op: 'sayFor', a: { t: 'Tap me!', s: 2 } }] },
        { x: 16, y: 150, blocks: [{ op: 'tapMe', a: {} }, { op: 'changeVar', a: { v: 'score', n: 1 } }, { op: 'sound', a: { s: 'pop' } }, { op: 'goRandom', a: {} }] }
      ] }
    ] };
  }

  SP.Blocks = { B, CAT, CATN, BACKDROPS, newBlock, clone, drawCostume, drawBackdrop, Runtime, userGame, starterProject, blankProject, SHAPES };
})();
