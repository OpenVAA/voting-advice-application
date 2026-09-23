"""Partition comment line-breaks into hand-wrapped / necessary / ambiguous.

Discriminator: printWidth=120 (from .editorconfig max_line_length, which prettier
reads). A break between two lines of one comment paragraph is a HAND-WRAP if the
next line's first word would have fitted on the previous line. If it would not
have fitted, the break was NECESSARY and is not the reviewer's target.
"""
import os, re, sys, json
WIDTH = 120
EXTS = ('.ts', '.tsx', '.js', '.mjs', '.cjs', '.svelte')
SKIP_DIRS = {'node_modules', 'dist', 'build', '.svelte-kit', '.turbo', 'coverage', '.git'}
ROOTS = ['packages', 'apps', 'tests']

# Structural starts that legitimately begin their own line.
STRUCT = re.compile(r'^(?:[-*+]\s|\d+[.)]\s|@\w+|\||```|>\s|#{1,6}\s|\[[^\]]+\]:)')
TERMINAL = ('.', '!', '?', ':', ';')

def comment_lines(path):
    """Yield (lineno, indent, prefix, content) for comment lines only."""
    try:
        src = open(path, encoding='utf-8', errors='replace').read().split('\n')
    except OSError:
        return
    in_block = False
    for i, raw in enumerate(src, 1):
        s = raw.strip()
        if in_block:
            m = re.match(r'^(\s*)(\*\s?)(.*)$', raw)
            if m:
                yield i, len(m.group(1)), m.group(2), m.group(3).rstrip()
            elif s:
                yield i, len(raw) - len(raw.lstrip()), '', s
            if '*/' in s:
                in_block = False
            continue
        if s.startswith('/*'):
            in_block = '*/' not in s
            m = re.match(r'^(\s*)(/\*\*?\s?)(.*?)(?:\*/)?$', raw)
            if m and m.group(3).strip():
                yield i, len(m.group(1)), m.group(2), m.group(3).rstrip()
            continue
        m = re.match(r'^(\s*)(//+\s?)(.*)$', raw)
        if m:
            yield i, len(m.group(1)), m.group(2), m.group(3).rstrip()

buckets = {'handwrap': [], 'necessary': 0, 'ambiguous': [], 'structural': 0}
files_seen = comment_line_count = 0

for root in ROOTS:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if not fn.endswith(EXTS):
                continue
            path = os.path.join(dirpath, fn)
            files_seen += 1
            rows = list(comment_lines(path))
            comment_line_count += len(rows)
            for a, b in zip(rows, rows[1:]):
                (ln_a, ind_a, pre_a, txt_a), (ln_b, ind_b, pre_b, txt_b) = a, b
                if ln_b != ln_a + 1:        # not adjacent -> different blocks
                    continue
                if not txt_a.strip() or not txt_b.strip():
                    continue                # blank comment line = paragraph break
                if STRUCT.match(txt_b.strip()):
                    buckets['structural'] += 1
                    continue
                first = txt_b.strip().split()[0]
                projected = ind_a + len(pre_a) + len(txt_a) + 1 + len(first)
                if projected > WIDTH:
                    buckets['necessary'] += 1
                    continue
                entry = (path, ln_a, projected, txt_a[-40:], first)
                if txt_a.rstrip().endswith(TERMINAL):
                    buckets['ambiguous'].append(entry)   # sentence end: paragraph or wrap?
                else:
                    buckets['handwrap'].append(entry)    # mid-sentence: hand-wrapped
print(json.dumps({
    'files': files_seen,
    'comment_lines': comment_line_count,
    'handwrap': len(buckets['handwrap']),
    'ambiguous': len(buckets['ambiguous']),
    'necessary': buckets['necessary'],
    'structural': buckets['structural'],
    'handwrap_files': len({e[0] for e in buckets['handwrap']}),
    'ambiguous_files': len({e[0] for e in buckets['ambiguous']}),
}, indent=2))
