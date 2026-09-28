# Phase 4: Voter App Settings and Edge Cases - Research

**Researched:** 2026-03-08
**Domain:** Playwright E2E testing of configuration-driven voter features (settings toggles, popups, static pages)
**Confidence:** HIGH

## Summary

Phase 4 tests configuration-driven voter features that depend on app settings toggled at runtime via `strapiAdminClient.updateAppSettings()`. The primary patterns are well-established from Phase 2 (candidate-settings.spec.ts) and Phase 3 (voter fixture, serial describe blocks). The three spec files cover: (1) settings-toggled features (category selection, category/question intros, minimum answers threshold with results link), (2) popup timing (feedback and survey popups on results page), and (3) static pages (about, info, privacy, nominations).

All features have been verified in the frontend source code. The implementation patterns are straightforward -- settings control route guards, component visibility, and popup countdowns. The test data setup from Phase 3 already configures a working voter journey baseline with `questionsIntro.show: false` and `categoryIntros.show: false`, which Phase 4 tests will toggle on per-describe-block.

**Primary recommendation:** Follow the Phase 2 settings toggle pattern (StrapiAdminClient in beforeAll/afterAll per describe block) and the Phase 3 voter fixture for answer-dependent features. New page objects needed: minimal, mainly locator helpers for category intro, question intro, and nomination pages.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Per-test API toggle via `strapiAdminClient.updateAppSettings()` -- same pattern as Phase 2 app-mode tests
- Each describe block enables settings it needs in beforeAll, restores defaults in afterAll -- self-contained and independently runnable
- No separate datasets or Playwright projects needed -- reuse existing data-setup with runtime settings changes
- Phase 3's data.setup.ts defaults (categoryIntros.show: false, questionsIntro.allowCategorySelection: false, questionsIntro.show: false) remain unchanged
- Category selection: Enable `questionsIntro.show`, `questionsIntro.allowCategorySelection`, and `categoryIntros.show` via API, select subset, verify filtering
- Category intro: verify intro renders when `categoryIntros.show: true`, test skip button when `categoryIntros.allowSkip: true`
- Minimum answers threshold: progressive answering with boundary testing (0 answers -> below threshold -> cross threshold)
- Results link in header: verify disabled state below threshold, enabled state above threshold
- Popup delays set to 1-2 seconds via API (not 0) to verify timing mechanism without long waits
- Feedback popup: verify appears after delay on results page, check heading and key interactive element
- Survey popup: verify appears after delay, check for survey link element
- Test both states: verify popups appear when enabled, verify popups DON'T appear when setting is null/disabled
- Test dismissal memory: after dismissing, verify it doesn't reappear on reload (userPreferences localStorage)
- Static pages: renders without error + 1-2 key elements (heading, main content area). Light smoke test
- Nominations page: enable `showAllNominations` via API, verify renders with candidate/party entries. Also verify NOT accessible when disabled
- Statistics page (VOTE-14): SKIPPED -- WIP in codebase, too unstable
- 3 spec files: `voter-settings.spec.ts`, `voter-popups.spec.ts`, `voter-static-pages.spec.ts`
- voter-settings: serial within each describe block
- voter-popups: serial within describe blocks
- voter-static-pages: parallel execution

### Claude's Discretion
- Page object design for new voter pages (StaticPage, NominationsPage, CategoryIntroPage, QuestionIntroPage)
- Exact testIds needed for new elements (popup containers, category intro skip button, nominations list)
- How to wait for popup appearance (Playwright waitFor with timeout matching delay + buffer)
- Whether nominations page needs its own page object or shares with a generic pattern
- Exact threshold value used in minimum answers test

