import { describe, expect, it } from 'vitest';
import { smartNameCase } from './smartNameCase';
import { toNameCase } from './toNameCase';

describe('smartNameCase', () => {
  it.each([
    ['MATTI-PEKKA VIRTANEN', 'Matti-Pekka Virtanen'],
    ['ÄIJÄLÄ-ÖSTERBERG', 'Äijälä-Österberg'],
    ['ÖSTERBERG', 'Österberg'],
    ['ANNA  MARIA', 'Anna  Maria'],
    ['JEAN-LUC 2', 'Jean-Luc 2']
  ])('name-cases %j, written all in capitals, as %j', (given, expected) => {
    expect(smartNameCase(given)).toBe(expected);
  });

  it.each(['McDonald', 'van der Berg', 'matti', 'Matti-Pekka', 'ÄIJÄLÄ-österberg', '', '123', '-'])(
    'leaves %j as it is',
    (given) => {
      expect(smartNameCase(given)).toBe(given);
    }
  );
});

describe('toNameCase', () => {
  it('cases a word from its first letter, also when that letter is outside ASCII', () => {
    expect(toNameCase('ÖSTERBERG')).toBe('Österberg');
    expect(toNameCase('äijälä-österberg')).toBe('Äijälä-Österberg');
  });

  it('cases every word, those joined by dashes included', () => {
    expect(toNameCase('matti-pekka virtanen')).toBe('Matti-Pekka Virtanen');
  });
});
