# Data source licences (Thai-English, English-Thai, English-English)

Checked 2026-10-17 against official pages, GitHub APIs and HTTP HEAD requests.
Sizes are Content-Length from HEAD (MB = 10^6 bytes) unless stated otherwise.
Scope: English and Thai only. Japanese, Chinese and Korean sources were dropped.

## Summary table

| Name | Licence | Licence URL | Attribution to show | Share-alike? | Download URL | Size | Notes |
|---|---|---|---|---|---|---|---|
| Wiktionary via Wiktextract / kaikki.org (English) | CC BY-SA 4.0 and GFDL (dual, same as Wiktionary) | https://en.wiktionary.org/wiki/Wiktionary:Copyrights | "Dictionary data from Wiktionary (https://en.wiktionary.org), CC BY-SA 4.0, extracted with Wiktextract via kaikki.org" | Yes | https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz | 523 MB gz (3.34 GB raw .jsonl) | Includes the "translations" field with Thai (lang_code th) equivalents for English entries |
| Wiktionary via kaikki.org (Thai) | CC BY-SA 4.0 and GFDL | https://en.wiktionary.org/wiki/Wiktionary:Copyrights | as above | Yes | https://kaikki.org/dictionary/Thai/kaikki.org-dictionary-Thai.jsonl.gz | 8.6 MB gz (50.5 MB raw) | 17,629 Thai words; has romanisation and IPA in "sounds" |
| Open English WordNet 2025 | CC BY 4.0 (plus Princeton WordNet licence for underlying data) | https://creativecommons.org/licenses/by/4.0/ | "Open English WordNet (c) 2019-present The Open English WordNet Team, CC BY 4.0; based on Princeton WordNet 3.1 (c) 2011 Princeton University" | No | https://github.com/globalwordnet/english-wordnet/releases/download/2025-edition/english-wordnet-2025.xml.gz | 11.4 MB | JSON zip also available (10.0 MB) |
| Princeton WordNet 3.0 / 3.1 | WordNet License (BSD-like, permissive) | https://wordnet.princeton.edu/license-and-commercial-use | Copyright notice "WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved." (3.1: 2011) plus licence text | No | https://wordnetcode.princeton.edu/3.0/WordNet-3.0.tar.gz and https://wordnetcode.princeton.edu/wn3.1.dict.tar.gz | 11.5 MB / 16.4 MB | Prefer OEWN; frozen since 2011 |
| Thai WordNet (OMW, NICT) | NICT Thai WordNet licence (WordNet-style, permissive) | https://github.com/omwn/omw-data/blob/main/wns/tha/LICENSE | "Thai WordNet Copyright 2011 by the National Institute of Information and Communications Technology (NICT). All rights reserved." plus the licence text | No | https://github.com/omwn/omw-data/releases/download/v2.0/omw-th-2.0.tar.xz | 3.0 MB | Linked to PWN 3.0 synsets, so it gives Thai-English mappings |
| Tatoeba sentences (eng, tha) | CC BY 2.0 FR (subset CC0 1.0) | https://creativecommons.org/licenses/by/2.0/fr/ | "Example sentences from Tatoeba (https://tatoeba.org), CC BY 2.0 FR" plus sentence ID / author | No | https://downloads.tatoeba.org/exports/per_language/tha/tha_sentences_detailed.tsv.bz2 | Thai 116 kB; English 34.9 MB | English sentences file 24.9 MB (non-detailed) |
| Tatoeba links eng-tha | CC BY 2.0 FR | as above | as above | No | https://downloads.tatoeba.org/exports/per_language/eng/eng-tha_links.tsv.bz2 | 29 kB | Mirror: tha-eng_links.tsv.bz2 |
| CMUdict | BSD 2-clause style (CMU) | https://github.com/cmusphinx/cmudict/blob/master/LICENSE | "Copyright (C) 1993-2015 Carnegie Mellon University. All rights reserved." plus licence text | No | https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict | 3.6 MB | ARPABET; US English |
| Wikimedia Commons audio | Per file (mostly CC BY-SA 3.0/4.0, CC0, some GFDL) | https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia | Per file: author, licence name and link, link to file page | Depends on file (no for the app, yes for modified audio) | https://upload.wikimedia.org/... (per file, URLs are in kaikki "sounds") | per file | Hotlinking "possible but not recommended" |
| Volubilis (Belisan / Francis Bastien) | CC BY-SA 4.0 | https://creativecommons.org/licenses/by-sa/4.0/ | "VOLUBILIS Multilingual Thai Dict. and Database by Belisan (Francis Bastien), CC BY-SA 4.0, https://belisan-volubilis.blogspot.com/" | Yes | https://sourceforge.net/projects/belisan/files/VOLUBILIS%20Mundo.xlsx/download | 12.0 MB (.xlsx); .ods 15.7 MB | v26.2 (Jul 2026), about 114,000 entries; Thai, romanised Thai, English and others |
| LEXiTRON (NECTEC) | Not stated (all rights reserved, NECTEC copyright) | none published | n/a | n/a | none (site under construction) | n/a | Do NOT use without written permission |
| PyThaiNLP word lists (words_th, tnc_freq, ttc_freq, syllables) | CC0 1.0 | https://creativecommons.org/publicdomain/zero/1.0/ | none required (credit PyThaiNLP as courtesy) | No | https://raw.githubusercontent.com/PyThaiNLP/pythainlp/dev/pythainlp/corpus/words_th.txt | 1.5 MB (tnc_freq 1.6 MB) | See per-source notes for other files |
| PyThaiNLP thai_dict (from Thai Wiktionary) | CC BY-SA 4.0 | https://creativecommons.org/licenses/by-sa/4.0/ | "Thai dictionary from Thai Wiktionary via PyThaiNLP, CC BY-SA 4.0" | Yes | https://github.com/PyThaiNLP/pythainlp-corpus/releases/download/thai_dict-v1.0/thai_dictionary.csv | 4.8 MB | Thai-Thai definitions |
| thai2rom romanisation dataset | CC0 1.0 | https://creativecommons.org/publicdomain/zero/1.0/ | none required | No | https://raw.githubusercontent.com/wannaphong/thai-romanization/master/dataset/data.csv | 39.6 MB | Thai word to RTGS romanisation pairs |
| SCB-MT-EN-TH-2020 (via OPUS) | CC BY-SA 4.0 | https://creativecommons.org/licenses/by-sa/4.0/ | "scb-mt-en-th-2020 by VISTEC / SCB10X (airesearch.in.th), CC BY-SA 4.0" | Yes | https://object.pouta.csc.fi/OPUS-SCB_MT_EN_TH/v1.0/moses/en-th.txt.zip | 101 MB zip | About 1M pairs; some sub-sources have own terms |
| ALT Parallel Corpus (NICT, via OPUS) | CC BY 4.0 | https://creativecommons.org/licenses/by/4.0/ | "Asian Language Treebank (ALT) Parallel Corpus, NICT, CC BY 4.0" | No | https://object.pouta.csc.fi/OPUS-ALT/v20191206/moses/en-th.txt.zip | 2.4 MB | 18,088 pairs; Wikinews sentences |
| hermitdave/FrequencyWords | Content CC BY-SA 4.0 (code MIT) | https://creativecommons.org/licenses/by-sa/4.0/ | "Frequency lists by Hermit Dave (github.com/hermitdave/FrequencyWords), from OpenSubtitles 2018, CC BY-SA 4.0" | Yes | https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt and .../2018/th/th_50k.txt | en 623 kB, th 1.5 MB | en_full.txt 20 MB; no th_full |
| wordfreq data | Data CC BY-SA 4.0 (code Apache 2.0) | https://github.com/rspeer/wordfreq#license | "Word frequencies from wordfreq by Robyn Speer, CC BY-SA 4.0" plus its source credits | Yes | pip package (pypi.org/project/wordfreq) | n/a | Frozen at 2021 data (SUNSET.md); no Thai list in the README |

