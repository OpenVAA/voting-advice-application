---
phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate
plan: '01'
subsystem: testing
tags: [playwright, axe-core, a11y, wcag, paraglide, i18n, negative-control, e2e]

requires:
  - phase: 147-scout
    provides: '147-SCOUT-INVENTORY.md — the 42-scan zero-violation measurement, the drift-corrected line numbers and key spelling, and the db:reset environment finding'
  - phase: 136-real-04
    provides: 'the raw-i18n-key scanner, its three-source key union, and the 598 -> 597 export-count control this plan reuses as its injection-took instrument'
provides:
  - '147-NEGATIVE-CONTROL.md — the phase register, corpus declared at 13 rows before any row was filled'
  - 'BASE-GREEN — the full default suite re-derived at 135/0/0/0/0, with per-test durations mineable by 147-02'
  - 'RK1-OLD / RK2-OLD — the raw-key blindness measured at both named sites as two-run controls'
  - 'AX1-OLD — the axe blindness measured as a full-suite green with a real WCAG violation live'
  - 'clean AND injected blob hashes for all 15 instrument paths, so 147-04 can prove instrument identity'
  - 'tests/e2e-runs/147/ — the gitignored harness (devserver.sh, run-suite.sh, summarize.mjs, identity-probe.mts) the rest of the phase runs through'
affects: [147-02, 147-03, 147-04, 147-05]

actuals:
  tokens: 16000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 'dev-server lifecycle helper whose start-gate REUSES the suite'"'"'s own assertServedApp rather than reimplementing it, so helper and preflight cannot drift'
    - 'per-run evidence directories carrying provenance + results.json + durations.csv + stdout.log, with the preflight verdict counted from captured stdout'
    - 'blindness halves recorded with BOTH clean and injected blob hashes, so a later catch half can prove it shares an instrument'

key-files:
  created:
    - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-NEGATIVE-CONTROL.md
    - tests/e2e-runs/147/devserver.sh
    - tests/e2e-runs/147/run-suite.sh
    - tests/e2e-runs/147/summarize.mjs
    - tests/e2e-runs/147/identity-probe.mts
  modified: []

key-decisions:
  - 'Wrote a phase-local run wrapper instead of using tests/scripts/e2e-run.sh, because that wrapper spawns and owns its own dev server and refuses to adopt a foreign listener — two owners of port 5173 would void the register'"'"'s dev-server audit trail. Its proven Playwright invocation was reused verbatim.'
  - 'Added --reporter=html,json with a per-run PLAYWRIGHT_JSON_OUTPUT_FILE because the repo'"'"'s configured reporter is HTML-only and therefore not machine-mineable. Reporters are passive; this changes what is recorded, never what is executed.'
  - 'Deleted the two keys from the RUNTIME catalog only, never from the type-gen source or the generated key union, so the scanner retains the expectation that makes the injection detectable.'
  - 'Chose image-alt (a visible <img> with no alt) as the axe injection: real under the gate'"'"'s own tag set, present on all six leaf routes via the shared layout, and provably outside every container the suite'"'"'s two image-role matchers scope to.'

patterns-established:
  - 'Injection-took proof: read the compiled Paraglide export count before and after every catalogue deletion, and restart the dev server between injection and verdict.'
  - 'Two-proof revert: git diff --exit-code at 0 AND git hash-object equality against pre-recorded clean hashes — both, never one.'
  - 'Full-suite trace search: presence of an injected element must be searched across ALL traces, not the largest one; a single-trace probe produced a false zero here.'

requirements-completed: [CSCAN-02, CSCAN-03]

coverage:
  - id: D1
    description: 'The register exists with all 13 rows pre-written by ID before any measurement, Completeness arithmetic and an empty Residue section'
    requirement: CSCAN-02
    verification:
      - kind: automated_ui
        ref: "grep -cE '^\\| `(BASE-GREEN|...|REV1-CLEAN)` ' 147-NEGATIVE-CONTROL.md => 13"
        status: pass
    human_judgment: false
  - id: D2
    description: 'BASE-GREEN: full default suite at 135 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run, total re-derived from the run'
    requirement: CSCAN-02
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/147-base-green/ (results.json, summary.json, durations.csv, stdout.log)'
        status: pass
    human_judgment: false
  - id: D3
    description: 'RK1-OLD / RK2-OLD: both named matchers PASS while their i18n keys render raw — the raw-key blindness, each as a two-run control'
    requirement: CSCAN-03
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/147-rk1-old/ and tests/e2e-runs/147-rk2-old/ (candidate-journey passes; en.js 598 -> 597; raw key in trace, working string absent)'
        status: pass
    human_judgment: false
  - id: D4
    description: 'AX1-OLD: the FULL default suite stays green with a real WCAG 2.1 AA violation live on all candidate (protected) surfaces'
    requirement: CSCAN-02
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/147-ax1-old/ (135 passed, exit 0; element proven live in 29 occurrences across 13 traces)'
        status: pass
    human_judgment: false
  - id: D5
    description: 'Zero surviving bytes — three injections, three reverts, each proven twice'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: 'git diff --exit-code -- apps packages tests .github package.json yarn.lock => 0; git hash-object equality on all 15 paths'
        status: pass
    human_judgment: false

