// Dictionary data access. Each dictionary is a folder of small gzip chunks:
//   data/<id>/<build>/meta.json    chunk boundaries, counts, sizes
//   data/<id>/<build>/top.json.gz  most frequent words for 1-2 letter prefixes
//   data/<id>/<build>/i/N.json.gz  index chunk: [key, headword, short gloss, rank]
//   data/<id>/<build>/e/N.json.gz  entry chunk: {key: entry}
// Chunks are fetched on demand and kept by the service worker, or all at once
// with downloadAll() for full offline use.

const DATA_CACHE = 'dict-data';

const data = {
  dicts: [],          // from data/dicts.json
  meta: {},           // id -> meta.json
  memo: new Map(),    // url -> Promise of parsed JSON

  async init() {
    const res = await fetch('data/dicts.json', { cache: 'no-cache' }).catch(() => null)
      || await caches.match('data/dicts.json');
    this.dicts = (await res.json()).dicts;
    await Promise.all(this.dicts.map(async d => { this.meta[d.id] = await this.json(this.base(d.id) + 'meta.json'); }));
    this.cleanOldBuilds();
    return this.dicts;
  },

  dict(id) { return this.dicts.find(d => d.id === id) || this.dicts[0]; },
  base(id) { const d = this.dict(id); return `data/${d.id}/${d.build}/`; },

  // Fetch JSON, transparently inflating .gz files. Responses for data files are
  // cached by the service worker; memo avoids parsing the same chunk twice.
  json(url) {
    if (this.memo.has(url)) return this.memo.get(url);
    const p = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      if (!url.endsWith('.gz')) return res.json();
      const stream = res.body.pipeThrough(new DecompressionStream('gzip'));
      return JSON.parse(await new Response(stream).text());
    })();
    p.catch(() => this.memo.delete(url));
    this.memo.set(url, p);
    if (this.memo.size > 120) this.memo.delete(this.memo.keys().next().value);
    return p;
  },

  // Index of the chunk holding `key`: last chunk whose first key <= key.
  chunkFor(id, key) {
    const firsts = this.meta[id].chunks;
    let lo = 0, hi = firsts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (firsts[mid] <= key) lo = mid; else hi = mid - 1;
    }
    return lo;
  },

  index(id, n) { return this.json(`${this.base(id)}i/${n}.json.gz`); },
  top(id) { return this.json(`${this.base(id)}top.json.gz`); },

  async entry(id, key) {
    const n = this.chunkFor(id, key);
    const chunk = await this.json(`${this.base(id)}e/${n}.json.gz`);
    return chunk[key] || null;
  },

  // Every file of a dictionary, for the offline download.
  files(id) {
    const base = this.base(id), m = this.meta[id];
    const out = [base + 'meta.json', base + 'top.json.gz'];
    for (let i = 0; i < m.chunks.length; i++) out.push(`${base}i/${i}.json.gz`, `${base}e/${i}.json.gz`);
    return out;
  },

  async offlineStatus(id) {
    const cache = await caches.open(DATA_CACHE);
    const files = this.files(id);
    let have = 0;
    for (const f of files) if (await cache.match(new URL(f, location.href).href)) have++;
    return { have, total: files.length };
  },

  async downloadAll(id, onProgress, signal) {
    const cache = await caches.open(DATA_CACHE);
    const files = this.files(id);
    let done = 0;
    const queue = [...files];
    const worker = async () => {
      while (queue.length) {
        if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
        const url = new URL(queue.shift(), location.href).href;
        if (!(await cache.match(url))) {
          const res = await fetch(url, { signal });
          if (!res.ok) throw new Error(`${res.status} ${url}`);
          await cache.put(url, res);
        }
        onProgress?.(++done, files.length);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  },

  async removeOffline(id) {
    const cache = await caches.open(DATA_CACHE);
    const base = new URL(`data/${id}/`, location.href).href;
    for (const req of await cache.keys()) if (req.url.startsWith(base)) await cache.delete(req);
  },

  // Drop cached chunks from builds that are no longer current.
  async cleanOldBuilds() {
    try {
      const cache = await caches.open(DATA_CACHE);
      const current = this.dicts.map(d => new URL(this.base(d.id), location.href).href);
      for (const req of await cache.keys()) {
        if (req.url.includes('/data/') && !req.url.endsWith('dicts.json') && !current.some(c => req.url.startsWith(c))) await cache.delete(req);
      }
    } catch {}
  },
};
