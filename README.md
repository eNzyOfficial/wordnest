# Wordnest

An installable, offline-capable English-Thai and English-English dictionary
(PWA), modelled on the layout and flow of the discontinued LINE Dictionary app,
with an original name and visuals, built entirely from open data.

- `index.html`, `style.css`, `js/`: the app (plain JavaScript, no build step)
- `sw.js`, `manifest.json`, `icons/`: offline cache and install metadata
- `data/`: generated dictionary chunks (CC BY-SA 4.0, see DATA_SOURCES.md)
- `build/`: Python scripts that turn the raw sources into `data/`
- `tools/test_ui.py`: headless phone-size smoke test
- `FEATURES.md`: research notes on the original app
- `DATA_SOURCES.md`: sources, licences and attribution
- `DEPLOY.md`: publishing on GitHub Pages
