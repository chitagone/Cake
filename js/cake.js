/* ================================================================
   cake.js — the experience sequence:
     plate → tiers fall (spring physics) → name "Priya" → candles
     (no flames) → "Make a Wish" → flames ignite → blow out + smoke
     → birthday message + confetti + fireworks.
   Every step is guarded by a token so a replay cancels cleanly.
================================================================ */
(function () {
  'use strict';

  const $ = function (s) { return document.querySelector(s); };
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  let seqToken = 0, stageReady = false;
  let fwTimer = null, sparkleTimer = null;

  const cakeScreen = () => $('#cakeScreen');
  const scene = () => $('#scene');
  const cake = () => $('#cake');
  const captionEl = () => $('#caption');
  const wishBtn = () => $('#wishBtn');
  const messageEl = () => $('#message');
  const hbText = () => $('#hbText');

  function caption(text) {
    const el = captionEl();
    el.classList.remove('show');
    if (text) {
      setTimeout(function () { el.textContent = text; el.classList.add('show'); }, 260);
    }
  }
  function shakeCake() {
    const c = cake();
    c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
  }
  function flashFloor() {
    const f = $('#floorGlow');
    f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash');
  }

  /* Two-phase drop: free-fall from above the viewport under gravity,
     then the impact energy is absorbed (squash) and what remains drives
     a damped bounce around the resting position. */
  function dropTier(el, cfg, ok) {
    return new Promise(function (resolve) {
      const rect = el.getBoundingClientRect();
      const fallFrom = -(rect.top + rect.height + 60);   /* start off the top of the screen */
      let x = fallFrom, v = 0, fallT = 0;
      let phase = 'fall', landed = false, done = false;
      let last = performance.now();

      function finish() {
        if (done) return; done = true;
        clearInterval(iv);
        if (ok()) { el.style.opacity = '1'; el.style.transform = ''; }
        resolve();
      }
      function advance(now) {
        if (done) return;
        if (!ok()) { finish(); return; }
        let wall = (now - last) / 1000;
        last = now;
        if (wall <= 0) return;
        if (wall > .5) wall = .5;
        const steps = Math.max(1, Math.ceil(wall / .016));
        const h = wall / steps;
        for (let i = 0; i < steps; i++) {
          if (phase === 'fall') {
            v += cfg.g * h;                    /* gravity */
            x += v * h;
            fallT += h;
            if (x >= 0) {                      /* impact */
              x = 0;
              v = v * cfg.rest;                /* squash absorbs most of the energy */
              phase = 'bounce';
              if (!landed) { landed = true; if (cfg.onLand) cfg.onLand(); }
            }
          } else {
            const a = -cfg.k * x - cfg.c * v;  /* damped settle */
            v += a * h; x += v * h;
          }
        }
        el.style.opacity = phase === 'fall' ? Math.min(1, fallT / .14) : 1;
        const tilt = 6 * Math.tanh(v / 900);   /* soft aerodynamic lean */
        el.style.transform = 'translate3d(0,' + x.toFixed(2) + 'px,0) rotate(' + tilt.toFixed(2) + 'deg)';
        if (phase === 'bounce' && Math.abs(x) < .3 && Math.abs(v) < 12) finish();
      }
      el.style.opacity = '0';
      function onRaf(t) { advance(t); if (!done) window.requestAnimationFrame(onRaf); }
      window.requestAnimationFrame(onRaf);
      const iv = setInterval(function () { advance(performance.now()); }, 16);
      setTimeout(function () { if (!done) finish(); }, 6000);
    });
  }

  function landEffects(el) {
    const inn = el.querySelector('.tier-in');
    inn.classList.remove('squash'); void inn.offsetWidth; inn.classList.add('squash');
    const r = inn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + 12;
    if (window.BD_FX) {
      BD_FX.burst(cx, cy);
      BD_FX.ringAt(cx, cy);
      for (let i = 0; i < 4; i++) {
        setTimeout(function () {
          BD_FX.starAt(cx + (Math.random() * r.width - r.width / 2), cy + Math.random() * r.height);
        }, i * 90);
      }
    }
    if (window.BD_AUDIO) BD_AUDIO.thud(1);
    shakeCake();
    flashFloor();
  }

  /* ---------------- decoration ---------------- */
  function dripSVG(w, fill) {
    const h = 40, base = 10;
    let d = 'M0 0 H' + w + ' V' + base;
    let x = w;
    while (x > 4) {
      const seg = Math.min(x, 26 + Math.random() * 34);
      const nx = x - seg;
      const deep = Math.random() < .72
        ? base + 10 + Math.random() * (h - base - 14)
        : base + 2 + Math.random() * 4;
      const c = Math.min(14, seg * .42);
      d += ' C ' + (x - c) + ' ' + deep.toFixed(1) + ' ' + (nx + c) + ' ' + deep.toFixed(1) + ' ' + nx + ' ' + base;
      x = nx;
    }
    d += ' L0 ' + base + ' Z';
    return '<svg class="drip" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="' + fill + '"/></svg>';
  }

  function decorateCake() {
    const t1 = document.querySelector('.t1 .tier-in');
    const t2 = document.querySelector('.t2 .tier-in');
    const t3 = document.querySelector('.t3 .tier-in');
    if (!t1 || !t2 || !t3) return;
    t1.querySelectorAll('.drip,.pearl').forEach(function (e) { e.remove(); });
    t2.querySelectorAll('.drip').forEach(function (e) { e.remove(); });
    t3.querySelectorAll('.drip').forEach(function (e) { e.remove(); });
    t1.insertAdjacentHTML('beforeend', dripSVG(300, '#ffc22e'));
    t2.insertAdjacentHTML('beforeend', dripSVG(215, '#ffd23f'));
    t3.insertAdjacentHTML('beforeend', dripSVG(140, '#ffb700'));
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('i');
      p.className = 'pearl';
      p.style.left = (12 + Math.random() * 76) + '%';
      p.style.top = (38 + Math.random() * 42) + '%';
      t1.appendChild(p);
    }
  }

  const CANDLE_SPEC = [
    { h: 56 }, { h: 68 }, { h: 50 }, { h: 64 }, { h: 58 }
  ];
  function buildCandles() {
    const wrap = document.getElementById('candles');
    wrap.innerHTML = '';
    CANDLE_SPEC.forEach(function (s) {
      const el = document.createElement('div');
      el.className = 'candle';
      el.style.setProperty('--h', s.h + 'px');
      el.style.setProperty('--fd', (0.16 + Math.random() * 0.12) + 's');
      el.style.setProperty('--tilt', (Math.random() * 6 - 3).toFixed(1) + 'deg');
      el.innerHTML = '<span class="halo"></span><span class="flame"></span>';
      wrap.appendChild(el);
    });
    return Array.prototype.slice.call(wrap.children);
  }

  /* ---------------- message letters ---------------- */
  let lettersSplit = false;
  function splitLetters() {
    if (lettersSplit) return;
    const el = hbText();
    if (!el) return;
    lettersSplit = true;
    el.dataset.orig = el.textContent;
    const chars = Array.from(el.dataset.orig);
    el.innerHTML = '';
    chars.forEach(function (ch, i) {
      if (ch === ' ') { el.insertAdjacentHTML('beforeend', ' '); return; }
      const s = document.createElement('span');
      s.className = 'L';
      s.textContent = ch;
      s.style.animationDelay = (0.35 + i * 0.045) + 's';
      el.appendChild(s);
    });
  }
  function restoreLetters() {
    const el = hbText();
    if (lettersSplit && el && el.dataset.orig) {
      el.textContent = el.dataset.orig;
      lettersSplit = false;
    }
  }

  /* ---------------- the birthday letter (running text) ---------------- */
  const MESSAGE_LINES = [
    { t: 'Happy 22nd birthday! 🎂❤️', cls: 'lead' },
    { t: 'You’re 22 now! You’ve come so far, and I’m really proud of you.' },
    { t: 'I believe in you so much, so please believe in yourself too.' },
    { t: 'No matter what happens, don’t give up on yourself.' },
    { t: 'I hope you have the happiest birthday and that this new year of your life brings you lots of happiness, good memories, and beautiful moments.' },
    { t: 'I’ll always be here to support you, no matter what happens.' },
    { t: 'You’ve got this!', cls: 'end' }
  ];
  let runTimer = null;

  function stopRunText() { clearInterval(runTimer); runTimer = null; }

  function startRunText() {
    stopRunText();
    const card = document.getElementById('runCard');
    const box = document.getElementById('runText');
    if (!card || !box) return;
    box.innerHTML = '';
    card.scrollTop = 0;
    MESSAGE_LINES.forEach(function (l) {
      const d = document.createElement('p');
      d.className = 'runline' + (l.cls ? ' ' + l.cls : '');
      d.textContent = l.t;
      box.appendChild(d);
    });
    const lines = Array.prototype.slice.call(box.children);
    let i = 0;
    runTimer = setInterval(function () {
      if (i >= lines.length) {
        stopRunText();
        document.dispatchEvent(new CustomEvent('bd:letterDone'));
        return;
      }
      const line = lines[i];
      line.classList.add('in');
      /* gently keep the newest line in view */
      const target = Math.max(0, line.offsetTop - card.clientHeight * .55);
      const from = card.scrollTop;
      const t0 = performance.now();
      const gIv = setInterval(function () {
        const k = Math.min(1, (performance.now() - t0) / 700);
        const e = 1 - Math.pow(1 - k, 3);
        card.scrollTop = from + (target - from) * e;
        if (k >= 1) clearInterval(gIv);
      }, 16);
      if (window.BD_AUDIO && i % 2 === 0) BD_AUDIO.sparkle();
      i++;
    }, 1700);
  }

  /* ---------------- fireworks / sparkles helpers ---------------- */
  function stopFireworks() { clearInterval(fwTimer); fwTimer = null; }
  function startFireworks() {
    stopFireworks();
    let n = 0;
    fwTimer = setInterval(function () {
      if (n++ >= 9) { stopFireworks(); return; }
      if (window.BD_FX) BD_FX.launchFw();
    }, 850);
  }
  function stopSparkles() { clearInterval(sparkleTimer); sparkleTimer = null; }
  function startCakeSparkles() {
    stopSparkles();
    sparkleTimer = setInterval(function () {
      if (document.hidden) return;
      const r = cake().getBoundingClientRect();
      if (r.width < 10) return;
      BD_FX.starAt(r.left + Math.random() * r.width, r.top + Math.random() * r.height);
      if (Math.random() < .35)
        BD_FX.starAt(r.left + Math.random() * r.width, r.top + Math.random() * r.height);
    }, 380);
  }

  /* ---------------- reset & sequence ---------------- */
  function resetStage() {
    seqToken++;
    stageReady = false;
    wishStage = 'idle';
    stopFireworks(); stopSparkles(); stopRunText();
    if (window.BD_AUDIO) BD_AUDIO.padOff();
    messageEl().classList.remove('show');
    restoreLetters();
    caption('');
    scene().classList.remove('warm', 'floaty');
    cake().classList.remove('celebrate', 'shake');
    wishBtn().classList.remove('in', 'blow');
    wishBtn().innerHTML = WISH_HTML;
    document.getElementById('candles').innerHTML = '';
    document.querySelectorAll('.tier').forEach(function (t) {
      t.style.opacity = '0'; t.style.transform = '';
      const inn = t.querySelector('.tier-in');
      if (inn) inn.classList.remove('squash');
    });
    ['.plate', '.stem', '.foot', '.floor-shadow'].forEach(function (s) {
      const el = document.querySelector(s); if (el) el.classList.remove('in');
    });
    const fg = document.getElementById('floorGlow');
    fg.classList.remove('in', 'flash');
    const nm = document.getElementById('cakeName');
    if (nm) nm.classList.remove('show');
    decorateCake();
  }

  async function runSequence() {
    resetStage();                       // bumps the token: any run in flight stops
    const t = seqToken;
    const ok = function () { return t === seqToken; };

    cakeScreen().classList.remove('off');
    await sleep(450); if (!ok()) return;

    ['.floor-shadow', '.foot', '.stem', '.plate'].forEach(function (s) {
      const el = document.querySelector(s); if (el) el.classList.add('in');
    });
    document.getElementById('floorGlow').classList.add('in');
    if (window.BD_AUDIO) BD_AUDIO.pop();
    await sleep(580); if (!ok()) return;

    const tiers = [
      { sel: '.t1', g: 3000, rest: .28, k: 520, c: 22 },  /* bottom: firm landing */
      { sel: '.t2', g: 3000, rest: .34, k: 560, c: 23 },
      { sel: '.t3', g: 3000, rest: .42, k: 600, c: 24 }   /* top: playful bounce */
    ];
    for (let i = 0; i < tiers.length; i++) {
      const cfg = tiers[i];
      cfg.onLand = function () { landEffects(document.querySelector(cfg.sel)); };
      await dropTier(document.querySelector(cfg.sel), cfg, ok);
      if (!ok()) return;
      await sleep(300); if (!ok()) return;
    }

    document.getElementById('cakeName').classList.add('show');
    if (window.BD_AUDIO) BD_AUDIO.sparkle();
    await sleep(900); if (!ok()) return;

    const candles = buildCandles();
    candles.forEach(function (c, i) {
      setTimeout(function () { c.classList.add('in'); if (window.BD_AUDIO) BD_AUDIO.pop(); }, i * 115);
    });
    await sleep(candles.length * 115 + 580); if (!ok()) return;

    scene().classList.add('floaty');
    startCakeSparkles();
    stageReady = true;
    wishBtn().classList.add('in');
    document.dispatchEvent(new CustomEvent('bd:stageReady'));
  }

  /* ---------------- the wish (two steps) ----------------
     Step 1: "Make a Wish" → flames light, the cake waits.
     Step 2: "Blow the Candles" → the user blows when ready. */
  let wishStage = 'idle';   /* idle → lit → blowing → done */
  const WISH_HTML = 'Make a Wish&nbsp;<span>✨</span>';
  const BLOW_HTML = 'Blow the Candles&nbsp;<span>🌬️</span>';

  function bindWish() {
    wishBtn().addEventListener('click', async function () {
      if (!stageReady) return;
      const t = seqToken;
      const ok = function () { return t === seqToken; };
      const A = window.BD_AUDIO, F = window.BD_FX;
      const candles = Array.prototype.slice.call(document.getElementById('candles').children);

      /* ---- step 1: make the wish ---- */
      if (wishStage === 'idle') {
        wishStage = 'lit';
        if (A) A.click();
        wishBtn().classList.remove('in');
        caption('close your eyes… wish for something wonderful ✨');
        await sleep(850); if (!ok()) return;

        scene().classList.add('warm');
        candles.forEach(function (c, i) {
          setTimeout(function () { c.classList.add('lit'); if (A) A.ignite(); }, i * 150);
        });
        await sleep(750 + candles.length * 150 + 800); if (!ok()) return;

        /* hand the moment to the user */
        wishBtn().innerHTML = BLOW_HTML;
        wishBtn().classList.add('blow');
        wishBtn().classList.add('in');
        caption('take your time… blow when you’re ready 🕯️');
        document.dispatchEvent(new CustomEvent('bd:flamesReady'));
        return;
      }

      /* ---- step 2: blow the candles ---- */
      if (wishStage !== 'lit') return;
      wishStage = 'blowing';
      if (A) A.click();
      wishBtn().classList.remove('in');
      caption('…now blow! 🌬️');
      if (A) A.whoosh();
      if (F) F.gust();
      candles.forEach(function (c, i) {
        setTimeout(function () { c.classList.add('bend'); }, i * 45);
      });
      await sleep(430); if (!ok()) return;

      candles.forEach(function (c, i) {
        setTimeout(function () {
          c.classList.add('out', 'ember');
          if (F) {
            const r = c.getBoundingClientRect();
            F.smokeAt(r.left + r.width / 2, r.top - 6);
            F.starAt(r.left + r.width / 2, r.top - 10);
          }
        }, i * 130);
      });
      await sleep(500);
      scene().classList.remove('warm');
      await sleep(candles.length * 130 + 900); if (!ok()) return;

      wishStage = 'done';
      revealMessage();
    });
  }

  function revealMessage() {
    splitLetters();
    messageEl().classList.add('show');
    cake().classList.add('celebrate');
    if (window.BD_AUDIO) BD_AUDIO.chime();
    setTimeout(function () { if (window.BD_FX) BD_FX.confettiBurst(); }, 380);
    setTimeout(startFireworks, 900);
    setTimeout(function () { if (window.BD_AUDIO) BD_AUDIO.padOn(); }, 1500);
    setTimeout(startRunText, 2600);
    caption('');
  }

  window.BD_CAKE = {
    start: function () { runSequence(); },
    revealMessage: revealMessage,
    decorate: decorateCake,
    bindWish: bindWish,
    isStageReady: function () { return stageReady; }
  };
})();
