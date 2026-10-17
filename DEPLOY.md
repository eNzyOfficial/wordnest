# Deploying to GitHub Pages

Wordnest is a static site with no build step for the app itself. Everything is
served from the repository root with relative paths, so it works under a
project subpath such as `https://<user>.github.io/<repo>/`.

## One-time setup

1. Create an empty repository on GitHub (for example `wordnest`).
2. Add it as a remote and push the `main` branch:

       git remote add origin git@github.com:<user>/<repo>.git
       git push -u origin main

3. On GitHub: Settings > Pages > Build and deployment > Source: "Deploy from a
   branch", Branch: `main`, folder `/ (root)`. Save.
4. After a minute the site is live at `https://<user>.github.io/<repo>/`.
   Open it on a phone and use "Add to Home Screen" (iOS Safari) or "Install app"
   (Android Chrome).

The empty `.nojekyll` file stops Pages from running Jekyll, so every file is
served as is.

## Size limits

GitHub Pages allows sites up to 1 GB and warns about files over 50 MB (hard
limit 100 MB). The dictionary data is split into small gzip chunks (about
20-60 KB each); see `data/dicts.json` for the total per dictionary. Check before
pushing:

    du -sh data
    find . -path ./.git -prune -o -type f -size +5M -print

## Updating

- App files changed: bump `VERSION` in `sw.js` and the `?v=` query strings in
  `index.html`, then commit and push. Installed apps pick up the new version on
  their next launch and reload once.
- Data rebuilt: run `python3 -I build/build.py`, commit the new `data/`
  folder and push. Each dictionary lives under `data/<id>/<build>/`, where
  `<build>` is a content hash, so old chunks are replaced cleanly and phones
  drop the old offline copy automatically.

## Test locally

    python3 -m http.server 8765 --bind 127.0.0.1
    python3 tools/test_ui.py http://127.0.0.1:8765/

Service workers need `http://localhost`/`127.0.0.1` or HTTPS.
