import { expect, test } from 'vitest';
import { parseNominationTree } from './variants';
import { getTestData } from '../../../testUtils';

test('ParseNominationTree should return one item per tree leaf, each carrying its own election and constituency id', () => {
  const tree = getTestData().nominations;
  const nominationData = parseNominationTree(tree);

  // The expected count is DERIVED from the fixture tree, never hard-coded: `parseNominationTree` is a flat two-level walk, so it must yield exactly one item per nomination in the tree.
  // Model: the sibling test at `../base/nomination.test.ts:16`, which derives its expectation the same way rather than pinning a literal that drifts the moment the fixture changes.
  const expectedCount = Object.values(tree)
    .flatMap((byConstituency) => Object.values(byConstituency))
    .reduce((count, nominations) => count + nominations.length, 0);

  // Without this guard an empty fixture would make `expectedCount` 0, and `toHaveLength(0)` would pass on a parse that returned nothing.
  expect(expectedCount).toBeGreaterThan(0);
  expect(nominationData).toHaveLength(expectedCount);

  const electionIds = Object.keys(tree);
  nominationData.forEach((d) => {
    // Membership, not definedness: a nomination with a defined but wrong id must fail.
    //
    // The election-id assertion is also the GUARD for the dereference on the line below it, and both properties are load-bearing: it must stay FIRST and it must stay a hard `expect`.
    // A wrong id makes `tree[d.electionId]` `undefined`, so these two assertions stay hard and in this order: a wrong id then fails here rather than as a `TypeError`.
    expect(electionIds).toContain(d.electionId);
    expect(Object.keys(tree[d.electionId])).toContain(d.constituencyId);
  });
});
