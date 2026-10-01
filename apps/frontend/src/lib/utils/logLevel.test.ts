import { configureLogger } from '@openvaa/app-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveLogLevel } from './logLevel';
import type { LogRecord } from '@openvaa/app-shared';

/**
 * Specification for `resolveLogLevel`: the four emittable levels, `'silent'` rejected as `invalid`, a missing value kept distinct from an invalid one, no throw for any input, and the entry point configuring the logger before it reports the fallback.
 */

/** The browser entry point the ordering case drives. Resolved at call time so the case reads the module the entry point itself imports, rather than a snapshot taken before `vi.resetModules()`. */
const HOOKS_CLIENT_MODULE = '../../hooks.client';

/** The four levels a record can carry, restated locally so the never-throws case asserts against the contract rather than against the implementation's own export. */
const EMITTABLE_LEVELS: ReadonlyArray<string> = ['debug', 'info', 'warn', 'error'];

afterEach(() => {
  configureLogger({ level: 'silent', sink: undefined });
});

describe('resolveLogLevel', () => {
  it('resolves an unset value to the `warn` fallback and reports a `missing` problem', () => {
    expect(resolveLogLevel(undefined, false, false)).toEqual({ level: 'warn', problem: { reason: 'missing' } });
  });

  it('treats an empty-string value exactly as unset', () => {
    expect(resolveLogLevel('', false, false)).toEqual({ level: 'warn', problem: { reason: 'missing' } });
  });

  it('resolves each valid level to itself and reports no problem at all', () => {
    for (const level of ['debug', 'info', 'warn', 'error'] as const) {
      expect(resolveLogLevel(level, false, false)).toEqual({ level });
    }
  });

  it('normalises case and surrounding whitespace before the vocabulary check', () => {
    expect(resolveLogLevel('  WARN  ', false, false)).toEqual({ level: 'warn' });
  });

  it('resolves an out-of-vocabulary value to the fallback and names the provided value', () => {
    expect(resolveLogLevel('verbose', false, false)).toEqual({
      level: 'warn',
      problem: { reason: 'invalid', provided: 'verbose' }
    });
  });

  // `'silent'` is a logger threshold, not an emittable level: accepting it would silence the logs without a record.
  it('treats the literal `silent` as out-of-vocabulary rather than accepting it', () => {
    expect(resolveLogLevel('silent', false, false)).toEqual({
      level: 'warn',
      problem: { reason: 'invalid', provided: 'silent' }
    });
  });

  it('keeps `debug` in a development build when nothing is set, and still reports `missing`', () => {
    expect(resolveLogLevel(undefined, true, false)).toEqual({ level: 'debug', problem: { reason: 'missing' } });
  });

  // Both entry points call this at module scope, so a throw would stop the app booting. The value comes from the process environment, so non-string inputs are reachable despite the `string` type.
  it('never throws, for any input, including a non-string', () => {
    const hostile: ReadonlyArray<unknown> = [null, 0, 1, true, false, {}, [], Symbol('warn'), () => 'warn', NaN];

    for (const value of hostile) {
      expect(() => resolveLogLevel(value as string | undefined, false, false)).not.toThrow();
      expect(EMITTABLE_LEVELS).toContain(resolveLogLevel(value as string | undefined, false, false).level);
    }
  });
});

/**
 * Drive the browser entry point against a freshly reset module registry and collect what it emits.
 *
 * The order matters: `vi.resetModules()` re-evaluates `@openvaa/app-shared` too, so reset first, install the sink on the fresh logger instance, set the environment on the fresh env module, and import the entry point last.
 *
 * The level stays `'silent'`: `configureLogger` merges rather than replaces, so the sink survives the entry point's own `configureLogger({ level })` call, and a record is captured only if that call raised the level first.
 * @param publicLogLevel - The raw `PUBLIC_LOG_LEVEL` the entry point should see. Omitted means unset.
 * @returns Every record the entry point emitted.
 */
async function captureEntryPointRecords(publicLogLevel?: string): Promise<Array<LogRecord>> {
  const records: Array<LogRecord> = [];

  vi.resetModules();
  const { configureLogger: configureFreshLogger } = await import('@openvaa/app-shared');
  configureFreshLogger({ level: 'silent', sink: (record) => records.push(record) });

  const { env } = await import('$env/dynamic/public');
  // reason: `Reflect.deleteProperty`, not `delete`: the generated type of `$env/dynamic/public` makes `PUBLIC_LOG_LEVEL` required when `.env` defines it, as the CI copy of `.env.example` does, and `delete` of a required property does not type-check.
  if (publicLogLevel === undefined) Reflect.deleteProperty(env, 'PUBLIC_LOG_LEVEL');
  else env.PUBLIC_LOG_LEVEL = publicLogLevel;

  await import(/* @vite-ignore */ HOOKS_CLIENT_MODULE);

  return records;
}

describe('the fallback record is emitted after the fallback level is in force', () => {
  // `configureLogger` runs first and the record about the fallback second; in the other order the `'silent'` threshold drops the record. {@link captureEntryPointRecords} explains why the capture discriminates.
  it('captures exactly one `info` record when `PUBLIC_LOG_LEVEL` is unset', async () => {
    const records = await captureEntryPointRecords();

    expect(records).toHaveLength(1);
    // An unset variable has a documented default, and this entry point runs on every page load, so it is reported at `info` rather than `error`.
    expect(records[0].severityText).toBe('INFO');
    expect(records[0].attributes).toMatchObject({ reason: 'missing' });
  });

  // A value that is set but unusable is a deployer mistake with a fix, so it is reported at `error`.
  it('captures exactly one `error` record when `PUBLIC_LOG_LEVEL` is set to something unusable', async () => {
    const records = await captureEntryPointRecords('lowd');

    expect(records).toHaveLength(1);
    expect(records[0].severityText).toBe('ERROR');
    expect(records[0].attributes).toMatchObject({ reason: 'invalid', provided: 'lowd' });
  });
});
