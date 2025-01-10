import { expect, test } from 'vitest';
import { defaultLocale, loadTranslations, locale, t } from '$lib/i18n';
import { MockCandidate, MockParty, MockQuestionCategory } from './mock-objects';
import { DATE_FORMATS, getAnswer, getAnswerForDisplay, getLikertAnswer } from '../legacy-answers';

const DATE = new Date();

/** Make unique labels */
function makeLabels(count = 4) {
  const labels: Array<LegacyAnswerOption> = [];
  for (let i = 1; i < count + 1; i++) {
    labels.push({
      key: i,
      label: `Label ${Math.random()}`
    });
  }
  return labels;
}

const category = new MockQuestionCategory('c1');

const QST: Record<string, LegacyQuestionProps> = {
  Likert: {
    id: '1',
    text: 'X',
    shortName: 'X',
    type: 'singleChoiceOrdinal',
    values: makeLabels(),
    entityType: 'candidate',
    category
  },
  SingleCategorical: {
    id: '2',
    text: 'X',
    shortName: 'X',
    type: 'singleChoiceCategorical',
    values: makeLabels(),
    entityType: 'candidate',
    category
  },
  MultiCategorical: {
    id: '3',
    text: 'X',
    shortName: 'X',
    type: 'multipleChoiceCategorical',
    values: makeLabels(),
    entityType: 'candidate',
    category
  },
  PrefOrder: {
    id: '4',
    text: 'X',
    shortName: 'X',
    type: 'preferenceOrder',
    values: makeLabels(),
    entityType: 'candidate',
    category
  },
  Date: {
    id: '5',
    text: 'X',
    shortName: 'X',
    type: 'date',
    dateType: 'monthDay',
    entityType: 'candidate',
    category
  },
  Boolean: {
    id: '6',
    text: 'X',
    shortName: 'X',
    type: 'boolean',
    entityType: 'candidate',
    category
  },
  Text: {
    id: '7',
    text: 'X',
    shortName: 'X',
    type: 'text',
    entityType: 'candidate',
    category
  },
  Number: {
    id: '8',
    text: 'X',
    shortName: 'X',
    type: 'number',
    entityType: 'candidate',
    category
  },
  Missing: {
    id: '900',
    text: 'X',
    shortName: 'X',
    type: 'multipleChoiceCategorical',
    entityType: 'candidate',
    category
  },
  EmptyMultiCategorical: {
    id: '901',
    text: 'X',
    shortName: 'X',
    type: 'multipleChoiceCategorical',
    values: makeLabels(),
    entityType: 'candidate',
    category
  }
};

category.questions = Object.values(QST);

const ANS: Record<string, LegacyAnswerProps & { questionId: string }> = {
  Likert: {
    questionId: QST.Likert.id,
    value: 1,
    openAnswer: 'OpenAnswer'
  },
  SingleCategorical: {
    questionId: QST.SingleCategorical.id,
    value: 1
  },
  MultiCategorical: {
    questionId: QST.MultiCategorical.id,
    value: [1, 2]
  },
  PrefOrder: {
    questionId: QST.PrefOrder.id,
    value: [1, 2]
  },
  Date: {
    questionId: QST.Date.id,
    value: DATE
  },
  Boolean: {
    questionId: QST.Boolean.id,
    value: true
  },
  Text: {
    questionId: QST.Text.id,
    value: 'Text'
  },
  Number: {
    questionId: QST.Number.id,
    value: 10
  },
  EmptyMultiCategorical: {
    questionId: QST.EmptyMultiCategorical.id,
    value: []
  }
};

const answers = {} as LegacyAnswerDict;
Object.values(ANS).forEach(({ questionId, value, openAnswer }) => (answers[questionId] = { value, openAnswer }));

const CND = new MockCandidate('1', new MockParty('p1'), answers);

test('getAnswer', () => {
  expect(getAnswer(CND, QST.Likert)?.value, 'Has answer').toEqual(ANS.Likert.value);
  expect(getAnswer(CND, QST.Likert)?.openAnswer, 'Has open answer').toEqual(ANS.Likert.openAnswer);
  expect(getAnswer(CND, QST.Missing)?.value, 'Missing answer').toBeUndefined();
});

test('getLikertAnswer', () => {
  expect(getLikertAnswer(CND, QST.Likert)?.value, 'Has Likert answer').toEqual(ANS.Likert.value);
  expect(getLikertAnswer(CND, QST.Text)?.value, 'Not a Likert question').toBeUndefined();
});

test('getAnswerForDisplay', async () => {
  expect(getAnswerForDisplay(CND, QST.Likert), 'Display Likert answer').toEqual(
    QST.Likert.values?.find((a) => a.key === ANS.Likert.value)?.label
  );
  expect(getAnswerForDisplay(CND, QST.SingleCategorical), 'Display SingleCategorical answer').toEqual(
    QST.SingleCategorical.values?.find((a) => a.key === ANS.SingleCategorical.value)?.label
  );
  expect(getAnswerForDisplay(CND, QST.MultiCategorical), 'Display MultiCategorical answer').toEqual(
    (ANS.MultiCategorical.value as Array<number>).map(
      (a) => QST.MultiCategorical.values?.find((v) => v.key === a)?.label
    )
  );
  expect(getAnswerForDisplay(CND, QST.PrefOrder), 'Display PrefOrder answer').toEqual(
    (ANS.PrefOrder.value as Array<number>).map((a) => QST.PrefOrder.values?.find((v) => v.key === a)?.label)
  );
  expect(getAnswerForDisplay(CND, QST.Date), 'Display Date answer').toEqual(
    DATE.toLocaleDateString(locale.get(), DATE_FORMATS[QST.Date.dateType as keyof typeof DATE_FORMATS])
  );
  // We need to init the translations
  await loadTranslations(defaultLocale, '');
  expect(getAnswerForDisplay(CND, QST.Boolean), 'Display Boolean answer').toEqual(
    t.get(ANS.Boolean.value ? 'common.answer.yes' : 'common.answer.no')
  );
  expect(getAnswerForDisplay(CND, QST.Text), 'Display Text answer').toEqual(ANS.Text.value);
  expect(getAnswerForDisplay(CND, QST.Number), 'Display Number answer').toStrictEqual(`${ANS.Number.value}`);
  expect(getAnswerForDisplay(CND, QST.Missing), 'Display missing answer').toBeUndefined();
  expect(getAnswerForDisplay(CND, QST.EmptyMultiCategorical), 'Display empty list answer').toBeUndefined();
});
