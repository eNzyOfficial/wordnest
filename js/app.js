// App shell: routing, header, search box, drawer, gestures, service worker.
const q = $('#q');
let current = { view: 'home', dict: null, key: null, entry: null };

const TITLES = { cards: 'Word card', history: 'History', study: 'Flashcards', settings: 'Settings', offline: 'Offline dictionaries', sources: 'Sources and licences' };

function show(view) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'v-' + view));
  const dictView = ['home', 'suggest', 'word', 'examples'].includes(view);
  $('#searchForm').classList.toggle('hidden', !dictView);
  $('#pairBadge').classList.toggle('hidden', !dictView);
  $('#pairbar').classList.toggle('hidden', !['home', 'suggest'].includes(view));
  $('#topTitle').classList.toggle('hidden', dictView);
  $('#topTitle').textContent = TITLES[view] || '';
  $('#menuBtn').classList.toggle('hidden', view === 'examples');
  $('#backBtn').classList.toggle('hidden', view !== 'examples');
  const act = $('#topAction');
  act.classList.toggle('hidden', !['cards', 'history'].includes(view));
  act.textContent = 'Clear';
  $('#bottombar').classList.toggle('hidden', view !== 'word');
  current.view = view;
  if (view !== 'suggest') $('#main').scrollTop = 0;
}

async function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  closeDrawer(); closePeek(); $('#pairSheet').classList.remove('show');
  const [name, a, b] = parts;
  if (name === 'w' || name === 'x') {
    if (a && a !== settings.get('dict') && data.dicts.some(d => d.id === a)) { settings.set('dict', a); updatePair(); }
    return name === 'w' ? openWord(a, b) : openExamples(a, b);
  }
  if (TITLES[name]) { show(name); return views[name]($('#v-' + name)); }
  q.value = '';
  syncClear();
  show('home');
  views.home($('#v-home'));
}

async function openWord(dictId, key) {
  show('word');
  const el = $('#v-word');
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  let entry;
  try { entry = await data.entry(dictId, key); }
  catch { el.innerHTML = '<p class="empty">This word is not available offline yet. Connect to the internet, or download the dictionary in Offline dictionaries.</p>'; return; }
  if (!entry) {
    el.innerHTML = `<p class="empty">"${esc(key)}" was not found.</p>`;
    return;
  }
  current = { ...current, dict: dictId, key, entry };
  q.value = entry.w;
  syncClear();
  el.innerHTML = renderWord(dictId, key, entry);
  const count = exampleCount(entry);
  $('#bottombar').innerHTML = `<a href="#/x/${encodeURIComponent(dictId)}/${encodeURIComponent(key)}">Usage examples${count ? ` <b>${count}</b>` : ''} ${icon('chev')}</a>`;
  $('#bottombar').classList.toggle('hidden', !count);
  recent.add({ d: dictId, k: key, w: entry.w, g: glossOf(entry), ph: firstPron(entry) });
  document.title = entry.w + ' - Wordnest';
}

async function openExamples(dictId, key) {
  show('examples');
  const entry = current.key === key && current.entry ? current.entry : await data.entry(dictId, key).catch(() => null);
  $('#v-examples').innerHTML = entry ? renderExamples(entry) : '<p class="empty">Not available offline.</p>';
  if (entry) current = { ...current, dict: dictId, key, entry };
}

// ---------------------------------------------------------------- search box
let typingTimer;
q.addEventListener('input', () => {
  syncClear();
  clearTimeout(typingTimer);
  const v = q.value;
  updatePairDirection(v);
  if (!v.trim()) { if (current.view === 'suggest') route(); return; }
  if (current.view !== 'suggest') show('suggest');
  typingTimer = setTimeout(() => views.suggest($('#v-suggest'), v), 60);
});
q.addEventListener('focus', () => {
  if (current.view === 'word' && q.value) { q.select(); show('suggest'); views.suggest($('#v-suggest'), q.value); }
});
$('#searchForm').addEventListener('submit', async e => {
  e.preventDefault();
  const v = q.value.trim();
  if (!v) return;
  q.blur();
  const rows = await search.suggest(settings.get('dict'), v, 1).catch(() => []);
  if (rows.length) location.hash = `#/w/${encodeURIComponent(settings.get('dict'))}/${encodeURIComponent(rows[0][0])}`;
  else views.suggest($('#v-suggest'), v);
});
$('#clearBtn').addEventListener('click', () => { q.value = ''; syncClear(); q.focus(); updatePairDirection('');
  if (current.view === 'suggest') { show('home'); views.home($('#v-home')); }
});
function syncClear() { $('#clearBtn').classList.toggle('hidden', !q.value); }

