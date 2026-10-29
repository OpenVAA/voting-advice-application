import { parseAnswers } from './parseAnswers';
import type { CandidateData, OrganizationData } from '@openvaa/data';
import type { LocalizedEntityData } from '../base/dataWriter.type';

/**
 * Translate the localized data of an entity of either served type into the entity data the `DataRoot` takes. Used when displaying a preview of the entity in the Contestant App.
 * @param entity - The entity's data with localized answers.
 * @param locale - The locale the answers are translated to.
 * @returns A copy of the data, of the same entity type, with its answers translated.
 */
export function translateLocalizedEntity(
  entity: LocalizedEntityData,
  locale: string | null
): CandidateData | OrganizationData {
  return {
    ...structuredClone(entity),
    answers: parseAnswers(entity.answers ?? null, locale)
  };
}
