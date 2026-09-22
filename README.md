# 🎂 Priya's Birthday — September 23

A magical, interactive birthday experience: a live countdown to **September 23 in
Manipur time (IST / Asia/Kolkata)**, followed by a physics-animated cake reveal
(the name "Priya" appears only on the cake itself — it's the surprise!),
candles, a two-step "Make a Wish → Blow the Candles" moment, a **balloon-pop
mini-game**, a celebratory finale with a gently scrolling personal birthday
letter for her 22nd, a **gift box that opens into redeemable coupons**, and a
photo gallery.

**Theme:** white & golden · **No build step · No dependencies** — pure HTML/CSS/JS.

## Files

```
index.html          the whole experience
css/style.css       white & yellow theme, all animations
js/audio.js         Web-Audio synthesized sounds + background-music control
js/fx.js            particles: bokeh, bursts, smoke, confetti, fireworks
js/cake.js          cake assembly, spring physics, wish sequence, the letter
js/countdown.js     IST-locked countdown logic
js/main.js          boot + controls
js/gallery.js       photo carousel + lightbox
js/balloons.js      the balloon-pop mini-game (edit WORD to change the message)
js/gift.js          the gift box + coupons (edit COUPONS to change the gifts)
```

The birthday letter text lives in `MESSAGE_LINES` at the top of `js/cake.js` —
easy to edit any time.

## Your music & your voice

* **Background song:** already wired and looped. It plays when the cake
  experience starts and is gently turned down during the spoken letter so your
  voice stands out, then comes back up. To swap it, replace
  `MP3/Favorit music background.mp3` (keep the same name) or update the
  `#bgMusic` `src` in `index.html`.
* **Spoken letter:** each line of `MESSAGE_LINES` (top of `js/cake.js`) has a
  matching `voice:` clip. The line appears, the clip plays, and the next line
  waits for it to finish — so the words and your voice stay in step. Recordings
  live in `MP3/`; point each `voice:` at its file (rename a clip and just update
  the matching string). Missing/unplayable clips fall back to a timed pace.


## Run locally

Just double-click `index.html` — everything works straight from the file system.

**Test the cake before the big day** (add to the URL):

| URL | What it does |
|---|---|
| `index.html` | live countdown to Sept 23, IST |
| `index.html?party` | skip countdown → cake experience immediately |
| `index.html?party&wish` | also auto-presses "Make a Wish" (full demo) |

There is also a **"▶ preview the magic"** button under the countdown.

## Deploy free on Netlify (2 minutes)

### Option A — drag & drop (easiest)
1. Go to **https://app.netlify.com/drop**
2. Drag this whole `Cake` folder onto the page
3. Done — you get a free `https://something.netlify.app` URL you can share

### Option B — connect GitHub
1. Push this folder to a GitHub repository
2. In Netlify: **Add new site → Import an existing project → GitHub**
3. Leave every build setting **empty** (no build command, no package.json needed)
4. Deploy

### Option C — Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --dir=. --prod
```

The countdown uses the visitor-independent **Asia/Kolkata** timezone, so it hits
midnight Sept 23 at the correct moment no matter where in the world it's opened
from — and the cake experience starts automatically at that instant.
