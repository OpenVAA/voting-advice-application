/**
 * perm-bankauth-notloc minimal-data template.
 *
 * A DEDICATED instance of the shared "not-located 2e2cg" shape — see `notLocated2e2cgShape.ts`'s docblock for the topology and why a factory closes the shape over its `prefix` parameter rather than two hand-maintained copies — reserved for the `bank-auth-journey` data-setup/data-teardown pair so it owns a namespace that is provably disjoint from the shared `e2e-perm-notloc-` prefix.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-bankauth-notloc-'` — disjoint by construction from `e2e-perm-notloc-` (the perm-family prefix) AND from `test-` (the base-journey prefix), so `bank-auth-journey.setup.ts` no longer needs to pre-clear either namespace via `extraTeardownPrefix`. See `base.setup.ts` for the OTHER half of this namespace's coverage: base sweeps this prefix so an aborted run's leaked dataset does not silently wedge the default suite.
 */

import { buildNotLocated2e2cgTemplate } from './notLocated2e2cgShape';
import type { Template } from '../../../template/types';

// Label discipline: the `BA-` token gives this dataset its own DISPLAY-label namespace, matching the discipline already applied to its `external_id` prefix. `[EL1]`/`[CO1A]`/… are a perm-family shape convention emitted by twelve templates, so once this setup moved to the chain tail — where perm datasets are still live — a bare `[EL1]` locator resolved to 2 elements and the journey's identity assertion (correctly) failed. With the token its labels are `[BA-EL1]`, `[BA-CO1A]`, … which no other template emits.
export const permBankauthNotLocatedTemplate: Template = buildNotLocated2e2cgTemplate('e2e-bankauth-notloc-', 'BA-');

export default permBankauthNotLocatedTemplate;
