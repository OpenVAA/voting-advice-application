# Phase 180 — E2E test-count deltas

Each plan appends one row per project whose test count it changes, against the last full run `tests/e2e-runs/179.2/179.2-final-4` (729 passed of 729). `180-totals.mjs` sums the rows per project; plan 02's targeted run and plan 03's full run are judged with every row summed. The phase adds, removes and renames no E2E test, so no row is expected.

| plan | project | delta | titles added or renamed |
|---|---|---|---|
