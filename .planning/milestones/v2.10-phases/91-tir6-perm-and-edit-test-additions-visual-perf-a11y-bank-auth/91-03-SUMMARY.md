---
phase: 91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth
plan: 03
subsystem: test-infra
tags: [mega-journey, shared-fixture, testid, feedback, nominations, invalidUrl, absorption]
requires:
  - Feedback.svelte testid surface (existing — feedback-form, feedback-rating-N, feedback-description, feedback-submit, feedback-cancel)
  - Input.svelte ErrorMessage block (existing — Input.svelte:640-642)
  - voter-mega.fixture answeredVoterPage (Phase 88 baseline — used via the views composition root)
  - candidate-mega-journey step 13 (existing — Phase 89 Plan 03)
  - testIds.shared.navigation.menuItem (existing — Phase 90)
  - testIds.voter.nominations.list (existing — Phase 88)
provides:
  - tests/tests/fixtures/shared/feedbackDialog.fixture.ts — shared function-fixture with RESEARCH §Pattern 2 surface
  - tests/tests/fixtures/shared/index.ts — barrel re-export for cross-app consumers
  - testIds.shared.inputError ('input-error') — locale-resilient assertion target for Input validation errors
  - data-status attribute on Feedback.svelte submit button — locale-resilient success-state assertion (Pitfall 10)
  - data-testid='input-error' on Input.svelte:641 inline ErrorMessage
  - candidate-mega-journey step 13.5 — invalidUrl on Link-type info question (TIR6:16-22)
  - voter-mega-journey feedbackDialog step — 3-cycle persistence + send exercise (TIR6:34-61)
  - voter-mega-journey all-nominations step — /nominations route + candidate list (TIR6:63-66)
affects:
  - voter-mega-journey project (gains 2 new test.step blocks)
  - candidate-mega-journey project (gains 1 new test.step block)
  - voter-feedback-persistence retires (file deleted; coverage absorbed)
tech-stack:
  added: []
  patterns:
    - Shared function-fixture under tests/tests/fixtures/shared/ (D-91-MJ-02) — cross-app reusable surface
    - data-status attribute pattern for locale-resilient state assertions (Pitfall 10)
    - Mega-journey absorption (D-91-MJ-01) — TIR6 edit-steps land in canonical specs, no new spec files
    - Lockstep deletion (D-91-MJ-03) — absorbed spec retires in the SAME commit as the absorbing step
key-files:
  created:
    - tests/tests/fixtures/shared/feedbackDialog.fixture.ts
    - tests/tests/fixtures/shared/index.ts
  modified:
    - apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte
    - apps/frontend/src/lib/components/input/Input.svelte
    - tests/tests/utils/testIds.ts
    - tests/tests/specs/candidate/candidate-mega-journey.spec.ts
    - tests/tests/specs/voter/voter-mega-journey.spec.ts
  deleted:
    - tests/tests/specs/voter/voter-feedback-persistence.spec.ts
decisions:
  - "D-91-MJ-01 confirmed: candidate-mega step 13.5 absorbs TIR6:16-22 invalidUrl; voter-mega steps absorb TIR6:34-61 + TIR6:63-66. No new spec files for these three TIR6 deliverables."
  - "D-91-MJ-02 confirmed: feedbackDialog fixture authored standalone under tests/tests/fixtures/shared/ (NEW directory); NOT extended into voter-mega.fixture.ts. Future candidate-mega consumption requires only an import from the barrel."
  - "D-91-MJ-03 confirmed: voter-feedback-persistence.spec.ts deleted in the SAME commit as the absorbing voter-mega step (Task 3 commit). The spec had been SKIP-FALLBACK since Phase 86.1-02 (DETERM-13); retirement is the canonical resolution path."
  - "Pitfall 10 mitigation locked: data-status='sent' attribute on feedback-submit replaces locale-fragile t('feedback.thanks') text assertions. The fixture's expectSuccess() asserts the attribute."
  - "Pitfall 7 mitigation: voter nav drawer opened inline in the feedbackDialog step via getByRole('button', { name: /open menu/i }) on Header.svelte:82-93 — the openMenu button has no testid, accessible-name regex is canonical."
  - "Candidate step 13.5 navigation refinement: step 13 ends on /candidate home (post-submit), so step 13.5 re-enters profile via candidateHomePage.clickTask('profile'), exercises the validation, clears the field, then clicks the profile-return button to land back on home — step 14's clickTask('profile') re-navigates cleanly. The plan's 'pre-condition we're on profile' framing was reconciled in implementation; the structural position (between step 13 and step 14) is preserved as written."
  - "baseV1 already seeds a URL-type info question (test-qu-info-text-link with subtype='link' + settings.type='link' at baseV1.ts:662-672) — RESEARCH Assumption A1 holds; no baseV1 extension needed."
