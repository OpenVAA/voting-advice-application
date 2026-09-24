---
phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate
plan: '04'
subsystem: testing
tags: [playwright, axe-core, wcag, i18n, paraglide, negative-control, determinism, e2e]

requires:
  - phase: 147-01
    provides: 'the three blind halves (AX1-OLD, RK1-OLD, RK2-OLD), BASE-GREEN at 135/0, and the clean + injected blob hashes for all 15 instrument paths'
  - phase: 147-03
    provides: 'the candidate-a11y-scan project, the 14 authenticated scans, the shared scan core, and the non-short-circuiting raw-key gate this plan injects against'
provides:
  - 'AX1-NEW — the same image-alt defect, missed by the whole suite in 147-01 and now failing all 14 candidate scans by rule ID and offending selector'
  - 'RK1-NEW / RK2-NEW — each key caught by name while its named matcher passes in the SAME invocation; blob-identical injections (14/14 hashes equal to 147-01)'
  - 'E2E1-SUITE — full default suite 150/0/0/0/0, delta against BASE-GREEN reconciled exactly at +15'
  - 'DET-RUNS — three consecutive full-suite runs on one HEAD, each from a reset database, all 150/0, with per-scan durations for the 14 added scans'
  - 'REV1-CLEAN — 15/15 injected paths byte-identical across the phase range by two proofs; preflight + global setup untouched; no dependency added'
  - 'the register at 13 rows and 0 unfilled measurement cells'
affects: [147-05, a11y, e2e-suite, candidate-app]

actuals:
  tokens: 13728
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 'Pairing a catch half to a blind half at the level the instrument is actually read: source blob where it is reproducible, served DOM where it is not'
    - 'Two opposite verdicts taken from ONE Playwright invocation over two projects, so their simultaneity is a property of the run rather than an argument'
    - 'A determinism claim stated as a frequency bound with its own probability, not as proof of absence'

key-files:
  created: []
  modified:
    - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-NEGATIVE-CONTROL.md

key-decisions:
  - "AX1-NEW's injected-state blob hash could not be reproduced and the row says so rather than smoothing it over: the hash covers a 6-line comment 147-01 never recorded, the injected file never entered git (147-01 committed zero product bytes), and the Svelte compiler strips markup comments so it is not in the traces either. The register's own permitted alternative was taken — record your own injected hash — and instrument identity is carried instead by equal clean hash, byte-identical element line, identical compiled location 191:2, and a byte-identical served DOM node."
  - 'Four full-suite runs rather than three: E2E1-SUITE was taken into its own run directory per its task wording, and DET-RUNS is three further consecutive runs, so the cardinal gate and the determinism gate are independent observations'
  - "run-suite.sh's --project made repeatable (gitignored harness) so the scan and the journey could be observed in ONE invocation — the simultaneity criterion 3 rests on"
  - "The register's unfilled-cell count is asserted with the ANCHORED pattern the file defined at creation; the eight surviving TBD-147 strings are prose defining the convention and are deliberately kept"

patterns-established:
  - 'Reconcile a catch half against where the defect actually renders, read off the product (grep the route) rather than assumed, so a partial catch cannot hide inside a green'
  - 'Record cross-instrument count differences (15 vs 22 vs 11 sightings) as differences between instruments rather than reconciling them away'

requirements-completed: [CSCAN-02, CSCAN-03]

