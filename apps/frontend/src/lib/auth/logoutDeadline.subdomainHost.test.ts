// @vitest-environment-options {"url": "https://app.example.org/"}
/**
 * The page's removal of the logout modal's two cookies, run in a document at `https://app.example.org/`: the modal's Continue, which writes a count and withdraws it, and a Log out's `withdrawAnyCount`, after copies of both names are planted as another host of the site writes them. The host is a domain name under a parent domain, so a removal names the host's own domain and its parent besides the host-only copy, and each expiry the page writes is asserted one by one.
 */

import { describeRemovalAt } from './logoutDeadline.testUtils';

/** The document's address. */
const ORIGIN = 'https://app.example.org';

/** The domains a removal names at this host, besides the host-only copy. */
const DOMAINS = ['app.example.org', 'example.org'];

describeRemovalAt({ origin: ORIGIN, domains: DOMAINS, hostKind: 'a subdomain host' });
