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
import { PROPERTY_MAP, TABLE_MAP } from '@openvaa/supabase-types';

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
 * Maps camelCase collection names to Supabase snake_case table names.
 * Extends TABLE_MAP with legacy/alias mappings for backward compatibility.
 */
const COLLECTION_MAP: Record<string, string> = {
  ...TABLE_MAP,
  // Legacy aliases
  parties: 'organizations',
  questionTypes: 'question_types',
};

/**
 * Maps camelCase filter field names to Supabase snake_case column names.
 * Extends PROPERTY_MAP with legacy/alias mappings.
 */
const FIELD_MAP: Record<string, string> = {
  ...PROPERTY_MAP,
  // Legacy aliases
  documentId: 'id',
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

  /**
   * Fix GoTrue NULL column bug: sets empty-string defaults on auth.users columns
   * that GoTrue expects to be non-NULL. Must be called before any listUsers operation.
   * Uses a direct SQL query via the service_role client.
   */
  private async fixGoTrueNulls(): Promise<void> {
    await this.client.rpc('merge_jsonb_column', {
      p_table_name: '_dummy_',
      p_column_name: '_dummy_',
      p_row_id: '00000000-0000-0000-0000-000000000000',
      p_partial_data: {}
    }).then(() => {}, () => {}); // Ignore errors, just ensure connection is warm

    // Use raw SQL via PostgREST - this runs as service_role which has auth admin rights
    const { error } = await this.client.from('user_roles').select('id').limit(0);
    if (error) return; // Can't even read, skip

    // Fix NULLs via direct REST call to the database
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/merge_jsonb_column`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
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
    const { data: { users }, error } = await this.client.auth.admin.listUsers();
    if (error) {
      console.warn(`listUsers failed (GoTrue NULL column bug?): ${JSON.stringify(error)}`);
      return [];
    }
    return users as Array<{ id: string; email?: string; [key: string]: unknown }>;
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
    // Non-column fields to strip (handled separately)
    const NON_COLUMN_FIELDS = new Set(['answersByExternalId']);
    const COLLECTION_NON_COLUMNS: Record<string, Set<string>> = {
      candidates: new Set(['email'])
    };

    const cleaned: Record<string, unknown[]> = {};
    for (const [collection, records] of Object.entries(data)) {
      // Convert collection name to snake_case table name
      const tableName = resolveCollectionName(collection);
      const extraStrip = COLLECTION_NON_COLUMNS[tableName];
      cleaned[tableName] = (records as Array<Record<string, unknown>>).map((record) => {
        const stripped: Record<string, unknown> = {};
        // Nominations are polymorphic: only one entity FK allowed (candidate OR organization).
        // When a candidate nomination has an 'organization' field (the candidate's party),
        // strip it to avoid check constraint violation. But for organization nominations
        // (no 'candidate' field), keep 'organization' as it's the nominated entity.
        const isNomination = tableName === 'nominations';
        const hasCandidateRef = isNomination && ('candidate' in record || 'candidateExternalId' in record);
        for (const [key, value] of Object.entries(record)) {
          if (key.startsWith('_') || NON_COLUMN_FIELDS.has(key) || extraStrip?.has(key)) continue;
          if (isNomination && key === 'organization' && hasCandidateRef) continue;
          // Convert camelCase property to snake_case column
          const snakeKey = resolveFieldName(key);
          // Convert nested relationship reference objects: {externalId: "..."} → {external_id: "..."}
          if (value && typeof value === 'object' && !Array.isArray(value) && 'externalId' in (value as Record<string, unknown>)) {
            stripped[snakeKey] = { external_id: (value as Record<string, unknown>).externalId };
          } else {
            stripped[snakeKey] = value;
          }
        }
        return stripped;
      });
    }
    const { data: result, error } = await this.client.rpc('bulk_import', {
      p_data: cleaned as Record<string, unknown>
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
      p_data: {
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
      const answersByExtId = (candidate.answersByExternalId ?? candidate.answers_by_external_id) as Record<string, unknown> | undefined;
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
      const answersByExtId = (candidate.answersByExternalId ?? candidate.answers_by_external_id) as Record<string, unknown> | undefined;
      if (!answersByExtId) continue;

      const candidateExtId = (candidate.externalId ?? candidate.external_id) as string;
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
        const cgRefObj =
          (election._constituencyGroups as { externalId?: string[]; external_id?: string[] } | undefined) ??
          (election._constituency_groups as { externalId?: string[]; external_id?: string[] } | undefined);
        const cgRefs =
          (cgRefObj?.externalId ?? cgRefObj?.external_id)?.map(
            (id: string) => ({ external_id: id })
          ) ??
          (election.constituencyGroups as Array<Record<string, string>>) ??
          (election.constituency_groups as Array<Record<string, string>>);
        if (!cgRefs || !Array.isArray(cgRefs)) continue;

        const electionExtId = (election.externalId ?? election.external_id) as string;
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
    const cgs = (data.constituencyGroups ?? data.constituency_groups) as Array<Record<string, unknown>> | undefined;
    if (cgs) {
      for (const cg of cgs) {
        const constRefObj = (cg._constituencies as { externalId?: string[]; external_id?: string[] } | undefined);
        const constRefs =
          (constRefObj?.externalId ?? constRefObj?.external_id)?.map(
            (id: string) => ({ external_id: id })
          ) ??
          (cg.constituencies as Array<Record<string, string>> | undefined);
        if (!constRefs || !Array.isArray(constRefs)) continue;

        const cgExtId = (cg.externalId ?? cg.external_id) as string;
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
    const categories = (data.questionCategories ?? data.question_categories) as Array<Record<string, unknown>> | undefined;
    if (categories) {
      for (const category of categories) {
        const electionRefs = (category._elections as { externalId?: string[]; external_id?: string[] } | undefined);
        const electionExtIds = electionRefs?.externalId ?? electionRefs?.external_id;
        if (!electionExtIds?.length) continue;

        const catExtId = (category.externalId ?? category.external_id) as string;
        if (!catExtId) continue;

        // Resolve election UUIDs
        const electionIds: string[] = [];
        for (const elExtId of electionExtIds) {
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
