/**
 * perm-hide-election-tags minimal-data template.
 *
 * Topology: 2 elections sharing 1 CG with 1 CO, 2 organisations, 1 candidate,
 * 1 opinion Likert-5 question. The under-test setting is
 * `elections.showElectionTags: false` which removes ElectionTag from the
 * question heading.
 *
 * The overlay's `questions.showCategoryTags` entry — overridden to true here,
 * against the perm baseline's false in `shared.ts` — is the seeded precondition
 * for this dataset's own positive control, not decoration. It makes the
 * COMPLEMENTARY CategoryTag render, so the spec can pair its ElectionTag absence
 * assertion with a CategoryTag presence assertion and thereby FAIL when the
 * tag-render path stops rendering ANYWHERE — which a lone `toHaveCount(0)`,
 * satisfied by a page that renders no tags at all, cannot detect
 * (ASSERT-05 / finding F9).
 *
 * Prefix: 'e2e-perm-hide-eltags-'.
 *
 * UNAUTHENTICATED — voter walks the standard election-selector +
 * constituency-selector flow then asserts `expect(electionTag).toHaveCount(0)`
 * on /questions, alongside the forthcoming CategoryTag positive control.
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
    elections: { showElectionTags: false },
    questions: { showCategoryTags: true }
  }
});

export default permHideElectionTagsTemplate;
