/**
 * Barrel re-export for the `tests/tests/helpers/` layer.
 *
 * helpers/ vs utils/ boundary (per 86.2-RESEARCH.md §"Open Questions (RESOLVED)" Q5):
 *
 *   - `tests/tests/helpers/` (this directory) — thin generic Playwright
 *     wrappers with NO domain knowledge. Operate on raw Playwright types
 *     (`Page`, `Locator`) and the generic `SupabaseAdminClient`. Naming
 *     convention: `<concern>.helper.ts`. Examples: settle, navigation,
 *     select, db-precondition, voter-iteration.
 *
 *   - `tests/tests/utils/` — domain-specific assemblers + catalogs.
 *     Examples: `voterNavigation.ts` (the full voter journey),
 *     `supabaseAdminClient.ts` (auth + email + bulk-write surfaces),
 *     `testIds.ts` (the project-wide testId catalog), `buildRoute.ts`
 *     (typed route builder).
 *
 * When in doubt, prefer `utils/`. Helpers earn their slot when ≥2 inline
 * sites share the same Playwright-API shape AND the shape is generic
 * enough to operate without domain knowledge.
 *
 * See `tests/tests/helpers/README.md` for the full design rationale.
 */

export { assertDbRowCount } from './db-precondition.helper';
export { clickAndRaceSettle, expectLandedOn } from './navigation.helper';
export { iterateSelectOptions } from './select.helper';
export { gotoAndSettle, settleNetworkIdle } from './settle.helper';
export { walkVoterIteration } from './voter-iteration.helper';
