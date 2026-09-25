/**
 * voter-results-redraw — navigation BEHAVIOUR on the results surface, not its content.
 *
 * Read-only LEAF spec on `data-setup-base` (`e2e/base`), under its own `voter-results-redraw` Playwright project. Voter routes are public (no auth) and this spec mutates nothing — no dev-seed, no `app_settings`, no product file, no own setup/teardown.
 *
 * ## Why this file exists rather than a screenshot or a one-off script (D-16)
 *
 * Phase 165's criteria 2 and 3 are about what happens DURING a navigation. The visual-regression project cannot see them: its screenshots are taken at rest, and the layering defect this phase fixes exists for roughly 300 ms. The spike's `forensics.mjs` could see them but nothing in CI would ever run it. So the instrument ships here, in the default suite, where a regression reddens a gate instead of waiting to be re-derived.
 *
 * ## What is asserted, and how each assertion is kept from passing vacuously
 *
 *   - SCROLL SURVIVAL (RNAV-02, D-15) across entity open, entity close and entity-tab switch, each measured FROM A SCROLLED START. Every case reads its baseline AFTER bringing the click target into view and IMMEDIATELY before the click, and hard-asserts that baseline is greater than zero: Playwright scrolls an off-screen element into view before clicking it, and spike 032 measured exactly that turning a baseline of 0 into a post-click 566 — a scroll "regression" that was the harness's own doing. A baseline of 0 would make the equality that follows it vacuous, so a collapsed scrolled start is a FAILURE here, never a quiet pass.
 *   - THE TWO VIEW-TRANSITION INVARIANTS (RNAV-03, D-16): overlay open and overlay close run no document View Transition AT ALL, and any transition that runs while a modal dialog is open carries no named groups. Both are ABSENCE assertions, so each is preceded by a POSITIVE one — a navigation that IS expected to produce a record, shown to produce it — because an absence observed through a dead instrument is not evidence of absence.
 *   - DID-NOT-REMOUNT (RNAV-04, D-18) by DOM NODE IDENTITY: tag a node before the navigation, assert the document still contains that same node after it. That is literally what the claim means, and it needs zero production instrumentation.
 *   - THE DRAWER HOST'S SWAP AND TEARDOWN CONTRACT (RNAV-05, D-12): an entity-to-entity navigation swaps content inside the SAME dialog node rather than reopening, and a dismissal always ends with no open dialog even though the opener is destroyed while the host is still rendering its payload.
 *
 * ## Skip, not fail — and derived in the page
 *
 * The View-Transition describe SKIPS when there is nothing to observe: a browser without `document.startViewTransition`, or a `prefers-reduced-motion: reduce` preference that makes the app's own `shouldAnimate` gate short-circuit. Both conditions are derived INSIDE THE PAGE rather than read off the runner, because the repo carries two contradictory claims about whether `page.emulateMedia({ reducedMotion })` reaches the application's `matchMedia` — `voter-journey.fixture.ts@282` says it does not, `eperm07-term-trigger.spec.ts` uses it as a deliberate discriminator. An in-page evaluation is true either way. The scroll describe is deliberately NOT skipped: those assertions hold with or without motion.
 *
 * ## How each case reaches its entry condition, and why that keeps the property intact
 *
 * Every test walks Home → Intro → election → constituency → answer → /results through the shared `voter-journey.fixture` helpers rather than deep-linking, because the located results URL carries the seeded election and constituency ids and the suite knows the seed by external_id, not by database id. The walk is URL discovery and setup; nothing is asserted against it. The properties under test are all POST-LANDING — a scroll offset, a transition record, a node's identity — so a warm walk cannot mask any of them the way it masks the cold-entry property `cold-entry-dataroot.spec.ts` guards.
 *
 * Post-hydration mount hazard (inherited from `cold-entry-dataroot.spec.ts`): the list and the drawer mount a beat after navigation, so every presence/absence read here is a WAITING assertion (`toBeVisible` / `toBeHidden` / `toHaveCount` with a timeout), never a one-shot visibility read (`Locator.isVisible`). The drawer close is the sharpest case: the host keeps rendering its payload through the out-animation, so a one-shot read would race it and produce exactly the intermittent result the project's no-flaky rule forbids.
 *
 * ## Rigidity contract (project E2E Hard Rule)
 *
 * Every assertion is HARD — no `expect.soft`, no try/catch around `expect()`, no `.catch` fallback on an assertion-bearing interaction, no retry-until-green. A failing OR did-not-run test blocks completion.
 */

