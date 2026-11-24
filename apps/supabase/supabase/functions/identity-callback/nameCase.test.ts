/**
 * The smart casing of a provider-sent name, over one table of names and the casing each is stored with.
 */

import { describe, expect, it } from 'vitest';
import { smartNameCase } from './nameCase.ts';

/** Each name of the table and the casing `smartNameCase` answers for it. */
const TABLE: ReadonlyArray<[string, string]> = [
  ['MATTI-PEKKA VIRTANEN', 'Matti-Pekka Virtanen'],
  ['ÄIJÄLÄ-ÖSTERBERG', 'Äijälä-Österberg'],
  ['ÖSTERBERG', 'Österberg'],
  ['ANNA  MARIA', 'Anna  Maria'],
  ['JEAN-LUC 2', 'Jean-Luc 2'],
  ['McDonald', 'McDonald'],
  ['van der Berg', 'van der Berg'],
  ['matti', 'matti'],
  ['Matti-Pekka', 'Matti-Pekka'],
  ['ÄIJÄLÄ-österberg', 'ÄIJÄLÄ-österberg'],
  ['', ''],
  ['123', '123'],
  ['-', '-']
];

describe('smartNameCase', () => {
  it.each(TABLE)('smart-cases %j as %j', (name, expected) => {
    expect(smartNameCase(name)).toBe(expected);
  });
});
