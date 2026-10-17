"""Build the offline dictionary data under data/.

Usage: python3 -I build/build.py --raw ~/Desktop/dict-raw [--no-wkt-en]

Sources (see DATA_SOURCES.md): Wiktionary via kaikki.org (English and Thai),
Volubilis, Open English WordNet, Thai WordNet, CMUdict, Tatoeba, ALT parallel
corpus and FrequencyWords. Output per dictionary:
  data/<id>/<build>/meta.json, top.json.gz, i/N.json.gz, e/N.json.gz
and data/dicts.json listing the dictionaries.

Entry schema (keys kept short to save space):
  w   headword            l   language of the headword ('en' or 'th')
  ph  [[label, text]]     pronunciations (US/UK IPA, Thai romanisation)
  au  [[region, path]]    Wikimedia Commons audio, path below /wikipedia/commons/
  st  0-2 frequency stars f   [[label, form]] inflected forms
  fo  lemma this is a form of
  cl  Thai classifiers
  b   [{src, p: [{pos, s: [{d, n, ex, lb, syn, ant, src}]}]}] definition blocks
  syn, ant                related words
  ex  [[sentence, translation, src]] usage examples
  ety etymology
"""
import argparse
import gzip
import hashlib
import json
import os
import re
import shutil
import sys
import time
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import norm, is_thai  # noqa: E402
import sources_en  # noqa: E402
import sources_wkt  # noqa: E402
from xlsx import rows as xlsx_rows  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHUNK_BYTES = 150_000   # raw JSON per entry chunk before gzip
TOP_PER_PREFIX = 12

T0 = time.time()


def log(*a):
    print(f'[{time.time() - T0:6.1f}s]', *a, flush=True)


# ---------------------------------------------------------------- helpers

def stars(rank):
    if not rank:
        return 0
    return 2 if rank <= 3000 else 1 if rank <= 15000 else 0


def english_key_from_gloss(piece):
    """'to eat (food)' -> 'eat'. Returns None for long explanations."""
    p = re.sub(r'\([^)]*\)|\[[^\]]*\]|\{[^}]*\}', '', piece)
    p = p.replace('...', ' ').strip(' .,:;!?"\'')
    p = re.sub(r'^(to|a|an|the) ', '', p.strip(), flags=re.I)
    p = re.sub(r'\s+', ' ', p).strip()
    if not p or len(p) > 32 or len(p.split()) > 3 or is_thai(p) or not re.search('[A-Za-z]', p):
        return None
    if p.isupper() and len(p) > 1:
        return p  # abbreviation, keep case for display
    return p


def split_gloss(text):
    out = []
    for part in re.split(r'\s*;\s*', text):
        part = part.strip()
        if part:
            out.append(part)
    return out


def add_unique(lst, item, key=lambda x: x):
    k = key(item)
    if all(key(x) != k for x in lst):
        lst.append(item)


# ---------------------------------------------------------------- Volubilis

VOL_POS = {'n': 'noun', 'v': 'verb', 'adj': 'adj', 'adv': 'adv', 'pron': 'pron', 'prep': 'prep', 'conj': 'conj',
           'x': 'particle', 'pref': 'prefix', 'suff': 'suffix', 'interj': 'interj', 'classif': 'classifier',
           'num': 'num', 'aux': 'verb', 'art': 'article', 'abv': 'abbr', 'abbr': 'abbr', 'det': 'det'}


def vol_pos(t):
    t = t.strip().lower()
    first = re.split(r'[\s.;,]+', t)[0] if t else ''
    pos = VOL_POS.get(first, first or 'other')
    if 'prop' in t:
        pos = 'name'
    label = 'expression' if 'exp' in t else None
    return pos, label


def load_volubilis(path):
    """Yields dicts: {th, rom, pos, en: [pieces], lb, dom, cl, syn}"""
    for i, r in enumerate(xlsx_rows(path)):
        if i < 2 or len(r) < 5:
            continue
        th, en = r[3].strip(), r[4].strip()
        if not th or not en or not is_thai(th):
            continue
        pos, lb = vol_pos(r[6] if len(r) > 6 else '')
        usage = r[7].strip() if len(r) > 7 else ''
        labels = [x for x in (lb, usage) if x]
        yield {'th': th, 'rom': r[0].strip(), 'pos': pos, 'en': split_gloss(en), 'lb': labels[:2],
               'dom': r[9].strip() if len(r) > 9 else '',
               'cl': [c.strip() for c in re.split(r'[;,]', r[10]) if c.strip()][:3] if len(r) > 10 and r[10] else [],
               'syn': [c.strip() for c in re.split(r'[;,]', r[11]) if c.strip() and is_thai(c)][:4] if len(r) > 11 and r[11] else []}


