// Word detail page.
const SRC_NAMES = {
  wkt: 'Wiktionary', wktr: 'Wiktionary', vol: 'Volubilis', thwn: 'Thai WordNet', wn: 'WordNet',
  tat: 'Tatoeba', alt: 'ALT corpus', scbd: 'SCB-MT (dialogues)', scbr: 'SCB-MT (reviews)', scbg: 'SCB-MT (government)', cmu: 'CMUdict', mix: '',
};
const POS_ABBR = {
  noun: 'n.', verb: 'v.', adj: 'adj.', adv: 'adv.', pron: 'pron.', prep: 'prep.', conj: 'conj.', interj: 'interj.',
  det: 'det.', num: 'num.', particle: 'part.', classifier: 'clf.', phrase: 'phr.', proverb: 'prov.', prefix: 'pref.',
  suffix: 'suf.', abbr: 'abbr.', name: 'name', contraction: 'contr.', article: 'art.', character: 'char.', symbol: 'sym.',
};

const segmenters = {};
function segment(text, lang) {
  if (!('Segmenter' in Intl)) return text.split(/(\s+)/).map(s => ({ segment: s, isWordLike: /\S/.test(s) }));
  segmenters[lang] ||= new Intl.Segmenter(lang, { granularity: 'word' });
  return [...segmenters[lang].segment(text)];
}

// Wrap words so they can be tapped for a quick lookup, and highlight the headword.
function tappable(text, lang, marks) {
  const parts = segment(text, lang);
  return parts.map(p => {
    const s = p.segment;
    if (!p.isWordLike) return esc(s);
    const hit = marks.some(m => m && (lang === 'th' ? s.includes(m) || m.includes(s) && s.length > 1 : s.toLowerCase() === m));
    return `<span class="tw${hit ? ' hl' : ''}" data-l="${lang}">${esc(s)}</span>`;
  }).join('');
}

function headwordMarks(entry) {
  const forms = [entry.w, ...(entry.f || []).map(f => f[1])];
  return entry.l === 'th' ? forms : forms.map(f => f.toLowerCase());
}

function stars(n) {
  if (!n) return '';
  return `<span class="stars" aria-label="${n === 2 ? 'Very common' : 'Common'} word">${'<i></i>'.repeat(n)}</span>`;
}

const LIC_NAMES = { ncnd3: 'CC BY-NC-ND 3.0', nc4: 'CC BY-NC 4.0', by4: 'CC BY 4.0', bysa4: 'CC BY-SA 4.0', cc0: 'CC0' };

function exampleRow(ex, entry) {
  let [a, b, src, audio] = ex;
  // On Thai word pages the Thai sentence goes first and is read by the Thai voice.
  if (entry.l === 'th' && b && !isThai(a) && isThai(b)) { [a, b] = [b, a]; audio = null; }
  const la = isThai(a) ? 'th' : 'en';
  const marks = headwordMarks(entry);
  const credit = audio ? `, voice by <a href="https://tatoeba.org/en/user/profile/${encodeURIComponent(audio[1])}" target="_blank" rel="noopener">${esc(audio[1])}</a> (${esc(LIC_NAMES[audio[2]] || audio[2])})` : '';
  return `<li class="ex">
    <button class="spk sm${audio ? ' rec' : ''}" data-say="${esc(a)}" data-lang="${la}"${audio ? ` data-audio="${audio[0]}"` : ''} aria-label="Listen">${icon('speak')}</button>
    <div><div class="ex-a">${tappable(a, la, marks)}</div>${b ? `<div class="ex-b">${tappable(b, isThai(b) ? 'th' : 'en', marks)}</div>` : ''}
    ${src ? `<div class="ex-src">${esc(SRC_NAMES[src] || src)}${credit}</div>` : ''}</div></li>`;
}

function senseHtml(s, n, entry, showSrc) {
  const lb = (s.lb || []).map(l => `<span class="lb">${esc(l)}</span>`).join('');
  const d = entry.l === 'en' && isThai(s.d) ? `<span class="th">${esc(s.d)}</span>` : esc(s.d);
  const ex = (s.ex || []).map(x => {
    const pair = Array.isArray(x) ? x : [x, ''];
    const la = isThai(pair[0]) ? 'th' : 'en';
    return `<div class="sx"><div class="ex-a">${tappable(pair[0], la, headwordMarks(entry))}</div>${pair[1] ? `<div class="ex-b">${esc(pair[1])}</div>` : ''}</div>`;
  }).join('');
  const rel = [...(s.syn || []).map(w => ['syn', w]), ...(s.ant || []).map(w => ['ant', w])];
  return `<li class="sense"><span class="num">${n}</span><div class="sbody">
    <div class="d">${lb}${d}</div>
    ${s.n ? `<div class="note">${esc(s.n)}</div>` : ''}
    ${ex ? `<div class="sexs">${ex}</div>` : ''}
    ${rel.length ? `<div class="srel">${rel.map(([t, w]) => `<a class="chip ${t}" data-lookup="${esc(w)}">${t === 'ant' ? 'opp. ' : ''}${esc(w)}</a>`).join('')}</div>` : ''}
    ${showSrc && s.src ? `<div class="ssrc">${esc(SRC_NAMES[s.src] || s.src)}</div>` : ''}
  </div></li>`;
}

