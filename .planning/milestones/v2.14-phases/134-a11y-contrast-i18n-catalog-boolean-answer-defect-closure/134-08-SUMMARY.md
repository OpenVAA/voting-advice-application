---
phase: 134-a11y-contrast-i18n-catalog-boolean-answer-defect-closure
plan: 08
subsystem: verification-gate
tags: [e2e, determinism-gate, svelte-check, lint, prettier, unit, requirements]
status: complete

# Dependency graph
requires:
  - phase: 134-06
    provides: "the E2E regression locks (steps 18.5 / 18.6 / 13, results listbox) that this gate runs three times"
  - phase: 134-07
    provides: "the corrected FIX-01/02/03 requirement wording that this plan flips to complete"
provides:
  - "3× consecutive full-suite green run record (130 passed / 0 failed / 0 did-not-run each), fresh dev server + clean DB per run"
  - "Static-gate record: svelte-check 2683 files 0 errors 0 warnings, lint/prettier/tests-typecheck exit 0"
  - "FIX-01, FIX-02, FIX-03 marked complete in REQUIREMENTS.md against recorded evidence, with three coverage limits left visible rather than absorbed"
affects: [v2.14 milestone close, /gsd-ship gate]

actuals:
  tokens: 2512
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Environment-wedge discard is logged with its recovery, never silently absorbed into a run count"

key-files:
  created: []
  modified:
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Run 2's clean-DB precondition was satisfied by the wedge-recovery `db:stop && db:start && db:reset` (exit 0, `public-assets` asserted) rather than a second back-to-back `db:reset` — a redundant immediate reset adds no cleanliness and is the documented wedge trigger. Recorded here rather than papered over."
  - "The root `yarn test:unit` aggregate exits 1 on the pre-existing, load-dependent `@openvaa/dev-seed` NF-01 wall-clock assertion (DEF-134-04-01). NOT fixed — out of scope per the executor scope boundary. Reported honestly below rather than reported as a clean gate."

requirements-completed: [FIX-01, FIX-02, FIX-03]
---

# Phase 134 Plan 08: Verification Gate — Summary

**The full E2E suite passed three consecutive times — 130 passed / 0 failed / 0 did-not-run per run, each against a freshly started dev server and a clean database — and every static gate is clean except one pre-existing, out-of-scope wall-clock assertion that is reported rather than hidden.**

## Performance

- **Duration:** ~55 min wall clock (12:19Z → 13:14Z), of which ~34 min was the three suite runs
- **Tasks:** 3
- **Files:** 1 modified (`.planning/REQUIREMENTS.md`)

## Task Commits

1. **Task 1: Static gates** — no code change; evidence recorded in this SUMMARY
2. **Task 2: 3× E2E determinism gate** — no code change; run records below
3. **Task 3: Flip FIX-01/02/03 to complete** — `1455a1ba9`

## What this gate was proving

This phase changed the a11y scan settle logic into a typed contract with a required data-driven content anchor, repointed one scan onto a route it had never actually reached, added a seventh scan over the results filter drawer, edited a global stylesheet, added 49 Paraglide catalog entries across two message files in seven locales (compiled by a Vite plugin), swapped a falsy guard in a candidate-facing route component, and added four new E2E assertion sites. Every one of those is a change class that has previously produced parallel-pressure-dependent or HMR-staleness flakes in this repo. A single green run would have proven nothing about any of them, which is why D-15 was not reduced to 1×.

## Task 2 — the 3× determinism gate (D-15)

### Run records

| Run | DB provenance | Dev server | Started (UTC) | Ended (UTC) | Duration | Passed | Failed | Did not run | Skipped / flaky | Exit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `yarn db:reset` exit 0 @ 12:20:23Z | fresh, pid 16955, healthy after 8s, **1** process on `:5173` | 12:21:04 | 12:32:41 | 697s (11.6m) | **130** | 0 | 0 | 0 / 0 | 0 |
| — | *discarded — see wedge log below* | — | 12:35:59 | 12:36:0x | — | — | — | — | — | aborted pre-suite |
| 2 | wedge-recovery `db:stop && db:start && db:reset` exit 0 @ 12:35:29Z, `public-assets` asserted; nothing touched the DB in between | fresh, pid 55591, healthy after 11s, **1** process on `:5173` | 12:36:16 | 12:47:34 | 678s (11.3m) | **130** | 0 | 0 | 0 / 0 | 0 |
| 3 | `yarn db:reset` exit 0 @ 12:56:26Z | fresh, pid 96648, healthy after 9s, **1** process on `:5173` | 12:57:12 | 13:08:17 | 665s (11.0m) | **130** | 0 | 0 | 0 / 0 | 0 |

Three **consecutive** green runs. The count never restarted, because no test ever failed — the one discard below is an infrastructure wedge that aborted before Playwright started, not a suite failure.

Each run killed every process holding `:5173` before launching, then asserted exactly one process was listening (`processes on :5173 = 1`) before starting the suite. `yarn dev` runs `dev:clean` first, so `.svelte-kit` and the Vite cache were wiped per run — which is what makes the Paraglide-compiled catalog and the edited global stylesheet genuinely re-compiled rather than served stale.

