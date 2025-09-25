import { describe, expect, test } from 'vitest';
import { isObjectType, isQuestion, OBJECT_TYPE } from '../internal';
import { getTestDataRoot } from '../testUtils';

const dataRoot = getTestDataRoot();

describe('isObjectType', () => {
  test('Should return true when obj is a data object with matching objectType', () => {
    // Test alliances
    const alliance = dataRoot.alliances?.[0];
    if (!alliance) throw new Error('No alliance found in test data');
    expect(isObjectType(alliance, OBJECT_TYPE.Alliance)).toBe(true);

    // Test allianceNominations
    const allianceNomination = dataRoot.allianceNominations?.[0];
    if (!allianceNomination) throw new Error('No allianceNomination found in test data');
    expect(isObjectType(allianceNomination, OBJECT_TYPE.AllianceNomination)).toBe(true);

    // Test candidates
    const candidate = dataRoot.candidates?.[0];
    if (!candidate) throw new Error('No candidate found in test data');
    expect(isObjectType(candidate, OBJECT_TYPE.Candidate)).toBe(true);

    // Test candidateNominations
    const candidateNomination = dataRoot.candidateNominations?.[0];
    if (!candidateNomination) throw new Error('No candidateNomination found in test data');
    expect(isObjectType(candidateNomination, OBJECT_TYPE.CandidateNomination)).toBe(true);

    // Test constituencies
    const constituency = dataRoot.constituencies?.[0];
    if (!constituency) throw new Error('No constituency found in test data');
    expect(isObjectType(constituency, OBJECT_TYPE.Constituency)).toBe(true);

    // Test constituencyGroups
    const constituencyGroup = dataRoot.constituencyGroups?.[0];
    if (!constituencyGroup) throw new Error('No constituencyGroup found in test data');
    expect(isObjectType(constituencyGroup, OBJECT_TYPE.ConstituencyGroup)).toBe(true);

    // Test elections
    const election = dataRoot.elections?.[0];
    if (!election) throw new Error('No election found in test data');
    expect(isObjectType(election, OBJECT_TYPE.Election)).toBe(true);

    // Test factions
    const faction = dataRoot.factions?.[0];
    if (!faction) throw new Error('No faction found in test data');
    expect(isObjectType(faction, OBJECT_TYPE.Faction)).toBe(true);

    // Test factionNominations
    const factionNomination = dataRoot.factionNominations?.[0];
    if (!factionNomination) throw new Error('No factionNomination found in test data');
    expect(isObjectType(factionNomination, OBJECT_TYPE.FactionNomination)).toBe(true);

    // Test organizations
    const organization = dataRoot.organizations?.[0];
    if (!organization) throw new Error('No organization found in test data');
    expect(isObjectType(organization, OBJECT_TYPE.Organization)).toBe(true);

    // Test organizationNominations
    const organizationNomination = dataRoot.organizationNominations?.[0];
    if (!organizationNomination) throw new Error('No organizationNomination found in test data');
    expect(isObjectType(organizationNomination, OBJECT_TYPE.OrganizationNomination)).toBe(true);

    // Test questionCategories
    const questionCategory = dataRoot.questionCategories?.[0];
    if (!questionCategory) throw new Error('No questionCategory found in test data');
    expect(isObjectType(questionCategory, OBJECT_TYPE.QuestionCategory)).toBe(true);
  });

  test('Should return false when obj is null', () => {
    const result = isObjectType(null, OBJECT_TYPE.Candidate);
    expect(result).toBe(false);
  });
});

test('isQuestion', () => {
  // Test questions
  const questions = dataRoot.questions;
  if (!questions.length) throw new Error('No questions found in test data');
  const result = questions.every((question) => isQuestion(question));
  expect(result).toBe(true);
});
