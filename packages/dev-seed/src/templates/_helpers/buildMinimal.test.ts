/**
 * Vitest coverage for {@link buildMinimal}.
 *
 * Covers the 8 core behaviours:
 *
 *  1. Default 1c/1opin/0info — single candidate carries answer for the 1
 *     seeded opinion question (default candidateAnswersDefault='all').
 *  2. settingsOverlay deep-merges onto MINIMAL_BASE_APP_SETTINGS.
 *  3. elections=2 + nominationsInElectionIndices=[0] yields nominations only
 *     in el-1.
 *  4. customDataByQuestion injects custom_data on a named question (keyed by
 *     BARE external_id).
 *  5. answersByCandidate explicit map overrides the default answer fill.
 *  6. Multi-candidate, multi-question default: every candidate carries an
 *     answer to every seeded question.
 *  7. answersByCandidate['cand-X'] = 'none' produces a clean candidate.
 *  8. candidateAnswersDefault: 'none' (global override) produces all clean
 *     candidates.
 */

import { describe, expect, it } from 'vitest';
import { buildMinimal, defaultAnswerForQuestion } from './buildMinimal';

describe('buildMinimal', () => {
  it('returns a Template with default 1e/1cg/1co/2 orgs/1 cand/1 opin/0 info shape; candidate carries 1 answer (Test 1)', () => {
    const tpl = buildMinimal({ externalIdPrefix: 'e2e-test-' });

    expect(tpl.externalIdPrefix).toBe('e2e-test-');
    expect(tpl.seed).toBe(42);
    expect(tpl.generateTranslationsForAllLocales).toBe(false);

    expect(tpl.elections?.fixed).toHaveLength(1);
    expect(tpl.constituency_groups?.fixed).toHaveLength(1);
    expect(tpl.constituencies?.fixed).toHaveLength(1);
    expect(tpl.organizations?.fixed).toHaveLength(2);
    expect(tpl.candidates?.fixed).toHaveLength(1);

    const opinions = (tpl.questions?.fixed ?? []).filter(
      (q) => (q as { type?: string }).type === 'singleChoiceOrdinal'
    );
    const infos = (tpl.questions?.fixed ?? []).filter(
      (q) => (q as { type?: string }).type === 'text'
    );
    expect(opinions).toHaveLength(1);
    expect(infos).toHaveLength(0);

    // Default candidateAnswersDefault='all' — the candidate has an answer to
    // the 1 seeded opinion question.
    const cand = tpl.candidates?.fixed?.[0] as
      | { answersByExternalId?: Record<string, unknown> }
      | undefined;
    expect(cand?.answersByExternalId).toBeDefined();
    expect(Object.keys(cand?.answersByExternalId ?? {})).toHaveLength(1);
  });

  it('settingsOverlay deep-merges onto MINIMAL_BASE_APP_SETTINGS (Test 2)', () => {
    const tpl = buildMinimal({
      externalIdPrefix: 'e2e-overlay-',
      settingsOverlay: { access: { answersLocked: true } }
    });

    const settings = (tpl.app_settings?.fixed?.[0] as { settings?: Record<string, unknown> })
      ?.settings as Record<string, Record<string, unknown>>;
    expect(settings.access.answersLocked).toBe(true);
    // Base access flags preserved (deep merge, not shallow):
    expect(settings.access.candidateApp).toBe(true);
    expect(settings.access.voterApp).toBe(true);
    expect(settings.access.adminApp).toBe(true);
    expect(settings.access.underMaintenance).toBe(false);
    // Other top-level keys preserved unchanged:
    expect(settings.matching).toBeDefined();
    expect(settings.entities).toBeDefined();
  });

  it('elections=2 + nominationsInElectionIndices=[0] yields nominations only in el-1 (Test 3)', () => {
    const tpl = buildMinimal({
      externalIdPrefix: 'e2e-elec2-',
      elections: 2,
      nominationsInElectionIndices: [0]
    });

    expect(tpl.elections?.fixed).toHaveLength(2);
    const noms = tpl.nominations?.fixed ?? [];
    // Every nomination row's election ref must reference el-1, never el-2.
    for (const nom of noms) {
      const electionRef = (nom as { election?: { external_id?: string } }).election;
      expect(electionRef?.external_id).toContain('el-1');
      expect(electionRef?.external_id).not.toContain('el-2');
    }
    expect(noms.length).toBeGreaterThan(0);
  });

  it('customDataByQuestion injects custom_data onto the named question by BARE external_id (Test 4)', () => {
    const tpl = buildMinimal({
      externalIdPrefix: 'e2e-cd-',
      customDataByQuestion: { 'qu-opin-l5-1': { hero: '🗳️' } }
    });

    const opinions = (tpl.questions?.fixed ?? []).filter(
      (q) => (q as { type?: string }).type === 'singleChoiceOrdinal'
    );
    const q1 = opinions[0] as { external_id?: string; custom_data?: Record<string, unknown> };
    expect(q1.external_id).toBe('qu-opin-l5-1');
    expect(q1.custom_data?.hero).toBe('🗳️');
  });

  it('answersByCandidate explicit map overrides the default answer fill (Test 5)', () => {
    const tpl = buildMinimal({
      externalIdPrefix: 'e2e-ans-',
      answersByCandidate: {
        'cand-1': { 'qu-opin-l5-1': { value: 5 } }
      }
    });

    const cand = tpl.candidates?.fixed?.[0] as
      | { answersByExternalId?: Record<string, { value?: unknown }> }
      | undefined;
    const answersMap = cand?.answersByExternalId ?? {};
    // Map keyed by FULL prefixed external_id (writer protocol):
    expect(answersMap['e2e-ans-qu-opin-l5-1']).toBeDefined();
    expect(answersMap['e2e-ans-qu-opin-l5-1']?.value).toBe(5);
    // Only the explicit override — does NOT include any default-fill entries.
    expect(Object.keys(answersMap)).toHaveLength(1);
  });

  it('multi-candidate + multi-question default-all fills every answer (Test 6)', () => {
    const tpl = buildMinimal({
      externalIdPrefix: 'e2e-multi-',
      candidates: 2,
      opinionQuestions: 2,
      infoQuestions: 1
    });

    expect(tpl.candidates?.fixed).toHaveLength(2);
    expect(tpl.questions?.fixed).toHaveLength(3); // 2 opinion + 1 info

    for (const c of tpl.candidates?.fixed ?? []) {
      const cand = c as { answersByExternalId?: Record<string, { value?: unknown }> };
      const answersMap = cand.answersByExternalId ?? {};
      expect(Object.keys(answersMap)).toHaveLength(3);

      // Info-question answer shape — { value: { en: '[<extId>] desc' } }.
      const infoEntry = answersMap['e2e-multi-qu-info-1'];
      expect(infoEntry).toBeDefined();
      const infoVal = infoEntry?.value as { en?: string } | undefined;
      expect(infoVal?.en).toContain('[e2e-multi-qu-info-1]');

      // Opinion Likert5 answer shape — { value: '3' }.
      const opinEntry = answersMap['e2e-multi-qu-opin-l5-1'];
      expect(opinEntry).toBeDefined();
      expect(opinEntry?.value).toBe('3');
    }
  });

  it("answersByCandidate['cand-X'] = 'none' produces a clean candidate (Test 7)", () => {
    const tpl = buildMinimal({
      externalIdPrefix: 'e2e-cln-',
      candidates: 2,
      answersByCandidate: { 'cand-2': 'none' }
    });

    expect(tpl.candidates?.fixed).toHaveLength(2);
    const c1 = tpl.candidates?.fixed?.[0] as { answersByExternalId?: Record<string, unknown> };
    const c2 = tpl.candidates?.fixed?.[1] as { answersByExternalId?: Record<string, unknown> };

    // cand-1 keeps the default-all fill (1 opinion question → 1 entry).
    expect(Object.keys(c1.answersByExternalId ?? {})).toHaveLength(1);
    // cand-2 is clean (empty map).
    expect(c2.answersByExternalId).toEqual({});
  });

  it('defaultAnswerForQuestion: number with custom_data min/max returns the numeric midpoint (D-16)', () => {
    const entry = defaultAnswerForQuestion(
      { type: 'number', custom_data: { min: 0, max: 10 } },
      'e2e-num-qu-number-1'
    );
    // Numeric midpoint (0..10 → 5), JSON number not string.
    expect(entry.value).toBe(5);
    expect(typeof entry.value).toBe('number');
  });

  it('defaultAnswerForQuestion: number with no min/max returns { value: 0 } (D-16)', () => {
    const entry = defaultAnswerForQuestion({ type: 'number' }, 'e2e-num-qu-number-2');
    expect(entry.value).toBe(0);
    expect(typeof entry.value).toBe('number');
  });

  it('defaultAnswerForQuestion: multipleChoiceCategorical returns an array of choice ids respecting minSelections (D-16)', () => {
    const entry = defaultAnswerForQuestion(
      {
        type: 'multipleChoiceCategorical',
        choices: [
          { id: 'a' },
          { id: 'b' },
          { id: 'c' },
          { id: 'd' }
        ],
        custom_data: { minSelections: 2, maxSelections: 3 }
      },
      'e2e-mc-qu-multichoice-1'
    );
    expect(Array.isArray(entry.value)).toBe(true);
    const ids = entry.value as Array<string>;
    // minSelections 2 → exactly 2 ids, all valid choice ids.
    expect(ids).toHaveLength(2);
    expect(ids).toEqual(['a', 'b']);
  });

  it("candidateAnswersDefault: 'none' produces all clean candidates (Test 8)", () => {
    const tpl = buildMinimal({
      externalIdPrefix: 'e2e-nodef-',
      candidates: 3,
      opinionQuestions: 2,
      candidateAnswersDefault: 'none'
    });

    expect(tpl.candidates?.fixed).toHaveLength(3);
    for (const c of tpl.candidates?.fixed ?? []) {
      const cand = c as { answersByExternalId?: Record<string, unknown> };
      expect(cand.answersByExternalId).toEqual({});
    }
  });
});
