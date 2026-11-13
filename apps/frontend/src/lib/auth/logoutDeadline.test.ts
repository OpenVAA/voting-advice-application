/**
 * The two cookies that keep the logout modal's count while it runs: `logout-pending`, which names the count's opening by a random id, and `logout-deadline`, the same id, which the browser drops at the count's end plus a grace. How a `Cookie` header is read for them, which state they are in, how the page writes and removes them, which domains a removal reaches, the host's own and its parents, and how a page settles them, including the value the server writes once it has signed a request out. Which document may remove a count: the one that wrote it, or a fresh document of the tab whose `sessionStorage` records it, and no page of another tab but at a Log out, which withdraws every count and leaves the server's settled marker.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import {
  clearLogoutDeadline,
  cookieValues,
  LOGOUT_DEADLINE_GRACE_SECONDS,
  LOGOUT_DEADLINE_SETTLED,
  LOGOUT_PENDING_MAX_AGE_SECONDS,
  LOGOUT_TAB_RECORD_KEY,
  logoutDeadlineState,
  parentDomainsOf,
  removalDomainsOf,
  settleLogoutDeadline,
  withdrawAnyCount,
  writeLogoutDeadline
} from './logoutDeadline';
import { parseWritten, recordCookieWrites } from './logoutDeadline.testUtils';
import type * as LogoutDeadlineModule from './logoutDeadline';

/** The session cookie's own max age under `@supabase/ssr`'s defaults, in seconds: 400 days. */
const MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

/** A well-formed id of a count's opening, and a second one. */
const ID = '0123456789abcdef0123456789abcdef';
const OTHER_ID = 'fedcba9876543210fedcba9876543210';

/** The shape of an id of a count's opening. */
const ID_SHAPE = /^[0-9a-f]{32}$/;

/** Put a value into one of the two cookies, as the server or another document leaves it. */
function leaveCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

/** The values the page's cookies hold under one name. */
function valuesOf(name: string): Array<string> {
  return cookieValues(document.cookie, name);
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearLogoutDeadline();
  vi.restoreAllMocks();
  // A spy on both of `document.cookie`'s accessors leaves an own property behind when it is restored; removing it returns the document to `Document.prototype`'s cookie jar.
  Reflect.deleteProperty(document, 'cookie');
  for (const name of [COOKIE.logoutPending, COOKIE.logoutDeadline]) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
  window.sessionStorage.clear();
});

describe('cookieValues', () => {
  it('returns every value of one name, in order', () => {
    expect(
      cookieValues(`a=1; ${COOKIE.logoutPending}=${ID}; b=2; ${COOKIE.logoutPending}=passed`, COOKIE.logoutPending)
    ).toEqual([ID, 'passed']);
  });

  it('returns none for another name, or for a name that ends with the one asked for', () => {
    expect(cookieValues(`x${COOKIE.logoutPending}=${ID}; other=1`, COOKIE.logoutPending)).toEqual([]);
  });

  it('returns none for an empty or missing header', () => {
    expect(cookieValues('', COOKIE.logoutPending)).toEqual([]);
    expect(cookieValues(null, COOKIE.logoutPending)).toEqual([]);
    expect(cookieValues(undefined, COOKIE.logoutPending)).toEqual([]);
  });
});

