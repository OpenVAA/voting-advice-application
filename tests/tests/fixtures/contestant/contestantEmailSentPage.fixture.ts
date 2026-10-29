/**
 * @file contestantEmailSentPage fixture.
 *
 * Function-fixture for the screen of the Contestant App that says an email was sent: its wording, the address it was sent to where the user typed one, the sentence for a request made again too soon, and the control that asks for another email once a wait has passed.
 *
 * **The wait is never waited out.** The screen counts the wait on the page's own clock, and the server sends one mail to an address in a minute. So a test puts the page's clock under its control with `installClock()` before the navigation that leads to the screen, moves it past the wait with `advancePastTheWait()` — by the application's own constant, imported and not copied — and presses through `pressResend()`, which first gives the address's slot on the server back through the admin client.
 *
 * Surface:
 *  - openDirectly()                — go to the screen's address, as a visitor who made no request in this tab does. It waits for nothing.
 *  - installClock()                — put the page's clock under the test's control. Call it before the navigation that leads to the screen.
 *  - holdClockStill()              — make the page's clock show one moment throughout, so that the count stays where it began. Call it before the navigation that leads to the screen.
 *  - reload()                      — load the page again at its own address.
 *  - expectShown({ wording, address }) — the screen is shown in this wording, with this address or with none.
 *  - expectAddressInFirstSentence(address, wording) — the first sentence names the address in bold, and no list shows it apart.
 *  - expectSupportThenResendInBody() — below the sentences, the body holds the sentence whose words lead to support, then "Send again", and the actions hold neither.
 *  - expectAskedAgain(shown)       — the sentence for a request made again too soon is there or is not.
 *  - shape(address)                — what the screen shows, as data to compare with another visit to it.
 *  - expectResendWaiting()         — the control is unavailable, can still be focused, and is described by the count of the wait in its label.
 *  - advancePastTheWait()          — move the page's clock past the wait.
 *  - expectResendReady()           — the wait is over: the control is available and its count is gone.
 *  - pressResend(address, { code }) — give the server's slot back, then press the control; focus stays on it.
 *  - expectStatus(which)           — the status region says that an email was requested, or that another can be asked for.
 *  - followChangeAddress()         — press the link back to the screen that asked for the address.
 *  - followReturn()                — press the screen's way back.
 *  - expectAddressInsideScreen()   — the address lies inside the screen and shows its whole text.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { RESEND_WAIT_SECONDS } from '../../../../apps/frontend/src/lib/contestant/entryFlow/entryFlow';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import { readScreenShape } from '../shared/screenShape.fixture';
import type { Page } from '@playwright/test';
import type { EntryWording } from '../../../../apps/frontend/src/lib/contestant/entryFlow/entryFlow';
import type { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import type { ScreenShape } from '../shared/screenShape.fixture';

/** What the screen's status region can say: that a new email was requested, or that another can now be asked for. */
export type ContestantEmailSentStatus = 'requested' | 'ready';

/** The messages of the screen, read from the English message source rather than copied. */
const EMAIL_SENT_MESSAGES = (
  JSON.parse(
    fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/contestantApp.emailSent.json'), 'utf8')
  ) as Record<string, Record<string, unknown>>
)['contestantApp.emailSent'];

