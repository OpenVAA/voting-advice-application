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
 *  - expectAskedAgain(shown)       — the sentence for a request made again too soon is there or is not.
 *  - shape(address)                — what the screen shows, as data to compare with another visit to it.
 *  - expectResendWaiting()         — the control is unavailable, can still be focused, and is described by the line that counts the wait.
 *  - advancePastTheWait()          — move the page's clock past the wait.
 *  - expectResendReady()           — the wait is over: the control is available and the counting line is gone.
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
     * Assert that the control that asks for another email is waiting: the screen states so, the control is marked unavailable, the line that counts the wait is shown and is named as the control's description, and the control still takes focus.
     */
    async expectResendWaiting(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toHaveAttribute('data-resend', 'waiting');
      const resend = page.getByTestId(ids.resend);
      await expect(resend).toHaveAttribute('aria-disabled', 'true');

      const countdown = page.getByTestId(ids.countdown);
      await expect(countdown).toBeVisible();
      const countdownId = (await countdown.getAttribute('id')) ?? '';
      expect(countdownId, 'the id of the line that counts the wait').not.toBe('');
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
     * Assert that the wait is over: the screen states that another email can be asked for, the line that counted the wait is not rendered, and the control is not marked unavailable.
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
