---
phase: 159-component-context-consolidation
plan: 09
subsystem: ui
tags: [svelte5, component-extraction, multilingual, localized-string, input, vitest]

requires:
  - phase: 159-component-context-consolidation
    provides: "159-03's committed effect census, whose row 15 classified Input.svelte's select-multiple effect as NOT convertible — the reason that effect stayed in Input.svelte rather than moving into the extracted part"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "the comment-hygiene guard wired into yarn lint:check, and the unwrap instrument its rule 2 was lifted from"
provides:
  - "src/lib/components/input/parts/ — four extracted complex branches with co-located prop contracts, deliberately absent from the package barrel"
  - "Two new members of the public Input kind union: multiple-text and multiple-text-multilingual"
  - "Input.svelte.test.ts — a seven-case component test pinning the multi-text emission contract"
  - "An element-wise arm in parseAnswers so a collection of localized strings resolves to the reading locale"
affects: [159-11, any phase touching Input.svelte or candidate info-question answers]

actuals:
  tokens: 42800
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Markup-branch extraction: a branching parent keeps its script (state, effects, value handling) and delegates only markup to co-located parts, so a committed classification of an effect keeps its file"
    - "One uniform internal row shape for a value that is plain in one mode and per-locale in another, so emptiness, ordering and emission are decided by one rule rather than two that can drift"
    - "A single mount seam in a component test, so the case bodies stay byte-identical while the component under test is absorbed into another"

key-files:
  created:
    - apps/frontend/src/lib/components/input/parts/MultipleTextPart.svelte
    - apps/frontend/src/lib/components/input/parts/MultipleTextPart.type.ts
    - apps/frontend/src/lib/components/input/parts/MultilingualTextPart.svelte
    - apps/frontend/src/lib/components/input/parts/MultilingualTextPart.type.ts
    - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.svelte
    - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.type.ts
    - apps/frontend/src/lib/components/input/parts/ImagePart.svelte
    - apps/frontend/src/lib/components/input/parts/ImagePart.type.ts
    - apps/frontend/src/lib/components/input/parts/README.md
    - apps/frontend/src/lib/components/input/Input.svelte.test.ts
  modified:
    - apps/frontend/src/lib/components/input/Input.svelte
    - apps/frontend/src/lib/components/input/Input.type.ts
    - apps/frontend/src/lib/components/input/QuestionInput.svelte
    - apps/frontend/src/lib/components/input/index.ts
    - apps/frontend/src/lib/components/input/shared.ts
    - apps/frontend/src/lib/api/utils/parseAnswers.ts

key-decisions:
  - "The extraction is of MARKUP branches, not of script logic. 159-03's committed effect census classifies Input.svelte's select-multiple effect as not convertible; moving it into the extracted part would have staled that classification's file, so the effect stayed and the part receives the derived option lists as props."
  - "Enumeration chosen for the reviewer's 'other complex types': the multilingual text stack, the select-multiple dropdown-plus-chips, and the image input. The single-language textarea and the row of simple inputs stay inline — extracting a single element adds indirection without removing size."
  - "The plain multiple-text kind landed one task earlier than planned, because deleting the standalone component and keeping typecheck green cannot both hold otherwise."
  - "Rows are held internally in one locale-keyed shape in both modes, with a private empty-string key for the plain mode, so the trim rule that decides emptiness is written once."
  - "parseAnswers gained an element-wise arm. Without it the feature is silent data loss, which is a correctness requirement rather than scope creep."

patterns-established:
  - "Extracted-part directory with its own README stating why it is absent from the barrel, so the asymmetry with a sibling public package is not rediscovered as a bug"
  - "Re-anchoring a same-phase artifact's drifted line citation with a dated clause rather than a silent overwrite, per 159-08's precedent"

requirements-completed: [REVIEW-CMP-02]