describe('logoutDeadlineState', () => {
  it("is 'none' with no pending value, or with none that is a well-formed id", () => {
    expect(logoutDeadlineState([], [])).toBe('none');
    expect(logoutDeadlineState([], [ID])).toBe('none');
    expect(logoutDeadlineState(['soon', ID.toUpperCase(), `${ID}0`], [ID])).toBe('none');
  });

  it("is 'counting' for one id with a deadline value beside it", () => {
    expect(logoutDeadlineState([ID], [ID])).toBe('counting');
    expect(logoutDeadlineState([ID, ID], [ID])).toBe('counting');
  });

  it("is 'runOut' for one id with no deadline value", () => {
    expect(logoutDeadlineState([ID], [])).toBe('runOut');
  });

  it("is 'duplicated' for two different ids", () => {
    expect(logoutDeadlineState([ID, OTHER_ID], [])).toBe('duplicated');
    expect(logoutDeadlineState([ID, OTHER_ID], [ID])).toBe('duplicated');
  });

  it("is 'settled' whenever a pending value is the settled marker, whatever else is there", () => {
    expect(logoutDeadlineState([LOGOUT_DEADLINE_SETTLED], [])).toBe('settled');
    expect(logoutDeadlineState([ID, LOGOUT_DEADLINE_SETTLED], [])).toBe('settled');
    expect(logoutDeadlineState([LOGOUT_DEADLINE_SETTLED, ID, OTHER_ID], [ID])).toBe('settled');
  });
});

describe('parentDomainsOf', () => {
  it('names the proper parent domains of two labels or more, nearest first', () => {
    expect(parentDomainsOf('a.b.example.org')).toEqual(['b.example.org', 'example.org']);
  });

  it.each(['example.org', 'localhost', '192.168.0.1', '[::1]', '::1'])('names none for %s', (hostname) => {
    expect(parentDomainsOf(hostname)).toEqual([]);
  });
});

describe('removalDomainsOf', () => {
  it.each([
    ['example.org', ['example.org']],
    ['app.example.org', ['app.example.org', 'example.org']],
    ['a.b.example.org', ['a.b.example.org', 'b.example.org', 'example.org']]
  ])('names %s itself and then its proper parent domains, nearest first', (hostname, domains) => {
    expect(removalDomainsOf(hostname)).toEqual(domains);
  });

  it.each(['localhost', '127.0.0.1', '::1', '[::1]'])('names none for %s', (hostname) => {
    expect(removalDomainsOf(hostname)).toEqual([]);
  });
});

describe('writeLogoutDeadline and clearLogoutDeadline', () => {
  it('writes both cookies with one id, for every path, lax, the pending one for as long as a session cookie lasts and the deadline for the count plus the grace', () => {
    const writes = recordCookieWrites();

    writeLogoutDeadline(30);

    const written = writes.map(parseWritten);
    expect(written.map(({ name }) => name).sort()).toEqual([COOKIE.logoutDeadline, COOKIE.logoutPending].sort());
    const pending = written.find(({ name }) => name === COOKIE.logoutPending)!;
    const deadline = written.find(({ name }) => name === COOKIE.logoutDeadline)!;
    expect(pending.value).toMatch(ID_SHAPE);
    expect(deadline.value).toBe(pending.value);
    for (const { attributes } of [pending, deadline]) {
      expect(attributes.path).toBe('/');
      expect(attributes.samesite?.toLowerCase()).toBe('lax');
      expect(attributes).not.toHaveProperty('httponly');
      expect(attributes).not.toHaveProperty('domain');
    }
    expect(pending.attributes['max-age']).toBe(String(MAX_AGE_SECONDS));
    expect(deadline.attributes['max-age']).toBe('40');
  });

  it('gives each write an id of its own', () => {
    writeLogoutDeadline(30);
    const [first] = valuesOf(COOKIE.logoutPending);
    writeLogoutDeadline(30);
    const [second] = valuesOf(COOKIE.logoutPending);

    expect(first).toMatch(ID_SHAPE);
    expect(second).toMatch(ID_SHAPE);
    expect(second).not.toBe(first);
  });

  it('keeps the deadline ten seconds past the count, and the pending id 400 days', () => {
    expect(LOGOUT_DEADLINE_GRACE_SECONDS).toBe(10);
    expect(LOGOUT_PENDING_MAX_AGE_SECONDS).toBe(MAX_AGE_SECONDS);
  });

  it('after a write, expires both cookies host-only on localhost, with no max age left, on the same path', () => {
    writeLogoutDeadline(30);
    const writes = recordCookieWrites();

    clearLogoutDeadline();

    const written = writes.map(parseWritten);
    expect(written.map(({ name }) => name).sort()).toEqual([COOKIE.logoutDeadline, COOKIE.logoutPending].sort());
    for (const { value, attributes } of written) {
      expect(value).toBe('');
      expect(attributes.path).toBe('/');
      expect(attributes['max-age']).toBe('0');
      expect(attributes).not.toHaveProperty('domain');
    }
    expect(valuesOf(COOKIE.logoutPending)).toEqual([]);
    expect(valuesOf(COOKIE.logoutDeadline)).toEqual([]);
  });
});

