/**
 * AccountsGenerator unit tests — pass-through per D-11.
 *
 * D-22 scope: pure I/O. Asserts `[]` return for every input shape, with a logger
 * warning emitted exactly once when the user requests non-empty fragment content.
 */

import { describe, expect, it, vi } from 'vitest';
import { AccountsGenerator } from '../../src/generators/AccountsGenerator';
import { makeCtx } from '../utils';

describe('AccountsGenerator', () => {
  it('returns [] for empty fragment (pass-through per D-11)', () => {
    const gen = new AccountsGenerator(makeCtx());
    expect(gen.generate({})).toEqual([]);
  });

  it('returns [] even when count requested and logs warning', () => {
    const loggerSpy = vi.fn();
    const gen = new AccountsGenerator(makeCtx({ logger: loggerSpy }));
    const rows = gen.generate({ count: 3 });
    expect(rows).toEqual([]);
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy.mock.calls[0][0]).toContain('bootstrap-only');
  });

  it('returns [] even when fixed[] supplied and logs warning', () => {
    const loggerSpy = vi.fn();
    const gen = new AccountsGenerator(makeCtx({ logger: loggerSpy }));
    const rows = gen.generate({ fixed: [{ external_id: 'custom', name: 'Custom Account' }] });
    expect(rows).toEqual([]);
    expect(loggerSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT log when fragment is empty', () => {
    const loggerSpy = vi.fn();
    const gen = new AccountsGenerator(makeCtx({ logger: loggerSpy }));
    gen.generate({});
    expect(loggerSpy).not.toHaveBeenCalled();
  });
});
