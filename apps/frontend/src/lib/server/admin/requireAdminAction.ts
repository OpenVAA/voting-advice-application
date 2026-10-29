import { fail } from '@sveltejs/kit';
import { requireAdminIdentity } from './requireAdminIdentity';
import type { ActionFailure } from '@sveltejs/kit';

/**
 * The refusal body both admin form actions already speak.
 *
 * Both actions return `fail(status, { type: 'error', error })` for their bad-input and unauthenticated cases and their pages render exactly that, so the authorization refusal reuses the shape rather than introducing a second one the page would have to learn.
 */
type AdminActionFailure = { type: 'error'; error: string };

/**
 * The FORM-ACTION presentation of {@link requireAdminIdentity}: the same decision, a different rejection.
 *
 * This is one of exactly two wrappers over the shared decision, and the only thing it contains is the shape of the refusal. Its sibling `requireVerifiedAdmin` returns a JSON `Response` for the six `/api/admin/jobs/**` endpoints; this one returns a SvelteKit action failure for the two admin form actions. Neither re-derives what "admin" means, which is what makes all eight sites say the same thing.
 *
 * ## Why the two statuses are the ones they are, and must stay split
 *
 * **401 for a missing or unverifiable session; 403 for a verified caller without the admin role.** The split is CR-01's deliberate design and was confirmed live against this checkout: no session yields 401, an authenticated non-admin yields 403, and a verified `project_admin` is admitted. Collapsing them would tell a logged-in candidate to log in, and would tell an unauthenticated caller that the resource exists and is merely closed to them.
 *
 * ## Why the gate belongs in the action at all, given the endpoint is already gated
 *
 * The endpoint gate is a second line, not the first. Before this wrapper existed, an authenticated non-admin's POST entered the action body, built a data writer and issued the privileged `startJob` call; the refusal came from the API route one layer deeper and reached the caller as a `fail(500)` carrying an adapter-internal message that named an internal API route — measured, and recorded in `158-SWALLOWED-ERROR-MEASUREMENT.md`. An action that reports an upstream transport error where an authorization refusal happened is dishonest about what occurred, and it does the work of constructing a privileged writer before finding out it may not.
 *
 * ## Order is the property, not presence
 *
 * Call this FIRST in the action, before the form body is read and before any writer is constructed. A gate placed after the writer call would let exactly the same work happen and would only change what is reported afterwards.
 * @param source.fetch - The action's request-scoped `fetch`.
 * @param source.locals - The action's `event.locals`, carrying this request's client and `safeGetSession`.
 * @returns The `ActionFailure` the action must return when the caller is rejected, or `undefined` when the caller is a verified admin.
 */
export async function requireAdminAction({
  fetch,
  locals
}: {
  fetch: Fetch;
  locals: App.Locals;
}): Promise<ActionFailure<AdminActionFailure> | undefined> {
  const verdict = await requireAdminIdentity({ fetch, locals });

  switch (verdict.outcome) {
    case 'unauthenticated':
      // The message both actions already returned for this case, preserved verbatim so the page's rendering is unchanged for the one branch that existed before.
      return fail(401, { type: 'error', error: 'Authentication required' });
    case 'forbidden':
      return fail(403, { type: 'error', error: 'Administrator access required' });
    case 'allowed':
      return undefined;
  }
}
