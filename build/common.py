"""Helpers shared by the build scripts."""
import re
import unicodedata

THAI = re.compile(r'[฀-๿]')


def is_thai(s):
    return bool(THAI.search(s))


def norm(s):
    """Search key: lowercase, accents stripped for Latin text, curly quotes and
    extra spaces folded. Thai is left as is apart from whitespace.
    Must match norm() in app/js/search.js."""
    s = s.strip().lower().replace('’', "'").replace('‘', "'")
    s = re.sub(r'\s+', ' ', s)
    if not is_thai(s):
        s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s
