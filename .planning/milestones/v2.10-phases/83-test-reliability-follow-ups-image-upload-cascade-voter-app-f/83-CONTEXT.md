# Phase 83: Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) + v2.10 Milestone-Close Hygiene - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the 2 test-reliability surfaces that Phase 79 DETERM-04's fix exposed AND clear the 3 advisory follow-ups from Phase 82's code review (folded 2026-05-13 post-Phase-82-close as v2.10 milestone-close hygiene). 7 success criteria across one PLAN.md:

1. **DETERM-06 — image-upload cascade resolution.** `tests/tests/specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03)` (line 164) currently TIMEOUT-fails on `waitForEvent('filechooser')` in cold-start, cascade-skipping 5 downstream tests in its `serial` describe block (`A11Y-02 should persist bio` / `A11Y-02 should persist display name` / `A11Y-02 should persist social link` / `should persist profile image after page reload (CAND-12)` / `should show editable info fields on profile page (CAND-03)`). Phase 70 P03 already refactored the file-trigger from `<label tabindex="0">` to `<button type="button">` at `Input.svelte:532-557` — `ProfilePage.uploadImage()` at `tests/tests/pages/candidate/ProfilePage.ts:34` is selector-drifted, still targets the removed `<label tabindex="0">`. Phase 83 lands a structural selector fix (D-01a) and escalates per a cheapest-first ladder if the 1-run cold-start smoke still reproduces the cascade.

2. **DETERM-07 — voter-app flake stabilization.** Two test surfaces:
   - `voter-app :: specs/voter/voter-matching.spec.ts > should show worst match candidate as last result` — IN PASS_LOCKED today (line 160 of `tests/scripts/diff-playwright-reports.ts`), flakes ~33% (2/6 cold-start runs). Root-cause hypothesis (operator-confirmed): the `@openvaa/matching` ordering is deterministic (fixed seeds + module-scope independent computation per spec lines 27-58), so the flake is partial-hydration — `cards.last()` is asserted before the full result-list has finished hydrating, so `lastCard` points to a transient mid-hydration tail.
   - `voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs` (line 124 of voter-detail.spec.ts) — currently in FAILURE-CLASS rationale block at `diff-playwright-reports.ts:80-90`, 1/6 fail in Phase 79 captures. Same hydration-completeness lens — drawer-open races results-page hydration / entity-list reactivity.

   Both get the SAME treatment: investigate-and-fix via the partial-hydration hypothesis (D-02), KEEP `worst match` in PASS_LOCKED, PROMOTE `party detail drawer` from FAILURE-CLASS into PASS_LOCKED.

3. **Phase 82 advisory follow-ups (3 items, folded 2026-05-13):**
   - **WR-01:** Cross-spec coupling in `tests/tests/setup/templates/variant-hidden-required.ts` overlay. Phase 82 added `test-question-required-empty-1` with `custom_data.required:true` to the base seed (`packages/dev-seed/src/templates/e2e.ts:702-740`); the SETTINGS-03 overlay's candidate-row mapper (lines 169-179) only deletes `test-question-displayname` from Alpha's `answersByExternalId`, NOT `test-question-required-empty-1`. Today the SETTINGS-03 spec at `tests/tests/specs/candidate/candidate-required-info.spec.ts:114-145` asserts `unansweredRequiredInfoQuestions.length !== 0` (tolerates the +1 row), but the InfoBadge at `apps/frontend/src/routes/candidate/(protected)/+page.svelte:121` renders `1` where it could/should render `2`. **Option (b) chosen** — extend overlay to ALSO delete `test-question-required-empty-1` from Alpha + tighten spec assertion to `=== 2`. Eliminates the cross-spec coupling outright rather than papering over it with a hygiene comment.
   - **IN-01:** Stale "3 cells" docstring count in `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:6,51`. Fix specified in roadmap: line 6 `"Covers 3 reliably-renderable cells"` → `"Covers 6 reliably-renderable cells (3 original + 2 Phase 81 lifts + 1 Phase 82 standalone)"`; line 51 `"all 3 test titles are PREFIXED 'A11Y-01 '"` → `"all 6 test titles"`. Purely cosmetic.
   - **IN-02:** Phase 81 deferred `+2 PASS_LOCKED` backfill for A11Y-05 email-format + A11Y-06 url-format. These cells PASS in `candidate-app-mutation` per Phase 82 SUMMARY's regression result but were intentionally deferred from Phase 81 P01's regen ("v2.10 milestone-close pre-release regen is the canonical home"). Phase 83 is that home. Add 2 entries to `PASS_LOCKED_TESTS` array at `tests/scripts/diff-playwright-reports.ts:111-193` in alphabetical position; bump jsdoc count `81` → `83 + N` (where N reflects DETERM-06/07 net PASS_LOCKED shifts).

