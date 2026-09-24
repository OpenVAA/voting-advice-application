---
phase: 156-supabase-schema-corrections-naming-constraints-grants
plan: 10
subsystem: database
tags: [supabase, dispositions, todos, e2e, playwright, pgtap, phase-gate]

requires:
  - phase: 156-09
    provides: The benchmark archival SHAs and the ten-port caveat, recorded in 156-DISPOSITIONS.md so entry 1 and entry 3 transcribe a record rather than reconstruct one
provides:
  - A complete six-entry disposition record for roadmap criterion 8 and criterion 6, with the three plan-added decisions demoted to lettered records so the criterion-item count is unambiguous
  - Four pending todos carrying every deferred question forward, each naming the phase that would consume its answer
  - The whole-phase gate run at ONE HEAD — rebuild, pgTAP, both schema-advisor links, lint:check, unit tests and the complete Playwright suite
  - A diagnosed and fixed intermittent E2E failure (NAVA11Y-02), ironed out rather than annotated flaky
  - A measured gate hole: yarn db:lint:sql cannot reach its own schema advisors (WINDOWS 190)
affects: [157, 161, 162, 163, 164]

actuals:
  tokens: 11866
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Web-first assertion over one-shot sampling: any assertion on state applied inside a requestAnimationFrame callback must poll (expect.poll) rather than sample, and the polled form must be flip-tested to prove it can still fail"
    - "Disposition numbering discipline: criterion items are numbered, decisions made in passing are lettered, so a count of the record items is unambiguous without reading prose"

key-files:
  created:
    - .planning/todos/pending/2026-08-28-lint-schema-as-pgtap.md
    - .planning/todos/pending/2026-08-28-id-jsonb-foreign-key-linkage.md
    - .planning/todos/pending/2026-08-28-feedback-ip-salted-hash.md
    - .planning/todos/pending/2026-08-28-fold-migrations-for-byte-parity.md
  modified:
    - .planning/phases/156-supabase-schema-corrections-naming-constraints-grants/156-DISPOSITIONS.md
    - tests/tests/specs/a11y/a11y-smoke.spec.ts

key-decisions:
  - "The three decisions plans 05 and 06 numbered as entries 7-9 were demoted to lettered Records A-C, prose preserved verbatim, so the six criterion items are countable without ambiguity"
  - "Entry 6 moved from first position to sixth, matching criterion-8 item order with the criterion-6 choice appended; a pointer at the top tells Phase 157's planner where to look"
  - "The NAVA11Y-02 focus assertion was fixed with expect.poll and flip-tested, not annotated flaky, per the project's cardinal E2E rule"
  - "yarn db:lint:sql's exit-1 baseline is reported as FALSIFIED against the plan's criterion rather than ticked, with the advisory set-diff shown; a NEW finding — the && short-circuit makes lint:schema unreachable through that command — is filed as WINDOWS 190"

patterns-established:
  - "Flip-test every assertion you loosen: a polled assertion is only acceptable evidence if inverting its predicate is observed to fail and reverting is observed to pass"

requirements-completed: [REVIEW-DB-08, REVIEW-DB-01, REVIEW-DB-02, REVIEW-DB-03, REVIEW-DB-04, REVIEW-DB-05, REVIEW-DB-06, REVIEW-DB-07]

