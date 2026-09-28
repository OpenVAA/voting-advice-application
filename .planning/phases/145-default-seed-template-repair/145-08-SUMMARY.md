---
phase: 145-default-seed-template-repair
plan: "08"
subsystem: testing
tags: [gates, e2e, playwright, vitest, turbo, eslint, negative-control, record-correction, roadmap, requirements]

# Dependency graph
requires:
  - phase: 145-07
    provides: the strand proof and the post-rename app-level regression check — the last measurement rows before the gates
  - phase: 145-01
    provides: the 30-row negative-control ledger whose gate rows and closing sections this plan fills
provides:
  - Seven standing gates run at one HEAD `8372d0dff`, cardinal E2E gate last and green (135 passed, 0 failed / 0 flaky / 0 skipped / 0 did-not-run)
  - Ledger rows `G1`…`G7` filled, and the register closed with zero placeholder cells across all 30 rows
  - `## Gates`, `## Final counts`, `## Completeness` (asserting 30) and `## Residue` completed
  - Three disproved records corrected in place with their disproof beside them, not instead of them
  - TMPL-03 and TMPL-04 marked satisfied with evidence clauses citing rows, artifacts and exit codes
  - A source-level fix for a pre-existing timing-fragile frontend spec that stood between this phase and a truthful gate 1
affects: [146-visual-gate, 151-ship-v0-2-akita-review-stack, milestone-close, apps-frontend-hooks-phase]

actuals:
  tokens: 23375
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Gate ordering is derived from the phase's own contamination hazard, not from the script listing: the database reset sits between gate 6 and gate 7 because gate 1 writes the demo template into the live database and has no post-test teardown"
    - "A red gate is diagnosed at the source, never retried to green: measure the failing thing in isolation, name the mechanism, remove the cost rather than widen the budget"
    - "Disproved records are corrected in place with the disproof beside the original claim, so the record shows what was believed as well as what was measured"
    - "Evidence clauses cite row IDs, artifact filenames and exit codes rather than prose — a clause citing prose can be satisfied by rewriting the prose"

key-files:
  created:
    - .planning/phases/145-default-seed-template-repair/145-08-SUMMARY.md
  modified:
    - .planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/todos/pending/2026-06-06-fix-broken-default-seed-template.md
    - .planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md
    - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts

key-decisions:
  - "Gate 1's first attempt went RED and was diagnosed rather than retried — the ESLint cold start was hoisted out of the assertion budget in its own commit, and all seven gates were then re-run from the new HEAD"
  - "The red gate attempt is disclosed in the ledger rather than deleted: a phase that hides its own failed gate has no standing to publish the green one"
  - "Criterion 1's record correction names TWO fixes, not one — `145-04`'s 'the fix is one key' framing is true of the RLS defect only"
  - "Row `CI1` closes DEFERRED with its runner half unobserved; filling it green on the strength of a source read would be the failure this phase's whole method exists to refuse"
  - "The four residual `party_*` occurrences were recorded as observed-and-out-of-scope rather than swept, because sweeping them would widen the rename past what its strand proof covers"

patterns-established:
  - "Per-plan row tallies are derived from the commit graph (`git show <commit>:<file>` + the row-scoped grep), not copied from plan summaries — the falling placeholder count becomes an assertion about history"
  - "Every number the phase states anywhere is derived ONCE in the ledger's § Final counts; requirements, roadmap and todos cite it and do not re-derive"

requirements-completed: [TMPL-03, TMPL-04]

