// Online-only parts of the word page: picture, recording credits, related words
// and rhymes, extra pronunciations, and more Tatoeba examples. Each part fills a
// placeholder after the page is shown and quietly disappears when offline or on error.

const extras = {
  token: 0,

  // Placeholders rendered with the page (see renderWord).
  slots(entry) {
    const english = entry.l === 'en';
    const noun = english && (entry.wd || entry.b?.[0]?.p?.[0]?.pos === 'noun');
    return {
      picture: noun && settings.get('pictures') ? '<figure class="pic hidden" id="xPic"></figure>' : '',
      web: english && settings.get('webExtras') ? '<div class="sec web hidden" id="xWeb"></div>' : '',
    };
  },

  attach(root, dictId, entry) {
    const token = ++this.token;
    const alive = () => token === this.token && document.body.contains(root);
    this.audioCredits(root, entry, alive);
    if (!navigator.onLine) {
      const web = $('#xWeb', root);
      if (web) { web.classList.remove('hidden'); web.innerHTML = '<h3>More from the web</h3><p class="muted small">Related words, rhymes and pictures appear here when you are online.</p>'; }
      return;
    }
    this.picture(root, entry, alive);
    this.web(root, entry, alive);
  },

  async picture(root, entry, alive) {
    const box = $('#xPic', root);
    if (!box) return;
    const pic = await online.picture(entry).catch(() => null);
    if (!pic || !alive()) return;
    box.innerHTML = `<a href="${esc(pic.page)}" target="_blank" rel="noopener"><img src="${esc(pic.thumb)}" alt="${esc(entry.w)}" decoding="async"></a>
      <figcaption>Picture: <a href="${esc(pic.page)}" target="_blank" rel="noopener">${esc(pic.author)}</a>, ${pic.licenseUrl
        ? `<a href="${esc(pic.licenseUrl)}" target="_blank" rel="noopener">${esc(pic.license)}</a>` : esc(pic.license)}, via ${pic.via?.url
        ? `<a href="${esc(pic.via.url)}" target="_blank" rel="noopener">${esc(pic.via.label)}</a>` : 'Wikimedia Commons'}</figcaption>`;
    const img = $('img', box);
    img.onload = () => box.classList.remove('hidden');
    img.onerror = () => box.remove();
  },

  // Author and licence of each Commons recording on this page.
  async audioCredits(root, entry, alive) {
    const line = $('#xAudio', root);
    if (!line || !entry.au?.length) return;
    // Paths look like 'transcoded/a/a9/En-us-run.ogg/En-us-run.ogg.mp3' or 'a/a9/Name.mp3'.
    const fileOf = p => { const parts = p.split('/'); return decodeURIComponent(parts[0] === 'transcoded' ? parts[3] : parts[parts.length - 1]); };
    const files = entry.au.map(a => ({ region: a[0], file: fileOf(a[1]) }));
    const link = f => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.file)}`;
    line.innerHTML = 'Recordings: ' + files.map(f => `<a href="${link(f)}" target="_blank" rel="noopener">${esc(f.region.toUpperCase() || 'audio')}</a>`).join(', ') + ' (Wikimedia Commons)';
    if (!navigator.onLine) return;
    const infos = await Promise.all(files.map(f => online.commonsFile(f.file).catch(() => null)));
    if (!alive()) return;
    line.innerHTML = 'Recordings: ' + files.map((f, i) => {
      const inf = infos[i];
      const who = inf ? `${esc(inf.author)}, ${esc(inf.license)}` : 'Wikimedia Commons';
      return `<a href="${inf?.page || link(f)}" target="_blank" rel="noopener">${esc(f.region.toUpperCase() || 'audio')}: ${who}</a>`;
    }).join('; ');
  },

  async web(root, entry, alive) {
    const box = $('#xWeb', root);
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML = '<h3>More from the web</h3><div class="loading sm"><div class="spinner"></div></div>';
    const [dm, fd] = await Promise.all([online.datamuse(entry.w).catch(() => null), online.freeDictionary(entry.w).catch(() => null)]);
    if (!alive()) return;
    const known = new Set([entry.w.toLowerCase(), ...(entry.syn || []).map(s => s.toLowerCase())]);
    for (const b of entry.b || []) for (const p of b.p) for (const s of p.s) (s.syn || []).forEach(x => known.add(x.toLowerCase()));
    const chips = (list, cls = '') => list.map(w => `<a class="chip ${cls}" data-lookup="${esc(w)}">${esc(w)}</a>`).join('');
    let html = '<h3>More from the web</h3>';
    const extraSyn = (fd?.synonyms || []).filter(w => !known.has(w.toLowerCase()));
    const extraAnt = (fd?.antonyms || []).filter(w => !(entry.ant || []).includes(w));
    if (fd?.phonetics?.length) {
      html += `<div class="web-row"><div class="web-label">Pronunciation</div><div class="prons">${fd.phonetics.map(p =>
        `<span class="pron">${p.region ? `<b>${esc(p.region)}</b>` : ''}${p.text ? `<span class="ipa">${esc(p.text)}</span>` : ''}${p.audio
          ? `<button class="spk web-audio" data-src="${esc(p.audio)}" data-say="${esc(entry.w)}" aria-label="Listen">${icon('speak')}</button>` : ''}</span>`).join('')}</div></div>`;
    }
    if (extraSyn.length) html += `<div class="web-row"><div class="web-label">Synonyms</div><div class="chips">${chips(extraSyn)}</div></div>`;
    if (extraAnt.length) html += `<div class="web-row"><div class="web-label">Antonyms</div><div class="chips">${chips(extraAnt, 'ant')}</div></div>`;
    if (dm?.associated?.length) html += `<div class="web-row"><div class="web-label">Associated words</div><div class="chips">${chips(dm.associated)}</div></div>`;
    if (dm?.similar?.length) html += `<div class="web-row"><div class="web-label">Similar meaning</div><div class="chips">${chips(dm.similar)}</div></div>`;
    if (dm?.rhymes?.length) html += `<div class="web-row"><div class="web-label">Rhymes</div><div class="chips">${chips(dm.rhymes)}</div></div>`;
    if (dm?.sounds?.length) html += `<div class="web-row"><div class="web-label">Sounds like</div><div class="chips">${chips(dm.sounds)}</div></div>`;
    const used = [dm && (dm.associated.length || dm.similar.length || dm.rhymes.length || dm.sounds.length) && '<a href="https://www.datamuse.com/api/" target="_blank" rel="noopener">Datamuse</a>',
      fd && (fd.phonetics.length || extraSyn.length || extraAnt.length) && '<a href="https://dictionaryapi.dev/" target="_blank" rel="noopener">Free Dictionary API</a>'].filter(Boolean);
    if (!used.length) { box.remove(); return; }
    box.innerHTML = html + `<p class="srcline in">From ${used.join(' and ')}, online only.</p>`;
  },

  // "More from Tatoeba" on the usage examples screen.
  async tatoebaMore(list, button, entry, dictId) {
    button.disabled = true;
    button.textContent = 'Loading...';
    try {
      const { rows, next } = await online.tatoeba(entry.w, dictId === 'en-th', button.dataset.next || null);
      const have = new Set($$('.ex-a', list).map(e => e.textContent.trim()));
      const fresh = rows.filter(r => !have.has(r.text.trim()));
      list.insertAdjacentHTML('beforeend', fresh.map(r => exampleRow(
        [r.text, r.trans, 'tat', r.audio ? [r.audio.id, r.audio.author, r.audio.license] : undefined], entry)).join(''));
      if (next) { button.dataset.next = next; button.disabled = false; button.textContent = 'More from Tatoeba'; }
      else button.replaceWith(Object.assign(document.createElement('p'), { className: 'empty', textContent: fresh.length ? 'No more sentences.' : 'No more sentences on Tatoeba.' }));
    } catch {
      button.disabled = false;
      button.textContent = navigator.onLine ? 'Could not reach Tatoeba. Try again' : 'Connect to load more from Tatoeba';
    }
  },
};
