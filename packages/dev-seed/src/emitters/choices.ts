/**
 * Readers of a question's `choices` JSONB, typed by the shared `LocalizedChoice` shape the application reads the same column with.
 *
 * The column is JSONB, so every reader narrows entry by entry and drops an entry of the wrong shape rather than trusting the stored value.
 */

import type { LocalizedChoice } from '@openvaa/app-shared';
import type { TablesInsert } from '@openvaa/supabase-types';

/**
 * A choice of an ordinal question, whose `normalizableValue` places it on the question's scale.
 */
export type OrdinalChoice = Omit<LocalizedChoice, 'normalizableValue'> & { normalizableValue: number };

/**
 * The ids of a question's choices, in order. An entry without a string `id` is dropped.
 * @param q - The question row.
 */
export function readChoiceIds(q: TablesInsert<'questions'>): Array<string> {
  const choices = q.choices;
  if (!Array.isArray(choices)) return [];
  const ids: Array<string> = [];
  for (const choice of choices) {
    const id = isObject(choice) ? choice.id : undefined;
    if (typeof id === 'string') ids.push(id);
  }
  return ids;
}

/**
 * The id and `normalizableValue` of each of an ordinal question's choices, in order. An entry without a string `id` or without a finite numeric `normalizableValue` is dropped: the application computes an ordinal question's scale from `normalizableValue`, so a choice without one cannot be placed on it.
 * @param q - The question row.
 */
export function readOrdinalChoices(
  q: TablesInsert<'questions'>
): Array<Pick<OrdinalChoice, 'id' | 'normalizableValue'>> {
  const choices = q.choices;
  if (!Array.isArray(choices)) return [];
  const ordinal: Array<Pick<OrdinalChoice, 'id' | 'normalizableValue'>> = [];
  for (const choice of choices) {
    if (!isObject(choice)) continue;
    const { id, normalizableValue } = choice;
    if (typeof id === 'string' && typeof normalizableValue === 'number' && Number.isFinite(normalizableValue)) {
      ordinal.push({ id, normalizableValue });
    }
  }
  return ordinal;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
