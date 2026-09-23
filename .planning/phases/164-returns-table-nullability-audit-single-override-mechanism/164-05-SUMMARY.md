---
phase: 164-returns-table-nullability-audit-single-override-mechanism
plan: 05
subsystem: testing
tags: [supabase-types, returns-table, nullability, playwright, turbo, phase-gate, negative-control]

requires:
  - phase: 164-01
    provides: the override locus, the merge module and the barrel rewire this plan's new guard protects
  - phase: 164-02
    provides: scripts/assert-rpc-return-nullability.mjs and its lint:check link, which check 6 was added to
  - phase: 164-03
    provides: the regeneration-drift job and the repo-meta spec that pins the lint:check link
  - phase: 164-04
    provides: NC-1..NC-6 and the barrel-bypass gap this plan closes
provides:
  - Check 6 of the RPC nullability guard - the delivery chain the override reaches consumers through, both links
  - NC-7a..NC-7e - five mutation runs proving check 6 can fail, with both mutated files restored byte-identically
  - The seven-gate record at one HEAD, with the E2E tallies counted from the log rather than read
  - The code-review checklist run over the phase's whole source diff, with per-item dispositions
affects: [163, ship, supabase-types, any phase regenerating database.ts]

actuals:
  tokens: 13312
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A guard that asserts a chain asserts every link of it - the operator named link 1; link 2 was measured to have the identical blindness and is covered too"
    - "Assert the export STATEMENT, never the module specifier as a bare string - a bare grep passes a barrel that keeps the import and exports the symbol from elsewhere"
    - "Extend the guard that is already wired rather than add a sibling script - check 6 inherits the lint:check link and the three pins the repo-meta spec already holds"

key-files:
  created:
    - tests/e2e-runs/164-05-cardinal-gate/ (gitignored - nine gate logs)
  modified:
    - scripts/assert-rpc-return-nullability.mjs
    - .planning/phases/164-returns-table-nullability-audit-single-override-mechanism/164-NEGATIVE-CONTROL.md
    - .planning/WINDOWS.md
    - .planning/todos/done/2026-09-03-nothing-guards-the-supabase-types-barrel-wiring.md

key-decisions:
  - "The operator-authorised guard shipped as check 6 of the existing assert script, not a new script - measured reason: it inherits the lint:check link 164-02 added and the three pins packages/dev-seed/tests/rpcNullabilityGate.test.ts already holds on that script, all of which a sibling script would have needed rebuilt"
  - "The check covers BOTH links of the delivery chain. The operator named the barrel; database.merged.ts is a second one-token bypass of the same shape, and NC-7e measures it equally invisible to the frontend check (exit 0, 2750 files) - covering only link 1 would have closed half a hole"
  - "The guard reads the export statement rather than the specifier as a bare string. NC-7b demonstrates the difference: a disguised bypass that a bare grep passes and check 6 reddens"
  - "The scope addition was written, probed and committed BEFORE the gate ladder, so the seven gates describe one HEAD rather than a mixed one - the plan's own re-run rule applied in advance instead of after a red"
  - "The unobserved supabase-types-drift CI job is carried forward, not closed. All seven gates are local; the operator's decision to obtain observed runs via a draft PR is recorded as Phase 163's, not this plan's"

patterns-established:
  - "Vacuity probing covers a guard's BRANCHES, not just its happy path: NC-7c (fail-closed, zero matches) and NC-7d (ambiguity, two matches) exercise the branches that would otherwise be untested code claiming to be a gate"
  - "A weaker first probe is reported rather than discarded - NC-7e's first form left an orphan import that lint would have noticed, which would have made the run silent about whether anything else catches the bypass"

requirements-completed: [CIGATE-04, CIGATE-05]