# ---------------------------------------------------------------- Thai WordNet

def load_thai_wordnet(path):
    """{ili: [thai lemma, ...]}"""
    import xml.etree.ElementTree as ET
    sense_words = defaultdict(list)
    ili_of = {}
    for _, el in ET.iterparse(path):
        if el.tag == 'LexicalEntry':
            w = el.find('Lemma').get('writtenForm')
            for s in el.findall('Sense'):
                sense_words[s.get('synset')].append(w)
            el.clear()
        elif el.tag == 'Synset':
            if el.get('ili'):
                ili_of[el.get('id')] = el.get('ili')
            el.clear()
    out = defaultdict(list)
    for sid, words in sense_words.items():
        ili = ili_of.get(sid)
        if ili:
            for w in words:
                if len(w) <= 24 and w not in out[ili]:
                    out[ili].append(w)
    return out


# ---------------------------------------------------------------- examples

def tokenise_en(s):
    return set(re.findall(r"[a-z]+(?:'[a-z]+)?", s.lower()))


class Examples:
    """Short example sentences indexed by English word and by Thai substring."""

    def __init__(self):
        self.by_en = defaultdict(list)    # word -> [(len, en, th, src)]
        self.pairs = []                   # (th, en, src) for Thai lookups

    def add_pair(self, en, th, src, per_word=4):
        if len(en) > 140:
            return
        for tok in tokenise_en(en):
            lst = self.by_en[tok]
            if len(lst) < 40:
                lst.append((len(en), en, th, src))
        if th:
            self.pairs.append((th, en, src))

    def for_en(self, word, n=3, want_th=True):
        w = word.lower()
        if ' ' in w:
            first = w.split()[0]
            cands = [c for c in self.by_en.get(first, []) if w in c[1].lower()]
        else:
            cands = self.by_en.get(w, [])
        cands = [c for c in cands if (bool(c[2]) == want_th) or (want_th is None)]
        cands.sort(key=lambda c: (abs(c[0] - 50), c[1]))
        return [[c[1], c[2], c[3]] for c in cands[:n]]

    def build_thai_index(self):
        self.th_text = [p for p in self.pairs if p[0]]

    def for_th(self, word, n=3):
        if len(word) < 3:
            return []
        out = []
        for th, en, src in self.th_text:
            if word in th and len(th) < 100:
                out.append([th, en, src])
                if len(out) >= n * 3:
                    break
        out.sort(key=lambda e: len(e[0]))
        return out[:n]


# ---------------------------------------------------------------- writing

