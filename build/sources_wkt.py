"""Wiktionary (kaikki.org / Wiktextract) loaders for English and Thai entries."""
import gzip
import json
import re

from common import norm

AUDIO_PREFIX = 'https://upload.wikimedia.org/wikipedia/commons/'
POS_NAMES = {
    'noun': 'noun', 'verb': 'verb', 'adj': 'adj', 'adv': 'adv', 'pron': 'pron', 'prep': 'prep', 'conj': 'conj',
    'intj': 'interj', 'det': 'det', 'num': 'num', 'particle': 'particle', 'classifier': 'classifier',
    'phrase': 'phrase', 'prep_phrase': 'phrase', 'proverb': 'proverb', 'prefix': 'prefix', 'suffix': 'suffix',
    'abbrev': 'abbr', 'name': 'name', 'contraction': 'contraction', 'article': 'article', 'character': 'character',
    'symbol': 'symbol', 'affix': 'affix', 'infix': 'infix', 'postp': 'postp',
}
# Wiktionary labels worth showing (kept short).
LABELS = {
    'informal', 'formal', 'slang', 'colloquial', 'vulgar', 'offensive', 'derogatory', 'humorous', 'literary',
    'archaic', 'obsolete', 'dated', 'rare', 'British', 'US', 'Australia', 'Canada', 'transitive', 'intransitive',
    'countable', 'uncountable', 'figuratively', 'idiomatic', 'Internet', 'poetic', 'euphemistic', 'Royal',
    'elevated', 'Buddhism', 'Northern-Thai', 'Isan', 'Southern-Thai', 'sometimes', 'plural', 'chiefly',
}
FORM_TAGS = [
    (('plural',), 'plural'),
    (('third-person', 'singular', 'present'), '3rd person'),
    (('participle', 'present'), 'present participle'),
    (('past',), 'past'),
    (('participle', 'past'), 'past participle'),
    (('comparative',), 'comparative'),
    (('superlative',), 'superlative'),
]
BAD_SENSE_TAGS = {'misspelling', 'nonstandard', 'obsolete', 'archaic'}


def clean(s):
    return re.sub(r'\s+', ' ', s).strip()


def form_label(tags):
    tags = set(tags)
    if tags & {'alternative', 'obsolete', 'archaic', 'rare', 'nonstandard', 'dialectal', 'misspelling',
               'table-tags', 'inflection-template', 'canonical', 'romanization', 'pronunciation-spelling'}:
        return None
    for need, label in FORM_TAGS:
        if set(need) <= tags and not (label == 'past' and 'participle' in tags):
            return label
    return None


def sounds_of(d):
    """IPA (US/UK) and audio paths from a Wiktionary entry."""
    us = uk = gen = None
    audio = []
    for s in d.get('sounds', []):
        tags = set(s.get('tags', []) + s.get('raw_tags', []))
        if 'ipa' in s:
            ipa = s['ipa']
            if not ipa.startswith('/'):
                continue
            if tags & {'US', 'General-American', 'GA'} and not us:
                us = ipa
            elif tags & {'Received-Pronunciation', 'UK', 'RP', 'British'} and not uk:
                uk = ipa
            elif not tags and not gen:
                gen = ipa
        url = s.get('mp3_url') or ''
        if url.startswith(AUDIO_PREFIX) and len(audio) < 3:
            name = s.get('audio', '')
            region = 'uk' if (tags & {'Received-Pronunciation', 'UK', 'British', 'Southern-England'} or '-uk-' in name.lower()) \
                else 'us' if (tags & {'US', 'General-American', 'California'} or '-us-' in name.lower()) else ''
            if not any(a[0] == region for a in audio):
                audio.append([region, url[len(AUDIO_PREFIX):]])
    return us or gen, uk or gen, audio


def sense_glosses(s):
    g = s.get('glosses') or s.get('raw_glosses') or []
    if not g:
        return None
    # Nested senses repeat the parent gloss first; keep the last, most specific one with the parent as context.
    text = g[-1] if len(g) == 1 or len(g[0]) >= 60 else g[0].rstrip(' :.') + ': ' + g[-1]
    return clean(text)


def read_jsonl_gz(path):
    with gzip.open(path, 'rt', encoding='utf-8') as f:
        for line in f:
            try:
                yield json.loads(line)
            except ValueError:
                continue


