---
phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate
plan: '05'
subsystem: testing
tags: [record-correction, requirements-traceability, negative-control, i18n, a11y, residue]

requires:
  - phase: 147-01
    provides: 'the register at 13 declared rows, and the three blind halves (RK1-OLD, RK2-OLD, AX1-OLD) the corrected records now cite'
  - phase: 147-03
    provides: 'the candidate-a11y-scan project and the 14 authenticated scans — the operational half of what CSCAN-01/04 now claim'
  - phase: 147-04
    provides: 'every gate green and every measurement cell filled, so a record could be corrected AFTER its gate rather than ahead of it'
provides:
  - "REAL-04's overstatement retired as a WORDING correction, with the 161 + 121 + 316 = 598 decomposition that makes it checkable and an explicit statement that nothing was recomputed"
  - 'The two drifted line numbers and the wildcard key spelling corrected in FOUR live records (the plan named three; PROJECT.md carried the same drift)'
  - 'CSCAN-01..04 ticked, each against register row IDs rather than prose, each with its boundary stated'
  - "CSCAN-03's falsified opening clause struck inline, so the false premise cannot be read in isolation"
  - '12 todos for every gap this phase carried rather than closed'
  - '147-NEGATIVE-CONTROL.md § Residue (A–F) written; § Completeness re-asserted at 13 rows / 0 unfilled cells with the HEAD every gate was green at'
  - 'The environment handed back — dev server stopped, port free, database left in its db:reset state'
affects: [148-successor-work, a11y, e2e-suite, candidate-app, planning-verification-authoring]

actuals:
  tokens: 20386
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 'A record correction cites the measurement it was corrected against, and states whether it is a premise correction or a decision change (146-09 shape)'
    - 'A falsified clause in a LIVE forward-read record is struck INLINE at the clause, not corrected ten lines below it — placement is part of the correction'
    - 'A requirement tick cites a register row ID; "the phase completed" is not a citation'
    - 'Known gaps are filed one-todo-per-LEVER, not one-per-count — the test is whether a reader can act on one without reading the others'

key-files:
  created:
    - .planning/todos/pending/2026-08-27-147-tou-gate-modal-unscanned.md
    - .planning/todos/pending/2026-08-27-147-empty-answer-candidate-states-unscanned.md
    - .planning/todos/pending/2026-08-27-147-answers-locked-warning-unscanned.md
    - .planning/todos/pending/2026-08-27-147-prevent-navigation-modal-unscanned.md
    - .planning/todos/pending/2026-08-27-147-candidate-error-paths-unscanned.md
    - .planning/todos/pending/2026-08-27-147-candidate-routes-outside-protected-unscanned.md
    - .planning/todos/pending/2026-08-27-147-soft-required-badge-assertion-left-in-place.md
    - .planning/todos/pending/2026-08-27-147-rawkey-verdict-not-its-own-test.md
    - .planning/todos/pending/2026-08-27-147-scan-determinism-is-a-bound-not-an-absence.md
    - .planning/todos/pending/2026-08-27-147-full-suite-disk-headroom-falling.md
    - .planning/todos/pending/2026-08-27-147-register-convention-record-injection-text-verbatim.md
    - .planning/todos/pending/2026-08-27-147-plan-supplied-verify-scripts-measure-a-proxy.md
  modified:
    - .planning/milestones/v2.14-REQUIREMENTS.md
    - .planning/REQUIREMENTS.md
    - .planning/PROJECT.md
    - .planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/147-NEGATIVE-CONTROL.md
    - .planning/todos/completed/2026-08-12-candidate-app-axe-and-rawkey-blind.md

