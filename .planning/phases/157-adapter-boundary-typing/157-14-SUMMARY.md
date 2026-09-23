---
phase: 157-adapter-boundary-typing
plan: 14
subsystem: tooling/lint-guards
tags: [eslint, flat-config, negative-control, adapter-boundary, measurement]
status: complete
requires:
  - 157-RESEARCH.md § F.2 / F.5 / F.8 (the ASSUMED claim, the selector table, the control matrix)
  - 143-NEGATIVE-CONTROL-LEDGER.md (header field set, rows-first rule, row schema)
provides:
  - "PROBE VERDICT: flat-config overlapping objects REPLACE (not merge), per-file"
  - "157-NEGATIVE-CONTROL-LEDGER.md with 7 rows created before the first injection"
  - "A-OLD and B-OLD blind halves, measured while the guard does not exist"
  - "named + hashed injection targets for 157-15"
affects:
  - 157-15 (guard shape decision; the NEW halves and rows C, D, E)
tech-stack:
  added: []
  patterns:
    - "read-only lintText probe via overrideConfigFile:true, so the repo config is neither loaded nor modified"
    - "TURBO_FORCE=true on every measured lint run, because a replayed cache entry is not a measurement"
    - "dual restoration proof: git hash-object plus turbo input hash"
key-files:
  created:
    - .planning/phases/157-adapter-boundary-typing/157-NEGATIVE-CONTROL-LEDGER.md
  modified: []
decisions:
  - "The two-overlapping-blocks flat-config question is REPLACE, measured — which disproves 157-RESEARCH.md § F.2's strict-subset reasoning and forces 157-15's second block to re-include all four inherited entries."
  - "Row A injects into apps/frontend/src/routes/admin/+layout.server.ts and row B into apps/frontend/src/lib/components/input/shared.ts; both named and hashed in the ledger so 157-15 injects into the same files."
metrics:
  duration: ~25 min
  completed: 2026-08-30
actuals:
  tokens: 11000
  tasks: 3
  commits: 2
---

# Phase 157 Plan 14: Negative-Control Ledger — Probe and Blind Halves Summary

Measured the one claim `157-RESEARCH.md` marked `[ASSUMED]` — overlapping flat-config objects **REPLACE**
a rule's options rather than merging them — and opened `157-NEGATIVE-CONTROL-LEDGER.md` with all seven
rows created before the phase's first injection, then measured the two blind (OLD) halves while
`apps/frontend/eslint.config.mjs` was still untouched.

## What the probe proved

**`PROBE VERDICT: REPLACE`, for both `no-restricted-syntax` and `no-restricted-imports`.** When two flat
config objects both match a file and both set the same rule, the later object's options array replaces
the earlier one's **entirely**; the earlier entry produces zero messages for that file. A third
experiment showed the replacement is **per-file, not global** — the broad object's entry survives for
files the narrow object does not match.

Both controls fired in every experiment, so the single-message result in the two-block runs is a
**deletion**, not a non-firing fixture. Apparatus: ESLint 9.39.2, `overrideConfigFile: true` with an
inline `overrideConfig`, `@typescript-eslint/parser`, virtual `filePath` never written to disk. The
script lived in the scratch directory and was deleted; no repository file was modified.

**This disproves part of the research it was run to check.** § F.2 recommended a narrower second block
and reasoned that it *"need not duplicate #2/#4 if its glob is a strict subset that the first block also
covers — flat-config replacement is per-rule-per-matching-config, and both configs apply."* Experiment 1
is the direct counter-example: the narrow glob **was** a strict subset, both configs **did** apply, and
the broad object's entry was still deleted for the overlapping files. So if `157-15` adds an overlapping
second block it **must re-include all four inherited entries byte-identically** (the shared-config
deep-relative-`lib` `patterns` entry and `TSEnumDeclaration` selector, plus the frontend block's
`svelte/store` `paths` entry and `ImportExpression` selector). Omitting any of them deletes that ban
**while producing zero errors** — the silent failure the config already warns about in-file at `:85-88`
and `:110-116`.

## What the blind halves proved

Both OLD halves ran at HEAD `a38969a17` with `TURBO_FORCE=true yarn lint:check`, each with a confirmed
`cache bypass` marker so neither is a replayed cache entry.

| Row | Injection | Target | Exit | Errors | Outcome |
|-----|-----------|--------|------|--------|---------|
| `A-OLD` | `const { data } = await locals.supabase.from('elections').select('id');` | `apps/frontend/src/routes/admin/+layout.server.ts` | `0` | **0** | BLIND — confirmed |
| `B-OLD` | `import { createBrowserClient } from '@supabase/ssr';` | `apps/frontend/src/lib/components/input/shared.ts` | `0` | **0** | BLIND — confirmed |

Both injections also **typecheck clean** (`svelte-check found 0 errors and 0 warnings`), so each is a
valid, shippable leak the whole gate accepts — not a broken fixture some other check would have stopped
anyway. That is the point: the tree is blind to a ninth adapter-leak site today.

## Data `157-15` needs

- **Probe verdict:** REPLACE, per-file. Cite it when choosing the one-block vs two-block guard shape.
- **Injection targets** (use these, do not pick new ones):
  - Row A — `apps/frontend/src/routes/admin/+layout.server.ts`, pre-injection blob `02bf748322c834fe553f58f01aaf019473e7c2ec`
  - Row B — `apps/frontend/src/lib/components/input/shared.ts`, pre-injection blob `c1b2d1e99955faa73dd6aaf18d07403fac6ed288`
- **Pre-change blob hash of `apps/frontend/eslint.config.mjs`:** `10bcf84c37bb69497ad139c74f1e84747e250bee`.
  `157-15` changes this file and must record the post-change hash in the header's placeholder; rows from
  `157-15` Task 1 onward assert against the **post**-change value, never this one.
