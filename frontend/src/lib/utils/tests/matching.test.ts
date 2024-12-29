import { MISSING_VALUE } from '@openvaa/core';
import { expect, test } from 'vitest';
import { MockCandidate, MockParty } from './mock-objects';
import { imputePartyAnswers, mean, median } from '../legacy-matching';

test('Mean and median', () => {
  expect(mean([1, 2, 2, 2, 10]), 'Mean').toEqual((1 + 2 + 2 + 2 + 10) / 5);
  expect(median([1, 2, 2, 2, 10]), 'Median').toEqual(2);
  expect(median([1, 2, 3, 10]), 'Median with even number of items').toEqual(2.5);
  expect(() => mean([]), 'Mean should throw on empty list').toThrow();
  expect(() => median([]), 'Mean should throw on empty list').toThrow();
});

test('Impute party answers', () => {
  const partyA = new MockParty('partyA', { q1: { value: 1 } });
  const partyB = new MockParty('partyB');
  const candidates: Array<LegacyCandidateProps> = [];
  for (let i = 1; i < 5; i++) {
    const answers = {
      q1: { value: i },
      q2: { value: i },
      q3: { value: MISSING_VALUE }
    };
    candidates.push(new MockCandidate(`candidate_a_${i}`, partyA, answers));
  }
  // Add one more to make median and mean diverge
  candidates.push(
    new MockCandidate('candidate_a_5', partyA, {
      q1: { value: 10 },
      q2: { value: 10 },
      q3: { value: MISSING_VALUE }
    })
  );
  for (let i = 1; i < 5; i++) {
    const answers = {
      q1: { value: 4 },
      q2: { value: 4 },
      q3: { value: 4 }
    };
    candidates.push(new MockCandidate(`candidate_b_${i}`, partyB, answers));
  }
  const qids = ['q1', 'q2', 'q3'];
  const imputedMean = imputePartyAnswers(partyA, candidates, qids, 'mean');
  expect(imputedMean.q1.value, 'Explicit party answer should not be imputed').toEqual(1);
  expect(imputedMean.q2.value, 'Mean').toEqual((1 + 2 + 3 + 4 + 10) / 5);
  expect(imputedMean.q3.value, 'Missing answer').toEqual(MISSING_VALUE);
  const imputedMedian = imputePartyAnswers(partyA, candidates, qids, 'median');
  expect(imputedMedian.q2.value, 'Median').toEqual(3);
  expect(
    () => imputePartyAnswers(partyA, candidates, qids, 'foo' as 'mean'),
    'Illegal imputation method should throw'
  ).toThrow();
});
