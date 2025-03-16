import { expect, test } from 'vitest';
import { generateQuestionInfo } from '../../../functions/generateQuestionInfo';

/*
  * Only run this test when a llm key is set. Also assumes that the database has some mock data.
  */
const apiKeySet = process.env.LLM_OPENAI_API_KEY;
if (apiKeySet) {
  test('Should return true when queried. (Only returs true when answer succesfully generated.)', () => {
    expect(
      generateQuestionInfo(1)
    ).toBe(true)
  })
}