coverage:
  - id: D1
    description: "The multi-text emission contract is pinned by seven component cases: duplicates survive, whitespace rows are dropped, an absent value emits an empty collection rather than one holding an empty string, a single row behaves like many, order is the authored order, one field renders per locale per row, and a locale switch neither reorders nor drops a row."
    requirement: REVIEW-CMP-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/components/input/Input.svelte.test.ts (7 cases; 5 green / 2 red before the extraction, 7 green after)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Four complex branches live in co-located part components with documented prop contracts; the standalone multi-text component is absorbed and deleted along with its two barrel entries; the parts stay out of the public barrel."
    requirement: REVIEW-CMP-02
    verification:
      - kind: other
        ref: "ls parts/*.svelte | wc -l -> 4; ls parts/*.type.ts | wc -l -> 4; ls MultipleTextInput.svelte | wc -l -> 0; grep -c MultipleTextInput index.ts -> 0; grep -c 'parts/' index.ts -> 0"
        status: pass
      - kind: other
        ref: "wc -l < Input.svelte -> 540 (criterion: strictly smaller than 692)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend build -> exit 0 (the check 159-08's @reference regression proved typecheck and unit cannot substitute for)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A multi-text row renders one editable field per supported locale and emits a per-locale value carrying only the locales actually written, with no de-duplication, sorting, case folding or Unicode normalization introduced."
    requirement: REVIEW-CMP-02
    verification:
      - kind: unit
        ref: "Input.svelte.test.ts#renders one editable field per supported locale for each row and emits a per-locale value"
        status: pass
      - kind: other
        ref: "grep -rc 'normalize(\\|toLowerCase()\\|new Set(' parts/ | grep -v ':0$' | wc -l -> 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The sole consumer's four-part type-level workaround is deleted — the record-key exclusion, the exclusion cast, the derived guard and the dedicated dispatch branch — and the type checker enforces that they went together."
    requirement: REVIEW-CMP-02
    verification:
      - kind: other
        ref: "grep -c 'Exclude<QuestionType' QuestionInput.svelte -> 0; grep -c isMultipleText -> 0; grep -c MultipleTextInput -> 0"
        status: pass
      - kind: other
        ref: "yarn typecheck -> exit 0, svelte-check 0 errors 0 warnings"
        status: pass
    human_judgment: false
  - id: D5
    description: "A candidate's multipleText answer survives the round trip end to end under the new stored shape: written per locale on the profile page, persisted, read back and rendered in the preview."
    requirement: REVIEW-CMP-02
    verification: []
    human_judgment: true
    rationale: "No E2E run. This is the phase's only plan that changes runtime behaviour — a multipleText question is now promoted to the multilingual kind, so its stored answer shape changes from a flat collection to a collection of localized strings. The change is reasoned safe by construction and every reachable unit check is green, but the round trip crosses persistence and two translation seams that no unit test spans. 159-CONTEXT O5 budgets the single full-suite run at 159-11; that run is where the cardinal-rule evidence must come from. Filed in the defect ledger."
  - id: D6
    description: "A stored collection of localized strings is resolved to the reading locale element-wise, so a multilingual row list does not read back empty."
    verification: []
    human_judgment: true
    rationale: "The arm in parseAnswers has no test of its own. Its absence is silent data loss with no error anywhere, so it is the highest-consequence line in the plan and the least directly proven. A human should decide whether it wants a unit test before 159-11's E2E run rather than after."

duration: 30 min
completed: 2026-09-03
status: complete
---

# Phase 159 Plan 09: Absorbing the multi-text input and landing multilingual rows — Summary

**`Input`'s four complex markup branches extracted into co-located parts, the standalone multi-text component absorbed and deleted, a `multiple-text-multilingual` kind added so each row behaves like a normal multilingual text item, and the sole consumer's four-part type-level apology deleted under a green type checker.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-03T05:41:00Z
- **Completed:** 2026-09-03T06:11:00Z
- **Tasks:** 3
- **Files modified:** 24 (10 created, 2 renamed, 12 modified)

## Accomplishments

