/**
 * Instruments for the tests of the logout modal's two cookies: reading the strings the page assigns to `document.cookie`, recording them, and the tests of the page's removal at a host that is a domain name.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import { clearLogoutDeadline, cookieValues, withdrawAnyCount, writeLogoutDeadline } from './logoutDeadline';

/** Split a cookie string as the page writes it into its value and its attributes, attribute names lower-cased. */
export function parseWritten(written: string): { name: string; value: string; attributes: Record<string, string> } {
  const [pair, ...rest] = written.split(';').map((part) => part.trim());
  const [name, value] = pair.split('=');
  const attributes = Object.fromEntries(
    rest.map((part) => {
      const [key, attributeValue = ''] = part.split('=');
      return [key.toLowerCase(), attributeValue];
    })
  );
  return { name, value, attributes };
}

/** Record every string the page assigns to `document.cookie`, letting each assignment through. */
export function recordCookieWrites(): Array<string> {
  const writes: Array<string> = [];
  const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')!;
  vi.spyOn(document, 'cookie', 'set').mockImplementation((value: string) => {
    writes.push(value);
    descriptor.set!.call(document, value);
  });
  return writes;
}

/** A well-formed id of a count's opening. */
const ID = '0123456789abcdef0123456789abcdef';

const NAMES = [COOKIE.logoutPending, COOKIE.logoutDeadline];

/**
 * Describe the page's removal of the logout modal's two cookies in a document at a host that is a domain name: that the document runs at `origin`, that the modal's Continue expires both names host-only and for every domain, and that a Log out does so after copies of both names were planted for each.
 *
 * Vitest gives a test file one jsdom address, so each host has a file of its own that sets the address and calls this once.
 *
 * @param options.origin - The document's address, which the file's `@vitest-environment-options` line sets.
 * @param options.domains - The domains a removal names at this host besides the host-only copy, the host's own domain first.
 * @param options.hostKind - The kind of host, as the describe's title names it, such as `an apex host`.
 */
export function describeRemovalAt({
  origin,
  domains,
  hostKind
}: {
  origin: string;
  domains: ReadonlyArray<string>;
  hostKind: string;
}): void {
  const forEachDomain =
    domains.length === 1
      ? ` and for ${domains[0]}`
      : `, ${domains
          .slice(0, -1)
          .map((domain) => `for ${domain}`)
          .join(', ')} and for ${domains[domains.length - 1]}`;

  /** Put a copy of one of the two cookies into the jar, host-only or for a domain, as a page of some host of the site writes it. */
  function plantCopy(name: string, domain?: string): void {
    const domainAttribute = domain ? `; Domain=${domain}` : '';
    document.cookie = `${name}=${ID}; Path=/; Max-Age=3600; SameSite=Lax${domainAttribute}; Secure`;
  }

  /** Each expiry written for one name, as `host-only` or `Domain=<domain>`, in the order written. */
  function expiriesOf(writes: ReadonlyArray<string>, name: string): Array<string> {
    return writes
      .map(parseWritten)
      .filter((written) => written.name === name)
      .map(({ attributes }) => (attributes.domain === undefined ? 'host-only' : `Domain=${attributes.domain}`));
  }

  /** Assert that the writes expire each name host-only and once for every domain, every expiry with the attributes the page's writes carry, and that the jar keeps no copy of either name. */
  function expectEveryCopyExpired(writes: ReadonlyArray<string>): void {
    for (const name of NAMES) {
      expect(expiriesOf(writes, name), `the expiries written for ${name}`).toEqual([
        'host-only',
        ...domains.map((domain) => `Domain=${domain}`)
      ]);
    }
    for (const { value, attributes } of writes.map(parseWritten)) {
      expect(value).toBe('');
      expect(attributes['max-age']).toBe('0');
      expect(attributes.path).toBe('/');
      expect(attributes.samesite?.toLowerCase()).toBe('lax');
      expect(attributes).toHaveProperty('secure');
    }
    for (const name of NAMES) expect(cookieValues(document.cookie, name), `the copies of ${name} left`).toEqual([]);
  }

  afterEach(() => {
    clearLogoutDeadline();
    vi.restoreAllMocks();
    // A spy on both of `document.cookie`'s accessors leaves an own property behind when it is restored; removing it returns the document to `Document.prototype`'s cookie jar.
    Reflect.deleteProperty(document, 'cookie');
    for (const name of NAMES) {
      for (const domainAttribute of ['', ...domains.map((domain) => `; Domain=${domain}`)]) {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domainAttribute}; Secure`;
      }
    }
    window.sessionStorage.clear();
  });

  describe(`the page’s removal of the logout count at ${hostKind}`, () => {
    it(`runs at ${origin}/`, () => {
      expect(location.origin).toBe(origin);
    });

    it(`the modal’s Continue expires both names host-only${forEachDomain}, and leaves no copy`, () => {
      writeLogoutDeadline(30);
      for (const name of NAMES) expect(cookieValues(document.cookie, name), `${name} as written`).toHaveLength(1);
      const writes = recordCookieWrites();

      clearLogoutDeadline();

      expectEveryCopyExpired(writes);
    });

    it(`a Log out expires both names host-only${forEachDomain}, after copies were planted for each, and leaves no copy`, () => {
      for (const name of NAMES) {
        plantCopy(name);
        for (const domain of domains) plantCopy(name, domain);
        expect(cookieValues(document.cookie, name).length, `the copies of ${name} planted`).toBeGreaterThan(0);
      }
      const writes = recordCookieWrites();

      withdrawAnyCount();

      expectEveryCopyExpired(writes);
    });
  });
}