coverage:
  - id: D1
    description: "Check 6 of scripts/assert-rpc-return-nullability.mjs asserts both links of the delivery chain the RPC nullability override reaches consumers through, closing the one-token barrel bypass 164-04 measured"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "node scripts/assert-rpc-return-nullability.mjs (clean tree) - exit 0, census reports 'barrel exports Database from ./database.merged'"
        status: pass
      - kind: other
        ref: "NC-7a - barrel rewired to './database' - exit 1 naming the offending specifier; wired form 'yarn assert:rpc-nullability' also exit 1"
        status: pass
      - kind: other
        ref: "NC-7b - the disguise a bare-string grep passes (grep -c returns 1) - exit 1"
        status: pass
      - kind: other
        ref: "NC-7c - fail-closed branch, no Database re-export - exit 1"
        status: pass
      - kind: other
        ref: "NC-7d - ambiguity branch, two Database re-exports - exit 1"
        status: pass
      - kind: other
        ref: "NC-7e - database.merged.ts rewired past the overrides - exit 1 (2 violations), while yarn workspace @openvaa/frontend check stays exit 0"
        status: pass
      - kind: integration
        ref: "packages/dev-seed/tests/rpcNullabilityGate.test.ts - 7/7 pass, pinning the lint:check link check 6 rides"
        status: pass
    human_judgment: false
  - id: D2
    description: "Gates 1-6 green at one recorded HEAD (57204c21b), every cached gate forced rather than replayed, with @openvaa/supabase-types:typecheck present in the task list"
    verification:
      - kind: other
        ref: "DEV_SEED_INTEGRATION_REQUIRED=1 TURBO_FORCE=true yarn test:unit - exit 0, 25/25 tasks, 0 cached, 2759 tests passed, 0 skipped, dev-seed live-Supabase integration executed"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check - exit 0, 0 cached on both turbo runs, assert:rpc-nullability observed running"
        status: pass
      - kind: other
        ref: "yarn format:check - exit 0"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn build - exit 0, 14/14, 0 cached, @openvaa/frontend:build included"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check - exit 0, 2750 FILES 0 ERRORS 0 WARNINGS"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true npx turbo run typecheck - exit 0, 23/23, 0 cached, grep -c 'error TS' = 0, @openvaa/supabase-types:typecheck force executing"
        status: pass
    human_judgment: false
  - id: D3
    description: "The full Playwright suite ran LAST, after yarn db:reset, against exactly one fresh dev server, at the same HEAD, and is fully green by counted tallies"
    verification:
      - kind: e2e
        ref: "yarn test:e2e - exit 0, 155 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run, 10.9m, preflight OK; log tests/e2e-runs/164-05-cardinal-gate/run.log"
        status: pass
    human_judgment: false
  - id: D4
    description: "The phase's negative-control ledger is complete: every control re-runnable from its recorded command and verbatim output, with the seven-gate section closing it"
    requirement: CIGATE-04
    verification:
      - kind: other
        ref: ".planning/phases/164-.../164-NEGATIVE-CONTROL.md sections 13 and Gates - commit 816619d1a"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every change in the phase checked against .agents/code-review-checklist.md with each item's disposition recorded"
    verification:
      - kind: other
        ref: "164-NEGATIVE-CONTROL.md - 'The code-review checklist, run rather than asserted'; 19 items dispositioned over git diff edd8265c1..HEAD -- apps packages scripts tests .github"
        status: pass
    human_judgment: true
    rationale: "The mechanical halves were measured (0 `any` in code, 0 ts-ignore, 0 non-null assertions, 0 credential echoes, gates green). The judgement halves - 'the changes solve the issues', 'no code repeated elsewhere in the repo', 'shared dependencies not unduly affected' - are a reviewer's call and are recorded as dispositions, not proven by a command."
  - id: D6
    description: "The supabase-types-drift CI job observed running in GitHub Actions"
    verification: []
    human_judgment: true
    rationale: "NOT DELIVERED and must never be recorded as verified. main.yaml triggers only on push/pull_request against main and integration/ship-12-squash has never been pushed, so no Actions run of that job exists or can exist on this branch. Carried from 164-03 coverage D6, WINDOWS 242, and re-filed at phase close. Operator decision: obtain the observed runs via a draft PR at Phase 163, not here."

duration: 71 min
completed: 2026-09-03
status: complete
---

# Phase 164 Plan 05: Phase Gate + the Barrel-Bypass Closure Summary

