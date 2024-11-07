import { expect, test } from 'vitest';
import { parseNominationTree } from './variants';
import { getTestData } from '../../../testUtils';

test('ParseNominationTree should insert election and constituencyId to all items', () => {
  const tree = getTestData().nominations;
  const nominationData = parseNominationTree(tree);
  nominationData.forEach((d) => {
    expect(d.electionId).toBeDefined();
    expect(d.constituencyId).toBeDefined();
  });
});
