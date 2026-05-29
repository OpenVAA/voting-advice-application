# Deferred items surfaced during Phase 89 execution

These are issues identified during 89-01 execution but NOT fixed in 89-01.
Logged here per execute-plan deferred-items protocol + CONTEXT.md D-89-01
explicit deferral (item #1) + 89-RESEARCH.md §"Deferred Items Surfaced"
(items #1-7).

Each item: ID + description + source-of-deferral citation + fix-scheduled-for
target.

---

## 1. `packages/dev-seed/tests/templates/e2e.test.ts:431` row-count drift

**Source of deferral:** 89-CONTEXT.md D-89-01 (explicit deferral); inherited
from Phase 88 Plan 04 deferred-items.md item #1.

**Description:** Vitest unit-test asserts `e2eTemplate.questions.fixed.length
=== 18`, but the actual length is 25 (pre-89-01 baseline). The 89-01 baseV1
mutations do NOT affect `e2eTemplate` directly (they only mutate `baseV1`),
so the 89-01 commit does not change this assertion's observable failure.
Per D-89-01 this is surfaced rather than fixed.

**Fix scheduled for:** v2.11+ TEST-INVENTORY-REFACTOR hygiene plan (likely
Phase 88-LAST or a sibling) when e2eTemplate is audited holistically against
the updated dataset shape.

---

## 2. Phase 88-04 `QuestionInCardContent` election-specificity TODO

**Source of deferral:** 89-CONTEXT.md (Claude's Discretion bullet on D-89-01
follow-up); 89-RESEARCH.md §"Deferred Items Surfaced" item #2; Phase 88-04
SUMMARY.md Gate A.4 finding.

**Description:** Phase 88-04 ADR-88-04-01 surfaced a v2.11+ TODO: refactor
`QuestionInCardContent` and other results-cards settings to be
election-specific (consider moving the setting to questions or elections in
`@openvaa/data`). When this lands, the dev-seed Writer's Pass-5 resolver
from 88-04 may be retired/refactored. 89-01's 3 new filtered info questions
do not themselves trigger this gap (they're info-tab questions, not
cardContents — but they do exercise the same dispatch surface).

**Fix scheduled for:** v2.11+ data-layer refactor milestone. NOT blocking
89-01.

---

## 3. `emailHelper.ts` retirement

**Source of deferral:** 89-CONTEXT.md D-89-05 explicit end-of-milestone
deferral.

**Description:** Plan 89-02 introduces a new `emailBucket` function-fixture
that wraps the existing `tests/tests/utils/emailHelper.ts` utilities. The
`emailHelper.ts` module STAYS in place; its other consumers (the
soon-to-be-deleted `candidate-registration.spec.ts` and any kept legacy
spec that uses it) continue to use it directly. Retirement is scheduled for
end-of-milestone cleanup once 89-LAST has deleted the legacy specs that
consume it AND any kept-but-deferred specs have been migrated or replaced.

**Fix scheduled for:** v2.10 close OR v2.11+ — whichever resolves the last
emailHelper.ts consumer first.

---

## 4. Legacy PageObject classes at `tests/tests/pages/candidate/*Page.ts`

**Source of deferral:** 89-CONTEXT.md D-89-04 (KEEPS list); 89-RESEARCH.md
§"Deferred Items Surfaced" item #4.

**Description:** Per D-89-04, legacy PageObject classes that are still
consumed by surviving legacy specs stay UNTOUCHED through 89-LAST. Full
retirement of the legacy PageObject directory is end-of-milestone (when
all surviving legacy specs are themselves migrated/deleted). 89-LAST
performs a per-class consumer audit; classes with zero remaining consumers
are pruned, others stay.

**Fix scheduled for:** end of v2.10 (or v2.11+) after the last surviving
legacy candidate spec is migrated.

---

## 5. TIR5 deferred items — full list

**Source of deferral:** 89-CONTEXT.md OUT-OF-SCOPE list; 89-RESEARCH.md
§"Deferred Items Surfaced" item #5; TEST-INVENTORY-REFACTOR-5.md (the TIR5
"STILL TO BE ADDED LATER" catalogue).

**Description:** All TIR5 "STILL TO BE ADDED LATER" items remain out of
Phase 89's scope:

- 7.1.1 read-only warning (candidate-settings:117) — kept in legacy spec
- 3.3.1 candidate translation (candidate-translation:27) — kept in legacy spec
- 4.2.5-7 A11Y-02 persistence (candidate-profile:295/332/358) — kept in legacy spec
- 5.1.1-6 A11Y-01 validation matrix (candidate-profile-validation) — kept in legacy spec
- 7.1.7/8 hideHero (candidate-settings:312/343) — kept in legacy spec
- 7.1.10/11/13-17 SETTINGS-01 wave A (candidate-settings:762) — kept in legacy spec
- 27.1.1 variant-allowopen setup
- 28.1.1-3 voter-allowopen entity comment (voter-allowopen)
- 34.1.1-4 visual regression (visual-regression) — dedicated visual-regression milestone
- 35.1.1 voter results perf budget (performance-budget) — dedicated perf milestone
- 36.1.1-6 A11Y-04 axe smoke (a11y-smoke) — dedicated a11y milestone
- 37.1.1-6 candidate bank-auth (candidate-bank-auth)
- Localisation, hero video, extended question info, a11y, visual drift,
  performance (TIR5:3-8) — entire TO-DO list

**Fix scheduled for:** future milestones / dedicated phases per the TIR5
inventory.

---

## 6. `expectQuestionDisplayToHave` legacy helper at voter-mega-journey.spec.ts:298-326

**Source of deferral:** 89-RESEARCH.md §"Deferred Items Surfaced" item #6;
Phase 88-04 deferred-items.md item #2 (carried forward).

**Description:** Pre-existing legacy helper at lines 298-326 of
voter-mega-journey.spec.ts. Phase 88-04 refactored its callers to use the
new `entityDetails.expectQuestionDisplay` fixture (lines 837-851) but left
the legacy helper in place. Not in 89-01 scope.

**Fix scheduled for:** future 88-NN hygiene plan, or end-of-milestone
cleanup pass.

---

## 7. TEST-INVENTORY.md refresh

**Source of deferral:** 89-RESEARCH.md §"Deferred Items Surfaced" item #7;
inherited from 88-CONTEXT.md §"gating constraints" out-of-scope clause.

**Description:** The canonical TEST-INVENTORY.md document tracking all e2e
specs (38 specs, 173 tests as of the 2026-05-22 quick-task 260522-mps
inventory) is not refreshed during Phase 89. Phase 89 mutates the catalog
(89-LAST deletes 5 specs + excises cases from candidate-settings.spec.ts);
TEST-INVENTORY.md refresh against the post-89 catalog is itself out of
scope.

**Fix scheduled for:** dedicated hygiene plan AFTER 89-LAST (or as part of
v2.10 close cleanup if scope permits).

---

## 8. Voter-mega-journey Task 2 verification — environment cascade

**Source of deferral:** 89-01 Task 2 execution-time discovery (scope
boundary rule + concurrent vite dev server environment race).

**Description:** Plan 89-01 Task 2 verify command
`cd tests && npx playwright test --project=voter-mega-journey --reporter=list`
cannot complete in the current sandbox environment due to TWO orthogonal
out-of-scope blockers:

1. **Pre-existing perm-1e1cg1co flake** (PRE-EXISTING, CASCADE class) —
   the first spec project in the perm-* chain (the transitive dependency
   chain that `data-setup-baseV1` requires) fails on `getByTestId
   ('voter-home-start')` not visible. This is documented as a known
   issue carried forward from earlier waves; Phase 86.3-05 surfaced the
   shared voter-app cold-deeplink loader race that owns this failure
   class. NOT introduced by 89-01.

2. **Concurrent vite dev server race with db:reset cache wipe** — TWO
   `vite dev` processes were running concurrently in the sandbox at
   verification time (PIDs 6977 + 58604), both pointing at the same
   project. `yarn db:reset` invokes `dev:clean` which wipes
   `apps/frontend/.svelte-kit/` and the vite cache; the running dev
   servers do not auto-regenerate the wiped `.svelte-kit/generated/`
   directory after the wipe. `npx svelte-kit sync` only regenerates
   the type-level (`tsconfig.json`, `types/`, etc.) directory, not the
   route-resolution `generated/` block. The executor cannot safely kill
   the user's dev server.

**Code-level state of Task 2:**
- 3 new testids added to `tests/tests/utils/testIds.ts` under
  `testIds.voter.questions.{hero,categoryHero,infoButton}`
- `data-testid` attributes added to 2 voter route files (`questions/
  [questionId]/+page.svelte` hero figure + QuestionBasicInfo restProps;
  `questions/category/[categoryId]/+page.svelte` category hero figure)
- 4 new spec assertions in `voter-mega-journey.spec.ts`:
  - hero: QG-Opin-Base category intro <img> visible (new step)
  - hero: Q1 (Base-1) emoji '🗳️' visible (in existing step)
  - info: Q1 info button visible + click reveals `[qu-opin-base-1-info]`
  - hero+info: Q2 (Base-2) image <img> visible + info button toHaveCount(0)
- candidate-details info-tab matrix: count 13 → 14; assert north-only
  filtered info Q present + mun/south absent (TIR4:99)
- All new assertions are strict (0 new soft/try-catch); 13 pre-existing
  soft constructs in the spec are untouched (out of scope per scope
  boundary rule).

**Fix scheduled for:** post-89-01 follow-up — either:
- a fresh full-suite run after the perm-1e1cg1co flake is resolved
  (possibly via Phase 89-LAST cleanup pass or a v2.10-close convergence
  sweep), OR
- direct manual verification by the operator in a single-vite-dev-server
  environment with `yarn db:reset && yarn dev` issued in proper order.

The 4 new assertions are additive and well-scoped — they exercise only the
new content baseV1 mutations introduced in Task 1, so a fresh suite run
post-blocker-resolution is expected to be green provided the testid
plumbing is correct (which is statically verifiable via grep + Svelte
template syntax + central testIds.ts type-consistency).

---

*Recorded: 2026-05-29 during 89-01 Task 3.*
*Maintained: extended by subsequent 89-02 / 89-03 / 89-04 / 89-LAST
deferred-items as discovered.*
