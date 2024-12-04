import { type AnyEntityVariantData, type AnyNominationVariantPublicData, ENTITY_TYPE } from '@openvaa/data';
import { describe, expect, test } from 'vitest';
import { filterEntitiesByNomination, parseEntitiesFromNominations } from './filterEntitiesByNomination';

const nominations: Array<AnyNominationVariantPublicData> = [
  {
    entityType: ENTITY_TYPE.Alliance,
    entityId: 'alliance1',
    electionId: 'e',
    constituencyId: 'c',
    organizations: [
      {
        entityId: 'org1',
        factions: [
          {
            entityId: 'faction1',
            candidates: [{ entityId: 'candidate1' }, { entityId: 'candidate2' }]
          }
        ]
      }
    ]
  },
  {
    entityType: ENTITY_TYPE.Candidate,
    entityId: 'candidate3',
    electionId: 'e',
    constituencyId: 'c'
  }
];

describe('parseEntitiesFromNominations', () => {
  test('Should correctly parse multiple levels of nested entities', () => {
    const result = parseEntitiesFromNominations(nominations);
    expect(result).toEqual([
      [ENTITY_TYPE.Alliance, 'alliance1'],
      [ENTITY_TYPE.Organization, 'org1'],
      [ENTITY_TYPE.Faction, 'faction1'],
      [ENTITY_TYPE.Candidate, 'candidate1'],
      [ENTITY_TYPE.Candidate, 'candidate2'],
      [ENTITY_TYPE.Candidate, 'candidate3']
    ]);
  });
  test('should throw an error when a nomination lacks both entityType and nestedType', () => {
    const invalidNomination = [{ entityId: '123' }];
    expect(() => parseEntitiesFromNominations(invalidNomination)).toThrow();
  });
});

describe('filterEntitiesByNomination', () => {
  const entities: Array<AnyEntityVariantData> = [
    { type: ENTITY_TYPE.Candidate, id: 'candidate1', firstName: 'A', lastName: 'B' },
    { type: ENTITY_TYPE.Candidate, id: 'candidate_dontInclude', firstName: 'A', lastName: 'B' },
    { type: ENTITY_TYPE.Organization, id: 'org1', name: 'A' },
    { type: ENTITY_TYPE.Organization, id: 'org_dontInclude', name: 'A' },
    { type: ENTITY_TYPE.Faction, id: 'org_dontInclude' },
    { type: ENTITY_TYPE.Alliance, id: 'alliance1' }
  ];
  const originalEntities = [...entities];
  const originalNominations = [...nominations];
  const result = filterEntitiesByNomination({ entities, nominations });

  test('Should correctly filter entities when only some match the nominations', () => {
    expect(result).toEqual([
      { type: ENTITY_TYPE.Candidate, id: 'candidate1', firstName: 'A', lastName: 'B' },
      { type: ENTITY_TYPE.Organization, id: 'org1', name: 'A' },
      { type: ENTITY_TYPE.Alliance, id: 'alliance1' }
    ]);
  });
  test('Should not modify the original entities or nominations arrays', () => {
    expect(entities).toEqual(originalEntities);
    expect(nominations).toEqual(originalNominations);
  });
});
