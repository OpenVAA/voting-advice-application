/**
 * # Post-login redirect-target validation
 *
 * Shared by the candidate and admin login form actions, which both accept a `redirectTo` field and interpolate it into their `redirect()` target.
 *
 * `redirectTo` reaches the action from `?redirectTo=` on the login URL (`candidate/login/+page.svelte`, `admin/login/+page.svelte` read it off `page.url.searchParams` and post it back in a hidden field), so its value is fully caller-controlled. The app has exactly ONE legitimate producer: `hooks.server.ts` builds `?redirectTo=<pathname minus the locale prefix>` when it bounces an unauthenticated visitor off a `candidate/(protected)` route.
 * Nothing in the app ever produces one for the admin login page at all.
 *
 * The interpolation `/${locale}/${redirectTo}` happens to keep the result same-origin, because the leading `/<locale>/` prevents the value from ever starting the string and therefore from forming a `//host` or `scheme:` URL. That containment is incidental rather than asserted, and it does not stop a crafted link from steering a just-authenticated user to an arbitrary in-origin path. The voter side validates its analogous `?next=` parameter against an allowlist, twice, and says why (`(located)/+layout.ts`, `constituencies/+page.svelte`); this module is that guard on the auth path.
 *
 * Deliberately conservative and fail-safe: anything that is not a plain relative app path returns `undefined`, and both callers then fall back to their app home — which is exactly the behaviour they already have when `redirectTo` is absent. A rejected value therefore degrades the deep link; it cannot break the login.
 */

/**
 * Relative app path only: one or more `segment/` groups made of unreserved URL characters, optionally followed by a query string. No leading slash (the caller supplies `/{locale}/`), no scheme, no authority, no backslash, and no `.` segment — so `..`, `//host`, `https://host` and `\\host` are all rejected.
 */
const RELATIVE_APP_PATH = /^[A-Za-z0-9\-_~]+(?:\/[A-Za-z0-9\-_~]+)*\/?(?:\?[A-Za-z0-9\-_~.=&%[\]]*)?$/;

/**
 * Validate a post-login `redirectTo` value.
 *
 * @param redirectTo - The raw form value, which may be absent or attacker-supplied.
 * @returns The value when it is a plain relative app path, `undefined` otherwise.
 */
export function safeRedirectTarget(redirectTo: string | null | undefined): string | undefined {
  if (typeof redirectTo !== 'string' || redirectTo === '') return undefined;
  if (!RELATIVE_APP_PATH.test(redirectTo)) return undefined;
  return redirectTo;
}
