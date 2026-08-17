---
phase: 91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth
reviewed: 2026-05-30T00:00:00Z
depth: standard
files_reviewed: 79
files_reviewed_list:
  - apps/frontend/src/lib/components/categoryTag/CategoryTag.svelte
  - apps/frontend/src/lib/components/electionTag/ElectionTag.svelte
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte
  - apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte
  - apps/frontend/src/routes/Banner.svelte
  - apps/frontend/src/routes/candidate/(protected)/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/candidate/login/+page.svelte
  - packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
  - packages/dev-seed/src/templates/_helpers/index.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/src/templates/permutations/perm-1e1cg1co.ts
  - packages/dev-seed/src/templates/permutations/perm-2e-asymmetric.ts
  - packages/dev-seed/src/templates/permutations/perm-2e-shared.ts
  - packages/dev-seed/src/templates/permutations/perm-answers-locked.ts
  - packages/dev-seed/src/templates/permutations/perm-disable-allow-open.ts
  - packages/dev-seed/src/templates/permutations/perm-disable-candidate-app.ts
  - packages/dev-seed/src/templates/permutations/perm-disable-election-1co.ts
  - packages/dev-seed/src/templates/permutations/perm-disable-election-2co.ts
  - packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts
  - packages/dev-seed/src/templates/permutations/perm-disjoint-1co.ts
  - packages/dev-seed/src/templates/permutations/perm-header-show-feedback.ts
  - packages/dev-seed/src/templates/permutations/perm-header-show-help.ts
  - packages/dev-seed/src/templates/permutations/perm-hide-all-nominations.ts
  - packages/dev-seed/src/templates/permutations/perm-hide-category-tags.ts
  - packages/dev-seed/src/templates/permutations/perm-hide-election-tags.ts
  - packages/dev-seed/src/templates/permutations/perm-hide-hero.ts
  - packages/dev-seed/src/templates/permutations/perm-hide-if-missing-answers.ts
  - packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts
  - packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts
  - packages/dev-seed/src/templates/permutations/perm-not-located-2e2cg.ts
  - packages/dev-seed/src/templates/permutations/perm-per-app-notifications.ts
  - packages/dev-seed/src/templates/permutations/perm-startfromcg.ts
  - packages/dev-seed/src/templates/permutations/shared.ts
  - tests/playwright.config.ts
  - tests/tests/fixtures/shared/feedbackDialog.fixture.ts
  - tests/tests/fixtures/shared/index.ts
  - tests/tests/fixtures/voter-mega.fixture.ts
  - tests/tests/fixtures/voter.fixture.ts
  - tests/tests/setup/perm-answers-locked.setup.ts
  - tests/tests/setup/perm-answers-locked.teardown.ts
  - tests/tests/setup/perm-disable-allow-open.setup.ts
  - tests/tests/setup/perm-disable-allow-open.teardown.ts
  - tests/tests/setup/perm-header-show-feedback.setup.ts
  - tests/tests/setup/perm-header-show-feedback.teardown.ts
  - tests/tests/setup/perm-header-show-help.setup.ts
  - tests/tests/setup/perm-header-show-help.teardown.ts
  - tests/tests/setup/perm-hide-all-nominations.setup.ts
  - tests/tests/setup/perm-hide-all-nominations.teardown.ts
  - tests/tests/setup/perm-hide-category-tags.setup.ts
  - tests/tests/setup/perm-hide-category-tags.teardown.ts
  - tests/tests/setup/perm-hide-election-tags.setup.ts
  - tests/tests/setup/perm-hide-election-tags.teardown.ts
  - tests/tests/setup/perm-hide-hero.setup.ts
  - tests/tests/setup/perm-hide-hero.teardown.ts
  - tests/tests/setup/perm-hide-if-missing-answers.setup.ts
  - tests/tests/setup/perm-hide-if-missing-answers.teardown.ts
  - tests/tests/specs/a11y/a11y-smoke.spec.ts
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
  - tests/tests/specs/candidate/candidate-mega-journey.spec.ts
  - tests/tests/specs/perf/performance-budget.spec.ts
  - tests/tests/specs/perm/perm-answers-locked.spec.ts
  - tests/tests/specs/perm/perm-disable-allow-open.spec.ts
  - tests/tests/specs/perm/perm-header-show-feedback.spec.ts
  - tests/tests/specs/perm/perm-header-show-help.spec.ts
  - tests/tests/specs/perm/perm-hide-all-nominations.spec.ts
  - tests/tests/specs/perm/perm-hide-category-tags.spec.ts
  - tests/tests/specs/perm/perm-hide-election-tags.spec.ts
  - tests/tests/specs/perm/perm-hide-hero.spec.ts
  - tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts
  - tests/tests/specs/visual/visual-regression.spec.ts
  - tests/tests/specs/voter/voter-mega-journey.spec.ts
  - tests/tests/utils/candidateSessionMinter.test.ts
  - tests/tests/utils/candidateSessionMinter.ts
  - tests/tests/utils/testIds.ts
  - tests/vitest.config.ts
