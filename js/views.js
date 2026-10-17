// Screens other than the word page: home, suggestions, word card, history,
// flashcards, settings, offline dictionaries and sources.

function rowHtml({ d, k, w, g, ph }, opts = {}) {
  const action = opts.action || 'save';
  const actIcon = action === 'delete' ? 'trash' : 'mark';
  const actLabel = action === 'delete' ? 'Delete' : (cards.has(d, k) ? 'Saved' : 'Save');
  const head = opts.prefix ? highlightPrefix(w, opts.prefix) : esc(w);
  return `<li class="row swipe" data-d="${esc(d)}" data-k="${esc(k)}">
    <button class="row-act ${action}" data-act="${action}" aria-label="${actLabel}">${icon(actIcon)}<span>${actLabel}</span></button>
    <a class="row-main" href="#/w/${encodeURIComponent(d)}/${encodeURIComponent(k)}">
      <span class="row-w${isThai(w) ? ' th' : ''}">${head}${ph ? ` <span class="row-ph">[${esc(ph.replace(/^\/|\/$/g, ''))}]</span>` : ''}</span>
      <span class="row-g${isThai(g || '') ? ' th' : ''}">${esc(g || '')}</span>
    </a>
    ${opts.speak ? `<button class="spk sm row-spk" data-say="${esc(w)}" data-lang="${isThai(w) ? 'th' : 'en'}" aria-label="Listen">${icon('speak')}</button>` : ''}
  </li>`;
}

function highlightPrefix(w, q) {
  const nq = norm(q);
  // Match on the normalised form but keep the original characters.
  let i = 0, j = 0;
  const nw = w;
  while (i < nw.length && j < nq.length) {
    const c = norm(nw[i]);
    if (c === nq.slice(j, j + c.length)) { j += c.length || 1; i++; } else break;
  }
  if (j < nq.length) return esc(w);
  return `<mark>${esc(w.slice(0, i))}</mark>${esc(w.slice(i))}`;
}

function firstPron(entry) {
  if (!entry?.ph?.length) return '';
  const pref = settings.get('accent').toUpperCase();
  return (entry.ph.find(p => p[0] === pref) || entry.ph[0])[1];
}

