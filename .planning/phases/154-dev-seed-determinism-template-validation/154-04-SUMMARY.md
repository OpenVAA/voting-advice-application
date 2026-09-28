---
phase: 154-dev-seed-determinism-template-validation
plan: 04
subsystem: dev-seed
tags: [dev-seed, comment-hygiene, todo-register, e2e-gate, phase-closure]

# Dependency graph
requires:
  - phase: 154-01
    provides: "the recorded pre-fix drift measurement and the two invertible controls this phase's E2E debt accrued against"
  - phase: 154-02
    provides: "the whitespace-only external_id boundary, characterized and handed over for filing"
  - phase: 154-03
    provides: "the closed determinism breach, and the corrected E2E-decline route that made this plan's gate unavoidable"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "commit df9e7b20b (152-08), which discharged comment site one entirely and site two partially before this plan ran"
provides:
  - "The two comment-shaped items this phase owns, closed — one by measured discharge, one by edit"
  - "Two pending register entries carrying the declined follow-ups, each with re-measured sites and a stated reason for the deferral"
  - "The phase's E2E cardinal gate, DISCHARGED: 150 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run, decoded from the report payload"
  - "Five measured corrections registered in WINDOWS (145–149), including a fifth family of stale inherited line numbers and a refuted E2E-coupling premise"
affects: [ship-time REVIEW-SEED and REVIEW-HYG review, Phase 152 closure]

actuals:
  tokens: 4297
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Discharge-before-edit: measure whether a prior phase already closed an assigned site before opening it, and record the discharge instead of producing a duplicate diff"
    - "Register entries carry RE-MEASURED citations plus an explicit note that the research's are superseded — a todo's whole value is routing a future implementer"

key-files:
  created:
    - ".planning/todos/pending/2026-08-28-dev-seed-hardcoded-election-date-is-in-the-past.md — 145 lines, 22 re-measured sites"
    - ".planning/todos/pending/2026-08-28-dev-seed-whitespace-only-external-id-accepted.md — 99 lines"
  modified:
    - "packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts — +1/-1, comment only; zero program bytes"

key-decisions:
  - "Comment site one was NOT re-edited: 152-08 already completed the stub bullet, pointing it at `./schema.ts` — one of the two targets 154-RESEARCH R9 names as correct. The plan's Task 1 acceptance criterion `grep -c 'latentEmitter' == 1` is therefore unsatisfiable without producing exactly the duplicate diff decision D-C3 exists to prevent. Recorded as met-by-discharge."
  - "The plan's instruction to copy R10's 22 file:line pairs VERBATIM was overridden. All 22 line numbers are stale (the same sweep shortened the files); the file set and per-file counts are identical. The todo carries re-measured numbers and says R10's are superseded."
  - "R10's E2E-coupling premise — 'several perm specs may assert against the date' — is REFUTED by measurement (0 specs, any rendering; frontend does not branch). Its conclusion survives through a different mechanism: the perm serial DAG seeds from exactly these rows."
  - "REVIEW-HYG-02 was DELIBERATELY NOT marked complete despite `ready-ids` returning 3/3 ready. Its row belongs to Phase 152 and its text sizes the class at 817 comment lines; this plan rewrote one."
  - "The full E2E suite WAS run, discharging the debt 154-01/02/03 accumulated (WINDOWS 132, 137, 143). This plan's own diff touches a harness-seeded template, so the question was decided on this diff rather than inherited."

patterns-established:
  - "When a phase forbids editing a shared doc that carries a false figure, the closing plan's job is to make the falsity LEGIBLE in the register, not to work around it or to quietly leave it — an unflagged known-wrong citation is indistinguishable from an unnoticed one."
  - "A gate that a prior plan declined by argument is discharged by RUNNING it in the closing plan, not by re-stating the argument a fourth time."

requirements-completed: [REVIEW-SEED-01, REVIEW-SEED-02]