### Deferred Ideas (OUT OF SCOPE)
- Statistics page testing (VOTE-14) -- deferred until page is no longer WIP
- localStorage answer recall testing (persistence across sessions) -- deferred from Phase 3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VOTE-13 | Category selection feature tested (`allowCategorySelection` setting) | Questions intro page at `(located)/questions/+page.svelte` renders category checkboxes when `allowCategorySelection: true` with `data-testid="voter-questions-category-checkbox"` and category list `data-testid="voter-questions-category-list"`. Start button `data-testid="voter-questions-start"` is disabled until selected categories meet minimumAnswers threshold |
| VOTE-14 | Statistics page tested | SKIPPED per user decision -- WIP/unstable in codebase. Route exists at `(located)/results/statistics` |
| VOTE-15 | Feedback popup tested (displays after configured delay) | `results.showFeedbackPopup` is a number (seconds) or null. `startFeedbackPopupCountdown(delay)` in appContext.ts uses setTimeout to push FeedbackPopup to popupQueue. FeedbackPopup renders as Alert with `role="dialog"`, heading "feedback.popupTitle", and Feedback form |
| VOTE-16 | Survey popup tested (displays in results) | Requires `survey.showIn` includes `'resultsPopup'` AND `results.showSurveyPopup` delay. SurveyPopup renders as Alert with `role="dialog"`, heading from `dynamic.survey.popupTitle`, SurveyButton link, and close button |
| VOTE-17 | Results link in header tested (appears after minimum answers) | Questions layout at `(located)/questions/+layout.svelte` sets `actions.results` based on `showResultsLink`. Banner.svelte renders Button with `disabled={!$resultsAvailable}`. `resultsAvailable` derived from `countAnswers >= minimumAnswers` per election. Banner button has NO data-testid -- needs either testid addition or role-based locator |
| VOTE-18 | About, help, info, and privacy pages render correctly | About: `data-testid="voter-about-content"`, `data-testid="voter-about-return"`. Info: `data-testid="voter-info-content"`, `data-testid="voter-info-return"`. Privacy: `data-testid="voter-privacy-content"`, `data-testid="voter-privacy-return"`. Help route redirects to About (`ROUTE.Help === ROUTE.About`) |
| VOTE-19 | Nominations page tested (when `showAllNominations=true`) | `nominations/+layout.ts` checks `appSettings.entities.showAllNominations`, redirects to Home if false. Page renders `data-testid="voter-nominations-container"`, `data-testid="voter-nominations-list"`, `data-testid="voter-nominations-controls"` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | 1.58.2 | E2E test framework | Already installed and configured in project |
| StrapiAdminClient | project util | API-based settings management | Established in Phase 1, used in Phase 2 for settings toggles |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| voterTest fixture | project fixture | Pre-answered voter journey | Popup tests that need results page with answers completed |
| testIds | project util | Centralized testId constants | All element location via getByTestId |
| buildRoute | project util | Route URL construction | Direct page navigation in tests |

### No New Dependencies
No new packages needed. All testing infrastructure exists from Phases 1-3.

## Architecture Patterns

### Recommended Spec File Structure
```
tests/tests/
  specs/voter/
    voter-settings.spec.ts      # VOTE-04, VOTE-05, VOTE-07, VOTE-13, VOTE-17
    voter-popups.spec.ts         # VOTE-15, VOTE-16
    voter-static-pages.spec.ts   # VOTE-18, VOTE-19
  pages/voter/
    QuestionsIntroPage.ts        # NEW - questions intro page object
    CategoryIntroPage.ts         # NEW - category intro page object
    (existing page objects reused as-is)
```

### Pattern 1: Settings Toggle per Describe Block
**What:** Each describe block creates its own StrapiAdminClient, enables required settings in beforeAll, restores defaults in afterAll.
**When to use:** Any test that depends on modified app settings.
**Example:**
```typescript
// Source: tests/tests/specs/candidate/candidate-settings.spec.ts (Phase 2 pattern)
test.describe('category selection (VOTE-13)', () => {
  const client = new StrapiAdminClient();

  test.beforeAll(async () => {
    await client.login();
    await client.updateAppSettings({
      questions: {
        questionsIntro: { show: true, allowCategorySelection: true },
        categoryIntros: { show: true, allowSkip: true }
      }
    });
  });

  test.afterAll(async () => {
    // Restore data.setup.ts defaults
    await client.updateAppSettings({
      questions: {
        questionsIntro: { show: false, allowCategorySelection: false },
        categoryIntros: { show: false }
      }
    });
    await client.dispose();
  });

  // Tests run serially within this block
  test('should show category checkboxes', async ({ page }) => { /* ... */ });
});
```

