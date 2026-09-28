---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
verified: 2026-07-18T23:45:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "UNBLK-02: multi-choice categorical opinion questions support D-07 constraint UX end-to-end — an out-of-range (non-zero, non-empty) voter selection is never treated as a persisted/matchable answer"
  gaps_remaining: []
  regressions: []
deferred: []
human_verification: []
---

# Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch — Verification Report

**Phase Goal:** The coverage-unblocking product features are built — new question-input components render and persist, alliance entities render in voter results, and the /nominations route fetches its data.
**Verified:** 2026-07-18
**Status:** passed
**Re-verification:** Yes — after gap closure (plan 129-09, commits 47374aec1, 321c4987b, f92896248, c77ed2692)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | UNBLK-01: `QuestionInput` renders and persists `MultipleTextQuestion` answers | ✓ VERIFIED | Unchanged since prior verification; `MultipleTextInput.svelte` present with 5 testids, min/max gating; unaffected by 129-09 (not in its `files_modified`) |
| 2 | UNBLK-02: multi-choice categorical opinion questions support D-07 constraint UX end-to-end (input + matching dispatch + dev-seed authoring + **voter-side out-of-range selections never persisted into matching**) | ✓ VERIFIED (gap closed) | Source-level re-confirmation (this session) of the 129-09 fix, PLUS a live re-run of `voter-journey.spec.ts` and `candidate-journey.spec.ts` (fresh `db:reset` + `db:seed --template e2e/base` + fresh dev server, this session) — both passed, exercising the exact invalid→valid toggle transition. See Behavioral Spot-Checks. |
| 3 | UNBLK-04: `/nominations` route fetches question data so all-nominations entities render correctly | ✓ VERIFIED | Unchanged since prior verification; `+layout.ts` `questionData` load + `+layout.svelte` `ctx.dataRoot.provideQuestionData(questionData)` consumer both confirmed present (re-checked this session); not touched by 129-09 |
| 4 | UNBLK-05: number-scale opinion question — input + matching dispatch + dev-seed authoring | ✓ VERIFIED | Unchanged since prior verification; `NumberScaleInput.svelte` present with both testids; unaffected by 129-09 |
| 5 | UNBLK-06: alliance entities render in voter results (card + member-orgs drawer) | ✓ VERIFIED | Unchanged since prior verification; `e2e/base.ts` `sections: ['candidate','organization','alliance']` re-confirmed present this session; unaffected by 129-09 |

**Score:** 5/5 truths verified

### Gap Closure Detail (UNBLK-02, this re-verification's focus)

The prior verification (2026-07-18T13:40:00Z) found one FAILED truth: the voter questions layout's `handleAnswer` persisted ANY non-empty multi-choice array unconditionally, so an out-of-range selection (e.g. 1 of `minSelections:2`) silently entered the answers store and matching, while the UI signaled "Skip"/unanswered. Gap-closure plan 129-09 (3 tasks, TDD) addressed this. Independently re-verified in this session (not trusting 129-09-SUMMARY's narrative):

