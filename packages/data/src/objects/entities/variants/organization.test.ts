import { expect, test } from 'vitest';
import { ENTITY_TYPE, parseEntityTree, parseNominationTree, removeDuplicates } from '../../../internal';
import { getTestData, getTestDataRoot, parseNestedNominations } from '../../../testUtils';
import { contentsMatch } from '../../../testUtils/contentsMatch';

const root = getTestDataRoot();
const data = getTestData();
const entityData = parseEntityTree(data.entities);
const orgEntityData = entityData.filter((d) => d.type === ENTITY_TYPE.Organization);
const cndEntityData = entityData.filter((d) => d.type === ENTITY_TYPE.Candidate);
const nominationData = parseNestedNominations(parseNominationTree(data.nominations));
const orgNominationData = nominationData.filter((d) => d.entityType === ENTITY_TYPE.Organization);
const allNominationData = nominationData.filter((d) => d.entityType === ENTITY_TYPE.Alliance);
const facNominationData = nominationData.filter((d) => d.entityType === ENTITY_TYPE.Faction);

test('Should have all explicit organizations and their data and nominations', () => {
  orgEntityData.forEach((objData) => {
    const obj = root.getEntity(ENTITY_TYPE.Organization, objData.id);
    expect(obj.id, 'To have entity').toBe(objData.id);
    if (objData.name) expect(obj.name, 'To return name').toBe(objData.name);
    if (objData.shortName) expect(obj.shortName, 'To return shortName').toBe(objData.shortName);

    // Member candidates
    const memCandidateIds = cndEntityData.filter((c) => c.organizationId === objData.id).map((c) => c.id);
    expect(
      contentsMatch(
        obj.memberCandidates.map((c) => c.id),
        memCandidateIds
      ),
      'To have member candidates'
    ).toBe(true);

    // Nominated candidates
    const nomCandidateIds = removeDuplicates(
      orgNominationData
        .filter((n) => n.entityId === objData.id)
        .flatMap((n) => n.candidates ?? [])
        .map((c) => c.entityId)
    );
    expect(
      contentsMatch(
        obj.nominatedCandidates.map((c) => c.id),
        nomCandidateIds
      ),
      'To have nominated candidates'
    ).toBe(true);

    // Alliances
    const allianceCount =
      allNominationData.filter((a) => a.organizations.map((o) => o.entityId).includes(objData.id))?.length ?? 0;
    expect(obj.alliances.length, 'To belong to a correct number of alliances').toBe(allianceCount);

    // Factions
    const factions = new Set<string>();
    facNominationData
      .filter((f) => f.parent?.entityId === objData.id)
      .forEach((f) => {
        const uid = f.entityId ?? f.entityPseudoId;
        if (!uid) throw new Error('Faction nomination is missing an entity or pseudo id!');
        factions.add(uid);
      });
    expect(obj.factions.length, 'To have a correct number of factions').toBe(factions.size);
  });
});
