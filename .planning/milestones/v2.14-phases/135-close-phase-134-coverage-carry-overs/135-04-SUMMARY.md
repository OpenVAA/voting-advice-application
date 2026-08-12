---
phase: 135-close-phase-134-coverage-carry-overs
plan: 04
subsystem: testing
tags: [verification-gate, e2e, determinism, a11y, dev-seed, requirements, guard]
status: complete

requires:
  - phase: 135-01
    provides: "Dark twins for the four fixture-driven axe entries + assertDarkThemeApplied, and DEF-135-01/02/03"
  - phase: 135-02
    provides: "base-8 exact-one multi-choice seed question, the selectExact standing guard, selectSmallestValidMultiChoice, and DEF-135-04"
  - phase: 135-03
    provides: "The NF-01 operation budget replacing the wall-clock assertion, and the re-derived 300s hang guard"
provides:
  - "A 3x consecutive full-suite determinism gate on the post-135 code state — 134 passed / 0 failed / 0 did-not-run, fresh server + clean DB per run, zero discarded E2E runs"
  - "An independent reproduction of GUARD-03's load-independence claim at full CPU saturation (69006 ms seed elapsed, test:unit exit 0)"
  - "GUARD-01/02/03 closed against recorded evidence, with three caveats carried in the requirement text rather than only in this summary"
  - "DEF-135-05 — a root-caused monorepo build race between two concurrent turbo graphs"
affects:
  - "v2.14 milestone close — GUARD is the last open requirement block"
  - "any future local E2E gate: the listener-identity assert and the REST/storage/bucket readiness poll are the two preconditions that make a local run trustworthy"

actuals:
  tokens: 9300 # chars/4 over the realized diff: 15208 chars of commit additions + 21852 chars of this summary
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Assert the :5173 listener is a node process whose command path contains THIS repo before trusting any local E2E measurement — an HTTP 200 proves only that something answered"
    - "Poll REST and Storage for 200 and assert the expected buckets exist before starting a suite; `db:status` passing is not readiness"
    - "Reproduce a load-dependence claim at the load level that produces the extreme datum, not the level that merely passes — a quiet green re-proves nothing"

key-files:
  created:
    - ".planning/phases/135-close-phase-134-coverage-carry-overs/135-04-SUMMARY.md"
  modified:
    - ".planning/REQUIREMENTS.md"
    - ".planning/phases/135-close-phase-134-coverage-carry-overs/deferred-items.md"

key-decisions:
  - "The gate's loaded unit run uses plain `yarn test:unit`, not `yarn test:unit --force`. The `--force` variant creates a SECOND turbo build graph that races the dev server's watcher on packages/*/dist; that is a property of the flag I added, not of the code under test, and the requirement names the plain command"
  - "Reproduced GUARD-03 at 14 burners rather than settling for the 7-burner run: at 7 burners this session's seed elapsed was 6743 ms, BELOW the deleted 10000 ms gate, so that run alone would not have discriminated between the old and new assertions"
  - "Recorded the a11y matrix as its true decomposition (14 axe scans + 2 navigation-a11y = 16 project tests; `--list` shows 18 including the base setup/teardown pair) rather than repeating the headline '18-test matrix'"
  - "Corrected the expected lint baseline in the record: the 2 pre-existing `tests`-scope warnings are NOT both `Unused eslint-disable directive` — one is `playwright/prefer-to-have-length`"
  - "DEF-135-04 stays OPEN despite three clean gate runs. Not recurring lowers the estimated frequency; it does not supply the diagnosis that was missing"

patterns-established:
  - "Gate-run provenance record: per run capture db:reset timestamp, a DB-empty assertion, the dev-server pid, the listener-identity check, and start/end timestamps — so a green can be audited rather than taken on trust"

requirements-completed: [GUARD-01, GUARD-02, GUARD-03]

