// SwipePlay — Scratch-style editor (stage + sprites + drag-and-drop blocks)
(function () {
  const { B, CAT, CATN, BACKDROPS, newBlock, clone, drawCostume, drawBackdrop } = SP.Blocks;
  const W = 360, H = 640;
  const TOKENS = ['●', '■', '▲', '★', '◆', '🐱', '🐶', '🐸', '🐵', '🦊', '🐼', '🐧', '🐤', '🐙', '🦄', '🐲', '👾', '🤖', '👻', '💀', '🎃', '⭐', '🌟', '⚡', '🔥', '💧', '❄️', '🍎', '🍌', '🍉', '🍒', '🍩', '🍕', '⚽', '🏀', '🎯', '💎', '🪙', '❤️', '💣', '🚀', '🛸', '✈️', '🚗', '🏆', '🎁', '🧱', '🌳', '🌵', '☁️', '🌙', '☀️', '🪐', '🦖', '🐝', '🦋', '🐟', '🍄', '👑', '🗡️', '🛡️', '🏁'];
  let root, P, cur, cat = 'events', onDone, drag = null, dirty = false, saveT;

  const $ = (s, el) => (el || root).querySelector(s);
  const spr = () => P.sprites[cur];

  function open(project, opts) {
    P = project; cur = 0; cat = 'events'; onDone = opts.onDone;
    root = document.getElementById('editor'); root.classList.remove('hidden');
    root.innerHTML = `
      <div class="ed-top">
        <button class="ib" data-x="close">${SP.icon('back')}</button>
        <input class="ed-title" maxlength="40" value="${SP.esc(P.title || '')}" placeholder="Game name">
        <button class="ib" data-x="info" title="Game info">${SP.icon('edit')}</button>
        <button class="pill go" data-x="test">${SP.icon('play')} Test</button>
      </div>
      <div class="ed-mid">
        <div class="ed-stage"><canvas width="216" height="384"></canvas><div class="ed-stage-hint">drag sprites</div></div>
        <div class="ed-side">
          <div class="ed-sprites"></div>
          <div class="ed-props"></div>
        </div>
      </div>
      <div class="ed-cats">${Object.keys(CAT).map(c => `<button data-cat="${c}" style="--c:${CAT[c]}"><i></i>${CATN[c]}</button>`).join('')}</div>
      <div class="ed-work">
        <div class="ed-pal"></div>
        <div class="ed-scripts"><div class="ed-canvas"></div><div class="ed-trash">${SP.icon('trash')} Drop here to delete</div></div>
      </div>
      <div class="ed-pop hidden"></div>`;
    $('.ed-title').addEventListener('input', e => { P.title = e.target.value; touch(); });
    root.onclick = onClick;
    root.addEventListener('pointerdown', onDown);
    stageSetup();
    renderAll();
  }
  function close() { saveNow(); root.classList.add('hidden'); root.innerHTML = ''; window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); if (onDone) onDone(P); }
  function touch() { dirty = true; clearTimeout(saveT); saveT = setTimeout(saveNow, 600); drawStage(); }
  function saveNow() { if (!dirty || !onDone) return; dirty = false; if (SP.saveDraft) SP.saveDraft(P); }

  function renderAll() { renderSprites(); renderProps(); renderCats(); renderPalette(); renderScripts(); drawStage(); }

  // ---------- stage preview ----------
  let sdrag = null;
  function stageSetup() {
    const cv = $('.ed-stage canvas');
    cv.addEventListener('pointerdown', e => {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W - W / 2, y = H / 2 - (e.clientY - r.top) / r.height * H;
      let hit = -1; P.sprites.forEach((s, i) => { if (s.visible !== false && Math.hypot(s.x - x, s.y - y) < 24 * s.size / 100 + 14) hit = i; });
      if (hit < 0) return; cur = hit; sdrag = { cv, ox: P.sprites[hit].x - x, oy: P.sprites[hit].y - y }; cv.setPointerCapture(e.pointerId); renderSprites(); renderProps(); renderScripts(); drawStage(); e.stopPropagation();
    });
    cv.addEventListener('pointermove', e => {
      if (!sdrag) return; const r = cv.getBoundingClientRect();
      const s = spr(); s.x = Math.round(Math.max(-W / 2, Math.min(W / 2, (e.clientX - r.left) / r.width * W - W / 2 + sdrag.ox))); s.y = Math.round(Math.max(-H / 2, Math.min(H / 2, H / 2 - (e.clientY - r.top) / r.height * H + sdrag.oy)));
      drawStage(); const px = $('.ed-props [data-p="x"]'), py = $('.ed-props [data-p="y"]'); if (px) px.value = s.x; if (py) py.value = s.y;
    });
    const end = () => { if (sdrag) { sdrag = null; touch(); } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }
  function drawStage() {
    const cv = root && $('.ed-stage canvas'); if (!cv) return; const g = cv.getContext('2d'), k = cv.width / W;
    g.setTransform(k, 0, 0, k, 0, 0); drawBackdrop(g, P.bg);
    P.sprites.forEach((s, i) => {
      g.save(); g.translate(W / 2 + s.x, H / 2 - s.y); g.globalAlpha = s.visible === false ? .35 : 1;
      if (s.rotate) g.rotate(((s.dir || 90) - 90) * Math.PI / 180);
      drawCostume(g, s.costume, s.color, 48 * (s.size || 100) / 100); g.restore();
      if (i === cur) { const r = 24 * (s.size || 100) / 100 + 6; g.strokeStyle = '#35d0ff'; g.lineWidth = 3; g.setLineDash([8, 6]); g.strokeRect(W / 2 + s.x - r, H / 2 - s.y - r, r * 2, r * 2); g.setLineDash([]); }
    });
  }

  // ---------- sprites & props ----------
  function renderSprites() {
    $('.ed-sprites').innerHTML = P.sprites.map((s, i) => `<button class="spr ${i === cur ? 'on' : ''}" data-spr="${i}"><span class="tok" style="color:${s.color}">${SP.esc(s.costume)}</span><small>${SP.esc(s.name)}</small></button>`).join('') + `<button class="spr add" data-x="addSprite">${SP.icon('plus')}<small>Sprite</small></button>`;
  }
  function renderProps() {
    const s = spr();
    $('.ed-props').innerHTML = `
      <div class="prow"><input data-p="name" value="${SP.esc(s.name)}" maxlength="16" placeholder="name"><button class="tokbtn" data-x="pickCostume" style="color:${s.color}">${SP.esc(s.costume)}</button><input type="color" data-p="color" value="${s.color || '#ff4d8d'}"></div>
      <div class="prow"><label>x<input type="number" data-p="x" value="${s.x}"></label><label>y<input type="number" data-p="y" value="${s.y}"></label><label>size<input type="number" data-p="size" value="${s.size}"></label></div>
      <div class="prow"><label class="chk"><input type="checkbox" data-p="visible" ${s.visible !== false ? 'checked' : ''}>shown</label><label class="chk"><input type="checkbox" data-p="rotate" ${s.rotate ? 'checked' : ''}>rotates</label>
        <button class="mini" data-x="dupSprite" title="Duplicate">${SP.icon('copy')}</button><button class="mini red" data-x="delSprite" title="Delete">${SP.icon('trash')}</button></div>
      <div class="prow"><label class="grow">backdrop<select data-p="bg">${Object.keys(BACKDROPS).map(b => `<option ${P.bg === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label></div>`;
    $('.ed-props').oninput = e => {
      const t = e.target, k = t.dataset.p; if (!k) return;
      if (k === 'bg') P.bg = t.value;
      else if (k === 'visible' || k === 'rotate') s[k] = t.checked;
      else if (k === 'x' || k === 'y' || k === 'size') s[k] = +t.value || 0;
      else if (k === 'name') { const old = s.name; s.name = t.value.trim() || 'Sprite'; renameRefs(old, s.name); renderSprites(); }
      else s[k] = t.value;
      if (k === 'color') { renderSprites(); $('.tokbtn').style.color = s.color; }
      touch();
    };
  }
  function renameRefs(oldN, newN) { const walk = l => l.forEach(b => { if (b.op === 'touching' && b.a.o === oldN) b.a.o = newN; for (const k in b.a) if (b.a[k] && b.a[k].op) walk([b.a[k]]); if (b.s1) walk(b.s1); if (b.s2) walk(b.s2); }); P.sprites.forEach(s => s.scripts.forEach(st => walk(st.blocks))); }
  function picker(onPick) {
    const pop = $('.ed-pop'); pop.classList.remove('hidden');
    pop.innerHTML = `<div class="pop-card"><div class="pop-h">Choose a costume<button class="ib" data-x="popClose">${SP.icon('close')}</button></div><div class="tok-grid">${TOKENS.map(t => `<button data-tok="${t}">${t}</button>`).join('')}</div><div class="hint">●■▲★◆ use the sprite colour.</div></div>`;
    pop.onclick = e => { const b = e.target.closest('[data-tok]'); if (b) { onPick(b.dataset.tok); pop.classList.add('hidden'); } else if (e.target === pop || e.target.closest('[data-x="popClose"]')) pop.classList.add('hidden'); };
  }
  function infoDialog() {
    const pop = $('.ed-pop'); pop.classList.remove('hidden');
    pop.innerHTML = `<div class="pop-card"><div class="pop-h">Game info<button class="ib" data-x="popClose">${SP.icon('close')}</button></div>
      <label class="fld">Icon<button class="tokbtn big" data-x="pickIcon">${SP.esc(P.icon || '🎮')}</button></label>
      <label class="fld">Description (how to play)<textarea maxlength="160" data-info="desc" placeholder="Tap the stars to win!">${SP.esc(P.desc || '')}</textarea></label>
      <label class="fld">Variables<input data-info="vars" value="${SP.esc((P.vars || []).join(', '))}" placeholder="score, lives"></label>
      <div class="hint">"score" shows as your game's score in the feed.</div></div>`;
    pop.oninput = e => { const k = e.target.dataset.info; if (k === 'desc') P.desc = e.target.value; if (k === 'vars') P.vars = [...new Set(e.target.value.split(',').map(x => x.trim()).filter(Boolean))]; touch(); };
    pop.onclick = e => {
      if (e.target.closest('[data-x="pickIcon"]')) { picker(t => { P.icon = t; touch(); infoDialog(); }); return; }
      if (e.target === pop || e.target.closest('[data-x="popClose"]')) { pop.classList.add('hidden'); renderPalette(); }
    };
  }

  // ---------- categories & palette ----------
  function renderCats() { root.querySelectorAll('.ed-cats button').forEach(b => b.classList.toggle('on', b.dataset.cat === cat)); }
  function renderPalette() {
    const pal = $('.ed-pal'); pal.innerHTML = '';
    if (cat === 'variables') {
      const hd = document.createElement('div'); hd.className = 'pal-note'; hd.innerHTML = `Variables: <b>${SP.esc((P.vars || []).join(', ') || 'none')}</b> <button class="mini" data-x="newVar">${SP.icon('plus')} New</button>`; pal.appendChild(hd);
    }
    for (const op in B) {
      if (B[op].cat !== cat) continue;
      const el = renderBlock(newBlock(op), null, -1, true); el.classList.add('pal-blk'); pal.appendChild(el);
    }
  }

  // ---------- block rendering ----------
  function kindOf(op) { const d = B[op]; return d.hat ? 'hat' : d.r ? 'rep' : d.bool ? 'boo' : 'cmd'; }
  function renderBlock(b, list, idx, inPal) {
    const d = B[b.op]; if (!d) { const x = document.createElement('div'); x.textContent = '?'; return x; }
    const k = kindOf(b.op);
    const el = document.createElement(k === 'rep' || k === 'boo' ? 'span' : 'div');
    el.className = `blk k-${k}${d.c ? ' cblk' : ''}${d.cap ? ' cap' : ''}`; el.style.setProperty('--c', CAT[d.cat]);
    el._b = b; el._list = list; el._idx = idx;
    const row = document.createElement(k === 'rep' || k === 'boo' ? 'span' : 'div'); row.className = 'row';
    d.text.split(/(%\w)/).forEach(part => {
      if (!part) return;
      if (part[0] === '%' && d.args[part.slice(1)]) row.appendChild(slot(b, part.slice(1), d.args[part.slice(1)], inPal));
      else { const s = document.createElement('span'); s.className = 'lbl'; s.textContent = part.trim(); if (s.textContent) row.appendChild(s); }
    });
    el.appendChild(row);
    if (d.c) {
      const m1 = document.createElement('div'); m1.className = 'mouth'; m1._list = b.s1 = b.s1 || []; m1._key = 's1'; m1._b = b;
      b.s1.forEach((c, i) => m1.appendChild(renderBlock(c, b.s1, i))); el.appendChild(m1);
      if (d.c === 2) {
        const er = document.createElement('div'); er.className = 'row else'; er.innerHTML = '<span class="lbl">else</span>'; el.appendChild(er);
        const m2 = document.createElement('div'); m2.className = 'mouth'; m2._list = b.s2 = b.s2 || []; m2._key = 's2'; m2._b = b;
        b.s2.forEach((c, i) => m2.appendChild(renderBlock(c, b.s2, i))); el.appendChild(m2);
      }
      const ft = document.createElement('div'); ft.className = 'foot'; el.appendChild(ft);
    }
    return el;
  }
  function slot(b, name, ad, inPal) {
    const v = b.a[name];
    if (v && typeof v === 'object' && v.op) { const r = renderBlock(v, null, -1, inPal); r._parent = { b, name }; return r; }
    let el;
    const set = val => { b.a[name] = val; touch(); };
    switch (ad.t) {
      case 'num': case 'text':
        el = document.createElement('input'); el.className = 'inp' + (ad.t === 'num' ? ' num' : ''); el.value = v == null ? '' : v;
        el.size = Math.max(2, String(el.value).length); if (ad.t === 'num') el.inputMode = 'decimal';
        el.oninput = () => { el.size = Math.max(2, el.value.length); set(el.value); }; break;
      case 'bool': el = document.createElement('span'); el.className = 'bslot'; break;
      case 'menu': case 'sprite': case 'var': {
        el = document.createElement('select'); el.className = 'sel';
        let opts = ad.t === 'menu' ? ad.o : ad.t === 'var' ? (P.vars && P.vars.length ? P.vars : ['score']) : ['edge', 'finger', ...P.sprites.map(s => s.name)];
        if (v && !opts.includes(v)) opts = [v, ...opts];
        el.innerHTML = opts.map(o => `<option ${o === v ? 'selected' : ''}>${SP.esc(o)}</option>`).join('');
        el.onchange = () => set(el.value); break;
      }
      case 'color': el = document.createElement('input'); el.type = 'color'; el.className = 'col'; el.value = v || '#ff4d8d'; el.oninput = () => set(el.value); break;
      case 'costume': el = document.createElement('button'); el.className = 'tok-in'; el.textContent = v || '⭐'; el.onclick = ev => { ev.stopPropagation(); if (inPal) return; picker(t => { set(t); el.textContent = t; }); }; break;
      default: el = document.createElement('span');
    }
    el._slot = { b, name, t: ad.t }; el.dataset.slot = ad.t;
    if (inPal && el.tagName !== 'SPAN') { el.tabIndex = -1; el.classList.add('ro'); }
    return el;
  }
  function renderScripts() {
    const cv = $('.ed-canvas'); cv.innerHTML = '';
    let maxX = 0, maxY = 0;
    spr().scripts.forEach(st => {
      const se = document.createElement('div'); se.className = 'stack'; se.style.left = st.x + 'px'; se.style.top = st.y + 'px'; se._st = st;
      st.blocks.forEach((b, i) => se.appendChild(renderBlock(b, st.blocks, i)));
      cv.appendChild(se); maxX = Math.max(maxX, st.x); maxY = Math.max(maxY, st.y);
    });
    cv.style.width = Math.max(900, maxX + 500) + 'px'; cv.style.height = Math.max(1100, maxY + 700) + 'px';
    if (!spr().scripts.length) cv.insertAdjacentHTML('beforeend', '<div class="empty-hint">Drag blocks here from the left.<br>Start with an <b style="color:#ffbf00">Events</b> block like “when ▶ game starts”.</div>');
  }

  // ---------- drag & drop ----------
  function onDown(e) {
    if (e.button > 0) return;
    const t = e.target;
    if (t.closest('input,select,textarea,.tok-in:not(.ro)') && !t.closest('.pal-blk')) return;
    const el = t.closest('.blk'); if (!el) return;
    const fromPal = !!el.closest('.ed-pal');
    const r = el.getBoundingClientRect();
    drag = { el, fromPal, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, started: false, pid: e.pointerId };
    window.addEventListener('pointermove', onMove, { passive: false }); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }
  function begin() {
    const el = drag.el; let blocks;
    if (drag.fromPal) {
      const top = el.closest('.pal-blk'); blocks = [clone(top._b)]; drag.ox = Math.min(drag.ox, 40); drag.oy = Math.min(drag.oy, 20);
    } else if (el._parent) {
      blocks = [el._b]; const def = B[el._parent.b.op].args[el._parent.name]; el._parent.b.a[el._parent.name] = def.t === 'bool' ? '' : (def.d === undefined ? '' : def.d);
    } else if (el._list) {
      blocks = el._list.splice(el._idx);
      const st = spr().scripts.find(s => s.blocks === el._list); if (st && !st.blocks.length) spr().scripts.splice(spr().scripts.indexOf(st), 1);
    } else return false;
    drag.blocks = blocks; drag.rep = kindOf(blocks[0].op) === 'rep' || kindOf(blocks[0].op) === 'boo';
    const gh = document.createElement('div'); gh.className = 'ghost';
    blocks.forEach((b, i) => gh.appendChild(renderBlock(b, blocks, i)));
    document.body.appendChild(gh); drag.gh = gh; drag.started = true;
    if (!drag.fromPal) renderScripts();
    root.classList.add('dragging');
    return true;
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    if (drag.scroll) { $('.ed-pal').scrollTop -= e.clientY - drag.ly; drag.ly = e.clientY; e.preventDefault(); return; }
    if (!drag.started) {
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.hypot(dx, dy) < 7) return;
      if (drag.fromPal && Math.abs(dy) > Math.abs(dx) * 1.3 && e.clientX < $('.ed-pal').getBoundingClientRect().right - 4) { drag.scroll = true; drag.ly = e.clientY; return; }
      if (!begin()) { drag = null; return; }
    }
    e.preventDefault();
    const gx = e.clientX - drag.ox, gy = e.clientY - drag.oy;
    drag.gh.style.transform = `translate(${gx}px,${gy}px)`;
    drag.x = gx; drag.y = gy; drag.px = e.clientX; drag.py = e.clientY;
    const sc = $('.ed-scripts'), sr = sc.getBoundingClientRect();
    if (e.clientX > sr.right - 30) sc.scrollLeft += 8; if (e.clientY > sr.bottom - 30) sc.scrollTop += 8; if (e.clientY < sr.top + 20) sc.scrollTop -= 8; if (e.clientX < sr.left + 20 && e.clientX > sr.left) sc.scrollLeft -= 8;
    drag.target = findTarget();
    showIndicator(drag.target);
    const pr = $('.ed-pal').getBoundingClientRect(), tr = $('.ed-trash').getBoundingClientRect();
    drag.del = (e.clientX < pr.right && e.clientY > pr.top) || (e.clientX >= tr.left && e.clientX <= tr.right && e.clientY >= tr.top && e.clientY <= tr.bottom);
    root.classList.toggle('del-hover', !!drag.del);
  }
  function findTarget() {
    const cv = $('.ed-canvas'); const sr = $('.ed-scripts').getBoundingClientRect();
    if (drag.px < sr.left || drag.py < sr.top) return null;
    const first = drag.blocks[0], last = drag.blocks[drag.blocks.length - 1];
    if (drag.rep) {
      const isBool = kindOf(first.op) === 'boo'; let best = null, bd = 34;
      cv.querySelectorAll('[data-slot]').forEach(s => {
        const t = s._slot.t; if (!(t === 'bool' || t === 'num' || t === 'text')) return; if (t === 'bool' && !isBool) return;
        const r = s.getBoundingClientRect(); const d = Math.hypot(drag.x - r.left, (drag.y + 12) - (r.top + r.height / 2));
        if (d < bd) { bd = d; best = { type: 'slot', el: s, r }; }
      });
      return best;
    }
    const isHat = !!B[first.op].hat, endsCap = !!B[last.op].cap; let best = null, bd = 38;
    cv.querySelectorAll('.blk').forEach(b => {
      if (!b._list || b.closest('.ghost')) return; const d = B[b._b.op]; if (kindOf(b._b.op) === 'rep' || kindOf(b._b.op) === 'boo') return;
      const r = b.getBoundingClientRect();
      if (!isHat && !d.cap && (!endsCap || b._idx === b._list.length - 1)) { const dd = Math.hypot(drag.x - r.left, drag.y - r.bottom); if (dd < bd) { bd = dd; best = { type: 'after', list: b._list, idx: b._idx, x: r.left, y: r.bottom }; } }
      if (b._idx === 0 && !d.hat && !endsCap && b.parentElement.classList.contains('stack')) {
        const h = drag.gh.getBoundingClientRect().height; const dd = Math.hypot(drag.x - r.left, drag.y + h - r.top);
        if (dd < bd) { bd = dd; best = { type: 'before', list: b._list, st: b.parentElement._st, x: r.left, y: r.top, h }; }
      }
    });
    if (!isHat) cv.querySelectorAll('.mouth').forEach(m => {
      if (m.closest('.ghost')) return; if (endsCap && m._list.length) return;
      const r = m.getBoundingClientRect(); const dd = Math.hypot(drag.x - r.left, drag.y - r.top);
      if (dd < bd) { bd = dd; best = { type: 'mouth', list: m._list, x: r.left, y: r.top }; }
    });
    return best;
  }
  function showIndicator(t) {
    let ind = document.getElementById('dropInd'); if (!ind) { ind = document.createElement('div'); ind.id = 'dropInd'; document.body.appendChild(ind); }
    root.querySelectorAll('.slot-hot').forEach(x => x.classList.remove('slot-hot'));
    if (!t) { ind.style.display = 'none'; return; }
    if (t.type === 'slot') { ind.style.display = 'none'; t.el.classList.add('slot-hot'); return; }
    ind.style.display = 'block'; ind.style.left = t.x + 'px'; ind.style.top = (t.type === 'before' ? t.y - 3 : t.y - 2) + 'px';
  }
  function onUp(e) {
    window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    const d = drag; drag = null; if (!d || !d.started) return;
    d.gh.remove(); showIndicator(null); root.classList.remove('dragging', 'del-hover');
    if (d.del) { SP.sfx('tap'); renderScripts(); touch(); return; }
    const t = d.target, s = spr();
    if (t && t.type === 'slot') { t.el._slot.b.a[t.el._slot.name] = d.blocks[0]; }
    else if (t && t.type === 'after') t.list.splice(t.idx + 1, 0, ...d.blocks);
    else if (t && t.type === 'mouth') t.list.splice(0, 0, ...d.blocks);
    else if (t && t.type === 'before') { t.list.splice(0, 0, ...d.blocks); const cr = $('.ed-canvas').getBoundingClientRect(); t.st.x = Math.max(4, Math.round(d.x - cr.left)); t.st.y = Math.max(4, Math.round(d.y - cr.top)); }
    else {
      const sr = $('.ed-scripts').getBoundingClientRect();
      if (d.px < sr.left || d.py < sr.top) { renderScripts(); touch(); return; }
      const cr = $('.ed-canvas').getBoundingClientRect();
      s.scripts.push({ x: Math.max(4, Math.round(d.x - cr.left)), y: Math.max(4, Math.round(d.y - cr.top)), blocks: d.blocks });
    }
    SP.sfx('tap'); renderScripts(); touch();
  }

  // ---------- buttons ----------
  function onClick(e) {
    const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; renderCats(); renderPalette(); $('.ed-pal').scrollTop = 0; return; }
    const sp = e.target.closest('[data-spr]'); if (sp) { cur = +sp.dataset.spr; renderSprites(); renderProps(); renderScripts(); drawStage(); return; }
    const x = e.target.closest('[data-x]'); if (!x) return;
    switch (x.dataset.x) {
      case 'close': close(); break;
      case 'test': saveNow(); SP.playProject && SP.playProject(P); break;
      case 'info': infoDialog(); break;
      case 'pickCostume': picker(t => { spr().costume = t; renderSprites(); renderProps(); touch(); }); break;
      case 'addSprite': { const tok = TOKENS[5 + Math.floor(Math.random() * (TOKENS.length - 5))]; let n = 1; while (P.sprites.some(s => s.name === 'Sprite' + n)) n++; P.sprites.push({ name: 'Sprite' + n, costume: tok, color: '#35d0ff', x: Math.round(Math.random() * 200 - 100), y: Math.round(Math.random() * 300 - 150), size: 100, dir: 90, visible: true, rotate: false, scripts: [] }); cur = P.sprites.length - 1; renderAll(); touch(); break; }
      case 'dupSprite': { const c2 = clone(spr()); c2.name = spr().name + '2'; c2.x += 30; P.sprites.push(c2); cur = P.sprites.length - 1; renderAll(); touch(); break; }
      case 'delSprite': if (P.sprites.length <= 1) { SP.toast('A game needs at least one sprite'); break; } SP.confirm(`Delete sprite "${spr().name}" and its scripts?`, 'Delete', () => { P.sprites.splice(cur, 1); cur = 0; renderAll(); touch(); }); break;
      case 'newVar': SP.prompt('New variable name', 'lives', v => { v = (v || '').trim(); if (!v) return; P.vars = P.vars || []; if (!P.vars.includes(v)) P.vars.push(v); renderPalette(); renderScripts(); touch(); }); break;
    }
  }
  SP.Editor = { open, isOpen: () => root && !root.classList.contains('hidden'), back() { const pop = $('.ed-pop'); if (pop && !pop.classList.contains('hidden')) { pop.classList.add('hidden'); return true; } close(); return true; } };
})();
