import { deepFreeze } from '../utils/freeze';

/**
 * Every cookie name this application chooses, declared exactly once.
 *
 * WHY THIS MODULE EXISTS: a name spelled out as a literal at each read and write site agrees with the others only by coincidence, and nothing in the tree can tell agreement from luck. Two failure modes follow from that, and both are silent at compile time and at runtime alike. A seventh file inventing a near-miss spelling writes a cookie nobody reads, so the flow it belongs to fails for one browser on one path with no error anywhere; and two DIFFERENT cookies given the same name are one cookie, where the second write overwrites the first and the reader of the first silently gets the second value. The collision case is the one no call site can ever catch, because it is a property of this map as a whole. `cookies.test.ts` beside this file checks it, and `scripts/assert-cookie-names.mjs` in `yarn lint:check` checks that no operation site goes back to naming a cookie with a literal.
 *
 * WHAT THIS MODULE DOES NOT COVER: the Supabase auth cookies written through the server-side bridge in `$lib/supabase/server.ts`. Their names are chosen by the Supabase SSR package and handed to the bridge as a value, not written by this application, so they cannot be declared here and are not this map's to guarantee. The guard script excludes them by SHAPE rather than by path: an operation whose name argument is an identifier is not a declaration of a name, so the bridge is silent while a real literal written into that same file is still caught.
 *
 * The module is browser-safe: a plain frozen object, no private environment read, no Node built-in and no path alias, so client code can import a name as well as the server routes that read and write the cookies, and so can the end-to-end tests.
 *
 * `as const` is the house dialect for a frozen const map and is what pins the value types; the runtime freeze is belt and braces on top of it, so `Object.isFrozen` is a thing the spec can assert rather than a property the type system merely promises.
 */
export const COOKIE = deepFreeze({
  oidcState: 'oidc_state',
  oidcNonce: 'oidc_nonce',
  oidcCodeVerifier: 'oidc_code_verifier',
  /** The entity type the identity provider's flow was started for. It selects and never authorises: every reader checks the registration matrix again. */
  oidcEntityType: 'oidc_entity_type',
  /** The locale the identity provider's flow was started in, so its return lands in that locale and not in whichever the provider's redirect resolves to. Read once by the callback and accepted only when it is a supported locale. */
  oidcLocale: 'oidc_locale',
  /** Whether the identity provider's return made the account or found one, read once by the view the user arrives at. It only ever adds a notice and never removes a gate. */
  identityProviderArrival: 'identity_provider_arrival',
  /**
   * Whether this browser has once confirmed an address for this application, through a sign-in link or a link that confirms a new address. It names no account and no address: a later user of the same browser learns only that someone registered here. `verifyMailedLink` sets it after such a link has been verified, never on a GET; the registration page reads it to say that the user looks to be registered already, and its `dismissRegistered` action removes it.
   */
  registered: 'registered',
  /**
   * An opaque id of the logout modal's count: 32 random hexadecimal characters the page writes when the modal opens, kept as long as the session cookie, so it outlives a closed browser as the session does. Or `passed`, which the server's request hook writes once it has signed out a request that carried an id and no `logoutDeadline`, and never acts on again, so a session signed in afterwards is kept. The page removes the id when the modal closes and before the count's own sign-out, so it is not `httpOnly`; `SameSite=Lax`, for every path. The tab's next navigation or the next document removes `passed`, and the Contestant App's drafts with it. It names no user and carries no time.
   */
  logoutPending: 'logout-pending',
  /**
   * The same id as `logoutPending`, written beside it with a max age of the count's length plus a grace of ten seconds, so the browser drops it at the count's end by its own clock and a count that runs signs out through its own flow first. A request that carries a pending id and no deadline is signed out by the server's request hook, which compares no time. Written and removed with `logoutPending`, with the same attributes. It names no user and carries no time; a user who removes it is signed out at their next request, and one who removes both keeps only their own session.
   */
  logoutDeadline: 'logout-deadline'
} as const);

/**
 * The attributes of every cookie the identity provider's flow leaves behind: the authorize endpoint's flow cookies and the callback's arrival marker. Each is read by the server alone and lives as long as one return; `lax` lets them return with the provider's top-level redirect.
 */
export const OIDC_FLOW_COOKIE_OPTIONS = deepFreeze({
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 600
} as const);

/**
 * The wire name of a cookie this application chooses. Derived from {@link COOKIE}'s values, so the type cannot name a cookie the map does not declare.
 */
export type CookieName = (typeof COOKIE)[keyof typeof COOKIE];
