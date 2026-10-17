"""Loaders for the English-side sources: Open English WordNet, CMUdict,
Tatoeba and word frequency lists. Each returns plain dicts/lists so the
assembler in build.py can merge them."""
import bz2
import gzip
import re
import xml.etree.ElementTree as ET
from collections import defaultdict

from common import norm

# ARPAbet -> IPA (General American). Stress digits are handled separately.
ARPA = {
    'AA': 'ɑ', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔ', 'AW': 'aʊ', 'AY': 'aɪ', 'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð',
    'EH': 'ɛ', 'ER': 'ɝ', 'EY': 'eɪ', 'F': 'f', 'G': 'ɡ', 'HH': 'h', 'IH': 'ɪ', 'IY': 'i', 'JH': 'dʒ', 'K': 'k',
    'L': 'l', 'M': 'm', 'N': 'n', 'NG': 'ŋ', 'OW': 'oʊ', 'OY': 'ɔɪ', 'P': 'p', 'R': 'ɹ', 'S': 's', 'SH': 'ʃ',
    'T': 't', 'TH': 'θ', 'UH': 'ʊ', 'UW': 'u', 'V': 'v', 'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ',
}
VOWELS = {'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'}


def arpa_to_ipa(phones):
    """Turn 'HH AH0 L OW1' into /həˈloʊ/. The stress mark goes before the
    consonant cluster that starts the stressed syllable (simple onset rule)."""
    out = []
    mono = sum(1 for p in phones if p.rstrip('012') in VOWELS) == 1
    for i, p in enumerate(phones):
        base, stress = re.match(r'([A-Z]+)(\d?)', p).groups()
        sym = ARPA.get(base, '')
        if base == 'AH' and stress == '0':
            sym = 'ə'
        if base == 'ER' and stress == '0':
            sym = 'ɚ'
        if stress in ('1', '2') and base in VOWELS and not mono:
            mark = 'ˈ' if stress == '1' else 'ˌ'
            # walk back over up to two consonants that can start a syllable
            j = len(out)
            k = i - 1
            moved = 0
            while k >= 0 and phones[k].rstrip('012') not in VOWELS and moved < 2:
                k -= 1
                moved += 1
                j -= 1
            if moved == 2 and not onset_ok(phones[i - 2].rstrip('012'), phones[i - 1].rstrip('012')):
                j += 1
            out.insert(j, mark)
        out.append(sym)
    return '/' + ''.join(out) + '/'


def onset_ok(a, b):
    return (a in {'P', 'B', 'T', 'D', 'K', 'G', 'F', 'TH', 'S', 'SH'} and b in {'L', 'R', 'W', 'Y'}) or \
           (a == 'S' and b in {'P', 'T', 'K', 'M', 'N'})


def load_cmudict(path):
    """{word: ipa} using the first pronunciation listed."""
    out = {}
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.split('#')[0].strip()
            if not line:
                continue
            word, *phones = line.split()
            if '(' in word:
                continue  # alternate pronunciations: keep the first only
            out[word.lower()] = arpa_to_ipa(phones)
    return out


POS_WN = {'n': 'noun', 'v': 'verb', 'a': 'adj', 's': 'adj', 'r': 'adv'}


def load_oewn(path):
    """{lemma_lower: [ {pos, d, ex, syn} ...] } in WordNet sense order, plus
    {synset_id: ili} so Thai wordnets keyed by ILI can be joined."""
    synsets = {}
    entries = []
    with gzip.open(path) as f:
        for _, el in ET.iterparse(f):
            if el.tag == 'LexicalEntry':
                lemma = el.find('Lemma')
                senses = [s.get('synset') for s in el.findall('Sense')]
                entries.append((lemma.get('writtenForm'), lemma.get('partOfSpeech'), senses))
                el.clear()
            elif el.tag == 'Synset':
                d = el.findtext('Definition') or ''
                ex = [e.text for e in el.findall('Example') if e.text]
                members = el.get('members', '').split()
                synsets[el.get('id')] = {'d': d, 'ex': ex, 'm': members, 'ili': el.get('ili'), 'pos': el.get('partOfSpeech')}
                el.clear()
    member_word = {}
    for word, pos, _ in entries:
        member_word['oewn-' + word.replace(' ', '_') + '-' + pos] = word
    lemmas = defaultdict(list)
    for word, pos, senses in entries:
        for sid in senses:
            s = synsets.get(sid)
            if not s:
                continue
            syn = []
            for m in s['m']:
                w = member_word.get(m) or m[5:].rsplit('-', 1)[0].replace('_', ' ')
                if w.lower() != word.lower() and w not in syn:
                    syn.append(w)
            lemmas[norm(word)].append({'w': word, 'pos': POS_WN.get(pos, pos), 'd': s['d'], 'ex': s['ex'][:2],
                                       'syn': syn[:6], 'sid': sid, 'ili': s['ili']})
    return lemmas, synsets


def load_freq(path, limit=50000):
    """{word: rank} (1 = most frequent)."""
    out = {}
    with open(path, encoding='utf-8') as f:
        for i, line in enumerate(f):
            if i >= limit:
                break
            w = line.split(' ')[0]
            out.setdefault(w, i + 1)
    return out


def load_tatoeba(eng_path, tha_path, links_path):
    """Returns (eng: {id: text}, tha: {id: text}, pairs: [(tha_id, eng_id)])."""
    def read(path):
        out = {}
        with bz2.open(path, 'rt', encoding='utf-8') as f:
            for line in f:
                parts = line.rstrip('\n').split('\t')
                if len(parts) >= 3:
                    out[int(parts[0])] = parts[2]
        return out
    eng = read(eng_path)
    tha = read(tha_path)
    pairs = []
    with bz2.open(links_path, 'rt', encoding='utf-8') as f:
        for line in f:
            a, b = line.split()
            a, b = int(a), int(b)
            if a in tha and b in eng:
                pairs.append((a, b))
    return eng, tha, pairs
