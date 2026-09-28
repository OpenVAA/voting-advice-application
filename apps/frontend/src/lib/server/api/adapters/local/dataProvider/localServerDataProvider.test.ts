import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalServerDataProvider } from './localServerDataProvider';
import type { ReadPath } from '../localPaths';

// The file paths derive from a private env variable that the test environment does not provide; `read` is stubbed below, so the paths are never used.
vi.mock('$lib/server/constants', () => ({ constants: { LOCAL_DATA_DIR: '' } }));

/**
 * The local files the provider reads, keyed by endpoint. Each filter axis has a row that lists the filtered value, one that lists another value, one that omits the list and one whose list is empty, because `get_questions` treats the last two alike.
 */
const FIXTURES: Partial<Record<ReadPath, unknown>> = {
  nominations: [
    { id: 'n1', entityType: 'candidate', entityId: 'cand1', electionId: 'e1', constituencyId: 'c1', electionRound: 1 },
    { id: 'n2', entityType: 'candidate', entityId: 'cand2', electionId: 'e1', constituencyId: 'c1', electionRound: 2 },
    { id: 'n3', entityType: 'candidate', entityId: 'cand3', electionId: 'e1', constituencyId: 'c1' },
    { id: 'n4', entityType: 'candidate', entityId: 'cand4', electionId: 'e2', constituencyId: 'c1', electionRound: 2 }
  ],
  entities: [
    { id: 'cand1', type: 'candidate', firstName: 'A', lastName: 'One' },
    { id: 'cand2', type: 'candidate', firstName: 'B', lastName: 'Two' },
    { id: 'cand3', type: 'candidate', firstName: 'C', lastName: 'Three' },
    { id: 'cand4', type: 'candidate', firstName: 'D', lastName: 'Four' }
  ],
  questions: {
    categories: [
      { id: 'catAll', name: 'All' },
      { id: 'catEmpty', name: 'Empty', electionIds: [], constituencyIds: [], electionRounds: [] },
      { id: 'catC1', name: 'C1', constituencyIds: ['c1'] },
      { id: 'catC2', name: 'C2', constituencyIds: ['c2'] },
      { id: 'catR2', name: 'R2', electionRounds: [2] },
      { id: 'catE2', name: 'E2', electionIds: ['e2'] }
    ],
    questions: [
      { id: 'qAll', name: 'All', type: 'text', categoryId: 'catAll' },
      { id: 'qEmpty', name: 'Empty', type: 'text', categoryId: 'catEmpty' },
      { id: 'qC1', name: 'C1', type: 'text', categoryId: 'catC1' },
      { id: 'qC2', name: 'C2', type: 'text', categoryId: 'catC2' },
      { id: 'qR2', name: 'R2', type: 'text', categoryId: 'catR2' },
      { id: 'qE2', name: 'E2', type: 'text', categoryId: 'catE2' },
      { id: 'qOwnC2', name: 'Own C2', type: 'text', categoryId: 'catAll', constituencyIds: ['c2'] },
      { id: 'qOwnR1', name: 'Own R1', type: 'text', categoryId: 'catAll', electionRounds: [1] },
      { id: 'qOwnE2', name: 'Own E2', type: 'text', categoryId: 'catAll', electionIds: ['e2'] },
      {
        id: 'qOwnEmpty',
        name: 'Own empty',
        type: 'text',
        categoryId: 'catAll',
        constituencyIds: [],
        electionRounds: []
      }
    ]
  }
};

const ALL_CATEGORIES = ['catAll', 'catEmpty', 'catC1', 'catC2', 'catR2', 'catE2'];
const ALL_QUESTIONS = ['qAll', 'qEmpty', 'qC1', 'qC2', 'qR2', 'qE2', 'qOwnC2', 'qOwnR1', 'qOwnE2', 'qOwnEmpty'];

/**
 * The ids of `rows`, sorted so an assertion does not depend on the order the provider returns them in.
 * @param rows - The rows to read.
 * @returns Their sorted ids.
 */
function idsOf(rows: Array<{ id: string }>): Array<string> {
  return rows.map(({ id }) => id).sort();
}