4. **Verification gate via fresh constants regen, conditional on PASS_LOCKED shift.** Phase 83 IS expected to shift PASS_LOCKED — likely +1 from DETERM-07b promotion (party drawer) + 2 from IN-02 backfill + possibly more from DETERM-06's 5-cascade unblock = `81 + ~5 ≈ 86 PASS_LOCKED`. If PASS_LOCKED shifts, run a fresh 3-run cold-start gate via the archived `regen-constants.mjs` at `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` (preserved verbatim per Phase 79 D-07). If PASS_LOCKED does NOT shift (only if DETERM-06 is fixed without unblocking any cascade-pool test AND DETERM-07b stays in FAILURE-CLASS AND WR-01 spec assertion has no PASS_LOCKED footprint — unlikely), the v2.10 verification anchor at SHA `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5` is preserved verbatim.

5. **Both follow-up todos move to `.planning/todos/done/` at phase close** (`2026-05-13-candidate-profile-image-upload-cascade.md` + `2026-05-13-voter-matching-detail-flakes.md`). Phase 82 advisory follow-ups (WR-01, IN-01, IN-02) are tracked inline in the Phase 82 REVIEW.md — no separate todo files to move.

**Out of scope (deferred to v2.11+):**
- Investigating WHY the Phase 70+ refactor of Input.svelte (label → button) wasn't picked up in ProfilePage.uploadImage (Phase 76 deferred-items §1 already documented it; Phase 83 just fixes it).
- Hardening the assertion patterns across the rest of the voter-app + candidate-app specs to use hydration-completeness guards (Phase 83 fixes only the 2 known flake surfaces; a sweep is a v2.11+ project).
- `[storage.image_transformation]` re-enable in `apps/supabase/supabase/config.toml:130-131` (only if (a)+(b) of the ladder fail; per D-01c).
- DATA_RACE pool growth (per Phase 73 D-09 binding — pool MUST NOT grow; structurally locked).

Phase 83 is v2.10's milestone-close phase. After Phase 83, v2.10 is gate-clean and ready for ship/audit per `.planning/MILESTONES.md`.

</domain>

<decisions>
## Implementation Decisions

### DETERM-06 — image-upload cascade mitigation ladder

- **D-01a — PRIMARY: selector-drift fix in `ProfilePage.uploadImage()` at `tests/tests/pages/candidate/ProfilePage.ts:24-37`.** Replace `imageArea.locator('label[tabindex="0"]').click()` (line 34) with `imageArea.getByRole('button').first().click()`. Phase 70 P03 refactored `Input.svelte:532-557` from a presentational `<label tabindex="0">` to a `<button type="button" id="{id}-image-label" onclick={() => fileInput?.click()}>`. The page-object comment at lines 27-32 (claiming the trigger is a "<label tabindex='0'>") is stale and MUST be replaced with a comment that documents the current `<button>` shape + the `aria-labelledby="{id}-label {id}-image-label"` association at `Input.svelte:563`. Drop the `// eslint-disable-next-line playwright/no-raw-locators` exemption — `getByRole('button')` is canonical Playwright API. **Rationale:** structural cause; matches Phase 76 deferred-items §1 recommendation; cheapest fix; aligns with `playwright/no-raw-locators` policy.
- **D-01b — ESCALATION step 1 (contingent on D-01a 1-run smoke failure):** Add 500ms pre-filechooser settle delay in `ProfilePage.uploadImage()` BEFORE the `waitForEvent('filechooser')` registration, per Phase 76 P01 mitigation pattern. **Trigger:** D-01a's 1-run cold-start smoke (per Phase 79 D-12) reproduces the cascade.
- **D-01c — ESCALATION step 2 (contingent on D-01b 1-run smoke failure):** Uncomment `[storage.image_transformation]` block at `apps/supabase/supabase/config.toml:130-131`. **Trigger:** D-01b's 1-run cold-start smoke STILL reproduces the cascade. Document in PLAN.md as a contingent task that the planner authors but executor only runs if escalated. **REJECTED at the outset:** `imgproxy re-enable` as a primary fix — re-enabling cold-start image transformation may shift other DATA_RACE-pool tests' timing in unintended ways; the selector drift is the obvious structural cause per Phase 70's Input.svelte refactor history.

