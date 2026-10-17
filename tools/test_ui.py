"""Headless phone-size smoke test. Serve the repo first, e.g.
    python3 -m http.server 8765 --bind 127.0.0.1
then run: python3 tools/test_ui.py [base_url]
Screenshots go to test-shots/ (git-ignored)."""
import os
import sys
import time

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765/'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'test-shots')
os.makedirs(OUT, exist_ok=True)
errors = []
offline_flag = [False]
checks = []


def check(name, ok):
    checks.append((name, bool(ok)))
    print(('PASS ' if ok else 'FAIL ') + name, flush=True)


def shot(page, name):
    page.screenshot(path=os.path.join(OUT, name + '.png'))


with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
                              color_scheme='light', locale='en-US')
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    # While offline, the browser logs a failed load for chunks that were never downloaded; that is expected.
    page.on('console', lambda m: m.type == 'error' and not (offline_flag[0] and 'Failed to load resource' in m.text)
            and errors.append(m.text + ' @ ' + str(m.location.get('url'))))

    page.goto(BASE)
    page.wait_for_selector('.wotd-word', timeout=15000)
    shot(page, '01-home')
    check('home shows word of the day', page.locator('.wotd-word').inner_text().strip())

    # Instant suggestions
    page.fill('#q', 'hou')
    page.wait_for_selector('#v-suggest .row', timeout=10000)
    time.sleep(0.4)
    shot(page, '02-suggest-en')
    words = page.locator('#v-suggest .row-w').all_inner_texts()
    check('suggestions for "hou" include house', any(w.split(' [')[0].strip() == 'house' for w in words))

    # Exact match row + open word page
    page.fill('#q', 'house')
    page.wait_for_selector('#v-suggest .row.exact', timeout=10000)
    time.sleep(0.5)
    page.press('#q', 'Enter')
    page.wait_for_selector('.entry .hw', timeout=10000)
    time.sleep(0.3)
    shot(page, '03-word-house')
    check('word page headword is house', page.locator('.entry .hw').inner_text() == 'house')
    check('word page has Thai translations', page.locator('.entry .d .th').count() > 0)
    check('usage examples bar visible', page.locator('#bottombar').is_visible())
    page.evaluate("document.querySelector('#main').scrollTop = 600")
    time.sleep(0.2)
    shot(page, '04-word-house-scrolled')

    # Save to Word card
    page.click('#markBtn')
    check('bookmark toggles on', 'on' in page.get_attribute('#markBtn', 'class'))

    # Thai search
    page.fill('#q', 'บ้า')
    page.wait_for_selector('#v-suggest .row', timeout=10000)
    time.sleep(0.4)
    shot(page, '05-suggest-th')
    check('pair bar flips for Thai input', 'rev' in page.get_attribute('#pairbar', 'class'))
    page.goto(BASE + '#/w/en-th/' + 'บ้าน')
    page.wait_for_selector('.entry .hw', timeout=10000)
    time.sleep(0.3)
    shot(page, '06-word-thai')
    check('Thai word page shows romanisation', 'bâan' in page.locator('.entry .prons').inner_text())

    # Tap a word in an example for the quick lookup panel
    tw = page.locator('.entry .tw').first
    if tw.count():
        tw.click()
        page.wait_for_selector('#peek.show', timeout=5000)
        time.sleep(0.3)
        shot(page, '07-peek')
        check('quick lookup panel opens', page.locator('#peek.show').count() == 1)
        page.keyboard.press('Escape')

    # Usage examples screen
    page.goto(BASE + '#/x/en-th/house')
    page.wait_for_selector('.exlist.big', timeout=10000)
    shot(page, '08-examples')
    check('examples list has rows', page.locator('.exlist.big .ex').count() > 0)

    # Did you mean
    page.goto(BASE + '#/')
    page.wait_for_selector('.wotd-word', timeout=10000)
    page.fill('#q', 'dictionery')
    page.wait_for_selector('#v-suggest .empty', timeout=10000)
    time.sleep(0.5)
    shot(page, '09-did-you-mean')
    check('did you mean offers dictionary', 'dictionary' in page.locator('#v-suggest').inner_text())

    # Switch to English-English
    page.click('#clearBtn')
    page.click('#pairbar')
    page.wait_for_selector('#pairSheet.show')
    time.sleep(0.3)
    shot(page, '10-pair-sheet')
    page.click('.pair-opt[data-id="en-en"]')
    page.goto(BASE + '#/w/en-en/run')
    page.wait_for_selector('.entry .hw', timeout=10000)
    time.sleep(0.3)
    shot(page, '11-word-en-en')
    check('English-English shows definitions', page.locator('.entry .sense').count() > 3)

    # Word card, history, drawer
    page.goto(BASE + '#/cards')
    page.wait_for_selector('#v-cards.active')
    shot(page, '12-word-card')
    check('word card lists house', 'house' in page.locator('#v-cards').inner_text())
    page.goto(BASE + '#/history')
    page.wait_for_selector('#v-history.active')
    shot(page, '13-history')
    check('history lists looked-up words', page.locator('#v-history .row').count() >= 2)
    page.goto(BASE + '#/')
    page.click('#menuBtn')
    time.sleep(0.4)
    shot(page, '14-drawer')
    page.mouse.click(375, 420)

    # Dark theme
    page.goto(BASE + '#/settings')
    page.wait_for_selector('.seg[data-setting="theme"]')
    page.click('.seg[data-setting="theme"] button[data-v="dark"]')
    check('dark theme applied', page.evaluate("document.documentElement.dataset.theme") == 'dark')
    shot(page, '15-settings-dark')
    page.goto(BASE + '#/w/en-th/house')
    page.wait_for_selector('.entry .hw', timeout=10000)
    time.sleep(0.3)
    shot(page, '16-word-dark')
    page.goto(BASE + '#/')
    page.wait_for_selector('.wotd-word', timeout=10000)
    time.sleep(0.3)
    shot(page, '17-home-dark')

    # Sources page
    page.goto(BASE + '#/sources')
    page.wait_for_selector('.prose h3', timeout=10000)
    check('sources page lists Volubilis', 'Volubilis' in page.locator('.prose').inner_text())

    # Offline: service worker controls the page, then go offline and look up a cached word
    page.goto(BASE + '#/')
    page.wait_for_function('navigator.serviceWorker && navigator.serviceWorker.controller', timeout=15000)
    page.reload()
    page.wait_for_selector('.wotd-word', timeout=10000)
    page.goto(BASE + '#/w/en-th/house')
    page.wait_for_selector('.entry .hw', timeout=10000)
    ctx.set_offline(True)
    offline_flag[0] = True
    page.reload()
    page.wait_for_selector('.entry .hw', timeout=10000)
    check('word page loads offline after first visit', page.locator('.entry .hw').inner_text() == 'house')
    page.fill('#q', 'hous')
    page.wait_for_selector('#v-suggest .row', timeout=10000)
    check('suggestions work offline for cached chunks', page.locator('#v-suggest .row').count() > 0)
    shot(page, '18-offline')
    ctx.set_offline(False)

    browser.close()

print()
print('console/page errors:', errors or 'none')
failed = [n for n, ok in checks if not ok]
print(f'{len(checks) - len(failed)}/{len(checks)} checks passed')
sys.exit(1 if failed or errors else 0)
