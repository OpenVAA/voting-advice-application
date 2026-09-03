/**
 * perm-header-show-help minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 1 candidate, 1 opinion Likert-5 question. The under-test setting is `header.showHelp: true` which surfaces the help Button in the Banner.svelte top bar (gated on `topBarSettings.current.actions.help === 'show'`).
 * Clicking the button navigates to `getRoute.current('Help')` which resolves to `${VOTER}/about` per apps/frontend/src/lib/routes/route.ts:17.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-header-help-'`.
 *
 * UNAUTHENTICATED — the spec walks to /en (voter intro), asserts on the `header-help` testid in the Banner, clicks it, and asserts the URL matches /\/en\/about/.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-header-help-';

export const permHeaderShowHelpTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    header: { showHelp: true }
  }
});

export default permHeaderShowHelpTemplate;
