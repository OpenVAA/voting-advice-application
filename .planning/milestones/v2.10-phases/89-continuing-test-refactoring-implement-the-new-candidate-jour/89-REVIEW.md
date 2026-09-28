---
phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 33
files_reviewed_list:
  - apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
  - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte
  - packages/dev-seed/src/templates/baseV1.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/src/templates/permutations/perm-disable-candidate-app.ts
  - packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts
  - packages/dev-seed/src/templates/permutations/perm-per-app-notifications.ts
  - tests/playwright.config.ts
  - tests/tests/fixtures/candidate/candidate-mega.ts
  - tests/tests/fixtures/candidate/candidateForgotPasswordPage.fixture.ts
  - tests/tests/fixtures/candidate/candidateHomePage.fixture.ts
  - tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts
  - tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts
  - tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts
  - tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts
  - tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts
  - tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts
  - tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts
  - tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts
  - tests/tests/fixtures/candidate/emailBucket.fixture.ts
  - tests/tests/fixtures/index.ts
  - tests/tests/setup/candidate-mega.setup.ts
  - tests/tests/setup/candidate-mega.teardown.ts
  - tests/tests/setup/perm-disable-candidate-app.setup.ts
  - tests/tests/setup/perm-disable-candidate-app.teardown.ts
  - tests/tests/setup/perm-disable-voter-app.setup.ts
  - tests/tests/setup/perm-disable-voter-app.teardown.ts
  - tests/tests/setup/perm-per-app-notifications.setup.ts
  - tests/tests/setup/perm-per-app-notifications.teardown.ts
  - tests/tests/specs/candidate/candidate-mega-journey.spec.ts
  - tests/tests/specs/candidate/candidate-settings.spec.ts
  - tests/tests/specs/perm/perm-disable-candidate-app.spec.ts
  - tests/tests/specs/perm/perm-disable-voter-app.spec.ts
  - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
  - tests/tests/specs/voter/voter-mega-journey.spec.ts
  - tests/tests/utils/candidateMegaConstants.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 0
  warning: 7
  info: 5
  total: 12
status: issues_found
---

# Phase 89: Code Review Report

**Reviewed:** 2026-05-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 33 (note: 41 paths listed in scope; counted unique source files reviewed)
**Status:** issues_found

## Summary

Phase 89 delivers an E2E test refactoring extension: 11 function-fixtures for the
candidate journey (composition root at `candidate-mega.ts`), the 22-step
`candidate-mega-journey.spec.ts` walking the full registration -> ToU -> profile ->
questions -> preview -> logout flow, three 89-04 settings-permutation chains
(disable-voter-app / disable-candidate-app / per-app-notifications) and the
supporting baseV1 mutations (unregistered candidate, three filtered info
questions, hero/info content). New testids on candidate routes
(`candidate-profile-info-item`, `profile-image-error`,
`candidate-questions-category-expander`, `candidate-questions-intro`,
`candidate-questions-hero`) are correctly placed in source and consumed by
fixtures.

Overall quality is high — the rigidity contract (no `expect.soft`, no try/catch
wrapping `expect()`, no `.catch(() => null)` on assertion-bearing
interactions) is upheld throughout the new fixtures and the candidate-mega
spec. The fallow findings from the structural pre-pass are absent in this
phase (none provided).

The issues surfaced below cluster around three themes:
1. Latent fragilities in the perm-* chain teardown semantics (destructive
   `extraTeardownPrefix` semantics misrepresented as "defensive").
2. Logout-button dialog disambiguation that does not distinguish notification
   dialogs from the TimedModal confirmation dialog.
3. Type-safety / strict-type drift in fixtures (loose `as` casts in the
   emailBucket polling state machine; un-validated subject literals).

No BLOCKER findings — nothing blocks shipping the phase. All findings are
WARNING or INFO tier.

## Structural Findings (fallow)

No `<structural_findings>` block was provided with the review request. Skip.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Misleading docstring + dangerous semantic on `extraTeardownPrefix` in 89-04 perm setups

**Files:**
- `tests/tests/setup/perm-disable-voter-app.setup.ts:16`
- `tests/tests/setup/perm-disable-candidate-app.setup.ts:16`
- `tests/tests/setup/perm-per-app-notifications.setup.ts:16`

