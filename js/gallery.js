/* ================================================================
   gallery.js — the bias gallery.
   10 photos in strict index order (images/1.jpg … images/10.jpg),
   shown 3 at a time — flip pages with the ‹ › buttons, the dots,
   arrow keys or a swipe. Tap a card for a fullscreen lightbox
   (object-fit:contain, so every photo shows whole).
================================================================ */
(function () {
  'use strict';

  var PER_PAGE = 3;
  var COUNT = 10;
  var PHOTOS = [];
  for (var i = 1; i <= COUNT; i++) PHOTOS.push({ n: i, src: 'images/' + i + '.jpg' });

  var pages = Math.ceil(PHOTOS.length / PER_PAGE);
  var page = 0;      /* carousel page */
  var current = 0;   /* lightbox photo */

  var gallery = document.getElementById('gallery');
  var track   = document.getElementById('galTrack');
  var lb      = document.getElementById('lightbox');
  var lbImg   = document.getElementById('lbImg');
  var lbCap   = document.getElementById('lbCap');
  var cards   = [];
  var dots    = [];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function click() { if (window.BD_AUDIO) BD_AUDIO.click(); }

  /* ---- build the polaroid cards, index order 1 → 10 ---- */
  PHOTOS.forEach(function (p, i) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'gcard';
    card.setAttribute('aria-label', 'open photo ' + p.n);
    card.innerHTML =
      '<span class="tape"></span>' +
      '<span class="ph"><img src="' + p.src + '" alt="funny K-pop idol photo number ' + p.n + '" loading="lazy" decoding="async" draggable="false"></span>' +
      '<span class="num">№ ' + pad(p.n) + '</span>';
    card.addEventListener('click', function () { click(); openLb(i); });
    track.appendChild(card);
    cards.push(card);
  });

  /* ---- page dots (one per group of 3) ---- */
  var dotsBox = document.getElementById('galDots');
  for (var p = 0; p < pages; p++) {
    (function (p) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'dot';
      d.setAttribute('aria-label', 'photos ' + (p * PER_PAGE + 1) + ' to ' + Math.min((p + 1) * PER_PAGE, PHOTOS.length));
      d.addEventListener('click', function () { click(); showPage(p, true); });
      dotsBox.appendChild(d);
      dots.push(d);
    }(p));
  }

  /* ---- paging: light up the page's 3 cards, slide the track ---- */
  function showPage(p, smooth) {
    page = ((p % pages) + pages) % pages;
    var first = page * PER_PAGE;
    var last = Math.min(first + PER_PAGE, PHOTOS.length) - 1;
    cards.forEach(function (c, i) { c.classList.toggle('cur', i >= first && i <= last); });
    /* center this page's group: track's left edge sits at 50%,
       so translate by minus the group's centre offset */
    var a = cards[first], b = cards[last];
    var centre = (a.offsetLeft + b.offsetLeft + b.offsetWidth) / 2;
    track.style.transition = smooth ? 'transform .6s cubic-bezier(.2,1,.3,1)' : 'none';
    track.style.transform = 'translateX(' + (-centre) + 'px)';
    dots.forEach(function (d, i) { d.classList.toggle('on', i === page); });
  }
  function turn(d) { click(); showPage(page + d, true); }

  document.getElementById('pagePrev').addEventListener('click', function () { turn(-1); });
  document.getElementById('pageNext').addEventListener('click', function () { turn(1); });
  window.addEventListener('resize', function () { showPage(page, false); });

  /* ---- gallery open / close ---- */
  function openGallery() {
    gallery.classList.add('open');
    gallery.setAttribute('aria-hidden', 'false');
    showPage(page, false);
  }
  function closeGallery() {
    closeLb();
    gallery.classList.remove('open');
    gallery.setAttribute('aria-hidden', 'true');
  }

  /* ---- lightbox ---- */
  function show(i) {
    current = (i + PHOTOS.length) % PHOTOS.length;
    var p = PHOTOS[current];
    lbImg.src = p.src;
    lbImg.alt = 'funny K-pop idol photo number ' + p.n;
    lbCap.textContent = '№ ' + pad(p.n) + ' · ' + (current + 1) + ' / ' + PHOTOS.length;
    /* preload neighbours so stepping feels instant */
    new Image().src = PHOTOS[(current + 1) % PHOTOS.length].src;
    new Image().src = PHOTOS[(current - 1 + PHOTOS.length) % PHOTOS.length].src;
  }
  function openLb(i) {
    show(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
  }
  function closeLb() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    /* keep the carousel on the page holding the photo just viewed */
    showPage(Math.floor(current / PER_PAGE), true);
  }
  function step(d) {
    click();
    show(current + d);
  }

  document.getElementById('galClose').addEventListener('click', function () { click(); closeGallery(); });
  document.getElementById('lbPrev').addEventListener('click', function () { step(-1); });
  document.getElementById('lbNext').addEventListener('click', function () { step(1); });

  /* the finale: once the wish is blown out, the balloon game is popped,
     and the gift is opened, the gallery reveals itself as the last
     part of the surprise (bd:giftDone from gift.js) */
  function revealGallery() {
    setTimeout(function () {
      if (!gallery.classList.contains('open')) openGallery();
    }, 1500);
  }
  document.addEventListener('bd:giftDone', revealGallery);
  document.addEventListener('bd:letterDone', function () {
    if (window.BD_GIFT) return;   /* the gift reveal chains into the gallery */
    revealGallery();
  });

  /* keys: Esc closes (lightbox first), arrows page the carousel —
     or step photos when the lightbox is open */
  document.addEventListener('keydown', function (e) {
    if (!gallery.classList.contains('open')) return;
    var lbOpen = lb.classList.contains('open');
    if (e.key === 'Escape') { lbOpen ? closeLb() : closeGallery(); }
    else if (e.key === 'ArrowRight') { lbOpen ? step(1) : turn(1); }
    else if (e.key === 'ArrowLeft') { lbOpen ? step(-1) : turn(-1); }
  });

  /* swipe: on the carousel it turns pages, on the lightbox it steps
     photos. the drag start point also lets us tell a plain tap on the
     lightbox backdrop (→ close) from a swipe */
  function swipeOn(el, onNext) {
    var sx = 0, sy = 0, dragging = false, moved = false;
    el.addEventListener('pointerdown', function (e) { dragging = true; moved = false; sx = e.clientX; sy = e.clientY; });
    el.addEventListener('pointermove', function (e) {
      if (dragging && (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8)) moved = true;
    });
    el.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) onNext(dx < 0 ? 1 : -1);
      else if (e.target === el && !moved) el.dispatchEvent(new CustomEvent('swipe:tap', { detail: e }));
    });
    el.addEventListener('pointercancel', function () { dragging = false; moved = false; });
  }
  swipeOn(document.querySelector('.rail-wrap'), function (d) { turn(d); });
  swipeOn(lb, function (d) { step(d); });
  lb.addEventListener('swipe:tap', function () { closeLb(); });
})();
