// Shared helpers: storage, settings, word card, history, toast.
const APP_VERSION = '2';

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('wn:' + key); return v == null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('wn:' + key, JSON.stringify(value)); } catch {}
  },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = '') => `<svg class="${cls}"><use href="#i-${name}"/></svg>`;

const DEFAULT_SETTINGS = { theme: 'system', dict: 'en-th', accent: 'us', examples: true, textSize: 'm', keepScreen: false, voiceEn: '', voiceTh: '' };
const settings = {
  all: { ...DEFAULT_SETTINGS, ...store.get('settings', {}) },
  get(k) { return this.all[k]; },
  set(k, v) { this.all[k] = v; store.set('settings', this.all); applySettings(); },
};

function applySettings() {
  const t = settings.get('theme');
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.text = settings.get('textSize');
  $('meta[name=theme-color]').content = dark ? '#16241c' : '#1fae5b';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applySettings);

// Word card (saved words). Items: {d: dict id, k: key, w: headword, g: gloss, ph: pronunciation, t: saved time}
const cards = {
  list() { return store.get('cards', []); },
  has(d, k) { return this.list().some(c => c.d === d && c.k === k); },
  add(item) {
    const list = this.list().filter(c => !(c.d === item.d && c.k === item.k));
    list.unshift({ ...item, t: Date.now() });
    store.set('cards', list);
    updateCounts();
  },
  remove(d, k) { store.set('cards', this.list().filter(c => !(c.d === d && c.k === k))); updateCounts(); },
  clear() { store.set('cards', []); updateCounts(); },
  toggle(item) {
    if (this.has(item.d, item.k)) { this.remove(item.d, item.k); return false; }
    this.add(item); return true;
  },
};

// Search history, newest first, capped.
const recent = {
  list() { return store.get('history', []); },
  add(item) {
    const list = this.list().filter(h => !(h.d === item.d && h.k === item.k));
    list.unshift({ ...item, t: Date.now() });
    store.set('history', list.slice(0, 300));
  },
  remove(d, k) { store.set('history', this.list().filter(h => !(h.d === d && h.k === k))); },
  clear() { store.set('history', []); },
};

function updateCounts() {
  const n = cards.list().length;
  const el = $('#cardCount');
  if (el) el.textContent = n || '';
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}

// Keep the screen awake while reading, if the user asks for it.
let wakeLock = null;
async function keepAwake() {
  try {
    if (settings.get('keepScreen') && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
    } else if (!settings.get('keepScreen') && wakeLock) {
      await wakeLock.release(); wakeLock = null;
    }
  } catch {}
}
document.addEventListener('visibilitychange', keepAwake);

function fmtBytes(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB';
  if (n >= 1e3) return Math.round(n / 1e3) + ' KB';
  return n + ' B';
}

// Today's date as YYYY-MM-DD in local time.
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
