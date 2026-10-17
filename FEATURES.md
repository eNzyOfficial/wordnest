# LINE Dictionary (LINE Dict) - research notes

## About

- What: free bilingual dictionary apps branded "LINE Dictionary" / "LINE Dict", built and
  operated by NAVER Corp. on NAVER Dictionary data and tech, marketed with LINE branding and
  LINE Friends characters (Brown, Cony, Sally, Moon, Leonard, Jessica). Developer on both
  stores was "NAVER Corp."; support mail linedict@naver.com, linedictcnen@naver.com,
  linedictenth@naver.com. PC web version at www.linedict.com (later linedict.naver.com).
- Launched 2014 (Wikipedia, Naver Dictionary article). Earliest archived Play listing for the
  Indonesian app: Aug 2014; Chinese app v1.3.0 updated 2014-10-14.
- Android had separate apps per pair:
  - com.naver.android.globaldict - "LINE Kamus Inggris" (English-Indonesian). 1M+ installs,
    4.2-4.5 stars, ~54k ratings. Claimed "ranked 1st in Google Play Education" in Indonesia.
  - com.naver.android.globaldictenth - "LINE Dictionary: English-Thai". 1M+ installs, 4.4
    stars, ~52k ratings (2016).
  - com.naver.android.globaldictcnen - "LINE dictionary: Chinese-Eng". 100k+ installs, 4.5.
- iOS had one combined app (id904908129) "LINE Dictionary : English - Thai, Chinese,
  Indonesian" with 3 dictionaries: CN-EN/EN-CN, EN-ID/ID-EN, EN-TH/TH-EN (v1.4.2, Mar 2015).
- No evidence found of Japanese or Korean pairs in LINE Dict; Korean/Japanese pairs existed
  only in NAVER's own Korean-market dictionary apps. Chinese was simplified only, so Taiwan
  users were not a target (inferred).
- Shutdown:
  - English-Indonesian: ended 2019-05-30 "due to the termination of main contents contract".
    Users pointed to NAVER English-Indonesian Dictionary on the web (dict.naver.com/eniddict)
    and could get their Word Card list by email.
  - English-Thai and Chinese-English: discontinued 2023-10-18 (final app updates carry the
    notice). Users pointed to NAVER English-Thai / English-Chinese dictionaries (free on
    mobile and PC, offline, Oxford content). No official reason given; likely NAVER folding
    LINE-branded services back into NAVER Dictionary (inferred).
- Content sources: EN-TH used Oxford River Books English-Thai, SE-ED Thai-English
  (Prof. Dr. Wit), Lexitron (NECTEC): 300k+ words, 7M+ examples. EN-ID: 200-220k headwords,
  7.2M examples, 50k native audio files, 100k+ headwords offline. CN-EN: Collins, ~3M
  headwords, 150k examples.

## Feature list

Search
- Instant autocomplete list while typing; matched prefix shown in green, rest black, short
  translation in grey on same row. (Core)
- Reversible search: either language can be typed into the same box; pair header shows
  "English <-> Thai". (Core)
- Offline brief definitions in autocomplete (word + short meaning + speaker icon); full entry
  needs network (later EN-ID got full offline). (Core)
- Swipe a suggestion row to reveal a bookmark (save to Word card) action. (Nice-to-have)
- Handwriting input for Chinese (green brush icon in search bar, candidate grid 5 per row,
  paging 1/2). (Nice-to-have)
- Thai-English pronunciation search (type Thai transliteration of English). (Nice-to-have)
- Search history saved automatically. (Core)

Word detail
- Header: frequency stars (one or two), big green headword, US and UK phonetics each with
  speaker button; HSK level badge for Chinese; "strokes" play button for Chinese. (Core)
- Derivative / conjugation accordion: Present, Past, Past participle, Present participle.
  (Core)
- Definition section grouped by part of speech (small blue "adj." / "n." label), numbered
  black circle bullets, "Examples" toggle switch to show/hide examples inline. (Core)
