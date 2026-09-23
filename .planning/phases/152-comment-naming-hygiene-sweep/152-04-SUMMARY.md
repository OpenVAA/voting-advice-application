---
phase: 152-comment-naming-hygiene-sweep
plan: 04
subsystem: naming
tags: [spelling-audit, identifier-rename, uk-us, terse-names, review-hyg-04, out-of-scope-register]

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-02's `uk-identifier-audit.mjs` — the committed instrument this plan runs before and after, rather than re-deriving the audit"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-02's shared comment-span classifier in `hygiene-codemod.mjs`, which is what puts comments, strings, regex literals and Svelte markup structurally out of the audit's reach"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-03's handoff of the `dimesions` typo at `singleChoiceCategoricalQuestion.test.ts:36` (WINDOWS entry 71), explicitly nominated for this plan's spelling pass"
provides:
  - "`152-SPELLING-AUDIT.md` — REVIEW-HYG-04's committed, findable, one-command re-runnable artefact, carrying the method, the before/after result, the deliberate identifier-vs-key mismatch with its rejected alternative, and the full enumerated out-of-scope register"
  - "zero UK-spelled identifiers in `apps/`, `packages/` and `tests/` — the audit script exits 0 with `in-scope hits: 0`"
  - "`cardQuestions`, `showSubMatches`, `subcards`, `subcardsMaxOverride` — the entity card's four terse locals, now named after the props they feed"
  - "`describeOffense`, `offenses`, `permLocalizationPositiveTemplate` — the three US-spelled identifiers"
  - "the disposition of `152-CONTEXT.md` `<open>` item 2: scoped in and closed by rename, not filed"
affects: [152-05, 152-10, 152-13, 152-15]

# Actuals (#2632)
actuals:
  tokens: 18330
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "An identifier rename stops at the string/path boundary, and the resulting deliberate spelling mismatch is RECORDED with its rejected alternative rather than smoothed away in either direction."
    - "A phase's committed instrument is re-run to produce the artefact; the artefact quotes the instrument's real before-and-after output, never a claim about it."
    - "An out-of-scope register is enumerated BY SITE, with the reason per class, so the next reader's question is a lookup rather than a re-audit."

key-files:
  created:
    - .planning/phases/152-comment-naming-hygiene-sweep/152-SPELLING-AUDIT.md
  modified:
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts
    - packages/dev-seed/src/templates/index.ts
    - packages/data/src/objects/questions/variants/singleChoiceCategoricalQuestion.test.ts
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs

key-decisions:
  - "The template identifier is US-spelled while its key string, module filename and the Playwright project family built from it stay UK-spelled. The alternative — leave all five identifier sites UK-spelled so identifier and key agree — was rejected because D-A6 scopes the requirement to symbols, and declining the only in-scope symbol rename to preserve cosmetic agreement with an out-of-scope string would leave the requirement unmet in order to protect something it does not cover."
  - "`152-CONTEXT.md` `<open>` item 2 (the terse names) is closed by rename, not filed. RESEARCH § 10.1's measured blast radius of zero held exactly: four function-local `let` bindings, 13 occurrences, one file, zero exports, zero external references."
  - "The two prop-assembly lines that became `key: key` collapse to shorthand, matching `allianceSummary`'s existing form in the same object literal. No `object-shorthand` ESLint rule exists anywhere in the repo, so lint could not decide the form and the file's own established style did."
  - "Comment prose carrying `offence` is left in place beside the renamed `offenses` identifiers. Comment text belongs to the wave-4 judgement pass in 152-10, and mixing a prose edit into an identifier-rename commit would defeat 152-05's behaviour-neutrality prover."
  - "The `dimesions` typo 152-03 handed over is FIXED here rather than re-filed: WINDOWS entry 71 nominated this plan, and no later 152 plan claims it (152-13 renames titles carrying PLANNING references, not typos)."
  - "The audit script's own docblock claimed '14 in-scope' — the stale figure. Corrected in place, because an artefact whose stated purpose is 'so the next reader does not repeat it' cannot carry the number that caused the repeat."

patterns-established:
  - "When an acceptance criterion is unsatisfiable by construction, the criterion is reported as a defect with its measurement, and the truth it was reaching for is proven by a different, sound check — the criterion is never satisfied by an edit the plan's own prohibitions forbid."
  - "A negative-test input carrying the very spelling being swept is the single most dangerous hit in a spelling register, because respelling it turns a real assertion into a green tautology. It is named by file and line, not by class."

