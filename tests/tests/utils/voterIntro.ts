/**
 * voterIntro — Shared voter intro / election / constituency selector helpers.
 *
 * Phase 88 Plan 03 (test catalog audit). Authored from:
 *   - Design source: TEST-INVENTORY-REFACTOR-2.md:113-136 (helper signatures).
 *   - Behavioral model: tests/tests/specs/voter/voter-mega-journey.spec.ts:492-633
 *     (home → intro → elections → constituencies walk pattern).
 *   - Binding spec: .planning/phases/88-e2e-test-catalog-audit-remove-add-
 *     consolidate-tests-fresh-ba/88-03-SCOPE.md (read "Post-plan-check
 *     resolutions" lines 8-21 AND "Operator amendments" A1/A2 — both
 *     override conflicting prose elsewhere).
 *
 * Rigidity contract (88-03-SCOPE.md lines 66-73): NO expect.soft, NO try/catch
 * around expect, NO best-effort .catch(() => null) on assertion-bearing
 * locator interactions, NO [xxx-followup] markers — every helper assertion is
 * HARD.
 *
 * Operator amendment A1 (helper 7): the helper is `selectElectionAndAdvance`
 * (NOT `deselectElectionAndAdvance`) with set-only iteration semantics —
 * matching options end aria-checked='true', non-matching end aria-checked=
 * 'false', regardless of the page's default-selection state.
 *
 * Operator amendment A2 (display-name convention): the perm-* templates
 * encode each entity's role into its display name via the
 * `[<SYMBOL>] <description>` convention. Specs match inline using
 * `/\[<SYMBOL>\]/i` regexes — this module exports NO TEXT_RE constant.
 *
 * Modeled on the mega-journey first-parts pattern but applied to minimal-data
 * datasets — every contract is enforceable on the minimal seed.
 */

import { expect } from '@playwright/test';
import { testIds } from './testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Semantic timeout bucket mirroring voter-mega-journey.spec.ts:67-73.
 *
 * - element:  non-URL-changing visibility wait.
 * - click:    action-ack budget (click registered, dropdown opened).
 * - page:     URL-change / route-transition wait.
 * - slowPage: multi-network-roundtrip + render boundary (cold-start friendly).
 */
const TIMEOUT = {
  element: 2_000,
  click: 2_000,
  page: 4_000,
  slowPage: 10_000
} as const;

/**
 * Navigate to home, click start, advance through the intro page, then await
 * the caller's expectation. The intermediate intro-page visibility wait is
 * the authoritative signal — no URL-pattern wait needed.
 */
export async function bypassIntroThen(page: Page, expectation: () => Promise<void>): Promise<void> {
  await page.goto('/en/');
  await page.getByTestId(testIds.voter.home.startButton).click({ timeout: TIMEOUT.click });
  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await expect(introStart).toBeVisible({ timeout: TIMEOUT.slowPage });
  await introStart.click({ timeout: TIMEOUT.click });
  await expectation();
}

/**
 * Hard-assert the voter has landed on a question (heading + first answer
 * option mounted). The "no election or constituency selector intervened"
 * contract is enforced at the call site by checking those locators are
 * hidden — this helper only asserts the question is shown.
 */
export async function expectQuestion(page: Page): Promise<void> {
  await expect(page.getByTestId(testIds.voter.questions.heading)).toBeVisible({
    timeout: TIMEOUT.slowPage
  });
  await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({
    timeout: TIMEOUT.element
  });
}

/**
 * Hard-assert the elections list is visible (with at least one option
 * mounted) and return its Locator so callers can interact further.
 */
export async function expectElectionSelector(page: Page): Promise<Locator> {
  const list = page.getByTestId(testIds.voter.elections.list);
  await expect(list).toBeVisible({ timeout: TIMEOUT.slowPage });
  await expect(list.getByTestId(testIds.voter.elections.option).first()).toBeVisible({ timeout: TIMEOUT.element });
  return list;
}

