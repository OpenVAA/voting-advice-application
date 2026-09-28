/**
 * `E2E_PROJECT_ID`, `resolveE2eProjectId()` and `ensureProject()` — the three pieces that let a test harness own a project of its own instead of sharing the default one.
 *
 * Two tiers in one file:
 *
 *   - PURE. The resolver's four behaviours (committed default, normalisation, the default-project collision, a malformed value). No network, always runs.
 *   - LIVE. `ensureProject()` against the local Supabase instance, because idempotency and the required `app_settings` row are database facts and a mocked client would only assert that the calls this file writes are the calls this file writes.
 *
 * The live tier gates on REACHABILITY, not on `SUPABASE_URL`. `SupabaseAdminClient` already defaults to `http://localhost:54321` with the published local demo service-role key, so a plain `yarn test:unit` beside a running `supabase start` exercises the tier without an env fixture — vitest does not load the repo-root `.env`, and gating on the variable would silently skip the tier on every developer machine. When nothing is listening the tier is skipped, and the skip is recorded by a named passing test rather than left as an absence.
 *
 * The live tier writes to a SCRATCH project id that is neither the default project nor the E2E project, and deletes only what it created. The E2E project row is never deleted by anything here.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { E2E_PROJECT_ID, resolveE2eProjectId, SupabaseAdminClient, TEST_PROJECT_ID } from '../src';
import type { SupabaseClient } from '@supabase/supabase-js';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

/** Local `supabase start` API port. Authority: `apps/supabase/supabase/config.toml` `[api] port`. */
const LOCAL_SUPABASE_API_PORT = 54321;

/**
 * A project id used by the live tier and by nothing else in the repository.
 *
 * Deliberately neither {@link TEST_PROJECT_ID} nor {@link E2E_PROJECT_ID}: the live tier deletes the rows it creates, and it must never be able to delete a project some other run depends on.
 */
const SCRATCH_PROJECT_ID = '00000000-0000-0000-0000-0000000000ff';

/** The account `seed.sql` bootstraps unconditionally, and the one `ensureProject` is expected to reuse. */
const DEFAULT_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Exposes the `protected projectId` so a constructed client's resolved target can be asserted directly rather than inferred from a query it happens to issue.
 */
class ProbeClient extends SupabaseAdminClient {
  get configuredProjectId(): string {
    return this.projectId;
  }
}

/**
 * Service-role client for the live tier's read-back and cleanup.
 *
 * Constructed here rather than reached through `SupabaseAdminClient.client`, which is `protected`: the assertions below read `projects`, `app_settings` and `accounts`, none of which the admin client's narrow public surface exposes.
 */
function makeReadClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? `http://127.0.0.1:${LOCAL_SUPABASE_API_PORT}`;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function localSupabaseIsReachable(): Promise<boolean> {
  const url = process.env.SUPABASE_URL ?? `http://127.0.0.1:${LOCAL_SUPABASE_API_PORT}`;
  try {
    // Any HTTP answer proves something is listening; only a transport failure means genuinely absent.
    await fetch(`${url}/rest/v1/`, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove the scratch project and its settings row, child-first.
 *
 * Child-first ordering is not defensive style — it is the only order that works when the `app_settings` foreign key does not cascade, and it is correct either way.
 */
async function dropScratchProject(client: SupabaseClient): Promise<void> {
  await client.from('app_settings').delete().eq('project_id', SCRATCH_PROJECT_ID);
  await client.from('projects').delete().eq('id', SCRATCH_PROJECT_ID);
}

const supabaseReachable = await localSupabaseIsReachable();

describe('resolveE2eProjectId', () => {
  const original = process.env.E2E_PROJECT_ID;

  beforeEach(() => {
    delete process.env.E2E_PROJECT_ID;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.E2E_PROJECT_ID;
    else process.env.E2E_PROJECT_ID = original;
  });

  it('returns the committed constant when the variable is unset', () => {
    expect(resolveE2eProjectId()).toBe(E2E_PROJECT_ID);
    expect(E2E_PROJECT_ID).toBe('00000000-0000-0000-0000-0000000000e2');
  });

  it('returns the committed constant when the variable is set but empty', () => {
    process.env.E2E_PROJECT_ID = '   ';
    expect(resolveE2eProjectId()).toBe(E2E_PROJECT_ID);
  });

  it('trims and lower-cases an override', () => {
    process.env.E2E_PROJECT_ID = '  0000000A-0000-0000-0000-0000000000E2  ';
    expect(resolveE2eProjectId()).toBe('0000000a-0000-0000-0000-0000000000e2');
  });

  it('throws when the override is the default project id, naming the variable and the default project', () => {
    process.env.E2E_PROJECT_ID = TEST_PROJECT_ID;
    let message = '';
    try {
      resolveE2eProjectId();
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain('E2E_PROJECT_ID');
    expect(message).toContain(TEST_PROJECT_ID);
    expect(message.toLowerCase()).toContain('default project');
  });

  it('throws when the override is not a canonical uuid', () => {
    process.env.E2E_PROJECT_ID = 'not-a-uuid';
    expect(() => resolveE2eProjectId()).toThrow(/E2E_PROJECT_ID/);
  });

  it('is not the default project id', () => {
    expect(E2E_PROJECT_ID).not.toBe(TEST_PROJECT_ID);
  });
});

describe('project-id defaults at the two construction sites', () => {
  it('the dev-seed base class still defaults to the default project', () => {
    expect(new ProbeClient().configuredProjectId).toBe(TEST_PROJECT_ID);
  });

  it('an explicit project id is honoured by the base constructor', () => {
    expect(new ProbeClient(undefined, undefined, resolveE2eProjectId()).configuredProjectId).toBe(E2E_PROJECT_ID);
  });

  /**
   * The tests/ subclass has no vitest project of its own (`vitest.workspace.ts` enumerates `packages/**` only), so its constructor default is asserted from its SOURCE. The behaviour under assertion is the one edit that re-points every argument-less `new SupabaseAdminClient()` inside `tests/`; losing it would leave the whole harness reading the default project again.
   */
  it('the tests/ subclass defaults its project to the resolved E2E project', () => {
    const source = readFileSync(resolve(REPO_ROOT, 'tests/tests/utils/supabaseAdminClient.ts'), 'utf8');
    const code = source
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .join('\n');
    expect(code).toContain('resolveE2eProjectId()');
    expect(code.replace(/\s+/g, ' ')).toContain('super(url, serviceRoleKey, projectId ?? resolveE2eProjectId())');
  });

  it('the dev-seed base constructor default is left alone', () => {
    const source = readFileSync(resolve(REPO_ROOT, 'packages/dev-seed/src/supabaseAdminClient.ts'), 'utf8');
    const code = source
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .join('\n');
    expect(code).toContain('projectId ?? TEST_PROJECT_ID');
  });
});

describe('the live ensureProject tier either RUNS or is provably unavailable', () => {
  it('records which of the two it was', () => {
    if (supabaseReachable) {
      expect(supabaseReachable).toBe(true);
      return;
    }
    console.warn(
      `[dev-seed] ensureProject live tier SKIPPED: nothing listening on 127.0.0.1:${LOCAL_SUPABASE_API_PORT}. ` +
        'Start Supabase (`yarn db:start`) to include the idempotency and app_settings assertions.'
    );
    expect(supabaseReachable).toBe(false);
  });
});

describe.skipIf(!supabaseReachable)('ensureProject against the live local database', () => {
  const read = makeReadClient();

  beforeEach(async () => {
    await dropScratchProject(read);
  });

  afterAll(async () => {
    await dropScratchProject(read);
  });

  it('creates the project row and its app_settings row, and a second call leaves exactly one of each', async () => {
    const client = new SupabaseAdminClient(undefined, undefined, SCRATCH_PROJECT_ID);

    await client.ensureProject();
    await client.ensureProject();

    const { data: projects, error: projectsError } = await read
      .from('projects')
      .select('id, account_id, default_locale')
      .eq('id', SCRATCH_PROJECT_ID);
    expect(projectsError).toBeNull();
    expect(projects).toHaveLength(1);
    expect(projects?.[0]?.default_locale).toBe('en');

    const { data: settings, error: settingsError } = await read
      .from('app_settings')
      .select('id, project_id')
      .eq('project_id', SCRATCH_PROJECT_ID);
    expect(settingsError).toBeNull();
    expect(settings).toHaveLength(1);
  });

  it('creates the app_settings row for the project it creates — a project without one is a failure', async () => {
    const client = new SupabaseAdminClient(undefined, undefined, SCRATCH_PROJECT_ID);
    await client.ensureProject();

    // This is the read `setupFromTemplate` asserts on immediately after seeding, so it is the one that must not come back empty.
    const { data, error } = await read.from('app_settings').select('settings').eq('project_id', SCRATCH_PROJECT_ID);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.settings).toEqual({});
  });

  it('reuses the default account instead of creating one', async () => {
    const { count: before, error: beforeError } = await read
      .from('accounts')
      .select('id', { count: 'exact', head: true });
    expect(beforeError).toBeNull();

    const client = new SupabaseAdminClient(undefined, undefined, SCRATCH_PROJECT_ID);
    await client.ensureProject();

    const { count: after, error: afterError } = await read
      .from('accounts')
      .select('id', { count: 'exact', head: true });
    expect(afterError).toBeNull();
    expect(after).toBe(before);

    const { data: projects } = await read.from('projects').select('account_id').eq('id', SCRATCH_PROJECT_ID);
    expect(projects?.[0]?.account_id).toBe(DEFAULT_ACCOUNT_ID);
  });

  it('accepts an explicit project id argument, overriding the client default', async () => {
    const client = new SupabaseAdminClient();
    await client.ensureProject(SCRATCH_PROJECT_ID);

    const { data: projects } = await read.from('projects').select('id').eq('id', SCRATCH_PROJECT_ID);
    expect(projects).toHaveLength(1);
  });
});
