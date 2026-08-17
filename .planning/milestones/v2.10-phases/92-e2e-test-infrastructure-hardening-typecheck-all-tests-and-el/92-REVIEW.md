---
phase: 92-e2e-test-infrastructure-hardening-typecheck-all-tests-and-el
reviewed: 2026-06-03T00:00:00Z
depth: standard
files_reviewed: 41
files_reviewed_list:
  - apps/frontend/src/routes/(voters)/+page.svelte
  - apps/frontend/src/routes/(voters)/intro/+page.svelte
  - package.json
  - tests/tsconfig.json
  - tests/eslint.config.mjs
  - tests/playwright.config.ts
  - tests/tests/helpers/timeouts.ts
  - tests/tests/helpers/index.ts
  - tests/tests/setup/setupFromTemplate.ts
  - tests/tests/setup/data.setup.ts
  - tests/tests/utils/testIds.ts
  - tests/tests/utils/e2eFixtureRefs.ts
  - tests/tests/utils/voterIntro.ts
  - tests/tests/utils/voterNavigation.ts
  - tests/tests/utils/missingNominations.ts
  - tests/tests/fixtures/voter/voterHomePage.fixture.ts
  - tests/tests/fixtures/voter/voterIntroPage.fixture.ts
  - tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts
  - tests/tests/fixtures/resultsPage.fixture.ts
  - tests/tests/fixtures/entityDetails.fixture.ts
  - tests/tests/fixtures/views.ts
  - tests/tests/fixtures/voter-mega.fixture.ts
  - tests/tests/fixtures/candidate/perm-l10n.ts
  - tests/tests/fixtures/candidate/voterNavFixture.fixture.ts
  - tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts
  - tests/tests/specs/voter/voter-mega-journey.spec.ts
  - tests/tests/specs/candidate/candidate-mega-journey.spec.ts
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
  - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
  - tests/tests/specs/perm/perm-disable-candidate-app.spec.ts
  - tests/tests/specs/perm/perm-disable-voter-app.spec.ts
  - tests/tests/specs/perm/perm-hide-all-nominations.spec.ts
  - tests/tests/specs/perm/perm-missing-nominations.spec.ts
  - tests/tests/specs/perm/perm-header-show-help.spec.ts
  - tests/tests/specs/perm/perm-header-show-feedback.spec.ts
  - tests/tests/specs/perm/perm-hide-hero.spec.ts
  - tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts
  - tests/tests/specs/a11y/a11y-smoke.spec.ts
  - tests/tests/helpers/timeouts.ts
  - tests/tests/helpers/index.ts
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 92: Code Review Report

**Reviewed:** 2026-06-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 41
**Status:** issues_found

## Summary

Phase 92 hardens the e2e test infrastructure: new `typecheck:tests` script in `package.json`, a central `timeouts.ts` bucket file, a `seed_` exclusion in the freshness-guard probe, three new voter page fixtures (`voterHomePage`, `voterIntroPage`, `voterQuestionsPage`) with `goToPage`/`expectPageVisible`, extended `resultsPage` and `entityDetails` fixtures, and a tightened ESLint `no-restricted-locators` rule.

Two correctness blockers were found — both in the Phase-92-introduced `goToPage` implementation. A URL-construction error makes every `goToPage` call for non-Home voter routes navigate to an external domain rather than the local test server. This silently broke two existing `perm-localisation-positive` calls that previously used working inline `page.goto('/en/results')` / `page.goto('/fi/results')`. The voter-Home route is accidentally unaffected by the same bug because its `buildRoute` result happens to be the empty string.

A secondary issue discovered during that investigation: even once the double-slash is removed, the `locale` parameter to `goToPage` is silently ignored for all voter routes (because `ROUTE.*` constants contain no `[[lang=locale]]` token), so `resultsPage.goToPage('fi')` would still land on `/results` (the English base-locale URL) rather than `/fi/results`. This invalidates the Finnish-locale voter cross-check assertion in `perm-localisation-positive`.

Everything else — freshness-guard `seed_` exclusion, `TIMEOUTS` bucket values, ESLint `no-restricted-locators` config, `testIds` catalog entries for the two new `data-testid` attributes, TypeScript compilation, and the voter-mega / candidate-mega fixtures — is correct.

---

## Critical Issues

### CR-01: Double-slash protocol-relative URL in `goToPage` for non-Home voter routes

**Files:**
- `tests/tests/fixtures/voter/voterIntroPage.fixture.ts:38`
- `tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts:46`
- `tests/tests/fixtures/resultsPage.fixture.ts:86`

**Issue:**

All three fixtures compute the navigation target as `'/' + buildRoute({ route, locale })`. For non-Home voter routes, `buildRoute` already returns a path beginning with `/` (e.g., `/intro`, `/questions`, `/results`). Prepending another `/` produces a protocol-relative URL (`//intro`, `//questions`, `//results`). Per the WHATWG URL standard — confirmed by `new URL('//results', 'http://localhost:5173').href` — Playwright resolves these as external hosts (`http://results/`, `http://questions/`, `http://intro/`) rather than paths on the test server.

