---
phase: 90-tir5-permutations-missing-nominations-warning-localisation-n
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte
  - apps/frontend/src/lib/i18n/init.ts
  - apps/frontend/src/lib/i18n/tests/init.override.test.ts
  - packages/app-shared/src/settings/dynamicSettings.i18n.test.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts
  - packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts
  - packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts
  - tests/playwright.config.ts
  - tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts
  - tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts
  - tests/tests/fixtures/candidate/perm-l10n.ts
  - tests/tests/setup/perm-localisation-negative.setup.ts
  - tests/tests/setup/perm-localisation-negative.teardown.ts
  - tests/tests/setup/perm-localisation-positive.setup.ts
  - tests/tests/setup/perm-localisation-positive.teardown.ts
  - tests/tests/setup/perm-missing-nominations.setup.ts
  - tests/tests/setup/perm-missing-nominations.teardown.ts
  - tests/tests/specs/perm/perm-localisation-negative.spec.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
  - tests/tests/specs/perm/perm-missing-nominations.spec.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 3
  warning: 5
  info: 4
  total: 12
status: issues_found
---

# Phase 90: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 23 (1 file listed in config + the 23 actually delivered)
**Status:** issues_found

## Summary

Phase 90 ships three new perm-* templates (missing-nominations, localisation-negative, localisation-positive), their setup/teardown drivers, two new spec files, two new candidate fixtures, a fixture composition root (`perm-l10n.ts`), and a Stage A i18n runtime override surface (`applyDynamicOverride`, the `i18n.supportedLocales` DynamicSettings key, and corresponding tests).

Three BLOCKERs were discovered. The two most severe are tightly coupled:

1. The Stage A runtime override `applyDynamicOverride()` in `apps/frontend/src/lib/i18n/init.ts` is **never called from production code**. Both localisation perms depend on this wiring to drop the user-facing locale list; without it the override is dead and every assertion in both localisation specs that depends on `locales.length` is broken.
2. The `langSelector.switchTo()` fixture waits for a `/<locale>/` URL prefix, but Paraglide is configured so the base locale (`en`) is served from `/` with NO prefix — `switchTo('en')` in the positive spec will hang for the full Playwright per-test budget.
3. `perm-localisation-positive.spec.ts` step 10 navigates to `/fi/results` after a locale switch and expects the candidate-details dialog to contain the Finnish answer `[fi-answer-q1]` and `[fi-answer-q3]`, but those values are authored ONLY into the candidate's profile/comment form state and `candidateProfilePage.submit()` is only awaited for q1; q3's Finnish authoring is committed by `clickContinue()` advancing to q4, but q4 is then advanced past via a second `clickContinue()` whose target route is unverified — and the voter-side dialog reads from `entity.answers`, not the candidate form. The cross-check is fragile and likely to fail.

Several other defects degrade reliability or correctness — see WARNINGS below.

The CONTEXT D-90-10 wiring contract is not honored anywhere outside the unit tests. This is the largest single risk in the phase.

## Critical Issues

### CR-01: Stage A runtime override has no production caller — localisation perms cannot pass

**File:** `apps/frontend/src/lib/i18n/init.ts:53` (declaration) ↔ `apps/frontend/src/routes/+layout.ts:17-44` (the layout that the doc-comment says should call it)

**Issue:** `applyDynamicOverride()` is exported and exercised in `init.override.test.ts`, and the JSDoc explicitly states "call this from `+layout.ts`'s `load()` BEFORE any module reads `locales`/`defaultLocale`". A repo-wide grep confirms there is NO call site outside the test file:

```
$ grep -rn "applyDynamicOverride" apps/frontend/src/
apps/frontend/src/lib/i18n/init.ts:53  (declaration)
apps/frontend/src/lib/i18n/init.ts:30  (doc comment)
apps/frontend/src/lib/i18n/init.ts:83,96,140 (doc comments)
apps/frontend/src/lib/i18n/tests/init.override.test.ts (unit test)
```

`apps/frontend/src/routes/+layout.ts` loads `appSettingsData` via the data provider but never threads it into `applyDynamicOverride()`. At runtime the module-load derivation runs once with `_dynamicOverride === undefined`, so `locales` equals the full Paraglide compile-time superset (`en/fi/sv/da/et/fr/lb` — 7 entries).

