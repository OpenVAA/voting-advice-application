---
phase: 145-default-seed-template-repair
plan: "05"
subsystem: testing
tags: [playwright, probe, anon-rls, dev-seed, negative-control, injection-and-restore, evidence]

# Dependency graph
requires:
  - phase: 145-default-seed-template-repair
    provides: "145-04 — the anon-RLS terms_of_use_accepted fix, and the byte-identical guard whose second pair this plan measures"
  - phase: 145-default-seed-template-repair
    provides: "145-04.1 — the number-range emitter fix, without which criterion 1's after half VOIDS on render instead of executing"
  - phase: 145-default-seed-template-repair
    provides: "145-03 — the probe spec, the before-half screenshots and the running dev server this plan re-used unedited"
  - phase: 145-default-seed-template-repair
    provides: "145-02 — the anon standing guard, the instrument pair 2 points at a differently-broken dataset"
  - phase: 145-default-seed-template-repair
    provides: "145-01 — the 30-row ledger with A1-GREEN / A2-POST / P2-RED / P2-GREEN pre-written, the HYGIENE-LOOP, and the restoration blob-hash table"
provides:
  - "Criterion 1 CLOSED by measurement in the running app: tab set [\"Candidates\",\"Parties\",\"Alliances\"], 48 candidate cards, 8 party cards, exit 0"
  - "A four-screenshot / two-log / two-HEAD before-and-after pair produced by one unedited spec, recorded in the ledger's new § Criterion 1 — before and after"
  - "D-06 pair 2 CLOSED: the 145-02 guard reds on candidates that CARRY terms_of_use_accepted and are still anon-invisible — so it asserts the RLS boundary, not one column's presence"
  - "The pair-2 injected diff recorded verbatim in the ledger, with the injection proven never to have reached a commit"
  - "A per-injection restore-target rule written under § Restoration blob hashes, closing threat T-145-20 for every later injection in this phase"
  - "The record correction that criterion 1's colour change straddles TWO fixes (eab07013f + 9f12a6c94), not one"
affects: [145-06, 145-07, 145-08]

actuals:
  tokens: 8175
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Per-injection restore target: an injection made after a behaviour-changing commit records its OWN `git hash-object` at the injection HEAD, before the file is touched, and restores against that — never against a ledger's creation-time table, which would silently revert the fix"
    - "Discrimination pair: a guard is shown to assert a BOUNDARY rather than a KEY by breaking the boundary while leaving the key in place, and observing the cheap key-presence test pass in the same run the guard fails"
    - "VOID is not RED, and is recorded as such: a run whose assertions never executed is kept under a `-void-` filename beside the authoritative one rather than deleted or counted"
    - "Instrument identity stated exactly rather than rounded: when two halves ran blobs that differ by a comment-only commit, the ledger says so and cites the 0-changed-non-comment-lines measurement instead of claiming byte-identity it does not have"

key-files:
  created:
    - .planning/phases/145-default-seed-template-repair/145-05-SUMMARY.md
  modified:
    - .planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "The prior attempt's two VOID after-half logs were preserved by renaming (`pw-A-after-void-1.log`, `pw-A-after-void-2.log`) rather than overwritten, and the ledger names them. A run that did not execute is evidence of something — deleting it would erase the only record that the range defect blocked this half twice."
  - "Instrument identity is stated as it actually is: the two probe blobs differ by 145-03's comment-only docstring correction 3d386050b. `git diff 49954257e..HEAD` over that path has 0 changed non-comment lines and the config is byte-identical, which is the honest claim. Rounding it up to 'byte-identical' would have been an unstated approximation of exactly the kind 145-04.1 re-ran a whole suite to avoid."
  - "A1-GREEN and § Criterion 1 both state that the pair straddles TWO behaviour-changing commits (eab07013f and 9f12a6c94). Writing it up as one key doing all the work would leave 145-08 with a false premise to carry forward."
  - "The restore-target rule was written as a general note under § Restoration blob hashes, not as a pair-2-only footnote, because 145-06's rename touches four more paths in that table and would hit the identical hazard."
  - "The injected diff is recorded verbatim in the ledger rather than committed as a `tests/fixtures/negctl-*` fixture (145-RESEARCH § Open Questions item 2). Pair 2's assertion is about the guard's discrimination, not about a template anyone will seed again."