### Pattern 2: Popup Timing with Short Delays
**What:** Set popup delay to 1-2 seconds via API, use Playwright `waitFor` with timeout = delay + buffer (e.g., delay * 1000 + 5000ms buffer).
**When to use:** Feedback and survey popup tests.
**Key insight:** The popup mechanism uses `setTimeout(delay * 1000)` in `appContext.ts`, then pushes component to `popupQueue`. The popup renders as an Alert with `role="dialog"`. Use `page.getByRole('dialog')` to locate.
```typescript
// Set short delay for testing
await client.updateAppSettings({
  results: { showFeedbackPopup: 2 } // 2 seconds
});

// Navigate to results, then wait for popup
await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 7000 });
```

### Pattern 3: Progressive Answer Count for Threshold Testing
**What:** Use the voterTest fixture with `voterAnswerCount` option to answer a specific number of questions, testing below/at/above threshold.
**When to use:** VOTE-07 below-threshold and VOTE-17 results link tests.
```typescript
// Answer fewer questions than minimumAnswers threshold
voterTest.use({ voterAnswerCount: 2 }); // Below default threshold of 5
```

### Pattern 4: Parallel Static Page Tests
**What:** Independent page render tests that don't share state.
**When to use:** About, info, privacy, nominations page smoke tests.
```typescript
// Each test is independently navigable -- no serial mode needed
test('about page renders', async ({ page }) => {
  await page.goto(buildRoute({ route: 'About', locale: 'en' }));
  await expect(page.getByTestId('voter-about-content')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
});
```

### Anti-Patterns to Avoid
- **waitForTimeout for popup delays:** ESLint no-wait-for-timeout rule prohibits this. Use `element.waitFor({ state: 'visible', timeout: X })` instead.
- **Relying on default popup delays (180s/500s):** Set delays to 1-2s via API before each test block. Default delays would make tests impossibly slow.
- **Not restoring settings in afterAll:** Would break subsequent tests. Always restore Phase 3 data.setup.ts defaults.
- **Testing popup content deeply:** Popups are complex (feedback forms, survey links). Verify they appear (role=dialog visible) and have key elements. Don't test full form submission.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Settings management | Custom fetch calls | `StrapiAdminClient.updateAppSettings()` | Already handles auth, content-manager API format, parsed JSON |
| Voter journey to results | Manual click-through in each test | `voterTest` fixture with `answeredVoterPage` | 16-question journey would add 30s+ to each test |
| Route URL construction | Hardcoded URL strings | `buildRoute({ route: 'About', locale: 'en' })` | Handles locale insertion, route group removal |
| Popup detection | Custom DOM polling | `page.getByRole('dialog').waitFor()` | Alert component renders with role="dialog", Playwright handles polling |

## Common Pitfalls

### Pitfall 1: Popup Queue Ordering
**What goes wrong:** The voter layout queues notification and data consent popups on mount. If these appear before the feedback/survey popup, the test may detect the wrong dialog.
**Why it happens:** `popupQueue` is FIFO. Layout pushes notification + data consent on mount, then results page starts countdown for feedback/survey.
**How to avoid:** Ensure notification popup is disabled (`notifications.voterApp.show: false`) and data consent is not triggered (`analytics.trackEvents: false` or `userPreferences.dataCollection.consent` already set). Alternatively, dismiss other dialogs before waiting for the target popup.
**Warning signs:** Test finds a dialog but assertions on its content fail.

### Pitfall 2: Settings Object Overwrite (Not Merge)
**What goes wrong:** Sending `{ questions: { questionsIntro: { show: true } } }` might clear `categoryIntros` settings.
**Why it happens:** The Strapi content-manager API overwrites settings by root key. If you send only `questionsIntro`, the `categoryIntros` sibling might be cleared depending on how the backend processes the update.
**How to avoid:** Always send the COMPLETE sibling settings when updating a nested key. Use spread pattern: `{ questions: { questionsIntro: {...}, categoryIntros: {...} } }`.
**Warning signs:** Settings that were set in a previous test suddenly become undefined.