coverage:
  - id: D1
    description: "The two comment sites this phase owns read as finished prose, with no dangling reference, no fragment, and no superseded-value narrative"
    requirement: REVIEW-HYG-02
    verification:
      - kind: command
        ref: "grep -c 'latent$' packages/dev-seed/src/template/types.ts => 0"
        status: pass
      - kind: command
        ref: "grep -c 'trace-confirmed' packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts => 0"
        status: pass
      - kind: command
        ref: "grep -cE '^\\s*// \\)\\.' packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts => 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Neither comment edit changes program behaviour; the popup delay values are unchanged"
    verification:
      - kind: command
        ref: "git diff -U0 on site two, non-comment [+-] lines => 0"
        status: pass
      - kind: command
        ref: "grep -c 'showSurveyPopup: 1, showFeedbackPopup: 1' => 1"
        status: pass
      - kind: command
        ref: "no phase/plan/decision/planning-path token on any added line => 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both declined follow-ups are filed in the pending register with a full site list, a stated reason for the deferral, and options"
    verification:
      - kind: command
        ref: "both files exist; grep -c 'packages/dev-seed/src/templates/' on the election-date file => 24 (>= 22); frontmatter key order matches the exemplar; 5/5 required headings in each"
        status: pass
      - kind: command
        ref: "git status --porcelain packages/ empty after task 2 — the todos touch no source file"
        status: pass
    human_judgment: false
  - id: D4
    description: "The full E2E suite is green with zero did-not-run specs — the phase's cardinal gate, unconditional"
    verification:
      - kind: e2e
        ref: "yarn test:e2e => 150 passed (10.2m), exit 0; payload decoded {total:150, expected:150, unexpected:0, flaky:0, skipped:0, ok:true}"
        status: pass
    human_judgment: false
  - id: D5
    description: "The unit, lint, format and typecheck gates are green at phase close"
    verification:
      - kind: command
        ref: "yarn test:unit (root) exit 0, 25/25 · yarn lint:check exit 0 · yarn format:check exit 0 · yarn workspace @openvaa/dev-seed typecheck exit 0 · dev-seed test:unit 580 passed / 49 files"
        status: pass
    human_judgment: false

duration: 20 min
completed: 2026-08-29
status: complete
---

# Phase 154 Plan 04: Phase Closure Summary

**The phase's E2E cardinal gate is discharged at 150 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run — the first full-suite run in this phase, paying the debt its three prior plans each declined by argument — with one comment site closed by edit, one closed by measured discharge rather than a duplicate diff, and both declined follow-ups filed as register entries carrying re-measured citations because every inherited one in this phase has been wrong.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-08-29T04:20:58Z
- **Completed:** 2026-08-29T04:41:52Z
- **Tasks:** 3
- **Files changed:** 3 (+245/−1)

## The E2E gate — run, not argued

| Measure | Value |
|---|---|
| Command | `yarn test:e2e` (whole suite, no filter, no retry) |
| Console tail | `150 passed (10.2m)`, `E2E_EXIT=0` |
| **Decoded report payload** | `{"total": 150, "expected": 150, "unexpected": 0, "flaky": 0, "skipped": 0, "ok": true}` |
| Passed | **150** |
| Failed | **0** |
| Flaky | **0** |
| Skipped / did-not-run | **0** |
| Duration | **10.2 min** |
| Pre-phase baseline (152-15) | `{total:150, expected:150, unexpected:0, flaky:0, skipped:0, ok:true}` — **identical** |

**The counts match the pre-phase baseline exactly**, on every field of the payload, with nothing to
attribute. That is the expected result and it was still worth running: the expectation rested on the
data being unchanged, and an expectation is not a measurement.

**Counts come from the payload, not the console tail.** `total == expected == 150` with `skipped: 0`
is what establishes zero did-not-run; the tail line alone cannot distinguish a spec that passed from
a spec that never ran. Decoded out of `<script id="playwrightReportBase64">` in
`tests/playwright-report/index.html` → the embedded zip → `report.json` → `stats`. Report and run log
preserved at `tests/e2e-runs/154-04-cardinal-gate/` (that tree is gitignored by design).

**No spec was annotated, skipped, retried, or re-run to reach green.** Zero flaky, first attempt.

