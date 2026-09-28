/**
 * Rows written into one project are invisible to a read scoped to another project.
 *
 * That is the whole isolation claim, and this file proves it instead of assuming it. It writes a fixed number of candidate rows into the DEFAULT project under an external-id prefix reserved for this file, then issues the same read three ways in one run:
 *
 *   1. Scoped to the E2E project, it returns zero of those rows. This is the claim itself: data a local development session or a unit-test run leaves in the default project cannot reach a harness that reads its own project.
 *   2. Issued WITHOUT the project filter, over the same table and the same prefix, it returns all of them. This is the negative control, and it is what stops assertion 1 from being vacuous — a scoped read returns zero just as readily when nothing was ever written, and that zero would prove nothing.
 *   3. Scoped to the DEFAULT project, it returns all of them, which distinguishes "written where this read cannot see it" from "never written at all".
 *
 * The scoped read under assertion is `SupabaseAdminClient.selectCandidatesForPortraitUpload`, whose filter is `project_id = <the client's project> AND external_id LIKE <prefix>%`. Its `.eq('project_id', this.projectId)` is the same scoping the E2E harness's own `query(collection)` helper applies, and the last test here asserts that helper still carries it, so the mechanism under test and the mechanism the harness relies on cannot drift apart in silence.
 *
 * The live tier gates on REACHABILITY rather than on `SUPABASE_URL`: whether a database is there is answered by asking the port, not by asking an environment variable, and a tier gated on the variable skips silently on a machine that has one running. When nothing is listening the tier is skipped and a named passing test records that it was, so the skip reads as a decision rather than an absence.
 *
 * The file deletes exactly the rows it creates, asserts the deletion count, and never deletes a project row. It must therefore pass when run twice in a row.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { E2E_PROJECT_ID, resolveE2eProjectId, SupabaseAdminClient, TEST_PROJECT_ID } from '../src';
import type { SupabaseClient } from '@supabase/supabase-js';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

/** Local `supabase start` API port. Authority: `apps/supabase/supabase/config.toml` `[api] port`. */
const LOCAL_SUPABASE_API_PORT = 54321;

/**
 * The external-id prefix this file owns, and nothing else in the repository writes.
 *
 * Deliberately not `seed_` and not `e2e-`: cleanup here deletes every candidate row carrying this prefix in every project, which is only safe while the prefix cannot match a row some other run depends on.
 */
const CONTAMINATION_PREFIX = 'scoping-contamination-probe-';

/** How many contamination rows to write. Small on purpose: the assertion is about scoping, not about volume. */
const CONTAMINATION_ROWS = 5;

/**
 * Service-role client for the insert, the unscoped control read and the cleanup.
 *
 * Constructed here rather than reached through `SupabaseAdminClient.client`, which is `protected`, and deliberately used directly rather than through the seed pipeline so the written row count is exact and known.
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

/** The contamination rows, addressed at one project. `first_name` and `last_name` are the table's only non-defaulted text columns. */
function contaminationRows(projectId: string): Array<Record<string, string>> {
  return Array.from({ length: CONTAMINATION_ROWS }, (_, index) => ({
    project_id: projectId,
    external_id: `${CONTAMINATION_PREFIX}${index + 1}`,
    first_name: 'Contamination',
    last_name: `Probe ${index + 1}`
  }));
}

/**
 * Delete every candidate row carrying this file's prefix, in whichever project it sits, and report how many rows went.
 *
 * Deliberately NOT scoped by project: a cleanup that named one project would leave a row behind if the insert ever landed elsewhere, which is the one failure mode this file must not have. The prefix is the safety, and it is reserved.
 */
async function deleteContamination(client: SupabaseClient): Promise<number> {
  const { data, error } = await client
    .from('candidates')
    .delete()
    .like('external_id', `${CONTAMINATION_PREFIX}%`)
    .select('id');
  if (error) throw new Error(`deleteContamination failed: ${error.message}`);
  return (data ?? []).length;
}