- **D-01d — Escalation cadence: 1-run cold-start smoke between each ladder step.** Per Phase 79 D-12, run a 1-run cold-start smoke (`yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean` then `yarn test:e2e --project=candidate-app-mutation --workers=1` per Phase 79 D-13 canonical chain) after D-01a lands; if 0 cascade in the serial describe block, escalation halts and we proceed to the 3-run gate (D-08). If cascade reproduces, escalate to D-01b. Same gate between D-01b and D-01c. Caps wall-time: worst-case 3 × 1-run smokes + 1 × 3-run gate ≈ 54 + 54 + 54 + 162 = 324 min ≈ 5.4h.

- **D-01e — On D-01a success: drop the stale `<label tabindex="0">` jsdoc paragraph at `ProfilePage.ts:27-32` AND the `eslint-disable-next-line playwright/no-raw-locators` line.** Replace with a single-paragraph jsdoc that documents the current `<button>` shape + the `aria-labelledby="{id}-label {id}-image-label"` accessible-name composition at `Input.svelte:563` + the `fileInput?.click()` programmatic-trigger flow. Keep the file under tight maintainer hygiene per `feedback_a11y_actual_axe_scan_first.md` memory's lesson about stale assumptions.

### DETERM-07 — voter-app flake stabilization (shared hydration-completeness hypothesis)

- **D-02 — Root cause hypothesis (operator-confirmed): PARTIAL-HYDRATION RACE, not non-deterministic ordering.** The `@openvaa/matching` algorithm is deterministic given fixed seeds + identical input — the spec at `tests/tests/specs/voter/voter-matching.spec.ts:27-58` independently computes the expected ordering from `E2E_QUESTIONS` + `E2E_DEFAULT_CANDIDATES` + `E2E_VOTER_CANDIDATES` and compares it to the rendered UI. The flake is the UI being asserted against BEFORE the result-list has finished hydrating, so `page.getByTestId(testIds.voter.results.card).last()` returns a transient mid-hydration tail card. Same lens applies to `voter-detail.spec.ts > should open party detail drawer` — the drawer-open click races entity-list reactivity / results-page hydration.

- **D-03a — DETERM-07a fix shape: assert expected card count BEFORE indexing `.last()` / `.first()`.** Concrete shape at `voter-matching.spec.ts:238-246`:
  ```typescript
  test('should show worst match candidate as last result', async ({ page }) => {
    await navigateToResults(page);

    const cards = page.getByTestId(testIds.voter.results.card);

    // Phase 83 DETERM-07a: hydration-completeness guard — assert the FULL result-list
    // has rendered before indexing into .last(). Without this, partial-hydration races
    // produced flake under post-Phase-79 cold-start timing (was 33% flake rate per
    // sha256.txt across 6 captures). EXPECTED_CARD_COUNT derived from independent
    // matching computation at module scope (see lines 27-58).
    await expect(cards).toHaveCount(EXPECTED_CARD_COUNT);

    const lastCard = cards.last();
    const opposeName = `${opposeCandidate.first_name} ${opposeCandidate.last_name}`;
    await expect(lastCard).toContainText(opposeName);
  });
  ```
  Planner derives `EXPECTED_CARD_COUNT` from the same module-scope computation that already feeds `agreeCandidate` / `opposeCandidate` / `partialCandidate` / `hiddenCandidate` (likely `allOpinionAnswerableCandidates.length - hiddenCount`). If the same partial-hydration race affects sibling tests in the same `serial` describe block (`should show perfect match candidate as top result` at line ~225, `should display candidates in correct match ranking order`, `should show partial-answer candidate in results with valid score` at line 248), prefer extracting a helper `expectResultsHydrated(page, expectedCount)` and calling it once per test rather than inlining the guard. Planner picks the call-site shape at PLAN.md time.

- **D-03b — DETERM-07b fix shape: hydration-completeness guard before drawer-open click.** At `voter-detail.spec.ts:124` (`should open party detail drawer ...`), assert the entity-list has hydrated (e.g., `await expect(page.getByTestId(testIds.voter.results.card)).toHaveCount(expectedPartyCount)`) BEFORE clicking the party card that opens the drawer. The drawer-open click MUST land on a fully-reactive element. Planner derives `expectedPartyCount` from the same fixture-counts logic that powers the existing PASS_LOCKED voter-detail tests at lines 35-148 (e.g., `should open candidate detail drawer when clicking a result card`).

