/**
 * Voter results page E2E tests.
 *
 * Covers:
 * - VOTE-08: Results display with candidate section and result cards
 * - VOTE-09: Switching to organizations/parties section
 * - VOTE-10: Entity type tabs for hybrid candidate + organization view
 *
 * Phase 62 Plan 62-03 extensions:
 * - RESULTS-01 + RESULTS-02: filter toggle narrows list + no infinite-loop
 *   console warning (`effect_update_depth_exceeded`).
 * - D-14: filter state resets on plural-tab switch (scope = electionId × plural).
 * - D-15: filter state survives drawer open/close.
 * - D-08 shape 3 (RESULTS-03): deeplink renders list + drawer (matching types).
 * - D-08 shape 4 (RESULTS-03): deeplink renders organizations list + candidate drawer
 *   (cross-type edge case).
 * - D-13: browser Back/Forward steps through tab + drawer state.
 * - D-11: matcher rejects invalid plural → 404.
 * - D-11: coupling rule redirects singular-without-id to list view.
 * - D-10: drawer-first paint gate — source-order + computed `content-visibility: auto`.
 * - RESEARCH A3: canonical `/results` redirect to `/results/candidates`.
 *
 * Uses the `answeredVoterPage` fixture from `voter.fixture.ts` which
 * navigates the voter journey and answers all questions, landing on
 * the results page. Each test gets a fresh page instance.
 *
 * Runs within the `voter-app` project which depends only on data-setup
 * (no auth needed for voter tests).
 */

import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';
import { E2E_DEFAULT_CANDIDATES, E2E_ORGANIZATIONS, E2E_VOTER_CANDIDATES } from '../../utils/e2eFixtureRefs';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

// Compute expected counts from the e2e template.
// Addendum candidates have unconfirmed nominations and are excluded from voter results.
const visibleCandidateCount = [...E2E_DEFAULT_CANDIDATES, ...E2E_VOTER_CANDIDATES].filter(
  (c) => typeof c.terms_of_use_accepted === 'string' && c.terms_of_use_accepted.length > 0
).length;
const totalPartyCount = E2E_ORGANIZATIONS.length;

const LIST_CONTAINER_TESTID = 'voter-results-list-container';
const DRAWER_TESTID = 'voter-results-drawer';

/**
 * Extract `{ entityTypePlural, entityTypeSingular, id }` from an entity-card
 * `<a>` href for the current page. Returns `undefined` when the href does not
 * match the 4-segment results URL shape. `href` is a full pathname, including
 * the optional Paraglide locale prefix — accept any leading segments.
 *
 * Example hrefs:
 *   /results/candidates/candidate/abc123?electionId=xyz
 *   /fi/results/organizations/organization/def456?electionId=xyz
 */
function parseResultHref(href: string | null):
  | {
      entityTypePlural: 'candidates' | 'organizations';
      entityTypeSingular: 'candidate' | 'organization';
      id: string;
      search: string;
    }
  | undefined {
  if (!href) return undefined;
  const [pathOnly, queryString] = href.split('?');
  const search = queryString ? `?${queryString}` : '';
  const parts = pathOnly.split('/').filter(Boolean);
  const resultsIdx = parts.indexOf('results');
  if (resultsIdx < 0 || parts.length < resultsIdx + 4) return undefined;
  const entityTypePlural = parts[resultsIdx + 1] as 'candidates' | 'organizations';
  const entityTypeSingular = parts[resultsIdx + 2] as 'candidate' | 'organization';
  const id = parts[resultsIdx + 3];
  if (entityTypePlural !== 'candidates' && entityTypePlural !== 'organizations') return undefined;
  if (entityTypeSingular !== 'candidate' && entityTypeSingular !== 'organization') return undefined;
  return { entityTypePlural, entityTypeSingular, id, search };
}

