/**
 * `scripts/lib/docTokens.mjs` reads a docs page the way the docs-parity specs need: every whole backticked text on one line, in order, and the trimmed cells of the table rows between a heading and the next heading of the same or a higher level.
 */

import { describe, expect, it } from 'vitest';
import { backtickedTokens, tableRowsUnder } from '../lib/docTokens.mjs';

describe('backtickedTokens', () => {
  it('returns every backticked text in order, repeats kept, and none that spans a line', () => {
    expect(backtickedTokens('`A` and `B c` then `A`, but not `D\nE`')).toEqual(['A', 'B c', 'A']);
  });
});

describe('tableRowsUnder', () => {
  const page = [
    '# Page',
    '| outside | x |',
    '## Wanted',
    '| Name | Value |',
    '| ---- | ----- |',
    '  | `a`  | `1` |',
    '### A subsection',
    '| `b` | `2` |',
    '## Next',
    '| `c` | `3` |'
  ].join('\n');

  it('reads the rows of the section and its subsections, each as its trimmed cells', () => {
    expect(tableRowsUnder(page, '## Wanted')).toEqual([
      ['Name', 'Value'],
      ['----', '-----'],
      ['`a`', '`1`'],
      ['`b`', '`2`']
    ]);
  });

  it('stops a subsection at its next heading of any higher level', () => {
    expect(tableRowsUnder(page, '### A subsection')).toEqual([['`b`', '`2`']]);
  });

  it('returns undefined when no line is the heading', () => {
    expect(tableRowsUnder(page, '## Missing')).toBeUndefined();
  });
});
