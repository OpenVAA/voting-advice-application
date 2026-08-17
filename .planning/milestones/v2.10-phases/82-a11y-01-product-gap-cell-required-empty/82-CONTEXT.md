# Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the 3rd and final PRODUCT-GAP cell in `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` that Phase 76 deferred — A11Y-07 (required-empty save behavior, cell 4) — by:

1. **Product decision (TIGHTEN-SOFT)** — wire `allRequiredFilled` into `canSubmit` at `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92`. The submit button BECOMES truly disabled when any `customData.required=true` info question has an empty answer. Reason: the existing "Required" notice + the sr-only badge per `Input.svelte:135,568-572,624-628` (`showRequired`) ALREADY signal that empty-required is non-final, but the submit button is NOT actually gated today (`canSubmit = $derived(status !== 'loading')` — `allRequiredFilled` only drives the notice's `class:opacity-0` toggle at `+page.svelte:288` and the `submitRouting` route choice at `:98-109`). Phase 82 closes that gap: the badge stops being a lie. No new error message; no new i18n key; no Input.svelte changes.
2. **e2e fixture extension** — at `packages/dev-seed/src/templates/e2e.ts`: ADD a NEW sort-24 `test-question-required-empty-1` info question (`type: 'text'`, `required: true`, `category: test-category-info`, no `subtype`, no `custom_data.maxlength`). Alpha seeds a sentinel-style answer (e.g., `{ value: 'sentinel-82-required' }`) so Alpha remains `profileComplete` by default — protects Phase 76 P02 reload-persistence + Phase 81 cells 5+6 + all downstream candidate-app + candidate-app-mutation specs assuming Alpha is complete.
3. **Spec cell 4** — extend `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` with cell 4 under the existing `A11Y-01 candidate profile validation` describe: visit profile (button enabled, Alpha complete) → clear required field via `getByLabel(/Required-empty \(Phase 82 A11Y-07 anchor\)/i).fill('') + .blur()` → assert `getByTestId('profile-submit')` is `toBeDisabled()`. Tight contract, matches TIGHTEN-SOFT semantics directly.

After Phase 82: the candidate profile route has end-to-end required-empty save-gating coverage that exercises the submit-button-disable path on a REAL required:true candidate-profile info question. The 5 first-run a11y violations resolved in Phase 80 stay green; the Phase 76 P01 cells 1-3 + Phase 76 P02 reload-persistence + Phase 81 cells 5+6 continue to pass; Phase 79 v2.10 verification anchor at SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE) holds.

Phase 82 is product-decision-driven save-gate tightening on existing rendering paths — NOT new product behavior beyond the gate, NOT framework migration, NOT UI redesign. Component changes are 1-line additive (the `canSubmit` `$derived` expression gains `&& allRequiredFilled`); schema changes are zero; i18n changes are zero; fixture changes are 1 new question row + 1 Alpha answer cell. Verification MUST confirm the Phase 79 v2.10 anchor holds through these changes; new test addition (+1 PASS_LOCKED expected) MAY require additive constants regen via Phase 79 P03 path.

Phase 82 is structurally independent of Phase 80 (disjoint code surfaces: navigation a11y vs. form save-gate) and Phase 81 (disjoint dispatch: Question.subtype validation vs. canSubmit gate). Phase 79 (DETERM-04 green) is a HARD prerequisite — A11Y-01 cell 4 extends `candidate-profile-validation.spec.ts` which was cascade-blocked pre-79.

</domain>

<decisions>
## Implementation Decisions

### Product decision: required-empty save behavior

- **D-01 — TIGHTEN-SOFT: wire `allRequiredFilled` into `canSubmit`.** Concrete change at `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92`:

  ```svelte
  // BEFORE
  let canSubmit = $derived(status !== 'loading');

  // AFTER (Phase 82 — submit gated by required-field completeness)
  let canSubmit = $derived(status !== 'loading' && allRequiredFilled);
  ```

  The `disabled={!canSubmit}` binding at `:304` already wires through to the submit `<Button>`. Effect: when any required info question has an empty answer, the submit button is truly disabled (matching the "Required" notice's intent and the sr-only `common.required` badge's semantic). No re-ordering of the `$derived` blocks needed — `allRequiredFilled` is declared at `:94`, BEFORE `submitRouting`'s use at `:98-109`; `canSubmit` only moves UP in the dependency chain (the `submitRouting` block does NOT depend on `canSubmit`, so no reorder concern). **REJECTED:** REJECT-with-inline-error (largest code surface — Input.svelte branch + save-handler abort + new i18n key in 14 catalogs + spec error-text assertion; over-budget for the existing-gap-closure scope); SOFT-WARN-ONLY (close as PRODUCT-CONFIRMED with NO code change — but the existing canSubmit gating is actually a LIE today; closing without fixing the lie perpetuates a user-visible inconsistency where the badge says "complete this" but the button still submits; cell 4 would have nothing meaningful to assert beyond "badge is visible when empty" which is trivially true already).

- **D-02 — FUTURE PRODUCT CHANGE (deferred to v2.11+):** Allow user to SAVE incomplete profile but BLOCK navigation to opinion-questions until all required info fields are complete. New UX flow: (a) submit button works when partial — saves draft; (b) a `Warning` banner on `/candidate/profile` explains "complete required profile fields before answering opinion questions"; (c) navigation guard on `/candidate/questions` (or a redirect from there back to `/candidate/profile` with a `?reason=incomplete-required` query param) prevents entry until `allRequiredFilled` is true. Backtracks Phase 82's TIGHTEN-SOFT gate. Out of v2.10 scope; filed as deferred-todo `2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md` per Phase 82 user direction. See <deferred> section below for the full todo content authored at Phase 82 close.

### e2e fixture extension