- **D-03c — Verification cadence: 3-run cold-start identity REQUIRED for both DETERM-07a AND DETERM-07b promotion.** Per Phase 79 D-08, both flakes need SHA-256-identical results across 3 cold-start runs to merit PASS_LOCKED status (or PASS_LOCKED preservation for `worst match`). If either fix fails to produce 3-run identity (e.g., still flakes 1/3), apply Phase 79 D-09 instability protocol (re-run + investigate). DO NOT demote either test to `test.skip()` or FAILURE-CLASS without first attempting the hydration-completeness fix.

- **D-04 — DETERM-07b PASS_LOCKED promotion shape.** On successful 3-run identity:
  - REMOVE the "voter-detail 'should open party detail drawer'" narrative from the FAILURE-CLASS comment block at `tests/scripts/diff-playwright-reports.ts:80-90` (lines 84-86 mention both flakes — only the worst-match reference there gets retained since it remains in PASS_LOCKED; the party-drawer reference is fully struck).
  - ADD `'voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs'` to `PASS_LOCKED_TESTS` array at line 111-193 in ALPHABETICAL position (right after `'voter-app :: specs/voter/voter-detail.spec.ts > should open candidate detail drawer when clicking a result card'` at line 147).
  - Bump the jsdoc count at line 110 to reflect the net shift.

### Phase 82 advisory follow-ups

- **D-05 — WR-01 chose option (b): EXTEND OVERLAY + TIGHTEN SPEC ASSERTION.** Concrete shape:
  - At `tests/tests/setup/templates/variant-hidden-required.ts:169-179` (candidate-row mapper), extend the `if (row.external_id === 'test-candidate-alpha')` branch to also `delete answers['test-question-required-empty-1']` alongside the existing `delete answers['test-question-displayname']` (line 174). After deletion, both `customData.required:true` info questions (displayname AND required-empty-1) are unanswered in Alpha → `unansweredRequiredInfoQuestions.length === 2` in the SETTINGS-03 variant.
  - At `tests/tests/specs/candidate/candidate-required-info.spec.ts:114-145` (SETTINGS-03 spec), tighten the assertion from `expect(unansweredRequiredInfoQuestionsLength).not.toBe(0)` (or equivalent) to `expect(unansweredRequiredInfoQuestionsLength).toBe(2)`. Planner reads the spec carefully — the assertion may be against the InfoBadge text rendered at `apps/frontend/src/routes/candidate/(protected)/+page.svelte:121` rather than against `candCtx.unansweredRequiredInfoQuestions.length` directly; in that case the assertion shape is `await expect(infoBadge).toHaveText('2')`.
  - Phase 82 REVIEW.md §WR-01 explicitly noted option (b) as the more correct fix (eliminates the implicit additive coupling); reviewer recommended (a) only for minimum-diff. User-chosen here: (b) is correct, the additional surface area is small (2-3 lines per file).
  - **CASCADE pool note:** the SETTINGS-03 spec (`candidate-required-info.spec.ts`) is CASCADE-pooled per Phase 79 binding — it does NOT run in the cold-start baseline today. Phase 83's DETERM-06 fix (D-01a..c) MAY unblock the `variant-hidden-required-candidate` cascade chain — if so, the WR-01 (b) spec assertion change MUST be in place BEFORE the cascade unblocks, OR the spec will fail in the post-fix cold-start gate. **Ordering implication for the planner:** land WR-01 (b) in the same atomic commit as DETERM-06's D-01a (or in an earlier commit), so the spec assertion is correct by the time the cascade chain re-runs.

- **D-06 — IN-01: docstring count fix in `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` (lines 6 and 51).** Concrete edits per the Phase 82 REVIEW.md §IN-01 fix-text spec:
  - Line 6 (existing): `* Covers 3 reliably-renderable cells against the existing product surface`
    → `* Covers 6 reliably-renderable cells against the existing product surface (3 original + 2 Phase 81 lifts + 1 Phase 82 standalone)`
  - Line 51 (existing): `* All 3 test titles are PREFIXED \`A11Y-01 \``
    → `* All 6 test titles are PREFIXED \`A11Y-01 \``
  - **Verification:** the count claims become true by inspection — 3 IMAGE_CELLS/TEXT_CELLS loop iterations (image-type, image-size, name-too-long maxlength) + 2 format-loop additions (A11Y-05 email, A11Y-06 url) + 1 standalone test (A11Y-07 required-empty disables submit button via canSubmit gate) = 6. Planner counts the actual `test(...)` declarations in the post-Phase-82 file body to be SURE — if a hidden 7th cell exists or counts are off by one, planner updates the proposed text.
  - **Purely cosmetic:** no test added/removed; no PASS_LOCKED footprint.