coverage:
  - id: D1
    description: 'ROADMAP criterion 2 — the re-introduced axe defect fails the candidate gate, naming the rule ID and the offending selector, where the same defect left the full suite green two plans ago'
    requirement: CSCAN-02
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/147-ax1-new/ — candidate-a11y-scan 14 failed / 3 passed, exit 1, every failure carrying "id": "image-alt" and a resolved "target" selector'
        status: pass
      - kind: e2e
        ref: 'tests/e2e-runs/147-ax1-new-postrevert/ — 17/17 passed, exit 0, the revert confirmed by a run'
        status: pass
    human_judgment: false
  - id: D2
    description: 'The axe catch half shares an instrument with its blind half, proven at the level the gate reads'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: 'clean blob 18c71976… equal on both sides; element line byte-identical; compiled location [[191, 2 read from the served /@fs module; axe "html" field equals AX1-OLD trace DOM node'
        status: pass
    human_judgment: true
    rationale: "The source-file injected-state hashes differ (ca43e76a… vs f8c08e07…) because 147-01's comment text is unrecoverable. The four substitute equalities are, in my judgement, a stronger pairing than a source hash — but that is a judgement a reviewer should confirm rather than a machine check."
  - id: D3
    description: 'ROADMAP criterion 3 — each raw key makes the candidate scan fail by name while the named blind matcher passes, both verdicts from one run of one broken catalogue'
    requirement: CSCAN-03
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/147-rk1-new/ — 2 failed / 18 passed; scan names candidateApp.questions.editAnswer on cand-questions light+dark; candidate-journey (carrying :924) passed in the same invocation'
        status: pass
      - kind: e2e
        ref: 'tests/e2e-runs/147-rk2-new/ — 2 failed / 18 passed; scan names common.required on cand-profile light+dark; the soft matcher at candidateProfilePage.fixture.ts:179 passed in the same invocation'
        status: pass
      - kind: other
        ref: '14/14 injected-state blob hashes equal to RK1-OLD / RK2-OLD, compared before each run; en.js 598 → 597 both times with the other key intact'
        status: pass
    human_judgment: false
  - id: D4
    description: 'ROADMAP criterion 7 — the full default suite is green with the candidate scans blocking, and green repeatably under real suite contention'
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/147-e2e1-suite/ — 150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run, exit 0, 10.4 min, preflight OK=1 FAILED=0'
        status: pass
      - kind: e2e
        ref: 'tests/e2e-runs/147-e2e-det01|02|03/ — three consecutive runs on HEAD ff37a87fc, each preceded by yarn db:reset, all 150/0, exit 0, wall clocks within 2.1 s'
        status: pass
    human_judgment: false
  - id: D5
    description: 'Every injection reverted with zero surviving bytes, the served-application preflight untouched across the phase, and no dependency added'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: 'git diff --exit-code 4adf451ed..ff37a87fc over all 15 injected paths + preflight.ts + global-setup.ts + package.json + yarn.lock → 0; blob-hash equality at base, HEAD and worktree for every one'
        status: pass
      - kind: other
        ref: 'git diff --name-only over the phase range across apps packages tests .github package.json yarn.lock → 7 paths, all under tests/'
        status: pass
    human_judgment: false
  - id: D6
    description: 'The register reaches 13 rows and 0 unfilled measurement cells, with its Completeness arithmetic closed'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: "anchored '^| `ID` ' pattern: grep -c → 13 rows, grep -o 'TBD-147' | wc -l → 0; Completeness table 18+6+12+6+36 = 78, 78 − 78 = 0"
        status: pass
    human_judgment: false
  - id: D7
    description: 'The static gates hold at the HEAD the runs were taken at'
    verification:
      - kind: other
        ref: 'yarn lint:check (22/22), yarn format:check, yarn build (14/14), yarn test:unit (1832 tests) — all exit 0 at ff37a87fc'
        status: pass
    human_judgment: false

duration: 72 min
completed: 2026-08-27
status: complete
---

# Phase 147 Plan 04: The catch halves and the suite gates — Summary

**The same defect the whole suite missed two plans ago now fails all fourteen candidate scans by rule ID and offending selector; each raw key is named by the scan while its blind matcher passes in the same invocation; and the suite is 150/0 four consecutive times with those scans blocking — thirteen register rows, zero unfilled cells, zero surviving injected bytes.**

## Performance

- **Duration:** 72 min
- **Started:** 2026-08-27T12:33:00Z
- **Completed:** 2026-08-27T13:45:00Z
- **Tasks:** 3
- **Files modified:** 1 committed (`147-NEGATIVE-CONTROL.md`) + 1 gitignored harness script (`run-suite.sh`)
- **Suite runs:** 8, all preflight-confirmed, none retried, replaced or abandoned

