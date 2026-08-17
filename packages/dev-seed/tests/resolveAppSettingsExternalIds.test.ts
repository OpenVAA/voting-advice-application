/**
 * Unit tests for `resolveAppSettingsExternalIds` + `settingsContainsExternalIdRefs`
 * (see phase 88 Plan 04 T3 — Option B seed-time resolver).
 *
 * Covers:
 *   - String passthrough: legacy `question: '<uuid>'` shape unchanged.
 *   - {externalId} branch: resolved to the mapped UUID.
 *   - Missing externalId: throws with the offending path + missing id.
 *   - Forward-compatible paths: organization + alliance behave identically.
 *   - `settingsContainsExternalIdRefs` gate: true when ANY {externalId}
 *     shape is present at any handled path; false otherwise.
 *
 * Pure-function tests. No Supabase dependency.
 */

import { describe, expect, it } from 'vitest';
import { resolveAppSettingsExternalIds, settingsContainsExternalIdRefs } from '../src/resolveAppSettingsExternalIds';

describe('resolveAppSettingsExternalIds', () => {
  it('passes plain string `question` entries through unchanged (legacy UUID branch)', () => {
    const settings = {
      results: {
        cardContents: {
          candidate: ['submatches', { question: 'some-uuid-already-resolved' }]
        }
      }
    };
    const map = new Map<string, string>();
    const out = resolveAppSettingsExternalIds(settings, map);
    expect(out).toEqual(settings);
    // No externalId refs → returns the input reference (cheap short-circuit).
    expect(out).toBe(settings);
  });

  it('resolves {externalId} → UUID for results.cardContents.candidate', () => {
    const settings = {
      results: {
        cardContents: {
          candidate: ['submatches', { question: { externalId: 'test-qu-info-text' } }]
        }
      }
    };
    const map = new Map<string, string>([['test-qu-info-text', 'uuid-abc']]);
    const out = resolveAppSettingsExternalIds(settings, map);
    expect(out).toEqual({
      results: {
        cardContents: {
          candidate: ['submatches', { question: 'uuid-abc' }]
        }
      }
    });
    // Does NOT mutate the input.
    expect((settings.results.cardContents.candidate[1] as { question: unknown }).question).toEqual({
      externalId: 'test-qu-info-text'
    });
  });

  it('throws with the path + missing id when an externalId is unresolved', () => {
    const settings = {
      results: {
        cardContents: {
          candidate: [{ question: { externalId: 'missing-id' } }]
        }
      }
    };
    const map = new Map<string, string>();
    expect(() => resolveAppSettingsExternalIds(settings, map)).toThrow(/missing-id/);
    expect(() => resolveAppSettingsExternalIds(settings, map)).toThrow(/cardContents\.candidate/);
  });

  it('resolves {externalId} → UUID for results.cardContents.organization (forward-compat path)', () => {
    const settings = {
      results: {
        cardContents: {
          organization: ['children', { question: { externalId: 'test-qu-org' } }]
        }
      }
    };
    const map = new Map<string, string>([['test-qu-org', 'uuid-org']]);
    const out = resolveAppSettingsExternalIds(settings, map);
    expect(out).toEqual({
      results: {
        cardContents: {
          organization: ['children', { question: 'uuid-org' }]
        }
      }
    });
  });

  it('resolves {externalId} → UUID for results.cardContents.alliance (forward-compat path)', () => {
    const settings = {
      results: {
        cardContents: {
          alliance: [{ question: { externalId: 'test-qu-al' } }, 'children']
        }
      }
    };
    const map = new Map<string, string>([['test-qu-al', 'uuid-al']]);
    const out = resolveAppSettingsExternalIds(settings, map);
    expect(out).toEqual({
      results: {
        cardContents: {
          alliance: [{ question: 'uuid-al' }, 'children']
        }
      }
    });
  });

  it('preserves entries that lack a question field (e.g. literal strings like "submatches")', () => {
    const settings = {
      results: {
        cardContents: {
          candidate: ['submatches', 'children', { question: { externalId: 'test-qu-info-text' } }]
        }
      }
    };
    const map = new Map<string, string>([['test-qu-info-text', 'uuid-abc']]);
    const out = resolveAppSettingsExternalIds(settings, map);
    const arr = (out.results as { cardContents: { candidate: Array<unknown> } }).cardContents.candidate;
    expect(arr[0]).toBe('submatches');
    expect(arr[1]).toBe('children');
    expect(arr[2]).toEqual({ question: 'uuid-abc' });
  });

  it('preserves sibling settings keys (e.g. results.showFeedbackPopup) verbatim', () => {
    const settings = {
      entityDetails: { contents: { candidate: ['info', 'opinions'] } },
      results: {
        cardContents: {
          candidate: [{ question: { externalId: 'test-qu-info-text' } }]
        },
        showFeedbackPopup: 180,
        sections: ['candidate', 'organization']
      }
    };
    const map = new Map<string, string>([['test-qu-info-text', 'uuid-abc']]);
    const out = resolveAppSettingsExternalIds(settings, map);
    expect(out.entityDetails).toEqual(settings.entityDetails);
    const results = out.results as Record<string, unknown>;
    expect(results.showFeedbackPopup).toBe(180);
    expect(results.sections).toEqual(['candidate', 'organization']);
  });

  it('is a short-circuit pass-through when no externalId refs are present (returns same reference)', () => {
    const settings = {
      results: {
        cardContents: {
          candidate: ['submatches'],
          organization: ['children']
        },
        showFeedbackPopup: 180
      }
    };
    const out = resolveAppSettingsExternalIds(settings, new Map());
    expect(out).toBe(settings);
  });
});

describe('settingsContainsExternalIdRefs', () => {
  it('returns true when any candidate[*].question is an {externalId} shape', () => {
    expect(
      settingsContainsExternalIdRefs({
        results: { cardContents: { candidate: [{ question: { externalId: 'x' } }] } }
      })
    ).toBe(true);
  });

  it('returns true for organization / alliance paths too', () => {
    expect(
      settingsContainsExternalIdRefs({
        results: { cardContents: { organization: [{ question: { externalId: 'x' } }] } }
      })
    ).toBe(true);
    expect(
      settingsContainsExternalIdRefs({
        results: { cardContents: { alliance: [{ question: { externalId: 'x' } }] } }
      })
    ).toBe(true);
  });

  it('returns false when all entries are strings or string-question shapes', () => {
    expect(
      settingsContainsExternalIdRefs({
        results: {
          cardContents: {
            candidate: ['submatches', { question: 'some-uuid' }],
            organization: ['children'],
            alliance: ['children']
          }
        }
      })
    ).toBe(false);
  });

  it('returns false for empty / missing settings', () => {
    expect(settingsContainsExternalIdRefs({})).toBe(false);
    expect(settingsContainsExternalIdRefs(null)).toBe(false);
    expect(settingsContainsExternalIdRefs(undefined)).toBe(false);
    expect(settingsContainsExternalIdRefs({ results: {} })).toBe(false);
    expect(settingsContainsExternalIdRefs({ results: { cardContents: {} } })).toBe(false);
  });
});
