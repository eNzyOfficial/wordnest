"""Minimal streaming .xlsx reader (stdlib only): yields each row as a list of strings."""
import re
import zipfile
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def col_index(ref):
    letters = re.match(r'[A-Z]+', ref).group()
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - 64
    return n - 1


def rows(path, sheet='xl/worksheets/sheet1.xml'):
    with zipfile.ZipFile(path) as z:
        shared = []
        with z.open('xl/sharedStrings.xml') as f:
            for _, el in ET.iterparse(f):
                if el.tag == NS + 'si':
                    shared.append(''.join(t.text or '' for t in el.iter(NS + 't')))
                    el.clear()
        with z.open(sheet) as f:
            for _, el in ET.iterparse(f):
                if el.tag != NS + 'row':
                    continue
                row = []
                for c in el.findall(NS + 'c'):
                    i = col_index(c.get('r'))
                    v = c.find(NS + 'v')
                    if c.get('t') == 's' and v is not None:
                        val = shared[int(v.text)]
                    elif c.get('t') == 'inlineStr':
                        val = ''.join(t.text or '' for t in c.iter(NS + 't'))
                    else:
                        val = v.text if v is not None else ''
                    while len(row) < i:
                        row.append('')
                    row.append(val or '')
                yield row
                el.clear()