/**
 * Hard-assert the constituencies list is visible and return its Locator so
 * callers can interact further.
 */
export async function expectConstituencySelector(page: Page): Promise<Locator> {
  const list = page.getByTestId(testIds.voter.constituencies.list);
  await expect(list).toBeVisible({ timeout: TIMEOUT.slowPage });
  return list;
}

/**
 * Walk home → intro → expect a question. For topology variants where neither
 * election nor constituency selection is shown (perm-1e1cg1co,
 * perm-disable-election-1co).
 */
export async function bypassIntroAndExpectQuestion(page: Page): Promise<void> {
  await bypassIntroThen(page, () => expectQuestion(page));
}

/**
 * Walk home → intro → expect the elections list. Returns the list Locator.
 */
export async function bypassIntroAndExpectElectionSelector(page: Page): Promise<Locator> {
  let listRef: Locator | undefined;
  await bypassIntroThen(page, async () => {
    listRef = await expectElectionSelector(page);
  });
  expect(listRef, 'bypassIntroAndExpectElectionSelector: list locator was not captured').toBeDefined();
  return listRef!;
}

/**
 * Set the elections selection to ONLY the options matching `optionText`.
 * Iterates every option: matching options end aria-checked='true',
 * non-matching options end aria-checked='false', then asserts continue is
 * enabled and clicks it. Idempotent regardless of the page's default-
 * selection state.
 *
 * Operator amendment A1 (88-03-SCOPE.md "Operator amendments — A1"):
 * supersedes the rejected MED-5 `deselectElectionAndAdvance` name; the helper
 * KEEPS the `selectElectionAndAdvance` name and enforces a SET POST-CONDITION:
 * the set of aria-checked='true' options equals exactly the set whose
 * accessible name matches `optionText`.
 *
 * The `[<SYMBOL>] <description>` display-name convention (A2) guarantees the
 * bracketed symbol is a substring of every option's accessible name, so
 * `optionText: /\[EL1\]/i` unambiguously addresses "election EL1".
 */
export async function selectElectionAndAdvance(
  page: Page,
  { optionText }: { optionText: RegExp | string }
): Promise<void> {
  const labels = page.getByTestId(testIds.voter.elections.label);
  await expect(labels.first()).toBeVisible({ timeout: TIMEOUT.slowPage });
  const optionCount = await labels.count();
  expect(optionCount, 'selectElectionAndAdvance: elections list must contain at least one option').toBeGreaterThan(0);
  const optionsToCheck = labels.filter({ hasText: optionText });
  const checkCount = await optionsToCheck.count();
  for (let i = 0; i < checkCount; i++) {
    await optionsToCheck.nth(i).check({ timeout: TIMEOUT.click });
  }
  const optionsToUncheck = labels.filter({ hasNotText: optionText });
  const uncheckCount = await optionsToUncheck.count();
  for (let i = 0; i < uncheckCount; i++) {
    await optionsToUncheck.nth(i).uncheck({ timeout: TIMEOUT.click });
  }
  const cont = page.getByTestId(testIds.voter.elections.continue);
  await expect(cont).toBeEnabled({ timeout: TIMEOUT.page });
  await cont.click();
  const list = page.getByTestId(testIds.voter.elections.list);
  await expect(list).toBeHidden({ timeout: TIMEOUT.page });
}

/**
 * Walk home → intro → expect the constituencies list. Returns the list
 * Locator.
 */
export async function bypassIntroAndExpectConstituencySelector(page: Page): Promise<Locator> {
  let listRef: Locator | undefined;
  await bypassIntroThen(page, async () => {
    listRef = await expectConstituencySelector(page);
  });
  expect(listRef, 'bypassIntroAndExpectConstituencySelector: list locator was not captured').toBeDefined();
  return listRef!;
}