# Coverage (#1602)
coverage:
  - id: D1
    description: "The entity card's four terse locals carry the names of the props they feed, and the rename closes inside one file."
    requirement: REVIEW-HYG-03
    verification:
      - kind: command
        ref: "TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/frontend — svelte-check found 0 errors and 0 warnings"
        status: pass
      - kind: test
        ref: "yarn workspace @openvaa/frontend test:unit — 54 files / 816 tests passed"
        status: pass
      - kind: command
        ref: "git grep -cwE 'qs|showSM|scs|scsMaxOverride' -- apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte returns 0; cardQuestions 3 lines, showSubMatches 4, subcards 16, subcardsMaxOverride 3"
        status: pass
      - kind: command
        ref: "git diff | grep -cE '^[+-][[:space:]]*//' returns 0 — no comment text added or deleted"
        status: pass
    human_judgment: false
  - id: D2
    description: "The three UK-spelled identifiers are US-spelled, and the rename stops at the key/filename/project-name boundary."
    requirement: REVIEW-HYG-04
    verification:
      - kind: command
        ref: "node .planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs — 1521 files, in-scope hits: 0 over 0 identifiers in 0 files, exit 0 (was 16 over 3 in 3)"
        status: pass
      - kind: test
        ref: "yarn workspace @openvaa/dev-seed test:unit — 49 files / 570 tests passed, identical to the pre-rename baseline"
        status: pass
      - kind: command
        ref: "git diff --stat HEAD~4 HEAD -- tests/ is empty; the 'perm-localisation-positive' key string count in templates/index.ts is unchanged at 1; the module filename is byte-identical"
        status: pass
    human_judgment: false
  - id: D3
    description: "`152-SPELLING-AUDIT.md` exists as a findable, single-purpose, one-command re-runnable artefact carrying the governing rule, the method, the traps and the before/after result."
    requirement: REVIEW-HYG-04
    verification:
      - kind: command
        ref: "grep -c over the artefact: 'none found' 2, 'uk-identifier-audit.mjs' 3, 'aria-labelledby' 1, 'etSg|etPl' 2, 'perm-localisation-positive' 5"
        status: pass
      - kind: command
        ref: "the recorded post-rename output is reproduced by re-running the script — 0 in-scope hits, exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The out-of-scope register names every hit it deliberately left alone, with the reason, completely enough that the next reader does not re-audit."
    verification: []
    human_judgment: true
    rationale: "Completeness of a register is not a property any test can assert. The 32 `organisation` occurrences, the `offences` prose sites and the three CONTEXT-named hits were re-measured directly rather than copied, and each of the three named hits was read before being characterised — but whether the register is USEFUL to the next reader is a judgement call. One measured divergence from RESEARCH § 9.3 (28 comment/prose occurrences, not 27) is recorded as measured."
  - id: D5
    description: "The `dimesions` typo 152-03 left for this plan is disposed of."
    verification:
      - kind: command
        ref: "git grep -nI 'dimesion' over the source tree returns no source hit (only the .planning records of the finding)"
        status: pass
      - kind: test
        ref: "yarn workspace @openvaa/data test:unit — 47 files / 244 tests passed"
        status: pass
      - kind: other
        ref: ".planning/WINDOWS.md entry 71 marked fixed"
        status: pass
    human_judgment: false

duration: 25 min
completed: 2026-08-29
status: complete
---

# Phase 152 Plan 04: The UK/US Symbol-Name Audit, and the Terse Names Summary

**Sixteen UK-spelled identifier occurrences across three identifiers renamed to US spelling while every string, filename and Playwright project name built from the same stem stayed byte-identical; the entity card's four terse locals renamed after the props they feed; and the audit that establishes all of it committed as `152-SPELLING-AUDIT.md`, which also names every hit it deliberately left alone.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-29T00:14Z
- **Completed:** 2026-08-29T00:38Z
- **Tasks:** 3 planned, 3 completed (plus one scoped-in handover item)
- **Commits:** 4
- **Files:** 1 created, 6 modified

## Accomplishments

### 1. The entity card's four terse locals now read as what they are