key-decisions:
  - "The REAL-04 retirement is written as a WORDING correction and says so in its own text: the key loader already flattened every catalog file, so the union was always application-wide and there was nothing to recompute. Presenting it as an arithmetic correction would have replaced one false record with another."
  - "The correction distinguishes what the v2.14 record got RIGHT (its D-136-04-1 boundary note scoped the gap to surface reach — accurate) from where the error entered (the later restatement, which converted it into a key-coverage gap). Condemning the whole record would itself have been inaccurate."
  - "PROJECT.md was corrected as a FOURTH record although the plan named three — a stale premise in a live project brief propagates further than one in a milestone archive (Rule 2)."
  - "The out-of-family route count is 12, re-derived from disk; the scout said 11 while NAMING twelve. The enumeration was right and the count was an arithmetic slip — corrected rather than propagated."
  - "The REV1-CLEAN owner discrepancy resolved AGAINST the Gates table: the corpus (row 13) and § Completeness both assign the row to 147-04, and 147-04 took the measurement. Two-to-one plus the observation; the wrong record is named rather than the two made to agree."
  - "CSCAN-03's falsified clause struck INLINE at the operator's direction: content was right, placement was wrong. REQUIREMENTS.md is skimmed by its first clause, so a caveat ten lines down leaves the false premise readable in isolation."
  - "Gaps filed one-todo-per-lever (five todos for six states) rather than one-per-item, so each is actionable alone."

patterns-established:
  - 'Records are corrected AFTER their gates are observed, never before — so a correction never describes a state that turned out not to hold'
  - 'A tick whose requirement wording was falsified by measurement says so in the tick, rather than silently satisfying the sentence'
  - "A register's own anchored row pattern is what any row-count check must use; a detail table's left column is prefixed `row ` so it cannot inflate that count"

requirements-completed: [CSCAN-01, CSCAN-02, CSCAN-03, CSCAN-04]

coverage:
  - id: D1
    description: "ROADMAP criterion 4 — REAL-04's overstatement retired as a wording correction in every live record that carried it, with the decomposition that makes it checkable"
    requirement: CSCAN-04
    verification:
      - kind: other
        ref: "node check over the three named records + PROJECT.md: zero occurrences of the drifted journey line, the drifted fixture line or the wildcard key spelling; 161/121/316 present in the REAL-04 correction (anchored grep for the decomposition string → 1 hit)"
        status: pass
    human_judgment: false
  - id: D2
    description: 'The four CSCAN requirements ticked, each citing register row IDs rather than prose, each with its boundary stated'
    requirement: CSCAN-01
    verification:
      - kind: other
        ref: "node check over .planning/REQUIREMENTS.md § Candidate-App Scan Coverage: all four match /^\\s*-\\s*\\[x\\]/ and each cites ≥1 of the 13 row IDs — CSCAN-01→REACH-14/ORD-OBSERVED/ORD-PERTURB, CSCAN-02→AX1-OLD/AX1-NEW/E2E1-SUITE/DET-RUNS, CSCAN-03→RK1-OLD/RK2-OLD/RK1-NEW/RK2-NEW, CSCAN-04→REACH-14/RK1-NEW/RK2-NEW"
        status: pass
    human_judgment: false
  - id: D3
    description: 'Every gap this phase carried rather than closed is filed as an actionable todo — the six unscanned states, the out-of-family routes, the soft assertion, and the accepted-not-solved items'
    verification:
      - kind: other
        ref: 'ls .planning/todos/pending/2026-08-27-147-*.md → 12 files; each cross-referenced from 147-NEGATIVE-CONTROL.md § Residue B/C/D with its lever'
        status: pass
    human_judgment: false
  - id: D4
    description: '147-NEGATIVE-CONTROL.md § Residue written and § Completeness re-asserted at 13 rows / 0 unfilled measurement cells, with the HEAD every gate was green at'
    requirement: CSCAN-02
    verification:
      - kind: other
        ref: "anchored '^| `ID` ' pattern: grep -c → 13 rows, grep -o 'TBD-147' | wc -l → 0, re-checked after every edit including the HEAD table (whose left column is prefixed `row ` so it cannot inflate the count from 13 to 22)"
        status: pass
    human_judgment: false
  - id: D5
    description: 'This plan changed planning documents only — no executable line moved (T-147-SC, and the plan-level prohibition)'
    verification:
      - kind: other
        ref: 'git diff --exit-code -- apps packages tests .github package.json yarn.lock → exit 0, re-run at each of the three commits'
        status: pass
    human_judgment: false
  - id: D6
    description: 'The environment handed back — the dev server this phase owned since 147-01 is stopped and the port is free'
    verification:
      - kind: other
        ref: "devserver.sh stop → 'port 5173 is free'; devserver.sh status → verdict NOT RUNNING, exit 2; lsof -nP -iTCP:5173 -sTCP:LISTEN → no listener; transcribed as register dev-server table row 17"
        status: pass
    human_judgment: false
  - id: D7
    description: "The phase's most misreadable claim — a green gate on an already-green surface, with two sites deliberately left blind — read by a human before it becomes anyone's premise"
    requirement: CSCAN-03
    verification:
      - kind: manual_procedural
        ref: '147-05 Task 3, checkpoint:human-verify gate="blocking-human" — operator read § Residue A–F and all three locations of the two-matcher claim, verified the filed todos on disk, returned "reads honestly" with one placement correction, applied in 49240f4ad'
        status: pass
    human_judgment: true
    rationale: 'A judgement check by construction. Nothing automatable can decide whether a record will be MISREAD by a later phase; that is exactly why the checkpoint carried gate="blocking-human" and was not auto-approved. The operator both confirmed the claim and found a real defect in it — placement, not content.'