coverage:
  - id: D1
    description: "The milestone's seven standing gates all run at one HEAD, in the order this phase's contamination hazard requires, each with its command and exit code on the record"
    requirement: "TMPL-03"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn test:unit → g1-unit.log (exit 0; 25/25 tasks, 173 files, 1,821 tests, 0 failed, 0 skipped)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check → g2-lint.log (exit 0; 0 errors, 33 forced verdicts, 0 replays)"
        status: pass
      - kind: other
        ref: "yarn format:check → g3-format.log (exit 0; 0 unformatted files)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn build → g4-build.log (exit 0; 14/14, 0 cached)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check → g5-svelte-check.log (exit 0; 2,684 files, 0 errors, 0 warnings)"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true npx turbo run typecheck → g6-typecheck.log (exit 0; 22/22, 0 cached, 0 'error TS')"
        status: pass
    human_judgment: false
  - id: D2
    description: "The cardinal E2E gate runs last, after a database reset and against exactly one preflight-verified fresh dev server, and is green"
    requirement: "TMPL-03"
    verification:
      - kind: e2e
        ref: "yarn test:e2e → g7-e2e.log (exit 0; 135 passed · 0 failed · 0 flaky · 0 skipped · 0 did-not-run; preflight OK, 0 PREFLIGHT FAIL lines)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The negative-control ledger closes with 30 rows, zero placeholder cells, and a completeness table whose per-class counts sum to 30"
    verification:
      - kind: other
        ref: "row-scoped grep at closing HEAD → 30 rows, 0 'pending' occurrences; 2+4+4+4+3+4+1+7 = 29, +T1 = 30"
        status: pass
    human_judgment: false
  - id: D4
    description: "The disproved records are corrected in place with their disproof, scoped so nothing outside the edit window is destroyed"
    requirement: "TMPL-03"
    verification:
      - kind: other
        ref: "task 2 <verify> block — phase-heading count unchanged (17), requirement-heading count unchanged (40), ROADMAP did not shrink, 0 files outside .planning/ in the commit"
        status: pass
    human_judgment: true
    rationale: "The greps prove the edits were scoped and that the required row IDs and disproof markers are present; whether the corrected prose is an accurate and complete account of what the phase disproved is a reading a human must make."
  - id: D5
    description: "The deferred cold-/results dev-server crash is carried as a standing todo with its reproduction, error text and call site"
    verification:
      - kind: other
        ref: ".planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md — 94 lines, names the verbatim error, the call site and the reproduction"
        status: pass
    human_judgment: true
    rationale: "The todo's stated mechanism is an explicitly unconfirmed hypothesis. Whether the filing carries enough for someone to pick it up cold is a judgment, and the underlying defect remains unfixed and unverified."
  - id: D6
    description: "A pre-existing timing-fragile frontend spec, surfaced by this phase's own gate 1, is fixed at the source rather than tolerated as a flake"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/_guards/eslint-store-guard.test.ts — 30/30 pass, first `it` 11ms (was 5391ms under load, 651-1047ms in isolation)"
        status: pass
    human_judgment: false

# Metrics
duration: 37 min
completed: 2026-08-24
status: complete
---

# Phase 145 Plan 08: The Seven Gates, the Record Corrections, and the Ledger Close Summary

**Seven standing gates green at one HEAD `8372d0dff` with the cardinal E2E suite last and clean (135 passed, 0 failed / 0 flaky / 0 skipped / 0 did-not-run) after a contamination-mandated database reset and one preflight-verified dev server; the 30-row negative-control ledger closed with zero placeholder cells and a completeness table that sums; and three disproved premises corrected in place — including the one this plan was not written to expect, that criterion 1's colour change straddles TWO fixes rather than the "one key" its own plan summary claims.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-08-24T16:10:00Z
- **Completed:** 2026-08-24T16:47:20Z
- **Tasks:** 3
- **Files modified:** 6 (5 under `.planning/`, 1 source file)

## ⚠ The headline is a red gate, disclosed rather than deleted

Gate 1's **first** attempt, at `145-07`'s closing HEAD, **failed**. It is recorded here and in the
ledger's § Gates because a phase that hides its own red gate has no standing to publish the green one.

- **Observed:** `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` → `Test timed out in
  5000ms` on the file's first `it`, which took **5391 ms**. `Tasks: 23 successful, 25 total`, exit 1.
- **The tempting reading was available and was refused.** An immediately preceding run of the
  identical command on the identical tree had passed 25/25. Under this project's cardinal rule there
  is no known-flaky exemption: a test whose verdict tracks machine load is **a real defect to iron
  out**, never a flake to retry, skip or annotate.
- **Diagnosed by measurement, in isolation** (per `feedback_flag_unverified_root_cause`): the first
  `eslint.lintText` call in the file pays the one-time cost of resolving the real flat config and
  loading the typescript-eslint parser; every later call is warm. Three isolated runs: **971 ms ·
  651 ms · 1047 ms**. Inside the full 54-file suite under concurrent load: **5391 ms**. Same tree,
  same assertion, opposite verdict — the cold start was being charged to an assertion bounded by
  vitest's **default 5000 ms** budget.
- **Fixed at the source, not at the budget.** Commit `8372d0dff` hoists the warm-up into a
  `beforeAll` under an explicit 120 s hook timeout. Widening the one `it`'s timeout would have hidden
  the cost rather than removed it, and no number is safe against enough load. No assertion, probe
  path, `ruleId` filter or case count moved; all 30 cases still make their own `lintText` call. The
  first `it` now costs **11 ms**.