`qs` → `cardQuestions`, `showSM` → `showSubMatches`, `scs` → `subcards`, `scsMaxOverride` → `subcardsMaxOverride`. Thirteen occurrences: declarations at `:126,127,140,141`, assignments at `:129,131,148,157,162`, consumptions at `:184-187`.

RESEARCH § 10.1's measured blast radius of **zero** held exactly. All four are function-local `let` bindings inside one `$derived.by` closure; none is exported; a word-boundary grep across all three trees finds no external reference to any of them. `svelte-check` reports 0 errors and 0 warnings, which is the proof the plan asked for.

The rename targets came free from the component's own prop-assembly block, where each terse local is handed to a well-named prop. Two of those lines then read `key: key` and collapse to shorthand — matching `allianceSummary`, which was already shorthand in the same object literal. No `object-shorthand` ESLint rule exists anywhere in the repo, so `yarn lint:check` could not decide the form and the file's own style did.

**The two trailing planning-reference comments at `:141` and `:162` moved verbatim with their renamed declarations, and no comment text was added or deleted** — `git diff | grep -cE '^[+-]\s*//'` returns 0. Those comments belong to the wave-4 judgement pass in `152-10`, and keeping the two diffs separable is what lets `152-05`'s behaviour-neutrality prover tell an identifier rename from a comment edit.

Prettier re-wrapped the `findCandidateNominations` call, which crossed `printWidth` once `scs` became `subcards`. That is a formatting consequence of the rename, not an edit of its own.

### 2. Three UK-spelled identifiers, US-spelled — and the rename stops at the key

| Before | After | Sites |
|---|---|---|
| `describeOffence` | `describeOffense` | 3, file-local |
| `offences` | `offenses` | 8, file-local |
| `permLocalisationPositiveTemplate` | `permLocalizationPositiveTemplate` | 5, across 2 files, one workspace |

**Sized against 16 occurrences, not the 14 this plan's own criterion inherited.** See "Corrections" below.

The template identifier is bound to the string key `'perm-localisation-positive'`, which is simultaneously the `--template` CLI argument, the module's filename, a seed `external_id` stem, and the stem of more than ten Playwright project names, `testMatch` regexes, setup/teardown names and spec filenames. All strings and paths, all outside `D-A6`'s symbol scope, and all left untouched: `git diff --stat HEAD~4 HEAD -- tests/` is **empty**, the key string count in `templates/index.ts` is unchanged at 1, and `git ls-files` still returns the UK-spelled filename.

The audit script now reports **0 in-scope hits over 0 identifiers in 0 files** across 1,521 scanned files, and exits 0.

### 3. `152-SPELLING-AUDIT.md` — the audit as an artefact, not a paragraph

226 lines at `.planning/phases/152-comment-naming-hygiene-sweep/152-SPELLING-AUDIT.md`, in the order the plan specified:

1. **The governing rule first** — committed even when the answer is "none found", so a future zero-result re-run is still committed.
2. **The method and the exact command**, plus the four traps the curated 62-stem whole-word list deliberately excludes: `disc` (discover/disconnect/discourse), `axe` (the a11y tool), `analys` as a noun stem (*analysis* is US spelling too), and `labelled` (which would reach `aria-labelledby`, a W3C attribute name). The broad pass that produced **874 hits at roughly 98% false** is recorded as the reason the curated list exists.
3. **The in-scope result**, with the instrument's real before (16/3/3) and after (0/0/0) output quoted.
4. **The deliberate identifier-vs-key mismatch**, with the rejected alternative stated so it reads as a decision.
5. **The out-of-scope register, enumerated by site** — the 28 `organisation` comment/prose occurrences, the `offences` prose in `permittedKeys.ts:101` and the six comment sites in the renamed spec, the component `<!--@component-->` docstrings, the two `etSg`/`etPl` negative-test inputs, the `Input.svelte` usage-example docstring, the two `voter-journey` `test.step` titles, the docs-app rendered copy and its load-bearing route string, and the markdown outside the three swept trees.
6. **Pointers** to the instrument, the shared classifier, this plan and this summary.

### 4. The item 152-03 handed over, disposed of by fixing it

`packages/data/src/objects/questions/variants/singleChoiceCategoricalQuestion.test.ts:36` read *"To spread normalized values to multiple dimesions"*. Fixed to *dimensions*, in its own commit.