import { expect, test } from '../../fixtures/voter/views';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
import type { ViewTransitionLogFixture } from '../../fixtures/voter/viewTransitionLog.fixture';

/** How far to scroll before measuring a baseline. Large enough to clear the results hero and ingress on a desktop viewport, small enough to stay inside the list container's `min-h-[120vh]`. */
const SCROLL_STEP_PX = 700;

/** The base dataset's first organization, named the way `voter-journey.spec.ts` names it. A spec may carry seed-specific matchers; the FIXTURES may not, which is why this literal lives here and is passed in as a caller-supplied matcher. */
const ORG_PARTY_AA = /\[or-aa\] Party AA/i;

/**
 * Walk to the results listing and anchor on the list.
 *
 * Module scope rather than a fixture: `views.ts` does not expose the journey walk, and composing the two shared helpers here is the same shape `cold-entry-dataroot.spec.ts` uses when it needs the walk without the `answeredVoterPage` fixture.
 */
async function landOnResults(page: Page): Promise<void> {
  await walkUntilQuestionsIntro(page);
  await answerAndAdvanceToResults(page, 'max');
  await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
}

/** A scroll offset together with the document height it was measured against. */
type ScrollReading = {
  /** `window.scrollY`. The results surface scrolls the DOCUMENT — the list container carries `min-h-[120vh]` — so this is the offset under test. */
  y: number;
  /** `document.documentElement.scrollHeight`, carried so a failed equality can say WHETHER the offset moved on its own or was clamped by the document shrinking under it. Measured, not assumed: an early run of this spec read 1464 → 1187 from a maximum-scroll start, which is the clamp signature rather than a navigation scroll. */
  height: number;
};

/** Read the scroll offset and the document height in one round trip, so the two cannot drift between reads. */
async function readScroll(page: Page): Promise<ScrollReading> {
  return page.evaluate(() => ({ y: window.scrollY, height: document.documentElement.scrollHeight }));
}

/** Move the document to a scrolled start. Instant, not smooth: the application sets no `scroll-behavior`, so the offset is settled by the time this resolves. */
async function scrollDown(page: Page): Promise<void> {
  await page.evaluate((by) => window.scrollBy(0, by), SCROLL_STEP_PX);
}

/**
 * Skip the caller when there is no View Transition to observe.
 *
 * BOTH conditions are derived in the page. `isSupported()` reads the flag the capture fixture's init script recorded while it was deciding whether it had a native entry point to wrap, and the reduced-motion condition evaluates the media query in the page — the same query the application's own `shouldAnimate` gate reads. Neither trusts the runner.
 *
 * The conditional lives here, at module scope, rather than in a test body — the house pattern `eperm07-term-trigger.spec.ts` established for keeping `playwright/no-conditional-in-test` satisfied without hiding the branch.
 */
async function skipUnlessTransitionsAreObservable(page: Page, log: ViewTransitionLogFixture): Promise<void> {
  const supported = await log.isSupported();
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  // reason: a browser without `document.startViewTransition` has nothing to observe, and a spec that FAILED there would be asserting the browser's feature set rather than the application's behaviour. D-16 asks for a skip, and this one is derived in the page rather than from the runner.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!supported, 'document.startViewTransition is unavailable in this browser — nothing to observe');
  // reason: under `prefers-reduced-motion: reduce` the application's own `shouldAnimate` gate short-circuits before any transition starts, so an empty log is the CORRECT outcome and proves nothing about the two invariants. Skipping is honest; asserting would be theatre.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(
    reduced,
    'prefers-reduced-motion: reduce — shouldAnimate short-circuits, so there is no transition to observe'
  );
}

