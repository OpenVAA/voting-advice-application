import { describe, expect, test } from 'vitest';
import { DataRoot, QuestionTemplate, OBJECT_TYPE } from '../../../internal';
import type { QuestionTemplateData } from '../../../internal';

const LIKERT_CHOICES = [
  { id: '1', label: 'Strongly disagree', normalizableValue: 1 },
  { id: '2', label: 'Disagree', normalizableValue: 2 },
  { id: '3', label: 'Neutral', normalizableValue: 3 },
  { id: '4', label: 'Agree', normalizableValue: 4 },
  { id: '5', label: 'Strongly agree', normalizableValue: 5 }
];

const minimalData: QuestionTemplateData = {
  id: 'template-1',
  name: 'Basic Text Template',
  type: 'text'
};

const fullData: QuestionTemplateData = {
  id: 'template-2',
  name: '5-point Likert Scale',
  type: 'singleChoiceOrdinal',
  settings: { minValue: 1, maxValue: 5 },
  defaultChoices: LIKERT_CHOICES,
  info: 'A standard 5-point Likert scale for opinion questions',
  order: 1
};

describe('QuestionTemplate', () => {
  test('Test 1: Can be created with minimal data and provides correct defaults', () => {
    const root = new DataRoot();
    root.provideQuestionTemplateData([minimalData]);
    const template = root.getQuestionTemplate('template-1');

    expect(template).toBeInstanceOf(QuestionTemplate);
    expect(template.id).toBe('template-1');
    expect(template.name).toBe('Basic Text Template');
    expect(template.type).toBe('text');
    expect(template.settings).toEqual({});
    expect(template.defaultChoices).toEqual([]);
  });

  test('Test 2: With full data exposes all properties correctly', () => {
    const root = new DataRoot();
    root.provideQuestionTemplateData([fullData]);
    const template = root.getQuestionTemplate('template-2');

    expect(template.id).toBe('template-2');
    expect(template.name).toBe('5-point Likert Scale');
    expect(template.type).toBe('singleChoiceOrdinal');
    expect(template.settings).toEqual({ minValue: 1, maxValue: 5 });
    expect(template.defaultChoices).toEqual(LIKERT_CHOICES);
    expect(template.defaultChoices).toHaveLength(5);
    expect(template.defaultChoices[0].normalizableValue).toBe(1);
    expect(template.info).toBe('A standard 5-point Likert scale for opinion questions');
    expect(template.order).toBe(1);
  });

  test('Test 3: objectType equals questionTemplate', () => {
    const root = new DataRoot();
    root.provideQuestionTemplateData([minimalData]);
    const template = root.getQuestionTemplate('template-1');

    expect(template.objectType).toBe('questionTemplate');
    expect(template.objectType).toBe(OBJECT_TYPE.QuestionTemplate);
  });

  test('Test 4: DataRoot.questionTemplates returns empty array before provision', () => {
    const root = new DataRoot();
    expect(root.questionTemplates).toEqual([]);
  });

  test('Test 5: DataRoot.provideQuestionTemplateData adds templates accessible via collection and getter', () => {
    const root = new DataRoot();
    root.provideQuestionTemplateData([minimalData, fullData]);

    expect(root.questionTemplates).toHaveLength(2);
    expect(root.getQuestionTemplate('template-1').name).toBe('Basic Text Template');
    expect(root.getQuestionTemplate('template-2').name).toBe('5-point Likert Scale');
  });

  test('Test 6: QuestionTemplate inherits DataObject defaults', () => {
    const root = new DataRoot();
    const bareData: QuestionTemplateData = {
      id: 'template-bare',
      type: 'boolean'
    };
    root.provideQuestionTemplateData([bareData]);
    const template = root.getQuestionTemplate('template-bare');

    // DataObject defaults
    expect(template.name).toBe('');
    expect(template.info).toBe('');
    expect(template.order).toBe(Infinity);
    expect(template.color).toBeNull();
    expect(template.image).toBeNull();
    expect(template.customData).toEqual({});
    expect(template.isGenerated).toBe(false);
    expect(template.subtype).toBe('');
    expect(template.shortName).toBe(''); // defaults to name when no shortName set
  });
});