coverage:
  - id: D1
    description: "156-DISPOSITIONS.md carries six numbered entries — criterion-8 items 1-5 plus the criterion-6 RPC choice — none absent, none duplicated, each with a non-empty disposition"
    requirement: "REVIEW-DB-08"
    verification:
      - kind: other
        ref: "grep -cE '^## Entry [1-6] ' 156-DISPOSITIONS.md == 6; grep -nE '^## Entry ' lists exactly 1..6 at lines 40/91/143/196/244/303"
        status: pass
      - kind: other
        ref: "grep -cE 'IMPLEMENTED|ANSWERED-ON-THE-RECORD' == 12 (>= 6); every entry heading followed by a non-blank Disposition field, read back"
        status: pass
    human_judgment: true
    rationale: "Whether each answer reads as an ANSWER rather than an acknowledgement to the reviewer who raised the five items is the plan's own reserved end-of-phase human check; no grep decides it."
  - id: D2
    description: "Every deferred entry names its carrier, and four todo files exist in the register's frontmatter form each naming a consuming phase"
    requirement: "REVIEW-DB-08"
    verification:
      - kind: other
        ref: "grep -c '.planning/todos/pending/2026-08-28-' 156-DISPOSITIONS.md == 9 (>= 3); all four new filenames referenced by exact name"
        status: pass
      - kind: other
        ref: "node frontmatter parse of all four todos: created/title/area/source/files/related_phase present in each; 0 nonexistent paths across 12 listed files; ## Problem 4/4, ## Solution 4/4, 'TBD —' 1 per file"
        status: pass
    human_judgment: false
  - id: D3
    description: "Entry 1's archival SHA matches the one plan 09 recorded — compared, not retyped"
    verification:
      - kind: other
        ref: "string equality of 714d1e1885b091af95b86d2b497b3e2bff76f031 and 0c1b876f6721d18457dccdff44941284b7c51e5e extracted from 156-09-SUMMARY.md and 156-DISPOSITIONS.md -> both MATCH"
        status: pass
    human_judgment: false
  - id: D4
    description: "The full local gate chain is green at one HEAD: rebuild, pgTAP, both schema-advisor links, lint:check, unit tests"
    verification:
      - kind: integration
        ref: "at HEAD ac49880f8, tree clean for apps/packages/scripts/tests/package.json: db:reset-with-data exit 0 (39s, 752 rows); pgTAP Files=11 Tests=317 Result: PASS not-ok=0 exit 0; lint:schema exit 0 (0 errors, 2 pre-existing warnings); lint:check exit 0; test:unit exit 0 (25/25 tasks, 182 files, 1903 tests)"
        status: pass
      - kind: other
        ref: "yarn db:lint:sql exit 1 — PRE-EXISTING baseline, set-diff against the four known plpgsql advisories is EMPTY; the criterion 'exits 0' is reported FALSIFIED, not ticked"
        status: fail
    human_judgment: true
    rationale: "One link of the chain exits non-zero at baseline and always has. The measurement is recorded verbatim and the set-diff is empty, but a human must decide whether an unsatisfiable criterion is acceptable to carry into the next phase rather than an executor asserting it away."
  - id: D5
    description: "The complete Playwright suite passes at the gate HEAD with zero failed, zero skipped and zero did-not-run"
    verification:
      - kind: e2e
        ref: "yarn test:e2e at HEAD ac49880f8 -> exit 0, '150 passed (10.5m)', all 150 progress indices [1/150]..[150/150] observed, 0 failed / 0 skipped / 0 flaky / 0 did-not-run lines; preflight OK x1, FAIL x0, served root verified against this checkout"
        status: pass
    human_judgment: false
  - id: D6
    description: "The intermittent NAVA11Y-02 focus failure was diagnosed to root cause and fixed rather than tolerated"
    verification:
      - kind: e2e
        ref: "flip-test: predicate inverted -> 1 failed; reverted -> 3 passed in isolation and 150/150 in the full suite. yarn typecheck:tests exit 0; prettier --check exit 0; lint:check exit 0"
        status: pass
    human_judgment: true
    rationale: "The poll was never observed resolving a genuinely failing instant — the red run predates the instrumentation — so 'focus eventually lands' is inferred from three green observations rather than measured on the red one. A human should decide whether that inference is strong enough or whether the app-side rAF focus reset wants its own guard."

duration: 80 min
completed: 2026-08-30
status: complete
---

# Phase 156 Plan 10: Closing the Record and Proving the Phase Summary

**The disposition record closes at six numbered entries with four pending todos carrying every deferred question forward, and the whole phase gate — rebuild, pgTAP, schema advisors, lint, unit tests and the complete 150-test Playwright suite — is green at one HEAD, after an intermittent focus-assertion failure was diagnosed to a `requestAnimationFrame` race and fixed rather than annotated flaky.**

## Performance

- **Duration:** 80 min
- **Started:** 2026-08-30T09:45:00Z (approx)
- **Completed:** 2026-08-30T11:05:00Z
- **Tasks:** 3
- **Files modified:** 6 (2 modified, 4 created)

## Accomplishments