This is a plain typo, not a UK/US spelling, and it is a string literal — so it is outside `REVIEW-HYG-04`'s scope by the same argument that keeps `'perm-localisation-positive'` out. It was fixed anyway because `WINDOWS.md` entry 71 nominated this plan's spelling pass as its owner, no later 152 plan claims it (`152-13` renames titles carrying *planning references*, not typos), and the file was already inside the phase's edit surface from `152-03`'s fixture rename. It is a vitest assertion message, never compared: zero behavioural surface. Ledger entry 71 is now marked **fixed**.

## Task Commits

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Entity card's four terse locals | `e2c7f494f` | `EntityCard.svelte` |
| 2 | Three UK-spelled identifiers | `b134630a3` | `assertKnownRowProps.builtins.test.ts`, `perm-localisation-positive.ts`, `templates/index.ts` |
| — | Scoped-in handover: the `dimesions` typo | `269e44462` | `singleChoiceCategoricalQuestion.test.ts` |
| 3 | The committed spelling audit | `47c1ea85e` | `152-SPELLING-AUDIT.md`, `uk-identifier-audit.mjs` |

## Verification Results

| Gate | Result |
|---|---|
| `yarn build` | exit 0 |
| `yarn test:unit` (repo-wide) | exit 0 — 25/25 tasks; frontend 816, dev-seed 570, data 244, argument-condensation 30, question-info 22 |
| `yarn lint:check` | exit 0 |
| `yarn format:check` | exit 0 |
| `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/frontend` | exit 0 — 0 errors, 0 warnings |
| `node .../scripts/uk-identifier-audit.mjs` | exit 0 — **0 in-scope hits** |
| `node scripts/assert-comment-hygiene.mjs` | exit 0 |
| `git diff --stat HEAD~4 HEAD -- tests/` | empty |

All four gates were run again after each rename as well as at the end.

**E2E:** not run, and not owed by this plan. `152-03` recorded that the full suite belongs to whichever later 152 plan first edits an E2E spec; this plan edits none (`git diff --stat -- tests/` is empty by acceptance criterion). No `tests/` file was touched.

## Deviations from Plan

### 1. [Rule 1 — Criterion defect] Task 1's acceptance criterion 2 is unsatisfiable by construction

- **Found during:** Task 1, before editing.
- **Issue:** The criterion reads `git grep -cwE 'q[s]|showS[M]|sc[s]' -- apps packages tests` returns 0. **`qs` is the npm querystring package.** It is imported by name in 9 frontend files (`universalAdapter.ts`, `buildRoute.ts`, `parseParams.ts`, `constituencies/+page.svelte`, three `routes/api/**/+server.ts`, and two type/comment sites) and is additionally a file-local in `packages/dev-seed/tests/latent/loadings.test.ts` at 6 sites. The criterion can never return 0 without renaming a third-party package.
- **Fix:** The truth the criterion reaches for is *the rename left no dangling reference*. Proven soundly instead by: (a) zero occurrences of all four old names in `EntityCard.svelte`; (b) the four bindings being function-local with zero exports, so the rename cannot escape the file; (c) `svelte-check` at 0 errors. `showSM` and `scsMaxOverride` do reach 0 repo-wide; `scs` does too.
- **Verification:** `git grep -nIwE 'qs|showSM|scs|scsMaxOverride'` over source extensions, listed and classified.
- **Registered:** `.planning/WINDOWS.md` entry 72.

### 2. [Rule 1 — Criterion defect] Task 2's acceptance criterion 2 is unsatisfiable without a forbidden edit

- **Found during:** Task 2, after the rename.
- **Issue:** The criterion reads `git grep -cwE 'offen[c]es' -- packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts` returns 0. After all 11 identifier occurrences were renamed, one survivor remains at `:172` — inside the test **title** string `'the SHIPPED guard and the pre-guard classifier agree — zero offences under both'`. Satisfying the criterion literally would require a string edit that `D-A6` puts out of scope and that `152-13`'s prohibitions forbid in terms (*"No `test.step` title carrying a UK spelling is respelled — that is out of D-A6's scope and recorded in the committed spelling audit"*).
- **Fix:** Not satisfied literally. The identifier truth is proven by the audit script, which blanks strings before tokenizing and reports 0. The survivor is recorded by file and line in the audit's out-of-scope register § 5b.
- **Registered:** `.planning/WINDOWS.md` entry 73.

