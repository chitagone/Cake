/* ================================================================
   fx.js — two canvases:
     #bgfx  ambient golden bokeh + twinkling stars (behind content)
     #fx    foreground effects (bursts, smoke, confetti, fireworks)
   All normal compositing — this is a LIGHT theme, additive blending
   would be invisible on white.
================================================================ */
(function () {
  'use strict';

  const fxc = document.getElementById('fx');
  const bgc = document.getElementById('bgfx');
  const fx = fxc ? fxc.getContext('2d') : null;
  const bg = bgc ? bgc.getContext('2d') : null;

  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    [fxc, bgc].forEach(function (c) {
      if (!c) return;
      c.width = W * DPR; c.height = H * DPR;
      c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
    });
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------------- ambient background ---------------- */
  const stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.random(), y: Math.random(),
      r: .6 + Math.random() * 1.4,
      ph: Math.random() * Math.PI * 2,
      sp: .4 + Math.random() * 1.4
    });
  }
  const bokeh = [];
  for (let i = 0; i < 12; i++) {
    bokeh.push({
      x: Math.random() * W, y: Math.random() * H,
      r: 24 + Math.random() * 56,
      vy: -(4 + Math.random() * 7),
      sw: .3 + Math.random() * .8,
      ph: Math.random() * Math.PI * 2,
      a: .08 + Math.random() * .09
    });
  }
  function bgLoop(t) {
    if (!bg) return;
    bg.clearRect(0, 0, W, H);
    const s = t / 1000;
    bg.fillStyle = '#e89b00';
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      const a = .12 + .38 * Math.abs(Math.sin(st.ph + s * st.sp));
      bg.globalAlpha = a;
      bg.beginPath();
      bg.arc(st.x * W, st.y * H, st.r, 0, 7);
      bg.fill();
    }
    bg.globalAlpha = 1;
    for (let i = 0; i < bokeh.length; i++) {
      const b = bokeh[i];
      b.y += b.vy / 60;
      if (b.y < -b.r * 2) { b.y = H + b.r * 2; b.x = Math.random() * W; }
      const bx = b.x + Math.sin(s * b.sw + b.ph) * 26;
      const gr = bg.createRadialGradient(bx, b.y, 0, bx, b.y, b.r);
      gr.addColorStop(0, 'rgba(255,190,40,' + b.a.toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(255,190,40,0)');
      bg.fillStyle = gr;
      bg.beginPath(); bg.arc(bx, b.y, b.r, 0, 7); bg.fill();
    }
    window.requestAnimationFrame(bgLoop);
  }
  window.requestAnimationFrame(bgLoop);

  /* ---------------- foreground particles ---------------- */
  const parts = [];
  const PAL = ['#ffb700', '#ffd23f', '#ff8e00', '#ffe98a', '#ffd8b0'];

  function addP(p) {
    parts.push(p);
    if (parts.length > 900) parts.splice(0, parts.length - 900);
  }

  function burst(x, y, n, speed) {
    n = n || 26; speed = speed || 340;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (.25 + Math.random() * .85);
      addP({ t: 'dot', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90,
        g: 880, drag: .985, age: 0, ttl: .55 + Math.random() * .5,
        r: 1.5 + Math.random() * 2.4, col: PAL[(Math.random() * PAL.length) | 0] });
    }
  }
  function ringAt(x, y) { addP({ t: 'ring', x: x, y: y, age: 0, ttl: .5, r: 6 }); }
  function starAt(x, y) {
    addP({ t: 'star', x: x, y: y, age: 0, ttl: .9 + Math.random() * .7,
      r: 2 + Math.random() * 3.4, ph: Math.random() * 7,
      col: Math.random() < .5 ? '#d99400' : '#ffb700' });
  }
  function smokeAt(x, y) {
    for (let i = 0; i < 4; i++) {
      addP({ t: 'smoke', x: x + (Math.random() * 10 - 5), y: y - Math.random() * 8,
        vx: 6 + Math.random() * 14, vy: -(22 + Math.random() * 26),
        age: -i * .16, ttl: 2.4 + Math.random() * 1.2,
        r: 3 + Math.random() * 3, ph: Math.random() * 7, sw: .8 + Math.random() * 1.4 });
    }
  }
  function gust() {
    for (let i = 0; i < 10; i++) {
      addP({ t: 'gust', x: -60 - Math.random() * 80, y: H * .5 + (Math.random() * 90 - 45),
        vx: 900 + Math.random() * 500, vy: -14, age: -i * .03, ttl: .5 });
    }
  }
  function confettiBurst() {
    function shoot(x, y, ang, n) {
      for (let i = 0; i < n; i++) {
        const a = ang + (Math.random() * .5 - .25);
        const sp = 620 + Math.random() * 520;
        addP({ t: 'conf', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          g: 900, drag: .988, age: 0, ttl: 2.4 + Math.random() * 1.4,
          w: 5 + Math.random() * 4, h: 8 + Math.random() * 6,
          rot: Math.random() * 7, vr: Math.random() * 10 - 5,
          col: PAL[(Math.random() * PAL.length) | 0] });
      }
    }
    shoot(W * .06, H * .92, -Math.PI / 2.5, 55);
    shoot(W * .94, H * .92, -Math.PI + Math.PI / 2.5, 55);
    for (let i = 0; i < 50; i++) {
      addP({ t: 'conf', x: Math.random() * W, y: -20 - Math.random() * 140,
        vx: Math.random() * 80 - 40, vy: 60 + Math.random() * 90,
        g: 130, drag: .995, age: -Math.random() * 1.2, ttl: 3.4,
        w: 5 + Math.random() * 4, h: 8 + Math.random() * 6,
        rot: Math.random() * 7, vr: Math.random() * 8 - 4,
        col: PAL[(Math.random() * PAL.length) | 0] });
    }
  }
  function launchFw() {
    addP({ t: 'rocket', x: W * (.18 + Math.random() * .64), y: H + 10,
      vx: Math.random() * 60 - 30, vy: -(H * .75 + Math.random() * H * .28),
      g: 260, drag: .998, age: 0, ttl: 2.2,
      ty: H * (.14 + Math.random() * .24), col: PAL[(Math.random() * PAL.length) | 0] });
  }
  function explodeFw(x, y, col) {
    const n = 44 + ((Math.random() * 26) | 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * .2;
      const sp = 130 + Math.random() * 230;
      addP({ t: 'fw', x: x, y: y, px: x, py: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        g: 230, drag: .986, age: 0, ttl: 1.1 + Math.random() * .7,
        r: 1.2 + Math.random() * 1.8, col: col });
    }
  }

  const dt = 1 / 60;
  function fxLoop() {
    if (!fx) return;
    fx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age < 0) continue;
      const k = p.age / p.ttl;
      if (k >= 1) { parts.splice(i, 1); continue; }

      switch (p.t) {
        case 'dot': {
          p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag;
          p.x += p.vx * dt; p.y += p.vy * dt;
          fx.globalAlpha = 1 - k;
          fx.fillStyle = p.col;
          fx.beginPath(); fx.arc(p.x, p.y, p.r, 0, 7); fx.fill();
          break;
        }
        case 'ring': {
          p.r += 240 * dt;
          fx.globalAlpha = (1 - k) * .55;
          fx.strokeStyle = 'rgba(224,150,20,1)';
          fx.lineWidth = 2 * (1 - k) + .5;
          fx.beginPath(); fx.arc(p.x, p.y, p.r, 0, 7); fx.stroke();
          break;
        }
        case 'star': {
          const tw = Math.abs(Math.sin(p.ph + p.age * 6));
          fx.globalAlpha = (1 - k) * tw;
          fx.strokeStyle = p.col;
          fx.lineWidth = 1.2;
          const r = p.r * (.6 + k);
          fx.beginPath();
          fx.moveTo(p.x - r, p.y); fx.lineTo(p.x + r, p.y);
          fx.moveTo(p.x, p.y - r); fx.lineTo(p.x, p.y + r);
          fx.stroke();
          fx.globalAlpha = (1 - k) * tw * .45;
          fx.beginPath(); fx.arc(p.x, p.y, r * .8, 0, 7); fx.stroke();
          break;
        }
        case 'smoke': {
          p.y += p.vy * dt;
          p.x += p.vx * dt + Math.sin(p.ph + p.age * p.sw) * .5;
          fx.globalAlpha = Math.sin(Math.PI * Math.min(1, k)) * .16;
          fx.fillStyle = 'rgb(150,140,128)';
          fx.beginPath();
          fx.arc(p.x, p.y, p.r + k * 15, 0, 7);
          fx.fill();
          break;
        }
        case 'gust': {
          p.x += p.vx * dt; p.y += p.vy * dt;
          fx.globalAlpha = Math.sin(Math.PI * k) * .28;
          fx.strokeStyle = '#c89a28';
          fx.lineWidth = 1.6;
          fx.beginPath();
          fx.moveTo(p.x, p.y);
          fx.quadraticCurveTo(p.x - 26, p.y - 5, p.x - 52, p.y + 2);
          fx.stroke();
          break;
        }
        case 'conf': {
          p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag;
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.rot += p.vr * dt;
          fx.globalAlpha = k > .8 ? (1 - k) / .2 : 1;
          fx.save();
          fx.translate(p.x, p.y); fx.rotate(p.rot);
          fx.fillStyle = p.col;
          const hh = p.h * (.4 + .6 * Math.abs(Math.sin(p.age * 6 + p.rot)));
          fx.fillRect(-p.w / 2, -hh / 2, p.w, hh);
          if (p.col === '#ffe98a') {           /* outline pale pieces */
            fx.strokeStyle = 'rgba(217,148,0,.5)';
            fx.lineWidth = .8;
            fx.strokeRect(-p.w / 2, -hh / 2, p.w, hh);
          }
          fx.restore();
          break;
        }
        case 'rocket': {
          p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag;
          p.x += p.vx * dt; p.y += p.vy * dt;
          fx.globalAlpha = .85;
          fx.strokeStyle = '#e08900';
          fx.lineWidth = 2;
          fx.beginPath(); fx.moveTo(p.x, p.y); fx.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); fx.stroke();
          if (p.y <= p.ty || p.vy > -80) {
            explodeFw(p.x, p.y, p.col);
            parts.splice(i, 1);
          }
          break;
        }
        case 'fw': {
          p.px = p.x; p.py = p.y;
          p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag;
          p.x += p.vx * dt; p.y += p.vy * dt;
          fx.globalAlpha = (1 - k) * (.5 + .5 * Math.abs(Math.sin(p.age * 20)));
          fx.strokeStyle = p.col;
          fx.lineWidth = p.r;
          fx.beginPath(); fx.moveTo(p.px, p.py); fx.lineTo(p.x, p.y); fx.stroke();
          break;
        }
      }
    }
    fx.globalAlpha = 1;
    window.requestAnimationFrame(fxLoop);
  }
  window.requestAnimationFrame(fxLoop);

  window.BD_FX = {
    burst: burst, ringAt: ringAt, starAt: starAt, smokeAt: smokeAt,
    gust: gust, confettiBurst: confettiBurst, launchFw: launchFw,
    explodeFw: explodeFw
  };
})();
