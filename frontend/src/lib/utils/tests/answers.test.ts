import {expect, test} from 'vitest';
import {t, locale, defaultLocale, loadTranslations} from '$lib/i18n';
import {getAnswer, getLikertAnswer, getAnswerForDisplay, DATE_FORMATS} from '../answers';

const DATE = new Date();

/** Make unique labels */
function makeLabels(count = 4) {
  const labels: ChoiceProps[] = [];
  for (let i = 1; i < count + 1; i++) {
    labels.push({
      key: i,
      label: `Label ${Math.random()}`
    });
  }
  return labels;
}

const QST: Record<string, QuestionProps> = {
  Likert: {
    id: '1',
    text: 'X',
    shortName: 'X',
    type: 'singleChoiceOrdinal',
    values: makeLabels()
  },
  SingleCategorical: {
    id: '2',
    text: 'X',
    shortName: 'X',
    type: 'singleChoiceCategorical',
    values: makeLabels()
  },
  MultiCategorical: {
    id: '3',
    text: 'X',
    shortName: 'X',
    type: 'multipleChoiceCategorical',
    values: makeLabels()
  },
  PrefOrder: {
    id: '4',
    text: 'X',
    shortName: 'X',
    type: 'preferenceOrder',
    values: makeLabels()
  },
  Date: {
    id: '5',
    text: 'X',
    shortName: 'X',
    type: 'date',
    dateType: 'monthDay'
  },
  Boolean: {
    id: '6',
    text: 'X',
    shortName: 'X',
    type: 'boolean'
  },
  Text: {
    id: '7',
    text: 'X',
    shortName: 'X',
    type: 'text'
  },
  Number: {
    id: '8',
    text: 'X',
    shortName: 'X',
    type: 'number'
  },
  Missing: {
    id: '900',
    text: 'X',
    shortName: 'X',
    type: 'multipleChoiceCategorical'
  },
  EmptyMultiCategorical: {
    id: '901',
    text: 'X',
    shortName: 'X',
    type: 'multipleChoiceCategorical',
    values: makeLabels()
  }
};

const ANS: Record<string, AnswerProps> = {
  Likert: {
    questionId: QST.Likert.id,
    answer: 1,
    openAnswer: 'OpenAnswer'
  },
  SingleCategorical: {
    questionId: QST.SingleCategorical.id,
    answer: 1
  },
  MultiCategorical: {
    questionId: QST.MultiCategorical.id,
    answer: [1, 2]
  },
  PrefOrder: {
    questionId: QST.PrefOrder.id,
    answer: [1, 2]
  },
  Date: {
    questionId: QST.Date.id,
    answer: DATE
  },
  Boolean: {
    questionId: QST.Boolean.id,
    answer: true
  },
  Text: {
    questionId: QST.Text.id,
    answer: 'Text'
  },
  Number: {
    questionId: QST.Number.id,
    answer: 10
  },
  EmptyMultiCategorical: {
    questionId: QST.EmptyMultiCategorical.id,
    answer: []
  }
};

const CND: CandidateProps = {
  electionRound: 1,
  firstName: 'John',
  lastName: 'Doe',
  id: '1',
  party: {
    name: 'X',
    shortName: 'X'
  },
  photo: 'X',
  answers: Object.values(ANS)
};

test('getAnswer', () => {
  expect(getAnswer(CND, QST.Likert).answer, 'Has answer').toEqual(ANS.Likert.answer);
  expect(getAnswer(CND, QST.Likert).openAnswer, 'Has open answer').toEqual(ANS.Likert.openAnswer);
  expect(getAnswer(CND, QST.Missing).answer, 'Missing answer').toBeUndefined();
});

test('getLikertAnswer', () => {
  expect(getLikertAnswer(CND, QST.Likert).answer, 'Has Likert answer').toEqual(ANS.Likert.answer);
  expect(getLikertAnswer(CND, QST.Text).answer, 'Not a Likert question').toBeUndefined();
});

test('getAnswerForDisplay', async () => {
  expect(getAnswerForDisplay(CND, QST.Likert), 'Display Likert answer').toEqual(
    QST.Likert.values?.find((a) => a.key === ANS.Likert.answer)?.label
  );
  expect(
    getAnswerForDisplay(CND, QST.SingleCategorical),
    'Display SingleCategorical answer'
  ).toEqual(
    QST.SingleCategorical.values?.find((a) => a.key === ANS.SingleCategorical.answer)?.label
  );
  expect(getAnswerForDisplay(CND, QST.MultiCategorical), 'Display MultiCategorical answer').toEqual(
    (ANS.MultiCategorical.answer as number[]).map(
      (a) => QST.MultiCategorical.values?.find((v) => v.key === a)?.label
    )
  );
  expect(getAnswerForDisplay(CND, QST.PrefOrder), 'Display PrefOrder answer').toEqual(
    (ANS.PrefOrder.answer as number[]).map(
      (a) => QST.PrefOrder.values?.find((v) => v.key === a)?.label
    )
  );
  expect(getAnswerForDisplay(CND, QST.Date), 'Display Date answer').toEqual(
    DATE.toLocaleDateString(
      locale.get(),
      DATE_FORMATS[QST.Date.dateType as keyof typeof DATE_FORMATS]
    )
  );
  // We need to init the translations
  await loadTranslations(defaultLocale, '');
  expect(getAnswerForDisplay(CND, QST.Boolean), 'Display Boolean answer').toEqual(
    t.get(ANS.Boolean.answer ? 'common.answerYes' : 'common.answerNo')
  );
  expect(getAnswerForDisplay(CND, QST.Text), 'Display Text answer').toEqual(ANS.Text.answer);
  expect(getAnswerForDisplay(CND, QST.Number), 'Display Number answer').toStrictEqual(
    `${ANS.Number.answer}`
  );
  expect(getAnswerForDisplay(CND, QST.Missing), 'Display missing answer').toBeUndefined();
  expect(
    getAnswerForDisplay(CND, QST.EmptyMultiCategorical),
    'Display empty list answer'
  ).toBeUndefined();
});