test.describe('voter-results-redraw — scroll survival and node identity (RNAV-02, RNAV-04)', () => {
  test('scroll survives entity open, entity close and an entity-tab switch, and neither subtree remounts', async ({
    page,
    resultsPage
  }) => {
    // testMax (90_000) equals the playwright.config global ceiling, so this keeps the full budget for a test that carries the whole voter walk before its first assertion.
    test.setTimeout(TIMEOUTS.testMax);
    await landOnResults(page);

    // NO ELECTION-CHANGE CASE HERE, AND THAT IS A DECISION RATHER THAN AN OMISSION. D-15 keeps the default scroll-to-top on an election change on purpose: switching election replaces the entire list with different content, and landing mid-list in a list the voter has never seen is disorienting. Adding a fourth case to "complete" the matrix would turn a deliberate behaviour into a failure.

    await test.step('entity OPEN keeps the scroll offset, and the results list node survives', async () => {
      await scrollDown(page);

      // A MID-LIST card, chosen by a caller-supplied indexer so the seed's card names stay out of this lookup. It is far enough down that the explicit scroll-into-view below is doing real work rather than resolving to a no-op — and deliberately NOT the last card, which sits at the document's MAXIMUM scroll offset. At maximum scroll any shrink of the document clamps `scrollY` under the test's feet, and the list container carries `content-visibility: auto`, whose contents the browser is entitled to skip once a modal dialog makes the rest of the document inert. An early run of this spec measured exactly that (1464 → 1187 from a last-card start). That clamp is a property of the browser's layout under a modal, not of the application's `noScroll` handling, so it is recorded in this plan's summary and deferred rather than asserted here; the mid-list start is what keeps this case measuring the thing it names.
      const card = await resultsPage.getEntityCard((count) => Math.floor(count / 2));
      // MEASURED, not assumed: for a card with NO subcards the `entity-card-action` anchor WRAPS the `entity-card` article rather than sitting inside it, so a descendant lookup for the action off the card finds nothing — the first run of this spec timed out on exactly that. The card title is inside the article and inside the anchor, so clicking it navigates through the wrapping link, and it is a small, wholly-visible target whose scroll-into-view cannot be nudged again by the click.
      const target = card.getByTestId(testIds.voter.results.cardTitle).first();
      // Do Playwright's own pre-click auto-scroll EXPLICITLY, so the baseline below is read from the same scroll position the click will act on. Without this the harness scrolls between the read and the click, and the post-click comparison measures the harness rather than the application (spike 032, Investigation Trail item 5).
      await target.scrollIntoViewIfNeeded();

      // The node that must survive an open: `voter-results-list` sits on `EntityListWithControls`, and NOTHING keys on the `entity`/`id` params, so an open must not replace it.
      const listNode = await page.getByTestId(testIds.voter.results.list).elementHandle();

      const before = await readScroll(page);
      expect(
        before.y,
        'the scrolled start collapsed to 0 — the equality assertion below would pass vacuously from the top of the page'
      ).toBeGreaterThan(0);

      await target.click();
      await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeVisible({ timeout: TIMEOUTS.slowPage });

      const afterOpen = await readScroll(page);
      expect(
        afterOpen.y,
        `the page scrolled when the entity drawer opened (document height ${before.height} -> ${afterOpen.height}; a shrink here means the offset was CLAMPED by the layout rather than moved by the navigation)`
      ).toBe(before.y);
      expect(
        await page.evaluate((el) => document.contains(el), listNode),
        'the results list node was replaced when the drawer opened — the subtree remounted'
      ).toBe(true);
    });

    await test.step('entity CLOSE keeps the scroll offset, and the results list node still survives', async () => {
      const listNode = await page.getByTestId(testIds.voter.results.list).elementHandle();

      const before = await readScroll(page);
      expect(
        before.y,
        'the scrolled start collapsed to 0 before the close — the equality assertion below would pass vacuously'
      ).toBeGreaterThan(0);

      await page.keyboard.press('Escape');
      // WAITING assertion: the host holds the payload through its out-animation, so a one-shot read here would race it.
      await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeHidden({ timeout: TIMEOUTS.page });

      const afterClose = await readScroll(page);
      expect(
        afterClose.y,
        `the page scrolled when the entity drawer closed (document height ${before.height} -> ${afterClose.height})`
      ).toBe(before.y);
      expect(
        await page.evaluate((el) => document.contains(el), listNode),
        'the results list node was replaced when the drawer closed — the subtree remounted'
      ).toBe(true);
    });

    await test.step('an entity-TAB SWITCH keeps the scroll offset, and the list CONTAINER node survives', async () => {
      // D-18's target for THIS case is the container, not the list. `voter-results-list` sits on `EntityListWithControls`, which the results layout remounts ON PURPOSE via `{#key `${activeElectionId}:${activeEntityType}`}` so a scope-tuple change discards per-scope filter UI state. Aiming the identity assertion at the list across a tab switch produces a test that fails for a CORRECT reason and then gets "fixed" by weakening it. The container sits above that key, so it is the node whose survival actually means "the subtree did not remount".
      const containerNode = await page.getByTestId(testIds.voter.results.listContainer).elementHandle();

      // Bring the tab strip into view explicitly, for the same reason the card action was brought into view above: the fixture's click would otherwise auto-scroll between the baseline read and the click.
      await page.getByTestId(testIds.voter.results.entityTabs).scrollIntoViewIfNeeded();

      const before = await readScroll(page);
      expect(
        before.y,
        'the scrolled start collapsed to 0 before the tab switch — the equality assertion below would pass vacuously'
      ).toBeGreaterThan(0);

      await resultsPage.selectEntityTab('orgs');

      const afterSwitch = await readScroll(page);
      expect(
        afterSwitch.y,
        `the page scrolled when the entity tab changed — \`noScroll\` did not hold (document height ${before.height} -> ${afterSwitch.height})`
      ).toBe(before.y);
      expect(
        await page.evaluate((el) => document.contains(el), containerNode),
        'the results list CONTAINER node was replaced on a tab switch — the whole results subtree remounted, not just the deliberately keyed list'
      ).toBe(true);
    });
  });
});