- **D-07 — IN-02: Phase 81 deferred +2 PASS_LOCKED backfill (A11Y-05 + A11Y-06).** Concrete edits to `tests/scripts/diff-playwright-reports.ts:110-193`:
  - Add 2 entries to `PASS_LOCKED_TESTS` array in ALPHABETICAL position alongside the existing A11Y-01 cells at lines 124-127:
    - `'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 A11Y-05 email-format rejection surfaces invalidEmail error'` (or whatever the canonical test title is — planner reads the actual `test(...)` body at lines 234-275 or thereabouts to capture the EXACT title verbatim).
    - `'candidate-app-mutation :: specs/candidate/candidate-profile-validation.spec.ts > A11Y-01 A11Y-06 url-format rejection surfaces invalidUrl error'` (same — planner captures EXACT title).
  - Update the jsdoc at line 110 from `81 tests locked PASSING on Phase 82 baseline` to `83 tests locked PASSING on Phase 83 baseline (Phase 82 baseline 81 + 2 Phase 81 deferred backfills: A11Y-05 email-format + A11Y-06 url-format)`. If DETERM-06 / DETERM-07 ALSO shift PASS_LOCKED (likely +1 from DETERM-07b promotion + ~5 from DETERM-06 unblock), the count becomes `83 + N` and the jsdoc reflects the net.
  - Strike the Phase 81 deferred-backfill caveat from the jsdoc (the sentence starting "NOTE: Phase 81's +2 NET-ADDITIONS..." through "...is the canonical home for backfilling both."). Replace with a one-line note: `Phase 81's deferred +2 backfilled in Phase 83 (v2.10 milestone-close hygiene).`.

### Plan structure + verification gate (Claude's discretion — user skipped this gray area)

- **D-08 — Single PLAN.md covers all 7 SCs.** Single plan file at `.planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/83-01-PLAN.md`. Task breakdown (planner refines):
  1. WR-01 (b) overlay extend + spec tighten (D-05) — LANDS FIRST (or atomically) before DETERM-06 unblocks SETTINGS-03 cascade.
  2. DETERM-06 D-01a selector-drift fix + jsdoc refresh (D-01e).
  3. DETERM-06 1-run cold-start smoke (D-01d) — gates escalation to D-01b/c.
  4. DETERM-07a `worst match` hydration-completeness guard (D-03a).
  5. DETERM-07b `party detail drawer` hydration-completeness guard (D-03b).
  6. IN-01 docstring count fix (D-06) — trivial, can co-land with any of the above.
  7. 3-run cold-start gate (D-09) — IF PASS_LOCKED shifts (almost certain).
  8. IN-02 +2 PASS_LOCKED backfill + DETERM-07b promotion + jsdoc updates (D-04, D-07) — folded into the same constants regen commit as task 7.
  9. Move both follow-up todos to `.planning/todos/done/`.
  - Atomic-commit strategy per Phase 79 D-10 precedent: ONE commit per task above when feasible; tasks 7-8 are a SINGLE atomic commit (preserves Phase 73 self-contained-constants pattern).

- **D-09 — Verification gate: 3-run cold-start regen via Phase 79's archived `regen-constants.mjs`.** Mechanism: `node .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` against a Phase-83-captured `run-3.json`. Trigger: `if PASS_LOCKED shifts` — almost certainly fires (D-04 +1 net for DETERM-07b promotion + D-07 +2 net for IN-02 backfill + DETERM-06 cascade unblock potentially adding 5 more). If PASS_LOCKED does NOT shift (only if DETERM-06 fix has 0 cascade-unblock footprint AND DETERM-07b stays demoted — unlikely), skip the regen, preserve the v2.10 anchor at SHA `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5` verbatim.

- **D-10 — Gate execution: agent-inline via Bash run_in_background per Phase 79 D-11.** ~54 min per cold-start × 3 runs = ~162 min total wall time. Agent runs autonomously; operator (kalle) explicitly OK with unattended execution per Phase 79 precedent.

