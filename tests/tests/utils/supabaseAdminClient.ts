/**
 * Supabase Admin Client for E2E test data management.
 *
 * Subclasses the bulk-write base from `@openvaa/dev-seed`. The base owns the bulk-write surface (bulkImport, bulkDelete, importAnswers, linkJoinTables, updateAppSettings). This subclass adds the auth/email + legacy E2E query helpers that tests/ needs but dev-seed does not — keeping the dev-seed surface narrow.
 *
 * `updateAppSettings` (inherited) usage policy:
 *   Baseline test-setup usage of `updateAppSettings` has migrated to the `@openvaa/dev-seed` e2e template's `app_settings.fixed[]` block.
 *
 *   `updateAppSettings` is RETAINED for per-test scenario mutations: specs may call it inside `beforeAll` / `afterAll` to test behavior-under-different-settings (e.g. perm-startfromcg.spec.ts resolves + writes startFromConstituencyGroup at runtime).
 *
 *   Do NOT use `updateAppSettings` from a `*.setup.ts` file for baseline settings — extend the appropriate template instead.
 *
 * Inherited from `DevSeedAdminClient`:
 *   - `constructor(url?, serviceRoleKey?, projectId?)`
 *   - `protected client: SupabaseClient`
 *   - `protected projectId: string`
 *   - `public bulkImport(data)`
 *   - `public bulkDelete(collections)`
 *   - `public importAnswers(data)`
 *   - `public linkJoinTables(data)`
 *   - `public updateAppSettings(partialSettings)` — see usage-policy note above
 *
 * Added by this subclass:
 *   - Auth helpers (private): `safeListUsers`
 *   - E2E query helpers: `findData`, `query`, `update`, `getAppSettings`,
 *     `countRowsByPrefix`
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

import { ALLOWED_TEARDOWN_TABLES, SupabaseAdminClient as DevSeedAdminClient, TEST_PROJECT_ID } from '@openvaa/dev-seed';
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
  query(collection: string) {
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
   * Post-seed read helper.
   *
   * Returns the current persisted `app_settings.settings` JSONB for this client's project, or `null` if the bootstrap row is missing.
   *
   * Consumed by `data.setup.ts` immediately after `writer.write(...)` to verify the dev-seed e2e template's `app_settings.fixed[]` block actually persisted via Pass-5 (`merge_jsonb_column`). Subset match (`expect(...).toMatchObject(expected)`) — `merge_jsonb_column` is additive, so stale keys from a prior run do not fail the assertion.
   *
   * Mirrors the read shape of the inherited `updateAppSettings` method (`packages/dev-seed/src/supabaseAdminClient.ts`) but selects `settings` instead of `id`.
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
    return (row?.settings ?? null) as Record<string, unknown> | null;
  }

  /**
   * Exact row count across the ten teardown tables for a given `external_id` prefix.
   *
   * Iterates `ALLOWED_TEARDOWN_TABLES` imported from `@openvaa/dev-seed` — the SAME
   * list `runTeardown`'s `bulkDelete` clears — so the probe cannot drift from the
   * delete it measures.
   *
   * Uses a HEAD count query (`{ count: 'exact', head: true }`) and reads the returned
   * `count`, never the length of a returned row array — that length is bounded by
   * PostgREST's default page limit and would silently under-report a prefix matching
   * more rows than one page.
   *
   * Read-only — returns integers only, no row content. Scoped by `project_id` and by
   * `external_id LIKE '<prefix>%'`, matching the delete's own prefix semantics.
   *
   * Phase 140 WR-06: `%` / `_` / `*` are rejected before the query runs.
   * PostgREST's `like` filter (used here) is not byte-identical to the RPC's
   * raw SQL `LIKE` that `bulk_delete` executes (`00001_initial_schema.sql`):
   * PostgREST maps a literal `*` in the input to SQL `%`, and neither side
   * escapes `_` (a SQL LIKE single-character wildcard), so a prefix carrying
   * any of these three characters would be counted under a DIFFERENT match
   * set than `bulk_delete` actually deletes — the exact drift the shared
   * `ALLOWED_TEARDOWN_TABLES` constant was meant to preclude, reintroduced
   * through the operator instead of the table list. All 27 current E2E
   * prefixes are plain hyphenated strings and are unaffected; the guard exists
   * for the dev-seed CLI's default `seed_` prefix (which contains `_`) in case
   * this probe is ever reused on that path.
   *
   * @param prefix - `external_id` prefix, forwarded verbatim (no normalisation).
   * @returns total matching rows summed across the ten tables.
   * @throws Error if any per-table count query fails, or if `prefix` contains a
   *   LIKE metacharacter (`%`, `_`, `*`).
   */
  async countRowsByPrefix(prefix: string): Promise<number> {
    if (/[%_*]/.test(prefix)) {
      throw new Error(
        `countRowsByPrefix: prefix '${prefix}' contains a LIKE metacharacter (% _ *); the probe and ` +
          'bulk_delete do not agree on its meaning (PostgREST\'s `like` maps `*` to `%`, and neither ' +
          'side escapes `_`), so the count would not measure the same rows the delete touches.'
      );
    }
    let total = 0;
    for (const table of ALLOWED_TEARDOWN_TABLES) {
      const { count, error } = await this.client
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('project_id', this.projectId)
        .like('external_id', `${prefix}%`);
      if (error) {
        throw new Error(`countRowsByPrefix failed: ${error.message}`);
      }
      total += count ?? 0;
    }
    return total;
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

    // Wrap the 4-step mutation chain in try/catch with a compensating
    // `auth.admin.deleteUser` rollback on partial failure. Without it, a failure
    // in step 2/3/4 leaves orphan auth users that surface as "User already
    // exists" errors on subsequent test runs, requiring manual cleanup.
    try {
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
    } catch (mutationErr) {
      // reason: compensating rollback on partial failure prevents orphan auth
      // users that cascade as "User already exists" errors across subsequent
      // test runs. The rollback failure (if any) is logged but not re-thrown —
      // we always re-throw the original mutationErr so the caller sees the real
      // cause.
      await this.client.auth.admin.deleteUser(user.id).then(
        () => {},
        (rollbackErr) => {
          console.error('[forceRegister] rollback (auth.admin.deleteUser) failed:', rollbackErr);
        }
      );
      throw mutationErr;
    }
  }

  /**
   * Delete the bank-auth candidate row + its role assignment created by the
   * identity-callback Edge Function for a given placeholder email.
   *
   * The bank-auth self-registration flow (EFLOW-10b) creates a FRESH
   * `candidates` row (no `external_id`, so `runTeardown` prefix-deletes miss it)
   * linked via `auth_user_id` to the auth user the Edge Function created under
   * the identity-derived placeholder email (`${sub}@bank-auth.placeholder`).
   * Without this explicit delete the orphan candidate rows accumulate across the
   * 3× determinism gate (each run creates a new candidate, and the prior run's
   * `unregisterCandidate` only nulls `auth_user_id` + deletes the auth user).
   *
   * Deletes the candidate row(s) AND their `user_roles` before
   * `unregisterCandidate` removes the auth user. Idempotent — a no-op when no
   * user or candidate matches.
   *
   * @param placeholderEmail - The `${sub}@bank-auth.placeholder` address the
   *   bank-auth auth user was created with.
   */
  /**
   * Look up a bank-auth `auth.users` row by email via the admin list API,
   * returning the narrowed fields the EFLOW-10b journey end-state assertion
   * reads: `id` + the bank-auth identity `app_metadata` claims the
   * identity-callback Edge Function stamped at create time.
   *
   * `auth.users` lives in the `auth` schema, NOT the `public` schema that
   * `findData`/`query` target via PostgREST — so it must be read through the
   * GoTrue admin API. Returns `undefined` when no user matches (idempotent).
   *
   * @param email - The auth user's email (for bank-auth: the identity-derived
   *   placeholder `${sub}@bank-auth.placeholder`).
   */
  async getAuthUserByEmail(email: string): Promise<
    | {
        id: string;
        email?: string;
        app_metadata?: {
          identity_provider?: string;
          identity_match_prop?: string;
          identity_match_value?: string;
        };
      }
    | undefined
  > {
    const users = await this.safeListUsers();
    const user = users.find((u) => u.email === email);
    if (!user) return undefined;
    return {
      id: user.id,
      email: user.email,
      app_metadata: (user.app_metadata ?? {}) as {
        identity_provider?: string;
        identity_match_prop?: string;
        identity_match_value?: string;
      }
    };
  }

  async deleteBankAuthCandidateBySub(placeholderEmail: string): Promise<void> {
    const users = await this.safeListUsers();
    const user = users.find((u) => u.email === placeholderEmail);
    if (!user) return; // Nothing created yet (or listUsers failed — safe to skip).

    // Find candidate row(s) linked to this auth user.
    const { data: candidates, error: findError } = await this.client
      .from('candidates')
      .select('id')
      .eq('auth_user_id', user.id);
    if (findError) {
      throw new Error(`deleteBankAuthCandidateBySub: find candidates failed: ${findError.message}`);
    }
    for (const candidate of candidates ?? []) {
      // Delete the candidate's role assignment (scope_id = candidate id).
      const { error: roleError } = await this.client
        .from('user_roles')
        .delete()
        .eq('scope_type', 'candidate')
        .eq('scope_id', candidate.id);
      if (roleError) {
        throw new Error(`deleteBankAuthCandidateBySub: delete user_roles failed: ${roleError.message}`);
      }
      // Delete the candidate row itself.
      const { error: candError } = await this.client.from('candidates').delete().eq('id', candidate.id);
      if (candError) {
        throw new Error(`deleteBankAuthCandidateBySub: delete candidate failed: ${candError.message}`);
      }
    }
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

    // 2. Clear auth_user_id AND terms_of_use_accepted on the candidate row.
    //    Without resetting `terms_of_use_accepted` the candidate-registration
    //    spec sees a stale "ToU already accepted" state on subsequent runs:
    //    the auth user is freshly created by the test but the underlying
    //    candidate row still carries the ToU timestamp from the prior run, so
    //    the post-login ToU gate is bypassed and the test reaches /candidate
    //    home directly instead of finding the ToU checkbox.
    const { error: clearError } = await this.client
      .from('candidates')
      .update({ auth_user_id: null, terms_of_use_accepted: null })
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

    // Propagate per-user step errors instead of silently swallowing them.
    // Discarding PostgREST/admin-API errors on every step lets a teardown that
    // fails mid-loop proceed against a corrupted state and produce confusing
    // downstream failures. Collect errors and throw at the end with an
    // aggregated message so partial deletions complete first.
    const errors: Array<{ user: string; step: string; error: unknown }> = [];

    for (const user of testUsers) {
      // Clear auth_user_id on candidates
      const { error: clearError } = await this.client
        .from('candidates')
        .update({ auth_user_id: null })
        .eq('auth_user_id', user.id);
      if (clearError) errors.push({ user: user.id, step: 'clear-auth-user-id', error: clearError });

      // Delete user roles
      const { error: rolesError } = await this.client.from('user_roles').delete().eq('user_id', user.id);
      if (rolesError) errors.push({ user: user.id, step: 'delete-user-roles', error: rolesError });

      // Delete auth user
      const { error: deleteError } = await this.client.auth.admin.deleteUser(user.id);
      if (deleteError) errors.push({ user: user.id, step: 'delete-auth-user', error: deleteError });
    }

    if (errors.length > 0) {
      // reason: collect-and-throw at end so partial deletions complete first AND
      // the caller sees the failures (matches `unregisterCandidate`'s
      // throw-on-error pattern in this file).
      throw new Error(`deleteAllTestUsers: ${errors.length} failure(s) — ${JSON.stringify(errors)}`);
    }
  }
}
