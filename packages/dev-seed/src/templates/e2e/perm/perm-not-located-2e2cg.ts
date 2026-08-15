/**
 * perm-not-located-2e2cg minimal-data template.
 *
 * Dataset for the voter-not-located-redirect spec
 * (perm-not-located-2e2cg.spec.ts). Shape shared with `perm-bankauth-notloc`
 * via the `buildNotLocated2e2cgTemplate` factory (Phase 140 review IN-04) —
 * see that file's docblock for the topology and why a factory rather than
 * two hand-maintained copies.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-notloc-'`. Row
 * external_ids bare; refs prefixed. Disjoint by construction from
 * `perm-bankauth-notloc`'s `'e2e-bankauth-notloc-'` (Phase 140 CR-01 — the
 * two teardown projects must never share/overlap a prefix).
 */

import { buildNotLocated2e2cgTemplate } from './notLocated2e2cgShape';
import type { Template } from '../../../template/types';

export const permNotLocated2e2cgTemplate: Template = buildNotLocated2e2cgTemplate('e2e-perm-notloc-');

export default permNotLocated2e2cgTemplate;