Downstream consequences for the perm specs:

1. `perm-localisation-negative.spec.ts:84` calls `langSelector.expectHidden()`. The hide gate is `locales.length > 1`, which is `7 > 1 === true`. The NavGroup renders. Assertion FAILS.
2. `perm-localisation-negative.spec.ts:125, 128, 145, 156` call `multilingualTextField.expectTranslationOptions(scope, false)`. The Input toggle gate is `multilingual && locales.length > 1` — locales.length is 7. The toggle renders for q1 and q3/q4-comment (q2/q4 still pass because of `customData.disableMultilingual=true`). Assertions on q1 and q3-comment FAIL.
3. `perm-localisation-positive.spec.ts:115` calls `langSelector.expectVisible(['en', 'fi'])`. Coincidentally passes because the helper does NOT assert exclusivity — but the rendered NavGroup contains 7 NavItems, not 2. The phase's stated TIR5:52-95 contract is silently violated.

**Fix:** Wire `applyDynamicOverride` into the root layout BEFORE any consumer reads from `init.ts` exports. Two viable shapes:

```ts
// apps/frontend/src/routes/+layout.ts
import { applyDynamicOverride } from '$lib/i18n/init';
// ...
const [appSettingsData, electionData, constituencyData] = await Promise.all([...]);

// Apply BEFORE returning data so downstream layout load() functions and
// components see the post-override locales.
if (appSettingsData && !(appSettingsData instanceof Error)) {
  applyDynamicOverride(appSettingsData);
}

return { appCustomizationData, appSettingsData, electionData, constituencyData };
```

Cover with an integration test (Vitest + a mock DynamicSettings) or a frontend Playwright assertion that proves the negative perm sees `locales.length === 1` at runtime.

Without this fix all three new spec files in the localisation chain will hang or fail, and the phase's D-90-10 contract is unmet.

**Severity:** BLOCKER

---

### CR-02: `langSelector.switchTo('en')` regex never matches Paraglide's baseLocale URL — positive spec will time out

**File:** `tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts:104-107`

**Issue:** The fixture waits for the post-click URL to match `^https?://[^/]+/${locale}/`. For `locale='en'` this is `^https?://[^/]+/en/`.

The Paraglide runtime config at `apps/frontend/src/lib/paraglide/runtime.js:57-91` makes `en` the baseLocale, with its localized url pattern set to `:protocol://:domain(.*)::port?/:path(.*)?` — **no `/en/` prefix**. The implementation at `localizeUrlDefaultPattern` (line 991-1012) explicitly removes a leading locale segment and, for baseLocale, omits any prefix:

```js
// For base locale, don't add prefix
if (locale === baseLocale) {
    urlObj.pathname = "/" + pathSegments.join("/");
}
```

So when `perm-localisation-positive.spec.ts:148` calls `await langSelector.switchTo('en')`, the click navigates to (e.g.) `http://localhost:5173/results` or `http://localhost:5173/`, neither of which match `/en/`. `page.waitForURL` blocks until the per-test timeout (180s in this spec). The test fails with a Playwright timeout error.

Same defect affects `switchTo('en')` after the Finnish dialog cross-check (line ~304 indirectly — wait, line 304 is `switchTo('fi')` which DOES use a /fi/ prefix, so OK). The defective callsites are `:148` and any future `switchTo('en')`.

**Fix:** Make the regex baseLocale-aware. Either:

```ts
async switchTo(locale: string): Promise<void> {
  const name = displayNameFor(locale);
  const selector = page.getByTestId(testIds.shared.langSelector);
  const item = selector
    .getByTestId(testIds.shared.navigation.menuItem)
    .filter({ hasText: new RegExp(`^${name}$`, 'i') });
  // baseLocale ('en') is served from /, non-base locales from /<locale>/
  const baseLocale = 'en';
  const urlPattern =
    locale === baseLocale
      ? new RegExp(`^https?://[^/]+/(?!(fi|sv|da|et|fr|lb)(/|$))`)
      : new RegExp(`^https?://[^/]+/${locale}(/|$)`);
  await Promise.all([
    page.waitForURL(urlPattern),
    item.click()
  ]);
}
```

Or import `baseLocale` from `$lib/paraglide/runtime` and use a deLocalized assertion. Whatever the shape, prove it with a unit test or a focused Playwright assertion.

**Severity:** BLOCKER

---

### CR-03: Positive spec's voter cross-check authors Finnish state through wrong layer — assertion `infoTabFi toContainText('[fi-answer-q1]')` will fail

**File:** `tests/tests/specs/perm/perm-localisation-positive.spec.ts:204-260, 322-330`

**Issue:** The spec authors Finnish translations into the candidate's profile UI:

- Line 207-209: `openTranslations → setLocaleValue(q1Scope, 'fi', '[fi-answer-q1]') → closeTranslations`
- Line 240-242: same for q3 comment

Then at line 224 `candidateProfilePage.submit()` is awaited and at line 247 `clickContinue()` is awaited after q3 — these should persist q1+q3 Finnish answers.

But there are two problems:

1. **q3 save chain is wrong.** The spec calls `setLocaleValue(q3CommentScope, 'fi', '[fi-answer-q3]')` (line 241), `closeTranslations` (line 242), `expectLocaleHidden` (line 243). Closing translations triggers `handleToggleTranslations` → `refocus()` but does NOT save. The `clickContinue` at line 247 then triggers the question's save handler. However, looking at `multilingualTextField.setLocaleValue` (lines 107-111), the implementation calls `field.fill(value)` then `field.blur()`. The Input.svelte handler at `onchange={(e) => handleChange(e, locale)}` triggers on blur, so this should work — but only if the candidate question page's per-question save actually round-trips multilingual comment data. There's no assertion proving the Finnish value was committed before the voter check at line 313-326.

2. **The voter cross-check timing is unreliable.** After logout at line 271, the spec immediately goes to `/en/results` (line 277). Server-side denormalization of candidate answers may lag the candidate's session-close write. There's no `expect…toContainText` retry/wait that's tolerant of write-lag — `expect(infoTabFi).toContainText('[fi-answer-q1]')` will hard-fail on the first poll if the writer hasn't surfaced the answer yet.

3. **There is no positive proof Finnish persists at all** — the spec never re-opens the candidate-profile to assert that q1 still carries `[fi-answer-q1]`. Defensively introducing that re-open would surface the broken commit before the voter step.

**Fix:** Add an explicit verification step after `candidateProfilePage.submit()` and after `clickContinue()` that re-navigates to `/en/candidate/profile`, re-opens the q1 translations, and asserts the field still holds `[fi-answer-q1]`. Do the same for q3 (re-navigate to `/en/candidate/questions/<id>` for q3). Only then proceed to logout + voter cross-check. Also extend the timeouts on the voter `.toContainText('[fi-answer-q1]')` assertions to ride out denorm lag (e.g., `timeout: TIMEOUT.slowPage`).

**Severity:** BLOCKER

---

## Warnings

### WR-01: `perm-missing-nominations.spec.ts` does not validate the constituency selector is auto-completed

**File:** `tests/tests/specs/perm/perm-missing-nominations.spec.ts:47-53`

**Issue:** The spec's doc-comment claims the constituency selector "either auto-advances (single-CG/single-CO collapse) or accepts a single continue click." The implementation in `apps/frontend/src/routes/(voters)/constituencies/+page.svelte` declares `let canSubmit = $derived(selectionComplete);` and `selectionComplete` is bound to the underlying `ConstituencySelector` component, which only flips to `true` when `sections.every((s) => s.selectedId)`. With a single CG carrying a single CO, the `SingleGroupConstituencySelector` may auto-select the only option, but this is not proven anywhere — and the spec does not assert `toBeEnabled()` on the continue button before clicking.

If the auto-select does not fire, clicking a disabled button is a no-op, then `page.goto('/en/results')` (line 53) bypasses the persistence layer entirely. `voterCtx.selectedConstituencies` is then empty, and:

- The (located) layout's `nominationsAvailable` may not populate, hiding the modal.
- OR, the (located) layout redirects to `/constituencies?next=/results` per the CLEAN-02 contract — the modal never opens.

Either path causes the modal assertion at line 56-57 to fail with no clear diagnostic — the spec just times out on `expect(modal).toBeVisible()`.

**Fix:** Either (a) add an explicit `await expect(continue).toBeEnabled()` precondition before the constituencies-continue click; or (b) drive selection deterministically via the shared `fillAllConstituencies` helper (already implemented at `tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts:36`); or (c) explicitly verify the auto-advance assumption via a Wave-0 probe and document the result in PATTERNS.md. Mirror the strong-locator approach used by other perm specs in the family.

**Severity:** WARNING

---

### WR-02: `init.ts` overrides exported as mutable `let` — risk of consumer caching stale values across `applyDynamicOverride` calls

**File:** `apps/frontend/src/lib/i18n/init.ts:85, 92, 106`

**Issue:** `langNames`, `defaultLocale`, and `locales` are `export let`. Live ESM bindings work for direct property reads, but:

1. Any module that imports and **destructures** these (e.g., `const { locales } = await import('./init')`) captures the snapshot at destructure time. The same trap documented in CLAUDE.md's "Context Destructuring Rule (Svelte 5)" applies at the module-binding level.
2. Existing consumers like `LanguageSelection.svelte` use `import { locales } from '$lib/paraglide/runtime'` for the type but `from '$lib/contexts/app'` for the value — the live binding is bypassed entirely. The Stage A override surface assumes consumers read `init.ts`'s exports, but `LanguageSelection` actually reads `getAppContext().locales`, which is constructed by `initI18nContext` (not shown in this review's scope).

This is a soft architectural risk — the override surface and the consumer surface are decoupled through an intermediate context. Without an integration test the wiring is unverified.

**Fix:** Add an integration test that:
1. Boots a Svelte component renderer with a DynamicSettings carrying `i18n.supportedLocales = [{code:'en'}]`.
2. Calls `applyDynamicOverride(...)`.
3. Renders `<LanguageSelection />` inside a mocked AppContext that reads from `init.ts`.
4. Asserts the rendered output contains 0 NavItems.

The current test (`init.override.test.ts`) only proves the `locales` export changes — it does NOT prove `LanguageSelection.svelte` sees the change.

**Severity:** WARNING

---

### WR-03: `applyDynamicOverride` referential-equality short-circuit can wrongly skip work

**File:** `apps/frontend/src/lib/i18n/init.ts:57-59`

**Issue:**

```ts
const normalised =
  next && Array.isArray(next) && next.length > 0 ? (next as ReadonlyArray<LocaleConfig>) : undefined;