duration: 71 min
completed: 2026-08-27
status: complete
---

# Phase 147 Plan 05: The record corrections — Summary

**The claim later phases would have inherited — that the 598-key figure was voter-only and needed recomputing — is retired in four live records as the wording correction it always was; the four CSCAN requirements are discharged against register row IDs rather than prose; and everything the phase carried rather than closed is filed as twelve actionable todos instead of being absorbed into a green.**

## Performance

- **Duration:** 71 min
- **Started:** 2026-08-27T16:45:00Z
- **Completed:** 2026-08-27T17:56:26+03:00
- **Tasks:** 3 (2 auto + 1 `checkpoint:human-verify`, `gate="blocking-human"`)
- **Files modified:** 18 (5 modified, 12 created, 1 renamed) — **all under `.planning/`**

## Accomplishments

- **The REAL-04 overstatement is retired as a WORDING correction, and says so in its own text.** The later restatement claimed the 598 counted voter keys only and would grow once the candidate catalog was included. It would not: `loadCatalogKeys()` flattens **every** `*.json` in each source directory, which already includes the 17 `candidateApp.*.json` and 10 `adminApp.*.json` files, so the union has been application-wide since it was written. The correction carries the decomposition that makes it checkable — `candidateApp` **161** + `adminApp` **121** + voter/shared **316** = **598**, from the union of three derived sources — and states explicitly that **nothing was recomputed**.
- **The correction separates what the record got right from where the error entered.** REAL-04's own D-136-04-1 boundary note scoped the gap to **surface reach** and was *accurate*; it even named the right fix. The overstatement entered in a **later restatement** that converted it into a key-coverage gap. Only the restatement is retired — labelled a **premise correction, not a decision change**, following `146-09`'s distinction, and citing `147-SCOUT-INVENTORY.md` §§ B and D rather than the corrector.
- **The drifted citations are corrected in FOUR live records, not three.** 921 → **924**, 174 → **179**, and the key corrected to `candidateApp.questions.editAnswer` with **no wildcard segment**. The plan named three files; `.planning/PROJECT.md:19` carried the same drift and was corrected too.
- **All four CSCAN requirements ticked against rows, each with its boundary.** CSCAN-01 → `REACH-14` (and the reach proof, not the fixture's own success, is the evidence); CSCAN-02 → `AX1-NEW` read against `AX1-OLD`, **because the flip is the evidence and the green is not**; CSCAN-03 → `RK1-NEW`/`RK2-NEW` and their **simultaneous matcher passes**; CSCAN-04 → the wording retirement plus the rows showing the gate naming candidate-namespace keys on candidate surfaces.
- **CSCAN-03's own wording is falsified by the measurement, and the tick now says so at the clause.** The requirement reads *"the two named blind sites … now fail."* They do not — the scan fails, the sites still pass, and both remain blind **by design**. The clause is struck inline with the falsification attached directly to it.
- **Twelve todos filed, split by lever rather than by count.** Six unscanned states → five todos; twelve out-of-family routes → one; the soft assertion at `:179`; criterion 5's accepted-not-solved reporting shape; the determinism bound; disk headroom; the register convention `147-01`'s unrecoverable injection text exposed; and the verify-script defect class the operator asked about.
- **The register is closed.** § *Residue* A–F written; § *Completeness* re-asserted at **13 rows / 0 unfilled measurement cells** with the HEAD every gate was green at; the `REV1-CLEAN` owner discrepancy resolved; the dev-server lifecycle closed at table row 17.

## Task Commits

1. **Task 1: Retire the REAL-04 overstatement; fix the drifted citations everywhere** — `fce234ac3` (docs)
2. **Task 2: Tick the four requirements against rows, file the gaps, close the register** — `26356b195` (docs)
3. **Task 3: `checkpoint:human-verify` — the operator's one correction applied** — `49240f4ad` (docs)

## Files Created/Modified

- `.planning/milestones/v2.14-REQUIREMENTS.md` — REAL-04's three drifted citations corrected in place, plus a five-point dated CORRECTION block (wording-not-arithmetic, the decomposition, right-vs-wrong in the record, the corrected citations, and both matchers recorded as still blind).
- `.planning/REQUIREMENTS.md` — CSCAN-01..04 ticked with row citations and boundaries; CSCAN-03's citations corrected and its falsified clause struck inline; the four traceability rows flipped to `Complete (2026-08-27)`.
- `.planning/PROJECT.md` — the fourth record carrying the drift (Rule 2 deviation).
- `.planning/todos/completed/2026-08-12-candidate-app-axe-and-rawkey-blind.md` — corrected, closed against this phase with an explicit **"what was NOT delivered"** section, and moved out of `pending/`.
- `147-NEGATIVE-CONTROL.md` — § *Residue* (A–F), § *Completeness* re-assertion with the per-gate HEAD table, the `REV1-CLEAN` owner correction, and dev-server table row 17.
- 12 × `.planning/todos/pending/2026-08-27-147-*.md`.

## Decisions Made

### 1. The retirement is written as a wording correction, and refuses to look like a recount

The scout is explicit that there is nothing to recompute. The temptation at this point is to write a correction that *looks* like work — new totals, a recount, a table of recomputed figures. That would have replaced one false record with another, and a later phase would then inherit the belief that a recount had happened. The correction therefore leads with *"nothing was recomputed, because there was never anything to recompute"* and supplies the decomposition purely so the claim is **checkable** rather than trusted.

### 2. The record is not condemned wholesale

REAL-04's boundary note said *"the scanner covers the VOTER surfaces only"* — a **surface-reach** statement, which is exactly right, and it named the right fix (extend the route family; do not patch sites). Writing a correction that treated the whole entry as wrong would have been its own inaccuracy. The correction names the boundary note as accurate and retires only the restatement.

### 3. PROJECT.md corrected as a fourth record (Rule 2)

The plan named three files. A grep across `.planning/` found the same drift in `.planning/PROJECT.md:19` — a **live project brief**, read at the start of planning work, where a stale premise propagates further than one sitting in a milestone archive. `.planning/ROADMAP.md` was already correct. The historical records that carry the old citations *as history* (the scout's own "roadmap says → actual" table, the register's pairings, `147-01-PLAN.md`, the 136-era summaries and the fake-guard audit) were deliberately **not** touched — correcting those would falsify the record of what was believed at the time.

### 4. Twelve out-of-family routes, not eleven

`147-SCOUT-INVENTORY.md` § 6 says *"11 further unscanned candidate surfaces"* while **naming twelve**. Re-derived from disk (`find apps/frontend/src/routes/candidate -name '+page.svelte' | grep -v '(protected)'`) → **12**, and the measured set is identical to the named set. The enumeration was right; the count was an arithmetic slip. Recorded as corrected in both the todo and § Residue C rather than propagated — a wrong count is the precise shape of premise this plan spent its first task retiring.

### 5. The `REV1-CLEAN` owner discrepancy resolved against the Gates table

Inherited from `147-04`, which recorded it in place rather than rewriting it silently. § *The corpus* row 13 and § *Completeness* both assign the row to `147-04`; the Gates table said `147-05`. **The Gates table is the wrong one**, on three counts: the corpus is this register's declared authority over its own row set, Completeness independently counts `REV1-CLEAN` among the six rows `147-04` filled, and `147-04` is the plan that actually took the measurement. Corrected to `147-04`, with which record was wrong stated rather than the two made to agree.

### 6. Gaps filed one-todo-per-lever

Six unscanned states became **five** todos, not six and not one. The ToU-gate state is alone because it is the only one whose dataset already ships (`test-e2e-base-ca-aa-hidden`, terms acceptance deliberately absent at `base.ts:1076`); the questions-intro and logout-modal states share **one** lever (an answerless candidate) so they are one todo; `answersLocked` is alone because its lever would move the scan project out of Playwright phase 3 and back inside the two ordering hazards `147-02` measured its way out of. The test applied throughout: *can a future reader act on one without reading the others?*

### 7. The checkpoint correction: placement is part of a correction

Applied at the operator's direction. The ⚠ caveat correcting CSCAN-03's false *"now fail"* clause was emphatic and correct, but sat ten lines below the clause it corrects. `.planning/REQUIREMENTS.md` is a **live, forward-read** document skimmed by its first clause — unlike the v2.14 archive, where preserving original wording verbatim and correcting beneath it is the right convention. The clause is now struck (`~~…~~`) with the falsification attached **at** it, and struck rather than deleted so the original wording stays recoverable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] A fourth live record carried the drifted citations**