- **Pre-existing-warning baseline** (so "clean" has a defined string): `@openvaa/frontend:lint` →
  `✖ 1 problem (0 errors, 1 warning)`, `unused-imports/no-unused-vars` on `'question'` at
  `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:19:9`.
- **Cache discipline:** every measured run must be `TURBO_FORCE=true yarn lint:check` with the
  `cache bypass, force executing` marker checked on `@openvaa/frontend:lint`.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 — missing critical correctness] Both injections extended by one consuming line, to stop the row recording a result for the wrong reason**

- **Found during:** Task 3.
- **Issue:** `packages/shared-config/eslint.config.mjs:132` sets `'unused-imports/no-unused-imports': 'error'`.
  A bare unused `@supabase/ssr` import in row B would therefore have turned `lint:check` **red for a
  reason unrelated to the adapter boundary**, and the row would have recorded a catch the guard did not
  make. Symmetrically, an unconsumed `data` in row A would have raised a second
  `unused-imports/no-unused-vars` *warning*, which would not have changed the `Errors` cell but would
  have made the run's output differ from the pre-existing-warning baseline string.
- **Fix:** row A's `return { session }` widened to `return { session, elections: data }`; row B given
  `export const supabaseClientFactory = createBrowserClient;`. The Supabase call and the import — the
  things under test — are verbatim as § F.8 specifies. Both changes are documented in the ledger with
  their rationale.
- **Why this is the correct call:** it is the inverted form of `eslint-store-guard.test.ts:49-51`
  correctness invariant 3 ("a count assertion would pass for the wrong reason"). Removing the confound
  makes the measured `0 errors` attributable to the absent guard and nothing else.
- **Files modified:** none persist — both injections were restored byte-identically.

**2. [Rule 2 — measurement integrity] `TURBO_FORCE=true` added to every measured run**

- **Found during:** Task 3 setup.
- **Issue:** `yarn lint:check` runs `turbo run lint`, which is cached. A replayed cache entry is not a
  measurement, and the restored-tree run in particular would otherwise have been a guaranteed cache hit.
- **Fix:** every run in this plan issued as `TURBO_FORCE=true yarn lint:check`, with the
  `cache bypass, force executing` marker verified per run. Recorded as a header field in the ledger (the
  D-02a precedent from Phase 143). This turned out to pay for itself — see the second restoration proof
  below.
- **Files modified:** none.

**3. [Rule 1 — stale inherited fact] Pre-existing-warning baseline re-measured rather than inherited**

- **Found during:** Task 2.
- **Issue:** Phase 143's ledger records the standing frontend warning at
  `candidateContext.svelte.test.ts:39`. It now sits at `:19` — the file moved between phases. Copying
  143's value would have propagated a stale fact into 157's definition of "clean".
- **Fix:** baseline re-measured here and recorded at `:19`, with an explicit note against the 143 value.
  Two further standing-warning surfaces (`@openvaa/dev-seed:lint`, the root `tests` pass) were measured
  and recorded too, so no future reader mistakes them for regressions.
- **Files modified:** none.

### Scope note

The plan's row-A/row-B descriptions specified a single injected line each. The as-executed injections are
two lines each for the reason in deviation 1. Nothing else departed from the plan.

## Verification

| Check | Result |
|-------|--------|
| Ledger exists with full header field set and all seven rows pre-created | PASS — rows committed empty at `a38969a17`, **before** the first injection, so the rows-first ordering is git-provable rather than merely asserted |
| Probe verdict recorded for both rules | PASS — `grep -c 'PROBE VERDICT'` → 4 |
| Rows A-OLD and B-OLD populated, both 0 errors | PASS |
| Pre/post-restoration `git hash-object` match, both files | PASS — `02bf7483…` and `c1b2d1e9…`, both matching |
| `git status --porcelain apps` empty | PASS — 0 lines |
| `apps/frontend/eslint.config.mjs` unmodified | PASS — `10bcf84c37bb69497ad139c74f1e84747e250bee`, identical to the dispatch-time baseline; absent from `git diff --name-only` |
| Rows A-NEW, B-NEW, C, E left empty | PASS — 31 `pending — 157-15` cells remain; 0 `pending — 157-14` cells remain |
| `lint:check` back to exit 0 after restoration | PASS — exit 0, baseline warning string restored |

**A second, independent restoration proof.** The closing run's turbo input hash for
`@openvaa/frontend:lint` is `3192d1d3697595c0` — **identical to the clean baseline run's**, and distinct
from both injected runs (`567c9683bc41341b`, `182da41d19ab71ef`). Turbo hashes task inputs including
source file contents, so this is a restoration proof computed by a different tool via a different
mechanism, agreeing with `git hash-object`.

## Known Stubs

None. Rows A-NEW, B-NEW, C and E are deliberately empty and explicitly marked `pending — 157-15`; that is
the plan's design (a half measured after the guard exists is not evidence of blindness before it), not an
unfinished stub.

## Threat Flags

None. This plan added no network endpoint, auth path, file-access pattern or schema change. It modified
no source file — every source change was a temporary injection, restored byte-identically and proven so.

## Self-Check: PASSED

- `FOUND: .planning/phases/157-adapter-boundary-typing/157-NEGATIVE-CONTROL-LEDGER.md`
- `FOUND: a38969a17` — `docs(157-14): probe flat-config REPLACE semantics and open the negative-control ledger`
- `FOUND: 803893f83` — `docs(157-14): measure the OLD blind halves while the guard does not exist`
- `git status --porcelain apps` → empty
- `git hash-object apps/frontend/eslint.config.mjs` → `10bcf84c37bb69497ad139c74f1e84747e250bee` (unchanged)
