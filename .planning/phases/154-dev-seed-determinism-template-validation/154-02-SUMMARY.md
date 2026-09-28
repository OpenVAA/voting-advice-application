---
phase: 154-dev-seed-determinism-template-validation
plan: 02
subsystem: testing
tags: [dev-seed, zod, template-validation, vitest, negative-control, characterization]

# Dependency graph
requires:
  - phase: 144-dev-seed-template-validation
    provides: "`validateTemplate`, the built-in branch's `return validateTemplate(builtIn)`, and `assertFixedRowsCarryExternalId` — all three already on the tree, which is why this plan confirms rather than implements"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "the standing `assert:comment-hygiene` gate every comment here passes, and the file shortening that invalidated every line number this plan inherited"
provides:
  - "A parity case asserting the built-in and filesystem entry paths reject the same drifted template with the SAME message — the equivalence half of criterion 3, which no prior case asserted"
  - "The negative control criterion 4 explicitly demands: `TemplateSchema.safeParse(bad).success === true` beside `validateTemplate(bad)` throwing, expressing the pre-hardening behaviour without source archaeology"
  - "Absent and empty-string `external_id` as two separately asserted inputs against the full field path"
  - "A committed, flip-tested measurement of the whitespace-only `external_id` boundary"
affects: [154-04 (files the whitespace todo), ship-time criteria 3 and 4 review]

actuals:
  tokens: 1141
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Negative control by seam-straddling rather than archaeology: assert the LOWER authority accepts and the COMPOSED authority rejects, using two symbols that are both already exported"
    - "Message-EQUALITY assertion across two entry paths, where the pre-existing cases only asserted each path throws"

key-files:
  created: []
  modified:
    - "packages/dev-seed/tests/cli/resolve-template.test.ts — +23/-0, one added case"
    - "packages/dev-seed/tests/template.test.ts — +29/-1, one widened import and three added cases"

key-decisions:
  - "Criteria 3 and 4 are recorded as RETIRED ON EVIDENCE. No production behaviour was changed and none was claimed; the guards were already shipped by an earlier phase."
  - "Every inherited line-number citation for criteria 3 and 4 is wrong on the measured tree — a fourth stale-figure family after the three 154-01 corrected. Measured values used; the inherited literals appear in this SUMMARY only inside correction sentences."
  - "The whitespace-only `external_id` boundary is CHARACTERIZED, not changed. Filed as todo slug `dev-seed-whitespace-only-external-id-accepted`."
  - "All four new assertions were flip-tested RED before being trusted, including one flip that disables the production guard to prove the negative control straddles the real seam."
  - "The full E2E suite was NOT run. Declined by a named, re-proved zero-runtime-surface route, not by assumption. Registered in WINDOWS.md."

patterns-established:
  - "When a criterion is already satisfied by shipped code, discharge it by citing the shipped construct AND adding only the one assertion its wording asks for that nothing asserts — never a fourth near-duplicate of an existing regression case."

requirements-completed: [REVIEW-SEED-03, REVIEW-SEED-04]

