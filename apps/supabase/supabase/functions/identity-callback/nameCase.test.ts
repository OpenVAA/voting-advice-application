/**
 * The Edge copy of the frontend's name casing, run against the frontend's own module over one table of names.
 *
 * Supabase deploys each function directory on its own, so `nameCase.ts` cannot import the frontend's util and is a copy. This spec imports the frontend's module by its path and asserts that the copy answers every name of the table exactly as the original does, and that both answer the casing the table states.
 */

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { smartNameCase, toNameCase } from './nameCase.ts';

const FRONTEND_TEXT_UTILS = new URL('../../../../frontend/src/lib/utils/text/', import.meta.url);

/** The frontend's module, imported by its path on disk. */
async function frontendModule<TModule>(file: string): Promise<TModule> {
  return (await import(fileURLToPath(new URL(file, FRONTEND_TEXT_UTILS)))) as TModule;
}

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

describe('the Edge copy of the name casing', () => {
  it.each(TABLE)('answers %j as the frontend does', async (name) => {
    const frontend = await frontendModule<{ smartNameCase: (text: string) => string }>('smartNameCase.ts');
    const frontendToNameCase = await frontendModule<{ toNameCase: (text: string) => string }>('toNameCase.ts');

    expect(smartNameCase(name)).toBe(frontend.smartNameCase(name));
    expect(toNameCase(name)).toBe(frontendToNameCase.toNameCase(name));
  });

  it.each(TABLE)('smart-cases %j as %j', (name, expected) => {
    expect(smartNameCase(name)).toBe(expected);
  });
});
