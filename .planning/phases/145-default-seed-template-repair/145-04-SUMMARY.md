---
phase: 145-default-seed-template-repair
plan: "04"
subsystem: database
tags: [dev-seed, anon-rls, seed-template, negative-control, terms-of-use, supabase]

# Dependency graph
requires:
  - phase: 145-default-seed-template-repair
    provides: "145-01 — the 30-row negative-control ledger, the HYGIENE-LOOP, and the pre-written P1-GREEN / U1-GREEN / U2 rows this plan fills"
  - phase: 145-default-seed-template-repair
    provides: "145-02 — the anon standing guard and Test 28/29, observed RED (P1-RED, U1-RED) against the pre-fix template; the instrument this plan must not touch"
  - phase: 145-default-seed-template-repair
    provides: "145-03 — the running dev server on :5173 and the pre-fix database state this plan re-seeded over"
provides:
  - "The fix: `defaults/candidates-override.ts` emits `terms_of_use_accepted: '2025-01-01T00:00:00.000Z'` on all 327 candidate rows, satisfying clauses two and three of `anon_select_candidates`"
  - "D-06 pair 1 CLOSED — the 145-02 anon guard, byte-identical instrument, RED at 2e5262d4a and GREEN at eab07013f"
  - "The corrected PUBLISHABLE_TABLES comment block: the three-clause anon predicate quoted from its authority migration, with zero behavioural bytes changed"
  - "Ledger rows P1-GREEN, U1-GREEN, U2's second half, and the E-03-c note — register placeholder count 90 → 80"
  - "The whole packages/dev-seed suite back to exit 0 (48 files / 555 tests), closing the deliberate red 145-02 opened"
affects: [145-05, 145-06, 145-07, 145-08]

actuals:
  tokens: 6372
  tasks: 2
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Data-side RLS repair: an anon-visibility defect is fixed by making the seeded DATA satisfy the policy, never by relaxing the policy — apps/supabase/ stays out of the diff by acceptance criterion"
    - "Scope-the-default-down: a missing column is supplied in ONE template's row producer rather than in the shared write-path auto-default, so a sibling template's deliberate omissions survive as negative controls"
    - "Blob-hash pair proof: a RED/GREEN pair cites `git rev-parse <HEAD>:<instrument>` at BOTH halves and shows the same blob, so 'the instrument was unchanged' is a hash comparison rather than a recollection"
    - "Comment corrections land in their own commit, never as an amend, so a ledger row citing the measured HEAD keeps resolving (145-03 precedent, reused here)"

key-files:
  created: []
  modified:
    - packages/dev-seed/src/templates/defaults/candidates-override.ts
    - packages/dev-seed/src/supabaseAdminClient.ts
    - .planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "The comment rationale was reworded to name the CLASS of forbidden value ('a clock-derived value') rather than the two clock APIs verbatim, because spelling them tripped this plan's own acceptance check that the file contains neither token — a check whose intent is that the row construction never calls them."
  - "The measured commit was NOT amended when that rewording landed. eab07013f and its blob hash are cited by three ledger rows; amending would have left the ledger naming a commit that no longer exists. The correction is 643891c6b and the suite was re-run there rather than argued from the earlier HEAD."
  - "The source fix and the ledger rows are two commits, not one, because a ledger row cites the HEAD its run was issued at and that hash does not exist until the commit does. The 145-03 precedent."
  - "The PUBLISHABLE_TABLES comment declares its own un-audited scope explicitly rather than implying completeness — a corrected comment that is itself overreaching is the failure the correction exists to end (T-145-17)."

patterns-established:
  - "A write-path default that satisfies only part of a table's RLS predicate must say so beside itself, quote the predicate from the migration that owns it, and name the table it does NOT cover"
  - "An acceptance check that greps a source file for a forbidden token constrains comments as well as code — write the rationale to name the class, not the API"

requirements-completed: []  # TMPL-03 is declared by sibling plans still in flight; see § Requirements below.

