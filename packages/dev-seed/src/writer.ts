/**
 * @openvaa/dev-seed Writer — orchestrates the write sequence.
 *
 * `Writer` composes `SupabaseAdminClient` (does NOT subclass) and routes pipeline output through the correct admin-client methods:
 *
 *   - `accounts` / `projects` — stripped from payload (bootstrap-only; dev-seed never writes those tables).
 *   - `feedback` — SKIPPED with a `ctx.logger` warning. Writer uses ONLY the public `SupabaseAdminClient` methods, and no `feedback` helper exists on the admin client. Feedback has no `external_id`, so it is not teardown-friendly either way; a narrow `insertFeedback` helper could be added if demand surfaces.
 *   - `app_settings` — routed through `updateAppSettings` (merge_jsonb_column RPC). Direct `bulk_import` of `app_settings` fails with duplicate-key on the `UNIQUE(project_id)` constraint because `seed.sql` pre-inserts a row.
 *   - 10 other tables (elections, constituency_groups, constituencies, organizations, alliances, factions, question_categories, questions,
 *     candidates, nominations) — flow through `bulkImport` → `importAnswers`
 *     → `linkJoinTables`, the three-pass sequence.
 *
 * Env enforcement: the constructor reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `process.env` and THROWS with a descriptive error if either is missing. Env enforcement is intentionally at construction (not at module import) so pure generators remain env-free — `yarn test:unit` can exercise them without an env fixture. Callers that need the write path (the CLI, and the tests/ subclass integration tests) see a loud, actionable error before any admin client is created.
 *
 * Rollback semantics:
 *   - `bulk_import` runs as a SINGLE PL/pgSQL transaction (SECURITY INVOKER; migration line 2738). A mid-collection FK / constraint violation aborts the RPC and nothing commits — the 10 bulk-import tables roll back atomically.
 *   - `importAnswers` and `linkJoinTables` run in SEPARATE transactions. A failure there leaves `bulk_import` rows committed. That is acceptable because generators pre-validate refs in memory, so most orphan-FK cases are caught client-side before the RPC fires.
 *   - `updateAppSettings` runs one `merge_jsonb_column` RPC per row; each is its own transaction.
 *
 * Writer is pure I/O. No generation / randomness / template merging happens here — that is the pipeline's concern.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertKnownRowProps } from './assertKnownRowProps';
import { resolveAppSettingsExternalIds, settingsContainsExternalIdRefs } from './resolveAppSettingsExternalIds';
import { SupabaseAdminClient } from './supabaseAdminClient';

/**
 * Absolute path to the committed portrait assets directory.
 *
 * Resolved once at module load time from `import.meta.url` so the path is stable whether the package is invoked via `yarn db:seed` (root) or `yarn workspace @openvaa/dev-seed seed` (workspace). Thirty `portrait-NN.jpg` files are committed at this location.
 */
const PORTRAITS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'assets', 'portraits');

/**
 * Options passed to the `Writer` constructor.
 *
 *  - `projectId` — defaults to `TEST_PROJECT_ID` (`00000000-0000-0000-0000-000000000001`, the bootstrap project UUID from seed.sql).
 *  - `logger` — sink for writer warnings (currently the feedback-skip notice). Defaults to a no-op so production usage doesn't need to wire one.
 */
export interface WriterOptions {
  projectId?: string;
  logger?: (msg: string) => void;
}

export class Writer {
  private client: SupabaseAdminClient;
  private logger: (msg: string) => void;