- **All seven gates were then re-run from the new HEAD**, which is why every gate row cites
  `8372d0dff` and not the commit `145-07` closed on.

The defect was **pre-existing and unrelated to `packages/dev-seed`** — this phase neither introduced
it nor could have caused it. It was fixed only because it stood between this phase and a truthful
gate 1.

## Accomplishments

- **Seven gates, one HEAD, all exit 0**, with `git rev-parse --short HEAD` identical and
  `git status --porcelain -- packages apps tests .github` printing nothing at both ends — so the set
  is one claim about one tree rather than seven claims about seven.

  | # | Gate | Exit | Numbers |
  |---|---|---|---|
  | 1 | unit | **0** | 25/25 tasks · `0 cached, 25 total` · 11 workspaces · 173 files · **1,821** tests · 0 failed · 0 skipped |
  | 2 | lint | **0** | 0 errors · 20 pre-existing warnings · 33 forced verdicts · 0 replays |
  | 3 | format | **0** | 0 unformatted files |
  | 4 | build | **0** | 14/14 · `0 cached, 14 total` |
  | 5 | frontend typecheck | **0** | 2,684 files · 0 errors · 0 warnings |
  | 6 | repo typecheck | **0** | 22/22 · `0 cached, 22 total` · `grep -c 'error TS'` → 0 |
  | 7 | **E2E, cardinal, last** | **0** | **135 passed · 0 failed · 0 flaky · 0 skipped · 0 did-not-run** |

- **Gate 1's live-Supabase block EXECUTED rather than skipping** — `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` and `DEV_SEED_INTEGRATION_REQUIRED=1` were
  exported, and the log reports `✓ tests/integration/default-template.integration.test.ts (2 tests)`
  with **0** matches for that file reported as skipped. A skipped block is a did-not-run, which this
  project counts as a failure — so without this the phase's own guard would have dropped silently out
  of its own gate.
- **Gate 7's four zeros are counted searches of the log, not readings of the summary line.**
  `[1-9][0-9]* failed` → 0 · `flaky` → 0 · `skipped` → 0 · `did not run` → 0 · `✘`/`✕` → 0 ·
  `test.skip`/`test.fixme` → 0. The served application was proven to be this checkout by the suite's
  own preflight (1 success line, 0 `PREFLIGHT FAIL` lines).
- **The two preconditions between gate 6 and gate 7 were honoured as protocol, not advice.** The
  database was reset **after** gate 1 (whose dev-seed integration test writes the demo template into
  the live database with no post-test teardown) and **no unit run followed it**; and exactly one fresh
  dev server was verified three ways before the suite was invoked — one listener on the port, HTTP
  200, and the served page echoing this working tree's absolute path through Vite's `/@fs` endpoint.
- **The ledger closes with 30 rows and zero placeholder cells**, and the arithmetic is checked rather
  than trusted: 2 OLD/blind + 4 diagnostic + 4 RED + 4 GREEN + 3 must-NOT-fire + 4 strand-proof +
  1 deferred + 7 gate = **29**, + `T1` = **30**.
- **The per-plan tally was derived from the commit graph, not from the plan summaries.** Reading the
  ledger back at each of its own commits with `git show <commit>:<file>` gives 150 → 120 → 100 → 90 →
  80 → 80 → 60 → 55 → 35 → 0, i.e. 6 + 4 + 2 + 2 + 0 + 4 + 1 + 4 + 7 = 30 rows. This **corrected a
  discrepancy** between what two summaries implied and what the history actually shows (see
  Deviations).
- **`CI1` closes DEFERRED, honestly.** Its three source facts are confirmed; its runner half has never
  executed on a GitHub runner and says so. **A grep is not a run.**
- **Three disproved records corrected in place**, each with its disproof beside it rather than instead
  of it (below), and both requirements marked satisfied with evidence clauses citing rows, artifact
  filenames and exit codes.

## The record corrections

### 1. Criterion 1 — the parties clause was never failing

The roadmap recorded **both** of criterion 1's clauses as absent pre-fix, and TMPL-03 carried a
`(currently 0)` parenthetical for parties. **Measured here, that is false.** 8 organization cards
rendered on the **pre-fix** template (`A2-PRE`, `app-before-parties.png`, header `8 parties in
constituency Pirkanmaa`) and **8 again** after the fix (`A2-POST`) — a must-NOT-fire row that held in
both directions. Symptom 1 had been closed by `49a23512e` (2026-06-15), **nine days after** the
originating todo was filed. The candidates tab was the genuinely failing half:
`["Parties","Alliances"]` → `["Candidates","Parties","Alliances"]` with 48 cards.

