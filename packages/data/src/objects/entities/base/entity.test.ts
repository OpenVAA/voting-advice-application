import { describe, expect, test } from 'vitest';
import {
  DateQuestion,
  isMissingValue,
  MultipleChoiceCategoricalQuestion,
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

describe('Should format answers correctly', () => {
  // Get a copy, bc we set the locale
  const root = getTestDataRoot();
  root.locale = 'en-US';
  const candidate = root.candidates![0];
  if (!candidate) throw new Error('Test-setup error: No candidate found');
  candidate.data.answers ??= {};

  test('Should format number answer correctly', () => {
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
    expect(candidate.getFormattedAnswer(numberQuestion)).toBe('50%');
  });

  test('Should format date answer correctly', () => {
    const dateQuestion = new DateQuestion({
      data: {
        type: 'date',
        name: 'Date',
        categoryId: 'X',
        id: 'question-date',
        format: {
          year: '2-digit',
          month: 'long',
          day: '2-digit'
        }
      },
      root
    });
    candidate.data.answers!['question-date'] = { value: new Date(2023, 9, 5) };
    expect(candidate.getFormattedAnswer(dateQuestion)).toBe('October 05, 23');
  });

  test('Should format multiple choice answer correctly', () => {
    const multiQuestion = new MultipleChoiceCategoricalQuestion({
      data: {
        type: 'multipleChoiceCategorical',
        name: 'Multi',
        categoryId: 'X',
        id: 'question-multi',
        choices: [
          { id: 'choice-1', label: 'Choice 1' },
          { id: 'choice-2', label: '  Choice 2' },
          { id: 'choice-3', label: '  Choice 3  ' }
        ]
      },
      root
    });
    candidate.data.answers!['question-multi'] = { value: ['choice-3', 'choice-1', 'choice-2'] };
    expect(candidate.getFormattedAnswer(multiQuestion), 'To trim whitespace from labels and concatenate').toBe(
      'Choice 3, Choice 1, Choice 2'
    );
  });
});