### Pitfall 3: Questions Intro Page Redirect on Mount
**What goes wrong:** The questions intro page (`/questions/+page.svelte`) has an `onMount` that redirects if `questionsIntro.show` is false. If the setting hasn't propagated yet, the redirect might fire even after enabling the setting.
**Why it happens:** The app reads settings from page data, which is server-rendered. The client-side `onMount` fires with whatever settings the server sent.
**How to avoid:** Navigate to the page AFTER the settings API call has completed. The `updateAppSettings` call is synchronous (awaited), so navigating after it should be safe. If issues arise, add a `page.reload()` after settings change.
**Warning signs:** Test navigates to questions intro but immediately gets redirected to first question.

### Pitfall 4: Banner Results Button Has No TestId
**What goes wrong:** Can't use `getByTestId` to find the results link button in the header banner during question answering.
**Why it happens:** `Banner.svelte` renders the results button without a `data-testid` attribute. Only the VoterNav drawer item has `data-testid="voter-nav-results"`.
**How to avoid:** Two options: (a) Add a `data-testid` to the Banner results button, or (b) Use role-based locator: `page.getByRole('link', { name: /results/i })` or locate the button within the banner area. Option (a) is cleaner and follows the project's testId convention. Add `data-testid="voter-banner-results"` to Banner.svelte's results Button.
**Warning signs:** Can't locate the results link in the header bar.

### Pitfall 5: Category Selection Requires Enough Questions
**What goes wrong:** The start button on the questions intro page is disabled if selected categories' questions are below `minimumAnswers`.
**Why it happens:** `canSubmit` check: `selectedQuestionBlocks.questions.length >= Math.min(opinionQuestions.length, minimumAnswers)`.
**How to avoid:** When testing category selection, ensure at least `minimumAnswers` (default 5) questions are in the selected categories. The test dataset has 16 opinion questions across 2 categories (8 each), so selecting any 1 category (8 questions) exceeds the threshold of 5.
**Warning signs:** Start button stays disabled after selecting categories.

### Pitfall 6: Dismissal Memory Requires localStorage Manipulation
**What goes wrong:** Testing popup dismissal memory requires verifying that `userPreferences` in localStorage stores `{ feedback: { status: 'received' } }` after dismissal.
**Why it happens:** The app checks `userPreferences.feedback.status !== 'received'` before showing the popup. The userPreferences store is backed by `localStorageWritable` in the browser.
**How to avoid:** Test dismissal by: (1) Wait for popup to appear, (2) Dismiss it (click close), (3) Reload the page, (4) Wait for enough time and verify popup does NOT reappear. The localStorage will naturally persist across page reloads within the same browser context.
**Warning signs:** Popup reappears after reload despite being dismissed (localStorage was cleared by a different test or navigation).

### Pitfall 7: Survey Popup Requires Multiple Settings
**What goes wrong:** Survey popup doesn't appear even with `showSurveyPopup` set.
**Why it happens:** Survey popup requires BOTH `survey.showIn` includes `'resultsPopup'` AND `results.showSurveyPopup` to have a numeric value. See `results/+page.svelte` line 84: `if ($appSettings.survey?.showIn && $appSettings.survey.showIn.includes('resultsPopup')) startSurveyPopupCountdown($appSettings.results.showSurveyPopup)`.
**How to avoid:** Set both: `{ survey: { linkTemplate: 'https://test.survey.com', showIn: ['resultsPopup'] }, results: { showSurveyPopup: 2 } }`.
**Warning signs:** Survey popup countdown never starts.

### Pitfall 8: Nominations Page Redirect When Setting Disabled
**What goes wrong:** Navigating to `/nominations` when `showAllNominations` is false results in a 307 redirect to Home instead of a 404.
**Why it happens:** `nominations/+layout.ts` checks the setting and does `redirect(307, buildRoute({ route: 'Home' }))`.
**How to avoid:** Test the disabled state by navigating to nominations URL and verifying redirect to home page (not checking for 404).
**Warning signs:** Test expects error page but gets redirected to home.