findings:
  critical: 3
  warning: 9
  info: 6
  total: 18
status: issues_found
---

# Phase 91: Code Review Report

**Reviewed:** 2026-05-30
**Depth:** standard
**Files Reviewed:** 79
**Status:** issues_found

## Summary

Phase 91 (TIR6 perm-* additions + voter/candidate mega-journey edit extensions +
visual/perf/a11y/bank-auth refactor) lands a substantial volume of new test
infrastructure (9 new perm chains × 3 files each = 27 setup/teardown/spec files,
the `buildMinimal` template helper, the `candidateSessionMinter` Playwright
storage-state minter, and the shared `feedbackDialog` fixture).

The structural work is largely sound, but adversarial review surfaces three
**Critical** defects whose user-visible effect is "the assertion silently
passes against the wrong state" — i.e., the new tests do NOT actually exercise
the contracts their doc-comments claim:

1. **`candidateSessionMinter` does NOT mint a usable Supabase session.** It
   emits a synthesised cookie payload labelled as a session token but never
   calls `supabase.auth.admin.generateLink` / `exchangeCodeForSession`. The 5
   perm specs that gate behind `storageState: STORAGE_STATE_PATH` (A1/A2/A9
   authenticated sub-tests) will be redirected to `/candidate/login` by the
   protected layout's auth guard — their assertions on
   `candidate-answers-locked-warning`, `candidate-questions-hero`, and
   `candidate-questions-comment` cannot fire on the protected route. The unit
   tests pass because they mock the admin client; only the live E2E run
   exposes the gap. See CR-01.

2. **`perm-disable-allow-open` voter walk is not located.** The voter spec
   navigates `home → elections.continue → constituencies.continue → /results`
   directly without the explicit click sequence to actually select an
   election/constituency. With a single-election + single-constituency
   topology this *may* auto-imply, but the spec also performs `page.goto('/en/results')`
   right after the constituency click, bypassing the natural redirect-on-
   completion flow. See CR-02.

3. **Strict-mode locator violation risk in voter mega-journey feedback step.**
   The `feedbackDialog.expectHidden()` calls between cycles 1→2 and 2→3 rely
   on `count=0`, but the `cancel()` between cycle 1's setComment and cycle
   2's reopen has NO wait for the modal CLOSE_DELAY animation. See CR-03.

The remaining **Warning** items cluster around: state leak between perm chains
when storage-state files are not torn down on test failure, the legacy
`voter.fixture.ts` deprecation is in a JSDoc block only (consumers continue to
import it without compiler warning), and a stale doc-comment in
`parseSelected` of `EnumeratedEntityFilter.svelte` (the function appears to
have been included in the change set but the change is unrelated to Phase 91's
scope — flagged as a quality concern).

## Critical Issues

### CR-01: `candidateSessionMinter` synthesises fake cookies that will not authenticate

**File:** `tests/tests/utils/candidateSessionMinter.ts:118-184`
**Issue:**
The helper composes a base64-encoded `${authUserId}.${candidateEmail}.${Date.now()}`
string and writes it as the value of `sb-access-token` + `sb-refresh-token`
cookies, plus an `sb-auth-token` localStorage entry. None of these are real
JWTs signed by the Supabase GoTrue server. The protected candidate route
layout (`apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` —
the canonical Supabase SSR pattern) calls `safeGetSession()` server-side, which
validates the JWT signature. A base64-of-arbitrary-string will fail signature
validation and the protected layout redirects to `/candidate/login`.

The doc-comment at lines 118-131 acknowledges this: *"For Phase-91-01 unit-test
coverage the helper emits a deterministic synthesised cookie set... the
live-Supabase integration is exercised by the Plan 91-02 perm specs."* —
but Plan 91-02 then USES this helper as if it were the live integration,
producing 5 specs that authenticate against fake cookies.