patterns-established:
  - "An injection's restore target is captured before the injection exists and asserted after it is gone; the ledger's creation-time hash table is explicitly declared the WRONG target for any path a behaviour-changing commit has since modified"
  - "A must-NOT-fire row is measured on both sides of the fix and its two observations compared as numbers (8 → 8), so 'it held' is an equality rather than an impression"

requirements-completed: []  # TMPL-03 is declared by sibling plans still in flight; see § Requirements.

coverage:
  - id: D1
    description: "Criterion 1's second clause closed in the running app: the entity-tab set now includes candidates and the candidates tab lists cards"
    requirement: "TMPL-03"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts#entity tabs include candidates @probe — ${TMPDIR}/gsd-145/pw-A-after-1.log, exit 0, tab set [\"Candidates\",\"Parties\",\"Alliances\"], 48 candidate cards"
        status: pass
      - kind: automated_ui
        ref: "playwright:${TMPDIR}/gsd-145/app-after-tabs.png — 925,576 B; tab bar reads Candidates | Parties | Alliances with Candidates selected, header '48 candidates in constituency Pirkanmaa', 48 cards each carrying a match percentage"
        status: pass
    human_judgment: false
  - id: D2
    description: "Criterion 1's first clause held across the fix: the parties list is still non-empty, at the identical count observed before it — a must-NOT-fire row measured on both sides"
    requirement: "TMPL-03"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts#parties list is non-empty @probe — 8 organization cards, the same 8 A2-PRE observed on the pre-fix template"
        status: pass
      - kind: automated_ui
        ref: "playwright:${TMPDIR}/gsd-145/app-after-parties.png — 194,293 B"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-06 pair 2: the 145-02 anon guard fails on a dataset whose candidates CARRY terms_of_use_accepted and are still invisible to anon — so the guard asserts anon visibility, not one column's presence"
    requirement: "TMPL-03"
    verification:
      - kind: integration
        ref: "packages/dev-seed/tests/integration/default-template.integration.test.ts#the seeded dataset is readable by the ANON client — the voter app path (TMPL-03) — ${TMPDIR}/gsd-145/vt-P2-RED-1.log, exit 1, 'anon-visible candidate nominations: expected 0 to be greater than 0' at :521, 0 role-control failures"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/templates/default.test.ts#Test 28: every emitted candidate row carries terms_of_use_accepted — PASSED in the same RED run (1 failed / 557 passed), which is the discriminating fact"
        status: pass
      - kind: other
        ref: "REST measurement against the injected database: service_role reads 327 seed_ candidates, all with terms_of_use_accepted and all published=false; anon reads 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The injection left no trace: restored blob equals the target recorded before the injection existed, tree clean, database re-seeded correct, guard green again"
    verification:
      - kind: other
        ref: "git diff --exit-code on candidates-override.ts = 0; git hash-object = 4cb334771eaca37df20721222fbb8021150b8048 = the pre-injection target; git status --porcelain -- packages apps tests .github empty"
        status: pass
      - kind: integration
        ref: "${TMPDIR}/gsd-145/vt-P2-GREEN-1.log — exit 0, 49 files / 558 tests, 0 failed, 0 skipped, integration file executing (2 tests)"
        status: pass
      - kind: other
        ref: "post-restore REST measurement: service_role 327 published candidates, anon reads 327 — the injected dataset is gone from the live database"
        status: pass
    human_judgment: false
  - id: D5
    description: "No product byte changed and the instrument did not move: the whole plan's diff is one file, and the guard blob is identical across all four of its measured halves"
    verification:
      - kind: other
        ref: "git diff --stat 0d62314f0..HEAD → 1 file (the ledger); git diff --name-only over packages apps tests .github package.json turbo.json → empty"
        status: pass
      - kind: other
        ref: "git hash-object default-template.integration.test.ts = 62b9f0eac777bb1dcea7cd52d54efd3667dfaeae, identical at 2e5262d4a (P1-RED), eab07013f (P1-GREEN) and 9ce618f07 (P2-RED/P2-GREEN)"
        status: pass
    human_judgment: false

# Metrics
duration: 16 min
completed: 2026-08-24
status: complete
---

# Phase 145 Plan 05: Criterion 1's After Half, and the Pair That Proves the Guard Discriminates Summary