**Run conditions, all verified before starting:** `yarn db:reset` completed (migrations + `seed.sql`);
exactly one freshly started dev server, `node` on `[::1]:5173`, confirmed with
`lsof -nP -iTCP:5173 -sTCP:LISTEN` and `docker ps | grep 5173` (no docker listener); 149 GiB free on
the data volume, well clear of the ENOSPC class that has voided full-suite runs in this worktree. The
server was stopped afterwards (`pkill -f 'vite.js dev'`; 0 listeners remaining).

### Why this plan ran the suite when three prior plans did not

The question was decided on **this** diff, not inherited. This plan's diff touches
`packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts` — a built-in template the
Playwright harness seeds from, via `tests/seed-test-data.ts:12`'s import of `BUILT_IN_TEMPLATES`.
That the diff is comment-only is a strong argument that the dataset is unchanged, but plans 01, 02
and 03 each produced a strong argument too, and 154-03 discovered that the argument 01 and 02 shared
was **incomplete** (WINDOWS 142). This is the plan the phase designated as its gate. Running it costs
ten minutes and settles the phase's whole accumulated diff, including 154-03's production `src/`
changes, rather than settling only this plan's.

**Debt discharged.** WINDOWS 132 (154-01), 137 (154-02) and 143 (154-03) each record "the full E2E
suite was NOT run for this plan". Those records remain true of their own plans and were not rewritten;
what changed is that the phase now has a green full-suite run covering the union of all four diffs.

## The two comment sites

### Site one — `packages/dev-seed/src/template/types.ts`: DISCHARGED, not edited

Measured before touching anything, as the plan's own backstop truth requires. The repo-wide comment
sweep had already closed it in commit `df9e7b20b` (152-08).

**Before (as 154-RESEARCH R9 quoted it):**

```
 * - `packages/dev-seed/README.md` — worked authoring example (see phase 58 DX-01).
 *   schema-extension pattern; override signature.
 * - `./permittedKeys.ts` — the four permitted-key sources and the row types.
 * - — latent
 *   block semantics (`dimensions`, `eigenvalues`, `centroids`, `spread`,
 *   `loadings`, `noise`).
```

**Now, on the tree, unchanged by this plan:**

```
 * - `packages/dev-seed/README.md` — worked authoring example; the
 *   schema-extension pattern; the override signature.
 * - `./permittedKeys.ts` — the four permitted-key sources and the row types.
 * - `./schema.ts` — the latent block's semantics (`dimensions`, `eigenvalues`,
 *   `centroids`, `spread`, `loadings`, `noise`).
```

Three complete pointer bullets, symmetric with each other. The target is real and apt —
`schema.ts:43-49` is the docstring over `latentBlock`, which declares exactly those six fields. No
phase number, plan number, decision id or non-`packages/` path survives. **The obligation is
discharged; the site was not re-edited.**

**One acceptance criterion is consequently unsatisfiable.** Task 1 requires
`grep -c 'latentEmitter' packages/dev-seed/src/template/types.ts` to return 1; it returns 0, because
the sweep pointed the bullet at `./schema.ts` instead. R9 names **both** `./schema.ts` and
`../emitters/latent/latentEmitter.ts` as correct targets, so the sweep's choice is on-spec. Satisfying
the criterion literally would mean rewriting a clean bullet to a second valid target — producing
precisely the duplicate diff decision D-C3 exists to prevent. Recorded as **met by discharge** and
registered as WINDOWS 145, rather than engineered around.

### Site two — `show-feedback-survey.ts`: PARTIALLY discharged, edit completed here

The sweep closed the dangling parenthetical and stripped the phase citation, but left two of the
plan's required properties unmet: the superseded-value narrative, and the adjective `trace-confirmed`
whose referent the citation strip had removed.

**Before:**

```
    // NB: showFeedbackPopup / showSurveyPopup are countdown delays in SECONDS (appContext.svelte.ts:414-437 schedule `setTimeout(…, delay * 1000)`), NOT milliseconds. Values of 180 / 500 would be 3 min / ~8 min, and the popups would never surface inside the test window — trace-confirmed. A 1-second delay is the type-correct "small positive delay" the popup needs to enqueue promptly on /results.
```

