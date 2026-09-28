---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
plan: 04
subsystem: testing
tags: [playwright, e2e, perm-specs, positive-control, negative-control, assertions, svelte, validation-contract]

# Dependency graph
requires:
  - phase: 140-03
    provides: 'the seeded preconditions (`elections: 2`; `questions.showCategoryTags: true`) that let each perm dataset render its sibling tag, plus the RUN 1 blindness half and the byte-recorded injection diff at 140-NEGATIVE-CONTROL.md § 13.3'
  - phase: 140-02
    provides: 'the SOFT_ASSERTION_BUDGETS config-load guard every Playwright invocation here had to satisfy (it did — voter-journey.spec.ts untouched, no soft assertion added)'
  - phase: 140-01
    provides: '140-NEGATIVE-CONTROL.md and the HYGIENE-LOOP / COLLATERAL RULE / two-half-table conventions inherited from 139-VERDICTS.md § 3'
  - phase: 137
    provides: 'tests/scripts/e2e-run.sh and the served-application preflight — exit 0 implies preflight-confirmed, which is what makes all four runs admissible evidence'
provides:
  - 'A counted presence assertion in each perm tag spec, in the house form, reading the tag its SIBLING dataset suppresses — perm-hide-category-tags asserts election-tag > 0, perm-hide-election-tags asserts category-tag > 0'
  - 'Both spec doc blocks rewritten in the same edit to describe the positive control and name its seeded precondition'
  - '140-NEGATIVE-CONTROL.md § 16 — the F9 catch half: RUN 2 (§ 13.3 adversary), RUN 2b (subset adversary reaching the downstream spec), RUN 3 (byte-restored), the four-run table, collateral, verdict and honest gaps'
  - 'The measured harness fact that a serial Playwright project chain cannot observe its own downstream half: once the upstream spec fails, everything after it reports `did not run`'
  - '140-VALIDATION.md ASSERT-05 rows reconciled with the shipped assertion form, with a Form note recording the research-vs-house-style divergence as a resolved decision'
  - 'ROADMAP criterion 3 discharged — the § 7.1 verdict table updated in place'
affects: [140-06, 142-assert-07, any-future-perm-positive-control-work]

actuals:
  tokens: 9552
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 'Complementary positive control: pair an absence assertion with a counted presence assertion on a different element of the same component family in the same dataset, so a render-path deletion reds the spec even though the absence half stays green'
    - 'Subset adversary to reach past a serial dependency chain: when the full injection reds the upstream spec and skips the downstream one, a strict subset of the same injection keeps the upstream green and delivers the downstream observation'
    - 'Prove byte-identity at the level the record can support: identical pre-image blob + character-identical hunk body, with the residual difference bounded to whitespace that cannot reach the observable — rather than asserting a post-image hash the record cannot regenerate'

key-files:
  created: []
  modified:
    - tests/tests/specs/perm/perm-hide-category-tags.spec.ts
    - tests/tests/specs/perm/perm-hide-election-tags.spec.ts
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-NEGATIVE-CONTROL.md
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-VALIDATION.md

key-decisions:
  - 'House form used, not the research-proposed `.not.toHaveCount(0)`: `const count = await locator.count(); expect(count, "<why>").toBeGreaterThan(0)` per perm-answers-locked.spec.ts:54,86 and perm-localisation-positive.spec.ts:193,205,244. `.not.toHaveCount(` still appears nowhere in tests/tests/specs/perm/'
  - 'Message quality was preferred over the plan grep shape: the explanatory message exceeds Prettier''s 120-col printWidth so the call wraps across four lines, exactly as the house precedent at perm-localisation-positive.spec.ts:206-209 does. The wrap is prettier-stable (`prettier --write` reports "unchanged")'
  - 'The two spec test TITLES were deliberately left unchanged so the per-project rows in the RUN 1 and RUN 2 evidence tables remain directly comparable; the doc blocks carry the positive-control description'
  - 'RUN 2 could not produce both failing file:line values, and the reason was measured rather than argued: the perm chain is serial (data-setup-perm-hide-category-tags depends on perm-hide-election-tags), so the upstream red skips the downstream spec. RUN 2b — a strict SUBSET of the § 13.3 injection — was added to obtain the missing direct observation instead of recording a cascade skip as if it were one'
  - 'The recorded post-image blob hash (dbf93ba0d) does not reproduce (6ee50ee71) and this is stated as a bounded limit, not glossed: the markdown fenced-block record demonstrably strips trailing whitespace (measured on the diff''s blank context line), so hash equality is not re-derivable from it'
  - 'No prose was deleted to satisfy the `grep -c not.toHaveCount == 0` criterion: the Form note must name the rejected idiom to record the divergence, so the criterion was verified in its stronger intended form — zero occurrences on any table row / prescribed observable'