## Per-source notes

### 1. Wiktionary via Wiktextract / kaikki.org
- Licence: kaikki.org says "This data is made available under the same licenses as Wiktionary - both CC-BY-SA and GFDL." Wiktionary:Copyrights now names CC BY-SA 4.0 and GFDL 1.1 or later. Choose CC BY-SA 4.0 (simpler than GFDL).
- Share-alike: yes. Your built dictionary bundle (derived data) must be released under CC BY-SA 4.0. App code can stay under any licence.
- Attribution: name Wiktionary, link https://en.wiktionary.org, name the licence with link, and note changes. kaikki asks that you link the relevant kaikki.org page(s). Per-entry links to the Wiktionary page are good practice.
- Downloads (per-language, post-processed, from the English Wiktionary dump of 2026-09-02):
  - English: https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl (3,335,546,346 bytes) and .jsonl.gz (523,331,798 bytes).
  - Thai: https://kaikki.org/dictionary/Thai/kaikki.org-dictionary-Thai.jsonl (50,456,126 bytes) and .jsonl.gz (8,557,000 bytes).
  - All languages raw: https://kaikki.org/dictionary/rawdata.html (23.9 GB, or 2.8 GB .gz).
  - Thai Wiktionary edition extract: listed on the rawdata page (th-extract.jsonl.gz) if wanted for Thai-Thai definitions.