coverage:
  - id: D1
    description: "The full E2E suite passes three consecutive times on the post-135 code state, each with a freshly relaunched dev server and a freshly reset DB"
    requirement: GUARD-01
    verification:
      - kind: e2e
        ref: "yarn test:e2e x3 — 134 passed (10.5m) / 134 passed (10.6m) / 134 passed (10.5m), 0 failed and 0 did-not-run in each; server pids 41261 / 52625 / 68517, db:reset at 11:19:14Z / 11:31:14Z / 11:42:57Z each verified to leave 0 questions"
        status: pass
    human_judgment: false
  - id: D2
    description: "Root `yarn test:unit` exits 0 under deliberate parallel load, independently reproducing GUARD-03's claim"
    requirement: GUARD-03
    verification:
      - kind: integration
        ref: "root `yarn test:unit` with a dev server on :5173 + 14 CPU burners on a 14-core machine (load avg peak 34.16): EXIT=0, 19/19 turbo tasks, dev-seed 444/444, [NF-01] seed step elapsed 69006 ms — 6.9x the deleted 10000 ms budget"
        status: pass
      - kind: integration
        ref: "root `yarn test:unit` quiet: EXIT=0, seed elapsed 6733 ms; with 7 burners: EXIT=0, seed elapsed 6743 ms"
        status: pass
    human_judgment: false
  - id: D3
    description: "The dark-theme axe coverage runs in every gate run and measures clean"
    requirement: GUARD-02
    verification:
      - kind: e2e
        ref: "a11y-smoke inside each full-suite run — 7 axe surfaces x 2 themes = 14 scans plus 2 navigation-a11y tests, all four fixture-driven dark twins (questions / results / voter-detail-drawer / results-filter-drawer) present and passing in runs 1, 2 and 3"
        status: pass
    human_judgment: false
  - id: D4
    description: "GUARD-01/02/03 are ticked against measured values, with the three carry-forward caveats in the requirement text"
    requirement: GUARD-02
    verification:
      - kind: other
        ref: ".planning/REQUIREMENTS.md — checkboxes at the GUARD block and traceability rows 211-213 both flipped; annotations cite the two negative-control outputs, the 14-scan matrix, and the +937 ms injected-N+1 datum; commit 0e58768b7"
        status: pass
    human_judgment: false

metrics:
  duration: "~1h15m"
  completed: 2026-08-11
---

# Phase 135 Plan 04: Verification gate + GUARD requirement flips — Summary

**Three consecutive full-suite runs on the post-135 code state came back 134 passed / 0 failed /
0 did-not-run, with zero discarded E2E runs — and the one failure this plan did hit was in the
static-gate stage, was caused by a flag I added rather than by the code, and was root-caused rather
than retried past.**

## The 3× gate

Per-run provenance, because a green that cannot be audited is not evidence. Every run: the `:5173`
process killed, `yarn db:reset` run and the DB asserted EMPTY, `yarn dev` relaunched (which runs
`dev:clean`, so Vite starts cold), the listener asserted to be a `node` process whose command path
contains this repo, `docker ps` confirmed to show no container publishing 5173, and REST + Storage
polled to 200 with both buckets present.

| Run | `db:reset` (UTC) | DB provenance before the suite | dev-server pid | listener identity | started | ended | duration | result |
|---|---|---|---|---|---|---|---|---|
| 1 | 11:19:14Z | `questions Content-Range: */0`; REST 200, Storage 200; buckets `private-assets,public-assets` | **41261** | `node`, cmd `…/voting-advice-application-gsd/apps/frontend/node_modules/vite/bin/vite.js dev`; docker→`none` | 11:20:17Z | 11:30:49Z | **10.5m** | **134 passed / 0 failed / 0 did-not-run** |
| 2 | 11:31:14Z | `*/0`; REST 200, Storage 200; both buckets | **52625** | same shape, verified | 11:31:59Z | 11:42:37Z | **10.6m** | **134 passed / 0 failed / 0 did-not-run** |
| 3 | 11:42:57Z | `*/0`; REST 200, Storage 200; both buckets | **68517** | same shape, verified | 11:44:30Z | 11:55:03Z | **10.5m** | **134 passed / 0 failed / 0 did-not-run** |

**Discarded E2E runs: none.** No storage 502, no imgproxy 502, no port squat, no dev-server death.
The DEF-135-03 mitigation held throughout — `voting-advice-application-frontend-1` stayed stopped
and `docker ps | grep 5173` returned nothing before all three runs.

Suite size confirmed independently: `--list` → **Total: 134 tests in 88 files**. No test reported
skipped, flaky, or retried in any run; each log contains zero `Error` / `✘` / `failed` /
`did not run` lines.

**DEF-135-04 did not recur.** `voter-journey › full voter journey end-to-end` — the spec carrying
the EPERM-07 term-trigger assertion — ran as test 3/134 and passed in all three. Each of those runs
started on a **cold Vite cache after a dev-server restart**, which is precisely the condition the
original (and disproved) cold-start hypothesis named. Cumulative tally is now 1 failure in 5
full-suite runs plus 8 voter-journey runs. That is evidence of low frequency; it is **not** proof of
absence, and no diagnosis has appeared, so the item stays OPEN. I am stating this as evidence rather
than as a clearance because three clean runs cannot retroactively explain a failure whose only
hypothesis was already falsified.

