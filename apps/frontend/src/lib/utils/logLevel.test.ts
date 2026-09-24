import { configureLogger } from '@openvaa/app-shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveLogLevel } from './logLevel';
import type { LogRecord } from '@openvaa/app-shared';

/**
 * Specification for the `PUBLIC_LOG_LEVEL` resolver — criterion 5, decisions **C1**, **C2**, **C3** (and its NOTE), **C5**, and the phase requirement **D9**.
 *
 * Production ran the logger at `'silent'` before this phase, so every "degrades with one warning" comment in the adapter was false in the only environment where it matters: the record was written and then dropped. This file specifies the module that ends that — `resolveLogLevel`, which turns one raw environment string into a level the logger can be configured with, and reports, separately, whether the value was MISSING or INVALID. Those two must stay distinguishable (C3 NOTE): a boolean coercion in `constants.ts` would collapse them into one value, which is why the constant is a raw passthrough and all normalisation lives here.
 *
 * Two things in this file are load-bearing beyond the resolver's return value. First, `'silent'` is deliberately NOT in the accepted vocabulary (decision D-DISC-1 in `157.1-02`, from `157.1-RESEARCH.md` § "The `PUBLIC_LOG_LEVEL` resolver…" point 1 — research titles that section with the pre-amendment name): accepting it would let one environment value reintroduce the exact production silence this phase closes, with no signal at all. It is treated as out-of-vocabulary and produces an `invalid` problem. Second, the ORDERING case at the bottom is the one pitfall **P3** exists for — `configureLogger` must run BEFORE the record about the fallback is emitted, or the message about silence is itself silent.
 *
 * FILLED by `157.1-02` (wave 1). The scaffold's local `LogLevelModule` shim and the lazy `'./logLevel'` specifier are gone: the module exists now, so the spec imports it statically and the real signature is what is under test.
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

  // D-DISC-1 (`157.1-02`), from `157.1-RESEARCH.md` § "The `PUBLIC_LOG_LEVEL` resolver…" point 1 — research titles that section with the pre-amendment name: `'silent'` is a LoggerConfig threshold, not an emittable level. Accepting it here would let one environment value reintroduce the production silence this whole phase exists to close, and it would do so quietly.
  it('treats the literal `silent` as out-of-vocabulary rather than accepting it', () => {
    expect(resolveLogLevel('silent', false, false)).toEqual({
      level: 'warn',
      problem: { reason: 'invalid', provided: 'silent' }
    });
  });

  it('keeps `debug` in a development build when nothing is set, and still reports `missing`', () => {
    expect(resolveLogLevel(undefined, true, false)).toEqual({ level: 'debug', problem: { reason: 'missing' } });
  });

  // Decision C3's NOTE: fail loudly, do not fail closed. Both entry points call this at MODULE SCOPE, so a throw here takes the SSR process down at server start rather than degrading the logging — threat `T-157.1-04`. The non-string inputs are reachable in practice because the value originates in the process environment, which TypeScript's `string` annotation describes but does not enforce.
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
 * The order below is load-bearing and is the scaffold's NOTE for `157.1-02`, honoured: `vi.resetModules()` re-evaluates `@openvaa/app-shared` too, so a sink installed on the instance that existed BEFORE the reset does not survive into the graph the entry point imports. Reset first, install the sink on the freshly imported instance, set the environment on the freshly imported env module, and import the entry point last — all against one registry.
 *
 * The level is left at `'silent'` on purpose: `configureLogger` MERGES rather than replaces, so the sink survives the entry point's own `configureLogger({ level })` call, and a record can only be captured if that call raised the level first. That is what makes these cases discriminating rather than decorative.
 * @param publicLogLevel - The raw `PUBLIC_LOG_LEVEL` the entry point should see. Omitted means unset.
 * @returns Every record the entry point emitted.
 */
async function captureEntryPointRecords(publicLogLevel?: string): Promise<Array<LogRecord>> {
  const records: Array<LogRecord> = [];

  vi.resetModules();
  const { configureLogger: configureFreshLogger } = await import('@openvaa/app-shared');
  configureFreshLogger({ level: 'silent', sink: (record) => records.push(record) });

  const { env } = await import('$env/dynamic/public');
  // reason: `Reflect.deleteProperty` rather than `delete env.PUBLIC_LOG_LEVEL`, because the type of `$env/dynamic/public` is GENERATED from the env vars actually present, so the property is optional on a checkout whose .env omits it and REQUIRED on one whose .env defines it - and `.env.example` defines `PUBLIC_LOG_LEVEL=warn`, which CI copies into place immediately before running svelte-check. The `delete` form therefore type-checks locally and fails in CI with "The operand of a 'delete' operator must be optional"; Reflect carries no optionality constraint, needs no cast, and has identical runtime semantics.
  if (publicLogLevel === undefined) Reflect.deleteProperty(env, 'PUBLIC_LOG_LEVEL');
  else env.PUBLIC_LOG_LEVEL = publicLogLevel;

  await import(/* @vite-ignore */ HOOKS_CLIENT_MODULE);

  return records;
}

describe('the fallback record is emitted after the fallback level is in force (ordering — pitfall P3)', () => {
  // THE ORDERING CASE. `configureLogger` FIRST, then the `log.error` about the fallback — reverse them and the record is dropped by the `'silent'` threshold that is still in force, so the message about silence is itself silent (C3 NOTE). The capture sink is installed BEFORE the entry point is imported and the level is left at `'silent'`: `configureLogger` merges rather than replaces, so the sink survives the hook's own `configureLogger({ level })` call, and the record can only be captured if the level was raised first. That is what makes this case discriminating rather than decorative.
  //
  // The registry-ordering constraint that makes the capture possible at all lives on {@link captureEntryPointRecords}, which both cases below drive.
  it('captures exactly one `info` record when `PUBLIC_LOG_LEVEL` is unset', async () => {
    const records = await captureEntryPointRecords();

    expect(records).toHaveLength(1);
    // WR-10. This asserted `'ERROR'` until the severity was split by reason. An absent optional variable with a documented default is an `info`-level FACT, and this entry point runs in the BROWSER module graph — i.e. once per full page load per visitor — so reporting it at `error` put a constant, non-actionable record at the top of every operator's new error stream, which is the noise floor that trains people to ignore the channel. The ordering property the case exists for is unchanged: the record is captured at all only because `configureLogger` ran before it was emitted.
    expect(records[0].severityText).toBe('INFO');
    expect(records[0].attributes).toMatchObject({ reason: 'missing' });
  });

  // The other half of the WR-10 split, and what keeps the case above from reading as "the report was downgraded". A value that was SET and is out of vocabulary is a deployer mistake with an actionable fix, and it stays an `error`.
  it('captures exactly one `error` record when `PUBLIC_LOG_LEVEL` is set to something unusable', async () => {
    const records = await captureEntryPointRecords('lowd');

    expect(records).toHaveLength(1);
    expect(records[0].severityText).toBe('ERROR');
    expect(records[0].attributes).toMatchObject({ reason: 'invalid', provided: 'lowd' });
  });
});
