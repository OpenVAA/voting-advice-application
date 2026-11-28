import type { Ctx, Fragment } from '../types';

/**
 * The rows a template's own `fixed[]` entries contribute to a table: each entry as written, its `external_id` prefixed with `ctx.externalIdPrefix` and its `project_id` defaulted to `ctx.projectId`.
 *
 * @param fixed - The fragment's `fixed[]` entries.
 * @param ctx - The run's prefix and project.
 * @returns One row per entry, in order.
 */
export function passThroughFixed<TRow>(
  fixed: Fragment<TRow>['fixed'],
  ctx: Pick<Ctx, 'externalIdPrefix' | 'projectId'>
): Array<TRow> {
  return (fixed ?? []).map(
    (fx) =>
      ({
        ...fx,
        external_id: `${ctx.externalIdPrefix}${fx.external_id}`,
        project_id: (fx as { project_id?: string | null }).project_id ?? ctx.projectId
      }) as TRow
  );
}
