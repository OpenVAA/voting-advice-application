import { describe, expect, test } from 'vitest';
import { DataObject, DataRoot, parseFullVaaData } from '../internal';
import { getTestData } from '../testUtils';

const data = getTestData();
const unparsed = new DataRoot({ data });
const parsed = new DataRoot({ data: parseFullVaaData(data) });
const collections: Array<keyof DataRoot> = [
  'allianceNominations',
  'alliances',
  'candidateNominations',
  'candidates',
  'constituencies',
  'constituencyGroups',
  'elections',
  'factionNominations',
  'factions',
  'organizationNominations',
  'organizations',
  'questionCategories',
  'questions'
];

describe('parseFullVaaData', () => {
  test.each(collections)(
    'DataRoot collection %s populated with parsed and unparsed data should be equal',
    (collection) => {
      const a = unparsed[collection] as Array<DataObject> | undefined;
      const b = parsed[collection] as Array<DataObject> | undefined;
      expect(a?.map((o) => o.id)).toEqual(b?.map((o) => o.id));
    }
  );
});