if (normalised === _dynamicOverride) return;
```

The short-circuit uses `===` reference equality. If a caller passes a NEW array literal carrying the same content as the previously applied override, `recomputeDerivations()` will run — correct. But if a caller passes the SAME array reference twice (e.g., a memoized DynamicSettings object whose `i18n.supportedLocales` array is stable), the short-circuit returns early. This is correct only if the array's contents are guaranteed immutable. The type signature uses `ReadonlyArray`, which is a TypeScript-only marker — at runtime the array can be mutated, in which case the consumer's mutation is silently lost.

This is a latent bug — likely never triggered in production with the current data-provider shape, but the contract is brittle.

**Fix:** Either deep-compare against `_dynamicOverride` (e.g., JSON.stringify) before short-circuiting, or document the assumption explicitly and freeze the array on apply (`Object.freeze(normalised)`).

**Severity:** WARNING

---

### WR-04: `perm-missing-nominations.spec.ts` assertion on localized text 'not available' is fragile

**File:** `tests/tests/specs/perm/perm-missing-nominations.spec.ts:67-70`

**Issue:** `await expect(modal).toContainText(/not available/);` matches the exact verbatim English translation from `apps/frontend/src/lib/i18n/translations/en/results.json` (key `missingNominations.noNominationsForElection`). If the translation team changes the wording (e.g., to "Not yet available" or "No nominations"), this assertion fails silently with no breadcrumb to the change.

This contradicts the rigidity contract's preference for stable-ID assertions (D-90-03 + D-90-06 are explicitly cited as the basis for the `[EL1]/[EL2]` matchers immediately above).

**Fix:** Replace the literal `not available` regex with a stable-ID approach. Options:
1. Add a `data-testid` to the `<span class="text-secondary font-normal">` in `(voters)/(located)/+layout.svelte:206`, e.g., `data-testid="missing-nominations-marker"`, and assert on its presence beside `[EL2]`.
2. Assert that the modal contains an element with `name="close"` (the icon used for unavailable elections) inside the row containing `[EL2]`.

Either is more durable across translation changes than a raw English string match.

**Severity:** WARNING

---

### WR-05: Both localisation perm templates duplicate `buildElectionConstituencyNomsSingleOrg` verbatim

**File:** `packages/dev-seed/src/templates/permutations/perm-localisation-negative.ts:248-280` and `packages/dev-seed/src/templates/permutations/perm-localisation-positive.ts:256-288`

**Issue:** The two files contain identical helper functions, including identical doc-comments. The positive file's doc-comment even acknowledges this ("Mirror of the helper in perm-localisation-negative.ts (kept file-local; this is the only OTHER perm with the same 1-org topology — both Plan 90-03 + 90-04 keep their own copies to avoid premature promotion to shared.ts)").

While the intent (avoid premature abstraction) is reasonable, the duplication is now real and is at risk of bit-rot — a fix to one copy will not propagate to the other.

**Fix:** Either promote the helper to `shared.ts` (the rationale for "premature" has expired now that both consumers exist), or factor it into a sibling module under `permutations/_helpers/`. Add a CHANGELOG-style header to whichever shape is chosen so future perms can find the helper without scanning.

**Severity:** WARNING

---

## Info

### IN-01: `LanguageSelection.svelte` line 21 is unindented

**File:** `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte:21-22`

**Issue:** Mixed indentation:

```
  import { assertTranslationKey } from '$lib/i18n/utils/assertTranslationKey';
