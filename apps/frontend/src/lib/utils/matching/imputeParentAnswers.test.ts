import { OBJECT_TYPE } from '@openvaa/data';
import { describe, expect, it } from 'vitest';
import { imputeParentAnswers } from './imputeParentAnswers';
import { MatchingProxy } from './imputeParentAnswers.type';

/**
 * Phase 69 regression guard for `imputeParentAnswers`.
 *
 * 1. **Risk #7 backward-compat (childProxies omitted):** output is byte-identical
 *    to the entity-only read path for Organization / Faction parents. A regression
 *    here would silently degrade voter match scores for ALL parties.
 * 2. **Cascade (childProxies provided):** when a child has an entry in childProxies,
 *    the proxy answer wins over the entity answer. When a child has no entry,
 *    the function falls back to the entity read.
 * 3. **Alliance parent type (Phase 69 new branch):** parent.organizationNominations
 *    is read as the children array.
 *
 * Test strategy: synthetic input — no seed coupling. Mock objects conform to the
 * minimum shape `imputeParentAnswers` requires (objectType, id, entity.getAnswer,
 * candidateNominations / organizationNominations accessors as needed). The casts
 * via `as never` are intentional — the test exercises the function's runtime
 * behaviour with minimal-shape mocks rather than constructing fully-typed
 * nomination instances (Phase 67 D-03 "no coupling unit tests to seed shape").
 */

// --- Synthetic fixtures ---

type FakeAnswer = { value: number | string };
type FakeAnswers = Record<string, FakeAnswer | undefined>;

function makeFakeQuestion(opts: {
  id: string;
  type: 'SingleChoiceOrdinal' | 'SingleChoiceCategorical' | 'Number';
  choices?: Array<{ id: string }>;
  category?: { id: string };
}) {
  const objType =
    opts.type === 'SingleChoiceOrdinal'
      ? OBJECT_TYPE.SingleChoiceOrdinalQuestion
      : opts.type === 'SingleChoiceCategorical'
        ? OBJECT_TYPE.SingleChoiceCategoricalQuestion
        : OBJECT_TYPE.NumberQuestion;
  return {
    id: opts.id,
    objectType: objType,
    isMatchable: true,
    choices: opts.choices ?? [],
    category: opts.category ?? { id: 'cat-default' }
  } as never;
}

function makeFakeChild(opts: { id: string; entityAnswers: FakeAnswers }) {
  return {
    id: opts.id,
    entity: {
      getAnswer: (q: { id: string }) => opts.entityAnswers[q.id]
    }
  } as never;
}

function makeFakeOrgParent(opts: {
  id: string;
  ownAnswers: FakeAnswers;
  candidates: Array<ReturnType<typeof makeFakeChild>>;
}) {
  return {
    id: opts.id,
    objectType: OBJECT_TYPE.OrganizationNomination,
    answers: opts.ownAnswers,
    hasFactions: false,
    candidateNominations: opts.candidates,
    entity: {
      getAnswer: (q: { id: string }) => opts.ownAnswers[q.id]
    }
  } as never;
}

function makeFakeAllianceParent(opts: {
  id: string;
  ownAnswers: FakeAnswers;
  orgs: Array<ReturnType<typeof makeFakeOrgParent>>;
}) {
  return {
    id: opts.id,
    objectType: OBJECT_TYPE.AllianceNomination,
    answers: opts.ownAnswers,
    organizationNominations: opts.orgs,
    entity: {
      getAnswer: (q: { id: string }) => opts.ownAnswers[q.id]
    }
  } as never;
}

// --- Tests ---