**Criterion 1 is closed in the running voter app — the probe that recorded `["Parties","Alliances"]` and no candidates tab now records `["Candidates","Parties","Alliances"]` with 48 candidate cards and the same 8 party cards, at exit 0 against exit 1 — and the `145-02` anon guard is shown to assert the RLS boundary rather than one column's presence: with `published: false` injected ALONGSIDE `terms_of_use_accepted`, `Test 28` (the column is present) passes in the very run the guard fails on `anon-visible candidate nominations`, after which a three-way-proven restore returns the blob to `4cb334771…` and the suite to 558/558.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-08-24T15:11:00Z (first executed run — the Task 1 precondition suite — completed 15:15:33Z)
- **Completed:** 2026-08-24T15:27:30Z
- **Tasks:** 2
- **Files modified:** 1 (the ledger). **Product bytes changed: 0.**

## Accomplishments

- **Criterion 1 is closed by measurement, not by recollection.** `GSD_145_HALF=after yarn test:e2e:probes defaultTemplateResults` exited **0**, both tests passing. Observed tab set verbatim: **`["Candidates","Parties","Alliances"]`** against the before half's `["Parties","Alliances"]`. Observed candidate card count **48** — a count that could not be read at all before, because the tab did not exist. `app-after-tabs.png` shows the tab bar with **Candidates** selected above `48 candidates in constituency Pirkanmaa` and 48 cards each carrying a match percentage (63% … 39%). 48 is D-08's nominated count for Pirkanmaa, reached by the shared journey fixture's own first-option pick.
- **The must-NOT-fire row held, as an equality.** `parties list is non-empty @probe` observed **8** organization cards — the identical 8 `A2-PRE` observed on the pre-fix template. The count did not move in either direction across both behaviour-changing commits, which is the only thing a must-NOT-fire row can prove.
- **D-06 pair 2 is CLOSED, and it is the row that makes pair 1 mean something.** With `published: false` injected alongside the timestamp, the unchanged guard exited **1** with `AssertionError: anon-visible candidate nominations: expected 0 to be greater than 0` at `:521`, both role controls green (they sit at `:490` and `:492`, strictly earlier, so execution necessarily satisfied them; `grep '(role control)'` over the whole log returns **0**).
- **The discriminating fact is a green test inside the red run.** `Test 28: every emitted candidate row carries terms_of_use_accepted` **passed** in that same run — exactly one test failed out of 558, and it was the anon `it`. So the column the guard was chosen for is demonstrably present while the guard is red. Corroborated directly against the injected database: **service_role reads 327 `seed_` candidates, all carrying `terms_of_use_accepted` and all `published = false`; anon reads 0.**
- **The restore is proven three ways and recorded.** `git diff --exit-code` → 0; `git hash-object` → `4cb334771eaca37df20721222fbb8021150b8048`, byte-equal to the target captured **before** the file was touched; `git status --porcelain -- packages apps tests .github` → nothing. The database was re-seeded from the restored template and re-measured: **327 published candidates, anon reads 327.** The guard is green again at 49 files / 558 tests, 0 failed, 0 skipped.
- **The injection never reached a commit.** Blob trail `4cb334771…` → `917e4e64b…` → `4cb334771…`, with the middle value uncommitted, not crossing a task boundary, and post-gated on both sides. The whole plan's diff is **one file**.
- **A per-injection restore-target rule now exists in the ledger.** § Restoration blob hashes declares that its table records the **pre-fix** state and is the wrong target for any path a behaviour-changing commit has since touched, names pair 2 as such a case with both hashes side by side, and requires every later injection to record its own. That closes `T-145-20` for `145-06`'s rename, which touches four more paths in that same table.

## Polarity — two opposite polarities, both as designed

| Half | Test | Expected | Observed | Verdict |
|---|---|---|---|---|
| Task 1 | `entity tabs include candidates @probe` | GREEN | passed; 3 tabs, 48 candidate cards | **GREEN** |
| Task 1 | `parties list is non-empty @probe` (must-NOT-fire) | GREEN | passed; 8 cards, unchanged from `A2-PRE` | **GREEN — held** |
| Task 2 | the anon `it`, injection live | **RED** | exit 1, `anon-visible candidate nominations`, both role controls green | **RED as designed** |
| Task 2 | `Test 28`, injection live | GREEN (guard-of-the-guard) | passed — the column IS present | **GREEN — discrimination proven** |
| Task 2 | both role controls, injection live | GREEN | 0 role-control failures anywhere in the log | **held** |
| Task 2 | the anon `it`, after restore | GREEN | exit 0, 558/558, 0 skipped | **GREEN — restore proven** |