### The a11y matrix, decomposed honestly

The phase headline was "18-test a11y matrix". The precise shape, enumerated from run 3's log:

- **14 axe scans** = 7 surfaces (`home`, `elections-selector`, `constituencies-selector-located`,
  `questions`, `results`, `voter-detail-drawer`, `results-filter-drawer`) × light + dark. All four
  fixture-driven entries now carry dark twins — the GUARD-02 deliverable.
- **2 `navigation-a11y` tests** (focus-lands-on-heading, route-derived announcer).
- = **16 tests attributable to the a11y project** in a full-suite run.

`--project=a11y-smoke --list` reports **18**, because it includes the `data-setup-base` /
`data-teardown-base` pair the project depends on. Both numbers are correct about different things;
recording only the larger one would overstate the scan coverage by two.

## Static gates

Run with the machine quiet (no dev server, no burners) unless noted.

| Gate | Command | Result |
|---|---|---|
| Build (uncached) | `yarn build --force` | **exit 0** — `Cached: 0 cached, 14 total`, 17.73s |
| Build (cached) | `yarn build` | exit 0 — `14 cached, 14 total >>> FULL TURBO` |
| svelte-check | `yarn workspace @openvaa/frontend check` | **exit 0** — `COMPLETED 2683 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Lint | `yarn lint:check` | **exit 0** — `tests` scope `✖ 2 problems (0 errors, 2 warnings)` |
| Format | `yarn format:check` | **exit 0** — `All matched files use Prettier code style!` (run again after the REQUIREMENTS.md edit: exit 0) |
| Test typecheck | `yarn typecheck:tests` | **exit 0** — no output |
| Unit (quiet) | root `yarn test:unit` | **exit 0** — 19/19 tasks; frontend 773, dev-seed 444, app-shared 21, supabase 16; `[NF-01] seed step elapsed: 6733 ms` |
| Unit (7 burners + dev server) | root `yarn test:unit` | **exit 0** — 19/19 tasks, 444/444, seed elapsed **6743 ms**, load avg peak 28.99 |
| Unit (14 burners + dev server) | root `yarn test:unit` | **exit 0** — 19/19 tasks, 444/444, seed elapsed **69006 ms**, load avg peak 34.16, total 1m31.623s |

**Correction to the expected lint baseline.** The brief described the 2 pre-existing warnings as
`Unused eslint-disable directive` warnings, plural. Only one is:

```
tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
  208:94  warning  Use toHaveLength() instead  playwright/prefer-to-have-length

tests/tests/support/mockOidcIssuerEntry.ts
  33:3  warning  Unused eslint-disable directive (no problems were reported from 'no-console')
```

Neither sits in a file Phase 135 touched. Separately, the package-level lint carries its own
pre-existing warnings (`@openvaa/core` 2, `@openvaa/dev-seed` 15, `@openvaa/frontend` 1), all
`unused-imports/no-unused-vars`, all 0 errors. I am recording the actual inventory rather than
matching the expectation, because a baseline nobody has re-read is how a new warning hides.

### GUARD-03 reproduced at the load that discriminates

The 7-burner run is where I would have stopped if the number were the goal: **exit 0**. But this
session's 7-burner seed elapsed was **6743 ms** — *below* the deleted 10000 ms gate. That run is
consistent with load independence but does not demonstrate it, because the old assertion would have
passed there too. (Plan 03's 7-burner run reached 14281 ms; load avg peaked at 36.59 there vs 28.99
here, so this session's burners simply bit less hard.)

At **14 burners on a 14-core machine** the datum discriminates:

```
### burners=14  devserver=200
@openvaa/dev-seed:test:unit: [NF-01] seed step elapsed: 69006 ms (observability only — not asserted)
@openvaa/dev-seed:test:unit:  ✓ tests/integration/default-template.integration.test.ts (1 test) 87702ms
@openvaa/dev-seed:test:unit:  Test Files  42 passed (42)
@openvaa/dev-seed:test:unit:       Tests  444 passed (444)
 Tasks:    19 successful, 19 total
