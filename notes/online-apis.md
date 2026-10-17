# Online APIs: terms, licences, attribution, limits

Researched 2026-10-17 for a free, non-commercial, static (GitHub Pages) dictionary
app that calls these services directly from the browser. Quotes are from the
official pages unless marked otherwise.

## 1. Free Dictionary API (dictionaryapi.dev)

Status
- 2026-10-17: https://api.dictionaryapi.dev/api/v2/entries/en/hello returns HTTP 522
  (Cloudflare origin timeout). The homepage https://dictionaryapi.dev/ still returns 200.
- Open GitHub issues: "522" (#253, 2026-10-06), "502 Error For All Request"
  (2026-09-17), "Getting timeouts today" (#249, 2026-08-26), "CORS Error" (#241,
  2025-10). No maintainer response visible.
- Repo meetDeveloper/freeDictionaryAPI: last push 2023-11-27, last commit
  2023-01-01, 109 open issues, not archived. Single maintainer asking for
  donations because of AWS costs ("more than 10 million requests per month").
- Treat as unmaintained / unreliable. Use only as an optional source with a
  timeout and graceful fallback.

Code licence
- GPL-3.0 (repo LICENSE). Only matters if you copy their code; calling the API
  does not make your app GPL.
- Note: the code in the repo is the old v1 scraper (modules/dictionary.js
  scrapes a Google endpoint, audio from ssl.gstatic.com). The live v2 service
  is NOT that code and its source is not published.

Data licence
- v2 responses are derived from Wiktionary. Each entry carries:
  - `license`: {"name": "CC BY-SA 3.0", "url": "https://creativecommons.org/licenses/by-sa/3.0"}
  - `sourceUrls`: ["https://en.wiktionary.org/wiki/<word>"]
  (Confirmed by third-party copies of responses; could not be re-fetched live
  because of the 522.)
- So the text is CC BY-SA 3.0 (Wiktionary is now CC BY-SA 4.0 plus GFDL; the API
  labels 3.0). Requirement: credit Wiktionary contributors, link the source page,
  name and link the licence, and share-alike any adapted definitions you
  redistribute (e.g. if you bundle or cache them into a downloadable dataset).

Audio
- v2 `phonetics[]` items have `text`, `audio`, and, when audio is present,
  `sourceUrl` and `license` ({name, url}). Audio files are served from
  api.dictionaryapi.dev/media/pronunciations/... and are copies of Wikimedia
  Commons pronunciation files (sourceUrl points to a commons.wikimedia.org
  page; licences are typically CC BY-SA 3.0/4.0 or CC BY). This comes from
  earlier observed responses; it could not be checked live today. Use the
  per-item `license` and `sourceUrl` when present; `audio` is often "".
- Old v1 / README examples point at ssl.gstatic.com (Google) audio with no
  licence; do not use those.

Usage limits
- None documented. No API key. No terms of use page.

Attribution requested by the maintainer
- None stated. Licence-driven attribution still applies (Wiktionary CC BY-SA,
  Commons audio per file).

Recommended attribution text
- Per entry: `Definitions from Wiktionary (<a href="{sourceUrls[0]}">source</a>), CC BY-SA 3.0 (<a href="https://creativecommons.org/licenses/by-sa/3.0">licence</a>), via Free Dictionary API (dictionaryapi.dev).`
- Per audio: `Audio: <a href="{phonetics[i].sourceUrl}">Wikimedia Commons</a>, {phonetics[i].license.name}`

## 2. Datamuse API (https://www.datamuse.com/api/)

Terms (quoted from the page, 2026-10-17)
- "Until January 1, 2027, you can use this service without restriction and
  without an API key for up to 100,000 requests per day. Please be aware that
  beyond that limit, requests may be rate-limited without notice."
- New banner: "starting February 1, 2027, an API key will be required in all
  requests, and access will be limited to 100,000 requests per day per API key.
  If you are a current user of the API and you do not already have an API key,
  please reach out to our feedback form with a description of your application."
- "If you'd like to use this in a customer-facing application, or if you need a
  custom vocabulary, or if you plan to make more than 100,000 requests per day,
  please describe your application (and a traffic estimate) in a message to us."
- No SLA: "we cannot commit to any improvements and may not be able to respond
  to all support requests."
- Privacy: query logs kept temporarily, discarded at end of the following day.

Implications for a static browser app
- An API key embedded in public client-side code is visible to everyone. Ask
  Datamuse (feedback form) for a key now, explain it is a public static site,
  and design the app to work when Datamuse is unavailable after 2027-02-01.
- CORS: responses reflect the Origin header (access-control-allow-origin:
  <your origin>), so browser calls work.

Attribution
- "If you use the API within a publicly available app, kindly acknowledge the
  Datamuse API within your app's documentation." (A request, not a licence
  condition; documentation or About page is enough.)
