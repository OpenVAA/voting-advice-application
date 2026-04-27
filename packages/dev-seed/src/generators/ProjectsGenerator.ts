/**
 * ProjectsGenerator — PASS-THROUGH per D-11.
 *
 * `projects` is bootstrapped by `apps/supabase/supabase/seed.sql`:
 *
 *   INSERT INTO projects (id, account_id, name)
 *   VALUES (
 *     '00000000-0000-0000-0000-000000000001',
 *     '00000000-0000-0000-0000-000000000001',
 *     'Default Project'
 *   );
 *
 * Dev-seed does NOT write to `projects`. The bootstrap row is pre-populated in
 * `ctx.refs.projects` by `buildCtx` in `packages/dev-seed/src/ctx.ts`, and
 * every content generator's `project_id` field defaults to `ctx.projectId`
 * (which is itself the bootstrap project UUID).
 *
 * This class exists to:
 *   1. Satisfy GEN-01 "one generator per non-system public table" — all 16
 *      non-system public tables have a generator class entry in Plan 07's
 *      TOPO_ORDER map, even the two that are bootstrap-only.
 *   2. Make the zero-write behavior explicit in code rather than by omission.
 *   3. Give the pipeline a uniform `new Gen(ctx).generate(fragment)` call shape
 *      — the pipeline's generator class map does not need a special branch
 *      for accounts/projects.
 *
 * See AccountsGenerator for the full rationale — same story here.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type ProjectsFragment = Fragment<TablesInsert<'projects'>>;

export class ProjectsGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; kept on the signature for consistency with the
  // rest of the generator classes + the D-08 contract.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): ProjectsFragment {
    return { count: 0 };
  }

  generate(fragment: ProjectsFragment): Array<TablesInsert<'projects'>> {
    if ((fragment.count ?? 0) > 0 || (fragment.fixed?.length ?? 0) > 0) {
      this.ctx.logger(
        '[dev-seed] ProjectsGenerator: projects are bootstrap-only per D-11. ' +
          'Requested rows ignored — the bootstrap project is pre-populated via seed.sql. ' +
          `Reference it via ctx.projectId (bootstrap UUID: ${this.ctx.projectId}).`
      );
    }
    return [];
  }
}
