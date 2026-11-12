/**
 * The mailed link, for signing in and for recovering a password: where it points, and whether the auth service would redirect there.
 *
 * Pure functions with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * The link's origin is the function's configured site origin and nothing a request carries. A link built from a request header would let a caller have a sign-in token mailed inside a link to a site of their choosing.
 */

import { SIGN_IN_MAIL_LOCALES } from './mailTemplates.ts';
import type { SignInMailLocale } from './mailTemplates.ts';

/** The path of the application's auth callback, after the locale segment. */
const CALLBACK_PATH = '/api/auth/callback';

/** The two types a mailed link names, in the auth service's words: one that signs in, and one that signs in to set a new password. */
export const LINK_TYPES = ['magiclink', 'recovery'] as const;

/** The type a mailed link names. */
export type LinkType = (typeof LINK_TYPES)[number];

/**
 * The origin of a configured site URL.
 *
 * @throws {Error} When the value is not an `http:` or `https:` URL, or carries credentials, a path other than `/`, a query or a fragment
 */
function siteOrigin(siteUrl: string): string {
  let url: URL;
  try {
    url = new URL(siteUrl);
  } catch {
    throw new Error('SITE_URL is not a URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('SITE_URL is not an http or https URL.');
  if (url.username !== '' || url.password !== '') throw new Error('SITE_URL carries credentials.');
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new Error('SITE_URL carries a path, a query or a fragment; it must be an origin.');
  }
  return url.origin;
}

/**
 * The auth callback URL of a locale.
 *
 * @param siteUrl - The configured site origin
 * @param locale - One of the locales the sign-in mail exists in
 * @returns `<origin>/<locale>/api/auth/callback`
 * @throws {Error} When `siteUrl` is not a bare `http:` or `https:` origin, or `locale` is not one of the set
 */
export function callbackUrl({ siteUrl, locale }: { siteUrl: string; locale: SignInMailLocale }): string {
  if (!(SIGN_IN_MAIL_LOCALES as ReadonlyArray<string>).includes(locale)) {
    throw new Error('The locale is not one the sign-in mail exists in.');
  }
  return `${siteOrigin(siteUrl)}/${locale}${CALLBACK_PATH}`;
}

/**
 * The link that is mailed.
 *
 * @param siteUrl - The configured site origin
 * @param locale - One of the locales the sign-in mail exists in
 * @param tokenHash - The token hash the auth service issued
 * @param type - Which of the two types the link names
 * @returns The callback URL with exactly the two query parameters `token_hash` and `type`, the token encoded by the URL API
 * @throws {Error} As {@link callbackUrl} does, and when `type` is not one of the two
 */
export function buildSignInLink({
  siteUrl,
  locale,
  tokenHash,
  type
}: {
  siteUrl: string;
  locale: SignInMailLocale;
  tokenHash: string;
  type: LinkType;
}): string {
  if (!(LINK_TYPES as ReadonlyArray<string>).includes(type)) {
    throw new Error('The link type is not one a mailed link names.');
  }
  const url = new URL(callbackUrl({ siteUrl, locale }));
  url.searchParams.set('token_hash', tokenHash);
  url.searchParams.set('type', type);
  return url.toString();
}

/**
 * Whether the auth service admits a callback URL as a redirect target.
 *
 * Asked a verification with an invalid token and a `redirect_to`, the auth service answers a redirect either to the requested URL, when its allowlist admits it, or to its own site URL, when it does not. The query and the fragment of the `Location` carry the service's error text and are not compared.
 *
 * @param requested - The callback URL the service was asked to redirect to
 * @param location - The `Location` header of its answer, or null when there was none
 * @returns True only when the `Location` has the requested URL's origin and the requested URL's path
 */
export function isRedirectAdmitted({
  requested,
  location
}: {
  requested: string;
  location: string | null | undefined;
}): boolean {
  if (typeof location !== 'string' || location === '') return false;
  let asked: URL;
  let answered: URL;
  try {
    asked = new URL(requested);
    answered = new URL(location);
  } catch {
    return false;
  }
  return answered.origin === asked.origin && answered.pathname === asked.pathname;
}