/**
 * Remove `excluded` from `ids` and sort the rest.
 * @param ids - The full id list.
 * @param excluded - The ids a filter should drop.
 * @returns The sorted ids that remain.
 */
function without(ids: Array<string>, ...excluded: Array<string>): Array<string> {
  return ids.filter((id) => !excluded.includes(id)).sort();
}

describe('LocalServerDataProvider', () => {
  let provider: LocalServerDataProvider;

  beforeEach(() => {
    provider = new LocalServerDataProvider();
    vi.spyOn(provider, 'read').mockImplementation(async (endpoint: ReadPath) => JSON.stringify(FIXTURES[endpoint]));
    vi.spyOn(provider, 'exists').mockResolvedValue(true);
  });

  describe('getNominationData', () => {
    async function load(options: Parameters<LocalServerDataProvider['getNominationData']>[0] = {}) {
      const body = (await (await provider.getNominationData(options)).json()) as {
        nominations: Array<{ id: string }>;
        entities: Array<{ id: string }>;
      };
      return { nominations: idsOf(body.nominations), entities: idsOf(body.entities) };
    }

    it('returns every round without an `electionRound` option', async () => {
      expect(await load()).toEqual({
        nominations: ['n1', 'n2', 'n3', 'n4'],
        entities: ['cand1', 'cand2', 'cand3', 'cand4']
      });
    });

    it('returns only the nominations of the requested round, and only their entities', async () => {
      expect(await load({ electionRound: 2 })).toEqual({ nominations: ['n2', 'n4'], entities: ['cand2', 'cand4'] });
    });

    it('counts a nomination with no `electionRound` as round 1', async () => {
      expect((await load({ electionRound: 1 })).nominations).toEqual(['n1', 'n3']);
    });

    it('applies the round together with the election and constituency filters', async () => {
      expect((await load({ electionId: 'e1', constituencyId: 'c1', electionRound: 2 })).nominations).toEqual(['n2']);
    });
  });

  describe('getQuestionData', () => {
    async function load(options: Parameters<LocalServerDataProvider['getQuestionData']>[0] = {}) {
      const body = (await (await provider.getQuestionData(options)).json()) as {
        categories: Array<{ id: string }>;
        questions: Array<{ id: string }>;
      };
      return { categories: idsOf(body.categories), questions: idsOf(body.questions) };
    }

    it('returns everything without a filter', async () => {
      expect(await load()).toEqual({ categories: [...ALL_CATEGORIES].sort(), questions: [...ALL_QUESTIONS].sort() });
    });

    it('filters by `electionId`, keeping rows whose list is missing or empty', async () => {
      expect(await load({ electionId: 'e1' })).toEqual({
        categories: without(ALL_CATEGORIES, 'catE2'),
        questions: without(ALL_QUESTIONS, 'qE2', 'qOwnE2')
      });
    });

    it('filters by `constituencyId` on categories and on questions independently', async () => {
      expect(await load({ constituencyId: 'c1' })).toEqual({
        categories: without(ALL_CATEGORIES, 'catC2'),
        questions: without(ALL_QUESTIONS, 'qC2', 'qOwnC2')
      });
    });

    it('filters by `electionRound` on categories and on questions, comparing numbers', async () => {
      expect(await load({ electionRound: 2 })).toEqual({
        categories: [...ALL_CATEGORIES].sort(),
        questions: without(ALL_QUESTIONS, 'qOwnR1')
      });
      expect(await load({ electionRound: 1 })).toEqual({
        categories: without(ALL_CATEGORIES, 'catR2'),
        questions: without(ALL_QUESTIONS, 'qR2')
      });
    });

    it('applies all three filters as a conjunction', async () => {
      expect(await load({ electionId: 'e1', constituencyId: 'c1', electionRound: 2 })).toEqual({
        categories: without(ALL_CATEGORIES, 'catE2', 'catC2'),
        questions: without(ALL_QUESTIONS, 'qE2', 'qOwnE2', 'qC2', 'qOwnC2', 'qOwnR1')
      });
    });

    it('accepts an array of constituency ids, keeping a row that lists any of them', async () => {
      expect((await load({ constituencyId: ['c2', 'c3'] })).categories).toEqual(without(ALL_CATEGORIES, 'catC1'));
    });
  });
});
