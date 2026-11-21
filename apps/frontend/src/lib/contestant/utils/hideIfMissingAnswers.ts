import type { ServedEntityType } from '@openvaa/app-shared';

/**
 * The part of the application settings that says which entity types are hidden from voters while they have unanswered opinion questions.
 */
export type HideIfMissingAnswersSettings = {
  entities?: { hideIfMissingAnswers?: Partial<Record<ServedEntityType, boolean>> };
};

/**
 * Whether an entity of a type is hidden from voters while it has unanswered opinion questions: what `entities.hideIfMissingAnswers` holds under the type. It is `false` for a type the setting does not name, so such an entity is never told that it is hidden.
 * @param entityType - The type of the entity the user edits. While it is not known the candidate's setting is read, as on every page.
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
  return !!appSettings.entities?.hideIfMissingAnswers?.[entityType ?? 'candidate'];
}