- **D-11 — Verification anchor preservation contract.** The Phase 79 v2.10 anchor at SHA `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE) is the BINDING parity gate UP TO this phase. Phase 83's regen ABSORBS the anchor and produces the new v2.10-close anchor (likely 86 PASS_LOCKED + 15 DATA_RACE + 52 CASCADE; planner verifies post-gate). The new anchor is what v2.11+ measures against.

### Claude's Discretion

- Planner picks the exact alphabetical insertion point for the 2 IN-02 backfill entries and the 1 DETERM-07b promotion entry in `PASS_LOCKED_TESTS` (per D-04 + D-07).
- Planner picks the helper-extraction question for the hydration-completeness guard (inline guard per test vs. `expectResultsHydrated(page, expectedCount)` helper) per D-03a's note about sibling-test impact.
- Planner picks the EXACT verbatim test titles for IN-02 backfill — reads the live `test(...)` declarations in `candidate-profile-validation.spec.ts` at PLAN.md time to capture them precisely.
- Planner picks how to derive `EXPECTED_CARD_COUNT` / `expectedPartyCount` in D-03a + D-03b (module-scope constant vs. function vs. existing fixture export).
- Planner picks whether to land D-05 (WR-01 overlay extend + spec tighten) as 1 commit or 2 (overlay change + spec assertion change). Recommended: 1 commit, since the two changes are causally linked.
- Planner picks the WR-01 spec-assertion shape (`expect(unansweredRequiredInfoQuestions.length).toBe(2)` vs. `expect(infoBadge).toHaveText('2')`) after reading `candidate-required-info.spec.ts:114-145` to see what's actually being asserted today.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + REQUIREMENTS

- `.planning/ROADMAP.md` §"Phase 83: Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) + v2.10 Milestone-Close Hygiene" — 7 success criteria, structural dependencies (Phase 79 DETERM-04 green prerequisite).
- `.planning/REQUIREMENTS.md` — DETERM-06, DETERM-07 (Phase 83 REQs).

### Follow-up todos (Phase 83 scope inputs)

- `.planning/todos/pending/2026-05-13-candidate-profile-image-upload-cascade.md` — DETERM-06 source-of-truth. 3 root-cause hypotheses + 3 cheapest-first mitigation ladder + cross-references to Phase 79 + Phase 76 P01.
- `.planning/todos/pending/2026-05-13-voter-matching-detail-flakes.md` — DETERM-07 source-of-truth. 2 flake surfaces + Phase 79 D-09 binding constraints + 6-run sha256.txt evidence.

### Phase 79 (DETERM-04 + DETERM-05) anchor + protocols

- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — Phase 83's regen mechanism (D-09). PRESERVED VERBATIM.
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/sha256.txt` — 6-run cold-start identity record. Anchor SHA `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5`. Both DETERM-07 flake surfaces evidenced here.
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-CONTEXT.md` §"3-Run Cold-Start Gate Execution" (D-11, D-12, D-13) — gate execution protocol Phase 83 inherits (agent-inline, 1-run smoke before 3-run gate, canonical Likert-only-reset chain).
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-CONTEXT.md` §"Constants Regen (DETERM-05)" (D-07, D-08, D-09, D-10) — regen mechanism / strict SHA-256 identity gate / instability protocol / atomic commit shape.

### Phase 82 advisory follow-ups

- `.planning/phases/82-a11y-01-product-gap-cell-required-empty/82-REVIEW.md` §WR-01, §IN-01, §IN-02 — concrete fix-text + locations + rationale for each of the 3 advisory items.
- `.planning/phases/82-a11y-01-product-gap-cell-required-empty/82-CONTEXT.md` D-13, D-14 — Phase 82 invariants that WR-01 (b) tightens.

### Phase 76 prior observations of DETERM-06 selector drift

- `.planning/milestones/v2.9-phases/76-profile-a11y/deferred-items.md` §1 — Phase 76 deferred-items already documented the `ProfilePage.uploadImage` selector drift and recommended `getByRole('button').first()` (now adopted in D-01a).

### Code surfaces touched by Phase 83