coverage:
  - id: D1
    description: "Built-in and filesystem entry paths produce the SAME validation failure for the same drifted template — the equivalence claim in criterion 3, which the three pre-existing cases did not assert"
    requirement: REVIEW-SEED-03
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/cli/resolve-template.test.ts#built-in and filesystem entry paths reject the same drifted template identically"
        status: pass
      - kind: other
        ref: "flip-test A: give the built-in a different unknown key => RED on the equality assertion. flip-test B: drop the unknown key entirely => RED, 'expected \\'\\' to match /Unrecognized key/'"
        status: pass
    human_judgment: false
  - id: D2
    description: "The schema layer alone accepts a `fixed[]` row with no `external_id` while `validateTemplate` rejects it with a full field path — the negative control criterion 4 demands"
    requirement: REVIEW-SEED-04
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template.test.ts#a fixed row with no external_id is accepted by the schema layer alone and rejected by validateTemplate"
        status: pass
      - kind: other
        ref: "flip-test: comment out assertFixedRowsCarryExternalId in src => both rejection cases RED ('expected [Function] to throw an error') while the safeParse half stays GREEN. flip-test: add an unknown fragment key => RED, 'expected false to be true'"
        status: pass
    human_judgment: false
  - id: D3
    description: "An empty-string `external_id` is rejected with the same field path — the other half of the guard's two-part disjunction, asserted separately rather than assumed to follow"
    requirement: REVIEW-SEED-04
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template.test.ts#a fixed row with an empty-string external_id is rejected with the same field path"
        status: pass
    human_judgment: false
  - id: D4
    description: "A whitespace-only `external_id` is accepted today — the boundary of what the guard means by non-empty, pinned as a measurement rather than changed"
    requirement: REVIEW-SEED-04
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template.test.ts#boundary: a whitespace-only external_id is currently accepted"
        status: pass
      - kind: other
        ref: "flip-test: substitute the empty string for the three spaces => RED, 'expected [Function] to not throw an error'"
        status: pass
    human_judgment: false
  - id: D5
    description: "No production file under packages/dev-seed/src/ is modified by this plan"
    verification:
      - kind: command
        ref: "git diff --stat e839d5658..HEAD -- packages/dev-seed/src/ => empty; git diff --name-only e839d5658..HEAD => exactly the two test files"
        status: pass
    human_judgment: false

duration: 11 min
completed: 2026-08-29
status: complete
---

# Phase 154 Plan 02: Confirm Criteria 3 and 4 on Evidence Summary

**Criteria 3 and 4 are retired on evidence rather than implemented: the guards they ask for already ship, this plan cites them by measured file:line and adds only the four assertions their wording asks for that nothing asserted — one message-equality parity case across the two loader entry paths, the owed schema-versus-validator negative control, the empty-string half of the guard's disjunction, and a characterization of the whitespace-only boundary — with every one of them flip-tested RED before being trusted.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-08-29T03:47:00Z
- **Completed:** 2026-08-29T03:58:00Z
- **Tasks:** 3
- **Files modified:** 2 (both under `packages/dev-seed/tests/`)

## Retired on evidence

Both criteria were satisfied on the tree before this phase began. **This plan changed no behaviour, and nothing here claims that this phase added built-in template validation or added the `external_id` requirement.** Both were landed by the earlier validation-hardening work; what this plan contributes is cited, re-run evidence plus the assertions that were genuinely missing.

### Criterion 3 — built-in / filesystem validation parity

- `packages/dev-seed/src/cli/resolve-template.ts` line **60** reads `return validateTemplate(builtIn);`. Confirmed live and unmodified: `grep -c "return validateTemplate(builtIn);"` returns `1`.
- All three loader branches converge on `validateTemplate`: the JSON branch through `loadJsonTemplate` (`return validateTemplate(raw);`), the module branch through `loadModuleTemplate` (`return validateTemplate(candidate);`), and the built-in branch at line 60. There is no fourth path.
- The failure both paths hit is produced by the `.strict()` that closes `TemplateSchema` (`packages/dev-seed/src/template/schema.ts`, the `.extend({ latent: … }).strict()` chain at lines 114-115).
- The committed regression guard is the block of cases spanning **lines 105-135** of `packages/dev-seed/tests/cli/resolve-template.test.ts`: `throws for a built-in carrying an unknown top-level key (was returned unvalidated)`, `a valid built-in still resolves, unchanged in substance`, `the "Unknown template:" path is unchanged by the added validation`, and the registry-iterating `every registered built-in passes the strict schema`.
- **Re-run output:** `yarn workspace @openvaa/dev-seed vitest run tests/cli/resolve-template.test.ts` → exit 0, `20 passed (20)` (19 pre-existing plus the one added here).

**Criterion 3 is RETIRED ON EVIDENCE.** What it asked for that no case asserted — that the two entry paths fail *identically* — is now committed as exactly one case.

### Criterion 4 — `fixed[]` rows require a non-empty `external_id`

