import { COOKIE } from '$lib/cookies';

/**
 * How long the browser keeps `COOKIE.logoutDeadline` after the end of the logout modal's count, in seconds, so that a count that runs always signs out through its own flow before the server does.
 */
export const LOGOUT_DEADLINE_GRACE_SECONDS = 10;

/** How long `COOKIE.logoutPending` is kept, in seconds: 400 days, the session cookie's own max age, so it outlives a closed browser as the session does. The page and the server write it with this max age alike. */
export const LOGOUT_PENDING_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

/**
 * The value the server's request hook writes into `COOKIE.logoutPending` once it has signed out a request whose count the browser had let run out. It is not an id of a count, so the hook never acts on it, and a session signed in after it is kept; the page reads it as "discard the Contestant App's drafts" and removes it.
 */
export const LOGOUT_DEADLINE_SETTLED = 'passed';

/**
 * The `sessionStorage` key under which a tab keeps the id of the count it wrote. It survives a reload of the same tab and is not shared with another, so a reload of the tab that held the modal removes its count and a page of another tab, which has no record of it, leaves the count alone.
 */
export const LOGOUT_TAB_RECORD_KEY = 'logout-deadline-tab';

/**
 * The state of the logout modal's count, as the two cookies hold it:
 *
 * - `'none'`: no id of a count is pending.
 * - `'counting'`: one id is pending, and the browser still holds the deadline beside it.
 * - `'runOut'`: one id is pending, and the browser has dropped the deadline, at the count's end plus the grace.
 * - `'duplicated'`: more than one id is pending at once, as a copy written for a parent domain makes possible.
 * - `'settled'`: the server has signed out a count that ran out and written {@link LOGOUT_DEADLINE_SETTLED}.
 */
export type LogoutDeadlineState = 'none' | 'counting' | 'runOut' | 'duplicated' | 'settled';

/** The shape of an id of a count's opening: 32 lower-case hexadecimal characters. */
const COUNT_ID = /^[0-9a-f]{32}$/;

/** The number of random bytes in an id of a count's opening. */
const COUNT_ID_BYTES = 16;

/** The shape of a host name that is an IPv4 address. */
const IPV4_ADDRESS = /^\d{1,3}(\.\d{1,3}){3}$/;

/** The id of the count this document wrote and has not withdrawn: the modal it holds is still open, or the page was restored from the back-forward cache with it. */
let ownCountId: string | undefined;

/**
 * Every value one cookie name has in a `Cookie` header or a `document.cookie` string, in the order they appear. A browser sends one value per copy it holds, so a name may appear more than once.
 *
 * @param header - The header or the string, or `null` or `undefined` when there is none.
 * @param name - The cookie's name, matched whole.
 * @returns The values, with no decoding.
 */
export function cookieValues(header: string | null | undefined, name: string): Array<string> {
  if (!header) return [];
  const values: Array<string> = [];
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) values.push(part.slice(separator + 1).trim());
  }
  return values;
}

/**
 * The state of the logout modal's count, from the values of the two cookies.
 *
 * Pure, so the server's request hook and the page decide it alike. It compares no time: the deadline is the browser's, which drops `COOKIE.logoutDeadline` at its expiry by its own clock.
 *
 * @param pendingValues - Every value of `COOKIE.logoutPending`.
 * @param deadlineValues - Every value of `COOKIE.logoutDeadline`.
 * @returns `'settled'` when any pending value is {@link LOGOUT_DEADLINE_SETTLED}; otherwise `'none'` when no pending value is a well-formed id, `'duplicated'` for more than one distinct id, `'counting'` for one id with a deadline value, and `'runOut'` for one id with none.
 */
export function logoutDeadlineState(
  pendingValues: ReadonlyArray<string>,
  deadlineValues: ReadonlyArray<string>
): LogoutDeadlineState {
  if (pendingValues.includes(LOGOUT_DEADLINE_SETTLED)) return 'settled';
  const ids = new Set(pendingValues.filter((value) => COUNT_ID.test(value)));
  if (ids.size === 0) return 'none';
  if (ids.size > 1) return 'duplicated';
  return deadlineValues.length > 0 ? 'counting' : 'runOut';
}

