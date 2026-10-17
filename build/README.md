# Data build

Python 3.9+ standard library only. Raw downloads live outside the repo:

    dict-raw/
      kaikki/english.jsonl.gz      kaikki.org English (523 MB, optional: --no-wkt-en)
      kaikki/thai.jsonl.gz         kaikki.org Thai
      volubilis/volubilis.xlsx     VOLUBILIS Mundo.xlsx
      wordnet/oewn-2025.xml.gz     Open English WordNet
      thwn/omw-th/omw-th.xml       Thai WordNet (from omw-th-2.0.tar.xz)
      cmudict/cmudict.dict
      tatoeba/eng_sentences.tsv.bz2, tha_sentences.tsv.bz2, tha-eng_links.tsv.bz2, eng-tha_links.tsv.bz2
      opus/alt/ALT.en-th.en, ALT.en-th.th
      freq/en_50k.txt, th_50k.txt  FrequencyWords 2018

URLs are in ../DATA_SOURCES.md. Then:

    python3 -I build/build.py --raw ~/Desktop/dict-raw
    python3 -I build/make_sources.py

## Output format

`data/dicts.json` lists dictionaries. Each one is in `data/<id>/<build>/`:

- `meta.json`: entry count, first key of every chunk (binary search), word of the day pool
- `top.json.gz`: most frequent words per 1 and 2 character prefix (instant suggestions)
- `i/N.json.gz`: sorted index rows `[key, headword, short gloss, frequency rank]`
- `e/N.json.gz`: `{key: entry}` for the same keys

Keys are normalised the same way in `common.py` and `js/search.js`. To add a
language, write a loader that yields entries in the schema documented at the
top of `build.py` and call `write_dict()` with a new id; the app lists
whatever `dicts.json` contains.