- `assertFixedRowsCarryExternalId` is declared at `packages/dev-seed/src/template/schema.ts` lines **130-144**; its non-empty test is the disjunction `typeof externalId !== 'string' || externalId === ''` at line **138**, and it pushes `  template.${slot}.fixed[${index}].external_id: Expected a non-empty string` at line 139.
- It is called unconditionally on the success path from `validateTemplate` at line **163**, immediately after `TemplateSchema.safeParse(input)` at line 158.
- Both remain unmodified: `grep -c "assertFixedRowsCarryExternalId" packages/dev-seed/src/template/schema.ts` returns `2` (declaration plus call site), and `git diff --stat -- packages/dev-seed/src/` is empty.
- **Re-run output:** `yarn workspace @openvaa/dev-seed vitest run tests/template.test.ts` → exit 0, `18 passed (18)` (15 pre-existing plus the three added here).

**Criterion 4 is RETIRED ON EVIDENCE.** What was genuinely still owed — the negative control — is now committed and executable.

### Measured corrections to every inherited citation for these two criteria

This is a **fourth family of stale inherited figures**, after the three 154-01 corrected. The
cause is the same: the comment-hygiene sweep shortened these files, so every line number written
before it is off by a large constant. **The substance holds in every case** — each cited construct
exists and behaves exactly as described. Only the coordinates are wrong.

| Inherited citation (appears in this plan, RESEARCH, REQUIREMENTS.md and ROADMAP.md) | Measured on this tree |
|---|---|
| `packages/dev-seed/src/cli/resolve-template.ts:84` | `:60` — the file is 111 lines |
| `packages/dev-seed/tests/cli/resolve-template.test.ts:115-130` | `:105-135` — the file was 157 lines before this plan |
| `packages/dev-seed/src/template/schema.ts:194` (the guard) | `:130-144`, its condition at `:138` |
| `packages/dev-seed/src/template/schema.ts:227` (the call) | `:163` |
| `schema.ts:120-164` (`TemplateSchema`) | `:85-115` |
| `tests/template.test.ts:20-56` (throw idiom) / `:126-138` (round-trip idiom) | `:17-52` / `:113-122` — the file was 123 lines |

Two of these inherited pairs (`resolve-template.ts:84`, and `schema.ts:194` with `:227`) are
embedded in **`REQUIREMENTS.md` REVIEW-SEED-03/04 and ROADMAP.md criteria 3 and 4**. Neither file
was edited here — this phase's plans state that nobody edits them in this phase. The correction is
registered in `.planning/WINDOWS.md` instead. **Anyone navigating to these constructs must navigate
by call expression or case name, never by line number.**

The PATTERNS excerpts for these files also quote case names with `D-07:` / `TMPL-` prefixes that the
hygiene sweep already stripped; the cases were located by content, which is why the citations above
are case names rather than ranges.

## Accomplishments

- **The equivalence half of criterion 3 is closed with exactly one case, not a fourth duplicate.** `built-in and filesystem entry paths reject the same drifted template identically` builds one drifted shape through an intermediate variable (excess property checking is a fresh-object-literal rule, so the variable is what reproduces the real failure mode), resolves it as an injected built-in and again from a temp JSON file, and asserts the two rejection messages are EQUAL — after asserting each matches `/Unrecognized key/`, so the equality cannot pass on two empty strings.
- **Criterion 4's owed negative control is committed and executable.** `TemplateSchema.safeParse(badRow).success` is asserted `true` — the zod layer alone accepts a `fixed[]` row with no `external_id`, which is precisely the pre-hardening behaviour — while `validateTemplate(badRow)` throws against the full field path `template.elections.fixed[0].external_id: Expected a non-empty string`. Both symbols were already exported; no archaeology, no test-only export, no source change.
- **Absent and empty-string are covered as two distinct inputs.** They reach the same branch through different halves of the `typeof … !== 'string' || … === ''` disjunction, so a single case would exercise only one half.
- **The whitespace boundary is a stated measurement, not an assumption.** `boundary: a whitespace-only external_id is currently accepted` pins that three spaces PASS today, and round-trips the value.
- **Nothing under `packages/dev-seed/src/` was touched** across the whole plan.

## Flip-tests — every new assertion driven RED before being trusted

A gate that examines nothing also reports green. Five flips, each confirmed RED on the intended
assertion, each undone only after the relevant work was already committed.

