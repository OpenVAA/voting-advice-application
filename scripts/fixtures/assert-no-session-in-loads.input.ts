/**
 * Fixture INPUT for `node scripts/assert-no-session-in-loads.mjs`.
 *
 * NOT compiled, NOT imported, NOT linted, NOT formatted (see .prettierignore). It exists so that
 * the guard is flagged red in EVERY run in which it reports the real route tree clean: a guard
 * that has never been seen red has not been shown to guard anything, and a zero from a scanner
 * that has silently stopped matching is indistinguishable from a zero from a clean tree.
 *
 * Its sibling `assert-no-session-in-loads.expected.ts.violations` is the exact `path:line` list
 * the guard must report against this file, and the guard diffs the two on every invocation.
 *
 * This docstring names `access_token` and `refresh_token` IN PROSE deliberately: the same words
 * appear in the root server loader's docstring, and the guard's check 2 must not flag either.
 * If a run ever reports a violation on one of the lines of THIS comment, the comment mask has
 * been broken and the whole guard is about to be reported as failing against correct code.
 */

// ── POSITIVE (check 1, shorthand) — a binding destructured from the verified-session call and
// returned as a shorthand member. This is the exact shape both subtree loads carried before
// phase 158 plan 13 narrowed them.
export async function loadReturningTheSessionShorthand({ locals }) {
  const { session } = await locals.safeGetSession();
  return { session };
}

// ── POSITIVE (check 1, named member) — the same binding under a different key, which a search
// keyed on the KEY rather than on the VALUE would walk straight past.
export async function loadReturningTheSessionUnderAnotherKey({ locals }) {
  const { session: verified } = await locals.safeGetSession();
  return { supabaseSession: verified };
}

// ── POSITIVE (check 1, re-wrap) — the same disclosure wearing an object literal.
export async function loadReturningTheSessionRewrapped({ locals }) {
  const { session } = await locals.safeGetSession();
  return { session: { ...session } };
}

// ── POSITIVE (check 1, whole result) — the call's whole result bound, then its session member
// returned. Not a destructure at all, so a destructure-only pattern misses it.
export async function loadReturningTheWholeResultsSession({ locals }) {
  const auth = await locals.safeGetSession();
  return { session: auth.session };
}

// ── POSITIVE (check 2, code) — the credential field named in CODE rather than in prose.
export async function loadNamingTheCredentialInCode({ locals }) {
  const { session } = await locals.safeGetSession();
  const token = session?.access_token ?? null;
  return { hasToken: Boolean(token) };
}

// ── NEGATIVE (check 1, destructure with no return of it) — the shape the protected candidate
// loader really has: it takes a session for its OWN guard and returns none of it. Flagging this
// is the failure mode that gets a guard switched off within a week.
export async function loadGuardingOnTheSessionWithoutReturningIt({ locals }) {
  const { session } = await locals.safeGetSession();
  if (!session) return { authorized: false };
  return { authorized: true };
}

// ── NEGATIVE (check 1, an unrelated member of the same name) — `session` here was never taken
// from the verified-session call, so returning it is not this class. This is the case that makes
// check 1 a PAIR test rather than two independent greps.
export async function loadReturningAnUnrelatedSession({ url }) {
  const session = url.searchParams.get('session');
  return { session };
}

// ── NEGATIVE (check 1, the projection) — what a correct load returns.
export async function loadReturningTheProjection({ locals }) {
  const { session, user } = await locals.safeGetSession();
  return { session: session && user ? { userId: user.id, expiresAt: session.expires_at ?? null } : null };
}
