/**
 * passwordless-session data-teardown project.
 *
 * Removes what `data-setup-passwordless-session` made: every user whose address begins with the session's prefix, with the user's grants and invitations, and every invitation addressed under the prefix that nobody claimed. It writes on no dataset row.
 *
 * Idempotent: safe on a clean database, after a cold start and after a partial failure. It asserts nothing about what it found.
 */

import { test as teardown } from '@playwright/test';
import { createInvitationFlow } from '../../fixtures/shared/invitationFlow.fixture';
import { PASSWORDLESS_SESSION_ADDRESS_PREFIX } from '../../utils/invitationConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

teardown('remove the user with no password and the invitation', async () => {
  const flow = createInvitationFlow(new SupabaseAdminClient(), {
    addressPrefix: PASSWORDLESS_SESSION_ADDRESS_PREFIX,
    dedicatedRows: {}
  });
  await flow.removeEverythingUnderPrefix();
});
