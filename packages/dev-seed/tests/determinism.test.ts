/**
 * Determinism tests (TMPL-08).
 *
 * Cross-cutting: exercises every generator's faker reads through a single
 * `runPipeline({ seed })` call and asserts byte-identical output across runs.
 *
 * Pattern A per RESEARCH §5: each `runPipeline` call constructs a fresh
 * `new Faker()` instance (inside `buildCtx`) and seeds it. No module-level
 * `faker.seed()` — that's the shared-state trap this contract exists to prevent.
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
import { fanOutLocales } from '../src/locales';
import { runPipeline } from '../src/pipeline';

describe('determinism (TMPL-08)', () => {
  it('same seed (42) produces byte-identical output across two fresh runs', () => {
    const run1 = runPipeline({ seed: 42 });
    const run2 = runPipeline({ seed: 42 });
    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });

  it('different seeds produce different output', () => {
    const run1 = runPipeline({ seed: 42 });
    const run2 = runPipeline({ seed: 99 });
    expect(JSON.stringify(run1)).not.toEqual(JSON.stringify(run2));
  });

  it('default seed (no `seed` field — falls back to 42) is still deterministic', () => {
    // buildCtx defaults seed to 42 when template.seed is undefined. Two runs
    // with the same `{}` template should therefore produce identical output.
    const run1 = runPipeline({});
    const run2 = runPipeline({});
    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });

  // ---------------------------------------------------------------------------
  // Phase 58 Plan 09 — Pitfall #1 locale fan-out determinism (NF-04)
  // ---------------------------------------------------------------------------
  //
  // RESEARCH §Pitfall #1: if locale iteration order drifts, fan-out output
  // differs across runs even at the same seed. `locales.ts` locks iteration
  // via hardcoded `LOCALES = ['en','fi','sv','da']` + hardcoded
  // `LOCALIZED_FIELDS` map. These cases prove byte-level determinism survives
  // the full `runPipeline` + `fanOutLocales` pipeline, AND that
  // `generateTranslationsForAllLocales` is a no-op when absent (Phase 56
  // behavior preserved).
  //
  // TEST DISCIPLINE: templates are constructed via a factory (`makeTemplate()`)
  // rather than shared by reference across both `runPipeline` calls. Under the
  // hood Phase 56's pipeline spreads `template[table]` into fragments that are
  // passed to generators — some generators mutate those fragments' `fixed[]`
  // arrays in-place. Sharing the template across calls therefore leaks state
  // into the second invocation. Real CLI usage rebuilds the template per
  // invocation (`loadBuiltIns()` returns a fresh object each process), so the
  // factory pattern mirrors production. The `count: 0` on fixed[]-only
  // fragments follows Plan 06's established precedent (58-06-SUMMARY deviation
  // #1) to suppress synthetic emission when only the fixed rows are intended.

  it('Pitfall #1: runPipeline + fanOutLocales is deterministic at the same seed (generateTranslationsForAllLocales: true)', () => {
    const makeTemplate = () => ({
      seed: 42,
      generateTranslationsForAllLocales: true,
      elections: { count: 0, fixed: [{ external_id: 'e1', name: { en: 'Demo 1' } }] },
      organizations: {
        count: 0,
        fixed: [{ external_id: 'o1', name: { en: 'Org 1' }, color: '#111111' }]
      }
    });
    const t1 = makeTemplate();
    const run1 = runPipeline(t1);
    fanOutLocales(run1, t1, 42);
    const t2 = makeTemplate();
    const run2 = runPipeline(t2);
    fanOutLocales(run2, t2, 42);
    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });

  it('Pitfall #1: locale fan-out produces all 4 locale keys at the default template', () => {
    const template = {
      seed: 42,
      generateTranslationsForAllLocales: true,
      elections: { count: 0, fixed: [{ external_id: 'e1', name: { en: 'Demo' } }] }
    };
    const rows = runPipeline(template);
    fanOutLocales(rows, template, 42);
    const election = rows.elections[0] as { name: Record<string, string> };
    expect(Object.keys(election.name).sort()).toEqual(['da', 'en', 'fi', 'sv']);
  });

  it('locale fan-out is a no-op when generateTranslationsForAllLocales is undefined (Phase 56 behavior preserved)', () => {
    const template = {
      seed: 42,
      elections: { count: 0, fixed: [{ external_id: 'e1', name: { en: 'Demo' } }] }
    };
    const rows = runPipeline(template);
    fanOutLocales(rows, template, 42);
    const election = rows.elections[0] as { name: Record<string, string> };
    expect(Object.keys(election.name)).toEqual(['en']);
  });
});