- Recommended text: `Word suggestions powered by the Datamuse API (https://www.datamuse.com/api/).`

Data sources (as listed; Datamuse states no licences for its output)
- CMU Pronouncing Dictionary (BSD-style licence) - phonetics, sounds-like.
- Google Books Ngrams (CC BY 3.0) - language model, some relations.
- word2vec - topic reranking, means-like backfill.
- Paraphrase Database PPDB "XXL" lexical paraphrases (CC BY 3.0).
- WordNet 3.0 (WordNet licence, permissive BSD-like, keep copyright notice).
- Dozens of online dictionaries crawled by OneLook (for "ml").
- Definitions (md=d): WordNet and Wiktionary (via wiktextract). Wiktionary
  definitions are CC BY-SA; if you show Datamuse definitions, credit
  "Definitions from WordNet 3.0 (Princeton University) and Wiktionary
  (CC BY-SA)".

## 3. Wikipedia REST, Wikidata, Commons

Wikipedia REST page summary
- https://en.wikipedia.org/api/rest_v1/page/summary/{title} works (200,
  access-control-allow-origin: *, allowed headers include api-user-agent,
  cache-control s-maxage=1209600, max-age=300). Follows redirects
  (Avuncular redirects to Avunculate). Includes `wikibase_item` (Wikidata QID).
- Content licence: Wikipedia text CC BY-SA 4.0 (and GFDL). Credit: article
  title, "Wikipedia", link to the article, licence link.
- Recommended text: `From the Wikipedia article "<a href="{content_urls.desktop.page}">{title}</a>", CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).`

User-Agent rules (Policy:Wikimedia Foundation User-Agent Policy, edited 2026-03-27)
- "Browser-based applications written in JavaScript are typically forced to
  send the same User-Agent header as the browser that hosts them. This is not a
  violation of policy, however such applications are encouraged to include the
  Api-User-Agent header to supply an appropriate agent."
- So from the browser send:
  `Api-User-Agent: DictApp/1.0 (https://<user>.github.io/<repo>/; <contact email or repo issues URL>)`
  It is allowed in CORS preflight for REST and Action APIs.
- Do not try to set User-Agent itself (browsers forbid it).
- Action API (Wikidata, Commons api.php): add `origin=*` for anonymous CORS.

Rate limits
- mediawiki.org Wikimedia_APIs/Rate_limits (new in 2026, "subject to
  experimentation and change"): applies to Action API and REST APIs.
  - Requests from a web browser by an unauthenticated user: 200 requests/minute.
  - Unauthenticated bots with compliant User-Agent: 200 requests/minute.
  - Unidentified requests (only IP): 10 requests/minute.
- Wikitech Robot policy (bots, edited 2026-03-16): REST unauthenticated
  concurrency 3 and under 5 req/s; Action API unauthenticated concurrency 1 and
  under 5 req/s; media from upload.wikimedia.org total concurrency <= 2 and
  <= 25 Mbps; prefer standard thumbnail sizes; prefer cached URLs (no extra
  query params).
- Per user a dictionary lookup needs 1 summary + 1 wbgetclaims + 1 imageinfo,
  well inside 200/min. Debounce typing and cache responses.

Wikidata (wbgetclaims P18)
- https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=Q42&property=P18&format=json&origin=*
  returns claims.P18[].mainsnak.datavalue.value = Commons file name ("Douglas adams portrait.jpg").
- Licence: "All structured data (i.e. the main, Property, Lexeme, and
  EntitySchema namespaces) is released into the public domain under Creative
  Commons Zero." No attribution required. Optional courtesy: "Data from
  Wikidata (CC0)".
- The P18 value is only a file name: the image itself has its own Commons
  licence (not CC0).