**After:**

```
    // showFeedbackPopup / showSurveyPopup are countdown delays in SECONDS, not milliseconds: appContext.svelte.ts:305-327 schedules both popups with `setTimeout(…, delay * 1000)`. A 1-second delay is the smallest type-correct value that lets the popup enqueue promptly on /results.
```

Present tense, one sentence of units and one of value, no history. **A sixth measured correction while
rewriting:** the comment cited `appContext.svelte.ts:414-437`. That file was shortened by the same
sweep. Measured on this tree, the two countdown methods are `startFeedbackPopupCountdown` at
`:305-318` and `startSurveyPopupCountdown` at `:321-327`, with the `delay * 1000` multiplications at
`:318` and `:327`. The rewritten comment cites the measured `:305-327`. Had the plan's illustrative
sketch been copied verbatim, this plan would have repaired one broken citation by writing another.

**Zero program bytes changed.** `git diff -U0` on the file yields 0 non-comment `[+-]` lines, and
`showSurveyPopup: 1, showFeedbackPopup: 1` is present and untouched.

## The two filed follow-ups

Both live in the pending register, per the decision that declined work is tracked there rather than
left as a code comment, a roadmap backlog item, or an implicit understanding.

| File | Slug | Severity | Sites |
|---|---|---|---|
| `.planning/todos/pending/2026-08-28-dev-seed-hardcoded-election-date-is-in-the-past.md` | election date in the past | low | 22, in 14 files |
| `.planning/todos/pending/2026-08-28-dev-seed-whitespace-only-external-id-accepted.md` | whitespace-only external_id | low | 1 guard, 1 pinning case |

Both follow the exemplar exactly: `created` / `source` / `resolves_phase` / `severity` / `area`
frontmatter in that order, H1 title, then `## The hole`, `## Why it was not fixed in-phase`,
`## The decision required` (options, one marked recommended), `## After the decision` (numbered
steps), `## Related`. Neither touches a source file.

### The whitespace todo — the item explicitly owed to this plan

Filed under the slug 154-02 handed over. It records that **three spaces pass the guard** because the
non-empty check is `externalId === ''` — a raw length test, not a trimmed one — so the value is
prefixed and written as `seed_` followed by three spaces. The boundary is pinned by the committed
case `boundary: a whitespace-only external_id is currently accepted`, which was flip-tested RED in
154-02 by substituting the empty string. Two options, with **trim before the emptiness check**
recommended, and a note that the pinning case must be *inverted*, never deleted, if the guard is
tightened.

Downstream consequence was **measured rather than assumed**: `external_id` is a nullable `text`
column with a partial unique index and **no `CHECK` constraint** on emptiness or blankness
(`00001_initial_schema.sql:2322-2324` and siblings), so a whitespace id stores cleanly, participates
in uniqueness normally, and still matches the `seed_`-prefix teardown. The cost is human — an id
invisible in logs and untypeable — which is what makes this hygiene rather than a live bug, and is
why `low` is the honest severity.

### The election-date todo — and two corrections to its own source material

Enumerates all 22 sites, records that the deferral is **deliberate** (no decision covers it, no
criterion asks for it), and states plainly that **the fixed reference constant this phase introduced
does not address it**: no built-in template emits a synthetic election at all, so `SEED_REF_DATE` has
zero demo-visible impact and every user-visible election date comes from a hardcoded row. Folds in the
date-of-birth wrinkle (nonsense before, nonsense-in-the-future after; fires under no built-in).

**Correction A — R10's 22 line numbers are all stale.** The plan instructed: "copy the site list
verbatim from the research section, do not re-grep it." Re-grepped anyway. Every offset has moved
(`default.ts:79`→`:51`, `buildMinimal.ts:241`→`:207`, `base.ts:418`/`:430`→`:346`/`:358`, and so on
through all 22), because the comment sweep shortened these files after R10 was measured. The **file
set and per-file counts are identical**, so R10's substance holds. This is the **fifth** family of
stale inherited line numbers registered in this phase. The instruction was overridden because a
register entry's entire job is routing a future implementer, and 22 wrong citations would defeat it.
Registered as WINDOWS 146.