function renderWord(dictId, key, entry) {
  const prons = (entry.ph || []).map(([label, text], i) => {
    const region = entry.l === 'th' ? 'th' : label.toLowerCase();
    const speakable = entry.l === 'th' ? i === 0 : true;
    return `<span class="pron">${label ? `<b>${esc(label)}</b>` : ''}<span class="ipa">[${esc(text.replace(/^\/|\/$/g, ''))}]</span>${speakable
      ? `<button class="spk" data-say="${esc(entry.w)}" data-lang="${entry.l}" data-region="${esc(region)}" aria-label="Listen ${esc(label)}">${icon('speak')}</button>` : ''}</span>`;
  }).join('');
  const noPron = !entry.ph?.length
    ? `<span class="pron"><button class="spk" data-say="${esc(entry.w)}" data-lang="${entry.l}" data-region="${entry.l === 'th' ? 'th' : 'us'}" aria-label="Listen">${icon('speak')}</button></span>` : '';
  const saved = cards.has(dictId, key);
  const multiSrc = (entry.src || []).length > 1;

  let defs = '';
  let n = 0;
  (entry.b || []).forEach((block, bi) => {
    const label = block.title || (block.src !== 'mix' && (entry.b.length > 1 || bi > 0) ? SRC_NAMES[block.src] : '');
    const title = label ? `<div class="blk-title">${esc(label)}</div>` : '';
    defs += `<div class="blk${bi > 0 ? ' more' : ''}">${title}`;
    for (const p of block.p) {
      n = 0;
      // Name the source once at the start of each run of senses from the same source.
      defs += `<div class="posgrp"><span class="pos">${esc(POS_ABBR[p.pos] || p.pos)}</span><ol>${p.s.map((s, i) =>
        senseHtml(s, ++n, entry, multiSrc && (i === 0 || p.s[i - 1].src !== s.src))).join('')}</ol></div>`;
    }
    defs += '</div>';
  });

  const forms = entry.f?.length ? `<details class="sec acc"><summary>Derivative ${icon('down', 'chev')}</summary>
    <table class="forms">${entry.f.map(([l, f]) => `<tr><th>${esc(l)}</th><td><a data-lookup="${esc(f)}">${esc(f)}</a></td></tr>`).join('')}</table></details>` : '';
  const formOf = entry.fo ? `<a class="formof" data-lookup="${esc(entry.fo)}">Form of <b>${esc(entry.fo)}</b> ${icon('chev')}</a>` : '';
  const cls = entry.cl?.length ? `<div class="sec"><h3>Classifier</h3><div class="chips">${entry.cl.map(c => `<a class="chip" data-lookup="${esc(c)}">${esc(c)}</a>`).join('')}</div></div>` : '';
  const syn = entry.syn?.length ? `<div class="sec"><h3>Synonyms</h3><div class="chips">${entry.syn.map(c => `<a class="chip" data-lookup="${esc(c)}">${esc(c)}</a>`).join('')}</div></div>` : '';
  const ant = entry.ant?.length ? `<div class="sec"><h3>Antonyms</h3><div class="chips">${entry.ant.map(c => `<a class="chip ant" data-lookup="${esc(c)}">${esc(c)}</a>`).join('')}</div></div>` : '';
  const exs = entry.ex?.length ? `<div class="sec"><h3>Example sentences</h3><ul class="exlist">${entry.ex.slice(0, 3).map(e => exampleRow(e, entry)).join('')}</ul></div>` : '';
  const ety = entry.ety ? `<details class="sec acc"><summary>Origin ${icon('down', 'chev')}</summary><p class="ety">${esc(entry.ety)}</p></details>` : '';
  const srcs = [...new Set([...(entry.src || []), ...(entry.b || []).map(b => b.src)].filter(s => s && s !== 'mix').map(s => SRC_NAMES[s]))];
  for (const e of entry.ex || []) srcs.push((SRC_NAMES[e[2]] || e[2]).replace(/ \(.*\)$/, ''));

  return `<article class="entry${settings.get('examples') ? '' : ' no-ex'}" data-l="${entry.l}">
    <div class="entry-head">
      <div class="hw-row">
        <div class="hw-wrap">${stars(entry.st)}<h2 class="hw${entry.l === 'th' ? ' th' : ''}">${esc(entry.w)}</h2></div>
        <button class="icon-btn mark${saved ? ' on' : ''}" id="markBtn" aria-label="${saved ? 'Remove from' : 'Add to'} Word card" aria-pressed="${saved}">${icon('mark')}</button>
        <button class="icon-btn" id="moreBtn" aria-label="More">${icon('more')}</button>
      </div>
      <div class="prons">${prons || noPron}</div>
      ${formOf}
    </div>
    ${forms}
    <div class="sec defs">
      <div class="sec-head"><h3>Definition</h3>
        <label class="ex-toggle">Examples<span class="switch"><input type="checkbox" id="exToggle" ${settings.get('examples') ? 'checked' : ''}><i></i></span></label></div>
      ${defs}
    </div>
    ${cls}${syn}${ant}${exs}${ety}
    <p class="srcline">Source: ${[...new Set(srcs)].map(esc).join(', ')}. <a href="#/sources">Licences</a></p>
  </article>`;
}

function renderExamples(entry) {
  const list = [...(entry.ex || [])];
  for (const b of entry.b || []) for (const p of b.p) for (const s of p.s) for (const x of s.ex || []) {
    list.push(Array.isArray(x) ? [x[0], x[1], s.src || b.src] : [x, '', b.src]);
  }
  return `<div class="subhead">${esc(entry.w)} <span>${list.length} examples</span></div>
    <ul class="exlist big">${list.map(e => exampleRow(e, entry)).join('') || '<li class="empty">No examples yet.</li>'}</ul>`;
}

function exampleCount(entry) {
  let n = (entry.ex || []).length;
  for (const b of entry.b || []) for (const p of b.p) for (const s of p.s) n += (s.ex || []).length;
  return n;
}

function glossOf(entry) {
  for (const b of entry.b || []) for (const p of b.p) for (const s of p.s) return s.d;
  return entry.fo ? 'form of ' + entry.fo : '';
}