Commons (imageinfo + extmetadata)
- https://commons.wikimedia.org/w/api.php?action=query&titles=File:{name}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=320&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|AttributionRequired|Credit|UsageTerms|Copyrighted|ImageDescription&format=json&origin=*
- Useful fields: imageinfo[0].thumburl, url, descriptionurl,
  descriptionshorturl, extmetadata.Artist.value (HTML, strip tags or sanitize),
  LicenseShortName.value ("CC BY-SA 2.0"), LicenseUrl.value,
  AttributionRequired.value ("true"/"false"), Credit.value (HTML), UsageTerms.
- Observed 2026-10: thumburl now on thumb.wikimedia.org and URLs carry utm_*
  query params; originals still on upload.wikimedia.org.
- Commons:Credit_line: reusers "must provide credit line with license and
  author"; the URI is required "to the extent reasonably practicable". Format
  flexible "as long as all required components are present". Examples:
  "John Doe / CC-BY-SA-3.0" (licence linked), "Marble Lady by John Doe /
  CC-BY-2.5". Public domain: no attribution required, courtesy
  "John Doe / Public Domain" (no (c) symbol).
- Commons:Reusing content outside Wikimedia: follow the creator's specified
  attribution if any; credit the creator (Artist), not the uploader.
- Recommended text (TASL: title, author, source, licence):
  `Image: <a href="{descriptionurl}">{File title}</a> by {Artist (text)}, {LicenseShortName} (<a href="{LicenseUrl}">licence</a>), via Wikimedia Commons`
  If AttributionRequired is "false" / public domain: `Image: {Artist} / Public domain, via Wikimedia Commons`.
- Do not show images whose LicenseShortName is missing or "Fair use".

## 4. Tatoeba API (https://api.tatoeba.org)

Terms and stability
- OpenAPI (https://api.tatoeba.org/openapi.json): "This API is currently
  read-only, but open to the public without authentification." Contact
  team@tatoeba.org.
- "Stable endpoints use the /v1 prefix: it is safe to build upon them.
  Unstable endpoints use the /unstable prefix: these may change at any point"
  "all /v1 endpoints can also be used with /unstable prefix instead."
- Sentence search is now stable: GET /v1/sentences (use /v1, not /unstable).
  Unstable: /unstable/audios, /unstable/users/{username}. Stable:
  /v1/sentences/{id}, /v1/audios/{id}/file.
- No published numeric rate limit. tatoeba.org Terms of Use: "It is forbidden
  to make an automated use of our Website that can overload and slow down our
  services." Debounce and cache.
- CORS: access-control-allow-origin: * on JSON and audio files.

Parameters (v1/sentences)
- Required: `lang`, `sort` (relevance|words|created|modified|random, prefix -
  to reverse). Without sort you get 400 "Required parameter "sort" missing".
- Useful: `q` (Manticore syntax), `trans:lang=tha` (only sentences with Thai
  translations), `showtrans` (matching|all|none, default matching),
  `showtrans:lang`, `has_audio=yes`, `is_unapproved=no`, `is_orphan=no`,
  `limit`, `after` (cursor), `include=audios,transcriptions` (audios are NOT
  returned unless you pass include=audios).
- `license` filter: sentences with licensing issues are excluded by default.

Requested query result
- `/unstable/sentences?lang=eng&q=avuncular&trans:lang=tha` returns 400 (sort missing).
- With `&sort=relevance` returns {"data":[],"paging":{"total":0,"has_next":false}}
  (no Thai translation exists).
- Without trans:lang there is one English hit:
  {"id":1513855,"text":"His avuncular mien endears him to small children.",
  "lang":"eng","script":null,"license":"CC BY 2.0 FR","owner":"darinmex",
  "is_unapproved":false}

JSON shape (from /v1/sentences?lang=eng&q=uncle&trans:lang=tha&sort=relevance&has_audio=yes&include=audios)
```
{
  "data": [
    {
      "id": 10472713,
      "text": "My uncle works in a lighthouse.",
      "lang": "eng",
      "script": null,
      "license": "CC BY 2.0 FR",          // or "CC0 1.0"
      "owner": "AlanF_US",                 // null if orphan
      "is_unapproved": false,
      "transcriptions": [ {"script","text","needsReview","type","html"} ],
      "audios": [
        {
          "id": 932020,
          "author": "CK",
          "license": "CC BY-NC-ND 3.0",     // per recording; may be null/other
          "attribution_url": "http://www.manythings.org/tatoeba",
          "download_url": "https://api.tatoeba.org/v1/audio/932020/file",
          "created": "2021-11-11T04:24:56+00:00",
          "modified": "2021-11-11T04:24:56+00:00"
        }
      ],
      "translations": [
        {
          "id": 12715855, "text": "...", "lang": "tha", "script": null,
          "license": "CC BY 2.0 FR", "owner": "superteenkai",
          "is_unapproved": false, "is_direct": false,
          "transcriptions": [], "audios": []
        }
      ]
    }
  ],
  "paging": { "total": 5, "has_next": true, "next": "https://api.tatoeba.org/v1/sentences?...&after=10094%2C10472713" }
}
```
Gotchas
- Live audio objects use `license`; the OpenAPI schema says `licence`. Read both.
- `download_url` returned by the API (/v1/audio/{id}/file) is 404 today; the
  working path is https://api.tatoeba.org/v1/audios/{id}/file (audio/mpeg,
  CORS *). Build the URL from the id.
