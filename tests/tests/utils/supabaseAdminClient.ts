/**
 * Supabase Admin Client for E2E test data management.
 *
 * Replaces the StrapiAdminClient with a stateless wrapper around
 * `@supabase/supabase-js` initialized with the service_role key.
 * No login/dispose lifecycle needed -- the service_role key is self-authenticating.
 *
 * Methods cover: bulk data import/delete, auth user management, app settings
 * deep merge, answer import with question UUID resolution, and M:N join table linking.
 *
 * @example
 * ```ts
 * const client = new SupabaseAdminClient();
 * await client.bulkImport({ elections: [...], candidates: [...] });
 * await client.importAnswers({ candidates: [{ answersByExternalId: {...} }] });
 * await client.linkJoinTables({ elections: [...], constituency_groups: [...] });
 * await client.bulkDelete({ elections: { prefix: 'test-' } });
 * ```
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Stable UUID for the default test project, from seed.sql.
 */
export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Default Supabase URL for local development (supabase start).
 */
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

/**
 * Default service_role key for local development (supabase start).
 * This is the standard demo key embedded in the local Supabase CLI.
 */
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

/**
 * Maps Strapi-style camelCase collection names to Supabase snake_case table names.
 * Used by findData and bulkDelete for backward compatibility during migration.
 */
const COLLECTION_MAP: Record<string, string> = {
  constituencyGroups: 'constituency_groups',
  questionCategories: 'question_categories',
  questionTypes: 'question_types',
  parties: 'organizations',
  appSettings: 'app_settings',
  electionConstituencyGroups: 'election_constituency_groups',
  constituencyGroupConstituencies: 'constituency_group_constituencies',
  adminJobs: 'admin_jobs',
  userRoles: 'user_roles'
};

/**
 * Maps Strapi-style camelCase filter field names to Supabase snake_case column names.
 */
const FIELD_MAP: Record<string, string> = {
  externalId: 'external_id',
  firstName: 'first_name',
  lastName: 'last_name',
  shortName: 'short_name',
  electionDate: 'election_date',
  electionStartDate: 'election_start_date',
  termsOfUseAccepted: 'terms_of_use_accepted',
  authUserId: 'auth_user_id',
  projectId: 'project_id',
  organizationId: 'organization_id',
  sortOrder: 'sort_order',
  customData: 'custom_data',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  documentId: 'id'
};

/**
 * Result of a find operation, backward-compatible with StrapiAdminClient.
 */
export interface FindDataResult {
  type: 'success' | 'failure';
  data?: Array<Record<string, unknown>>;
  cause?: string;
}

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

export class SupabaseAdminClient {
  private client: SupabaseClient;
  private projectId: string;

  constructor(url?: string, serviceRoleKey?: string, projectId?: string) {
    this.client = createClient(url ?? SUPABASE_URL, serviceRoleKey ?? SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    this.projectId = projectId ?? TEST_PROJECT_ID;
  }

  // ---------------------------------------------------------------------------
  // Bulk data operations
  // ---------------------------------------------------------------------------

  /**
   * Bulk import data via the bulk_import RPC.
   *
   * @param data - Object mapping collection names to arrays of records to import
   * @returns The bulk_import result JSON with created/updated counts per collection
   * @throws Error if the RPC call fails
   */
  async bulkImport(data: Record<string, unknown[]>): Promise<Record<string, unknown>> {
    // Strip fields that are not database columns:
    // - _ prefixed fields (relationship references handled by linkJoinTables)
    // - answers_by_external_id (handled by importAnswers)
    // - email on candidates (stored in auth.users, not candidates table)
    const NON_COLUMN_FIELDS = new Set(['answers_by_external_id']);
    const COLLECTION_NON_COLUMNS: Record<string, Set<string>> = {
      candidates: new Set(['email'])
    };
    const cleaned: Record<string, unknown[]> = {};
    for (const [collection, records] of Object.entries(data)) {
      const extraStrip = COLLECTION_NON_COLUMNS[collection];
      cleaned[collection] = (records as Array<Record<string, unknown>>).map((record) => {
        const stripped: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(record)) {
          if (!key.startsWith('_') && !NON_COLUMN_FIELDS.has(key) && !extraStrip?.has(key)) {
            stripped[key] = value;
          }
        }
        return stripped;
      });
    }
    const { data: result, error } = await this.client.rpc('bulk_import', {
      data: cleaned as Record<string, unknown>
    });
    if (error) throw new Error(`bulkImport failed: ${error.message}`);
    return result as Record<string, unknown>;
  }

