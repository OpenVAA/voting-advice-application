/**
 * AccountsGenerator — PASS-THROUGH per D-11.
 *
 * `accounts` is bootstrapped by `apps/supabase/supabase/seed.sql`:
 *
 *   INSERT INTO accounts (id, name)
 *   VALUES ('00000000-0000-0000-0000-000000000001', 'Default Account');
 *
 * Dev-seed does NOT write to `accounts`. The bootstrap row is pre-populated in
 * `ctx.refs.accounts` by `buildCtx` in `packages/dev-seed/src/ctx.ts`, and
 * downstream consumers (e.g. the writer, the ProjectsGenerator pass-through)
 * reference it via `ctx.refs.accounts[0].id`.
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
 * If a user supplies `accounts: { count: N }` or `accounts: { fixed: [...] }`
 * in a template, this generator emits a `ctx.logger` warning but still returns
 * `[]`. Writing to `accounts` is out of scope for every phase in milestone
 * v2.5 — Supabase Auth owns account creation in production deployments.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type AccountsFragment = Fragment<TablesInsert<'accounts'>>;

export class AccountsGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; kept on the signature for consistency with the
  // rest of the generator classes + the D-08 contract.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): AccountsFragment {
    return { count: 0 };
  }

  generate(fragment: AccountsFragment): Array<TablesInsert<'accounts'>> {
    if ((fragment.count ?? 0) > 0 || (fragment.fixed?.length ?? 0) > 0) {
      const bootstrapId = this.ctx.refs.accounts[0]?.id ?? 'none';
      this.ctx.logger(
        '[dev-seed] AccountsGenerator: accounts are bootstrap-only per D-11. ' +
          'Requested rows ignored — the bootstrap account is pre-populated via seed.sql. ' +
          `Reference it via ctx.refs.accounts[0].id (bootstrap UUID: ${bootstrapId}).`
      );
    }
    return [];
  }
}
