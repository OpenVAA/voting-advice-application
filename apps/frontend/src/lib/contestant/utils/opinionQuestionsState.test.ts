import { describe, expect, it } from 'vitest';
import { opinionQuestionsStateOf } from './opinionQuestionsState';

describe('opinionQuestionsStateOf', () => {
  it.each([
    [0, 'an empty list'],
    [3, 'a list that holds questions']
  ])("is loading while the entity's question data is not loaded, with %i questions (%s)", (questionCount) => {
    expect(opinionQuestionsStateOf({ questionsReady: false, questionCount })).toBe('loading');
  });

  it('is none once the data is loaded and holds no opinion question', () => {
    expect(opinionQuestionsStateOf({ questionsReady: true, questionCount: 0 })).toBe('none');
  });

  it.each([1, 12])('is some once the data is loaded and holds %i opinion question(s)', (questionCount) => {
    expect(opinionQuestionsStateOf({ questionsReady: true, questionCount })).toBe('some');
  });
});
