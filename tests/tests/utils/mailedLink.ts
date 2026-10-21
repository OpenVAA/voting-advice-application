/**
 * The one thing a test does to a link it received by mail, and the assertion that the link is the kind of link the test expects.
 *
 * The `account-access` Edge Function mails `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=<type>`, where the type is `magiclink` in a sign-in mail and `recovery` in a password-recovery mail. `SITE_URL` is the function's own configuration; a run serves the application on `http://localhost:<FRONTEND_PORT>`, which can be another port. So a test that opens a received link replaces its scheme, host and port with the run's origin, and nothing else.
 *
 * WHAT IS NORMALISED: the origin, by {@link toRunOrigin}. Path, query and fragment come out byte for byte as they went in.
 *
 * WHAT IS NEVER BUILT HERE: the path, the locale segment, the parameter names, the type and the token. Each is taken from the mail, and {@link assertSignInLinkShape} asserts every one of them before a test uses the link: the path for the locale, exactly the two parameters, and the one type the test names out of {@link MailedLinkType}. A link that lacks the shape — a link of the other type among them — is refused, never repaired.
 *
 * Nothing here logs or throws a link, a query string or a token. An error names what differs: a path, a parameter name, a type.
 */

/** The parameters a mailed link's query holds, sorted. */
const SIGN_IN_LINK_PARAMETERS = ['token_hash', 'type'];

/** The `type` a mailed link can carry: `magiclink` in a sign-in mail, for a first-time and a returning user alike, and `recovery` in a password-recovery mail. */
export type MailedLinkType = 'magiclink' | 'recovery';

/** Every member of {@link MailedLinkType}. */
const MAILED_LINK_TYPES: ReadonlyArray<MailedLinkType> = Object.freeze(['magiclink', 'recovery']);

/** The scheme and authority at the start of an absolute URL: everything before the path, the query or the fragment. */
const ORIGIN_PART = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i;

/**
 * Assert that a received link is a callback link of one type for a locale, and return its token.
 *
 * It holds when the link parses as a URL whose path is exactly `/<locale>/api/auth/callback`, whose query holds exactly the parameters `token_hash` and `type`, once each, whose `type` is the one asked for, whose `token_hash` is not empty, and which carries no credentials and no fragment. The origin is not asserted here: it is the function's `SITE_URL`.
 *
 * @param link - The link as read from the mail.
 * @param options.locale - The locale that was requested.
 * @param options.type - The type the link must carry; `magiclink` when absent. A link of the other type is refused.
 * @returns The value of `token_hash`.
 * @throws Error naming what differs, or that the type asked for is neither of the two. The message holds no token and no query string.
 */
export function assertSignInLinkShape(
  link: string,
  { locale, type: expectedType = 'magiclink' }: { locale: string; type?: MailedLinkType }
): string {
  if (!MAILED_LINK_TYPES.includes(expectedType)) {
    throw new Error(`assertSignInLinkShape: can assert only the types [${MAILED_LINK_TYPES.join(', ')}]`);
  }

  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new Error('assertSignInLinkShape: the link does not parse as an absolute URL');
  }

  const expectedPath = `/${locale}/api/auth/callback`;
  if (url.pathname !== expectedPath) {
    throw new Error(`assertSignInLinkShape: the path is ${url.pathname}, expected ${expectedPath}`);
  }

  const parameters = [...url.searchParams.keys()].sort();
  if (parameters.join(',') !== SIGN_IN_LINK_PARAMETERS.join(',')) {
    throw new Error(
      `assertSignInLinkShape: the query holds the parameters [${parameters.join(', ')}], expected exactly [${SIGN_IN_LINK_PARAMETERS.join(', ')}]`
    );
  }

  const type = url.searchParams.get('type');
  if (type !== expectedType) {
    throw new Error(`assertSignInLinkShape: the type is not ${expectedType}`);
  }

  const token = url.searchParams.get('token_hash');
  if (!token) throw new Error('assertSignInLinkShape: the token_hash is empty');

  if (url.username !== '' || url.password !== '') {
    throw new Error('assertSignInLinkShape: the link carries credentials');
  }
  if (url.hash !== '') throw new Error('assertSignInLinkShape: the link carries a fragment');

  return token;
}

/**
 * Move a received link to the run's origin: its scheme, host and port are replaced, and everything after them is returned byte for byte.
 *
 * The rest of the link is copied as a string and never parsed, so no character of the path or the query is re-encoded.
 *
 * @param link - The link as read from the mail.
 * @param runOrigin - The origin the run serves the application on, such as the result of {@link runOriginFromEnv}.
 * @returns The link on the run's origin.
 * @throws Error when the link is not an absolute URL or `runOrigin` does not parse. The message holds neither.
 */
export function toRunOrigin(link: string, runOrigin: string): string {
  const originPart = ORIGIN_PART.exec(link);
  if (!originPart) throw new Error('toRunOrigin: the link is not an absolute URL');

  let origin: string;
  try {
    origin = new URL(runOrigin).origin;
  } catch {
    throw new Error('toRunOrigin: the run origin does not parse as a URL');
  }

  return `${origin}${link.slice(originPart[0].length)}`;
}

/**
 * The origin the run serves the application on: the one the Playwright configuration's `use.baseURL` names.
 *
 * @returns `http://localhost:<FRONTEND_PORT>`, with port 5173 when the variable is unset or empty.
 */
export function runOriginFromEnv(): string {
  return process.env.FRONTEND_PORT ? `http://localhost:${process.env.FRONTEND_PORT}` : 'http://localhost:5173';
}
