/**
 * perm-hide-category-tags minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 1 candidate, 1
 * opinion Likert-5 question. The under-test setting is
 * `questions.showCategoryTags: false` which removes CategoryTag from the
 * question heading.
 *
 * Prefix: 'e2e-perm-hide-cattags-'.
 *
 * UNAUTHENTICATED — voter walks to /questions then asserts
 * `expect(categoryTag).toHaveCount(0)`.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-hide-cattags-';

export const permHideCategoryTagsTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    questions: { showCategoryTags: false }
  }
});

export default permHideCategoryTagsTemplate;