- English to Thai: use the English JSONL "translations" arrays filtered to code "th". Thai to English: Thai JSONL glosses are in English.
- Citation requested for academic use: Tatu Ylonen. "Wiktextract: Wiktionary as Machine-Readable Structured Data". Proceedings of the 13th Conference on Language Resources and Evaluation (LREC), pp. 1317-1325, Marseille, 20-25 June 2022.

### 2. Open English WordNet and Princeton WordNet
- OEWN: CC BY 4.0, with the Princeton WordNet licence kept for the underlying data. LICENSE.md: "You may share and adapt this resource providing attribution is given to both Princeton WordNet and the Open English Wordnet team."
- Latest release: 2025-edition (2025-12-31). Assets:
  - https://github.com/globalwordnet/english-wordnet/releases/download/2025-edition/english-wordnet-2025.xml.gz (11,363,503 bytes)
  - https://github.com/globalwordnet/english-wordnet/releases/download/2025-edition/english-wordnet-2025-json.zip (9,986,555 bytes)
  - "plus" variants add Open English Namenet (Wikidata-derived names): english-wordnet-2025-plus.xml.gz (12.9 MB)
  - Previous: https://github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz (12.9 MB)
  - Mirror used by the wn package: https://en-word.net/static/english-wordnet-2025.xml.gz
- Citation: McCrae, Rademaker, Bond, Rudnicka, Fellbaum (2019), "English WordNet 2019 - An Open-Source WordNet for English", GWC 2019.
- Princeton WordNet: permission to use, copy, modify and distribute for any purpose without fee, provided the copyright notice, statements and disclaimer appear on all copies. The name Princeton may not be used in advertising. Not share-alike. (Official licence page returned HTTP 403 to automated fetch. Text checked via WNDB_License.txt in the OEWN repo.)

