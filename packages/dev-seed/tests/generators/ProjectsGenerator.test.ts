/**
 * ProjectsGenerator unit tests — pass-through per D-11.
 *
 * D-22 scope: pure I/O. Mirrors AccountsGenerator shape — both tables are
 * bootstrapped by seed.sql and dev-seed emits `[]` for any request shape.
 */

import { describe, expect, it, vi } from 'vitest';
import { ProjectsGenerator } from '../../src/generators/ProjectsGenerator';
import { makeCtx } from '../utils';

describe('ProjectsGenerator', () => {
  it('returns [] for empty fragment (pass-through per D-11)', () => {
    const gen = new ProjectsGenerator(makeCtx());
    expect(gen.generate({})).toEqual([]);
  });

  it('returns [] even when count requested and logs warning', () => {
    const loggerSpy = vi.fn();
    const gen = new ProjectsGenerator(makeCtx({ logger: loggerSpy }));
    const rows = gen.generate({ count: 2 });
    expect(rows).toEqual([]);
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy.mock.calls[0][0]).toContain('bootstrap-only');
  });

  it('returns [] even when fixed[] supplied and logs warning', () => {
    const loggerSpy = vi.fn();
    const gen = new ProjectsGenerator(makeCtx({ logger: loggerSpy }));
    const rows = gen.generate({ fixed: [{ external_id: 'custom', name: 'Custom Project' }] });
    expect(rows).toEqual([]);
    expect(loggerSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT log when fragment is empty', () => {
    const loggerSpy = vi.fn();
    const gen = new ProjectsGenerator(makeCtx({ logger: loggerSpy }));
    gen.generate({});
    expect(loggerSpy).not.toHaveBeenCalled();
  });
});
