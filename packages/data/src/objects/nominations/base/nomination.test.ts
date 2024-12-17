import { expect, test } from 'vitest';
import { parseNominationTree } from '../../../internal';
import { getTestData, getTestDataRoot, parseNestedNominations } from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();
const nominationData = parseNestedNominations(parseNominationTree(data.nominations));
const objects = [
  ...(root.allianceNominations ?? []),
  ...(root.candidateNominations ?? []),
  ...(root.factionNominations ?? []),
  ...(root.organizationNominations ?? [])
];

test('Should have all nominations', () => {
  expect(objects.length).toBe(nominationData.length);
});

test('Should have all explicit entity nominations', () => {
  nominationData
    .filter((n) => !!n.entityId)
    .forEach(({ entityType, entityId, electionId, constituencyId }) => {
      const noms = root.findNominations({ entityType, entityId, electionId, constituencyId });
      expect(noms?.length).toBeGreaterThanOrEqual(1);
      expect(noms![0].entity.id).toBe(entityId);
    });
});

test('Nominations should have ids', () => {
  expect(objects.some((o) => !o.id)).toBe(false);
});

test('Nominations should have associated entities', () => {
  expect(objects.some((o) => !o.entity)).toBe(false);
});

test('Nominations should have correct basic data (nomination relations are checked in the subclass tests)', () => {
  for (const { entityType, entityId, electionId, constituencyId } of nominationData) {
    // If entityId is missing, we'll find multiple nominations
    const noms = root.findNominations({ entityType, entityId, electionId, constituencyId });
    expect(noms?.length).toBeGreaterThanOrEqual(1);
    noms?.forEach((n) => {
      expect(n.entity.type).toBe(entityType);
      expect(n.election.id).toBe(electionId);
      expect(n.constituency.id).toBe(constituencyId);
    });
  }
});

test('Name and shortName getters should default to entity properties', () => {
  const nom = getTestDataRoot().factionNominations![0];
  if (!nom) throw new Error('Test setup error: no faction nominations in test data');
  nom.data.name = undefined;
  nom.data.shortName = '';
  nom.entity.data.name = 'Faction name';
  nom.entity.data.shortName = 'Faction shortName';
  expect(nom.name).toBe('Faction name');
  expect(nom.shortName).toBe('Faction shortName');
  nom.data.name = 'Nomination name';
  expect(nom.name).toBe('Nomination name');
  expect(nom.shortName, 'Shortname to return nomination name if defined').toBe('Nomination name');
  nom.data.shortName = 'Nomination shortName';
  expect(nom.shortName).toBe('Nomination shortName');
});

test('Should return applicableQuestions', () => {
  const nom = root
    .getAlliance('alliance-1')
    .nominations.find((n) => n.election.id === 'election-1' && n.constituency.id === 'constituency-1-1');
  if (!nom) throw new Error('Test setup error: the correct alliance nomination not found in test data');
  // The rest of the questions apply to different elections or entityTypes directly or via their categories
  const questionIds = [1, 2, 9, 11, 12, 13].map((i) => `question-${i}`);
  expect(nom.applicableQuestions.map((q) => q.id)).toEqual(expect.arrayContaining(questionIds));
});
