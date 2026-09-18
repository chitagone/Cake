/* ================================================================
   main.js — boots everything, wires the controls.
   URL params for testing / demoing:
     ?party   → skip the countdown, start the cake experience now
     ?wish    → also auto-press "Make a Wish" once the cake is ready
================================================================ */
(function () {
  'use strict';

  const $ = function (s) { return document.querySelector(s); };

  /* visible error surface — if anything ever fails, we see it */
  window.addEventListener('error', function (e) {
    const t = document.getElementById('errToast');
    if (t) { t.hidden = false; t.textContent = '⚠ ' + (e.message || 'something went wrong'); }
  });

  /* audio unlock on first gesture */
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () {
      if (window.BD_AUDIO) BD_AUDIO.unlock();
    }, { passive: true });
  });

  /* sound toggle */
  const soundBtn = $('#soundBtn');
  function syncSoundBtn() {
    if (!window.BD_AUDIO) return;
    const m = BD_AUDIO.isMuted();
    soundBtn.classList.toggle('muted', m);
    soundBtn.setAttribute('aria-pressed', String(!m));
  }
  syncSoundBtn();
  soundBtn.addEventListener('click', function () {
    if (!window.BD_AUDIO) return;
    BD_AUDIO.setMuted(!BD_AUDIO.isMuted());
    if (!BD_AUDIO.isMuted()) BD_AUDIO.click();
    syncSoundBtn();
  });

  /* experience wiring */
  let started = false;
  function startExperience() {
    if (started) return;
    started = true;
    if (window.BD_COUNTDOWN) BD_COUNTDOWN.stop();
    $('#countdownScreen').classList.add('off');
    setTimeout(function () { window.BD_CAKE.start(); }, 850);
  }

  $('#peekBtn').addEventListener('click', startExperience);

  if (window.BD_CAKE) BD_CAKE.bindWish();
  $('#replayBtn').addEventListener('click', function () {
    if (window.BD_AUDIO) BD_AUDIO.click();
    window.BD_CAKE.start();
  });

  /* gentle pointer parallax on desktop */
  if (window.matchMedia && matchMedia('(pointer:fine)').matches) {
    const stage = $('#stage');
    window.addEventListener('pointermove', function (e) {
      const rx = (0.5 - e.clientY / innerHeight) * 3.5;
      const ry = (e.clientX / innerWidth - 0.5) * 4.5;
      stage.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    }, { passive: true });
  }

  /* boot: countdown, unless ?party / #party */
  const params = new URLSearchParams(location.search);
  const party = params.has('party') || location.hash === '#party';
  const autoWish = params.has('wish');

  if (party) {
    startExperience();
  } else if (window.BD_COUNTDOWN) {
    BD_COUNTDOWN.start(startExperience);
  }

  if (autoWish) {
    document.addEventListener('bd:stageReady', function () {
      setTimeout(function () { $('#wishBtn').click(); }, 900);
    }, { once: true });
    document.addEventListener('bd:flamesReady', function () {
      setTimeout(function () { $('#wishBtn').click(); }, 2600);
    }, { once: true });
  }

  if (window.BD_CAKE) BD_CAKE.decorate();
})();
