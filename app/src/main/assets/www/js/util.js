// SwipePlay — shared helpers
window.SP = window.SP || {};
(function () {
  const S = SP;
  S.store = {
    get(k, d) { try { const v = localStorage.getItem('sp_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sp_' + k, JSON.stringify(v)); return true; } catch (e) { S.toast('Phone storage is full'); return false; } },
    del(k) { try { localStorage.removeItem('sp_' + k); } catch (e) {} }
  };
  S.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  S.esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  S.fmt = n => { n = +n || 0; return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n); };
  S.ago = t => { const s = (Date.now() - t) / 1000; if (s < 60) return 'now'; if (s < 3600) return Math.floor(s / 60) + 'm'; if (s < 86400) return Math.floor(s / 3600) + 'h'; return Math.floor(s / 86400) + 'd'; };
  S.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let toastT;
  S.toast = msg => {
    let el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg; el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2200);
  };

  const P = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    heart: '<path d="M12 20.5s-7.2-4.4-9.4-9A5.4 5.4 0 0 1 12 6.3a5.4 5.4 0 0 1 9.4 5.2c-2.2 4.6-9.4 9-9.4 9z"/>',
    comment: '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.7A8.5 8.5 0 1 1 21 11.5z"/>',
    bookmark: '<path d="M6 3.5h12v17l-6-4-6 4z"/>',
    restart: '<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3"/><path d="M3.5 4v5h5"/>',
    play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 16a4.8 4.8 0 0 1 6.4 0"/><circle cx="12" cy="19.3" r="1.1" fill="currentColor"/>',
    wifiOff: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 16a4.8 4.8 0 0 1 6.4 0"/><path d="M3 3l18 18"/>',
    robot: '<rect x="4.5" y="8" width="15" height="11" rx="3.2"/><path d="M12 8V4.5M9 13v.01M15 13v.01M9.5 16h5"/><circle cx="12" cy="3.6" r="1"/>',
    send: '<path d="M4 12l16-8-6 16-2.8-6.6z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    upload: '<path d="M12 16V4M6.5 9.5L12 4l5.5 5.5M4 20h16"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    sparkle: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/>',
    download: '<path d="M12 4v12M6.5 10.5L12 16l5.5-5.5M4 20h16"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    cloud: '<path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>',
  };
  S.icon = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;

  // ---------- sound ----------
  let AC = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function tone(f, d, type, v, f2, delay) {
    const a = ac(); if (!a || S.store.get('mute', false)) return;
    const t0 = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0008, t0 + d);
    o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + d + 0.02);
  }
  S.sfx = k => {
    switch (k) {
      case 'start': tone(440, .08, 'triangle', .06); tone(660, .12, 'triangle', .06, 0, .08); break;
      case 'jump': tone(300, .12, 'square', .04, 620); break;
      case 'coin': tone(880, .07, 'square', .04); tone(1320, .14, 'square', .04, 0, .07); break;
      case 'pop': tone(600, .06, 'sine', .08, 1200); break;
      case 'hit': tone(180, .18, 'sawtooth', .06, 70); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => tone(f, .16, 'triangle', .06, 0, i * .1)); break;
      case 'lose': [400, 300, 200].forEach((f, i) => tone(f, .2, 'sawtooth', .05, f * .8, i * .14)); break;
      case 'laser': tone(1400, .15, 'sawtooth', .04, 200); break;
      case 'tick': tone(1000, .03, 'square', .03); break;
      case 'tap': tone(700, .04, 'triangle', .04); break;
    }
  };
  S.note = n => tone(440 * Math.pow(2, (n - 69) / 12), .3, 'triangle', .07);

  // ---------- canvas helpers ----------
  S.draw = {
    rr(g, x, y, w, h, r) { if (!(w > 0) || !(h > 0)) { g.beginPath(); return; } r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
    text(g, s, x, y, size, color, align, weight) { g.font = `${weight || 700} ${size}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif`; g.fillStyle = color || '#fff'; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); },
    emoji(g, s, x, y, size) { g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); },
    bg(g, W, H, c1, c2) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, W, H); },
    glow(g, color, blur) { g.shadowColor = color; g.shadowBlur = blur; },
    noGlow(g) { g.shadowBlur = 0; }
  };
})();