test.describe('voter-results-redraw — the two view-transition invariants (RNAV-03)', () => {
  test('overlay navigations run no document transition, and any transition under an open dialog carries no named groups', async ({
    page,
    resultsPage,
    entityDetails,
    viewTransitionLog
  }) => {
    test.setTimeout(TIMEOUTS.testMax);
    await landOnResults(page);
    await skipUnlessTransitionsAreObservable(page, viewTransitionLog);

    await test.step('NON-VACUITY: the instrument records a transition for a navigation that IS expected to start one', async () => {
      // An unobserved absence is not evidence of absence. An entity-tab switch is a plain in-app navigation — no `entity`/`id` params, so `isOverlayNavigation` does not exempt it — and it is therefore expected to start a document transition. Proving the log grows here is what makes the two empty logs below mean something.
      await viewTransitionLog.clear();
      await resultsPage.selectEntityTab('orgs');
      await expect
        .poll(async () => (await viewTransitionLog.read()).length, {
          message:
            'the capture seam recorded nothing for a navigation that SHOULD start a document transition — the instrument is dead, so every absence assertion below would pass vacuously',
          timeout: TIMEOUTS.page
        })
        .toBeGreaterThan(0);
    });

    await test.step('overlay OPEN starts no document transition at all', async () => {
      await viewTransitionLog.clear();
      await resultsPage.openEntityDetailsForCard(ORG_PARTY_AA);
      expect(
        await viewTransitionLog.read(),
        'opening the entity drawer started a document View Transition — `isOverlayNavigation` failed to exempt it, and its named groups paint above the top-layer dialog'
      ).toHaveLength(0);
    });

    await test.step('overlay CLOSE starts no document transition at all', async () => {
      await viewTransitionLog.clear();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeHidden({ timeout: TIMEOUTS.page });
      expect(
        await viewTransitionLog.read(),
        'closing the entity drawer started a document View Transition — `isOverlayNavigation` failed to exempt it'
      ).toHaveLength(0);
    });

    await test.step('a transition running under an open dialog carries no named groups', async () => {
      await viewTransitionLog.clear();
      await resultsPage.openEntityDetailsForCard(ORG_PARTY_AA);
      // The drawer's own tabs switch via LOCAL state rather than navigation, so the root layout's `onNavigate` hook never fires for them and `Tabs.svelte` opts into the local `startViewTransition` wrapper instead. That is the one interaction in this surface that starts a transition WHILE a modal dialog is open.
      await entityDetails.selectTab('children');
      await expect
        .poll(async () => (await viewTransitionLog.read()).filter((call) => call.dialogOpen).length, {
          message:
            'no transition was recorded with a dialog open — the case this assertion is about never happened, so asserting over an empty set proves nothing',
          timeout: TIMEOUTS.page
        })
        .toBeGreaterThan(0);

      const underDialog = (await viewTransitionLog.read()).filter((call) => call.dialogOpen);
      expect(
        underDialog.filter((call) => call.names.length > 0),
        'a View Transition ran under an open dialog WITH named groups — every named element becomes its own group painted above the top-layer dialog, which is the layering defect this phase fixes'
      ).toEqual([]);
      expect(
        underDialog.filter((call) => !call.noNames),
        'a View Transition ran under an open dialog without the name-stripping class on the document element — the strip is what the empty name list above depends on'
      ).toEqual([]);
    });
  });
});

