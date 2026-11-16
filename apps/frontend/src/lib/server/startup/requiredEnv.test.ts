import { describe, expect, it } from 'vitest';
import { missingRequiredEnv, REQUIRED_ENV } from './requiredEnv';
import type { StartupEnv, StartupRule } from './requiredEnv';

/**
 * Specification for `missingRequiredEnv`: it returns the name of every required variable that is unset, where an empty, whitespace-only or non-string value counts as unset, in rule order with each name once, and it never throws or returns a value from the environment.
 */

/** The four required names, restated locally so the cases assert against the contract rather than against the implementation's own export. */
const REQUIRED_NAMES: ReadonlyArray<string> = [
  'PUBLIC_SUPABASE_URL',
  'PUBLIC_SUPABASE_ANON_KEY',
  'PUBLIC_PROJECT_ID',
  'ORIGIN'
];

/** An environment in which every required variable is set, each to a value no other variable has. */
const COMPLETE_ENV: Readonly<Record<string, string>> = {
  PUBLIC_SUPABASE_URL: 'value-of-supabase-url',
  PUBLIC_SUPABASE_ANON_KEY: 'value-of-anon-key',
  PUBLIC_PROJECT_ID: 'value-of-project-id',
  ORIGIN: 'value-of-origin'
};

/**
 * Build an environment from {@link COMPLETE_ENV} with some names removed. The names are removed, not set to empty, so the cases that use this exercise an absent variable and nothing else.
 *
 * @param names - The variables to leave out.
 * @returns A copy of the complete environment without them.
 */
function envWithout(...names: Array<string>): StartupEnv {
  return Object.fromEntries(Object.entries(COMPLETE_ENV).filter(([name]) => !names.includes(name)));
}

/**
 * A first rule for the rule-order case, written here so the case does not depend on the rule the module ships.
 *
 * @param env - The environment to check.
 * @returns The required names that are absent from it.
 */
function absentRequiredNames(env: StartupEnv): Array<string> {
  return REQUIRED_NAMES.filter((name) => env[name] === undefined);
}

/**
 * A second rule for the rule-order case. It always reports one name of its own and one the first rule can also report.
 *
 * @returns The two names.
 */
function extraNames(): Array<string> {
  return ['EXTRA_KEY', 'ORIGIN'];
}

describe('REQUIRED_ENV', () => {
  it('holds exactly the four required names, in order', () => {
    expect(REQUIRED_ENV).toEqual(REQUIRED_NAMES);
  });
});

describe('missingRequiredEnv', () => {
  it('returns an empty array when all four names are set to non-empty values', () => {
    expect(missingRequiredEnv(COMPLETE_ENV)).toEqual([]);
  });

  it.each(REQUIRED_NAMES)('returns exactly %s when it alone is absent', (name) => {
    expect(missingRequiredEnv(envWithout(name))).toEqual([name]);
  });

  it('returns two absent names in the order of `REQUIRED_ENV`, whatever order they were removed in', () => {
    expect(missingRequiredEnv(envWithout('ORIGIN', 'PUBLIC_SUPABASE_URL'))).toEqual(['PUBLIC_SUPABASE_URL', 'ORIGIN']);
  });

  // The application's own readers turn an unset variable into `''`, so an empty value must not pass as set.
  it.each([
    ['an empty string', ''],
    ['only spaces', '   '],
    ['only a tab and a newline', '\t\n']
  ])('reports a variable whose value is %s as missing', (_label, value) => {
    expect(missingRequiredEnv({ ...COMPLETE_ENV, PUBLIC_PROJECT_ID: value })).toEqual(['PUBLIC_PROJECT_ID']);
  });

  // The values come from the process environment, so a non-string is reachable despite the `string` type.
  it('does not throw on a non-string value, and reports the variable as missing', () => {
    const hostile: ReadonlyArray<unknown> = [null, 0, 1, true, false, {}, [], Symbol('origin'), () => 'origin', NaN];

    for (const value of hostile) {
      const env = { ...COMPLETE_ENV, ORIGIN: value } as unknown as StartupEnv;
      expect(() => missingRequiredEnv(env)).not.toThrow();
      expect(missingRequiredEnv(env)).toEqual(['ORIGIN']);
    }
  });

  it('appends the names of a later rule after those of an earlier one, and lists a name both return once', () => {
    const rules: ReadonlyArray<StartupRule> = [absentRequiredNames, extraNames];

    expect(missingRequiredEnv(envWithout('ORIGIN'), rules)).toEqual(['ORIGIN', 'EXTRA_KEY']);
    expect(missingRequiredEnv(COMPLETE_ENV, rules)).toEqual(['EXTRA_KEY', 'ORIGIN']);
  });

  it('returns names only, never a value from the environment', () => {
    const env: StartupEnv = {
      ...envWithout('ORIGIN'),
      PUBLIC_SUPABASE_ANON_KEY: '   ',
      UNRELATED: 'value-of-unrelated'
    };
    const missing = missingRequiredEnv(env);

    expect(missing).toEqual(['PUBLIC_SUPABASE_ANON_KEY', 'ORIGIN']);
    for (const value of Object.values(env)) expect(missing).not.toContain(value);
  });

  // `STARTUP_RULES` holds the analytics rule, so a production start that selects PostHog without its key is refused.
  it('reports ANALYTICS_POSTHOG_KEY when the provider is posthog and no key is set, and nothing when the provider is log', () => {
    expect(missingRequiredEnv({ ...COMPLETE_ENV, ANALYTICS_PROVIDER: 'posthog' })).toEqual(['ANALYTICS_POSTHOG_KEY']);
    expect(missingRequiredEnv({ ...COMPLETE_ENV, ANALYTICS_PROVIDER: 'log' })).toEqual([]);
  });
});