- **D-03 — Add NEW sort-24 `test-question-required-empty-1` info question (additive).** Concrete shape (planner refines exact text at PLAN.md time):

  ```typescript
  // After sort-23 test-question-email-1 (Phase 81 A11Y-05 anchor).
  // Phase 82 A11Y-07 anchor — required-empty save-gate dispatch via customData.required=true.
  // profile/+page.svelte:94 derives allRequiredFilled from candCtx.requiredInfoQuestions
  // (apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-352) +
  // isEmptyValue(userData.current?.candidate.answers?.[q.id]?.value); Phase 82 wires
  // allRequiredFilled into canSubmit at :92 so the submit button becomes truly disabled
  // when this row's answer is empty.
  //
  // ALPHA-COMPLETENESS INVARIANT (Phase 76 P02 + Phase 81 + downstream specs assuming
  // profileComplete): Alpha MUST seed an answer for this row so Alpha stays
  // profileComplete by default. Otherwise candidate-app + candidate-app-mutation specs
  // that don't explicitly clear answers would race against the "Required" notice + the
  // newly-disabled submit button.
  //
  // VALUE-DISJOINTNESS INVARIANT (Phase 76 P01 fixture-extension fix + Phase 81 D-08
  // inheritance): Alpha's answer value MUST NOT contain the substring 'Alpha' /
  // 'alpha' (case-insensitive). 'sentinel-82-required' below is disjoint.
  //
  // sort_order: 24 — placed AFTER Phase 81's test-question-email-1 (sort 23). Voter
  // fixture's default voterAnswerCount=16 Likert loop is unaffected: sort 24 > 16,
  // voter never encounters this info question.
  //
  // No subtype: plain text input (no email/url dispatch — orthogonal to Phase 81
  // surface). No custom_data.maxlength: required-empty cell asserts on the gate,
  // not on character-cap (Phase 76 P01 cell 3 already covers maxlength).
  {
    external_id: 'test-question-required-empty-1',
    type: 'text',
    name: { en: 'Required-empty (Phase 82 A11Y-07 anchor)' },
    category: { external_id: 'test-category-info' },
    allow_open: false,
    required: true,
    sort_order: 24,
    is_generated: false
  }
  ```

  Alpha answer cell: `'test-question-required-empty-1': { value: 'sentinel-82-required' }` (added at `e2e.ts` Alpha `answersByExternalId` block, parallel to the existing `test-question-email-1` answer). Plain-string shape (NOT LocalizedString) matches the post-Phase-81 single-locale text-input convention noted in Alpha's `test-question-social-1` reason-comment.

  **REJECTED:** "Promote `test-question-displayname` (sort 19) to required:true" (reuses existing anchor with smaller diff, but Phase 76 P01 cell 3 maxlength + Phase 76 P02 reload-persistence anchors depend on displayname being a STANDALONE text-input contract — promoting changes its semantic from "optional text with maxlength" to "required text with maxlength", which could surface as a cross-anchor coupling concern; additive new row is cleaner per Phase 81 D-07 / D-08 precedent). **REJECTED:** "Add new row + skip Alpha answer" (breaks Alpha's `profileComplete` invariant; cascades to candidate-app + candidate-app-mutation specs that don't explicitly clear answers — would force a sweep across multiple specs to add cleanup, out of phase scope).

- **D-04 — Alpha answer sentinel value: `'sentinel-82-required'`.** Disjoint from 'alpha' substring per the value-disjointness invariant (Phase 76 P01 + Phase 81 D-08 inheritance). Long enough to be visually distinct from defaults; short enough to be readable in test output.

### Spec extension at candidate-profile-validation.spec.ts

