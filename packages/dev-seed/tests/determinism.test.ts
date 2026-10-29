/**
 * Determinism tests.
 *
 * Cross-cutting: exercises every generator's faker reads through a single `runPipeline({ seed })` call and asserts byte-identical output across runs.
 *
 * Each `runPipeline` call constructs a fresh `new Faker()` instance (inside `buildCtx`) and seeds it. No module-level `faker.seed()` — that's the shared-state trap this contract exists to prevent.
 *
 * contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc `.
 */

import { en, Faker } from '@faker-js/faker';
import { describe, expect, it, vi } from 'vitest';
import { fanOutLocales } from '../src/locales';
import { runPipeline } from '../src/pipeline';
import type { Template } from '../src/template/types';

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
    // buildCtx defaults seed to 42 when template.seed is undefined. Two runs with the same `{}` template should therefore produce identical output.
    const run1 = runPipeline({});
    const run2 = runPipeline({});
    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });

  // ---------------------------------------------------------------------------
  // Locale fan-out determinism
  // ---------------------------------------------------------------------------
  //
  // If locale iteration order drifts, fan-out output differs across runs even at the same seed. `locales.ts` locks iteration via hardcoded `LOCALES = ['en','fi','sv']` + hardcoded `LOCALIZED_FIELDS` map. These cases prove byte-level determinism survives the full `runPipeline` + `fanOutLocales` pipeline, AND that `generateTranslationsForAllLocales` is a no-op when absent.
  //
  // TEST DISCIPLINE: templates are constructed via a factory (`makeTemplate()`) rather than shared by reference across both `runPipeline` calls. Under the hood the pipeline spreads `template[table]` into fragments that are passed to generators — some generators mutate those fragments' `fixed[]` arrays in-place. Sharing the template across calls therefore leaks state into the second invocation. Real CLI usage rebuilds the template per invocation (`loadBuiltIns()` returns a fresh object each process), so the factory pattern mirrors production. The `count: 0` on fixed[]-only fragments is the established idiom for suppressing synthetic emission when only the fixed rows are intended.

  it('runPipeline + fanOutLocales is deterministic at the same seed (generateTranslationsForAllLocales: true)', () => {
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

  it('locale fan-out produces all 3 locale keys at the default template', () => {
    // Annotated so the fixture is a live conformance check against the strict per-collection row types, not merely an untyped literal.
    const template: Template = {
      seed: 42,
      generateTranslationsForAllLocales: true,
      elections: { count: 0, fixed: [{ external_id: 'e1', name: { en: 'Demo' } }] }
    };
    const rows = runPipeline(template);
    fanOutLocales(rows, template, 42);
    const election = rows.elections[0] as { name: Record<string, string> };
    expect(Object.keys(election.name).sort()).toEqual(['en', 'fi', 'sv']);
  });

  it('locale fan-out is a no-op when generateTranslationsForAllLocales is undefined (behavior preserved)', () => {
    // Annotated for the same reason as above, AND because `fanOutLocales`' second parameter is the all-optional `{ generateTranslationsForAllLocales?
    // : boolean }`: without the annotation this literal shares no property with it and TypeScript's weak-type rule rejects the call outright.
    const template: Template = {
      seed: 42,
      elections: { count: 0, fixed: [{ external_id: 'e1', name: { en: 'Demo' } }] }
    };
    const rows = runPipeline(template);
    fanOutLocales(rows, template, 42);
    const election = rows.elections[0] as { name: Record<string, string> };
    expect(Object.keys(election.name)).toEqual(['en']);
  });
});

// ---------------------------------------------------------------------------
// Determinism across wall-clock time
// ---------------------------------------------------------------------------
//
// Every case above compares two runs made at the SAME instant, so none of them can observe a value that follows the system clock. The block below builds a control template that reaches both date-emitting sites in a single `runPipeline` call, then compares runs made at different instants.