- **Found during:** Task 1
- **Issue:** The plan named three records. `grep` across `.planning/` found `.planning/PROJECT.md:19` carrying `candidate-journey.spec.ts:921` and `candidateProfilePage.fixture.ts:174` — a live project brief, and one of the first documents read when planning starts.
- **Fix:** Corrected to `:924` / `:179`, with a dated note citing `147-SCOUT-INVENTORY.md` § D and stating that **both sites are still blind at Phase 147's close, by design**.
- **Files modified:** `.planning/PROJECT.md`
- **Verification:** the Task-1 check re-run with PROJECT.md added to the file list → 0 occurrences of any stale form.
- **Committed in:** `fce234ac3`

**2. [Rule 1 - Bug] Task 1's verify script asserts the decomposition with bare substring matches**

- **Found during:** Task 1 (checked before trusting, per the upstream note)
- **Issue:** `if(!/161/.test(v) || !/121/.test(v) || !/316/.test(v))` — three-digit substrings that occur incidentally throughout a 265-line requirements file. The check would have **passed without the decomposition being present**: vacuous, the mirror image of `147-04`'s two defective scripts.
- **Fix:** the script's own assertions kept, plus an anchored grep for the decomposition string itself (`` `candidateApp` 161 + `adminApp` 121 + voter/shared 316 ``) → 1 hit. Both were run.
- **Files modified:** none — the script is inline in the plan, not in the tree.
- **Verification:** anchored grep returns 1; the plan's own script prints `OK three records corrected, decomposition present`.
- **Committed in:** `fce234ac3`