## Code Examples

### Existing TestIds Available for Phase 4

```typescript
// Source: tests/tests/utils/testIds.ts
// Already defined:
testIds.voter.questions.categoryIntro  // 'voter-questions-category-intro'
testIds.voter.nav.resultsLink          // 'voter-nav-results'
testIds.voter.results.list             // 'voter-results-list'
testIds.voter.home.startButton         // 'voter-home-start'
testIds.voter.intro.startButton        // 'voter-intro-start'
testIds.voter.questions.answerOption    // 'question-choice'
testIds.voter.questions.nextButton     // 'question-next'
```

### TestIds in Frontend Source (Not Yet in testIds.ts)

```typescript
// Source: frontend source Svelte components - need to be added to testIds.ts
'voter-questions-category-list'       // questions/+page.svelte - category checkbox container
'voter-questions-category-checkbox'   // questions/+page.svelte - individual category checkbox
'voter-questions-start'               // questions/+page.svelte - start answering button
'voter-questions-category-start'      // category/[categoryId]/+page.svelte - continue from category intro
'voter-questions-category-skip'       // category/[categoryId]/+page.svelte - skip category button
'voter-about-content'                 // about/+page.svelte - about page content div
'voter-about-return'                  // about/+page.svelte - return home button
'voter-about-source-link'             // about/+page.svelte - source code link
'voter-info-content'                  // info/+page.svelte - info page content div
'voter-info-return'                   // info/+page.svelte - return home button
'voter-privacy-content'               // privacy/+page.svelte - privacy page content div
'voter-privacy-return'                // privacy/+page.svelte - return home button
'voter-nominations-container'         // nominations/+page.svelte - nominations page container
'voter-nominations-list'              // nominations/+page.svelte - nominations entity list
'voter-nominations-controls'          // nominations/+page.svelte - filter controls
'voter-results-ingress'               // results/+page.svelte - results ingress text
```

### Popup Countdown Mechanism

```typescript
// Source: frontend/src/lib/contexts/app/appContext.ts
// Feedback popup countdown: fires after delay (seconds), checks userPreferences before showing
function startFeedbackPopupCountdown(delay = 3 * 60): void {
  if (feedbackTimeout) return;  // Only one countdown at a time
  feedbackTimeout = setTimeout(() => {
    if (get(userPreferences).feedback?.status !== 'received')
      popupQueue.push({ component: FeedbackPopup });
  }, delay * 1000);
}

// Survey popup countdown: same pattern
function startSurveyPopupCountdown(delay = 5 * 60): void {
  if (surveyTimeout) return;
  surveyTimeout = setTimeout(() => {
    if (get(userPreferences).survey?.status !== 'received')
      popupQueue.push({ component: SurveyPopup });
  }, delay * 1000);
}
```

### Results Page Popup Trigger

```typescript
// Source: frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/+page.svelte
onMount(() => {
  // ...
  if ($appSettings.results.showFeedbackPopup != null)
    startFeedbackPopupCountdown($appSettings.results.showFeedbackPopup);
  if ($appSettings.survey?.showIn && $appSettings.survey.showIn.includes('resultsPopup'))
    startSurveyPopupCountdown($appSettings.results.showSurveyPopup);
});
```

### Nominations Route Guard

```typescript
// Source: frontend/src/routes/[[lang=locale]]/(voters)/nominations/+layout.ts
export async function load({ parent, fetch, params: { lang } }) {
  const { appSettingsData } = await parent();
  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);
  if (!appSettings.entities.showAllNominations) {
    redirect(307, buildRoute({ route: 'Home', lang }));
  }
  // ... load nomination data
}
```

### Banner Results Button (No TestId)

```svelte
<!-- Source: frontend/src/routes/[[lang=locale]]/Banner.svelte -->
{#if $topBarSettings.actions.results === 'show'}
  <Button
    href={$getRoute('Results')}
    disabled={resultsAvailable == null ? true : !$resultsAvailable}
    variant="responsive-icon"
    icon="results"
    text={$t('results.title.results')} />
  <!-- NOTE: No data-testid attribute. Need to add one for VOTE-17. -->
{/if}
```