Symptoms on first live run:
- `perm-answers-locked` surfaces 2+3 (lines 45-78 of the spec) navigate to
  `/en/candidate/profile` / `/en/candidate/questions/{id}` → server-side
  layout redirects to `/en/candidate/login` → `getByTestId('candidate-answers-locked-warning')`
  resolves to count 0 → assertion fails with "element not found".
- `perm-hide-hero` (lines 22-32) → same redirect cascade → `candidate-questions-hero`
  assertion fails.
- `perm-disable-allow-open` (lines 34-46) candidate-side describe block —
  both Q1 and Q2 sub-tests fail on the same redirect cascade.

**Fix:**
Use `supabase.auth.admin.generateLink({ type: 'magiclink', email })` to mint a
real magic-link token, then exchange it via `supabase.auth.exchangeCodeForSession(token)`
to obtain a real session, and write the returned `session.access_token` /
`session.refresh_token` into the storage-state cookies. Alternatively, use the
admin API's `setSession()` flow as in
`tests/tests/setup/auth.setup.ts` (the precedent the helper's doc-comment
references). Until this is fixed, the 3 authenticated perm specs (A1 surfaces
2+3, A2, A9 candidate-side) will fail.

---

### CR-02: `perm-hide-if-missing-answers` + `perm-disable-allow-open` voter walks goto-bypass the located redirect chain

**File:** `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts:27-39`
**File:** `tests/tests/specs/perm/perm-disable-allow-open.spec.ts:52-59`
**Issue:**
Both specs perform:
```ts
await page.goto('/en');
await page.getByTestId(testIds.voter.home.startButton).click();
await expect(page.getByTestId(testIds.voter.elections.continue)).toBeVisible();
await page.getByTestId(testIds.voter.elections.continue).click();
await expect(page.getByTestId(testIds.voter.constituencies.continue)).toBeVisible();
await page.getByTestId(testIds.voter.constituencies.continue).click();
await page.goto('/en/results');
```

The pattern is fragile in two ways:

1. With the single-election + single-constituency baseline from `buildMinimal()`,
   the Home start button often auto-redirects past `/en/elections` and
   `/en/constituencies` (the intro auto-implies single options per
   `getImpliedElectionIds` in `voterContext.svelte.ts`). In that case the
   `elections.continue` and `constituencies.continue` testids never appear,
   the `expect(...).toBeVisible()` waits to timeout, then `goto('/en/results')`
   lands on a partially-located /results that may not show entity cards (the
   layout's nomination-availability check still runs and may surface the
   missing-nominations modal). The hide-if-missing-answers assertion at line 46
   then checks `cards.filter({ hasText: /\[CA1A\]/ }).toHaveCount(1)` against
   a /results page that has not finished locating — flaky pass/fail.

2. Even when both selectors DO render (i.e., the auto-imply did not fire),
   the final `page.goto('/en/results')` BYPASSES the natural redirect chain
   `constituencies.continue → /questions → /results` and short-circuits to
   `/results` without giving the voter context time to settle the
   `selectedConstituencies` writes from the prior click. The voter mega
   fixture handles this via `waitForURL` between steps; these perm specs do
   not.

**Fix:**
Use the `voterMegaTest.answeredVoterPage` fixture (or a thinner variant)
instead of hand-rolling the navigation, OR add a `waitForURL` after
`constituencies.continue.click()` to confirm post-navigation settling before
the `goto('/en/results')` short-circuit. Mirror the pattern from
`voter-mega.fixture.ts:118-138` which uses `isVisible({timeout:5000}).catch(() => false)`
to tolerate the auto-imply branch. Per the strict-fixture contract
(D-91-PD-04) the `.catch(() => false)` is forbidden in spec bodies — so the
preferred fix is to consume `locatedVoterPage` (no answer-loop) directly
where applicable.

---

### CR-03: voter mega-journey feedback step lacks modal CLOSE_DELAY settle between cycles

**File:** `tests/tests/specs/voter/voter-mega-journey.spec.ts:1067-1102`
**Issue:**
The 3-cycle feedback dialog walk asserts `feedbackDialog.expectHidden()`
(which resolves to `expect(dialog).toHaveCount(0)` — testid removed from DOM)
between cycles. The Feedback.svelte form remains in the DOM until the
FeedbackModal's CLOSE_DELAY=1500ms timer fires post-`onSent`, then `reset()`
is called and the modal closes.

