/* ================================================================
   audio.js — every sound synthesized with Web Audio (no files).
   Exposed as window.BD_AUDIO. Storage access is wrapped in
   try/catch so restrictive file:// privacy modes can't kill the page.
================================================================ */
(function () {
  'use strict';

  let AC = null, master = null, padNodes = null, noiseBuf = null;
  let muted = false;

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k)     { try { return localStorage.getItem(k); } catch (e) { return null; } }
  muted = read('priya-bd-muted') === '1';

  function ac() {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      if (!AC) {
        AC = new C();
        master = AC.createGain();
        master.gain.value = muted ? 0 : .8;
        master.connect(AC.destination);
      }
      if (AC.state === 'suspended') AC.resume();
      return AC;
    } catch (e) { return null; }
  }

  function env(g, t0, atk, peak, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  function tone(freq, opts) {
    const o = Object.assign({ type: 'sine', dur: .4, vol: .2, slide: 0, delay: 0 }, opts);
    const c = ac(); if (!c || muted) return;
    try {
      const t0 = c.currentTime + o.delay;
      const osc = c.createOscillator(), g = c.createGain();
      osc.type = o.type;
      osc.frequency.setValueAtTime(freq, t0);
      if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t0 + o.dur);
      env(g, t0, .012, o.vol, o.dur);
      osc.connect(g).connect(master);
      osc.start(t0); osc.stop(t0 + o.dur + .06);
    } catch (e) {}
  }

  function ensureNoise(c) {
    if (noiseBuf) return noiseBuf;
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function noise(opts) {
    const o = Object.assign({ dur: .4, vol: .2, type: 'lowpass', f: 800, slide: 0, q: 1, delay: 0 }, opts);
    const c = ac(); if (!c || muted) return;
    try {
      ensureNoise(c);
      const t0 = c.currentTime + o.delay;
      const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const fl = c.createBiquadFilter(); fl.type = o.type; fl.Q.value = o.q;
      fl.frequency.setValueAtTime(o.f, t0);
      if (o.slide) fl.frequency.exponentialRampToValueAtTime(o.slide, t0 + o.dur);
      const g = c.createGain(); env(g, t0, .02, o.vol, o.dur);
      s.connect(fl).connect(g).connect(master);
      s.start(t0); s.stop(t0 + o.dur + .06);
    } catch (e) {}
  }

  /* --- the palette --- */
  function thud(k)   { tone(165, { slide: 44, dur: .32, vol: .5 * k }); noise({ dur: .18, vol: .24 * k, f: 260 }); }
  function sparkle() {
    for (let i = 0; i < 3; i++) {
      const f = 1400 + Math.random() * 1000;
      tone(f, { type: 'triangle', dur: .5, vol: .06, delay: i * .055, slide: f * 1.6 });
    }
  }
  function ignite() { noise({ dur: .24, vol: .045, type: 'highpass', f: 2600 }); tone(520, { slide: 900, dur: .2, vol: .045 }); }
  function pop()    { noise({ dur: .1, vol: .14, type: 'bandpass', f: 900, slide: 320, q: 1.2 }); tone(300, { slide: 640, dur: .09, vol: .08, type: 'triangle' }); }
  function click()  { noise({ dur: .05, vol: .12, type: 'highpass', f: 1900 }); }
  function whoosh() {
    const c = ac(); if (!c || muted) return;
    try {
      ensureNoise(c);
      const t0 = c.currentTime;
      const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = .8;
      fl.frequency.setValueAtTime(380, t0);
      fl.frequency.exponentialRampToValueAtTime(1700, t0 + .8);
      const g = c.createGain();
      g.gain.setValueAtTime(.0001, t0);
      g.gain.linearRampToValueAtTime(.5, t0 + .22);
      g.gain.exponentialRampToValueAtTime(.001, t0 + .95);
      s.connect(fl).connect(g).connect(master);
      s.start(t0); s.stop(t0 + 1);
    } catch (e) {}
  }
  function chime() {
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      tone(f,     { type: 'triangle', dur: 1.15, vol: .15, delay: i * .14 });
      tone(f / 2, { type: 'sine',     dur: 1.3,  vol: .07, delay: i * .14 });
    });
    setTimeout(sparkle, 500);
  }
  function padOn() {
    const c = ac(); if (!c || padNodes) return;
    try {
      const g = c.createGain(); g.gain.value = 0;
      const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 900;
      const oscs = [220, 277.18, 329.63].map(function (f) {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        o.connect(fl); o.start(); return o;
      });
      fl.connect(g).connect(master);
      g.gain.linearRampToValueAtTime(muted ? 0 : .05, c.currentTime + 2.5);
      padNodes = { g: g, oscs: oscs };
    } catch (e) {}
  }
  function padOff() {
    if (!padNodes || !AC) return;
    try {
      var n = padNodes;
      n.g.gain.linearRampToValueAtTime(0, AC.currentTime + .7);
      n.oscs.forEach(function (o) { o.stop(AC.currentTime + .8); });
    } catch (e) {}
    padNodes = null;
  }
  function setMuted(m) {
    muted = m;
    store('priya-bd-muted', m ? '1' : '0');
    if (AC && master) {
      try { master.gain.linearRampToValueAtTime(m ? 0 : .8, AC.currentTime + .12); } catch (e) {}
    }
  }

  window.BD_AUDIO = {
    unlock: ac,
    thud: thud, sparkle: sparkle, ignite: ignite, pop: pop, click: click,
    whoosh: whoosh, chime: chime, padOn: padOn, padOff: padOff,
    isMuted: function () { return muted; },
    setMuted: setMuted
  };
})();