| Flip | Injection | Observed |
|---|---|---|
| Parity, equality half | Give the built-in a *different* unknown key from the file's | RED — `expected 'Template validation failed:\n  templa…' to deeply equal 'Template validation failed:\n  templa…'` |
| Parity, anti-vacuity half | Drop the unknown key entirely, so both paths resolve | RED — `expected '' to match /Unrecognized key/` |
| Negative control, guard half | Comment out `assertFixedRowsCarryExternalId(result.data);` in `src/template/schema.ts` | RED on **both** rejection cases — `expected [Function] to throw an error` — while the `safeParse` half stayed **GREEN**, which is exactly the pre-hardening statement the control encodes |
| Negative control, schema half | Add an unknown fragment key so zod itself rejects | RED — `expected false to be true` |
| Whitespace boundary | Substitute `''` for the three spaces | RED — `expected [Function] to not throw an error but 'Error: Template validation failed:…' was thrown` |

The third flip is the load-bearing one: it proves the negative control straddles the real seam
between the two authorities rather than restating one of them twice. The `src/` file was restored
with `git checkout --` and re-verified (`git status --short -- packages/dev-seed/src/` empty,
`grep -c "assertFixedRowsCarryExternalId"` back to `2`) — safe only because the file was committed
and unmodified at the time of the injection.

## Task Commits

1. **Task 1: parity case for the two loader entry paths** — `188bb9435` (test)
2. **Task 2: the owed `external_id` negative control plus the absent/empty-string pair** — `42fde6df7` (test)
3. **Task 3: whitespace-only boundary characterization** — `17e8295ed` (test)

## Files Created/Modified

- `packages/dev-seed/tests/cli/resolve-template.test.ts` — +23/−0. One case appended after the registry-iterating case, with a one-line present-tense comment. No existing case, fixture or comment altered.
- `packages/dev-seed/tests/template.test.ts` — +29/−1. The single deleted line is the import, widened from `import { validateTemplate }` to `import { TemplateSchema, validateTemplate }`. Three cases appended at the end of the `describe`, with a two-line and a two-line comment.

## Verification Results

| Check | Result |
|---|---|
| `yarn workspace @openvaa/dev-seed vitest run tests/cli/resolve-template.test.ts` | exit 0, **20 passed** (19 + 1) |
| `yarn workspace @openvaa/dev-seed vitest run tests/template.test.ts` | exit 0, **18 passed** (15 + 3) |
| `yarn workspace @openvaa/dev-seed test:unit` | exit 0, **578 passed across 49 files** (574 + 4) |
| `yarn workspace @openvaa/dev-seed typecheck` | exit 0 (run after each task) |
| `yarn test:unit` (root) | exit 0, 25/25 turbo tasks successful |
| `yarn lint:check` | exit 0, 22/22 tasks; comment hygiene **0 violations**, i18n 0, a11y-wiring 0 |
| `yarn prettier --check` on both changed files | clean |
| `git diff --stat e839d5658..HEAD -- packages/dev-seed/src/` | **empty** |
| `git diff --name-only e839d5658..HEAD` | exactly the two test files |

Grep criteria: `TemplateSchema` in `tests/template.test.ts` → 3 (≥2 required); `safeParse` → 1;
`external_id: Expected a non-empty string` → 2; `assertFixedRowsCarryExternalId` in `src/template/schema.ts` → 2;
`return validateTemplate(builtIn);` → 1; contamination pattern on added lines in both files → **0**;
`: any` / `as any` on added lines → **0**.

**Test-count arithmetic.** The plan's Task 3 criterion asks for ≥573 on a stated baseline of 569.
Both figures are stale: 154-01 measured the pre-phase baseline at 570 and left the package at **574**
after its four cases. This plan adds four more, giving **578**. The criterion clears either way; the
arithmetic here is against the measured 574.

The 15 `unused-imports/no-unused-vars` warnings `yarn lint:check` reports for `@openvaa/dev-seed`
are all in `src/` files this plan did not touch. Pre-existing and out of scope — not fixed, not
absorbed.

## Decisions Made