**Correction B — R10's stated E2E coupling is refuted.** R10 cautioned that "several perm specs may
assert against the date", and the plan promoted that hedge to a required must-have truth. Measured:
`grep -rn "2026-06-15" tests/` returns **0 files**, as do greps for the Finnish (`15.6.2026`), English
(`June 15, 2026`) and US (`6/15/2026`) renderings. The frontend does not branch on the date either —
it is display-only, mapped at `supabaseDataProvider.ts:155` and rendered through
`dynamic.info.dateInfo` at `routes/(voters)/info/+page.svelte:48`.

R10's **conclusion** nonetheless survives, by a different mechanism: `tests/playwright.config.ts`
wires a serial DAG of `data-setup-perm-*` projects that seed from exactly these rows, so a refresh
changes the seeded dataset and demands a full-suite run. That is the same shape as 154-03's correction
— **dev-seed reaches E2E through the data, not through assertions or imports.** The todo records both
the hedge and its refutation, so nobody spends a morning hunting an assertion that does not exist.
Registered as WINDOWS 147.

## Requirements — attempted, recorded, nothing hand-edited

`.planning/REQUIREMENTS.md` is **byte-identical** to its committed state; `git status --porcelain` on
it is empty after every call below.

| Call | Result | Written |
|---|---|---|
| `requirements mark-complete REVIEW-SEED-01 REVIEW-SEED-02` | `updated: false`, both `already_complete` | nothing (154-03 marked them) |
| `requirements mark-complete REVIEW-SEED-03 REVIEW-SEED-04` | `updated: false`, both `not_found` | nothing |
| `REVIEW-HYG-02` | **deliberately not attempted** | nothing |

**REVIEW-SEED-03/04 remain blocked, and the diagnosis is re-confirmed on this tree.** Both return
`not_found` and write nothing, because their traceability Status cells read
`Pending — measured 2026-08-28 as already satisfied by Phase 144 (…)` rather than the bare word
`Pending`, and `milestone.cjs` matches `/^(pending|gaps found)$/i` against the **trimmed whole cell**.
154-03 narrowed the block from phase-wide to row-specific; this plan confirms it is still exactly two
ids. **This is an outstanding operator decision.** Hand-editing the cell would delete the annotation
carrying the "already satisfied by Phase 144" finding — which is the substance, not decoration — so it
was not done.

**REVIEW-HYG-02 was deliberately not marked, and that is a decision, not an omission.** The plan
frontmatter declares it, and `requirements.ready-ids` returns **3/3 ready** — but that gate only
checks sibling plans in *this* phase directory, and REVIEW-HYG-02's row holds a bare `Pending`, which
the tool **would** have matched and flipped. Three measured reasons not to: its traceability row
assigns it to **Phase 152**, not 154; its own text sizes the class at **817 comment lines**
(packages 336 · apps 219 · tests 223) and this plan rewrote **one**; and the flip could only be undone
by hand-editing `REQUIREMENTS.md`, which this phase forbids. Marking it would have written a false
`Complete` that no later reader could distinguish from a true one. Registered as WINDOWS 148.

## The stale citations this phase is forbidden to fix

Left in place **on purpose**, and stated here so the phase record is unambiguous about which figures
are wrong and where the truth is.

| Document | Carries | Measured truth |
|---|---|---|
| `REQUIREMENTS.md` REVIEW-SEED-01 prose | `ElectionsGenerator.ts:58`, `answers.ts:91` | `:48`, `:77` |
| `REQUIREMENTS.md` REVIEW-SEED-03 | `resolve-template.ts:84` | `:60` |
| `REQUIREMENTS.md` REVIEW-SEED-04 | `schema.ts:194`, `:227` | `:130-144`, `:163` |
| `ROADMAP.md` Phase 154 criterion 1 + correction ¶ | `ElectionsGenerator.ts:58`, `answers.ts:91` | `:48`, `:77` |
| `ROADMAP.md` Phase 154 criterion 3 | `resolve-template.ts:84` | `:60` |
| `ROADMAP.md` Phase 154 criterion 4 | `schema.ts:194`, `:227` | `:130-144`, `:163` |
| `154-RESEARCH.md` R10 | 22 election-date file:line pairs | all shifted; file set identical |