Cycle 1 → 2: `feedbackDialog.cancel()` triggers the form's `onCancel?.()`
callback which calls `FeedbackModal.close()` IMMEDIATELY (no CLOSE_DELAY for
the cancel path). The `expectHidden` at line 1076 should pass quickly.

Cycle 2 → 3: `feedbackDialog.submit()` then `expectSuccess()` (asserts
`data-status='sent'`), then `expectHidden()` at line 1089 waits up to the
default expect timeout (5s) for the form to drop from the DOM after the
1500ms CLOSE_DELAY. This is correct.

Cycle 3 reopen: `await page.getByRole('button', { name: openMenuRegex }).click()`
followed by `feedbackNavItem.click()`. The risk: the menuItem locator
`page.getByTestId(testIds.shared.navigation.menuItem).filter({ hasText: /feedback|palaute|återkoppling/i })`
is NOT scoped to the open menu drawer. If the drawer is still in the DOM from
cycle 2's open (Header.svelte may keep the drawer in DOM and animate
`aria-hidden` rather than detach), the menuItem locator can match an element
inside the not-yet-closed nav. The cycle-3 click then races against the
menu's close transition. The mega-journey runs serially so flakiness here is
contained, but the contract is fragile.

Additionally, the locale-regex `palaute|återkoppling` on line 1065 hardcodes
ONLY 2 non-English locales (fi + sv). If the mega-journey is ever run under
the 3-locale staticSettings baseline with a different default UI locale, the
filter will miss the menuItem and the test will hang on the `.click()` until
the test-level timeout fires. The voter intro page locale is implicitly
expected to be English per the route `buildRoute({locale:'en'})` calls, but
the filter is over-broad for an EN-only walk and under-broad for non-EN
contingency.

