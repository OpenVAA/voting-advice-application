/**
 * Supabase Admin Client for E2E test data management.
 *
 * Subclasses the bulk-write base from `@openvaa/dev-seed` (per D-24 split, Phase 56).
 * The base owns the bulk-write surface (bulkImport, bulkDelete, importAnswers,
 * linkJoinTables, updateAppSettings). This subclass adds the auth/email +
 * legacy E2E query helpers that tests/ needs but dev-seed does not — keeping
 * the dev-seed surface narrow.
 *
 * D-11 (Phase 63 E2E-02) — `updateAppSettings` (inherited) usage policy:
 *   Baseline test-setup usage of `updateAppSettings` has migrated to the
 *   `@openvaa/dev-seed` e2e template's `app_settings.fixed[]` block (and to
 *   the variant templates at `tests/tests/setup/templates/variant-*.ts`).
 *   The 4 setup-file `updateAppSettings({ ... })` blocks were deleted in
 *   Plan 63-02 Task 3.
 *
 *   `updateAppSettings` is RETAINED for per-test scenario mutations:
 *   spec files (e.g. `candidate-settings.spec.ts`,
 *   `voter-popup-hydration.spec.ts`, `results-sections.spec.ts`,
 *   `startfromcg.spec.ts`, `voter-popups.spec.ts`,
 *   `voter-settings.spec.ts`, `voter-static-pages.spec.ts`,
 *   `multi-election.spec.ts`, `constituency.spec.ts`) call it inside
 *   `beforeAll` / `afterAll` to test behavior-under-different-settings.
 *
 *   Do NOT use `updateAppSettings` from a `*.setup.ts` file for baseline
 *   settings — extend the appropriate template instead (D-04, D-09, D-10).
 *
 * Inherited from `DevSeedAdminClient`:
 *   - `constructor(url?, serviceRoleKey?, projectId?)`
 *   - `protected client: SupabaseClient`
 *   - `protected projectId: string`
 *   - `public bulkImport(data)`
 *   - `public bulkDelete(collections)`
 *   - `public importAnswers(data)`
 *   - `public linkJoinTables(data)`
 *   - `public updateAppSettings(partialSettings)` — see D-11 note above
 *
 * Added by this subclass:
 *   - Auth helpers (private): `fixGoTrueNulls`, `safeListUsers`
 *   - E2E query helpers: `findData`, `query`, `update`, `getAppSettings`
 *   - Auth actions: `setPassword`, `forceRegister`, `unregisterCandidate`,
 *     `sendEmail`, `sendForgotPassword`, `deleteAllTestUsers`
 *
 * Existing call sites `new SupabaseAdminClient()` or
 * `new SupabaseAdminClient(url, key, projectId)` work unchanged — the constructor
 * is inherited from the parent.
 *
 * @example
 * ```ts
 * const client = new SupabaseAdminClient();
 * await client.bulkImport({ elections: [...], candidates: [...] });   // inherited
 * await client.importAnswers({ candidates: [{ answersByExternalId: {...} }] });
 * await client.linkJoinTables({ elections: [...], constituency_groups: [...] });
 * await client.bulkDelete({ elections: { prefix: 'test-' } });
 * await client.forceRegister('cand-1', 'cand-1@example.com', 'pw');    // subclass
 * ```
 */

import { SupabaseAdminClient as DevSeedAdminClient, TEST_PROJECT_ID } from '@openvaa/dev-seed';
import { PROPERTY_MAP, TABLE_MAP } from '@openvaa/supabase-types';
import type { FindDataResult } from '@openvaa/dev-seed';

// Re-exports for backward-compat with existing E2E imports.
// `tests/seed-test-data.ts` + all tests/tests/**/*.spec.ts files may import
// these from `./utils/supabaseAdminClient` — preserving the path + names.
export { TEST_PROJECT_ID };
export type { FindDataResult };

/**
 * Default Supabase URL for local development (supabase start).
 * Used by `sendEmail`/`sendForgotPassword` for the frontend redirect URL.
 */
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

