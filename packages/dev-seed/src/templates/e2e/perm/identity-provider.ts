/**
 * identity-provider minimal-data template.
 *
 * The dataset of the identity-provider specs, seeded by `identity-provider.setup.ts` and removed by `identity-provider.teardown.ts`: the minimal topology and the minimal settings. The setup adds the identity provider's mode to the candidates' registration row for its own run.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-bankauth-idp-'` is its own. It lies inside the `e2e-bankauth-` namespace that `base.setup.ts` sweeps, so a dataset an aborted run left behind is cleared before the base dataset is seeded again. No other teardown's prefix overlaps it, so no other teardown counts its rows.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

export const identityProviderTemplate: Template = buildMinimal({
  externalIdPrefix: 'e2e-bankauth-idp-',
  candidates: 1,
  opinionQuestions: 1
});

export default identityProviderTemplate;
