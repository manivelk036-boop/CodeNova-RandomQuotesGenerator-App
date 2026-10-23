(() => {
  'use strict';

  const FAV_KEY = 'quotidian.favorites.v1';
  const LAST_KEY = 'quotidian.last.v1';
  const FALLBACK_AUTHOR = 'Unknown author';

  // Tiny built-in set: used only if quotes.json cannot be loaded (e.g. opened from file://).
  const EMBEDDED = [
    { id: 9001, text: 'The secret of getting ahead is getting started.', author: 'Mark Twain', genre: 'Action' },
    { id: 9002, text: 'Well done is better than well said.', author: 'Benjamin Franklin', genre: 'Action' },
    { id: 9003, text: 'Fall seven times, stand up eight.', author: null, genre: 'Perseverance' },
    { id: 9004, text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci', genre: 'Design' }
  ];

  const $ = id => document.getElementById(id);
  const el = {
    card: $('card'), text: $('text'), author: $('author'), genre: $('genre'),
    newBtn: $('newBtn'), favBtn: $('favBtn'), favLabel: $('favLabel'), copyBtn: $('copyBtn'),
    tabQuote: $('tab-quote'), tabFavs: $('tab-favs'),
    viewQuote: $('view-quote'), viewFavs: $('view-favs'),
    favList: $('favList'), empty: $('empty'), favCount: $('favCount'), goQuote: $('goQuote'),
    net: $('net'), toast: $('toast'), installBtn: $('installBtn')
  };

  let quotes = [];
  let current = null;
  let busy = false;

  /* ---------- storage (safe wrappers) ---------- */
  const load = (key, fallback) => {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
    catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { toast('Could not save on this device'); }
  };

  let favorites = load(FAV_KEY, []);
  const isFav = q => favorites.some(f => f.id === q.id);

  /* ---------- data ---------- */
  const clean = list => list.filter(q => q && typeof q.text === 'string' && q.text.trim());

  async function loadQuotes() {
    try {
      const res = await fetch('quotes.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('bad status');
      const data = clean(await res.json());
      if (!data.length) throw new Error('empty');
      return data;
    } catch {
      return EMBEDDED;
    }
  }

  function pick() {
    if (quotes.length === 1) return quotes[0];
    let q;
    do { q = quotes[Math.floor(Math.random() * quotes.length)]; } while (current && q.id === current.id);
    return q;
  }

  /* ---------- rendering ---------- */
  const authorOf = q => (q.author && q.author.trim()) || FALLBACK_AUTHOR;

  function paint(q) {
    current = q;
    el.text.textContent = q.text;
    const known = !!(q.author && q.author.trim());
    el.author.textContent = authorOf(q);
    el.author.classList.toggle('unknown', !known);
    el.genre.textContent = q.genre || 'General';
    syncFav();
    save(LAST_KEY, q.id);
  }

  function syncFav() {
    const on = current && isFav(current);
    el.favBtn.setAttribute('aria-pressed', String(on));
    el.favLabel.textContent = on ? 'Saved' : 'Save';
    el.favCount.textContent = favorites.length;
  }

  function showQuote(q, animate = true) {
    if (!animate) { paint(q); return; }
    if (busy) return;
    busy = true;
    el.card.classList.remove('entering');
    el.card.classList.add('leaving');
    setTimeout(() => {
      paint(q);
      el.card.classList.remove('leaving');
      el.card.classList.add('entering');
      setTimeout(() => { el.card.classList.remove('entering'); busy = false; }, 440);
    }, 260);
  }

  function renderFavorites() {
    el.favList.innerHTML = '';
    el.empty.hidden = favorites.length > 0;
    favorites.forEach(q => {
      const li = document.createElement('li');
      li.className = 'fav';
      li.dataset.id = q.id;

      const quote = document.createElement('q');
      quote.textContent = q.text;

      const meta = document.createElement('div');
      meta.className = 'fav-meta';
      const who = document.createElement('span');
      const known = !!(q.author && q.author.trim());
      who.className = 'who' + (known ? '' : ' unknown');
      who.textContent = authorOf(q);
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = q.genre || 'General';
      meta.append(who, tag);

      const actions = document.createElement('div');
      actions.className = 'fav-actions';
      const show = document.createElement('button');
      show.textContent = 'View';
      show.addEventListener('click', () => { setTab('quote'); showQuote(q); });
      const del = document.createElement('button');
      del.textContent = 'Remove';
      del.addEventListener('click', () => removeFav(q.id, li));
      actions.append(show, del);

      li.append(quote, meta, actions);
      el.favList.append(li);
    });
    el.favCount.textContent = favorites.length;
  }

  /* ---------- favorites ---------- */
  function toggleFav() {
    if (!current) return;
    if (isFav(current)) {
      favorites = favorites.filter(f => f.id !== current.id);
      toast('Removed from favorites');
    } else {
      favorites = [{ ...current }, ...favorites];
      toast('Saved to favorites');
      el.favBtn.classList.remove('pop'); void el.favBtn.offsetWidth; el.favBtn.classList.add('pop');
    }
    save(FAV_KEY, favorites);
    syncFav();
    renderFavorites();
  }

  function removeFav(id, li) {
    li.classList.add('removing');
    setTimeout(() => {
      favorites = favorites.filter(f => f.id !== id);
      save(FAV_KEY, favorites);
      renderFavorites();
      syncFav();
    }, 240);
  }

  /* ---------- tabs ---------- */
  function setTab(name) {
    const q = name === 'quote';
    el.tabQuote.setAttribute('aria-selected', String(q));
    el.tabFavs.setAttribute('aria-selected', String(!q));
    el.viewQuote.hidden = !q;
    el.viewFavs.hidden = q;
    if (!q) renderFavorites();
  }

  /* ---------- misc ---------- */
  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 1800);
  }

  async function copy() {
    if (!current) return;
    const str = `\u201C${current.text}\u201D \u2014 ${authorOf(current)}`;
    try { await navigator.clipboard.writeText(str); toast('Copied to clipboard'); }
    catch { toast('Copy is not available here'); }
  }

  function netStatus() {
    const on = navigator.onLine;
    el.net.textContent = on ? 'Online' : 'Offline mode';
    el.net.classList.toggle('offline', !on);
  }

  /* ---------- events ---------- */
  el.newBtn.addEventListener('click', () => showQuote(pick()));
  el.favBtn.addEventListener('click', toggleFav);
  el.copyBtn.addEventListener('click', copy);
  el.tabQuote.addEventListener('click', () => setTab('quote'));
  el.tabFavs.addEventListener('click', () => setTab('favs'));
  el.goQuote.addEventListener('click', () => { setTab('quote'); showQuote(pick()); });

  document.addEventListener('keydown', e => {
    if (e.target.closest('button') && e.code === 'Space') return;
    if (el.viewQuote.hidden) return;
    if (e.key.toLowerCase() === 'n' || e.code === 'Space') { e.preventDefault(); showQuote(pick()); }
  });

  window.addEventListener('online', () => { netStatus(); toast('Back online'); });
  window.addEventListener('offline', () => { netStatus(); toast('You are offline. Quotes still work.'); });

  // Install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e; el.installBtn.hidden = false;
  });
  el.installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null; el.installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { el.installBtn.hidden = true; toast('App installed'); });

  /* ---------- init ---------- */
  (async function init() {
    netStatus();
    quotes = await loadQuotes();
    const lastId = load(LAST_KEY, null);
    // Show a valid quote immediately; avoid repeating the last one on launch.
    let first = pick();
    if (quotes.length > 1 && first.id === lastId) first = pick();
    paint(first);
    el.card.classList.add('entering');
    setTimeout(() => el.card.classList.remove('entering'), 450);
    renderFavorites();
  })();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
