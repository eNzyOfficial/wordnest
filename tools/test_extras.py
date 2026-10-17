"""Headless checks for the online extras (needs internet). Serve the repo first, then:
    python3 tools/test_extras.py [base_url]"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765/'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'test-shots')
results = []


def check(name, ok, extra=''):
    results.append(ok)
    print(('PASS ' if ok else 'FAIL ') + name + (f'  ({extra})' if extra else ''), flush=True)


with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', args=['--autoplay-policy=no-user-gesture-required'])
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    # Picture + web extras on a noun
    page.goto(BASE + '#/w/en-en/elephant')
    page.wait_for_selector('.entry .hw')
    try:
        page.wait_for_selector('#xPic:not(.hidden) img', timeout=15000)
        check('picture shown for elephant', True, page.locator('#xPic figcaption').inner_text()[:90])
    except Exception:
        check('picture shown for elephant', False)
    try:
        page.wait_for_selector('#xWeb .web-row', timeout=15000)
        check('related words and rhymes shown', True, page.locator('#xWeb').inner_text().replace('\n', ' ')[:120])
    except Exception:
        check('related words and rhymes shown', False, page.locator('#xWeb').inner_text()[:120] if page.locator('#xWeb').count() else 'section removed')
    try:
        page.wait_for_function("document.querySelector('#xAudio') && /,/.test(document.querySelector('#xAudio').textContent)", timeout=15000)
        check('recording credit with author and licence', True, page.locator('#xAudio').inner_text()[:100])
    except Exception:
        check('recording credit with author and licence', False, page.locator('#xAudio').inner_text()[:100] if page.locator('#xAudio').count() else '')
    time.sleep(1)
    page.screenshot(path=os.path.join(OUT, '30-elephant.png'))
    page.evaluate("document.querySelector('#main').scrollTop = 99999")
    time.sleep(0.3)
    page.screenshot(path=os.path.join(OUT, '31-elephant-web.png'))

    # Play a Commons recording: it should end up in the audio cache
    page.click('.entry-head .spk')
    n = 0
    for _ in range(30):
        n = page.evaluate("caches.open('dict-audio').then(c => c.keys()).then(k => k.length)")
        if n:
            break
        time.sleep(0.5)
    check('played recording is cached', n > 0, f'{n} cached')

    # More from Tatoeba
    page.goto(BASE + '#/x/en-th/eat')
    page.wait_for_selector('#moreTatoeba')
    before = page.locator('.exlist.big .ex').count()
    page.click('#moreTatoeba')
    page.wait_for_function(f"document.querySelectorAll('.exlist.big .ex').length > {before} || !document.querySelector('#moreTatoeba')", timeout=20000)
    after = page.locator('.exlist.big .ex').count()
    check('more from Tatoeba adds sentences', after > before, f'{before} -> {after}')
    page.evaluate("document.querySelector('#main').scrollTop = 99999")
    time.sleep(0.3)
    page.screenshot(path=os.path.join(OUT, '32-more-tatoeba.png'))

    # Offline: web section shows a note, cached recording still plays from the cache
    page.goto(BASE + '#/w/en-en/elephant')
    page.wait_for_selector('.entry .hw')
    page.wait_for_function('navigator.serviceWorker && navigator.serviceWorker.controller', timeout=15000)
    page.reload()  # load once under the service worker so the word's chunk is cached
    page.wait_for_selector('.entry .hw', timeout=10000)
    ctx.set_offline(True)
    page.reload()
    page.wait_for_selector('.entry .hw', timeout=10000)
    time.sleep(0.5)
    note = page.locator('#xWeb').inner_text() if page.locator('#xWeb').count() else ''
    check('offline note instead of web extras', 'online' in note.lower(), note[:80])
    check('no picture offline', page.locator('#xPic:not(.hidden)').count() == 0)
    played = page.evaluate("""async () => { const k = (await (await caches.open('dict-audio')).keys())[0].url;
        const b = await speech.cachedBlob(k, false); return b.size; }""")
    check('cached recording readable offline', played > 1000, f'{played} bytes')
    ctx.set_offline(False)

    # Settings toggles and offline audio box
    page.goto(BASE + '#/offline')
    page.wait_for_selector('#audioBox')
    check('offline screen lists pronunciation downloads', 'common words' in page.locator('#audioBox').inner_text())
    page.screenshot(path=os.path.join(OUT, '33-offline-audio.png'))
    page.goto(BASE + '#/settings')
    page.wait_for_selector('[data-toggle="pictures"]')
    page.click('[data-toggle="pictures"]')
    page.goto(BASE + '#/w/en-en/dog')
    page.wait_for_selector('.entry .hw')
    check('pictures can be switched off', page.locator('#xPic').count() == 0)
    page.goto(BASE + '#/sources')
    page.wait_for_selector('.prose h3')
    txt = page.locator('.prose').inner_text()
    check('sources page credits online services', all(x in txt for x in ['Datamuse', 'Free Dictionary', 'Wikidata', 'Tatoeba API']))
    browser.close()

print('page errors:', errors or 'none')
print(f'{sum(results)}/{len(results)} checks passed')
sys.exit(0 if all(results) and not errors else 1)
