// @vitest-environment-options {"url": "https://example.org/"}
/**
 * The page's removal of the logout modal's two cookies, run in a document at `https://example.org/`: the modal's Continue, which writes a count and withdraws it, and a Log out's `withdrawAnyCount`, after copies of both names are planted as another host of the site writes them. The host is a domain name, so a removal names the host's own domain besides the host-only copy, and each expiry the page writes is asserted one by one.
 */

import { describeRemovalAt } from './logoutDeadline.testUtils';

/** The document's address. */
const ORIGIN = 'https://example.org';

/** The domains a removal names at this host, besides the host-only copy. */
const DOMAINS = ['example.org'];

describeRemovalAt({ origin: ORIGIN, domains: DOMAINS, hostKind: 'an apex host' });
