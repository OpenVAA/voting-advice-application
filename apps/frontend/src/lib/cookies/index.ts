import { deepFreeze } from '$lib/utils/freeze';

/**
 * Every cookie name this application chooses, declared exactly once.
 *
 * WHY THIS MODULE EXISTS: a name spelled out as a literal at each read and write site agrees with the others only by coincidence, and nothing in the tree can tell agreement from luck. Two failure modes follow from that, and both are silent at compile time and at runtime alike. A seventh file inventing a near-miss spelling writes a cookie nobody reads, so the flow it belongs to fails for one browser on one path with no error anywhere; and two DIFFERENT cookies given the same name are one cookie, where the second write overwrites the first and the reader of the first silently gets the second value. The collision case is the one no call site can ever catch, because it is a property of this map as a whole. `cookies.test.ts` beside this file checks it, and `scripts/assert-cookie-names.mjs` in `yarn lint:check` checks that no operation site goes back to naming a cookie with a literal.
 *
 * WHAT THIS MODULE DOES NOT COVER: the Supabase auth cookies written through the server-side bridge in `$lib/supabase/server.ts`. Their names are chosen by the Supabase SSR package and handed to the bridge as a value, not written by this application, so they cannot be declared here and are not this map's to guarantee. The guard script excludes them by SHAPE rather than by path: an operation whose name argument is an identifier is not a declaration of a name, so the bridge is silent while a real literal written into that same file is still caught.
 *
 * The module is browser-safe: a plain frozen object, no private environment read and no Node built-in, so client code can import a name as well as the server routes that read and write the cookies.
 *
 * `as const` is the house dialect for a frozen const map and is what pins the value types; the runtime freeze is belt and braces on top of it, so `Object.isFrozen` is a thing the spec can assert rather than a property the type system merely promises.
 */
export const COOKIE = deepFreeze({
  oidcState: 'oidc_state',
  oidcNonce: 'oidc_nonce',
  oidcCodeVerifier: 'oidc_code_verifier',
  /** The entity type the identity provider's flow was started for. It selects and never authorises: every reader checks the registration matrix again. */
  oidcEntityType: 'oidc_entity_type',
  /** Whether the identity provider's return made the account or found one, read once by the view the user arrives at. It only ever adds a notice and never removes a gate. */
  identityProviderArrival: 'identity_provider_arrival',
  /**
   * Whether this browser has once confirmed an address for this application, through a sign-in link or a link that confirms a new address. It names no account and no address: a later user of the same browser learns only that someone registered here. `verifyMailedLink` sets it after such a link has been verified, never on a GET; the registration page reads it to say that the user looks to be registered already, and its `dismissRegistered` action removes it.
   */
  registered: 'registered'
} as const);

/**
 * The wire name of a cookie this application chooses. Derived from {@link COOKIE}'s values, so the type cannot name a cookie the map does not declare.
 */
export type CookieName = (typeof COOKIE)[keyof typeof COOKIE];