### 3. Thai WordNet (Open Multilingual Wordnet)
- Created by NICT (Thai Computational Linguistics Laboratory). Licence is WordNet-style: use, copy, modify and distribute for any purpose, provided the notice "Thai WordNet Copyright 2011 by the National Institute of Information and Communications Technology (NICT). All rights reserved." and the disclaimer appear on all copies. NICT name not for advertising.
- Download: https://github.com/omwn/omw-data/releases/download/v2.0/omw-th-2.0.tar.xz (2,981,056 bytes; OMW v2.0, 2026-02-01). Source tab file: https://github.com/omwn/omw-data/tree/main/wns/tha (wn-data-tha.tab, 5.1 MB).
- Also bundled in PyThaiNLP as wordnet_th.db (11.2 MB), same licence.
- Citation: S. Thoongsup et al., "Thai WordNet construction", 7th Workshop on Asian Language Resources, 2009.
- Quality note: largely machine-assisted from PWN; check entries before relying on it.

### 4. Tatoeba
- Sentences: CC BY 2.0 FR. Part of the corpus is also CC0 1.0 (https://downloads.tatoeba.org/exports/sentences_CC0.tar.bz2, 8.0 MB). Audio licences are chosen per contributor; if the licence field is empty the audio may not be reused outside Tatoeba.
- Attribution: credit Tatoeba with a link to https://tatoeba.org and the licence. Good practice: link each sentence (https://tatoeba.org/en/sentences/show/ID) and show the contributor username (in *_sentences_detailed.tsv).
- Share-alike: no for CC BY 2.0 FR.
- Files (per-language exports, updated weekly):
  - https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2 (24.9 MB)
  - https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_detailed.tsv.bz2 (34.9 MB)
  - https://downloads.tatoeba.org/exports/per_language/tha/tha_sentences.tsv.bz2 (72 kB)
  - https://downloads.tatoeba.org/exports/per_language/tha/tha_sentences_detailed.tsv.bz2 (116 kB)
  - https://downloads.tatoeba.org/exports/per_language/eng/eng-tha_links.tsv.bz2 (29 kB)
  - https://downloads.tatoeba.org/exports/per_language/tha/tha-eng_links.tsv.bz2 (29 kB)
  - Audio list: https://downloads.tatoeba.org/exports/sentences_with_audio.tar.bz2 (6.4 MB), includes username, licence and attribution URL.
- Thai coverage is small (about 1,200 eng-tha pairs per OPUS Tatoeba v2026-07-08).

### 5. CMUdict
- Licence: BSD 2-clause style. "Copyright (C) 1993-2015 Carnegie Mellon University. All rights reserved." Redistributions must keep the notice, conditions and disclaimer (in the docs for binary/derived forms).
- URL: https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict (3,618,488 bytes). Licence: https://github.com/cmusphinx/cmudict/blob/master/LICENSE
- Not share-alike.

### 6. Wikimedia Commons audio (Wiktionary pronunciation files)
- Licence varies per file (often CC BY-SA 3.0 or 4.0, CC0, sometimes GFDL; Lingua Libre recordings are usually CC BY-SA 4.0). Check each file page (or the Commons API imageinfo extmetadata: Artist, LicenseShortName, LicenseUrl).
- Attribution per Commons: credit the creator (not the uploader), name the licence (link it where the licence requires), follow any attribution format the author specified, and link the file page. See https://commons.wikimedia.org/wiki/Commons:Credit_line
- Hotlinking: Commons says direct embedding is "possible but is not recommended". Wikimedia now enforces its User-Agent policy and rate limits on upload.wikimedia.org, which browsers fetching from a static site cannot control. For an offline app, bundle a curated set of files with a credits file instead of streaming. Light on-demand streaming with per-file attribution is legally fine, but may be throttled.
- Share-alike: playing the unmodified file inside the app is not an adaptation. Transcoded or trimmed files under BY-SA must stay BY-SA.
- kaikki "sounds" entries give ogg_url and mp3_url on upload.wikimedia.org plus the Commons file name. The bulk audio tar is 20.4 GB (https://kaikki.org/dictionary/rawdata.html).

### 7. Volubilis (Thai)
- Licence: the official blog says "VOLUBILIS MULTILINGUAL THAI DICT. & DATABASE by Belisan is licensed under CC BY-SA 4.0". SourceForge does not show a licence field. PyThaiNLP also documents it as CC BY-SA 4.0.
- Share-alike: yes.
- Formats: spreadsheets (.xlsx; original .ods). Columns include Thai, romanised Thai (own system, documented in "Volubilis Thai Romanization.pdf"), English, French and more.
- Downloads (SourceForge project "belisan", files dated 2026-07-01, v26.2):
  - https://sourceforge.net/projects/belisan/files/VOLUBILIS.ods/download (15.7 MB)
  - https://sourceforge.net/projects/belisan/files/VOLUBILIS%20Mundo.xlsx/download (12.0 MB, about 114,000 entries, 18 languages)
  - https://sourceforge.net/projects/belisan/files/VOLUBILIS%20Database.xlsx/download (10.8 MB)
  - https://sourceforge.net/projects/belisan/files/Volubilis%20Duo/VOLUBILIS%20Duo%20Max%20ENG.xlsx/download (8.6 MB, Thai-English, Nov 2024)
  - Home page: https://belisan-volubilis.blogspot.com/ (next version 26.3 planned Nov 2026)
- Probably the best open Thai-English core lexicon.

### 8. LEXiTRON (NECTEC)
- No licence, terms or download page found. lexitron.nectec.or.th is "Site Under Construction" with only "(c) 2025 NECTEC". NECTEC's general terms say reproduction needs prior written permission. Language Grid lists LEXiTRON services as non-profit / research use only.
- Conclusion: redistribution is not allowed without permission. Do not bundle LEXiTRON or data derived from it (watch for "lexitron" in third-party word lists). Ask NECTEC (info@nectec.or.th) if you want it.

### 9. PyThaiNLP corpora
- Licence summary: https://github.com/PyThaiNLP/pythainlp/blob/dev/pythainlp/corpus/corpus_license.md and catalogue https://github.com/PyThaiNLP/pythainlp-corpus
- CC0 1.0 (PyThaiNLP-created): words_th.txt (1.5 MB), tnc_freq.txt (Thai National Corpus word frequencies, 1.6 MB), ttc_freq.txt (Thai Textbook Corpus, 434 kB), syllables_th.txt, stopwords_th.txt, countries_th.txt, thailand_provinces_th.csv. Base URL: https://raw.githubusercontent.com/PyThaiNLP/pythainlp/dev/pythainlp/corpus/
- CC0 1.0: thai2rom-dataset https://raw.githubusercontent.com/wannaphong/thai-romanization/master/dataset/data.csv (39.6 MB); thai_synonym https://raw.githubusercontent.com/PyThaiNLP/thai-synonym/master/data.csv (39 kB); oscar_icu word frequencies https://github.com/PyThaiNLP/pythainlp-corpus/releases/download/oscar_icu-v1.0/oscar_word_freq.csv (99.8 MB); TNC bigram/trigram lists.
- CC BY-SA 4.0: thai_dict (Thai Wiktionary) https://github.com/PyThaiNLP/pythainlp-corpus/releases/download/thai_dict-v1.0/thai_dictionary.csv (4.8 MB); volubilis_words_th.txt; wikipedia_titles_th.txt; Thai names lists.
- G2P data: https://raw.githubusercontent.com/PyThaiNLP/lexicon-thai/master/G2P/wiktionary-11-2-2020.tsv (781 kB), Thai word to phoneme pairs. The catalogue says CC BY 4.0, but it is taken from Wiktionary, so treat it as CC BY-SA 4.0.
- Licence not stated in corpus_license.md: orst_words_th.txt (Royal Institute word list) and th_en_transliteration_v1.4.tsv. Ask before bundling these.
- Unicode ICU Thai word list (icubrk_th.txt): Unicode License (permissive, keep the notice).
- Code (romanize RTGS, transliterate to IPA) is Apache 2.0. Running it at build time to make romanisation is fine. FastThaiG2P IPA dictionary: Apache 2.0.
- No Thai-English bilingual dictionary in PyThaiNLP. Thai WordNet is the closest.

### 10. Parallel corpora for English-Thai example sentences (OPUS)
- OPUS API listing: https://opus.nlpl.eu/opusapi/?source=en&target=th&preprocessing=moses&version=latest
- Safe to use:
  - SCB-MT-EN-TH-2020 v1.0: CC BY-SA 4.0, 988,260 pairs. https://object.pouta.csc.fi/OPUS-SCB_MT_EN_TH/v1.0/moses/en-th.txt.zip (101 MB). Origin: https://huggingface.co/datasets/airesearch/scb_mt_enth_2020 . Some sub-sources (NUS SMS, MSR Paraphrase, Common Voice, ParaCrawl) have their own upstream terms; the cleanest subsets are generated_reviews_*, task_master_1 and assorted_government.
  - ALT Parallel Corpus: CC BY 4.0 (NICT), 18,088 pairs. https://object.pouta.csc.fi/OPUS-ALT/v20191206/moses/en-th.txt.zip (2.4 MB). Note: the ALT treebank files are CC BY-NC-SA 4.0. Only the parallel corpus is CC BY.
  - Tatoeba (see above), translatewiki (31k pairs, CC BY), wikimedia (66k pairs, CC BY-SA).
- Avoid or check first: OpenSubtitles v2024 (24.8M pairs, no clear licence, subtitles are copyrighted); TED2020 / NeuLab-TedTalks / QED (TED is CC BY-NC-ND 4.0, unverified here; ND is risky for excerpting); CCAligned / ParaCrawl-Bonus (web crawl, noisy, unclear rights); bible-uedin and Tanzil (mixed terms).

### 11. Frequency lists
- hermitdave/FrequencyWords: README says "MIT License for code. CC-by-sa-4.0 for content." (GitHub repo licence shows MIT; follow the README for data). Built from OpenSubtitles 2018. Files: https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt (623 kB), .../content/2018/th/th_50k.txt (1.5 MB), .../content/2018/en/en_full.txt (20 MB). Share-alike: yes.
- wordfreq: code Apache 2.0; data "may be redistributed under a Creative Commons Attribution-ShareAlike 4.0 license". Includes SUBTLEX, Google Books Ngrams, OpenSubtitles, Wikipedia, etc. with credits required (see README License section). Data frozen around 2021. No Thai list found in the README. Use for English.
- Thai: PyThaiNLP tnc_freq.txt / ttc_freq.txt (CC0) and oscar_word_freq.csv (CC0). These are the most permissive option.
- SUBTLEX-US on its own: academic use. Use it through wordfreq (redistribution permission documented there) rather than directly.

### 12. Other Thai pronunciation / romanisation options
- kaikki Thai JSONL: IPA, Paiboon-style and RTGS romanisations from Wiktionary (CC BY-SA 4.0). Probably the best open Thai pronunciation source.
- Volubilis romanisation column (CC BY-SA 4.0).
- thai2rom dataset (CC0) and PyThaiNLP RTGS romaniser (Apache 2.0 code) for words not covered.
- Commons / Lingua Libre Thai recordings (per-file licence, mostly CC BY-SA 4.0).

## Practical licensing plan
- The combined dictionary data bundle will be CC BY-SA 4.0 (Wiktionary, Volubilis, SCB-MT and FrequencyWords require it). CC BY, CC0 and BSD/WordNet-style sources are compatible inside a BY-SA bundle as long as their notices are kept.
- Ship a CREDITS/ATTRIBUTION page listing every source, author, licence and link, with the full WordNet, Thai WordNet and CMUdict notices quoted verbatim.
- Keep app code under its own licence (for example MIT) and state that data files are CC BY-SA 4.0.
- Exclude LEXiTRON, OpenSubtitles-derived sentences and TED-derived sentences.