This is the **third consecutive phase** (143, 144, 145) whose roadmap premise was overtaken by a
commit, which is exactly why the correction is a task rather than a footnote.

### 2. Criterion 3 — all three suggested root causes are disproved

Each recorded as disproved with what disproved it: organizations and nominations **are** seeded
(8 / 377, row `S1`); `app_settings.results.sections` **does** contain the `candidate` entity type
(the tab went missing because `get_nominations` drops entity-less rows, so RLS invisibility presents
as a **missing tab** rather than an empty list — `D1-ANON-PRE`); and the constants were **already
consistent** UPPER_SNAKE in both templates. The cause actually named — the RLS-predicate asymmetry
the `PUBLISHABLE_TABLES` auto-default fails to cover — now sits beside them. The "Depends on"
rationale's own naming-drift suspicion was annotated as disproved too.

### 3. ⚠ Criterion 1's colour change straddles TWO fixes, not one — the correction this plan was not written to expect

`145-04-SUMMARY.md` opens with *"The fix landed and it is one key."* **That is true of the RLS defect
and is not the whole story for criterion 1.** `eab07013f` restored anon visibility, but the probe's
after half **VOIDED twice** (`pw-A-after-void-1.log`, `pw-A-after-void-2.log`) until `9f12a6c94`
(`145-04.1`) closed a second, independent defect: the synthetic answer emitter drew `number` answers
0–100 regardless of the range each question declares, leaving **294 of 327** candidate answers outside
the declared `[0, 10]`, so `normalizeCoordinate` threw and the voter layout hung on `Loading…`. It was
latent **precisely because** anon had previously seen zero candidates, so no candidate number answer
had ever been normalized. The user chose the emitter fix (option A) over widening the question (B) or
clamping in the override (C) at a blocking-human checkpoint. Corrected wherever the one-key framing
would mislead: ROADMAP criterion 1 and the TMPL-03 evidence clause both now state it explicitly, and
row `A1-GREEN` already carried the warning.

### 4. TMPL-04 — from "constant naming" to the `external_id` idiom

The requirement used to say the *constant naming* needed reconciling. The constants were measured
**already consistent** in both templates, so the original wording named work that did not exist while
missing the work that did. Corrected to the `external_id` idiom, and narrowed: **two typecodes** out
of seven hand-authored collections, not a broad drift. The old wording is quoted as history rather
than deleted.

### 5. Observed and left out of scope

Four `party_*` occurrences survive in `packages/dev-seed` — `party_vihreat` / `party_kokoomus` in
`src/template/types.ts:105-106` and `party_a` / `party_b` in `README.md:162-163`. They are **generic
API-documentation examples**, not members of the renamed family (whose eight retired values each
measure **0** across the package), and neither file was in `145-06`'s scope. Recorded as
observed-and-out-of-scope in the TMPL-04 evidence clause and in § Residue, **not swept** — sweeping
them would widen the rename past what its strand proof covers.

## Task Commits

1. **Fix blocking gate 1** — `8372d0dff` (fix) — hoist the eslint-store-guard cold start out of its 5 s assertion budget
2. **Task 1: the seven gates at one HEAD** — `cde209fc1` (chore) — rows `G1`…`G7` + `## Gates`
3. **Task 2: the record corrections** — `41a6a125f` (docs) — ROADMAP, REQUIREMENTS, both todos
4. **Task 3: close the ledger** — `725cdb995` (docs) — `## Final counts`, `## Completeness`, `## Residue`

## Files Created/Modified

| Path | What changed |
|---|---|
| `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` | `beforeAll` warm-up under a 120 s hook timeout + the rationale as correctness invariant 5. **0 assertions changed** |
| `.planning/phases/…/145-NEGATIVE-CONTROL-LEDGER.md` | Rows `G1`…`G7` filled; `## Gates`, `## Final counts`, `## Completeness`, `## Residue` completed; closing footer |
| `.planning/ROADMAP.md` | Criteria 1–4 discharged with row citations; criterion 1's starting state and criterion 3's three root causes corrected; plan list 9/9 with `145-04.1` given its own wave entry |
| `.planning/REQUIREMENTS.md` | TMPL-03 and TMPL-04 statements corrected, evidence clauses attached, both checkboxes and both mapping rows flipped |
| `.planning/todos/…/2026-06-06-fix-broken-default-seed-template.md` | All three symptoms annotated **in place** (kept verbatim); `## Resolution` added; frontmatter marked resolved |
| `.planning/todos/…/2026-08-24-cold-results-navigation-crashes-dev-server.md` | Standing filing-of-record section (D-07) |

