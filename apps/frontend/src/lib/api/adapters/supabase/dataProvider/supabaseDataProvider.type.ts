import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';
import type { Tables } from '@openvaa/supabase-types';

/** A raw `question_categories` row. */
export type QuestionCategoryRow = Tables<'question_categories'>;

/** A raw `questions` row. */
export type QuestionRow = Tables<'questions'>;

/**
 * The single jsonb value the `get_questions` RPC returns. Both keys are always arrays — `[]` rather than `null` when empty — and each entry is a raw table row, because the function aggregates `to_jsonb(qc)` / `to_jsonb(q)` and therefore emits the same snake_case columns a `select('*')` would return.
 */
export type GetQuestionsPayload = {
  categories: Array<QuestionCategoryRow>;
  questions: Array<QuestionRow>;
};

/**
 * The flattened view of a nomination that the reverse fill in `SupabaseDataProvider._getNominationData` works on.
 *
 * The reverse fill walks the `nominations` array twice:
 *   1. Index the child ids by `parentNominationId` and child `entityType`.
 *   2. For each parent, write the `*NominationIds` field that matches its own `entityType`.
 *
 * The `*NominationIds` fields are mutable `Array<Id>`, not `readonly`, because the fill writes them in place. The public nomination types in `@openvaa/data` populate these fields only from nested input (e.g. `org.data.candidates = [...]`), and the flat schema sets only the child → parent edge, so the adapter adds the parent → child edges after mapping.
 *
 * The fill runs after `_getNominationData` has enforced the `Nomination` invariant that `parentNominationId` and `parentNominationType` are both set or both absent: an unresolvable parent id is already cleared.
 */
export interface InternalFlatNomination {
  id: Id;
  entityType: EntityType;
  parentNominationId?: Id | null;
  /** Set on Organization or Faction parents during reverse-fill. */
  candidateNominationIds?: Array<Id>;
  /** Set on Organization parents during reverse-fill. */
  factionNominationIds?: Array<Id>;
  /** Set on Alliance parents during reverse-fill. */
  organizationNominationIds?: Array<Id>;
}