**3. [Rule 2 - Missing Critical] A closed todo left in `pending/` re-enters as an open item**

- **Found during:** Task 1
- **Issue:** the plan's `files_modified` and its verify script both address the todo at its `pending/` path, but a todo carrying a `## RESOLVED` section while sitting in `pending/` is exactly the stale-record failure this plan exists to prevent.
- **Fix:** corrected and closed in place, then `git mv`'d to `.planning/todos/completed/` — the convention in current use (`phase-145`, `144-07`, `143-02`). The verify assertion was re-run against the new path, unchanged in substance.
- **Files modified:** `.planning/todos/{pending → completed}/2026-08-12-candidate-app-axe-and-rawkey-blind.md`
- **Verification:** post-commit deletion check confirmed the only deletion is the rename's source half; the re-run check passes on all four records.
- **Committed in:** `fce234ac3`

**4. [Rule 2 - Missing Critical] The new HEAD table would have inflated the register's own row count**

- **Found during:** Task 2
- **Issue:** § *Completeness*'s per-gate HEAD table has a left column of backticked row IDs, which the register's anchored `^| \`ID\` ` pattern counts as register rows. The count read **22**, not 13 — the same trap `147-04` hit with its revert table.
- **Fix:** left column re-worded to `row \`ID\``, the precaution `147-01` and `147-04` each documented, with a note in the table saying why.
- **Files modified:** `147-NEGATIVE-CONTROL.md`
- **Verification:** anchored count back to **13 rows / 0 unfilled cells**, re-checked after every subsequent edit.
- **Committed in:** `26356b195`

