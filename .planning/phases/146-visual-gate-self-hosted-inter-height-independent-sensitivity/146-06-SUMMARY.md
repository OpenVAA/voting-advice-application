---
phase: 146-visual-gate-self-hosted-inter-height-independent-sensitivity
plan: "06"
subsystem: visual-regression-gate
tags: [visual-regression, fonts, negative-control, measurement, playwright]
status: complete
requires:
  - "146-05 — self-hosted Inter live in the served application (`/fonts/inter.css`, 200)"
  - "146-04 — `maxDiffPixels: 200` installed in `tests/playwright.config.ts`"
  - "146-03 — the noise matrix and the verbatim zero-tolerance overlay"
provides:
  - "the measured answer to N-1: variable→static moved 0 px on the sensitive detector"
  - "a two-directional proof that a broken same-origin font path fails BY NAME (N-2 closed)"
  - "the correction of `146-05-SUMMARY.md`'s 856 px reading"
affects:
  - "146-07 — knows exactly what its re-baseline absorbs, and cannot start from a broken font path unnoticed"
  - "146-08 — its determinism runs cannot see the session-to-session seed ordering filed in deferred-items.md"
  - "146-09 — the `settleFonts` docblock correction is confirmed as still owed"
tech-stack:
  added: []
  patterns:
    - "measurement-only Playwright overlay, reconstructed verbatim from the ledger and deleted again"
    - "decode-and-mask forensics (pngjs + pixelmatch) to attribute a diff count to a region"
    - "injection → rebuild → restart → run → revert → rebuild → restart → run, proven three ways"
key-files:
  created:
    - ".planning/phases/146-.../deferred-items.md"
    - ".planning/phases/146-.../146-06-SUMMARY.md"
  modified:
    - ".planning/phases/146-.../146-VISUAL-NOISE-LEDGER.md"
    - ".planning/phases/146-.../146-NEGATIVE-CONTROL.md"
    - ".planning/phases/146-.../146-05-SUMMARY.md (correction block only)"
decisions:
  - "Took a FRESH at-cap run rather than reusing `146-05`'s `146-fontdelta-cap`: that run was at HEAD `26060159a`, not current HEAD, and the plan's reuse condition therefore did not hold."
  - "Took three zero-tolerance runs rather than one, because the first contradicted `146-05`'s recorded numbers and a single count could not settle which was right."
  - "Chose `/fonts/inter.csss` as the bogus path — it still contains the substring the guard matches on, so it exercises the `status 200` branch that `146-05`'s demo B did not."
  - "Corrected `146-05-SUMMARY.md` in place with a marked block rather than only recording an addendum elsewhere, so the withdrawn premise cannot propagate into `146-07`."
metrics:
  duration: "~2 h"
  completed: 2026-08-26
actuals:
  tokens: 21000
  tasks: 2
  commits: 2
---

# Phase 146 Plan 06: Font Delta and the N-2 Closure Summary

**The variable→static font switch moved exactly 0 px on the two baselines sensitive enough to detect
it — research's own falsification criterion, not met — and a 404 font path now fails by name, proven in
both directions on one byte-identical instrument.**

## What was measured

### Task 1 — the font delta (`F1-DELTA-PRE`)

| Baseline | Diff px vs the pre-font baselines, zero tolerance | Verdict at the shipped cap (200) |
|---|---:|---|
| `voter-results-desktop` | 11,615 | FAIL |
| `voter-results-mobile` | 11,601 | FAIL |
| `candidate-preview-desktop` | **0** | PASS |
| `candidate-preview-mobile` | **0** | PASS |

Four in-container runs, all four numbers identical in every one: three through the overlay
reconstructed **verbatim** from the ledger at `maxDiffPixels: 0` (`146-fontdelta-zero`, `-run02`,
`-run03`) and one through the shipped config at `maxDiffPixels: 200` (`146-fontdelta-cap-146-06`).
`--list` enumerated the same 7 tests in 4 files before any measurement; `E2E PREFLIGHT OK` appears once
in every `stdout.log`; **no snapshot-update flag on any invocation** (12 argv files, 12 zeros); the
overlay was deleted afterwards and `tests/playwright.config.ts` was never touched.