- A seven-case component test written FIRST, five green against unmodified source and two red, and the five stayed green through the extraction — which is what makes them an equivalence proof rather than a description of whatever the new code does.
- Four extracted parts with co-located prop contracts. `Input.svelte` 674 → 540 lines; the plan's ceiling of 692 was never in danger, and the ceiling itself turned out to be a stale figure (see below).
- Multilingual multi-text landed in the same change, per D-H2's explicit rejection of the option that deferred the consolidation.
- All four workaround constructs in `QuestionInput.svelte` deleted together, with `yarn typecheck` as the enforcement.
- A read-path arm added to `parseAnswers` that the plan did not name and without which the whole feature is silent data loss.

## Task Commits

1. **Task 1: lock the value semantics, state the multilingual gap** — `7bba1305c` (test)
2. **Task 2: extract the four complex branches into co-located parts** — `c2665b117` (refactor)
3. **Task 3: land multilingual multi-text, delete the consumer's apology** — `b7bec6208` (feat)
4. **Residuals: census re-anchoring + defect ledger** — `6469c8996` (docs)

## Task 1 — both outputs, recorded verbatim

The plan asks for both runs on record. Against **unmodified** source, with the mount seam pointed at the standalone component:

```
 ❯ src/lib/components/input/Input.svelte.test.ts (7 tests | 2 failed) 60ms
   ✓ multi-text value semantics > keeps two rows whose trimmed content is identical — nothing is de-duplicated 25ms
   ✓ multi-text value semantics > drops a row containing only whitespace 8ms
   ✓ multi-text value semantics > emits an empty collection for an absent value, never a collection holding an empty string 4ms
   ✓ multi-text value semantics > treats a single-row value exactly like a multi-row one 3ms
   ✓ multi-text value semantics > emits rows in the authored order 8ms
   × multi-text multilingual > renders one editable field per supported locale for each row and emits a per-locale value 6ms
     → expected a control matching [data-testid="multilingual-toggle"] to be rendered: expected null not to be null
   × multi-text multilingual > does not reorder rows or drop a row that is empty in the newly displayed locale 6ms
     → expected [ Array(2) ] to deeply equal [ 'first', 'second' ]

 Test Files  1 failed (1)
      Tests  2 failed | 5 passed (7)
```

Exactly five green and exactly two red, as the acceptance criterion requires. The two reds fail for the right reasons and not for a shared incidental one: the first because the standalone component renders no translation toggle at all, the second because its rows are plain strings, so a localized row stringifies to `[object Object]` in the field.

After Task 3, with the seam pointed at `Input` and the multilingual kind in place:

```
 ✓ src/lib/components/input/Input.svelte.test.ts (7 tests) 77ms
 Test Files  1 passed (1)
      Tests  7 passed (7)
```

**The seam is one helper, on purpose.** `mountSubject` is the only line that moved between Task 1 and Task 2; all seven `it()` bodies are byte-identical across the extraction commit. Had the cases named the component directly, "the tests still pass" would have meant "the tests were rewritten to pass".

## The enumeration chosen for "the other complex types"

Stated here so the operator can correct it cheaply, as the plan asks. `Input.svelte`'s markup is a five-branch ladder. Three of the five are complex and were extracted; two are single-element and stayed inline:

| Branch (verbatim comment, at the base commit) | Line measured | Disposition |
|---|---:|---|
| `<!-- 1. Multilingual text inputs and textareas -->` | 388 | **extracted** → `MultilingualTextPart` |
| `<!-- 2. Single-language textareas -->` | 449 | stays inline |
| `<!-- 3. Select multiple -->` | 464 | **extracted** → `SelectMultiplePart` |
| `<!-- 4. Image input -->` | 522 | **extracted** → `ImagePart` |
| `<!-- 5. Other single-row inputs -->` | 578 | stays inline |

Plus the absorbed standalone component as a fourth peer, `MultipleTextPart`. The reasoning for the two that stayed: extracting a single `<textarea>` or a three-way `{#if}` over `<input>` types moves lines between files without reducing the size the decision was about, and adds a prop contract for each.