**5. [Rule 1 - Bug] The out-of-family route count was wrong in its source**

- **Found during:** Task 2
- **Issue:** the plan and the scout both say **eleven** out-of-family candidate routes; the scout's own enumeration **names twelve**, and `find` over the route tree returns **twelve**.
- **Fix:** filed and recorded as **12 (measured)**, with the discrepancy disclosed as an arithmetic slip in a correct enumeration. The plan's Task-2 script does not assert the number, so no check conflicts.
- **Files modified:** the out-of-family todo, `147-NEGATIVE-CONTROL.md` § Residue C
- **Verification:** `find apps/frontend/src/routes/candidate -name '+page.svelte' | grep -v '(protected)' | wc -l` → 12, enumerated in the todo.
- **Committed in:** `26356b195`

---

**Total deviations:** 5 auto-fixed (2 bugs, 3 missing-critical)
**Impact on plan:** none on scope. Two are corrections to the plan's own instructions, two are corrections to inherited records, one is a register invariant the new table would have broken. No scope creep — every change is a `.planning/` byte.

## Checkpoint

**Task 3 — `checkpoint:human-verify`, `gate="blocking-human"`.** Not auto-approved, and not auto-approvable: `blocking-human` is never bypassed in any mode. The phase's headline is a **green gate on surfaces that were already measured green**, so its honesty rests entirely on the boundaries being stated correctly — which is a judgement no check can make.

The operator read § *Residue* A–F in full and all three locations of the two-matcher claim, and verified the 11 filed todos on disk. **Verdict: reads honestly, with one correction.**

**What was accepted as-is:** § Residue A–F; the three non-coinciding cross-instrument counts left with no todo (nothing claimed rests on the divergence); `AX1-NEW`'s weakened source-blob pairing, explicitly accepted as disclosed rather than strengthened; the `REV1-CLEAN` owner correction; the 12-not-11 route count; and the PROJECT.md Rule-2 call.

**The one correction, and why it was right:** CSCAN-03's tick opened with the original requirement text — *"the two named blind sites … now fail"* — with the correcting caveat ten lines later. The content was right; the **placement** was wrong, because requirement lists are skimmed by their first clause and `.planning/REQUIREMENTS.md` is live and forward-read. Left as it was, the false clause would have been the first and possibly only thing a later phase read — the exact false-premise propagation § Residue A exists to prevent. Applied in `49240f4ad`. The v2.14 CORRECTION block and the completed todo's `## RESOLVED` section were judged to read clearly and were **not** touched.

**On the verify-script defect class the orchestrator raised:** I agree, and it was **not** carried anywhere. `147-03` and `147-04` each recorded theirs as a per-plan deviation inside their own SUMMARY; nothing aggregated them, which is how the same defect reached three plans running — and my own Task 1 makes it four instances, in the opposite direction (a check that would have passed vacuously). Filed as `2026-08-27-147-plan-supplied-verify-scripts-measure-a-proxy.md`, with the root cause (scripts authored against a human summary of the artefact rather than the addressing convention the artefact defines, and never executed against a known-correct tree) and three cheap rules. Also recorded in § Residue D so it is visible from the register.

## Issues Encountered

**The plan's own artefact list pointed at a path that should not survive the task.** Task 1's verify script and `files_modified` both address the resolved todo at its `pending/` path. Resolving that in favour of the convention (`completed/`) rather than the literal path is recorded as deviation 3 above; the check's substance was preserved.

**Nothing else.** This plan took no measurement, ran no suite, and filled no register cell — by design. Every claim it makes is a citation of an observation some earlier plan took.

## Known Stubs

None. Every corrected claim cites a scout section or a register row ID, and every gap is filed rather than described.

## Threat Flags

