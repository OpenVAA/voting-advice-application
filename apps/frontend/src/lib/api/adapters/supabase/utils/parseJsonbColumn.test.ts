import { configureLogger } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseAnswersColumn, parseImageColumn } from './parseJsonbColumn';
import type { LogRecord } from '@openvaa/app-shared';

/**
 * Specification for the adapter's two shared JSONB parse helpers — requirement **D8**, decisions **A2**, **B1(a)**, **B5** and **C5(b)**.
 *
 * Two cases in this file used to SPECIFY the retired posture, and ruling **D8** forbids deleting either. Both are inverted and renamed instead, because a name is a claim: a case whose name still described the old collapse would go on asserting the old contract in prose while its body asserted the new one. The malformed-required-member case keeps its outcome — dropping the required `path` makes the retry fail too, so there is genuinely no survivor — and now states that outcome through the outcome's own `status` rather than through a bare empty value. The nested-unrecognised-member case CHANGES outcome under **A2**: the offending top-level member is dropped, `{ path: 'a.png' }` re-parses cleanly, and the result is a usable image with the focal point discarded (research correction C-3).
 *
 * The fourth case in the first block is criterion 1 stated as an assertion at this site — a malformed image and an absent image are not equal. It is the same assertion, word for word, whose failure was recorded as ledger row 1's blind half against the pre-change tree, which is what makes the pair a round trip rather than two unrelated observations.
 *
 * Two assertion idioms survive both inversions unchanged, and deliberately so: the `records[0].attributes?.issues` path assertion, and the sentinel that the serialised record does not contain the offending VALUE (T-157-17). The `rejectedKeys` field this phase adds is the one attribute that reads FROM the offending object, so it gets its own sentinel — key NAMES may be disclosed, what was stored under them may not.
 *
 * The capture threshold below is unchanged from before the level promotion. Research correction **C-4** measured that `error` sits ABOVE `'warn'`, so no capture setup needs editing for C5(b); only the severity assertions change. Per C5's NOTE there are now zero `log.warn` sites in the non-test tree, and no case here counts records by level or expects a non-empty warn tier.
 */

const supabaseUrl = 'http://localhost:54321';

let records: Array<LogRecord>;

beforeEach(() => {
  records = [];
  configureLogger({ level: 'warn', sink: (record) => records.push(record) });
});

afterEach(() => {
  configureLogger({ level: 'silent', sink: undefined });
});

describe('parseImageColumn', () => {
  it('yields `ok` with an absolute URL derived from a valid stored image', () => {
    const result = parseImageColumn({ path: 'proj/logo.png' }, supabaseUrl, { column: 'elections.image', id: 'e1' });

    expect(result.status).toBe('ok');
    expect(result.value?.url).toBe('http://localhost:54321/storage/v1/object/public/public-assets/proj/logo.png');
    expect(records).toHaveLength(0);
  });

  it('yields `absent` and emits no record for an absent column', () => {
    expect(parseImageColumn(null, supabaseUrl, { column: 'elections.image' })).toEqual({ status: 'absent' });
    expect(parseImageColumn(undefined, supabaseUrl, { column: 'elections.image' })).toEqual({ status: 'absent' });
    expect(records).toHaveLength(0);
  });

  it('yields `malformed` with no survivor when the required path member is unacceptable', () => {
    const result = parseImageColumn({ path: 42 }, supabaseUrl, { column: 'elections.image', id: 'e1' });

    expect(result.status).toBe('malformed');
    expect(result.value).toBeUndefined();
    expect(records).toHaveLength(1);
    expect(records[0].severityText).toBe('ERROR');
    expect(records[0].attributes).toEqual({
      column: 'elections.image',
      id: 'e1',
      issues: ['path'],
      rejectedKeys: [],
      preserved: false
    });
  });

  it('distinguishes a malformed stored image from an absent one', () => {
    const malformed = parseImageColumn({ path: 42 }, supabaseUrl, { column: 'elections.image', id: 'e1' });
    const absent = parseImageColumn(null, supabaseUrl, { column: 'elections.image', id: 'e1' });

    expect(malformed).not.toEqual(absent);
    expect(malformed.status).toBe('malformed');
    expect(absent.status).toBe('absent');
  });

  it('yields a usable image with the focal point discarded when a nested member is unrecognised', () => {
    const result = parseImageColumn({ path: 'a.png', focalPoint: { x: 1, y: 2, bogus: 3 } }, supabaseUrl, {
      column: 'elections.image'
    });

    expect(result.status).toBe('malformed');
    expect(result.value?.url).toBe('http://localhost:54321/storage/v1/object/public/public-assets/a.png');
    expect(records).toHaveLength(1);
    expect(records[0].severityText).toBe('ERROR');
    expect(records[0].attributes?.issues).toEqual(['focalPoint']);
    expect(records[0].attributes?.preserved).toBe(true);
  });

  it('never carries the offending value into the record', () => {
    parseImageColumn({ path: 'a.png', secretKey: 'do-not-log-me' }, supabaseUrl, { column: 'candidates.image' });

    // The refused KEY name is disclosed; what was stored under it is not (T-157-17).
    expect(records[0].attributes?.rejectedKeys).toEqual(['secretKey']);
    expect(JSON.stringify(records[0])).not.toContain('do-not-log-me');
  });
});

describe('parseAnswersColumn', () => {
  it('yields `ok` with the validated stored answers unchanged', () => {
    const stored = { q1: { value: 3, info: { en: 'Because' } }, q2: { value: ['a', 'b'] }, q3: null };

    const result = parseAnswersColumn(stored, { column: 'candidates.answers', id: 'c1' });

    expect(result).toEqual({ status: 'ok', value: stored });
    expect(records).toHaveLength(0);
  });

  it('yields `absent` and emits no record for an absent column', () => {
    expect(parseAnswersColumn(null, { column: 'candidates.answers' })).toEqual({ status: 'absent' });
    expect(records).toHaveLength(0);
  });

  it('keeps the acceptable question ids and drops only the one carrying an unknown key', () => {
    const result = parseAnswersColumn(
      { q1: { value: 3, bogusAnswerKey: true }, q2: { value: 'ok' } },
      {
        column: 'candidates.answers',
        id: 'c1'
      }
    );

    expect(result.status).toBe('malformed');
    expect(result.value).toEqual({ q2: { value: 'ok' } });
    expect(records).toHaveLength(1);
    expect(records[0].severityText).toBe('ERROR');
    expect(records[0].attributes).toEqual({
      column: 'candidates.answers',
      id: 'c1',
      issues: ['q1'],
      rejectedKeys: ['bogusAnswerKey'],
      preserved: true
    });
  });
});
