/**
 * State what the nominations view and the nomination editor both rest on, for the entity the URL names (universal). It decides, in order:
 *
 * 1. **The parent.** The parent loads' data, awaited before anything else. While a user-level gate is pending the load returns no facts.
 * 2. **No entity data.** When the parent's data holds no entity with its nominations, or the root load could not read the settings, the elections or the constituencies, the load returns no facts. The entity layout and the root layout show their own error views for those cases.
 * 3. **The facts.** `nominationFacts` holds whether the entity's nominations may be edited, the ids of the elections that admit the entity's type, and the ids of the entity's nominations the editor manages.
 *
 * The facts are computed from what the parent loads read, so the load makes no request, and on the server they are part of the rendered page. The view and the editor's guard read the same answer, so the two cannot disagree on whether the editor is open.
 *
 * The load takes `parent` from the event and nothing else: no param, no `url` property and no `route`. It therefore runs on entry to the nominations tree and when a parent load's data changes, and not on a navigation between two pages of the tree.
 */

import { nominationFactsOf, selectionDataOf } from './nominationFacts';
import type { NominationFacts } from './nominationFacts';

export async function load({ parent }): Promise<{ nominationFacts: NominationFacts | undefined }> {
  const parentData = await parent();
  if (parentData.gate !== null) return { nominationFacts: undefined };

  const userData = parentData.contestantUserData;
  if (!userData?.entity || !userData.nominations) return { nominationFacts: undefined };

  const selectionData = selectionDataOf(parentData);
  if (!selectionData) return { nominationFacts: undefined };

  return {
    nominationFacts: nominationFactsOf({
      selectionData,
      entityType: userData.entity.type,
      nominations: userData.nominations
    })
  };
}