test.describe('voter-results-redraw — the drawer host swap and teardown contract (RNAV-05, D-12)', () => {
  test('an entity-to-entity navigation swaps content in the same dialog node, and a dismissal leaves no open dialog', async ({
    page,
    resultsPage,
    entityDetails
  }) => {
    test.setTimeout(TIMEOUTS.testMax);
    await landOnResults(page);

    const dialog = page.getByRole('dialog');

    await test.step('entity A → entity B swaps content in the SAME dialog node rather than reopening', async () => {
      await resultsPage.selectEntityTab('orgs');
      await resultsPage.openEntityDetailsForCard(ORG_PARTY_AA);
      await expect(dialog).toBeVisible({ timeout: TIMEOUTS.slowPage });

      // The dialog's accessible name is fed from the payload's title getter, so it names the entity currently on screen. Asserting it is non-blank FIRST keeps the comparison below from being a comparison of two empty strings.
      await expect(
        dialog,
        'the host dialog carries no accessible name — the comparison below would be vacuous'
      ).toHaveAttribute('aria-label', /\S/, { timeout: TIMEOUTS.element });
      const nameBefore = String(await dialog.getAttribute('aria-label'));

      // The org drawer's Members tab lists the organization's candidates, each wrapped in its own `EntityCardAction` anchor to that candidate's `ResultEntity` route. Clicking one is an entity → entity navigation WITHOUT an intervening close: both URLs carry `entity` + `id`, the opener component is reused across the param change, and the host swaps the payload in place rather than calling `showModal()` a second time.
      await entityDetails.selectTab('children');
      const member = entityDetails.getMemberCards().first();
      await expect(member).toBeVisible({ timeout: TIMEOUTS.slowPage });
      // For a non-subcard card `entity-card-title` holds exactly the entity's name, and the wrapping anchor is the card's ANCESTOR rather than its descendant — so the title is both the readable name and the correct click target.
      const memberTitle = member.getByTestId(testIds.voter.results.cardTitle).first();
      const memberName = (await memberTitle.innerText()).trim();
      expect(
        memberName,
        'the member card carries the same name as the organization — a swap would be unobservable through the accessible name'
      ).not.toBe(nameBefore);

      // Node identity captured BEFORE the navigation, using the same handle technique D-18 uses for the results list.
      const dialogNode = await dialog.elementHandle();
      await memberTitle.click();

      // The observable that distinguishes a SWAP from a REOPEN: exactly one dialog is present across the transition (a reopen would pass through zero), it is the SAME node object, and its accessible name is now the second entity's.
      await expect(dialog, 'the dialog disappeared during the entity-to-entity navigation — it reopened').toHaveCount(
        1
      );
      await expect(dialog, 'the dialog did not adopt the second entity’s accessible name').toHaveAttribute(
        'aria-label',
        memberName,
        { timeout: TIMEOUTS.page }
      );
      expect(
        await page.evaluate((el) => document.contains(el), dialogNode),
        'the dialog node was replaced — the drawer REOPENED for the second entity instead of swapping its content, so everything behind it repainted'
      ).toBe(true);
    });

    await test.step('a dismissal always ends with no open dialog, even though the opener is destroyed mid-close', async () => {
      // This is the assertion spike 034's `PARTIAL` verdict turns on. The host keeps rendering the payload through its out-animation AFTER the opener is destroyed; in the spike the payload read the opener's `entity` prop, got `undefined`, `EntityDetails` threw mid-flush, the host's effect never ran and THE DIALOG STAYED OPEN. D-12's two halves address different links in that chain — the opener-side last-defined-value convention prevents the throw, the host's `<svelte:boundary>` means a future opener that forgets the convention closes badly instead of hanging the whole app. This step proves the OUTCOME; D-12's negative control in 165-06 is what proves the boundary actually fires rather than merely compiling.
      await page.keyboard.press('Escape');
      // WAITING assertion, deliberately: the out-animation means a one-shot visibility read would sometimes catch the dialog still open and sometimes not, which is precisely the intermittent result the project's no-flaky rule forbids. A closed `<dialog>` is `display: none` and leaves the accessibility tree, so `role=dialog` resolving to zero IS "no open dialog remains".
      await expect(
        dialog,
        'a dialog is still open after dismissal — this is the hang spike 034 recorded, where a throw raised inside the host’s render flush aborted the close'
      ).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
    });
  });
});

