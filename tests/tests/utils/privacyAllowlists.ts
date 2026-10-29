/**
 * The pure cores of the two privacy assertions of the E2E suite: what the application may leave on the device, and which origins the browser may talk to.
 *
 * Both are plain functions over plain data, so they are unit-tested without a browser (`privacyAllowlists.test.ts`); the fixtures that collect the data from a browser context and assert on the result are `fixtures/shared/deviceStores.fixture.ts` and `fixtures/shared/requestOrigins.fixture.ts`.
 *
 * ## The boundary of the claim
 *
 * The device check judges the keys present in the four stores after a journey. A key is on the allowlist because the application is known to write it for a purpose other than analytics: the visitor's own answers and preferences, the voter's and the candidate's navigation state, the locale, and the authentication cookies. Nothing that identifies a visit is on it, so a tracking identifier in any store fails the check by name. The check says nothing about a key the journey did not cause to be written, and nothing about the values of the allowed keys, except the user preferences, whose members are checked separately by {@link findUnexpectedPreferenceMembers}.
 *
 * The origin check judges the requests observed in one journey against two allowed origins, the app's and Supabase's, and requires every script to come from the app's origin. It says nothing about a request the journey did not make.
 */

/** The four stores the device check reads. */
export type DeviceStore = 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB';

/** The names present in each store: localStorage and sessionStorage keys, cookie names and IndexedDB database names. */
export type DeviceState = {
  localStorage: Array<string>;
  sessionStorage: Array<string>;
  cookies: Array<string>;
  indexedDB: Array<string>;
};

/** What one store may hold: names allowed exactly, name prefixes followed by at least one more character, and name shapes. */
export type StoreAllowlist = {
  exact: ReadonlyArray<string>;
  prefixes: ReadonlyArray<string>;
  patterns: ReadonlyArray<RegExp>;
};

/** The order in which the stores are checked and reported. */
const DEVICE_STORES: ReadonlyArray<DeviceStore> = ['localStorage', 'sessionStorage', 'cookies', 'indexedDB'];

/**
 * The cookies `@supabase/ssr` writes for a project: `sb-<first label of the project host>-auth-token`, its `.0`, `.1`, … chunks and the `-code-verifier` companion.
 *
 * A shape rather than a fixed prefix, because the host label depends on the Supabase URL the harness runs against. It is narrower than `sb-`, so a cookie that merely starts with `sb-` is not allowed.
 */
const SUPABASE_AUTH_COOKIE = /^sb-[A-Za-z0-9-]+-auth-token(?:-code-verifier)?(?:\.\d+)?$/;

/**
 * What the application may leave on the device, per store.
 *
 * Built from the application's storage writes (`localStorageState(`, `sessionStorageState(` and the cookie module `apps/frontend/src/lib/cookies/index.ts`), plus what SvelteKit, Paraglide and `@supabase/ssr` write on its behalf. The tracking session id that the tracking service keeps in sessionStorage is deliberately not on it: it identifies a visit, so the check fails while it is written.
 */
export const ALLOWED_DEVICE_STATE: Readonly<Record<DeviceStore, StoreAllowlist>> = {
  localStorage: {
    exact: ['appContext-userPreferences', 'VoterContext-answerStore'],
    // A candidate's unsaved answers, one key per edited entity.
    prefixes: ['contestantContext-userData-editedAnswers-'],
    patterns: []
  },
  sessionStorage: {
    exact: [
      'voterContext-firstQuestionId',
      // SvelteKit's own navigation state.
      'sveltekit:snapshot',
      'sveltekit:scroll',
      'sveltekit:states'
    ],
    prefixes: [],
    patterns: []
  },
  cookies: {
    // Paraglide's locale cookie, and the cookies of the cookie module: the identity provider's, and the marker of a browser that has confirmed an address.
    exact: [
      'PARAGLIDE_LOCALE',
      'oidc_state',
      'oidc_nonce',
      'oidc_code_verifier',
      'oidc_entity_type',
      'identity_provider_arrival',
      'registered'
    ],
    prefixes: [],
    patterns: [SUPABASE_AUTH_COOKIE]
  },
  indexedDB: { exact: [], prefixes: [], patterns: [] }
};

/** True when `name` is allowed by `allowlist`. */
function isAllowedName(name: string, allowlist: StoreAllowlist): boolean {
  return (
    allowlist.exact.includes(name) ||
    allowlist.prefixes.some((prefix) => name.length > prefix.length && name.startsWith(prefix)) ||
    allowlist.patterns.some((pattern) => pattern.test(name))
  );
}

/**
 * Find every name on the device that is not on {@link ALLOWED_DEVICE_STATE}.
 * @param state - The names present in each store.
 * @returns One entry `<store>: <name>` per name outside the allowlist, in store order and then in the order given; empty when the device holds only allowed state.
 */
export function findUnexpectedDeviceState(state: DeviceState): Array<string> {
  return DEVICE_STORES.flatMap((store) =>
    state[store].filter((name) => !isAllowedName(name, ALLOWED_DEVICE_STATE[store])).map((name) => `${store}: ${name}`)
  );
}

/** The members the stored user preferences may hold: the consent choice and the feedback and survey prompt states. */
export const ALLOWED_PREFERENCE_MEMBERS: ReadonlyArray<string> = ['dataCollection', 'feedback', 'survey'];

/**
 * Find every member of the stored user preferences outside {@link ALLOWED_PREFERENCE_MEMBERS}.
 *
 * The application stores the preferences in a versioned envelope `{ version, data }`; the members are those of `data`.
 * @param raw - The stored string, as read from localStorage.
 * @returns The names of the members outside the allowlist, or the single entry `data is not an object` when the envelope holds no object; empty when the preferences hold only allowed members.
 * @throws If `raw` is not JSON.
 */
export function findUnexpectedPreferenceMembers(raw: string): Array<string> {
  const envelope = JSON.parse(raw) as { data?: unknown } | null;
  const data = envelope?.data;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return ['data is not an object'];
  return Object.keys(data).filter((member) => !ALLOWED_PREFERENCE_MEMBERS.includes(member));
}

/** One request the browser made: its URL and Playwright's resource type (`document`, `script`, `fetch`, …). */
export type ObservedRequest = { url: string; resourceType: string };

/** URL schemes whose requests never leave the browser, so they have no network origin to judge. */
const LOCAL_SCHEMES = ['data:', 'blob:'];

/**
 * Find every request that went to an origin outside `allowedOrigins`, and every script that did not come from `appOrigin`.
 * @param requests - The requests observed, in order.
 * @param allowedOrigins - The origins the browser may talk to.
 * @param appOrigin - The application's origin, the only one scripts may come from.
 * @returns One entry `<resource type> <url>: <reason>` per offending request, each listed once in the order first seen; empty when every request is allowed. A `data:` or `blob:` URL is never reported; a URL that cannot be parsed always is.
 */
export function findThirdPartyRequests(
  requests: Array<ObservedRequest>,
  allowedOrigins: Array<string>,
  appOrigin: string
): Array<string> {
  const offenders = new Set<string>();
  for (const { url, resourceType } of requests) {
    if (LOCAL_SCHEMES.some((scheme) => url.startsWith(scheme))) continue;
    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      offenders.add(`${resourceType} ${url}: the URL cannot be parsed`);
      continue;
    }
    if (!allowedOrigins.includes(origin)) {
      offenders.add(`${resourceType} ${url}: origin ${origin} is not allowed`);
    } else if (resourceType === 'script' && origin !== appOrigin) {
      offenders.add(`${resourceType} ${url}: a script from ${origin}, not from the app's origin`);
    }
  }
  return [...offenders];
}