- **Confirmed rather than implemented, and said so in the record.** The temptation this plan exists to resist is writing a green tick for a criterion already satisfied by shipped code. Both criteria are discharged by a NAMED route — a cited construct plus a re-run command plus a flip-test — rather than by inspection.
- **Added exactly what was missing, and nothing that was already present.** Criterion 3 got one case, because three regression cases plus a registry-iterating case already prove each path throws; only the equivalence was unasserted. A fourth near-duplicate would have inflated the count without adding a fact.
- **The negative control expresses the old behaviour without reconstructing it.** The pre-hardening validator body *was* `safeParse` alone, and both `TemplateSchema` and `validateTemplate` are already exported — so the control is a live executable statement rather than a historical claim, with no git archaeology and no test-only export.
- **The whitespace-only boundary is characterized, NOT changed.** Nothing agreed covers tightening the guard, the value is functional downstream (the bulk-upsert requirement is non-emptiness, which a whitespace string satisfies), and widening the guard in a phase whose brief is date determinism plus confirmation would be scope creep. Handed on as todo slug **`dev-seed-whitespace-only-external-id-accepted`** for the todo-filing plan, and registered in `WINDOWS.md` so it is visible at ship time rather than living only in a code comment.
- **Two acceptance criteria demanded literal citations that are false on this tree.** Reported rather than engineered around: each inherited literal appears above only inside a correction sentence naming the measured location beside it, so no false claim is asserted. Registered in `WINDOWS.md` as a deviation alongside the measurement itself.

## Deviations from Plan

**1. [Reported, not auto-fixed] Four inherited citations in the plan's own acceptance criteria are wrong on the measured tree**

- **Found during:** Task 1 (`resolve-template.ts:84`) and Task 2 (`schema.ts:194`, `:227`), plus the test-file ranges throughout.
- **Issue:** Task 1's criteria require the SUMMARY to contain the literal strings `packages/dev-seed/src/cli/resolve-template.ts:84` and `packages/dev-seed/tests/cli/resolve-template.test.ts:115-130`, and the `<output>` block additionally requires `packages/dev-seed/src/template/schema.ts:194` and `:227`. All four point at the wrong lines. Asserting them as true would have written four false citations into the permanent record.
- **Fix:** Not engineered around. Every inherited literal is reproduced above **inside a correction sentence** that names the measured location beside it, so the string-match criterion is met while every claim the SUMMARY asserts is a measured one. `REQUIREMENTS.md` and `ROADMAP.md`, which carry the same wrong pairs, were deliberately NOT edited — this phase's plans state nobody edits them here.
- **Files modified:** none (documentation-only resolution).
- **Verification:** each measured line number re-read from the file in this session; `grep -n` used for the two `return validateTemplate(builtIn);` and `assertFixedRowsCarryExternalId` anchors.
- **Registered:** `.planning/WINDOWS.md` — one `unmet-truth` entry with the full correction table, one `deviation` entry for the criteria themselves.

**2. [Reported] The plan's Task 3 test-count baseline is stale**

- **Found during:** Task 3.
- **Issue:** the criterion reads "at least 573 passing tests (baseline 569 plus the four cases added by this plan)". 154-01 already measured the pre-phase baseline at 570 and left the package at 574.
- **Fix:** the corrected arithmetic is used throughout — 574 + 4 = **578 measured**. The criterion clears on either figure, so no outcome changes.

**Total deviations:** 0 auto-fixed, 2 reported. **Impact:** none on behaviour; both are corrections to inherited bookkeeping, registered rather than absorbed.

## Issues Encountered

**The full E2E suite was not run, and that is a decision by a named route rather than an omission.**
CLAUDE.md's cardinal rule forbids proceeding while any E2E test fails. The zero-runtime-surface
proof 154-01 used was **re-proved on this plan's own diff**, not carried over:

- the plan's `<verification>` block does not list E2E;
- the entire plan diff is two vitest unit-test files — `git diff --name-only e839d5658..HEAD` returns exactly `packages/dev-seed/tests/cli/resolve-template.test.ts` and `packages/dev-seed/tests/template.test.ts`, and `git diff --stat -- packages/dev-seed/src/` is empty;
- nothing imports either file — `grep -rn "resolve-template.test|template.test" packages apps tests` returns only prose mentions in comments and two temp-filename string literals;
- `@openvaa/dev-seed` is not a dependency of `apps/frontend` (`grep -c "dev-seed" apps/frontend/package.json` → 0); the package is reachable only from the root `db:seed` scripts.