// ---------------------------------------------------------------- dictionary picker
function updatePair() {
  const d = data.dict(settings.get('dict'));
  const [a, b] = d.title.split('-');
  $('#pairA').textContent = a; $('#pairB').textContent = b;
  $('#pairBadge').textContent = d.id.toUpperCase();
  $('#drawerPair').textContent = `${a} <-> ${b}`;
  q.placeholder = d.langs.includes('th') ? 'Search English or Thai' : 'Search English';
}
function updatePairDirection(v) {
  const d = data.dict(settings.get('dict'));
  $('#pairbar').classList.toggle('rev', d.langs.includes('th') && isThai(v));
}
function openPairs() {
  $('#pairList').innerHTML = data.dicts.map(d => `<button class="pair-opt${d.id === settings.get('dict') ? ' on' : ''}" data-id="${esc(d.id)}">
    <b>${esc(d.title.replace('-', ' <-> '))}</b><small>${esc(d.desc)}, ${d.count.toLocaleString()} entries</small></button>`).join('');
  $('#pairSheet').classList.add('show');
}
$('#pairbar').onclick = $('#pairBadge').onclick = $('#drawerPair').onclick = () => { closeDrawer(); openPairs(); };
$('#pairSheet').addEventListener('click', e => {
  const opt = e.target.closest('.pair-opt');
  if (opt) {
    settings.set('dict', opt.dataset.id);
    updatePair();
    if (q.value.trim()) { show('suggest'); views.suggest($('#v-suggest'), q.value); }
    else if (current.view === 'home') views.home($('#v-home'));
    else location.hash = '#/';
  }
  $('#pairSheet').classList.remove('show');
});

// ---------------------------------------------------------------- drawer
function openDrawer() { $('#drawer').classList.add('open'); $('#scrim').classList.add('show'); }
function closeDrawer() { $('#drawer').classList.remove('open'); $('#scrim').classList.remove('show'); }
$('#menuBtn').onclick = openDrawer;
$('#scrim').onclick = closeDrawer;
$('#backBtn').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/');
$('#keepScreen').addEventListener('change', e => { settings.set('keepScreen', e.target.checked); keepAwake(); });
$('#topAction').onclick = () => {
  if (current.view === 'cards' && cards.list().length && confirm('Remove all words from your Word card?')) { cards.clear(); views.cards($('#v-cards')); }
  if (current.view === 'history' && recent.list().length && confirm('Clear all search history?')) { recent.clear(); views.history($('#v-history')); }
};

// ---------------------------------------------------------------- clicks inside views
document.addEventListener('click', async e => {
  const t = e.target;
  const link = t.closest('[data-route]');
  if (link) { e.preventDefault(); location.hash = link.dataset.route; closeDrawer(); return; }

  const spk = t.closest('.spk');
  if (spk) {
    e.preventDefault(); e.stopPropagation();
    const owner = spk.closest('.entry-head') ? current.entry : (speechCache.get(spk.closest('.row, .wotd-body')) || null);
    const recs = spk.closest('.ex, .sx') ? null : owner?.au;
    speech.play(spk.dataset.say, spk.dataset.lang, spk.dataset.region ?? settings.get('accent'), recs, spk);
    return;
  }

  const look = t.closest('[data-lookup]');
  if (look) { e.preventDefault(); lookup(look.dataset.lookup); return; }

  const tw = t.closest('.tw');
  if (tw) { peek(tw.textContent, tw.dataset.l); return; }

  if (t.closest('#markBtn')) {
    const { dict, key, entry } = current;
    const on = cards.toggle({ d: dict, k: key, w: entry.w, g: glossOf(entry), ph: firstPron(entry) });
    const b = $('#markBtn');
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    toast(on ? 'Saved to Word card' : 'Removed from Word card');
    return;
  }
  if (t.closest('#moreBtn')) { moreMenu(); return; }

  const act = t.closest('.row-act');
  if (act) {
    const row = act.closest('.row');
    const { d, k } = row.dataset;
    if (act.dataset.act === 'delete') {
      if (current.view === 'history') recent.remove(d, k); else cards.remove(d, k);
      row.remove();
      if (current.view === 'cards') views.cards($('#v-cards'));
      toast('Deleted');
    } else {
      const entry = await data.entry(d, k).catch(() => null);
      cards.add({ d, k, w: entry?.w || $('.row-w', row).textContent, g: entry ? glossOf(entry) : $('.row-g', row).textContent, ph: firstPron(entry) });
      act.querySelector('span').textContent = 'Saved';
      toast('Saved to Word card');
      closeSwipes();
    }
    return;
  }
});

$('#v-word').addEventListener('change', e => {
  if (e.target.id === 'exToggle') { settings.set('examples', e.target.checked); $('.entry').classList.toggle('no-ex', !e.target.checked); }
});

async function lookup(word) {
  const dictId = settings.get('dict');
  const rows = await search.suggest(dictId, word, 1).catch(() => []);
  if (rows.length && rows[0][0] === norm(word)) location.hash = `#/w/${encodeURIComponent(dictId)}/${encodeURIComponent(rows[0][0])}`;
  else { q.value = word; syncClear(); show('suggest'); views.suggest($('#v-suggest'), word); }
}