def write_dict(dict_id, title, entries, ranks, out_root, desc, sources, langs):
    """entries: {key: entry}. Writes chunks and returns dicts.json record."""
    keys = sorted(entries)
    # Chunk boundaries by cumulative raw size.
    chunks, cur, size = [], [], 0
    for k in keys:
        blob = json.dumps(entries[k], ensure_ascii=False, separators=(',', ':'))
        cur.append((k, blob))
        size += len(blob.encode()) + len(k) + 4
        if size >= CHUNK_BYTES:
            chunks.append(cur)
            cur, size = [], 0
    if cur:
        chunks.append(cur)

    digest = hashlib.sha1()
    for k in keys:
        digest.update(k.encode())
        digest.update(json.dumps(entries[k], ensure_ascii=False, sort_keys=True).encode())
    build = digest.hexdigest()[:10]
    base = os.path.join(out_root, dict_id)
    if os.path.isdir(base):
        shutil.rmtree(base)
    out = os.path.join(base, build)
    os.makedirs(os.path.join(out, 'i'))
    os.makedirs(os.path.join(out, 'e'))

    def gz(path, obj):
        raw = json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode()
        with open(path, 'wb') as f:
            f.write(gzip.compress(raw, 9, mtime=0))
        return os.path.getsize(path)

    total = 0
    firsts = []
    for n, chunk in enumerate(chunks):
        firsts.append(chunk[0][0])
        idx = [[k, entries[k]['w'], short_gloss(entries[k]), ranks.get(k, 0)] for k, _ in chunk]
        total += gz(os.path.join(out, 'i', f'{n}.json.gz'), idx)
        raw = '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + b for k, b in chunk) + '}'
        p = os.path.join(out, 'e', f'{n}.json.gz')
        with open(p, 'wb') as f:
            f.write(gzip.compress(raw.encode(), 9, mtime=0))
        total += os.path.getsize(p)

    # Most frequent words for each 1 and 2 character prefix.
    top = defaultdict(list)
    ranked = sorted((r, k) for k, r in ranks.items() if r and k in entries)
    for r, k in ranked:
        for L in (1, 2):
            if len(k) >= L:
                lst = top[k[:L]]
                if len(lst) < TOP_PER_PREFIX:
                    lst.append([k, entries[k]['w'], short_gloss(entries[k]), r])
    total += gz(os.path.join(out, 'top.json.gz'), top)

    wotd = word_of_day_pool(entries, ranks)
    meta = {'id': dict_id, 'build': build, 'count': len(keys), 'chunks': firsts, 'bytes': total, 'wotd': wotd}
    with open(os.path.join(out, 'meta.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, separators=(',', ':'))
    total += os.path.getsize(os.path.join(out, 'meta.json'))
    log(f'{dict_id}: {len(keys)} entries, {len(chunks)} chunks, {total / 1e6:.1f} MB')
    return {'id': dict_id, 'title': title, 'desc': desc, 'build': build, 'count': len(keys), 'bytes': total,
            'files': 2 + 2 * len(chunks), 'sources': sources, 'langs': langs}


def short_gloss(e):
    for b in e.get('b', []):
        for p in b['p']:
            for s in p['s']:
                g = s['d']
                if e['l'] == 'en' and 't' in s:
                    g = s['t']
                g = re.sub(r'\s+', ' ', g)
                return g if len(g) <= 70 else g[:68].rsplit(' ', 1)[0] + '...'
    if e.get('fo'):
        return 'form of ' + e['fo']
    return ''


def word_of_day_pool(entries, ranks):
    """Common, well-covered words for 'Word of the day'."""
    pool = []
    for k, r in sorted(ranks.items(), key=lambda kv: kv[1]):
        if not (800 <= r <= 12000) or k not in entries:
            continue
        e = entries[k]
        if e['l'] != 'en' or e.get('fo') or not e.get('ex') or ' ' in k or len(k) < 4:
            continue
        nsenses = sum(len(p['s']) for b in e.get('b', []) for p in b['p'])
        if nsenses >= 2:
            pool.append(k)
    return pool[:600]


# ---------------------------------------------------------------- assembly

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--raw', default=os.path.expanduser('~/Desktop/dict-raw'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'data'))
    ap.add_argument('--no-wkt-en', action='store_true', help='skip the large English Wiktionary dump')
    args = ap.parse_args()
    R = lambda *p: os.path.join(args.raw, *p)  # noqa: E731

    freq_en = sources_en.load_freq(R('freq', 'en_50k.txt'))
    freq_th = sources_en.load_freq(R('freq', 'th_50k.txt'))
    cmu = sources_en.load_cmudict(R('cmudict', 'cmudict.dict'))
    log('freq + cmudict', len(freq_en), len(freq_th), len(cmu))
    wn, _ = sources_en.load_oewn(R('wordnet', 'oewn-2025.xml.gz'))
    log('wordnet lemmas', len(wn))
    thwn = load_thai_wordnet(R('thwn', 'omw-th', 'omw-th.xml'))
    log('thai wordnet synsets', len(thwn))
    vol = list(load_volubilis(R('volubilis', 'volubilis.xlsx')))
    log('volubilis rows', len(vol))
    wkt_th = list(sources_wkt.thai_entries(R('kaikki', 'thai.jsonl.gz')))
    log('wiktionary thai', len(wkt_th))

    # Examples: Tatoeba (eng-tha pairs + English-only) and ALT (eng-tha).
    ex = Examples()
    eng, tha, pairs = sources_en.load_tatoeba(R('tatoeba', 'eng_sentences.tsv.bz2'), R('tatoeba', 'tha_sentences.tsv.bz2'),
                                              R('tatoeba', 'tha-eng_links.tsv.bz2'))
    if os.path.exists(R('tatoeba', 'eng-tha_links.tsv.bz2')):
        import bz2
        with bz2.open(R('tatoeba', 'eng-tha_links.tsv.bz2'), 'rt') as f:
            for line in f:
                a, b = map(int, line.split())
                if a in eng and b in tha:
                    pairs.append((b, a))
    seen_pairs = set()
    paired_en = set()
    for t, e_ in pairs:
        if (t, e_) in seen_pairs:
            continue
        seen_pairs.add((t, e_))
        paired_en.add(e_)
        ex.add_pair(eng[e_], tha[t], 'tat')
    with open(R('opus', 'alt', 'ALT.en-th.en'), encoding='utf-8') as fe, open(R('opus', 'alt', 'ALT.en-th.th'), encoding='utf-8') as ft:
        for en_s, th_s in zip(fe, ft):
            en_s, th_s = en_s.strip(), th_s.strip()
            if 20 < len(en_s) <= 110 and th_s:
                ex.add_pair(en_s, th_s, 'alt')
    ex_en = Examples()   # English-only sentences for English-English
    for i, s in eng.items():
        if 15 < len(s) <= 90:
            ex_en.add_pair(s, '', 'tat')
    ex.build_thai_index()
    log('examples', len(seen_pairs), 'tatoeba pairs,', len(ex.by_en), 'en words indexed;', len(ex_en.by_en), 'en-only')

    # English Wiktionary (optional, large).
    wkt_en = defaultdict(list)
    if not args.no_wkt_en:
        keep = set(wn) | set(cmu) | set(freq_en)
        for v in vol:
            for piece in v['en']:
                k = english_key_from_gloss(piece)
                if k:
                    keep.add(norm(k))
        n = 0
        for e in sources_wkt.english_entries(R('kaikki', 'english.jsonl.gz'), lambda w: norm(w) in keep or None):
            wkt_en[norm(e['w'])].append(e)
            n += 1
            if n % 200000 == 0:
                log('  wiktionary english', n)
        log('wiktionary english entries', n, 'keys', len(wkt_en))

    # ------------------------------------------------ English-English
    en_entries = {}
    en_keys = set(wn) | set(wkt_en)
    for k in en_keys:
        blocks = []
        wk = wkt_en.get(k, [])
        head = (wk[0]['w'] if wk else wn[k][0]['w'] if k in wn else k)
        if wk:
            groups = []
            for e in wk:
                if e['s']:
                    groups.append({'pos': e['pos'], 's': [strip_none(s) for s in e['s']]})
            if groups:
                blocks.append({'src': 'wkt', 'p': merge_pos(groups)})
        if k in wn:
            groups = defaultdict(list)
            order = []
            for s in wn[k]:
                if s['pos'] not in groups:
                    order.append(s['pos'])
                sense = {'d': s['d']}
                if s['ex']:
                    sense['ex'] = s['ex']
                if s['syn']:
                    sense['syn'] = s['syn']
                groups[s['pos']].append(sense)
            blocks.append({'src': 'wn', 'p': [{'pos': p, 's': groups[p][:12]} for p in order]})
        if not blocks and not any(e['fo'] for e in wk):
            continue
        e = base_entry(head, 'en', k, freq_en, cmu, wk)
        e['b'] = blocks
        exs = ex_en.for_en(k, 3, want_th=False)
        if exs:
            e['ex'] = [x[:1] + ['', x[2]] for x in exs]
        en_entries[k] = e
    log('en-en entries', len(en_entries))

    # ------------------------------------------------ English-Thai (both directions)
    et = {}   # key -> {'w', 'l', groups: {pos: [sense]}, ...}

    def th_slot(word):
        k = norm(word)
        if k not in et:
            et[k] = {'w': word, 'l': 'th', 'g': {}, 'order': [], 'rom': None, 'rtgs': None, 'ipa': None, 'au': [],
                     'cl': [], 'syn': [], 'ant': [], 'ety': '', 'srcs': set()}
        return et[k]

    def en_slot(word):
        k = norm(word)
        if k not in et:
            et[k] = {'w': word, 'l': 'en', 'g': {}, 'order': [], 'syn': [], 'ant': [], 'srcs': set()}
        return et[k]

    def add_sense(slot, pos, sense, src, limit=14):
        if pos not in slot['g']:
            slot['g'][pos] = []
            slot['order'].append(pos)
        lst = slot['g'][pos]
        key = sense['d'].lower()
        for s in lst:
            if s['d'].lower() == key:
                if sense.get('n') and not s.get('n'):
                    s['n'] = sense['n']
                return
        if len(lst) < limit:
            sense['src'] = src
            lst.append(sense)
            slot['srcs'].add(src)

    # Thai headwords from Wiktionary
    for e in wkt_th:
        slot = th_slot(e['w'])
        for s in e['s']:
            add_sense(slot, e['pos'], strip_none({'d': s['d'], 'ex': s.get('ex'), 'lb': s.get('lb')}), 'wkt')
        for f in ('rom', 'rtgs', 'ipa'):
            slot[f] = slot[f] or e[f]
        slot['au'] = slot['au'] or e['au']
        for c in e['cl']:
            add_unique(slot['cl'], c)
        for s in e['syn']:
            add_unique(slot['syn'], s)
        for s in e['ant']:
            add_unique(slot['ant'], s)
        slot['ety'] = slot['ety'] or e['ety']
        # reverse: English gloss words -> Thai
        for s in e['s'][:4]:
            for piece in re.split(r'[;,]', s['d'])[:4]:
                k = english_key_from_gloss(piece)
                if k:
                    add_sense(en_slot(k), e['pos'], {'d': e['w'], 'n': s['d'] if len(s['d']) < 80 else None}, 'wkt', 10)

    # Thai headwords from Volubilis, plus the reverse direction
    for v in vol:
        slot = th_slot(v['th'])
        add_sense(slot, v['pos'], strip_none({'d': '; '.join(v['en']), 'lb': v['lb'] or None}), 'vol')
        if not slot['rom']:
            slot['vrom'] = slot.get('vrom') or v['rom']
        for c in v['cl']:
            m = re.search(r'\(([\u0E00-\u0E7F]+)\)', c)
            c = m.group(1) if m else c
            if is_thai(c) and re.fullmatch(r'[\u0E00-\u0E7F]+', c):
                add_unique(slot['cl'], c)
        for s in v['syn']:
            add_unique(slot['syn'], s)
        for piece in v['en'][:5]:
            k = english_key_from_gloss(piece)
            if k:
                note = piece if piece.lower() != k.lower() else None
                add_sense(en_slot(k), v['pos'], strip_none({'d': v['th'], 'n': note}), 'vol', 14)

    # English Wiktionary Thai translations (when the dump is present)
    for k, lst in wkt_en.items():
        for e in lst:
            if not e['th']:
                continue
            slot = en_slot(e['w'])
            for th_word, roman, sense in e['th']:
                add_sense(slot, e['pos'], strip_none({'d': th_word, 'n': sense or None, 'r': roman or None}), 'wkt')
                rs = th_slot(th_word)
                add_sense(rs, e['pos'], strip_none({'d': e['w'] + (f' ({sense})' if sense and len(sense) < 60 else '')}), 'wktr', 10)
                if roman and not rs['rom']:
                    rs['rom'] = roman

    # Thai WordNet, joined to English WordNet senses via ILI
    for k, senses in wn.items():
        for s in senses[:6]:
            th_words = thwn.get(s['ili'], [])[:3]
            if not th_words:
                continue
            slot = en_slot(s['w'])
            add_sense(slot, s['pos'], {'d': ', '.join(th_words), 'n': s['d'] if len(s['d']) < 90 else s['d'][:88] + '...'}, 'thwn', 16)
            for tw in th_words[:2]:
                # Only for Thai words no other source explains: Thai WordNet is noisy.
                if norm(tw) in et and et[norm(tw)]['l'] == 'th' and set(et[norm(tw)]['srcs']) <= {'thwn'}:
                    add_sense(et[norm(tw)], s['pos'], {'d': ', '.join([s['w']] + s['syn'][:2]), 'n': s['d'][:90]}, 'thwn', 12)

    # Turn slots into entries
    enth = {}
    for k, slot in et.items():
        if not slot['g']:
            continue
        lang = slot['l']
        if lang == 'en':
            # Common Thai words first, then by source quality.
            prio = {'wkt': 0, 'vol': 1, 'thwn': 2}
            for p in slot['order']:
                slot['g'][p].sort(key=lambda s: (min(freq_th.get(w.strip(), 60000) for w in s['d'].split(',')) // 2000,
                                                 prio.get(s['src'], 3)))
        groups = [{'pos': p, 's': group_senses(slot['g'][p], lang)} for p in slot['order']]
        e = {'w': slot['w'], 'l': lang}
        if lang == 'en':
            wk = wkt_en.get(k, [])
            e = base_entry(slot['w'], 'en', k, freq_en, cmu, wk)
            exs = ex.for_en(k, 3)
        else:
            ph = []
            rom = slot.get('rom') or slot.get('vrom')
            if rom:
                ph.append(['', rom])
            if slot.get('rtgs') and slot['rtgs'] != rom:
                ph.append(['RTGS', slot['rtgs']])
            if slot.get('ipa'):
                ph.append(['IPA', slot['ipa']])
            if ph:
                e['ph'] = ph
            if slot.get('au'):
                e['au'] = slot['au']
            st = stars(freq_th.get(slot['w']))
            if st:
                e['st'] = st
            for f in ('cl', 'syn', 'ant'):
                if slot.get(f):
                    e[f] = slot[f][:6]
            if slot.get('ety'):
                e['ety'] = slot['ety']
            exs = ex.for_th(slot['w'], 3)
            # Wiktionary usage examples are already inline; add sentence examples only when none
        e['b'] = [{'src': 'mix', 'p': groups}]
        if exs:
            e['ex'] = exs
        e['src'] = sorted(slot['srcs'])
        enth[k] = e
    log('en-th entries', len(enth), sum(1 for e in enth.values() if e['l'] == 'th'), 'thai')

    ranks_en = {norm(w): r for w, r in freq_en.items()}
    ranks_enth = dict(ranks_en)
    for w, r in freq_th.items():
        ranks_enth.setdefault(norm(w), r)

    os.makedirs(args.out, exist_ok=True)
    dicts = [
        write_dict('en-th', 'English-Thai', enth, ranks_enth, args.out,
                   'English to Thai and Thai to English', ['wkt', 'vol', 'thwn', 'tat', 'alt', 'cmu', 'freq'], ['en', 'th']),
        write_dict('en-en', 'English-English', en_entries, ranks_en, args.out,
                   'English definitions', ['wkt', 'wn', 'cmu', 'tat', 'freq'], ['en']),
    ]
    with open(os.path.join(args.out, 'dicts.json'), 'w', encoding='utf-8') as f:
        json.dump({'generated': time.strftime('%Y-%m-%d'), 'wiktionaryEnglish': not args.no_wkt_en, 'dicts': dicts},
                  f, ensure_ascii=False, indent=1)
    log('done', sum(d['bytes'] for d in dicts) / 1e6, 'MB total')


def strip_none(d):
    return {k: v for k, v in d.items() if v not in (None, [], '', {})}


def merge_pos(groups):
    """Wiktionary often has several entries with the same part of speech (one per etymology)."""
    out = []
    for g in groups:
        for o in out:
            if o['pos'] == g['pos']:
                o['s'].extend(g['s'])
                break
        else:
            out.append({'pos': g['pos'], 's': list(g['s'])})
    for o in out:
        o['s'] = o['s'][:16]
    return out


def group_senses(senses, lang):
    """For English headwords many senses are single Thai words: fold the ones that
    share the same English note into one line so the list stays readable."""
    if lang != 'en':
        return senses
    out = []
    by_note = {}
    for s in senses:
        note = s.get('n')
        if note and note in by_note and len(by_note[note]['d']) < 60:
            tgt = by_note[note]
            if s['d'] not in tgt['d'].split(', '):
                tgt['d'] += ', ' + s['d']
            continue
        s = dict(s)
        out.append(s)
        if note:
            by_note[note] = s
    # Senses without a note from the same source fold together too.
    merged = []
    for s in out:
        if not s.get('n') and merged and not merged[-1].get('n') and merged[-1]['src'] == s['src'] and len(merged[-1]['d']) < 50:
            merged[-1]['d'] += ', ' + s['d']
            continue
        merged.append(s)
    for s in merged:
        s.pop('r', None)
    return merged


def base_entry(head, lang, key, freq, cmu, wk):
    e = {'w': head, 'l': lang}
    ph = []
    us = next((x['us'] for x in wk if x.get('us')), None) or cmu.get(key)
    uk = next((x['uk'] for x in wk if x.get('uk')), None)
    if us:
        ph.append(['US', us])
    if uk and uk != us:
        ph.append(['UK', uk])
    if ph:
        e['ph'] = ph
    au = next((x['au'] for x in wk if x.get('au')), None)
    if au:
        e['au'] = au
    st = stars(freq.get(key))
    if st:
        e['st'] = st
    forms = []
    for x in wk:
        for f in x['f']:
            add_unique(forms, f)
    if forms:
        e['f'] = forms[:8]
    fo = next((x['fo'] for x in wk if x.get('fo')), None)
    if fo and norm(fo) != key:
        e['fo'] = fo
    syn, ant = [], []
    for x in wk:
        for s in x['syn']:
            add_unique(syn, s)
        for s in x['ant']:
            add_unique(ant, s)
    if syn:
        e['syn'] = syn[:8]
    if ant:
        e['ant'] = ant[:6]
    ety = next((x['ety'] for x in wk if x.get('ety')), None)
    if ety:
        e['ety'] = ety
    return e


if __name__ == '__main__':
    main()