**The extraction is of MARKUP, not of script.** The parts render branches and report intent; `Input` keeps the value, the error state, the loading flag and the derived option lists. This is not a stylistic preference: 159-03's committed effect census, row 15, classifies `Input.svelte`'s select-multiple `$effect` as NOT convertible and records why. Moving it into `SelectMultiplePart` would have relocated a classified effect out of the file its classification names. It stayed.

## The four deleted workaround constructs

Criterion 2's completion signal, all four gone in one commit and all four enforced by the type checker:

| # | Construct | Where it was | Now |
|---|---|---|---|
| 1 | `Exclude<QuestionType, typeof QUESTION_TYPE.MultipleText>` in the record's key type | `QuestionInput.svelte:38` | `Record<QuestionType, InputProps['type']>` with a `MultipleText` entry |
| 2 | `as Exclude<QuestionType, …>` cast on the map lookup | `QuestionInput.svelte:63` | `INPUT_TYPES[question.type]`, uncast |
| 3 | the `isMultipleText` derived guard | `QuestionInput.svelte:59` | deleted |
| 4 | the `{#if isMultipleText}` dispatch branch and its `multipleTextProps` derivation | `QuestionInput.svelte:120-125, 139-146` | one `<Input {...allProps} />` |

Measured at final HEAD: `grep -c 'Exclude<QuestionType'` → 0, `grep -c 'isMultipleText'` → 0, `grep -c 'MultipleTextInput'` → 0, `yarn typecheck` exit 0.

The promotion ladder gained one line beside the two that were already there, on the same condition:

```ts
if (t === 'text') t = 'text-multilingual';
else if (t === 'textarea') t = 'textarea-multilingual';
else if (t === 'multiple-text') t = 'multiple-text-multilingual';
```

## Value semantics under multilingual rows

Rows are held internally in ONE shape in both modes — a record keyed by locale, with a private empty-string key standing in for the plain mode. That is what lets the trim rule be written once:

- A row survives when ANY locale is non-empty, and carries only the locales that are. So a row written in Finnish and empty in the displayed English is never dropped — the case T-159-29 names, and case 7's assertion.
- Nothing is de-duplicated, sorted, case-folded or normalized. The negative scan over the parts directory returns 0.
- Emitted strings are the raw field values; only the filter uses `trim()`, exactly as the standalone did.
- A plain string arriving in multilingual mode is read as the displayed locale's text. This is not a nicety: every multipleText answer already in the database is a flat collection of plain strings, and without this arm each one would have been spread character-by-character into a bogus localized object.

## Files Created/Modified

