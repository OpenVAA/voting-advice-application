/**
 * @openvaa/dev-seed SupabaseAdminClient — bulk-write surface for dev data seeding.
 *
 * Split out of tests/tests/utils/supabaseAdminClient.ts. The tests/ file is a thin subclass that adds auth/email + legacy E2E query helpers on top of this base.
 *
 * Env-var handling: the module-level fallbacks below preserve backward-compat for tests/ E2E. Env enforcement — failing loudly when env is missing — is the Writer's responsibility (packages/dev-seed/src/writer.ts), NOT this file — pure generators consuming this client must stay env-free so `yarn test:unit` doesn't require env fixture.
 *
 * Bulk-import routing note: `bulk_import` RPC's `processing_order` accepts exactly 11 of 16 non-system tables. `accounts`, `projects`, `feedback`, `constituency_group_constituencies`, `election_constituency_groups` are NOT in that list. Callers must route those elsewhere (writer strips accounts/projects, feedback via direct upsert, joins via linkJoinTables). This file does not enforce the routing — it is a thin RPC wrapper.
 */

import { createClient } from '@supabase/supabase-js';
import { planLinks } from './template/linkSentinels';
import {
  ANSWERS_BY_EXTERNAL_ID_KEY,
  COLLECTION_NON_COLUMNS,
  FIELD_MAP,
  NON_COLUMN_FIELDS,
  resolveCollectionName
} from './template/permittedKeys';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LinkPlanEntry, LinkTarget } from './template/linkSentinels';

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
 * Result of a find operation.
 *
 * Consumed by the `findData` helper that lives in the tests/ subclass; re-exported from here so tests/ can `export type { FindDataResult } from '@openvaa/dev-seed'`.
 */
export interface FindDataResult {
  type: 'success' | 'failure';
  data?: Array<Record<string, unknown>>;
  cause?: string;
}

/**
 * Convert a camelCase field name to snake_case using FIELD_MAP, or fall through as-is if already snake_case.
 *
 * `FIELD_MAP` and `resolveCollectionName` now live in `./template/permittedKeys`, which derives the permitted-key sets from them.
 * Keeping a second copy here would let the map that renames keys drift from the map that decides which keys are legal.
 */
function resolveFieldName(field: string): string {
  // `Object.hasOwn`, not `??`: `FIELD_MAP` is a plain object literal, so a bare index also saw inherited members and `resolveFieldName('toString')` returned `Object.prototype.toString` — a function used one line later as a column name. Same defect and same fix as `resolveCollectionName`; `field` is template-controlled data here too.
  return Object.hasOwn(FIELD_MAP, field) ? FIELD_MAP[field] : field;
}

/**
 * Read a row's answer payload — under {@link ANSWERS_BY_EXTERNAL_ID_KEY} and no other spelling.
 *
 * ⚠ **`row.answers_by_external_id` is NOT a second legal spelling, and there is deliberately no fallback to it here.** It is not functional in either direction:
 *
 *  - it is not a column, and it is absent from `COLUMN_MAP` / `PROPERTY_MAP`, so `bulkImport`'s strip loop did not recognise it and forwarded it to the RPC as a nonexistent column — `_bulk_upsert_record` rejects the whole row with `column "answers_by_external_id" of relation "candidates" does not exist`;
 *  - and it is on neither side of the permission split, so Pass 0 (which runs above Pass 1 in `Writer.write`) throws on it first.
 *
 * A row carrying it therefore never reaches this method by any path. Reading it here would be worse than dead code: it would advertise a second legal spelling that the guard rejects and the RPC cannot accept. The key is derived from `NON_COLUMN_FIELD_LIST`'s sole member rather than written twice as a literal, so the spelling this reads and the spelling the guard permits are the same string by construction.
 */
function readAnswersByExternalId(row: Record<string, unknown>): Record<string, unknown> | undefined {
  return row[ANSWERS_BY_EXTERNAL_ID_KEY] as Record<string, unknown> | undefined;
}

/**
 * The three `external_id`-lookup failure messages, verbatim.
 *
 * These are the operator-facing contract: triage greps for `linkJoinTables: failed to find <noun>`. Held as three separate literals — rather than one interpolated `${noun}` — precisely so each stays greppable in the source now that one helper covers all four lookups. Changing a word here changes nothing functionally and breaks triage.
 */
