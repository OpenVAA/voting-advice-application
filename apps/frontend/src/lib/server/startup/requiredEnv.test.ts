import { describe, expect, it } from 'vitest';
import { missingRequiredEnv, REQUIRED_ENV } from './requiredEnv';
import type { StartupEnv, StartupRule } from './requiredEnv';

/**
 * Specification for `missingRequiredEnv`: it returns the name of every required variable that is unset, where an empty, whitespace-only or non-string value counts as unset, and of `PUBLIC_PROJECT_ID` when it is also not a canonical uuid, in rule order with each name once, and it never throws or returns a value from the environment.
 */

/** The three names `REQUIRED_ENV` holds, restated locally so the cases assert against the contract rather than against the implementation's own export. */
const REQUIRED_NAMES: ReadonlyArray<string> = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'ORIGIN'];

/** Every name the start-up check refuses to start without, in the order it reports them: the project id's own rule runs after the rule over `REQUIRED_ENV`. */
const STARTUP_NAMES: ReadonlyArray<string> = [...REQUIRED_NAMES, 'PUBLIC_PROJECT_ID'];

/** An environment in which every required variable is set, each to a value no other variable has, the project id to a canonical uuid. */
const COMPLETE_ENV: Readonly<Record<string, string>> = {
  PUBLIC_SUPABASE_URL: 'value-of-supabase-url',
  PUBLIC_SUPABASE_ANON_KEY: 'value-of-anon-key',
  PUBLIC_PROJECT_ID: '00000000-0000-0000-0000-0000000000aa',
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
  it('holds exactly the three required names, in order', () => {
    expect(REQUIRED_ENV).toEqual(REQUIRED_NAMES);
  });
});

describe('missingRequiredEnv', () => {
  it('returns an empty array when every required name is set to a usable value', () => {
    expect(missingRequiredEnv(COMPLETE_ENV)).toEqual([]);
  });

  it.each(STARTUP_NAMES)('returns exactly %s when it alone is absent', (name) => {
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

  // The adapter refuses a project id that is not a canonical uuid on every request, so the start-up check refuses it too.
  it.each([
    ['a digit short', '00000000-0000-0000-0000-00000000001'],
    ['without hyphens', '00000000000000000000000000000001'],
    ['a non-hexadecimal digit', '00000000-0000-0000-0000-00000000000g'],
    ['not a uuid at all', 'value-of-project-id']
  ])('reports PUBLIC_PROJECT_ID when its value is %s', (_label, value) => {
    expect(missingRequiredEnv({ ...COMPLETE_ENV, PUBLIC_PROJECT_ID: value })).toEqual(['PUBLIC_PROJECT_ID']);
  });

  it('accepts a project id the adapter normalises: padded and upper-case', () => {
    expect(
      missingRequiredEnv({ ...COMPLETE_ENV, PUBLIC_PROJECT_ID: '  00000000-0000-0000-0000-0000000000AA \n' })
    ).toEqual([]);
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

  // `STARTUP_RULES` holds the identity-provider rule, so a start that sets up a provider without the callback's shared secret is refused.
  it.each([
    ['absent', undefined],
    ['empty', ''],
    ['only spaces', '   ']
  ])(
    'reports IDENTITY_CALLBACK_SERVER_SECRET when an identity provider is set up and the secret is %s',
    (_label, secret) => {
      const env = { ...COMPLETE_ENV, PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'value-of-client-id' } as Record<
        string,
        string | undefined
      >;
      if (secret !== undefined) env.IDENTITY_CALLBACK_SERVER_SECRET = secret;
      expect(missingRequiredEnv(env)).toEqual(['IDENTITY_CALLBACK_SERVER_SECRET']);
    }
  );

  it('reports nothing for identity-provider sign-in when a provider is set up with the secret', () => {
    expect(
      missingRequiredEnv({
        ...COMPLETE_ENV,
        PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'value-of-client-id',
        IDENTITY_CALLBACK_SERVER_SECRET: 'value-of-secret'
      })
    ).toEqual([]);
  });

  it.each([
    ['absent', undefined],
    ['empty', ''],
    ['only spaces', '   ']
  ])('does not ask for IDENTITY_CALLBACK_SERVER_SECRET when the provider client id is %s', (_label, clientId) => {
    const env = { ...COMPLETE_ENV } as Record<string, string | undefined>;
    if (clientId !== undefined) env.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = clientId;
    expect(missingRequiredEnv(env)).toEqual([]);
  });
});