patterns-established:
  - 'A cascade `did not run` is counted as a failure but NEVER recorded as an observation of that spec''s own assertion — the distinction is what keeps a two-run control from being a reconstruction'
  - 'A subset injection doubles as a discrimination test: deleting only one tag''s render block shows each spec reds on the tag it is responsible for observing, not on "something changed in the heading"'
  - 'Reconcile the validation contract in the same plan that ships the form, and cite both sources by path, so a divergence reads as a resolved decision rather than an inconsistency'

requirements-completed: [ASSERT-05]

coverage:
  - id: D1
    description: 'perm-hide-category-tags carries a counted election-tag presence assertion beside its category-tag absence assertion, in the house form with an explanatory message naming the seeded `elections: 2`'
    requirement: ASSERT-05
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/140-f9-green (HEAD 9df37999d, exit 0, 86 expected / 0 unexpected / 0 flaky / 0 skipped, preflight 1 success)'
        status: pass
      - kind: other
        ref: "grep -c 'toBeGreaterThan(0)' == 1 and grep -c 'electionTag' >= 1 in tests/tests/specs/perm/perm-hide-category-tags.spec.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: 'perm-hide-election-tags carries the mirror — a counted category-tag presence assertion naming the seeded `showCategoryTags: true` overlay'
    requirement: ASSERT-05
    verification:
      - kind: e2e
        ref: 'same run — both spec projects reported `expected` in tests/e2e-runs/140-f9-green/results.json'
        status: pass
      - kind: other
        ref: "grep -c 'toBeGreaterThan(0)' == 1 and grep -c 'categoryTag' >= 1 in tests/tests/specs/perm/perm-hide-election-tags.spec.ts; grep -rc 'not.toHaveCount' tests/tests/specs/perm/ == 0 everywhere"
        status: pass
    human_judgment: false
  - id: D3
    description: 'The catch half is OBSERVED: each spec reds at its own presence-assertion line under deletion of the tag-render path, where the byte-identical injection left both green in RUN 1'
    requirement: ASSERT-05
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/140-f9-after (§ 13.3 adversary, exit 1, perm-hide-election-tags.spec.ts:43:7 unexpected) and tests/e2e-runs/140-f9-after-b (subset adversary, exit 1, perm-hide-category-tags.spec.ts:43:7 unexpected)'
        status: pass
      - kind: e2e
        ref: 'tests/e2e-runs/140-f9-restored (byte-restored, exit 0, 86 expected) — proves the reds came from the injection, not the new assertions'
        status: pass
    human_judgment: false
  - id: D4
    description: 'The component is byte-restored and no injection reached a commit: three-check POST-GATE plus blob-hash equality with HEAD'
    requirement: ASSERT-05
    verification:
      - kind: other
        ref: "per-path git status --porcelain empty; scoped git status --porcelain -- apps tests packages empty; grep -rn 'INJECTED (140)' apps packages tests no matches; git hash-object == git rev-parse HEAD:<file> == d2d618bfd"
        status: pass
    human_judgment: false
  - id: D5
    description: '140-NEGATIVE-CONTROL.md § 16 records RUN 2 / RUN 2b / RUN 3 verbatim, the four-run side-by-side table, the collateral column, the criterion-3 verdict (§ 7.1 updated in place) and § 16.11 what the pair does NOT discharge'
    requirement: ASSERT-05
    verification:
      - kind: manual_procedural
        ref: '.planning/phases/140-.../140-NEGATIVE-CONTROL.md §§ 16.1-16.11'
        status: pass
    human_judgment: true
    rationale: 'Whether § 16.11 genuinely names the limits — the two-runs-not-one caveat, the unproven hash identity, the untested claim that the settings actually suppress — is a judgement about the writing that no command can assert'
  - id: D6
    description: '140-VALIDATION.md ASSERT-05 rows state the shipped form, the single transitive invocation, and the Form note citing both sources; Wave 0 F9 line ticked; phase-gate frontmatter untouched'
    requirement: ASSERT-05
    verification:
      - kind: other
        ref: "grep -q 'toBeGreaterThan(0)' on the ASSERT-05 rows; zero 'not.toHaveCount' occurrences on any table row (all 3 remaining are inside the Form note, where the idiom is named as the REJECTED alternative); frontmatter still status: draft / nyquist_compliant: false"
        status: pass
    human_judgment: false

