import { describe, expect, it } from 'vitest';
import { NOMINATION_REFUSAL_MESSAGE, refusalOf } from './nominationRefusal';
import type { SetEntityNominationsResult } from '$lib/api/base/dataWriter.type';

const SAVED: SetEntityNominationsResult = {
  type: 'saved',
  inserted: 0,
  updated: 0,
  deleted: 1,
  unchanged: 0,
  parentsCreated: 0
};

describe('refusalOf', () => {
  it('says nothing of a write that was stored', () => {
    expect(refusalOf(SAVED)).toBeUndefined();
  });

  it.each(['changed', 'hasCandidates', 'tooManyPending', 'answersLocked', 'nominationsLocked'] as const)(
    'names the reason a write was refused for: %s',
    (reason) => {
      expect(refusalOf({ type: 'refused', reason })).toBe(reason);
    }
  );

  it('calls a write that was rejected failed', () => {
    expect(refusalOf(undefined)).toBe('failed');
  });

  it('calls a refusal for a reason it does not name failed', () => {
    const unknown = { type: 'refused', reason: 'somethingNew' } as unknown as SetEntityNominationsResult;
    expect(refusalOf(unknown)).toBe('failed');
  });
});

describe('NOMINATION_REFUSAL_MESSAGE', () => {
  it('gives each lock the sentence its note shows', () => {
    expect(NOMINATION_REFUSAL_MESSAGE.answersLocked).toBe('contestantApp.common.nominationsNotEditableAnswersLocked');
    expect(NOMINATION_REFUSAL_MESSAGE.nominationsLocked).toBe('contestantApp.common.nominationsNotEditable');
  });
});
