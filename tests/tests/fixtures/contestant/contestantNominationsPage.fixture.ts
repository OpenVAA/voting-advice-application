/**
 * @file contestantNominationsPage fixture.
 *
 * Function-fixture for the nominations view of one entity of the Contestant App (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte`): the entity's nominations as cards, or the sentence that says it has none, a note while nominations cannot be edited, one main button and, after a main button that leads elsewhere, Return to the entity's home.
 *
 * Every `open…` step is a full page load, so the view shows the nominations and the settings the server read in that request. What the view shows is read from the state attributes of its container, of a card and of its button, and a name or a symbol as the text of its own element. Widths are measured through the steps of `shared/pageGeometry.fixture.ts`.
 *
 * Surface:
 *  - open(entity)                    — load the view under the entity.
 *  - openInLocale(entity, locale)    — load the view under the entity at the URL of a locale other than the default one, and assert that the document is in it.
 *  - openWithoutEntity()             — load the view's URL in the form that names no entity.
 *  - expectShown(entity)             — the URL is that entity's view and the view's container is visible.
 *  - expectHeadingFocused()          — the view's first-level heading has focus, as after a navigation inside the application.
 *  - expectState({ state, locked, editable? }) — the container says whether it lists nominations or is empty, whether the note is shown and, when asked, whether it offers an entry to the editor.
 *  - expectCardCount(count)          — the list holds that many cards; none means the view holds no list.
 *  - expectCard(index, card)         — the card's election, constituency, symbol and parent as text, a row that is absent, and whether it is confirmed; for a card with a requested parent, the name the user typed and the line under it.
 *  - expectCardOf(card)              — the same, for the one card of the election the card names, wherever it stands in the list.
 *  - expectPendingNote(index, present) — the card holds the line that says it is not confirmed yet, or does not.
 *  - expectDescription(text)        — the view shows that sentence above the nominations it lists, as one paragraph.
 *  - expectEmptySentence(text, kind?) — the view shows that sentence in place of the nominations and, when asked, the sentence says which kind it is.
 *  - expectLockedNote(present, reason?) — the view shows the note that nominations cannot be edited, with its reason and its one support button, or holds no such note.
 *  - expectSupportButtons(count)     — the page renders that many Contact support buttons.
 *  - expectNoEditAction()            — the view holds no control but its main button, Return and the support button.
 *  - expectCardActions(election, shown) — the card of that election offers Edit and Delete, or holds no control.
 *  - pressCardEdit(election)         — follow the card's Edit, a navigation inside the application.
 *  - pressCardDelete(election)       — press the card's Delete and wait until the card asks to confirm, with focus on Confirm.
 *  - cancelDelete(election)          — press the card's Cancel and wait until it offers Delete again, with focus on it.
 *  - confirmDelete(election)         — press the card's Confirm and wait until the write and the re-read are done.
 *  - expectDeleted()                 — the view says, as a status, that a nomination was deleted.
 *  - expectAddAction(shown)          — the view holds exactly one link to the editor's entry below the cards, named by its text; or none.
 *  - pressAdd()                      — follow that link, a navigation inside the application.
 *  - expectReturnAction()            — the view holds exactly one link to the entity's home, named by its text, after the main button.
 *  - expectNoReturnAction()          — the view holds no such link.
 *  - pressReturn()                   — follow that link, a navigation inside the application.
 *  - expectButton(action)            — the main button continues, returns or leads to the editor.
 *  - expectButtonText(text)          — the main button reads that text.
 *  - pressButton(action?)            — press the main button, a navigation inside the application; when an action is given, the button is first asserted to do that.
 *  - expectFitsViewport()            — the page is no wider than its viewport.
 *  - expectCardValuesInsideCard(index) — the card's heading, each of its values and its pending line lie inside the card, and each value shows its whole text.
 *
 * The entity's id is read with the service role by the entity's external id.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
// Use direct import to avoid loading other modules which depend on `$app/...`
import { escapeRegExp } from '../../../../apps/frontend/src/lib/utils/regexp';
import { TIMEOUTS, waitForNavigationFocusReset } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { contestantHomeUrlRe, contestantUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import type { Locator, Page } from '@playwright/test';
import type { EntityGrantTarget, SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import type { NotEditableReason } from './notEditableNote.fixture';

/** The view's path below an entity, and below the app's root in the form that names no entity. */
const VIEW_SUB_PATH = '/nominations';