- Example sentences with speaker icon, headword highlighted green, translation underneath
  in smaller grey. "Source: SE-ED" style attribution line. (Core)
- "Usage example(s) >" sticky bottom bar opening the full example list with count (e.g.
  155,478), tagged by type (General | Proverbs | Quotes). (Core)
- Pop-up dictionary: tap any word inside an example; dark bottom sheet shows word, phonetic,
  speaker and short meaning, with close X. (Nice-to-have)
- Synonyms/antonyms, idioms, phrases (listed in store copy). (Core)
- Chinese: word decomposition (each character with pinyin, HSK badge, meaning), stroke order
  animation screen. (Nice-to-have)
- "..." overflow menu top right of entry (share to LINE / Facebook / Twitter). (Nice-to-have)

Learning and daily content
- Today's Expression / Today's Conversation: dated dialogue (A/B speakers in coloured
  circles), Translation toggle, "Listen all" button, previous-day arrow. (Nice-to-have)
- Today's Quote, Today's Proverb. (Nice-to-have)
- Word card (wordbook): list with headword, phonetic, short meaning, speaker; "N words" count;
  "Clear" in header; swipe left to reveal grey trash delete. (Core)
- Words Up! course study: steps, word-tile quizzes, result screen "Excellent 5 Correct 0
  Incorrect", reminder notifications with adjustable timer. (Nice-to-have)
- English quiz, dictation, Listen & Repeat (mic pronunciation practice). (Nice-to-have)
- User translation: users translate example sentences and rate others. (Nice-to-have)

Tools
- Translator (beta): language pair bar with swap, input card, blue result card, per-word
  breakdown list below; history and share icons in header. (Nice-to-have)
- Chinese sentence parser: paste sentence, "Analyze", segmented words with pinyin and a
  word list. (Nice-to-have)
- Settings gear, "Keep screen" (keep awake) toggle in drawer. (Nice-to-have)
- No ads (selling point). Share to LINE/Facebook/Twitter. (Nice-to-have)
- Not seen: dark theme, widgets, camera/OCR, voice search, LINE account sync, downloadable
  packs (offline data was bundled). (Skip)

## Layout and flow

Navigation model: no bottom tab bar. Left hamburger opens a drawer (seen):
"LINE Dict" title + settings gear on green; pair line "Chinese <-> English" in green;
items "Dictionary", "Sentence parser", "Word card" (EN-ID also "Translator"); "Keep screen"
toggle pinned at bottom on grey.

Home (partly inferred from the drawer screenshot background)
- Green app bar; small outlined pair badge "CN-EN" at top right (seen).
- Below: grey/white search field with magnifier on the right (seen, partly).
- Below search: daily content cards (Today's Expression / Quote) in white blocks on light
  grey separators (inferred).

Search / suggestions
- Green header containing a white rounded-rect input, clear X, optional pen icon.
- Under header: 3-cell pair bar "English | <-> | Thai" (grey bg, green double arrow).
- First row: exact match, larger, with [phonetic] in grey and speaker icon; then
  one-line rows "headword  short meaning" separated by thin grey dividers.

Word detail
- Same green search header (hamburger + input), "..." at top right of white card.
- Stars, headword ~36-40px green bold, then "US [..] (speaker)  UK [..] (speaker)".
- Section headers in bold small black on white with dark rule above: "Derivative" (chevron),
  "Definition" (Examples toggle), "Word Decomposition" for Chinese.
- Sticky bottom "Usage example >" bar, white, centered.

Usage examples list
- Sub header "< Usage example ..." under search header; cards with speaker + sentence
  (headword bold), tag line "General | Proverbs", translation, user avatar, "View more"
  pill button outlined in grey with green text.

Word card (wordbook)
- Green header "Word card" centered, "Clear" right, hamburger left; grey strip "8 words";
  rows: word + [IPA] grey + speaker right + 2-line grey meaning; swipe to delete.

History
- Auto-saved search words (store copy); separate history screen not seen.
- Seen (Chinese app): with the search box empty, a grey "Word card" label with bookmark icon
  appears under the pair bar, followed by saved word rows (word [pinyin], meaning, speaker).
  So the empty-search state doubles as quick access to saved words.

Settings
- Gear in drawer header; contents not seen. Notification (Words Up reminder) settings
  existed per user reviews (inferred location).

Language picker
- Android: one app per pair, so no global picker; direction auto-detected. iOS combined app:
  pair chosen in drawer ("Chinese <-> English" line) with "CN-EN" badge on home (inferred
  for iOS). Translator swaps via the middle swap button.

## Visual style

- Brand green app bar and accents ~#2BC52B / LINE green #00C300 range (sampled visually,
  approx). Headwords and matched prefixes in the same green.