test.describe('voter-results-redraw — every emitted URL shape resolves to the one page node (RNAV-04, D-08, D-09)', () => {
  /**
   * The shapes this describe enumerates, and the one it deliberately does NOT.
   *
   * D-09 rules backward compatibility a non-goal — no results URL is published anywhere — so the enumerated set is exactly the shapes the APPLICATION ITSELF emits, and nothing else. The cross-type `organizations/candidate/{id}` edge is ABSENT on purpose: `165-01` derived from the live code that no emitter produces it (`EntityCard.svelte`'s `effectiveAction` computes the plural and the singular from the card's own type; its subcards pass no `action` and re-derive the same matching pair; `EntityInfo.svelte`'s parent-nomination link is narrowed to Organization; and `DEFAULT_PARAMS` forces the matching pair for both default routes). See `165-NEGATIVE-CONTROL.md` § 6.
   *
   * Dropping it from the ENUMERATION is not the same as making it unroutable, and the difference matters: D-09 forbids canonicalisation and redirects, D-10 keeps all four params optional, and the leaf `+page.ts` doc-comment describing the shape stays accurate. That the shape still LOADS is pinned one level down, by `page.guards.test.ts`, precisely so "nothing emits it" cannot drift into "so we may as well reject it".
   *
   * ## Why these shapes are visited directly rather than through a fixture call
   *
   * The property under test IS the URL shape — "this shape resolves to the single page node, and the list appears exactly once". Three of the four shapes cannot be produced by clicking: once the app has landed, its own emitters always carry an election segment, and `buildListRoute` deliberately never re-emits the bare picker shape. A fixture call can only express the shapes the app happens to be on, so a direct visit is the only instrument that can state the shape at all.
   *
   * What makes the direct visit sound rather than a guess: every shape below is DERIVED from the URL the application itself landed on after the shared journey walk. The election id and the persistent search params are read off `page.url()`, never hardcoded — the suite knows its seed by external_id, not by database id, which is the reason the rest of this file walks instead of deep-linking. The walk also means these visits are WARM: `165-RESEARCH.md` Pitfall 6 records a known dev-server crash on COLD direct entry to `/results` with no session, and staying inside the walked context keeps this describe clear of it.
   */

  /** The URL shapes, derived at run time from the landed results URL. */
  type ShapeSet = {
    /** `/results?…` — no election segment. With 2+ available elections the election-tab loader does NOT canonicalize, so this is the genuine picker shape. */
    picker: string;
    /** `/results/{election}?…` — the implied-tab shape. No plural segment: the active tab lives on the voter context, and no emitter force-fills one. */
    election: string;
    /** `/results/{election}/{plural}?…` — the explicit-tab shape. */
    electionPlural: string;
  };

  /**
   * Derive the shape set from the URL the application landed on.
   *
   * Asserts the landed URL actually carries an election segment before deriving anything: if the walk ever stopped landing on a per-election URL, every shape below would silently collapse to the same string and the whole describe would pass by testing one shape four times.
   */
  function deriveShapes(landed: string): ShapeSet {
    const url = new URL(landed);
    const segments = url.pathname.split('/').filter(Boolean);
    const resultsAt = segments.indexOf('results');
    expect(resultsAt, `the walk did not land on a /results URL: ${landed}`).toBeGreaterThanOrEqual(0);
    const electionSegment = segments[resultsAt + 1];
    expect(
      electionSegment,
      `the landed results URL carries no election segment (${landed}) — every derived shape below would collapse to the same string`
    ).toBeTruthy();
    return {
      picker: `/results${url.search}`,
      election: `/results/${electionSegment}${url.search}`,
      electionPlural: `/results/${electionSegment}/candidates${url.search}`
    };
  }

  test('the picker, election, election+plural and full entity shapes each render exactly one list', async ({
    page,
    resultsPage
  }) => {
    test.setTimeout(TIMEOUTS.testMax);
    await landOnResults(page);
    const shapes = deriveShapes(page.url());

    const container = page.getByTestId(testIds.voter.results.listContainer);
    const list = page.getByTestId(testIds.voter.results.list);

    await test.step('the PICKER shape renders the picker instead of the list, and still exactly one container', async () => {
      await page.goto(shapes.picker);
      // D-08's "a layout whose param is missing and cannot be implied renders the picker instead of its children", at the election-tab level. The base dataset seeds TWO elections and the walk selects both, so no single-election fallback applies and no loader canonicalization fires — this really is the unimplied case. Asserting the picker is VISIBLE first is what makes the zero-list count below a statement about this branch rather than about a page that failed to render at all.
      await expect(page.getByTestId(testIds.voter.results.electionAccordion)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await expect(
        list,
        'the list rendered on the bare picker shape — the election-tab layout rendered its children with no election implied'
      ).toHaveCount(0);
      await expect(
        container,
        'the full-width list container is not present exactly once on the picker shape'
      ).toHaveCount(1);
    });

    await test.step('the ELECTION-only shape renders the list with the tab IMPLIED, not force-filled into the URL', async () => {
      await page.goto(shapes.election);
      await expect(list, 'the implied-tab shape rendered no list').toHaveCount(1, { timeout: TIMEOUTS.slowPage });
      await expect(container).toHaveCount(1);
      // The no-force-fill rule, observed on the address bar: nothing may rewrite this URL to carry a plural. A redirect here is the Post-88-02 navigation loop, which D-08 exists to keep closed.
      expect(
        new URL(page.url()).pathname,
        'the election-only URL acquired a plural segment — something force-filled the entity tab'
      ).not.toMatch(/\/(candidates|organizations|alliances)/);
    });

    await test.step('the ELECTION+PLURAL shape renders exactly one list', async () => {
      await page.goto(shapes.electionPlural);
      await expect(list, 'the explicit-tab shape rendered no list').toHaveCount(1, { timeout: TIMEOUTS.slowPage });
      await expect(container).toHaveCount(1);
    });

    await test.step('the FULL SAME-TYPE ENTITY shape renders the list underneath and the drawer over it', async () => {
      // Reached by CLICKING rather than by construction: this is the one shape the application's own emitters DO produce from the page we are already on, and the entity id is the card's, which the suite has no other way to know. Clicking means the URL under test is the one `EntityCard` actually emits.
      //
      // The click goes through the card TITLE rather than through `resultsPage.openEntityDetailsForCard`, for the reason already measured at this file's entity-open step: for a card with NO subcards the `entity-card-action` anchor WRAPS the `entity-card` article instead of sitting inside it, so that fixture method's descendant lookup finds nothing and times out. We are on the CANDIDATES tab here, whose cards carry no subcards — the fixture works on the orgs tab (used later in this file) because organization cards do. The title is inside the article and inside the wrapping anchor, so clicking it navigates through the real link either way.
      const card = await resultsPage.getEntityCard((count) => Math.floor(count / 2));
      await card.getByTestId(testIds.voter.results.cardTitle).first().click();
      // WAITING assertion, per this file's rigidity contract: the click starts a client-side navigation, so a one-shot `page.url()` read immediately after it measures the PREVIOUS URL. `toHaveURL` polls, and it doubles as the assertion that the emitted shape really is the 4-segment same-type one.
      await expect(page, 'the card click did not produce a 4-segment same-type entity URL').toHaveURL(
        /\/results\/[^/]+\/(candidates|organizations|alliances)\/(candidate|organization|alliance)\/[^/]+/,
        {
          timeout: TIMEOUTS.page
        }
      );
      await expect(page.getByTestId(testIds.voter.results.entityDetails)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      // The list is STILL exactly one instance underneath the open drawer — the single page node serves the 4-segment shape too, so opening a drawer adds a node rather than replacing the page.
      await expect(list, 'the list was replaced when the entity shape was reached').toHaveCount(1);
      await expect(container).toHaveCount(1);
    });
  });

  test('switching from the IMPLIED default tab to an explicit tab does not remount the list container', async ({
    page,
    resultsPage
  }) => {
    // THE CASE D-08 EXISTS FOR, and the regression spike 033 measured on the required-param tree: there, a `+page.svelte` at each level meant the implied-tab shape and the explicit-tab shape were served by DIFFERENT component instances in DIFFERENT route files, so the first switch away from the implied tab remounted the list. D-08 keeps one page node under four optional params, so both shapes resolve to the same instance and the switch cannot remount it.
    test.setTimeout(TIMEOUTS.testMax);
    await landOnResults(page);
    const shapes = deriveShapes(page.url());

    // Start from the shape with NO plural segment — the implied-tab state. This is the start condition the regression needs; starting from an explicit tab would measure an explicit → explicit switch, which is not the case spike 033 broke on.
    await page.goto(shapes.election);
    await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    expect(
      new URL(page.url()).pathname,
      'the start shape already carries a plural — this is no longer the implied-tab case'
    ).not.toMatch(/\/(candidates|organizations|alliances)/);

    // D-18's target is the CONTAINER, not the list: `voter-results-list` sits on `EntityListWithControls`, which is remounted ON PURPOSE by `{#key `${activeElectionId}:${activeEntityType}`}` so a scope-tuple change discards per-scope filter UI state. Aiming at the list across a tab switch fails for a correct reason (RESEARCH Pitfall 7). The container sits above that key.
    const containerNode = await page.getByTestId(testIds.voter.results.listContainer).elementHandle();

    // The switch goes through the application's own tab emitter, not a constructed URL — `handleEntityTabChange` is the thing that must not remount anything.
    await resultsPage.selectEntityTab('orgs');

    // The switch really happened: the URL now carries the explicit plural it did not carry before. Without this the identity assertion below could pass on a click that did nothing at all.
    await expect(page).toHaveURL(/\/results\/[^/]+\/organizations/, { timeout: TIMEOUTS.page });
    expect(
      await page.evaluate((el) => document.contains(el), containerNode),
      'the list CONTAINER was replaced on the first switch away from the IMPLIED tab — the implied shape and the explicit shape are being served by different component instances, which is exactly the spike-033 remount D-08 is designed to prevent'
    ).toBe(true);
    await expect(page.getByTestId(testIds.voter.results.list)).toHaveCount(1);
  });
});