**The two zeros are the answer.** The `candidate-preview` pair is the sensitive detector — twenty of the
forty cells in this phase's own noise matrix are its, all 0, matching the v2.14 record — and research
named it in advance: *"if they move at all, the move is the font."* They did not move. D-09 A's
rasterisation-neutrality claim, which research had shown was silent about *delivery*, survives
measurement. The 0 is a genuine self-hosted rendering, not a silent fallback: `guardThirdPartyFonts`
ran before every capture and passed, so zero third-party font requests were observed and
`/fonts/inter.css` returned 200.

**The voter pair is confounded and is not reported as font delta.** Decoding the actual against the
committed baseline gives 31 row-height bands down the page with a *different candidate in the same
slot* (`Generic AA Four`/6 vs `Generic AA One`/3) — the old tie permutation the committed baselines
still encode. Content, not rasterisation.

### The premise this plan was handed, and what happened to it

The plan (and `146-05-SUMMARY.md:187-202`) recorded the `candidate-preview` pair at **856 px** and read
that as the falsification criterion being met. **It is withdrawn on measurement.** `pixelmatch@0.2` over
that run's own expected/actual pair reproduces 856 exactly; masking a **single 48 × 48 portrait tile**
(x 373-420, y 178-225) takes it to **0**. The two sessions had seeded a different photograph for the
same candidate — every scored pixel of the 856 was that avatar. It also does not reproduce: the same
comparison scores 0 in four consecutive runs at current HEAD, and a rasterisation delta between two
font deliveries would be deterministic. The correction is recorded in the ledger, in `F1-DELTA-PRE`, and
as a marked block inside `146-05-SUMMARY.md` itself so the withdrawn premise cannot travel to `146-07`.

Consequence: `146-07`'s re-baseline is **not** absorbing a rasterisation change. The candidate pair is
green and would stay green without it; the voter pair is red at ~58× the cap for a content reason owed
since `53002b6a9`.

### Task 2 — the N-2 closure (`F2-BOGUS-RED` / `F3-BOGUS-GREEN`)

`font.url` → `/fonts/inter.csss` (a one-character fat-finger that really 404s), `yarn build`, dev server
restarted so the break was actually served, and the break confirmed before the suite ran (served
`<head>` carried the bogus href; `curl` → 404).

- **RED:** all four captures failed with `the same-origin Inter stylesheet
  http://localhost:5173/fonts/inter.csss did not load: status 404. …` — raised at
  `visual-regression.spec.ts:143`. `grep -c 'Screenshot comparison failed'` → **0**.
- **`settleFonts` PASSED throughout**, which is the finding rather than an anomaly: a 404 stylesheet
  registers zero `@font-face` rules and `document.fonts.check('1em Inter')` then returns `true`
  vacuously. N-2's truth table, re-observed on the application instead of in a probe.
- **GREEN:** after `git checkout --`, `yarn build` and a second restart, the guard is silent on all four
  captures. The two red voter screenshots are `F1-DELTA-PRE`'s stale permutation (11,615 / 11,601 —
  the same numbers again) and the row says so explicitly so a red run is not mistaken for a failed
  control.
- **Instrument identity:** `visual-regression.spec.ts` is blob `d517229bb3e05ec0aa0c47c66cf937e31302b785`
  in the working tree at both halves and at both halves' HEAD (`073fefc72`), with `git diff` over the
  path empty.

This row exercises the guard's **status-200** branch; `146-05`'s demo B exercised the *"never
requested"* branch with a 200-serving wrong path. Between them both branches are now measured, and the
fix is in the **guard** — `settleFonts`' body is unchanged and its docblock correction remains owed to
`146-09`.

## Deviations from Plan

**1. [Rule 1 — Bug in an inherited premise] The plan's Task 1 framing assumed 856 px was the font delta**

- **Found during:** Task 1, on the first zero-tolerance run, which returned 0 for the pair the plan
  expected at 856.