Root `yarn test:unit` (exit 0) and `yarn lint:check` (exit 0) were both run in full. Disk headroom
is 150 GiB, so the ENOSPC hazard did not drive this. Registered in `WINDOWS.md` as an `unrun-verify`.

**`yarn db:lint:sql` was not run.** It is pre-existing red by construction (its failing half lints
the live database and reads no working-tree file) and this plan touches no SQL.

## User Setup Required

None.

## Next Phase Readiness

- **154-03 (the determinism fix) is unaffected by this plan.** No file under `packages/dev-seed/src/` was modified, so the fix plan's territory is untouched and the two negative controls it must invert are exactly as 154-01 left them.
- **154-04 (todo filing) has one handoff from here:** file the pending todo with slug **`dev-seed-whitespace-only-external-id-accepted`**, recording that `validateTemplate` accepts an `external_id` of only whitespace because the guard's check is a raw string-length test rather than a trimmed one, that the boundary is pinned by the committed case `boundary: a whitespace-only external_id is currently accepted`, and that tightening it is a separate unmade decision.
- **Anyone touching criteria 3 or 4 downstream must use the corrected coordinates** in the table above, or navigate by call expression / case name. `REQUIREMENTS.md` REVIEW-SEED-03/04 and ROADMAP.md criteria 3 and 4 still carry the wrong pairs by design.

## Open question for the operator — `REQUIREMENTS.md` could not be marked complete

`requirements mark-complete REVIEW-SEED-03 REVIEW-SEED-04` returned `not_found` for **both** ids and
wrote nothing. The cause is diagnosed, not guessed:

- The traceability Status cells for these two rows read `Pending — measured 2026-08-28 as already satisfied by Phase 144 (…)` rather than the bare word `Pending`.
- `bin/lib/milestone.cjs` gates the row write on `/^(pending|gaps found)$/i` against the **trimmed whole cell**, so an annotated cell never matches.
- Because a row EXISTS for the id but rejects the write, the tool then deliberately **rolls the checkbox flip back** (its `#2788 defect 2` behaviour, which exists to stop the checkbox and the row diverging) and reports the id as `not_found`.

Both surfaces are therefore still `Pending` on disk. **Not hand-edited**, for two reasons: this
phase's plans state that nobody edits `REQUIREMENTS.md` here, and rewriting the Status cell to a bare
`Complete` would delete the annotation that carries the "already satisfied by earlier work" finding —
which is the very fact this plan exists to confirm.

The condition is wider than these two ids: `REQUIREMENTS.md` has not been modified since `fee77f596`
(the phase-152 close), so **REVIEW-SEED-02 is also still unticked** despite 154-01 recording it as
completed in its own frontmatter.

**The ruling needed:** either (a) normalise the two annotated Status cells to a bare `Pending`,
moving the annotation into the requirement text where the other corrected requirements keep theirs,
and re-run `mark-complete`; or (b) tick REVIEW-SEED-02/03/04 by hand at phase close. Registered in
`.planning/WINDOWS.md` so it is visible at ship time rather than only here.

---
*Phase: 154-dev-seed-determinism-template-validation*
*Completed: 2026-08-29*

## Self-Check: PASSED

- `packages/dev-seed/tests/cli/resolve-template.test.ts` — present on disk.
- `packages/dev-seed/tests/template.test.ts` — present on disk.
- `.planning/phases/154-dev-seed-determinism-template-validation/154-02-SUMMARY.md` — present on disk.
- Commits `188bb9435`, `42fde6df7`, `17e8295ed` — all present in `git log --oneline`.
- All task `<acceptance_criteria>` re-run after the final task: every criterion passes, with the two
  literal-citation criteria discharged per Deviation 1 and the test-count criterion on the corrected
  baseline per Deviation 2. Plan-level `<verification>` re-run: all six checks green.