coverage:
  - id: D1
    description: "The fix: every one of the 327 candidate rows the default template's override emits carries terms_of_use_accepted = '2025-01-01T00:00:00.000Z' — the same literal e2e/base uses, deterministic under the template's pinned seed"
    requirement: "TMPL-03"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/default.test.ts#Test 28: every emitted candidate row carries terms_of_use_accepted (anon-RLS precondition)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/templates/default.test.ts#Test 9: deterministic — same ctx/org refs yield byte-identical rows across calls"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-06 pair 1 closed: the 145-02 anon standing guard, unchanged, fails against the pre-fix template and passes against the fixed one, with both accounts role controls green in each half"
    requirement: "TMPL-03"
    verification:
      - kind: integration
        ref: "packages/dev-seed/tests/integration/default-template.integration.test.ts#the seeded dataset is readable by the ANON client — the voter app path (TMPL-03) — ${TMPDIR}/gsd-145/vt-P1-GREEN-1.log, exit 0, 555/555, 0 skipped"
        status: pass
      - kind: other
        ref: "git rev-parse 2e5262d4a:…/default-template.integration.test.ts == git rev-parse eab07013f:… == 62b9f0eac777bb1dcea7cd52d54efd3667dfaeae — instrument byte-identical across both halves"
        status: pass
    human_judgment: false
  - id: D3
    description: "U2 held: Test 29 (cross-template consistency, must-NOT-fire) is GREEN at both HEADs, so the assertion is pinned to the cross-template literal rather than coupled to the fix"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/templates/default.test.ts#Test 29 — passing in vt-U1-RED-1.log (418eb1353) and in vt-P1-GREEN-verbose-1.log (eab07013f)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Criterion 3's naming now lives in the repository: the PUBLISHABLE_TABLES comment quotes the three-clause anon predicate from its authority migration, states the auto-default is not sufficient for candidates, forbids stamping the column there, and declares the un-audited scope — with zero behavioural bytes changed"
    verification:
      - kind: other
        ref: "git diff HEAD~1..HEAD -- packages/dev-seed/src/supabaseAdminClient.ts | changed non-comment lines == 0; set membership diff against the prior HEAD empty; grep confirms terms_of_use_accepted, the migration filename, and 'not audited'"
        status: pass
    human_judgment: false
  - id: D5
    description: "e2e/base's two deliberately-unaccepted candidate rows (ca-aa-hidden, ca-aa-unregistered) still omit the column — the in-repo negative control survives, because the fix reached one override and no global default was widened (E-03-c)"
    verification:
      - kind: other
        ref: "git diff 4236b1a45..HEAD -- packages/dev-seed/src/templates/e2e → empty; grep 'DELIBERATELY absent' packages/dev-seed/src/templates/e2e/base.ts == 3 (>= 2)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The deliberate red 145-02 opened is closed: the whole packages/dev-seed suite is back to exit 0 with the integration file executing rather than skipping"
    verification:
      - kind: other
        ref: "${TMPDIR}/gsd-145/vt-comment-1.log — exit 0, Test Files 48 passed (48), Tests 555 passed (555), 0 failed, 0 skipped, at the closing HEAD"
        status: pass
    human_judgment: false

# Metrics
duration: 14 min
completed: 2026-08-24
status: complete
---

# Phase 145 Plan 04: The One-Key Fix, and the Pair It Closes Summary

