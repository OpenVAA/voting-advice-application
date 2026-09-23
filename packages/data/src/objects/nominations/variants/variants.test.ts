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

  // Non-vacuity guard on the DERIVATION itself. Without it an empty fixture would make `expectedCount` 0, and `toHaveLength(0)` would be satisfied by a parse that returned nothing — re-opening the exact hole the length assertion exists to close. Do not remove this line.
  expect(expectedCount).toBeGreaterThan(0);
  expect(nominationData).toHaveLength(expectedCount);

  const electionIds = Object.keys(tree);
  nominationData.forEach((d) => {
    // Membership, not definedness: a nomination carrying a defined-but-wrong id is exactly the regression the previous mere-definedness check could not see.
    //
    // The election-id assertion is also the GUARD for the dereference on the line below it, and both properties are load-bearing: it must stay FIRST and it must stay a hard `expect`.
    // When an id is wrong, `tree[d.electionId]` is `undefined`, so a soft or reordered assertion would surface the regression as a `TypeError` on the wrong axis instead of as this assertion failing. Do not "tidy" these two lines into one soft block.
    expect(electionIds).toContain(d.electionId);
    expect(Object.keys(tree[d.electionId])).toContain(d.constituencyId);
  });
});