### EXIT=0
```

**69006 ms is 6.9× the deleted 10000 ms budget and 10.2× this session's quiet run — and
`yarn test:unit` exits 0.** Every operation-budget assertion held identically at that multiple,
which is exactly what a load-independent assertion should do.

The same run independently confirms Plan 03's *second* finding, the one that phase found only by
not stopping at its first green: the test itself took **77610 ms**, which would have blown the
**old 60000 ms** per-test timeout. So the re-derivation of that timeout to 300 s was load-bearing,
not cosmetic — and 77610 ms against 300 s leaves 3.9× headroom, so it remains a hang guard rather
than a resurrected performance gate. `grep -c 'toBeLessThan(10_000)'` is still **0**.

## The failure I did hit, and its root cause

The **first** loaded unit run failed — exit 2 — and not on a test:

```
Failed:    @openvaa/question-info#build
 ERROR  run failed: command  exited (2)
 Tasks:    12 successful, 16 total

@openvaa/question-info:build: ../llm/dist/index.js(23,30): error TS7006: Parameter 'provider' implicitly has an 'any' type.
   … 30+ further TS7006 / TS7031 / TS7053, all on ../llm/dist/index.js
```

I had written the load harness to invoke `yarn test:unit --force`. `--force` starts a second turbo
graph that rebuilds every package, while `yarn dev`'s `watch:shared` (`turbo watch build
--filter=./packages/*`) was still running its **initial** full-package pass. Both write
`packages/llm/dist`. `packages/llm/package.json` declares `"types": "./dist/index.d.ts"` with
`"exports": {"import": "./dist/index.js"}`, and `tsup` cleans the output folder before emitting — so
there is a window where `index.js` exists and `index.d.ts` does not, in which a consumer typechecks
the **JavaScript** and reports implicit-`any` on every exported symbol. That is exactly the error
shape observed, and `packages/llm/dist/index.d.ts`'s mtime tracked the concurrent rebuild.

Discriminated against three controls rather than asserted:

| condition | result |
|---|---|
| `yarn test:unit --force`, watcher mid-initial-pass (dev server started 20 s earlier) | **FAILS** at `question-info#build` |
| `yarn test:unit --force`, watcher idle (same session, 90 s later) | exit 0, 19/19 |
| `yarn build --force`, no dev server at all | exit 0, 14/14 |
| `yarn test:unit` (no `--force`), watcher running, 7 and 14 burners | exit 0, 19/19 |

**No gate command is affected.** In `turbo.json`, `test:unit` is `"cache": false` while `build` is
cached, so the plain `yarn test:unit` re-runs every test while rebuilding nothing — there is no
window to race. `--force` was my addition, not the requirement's command, and dropping it was a
correction to the harness, not a workaround on the code. Logged as **DEF-135-05** with the
mechanism and a suggested fix (emit declarations to a staging dir and swap atomically, or drop
`clean: true` from the package `tsup` configs).

I want to be explicit that this is not a swept-aside failure: it was reproduced conditionally,
falsified under three controls, attributed to a specific file-level mechanism, and written down.

## Requirement flips

GUARD-01/02/03 are ticked and their traceability rows read `Complete (2026-08-11)`. Each annotation
cites measured values:

- **GUARD-01** — base-8 verified in the live DB at `{minSelections: 1, maxSelections: 1}`,
  `sort_order` 107, base-7 unchanged at `{2,3}`; the guard is an exact-string assertion firing twice
  per journey; **both** negative controls quoted with their received strings
  (`"Select 1 CORRUPTED option."` and the raw key `"questions.multiChoice.selectExact"`), each
  1 failed / 3 passed — including the argument for why a `/select/i` regex would have been a guard
  that cannot fail. The `click 2` → `selectSmallestValidMultiChoice` ripple is recorded with the
  reason it mattered: over-max on base-8 silently dropped the voter's answer while the walk believed
  it had been saved.
- **GUARD-02** — the 14-scan matrix, the four new dark attachments each `[]`, and the mechanism
  correction with its measurement (30 elements still painting light `#333333` under the flip;
  `rgb(51,51,51)` vs `rgb(204,204,204)` on the menu toggle; 0 stale under a born-dark context), plus
  the two-mechanism validation of `assertDarkThemeApplied`.
- **GUARD-03** — the closed operation budget, `grep -c 'toBeLessThan(10_000)'` → 0, both negative
  controls quoted, and **the injected N+1 datum: +937 ms (5817 → 6754 ms), invisible to the old
  10 s gate, caught instantly by the operation budget as `expected 328 to be 1`** — plus this
  session's saturation reproduction.

### Carried in the requirement text, not just here

Per the Phase 134 discipline, so they survive milestone close:

1. **DEF-135-04** (in GUARD-01) — unexplained one-off; did not recur across the gate; **stays OPEN**.
2. **Visual-regression baselines** (in GUARD-01) — the `@visual` project is **excluded from
   `yarn test:e2e`**, so this gate does **not** cover it. base-8 adds a question to the candidate
   preview page, so its **4 PNG baselines need a re-baseline on the canonical CI runner**; local
   font rendering differs by design. A green suite must not be read as implying visual parity.
3. **DEF-135-01** (in GUARD-02) — `[data-theme='dark']` is dead CSS, so `--line-color` stays at the
   light `#d9d9d9`; borders only, ~15.9:1, correctly unflagged by axe, pre-existing, **still open**.

A fourth, smaller one is recorded in GUARD-01: the `selectExact` guard locks the **`en`** string,
so the D-18 native-speaker review of the six constructed non-English singulars remains open.

## Deviations from Plan

**1. [Rule 3 — Blocking] The loaded-unit harness raced the dev-server watcher**
- **Found during:** Task 1, first loaded `yarn test:unit` run.
- **Issue:** `--force` in my harness started a second turbo build graph concurrent with
  `watch:shared`'s initial pass; `@openvaa/question-info#build` typechecked `llm/dist/index.js`
  during the window where `index.d.ts` was transiently absent.
- **Fix:** dropped `--force` — the requirement's command is plain `yarn test:unit`, whose
  `test:unit` task is `cache: false`, so tests still genuinely run while nothing rebuilds.
- **Files modified:** none in the repo (harness lives in the scratchpad). Logged as DEF-135-05.
- **Commit:** `bc60c9c8d`

**2. [Rule 2 — Record accuracy] Two stated baselines were imprecise**
- The "2 pre-existing `Unused eslint-disable directive` warnings" is one such warning plus one
  `playwright/prefer-to-have-length`; the "18-test a11y matrix" is 16 project tests (14 axe + 2
  navigation-a11y), with `--list` reporting 18 because it counts the base setup/teardown pair.
- Corrected in this summary and in the requirement text rather than repeated, because a baseline
  that is off by a rule name or by two tests is a baseline that will not catch the next drift.

**Task 1 produced no repository change of its own beyond the deferred-items record** — it is a
verification task, and its output is the evidence in this summary. Rather than leave it commitless,
its findings (the DEF-135-04 gate outcome and the new DEF-135-05) were committed as `bc60c9c8d`.

## Cardinal-rule compliance

No test was skipped, `.fixme`'d, retried-until-green, or annotated as flaky. No assertion was
weakened, no timeout raised to reach green, no rule disabled. The gate count was never restarted
because it never had to be: all three E2E runs were clean on the first attempt. The single failure
encountered was in a static gate, was root-caused to a harness flag rather than absorbed, and is
recorded as an open deferred item.

## Verification — actual output

| Gate | Command | Result |
|---|---|---|
| E2E run 1 | `yarn test:e2e` | **134 passed (10.5m)**, exit 0 |
| E2E run 2 | `yarn test:e2e` | **134 passed (10.6m)**, exit 0 |
| E2E run 3 | `yarn test:e2e` | **134 passed (10.5m)**, exit 0 |
| Suite size | `--list` | **134 tests in 88 files** |
| a11y matrix | run-3 log enumeration | 14 axe scans (7 surfaces × 2 themes) + 2 navigation-a11y |
| Build | `yarn build --force` | exit 0, 14/14 uncached |
| svelte-check | `yarn workspace @openvaa/frontend check` | exit 0, 2683 files, 0/0 |
| Lint | `yarn lint:check` | exit 0 |
| Format | `yarn format:check` | exit 0 (before and after the REQUIREMENTS.md edit) |
| Test typecheck | `yarn typecheck:tests` | exit 0 |
| Unit quiet / 7 / 14 burners | root `yarn test:unit` | exit 0 / exit 0 / exit 0 |
| Working tree | `git status --porcelain` | only `supabase/.temp/cli-latest`, as permitted |
| Commit deletions | `git diff --diff-filter=D HEAD~2 HEAD` | 0 files deleted |

STATE.md and ROADMAP.md were **not** touched — the orchestrator owns those.

## Self-Check: PASSED

- `.planning/REQUIREMENTS.md` — FOUND (GUARD-01/02/03 `[x]`, rows 211-213 `Complete (2026-08-11)`)
- `.planning/phases/135-close-phase-134-coverage-carry-overs/deferred-items.md` — FOUND (DEF-135-05 appended, DEF-135-04 gate update present)
- `.planning/phases/135-close-phase-134-coverage-carry-overs/135-04-SUMMARY.md` — FOUND
- Commit `bc60c9c8d` — FOUND
- Commit `0e58768b7` — FOUND
