/**
 * Template validation tests (TMPL-02 + TMPL-09).
 *
 * Covers:
 *   - TMPL-02: `{}` template passes validation — every field is `.optional()`
 *     per D-18.
 *   - TMPL-09: zod validation errors include the offending field path in the
 *     format `template.<field>.<subfield>` (formatted via `issues[].path.join('.')`).
 *   - All 12 per-entity fragments (`elections` through `feedback`) are accepted
 *     simultaneously — every non-system public table has a schema slot.
 *   - `fixed[]` pass-through: arbitrary partial row shapes are accepted
 *     (`z.record(z.string(), z.unknown())`) so user-authored fixtures need not
 *     enumerate every DB column.
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
import { validateTemplate } from '../src/template/schema';

describe('validateTemplate', () => {
  it('TMPL-02: {} template passes validation (every field is optional per D-18)', () => {
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
});
