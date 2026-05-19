/**
 * summary.ts tests (CLI-05 / D-58-14).
 */

import { describe, expect, it } from 'vitest';
import { formatSummary } from '../../src/cli/summary';

describe('formatSummary (D-58-14)', () => {
  const sample = {
    templateName: 'default (built-in)',
    seed: 42,
    elapsedMs: 6210,
    portraits: 100,
    rowCounts: { elections: 1, constituencies: 13, organizations: 8, candidates: 100 }
  };

  it('contains "Applied template: <name>"', () => {
    expect(formatSummary(sample)).toContain('Applied template: default (built-in)');
  });

  it('formats elapsed time as seconds with two decimals', () => {
    expect(formatSummary(sample)).toContain('Elapsed: 6.21s');
  });

  it('contains "Portraits uploaded: N"', () => {
    expect(formatSummary(sample)).toContain('Portraits uploaded: 100');
  });

  it('contains a row per rowCounts entry, sorted alphabetically', () => {
    const out = formatSummary(sample);
    // Sort order: candidates, constituencies, elections, organizations
    expect(out.indexOf('candidates')).toBeLessThan(out.indexOf('constituencies'));
    expect(out.indexOf('constituencies')).toBeLessThan(out.indexOf('elections'));
    expect(out.indexOf('elections')).toBeLessThan(out.indexOf('organizations'));
  });

  it('totals all row counts in the final row', () => {
    // 1 + 13 + 8 + 100 = 122
    expect(formatSummary(sample)).toMatch(/Total\s+122/);
  });

  it('handles zero portraits (printed as 0)', () => {
    const zero = { ...sample, portraits: 0 };
    expect(formatSummary(zero)).toContain('Portraits uploaded: 0');
  });

  it('is deterministic (same input produces identical output)', () => {
    expect(formatSummary(sample)).toBe(formatSummary(sample));
  });
});