const views = {
  // ---------------------------------------------------------------- home
  async home(el) {
    const dictId = settings.get('dict');
    const d = data.dict(dictId);
    const hist = recent.list().slice(0, 6);
    const saved = cards.list().slice(0, 5);
    const status = await data.offlineStatus(dictId).catch(() => ({ have: 0, total: 1 }));
    const offline = status.have >= status.total;
    el.innerHTML = `
      <div class="home">
        <div class="card wotd" id="wotd"><div class="wotd-label">Word of the day <span>${esc(new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}</span></div><div class="wotd-body"><div class="skeleton"></div></div></div>
        ${offline ? '' : `<a class="card offline-tip" href="#/offline">${icon('cloud')}<div><b>Use ${esc(d.title)} offline</b><small>Download the whole dictionary (${fmtBytes(d.bytes)}). Until then, words you look up are saved as you go.</small></div>${icon('chev', 'chev')}</a>`}
        <div class="list-head">${icon('clock')}Recent<a href="#/history">See all</a></div>
        ${hist.length ? `<ul class="rows">${hist.map(h => rowHtml(h, { action: 'save' })).join('')}</ul>` : '<p class="empty">Words you look up will appear here.</p>'}
        <div class="list-head">${icon('mark')}Word card<a href="#/cards">${cards.list().length} word${cards.list().length === 1 ? '' : 's'}</a></div>
        ${saved.length ? `<ul class="rows">${saved.map(h => rowHtml(h, { action: 'delete', speak: true })).join('')}</ul>` : '<p class="empty">Tap the bookmark on a word to save it here.</p>'}
      </div>`;
    this.wotd($('#wotd .wotd-body', el), dictId);
  },

  async wotd(box, dictId) {
    try {
      const pool = data.meta[dictId].wotd;
      if (!pool?.length) { box.closest('.card').remove(); return; }
      const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
      const key = pool[(day * 7919) % pool.length];
      const e = await data.entry(dictId, key);
      if (!e) throw new Error('missing');
      const ex = e.ex?.[0] || (() => { for (const b of e.b) for (const p of b.p) for (const s of p.s) if (s.ex?.length) return Array.isArray(s.ex[0]) ? s.ex[0] : [s.ex[0]]; })();
      box.innerHTML = `<a class="wotd-word" href="#/w/${dictId}/${encodeURIComponent(key)}">${esc(e.w)}</a>
        <div class="prons">${firstPron(e) ? `<span class="ipa">[${esc(firstPron(e).replace(/^\/|\/$/g, ''))}]</span>` : ''}<button class="spk" data-say="${esc(e.w)}" data-lang="en" data-region="${settings.get('accent')}" aria-label="Listen">${icon('speak')}</button></div>
        <div class="wotd-gloss${isThai(glossOf(e)) ? ' th' : ''}">${esc(glossOf(e))}</div>
        ${ex ? `<div class="wotd-ex">${esc(ex[0])}${ex[1] ? `<span>${esc(ex[1])}</span>` : ''}</div>` : ''}`;
      speechCache.set(box, e);
    } catch {
      box.innerHTML = '<p class="empty">Connect once to load today\'s word.</p>';
    }
  },

  // ---------------------------------------------------------------- suggestions
  suggestToken: 0,
  async suggest(el, q) {
    const token = ++this.suggestToken;
    const dictId = settings.get('dict');
    let rows;
    try { rows = await search.suggest(dictId, q); }
    catch { if (token === this.suggestToken) el.innerHTML = '<p class="empty">This part of the dictionary is not downloaded yet. Connect to the internet or download it in Offline dictionaries.</p>'; return; }
    if (token !== this.suggestToken) return;
    if (!rows.length) {
      const alt = await search.didYouMean(dictId, q).catch(() => []);
      if (token !== this.suggestToken) return;
      el.innerHTML = `<p class="empty">No results for "<b>${esc(q)}</b>".</p>${alt.length ? `<div class="list-head">Did you mean</div><ul class="rows">${alt.map(r => rowHtml({ d: dictId, k: r[0], w: r[1], g: r[2] })).join('')}</ul>` : ''}`;
      return;
    }
    const nq = norm(q);
    el.innerHTML = `<ul class="rows suggest">${rows.map(r => rowHtml({ d: dictId, k: r[0], w: r[1], g: r[2] }, { prefix: q })).join('')}</ul>`;
    // The exact match gets the big first row with pronunciation, as in the original app.
    if (rows[0][0] === nq) {
      const li = $('.row', el);
      li.classList.add('exact');
      data.entry(dictId, rows[0][0]).then(e => {
        if (!e || token !== this.suggestToken) return;
        const ph = firstPron(e);
        const w = $('.row-w', li);
        if (ph) w.insertAdjacentHTML('beforeend', ` <span class="row-ph">[${esc(ph.replace(/^\/|\/$/g, ''))}]</span>`);
        li.insertAdjacentHTML('beforeend', `<button class="spk sm row-spk" data-say="${esc(e.w)}" data-lang="${e.l}" data-region="${e.l === 'th' ? 'th' : settings.get('accent')}" aria-label="Listen">${icon('speak')}</button>`);
        speechCache.set(li, e);
      }).catch(() => {});
    }
  },

  // ---------------------------------------------------------------- word card
  cards(el) {
    const list = cards.list();
    el.innerHTML = `<div class="strip">${list.length} word${list.length === 1 ? '' : 's'}${list.length ? '<a href="#/study">Flashcards</a>' : ''}</div>
      ${list.length ? `<ul class="rows big">${list.map(c => rowHtml(c, { action: 'delete', speak: true })).join('')}</ul>`
        : '<p class="empty">No saved words yet. Tap the bookmark on a word page, or swipe a search result to the left.</p>'}`;
  },

  history(el) {
    const list = recent.list();
    const groups = {};
    for (const h of list) {
      const day = new Date(h.t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      (groups[day] ||= []).push(h);
    }
    el.innerHTML = list.length ? Object.entries(groups).map(([day, items]) =>
      `<div class="strip">${esc(day)}</div><ul class="rows">${items.map(h => rowHtml(h, { action: 'delete' })).join('')}</ul>`).join('')
      : '<p class="empty">No history yet.</p>';
  },

  // ---------------------------------------------------------------- flashcards
  study(el) {
    const list = cards.list();
    if (!list.length) { el.innerHTML = '<p class="empty">Save some words to your Word card first, then come back to practise them.</p>'; return; }
    const order = list.map((_, i) => i).sort(() => Math.random() - 0.5);
    let pos = 0, known = 0;
    const show = () => {
      if (pos >= order.length) {
        el.innerHTML = `<div class="study-done"><div class="big">${known} / ${order.length}</div><p>words you knew</p><button class="btn" id="again">Go again</button></div>`;
        $('#again', el).onclick = () => views.study(el);
        return;
      }
      const c = list[order[pos]];
      el.innerHTML = `<div class="study">
        <div class="study-count">${pos + 1} / ${order.length}</div>
        <button class="flash" id="flash" aria-label="Flip card"><div class="flash-w${isThai(c.w) ? ' th' : ''}">${esc(c.w)}</div>${c.ph ? `<div class="ipa">[${esc(c.ph.replace(/^\/|\/$/g, ''))}]</div>` : ''}
          <div class="flash-g${isThai(c.g || '') ? ' th' : ''}">${esc(c.g || '')}</div><div class="flash-hint">Tap to show the meaning</div></button>
        <div class="study-btns"><button class="btn ghost" id="no">Still learning</button><button class="btn" id="yes">I knew it</button></div>
        <a class="study-open" href="#/w/${encodeURIComponent(c.d)}/${encodeURIComponent(c.k)}">Open word</a></div>`;
      $('#flash', el).onclick = e => { e.currentTarget.classList.add('flipped'); speech.say(c.w, isThai(c.w) ? 'th' : 'en', settings.get('accent')); };
      $('#no', el).onclick = () => { pos++; show(); };
      $('#yes', el).onclick = () => { pos++; known++; show(); };
    };
    show();
  },

  // ---------------------------------------------------------------- settings
  settings(el) {
    const seg = (name, opts) => `<div class="seg" data-setting="${name}">${opts.map(([v, l]) =>
      `<button data-v="${v}" class="${settings.get(name) === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    el.innerHTML = `<div class="settings">
      <div class="set-group"><div class="set-title">Appearance</div>
        <div class="set-row"><span>Theme</span>${seg('theme', [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']])}</div>
        <div class="set-row"><span>Text size</span>${seg('textSize', [['s', 'S'], ['m', 'M'], ['l', 'L']])}</div></div>
      <div class="set-group"><div class="set-title">Dictionary</div>
        <div class="set-row"><span>Pronunciation</span>${seg('accent', [['us', 'US'], ['uk', 'UK']])}</div>
        <label class="set-row"><span>Show examples under definitions</span><span class="switch"><input type="checkbox" data-toggle="examples" ${settings.get('examples') ? 'checked' : ''}><i></i></span></label>
        <label class="set-row"><span>Keep screen on</span><span class="switch"><input type="checkbox" data-toggle="keepScreen" ${settings.get('keepScreen') ? 'checked' : ''}><i></i></span></label>
        <a class="set-row link" href="#/offline"><span>Offline dictionaries</span>${icon('chev', 'chev')}</a></div>
      <div class="set-group"><div class="set-title">Your data</div>
        <p class="set-note">Your Word card and history are stored only on this device.</p>
        <button class="set-row danger" id="clearHistory">Clear search history</button>
        <button class="set-row danger" id="clearCards">Clear Word card</button>
        <button class="set-row" id="exportCards">Export Word card</button></div>
      <div class="set-group"><div class="set-title">About</div>
        <a class="set-row link" href="#/sources"><span>Sources and licences</span>${icon('chev', 'chev')}</a>
        <div class="set-row"><span>Version</span><span class="muted">${APP_VERSION} (data ${esc(data.dicts.map(d => d.build.slice(0, 6)).join(', '))})</span></div></div>
    </div>`;
    $$('.seg', el).forEach(s => s.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      settings.set(s.dataset.setting, b.dataset.v);
      $$('button', s).forEach(x => x.classList.toggle('on', x === b));
    }));
    $$('[data-toggle]', el).forEach(c => c.addEventListener('change', () => { settings.set(c.dataset.toggle, c.checked); if (c.dataset.toggle === 'keepScreen') { $('#keepScreen').checked = c.checked; keepAwake(); } }));
    $('#clearHistory', el).onclick = () => { if (confirm('Clear all search history?')) { recent.clear(); toast('History cleared'); } };
    $('#clearCards', el).onclick = () => { if (confirm('Remove all words from your Word card?')) { cards.clear(); toast('Word card cleared'); } };
    $('#exportCards', el).onclick = () => {
      const text = cards.list().map(c => `${c.w}\t${c.ph || ''}\t${c.g || ''}`).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/tab-separated-values' }));
      a.download = 'word-card.tsv';
      a.click();
    };
  },

  // ---------------------------------------------------------------- offline
  async offline(el) {
    const est = await navigator.storage?.estimate?.().catch(() => null);
    el.innerHTML = `<div class="settings">
      <p class="set-note">Download a dictionary to search it with no connection. Words you look up online are also kept, so recent lookups work offline anyway.</p>
      ${data.dicts.map(d => `<div class="set-group dl" data-id="${esc(d.id)}">
        <div class="dl-head"><b>${esc(d.title)}</b><span class="muted">${d.count.toLocaleString()} entries, ${fmtBytes(d.bytes)}</span></div>
        <div class="dl-desc">${esc(d.desc)}</div>
        <div class="bar"><i style="width:0"></i></div>
        <div class="dl-row"><span class="dl-status muted">Checking...</span><span><button class="btn sm ghost dl-remove hidden">Remove</button><button class="btn sm dl-get">Download</button></span></div>
      </div>`).join('')}
      ${est ? `<p class="set-note">Storage used by this app: ${fmtBytes(est.usage || 0)}${est.quota ? ` of ${fmtBytes(est.quota)} available` : ''}.</p>` : ''}
    </div>`;
    for (const box of $$('.dl', el)) {
      const id = box.dataset.id;
      const bar = $('.bar i', box), status = $('.dl-status', box), get = $('.dl-get', box), rm = $('.dl-remove', box);
      const refresh = async () => {
        const s = await data.offlineStatus(id);
        bar.style.width = (100 * s.have / s.total) + '%';
        const done = s.have >= s.total;
        status.textContent = done ? 'Available offline' : s.have ? `${Math.round(100 * s.have / s.total)}% saved` : 'Online only';
        get.classList.toggle('hidden', done);
        get.textContent = s.have ? 'Resume' : 'Download';
        rm.classList.toggle('hidden', !s.have);
      };
      refresh();
      let ctrl = null;
      get.onclick = async () => {
        if (ctrl) { ctrl.abort(); return; }
        ctrl = new AbortController();
        get.textContent = 'Stop';
        navigator.storage?.persist?.();
        try {
          await data.downloadAll(id, (n, t) => { bar.style.width = (100 * n / t) + '%'; status.textContent = `Downloading ${Math.round(100 * n / t)}%`; }, ctrl.signal);
          toast(`${data.dict(id).title} is ready offline`);
        } catch (e) {
          if (e.name !== 'AbortError') toast('Download stopped: check your connection');
        }
        ctrl = null;
        refresh();
      };
      rm.onclick = async () => { await data.removeOffline(id); data.memo.clear(); refresh(); toast('Removed'); };
    }
  },

  // ---------------------------------------------------------------- sources
  async sources(el) {
    el.innerHTML = '<div class="settings"><p class="empty">Loading...</p></div>';
    const res = await fetch('sources.html').catch(() => null);
    el.innerHTML = `<div class="settings prose">${res?.ok ? await res.text() : '<p>Open this page once while online to load the full list of sources.</p>'}</div>`;
  },
};

// Remembers which entry a speaker button belongs to (for recorded audio).
const speechCache = new WeakMap();
