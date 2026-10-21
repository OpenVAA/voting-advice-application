import { CONSENT_MODES, VISIT_ID_MODES } from '$lib/analytics/modes';
import type { AnalyticsProjection, ConsentMode, VisitIdMode } from '$lib/analytics/modes';

/** The providers the relay can hand events to. `none` keeps nothing, `log` writes one line per event, `posthog` forwards to PostHog. */
export const PROVIDERS = ['none', 'log', 'posthog'] as const;

/** One of {@link PROVIDERS}. */
export type ProviderName = (typeof PROVIDERS)[number];

/** The private environment variables the analytics configuration is read from. None is `PUBLIC_`, so none reaches the browser bundle. */
export const ANALYTICS_ENV = {
  provider: 'ANALYTICS_PROVIDER',
  consentMode: 'ANALYTICS_CONSENT_MODE',
  visitIdMode: 'ANALYTICS_VISIT_ID_MODE',
  posthogKey: 'ANALYTICS_POSTHOG_KEY',
  posthogHost: 'ANALYTICS_POSTHOG_HOST'
} as const;

/** The PostHog host used when `ANALYTICS_POSTHOG_HOST` is unset: the EU cloud. */
export const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

/** The hosts on which a plain `http:` PostHog host is accepted, for a local PostHog or a test double. */
const LOOPBACK_HOSTNAMES: ReadonlyArray<string> = ['localhost', '127.0.0.1'];

/** The resolved analytics configuration of a deployment. */
export type AnalyticsConfig = {
  provider: ProviderName;
  consentMode: ConsentMode;
  visitIdMode: VisitIdMode;
  /** Present only when the provider is `posthog`. */
  posthog?: { host: string; key: string };
};

/** Why one variable could not be used. */
export type AnalyticsConfigProblem = {
  /** The name of the variable, one of the values of {@link ANALYTICS_ENV}. */
  variable: string;
  /** `missing` when a required value was unset, `invalid` when the value is not acceptable. */
  reason: 'invalid' | 'missing';
  /** The normalised value, only for a vocabulary variable. Never present for the key or the host, so a secret cannot reach a log through it. */
  provided?: string;
};

/** The environment the resolver reads: variable names mapped to their raw values. */
type AnalyticsEnv = Readonly<Record<string, string | undefined>>;

/**
 * Resolve the analytics configuration from the environment. It reads nothing but its argument, and it neither throws nor logs for any value.
 *
 * Unset values take their defaults: provider `none`, consent mode `gated`, visit-id mode `memory`. Any problem at all resolves the provider to `none`, so a misconfigured deployment sends nothing; the two modes still resolve to their valid or default values.
 *
 * @param env - The private server environment.
 * @returns The configuration, and the problems that forced a fallback, in variable order.
 */
export function resolveAnalyticsConfig(env: AnalyticsEnv): {
  config: AnalyticsConfig;
  problems: Array<AnalyticsConfigProblem>;
} {
  const problems: Array<AnalyticsConfigProblem> = [];

  const provider = readVocabulary(env, ANALYTICS_ENV.provider, PROVIDERS, 'none', problems);
  const consentMode = readVocabulary(env, ANALYTICS_ENV.consentMode, CONSENT_MODES, 'gated', problems);
  const visitIdMode = readVocabulary(env, ANALYTICS_ENV.visitIdMode, VISIT_ID_MODES, 'memory', problems);

  let posthog: AnalyticsConfig['posthog'];
  if (provider === 'posthog') {
    const key = readValue(env[ANALYTICS_ENV.posthogKey]);
    if (key === undefined) problems.push({ variable: ANALYTICS_ENV.posthogKey, reason: 'missing' });

    const rawHost = readValue(env[ANALYTICS_ENV.posthogHost]);
    const host = rawHost === undefined ? DEFAULT_POSTHOG_HOST : toAllowedOrigin(rawHost);
    if (host === undefined) problems.push({ variable: ANALYTICS_ENV.posthogHost, reason: 'invalid' });

    if (key !== undefined && host !== undefined) posthog = { host, key };
  }

  if (problems.length > 0) return { config: { provider: 'none', consentMode, visitIdMode }, problems };
  return {
    config: posthog ? { provider, consentMode, visitIdMode, posthog } : { provider, consentMode, visitIdMode },
    problems
  };
}

/**
 * What the browser is told about the configuration: whether a relay is active and in which two modes. The provider's name and its key are not part of it.
 *
 * @param config - A resolved configuration.
 * @returns Exactly `active`, `consentMode` and `visitIdMode`.
 */
export function toProjection(config: AnalyticsConfig): AnalyticsProjection {
  return { active: config.provider !== 'none', consentMode: config.consentMode, visitIdMode: config.visitIdMode };
}

/**
 * The start-up rule over the analytics variables: the names of the variables with a problem, each once. Names only, never a value.
 *
 * @param env - The environment to check.
 * @returns The variable names, in resolution order, or an empty array when the configuration is sound.
 */
export function analyticsStartupProblems(env: Readonly<Record<string, string | undefined>>): Array<string> {
  return Array.from(new Set(resolveAnalyticsConfig(env).problems.map(({ variable }) => variable)));
}

/**
 * Read a vocabulary variable, normalised by trim and lower case. An unset value takes the default; a value outside the vocabulary takes the default and records an `invalid` problem.
 *
 * @param env - The environment.
 * @param variable - The variable's name.
 * @param vocabulary - The accepted values.
 * @param fallback - The value used when the variable is unset or invalid.
 * @param problems - Where an invalid value is recorded.
 * @returns The accepted value or the fallback.
 */
function readVocabulary<TValue extends string>(
  env: AnalyticsEnv,
  variable: string,
  vocabulary: ReadonlyArray<TValue>,
  fallback: TValue,
  problems: Array<AnalyticsConfigProblem>
): TValue {
  const raw = readValue(env[variable]);
  if (raw === undefined) return fallback;
  const normalised = raw.toLowerCase();
  const match = vocabulary.find((value) => value === normalised);
  if (match !== undefined) return match;
  problems.push({ variable, reason: 'invalid', provided: normalised });
  return fallback;
}

/**
 * Read one raw value, trimmed. A non-string or a blank value counts as unset.
 *
 * @param raw - The raw value, typed `unknown` because the process environment can hand over a non-string.
 * @returns The trimmed value, or `undefined` when unset.
 */
function readValue(raw: unknown): string | undefined {
  // `typeof`, not a nullish check: a non-string reaching `.trim()` would throw.
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Reduce a host to its origin when it is an `https:` URL, or an `http:` URL on a loopback name. The origin drops any path, query, credentials or trailing slash, so none of them can change the destination.
 *
 * @param raw - The trimmed host value.
 * @returns The origin, or `undefined` when the value is not an acceptable URL.
 */
function toAllowedOrigin(raw: string): string | undefined {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (url.protocol === 'https:') return url.origin;
  if (url.protocol === 'http:' && LOOPBACK_HOSTNAMES.includes(url.hostname)) return url.origin;
  return undefined;
}
