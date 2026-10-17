"""Fail if docs or code contain em or en dashes (house style: plain ASCII punctuation)."""
import os
import sys

BAD = (chr(0x2014), chr(0x2013))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
found = []
for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ('.git', 'data', 'test-shots', '__pycache__')]
    for f in files:
        if f.endswith(('.md', '.js', '.py', '.html', '.css', '.json')):
            path = os.path.join(root, f)
            with open(path, encoding='utf-8') as fh:
                for n, line in enumerate(fh, 1):
                    if any(c in line for c in BAD):
                        found.append(f'{os.path.relpath(path, ROOT)}:{n}')
print('\n'.join(found) or 'no dashes found')
sys.exit(1 if found else 0)
