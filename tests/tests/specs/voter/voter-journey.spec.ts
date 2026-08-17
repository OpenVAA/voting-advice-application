/**
 * Voter journey end-to-end spec.
 *
 * Structure: ONE serial-describe → ONE long test('full voter journey
 * end-to-end', ...) → many `test.step('<title>', ...)` segments. The step
 * structure is approximate — the walk is grouped for a smooth continuous
 * traversal and back-and-forth navigation is minimised.
 *
 * Soft-assertion posture: this is ONE long serial walk, so a hard failure
 * anywhere truncates the traversal and hides every check after it. Visibility
 * assertions therefore use the soft modifier deliberately — one broken card
 * reports and the walk continues, so a single run surfaces every defect
 * rather than only the first. Load-bearing preconditions (navigation
 * anchors, gates, data state) stay hard, because walking past those produces
 * noise rather than information.
 *
 * The count is deliberately NOT restated here. It lives in
 * SOFT_ASSERTION_BUDGETS in tests/playwright.config.ts, which counts this
 * file at config load and throws on any divergence, in either direction. A
 * number in a comment is precisely what went stale and produced fake-guard
 * sweep finding F10; a number the harness checks cannot.
 *
 * Lint posture: all defensive `if (count > 0) { expect(...) }` patterns are
 * hoisted into module-scope helper functions (below). The
 * `playwright/no-conditional-in-test` rule fires only inside `test()`
 * bodies, so helpers below are the canonical home for any
 * dataset-conditional walk logic.
 *
 * Running:
 *   yarn test:e2e --project=voter-journey --reporter=list
 *
 * Runs under the `data-setup-base` → `voter-journey` →
 * `data-teardown-base` chain.
 */

