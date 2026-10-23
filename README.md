# CodeNova-RandomQuotesGenerator-App

A mobile-first Progressive Web App that shows random quotes in a clean card, with smooth transitions, local favorites, and full offline support. Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Features
- Card with quote text, author attribution and genre tag
- **New quote** button with animated card transition (also `N` / space bar)
- **Save** quotes to a favorites list stored in `localStorage` (persists across restarts)
- Missing author shows the fallback "Unknown author"
- Bundled `quotes.json` (40 quotes) cached by a service worker, so the app works with no internet
- Online/offline indicator, install button, copy-to-clipboard
- Respects reduced-motion, keyboard focus and safe-area insets

## Setup
A service worker needs `http://localhost` or HTTPS (it will not register from `file://`).

```bash
python3 -m http.server 8080      # or: npx serve .
```
Open http://localhost:8080.

### Test offline
1. Load the page once online.
2. DevTools > Application > Service Workers > tick **Offline** (or turn on airplane mode), then reload.
3. The app still launches and shows quotes; favorites remain.

### Install on a phone
Deploy the folder to any HTTPS host (GitHub Pages, Netlify, Vercel), open it on the phone, then use **Install app** or the browser's "Add to Home Screen".

## Project structure
```
index.html            App shell
styles.css            Design tokens and animations
app.js                Logic: quotes, favorites, tabs, offline, install
quotes.json           Bundled dataset (author may be null)
sw.js                 Service worker (cache-first)
manifest.webmanifest  PWA manifest
icons/                SVG + PNG (192, 512, maskable) icons
```

## Adding quotes
Append to `quotes.json` with a unique `id`. Use `"author": null` for unknown authors. Bump `CACHE` in `sw.js` (e.g. `quotidian-v2`) so installed apps refresh.

## Design inspiration notes
- **Concept:** a quote as a printed card lifted off a midnight-violet desk. The big serif text on a pale lilac card is the single focal point; everything else stays quiet.
- **Palette:** Ink `#141029`, Plum `#3a2a73`, Lilac paper `#f4f0ff`, Marigold `#ffb703` (used only for actions and the author rule).
- **Type:** an old-style serif stack (Iowan Old Style / Palatino / Georgia) for quotes, the system UI font for controls. System fonts keep the app fast and fully offline.
- **Motion:** the old card tips away and the new one settles in, only when the user asks for a new quote; the heart pops when saving.
- **Resilience:** missing authors get a visible fallback, a tiny embedded quote set covers the case where `quotes.json` cannot load, and storage errors show a message instead of failing silently.

## Screenshots for submission
Take three: (1) a quote on screen, (2) the Favorites tab with saved items, (3) the app running with the "Offline mode" badge visible (DevTools offline).
