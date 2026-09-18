/* ================================================================
   countdown.js — IST-locked countdown (Asia/Kolkata, fixed UTC+5:30,
   no DST). Pure epoch math, immune to the visitor's local timezone.
     Sept 23 00:00 IST  ==  Sept 22 18:30 UTC
================================================================ */
(function () {
  'use strict';

  let yearFmt = null, clockFmt = null;
  try {
    yearFmt  = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric' });
    clockFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  } catch (e) { /* Intl without full ICU — fall back to manual +5:30 offset below */ }

  function istYear(now) {
    if (yearFmt) {
      try { return +yearFmt.format(new Date(now)); } catch (e) {}
    }
    return new Date(now + 5.5 * 3600000).getUTCFullYear();
  }
  function istClock(now) {
    if (clockFmt) {
      try { return clockFmt.format(new Date(now)); } catch (e) {}
    }
    const d = new Date(now + 5.5 * 3600000);
    const p = n => String(n).padStart(2, '0');
    return p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds());
  }

  function targetFor(now) {
    const y = istYear(now);
    const t = Date.UTC(y, 8, 22, 18, 30, 0);   // Sept 23 00:00 IST
    const e = Date.UTC(y, 8, 23, 18, 30, 0);   // Sept 24 00:00 IST
    if (now >= t && now < e) return { mode: 'party', t: t };
    if (now >= e) return { mode: 'wait', t: Date.UTC(y + 1, 8, 22, 18, 30, 0) };
    return { mode: 'wait', t: t };
  }

  let timer = null, onParty = null, started = false;
  const prev = {};

  function setNum(el, val) {
    const s = String(val).padStart(2, '0');
    if (prev[el.id] === s) return;
    prev[el.id] = s;
    el.textContent = s;
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
  }

  function upd() {
    const now = Date.now();
    if (targetFor(now).mode === 'party') {
      if (!started) { started = true; stop(); if (onParty) onParty(); }
      return;
    }
    const diff = Math.max(0, targetFor(now).t - now);
    setNum(document.getElementById('cdD'), Math.floor(diff / 864e5));
    setNum(document.getElementById('cdH'), Math.floor(diff / 36e5) % 24);
    setNum(document.getElementById('cdM'), Math.floor(diff / 6e4) % 60);
    setNum(document.getElementById('cdS'), Math.floor(diff / 1e3) % 60);
    document.getElementById('istClock').textContent = istClock(now);
  }

  function start(cb) {
    onParty = cb;
    upd();
    timer = setInterval(upd, 250);
  }
  function stop() { clearInterval(timer); timer = null; }

  window.BD_COUNTDOWN = { start: start, stop: stop, targetFor: targetFor };
})();