/** The messages shared by the screens of the app, read from the English message source rather than copied. */
const COMMON_MESSAGES = (
  JSON.parse(fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/common.json'), 'utf8')) as Record<
    string,
    Record<string, unknown>
  >
)['common'];

/** The messages shared by the screens of the Contestant App, read from the English message source rather than copied. */
const CONTESTANT_COMMON_MESSAGES = (
  JSON.parse(
    fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/contestantApp.common.json'), 'utf8')
  ) as Record<string, Record<string, unknown>>
)['contestantApp.common'];

/** The first sentence of each wording that names the address, with the address's place marked by `{email}` inside `<strong>`. */
const INTRO_WITH_ADDRESS: Readonly<Record<'signIn' | 'recovery', string>> = Object.freeze({
  signIn: String((EMAIL_SENT_MESSAGES.intro as Record<string, unknown>).signInTo),
  recovery: String((EMAIL_SENT_MESSAGES.intro as Record<string, unknown>).recoveryTo)
});

/** The fragment of the support section on the Help page. */
const SUPPORT_SECTION = '#support';

/** How far two edges may differ and still count as one: a box's edges are fractions of a pixel once a layout rounds. */
const EDGE_TOLERANCE = 1;

/** The sentence the status region holds for each thing it can say. */
const STATUS_MESSAGES: Readonly<Record<ContestantEmailSentStatus, string>> = Object.freeze({
  requested: String(EMAIL_SENT_MESSAGES.resendRequested),
  ready: String(EMAIL_SENT_MESSAGES.resendReady)
});

/**
 * Create the steps of the screen that says an email was sent.
 *
 * @param page - The page that shows the screen.
 * @param admin - The admin client that gives an address's slot on the server back before a press that must send.
 */
export function createContestantEmailSentPage(page: Page, admin: SupabaseAdminClient) {
  const ids = testIds.contestant.emailSent;

  return {
    /**
     * Go to the screen's address, as a visitor who made no request in this tab does: by a link kept from before, a reload or a typed address.
     *
     * The step waits for nothing. The screen is not shown to such a visitor, so the caller asserts where they end.
     */
    async openDirectly(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppEmailSent', locale: 'en' }));
    },

    /**
     * Put the page's clock under the test's control, so that {@link advancePastTheWait} can move it. The clock keeps running at its own pace until it is moved.
     *
     * Call it before the navigation that leads to the screen: a clock installed after the screen has started counting does not reach the timer the count already runs on.
     */
    async installClock(): Promise<void> {
      await page.clock.install();
    },

    /**
     * Make the page's clock show one moment for as long as the page lives, while its timers keep running. The count of the wait is computed from the clock, so it stays at what it began with, and two visits to the screen show the same count whenever each is read.
     *
     * For a test that compares what the screen shows two visitors. Call it before the navigation that leads to the screen, and do not combine it with {@link advancePastTheWait}: a clock that stands still cannot be moved past the wait.
     */
    async holdClockStill(): Promise<void> {
      await page.clock.setFixedTime(new Date());
    },

    /**
     * Load the page again at the address it has, as a user who reloads the tab does. The caller asserts where the user ends: the page's memory is gone with the reload.
     */
    async reload(): Promise<void> {
      await page.reload();
    },

    /**
     * Assert that the screen is shown, in which wording, and with which address.
     *
     * With an address: the screen states that it shows one, and shows exactly that address as text. Without: the screen states that it shows none, and holds neither an address nor the link back to the screen that asked for one.
     *
     * @param expectation.wording - `signIn` for a sign-in link, `recovery` for a password-recovery link, `code` for a link mailed to the address a used code was registered with.
     * @param expectation.address - The address the user typed; leave it out where the user typed none.
     */
    async expectShown({ wording, address }: { wording: EntryWording; address?: string }): Promise<void> {
      const screen = page.getByTestId(ids.page);
      await expect(screen).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(screen).toHaveAttribute('data-wording', wording);
      if (address === undefined) {
        await expect(screen).toHaveAttribute('data-address', 'none');
        await expect(page.getByTestId(ids.address)).toHaveCount(0);
        await expect(page.getByTestId(ids.changeAddress)).toHaveCount(0);
      } else {
        await expect(screen).toHaveAttribute('data-address', 'shown');
        await expect(page.getByTestId(ids.address)).toHaveText(address);
      }
    },

    /**
     * Assert that the screen's first sentence, the one that says the email was sent, names the address the user typed in bold, and that the screen shows the address in no list of its own.
     *
     * The sentence is compared with the message source, the address in the place the message gives it. No assertion takes the address as its expected value, so a failure prints none.
     *
     * @param address - The address the user typed.
     * @param wording - The wording of the request: `signIn` for a sign-in link, `recovery` for a password-recovery link.
     */
    async expectAddressInFirstSentence(address: string, wording: 'signIn' | 'recovery' = 'signIn'): Promise<void> {
      const intro = page.getByTestId(ids.intro);
      const shown = intro.getByTestId(ids.address);
      await expect(shown, 'the address, inside the first sentence').toHaveJSProperty('tagName', 'STRONG');
      expect((await shown.textContent()) === address, 'the bold text is the address the user typed').toBe(true);
      const sentence = ((await intro.textContent()) ?? '').trim().split(address).join('{email}');
      expect(sentence, 'the first sentence, with the place of the address marked').toBe(
        INTRO_WITH_ADDRESS[wording].replace('<strong>{email}</strong>', '{email}')
      );
      const screen = page.getByTestId(ids.page);
      await expect(screen.getByRole('term'), 'a label of a list that shows the address apart').toHaveCount(0);
      await expect(screen.getByRole('definition'), 'a list entry that shows the address apart').toHaveCount(0);
    },

    /**
     * Assert the end of the screen's body, below its sentences: the sentence whose own words lead to support, then "Send again".
     *
     * The support sentence is the message source's, its one link has the link words and leads to the support section of the Help page, and the screen holds no Contact support button. "Send again" stands in the body below that sentence, and the screen's actions hold neither.
     */
    async expectSupportThenResendInBody(): Promise<void> {
      const panel = page.getByTestId(ids.panel);
      const intro = panel.getByTestId(ids.intro);
      const sentence = panel.getByTestId(ids.support);
      const resend = panel.getByTestId(ids.resend);
      await expect(sentence, 'the support sentence, in the body').toBeVisible();
      await expect(resend, '"Send again", in the body').toBeVisible();

      const words = String(CONTESTANT_COMMON_MESSAGES.contactSupportLink);
      await expect(sentence).toHaveText(String(EMAIL_SENT_MESSAGES.support).replace('{contactSupportLink}', words));
      const link = sentence.getByRole('link');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveText(words);
      const target = new URL((await link.getAttribute('href')) ?? '', page.url());
      expect(target.pathname).toBe(buildRoute({ route: 'ContestantAppHelp', locale: 'en' }));
      expect(target.hash).toBe(SUPPORT_SECTION);
      await expect(page.getByTestId(testIds.contestant.common.contactSupport)).toHaveCount(0);

      const [introBox, sentenceBox, resendBox] = [
        await intro.boundingBox(),
        await sentence.boundingBox(),
        await resend.boundingBox()
      ];
      expect(
        introBox && sentenceBox && resendBox,
        'the boxes of the first sentence, the support sentence and "Send again"'
      ).toBeTruthy();
      expect(sentenceBox!.y, 'the support sentence stands below the first sentence').toBeGreaterThanOrEqual(
        introBox!.y + introBox!.height - EDGE_TOLERANCE
      );
      expect(resendBox!.y, '"Send again" stands below the support sentence').toBeGreaterThanOrEqual(
        sentenceBox!.y + sentenceBox!.height - EDGE_TOLERANCE
      );

      const actions = page.getByRole('region', { name: String(COMMON_MESSAGES.primaryActions) });
      await expect(actions, "the screen's actions").toBeVisible();
      await expect(actions.getByTestId(ids.resend), '"Send again" among the actions').toHaveCount(0);
      await expect(actions.getByTestId(ids.support), 'the support sentence among the actions').toHaveCount(0);
    },

    /**
     * Assert whether the screen shows the sentence for a request made again before the wait had passed: shown, or not rendered.
     *
     * @param shown - Whether the sentence is expected.
     */
    async expectAskedAgain(shown: boolean): Promise<void> {
      await expect(page.getByTestId(ids.page)).toBeVisible();
      const sentence = page.getByTestId(ids.askedAgain);
      if (shown) await expect(sentence).toBeVisible();
      else await expect(sentence).toHaveCount(0);
    },

    /**
     * Read what the screen shows, as data: its wording and its other states, every line of its text with the count, and its controls with what each of them tells a user.
     *
     * For comparing visits with each other: two visitors who typed different addresses are shown the same screen when their readings are equal. The address is replaced in the reading, so it does not differ by what was typed and no address reaches a report. Assert the state to compare first, and hold the clock still with {@link holdClockStill}, or the count read depends on when it is read.
     *
     * @param address - The address the visitor typed; leave it out where the screen shows none.
     * @returns The screen's shape.
     */
    async shape(address?: string): Promise<ScreenShape> {
      const screen = page.getByTestId(ids.page);
      await expect(screen).toBeVisible({ timeout: TIMEOUTS.slowPage });
      return readScreenShape(screen, address === undefined ? [] : [address]);
    },

    /**
     * Assert that the control that asks for another email is waiting: the screen states so, the control is marked unavailable, the count of the wait in its label is shown and is named as the control's description, and the control still takes focus.
     */
    async expectResendWaiting(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toHaveAttribute('data-resend', 'waiting');
      const resend = page.getByTestId(ids.resend);
      await expect(resend).toHaveAttribute('aria-disabled', 'true');

      const countdown = page.getByTestId(ids.countdown);
      await expect(countdown).toBeVisible();
      const countdownId = (await countdown.getAttribute('id')) ?? '';
      expect(countdownId, 'the id of the count of the wait').not.toBe('');
      const describedBy = ((await resend.getAttribute('aria-describedby')) ?? '').split(/\s+/);
      expect(describedBy, 'the ids the control names as its description').toContain(countdownId);

      await resend.focus();
      await expect(resend).toBeFocused();
    },

    /**
     * Move the page's clock past the wait, by as many seconds as the application waits before another email may be asked for. Needs {@link installClock} to have been called before the screen opened.
     *
     * The jump fires the screen's own one-second timer once, so the screen reads the new time without a further tick.
     */
    async advancePastTheWait(): Promise<void> {
      await page.clock.fastForward(RESEND_WAIT_SECONDS * 1000);
    },

    /**
     * Assert that the wait is over: the screen states that another email can be asked for, the count of the wait is not rendered, and the control is not marked unavailable.
     */
    async expectResendReady(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toHaveAttribute('data-resend', 'ready');
      await expect(page.getByTestId(ids.countdown)).toHaveCount(0);
      await expect(page.getByTestId(ids.resend)).not.toHaveAttribute('aria-disabled', 'true');
    },

    /**
     * Ask for another email: give the address's one-mail-a-minute slot on the server back, then press the control, and assert that focus stays on it.
     *
     * Without the slot given back the server would send nothing for a press made inside its own minute, whatever the page's clock says.
     *
     * @param address - The address the held request mails: the one the user typed, or the one a used code was registered with.
     * @param options.code - The registration code of a request made with one, so that the code's own interval is given back too.
     */
    async pressResend(address: string, { code }: { code?: string } = {}): Promise<void> {
      await admin.releaseLinkSlot(address, code);
      const resend = page.getByTestId(ids.resend);
      await resend.click();
      await expect(resend).toBeFocused();
    },

    /**
     * Assert what the screen's status region says, compared with the message source.
     *
     * @param which - `requested` after a press of the control, `ready` once the wait has ended.
     */
    async expectStatus(which: ContestantEmailSentStatus): Promise<void> {
      await expect(page.getByTestId(ids.status)).toHaveText(STATUS_MESSAGES[which]);
    },

    /**
     * Press the link back to the screen that asked for the address. The caller asserts the screen it leads to.
     */
    async followChangeAddress(): Promise<void> {
      await page.getByTestId(ids.changeAddress).click();
    },

    /**
     * Press the screen's way back. The caller asserts the screen it leads to.
     */
    async followReturn(): Promise<void> {
      await page.getByTestId(ids.return).click();
    },

    /**
     * Assert that the address lies wholly inside the screen's frame and that its text does not reach beyond its own box: a long address wraps inside the content column instead of running out of it.
     */
    async expectAddressInsideScreen(): Promise<void> {
      const geometry = createPageGeometry(page);
      const address = page.getByTestId(ids.address);
      await geometry.expectInside(address, page.getByTestId(ids.page), 'the address on the "email sent" screen');
      await geometry.expectShowsWholeText(address, 'the address on the "email sent" screen');
    }
  };
}

export type ContestantEmailSentPageFixture = ReturnType<typeof createContestantEmailSentPage>;