- **Issue:** treating 856 px as the measured font delta would have written a false number into the one
  measurement window the phase has, and would have made `146-07`'s re-baseline look mandatory for the
  candidate pair.
- **Fix:** measured rather than reconciled — three repeat runs (stable), then decode-and-mask forensics
  attributing 100 % of the 856 to one portrait tile. Recorded in the ledger, the register row, and a
  marked correction block in `146-05-SUMMARY.md`.
- **Files:** `146-VISUAL-NOISE-LEDGER.md`, `146-NEGATIVE-CONTROL.md`, `146-05-SUMMARY.md`.
- **Commit:** `073fefc72`.

**2. [Rule 3 — Blocking] The at-cap run was re-taken rather than reused**

- `tests/e2e-runs/146-fontdelta-cap` was taken at HEAD `26060159a` with the pre-guard spec, so the
  plan's own reuse condition (*"taken at the current HEAD with the font live"*) did not hold, and its
  counts are the ones now known to be confounded. A fresh run went to
  `tests/e2e-runs/146-fontdelta-cap-146-06` — a new directory rather than an overwrite, so `146-05`'s
  cited evidence stays intact. Disclosed in the ledger and in `F1-DELTA-PRE`.

**3. [Scope] Two extra zero-tolerance runs, and an out-of-scope discovery logged not fixed**

- `-run02` / `-run03` were added because one count could not settle a contradiction.
- The session-to-session variation they exposed (seed portrait/order assignment differs between
  sessions while being perfectly stable within one) is filed in `deferred-items.md` as `D-146-DEF-1`,
  not fixed here: it is a `@openvaa/dev-seed` question and it matters to `146-07` and `146-08`.

**4. [Disclosure] `146-05-SUMMARY.md` was edited, and it is not in this plan's `files_modified`**

- Only a marked `⚠ CORRECTED BY 146-06` block was inserted; no prior text was deleted or rewritten. An
  addendum elsewhere alone would have let the withdrawn premise propagate.

## Dev-server restarts

Two, both required by the injection and its revert (the rebuilt `dist/` does not reach the running
server — measured, not assumed). `4037` → `93764` (16:47:19, serving the bogus path) → **`94791`**
(16:49:35, serving the committed `/fonts/inter.css`, wildcard bind `*:5173`, built at `073fefc72` with
a clean tree). Both appended to the register header's restart history per its standing contract. D-16's
continuous-uptime requirement is void as chartered, so nothing depended on the continuity.

## Verification

| Gate | Result |
|---|---|
| Task 1 automated verify (four numeric counts, no `pending`, overlay gone, baselines clean) | **OK** |
| Task 2 automated verify (`staticSettings.ts` clean, F1/F2/F3 filled, `inter.css` named in the RED log) | **OK** |
| `git diff --exit-code` over `staticSettings.ts`, `playwright.config.ts`, `visual-regression.spec.ts`, `preflight.ts`, `global-setup.ts` | **exit 0** |
| `git status --short tests/tests/specs/visual/` | **empty** — no snapshot updated |
| `grep -c update-snapshots` over all six runs' `pw-args.txt` + `docker-argv.txt` | **0** in 12 of 12 files |
| `grep -c 'E2E PREFLIGHT OK'` per run | **1** in 6 of 6 `stdout.log`s |
| `tests/e2e-runs/146-noise/playwright.noise.config.ts` | **absent** |
| Served application healthy | `/fonts/inter.css` → **200** (2,279 B), `/` → 200, `/@fs/…/+layout.svelte` → 200 |
| `yarn lint:check` | **pass** (22/22) |
| `yarn format:check` | **pass** |
| Register placeholder count | **145 → 80**, down by exactly 15 from `146-04`'s close |
| Ledger `## Completeness` | **0 placeholder cells** — matrix, exits, `max` row, derivation and § Font delta all filled |

## Self-Check: PASSED

- `146-VISUAL-NOISE-LEDGER.md`, `146-NEGATIVE-CONTROL.md`, `146-05-SUMMARY.md`, `deferred-items.md` —
  all present on disk.
- Commits `073fefc72` and `0170d2bb6` — both present in `git log`.