**One key on one row producer — `terms_of_use_accepted: '2025-01-01T00:00:00.000Z'` on all 327 candidate rows the default template's override emits — turns the 145-02 anon standing guard from RED to GREEN against a byte-identical instrument (blob `62b9f0eac…` at both HEADs), closing D-06 pair 1; plus a comment-only rewrite of the `PUBLISHABLE_TABLES` block that quotes the three-clause `anon_select_candidates` predicate from its authority migration and states, by name, that the publishable auto-default does not cover candidates.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-08-24T13:47:17Z
- **Completed:** 2026-08-24T14:01:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- **The fix landed and it is one key.** `candidatesOverride` now emits `terms_of_use_accepted: '2025-01-01T00:00:00.000Z'` on every row, with a three-reason rationale comment beside it (why the key exists, why a literal rather than a computed timestamp, why here rather than in the auto-default). `yarn db:reset-with-data` re-seeded 752 rows across 14 tables including 327 candidates (`seed-fix-1.log`, exit 0).
- **D-06 pair 1 is CLOSED, and the pair is a real pair.** The anon `it` added by `145-02` failed at `2e5262d4a` (`expected 0 to be greater than 0`) and passes at `eab07013f` — with the instrument proven byte-identical by blob hash at both halves (`62b9f0eac777bb1dcea7cd52d54efd3667dfaeae`), not by assertion. `git diff 2e5262d4a..HEAD -- packages/dev-seed/tests/integration/default-template.integration.test.ts` is empty.
- **Both role controls green in the same run.** `anon accounts rowcount (role control)` and `service_role accounts rowcount (role control)` are the first two assertions inside the anon `it`; the whole `it` is reported green with zero failures anywhere in the run, so the guard did not pass by a mis-keyed client.
- **`U1-GREEN` filled — the cheap tier works.** `Test 28` passes in 3 ms with **no live database**, against the same `default.test.ts` blob (`1a2db5e2d…`) it failed in at `418eb1353`. `git diff 418eb1353..HEAD -- packages/dev-seed/tests` is empty.
- **`U2` held.** `Test 29` is GREEN at both HEADs — must-NOT-fire, and it did not move. Its invariance is also the unit-level half of the `e2e/base`-preservation check: a global auto-default would have stamped the two deliberately-unaccepted rows and this row would have had to move.
- **The suite is back to exit 0.** 48 test files, 555 tests, 0 failed, 0 skipped, with the integration file **executing** (not skipping) under `DEV_SEED_INTEGRATION_REQUIRED=1`. The deliberate red `145-02` opened closes here.
- **Criterion 3's naming is now in the repository.** The `PUBLISHABLE_TABLES` comment stops claiming a coverage it does not have: it quotes the three clauses verbatim from `00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql`, names the consequence, points at the override that supplies the missing clause, forbids stamping the column at that layer with the `e2e/base` negative control as the reason, and declares that the other listed tables were **not audited**.
- **Zero behavioural bytes in the write path.** Across the whole plan, `git diff 4236b1a45..HEAD -- packages/dev-seed/src/supabaseAdminClient.ts` contains **0** changed non-comment lines, and the `PUBLISHABLE_TABLES` set block is byte-identical to its prior state.

## Polarity — everything expected GREEN, and everything is

| Row | Test | Expected | Observed | Verdict |
|---|---|---|---|---|
| `P1-GREEN` | the `145-02` anon `it` | GREEN | passed, 32 ms; both role controls held; organizations green | **GREEN** — pair 1 closed |
| `U1-GREEN` | `Test 28` | GREEN | passed, 3 ms, no live DB | **GREEN** |
| `U2` | `Test 29` | GREEN (must-NOT-fire) | passed at both HEADs | **GREEN — held** |
| whole suite | `packages/dev-seed` | exit 0 | 48/48 files, 555/555 tests | **exit 0** |

**Nothing was retried, skipped or annotated flaky**, and no assertion, label, client or control in the `145-02` guard was touched.

## Task Commits

1. **Task 1: emit `terms_of_use_accepted` on every candidate row** — `eab07013f` (fix)
2. **Task 1: record `P1-GREEN`, `U1-GREEN` and `U2`'s second half + the E-03-c note** — `0fab1368e` (docs)
3. **Deviation fix: reword the rationale to name no clock API verbatim** — `643891c6b` (docs, comment-only)
4. **Deviation record: the post-measurement correction, beside the three rows** — `7f48f553e` (docs)
5. **Task 2: correct the `PUBLISHABLE_TABLES` comment block** — `58f15571b` (docs, comment-only)

