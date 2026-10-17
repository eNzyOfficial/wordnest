// Pronunciation.
// Words: recorded Wiktionary audio from Wikimedia Commons when online.
// Example sentences: human recordings from Tatoeba when online and available.
// Otherwise the device voice, choosing the most natural one installed (or the
// one picked in Settings) instead of whatever the browser lists first.
const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons/';
const TATOEBA_AUDIO = 'https://tatoeba.org/en/audio/download/';

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
    const chosen = settings.get(lang.startsWith('th') ? 'voiceTh' : 'voiceEn');
    const list = this.voices(lang);
    return list.find(v => v.voiceURI === chosen) || list[0] || null;
  },

  // region: 'us' | 'uk' | 'th' | '' ; recordings: entry.au
  play(text, lang, region, recordings, btn) {
    const rec = (recordings || []).find(a => a[0] === region) || (recordings?.length && !['us', 'uk'].includes(region) && recordings[0]);
    if (rec && navigator.onLine) return this.playUrl(COMMONS + rec[1], btn, () => this.say(text, lang, region, btn));
    this.say(text, lang, region, btn);
  },

  // Example sentence: Tatoeba recording if there is one, else the device voice.
  playSentence(text, lang, audioId, btn) {
    if (audioId && navigator.onLine) return this.playUrl(TATOEBA_AUDIO + audioId, btn, () => this.say(text, lang, settings.get('accent'), btn, true));
    this.say(text, lang, settings.get('accent'), btn, true);
  },

  playUrl(url, btn, fallback) {
    this.stop();
    btn?.classList.add('playing');
    const done = () => btn?.classList.remove('playing');
    const a = this.audio = new Audio(url);
    let failed = false;
    const fail = () => { if (failed) return; failed = true; done(); fallback(); };
    const timer = setTimeout(() => { if (a.readyState < 2) { a.pause(); fail(); } }, 4000);
    a.onended = () => { clearTimeout(timer); done(); };
    a.onerror = () => { clearTimeout(timer); fail(); };
    a.play().catch(() => { clearTimeout(timer); fail(); });
  },

  say(text, lang, region, btn, sentence = false) {
    if (!('speechSynthesis' in window)) { toast('Speech is not available on this device'); return; }
    this.stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'th' ? 'th-TH' : region === 'uk' ? 'en-GB' : 'en-US';
    const voice = this.pickVoice(u.lang);
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    else if (lang === 'th' && speechSynthesis.getVoices().length) toast('No Thai voice on this device: add one in your phone settings');
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
// Some browsers load voices lazily.
try { speechSynthesis.getVoices(); speechSynthesis.addEventListener?.('voiceschanged', () => {}); } catch {}
