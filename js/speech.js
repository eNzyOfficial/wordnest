// Pronunciation: recorded Wiktionary audio from Wikimedia Commons when online,
// otherwise the device's built-in voice (works offline on most phones).
const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons/';

const speech = {
  audio: null,

  // region: 'us' | 'uk' | 'th' | '' ; recordings: entry.au
  play(text, lang, region, recordings, btn) {
    const rec = (recordings || []).find(a => a[0] === region) || (region === '' && recordings?.[0]);
    btn?.classList.add('playing');
    const done = () => btn?.classList.remove('playing');
    if (rec && navigator.onLine) {
      this.stop();
      this.audio = new Audio(COMMONS + rec[1]);
      this.audio.onended = done;
      this.audio.onerror = () => { done(); this.say(text, lang, region, btn); };
      this.audio.play().catch(() => { done(); this.say(text, lang, region, btn); });
      return;
    }
    this.say(text, lang, region, btn);
  },

  say(text, lang, region, btn) {
    if (!('speechSynthesis' in window)) { toast('Speech is not available on this device'); btn?.classList.remove('playing'); return; }
    this.stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'th' ? 'th-TH' : region === 'uk' ? 'en-GB' : 'en-US';
    const voice = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-') === u.lang)
      || speechSynthesis.getVoices().find(v => v.lang.startsWith(u.lang.slice(0, 2)));
    if (voice) u.voice = voice;
    else if (lang === 'th' && speechSynthesis.getVoices().length) toast('No Thai voice installed on this device');
    u.rate = 0.9;
    u.onend = u.onerror = () => btn?.classList.remove('playing');
    speechSynthesis.speak(u);
  },

  stop() {
    try { this.audio?.pause(); } catch {}
    try { speechSynthesis.cancel(); } catch {}
  },
};
// Some browsers load voices lazily.
try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch {}