- Background white; section separators light grey (#E5E5E5 range); pair bar grey #F2F2F2.
- Secondary text mid grey (#888); POS labels small blue (#3A8FD6 approx).
- Translator result card solid sky blue (#4AABE5 approx) with white text.
- Sentence parser buttons/result in dark slate (#3F4659 approx).
- Dark bottom sheet (~#333, 90% opacity) for pop-up lookup, word highlighted yellow.
- Type: system sans (Roboto on Android, Helvetica Neue on iOS); big headword, 15-17px body,
  12px meta. Rounded LINE logotype for "LINE Dict".
- Icons: thin outline style - speaker with sound waves, X clear, hamburger, "...", chevrons,
  green toggle switch (white pill, green knob), numbered black circle bullets, bookmark
  ribbon, trash can, brush pen, share arrow, clock (history).
- Spacing: full-width list rows ~48-56px, 16px side padding, hairline dividers, flat (no
  shadows except drawer). App icon: green rounded square, white "LINE Dict" text.
- Marketing art uses LINE Friends stickers; not part of the app UI itself.

## Sources

- Play (archived) EN-ID 2014: https://web.archive.org/web/20140818163645/https://play.google.com/store/apps/details?id=com.naver.android.globaldict
- Play (archived) EN-ID 2015: https://web.archive.org/web/20150324051044/https://play.google.com/store/apps/details?id=com.naver.android.globaldict
- Play (archived) EN-ID shutdown notice 2019: https://web.archive.org/web/20190720095756/https://play.google.com/store/apps/details?id=com.naver.android.globaldict
- Play (archived) EN-TH 2016: https://web.archive.org/web/20160703143052/https://play.google.com/store/apps/details?id=com.naver.android.globaldictenth
- Play (archived) EN-TH 2020: https://web.archive.org/web/20200304110617/https://play.google.com/store/apps/details?id=com.naver.android.globaldictenth
- Play (archived) CN-EN 2014/2020: https://web.archive.org/web/20141224015242/https://play.google.com/store/apps/details?id=com.naver.android.globaldictcnen
  and https://web.archive.org/web/20201108121043/https://play.google.com/store/apps/details?id=com.naver.android.globaldictcnen
- iOS (archived): https://web.archive.org/web/20150401040941/https://itunes.apple.com/th/app/line-dictionary-english-thai/id904908129?mt=8
- Shutdown notice EN-TH: https://cafebazaar.ir/app/com.naver.android.globaldictenth
- Shutdown notice CN-EN: https://cafebazaar.ir/app/com.naver.android.globaldictcnen?l=en
- Store copy mirror: https://www.bluestacks.com/campaign/com.naver.android.globaldictenth/es
- Install stats: https://mixrank.com/playstore/apps/com.naver.android.globaldict
- Words Up launch (Thai, 2015-05-12): https://www.siamphone.com/contents/news-22562.html
- Review (CN-EN): https://dtieao.uab.cat/txicc/echinese/en/details/57
- Naver Dictionary: https://en.wikipedia.org/wiki/Naver_Dictionary
