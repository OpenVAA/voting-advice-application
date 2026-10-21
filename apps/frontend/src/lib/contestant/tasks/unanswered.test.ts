import { describe, expect, it } from 'vitest';
import { requiredInfoQuestionsOf, unansweredQuestionsOf } from './unanswered';
import type { SavedAnswers } from './unanswered';

/**
 * The contract of the two filters in `unanswered.ts`, over plain fixtures shaped like the surface each filter reads. No question of the data model is built here, so this stays a test of the filters.
 *
 * - `requiredInfoQuestionsOf` keeps a question that is required and not locked, and drops every other.
 * - `unansweredQuestionsOf` answers every question while there is no answers object, and otherwise the questions whose saved value is empty.
 * - Each returns a new array, in the order given, holding the caller's own question objects, and changes nothing it was handed.
 */

type InfoFixture = {
  id: string;
  required: boolean;
  customData?: { locked?: boolean };
};

type QuestionFixture = { id: string };

/** Freeze a list and each of its elements, so a filter that writes to its input throws. */
function frozen<TItem extends object>(items: Array<TItem>): ReadonlyArray<TItem> {
  return Object.freeze(items.map((item) => Object.freeze(item)));
}

describe('requiredInfoQuestionsOf', () => {
  const REQUIRED: InfoFixture = { id: 'required', required: true };
  const REQUIRED_EMPTY_CUSTOM_DATA: InfoFixture = { id: 'required-empty-custom-data', required: true, customData: {} };
  const REQUIRED_UNLOCKED: InfoFixture = { id: 'required-unlocked', required: true, customData: { locked: false } };
  const OPTIONAL: InfoFixture = { id: 'optional', required: false };
  const OPTIONAL_LOCKED: InfoFixture = { id: 'optional-locked', required: false, customData: { locked: true } };
  const REQUIRED_LOCKED: InfoFixture = { id: 'required-locked', required: true, customData: { locked: true } };

  it.each([
    { title: 'with no custom data', question: REQUIRED },
    { title: 'with empty custom data', question: REQUIRED_EMPTY_CUSTOM_DATA },
    { title: 'whose custom data says it is not locked', question: REQUIRED_UNLOCKED }
  ])('keeps a required question $title', ({ question }) => {
    expect(requiredInfoQuestionsOf([question])).toStrictEqual([question]);
  });

  it.each([
    { title: 'a question that is not required', question: OPTIONAL },
    { title: 'a question that is not required and is locked', question: OPTIONAL_LOCKED },
    { title: 'a required question whose custom data says it is locked', question: REQUIRED_LOCKED }
  ])('drops $title', ({ question }) => {
    expect(requiredInfoQuestionsOf([REQUIRED, question])).toStrictEqual([REQUIRED]);
  });

  it('keeps the order given and hands back the same question objects', () => {
    const questions = [REQUIRED_UNLOCKED, OPTIONAL, REQUIRED, REQUIRED_LOCKED, REQUIRED_EMPTY_CUSTOM_DATA];
    const result: Array<InfoFixture> = requiredInfoQuestionsOf(questions);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(REQUIRED_UNLOCKED);
    expect(result[1]).toBe(REQUIRED);
    expect(result[2]).toBe(REQUIRED_EMPTY_CUSTOM_DATA);
  });

  it('returns a new array even when it keeps every question', () => {
    const questions = [REQUIRED, REQUIRED_UNLOCKED];
    const result = requiredInfoQuestionsOf(questions);
    expect(result).toStrictEqual(questions);
    expect(result).not.toBe(questions);
  });

  it('returns a new empty array for an empty list', () => {
    const questions: Array<InfoFixture> = [];
    const result = requiredInfoQuestionsOf(questions);
    expect(result).toStrictEqual([]);
    expect(result).not.toBe(questions);
  });

  it('changes nothing it was handed', () => {
    const questions = frozen<InfoFixture>([
      { id: 'a', required: true },
      { id: 'b', required: false },
      { id: 'c', required: true, customData: Object.freeze({ locked: true }) }
    ]);
    expect(requiredInfoQuestionsOf(questions).map((q) => q.id)).toStrictEqual(['a']);
    expect(questions.map((q) => q.id)).toStrictEqual(['a', 'b', 'c']);
  });
});