Gate logs outside the repository, under
`/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-145/`: `g1-unit.log`, `g2-lint.log`,
`g3-format.log`, `g4-build.log`, `g5-svelte-check.log`, `g6-typecheck.log`, `g7-e2e.log`, plus
`g7-dbreset.log`, `devserver-145-08.log`, `gate-head.txt` and four `diag-storeguard-*.log`
isolation-measurement logs.

## Decisions Made

- **Diagnose the red gate rather than re-run it.** The first instinct available — "it passed a minute
  ago, run it again" — is the one the cardinal rule forbids. Measuring the cold start in isolation
  (three runs) before touching anything is what turned a suspicion into a mechanism.
- **Remove the cost from the budget, don't widen the budget.** A larger `testTimeout` on that one `it`
  would have been a smaller diff and a worse fix: it hides a cost that can still grow under load.
- **Fix a file outside the phase's scope, and say why.** `apps/frontend` is not this phase's
  territory. The fix is justified only as a blocking-issue deviation, and is recorded as one.
- **Derive the per-plan tally from the commit graph.** Two summaries' placeholder arithmetic could not
  both be right; reading the ledger back at each of its own commits settled it without asking either
  summary to be trusted.
- **Leave the four `party_*` occurrences alone.** Sweeping them would have been a one-line change and
  a scope widening the strand proof does not cover.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A pre-existing timing-fragile frontend spec blocked gate 1**

- **Found during:** Task 1 (the seven gates)
- **Issue:** `eslint-store-guard.test.ts`'s first `it` paid the ESLint flat-config + typescript-eslint
  parser cold start inside vitest's default 5000 ms per-test budget. Under the full 54-file suite it
  took **5391 ms** and timed out; in isolation the same assertion took **651–1047 ms**. The spec's
  verdict tracked machine load rather than the guard under test.
- **Fix:** Hoisted the warm-up into a `beforeAll` with an explicit 120 s hook timeout. No assertion,
  probe path, `ruleId` filter or case count changed; all 30 cases still make their own `lintText`
  call. First `it` now 11 ms.
- **Files modified:** `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts`
- **Verification:** File alone 30/30 pass; then all seven gates re-run from the new HEAD, gate 1
  exit 0 with the frontend workspace at 54 files / 814 tests / 0 failed.
- **Committed in:** `8372d0dff` (its own commit, as the plan anticipates for a gate fix)
- **Scope note:** pre-existing, unrelated to `packages/dev-seed`, and fixed **only** because it stood
  between this phase and a truthful gate 1.

**2. [Rule 1 - Bug] The exit code of the first gate-1 invocation was not captured**

- **Found during:** Task 1
- **Issue:** The capture used `${PIPESTATUS[0]}`, a bash-ism; the shell here is zsh, so the recorded
  exit code came back empty. **A measurement whose exit code was not captured is not a measurement.**
- **Fix:** Switched to a portable `cmd > log 2>&1; EXIT=$?` form and re-ran. That re-run is what
  surfaced deviation 1 — the first invocation's green had been read from its summary lines rather than
  from an exit code.
- **Verification:** All seven gate logs now end with an explicit `G*_EXIT=0` line.
- **Committed in:** n/a (tooling, no file changed)

**3. [Rule 1 - Record] The per-plan placeholder arithmetic in the plan summaries did not reconcile**

- **Found during:** Task 3 (§ Final counts)
- **Issue:** `145-06-SUMMARY.md` states the count went 60 → 55, which is inconsistent with reconstructing
  the earlier steps from the other summaries' prose.
- **Fix:** Derived the whole sequence from the commit graph instead — 150 → 120 → 100 → 90 → 80 → 80
  → 60 → 55 → 35 → 0 — and recorded in § Final counts that `145-04` cleared **2** rows while
  **amending** `U2` (already filled by `145-02`), which is what the prose reading missed. `145-06`'s
  60 → 55 is correct.
- **Verification:** Sum of the derived per-plan rows = 30, matching the register's measured row count.
- **Committed in:** `725cdb995`

**4. [Rule 3 - Blocking] The new standing todo already existed**

