/**
 * Phase 57 clustering integration test (D-57-17 / D-57-18 / Success Criterion 5).
 *
 * Headline test: synthetic candidates generated via the latent emitter cluster
 * by party more tightly than they cluster across parties. With 4 parties × 10
 * candidates × 12 ordinal questions at seed 42, `mean_intra / mean_inter < 0.5`
 * under Manhattan distance in a MatchingSpace built from OrdinalQuestions.
 *
 * Pitfall 6: `OrdinalQuestion.fromLikert({ scale: 5 })` generates choice ids
 * `choice_1..choice_5`, but our emitter returns `'1'..'5'` (QuestionsGenerator
 * + defaultProject convention). This test constructs MatchableQuestions via
 * the raw `new OrdinalQuestion({ id, values })` constructor with values
 * `[{id:'1',value:1}..{id:'5',value:5}]` — matching the emitter's id
 * convention.
 *
 * B2 fix: `buildClusteringCtx` accepts `questions` + `organizations` + `seed`
 * as parameters and populates `refs.questions` / `refs.organizations` at
 * construction time. An earlier draft tried to assign into a post-construction
 * ctx by casting the left-hand side of an assignment — which is not valid
 * TypeScript. This parameterized form sidesteps the issue entirely.
 */

import { Faker, en } from '@faker-js/faker';
import { DISTANCE_METRIC, MatchingSpace, OrdinalQuestion, Position } from '@openvaa/matching';
import { describe, expect, it } from 'vitest';

// Rule 3 — @openvaa/matching's barrel re-exports `DISTANCE_METRIC` (a map of
// { Manhattan: manhattanDistance, ... }) but not the bare `manhattanDistance`
// function. Access through the map; semantics identical.
const manhattanDistance = DISTANCE_METRIC.Manhattan;
import { latentAnswerEmitter } from '../../src/emitters/latent/latentEmitter';
import type { Ctx } from '../../src/ctx';
import type { Template } from '../../src/template/types';
import type { TablesInsert } from '@openvaa/supabase-types';

const PROJECT_UUID = '00000000-0000-0000-0000-000000000001';
const CATEGORY_UUID = '00000000-0000-0000-0000-000000000099';
const NUM_PARTIES = 4;
const CANDIDATES_PER_PARTY = 10;
const NUM_QUESTIONS = 12;
const LIKERT_SCALE = 5;

/**
 * B2 fix — accept questions + orgs + seed as parameters and populate
 * refs.questions / refs.organizations at construction time. Avoids the
 * invalid "cast-the-LHS-of-an-assignment" pattern that does not compile.
 */
function buildClusteringCtx(
  questions: Array<TablesInsert<'questions'>>,
  organizations: Array<{ external_id: string }>,
  seed: number
): Ctx {
  const faker = new Faker({ locale: [en] });
  faker.seed(seed);
  return {
    faker,
    projectId: PROJECT_UUID,
    externalIdPrefix: 'seed_',
    refs: {
      accounts: [{ id: PROJECT_UUID }],
      projects: [{ id: PROJECT_UUID }],
      elections: [],
      constituency_groups: [],
      constituencies: [],
      organizations,
      alliances: [],
      factions: [],
      candidates: [],
      question_categories: [],
      questions: questions as unknown as Array<{ external_id: string }>,
      nominations: [],
      app_settings: [],
      feedback: []
    },
    logger: () => {}
  };
}

function buildQuestionRows(): Array<TablesInsert<'questions'>> {
  const choices = Array.from({ length: LIKERT_SCALE }, (_, j) => ({
    id: String(j + 1),
    label: { en: `Label ${j + 1}` },
    normalizableValue: j + 1
  }));
  return Array.from({ length: NUM_QUESTIONS }, (_, i) => ({
    external_id: `seed_q_${String(i).padStart(3, '0')}`,
    project_id: PROJECT_UUID,
    type: 'singleChoiceOrdinal' as const,
    category_id: CATEGORY_UUID,
    choices
  })) as Array<TablesInsert<'questions'>>;
}

