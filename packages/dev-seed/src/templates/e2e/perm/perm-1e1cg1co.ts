/**
 * perm-1e1cg1co minimal-data template — Phase 88 Plan 03; ported to
 * `buildMinimal` helper in Phase 91 Plan 91-01 Task 2.
 *
 * Topology: 1 election → 1 constituency group → 1 constituency. No election
 * or constituency selector should be shown (1E/1CG/1CO is auto-implied).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:139-144
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-1e1cg1co-'` — UNIQUE per
 * 88-03-SCOPE.md:104-110. Row external_ids in fixed[] are BARE (writer
 * prepends prefix); nested refs use FULL prefixed external_ids (writer
 * passes refs verbatim). Each chain teardowns ITS OWN prefix via
 * setupFromTemplate's derived `teardownPrefix = template.externalIdPrefix`.
 *
 * Settings: MINIMAL_BASE_APP_SETTINGS verbatim (helper default).
 *
 * Port discipline (Phase 91 D-91-PD-03): assertions preserved byte-for-byte.
 * Existing spec at tests/tests/specs/perm/perm-1e1cg1co.spec.ts asserts only
 * voter elections/constituencies list visibility — does NOT depend on
 * candidate/question external_ids.
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