  /**
   * Bulk delete data via the bulk_delete RPC.
   *
   * @param collections - Object mapping collection names to deletion criteria
   * @returns The bulk_delete result JSON with deleted counts per collection
   * @throws Error if the RPC call fails
   */
  async bulkDelete(
    collections: Record<string, { prefix?: string; ids?: string[]; external_ids?: string[] }>
  ): Promise<Record<string, unknown>> {
    const { data: result, error } = await this.client.rpc('bulk_delete', {
      data: {
        project_id: this.projectId,
        collections
      }
    });
    if (error) throw new Error(`bulkDelete failed: ${error.message}`);
    return result as Record<string, unknown>;
  }

  // ---------------------------------------------------------------------------
  // Answer import with question UUID resolution
  // ---------------------------------------------------------------------------

  /**
   * Import answers from dataset entries that use `answersByExternalId`.
   *
   * After bulk_import creates questions and candidates, this method resolves
   * question external_ids to UUIDs, builds the `answers` JSONB, and updates
   * each candidate record.
   *
   * @param data - The same dataset passed to bulkImport, containing candidates
   *   with `answersByExternalId` fields
   */
  async importAnswers(data: Record<string, unknown[]>): Promise<void> {
    const candidates = data.candidates as Array<Record<string, unknown>> | undefined;
    if (!candidates) return;

    // Collect all question external_ids referenced across all candidates
    const questionExtIds = new Set<string>();
    for (const candidate of candidates) {
      const answersByExtId = candidate.answers_by_external_id as Record<string, unknown> | undefined;
      if (!answersByExtId) continue;
      for (const extId of Object.keys(answersByExtId)) {
        questionExtIds.add(extId);
      }
    }

    if (questionExtIds.size === 0) return;

    // Query question UUIDs by external_id
    const { data: questions, error: qError } = await this.client
      .from('questions')
      .select('id, external_id')
      .in('external_id', [...questionExtIds])
      .eq('project_id', this.projectId);

    if (qError) throw new Error(`importAnswers: failed to query questions: ${qError.message}`);
    if (!questions || questions.length === 0) {
      throw new Error(`importAnswers: no questions found for external_ids: ${[...questionExtIds].join(', ')}`);
    }

    // Build external_id -> UUID map
    const extIdToUuid = new Map<string, string>();
    for (const q of questions) {
      extIdToUuid.set(q.external_id, q.id);
    }

    // For each candidate with answersByExternalId, build UUID-keyed answers and update
    for (const candidate of candidates) {
      const answersByExtId = candidate.answers_by_external_id as Record<string, unknown> | undefined;
      if (!answersByExtId) continue;

      const candidateExtId = candidate.external_id as string;
      if (!candidateExtId) continue;

      // Build answers JSONB keyed by question UUID
      const answers: Record<string, unknown> = {};
      for (const [extId, answer] of Object.entries(answersByExtId)) {
        const uuid = extIdToUuid.get(extId);
        if (uuid) {
          answers[uuid] = answer;
        }
      }

      // Look up candidate id by external_id
      const { data: candidateRow, error: cError } = await this.client
        .from('candidates')
        .select('id')
        .eq('external_id', candidateExtId)
        .eq('project_id', this.projectId)
        .single();

      if (cError) throw new Error(`importAnswers: failed to find candidate ${candidateExtId}: ${cError.message}`);

      // Update candidate answers
      const { error: uError } = await this.client
        .from('candidates')
        .update({ answers })
        .eq('id', candidateRow.id);

      if (uError) {
        throw new Error(`importAnswers: failed to update candidate ${candidateExtId} answers: ${uError.message}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // M:N join table linking
  // ---------------------------------------------------------------------------

  /**
   * Populate M:N join tables after bulk_import.
   *
   * Scans imported data for:
   * - `elections[].constituency_groups` -> election_constituency_groups
   * - `constituency_groups[].constituencies` -> constituency_group_constituencies
   *
   * Resolves external_ids to UUIDs and inserts into join tables.
   *
   * @param data - The same dataset passed to bulkImport
   */
  async linkJoinTables(data: Record<string, unknown[]>): Promise<void> {
    // Link election -> constituency_groups
    const elections = data.elections as Array<Record<string, unknown>> | undefined;
    if (elections) {
      for (const election of elections) {
        const cgRefs =
          (election._constituency_groups as { external_id: string[] } | undefined)?.external_id?.map(
            (id: string) => ({ external_id: id })
          ) ??
          (election.constituency_groups as Array<Record<string, string>>) ??
          (election.constituencyGroups as Array<Record<string, string>>);
        if (!cgRefs || !Array.isArray(cgRefs)) continue;

        const electionExtId = election.external_id as string;
        if (!electionExtId) continue;

        // Resolve election UUID
        const { data: electionRow, error: eError } = await this.client
          .from('elections')
          .select('id')
          .eq('external_id', electionExtId)
          .eq('project_id', this.projectId)
          .single();
        if (eError) throw new Error(`linkJoinTables: failed to find election ${electionExtId}: ${eError.message}`);

        for (const cgRef of cgRefs) {
          const cgExtId = cgRef.external_id ?? cgRef.externalId;
          if (!cgExtId) continue;

          // Resolve constituency_group UUID
          const { data: cgRow, error: cgError } = await this.client
            .from('constituency_groups')
            .select('id')
            .eq('external_id', cgExtId)
            .eq('project_id', this.projectId)
            .single();
          if (cgError) {
            throw new Error(
              `linkJoinTables: failed to find constituency_group ${cgExtId}: ${cgError.message}`
            );
          }

          // Insert join table row (ignore conflicts for idempotency)
          const { error: insertError } = await this.client
            .from('election_constituency_groups')
            .upsert(
              { election_id: electionRow.id, constituency_group_id: cgRow.id },
              { onConflict: 'election_id,constituency_group_id' }
            );
          if (insertError) {
            throw new Error(
              `linkJoinTables: failed to insert election_constituency_groups: ${insertError.message}`
            );
          }
        }
      }
    }

    // Link constituency_group -> constituencies
    const cgs = data.constituency_groups as Array<Record<string, unknown>> | undefined;
    if (cgs) {
      for (const cg of cgs) {
        const constRefs =
          (cg._constituencies as { external_id: string[] } | undefined)?.external_id?.map(
            (id: string) => ({ external_id: id })
          ) ??
          (cg.constituencies as Array<Record<string, string>> | undefined);
        if (!constRefs || !Array.isArray(constRefs)) continue;

        const cgExtId = cg.external_id as string;
        if (!cgExtId) continue;

        // Resolve constituency_group UUID
        const { data: cgRow, error: cgError } = await this.client
          .from('constituency_groups')
          .select('id')
          .eq('external_id', cgExtId)
          .eq('project_id', this.projectId)
          .single();
        if (cgError) {
          throw new Error(`linkJoinTables: failed to find constituency_group ${cgExtId}: ${cgError.message}`);
        }

        for (const constRef of constRefs) {
          const constExtId = constRef.external_id ?? constRef.externalId;
          if (!constExtId) continue;

          // Resolve constituency UUID
          const { data: constRow, error: cError } = await this.client
            .from('constituencies')
            .select('id')
            .eq('external_id', constExtId)
            .eq('project_id', this.projectId)
            .single();
          if (cError) {
            throw new Error(
              `linkJoinTables: failed to find constituency ${constExtId}: ${cError.message}`
            );
          }

          // Insert join table row (ignore conflicts for idempotency)
          const { error: insertError } = await this.client
            .from('constituency_group_constituencies')
            .upsert(
              { constituency_group_id: cgRow.id, constituency_id: constRow.id },
              { onConflict: 'constituency_group_id,constituency_id' }
            );
          if (insertError) {
            throw new Error(
              `linkJoinTables: failed to insert constituency_group_constituencies: ${insertError.message}`
            );
          }
        }
      }
    }

    // Link question_categories -> elections (via election_ids JSONB column)
    const categories = data.question_categories as Array<Record<string, unknown>> | undefined;
    if (categories) {
      for (const category of categories) {
        const electionRefs = category._elections as { external_id: string[] } | undefined;
        if (!electionRefs?.external_id?.length) continue;

        const catExtId = category.external_id as string;
        if (!catExtId) continue;

        // Resolve election UUIDs
        const electionIds: string[] = [];
        for (const elExtId of electionRefs.external_id) {
          const { data: elRow, error: elError } = await this.client
            .from('elections')
            .select('id')
            .eq('external_id', elExtId)
            .eq('project_id', this.projectId)
            .single();
          if (elError)
            throw new Error(`linkJoinTables: failed to find election ${elExtId}: ${elError.message}`);
          electionIds.push(elRow.id);
        }

        // Update the question_category with resolved election_ids
        const { error: updateError } = await this.client
          .from('question_categories')
          .update({ election_ids: electionIds })
          .eq('external_id', catExtId)
          .eq('project_id', this.projectId);
        if (updateError) {
          throw new Error(
            `linkJoinTables: failed to update question_category ${catExtId} election_ids: ${updateError.message}`
          );
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // App settings
  // ---------------------------------------------------------------------------

  /**
   * Deep-merge partial settings into the app_settings.settings JSONB column.
   *
   * Uses the merge_jsonb_column RPC for recursive deep merge, which eliminates
   * the Strapi "Pitfall 2" where PUT replaced entire components. Callers only
   * need to send the settings they want to change.
   *
   * @param partialSettings - Partial settings object to deep-merge
   * @throws Error if the app_settings row is not found or the merge fails
   */
  async updateAppSettings(partialSettings: Record<string, unknown>): Promise<void> {
    // Get the app_settings row ID for this project
    const { data: row, error: fetchError } = await this.client
      .from('app_settings')
      .select('id')
      .eq('project_id', this.projectId)
      .single();

    if (fetchError) throw new Error(`updateAppSettings: failed to fetch app_settings: ${fetchError.message}`);

    // Deep merge via RPC
    const { error } = await this.client.rpc('merge_jsonb_column', {
      p_table_name: 'app_settings',
      p_column_name: 'settings',
      p_row_id: row.id,
      p_partial_data: partialSettings
    });

    if (error) throw new Error(`updateAppSettings: merge failed: ${error.message}`);
  }

  // ---------------------------------------------------------------------------
  // Data querying
  // ---------------------------------------------------------------------------

  /**
   * Find data in a collection with Strapi-style filters.
   *
   * Translates Strapi filter syntax `{ field: { $eq: value } }` to PostgREST
   * `.eq(field, value)`. Adds `documentId: row.id` to each result row for
   * backward compatibility with StrapiAdminClient consumers.
   *
   * @param collection - Collection name (camelCase or snake_case)
   * @param filters - Strapi-style filter object
   * @returns FindDataResult with matching records
   */
  async findData(
    collection: string,
    filters: Record<string, unknown>
  ): Promise<FindDataResult> {
    const tableName = resolveCollectionName(collection);
    let query = this.client.from(tableName).select('*');

    // Apply filters: translate Strapi { field: { $eq: value } } to .eq(field, value)
    for (const [key, filterValue] of Object.entries(filters)) {
      const snakeKey = resolveFieldName(key);

      if (typeof filterValue === 'object' && filterValue !== null && !Array.isArray(filterValue)) {
        const filterObj = filterValue as Record<string, unknown>;
        if ('$eq' in filterObj) {
          query = query.eq(snakeKey, filterObj.$eq as string);
        } else if ('$ne' in filterObj) {
          query = query.neq(snakeKey, filterObj.$ne as string);
        } else if ('$in' in filterObj) {
          query = query.in(snakeKey, filterObj.$in as string[]);
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

    // Add documentId alias for backward compatibility (Strapi's documentId = Supabase's id)
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
    const { data: { users }, error: listError } = await this.client.auth.admin.listUsers();
    if (listError) throw new Error(`setPassword: listUsers failed: ${listError.message}`);

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
    const { data: { users }, error: listError } = await this.client.auth.admin.listUsers();
    if (listError) throw new Error(`unregisterCandidate: listUsers failed: ${listError.message}`);

    const user = users.find((u) => u.email === email);
    if (!user) return; // Already unregistered

    // 2. Clear auth_user_id on candidate
    const { error: clearError } = await this.client
      .from('candidates')
      .update({ auth_user_id: null })
      .eq('auth_user_id', user.id);
    if (clearError) throw new Error(`unregisterCandidate: clear auth_user_id failed: ${clearError.message}`);

    // 3. Delete user roles
    const { error: roleError } = await this.client
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);
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
  }): Promise<void> {
    // Look up candidate to get their auth_user_id or construct email
    const { data: candidate, error: cError } = await this.client
      .from('candidates')
      .select('id, auth_user_id, first_name, last_name')
      .eq('external_id', params.candidateExternalId)
      .eq('project_id', this.projectId)
      .single();

    if (cError) {
      throw new Error(
        `sendEmail: failed to find candidate ${params.candidateExternalId}: ${cError.message}`
      );
    }

    if (candidate.auth_user_id) {
      // Candidate already has an auth user -- generate a magic link
      // which sends an email via Inbucket
      const { data: { user }, error: getUserError } = await this.client.auth.admin.getUserById(
        candidate.auth_user_id
      );
      if (getUserError || !user?.email) {
        throw new Error(`sendEmail: failed to get auth user for candidate: ${getUserError?.message}`);
      }

      const { error: linkError } = await this.client.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email
      });
      if (linkError) throw new Error(`sendEmail: generateLink failed: ${linkError.message}`);
    } else {
      // No auth user yet -- use inviteUserByEmail which creates the user
      // and sends an invite email. We need to look up the email from the
      // dataset or construct it. Since candidates don't have an email column
      // in Supabase, the test data must provide the email differently.
      // For now, throw a descriptive error -- the caller should use forceRegister
      // first or the invite-candidate Edge Function.
      throw new Error(
        `sendEmail: candidate ${params.candidateExternalId} has no auth_user_id. ` +
        'Use forceRegister first to create the auth user, or use inviteUserByEmail directly.'
      );
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
    // Use resetPasswordForEmail which sends the actual email via Inbucket
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${SUPABASE_URL.replace('54321', '5173')}/candidate/password-reset`
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
    const { data: { users }, error: listError } = await this.client.auth.admin.listUsers();
    if (listError) throw new Error(`deleteAllTestUsers: listUsers failed: ${listError.message}`);

    const testUsers = users.filter(
      (u) => u.email && (u.email.includes('openvaa.org') || u.email.includes('test'))
    );

    for (const user of testUsers) {
      // Clear auth_user_id on candidates
      await this.client
        .from('candidates')
        .update({ auth_user_id: null })
        .eq('auth_user_id', user.id);

      // Delete user roles
      await this.client.from('user_roles').delete().eq('user_id', user.id);

      // Delete auth user
      await this.client.auth.admin.deleteUser(user.id);
    }
  }
}