## Files Created/Modified

- `packages/dev-seed/src/templates/defaults/candidates-override.ts` — one key added to the emitted `row` object after `organization`, with a three-numbered-reason rationale comment above it. The answer-emission shim below (`candidateForEmit`) was deliberately **not** given the key: it is a typed projection fed to the emitter, not a row that reaches the write path.
- `packages/dev-seed/src/supabaseAdminClient.ts` — the `PUBLISHABLE_TABLES` comment block rewritten. **Comment lines only.** The set, the strip loop and the explicit-value branch are untouched.
- `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` — rows `P1-GREEN` and `U1-GREEN` filled, `U2`'s HEAD / exit / assertion / outcome cells extended with the post-fix half, plus two new notes (the **E-03-c** check and the comment-correction addendum). Register placeholder count 90 → **80**.

## Decisions Made

- **Reword rather than suppress the acceptance check.** The rationale comment originally spelled `new Date()` and `Date.now()` verbatim to say they were forbidden — which made the file contain the very tokens the plan's own criterion greps for. The criterion's intent is that the row construction never *calls* them, and a grep cannot distinguish a call from a warning about a call. The comment now names the class ("a clock-derived value — a fresh Date, an epoch read, or a faker date call"), which is what the criterion means to read. The check was **not** weakened.
- **Do not amend the measured commit.** `eab07013f` is cited by three ledger rows together with its blob hash. The comment correction landed at `643891c6b` and the suite was re-run there (`vt-P1-GREEN-2.log`, exit 0, 555/555) rather than argued from the earlier HEAD. This is the `145-03` precedent, applied for the same reason.
- **Two commits for Task 1, not one.** A ledger row cites the HEAD its run was issued at; that hash does not exist until the commit does. The source fix is `eab07013f`, the rows are `0fab1368e`. Task 1's `<automated>` verify checks the forbidden paths against `HEAD~1..HEAD` and the ledger contents against the file, so both hold — and the stronger plan-wide check (`git diff 4236b1a45..HEAD` over `packages/dev-seed/tests`, `permittedKeys.ts`, `templates/e2e`, `apps/supabase`) is empty too.
- **The comment declares its own limits.** Rather than implying the audit was complete, it states that whether any other listed table has an anon predicate this default under-satisfies was **not audited** here. A corrected comment that overreaches is the failure the correction exists to end (T-145-17).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The rationale comment tripped the plan's own forbidden-token check**

- **Found during:** Task 1 (running the `<automated>` verify after the first commit)
- **Issue:** Acceptance criterion 2 requires the file to contain no `new Date(` and no `Date.now(`. The rationale comment I wrote named both APIs verbatim while explaining that neither may be used, so `grep -c 'new Date('` returned 1 and `grep -c 'Date.now('` returned 1. The row construction calls neither — the check was reading a warning as a violation, which a grep cannot help doing.
- **Fix:** Reworded to name the class of value rather than the APIs: "a clock-derived value (a fresh Date, an epoch read, or a faker date call)". Landed as its own comment-only commit rather than an amend, because the measured commit is cited by hash in three ledger rows.
- **Files modified:** `packages/dev-seed/src/templates/defaults/candidates-override.ts` (comment-only — 0 changed non-comment lines between `eab07013f` and `643891c6b`)
- **Verification:** `grep -c 'new Date('` = 0, `grep -c 'Date.now('` = 0, literal count still exactly 1; prettier clean; suite re-run at the corrected HEAD green (`vt-P1-GREEN-2.log`, exit 0, 555/555). The correction and its zero-executable-diff proof are recorded in the ledger addendum.
- **Committed in:** `643891c6b` (correction) and `7f48f553e` (the ledger record of it)

**2. [Rule 3 - Blocking] Task 2's `<automated>` set-membership check counts lines where it means occurrences**

