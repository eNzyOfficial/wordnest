"""Write sources.html (the in-app Sources and licences page) with the full notices from licences/."""
import html
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SOURCES = [
    ('Wiktionary', 'https://en.wiktionary.org', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/',
     'English definitions, pronunciations, word forms and synonyms; Thai translations; Thai entries with romanisation, IPA and classifiers. '
     'Content by Wiktionary contributors, extracted with Wiktextract by Tatu Ylonen (<a href="https://kaikki.org">kaikki.org</a>).'),
    ('Volubilis Multilingual Thai Dictionary', 'https://belisan-volubilis.blogspot.com/', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/',
     'Thai-English entries and the reverse English-Thai index. VOLUBILIS Multilingual Thai Dict. and Database by Belisan (Francis Bastien), v26.2.'),
    ('Open English WordNet', 'https://en-word.net', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/',
     'English definitions, examples and synonyms. Based on Princeton WordNet; notice below.'),
    ('Thai WordNet (NICT)', 'https://github.com/omwn/omw-data', 'Thai WordNet licence', None,
     'Extra Thai equivalents for English senses, via the Open Multilingual Wordnet. Notice below.'),
    ('CMUdict', 'https://github.com/cmusphinx/cmudict', 'BSD-style', None,
     'US pronunciations where Wiktionary has none (converted from ARPAbet to IPA). Notice below.'),
    ('Tatoeba', 'https://tatoeba.org', 'CC BY 2.0 FR', 'https://creativecommons.org/licenses/by/2.0/fr/',
     'Example sentences in English and English-Thai pairs, by Tatoeba contributors.'),
    ('ALT Parallel Corpus (NICT)', 'https://opus.nlpl.eu/ALT/en&th/v20191206/ALT', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/',
     'English-Thai example sentences from the Asian Language Treebank parallel corpus, via OPUS.'),
    ('FrequencyWords', 'https://github.com/hermitdave/FrequencyWords', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/',
     'Word frequency lists by Hermit Dave, used to rank suggestions, show frequency stars and pick the word of the day.'),
    ('Wikimedia Commons', 'https://commons.wikimedia.org', 'Per file', None,
     'Recorded pronunciations are played from Wikimedia Commons when you are online and are not stored in the app. '
     'Each file page on Commons lists its author and licence. Offline, your device voice reads the word instead.'),
]

NOTICES = [('Princeton WordNet and Open English WordNet', 'princeton-wordnet.txt'),
           ('Thai WordNet', 'thai-wordnet.txt'),
           ('CMUdict', 'cmudict.txt')]


def main():
    out = ['<h2>Sources and licences</h2>',
           '<p>Wordnest is built only from open data. The dictionary data is a combination of the sources below, '
           'filtered, merged and shortened for offline use, and is shared under '
           '<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. '
           'Wordnest is an independent project and is not affiliated with any of these sources or with any other dictionary app.</p>']
    for name, url, lic, lic_url, desc in SOURCES:
        lic_html = f'<a href="{lic_url}">{html.escape(lic)}</a>' if lic_url else html.escape(lic)
        out.append(f'<h3><a href="{url}">{html.escape(name)}</a></h3><p>{desc}<br><small>Licence: {lic_html}</small></p>')
    out.append('<h2>Licence notices</h2>')
    for title, fn in NOTICES:
        with open(os.path.join(ROOT, 'licences', fn), encoding='utf-8') as f:
            out.append(f'<h3>{html.escape(title)}</h3><div class="notice">{html.escape(f.read().strip())}</div>')
    out.append('<h2>Citations</h2><p><small>Tatu Ylonen. "Wiktextract: Wiktionary as Machine-Readable Structured Data". LREC 2022, pp. 1317-1325.<br>'
               'McCrae et al. "English WordNet 2019 - An Open-Source WordNet for English". GWC 2019.<br>'
               'S. Thoongsup et al. "Thai WordNet construction". 7th Workshop on Asian Language Resources, 2009.</small></p>')
    with open(os.path.join(ROOT, 'sources.html'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')


if __name__ == '__main__':
    main()