- `parts/MultipleTextPart.svelte` + `.type.ts` — the absorbed row list, now multilingual. The contract module is the standalone component's, moved.
- `parts/MultilingualTextPart.svelte` + `.type.ts` — the per-locale field stack.
- `parts/SelectMultiplePart.svelte` + `.type.ts` — dropdown plus selected-chips region.
- `parts/ImagePart.svelte` + `.type.ts` — hidden file input, trigger button, preview; owns its own element reference and keyboard activation.
- `parts/README.md` — why the directory is absent from the barrel.
- `Input.svelte` — 674 → 540 lines; two new kinds documented in its header.
- `Input.type.ts` — `multiple-text` and `multiple-text-multilingual` added; `minItems`/`maxItems` added to the base; `multilingualInfo` widened to the collection form.
- `QuestionInput.svelte` — the four constructs deleted, the ladder extended, `minItems`/`maxItems` threaded through.
- `shared.ts` — six element-class constants promoted from `Input.svelte`'s private script.
- `index.ts` — the two standalone entries removed, the exclusion noted.
- `api/utils/parseAnswers.ts` — the element-wise arm.
- Four E2E files — comments re-anchored (no assertion changed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plain `multiple-text` kind had to land in Task 2, not Task 3**

- **Found during:** Task 2
- **Issue:** Task 2's acceptance requires both that `MultipleTextInput.svelte` no longer exists AND that `yarn typecheck` exits 0. Its sole consumer imports it. Those two cannot both hold unless the consumer has somewhere else to dispatch to in the same commit.
- **Fix:** the plain kind and the consumer's rewiring landed in Task 2; Task 3 kept the whole of its own scope — the multilingual sibling, the promotion ladder and all four deletions, which were still fully present after Task 2.
- **Files modified:** `Input.type.ts`, `QuestionInput.svelte` (both declared in Task 3's `files`, not Task 2's)
- **Verification:** typecheck exit 0 and the full unit suite green at the Task 2 commit; Task 3's four deletion greps all still returned non-zero at that point, so nothing was pre-empted.
- **Committed in:** `c2665b117`

**2. [Rule 2 - Missing Critical] `parseAnswers` could not read a multilingual multi-text answer back**

- **Found during:** Task 3, tracing the write path to the read path before writing the promotion ladder
- **Issue:** promoting the multipleText kind changes what is persisted, from `Array<string>` to `Array<LocalizedString>`. `parseAnswers` is the single seam where a stored answer is resolved to the reading locale, and it recognised only a top-level localized string. A collection of them passed through untranslated, and `MultipleTextQuestion._ensureValue` — `ensureArray` over `ensureString` — then dropped every row. The candidate's answer would have saved correctly and read back empty, in the preview and for voters alike, with no error anywhere.
- **Fix:** an element-wise arm guarded by a narrow predicate: every element must itself be a localized string, so a `multipleChoice` answer (an array of plain id strings) is not matched.
- **Files modified:** `apps/frontend/src/lib/api/utils/parseAnswers.ts`
- **Verification:** `yarn typecheck` exit 0, the full monorepo unit suite green. **Not covered by a test of its own** — filed in the defect ledger and surfaced as coverage D6.
- **Committed in:** `b7bec6208`

**3. [Rule 1 - Bug] 74 comment-hygiene violations, all of them mine, went uncaught for two commits**

- **Found during:** Task 3, on the first `lint:check` run whose exit code was read correctly
- **Issue:** the doc comments written in Tasks 1 and 2 wrap prose across lines, which is exactly what Phase 152's rule 2 (D-A4) forbids and what D-N1 warned this phase about. The tree was at zero before this plan; the instrument's report attributes all 74 junctions across 11 files to files I authored. They survived two commits because my `lint:check` invocations were piped through `grep`, so `$?` was the exit code of `grep`, not of `yarn` — I read "0" and believed it.
- **Fix:** ran the phase-152 unwrap instrument (`--apply`), the sanctioned tool the standing guard's rule 2 was lifted from verbatim, so the join predicate cannot diverge from the guard's. 11 files rewritten, comments only.
- **Files modified:** the 11 files listed by the instrument
- **Verification:** `yarn lint:check` exit 0 with 0 comment-hygiene errors, re-read as a bare exit code and not through a pipe; unit suite, typecheck and build all re-run green afterwards.
- **Committed in:** `b7bec6208`
- **Lesson worth carrying:** `cmd | grep …; echo $?` reports the exit status of `grep`. Every gate in this plan was re-run with the status captured directly.

**4. [Rule 3 - Blocking] `Array.isArray` stopped narrowing the select-multiple value**

- **Found during:** Task 3, at `yarn typecheck`
- **Issue:** widening the kind union with a second array-valued member meant `Array.isArray(value)` narrows to `string[] | LocalizedString[]`, so the filter in `ensureValue` produced `(string | LocalizedString)[]` and no longer assigned.
- **Fix:** a hand narrowing to `Array<Id>` in that branch, matching the two casts of the same shape already in the file, with a comment saying why it is now needed. Not a loose escape hatch: `grep -c ': any'` returns 0 in the type module and in every part.
- **Files modified:** `Input.svelte`
- **Verification:** `yarn typecheck` exit 0
- **Committed in:** `b7bec6208`

**5. [Rule 1 - Bug] Four E2E comments and two census citations named things that no longer exist**

- **Found during:** Task 3, sweeping for references to the deleted component
- **Issue:** `testIds.ts`, `candidateProfilePage.fixture.ts`, `candidate-journey.spec.ts` and `candidateJourneyConstants.ts` each cited `MultipleTextInput` — the 159-08 routes-README defect in miniature. Separately, the effect census's rows 15 and 16 cite line numbers this plan moved.
- **Fix:** the four E2E comments re-anchored to the part (no assertion, locator or testid changed); the two census rows given dated re-anchoring clauses rather than silent overwrites, per 159-08's precedent, each stating that the effect body itself is unchanged.
- **Files modified:** the four E2E files; `159-EFFECT-CENSUS.md`
- **Verification:** `grep -rn 'MultipleTextInput' apps/frontend/src tests/` now returns only the three historical mentions inside the parts that document the absorption; `lint:check` and `format:check` clean on the four E2E files.
- **Committed in:** `b7bec6208`, `6469c8996`

---

**Total deviations:** 5 auto-fixed (2 Rule 1 bugs, 1 Rule 2 missing-critical, 2 Rule 3 blockers)
**Impact on plan:** one of the five is substantive — the `parseAnswers` arm is a file the plan did not name, and it is the difference between the feature working and the feature losing data silently. The other four are consequences of this plan's own edits, each caught by a gate the plan itself specifies. No scope creep: no file outside the blast radius was changed to make a check pass, and no acceptance criterion was satisfied by editing prose.

## Issues Encountered

**Every cited anchor in this plan had drifted, which is now six consecutive plans.**

| Cited | Measured |
|---|---|
| `Input.svelte` is 692 lines (plan, research, CONTEXT D-H2) | **674** at the base commit |
| branch comments at `:406, :467, :482, :540, :596` (research) | `:388, :449, :464, :522, :578` |
| `Input.type.ts` declares 11 `type:` literals (research) | **12** |
| `QuestionInput.svelte:40, :61-72, :150-152` (research, patterns) | `:38, :59-76, :139-146` |
| `MultipleTextInput.svelte:71-97` for the rows clone (research) | `:64-97` |

Every anchor was re-located by content before editing. None of the drift changed a conclusion — the branch structure, the twelfth literal (`select-multiple`, which the research's list of eleven omits by miscount, not by absence) and the workaround's shape are all exactly as described. The `< 692` acceptance criterion was satisfiable and satisfied either way (540), but it is worth recording that it was measured against a figure that was already 18 lines stale when it was written.

**A caution the plan raised and the measurement resolved.** `Input.svelte` is a widely-used base component, and 159-05's lesson says to check for indirect consumers before trusting a population. Checked: the deleted `MultipleTextInput` had exactly one code consumer (`QuestionInput.svelte`) but five FIXTURE-level ones reaching it through `data-testid` constants — `multiple-text-row`, `-add`, `-remove`, `-move-up`, `-move-down`, consumed by `candidateProfilePage.fixture.ts` and asserted in `candidate-journey.spec.ts`. All five testids are byte-preserved on the extracted part, and the row testid still renders once per row while translations are hidden, so the fixture's count-and-fill loop is unaffected. That is reasoning, not measurement; see below.

**No E2E run, and unlike the rest of this phase that matters here.** 159-CONTEXT § O5 budgets one full-suite run at phase level, in 159-11. Every other plan in this phase moved code; **this one changes runtime behaviour** — a multipleText question is now promoted to the multilingual kind, so what the candidate app persists changes shape. Three seams carry the risk and none is spanned by a unit test: the fixture's row-count loop, the step-21 verbatim round-trip through `parseAnswers`, and pre-existing plain-string answers being re-read as the displayed locale. Filed in the defect ledger and surfaced as coverage D5 with `human_judgment: true`. **159-11's budgeted run is the gate this work is waiting on.**

**A pre-existing `format:check` failure was left alone**, again: `PasswordSetter.svelte.test.ts`, introduced by 159-02 and already ledger entry 232. `yarn format:check` therefore still exits 1 at HEAD on that one file; `yarn lint:check`, which is this plan's stated verification command, exits 0. Not re-filed.

## Known Stubs

None. Every branch extracted is fully rendered, both new kinds are implemented and reachable, and no placeholder value or text was introduced.

## Threat Flags

None. No network endpoint, auth path or file-access pattern was added. The stored answer shape for multipleText questions changes, which is a schema-adjacent change at a trust boundary — it is the plan's declared purpose rather than an unplanned surface, and is dispositioned below.

The register's five `mitigate` dispositions:

| Threat ID | Discharge |
|---|---|
| T-159-27 emitted value shape | Five value-semantics cases green before, during and after; negative scan for de-duplication, case folding and normalization constructs returns 0 over the parts directory |
| T-159-28 loosely typed union | `grep -c ': any'` returns 0 in `Input.type.ts` and in every part; the two new members carry concrete value shapes and the new optional props use the house `never`-conditional idiom |
| T-159-29 per-locale row dropping | A row survives when any locale is non-empty; asserted by case 7, which also proves rows are not reordered across a locale switch |
| T-159-30 hard-coded strings | Every label in every part comes from the translation function; the per-locale language labels use `assertTranslationKey('lang.<locale>')`, the same construction the existing multilingual branch uses |
| T-159-SC package installs | None proposed, none installed. `git diff` over the plan's commits touches no manifest or lockfile |

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

- `Input` now owns every input kind the app renders; there is no second component to keep in step, which is what criterion 2 was about.
- The parts directory is the place any further branch extraction goes, and its README states the barrel rule so the next author does not re-export it.
- **Open for a human, and blocking in the cardinal sense:** 159-11's full-suite E2E run. This plan changed what the candidate app persists for multipleText questions; the round trip is reasoned safe and unit-green but unmeasured (coverage D5).
- **Open for a human, lower stakes:** whether the `parseAnswers` element-wise arm should carry a unit test of its own before that run (coverage D6).
- **REVIEW-CMP-02 stays `Pending` in REQUIREMENTS.md.** `requirements-completed` above copies this plan's frontmatter verbatim, but the shared-ID gate blocks the actual tick, and the assumption that it would not was wrong: I expected this to be the requirement's sole declaring plan and measured otherwise. `159-01-PLAN.md`, `159-10-PLAN.md` and `159-11-PLAN.md` all declare it as well; 159-01 has a summary, the other two do not, so `requirements.ready-ids` reports 0/1 ready. No `mark-complete` was run. The tick lands when 159-11 finishes — which is also the plan that owns the E2E gate this work is waiting on, so the two are the same event.

## Self-Check: PASSED

Created files verified present on disk — all seven checked paths FOUND, including the four part components, the two multi-text modules and the parts README.

Commits verified in `git log`: `7bba1305c`, `c2665b117`, `b7bec6208`, `6469c8996`.

Plan-level verification re-run at final HEAD, each exit code captured directly rather than through a pipe:

- `yarn typecheck` → exit 0 (svelte-check 0 errors, 0 warnings)
- `yarn workspace @openvaa/frontend test:unit` → exit 0, 88 files / 1581 tests (baseline was 87 / 1574; this plan's seven cases account for the difference)
- `yarn test:unit` (whole monorepo) → exit 0, 25/25 tasks
- `yarn workspace @openvaa/frontend build` → exit 0, adapter-node output written
- `yarn lint:check` → exit 0, 0 comment-hygiene errors
- `wc -l < Input.svelte` → 540 (criterion: `< 692`)
- `grep -c 'Exclude<QuestionType' QuestionInput.svelte` → 0

No acceptance criterion was unsatisfiable in this plan. The one figure that did not survive re-measurement — `Input.svelte` at 692 lines — was a ceiling, and the result clears both it and the true base of 674.

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-03*
