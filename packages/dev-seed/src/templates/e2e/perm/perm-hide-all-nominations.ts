/**
 * perm-hide-all-nominations minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 1 candidate, 1 opinion Likert-5 question. The under-test setting is `entities.showAllNominations: false` which triggers the 307 server-side redirect in `apps/frontend/src/routes/(voters)/nominations/+layout.ts:19-27` — `/en/nominations` redirects to `/en` (Home).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-hide-all-noms-'`.
 *
 * UNAUTHENTICATED — the spec walks `page.goto('/en/nominations')` and asserts the URL matches /\/en\/?$/ (wait for the 307 navigation completion).
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-hide-all-noms-';

export const permHideAllNominationsTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    entities: { showAllNominations: false }
  }
});

export default permHideAllNominationsTemplate;