## Accomplishments

- **The zero now means something.** `147-SCOUT-INVENTORY.md` measured the candidate surfaces at 0 axe violations across 42 scans *before a byte moved*, which makes a green candidate gate the least informative possible result. `AX1-NEW` supplies the only observation that separates a live gate from a vacuous one: the identical `image-alt` defect, in the identical file at the identical compiled location `191:2`, **missed by a 135/0 full suite in `147-01` and now failing 14 of 14 candidate scans**, each message carrying `"id": "image-alt"` and a resolved `"target"` selector.
- **Criterion 3 is discharged in the exact form it is worded.** For each key, one Playwright invocation over `candidate-a11y-scan` **and** `candidate-journey`: the scan fails naming the key (`candidateApp.questions.editAnswer` on `cand-questions`, `common.required` on `cand-profile`, both themes, `598 catalog keys were checked`) while the named matcher passes **in the same run**. Their simultaneity is what shows the route-family extension was the fix and a matcher patch never was.
- **The raw-key pairing is blob-exact.** All **14** injected-state hashes are byte-identical to `147-01`'s recorded values, compared *before* each run, with `en.js` 598 → 597 both times and the other key left intact — so the change in verdict is localised to the gate and nothing else.
- **Four full-suite runs at 150/0/0/0/0** on one HEAD, each from its own `yarn db:reset`, each preflight-confirmed, wall clocks within 2.1 s of each other. The 14 added scans summed 33.4 / 32.6 / 32.1 s — widest single-scan spread 0.7 s — meeting real suite contention for the first time, against a scout zero taken at a single worker with nothing else running.
- **Zero surviving injected bytes, proven twice per class.** 15/15 injected paths byte-identical across `4adf451ed..ff37a87fc`; the served-application preflight and global setup byte-identical across the same range; no dependency added. The phase changed exactly **7** tracked files, every one under `tests/`.
- **The register is closed at 13 rows and 0 unfilled measurement cells**, with the Completeness arithmetic reconciled (78 − 78 = 0) and the counting convention made explicit rather than assumed.

## Task Commits

1. **Task 1: The axe catch half (AX1-NEW)** — `a619a1c2c` (docs)
2. **Task 2: The raw-key catch halves (RK1-NEW, RK2-NEW)** — `ff37a87fc` (docs)
3. **Task 3: The gates (E2E1-SUITE, DET-RUNS, REV1-CLEAN)** — `b53a2839c` (docs)

## Files Created/Modified

- `.planning/phases/147-…/147-NEGATIVE-CONTROL.md` — six rows filled, four detail sections added (`AX1-NEW`; `RK1-NEW`/`RK2-NEW`; `E2E1-SUITE`/`DET-RUNS`/`REV1-CLEAN`; the `147-04` preflight table), the dev-server history table brought up to date, the Gates table's two `147-04` halves closed, and the Completeness running count completed.
- `tests/e2e-runs/147/run-suite.sh` *(gitignored)* — `--project` made repeatable.

## Evidence locations

| row | run dir | verdict |
|---|---|---|
| `AX1-NEW` | `tests/e2e-runs/147-ax1-new/` | **14 failed / 3 passed**, exit 1 — the catch |
| *(AX1 post-revert)* | `tests/e2e-runs/147-ax1-new-postrevert/` | 17/17 passed, exit 0 |
| `RK1-NEW` | `tests/e2e-runs/147-rk1-new/` | **2 failed / 18 passed**, exit 1 — scan red, journey green |
| `RK2-NEW` | `tests/e2e-runs/147-rk2-new/` | **2 failed / 18 passed**, exit 1 — scan red, soft matcher green |
| `E2E1-SUITE` | `tests/e2e-runs/147-e2e1-suite/` | 150/0, exit 0, 10.4 min |
| `DET-RUNS` | `tests/e2e-runs/147-e2e-det01/`, `-det02/`, `-det03/` | 150/0 ×3, exit 0, 10.4 min each |

## Decisions Made

