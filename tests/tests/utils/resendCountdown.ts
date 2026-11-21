/**
 * The assertion every "Send again" control shares while it counts the wait before another email may be asked for.
 */

import { expect } from '@playwright/test';
import { messageOf, messagesOf } from './messages';
import { escapeRegExp } from '../../../apps/frontend/src/lib/utils/regexp';
import type { Locator } from '@playwright/test';

/** The label of "Send again", read from the English message source rather than copied. */
const RESEND_LABEL = messageOf('contestantApp.emailSent', 'resend');

/** The count's English wording, with the seconds' place marked by `{seconds}`. */
const COUNT_TEMPLATE = (messagesOf('contestantApp.emailSent').resendIn as Array<{ match: Record<string, string> }>)[0]
  .match['secondsPlural=*'];

/** The count as a pattern: its wording with any number of seconds in the place of `{seconds}`. */
const COUNT_PATTERN = escapeRegExp(COUNT_TEMPLATE).replace(escapeRegExp('{seconds}'), '\\d+');

/**
 * Assert that the control counts the wait in its name and nowhere else: the count is shown after the label, the control's accessible name is the label followed by the count, the control has no description, and the count is not a live region, so focus on the control reads the count once.
 *
 * @param controls.resend - The "Send again" control.
 * @param controls.countdown - The element that shows the count.
 */
export async function expectCountInName({ resend, countdown }: { resend: Locator; countdown: Locator }): Promise<void> {
  await expect(countdown).toBeVisible();
  await expect(countdown).toHaveText(new RegExp(`^${COUNT_PATTERN}$`));
  await expect(resend).toHaveAccessibleName(new RegExp(`^${escapeRegExp(RESEND_LABEL)}\\s*${COUNT_PATTERN}$`));
  await expect(resend, 'the control names a description, so focus would read the count twice').not.toHaveAttribute(
    'aria-describedby'
  );
  await expect(countdown, 'the count is a live region, so it would be read every second').not.toHaveAttribute(
    'aria-live'
  );
}