describe('withdrawAnyCount', () => {
  it("in a document that did not write the count, expires both names, and the state is then 'none'", () => {
    leaveCookie(COOKIE.logoutPending, ID);
    leaveCookie(COOKIE.logoutDeadline, ID);
    const writes = recordCookieWrites();

    withdrawAnyCount();

    const written = writes.map(parseWritten);
    expect(new Set(written.map(({ name }) => name))).toEqual(new Set([COOKIE.logoutDeadline, COOKIE.logoutPending]));
    for (const { attributes } of written) expect(attributes['max-age']).toBe('0');
    expect(logoutDeadlineState(valuesOf(COOKIE.logoutPending), valuesOf(COOKIE.logoutDeadline))).toBe('none');
  });

  it("in the document that wrote the count, also forgets the tab's record, and a later clearLogoutDeadline writes nothing", () => {
    writeLogoutDeadline(30);

    withdrawAnyCount();

    expect(window.sessionStorage.getItem(LOGOUT_TAB_RECORD_KEY)).toBeNull();
    expect(valuesOf(COOKIE.logoutPending)).toEqual([]);
    expect(valuesOf(COOKIE.logoutDeadline)).toEqual([]);
    const writes = recordCookieWrites();
    clearLogoutDeadline();
    expect(writes).toEqual([]);
  });

  it('writes nothing, and keeps the tab’s record, when the settled marker is pending beside an id', () => {
    // jsdom keeps one cookie per name for one host and path, so the two copies a parent domain makes possible are shown to the page by its getter.
    vi.spyOn(document, 'cookie', 'get').mockReturnValue(
      `${COOKIE.logoutPending}=${ID}; ${COOKIE.logoutPending}=${LOGOUT_DEADLINE_SETTLED}`
    );
    window.sessionStorage.setItem(LOGOUT_TAB_RECORD_KEY, ID);
    const writes = recordCookieWrites();

    withdrawAnyCount();

    expect(writes).toEqual([]);
    expect(logoutDeadlineState(valuesOf(COOKIE.logoutPending), valuesOf(COOKIE.logoutDeadline))).toBe('settled');
    expect(window.sessionStorage.getItem(LOGOUT_TAB_RECORD_KEY)).toBe(ID);
  });

  it('does nothing outside the browser', () => {
    leaveCookie(COOKIE.logoutPending, ID);
    leaveCookie(COOKIE.logoutDeadline, ID);
    window.sessionStorage.setItem(LOGOUT_TAB_RECORD_KEY, ID);
    const writes = recordCookieWrites();
    vi.stubGlobal('document', undefined);

    withdrawAnyCount();

    vi.unstubAllGlobals();
    expect(writes).toEqual([]);
    expect(valuesOf(COOKIE.logoutPending)).toEqual([ID]);
    expect(window.sessionStorage.getItem(LOGOUT_TAB_RECORD_KEY)).toBe(ID);
  });
});

describe('LOGOUT_DEADLINE_SETTLED', () => {
  it('is a value never read as an id of a count', () => {
    expect(LOGOUT_DEADLINE_SETTLED).toBe('passed');
    expect(LOGOUT_DEADLINE_SETTLED).not.toMatch(ID_SHAPE);
  });
});