duration: 65min
completed: 2026-08-27
status: complete
---

# Phase 147 Plan 01: Blindness Halves and Register Opening Summary

**Both blindness halves reproduced exactly as the roadmap claims — the two named matchers pass while their i18n keys render raw, and the full default suite reports 135/0 with a real WCAG violation live on seven candidate surfaces — recorded in a 13-row register on a tree left byte-identical to the one the plan started on.**

## Performance

- **Duration:** ~65 min (plus one blocking operator checkpoint at the head)
- **Started:** 2026-08-27T06:05Z
- **Completed:** 2026-08-27T07:10Z
- **Tasks:** 3 of 3
- **Files modified:** 1 committed (`147-NEGATIVE-CONTROL.md`) + 4 gitignored harness files created
- **Suite runs:** 5, all preflight-confirmed, none retried or abandoned

## Accomplishments

- **The axe blindness is measured, not argued.** A visible `<img>` with no `alt` — axe rule `image-alt`, tag `wcag2a` — was live on every candidate `(protected)` surface and the **full default suite reported 135 passed / 0 failed**, identical to the un-injected baseline. `a11y-smoke` itself passed 16/16 because its route table is voter-only. That green is `147-04`'s reason to exist.
- **The raw-key blindness is measured at both named sites, each as a two-run control.** `candidate-journey.spec.ts:924` and `candidateProfilePage.fixture.ts:179` both **passed** while their keys rendered as literal dotted paths. Each injection was proven to have *taken* before its verdict was read (Paraglide `en.js` **598 → 597** both times, the specific mangled export gone).
- **`BASE-GREEN` is mineable.** 135/0/0/0/0, re-derived from the run's own `results.json` rather than carried from the scout's 135 — and it coincides with it. Per-test durations are recoverable for `147-02`.
- **Zero surviving bytes.** Three injections, three reverts, each proven twice (`git diff --exit-code` at 0 **and** `git hash-object` equality), plus a post-revert confirmation run so the axe row does not end on an unverified restoration.
- **Both instrument states recorded.** Clean **and** injected blob hashes for all 15 paths, so `147-04` can prove its catch half shares an instrument with the blind half.

## Task Commits

1. **Task 1: Open the register, stand up the dev-server helper** — `4a8cd6c1e` (docs)
2. **Task 2: The raw-key blind half — BASE-GREEN, RK1-OLD, RK2-OLD** — `07bb87587` (docs)
3. **Task 3: The axe blind half — AX1-OLD** — `4d4032367` (docs)

## Files Created/Modified

- `.planning/phases/147-.../147-NEGATIVE-CONTROL.md` — the phase register: 13 rows declared up front, 4 filled here, 54 `TBD-147` cells left for later plans
- `tests/e2e-runs/147/devserver.sh` — dev-server lifecycle (`start`/`stop`/`restart`/`status`); its start-gate calls the suite's own `assertServedApp`
- `tests/e2e-runs/147/identity-probe.mts` — the two-line adapter that makes that reuse possible
- `tests/e2e-runs/147/run-suite.sh` — one evidence-producing run against the helper-owned server; fails closed on an unverified server or a missing preflight line
- `tests/e2e-runs/147/summarize.mjs` — mines `results.json` into counts + `durations.csv`

## Evidence locations

| row | run dir | verdict |
|---|---|---|
| `BASE-GREEN` | `tests/e2e-runs/147-base-green/` | 135 passed, exit 0, 10.8 min |
| `RK1-OLD` | `tests/e2e-runs/147-rk1-old/` | candidate-journey **PASS** with the key raw |
| `RK2-OLD` | `tests/e2e-runs/147-rk2-old/` | candidate-journey **PASS** with the key raw |
| `AX1-OLD` | `tests/e2e-runs/147-ax1-old/` | 135 passed, exit 0, violation live |
| AX1 post-revert | `tests/e2e-runs/147-ax1-postrevert/` | 5/5 passed |

**`BASE-GREEN`'s per-test durations are recoverable, in two places:** `tests/e2e-runs/147-base-green/results.json` (Playwright's own JSON, one `duration` per test result — the primary source) and `tests/e2e-runs/147-base-green/durations.csv` (flattened to `project,file,line,status,attempts,duration_ms,title`, sorted longest-first). The 16 `a11y-smoke` entries total **130.2 s**, itemised in the register; `candidate-journey` is a single test at **27252 ms**. `147-02` is unblocked.

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one: the two keys were deleted from the **runtime** catalogue only. Deleting them from the type-gen source too would have removed them from the scanner's three-source union at the same instant they began rendering raw — the scan would have gone green on the very defect it exists to catch, and the blindness claim would have been vacuous rather than measured.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] The repo's reporter is HTML-only, so no run would have been mineable**