### 1. `AX1-NEW`'s injected blob hash could not be reproduced — recorded, not smoothed over

The register promised that `AX1-OLD`'s injected text was *"recoverable from this plan's commit range"*. **It is not**, and three independent checks say so: `147-01` committed zero product bytes by design, so the blob `ca43e76a…` is not in the object database (`git cat-file -t` → `could not get object info`); the hash covers a **6-line comment** whose text is recorded nowhere; and the Svelte compiler strips markup comments, so the `147-ax1-old` traces show the `IMG` node with no comment sibling.

The register anticipated exactly this and permits the alternative: *"re-apply the comment verbatim **or** record its own injected-state hash instead."* That branch was taken, and instrument identity is carried by four equalities that bear on what the gate actually reads:

- the **clean** blob hash is equal on both sides (`18c71976…`) — both halves start from the same file;
- the injected element line is **byte-identical**, `data-testid` included;
- the compiled source location is **identical** (`[[191, 2`, read from the served `/@fs` module) and the Svelte warning text matches `147-01`'s verbatim;
- axe's own `"html"` field equals the DOM node `147-01` recorded from its traces.

`AX1-NEW`'s own injection is written out verbatim in the register, so it *is* reproducible from the document — the half of `147-01`'s promise this row keeps.

### 2. Four full-suite runs, not three

`E2E1-SUITE`'s task text says "run the full default suite once into its own run directory"; `DET-RUNS`'s says "three consecutive full-suite runs". Taking `E2E1-SUITE` as `det01` would have satisfied a looser reading and saved ~11 min. Four independent observations were taken instead, so the cardinal gate and the determinism gate do not share a single run's luck.

### 3. `run-suite.sh --project` made repeatable

The wrapper accepted one project. Criterion 3 needs the scan and the journey observed **in one invocation**; two runs would have to be argued comparable rather than being simultaneous by construction. The change touches argument assembly only, the wrapper still fails closed on an unverified server and still requires a positive `E2E PREFLIGHT OK`, and the resulting command is recorded verbatim in each run's `provenance.txt`.

### 4. The unfilled-cell count is the anchored one

Eight `TBD-147` strings survive in the file; all eight are prose defining the placeholder convention (or the fenced examples of the count command), none is a measurement cell. The **anchored** `^| \`ID\` ` count — the pattern this register defined at creation — returns **0** over 13 rows. Deleting a register's explanation of its own placeholder to make a naive `grep` return zero would optimise the check at the expense of the document; the count is stated explicitly instead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 2's and Task 3's verify scripts measure the wrong table**

- **Found during:** Tasks 2 and 3
- **Issue:** both use `s.split('\n').find(l => l.startsWith('|') && l.includes(id))`, which matches the **corpus summary table** (`| 10 | \`RK2-NEW\` | …`) roughly 60 lines before the register row. `RK2-NEW`'s corpus line reads "same, for `common.required`" and never names `RK2-OLD`, so the assertion **fails on a correct implementation**. Task 3's script additionally counts every `TBD-147` in the file, including the six prose sentences that *define* the placeholder — a count that can only be driven to zero by deleting the register's own documentation. Same class as `147-03`'s recorded Task-2 over-count.
- **Fix:** anchored both on `^| \`ID\` `, the pattern the register itself specifies for counting its rows. Same assertions, a selector that measures them. The corrected checks pass; the register additionally asserts `13` rows and `0` anchored cells in its own § *Completeness*.
- **Files modified:** none — the scripts are inline in the plan, not in the tree.
- **Verification:** anchored Task-2 check prints `OK RK1-NEW and RK2-NEW filled and paired`; anchored Task-3 check prints `OK all 13 rows filled, 0 unfilled cells`.
- **Committed in:** `ff37a87fc`, `b53a2839c`

**2. [Rule 3 - Blocking] `run-suite.sh` could not express a two-project invocation**

