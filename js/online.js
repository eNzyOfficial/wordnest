// Extras fetched from free online services when there is a connection.
// Everything here is optional: failures and offline use just hide the section.
//   Datamuse          related words, rhymes, sounds-like   (api.datamuse.com)
//   Free Dictionary   phonetics, audio, synonyms           (api.dictionaryapi.dev)
//   Tatoeba           more example sentences with audio    (api.tatoeba.org)
//   Wikidata/Commons  noun pictures with credit            (wikidata.org, commons.wikimedia.org)
//   Wikipedia         picture fallback by article title    (en.wikipedia.org)

const online = {
  memo: new Map(),

  async json(url, timeout = 6000) {
    if (!navigator.onLine) throw new Error('offline');
    if (this.memo.has(url)) return this.memo.get(url);
    const p = (async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeout);
      try {
        // Bypass the service worker cache: these answers are online-only by design.
        // Wikimedia asks browser clients to identify themselves with Api-User-Agent.
        const headers = /wikipedia\.org|wikimedia\.org|wikidata\.org/.test(url)
          ? { 'Api-User-Agent': 'Wordnest/1.0 (https://enzyofficial.github.io/wordnest/)' } : undefined;
        const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store', credentials: 'omit', headers });
        if (!res.ok) throw new Error(res.status);
        return await res.json();
      } finally { clearTimeout(t); }
    })();
    p.catch(() => this.memo.delete(url));
    this.memo.set(url, p);
    return p;
  },

  // ---------------------------------------------------------------- Datamuse
  async datamuse(word) {
    const w = encodeURIComponent(word);
    const q = (rel, max) => this.json(`https://api.datamuse.com/words?${rel}=${w}&max=${max}`).catch(() => []);
    // 'ml' (means like) is too loose for a dictionary, so similar words are true synonyms only.
    const [syn, trg, rhymes, sounds] = await Promise.all([q('rel_syn', 10), q('rel_trg', 14), q('rel_rhy', 14), q('sl', 10)]);
    const base = word.toLowerCase();
    const seen = new Set([base, base + 's', base + 'es']);
    // Proper nouns and the word's own plural are dropped; each word appears in one list only.
    const take = (list, n) => {
      const out = [];
      for (const x of list) {
        const w = x.word;
        if (!w || seen.has(w.toLowerCase()) || (x.tags || []).includes('prop')) continue;
        seen.add(w.toLowerCase());
        out.push(w);
        if (out.length >= n) break;
      }
      return out;
    };
    return { similar: take(syn, 8), associated: take(trg, 10), rhymes: take(rhymes, 12), sounds: take(sounds, 8) };
  },

  // ---------------------------------------------------------------- Free Dictionary API
  async freeDictionary(word) {
    const data = await this.json(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, 5000);
    if (!Array.isArray(data)) return null;
    const phonetics = [], syn = new Set(), ant = new Set();
    for (const e of data) {
      for (const p of e.phonetics || []) {
        if (!p.text && !p.audio) continue;
        const region = /-uk\b|-uk\./.test(p.audio || '') ? 'UK' : /-us\b|-us\./.test(p.audio || '') ? 'US' : /-au\b|-au\./.test(p.audio || '') ? 'AU' : '';
        if (!phonetics.some(x => x.text === p.text && x.audio === p.audio)) phonetics.push({ text: p.text || '', audio: p.audio || '', region, source: p.sourceUrl || '' });
      }
      for (const m of e.meanings || []) {
        (m.synonyms || []).forEach(s => syn.add(s));
        (m.antonyms || []).forEach(s => ant.add(s));
        for (const d of m.definitions || []) { (d.synonyms || []).forEach(s => syn.add(s)); (d.antonyms || []).forEach(s => ant.add(s)); }
      }
    }
    return { phonetics: phonetics.slice(0, 4), synonyms: [...syn].slice(0, 12), antonyms: [...ant].slice(0, 8) };
  },

  // ---------------------------------------------------------------- Tatoeba
  // English sentences containing the word, with a Thai translation when asked, recordings first.
  async tatoeba(word, withThai, page = null) {
    const lang = isThai(word) ? 'tha' : 'eng';
    let url = page || `https://api.tatoeba.org/v1/sentences?lang=${lang}&q=${encodeURIComponent('=' + word)}&sort=relevance&limit=10&include=audios`
      + (withThai || lang === 'tha' ? `&trans:lang=${lang === 'tha' ? 'eng' : 'tha'}&showtrans=matching` : '');
    const res = await this.json(url, 8000);
    const rows = (res.data || []).map(s => {
      const tr = (s.translations || []).flat().find(t => t && t.text);
      const au = (s.audios || []).find(a => a.license);
      return {
        text: s.text, trans: tr?.text || '', id: s.id, owner: s.owner,
        audio: au ? { id: au.id, author: au.author, license: au.license } : null,
      };
    });
    return { rows, next: res.paging?.has_next ? res.paging.next : null };
  },

  // ---------------------------------------------------------------- pictures
  // A picture for a noun: the Wikidata item linked from Wiktionary when known,
  // otherwise the lead image of the Wikipedia article with the same title.
  // Only freely licensed images hosted on Wikimedia Commons are used.
  async picture(entry) {
    let file = null, via = null;
    if (entry.wd) {
      const r = await this.json(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entry.wd}&property=P18&format=json&origin=*`).catch(() => null);
      file = r?.claims?.P18?.[0]?.mainsnak?.datavalue?.value || null;
      if (file) via = { label: 'Wikidata', url: `https://www.wikidata.org/wiki/${entry.wd}` };
    }
    if (!file) {
      const s = await this.json(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(entry.w)}?redirect=true`).catch(() => null);
      if (!s || s.type !== 'standard' || !s.originalimage?.source) return null;
      const m = s.originalimage.source.match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/);
      if (!m) return null; // image hosted on Wikipedia itself, often non-free: skip
      file = decodeURIComponent(m[1]);
      via = { label: `Wikipedia: ${s.title}`, url: s.content_urls?.mobile?.page || s.content_urls?.desktop?.page };
    }
    const info = await this.commonsFile(file, 640);
    if (!info || !info.thumb || /non-?free|fair use/i.test(info.license)) return null;
    return { ...info, via };
  },

  // Author, licence and a thumbnail for a Commons file (images and audio).
  async commonsFile(file, width) {
    const title = 'File:' + file.replace(/^File:/, '');
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo`
      + `&iiprop=url|extmetadata${width ? `&iiurlwidth=${width}` : ''}&format=json&origin=*`;
    const r = await this.json(url).catch(() => null);
    const page = r && Object.values(r.query?.pages || {})[0];
    const ii = page?.imageinfo?.[0];
    if (!ii) return null;
    const md = ii.extmetadata || {};
    const text = v => (v?.value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return {
      file: title, thumb: ii.thumburl || ii.url, page: ii.descriptionurl,
      author: text(md.Artist).slice(0, 80) || 'Unknown author',
      license: text(md.LicenseShortName) || 'see file page', licenseUrl: md.LicenseUrl?.value || '',
    };
  },
};