/** The path of the editor's details step below an entity. */
const EDITOR_DETAILS_SUB_PATH = '/nominations/details';

/** The path of the editor's entry address below an entity. */
const EDITOR_ENTRY_SUB_PATH = '/nominations/elections';

/** What the view's container says it shows: the entity's nominations, or that it has none. */
export type NominationsViewState = 'listed' | 'empty';

/** What the view's main button does: lead on to the entity's next task, back to its home, or to the editor in which a nomination is defined. */
export type NominationsButtonAction = 'continue' | 'return' | 'define';

/** Which sentence stands in place of the nominations, as the sentence names it in `data-empty`: the entity can define a nomination, nominations cannot be edited, or no election admits the entity. */
export type NominationsEmptyKind = 'define' | 'locked' | 'noElection';

/** Why nominations cannot be edited, as the view's note names it in `data-reason`. */
export type NominationsLockedReason = Extract<NotEditableReason, 'nominationsLocked' | 'nominationsAnswersLocked'>;

/** What a card is expected to show. A row given as `null` is expected to be absent. */
export interface ExpectedNominationCard {
  /** The card's heading: the election's name. */
  election: string;
  /** The constituency's name. */
  constituency: string;
  /** The election symbol, or `null` for a card with no symbol row. */
  symbol: string | null;
  /** The name of what the nomination stands under, or `null` for a card with no such row. */
  parent: string | null;
  /** Whether the card says the nomination is confirmed. */
  confirmed: boolean;
  /** The name of a parent the user typed. With it, `parent` is `null`: the parent row shows this name, and the line that says it is a request stands under it. */
  requestedParent?: string;
}

/** Every element a user can operate or type into. */
const CONTROLS = 'a, button, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"]';

/**
 * Create the fixture for the nominations view of an entity.
 *
 * @param page - The page the fixture drives.
 * @param admin - A service-role client of the suite's project, used to read an entity's id by its external id.
 * @returns The fixture's steps: `open`, `openInLocale`, `openWithoutEntity`, `expectShown`, `expectHeadingFocused`, `expectState`, `expectCardCount`, `expectCard`, `expectCardOf`, `expectPendingNote`, `expectDescription`, `expectEmptySentence`, `expectLockedNote`, `expectSupportButtons`, `expectNoEditAction`, `expectCardActions`, `pressCardEdit`, `pressCardDelete`, `cancelDelete`, `confirmDelete`, `expectDeleted`, `expectAddAction`, `pressAdd`, `expectReturnAction`, `expectNoReturnAction`, `pressReturn`, `expectButton`, `expectButtonText`, `pressButton`, `expectFitsViewport` and `expectCardValuesInsideCard`.
 */
