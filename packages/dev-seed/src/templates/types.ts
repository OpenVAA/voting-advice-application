/**
 * Dev-seed-internal template-side type widenings.
 *
 * Currently exports {@link TemplateQuestionInCardContent} — a widening of
 * `@openvaa/app-shared`'s `QuestionInCardContent` that lets template authors
 * wire `results.cardContents.{candidate,organization,alliance}[*].question`
 * by stable `external_id` token instead of post-seed DB UUID.
 *
 * The Writer's Pass-5 resolver (`resolveAppSettingsExternalIds`) flattens
 * every `{ externalId: '<id>' }` shape into the plain UUID string BEFORE the
 * `merge_jsonb_column` RPC writes to the DB — so the PUBLIC
 * `QuestionInCardContent` shape (in `@openvaa/app-shared`) stays
 * `question: string`, and runtime / frontend / admin-UI consumers are
 * unaffected. The persisted JSONB column contains plain UUID strings.
 *
 * Rationale: see Phase 88 Plan 04 ADR at
 * `.planning/phases/88-…/88-04-ADR-cardContents-resolver.md` (Option B —
 * seed-time resolution in dev-seed Writer Pass-5).
 *
 * Follow-up TODO (v2.11+ candidate): the entire `cardContents` settings
 * family is scheduled for an election-specific refactor; this widening is
 * intentionally dev-seed-private to keep the future refactor's blast radius
 * narrow.
 */

import type { QuestionInCardContent } from '@openvaa/app-shared';

/**
 * Template-side widening of {@link QuestionInCardContent} that accepts either
 *  - a plain `string` (legacy UUID; passes through the Writer resolver
 *    unchanged), OR
 *  - `{ externalId: string }` (resolved at seed time to the matching
 *    question's DB UUID by the Writer's Pass-5 resolver).
 *
 * Consumed by template files (e.g. `baseV1.ts`) that author cardContents by
 * stable external_id token. NEVER reaches the persisted JSONB column — the
 * Writer flattens before merge.
 */
export type TemplateQuestionInCardContent = Omit<QuestionInCardContent, 'question'> & {
  question: string | { externalId: string };
};
