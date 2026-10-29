/**
 * perm-not-located-2e2cg minimal-data template.
 *
 * Dataset for the voter-not-located-redirect spec (perm-not-located-2e2cg.spec.ts), built by the `buildNotLocated2e2cgTemplate` factory — see that file's docblock for the topology and why a factory rather than hand-maintained copies.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-notloc-'`. Row external_ids bare; refs prefixed. No other teardown project may share or overlap this prefix.
 */

import { buildNotLocated2e2cgTemplate } from './notLocated2e2cgShape';
import type { Template } from '../../../template/types';

export const permNotLocated2e2cgTemplate: Template = buildNotLocated2e2cgTemplate('e2e-perm-notloc-');

export default permNotLocated2e2cgTemplate;
