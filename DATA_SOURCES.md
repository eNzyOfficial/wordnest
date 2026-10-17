# Data sources and licences

Wordnest combines several open dictionary sources. The built data under `data/` is a
derivative of share-alike sources (Wiktionary, Volubilis, FrequencyWords), so the data
bundle as a whole is released under **CC BY-SA 4.0**
(https://creativecommons.org/licenses/by-sa/4.0/). Changes made: entries were filtered,
merged, reordered, shortened and converted to compact JSON. The app code is separate
from the data.

The same information is shown in the app under Menu > Sources and licences
(`sources.html`). Full notices that must travel with copies are in `licences/`.

| Source | Used for | Licence | Share-alike | Attribution to show |
|---|---|---|---|---|
| Wiktionary, extracted by Wiktextract (kaikki.org), English and Thai entries | English definitions, IPA, word forms, synonyms, Thai translations of English words, Thai entries with romanisation, IPA and classifiers | CC BY-SA 4.0 (also GFDL) | Yes | "Wiktionary contributors, https://en.wiktionary.org, CC BY-SA 4.0; extracted with Wiktextract (kaikki.org)" |
| Volubilis Multilingual Thai Dictionary v26.2 (Belisan, Francis Bastien) | Thai-English entries and reverse English-Thai entries, romanisation, classifiers | CC BY-SA 4.0 | Yes | "VOLUBILIS Multilingual Thai Dict. and Database by Belisan (Francis Bastien), CC BY-SA 4.0, https://belisan-volubilis.blogspot.com/" |
| Open English WordNet 2025 | English definitions, examples, synonyms | CC BY 4.0, plus the Princeton WordNet licence | No | "Open English WordNet (CC BY 4.0) and Princeton WordNet"; notice in `licences/princeton-wordnet.txt` |
| Thai WordNet (NICT), via Open Multilingual Wordnet 2.0 | Extra Thai equivalents for English WordNet senses | WordNet-style permissive licence | No | "Thai WordNet Copyright 2011 by the National Institute of Information and Communications Technology (NICT). All rights reserved." plus the notice in `licences/thai-wordnet.txt` |
| CMUdict | US pronunciations (ARPAbet converted to IPA) when Wiktionary has none | BSD-style | No | Notice in `licences/cmudict.txt` |
| Tatoeba | Example sentences (English, English-Thai pairs) | CC BY 2.0 FR | No | "Sentences from Tatoeba (https://tatoeba.org), CC BY 2.0 FR" |
| SCB-MT-EN-TH-2020 (VISTEC, SCB), clean subsets only: task_master_1, generated_reviews_*, assorted_government | English-Thai example sentences | CC BY-SA 4.0 | Yes | "scb-mt-en-th-2020 by VISTEC / SCB (airesearch.in.th), CC BY-SA 4.0" |
| Tatoeba sentence recordings (linked, not bundled) | Human voice for English example sentences, streamed when online | Per recording: CC BY-NC-ND 3.0, CC BY-NC 4.0, CC BY 4.0, CC BY-SA 4.0 or CC0 | No | Speaker name and licence shown under each recorded example, linking to their Tatoeba profile. Played unmodified in a free, non-commercial app; recordings with no reuse licence are skipped. If the app is ever monetised, drop the NC/ND recordings. |
| ALT Parallel Corpus (NICT, via OPUS) | English-Thai example sentences | CC BY 4.0 | No | "Asian Language Treebank (ALT) Parallel Corpus, NICT, CC BY 4.0, via OPUS (https://opus.nlpl.eu)" |
| FrequencyWords (Hermit Dave), 2018 en and th 50k lists | Ranking suggestions, frequency stars, word of the day | CC BY-SA 4.0 (content) | Yes | "FrequencyWords by Hermit Dave, CC BY-SA 4.0, https://github.com/hermitdave/FrequencyWords" |
| Wikimedia Commons audio (linked, not bundled) | Recorded pronunciations, streamed when online | Per file (mostly CC BY-SA) | Per file | Played from upload.wikimedia.org; each file page on Commons names its author and licence. Offline, the device's own voice is used instead. |

## Download URLs and versions

- Wiktionary English: https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz (523 MB, dump of 2026-09-02)
- Wiktionary Thai: https://kaikki.org/dictionary/Thai/kaikki.org-dictionary-Thai.jsonl.gz (8.6 MB)
- Volubilis: https://sourceforge.net/projects/belisan/files/VOLUBILIS%20Mundo.xlsx/download (12 MB, v26.2, July 2026)
- Open English WordNet: https://github.com/globalwordnet/english-wordnet/releases/download/2025-edition/english-wordnet-2025.xml.gz
- Thai WordNet: https://github.com/omwn/omw-data/releases/download/v2.0/omw-th-2.0.tar.xz
- CMUdict: https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict
- Tatoeba: https://downloads.tatoeba.org/exports/per_language/ (eng_sentences, tha_sentences, eng-tha and tha-eng links)
- SCB-MT-EN-TH-2020: https://github.com/vistec-AI/dataset-releases/releases/download/scb-mt-en-th-2020_v1.0/scb-mt-en-th-2020.zip (106 MB)
- Tatoeba recordings list: https://downloads.tatoeba.org/exports/sentences_with_audio.tar.bz2
- ALT: https://object.pouta.csc.fi/OPUS-ALT/v20191206/moses/en-th.txt.zip
- FrequencyWords: https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt and .../th/th_50k.txt

## Citations

- Tatu Ylonen. "Wiktextract: Wiktionary as Machine-Readable Structured Data". LREC 2022, pp. 1317-1325.
- McCrae, Rademaker, Bond, Rudnicka, Fellbaum. "English WordNet 2019 - An Open-Source WordNet for English". GWC 2019.
- S. Thoongsup et al. "Thai WordNet construction". 7th Workshop on Asian Language Resources, 2009.

## Considered and left out

- LEXiTRON (NECTEC): no published licence; redistribution needs written permission.
- SCB-MT-EN-TH-2020 subsets with their own upstream terms (paracrawl, nus_sms, msr_paraphrase, mozilla_common_voice, wikipedia, thai_websites, apdf).
- OpenSubtitles and TED parallel text: unclear or no-derivatives terms.
- Royal Institute dictionary: copyrighted.
- Bundled Commons audio: possible later with per-file credits; for now audio is streamed and the device voice is the offline fallback.

## Rebuilding

Raw downloads go in a folder outside the repo (default `~/Desktop/dict-raw`, layout in
`build/README.md`), then:

    python3 -I build/build.py --raw ~/Desktop/dict-raw

Add `--no-wkt-en` to skip the 523 MB English Wiktionary dump (English-English then uses
WordNet only and English-Thai loses Wiktionary's translation tables).