**Every substantive claim these citations support is TRUE.** Only the offsets are wrong, and they are
wrong for one benign reason: the comment-hygiene sweep shortened the files after the figures were
taken. Every plan in this phase prohibits editing `REQUIREMENTS.md` and the ROADMAP criteria, so no
plan here *could* correct them. WINDOWS 134 and 135 registered the underlying measurements; WINDOWS
149 now names the two shared documents that still display them, so a later phase or the operator can
find them without re-deriving the list. **Navigate this package by call expression and literal, never
by line number.**

## Verification Results

| Check | Result |
|---|---|
| `yarn test:e2e` (full suite) | **150 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run**, 10.2m, exit 0 |
| E2E report payload | `{total:150, expected:150, unexpected:0, flaky:0, skipped:0, ok:true}` |
| `yarn test:unit` (root) | exit 0, 25/25 turbo tasks |
| `yarn workspace @openvaa/dev-seed test:unit` | exit 0, **580 passed across 49 files** — the phase baseline, unchanged (this plan adds no tests) |
| `yarn workspace @openvaa/dev-seed typecheck` | exit 0 |
| `yarn lint:check` | exit 0, 22/22; comment hygiene **0 violations**, i18n 0, a11y-wiring 0 |
| `yarn format:check` | exit 0, "All matched files use Prettier code style" |
| `grep -c 'latent$' packages/dev-seed/src/template/types.ts` | 0 |
| `grep -c 'trace-confirmed' .../show-feedback-survey.ts` | 0 |
| `grep -cE '^\s*// \)\.' .../show-feedback-survey.ts` | 0 |
| Non-comment `[+-]` lines at site two | 0 |
| Contamination grep on added lines | 0 |
| `git status --porcelain packages/` after task 2 | empty |

`yarn db:lint:sql` was not run — pre-existing red by construction (three named PL/pgSQL warnings, and
its failing half lints the live database rather than any working-tree file), and this plan touches no
SQL.

## Deviations from Plan

**1. [Reported — obligation discharged before the plan ran] Comment site one required no edit**

- **Found during:** Task 1, at the plan's own mandated discharge check.
- **Issue:** 152-08 (`df9e7b20b`) had already completed the stub bullet, pointing it at `./schema.ts`.
- **Fix:** none applied — the plan's backstop truth makes recording the discharge the correct action.
- **Consequence:** acceptance criterion `grep -c 'latentEmitter' == 1` is unsatisfiable without a
  duplicate diff. Recorded as met-by-discharge.
- **Registered:** WINDOWS 145.

**2. [Rule 1 — false figure in the source material] R10's 22 file:line pairs are all stale**

- **Found during:** Task 2, re-measuring before copying.
- **Issue:** the plan said "copy verbatim, do not re-grep". Every offset had moved under the sweep.
- **Fix:** the todo carries re-measured numbers plus an explicit note that R10's are superseded; the
  file set and per-file counts are shown to be identical, so R10's substance is preserved.
- **Registered:** WINDOWS 146.

**3. [Rule 1 — false premise promoted to a must-have truth] The perm-spec assertion coupling**

- **Found during:** Task 2.
- **Issue:** the plan requires recording that "several permission-scenario E2E specs may assert
  against the date". Measured: zero, in any rendering; and the frontend does not branch on it.
- **Fix:** the todo records the inherited hedge **and** the measurement refuting its mechanism, while
  preserving its conclusion through the mechanism that does hold (the perm DAG seeds these rows). The
  acceptance criterion's substance — perm E2E specs named as why a refresh is a real change — is met.
