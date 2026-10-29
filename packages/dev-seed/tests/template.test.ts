/**
 * Template validation tests.
 *
 * Covers:
 *   - `{}` template passes validation — every field is `.optional()`.
 *   zod validation errors include the offending field path in the format `template.<field>.<subfield>` (formatted via `issues[].path.join('.')`).
 *   - All 12 per-entity fragments (`elections` through `feedback`) are accepted simultaneously — every non-system public table has a schema slot.
 *   - `fixed[]` pass-through: arbitrary partial row shapes are accepted (`z.record(z.string(), z.unknown())`) so user-authored fixtures need not enumerate every DB column.
 *
 * contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc `.
 */

import { describe, expect, it } from 'vitest';
import { TemplateSchema, validateTemplate } from '../src/template/schema';

describe('validateTemplate', () => {
  it('TMPL-02: {} template passes validation (every field is optional)', () => {
    expect(() => validateTemplate({})).not.toThrow();
    expect(validateTemplate({})).toEqual({});
  });

  it('TMPL-09: nested field-path error — candidates.count: "not-a-number"', () => {
    expect(() => validateTemplate({ candidates: { count: 'not-a-number' } })).toThrow(/template\.candidates\.count/);
  });

  it('TMPL-09: top-level field-path error — seed: "forty-two"', () => {
    expect(() => validateTemplate({ seed: 'forty-two' })).toThrow(/template\.seed/);
  });

  it('TMPL-09: invalid UUID projectId produces `template.projectId` path error', () => {
    expect(() => validateTemplate({ projectId: 'not-a-uuid' })).toThrow(/template\.projectId/);
  });

  it('accepts valid top-level fields (seed, externalIdPrefix, projectId)', () => {
    expect(() =>
      validateTemplate({
        seed: 42,
        externalIdPrefix: 'test_',
        projectId: '00000000-0000-0000-0000-000000000001'
      })
    ).not.toThrow();
  });

  it('accepts nested fixed[] with arbitrary partial row shapes (z.unknown values)', () => {
    expect(() =>
      validateTemplate({
        candidates: {
          fixed: [{ first_name: 'Alice', external_id: 'my_cand' }]
        }
      })
    ).not.toThrow();
  });

  it('accepts per-entity fragment for every expected key (12 non-system public tables)', () => {
    const allEntities = {
      elections: { count: 1 },
      constituency_groups: { count: 1 },
      constituencies: { count: 1 },
      organizations: { count: 1 },
      alliances: { count: 1 },
      factions: { count: 1 },
      candidates: { count: 1 },
      question_categories: { count: 1 },
      questions: { count: 1 },
      nominations: { count: 1 },
      app_settings: { count: 1 },
      feedback: { count: 1 }
    };
    expect(() => validateTemplate(allEntities)).not.toThrow();
  });

  // generateTranslationsForAllLocales field

  it('TMPL-07: accepts generateTranslationsForAllLocales: true', () => {
    const result = validateTemplate({ generateTranslationsForAllLocales: true });
    expect(result.generateTranslationsForAllLocales).toBe(true);
  });

  it('TMPL-07: accepts generateTranslationsForAllLocales: false', () => {
    const result = validateTemplate({ generateTranslationsForAllLocales: false });
    expect(result.generateTranslationsForAllLocales).toBe(false);
  });

  it('TMPL-07: rejects non-boolean generateTranslationsForAllLocales with field-path error', () => {
    expect(() => validateTemplate({ generateTranslationsForAllLocales: 'yes' as unknown as boolean })).toThrow(
      /template\.generateTranslationsForAllLocales/
    );
  });

  it('TMPL-07: {} still passes (field remains optional per TMPL-02)', () => {
    expect(() => validateTemplate({})).not.toThrow();
  });

  // ── The strictness behaviour the four blind "accepts field X" sites above depend on. Without `.strict()` on BOTH objects, every one of those sites passes with its declaration deleted from the schema, because a non-strict zod object silently STRIPS unknown keys.
  //
  // zod 4.3.6 emits `unrecognized_keys` with `path` relative to the OFFENDING OBJECT — `[]` at the top level and `['candidates']` inside a fragment — so `validateTemplate`'s formatter renders them as `template.: …` and `template.candidates: …` respectively. Measured, not assumed.

  it('ASSERT-04: rejects an unknown TOP-LEVEL key (TemplateSchema.strict())', () => {
    expect(() => validateTemplate({ seed: 42, bogusTopLevel: 1 })).toThrow(
      /template\.:.*Unrecognized key.*"bogusTopLevel"/
    );
  });

  it('ASSERT-04: rejects an unknown key INSIDE a per-entity fragment (perEntityFragment.strict())', () => {
    // Top-level strictness alone does NOT reach here: measured at zod 4.3.6, a top-level-only strict schema parses this input with SUCCESS and silently strips `bogusFragmentKey`. This case is why `perEntityFragment` is strict too.
    expect(() =>
      validateTemplate({
        candidates: { fixed: [{ external_id: 'my_cand' }], bogusFragmentKey: 3 }
      })
    ).toThrow(/template\.candidates:.*Unrecognized key.*"bogusFragmentKey"/);
  });

  it('still ACCEPTS an arbitrary key inside a fixed[] row — row keys are `assertKnownRowProps`’ authority, not zod’s', () => {
    // Deliberately NOT tightened at the zod layer. The row-level allow-list is per-collection and derived; duplicating it into zod would create a second authority that can drift from LINK_SENTINELS. The round-trip proves the key is neither rejected NOR stripped — it reaches the runtime guard intact.
    const input = { candidates: { fixed: [{ external_id: 'my_cand', totally_made_up_column: 1 }] } };
    expect(validateTemplate(input)).toEqual(input);
  });

  it('`.strict()` does not break the `.extend({ latent })` chain link', () => {
    const input = { latent: { dimensions: 2, eigenvalues: [1, 0.5] } };
    expect(validateTemplate(input)).toEqual(input);
  });

  // The `external_id` requirement on a `fixed[]` row lives OUTSIDE the zod layer, and these two cases hold both halves of that seam apart: the schema alone accepts a row with no id, and the row assertion `validateTemplate` runs after it is what rejects the row.
  // Absent and empty-string reach the same branch through different halves of its `typeof … !== 'string' || … === ''` condition, so each gets its own case.

  it('a fixed row with no external_id is accepted by the schema layer alone and rejected by validateTemplate', () => {
    const badRow = { elections: { count: 0, fixed: [{ name: { en: 'x' } }] } };
    expect(TemplateSchema.safeParse(badRow).success).toBe(true);
    expect(() => validateTemplate(badRow)).toThrow(
      /template\.elections\.fixed\[0\]\.external_id: Expected a non-empty string/
    );
  });

  it('a fixed row with an empty-string external_id is rejected with the same field path', () => {
    const badRow = { elections: { count: 0, fixed: [{ external_id: '', name: { en: 'x' } }] } };
    expect(() => validateTemplate(badRow)).toThrow(
      /template\.elections\.fixed\[0\]\.external_id: Expected a non-empty string/
    );
  });

  // `refDate` is declared in the authoring type AND here in the strict schema, and both halves have to ship together: the schema closes strict and every loader branch runs through it, so a type-only field would be rejected as an unknown key at seed time.
  // The reject case is what proves the schema half actually landed — without it a half-done mirror looks correct in the editor and fails only when someone seeds.

  it('accepts a template-level refDate override', () => {
    const input = { seed: 42, refDate: '2030-06-01T00:00:00.000Z' };
    expect(() => validateTemplate(input)).not.toThrow();
    expect(validateTemplate(input)).toEqual(input);
  });

  it('rejects a refDate that is not an ISO datetime', () => {
    expect(() => validateTemplate({ refDate: '2030-06-01' })).toThrow(/template\.refDate/);
  });

  // The guard reads `non-empty` as a raw string-length check rather than a trimmed-length one, so an id made only of spaces passes.
  // The case below exists to make that boundary visible and re-measurable, not to endorse it — tightening the guard to reject whitespace-only ids is a separate change nobody has agreed to yet.

  it('boundary: a whitespace-only external_id is currently accepted', () => {
    const input = { elections: { count: 0, fixed: [{ external_id: '   ', name: { en: 'x' } }] } };
    expect(() => validateTemplate(input)).not.toThrow();
    expect(validateTemplate(input)).toEqual(input);
  });
});
