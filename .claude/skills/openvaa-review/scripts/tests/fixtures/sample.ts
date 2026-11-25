/**
 * TSDoc block: three comment lines.
 */
import { x } from './x';

// a line comment
const url = 'https://example.org'; // trailing comment, still code
/* inline block */ const y = 1;

/*
  bare block body
*/
export function f(a: number): number {
  return a * 2;
}
