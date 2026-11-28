import { createAdminWriter } from '$lib/api/adminWriter';

/**
 * What the admin gate decided about one request, in the only three shapes it can decide.
 *
 * A DISCRIMINATED VERDICT rather than a boolean, because the two rejections are not the same rejection and the callers must be able to tell them apart: a missing session is a caller who has not identified themselves and whose remedy is to log in, and a verified session that may not administer the project is a caller who has identified themselves and is not entitled. Collapsing them into one arm would force each presentation to re-derive the distinction, which is the transcription this module exists to remove.
 *
 * It is not a `Response` and not an action failure either, and that is the point: a JSON endpoint and a form action need the SAME decision and DIFFERENT rejections, so the decision has to be expressible without naming either presentation.
 */
export type AdminIdentityVerdict = { outcome: 'allowed' } | { outcome: 'unauthenticated' } | { outcome: 'forbidden' };

/**
 * The admin authorization DECISION, shared by every admin entry point: a VERIFIED identity first, then the database's answer to whether that identity may administer this deployment's project.
 *
 * ## Why `safeGetSession` and nothing else
 *
 * `locals.safeGetSession()` (`hooks.server.ts`) is this codebase's ONE verification path: it calls `getSession()` and then `getUser()`, the round-trip that checks the token against Supabase Auth, and returns `{ session: null, user: null }` when that fails. Reading a token is not verifying one: `supabase.auth.getSession()` returns whatever the cookie storage holds and checks only the session's self-reported `expires_at`. No `getClaims()`, no hand-rolled decode, so a future change to what "verified" means has exactly one place to land.
 *
 * ## Why authority is asked of `user_can` alone
 *
 * The grants claim in the token says only what the caller holds somewhere in the Supabase instance, and the job endpoints this gate fronts serve an in-memory job store that row-level security never sees (author e-mails, LLM inputs and outputs, abort control) and start LLM spend before any RLS-checked write. So the question is asked of the database's one predicate, for `PUBLIC_PROJECT_ID` itself, and never re-derived from the claim here.
 *
 * ## Why the decision lives here rather than inside one of its two presentations
 *
 * Eight call sites reach it — the six `/api/admin/jobs/**` endpoints through `requireVerifiedAdmin`, and the two admin form actions through `requireAdminAction` — and the gate is only honest while all eight agree. Eight transcriptions of a two-step check are eight chances to keep one of the steps.
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

  // Asked of the database's one predicate, through an admin writer built on the request's own client -- so the caller's own verified token, and the adapter's configured project. `project.edit_questions` is the permission the admin job features act under. Anything but a literal `true` -- an error, a null, a throw -- denies.
  let administersProject: boolean;
  try {
    administersProject = await createAdminWriter({ fetch, locals }).callerMayOnProject('project.edit_questions');
  } catch {
    administersProject = false;
  }
  if (!administersProject) return { outcome: 'forbidden' };

  return { outcome: 'allowed' };
}