- **Registered:** WINDOWS 147.

**4. [Rule 4 — declined rather than decided] REVIEW-HYG-02 not marked complete**

- **Found during:** the requirements step.
- **Issue:** `ready-ids` reports it ready and the tool would flip it; the requirement is manifestly
  unsatisfied (817 lines vs. one) and belongs to Phase 152.
- **Fix:** not marked. Recorded here and in the ledger so it reads as a decision.
- **Registered:** WINDOWS 148.

**5. [Reported] A stale citation inside the comment being repaired**

- **Found during:** Task 1, site two.
- **Issue:** the comment cited `appContext.svelte.ts:414-437`; measured `:305-327`.
- **Fix:** the rewritten comment cites the measured range.

**Total deviations:** 2 auto-fixed (Rule 1), 3 reported. **Impact:** none on what the plan asked for.
Every one is a correction to inherited material, registered rather than absorbed — the twelfth through
sixteenth such correction across phases 152 and 154.

## Issues Encountered

**None blocking.** Two items are handed to the operator rather than decided here, both recorded above
and in the ledger:

1. **REVIEW-SEED-03/04 cannot be marked complete by the tool** — the annotation in their Status cells
   defeats `milestone.cjs`'s bare-`Pending` match. Either the tool's matcher widens, or the operator
   marks them by hand accepting the annotation's loss, or the annotation moves out of the Status cell.
   Not decidable by an executor.
2. **The stale citations in `REQUIREMENTS.md` and the ROADMAP criteria** are known-wrong and left in
   place by phase prohibition. A later phase or the operator must correct them; the table above is the
   worked list.

## Known Stubs

None. This plan introduced no placeholder, no `TODO`/`FIXME`, no skipped test, and no unrun `<verify>`.

## Threat Flags

None. The diff is one comment line in dev-only seeding code plus two planning artifacts — no runtime
surface, no network path, no input handling, no production code. Threat T-154-10 (a comment edit
accidentally changing the popup delay values the perm specs depend on) was mitigated as planned and
verified three ways: the comment-only diff assertion, the delay-value grep, and the green full suite.

## User Setup Required

None.

## Next Phase Readiness

- **Phase 154 is complete.** Its four written determinism claims are true, its two already-satisfied
  criteria are retired on re-measured evidence, its two comment sites are clean, its two declined
  follow-ups are tracked, and its E2E gate is discharged with a real run.
- **Phase 152 owns REVIEW-HYG-02's closure**, not 154. Its row is correctly still `Pending`.
- **Two operator items are queued**, both in `## Issues Encountered` above and in the ledger.
- **Standing warning for anyone working in `packages/dev-seed`:** five separate families of inherited
  line numbers in this phase's paperwork went stale under the comment-hygiene sweep, every one of them
  caught only by re-measuring. Navigate by call expression and literal. Assume any file:line citation
  written before 2026-08-29 in this package is wrong until re-grepped.

---
*Phase: 154-dev-seed-determinism-template-validation*
*Completed: 2026-08-29*

## Self-Check: PASSED

- All 3 key files present on disk and non-empty (1 modified source, 2 created todos).
- Both task commits present in `git log --oneline --all`: `22f7240ad`, `90434b4b4`. Task 3 writes no
  files by design and produces no commit.
- All plan-level `<verification>` checks re-run after the final task: `latent$` → 0,
  `trace-confirmed` → 0, both todo files exist with the exemplar's frontmatter key order, dev-seed
  `test:unit` exit 0, dev-seed `typecheck` exit 0, root `test:unit` exit 0, `lint:check` exit 0,
  `format:check` exit 0, `test:e2e` 150 passed with counts recorded.
- Task acceptance criteria: Task 1, 8 of 9 pass; the ninth (`latentEmitter` count) is unsatisfiable by
  discharge and is documented, not silently skipped. Task 2, 10 of 10 pass. Task 3, 7 of 7 pass.
- `REQUIREMENTS.md` untouched — `git status --porcelain` on it empty after every tool call.
- Dev server stopped; 0 listeners on port 5173.