- **Found during:** Task 2
- **Issue:** `--project` took a single value, but the task requires the candidate scan and the candidate journey in **one** invocation.
- **Fix:** made the flag repeatable (`PROJECTS=()`, one `--project=` per entry); verified the empty-array path is safe under `set -u` on the host's bash 3.2.
- **Files modified:** `tests/e2e-runs/147/run-suite.sh` (gitignored)
- **Verification:** both runs' `provenance.txt` record `--project=candidate-a11y-scan --project=candidate-journey`; the full-suite path still produces the unchanged 150-test invocation four times.
- **Committed in:** `ff37a87fc` (recorded in the register; the script is gitignored)

**3. [Rule 2 - Missing critical] A detail table's left column would have broken the register's own row count**

- **Found during:** Task 2
- **Issue:** the `RK*-NEW` revert table's left column began `| \`RK1-NEW\` |`, which the anchored `^| \`ID\` ` pattern counts as a register row — the count read **15**, not 13.
- **Fix:** re-worded to `| row \`RK1-NEW\` |`, the precaution `147-01` took in its own revert table and documented there.
- **Files modified:** `147-NEGATIVE-CONTROL.md`
- **Verification:** row count back to **13**.
- **Committed in:** `ff37a87fc`

**4. [Rule 2 - Missing critical] The dev-server history table was two transcriptions behind**

- **Found during:** Task 1
- **Issue:** the register requires every dev-server start to be transcribed into its table; `147-03`'s stop/start pair (PIDs `54261`/`4746`) was never added, so the table had stopped being a faithful transcription of `devserver-history.log`.
- **Fix:** rows 9–10 transcribed from the helper's own append-only log and labelled as recovered by `147-04`; rows 11–16 are this plan's own, each written **after** the restart it records.
- **Files modified:** `147-NEGATIVE-CONTROL.md`
- **Verification:** the table now matches `devserver-history.log` line for line through row 16.
- **Committed in:** `a619a1c2c`, `ff37a87fc`

---

**Total deviations:** 4 auto-fixed (1 bug in plan-supplied scripts, 1 blocking harness limitation, 2 missing-critical register invariants)
**Impact on plan:** none on scope or outcome. Two are corrections to the plan's own instructions, one is a gitignored harness change, one repairs bookkeeping an earlier plan owed.

## Issues Encountered

**`AX1-NEW`'s source-blob pairing could not be taken as designed** — the full account is Decision 1 above. It is the one place in this plan where the register's intended proof was unavailable and a substitute had to be argued for; it is flagged as `human_judgment: true` in the coverage block rather than presented as a machine check, and it belongs in `147-05`'s § *Residue* as a record-quality defect in `147-01` (a promise made about a commit range that, by that plan's own design, could not contain the thing promised).

**Disk headroom fell from ~25 GiB to ~23 GiB across the four full-suite runs**, roughly 0.5–1 GiB per run — and it is **not** the run directories, which are 1.8–1.9 MB each. It tracks the `db:reset` cycles (Docker/Postgres growth). No run was voided and the E2E Hard Rule was never in question, but the trend is worth carrying: this repository has voided full-suite runs on ENOSPC before, and `147-02` lost two runs to it.

**Three quantities that do not coincide across instruments, stated rather than reconciled:** `RK1-OLD` counted 15 raw-key occurrences in a trace, the scout counted 22 card actions carrying the label, and this plan's scan reports 11 visible sightings. Three instruments, three datasets. The rows assert the key's presence *by name*, which all three agree on, and nothing here rests on the counts matching.

## Known Stubs

None. Every row is filled from a run whose directory it names, at a HEAD it records. The `human_judgment: true` entry on D2 is a disclosed judgement, not a stub.

## Threat Flags

None. The plan's `<threat_model>` mitigations are discharged and recorded: **T-147-14** (botched revert) — six injections, six reverts, each proven by `git diff --exit-code` **and** blob hash, plus a post-revert confirmation run for the axe half; **T-147-15** (spoofed evidence) — injected-state hashes compared *before* each run, 14/14 equal for the raw-key halves and the axe divergence disclosed with its substitute proofs; **T-147-16** (weakened preflight) — `preflight.ts` and `global-setup.ts` byte-identical across `4adf451ed..ff37a87fc` by both proofs; **T-147-17** (non-deterministic gate) — four full-suite runs from reset databases, nothing annotated or retried; **T-147-SC** — `git diff --exit-code` over `package.json`/`yarn.lock` across the range exits 0, no install occurred.

