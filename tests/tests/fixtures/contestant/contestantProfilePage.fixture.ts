/**
 * @file contestantProfilePage fixture.
 *
 * Function-fixture for the profile (basic-info) page of a candidate or an organization at `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte`.
 *
 * Surface:
 *  - uploadPortrait({ path, expectError? })       — upload an image file via the file chooser on the profile-image-upload button. When expectError is supplied, additionally assert the i18n error message on the shared input-error node scoped inside the profile-image-upload container.
 *  - expectStaticInfo({ name? })                  — assert the first name the page shows.
 *  - getQuestion(label)                           — locate a per-question wrapper by displayed label (string | RegExp).
 *  - expectQuestionsVisible(labels)               — assert each label appears inside a profile-info-item.
 *  - expectQuestionsAbsent(labels)                — assert none of the labels is present.
 *  - expectRequiredBadge(label)                   — assert the question matching `label` carries a required marker.
 *  - fillQuestion(label, value)                   — locate by label + fill the inner input/textarea.
 *  - commitQuestion(label, value)                 — fill the question's control and leave it, so that the page takes the value into the draft.
 *  - expectQuestionValue(label, value)            — assert the value the question matching `label` shows in its control.
 *  - expectQuestionNotAsked(label)                — assert the profile holds no question matching `label`.
 *  - submit()                                     — click profile-submit.
 *  - expectSubmitMessage()                        — assert the post-submit success / advance state by waiting for navigation away from /profile.
 *  - open() / reload()                            — open the profile of the session's one entity, or reload it, and wait until the entity's data is on the page.
 *  - expectNoNominationsSection()                 — once the entity's data is on the page, the page shows nothing of the entity's nominations.
 *  - expectIdentity({ entityType, nameState })    — the identity section and its two state attributes.
 *  - expectNameNote(present)                      — the sentence that says whether the name can be changed.
 *  - fillName / fillShortName (locale, text)      — an organization's two multilingual fields, one locale's entry.
 *  - expectName / expectShortName (locale, text)  — the value one locale's field shows.
 *  - expectNamesLocked() / expectNamesEditable()  — every rendered field of the two, disabled or enabled.
 *  - expandNameTranslations()                     — show every locale's field of the two.
 *  - expectNameRequiredBadge(present)             — the required badge of the organization's name.
 *  - fillFirstName / fillLastName (text)          — a candidate's two name inputs.
 *  - expectPersonNames(first, last)               — the values the two show.
 *  - expectPersonNamesEditable()                  — both enabled.
 *  - setColor(hex) / clearColor()                 — commit a colour to the hex field, or empty it.
 *  - expectColor(hex) / expectNoColorField()      — the hex field's value, or the absence of the whole field.
 *  - typeInvalidColor(text) / expectColorError()  — commit a text that is no colour to the hex field, and the error the field then shows.
 *  - expectFitsViewport()                         — the page is no wider than its viewport.
 *  - expectColorRowFits()                         — the colour field's controls lie inside its row, beside the label, and the picker is a pointer target of full size.
 *  - expectLockedInfoRowFits(label)               — the row of a locked info question: its control lies inside the row and the viewport, beside a label that shows its whole text.
 *  - expectPersonNameRowsFit()                    — the same, for the rows of a candidate's two name inputs.
 *  - uploadLogo(path) / expectLogo()              — choose an image file, and the thumbnail that shows one.
 *  - save({ expect })                             — press Save and wait for the outcome the caller names: the navigation away, or a message.
 *  - saveThroughReread()                          — press Save where the save stays and reads the user's entities again, and assert that the page was not replaced by that read.
 *  - expectSaveMessage(outcome)                   — the outcome the message region carries.
 *  - expectSubmitLabel(kind)                      — the Save button reads as one that continues or as one that returns.
 *  - expectSaveFocused()                          — focus is on the Save button.
 *  - leaveThroughMenu({ answer })                 — try to leave through the menu's home item, and answer the question the page asks about unsaved changes.
 *
 * **General API principle:** question methods take the DISPLAYED label (string | RegExp). Specs holding externalIds resolve to labels via base at the call site.
 *
 * **Rigidity contract:** NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions. This fixture is one of three that DOES use `expect.soft` — 3 call sites, in the profile-field readers below, so one wrong field reports alongside the rest of the form rather than masking it. It is outside `SOFT_ASSERTION_BUDGETS`, which is deliberately scoped to `voter-journey.spec.ts`; see the note above that table in `playwright.config.ts`.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildEntityLessRoute, contestantUrlOutsideRe, contestantUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import { createMultilingualTextField } from '../shared/multilingualTextFieldFixture.fixture';
import { createNavMenu } from '../shared/navMenu.fixture';
import { createPageGeometry, MIN_TARGET_SIZE } from '../shared/pageGeometry.fixture';
import type { Dialog, Locator, Page } from '@playwright/test';

/**
 * Image-upload error variant keys. Mapped to i18n message keys at `apps/frontend/src/lib/components/input/Input.svelte:270-272`:
 *  - invalidFile  → 'components.input.error.invalidFile'  ("Invalid file type")
 *  - oversizeFile → 'components.input.error.oversizeFile' ("File too large")
 *
 * The exact rendered strings depend on the active i18n bundle; the fixture asserts on a stable substring rather than the full localized message so spec assertions remain robust across locale switches.
 */