Only `ROUTE.Home` (`'/(voters)'`) produces an empty string from `buildRoute`, making `'/' + '' = '/'` accidentally correct. Every other voter route is broken.

`resultsPage.goToPage` is actively called in `perm-localisation-positive.spec.ts` at lines 339 and 388, replacing previously working `page.goto('/en/results')` and `page.goto('/fi/results')` that were removed in commit `6ebd07a29`. Those tests now navigate to `http://results/` and time out on the subsequent `candidateCard.toBeVisible()` assertion.

All existing correct call sites in the codebase use `page.goto(buildRoute(...))` **without** the `'/'` prefix (see `voter-mega.fixture.ts:111`, `a11y-smoke.spec.ts:119`, `voter-mega-journey.spec.ts:325`).

**Fix:** Remove the `'/' +` prefix from the three affected fixtures. `buildRoute` already returns a leading-slash path for all routes except `Home`; for `Home` the empty string resolves correctly as `'/'` via Playwright's base-URL prepending.

```ts
// voterIntroPage.fixture.ts:38  (same pattern for voterQuestionsPage, resultsPage)
// BEFORE (broken):
await page.goto('/' + buildRoute({ route: 'Intro', locale }));

// AFTER:
await page.goto(buildRoute({ route: 'Intro', locale }));
```

---

### CR-02: `goToPage(locale)` silently ignores the locale for all voter routes — `resultsPage.goToPage('fi')` lands on English `/results`

**File:** `tests/tests/specs/perm/perm-localisation-positive.spec.ts:388` (consumed via `tests/tests/fixtures/resultsPage.fixture.ts:86`)

**Issue:**

`ROUTE.Results` is `'/(voters)/(located)/results'` — it contains no `[[lang=locale]]` token. `buildRoute` only substitutes the locale for segments that literally equal `'[[lang=locale]]'`; the group-path segments `(voters)` and `(located)` are filtered out, and the remainder `/results` has no locale placeholder. Consequently `buildRoute({ route: 'Results', locale: 'fi' })` returns `/results` regardless of the locale argument.

The perm-localisation-positive voter cross-check (step 10) calls `resultsPage.goToPage('fi')` specifically to navigate to `/fi/results` after a `langSelector.switchTo('fi')` reload. Even after fixing CR-01, the call would navigate to `/results` (the English base-locale URL served without a prefix by Paraglide), not `/fi/results`. The Finnish-locale entity-detail assertions at lines 399–408 (`infoTabFi.toContainText('[fi-answer-q1]')` etc.) would then operate on English-locale content and silently pass with the wrong locale.

The locale parameter to `voterHomePage.goToPage` is also never substituted — `'/' + '' = '/'` navigates to the base-locale home in all cases — but since the spec only calls it with `'en'` that is harmless.

**Fix:** Build the locale-prefixed URL explicitly. The Paraglide base-locale (`en`) is served without a prefix; non-base locales get a `/<locale>/` prefix. The voter `buildRoute` should prepend the locale segment conditionally, or — if keeping `buildRoute` generic — the fixture caller must do so:

```ts
// resultsPage.fixture.ts goToPage — correct locale handling
async goToPage(locale = 'en'): Promise<void> {
  const basePath = buildRoute({ route: 'Results', locale });        // '/results'
  const localePfx = locale === 'en' ? '' : '/' + locale;           // '' or '/fi'
  await page.goto(localePfx + basePath);                            // '/results' or '/fi/results'
  await expectPageVisible(true);
},
```

Apply the same pattern to `voterIntroPage.goToPage` and `voterQuestionsPage.goToPage` so they are correct when called with a non-base locale in the future.

---

## Warnings

### WR-01: `matchingCombobox` is a dead locator built with an empty-string fallback when `selectorText` is a RegExp

**File:** `tests/tests/utils/voterIntro.ts:193-228`

**Issue:**

`selectConstituencyAndAdvance` constructs `matchingCombobox` (line 193) to filter comboboxes by the constituency-group label text, but the `has` locator falls back to `page.locator('text=')` (an empty-string match) when `selectorText` is a `RegExp`:

```ts
has: page.locator('text=' + (typeof selectorText === 'string' ? selectorText : ''))
```

