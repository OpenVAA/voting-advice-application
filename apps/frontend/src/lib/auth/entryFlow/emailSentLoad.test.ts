/**
 * The universal load of the two "email sent" pages: a document request is redirected to the app's login screen, a client-side navigation is left to the page.
 */

import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { buildRoute } from '$lib/routes';
import { emailSentLoad } from './emailSentLoad';
import { load as adminLoad } from '../../../routes/admin/email-sent/+page';
import { load as contestantLoad } from '../../../routes/contestant/email-sent/+page';

/** What a call of the load threw, or `undefined` when it returned. */
function thrownBy(load: () => unknown): unknown {
  try {
    load();
  } catch (e) {
    return e;
  }
  return undefined;
}

describe('emailSentLoad', () => {
  it('redirects a request the server renders to the login screen, in the request locale', () => {
    const thrown = thrownBy(emailSentLoad({ loginRoute: 'ContestantAppLogin', inBrowser: () => false }));
    expect(isRedirect(thrown)).toBe(true);
    expect(thrown).toMatchObject({ status: 307, location: buildRoute({ route: 'ContestantAppLogin', locale: 'en' }) });
  });

  it('does nothing in the browser', () => {
    expect(thrownBy(emailSentLoad({ loginRoute: 'ContestantAppLogin', inBrowser: () => true }))).toBeUndefined();
  });

  it('reads where it runs on each call, not once when it is built', () => {
    let inBrowser = true;
    const load = emailSentLoad({ loginRoute: 'AdminAppLogin', inBrowser: () => inBrowser });
    expect(thrownBy(load)).toBeUndefined();
    inBrowser = false;
    expect(thrownBy(load)).toMatchObject({
      status: 307,
      location: buildRoute({ route: 'AdminAppLogin', locale: 'en' })
    });
  });
});

// The tests' stub of `$app/environment` reads as the server, as a document request does.
describe('the pages’ loads, as the server runs them', () => {
  it('the Contestant App leads to its login screen', () => {
    expect(thrownBy(contestantLoad)).toMatchObject({
      status: 307,
      location: buildRoute({ route: 'ContestantAppLogin', locale: 'en' })
    });
  });

  it('the Admin App leads to its login page', () => {
    expect(thrownBy(adminLoad)).toMatchObject({
      status: 307,
      location: buildRoute({ route: 'AdminAppLogin', locale: 'en' })
    });
  });
});
