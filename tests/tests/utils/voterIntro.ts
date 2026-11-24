/**
 * voterIntro — Shared voter intro / election / constituency selector helpers.
 *
 * Behavioral model mirrors the voter-journey home → intro → elections → constituencies walk pattern, applied to minimal-data datasets so every contract is enforceable on the minimal seed.
 *
 * Rigidity contract: NO expect.soft, NO try/catch around expect, NO best-effort .catch(() => null) on assertion-bearing locator interactions, NO [xxx-followup] markers — every helper assertion is HARD.
 *
 * Rigidity carve-out (DEF-133-01): `bypassIntroThen` advances via `clickAndRaceSettle`, which internally swallows the click's actionability timeout. This does NOT weaken the contract — the clicks in question are NAVIGATION clicks, not assertion-bearing interactions, and every one of them is immediately followed by a HARD landing assertion (the intro CTA `toBeVisible`, then the caller's `expectation()`). The swallow moves the failure signal from "the click did not ack in 2 s" to "the flow did not land" — strictly more meaningful. See `bypassIntroThen`'s docblock for the measured justification.
 *
 * Helper `selectElectionAndAdvance` has set-only iteration semantics — matching options end aria-checked='true', non-matching end aria-checked='false', regardless of the page's default-selection state.
 *
 * Display-name convention: the perm-* templates encode each entity's role into its display name via the `[<SYMBOL>] <description>` convention. Specs match inline using `/\[<SYMBOL>\]/i` regexes — this module exports NO TEXT_RE constant.
 */

import { expect } from '@playwright/test';
import { testIds } from './testIds';
import { clickAndRaceSettle, TIMEOUTS } from '../helpers';
import type { Locator, Page } from '@playwright/test';

/**
 * Navigate to home, click start, advance through the intro page, then await the caller's expectation. The intermediate intro-page visibility wait is the authoritative signal — no URL-pattern wait needed.
 *
 * DEF-133-01: both clicks here are the FIRST interaction with a freshly-hydrating page, so their cost is a *render-settle* boundary, not an
 * *action-ack* boundary. A raw `.click({ timeout: TIMEOUTS.click })` therefore spends the 2 s action-ack budget on Playwright's actionability re-check while the main thread is still saturated by hydration — and that cost scales linearly with contention. Measured on the intro CTA (CDP CPU throttling, all other factors held constant):
 *
 *   throttle   1x     4x     8x    12x    20x    40x    60x    80x click    ~55ms  ~138  ~290   ~420   ~690  ~1800  ~2400  >2000 (4/4 timeouts)
 *
 * i.e. the 2 s budget is breached from ~60x contention upward — reproducing the observed `locator.click: Timeout 2000ms exceeded` at `voterIntro.ts:28` exactly. Note the asymmetry the old code encoded: the *visibility* wait that precedes each click gets `slowPage` (10 s) while the click itself got 2 s, even though the two costs scale together (~1:1.7) — so the click was always the budget that blew first.
 *
 * Fix: use `clickAndRaceSettle`, the in-tree idiom for exactly this family (see its "Stuck click" defense rationale). It bounds the click, swallows the actionability timeout, and races the *landing* instead — the landing being the signal that actually matters. Rigidity is preserved: the hard assertion simply moves downstream (the intro CTA visibility wait for the first click, the caller's `expectation()` for the second), so a genuinely stuck flow still fails loudly — and with a better message than "click timed out".
 *
 * NOT fixed by raising `TIMEOUTS.click`: that bucket is shared by 15 call sites and widening it would slow every fail-fast path in the suite.
 *
 * Rejected alternative: `settleNetworkIdle` before the click. Measured worse — it helps at moderate contention but adds its own unbounded wait (6254 ms outlier at 60x), and its `.catch(() => null)` form would violate this module's rigidity contract.
 */
