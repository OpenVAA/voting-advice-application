/**
 * perm-hide-election-tags minimal-data template.
 *
 * Topology: 2 elections sharing 1 CG with 1 CO, 2 organisations, 1 candidate,
 * 1 opinion Likert-5 question. The under-test setting is
 * `elections.showElectionTags: false` which removes ElectionTag from the
 * question heading.
 *
 * Prefix: 'e2e-perm-hide-eltags-'.
 *
 * UNAUTHENTICATED — voter walks the standard election-selector +
 * constituency-selector flow then asserts `expect(electionTag).toHaveCount(0)`
 * on /questions.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-hide-eltags-';

export const permHideElectionTagsTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  elections: 2,
  settingsOverlay: {
    elections: { showElectionTags: false }
  }
});

export default permHideElectionTagsTemplate;