function moreMenu() {
  const { entry } = current;
  const url = location.href;
  const sheet = $('#peek');
  sheet.innerHTML = `<div class="peek-card menu">
    <button data-m="copy">${icon('copy')}Copy word</button>
    ${navigator.share ? `<button data-m="share">${icon('share')}Share</button>` : ''}
    <button data-m="close" class="muted">Cancel</button></div>`;
  sheet.classList.add('show');
  sheet.onclick = async e => {
    const m = e.target.closest('button')?.dataset.m;
    if (m === 'copy') { await navigator.clipboard?.writeText(entry.w).catch(() => {}); toast('Copied'); }
    if (m === 'share') navigator.share({ title: entry.w, text: `${entry.w}: ${glossOf(entry)}`, url }).catch(() => {});
    if (m || e.target === sheet) closePeek();
  };
}

// Quick lookup for a tapped word inside an example sentence.
async function peek(word, lang) {
  const dictId = lang === 'th' ? 'en-th' : settings.get('dict');
  const cands = [word];
  if (lang !== 'th') {
    const w = word.toLowerCase();
    cands.push(w, w.replace(/'s$/, ''), w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ed$/, ''), w.replace(/d$/, ''),
      w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/ies$/, 'y'), w.replace(/ied$/, 'y'), w.replace(/(.)\1ed$/, '$1'), w.replace(/(.)\1ing$/, '$1'));
  }
  let entry = null, key = null;
  for (const c of [...new Set(cands)]) {
    if (!c) continue;
    entry = await data.entry(dictId, norm(c)).catch(() => null);
    if (entry) { key = norm(c); break; }
  }
  const sheet = $('#peek');
  sheet.innerHTML = `<div class="peek-card">
    <button class="icon-btn peek-x" aria-label="Close">${icon('x')}</button>
    ${entry ? `<div class="peek-w${entry.l === 'th' ? ' th' : ''}">${esc(entry.w)} <button class="spk" data-say="${esc(entry.w)}" data-lang="${entry.l}" aria-label="Listen">${icon('speak')}</button></div>
      ${firstPron(entry) ? `<div class="ipa">[${esc(firstPron(entry).replace(/^\/|\/$/g, ''))}]</div>` : ''}
      <div class="peek-g${isThai(glossOf(entry)) ? ' th' : ''}">${esc(glossOf(entry))}</div>
      <a class="peek-open" href="#/w/${encodeURIComponent(dictId)}/${encodeURIComponent(key)}">Open ${icon('chev')}</a>`
      : `<div class="peek-w">${esc(word)}</div><div class="peek-g">No entry found.</div>`}
  </div>`;
  sheet.classList.add('show');
  sheet.onclick = e => { if (e.target === sheet || e.target.closest('.peek-x') || e.target.closest('.peek-open')) closePeek(); };
}
function closePeek() { $('#peek').classList.remove('show'); }

// ---------------------------------------------------------------- swipe rows
let swipe = null;
function closeSwipes(except) { $$('.row.swiped').forEach(r => { if (r !== except) r.classList.remove('swiped'); }); }
document.addEventListener('pointerdown', e => {
  const row = e.target.closest('.row.swipe');
  if (!row || e.target.closest('.row-act, .spk')) { if (!e.target.closest('.row-act')) closeSwipes(); return; }
  swipe = { row, x: e.clientX, y: e.clientY, dx: 0, moving: false, main: $('.row-main', row) };
});
document.addEventListener('pointermove', e => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  if (!swipe.moving && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) { swipe.moving = true; closeSwipes(swipe.row); swipe.row.classList.add('swiping'); }
  if (!swipe.moving) return;
  const base = swipe.row.classList.contains('swiped') ? -88 : 0;
  swipe.dx = Math.max(-120, Math.min(0, base + dx));
  swipe.main.style.transition = 'none';
  swipe.main.style.transform = `translateX(${swipe.dx}px)`;
});
document.addEventListener('pointerup', () => {
  if (!swipe) return;
  if (swipe.moving) {
    swipe.main.style.transition = ''; swipe.main.style.transform = '';
    swipe.row.classList.toggle('swiped', swipe.dx < -44);
    const row = swipe.row;
    setTimeout(() => row.classList.remove('swiping'), 250);
    // Swallow the click that follows a swipe.
    const stop = ev => { ev.preventDefault(); ev.stopPropagation(); };
    swipe.main.addEventListener('click', stop, { capture: true, once: true });
    setTimeout(() => swipe?.main?.removeEventListener('click', stop, { capture: true }), 50);
  }
  swipe = null;
});
document.addEventListener('pointercancel', () => { if (swipe) { swipe.main.style.transform = ''; swipe = null; } });

// Keyboard: "/" focuses search.
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
  if (e.key === 'Escape') { closeDrawer(); closePeek(); $('#pairSheet').classList.remove('show'); }
});

// ---------------------------------------------------------------- start
async function start() {
  applySettings();
  $('#keepScreen').checked = settings.get('keepScreen');
  keepAwake();
  updateCounts();
  try { await data.init(); }
  catch {
    $('#v-home').innerHTML = '<p class="empty">Could not load the dictionaries. Connect to the internet once to set up the app.</p>';
    show('home');
    return;
  }
  if (!data.dicts.some(d => d.id === settings.get('dict'))) settings.set('dict', data.dicts[0].id);
  updatePair();
  addEventListener('hashchange', route);
  route();
}
start();

// Offline support. Reload once when a new version takes over so the page matches the cache.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
}