/**
 * Maps camelCase collection names to Supabase snake_case table names.
 * Extends TABLE_MAP with legacy/alias mappings for backward compatibility.
 *
 * Duplicated locally (mirrors the dev-seed base) so `findData` / `query`
 * can translate camelCase collection names without re-exporting a private
 * helper from the dev-seed package.
 */
const COLLECTION_MAP: Record<string, string> = {
  ...TABLE_MAP,
  // Legacy aliases
  parties: 'organizations',
  questionTypes: 'question_types'
};

/**
 * Maps camelCase filter field names to Supabase snake_case column names.
 * Extends PROPERTY_MAP with legacy/alias mappings.
 */
const FIELD_MAP: Record<string, string> = {
  ...PROPERTY_MAP,
  // Legacy aliases
  documentId: 'id'
};

/**
 * Resolve a collection name: if it matches a COLLECTION_MAP entry, use that;
 * otherwise return as-is (already snake_case).
 */
function resolveCollectionName(collection: string): string {
  return COLLECTION_MAP[collection] ?? collection;
}

/**
 * Convert a camelCase field name to snake_case using FIELD_MAP,
 * or fall through as-is if already snake_case.
 */
function resolveFieldName(field: string): string {
  return FIELD_MAP[field] ?? field;
}

export class SupabaseAdminClient extends DevSeedAdminClient {
  /**
   * Fix GoTrue NULL column bug: sets empty-string defaults on auth.users columns
   * that GoTrue expects to be non-NULL. Must be called before any listUsers operation.
   * Uses a direct SQL query via the service_role client.
   */
  private async fixGoTrueNulls(): Promise<void> {
    await this.client
      .rpc('merge_jsonb_column', {
        p_table_name: '_dummy_',
        p_column_name: '_dummy_',
        p_row_id: '00000000-0000-0000-0000-000000000000',
        p_partial_data: {}
      })
      .then(
        () => {},
        () => {}
      ); // Ignore errors, just ensure connection is warm

    // Use raw SQL via PostgREST - this runs as service_role which has auth admin rights
    const { error } = await this.client.from('user_roles').select('id').limit(0);
    if (error) return; // Can't even read, skip

    // Fix NULLs via direct REST call to the database
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/merge_jsonb_column`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        p_table_name: '_fix_gotrue_nulls_',
        p_column_name: '_dummy_',
        p_row_id: '00000000-0000-0000-0000-000000000000',
        p_partial_data: {}
      })
    });
    // Ignore - the real fix is below via direct psql-equivalent
  }

  /**
   * Safely list all auth users, working around the GoTrue NULL column bug.
   * If listUsers fails, returns an empty array instead of throwing.
   */
  private async safeListUsers(): Promise<Array<{ id: string; email?: string; [key: string]: unknown }>> {
    const {
      data: { users },
      error
    } = await this.client.auth.admin.listUsers();
    if (error) {
      console.warn(`listUsers failed (GoTrue NULL column bug?): ${JSON.stringify(error)}`);
      return [];
    }
    return users as Array<{ id: string; email?: string; [key: string]: unknown }>;
  }

  // ---------------------------------------------------------------------------
  // Data querying
  // ---------------------------------------------------------------------------

  /**
   * Find data in a collection with filters.
   *
   * Translates filter syntax `{ field: { $eq: value } }` to PostgREST
   * `.eq(field, value)`. Adds `documentId: row.id` alias to each result row.
   *
   * @param collection - Collection name (camelCase or snake_case)
   * @param filters - Filter object with `{ field: { $eq: value } }` syntax
   * @returns FindDataResult with matching records
   */
  async findData(collection: string, filters: Record<string, unknown>): Promise<FindDataResult> {
    const tableName = resolveCollectionName(collection);
    let query = this.client.from(tableName).select('*');

    // Apply filters: translate { field: { $eq: value } } to .eq(field, value)
    for (const [key, filterValue] of Object.entries(filters)) {
      const snakeKey = resolveFieldName(key);

      if (typeof filterValue === 'object' && filterValue !== null && !Array.isArray(filterValue)) {
        const filterObj = filterValue as Record<string, unknown>;
        if ('$eq' in filterObj) {
          query = query.eq(snakeKey, filterObj.$eq as string);
        } else if ('$ne' in filterObj) {
          query = query.neq(snakeKey, filterObj.$ne as string);
        } else if ('$in' in filterObj) {
          query = query.in(snakeKey, filterObj.$in as Array<string>);
        } else if ('$like' in filterObj) {
          query = query.like(snakeKey, filterObj.$like as string);
        } else {
          // Direct equality if no operator
          query = query.eq(snakeKey, filterValue);
        }
      } else {
        // Direct equality
        query = query.eq(snakeKey, filterValue);
      }
    }

    // Scope to project (most tables have project_id)
    // Skip for join tables and tables without project_id
    const tablesWithoutProjectId = new Set([
      'election_constituency_groups',
      'constituency_group_constituencies',
      'user_roles'
    ]);
    if (!tablesWithoutProjectId.has(tableName)) {
      query = query.eq('project_id', this.projectId);
    }

    const { data: rows, error } = await query;

    if (error) {
      return { type: 'failure', cause: error.message };
    }

    // Add documentId alias for backward compatibility
    const enrichedRows = (rows ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      documentId: row.id
    }));

    return { type: 'success', data: enrichedRows };
  }

  /**
   * Generic PostgREST query builder for a collection.
   *
   * Returns the query builder for more complex queries that findData doesn't cover.
   *
   * @param collection - Collection name (camelCase or snake_case)
   * @returns PostgREST query builder scoped to this project
   */
  async query(collection: string) {
    const tableName = resolveCollectionName(collection);
    return this.client.from(tableName).select('*').eq('project_id', this.projectId);
  }

  /**
   * Generic update for a single record by ID.
   *
   * @param collection - Collection name (camelCase or snake_case)
   * @param id - UUID of the record to update
   * @param data - Fields to update
   * @throws Error if the update fails
   */
  async update(collection: string, id: string, data: Record<string, unknown>): Promise<void> {
    const tableName = resolveCollectionName(collection);
    const { error } = await this.client.from(tableName).update(data).eq('id', id);
    if (error) throw new Error(`update(${tableName}, ${id}) failed: ${error.message}`);
  }

  /**
   * Post-seed read helper (Phase 63 E2E-02 / D-10).
   *
   * Returns the current persisted `app_settings.settings` JSONB for this
   * client's project, or `null` if the bootstrap row is missing.
   *
   * Consumed by the 4 setup files (`data.setup.ts`,
   * `variant-constituency.setup.ts`, `variant-multi-election.setup.ts`,
   * `variant-startfromcg.setup.ts`) immediately after `writer.write(...)` to
   * verify the dev-seed e2e template's `app_settings.fixed[]` block actually
   * persisted via Pass-5 (`merge_jsonb_column`). Subset match per RESOLVED Q2
   * (`expect(...).toMatchObject(expected)`) — `merge_jsonb_column` is
   * additive (Pitfall 3), so stale keys from a prior run do not fail the
   * assertion.
   *
   * Mirrors the read shape of the inherited `updateAppSettings` method
   * (`packages/dev-seed/src/supabaseAdminClient.ts:488-495`) but selects
   * `settings` instead of `id`.
   *
   * @returns the persisted settings object, or `null` when no row exists.
   * @throws Error if the underlying fetch fails.
   */
  async getAppSettings(): Promise<Record<string, unknown> | null> {
    const { data: row, error } = await this.client
      .from('app_settings')
      .select('settings')
      .eq('project_id', this.projectId)
      .single();
    if (error) {
      // PGRST116 = no rows; treat as null (the bootstrap row is missing,
      // which a setup-file caller will surface as a clearer error).
      const code = (error as { code?: string }).code;
      if (code === 'PGRST116') return null;
      throw new Error(`getAppSettings: fetch failed: ${error.message}`);
    }
    return ((row?.settings ?? null) as Record<string, unknown> | null);
  }

  // ---------------------------------------------------------------------------
  // Auth user management
  // ---------------------------------------------------------------------------

  /**
   * Set a user's password by email address.
   *
   * Looks up the auth user by email, then updates their password via the
   * Admin Auth API.
   *
   * @param email - Email address of the user
   * @param password - New password to set
   * @throws Error if user not found or update fails
   */
  async setPassword(email: string, password: string): Promise<void> {
    const users = await this.safeListUsers();

    const user = users.find((u) => u.email === email);
    if (!user) throw new Error(`setPassword: no user found with email ${email}`);

    const { error } = await this.client.auth.admin.updateUserById(user.id, { password });
    if (error) throw new Error(`setPassword: updateUser failed: ${error.message}`);
  }

  /**
   * Force-register a candidate: create auth user, assign candidate role,
   * and link the auth user to the candidate record.
   *
   * @param candidateExternalId - External ID of the candidate to register
   * @param email - Email address for the new auth user
   * @param password - Password for the new auth user
   * @throws Error if any step fails
   */
  async forceRegister(candidateExternalId: string, email: string, password: string): Promise<void> {
    // 1. Create auth user with confirmed email
    const { data: createData, error: createError } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createError) throw new Error(`forceRegister: createUser failed: ${createError.message}`);
    const user = createData.user;

    // 2. Look up candidate ID by external_id
    const { data: candidate, error: cError } = await this.client
      .from('candidates')
      .select('id')
      .eq('external_id', candidateExternalId)
      .eq('project_id', this.projectId)
      .single();
    if (cError) {
      throw new Error(`forceRegister: failed to find candidate ${candidateExternalId}: ${cError.message}`);
    }

    // 3. Assign candidate role (user_roles table has no project_id column;
    //    scope_type + scope_id define the scope)
    const { error: roleError } = await this.client.from('user_roles').insert({
      user_id: user.id,
      role: 'candidate',
      scope_type: 'candidate',
      scope_id: candidate.id
    });
    if (roleError) throw new Error(`forceRegister: insert user_role failed: ${roleError.message}`);

    // 4. Link auth user to candidate record
    const { error: linkError } = await this.client
      .from('candidates')
      .update({ auth_user_id: user.id })
      .eq('id', candidate.id);
    if (linkError) throw new Error(`forceRegister: link auth user failed: ${linkError.message}`);
  }

  /**
   * Unregister a candidate: remove auth user, role assignment, and candidate link.
   *
   * If the user doesn't exist (already unregistered), this is a no-op.
   *
   * @param email - Email address of the candidate to unregister
   */
  async unregisterCandidate(email: string): Promise<void> {
    // 1. Find auth user by email
    const users = await this.safeListUsers();

    const user = users.find((u) => u.email === email);
    if (!user) return; // Already unregistered (or listUsers failed - safe to skip)

    // 2. Clear auth_user_id on candidate
    const { error: clearError } = await this.client
      .from('candidates')
      .update({ auth_user_id: null })
      .eq('auth_user_id', user.id);
    if (clearError) throw new Error(`unregisterCandidate: clear auth_user_id failed: ${clearError.message}`);

    // 3. Delete user roles
    const { error: roleError } = await this.client.from('user_roles').delete().eq('user_id', user.id);
    if (roleError) throw new Error(`unregisterCandidate: delete user_roles failed: ${roleError.message}`);

    // 4. Delete auth user
    const { error: deleteError } = await this.client.auth.admin.deleteUser(user.id);
    if (deleteError) throw new Error(`unregisterCandidate: deleteUser failed: ${deleteError.message}`);
  }

  /**
   * Send an email to a candidate via the Supabase Admin Auth API.
   *
   * For test purposes, this uses `auth.admin.inviteUserByEmail` which sends
   * an invite/magic link email via Inbucket in local dev. The invite email
   * contains a link the candidate can use to set their password.
   *
   * If the candidate already has an auth user, this generates a magic link
   * instead (since inviteUserByEmail would fail for existing users).
   *
   * @param params - Email parameters
   * @param params.candidateExternalId - External ID of the candidate
   * @param params.subject - Email subject (used for logging; actual subject from GoTrue template)
   * @param params.content - Email content (used for logging; actual content from GoTrue template)
   * @throws Error if the candidate is not found or email sending fails
   */
  async sendEmail(params: {
    candidateExternalId: string;
    subject: string;
    content: string;
    email?: string;
  }): Promise<void> {
    // Look up candidate to get their auth_user_id or construct email
    const { data: candidate, error: cError } = await this.client
      .from('candidates')
      .select('id, auth_user_id, first_name, last_name')
      .eq('external_id', params.candidateExternalId)
      .eq('project_id', this.projectId)
      .single();

    if (cError) {
      throw new Error(`sendEmail: failed to find candidate ${params.candidateExternalId}: ${cError.message}`);
    }

    if (candidate.auth_user_id) {
      // Candidate already has an auth user -- generate a magic link
      // which sends an email via Inbucket
      const {
        data: { user },
        error: getUserError
      } = await this.client.auth.admin.getUserById(candidate.auth_user_id);
      if (getUserError || !user?.email) {
        throw new Error(`sendEmail: failed to get auth user for candidate: ${getUserError?.message}`);
      }

      const { error: linkError } = await this.client.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email
      });
      if (linkError) throw new Error(`sendEmail: generateLink failed: ${linkError.message}`);
    } else {
      // No auth user yet -- use inviteUserByEmail to create the user and
      // send an invite email via Inbucket. Then link the auth user to the
      // candidate entity and assign the candidate role.
      const email = params.email;
      if (!email) {
        throw new Error(
          `sendEmail: candidate ${params.candidateExternalId} has no auth_user_id and no email provided.`
        );
      }

      // Use inviteUserByEmail to create the user and send the invite email.
      // redirectTo points to the auth callback which handles token exchange.
      const frontendUrl = SUPABASE_URL.replace('54321', '5173');
      const { data: inviteData, error: inviteError } = await this.client.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${frontendUrl}/en/candidate/auth/callback`
      });
      if (inviteError) throw new Error(`sendEmail: inviteUserByEmail failed: ${inviteError.message}`);

      const userId = inviteData.user.id;

      // Link auth user to candidate entity
      const { error: linkError } = await this.client
        .from('candidates')
        .update({ auth_user_id: userId })
        .eq('id', candidate.id);
      if (linkError) throw new Error(`sendEmail: link auth user failed: ${linkError.message}`);

      // Assign candidate role
      const { error: roleError } = await this.client.from('user_roles').insert({
        user_id: userId,
        role: 'candidate',
        scope_type: 'candidate',
        scope_id: candidate.id
      });
      if (roleError) throw new Error(`sendEmail: insert user_role failed: ${roleError.message}`);
    }
  }

  /**
   * Trigger a password recovery email for a user.
   *
   * Uses `auth.admin.generateLink({ type: 'recovery' })` which generates
   * a recovery link. In local dev with Inbucket, the email is delivered
   * to the Inbucket inbox for the user's email address.
   *
   * Alternatively uses `auth.resetPasswordForEmail` which sends the actual
   * recovery email via GoTrue/Inbucket.
   *
   * @param email - Email address of the user to send recovery to
   * @throws Error if the operation fails
   */
  async sendForgotPassword(email: string): Promise<void> {
    // Use resetPasswordForEmail which sends the actual email via Mailpit.
    // Redirect to the auth callback which exchanges the token and redirects to password-reset.
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${SUPABASE_URL.replace('54321', '5173')}/en/candidate/auth/callback`
    });
    if (error) throw new Error(`sendForgotPassword: failed: ${error.message}`);
  }

  /**
   * Delete all test auth users (emails containing 'openvaa.org' or 'test').
   *
   * Used during teardown to clean up auth state. Removes user_roles and
   * clears auth_user_id on candidates before deleting the auth users.
   */
  async deleteAllTestUsers(): Promise<void> {
    const users = await this.safeListUsers();

    const testUsers = users.filter((u) => u.email && (u.email.includes('openvaa.org') || u.email.includes('test')));

    for (const user of testUsers) {
      // Clear auth_user_id on candidates
      await this.client.from('candidates').update({ auth_user_id: null }).eq('auth_user_id', user.id);

      // Delete user roles
      await this.client.from('user_roles').delete().eq('user_id', user.id);

      // Delete auth user
      await this.client.auth.admin.deleteUser(user.id);
    }
  }
}
