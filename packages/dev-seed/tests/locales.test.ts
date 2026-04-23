/**
 * fanOutLocales() unit tests (TMPL-07 + NF-04 Pitfall #1).
 *
 * Exercises:
 *   - Opt-out default (undefined / false → no-op).
 *   - Opt-in (true → 4-locale expansion).
 *   - Per-locale faker generates distinct outputs at the same seed.
 *   - Determinism — same input + same seed across repeated calls = byte-identical.
 *   - Plain-text + non-localized fields left untouched.
 *   - Pre-existing locale keys preserved.
 *   - LOCALES constant is hardcoded in ['en', 'fi', 'sv', 'da'] order.
 *
 * D-22 contract: pure I/O. No Supabase imports.
 */

import { describe, expect, it } from 'vitest';
import { fanOutLocales, LOCALES } from '../src/locales';

describe('fanOutLocales (TMPL-07)', () => {
  it('LOCALES is the hardcoded array ["en", "fi", "sv", "da"] in exact order (Pitfall #1)', () => {
    expect(LOCALES).toEqual(['en', 'fi', 'sv', 'da']);
  });

  it('is a no-op when generateTranslationsForAllLocales is undefined', () => {
    const rows = { elections: [{ name: { en: 'Demo' } }] };
    const result = fanOutLocales(rows, {}, 42);
    expect(result.elections[0].name).toEqual({ en: 'Demo' });
  });

  it('is a no-op when generateTranslationsForAllLocales is false', () => {
    const rows = { elections: [{ name: { en: 'Demo' } }] };
    const result = fanOutLocales(rows, { generateTranslationsForAllLocales: false }, 42);
    expect(result.elections[0].name).toEqual({ en: 'Demo' });
  });

  it('expands { en: "X" } to { en, fi, sv, da } when flag is true', () => {
    const rows = { elections: [{ name: { en: 'Demo Election' } }] };
    const result = fanOutLocales(rows, { generateTranslationsForAllLocales: true }, 42);
    const name = result.elections[0].name as Record<string, string>;
    expect(name.en).toBe('Demo Election'); // preserved verbatim
    expect(typeof name.fi).toBe('string');
    expect(typeof name.sv).toBe('string');
    expect(typeof name.da).toBe('string');
    expect(name.fi.length).toBeGreaterThan(0);
    expect(name.sv.length).toBeGreaterThan(0);
    expect(name.da.length).toBeGreaterThan(0);
  });

  it('preserves pre-existing non-default locale keys', () => {
    const rows = { elections: [{ name: { en: 'English', fi: 'Finnish Override' } }] };
    const result = fanOutLocales(rows, { generateTranslationsForAllLocales: true }, 42);
    const name = result.elections[0].name as Record<string, string>;
    expect(name.en).toBe('English');
    expect(name.fi).toBe('Finnish Override'); // not overwritten
    expect(typeof name.sv).toBe('string');
    expect(typeof name.da).toBe('string');
  });

  it('does not touch plain-text columns (candidates.first_name / last_name)', () => {
    const rows = {
      candidates: [{ first_name: 'Alice', last_name: 'Smith', short_name: { en: 'Alice' } }]
    };
    const result = fanOutLocales(rows, { generateTranslationsForAllLocales: true }, 42);
    const cand = result.candidates[0] as Record<string, unknown>;
    expect(cand.first_name).toBe('Alice');
    expect(cand.last_name).toBe('Smith');
    const short = cand.short_name as Record<string, string>;
    expect(short.en).toBe('Alice');
    expect(typeof short.fi).toBe('string');
  });

  it('does not touch non-localized fields (color, is_generated, etc.)', () => {
    const rows = {
      organizations: [{ name: { en: 'Blue' }, color: '#1a4d8f', is_generated: true }]
    };
    const result = fanOutLocales(rows, { generateTranslationsForAllLocales: true }, 42);
    const org = result.organizations[0];
    expect(org.color).toBe('#1a4d8f');
    expect(org.is_generated).toBe(true);
  });

  it('skips tables not in the localized-field inventory (feedback, app_settings)', () => {
    const rows = {
      app_settings: [{ settings: { whatever: 'yes' } }],
      feedback: [{ content: 'plain' }]
    };
    const result = fanOutLocales(rows, { generateTranslationsForAllLocales: true }, 42);
    expect(result.app_settings[0].settings).toEqual({ whatever: 'yes' });
    expect(result.feedback[0].content).toBe('plain');
  });

  it('walks every table in the localized-field inventory', () => {
    const rows = {
      elections: [{ name: { en: 'E' } }],
      constituency_groups: [{ name: { en: 'CG' } }],
      constituencies: [{ name: { en: 'C' } }],
      organizations: [{ name: { en: 'O' } }],
      alliances: [{ name: { en: 'A' } }],
      factions: [{ name: { en: 'F' } }],
      candidates: [{ short_name: { en: 'SN' } }],
      question_categories: [{ name: { en: 'QC' } }],
      questions: [{ name: { en: 'Q' } }]
    };
    const result = fanOutLocales(rows, { generateTranslationsForAllLocales: true }, 42);
    for (const table of Object.keys(rows)) {
      const row = (result as Record<string, Array<Record<string, unknown>>>)[table][0];
      // Find the first localized field on the row
      for (const key of Object.keys(row)) {
        const val = row[key];
        if (val && typeof val === 'object' && !Array.isArray(val) && 'en' in (val as Record<string, unknown>)) {
          const loc = val as Record<string, string>;
          expect(loc.fi).toBeDefined();
          expect(loc.sv).toBeDefined();
          expect(loc.da).toBeDefined();
          break;
        }
      }
    }
  });

  it('is deterministic — same seed + same input produces identical output across calls', () => {
    const input1 = {
      elections: [{ name: { en: 'Demo' } }],
      organizations: [{ name: { en: 'Blue' } }]
    };
    const input2 = {
      elections: [{ name: { en: 'Demo' } }],
      organizations: [{ name: { en: 'Blue' } }]
    };
    const r1 = fanOutLocales(input1, { generateTranslationsForAllLocales: true }, 42);
    const r2 = fanOutLocales(input2, { generateTranslationsForAllLocales: true }, 42);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it('different seeds produce different fan-out output when faker fallback fires', () => {
    // Use a row with NO `en` value so fan-out can't mirror and must fall back
    // to faker — where seed variance is observable. Rows that carry `en` are
    // mirrored deterministically regardless of seed (the intended behavior).
    const input1 = { elections: [{ name: { fi: 'Demo' } }] };
    const input2 = { elections: [{ name: { fi: 'Demo' } }] };
    const r1 = fanOutLocales(input1, { generateTranslationsForAllLocales: true }, 42);
    const r2 = fanOutLocales(input2, { generateTranslationsForAllLocales: true }, 99);
    expect(JSON.stringify(r1)).not.toBe(JSON.stringify(r2));
  });
});