This means for every `RegExp` caller — which is the documented operator-amendment A2 primary usage — `matchingCombobox` silently matches ALL comboboxes (Playwright's `text=` with an empty string matches any element). The variable is then discarded via `void matchingCombobox` (line 228) and never used for selection. The actual multi-combobox matching falls through to the manual `aria-label` / `textContent` loop below (lines 214–238), which is correct. So the dead locator does not cause incorrect behavior, but it misleads readers: the `matchingCombobox` variable looks authoritative but is a no-op for RegExp inputs.

**Fix:** Remove `matchingCombobox` entirely (it is never used for selection). The `void matchingCombobox` at line 228 can be removed with it. The ESLint-suppression comment above it also becomes unnecessary.

---

### WR-02: `feedback-form` testId used as a magic string literal in `perm-header-show-feedback.spec.ts`

**File:** `tests/tests/specs/perm/perm-header-show-feedback.spec.ts:27`

**Issue:**

The spec asserts `page.getByTestId('feedback-form')` but `'feedback-form'` is not registered in `testIds.ts`. All other testId values consumed by specs are looked up via the catalog (`testIds.shared.*`, `testIds.voter.*`, etc.) so drift from the frontend is caught at one central place. A raw string literal here creates an uncatalogued dependency on `Feedback.svelte:158`'s `data-testid="feedback-form"`.

**Fix:** Add `testIds.shared.feedbackForm` (or equivalent namespace) to `testIds.ts` and replace the literal in the spec:

```ts
// testIds.ts (add inside shared:)
feedbackForm: 'feedback-form',

// perm-header-show-feedback.spec.ts:27 (replace literal)
await expect(page.getByTestId(testIds.shared.feedbackForm)).toBeVisible();
```

---

### WR-03: `selectConstituencyAndAdvance` does not close the listbox on a non-matching combobox

**File:** `tests/tests/utils/voterIntro.ts:214-238`

**Issue:**

In the multi-combobox iteration (lines 214–230), when the loop evaluates a combobox whose `aria-label`/`textContent` does NOT match `selectorText` and `comboboxCount > 1`, the loop calls `continue` without closing the listbox. However, on the iteration where `nameMatches` IS true (or when `comboboxCount === 1`), the code clicks the combobox to open its listbox. If a previous iteration left a different combobox's listbox open, the `page.getByRole('listbox')` on line 232 resolves to the previously-opened listbox, and the option click may land in the wrong selector.

In practice this only occurs if the combobox's `aria-label` / `textContent` do NOT match the `selectorText` check — in that case the loop skips via `continue` at line 229 WITHOUT having called `cb.click()`, so no listbox is opened. The actual click that opens a listbox only happens on the matched iteration. So the path that would leave a stale listbox open cannot be reached. However, the logic is non-obvious and fragile: adding a click-and-bail path above the current `continue` would silently break this.

**Fix:** Add an explicit assertion that no listbox is visible at the start of each iteration (or at least add a comment documenting the invariant that the loop only clicks a combobox on a match):

```ts
// Add before the `nameMatches` check to surface regressions:
if (!nameMatches && comboboxCount > 1) {
  // This combobox was NOT opened (no cb.click() above), so no listbox
  // was opened. Continue to the next combobox.
  void matchingCombobox;
  continue;
}
```

The code is already correct; this is a documentation/defensive-assert issue.

---

## Info

### IN-01: `voterIntroPage.goToPage` and `voterQuestionsPage.goToPage` are not yet called from any spec — latent bug, not a live failure

**Files:**
- `tests/tests/fixtures/voter/voterIntroPage.fixture.ts:38`
- `tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts:46`

**Issue:**

Both fixtures carry the same double-slash bug described in CR-01 and the locale-silencing issue described in CR-02. Unlike `resultsPage.goToPage`, neither is called from any spec in the current codebase (confirmed by grep). The bugs are latent but will surface the moment any spec calls `voterIntroPage.goToPage` or `voterQuestionsPage.goToPage`.

**Fix:** Apply the same corrections as CR-01 and CR-02 now to prevent test regressions when these fixtures are first consumed.

---

### IN-02: `tab-1` hardcoded index-based testId in `perm-localisation-positive.spec.ts`

**File:** `tests/tests/specs/perm/perm-localisation-positive.spec.ts:364,405`

**Issue:**

`dialog.getByTestId('tab-1').click()` (lines 364, 405) selects the Opinions tab by position index. The `Tabs.svelte` component generates `data-testid="tab-{index}"` so `tab-1` is always the second tab. For a candidate entity-details panel rendered by the perm-l10n seed, the expected order is `[info (tab-0), opinions (tab-1)]`, so this works currently. If the order changes (e.g., a "children / members" tab is added or reordered), `tab-1` silently clicks the wrong tab.

The `entityDetails.fixture.ts` already provides a correct `selectTab('opinions')` method that uses the i18n-mapped accessible name (`/opinions/i`) and is robust to tab reordering.

**Fix:** Replace the two raw `tab-1` clicks with the `entityDetails.selectTab('opinions')` method. This spec currently bypasses the fixture for the opinions-tab navigation step; switching to the fixture method removes the index dependency:

```ts
// Instead of:
await dialog.getByTestId('tab-1').click();

// Use the entityDetails fixture's selectTab (requires wiring entityDetails into perm-l10n.ts):
await entityDetails.selectTab('opinions');
```

Note: `entityDetails` fixture is not currently registered in `perm-l10n.ts`. Alternatively, keep the raw click but use `getByRole('tab', { name: /opinions/i })` to remove the index dependency without restructuring the fixture.

---

_Reviewed: 2026-06-03T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
