import { configureLogger } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isValidResult } from './isValidResult';
import type { LogRecord } from '@openvaa/app-shared';
import type { DPDataType } from '../base/dataTypes';

/**
 * Specification for the `DataProvider` result-validity guard — threat **T-157.1-03**, decision **D-DISC-8**, and the shape rule in `157.1-RESEARCH.md` § "What \"pino/OTel-conformant\" concretely means here (C4 NOTE 1)".
 *
 * This helper's record was written when `error` was a DEVELOPER-ONLY level: `hooks.server.ts` configured the logger to `'silent'` outside `DEV || PUBLIC_DEBUG`, so nothing it emitted ever left a developer's terminal. Requirement **D9** ended that in `157.1-02` — production now runs at `'warn'`, so every `error` record in this tree became collectable from container stdout for the first time. That promotion is what turns this file's interpolation from untidy into a disclosure: the `result instanceof Error` branch copied a PROVIDER error's own `message` into the log message, and on this stack a PostgREST/Supabase error message can echo the query text that produced it.
 *
 * The helper also sits directly on the settings path this phase rebuilt — `+layout.svelte:72-77` guards `appSettingsData` and `appCustomizationData` through it — so a malformed `app_settings.settings` column now travels through here on its way to a production sink.
 *
 * Two things are therefore specified, and only two. The BOOLEAN CONTRACT is unchanged and is asserted first, case for case, because the restructure must not move it: research open question 4 scoped this to the record's shape. The RECORD SHAPE is then asserted against C4 NOTE 1's three standing obligations — a CONSTANT message, the varying parts in a FLAT attribute bag, and exactly ONE record per failing call.
 *
 * The sentinel idiom is the one the adapter specs already use for the never-log-the-value rule (`parseOutcome.test.ts:158`, `supabaseAdminWriter.test.ts:345-366`): plant a distinguishable string in the offending input, serialise the WHOLE record, and assert the string is absent while the diagnostic that IS allowed — here the branch reason — is present. Serialising the whole record rather than checking `msg` alone is deliberate: it also catches a future edit that "fixes" the message by moving the provider text into `err` or into an attribute, where `serialiseError` would carry both its `message` and its `stack` into the same sink.
 */

/** Planted inside a provider error's own message. Must never reach the record. */
const SENTINEL = 'SENTINEL_PROVIDER_ERROR_TEXT_SELECT_email_FROM_users';

let records: Array<LogRecord>;

beforeEach(() => {
  records = [];
  // `'warn'` matches the capture harness every other spec in this phase uses (`parseOutcome.test.ts:38`); `error` sits above it, so the threshold needs no edit for the C5(b) promotion.
  configureLogger({ level: 'warn', sink: (record) => records.push(record) });
});

afterEach(() => {
  configureLogger({ level: 'silent', sink: undefined });
});

/** A non-empty result of a collection type whose emptiness is decided by array length. */
const NON_EMPTY = [{ id: 'e1' }] as unknown as DPDataType['entities'];

describe('isValidResult — the boolean contract, unchanged by the restructure', () => {
  it('returns false for a nullish result', () => {
    expect(isValidResult<'entities'>(null)).toBe(false);
    expect(isValidResult<'entities'>(undefined)).toBe(false);
  });

  it('returns false for an Error result', () => {
    expect(isValidResult<'entities'>(new Error('boom'))).toBe(false);
  });

  it('returns false for an empty result when empties are disallowed, and true when they are allowed', () => {
    expect(isValidResult<'entities'>([] as unknown as DPDataType['entities'])).toBe(false);
    expect(isValidResult<'entities'>([] as unknown as DPDataType['entities'], { allowEmpty: true })).toBe(true);
  });

  it('returns true for a non-empty result, and emits nothing', () => {
    expect(isValidResult<'entities'>(NON_EMPTY)).toBe(true);
    expect(records).toHaveLength(0);
  });
});

describe('isValidResult — the record shape (C4 NOTE 1)', () => {
  it('emits exactly one record per failing call, at `error` severity', () => {
    isValidResult<'entities'>(null);

    expect(records).toHaveLength(1);
    expect(records[0].severityText).toBe('ERROR');
  });

  it('reports each of the three branches under the SAME constant message, with the branch in a flat attribute', () => {
    isValidResult<'entities'>(null);
    isValidResult<'entities'>(new Error('boom'));
    isValidResult<'entities'>([] as unknown as DPDataType['entities']);

    expect(records).toHaveLength(3);
    // One constant message for the event, not three interpolations of it. A downstream sink keys events on a stable `msg`.
    expect(new Set(records.map((record) => record.msg)).size).toBe(1);
    expect(records.map((record) => record.attributes?.reason)).toEqual(['nullish', 'error', 'empty']);
  });

  it('carries the data key as a flat attribute when the caller names one', () => {
    isValidResult<'appSettings'>(null, { dataKey: 'appSettings' });

    expect(records[0].attributes?.dataKey).toBe('appSettings');
  });

  // WR-09. `isEmpty` used to end in `throw new Error('Unsupported data type')`, inside a helper documented as a boolean type guard and called with no `try` from a `$derived.by` in `routes/+layout.svelte` and in sequence in `lib/admin/utils/loadElectionData.ts`. Both reach it through an `as DPDataType[...]` cast over values returned by a `.catch((e) => e)` chain, so any of the shapes below turned a validation call into an exception — thrown, in the layout's case, from inside a `$derived` evaluation.
  // `NaN` is falsy, so it is rejected one branch earlier, by the existing nullish guard; the expected reason travels with the case rather than being asserted uniformly.
  it.each([
    ['a string', 'a plain string', 'empty'],
    ['a number', 42, 'empty'],
    ['a boolean', true, 'empty'],
    ['NaN', Number.NaN, 'nullish']
  ])('returns false rather than throwing for %s, and still reports the branch', (_case, value, reason) => {
    expect(() => isValidResult<'entities'>(value as unknown as DPDataType['entities'])).not.toThrow();
    expect(isValidResult<'entities'>(value as unknown as DPDataType['entities'])).toBe(false);
    // Not swallowed: the rejection still reaches the structured record with its branch named.
    expect(records.at(-1)?.attributes?.reason).toBe(reason);
  });

  // T-157.1-03. A provider error message can echo the query text that produced it; the branch that fired may be disclosed, the provider's own text may not. The whole record is serialised, so moving the text into `err` or into an attribute fails here too.
  it('does not let a provider error’s own text reach the serialised record, while the branch reason does', () => {
    isValidResult<'entities'>(new Error(SENTINEL));

    const serialised = JSON.stringify(records);

    expect(serialised).not.toContain(SENTINEL);
    expect(records[0].attributes?.reason).toBe('error');
  });
});
