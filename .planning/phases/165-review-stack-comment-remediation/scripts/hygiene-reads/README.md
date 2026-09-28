# Hygiene read log

`record-hygiene-read.sh <plan-id> <path>...` writes `165-NN.tsv` in this directory. Each row records that the plan's agent read a changed file in full, in its current state, and that the file passed the hygiene gate at that moment.

## Row format

```text
path<TAB>blob<TAB>plan-id
```

- `path` is repo-relative.
- `blob` is `git hash-object <path>` of the working-tree file when the read was recorded.
- `plan-id` is the recording plan, `165-NN`.

`record-hygiene-read.sh` runs `hygiene-changed-files.sh --files <path>...` first and records nothing unless it exits 0.

## How it is checked

`hygiene-changed-files.sh --check-reads` computes the current `git hash-object` of every in-scope path and fails for any path whose `(path, blob)` pair appears in no row of any file here. An edit after the read changes the blob and voids the read, so the final sweep proves that every changed file was read after its last change.

Rows are append-only. Do not edit or delete them by hand.