- **D-05 — Cell 4 spec contract: button-disabled gate.** Concrete shape (planner refines exact text at PLAN.md time):

  ```typescript
  // Add as a new top-level test under the existing A11Y-01 describe (NOT inside
  // TEXT_CELLS / IMAGE_CELLS for-loops — different contract from format/maxlength).
  test('A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate', async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

    await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible({
      timeout: 10000
    });

    // (a) Sanity gate — Alpha is profileComplete by default; submit button is enabled.
    const submit = page.getByTestId(testIds.candidate.profile.submit);
    await expect(submit).toBeEnabled({ timeout: 5000 });

    // Clear the required field to trigger allRequiredFilled = false.
    const input = page.getByLabel(/Required-empty \(Phase 82 A11Y-07 anchor\)/i).first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('');
    // BLUR INVARIANT (Phase 81 D-11 inheritance): Input.svelte binds onchange (NOT
    // oninput) at line 614-621 — Playwright fill() fires `input` events per
    // keystroke but `change` only fires on blur. The empty-to-saved state propagates
    // through userData.setAnswer → candCtx.requiredInfoQuestions filter → $derived
    // allRequiredFilled re-evaluation → canSubmit $derived re-evaluation → disabled
    // prop re-render only after the change event fires.
    await input.blur();

    // (b) Submit button is now disabled — TIGHTEN-SOFT gate engaged.
    await expect(submit).toBeDisabled({ timeout: 5000 });

    // (c) Value-preservation: the user's empty state is preserved on screen
    // (the spec did not see the field revert to Alpha's seeded value).
    await expect(input).toHaveValue('');
  });
  ```

  **REJECTED:** "Button-disabled + 'Required' notice opacity flip" (more brittle — relies on `class:opacity-0` toggle at `+page.svelte:288` which could refactor to e.g. a `Warning` component or a tailwind transition class without breaking the canSubmit gate). **REJECTED:** "Button-disabled + refill restores enable" (largest cell — verifies reactive round-trip; nice-to-have but Phase 82's contract is the gate itself, not the reactive chain end-to-end which is implicitly verified by every other test that types into a $state-bound input).

  Test-title prefix MUST stay `A11Y-01 ` (matches the existing 5 cells); the `A11Y-07` infix marks the closed requirement ID (per Phase 81 D-11 scope-marked-test-title pattern).

- **D-06 — Cell 4 lives OUTSIDE the TEXT_CELLS / IMAGE_CELLS for-loops.** Per Phase 81 D-11 the existing loops branch by `kind: 'maxlength' | 'format'`. Cell 4's contract (button-disable assertion on a separate testId, NOT field-level error UI) is structurally different from both kinds. Adding a 3rd `kind: 'gate'` discriminant would require a 3rd loop with substantially different logic (`getByTestId(submit)` instead of `getByText(error)`). Default: a standalone `test(...)` block — clearer to read, easier to maintain. Planner MAY fold into a `kind` discriminant if PLAN.md authoring surfaces a clean shared abstraction.

- **D-07 — `testIds.candidate.profile.submit` is the canonical submit-button anchor.** Verified at scout: `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:308` uses `data-testid="profile-submit"`; the testId registry at `tests/tests/utils/testIds.ts` is expected to expose `candidate.profile.submit = 'profile-submit'`. Planner verifies at PLAN.md authoring time; if the registry entry is missing, planner adds it as a 1-line addition (per Phase 73 IN-03 / Phase 80 D-14 inheritance — role/aria locators preferred but testIds are acceptable for stable structural anchors like submit buttons).

- **D-08 — IMGPROXY_TIED_TITLES safety (inherited from Phase 80 D-13 / Phase 81 D-12).** Phase 82's new test title MUST NOT end with any of the 14 bound patterns at `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs:64-78`. Verified at CONTEXT authoring: title `A11Y-01 A11Y-07 required-empty disables submit button via canSubmit gate` does NOT match any IMGPROXY_TIED_TITLES entry (the bound list is entity-image-upload-related). Planner re-verifies at PLAN.md authoring time.

- **D-09 — `candidate-profile-validation.spec.ts:23-29` deferred-cells docstring update.** Phase 82 should update to note A11Y-07 is NOW resolved (the original Phase 81 docstring still flags A11Y-07 as the remaining cell); Phase 82 closes the docstring's "remaining PRODUCT-GAP cells" line entirely.

### Determinism + parity considerations

- **D-10 — Inherit Phase 80 D-09 / Phase 81 D-13 determinism contract:** 3-run cold-start `--workers=1` verification at Plan 01 close (mandatory per Phase 73 P06 + Phase 76 D-09 + Phase 80 D-09 + Phase 81 D-13); vite-cache wipe before the 3-run gate (`yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` per Phase 78 CLEAN-01 + Phase 80 D-11 + Phase 81 D-13). Per the Yarn arg-forwarding caveat in CLAUDE.md, the chained-form `yarn db:reset-with-data --likert-only` does NOT forward `--likert-only` — Phase 82's verification uses the canonical 3-command chain. Phase 82 is NOT a Likert-only run; the e2e template's non-ordinal opinion questions are not in the assertion path of `candidate-profile-validation.spec.ts`.

- **D-11 — Phase 79 v2.10 anchor at SHA `ff0334f856…` MUST hold through Phase 82 changes.** The anchor at Phase 79 close was 80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE (per `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-VERIFICATION.md`). Phase 80 closed 2026-05-13 with the anchor preserved; Phase 81 closed 2026-05-13 with the anchor preserved (per `.planning/phases/81-a11y-01-product-gap-cells-email-url-format/81-VERIFICATION.md`). Phase 82 expects +1 new PASS_LOCKED entry (cell 4) — net addition, not a transition. If 3-run cold-start surfaces ANY PRE-EXISTING test transitioning between PASS_LOCKED / DATA_RACE / CASCADE pools, parity-script constants regen is required via the Phase 79 P03 path (`regen-constants.mjs` OR in-place edit at `tests/scripts/diff-playwright-reports.ts`).

- **D-12 — Parity-script self-identity smoke (D-12 from Phase 80 / D-15 from Phase 81) inherited.** Run `npx tsx tests/scripts/diff-playwright-reports.ts | diff <expected-template> -` at HEAD-pre-changes; re-run post-fix to confirm constants regen is not required (or to surface the new +1 PASS_LOCKED addition which would require an additive constants update — Plan 01 close should fold this in if needed).

- **D-13 — IMGPROXY_TIED_TITLES list NOT touched** (inherited Phase 80 D-13 / Phase 81 D-16). The 15-entry DATA_RACE pool remains structurally bound. Phase 82's surface (`+page.svelte` 1-line `canSubmit` + 1 fixture row + 1 Alpha answer + 1 spec cell + 1 docstring update) does NOT collide with the entity-image-upload paths.

- **D-14 — Alpha-completeness invariant verification.** Planner MUST verify at PLAN.md authoring time that no existing spec relies on `requiredInfoQuestions.length === 0` (i.e., that NO required info questions exist). Quick scout: `grep -rn "requiredInfoQuestions\|allRequiredFilled\|profileComplete" tests/ apps/frontend/src/`. If any spec or component asserts the empty-list case, Phase 82 needs to either (a) bypass the assertion via test-specific seed override, OR (b) flag the spec as a follow-up todo. Expected: no existing spec relies on the empty case (the new sort-24 row is the FIRST required info question in the e2e fixture per CONTEXT scout).

### UI spec skip (memory precedent)

- **D-15 — Skip `/gsd-ui-phase` auto-spawn.** Per `feedback_skip_ui_spec_for_a11y_only_phases.md` memory precedent (Phase 76 + Phase 80 + Phase 81 precedent): structural a11y / cite-and-fix / validation-extension / save-gate-tightening phases with no visual redesign skip the UI-SPEC auto-spawn step. Phase 82 is a 1-line save-gate addition + a new fixture row + a new test cell — the `<input>` DOM shape, label, error message rendering, "Required" notice opacity behavior, and overall layout are UNCHANGED. The only user-visible new behavior is: the submit button becomes truly disabled when any required field is empty (it was always visually expected to be — see the "Required" notice at +page.svelte:288-292 — Phase 82 just makes the button match the notice's promise). No new components, no new styles, no new accessibility patterns to design. Phase 81 confirmed this precedent; Phase 82 follows.

### Plan grouping / sequence (Claude's Discretion — user did not select this gray area)

- **D-16 — Default: 1 bundled plan; total LOC budget tiny (~25 LOC).** All Phase 82 changes are tightly coupled and small:
  1. `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92` — 1-line `canSubmit` extension.
  2. `packages/dev-seed/src/templates/e2e.ts` — 1 new question row (~10 LOC with comment block) + 1 Alpha answer cell (~1 LOC).
  3. `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — 1 new standalone `test(...)` block (~30 LOC including comments) + 1 docstring update (~3 lines).
  4. `tests/tests/utils/testIds.ts` — IF the `candidate.profile.submit` entry is missing, 1-line addition (planner verifies; expected to already exist).

  No reason to split. Plan 01 is the entire phase.

### Locator + lint convention

- **D-17 — Inherits Phase 81 D-19 / Phase 80 D-14 / Phase 76 D-11a / Phase 75 D-06 / Phase 73 IN-03.** Role/aria locators by default; `getByTestId(testIds.candidate.profile.submit)` is the structural anchor for the submit button (testIds are acceptable for stable form-action elements). `playwright/no-raw-locators` lint rule at `'error'` is non-negotiable; the modified spec MUST pass `yarn lint:check`.

### Claude's Discretion

- **`canSubmit` $derived expression shape** (D-01): inline `&& allRequiredFilled` (default — minimal diff) or a named intermediate `let submitGate = $derived(allRequiredFilled); let canSubmit = $derived(status !== 'loading' && submitGate);` (slightly more readable; trivial overhead). Planner's call at PLAN.md authoring time.
- **Alpha answer sentinel value text** (D-04): `'sentinel-82-required'` (default) or any other 'alpha'-disjoint string. Planner's call.
- **New question name string** (D-03): `'Required-empty (Phase 82 A11Y-07 anchor)'` (default — matches Phase 76 / Phase 81 anchor-naming pattern). Planner may shorten to `'Required-empty (Phase 82 anchor)'` for brevity.
- **Standalone test() vs TEXT_CELLS kind expansion** (D-06): default standalone `test(...)` block. Planner picks at PLAN.md time if a shared abstraction reads cleaner.
- **Comment update on docstring** (D-09): the existing 23-29 block at `candidate-profile-validation.spec.ts` mentions A11Y-07 as the remaining cell. Phase 82 should rewrite that paragraph to note A11Y-07 is now CLOSED. Planner crafts the exact text.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 82 anchors (REQUIREMENTS / ROADMAP / STATE / PROJECT)

- `.planning/REQUIREMENTS.md` §A11Y-07 — locked success criteria for the required-empty cell; the per-requirement-ID contract.
- `.planning/ROADMAP.md` §"Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty" — phase goal + dependencies + 4 success criteria + UI hint (yes, but skipped per D-15).
- `.planning/STATE.md` — v2.10 milestone state; Phase 81 closed 2026-05-13; Phase 82 ready to plan.
- `.planning/PROJECT.md` §"Current Milestone: v2.10" — milestone framing + 5-phase shape.
- `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` — original PRODUCT-GAP scope document (filed at Phase 76 P02 close); per-cell effort sizing. Phase 81 closed cells 5+6 (email + URL); Phase 82 closes cell 4 (required-empty) — fully resolves the todo. Move to `.planning/todos/done/` at Phase 82 close.

### Phase 76 PRODUCT-GAP origin + persistence anchors

- `.planning/milestones/v2.9-phases/76-profile-a11y/76-CONTEXT.md` D-03 PRODUCT-GAP path + RESEARCH LANDMINE-2 — origin of the deferral; Phase 82 lifts cell 4.
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md` — Phase 76 baseline (PRESERVED as Phase 80 D-07 cross-link target).
- `.planning/milestones/v2.9-phases/76-profile-a11y/76-02-PLAN.md` — Phase 76 P02 (reload-persistence anchors at `test-question-displayname` + `test-question-bio` + `test-question-social-1` sort 19/20/21). Phase 82 adds sort-24 row; does NOT touch the 19/20/21 anchors.

### Phase 81 (most recent A11Y closure — direct inheritance)

- `.planning/phases/81-a11y-01-product-gap-cells-email-url-format/81-CONTEXT.md` D-07 / D-08 / D-11 / D-12 / D-13 / D-14 / D-15 / D-16 / D-17 / D-19 — fixture additive pattern + sort-numbering convention + spec-cell pattern + IMGPROXY safety + determinism contract + v2.10 anchor preservation + parity-script self-identity smoke + UI-spec-skip + locator/lint convention. Phase 82 inherits verbatim.
- `.planning/phases/81-a11y-01-product-gap-cells-email-url-format/81-VERIFICATION.md` — Phase 81 verdict (assumed GREEN at Phase 82 authoring time; verify at planner time). Confirms v2.10 anchor at SHA `ff0334f856…` preserved through Phase 81.

### Phase 80 (A11Y axe close — inherited via Phase 81)

- `.planning/phases/80-a11y-axe-cite-and-fix/80-CONTEXT.md` D-09 / D-11 / D-12 / D-13 / D-14 — determinism contract + vite-cache wipe + parity-script self-identity smoke + IMGPROXY_TIED_TITLES safety + locator convention. Phase 82 inherits via Phase 81 D-13 chain.
- `.planning/phases/80-a11y-axe-cite-and-fix/80-VERIFICATION.md` — Phase 80 verdict (GREEN, 5/5 SCs PASS, 2026-05-13).

### Phase 79 determinism anchor (v2.10 binding)

- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-VERIFICATION.md` — Phase 79 verdict (passed-with-deferral, 2026-05-13); locks v2.10 anchor at SHA `ff0334f856…` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE). Phase 82 verification asserts this anchor holds.
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — Phase 79's constants-regen tool; bind-source if Phase 82 verification surfaces PASS / DATA_RACE / CASCADE shifts (or for the additive +1 PASS_LOCKED case if Plan 01 close folds the new cell into the anchor).
- `tests/scripts/diff-playwright-reports.ts` — parity-script restored in Phase 73 P06; Phase 82 verification invokes the self-identity smoke (D-12).

### Determinism + parity contract inheritance

- `.planning/milestones/v2.9-phases/73-determinism-baseline/73-CONTEXT.md` D-01..D-10 — binding determinism contract (3-run `--workers=1` cold-start identical pass/fail; vite-cache wipe recipe). Phase 82 inherits via D-10 / D-12.
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` — IMGPROXY_TIED_TITLES list; D-13 confirms Phase 82 does not collide.

### Cleanup + i18n inheritance (verified read-only)

- `.planning/milestones/v2.9-phases/78-cleanup-hygiene-phase/78-CONTEXT.md` (CLEAN-04) — i18n wrapper `TranslationKey` tightening. Phase 82 does NOT add new i18n keys — TIGHTEN-SOFT has no error message; existing `common.required` + `candidateApp.basicInfo.requiredInfo` keys are reused.

### Component fix surfaces (Phase 82 will modify)

- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:92` — `canSubmit` `$derived` expression. Phase 82 D-01 adds `&& allRequiredFilled` to the existing `status !== 'loading'` check.
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:94` — `allRequiredFilled` `$derived` block (NO change — already correctly derived from `candCtx.requiredInfoQuestions.some(...)` + `isEmptyValue(...)`).
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:304` — submit button `disabled={!canSubmit}` (NO change — already correctly wired; the change at :92 propagates through).

### e2e fixture surface (Phase 82 will modify)

- `packages/dev-seed/src/templates/e2e.ts` (after sort-23 `test-question-email-1` row at ~e2e.ts:710-720) — NEW sort-24 `test-question-required-empty-1` row per D-03.
- `packages/dev-seed/src/templates/e2e.ts` Alpha `answersByExternalId` block (after `'test-question-email-1'` entry) — Phase 82 adds `'test-question-required-empty-1': { value: 'sentinel-82-required' }`.

### Test surface (Phase 82 will modify)

- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (after the existing `for (const cell of TEXT_CELLS.filter((c) => c.kind === 'format'))` loop at lines 282-315) — Phase 82 D-05 adds a new standalone `test('A11Y-01 A11Y-07 required-empty ...', ...)` block.
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:23-35` (deferred-cells docstring) — Phase 82 D-09 updates to note A11Y-07 is NOW resolved; removes the "Phase 82 / A11Y-07" reference from the "remaining PRODUCT-GAP cells" paragraph.
- `tests/tests/utils/testIds.ts` — verified read-only at scout; expected to expose `candidate.profile.submit = 'profile-submit'`. If missing, 1-line addition by planner per D-07.
- `tests/playwright.config.ts:124` — `candidate-(registration|profile|profile-validation)\.spec\.ts` regex already includes `profile-validation`. NO config change needed.

### Context + reactivity reference (read-only — Phase 82 verifies)

- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-352` — `requiredInfoQuestions` `$derived` block (filters info questions by `customData.required === true`). Phase 82's new sort-24 row will surface in this list once seeded.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:354-362` — `unansweredRequiredInfoQuestions` `$derived.by` block (driven by `requiredInfoQuestions` + `isEmptyValue` of saved answers). Reactivity edge already in place.
- `apps/frontend/src/lib/components/input/Input.svelte:135` — `showRequired = $derived(!!required && isEmptyValue(value))`. NO change — Phase 82 reuses the existing badge surface; the visual signal is already correct.
- `apps/frontend/src/lib/components/input/Input.svelte:568-572,624-628` — `showRequired` consumers (badge render). NO change.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts:156` — `requiredInfoQuestions: Array<AnyQuestionVariant>` type declaration. NO change.

### Consumer-side surfaces (verified read-only — Phase 82 does NOT modify)

- `apps/frontend/src/lib/components/input/QuestionInput.svelte:79-91` — `inputProps.required = required == null ? undefined : !locked && required` (consumer of `customData.required`). NO change — the dispatch is already correct; Phase 82's new fixture row just flips the flag from `undefined`/`false` to `true`.
- `apps/frontend/src/routes/candidate/` other routes (`/candidate/questions`, `/candidate/home`, etc.) — NO change in Phase 82 scope. The deferred-todo D-02 (allow-incomplete-save + opinion-questions navigation guard) WOULD touch these routes, but that's v2.11+ scope.

### Project-level conventions

- `CLAUDE.md` §"Development Commands" — `db:*` canonical commands (Phase 78 CLEAN-01 + Phase 80 D-11 + Phase 81 D-13). Phase 82 verification uses `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean`.
- `CLAUDE.md` §"Important Implementation Notes" — "Use TypeScript strictly — avoid `any`, prefer explicit types" (drives the `canSubmit` $derived shape — Phase 82 keeps the existing `boolean` return).
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — `candCtx.requiredInfoQuestions` is a reactive accessor (per the rule's reactive-accessor list); already correctly read via `candCtx.requiredInfoQuestions` (NOT destructured) at `profile/+page.svelte:95`. NO change.
- `.agents/code-review-checklist.md` — apply at PLAN.md authoring time + per-plan close.
- `tests/eslint.config.mjs` — post-Phase-73 lint config; `playwright/no-raw-locators` + `playwright/no-conditional-in-test` at `'error'`. The modified spec MUST pass `yarn lint:check`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`allRequiredFilled` $derived block** (`apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:94`) — already correctly derived from `candCtx.requiredInfoQuestions.some(q => isEmptyValue(...))`. Phase 82 just wires it into `canSubmit`; NO new derivation needed.
- **`canSubmit` $derived block** (`+page.svelte:92`) — Phase 82 adds 1 binary operator (`&&`) + 1 identifier (`allRequiredFilled`). NO restructure.
- **`disabled={!canSubmit}` binding** (`+page.svelte:304`) — already wired through to the submit `<Button>`. Phase 82 changes propagate through automatically.
- **Submit button testId** (`+page.svelte:308`) — `data-testid="profile-submit"`; the testIds registry entry is expected to exist; planner verifies.
- **`Input.svelte showRequired` badge** (`Input.svelte:135,568-572,624-628`) — already renders the sr-only "Required" indicator when value is empty. Phase 82 reuses; NO change to the badge surface.
- **`candidateApp.basicInfo.requiredInfo` notice** (`+page.svelte:288-292`) — the "Please fill in the required fields" text with `class:opacity-0={status === 'loading' || allRequiredFilled}`. Already correctly toggled by `allRequiredFilled`. NO change.
- **`requiredInfoQuestions` reactive accessor** (`candidateContext.svelte.ts:347-352,425-427`) — already derived from the candidate's info questions filtered by `customData.required === true`. Phase 82's new sort-24 row surfaces automatically.
- **`getByLabel(/regex/i)` locator** (`candidate-profile-validation.spec.ts:255,291`) — already in use for cells 1+3+5+6. Phase 82's cell 4 reuses the pattern.
- **`loginAsCandidate(page)` module-level helper** (`candidate-profile-validation.spec.ts:73-80`) — already hoisted, reusable across cells. Phase 82 cell 4 reuses.
- **`testIds.candidate.profile.submit`** — expected at `tests/tests/utils/testIds.ts`; planner verifies.
- **e2e template Alpha `answersByExternalId` block** — Phase 82 adds 1 new entry following the value-disjointness invariant (no 'alpha' substring).

### Established Patterns

- **Phase 76 P01 fixture-extension additive contract** + **Phase 81 D-07 / D-08 additive sort-numbering** — Phase 82 D-03 inherits: new sort-24 row, no perturbation of sort-19..23 anchors.
- **Phase 76 P01 cell-3 spec pattern + Phase 81 D-11 cells 5+6 pattern** (`candidate-profile-validation.spec.ts:213-247,282-315`) — `loginAsCandidate(page)` → `page.goto(CandAppProfile)` → settle on profile heading → `getByLabel(/regex/i)` → interaction → assert. Phase 82 cell 4 mirrors for the gate assertion.
- **Phase 76 D-04 / Phase 75 D-04 / Phase 81 D-11 scope-marked test-title pattern** — applied to test-title scope-marking in Phase 82 (`A11Y-01 A11Y-07 ...`).
- **Phase 80 D-09 / D-11 / D-12 / Phase 81 D-13 / D-15 determinism contract** — 3-run cold-start + vite-cache wipe + parity-script self-identity. Phase 82 inherits.
- **Phase 80 D-13 / Phase 81 D-12 / D-16 IMGPROXY_TIED_TITLES safety** — verified at CONTEXT authoring; Phase 82 title doesn't collide.
- **Phase 80 D-14 / Phase 81 D-19 locator + lint convention** — role/aria + testIds (for stable form-action anchors) + `playwright/no-raw-locators` `'error'`. Phase 82 inherits.
- **`feedback_skip_ui_spec_for_a11y_only_phases.md` memory precedent** (Phase 76 + Phase 80 + Phase 81 lineage) — UI-SPEC auto-spawn skipped for save-gate / structural / validation-only phases. Phase 82 D-15 inherits.

### Integration Points

- **`apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte`** — Plan 01 modifies: D-01 (1-line `canSubmit` extension at :92).
- **`packages/dev-seed/src/templates/e2e.ts`** — Plan 01 modifies: D-03 (new sort-24 row, ~10 LOC) + Alpha answer cell (~1 LOC).
- **`tests/tests/specs/candidate/candidate-profile-validation.spec.ts`** — Plan 01 modifies: D-05 (new standalone test block, ~30 LOC) + D-09 (docstring update at :23-35).
- **`tests/tests/utils/testIds.ts`** — Plan 01 MAY modify: D-07 (1-line addition for `candidate.profile.submit` IF the entry is missing; planner verifies).
- **`.planning/phases/82-a11y-01-product-gap-cell-required-empty/82-VERIFICATION.md`** — NEW artifact at Plan 01 close. Follows the Phase 80 / Phase 81 verdict shape (4 SCs assessed + verdict + follow-up todos if any).
- **`.planning/todos/done/2026-05-12-a11y-01-product-gap-cells.md`** — Phase 82 closure moves this todo to done (fully resolves the 3-cell scope: Phase 81 closed 5+6, Phase 82 closes 4).
- **`.planning/todos/pending/2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md`** — NEW deferred-todo authored at Phase 82 close per D-02. See <deferred> section for the full content.
- **NO changes to:** `apps/frontend/src/lib/components/input/Input.svelte` (no per-input branch for required-empty — TIGHTEN-SOFT uses the existing `canSubmit` gate); `apps/frontend/src/lib/components/input/QuestionInput.svelte` (dispatch is correct; new fixture row flows through); `apps/frontend/src/lib/components/input/Input.type.ts` (no new InputProps['type'] variant); `apps/frontend/messages/{en,fi,sv,da}/components.json` (no new i18n key); `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` (reactivity edge already in place); `apps/supabase/migrations/` (no schema change); `packages/data/src/` (no type change); `packages/supabase-types/src/database.ts` (no DB-shape change — `required` is per-question convention via `custom_data.required: boolean`, NOT a top-level column); `tests/playwright.config.ts` (`profile-validation` regex already matches); `tests/scripts/diff-playwright-reports.ts` (additive constants update only if 3-run cold-start surfaces the new +1 PASS_LOCKED entry — planner folds in at Plan 01 close).

</code_context>

<specifics>
## Specific Ideas

- **`canSubmit` expression shape (D-01) — concrete diff:**
  ```svelte
  // BEFORE
  let canSubmit = $derived(status !== 'loading');

  // AFTER
  let canSubmit = $derived(status !== 'loading' && allRequiredFilled);
  ```
  No other lines change in `+page.svelte`. The `handleSubmit` guard at `:126-130` already short-circuits with `status = 'error'` when `!canSubmit`; this stays as a defense-in-depth path (button-disable is the primary gate; the guard handles the edge case where a user programmatically dispatches click).

- **New question row (D-03) — concrete shape:**
  ```typescript
  {
    external_id: 'test-question-required-empty-1',
    type: 'text',
    name: { en: 'Required-empty (Phase 82 A11Y-07 anchor)' },
    category: { external_id: 'test-category-info' },
    allow_open: false,
    required: true,
    sort_order: 24,
    is_generated: false
  }
  ```
  Alpha answer: `'test-question-required-empty-1': { value: 'sentinel-82-required' }` (plain string, NOT LocalizedString — matches Phase 81's `test-question-social-1` post-subtype-add pattern noted in Alpha's reason-comment at `e2e.ts:767`).

- **Cell 4 spec contract (D-05) — concrete shape:** standalone `test(...)` block (NOT inside the existing for-loops). visit profile → confirm submit enabled (sanity gate) → clear required field with `getByLabel(/Required-empty \(Phase 82 A11Y-07 anchor\)/i).first().fill('').blur()` → assert `submit.toBeDisabled()` → assert `input.toHaveValue('')` (value-preservation contract on the empty state).

- **BLUR INVARIANT inheritance from Phase 81 D-11:** Input.svelte binds `onchange` (NOT `oninput`); Playwright `fill()` fires DOM `input` events per keystroke but `change` only fires on blur. Phase 82's `fill('')` + `blur()` is REQUIRED to propagate the empty state through `userData.setAnswer → candCtx.requiredInfoQuestions filter → allRequiredFilled re-derivation → canSubmit re-derivation → disabled prop re-render`.

- **Planner re-baseline at PLAN.md time:** Re-run `yarn test:e2e --project=candidate-app-mutation -g "A11Y-01"` at Phase 82 start to confirm the existing 5 cells (image-type / image-size / name-too-long / A11Y-05 / A11Y-06) PASS pre-changes. If any of those 5 cells fail at HEAD-pre-changes, surface as a Phase 82 blocker before authoring cell 4.

- **Risk: existing spec depends on `requiredInfoQuestions.length === 0`** (the empty case). Mitigation: D-14 planner-time scout (`grep -rn "requiredInfoQuestions\|allRequiredFilled\|profileComplete" tests/ apps/frontend/src/`). Expected: no existing spec relies on the empty case. If a dependency surfaces, planner files as a Phase 82 blocker or adds a per-spec seed override.

- **Risk: Phase 79 cascade-block on `candidate-profile-validation.spec.ts`** — verified at scout: Phase 79 closed the cascade-block; Phase 81 successfully extended this spec; Phase 82 is the 6th cell in the same describe scope. No cascade concern expected.

- **Risk: voter-fixture default `voterAnswerCount=16` overlap** — verified at scout: sort 24 > 16, so the voter Likert loop does NOT encounter `test-question-required-empty-1`. Voter app behavior is unaffected.

</specifics>

<deferred>
## Deferred Ideas

- **FUTURE PRODUCT CHANGE (v2.11+) — Allow incomplete profile save + gate opinion-questions entry.** Per D-02 above + user direction at discuss-phase: the long-term UX should allow candidates to SAVE incomplete profiles (so they can work iteratively across sessions) BUT prevent navigation to `/candidate/questions` (opinion questions) until all required info fields are complete. New UX flow:
  - **Submit button** stays ENABLED even when required fields are empty (backtracks Phase 82's TIGHTEN-SOFT gate at `+page.svelte:92`).
  - **`Warning` banner** on `/candidate/profile` explains "complete required profile fields before answering opinion questions" — uses the existing `Warning` component from `$lib/components/warning`.
  - **Navigation guard** on `/candidate/questions` (e.g., `+page.ts` `load` function returns a redirect to `/candidate/profile?reason=incomplete-required` when `allRequiredFilled` is false), OR a guard on the `/candidate/profile`'s submit button's `submitRouting` `$derived.by` block that routes back to home instead of to questions when required-empty.
  - **`submitRouting` update at `+page.svelte:98-109`** — the current logic routes to `CandAppQuestions` only when `allRequiredFilled && unansweredOpinionQuestions.length && !answersLocked` — Phase 82's TIGHTEN-SOFT preserves this; the deferred-todo flow would route to `CandAppHome` with a `?incomplete` flag when `!allRequiredFilled`, AND the Home page would show the warning + a CTA back to profile.
  - **Out-of-scope for v2.10** (the milestone's focused 5-item scope is closed by Phase 83); reasonable v2.11+ candidate for a "candidate UX refinement" milestone.
  - **Authored todo file:** `.planning/todos/pending/2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md` — Phase 82 close writes this file with the full scope, rationale, dependencies, and acceptance criteria. References Phase 82 CONTEXT D-02 + this <deferred> section.

- **REJECT-with-inline-error variant** — Phase 82 picked TIGHTEN-SOFT over REJECT-with-inline-error. The REJECT variant would add: (a) Input.svelte per-input "required and empty" branch in `handleChange` that fires on blur OR a submit-time validation broadcast; (b) save-handler short-circuit at `handleSubmit:125-143` that aborts BEFORE `userData.save()` when any required is empty; (c) new i18n key `components.input.error.required` in all 14 locale catalogs (7 Paraglide + 7 legacy per Phase 78 CLEAN-04). Substantially larger code surface than TIGHTEN-SOFT; Phase 82's gate-only approach is the minimum-diff cell-closer. If the user-experience research surfaces that the disabled button is too quiet (i.e., users don't notice WHY the button is disabled), the REJECT variant is the natural escalation — could land in the same v2.11+ "candidate UX refinement" milestone alongside the deferred-todo above.

- **SOFT-WARN-ONLY close (no code change)** — Phase 82 picked TIGHTEN-SOFT over SOFT-WARN-ONLY. SOFT-WARN-ONLY would close cell 4 as PRODUCT-CONFIRMED with zero code change. REJECTED because the existing canSubmit gating is actually a LIE (button is NOT disabled today despite the badge saying "Required"); closing the cell without fixing the lie perpetuates a user-visible inconsistency. TIGHTEN-SOFT is the minimum-diff path that makes the badge match the button.

- **Promote existing `test-question-displayname` to required:true** — Phase 82 picked additive new sort-24 row over promoting an existing fixture row. The promote-existing alternative has a smaller diff but couples to Phase 76 P01 cell 3 (maxlength on displayname) and Phase 76 P02 reload-persistence anchors. Additive new row is cleaner per Phase 81 D-07 / D-08 precedent.

- **Cell 4 stronger assertions (notice opacity flip + refill round-trip)** — Phase 82 picked the tight "button-disabled gate" contract over the stronger "+ notice opacity flip" or "+ refill restores enable" variants. The stronger variants are nice-to-haves but verify implementation details (CSS class toggle, reactive round-trip) rather than the TIGHTEN-SOFT product contract itself. If a regression surfaces in those areas during execution, planner MAY add targeted assertions.

- **Spec discriminant expansion (`kind: 'gate'` in TEXT_CELLS for-loop)** — Phase 82 default is a standalone `test(...)` block per D-06. If a future cell expands the gate kind, the planner can refactor to a `kind: 'gate'` discriminant in TEXT_CELLS and consolidate. Not worth the abstraction overhead for a single cell.

- **`apps/frontend/messages/*/components.json` i18n key audit** (inherited Phase 81 deferred) — Phase 78 CLEAN-04 tightened the i18n wrapper but did not run a full key-coverage audit across all 14 locale catalogs (7 Paraglide + 7 legacy). Phase 82 adds NO i18n keys (TIGHTEN-SOFT has no error message), so this audit follow-up does NOT apply to Phase 82's scope but remains a v2.11+ candidate.

### Reviewed Todos (not folded)

`gsd-sdk query todo.match-phase 82` surfaced 18 keyword-matched todos at score 0.6 (none above 0.6 threshold for auto-fold). The single relevant match is folded directly as the source of truth:

- `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` — IS the cite-and-fix source for Phase 82 (cell 4). Phase 82 closure moves this todo to `.planning/todos/done/` (full 3-cell resolution: Phase 81 closed 5+6, Phase 82 closes 4).

Other matches (score 0.6, keyword-only) route to OTHER phases per `.planning/STATE.md §"Deferred Items"`:

- `2026-05-12-a11y-axe-first-run-violations.md` → Phase 80 (closed 2026-05-13).
- `2026-05-12-candidate-profile-cascading-race.md` → Phase 79 (closed 2026-05-13).
- `2026-05-12-settings-02-voter-authoring-product-gap.md`, `2026-05-12-settings-03-voter-required-product-gap.md`, `2026-05-12-voters-layout-non-reactive-appsettings.md`, `2026-05-13-filtergroup-or-mode-ui-product-gap.md`, `2026-05-13-constituency-filter-product-gap.md` — re-deferred to v2.11+ (per PROJECT.md v2.10 milestone framing).
- `2026-05-13-candidate-profile-image-upload-cascade.md`, `2026-05-13-voter-matching-detail-flakes.md` → Phase 83 (DETERM-06 + DETERM-07).
- `2026-05-12-qspec-01-i18n-hardening.md`, `2026-05-12-qspec-02-multi-choice-categorical-variant.md`, `2026-05-12-58-e2e-audit-addendum-qspec.md` → backlog (QSPEC follow-ups).
- `2026-05-11-e2e-01-single-locale-runtime-override.md`, `2026-05-09-rewrite-parent-answer-imputation.md`, `2026-05-08-cleanup-65-01-bind-rationale-comments.md`, `2026-04-30-alliance-tab-rendering-and-sections-config.md`, `2026-04-25-remove-mergesettings-reexports.md`, `2026-03-28-investigate-migrating-candidate-answer-store.md`, `2026-03-28-generalize-candidate-app-to-party-app.md`, `frontend-project-id-scoping.md`, `password-reset-code-method.md`, `register-page-registrationkey-method.md` — unrelated to A11Y-07 scope (keyword-only matches on generic terms like "phase", "plan", "candidate").

Folding any of these into Phase 82 would create scope conflict.

</deferred>

---

*Phase: 82-A11Y-01 PRODUCT-GAP Cell — Required-Empty*
*Context gathered: 2026-05-13*