describe('settleLogoutDeadline', () => {
  describe.each(['document', 'navigation'] as const)("on '%s'", (trigger) => {
    it('discards the drafts once and removes every copy on the value the server settled', () => {
      leaveCookie(COOKIE.logoutPending, LOGOUT_DEADLINE_SETTLED);
      const discard = vi.fn();

      settleLogoutDeadline(discard, trigger);

      expect(discard).toHaveBeenCalledTimes(1);
      expect(valuesOf(COOKIE.logoutPending)).toEqual([]);
    });

    it('expires both names when two different ids are pending, and discards nothing', () => {
      // jsdom keeps one cookie per name for one host and path, so the two copies a parent domain makes possible are shown to the page by its getter.
      vi.spyOn(document, 'cookie', 'get').mockReturnValue(
        `${COOKIE.logoutPending}=${ID}; ${COOKIE.logoutPending}=${OTHER_ID}; ${COOKIE.logoutDeadline}=${ID}`
      );
      const writes = recordCookieWrites();
      const discard = vi.fn();

      settleLogoutDeadline(discard, trigger);

      expect(discard).not.toHaveBeenCalled();
      const written = writes.map(parseWritten);
      expect(written.map(({ name }) => name).sort()).toEqual([COOKIE.logoutDeadline, COOKIE.logoutPending].sort());
      for (const { attributes } of written) expect(attributes['max-age']).toBe('0');
    });

    it('leaves a count the browser has let run out for the server, and discards nothing', () => {
      leaveCookie(COOKIE.logoutPending, ID);
      const writes = recordCookieWrites();
      const discard = vi.fn();

      settleLogoutDeadline(discard, trigger);

      expect(discard).not.toHaveBeenCalled();
      expect(writes).toEqual([]);
      expect(valuesOf(COOKIE.logoutPending)).toEqual([ID]);
    });

    it('does nothing when there is no cookie', () => {
      const writes = recordCookieWrites();
      const discard = vi.fn();

      settleLogoutDeadline(discard, trigger);

      expect(discard).not.toHaveBeenCalled();
      expect(writes).toEqual([]);
    });
  });

  it('after a navigation, leaves a count still running, and discards nothing', () => {
    leaveCookie(COOKIE.logoutPending, ID);
    leaveCookie(COOKIE.logoutDeadline, ID);
    const discard = vi.fn();

    settleLogoutDeadline(discard, 'navigation');

    expect(discard).not.toHaveBeenCalled();
    expect(valuesOf(COOKIE.logoutPending)).toEqual([ID]);
    expect(valuesOf(COOKIE.logoutDeadline)).toEqual([ID]);
  });

  it('in a fresh document of the tab that wrote it, removes a count still running, and discards nothing', async () => {
    writeLogoutDeadline(30);
    vi.resetModules();
    const fresh = await import('./logoutDeadline');
    const discard = vi.fn();

    fresh.settleLogoutDeadline(discard, 'document');

    expect(discard).not.toHaveBeenCalled();
    expect(valuesOf(COOKIE.logoutPending)).toEqual([]);
    expect(valuesOf(COOKIE.logoutDeadline)).toEqual([]);
  });
});