def english_entries(path, keep):
    """Yield compact English entries for words where keep(word) is true.
    Each: {w, pos, us, uk, au, f: [[label, form]], s: [sense], th: [[thai, roman, sense]], fo: lemma or None}
    sense = {d, ex, lb, syn, ant}"""
    for d in read_jsonl_gz(path):
        word = d.get('word', '')
        if not word or not keep(word):
            continue
        pos = POS_NAMES.get(d.get('pos'))
        if not pos:
            continue
        us, uk, audio = sounds_of(d)
        forms = []
        allowed = {'noun': {'plural'}, 'verb': {'3rd person', 'present participle', 'past', 'past participle'},
                   'adj': {'comparative', 'superlative'}, 'adv': {'comparative', 'superlative'}}.get(pos, set())
        for f in d.get('forms', []):
            label = form_label(f.get('tags', []))
            form = f.get('form') or ''
            if label in allowed and re.fullmatch(r"[A-Za-z][A-Za-z' -]*", form) and form != word \
                    and not any(x[0] == label for x in forms):
                forms.append([label, form])
        senses = []
        form_of = None
        all_form_of = all(set(x.get('tags', [])) & {'form-of', 'alt-of'} for x in d.get('senses', []) if x.get('glosses'))
        th = []
        for t in d.get('translations', []):
            if t.get('code') == 'th' and t.get('word'):
                th.append([t['word'], t.get('roman', ''), clean(t.get('sense', ''))])
        for s in d.get('senses', []):
            tags = set(s.get('tags', []))
            for t in s.get('translations', []):
                if t.get('code') == 'th' and t.get('word'):
                    th.append([t['word'], t.get('roman', ''), clean(t.get('sense', '') or (s.get('glosses') or [''])[0])])
            gloss = sense_glosses(s)
            if not gloss:
                continue
            if 'form-of' in tags or 'alt-of' in tags:
                target = (s.get('form_of') or s.get('alt_of') or [{}])[0].get('word')
                if target and not form_of and all_form_of:
                    form_of = target
                if tags & BAD_SENSE_TAGS:
                    continue
            elif tags & {'misspelling'}:
                continue
            ex = []
            for e in s.get('examples', []):
                if e.get('type') == 'example' and e.get('text') and len(e['text']) < 200:
                    ex.append(clean(e['text']))
                if len(ex) >= 2:
                    break
            if not ex and len(senses) < 3:
                # No made-up example: use the shortest dated quotation instead.
                quotes = sorted((clean(e['text']) for e in s.get('examples', [])
                                 if e.get('type') == 'quotation' and e.get('text') and 25 <= len(e['text']) <= 180), key=len)
                if quotes:
                    ex.append(quotes[0])
            sense = {'d': gloss}
            if ex:
                sense['ex'] = ex
            lb = [t for t in s.get('tags', []) + s.get('raw_tags', []) if t in LABELS]
            if lb:
                sense['lb'] = lb[:3]
            syn = [x['word'] for x in s.get('synonyms', []) if x.get('word')][:5]
            if syn:
                sense['syn'] = syn
            ant = [x['word'] for x in s.get('antonyms', []) if x.get('word')][:4]
            if ant:
                sense['ant'] = ant
            senses.append(sense)
            if len(senses) >= 14:
                break
        if not senses and not th:
            continue
        # Entry-level synonyms/antonyms when senses have none
        e_syn = [x['word'] for x in d.get('synonyms', []) if x.get('word')][:6]
        e_ant = [x['word'] for x in d.get('antonyms', []) if x.get('word')][:4]
        # Wikidata item of the main noun sense, used for an optional picture.
        wd = None
        if pos == 'noun':
            for x in d.get('senses', [])[:2]:
                if x.get('wikidata'):
                    wd = x['wikidata'][0]
                    break
        yield {'w': word, 'pos': pos, 'us': us, 'uk': uk, 'au': audio, 'wd': wd, 'f': forms[:6], 's': senses, 'th': dedupe_th(th),
               'fo': form_of, 'syn': e_syn, 'ant': e_ant, 'ety': etymology(d.get('etymology_text', ''))[:300]}


def etymology(text):
    """Drop the 'Etymology tree ...' widget text Wiktextract sometimes captures."""
    text = clean(text)
    if text.startswith('Etymology tree'):
        m = re.search(r'\b(From|Borrowed|Inherited|Learned borrowing|Coined|Compound|Clipping|Blend)\b', text)
        text = text[m.start():] if m else ''
    return text


def dedupe_th(th):
    out, seen = [], set()
    for w, r, s in th:
        if (w, s) not in seen:
            seen.add((w, s))
            out.append([w, r, s])
    return out[:20]


def thai_entries(path):
    """Yield compact Thai entries: {w, pos, rom, rtgs, ipa, au, cl, s: [{d, ex: [[th, en]]}], syn, ant, ety}"""
    for d in read_jsonl_gz(path):
        word = d.get('word', '')
        pos = POS_NAMES.get(d.get('pos'))
        if not word or not pos:
            continue
        rom = rtgs = ipa = None
        audio = []
        for s in d.get('sounds', []):
            raw = set(s.get('raw_tags', []))
            if 'Paiboon' in raw and not rom:
                rom = s.get('roman')
            elif 'Royal Institute' in raw and not rtgs:
                rtgs = s.get('roman')
            elif s.get('ipa') and not ipa:
                ipa = s['ipa']
            url = s.get('mp3_url') or ''
            if url.startswith(AUDIO_PREFIX) and not audio:
                audio.append(['th', url[len(AUDIO_PREFIX):]])
        if not rom:
            rom = next((f['form'] for f in d.get('forms', []) if 'romanization' in f.get('tags', [])), None)
        cl = [f['form'] for f in d.get('forms', []) if 'classifier' in f.get('tags', [])][:4]
        senses = []
        form_of = None
        for s in d.get('senses', []):
            gloss = sense_glosses(s)
            if not gloss:
                continue
            tags = set(s.get('tags', []))
            if ('form-of' in tags or 'alt-of' in tags) and not form_of:
                form_of = (s.get('form_of') or s.get('alt_of') or [{}])[0].get('word')
            ex = []
            for e in s.get('examples', []):
                if e.get('text') and len(e['text']) < 160:
                    ex.append([clean(e['text']), clean(e.get('english') or e.get('translation') or '')])
                if len(ex) >= 2:
                    break
            sense = {'d': gloss}
            if ex:
                sense['ex'] = ex
            lb = [t for t in s.get('tags', []) + s.get('raw_tags', []) if t in LABELS]
            if lb:
                sense['lb'] = lb[:3]
            senses.append(sense)
        if not senses:
            continue
        yield {'w': word, 'pos': pos, 'rom': rom, 'rtgs': rtgs, 'ipa': ipa, 'au': audio, 'cl': cl, 's': senses[:12],
               'fo': form_of,
               'syn': [x['word'] for x in d.get('synonyms', []) if x.get('word')][:6],
               'ant': [x['word'] for x in d.get('antonyms', []) if x.get('word')][:4],
               'ety': etymology(d.get('etymology_text', ''))[:200]}