/**
 * The proper parent domains of a host name that have at least two labels each, nearest first: `a.b.example.org` gives `b.example.org` and `example.org`. A host name of two labels or fewer, and an IP address, give none. A browser refuses a cookie for a public suffix, so the list needs no suffix table.
 *
 * @param hostname - The host name, as a URL's `hostname` holds it.
 * @returns The parent domains a cookie of this host's pages can have been written for.
 */
export function parentDomainsOf(hostname: string): Array<string> {
  if (hostname.includes(':') || IPV4_ADDRESS.test(hostname)) return [];
  const labels = hostname.split('.');
  const parents: Array<string> = [];
  for (let start = 1; start <= labels.length - 2; start++) parents.push(labels.slice(start).join('.'));
  return parents;
}

/**
 * The domains a removal of one of the two cookies names besides the host-only copy: the host name itself, then its parent domains by {@link parentDomainsOf}, nearest first. `example.org` gives `example.org`; `app.example.org` gives `app.example.org` and `example.org`. A copy written for the host's own domain is stored apart from the host-only one, and any host of the site under it can write one, so a removal names it too. `localhost`, a host name of one label and an IP address give none: no cookie can be written for a domain of theirs.
 *
 * @param hostname - The host name, as a URL's `hostname` holds it.
 * @returns The domains a cookie of this host's pages can have been written for.
 */
export function removalDomainsOf(hostname: string): Array<string> {
  if (hostname.includes(':') || IPV4_ADDRESS.test(hostname) || !hostname.includes('.')) return [];
  return [hostname, ...parentDomainsOf(hostname)];
}

/**
 * Write the two cookies of the logout modal's count in the browser: `COOKIE.logoutPending`, a random id of this opening kept {@link LOGOUT_PENDING_MAX_AGE_SECONDS}, and `COOKIE.logoutDeadline`, the same id, which the browser drops at the count's end plus {@link LOGOUT_DEADLINE_GRACE_SECONDS} by its own clock. The server's request hook signs out a request that carries the first without the second. The id is kept as this document's own count and as the tab's record under {@link LOGOUT_TAB_RECORD_KEY}. Does nothing outside the browser.
 *
 * The page writes them, so they are not `httpOnly`. They name no user and carry no time.
 *
 * @param countSeconds - The length of the count, in seconds.
 */
export function writeLogoutDeadline(countSeconds: number): void {
  if (typeof document === 'undefined') return;
  const id = randomCountId();
  setCookie(COOKIE.logoutPending, id, LOGOUT_PENDING_MAX_AGE_SECONDS);
  setCookie(COOKIE.logoutDeadline, id, Math.ceil(countSeconds) + LOGOUT_DEADLINE_GRACE_SECONDS);
  ownCountId = id;
  writeTabRecord(id);
}

/**
 * Withdraw the count this document wrote: remove both cookies of the logout modal's count in the browser, the host-only copy and one for each domain {@link removalDomainsOf} names for the page's host, when `COOKIE.logoutPending` still holds this document's id, and forget the id and the tab's record of it. A count another document wrote is left alone. Does nothing outside the browser.
 */
export function clearLogoutDeadline(): void {
  if (typeof document === 'undefined') return;
  const id = ownCountId;
  ownCountId = undefined;
  if (id === undefined) return;
  if (readTabRecord() === id) forgetTabRecord();
  if (cookieValues(document.cookie, COOKIE.logoutPending).includes(id)) expireEveryCopy();
}

/**
 * Withdraw every count of the logout modal in the browser, whoever wrote it, as a Log out does before its sign-out request: forget this document's own count and the tab's record, and expire every copy of both cookies, so that no count a closed tab left can end a session signed in after it. When `COOKIE.logoutPending` holds {@link LOGOUT_DEADLINE_SETTLED} it changes nothing: the settlement discards the drafts of the session the server ended, and removes the value itself. Does nothing outside the browser.
 */
