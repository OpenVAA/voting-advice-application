/**
 * perm-bankauth-notloc minimal-data template (Phase 140, CR-01 remediation).
 *
 * A DEDICATED instance of the shared "not-located 2e2cg" shape (Phase 140
 * review IN-04 — see `notLocated2e2cgShape.ts`'s docblock for the topology
 * and why a factory closes the shape over its `prefix` parameter rather than
 * two hand-maintained copies), reserved for the `bank-auth-journey`
 * data-setup/data-teardown pair so it owns a namespace that is provably
 * disjoint from the shared `e2e-perm-notloc-` prefix.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-bankauth-notloc-'` — disjoint by
 * construction from `e2e-perm-notloc-` (the perm-family prefix) AND from
 * `test-` (the base-journey prefix), so `bank-auth-journey.setup.ts` no
 * longer needs to pre-clear either namespace via `extraTeardownPrefix`. See
 * `base.setup.ts` for the OTHER half of this namespace's coverage (Phase 140
 * CR-01, iteration-2 regression fix): base sweeps this prefix so an aborted
 * run's leaked dataset does not silently wedge the default suite.
 */

import { buildNotLocated2e2cgTemplate } from './notLocated2e2cgShape';
import type { Template } from '../../../template/types';

export const permBankauthNotLocatedTemplate: Template = buildNotLocated2e2cgTemplate('e2e-bankauth-notloc-');

export default permBankauthNotLocatedTemplate;