Nothing was retried until green, skipped, or annotated flaky.

## Task Commits

1. **Task 1: criterion 1's after half (`A1-GREEN`, `A2-POST`, § Criterion 1 — before and after)** — `9ce618f07` (docs)
2. **Task 2: pair 2 (`P2-RED`, `P2-GREEN`, § Pair 2 — the injected diff, the restore-target note)** — `33bb247c1` (docs)

## Files Created/Modified

- `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` — rows `A1-GREEN`, `A2-POST`, `P2-RED` and `P2-GREEN` filled; two new sections (`## Criterion 1 — before and after`, `## Pair 2 — the injected diff`); the per-injection restore-target note under `## Restoration blob hashes`. Register placeholder count **80 → 60**; corpus still exactly **30** rows; prettier clean.

Artifacts outside the repository, in `${TMPDIR}/gsd-145/`: `pw-A-after-1.log`, `app-after-parties.png` (194,293 B), `app-after-tabs.png` (925,576 B), `seed-after-1.log`, `seed-P2-inject-1.log`, `vt-P2-RED-1.log`, `seed-P2-restore-1.log`, `vt-P2-GREEN-1.log`, plus the precondition run `vt-precheck-145-05-2.log` and the two preserved VOID logs `pw-A-after-void-1.log` / `pw-A-after-void-2.log` and `seed-after-void-1.log`.

## The record correction this plan owes forward

**Criterion 1's colour change straddles TWO behaviour-changing commits, not one.** `eab07013f` (`145-04`, the anon-RLS `terms_of_use_accepted` fix) restored anon visibility of the candidate rows. `9f12a6c94` (`145-04.1`, the number-range emitter fix) stopped the voter app throwing `normalizeCoordinate: Value is out of range` while normalizing those newly-visible answers. With only the first in place the after half **VOIDED twice** — `pw-A-after-void-1.log` and `pw-A-after-void-2.log`, both `2 failed` inside the journey walk at `followLinkWhenHrefResolved`, with neither of criterion 1's clauses ever evaluated.

A **VOID is not a RED**: no assertion executed, so neither log measures anything. Both are kept rather than deleted, so the distinction stays visible and the earlier executor's correct refusal to record them as a red half remains legible. `A1-GREEN` and § Criterion 1 both say this in the ledger; **`145-08` carries it into the record alongside the `A2-PRE` correction.**

## Instrument identity — stated exactly, not rounded

The two probe halves ran blobs `7b3f5b24eb3509a8a85399117a9825fa1f1276b6` (before) and `30d2b00c9d2049f5fbd1acfc650d25c8a3c35b99` (after). They are **not** byte-identical: they differ by `145-03`'s comment-only docstring correction `3d386050b`, which landed after that plan's own measurement. What is measured and true is that `git diff 49954257e..HEAD` over that path has **0 changed non-comment lines**, that `tests/playwright.config.ts` is byte-identical across both halves, and that no assertion, fixture, selector, timeout or tag moved. `145-05` changed no byte under `tests/` at all.

The **guard** used by all four of pair 1 and pair 2's halves **is** byte-identical: `git hash-object packages/dev-seed/tests/integration/default-template.integration.test.ts` = `62b9f0eac777bb1dcea7cd52d54efd3667dfaeae`, the same blob `git rev-parse` returns at `2e5262d4a`, `eab07013f` and `9ce618f07`.

## Decisions Made

- **Preserve the VOID logs by renaming, don't overwrite.** The prior attempt's `pw-A-after-1.log` and `seed-after-1.log` were moved aside to `-void-` / `seed-after-void-1.log` names before the authoritative run wrote its own. A run that did not execute is still evidence — of the second defect `145-04.1` fixed — and deleting it would erase the only record that this half was blocked twice.
- **Run the precondition suite before the re-seed, never after.** `yarn workspace @openvaa/dev-seed test:unit` was executed first (exit 0, 49 files / 558 tests) to establish the precondition, and only then `yarn db:reset-with-data`, because the integration test rewrites the full default template to the live database and has no teardown. Reversing that order would have made the probe measure a dataset written by vitest rather than by a clean seed.
- **Write the restore-target rule as a general note, not a pair-2 footnote.** `145-06`'s rename touches four more paths in the same creation-time hash table and would hit the identical `T-145-20` hazard.
- **Record the injected diff, don't commit a fixture.** Per `145-RESEARCH` § Open Questions item 2: pair 2's assertion is about the guard's discrimination, not about a template anyone will seed again, so a permanently-broken fixture in the tree buys nothing and costs a standing trap.