- **Found during:** Task 2 (evaluating the acceptance criteria)
- **Issue:** The check is `test "$(sed -n '/const PUBLISHABLE_TABLES/,/\]);/p' "$F" | grep -c "'")" -ge 20`. `grep -c` counts matching **lines**, and the ten table names occupy ten lines — so the value is 10 and the check can never reach 20 for an unchanged set. The stated criterion ("the set still contains the same table names it contained before this commit") is a different and stronger claim than the command expresses.
- **Fix:** Evaluated the criterion two ways instead of weakening it. The plan's counting form corrected to occurrences (`grep -o "'" | wc -l`) gives **20** — ten names, two quotes each. Independently, `diff` of the set block against the same block at the previous HEAD is **empty**, which proves membership identity directly rather than by counting quotes. Both are recorded here; no source file was changed to satisfy either.
- **Files modified:** none
- **Verification:** occurrences = 20; block-vs-previous-HEAD diff empty; and the plan-wide non-comment changed-line count for the file is 0, so the set could not have moved.
- **Committed in:** n/a — a check-evaluation correction, documented rather than coded

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking).
**Impact on plan:** None on scope or on any measured value. Neither touched an assertion, a fixture, the guard, or the emitted row. One corrected a comment so an existing check reads what it means; the other corrected how a check was evaluated, and proved the underlying claim more strongly than the command would have.

## Prohibitions — disposition

| Prohibition | Disposition |
|---|---|
| MUST NOT add `terms_of_use_accepted` to the publishable-table auto-default or any global default | **Honoured.** `git diff 4236b1a45..HEAD -- packages/dev-seed/src/supabaseAdminClient.ts` has **0** changed non-comment lines; the file gained a comment forbidding exactly this, with the reason. |
| MUST NOT edit `permittedKeys.ts` or any per-collection row type | **Honoured.** Absent from the plan's diff. Confirmed by read that `terms_of_use_accepted` is already permitted (`:296`) and that the candidates non-column list is `['email']` only — D-10 holds. |
| MUST NOT set the column on the default template's `candidates` fixed rows | **Honoured.** `templates/defaults/default.ts` is absent from the diff; the 327 rows come from the override. |
| MUST NOT derive the timestamp from a clock, faker, or `new Date()` | **Honoured.** The value is a string literal; `grep -c 'new Date('` and `grep -c 'Date.now('` both **0**; `Test 9`'s byte-identical determinism assertion passes. |
| MUST NOT modify `templates/e2e/base.ts` | **Honoured.** `git diff 4236b1a45..HEAD -- packages/dev-seed/src/templates/e2e` is empty; its 3 `DELIBERATELY absent` markers stand. |
| MUST NOT modify anything under the migrations directory | **Honoured.** `git diff 4236b1a45..HEAD -- apps/supabase` is empty. The predicate was satisfied by data, never by policy. |
| MUST NOT change any assertion, label, client or control in the `145-02` guard | **Honoured, by blob hash.** `packages/dev-seed/tests` is absent from the plan's diff, and both instrument blobs resolve identically at the RED and GREEN HEADs. |

## Issues Encountered

None beyond the two deviations above. Local Supabase was already up, the re-seed succeeded on the first attempt, and both measurement runs produced the declared shape.

## Environment left behind — read this before the next wave