export async function bypassIntroThen(page: Page, expectation: () => Promise<void>): Promise<void> {
  await page.goto('/en/');
  // Landing signal: the intro route. The hard assertion is the `toBeVisible` on the intro CTA immediately below.
  await clickAndRaceSettle(page.getByTestId(testIds.voter.home.startButton), /\/intro\b/);
  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await expect(introStart).toBeVisible({ timeout: TIMEOUTS.slowPage });
  // Landing signal: any route other than the intro itself — the destination varies by topology (elections / constituencies / questions). The hard assertion is the caller's `expectation()`.
  await clickAndRaceSettle(introStart, (url) => !url.pathname.endsWith('/intro'));
  await expectation();
}

/**
 * Hard-assert the voter has landed on a question (heading + first answer option mounted). The "no election or constituency selector intervened" contract is enforced at the call site by checking those locators are hidden — this helper only asserts the question is shown.
 */
export async function expectQuestion(page: Page): Promise<void> {
  await expect(page.getByTestId(testIds.voter.questions.heading)).toBeVisible({
    timeout: TIMEOUTS.slowPage
  });
  await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({
    timeout: TIMEOUTS.element
  });
}

/**
 * Hard-assert the elections list is visible (with at least one option mounted) and return its Locator so callers can interact further.
 */
export async function expectElectionSelector(page: Page): Promise<Locator> {
  const list = page.getByTestId(testIds.voter.elections.list);
  await expect(list).toBeVisible({ timeout: TIMEOUTS.slowPage });
  await expect(list.getByTestId(testIds.voter.elections.option).first()).toBeVisible({ timeout: TIMEOUTS.element });
  return list;
}

/**
 * Hard-assert the constituencies list is visible and return its Locator so callers can interact further.
 */
export async function expectConstituencySelector(page: Page): Promise<Locator> {
  const list = page.getByTestId(testIds.voter.constituencies.list);
  await expect(list).toBeVisible({ timeout: TIMEOUTS.slowPage });
  return list;
}

/**
 * Walk home → intro → expect a question. For topology variants where neither election nor constituency selection is shown (perm-1e1cg1co, perm-disable-election-1co).
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
 * Iterates every option: matching options end aria-checked='true', non-matching options end aria-checked='false', then asserts continue is enabled and clicks it. Idempotent regardless of the page's default-selection state.
 *
 * Enforces a SET POST-CONDITION: the set of aria-checked='true' options equals exactly the set whose accessible name matches `optionText`.
 *
 * The `[<SYMBOL>] <description>` display-name convention guarantees the bracketed symbol is a substring of every option's accessible name, so `optionText: /\[EL1\]/i` unambiguously addresses "election EL1".
 */
export async function selectElectionAndAdvance(
  page: Page,
  { optionText }: { optionText: RegExp | string }
): Promise<void> {
  const labels = page.getByTestId(testIds.voter.elections.label);
  await expect(labels.first()).toBeVisible({ timeout: TIMEOUTS.slowPage });
  const optionCount = await labels.count();
  expect(optionCount, 'selectElectionAndAdvance: elections list must contain at least one option').toBeGreaterThan(0);
  const optionsToCheck = labels.filter({ hasText: optionText });
  const checkCount = await optionsToCheck.count();
  for (let i = 0; i < checkCount; i++) {
    await optionsToCheck.nth(i).check({ timeout: TIMEOUTS.click });
  }
  const optionsToUncheck = labels.filter({ hasNotText: optionText });
  const uncheckCount = await optionsToUncheck.count();
  for (let i = 0; i < uncheckCount; i++) {
    await optionsToUncheck.nth(i).uncheck({ timeout: TIMEOUTS.click });
  }
  const cont = page.getByTestId(testIds.voter.elections.continue);
  await expect(cont).toBeEnabled({ timeout: TIMEOUTS.page });
  await cont.click();
  const list = page.getByTestId(testIds.voter.elections.list);
  await expect(list).toBeHidden({ timeout: TIMEOUTS.page });
}

