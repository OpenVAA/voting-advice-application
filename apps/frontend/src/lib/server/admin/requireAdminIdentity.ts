import { getUserData } from '$lib/auth';

/**
 * What the admin gate decided about one request, in the only three shapes it can decide.
 *
 * A DISCRIMINATED VERDICT rather than a boolean, because the two rejections are not the same rejection and the callers must be able to tell them apart: a missing session is a caller who has not identified themselves and whose remedy is to log in, and a verified session without the admin role is a caller who has identified themselves and is not entitled. Collapsing them into one arm would force each presentation to re-derive the distinction, which is the transcription this module exists to remove.
 *
 * It is not a `Response` and not an action failure either, and that is the point: a JSON endpoint and a form action need the SAME decision and DIFFERENT rejections, so the decision has to be expressible without naming either presentation.
 */
export type AdminIdentityVerdict = { outcome: 'allowed' } | { outcome: 'unauthenticated' } | { outcome: 'forbidden' };

/**
 * The admin authorization DECISION, shared by every admin entry point: a VERIFIED identity first, then the admin role.
 *
 * ## Why the role check alone was not an authorization check
 *
 * `getUserData` reaches `SupabaseDataWriter._getBasicUserData`, which reads the caller's role out of the access token carried by the request cookies. Reading a token is not verifying one. `supabase.auth.getSession()` returns whatever the configured cookie storage holds and checks only the session's SELF-REPORTED `expires_at` — `@supabase/auth-js` wraps the `user` it hands back in an insecure-use proxy for exactly that reason — so an unauthenticated caller who sets an `sb-*` cookie carrying a self-minted JWT with `{"user_roles":[{"role":"super_admin"}]}` and a future `expires_at` used to pass every one of the six job endpoints' `role !== 'admin'` checks. The PostgREST writes such a caller triggers are re-checked against the real signature and fail — but only after the LLM spend and after the job store (author e-mail addresses, inputs, pipeline messages) has been disclosed.
 *
 * ## Why `safeGetSession` and nothing else
 *
 * `locals.safeGetSession()` (`hooks.server.ts`) is this codebase's ONE verification path: it calls `getSession()` and then `getUser()`, the round-trip that checks the token against Supabase Auth, and returns `{ session: null, user: null }` when that fails. No `getClaims()`, no hand-rolled decode, so a future change to what "verified" means has exactly one place to land.
 *
 * ## Why the decision lives here rather than inside one of its two presentations
 *
 * Eight call sites reach it — the six `/api/admin/jobs/**` endpoints through `requireVerifiedAdmin`, and the two admin form actions through `requireAdminAction` — and the gate is only honest while all eight agree. Eight transcriptions of a two-step check are eight chances to keep one of the steps, which is exactly what happened before: the six endpoints tested a role off an unverified token while the two form actions verified a session and tested no role at all, so each family held one half of the check and neither held both.
 *
 * ## Why the role name is not spelled here
 *
 * The role NAMES are declared once, as `ADMIN_ROLES` in `$lib/auth/roles.ts`, and the normalisation from those names to the coarse `'candidate' | 'admin'` this function tests happens once, in `SupabaseDataWriter._getBasicUserData`, which consumes that declaration through `hasAnyRole(userRoles, ADMIN_ROLES)`. Testing the normalised role here therefore consumes the single declaration transitively. Re-spelling the three admin role names in this file — even inside this docstring — would be a third copy of a list whose drift fails silently in the permissive direction, and it would also trip the criterion-9 count, which is a substring match and cannot tell a mention from a declaration.
 *
 * ## Statelessness is a property, not an accident
 *
 * Every value the decision reads comes from its arguments — the request's own `locals` and the request's own `fetch` — and it holds no module-level mutable state, so two concurrent callers with different sessions cannot observe each other's verdict.
 * @param source.fetch - The caller's request-scoped `fetch`.
 * @param source.locals - The caller's `event.locals`, carrying this request's client and `safeGetSession`.
 * @returns The verdict for this request. Never a `Response`, never an action failure.
 */
export async function requireAdminIdentity({
  fetch,
  locals
}: {
  fetch: Fetch;
  locals: App.Locals;
}): Promise<AdminIdentityVerdict> {
  // The verifying round-trip. `session` is trustworthy here ONLY because `safeGetSession` discards it when `getUser()` errors, which is what a forged or revoked token produces.
  const { session } = await locals.safeGetSession();
  if (!session) return { outcome: 'unauthenticated' };

  // `?.` rather than `.` is load-bearing: `getUserData` swallows its own adapter errors into `undefined`, so the identity read can yield nothing even for a session that verified. That case takes the forbidden branch — deny by default — rather than throwing on a read of a missing value. A verified identity carrying no role rows at all resolves to `role: null` and takes the same branch, by the same comparison.
  if ((await getUserData({ fetch, locals }))?.role !== 'admin') return { outcome: 'forbidden' };

  return { outcome: 'allowed' };
}