const IMAGE_ERROR_CONTAINS: Readonly<Record<'invalidFile' | 'oversizeFile', RegExp>> = Object.freeze({
  invalidFile: /invalid|not.*image|wrong.*format/i,
  oversizeFile: /large|size|max/i
});

/** The required badge's screen-reader text in English, and not the "Required language" line of a field that requires one locale. */
const REQUIRED_BADGE_TEXT = /Required(?! language)/;

/** The name of the property a step sets on an element of the page, to find out later whether the element is still the same one. */
const KEPT_ELEMENT_PROPERTY = 'e2eKeptElement';

/** The file name of the request with which the app reads its server loads again without a navigation. */
const LOAD_DATA_REQUEST = '__data.json';

/** The accessible name of the colour field's picker in English: the field's label and the picker's own. */
const COLOR_PICKER_NAME = /Colou?r picker/i;

/** The value of the identity section's `data-name-state` attribute. */
export type ProfileNameState = 'editable' | 'locked-confirmed' | 'locked-answers';

/** The value of the save-message region's `data-outcome` attribute while it holds a message. */
export type ProfileSaveOutcome = 'failed' | 'name-refused';

/** What the Save button's label says the save leads to: onward, or back. */
export type ProfileSubmitLabel = 'continue' | 'return';

/** The word of the English label that tells the two kinds apart: "Save and Continue" or "Continue" from "Save and Return" or "Return". */
const SUBMIT_LABEL_TEXT: Readonly<Record<ProfileSubmitLabel, RegExp>> = Object.freeze({
  continue: /Continue/,
  return: /Return/
});

