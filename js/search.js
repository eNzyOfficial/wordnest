// Prefix search with instant suggestions, plus a "did you mean" fallback.

// Must match norm() in build/common.py.
function norm(s) {
  s = s.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
  if (!/[฀-๿]/.test(s)) s = s.normalize('NFD').replace(/\p{Mn}/gu, '');
  return s;
}

const isThai = s => /[฀-๿]/.test(s);

const search = {
  // Returns up to `limit` rows of [key, headword, gloss, rank].
  async suggest(dictId, q, limit = 30) {
    const k = norm(q);
    if (!k) return [];
    const seen = new Set();
    const rows = [];
    const add = r => { if (r[0].startsWith(k) && !seen.has(r[0])) { seen.add(r[0]); rows.push(r); } };

    if (k.length <= 2) {
      const top = await data.top(dictId);
      (top[k] || []).forEach(add);
    }
    // Walk index chunks from the one holding k while keys still match the prefix.
    const total = data.meta[dictId].chunks.length;
    let n = data.chunkFor(dictId, k);
    for (let loaded = 0; n < total && loaded < 3; n++, loaded++) {
      // Only the first chunk is required; later ones may be missing offline.
      let chunk;
      try { chunk = await data.index(dictId, n); }
      catch (e) { if (loaded === 0) throw e; break; }
      let i = lowerBound(chunk, k);
      for (; i < chunk.length && chunk[i][0].startsWith(k); i++) add(chunk[i]);
      if (i < chunk.length) break;
    }
    const rank = r => r[3] || 1e9;
    rows.sort((a, b) => (b[0] === k) - (a[0] === k) || rank(a) - rank(b) || a[0].length - b[0].length || (a[0] < b[0] ? -1 : 1));
    return rows.slice(0, limit);
  },

  // Close spellings when nothing matches: edit distance over neighbouring chunks.
  async didYouMean(dictId, q, limit = 5) {
    const k = norm(q);
    if (k.length < 3) return [];
    const n = data.chunkFor(dictId, k);
    const total = data.meta[dictId].chunks.length;
    const pool = [];
    for (let i = Math.max(0, n - 1); i <= Math.min(total - 1, n + 1); i++) pool.push(...await data.index(dictId, i).catch(() => []));
    const top = await data.top(dictId);
    for (const list of Object.values(top)) pool.push(...list);
    const max = k.length <= 4 ? 1 : 2;
    const scored = [];
    const seen = new Set();
    for (const r of pool) {
      if (seen.has(r[0]) || Math.abs(r[0].length - k.length) > max) continue;
      seen.add(r[0]);
      const d = editDistance(k, r[0], max);
      if (d <= max) scored.push([d, r[3] || 1e9, r]);
    }
    scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return scored.slice(0, limit).map(s => s[2]);
  },
};

function lowerBound(rows, k) {
  let lo = 0, hi = rows.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (rows[mid][0] < k) lo = mid + 1; else hi = mid; }
  return lo;
}

function editDistance(a, b, max) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