- **The Vite dev server from `145-03` is STILL RUNNING** on `http://localhost:5173` (HTTP 200 confirmed at the close of this plan; log `${TMPDIR}/gsd-145/devserver-145-03.log`). This plan never needed it and never touched it. **`145-05` needs it** — leave it alone.
- **The database now holds the FIXED `default` dataset.** `yarn db:reset-with-data` rebuilt it from the fixed template (`seed-fix-1.log`: 752 rows / 14 tables — 327 candidates · 377 nominations · 8 organizations · 2 alliances · 5 constituencies · 26 questions), and the integration test's own teardown-and-reseed re-applied the same fixed template on each of the four suite runs since. It is **not** `e2e/base`, so the cardinal gate suite must still not be run against it — `145-08` runs `yarn db:reset` plus the suite's own data-setup projects first.
- **`145-05` should still re-seed** with `yarn db:reset-with-data` before its app-level half, per its own plan — the last thing to write to this database was a vitest run, not a clean seed.
- Local Supabase is up; the working tree is clean across `packages`, `apps`, `tests`, `.github` and the repo root.
- New logs in `${TMPDIR}/gsd-145/`: `seed-fix-1.log`, `vt-P1-GREEN-1.log`, `vt-P1-GREEN-verbose-1.log`, `vt-P1-GREEN-2.log`, `vt-comment-1.log`.

## Requirements

`TMPL-03` is **not** marked complete here. It is declared by sibling plans in this phase that have not
yet produced a SUMMARY (`145-05` … `145-08`), and the shared-ID gate holds an ID until every declaring
plan has finished. The behavioural repair the requirement names has landed; its record correction and
its app-level and gate-level proofs belong to those plans.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **`145-05` is unblocked and inherits a fixed template plus a live server.** It owns `A1-GREEN`, `A2-POST` and D-06 **pair 2** (`P2-RED` / `P2-GREEN` — the `published: false` injection that proves the guard asserts *anon visibility* rather than *one column's presence*). ⚠ Its injection must be `published: false` set **alongside** the `terms_of_use_accepted` this plan added, or the pair measures the wrong thing.
- **⚠ `A2-POST` is a must-NOT-fire row.** If the parties probe comes out red on the fixed template, stop — that would mean the assertion is coupled to the fix rather than to the parties surface it pins.
- **`145-08` inherits two record corrections to carry:** `A2-PRE`'s disproof of the roadmap's *(currently 0)* parenthetical for parties (from `145-03`), and the E-03-c runtime half — the gate-suite specs that depend on `e2e/base`'s two hidden candidates staying hidden, at `G7`.
- Register placeholder count: **80**, leaving the seventeen rows `145-05` … `145-08` own.

## Self-Check: PASSED

- `packages/dev-seed/src/templates/defaults/candidates-override.ts` — **FOUND**, contains the literal exactly once, no clock token.
- `packages/dev-seed/src/supabaseAdminClient.ts` — **FOUND**, comment names `terms_of_use_accepted`, the migration filename, and "not audited"; 0 changed non-comment lines.
- `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` — **FOUND**, 0 placeholders in `P1-GREEN` / `U1-GREEN` / `U2`, `E-03-c` present, register count 80.
- Commits `eab07013f`, `0fab1368e`, `643891c6b`, `7f48f553e`, `58f15571b` — all **FOUND** in `git log`.
- `${TMPDIR}/gsd-145/seed-fix-1.log`, `vt-P1-GREEN-1.log`, `vt-P1-GREEN-verbose-1.log`, `vt-P1-GREEN-2.log`, `vt-comment-1.log` — all **FOUND**, all non-empty.
- Task 1 `<automated>` verify — re-run at **exit 0** (under `bash`; the harness shell is `zsh`, where `[ a \< b ]` is not a valid condition — the criterion itself holds, the literal sorts strictly before the current UTC timestamp).
- Task 2 acceptance criteria — all six evaluated **PASS** (set-membership criterion evaluated per Deviation 2).
- Plan-level `<verification>`: suite exit 0 ✓ · `packages/dev-seed/tests` absent from the plan diff ✓ · write path 0 executable bytes ✓ · `templates/e2e` and `apps/supabase` untouched ✓ · three ledger rows closed, count 80 ✓.
- `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed` — **exit 0**, log shows `cache bypass, force executing`. `eslint` on both changed source files — clean. `prettier --check` on all three files — clean.

---
*Phase: 145-default-seed-template-repair*
*Completed: 2026-08-24*