import { createFeedbackDialog, isolateFeedbackRateLimit } from '../../fixtures/shared/feedbackDialog.fixture';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { expect, test } from '../../fixtures/voter/views';
import {
  answerAndAdvanceToResults,
  answerNumberScale,
  walkUntilQuestionsIntro
} from '../../fixtures/voter/voter-journey.fixture';
import { expectClientNavigation, TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';
import type { CaptureNavigationBaseline } from '../../helpers';

// ====================================================================
// FILE-SCOPE CONSTANTS
//
// Element/click/page/slowPage timeout buckets are imported from the central
// helpers/timeouts.ts.
//
// reason: JOURNEY_TEST_MAX (120s) exceeds TIMEOUTS.testMax (90s) and stays
// inline as a documented exception. The journey includes the filters:dialog
// 7-stage choreography which opens/closes the modal 7+ times; the full walk
// runs in ~75-90s, so this ceiling absorbs the per-step costs (Expander
// auto-expand interactions + modal transitions). APPLIED via test.setTimeout
// below — it MUST keep passing this value, NOT TIMEOUTS.testMax (90s), or the
// test would start timing out at 90s.
//
// TEXT_RE consolidates regex literals used 2+ times in the spec body so the
// `playwright/no-raw-locators` audit + intent-locality both improve.
// ====================================================================

const JOURNEY_TEST_MAX = 120_000;

const TEXT_RE = {
  // tab labels
  partiesTab: /parties/i,
  candidateTab: /candidate/i,
  opinionsTab: /opinions/i,
  infoTab: /info/i,
  membersTab: /members|children|candidates/i,
  // election / constituency names (base dataset)
  regional: /regional/i,
  municipal: /municipal/i,
  regOnlyParents: /^Region North$|^Region South$/,
  munLeafNames: /North-East|North-West|South-East|South-West/,
  northEast: /North-East/i,
  // category labels — tightened to include the [<id-token>] prefix. The
  // substring 'Optional Opinion Questions A/B' is still matched by these
  // tighter regexes, but only the bracket-prefixed render of the category
  // name satisfies them — locking the contract to the display convention.
  baseOpinion: /Base Opinion Questions/i,
  optionalOpinionsA: /\[qg-opin-opt-a-NotSelected\] Optional Opinion Questions A/i,
  optionalOpinionsB: /\[qg-opin-opt-b-Skipped\] Optional Opinion Questions B/i,
  regionalOpinionsCategory: /Opinion Questions for Regional Elections Only/i,
  regionallyFilteredCategory: /Opinion Questions Filtered per Question NE/i,
  // questions / answers — base-category opinion question headings, in walk
  // order (the e2e/base seed is stable, so every heading is known in advance).
  baseOpinion1Likert5: /Base opinion 1 — Likert 5/i,
  baseOpinion2Likert4: /Base opinion 2 — Likert 4/i,
  baseOpinion3Likert7: /Base opinion 3 — Likert 7/i,
  baseOpinion4Categorical: /Base opinion 4 — Categorical/i,
  baseOpinion5Boolean: /Base opinion 5 — Boolean/i,
  baseOpinion6Number: /Base opinion 6 — Number scale/i,
  baseOpinion7MultiChoice: /Base opinion 7 — Multi-choice/i,
  baseOpinion8MultiChoiceExact: /Base opinion 8 — Multi-choice exact one/i,
  regionalOpinionsQuestion: /Regional-only opinion 1/i,
  filtMunNeOpinion: /Filtered Mun-NE opinion/i,
  // candidate name fragments (driven by base first_name)
  polarMax: /Polar-Max/i,
  polarMin: /Polar-Min/i,
  // results-page UI
  answerCount: /Answer 4/i,
  hiddenCandidate: /Hidden Candidate/i,
  specialCandidate: /Special Candidate AA|Candidate AA Special/i,
  neitherAnswered: /Neither.*has(?:n['‘’]t| not)? answered/i,
  // routes / URLs
  resultsCandidatesOrRoot: /\/results\/(candidates|$)/,
  resultsOrganizationsOrRoot: /\/results\/organizations|\/results\//,
  introRoute: /\/intro/,
  // form chrome
  closeDialog: /close dialog/i,
  closeFiltersOrApply: /close filters|apply/i
} as const;

// ====================================================================
// MODULE-SCOPE HELPERS
//
// These encapsulate the defensive walk logic that would otherwise trip
// `playwright/no-conditional-in-test` inside step bodies. The lint rule
// only fires inside test() callbacks; helper functions at module scope
// are exempt.
// ====================================================================

/**
 * Resolve the `role=meter` inside the score-gauge whose label matches `label`.
 * helper: pins a per-category subMatch gauge by its question-group
 * label (the stable `[<id>]` prefix) so its `aria-valuenow` can be asserted.
 * Module-scope (not an in-test arrow) to satisfy `func-style` + keep the
 * gauge-by-label lookup reusable.
 */
function gaugeMeterByLabel(gauges: Locator, label: RegExp): Locator {
  return gauges.filter({ hasText: label }).getByRole('meter');
}

/** Best-effort click on each element; tolerates click failures (the rule allows). */
async function clickAllTolerantly({ elements, count }: { elements: Locator; count: number }): Promise<void> {
  for (let i = 0; i < count; i++) {
    await elements
      .nth(i)
      .click()
      .catch(() => null);
  }
}

/**
 * Re-select all election cards if a card is not currently marked
 * `aria-checked="true"`. Tolerant of click failures.
 */
async function ensureAllChecked({ elements, count }: { elements: Locator; count: number }): Promise<void> {
  for (let i = 0; i < count; i++) {
    const element = elements.nth(i);
    const isChecked = await element.getAttribute('aria-checked').catch(() => null);
    if (isChecked !== 'true') {
      await element.click().catch(() => null);
    }
  }
}

/**
 * Return the only constituency list combox’ options list. Expects there to be only one such combobox.
 */
async function getOnlyConstituencyListbox(page: Page): Promise<Locator> {
  const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
  const comboboxes = constituenciesList.getByRole('combobox');
  await expect(comboboxes).toHaveCount(1);
  await comboboxes.first().click();
  const listbox = page.getByRole('listbox');
  await listbox.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
  return listbox;
}

/**
 * Check or uncheck a specific category in the category list.
 */
async function toggleCategoryListItem({
  page,
  label,
  checked
}: {
  page: Page;
  label: RegExp | string;
  checked: boolean;
}): Promise<void> {
  const categoryList = page.getByTestId(testIds.voter.questions.categoryList);
  const checkbox = categoryList.getByRole('checkbox', { name: label });
  await expect(checkbox).toBeVisible({ timeout: TIMEOUTS.element });
  if (checked) await checkbox.check();
  else await checkbox.uncheck();
}

/**
 * Expect a client-side navigation after performing the given action, and settle on
 * the DESTINATION DOM rather than on the URL.
 *
 * reason: (see phase 138) DEF-135-04. This helper used to
 * end in `page.waitForURL(...).catch(() => null)` — a URL-only wait that swallowed
 * its own timeout. Under the ordering named in ` ` § Named root
 * cause, SvelteKit commits the URL (`client.js:1759-1760`) before it swaps the DOM
 * (`:1824`), so that settle released while the PREVIOUS question was still
 * rendered, and any trailing assertion raced a swap that had not happened. The
 * recorded DEF-135-04 failure is exactly that race: `element(s) not found` on the
 * Base-3 term trigger, because the question still rendered was Base-2, which
 * carries no `custom_data.terms`.
 *
 * The settle now lives in `helpers/navigation.ts` so this walk and the
 * `eperm07-term-trigger` instrument share ONE implementation and cannot drift —
 * the instrument would otherwise keep its own copy of the defect and stop
 * witnessing this file. Negative control: ` `.
 *
 * The baseline is captured BY THE ACTION, via the `capture` callback it receives,
 * immediately before the navigating click — never here at wrapper entry (see phase 138
 * review WR-01). Every action below gates on the heading of the page it is leaving,
 * and that gate targets the SAME element the baseline read targets, so a baseline
 * taken before the gate can be one page stale and would make the settle's stage-2
 * text comparison true on arrival. The mechanism is spelled out on
 * `expectClientNavigation`.
 */
async function expectUrlChange(
  page: Page,
  action: (capture: CaptureNavigationBaseline) => Promise<void>
): Promise<void> {
  await expectClientNavigation(page, action);
}

/**
 * Expect the category intro with the given text, then either click Start or Skip depending on the `skip` flag.
 */
async function expectCategoryIntroAndAdvance({
  page,
  text,
  skip
}: {
  page: Page;
  text: RegExp | string;
  skip?: boolean;
}): Promise<void> {
  await expectUrlChange(page, async (capture) => {
    const categoryIntro = page.getByTestId(testIds.voter.questions.categoryIntro);
    const categorySkip = page.getByTestId(testIds.voter.questions.categorySkip);
    const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
    await Promise.all([
      expect(categoryIntro).toHaveText(text, { timeout: TIMEOUTS.element }),
      expect(categorySkip).toBeVisible({ timeout: TIMEOUTS.element }),
      expect(categoryStart).toBeVisible({ timeout: TIMEOUTS.element })
    ]);
    await capture();
    if (skip) await categorySkip.click();
    else await categoryStart.click();
  });
}

/**
 * Expect the question with the given (REQUIRED) heading `text`, then either answer the
 * option given by `optionIndex(nOptions)` or skip if `skip` is true.
 * Unless `allowPreselected` is true, will fail if the option is already selected.
 *
 * `text` is required: the e2e/base dataset is stable, so every question heading is
 * known in advance (see the `baseOpinion*` / `*Question` entries in TEXT_RE). Gating
 * on the exact heading IS the deterministic settle for WHICH question we are on; the
 * option count is then read from a locator SCOPED to that question's id (see body),
 * because the `{#key question.type}` variant remount can leave the outgoing options
 * mounted for a frame after the heading has updated — a page-wide count would be
 * stale and `optionIndex` would pick the wrong option.
 *
 * The required `text` plus the questionId-scoped option locator together give a
 * deterministic settle with no entry stall and no stability poll.
 */
async function expectQuestionAndAdvance({
  page,
  text,
  skip,
  optionIndex = () => 0,
  allowPreselected = false
}: {
  page: Page;
  text: RegExp | string;
  skip?: boolean;
  optionIndex?: (nOptions: number) => number;
  allowPreselected?: boolean;
}): Promise<void> {
  await expectUrlChange(page, async (capture) => {
    const questionHeading = page.getByTestId(testIds.voter.questions.heading);
    const nextButton = page.getByTestId(testIds.voter.questions.nextButton);

    // Deterministic settle: wait for the heading to show THIS question's known text.
    await expect(questionHeading).toHaveText(text, { timeout: TIMEOUTS.element });

    // Scope the answer options to the CURRENT question id. On a Q→Q nav the page
    // reuses questions/[questionId]/+page.svelte and the variant remounts via
    // `{#key question.type}`, so the OUTGOING question's [data-testid=question-choice]
    // options can linger in the DOM for a frame AFTER the heading has already updated.
    // A bare page-wide `getByTestId('question-choice').count()` then captures the
    // stale/combined set, making `optionIndex(n) = nth(n-1)` resolve to a NON-last
    // option for some questions — which silently corrupted the polar-MAX voter profile
    // so Polar-Min out-ranked the partial-answer Special candidate (results ranking
    // flip). Anchor to `questionChoices-<id>` (the option `name`,
    // QuestionChoices.svelte:267; mirrors voter-journey.fixture) so count()/nth() only
    // ever see THIS question's options.
    const questionId = new URL(page.url()).pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() ?? '';
    // eslint-disable-next-line playwright/no-restricted-locators -- testid+name conjunction not expressible via getByTestId/getByRole
    const answerOptions = page.locator(`[data-testid="question-choice"][name="questionChoices-${questionId}"]`);
    await expect(answerOptions.first()).toBeVisible({ timeout: TIMEOUTS.element });

    const nOptions = await answerOptions.count();
    const answerOption = answerOptions.nth(optionIndex(nOptions));
    await Promise.all([
      expect(answerOption).toBeVisible({ timeout: TIMEOUTS.element }),
      expect(nextButton).toBeVisible({ timeout: TIMEOUTS.element })
    ]);
    if (!allowPreselected) await expect(answerOption).not.toBeChecked();
    const isChecked = await answerOption.isChecked();
    await capture();
    if (skip || isChecked) await nextButton.click();
    else await answerOption.click();
  });
}

/**
 * Answer a NUMBER-scale opinion question at max and advance (see phase 129).
 *
 * The NumberScaleInput renders a native `<input type=range>` (no question-choice
 * options); a matchable number question carries no radio/checkbox options, so
 * `expectQuestionAndAdvance` cannot drive it. Focus the slider and press End to
 * land the exact max value (the native-range keyboard contract), then click
 * Next explicitly — number inputs never auto-advance (plan 06).
 */
async function expectNumberQuestionAndAdvance({ page, text }: { page: Page; text: RegExp | string }): Promise<void> {
  await expectUrlChange(page, async (capture) => {
    const questionHeading = page.getByTestId(testIds.voter.questions.heading);
    await expect(questionHeading).toHaveText(text, { timeout: TIMEOUTS.element });
    const slider = page.getByTestId(testIds.voter.questions.numberSlider);
    await expect(slider.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await slider.first().focus();
    await page.keyboard.press('End'); // native range → exact max
    const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
    await expect(nextButton).toBeVisible({ timeout: TIMEOUTS.element });
    await capture();
    await nextButton.click();
  });
}

/**
 * Answer a MULTI-CHOICE (checkbox) opinion question and advance (see phase 129).
 *
 * The checkbox multi-select renders question-choice checkboxes; a valid answer
 * needs minSelections..maxSelections (2..3 in e2e/base). Click the first 2
 * choices to reach a valid in-range selection, then click Next explicitly
 * (multi-choice never auto-advances, plan 06).
 */
async function expectMultiChoiceQuestionAndAdvance({
  page,
  text
}: {
  page: Page;
  text: RegExp | string;
}): Promise<void> {
  await expectUrlChange(page, async (capture) => {
    const questionHeading = page.getByTestId(testIds.voter.questions.heading);
    await expect(questionHeading).toHaveText(text, { timeout: TIMEOUTS.element });
    const questionId = new URL(page.url()).pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() ?? '';
    // eslint-disable-next-line playwright/no-restricted-locators -- testid+name conjunction not expressible via getByTestId/getByRole
    const choices = page.locator(`[data-testid="question-choice"][name="questionChoices-${questionId}"]`);
    await expect(choices.first()).toBeVisible({ timeout: TIMEOUTS.element });
    // Click the first 2 checkboxes → valid in-range selection (min 2 / max 3).
    await choices.nth(0).click();
    await choices.nth(1).click();
    const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
    await expect(nextButton).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(nextButton).toBeEnabled({ timeout: TIMEOUTS.element });
    await capture();
    await nextButton.click();
  });
}

/**
 * The resolved English render of `questions.multiChoice.selectExact` at
 * `count = 1` — the MF2 `countPlural=one` branch
 * (apps/frontend/messages/en/questions.json:72).
 *
 * Asserted as an EXACT string, deliberately. A loose regex (e.g. /1/ or
 * /select/i) would also be satisfied by the raw dotted key path
 * `questions.multiChoice.selectExact` that an unresolved catalog lookup emits,
 * which is precisely the regression this guard exists to catch — so a loose
 * matcher would be a guard that cannot fail. It also pins the singular noun
 * ("option", not "options"), locking the plural branch itself rather than just
 * the key's presence.
 */
const SELECT_EXACT_ONE_EN = 'Select 1 option.';

/**
 * Answer the EXACT-ONE multi-choice opinion question and advance, asserting the
 * `selectExact` helper text on the way (see phase 135).
 *
 * This is the standing regression guard for
 * `questions.multiChoice.selectExact`. see phase 134 added the key in all 7 locales
 * and proved it renders by importing the compiled Paraglide output at build
 * time, but no seeded question had an equal min/max window, so the RUNNING app
 * always took the `selectRange` branch and a break in the string would have
 * shipped silently (134-06-SUMMARY §"still has no standing guard").
 *
 * `qu-opin-base-8-multichoice-exact` closes that: min === max === 1 makes
 * QuestionChoices render `selectExact` with `count = 1`
 * (QuestionChoices.svelte:420-421). Exactly ONE checkbox is a valid answer here
 * — clicking two would be over-max, so the answer would never persist.
 *
 * Shape precedent: the `selectRange` lock at candidate-journey step 18.5. This
 * one asserts the RESOLVED text rather than a digit pattern, per the reasoning
 * on SELECT_EXACT_ONE_EN above.
 */
async function expectExactOneMultiChoiceQuestionAndAdvance({
  page,
  text
}: {
  page: Page;
  text: RegExp | string;
}): Promise<void> {
  await expectUrlChange(page, async (capture) => {
    const questionHeading = page.getByTestId(testIds.voter.questions.heading);
    await expect(questionHeading).toHaveText(text, { timeout: TIMEOUTS.element });
    const questionId = new URL(page.url()).pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() ?? '';
    // eslint-disable-next-line playwright/no-restricted-locators -- testid+name conjunction not expressible via getByTestId/getByRole
    const choices = page.locator(`[data-testid="question-choice"][name="questionChoices-${questionId}"]`);
    await expect(choices.first()).toBeVisible({ timeout: TIMEOUTS.element });

    // ---- lock ----
    // The helper paragraph is emitted only for a multi-choice question carrying
    // authored min/max (`{#if mode === 'answer' && multiConstraints}`), and its
    // text is the branch output. Exact string → a raw-key regression fails here.
    const helper = page.getByTestId(testIds.voter.questions.choiceHelper);
    await expect(helper).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(helper).toHaveText(SELECT_EXACT_ONE_EN, { timeout: TIMEOUTS.element });

    // Exactly ONE selection is in-range (min === max === 1).
    await choices.nth(0).click();
    const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
    await expect(nextButton).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(nextButton).toBeEnabled({ timeout: TIMEOUTS.element });
    await capture();
    await nextButton.click();
  });
}

/**
 * Settle on a question by heading and advance via Next WITHOUT touching the
 * input (used to re-advance an already-answered number/multi-choice question on
 * a forward round-trip — re-clicking a checkbox would toggle it OFF, and the
 * slider value already persists).
 */
async function settleAndAdvance({ page, text }: { page: Page; text: RegExp | string }): Promise<void> {
  await expectUrlChange(page, async (capture) => {
    const questionHeading = page.getByTestId(testIds.voter.questions.heading);
    await expect(questionHeading).toHaveText(text, { timeout: TIMEOUTS.element });
    const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
    await expect(nextButton).toBeVisible({ timeout: TIMEOUTS.element });
    await capture();
    await nextButton.click();
  });
}

/**
 * Expect the election accordion to be visible, then click the option with the given text and expect the results list to be visible.
 *
 * The AccordionSelect component (apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte)
 * exposes its picks as ARIA `option` roles, not `button`s. After a selection
 * is made it auto-collapses (after DELAY.lg), so subsequent calls observe
 * only the currently-selected option in the DOM. To switch to a different
 * option we first re-expand the accordion by clicking the visible (active)
 * option — clicking the active option toggles `expanded` back on
 * (AccordionSelect.svelte:62-64).
 */
async function expectElectionOptionAndSelect({ page, text }: { page: Page; text: RegExp | string }): Promise<void> {
  const electionAccordion = page.getByTestId(testIds.voter.results.electionAccordion);
  await expect(electionAccordion).toBeVisible({ timeout: TIMEOUTS.element });
  // lock for `components.accordionSelect.listboxAriaLabel` — the one
  // newly-translated key that is a genuine WCAG 2.1 AA defect: without it the
  // listbox announces the raw dotted key path where a control name belongs.
  // AccordionSelect spreads restProps (incl. data-testid) onto the `role=listbox`
  // element itself, so intersect the testid locator with the role rather than
  // searching for a descendant listbox; scoping to the accordion also keeps
  // other routes' listboxes from satisfying the assertion.
  const electionListbox = electionAccordion.and(page.getByRole('listbox'));
  await expect(electionListbox).toHaveAccessibleName('Select an option');
  // If only one option is in the DOM, the accordion is collapsed — click the
  // visible (active) option to toggle it expanded. When fully expanded, all
  // options are present and the target click below selects the desired one.
  const visibleOptions = electionAccordion.getByRole('option');
  const visibleCount = await visibleOptions.count();
  if (visibleCount === 1) {
    await visibleOptions.first().click({ timeout: TIMEOUTS.click });
  }
  const target = electionAccordion.getByRole('option', { name: text }).first();
  await expect(target).toBeVisible({ timeout: TIMEOUTS.element });
  await target.click({ timeout: TIMEOUTS.click });
  // We need to wait for the accordion to collapse again to ensure the state has changed
  await expect(visibleOptions).toHaveCount(1, { timeout: TIMEOUTS.element });
  const resultsList = page.getByTestId(testIds.voter.results.list);
  await expect(resultsList).toBeVisible({ timeout: TIMEOUTS.page });
}

/**
 * Dismiss any leftover dialog without asserting (defensive cleanup).
 * Uses `Locator.waitFor({state:'hidden'})` so neither `expect()` nor
 * `waitForTimeout` is involved.
 */
async function dismissLeftoverDialogsBestEffort(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => null);
  await page
    .getByRole('dialog')
    .first()
    .waitFor({ state: 'hidden', timeout: TIMEOUTS.element })
    .catch(() => null);
}

/**
 * Read a results-list card's match-score callout as an integer percentage.
 * MatchScore.svelte renders the readout as "<n>%" (mirrors
 * resultsPage.expectOrgMatchScore); parse the integer so the boundary
 * test can compare POLAR_MIN vs POLAR_MAX scores numerically. Module-scope to
 * keep the `expect(...).not.toBeNull()` guard out of the test body.
 */
async function readCardMatchScore(card: Locator): Promise<number> {
  const callout = card.getByTestId(testIds.voter.results.matchScore).first();
  await expect(callout).toBeVisible({ timeout: TIMEOUTS.slowPage });
  const text = (await callout.textContent()) ?? '';
  const match = text.match(/(\d+)\s*%/);
  expect(match, `match-score callout "${text}" did not contain an <n>% readout`).not.toBeNull();
  return Number((match as RegExpMatchArray)[1]);
}

/**
 * From the located /questions intro (category-selection) page, walk CLIENT-SIDE
 * to the Base-6 number slider and STOP on it. Deterministic against the e2e/base
 * Base category (base-1..base-7, with the number slider at base-6): click
 * questions-start, advance through the Base category intro, then skip the
 * already-answered Base-1..Base-5 radios via Next. Fully client-side — no
 * page.goto reload — so the in-memory election scope is preserved (a full reload
 * to a questions route bounces to the election selector). Reuses the spec's
 * proven expectCategoryIntroAndAdvance + settleAndAdvance (both plain-click,
 * hard-assert helpers). Module-scope so its `for` loop stays out of the test
 * body (playwright/no-conditional-in-test).
 */
async function advanceToNumberSlider(page: Page): Promise<void> {
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  await expect(questionsStart).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await questionsStart.click();
  await expectCategoryIntroAndAdvance({ page, text: TEXT_RE.baseOpinion });
  for (const text of [
    TEXT_RE.baseOpinion1Likert5,
    TEXT_RE.baseOpinion2Likert4,
    TEXT_RE.baseOpinion3Likert7,
    TEXT_RE.baseOpinion4Categorical,
    TEXT_RE.baseOpinion5Boolean
  ]) {
    await settleAndAdvance({ page, text });
  }
  // Now settled on Base-6 (the number slider), the persisted min answer showing.
  await expect(page.getByTestId(testIds.voter.questions.numberSlider).first()).toBeVisible({
    timeout: TIMEOUTS.slowPage
  });
}

/**
 * Navigate from a located results view BACK into the questions flow via the
 * in-app nav menu "Opinions" link. This is CLIENT-SIDE navigation (an `<a>`
 * click) — a full `page.goto('/questions')` reload drops the in-memory election
 * scope and bounces to the election selector (the questions-intro guard is
 * stricter than the question/category routes advanceToNumberSlider reloads).
 * Lands on the /questions intro; the caller runs advanceToNumberSlider next.
 */
async function goToLocatedQuestionsViaMenu(page: Page): Promise<void> {
  const nav = createNavMenu(page);
  await nav.openMobileNav();
  await nav.menu
    .getByTestId(testIds.shared.navigation.menuItem)
    .filter({ hasText: /Opinions/i })
    .first()
    .click();
  await page.waitForURL(/\/questions/, { timeout: TIMEOUTS.slowPage }).catch(() => null);
}

/**
 * Return to the located results list via the in-app nav menu "Results" link
 * (CLIENT-SIDE, preserving the in-memory scope), then select the first election
 * if the multi-election picker renders (mirrors answerAndAdvanceToResults step
 * 7) and wait for the results list.
 */
async function returnToLocatedResultsViaMenu(page: Page): Promise<void> {
  const nav = createNavMenu(page);
  await nav.openMobileNav();
  await page.getByTestId(testIds.voter.nav.resultsLink).click();
  // The multi-election results page renders the election picker; select the
  // Regional election (the one answerAndAdvanceToResults picks first in step 1,
  // so the candidate set matches) via the spec's proven accordion helper, which
  // handles the expand/collapse dance and waits for the results list.
  await expectElectionOptionAndSelect({ page, text: TEXT_RE.regional });
}

// ====================================================================
// THE TEST
// ====================================================================

test.describe('voter journey', () => {
  test.describe.configure({ mode: 'serial' });

  test('full voter journey end-to-end', async ({ page, resultsPage, entityFilters, entityDetails, voterHomePage }) => {
    test.setTimeout(JOURNEY_TEST_MAX); // reason: 120s inline exception — see JOURNEY_TEST_MAX rationale above (full walk ~75-90s; exceeds the 90s global ceiling).

    // ====================================================================
    // STATIC PAGES
    // ====================================================================

    await test.step('home page renders with a start button', async () => {
      // Named Home-route navigation via the voterHomePage fixture (goToPage
      // hard-asserts the voter-home load anchor).
      await voterHomePage.goToPage('en');
      await expect.soft(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();
    });

    await test.step('about page renders correctly', async () => {
      // reason: About has no dedicated page-fixture; the buildRoute goto is
      // already locale-aware (not a raw string) and the step asserts the
      // about-content anchor immediately below.
      await page.goto(buildRoute({ route: 'About', locale: 'en' }));
      await expect.soft(page.getByTestId(testIds.voter.about.content)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect.soft(page.getByTestId(testIds.voter.about.returnButton)).toBeVisible();
      await expect.soft(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    await test.step('about page back button returns to home', async () => {
      const returnBtn = page.getByTestId(testIds.voter.about.returnButton);
      await returnBtn.click();
      // Back-button lands on the locale-prefixed root or bare root depending
      // on the route resolver; the start button visibility is the canonical
      // home-page assertion.
      await expect.soft(page.getByTestId(testIds.voter.home.startButton)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    });

    await test.step('info page renders correctly', async () => {
      // reason: Info has no dedicated page-fixture; locale-aware buildRoute
      // goto, info-content anchor asserted immediately below.
      await page.goto(buildRoute({ route: 'Info', locale: 'en' }));
      await expect.soft(page.getByTestId(testIds.voter.info.content)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect.soft(page.getByTestId(testIds.voter.info.returnButton)).toBeVisible();
      await expect.soft(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    await test.step('privacy page renders correctly', async () => {
      // reason: Privacy has no dedicated page-fixture; locale-aware buildRoute
      // goto, privacy-content anchor asserted immediately below.
      await page.goto(buildRoute({ route: 'Privacy', locale: 'en' }));
      await expect.soft(page.getByTestId(testIds.voter.privacy.content)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect.soft(page.getByTestId(testIds.voter.privacy.returnButton)).toBeVisible();
      await expect.soft(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    // ====================================================================
    // INTRO + ELECTION SELECTION
    // ====================================================================

    await test.step('home start advances to the intro page', async () => {
      // Home-route nav + start click via voterHomePage fixture (goToPage
      // hard-asserts the voter-home anchor before clickStart).
      await voterHomePage.goToPage('en');
      await voterHomePage.clickStart();
      await page.waitForURL(TEXT_RE.introRoute, { timeout: TIMEOUTS.slowPage }).catch(() => null);
    });

    await test.step('intro page continues to election selection', async () => {
      const introStart = page.getByTestId(testIds.voter.intro.startButton);
      await expect(introStart).toBeVisible({ timeout: TIMEOUTS.element });
      await introStart.click();
    });

    await test.step('election selector is shown', async () => {
      const electionsList = page.getByTestId(testIds.voter.elections.list);
      await expect.soft(electionsList).toBeVisible({ timeout: TIMEOUTS.slowPage });
    });

    await test.step('continue is disabled when no election is selected', async () => {
      // Unselect both election cards first (the dataset defaults to both
      // selected for the multi-election shape). Once both are unselected,
      // the continue button should be disabled.
      const electionOptions = page.getByTestId(testIds.voter.elections.option);
      const optionCount = await electionOptions.count();
      // Card may be a wrapper around a checkbox — click toggles selection.
      // Pragmatic fallback: click each card once, observe continue-disabled
      // state. If the test interface doesn't expose a true "deselect all"
      // path we soft-gate.
      await clickAllTolerantly({ elements: electionOptions, count: optionCount });
      const electionsContinue = page.getByTestId(testIds.voter.elections.continue);
      // Disabled-state may depend on implementation specifics: if both cards
      // were re-selected by clicks, the contract may not be exercisable from
      // this test. Soft-gate so the walk continues.
      const isDisabled = await electionsContinue.isDisabled().catch(() => false);
      expect.soft(isDisabled, 'elections.continue should be disabled when no election selected').toBe(true);
    });

    await test.step('continue with the default election selection', async () => {
      // Ensure both elections are selected before continuing: clicking each
      // card once toggles to selected (if the previous step left them in a
      // deselected or partial state). Mirrors the voter-journey fixture's
      // tolerant pattern (default state already selects both, click is a
      // no-op if already selected; click-toggle reselects if deselected).
      const electionOptions = page.getByTestId(testIds.voter.elections.option);
      const optionCount = await electionOptions.count();
      await ensureAllChecked({ elements: electionOptions, count: optionCount });
      const electionsContinue = page.getByTestId(testIds.voter.elections.continue);
      await expect(electionsContinue).toBeEnabled({ timeout: TIMEOUTS.page });
      await electionsContinue.click();
    });

    // ====================================================================
    // CONSTITUENCY SELECTION
    // ====================================================================

    await test.step('constituency list is visible', async () => {
      const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
      await expect.soft(constituenciesList).toBeVisible({ timeout: TIMEOUTS.slowPage });
    });

    await test.step('constituency selector shows only municipalities', async () => {
      // base has 2 CGs: CG-Reg (CO-Reg-N / CO-Reg-S) and CG-Mun
      // (CO-Mun-NE/NW/SE/SW). The hierarchical CG flattens to municipality
      // leaves only — the user should see CO-Mun-* options and never the
      // CO-Reg-* parent options. Inspect each combobox in the constituencies
      // list and assert the listbox options match Mun names only.
      const listbox = await getOnlyConstituencyListbox(page);
      const optionTexts = await listbox.getByRole('option').allTextContents();
      // Mun option names per e2e/base.ts:366-392.
      const hasMunNames = optionTexts.some((t) => TEXT_RE.munLeafNames.test(t));
      expect
        .soft(hasMunNames, `combobox options should contain Mun names; got ${JSON.stringify(optionTexts)}`)
        .toBe(true);
      // CO-Reg-* parent should NOT be in the leaf options (only municipalities flattened).
      // If Reg options DO appear, the hierarchical-flattening contract isn't
      // satisfied — soft so the test continues.
      const hasRegOnlyNames = optionTexts.some((t) => TEXT_RE.regOnlyParents.test(t.trim()));
      expect
        .soft(
          hasRegOnlyNames,
          `combobox should flatten to Mun leaves; if Reg options appear, the hierarchical-flattening contract is not satisfied. options=${JSON.stringify(optionTexts)}`
        )
        .toBe(false);
      // Close the combobox by pressing Escape so the next step starts from a clean baseline.
      await page.keyboard.press('Escape');
    });

    await test.step('hierarchical constituency selection continues with valid nominations', async () => {
      // Pick CO-Mun-NE specifically by name — it has nominations for BOTH
      // EL-Reg (via parent CO-Reg-N) AND EL-Mun (direct), so the
      // voter-missing-nominations modal should NOT appear after continue.
      // e2e/base.ts:366-371.
      const listbox = await getOnlyConstituencyListbox(page);
      const neOption = listbox.getByRole('option', { name: TEXT_RE.northEast }).first();
      await neOption.click();
      const constituenciesContinue = page.getByTestId(testIds.voter.constituencies.continue);
      await expect(constituenciesContinue).toBeEnabled({ timeout: TIMEOUTS.page });
      await constituenciesContinue.click();
      // Wait for the layout's nomination-availability check to settle by
      // observing the missing-nominations modal contract directly.
      // toBeHidden waits up to its timeout for the element to be absent
      // or detached, replacing the prior page.waitForTimeout(1_500).
      await expect(page.getByTestId(testIds.voter.missingNominationsModal)).toBeHidden({ timeout: TIMEOUTS.slowPage });
    });

    // ====================================================================
    // QUESTIONS INTRO + CATEGORY SELECTION
    // ====================================================================

    await test.step('questions intro renders the category list and enforces the min-answers gate', async () => {
      // Categories visible: 7 opinion categories from base, with
      // QG-Opin-CO-Mun-SE-SW filtered out (CO-Mun-NE is selected, scope
      // excludes SE+SW) and QG-Opin-Filt-B filtered out (per-question
      // constituency scope), giving 5 categories visible.
      const categoryList = page.getByTestId(testIds.voter.questions.categoryList);
      await expect.soft(categoryList).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const categoryCheckboxes = page.getByTestId(testIds.voter.questions.categoryCheckbox);
      await expect.soft(categoryCheckboxes).toHaveCount(5); // Base + Opt-A + Opt-B minimum + scoped extras

      const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
      // Uncheck "Base Opinion Questions"
      await toggleCategoryListItem({ page, label: TEXT_RE.baseOpinion, checked: false });
      await expect.soft(questionsStart).toHaveText(TEXT_RE.answerCount, { timeout: TIMEOUTS.element });
      await expect.soft(questionsStart).toBeDisabled({ timeout: TIMEOUTS.element });

      // Recheck "Base Opinion Questions"
      await toggleCategoryListItem({ page, label: TEXT_RE.baseOpinion, checked: true });
      await expect.soft(questionsStart).toBeEnabled({ timeout: TIMEOUTS.element });

      // Uncheck QG-Opin-Opt-B for later use
      await toggleCategoryListItem({ page, label: TEXT_RE.optionalOpinionsB, checked: false });

      await questionsStart.click();
    });

    // ====================================================================
    // CATEGORY INTRO + LIKERT ANSWERS
    // ====================================================================

    // The previous step ended with `questionsStart.click()` which navigates
    // to the QG-Opin-Base category intro page — assert the category hero
    // image BEFORE advancing into Q1.
    await test.step('opinion-question category intro renders the image hero', async () => {
      const categoryHero = page.getByTestId(testIds.voter.questions.categoryHero);
      await expect.soft(categoryHero).toBeVisible({ timeout: TIMEOUTS.slowPage });
      // Image hero shape (custom_data.hero = { url, type: 'image' } per base)
      // renders an <img> via Hero.svelte → Image.svelte. Assert the <img> is
      // present inside the testid-bearing <figure>.
      await expect
        .soft(categoryHero.getByTestId(testIds.shared.image).first())
        .toBeVisible({ timeout: TIMEOUTS.element });
    });

    await test.step('first category intro, previous-question roundtrip, delete answer only visible when answered', async () => {
      // First category intro
      await expectCategoryIntroAndAdvance({ page, text: TEXT_RE.baseOpinion });
      // We should see the previous question and not the category intro again
      const questionHeading = page.getByTestId(testIds.voter.questions.heading);
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion1Likert5, { timeout: TIMEOUTS.element });
      // Delete button should be enabled only when question is answered
      const deleteButton = page.getByTestId(testIds.shared.questionDelete);
      await expect.soft(deleteButton).toBeDisabled({ timeout: TIMEOUTS.element });

      // Q1 (Base-1 Likert5) carries a hero emoji ('🗳️') AND info content
      // ('[qu-opin-base-1-info] ...'). Assert hero visible + emoji rendered +
      // info button visible + clicking it reveals the info content body.
      const heroFigure = page.getByTestId(testIds.voter.questions.hero);
      await expect.soft(heroFigure).toBeVisible({ timeout: TIMEOUTS.element });
      await expect.soft(heroFigure).toContainText('🗳️');
      const infoButton = page.getByTestId(testIds.voter.questions.infoButton);
      await expect(infoButton).toBeVisible({ timeout: TIMEOUTS.element });
      // Click the Expander to reveal the info body (Expander is a checkbox
      // input inside the wrapper div carrying the testid; clicking the
      // wrapper toggles the checkbox).
      await infoButton.click({ timeout: TIMEOUTS.click });
      await expect.soft(infoButton).toContainText(/\[qu-opin-base-1-info\]/i, { timeout: TIMEOUTS.element });

      // Answer first question
      await expectQuestionAndAdvance({
        page,
        text: TEXT_RE.baseOpinion1Likert5,
        optionIndex: (n) => n - 1 // Answer last option for matching test
      });
      // Browser-back to the first (now-answered) question.
      await page.goBack();
      // Expect the last to be answered and the delete button to be visible.
      //
      // `page.goBack()` is a FULL browser navigation (not an in-app prev-button
      // hop): SvelteKit re-runs load + the question variant remounts via
      // `{#key question.type}`, and the persisted answer is re-hydrated onto the
      // radio's checked state only AFTER that round-trip settles. The 2s element
      // budget occasionally loses that race (intermittent "unchecked" at this
      // line) — use the navigation budget (TIMEOUTS.page, 5s) for this
      // post-goBack answer-restore assertion, matching the single-navigation
      // round-trip it actually waits on.
      const answerOptions = page.getByTestId(testIds.voter.questions.answerOption);
      const lastOption = answerOptions.last();
      await expect.soft(lastOption).toBeChecked({ timeout: TIMEOUTS.page });
      await expect.soft(deleteButton).toBeVisible({ timeout: TIMEOUTS.element });
      // Move to the next question (2nd in the category). We are back on Base-1
      // (just navigated back), so gate on its heading; advancing lands on Base-2.
      await expectQuestionAndAdvance({
        page,
        text: TEXT_RE.baseOpinion1Likert5,
        optionIndex: (n) => n - 1,
        allowPreselected: true // Allow the last option to be preselected since we just went back to this question.
      });

      // Q2 (Base-2 Likert4) carries a hero IMAGE (no emoji) AND has NO info
      // content. Assert hero <img> visible and Info button hidden/absent.
      const heroFigureQ2 = page.getByTestId(testIds.voter.questions.hero);
      await expect.soft(heroFigureQ2).toBeVisible({ timeout: TIMEOUTS.element });
      await expect
        .soft(heroFigureQ2.getByTestId(testIds.shared.image).first())
        .toBeVisible({ timeout: TIMEOUTS.element });
      const infoButtonQ2 = page.getByTestId(testIds.voter.questions.infoButton);
      await expect.soft(infoButtonQ2).toHaveCount(0, { timeout: TIMEOUTS.element });
    });

    // customData.terms extension (additive, against e2e/base; the
    // `terms` block was seeded on Base-3 / qu-opin-base-3-likert7 in Phase 119,
    // base.ts:782-790). The trigger 'Likert' appears verbatim in the Base-3 title
    // ("Base opinion 3 — Likert 7"), so QuestionHeading renders it as an in-text
    // <Term> affordance; hovering/focusing the trigger reveals the definition
    // popup. We are on Base-2 here (Base-1 answered above) — advance to Base-3
    // WITHOUT answering, assert the term affordance + popup, then resume the
    // polar-MAX answer walk from Base-3.
    await test.step('EPERM-07 customData.terms: in-text affordance + definition popup on Base-3', async () => {
      // Advance Base-2 → Base-3 (answer Base-2 at polar-MAX as the walk requires).
      await expectQuestionAndAdvance({
        page,
        text: TEXT_RE.baseOpinion2Likert4,
        optionIndex: (n) => n - 1
      });
      // Settle on Base-3 by its heading.
      const questionHeading = page.getByTestId(testIds.voter.questions.heading);
      // reason: HARD, not soft (see phase 138; deferred-items.md § DEF-135-04 "Suggested follow-up") —
      // a mis-timed Base-3 arrival must abort HERE, not two lines below at the term gate that misdirects.
      await expect(questionHeading).toHaveText(TEXT_RE.baseOpinion3Likert7, { timeout: TIMEOUTS.element });

      // The in-text term trigger renders inside the heading (the 'Likert' token).
      const termTrigger = page.getByTestId(testIds.voter.questions.termTrigger);
      await expect(termTrigger.first()).toBeVisible({ timeout: TIMEOUTS.element });
      await expect.soft(termTrigger.first()).toHaveText(/Likert/i, { timeout: TIMEOUTS.element });

      // The definition popup is mounted only while the trigger is hovered/focused
      // (Term.svelte W3C APG tooltip pattern). Focus reveals it; assert the
      // definition content (seeded title + content joined as "title: content").
      await termTrigger.first().focus();
      const termPopup = page.getByTestId(testIds.voter.questions.termPopup);
      await expect(termPopup.first()).toBeVisible({ timeout: TIMEOUTS.element });
      await expect(termPopup.first()).toContainText(/Likert scale/i, { timeout: TIMEOUTS.element });
      await expect(termPopup.first()).toContainText(/ordered rating scale/i, { timeout: TIMEOUTS.element });
      // Blur to dismiss the popup before resuming the answer walk.
      await termTrigger.first().blur();
    });

    // skip + delete/back nav + answer-count→results-CTA.
    // This step (delete answer → results link re-disabled → re-answer → re-enabled,
    // plus the previous-button back-nav) plus the Opt-A skip step below ARE the
    // confirmed-covered behaviour — re-confirmed with NO behaviour change
    // (see phase 121 scope_fence: is confirmed-covered, comment for greppable
    // decision-coverage evidence).
    await test.step('answer remaining base questions at polar-MAX, delete answer, results link gated on min answers', async () => {
      // Answer and advance through the rest of the category's questions. We are
      // on Base-3 here (Base-1/Base-2 answered above; Base-3 reached for the terms
      // assertion); the dataset is stable, so the remaining base questions are
      // known in walk order: Base-3 → 4 → 5.
      for (const text of [TEXT_RE.baseOpinion3Likert7, TEXT_RE.baseOpinion4Categorical, TEXT_RE.baseOpinion5Boolean]) {
        await expectQuestionAndAdvance({
          page,
          text,
          optionIndex: (n) => n - 1 // Answer last option for matching test
        });
      }
      // see phase 129 see phase 135: the MAIN category now ends with
      // Base-6 (number scale), Base-7 (multi-choice 2..3) and Base-8
      // (multi-choice EXACT one). Answer all three (slider End; first 2
      // checkboxes; a single checkbox) before the Opt-A intro shows.
      await expectNumberQuestionAndAdvance({ page, text: TEXT_RE.baseOpinion6Number });
      await expectMultiChoiceQuestionAndAdvance({ page, text: TEXT_RE.baseOpinion7MultiChoice });
      // this call carries the `questions.multiChoice.selectExact`
      // resolved-text lock (see expectExactOneMultiChoiceQuestionAndAdvance).
      await expectExactOneMultiChoiceQuestionAndAdvance({ page, text: TEXT_RE.baseOpinion8MultiChoiceExact });
      // We should now see the next category intro
      await expectCategoryIntroAndAdvance({ page, text: TEXT_RE.optionalOpinionsA });
      // We should now see a question and the results list should be enabled
      const resultsLink = page.getByTestId(testIds.voter.banner.results);
      await expect.soft(resultsLink).toBeEnabled({ timeout: TIMEOUTS.element });
      // Then let's return to the previous question with the previous button
      const previousButton = page.getByTestId(testIds.voter.questions.previousButton);
      await expect(previousButton).toBeVisible({ timeout: TIMEOUTS.element });
      await previousButton.click();
      // We should see the previous question (now Base-8 multi-choice exact-one,
      // the last base question) and not the category intro again.
      const questionHeading = page.getByTestId(testIds.voter.questions.heading);
      await expect
        .soft(questionHeading)
        .toHaveText(TEXT_RE.baseOpinion8MultiChoiceExact, { timeout: TIMEOUTS.element });
      // Min-answers gate (minimumAnswers: 5). see phase 129 added Base-6/Base-7
      // and Phase 135 added Base-8, so the voter now holds 8 base answers here —
      // deleting ONE no longer crosses the 5-answer threshold. Delete FOUR
      // (Base-8 → Base-7 → Base-6 → Base-5, 8→7→6→5→4) to cross below the gate,
      // asserting the CTA stays enabled until the crossing delete, then
      // re-answer forward to re-enable it.
      const deleteButton = page.getByTestId(testIds.shared.questionDelete);
      await deleteButton.click(); // Base-8 deleted → 7 answers, still ≥ 5
      await expect.soft(resultsLink).toBeEnabled({ timeout: TIMEOUTS.element });
      await previousButton.click();
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion7MultiChoice, { timeout: TIMEOUTS.element });
      await deleteButton.click(); // Base-7 deleted → 6 answers, still ≥ 5
      await expect.soft(resultsLink).toBeEnabled({ timeout: TIMEOUTS.element });
      await previousButton.click();
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion6Number, { timeout: TIMEOUTS.element });
      await deleteButton.click(); // Base-6 deleted → 5 answers, still ≥ 5
      await expect.soft(resultsLink).toBeEnabled({ timeout: TIMEOUTS.element });
      await previousButton.click();
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion5Boolean, { timeout: TIMEOUTS.element });
      await deleteButton.click(); // Base-5 deleted → 4 answers, below the gate
      await expect.soft(resultsLink).toBeDisabled({ timeout: TIMEOUTS.element });
      // Re-answer the four deleted questions forward to re-enable the CTA.
      await expectQuestionAndAdvance({
        page,
        text: TEXT_RE.baseOpinion5Boolean,
        optionIndex: (n) => n - 1,
        allowPreselected: false
      });
      await expectNumberQuestionAndAdvance({ page, text: TEXT_RE.baseOpinion6Number });
      await expectMultiChoiceQuestionAndAdvance({ page, text: TEXT_RE.baseOpinion7MultiChoice });
      // Second pass — on a question whose answer was DELETED and is
      // being re-entered, so the helper text is re-asserted against a freshly
      // remounted QuestionChoices (deleteEpoch bump) rather than only the
      // first-paint one.
      await expectExactOneMultiChoiceQuestionAndAdvance({ page, text: TEXT_RE.baseOpinion8MultiChoiceExact });
      await expect.soft(resultsLink).toBeEnabled({ timeout: TIMEOUTS.element });
    });

    // Answer-survival gate: after answering a multi-step Q→Q run that CROSSES a
    // question.type boundary (Base-5 Boolean ← Base-4 Categorical), navigate BACK
    // across that boundary and assert the earlier (Categorical) question's option
    // is STILL checked. This crossing exercises the `{#key question.type}` remount
    // path: it proves answers survive a Q→Q hop even when the variant component is
    // torn down and remounted, not merely when the same variant is reused.
    // SvelteKit reuses `questions/[questionId]/+page.svelte` (see the
    // SETTLE-BEFORE-COUNT comment on expectQuestionAndAdvance).
    await test.step('answer survives a multi-step Q→Q run across a question-type boundary', async () => {
      // We were at the category boundary
      await expectCategoryIntroAndAdvance({ page, text: TEXT_RE.optionalOpinionsA });
      const previousButton = page.getByTestId(testIds.voter.questions.previousButton);
      const questionHeading = page.getByTestId(testIds.voter.questions.heading);
      // Go back across the new number + multi-choice questions to the Base-4
      // Categorical question (opt-a-1 ← Base-8 ← Base-7 ← Base-6 ← Base-5 ←
      // Base-4). This crosses MULTIPLE question.type boundaries (multi-choice →
      // number → boolean → categorical), exercising the `{#key question.type}`
      // remount path each hop. The Base-8 ← Base-7 hop is additionally a
      // SAME-type hop (both multipleChoiceCategorical), which does NOT remount
      // the input — so it also covers the reuse path.
      await previousButton.click();
      await expect
        .soft(questionHeading)
        .toHaveText(TEXT_RE.baseOpinion8MultiChoiceExact, { timeout: TIMEOUTS.element });
      await previousButton.click();
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion7MultiChoice, { timeout: TIMEOUTS.element });
      await previousButton.click();
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion6Number, { timeout: TIMEOUTS.element });
      await previousButton.click();
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion5Boolean, { timeout: TIMEOUTS.element });
      await previousButton.click();
      await expect.soft(questionHeading).toHaveText(TEXT_RE.baseOpinion4Categorical, { timeout: TIMEOUTS.element });
      // The earlier answer must still be checked
      const answerOptions = page.getByTestId(testIds.voter.questions.answerOption);
      const lastOption = answerOptions.last();
      await expect(lastOption).toBeChecked({ timeout: TIMEOUTS.element });
      // Advance forward again to confirm the round-trip left answers intact.
      // Base-4/Base-5 are radios (allowPreselected); Base-6/Base-7/Base-8 are
      // the number/multi-choice inputs — re-advance via Next without
      // re-toggling (a re-click would UNCHECK a box, and on Base-8 that would
      // drop the selection below its min of 1).
      await expectQuestionAndAdvance({
        page,
        text: TEXT_RE.baseOpinion4Categorical,
        optionIndex: (n) => n - 1,
        allowPreselected: true
      });
      await expectQuestionAndAdvance({
        page,
        text: TEXT_RE.baseOpinion5Boolean,
        optionIndex: (n) => n - 1,
        allowPreselected: true
      });
      await settleAndAdvance({ page, text: TEXT_RE.baseOpinion6Number });
      await settleAndAdvance({ page, text: TEXT_RE.baseOpinion7MultiChoice });
      await settleAndAdvance({ page, text: TEXT_RE.baseOpinion8MultiChoiceExact });
    });

    // ====================================================================
    // CATEGORY SKIP + FILTERED CATEGORIES + REMAINING QUESTIONS
    // ====================================================================

    // skip + delete/back nav + answer-count→results-CTA.
    // The categorySkip click below is the confirmed-covered category-skip
    // slice (Opt-A skipped → its questions never appear; the de-selected Opt-B
    // category also stays absent) — re-confirmed, NO behaviour change.
    await test.step('skip the Opt-A category, and the deselected Opt-B category never appears', async () => {
      // After answering QG-Opin-Base, we should hit the QG-Opin-Opt-A category intro (categoryStart visible). Click Skip instead of Start.
      await expectCategoryIntroAndAdvance({ page, text: TEXT_RE.optionalOpinionsA, skip: true });
      // Opt-B category was deselected earlier — it should NOT appear in the walk, instead we should see regional questions and continue
      await expectCategoryIntroAndAdvance({ page, text: TEXT_RE.regionalOpinionsCategory });
    });

    await test.step('category scoping shows the regional question and the per-question-filtered category', async () => {
      // We should now see the only regional question
      await expectQuestionAndAdvance({ page, text: TEXT_RE.regionalOpinionsQuestion, optionIndex: (n) => n - 1 });
      // We should now see the only regional filtered category intro
      await expectCategoryIntroAndAdvance({ page, text: TEXT_RE.regionallyFilteredCategory });
      await expectQuestionAndAdvance({ page, text: TEXT_RE.filtMunNeOpinion, optionIndex: (n) => n - 1 });
    });

    // ====================================================================
    // RESULTS LANDING + ENTITY-TYPE TABS
    // ====================================================================

    await test.step('results page shows the election selector, list, and entity tabs with parties/candidates switching', async () => {
      // Expect the election selector and select the Regional election, then the Municipal, and again the Regional
      await expectElectionOptionAndSelect({ page, text: TEXT_RE.regional });
      await expectElectionOptionAndSelect({ page, text: TEXT_RE.municipal });
      await expectElectionOptionAndSelect({ page, text: TEXT_RE.regional });
      const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
      await expect.soft(entityTabs).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
      await expect.soft(candidateSection).toBeVisible();
      // Switch to parties tab.
      await entityTabs.getByRole('tab', { name: TEXT_RE.partiesTab }).click();
      const partySection = page.getByTestId(testIds.voter.results.partySection);
      await expect.soft(partySection).toBeVisible({ timeout: TIMEOUTS.slowPage });
      // Switch back to candidates.
      await entityTabs.getByRole('tab', { name: TEXT_RE.candidateTab }).click();
      await expect.soft(candidateSection).toBeVisible({ timeout: TIMEOUTS.slowPage });
    });

    // ====================================================================
    // RESULT CARD CONTENT + ENTITY-TYPE COUNTS
    //
    // Asserts the first candidate card: test-qu-info-text answer rendered,
    // submatches block visible, 4 score gauges inside submatches, election
    // symbol "10" rendered.
    // ====================================================================

    await test.step('result card shows info text, four score gauges, and the election symbol', async () => {
      const cards = resultsPage.getEntityCards();
      // After the POLAR_MAX answer set, the top-ranked candidate is
      // test-ca-bb-1 ('Polar-Max BB One'). Match by name regex (NOT by
      // .first() position — leaves room for ranking determinism).
      const firstCard = cards.filter({ hasText: TEXT_RE.polarMax }).first();
      await expect.soft(firstCard).toBeVisible({ timeout: TIMEOUTS.slowPage });

      // e2e/base.ts:246 DEFAULT_INFO_ANSWERS — every candidate's
      // test-qu-info-text value is "Default candidate biography text.". The
      // seed-time resolver wires this answer onto the card via
      // cardContents.candidate.
      await expect.soft(firstCard).toContainText(/Default candidate biography text\./i);

      // Sub-matches block visible inside the card.
      const subMatches = firstCard.getByTestId(testIds.voter.results.subMatches);
      await expect.soft(subMatches).toBeVisible();

      // per-category subMatch CORRECT values for the pinned
      // polar-MAX candidate test-ca-bb-1 (NOT count-only). The voter answered
      // every reachable opinion question at polar-MAX; test-ca-bb-1 is itself
      // polar-MAX, so the categories the voter ANSWERED (Base + Regional)
      // score the full 100, while the two OPTIONAL categories the voter
      // skipped/de-selected (Opt-A NotSelected, Opt-B Skipped) score the
      // neutral 50 (no overlapping voter answer in those groups → the
      // matching algorithm's no-information midpoint). Exactly FOUR gauges
      // render — one per question group that is in scope for test-ca-bb-1's
      // nominations (Base, Opt-A, Opt-B, Regional); the per-question-filtered
      // Mun-NE group is NOT a gauge here (out of this candidate's scope).
      //
      // Values DERIVED at build by reading the rendered aria-valuenow off each
      // gauge's role=meter (ScoreGauge.svelte:64-79) — not guessed. The
      // deterministic 'max' walk + name-pinned candidate make these exact.
      const gauges = subMatches.getByTestId(testIds.voter.results.scoreGauge);
      await expect.soft(gauges).toHaveCount(4);

      // (b) Each gauge reads its expected per-category score. Pin each gauge by
      // its question-group label (stable [<id>] prefix) and assert the
      // aria-valuenow on its meter (gaugeMeterByLabel module helper). Only
      // voter-reachable categories surface a gauge; the values are the
      // rendered, deterministic per-category scores.
      await expect.soft(gaugeMeterByLabel(gauges, TEXT_RE.baseOpinion)).toHaveAttribute('aria-valuenow', '100');
      await expect.soft(gaugeMeterByLabel(gauges, TEXT_RE.optionalOpinionsA)).toHaveAttribute('aria-valuenow', '50');
      await expect.soft(gaugeMeterByLabel(gauges, TEXT_RE.optionalOpinionsB)).toHaveAttribute('aria-valuenow', '50');
      await expect
        .soft(gaugeMeterByLabel(gauges, TEXT_RE.regionalOpinionsCategory))
        .toHaveAttribute('aria-valuenow', '100');

      // Election symbol "10" for test-ca-bb-1 — driven by election_symbol
      // metadata on the nomination row.
      const symbol = firstCard.getByTestId(testIds.voter.results.electionSymbol).first();
      await expect.soft(symbol).toHaveText(/^10$/);
    });

    // ====================================================================
    // MATCHING: ORGANISATIONS.
    // Base counts under EL-Reg / CO-Reg-N:
    //   - 5 outer org-cards (Party AA, AB, BA, BB, C).
    //   - Party BB has 2 members (test-ca-bb-1 + test-ca-bb-2). 2 ≤ 3
    //     maxSubcards → NO 'Show all' button.
    //   - Party AA has 6 nominal members; 1 hidden (test-ca-aa-hidden via
    //     terms_of_use_accepted absent) → 5 visible. Default shows 3;
    //     'Show all 5 candidates' reveals 5; Collapse returns to 3.
    // ====================================================================

    await test.step('organisation matching shows 5 cards, Party BB members, and Party AA show-all/collapse', async () => {
      await resultsPage.selectEntityTab('orgs');

      // 5 outer organisation cards under EL-Reg / CO-Reg-N.
      const cards = resultsPage.getEntityCards();
      await expect.soft(cards).toHaveCount(5, { timeout: TIMEOUTS.slowPage });

      // Party BB — 2 subcards, no Show-all button.
      // (Use filter().first() — matching-algorithm ranking determinism not
      // guaranteed for first-position; use hasText to pin the card
      // unambiguously.)
      const partyBB = cards.filter({ hasText: /Party BB - Best-Regional-Party/i }).first();
      await expect.soft(partyBB).toBeVisible();
      await expect.soft(partyBB.getByTestId(testIds.voter.results.cardSubcard)).toHaveCount(2);
      await expect.soft(partyBB.getByRole('button', { name: /Show all/i })).toHaveCount(0);

      // Party AA — 3 subcards default, Show-all-5 button, expand → 5,
      // Collapse → 3, Show-all-5 button returns.
      const partyAA = cards.filter({ hasText: /\[or-aa\] Party AA/i }).first();
      await expect.soft(partyAA).toBeVisible();
      await expect.soft(partyAA.getByTestId(testIds.voter.results.cardSubcard)).toHaveCount(3);
      const showAllBtn = partyAA.getByRole('button', { name: /Show all 5/i });
      await expect(showAllBtn).toBeVisible();

      await showAllBtn.click();
      await expect.soft(partyAA.getByTestId(testIds.voter.results.cardSubcard)).toHaveCount(5);
      const collapseBtn = partyAA.getByRole('button', { name: /Collapse|hide/i });
      await expect(collapseBtn).toBeVisible();

      await collapseBtn.click();
      await expect.soft(partyAA.getByTestId(testIds.voter.results.cardSubcard)).toHaveCount(3);
      await expect.soft(partyAA.getByRole('button', { name: /Show all 5/i })).toBeVisible();
    });

    // ====================================================================
    // ALLIANCE RENDER VERIFICATION (see phase 129)
    //
    // Adding 'alliance' to results.sections (e2e/base seed, this phase) is the
    // single switch that surfaces the alliance tab + cards. Alliance A is
    // nominated in CO-Reg-N (the voter's Regional-election scope) with member
    // orgs OR-AA + OR-AB. The org→alliance imputation (organizationMatching:
    // 'impute') yields the card-level MatchScore gauge for free — no
    // frontend code was built this phase. Presence-level only; the full
    // card+drawer spec is Phase-130 scope.
    // ====================================================================
    await test.step('D-10: alliance tab renders alliance cards with a match-score gauge + member-org subcards', async () => {
      await resultsPage.selectEntityTab('alliances');
      const allianceSection = page.getByTestId(testIds.voter.results.allianceSection);
      await expect.soft(allianceSection).toBeVisible({ timeout: TIMEOUTS.slowPage });

      // Alliance A card — nominated in the voter's CO-Reg-N scope.
      const allianceA = resultsPage
        .getEntityCards()
        .filter({ hasText: /Alliance A/i })
        .first();
      await expect.soft(allianceA).toBeVisible({ timeout: TIMEOUTS.slowPage });
      // Card-level MatchScore gauge (org→alliance imputation output; same
      // rounding as org cards) — renders whenever parsed.match is set.
      await expect.soft(allianceA.getByTestId(testIds.voter.results.matchScore).first()).toBeVisible({
        timeout: TIMEOUTS.element
      });
      // Member-org children: OR-AA + OR-AB under AL-A → ≥ 2 subcards (the
      // Phase-69 subcard list, verify-only). Assert the 2nd subcard visible to
      // prove the zero-one-many "many" branch.
      const allianceSubcards = allianceA.getByTestId(testIds.voter.results.cardSubcard);
      await expect.soft(allianceSubcards.nth(1)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    });

    // ====================================================================
    // MATCHING ALGORITHM VERIFICATION
    // ====================================================================

    await test.step('matching ranks perfect-match first, worst-match last, partial-answer in the middle, and hides the hidden candidate', async () => {
      // The previous step (result card content) left the page on the Parties
      // tab. Switch back to Candidates so the candidate-section is visible
      // for the ranking assertions below.
      const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
      await entityTabs.getByRole('tab', { name: TEXT_RE.candidateTab }).click();

      // RANKING CONTRACT:
      //   CA-AA-Special has missing answers (base-2 case b + Filt-Mun-NE
      //   case d per e2e/base.ts:817-832), so its match score is reduced.
      //   The perfect-match candidates are the POLAR_MAX candidates
      //   (e2e/base.ts:265-271 + CA-AA-1 at :851-861 + CA-AA-Hidden at
      //   :836-849 with full polar-MAX answers). Both "Generic AA One" and
      //   "Hidden Candidate AA" rank at "100% match", with one of them
      //   appearing first in DOM order.
      //
      const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
      await expect.soft(candidateSection).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const cards = candidateSection.getByTestId(testIds.voter.results.card);
      // Expect to see 14 candidates minus the one who is hidden
      await expect.soft(cards).toHaveCount(13);
      // Expect the polar max and min candidates to be first and last on the list, respectively.
      const firstCardTitle = cards.first().getByTestId(testIds.voter.results.cardTitle);
      const lastCardTitle = cards.last().getByTestId(testIds.voter.results.cardTitle);
      await expect.soft(firstCardTitle).toContainText(TEXT_RE.polarMax, { timeout: TIMEOUTS.element });
      await expect.soft(lastCardTitle).toContainText(TEXT_RE.polarMin, { timeout: TIMEOUTS.element });
      // The partial-answer candidate (CA-AA-Special) should be somewhere in the middle (no first or last).
      await expect.soft(candidateSection).toContainText(TEXT_RE.specialCandidate);
      // Expect the hidden candidate (CA-AA-Hidden) to NOT be present in the list (termsOfUseAccepted=false).
      const hiddenCandidates = candidateSection
        .getByTestId(testIds.voter.results.card)
        .filter({ hasText: TEXT_RE.hiddenCandidate });
      await expect.soft(hiddenCandidates).toHaveCount(0, { timeout: TIMEOUTS.element });

      // matching-incorporation proof (max side). The max-walk
      // voter's answers equal POLAR_MAX on EVERY dimension INCLUDING the two new
      // opinion types: number (10, slider End) and multi-choice (['a','b'] — the
      // walk's first-2 checkbox click matches POLAR_MAX's seeded pair,
      // base.ts:305-306). The first card is a perfect-match POLAR_MAX candidate,
      // so its results-list match-score reads 100% — a reading only reachable if
      // BOTH new types incorporate into matching with ZERO distance. A broken
      // number or multi-choice dispatch would drag the score below 100. This is
      // HARD (stronger than the soft ordering neighbours above).
      await expect(cards.first().getByTestId(testIds.voter.results.matchScore).first()).toContainText(/100\s*%/, {
        timeout: TIMEOUTS.element
      });
    });

    // ====================================================================
    // VOTER ENTITY DETAIL
    //
    // The CA-AA-Special drawer covers the info-tab + opinions-tab +
    // tab-switch invariants.
    // ====================================================================

    await test.step('candidate details show the voter-vs-entity answer matrix on CA-AA-Special', async () => {
      // Open CA-AA-Special's drawer via the resultsPage fixture. The
      // matching step left the page on the Candidates tab; the matrix
      // cell does not assume CA-AA-Special is first.
      const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
      const specialCard = candidateSection
        .getByTestId(testIds.voter.results.card)
        .filter({ hasText: TEXT_RE.specialCandidate })
        .first();
      await expect.soft(specialCard).toHaveCount(1, { timeout: TIMEOUTS.page });
      await specialCard.click();
      const dialog = page.getByRole('dialog');
      await expect.soft(dialog).toBeVisible({ timeout: TIMEOUTS.page });

      // Special candidate carries the DEFAULT_INFO_ANSWERS set (e2e/base.ts:243)
      // for every info question + its own asymmetric opinion arrangement, and
      // its 2 candidate nominations omit `election_symbol` → the Election
      // number row renders as "—" (showMissingElectionSymbol: candidate=true
      // gates the row's existence). 14 info-items total: 4 nomination meta +
      // 8 non-link info questions + 1 Links group + 1 north-only filtered info
      // question (test-qu-info-filt-co-reg-n, visible only because
      // CA-AA-Special's primary nomination is in CO-Reg-N). The mun-only +
      // south-only variants are out-of-scope and asserted absent below.
      // `6/15/1980` is the en-US `toLocaleDateString` format for the seeded
      // `1980-06-15` date answer.
      const infoTab = dialog.getByTestId(testIds.voter.entityDetail.infoTab);
      await expect.soft(infoTab).toBeVisible({ timeout: TIMEOUTS.page });

      // candidate tab control. `entityDetails.contents.candidate`
      // is ['info','opinions'] (e2e/base.ts:147), so the candidate drawer must
      // expose EXACTLY [info, opinions] tabs — and CRUCIALLY the org-only
      // 'children'/Members tab must be ABSENT (tab control is per-type, not a
      // fixed set). `expectTabs` hard-asserts both the exact count+order and the
      // accessible-name of each tab; the explicit Members-absent check below
      // makes the per-type contract unmistakable. HARD assertions (no soft).
      await entityDetails.expectTabs(['info', 'opinions']);
      await expect(dialog.getByRole('tab', { name: TEXT_RE.membersTab })).toHaveCount(0);

      const infoItems = infoTab.getByTestId('info-item');
      // 14 = 4 nomination-derived (election/constituency/list/number) + 9 info
      // questions (multipleText restored, see phase 129) + 1 grouped Links
      // item. (The link info question is grouped into the trailing Links item,
      // so 9 info questions still yield 8 standalone info-items + Links.)
      await expect.soft(infoItems).toHaveCount(14, { timeout: TIMEOUTS.element });
      // All info-item label/value assertions use case-insensitive regexes
      // because CSS `text-transform: uppercase` on the `small-label` class
      // does NOT alter `textContent`, but the i18n source strings mix Title
      // Case (e.g., "Election Number", "Choice A") with sentence case (e.g.,
      // "Info: pick multiple categories that apply.") — `/.../i` sidesteps
      // the inconsistency.
      // (0) Election
      await expect.soft(infoItems.nth(0)).toContainText(/Election/i);
      await expect.soft(infoItems.nth(0)).toContainText(/Regional Election/i);
      // (1) Constituency
      await expect.soft(infoItems.nth(1)).toContainText(/Constituency/i);
      await expect.soft(infoItems.nth(1)).toContainText(/Region North/i);
      // (2) List — parent nomination (OR-AA → AL-A)
      await expect.soft(infoItems.nth(2)).toContainText(/List/i);
      // (3) Election number — CA-AA-Special has no electionSymbol → "—"
      await expect.soft(infoItems.nth(3)).toContainText(/Election Number/i);
      await expect.soft(infoItems.nth(3)).toContainText(/—/);
      // (4) multipleChoiceCategorical
      await expect.soft(infoItems.nth(4)).toContainText(/Info: pick multiple categories that apply\./i);
      await expect.soft(infoItems.nth(4)).toContainText(/Choice C/i);
      // (5) singleChoiceCategorical
      await expect.soft(infoItems.nth(5)).toContainText(/Info: pick one category\./i);
      await expect.soft(infoItems.nth(5)).toContainText(/Selection Y/i);
      // (6) text (short bio)
      await expect.soft(infoItems.nth(6)).toContainText(/Info: short biography\./i);
      await expect.soft(infoItems.nth(6)).toContainText(/Default candidate biography text\./i);
      // (7) text-longText
      await expect.soft(infoItems.nth(7)).toContainText(/Info: long biography\./i);
      await expect.soft(infoItems.nth(7)).toContainText(/Default longer biography text/i);
      // (8) number
      await expect.soft(infoItems.nth(8)).toContainText(/Info: years of experience\./i);
      await expect.soft(infoItems.nth(8)).toContainText(/99/);
      // (9) boolean — the only standing check in the suite on the boolean-answer
      // render path (`dataContext.svelte.ts:113` formats it through
      // `t(value ? 'common.answer.yes' : 'common.answer.no')`), so it asserts the
      // RESOLVED string on the VALUE node rather than a regex over the whole item.
      // The previous `toContainText(/Yes/i)` was blind twice over: it matched the
      // raw key `common.answer.yes` that a catalog miss renders (sweep F2), and it
      // matched the label's own "…-yes-no?" text, so it passed even when no value
      // rendered at all.
      await expect.soft(infoItems.nth(9)).toContainText(/Info: would-you-run-again-yes-no\?/i);
      // reason: InfoItem.svelte renders label + value as its two direct children and
      // gives a hook (`.test-label`) only to the label; the value node carries no
      // testid, so excluding the label class is the only way to isolate the resolved
      // answer. Structural and locale-stable — it names no user-facing string.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const booleanValue = infoItems.nth(9).locator('div:not(.test-label)');
      await expect.soft(booleanValue).toHaveText('Yes');
      // (10) date — toLocaleDateString('en', {year,month,day:'numeric'}) on 1980-06-15
      await expect.soft(infoItems.nth(10)).toContainText(/Info: date of birth\./i);
      await expect.soft(infoItems.nth(10)).toContainText(/6\/15\/1980/);
      // (11) multipleText — the restored "keywords" info item (see phase 129
      // round-trip read proof). CA-AA-Special carries the default
      // two-keyword answer; both strings must render on the info tab.
      await expect.soft(infoItems.nth(11)).toContainText(/Info: keywords\./i);
      await expect.soft(infoTab).toContainText(/Campaign keyword alpha/i);
      await expect.soft(infoTab).toContainText(/Campaign keyword beta/i);
      // The north-only filtered question + grouped Links item follow (matched
      // by text / .last() below, so no positional reindex is needed).
      // (last) Links — single grouped item containing the personal-link tag
      await expect.soft(infoItems.last()).toContainText(/Links/i);

      // Candidate-details info-tab visibility for the 3 filtered info
      // questions. Voter is scoped to CO-Reg-N + CO-Mun-NE per the
      // voter-journey fixture's first-option pick; CA-AA-Special's primary
      // nomination is in CO-Reg-N. Therefore the north-only filtered info
      // question MUST be visible, and the municipal-only + south-only variants
      // MUST be absent.
      await expect.soft(infoTab).toContainText(/\[qu-info-filt-co-reg-n\]/i);
      await expect.soft(infoTab).not.toContainText(/\[qu-info-filt-mun-only\]/i);
      await expect.soft(infoTab).not.toContainText(/\[qu-info-filt-co-reg-s\]/i);

      // Switch to opinionsTab.
      await dialog.getByRole('tab', { name: TEXT_RE.opinionsTab }).click();
      const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
      await expect.soft(opinionsTab).toBeVisible({ timeout: TIMEOUTS.page });

      // Wait for at least one opinion-question-input to render.
      await opinionsTab
        .getByTestId('opinion-question-input')
        .first()
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });

      // 4-case voter-vs-entity comparison (agree/disagree/voter-missing/entity-missing).
      // The four expectQuestionDisplay calls below ARE the confirmed-covered
      // matrix — re-confirmed here with NO behaviour change (see phase 121
      // scope_fence: is confirmed-covered, this comment makes the
      // evidence greppable for the decision-coverage + verification gates).
      //
      // Voter-vs-entity matrix arrangement (e2e/base.ts CA-AA-Special answers
      // lines 869-879, cross-referenced with the voter's answering flow above):
      //   (a) both answered    → Base opinion 1  (voter+entity at polar max)
      //   (b) voter only       → Base opinion 2  (entity skipped)
      //   (c) entity only      → Opt-A opinion 1 (voter skipped Opt-A category)
      //   (d) both missing     → Opt-B opinion 1 (voter de-selected Opt-B,
      //                          entity has no answer)
      // Uses entityDetails.expectQuestionDisplay — its hasText-based filter is
      // robust against the [<id>] prefix on heading text (a heading-role
      // filter would NOT match the prefixed heading shape).
      await entityDetails.expectQuestionDisplay(/Base opinion 1 — Likert 5/i, {
        numSelected: 2
      });
      await entityDetails.expectQuestionDisplay(/Base opinion 2 — Likert 4/i, {
        numSelected: 1,
        infoText: /hasn['‘’]?t answered/i
      });
      await entityDetails.expectQuestionDisplay(/Opt-A opinion 1 — Likert 5/i, {
        numSelected: 1,
        infoText: /You haven['‘’]?t answered/i
      });
      await entityDetails.expectQuestionDisplay(/Opt-B opinion 1 — Likert 5/i, {
        numSelected: 0,
        infoText: TEXT_RE.neitherAnswered
      });

      // new-type drawer displays (129). CA-AA-Special
      // answered base-6 number=10 and base-7 multi-choice=['a','b'] (case (a),
      // both answered, base.ts:999-1000); the max-walk voter answered number 10
      // (slider End) and multi-choice a,b (first-2 checkboxes). So:
      //   - multi-choice: voter 2 checked + entity 2 markers (mutual agreement).
      //   - number: voter 10 === entity 10 → a SINGLE combined dual-marker.
      // Consumes the plan-130-01 extensions: expectQuestionDisplay checkbox
      // counting + expectNumberQuestionDisplay number dual-marker. HARD (no soft).
      await entityDetails.expectQuestionDisplay(TEXT_RE.baseOpinion7MultiChoice, {
        voterSelectedCount: 2,
        entitySelectedCount: 2
      });
      await entityDetails.expectNumberQuestionDisplay(TEXT_RE.baseOpinion6Number, {
        voterValue: 10,
        entityValue: 10
      });

      // Close drawer for the next step.
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden({ timeout: TIMEOUTS.page });
    });

    // ====================================================================
    // PARTY DRAWER + FILTERS
    // ====================================================================

    await test.step('organisation details show tabs, info-items, 5 members, and org-typed missing markers', async () => {
      // Switch to parties tab and open Party AA's drawer.
      await resultsPage.selectEntityTab('orgs');
      await resultsPage.openEntityDetailsForCard(/\[or-aa\] Party AA/i);

      // organization tab control. `entityDetails.contents.organization`
      // is ['info','children','opinions'] (e2e/base.ts:148), so the org drawer
      // exposes EXACTLY [info, children, opinions] — and CRUCIALLY it INCLUDES
      // the 'children'/Members tab that the candidate drawer (above) does NOT.
      // This per-type contrast (candidate=[info,opinions] vs org=[info,children,
      // opinions]) is the organization slice. `expectTabs` hard-asserts
      // exact count+order+accessible-name; the explicit Members-PRESENT check
      // pins the contrast with the candidate Members-ABSENT assertion above.
      const orgDialog = page.getByRole('dialog');
      await entityDetails.expectTabs(['info', 'children', 'opinions']);
      await expect(orgDialog.getByRole('tab', { name: TEXT_RE.membersTab })).toHaveCount(1);

      // Info tab: 3 info-items via regex match (the [<id>] prefix means
      // exact-equality fails; substring/regex works). The fixture's
      // expectInfoItem accepts regex.
      await entityDetails.selectTab('info');
      await entityDetails.expectInfoItem(/Election/i, /Regional Election/i);
      await entityDetails.expectInfoItem(/Constituency/i, /\[co-reg-n\]/i);
      await entityDetails.expectInfoItem(/Alliance/i, /Alliance A/i);

      // (org slice) — `showMissingElectionSymbol.organization` is FALSE
      // (e2e/base.ts:153) and the org nominations carry NO election_symbol
      // (e2e/base.ts:1287-1325). Per EntityInfo.svelte:95 the election-symbol
      // row renders ONLY when `electionSymbol || showMissingElectionSymbol[type]`
      // — so for an org with neither, the "Election Number" row is ABSENT.
      // Asserting the row's ABSENCE (rather than a "—" placeholder) is the
      // ADDITIVE/assert-only reading of the org-typed `showMissingElectionSymbol`
      // contract under the base settings (zero seed change). HARD assertion.
      await expect(entityDetails.getInfoItems().filter({ hasText: /Election Number|Election Symbol/i })).toHaveCount(0);

      // Members tab (SETTINGS keyword: 'children') — 5 visible Party-AA
      // members after the CA-AA-Hidden filter.
      await entityDetails.selectTab('children');
      await expect.soft(entityDetails.getMemberCards()).toHaveCount(5, { timeout: TIMEOUTS.page });

      // (org slice, opinions) — `showMissingAnswers.organization` is
      // TRUE (e2e/base.ts:157) and Party AA (like every org in base) has NO
      // opinion answers, so EVERY opinion question on the org opinions tab
      // renders an org-typed missing-answer marker (EntityOpinions.svelte:62-72):
      //   - voter ANSWERED + org missing  → "AA hasn't answered" (numSelected:1)
      //   - voter SKIPPED  + org missing  → "Neither has answered" (numSelected:0)
      // The voter (max walk above) ANSWERED Base opinion 1 and SKIPPED Opt-A
      // opinion 1 (Opt-A category skipped at line ~666). HARD assertions via the
      // entityDetails fixture (no soft).
      await entityDetails.selectTab('opinions');
      await orgDialog
        .getByTestId('opinion-question-input')
        .first()
        .waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
      await entityDetails.expectQuestionDisplay(/Base opinion 1 — Likert 5/i, {
        numSelected: 1,
        infoText: /hasn['‘’]?t answered/i
      });
      await entityDetails.expectQuestionDisplay(/Opt-A opinion 1 — Likert 5/i, {
        numSelected: 0,
        infoText: TEXT_RE.neitherAnswered
      });

      // Close drawer for the next step.
      const dialog = page.getByRole('dialog');
      await page.keyboard.press('Escape');
      await expect.soft(dialog).toBeHidden({ timeout: TIMEOUTS.page });
    });

    // ====================================================================
    // FILTERS: TEXT + DIALOG.
    // Two fixture-driven cells with HARD assertions on the base counts
    // (13 / 2 / 1 / 12 / 1 / 0).
    // ====================================================================

    await test.step('text filter narrows the result list and clears', async () => {
      // Defensive cleanup — earlier steps may have left dialogs open.
      await page.keyboard.press('Escape').catch(() => null);
      await dismissLeftoverDialogsBestEffort(page);

      await resultsPage.selectEntityTab('cands');
      const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
      await expect.soft(candidateSection).toBeVisible({ timeout: TIMEOUTS.slowPage });

      await entityFilters.setTextFilter('polar');
      const cards = resultsPage.getEntityCards();
      await expect.soft(cards).toHaveCount(2, { timeout: TIMEOUTS.page });
      // first_name in base is NOT bracket-prefixed (only name display fields
      // got the [<id>] prefix — first/last names stayed raw).
      await expect.soft(cards.nth(0)).toContainText(TEXT_RE.polarMax);
      await expect.soft(cards.nth(1)).toContainText(TEXT_RE.polarMin);

      await entityFilters.clearTextFilter();
    });

    await test.step('filter dialog applies and resets Party, pick-multiple, and numeric filters', async () => {
      // Pre-conditions: already on candidates tab from the prior step.
      // STAGE 1 — open dialog, assert exactly 3 filter rows.
      // With filterable: false on test-qu-info-boolean, 3 rows are expected:
      // Party + pick-multiple + years-of-experience.
      const d1 = await entityFilters.openFilterDialog();
      await expect.soft(d1.getFilters()).toHaveCount(3, { timeout: TIMEOUTS.page });

      // STAGE 2 — Party filter: 'No answer' option visible with count badge text containing '1'
      // (1 candidate without parent_nomination → test-ca-independent).
      const partyFilter = await d1.getFilter(/Party/i);
      const noAnswerOption = await partyFilter.getOption(/No answer/i);
      await expect.soft(noAnswerOption).toBeVisible();
      await expect.soft(noAnswerOption).toContainText(/1/);

      // STAGE 3 — select No-answer → close → 1 card 'Free Independent' + badge=1.
      await partyFilter.setSelection([/No answer/i]);
      await d1.close();
      const cards = resultsPage.getEntityCards();
      await expect.soft(cards).toHaveCount(1, { timeout: TIMEOUTS.page });
      await expect.soft(cards.first()).toContainText(/Free Independent/i);
      await expect.soft(entityFilters.getFilterButtonBadge()).toContainText(/1/);

      // STAGE 4 — reopen, reset → 13 cards + badge empty.
      // (reset() at EntityListControls.svelte:96-100 closes the dialog as
      // a side-effect; no separate close() call needed.)
      const d2 = await entityFilters.openFilterDialog();
      await d2.reset();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(13, { timeout: TIMEOUTS.page });

      // STAGE 5a — pick-multiple: select A|B → 12 visible, CA-AA-Special excluded.
      const d3 = await entityFilters.openFilterDialog();
      const mcFilter = await d3.getFilter(
        /pick multiple|multipleChoiceCategorical|\[qu-info-multipleChoiceCategorical\]/i
      );
      await mcFilter.setSelection([/Choice A/i, /Choice B/i]);
      await d3.close();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(12, { timeout: TIMEOUTS.page });
      await expect.soft(resultsPage.getEntityCards().filter({ hasText: TEXT_RE.specialCandidate })).toHaveCount(0);

      // STAGE 5b — reset (intermediate clean state). reset() closes the
      // dialog as a side-effect; no separate close() call needed.
      const d4 = await entityFilters.openFilterDialog();
      await d4.reset();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(13, { timeout: TIMEOUTS.page });

      // STAGE 5c-d — years≥50 → 1 visible (CA-AA-Special, years=99).
      const d5 = await entityFilters.openFilterDialog();
      const numFilter = await d5.getFilter(/years of experience|\[qu-info-number\]/i);
      await numFilter.setNumberRange(50, null);
      await d5.close();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(1, { timeout: TIMEOUTS.page });
      await expect.soft(resultsPage.getEntityCards().first()).toContainText(TEXT_RE.specialCandidate);

      // STAGE 6 — intersect: years≥50 AND pick-multiple=A|B → 0 visible
      // (CA-AA-Special is the only years≥50 candidate, and it has ['c']
      // for pick-multiple → does NOT intersect with {A, B}).
      const d6 = await entityFilters.openFilterDialog();
      const mc2 = await d6.getFilter(/pick multiple|multipleChoiceCategorical|\[qu-info-multipleChoiceCategorical\]/i);
      await mc2.setSelection([/Choice A/i, /Choice B/i]);
      await d6.close();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(0, { timeout: TIMEOUTS.page });

      // STAGE 7 — cleanup: reset all filters. reset() closes the dialog
      // as a side-effect; no separate close() call needed.
      const d7 = await entityFilters.openFilterDialog();
      await d7.reset();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(13, { timeout: TIMEOUTS.page });
    });

    // ====================================================================
    // categorical select-all/none + text×filter intersection + reset
    //
    // Three net-new cells on TOP of the existing per-filter coverage above.
    // Derived facts (e2e/base, confirmed at build by reading the rendered
    // dialog):
    //   - Party filter has 6 options (AA, AB, BA, BB, C, "No answer") → > 3 →
    //     the single select-all/none flip-toggle RENDERS on it
    //     (EnumeratedEntityFilter `{#if values.length > 3}`,
    //     entityFilters.fixture.ts:108-116). The pick-multiple filter has only
    //     3 options → the toggle is ABSENT there.
    //   - Text 'polar' narrows the candidate list to exactly 2 (Polar-Max BB
    //     One in Party BB, Polar-Min BA One in Party BA). Intersecting with
    //     Party=BB leaves exactly 1 (Polar-Max) — strictly narrower than either
    //     constraint alone (text=2, BB-party=2). [base.ts:1004-1033]
    // ====================================================================
    await test.step('EFLOW-01: select-all/none control, text×filter intersection, reset restores full list', async () => {
      // (1) SELECT-ALL / SELECT-NONE on the >3-option Party filter.
      const dSel = await entityFilters.openFilterDialog();
      const partySel = await dSel.getFilter(/Party/i);
      // The select-all/none flip-toggle renders only for > 3 options.
      await expect.soft(partySel.getSelectAllToggle()).toBeVisible({ timeout: TIMEOUTS.element });
      await partySel.selectAll(); // hard-asserts isAllSelected() === true post-state
      // All parties selected → the full candidate list shows (every candidate
      // belongs to one of the selected parties or matches "No answer").
      await dSel.close();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(13, { timeout: TIMEOUTS.page });
      // Reopen and select NONE → zero cards (no party matches).
      const dNone = await entityFilters.openFilterDialog();
      const partyNone = await dNone.getFilter(/Party/i);
      await partyNone.selectNone(); // hard-asserts no option checked post-state
      await dNone.close();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(0, { timeout: TIMEOUTS.page });
      // The select-all/none toggle is ABSENT on the ≤3-option pick-multiple
      // filter (threshold > 3) — assert it does not render there.
      const dAbsent = await entityFilters.openFilterDialog();
      const mcAbsent = await dAbsent.getFilter(
        /pick multiple|multipleChoiceCategorical|\[qu-info-multipleChoiceCategorical\]/i
      );
      await expect.soft(mcAbsent.getSelectAllToggle()).toHaveCount(0);
      await dAbsent.reset();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(13, { timeout: TIMEOUTS.page });

      // (2) TEXT × DIALOG-FILTER INTERSECTION. text 'polar' (2 cards) ∩
      // Party=BB → exactly 1 (Polar-Max BB One) — narrower than either alone.
      await entityFilters.setTextFilter('polar');
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(2, { timeout: TIMEOUTS.page });
      const dInt = await entityFilters.openFilterDialog();
      const partyInt = await dInt.getFilter(/Party/i);
      await partyInt.setSelection([/^BB/i]);
      await dInt.close();
      const intersect = resultsPage.getEntityCards();
      await expect.soft(intersect).toHaveCount(1, { timeout: TIMEOUTS.page });
      await expect.soft(intersect.first()).toContainText(TEXT_RE.polarMax);

      // (3) RESET restores the full 13-card list. Clear text AND reset the
      // dialog filter; the full list returns.
      await entityFilters.clearTextFilter();
      const dReset = await entityFilters.openFilterDialog();
      await dReset.reset();
      await expect.soft(resultsPage.getEntityCards()).toHaveCount(13, { timeout: TIMEOUTS.page });
    });

    // ====================================================================
    // FEEDBACK DIALOG
    // ====================================================================

    await test.step('feedback dialog opens, persists state across cancel, and sends', async () => {
      const feedbackDialog = createFeedbackDialog(page);
      // Isolate this page's feedback POSTs into their own rate-limit bucket so
      // the two genuine submits below can't be rejected by the 5/5min/IP budget
      // shared across every feedback-submitting spec + retries (see
      // isolateFeedbackRateLimit).
      await isolateFeedbackRateLimit(page);

      // The voter nav drawer must be opened explicitly. The openMenu button
      // lives on Header.svelte:82-93. The open-menu toggle carries a
      // locale-independent `nav-menu-toggle` testid
      // (testIds.shared.navigation.menuToggle), used instead of the EN-only
      // `/open menu/i` accessible-name regex.
      //
      // feedbackNavItem is scoped to the open menuDrawer (page-rooted lookup
      // raced against the cycle-close vs. cycle-open transition). A drawer
      // open-state waitFor is inserted before each menu-item click. menuDrawer
      // is anchored on the `<nav data-testid="nav-menu">` element rendered by
      // Navigation.svelte:56-62 (the daisyUI drawer reveals it via CSS when
      // the drawer-toggle checkbox flips to checked).
      const menuToggle = page.getByTestId(testIds.shared.navigation.menuToggle);
      const menuDrawer = page.getByTestId(testIds.shared.navigation.menu);
      const feedbackNavItem = menuDrawer
        .getByTestId(testIds.shared.navigation.menuItem)
        .filter({ hasText: /feedback/i });

      // ---- Cycle 1: rating + comment, cancel preserves state. -----------
      await menuToggle.click();
      await menuDrawer.waitFor({ state: 'visible' });
      await feedbackNavItem.click();
      await feedbackDialog.expectVisible();
      await feedbackDialog.expectSendDisabled();
      await feedbackDialog.setRating(3);
      await feedbackDialog.expectSendEnabled();
      await feedbackDialog.setComment('test feedback');
      await feedbackDialog.cancel();
      await feedbackDialog.expectHidden();
      // Wait for the drawer to fully close before re-opening on cycle 2 —
      // eliminates the close-transition race.
      await menuDrawer.waitFor({ state: 'hidden' });

      // ---- Cycle 2: reopen, expect preserved state, submit. -------------
      await menuToggle.click();
      await menuDrawer.waitFor({ state: 'visible' });
      await feedbackNavItem.click();
      await feedbackDialog.expectVisible();
      await feedbackDialog.expectRatingValue(3);
      await feedbackDialog.expectCommentValue('test feedback');
      await feedbackDialog.submit();
      await feedbackDialog.expectSuccess();
      // FeedbackModal CLOSE_DELAY=1500ms post-onSent triggers reset() and
      // closes the modal; wait for the form testid to leave the DOM before
      // re-opening.
      await feedbackDialog.expectHidden();
      await menuDrawer.waitFor({ state: 'hidden' });

      // ---- Cycle 3: reopen post-send → state cleared by reset(). --------
      await menuToggle.click();
      await menuDrawer.waitFor({ state: 'visible' });
      await feedbackNavItem.click();
      await feedbackDialog.expectVisible();
      await feedbackDialog.expectRatingValue(null);
      await feedbackDialog.expectCommentValue('');
      // Text-only feedback (no rating) — submit enabled on description alone.
      await feedbackDialog.setComment('text-only feedback');
      await feedbackDialog.expectSendEnabled();
      await feedbackDialog.submit();
      await feedbackDialog.expectSuccess();
      await feedbackDialog.expectHidden();
    });

    // Voter nominations coverage was moved OUT of this journey test. The former
    // commented-out nominations step (SKIPPED for the since-fixed 2026-05-31
    // fetch-all-questions bug) is superseded by the dedicated
    // tests/tests/specs/voter/voter-nominations.spec.ts (per).
  });
});

// ====================================================================
// NUMBER-SCALE BOUNDARY MATCHING (dedicated test)
//
// Runs under the SAME voter-journey Playwright project (its exact
// testMatch /voter-journey\.spec\.ts/ picks this file up). fullyParallel is
// false, so this describe runs SERIALLY AFTER the journey test — no
// serial-mode coupling with the journey describe is needed. Proves the number
// dimension incorporates into matching at the MIN extreme and at a MID value,
// asserted against the POLAR seed candidates (boundary + precision
// backstop).
// ====================================================================

test.describe('EQTYP-02: number-scale boundary matching', () => {
  test('all-min ranks POLAR_MIN above POLAR_MAX; a mid number answer shifts both scores monotonically without flipping the ordering', async ({
    page,
    resultsPage
  }) => {
    test.setTimeout(JOURNEY_TEST_MAX); // reason: reuses the full located walk — same 120s ceiling as the journey test.

    let minScoreBefore = 0;
    let maxScoreBefore = 0;

    await test.step('all-min walk: POLAR_MIN ranks first and scores above the POLAR_MAX-named candidate', async () => {
      await walkUntilQuestionsIntro(page);
      await answerAndAdvanceToResults(page, 'min');
      // Force the REGIONAL election deterministically. answerAndAdvanceToResults
      // lands on whichever election its `options.first()` pick resolves to (which
      // is not deterministic between EL-Reg/EL-Mun); POLAR_MIN + the POLAR_MAX
      // candidate both live in the Regional election's CO-Reg-N constituency
      // (13 cards), so pin Regional here to match step 2's return-selection.
      await expectElectionOptionAndSelect({ page, text: TEXT_RE.regional });
      await resultsPage.selectEntityTab('cands');
      const cards = resultsPage.getEntityCards();
      await expect(cards.first()).toBeVisible({ timeout: TIMEOUTS.slowPage });
      // ORDERING assertion (NOT a first-position or 100% claim). The walk's
      // multi-choice answer is ['a','b'] in BOTH modes (it always clicks the
      // first 2 checkboxes), so the "all-min" voter actually AGREES with
      // POLAR_MAX and DISAGREES with POLAR_MIN (['c','d'], base.ts:338) on the
      // multi-choice dimension. POLAR_MIN is therefore penalized on multi-choice
      // and is NOT first — a candidate whose multi-choice overlaps ['a','b'] can
      // out-rank it. But POLAR_MIN still matches the voter on every ORDINAL
      // dimension (likert/categorical/boolean/number all at min) while POLAR_MAX
      // is maximally distant on all of them, so score(POLAR_MIN) > score(POLAR_MAX)
      // holds. That ordering — and its monotonic shift under the number re-answer
      // below — is the boundary proof.
      const polarMinCard = cards.filter({ hasText: TEXT_RE.polarMin }).first();
      const polarMaxCard = cards.filter({ hasText: TEXT_RE.polarMax }).first();
      minScoreBefore = await readCardMatchScore(polarMinCard);
      maxScoreBefore = await readCardMatchScore(polarMaxCard);
      expect(minScoreBefore).toBeGreaterThan(maxScoreBefore);
    });

    await test.step('re-answer ONLY the number question to mid (5): POLAR_MIN score drops, POLAR_MAX rises, ordering preserved', async () => {
      // Back into the question flow via the in-app menu (CLIENT-SIDE — preserves
      // the in-memory election scope), skip forward to the Base-6 slider (answers
      // persist, so Next stays available), change ONLY the number answer to the
      // mid of 0..10, click Next, then return to the located results list.
      await goToLocatedQuestionsViaMenu(page);
      await advanceToNumberSlider(page);
      await answerNumberScale(page, 5);
      const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
      await expect(nextButton).toBeVisible({ timeout: TIMEOUTS.element });
      await nextButton.click();

      await returnToLocatedResultsViaMenu(page);
      await resultsPage.selectEntityTab('cands');
      const cards = resultsPage.getEntityCards();
      const polarMinCard = cards.filter({ hasText: TEXT_RE.polarMin }).first();
      const polarMaxCard = cards.filter({ hasText: TEXT_RE.polarMax }).first();
      const minScoreAfter = await readCardMatchScore(polarMinCard);
      const maxScoreAfter = await readCardMatchScore(polarMaxCard);
      // Value-proportional distance: POLAR_MIN (number 0) moves FURTHER from the
      // voter (0→5) so its score DROPS; POLAR_MAX (number 10) moves CLOSER so its
      // score RISES. The preserved ordering is the precision backstop — no
      // slider-step rounding artifact flips the POLAR_MIN/POLAR_MAX order.
      expect(minScoreAfter).toBeLessThan(minScoreBefore);
      expect(maxScoreAfter).toBeGreaterThan(maxScoreBefore);
      expect(minScoreAfter).toBeGreaterThan(maxScoreAfter);
    });
  });
});
