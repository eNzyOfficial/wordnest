// Pronunciation.
// Words: recorded Wiktionary audio from Wikimedia Commons when online.
// Example sentences: human recordings from Tatoeba when online and available.
// Otherwise the device voice, choosing the most natural one installed (or the
// one picked in Settings) instead of whatever the browser lists first.
const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons/';
const AUDIO_CACHE = 'dict-audio';

// Language of a piece of text from its script, for the device voice.
function detectLang(text, fallback = 'en') {
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
  if (/[\u3040-\u30FF]/.test(text)) return 'ja';
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return 'ko';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  return fallback;
}
const VOICE_LANG = { th: 'th-TH', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' };
const TATOEBA_AUDIO = 'https://api.tatoeba.org/v1/audios/';  // + id + '/file'

// Apple novelty and Eloquence voices sound robotic; never pick them automatically.
const ROBOTIC = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|princess|deranged|hysterical|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;

const speech = {
  audio: null,

  voiceScore(v, lang) {
    const l = v.lang.replace('_', '-').toLowerCase(), want = lang.toLowerCase();
    if (!l.startsWith(want.slice(0, 2))) return -1;
    const id = `${v.name} ${v.voiceURI}`.toLowerCase();
    let s = l === want ? 100 : 60;
    if (ROBOTIC.test(v.name)) s -= 200;
    if (/premium/.test(id)) s += 45;
    if (/natural|neural/.test(id)) s += 40;
    if (/enhanced/.test(id)) s += 30;
    if (/google/.test(id)) s += 25;
    if (/siri/.test(id)) s += 20;
    if (/compact/.test(id)) s -= 10;
    if (v.default) s += 5;
    return s;
  },

  voices(lang) {
    const all = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    return all.map(v => [this.voiceScore(v, lang), v]).filter(x => x[0] >= 0).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  },

  pickVoice(lang) {
    const chosen = lang.startsWith('th') ? settings.get('voiceTh') : lang.startsWith('en') ? settings.get('voiceEn') : '';
    const list = this.voices(lang);
    return list.find(v => v.voiceURI === chosen) || list[0] || null;
  },

  // region: 'us' | 'uk' | 'th' | '' ; recordings: entry.au
  play(text, lang, region, recordings, btn) {
    const rec = (recordings || []).find(a => a[0] === region) || (recordings?.length && !['us', 'uk'].includes(region) && recordings[0]);
    if (rec) return this.playCommons(rec[1], btn, () => this.say(text, lang, region, btn));
    this.say(text, lang, region, btn);
  },

  // Commons recordings are kept in a local cache after the first play, so they work offline.
  commonsBlob(path, allowNetwork = true) { return this.cachedBlob(COMMONS + path, allowNetwork); },

  async cachedBlob(url, allowNetwork = true) {
    const cache = await caches.open(AUDIO_CACHE);
    let res = await cache.match(url);
    if (!res && allowNetwork && navigator.onLine) {
      const net = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!net.ok) throw new Error(net.status);
      await cache.put(url, net.clone());
      res = net;
    }
    if (!res) throw new Error('not cached');
    return res.blob();
  },

  playCommons(path, btn, fallback) { return this.playCached(COMMONS + path, btn, fallback); },

  async playCached(src, btn, fallback) {
    this.stop();
    btn?.classList.add('playing');
    try {
      const blob = await this.cachedBlob(src);
      const url = URL.createObjectURL(blob);
      this.playUrl(url, btn, fallback, () => URL.revokeObjectURL(url));
    } catch {
      btn?.classList.remove('playing');
      fallback();
    }
  },

  // Save recordings ahead of time (Word card words, common words). Returns the number saved.
  async saveRecordings(paths, onProgress, signal) {
    const cache = await caches.open(AUDIO_CACHE);
    const queue = [...paths];
    let done = 0, saved = 0;
    const worker = async () => {
      while (queue.length) {
        if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
        const url = COMMONS + queue.shift();
        try {
          if (!(await cache.match(url))) {
            const res = await fetch(url, { mode: 'cors', credentials: 'omit', signal });
            if (res.ok) { await cache.put(url, res); saved++; }
          }
        } catch (e) { if (e.name === 'AbortError') throw e; }
        onProgress?.(++done, paths.length);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    return saved;
  },

  async savedRecordings() {
    try { return (await (await caches.open(AUDIO_CACHE)).keys()).length; } catch { return 0; }
  },

  // Example sentence: Tatoeba recording if there is one, else the device voice.
  playSentence(text, lang, audioId, btn) {
    if (audioId) return this.playCached(`${TATOEBA_AUDIO}${audioId}/file`, btn, () => this.say(text, lang, settings.get('accent'), btn, true));
    this.say(text, lang, settings.get('accent'), btn, true);
  },

  playUrl(url, btn, fallback, cleanup) {
    this.stop();
    btn?.classList.add('playing');
    const done = () => { btn?.classList.remove('playing'); cleanup?.(); };
    // One shared element: iOS only lets an element play after it was started from a tap once.
    const a = this.audio = this.el || (this.el = new Audio());
    let failed = false, finished = false;
    const fail = () => { if (failed || finished) return; failed = true; done(); fallback(); };
    const timer = setTimeout(() => { if (a.readyState < 2) { a.pause(); fail(); } }, 4000);
    a.onended = () => { finished = true; clearTimeout(timer); done(); };
    a.onerror = () => { clearTimeout(timer); fail(); };
    a.src = url;
    a.play().catch(() => { clearTimeout(timer); fail(); });
  },

  // Called on the first tap: unlocks the shared audio element and the speech engine on iOS.
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      this.el = this.el || new Audio();
      this.el.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      this.el.play().catch(() => {});
    } catch {}
    try { const u = new SpeechSynthesisUtterance(''); u.volume = 0; speechSynthesis.speak(u); } catch {}
  },

  say(text, lang, region, btn, sentence = false) {
    if (!('speechSynthesis' in window)) { toast('Speech is not available on this device'); return; }
    this.stop();
    const u = new SpeechSynthesisUtterance(text);
    const code = detectLang(text, lang === 'th' ? 'th' : 'en');
    u.lang = VOICE_LANG[code] || (region === 'uk' ? 'en-GB' : 'en-US');
    const voice = this.pickVoice(u.lang);
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    else if (code !== 'en' && speechSynthesis.getVoices().length) {
      const names = { th: 'Thai', ja: 'Japanese', ko: 'Korean', zh: 'Chinese' };
      toast(`No ${names[code]} voice on this device: add one in your phone settings`);
    }
    // A slightly slower rate helps single words; sentences sound best at normal speed.
    u.rate = sentence ? 1 : 0.9;
    btn?.classList.add('playing');
    u.onend = u.onerror = () => btn?.classList.remove('playing');
    speechSynthesis.speak(u);
  },

  stop() {
    try { this.audio?.pause(); } catch {}
    try { speechSynthesis.cancel(); } catch {}
  },
};
document.addEventListener('pointerdown', () => speech.unlock(), { once: true, capture: true });
// Some browsers load voices lazily.
try { speechSynthesis.getVoices(); speechSynthesis.addEventListener?.('voiceschanged', () => {}); } catch {}