  /**
   * Construct a Writer.
   *
   * THROWS if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing from `process.env`. Env enforcement at construction means the pure generators stay env-free.
   *
   * @throws Error when either required env var is missing. Error messages
   *         name the env var and point to `supabase start` / `supabase status`.
   */
  constructor(opts: WriterOptions = {}) {
    // Fail loudly before any admin client is constructed.
    if (!process.env.SUPABASE_URL) {
      throw new Error(
        'SUPABASE_URL env var is required but not set. ' +
          'Did you forget to run `supabase start`? ' +
          'Expected format: http://127.0.0.1:54321'
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY env var is required but not set. ' +
          'Run `supabase status` to obtain the local service_role key.'
      );
    }
    this.client = new SupabaseAdminClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      opts.projectId
    );
    this.logger = opts.logger ?? (() => {});
  }

  /**
   * Execute the full write path for a pipeline's output.
   *
   * Accepts the raw output of `runPipeline` (`Record<string, Array<Record<string, unknown>>>`).
   *
   * Sequence:
   *   1. Strip routing-exempt tables (`accounts`, `projects`) from the bulk payload.
   *   2. Remove `feedback` and `app_settings` — handled separately.
   *   2b. **Pass 0** — `assertKnownRowProps`, called on the pre-deletion `data` Throws on the first row property the pipeline does not read, or that the RPC's `skip_columns` would discard, naming the key, the collection and the row's `external_id`. Runs on the PRE-DELETION `data`, so `app_settings`, `feedback`, `accounts` and `projects` are guarded rather than silently exempt — see the call site.
   *   3. `bulkImport` — single transaction write of 10 tables (rollback is atomic; `bulk_import` runs inside a single transaction, so any collection-level failure rolls back the entire batch).
   *      `bulk_import`'s internal `processing_order` resolves ref sentinels between collections.
   *   4. `importAnswers` — stitches `candidate.answersByExternalId` → `candidate.answers` JSONB by resolving question external_ids to UUIDs (separate transaction).
   *   5. `linkJoinTables` — processes `_constituencyGroups` / `_constituencies` / `_elections` sentinels; populates `election_constituency_groups` and `constituency_group_constituencies` join tables; updates `question_categories.election_ids` JSONB (separate transaction).
   *   6. `updateAppSettings` per row (`merge_jsonb_column` RPC) — routes around the `UNIQUE(project_id)` conflict that `bulk_import` cannot handle for this table.
   *   7. `feedback` rows are SKIPPED with a logger warning.
   */
  async write(
    data: Record<string, Array<Record<string, unknown>>>,
    externalIdPrefix = 'seed_'
  ): Promise<{ portraits: number }> {
    const bulkData: Record<string, Array<Record<string, unknown>>> = { ...data };

    // strip pass-through tables. `accounts` / `projects` are bootstrapped by seed.sql; dev-seed never writes them.
    delete bulkData.accounts;
    delete bulkData.projects;

    // Hold feedback aside — deliberately out of the write path.
    const feedbackRows = bulkData.feedback;
    delete bulkData.feedback;

    // Hold app_settings aside — routed through updateAppSettings.
    const appSettingsRows = bulkData.app_settings;
    delete bulkData.app_settings;

    // Pass 0: unknown-property guard.
    //
    // ⚠ Deliberately reads `data`, the PRE-DELETION map, not `bulkData`. The four `delete bulkData.*` statements above have already removed `accounts`, `projects`, `feedback` and `app_settings`, so a guard reading `bulkData` here cannot see any of them. `app_settings` is the one that matters: it is a first-class, template-authorable fragment and EVERY built-in template emits exactly one row of it (30 of 30, measured), so reading `bulkData` would leave the guard blind to a collection every single template uses. Guarding `data` covers all twelve template-declarable collections and picks up `accounts` / `projects` for free.
    //
    // Placement is unchanged — immediately above Pass 1 — so nothing reaches `bulkImport`'s two silent-strip rules unrecognised.
    assertKnownRowProps(data);

    // Pass 1: bulk_import (10 tables, one PL/pgSQL transaction).
    await this.client.bulkImport(bulkData);

    // Pass 2: candidate answers — stitches answersByExternalId → answers JSONB.
    await this.client.importAnswers(bulkData);

    // Pass 3: join tables + question_category → election refs.
    await this.client.linkJoinTables(bulkData);

    // Pass 4: portrait upload.
    // Runs AFTER linkJoinTables (candidates have UUIDs assigned by bulk_import) and BEFORE updateAppSettings. Skips silently if no candidates present; throws on upload/update errors to keep the run atomic.
    const portraits = await this.uploadPortraits(externalIdPrefix);

    // Pass 5: app_settings via merge_jsonb_column.
    // Resolve {externalId: '<id>'} → UUID inside cardContents BEFORE the merge.
    // The questions-table SELECT is gated on a cheap pre-walk, so payloads without externalId references pay zero overhead.
    if (appSettingsRows && appSettingsRows.length > 0) {
      const needsResolution = appSettingsRows.some((row) => settingsContainsExternalIdRefs(row.settings));
      const externalIdToUuid = needsResolution
        ? await this.client.selectQuestionExternalIds()
        : new Map<string, string>();
      for (const row of appSettingsRows) {
        const settings = row.settings;
        if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
          const resolved = resolveAppSettingsExternalIds(settings as Record<string, unknown>, externalIdToUuid);
          await this.client.updateAppSettings(resolved);
        }
      }
    }

    // Pass 6: feedback — SKIPPED; see the class docblock for why.
    if (feedbackRows && feedbackRows.length > 0) {
      this.logger(
        `[dev-seed] Writer: feedback writes skipped (${feedbackRows.length} rows ignored). ` +
          'Feedback has no external_id column and is not teardown-friendly; direct upsert support may be added later.'
      );
    }

    return { portraits };
  }

  /**
   * Upload candidate portraits to Supabase Storage + populate the `candidates.image` JSONB column.
   *
   * Sequence:
   *   1. List portrait files from the committed assets dir, sorted, because `fs.readdirSync` order is platform-specific. Throws if the dir is missing or empty.
   *   2. Select generator-produced candidates by external_id prefix — `bulk_import` does not return UUIDs inline.
   *   3. If no candidates, skip silently (templates with count=0 are valid).
   *   4. For each candidate, upload `portraits[i % portraits.length]` to `${projectId}/candidates/${id}/seed-portrait.jpg` and write the image JSONB.
   *
   * Failure modes:
   *   - Missing assets dir → throws `Error('No portrait assets found at ...')`.
   *   - Upload error → rethrown with candidate-scoped message (seed-blocking).
   *   - Update error → rethrown similarly.
   *
   * Determinism:
   *   - Candidates sorted by `external_id` ascending (SQL `ORDER BY`) so cycling is stable across runs.
   *   - Portrait filenames sorted alphabetically (`fs.readdirSync` order is platform-specific).
   *   - Cycling is simple `i % N` — reproducible.
   *
   * Runs AFTER `linkJoinTables` (candidates have UUIDs assigned by `bulk_import`) and BEFORE `updateAppSettings`.
   *
   * @returns number of portraits uploaded (consumed by the CLI summary).
   */
  private async uploadPortraits(externalIdPrefix: string): Promise<number> {
    // 1. Enumerate portrait files (sorted for determinism).
    let portraitFiles: Array<string>;
    try {
      portraitFiles = readdirSync(PORTRAITS_DIR)
        .filter((f) => /^portrait-\d{2}\.jpg$/.test(f))
        .sort();
    } catch (err) {
      throw new Error(
        `Failed to read portrait assets at ${PORTRAITS_DIR}: ${(err as Error).message}. ` +
          'Run `yarn workspace @openvaa/dev-seed tsx scripts/download-portraits.ts` to populate the pool.'
      );
    }
    if (portraitFiles.length === 0) {
      throw new Error(
        `No portrait assets found at ${PORTRAITS_DIR}. ` +
          'Run `yarn workspace @openvaa/dev-seed tsx scripts/download-portraits.ts` to populate the pool.'
      );
    }

    // 2. Select candidates — bulk_import does not return UUIDs.
    const candidates = await this.client.selectCandidatesForPortraitUpload(externalIdPrefix);

    // 3. Skip silently if no candidates (valid for count=0 templates).
    if (candidates.length === 0) {
      return 0;
    }

    // 4. Upload each portrait + write image JSONB (sequential — keeps order
    //    deterministic + error messages candidate-scoped; Promise.all would interleave logs and reshuffle cycling).
    let uploaded = 0;
    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i];
      const portraitFile = portraitFiles[i % portraitFiles.length];
      const bytes = readFileSync(join(PORTRAITS_DIR, portraitFile));
      const path = await this.client.uploadPortrait(cand.id, cand.external_id, 'seed-portrait.jpg', bytes);
      // WCAG 2.1 AA: alt MUST be populated. Fall back to external_id when both names are empty so the field is never blank.
      const nameAlt = `${cand.first_name ?? ''} ${cand.last_name ?? ''}`.trim();
      const alt = nameAlt.length > 0 ? nameAlt : cand.external_id;
      await this.client.updateCandidateImage(cand.id, cand.external_id, { path, alt });
      uploaded++;
    }
    return uploaded;
  }
}
