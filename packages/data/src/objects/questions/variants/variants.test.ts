import { expect, test } from 'vitest';
import { createQuestion, QUESTION_VARIANT } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;

const seen = new Set<string>();
questionData.forEach(({ type }) => seen.add(type));
if (seen.size !== Object.keys(QUESTION_VARIANT).length)
  throw new Error(
    `Test setup error: Test data does not contain all question variants. Missing: ${Object.keys(QUESTION_VARIANT)
      .filter((k) => !seen.has(k))
      .join(', ')}`
  );

test('CreateQuestion should work', () => {
  for (const [type, constructor] of Object.entries(QUESTION_VARIANT)) {
    const objData = questionData.find((q) => q.type === type);
    const obj = createQuestion({ data: objData!, root });
    expect(obj, `To create AnyQuestionVariant of type ${type}`).toBeInstanceOf(constructor);
  }
});