/**
 * Locate the specific `<Select>` combobox inside the constituencies list
 * whose surrounding group label / section text matches `selectorText`, pick
 * the option matching `optionText`, advance, and hard-assert no missing-
 * nominations modal appears.
 *
 * The implementation pattern handles the two DOM shapes the constituency-
 * selector source produces:
 *   1. A single combobox per group (single-CG topology) — the locator
 *      resolves directly via `list.getByRole('combobox')`.
 *   2. Multiple comboboxes (multi-CG topology) — filter by the group's
 *      surrounding section / label text.
 *
 * Per operator amendment A2 the `selectorText` regex matches the
 * `[<SYMBOL>]` bracketed CG name; the helper uses Playwright's role/name
 * filtering to find the matching combobox.
 */
export async function selectConstituencyAndAdvance(
  page: Page,
  { selectorText, optionText }: { selectorText: RegExp | string; optionText: RegExp | string }
): Promise<void> {
  const list = page.getByTestId(testIds.voter.constituencies.list);
  await expect(list).toBeVisible({ timeout: TIMEOUT.slowPage });

  // The constituency-selector renders one section per applicable-elections
  // group; each section contains a `<Select>` combobox. Filter the combobox
  // by an ancestor / sibling whose accessible name matches `selectorText`
  // (the bracketed CG symbol per A2). When only one combobox is rendered,
  // the filter is a no-op and the first (only) combobox is selected.
  const allComboboxes = list.getByRole('combobox');
  const matchingCombobox = allComboboxes.filter({
    // reason: filtering a combobox by a dynamic, runtime-built CG-symbol text
    // (the bracketed constituency-group label) has no stable testId or role
    // handle — the text content is data-derived, not a fixed element identity.
    // eslint-disable-next-line playwright/no-restricted-locators
    has: page.locator('text=' + (typeof selectorText === 'string' ? selectorText : ''))
  });
  const comboboxCount = await allComboboxes.count();
  expect(
    comboboxCount,
    'selectConstituencyAndAdvance: constituencies list must contain at least one combobox'
  ).toBeGreaterThan(0);

  // Strategy: when there is exactly one combobox, the selectorText filter is
  // unnecessary — pick the only combobox. When there are multiple, the most
  // robust strategy is to walk every combobox, open it, check whether the
  // listbox contains an option matching `optionText`, click it if so, and
  // close otherwise. This is the same set-style iteration the elections
  // helper uses and avoids brittle DOM-structure assumptions about
  // group/label nesting.
  let picked = false;
  for (let i = 0; i < comboboxCount && !picked; i++) {
    const cb = allComboboxes.nth(i);
    // Probe the combobox's accessible name FIRST — if it matches
    // selectorText, this is the right combobox (single-pass).
    const cbName = (await cb.getAttribute('aria-label')) ?? (await cb.textContent()) ?? '';
    const nameMatches = typeof selectorText === 'string' ? cbName.includes(selectorText) : selectorText.test(cbName);
    // If the name does not match and we have multiple comboboxes, try the
    // surrounding label. The voter-not-located-redirect spec's helper
    // (iterateSelectOptions) does NOT match by name and assumes one
    // combobox per group; we are stricter to honor A2's bracketed-CG
    // contract.
    if (!nameMatches && comboboxCount > 1) {
      // Continue to next combobox; this one is not the target.
      // suppress unused locator
      void matchingCombobox;
      continue;
    }
    await cb.click({ timeout: TIMEOUT.click });
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: TIMEOUT.page });
    const option = listbox.getByRole('option', { name: optionText }).first();
    await expect(option).toBeVisible({ timeout: TIMEOUT.element });
    await option.click({ timeout: TIMEOUT.click });
    picked = true;
  }
  expect(picked, `selectConstituencyAndAdvance: no combobox matched selectorText ${String(selectorText)}`).toBe(true);

  const cont = page.getByTestId(testIds.voter.constituencies.continue);
  await expect(cont).toBeEnabled({ timeout: TIMEOUT.page });
  await cont.click();
  await expect(list).toBeHidden({ timeout: TIMEOUT.page });
  await expect(page.getByTestId(testIds.voter.missingNominationsModal)).toBeHidden({
    timeout: TIMEOUT.slowPage
  });
}