- **Found during:** Task 2
- **Issue:** The plan says to *create*
  `.planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md`. It already
  existed — filed during context capture (`bddfb32ff`) — and already carried the symptom, verbatim
  error, call site and reproduction.
- **Fix:** Enriched in place rather than recreated: added the D-07 standing-filing-of-record section
  confirming it is still unfixed, never touched this phase's measured warm path, and did not affect
  gate 7.
- **Verification:** 94 lines, names `cookies.set` and the call-site file; task 2 `<verify>` passes.
- **Committed in:** `41a6a125f`

**5. [Rule 3 - Blocking] The pre-existing dev server was stopped and replaced**

- **Found during:** Task 1
- **Issue:** The inherited dev stack also ran `turbo watch build`, which contends with gates 2/4/6 and
  can leave Vite serving modules rebuilt underneath it — the known HMR-staleness hazard. The plan
  also requires "exactly one **fresh** dev server for this checkout".
- **Fix:** Stopped the stack before gate 1 (removing its contention from the gate runs) and started
  exactly one fresh `yarn dev` after the database reset, verified by listener count, HTTP 200 and the
  `/@fs` path echo before gate 7 was invoked.
- **Verification:** Suite preflight confirmed the served application from inside the run.
- **Committed in:** n/a (environment, no file changed)

---

**Total deviations:** 5 auto-fixed (2 blocking-issue fixes to code/environment, 1 blocking tooling
fix, 1 record correction, 1 pre-existing artifact reused). **Impact on plan:** deviation 1 is the only
one that changed a tracked file outside `.planning/`, and it changed no assertion. Deviations 2 and 3
each improved the honesty of a recorded number. No scope creep: the four residual `party_*`
occurrences were explicitly **not** swept.

## Issues Encountered

- **Gate 1 red on the first attempt** — resolved; see the headline section and deviation 1. Diagnosed
  in isolation, fixed at the source, all seven gates re-run from the new HEAD. Not retried to green,
  not skipped, not annotated flaky.
- **No storage-502 wedge on `yarn db:reset`.** The known kong/storage race did not occur; the reset
  exited 0 first time.

## Authentication Gates

None — no external service required credentials beyond the local Supabase keys read from
`supabase status -o env`.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None. No stub, placeholder value or unwired data path was introduced by this plan.

## Next Phase Readiness

**Phase 145 is complete.** All four ROADMAP success criteria are discharged with evidence that can be
re-derived from the ledger rather than trusted; TMPL-03 and TMPL-04 are satisfied with row-citing
evidence clauses; the register closes at 30 rows with zero placeholder cells, zero borrowed
observations and zero cache replays admitted as evidence.

**Carried forward, named rather than left implicit** (ledger § Residue):

1. **`CI1`'s runner half is unobserved** and closes deferred — discharged by this branch's first pull
   request to `main`.
2. **The other nine publishable tables were NOT audited** for anon predicates the write path's
   auto-default under-satisfies. This is the *general* form of the defect fixed here and deserves its
   own small phase.
3. **`yarn test:unit` still leaves a seeded dataset in the live local database** (no post-test
   teardown) — already carried by `2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md`, and the
   reason gate 7 must always follow a reset.
4. **The cold-`/results` dev-server crash** is filed, unfixed, with an explicitly unconfirmed
   mechanism — belongs to an `apps/frontend` hooks phase.
5. **Whether other specs share the store-guard's shape** (one-time initialization charged to the first
   assertion rather than to a hook) was **not** surveyed.

**No blockers.** The product tree is clean, all seven gates are green at `8372d0dff`, and the database
currently holds the E2E fixture dataset — the normal post-suite state. One fresh dev server from this
plan is left running on port 5173, matching the state the session inherited.

---
*Phase: 145-default-seed-template-repair*
*Completed: 2026-08-24*

## Self-Check: PASSED

All six files named in `key-files` exist on disk. All four commit hashes resolve in `git log`. All
seven gate logs exist and are non-empty under
`/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-145/`. Every task-level
`<acceptance_criteria>` and `<verify>` block was re-run: task 1 and task 3 pass at the closing HEAD;
task 2's block passed at its own commit, where its `HEAD~1` comparison against the pre-edit ROADMAP
and REQUIREMENTS was still the correct ancestor. The plan-level `<verification>` re-run confirms:
seven gates at one HEAD `8372d0dff` all exit 0 with the cardinal gate last and green; phase-heading
count 17 and requirement-heading count 40 both unchanged; 0 files outside `.planning/` in the three
plan commits; ledger at 30 rows with 0 placeholder cells.