const LINK_LOOKUP_ERRORS: Record<
  'elections' | 'constituency_groups' | 'constituencies',
  (id: string, m: string) => string
> = {
  elections: (id, m) => `linkJoinTables: failed to find election ${id}: ${m}`,
  constituency_groups: (id, m) => `linkJoinTables: failed to find constituency_group ${id}: ${m}`,
  constituencies: (id, m) => `linkJoinTables: failed to find constituency ${id}: ${m}`
};

/**
 * Admin-client base for the dev-seed package.
 *
 * Narrow bulk-write surface: bulkImport, bulkDelete, importAnswers, linkJoinTables, updateAppSettings. Auth / email / legacy E2E query helpers live in the tests/ subclass.
 *
 * `client` and `projectId` are `protected` (not `private`) so the tests/subclass can reuse the Supabase REST client for its auth helpers without re-creating a second client.
 */
export class SupabaseAdminClient {
  protected client: SupabaseClient;
  protected projectId: string;

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
  async bulkImport(data: Record<string, Array<unknown>>): Promise<Record<string, unknown>> {
    // Non-column fields to strip (handled separately). `NON_COLUMN_FIELDS` and `COLLECTION_NON_COLUMNS` were declared inline here; they now live in `./template/permittedKeys` with the same contents and a one-line reason beside each entry, so the strip decision and the permission decision are one declaration. The stripping behaviour below is unchanged.
    //
    // ⚠ `elections.constituencyGroups` / `.constituency_groups` and `constituency_groups.constituencies` are stripped here, but `LINK_SENTINELS` is the authority for whether they are PERMITTED. See the note on `COLLECTION_NON_COLUMN_LIST` in `./template/permittedKeys`.

    // Tables with a `published boolean NOT NULL DEFAULT false` column that anon RLS reads. Seeded rows must be visible to the frontend's anon client, so this defaults `published` to `true` on the listed tables when a record does not already set it. An explicit value from a template is honoured — a template can still emit `published: false` to seed draft rows.
    //
    // ⚠ THIS DEFAULT IS NOT SUFFICIENT FOR `candidates`. It is sufficient only for tables whose anon predicate is the single published clause (as `organizations`' is). The `anon_select_candidates` policy is THREE clauses, quoted verbatim from its authority, `apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql`:
    //
    //     published = true AND terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now()
    //
    // This default satisfies the first of the three and knows nothing about the other two. Consequence: a template that relies on this default alone for candidates seeds rows that are `published` and still invisible to the voter app's anon client. A defect of that shape can sit under a green suite indefinitely, because every other check in this repository reads as service_role, which bypasses RLS entirely. The default template now supplies the missing clause itself, in `./templates/defaults/candidates-override.ts`, and `e2e/base` supplies it per-row in `./templates/e2e/base.ts`.
    //
    // ⚠ Do NOT "fix" this by stamping `terms_of_use_accepted` here. A default at this layer reaches EVERY template, including `e2e/base`'s deliberately unaccepted `ca-aa-hidden` and `ca-aa-unregistered` rows — an in-repo negative control that gate-suite specs depend on staying hidden.
    //
    // ⚠ Standing caution for the next author: whether any of the OTHER tables listed below has an anon predicate this default likewise under-satisfies was NOT AUDITED; the asymmetry is established for `candidates` only.
    // Before trusting this default for a table, read that table's anon policy.
    const PUBLISHABLE_TABLES = new Set([
      'elections',
      'constituency_groups',
      'constituencies',
      'organizations',
      'candidates',
      'factions',
      'alliances',
      'question_categories',
      'questions',
      'nominations'
    ]);

    const cleaned: Record<string, Array<unknown>> = {};
    for (const [collection, records] of Object.entries(data)) {
      // Convert collection name to snake_case table name
      const tableName = resolveCollectionName(collection);
      // Own-property lookup for the same reason as `resolveFieldName` above: `COLLECTION_NON_COLUMNS` is an `Object.fromEntries` result and `tableName` is template-controlled, so a bare index could hand back an inherited member and `extraStrip?.has(key)` would throw a TypeError instead of stripping.
      const extraStrip = Object.hasOwn(COLLECTION_NON_COLUMNS, tableName)
        ? COLLECTION_NON_COLUMNS[tableName]
        : undefined;
      const isPublishable = PUBLISHABLE_TABLES.has(tableName);
      cleaned[tableName] = (records as Array<Record<string, unknown>>).map((record) => {
        const stripped: Record<string, unknown> = {};
        // Nominations are polymorphic: only one entity FK allowed (candidate OR organization).
        // When a candidate nomination has an 'organization' field (the candidate's organization), strip it to avoid check constraint violation. But for organization nominations (no 'candidate' field), keep 'organization' as it's the nominated entity.
        const isNomination = tableName === 'nominations';
        const hasCandidateRef = isNomination && ('candidate' in record || 'candidateExternalId' in record);
        for (const [key, value] of Object.entries(record)) {
          if (key.startsWith('_') || NON_COLUMN_FIELDS.has(key) || extraStrip?.has(key)) continue;
          if (isNomination && key === 'organization' && hasCandidateRef) continue;
          // Convert camelCase property to snake_case column
          const snakeKey = resolveFieldName(key);
          // Convert nested relationship reference objects: {externalId: "..."} → {external_id: "..."}
          if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            'externalId' in (value as Record<string, unknown>)
          ) {
            stripped[snakeKey] = { external_id: (value as Record<string, unknown>).externalId };
          } else {
            stripped[snakeKey] = value;
          }
        }
        if (isPublishable && !('published' in stripped)) {
          stripped.published = true;
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
    collections: Record<string, { prefix?: string; ids?: Array<string>; external_ids?: Array<string> }>
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
   * After bulk_import creates questions, candidates, and organizations, this method resolves question external_ids to UUIDs, builds the `answers` JSONB, and updates each answer-bearing entity record. BOTH candidates AND organizations carry an `answers` JSONB column and may declare `answersByExternalId` (the org path backs `matching.organizationMatching=answersOnly`).
   *
   * @param data - The same dataset passed to bulkImport, containing candidates
   *   and/or organizations with `answersByExternalId` fields
   */
  async importAnswers(data: Record<string, Array<unknown>>): Promise<void> {
    // Both `candidates` AND `organizations` carry an `answers` JSONB column (apps/supabase/.../schema/105-answers.sql) and can declare `answersByExternalId` in a template. The org path matters for `matching.organizationMatching=answersOnly` where an organization is matched on its OWN answers. The two tables share the same (external_id, answers, project_id) shape, so we generalise over both.
    const answerSources: Array<{ table: 'candidates' | 'organizations'; rows: Array<Record<string, unknown>> }> = [];
    const candidates = data.candidates as Array<Record<string, unknown>> | undefined;
    if (candidates) answerSources.push({ table: 'candidates', rows: candidates });
    const organizations = data.organizations as Array<Record<string, unknown>> | undefined;
    if (organizations) answerSources.push({ table: 'organizations', rows: organizations });

    if (answerSources.length === 0) return;

    // Collect all question external_ids referenced across all answer-bearing rows
    const questionExtIds = new Set<string>();
    for (const { rows } of answerSources) {
      for (const row of rows) {
        const answersByExtId = readAnswersByExternalId(row);
        if (!answersByExtId) continue;
        for (const extId of Object.keys(answersByExtId)) {
          questionExtIds.add(extId);
        }
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

    // For each answer-bearing row (candidate or organization), build the UUID-keyed answers JSONB and update the matching entity row.
    for (const { table, rows } of answerSources) {
      for (const row of rows) {
        const answersByExtId = readAnswersByExternalId(row);
        if (!answersByExtId) continue;

        const entityExtId = (row.externalId ?? row.external_id) as string;
        if (!entityExtId) continue;

        // Build answers JSONB keyed by question UUID
        const answers: Record<string, unknown> = {};
        for (const [extId, answer] of Object.entries(answersByExtId)) {
          const uuid = extIdToUuid.get(extId);
          if (uuid) {
            answers[uuid] = answer;
          }
        }

        // Look up the entity id by external_id
        const { data: entityRow, error: eError } = await this.client
          .from(table)
          .select('id')
          .eq('external_id', entityExtId)
          .eq('project_id', this.projectId)
          .single();

        if (eError) {
          throw new Error(`importAnswers: failed to find ${table} row ${entityExtId}: ${eError.message}`);
        }

        // Update the entity's answers
        const { error: uError } = await this.client.from(table).update({ answers }).eq('id', entityRow.id);

        if (uError) {
          throw new Error(`importAnswers: failed to update ${table} row ${entityExtId} answers: ${uError.message}`);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Questions external_id → UUID lookup
  // ---------------------------------------------------------------------------

  /**
   * Build a Map<external_id, uuid> by SELECTing all questions in the bootstrap project. Used by Writer Pass-5's cardContents resolver (`resolveAppSettingsExternalIds`) to flatten {externalId} → UUID at seed time. Mirrors the importAnswers map-build at lines 243-270 in shape.
   *
   * Skips rows with NULL `external_id` (defensive — most seed-generated rows have one; legacy rows from bootstrap seed.sql may not).
   *
   * @throws Error wrapped with the underlying Supabase error message.
   */
  async selectQuestionExternalIds(): Promise<Map<string, string>> {
    const { data, error } = await this.client
      .from('questions')
      .select('id, external_id')
      .eq('project_id', this.projectId);
    if (error) {
      throw new Error(`selectQuestionExternalIds: failed to query questions: ${error.message}`);
    }
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      if (row.external_id) map.set(row.external_id, row.id);
    }
    return map;
  }

  // ---------------------------------------------------------------------------
  // M:N join table linking
  // ---------------------------------------------------------------------------

  /**
   * Populate M:N join tables and JSONB scoping columns after bulk_import.
   *
   * ⚠ **The resolution set is NOT declared here.** It is `LINK_SENTINELS` in `./template/linkSentinels`, and this method ITERATES it via that module's pure `planLinks`. The alternative is four hard-coded blocks kept beside the const; a pair could be permitted without being handled. Now the loop that permits a `(collection, key)` pair is the loop that resolves it, so adding a pair to the const cannot leave it unresolved — and the const cannot grow silently, because `tests/template/linkSentinels.test.ts` holds it to a hand-enumerated expectation.
   *
   * To add a link kind, edit `LINK_SENTINELS` — not this method. A new `LinkTarget.kind` is a COMPILE error here (the `never` arm below), never a silent runtime miss.
   *
   * ⚠ **That guarantee covers the collection as well as the target kind, and only because the switch below is on `entry.kind` — a top-level discriminant — so the collection and the target narrow together.**
   * Laundering `entry.collection` through `as` casts instead lets a rule such as `{ collections: ['organizations'], target: { kind: 'join', … } }` compile clean and then die as `TypeError: LINK_LOOKUP_ERRORS[table] is not a function`, MASKING the real lookup failure. The pairing itself is checked at the declaration: `LinkSentinelRule` is a union over the two target kinds.
   *
   * This method owns only the I/O: `external_id` → UUID lookups, the join-table upsert and the JSONB column update.
   *
   * @param data - The same dataset passed to bulkImport
   */
  async linkJoinTables(data: Record<string, Array<unknown>>): Promise<void> {
    for (const entry of planLinks(data as Record<string, Array<Record<string, unknown>>>)) {
      switch (entry.kind) {
        case 'join':
          await this.upsertJoinRows(entry, entry.target);
          break;
        case 'jsonb':
          await this.updateJsonbRefs(entry, entry.target);
          break;
        default: {
          // Exhaustiveness arm: a new `LinkTarget.kind` fails to compile here rather than being silently skipped at seed time. It covers the whole ENTRY, not just its target, so the collection is exhausted with it.
          const exhaustive: never = entry;
          throw new Error(`linkJoinTables: unhandled link target ${JSON.stringify(exhaustive)}`);
        }
      }
    }
  }

  /**
   * Resolve one `external_id` to its row UUID within this project.
   *
   * @param table - The table to look in; also selects the failure message.
   * @param externalId - The `external_id` to resolve.
   * @returns The row's UUID.
   * @throws Error if the lookup fails, with the greppable message verbatim.
   */
  private async resolveExternalId(
    table: 'elections' | 'constituency_groups' | 'constituencies',
    externalId: string
  ): Promise<string> {
    const { data: row, error } = await this.client
      .from(table)
      .select('id')
      .eq('external_id', externalId)
      .eq('project_id', this.projectId)
      .single();
    if (error) throw new Error(LINK_LOOKUP_ERRORS[table](externalId, error.message));
    return row.id;
  }

  /**
   * The `join` arm: idempotent upserts into a dedicated association table.
   *
   * @param entry - The planned link.
   * @param target - `entry.target`, narrowed to the join variant.
   */
  private async upsertJoinRows(
    entry: Extract<LinkPlanEntry, { kind: 'join' }>,
    target: Extract<LinkTarget, { kind: 'join' }>
  ): Promise<void> {
    // The parent lookup precedes the (possibly empty) reference loop, exactly as the hand-written blocks had it: an empty reference list is a no-op that still fails loudly on a missing parent.
    //
    // `entry.collection` needs no cast: the entry is narrowed to the `join` arm, whose collection type is `JoinParentCollection` — the exact domain of `LINK_LOOKUP_ERRORS`.
    const parentId = await this.resolveExternalId(entry.collection, entry.parentExternalId);
    for (const refExternalId of entry.refExternalIds) {
      const childId = await this.resolveExternalId(entry.refTable, refExternalId);
      const { error: insertError } = await this.client
        .from(target.table)
        .upsert({ [target.parentColumn]: parentId, [target.childColumn]: childId }, { onConflict: target.onConflict });
      if (insertError) {
        throw new Error(`linkJoinTables: failed to insert ${target.table}: ${insertError.message}`);
      }
    }
  }

  /**
   * The `jsonb` arm: overwrite a scoping column on the declaring row.
   *
   * `planLinks` never emits a jsonb entry with an empty id list, so this cannot clear a column that meant "all".
   *
   * @param entry - The planned link.
   * @param target - `entry.target`, narrowed to the jsonb variant.
   */
  private async updateJsonbRefs(
    entry: Extract<LinkPlanEntry, { kind: 'jsonb' }>,
    target: Extract<LinkTarget, { kind: 'jsonb' }>
  ): Promise<void> {
    const ids: Array<string> = [];
    for (const refExternalId of entry.refExternalIds) {
      ids.push(await this.resolveExternalId(entry.refTable, refExternalId));
    }
    // No cast: the entry is narrowed to the `jsonb` arm, whose collection type is `JsonbParentCollection` — the two tables that carry a scoping column.
    const { error: updateError } = await this.client
      .from(entry.collection)
      .update({ [target.column]: ids })
      .eq('external_id', entry.parentExternalId)
      .eq('project_id', this.projectId);
    if (updateError) {
      throw new Error(
        `linkJoinTables: failed to update ${entry.collection} ${entry.parentExternalId} ${target.column}: ${updateError.message}`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // App settings
  // ---------------------------------------------------------------------------

  /**
   * Deep-merge partial settings into the app_settings.settings JSONB column.
   *
   * Uses the merge_jsonb_column RPC for recursive deep merge. Callers only need to send the settings they want to change.
   *
   * Baseline test-setup no longer calls this method: it lives in the `@openvaa/dev-seed` e2e template's `app_settings.fixed[]` block, and in the per-variant filesystem templates at `tests/tests/setup/templates/variant-*.ts`. Do not reintroduce
   * `updateAppSettings({ ... })` blocks into `tests/tests/setup/*.setup.ts`.
   *
   * The method is RETAINED for two legitimate use cases:
   *   1. Per-test scenario mutations from `*.spec.ts` files (e.g.
   *      `candidate-settings.spec.ts`, `voter-popups.spec.ts`, `results-sections.spec.ts`) that need to flip specific keys to test behavior-under-different-settings.
   *   2. The dev-seed Writer Pass-5 itself (`packages/dev-seed/src/writer.ts:174-181`), which iterates `app_settings.fixed[]` rows from any template and calls this method per row.
   *
   * Do NOT call this method from a `*.setup.ts` file for baseline settings — extend the appropriate template instead.
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

  /**
   * REPLACE (full overwrite) the entire `app_settings.settings` JSONB column for this client's project with the given settings object.
   *
   * Unlike {@link updateAppSettings} (additive `merge_jsonb_column` deep-merge), this is a destructive full-set write: any key NOT present in `settings` is DROPPED from the persisted row. It is the authoritative-write primitive used to defeat the perm-* singleton-merge contamination class (see `tests/tests/setup/shared/setupFromTemplate.ts`): the local test DB has a SINGLE `app_settings` row that every perm setup mutates, and entity teardown deliberately excludes `app_settings` (resetting it is `db:reset`'s job), so additive merges accumulate foreign keys from prior perms. A REPLACE with a perm's OWN complete settings object wipes that accumulation deterministically.
   *
   * SAFE because every E2E/perm template emits a COMPLETE settings object in `app_settings.fixed[0].settings` (MINIMAL_BASE_APP_SETTINGS or a deep-merge of it), and the frontend fills any omitted keys from the TS/staticSettings defaults (the bootstrap DB row is seeded `'{}'::jsonb`). Do NOT use this for templates that intend a PARTIAL settings merge into the bootstrap row (e.g.
   * the `default` dev-seed template) — those must keep the additive {@link updateAppSettings} path.
   *
   * @param settings - Complete settings object to persist verbatim (full overwrite)
   * @throws Error if the app_settings row is not found or the update fails
   */
  async replaceAppSettings(settings: Record<string, unknown>): Promise<void> {
    const { data: row, error: fetchError } = await this.client
      .from('app_settings')
      .select('id')
      .eq('project_id', this.projectId)
      .single();

    if (fetchError) throw new Error(`replaceAppSettings: failed to fetch app_settings: ${fetchError.message}`);

    const { error } = await this.client.from('app_settings').update({ settings }).eq('id', row.id);

    if (error) throw new Error(`replaceAppSettings: update failed: ${error.message}`);
  }

  // ---------------------------------------------------------------------------
  // Portrait upload surface
  // ---------------------------------------------------------------------------

  /**
   * Select candidate rows for portrait upload.
   *
   * `bulk_import` returns aggregate counts, not inserted rows. Portrait upload needs the Postgres-assigned UUIDs + plain-text names for alt-text.
   *
   * Filters: `project_id = this.projectId AND external_id LIKE ${prefix}%`.
   * Only touches generator-produced rows — never bootstrap / user-curated candidates. Deterministic order: sorted by `external_id` ascending so the portrait cycling (portraits[i % 30]) is stable across runs at a fixed seed.
   */
  async selectCandidatesForPortraitUpload(
    externalIdPrefix: string
  ): Promise<Array<{ id: string; external_id: string; first_name: string; last_name: string }>> {
    const { data, error } = await this.client
      .from('candidates')
      .select('id, external_id, first_name, last_name')
      .eq('project_id', this.projectId)
      .like('external_id', `${externalIdPrefix}%`)
      .order('external_id', { ascending: true });
    if (error) throw new Error(`selectCandidatesForPortraitUpload failed: ${error.message}`);
    return (data ?? []) as Array<{ id: string; external_id: string; first_name: string; last_name: string }>;
  }

  /**
   * Upload a portrait JPEG to the `public-assets` bucket.
   *
   * Path: `${projectId}/candidates/${candidateId}/${filename}` — 3-segment RLS-compliant (VERIFIED at migration line 1934-1936).
   *
   * `upsert: true` makes re-runs idempotent.
   * `contentType: 'image/jpeg'` keeps Storage metadata correct.
   *
   * Upload failure is seed-blocking — throws with a candidate-scoped message the CLI surfaces + exits 1.
   *
   * @returns the storage path that was written (caller writes it into
   *          `candidates.image.path` via `updateCandidateImage`).
   */
  async uploadPortrait(candidateId: string, externalId: string, filename: string, bytes: Uint8Array): Promise<string> {
    const path = `${this.projectId}/candidates/${candidateId}/${filename}`;
    const { error } = await this.client.storage
      .from('public-assets')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) throw new Error(`Portrait upload failed for ${externalId}: ${error.message}`);
    return path;
  }

  /**
   * Write the `candidates.image` JSONB column for a single candidate.
   *
   * Column name is `image` (JSONB) — NOT `image_id`.
   * Shape is `{ path, alt }` matching the canonical StoredImage (VERIFIED: apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16).
   *
   * `alt` MUST be populated (WCAG 2.1 AA). Caller builds it as `"${first_name} ${last_name}".trim()`.
   *
   * Direct UPDATE — no merge semantics needed, since dev-seed authors the full shape.
   */
  async updateCandidateImage(
    candidateId: string,
    externalId: string,
    image: { path: string; alt: string }
  ): Promise<void> {
    const { error } = await this.client.from('candidates').update({ image }).eq('id', candidateId);
    if (error) throw new Error(`Image column update failed for ${externalId}: ${error.message}`);
  }

  // ---------------------------------------------------------------------------
  // Storage cleanup surface (teardown Path 2)
  // ---------------------------------------------------------------------------

  /**
   * List all candidate-portrait file paths under `${projectId}/candidates/` in the `public-assets` bucket — used by `seed:teardown` Path 2 explicit cleanup.
   *
   * Storage layout, as written by `uploadPortrait`:
   *   `${projectId}/candidates/${candidateId}/${filename}`
   *
   * Enumeration is 2-level: first list candidate-UUID directories, then list files under each. Returns a flat array of fully-qualified paths ready to hand to `.storage.from(...).remove(paths)`.
   *
   * ⚠ The AFTER-DELETE `pg_net` trigger may or may not have reclaimed these files by the time the teardown CLI gets here.
   * Either way, the explicit list+remove is deterministic — this is the PRIMARY path; the trigger is a nice-to-have async fallback.
   *
   * Missing bucket / missing path is treated as empty (initial state after `db:reset` with no seed data yet) — only non-"not found" list errors throw.
   */
  async listCandidatePortraitPaths(candidateIds?: Array<string>): Promise<Array<string>> {
    const rootPath = `${this.projectId}/candidates`;

    // When a UUID list is supplied, scope the enumeration to those folders only. The storage layout is `${projectId}/candidates/${uuid}/...`, so we skip the top-level list() entirely — its only purpose is to find UUID folders, and the caller already told us which ones matter.
    let dirs: Array<{ name?: string }>;
    if (candidateIds) {
      if (candidateIds.length === 0) return [];
      dirs = candidateIds.map((id) => ({ name: id }));
    } else {
      const { data, error: dirError } = await this.client.storage.from('public-assets').list(rootPath, { limit: 1000 });
      if (dirError) {
        const msg = (dirError as { message?: string }).message ?? String(dirError);
        // Bucket missing or path absent — treat as empty (initial state).
        if (/not found|does not exist/i.test(msg)) return [];
        throw new Error(`listCandidatePortraitPaths: list dirs failed: ${msg}`);
      }
      if (!data || data.length === 0) return [];
      dirs = data as Array<{ name?: string }>;
    }

    const paths: Array<string> = [];
    for (const dir of dirs) {
      if (!dir.name || dir.name === '.emptyFolderPlaceholder') continue;
      const subpath = `${rootPath}/${dir.name}`;
      const { data: files, error: fileError } = await this.client.storage
        .from('public-assets')
        .list(subpath, { limit: 100 });
      if (fileError) {
        const msg = (fileError as { message?: string }).message ?? String(fileError);
        throw new Error(`listCandidatePortraitPaths: list files failed at ${subpath}: ${msg}`);
      }
      for (const f of (files ?? []) as Array<{ name?: string }>) {
        if (f.name && f.name !== '.emptyFolderPlaceholder') {
          paths.push(`${subpath}/${f.name}`);
        }
      }
    }
    return paths;
  }

  /**
   * Return candidate UUIDs whose `external_id` matches the given prefix.
   *
   * Used by `runTeardown` to scope storage cleanup to exactly the candidates being deleted. Must be called BEFORE `bulkDelete` — once the DB rows are gone, this query returns an empty list.
   */
  async listCandidateIdsByPrefix(prefix: string): Promise<Array<string>> {
    const { data, error } = await this.client.from('candidates').select('id').like('external_id', `${prefix}%`);
    if (error) {
      throw new Error(`listCandidateIdsByPrefix failed: ${error.message}`);
    }
    return (data ?? []).map((row) => (row as { id: string }).id);
  }

  /**
   * Remove storage objects in bulk from the `public-assets` bucket.
   *
   * Returns the count of successfully removed objects (Supabase Storage `.remove(paths)` returns `{ data: FileObject[] }` on success; we count the entries of `data`).
   *
   * No-ops for an empty path list (avoids an unnecessary HTTP round-trip).
   *
   * Teardown uses this to reclaim portrait files that the AFTER-DELETE trigger didn't clean up (`pg_net` async race; Path 2 is authoritative).
   */
  async removePortraitStorageObjects(paths: Array<string>): Promise<number> {
    if (paths.length === 0) return 0;
    const { data, error } = await this.client.storage.from('public-assets').remove(paths);
    if (error) {
      const msg = (error as { message?: string }).message ?? String(error);
      throw new Error(`removePortraitStorageObjects failed: ${msg}`);
    }
    return (data ?? []).length;
  }
}