export function createContestantNominationsPage(page: Page, admin: SupabaseAdminClient) {
  const ids = testIds.contestant.nominations;
  const container = page.getByTestId(ids.page);
  const cards = container.getByTestId(ids.list).getByTestId(ids.card);
  const lockedNote = container.getByTestId(ids.lockedNote);
  const button = container.getByTestId(ids.continue);
  const returnLink = container.getByTestId(ids.return);
  const addLink = container.getByTestId(ids.add);
  const geometry = createPageGeometry(page);

  /**
   * The view's path under `entity`, in the form the default locale is served at: no route of the application holds a locale segment.
   */
  async function viewPath(entity: EntityGrantTarget): Promise<string> {
    const entityId = await admin.entityId(entity);
    const home = buildRoute({
      route: 'ContestantAppEntityHome',
      locale: 'en',
      params: { entityType: entity.entityType, entityId }
    });
    return `${home}${VIEW_SUB_PATH}`;
  }

  /**
   * The one card whose heading is the name of `election`.
   */
  function cardOf(election: string): Locator {
    return cards.filter({
      has: page.getByTestId(ids.election).and(page.getByRole('heading', { name: election, exact: true }))
    });
  }

  /**
   * Assert that a row of a card shows `text`, or that the card holds no such row when `text` is `null`.
   */
  async function expectRow(shown: Locator, testId: string, text: string | null): Promise<void> {
    const row = shown.getByTestId(testId);
    if (text === null) await expect(row).toHaveCount(0);
    else await expect(row).toHaveText(text);
  }

  /**
   * Assert what one card shows: its heading and each row's value as text, no row for a member given as `null`, and whether it says the nomination is confirmed.
   * @throws If the card is given both a parent and a requested parent: a nomination has one or the other.
   */
  async function expectCardShows(shown: Locator, card: ExpectedNominationCard): Promise<void> {
    if (card.requestedParent !== undefined && card.parent !== null)
      throw new Error('contestantNominationsPage: a card has a parent or a requested parent, not both');
    await expect(shown).toBeVisible({ timeout: TIMEOUTS.slowPage });
    await expect(shown).toHaveAttribute('data-confirmed', String(card.confirmed));
    await expect(shown.getByTestId(ids.election)).toHaveText(card.election);
    await expectRow(shown, ids.constituency, card.constituency);
    await expectRow(shown, ids.electionSymbol, card.symbol);
    if (card.requestedParent === undefined) {
      await expectRow(shown, ids.parent, card.parent);
    } else {
      await expect(shown.getByTestId(ids.parent)).toHaveText(new RegExp(`^\\s*${escapeRegExp(card.requestedParent)}`));
      await expect(shown.getByTestId(ids.requestedParent)).toBeVisible();
    }
    await expect(shown.getByTestId(ids.state)).toBeVisible();
  }

  return {
    /**
     * Load the view under `entity`, as a new document.
     */
    async open(entity: EntityGrantTarget): Promise<void> {
      await page.goto(await viewPath(entity));
    },

    /**
     * Load the view under `entity` at the URL of `locale`, as a new document, and assert that the document says it is in that locale: the application is then shown in it, and so is every name the view reads.
     * @param locale - A locale the application supports other than its default one, which is served at a URL that begins with the locale.
     */
    async openInLocale(entity: EntityGrantTarget, locale: string): Promise<void> {
      await page.goto(`/${locale}${await viewPath(entity)}`);
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.lang), { timeout: TIMEOUTS.page })
        .toBe(locale);
    },

    /**
     * Load the view's URL in the form that names no entity, as a new document. The application resolves it to the one entity the session's user edits.
     */
    async openWithoutEntity(): Promise<void> {
      await page.goto(`${buildRoute({ route: 'ContestantAppHome', locale: 'en' })}${VIEW_SUB_PATH}`);
    },

    /**
     * Assert that the browser shows the view of `entity`: the URL is a nominations URL that carries the entity's type and id, and the view's container is visible.
     */
    async expectShown(entity: EntityGrantTarget): Promise<void> {
      await expect(page).toHaveURL(contestantUrlRe(VIEW_SUB_PATH), { timeout: TIMEOUTS.slowPage });
      const entityId = await admin.entityId(entity);
      expect(
        new URL(page.url()).pathname,
        `the nominations view shown is that of the ${entity.entityType} ${entity.externalId}`
      ).toContain(`/${entity.entityType}/${entityId}`);
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the view is shown and its first-level heading has focus, where a navigation inside the application leaves it.
     */
    async expectHeadingFocused(): Promise<void> {
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page.getByRole('heading', { level: 1 })).toBeFocused({ timeout: TIMEOUTS.page });
    },

    /**
     * Assert what the view's container says: whether it lists nominations or is empty, and whether the note is shown. With `editable` given, also whether the view offers an entry to the editor.
     */
    async expectState({
      state,
      locked,
      editable
    }: {
      state: NominationsViewState;
      locked: boolean;
      editable?: boolean;
    }): Promise<void> {
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(container).toHaveAttribute('data-nominations-state', state);
      await expect(container).toHaveAttribute('data-nominations-locked', String(locked));
      if (editable !== undefined)
        await expect(container).toHaveAttribute('data-nominations-editable', String(editable));
    },

    /**
     * Assert that the view's list holds `count` cards. With no card the view holds no list either.
     */
    async expectCardCount(count: number): Promise<void> {
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(cards).toHaveCount(count);
      if (count === 0) await expect(container.getByTestId(ids.list)).toHaveCount(0);
    },

    /**
     * Assert what the card at `index` shows: its heading and each row's value as text, no row for a member given as `null`, and whether it says the nomination is confirmed. For a card with a requested parent, the parent row begins with the name the user typed and the card holds the line that says the name is a request.
     * @throws If the card is given both a parent and a requested parent: a nomination has one or the other.
     */
    async expectCard(index: number, card: ExpectedNominationCard): Promise<void> {
      await expectCardShows(cards.nth(index), card);
    },

    /**
     * Assert what the one card of an election shows, wherever it stands in the list: the same facts as `expectCard`, for the card whose heading is `card.election`. The nominations the application wrote state no order of their own, so their cards are named by their election and not by their place.
     * @throws If the card is given both a parent and a requested parent: a nomination has one or the other.
     */
    async expectCardOf(card: ExpectedNominationCard): Promise<void> {
      const shown = cards.filter({
        has: page.getByTestId(ids.election).and(page.getByRole('heading', { name: card.election, exact: true }))
      });
      await expect(shown, `the view lists one nomination in ${card.election}`).toHaveCount(1, {
        timeout: TIMEOUTS.slowPage
      });
      await expectCardShows(shown, card);
    },

    /**
     * Assert that the card at `index` holds the line saying the nomination is not confirmed yet, or that it holds none.
     */
    async expectPendingNote(index: number, present: boolean): Promise<void> {
      const shown = cards.nth(index);
      await expect(shown).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const note = shown.getByTestId(ids.pendingNote);
      if (present) await expect(note).toBeVisible();
      else await expect(note).toHaveCount(0);
    },

    /**
     * Assert that the view shows `text` as the sentence above the nominations it lists: one paragraph of the view reads exactly that, and the list is shown. The sentence is read in English, so the page is one opened in that locale.
     */
    async expectDescription(text: string): Promise<void> {
      await expect(container.getByTestId(ids.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const sentence = container.getByRole('paragraph').filter({ hasText: text });
      await expect(sentence, 'one paragraph of the view holds the sentence').toHaveCount(1);
      await expect(sentence).toHaveText(text);
    },

    /**
     * Assert that the view shows `text` as the sentence that stands in place of the nominations. With `kind` given, also that the sentence says it is of that kind.
     */
    async expectEmptySentence(text: string, kind?: NominationsEmptyKind): Promise<void> {
      const sentence = container.getByTestId(ids.empty);
      await expect(sentence).toHaveText(text, { timeout: TIMEOUTS.slowPage });
      if (kind !== undefined) await expect(sentence).toHaveAttribute('data-empty', kind);
    },

    /**
     * Assert that the view shows the note saying nominations cannot be edited, naming its reason and holding exactly one Contact support button, or that the view holds no such note.
     * @param reason - The reason the note names. Without it the note is expected to name the lock on nominations.
     */
    async expectLockedNote(present: boolean, reason: NominationsLockedReason = 'nominationsLocked'): Promise<void> {
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
      if (!present) {
        await expect(lockedNote).toHaveCount(0);
        return;
      }
      await expect(lockedNote).toBeVisible();
      await expect(lockedNote).toHaveAttribute('data-reason', reason);
      await expect(lockedNote.getByTestId(testIds.contestant.common.contactSupport)).toHaveCount(1);
    },

    /**
     * Assert how many Contact support buttons the whole page renders, wherever they are: in the note, or in the view's body.
     */
    async expectSupportButtons(count: number): Promise<void> {
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(testIds.contestant.common.contactSupport)).toHaveCount(count);
    },

    /**
     * Assert that the view offers nothing to edit: its main button is there, and it holds no link, button or form control other than that button, Return and the Contact support button.
     */
    async expectNoEditAction(): Promise<void> {
      await expect(button).toBeVisible({ timeout: TIMEOUTS.slowPage });
      // reason: the set asserted empty is a negation — every control of whatever kind that is not one of three test ids — and neither getByTestId nor getByRole expresses "not". The selector reads element names, roles and test ids, none of which is a translated string.
      // eslint-disable-next-line playwright/no-restricted-locators
      const others = container.locator(
        `:is(${CONTROLS}):not([data-testid="${ids.continue}"]):not([data-testid="${ids.return}"]):not([data-testid="${testIds.contestant.common.contactSupport}"])`
      );
      await expect(others).toHaveCount(0);
    },

    /**
     * Assert that the card of `election` offers Edit — a link to the editor's details step under an entity — and Delete, a button, each named by the text it shows; or, with `shown` false, that the card holds no control at all.
     */
    async expectCardActions(election: string, shown: boolean): Promise<void> {
      const card = cardOf(election);
      await expect(card, `the view lists one nomination in ${election}`).toHaveCount(1, { timeout: TIMEOUTS.slowPage });
      if (!shown) {
        // reason: the set asserted empty is every control of whatever kind inside the card, which no getByRole or getByTestId names as one. The selector reads element names and roles, none of which is a translated string.
        // eslint-disable-next-line playwright/no-restricted-locators
        await expect(card.locator(CONTROLS)).toHaveCount(0);
        return;
      }
      const edit = card.getByTestId(ids.cardEdit);
      const remove = card.getByTestId(ids.cardDelete);
      await expect(edit).toBeVisible();
      await expect(remove).toBeVisible();
      expect(await edit.evaluate((element) => element.tagName), 'Edit is an anchor').toBe('A');
      await expect(edit).toHaveAttribute('href', contestantUrlRe(EDITOR_DETAILS_SUB_PATH));
      expect(await remove.evaluate((element) => element.tagName), 'Delete is a button').toBe('BUTTON');
      for (const control of [edit, remove]) {
        const text = ((await control.textContent()) ?? '').replace(/\s+/g, ' ').trim();
        expect(text, 'the control holds text').not.toBe('');
        await expect(control).toHaveAccessibleName(text);
      }
    },

    /**
     * Follow the Edit of the card of `election`. The press is a navigation inside the application and loads no new document. The link is one the server renders, so the press waits until the page has hydrated, before which the browser follows it itself.
     */
    async pressCardEdit(election: string): Promise<void> {
      await waitForNavigationFocusReset(page);
      await cardOf(election).getByTestId(ids.cardEdit).click({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Press the Delete of the card of `election`, and wait until the card asks whether to delete, with its Confirm described by the question and focused, and no Delete left in the card. Nothing is written.
     *
     * Delete is a button the script handles, so the page must have hydrated: it is pressed after a navigation inside the application or a press of another control of the view. A press before that leaves the card asking nothing, and the step fails on the question.
     */
    async pressCardDelete(election: string): Promise<void> {
      const card = cardOf(election);
      await card.getByTestId(ids.cardDelete).click({ timeout: TIMEOUTS.slowPage });
      const prompt = card.getByTestId(ids.deletePrompt);
      const confirm = card.getByTestId(ids.deleteConfirm);
      await expect(prompt).toBeVisible();
      await expect(confirm).toBeFocused();
      await expect(confirm).toHaveAttribute('aria-describedby', (await prompt.getAttribute('id')) ?? '');
      await expect(card.getByTestId(ids.deleteCancel)).toBeVisible();
      await expect(card.getByTestId(ids.cardDelete)).toHaveCount(0);
      await expect(page.getByRole('dialog')).toHaveCount(0);
    },

    /**
     * Press the Cancel of the card of `election`, and wait until the card offers Delete again, focused, and asks nothing.
     */
    async cancelDelete(election: string): Promise<void> {
      const card = cardOf(election);
      await card.getByTestId(ids.deleteCancel).click({ timeout: TIMEOUTS.slowPage });
      await expect(card.getByTestId(ids.deletePrompt)).toHaveCount(0);
      await expect(card.getByTestId(ids.cardDelete)).toBeFocused();
    },

    /**
     * Press the Confirm of the card of `election`, and wait until the write and the re-read of the page's data are done: the card then asks nothing any more, whether it is still listed or not.
     */
    async confirmDelete(election: string): Promise<void> {
      const card = cardOf(election);
      await card.getByTestId(ids.deleteConfirm).click({ timeout: TIMEOUTS.slowPage });
      await expect(card.getByTestId(ids.deletePrompt)).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the view says, as a status message, that a nomination was deleted, and holds no message of a refused delete.
     */
    async expectDeleted(): Promise<void> {
      const status = container.getByTestId(ids.deleted);
      await expect(status).toHaveAttribute('role', 'status');
      await expect(status.getByRole('paragraph')).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(container.getByTestId(ids.deleteMessage)).not.toHaveAttribute('data-outcome');
    },

    /**
     * Assert that the view offers Add a nomination: exactly one link — an anchor whose address is the editor's entry under an entity — that is named by the text it shows and stands after the list of cards. With `shown` false, that the view holds no such link.
     */
    async expectAddAction(shown: boolean): Promise<void> {
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
      if (!shown) {
        await expect(cards.first()).toBeVisible({ timeout: TIMEOUTS.slowPage });
        await expect(addLink).toHaveCount(0);
        return;
      }
      await expect(addLink).toHaveCount(1, { timeout: TIMEOUTS.slowPage });
      await expect(addLink).toBeVisible();
      expect(await addLink.evaluate((element) => element.tagName), 'Add is an anchor').toBe('A');
      await expect(addLink).toHaveAttribute('href', contestantUrlRe(EDITOR_ENTRY_SUB_PATH));
      const text = ((await addLink.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      expect(text, 'Add holds text').not.toBe('');
      await expect(addLink).toHaveAccessibleName(text);
      const order = await container.evaluate(
        (root, [listId, addId]) =>
          [...root.querySelectorAll('[data-testid]')]
            .map((element) => element.getAttribute('data-testid'))
            .filter((id) => id === listId || id === addId),
        [ids.list, ids.add]
      );
      expect(order, 'Add stands after the list of cards').toEqual([ids.list, ids.add]);
    },

    /**
     * Follow Add a nomination to the editor's entry. The press is a navigation inside the application and loads no new document. The link is one the server renders, so the press waits until the page has hydrated, before which the browser follows it itself.
     */
    async pressAdd(): Promise<void> {
      await waitForNavigationFocusReset(page);
      await addLink.click({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the view offers the way back to the entity's home beside a main button that leads elsewhere: exactly one link — an anchor whose address is the home of an entity — that is named by the text it shows and stands after the main button.
     */
    async expectReturnAction(): Promise<void> {
      await expect(button).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(returnLink).toHaveCount(1, { timeout: TIMEOUTS.slowPage });
      await expect(returnLink).toBeVisible();
      expect(await returnLink.evaluate((element) => element.tagName), 'Return is an anchor').toBe('A');
      await expect(returnLink).toHaveAttribute('href', contestantHomeUrlRe());
      const text = ((await returnLink.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      expect(text, 'Return holds text').not.toBe('');
      await expect(returnLink).toHaveAccessibleName(text);
      const order = await container.evaluate(
        (root, [mainId, returnId]) =>
          [...root.querySelectorAll('[data-testid]')]
            .map((element) => element.getAttribute('data-testid'))
            .filter((id) => id === mainId || id === returnId),
        [ids.continue, ids.return]
      );
      expect(order, 'Return stands after the main button').toEqual([ids.continue, ids.return]);
    },

    /**
     * Assert that the view holds no link back to the entity's home beside its main button, as where the main button itself returns there.
     */
    async expectNoReturnAction(): Promise<void> {
      await expect(button).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(returnLink).toHaveCount(0);
    },

    /**
     * Follow Return to the entity's home. The press is a navigation inside the application and loads no new document. The link is one the server renders, so the press waits until the page has hydrated, before which the browser follows it itself.
     */
    async pressReturn(): Promise<void> {
      await waitForNavigationFocusReset(page);
      await returnLink.click({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert what the view's main button does. The button says so only once the entity's tasks are known.
     */
    async expectButton(action: NominationsButtonAction): Promise<void> {
      await expect(button).toHaveAttribute('data-action', action, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert the text the view's main button reads. The text is read in English, so the page is one opened in that locale.
     */
    async expectButtonText(text: string): Promise<void> {
      await expect(button).toHaveText(text, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Press the view's main button. The press is a navigation inside the application and loads no new document. The button is a link the server can render, so the press waits until the page has hydrated, before which the browser follows it itself.
     * @param action - What the button is expected to do. With it, the button is asserted to say so before it is pressed.
     */
    async pressButton(action?: NominationsButtonAction): Promise<void> {
      if (action !== undefined)
        await expect(button).toHaveAttribute('data-action', action, { timeout: TIMEOUTS.slowPage });
      await waitForNavigationFocusReset(page);
      await button.click({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the page is no wider than its viewport.
     */
    async expectFitsViewport(): Promise<void> {
      await geometry.expectNoHorizontalOverflow();
    },

    /**
     * Assert that the card at `index` holds what it shows: its heading, the value of each of its rows and, where it has one, its pending line lie wholly inside the card's box, and no value's text reaches beyond the value's own box. A card always has a constituency and a state, so it holds two values at least.
     */
    async expectCardValuesInsideCard(index: number): Promise<void> {
      const shown = cards.nth(index);
      await expect(shown).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const card = `card ${index + 1}`;
      await geometry.expectInside(shown.getByTestId(ids.election), shown, `the heading of ${card}`);

      // A value is the definition of its row's label. They are counted, so that each one the card holds is measured, whichever rows it has.
      const values = shown.getByRole('definition');
      const valueCount = await values.count();
      expect(valueCount, `${card} holds its constituency and its state at least`).toBeGreaterThanOrEqual(2);
      for (let value = 0; value < valueCount; value++) {
        await geometry.expectInside(values.nth(value), shown, `value ${value + 1} of ${card}`);
        await geometry.expectShowsWholeText(values.nth(value), `value ${value + 1} of ${card}`);
      }

      const pendingLines = shown.getByTestId(ids.pendingNote);
      const pendingLineCount = await pendingLines.count();
      for (let line = 0; line < pendingLineCount; line++) {
        await geometry.expectInside(pendingLines.nth(line), shown, `the pending line of ${card}`);
      }
    }
  };
}

/** The steps of the nominations-view fixture. */
export type ContestantNominationsPageFixture = ReturnType<typeof createContestantNominationsPage>;
