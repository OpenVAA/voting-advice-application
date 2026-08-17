/**
 * perm-hide-category-tags minimal-data template.
 *
 * Topology: 2 elections sharing 1 CG with 1 CO, 2 organisations, 1 candidate,
 * 1 opinion Likert-5 question. The under-test setting is
 * `questions.showCategoryTags: false` which removes CategoryTag from the
 * question heading.
 *
 * The SECOND election is the seeded precondition for this dataset's own
 * positive control, not decoration. `getElectionsToShow`
 * (`apps/frontend/src/lib/utils/questions/electionTags.ts:13`) returns `[]`
 * whenever fewer than two elections are in scope, so with a single election the
 * COMPLEMENTARY ElectionTag — left enabled by the perm baseline's
 * `elections.showElectionTags` (true in `shared.ts`) — could not render at all,
 * and a presence assertion on it would be red for a reason unrelated to the tag
 * component. With two elections it renders, so the spec can pair its CategoryTag
 * absence assertion with an ElectionTag presence assertion and thereby FAIL when
 * the tag-render path stops rendering ANYWHERE — which a lone `toHaveCount(0)`,
 * satisfied by a page that renders no tags at all, cannot detect
 * (finding F9).
 *
 * Prefix: 'e2e-perm-hide-cattags-'.
 *
 * UNAUTHENTICATED — voter walks the standard election-selector +
 * constituency-selector flow to /questions, then asserts
 * `expect(categoryTag).toHaveCount(0)` alongside the forthcoming ElectionTag
 * positive control.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-hide-cattags-';

export const permHideCategoryTagsTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  elections: 2,
  settingsOverlay: {
    questions: { showCategoryTags: false }
  }
});

export default permHideCategoryTagsTemplate;