export function createContestantProfilePage(page: Page) {
  /**
   * Locate the per-question wrapper (data-testid="contestant-profile-info-item") whose visible content matches `label` (string | RegExp). Returns the filtered Locator without awaiting — caller chains an action.
   */
  function questionLocator(label: string | RegExp): Locator {
    return page.getByTestId(testIds.contestant.profile.infoItem).filter({ hasText: label });
  }

  const multilingual = createMultilingualTextField(page);
  const navMenu = createNavMenu(page);
  const geometry = createPageGeometry(page);
  const identity = page.getByTestId(testIds.contestant.profile.identity);
  /** The containers of an organization's two multilingual fields. */
  const nameField = page.getByTestId(testIds.contestant.profile.name);
  const shortNameField = page.getByTestId(testIds.contestant.profile.shortName);
  const firstNameInput = page.getByTestId(testIds.contestant.profile.firstName);
  const lastNameInput = page.getByTestId(testIds.contestant.profile.lastName);
  const colorField = page.getByTestId(testIds.contestant.profile.color);
  const colorHexInput = page.getByTestId(testIds.contestant.profile.colorHex);
  const submitButton = page.getByTestId(testIds.contestant.profile.submit);
  const saveMessage = page.getByTestId(testIds.contestant.profile.saveMessage);

  /**
   * Wait until the entity's data is on the page. The identity section's `data-entity-loaded` attribute reads `true` once the page's store holds the entity, which is after the page has hydrated: an edit made before that reaches no handler and is lost.
   */
  async function expectEntityLoaded(): Promise<void> {
    await expect(identity).toHaveAttribute('data-entity-loaded', 'true', { timeout: TIMEOUTS.slowPage });
  }

  /** Fill a single-line field and leave it, which is when the page takes the value. */
  async function commit(field: Locator, text: string): Promise<void> {
    await expect(field).toBeEnabled({ timeout: TIMEOUTS.page });
    await field.fill(text);
    await field.blur();
  }

  /** Assert that every rendered field of `container` is disabled, or that every one is enabled. */
  async function expectFieldsDisabled(container: Locator, disabled: boolean): Promise<void> {
    await expect(container.getByRole('textbox', { disabled }).first()).toBeVisible({ timeout: TIMEOUTS.page });
    await expect(container.getByRole('textbox', { disabled: !disabled })).toHaveCount(0);
  }

  /**
   * Assert that a single-line field fits its row: the control and the label lie wholly inside the row, side by side, the control lies inside the viewport, and the label shows its whole text. The row clips what does not fit instead of widening the page, so a control pushed out of it, or a label running over it, leaves the page's width as it was.
   * @param control - The row's labelled control.
   * @param what - What the row is, for the failure messages.
   * @throws If the control has no `id`, by which its label names it.
   */
  async function expectRowFits(control: Locator, what: string): Promise<void> {
    await expect(control).toBeVisible({ timeout: TIMEOUTS.page });
    const id = await control.getAttribute('id');
    if (!id) throw new Error(`contestantProfilePage: the control of ${what} has no id`);
    // reason: the row's label is a `<label>` element, which has no role and carries no test id, and the row is that label's parent, which has neither; the label is the one that names the control by its id, and its parent is reached by the parent axis.
    // eslint-disable-next-line playwright/no-restricted-locators
    const label = page.locator(`label[for="${id}"]`);
    // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
    const row = label.locator('xpath=..');
    await geometry.expectInside(control, row, `the control in ${what}`);
    await geometry.expectInside(label, row, `the label in ${what}`);
    await geometry.expectNoOverlap(control, label, `the control and the label of ${what}`);
    await geometry.expectWithinViewportWidth(control, `the control of ${what}`);
    await geometry.expectShowsWholeText(label, `the label of ${what}`);
  }

  return {
    /**
     * Open the profile of the one entity the session's user edits, and wait until the entity's data is on the page.
     */
    async open(): Promise<void> {
      await page.goto(buildEntityLessRoute({ route: 'ContestantAppProfile', locale: 'en' }));
      await expectEntityLoaded();
    },

    /**
     * Reload the page, and wait until the entity's data is on it again. Whatever was edited and not saved is gone afterwards, the names, the colour and the logo included.
     */
    async reload(): Promise<void> {
      await page.reload();
      await expectEntityLoaded();
    },

    /**
     * Assert that the profile shows nothing of the entity's nominations. The identity section is awaited first until it says the entity's data is loaded, which is when the store that holds the entity's nominations is filled; only then is the page read for a nomination's constituency and its election symbol, which the nominations view shows and the profile does not.
     */
    async expectNoNominationsSection(): Promise<void> {
      await expectEntityLoaded();
      await expect(page.getByTestId(testIds.contestant.nominations.constituency)).toHaveCount(0);
      await expect(page.getByTestId(testIds.contestant.nominations.electionSymbol)).toHaveCount(0);
    },

    /**
     * Assert that the identity section is shown for an entity of `entityType`, with its name fields in `nameState`.
     */
    async expectIdentity(props: {
      entityType: 'candidate' | 'organization';
      nameState: ProfileNameState;
    }): Promise<void> {
      await expect(identity).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(identity).toHaveAttribute('data-entity-type', props.entityType);
      await expect(identity).toHaveAttribute('data-name-state', props.nameState);
    },

    /**
     * Assert that the sentence saying whether the name can be changed is shown, or that the identity section holds none.
     */
    async expectNameNote(present: boolean): Promise<void> {
      await expect(identity).toBeVisible({ timeout: TIMEOUTS.page });
      const note = identity.getByTestId(testIds.contestant.profile.nameNote);
      if (present) await expect(note).toBeVisible();
      else await expect(note).toHaveCount(0);
    },

    /**
     * Enter an organization's name in one locale. A locale other than the displayed and the required one has a field only after `expandNameTranslations`.
     */
    async fillName(locale: string, text: string): Promise<void> {
      await expect(multilingual.localeField(nameField, locale)).toBeEnabled({ timeout: TIMEOUTS.page });
      await multilingual.setLocaleValue(nameField, locale, text);
    },

    /**
     * Enter an organization's short name in one locale. A locale other than the displayed one has a field only after `expandNameTranslations`.
     */
    async fillShortName(locale: string, text: string): Promise<void> {
      await expect(multilingual.localeField(shortNameField, locale)).toBeEnabled({ timeout: TIMEOUTS.page });
      await multilingual.setLocaleValue(shortNameField, locale, text);
    },

    /**
     * Assert the value one locale's field of an organization's name shows. An empty string is a field with no entry.
     */
    async expectName(locale: string, text: string): Promise<void> {
      await expect(multilingual.localeField(nameField, locale)).toHaveValue(text, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert the value one locale's field of an organization's short name shows.
     */
    async expectShortName(locale: string, text: string): Promise<void> {
      await expect(multilingual.localeField(shortNameField, locale)).toHaveValue(text, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert that every rendered field of an organization's name and short name is disabled.
     */
    async expectNamesLocked(): Promise<void> {
      await expectFieldsDisabled(nameField, true);
      await expectFieldsDisabled(shortNameField, true);
    },

    /**
     * Assert that every rendered field of an organization's name and short name is enabled.
     */
    async expectNamesEditable(): Promise<void> {
      await expectFieldsDisabled(nameField, false);
      await expectFieldsDisabled(shortNameField, false);
    },

    /**
     * Show every locale's field of an organization's name and of its short name.
     */
    async expandNameTranslations(): Promise<void> {
      await expect(nameField).toBeVisible({ timeout: TIMEOUTS.page });
      await multilingual.openTranslations(nameField);
      await multilingual.openTranslations(shortNameField);
    },

    /**
     * Assert that an organization's name carries the required badge, or that it carries none. The badge is read by its screen-reader text in the locale `open` uses; the line under the field that names the required language begins with the same word and is not the badge.
     */
    async expectNameRequiredBadge(present: boolean): Promise<void> {
      await expect(nameField).toBeVisible({ timeout: TIMEOUTS.page });
      if (present) await expect(nameField).toContainText(REQUIRED_BADGE_TEXT);
      else await expect(nameField).not.toContainText(REQUIRED_BADGE_TEXT);
    },

    /**
     * Enter a candidate's first name.
     */
    async fillFirstName(text: string): Promise<void> {
      await commit(firstNameInput, text);
    },

    /**
     * Enter a candidate's last name.
     */
    async fillLastName(text: string): Promise<void> {
      await commit(lastNameInput, text);
    },

    /**
     * Assert the values a candidate's two name inputs show.
     */
    async expectPersonNames(firstName: string, lastName: string): Promise<void> {
      await expect(firstNameInput).toHaveValue(firstName, { timeout: TIMEOUTS.page });
      await expect(lastNameInput).toHaveValue(lastName, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert that a candidate's two name inputs are enabled.
     */
    async expectPersonNamesEditable(): Promise<void> {
      await expect(firstNameInput).toBeEnabled({ timeout: TIMEOUTS.page });
      await expect(lastNameInput).toBeEnabled({ timeout: TIMEOUTS.page });
    },

    /**
     * Commit a colour to the hex field. The field shows the colour as lowercase `#rrggbb` afterwards.
     */
    async setColor(hex: string): Promise<void> {
      await commit(colorHexInput, hex);
    },

    /**
     * Empty the hex field, which is how a colour is removed.
     */
    async clearColor(): Promise<void> {
      await commit(colorHexInput, '');
    },

    /**
     * Assert the value the hex field shows. An empty string is no colour.
     */
    async expectColor(hex: string): Promise<void> {
      await expect(colorHexInput).toHaveValue(hex, { timeout: TIMEOUTS.page });
    },

    /**
     * Commit a text that is not a colour to the hex field. The field keeps the text and shows its error.
     */
    async typeInvalidColor(text: string): Promise<void> {
      await commit(colorHexInput, text);
    },

    /**
     * Assert that the colour field shows its error and that the hex field is marked invalid.
     */
    async expectColorError(): Promise<void> {
      await expect(colorField.getByTestId(testIds.shared.inputError)).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(colorHexInput).toHaveAttribute('aria-invalid', 'true');
    },

    /**
     * Assert that the page is no wider than its viewport.
     */
    async expectFitsViewport(): Promise<void> {
      await geometry.expectNoHorizontalOverflow();
    },

    /**
     * Assert that the colour field's two controls fit its row: the hex field and the picker lie wholly inside the row, neither overlaps the field's label, and the picker is a pointer target of full size. The row clips what does not fit instead of widening the page, so a control pushed out of it leaves the page's width as it was.
     *
     * The picker is measured in place of the wrapper that shows its swatch and its focus ring: the picker fills that wrapper edge to edge, so the two have one box.
     */
    async expectColorRowFits(): Promise<void> {
      await expect(colorHexInput).toBeVisible({ timeout: TIMEOUTS.page });
      // reason: the field's label is a `<label>` element, which has no role and carries no test id, and the row is that label's parent, which has neither; the label is the one `<label>` inside the field's container, and its parent is reached by the parent axis.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const label = colorField.locator('label');
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const row = label.locator('xpath=..');
      const picker = colorField.getByLabel(COLOR_PICKER_NAME);
      await geometry.expectInside(colorHexInput, row, 'the hex field in the colour row');
      await geometry.expectInside(picker, row, 'the colour picker in the colour row');
      await geometry.expectNoOverlap(colorHexInput, label, "the hex field and the colour field's label");
      await geometry.expectNoOverlap(picker, label, "the colour picker and the colour field's label");
      await geometry.expectNoOverlap(colorHexInput, picker, 'the hex field and the colour picker');
      await geometry.expectAtLeast(picker, MIN_TARGET_SIZE, MIN_TARGET_SIZE, 'the colour picker');
    },

    /**
     * Assert that the row of a locked info question fits: its control lies inside the row and the viewport, beside its label, and the label shows its whole text. The question's name is the row's label, and a name is as long as its author made it.
     * @param label - The question's displayed name, or a pattern for it.
     */
    async expectLockedInfoRowFits(label: string | RegExp): Promise<void> {
      await expectRowFits(identity.getByLabel(label), 'the row of the locked info question');
    },

    /**
     * Assert that the rows of a candidate's two name inputs fit: each input lies inside its row and the viewport, beside its label, and the label shows its whole text.
     */
    async expectPersonNameRowsFit(): Promise<void> {
      await expectRowFits(firstNameInput, "the first name's row");
      await expectRowFits(lastNameInput, "the last name's row");
    },

    /**
     * Assert that the profile holds no colour field at all. The identity section is awaited first, so that an absent field is not that of a page still loading.
     */
    async expectNoColorField(): Promise<void> {
      await expect(identity).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(page.getByTestId(testIds.contestant.profile.color)).toHaveCount(0);
    },

    /**
     * Choose an image file for the entity's image field: an organization's logo or a candidate's portrait.
     */
    async uploadLogo(path: string): Promise<void> {
      await this.uploadPortrait({ path });
    },

    /**
     * Assert that the image field shows an image.
     */
    async expectLogo(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.profile.imageUpload).getByRole('img')).toBeVisible({
        timeout: TIMEOUTS.page
      });
    },

    /**
     * Press Save and wait for the outcome the caller names: `navigation` for a save that leaves the profile page, `message` for one that stays and puts a message into the message region.
     */
    async save(opts: { expect: 'navigation' | 'message' }): Promise<void> {
      await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.page });
      await submitButton.click();
      if (opts.expect === 'navigation') {
        await expect(page).toHaveURL(contestantUrlOutsideRe('/profile'), { timeout: TIMEOUTS.slowPage });
      } else {
        await expect(saveMessage).toHaveAttribute('data-outcome', /.+/, { timeout: TIMEOUTS.slowPage });
      }
    },

    /**
     * Press Save where the save is expected to stay on the page and read the list of the user's entities again, and assert that the page lived through that read: the request for the loads' data was answered, the Save button left its saving state, which it does only once the read has been applied, and the identity section and the message region are the very elements they were before the click. A page that had been taken down and rendered again would hold new elements, and an empty message region.
     */
    async saveThroughReread(): Promise<void> {
      await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.page });
      const mark = { property: KEPT_ELEMENT_PROPERTY, value: `kept-${Date.now()}` };
      const setMark = (element: Element, { property, value }: typeof mark): void => {
        (element as unknown as Record<string, string>)[property] = value;
      };
      const readMark = (element: Element, property: string): string | undefined =>
        (element as unknown as Record<string, string | undefined>)[property];
      await identity.evaluate(setMark, mark);
      await saveMessage.evaluate(setMark, mark);

      const reread = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(LOAD_DATA_REQUEST), {
        timeout: TIMEOUTS.slowPage
      });
      await submitButton.click();
      await reread;
      await expect(saveMessage).toHaveAttribute('data-outcome', /.+/, { timeout: TIMEOUTS.slowPage });
      await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      expect(
        await identity.evaluate(readMark, mark.property),
        'the identity section is the element it was before the save'
      ).toBe(mark.value);
      expect(
        await saveMessage.evaluate(readMark, mark.property),
        'the message region is the element it was before the save'
      ).toBe(mark.value);
    },

    /**
     * Assert that the Save button reads as one that continues or as one that returns. The label is read in English, so the page is one opened in that locale.
     */
    async expectSubmitLabel(kind: ProfileSubmitLabel): Promise<void> {
      await expect(submitButton).toHaveText(SUBMIT_LABEL_TEXT[kind], { timeout: TIMEOUTS.page });
    },

    /**
     * Assert the outcome the message region carries, and that it shows a message.
     */
    async expectSaveMessage(outcome: ProfileSaveOutcome): Promise<void> {
      await expect(saveMessage).toHaveAttribute('data-outcome', outcome, { timeout: TIMEOUTS.page });
      await expect(saveMessage).not.toBeEmpty();
    },

    /**
     * Assert that keyboard focus is on the Save button.
     */
    async expectSaveFocused(): Promise<void> {
      await expect(submitButton).toBeFocused({ timeout: TIMEOUTS.page });
    },

    /**
     * Try to leave the profile through the menu's home item while something is unsaved, and answer the question the page then asks. Asserts that the page raised one native confirm and nothing else, and what followed: after `stay` the page is still the profile, after `leave` it is not.
     */
    async leaveThroughMenu(opts: { answer: 'stay' | 'leave' }): Promise<void> {
      const raised: Array<string> = [];
      const answer = async (dialog: Dialog): Promise<void> => {
        raised.push(dialog.type());
        if (opts.answer === 'leave') await dialog.accept();
        else await dialog.dismiss();
      };
      page.on('dialog', answer);
      try {
        await navMenu.openMobileNav();
        await navMenu.menu.getByTestId(testIds.contestant.nav.home).click();
        await expect.poll(() => raised, { timeout: TIMEOUTS.page }).toEqual(['confirm']);
        // An item closes the menu when it is activated, whether or not the navigation goes ahead.
        await expect(navMenu.menu).toBeHidden({ timeout: TIMEOUTS.page });
        if (opts.answer === 'leave') {
          await expect(page).toHaveURL(contestantUrlOutsideRe('/profile'), { timeout: TIMEOUTS.slowPage });
        } else {
          await expect(page).toHaveURL(contestantUrlRe('/profile'));
        }
      } finally {
        page.off('dialog', answer);
      }
    },

    /**
     * Upload an image via the file chooser triggered by the profile-image-upload button. When `expectError` is supplied, additionally assert the matching error message is rendered on the shared `input-error` node scoped inside the profile-image-upload container.
     *
     * The pre-filechooser 500ms settle delay exists because the underlying click target's onclick handler needs to hydrate before Playwright registers the filechooser listener.
     */
    async uploadPortrait(opts: { path: string; expectError?: 'invalidFile' | 'oversizeFile' }): Promise<void> {
      // reason: there is no public hydration signal on the image-upload button; a small timeout is the canonical pattern for filechooser-trigger races.
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(500);
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByTestId(testIds.contestant.profile.imageUpload).getByRole('button').first().click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(opts.path);
      if (opts.expectError !== undefined) {
        // The error message is Input.svelte's own shared <ErrorMessage>, so it MUST be scoped to this instance: `input-error` unqualified would match any Input in error anywhere on the page. Chaining it inside the portrait Input's own container testid is what makes it address the portrait upload and nothing else.
        const errMessage = page
          .getByTestId(testIds.contestant.profile.imageUpload)
          .getByTestId(testIds.shared.inputError);
        await expect(errMessage).toBeVisible();
        await expect(errMessage).toContainText(IMAGE_ERROR_CONTAINS[opts.expectError]);
      }
    },

    /**
     * Assert the static-info fields render the expected values.
     * Each field is optional — only the supplied fields are checked.
     */
    async expectStaticInfo(props: { name?: string }): Promise<void> {
      if (props.name !== undefined) {
        // `profile-first-name` is on the <input> element itself, which is enabled for an unconfirmed candidate and disabled for a confirmed one.
        // An <input>'s value lives in its `value` property, NOT its text content, so `toContainText` always sees "" — use `toHaveValue`, the Playwright-canonical assertion for form-control values.
        await expect.soft(firstNameInput).toHaveValue(props.name);
      }
    },

    /**
     * Return the Locator for the question wrapper matching `label`.
     */
    getQuestion(label: string | RegExp): Locator {
      return questionLocator(label);
    },

    /**
     * Assert every label in `labels` is rendered inside a profile-info-item.
     */
    async expectQuestionsVisible(labels: Array<string | RegExp>): Promise<void> {
      for (const label of labels) {
        await expect(questionLocator(label).first()).toBeVisible();
      }
    },

    /**
     * Assert NO profile-info-item matches any of `labels`.
     */
    async expectQuestionsAbsent(labels: Array<string | RegExp>): Promise<void> {
      for (const label of labels) {
        await expect.soft(questionLocator(label)).toHaveCount(0);
      }
    },

    /**
     * Assert the question matching `label` carries a required marker.
     * Per `Input.svelte:135` the required marker is a screen-reader-only "Required" span sibling to the input; we match on its accessible text.
     */
    async expectRequiredBadge(label: string | RegExp): Promise<void> {
      const q = questionLocator(label).first();
      await expect.soft(q).toContainText(/required/i);
    },

    /**
     * Locate the question matching `label` and fill its inner editable control. Descends to the first `textbox` OR `spinbutton` inside the wrapper: text / longText / link / date questions render `role=textbox`, but a **number** question is `<input type="number">` → `role=spinbutton`.
     * Matching only `textbox` made `.fill()` on a number question hang until the full per-test timeout (the locator never resolved); `.or()` covers both roles.
     *
     * Fail-fast: assert the control is visible (bounded by the expect timeout) BEFORE filling. A never-resolving locator would otherwise let `.fill()` burn the entire per-test timeout; the bounded assertion surfaces the real cause in seconds with a clear message.
     */
    async fillQuestion(label: string | RegExp, value: string): Promise<void> {
      const q = questionLocator(label).first();
      const editable = q.getByRole('textbox').or(q.getByRole('spinbutton')).first();
      await expect(editable).toBeVisible();
      await editable.fill(value);
    },

    /**
     * Fill the editable control of the question matching `label` and leave it, which is when the page takes the value into the entity's draft. What the page shows of the draft, the Save button's label included, follows this step and not `fillQuestion` alone.
     */
    async commitQuestion(label: string | RegExp, value: string): Promise<void> {
      const q = questionLocator(label).first();
      await commit(q.getByRole('textbox').or(q.getByRole('spinbutton')).first(), value);
    },

    /**
     * Assert the value the question matching `label` shows in its editable control.
     */
    async expectQuestionValue(label: string | RegExp, value: string): Promise<void> {
      const q = questionLocator(label).first();
      await expect(q.getByRole('textbox').or(q.getByRole('spinbutton')).first()).toHaveValue(value, {
        timeout: TIMEOUTS.page
      });
    },

    /**
     * Assert that the profile holds no question matching `label`. Call it on a profile whose own questions are shown, so that an absent question is not that of a page still loading.
     */
    async expectQuestionNotAsked(label: string | RegExp): Promise<void> {
      await expect(questionLocator(label)).toHaveCount(0, { timeout: TIMEOUTS.page });
    },

    /**
     * Fill a multipleText (row-list) info question matching `label` with `values`, one row per value. Mirrors `fillQuestion`'s label-locate idiom, then drives the row list:
     *  - Row 0 pre-renders (the component pads to a floor of >= 1 row), so it is filled in place.
     *  - Each subsequent value needs a fresh row: click the `multiple-text-add` control until a row exists at the target index, then fill it.
     *
     * Row inputs and the add control are located via testIds constants only (no raw `multiple-text-*` selector literals — selector-catalogue rule).
     *
     * Fail-fast: assert the target row is visible (bounded by the expect timeout) BEFORE filling, so a never-resolving locator surfaces the real cause in seconds instead of burning the full per-test timeout.
     */
    async fillMultipleTextQuestion(label: string | RegExp, values: Array<string>): Promise<void> {
      const q = questionLocator(label).first();
      await expect(q).toBeVisible();
      const rows = q.getByTestId(testIds.voter.questions.multipleTextRow);
      const addButton = q.getByTestId(testIds.voter.questions.multipleTextAdd);
      for (let i = 0; i < values.length; i++) {
        // Ensure a row exists at index `i` (row 0 is pre-rendered by the floor).
        while ((await rows.count()) <= i) {
          await expect(addButton).toBeEnabled();
          await addButton.click();
        }
        const row = rows.nth(i);
        await expect(row).toBeVisible();
        await row.fill(values[i]);
      }
    },

    /**
     * Click profile-submit (variant="main"). Caller asserts the post-submit navigation target separately.
     *
     * Fail-fast: assert the button is enabled (bounded by the expect timeout) BEFORE clicking. profile-submit is `disabled={!canSubmit}` where `canSubmit = status !== 'loading'` (profile/+page.svelte:96) — it is NOT gated on required-field completeness, so this is safe to assert even when the required field is empty. A `status` stuck on 'loading' would otherwise let `.click()` retry the disabled button until the full per-test timeout; the bounded assertion surfaces that in seconds.
     */
    async submit(): Promise<void> {
      const submitBtn = page.getByTestId(testIds.contestant.profile.submit);
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();
    },

    /**
     * Assert the profile-submit flow advances away from /profile (i.e., the submit was successful — the page navigates to the entity's home or to its questions page).
     */
    async expectSubmitMessage(): Promise<void> {
      await expect(page).toHaveURL(contestantUrlOutsideRe('/profile'));
    }
  };
}

export type ContestantProfilePageFixture = ReturnType<typeof createContestantProfilePage>;
