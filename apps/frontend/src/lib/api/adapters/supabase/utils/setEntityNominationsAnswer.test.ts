import { describe, expect, it } from 'vitest';
import { parseSetEntityNominationsAnswer } from './setEntityNominationsAnswer';

const SECRET = 'value-that-must-not-be-in-the-message';

/** The counts of one write, as `set_entity_nominations` states them. */
const answer = { inserted: 1, updated: 2, deleted: 3, unchanged: 4, parents_created: 5 };

const COUNT_KEYS = ['deleted', 'inserted', 'parents_created', 'unchanged', 'updated'];

/**
 * The error a parse of `raw` throws.
 * @param raw - The value to parse.
 * @returns The thrown value, or `undefined` when the parse returned.
 */
function errorOf(raw: Parameters<typeof parseSetEntityNominationsAnswer>[0]): unknown {
  try {
    parseSetEntityNominationsAnswer(raw);
  } catch (e) {
    return e;
  }
  return undefined;
}

describe('parseSetEntityNominationsAnswer', () => {
  it('returns the five counts of a well-formed answer, in the names of the database', () => {
    expect(parseSetEntityNominationsAnswer(answer)).toEqual(answer);
  });

  it('returns the counts of a write that changed nothing', () => {
    const nothing = { inserted: 0, updated: 0, deleted: 0, unchanged: 0, parents_created: 0 };

    expect(parseSetEntityNominationsAnswer(nothing)).toEqual(nothing);
  });

  it('drops members the schema does not know', () => {
    const parsed = parseSetEntityNominationsAnswer({ ...answer, moved: 1, ids: ['nom-1'] });

    expect(parsed).toEqual(answer);
    expect(Object.keys(parsed).sort()).toEqual(COUNT_KEYS);
  });

  it.each([
    ['null', null],
    ['an array', [answer]],
    ['a string', 'saved'],
    ['a number', 1],
    ['a boolean', true]
  ])('throws for an answer that is %s and not an object', (_name, raw) => {
    expect(() => parseSetEntityNominationsAnswer(raw)).toThrow(/did not match its schema at: \(root\)$/);
  });

  it('throws for an absent answer', () => {
    expect(() => parseSetEntityNominationsAnswer(undefined)).toThrow(/did not match its schema at: \(root\)$/);
  });

  it.each(COUNT_KEYS)('throws for an answer without its %s count, naming it', (key) => {
    const withoutKey = Object.fromEntries(Object.entries(answer).filter(([name]) => name !== key));

    expect(() => parseSetEntityNominationsAnswer(withoutKey)).toThrow(
      new RegExp(`did not match its schema at: ${key}$`)
    );
  });

  it.each([
    ['a fraction', 1.5],
    ['text', '1'],
    ['null', null],
    ['a boolean', true]
  ])('throws for a count that is %s and not an integer', (_name, inserted) => {
    expect(() => parseSetEntityNominationsAnswer({ ...answer, inserted })).toThrow(
      /did not match its schema at: inserted$/
    );
  });

  it('names every refused path of one answer', () => {
    const error = errorOf({ ...answer, updated: '2', parents_created: null });

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/did not match its schema at: updated, parents_created$/);
  });

  it('names the refused paths and never a stored value', () => {
    const error = errorOf({ ...answer, inserted: SECRET, deleted: { secret: SECRET } });

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('inserted');
    expect((error as Error).message).toContain('deleted');
    expect((error as Error).message).not.toContain(SECRET);
  });
});
