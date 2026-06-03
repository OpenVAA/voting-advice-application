/**
 * perm-missing-nominations minimal-data template — Phase 90 Plan 02; ported
 * to `buildMinimal` helper in Phase 91 Plan 91-01 Task 2.
 *
 * Topology: 2 elections sharing 1 CG with 1 CO. 1 organisation, 1 candidate.
 * 1 nomination in el-1 only — el-2 has ZERO nominations. The voter selects
 * both elections and the missing-nominations modal surfaces the 'some'
 * variant with a per-election check/close icon list (el-2 = close).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-5.md:15-26.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-missnoms-'` per D-90-01
 * (distinct from the other 89-04 + 90 perm templates).
 *
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS verbatim — this perm does NOT
 * require 90-01's Stage A runtime supportedLocales override (locale-count
 * irrelevant to the missing-nominations modal surface).
 *
 * Helper config:
 *   - `elections: 2` produces el-1 + el-2 both linked to the single CG.
 *   - `nominationsInElectionIndices: [0]` writes nominations ONLY for el-1
 *     (the helper's nomination-emission loop iterates these indices); el-2
 *     ends up with ZERO nominations — exactly the "some" missing-nominations
 *     trigger the spec asserts on.
 *   - `organizations: 1` truncates to a single party (matches the existing
 *     1-org topology).
 *   - `candidates: 1` → single candidate; spec asserts on `[EL1]` and `[EL2]`
 *     election-name markers in the modal, not on candidate external_ids.
 *
 * Port discipline (Phase 91 D-91-PD-03): assertions preserved byte-for-byte.
 * Spec asserts on `[EL1]` / `[EL2]` substrings + "not available" copy in the
 * missing-nominations modal — does NOT depend on candidate/question
 * external_ids. Helper-generated election names `[EL1] Election 1` and
 * `[EL2] Election 2` both contain the substring markers verbatim.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-missnoms-';

export const permMissingNominationsTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  elections: 2,
  candidates: 1,
  organizations: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  // INTENTIONAL: el-2 has zero nominations to trigger the missing-nominations
  // modal 'some' variant per TIR5:15-26.
  nominationsInElectionIndices: [0]
});

export default permMissingNominationsTemplate;
