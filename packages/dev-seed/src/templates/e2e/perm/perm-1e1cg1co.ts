/**
 * perm-1e1cg1co minimal-data template.
 *
 * Topology: 1 election → 1 constituency group → 1 constituency. No election
 * or constituency selector should be shown (1E/1CG/1CO is auto-implied).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-1e1cg1co-'` is unique. Row
 * external_ids in fixed[] are bare (writer prepends prefix); nested refs use
 * full prefixed external_ids (writer passes refs verbatim). Each chain tears
 * down its own prefix via setupFromTemplate's derived
 * `teardownPrefix = template.externalIdPrefix`.
 *
 * Settings: MINIMAL_BASE_APP_SETTINGS verbatim (helper default).
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-1e1cg1co-';

export const perm1e1cg1coTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 2,
  opinionQuestions: 1,
  infoQuestions: 0
});

export default perm1e1cg1coTemplate;