**Issue:** Each setup passes `extraTeardownPrefix: ['test-', 'e2e-perm-']` and
the docstring calls this "defends against cross-chain leakage from baseV1 /
candidate-mega-journey / prior perm chains still mid-teardown." Per
`setupFromTemplate.ts:170-177`, this argument causes `runTeardown(prefix,
client)` to run BEFORE seeding for EVERY listed prefix — it is **destructive**,
not defensive. With `['test-', 'e2e-perm-']` it will:
1. Delete every row whose `external_id` starts with `test-` (the entire baseV1
   dataset + candidate-mega data, if any survived).
2. Delete every row whose `external_id` starts with `e2e-perm-` (the
   entire 88-03 perm-* family data + the previous 89-04 perm chains' data).

The current Playwright project graph (sequential chain ending with
`candidate-mega-journey → perm-disable-voter-app → perm-disable-candidate-app
→ perm-per-app-notifications`) ensures upstream chains are FINISHED, so the
destruction is intentional. But:
- The docstring frames the behavior as "defends against ... still mid-teardown"
  — that implies preserve-mine, clear-theirs semantics. Actual behavior is
  **wipe everything in those prefix namespaces, then seed mine.**
- If anyone reorders the `projects:` array, runs `--project=...` for one
  perm chain in isolation while another is mid-execution, or uses
  `--workers=N` matching multiple perm chains, this will destroy the
  in-flight chain's data without warning.
- Compare with the more carefully scoped 88-03 perm chains, which DO NOT pass
  `extraTeardownPrefix` (they rely on per-chain unique externalIdPrefixes
  and the upstream sequential dep).

**Fix:** Either (a) drop `extraTeardownPrefix` here and rely entirely on the
sequential `dependencies:` ordering already declared in `playwright.config.ts`
(matching the 88-03 perm-* family precedent), OR (b) keep the option and
rewrite the docstring to accurately describe destructive cross-chain
clobbering, plus add an explicit comment block in `playwright.config.ts`
warning that reordering the perm chains will cause data loss. Recommended:
(a) — it's parity with the upstream 88-03 chains and removes the footgun.

```ts
// In each perm-*.setup.ts:
setup('import perm-disable-voter-app dataset', async () => {
  // Sequential project deps in playwright.config.ts guarantee
  // upstream chains have finished teardown before this setup runs.
  // No extraTeardownPrefix needed.
  await setupFromTemplate('perm-disable-voter-app');
});
```

---

### WR-02: `clickWithoutDialog` dialog-absence assertion can race notification popups

**File:** `tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts:63-72`

**Issue:** `clickWithoutDialog()` asserts `expect(page.getByRole('dialog')).toHaveCount(0)` after the
logout click to verify the TimedModal confirmation dialog did not open. But
the Alert component at `apps/frontend/src/lib/components/alert/Alert.svelte:92`
renders `role="dialog"` whenever it has actions (e.g., notification popups,
feedback popup, survey popup, cookie banners). If a notification overlay is
rendered when logout is clicked, this assertion fires a false-positive failure
even though the logout-branch is correct.

baseV1 happens to leave `notifications: { candidateApp: null, voterApp: null }`
in `BASE_V1_APP_SETTINGS`, so the candidate-mega-journey passes today. But:
- Future baseV1 derivatives or settings overlays that enable notifications
  will break the fixture.
- The 89-04 `perm-per-app-notifications` template explicitly seeds candidate
  notifications — any future spec composition that uses
  `candidateLogoutButton.clickWithoutDialog()` against that template would
  flake.

**Fix:** Scope the absence assertion to dialogs that are actually the
TimedModal — e.g., filter on a known TimedModal-specific child role (button
named `/logout/i`) or use a dedicated TimedModal testid. Alternatively,
assert presence of the URL change to `/candidate/login` BEFORE the dialog
absence check, so the absence is a tightening rather than a primary signal.

```ts
async clickWithoutDialog(): Promise<void> {
  await page.getByTestId(testIds.candidate.home.logout).click();
  // The post-logout navigation routes to /candidate/login per
  // LogoutButton.svelte:71-73. Assert URL change as the canonical
  // "logged out without confirmation" signal.
  await expect(page).toHaveURL(/\/candidate\/login/);
  // Optional tightening: no TimedModal confirm-button observed.
  // Scope to dialogs containing the modal's specific 'Logout' confirm
  // button, NOT any role=dialog (which includes notification popups).
  const confirmModal = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('button', { name: /logout/i }) });
  await expect(confirmModal).toHaveCount(0);
}
```

---

### WR-03: `loginIfRedirectedToLoginPage` opaque-on-failure URL-waitForURL guard

**File:** `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:209-235`

**Issue:** The branching helper waits for the URL to settle into one of three
patterns:
- `/candidate/login`
- `/candidate` (bare home)
- `/candidate/<anything except register|auth|login>`

The regex `^/candidate/(?!register|auth|login)/` is broken because the
negative-lookahead does NOT require any trailing path segment after the
exclusion — it accepts paths like `/candidate/login...` if there's any
character after `login` because the lookahead checks the next chars are NOT
the literal words. Actually it does work because lookahead anchors at position
0 of the captured group, but the regex is hard to verify by inspection and
the comment doesn't explain the edge cases. More importantly:
- If the URL never settles into any of these three families (e.g., 4xx error
  page, locale prefix mismatch, edge function 502), the timeout fires with a
  bare "page.waitForURL: Timeout" message instead of capturing the actual URL
  state for the failure report.
- The `page.context().clearCookies()` mid-helper at line 227 is suspicious —
  it clears cookies AFTER establishing a URL but BEFORE login. If the
  callback-URL had set a partial session (verifyOtp), clearing cookies here
  may invalidate post-login state on the next step.

**Fix:** Convert to an explicit two-state branch with a single clear URL check
after a more permissive waitForLoadState, and remove the `clearCookies()`
call (or document why it's needed):

```ts
async function loginIfRedirectedToLoginPage(
  page: Page, email: string, password: string, timeoutMs: number
): Promise<void> {
  await page.waitForLoadState('domcontentloaded', { timeout: timeoutMs });
  const currentUrl = page.url();
  if (!/\/candidate\/login(?:$|\?)/.test(currentUrl)) return;
  // Only fill the form if we actually landed on the login page.
  const emailInput = page.getByTestId(testIds.candidate.login.email);
  await emailInput.waitFor({ state: 'visible', timeout: timeoutMs });
  await emailInput.fill(email);
  await page.getByTestId(testIds.candidate.login.password).fill(password);
  await page.getByTestId(testIds.candidate.login.submit).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: timeoutMs });
}
```

---

### WR-04: `INFO_QUESTION_ANSWERS` set is silently incomplete and docstring is misleading

**File:** `tests/tests/utils/candidateMegaConstants.ts:102-110`

**Issue:** The docstring at lines 84-100 says step 13 "fills ALL listed
answers EXCEPT `test-qu-info-text` (the required one ...) AND the first
listed info question." Reading the spec at `candidate-mega-journey.spec.ts:471-504`
confirms the actual behavior is different: step 13 iterates
`STEP_13_INFO_FILL_ENTRIES` (everything in `INFO_QUESTION_ANSWERS` except
`test-qu-info-text`).

But `INFO_QUESTION_ANSWERS` itself omits 4 info-question externalIds entirely:
- `test-qu-info-multipleChoiceCategorical`
- `test-qu-info-singleChoiceCategorical`
- `test-qu-info-boolean`
- `test-qu-info-date`

These omissions are intentional (the fixture's `fillQuestion` uses
`getByRole('textbox')` which can't fill categoricals/booleans/dates), but the
docstring doesn't mention this. A reader hunting "why isn't my boolean info
question filled?" has to grep both the spec body and the candidate profile
page source to understand the omission. The docstring's "first listed info
question" phrase is the third misleading element — the actual exclusion isn't
"first listed" but "every non-textbox-typed info question."

**Fix:** Rewrite the `INFO_QUESTION_ANSWERS` docstring to explicitly enumerate
which info-question types are EXCLUDED and why. Optionally, add a
type-checking comment listing the full info-question set and which keys are
intentionally absent. Example:

```ts
/**
 * Map of info-question externalId → value for filling the editable info
 * questions on the candidate profile page in step 13.
 *
 * INCLUDED (6 entries): text / longText / link / number / multipleText /
 *   filt-co-reg-n. All are textbox-fillable via `getByRole('textbox')`.
 *
 * EXCLUDED (intentionally, by question type):
 *   - test-qu-info-multipleChoiceCategorical (chip group)
 *   - test-qu-info-singleChoiceCategorical (radio group)
 *   - test-qu-info-boolean (toggle)
 *   - test-qu-info-date (date picker)
 *   These input variants are not driven by candidateProfilePage.fillQuestion.
 *   Step 13 visits but does not write them; assertion coverage of categorical
 *   info-question filling is OUT OF SCOPE for the mega-journey.
 *
 * EXCLUDED (filtered by scope):
 *   - test-qu-info-filt-mun-only / -filt-co-reg-s
 *   The unregistered candidate is in CO-Reg-N; these are filtered out of
 *   the profile surface entirely.
 *
 * SPECIAL: test-qu-info-text is INCLUDED here but step 13 deliberately
 * omits it from the iteration (see STEP_13_INFO_FILL_ENTRIES). Step 14
 * fills it separately to exercise the required-empty gate.
 */
```

---

### WR-05: `loose-cast then unchecked dereference` in `emailBucket.fixture.ts` polling loop

**File:** `tests/tests/fixtures/candidate/emailBucket.fixture.ts:154-183`

**Issue:** `getEmail()` uses a closure-captured mutable variable `chosen` plus
`expect.poll(...).toBe(true)` to terminate the poll. On poll success, it
casts `chosen as MailpitMessageSummary` (line 179) and then fetches the full
message body. Issues:

1. The closure-mutation pattern is fragile: `chosen` is written from inside
   the `expect.poll` async callback. Per Playwright docs, the poll callback
   is invoked until either it returns the expected value OR the timeout
   fires. If a network error inside `fetchEmailsForRecipient` returns `[]`
   (line 87), `chosen` stays `undefined`, and the poll keeps trying. But the
   final `chosen as MailpitMessageSummary` cast is a TS-only assertion — if
   somehow the poll resolves to `true` while chosen is still undefined (race
   between two poll iterations), the dereference at line 180
   `fetchFullMessage(summary.ID)` crashes with "Cannot read properties of
   undefined."

2. `fetchEmailsForRecipient` (line 85-90) returns `[]` on any non-200
   response — including transient 5xx errors. This silently treats Mailpit
   downtime as "no emails yet," extending the poll loop unnecessarily.

3. `getLinksInEmail` (line 190-199) doesn't validate `email.html` is
   non-empty. If Mailpit returns a message with only `Text` (no HTML),
   `load('')` returns an empty cheerio object and `hrefs` is `[]` — silently
   producing an empty link list that the caller then asserts on.

**Fix:** Replace the closure-mutation pattern with an `expect.poll` that
returns the message itself (not boolean), and harden network-error
distinction:

```ts
async getEmail(subjectOrNth: string | RegExp | number): Promise<EmailRecord> {
  const summary = await expect.poll(
    async () => {
      const emails = await fetchEmailsForRecipient(recipientEmail);
      if (typeof subjectOrNth === 'number') return emails[subjectOrNth];
      return emails.find((e) => matchSubject(e, subjectOrNth));
    },
    { message: `Waiting for email ${typeof subjectOrNth === 'number'
        ? `at nth=${subjectOrNth}`
        : `with subject matching ${subjectOrNth}`} for ${recipientEmail}`,
      timeout: POLL_TIMEOUT, intervals: POLL_INTERVALS }
  ).not.toBeUndefined();
  const full = await fetchFullMessage(summary.ID);
  if (!full) throw new Error(`Mailpit returned no body for message ${summary.ID}`);
  return toEmailRecord(full);
}
```

Also: surface non-200 responses from `fetchEmailsForRecipient` as thrown
errors (or `console.warn`) so transient Mailpit outages are visible in the
trace.

---

### WR-06: `expectHeroVisible('emoji')` uses `not.toHaveText('')` — false-positive on whitespace

**File:** `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts:46-57`

**Issue:** The `'emoji'` branch asserts `await expect(hero).not.toHaveText('')` —
literal empty string. But if Hero.svelte renders any whitespace (e.g., a `&nbsp;`
or layout padding text node), this assertion passes even when no emoji glyph
is present. Worse, an empty `<HeroEmoji>` render that produces a single space
character passes this check.

This is a particularly brittle pattern because the candidate-mega-journey
step 16 asserts a specific emoji ('🗳️') was set on the question via
baseV1 `custom_data.hero = { emoji: '🗳️' }`. If `HeroEmoji.svelte` ever
regresses to render nothing or whitespace, the assertion still passes — the
test reports success even when the emoji is missing.

Compare with the voter mega-journey at `voter-mega-journey.spec.ts:527`
which asserts the actual emoji glyph: `await expect(heroFigure).toContainText('🗳️')`.

**Fix:** Take the expected emoji glyph (or a glyph-matching regex)
as an argument:

```ts
async expectHeroVisible(content: 'emoji' | 'image', emojiGlyph?: string | RegExp): Promise<void> {
  const hero = page.getByTestId(testIds.candidate.questions.hero);
  await expect(hero).toBeVisible();
  if (content === 'image') {
    await expect(hero.getByRole('img').first()).toBeVisible();
    return;
  }
  // emoji: assert specific glyph when supplied; otherwise assert non-whitespace.
  if (emojiGlyph !== undefined) {
    await expect(hero).toContainText(emojiGlyph);
    return;
  }
  // Fallback: assert non-whitespace text content.
  const text = (await hero.textContent()) ?? '';
  expect(text.trim().length, 'hero emoji content non-empty after trim').toBeGreaterThan(0);
}
```

Then update the spec call at step 16 from `expectHeroVisible('emoji')` to
`expectHeroVisible('emoji', '🗳️')`.

---

### WR-07: `expectInfoAnswer` & `expectOpinionAnswer` rely on shared voter testids that may overlap on preview

**File:** `tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts:52-91`

**Issue:** The candidate preview page reuses voter `EntityDetails` testids
(`testIds.voter.results.infoItem` = `info-item`,
`testIds.voter.entityDetail.opinionQuestion` = `entity-opinion-question`,
`testIds.voter.entityDetail.entitySelectedAnswer` = `entity-selected-answer`).
The fixture scopes its locators to `testIds.candidate.preview.container`
(`candidate-preview-container`), which is the correct outer scope.

However, the assertion `await expect(question.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer)).toHaveCount(0)`
at line 82 is structurally weak: the `entity-selected-answer` testid is a
single sr-only sibling marker per `QuestionChoices.svelte` (per `testIds.ts:194`).
If the preview surface renders an OpinionQuestionInput in `mode="answer"`
(editable) instead of `mode="display"` (the candidate's own answer), the
selected-answer marker is absent by design, and the `aNthChecked === null`
branch would falsely report "rendered-but-unanswered" for a question that
IS answered but rendered in an interactive variant.

The candidate preview is supposed to render in display mode only — but the
fixture doesn't actually assert mode; it infers behavior from marker
presence. A regression that switches preview to answer-mode would silently
flip the semantic.

**Fix:** Make the assertion more specific — either:
1. Scope to the choice's parent input element + assert the `checked` state
   directly (when mode=display, QuestionChoices renders checkboxes/radios
   that can be queried by their checked/aria-checked attribute), OR
2. Add an explicit assertion that the question is in display mode (e.g.,
   no `tabindex` interactive descendants, no submit button).

Optional but recommended: rename the variable `aValue` / `aNthChecked` to
`expectedValue` / `expectedCheckedIndex` for readability — the `a-` prefix
parallels nothing in the wider codebase.

---

## Info

### IN-01: Inconsistent legacy fixture coexistence with new function-fixtures

**File:** `tests/tests/fixtures/index.ts` + `tests/tests/fixtures/candidate/candidate-mega.ts`

**Issue:** The legacy `tests/tests/fixtures/index.ts` still imports and
exports `ProfilePage`, `QuestionPage`, `CandidateQuestionsPage` PageObject
classes from `../pages/candidate/`. The 89-LAST-AUDIT prunes other classes
(HomePage, LoginPage, PreviewPage, SettingsPage) but keeps the three above.
The new candidate-mega fixtures cover the same surface area
(`candidateProfilePage`, `candidateQuestionPage`,
`candidateQuestionsOverviewPage`). Both styles coexist intentionally per
D-89-02, but:
- The README-level convention is unclear about WHEN a new spec should use
  the PageObject vs the function-fixture.
- The two surfaces have subtly different method shapes (e.g., `fillQuestion`
  takes a label regex in the function-fixture, but `expandAllCategories` is
  PageObject-only).

**Fix:** Add a short rule to `CLAUDE.md` or a top-of-file comment in
`fixtures/index.ts` stating: "New candidate specs MUST use
`fixtures/candidate/candidate-mega.ts`. PageObject classes in this file are
RETAINED ONLY for `candidate-translation.spec.ts` and `candidate-profile.spec.ts`
in the legacy chain; do not add new dependents." This sets a clear migration
boundary.

---

### IN-02: Magic `MAX_STEPS = 20` ceiling in candidate-mega `walkRemainingOpinionQuestions`

**File:** `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:162`

**Issue:** The defensive loop ceiling is `20`, justified inline as "loose
ceiling against ~8 applicable opinion questions." If baseV1 grows beyond 20
applicable opinion questions in a future plan, the loop silently exits with
some questions unanswered — the post-loop assertion `await
candidateHomePage.expectStatusMessage()` may then pass (status message is
visible whether or not all questions are answered) and the
`expectTasks({ enabled: ['profile', 'opinions', 'preview'] })` assertion
catches the regression, but the failure mode is "wrong tasks enabled,"
not "loop hit ceiling."

**Fix:** Increase the ceiling to a more conservative value (e.g., 50) or
make it a named constant at file scope tied to the dataset's expected count,
and either log or fail explicitly when the ceiling is hit:

```ts
const MAX_OPINION_WALK_STEPS = 50; // ~5x baseV1's 11 opinion questions
// ... inside the loop:
if (i === MAX_OPINION_WALK_STEPS - 1) {
  throw new Error(
    `walkRemainingOpinionQuestions: hit MAX_STEPS=${MAX_OPINION_WALK_STEPS} ceiling without reaching home. ` +
    `Last URL=${url}. Dataset may have grown beyond expected opinion-question count.`
  );
}
```

---

### IN-03: Sentinel `999` election_symbol is documented as a "sentinel" but not enforced as unique

**Files:**
- `packages/dev-seed/src/templates/baseV1.ts:1463` (the unregistered nomination's `election_symbol: '999'`)
- `tests/tests/specs/candidate/candidate-mega-journey.spec.ts:445` (`nomination: { electionSymbol: '999' }`)

**Issue:** The baseV1 inline comment says `999` is the "canonical sentinel
for the unregistered-candidate fixture." But there's no test invariant
enforcing that `999` is the ONLY nomination with that symbol — every other
nomination in CO-Reg-N happens to be assigned a small integer (2..14, 19..30
etc.), but a future plan could collide by re-using `999` for a different
purpose. The test assertion at spec line 445 then becomes ambiguous if the
collision happens.

**Fix:** Either (a) add a comment in baseV1 stating that the `999` value is
RESERVED for this row and must not be reused, OR (b) move the value to a
named exported constant in `candidateMegaConstants.ts`
(`UNREGISTERED_CANDIDATE_ELECTION_SYMBOL = '999'`) imported by both baseV1
and the spec for single-source-of-truth.

---

### IN-04: Inconsistent prefix-pattern documentation in 89-04 perm templates

**File:** `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts:50,59,68,72` (and siblings)

**Issue:** The 89-04 perm templates use the standard 88-03 perm-* family
convention (bare `external_id: 'el-1'` for own rows, full-prefixed
`external_id: \`${P}cg-1\`` for cross-references). This is correct, but
nowhere in the file do the comments explain WHY the asymmetry exists — a
reader unfamiliar with the writer's prefix-prepending behavior at
`packages/dev-seed/src/...` will be confused. The 88-03 perm-1e1cg1co.ts
template has a clear explanation in its docstring at lines 9-13 that the
89-04 templates omit.

**Fix:** Add the same explanatory block to the 89-04 perm-* templates:

```ts
/**
 * ...existing docstring...
 *
 * Prefix discipline (per 88-03 family convention): Row external_ids in
 * fixed[] are BARE (the Writer prepends `externalIdPrefix` at write-time);
 * nested refs ({ external_id: ... } inside parent_nomination,
 * constituency_groups, etc.) carry the FULL prefixed external_id because
 * the Writer's row-resolver looks up the post-prefix value.
 */
```

---

### IN-05: `cardLabel` helper duplication across candidate fixtures

**Files:**
- `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:81-83`
- `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts:49-51`

**Issue:** Both fixtures define a near-identical `cardByLabel(label: string |
RegExp): Locator` helper that returns
`page.getByTestId(<testid>).filter({ hasText: label })`. This is a 3-line
duplication. A shared helper in a colocated util would avoid the pattern from
proliferating to a 4th / 5th fixture.

**Fix:** Optional — extract to
`tests/tests/fixtures/candidate/_locatorHelpers.ts`:

```ts
import type { Locator, Page } from '@playwright/test';

export function filterByLabel(loc: Locator, label: string | RegExp): Locator {
  return loc.filter({ hasText: label });
}

export function getByTestIdFiltered(page: Page, testId: string, label: string | RegExp): Locator {
  return page.getByTestId(testId).filter({ hasText: label });
}
```

Then `cardByLabel = (label) => getByTestIdFiltered(page, testIds.candidate.questions.card, label)`.

Not load-bearing; skip if the helper count stays at 2.

---

_Reviewed: 2026-05-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
