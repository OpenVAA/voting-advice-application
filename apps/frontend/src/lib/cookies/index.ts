import { deepFreeze } from '$lib/utils/freeze';

/**
 * Every cookie name this application chooses, declared exactly once.
 *
 * WHY THIS MODULE EXISTS: before it, four names were spelled out as literals at eighteen read and write sites across six files, and they agreed only by coincidence. Nothing in the tree could tell agreement from luck. Two failure modes follow from that, and both are silent at compile time and at runtime alike. A seventh file inventing a near-miss spelling writes a cookie nobody reads, so the flow it belongs to fails for one browser on one path with no error anywhere; and two DIFFERENT cookies given the same name are one cookie, where the second write overwrites the first and the reader of the first silently gets the second value. The collision case is the one no call site can ever catch, because it is a property of this map as a whole. `cookies.test.ts` beside this file checks it, and `scripts/assert-cookie-names.mjs` in `yarn lint:check` checks that no operation site goes back to naming a cookie with a literal.
 *
 * WHAT THIS MODULE DOES NOT COVER: the Supabase auth cookies written through the server-side bridge in `$lib/supabase/server.ts`. Their names are chosen by the Supabase SSR package and handed to the bridge as a value, not written by this application, so they cannot be declared here and are not this map's to guarantee. The guard script excludes them by SHAPE rather than by path: an operation whose name argument is an identifier is not a declaration of a name, so the bridge is silent while a real literal written into that same file is still caught.
 *
 * The module is deliberately browser-safe: a plain frozen object, no private environment read and no Node built-in, because one of the eighteen sites is a client-side cookie write inside a Svelte component and it must import the same name its two server-side readers do.
 *
 * `as const` is the house dialect for a frozen const map and is what pins the value types; the runtime freeze is belt and braces on top of it, so `Object.isFrozen` is a thing the spec can assert rather than a property the type system merely promises.
 */
export const COOKIE = deepFreeze({
  idToken: 'id_token',
  oidcState: 'oidc_state',
  oidcNonce: 'oidc_nonce',
  oidcCodeVerifier: 'oidc_code_verifier'
} as const);

/**
 * The wire name of a cookie this application chooses. Derived from {@link COOKIE}'s values, so the type cannot name a cookie the map does not declare.
 */
export type CookieName = (typeof COOKIE)[keyof typeof COOKIE];
