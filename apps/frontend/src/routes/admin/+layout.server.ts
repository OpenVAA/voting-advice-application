/**
 * # Admin App outermost server loader — the request's session, as a PROJECTION
 *
 * Provides the Admin App's `page.data.session` to `authContext`'s `isAuthenticated` derived flag and to `getUserData`'s ancestor pre-check, both of which need EXISTENCE only.
 *
 * ## ⚠ Why this returns a PROJECTION and not the session, and why it must not go back
 *
 * This load used to return `locals.safeGetSession()`'s whole `Session` — `access_token`, **`refresh_token`**, `expires_at` and the full `user` record. Everything a server load returns is serialised into the hydration payload in the HTML body, so that put a REFRESH TOKEN into the document of every Admin App page, for every signed-in user. The refresh token is the higher-value credential of the pair: it is long-lived, and duplicating it into a document body exposes it to HTML/page caches (`render.example.yaml` provisions a cache disk for this service), to `view-source` sharing, and to DOM-snapshot error reporters. That shape was MEASURED on a running server before it was changed here, rather than assumed; the spec named below carries the provenance.
 *
 * The reason is written out HERE, in full, rather than referenced: a reader arriving at this file must find it without following a link. That is the convention `routes/+layout.server.ts` established when it removed the same class from the root, and this file's projection is the one that file's docstring already sanctioned.
 *
 * `{ userId, expiresAt }` is therefore the whole vocabulary. Adding a member back — the access token, the refresh token, the user record — is not a widening of a payload, it is a re-disclosure of a credential; the ONE spec that drives BOTH of these loads — they are byte-identical up to their application name, and a spec pinning only one would let the other drift into a second idiom for one problem — enumerates the returned key set and fails such a member BY NAME, and `scripts/assert-no-session-in-loads.mjs` fails the lint chain if any server load returns the verified-session binding itself.
 *
 * ## Why the identifier comes from the VERIFIED user
 *
 * `locals.safeGetSession()` returns two things: the session, and a user it verified separately with `getUser()`. The session's OWN nested user is wrapped in an insecure-use proxy by the auth library precisely because it is unverified. The verified one is already in scope in the same destructuring, so preferring it costs nothing and removes a warning-shaped footgun.
 */

export async function load({ locals }) {
  const { session, user } = await locals.safeGetSession();

  // The projection, built per request and held nowhere: one request's identifier cannot reach another request's payload. `expires_at` is carried through as the value the session reported — never re-derived from a clock, never rounded, never converted between units — or the null form when the session reports none.
  return {
    session: session && user ? { userId: user.id, expiresAt: session.expires_at ?? null } : null
  };
}