describe('the tab that held the modal', () => {
  /** Import the module again, as a fresh document of the same tab does: this document's own count is forgotten, and `sessionStorage` is kept. */
  async function freshDocumentOfThisTab(): Promise<typeof LogoutDeadlineModule> {
    vi.resetModules();
    return import('./logoutDeadline');
  }

  /** Write a count, assert that the tab's record holds its id, and return the id. */
  function writeAndRecord(): string {
    writeLogoutDeadline(30);
    const [id] = valuesOf(COOKIE.logoutPending);
    expect(id).toMatch(ID_SHAPE);
    expect(window.sessionStorage.getItem(LOGOUT_TAB_RECORD_KEY), "the tab's record of its count").toBe(id);
    return id;
  }

  it('keeps the tab’s record under its own key', () => {
    expect(LOGOUT_TAB_RECORD_KEY).toBe('logout-deadline-tab');
  });

  it('a document that wrote the count and still holds it keeps both cookies on a document trigger, as a page restored from the back-forward cache runs it', () => {
    const id = writeAndRecord();
    const discard = vi.fn();

    settleLogoutDeadline(discard, 'document');

    expect(discard).not.toHaveBeenCalled();
    expect(valuesOf(COOKIE.logoutPending)).toEqual([id]);
    expect(valuesOf(COOKIE.logoutDeadline)).toEqual([id]);
    expect(window.sessionStorage.getItem(LOGOUT_TAB_RECORD_KEY)).toBe(id);
  });

  it('a fresh document of the same tab removes both cookies and the record', async () => {
    writeAndRecord();
    const fresh = await freshDocumentOfThisTab();
    const discard = vi.fn();

    fresh.settleLogoutDeadline(discard, 'document');

    expect(discard).not.toHaveBeenCalled();
    expect(valuesOf(COOKIE.logoutPending)).toEqual([]);
    expect(valuesOf(COOKIE.logoutDeadline)).toEqual([]);
    expect(window.sessionStorage.getItem(LOGOUT_TAB_RECORD_KEY)).toBeNull();
  });

  it.each([
    ['no record of a count', undefined],
    ['the record of another count', OTHER_ID]
  ])('a document of another tab, with %s, keeps both cookies', (_, record) => {
    leaveCookie(COOKIE.logoutPending, ID);
    leaveCookie(COOKIE.logoutDeadline, ID);
    if (record) window.sessionStorage.setItem(LOGOUT_TAB_RECORD_KEY, record);
    const discard = vi.fn();

    settleLogoutDeadline(discard, 'document');

    expect(discard).not.toHaveBeenCalled();
    expect(valuesOf(COOKIE.logoutPending)).toEqual([ID]);
    expect(valuesOf(COOKIE.logoutDeadline)).toEqual([ID]);
  });

  it('a count the browser has let run out is kept even by a fresh document of the tab that wrote it', async () => {
    const id = writeAndRecord();
    document.cookie = `${COOKIE.logoutDeadline}=; Path=/; Max-Age=0; SameSite=Lax`;
    const fresh = await freshDocumentOfThisTab();

    fresh.settleLogoutDeadline(vi.fn(), 'document');

    expect(valuesOf(COOKIE.logoutPending)).toEqual([id]);
  });

  it('clearLogoutDeadline in a document that did not write the pending id keeps both cookies', () => {
    leaveCookie(COOKIE.logoutPending, ID);
    leaveCookie(COOKIE.logoutDeadline, ID);

    clearLogoutDeadline();

    expect(valuesOf(COOKIE.logoutPending)).toEqual([ID]);
    expect(valuesOf(COOKIE.logoutDeadline)).toEqual([ID]);
  });

  it('clearLogoutDeadline in the document that wrote the count removes both cookies and the record', () => {
    writeAndRecord();

    clearLogoutDeadline();

    expect(valuesOf(COOKIE.logoutPending)).toEqual([]);
    expect(valuesOf(COOKIE.logoutDeadline)).toEqual([]);
    expect(window.sessionStorage.getItem(LOGOUT_TAB_RECORD_KEY)).toBeNull();
  });

  it('the settled marker is removed by any document, and the record goes with it', async () => {
    writeAndRecord();
    leaveCookie(COOKIE.logoutPending, LOGOUT_DEADLINE_SETTLED);
    const fresh = await freshDocumentOfThisTab();
    const discard = vi.fn();

    fresh.settleLogoutDeadline(discard, 'document');

    expect(discard).toHaveBeenCalledTimes(1);
    expect(valuesOf(COOKIE.logoutPending)).toEqual([]);
    expect(window.sessionStorage.getItem(LOGOUT_TAB_RECORD_KEY)).toBeNull();
  });
});
