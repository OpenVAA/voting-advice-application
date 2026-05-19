/**
 * FeedbackGenerator unit tests.
 *
 * Minimal stub per Claude's Discretion — returns `[]` by default; supports
 * `fixed[]` pass-through with NO external_id prefix (feedback table has no
 * `external_id` column; the Fragment.external_id key is discarded at the
 * generator boundary).
 */

import { describe, expect, it, vi } from 'vitest';
import { FeedbackGenerator } from '../../src/generators/FeedbackGenerator';
import { makeCtx } from '../utils';

describe('FeedbackGenerator', () => {
  it('defaults to count 0 — empty fragment returns []', () => {
    const gen = new FeedbackGenerator(makeCtx());
    expect(gen.generate({})).toHaveLength(0);
  });

  it('does NOT synthesize rows on count > 0; logs warning instead', () => {
    const loggerSpy = vi.fn();
    const gen = new FeedbackGenerator(makeCtx({ logger: loggerSpy }));
    expect(gen.generate({ count: 3 })).toHaveLength(0);
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy.mock.calls[0][0]).toContain('synthetic feedback disabled');
  });

  it('passes through fixed[] rows and discards external_id (feedback has no external_id column)', () => {
    const gen = new FeedbackGenerator(makeCtx());
    const rows = gen.generate({
      fixed: [{ rating: 5, description: 'Great!', external_id: 'should_be_ignored' }]
    });
    expect(rows).toHaveLength(1);
    const rowAny = rows[0] as unknown as { rating: number; description: string; external_id?: string };
    expect(rowAny.rating).toBe(5);
    expect(rowAny.description).toBe('Great!');
    expect(rowAny.external_id).toBeUndefined();
  });

  it('project_id defaults to ctx.projectId for fixed[] rows', () => {
    const gen = new FeedbackGenerator(makeCtx());
    const rows = gen.generate({ fixed: [{ rating: 3, external_id: 'ignored' }] });
    expect(rows[0].project_id).toBe('00000000-0000-0000-0000-000000000001');
  });
});
