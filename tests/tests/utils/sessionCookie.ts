/**
 * Read the address of the account a browser is signed in to from the session cookies `@supabase/ssr` writes, for a page that names no account on screen.
 *
 * The cookie is `sb-<first label of the project host>-auth-token`, or its `.0`, `.1`, … chunks when the session is too long for one cookie. Its value is `base64-` followed by the base64url encoding of the session's JSON, each chunk URL-encoded.
 */

import type { Page } from '@playwright/test';

/** The session cookie's name, with the index of its chunk when it is chunked. */
const SESSION_COOKIE = /^sb-[A-Za-z0-9-]+-auth-token(?:\.(\d+))?$/;

/** The prefix `@supabase/ssr` writes ahead of the base64url-encoded session. */
const BASE64_PREFIX = 'base64-';

/**
 * The address of the user of the session that a set of cookies holds.
 *
 * @param cookies - The browser's cookies, each with its name and value.
 * @returns The session user's address, or `undefined` when the cookies hold no session or a session with no address.
 */
export function sessionAddressOf(cookies: ReadonlyArray<{ name: string; value: string }>): string | undefined {
  const chunks = cookies
    .map((cookie) => ({ match: SESSION_COOKIE.exec(cookie.name), value: cookie.value }))
    .filter((chunk): chunk is { match: RegExpExecArray; value: string } => chunk.match !== null)
    .map(({ match, value }) => ({ index: match[1] === undefined ? -1 : Number(match[1]), value }))
    .sort((a, b) => a.index - b.index);
  if (chunks.length === 0) return undefined;

  const joined = chunks.map(({ value }) => decodeURIComponent(value)).join('');
  const json = joined.startsWith(BASE64_PREFIX)
    ? Buffer.from(joined.slice(BASE64_PREFIX.length), 'base64url').toString('utf8')
    : joined;
  const session: unknown = JSON.parse(json);
  const email = (session as { user?: { email?: unknown } } | null)?.user?.email;
  return typeof email === 'string' ? email : undefined;
}

/**
 * The address of the account the page's browser context is signed in to.
 *
 * @param page - The page whose browser context's cookies are read.
 * @returns The session user's address, or `undefined` when the browser holds no session.
 */
export async function signedInAddress(page: Page): Promise<string | undefined> {
  return sessionAddressOf(await page.context().cookies());
}