### Discarded run — environment wedge (D-07), logged not absorbed

The first attempt at run 2 aborted **before the suite started**. `yarn db:reset` applied all migrations and the seed successfully, then failed at `Restarting containers...`:

```
Seeding data from supabase/seed.sql...
NOTICE (00000):  OpenVAA seed data executed successfully
Restarting containers...
Error status 502: An invalid response was received from the upstream server
```

This is the documented repeated-`db:reset` storage-502 wedge. Recovery followed the runbook exactly — no bare Supabase start from the repo root at any point:

| Step | Command | Result |
| --- | --- | --- |
| 1 | `yarn db:stop` | exit 0 |
| 2 | `yarn db:start` | exit 0 |
| 3 | `yarn db:reset` | exit 0 — log contains `Creating Storage bucket: public-assets` |
| 4 | assert bucket via `GET /storage/v1/bucket` | `public-assets` present, `"public":true`, created `2026-08-10T12:35:29.107Z` (alongside `private-assets`) |

Playwright never ran in this attempt, so there is no test result to discard — only the run slot. It is recorded because a gate that quietly swallows its own infrastructure history is not evidence.

### The gate was not weakened

| Assertion | Command | Result |
| --- | --- | --- |
| Playwright config untouched by this phase | `git diff --stat c5b1117ec HEAD -- tests/playwright.config.ts` | **empty** (no changes) |
| No skips/fixmes added | `grep -rnE '\.(skip\|fixme)\(' tests/tests/specs \| wc -l` | **0** — identical to the pre-phase baseline (`c5b1117ec`) of **0** |
| No opt-out env var set | `env \| grep -i PLAYWRIGHT` | **none set** |
| Whole suite, not a subset | `playwright test … --list` | **Total: 130 tests in 88 files** — matches the 130 passed in every run |
| `a11y-smoke` ran | project listing | **12 tests** — 10 axe scans (3 raw × light+dark = 6, plus the 4 fixture-driven) + 2 `navigation-a11y` |
| `performance` ran | project listing | **1 test** (`voter results page loads within budget`) |
| The new scan entry is in the gate | project listing | `axe accessibility scan — results-filter-drawer` present |
| The repointed scan is in the gate | project listing | `axe accessibility scan — constituencies-selector-located` present, light **and** dark |

## Task 1 — static gates (D-16)

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| Build | `yarn build` | 0 | 14 successful, 14 total (13 cached), 14.2s |
| svelte-check (warnings fatal) | `yarn workspace @openvaa/frontend check` | **0** | **2683 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS** |
| Lint (+ tests typecheck) | `yarn lint:check` | **0** | 0 errors. Warnings only, all pre-existing: `@openvaa/core` 2, `@openvaa/dev-seed` 15, `tests` 2 (a `playwright/prefer-to-have-length` and an `Unused eslint-disable directive`) |
| Tests typecheck (run standalone too) | `yarn typecheck:tests` | **0** | no output (clean `tsc --noEmit`) |
| Prettier | `yarn format:check` | **0** | `All matched files use Prettier code style!` (repo-wide, still green after `4c5b64116`) |
| Prettier on this plan's edit | `npx prettier --check .planning/REQUIREMENTS.md` | **0** | clean |
| Unit suite | `yarn test:unit` | **1** | see below — one pre-existing out-of-scope failure |

### Unit suite — the honest number

Root aggregate (`turbo run test:unit`, 19 tasks): **18 successful, 19 total**, exit **1**.

| Package | Test files | Tests |
| --- | --- | --- |
| `@openvaa/frontend` | 54 passed (54) | **773 passed (773)** |
| `@openvaa/dev-seed` | 1 failed \| 41 passed (42) | 1 failed \| 443 passed (444) |
| `@openvaa/app-shared` | 3 passed (3) | 21 passed (21) |
| `@openvaa/supabase` | 1 passed (1) | 16 passed (16) |
| **Total** | | **1253 passed / 1 failed (1254)** |

**Frontend is 773, against the pre-phase baseline of 759 — exactly +14**, the parity check's two assertions × seven locales, as Task 1's acceptance criterion required.

The single failure is **not** in this phase's scope:

```
FAIL  tests/integration/default-template.integration.test.ts
      > default template integration (DX-03)
      > applies default template and meets NF-01 (<10s) + D-58-20 assertions
AssertionError: expected 11592 to be less than 10000
  ❯ tests/integration/default-template.integration.test.ts:144:23
```

This is a wall-clock seed-budget threshold that degrades under turbo's parallel task execution. Run in isolation on the same machine minutes later:

```
✓ default template integration (DX-03) > applies default template and meets NF-01 (<10s) + D-58-20 assertions  10143ms
  Test Files  42 passed (42)
       Tests  444 passed (444)
```

`yarn workspace @openvaa/dev-seed test:unit` → **exit 0, 444/444**. Phase 134 touched no file in `packages/dev-seed/`; the item was already characterised and logged as **DEF-134-04-01** in this phase's `deferred-items.md` (commits `e13632f2d`, `b59def196`) during Plan 04, before this gate ran. It is left unfixed per the executor scope boundary and is reported here rather than rounded away — with dev-seed measured in isolation the effective unit total is **1254 / 1254**.