describe('imputeParentAnswers', () => {
  describe('Risk #7 backward-compat (childProxies omitted)', () => {
    it('returns proxies whose imputed answers match the median of child entity-answers for ordinal questions', () => {
      const q = makeFakeQuestion({
        id: 'q1',
        type: 'SingleChoiceOrdinal',
        choices: [{ id: 'c0' }, { id: 'c1' }, { id: 'c2' }, { id: 'c3' }, { id: 'c4' }]
      });
      const children = [
        makeFakeChild({ id: 'cand1', entityAnswers: { q1: { value: 'c0' } } }),
        makeFakeChild({ id: 'cand2', entityAnswers: { q1: { value: 'c2' } } }),
        makeFakeChild({ id: 'cand3', entityAnswers: { q1: { value: 'c4' } } })
      ];
      const parent = makeFakeOrgParent({
        id: 'org1',
        ownAnswers: {}, // org has no own answers — pure impute path
        candidates: children
      });

      const proxies = imputeParentAnswers({ nominations: [parent], questions: [q] });

      expect(proxies).toHaveLength(1);
      expect(proxies[0]).toBeInstanceOf(MatchingProxy);
      // median of indices [0, 2, 4] -> 2 -> choice id 'c2'
      expect(proxies[0].answers['q1']?.value).toBe('c2');
    });

    it('does not write to the parent entity when imputing (proxy-only mutation)', () => {
      const q = makeFakeQuestion({ id: 'q1', type: 'Number' });
      const children = [
        makeFakeChild({ id: 'cand1', entityAnswers: { q1: { value: 5 } } }),
        makeFakeChild({ id: 'cand2', entityAnswers: { q1: { value: 7 } } })
      ];
      // Bind ownAnswers BEFORE constructing the parent so we can reference it after the call
      // without going through parent.answers (which is typed `never` due to the synthetic-fixture
      // cast and would trip svelte-check).
      const ownAnswers: FakeAnswers = {};
      const parent = makeFakeOrgParent({ id: 'org1', ownAnswers, candidates: children });
      const ownAnswersBefore = { ...ownAnswers };
      imputeParentAnswers({ nominations: [parent], questions: [q] });
      // The function must not write to the parent entity's answers; only the returned proxy
      // object holds the imputed values. Compare via the bound ownAnswers reference.
      expect(ownAnswers).toEqual(ownAnswersBefore);
    });

    it('skips parents whose own answer is already present (matchableQuestions filter)', () => {
      const q = makeFakeQuestion({ id: 'q1', type: 'Number' });
      const children = [makeFakeChild({ id: 'cand1', entityAnswers: { q1: { value: 99 } } })];
      const parent = makeFakeOrgParent({
        id: 'org1',
        ownAnswers: { q1: { value: 1 } }, // own answer present -> q1 should NOT be re-imputed
        candidates: children
      });
      const proxies = imputeParentAnswers({ nominations: [parent], questions: [q] });
      // proxy.answers should retain the parent's own answer (1) — not the imputed
      // child median (99). The matchableQuestions filter excludes q1 because the
      // parent already has an answer for it.
      expect(proxies[0].answers['q1']?.value).toBe(1);
    });
  });

  describe('cascade (childProxies provided)', () => {
    it('reads child answers from the proxy map when a proxy entry exists', () => {
      const q = makeFakeQuestion({ id: 'q1', type: 'Number' });
      // Children's ENTITY answers say 99; the proxy map says 5 / 7 — proxy should win
      const child1 = makeFakeChild({ id: 'org-child-1', entityAnswers: { q1: { value: 99 } } });
      const child2 = makeFakeChild({ id: 'org-child-2', entityAnswers: { q1: { value: 99 } } });

      const childProxies = new Map<string, MatchingProxy<never>>();
      childProxies.set('org-child-1', new MatchingProxy(child1 as never, { q1: { value: 5 } } as never));
      childProxies.set('org-child-2', new MatchingProxy(child2 as never, { q1: { value: 7 } } as never));

      const allianceParent = makeFakeAllianceParent({
        id: 'all1',
        ownAnswers: {},
        orgs: [child1 as never, child2 as never]
      });

      const proxies = imputeParentAnswers({
        nominations: [allianceParent],
        questions: [q],
        childProxies: childProxies as never
      });

      // median of [5, 7] from proxy reads = 6 (NumberQuestion median, even count -> average);
      // not 99 (entity reads).
      expect(proxies[0].answers['q1']?.value).toBe(6);
    });

    it('falls back to entity reads when a child has no entry in childProxies', () => {
      const q = makeFakeQuestion({ id: 'q1', type: 'Number' });
      const child1 = makeFakeChild({ id: 'org-child-1', entityAnswers: { q1: { value: 4 } } });
      const child2 = makeFakeChild({ id: 'org-child-2', entityAnswers: { q1: { value: 8 } } });
      // Only child1 has a proxy; child2 falls through to entity read
      const childProxies = new Map<string, MatchingProxy<never>>();
      childProxies.set('org-child-1', new MatchingProxy(child1 as never, { q1: { value: 100 } } as never));

      const allianceParent = makeFakeAllianceParent({
        id: 'all1',
        ownAnswers: {},
        orgs: [child1 as never, child2 as never]
      });

      const proxies = imputeParentAnswers({
        nominations: [allianceParent],
        questions: [q],
        childProxies: childProxies as never
      });

      // median of [100 (proxy), 8 (entity fallback)] = 54 (even count -> average)
      expect(proxies[0].answers['q1']?.value).toBe(54);
    });
  });

  describe('Alliance parent type (Phase 69 new branch)', () => {
    it('reads parent.organizationNominations as children when parent is an AllianceNomination', () => {
      const q = makeFakeQuestion({ id: 'q1', type: 'Number' });
      const orgChild1 = makeFakeOrgParent({
        id: 'org1',
        ownAnswers: { q1: { value: 10 } }, // org owns an answer
        candidates: []
      });
      const orgChild2 = makeFakeOrgParent({
        id: 'org2',
        ownAnswers: { q1: { value: 20 } },
        candidates: []
      });

      const allianceParent = makeFakeAllianceParent({
        id: 'all1',
        ownAnswers: {}, // alliance has NO own answer
        orgs: [orgChild1, orgChild2]
      });

      const proxies = imputeParentAnswers({
        nominations: [allianceParent],
        questions: [q]
        // childProxies omitted -> entity reads from org-child .entity.getAnswer
      });

      // median of [10, 20] = 15 (even count -> average)
      expect(proxies[0].answers['q1']?.value).toBe(15);
    });
  });
});