None. The plan's `<threat_model>` mitigations are discharged: **T-147-18** (repudiation in the corrected records) — every corrected claim cites `147-SCOUT-INVENTORY.md` § B/§ D or a register row, and the REAL-04 correction states its class explicitly (premise correction, not decision change); **T-147-19** (disclosure by omission) — twelve todos, each with its own lever, cross-referenced from § Residue B/C/D; **T-147-20** (tampering with tick marks) — every tick cites at least one filled row by ID, machine-checked; **T-147-SC** — no install occurred and no executable line moved, `git diff --exit-code -- apps packages tests .github package.json yarn.lock` exit 0 at each of the three commits.

## Verification

| check | result |
|---|---|
| drifted citations remaining in the four live records | **0** (journey line, fixture line, wildcard key spelling) |
| REAL-04 correction carries the decomposition | **OK** — anchored grep for `` `candidateApp` 161 + `adminApp` 121 + voter/shared 316 `` → 1 |
| CSCAN-01..04 ticked | **4/4**, each `- [x]` |
| CSCAN-01..04 cite register rows | **4/4** — REACH-14/ORD-\*; AX1-OLD/AX1-NEW/E2E1-SUITE/DET-RUNS; RK1-OLD/RK2-OLD/RK1-NEW/RK2-NEW; REACH-14/RK1-NEW/RK2-NEW |
| traceability table rows | **4/4** `Complete (2026-08-27)` |
| register rows (anchored) | **13** |
| register unfilled measurement cells (anchored) | **0** |
| `## Residue` present and non-trivial | **OK** — sections A–F |
| phase-147 todos filed | **12** |
| `git diff --exit-code -- apps packages tests .github package.json yarn.lock` | exit **0** at all three commits |
| `npx prettier --check` on every touched planning doc | **OK** |
| dev server | **stopped** — `devserver.sh status` verdict `NOT RUNNING` (exit 2), `lsof` no listener on 5173 |

## Self-Check: PASSED

- `.planning/milestones/v2.14-REQUIREMENTS.md` — FOUND, REAL-04 CORRECTION block present
- `.planning/REQUIREMENTS.md` — FOUND, 4/4 ticked with row citations, CSCAN-03's clause struck inline
- `.planning/PROJECT.md` — FOUND, corrected
- `.planning/todos/completed/2026-08-12-candidate-app-axe-and-rawkey-blind.md` — FOUND, `## RESOLVED` present
- `.planning/phases/147-…/147-NEGATIVE-CONTROL.md` — FOUND, § Residue A–F, 13 rows, 0 unfilled cells
- 12 × `.planning/todos/pending/2026-08-27-147-*.md` — all FOUND
- commit `fce234ac3` — FOUND
- commit `26356b195` — FOUND
- commit `49240f4ad` — FOUND

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Phase 147 is complete.** All five plans have summaries; all four CSCAN requirements are ticked against rows; the register is closed at 13 rows, 0 unfilled cells, with its § Residue written.

What the next phase inherits:

- **The environment, handed back deliberately.** The dev server is **stopped** and port 5173 is free — the next phase starts its own. The database is left in its **`db:reset`** state, which is what every gate in this register required; `yarn db:seed:default` restores the Finnish demo data **and re-reddens the suite** (the scout measured the `default` template producing 7 failed / 79 did-not-run on an unchanged tree). That is the standing trade, not a regression.
- **A green suite at 150/0** with the 14 candidate scans blocking, last observed four consecutive times at `ff37a87fc`.
- **Twelve open todos**, each actionable alone. The two with the most leverage: the **twelve out-of-family candidate routes** (no authentication needed — they can ride the cheaper voter-shaped scan path, so none of the machinery Phase 147 built is required) and the **ToU gate modal** (its dataset already ships).
- **⚠ Two matchers that are still blind.** `candidate-journey.spec.ts:924` and `candidateProfilePage.fixture.ts:179`. The phase closed the raw-key **class** on the candidate surfaces via the scan; it did **not** repair either site, and every record now says so at the point where it could be misread. A later phase reading "the matchers were fixed" has read them wrongly.
- **A defect class in plan authoring, newly named:** plan-supplied `<verify>` scripts that measure a proxy for the claim. Four instances across three plans in this phase alone. Worth reading before the next plan's checks are written.

---

_Phase: 147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate_
_Completed: 2026-08-27_
