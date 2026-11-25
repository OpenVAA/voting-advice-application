import { analyticsStartupProblems } from '$lib/server/analytics/config';
import { projectIdProblem } from '$lib/utils/projectId';

/** The environment a start-up rule reads: variable names mapped to their raw values. */
export type StartupEnv = Readonly<Record<string, string | undefined>>;

/** A start-up rule. It returns the names of the variables it finds unset or invalid, and an empty array when it is satisfied. */
export type StartupRule = (env: StartupEnv) => Array<string>;

/**
 * The variables the server cannot run without. `ORIGIN` is among them because without it the Node adapter takes each request's origin from headers the client sets.
 */
export const REQUIRED_ENV: ReadonlyArray<string> = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'ORIGIN'];

/**
 * The rules the start-up check applies, in order. A requirement that depends on more than one variable is a further rule in this list.
 */
export const STARTUP_RULES: ReadonlyArray<StartupRule> = [
  unsetRequiredEnv,
  projectIdStartupProblems,
  analyticsStartupProblems,
  identityProviderStartupProblems
];

/**
 * List the variables the start-up rules find unset or invalid. It reads nothing but its arguments, and it neither throws nor logs for any environment value: the caller decides what a non-empty result means.
 *
 * @param env - The environment to check.
 * @param rules - The rules to apply, {@link STARTUP_RULES} by default.
 * @returns The names the rules reported, in rule order and each once. Names only, never a value.
 */
export function missingRequiredEnv(env: StartupEnv, rules: ReadonlyArray<StartupRule> = STARTUP_RULES): Array<string> {
  return Array.from(new Set(rules.flatMap((rule) => rule(env))));
}

/**
 * The rule over {@link REQUIRED_ENV}.
 *
 * @param env - The environment to check.
 * @returns The required names that are unset, in the order of {@link REQUIRED_ENV}.
 */
function unsetRequiredEnv(env: StartupEnv): Array<string> {
  return REQUIRED_ENV.filter((name) => isUnset(env[name]));
}

/**
 * The rule over `PUBLIC_PROJECT_ID`, which the Supabase adapter refuses when it is unset, empty or not a canonical uuid. It applies the adapter's own test, so the server refuses to start on exactly the values every request would refuse.
 *
 * @param env - The environment to check.
 * @returns `PUBLIC_PROJECT_ID` when the adapter would refuse its value, else nothing.
 */
export function projectIdStartupProblems(env: StartupEnv): Array<string> {
  return projectIdProblem(env.PUBLIC_PROJECT_ID) ? ['PUBLIC_PROJECT_ID'] : [];
}

/**
 * The rule over identity-provider sign-in. With an identity provider set up, which `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` says, its callback calls the `identity-callback` Edge Function, which answers only a request that carries `IDENTITY_CALLBACK_SERVER_SECRET`.
 *
 * @param env - The environment to check.
 * @returns `IDENTITY_CALLBACK_SERVER_SECRET` when a provider is set up and the secret is unset, else nothing.
 */
export function identityProviderStartupProblems(env: StartupEnv): Array<string> {
  if (isUnset(env.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID)) return [];
  return isUnset(env.IDENTITY_CALLBACK_SERVER_SECRET) ? ['IDENTITY_CALLBACK_SERVER_SECRET'] : [];
}

/**
 * Whether a raw environment value counts as unset. An empty or whitespace-only value does, because the application's own readers turn an unset variable into `''`.
 *
 * @param raw - The raw value, typed `unknown` because the process environment can hand over a non-string.
 * @returns `true` when the value is not a string or holds nothing but whitespace.
 */
function isUnset(raw: unknown): boolean {
  // `typeof`, not a nullish check: a non-string reaching `.trim()` would throw.
  return typeof raw !== 'string' || raw.trim() === '';
}