### 3. [Rule 1 — Bug] The audit script's own docblock carried the stale "14 in-scope" figure

- **Found during:** Task 3.
- **Issue:** `uk-identifier-audit.mjs:14` read *"produced 21 raw hits and 14 in-scope ones"*. The instrument itself reports 16, `152-02` measured 16 two ways, and `WINDOWS.md` entry 69 records the correction. A file whose stated purpose is *"so the next reader does not repeat it"* cannot carry the number that caused the repeat.
- **Fix:** Docblock corrected in place to 16, with the § 9.1-vs-§ 9.2 mechanism and a pointer to `152-SPELLING-AUDIT.md`. Comment-only; the script's behaviour is unchanged and it still exits 0.
- **Files modified:** `.planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs`
- **Commit:** `47c1ea85e`

### 4. [Scoped in] The `dimesions` typo `152-03` handed over

Not a deviation from a rule so much as the discharge of an explicit handover — see Accomplishments § 4. Committed separately at `269e44462`; `WINDOWS.md` entry 71 marked fixed.

**Total deviations:** 3 auto-fixed (2 criterion defects reported with sound substitutes, 1 documentation bug), plus 1 scoped-in handover. **Impact:** none on behaviour. Two acceptance criteria are reported as defective rather than satisfied, each with the measurement that shows why and the check that proves the underlying truth.

## Corrections

**The UK/US audit finds 16 occurrences, not 14. Sized against 16.**

The plan's own criterion inherited 14 from `152-RESEARCH.md` § 9.2's hand-written table, which lists `offences` at six sites and omits `:99` and `:101` — the two lines that read `offences.push(describeOffence(…))` and therefore carry **both** identifiers, which § 9.2 attributed to one identifier each. § 9.1's own tool output already read `8x offences · 5x permLocalisationPositiveTemplate · 3x describeOffence` = 16.

`152-02` measured this and recorded it (`WINDOWS.md` entry 69). This plan **re-measured it independently before touching anything** and got 16, matching. The renames covered all 16; the post-rename audit reports 0.

**The out-of-scope `organisation` count is 28, not RESEARCH § 9.3's 27.** Measured directly: 32 occurrences of `organisation(s)` in source-extension files across the three trees, minus the 2 negative-test fixture inputs and the 2 `test.step` titles. Recorded as measured in the audit artefact rather than smoothed to match.

## Requirements

`requirements.ready-ids` returns **0 of 2 ready**. Neither `REVIEW-HYG-04` nor `REVIEW-HYG-03` was marked complete: both are declared by sibling 152 plans that have no SUMMARY yet, and the shared-ID gate correctly holds them Pending. `REVIEW-HYG-04`'s identifier surface is closed by this plan and the audit artefact exists; the requirement flips when the last declaring plan finishes.

## Known Stubs

None.

## Issues Encountered

None blocking. The two defective acceptance criteria are recorded above and in the ledger.

## Next Phase Readiness

Ready for `152-05`. Notes for downstream plans:

- **`152-05`** — this plan's four commits are identifier renames plus one artefact, **not** comment edits. `assert-comment-only-diff.mjs` will correctly report non-comment changes across `e2c7f494f..47c1ea85e`; allow-list the six modified source files by name if the prover's range includes them.
- **`152-10`** — the two trailing planning-reference comments at `EntityCard.svelte:141` and `:162` are untouched and still yours. The `offence` comment prose in `assertKnownRowProps.builtins.test.ts:34,62,113,115,149,173` and `permittedKeys.ts:101` now sits beside US-spelled identifiers; whether to align it is a judgement call in your pass, and the audit register § 5b flags it.
- **`152-13`** — the two `voter-journey` `test.step` titles and the `assertKnownRowProps.builtins.test.ts:172` title carrying `offences` are recorded in the audit's out-of-scope register, as your prohibitions require.
- **Nobody** should re-derive the UK/US question. Run `node .planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs` and read `152-SPELLING-AUDIT.md`.

## Self-Check: PASSED

All created files verified present on disk; all five commit hashes verified in `git log`.
