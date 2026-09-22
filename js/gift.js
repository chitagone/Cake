/* ================================================================
   gift.js — the finale gift box.
   Once the birthday letter finishes (bd:letterDone), a wrapped box
   appears. Tap it to pop the lid and fan out a set of redeemable
   coupons. Closing the box fires bd:giftDone so the photo gallery
   can open next. Exposed as window.BD_GIFT = { reset(), open() }.
   Edit the COUPONS list to change the gifts.
=============================================================== */
(function () {
  'use strict';

  var overlay = document.getElementById('gift');
  if (!overlay) { window.BD_GIFT = { reset: function () {}, open: function () {} }; return; }

  var box = document.getElementById('giftBox');
  var hint = document.getElementById('giftHint');
  var couponsBox = document.getElementById('coupons');
  var doneBtn = document.getElementById('giftDone');

  var COUPONS = [
    { tag: 'coupon 01', t: 'Movie night, your pick 🍿', s: 'blanket, snacks, zero complaints.' },
    { tag: 'coupon 02', t: 'A dinner made just for you 🍽️', s: 'your favourite dish, cooked with love.' },
    { tag: 'coupon 03', t: 'One whole day, all yours ☀️', s: 'we go wherever you want.' },
    { tag: 'coupon 04', t: 'Unlimited hugs 🤗', s: 'redeemable anytime, no expiry.' },
    { tag: 'coupon 05', t: 'One wish, granted ✨', s: 'just say the word.' }
  ];

  var opened = false, runToken = 0, timers = [];

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function later(fn, ms) {
    var tk = runToken;
    timers.push(setTimeout(function () { if (tk === runToken) fn(); }, ms));
  }

  function reset() {
    runToken++; clearTimers();
    opened = false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    box.classList.remove('open');
    couponsBox.innerHTML = '';
    doneBtn.hidden = true;
    doneBtn.classList.remove('in');
    if (hint) hint.textContent = 'tap to open your gift 🎁';
  }

  function buildCoupon(c) {
    var el = document.createElement('div');
    el.className = 'coupon';
    el.innerHTML = '<span class="tag"></span><span class="ct"></span><span class="cs"></span>';
    el.querySelector('.tag').textContent = c.tag;
    el.querySelector('.ct').textContent = c.t;
    el.querySelector('.cs').textContent = c.s;
    return el;
  }

  function openBox() {
    if (opened || !overlay.classList.contains('open')) return;
    opened = true;
    box.classList.add('open');
    if (window.BD_AUDIO) BD_AUDIO.pop();
    if (window.BD_FX) BD_FX.confettiBurst();
    if (hint) hint.textContent = 'these are yours to keep ♡';

    COUPONS.forEach(function (c, i) {
      var el = buildCoupon(c);
      couponsBox.appendChild(el);
      later(function () {
        el.classList.add('in');
        if (window.BD_AUDIO) BD_AUDIO.sparkle();
      }, 350 + i * 280);
    });
    later(function () { doneBtn.hidden = false; doneBtn.classList.add('in'); },
      350 + COUPONS.length * 280);
  }

  function openGift() {
    if (overlay.classList.contains('open')) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeGift() {
    if (window.BD_AUDIO) BD_AUDIO.click();
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.dispatchEvent(new CustomEvent('bd:giftDone'));
  }

  box.addEventListener('click', openBox);
  doneBtn.addEventListener('click', closeGift);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeGift();
  });

  /* reveal the gift once the birthday letter has fully played */
  document.addEventListener('bd:letterDone', function () {
    var tk = ++runToken;
    later(function () { if (tk === runToken) openGift(); }, 1700);
  });

  window.BD_GIFT = { reset: reset, open: openGift };
})();
