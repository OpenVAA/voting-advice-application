/**
 * Why a write of an entity's nominations was not stored, and the message each reason is shown with. The nominations view and the editor's details step both show a refusal with the message named here.
 *
 * Tested in `nominationRefusal.test.ts`.
 */

import type { SetEntityNominationsResult } from '$lib/api/base/dataWriter.type';
import type { TranslationKey } from '$types';

/** Why a write of nominations was not stored: a reason the backend refused it for, or `failed` for a write that was rejected. */
export type NominationRefusal = Extract<SetEntityNominationsResult, { type: 'refused' }>['reason'] | 'failed';

/** The message of each reason a write of nominations was not stored. */
export const NOMINATION_REFUSAL_MESSAGE = {
  changed: 'contestantApp.nominations.error.changed',
  hasCandidates: 'contestantApp.nominations.error.hasCandidates',
  tooManyPending: 'contestantApp.nominations.error.tooManyPending',
  answersLocked: 'contestantApp.common.nominationsNotEditableAnswersLocked',
  nominationsLocked: 'contestantApp.common.nominationsNotEditable',
  failed: 'contestantApp.nominations.error.saveFailed'
} as const satisfies Record<NominationRefusal, TranslationKey>;

/**
 * Why a write of nominations was not stored.
 * @param result - What the write answered, or nothing for a write that was rejected.
 * @returns The reason it was refused for, `failed` for a write that was rejected or refused for a reason this module does not name, and `undefined` for a write that was stored.
 */
export function refusalOf(result: SetEntityNominationsResult | undefined): NominationRefusal | undefined {
  if (result?.type === 'saved') return undefined;
  if (result?.type === 'refused' && Object.hasOwn(NOMINATION_REFUSAL_MESSAGE, result.reason)) return result.reason;
  return 'failed';
}
