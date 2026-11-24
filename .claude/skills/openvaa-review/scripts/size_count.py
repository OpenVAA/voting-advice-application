"""Effective-line counting for the conciseness lens: code lines, without blank or comment-only lines.

`effective_lines` is a pure function over a list of lines, so it is tested without git (`tests/test_size_count.py`).

Comment syntax by language:
- c (ts, js, svelte, css, html and their variants): `//` to end of line, `/* … */` spans, and in svelte/html `<!-- … -->`
- sql: `--` to end of line, `/* … */` spans
- hash (sh, yaml, toml, py, Dockerfile): `#` lines, the shebang included
- anything else: every non-blank line counts

Heuristic for diffs: `git diff -U0` gives each hunk's added and removed lines without their surroundings, so the
block-comment state is tracked from the hunk's own lines, starting outside a comment. A hunk that changes only the
middle of a `/* … */` block is still recognised when its lines start with `*` (`* text`, `*/`), the doc-comment style
this repository uses; a bare continuation line inside a block whose opener is not in the hunk counts as code.
"""
import os

C_STYLE = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".css", ".scss", ".pcss", ".svelte", ".html"}
HTML_COMMENTS = {".svelte", ".html"}
SQL = {".sql"}
HASH = {".sh", ".bash", ".zsh", ".yaml", ".yml", ".toml", ".py"}


def language(path):
    """The comment-syntax family of a path: 'c', 'sql', 'hash', or None when every non-blank line counts."""
    base = os.path.basename(path)
    if base == "Dockerfile" or base.startswith("Dockerfile."):
        return "hash"
    ext = os.path.splitext(base)[1].lower()
    if ext in C_STYLE:
        return "c"
    if ext in SQL:
        return "sql"
    if ext in HASH:
        return "hash"
    return None


def _doc_continuation(line):
    """A `* text` or `*/` line: the middle or end of a doc comment whose opener may lie outside the hunk."""
    if not line.startswith("*"):
        return False
    if line.startswith("*/"):
        return True
    return (len(line) == 1 or line[1] == " ") and not line.rstrip().endswith(("{", ";", ","))


def effective_lines(lines, path):
    """Count the lines that carry code: not blank, and not wholly comment in the language of `path`."""
    lang = language(path)
    html = os.path.splitext(path)[1].lower() in HTML_COMMENTS
    count = 0
    in_block = in_html = False
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if lang is None:
            count += 1
            continue
        if lang == "hash":
            count += 0 if line.startswith("#") else 1
            continue
        if not in_block and not in_html and _doc_continuation(line):
            if line.endswith("*/") and "/*" not in line:
                continue
            if "*/" not in line:
                continue
        code, in_block, in_html = _strip(line, lang, html, in_block, in_html)
        if code.strip():
            count += 1
    return count


def _strip(line, lang, html, in_block, in_html):
    """Remove comment spans from one line; return the remaining code and the comment state after the line."""
    out = []
    i, n = 0, len(line)
    while i < n:
        if in_block:
            end = line.find("*/", i)
            if end < 0:
                return "".join(out), True, in_html
            in_block, i = False, end + 2
        elif in_html:
            end = line.find("-->", i)
            if end < 0:
                return "".join(out), in_block, True
            in_html, i = False, end + 3
        elif line.startswith("/*", i):
            in_block, i = True, i + 2
        elif html and line.startswith("<!--", i):
            in_html, i = True, i + 4
        elif lang == "c" and line.startswith("//", i) and not (i > 0 and line[i - 1] == ":"):
            break  # `//` after `:` is a URL scheme, not a comment
        elif lang == "sql" and line.startswith("--", i):
            break
        else:
            out.append(line[i])
            i += 1
    return "".join(out), in_block, in_html


def count_diff(diff_text):
    """Per-file effective (added, removed) counts from `git diff -U0` output. Block state resets per hunk."""
    result = {}
    path = None
    in_header = False
    added, removed = [], []

    def flush():
        if path is not None and (added or removed):
            a, r = result.get(path, (0, 0))
            result[path] = (a + effective_lines(added, path), r + effective_lines(removed, path))

    for line in diff_text.splitlines():
        if line.startswith("diff --git "):
            flush()
            added, removed, path, in_header = [], [], None, True
        elif in_header:
            # header lines precede the first hunk; only there do `--- ` and `+++ ` name the file
            if line.startswith("--- ") and line[4:] != "/dev/null":
                path = line[6:] if line.startswith("--- a/") else line[4:]
            elif line.startswith("+++ ") and line[4:] != "/dev/null":
                path = line[6:] if line.startswith("+++ b/") else line[4:]
            elif line.startswith("@@"):
                in_header = False
        elif line.startswith("@@"):
            flush()
            added, removed = [], []
        elif line.startswith("+"):
            added.append(line[1:])
        elif line.startswith("-"):
            removed.append(line[1:])
    flush()
    return result
