import { describe, expect, it } from 'vitest';
import { getEffectiveSelectionBounds, isMultiChoiceCountValid } from './multiChoiceValidity';

/**
 * boundary matrix for the multi-choice selection-count validity helper.
 *
 * `isMultiChoiceCountValid` is the single source of truth for whether a multi-choice categorical selection of a given size is a saveable answer: effectiveMin = `minSelections ?? 1`, effectiveMax = `maxSelections ?? choiceCount`, and the count must fall inclusively within `[effectiveMin, effectiveMax]`.
 * Zero selections is always invalid-as-unanswered: the min floor is clamped to 1 whether `minSelections` is omitted, null, or an explicitly supplied zero.
 */
describe('isMultiChoiceCountValid', () => {
  describe('explicit minSelections=2, maxSelections=3, choiceCount=5', () => {
    it.each([
      [0, false],
      [1, false],
      [2, true],
      [3, true],
      [4, false]
    ])('count %i → %s', (count, expected) => {
      expect(isMultiChoiceCountValid({ count, minSelections: 2, maxSelections: 3, choiceCount: 5 })).toBe(expected);
    });
  });

  describe('minSelections omitted (effective min defaults to 1)', () => {
    it('count 0 → false (zero selections is always invalid-as-unanswered)', () => {
      expect(isMultiChoiceCountValid({ count: 0, maxSelections: 3, choiceCount: 5 })).toBe(false);
    });

    it('count 1 → true', () => {
      expect(isMultiChoiceCountValid({ count: 1, maxSelections: 3, choiceCount: 5 })).toBe(true);
    });

    it('treats null minSelections identically to omitted', () => {
      expect(isMultiChoiceCountValid({ count: 0, minSelections: null, maxSelections: 3, choiceCount: 5 })).toBe(false);
      expect(isMultiChoiceCountValid({ count: 1, minSelections: null, maxSelections: 3, choiceCount: 5 })).toBe(true);
    });
  });

  describe('maxSelections omitted (effective max defaults to choiceCount)', () => {
    it('count === choiceCount → true', () => {
      expect(isMultiChoiceCountValid({ count: 5, minSelections: 2, choiceCount: 5 })).toBe(true);
    });

    it('count > choiceCount → false', () => {
      expect(isMultiChoiceCountValid({ count: 6, minSelections: 2, choiceCount: 5 })).toBe(false);
    });

    it('treats null maxSelections identically to omitted', () => {
      expect(isMultiChoiceCountValid({ count: 5, minSelections: 2, maxSelections: null, choiceCount: 5 })).toBe(true);
    });
  });

  describe('both omitted (any count in 1..choiceCount is valid)', () => {
    it('count 0 → false', () => {
      expect(isMultiChoiceCountValid({ count: 0, choiceCount: 4 })).toBe(false);
    });

    it.each([1, 2, 3, 4])('count %i → true', (count) => {
      expect(isMultiChoiceCountValid({ count, choiceCount: 4 })).toBe(true);
    });

    it('count above choiceCount → false', () => {
      expect(isMultiChoiceCountValid({ count: 5, choiceCount: 4 })).toBe(false);
    });
  });

  describe('explicit minSelections=0 (an explicit zero must not lower the floor below 1)', () => {
    it('count 0 → false (zero selections is always invalid-as-unanswered, explicit zero included)', () => {
      expect(isMultiChoiceCountValid({ count: 0, minSelections: 0, maxSelections: 3, choiceCount: 5 })).toBe(false);
    });

    it('count 1 → true (within the effective maximum)', () => {
      expect(isMultiChoiceCountValid({ count: 1, minSelections: 0, maxSelections: 3, choiceCount: 5 })).toBe(true);
    });

    it('count above the effective maximum → false (the explicit zero does not touch the max derivation)', () => {
      expect(isMultiChoiceCountValid({ count: 4, minSelections: 0, maxSelections: 3, choiceCount: 5 })).toBe(false);
    });

    it('count 0 with both an explicit zero minimum and an omitted maximum → false', () => {
      expect(isMultiChoiceCountValid({ count: 0, minSelections: 0, choiceCount: 4 })).toBe(false);
    });
  });
});

describe('getEffectiveSelectionBounds', () => {
  it('clamps an explicitly supplied zero minimum up to 1, so a label cannot advertise a floor the save gate refuses', () => {
    expect(getEffectiveSelectionBounds({ minSelections: 0, maxSelections: 3, choiceCount: 5 })).toEqual({
      effectiveMin: 1,
      effectiveMax: 3
    });
  });

  it('defaults an omitted minimum to 1 and an omitted maximum to the choice count', () => {
    expect(getEffectiveSelectionBounds({ choiceCount: 4 })).toEqual({ effectiveMin: 1, effectiveMax: 4 });
  });

  it('treats null identically to omitted on both bounds', () => {
    expect(getEffectiveSelectionBounds({ minSelections: null, maxSelections: null, choiceCount: 4 })).toEqual({
      effectiveMin: 1,
      effectiveMax: 4
    });
  });

  it('passes authored bounds through unchanged when they are at or above the floor', () => {
    expect(getEffectiveSelectionBounds({ minSelections: 2, maxSelections: 3, choiceCount: 5 })).toEqual({
      effectiveMin: 2,
      effectiveMax: 3
    });
  });

  it('agrees with the validity gate at the floor, which is the reason both read one derivation', () => {
    const { effectiveMin } = getEffectiveSelectionBounds({ minSelections: 0, maxSelections: 3, choiceCount: 5 });
    expect(isMultiChoiceCountValid({ count: effectiveMin, minSelections: 0, maxSelections: 3, choiceCount: 5 })).toBe(
      true
    );
    expect(
      isMultiChoiceCountValid({ count: effectiveMin - 1, minSelections: 0, maxSelections: 3, choiceCount: 5 })
    ).toBe(false);
  });
});