export function withdrawAnyCount(): void {
  if (typeof document === 'undefined') return;
  const state = logoutDeadlineState(
    cookieValues(document.cookie, COOKIE.logoutPending),
    cookieValues(document.cookie, COOKIE.logoutDeadline)
  );
  if (state === 'settled') return;
  withdrawEveryCount();
}

/**
 * Settle the two cookies of the logout modal's count in the browser, by their {@link LogoutDeadlineState}.
 *
 * On `'settled'`, which the server writes once it has signed the browser out, the drafts are discarded once and every copy of both cookies is removed, with the tab's record, on either trigger. On `'duplicated'` every copy is removed and nothing is discarded. A count the browser has let run out is left to the server, which signs the browser out at its next request and settles it then. A count still running is left by a navigation, and by a document that holds it as its own, as a page restored from the back-forward cache with its modal still counting does. A fresh document of the tab whose record names the count removes it, and the record: that tab was reloaded, and its modal went with the document that held it. A page of another tab has no record of the count, and leaves it. The drafts are never discarded but on the server's value. Does nothing outside the browser or when there is no cookie.
 *
 * @param discardDrafts - Removes the drafts a sign-out removes.
 * @param trigger - `'document'` when a document loads or is restored from the back-forward cache, `'navigation'` after a navigation inside a document.
 */
export function settleLogoutDeadline(discardDrafts: () => void, trigger: 'document' | 'navigation'): void {
  if (typeof document === 'undefined') return;
  const pendingValues = cookieValues(document.cookie, COOKIE.logoutPending);
  const state = logoutDeadlineState(pendingValues, cookieValues(document.cookie, COOKIE.logoutDeadline));
  switch (state) {
    case 'settled':
      discardDrafts();
      withdrawEveryCount();
      return;
    case 'duplicated':
      withdrawEveryCount();
      return;
    case 'counting': {
      const id = pendingValues.find((value) => COUNT_ID.test(value));
      if (trigger === 'document' && id !== ownCountId && id === readTabRecord()) withdrawEveryCount();
      return;
    }
    case 'runOut':
    case 'none':
      return;
  }
}

/** A random id of a count's opening, from `crypto.getRandomValues`, which needs no secure context. */
function randomCountId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(COUNT_ID_BYTES));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Expire every copy of both cookies, and forget this document's own count and the tab's record. */
function withdrawEveryCount(): void {
  ownCountId = undefined;
  forgetTabRecord();
  expireEveryCopy();
}

/** The id the tab's record holds, or `null` when it holds none or `sessionStorage` cannot be read. */
function readTabRecord(): string | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(LOGOUT_TAB_RECORD_KEY);
  } catch {
    return null;
  }
}

/** Keep the id of the count this tab wrote. A `sessionStorage` that refuses the write leaves the tab with no record: a reload of this tab then leaves the count, which the server signs out at its end. */
function writeTabRecord(id: string): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(LOGOUT_TAB_RECORD_KEY, id);
  } catch {
    // No record is kept; the count stands as it was written.
  }
}

/** Forget the tab's record of a count. */
function forgetTabRecord(): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(LOGOUT_TAB_RECORD_KEY);
  } catch {
    // A `sessionStorage` that cannot be reached holds no record to forget.
  }
}

/** Expire both cookies, host-only, for the page's host's own domain and for each of its parent domains. */
function expireEveryCopy(): void {
  const hostname = typeof location === 'undefined' ? '' : location.hostname;
  for (const name of [COOKIE.logoutPending, COOKIE.logoutDeadline]) {
    setCookie(name, '', 0);
    for (const domain of removalDomainsOf(hostname)) setCookie(name, '', 0, domain);
  }
}

/**
 * Assign one of the two cookies with the attributes every write and removal carries, so a removal names the cookie a write made.
 *
 * @param name - The cookie's name.
 * @param value - The cookie's value.
 * @param maxAge - Its max age in seconds; `0` removes it.
 * @param domain - The domain of a copy to remove, the host's own or a parent, or `undefined` for the host-only copy.
 */
function setCookie(name: string, value: string, maxAge: number, domain?: string): void {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  const domainAttribute = domain ? `; Domain=${domain}` : '';
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${domainAttribute}${secure}`;
}
