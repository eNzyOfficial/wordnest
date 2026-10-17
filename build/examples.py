"""Example sentences: English-Thai pairs and English-only sentences, indexed by
word so each dictionary entry can pick a handful of short, natural examples.

Sources, best first: Tatoeba (human-written, many with recorded audio),
SCB-MT-EN-TH-2020 clean subsets (dialogues, reviews, government text) and the
ALT parallel corpus (news)."""
import bz2
import csv
import os
import re
from collections import defaultdict

from common import is_thai

SRC_RANK = {'tat': 0, 'scbd': 1, 'scbr': 2, 'scbg': 3, 'alt': 4}
PER_TOKEN = 80     # candidates kept per word; sources are added best first
LIC_CODES = {'CC BY-NC-ND 3.0': 'ncnd3', 'CC BY-NC 4.0': 'nc4', 'CC BY 4.0': 'by4', 'CC BY-SA 4.0': 'bysa4', 'CC0 1.0': 'cc0'}
WORD = re.compile(r"[a-z]+(?:'[a-z]+)?")


class ThaiSegmenter:
    """Greedy longest-match word segmentation using the dictionary's own Thai
    headwords. Good enough to find which sentences contain a word."""

    def __init__(self, words):
        self.words = {w for w in words if 1 < len(w) <= 20 and re.fullmatch(r'[฀-๿]+', w)}
        self.maxlen = max((len(w) for w in self.words), default=1)

    def tokens(self, text):
        out = []
        for run in re.findall(r'[฀-๿]+', text):
            i = 0
            while i < len(run):
                for L in range(min(self.maxlen, len(run) - i), 1, -1):
                    if run[i:i + L] in self.words:
                        out.append(run[i:i + L])
                        i += L
                        break
                else:
                    i += 1
        return out


class Examples:
    def __init__(self, seg):
        self.seg = seg
        self.sents = []                      # (en, th, src, audio)
        self.seen = set()
        self.by_en = defaultdict(list)       # English token -> sentence ids (pairs)
        self.by_th = defaultdict(list)       # Thai token -> sentence ids (pairs)
        self.mono = defaultdict(list)        # English token -> sentence ids (English only)

    def add(self, en, th, src, audio=None, mono=False):
        en = re.sub(r'\s+', ' ', en).strip()
        th = re.sub(r'\s+', ' ', th or '').strip()
        if not (12 <= len(en) <= 120) or (th and not (4 <= len(th) <= 120)) or (en.lower(), th) in self.seen:
            return
        if th and not is_thai(th):
            return
        self.seen.add((en.lower(), th))
        i = len(self.sents)
        self.sents.append((en, th, src, audio))
        for tok in set(WORD.findall(en.lower())):
            lst = (self.mono if mono else self.by_en)[tok]
            if len(lst) < PER_TOKEN:
                lst.append(i)
        if th:
            for tok in set(self.seg.tokens(th)):
                lst = self.by_th[tok]
                if len(lst) < PER_TOKEN:
                    lst.append(i)

    def _pick(self, ids, n, test=None):
        cands = []
        for i in dict.fromkeys(ids):
            en, th, src, audio = self.sents[i]
            if test and not test(en, th):
                continue
            cands.append((SRC_RANK[src], audio is None, abs(len(en) - 55), i))
        cands.sort()
        return [self.row(c[3]) for c in cands[:n]]

    def row(self, i):
        en, th, src, audio = self.sents[i]
        r = [en, th, src]
        if audio:
            r.append(audio)
        return r

    def for_en(self, word, forms=(), n=8, pairs=True):
        index = self.by_en if pairs else self.mono
        w = word.lower()
        if ' ' in w:
            first = WORD.findall(w)
            ids = index.get(first[0], []) if first else []
            pat = re.compile(r'\b' + re.escape(w) + r'\b')
            return self._pick(ids, n, lambda en, th: pat.search(en.lower()))
        ids = []
        for f in [w] + [f.lower() for f in forms if ' ' not in f]:
            ids += index.get(f, [])
        return self._pick(ids, n)

    def for_th(self, word, n=8):
        return self._pick(self.by_th.get(word, []), n)


def load_all(raw, seg, tatoeba_eng, tatoeba_tha, tatoeba_pairs, log):
    ex = Examples(seg)
    audio = load_tatoeba_audio(os.path.join(raw, 'tatoeba', 'sentences_with_audio.csv'))
    # 1. Tatoeba pairs (with audio for the English side when allowed)
    for t, e in tatoeba_pairs:
        ex.add(tatoeba_eng[e], tatoeba_tha[t], 'tat', audio.get(e))
    # 2. SCB-MT clean subsets: dialogues, product reviews, government text
    base = os.path.join(raw, 'scb', 'scb-mt-en-th-2020')
    for fn, src in [('task_master_1.csv', 'scbd'), ('generated_reviews_crowd.csv', 'scbr'),
                    ('generated_reviews_translator.csv', 'scbr'), ('generated_reviews_yn.csv', 'scbr'),
                    ('assorted_government.csv', 'scbg')]:
        p = os.path.join(base, fn)
        if not os.path.exists(p):
            continue
        with open(p, encoding='utf-8', newline='') as f:
            for row in csv.DictReader(f):
                ex.add(row.get('en_text') or '', row.get('th_text') or '', src)
    # 3. ALT news sentences
    with open(os.path.join(raw, 'opus', 'alt', 'ALT.en-th.en'), encoding='utf-8') as fe, \
            open(os.path.join(raw, 'opus', 'alt', 'ALT.en-th.th'), encoding='utf-8') as ft:
        for en_s, th_s in zip(fe, ft):
            ex.add(en_s, th_s, 'alt')
    log('example pairs', len(ex.sents))
    # 4. English-only Tatoeba sentences, recorded ones first
    order = sorted(tatoeba_eng, key=lambda i: (i not in audio, i))
    for i in order:
        ex.add(tatoeba_eng[i], '', 'tat', audio.get(i), mono=True)
    log('example sentences total', len(ex.sents), 'with audio', sum(1 for s in ex.sents if s[3]))
    return ex


def load_tatoeba_audio(path):
    """{sentence id: [audio id, username, licence code]} for reusable licences."""
    out = {}
    if not os.path.exists(path):
        return out
    with open(path, encoding='utf-8') as f:
        for line in f:
            p = line.rstrip('\n').split('\t')
            if len(p) < 4 or p[3] not in LIC_CODES:
                continue
            sid = int(p[0])
            if sid not in out:
                out[sid] = [int(p[1]), p[2], LIC_CODES[p[3]]]
    return out