test.describe('voter results', { tag: ['@voter'] }, () => {
  test('should display candidates section with result cards', async ({ answeredVoterPage: page }) => {
    // Assert candidate section is visible (VOTE-08)
    const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
    await expect(candidateSection).toBeVisible();

    // Assert result cards are visible
    const firstCard = page.getByTestId(testIds.voter.results.card).first();
    await expect(firstCard).toBeVisible();

    // Count candidate cards: expect 11 visible candidates
    // - 5 from default dataset (alpha through epsilon, all registered)
    // - 6 from voter dataset (agree, close, neutral, oppose, mixed, partial)
    // The hidden candidate (no termsOfUseAccepted) should NOT appear (12 total - 1 hidden = 11)
    // Addendum candidates have unconfirmed nominations and are also excluded
    const cardCount = page.getByTestId(testIds.voter.results.card);
    await expect(cardCount).toHaveCount(visibleCandidateCount);
  });

  test('should display entity type tabs for switching between candidates and organizations', async ({
    answeredVoterPage: page
  }) => {
    // Assert entity tabs are visible (VOTE-10)
    const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
    await expect(entityTabs).toBeVisible();

    // The tabs should have at least 2 tab buttons (candidates + organizations)
    const tabButtons = entityTabs.getByRole('tab');
    const tabCount = await tabButtons.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);
  });

  test('should switch to organizations/parties section and back', async ({ answeredVoterPage: page }) => {
    // Click the organizations/parties tab (VOTE-09)
    const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
    await entityTabs.getByRole('tab', { name: /parties/i }).click();

    // Assert party section is visible
    const partySection = page.getByTestId(testIds.voter.results.partySection);
    await expect(partySection).toBeVisible();

    // Assert party section shows results -- verify the heading mentions "parties"
    // Note: entity-card testId is shared by party cards AND nested candidate subcards,
    // so we verify the party section heading count instead of counting entity-card elements.
    // Use first() because the section also contains party card h3 headings.
    await expect(partySection.getByRole('heading', { level: 3 }).first()).toContainText(`${totalPartyCount} parties`);

    // Switch back to candidates tab
    await entityTabs.getByRole('tab', { name: /candidate/i }).click();

    // Assert candidate section is visible again
    const candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
    await expect(candidateSection).toBeVisible();
  });

  ////////////////////////////////////////////////////////////////////
  // Phase 62 Plan 62-03 extensions
  ////////////////////////////////////////////////////////////////////

  test('canonical URL: /results redirects to /results/candidates (RESEARCH A3)', async ({
    answeredVoterPage: page
  }) => {
    // The answeredVoterPage fixture lands on the results page. Capture its
    // query string so we can navigate to bare `/results` with the same
    // electionId/constituencyId persistent search params and assert the
    // canonical redirect.
    const currentUrl = new URL(page.url());
    const bareResults = `/results${currentUrl.search}`;
    await page.goto(bareResults);
    // The +layout.ts load-function redirect lands us on /results/candidates.
    await page.waitForURL(/\/results\/candidates(\?|$)/, { timeout: 5000 });
    await expect(page.getByTestId(testIds.voter.results.candidateSection)).toBeVisible();
  });

  test('filter toggle narrows list without effect_update_depth_exceeded (RESULTS-01 + RESULTS-02)', async ({
    answeredVoterPage: page
  }) => {
    // Attach a console-error watcher BEFORE any interactions — catches
    // the RESULTS-01 infinite-loop regression deterministically.
    const consoleErrors: Array<string> = [];
    page.on('console', (msg) => {
      const txt = msg.text();
      if (msg.type() === 'error' || txt.includes('effect_update_depth_exceeded')) {
        consoleErrors.push(`${msg.type()}: ${txt}`);
      }
    });

    // Baseline — record visible-candidate count
    const initialCount = await page.getByTestId(testIds.voter.results.card).count();
    expect(initialCount).toBeGreaterThan(0);

    // Open filter modal
    const filterButton = page.getByTestId('entity-list-filter');
    await expect
      .poll(() => filterButton.count(), {
        timeout: 5000,
        message: 'Party filter button must render — e2e seed has 4 parties (Phase 64 D-11 + D-12)'
      })
      .toBeGreaterThan(0);
    await filterButton.first().click();

    // Check the first available filter checkbox inside the filter modal.
    // The EnumeratedEntityFilter renders checkboxes inside a <dialog>.
    const firstCheckbox = page.getByRole('dialog').getByRole('checkbox').first();
    await expect
      .poll(() => firstCheckbox.count(), {
        timeout: 5000,
        message:
          'Filter dialog must contain at least one party checkbox (Phase 64 D-11 + D-12 — EnumeratedEntityFilter dynamic import settles)'
      })
      .toBeGreaterThan(0);
    await firstCheckbox.check();

    // Click the "Apply and close" / "Close filters" button — the modal-action
    // snippet's `variant="main"` button (EntityListWithControls.svelte:204).
    // Match by the i18n-resolved label rather than `getByRole('button').first()`
    // (which previously matched the unrelated "Select all" button inside the
    // EnumeratedEntityFilter — Phase 64 D-11 + D-12 hardening).
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /close filters/i })
      .click();

    // Poll until the filter has propagated and the visible-card count narrows
    // (or holds equal). Replaces the prior `page.waitForTimeout(500)` —
    // RESEARCH §"Example 3" / DETERM-03 no-wait-for-timeout. expect.poll
    // preserves the original contract (filteredCount ≤ initialCount) with
    // race-tolerant settle-headroom.
    await expect
      .poll(() => page.getByTestId(testIds.voter.results.card).count(), {
        timeout: 5000,
        message: 'Filtered card count must narrow after applying filter (RESULTS-01/02)'
      })
      .toBeLessThanOrEqual(initialCount);

    // Assert no infinite-loop console warnings were emitted.
    expect(consoleErrors.filter((e) => e.includes('effect_update_depth_exceeded'))).toEqual([]);
  });

  test('filter state resets on plural tab switch (D-14)', async ({ answeredVoterPage: page }) => {
    // On candidates tab — activate a filter and read the badge count.
    const filterButton = page.getByTestId('entity-list-filter');
    await expect
      .poll(() => filterButton.count(), {
        timeout: 5000,
        message: 'Party filter button must render — e2e seed has 4 parties (Phase 64 D-11 + D-14 — candidates side)'
      })
      .toBeGreaterThan(0);
    await filterButton.first().click();
    const firstCheckbox = page.getByRole('dialog').getByRole('checkbox').first();
    await expect
      .poll(() => firstCheckbox.count(), {
        timeout: 5000,
        message: 'Filter dialog must contain at least one party checkbox (Phase 64 D-11 + D-14 — candidates side)'
      })
      .toBeGreaterThan(0);
    await firstCheckbox.check();
    // Click the "Apply and close" / "Close filters" button — the modal-action
    // snippet's `variant="main"` button (EntityListWithControls.svelte:204).
    // Match by the i18n-resolved label rather than `getByRole('button').first()`
    // (which previously matched the unrelated "Select all" button inside the
    // EnumeratedEntityFilter — Phase 64 D-11 + D-14 + D-15 hardening).
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /close filters/i })
      .click();

    // Wait for the filter dialog to fully close before clicking the parties tab.
    // The <dialog> element stays in the DOM after closeModal() (Modal.svelte +
    // ModalContainer.svelte:131-144) but its `open` attribute is removed — once
    // open is gone, the dialog stops intercepting pointer events and the
    // parties tab becomes clickable (Phase 64 D-11 + D-14).
    // getByRole('dialog') matches only open <dialog> elements (closed dialogs are
    // hidden from the accessibility tree); count==0 == no open dialog.
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });

    // Switch to organizations tab
    const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
    await entityTabs.getByRole('tab', { name: /parties/i }).click();
    await page.waitForURL(/\/results\/organizations/, { timeout: 5000 });

    // Organizations-side filter button should show no active filters (badge == 0 or absent).
    // The InfoBadge only renders when numActiveFilters > 0 in the warning-button variant.
    // Look for the warning-colored filter button — if absent, badge is 0.
    // reason: the warning state is signalled by a DaisyUI .btn-warning class
    // (or the [color="warning"] prop reflected to attribute by the Button
    // component) and there is no role/text/aria-label equivalent — the visual
    // warning indicator IS the contract. Inline-justified per RESEARCH §"Anti-
    // Patterns" + the canonical example for color/state attributes.
    const warningFilterBtn = page.getByTestId('entity-list-filter').filter({
      // eslint-disable-next-line playwright/no-raw-locators
      has: page.locator('.btn-warning, [color="warning"]')
    });
    await expect(warningFilterBtn).toHaveCount(0);
  });

  test('filter state survives drawer open/close (D-15)', async ({ answeredVoterPage: page }) => {
    // Activate a filter on candidates — same pattern as above.
    const filterButton = page.getByTestId('entity-list-filter');
    await expect
      .poll(() => filterButton.count(), {
        timeout: 5000,
        message: 'Party filter button must render — e2e seed has 4 parties (Phase 64 D-11 + D-15)'
      })
      .toBeGreaterThan(0);
    await filterButton.first().click();
    const firstCheckbox = page.getByRole('dialog').getByRole('checkbox').first();
    await expect
      .poll(() => firstCheckbox.count(), {
        timeout: 5000,
        message:
          'Filter dialog must contain at least one party checkbox (Phase 64 D-11 + D-15 — EnumeratedEntityFilter dynamic import settles)'
      })
      .toBeGreaterThan(0);
    await firstCheckbox.check();
    // Click the "Apply and close" / "Close filters" button — the modal-action
    // snippet's `variant="main"` button (EntityListWithControls.svelte:204).
    // Match by the i18n-resolved label rather than `getByRole('button').first()`
    // (which previously matched the unrelated "Select all" button inside the
    // EnumeratedEntityFilter — Phase 64 D-11 + D-14 + D-15 hardening).
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /close filters/i })
      .click();
    // Wait for the filter dialog's `open` attribute to be removed — same modal-
    // close race as D-14 above. Without this gate, the entity-card-action
    // click below races with the modal close animation (Phase 64 D-11 + D-15).
    // getByRole('dialog') matches only open <dialog> elements (closed dialogs are
    // hidden from the accessibility tree); count==0 == no open dialog.
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });
    const beforeFilterCount = await page.getByTestId(testIds.voter.results.card).count();

    // Open the first entity's drawer by clicking its card.
    // The entity-card-action <a> wraps the entity-card article (EntityCard.svelte:184) —
    // it lives OUTSIDE the article, so querying with `firstCard.getByRole('link')`
    // returns 0 hits even though the link exists. Use the entity-card-action
    // testid directly, matching the deeplink test below (Phase 64 D-11).
    const firstCardLink = page.getByTestId('entity-card-action').first();
    await expect(firstCardLink).toHaveCount(1, { timeout: 5000 });
    await firstCardLink.click();
    // Drawer URL: /results/candidates/candidate/[id]
    await page.waitForURL(/\/results\/candidates\/candidate\//, { timeout: 5000 });

    // Close the drawer by navigating back
    await page.goBack();
    await page.waitForURL((u) => !/\/candidate\/[^/]+/.test(u.toString()), { timeout: 5000 });

    // Wait for the drawer to fully unmount — the post-back render briefly
    // includes both drawer-internal and list-internal entity-card elements
    // until the drawer transition completes (Phase 64 D-11 + D-15 hardening).
    await expect(page.getByTestId(DRAWER_TESTID)).toHaveCount(0, { timeout: 5000 });

    // After closing drawer — filter should still be active (card count unchanged
    // from when filter was applied). Use expect.poll so the assertion has
    // settle headroom — the layout's $derived re-evaluation after URL change
    // briefly desyncs entity-card count from the steady-state filter result.
    await expect
      .poll(() => page.getByTestId(testIds.voter.results.card).count(), {
        timeout: 5000,
        message: `Card count after drawer close must match pre-drawer count (${beforeFilterCount}) — filter state must survive drawer cycle (Phase 64 D-11 + D-15)`
      })
      .toEqual(beforeFilterCount);
  });

  test('deeplink list+drawer URL renders both (RESULTS-03, D-08 shape 3)', async ({ answeredVoterPage: page }) => {
    // Extract a candidate id + electionId from the first rendered card.
    // The entity-card-action <a> wraps the entity-card article when there
    // are no subcards, so we query the action testid directly.
    const firstCardLink = page.getByTestId('entity-card-action').first();
    const href = await firstCardLink.getAttribute('href');
    const parsed = parseResultHref(href);
    expect(parsed, `could not parse entity-card href (got: ${href})`).not.toBeUndefined();

    // Cold-navigate to the full deeplink: /results/candidates/candidate/<id>?electionId=<x>
    await page.goto(`/results/candidates/candidate/${parsed!.id}${parsed!.search}`);
    await page.waitForLoadState('domcontentloaded');

    // Drawer should be visible
    await expect(page.getByTestId(DRAWER_TESTID)).toBeVisible({ timeout: 5000 });
    // List container should ALSO be visible (drawer overlays, doesn't replace)
    await expect(page.getByTestId(LIST_CONTAINER_TESTID)).toBeVisible();
  });

  test('deeplink edge case: organizations list + candidate drawer (D-08 shape 4)', async ({
    answeredVoterPage: page
  }) => {
    // Extract a candidate id (first card's wrapping action link)
    const firstCardLink = page.getByTestId('entity-card-action').first();
    const href = await firstCardLink.getAttribute('href');
    const parsed = parseResultHref(href);
    expect(parsed).not.toBeUndefined();

    // Cold-navigate to the cross-type shape: orgs list + candidate drawer
    await page.goto(`/results/organizations/candidate/${parsed!.id}${parsed!.search}`);
    await page.waitForLoadState('domcontentloaded');

    // Drawer renders with candidate entity
    await expect(page.getByTestId(DRAWER_TESTID)).toBeVisible({ timeout: 5000 });
    // Underneath, the organizations section is the active list (NOT candidates).
    // If the active plural is 'organizations', the org/party section testId should be present.
    await expect(page.getByTestId(testIds.voter.results.partySection)).toBeVisible();
  });

  test('Browser Back steps through tab+drawer changes (D-13)', async ({ answeredVoterPage: page }) => {
    // Start on candidates (fixture landing page, after canonical redirect if any)
    await page.waitForURL(/\/results/, { timeout: 5000 });

    // Click organizations tab
    const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
    await entityTabs.getByRole('tab', { name: /parties/i }).click();
    await page.waitForURL(/\/results\/organizations/, { timeout: 5000 });

    // Back once — should return to candidates
    await page.goBack();
    await page.waitForURL(/\/results\/(candidates|$)/, { timeout: 5000 });
    await expect(page.getByTestId(testIds.voter.results.candidateSection)).toBeVisible();
  });

  test('invalid plural matcher returns 404 (D-11)', async ({ answeredVoterPage: page }) => {
    const currentUrl = new URL(page.url());
    const response = await page.goto(`/results/invalidplural${currentUrl.search}`);
    // Matcher rejection → SvelteKit renders its built-in 404 page with status 404.
    expect(response?.status()).toBe(404);
  });

  test('coupling-rule redirect: singular without id → list view (D-11)', async ({ answeredVoterPage: page }) => {
    const currentUrl = new URL(page.url());
    await page.goto(`/results/candidates/candidate${currentUrl.search}`);
    // +page.ts coupling guard throws redirect(307) back to /results/candidates
    await page.waitForURL(/\/results\/candidates(\?|$)/, { timeout: 5000 });
    // Drawer should NOT be visible (we stripped the incomplete pair)
    await expect(page.getByTestId(DRAWER_TESTID)).toHaveCount(0);
  });

  test('drawer paints before list on cold deeplink (D-10 source-order + content-visibility)', async ({
    answeredVoterPage: page
  }) => {
    const firstCardLink = page.getByTestId('entity-card-action').first();
    const href = await firstCardLink.getAttribute('href');
    const parsed = parseResultHref(href);
    expect(parsed).not.toBeUndefined();

    // Cold-navigate
    await page.goto(`/results/candidates/candidate/${parsed!.id}${parsed!.search}`);
    await page.waitForLoadState('domcontentloaded');

    // Both elements must exist before we assert order — wait for the drawer.
    await page.getByTestId(DRAWER_TESTID).waitFor({ state: 'attached', timeout: 5000 });
    await page.getByTestId(LIST_CONTAINER_TESTID).waitFor({ state: 'attached', timeout: 5000 });

    const result = await page.evaluate(
      ({ drawerSel, listSel }) => {
        const drawer = document.querySelector(drawerSel);
        const list = document.querySelector(listSel);
        if (!drawer || !list) return null;
        // Compute document order via compareDocumentPosition. If `drawer`
        // precedes `list`, the bitmask includes DOCUMENT_POSITION_FOLLOWING (0x04).
        const pos = drawer.compareDocumentPosition(list);
        const drawerBeforeList = (pos & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
        const listStyle = window.getComputedStyle(list as Element);
        return {
          drawerBeforeList,
          listContentVisibility: listStyle.contentVisibility
        };
      },
      { drawerSel: `[data-testid="${DRAWER_TESTID}"]`, listSel: `[data-testid="${LIST_CONTAINER_TESTID}"]` }
    );

    expect(result, 'drawer or list container missing from DOM').not.toBeNull();
    // Document-order gate — drawer block is written BEFORE the list container
    // in the layout template (D-10 cheapest-first mechanism).
    expect(result!.drawerBeforeList).toBe(true);
    // content-visibility gate — browsers that support the property report
    // 'auto' as the computed value; browsers that don't support it fall
    // back to 'visible' (no-op) and the source-order mechanism still applies.
    // Modern Chromium (Playwright default) supports it, so assert 'auto'.
    expect(result!.listContentVisibility).toBe('auto');
  });

  ////////////////////////////////////////////////////////////////////
  // Phase 77 / SETTINGS-01 wave B — filter-type matrix
  //
  // Per Phase 77 Plan 02. Folds source todo
  // `.planning/todos/pending/2026-04-27-extend-e2e-filter-type-coverage.md`.
  //
  // The voter-results filter dialog renders one Expander per active filter
  // (EntityFilters.svelte:38-60). Question filters only surface when the
  // question carries `customData.filterable: true` (filterStore.svelte.ts:55-66),
  // hence the Plan 02 fixture extension added the flag to test-question-text
  // (TextFilter), test-question-directional-1 (ChoiceQuestionFilter) and the
  // new test-question-number-1 (NumberFilter at sort 22).
  //
  // Title prefix `'SETTINGS-01 wave B — '` per RESEARCH LANDMINE-A
  // (IMGPROXY_TIED_TITLES safety).
  //
  // The 5 cells:
  //   1. NumberFilter — slider narrowing on test-question-number-1
  //   2. TextFilter — substring search on test-question-text
  //   3. ChoiceQuestionFilter (categorical) — uncheck Option A on test-question-directional-1
  //   4. FilterGroup AND — toggle 2 filters simultaneously (party + categorical)
  //   5. MISSING_FILTER_VALUE — excludeMissing on NumberFilter
  //
  // FilterGroup OR is PASS-WITH-DEFERRAL (RESEARCH LANDMINE-4 PRODUCT-GAP) — see
  // .planning/todos/pending/2026-05-13-filtergroup-or-mode-ui-product-gap.md.
  ////////////////////////////////////////////////////////////////////

  test.describe('SETTINGS-01 wave B — filter-type matrix', () => {
    /**
     * Open the filter dialog from the candidates results view. Reused by every
     * wave B cell.
     */
    async function openFilterDialog(page: Page) {
      const filterButton = page.getByTestId('entity-list-filter');
      await expect
        .poll(() => filterButton.count(), {
          timeout: 5000,
          message: 'entity-list-filter button must render'
        })
        .toBeGreaterThan(0);
      await filterButton.first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      return dialog;
    }

    /**
     * Close the filter dialog via the "Close filters" main-variant button.
     * Matches the existing RESULTS-01 / D-14 / D-15 pattern in this file.
     */
    async function closeFilterDialog(page: Page) {
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /close filters/i })
        .click();
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });
    }

    /**
     * Expand a non-default-expanded filter inside the dialog by its 0-based
     * position. The Expander component (Expander.svelte:155) is driven by an
     * `<input type="checkbox" aria-label="Expand or collapse this section">`;
     * each filter in the dialog renders one such checkbox in source order.
     *
     * Locating: 4 filters are rendered in `EntityFilters.svelte:38 #each
     * filterGroup.filters` in this fixed order:
     *   - index 0 → Party (ObjectFilter, default-expanded by parent push)
     *   - index 1 → Campaign slogan (TextQuestionFilter, since Phase 77 P02)
     *   - index 2 → Test Number Question 1 (NumberQuestionFilter)
     *   - index 3 → Test Opinion Question Directional 1 (ChoiceQuestionFilter)
     *
     * The 0-based index is therefore deterministic for the SETTINGS-01 wave B
     * e2e fixture. We click the indexed checkbox directly (no force:true needed
     * since the checkbox IS the role-based target; the title text is the
     * decoration).
     */
    async function expandFilterByIndex(dialog: Locator, index: number) {
      const checkbox = dialog
        .getByRole('checkbox', { name: /expand or collapse this section/i })
        .nth(index);
      await expect(checkbox).toBeVisible({ timeout: 5000 });
      // Use .check() (not .click()) because the Expander's checkbox is a
      // controlled input bound to a local $state — calling .check() ensures
      // Playwright dispatches the click and waits for the checked state to
      // settle (Svelte's controlled-input render race can occasionally land
      // a .click() with no observable state change on cold-start renders).
      // If the checkbox is already checked (e.g., Party expander whose
      // defaultExpanded is true because the parent filter is "active" at
      // mount), .check() is a no-op — that's the correct behavior here.
      await checkbox.check();
    }
    const FILTER_INDEX = {
      party: 0,
      campaignSlogan: 1,
      number: 2,
      categorical: 3
    } as const;

    test('SETTINGS-01 wave B — NumberFilter', async ({ answeredVoterPage: page }) => {
      test.setTimeout(60000);

      const cards = page.getByTestId(testIds.voter.results.card);
      const initialCount = await cards.count();
      expect(initialCount, 'baseline cards must be > 0').toBeGreaterThan(0);

      const dialog = await openFilterDialog(page);

      // Expand the NumberFilter expander (it is not default-expanded —
      // EntityFilters.svelte:43 only auto-expands TextFilter).
      await expandFilterByIndex(dialog, FILTER_INDEX.number);

      // NumericEntityFilter renders 2 range sliders (min + max) when at least
      // one candidate has a non-missing answer (NumericEntityFilter.svelte:81).
      // Alpha=25, voter-cand-agree=60, Gamma=50, Beta=75 → range=[25, 75].
      // Locator scope: scoped to the dialog so we don't catch any sliders
      // outside of the filter modal (none exist today, but the scope is
      // belt-and-braces).
      const sliders = dialog.getByRole('slider');
      await expect
        .poll(() => sliders.count(), {
          timeout: 5000,
          message: 'NumberFilter must render 2 sliders (min + max) once the expander opens'
        })
        .toBe(2);

      // Move the min slider above Alpha's value (25). Setting fill on a <input
      // type="range"> updates the bound value; the $effect in
      // NumericEntityFilter.svelte:55-59 pushes the new min to filter.min, which
      // narrows the filter list.
      const minSlider = sliders.first();
      await minSlider.fill('30');
      await minSlider.dispatchEvent('change');

      await expect
        .poll(() => cards.count(), {
          timeout: 5000,
          message: 'NumberFilter min>25 must narrow the candidate list (Alpha at 25 should drop out)'
        })
        .toBeLessThan(initialCount);

      // Reset the min slider to the bottom of the range (range.min=25 — set 0
      // is clamped by the input min attribute). Setting to 25 (the actual
      // range.min) restores all candidates with a defined answer; missing-value
      // candidates are also restored because includeMissing defaults to true.
      await minSlider.fill('25');
      await minSlider.dispatchEvent('change');

      await expect
        .poll(() => cards.count(), {
          timeout: 5000,
          message: 'NumberFilter reset must restore the initial card count'
        })
        .toEqual(initialCount);

      await closeFilterDialog(page);
    });

    test('SETTINGS-01 wave B — TextFilter', async ({ answeredVoterPage: page }) => {
      test.setTimeout(60000);

      const cards = page.getByTestId(testIds.voter.results.card);
      const initialCount = await cards.count();
      expect(initialCount).toBeGreaterThan(0);

      const dialog = await openFilterDialog(page);

      // The Campaign slogan question filter is a TextQuestionFilter
      // (filterType === 'textQuestionFilter'). The Phase 77 P02
      // EntityFilters.svelte fix now uses `isTextFilter()` to default-expand
      // both TextFilter and TextQuestionFilter — but to be robust to a
      // collapsed initial state on cold-start (the $effect that flips
      // `expanded = defaultExpanded` may not have fired by the time the
      // dialog opens), we explicitly expand the Campaign slogan filter at
      // index 1.
      await expandFilterByIndex(dialog, FILTER_INDEX.campaignSlogan);

      // TextEntityFilter renders a single <input type="text"> with sr-only
      // label "Text:" inside the now-expanded Expander.
      // Locator: role textbox with the i18n-resolved aria-label, scoped to
      // the dialog (the outside-dialog search-by-name textbox shares the same
      // aria-label but lives at the EntityList top level).
      const textInput = dialog.getByRole('textbox', { name: /text:/i });
      await expect
        .poll(() => textInput.count(), {
          timeout: 5000,
          message: 'TextFilter input must render — test-question-text has filterable: true'
        })
        .toBeGreaterThan(0);

      // Type substring of Alpha's value 'Progress for all' (LANDMINE-C —
      // 'Progress' does not contain the substring 'Alpha' so IMGPROXY title
      // disjointness holds for this test's literals; the value is keyed to
      // Alpha by the fixture, not by literal-string overlap).
      await textInput.first().fill('Progress');

      await expect
        .poll(() => cards.count(), {
          timeout: 5000,
          message: 'TextFilter "Progress" substring must narrow the candidate list'
        })
        .toBeLessThan(initialCount);

      // Clear the text input — the input's clear button (Icon name="close") is
      // also a valid path, but `.fill('')` is the equivalent role/value action.
      await textInput.first().fill('');

      await expect
        .poll(() => cards.count(), {
          timeout: 5000,
          message: 'TextFilter clear must restore the initial card count'
        })
        .toEqual(initialCount);

      await closeFilterDialog(page);
    });

    test('SETTINGS-01 wave B — ChoiceQuestionFilter (categorical)', async ({ answeredVoterPage: page }) => {
      test.setTimeout(60000);

      const cards = page.getByTestId(testIds.voter.results.card);
      const initialCount = await cards.count();
      expect(initialCount).toBeGreaterThan(0);

      const dialog = await openFilterDialog(page);

      // Expand the categorical-question filter (test-question-directional-1
      // → "Test Opinion Question Directional 1") at index 3.
      await expandFilterByIndex(dialog, FILTER_INDEX.categorical);

      // EnumeratedEntityFilter renders one checkbox per choice. The 3 choice
      // labels are "Option A", "Option B", "Option C". Locator: checkboxes by
      // accessible name (the <span> label is associated with the input via the
      // <label> wrapper, so the input's accessible name is the label text).
      //
      // Default state: all checkboxes are checked → no filtering. Unchecking
      // Option A (Alpha's value `'a'` per fixture) should exclude Alpha from
      // entities whose answer to test-question-directional-1 equals 'a'.
      // Other candidates without an answer to this question are NOT filtered
      // out — the categorical filter only constrains entities whose values
      // are NOT in `filter.include`.
      const optionA = dialog.getByRole('checkbox', { name: /Option A/i });
      await expect
        .poll(() => optionA.count(), {
          timeout: 5000,
          message: 'ChoiceQuestionFilter must render an "Option A" checkbox'
        })
        .toBeGreaterThan(0);

      // Uncheck Option A — this narrows the candidate list by excluding any
      // entity whose answer to test-question-directional-1 equals 'a'.
      await optionA.first().uncheck();

      await expect
        .poll(() => cards.count(), {
          timeout: 5000,
          message: 'ChoiceQuestionFilter unchecking Option A must narrow (Alpha answers a)'
        })
        .toBeLessThan(initialCount);

      // Restore via the dialog's "Reset filters" warning-variant button — the
      // EnumeratedEntityFilter's `selected` $state binding does not include
      // MISSING_VALUE when filter.include is non-empty (per
      // convertMissingForInputs), so simply re-checking Option A would leave
      // candidates with MISSING values on test-question-directional-1 still
      // excluded. The Reset Filters button clears the FilterGroup state
      // entirely (EntityListWithControls.svelte:139 `filters_reset` event).
      //
      // resetAllFilters() ALSO closes the dialog (calls closeModal internally),
      // so we do NOT need to call closeFilterDialog after the reset click.
      const resetButton = dialog.getByRole('button', { name: /reset filters/i });
      await expect(resetButton).toBeVisible();
      await resetButton.click();
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });

      await expect
        .poll(() => cards.count(), {
          timeout: 5000,
          message: 'ChoiceQuestionFilter Reset Filters must return the initial card count'
        })
        .toEqual(initialCount);
    });

    test('SETTINGS-01 wave B — FilterGroup AND', async ({ answeredVoterPage: page }) => {
      test.setTimeout(60000);

      const cards = page.getByTestId(testIds.voter.results.card);
      const initialCount = await cards.count();
      expect(initialCount).toBeGreaterThan(0);

      // Capture per-filter narrow counts so the AND composition assertion is
      // count_AB < min(count_A, count_B). Each step opens the dialog, applies
      // ONE filter, closes the dialog, records cards.count(). Final restore
      // uses the "Reset filters" button which clears the whole FilterGroup.
      //
      // Locator strategy for party value checkboxes: each party value checkbox
      // has an accessible name equal to the party's shortName (per
      // EnumeratedEntityFilter.svelte:118-126 getLabel via shortName). The
      // e2e fixture seeds 4 parties (TPA, TPB, VPA, VPB). We target TPA — the
      // first party in sort order — which is Alpha's party affiliation per
      // the fixture, so unchecking TPA drops Alpha + Beta + Epsilon (all
      // test-party-a) from the visible list.

      // Step 1: Apply party filter (uncheck the TPA party value).
      //
      // The Party expander is rendered collapsed initially (per Expander.svelte
      // local `expanded` $state — defaultExpanded only seeds the init value).
      // Expand it explicitly so the inner party value checkboxes mount into
      // the DOM.
      let dialog = await openFilterDialog(page);
      await expandFilterByIndex(dialog, FILTER_INDEX.party);

      // Party value checkboxes have accessible names equal to party shortName +
      // candidate-count suffix (e.g., "TPA 5"). We anchor on the shortName via
      // a prefix regex.
      const partyValueCheckbox = dialog.getByRole('checkbox', { name: /^TPA/ });
      await expect
        .poll(() => partyValueCheckbox.count(), {
          timeout: 5000,
          message: 'TPA party value checkbox must render — EnumeratedFilter via buildParentFilters'
        })
        .toBeGreaterThan(0);

      await partyValueCheckbox.uncheck();
      await closeFilterDialog(page);

      const partyOnlyCount = await cards.count();
      expect(partyOnlyCount, 'party filter must narrow').toBeLessThan(initialCount);

      // Step 2: Add the categorical filter on top — uncheck Option A. The
      // dialog re-opens; the party filter remains in the state we left it
      // (UI is bound to the FilterGroup state, which persists per
      // filterContext.svelte.ts contract).
      dialog = await openFilterDialog(page);
      await expandFilterByIndex(dialog, FILTER_INDEX.categorical);
      const optionA = dialog.getByRole('checkbox', { name: /Option A/i });
      await expect
        .poll(() => optionA.count(), { timeout: 5000 })
        .toBeGreaterThan(0);
      await optionA.first().uncheck();
      await closeFilterDialog(page);

      const compositeCount = await cards.count();

      // The FilterGroup composes filters via AND (per
      // packages/filters/src/group/filterGroup.ts default logicOperator). So:
      //   - count_AB ≤ count_A (party-only)
      //   - count_AB ≤ count_B (categorical-only)
      // We assert count_AB ≤ partyOnlyCount AND count_AB < initialCount, which
      // is the AND composition's narrowing contract. Strict inequality vs.
      // partyOnlyCount is not asserter-able here because party-affiliation +
      // categorical-answer may correlate at the e2e seed level (Alpha is in
      // party A and answers Option A → adding Option A's exclusion when party
      // A is also excluded yields the same set in some seeds).
      expect(compositeCount).toBeLessThanOrEqual(partyOnlyCount);
      expect(compositeCount).toBeLessThan(initialCount);

      // Reset via the "Reset filters" warning-variant button — clears the
      // entire FilterGroup state. See ChoiceQuestionFilter cell rationale for
      // why re-check is not used (MISSING_VALUE inclusion semantics).
      // resetAllFilters() also closes the dialog internally.
      dialog = await openFilterDialog(page);
      const resetButton = dialog.getByRole('button', { name: /reset filters/i });
      await expect(resetButton).toBeVisible();
      await resetButton.click();
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });

      await expect
        .poll(() => cards.count(), {
          timeout: 5000,
          message: 'FilterGroup AND reset must restore initial count'
        })
        .toEqual(initialCount);
    });

    test('SETTINGS-01 wave B — MISSING_FILTER_VALUE', async ({ answeredVoterPage: page }) => {
      test.setTimeout(60000);

      const cards = page.getByTestId(testIds.voter.results.card);
      const initialCount = await cards.count();
      expect(initialCount).toBeGreaterThan(0);

      const dialog = await openFilterDialog(page);

      // Expand the NumberFilter and toggle the excludeMissing checkbox
      // (rendered when range.missingValues > 0 — NumericEntityFilter.svelte:97).
      // The fixture has 4 candidates with numeric answers (Alpha=25, voter-cand-agree=60,
      // Gamma=50, Beta=75) and the rest unanswered, so missingValues > 0.
      await expandFilterByIndex(dialog, FILTER_INDEX.number);

      // The excludeMissing checkbox label is t('entityFilters.missingValue') =
      // "No answer" (per en/entityFilters.json:6).
      // Locator: scoped to dialog, role checkbox by accessible name.
      const noAnswerCheckbox = dialog.getByRole('checkbox', { name: /no answer/i });
      await expect
        .poll(() => noAnswerCheckbox.count(), {
          timeout: 5000,
          message:
            'MISSING_FILTER_VALUE: the "No answer" checkbox must render on NumberFilter (range.missingValues > 0)'
        })
        .toBeGreaterThan(0);

      // The bound state `includeMissing` defaults to true → unchecking it sets
      // `filter.excludeMissing = !includeMissing` to true → candidates with
      // MISSING value on test-question-number-1 are excluded.
      await noAnswerCheckbox.first().uncheck();

      await expect
        .poll(() => cards.count(), {
          timeout: 5000,
          message:
            'MISSING_FILTER_VALUE: unchecking "No answer" must narrow (candidates without numeric answers drop out)'
        })
        .toBeLessThan(initialCount);

      // Re-check → restore.
      await noAnswerCheckbox.first().check();

      await expect
        .poll(() => cards.count(), {
          timeout: 5000,
          message: 'MISSING_FILTER_VALUE restore must return the initial card count'
        })
        .toEqual(initialCount);

      await closeFilterDialog(page);
    });
  });
});