## Prohibitions — disposition

| Prohibition | Disposition |
|---|---|
| MUST NOT commit while an injection is live, or let one cross a task boundary | **Honoured.** Both commits were made with a clean `git status -- packages apps tests .github`; the injection lived entirely inside Task 2 between two post-gates. Blob trail `4cb334771…` → `917e4e64b…` → `4cb334771…`, the middle value never committed. |
| MUST NOT restore against the ledger's creation-time blob-hash table for a file a behaviour-changing commit has modified | **Honoured.** The restore target `4cb334771eaca37df20721222fbb8021150b8048` was taken with `git hash-object` at the injection HEAD **before** the file was touched, recorded into `P2-RED`, and asserted in `P2-GREEN`. The creation-time value `0fbac2543e…` was never used, and the ledger now says why it must not be. |
| MUST NOT change any assertion, label, client or control in the guard while measuring pair 2 | **Honoured, by blob hash.** `62b9f0eac777bb1dcea7cd52d54efd3667dfaeae` at all four halves; `tests/` is absent from this plan's entire diff. |
| MUST NOT commit the pair-2 injection as a fixture, template, or durable artifact | **Honoured.** `git diff --name-only 0d62314f0..HEAD -- packages apps tests .github package.json turbo.json` is empty; the diff lives verbatim in the ledger's § Pair 2 — the injected diff. |
| MUST NOT leave the database holding the pair-2 injected dataset | **Honoured.** Re-seeded (`seed-P2-restore-1.log`, exit 0, 752 rows / 327 candidates) and re-measured by role: service_role 327 published, **anon reads 327**. Against the injected state's 327 unpublished / anon 0. |
| MUST NOT run `yarn test:e2e` or start a second dev server while the injection is live | **Honoured.** No `test:e2e` was run in this plan at all — only `test:e2e:probes` (the `_probes` project, `--grep-invert @probe` never applies to it), and that ran in Task 1, before the injection existed. One listener on `:5173` throughout (`lsof -nP -iTCP:5173 -sTCP:LISTEN` → a single pid). |
| MUST NOT retry the probe until it goes green, skip it, or annotate it flaky | **Honoured.** The probe was run **once** in this plan and it passed. The two prior VOID runs belong to the earlier attempt and are recorded as VOID, not folded into a retry count. |
| MUST NOT add a register row to the ledger | **Honoured.** Register data rows counted = **30**; § Completeness's self-assertion untouched. |
| MUST NOT change any product byte | **Honoured.** Whole-plan diff = 1 file, `.planning/…/145-NEGATIVE-CONTROL-LEDGER.md`. |

## Deviations from Plan

None — plan executed exactly as written. No deviation rule was triggered: no bug, no missing critical functionality, no blocker, no architectural question. The one departure from the plan's literal wording is the preservation-by-rename of the prior attempt's VOID logs before writing `pw-A-after-1.log` and `seed-after-1.log`, which the plan neither required nor forbade; it is recorded above as a decision rather than a deviation because it added evidence rather than changing any measured value.

## Issues Encountered

None. The `yarn db:reset-with-data` storage/kong 502 race that `145-04.1` hit did not recur — all three seed runs in this plan exited 0 on the first attempt. The dev server inherited from `145-03` served the probe without restart and the preflight confirmed it was this checkout (`E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)`, one success line, zero failure lines).

## Environment left behind — read this before `145-06` / `145-07` / `145-08`

