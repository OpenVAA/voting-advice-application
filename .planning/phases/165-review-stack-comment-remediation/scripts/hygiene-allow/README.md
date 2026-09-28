# Hygiene allowlist

Each plan that needs an exception writes `165-NN.tsv` in this directory. `hygiene-changed-files.sh` reads every `*.tsv` here.

## Row format

One row per exception, three tab-separated fields:

```text
path<TAB>exact trimmed line text<TAB>reason
```

- `path` is repo-relative, exactly as the gate prints it.
- `exact trimmed line text` is the whole source line with leading and trailing whitespace removed. The gate compares it byte for byte, so an edit to the line voids the row.
- `reason` must be non-empty. A row with an empty reason is ignored and the hit still fails.
- Lines starting with `#` are comments.

The allowlist covers layers 2-4 (strip patterns, narrative, reflow detectors). It does not cover layer 1 (the codemod) or layer 5 (the repo lint rule), and it is not applied in `--self-test`.

## What counts as a reason

A row needs a real reason: the matched text is a legitimate technical use of the phrase, a version string, a standard name (`UTF-16`), or a user-facing string that must stay as written. Name that use in the reason.

"To make the gate pass" is never a reason. If the text is a planning reference or historical narrative, rewrite the text.
