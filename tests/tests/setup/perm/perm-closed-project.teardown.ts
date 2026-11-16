/**
 * perm-closed-project data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-closed-project-' (matches the template's own externalIdPrefix).
 *
 * It unregisters the auth user the setup minted for the seeded candidate, deletes the prefix, and always reopens the shared E2E project with `ensureProject`, which forces `open_for_voters = true`. `runTeardownAsserted` does not reopen the project, so this call is the one that does.
 *
 * The three steps run independently: a failure in one does not skip the others, because leftover prefixed rows and a closed project would both fail later specs in the run. Once all three have run, the teardown fails with the one error that occurred, unchanged, or with an `AggregateError` whose message lists every failed step.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-closed-project-';
// The auth.users row minted by the setup's forceRegister. runTeardown(PREFIX) deletes the seeded candidate row but NOT the auth user. Idempotent no-op when no matching auth.users row exists.
const CANDIDATE_EMAIL = `${PREFIX}cand-1@test.openvaa.local`;

/**
 * Run every step, including the ones after a failure, then throw: the only error as it was thrown, or an `AggregateError` naming each failed step and its message.
 */
async function runEveryStep(steps: ReadonlyArray<readonly [string, () => Promise<void>]>): Promise<void> {
  const failures: Array<{ name: string; error: unknown }> = [];
  for (const [name, step] of steps) {
    try {
      await step();
    } catch (error) {
      failures.push({ name, error });
    }
  }
  if (failures.length === 1) throw failures[0].error;
  if (failures.length > 1) {
    const lines = failures.map(
      ({ name, error }) => `- ${name}: ${error instanceof Error ? error.message : String(error)}`
    );
    throw new AggregateError(
      failures.map(({ error }) => error),
      `perm-closed-project teardown: ${failures.length} of ${steps.length} steps failed:\n${lines.join('\n')}`
    );
  }
}

teardown('delete perm-closed-project dataset and reopen the project', async () => {
  const client = new SupabaseAdminClient();
  await runEveryStep([
    ['unregister the seeded candidate auth user', () => client.unregisterCandidate(CANDIDATE_EMAIL)],
    ['delete the prefixed dataset', () => runTeardownAsserted(PREFIX, client)],
    ['reopen the project', () => client.ensureProject()]
  ]);
});
