/**
 * perm-localisation-positive data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-l10n-pos-' (matches the template's own externalIdPrefix).
 *
 * Also owns the auth.users row created by the spec's registration-via-email step (`client.sendEmail` → `inviteUserByEmail` in perm-localisation-positive.spec.ts). `runTeardown(PREFIX)` only deletes the SEEDED dataset rows; it does NOT touch the invited auth user, whose email (`candidate-l10n-pos-aa@...`) is NOT prefixed with `e2e-perm-l10n-pos-`. Without this cleanup the user leaks and the next run's `inviteUserByEmail` fails with "A user with this email address has already been registered", breaking the whole downstream perm chain (this spec is its anchor). Mirrors the candidate-journey.teardown.ts pattern; `unregisterCandidate` is idempotent (no-op when no matching auth.users row exists).
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-l10n-pos-';
// Kept in sync with RECIPIENT_EMAIL in perm-localisation-positive.spec.ts.
// Re-declared rather than imported: importing the spec module would register its `test.describe` block inside this teardown project.
const RECIPIENT_EMAIL = 'candidate-l10n-pos-aa@test.openvaa.local';

teardown('delete perm-localisation-positive dataset', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(RECIPIENT_EMAIL);
  await runTeardownAsserted(PREFIX, client);
});
