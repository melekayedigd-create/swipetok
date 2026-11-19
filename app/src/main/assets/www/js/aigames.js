// SwipePlay — 15 built-in games, all made by AI (labelled as such in the app)
(function () {
  const W = 360, H = 640, D = SP.draw;
  const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const G = [];
  const add = o => { o.ai = true; G.push(o); };
  function stars(n) { return Array.from({ length: n }, () => ({ x: R(0, W), y: R(0, H), r: R(.4, 1.6), a: R(.2, .9) })); }
  function drawStars(g, s) { for (const p of s) { g.globalAlpha = p.a; g.fillStyle = '#fff'; g.fillRect(p.x, p.y, p.r, p.r); } g.globalAlpha = 1; }

  // 1 ─ Sky Hopper
  add({ key: 'sky', title: 'Sky Hopper', emoji: '🐤', color: '#35d0ff', how: 'Tap to flap. Fly through the gaps in the neon pipes.', make(api) {
    let b, pipes, t, st = stars(50);
    return {
      reset() { b = { y: 300, vy: 0 }; pipes = []; t = .6; },
      down() { b.vy = -330; api.sfx('jump'); },
      update(dt) {
        b.vy += 1100 * dt; b.y += b.vy * dt; t -= dt;
        const sp = 150 + api.get() * 3;
        if (t <= 0) { t = 1.5; pipes.push({ x: W + 40, gy: R(170, 470), p: false }); }
        for (const p of pipes) {
          p.x -= sp * dt;
          if (!p.p && p.x + 32 < 100) { p.p = true; api.add(); api.sfx('coin'); }
          if (Math.abs(p.x - 100) < 32 + 14 && (b.y - 14 < p.gy - 88 || b.y + 14 > p.gy + 88)) { api.sfx('hit'); api.end(false); }
        }
        pipes = pipes.filter(p => p.x > -80);
        if (b.y > H - 40 || b.y < 0) { api.sfx('hit'); api.end(false); }
      },
      draw(g) {
        D.bg(g, W, H, '#0b1a3a', '#3b1d5c'); drawStars(g, st);
        g.fillStyle = '#1a1036'; g.fillRect(0, H - 40, W, 40); g.fillStyle = '#ff4d8d'; g.fillRect(0, H - 40, W, 3);
        for (const p of pipes) {
          D.glow(g, '#38ffb0', 14); g.fillStyle = '#20c98a';
          D.rr(g, p.x - 32, -10, 64, p.gy - 88 + 10, 10); g.fill(); D.rr(g, p.x - 32, p.gy + 88, 64, H, 10); g.fill(); D.noGlow(g);
          g.fillStyle = '#7dffd0'; g.fillRect(p.x - 36, p.gy - 100, 72, 12); g.fillRect(p.x - 36, p.gy + 88, 72, 12);
        }
        g.save(); g.translate(100, b.y); g.rotate(cl(b.vy / 600, -.5, .8));
        D.glow(g, '#ffd23f', 18); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.fill(); D.noGlow(g);
        g.fillStyle = '#fff'; g.beginPath(); g.arc(6, -4, 5, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(7.5, -4, 2.3, 0, 7); g.fill();
        g.fillStyle = '#ff8a3c'; g.beginPath(); g.moveTo(13, 1); g.lineTo(22, 4); g.lineTo(13, 7); g.fill();
        g.fillStyle = '#ffb92e'; g.beginPath(); g.ellipse(-5, 4, 8, 5, -.4, 0, 7); g.fill(); g.restore();
      }
    };
  } });

  // 2 ─ Stack Tower
  add({ key: 'stack', title: 'Stack Tower', emoji: '🧱', color: '#ff9a3c', how: 'Tap to drop the sliding block. Only the overlapping part stays!', make(api) {
    let blocks, cur, cam, falls;
    const BH = 28;
    const col = i => `hsl(${(i * 23) % 360} 85% 60%)`;
    return {
      reset() { blocks = [{ x: 80, w: 200 }]; cur = { x: -200, w: 200, dir: 1, sp: 170 }; cam = 0; falls = []; },
      down() {
        const p = blocks[blocks.length - 1];
        const l = Math.max(cur.x, p.x), r = Math.min(cur.x + cur.w, p.x + p.w), w = r - l;
        if (w <= 0) { falls.push({ x: cur.x, w: cur.w, y: blocks.length, vy: 0, i: blocks.length }); api.sfx('hit'); api.end(false); return; }
        let nx = l, nw = w;
        if (Math.abs(cur.x - p.x) < 6) { nx = p.x; nw = p.w; api.sfx('coin'); api.add(2); }
        else { api.sfx('pop'); api.add(1); const cut = cur.x < p.x ? { x: cur.x, w: p.x - cur.x } : { x: r, w: cur.x + cur.w - r }; falls.push({ x: cut.x, w: cut.w, y: blocks.length, vy: 0, i: blocks.length }); }
        blocks.push({ x: nx, w: nw });
        const d = blocks.length % 2 ? 1 : -1;
        cur = { x: d > 0 ? -nw : W, w: nw, dir: d, sp: Math.min(420, cur.sp + 10) };
      },
      update(dt) {
        cur.x += cur.dir * cur.sp * dt;
        if (cur.x > W) { cur.dir = -1; } if (cur.x + cur.w < 0) { cur.dir = 1; }
        cam += (Math.max(0, (blocks.length - 10) * BH) - cam) * Math.min(1, dt * 4);
        for (const f of falls) { f.vy += 900 * dt; f.y -= f.vy * dt / BH; }
        falls = falls.filter(f => f.y > -30);
      },
      draw(g) {
        D.bg(g, W, H, '#1b0f2e', '#0a1626');
        const Y = i => H - 70 - (i + 1) * BH + cam;
        g.fillStyle = '#121a2c'; g.fillRect(0, Y(-1) + BH, W, H);
        blocks.forEach((b, i) => { g.fillStyle = col(i); D.rr(g, b.x, Y(i), b.w, BH - 2, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(b.x + 3, Y(i) + 3, b.w - 6, 4); });
        for (const f of falls) { g.globalAlpha = .7; g.fillStyle = col(f.i); g.fillRect(f.x, Y(f.y), f.w, BH - 2); g.globalAlpha = 1; }
        if (cur) { D.glow(g, col(blocks.length), 16); g.fillStyle = col(blocks.length); D.rr(g, cur.x, Y(blocks.length), cur.w, BH - 2, 5); g.fill(); D.noGlow(g); }
      }
    };
  } });

  // 3 ─ Neon Dodge
  add({ key: 'dodge', title: 'Neon Dodge', emoji: '🛸', color: '#ff4d8d', how: 'Drag left and right to dodge the falling blocks.', make(api) {
    let px, tx, rocks, t, sp, st = stars(70);
    return {
      reset() { px = tx = W / 2; rocks = []; t = 0; sp = 230; },
      down(x) { tx = x; }, move(x) { tx = x; },
      update(dt) {
        px += (tx - px) * Math.min(1, dt * 14); px = cl(px, 22, W - 22);
        sp += dt * 9; t -= dt; api.add(dt * 10);
        if (t <= 0) { t = Math.max(.28, .75 - api.get() / 900); const w = R(36, 92); rocks.push({ x: R(0, W - w), w, h: R(22, 40), y: -40, c: `hsl(${RI(280, 340)} 90% 62%)` }); }
        for (const r of rocks) { r.y += sp * dt; if (r.y + r.h > 548 && r.y < 580 && px + 16 > r.x && px - 16 < r.x + r.w) { api.sfx('hit'); api.end(false); } }
        rocks = rocks.filter(r => r.y < H + 50);
        for (const s of st) { s.y += sp * dt * s.r * .4; if (s.y > H) s.y = 0; }
      },
      draw(g) {
        D.bg(g, W, H, '#05060f', '#1a0b2e'); drawStars(g, st);
        for (const r of rocks) { D.glow(g, r.c, 16); g.fillStyle = r.c; D.rr(g, r.x, r.y, r.w, r.h, 6); g.fill(); }
        D.noGlow(g); D.glow(g, '#35d0ff', 20); D.emoji(g, '🛸', px, 562, 40); D.noGlow(g);
      }
    };
  } });

  // 4 ─ Mole Mash
  add({ key: 'mole', title: 'Mole Mash', emoji: '🐹', color: '#7cff5a', how: 'Tap the moles before they hide. You have 30 seconds!', make(api) {
    let moles, spawn, left, hits;
    const cell = i => ({ x: 70 + (i % 3) * 110, y: 230 + Math.floor(i / 3) * 130 });
    return {
      reset() { moles = []; spawn = .4; left = 30; hits = []; },
      down(x, y) {
        for (const m of moles) { const c = cell(m.i); if (!m.hit && Math.hypot(x - c.x, y - (c.y - 18)) < 46) { m.hit = true; m.t = Math.min(m.t, .18); api.add(); api.sfx('pop'); hits.push({ x: c.x, y: c.y - 60, t: .5 }); return; } }
      },
      update(dt) {
        left -= dt; if (left <= 0) { left = 0; api.end(true); return; }
        spawn -= dt; if (spawn <= 0) { spawn = R(.35, .8) * (0.5 + left / 60); const free = [...Array(9).keys()].filter(i => !moles.some(m => m.i === i)); if (free.length) moles.push({ i: free[RI(0, free.length - 1)], t: R(.7, 1.1) - (30 - left) / 80, up: 0, hit: false }); }
        for (const m of moles) { m.t -= dt; m.up = Math.min(1, m.up + dt * 6); }
        moles = moles.filter(m => m.t > 0);
        for (const h of hits) h.t -= dt; hits = hits.filter(h => h.t > 0);
      },
      draw(g) {
        D.bg(g, W, H, '#123d2a', '#0b2219');
        D.rr(g, 30, 90, W - 60, 10, 5); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill();
        D.rr(g, 30, 90, (W - 60) * left / 30, 10, 5); g.fillStyle = left < 8 ? '#ff6b8b' : '#7cff5a'; g.fill();
        D.text(g, Math.ceil(left) + 's', W / 2, 120, 14, '#bfe8cf');
        for (let i = 0; i < 9; i++) { const c = cell(i); g.fillStyle = '#06140e'; g.beginPath(); g.ellipse(c.x, c.y + 10, 46, 16, 0, 0, 7); g.fill(); }
        for (const m of moles) {
          const c = cell(m.i), k = Math.min(m.up, Math.max(0, m.t * 6));
          g.save(); g.beginPath(); g.rect(c.x - 60, c.y - 100, 120, 110); g.clip();
          D.emoji(g, m.hit ? '😵' : '🐹', c.x, c.y + 10 - 50 * k, 54); g.restore();
          g.fillStyle = '#0e2a1d'; g.beginPath(); g.ellipse(c.x, c.y + 14, 48, 12, 0, 0, Math.PI); g.fill();
        }
        for (const h of hits) { g.globalAlpha = h.t * 2; D.text(g, '+1', h.x, h.y - (0.5 - h.t) * 60, 22, '#ffd23f', 'center', 900); } g.globalAlpha = 1;
      }
    };
  } });

  // 5 ─ Quick Draw (reaction)
  add({ key: 'react', title: 'Quick Draw', emoji: '⚡', color: '#ffd23f', how: 'Wait for GREEN, then tap as fast as you can. 5 rounds.', make(api) {
    let ph, t, times, msg, rt;
    return {
      reset() { ph = 'wait'; t = R(1.2, 3.2); times = []; msg = ''; rt = 0; },
      down() {
        if (ph === 'wait') { ph = 'early'; t = 1; msg = 'Too soon! +300 ms'; times.push(rt = 600); api.sfx('hit'); }
        else if (ph === 'go') { rt = Math.round(t * 1000); times.push(rt); msg = rt + ' ms'; ph = 'res'; t = .9; api.sfx('coin'); }
      },
      update(dt) {
        if (ph === 'wait') { t -= dt; if (t <= 0) { ph = 'go'; t = 0; api.sfx('tick'); } }
        else if (ph === 'go') { t += dt; if (t > 1.5) { times.push(1500); msg = 'Too slow!'; ph = 'res'; t = .9; } }
        else { t -= dt; if (t <= 0) { if (times.length >= 5) { const avg = times.reduce((a, b) => a + b, 0) / times.length; api.set(Math.max(0, Math.round(1000 - avg))); api.end(true); } else { ph = 'wait'; t = R(1.2, 3.2); } } }
      },
      draw(g) {
        const c = ph === 'go' ? '#1fd67a' : ph === 'wait' ? '#d9304f' : '#2a3350';
        D.bg(g, W, H, c, '#0b0d14');
        D.glow(g, '#fff', ph === 'go' ? 40 : 0); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(W / 2, 300, 110, 0, 7); g.fill(); D.noGlow(g);
        D.text(g, ph === 'go' ? 'TAP!' : ph === 'wait' ? 'Wait…' : msg, W / 2, 300, ph === 'res' || ph === 'early' ? 28 : 46, '#fff', 'center', 900);
        D.text(g, 'Round ' + Math.min(5, times.length + (ph === 'res' || ph === 'early' ? 0 : 1)) + ' / 5', W / 2, 470, 16, 'rgba(255,255,255,.7)');
        times.forEach((v, i) => D.text(g, v + '', 60 + i * 60, 540, 13, '#c8d0e0'));
      }
    };
  } });

  // 6 ─ Color Clash
  add({ key: 'stroop', title: 'Color Clash', emoji: '🎨', color: '#c56cff', how: 'Does the word match its colour? Tap MATCH (left) or NO (right).', make(api) {
    const C = [['RED', '#ff4d5e'], ['BLUE', '#3d8bff'], ['GREEN', '#2fd47a'], ['YELLOW', '#ffd23f'], ['PURPLE', '#b06cff'], ['ORANGE', '#ff8a3c']];
    let word, ink, match, t, lim, flash;
    function next() { const a = RI(0, C.length - 1); match = Math.random() < .5; const b = match ? a : (a + RI(1, C.length - 1)) % C.length; word = C[a][0]; ink = C[b][1]; lim = Math.max(.9, 2.6 - api.get() * .08); t = lim; }
    return {
      reset() { next(); flash = 0; },
      down(x, y) { if (y < 470) return; const yes = x < W / 2; if (yes === match) { api.add(); api.sfx('coin'); flash = .2; next(); } else { api.sfx('hit'); api.end(false); } },
      update(dt) { t -= dt; flash -= dt; if (t <= 0) { api.sfx('hit'); api.end(false); } },
      draw(g) {
        D.bg(g, W, H, '#14111f', '#0b0d14');
        D.rr(g, 30, 90, W - 60, 8, 4); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill(); D.rr(g, 30, 90, (W - 60) * Math.max(0, t / lim), 8, 4); g.fillStyle = '#35d0ff'; g.fill();
        D.glow(g, ink, 24); D.text(g, word, W / 2, 290, 62, ink, 'center', 900); D.noGlow(g);
        D.rr(g, 20, 490, 155, 110, 20); g.fillStyle = flash > 0 ? '#2fd47a' : '#1d3a2c'; g.fill(); D.text(g, '✓ MATCH', 97, 545, 20, '#7cffb2', 'center', 900);
        D.rr(g, 185, 490, 155, 110, 20); g.fillStyle = '#3a1d26'; g.fill(); D.text(g, '✗ NO', 262, 545, 20, '#ff8aa0', 'center', 900);
      }
    };
  } });

  // 7 ─ Snake Turns
  add({ key: 'snake', title: 'Snake Turns', emoji: '🐍', color: '#2fd47a', how: 'Tap the LEFT side to turn left, the RIGHT side to turn right. Eat the apples!', make(api) {
    const C = 20, COLS = 18, ROWS = 29, OY = 60;
    let s, dir, food, t, grow;
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    function place() { do { food = { x: RI(0, COLS - 1), y: RI(0, ROWS - 1) }; } while (s.some(p => p.x === food.x && p.y === food.y)); }
    return {
      reset() { s = [{ x: 6, y: 14 }, { x: 5, y: 14 }, { x: 4, y: 14 }]; dir = 0; t = 0; grow = 0; place(); },
      down(x) { dir = (dir + (x < W / 2 ? 3 : 1)) % 4; api.sfx('tap'); },
      update(dt) {
        t += dt; const step = Math.max(.06, .15 - s.length * .002);
        while (t >= step) {
          t -= step; const h = { x: s[0].x + dirs[dir][0], y: s[0].y + dirs[dir][1] };
          if (h.x < 0 || h.y < 0 || h.x >= COLS || h.y >= ROWS || s.some(p => p.x === h.x && p.y === h.y)) { api.sfx('hit'); api.end(false); return; }
          s.unshift(h);
          if (h.x === food.x && h.y === food.y) { api.add(); grow += 2; api.sfx('coin'); place(); }
          if (grow > 0) grow--; else s.pop();
        }
      },
      draw(g) {
        D.bg(g, W, H, '#0c1f17', '#08120e');
        g.fillStyle = 'rgba(255,255,255,.03)'; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2) g.fillRect(x * C, OY + y * C, C, C);
        g.strokeStyle = 'rgba(47,212,122,.5)'; g.lineWidth = 2; g.strokeRect(1, OY, W - 2, ROWS * C);
        D.emoji(g, '🍎', food.x * C + 10, OY + food.y * C + 11, 18);
        s.forEach((p, i) => { g.fillStyle = i ? `hsl(${150 - i * 2} 70% ${55 - Math.min(20, i)}%)` : '#7cffb2'; D.rr(g, p.x * C + 1, OY + p.y * C + 1, C - 2, C - 2, 6); g.fill(); });
        g.globalAlpha = .25; D.text(g, '↺', 40, H - 30, 26, '#fff'); D.text(g, '↻', W - 40, H - 30, 26, '#fff'); g.globalAlpha = 1;
      }
    };
  } });

  // 8 ─ Brick Breaker
  add({ key: 'bricks', title: 'Brick Breaker', emoji: '🧨', color: '#ff6a3d', how: 'Drag to move the paddle. Tap to launch. Break every brick!', make(api) {
    let px, tx, ball, bricks, lives, stuck, level;
    function build() { bricks = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) bricks.push({ x: 15 + c * 56, y: 100 + r * 26, w: 50, h: 20, c: `hsl(${r * 40 + level * 30} 85% 60%)` }); }
    return {
      reset() { px = tx = W / 2; lives = 3; level = 0; build(); stuck = true; ball = { x: px, y: 560, vx: 0, vy: 0, sp: 320 }; },
      down(x) { tx = x; if (stuck) { stuck = false; const a = R(-.5, .5); ball.vx = Math.sin(a) * ball.sp; ball.vy = -Math.cos(a) * ball.sp; } },
      move(x) { tx = x; },
      update(dt) {
        px += (tx - px) * Math.min(1, dt * 18); px = cl(px, 45, W - 45);
        if (stuck) { ball.x = px; ball.y = 562; return; }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < 8 || ball.x > W - 8) { ball.vx *= -1; ball.x = cl(ball.x, 8, W - 8); }
        if (ball.y < 70) { ball.vy = Math.abs(ball.vy); }
        if (ball.vy > 0 && ball.y > 568 && ball.y < 586 && Math.abs(ball.x - px) < 50) { const k = (ball.x - px) / 50; const sp = Math.hypot(ball.vx, ball.vy) * 1.01; ball.vx = sp * Math.sin(k * 1.1); ball.vy = -sp * Math.cos(k * 1.1); api.sfx('tap'); }
        for (const b of bricks) if (!b.dead && ball.x > b.x - 7 && ball.x < b.x + b.w + 7 && ball.y > b.y - 7 && ball.y < b.y + b.h + 7) {
          b.dead = true; api.add(); api.sfx('pop');
          const ox = Math.min(ball.x - b.x + 7, b.x + b.w + 7 - ball.x), oy = Math.min(ball.y - b.y + 7, b.y + b.h + 7 - ball.y);
          if (ox < oy) ball.vx *= -1; else ball.vy *= -1; break;
        }
        bricks = bricks.filter(b => !b.dead);
        if (!bricks.length) { level++; build(); stuck = true; ball.sp += 40; api.sfx('win'); }
        if (ball.y > H + 10) { lives--; api.sfx('hit'); if (lives <= 0) api.end(false); else stuck = true; }
      },
      draw(g) {
        D.bg(g, W, H, '#0e0b1f', '#170b14');
        for (const b of bricks) { g.fillStyle = b.c; D.rr(g, b.x, b.y, b.w, b.h, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(b.x + 3, b.y + 3, b.w - 6, 3); }
        D.glow(g, '#35d0ff', 16); g.fillStyle = '#35d0ff'; D.rr(g, px - 45, 574, 90, 12, 6); g.fill();
        D.glow(g, '#fff', 14); g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, 7, 0, 7); g.fill(); D.noGlow(g);
        for (let i = 0; i < lives; i++) D.emoji(g, '❤️', 24 + i * 22, 616, 14);
        if (stuck) D.text(g, 'Tap to launch', W / 2, 520, 14, '#8fa0c0');
      }
    };
  } });

  // 9 ─ Pixel Dash
  add({ key: 'dash', title: 'Pixel Dash', emoji: '🏃', color: '#35d0ff', how: 'Tap to jump, tap again in the air to double-jump. Don\'t hit the spikes!', make(api) {
    const GY = 480;
    let p, obs, t, sp, jumps, dist;
    return {
      reset() { p = { y: GY, vy: 0 }; obs = []; t = 1; sp = 260; jumps = 0; dist = 0; },
      down() { if (jumps < 2) { p.vy = -560; jumps++; api.sfx('jump'); } },
      update(dt) {
        sp += dt * 7; dist += sp * dt; api.set(Math.floor(dist / 40));
        p.vy += 1650 * dt; p.y += p.vy * dt; if (p.y >= GY) { p.y = GY; p.vy = 0; jumps = 0; }
        t -= dt; if (t <= 0) { t = R(.75, 1.5) * 280 / sp; const tall = Math.random() < .35; obs.push({ x: W + 20, w: tall ? 26 : R(24, 54), h: tall ? R(50, 70) : R(24, 36) }); }
        for (const o of obs) { o.x -= sp * dt; if (70 + 14 > o.x && 70 - 14 < o.x + o.w && p.y > GY - o.h + 4) { api.sfx('hit'); api.end(false); } }
        obs = obs.filter(o => o.x > -80);
      },
      draw(g) {
        D.bg(g, W, H, '#0a1a33', '#24113a');
        const off = (dist * .3) % 120; g.fillStyle = 'rgba(124,92,255,.25)';
        for (let i = -1; i < 5; i++) { const x = i * 120 - off; g.beginPath(); g.moveTo(x, GY); g.lineTo(x + 60, GY - 110); g.lineTo(x + 120, GY); g.fill(); }
        g.fillStyle = '#120d24'; g.fillRect(0, GY + 16, W, H); g.fillStyle = '#35d0ff'; g.fillRect(0, GY + 16, W, 3);
        for (const o of obs) { D.glow(g, '#ff4d8d', 14); g.fillStyle = '#ff4d8d'; g.beginPath(); const n = Math.max(1, Math.round(o.w / 14)); for (let i = 0; i < n; i++) { const x = o.x + i * o.w / n; g.moveTo(x, GY + 16); g.lineTo(x + o.w / n / 2, GY + 16 - o.h); g.lineTo(x + o.w / n, GY + 16); } g.fill(); }
        D.noGlow(g); D.glow(g, '#ffd23f', 16); g.fillStyle = '#ffd23f'; D.rr(g, 56, p.y - 14, 28, 30, 6); g.fill(); D.noGlow(g);
        g.fillStyle = '#111'; g.fillRect(72, p.y - 6, 5, 5);
      }
    };
  } });

  // 10 ─ Memory Flip
  add({ key: 'memory', title: 'Memory Flip', emoji: '🃏', color: '#7c5cff', how: 'Flip two cards at a time and find all 8 pairs. Fewer moves = more points.', make(api) {
    const E = ['🍓', '🐙', '🚀', '🌵', '🎲', '🦊', '💎', '🍩', '🐳', '⚽', '🌙', '🎧'];
    let cards, open, moves, wait, time;
    const pos = i => ({ x: 22 + (i % 4) * 81, y: 140 + Math.floor(i / 4) * 104 });
    return {
      reset() { const pick = SP.shuffle(E).slice(0, 8); cards = SP.shuffle([...pick, ...pick]).map(e => ({ e, up: false, done: false, f: 0 })); open = []; moves = 0; wait = 0; time = 0; },
      down(x, y) {
        if (wait > 0 || open.length >= 2) return;
        cards.forEach((c, i) => { const p = pos(i); if (!c.up && !c.done && x > p.x && x < p.x + 72 && y > p.y && y < p.y + 94) { c.up = true; open.push(c); api.sfx('tap'); } });
        if (open.length === 2) { moves++; if (open[0].e === open[1].e) { open.forEach(c => c.done = true); open = []; api.sfx('coin'); api.set(cards.filter(c => c.done).length / 2 * 100); if (cards.every(c => c.done)) { api.set(Math.max(100, 1600 - moves * 40 - Math.floor(time) * 5)); api.end(true); } } else wait = .7; }
      },
      update(dt) { time += dt; for (const c of cards) c.f += ((c.up || c.done ? 1 : 0) - c.f) * Math.min(1, dt * 12); if (wait > 0) { wait -= dt; if (wait <= 0) { open.forEach(c => c.up = false); open = []; } } },
      draw(g) {
        D.bg(g, W, H, '#16112b', '#0b0d14');
        D.text(g, 'Moves ' + moves + '   ·   ' + Math.floor(time) + 's', W / 2, 100, 14, '#a9a3d6');
        cards.forEach((c, i) => {
          const p = pos(i), s = Math.abs(c.f * 2 - 1), x = p.x + 36 * (1 - s);
          g.fillStyle = c.f > .5 ? (c.done ? '#1f4d3a' : '#2b2f4a') : '#7c5cff'; D.rr(g, x, p.y, 72 * s, 94, 10); g.fill();
          if (c.f > .5) { g.save(); g.translate(p.x + 36, p.y + 47); g.scale(s, 1); D.emoji(g, c.e, 0, 2, 38); g.restore(); }
          else { g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; D.rr(g, x + 8 * s, p.y + 8, 56 * s, 78, 7); g.stroke(); }
        });
      }
    };
  } });

  // 11 ─ Bubble Pop
  add({ key: 'bubbles', title: 'Bubble Pop', emoji: '🫧', color: '#35d0ff', how: 'Pop the bubbles before they float away. NEVER pop the red bombs!', make(api) {
    let bs, t, miss, fx;
    return {
      reset() { bs = []; t = 0; miss = 0; fx = []; },
      down(x, y) {
        for (let i = bs.length - 1; i >= 0; i--) { const b = bs[i]; if (Math.hypot(x - b.x, y - b.y) < b.r + 8) { bs.splice(i, 1); if (b.bomb) { api.sfx('hit'); fx.push({ x: b.x, y: b.y, t: .5, c: '#ff4d5e' }); api.end(false); } else { api.add(); api.sfx('pop'); fx.push({ x: b.x, y: b.y, t: .4, c: '#9fe8ff' }); } return; } }
      },
      update(dt) {
        t -= dt; if (t <= 0) { t = Math.max(.25, .8 - api.get() * .01); bs.push({ x: R(40, W - 40), y: H + 40, r: R(22, 36), v: R(70, 120) + api.get() * 1.8, bomb: Math.random() < .14, w: R(0, 6) }); }
        for (const b of bs) { b.y -= b.v * dt; b.w += dt * 2; b.x += Math.sin(b.w) * 20 * dt; }
        for (const b of bs) if (b.y < -40 && !b.bomb) { miss++; b.gone = true; api.sfx('tick'); }
        bs = bs.filter(b => !b.gone && b.y > -50);
        if (miss >= 5) api.end(false);
        for (const f of fx) f.t -= dt; fx = fx.filter(f => f.t > 0);
      },
      draw(g) {
        D.bg(g, W, H, '#062a3f', '#0b0d1f');
        for (const b of bs) {
          if (b.bomb) { D.glow(g, '#ff4d5e', 18); g.fillStyle = '#d9304f'; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); D.noGlow(g); D.emoji(g, '💣', b.x, b.y + 2, b.r); continue; }
          const gr = g.createRadialGradient(b.x - b.r * .4, b.y - b.r * .4, 2, b.x, b.y, b.r); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.25, 'rgba(160,230,255,.35)'); gr.addColorStop(1, 'rgba(90,170,255,.15)');
          g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); g.strokeStyle = 'rgba(190,240,255,.8)'; g.lineWidth = 2; g.stroke();
        }
        for (const f of fx) { g.globalAlpha = f.t * 2; g.strokeStyle = f.c; g.lineWidth = 3; g.beginPath(); g.arc(f.x, f.y, 40 - f.t * 40, 0, 7); g.stroke(); } g.globalAlpha = 1;
        for (let i = 0; i < 5; i++) { g.fillStyle = i < miss ? '#ff4d5e' : 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(W / 2 - 40 + i * 20, 70, 6, 0, 7); g.fill(); }
      }
    };
  } });

  // 12 ─ Orbit Switch
  add({ key: 'orbit', title: 'Orbit Switch', emoji: '🪐', color: '#c56cff', how: 'Tap to jump between the inner and outer orbit. Avoid the red spikes!', make(api) {
    const CX = W / 2, CY = 330, RS = [78, 138];
    let a, ring, rr, spikes, t, st = stars(80);
    const adiff = (x, y) => { let d = (x - y) % (Math.PI * 2); if (d < -Math.PI) d += Math.PI * 2; if (d > Math.PI) d -= Math.PI * 2; return d; };
    return {
      reset() { a = -Math.PI / 2; ring = 1; rr = RS[1]; spikes = []; t = 1; },
      down() { ring = 1 - ring; api.sfx('jump'); },
      update(dt) {
        const sp = 1.7 + api.get() * .025; a += sp * dt; api.add(dt * 3);
        rr += (RS[ring] - rr) * Math.min(1, dt * 14);
        t -= dt; if (t <= 0) { t = Math.max(.35, 1 - api.get() * .01); spikes.push({ r: RI(0, 1), a: a + R(1.4, 3.2), life: 4, born: 0 }); }
        for (const s of spikes) { s.life -= dt; s.born = Math.min(1, s.born + dt * 2); if (s.born >= 1 && Math.abs(rr - RS[s.r]) < 18 && Math.abs(adiff(a, s.a)) < .16) { api.sfx('hit'); api.end(false); } }
        spikes = spikes.filter(s => s.life > 0);
      },
      draw(g) {
        D.bg(g, W, H, '#0d0620', '#04030a'); drawStars(g, st);
        g.lineWidth = 2; for (const r of RS) { g.strokeStyle = 'rgba(197,108,255,.35)'; g.beginPath(); g.arc(CX, CY, r, 0, 7); g.stroke(); }
        D.glow(g, '#ffb03a', 40); const gr = g.createRadialGradient(CX - 10, CY - 10, 4, CX, CY, 40); gr.addColorStop(0, '#fff3c4'); gr.addColorStop(1, '#ff8a3c'); g.fillStyle = gr; g.beginPath(); g.arc(CX, CY, 34, 0, 7); g.fill(); D.noGlow(g);
        for (const s of spikes) { const x = CX + Math.cos(s.a) * RS[s.r], y = CY + Math.sin(s.a) * RS[s.r]; g.globalAlpha = s.born * Math.min(1, s.life); D.glow(g, '#ff4d5e', 14); g.fillStyle = s.born < 1 ? 'rgba(255,77,94,.5)' : '#ff4d5e'; g.beginPath(); for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4, rad = k % 2 ? 6 : 15; g.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad); } g.fill(); }
        g.globalAlpha = 1; D.noGlow(g);
        const px = CX + Math.cos(a) * rr, py = CY + Math.sin(a) * rr; D.glow(g, '#35d0ff', 22); g.fillStyle = '#35d0ff'; g.beginPath(); g.arc(px, py, 11, 0, 7); g.fill(); D.noGlow(g);
      }
    };
  } });

  // 13 ─ Fruit Catch
  add({ key: 'fruit', title: 'Fruit Catch', emoji: '🧺', color: '#ff9a3c', how: 'Drag the basket to catch fruit. Avoid bombs! Miss 3 fruits and it\'s over.', make(api) {
    const F = ['🍎', '🍊', '🍇', '🍌', '🍉', '🍒', '🍍'];
    let bx, tx, items, t, miss, pops;
    return {
      reset() { bx = tx = W / 2; items = []; t = 0; miss = 0; pops = []; },
      down(x) { tx = x; }, move(x) { tx = x; },
      update(dt) {
        bx += (tx - bx) * Math.min(1, dt * 16); bx = cl(bx, 40, W - 40);
        t -= dt; if (t <= 0) { t = Math.max(.32, .9 - api.get() * .015); const bomb = Math.random() < .18; items.push({ x: R(30, W - 30), y: -30, v: R(160, 220) + api.get() * 4, e: bomb ? '💣' : F[RI(0, F.length - 1)], bomb, r: R(-1, 1) }); }
        for (const it of items) {
          it.y += it.v * dt; it.r += dt * 2;
          if (it.y > 540 && it.y < 580 && Math.abs(it.x - bx) < 48) { it.gone = true; if (it.bomb) { api.sfx('hit'); api.end(false); } else { api.add(); api.sfx('coin'); pops.push({ x: it.x, y: 520, t: .5 }); } }
          if (it.y > H + 30) { it.gone = true; if (!it.bomb) { miss++; api.sfx('tick'); if (miss >= 3) api.end(false); } }
        }
        items = items.filter(i => !i.gone); for (const p of pops) p.t -= dt; pops = pops.filter(p => p.t > 0);
      },
      draw(g) {
        D.bg(g, W, H, '#ffb36b', '#4a2a6a');
        g.fillStyle = 'rgba(255,240,200,.8)'; g.beginPath(); g.arc(280, 140, 46, 0, 7); g.fill();
        g.fillStyle = '#2b1d40'; g.fillRect(0, 590, W, 50);
        for (const it of items) { g.save(); g.translate(it.x, it.y); g.rotate(it.r * .3); D.emoji(g, it.e, 0, 0, 38); g.restore(); }
        D.emoji(g, '🧺', bx, 560, 64);
        for (const p of pops) { g.globalAlpha = p.t * 2; D.text(g, '+1', p.x, p.y - (0.5 - p.t) * 50, 20, '#fff', 'center', 900); } g.globalAlpha = 1;
        for (let i = 0; i < 3; i++) D.emoji(g, i < miss ? '✖️' : '🍏', 24 + i * 24, 616, 16);
      }
    };
  } });

  // 14 ─ Beat Lanes
  add({ key: 'beat', title: 'Beat Lanes', emoji: '🎵', color: '#ff4d8d', how: 'Tap a lane when its note hits the glowing line. Miss 5 and the show is over.', make(api) {
    const LW = W / 3, HY = 540, cols = ['#ff4d8d', '#35d0ff', '#ffd23f'];
    let notes, t, miss, flash, beat, combo, judge;
    return {
      reset() { notes = []; t = .5; miss = 0; flash = [0, 0, 0]; beat = 0; combo = 0; judge = null; },
      down(x) {
        const l = cl(Math.floor(x / LW), 0, 2); flash[l] = .15;
        let best = null, bd = 1e9; for (const n of notes) if (n.l === l && !n.hit) { const d = Math.abs(n.y - HY); if (d < bd) { bd = d; best = n; } }
        if (best && bd < 50) { best.hit = true; combo++; const perfect = bd < 18; api.add(perfect ? 2 : 1); judge = { s: perfect ? 'PERFECT' : 'GOOD', t: .4, c: perfect ? '#ffd23f' : '#7cffb2' }; SP.note(60 + [0, 4, 7][l] + (perfect ? 12 : 0)); }
        else { combo = 0; judge = { s: 'MISS', t: .4, c: '#ff6b8b' }; }
      },
      update(dt) {
        const sp = 300 + api.get() * 1.5; t -= dt;
        if (t <= 0) { beat++; t = Math.max(.24, .5 - api.get() * .002); notes.push({ l: RI(0, 2), y: -20 }); if (beat % 4 === 0 && Math.random() < .5) notes.push({ l: RI(0, 2), y: -60 }); }
        for (const n of notes) { n.y += sp * dt; if (!n.hit && n.y > HY + 55) { n.hit = true; n.missed = true; miss++; combo = 0; judge = { s: 'MISS', t: .4, c: '#ff6b8b' }; if (miss >= 5) api.end(false); } }
        notes = notes.filter(n => !(n.hit && !n.missed) && n.y < H + 30);
        for (let i = 0; i < 3; i++) flash[i] -= dt; if (judge) { judge.t -= dt; if (judge.t <= 0) judge = null; }
      },
      draw(g) {
        D.bg(g, W, H, '#120a22', '#05040b');
        for (let i = 0; i < 3; i++) { g.fillStyle = flash[i] > 0 ? cols[i] + '33' : (i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.015)'); g.fillRect(i * LW, 0, LW, H); }
        D.glow(g, '#fff', 18); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(0, HY - 2, W, 4); D.noGlow(g);
        for (let i = 0; i < 3; i++) { g.strokeStyle = cols[i]; g.lineWidth = 3; g.beginPath(); g.arc(i * LW + LW / 2, HY, 26, 0, 7); g.stroke(); }
        for (const n of notes) { if (n.missed) continue; D.glow(g, cols[n.l], 18); g.fillStyle = cols[n.l]; g.beginPath(); g.arc(n.l * LW + LW / 2, n.y, 22, 0, 7); g.fill(); } D.noGlow(g);
        if (judge) { g.globalAlpha = judge.t / .4; D.text(g, judge.s, W / 2, 420, 30, judge.c, 'center', 900); g.globalAlpha = 1; }
        if (combo > 2) D.text(g, combo + ' combo', W / 2, 80, 15, '#c8b6ff');
        for (let i = 0; i < 5; i++) { g.fillStyle = i < miss ? '#ff4d5e' : 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(W / 2 - 40 + i * 20, 610, 5, 0, 7); g.fill(); }
      }
    };
  } });

  // 15 ─ Math Rush
  add({ key: 'math', title: 'Math Rush', emoji: '🧮', color: '#2fd47a', how: 'Pick the right answer fast. Right = +1.5 s, wrong = −3 s.', make(api) {
    let q, ans, opts, left, fb;
    function next() {
      const lvl = api.get(); const ops = lvl < 5 ? ['+', '−'] : lvl < 12 ? ['+', '−', '×'] : ['+', '−', '×', '÷'];
      const op = ops[RI(0, ops.length - 1)]; let a, b;
      if (op === '+') { a = RI(2, 10 + lvl * 3); b = RI(2, 10 + lvl * 3); ans = a + b; }
      else if (op === '−') { a = RI(5, 15 + lvl * 3); b = RI(1, a); ans = a - b; }
      else if (op === '×') { a = RI(2, 6 + Math.floor(lvl / 3)); b = RI(2, 9); ans = a * b; }
      else { b = RI(2, 9); ans = RI(2, 9); a = b * ans; }
      q = `${a} ${op} ${b}`; const set = new Set([ans]); while (set.size < 3) set.add(Math.max(0, ans + RI(-6, 6))); opts = SP.shuffle([...set]);
    }
    return {
      reset() { left = 20; fb = null; next(); },
      down(x, y) { opts.forEach((o, i) => { const by = 330 + i * 92; if (y > by && y < by + 76 && x > 40 && x < W - 40) { if (o === ans) { api.add(); left = Math.min(30, left + 1.5); api.sfx('coin'); fb = { c: '#2fd47a', t: .25 }; } else { left -= 3; api.sfx('hit'); fb = { c: '#ff4d5e', t: .25 }; } next(); } }); },
      update(dt) { left -= dt; if (fb) { fb.t -= dt; if (fb.t <= 0) fb = null; } if (left <= 0) { left = 0; api.end(true); } },
      draw(g) {
        D.bg(g, W, H, '#0b2420', '#0b0d14');
        if (fb) { g.fillStyle = fb.c + '33'; g.fillRect(0, 0, W, H); }
        D.rr(g, 30, 90, W - 60, 10, 5); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill(); D.rr(g, 30, 90, (W - 60) * Math.min(1, left / 30), 10, 5); g.fillStyle = left < 6 ? '#ff6b8b' : '#2fd47a'; g.fill();
        D.text(g, left.toFixed(1) + 's', W / 2, 122, 14, '#a8d8c8');
        D.text(g, q + ' = ?', W / 2, 230, 44, '#fff', 'center', 900);
        opts.forEach((o, i) => { const by = 330 + i * 92; D.rr(g, 40, by, W - 80, 76, 18); g.fillStyle = '#16302a'; g.fill(); g.strokeStyle = 'rgba(47,212,122,.5)'; g.lineWidth = 2; g.stroke(); D.text(g, String(o), W / 2, by + 39, 30, '#e6fff5', 'center', 800); });
      }
    };
  } });

  SP.AI_GAMES = G;
  SP.aiEntries = () => G.map(g => ({ id: 'ai-' + g.key, kind: 'ai', key: g.key, title: g.title, emoji: g.emoji, color: g.color, desc: g.how, author: 'SwipePlay AI', ai: true }));
})();