- `translations` is a flat array (older /unstable responses nested it as an
  array of arrays); `is_direct` tells direct vs indirect.

Licences
- Sentences: default CC BY 2.0 FR; some CC0 1.0 (per sentence `license`).
  Terms: reuse "is only allowed if the name of the author is cited" and "it is
  your responsibility to circulate it with its license."
- Audio: per recording (`audios[].license`), set per contributor. Many are
  CC BY-NC-ND 3.0 (e.g. CK via manythings.org) - fine for a free
  non-commercial app if played unmodified with attribution; do not re-encode,
  trim or bundle into a commercial product. Some audio has no reuse licence
  (license null): do not play/cache those outside tatoeba.org. Terms: "The BY
  mention is also the basic requirement for audio".

Recommended attribution text
- Sentence: `Sentence #{id} by {owner} from Tatoeba (https://tatoeba.org/en/sentences/show/{id}), {license}`
  (CC BY 2.0 FR link: https://creativecommons.org/licenses/by/2.0/fr/)
- Audio: `Audio by {author} (<a href="{attribution_url}">{attribution_url}</a>), {license}, via Tatoeba`
  Fall back to https://tatoeba.org/en/user/profile/{author} if attribution_url is empty.

## 5. Hotlinking / caching upload.wikimedia.org audio in Cache Storage

- Commons:Reusing content outside Wikimedia/technical: hotlinking is "allowed
  from Wikimedia servers, but is not generally recommended" (files can be
  changed, renamed or deleted); "In general, it is recommended to download
  files for reuse." Licences still apply when hotlinking.
- Not allowed: "hot spider" services that proxy each search on another site to
  Commons.
- Robot policy limits (concurrency <= 2, <= 25 Mbps, prefer standard thumbnail
  sizes) target bots; a user pressing play or saving a word for offline is
  normal browser traffic. Do not prefetch or bulk-download audio in the
  background; cache only what the user plays or explicitly saves.
- upload.wikimedia.org sends access-control-allow-origin: *, so fetch() gives a
  non-opaque response that can be stored with the Cache Storage API.
- Caching a copy locally on the user's device is a private copy of a freely
  licensed file; it is consistent with CC BY / CC BY-SA. Keep the attribution
  (author, licence, Commons file page URL) stored next to the cached file and
  show it when playing offline.
- Use the canonical URL without extra query params (strip utm_* if you want
  a stable cache key, though Wikimedia now adds them itself), send
  Api-User-Agent on API calls (not needed on upload.wikimedia.org file GETs,
  and adding custom headers to media GETs forces a CORS preflight).
- Verdict: acceptable, with attribution retained and user-driven, modest
  request volumes.

## Sources
- https://github.com/meetDeveloper/freeDictionaryAPI (README, LICENSE, issues #241, #249, #253)
- https://dictionaryapi.dev/
- https://dev.to/trushmi/how-to-use-free-dictionary-api-gec (sample v2 response)
- https://www.datamuse.com/api/
- https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy
- https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits
- https://wikitech.wikimedia.org/wiki/Robot_policy
- https://www.mediawiki.org/wiki/Wikimedia_REST_API
- https://www.wikidata.org/wiki/Wikidata:Licensing
- https://commons.wikimedia.org/wiki/Commons:Credit_line
- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/technical
- https://api.tatoeba.org/openapi.json
- https://tatoeba.org/en/terms_of_use