import { localizeHref } from '$lib/paraglide/runtime';
  import type { locales as paraglideLocales} from '$lib/paraglide/runtime';
```

Line 21 (`localizeHref` import) is unindented relative to the surrounding imports. Line 22 has `paraglideLocales}` with no space before the brace.

**Fix:** Run `yarn format` over the file.

**Severity:** INFO

---

### IN-02: `langSelectorFixture.switchTo` calls `displayNameFor(locale)` twice

**File:** `tests/tests/fixtures/candidate/langSelectorFixture.fixture.ts:98-99`

**Issue:**

```ts
async switchTo(locale: string): Promise<void> {
  displayNameFor(locale); // validate
  const name = displayNameFor(locale);
  ...
}
```

Line 98's "validate" comment is misleading — line 99 already validates via the same throw path. The first call is dead code.

**Fix:** Remove line 98 entirely; the second call is sufficient validation AND captures the result.

**Severity:** INFO

---

### IN-03: `multilingualTextFieldFixture` carries unused `LOCALE_DISPLAY_NAMES` entries

**File:** `tests/tests/fixtures/candidate/multilingualTextFieldFixture.fixture.ts:49-54` and `langSelectorFixture.fixture.ts:39-44`

**Issue:** Both fixtures define entries for `sv` (Svenska) and `et` (Eesti), but Phase 90's perms only exercise `en` and `fi`. Future locales should be added as their tests land, not preemptively.

**Fix:** Either delete the unused entries, or wire them through a single source-of-truth map (e.g., `tests/tests/utils/localeNames.ts`) so the two fixtures stay in sync.

**Severity:** INFO

---

### IN-04: Phase 90 expanded `testIds.shared.langSelector` + `multilingualToggle` but did not update any existing fixture that needed them

**File:** `tests/tests/utils/testIds.ts:238-239` (new keys)

**Issue:** The new keys are referenced by the two new fixtures only. Existing fixtures like the candidate-translation/profile flow may also benefit from these constants (replacing inline `'lang-selector'` strings); the phase did not perform a global sweep.

**Fix:** Run `grep -rn "'lang-selector'\|'multilingual-toggle'" tests/` and replace inline literals with the new constants. Low-risk hygiene improvement.

**Severity:** INFO

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