- **The Vite dev server from `145-03` is STILL RUNNING** on `http://localhost:5173` — HTTP **200** re-confirmed at the close of this plan; one listener on that port. Log `${TMPDIR}/gsd-145/devserver-145-03.log`. Nothing after `145-05` is known to need it; stop it with `pkill -f "vite dev"` if a plan needs the port free (`yarn dev` uses `strictPort` and fails loudly rather than drifting).
- **The database holds the FIXED `default` dataset**, correct and anon-visible: 327 published candidates, anon reads 327. It was last written by the `vt-P2-GREEN-1.log` vitest run's own teardown-and-reseed (the same fixed template), not by a clean seed — so **re-seed before any measurement that depends on it**, per the ledger's § Sequencing hazard. It is **not** `e2e/base`, so the cardinal gate suite must still not be run against it; `145-08` runs `yarn db:reset` plus the suite's own data-setup projects first.
- **Local Supabase is up and healthy.** REST 200 on `http://127.0.0.1:54321`; all three `db:reset-with-data` runs in this plan exited 0 with no 502.
- **Working tree clean** across `packages`, `apps`, `tests`, `.github`. The only untracked path is `.planning/milestone.lock`, which pre-dates this plan.
- **⚠ `145-06`, read the new restore-target note first.** Your rename touches four paths in § Restoration blob hashes. Those creation-time hashes are the **pre-fix** state; `candidates-override.ts` has already diverged from its entry and any other path your commits touch will too. Record your own `git hash-object` at your injection HEAD, before the file is touched.
- New logs in `${TMPDIR}/gsd-145/`: `vt-precheck-145-05-2.log`, `seed-after-1.log`, `pw-A-after-1.log`, `seed-P2-inject-1.log`, `vt-P2-RED-1.log`, `seed-P2-restore-1.log`, `vt-P2-GREEN-1.log`; new screenshots `app-after-parties.png`, `app-after-tabs.png`; preserved VOID artifacts `pw-A-after-void-1.log`, `pw-A-after-void-2.log`, `seed-after-void-1.log`.

## Requirements

`TMPL-03` is **not** marked complete here. It is declared by sibling plans in this phase that have not yet produced a SUMMARY (`145-06` … `145-08`), and the shared-ID gate holds an ID until every declaring plan has finished. Same disposition as `145-03`, `145-04` and `145-04.1`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Criterion 1 is closed and criterion 2's guard is proven to discriminate.** What remains for TMPL-03 is `145-08`'s record corrections and the standing gates.
- **`145-08` now inherits THREE record corrections to carry**, not two: (1) `A2-PRE`'s disproof of the roadmap's *(currently 0)* parenthetical for parties; (2) the E-03-c runtime half at `G7`; and (3) **new** — that criterion 1's colour change required both `eab07013f` and `9f12a6c94`, and that the after half VOIDED twice before the second landed.
- **`145-06` inherits the restore-target rule** as a written ledger constraint rather than as advice.
- Register placeholder count: **60**, leaving the twelve rows `145-06` … `145-08` own.

## Self-Check: PASSED

- `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` — **FOUND**; rows `A1-GREEN` / `A2-POST` / `P2-RED` / `P2-GREEN` carry **0** placeholders; register data rows = **30**; whole-register placeholder count = **60**; `## Criterion 1 — before and after` and `## Pair 2 — the injected diff` both present; all four screenshot filenames named; prettier clean.
- `.planning/phases/145-default-seed-template-repair/145-05-SUMMARY.md` — **FOUND** (this file).
- Commits `9ce618f07`, `33bb247c1` — both **FOUND** in `git log`.
- Logs `pw-A-after-1.log` (exit 0), `seed-after-1.log` (exit 0), `seed-P2-inject-1.log` (exit 0), `vt-P2-RED-1.log` (**exit 1**, as designed), `seed-P2-restore-1.log` (exit 0), `vt-P2-GREEN-1.log` (exit 0) — all **FOUND**, all non-empty. Screenshots `app-after-parties.png`, `app-after-tabs.png`, `app-before-parties.png`, `app-before-tabs.png` — all **FOUND**, all non-empty.
- Task 1 `<automated>` verify — re-run at **exit 0** (12 clauses, all pass).
- Task 2 `<automated>` verify — re-run at **exit 0** (16 clauses, all pass), including the register-count-equals-60 clause and the `git hash-object == P2-RED's first 40-hex` clause.
- Plan-level `<verification>` — 4/4 **PASS**: criterion 1 has four screenshots / two logs / two HEADs / a dedicated section ✓ · `tests/` absent from this plan's diff ✓ · pair 2 red on the candidate assertion with both role controls green, then green after a proven restore ✓ · tree clean, database re-seeded correct, placeholder count 60 ✓.
- Plan-level `<success_criteria>` — 4/4 **PASS**.
- Restored source: `git hash-object packages/dev-seed/src/templates/defaults/candidates-override.ts` = `4cb334771eaca37df20721222fbb8021150b8048` = `git rev-parse HEAD:<path>`; contains `terms_of_use_accepted`; contains **0** occurrences of the injected published-false key.

---
*Phase: 145-default-seed-template-repair*
*Completed: 2026-08-24*