- `tests/tests/pages/candidate/ProfilePage.ts:24-37` — `uploadImage()` selector fix (D-01a) + jsdoc refresh (D-01e).
- `apps/frontend/src/lib/components/input/Input.svelte:526-579` (image-input render block) — REFERENCE ONLY; Phase 83 does NOT modify Input.svelte. Documents the post-Phase-70 `<button type="button" id="{id}-image-label">` + hidden `<input type="file">` + `aria-labelledby="{id}-label {id}-image-label"` shape that D-01a aligns ProfilePage to.
- `apps/supabase/supabase/config.toml:130-131` — `[storage.image_transformation]` re-enable (D-01c contingent escalation only).
- `tests/tests/specs/candidate/candidate-profile.spec.ts:164-182` (`should upload a profile image (CAND-03)`) — REFERENCE ONLY; Phase 83 does NOT modify this spec. Documents the cascade-source test.
- `tests/tests/specs/voter/voter-matching.spec.ts:238-246` (`should show worst match candidate as last result`) — DETERM-07a fix shape (D-03a).
- `tests/tests/specs/voter/voter-detail.spec.ts:124-???` (`should open party detail drawer with info, candidates, and opinions tabs`) — DETERM-07b fix shape (D-03b). Planner reads the full test body at PLAN.md time.
- `tests/tests/setup/templates/variant-hidden-required.ts:169-179` (candidate-row mapper) — WR-01 (b) overlay extend (D-05).
- `tests/tests/specs/candidate/candidate-required-info.spec.ts:114-145` — WR-01 (b) spec assertion tighten (D-05).
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts:6,51` — IN-01 docstring count fix (D-06).
- `tests/scripts/diff-playwright-reports.ts:80-90` (FAILURE-CLASS rationale block) — DETERM-07b promotion narrative strike (D-04).
- `tests/scripts/diff-playwright-reports.ts:110-193` (PASS_LOCKED_TESTS jsdoc + array) — IN-02 backfill + DETERM-07b promotion + jsdoc count bump (D-04, D-07).
- `apps/frontend/src/routes/candidate/(protected)/+page.svelte:121` (InfoBadge for unansweredRequiredInfoQuestions count) — REFERENCE ONLY for the WR-01 (b) spec assertion shape decision (D-05 final bullet).

### Project conventions

- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — reactive accessor reads required (`candCtx.X`); applies if planner touches +page.svelte's InfoBadge wiring (only if WR-01 (b) spec assertion is against the InfoBadge text rather than `candCtx.unansweredRequiredInfoQuestions.length`).
- `.agents/code-review-checklist.md` — code review checklist applies to all Phase 83 changes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Phase 79 archived `regen-constants.mjs`** at `.planning/phases/79-…/post-fix/regen-constants.mjs` — Phase 83's verification gate mechanism. Self-contained per Phase 79 D-07; preserves IMGPROXY_TIED_TITLES verbatim per Phase 73 D-09 binding.
- **Phase 79 canonical Likert-only-reset chain** (`yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`) per Phase 79 D-13 + LANDMINE-9 — required for cold-start determinism; the `--likert-only` flag does NOT forward through `yarn db:reset-with-data` per CLAUDE.md note.
- **Phase 79 D-09 instability protocol** — re-run + investigate flake before regen against non-stable baseline. Phase 83 inherits for D-03c (3-run identity check after DETERM-07a/b fixes).
- **Phase 76 P01 pre-filechooser settle delay pattern** — contingent reuse path for D-01b escalation if D-01a alone fails.
- **`@openvaa/matching` independent computation pattern at voter-matching.spec.ts:27-58** — module-scope expected-ordering computation that's already deterministic; Phase 83 D-03a leverages it to derive `EXPECTED_CARD_COUNT` rather than introducing a new fixture export.

### Established Patterns

- **Phase 73 D-09 IMGPROXY_TIED_TITLES structural binding** at `tests/scripts/diff-playwright-reports.ts:145-162` — DATA_RACE pool MUST NOT grow. Phase 83's DETERM-07 fixes MUST NOT add either flake surface to DATA_RACE; only PASS_LOCKED promotion / FAILURE-CLASS demotion is legal (per Phase 73 D-09 binding). Operator's DETERM-07a hint already eliminates the demotion path — both flakes get the fix.
- **`playwright/no-raw-locators` lint policy** — D-01a drops the existing `// eslint-disable-next-line playwright/no-raw-locators` exemption at `ProfilePage.ts:33` by switching to `getByRole('button')`. Aligns with the project-wide lint baseline. (Phase 70 P03 inadvertently created the exemption by refactoring Input.svelte; Phase 83 closes the loop.)
- **Atomic-commit-per-task pattern** (Phase 79 D-10 precedent) — each Phase 83 task lands its own commit; the constants regen commit is the ONE exception (it's bundled with DETERM-07b promotion + IN-02 backfill + jsdoc updates).
- **Phase 70 P03 Input.svelte refactor history** — the `<label tabindex="0">` → `<button type="button">` change at `Input.svelte:532` introduced the selector drift that DETERM-06 surfaces. Phase 83 D-01a closes this 3-phase-old loop.

### Integration Points

- **WR-01 (b) ordering constraint:** the SETTINGS-03 spec is CASCADE-pooled today. When DETERM-06's fix unblocks the variant-hidden-required-candidate cascade chain, `candidate-required-info.spec.ts:114-145` runs again. The WR-01 (b) spec-assertion tighten (`=== 2`) MUST be in place by then. Planner orders the PLAN.md tasks so WR-01 (b) lands BEFORE DETERM-06's first commit (or atomically).
- **DETERM-06 cascade unblock potential** — the 5 downstream tests in `candidate-profile.spec.ts`'s serial describe block (`A11Y-02` × 3 + `CAND-12` × 1 + `CAND-03` × 1) are currently CASCADE-pooled. On DETERM-06 close, they may promote to PASS_LOCKED automatically (if they were structurally passing pre-cascade). Phase 83's D-09 3-run gate captures this; the IN-02 jsdoc count `83 + N` reflects whatever the actual net is post-gate.
- **DETERM-07b CASCADE-vs-FAILURE-CLASS status** — the `party detail drawer` test is currently in the FAILURE-CLASS rationale block but NOT in any pool array. On promotion to PASS_LOCKED, the rationale block narrative is struck (the worst-match reference stays because it's already in PASS_LOCKED, just flaky); the test goes into the alphabetical PASS_LOCKED_TESTS position.

</code_context>

<specifics>
## Specific Ideas

- **Operator's DETERM-07a RCA hint (captured during discuss-phase):** "very unlikely that the order be indeterministic. Perhaps also make sure the number of results shown is complete." This is a domain-expert root-cause hint that drove D-02's partial-hydration hypothesis. The matching algorithm IS deterministic given the spec's module-scope independent computation; the flake is the UI being asserted before hydration completes. Phase 83 fix builds on this hint: `expect(cards).toHaveCount(EXPECTED_CARD_COUNT)` BEFORE `.last()` / `.first()` indexing.

- **Cheapest-first escalation ladder for DETERM-06:** user explicitly chose "Run (a) first, escalate if cascade reproduces" over the pre-emptive belt-and-suspenders options (a+b) or (a+c). This pattern matches Phase 76 deferred-items §1's recommendation and Phase 79 D-12's 1-run-smoke-before-3-run-gate ethos. Plan structure absorbs this: 1-run smoke after each ladder step, escalate only on failure.

- **WR-01 option (b) over (a):** user explicitly chose the more-work option (extend overlay + tighten spec assertion) over the minimum-diff hygiene comment, citing eliminating the implicit additive coupling as the right outcome. Pattern: when a coupling concern can be structurally eliminated for a small additional cost, prefer the structural elimination over papering over it with a maintainer-facing comment.

</specifics>

<deferred>
## Deferred Ideas

- **Project-wide hydration-completeness assertion sweep** — Phase 83 fixes 2 known flake surfaces (DETERM-07a + DETERM-07b). A v2.11+ project could sweep the voter-app + candidate-app specs for similar partial-hydration-race patterns (any `.first()` / `.last()` / `.nth()` indexing without a preceding count guard) and apply the same lens. Out of v2.10 scope.

- **Phase 70 P03 Input.svelte refactor — broader page-object audit** — Phase 83 fixes ProfilePage.uploadImage's selector drift. A v2.11+ project could audit the FULL `tests/tests/pages/` tree for similar Phase-70-era selectors that might have drifted under Input.svelte's refactor (search for `label[tabindex`, `locator('label'`, etc.). Out of v2.10 scope unless an additional selector-drift bug surfaces during Phase 83 execution.

- **DATA_RACE pool growth re-examination** — Phase 73 D-09 binding locks the pool. v2.11+ may want to revisit whether the IMGPROXY_TIED_TITLES list is still the right structural anchor (e.g., if Phase 83's D-01c imgproxy re-enable lands, the pool's semantic might shift). Out of v2.10 scope.

- **FAILURE-CLASS rationale-block audit** — Phase 79 introduced the FAILURE-CLASS narrative block at `diff-playwright-reports.ts:80-90`. Phase 83 strikes the party-drawer reference. A v2.11+ project could audit whether all remaining FAILURE-CLASS entries (especially "~11 tests deterministically FAIL × 3 in Phase 79 baseline") are still failing in the current baseline or have been silently fixed. Out of v2.10 scope.

### Reviewed Todos (not folded)

None — the 2 folded todos (DETERM-06 + DETERM-07) are the sole Phase 83 inputs from `.planning/todos/pending/`. All other 2026-05-12 / 2026-05-13 todos are explicitly re-deferred to v2.11+ per STATE.md "Deferred Items" table.

</deferred>

---

*Phase: 83-Test-Reliability-Follow-ups-Image-Upload-Cascade-Voter-App-Flakes-v2.10-Milestone-Close-Hygiene*
*Context gathered: 2026-05-13*
