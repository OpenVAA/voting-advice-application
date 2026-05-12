/**
 * `--likert-only` template filter — Phase 78 CLEAN-05 Path B.
 *
 * Direct-mutation post-`resolveTemplate` hook (NOT a builder refactor of
 * e2e.ts per CONTEXT D-13 + RESEARCH §"CLEAN-05 --likert-only CLI Plumbing"
 * Q5 RECOMMENDED). Restricts a resolved template's `questions.fixed[]` to:
 *
 *   - ALL info questions (category resolves to `category_type: 'info'`)
 *   - OPINION questions whose `type === 'singleChoiceOrdinal'`
 *
 * Non-ordinal opinion questions (boolean / singleChoiceCategorical / number /
 * text under an opinion category) are dropped. The voter-fixture
 * `answeredVoterPage` at `tests/tests/fixtures/voter.fixture.ts` iterates
 * Likert-only opinion questions and cascades into 16 voter-app test failures
 * when it encounters a non-Likert opinion question — this filter produces a
 * seed shape compatible with that fixture (CLEAN-05 ROADMAP SC #5).
 *
 * Note on schema: `category_type` lives on `question_categories.fixed[]`, NOT
 * on individual questions — each question references a category via
 * `category.external_id`. The filter therefore builds a category-id → category-
 * type map first, then evaluates each question against that map. Questions
 * whose category external_id is not in the map are treated as opinion (the
 * conservative default — keeps the filter from silently smuggling unclassified
 * questions past the Likert restriction).
 *
 * Idempotent: applying twice on the same template is a no-op (the second pass
 * sees an already-Likert-restricted set; `dropped === 0`).
 *
 * @see .planning/phases/78-cleanup-hygiene-phase/78-05-PLAN.md
 * @see .planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md
 */

import type { Template } from '../template/types';

/**
 * Stats describing what the filter did. Stable shape — consumers (CLI logging)
 * rely on the property names.
 */
export interface LikertOnlyFilterStats {
  /** False when the template has no `questions.fixed` array (no-op path). */
  applied: boolean;
  /** Number of questions in `questions.fixed` before filtering. */
  before: number;
  /** Number of questions in `questions.fixed` after filtering. */
  after: number;
  /** Number of questions dropped (`before - after`). */
  dropped: number;
}

/**
 * Internal helpers — narrow the loose `z.record(z.string(), z.unknown())`
 * shape of `fixed[]` entries to the fields the filter needs to read. The
 * template schema (`packages/dev-seed/src/template/schema.ts:35-38`) keeps
 * fixed-row entries deliberately loose; this filter is one of the few callers
 * that needs to peek inside.
 */
interface QuestionLike {
  type?: unknown;
  category?: unknown;
  external_id?: unknown;
}
interface CategoryLike {
  external_id?: unknown;
  category_type?: unknown;
}
interface CategoryRef {
  external_id?: unknown;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/**
 * Apply the --likert-only filter to a resolved template in place.
 *
 * Mutates `template.questions.fixed` (replaces the array reference with a
 * filtered copy — the original array is not modified, so callers holding a
 * pre-call reference see the un-filtered list, while subsequent reads through
 * `template.questions.fixed` see the post-filter list).
 *
 * @param template - Resolved template (post-`resolveTemplate`).
 * @returns Stats describing the filter outcome (or `{ applied: false, ... }`
 *   when the template has no `questions.fixed` array).
 */
export function applyLikertOnlyFilter(template: Template): LikertOnlyFilterStats {
  const questionsFragment = (template as { questions?: { fixed?: Array<unknown> } }).questions;
  const fixed = questionsFragment?.fixed;
  if (!Array.isArray(fixed)) {
    return { applied: false, before: 0, after: 0, dropped: 0 };
  }

  // Build category-id → category-type map from question_categories.fixed.
  // Templates without question_categories produce an empty map; every
  // question's category is then treated as opinion (conservative default).
  const categoryTypes = new Map<string, string>();
  const categoriesFragment = (template as { question_categories?: { fixed?: Array<unknown> } }).question_categories;
  const categoriesFixed = categoriesFragment?.fixed;
  if (Array.isArray(categoriesFixed)) {
    for (const c of categoriesFixed) {
      if (!isObject(c)) continue;
      const cat = c as CategoryLike;
      const ext = typeof cat.external_id === 'string' ? cat.external_id : undefined;
      const ctype = typeof cat.category_type === 'string' ? cat.category_type : undefined;
      if (ext && ctype) categoryTypes.set(ext, ctype);
    }
  }

  const before = fixed.length;
  const next = fixed.filter((q) => {
    if (!isObject(q)) return false;
    const question = q as QuestionLike;
    const categoryRef = isObject(question.category) ? (question.category as CategoryRef) : undefined;
    const categoryExtId = typeof categoryRef?.external_id === 'string' ? categoryRef.external_id : undefined;
    const categoryType = categoryExtId ? categoryTypes.get(categoryExtId) : undefined;
    // Info questions: keep regardless of type.
    if (categoryType === 'info') return true;
    // Opinion (or unknown — conservative default): keep iff Likert-ordinal.
    return question.type === 'singleChoiceOrdinal';
  });
  const after = next.length;

  // Replace the array reference. The template schema marks `questions.fixed`
  // as Array<Record<string, unknown>>; the cast preserves that contract.
  (questionsFragment as { fixed?: Array<unknown> }).fixed = next;

  return { applied: true, before, after, dropped: before - after };
}
