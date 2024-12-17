import { expect, test } from 'vitest';
import {
  Candidate,
  ENTITY_TYPE,
  isMissingValue,
  NumberQuestion,
  parseEntityTree,
  parseNominationTree
} from '../../../internal';
import { getTestData, getTestDataRoot, parseNestedNominations } from '../../../testUtils';

/**
 * We do not test implicit entities implied in the nomination data in this test file.
 */

const root = getTestDataRoot();
const data = getTestData();
const entityData = parseEntityTree(data.entities);

test('Should have all explicit entities', () => {
  entityData.forEach(({ type, id }) => {
    const obj = root.getEntity(type, id);
    expect(obj.id).toBe(id);
  });
});

test('Should return nominations for explicit entities', () => {
  const nominations = parseNestedNominations(parseNominationTree(data.nominations));
  entityData.forEach(({ type, id }) => {
    const obj = root.getEntity(type, id);
    const nomCount = nominations.filter((n) => n.entityType === type && n.entityId === id).length;
    expect(obj.nominations.length, `Entity: ${type}, ${id}`).toEqual(nomCount);
  });
});

test('Should return answers and getAnswer to be defined for provided answers', () => {
  const objects = [
    ...(root.alliances ?? []),
    ...(root.candidates ?? []),
    ...(root.factions ?? []),
    ...(root.organizations ?? [])
  ];
  // Double-check that we go through all explicit entities
  let count = 0;
  objects.forEach((obj) => {
    const objData = entityData.find((d) => d.type === obj.type && d.id === obj.id);
    if (objData) {
      count++;
      expect(obj.answers).toEqual(objData.answers);
    } else {
      expect(obj.answers).toEqual({});
    }
    root.questions!.forEach((q) => {
      const value = objData?.answers?.[q.id]?.value;
      if (!isMissingValue(value)) expect(obj.getAnswer(q)).toBeDefined();
      else expect(obj.getAnswer(q)).toBeUndefined();
    });
  });
  expect(count).toBe(entityData.length);
});

test('Should get formatted answer', () => {
  // Get a copy, bc we set the locale
  const root = getTestDataRoot();
  root.locale = 'en-US';
  const candidate = root.candidates![0];
  if (!candidate) throw new Error('Test-setup error: No candidate found');
  candidate.data.answers ??= {};
  // Test with just one question. The other ones are covered by dataRoot.test.ts
  const numberQuestion = new NumberQuestion({
    data: {
      type: 'number',
      name: 'Percentage',
      categoryId: 'X',
      id: 'question-number',
      format: {
        style: 'percent'
      }
    },
    root
  });
  candidate.data.answers!['question-number'] = { value: 0.5 };
  expect(candidate.getFormattedAnswer({ question: numberQuestion })).toBe('50%');
});

test('Should return answeredQuestions', () => {
  const candidate = new Candidate({
    root,
    data: {
      id: 'new-candidate',
      firstName: 'Candidate',
      lastName: 'Candidate',
      type: ENTITY_TYPE.Candidate,
      answers: {
        'question-1': { value: 'Answer 1' },
        // The ones below should not be included in answeredQuestions
        'question-2': null,
        'question-3': { value: undefined }
      }
    }
  });
  expect(candidate.answeredQuestions.map((q) => q.id)).toEqual(['question-1']);
});