**Fix:**
1. Scope `feedbackNavItem` to the open menu drawer locator (e.g.,
   `page.getByRole('dialog', { name: /menu/i }).getByTestId(...)` or use the
   menu drawer's testid if present).
2. Either drop the `palaute|återkoppling` alternatives (mega-journey is EN-only)
   OR document the locale assumption explicitly in the comment.
3. Add an explicit `await openMenu drawer.waitFor({state:'visible'})` between
   `openMenu.click()` and `feedbackNavItem.click()` to ensure the menu is
   actually open before the menu-item click.

## Warnings

### WR-01: `mintCandidateSession` accepts but ignores `opts.locale`

**File:** `tests/tests/utils/candidateSessionMinter.ts:179-182`
**Issue:**
The `locale` field is accepted in the options interface (documented as
"Optional locale for the session cookie origin URL"), but the implementation
explicitly discards it with `void opts.locale;` and uses
`DEFAULT_ORIGIN = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'`
unconditionally. The interface promises behaviour the implementation does not
deliver. All 5 perm setups (A1, A2, A9) pass `locale: 'en'` which is the
default behaviour anyway — but a future spec that passes `locale: 'fi'`
expecting a locale-prefixed origin URL will get silent default behaviour.
**Fix:** Either remove the `locale` field from the interface (and update the
3 setup files that pass it) OR actually consume the locale to build a
locale-prefixed origin URL.

### WR-02: Storage-state JSON files leak across perm chains on test failure

**File:** `tests/tests/setup/perm-answers-locked.teardown.ts:24`
**File:** `tests/tests/setup/perm-hide-hero.teardown.ts:22`
**File:** `tests/tests/setup/perm-disable-allow-open.teardown.ts:24`
**Issue:**
The teardown projects delete the storage-state JSON file with
`if (fs.existsSync(STORAGE_STATE_PATH)) fs.unlinkSync(STORAGE_STATE_PATH);`
Playwright's `teardown:` key runs the teardown ONLY when the corresponding
spec project completes (success OR failure). However, if the setup itself
crashes before writing the file (e.g., `mintCandidateSession` throws), OR if
the teardown crashes during `runTeardown()` (the FS delete is sequenced AFTER
the DB delete — line 21 throws, line 24 never runs), the storage-state file
persists into the next CI run. The next perm chain's setup overwrites it, but
in the rare cross-prefix-collision case the stale file is read by an
unrelated subsequent spec.
**Fix:** Wrap the FS unlink in a `try { ... } finally { ... }` around the
`runTeardown` call so the file is always deleted regardless of DB-side
outcome. The unlink is idempotent (`if (fs.existsSync...)` already guards).

### WR-03: `perm-hide-election-tags` template configures 2 elections but spec walks single-election flow

**File:** `tests/tests/specs/perm/perm-hide-election-tags.spec.ts:19-26`
**File:** `packages/dev-seed/src/templates/permutations/perm-hide-election-tags.ts:29`
**Issue:**
The template sets `elections: 2` (line 29 of the template), so two elections
are seeded. The spec then asserts on `elections.continue` visibility before
clicking. With 2 elections, the election selector page WILL render, so the
flow works. However, the spec asserts on `electionTag` absence on
`/en/questions` — the election tag's rendering condition typically requires
`>1 election attached to the same question category` to disambiguate (per
the ElectionTag.svelte usage at QuestionHeading.svelte). With the default
`buildMinimal({elections: 2})` topology the helper creates 2 elections sharing
1 CG/1 CO, so questions are attached to BOTH elections via the shared CG.
This SHOULD render the tag (positive case) — `showElectionTags: false` then
hides it (negative). Verify the question→election join actually fires in
this topology; if the tag never renders even with `showElectionTags: true`,
the assertion is vacuously true and the test verifies nothing.
**Fix:** Add a positive control (e.g., a sibling test that asserts the tag
IS visible when `showElectionTags: true`) OR cross-link to the QuestionHeading
render logic to confirm the topology actually triggers the tag in the
positive case. RESEARCH § for D-91-PD-05 should document this.

### WR-04: `perm-hide-hero` figure-emptiness assertion may be over-broad

**File:** `tests/tests/specs/perm/perm-hide-hero.spec.ts:30-31`
**Issue:**
The assertion is:
```ts
const hero = page.getByTestId('candidate-questions-hero');
await expect(hero).toBeVisible();
await expect(hero.locator('img, span')).toHaveCount(0);
```
The Hero component renders an `<Image>` or `<HeroEmoji>` which may contain
an `<img>` OR a `<span>` (HeroEmoji wraps the emoji in a span). However, the
`candidate-questions-hero` figure ALSO carries a child component tree that
may include `<span>` elements unrelated to the hero content (e.g., sr-only
spans, label spans, badge spans inside child Buttons). Setting `hideHero: true`
suppresses the Hero render (line 266-268 of `[questionId]/+page.svelte`),
but if any sibling `<span>` lives inside the figure for a11y reasons (e.g.,
a `<span class="sr-only">`), the count > 0 assertion will fail incorrectly.
**Fix:** Either narrow the selector to `figure > img, figure > span:not(.sr-only)`
OR assert directly on the absence of the Hero-component's specific child
class (e.g., `hero.locator('.hero-content')` if such a stable class exists).
The current assertion's intent ("hero content suppressed") is better
expressed as `hero` should have no `:not(:empty)` text content.

### WR-05: `Feedback.svelte` ERROR_TIMEOUT can fire after onSent and overwrite status

**File:** `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:103-127`
**Issue:**
The `submit()` function:
1. Calls `sendFeedback(...)` (no await — `.then(...)` chain).
2. Schedules `errorTimeout = setTimeout(..., ERROR_TIMEOUT=5000)`.
3. The `.then` callback (when `sendFeedback` resolves) calls `clearErrorTimeout()`
   on success only.

If `sendFeedback` resolves AFTER 5000ms, the timeout fires first and sets
`status = 'error'` + `onError?.()` — but then the `.then` callback runs,
calls `clearErrorTimeout()` (no-op now), and writes `status = 'sent'`. The
`onSent` then fires AFTER the user has already seen the error state. The
feedbackDialog fixture's `expectSuccess()` checks for `data-status='sent'`
and would pass — but the user observed an error first.

Also: if the timeout fires AFTER `clearErrorTimeout()` was called by the
`.then` callback (sendFeedback resolved successfully in <5s), the
`errorTimeout` reference is cleared but the callback already scheduled is
fired. The `if (status !== 'sent')` guard at line 122 catches this — but
`status` may not yet be `'sent'` at the moment of clear if there's a
microtask interleave.

This is not a Phase 91 regression but the Phase 91 `expectSuccess()` fixture
makes the race more likely to be observed (added test coverage that may
flake on slow CI). Worth surfacing.
**Fix:** Await the `sendFeedback` promise in a `try/catch` and only schedule
the timeout from outside the `then`, OR cancel the scheduled timeout BEFORE
writing `status = 'sent'` in the success branch.

### WR-06: `EnumeratedEntityFilter.svelte` `parseSelected` doc-comment is stale relative to behaviour

**File:** `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:125-141`
**Issue:**
This file appears in the diff (`M apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte`)
but is not described in the Phase 91 plans. The semantics changed (default
state is now "all checked + filter inactive" instead of "empty + filter
inactive"), but the `parseSelected` doc-comment still references "post TIR3
cluster 1" semantics. The function body matches the new semantics, but the
doc-comment's bullet *"`!activated` (mount baseline, no user input yet) →
`undefined` (filter inactive, everything passes)"* is misleading when paired
with the new initial `selected = convertMissingForInputs(values.map(v => v.value))`
default — `selected.length === values.length` at mount time, so the
`activated && selectedValues.length === values.length` branch would fire if
the user activated. The "no user input yet" wording suggests `selected = []`
which is no longer the case.
**Fix:** Update the doc-comment to reflect the all-checked baseline. Either
remove the file from the phase 91 commit if it's out-of-scope, or document
the dependent semantic change in the phase summary.

### WR-07: `voter.fixture.ts` `@deprecated` is JSDoc-only — no compiler/lint enforcement

**File:** `tests/tests/fixtures/voter.fixture.ts:1-4`
**Issue:**
The `@deprecated` JSDoc tag triggers a warning in TypeScript's strict
deprecation tracking, but Playwright spec files and project tsconfig do not
have `noImplicitOverride` or `--deprecated` flags enabled in the test
workspace. The 12 (per CONTEXT) legacy consumers will continue to import the
fixture without warning, silently extending the deprecation lifetime.
**Fix:** Add an ESLint rule (`@typescript-eslint/no-deprecated`) to the
`tests/` ESLint config to surface the import as a warning, OR list the
remaining consumers explicitly in the deprecation comment with a target
removal phase ("Deletion deferred to v2.11+ per D-91-RS-04" is documented
but does not enumerate the 12 callers).

### WR-08: `walkRemainingOpinionQuestions` MAX_STEPS=20 is fragile against future question additions

**File:** `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:162-173`
**Issue:**
The loop ceiling is documented as "baseV1 currently exposes ~8 applicable
opinion questions to the unregistered candidate (Base ×5 + Opt-A ×1 + Opt-B
×1 + EL-Reg ×1), so 20 is a loose ceiling." If a future phase adds
questions to baseV1 to exercise additional candidate-side flows (e.g., a
filter-by-constituency question count > 12), the loop falls off the ceiling
silently — the function returns to step 19 without an assertion failure, and
step 19's subsequent `await page.goto('/en/candidate')` masks the incomplete
walk. The candidate completion state assertion at line 649-653 would catch
this (preview disabled means tasks fail), but the diagnostic message would be
generic ("preview button is not enabled") instead of specific ("walked 20
questions, 21st question encountered").
**Fix:** Throw an error from the loop on hitting MAX_STEPS:
```ts
if (PER_QUESTION_URL_RE.test(page.url())) {
  throw new Error(`walkRemainingOpinionQuestions: still on per-question URL after ${MAX_STEPS} iterations`);
}
```
Place this AFTER the loop body, replacing the bare `return`.

### WR-09: candidate-mega-journey step 13.5 deletes link value but step 21 comment claims it's sampled

**File:** `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:530, 673`
**Issue:**
Step 13.5 (Phase 91 addition) at line 530 writes empty string to
`/qu-info-text-link/`, clearing the valid URL set in step 13. Step 21 line
673's doc-comment says: *"Info answers round-trip (sample the required + the
link + the number)"* — but the actual assertions at lines 674-681 only check
`/qu-info-text\]/` and `/qu-info-number/`, NOT `/qu-info-text-link/`. The
comment is stale.
**Fix:** Either drop "the link" from the comment OR add an assertion on
`qu-info-text-link`. If asserting, note that step 13.5 cleared it — so the
expected value is empty / placeholder text, not `INFO_QUESTION_ANSWERS['test-qu-info-text-link']`.

## Info

### IN-01: `buildMinimal.ts` Pitfall-9 doc-comment cites the helper's responsibility but `deepMerge` does not strip undefined recursively from nested objects

**File:** `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:131-148`
**Issue:**
`deepMerge` skips top-level `overlay[key] === undefined` via `continue` (line
133), but if `overlayVal` is an object containing nested `undefined`
properties, those nested undefineds flow through `JSON.parse(JSON.stringify(base))`
unchanged (JSON.stringify drops undefined property values, so this happens to
work for typical use). Still, if a future consumer passes a `Date` or
`Function` value via overlay, JSON.stringify mangles it silently. The
defense relies on JSON-safe inputs.
**Fix:** Document the JSON-safe-input contract in the JSDoc.

### IN-02: `MINIMAL_BASE_APP_SETTINGS` is declared `as const` — settingsOverlay deep-merge then casts back to `Record<string, unknown>`

**File:** `packages/dev-seed/src/templates/permutations/shared.ts:62-126`
**File:** `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:125-148`
**Issue:**
`MINIMAL_BASE_APP_SETTINGS` is `as const` (readonly recursive type). The
`deepMerge<T>` function signature declares `base: T` where T is forced to
`Record<string, unknown>`. The `as const` type erodes through the
`JSON.parse(JSON.stringify(...))` round-trip, but the type system still
believes the result is the readonly nested-shape. This works at runtime
because JSON.stringify strips readonliness, but a future change to the
return type signature could surface readonly compile errors.
**Fix:** Drop the `as const` annotation OR make `deepMerge` return `T &
Record<string, unknown>`.

### IN-03: 9 perm setup files copy-paste `extraTeardownPrefix: ['test-', 'e2e-perm-']`

**File:** `tests/tests/setup/perm-*.setup.ts` (9 files)
**Issue:**
The same defensive-teardown prefix array is inlined across 9 setup files.
A future change to add a new e2e prefix family (e.g., `'e2e-mega-'`) would
require touching all 9 + the 89-04 + 90 perm setups too. Centralise this
constant in a shared util module.
**Fix:** Export `DEFAULT_EXTRA_TEARDOWN_PREFIX = ['test-', 'e2e-perm-']`
from `tests/tests/setup/setupFromTemplate.ts` (or a sibling) and have setups
import the constant.

### IN-04: 9 perm specs hardcode `STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-*.json')`

**File:** `tests/tests/specs/perm/perm-answers-locked.spec.ts:31`
**File:** `tests/tests/specs/perm/perm-disable-allow-open.spec.ts:29-32`
**File:** `tests/tests/specs/perm/perm-hide-hero.spec.ts:20`
**Issue:**
The storage-state path is duplicated between the setup (where the file is
written) and the spec (where it's consumed). If the perm rename, both files
need to change in sync. The setup files DO export `STORAGE_STATE_PATH` (e.g.,
`export const STORAGE_STATE_PATH` in `perm-answers-locked.setup.ts:25`), but
the spec re-derives it via `path.join` instead of importing the constant.
**Fix:** Import the exported `STORAGE_STATE_PATH` constant from the setup
file in each spec.

### IN-05: `feedbackDialog.fixture.ts` `RATINGS` constant is unused outside `expectRatingValue`

**File:** `tests/tests/fixtures/shared/feedbackDialog.fixture.ts:73`
**Issue:**
`const RATINGS = [1, 2, 3, 4, 5] as const;` is only consumed in one for-of
loop inside `expectRatingValue` to iterate the 5 rating buttons for the
"no rating checked" case. Inline the array literal into the loop or expose
as part of the fixture surface for downstream consumers.
**Fix:** Either inline `for (const value of [1,2,3,4,5] as const)` OR
export the constant so spec files can iterate ratings consistently.

### IN-06: `voter-mega.fixture.ts` `walkVoterMegaJourney` marked `@deprecated` but unused by any internal caller

**File:** `tests/tests/fixtures/voter-mega.fixture.ts:229-242`
**Issue:**
The deprecated wrapper is exported alongside `walkUntilQuestionsIntro` and
`answerAndAdvanceToResults`. If no external consumer imports it, the export
adds clutter. Verify via grep across `tests/` whether any spec still imports
`walkVoterMegaJourney`; if not, remove the deprecated symbol.
**Fix:** Remove `walkVoterMegaJourney` export if no callers remain.

---

_Reviewed: 2026-05-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