### Questions Layout Results Link Control

```svelte
<!-- Source: frontend/src/routes/[[lang=locale]]/(voters)/(located)/questions/+layout.svelte -->
topBarSettings.push({
  progress: 'show',
  actions: {
    results: $appSettings.questions.showResultsLink ? 'show' : 'hide'
  }
});
```

### Results Available Derivation

```typescript
// Source: frontend/src/lib/contexts/voter/voterContext.ts
const resultsAvailable = parsimoniusDerived(
  [appSettings, opinionQuestions, answers, selectedElections],
  ([appSettings, questions, answers, selectedElections]) => {
    if (selectedElections.length === 0) return false;
    return selectedElections.every((e) => {
      const applicableQuestions = questions.filter((q) => q.appliesTo({ elections: e }));
      return countAnswers({ answers, questions: applicableQuestions }) >= appSettings.matching.minimumAnswers;
    });
  }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| globalSetup.ts | Project dependencies pattern | Phase 1 | Setup/teardown via Playwright projects |
| text selectors | data-testid attributes | Phase 1 | All elements use testIds |
| waitForTimeout | Element waitFor + URL change detection | Phase 1 (ESLint rule) | No arbitrary sleeps in tests |
| Single test dataset | Split datasets (default + voter + candidate-addendum) | Phase 3 | Clean separation of concerns |

## New TestIds Required

The following testIds exist in frontend source but are NOT yet in `tests/tests/utils/testIds.ts`. They must be added:

| TestId | Source Component | Purpose |
|--------|-----------------|---------|
| `voter-questions-category-list` | questions/+page.svelte | Category checkbox container |
| `voter-questions-category-checkbox` | questions/+page.svelte | Individual category checkbox |
| `voter-questions-start` | questions/+page.svelte | Start answering button |
| `voter-questions-category-start` | category/[categoryId]/+page.svelte | Continue from category intro |
| `voter-questions-category-skip` | category/[categoryId]/+page.svelte | Skip category button |
| `voter-about-content` | about/+page.svelte | About page content |
| `voter-about-return` | about/+page.svelte | Return home button |
| `voter-info-content` | info/+page.svelte | Info page content |
| `voter-info-return` | info/+page.svelte | Return home button |
| `voter-privacy-content` | privacy/+page.svelte | Privacy page content |
| `voter-privacy-return` | privacy/+page.svelte | Return home button |
| `voter-nominations-container` | nominations/+page.svelte | Nominations page container |
| `voter-nominations-list` | nominations/+page.svelte | Nominations entity list |
| `voter-nominations-controls` | nominations/+page.svelte | Filter controls |
| `voter-results-ingress` | results/+page.svelte | Results ingress text |

Additionally, a NEW testId must be added to `Banner.svelte` for the results button (VOTE-17):
- `voter-banner-results` -- on the Banner.svelte results Button element

## Settings Default Values Reference

Current data.setup.ts defaults (what tests restore to in afterAll):

```typescript
// Phase 3 data.setup.ts applied settings
{
  questions: {
    categoryIntros: { show: false },
    questionsIntro: { allowCategorySelection: false, show: false }
  },
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true  // Note: data.setup enables this!
  }
}
```

Dynamic settings defaults from app-shared (for reference):
```typescript
{
  matching: { minimumAnswers: 5 },
  questions: {
    categoryIntros: { allowSkip: true, show: true },
    questionsIntro: { allowCategorySelection: true, show: true },
    showResultsLink: true
  },
  results: {
    showFeedbackPopup: 180,  // 3 minutes
    showSurveyPopup: 500     // ~8.3 minutes
  },
  entities: { showAllNominations: true }
}
```

## Open Questions

1. **Banner.svelte testId for VOTE-17**
   - What we know: The Banner results Button has no data-testid. The VoterNav drawer has `data-testid="voter-nav-results"` but that's a different element.
   - What's unclear: Whether to add a testId to Banner.svelte or use a role-based locator approach.
   - Recommendation: Add `data-testid="voter-banner-results"` to the Banner.svelte results Button. This follows the project convention of testId-first (Phase 1 decision). The testId should be added in the task that implements VOTE-17.

2. **Data consent popup interference with feedback/survey popups**
   - What we know: The voter layout queues data consent popup if `analytics.trackEvents` is true and consent is indeterminate. This appears before feedback/survey popups.
   - What's unclear: Whether the default test environment has `analytics.trackEvents` enabled.
   - Recommendation: Explicitly set `analytics: { trackEvents: false }` in popup test describe blocks to prevent data consent popup from interfering. Or set `userPreferences.dataCollection.consent: 'denied'` via localStorage before navigating.

3. **Help route is About**
   - What we know: `ROUTE.Help === ROUTE.About` (both map to `(voters)/about`). There is no separate help page for voters.
   - What's unclear: Whether VOTE-18 expects a separate help page test.
   - Recommendation: Test only About, Info, Privacy pages. Note in the spec that Help redirects to About. No separate help page test needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | tests/playwright.config.ts |
| Quick run command | `yarn playwright test tests/tests/specs/voter/voter-settings.spec.ts` |
| Full suite command | `yarn test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VOTE-13 | Category selection filtering | e2e | `yarn playwright test voter-settings.spec.ts -g "category selection"` | Wave 0 |
| VOTE-14 | Statistics page | SKIPPED | n/a | n/a |
| VOTE-15 | Feedback popup after delay | e2e | `yarn playwright test voter-popups.spec.ts -g "feedback popup"` | Wave 0 |
| VOTE-16 | Survey popup in results | e2e | `yarn playwright test voter-popups.spec.ts -g "survey popup"` | Wave 0 |
| VOTE-17 | Results link in header | e2e | `yarn playwright test voter-settings.spec.ts -g "results link"` | Wave 0 |
| VOTE-18 | Static pages render | e2e | `yarn playwright test voter-static-pages.spec.ts -g "static pages"` | Wave 0 |
| VOTE-19 | Nominations page | e2e | `yarn playwright test voter-static-pages.spec.ts -g "nominations"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn playwright test tests/tests/specs/voter/<spec-file>.spec.ts`
- **Per wave merge:** `yarn test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/tests/specs/voter/voter-settings.spec.ts` -- covers VOTE-04 (shown), VOTE-05, VOTE-07 (below-threshold), VOTE-13, VOTE-17
- [ ] `tests/tests/specs/voter/voter-popups.spec.ts` -- covers VOTE-15, VOTE-16
- [ ] `tests/tests/specs/voter/voter-static-pages.spec.ts` -- covers VOTE-18, VOTE-19
- [ ] New testIds in `tests/tests/utils/testIds.ts` for voter pages
- [ ] Banner.svelte `data-testid` for results button (VOTE-17)
- [ ] Optional: page objects for QuestionsIntroPage, CategoryIntroPage

## Sources

### Primary (HIGH confidence)
- Frontend source code: `frontend/src/routes/[[lang=locale]]/(voters)/` -- all voter route implementations examined
- Frontend source code: `frontend/src/lib/contexts/app/appContext.ts` -- popup countdown mechanism verified
- Frontend source code: `frontend/src/lib/contexts/voter/voterContext.ts` -- resultsAvailable derivation verified
- Frontend source code: `frontend/src/routes/[[lang=locale]]/Banner.svelte` -- results button rendering verified
- Test infrastructure: `tests/tests/` -- all existing fixtures, page objects, utilities examined
- App settings types: `packages/app-shared/src/settings/dynamicSettings.type.ts` -- setting shapes verified

### Secondary (MEDIUM confidence)
- Phase 2 candidate-settings.spec.ts -- settings toggle pattern verified working
- Phase 3 voter fixtures and specs -- voter journey pattern verified working

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all tools exist and are proven from Phases 1-3
- Architecture: HIGH - patterns directly mirror existing Phase 2/3 implementations
- Pitfalls: HIGH - all identified from source code examination, not speculation
- Settings mechanics: HIGH - verified by reading actual Svelte components and context code

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable -- no framework changes expected)
