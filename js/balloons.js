/* ================================================================
   balloons.js — the balloon-pop mini-game.
   After the candles are blown out, a field of balloons appears.
   Each pop releases the next hidden letter; pop them all to spell
   WORD, then the birthday letter is revealed. Exposed as
   window.BD_BALLOONS = { start(done), reset() }.
   Every run is token-guarded so a replay cancels cleanly.
=============================================================== */
(function () {
  'use strict';

  var overlay = document.getElementById('balloons');
  if (!overlay) {
    window.BD_BALLOONS = { start: function (d) { if (d) d(); }, reset: function () {} };
    return;
  }

  /* edit this to change the hidden message (spaces are free) */
  var WORD = 'HAPPY 22';

  /* balloon body gradients: [highlight, deep] */
  var PAL2 = [
    ['#ffe98a', '#ffb700'],
    ['#ffe0ab', '#ff8e00'],
    ['#fff2bd', '#ffc22e'],
    ['#ffd0a6', '#ff7a4d'],
    ['#ffe6b0', '#eaa000'],
    ['#ffe9f2', '#ff9cc4'],
    ['#e8f5ff', '#84c7ff']
  ];

  var field = document.getElementById('balloonField');
  var wordEl = document.getElementById('balloonWord');
  var hint = document.getElementById('bpopHint');

  var letters = WORD.split('');
  var balloons = 0, popped = 0, next = 0, active = false, onDone = null;
  var runToken = 0, doneTimer = null;

  function buildWord() {
    wordEl.innerHTML = '';
    letters.forEach(function (ch) {
      var s = document.createElement('span');
      s.className = 'bl' + (ch === ' ' ? ' sp' : '');
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      wordEl.appendChild(s);
    });
  }

  /* reveal letters left → right, gliding over spaces */
  function revealNext() {
    var spans = wordEl.children;
    while (next < spans.length) {
      var s = spans[next++];
      s.classList.add('on');
      if (!s.classList.contains('sp')) return;
    }
  }

  function reset() {
    runToken++;
    active = false; popped = 0; next = 0; balloons = 0; onDone = null;
    if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
    field.innerHTML = '';
    wordEl.innerHTML = '';
    overlay.classList.remove('open', 'done');
    overlay.setAttribute('aria-hidden', 'true');
    if (hint) hint.textContent = 'tap every balloon 🎈';
  }

  function popBalloon(btn) {
    if (!active || btn.classList.contains('pop')) return;
    btn.classList.add('pop');

    var r = btn.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (window.BD_AUDIO) BD_AUDIO.pop();
    if (window.BD_FX) {
      BD_FX.burst(cx, cy, 20, 300);
      BD_FX.ringAt(cx, cy);
      BD_FX.starAt(cx, cy);
    }

    revealNext();
    popped++;
    if (popped >= balloons) finish();
  }

  function finish() {
    active = false;
    overlay.classList.add('done');
    if (hint) hint.textContent = 'you did it! ✨';
    if (window.BD_AUDIO) BD_AUDIO.chime();
    if (window.BD_FX) BD_FX.confettiBurst();

    var tk = runToken;
    doneTimer = setTimeout(function () {
      if (tk !== runToken) return;
      overlay.classList.remove('open', 'done');
      overlay.setAttribute('aria-hidden', 'true');
      var cb = onDone; onDone = null;
      if (cb) cb();
    }, 2100);
  }

  function start(done) {
    reset();
    onDone = done || null;
    buildWord();

    var count = 0;
    letters.forEach(function (ch) { if (ch !== ' ') count++; });
    balloons = count;

    for (var i = 0; i < count; i++) {
      var pair = PAL2[i % PAL2.length];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bpop';
      b.setAttribute('aria-label', 'pop balloon ' + (i + 1));
      b.style.setProperty('--i', i);
      b.style.setProperty('--c1', pair[0]);
      b.style.setProperty('--c2', pair[1]);
      b.innerHTML = '<span class="string"></span>';
      b.addEventListener('click', function () { popBalloon(this); });
      field.appendChild(b);
    }

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    active = true;
  }

  window.BD_BALLOONS = { start: start, reset: reset };
})();