/**
 * Walk home → intro → expect the constituencies list. Returns the list Locator.
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
 * Locate the specific `<Select>` combobox inside the constituencies list whose surrounding group label / section text matches `selectorText`, pick the option matching `optionText`, advance, and hard-assert no missing-nominations modal appears.
 *
 * The implementation pattern handles the two DOM shapes the constituency-selector source produces:
 *   1. A single combobox per group (single-CG topology) — the locator resolves directly via `list.getByRole('combobox')`.
 *   2. Multiple comboboxes (multi-CG topology) — filter by the group's surrounding section / label text.
 *
 * The `selectorText` regex matches the `[<SYMBOL>]` bracketed CG name; the helper uses Playwright's role/name filtering to find the matching combobox.
 */
export async function selectConstituencyAndAdvance(
  page: Page,
  { selectorText, optionText }: { selectorText: RegExp | string; optionText: RegExp | string }
): Promise<void> {
  const list = page.getByTestId(testIds.voter.constituencies.list);
  await expect(list).toBeVisible({ timeout: TIMEOUTS.slowPage });

  // The constituency-selector renders one section per applicable-elections group; each section contains a `<Select>` combobox. Filter the combobox by an ancestor / sibling whose accessible name matches `selectorText` (the bracketed CG symbol). When only one combobox is rendered, the filter is a no-op and the first (only) combobox is selected.
  const allComboboxes = list.getByRole('combobox');
  const matchingCombobox = allComboboxes.filter({
    // reason: filtering a combobox by a dynamic, runtime-built CG-symbol text (the bracketed constituency-group label) has no stable testId or role handle — the text content is data-derived, not a fixed element identity.
    // eslint-disable-next-line playwright/no-restricted-locators
    has: page.locator('text=' + (typeof selectorText === 'string' ? selectorText : ''))
  });
  const comboboxCount = await allComboboxes.count();
  expect(
    comboboxCount,
    'selectConstituencyAndAdvance: constituencies list must contain at least one combobox'
  ).toBeGreaterThan(0);

  // Strategy: when there is exactly one combobox, the selectorText filter is unnecessary — pick the only combobox. When there are multiple, the most robust strategy is to walk every combobox, open it, check whether the listbox contains an option matching `optionText`, click it if so, and close otherwise. This is the same set-style iteration the elections helper uses and avoids brittle DOM-structure assumptions about group/label nesting.
  let picked = false;
  for (let i = 0; i < comboboxCount && !picked; i++) {
    const cb = allComboboxes.nth(i);
    // Probe the combobox's accessible name FIRST — if it matches selectorText, this is the right combobox (single-pass).
    const cbName = (await cb.getAttribute('aria-label')) ?? (await cb.textContent()) ?? '';
    const nameMatches = typeof selectorText === 'string' ? cbName.includes(selectorText) : selectorText.test(cbName);
    // If the name does not match and we have multiple comboboxes, try the surrounding label. The voter-not-located-redirect spec's helper (iterateSelectOptions) does NOT match by name and assumes one combobox per group; we are stricter to honor the bracketed-CG contract.
    if (!nameMatches && comboboxCount > 1) {
      // Continue to next combobox; this one is not the target.
      // suppress unused locator
      void matchingCombobox;
      continue;
    }
    await cb.click({ timeout: TIMEOUTS.click });
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: TIMEOUTS.page });
    const option = listbox.getByRole('option', { name: optionText }).first();
    await expect(option).toBeVisible({ timeout: TIMEOUTS.element });
    await option.click({ timeout: TIMEOUTS.click });
    picked = true;
  }
  expect(picked, `selectConstituencyAndAdvance: no combobox matched selectorText ${String(selectorText)}`).toBe(true);

  const cont = page.getByTestId(testIds.voter.constituencies.continue);
  await expect(cont).toBeEnabled({ timeout: TIMEOUTS.page });
  await cont.click();
  await expect(list).toBeHidden({ timeout: TIMEOUTS.page });
  await expect(page.getByTestId(testIds.voter.missingNominationsModal)).toBeHidden({
    timeout: TIMEOUTS.slowPage
  });
}
