// SwipePlay — game runner: one canvas, 360x640 logical units, ready / play / over states
(function () {
  const W = 360, H = 640, D = SP.draw;
  class Runner {
    constructor(host, game) {
      this.host = host; this.game = game;
      this.cv = document.createElement('canvas'); this.cv.className = 'gcv';
      host.appendChild(this.cv); this.g = this.cv.getContext('2d');
      this.state = 'ready'; this.score = 0; this.active = false; this.t = 0;
      this.best = SP.store.get('best_' + game.key, 0);
      const self = this;
      this.api = {
        W, H,
        add(n) { self.score += (n == null ? 1 : n); },
        set(n) { self.score = n; },
        get() { return self.score; },
        end(win) { self.end(win); },
        sfx: SP.sfx, note: SP.note,
        time() { return self.t; }
      };
      this.inst = game.make(this.api);
      this.inst.reset();
      this.resize();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
      const pd = e => { this.down(e); }, pm = e => { this.move(e); }, pu = e => { this.up(e); };
      this.cv.addEventListener('pointerdown', pd);
      this.cv.addEventListener('pointermove', pm);
      this.cv.addEventListener('pointerup', pu);
      this.cv.addEventListener('pointercancel', pu);
      this.loop = this.loop.bind(this);
      this.draw();
    }
    resize() {
      const r = this.host.getBoundingClientRect(); if (!r.width || !r.height) return;
      let w = r.width, h = r.height;
      if (w / h > W / H) w = h * W / H; else h = w * H / W;
      this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
      const d = Math.min(window.devicePixelRatio || 1, 2);
      this.cv.width = Math.round(w * d); this.cv.height = Math.round(h * d);
      this.scale = this.cv.width / W; this.draw();
    }
    loc(e) { const r = this.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
    down(e) {
      const p = this.loc(e); this.pdown = true;
      if (this.state === 'ready') { this.start(); return; }
      if (this.state === 'over') { if (performance.now() - this.overAt > 700) this.restart(true); return; }
      if (this.inst.down) this.inst.down(p.x, p.y);
    }
    move(e) { if (this.state !== 'play') return; const p = this.loc(e); if (this.inst.move) this.inst.move(p.x, p.y, this.pdown); }
    up(e) { this.pdown = false; if (this.state !== 'play') return; const p = this.loc(e); if (this.inst.up) this.inst.up(p.x, p.y); }
    start() { this.score = 0; this.t = 0; this.inst.reset(); this.state = 'play'; SP.sfx('start'); if (!this.active) this.draw(); }
    restart(play) { this.state = 'ready'; this.score = 0; this.t = 0; this.inst.reset(); if (play) this.start(); this.draw(); }
    end(win) {
      if (this.state !== 'play') return;
      this.state = 'over'; this.win = !!win; this.overAt = performance.now();
      const sc = Math.floor(this.score);
      this.newBest = sc > this.best; if (this.newBest) { this.best = sc; SP.store.set('best_' + this.game.key, sc); }
      SP.sfx(win ? 'win' : 'lose');
      if (navigator.vibrate) try { navigator.vibrate(win ? 40 : 90); } catch (e) {}
      if (this.onEnd) this.onEnd(sc, win);
    }
    setActive(a) {
      if (a === this.active) return; this.active = a;
      if (a) { this.last = performance.now(); requestAnimationFrame(this.loop); }
    }
    loop(t) {
      if (!this.active) return;
      const dt = Math.min(0.05, Math.max(0, (t - this.last) / 1000)); this.last = t;
      if (this.state === 'play') { this.t += dt; try { this.inst.update(dt); } catch (err) { console.error(err); this.end(false); } }
      this.draw(); requestAnimationFrame(this.loop);
    }
    draw() {
      const g = this.g; if (!this.scale) return;
      g.setTransform(this.scale, 0, 0, this.scale, 0, 0); g.shadowBlur = 0; g.globalAlpha = 1;
      try { this.inst.draw(g, this.state); } catch (err) { console.error(err); }
      g.shadowBlur = 0; g.globalAlpha = 1;
      if (this.state === 'play' && this.game.hud !== false) {
        D.rr(g, W / 2 - 46, 14, 92, 34, 17); g.fillStyle = 'rgba(0,0,0,.38)'; g.fill();
        D.text(g, String(Math.floor(this.score)), W / 2, 32, 20, '#fff', 'center', 800);
      }
      if (this.state === 'ready') this.overlayReady(g);
      if (this.state === 'over') this.overlayOver(g);
    }
    card(g, h) { const y = H / 2 - h / 2; g.fillStyle = 'rgba(6,8,14,.55)'; g.fillRect(0, 0, W, H); D.rr(g, 34, y, W - 68, h, 22); g.fillStyle = 'rgba(20,24,36,.92)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.stroke(); return y; }
    overlayReady(g) {
      const gm = this.game, y = this.card(g, gm.ai ? 300 : 270);
      D.emoji(g, gm.emoji || '🎮', W / 2, y + 58, 52);
      D.text(g, gm.title, W / 2, y + 112, 24, '#fff', 'center', 800);
      wrap(g, gm.how || '', W / 2, y + 146, W - 110, 15, '#aab3c8');
      let yy = y + 206;
      if (gm.ai) {
        D.rr(g, W / 2 - 74, yy - 15, 148, 30, 15); const gr = g.createLinearGradient(W / 2 - 74, 0, W / 2 + 74, 0); gr.addColorStop(0, '#7c5cff'); gr.addColorStop(1, '#ff4d8d'); g.fillStyle = gr; g.fill();
        D.text(g, '🤖  Made by AI', W / 2, yy, 13, '#fff', 'center', 800); yy += 40;
      }
      const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 300);
      g.globalAlpha = pulse; D.text(g, 'TAP TO PLAY', W / 2, yy + 8, 16, '#35d0ff', 'center', 900); g.globalAlpha = 1;
      if (this.best) D.text(g, 'Best ' + this.best, W / 2, yy + 34, 12, '#7d8699', 'center', 600);
    }
    overlayOver(g) {
      const y = this.card(g, 250);
      D.text(g, this.win ? 'You win!' : 'Game over', W / 2, y + 52, 28, this.win ? '#7cffb2' : '#ff6b8b', 'center', 900);
      D.text(g, String(Math.floor(this.score)), W / 2, y + 112, 54, '#fff', 'center', 900);
      D.text(g, this.newBest ? '★ New best!' : 'Best ' + this.best, W / 2, y + 160, 14, this.newBest ? '#ffd23f' : '#8f98ad', 'center', 700);
      if (performance.now() - this.overAt > 700) D.text(g, 'Tap to play again', W / 2, y + 205, 15, '#35d0ff', 'center', 800);
    }
    destroy() { this.active = false; this.ro.disconnect(); if (this.inst.destroy) this.inst.destroy(); this.cv.remove(); }
  }
  function wrap(g, txt, x, y, maxW, size, color) {
    g.font = `500 ${size}px system-ui,sans-serif`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    const words = String(txt).split(' '); let line = '', yy = y, n = 0;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); yy += size * 1.35; line = w; if (++n >= 2) break; } else line = t; }
    if (line && n < 3) g.fillText(line, x, yy);
  }
  SP.Runner = Runner; SP.W = W; SP.H = H;
})();