**Seven gates green at one HEAD with a 155/155 cardinal-clean E2E suite, and the phase's own negative control turned into a guard: the one-token bypass that made the whole override layer optional now reddens `yarn lint:check`, proven by five mutation runs.**

## Performance

- **Duration:** 71 min
- **Started:** 2026-09-03T08:58Z
- **Completed:** 2026-09-03T10:10Z
- **Tasks:** 3 (the plan's 2, plus the operator-authorised addition run first)
- **Files modified:** 4 (1 source, 3 planning)

## Accomplishments

- **Closed the gap the phase's own negative control opened.** `164-04` measured that changing one token in `packages/supabase-types/src/index.ts` bypasses the entire override layer for every consumer, with the whole repository staying green *even with the consumer's null-guard also deleted*. That is now check 6 of `scripts/assert-rpc-return-nullability.mjs`, riding the `lint:check` link `164-02` added.
- **Covered both links of the chain, not just the named one.** The operator's specification named the barrel. `database.merged.ts` is a second bypass of identical shape, and NC-7e measures it equally invisible to `yarn workspace @openvaa/frontend check` (exit 0, 2750 files). Closing only link 1 would have closed half a hole.
- **Probed the guard five ways before trusting it**, per the phase's own standard and PROH-01 — including the two branches (fail-closed, ambiguity) that would otherwise have been untested code claiming to be a gate. All five RED with verbatim output; both mutated files restored byte-identically by `git hash-object`.
- **Ran the seven-gate ladder at one HEAD** (`57204c21b`), every cached gate forced (`0 cached` asserted, not assumed), every exit code read directly from `$?`.
- **Ran the full Playwright suite last, after `yarn db:reset`, against exactly one fresh dev server: 155 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run** — each zero a counted search of the log, with the distinct-progress-marker count (155) as the did-not-run proof rather than the summary line.
- **Ran the code-review checklist over the phase's whole source diff** with all 19 items dispositioned, and re-measured the anchors, the `tsbuildinfo` premise and the criterion-3 grep rather than citing them.

## Task Commits

1. **Scope addition: the delivery-chain guard + its five probes** — `57204c21b` (feat)
2. **Task 1 + Task 2: the ledger's NC-7 and `## Gates` sections** — `816619d1a` (docs)
3. **Ledger hygiene: close WINDOWS 247, carry the CI debt** — `1e971c137` (docs)

**Plan metadata:** see the `docs(164-05): complete` commit.

_The gates ran at `57204c21b`. The two later commits touch only `.planning/`, proven: `git diff --stat 57204c21b HEAD -- apps packages scripts tests .github` is **empty**._

## Files Created/Modified

- `scripts/assert-rpc-return-nullability.mjs` — check 6, the delivery chain; the `namedReExports` export-statement reader; the census line now reports the resolved barrel specifier so a check that ran is distinguishable from one that was skipped
- `.planning/phases/164-.../164-NEGATIVE-CONTROL.md` — § 13 (NC-7a…NC-7e) and the `## Gates` section, +390 lines
- `.planning/WINDOWS.md` — 247 marked **fixed**; three new entries filed
- `.planning/todos/done/2026-09-03-nothing-guards-the-supabase-types-barrel-wiring.md` — moved from `pending/` with the resolution recorded

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one: **the addition was written, probed and committed *before* the ladder**, so the seven gates describe a single HEAD. The plan's own rule is that a gate forcing a code change means re-running from gate 1 at the new HEAD; applying it in advance costs nothing and avoids reporting a mixed-HEAD ladder.

## Deviations from Plan

### Authorised scope addition (not a deviation to be avoided — recorded as instructed)

**[Operator-authorised] Check 6: the delivery chain**

- **Authorisation:** the operator's dispatch, quoted verbatim in `164-NEGATIVE-CONTROL.md` § 13: *"new guard asserts: packages/supabase-types/src/index.ts re-exports from database.merged (not database.ts directly) … vacuity probe: rewire barrel -> expect RED, restore -> expect GREEN … closes the last silent-revert path criterion 4 exists to prevent."*
- **Why it is beyond the plan:** `164-05-PLAN.md`'s `files_modified` names only `164-NEGATIVE-CONTROL.md`. This plan was scoped as a measurement pass.
- **What shipped:** check 6 of the existing guard, covering both chain links, plus NC-7a…NC-7e.
- **Verification:** five probes RED with verbatim output; restored tree GREEN; `git hash-object` identical on both files; gate 2 shows the check running inside `lint:check`.
- **Committed in:** `57204c21b`, recorded in `816619d1a`.

**The gap was re-measured before the guard was written, per the operator's instruction** — anchors have drifted on eleven consecutive plans in this milestone. `index.ts:1` is **exact**: the twelfth plan is the first whose inherited anchor needed no correction. The gap exists exactly as described.

### Auto-fixed issues

**1. [Rule 2 — missing critical functionality] The guard covered only the link the operator named**

- **Found during:** the scope addition, while designing check 6
- **Issue:** `database.merged.ts` can be rewired to `export type { Database } from './database';` with the barrel left looking perfectly correct — the same bypass one level down. A guard covering only link 1 reports clean over it.
- **Fix:** check 6 asserts link 2 as well: `database.merged.ts` must declare `export type Database =` and apply `FunctionReturnOverrides` imported from `./database.overrides`.
- **Verified rather than assumed:** NC-7e applies the link-2 bypass and measures `yarn workspace @openvaa/frontend check` **exit 0, 2750 files** — nothing else catches it — while check 6 exits 1 with two violations.
- **Committed in:** `57204c21b`

**2. [Rule 1 — style regression in own code] Three non-interpolating template literals**

- **Found during:** the scope addition, linting the edit
- **Issue:** three of the new violation-message continuation lines used backticks with no `${}`, which the repo's `quotes` rule rejects.
- **Fix:** converted to single-quoted strings, matching the surrounding checks.
- **Verified:** `npx eslint` on the file now reports the **same 6 findings as at HEAD** — my change adds zero. (`scripts/` is outside `lint:check`'s scope, proven by the tree being green at HEAD with those 6 present; the fix was made anyway rather than left because it was unenforced.)
- **Committed in:** `57204c21b`

### Measured corrections — reported, never engineered around

**3. The prescribed `tsconfig.tsbuildinfo` restore is unsatisfiable, for the third independent time**

Task 1 prescribes `git checkout -- packages/supabase-types/tsconfig.tsbuildinfo` after gate 6 on the premise that the file is tracked. Measured at this HEAD: `git ls-files` returns empty, `git check-ignore -v` names `.gitignore:29:*.tsbuildinfo`, and the checkout **exits 1** with `pathspec did not match any file(s) known to git`. `164-03` (deviation 2) and `164-04` (§ 9b, WINDOWS 245) found the same. The criterion's substance — a clean tree after gate 6 — was checked directly and holds: `git status --porcelain` returned 0 lines. Filed, not worked around.

**4. The criterion-3 grep discrepancy, dispositioned rather than smoothed**

The gate's check 4 returns **0** hits. A deliberately wider hand-written grep — one adding the non-underscore column `subtype` to the alternation the script derives — returns **1**: `subtype: entityObj.subtype as string | null | undefined` at `supabaseDataProvider.ts:422`. It is **not** a criterion-3 violation: the receiver is `entityObj`, the return of `toDataObject(entityRow, …)` at `:411`, not an RPC row. It is one of the 16 mapper-output casts `164-02` enumerated and `164-04` § 8a re-measured. The script's underscore restriction is what keeps a cast on a bare property out of a gate aimed at RPC return columns. No code was changed to make a number look better.

---

**Total deviations:** 1 authorised scope addition + 2 auto-fixed (1× Rule 2, 1× Rule 1) + 2 measured corrections filed.
**Impact on plan:** the addition is the plan's substantive value; the Rule-2 fix doubled the guard's reach for a few lines; nothing was descoped. No scope creep beyond the authorisation.

## Issues Encountered

**A first, weaker NC-7e probe — reported rather than quietly re-run.** The initial link-2 mutation replaced only the type body (`export type Database = GeneratedDatabase;`) and left the now-orphaned `FunctionReturnOverrides` import in place. Check 6 fired correctly, but an orphan import is exactly what lint notices, so that run would have been *silent* about whether anything else catches the bypass — the claim would have been literally true and substantively incomplete. The mutation was re-applied without the orphan, and the frontend-check row is the answer. This is § 11's standing lesson (the probe is wrong more often than the guard) applied to this plan's own instrumentation, per the `164-04` NC-6 precedent.

**Every mutation was asserted to have hit what it intended before its verdict was taken** — `git diff --numstat` → `1	1` for NC-7a, an explicit line-content assertion in NC-7c — because `164-04`'s first NC-6 attempt produced a syntax-error red while claiming to test a type constraint.

## Phase-close ledger reconciliation

As the phase's closing plan:

| Open item from this phase | Disposition |
|---|---|
| **WINDOWS 240** — three `164-02` acceptance greps unsatisfiable; artifact cites the measured anchors | **Carried.** A record of stale plan text, not a defect in the tree; the artifact is correct. |
| **WINDOWS 241 / 248** — E2E not run for `164-02` / `164-04` | **Discharged by this plan.** Both deferred to the phase E2E gate, which ran here: 155/155, cardinal-clean, at a HEAD whose product tree is identical to theirs plus this plan's guard. |
| **WINDOWS 242** — `supabase-types-drift` unobserved in CI | **Carried, and re-filed.** Structurally unobtainable on this branch. Never to be recorded as verified. Operator decision: draft PR at **Phase 163**, not here. |
| **WINDOWS 243** — `164-04` anchor drift, eleventh consecutive | **Carried.** Substance held; anchored by content. The twelfth plan (this one) is the first with no drift to report. |
| **WINDOWS 244** — `164-04` NC-5 premise false in both halves | **Carried.** Third agreeing measurement; substance proven by enumeration instead. |
| **WINDOWS 245** — `tsbuildinfo` restore unsatisfiable | **Carried, and confirmed a third time** at this HEAD. |
| **WINDOWS 246** — `164-04` Task 3 AC4 unsatisfiable | **Carried.** Intent checked by reading both pre-existing entries. |
| **WINDOWS 247** — nothing guards the barrel wiring | **CLOSED.** Check 6 + NC-7a…NC-7e; its pending todo moved to `done/` with the resolution recorded. |

**Criterion evidence, traceable:** criterion 1 → `164-02` + NC-4; criterion 2 → **NC-1 alone** (*not* the committed unit test — NC-2 shows that test passes with the guard deleted, and no SUMMARY in this phase should be read as claiming otherwise); criterion 3 → `164-01` + `164-02` + NC-5, re-measured here; criterion 4 → `164-03`'s real regeneration + probes R1/R2 + NC-6, with its last silent-revert path now closed by check 6.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 164 is complete: 5/5 plans, all four ROADMAP criteria discharged with traceable evidence, seven gates green at one HEAD, E2E cardinal-clean.

**One debt leaves this phase unpaid and must not be lost:** the `supabase-types-drift` CI job has never run, because `main.yaml` triggers only on `main` and this branch has never been pushed. It is carried as `164-03` coverage `D6`, this plan's `D6`, a STATE blocker, and two `WINDOWS.md` `unrun-verify` entries. It is Phase 163's to discharge via the draft PR, alongside the identical standing item from Phase 137.

---

_Phase: 164-returns-table-nullability-audit-single-override-mechanism_
_Completed: 2026-09-03_

## Self-Check: PASSED

All claimed files exist on disk (`164-05-SUMMARY.md`, `164-NEGATIVE-CONTROL.md`,
`scripts/assert-rpc-return-nullability.mjs`, the todo now under `done/`, and
`tests/e2e-runs/164-05-cardinal-gate/run.log`). All four commit hashes resolve in
`git log --all` (`57204c21b`, `816619d1a`, `1e971c137`, `6dee2cac7`). The guard re-runs
**exit 0** at the final HEAD with check 6 reporting `barrel exports Database from
./database.merged`, and the working tree is clean.