const supabaseReachable = await localSupabaseIsReachable();

describe('the contamination-isolation tier either RUNS or is provably unavailable', () => {
  it('records which of the two it was', () => {
    if (supabaseReachable) {
      expect(supabaseReachable).toBe(true);
      return;
    }
    console.warn(
      `[dev-seed] project-scoped contamination isolation SKIPPED: nothing listening on 127.0.0.1:${LOCAL_SUPABASE_API_PORT}. ` +
        'Start Supabase (`yarn db:start`) to include the scoped-read assertions and their negative control.'
    );
    expect(supabaseReachable).toBe(false);
  });
});

describe('the harness reads its own project', () => {
  /**
   * Source-level, because `vitest.workspace.ts` enumerates `packages/**` only and the `tests/` subclass has no vitest project to assert at runtime.
   *
   * The expression below is the scoping the live assertions in this file exercise through the base class. Losing it would leave the whole harness reading every project's rows again while every assertion in this file still passed, which is exactly the drift this check exists to catch.
   */
  it('the E2E query helper filters by the client project', () => {
    const source = readFileSync(resolve(REPO_ROOT, 'tests/tests/utils/supabaseAdminClient.ts'), 'utf8');
    const code = source
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .join('\n');
    expect(code.replace(/\s+/g, ' ')).toContain(
      "this.client.from(tableName).select('*').eq('project_id', this.projectId)"
    );
  });
});

describe.skipIf(!supabaseReachable)('default-project rows against an E2E-project-scoped read', () => {
  const read = makeReadClient();

  beforeAll(async () => {
    // A previous interrupted run must not be able to supply the rows this one is about to assert on.
    await deleteContamination(read);

    // Both projects have to exist, or a zero from the scoped read could be a missing project rather than a working filter. The default project comes from `seed.sql`; the E2E project is created idempotently here.
    await new SupabaseAdminClient(undefined, undefined, resolveE2eProjectId()).ensureProject();

    const { error } = await read.from('candidates').insert(contaminationRows(TEST_PROJECT_ID));
    if (error) throw new Error(`failed to seed the contamination rows: ${error.message}`);
  });

  afterAll(async () => {
    const removed = await deleteContamination(read);
    expect(removed).toBe(CONTAMINATION_ROWS);

    const { data, error } = await read.from('candidates').select('id').like('external_id', `${CONTAMINATION_PREFIX}%`);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it('both projects exist, so a zero is a filtered read rather than a missing project', async () => {
    const { data, error } = await read.from('projects').select('id').in('id', [TEST_PROJECT_ID, resolveE2eProjectId()]);
    expect(error).toBeNull();
    expect((data ?? []).map((row) => row.id as string).sort()).toEqual([TEST_PROJECT_ID, E2E_PROJECT_ID].sort());
  });

  it('a read scoped to the E2E project returns none of them', async () => {
    const e2eScoped = new SupabaseAdminClient(undefined, undefined, resolveE2eProjectId());
    expect(await e2eScoped.selectCandidatesForPortraitUpload(CONTAMINATION_PREFIX)).toHaveLength(0);
  });

  it('the same read WITHOUT the project filter returns all of them — the negative control', async () => {
    const { data, error } = await read
      .from('candidates')
      .select('id, external_id, first_name, last_name')
      .like('external_id', `${CONTAMINATION_PREFIX}%`)
      .order('external_id', { ascending: true });
    expect(error).toBeNull();
    // A non-zero count is the point: it is what makes the zero above a property of the filter rather than of an empty table.
    expect(data ?? []).toHaveLength(CONTAMINATION_ROWS);
  });

  it('a read scoped to the default project returns all of them', async () => {
    const defaultScoped = new SupabaseAdminClient(undefined, undefined, TEST_PROJECT_ID);
    expect(await defaultScoped.selectCandidatesForPortraitUpload(CONTAMINATION_PREFIX)).toHaveLength(
      CONTAMINATION_ROWS
    );
  });
});