- **Criterion 8 is closed by answering, not by acknowledging.** All five record items carry a written disposition; the two cheap ones are IMPLEMENTED (plan 09's work, recorded here), the three design questions are ANSWERED-ON-THE-RECORD and each names the file that carries it forward.
- **The count is now unambiguous.** Plans 05 and 06 had numbered their own passing decisions as "entries 7, 8, 9", which made "the six record items" uncountable by any mechanical check. Those three are now lettered Records A-C with their prose preserved verbatim, and `grep -cE '^## Entry [1-6] '` returns exactly 6.
- **Four todos filed, twelve listed paths all verified to exist**, each naming its consuming phase (163, 157, 162, 163).
- **The phase gate ran at ONE HEAD** with the code tree clean, ending in a 150/150 Playwright run whose preflight confirmed it drove this checkout.
- **An intermittent E2E failure was found and ironed out.** The project's cardinal rule forbids treating a flake as acceptable; this one was diagnosed to a `requestAnimationFrame` race in a one-shot assertion, fixed with `expect.poll`, and flip-tested to prove the fixed form can still fail.
- **A new gate hole was measured and filed:** `yarn db:lint:sql` can never reach its own schema advisors, because `lint:all` is `lint:sql && lint:schema` and the first link exits 1 at baseline.

## Task Commits

1. **Task 1: Complete 156-DISPOSITIONS.md to six entries** — `0a6065617` (docs)
2. **Task 2: File the four pending todos** — `20da4038e` (docs)
3. **Task 3 deviation fix: web-first Q→Q focus assertion** — `ac49880f8` (fix)

**Plan metadata:** see the final `docs(156-10)` commit.

Task 3 itself produced no source commit — it is the gate run. Its one code change is the deviation fix above, which is also the HEAD the whole chain was measured at.

## The phase gate

**HEAD: `ac49880f8c037250b1a027341ba78023ce304c7f`.** `git status --porcelain apps packages scripts tests package.json` was **empty** at that HEAD, checked before the chain started and again after it finished. The only working-tree entries throughout were `.planning/milestone.lock` (modified before this phase began) and the untracked `.planning/state.json` — both deliberately untouched.

**Free disk:** 152 GiB before the plan, **151 GiB immediately before the final E2E run**, **151 GiB after it**. Four full or partial suite runs consumed under 1 GiB of headroom in total. `tests/e2e-runs/` (6.8 G) was not deleted or touched. The precondition on task 3 is satisfied with a very wide margin; nothing in this plan came near the exhausted-disk failure mode the precondition exists to prevent.

| # | Gate | Result | Notes |
|---|---|---|---|
| 1 | `yarn db:reset-with-data` | **exit 0**, 39 s, 752 rows | Plan 01 measured 35.95 s / 35.86 s; three runs this session read 37 s, 39 s, 39 s. Slightly slower, same order; the reset this phase changed is not a slow gate. |
| 2 | `npx supabase test db` (**from `apps/supabase`**) | **exit 0** · `Files=11` · `Tests=317` · `Result: PASS` · `not ok` = **0** | Conjunction asserted per WINDOWS 186, never any one term alone. |
| 3a | `yarn workspace @openvaa/supabase lint:sql` | **exit 1** — PRE-EXISTING | Four advisories, verbatim below. Set-diff against baseline is **empty**. |
| 3b | `yarn workspace @openvaa/supabase lint:schema` | **exit 0** — `Summary: 0 error(s), 2 warning(s)` | Run explicitly, because 3a short-circuits it inside `lint:all`. Both warnings pre-existing. |
| 4 | `yarn lint:check` | **exit 0**, 10 s | Twelve links including `assert:schema-migration-parity`, which matched its fixture. |
| 5 | `yarn test:unit` | **exit 0**, 26 s | 25/25 turbo tasks · 11 workspaces · **182 test files** · **1903 tests** passed. |
| 6 | `yarn test:e2e` | **exit 0**, 10 m 35 s | **150 passed / 0 failed / 0 skipped / 0 did-not-run.** |

### pgTAP per-file distribution

| File | `plan(N)` |
|---|---:|
| `00-helpers.test.sql` | `no_plan()` — contributes **8** |
| `01-tenant-isolation.test.sql` | 26 |
| `02-candidate-self-edit.test.sql` | 15 |
| `03-anon-read.test.sql` | 59 |
| `04-admin-crud.test.sql` | 30 |
| `05-organization-admin.test.sql` | 14 |
| `06-storage-rls.test.sql` | 15 |
| `07-rpc-security.test.sql` | 9 |
| `08-triggers.test.sql` | 32 |
| `09-column-restrictions.test.sql` | 25 |
| `10-schema-migrations.test.sql` | 84 |
| **Sum of `plan(N)` literals** | **309** |
| **`prove`'s `Tests=`** | **317** (309 + 8) |

**The file count is 11 and the total did not fall.** Plan 08 recorded `Files=11, Tests=317`; this run reads `Files=11, Tests=317`. That is the detector for a pgTAP file silently dropping out of discovery after this phase's file rename (`05-party-admin` → `05-organization-admin`), and it held. The 309 + 8 decomposition also reproduces the arithmetic STATE.md predicts, so the number is understood rather than merely matched.

### `yarn db:lint:sql` — recorded verbatim, and reported FALSIFIED

The acceptance criterion reads "`yarn db:lint:sql` exits 0, or its output is recorded verbatim with an explicit statement of whether the advisory pre-existed this phase." **It exits 1, and always has since phase 151.** Recorded verbatim:

```json
[
  { "function": "public.is_localized_string",
    "issues": [ { "level": "warning extra", "message": "never read variable \"p_key\"", "sqlState": "00000" } ] },
  { "function": "public._bulk_upsert_record",
    "issues": [ { "level": "warning", "message": "unused variable \"rel_key\"", "sqlState": "00000" } ] },
  { "function": "public.resolve_email_variables",
    "issues": [ { "level": "warning extra", "message": "unused parameter \"p_template_body\"", "sqlState": "00000" },
                { "level": "warning extra", "message": "unused parameter \"p_template_subject\"", "sqlState": "00000" } ] }
]
fail-on is set to warning, non-zero exit
```

**Set-diff against the baseline is EMPTY** — three functions, four advisories, byte-identical to what plans 06, 07 and 08 measured and to WINDOWS 17 / 115 / 125. **Zero NEW advisories from this phase.** No duplicate ledger entry was filed.

The advisors were measured against a **freshly reset database**, deliberately: the pgTAP run at gate 2 leaks five helper functions (`test_id`, `test_user_id`, `set_test_user`, `reset_role`, `create_test_data`) into `public` outside its `BEGIN`/`ROLLBACK`, and `supabase db lint` lints them. Measured both ways — contaminated and clean — the advisory set is identical, so the leak produced no advisory of its own; the reset is recorded so nobody has to wonder. No `yarn db:types` was run anywhere in this plan, so the contamination could not reach the generated types.

### A NEW finding: `db:lint:sql` cannot reach its own schema advisors

`db:lint:sql` → `yarn workspace @openvaa/supabase lint:all` → `yarn lint:sql && yarn lint:schema`. Because `lint:sql` exits 1 at baseline, the `&&` **short-circuits and `lint:schema` never runs**. WINDOWS 125 states "the file-reading half (lint:schema) exits 0" — true, but it was measured by invoking it separately; through the documented command it is unreachable. The consequence is not cosmetic: the RLS-disabled advisor is the **ERROR**-level one, so a table shipped without row-level security would not be caught by `yarn db:lint:sql`. Filed as **WINDOWS 190**; it strengthens the case already written into `2026-08-28-lint-schema-as-pgtap.md`.

Run explicitly, `lint:schema` gives `Summary: 0 error(s), 2 warning(s)` — unindexed foreign keys on `constituency_group_constituencies.constituency_id` and `election_constituency_groups.constituency_group_id`, both pre-existing and neither on `app_settings`, which is exactly what Record C asserts.

### The headline rename holds

```
$ grep -ric "party" apps/supabase/supabase/schema/ apps/supabase/supabase/migrations/ apps/supabase/supabase/tests/ | grep -v ':0$'
(no output)
$ grep -rinE '\bparty\b' <same three trees>
(no output)
```

Zero occurrences, case-insensitive, as substring or as word, across all three trees at the final HEAD.

## The E2E run — four numbers, and what they do not prove

**Final run at HEAD `ac49880f8`:**

| | Count |
|---|---:|
| passed | **150** |
| failed | **0** |
| skipped | **0** |
| did-not-run | **0** |

Exit code **0**. Wall clock **10 m 35 s** (Playwright's own figure: `150 passed (10.5m)`). All 150 progress indices `[1/150]` … `[150/150]` were observed in the log, so no spec was silently dropped. Preflight: **1** `E2E PREFLIGHT OK` line, **0** failure lines —

```
E2E PREFLIGHT OK /…/voting-advice-application-gsd/apps/frontend (verified against /…/voting-advice-application-gsd)
```

Exactly **one** dev server ran on 5173 for every run (`lsof` showed a single PID 22215 throughout), started after `yarn dev:clean` on a `yarn db:reset` database, with `FRONTEND_PORT=5173` from the root `.env`. There is no Playwright-managed web server here.

**What this run proves, and what it does not.** `yarn db:reset-with-data` seeds as `service_role`, which bypasses every column grant and most row-level security — so a green seed is evidence about migration replay and nothing else. It says nothing about the six column grants criterion 5 revoked, the RLS policies this phase renamed, or the invoker security of the RPCs it changed. Those are reached by the role-simulated pgTAP suite at the SQL layer and by the Playwright suite over real anon and authenticated HTTP; both are green above. **This is the phase's only evidence about the anon and authenticated HTTP paths, and it is not interchangeable with the seed.**

A second limit worth stating: `05-organization-admin.test.sql`'s 14 role-scope assertions are BLIND to the role vocabulary (WINDOWS 183, filed by plan 03), so a green pgTAP run is not behavioural coverage of role scoping. Anyone reading this gate as proof that role scoping behaves is over-reading it.

## The E2E failure that had to be fixed

The first complete run at HEAD `20da4038e` was **149 passed / 1 failed**. Under this repository's cardinal rule that is a phase blocker, and there is no flaky exemption to reach for. Reported in full, because a phase-gate summary that mentions only the green run is worth less than no summary.

**The failing test:** `tests/tests/specs/a11y/a11y-smoke.spec.ts:286` — `navigation-a11y — focus lands on heading after Q→Q nav` (NAVA11Y-02).

**The assertion, as it stood:**

```ts
const focusedHeading = await page.evaluate(
  () => document.activeElement?.hasAttribute('data-focus-on-nav') === true || document.activeElement?.tagName === 'H1'
);
expect(focusedHeading).toBe(true);
```

**Diagnosis, in the order it was established:**

1. **Not caused by this phase.** `git log` on the spec shows its last change was phase 152's line-break sweep; the focus mechanism (`apps/frontend/src/routes/+layout.svelte`, `MainContent.svelte`, the two question routes) was last touched by phase 152 as well. Phase 156's only frontend commits are the RPC rename, an `EntityTag` edit, an icon map and a login page-server file — none of them navigation or focus.
2. **The mechanism.** `+layout.svelte:147-155` applies the focus reset inside a `requestAnimationFrame` callback scheduled from `afterNavigate`. The spec waits for the question heading to be **visible** and then samples `document.activeElement` **once**. "Heading visible" and "focus moved onto it" are two events with no ordering guarantee; the sample can land in the gap.
3. **The failure snapshot rules out a render problem.** `error-context.md` shows the fully-rendered question page with `heading … [level=1]` present. The DOM was right; only the sampled instant was wrong.
4. **Reproduction attempts.** The same test in isolation: **3/3 green**. A full suite run with an instrumented polling probe: **150/150 green**, the probe reporting `{"first":true,"firstActive":"HGROUP","targetExists":true,"elapsed":0}` — i.e. the settled active element is the `[data-focus-on-nav]` `<hgroup>`, present and focused, at the first sample.

**The fix** replaces the one-shot sample with `expect.poll`, which is already this suite's idiom for exactly this problem (`theme.fixture.ts` calls it "web-first (re-reads until it matches or times out) rather than a one-shot snapshot"; `emailBucket.fixture.ts` uses it too). The polled form **still fails when focus never arrives**, so it cannot mask the defect the assertion exists to catch.

**Flip-tested, because a loosened assertion is only evidence if it can still fail:** inverting the predicate to `hasAttribute('data-focus-on-nav-NOPE') && tagName === 'MARQUEE'` produced **1 failed**; reverting produced **3 passed** in isolation and **150/150** in the full suite.

**Residual uncertainty, stated rather than buried.** The poll was never observed resolving a genuinely failing instant — the red run predates the instrumentation, and the failure did not reproduce afterwards. "Focus eventually lands" is therefore inferred from three green observations, not measured on the red one. If NAVA11Y-02 ever fails again it will now fail **on timeout**, which distinguishes "focus never arrived" from "focus arrived late" and is strictly more diagnostic than the state before. Recorded as **WINDOWS 191**.

**Not done:** the test was not skipped, not retried until green, not annotated flaky, and no retry count was raised.

### Run ledger, so the numbers above are auditable

| Run | HEAD | Outcome |
|---|---|---|
| A | `20da4038e` | **VOIDED — not a test result.** Killed at `[119/150]` by the executor harness's own 10-minute foreground command cap, not by any test. Re-run properly in the background thereafter. |
| B | `20da4038e` | **149 passed / 1 failed** — NAVA11Y-02. The failure this plan had to fix. |
| — | `20da4038e` | NAVA11Y-02 alone, 3 consecutive isolation runs: **3/3 green each**. |
| C | `20da4038e` + probe | **150 passed / 0 failed**, instrumentation only, uncommitted, reverted. |
| **D** | **`ac49880f8`** | **150 passed / 0 failed / 0 skipped / 0 did-not-run — the reported gate result.** |

## Files Created/Modified

- `.planning/phases/156-…/156-DISPOSITIONS.md` — completed to six numbered entries (1-5 added, 6 moved into numeric position and confirmed against what plan 08 shipped); entries 7-9 demoted to lettered Records A-C with prose preserved; an index table added for the four passing decisions; measurement corrections 7-9 appended. 357 → 654 lines.
- `.planning/todos/pending/2026-08-28-lint-schema-as-pgtap.md` — the schema-advisors-as-pgTAP design question, `related_phase: 163`.
- `.planning/todos/pending/2026-08-28-id-jsonb-foreign-key-linkage.md` — the JSONB linkage question, `related_phase: 157`, answered for BOTH question tables.
- `.planning/todos/pending/2026-08-28-feedback-ip-salted-hash.md` — the client-IP recommendation, `area: security`, `related_phase: 162`.
- `.planning/todos/pending/2026-08-28-fold-migrations-for-byte-parity.md` — the declined migration fold, `related_phase: 163`.
- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — `assertFocusOnHeading` made web-first (deviation, below).

## Decisions Made

1. **Six numbered entries, three lettered records.** Plans 05 and 06 had appended their own decisions as numbered entries 7-9, which made the plan's central invariant — "six record items, none absent, none duplicated" — impossible to check mechanically. The three were demoted to `## Record A/B/C`, every word preserved, and an index table points at them plus the fourth passing decision (the drift gate) that lives inside Entry 6. The plan asked for the records to be "distinct from the six so the count stays unambiguous"; renaming the headings is what actually achieves that.
2. **Entry 6 moved to sixth position.** Plan 01 wrote it first, out of numeric order, because Phase 157's planner needs it. That reason is served better by a pointer at the top of a correctly-ordered document than by a broken ordering, and the plan's own must_have asks for "the RPC choice last".
3. **Entry 3 discharges the pre-existing hand-off todo** `2026-08-29-config-toml-hard-coded-ports-phase-156.md` (filed by Phase 155) rather than filing a fifth new one. That todo names REVIEW-DB-08 as its owner; answering it here is what closing it means.
4. **`db:lint:sql` reported FALSIFIED, not ticked and not skipped.** See above.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] The NAVA11Y-02 focus assertion sampled a `requestAnimationFrame`-applied state once**
- **Found during:** Task 3 (the E2E gate), full-suite run B.
- **Issue:** 1 of 150 E2E tests failed. Full diagnosis above.
- **Fix:** `expect.poll` with `TIMEOUTS.slowPage`, plus a comment stating the mechanism and why polling does not mask the defect.
- **Files modified:** `tests/tests/specs/a11y/a11y-smoke.spec.ts` — **outside this plan's declared `files_modified`**, which is why it is recorded as a deviation and filed as WINDOWS 191. Justification: the plan's own gate cannot pass with a racing assertion, and CLAUDE.md forbids tolerating the flake.
- **Verification:** flip-test (inverted predicate → 1 failed; reverted → green), `yarn typecheck:tests` exit 0, `npx prettier --check` exit 0, `yarn lint:check` exit 0, isolation 3/3, full suite 150/150.
- **Committed in:** `ac49880f8`

### Measurement corrections — the plan's and the phase documents' numbers, corrected rather than worked around

**2. `apps/supabase/scripts/lint-schema.mjs` is 182 lines, not 185.** The plan's Task 1 `read_first` and `156-RESEARCH.md` both say 185; `2026-08-28-claude-md-stale-factual-claims.md` says 174. Measured: **182**. Recorded in Entry 2 and as measurement correction 8. Not load-bearing for anything.

**3. Entry 3 carries TEN ports, not the nine `156-CONTEXT.md` § D-E5 lists.** Plan 09 measured this first; this plan carries it into the disposition record and into measurement correction 7 so the count stops propagating.

**4. Entry 4 answers for TWO tables, not one.** `156-CONTEXT.md` § D-E5 item 4 cites `103-questions.sql:20-23`, i.e. `question_categories` only. Read this session, the identical four JSONB columns are on `questions` at `:48-51`. The entry and the todo both answer for both; measurement correction 9 records the CONTEXT error.

**5. Task 1's acceptance criterion `grep -cE '^#+ *(Entry )?[1-6][\.\)]' … returns 6` returns 0 as literally written** — the pattern requires a `.` or `)` immediately after the digit, and the document's heading form is `## Entry N — …`. The criterion's own escape clause applies ("or the document's chosen heading form yields exactly six numbered entries by whatever pattern it uses — the SUMMARY records the pattern and the count"). **Pattern: `^## Entry [1-6] `. Count: 6.** Entries at lines 40, 91, 143, 196, 244, 303.

**6. `yarn db:reset-with-data` measured 37-39 s, against plan 01's 35.95 s / 35.86 s.** Same order of magnitude, same 752 rows. Recorded because the plan asked for the before-and-after comparison, not because it means anything.

### Out-of-scope findings recorded rather than fixed

**7. `yarn db:lint:sql` short-circuits past its own schema advisors.** New, distinct from WINDOWS 125. Filed as **WINDOWS 190**; not fixed, because reordering a lint chain or baselining four advisories is the CI-gates phase's decision, not a schema-corrections phase's.

**8. Running any `supabase` CLI command from the REPO ROOT resolves a stray top-level `supabase/` directory** and infers a different project id (`voting-advice-application-gsd` rather than `openvaa-local`), so `npx supabase status` from the root reports `No such container`. This is the mechanism behind WINDOWS 184's `Files=0, Tests=0, NOTESTS` exit-0 hazard. Already filed as `.planning/todos/pending/2026-08-28-153-stray-top-level-supabase-directory.md`; **not duplicated**, and every supabase invocation in this gate was run from `apps/supabase` or through a workspace script.

---

**Total deviations:** 1 auto-fixed bug (Rule 1), 5 measurement corrections recorded, 2 out-of-scope findings recorded and not fixed.
**Impact on plan:** The single code change is a test-correctness fix mandated by the project's own E2E rule; it adds no product behaviour and removes no assertion strength (flip-tested). No scope creep. One acceptance criterion is reported FALSIFIED (`db:lint:sql` exits 0) and one is satisfied via its own documented escape clause (the entry-count grep pattern).

## Issues Encountered

- **The executor harness caps a foreground command at 10 minutes, and the E2E suite takes 10.5.** The first attempt was killed at `[119/150]`. That is a harness artifact, not a test result, and it is recorded as run A rather than quietly dropped — a killed run and a failing run are indistinguishable in a log tail, which is exactly the confusion the plan's precondition warns about for disk exhaustion. All subsequent runs were detached.
- **The failing test would not reproduce on demand.** Three isolation runs and one instrumented full run were all green. Rather than declare it unreproducible and move on — which is the "known-flaky exemption" this project forbids — the mechanism was established from the source (`+layout.svelte`'s rAF-scheduled focus reset) and the fix was made robust under both hypotheses: a race and a genuine never-focus. The polled assertion fixes the first and still fails on the second.

## Known Stubs

None. No placeholder, TODO marker or hardcoded empty value was introduced. The four `TBD —` markers in the pending todos are the register's required `## Solution` opener, not stubs — each is followed by an enumerated set of candidate approaches.

## Threat Flags

None. This plan added no network endpoint, no auth path, no file-access pattern and no schema change. Its only code change is a test assertion.

**Threat register dispositions discharged:**

| ID | Disposition |
|---|---|
| T-156-40 (phase declared complete on evidence that measures nothing) | Both the role-simulated pgTAP suite and the real-HTTP Playwright suite were run in addition to the seed, at one recorded HEAD with a clean tree, and the E2E result is four explicit numbers. |
| T-156-41 (a pgTAP file silently undiscovered after the file rename) | `Files=11` and `Tests=317` — count held, total did not fall, and the 309 + 8 decomposition was checked rather than matched. |
| T-156-42 (a candidate secret written into the security todo) | No value written. The todo names a secret store and forbids a literal in tracked files, in its own words. Scanned: no assignment-shaped credential literal in either the todo or the disposition record; the only long alphanumeric runs are file paths. |
| T-156-43 (a record item present but empty) | Every entry carries exactly one of IMPLEMENTED / ANSWERED-ON-THE-RECORD, read back after writing; every ANSWERED entry names its carrier by exact filename, and all four names were matched against the files on disk. |
| T-156-44 (a run voided by exhausted disk, read as a real failure) | 151-152 GiB free throughout, measured before and after; under 1 GiB consumed by four suite runs. `tests/e2e-runs/` untouched. |
| T-156-SC (package installs) | Zero packages installed. |

## User Setup Required

None.

## Next Phase Readiness

- **Phase 156 is complete at 10/10 plans.** Every gate this project has is green at `ac49880f8`, with the two honest exceptions stated above rather than smoothed over: `yarn db:lint:sql` exits 1 at a pre-existing baseline, and its second link never runs.
- **Phase 157's planner should read Entry 6 first.** The RPC is `public.merge_question_custom_data(uuid, jsonb)`; the parameter list is unchanged; the two production call sites and one test site are named verbatim. `156-CONTEXT.md` § C3's "none in 156" is false for `get_nominations` and `get_candidate_user_data` — both were touched, both remain source-compatible. WINDOWS 188 already records that `157-12-PLAN.md` and `161-04-PLAN.md` still grep for the retired name; this plan did not edit another phase's plan files.
- **Phase 157 also inherits the id-JSONB linkage question**, which is blocked on its own `get_questions` query shape. The todo says so from the other side.
- **Phase 163 inherits two items**: the schema-advisors-as-pgTAP question (now strengthened by WINDOWS 190, which shows the advisors are unreachable through the documented command) and the declined migration fold.
- **Phase 162 inherits the feedback client-IP recommendation.**
- **All eight REVIEW-DB requirements are marked Complete**, after `requirements.ready-ids` was consulted and returned 8/8 ready with none blocked — this being the last declaring plan. Plan 09's premature mark-and-revert is the reason that check was run first.
- No blockers.

## Self-Check: PASSED

- All six paths in `key-files` exist on disk (`[ -f ]` on each of the four todos, the disposition record and the spec).
- All four commits found in `git log --oneline --all`: `0a6065617`, `20da4038e`, `ac49880f8`, plus this metadata commit.
- All task `<acceptance_criteria>` re-run at the final HEAD. Every one passes except the two reported above: the entry-count grep satisfied via its documented escape clause, and `db:lint:sql exits 0` reported FALSIFIED with the set-diff shown.
- Plan-level `<verification>` re-run in full: six numbered entries with non-empty dispositions and named carriers; four todos in register form each naming a consuming phase; the whole chain green at one HEAD; E2E four numbers with the last three at zero; the case-insensitive `party` search across both SQL trees and the pgTAP tree returns nothing.
- `git status --porcelain` shows only `.planning/milestone.lock` (pre-existing) and the untracked `.planning/state.json` — neither touched, as instructed.
- STATE.md position block read back after `state.advance-plan`: it had again left `Plan: … 156-01 … 156-09` and `Status: … at 9/10`, and `state.update-progress` reported "Progress field not found". Both repaired by hand to `156-01 … 156-10` and `10/10`, and `completed_plans` advanced 135 → 136.

---
_Phase: 156-supabase-schema-corrections-naming-constraints-grants_
_Completed: 2026-08-30_