# Metrics
duration: 45min
completed: 2026-08-15
status: complete
---

# Phase 140 Plan 04: F9 Positive Controls & the Catch Half Summary

The two perm tag specs can now fail: each asserts the presence of the tag its sibling dataset
suppresses, and each was observed red at its own assertion line under the same render-path deletion
that left both green four commits earlier.

## Performance

- **Duration:** 45 min
- **Started:** 2026-08-15T13:33:27Z
- **Completed:** 2026-08-15T14:18:00Z
- **Tasks:** 3
- **Files modified:** 4 (2 specs, 2 planning documents)

## Accomplishments

- **The vacuity is closed.** `perm-hide-category-tags` now counts `election-tag` and requires `> 0`;
  `perm-hide-election-tags` counts `category-tag` and requires `> 0`. A page that renders no tags at
  all — the input both specs previously accepted — now fails both.
- **The catch was observed, not asserted.** Under the deletion of the tag-render blocks from
  `QuestionHeading.svelte`, `perm-hide-election-tags.spec.ts:43:7` and
  `perm-hide-category-tags.spec.ts:43:7` each went red with a message quoting the seeded precondition.
  Plan 03's RUN 1 ran the byte-identical injection with 86/86 green.
- **RUN 1's premise is confirmed, not retroactively invalidated.** § 15.7 recorded that RUN 1 observed
  only that nothing detected the deletion, never the DOM. RUN 2/2b read the DOM directly through
  `getByTestId(...).count()` and got `0` where the seeded dataset requires at least one.
- **A harness fact was measured that the plan had predicted wrongly** (see Deviations): the serial perm
  chain cannot produce both failing lines in one run.
- **The validation contract now describes the code.** `140-VALIDATION.md`'s ASSERT-05 rows named
  `.not.toHaveCount(0)`, inherited from research; they now name the shipped counted form, with a Form
  note citing both sources.

## The four runs

| Half | HEAD | Injection | Exit | `perm-hide-election-tags` | `perm-hide-category-tags` | Failing `file:line` |
|---|---|---|---|---|---|---|
| RUN 1 — blind (plan 03) | `4c0bf5839` | both blocks deleted (§ 13.3) | **0** | PASS | PASS | — |
| RUN 2 — catch | `c6b3abaec` | both blocks deleted (§ 13.3) | **1** | **FAIL** | did not run (cascade) | `perm-hide-election-tags.spec.ts:43:7` |
| RUN 2b — catch, downstream | `c6b3abaec` | ElectionTag block only (subset) | **1** | PASS | **FAIL** | `perm-hide-category-tags.spec.ts:43:7` |
| RUN 3 — restored | `c6b3abaec` | none (blob `d2d618bfd`) | **0** | PASS | PASS | — |

