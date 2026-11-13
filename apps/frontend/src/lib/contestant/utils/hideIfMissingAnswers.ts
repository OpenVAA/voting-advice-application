import { entityDescriptorOf } from './entityDescriptor';
import type { ServedEntityType } from '@openvaa/app-shared';

/**
 * The part of the application settings that says which entity types are hidden from voters while they have unanswered opinion questions.
 */
export type HideIfMissingAnswersSettings = {
  entities?: { hideIfMissingAnswers?: Partial<Record<ServedEntityType, boolean>> };
};

/**
 * Whether an entity of a type is hidden from voters while it has unanswered opinion questions: what `entities.hideIfMissingAnswers` holds under the key the type's descriptor names. It is `false` for a type whose descriptor names no key, so such an entity is never told that it is hidden.
 * @param entityType - The type of the entity the user edits. While it is not known the candidate's descriptor is read, as on every page.
 * @param appSettings - The application settings.
 * @returns Whether missing opinion answers hide the entity.
 */
export function isHiddenIfMissingAnswers({
  entityType,
  appSettings
}: {
  entityType: ServedEntityType | undefined;
  appSettings: HideIfMissingAnswersSettings;
}): boolean {
  const key = entityDescriptorOf(entityType).hideIfMissingAnswersKey;
  return !!key && !!appSettings.entities?.hideIfMissingAnswers?.[key];
}