- **Found during:** Task 2 (planning `BASE-GREEN`)
- **Issue:** `tests/playwright.config.ts:312` configures the HTML reporter alone. `147-02` must mine `BASE-GREEN`'s **per-test durations** to cost criterion 5's reporting split, and an HTML report is not machine-readable. A `BASE-GREEN` captured as stdout alone would have blocked the next plan.
- **Fix:** added `--reporter=html,json` with a per-run `PLAYWRIGHT_JSON_OUTPUT_FILE`, reusing `tests/scripts/e2e-run.sh:386-405`'s already-proven invocation verbatim. Reporters are passive observers: this changes what is *recorded*, never what is *executed*. Wrote `summarize.mjs` to flatten the JSON into counts + `durations.csv`.
- **Files modified:** `tests/e2e-runs/147/run-suite.sh`, `tests/e2e-runs/147/summarize.mjs` (both gitignored)
- **Verification:** `durations.csv` carries a `duration_ms` for all 135 tests.
- **Committed in:** `07bb87587` (evidence recorded in the register; the scripts are gitignored)

**2. [Rule 3 — Blocking issue] `devserver.sh` hung any caller that piped its output**

- **Found during:** Task 2 (first post-injection restart)
- **Issue:** `devserver.sh restart | tail` never returned. The backgrounded dev server kept the caller's stdout pipe open, so `tail` waited for an EOF that would only arrive when the server died. The restart itself had **succeeded** — `devserver-history.log` recorded it — but a caller could not tell. With eight restarts in this plan alone, this would have recurred constantly.
- **Fix:** redirected the spawn subshell's own stdout/stderr to the log and added `</dev/null`, so no descendant inherits the caller's pipe.
- **Files modified:** `tests/e2e-runs/147/devserver.sh` (gitignored)
- **Verification:** all five subsequent restarts returned promptly with output; `status` exits 0.
- **Committed in:** `07bb87587` (script gitignored)

**3. [Rule 1 — Bug in my own measurement] A single-trace probe produced a false zero for the AX1 injection**

- **Found during:** Task 3
- **Issue:** the first check for the injected element searched only the **largest** trace in the `AX1-OLD` run and returned **0 occurrences** — which would have meant the injection never rendered and the whole measurement was vacuous. The largest trace belongs to a `perm-*` test that never visits a candidate route.
- **Fix:** searched all 135 traces → **29 occurrences across 13 traces**, on `/candidate`, `/candidate/profile`, `/candidate/questions`, `/candidate/preview`.
- **Verification:** the served DOM shows `["IMG",{"__playwright_current_src__":"http://localhost:5173/favicon.png","src":"/favicon.png","width":"24","height":"24","data-testid":"ax1-old-injection"}]` — no `alt`, image actually loaded, 24×24, not hidden.
- **Committed in:** `4d4032367`, and recorded in the register as a disclosed near-miss rather than deleted.

---

**Total deviations:** 3 auto-fixed (1 × Rule 1, 1 × Rule 2, 1 × Rule 3). No Rule 4 architectural decisions were needed.

## Findings worth carrying forward

1. **The `expect.soft` weakness at `candidateProfilePage.fixture.ts:179` is a second, independent defect** beside the blindness: even a *genuine* miss there would not fail fast. The soft-assertion budget guard in `playwright.config.ts` is scoped to `specs/voter/voter-journey.spec.ts` only, so this site is ungoverned by it.
2. **Both named assertions live inside ONE test** — `candidate-journey.spec.ts:367`, the project's only test (`:924` directly, `:179` via `expectRequiredBadge` called once at `:594`). This tightened the pairing: one un-injected observation covers both sites.
3. **The Svelte compiler already flags the AX1 defect** (`a11y_missing_attribute` at `+layout.svelte:191:2`) and it reddens nothing. A compiler warning that no gate reads is its own small instance of the pattern this phase exists to close.
4. **`147-04` must re-apply the AX1 injection *including its comment*** or record its own injected-state hash — `ca43e76a…` covers both.

## Self-Check: PASSED

- `147-NEGATIVE-CONTROL.md` exists; register pattern returns **13** rows and **54** `TBD-147` cells, matching the document's own Completeness arithmetic (78 − 18 − 6 = 54).
- All three commits found in `git log`: `4a8cd6c1e`, `07bb87587`, `4d4032367`.
- All five run directories exist with `results.json`, `summary.json`, `durations.csv`, `stdout.log`, `provenance.txt`, `exit`.
- `git diff --exit-code -- apps packages tests .github package.json yarn.lock` → exit **0**.
- `git status --porcelain` → clean.
- `yarn lint:check` → exit 0 (22/22). `yarn format:check` → exit 0.
- `tests/e2e-runs/147/devserver.sh status` → exit 0, helper-owned and identity-verified.