Every run was preflight-confirmed (1 success / 0 failures), 6 workers, 0 retries, evidence retained under
`tests/e2e-runs/140-f9-{green,after,after-b,restored}/` (gitignored at `.gitignore:44`).

RUN 2b also bought something the plan did not ask for: under an adversary that removes only the
ElectionTag, `perm-hide-election-tags` stays green while `perm-hide-category-tags` reds — the two
controls are **independently discriminating**, not jointly tripped by "something changed in the heading".

## Task Commits

1. **Task 1: Add the complementary presence assertions in the house form** — `c6b3abaec` (test)
2. **Task 2: Observe the catch half** — `c84832d68` (docs)
3. **Task 3: Reconcile 140-VALIDATION.md with the shipped form** — `85a940cf9` (docs)

## Files Created/Modified

- `tests/tests/specs/perm/perm-hide-category-tags.spec.ts` — counted `election-tag` presence assertion
  + rewritten doc block naming the `elections: 2` precondition
- `tests/tests/specs/perm/perm-hide-election-tags.spec.ts` — counted `category-tag` presence assertion
  + rewritten doc block naming the `showCategoryTags: true` overlay
- `.planning/phases/140-.../140-NEGATIVE-CONTROL.md` — § 16 (398 new lines) and the § 7.1 criterion-3
  verdict row updated in place
- `.planning/phases/140-.../140-VALIDATION.md` — both ASSERT-05 rows, the Form note, the Wave 0 tick

## Decisions Made

- **House form over research's `.not.toHaveCount(0)`.** Executed the plan's `<conflict_resolutions>`
  ruling. `.not.toHaveCount(` still appears nowhere in `tests/tests/specs/perm/`.
- **Test titles left unchanged**, so the per-project rows in the RUN 1 and RUN 2 evidence tables stay
  directly comparable; the positive control is described in the doc block instead.
- **A cascade `did not run` was counted as a failure but never recorded as an observation.** Recording
  it as one would have satisfied the acceptance criterion by reconstruction — the exact thing the
  plan's second prohibition forbids.
- **The unreproducible post-image hash was stated as a limit**, with the cause measured, rather than
  quietly ignored or papered over with a claim of byte-identity the record cannot support.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RUN 2 cannot produce both failing `file:line` values; a subset adversary was added**

- **Found during:** Task 2
- **Issue:** The plan's `<behavior>` and acceptance criteria require BOTH spec projects to FAIL in the
  injected run, each at its own presence-assertion line. The observed result was `1 failed / 2 did not
  run / 83 passed`: `perm-hide-election-tags` failed at `:43:7`, and `perm-hide-category-tags` plus its
  setup were reported `did not run`.
- **Root cause (measured, not inferred):** `tests/playwright.config.ts` chains the perm projects
  serially so only one dataset is resident at a time —
  `data-setup-perm-hide-category-tags` declares `dependencies: ['perm-hide-election-tags']`. That is the
  same edge § 14 relied on for transitive coverage, and it cuts both ways: when the upstream spec fails,
  Playwright skips everything downstream. Under the full § 13.3 adversary the downstream observation is
  **structurally unobtainable in one run**.
- **Fix:** RUN 2b — a **strict subset** of the § 13.3 injection (ElectionTag block only, CategoryTag
  block intact). `perm-hide-election-tags` then passes (its `election-tag` is absent, its `category-tag`
  is present), the chain reaches the category-tags dataset, and `perm-hide-category-tags` reds at
  `:43:7` on the deleted ElectionTag. Both required observations exist; they come from two runs rather
  than one, and § 16.11 says so in the first bullet.
- **Files modified:** none in `apps/`/`tests/` (transient injection, reverted); recorded in
  `140-NEGATIVE-CONTROL.md` §§ 16.4, 16.5, 16.11
- **Verification:** `tests/e2e-runs/140-f9-after-b` — exit 1, 85 expected / 1 unexpected / 0 skipped,
  preflight 1 success; failure message quoted verbatim in § 16.5
