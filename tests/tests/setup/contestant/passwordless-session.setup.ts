/**
 * passwordless-session data-setup project: the stored session of a user whose account has no password.
 *
 * The account is made the way the application makes one for a first-time invitee, and never with a password: a project-scope invitation promising the editor's role is seeded for `TEST_PASSWORDLESS_EMAIL`, a sign-in link is asked for through the `account-access` function, and the mailed link is opened in the page as received. The function creates the account without a password, the callback signs the user in and claims the invitation, and every protected URL of the Contestant App then shows the set-password view. The session is stored at `PASSWORDLESS_STORAGE_STATE` once that view names the account.
 *
 * The promise is a project-scope one, so no entity row is written on. Its role is `editor`: the Admin App admits the `admin` role alone, so this session reaches no page of the Admin App.
 *
 * The stored session is read-only for the run: no reader saves a password under it or signs it out, so every reader meets the set-password view.
 *
 * Everything under the session's address prefix is removed first and the address's one-mail-a-minute slot is given back, so a rerun, a cold start and a run after an aborted one all begin from the same state. The link is read only after the request's completion witness has read `sent`: the mail catcher keeps the mails of earlier runs, and before that moment the newest mail for the address is an earlier run's spent link. `data-teardown-passwordless-session` removes the user and the invitation again.
 *
 * The setup prints nothing of the link.
 */

import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createContestantSetPasswordGate } from '../../fixtures/contestant/contestantSetPasswordGate.fixture';
import { createInvitationFlow } from '../../fixtures/shared/invitationFlow.fixture';
import { PASSWORDLESS_SESSION_ADDRESS_PREFIX } from '../../utils/invitationConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { PASSWORDLESS_STORAGE_STATE, TEST_PASSWORDLESS_EMAIL } from '../../utils/testCredentials';

setup('store the session of a user who signed in through a mailed link and has no password', async ({ page }) => {
  const flow = createInvitationFlow(new SupabaseAdminClient(), {
    addressPrefix: PASSWORDLESS_SESSION_ADDRESS_PREFIX,
    dedicatedRows: {}
  });
  await flow.removeEverythingUnderPrefix();
  await flow.releaseLinkSlot(TEST_PASSWORDLESS_EMAIL);

  await flow.seedProjectInvitation('editor', TEST_PASSWORDLESS_EMAIL, { confirmEntity: true });
  const request = await flow.askForLink({ email: TEST_PASSWORDLESS_EMAIL });
  expect(request.outcome, 'the link request handed its mail over').toBe('sent');

  await page.goto(await flow.signInLinkToOpen(TEST_PASSWORDLESS_EMAIL));

  const setPasswordGate = createContestantSetPasswordGate(page);
  await setPasswordGate.expectShown();
  await setPasswordGate.expectAddress(TEST_PASSWORDLESS_EMAIL);

  fs.mkdirSync(path.dirname(PASSWORDLESS_STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: PASSWORDLESS_STORAGE_STATE });
});
