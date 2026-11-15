import { json } from '@sveltejs/kit';
import { requireAdminIdentity } from './requireAdminIdentity';

/**
 * The ENDPOINT presentation of {@link requireAdminIdentity}: the same decision, a different rejection.
 *
 * This is one of exactly two wrappers over the shared decision, and the only thing it contains is the shape of the refusal. Its sibling `requireAdminAction` returns a SvelteKit action failure for the two admin form actions; this one returns a JSON `Response` for the six `/api/admin/jobs/**` endpoints. Neither re-derives what "admin" means.
 *
 * ## What moved, and what did not
 *
 * The two-step check this helper used to perform inline — the verifying `safeGetSession()` round-trip, then the admin-role test — now lives in `requireAdminIdentity`, together with the reasoning that explains why reading a token is not verifying one. That argument belongs with the DECISION rather than with one of its two presentations, and it is why the extraction moved the docstring rather than deleting it with the body.
 *
 * NOTHING a caller can observe changed. The exported name, the parameter shape and both rejection statuses are unchanged: 401 carrying `{ error: 'Unauthorized' }` for a request with no session or one whose token fails verification, 403 carrying `{ error: 'Forbidden' }` for a verified caller without the admin role, and `undefined` for a verified admin. `requireAdminIdentity.test.ts` asserts all three, so a future change to the decision that loosened one of the six endpoints would redden here rather than ship.
 * @param source.fetch - The endpoint's request-scoped `fetch`.
 * @param source.locals - The endpoint's `event.locals`, carrying this request's client and `safeGetSession`.
 * @returns The `Response` the endpoint must return when the caller is rejected, or `undefined` when the caller is a verified admin.
 */
export async function requireVerifiedAdmin({
  fetch,
  locals
}: {
  fetch: Fetch;
  locals: App.Locals;
}): Promise<Response | undefined> {
  const verdict = await requireAdminIdentity({ fetch, locals });

  switch (verdict.outcome) {
    case 'unauthenticated':
      return json({ error: 'Unauthorized' }, { status: 401 });
    case 'forbidden':
      return json({ error: 'Forbidden' }, { status: 403 });
    case 'allowed':
      return undefined;
  }
}