describe('Clustering integration (D-57-17 / D-57-18 / Success Criterion 5)', () => {
  it('mean_intra_party / mean_inter_party < 0.5 at seed 42, 4×10×12', () => {
    // Construct refs FIRST, then pass them into the ctx builder. B2 fix —
    // no LHS cast on the assembled ctx.
    const questions = buildQuestionRows();
    const organizations = Array.from({ length: NUM_PARTIES }, (_, i) => ({
      external_id: `seed_party_${i}`
    }));
    const ctx = buildClusteringCtx(questions, organizations, 42);

    const template: Template = { seed: 42 } as Template;
    const emit = latentAnswerEmitter(template);

    type Row = {
      extId: string;
      partyIdx: number;
      answers: Record<string, { value: unknown }>;
    };
    const rows: Array<Row> = [];
    let idx = 0;
    for (let p = 0; p < NUM_PARTIES; p++) {
      for (let c = 0; c < CANDIDATES_PER_PARTY; c++) {
        const candExtId = `seed_cand_${String(idx++).padStart(4, '0')}`;
        const candidate = {
          external_id: candExtId,
          project_id: PROJECT_UUID,
          first_name: 'test',
          last_name: 'test',
          organization: { external_id: ctx.refs.organizations[p].external_id }
        } as unknown as TablesInsert<'candidates'>;
        const answers = emit(candidate, questions, ctx);
        rows.push({ extId: candExtId, partyIdx: p, answers });
      }
    }

    // Build MatchableQuestions whose choice ids match our emitter's output
    // (`'1'..'5'` with values `1..5`). Pitfall 6: do NOT use
    // `OrdinalQuestion.fromLikert({ scale: 5 })` — it produces
    // `choice_1..choice_5`, which `normalizeValue` would fail to find.
    const matchable = questions.map(
      (q) =>
        new OrdinalQuestion({
          id: q.external_id!,
          values: Array.from({ length: LIKERT_SCALE }, (_, j) => ({
            id: String(j + 1),
            value: j + 1
          }))
        })
    );
    const space = MatchingSpace.fromQuestions({ questions: matchable });

    // Convert candidate answers → Position.
    const positions = rows.map((r) => {
      const coords = matchable.map((mq) =>
        mq.normalizeValue(r.answers[mq.id]?.value ?? undefined)
      );
      return new Position({ coordinates: coords, space });
    });

    let intraSum = 0;
    let intraN = 0;
    let interSum = 0;
    let interN = 0;
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const d = manhattanDistance({ a: positions[i], b: positions[j] });
        if (rows[i].partyIdx === rows[j].partyIdx) {
          intraSum += d;
          intraN++;
        } else {
          interSum += d;
          interN++;
        }
      }
    }
    const meanIntra = intraSum / intraN;
    const meanInter = interSum / interN;
    const ratio = meanIntra / meanInter;

    expect(Number.isFinite(meanIntra)).toBe(true);
    expect(Number.isFinite(meanInter)).toBe(true);
    expect(meanInter).toBeGreaterThan(0);
    // ======================================================================
    // D-57-17 headline assertion — W2 lock: the `< 0.5` threshold is a HARD
    // acceptance criterion. It MUST NOT be lowered by the test author to ship
    // green. If this assertion fails at `seed: 42`, the bug is in the
    // implementation (loadings too random, noise too high, spread too wide,
    // centroid sampler not separating parties enough, OrdinalQuestion
    // id-convention mismatch, etc.) OR in the TEST FIXTURE (e.g. template
    // `spread`/`noise` overrides needed). Legitimate responses, in order:
    //   1. Inspect and fix the implementation bug.
    //   2. Apply TEST-SIDE `spread: 0.08` or `noise: 0.02` to the Template
    //      literal above (NOT the production defaults in latent/*.ts).
    //   3. Escalate to user for a threshold reconsideration.
    // Silently lowering `0.5` to any larger value is PROHIBITED.
    // ======================================================================
    expect(ratio).toBeLessThan(0.5);

    // Soft inter-question correlation assertion (RESEARCH Open Question 4):
    // Pick the first two questions; compute Pearson correlation of their
    // normalized values across all candidates. Should be non-trivially non-zero
    // (|r| > 0.1 — loose bound) because shared party centroids + random
    // loadings produce correlated projections.
    const vals0 = rows
      .map((r) => r.answers[matchable[0].id]?.value)
      .filter((v): v is string => typeof v === 'string')
      .map((v) => Number(v));
    const vals1 = rows
      .map((r) => r.answers[matchable[1].id]?.value)
      .filter((v): v is string => typeof v === 'string')
      .map((v) => Number(v));
    expect(vals0).toHaveLength(rows.length);
    expect(vals1).toHaveLength(rows.length);
    const m0 = vals0.reduce((a, b) => a + b, 0) / vals0.length;
    const m1 = vals1.reduce((a, b) => a + b, 0) / vals1.length;
    let num = 0;
    let d0 = 0;
    let d1 = 0;
    for (let i = 0; i < vals0.length; i++) {
      num += (vals0[i] - m0) * (vals1[i] - m1);
      d0 += (vals0[i] - m0) ** 2;
      d1 += (vals1[i] - m1) ** 2;
    }
    const r = d0 === 0 || d1 === 0 ? 0 : num / Math.sqrt(d0 * d1);
    // Threshold from RESEARCH Open Question 4 — loose lower bound for
    // "non-trivial" correlation. Tune downward ONLY if empirically the default
    // knobs don't hit it.
    expect(Math.abs(r)).toBeGreaterThan(0.1);
  });
});