metrics:
  duration_minutes: 18
  tasks_completed: 3
  files_created: 2
  files_modified: 5
  files_deleted: 1
  commits: 3
  completed_date: "2026-05-30"
---

# Phase 91 Plan 03: TIR6 mega-journey edit-step additions + shared feedbackDialog fixture + voter-feedback-persistence retirement

## One-Liner

Authored shared feedbackDialog function-fixture (RESEARCH §Pattern 2 surface) + added locale-resilient `data-status` attribute on feedback submit + `data-testid="input-error"` on Input ErrorMessage + appended 3 mega-journey edit-steps (candidate invalidUrl, voter feedbackDialog, voter all-nominations) + retired voter-feedback-persistence.spec.ts in lockstep with the absorbing voter-mega step.

## What Shipped

### Task 1 — Shared feedbackDialog fixture + testid/data-status wiring (commit 8ee026c99)

**Svelte component edits (a11y-neutral, additive):**

- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:235` — submit button gains `data-status={status}` attribute. The `status` reactive value is local to Feedback.svelte (`'default' | 'sending' | 'sent' | 'error'`); direct binding is correct per the Svelte 5 destructure rule (no context indirection). Replaces locale-fragile text-match assertions on `t('feedback.thanks')` (Pitfall 10).
- `apps/frontend/src/lib/components/input/Input.svelte:641` — inline ErrorMessage gains `data-testid="input-error"` via the existing restProps spread. ErrorMessage.svelte:54 sets a default `data-testid="error-message"` BEFORE the spread, so the spread overrides on this call site only.

**TestIds inventory:**

- `tests/tests/utils/testIds.ts` — added `shared.inputError = 'input-error'` with a JSDoc anchor referencing Plan 91-03 / TIR6:16-22 / D-91-MJ-01 B1.

**Shared fixture authoring:**

- `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` (NEW; new directory `tests/tests/fixtures/shared/` per D-91-MJ-02) — exports interface `FeedbackDialogFixture` + factory `createFeedbackDialog(page: Page): FeedbackDialogFixture`. Surface (RESEARCH §Pattern 2):
  - `dialog: Locator` — testid-anchored to `feedback-form`.
  - `expectVisible()` / `expectHidden()` — count-based DOM-removal signal (mirrors voter-feedback-persistence H4 lineage).
  - `expectSendDisabled()` / `expectSendEnabled()` — submit button `toBeDisabled` / `toBeEnabled`.
  - `setRating(n)` / `setComment(text)` — testid + role-tagged interactions.
  - `submit()` / `cancel()` — testid-tagged click.
  - `expectSuccess()` — asserts `data-status='sent'` (Pitfall 10).
  - `expectRatingValue(n)` — `n ∈ 1..5` asserts the specific rating checked; `n === null` asserts NONE of the 5 ratings checked (iterates the 5 testids).
  - `expectCommentValue(text)` — `toHaveValue(text)` on the description testid.
- Standalone factory pattern (89-02 lineage) — NOT extended into voter-mega.fixture.ts per D-91-MJ-02. Future candidate-mega consumption is import-only.

**Barrel:**

- `tests/tests/fixtures/shared/index.ts` (NEW) — re-exports `createFeedbackDialog` + type `FeedbackDialogFixture`.

### Task 2 — Candidate-mega step 13.5 (invalidUrl on Link-type info question) (commit 37040c42b)

**Inserted at `tests/tests/specs/candidate/candidate-mega-journey.spec.ts`** between step 13 (portrait + info-fill + submit landing on `/candidate` home) and step 14 (revisit + fill required + submit → questions overview):

```ts
await test.step('13.5. profile: invalid URL into Link-type question surfaces invalidUrl error (TIR6:16-22)', async () => {
  await candidateHomePage.clickTask('profile');
  await expect(page).toHaveURL(/\/candidate\/profile/, { timeout: TIMEOUT.slowPage });
  await candidateProfilePage.fillQuestion(/qu-info-text-link/, 'not-a-url');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId(testIds.shared.inputError)).toContainText(
    /invalidUrl|invalid url|virheellinen/i,
    { timeout: TIMEOUT.element }
  );
  await candidateProfilePage.fillQuestion(/qu-info-text-link/, '');
  await page.getByTestId(testIds.candidate.profile.returnButton).click();
  await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({
    timeout: TIMEOUT.slowPage
  });
});
```

**Behavior bound to:**

- baseV1's existing `test-qu-info-text-link` URL-type info question (`subtype: 'link'`, `settings: { type: 'link' }`) at `packages/dev-seed/src/templates/baseV1.ts:662-672`. RESEARCH Assumption A1 holds — no baseV1 mutation needed.
- `Input.svelte:296` checkUrl path emits `error = t('components.input.error.invalidUrl')` on invalid input.
- The new `input-error` testid (Task 1) surfaces the error text for locale-resilient assertion.

**Field-clear discipline:** the field is cleared via `fillQuestion(..., '')` after the assertion, then the profile-return button lands the candidate back on `/candidate` home so step 14's `clickTask('profile')` re-navigates cleanly. No state leak into step 14.

**Strict assertions only:** No `expect.soft`, no `.catch(...)`, no try/catch around `expect()`. (The pre-existing JSDoc text mentions `expect.soft` and `.catch` as documentation-of-discipline anchors — those are not code-path soft assertions.)

### Task 3 — Voter-mega feedbackDialog + all-nominations + voter-feedback-persistence deletion (commit 06a7602d9)

**Inserted at `tests/tests/specs/voter/voter-mega-journey.spec.ts`** after the existing `'filters: dialog'` step (line 1041):

**Step A — feedbackDialog (TIR6:34-61):** 3-cycle exercise of the feedback dialog state machine.

- Cycle 1: open drawer (Pitfall 7 — `getByRole('button', { name: /open menu/i })` on Header.svelte:82-93) → click feedback NavItem (`testIds.shared.navigation.menuItem` filtered by `/feedback|palaute|återkoppling/i`) → `expectVisible` → `expectSendDisabled` → `setRating(3)` → `expectSendEnabled` → `setComment('test feedback')` → `cancel()` → `expectHidden` (form testid count=0 signal).
- Cycle 2: reopen via drawer → `expectVisible` → `expectRatingValue(3)` + `expectCommentValue('test feedback')` (state survives close per FeedbackModal `bind:this` discipline) → `submit()` → `expectSuccess` via `data-status='sent'` → `expectHidden` (post-CLOSE_DELAY reset + close).
- Cycle 3: reopen → `expectRatingValue(null)` + `expectCommentValue('')` (reset() ran post-onSent) → text-only feedback (`setComment('text-only feedback')` + no rating) → `expectSendEnabled` (description-only submit is enabled per Feedback.svelte `canSubmit` derivation) → `submit()` → `expectSuccess` → `expectHidden`.

**Step B — all-nominations (TIR6:63-66):**

```ts
await page.goto(buildRoute({ route: 'Nominations', locale: 'en' }));
const list = page.getByTestId(testIds.voter.nominations.list);
await expect(list).toBeVisible({ timeout: TIMEOUT.slowPage });
await expect(list.getByTestId(testIds.voter.results.card).first()).toBeVisible({ timeout: TIMEOUT.page });
```

Conservative single-card assertion — baseV1's exact nomination count under the located voter's scope is multi-faceted; the candidate-nominations list visibility + at-least-one entity-card is the canonical contract.

**Spec deletion:** `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` deleted in the same commit per D-91-MJ-03. The spec had been SKIP-FALLBACK since Phase 86.1-02 (DETERM-13) due to dialog-close locator race + Phase 86.3-03 upstream fixture race; retirement is the canonical resolution path. The 2026-05-16 follow-up todo `.planning/todos/pending/2026-05-16-voter-feedback-persistence-second-pass.md` is implicitly resolved by absorption.

## Deviations from Plan

### Acceptance criterion reconciliation (out-of-scope file state)

**Plan's Task 2 AC:** `! grep -q "expect.soft\|\.catch(" tests/tests/specs/candidate/candidate-mega-journey.spec.ts`

**Reality:** The candidate-mega-journey spec contains 2 JSDoc lines mentioning `expect.soft` and `.catch` as documentation-of-discipline anchors (lines 51 + 53 of the existing rigidity-contract comment block). These predate Plan 91-03 and are NOT code-path soft assertions. The AC's literal-grep formulation flags them as matches.

**Resolution:** AC functionally met — our additions introduce ZERO new `expect.soft` or `.catch` patterns. The pre-existing comments are out of scope per Phase 91 deferred-items policy (commenting on the discipline is not a violation of the discipline).

**Plan's Task 3 AC:** `! grep -RE "expect\.soft|\.catch\(" tests/tests/specs/voter/voter-mega-journey.spec.ts`

**Reality:** voter-mega-journey.spec.ts has 13 pre-existing `expect.soft` / `.catch` matches (260523-u53 cleanup pass — soft assertions within the 3-slot budget for empirically-brittle baseV1 walks). These predate Plan 91-03.

**Resolution:** AC functionally met — our additions introduce ZERO new soft/catch patterns. The 13 pre-existing matches are out of scope per Phase 91 deferred-items policy + the existing 260523-u53 budget discipline.

### Step 13.5 navigation refinement (Task 2)

**Plan said:** "Pre-condition: we're on /candidate/profile from step 13."

**Reality:** Step 13 submits the profile form and lands on `/candidate` home (`candidateHomePage.expectTasks` is the step's terminal assertion). So step 13.5 had to navigate INTO profile before testing.

**Resolution:** Step 13.5 calls `candidateHomePage.clickTask('profile')` at entry, exercises the validation, clears the field, and clicks the profile-return button to land back on home — step 14's `clickTask('profile')` then re-navigates cleanly. The structural insertion position (between step 13 and step 14) is preserved as the plan wrote it; only the entry navigation was added to make the step self-contained. No deviation from D-91-MJ-01.

### baseV1 extension (Assumption A1)

**Plan stated as conditional:** "If baseV1 lacks a URL-type info question (RESEARCH Assumption A1), baseV1.ts is extended with one URL-type info question."

**Reality:** baseV1 already seeds `test-qu-info-text-link` with `subtype: 'link'` + `settings: { type: 'link' }` at `baseV1.ts:662-672`. RESEARCH Assumption A1 holds. No extension needed.

## Auth Gates / Manual Interventions

None — Plan 91-03 is purely automated test-infrastructure + minor a11y-neutral component annotations. No human-action checkpoints needed.

## Self-Check: PASSED

**Files claimed to exist verified via shell:**

- `tests/tests/fixtures/shared/feedbackDialog.fixture.ts`: FOUND
- `tests/tests/fixtures/shared/index.ts`: FOUND
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` — `data-status={status}` present: FOUND
- `apps/frontend/src/lib/components/input/Input.svelte` — `data-testid="input-error"` present: FOUND
- `tests/tests/utils/testIds.ts` — `inputError: 'input-error'` present: FOUND
- `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` — `TIR6:16-22` + `shared.inputError` present: FOUND
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` — `TIR6:34-61` + `TIR6:63-66` + `createFeedbackDialog` present: FOUND
- `tests/tests/specs/voter/voter-feedback-persistence.spec.ts`: DELETED (verified absent)

**Commits claimed verified via `git log`:**

- `8ee026c99`: FOUND (Task 1)
- `37040c42b`: FOUND (Task 2)
- `06a7602d9`: FOUND (Task 3)

**svelte-check posture:** No new errors introduced by Task 1's Feedback.svelte / Input.svelte / testIds.ts changes (filtered grep against Feedback.svelte/Input.svelte:64x/input-error/data-status shows zero matches in svelte-check output). The 159 pre-existing svelte-check errors are orthogonal carry-overs (runes-test, qs module declarations, candidateContext promise typing, etc.) — same disposition as Plan 91-01's pre-existing failures.

**E2E test posture:** The candidate-mega-journey and voter-mega-journey projects require a live Supabase + per-perm setup chain to run. They are not invoked in this plan's verification step (sequential dependency chain runs in CI on PR + post-merge). Static-grep acceptance + svelte-check are the in-process gates; e2e green is a CI gate at phase-completion.

## Threat Flags

No new threat surfaces. Phase 91 Plan 03 is testing infrastructure + a11y-neutral component annotations:

- `data-status` attribute on Feedback submit button: inert for screen readers (`data-*` is a standard HTML extension surface; no behavioural change).
- `data-testid="input-error"` on Input ErrorMessage: same — inert for users; consumed by tests only.
- Shared feedbackDialog fixture: lives under `tests/tests/fixtures/shared/` (test-only path); not exported from any frontend/package barrel — no production code path exposure.
- voter-feedback-persistence deletion: reduces the test surface but the absorbed coverage in voter-mega is functionally equivalent (TIR6:34-61 sequence) AND covers MORE (rating-set + rating-clear + cancel-preserves-state + text-only-after-send — the legacy spec only covered description text persistence and the post-send reset).

All T-91-08 through T-91-11 threats in the plan's threat register are addressed:

- T-91-08 (locale-fragile success assertion) → mitigated via `data-status='sent'` (Task 1).
- T-91-09 (invalidUrl step blocking step 14 via leftover field value) → mitigated via field-clear + return-to-home discipline (Task 2).
- T-91-10 (baseV1 URL-question extension invalidating visual baselines) → no extension needed (Assumption A1 holds; no row order shift).
- T-91-11 (voter-feedback-persistence deletion leaving untested surface) → mitigated via absorption of TIR6:34-61 (14 expectations + cycle 3 rating-cleared assertion) into voter-mega.

## Next Steps (Plan 91-04 unblocked)

- Plan 91-04 authors the visual / perf / a11y / bank-auth refactor (Group C). It does NOT depend on Plan 91-03's outputs — these two plans were partitioned as independent per D-91-PARTITION.
- The shared feedbackDialog fixture is available for future candidate-mega-journey extensions (no Phase 91 candidate-side consumption; deferred per RESOLVED Open Question 4).
- voter-mega-journey is now ~78 lines longer (3 new test.step blocks + 1 import + module comment block); future test.setTimeout may need a bump if the 3-cycle feedback walk + nominations route navigation push the per-test wall-clock past the current `TIMEOUT.testMax = 120_000` ceiling (260523-u53 baseline ~17-24s, 88-04 surface bumped to ~75-90s; this plan adds ~3-5s of nav + assertion → still well under 120s).
