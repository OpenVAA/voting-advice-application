/**
 * AppSettingsGenerator — content generator for the `app_settings` table.
 *
 * Routing note (RESEARCH §4.15 Pitfall 5): the writer (Plan 07) MUST route
 * emitted rows through `updateAppSettings` (direct JSONB merge via the
 * merge_jsonb_column RPC), NOT through `bulk_import`.
 *
 * Why: `apps/supabase/supabase/seed.sql` bootstraps an `app_settings` row with
 *   external_id = NULL for the default project. bulk_import's upsert matches on
 *   `ON CONFLICT (project_id, external_id) WHERE external_id IS NOT NULL` — a
 *   second insert with `external_id = 'seed_appsettings'` falls through to the
 *   `UNIQUE(project_id)` constraint (migration line 916) and fails with
 *   "duplicate key value violates unique constraint".
 *
 * Writer routing sequence (Plan 07):
 *   1. Pipeline emits rows from this generator
 *   2. Writer strips them from the bulk_import payload (app_settings excluded
 *      from TOPO_ORDER's bulk-write set)
 *   3. Writer iterates rows and calls `this.client.updateAppSettings(row.settings)`
 *      for each — merge_jsonb_column deep-merges into the bootstrap row
 *      (idempotent on the keys supplied)
 *
 * Phase 56 count semantics: `app_settings` is UNIQUE on `project_id`, so a
 * single project has AT MOST ONE row. The generator clamps `count > 1` to 1
 * and warns via `ctx.logger` — users who genuinely need multiple per-project
 * settings blobs should supply them via `fixed[]` entries tied to distinct
 * project_ids (a Phase 58 multi-project template concern).
 *
 * D-04/D-26/D-08 + GEN-02/GEN-04 apply — see ElectionsGenerator.ts for the
 * canonical-pattern rationale.
 *
 * Default count = 0: the seed.sql bootstrap row is already usable out of the
 * box. Generating a second row adds no value unless the user wants to stamp
 * dev-specific settings keys — which templates express explicitly via
 * `count: 1` or `fixed: [{ settings: {...} }]`.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type AppSettingsFragment = Fragment<TablesInsert<'app_settings'>>;

export class AppSettingsGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; kept on the signature for D-08 consistency.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): AppSettingsFragment {
    return { count: 0 };
  }

  generate(fragment: AppSettingsFragment): Array<TablesInsert<'app_settings'>> {
    const { projectId, externalIdPrefix } = this.ctx;
    const rows: Array<TablesInsert<'app_settings'>> = [];

    // fixed[] pass-through — typically at most one hand-authored row per project.
    // external_id prefixed for idempotent teardown (Phase 58 CLI-03 filters by
    // prefix); project_id defaulted. Per-project UNIQUE means users supplying
    // multiple fixed entries MUST target distinct project_ids — otherwise the
    // writer's updateAppSettings sequence merges them all into the same row
    // (last-write-wins semantics at the JSONB merge layer).
    for (const fx of fragment.fixed ?? []) {
      rows.push({
        ...fx,
        external_id: `${externalIdPrefix}${fx.external_id}`,
        project_id: fx.project_id ?? projectId
      });
    }

    // Synthetic row: emit exactly one if count >= 1 (per-project UNIQUE).
    const n = Math.min(fragment.count ?? 0, 1);
    if ((fragment.count ?? 0) > 1) {
      this.ctx.logger(
        '[dev-seed] AppSettingsGenerator: app_settings is UNIQUE on project_id. ' +
          `Requested ${fragment.count} rows clamped to 1. Use one fixed[] entry per distinct project if needed.`
      );
    }
    if (n === 1 && (fragment.fixed?.length ?? 0) === 0) {
      rows.push({
        external_id: `${externalIdPrefix}appsettings`,
        project_id: projectId,
        settings: {},
        customization: {}
      });
    }

    return rows;
  }
}
