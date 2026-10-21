/**
 * Locality guard for every service-role client dev-seed builds.
 *
 * The service-role key bypasses row-level security, and the seed and teardown paths write and delete rows in bulk. This module decides whether a Supabase URL points at a local stack, and refuses anything else unless the operator opts out for one invocation.
 */

/**
 * Environment variable that opts a single invocation out of the locality guard.
 *
 * Only `1` or `true` (trimmed, case-insensitive) opt out; any other value, the empty string included, leaves the guard active.
 */
export const ALLOW_REMOTE_SUPABASE_ENV = 'DEV_SEED_ALLOW_REMOTE';

/**
 * Options accepted by {@link assertLocalSupabaseUrl}.
 */
export interface LocalityGuardOptions {
  /** Permit a non-local Supabase host. The CLIs set it from `--allow-remote`. */
  allowRemote?: boolean;
}

/** Host names a local stack is reached by: the host itself, the Docker host alias, and the in-network gateway name. */
const LOCAL_HOSTNAMES: ReadonlySet<string> = new Set(['localhost', '[::1]', 'host.docker.internal', 'kong']);

/** 127.0.0.0/8, matched on the WHATWG-normalised dotted form. */
const IPV4_LOOPBACK = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/** The gateway container the Supabase CLI names after the project id. */
const SUPABASE_CLI_GATEWAY = /^supabase_kong_[a-z0-9_-]+$/;

/** Human-readable allowlist, used in the refusal message. */
const ALLOWED_HOSTS_DESCRIPTION =
  'localhost, 127.0.0.0/8, [::1], host.docker.internal, kong and supabase_kong_<project>';

function parseUrl(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

/**
 * Whether `url` points at a local Supabase stack.
 *
 * The URL is parsed with the WHATWG parser and its normalised `hostname` is matched exactly against the allowlist: `localhost`, any 127.0.0.0/8 address, `[::1]`, `host.docker.internal`, `kong` and `supabase_kong_<project>`. There is no substring or suffix matching, so look-alikes such as `localhost.evil.example` or `127.0.0.1.nip.io` are not local.
 *
 * @param url - the Supabase URL to classify.
 * @returns `true` for an allowlisted host, `false` for any other host or an unparseable value.
 */
export function isLocalSupabaseUrl(url: string): boolean {
  const hostname = parseUrl(url)?.hostname;
  if (hostname === undefined) return false;
  return LOCAL_HOSTNAMES.has(hostname) || IPV4_LOOPBACK.test(hostname) || SUPABASE_CLI_GATEWAY.test(hostname);
}

function remoteAllowedByEnv(): boolean {
  const value = (process.env[ALLOW_REMOTE_SUPABASE_ENV] ?? '').trim().toLowerCase();
  return value === '1' || value === 'true';
}

/**
 * Throw unless `url` is local or the caller opted out.
 *
 * The opt-outs are `options.allowRemote` and the {@link ALLOW_REMOTE_SUPABASE_ENV} environment variable, which is read at call time. The error message names only the URL's host; it never contains the key, userinfo, path or query, and an unparseable value is not echoed.
 *
 * @param url - the URL the service-role client is about to be created with.
 * @param options - {@link LocalityGuardOptions}.
 * @throws Error when the host is not local and neither opt-out is set.
 */
export function assertLocalSupabaseUrl(url: string, options: LocalityGuardOptions = {}): void {
  if (isLocalSupabaseUrl(url) || options.allowRemote === true || remoteAllowedByEnv()) return;
  const parsed = parseUrl(url);
  const host = parsed ? `'${parsed.host}'` : '(an unparseable URL)';
  throw new Error(
    `Refusing to use the service-role key against non-local Supabase host ${host}. ` +
      'The service-role key bypasses row-level security, so dev-seed only talks to a local stack: ' +
      `${ALLOWED_HOSTS_DESCRIPTION}. ` +
      `If this target is intended, opt out for this one invocation with --allow-remote or ${ALLOW_REMOTE_SUPABASE_ENV}=1.`
  );
}