describe('determinism across wall-clock time', () => {
  /** The emitted answer key for the fixed date question: `externalIdPrefix` defaults to `seed_`, and the questions generator prefixes fixed rows with it. */
  const DATE_QUESTION_KEY = 'seed_q_date';

  /** `election_date` is emitted at DAY granularity — `.toISOString().slice(0, 10)`. */
  const DAY_GRANULARITY = /^\d{4}-\d{2}-\d{2}$/;

  /** A `date` answer is emitted at MILLISECOND granularity — a bare `.toISOString()`. */
  const MILLISECOND_GRANULARITY = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  /**
   * A control template that reaches BOTH wall-clock date sites in one `runPipeline` call.
   * `elections.count` drives the synthetic loop that draws `election_date`; the fixed `date` question plus `candidates.count` drive the answer emitter's `date` branch, which the synthetic question-type rotation never reaches on its own.
   * No built-in template is usable here: the only one declaring a `date` question hardcodes its answer, and a hardcoded answer is a false pass.
   * The factory returns a FRESH object per call because generators mutate `fixed[]` in place, so a shared object would leak state into a second run.
   */
  const makeDateReachingTemplate = (): Template => ({
    seed: 42,
    elections: { count: 1 },
    question_categories: { count: 1 },
    questions: { count: 0, fixed: [{ external_id: 'q_date', type: 'date', name: { en: 'When?' } }] },
    candidates: { count: 1 }
  });

  /**
   * Read the two clock-dependent values out of a pipeline result.
   * Throws when either is absent, so an inequality assertion can never pass vacuously on a pair of `undefined` values.
   */
  const readDateSites = (
    rows: Record<string, Array<Record<string, unknown>>>
  ): { electionDate: string; dateAnswer: string } => {
    const election = rows.elections[0] as { election_date?: unknown } | undefined;
    const candidate = rows.candidates[0] as { answersByExternalId?: Record<string, { value?: unknown }> } | undefined;
    const electionDate = election?.election_date;
    const dateAnswer = candidate?.answersByExternalId?.[DATE_QUESTION_KEY]?.value;
    if (typeof electionDate !== 'string') throw new Error('the pipeline emitted no `election_date`');
    if (typeof dateAnswer !== 'string') throw new Error(`the pipeline emitted no \`${DATE_QUESTION_KEY}\` answer`);
    return { electionDate, dateAnswer };
  };

  // These assertions are the anti-vacuity contract every cross-time comparison in this block rests on.
  // A change that stops reaching the synthetic loop in `src/generators/ElectionsGenerator.ts` or the `date` branch in `src/emitters/answers.ts` turns this case RED, rather than leaving a comparison to pass on values that are no longer emitted.
  it('the control template reaches both wall-clock date sites', () => {
    const rows = runPipeline(makeDateReachingTemplate());

    expect(rows.elections).toHaveLength(1);
    expect(rows.candidates).toHaveLength(1);

    const election = rows.elections[0] as { external_id: string; election_date: string };
    expect(election.external_id).toEqual('seed_election_00');
    expect(election.election_date).toMatch(DAY_GRANULARITY);
    expect(election.election_date).toHaveLength(10);

    const candidate = rows.candidates[0] as { answersByExternalId: Record<string, { value: unknown }> };
    expect(Object.keys(candidate.answersByExternalId)).toContain(DATE_QUESTION_KEY);
    expect(candidate.answersByExternalId[DATE_QUESTION_KEY].value).toMatch(MILLISECOND_GRANULARITY);
  });

  // The two cases below assert cross-time stability at both day and millisecond granularity: the same seed must emit the same dates whatever the system clock reads.
  // Every date the pipeline draws is therefore anchored to a fixed reference window rather than to `new Date()`. Both granularities are asserted because a comparison restricted to the day-granularity `election_date` passes across a real millisecond drift.
  it('the same seed produces byte-identical output across a faked clock set eight months apart', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-01-15T00:00:00.000Z'));
      const run1 = runPipeline(makeDateReachingTemplate());
      vi.setSystemTime(new Date('2026-09-15T00:00:00.000Z'));
      const run2 = runPipeline(makeDateReachingTemplate());

      // Whole-pipeline comparison: row order and key order are part of what this asserts.
      expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));

      // Per-site comparison as well, because a single site regressing to the clock would still have to show up here.
      const first = readDateSites(run1);
      const second = readDateSites(run2);
      expect(first.electionDate).toEqual(second.electionDate);
      expect(first.dateAnswer).toEqual(second.dateAnswer);
    } finally {
      vi.useRealTimers();
    }
  });

  // The millisecond-precision date answer is the value a day-granularity comparison cannot see move, so it gets its own case at the smallest possible clock delta.
  it('the same seed produces byte-identical output across a one-millisecond clock delta', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-01-15T00:00:00.000Z'));
      const before = readDateSites(runPipeline(makeDateReachingTemplate()));
      vi.setSystemTime(new Date('2026-01-15T00:00:00.001Z'));
      const after = readDateSites(runPipeline(makeDateReachingTemplate()));

      expect(before.dateAnswer).toEqual(after.dateAnswer);
      expect(before.electionDate).toEqual(after.electionDate);
    } finally {
      vi.useRealTimers();
    }
  });

  // This negative control states the mechanism a fixed reference window relies on, so it stays green once such a window exists.
  // The two pipeline-level negative controls above are inverted by that change; this one is not, which is what makes it the durable statement of why the window works.
  it('negative control: faker date draws follow the system clock without a reference date and are pinned with one', () => {
    // A fresh seeded instance per measurement, so every draw below starts from the same RNG state and only the clock varies.
    const seeded = (): Faker => {
      const faker = new Faker({ locale: [en] });
      faker.seed(42);
      return faker;
    };
    const REFERENCE = new Date('2027-01-01T00:00:00.000Z');

    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-01-15T00:00:00.000Z'));
      const unpinnedFutureA = seeded().date.future({ years: 1 }).toISOString().slice(0, 10);
      const unpinnedRecentA = seeded().date.recent().toISOString();
      const pinnedFutureA = seeded().date.future({ years: 1, refDate: REFERENCE }).toISOString().slice(0, 10);
      const pinnedRecentA = seeded().date.recent({ refDate: REFERENCE }).toISOString();

      vi.setSystemTime(new Date('2026-09-15T00:00:00.000Z'));
      const unpinnedFutureB = seeded().date.future({ years: 1 }).toISOString().slice(0, 10);
      const unpinnedRecentB = seeded().date.recent().toISOString();
      const pinnedFutureB = seeded().date.future({ years: 1, refDate: REFERENCE }).toISOString().slice(0, 10);
      const pinnedRecentB = seeded().date.recent({ refDate: REFERENCE }).toISOString();

      // Without a reference date the draw is measured from `new Date()`, so it moves with the clock.
      expect(unpinnedFutureA).not.toEqual(unpinnedFutureB);
      expect(unpinnedRecentA).not.toEqual(unpinnedRecentB);

      // With one, the same seed produces byte-identical values at both clocks.
      expect(pinnedFutureA).toEqual(pinnedFutureB);
      expect(pinnedRecentA).toEqual(pinnedRecentB);
    } finally {
      vi.useRealTimers();
    }
  });
});
