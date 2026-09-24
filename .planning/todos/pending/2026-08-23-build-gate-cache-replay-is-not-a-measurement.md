---
created: 2026-08-23T17:35:00.000Z
title: An unforced `yarn build` gate is a cache replay, not a measurement — the gate protocol forces lint and typecheck but not build
area: repo
files:
  - turbo.json
filed_by: Phase 144 (144-07), as residue RES-16 — found by that plan's own gate 4
---

## Measurement (taken at HEAD `47ee50054`, 2026-08-23)

`turbo.json` gives the `build` task **no** `"cache": false` — exactly like `lint` and `typecheck`, and
unlike `test:unit`. On a clean tree it is therefore a cache **HIT**, and the exit code a gate records
is a claim about a **previous** tree.

Measured directly, both forms at the same HEAD:

| Command | Exit | Cache |
|---|---|---|
| `yarn build` (the form every gate protocol names) | 0 | **`Cached: 14 cached, 14 total`** — every task a replay |
| `TURBO_FORCE=true yarn build` | 0 | `Cached: 0 cached, 14 total`, 14/14 forced verdict lines |

## Why this is a gap and not a nit

Phases 142.1, 143 and 144 all carry an explicit "measurement, never citation" clause and all of them
force `lint` and `typecheck` for precisely this reason — D-06b even names the `yarn lint:check --force`
trap (yarn appends the argument past the `&&` chain, so it silently does nothing). **None of them
forces `build`.** A green build gate recorded across those phases may be a replayed green.

In Phase 144 this was caught at gate 4 and the gate was re-taken forced, with the cached run preserved
as disclosure. It was caught by reading the aggregate line, not by any check — nothing in the protocol
would have failed had it gone unnoticed.

## Suggested approach

Add `build` to the forced set in the standing gate protocol — i.e. the canonical seven-gate list should
read `TURBO_FORCE=true yarn build` — and add a `replaying`-absent assertion over the build log to the
same acceptance criteria that already carry it for gates 2 and 6.

Consider whether `build` should simply keep its cache for *developer* use while gate runs always force;
the two uses have genuinely different requirements, which is why blanket `"cache": false` is the wrong
remedy here.