| Fix component | Claimed (129-09-SUMMARY) | Verified in source (this session) |
|---|---|---|
| Pure validity helper | `isMultiChoiceCountValid` in `multiChoiceValidity.ts`, single source of truth | Read in full — `effectiveMin = minSelections ?? 1`, `effectiveMax = maxSelections ?? choiceCount`, matches formula previously inlined |
| Boundary-matrix unit test | 17 assertions | `yarn vitest run src/lib/utils/multiChoiceValidity.test.ts` → 17/17 passed (run live this session) |
| Synchronous `valid` assignment | Assigned before bubbling `onChange` in `OpinionQuestionInput`'s multi-choice wrapper | `OpinionQuestionInput.svelte:202-214` — `valid = computeMultiChoiceValid(d.value.length)` appears textually before `onChange?.(...)`, inside the `Array.isArray` guard |
| Voter persistence gate | `handleAnswer` withholds/deletes (existence-guarded) an out-of-range non-empty array instead of `setAnswer` | `+layout.svelte:188-198` — `if (Array.isArray(value) && !opinionInputValid) { if (answers.answers[question.id] != null) answers.deleteAnswer(question.id); return; }`, placed before the unconditional `setAnswer` call |
| `nextLabel` AND-term | ANDs `opinionInputValid` so last-question CTA never reads "Results" while invalid | `+layout.svelte:320-324` — `... && answers.answers[question!.id]?.value != null && opinionInputValid ? t('results.title.results') : undefined`. `answered` prop (line 318) is also correctly ANDed. |
| Wipe-proof `QuestionChoices` seed | `selectedMulti` re-keyed on `question.id`, `selectedIds` read via `untrack` | `QuestionChoices.svelte:159-165` — effect tracks only `void question.id`, reads `selectedIds` inside `untrack()`; `untrack` imported from `'svelte'` |
| Delete-epoch remount | `deleteEpoch` counter folded into the `{#key}` expression, bumped in `handleDelete` | `+layout.svelte:178` (`let deleteEpoch = $state(0)`), `215` (`deleteEpoch += 1` in `handleDelete`), `308` (`{#key \`${question.type}-${deleteEpoch}\`}`) |
| D-05 locator contract preserved | `data-testid="question-choice"`, `name="questionChoices-{question.id}"`, `checkbox-primary h-32 w-32` unchanged | All three confirmed byte-identical at `QuestionChoices.svelte:334-344` |
| Candidate side unaffected | `canSubmit` still ANDs `answerValid` | `candidate/(protected)/questions/[questionId]/+page.svelte:132-133` — unchanged |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/frontend/src/lib/utils/multiChoiceValidity.ts` | Pure validity helper, single source of truth | ✓ VERIFIED | Exists, substantive, correct formula |
| `apps/frontend/src/lib/utils/multiChoiceValidity.test.ts` | Boundary-matrix unit test | ✓ VERIFIED | 17 assertions, all pass (live run) |
| `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` | Synchronous `valid` assignment before bubbling `onChange` | ✓ VERIFIED | Confirmed at source; imports `isMultiChoiceCountValid` |
| `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` | Persistence gate, `nextLabel` AND-term, delete-epoch remount | ✓ VERIFIED | All three present and correctly ordered |
| `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` | Question-keyed untracked seed, D-05 locators intact | ✓ VERIFIED | Confirmed; markup/locators byte-identical |
| All prior-phase artifacts (MultipleTextInput, NumberScaleInput, nominations loader, e2e/base seed sections) | Unaffected by 129-09 | ✓ VERIFIED (regression check) | Re-checked this session; not in 129-09's `files_modified`; source still matches prior verification's findings |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `OpinionQuestionInput` multi-choice `onChange` wrapper | Voter layout `handleAnswer` | Synchronous `$bindable valid` write, read in the same call stack | ✓ WIRED | Confirmed by direct source reading of write-then-bubble ordering, corroborated by 129-REVIEW.md's independent reactivity trace |
| Voter `handleAnswer` | `answers.setAnswer` / `answers.deleteAnswer` | Value + validity routing (empty→delete, invalid non-empty→withhold/delete, valid→setAnswer) | ✓ WIRED | All three branches present and correctly ordered |
| `QuestionChoices` `selectedMulti` | Checkbox `checked=` render | Question-keyed untracked seed, decoupled from prop nulling on invalid-delete | ✓ WIRED | Confirmed; effect only tracks `question.id`, not `selectedIds` |
| Voter layout `handleDelete` | `{#key}` remount | `deleteEpoch` counter interpolated into the key expression | ✓ WIRED | Confirmed; increments after `deleteAnswer` |
| Candidate `canSubmit` | `answerValid` (bound from `OpinionQuestionInput`) | AND-term | ✓ WIRED | Unaffected, re-confirmed |

### Behavioral Spot-Checks (live-run this session, not from SUMMARY claims)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `multiChoiceValidity` boundary-matrix unit test | `cd apps/frontend && yarn vitest run src/lib/utils/multiChoiceValidity.test.ts` | 17/17 passed | ✓ PASS |
| Full frontend unit suite | `cd apps/frontend && yarn test:unit --run` | 759/759 passed (54 files) — matches 129-09-SUMMARY's claimed count exactly | ✓ PASS |
| svelte-check | `cd apps/frontend && yarn check` | 2092 files, 0 errors, 0 warnings — matches claimed count exactly | ✓ PASS |
| Frontend production build | `yarn build --filter=@openvaa/frontend` | Exit 0, `✓ built in 8.26s` | ✓ PASS |
| Git commit provenance | `git log`, `git show --stat` on 47374aec1/321c4987b/f92896248/c77ed2692 | All 4 commits exist, correct content, TDD RED (test) precedes GREEN (feat) | ✓ PASS |
| **Behavior-dependent truth: invalid selection never persisted, valid selection persists on same toggle** | Fresh `yarn db:reset` + `yarn db:seed --template e2e/base` + fresh dev server + `npx playwright test -c ./tests/playwright.config.ts ./tests/tests/specs/voter/voter-journey.spec.ts ./tests/tests/specs/candidate/candidate-journey.spec.ts` | 6/6 passed (1.2m) — includes voter-journey (checkbox walk: first click = intentionally-unpersisted invalid 1-selection, second click persists + enables Next) and candidate-journey (multipleText + checkbox/slider walk) plus their data setup/teardown projects | ✓ PASS |
| Independent code-review re-trace | `.planning/phases/.../129-REVIEW.md` re-review (separate agent, this phase's cycle) | "Prior WR-01 is RESOLVED" — independently traced the `$bindable` synchronous-write mechanism and confirmed it holds | ✓ CORROBORATES |

Note: the full 125-spec E2E suite (`yarn test:e2e`) was not re-run in full during this re-verification (10+ minute cost, and 129-09-SUMMARY already documents a live full-suite run of 125 passed / 0 failed / 0 did-not-run against these exact commits). The two specs most directly exercising the gap-closure surface (voter-journey, candidate-journey, including their setup/teardown) were run live end-to-end against a freshly reset DB + fresh dev server in this session and both passed cleanly, providing independent behavioral confirmation of the state-transition invariant (invalid→never-persisted, invalid→valid persists on the same toggle) beyond what source reading alone can prove.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|--------------|--------|----------|
| UNBLK-01 | 129-02, 129-05, 129-08 | MultipleText input renders + persists | ✓ SATISFIED | Unaffected by 129-09; REQUIREMENTS.md marks `[x]` and "Complete" |
| UNBLK-02 | 129-01, 129-02, 129-06, 129-07, 129-08, 129-09 | Multi-choice categorical variant: input + matching + seed + voter-side D-07 persistence integrity | ✓ SATISFIED | Gap closed by 129-09; source + live E2E re-confirmed this session; REQUIREMENTS.md marks `[x]` and "Complete" |
| UNBLK-04 | 129-03 | `/nominations` fetches question data | ✓ SATISFIED | Unaffected by 129-09; REQUIREMENTS.md marks `[x]` and "Complete" |
| UNBLK-05 | 129-01, 129-02, 129-04, 129-07, 129-08 | Number-scale input: input + matching + seed | ✓ SATISFIED | Unaffected by 129-09; REQUIREMENTS.md marks `[x]` and "Complete" |
| UNBLK-06 | 129-08 | Alliance entities render in voter results | ✓ SATISFIED | Unaffected by 129-09; REQUIREMENTS.md marks `[x]` and "Complete" |

No orphaned requirements: all 5 phase-mapped REQ-IDs (UNBLK-01/02/04/05/06) are declared across the plans' `requirements` frontmatter (129-09 additionally declares `requirements: [UNBLK-02]`) and are covered above. `REQUIREMENTS.md`'s coverage table (lines 181-185) independently marks all five "Phase 129 / Complete".

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` | 184-187 | (129-REVIEW.md WR-01, renumbered) Empty-selection branch calls `answers.deleteAnswer` unconditionally (no existence guard), unlike the adjacent invalid-non-empty branch two lines below which is existence-guarded — asymmetry introduced by 129-09 | ⚠️ Warning | Low functional impact per independent code review: fires a spurious `answer_delete` tracking event when a never-answered question's checkbox is ticked-then-unticked; no data loss, does not affect matching correctness or the D-07 persistence contract this phase's must-haves assert |
| `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` | 378, 390 | (129-REVIEW.md CR-01, was WR-02 in prior verification) Duplicate `onkeyup` on radio `<label>` + `<input>` double-dispatches keyboard events, can skip a question via Space/Enter | 🛑 Blocker (per re-review) / not gating this phase's stated goal | Pre-existing (dates to `101d9e3d`, predates this phase by well over 6 weeks; re-indented but not introduced by 129 or 129-09, confirmed by both the prior verification's `git log -S` check and the re-review). Affects the single-choice/boolean radio branch only — the new checkbox branch (this phase's UNBLK-02 surface) uses a single `onchange`, unaffected. Not e2e-covered (fixtures use pointer clicks). Flagged for awareness; does not block phase goal achievement (none of the 5 observable truths assert keyboard-double-dispatch correctness) but is a real WCAG-relevant defect worth a follow-up fix. |
| `apps/frontend/src/lib/components/input/MultipleTextInput.svelte` | 159 | Index-keyed `{#each}` reorder (129-REVIEW.md WR-02, prior WR-03) | ⚠️ Warning | Pre-existing finding, unchanged since prior verification; no data loss |
| `packages/dev-seed/src/templates/defaults/questions-override.ts` | 120-124 | Stale "24 questions" comment (129-REVIEW.md IN-01) | ℹ️ Info | Cosmetic; unchanged since prior verification |

No `TBD`/`FIXME`/`XXX` markers found in any file touched by 129-09. One pre-existing `TODO` (unrelated to this phase's scope, predates 129 by well over six weeks) remains in the voter questions layout at line 238 — consistent with the prior verification's finding.

### Human Verification Required

None required — all must-haves are mechanically verifiable and were verified, including the behavior-dependent invalid/valid-selection persistence transition, which was confirmed via a live re-run of the two most-exposed E2E specs in this session (not merely inferred from SUMMARY claims).

### Gaps Summary

None. All 5 UNBLK requirements (01, 02, 04, 05, 06) are cleanly and verifiably achieved. The single gap from the prior verification (UNBLK-02 voter-side persistence of out-of-range multi-choice selections) is closed: source-level re-confirmation of all 129-09 fix components, an independent code-review re-trace of the Svelte reactivity mechanism ("Prior WR-01 is RESOLVED"), and a live re-run of the voter-journey and candidate-journey E2E specs against a fresh DB reset + fresh dev server (this session) all converge on the same conclusion — invalid multi-choice selections are never persisted into matching, and a selection transitioning invalid→valid persists on the same toggle.

Two minor, non-blocking findings remain from the independent code-review re-review (both already assessed as not gating this phase's goal): a small asymmetry in the empty-selection delete guard introduced by 129-09 (analytics-noise only, no data-integrity impact), and a pre-existing keyboard double-dispatch defect in the radio branch that predates this phase and does not touch the new multi-choice checkbox surface. Neither contradicts any of the phase's 5 observable truths or must-haves; both are recorded under Anti-Patterns for visibility and potential follow-up.

---

_Verified: 2026-07-18_
_Verifier: Claude (gsd-verifier)_
