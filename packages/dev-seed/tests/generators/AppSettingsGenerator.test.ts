/**
 * AppSettingsGenerator unit tests.
 *
 * Phase 56 count semantics (RESEARCH §4.15 Pitfall 5): `app_settings` is UNIQUE
 * on `project_id`, so the generator clamps `count > 1` to 1 and logs a warning.
 * seed.sql bootstrap row covers the zero-count path; writer (Plan 07) routes
 * emissions through `updateAppSettings` (merge_jsonb_column) not bulk_import.
 *
 * D-22 acceptance (a)–(e) adapted for the clamp semantics.
 */

import { describe, expect, it, vi } from 'vitest';
import { AppSettingsGenerator } from '../../src/generators/AppSettingsGenerator';
import { makeCtx } from '../utils';

describe('AppSettingsGenerator', () => {
  it('defaults to count 0 — no rows emitted on empty fragment', () => {
    const gen = new AppSettingsGenerator(makeCtx());
    expect(gen.generate({})).toHaveLength(0);
  });

  it('emits 1 row when count = 1', () => {
    const gen = new AppSettingsGenerator(makeCtx());
    expect(gen.generate({ count: 1 })).toHaveLength(1);
  });

  it('clamps count > 1 to 1 (app_settings UNIQUE on project_id per Pitfall 5)', () => {
    const gen = new AppSettingsGenerator(makeCtx());
    const rows = gen.generate({ count: 5 });
    expect(rows).toHaveLength(1);
  });

  it('emits logger warning when count > 1', () => {
    const loggerSpy = vi.fn();
    const gen = new AppSettingsGenerator(makeCtx({ logger: loggerSpy }));
    gen.generate({ count: 5 });
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy.mock.calls[0][0]).toContain('UNIQUE on project_id');
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new AppSettingsGenerator(makeCtx());
    const rows = gen.generate({ count: 1 });
    expect(rows[0].external_id).toMatch(/^seed_/);
  });

  it('passes through fixed[] rows modulo prefix', () => {
    const gen = new AppSettingsGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_set', settings: { foo: 'bar' } as never }]
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].external_id).toBe('seed_my_set');
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new AppSettingsGenerator(makeCtx()).generate({ count: 1 });
    const run2 = new AppSettingsGenerator(makeCtx()).generate({ count: 1 });
    expect(run1).toEqual(run2);
  });
});