- **Committed in:** `c84832d68`

### Corrections to plan premises (recorded, not silently satisfied)

**2. [Rule 1 - Unreproducible provenance] The § 13.3 post-image blob hash does not reproduce**

- **Found during:** Task 2, immediately after applying the injection
- **Issue:** § 13.3 records `index d2d618bfd..dbf93ba0d`. Applying that diff here yields `6ee50ee71`.
  `dbf93ba0d` is not in the object database — plan 03 never committed its injection — so it cannot be
  diffed against.
- **Measured cause:** comparing the diff extracted from the document against the diff `git` produced
  from the applied tree, byte for byte with index lines stripped, gives exactly one differing line: the
  blank context line after the `@@` header, which is a single space in a real unified diff and empty in
  the markdown record. **The fenced-block record strips trailing whitespace**, so a byte-level hash
  equality is not re-derivable from it.
- **Action:** stated as a bounded limit in § 16.2 and § 16.11 rather than glossed. What is established:
  identical pre-image blob (`d2d618bfd`), character-identical hunk body, and a residual difference
  bounded to trailing whitespace on a deleted line or inside an HTML comment — neither of which can
  change a DOM element count.

**3. [Rule 1 - Measurement over prediction] Two acceptance-criterion greps do not have the predicted values**

- **Found during:** Tasks 2 and 3

  | Grep | Predicted | Measured | Why |
  |---|---|---|---|
  | `grep -c 'showCategoryTags' QuestionHeading.svelte` after revert | 1 | **2** | the component's own `### Settings` doc block at line 18 also names the setting — already measured and recorded by plan 03 in § 15.4 |
  | `grep -c 'not.toHaveCount' 140-VALIDATION.md` | 0 | **3** | the same task requires a Form note recording *why* the form differs from research, which cannot cite the rejected idiom without naming it |

- **Action:** no prose deleted to satisfy either grep (per the carry-over rule from plan 03). Intent
  verified by stronger checks instead: for the component, **blob-hash equality with HEAD**
  (`d2d618bfd`), which asserts byte-restoration across the whole file rather than at two grep sites; for
  the validation document, **zero occurrences on any table row or prescribed observable** — all three
  remaining occurrences are inside the Form note blockquote, where the idiom is named as the rejected
  alternative.

**4. [Rule 1 - Unsatisfiable premise carried forward] The plan's task-1 precondition still asserted a `dev-seed` rebuild**

- **Found during:** Task 1
- **Issue:** the `<precondition>` requires "plan 03's template edits are present in a **rebuilt**
  `packages/dev-seed` — `tests/` consumes it as a built workspace package". Plan 03 measured that this
  package is source-resolved (`"build": "echo 'Nothing to build.'"`, `exports` → `./src/index.ts`, no
  `dist`), so no such artifact exists and nothing can be stale.
- **Action:** not manufactured. The real proof the new dataset was seeded is in the runs themselves —
  the post-seed **exact-equality** `app_settings` assertion (`setupFromTemplate.ts:256-260`) reported
  `expected` for both templates in all four runs. The `140-VALIDATION.md` row that repeated the rebuild
  claim was corrected in task 3.

**5. [Rule 1 - Formatting reality] The assertion call wraps; the plan's single-line grep shape does not hold**

- **Found during:** Task 1
- **Issue:** the criterion "each spec's assertion line matches the two-argument form `expect(<identifier>, '`"
  assumes a single line. Prettier's `printWidth` is 120 (`.editorconfig` `max_line_length`, parsed by
  the shared config), leaving ~79 characters for a message that must carry three clauses.
- **Action:** message quality was preferred. The call wraps across four lines exactly as the house
  precedent at `perm-localisation-positive.spec.ts:206-209` does, and `prettier --write` reports both
  files **unchanged**, so the wrap is the canonical formatting rather than a deviation from it. The
  criterion's intent — the explanatory second argument is present and names the seeded precondition — is
  satisfied and was verified in the failure output itself (§ 16.3, § 16.5 quote the message verbatim).