## Verification

| check | result |
|---|---|
| `AX1-NEW` filled and paired against `AX1-OLD` | **OK** (anchored check) |
| `RK1-NEW` / `RK2-NEW` filled and paired | **OK** (anchored check) |
| register rows | **13** |
| anchored unfilled measurement cells | **0** |
| `git diff --exit-code -- apps/frontend/src/routes/candidate` | exit **0** |
| `git diff --exit-code -- apps/frontend/messages apps/frontend/src/lib/i18n` | exit **0** |
| `git diff --exit-code -- tests/tests/support/preflight.ts tests/global-setup.ts` (range) | exit **0** |
| `git diff --exit-code -- package.json yarn.lock` (range) | exit **0** |
| 15 injected paths, blob hash at base = HEAD = worktree | **15/15 equal** |
| frozen blind-matcher hashes | `cacf8810…` / `d79db2b7…` — unchanged |
| `git status --porcelain -- apps packages tests .github package.json yarn.lock` | **empty** |
| `yarn lint:check` | exit **0** (22/22) |
| `yarn format:check` | exit **0** |
| `yarn build` | exit **0** (14/14) |
| `yarn test:unit` | exit **0** — 1832 tests |
| full default E2E suite ×4 | **150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**, exit 0 each |
| `npx prettier --check` on the register | **OK** |

## Self-Check: PASSED

- `.planning/phases/147-…/147-NEGATIVE-CONTROL.md` — FOUND, 13 rows, 0 anchored unfilled cells
- `tests/e2e-runs/147-ax1-new/` — FOUND (`results.json`, `summary.json`, `durations.csv`, `stdout.log`, `provenance.txt`, `exit`)
- `tests/e2e-runs/147-ax1-new-postrevert/` — FOUND
- `tests/e2e-runs/147-rk1-new/` — FOUND
- `tests/e2e-runs/147-rk2-new/` — FOUND
- `tests/e2e-runs/147-e2e1-suite/` — FOUND
- `tests/e2e-runs/147-e2e-det01/`, `-det02/`, `-det03/` — FOUND
- commit `a619a1c2c` — FOUND
- commit `ff37a87fc` — FOUND
- commit `b53a2839c` — FOUND

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Ready for `147-05`. What it inherits:

- **Every gate green and every row filled.** The register needs only its `## Residue` section, which this plan deliberately did not touch.
- **Four items that belong in that Residue**, named here so they are not rediscovered:
  1. **`147-01`'s unrecoverable injected text** — the register promises `AX1-OLD`'s injection is recoverable from a commit range that, by that plan's own zero-product-bytes design, cannot contain it. A record-quality defect, not a measurement one.
  2. **The `REV1-CLEAN` owner discrepancy** — the corpus assigns it to `147-04`; the Gates table's "Zero surviving bytes" row still says `147-05`. Recorded in place rather than silently rewritten.
  3. **The standing limits of the zero**, unchanged by this plan: one operating system, one identity on one dataset, one viewport — and one contention profile, now *partly* addressed by three full-suite runs but bounded by them (three green runs would clear a 1-in-20 defect with probability ≈ 0.86).
  4. **Disk headroom**, ~23 GiB and falling ~0.5–1 GiB per full-suite run.
- **No run had to be replaced or voided in this plan**, so there is no void to disclose — unlike `147-02`, which carries two.
- **CSCAN-02 / CSCAN-03 stay `Pending` in `REQUIREMENTS.md` by the shared-ID gate (#2388)**, because `147-05-PLAN.md` also declares them and has no summary yet. This plan's `requirements-completed` records what it *discharged* — criterion 2 by `AX1-NEW`, criterion 3 by `RK1-NEW`/`RK2-NEW` — and the checkboxes flip when the last declaring plan finishes.

---

_Phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate_
_Completed: 2026-08-27_