describe('unansweredQuestionsOf', () => {
  const FIRST: QuestionFixture = { id: 'first' };
  const SECOND: QuestionFixture = { id: 'second' };
  const THIRD: QuestionFixture = { id: 'third' };
  const QUESTIONS = [FIRST, SECOND, THIRD];

  it.each([
    { title: 'undefined', answers: undefined },
    { title: 'null', answers: null }
  ])('answers every question while the answers object is $title', ({ answers }) => {
    const result: Array<QuestionFixture> = unansweredQuestionsOf(QUESTIONS, answers);
    expect(result).toStrictEqual(QUESTIONS);
    expect(result).not.toBe(QUESTIONS);
  });

  it('answers every question for an answers object with no entry', () => {
    expect(unansweredQuestionsOf(QUESTIONS, {})).toStrictEqual(QUESTIONS);
  });

  it.each<{ title: string; entry: SavedAnswers[string] }>([
    { title: 'an entry with no value', entry: {} },
    { title: 'an entry whose value is undefined', entry: { value: undefined } },
    { title: 'an entry whose value is null', entry: { value: null } },
    { title: 'an entry whose value is an empty string', entry: { value: '' } },
    { title: 'a null entry', entry: null },
    { title: 'an undefined entry', entry: undefined }
  ])('counts a question with $title as unanswered', ({ entry }) => {
    expect(unansweredQuestionsOf([SECOND], { second: entry })).toStrictEqual([SECOND]);
  });

  it.each<{ title: string; entry: SavedAnswers[string] }>([
    { title: 'false', entry: { value: false } },
    { title: 'zero', entry: { value: 0 } },
    { title: 'a non-empty string', entry: { value: 'an answer' } }
  ])('counts a question whose saved value is $title as answered', ({ entry }) => {
    expect(unansweredQuestionsOf([FIRST, SECOND], { second: entry })).toStrictEqual([FIRST]);
  });

  it('counts a question as unanswered when the only entry is for another question', () => {
    expect(unansweredQuestionsOf([FIRST], { second: { value: 'an answer' } })).toStrictEqual([FIRST]);
  });

  it('keeps the order given and hands back the same question objects', () => {
    const result = unansweredQuestionsOf(QUESTIONS, { second: { value: 2 } });
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(FIRST);
    expect(result[1]).toBe(THIRD);
  });

  it('returns a new empty array when every question is answered', () => {
    const answers = { first: { value: 1 }, second: { value: 'two' }, third: { value: false } };
    const result = unansweredQuestionsOf(QUESTIONS, answers);
    expect(result).toStrictEqual([]);
    expect(result).not.toBe(QUESTIONS);
  });

  it('returns a new empty array for an empty list, with and without an answers object', () => {
    const questions: Array<QuestionFixture> = [];
    expect(unansweredQuestionsOf(questions, undefined)).toStrictEqual([]);
    expect(unansweredQuestionsOf(questions, undefined)).not.toBe(questions);
    expect(unansweredQuestionsOf(questions, { first: { value: 1 } })).toStrictEqual([]);
  });

  it('changes nothing it was handed', () => {
    const questions = frozen<QuestionFixture>([{ id: 'a' }, { id: 'b' }]);
    const answers: SavedAnswers = Object.freeze({ a: Object.freeze({ value: 'kept' }), b: null });
    expect(unansweredQuestionsOf(questions, answers).map((q) => q.id)).toStrictEqual(['b']);
    expect(questions.map((q) => q.id)).toStrictEqual(['a', 'b']);
    expect(answers).toStrictEqual({ a: { value: 'kept' }, b: null });
  });
});