---

**Total deviations:** 1 auto-fixed (Rule 3) + 4 recorded plan-premise corrections
**Impact on plan:** No scope creep. One extra E2E run was added to obtain an observation the plan
assumed one run could produce; every other correction replaced a prediction with a measurement.

### Assertions weakened

**None.** Both `toHaveCount(0)` absence assertions are byte-identical to their 2026-06-03 form. No soft
assertion was introduced (the perm Rigidity contract forbids it, and `SOFT_ASSERTION_BUDGETS` needed no
update because `voter-journey.spec.ts` was untouched). Nothing was made green by lowering a bar — the
suite was already green before these edits, and the point of the edits is that it can now go red.

### Two-run controls recorded

**Only what was executed.** All four runs trace to a retained evidence directory with `head`, `exit`,
`started`, `ended`, `preflight-successes`, `results.json` and `stdout.log`. No outcome was reconstructed,
inferred or predicted; the one outcome the plan predicted and reality contradicted (both specs failing in
RUN 2) is recorded as the contradiction it was.

## Issues Encountered

**The serial-chain skip** (Deviation 1) was the only substantive one, and it is a property of the
harness rather than a fault. It is worth carrying forward: any future negative control aimed at a perm
spec other than the first in its chain must either target the chain head or use an adversary that keeps
the upstream specs green.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
T-140-10 (the production-source mutation) was transient in both injected runs and is byte-restored,
verified by blob-hash equality with HEAD plus the three-check POST-GATE. T-140-11 (a wrong presence
assertion reddening two perm projects on every full-suite run) is discharged by RUN 3's clean 86/86.

## Known Stubs

None. Every `<verify>` in the plan was executed; no test was skipped, stubbed or annotated as flaky.

## E2E Hard Rule

Honoured. Four preflight-confirmed runs. The two non-zero exits are the **deliberate injected reds** —
the finding itself — and both were reverted inside the same task, with RUN 3 re-running the same chain
green (86 expected / 0 unexpected / 0 flaky / 0 skipped) on the byte-restored tree. No failure was
suppressed, retried until green, or annotated as flaky; the `2 did not run` in RUN 2 is counted as a
failure and is explained by the serial chain, not excused.

## Notes for Plan 06 (the phase gate)

- ROADMAP criterion 3 is **DISCHARGED**; `140-NEGATIVE-CONTROL.md` § 7.1 has been updated in place and
  § 16.10 carries the reasoning and the sub-claim map.
- `140-VALIDATION.md` frontmatter is deliberately untouched (`status: draft`, `nyquist_compliant: false`)
  — those are the phase gate's to set after the full suite passes.
- The full-suite gate has not been run here. All four runs were scoped to
  `--project perm-hide-category-tags` (86 of the suite's tests); the visual gate and the `@probe` family
  were not executed.
- If plan 05/06 touches `QuestionHeading.svelte` or the perm chain ordering, re-read § 16.4 first: the
  chain's serial dependencies determine which specs are observable under any injection.

## Self-Check: PASSED

Files verified present:

- FOUND: `tests/tests/specs/perm/perm-hide-category-tags.spec.ts`
- FOUND: `tests/tests/specs/perm/perm-hide-election-tags.spec.ts`
- FOUND: `.planning/phases/140-.../140-NEGATIVE-CONTROL.md` (2015 lines, § 16 appended)
- FOUND: `.planning/phases/140-.../140-VALIDATION.md`
- FOUND: `tests/e2e-runs/140-f9-{green,after,after-b,restored}/` (gitignored evidence dirs)

Commits verified present:

- FOUND: `c6b3abaec` test(140-04): pair each perm tag absence assertion with a presence control
- FOUND: `c84832d68` docs(140-04): record the F9 catch half — the pair reds at its own presence lines
- FOUND: `85a940cf9` docs(140-04): reconcile 140-VALIDATION.md ASSERT-05 rows with the shipped form