## Task 3 — requirement flips (`1455a1ba9`)

All three flipped against recorded evidence, with the mapping-table rows moved `Pending → Complete (2026-08-10)`.

| Assertion | Result |
| --- | --- |
| `grep -c '\[x\] \*\*FIX-0' .planning/REQUIREMENTS.md` | **3** |
| `grep -c '\[ \] \*\*FIX-0' .planning/REQUIREMENTS.md` | **0** |
| `grep -c '\| FIX-0N \| Phase 134 \| Complete'` (each of 01/02/03) | **1 / 1 / 1** |
| Any FIX row still `Pending` | **0** |
| `git diff .planning/REQUIREMENTS.md \| grep -c '^[-+]### '` | **0** (no section heading added or removed) |
| Diff size | 6 insertions, 6 deletions, 1 file |

Each annotation cites measured values: FIX-01 the 1.52:1 / 1.46:1 before-state on 2 nodes → 0 violations both themes, the 3 expanded filter rows, and commit `0eb27c677`; FIX-02 the 7 keys × 7 locales = 49 additions, the 14 rendered plural branches, and the 14-test parity check; FIX-03 the 4-pattern / 11-hit sweep with exactly 1 genuine, and the negative-control-proven E2E lock.

Plan 07's requirement **wording** was left exactly as it landed — only status and the completion annotations were added.

## Coverage limits carried forward into the requirements, not absorbed

The three FIX requirements are complete, and closing them does **not** close these. Each is written into the requirement annotation itself so it survives this SUMMARY scrolling out of view:

1. **`questions.multiChoice.selectExact` has no E2E coverage and therefore no standing regression guard.** No seeded question has an equal min/max, so the seeded journey renders `selectRange` instead. Its only proof is Plan 03's build-time render of all 14 plural branches against the compiled Paraglide output. A future regression in that string would not be caught by the suite.
2. **The six non-English `selectExact` singulars are constructed, not natively authored** (MEDIUM confidence). The D-18 native-speaker wording review is **OPEN**, tracked in `134-UAT.md` and `.planning/todos/pending/2026-08-10-verify-non-english-selectexact-singulars.md`. FIX-02 is met because the keys resolve to real text in all 7 locales — the grammar is a live UAT item.
3. **Fixture-driven axe scans are light-theme only.** The 3 raw entries (`home`, `elections-selector`, `constituencies-selector-located`) run light **and** dark; the 4 fixture-driven entries (`questions`, `results`, `voter-detail-drawer`, `results-filter-drawer`) run light only. A dark-only contrast regression on `/questions`, `/results`, the detail drawer or the filter drawer would currently go uncaught. The rationale is documented in-file at `a11y-smoke.spec.ts:396-401` (giving them dark twins would scan three never-measured surfaces for the first time inside a gate that runs three times).

## Deviations from Plan

**1. [Rule 3 — Blocking issue] Run 2's `db:reset` replaced by the wedge-recovery reset**

- **Found during:** Task 2, first attempt at run 2
- **Issue:** `yarn db:reset` hit the documented storage-502 wedge at `Restarting containers...`, aborting before Playwright started.
- **Fix:** Ran the sanctioned recovery (`db:stop` → `db:start` → `db:reset`, all exit 0), asserted the `public-assets` bucket via the storage API, then started run 2 immediately against that freshly reset database instead of issuing a second back-to-back `db:reset` — the redundant immediate reset is precisely the wedge trigger and adds no cleanliness, since nothing touched the DB in between.
- **Files modified:** none (harness only)
- **Commit:** n/a

**2. [Out of scope — not fixed] `@openvaa/dev-seed` NF-01 wall-clock assertion**

- **Found during:** Task 1
- **Issue:** Root `yarn test:unit` exits 1 on `expected 11592 to be less than 10000` under turbo's parallel load.
- **Action:** Verified it passes 444/444 in isolation on the same machine; confirmed Phase 134 touched no dev-seed file; left unfixed per the executor scope boundary. Already logged as DEF-134-04-01 in `deferred-items.md`.
- **Files modified:** none
- **Commit:** n/a

No authentication gates were hit. No packages were installed; `yarn.lock` is untouched.

## Known Stubs

None. This plan ran existing gates and edited one planning document.

## Self-Check: PASSED

- `134-08-SUMMARY.md` exists at the stated path.
- Task 3 commit `1455a1ba9` exists in `git log`.
- All 16 commit hashes cited in this SUMMARY resolve (`git cat-file -e`): `753f41a1f`, `5006599c9`, `4494543ea`, `8f6eaede4`, `3b098a22e`, `324ec8661`, `95f773ec8`, `2b5666edc`, `741d92693`, `2c47d2726`, `4b9c5ffa2`, `0eb27c677`, `e13632f2d`, `b59def196`, `c5b1117ec`, `4c5b64116`.
- STATE.md and ROADMAP.md are unmodified by this plan (orchestrator owns those writes).
