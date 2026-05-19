/**
 * applyLikertOnlyFilter tests — CLEAN-05 Path B (Phase 78 Plan 05).
 *
 * The filter restricts a resolved Template's `questions.fixed[]` to:
 *  - ALL info questions (those whose `category.external_id` belongs to a
 *    `question_categories.fixed[]` entry with `category_type: 'info'`)
 *  - OPINION questions whose `type === 'singleChoiceOrdinal'`
 *
 * Non-ordinal opinion questions (boolean / singleChoiceCategorical / number /
 * text under an opinion category) are dropped. Info questions are preserved
 * regardless of their `type`. Templates without `questions.fixed` are a no-op.
 *
 * The filter is a direct-mutation post-resolveTemplate hook per CONTEXT D-13 +
 * RESEARCH §"CLEAN-05 --likert-only CLI Plumbing" Q5 (avoids a builder
 * refactor of e2e.ts).
 */

import { describe, expect, it } from 'vitest';
import { applyLikertOnlyFilter } from '../../src/cli/likert-only';
import type { Template } from '../../src/template/types';

function makeTemplate(): Template {
  return {
    question_categories: {
      fixed: [
        { external_id: 'cat-opinion-a', category_type: 'opinion' },
        { external_id: 'cat-info', category_type: 'info' },
        { external_id: 'cat-opinion-b', category_type: 'opinion' }
      ]
    },
    questions: {
      fixed: [
        // Opinion ordinal — KEEP
        { external_id: 'q1', type: 'singleChoiceOrdinal', category: { external_id: 'cat-opinion-a' } },
        { external_id: 'q2', type: 'singleChoiceOrdinal', category: { external_id: 'cat-opinion-b' } },
        // Opinion categorical — DROP
        { external_id: 'q3', type: 'singleChoiceCategorical', category: { external_id: 'cat-opinion-a' } },
        // Opinion boolean — DROP
        { external_id: 'q4', type: 'boolean', category: { external_id: 'cat-opinion-b' } },
        // Opinion number — DROP
        { external_id: 'q5', type: 'number', category: { external_id: 'cat-opinion-a' } },
        // Info text — KEEP
        { external_id: 'q6', type: 'text', category: { external_id: 'cat-info' } },
        // Info number — KEEP (info questions preserved regardless of type)
        { external_id: 'q7', type: 'number', category: { external_id: 'cat-info' } }
      ]
    }
  } as Template;
}

describe('applyLikertOnlyFilter (CLEAN-05 Path B)', () => {
  it('keeps singleChoiceOrdinal opinion questions', () => {
    const tpl = makeTemplate();
    applyLikertOnlyFilter(tpl);
    const ids = (tpl.questions!.fixed as Array<{ external_id: string }>).map((q) => q.external_id);
    expect(ids).toContain('q1');
    expect(ids).toContain('q2');
  });

  it('drops non-ordinal opinion questions (categorical, boolean, number)', () => {
    const tpl = makeTemplate();
    applyLikertOnlyFilter(tpl);
    const ids = (tpl.questions!.fixed as Array<{ external_id: string }>).map((q) => q.external_id);
    expect(ids).not.toContain('q3'); // categorical
    expect(ids).not.toContain('q4'); // boolean
    expect(ids).not.toContain('q5'); // number under opinion
  });

  it('keeps all info questions regardless of `type`', () => {
    const tpl = makeTemplate();
    applyLikertOnlyFilter(tpl);
    const ids = (tpl.questions!.fixed as Array<{ external_id: string }>).map((q) => q.external_id);
    expect(ids).toContain('q6'); // info text
    expect(ids).toContain('q7'); // info number
  });

  it('reports a count delta via the returned stats', () => {
    const tpl = makeTemplate();
    const stats = applyLikertOnlyFilter(tpl);
    expect(stats).toEqual({ applied: true, before: 7, after: 4, dropped: 3 });
  });

  it('is a graceful no-op when `questions.fixed` is undefined', () => {
    const tpl: Template = { question_categories: { fixed: [] } } as Template;
    const stats = applyLikertOnlyFilter(tpl);
    expect(stats.applied).toBe(false);
  });

  it('is a graceful no-op when `questions` is undefined', () => {
    const tpl: Template = {} as Template;
    const stats = applyLikertOnlyFilter(tpl);
    expect(stats.applied).toBe(false);
  });

  it('treats questions referencing unknown category external_ids as opinion (conservative default)', () => {
    // A question whose category is not in question_categories.fixed[] is
    // treated as opinion. Non-ordinal => dropped. Ordinal => kept.
    const tpl: Template = {
      question_categories: { fixed: [{ external_id: 'cat-info', category_type: 'info' }] },
      questions: {
        fixed: [
          { external_id: 'orphan-text', type: 'text', category: { external_id: 'cat-unknown' } },
          { external_id: 'orphan-ordinal', type: 'singleChoiceOrdinal', category: { external_id: 'cat-unknown' } }
        ]
      }
    } as Template;
    applyLikertOnlyFilter(tpl);
    const ids = (tpl.questions!.fixed as Array<{ external_id: string }>).map((q) => q.external_id);
    expect(ids).not.toContain('orphan-text'); // unknown category → opinion → text dropped
    expect(ids).toContain('orphan-ordinal'); // unknown category → opinion → ordinal kept
  });

  it('produces a Likert-only-compatible question set for the actual e2e template (smoke)', async () => {
    // Smoke against the real e2e template — confirms the filter survives the
    // Phase 76 + 77 question additions (info questions preserved; non-ordinal
    // opinion questions dropped).
    const { e2eTemplate } = await import('../../src/templates/e2e');
    // Deep clone so the test doesn't mutate the shared exported template.
    const tpl = JSON.parse(JSON.stringify(e2eTemplate)) as Template;
    const stats = applyLikertOnlyFilter(tpl);
    expect(stats.applied).toBe(true);

    const fixed = tpl.questions!.fixed as Array<{
      external_id: string;
      type: string;
      category: { external_id: string };
    }>;
    const infoCategoryIds = new Set(
      (tpl.question_categories!.fixed as Array<{ external_id: string; category_type: string }>)
        .filter((c) => c.category_type === 'info')
        .map((c) => c.external_id)
    );

    for (const q of fixed) {
      const isInfo = infoCategoryIds.has(q.category.external_id);
      if (!isInfo) {
        expect(q.type).toBe('singleChoiceOrdinal');
      }
    }

    // The e2e template ships 16 singleChoiceOrdinal opinion questions at HEAD;
    // assert we kept exactly those (no over-drop, no over-keep).
    const ordinalCount = fixed.filter((q) => q.type === 'singleChoiceOrdinal').length;
    expect(ordinalCount).toBe(16);
  });
});
